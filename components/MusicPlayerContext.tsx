import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useRef,
  useCallback,
} from "react";
import { innertube, getInfo } from "@/services/youtube";
import TrackPlayer, {
  State,
  Track,
  useActiveTrack,
} from "react-native-track-player";
import { Helpers } from "youtubei.js";
import { Alert } from "react-native";
import { useNetInfo } from "@react-native-community/netinfo";
import { DownloadedSongMetadata } from "@/store/library";

// Interface for the Music Player Context
interface MusicPlayerContextType {
  isPlaying: boolean;
  isLoading: boolean;
  playAudio: (songToPlay: Song, playlist?: Song[]) => Promise<void>;
  playPlaylist: (songs: Song[]) => Promise<void>;
  playNext: (songs: Song[] | null) => Promise<void>;
  playDownloadedSong: (
    songToPlay: DownloadedSongMetadata,
    playlist?: DownloadedSongMetadata[],
  ) => Promise<void>;
  playAllDownloadedSongs: (songs: DownloadedSongMetadata[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(
  undefined,
);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const isValidUpNextItem = (
  item: Helpers.YTNode,
): item is Helpers.YTNode & { video_id: string } => {
  return "video_id" in item && typeof item.video_id === "string";
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
  }
  return context;
};

interface MusicPlayerProviderProps {
  children: ReactNode;
}

export const MusicPlayerProvider: React.FC<MusicPlayerProviderProps> = ({
  children,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const currentSongIdRef = useRef<string | null>(null);
  const activeTrack = useActiveTrack();
  const netInfo = useNetInfo();
  const backgroundQueueOperationsAbortControllerRef =
    useRef<AbortController | null>(null);

  const log = useCallback((message: string) => {
    console.log(`[MusicPlayer] ${message}`);
  }, []);

  const resetPlayerState = useCallback(async () => {
    log("Core Reset: TrackPlayer.reset() and clearing currentSongIdRef");
    await TrackPlayer.reset();
    currentSongIdRef.current = null;
  }, [log]);

  const addPlaylistTracksInBackground = useCallback(
    async (
      initialPlayedSong: Song,
      fullPlaylist: Song[],
      abortSignal: AbortSignal,
    ) => {
      const { id: initialPlayedSongId, title: initialPlayedSongTitle } =
        initialPlayedSong;
      log(
        `BG Queue (Online): Starting playlist addition for context of ${initialPlayedSongTitle}`,
      );

      try {
        const targetSongIndexInPlaylist = fullPlaylist.findIndex(
          (s) => s.id === initialPlayedSongId,
        );
        if (targetSongIndexInPlaylist === -1) {
          log(
            `BG Queue (Online): ${initialPlayedSongTitle} not found in playlist. Aborting background add.`,
          );
          return;
        }

        const addTrackToPlayerIfValid = async (
          songInfo: Song,
          position: "before" | "after",
        ) => {
          if (
            abortSignal.aborted ||
            currentSongIdRef.current !== initialPlayedSongId
          ) {
            log(
              `BG Queue (Online): Aborted or context changed before processing ${songInfo.title}.`,
            );
            return false;
          }
          try {
            const trackInfo = await getInfo(
              songInfo.id,
              songInfo.title,
              songInfo.artist,
            );
            if (
              abortSignal.aborted ||
              currentSongIdRef.current !== initialPlayedSongId
            ) {
              log(
                `BG Queue (Online): Aborted or context changed after fetching ${songInfo.title}.`,
              );
              return false;
            }
            if (trackInfo) {
              const queue = await TrackPlayer.getQueue();
              if (!queue.some((t) => t.id === trackInfo.id)) {
                if (position === "after") {
                  await TrackPlayer.add(trackInfo);
                  log(
                    `BG Queue (Online): Added (after ${initialPlayedSongTitle}): ${trackInfo.title}`,
                  );
                } else {
                  const indexOfPlayingTrack = queue.findIndex(
                    (t) => t.id === initialPlayedSongId,
                  );
                  if (indexOfPlayingTrack !== -1) {
                    await TrackPlayer.add(trackInfo, indexOfPlayingTrack);
                    log(
                      `BG Queue (Online): Added (before ${initialPlayedSongTitle}): ${trackInfo.title}`,
                    );
                  } else {
                    log(
                      `BG Queue (Online): Could not find ${initialPlayedSongTitle} to insert ${trackInfo.title} before. Adding to end.`,
                    );
                    await TrackPlayer.add(trackInfo);
                  }
                }
              } else {
                log(`BG Queue (Online): Skipped duplicate ${trackInfo.title}`);
              }
            }
          } catch (e) {
            log(
              `BG Queue (Online): Error processing ${songInfo.title} (${position} ${initialPlayedSongTitle}): ${e}`,
            );
          }
          return true;
        };

        const songsAfter = fullPlaylist.slice(targetSongIndexInPlaylist + 1);
        const songsBefore = fullPlaylist.slice(0, targetSongIndexInPlaylist);

        const addAfterTracks = async () => {
          for (const song of songsAfter) {
            if (!(await addTrackToPlayerIfValid(song, "after"))) return;
            await delay(150);
          }
        };

        const addBeforeTracks = async () => {
          for (const song of songsBefore) {
            if (!(await addTrackToPlayerIfValid(song, "before"))) return;
            await delay(150);
          }
        };

        if (
          abortSignal.aborted ||
          currentSongIdRef.current !== initialPlayedSongId
        ) {
          return;
        }

        await Promise.all([addAfterTracks(), addBeforeTracks()]);

        log(
          `BG Queue (Online): Finished playlist addition for ${initialPlayedSongTitle}`,
        );
      } catch (error) {
        log(
          `BG Queue (Online): Major error for ${initialPlayedSongTitle}: ${error}`,
        );
      }
    },
    [log],
  );

  const addDownloadedPlaylistTracksInBackground = useCallback(
    async (
      initialPlayedSong: DownloadedSongMetadata,
      fullPlaylist: DownloadedSongMetadata[],
      abortSignal: AbortSignal,
    ) => {
      const { id: initialPlayedSongId, title: initialPlayedSongTitle } =
        initialPlayedSong;
      log(
        `BG Queue (Downloaded): Starting playlist addition for context of ${initialPlayedSongTitle}`,
      );

      try {
        const targetSongIndexInPlaylist = fullPlaylist.findIndex(
          (s) => s.id === initialPlayedSongId,
        );
        if (targetSongIndexInPlaylist === -1) {
          log(
            `BG Queue (Downloaded): ${initialPlayedSongTitle} not found in playlist. Aborting background add.`,
          );
          return;
        }

        const addTrackToPlayerIfValid = async (
          songMeta: DownloadedSongMetadata,
          position: "before" | "after",
        ) => {
          if (
            abortSignal.aborted ||
            currentSongIdRef.current !== initialPlayedSongId
          ) {
            log(
              `BG Queue (Downloaded): Aborted or context changed before processing ${songMeta.title}.`,
            );
            return false;
          }
          const trackInfo: Track = {
            id: songMeta.id,
            url: songMeta.localTrackUri,
            title: songMeta.title,
            artist: songMeta.artist,
            artwork: songMeta.localArtworkUri,
            duration: songMeta.duration,
          };

          if (
            abortSignal.aborted ||
            currentSongIdRef.current !== initialPlayedSongId
          ) {
            log(
              `BG Queue (Downloaded): Aborted or context changed for ${songMeta.title}.`,
            );
            return false;
          }

          const queue = await TrackPlayer.getQueue();
          if (!queue.some((t) => t.id === trackInfo.id)) {
            if (position === "after") {
              await TrackPlayer.add(trackInfo);
              log(
                `BG Queue (Downloaded): Added (after ${initialPlayedSongTitle}): ${trackInfo.title}`,
              );
            } else {
              const indexOfPlayingTrack = queue.findIndex(
                (t) => t.id === initialPlayedSongId,
              );
              if (indexOfPlayingTrack !== -1) {
                await TrackPlayer.add(trackInfo, indexOfPlayingTrack);
                log(
                  `BG Queue (Downloaded): Added (before ${initialPlayedSongTitle}): ${trackInfo.title}`,
                );
              } else {
                log(
                  `BG Queue (Downloaded): Could not find ${initialPlayedSongTitle} to insert ${trackInfo.title} before. Adding to end.`,
                );
                await TrackPlayer.add(trackInfo);
              }
            }
          } else {
            log(`BG Queue (Downloaded): Skipped duplicate ${trackInfo.title}`);
          }
          return true;
        };

        const songsAfter = fullPlaylist.slice(targetSongIndexInPlaylist + 1);
        const songsBefore = fullPlaylist.slice(0, targetSongIndexInPlaylist);

        const addAfterTracks = async () => {
          for (const song of songsAfter) {
            if (!(await addTrackToPlayerIfValid(song, "after"))) return;
            await delay(50);
          }
        };

        const addBeforeTracks = async () => {
          for (const song of songsBefore) {
            if (!(await addTrackToPlayerIfValid(song, "before"))) return;
            await delay(50);
          }
        };

        if (
          abortSignal.aborted ||
          currentSongIdRef.current !== initialPlayedSongId
        )
          return;

        await Promise.all([addAfterTracks(), addBeforeTracks()]);

        log(
          `BG Queue (Downloaded): Finished playlist addition for ${initialPlayedSongTitle}`,
        );
      } catch (error) {
        log(
          `BG Queue (Downloaded): Major error for ${initialPlayedSongTitle}: ${error}`,
        );
      }
    },
    [log],
  );

  const addUpNextSongs = useCallback(
    async (songId: string, abortSignal: AbortSignal) => {
      log(`Up Next: Starting for ${songId}`);
      if (abortSignal.aborted) {
        log(`Up Next: Aborted at start for ${songId}.`);
        return;
      }

      try {
        const yt = await innertube;
        if (currentSongIdRef.current !== songId || abortSignal.aborted) {
          log(
            `Up Next: Aborted or song changed before API call for ${songId}.`,
          );
          return;
        }

        const upNextResponse = await yt.music.getUpNext(songId);

        if (abortSignal.aborted || currentSongIdRef.current !== songId) {
          log(`Up Next: Aborted or song changed after API call for ${songId}.`);
          return;
        }

        const upNext = upNextResponse?.contents;
        if (upNext && Array.isArray(upNext) && upNext.length > 0) {
          for (const item of upNext) {
            if (abortSignal.aborted || currentSongIdRef.current !== songId) {
              log(
                `Up Next: Aborted or song changed during loop for ${songId}.`,
              );
              break;
            }
            if (isValidUpNextItem(item)) {
              try {
                const queue = await TrackPlayer.getQueue();
                if (queue.some((track) => track.id === item.video_id)) {
                  log(
                    `Up Next: Skipping duplicate ${item.video_id} for ${songId}.`,
                  );
                  continue;
                }

                if (abortSignal.aborted || currentSongIdRef.current !== songId)
                  break;
                const info = await getInfo(item.video_id);

                if (abortSignal.aborted || currentSongIdRef.current !== songId)
                  break;
                if (info) {
                  await TrackPlayer.add(info);
                  log(`Up Next: Added ${info.title} for ${songId}.`);
                }
              } catch (e) {
                log(
                  `Up Next: Error processing item ${item.video_id} for ${songId}: ${e}`,
                );
              }
            }
            await delay(150);
          }
        }
      } catch (error) {
        log(`Up Next: Error for ${songId}: ${error}`);
      } finally {
        log(`Up Next: Finished process for ${songId}.`);
      }
    },
    [log],
  );

  const playAudio = async (songToPlay: Song, playlist?: Song[]) => {
    if (netInfo.isInternetReachable === false) {
      Alert.alert(
        "Network Error",
        "You are currently offline. Please connect to the internet to play songs.",
      );
      return;
    }
    try {
      log(
        `Play request: ${songToPlay.title}${
          playlist ? ` (in playlist of ${playlist.length} songs)` : ""
        }`,
      );
      setIsLoading(true);

      if (backgroundQueueOperationsAbortControllerRef.current) {
        log("Aborting previous background queue operation.");
        backgroundQueueOperationsAbortControllerRef.current.abort();
      }
      backgroundQueueOperationsAbortControllerRef.current =
        new AbortController();
      const currentAbortSignal =
        backgroundQueueOperationsAbortControllerRef.current.signal;

      await resetPlayerState();

      const targetSongInfo = await getInfo(
        songToPlay.id,
        songToPlay.title,
        songToPlay.artist,
      );

      if (currentAbortSignal.aborted) {
        log(`Playback for ${songToPlay.title} aborted during/after getInfo.`);
        setIsLoading(false);
        return;
      }

      if (!targetSongInfo) {
        Alert.alert(
          "Playback Error",
          `The song "${songToPlay.title}" is unavailable.\n\nPlease try restarting the app.`,
        );
        setIsLoading(false);
        return;
      }

      await TrackPlayer.add(targetSongInfo);
      await TrackPlayer.play();
      setIsPlaying(true);
      currentSongIdRef.current = targetSongInfo.id;
      log(`Playing: ${targetSongInfo.title}`);

      if (playlist && playlist.length > 0) {
        log(`Initiating background playlist addition for ${songToPlay.title}.`);
        addPlaylistTracksInBackground(
          songToPlay,
          playlist,
          currentAbortSignal,
        ).catch((e) =>
          log(`Error in detached addPlaylistTracksInBackground call: ${e}`),
        );
      } else if (playlist === undefined) {
        log(`No playlist context. Initiating up-next for ${songToPlay.title}.`);
        addUpNextSongs(songToPlay.id, currentAbortSignal).catch((e) =>
          log(`Error in detached addUpNextSongs call: ${e}`),
        );
      } else {
        log(
          `Empty playlist provided for ${songToPlay.title}. No further queue additions.`,
        );
      }
    } catch (error) {
      log(`Major error in playAudio for "${songToPlay.title}": ${error}`);
      Alert.alert(
        "Playback Error",
        `Failed to play "${songToPlay.title}". Please try again.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const playDownloadedSong = async (
    songToPlay: DownloadedSongMetadata,
    playlist?: DownloadedSongMetadata[],
  ) => {
    try {
      log(
        `Play downloaded: ${songToPlay.title}${
          playlist ? ` (in playlist of ${playlist.length})` : ""
        }`,
      );
      setIsLoading(true);

      if (backgroundQueueOperationsAbortControllerRef.current) {
        log(
          "Aborting previous background queue operation (for downloaded song).",
        );
        backgroundQueueOperationsAbortControllerRef.current.abort();
      }
      backgroundQueueOperationsAbortControllerRef.current =
        new AbortController();
      const currentAbortSignal =
        backgroundQueueOperationsAbortControllerRef.current.signal;

      await resetPlayerState();

      const targetTrack: Track = {
        id: songToPlay.id,
        url: songToPlay.localTrackUri,
        title: songToPlay.title,
        artist: songToPlay.artist,
        artwork: songToPlay.localArtworkUri,
        duration: songToPlay.duration,
      };

      if (currentAbortSignal.aborted) {
        log(
          `Playback for downloaded ${songToPlay.title} aborted before adding to player.`,
        );
        setIsLoading(false);
        return;
      }

      await TrackPlayer.add(targetTrack);
      await TrackPlayer.play();
      setIsPlaying(true);
      currentSongIdRef.current = targetTrack.id;
      log(`Playing downloaded: ${targetTrack.title}`);

      if (playlist && playlist.length > 0) {
        log(
          `Initiating background downloaded playlist addition for ${songToPlay.title}.`,
        );
        addDownloadedPlaylistTracksInBackground(
          songToPlay,
          playlist,
          currentAbortSignal,
        ).catch((e) =>
          log(
            `Error in detached addDownloadedPlaylistTracksInBackground call: ${e}`,
          ),
        );
      }
    } catch (error) {
      log(
        `Major error in playDownloadedSong for "${songToPlay.title}": ${error}`,
      );
      Alert.alert(
        "Playback Error",
        `Failed to play downloaded "${songToPlay.title}".`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const playPlaylist = async (songs: Song[]) => {
    log(`Play playlist request with ${songs.length} songs.`);
    if (!songs || songs.length === 0) {
      Alert.alert("Playback Error", "The playlist is empty.");
      return;
    }
    await playAudio(songs[0], songs);
  };

  const playAllDownloadedSongs = async (songs: DownloadedSongMetadata[]) => {
    log(`Play all downloaded with ${songs.length} songs.`);
    if (!songs || songs.length === 0) {
      Alert.alert("Playback Error", "Downloaded songs list is empty.");
      return;
    }
    await playDownloadedSong(songs[0], songs);
  };

  const playNext = async (songsToAdd: Song[] | null) => {
    if (!songsToAdd || songsToAdd.length === 0) {
      log("No songs for playNext");
      return;
    }
    try {
      const activeTrackIdFromHook = activeTrack?.id;

      let currentActivePlayerTrackIndex =
        await TrackPlayer.getActiveTrackIndex();
      let insertAtIndex: number | undefined;

      if (typeof currentActivePlayerTrackIndex === "number") {
        insertAtIndex = currentActivePlayerTrackIndex + 1;
      } else {
        // If no active track, or queue is empty, prepare to add to the end.
        // TrackPlayer.add with undefined insertBeforeIndex adds to the end.
        insertAtIndex = undefined;
      }

      for (const song of songsToAdd) {
        if (song.id === activeTrackIdFromHook) {
          // Check against the initially active track
          log(
            `PlayNext: Song "${song.title}" is (or was initially) the active track, skipping.`,
          );
          continue;
        }

        // Get fresh queue state for accurate duplicate check and removal index
        const currentQueue = await TrackPlayer.getQueue();
        const existingTrackIndex = currentQueue.findIndex(
          (t) => t.id === song.id,
        );

        if (existingTrackIndex !== -1) {
          log(
            `PlayNext: Removing ${song.title} from index ${existingTrackIndex} to re-add.`,
          );
          await TrackPlayer.remove(existingTrackIndex);
          if (
            insertAtIndex !== undefined &&
            existingTrackIndex < insertAtIndex
          ) {
            insertAtIndex--;
          }
        }

        const info = await getInfo(song.id, song.title, song.artist);
        if (info) {
          await TrackPlayer.add(info, insertAtIndex);
          log(
            `PlayNext: Added "${info.title}"${
              insertAtIndex !== undefined
                ? ` at index ${insertAtIndex}`
                : " to the end"
            }.`,
          );

          // If we inserted at a specific index (not at the end), increment for the next song.
          if (insertAtIndex !== undefined) {
            insertAtIndex++;
          }
          // If insertAtIndex was undefined, the next song will also be added to the new end.
        }
      }
    } catch (error) {
      log(`Error in playNext: ${error}`);
      Alert.alert("Playback Error", "Failed to queue next song(s).");
    }
  };

  const togglePlayPause = async () => {
    try {
      const playbackState = await TrackPlayer.getPlaybackState();
      const currentState = playbackState.state;

      if (currentState === State.Playing || currentState === State.Buffering) {
        await TrackPlayer.pause();
        setIsPlaying(false);
      } else {
        const queue = await TrackPlayer.getQueue();
        if (queue.length > 0) {
          await TrackPlayer.play();
          setIsPlaying(true);
        } else {
          Alert.alert("Playback Info", "Queue is empty.");
        }
      }
    } catch (error) {
      log(`Error togglePlayPause: ${error}`);
      Alert.alert("Playback Error", "Failed to toggle playback.");
    }
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        isPlaying,
        isLoading,
        playAudio,
        playPlaylist,
        playNext,
        playDownloadedSong,
        playAllDownloadedSongs,
        togglePlayPause,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};
