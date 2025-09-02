/**
 * This file defines the `MusicPlayerContext` and `MusicPlayerProvider`,
 * which encapsulate the core logic for music playback within the application.
 * It manages the state of the music player, handles interactions with `react-native-track-player`,
 * fetches song information, manages playlists (both online and downloaded), and handles network status.
 */

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

/**
 * Defines the shape of the context provided by `MusicPlayerProvider`.
 * It exposes playback state and functions to control music playback.
 */
export interface MusicPlayerContextType {
  isPlaying: boolean; // Indicates if a song is currently playing.
  isLoading: boolean; // Indicates if the player is currently loading a song.
  playAudio: (songToPlay: Song, playlist?: Song[]) => Promise<void>; // Plays an online song, optionally within a playlist.
  playPlaylist: (songs: Song[]) => Promise<void>; // Plays a list of online songs.
  playNext: (songs: Song[] | null) => Promise<void>; // Adds songs to the "Play Next" queue.
  playDownloadedSong: (
    songToPlay: DownloadedSongMetadata,
    playlist?: DownloadedSongMetadata[],
  ) => Promise<void>; // Plays a downloaded song, optionally within a playlist.
  playAllDownloadedSongs: (songs: DownloadedSongMetadata[]) => Promise<void>; // Plays a list of downloaded songs.
  togglePlayPause: () => Promise<void>; // Toggles the play/pause state of the current song.
}

// Create the React Context for the music player.
const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(
  undefined,
);

/**
 * Helper function to create a delay.
 * @param ms The number of milliseconds to delay.
 * @returns A Promise that resolves after the specified delay.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Type guard to check if an item from YouTube's "Up Next" list is a valid video item.
 * @param item The item to check.
 * @returns True if the item has a `video_id` property, false otherwise.
 */
const isValidUpNextItem = (
  item: Helpers.YTNode,
): item is Helpers.YTNode & { video_id: string } => {
  return "video_id" in item && typeof item.video_id === "string";
};

/**
 * A custom hook to consume the `MusicPlayerContext`.
 * Throws an error if used outside of a `MusicPlayerProvider`.
 * @returns The `MusicPlayerContextType` object.
 */
export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
  }
  return context;
};

/**
 * Props for the `MusicPlayerProvider` component.
 */
export interface MusicPlayerProviderProps {
  children: ReactNode;
}

/**
 * Provides the music player context to its children.
 * Manages playback state, interacts with `react-native-track-player`, and handles
 * fetching and queuing of songs (both online and downloaded).
 */
export const MusicPlayerProvider: React.FC<MusicPlayerProviderProps> = ({
  children,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Ref to keep track of the currently playing song's ID.
  const currentSongIdRef = useRef<string | null>(null);
  const activeTrack = useActiveTrack();
  const netInfo = useNetInfo();
  // Ref to manage aborting background queue operations.
  const backgroundQueueOperationsAbortControllerRef =
    useRef<AbortController | null>(null);

  /**
   * Memoized logging function for consistent output.
   * @param message - The message to log.
   */
  const log = useCallback((message: string) => {
    console.log(`[MusicPlayer] ${message}`);
  }, []);

  /**
   * Resets the TrackPlayer state and clears the current song ID reference.
   * @returns {Promise<void>} A promise that resolves when the player state is reset.
   */
  const resetPlayerState = useCallback(async () => {
    log("Core Reset: TrackPlayer.reset() and clearing currentSongIdRef");
    await TrackPlayer.reset();
    currentSongIdRef.current = null;
  }, [log]);

  /**
   * Adds online songs to the TrackPlayer queue in the background, relative to the initial played song.
   * This helps in pre-loading the playlist around the currently playing track.
   * @param initialPlayedSong - The song that was initially played to set the context.
   * @param fullPlaylist - The complete list of songs in the playlist.
   * @param abortSignal - An AbortSignal to cancel the background operation.
   */
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

        /**
         * Helper to add a track to the player queue if it's valid and not already present.
         * @param songInfo - The song to add.
         * @param position - Whether to add the song "before" or "after" the initial played song.
         * @returns {Promise<boolean>} True if the track was processed (added or skipped as duplicate), false if aborted.
         */
        const addTrackToPlayerIfValid = async (
          songInfo: Song,
          position: "before" | "after",
        ) => {
          // Check for abortion or context change before fetching info.
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
            // Fetch detailed track info from YouTube.
            const trackInfo = await getInfo(
              songInfo.id,
              songInfo.title,
              songInfo.artist,
            );
            // Check for abortion or context change after fetching info.
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
              // Only add if not already in queue.
              if (!queue.some((t) => t.id === trackInfo.id)) {
                if (position === "after") {
                  await TrackPlayer.add(trackInfo);
                  log(
                    `BG Queue (Online): Added (after ${initialPlayedSongTitle}): ${trackInfo.title}`,
                  );
                } else {
                  // Insert before the currently playing track.
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

        // Split playlist into songs before and after the initial played song.
        const songsAfter = fullPlaylist.slice(targetSongIndexInPlaylist + 1);
        const songsBefore = fullPlaylist.slice(0, targetSongIndexInPlaylist);

        // Functions to add tracks sequentially with a small delay.
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

        // Check for abortion before starting parallel additions.
        if (
          abortSignal.aborted ||
          currentSongIdRef.current !== initialPlayedSongId
        ) {
          return;
        }

        // Run additions in parallel.
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

  /**
   * Adds downloaded songs to the TrackPlayer queue in the background.
   * Similar to `addPlaylistTracksInBackground` but for local files.
   * @param initialPlayedSong The downloaded song that was initially played.
   * @param fullPlaylist The complete list of downloaded songs in the playlist.
   * @param abortSignal An AbortSignal to cancel the background operation.
   */
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

        /**
         * Helper to add a downloaded track to the player queue if it's valid and not already present.
         * @param songMeta - The downloaded song metadata to add.
         * @param position - Whether to add the song "before" or "after" the initial played song.
         * @returns {Promise<boolean>} True if the track was processed (added or skipped as duplicate), false if aborted.
         */
        const addTrackToPlayerIfValid = async (
          songMeta: DownloadedSongMetadata,
          position: "before" | "after",
        ) => {
          // Check for abortion or context change.
          if (
            abortSignal.aborted ||
            currentSongIdRef.current !== initialPlayedSongId
          ) {
            log(
              `BG Queue (Downloaded): Aborted or context changed before processing ${songMeta.title}.`,
            );
            return false;
          }
          // Construct a TrackPlayer Track object from downloaded song metadata.
          const trackInfo: Track = {
            id: songMeta.id,
            url: songMeta.localTrackUri,
            title: songMeta.title,
            artist: songMeta.artist,
            artwork: songMeta.localArtworkUri,
            duration: songMeta.duration,
          };

          // Re-check for abortion or context change.
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
          // Only add if not already in queue.
          if (!queue.some((t) => t.id === trackInfo.id)) {
            if (position === "after") {
              await TrackPlayer.add(trackInfo);
              log(
                `BG Queue (Downloaded): Added (after ${initialPlayedSongTitle}): ${trackInfo.title}`,
              );
            } else {
              // Insert before the currently playing track.
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

        // Split playlist into songs before and after the initial played song.
        const songsAfter = fullPlaylist.slice(targetSongIndexInPlaylist + 1);
        const songsBefore = fullPlaylist.slice(0, targetSongIndexInPlaylist);

        // Functions to add tracks sequentially with a small delay.
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

        // Check for abortion before starting parallel additions.
        if (
          abortSignal.aborted ||
          currentSongIdRef.current !== initialPlayedSongId
        )
          return;

        // Run additions in parallel.
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

  /**
   * Fetches and adds "Up Next" songs from YouTube to the TrackPlayer queue.
   * This is typically called when a single song is played without a predefined playlist.
   * @param songId The ID of the song for which to fetch "Up Next" suggestions.
   * @param abortSignal An AbortSignal to cancel the operation.
   */
  const addUpNextSongs = useCallback(
    async (songId: string, abortSignal: AbortSignal) => {
      log(`Up Next: Starting for ${songId}`);
      if (abortSignal.aborted) {
        log(`Up Next: Aborted at start for ${songId}.`);
        return;
      }

      try {
        const yt = await innertube;
        // Check for abortion or song change before API call.
        if (currentSongIdRef.current !== songId || abortSignal.aborted) {
          log(
            `Up Next: Aborted or song changed before API call for ${songId}.`,
          );
          return;
        }

        const upNextResponse = await yt.music.getUpNext(songId);

        // Check for abortion or song change after API call.
        if (abortSignal.aborted || currentSongIdRef.current !== songId) {
          log(`Up Next: Aborted or song changed after API call for ${songId}.`);
          return;
        }

        const upNext = upNextResponse?.contents;
        if (upNext && Array.isArray(upNext) && upNext.length > 0) {
          for (const item of upNext) {
            // Check for abortion or song change during loop.
            if (abortSignal.aborted || currentSongIdRef.current !== songId) {
              log(
                `Up Next: Aborted or song changed during loop for ${songId}.`,
              );
              break;
            }
            if (isValidUpNextItem(item)) {
              try {
                const queue = await TrackPlayer.getQueue();
                // Skip if already in queue.
                if (queue.some((track) => track.id === item.video_id)) {
                  log(
                    `Up Next: Skipping duplicate ${item.video_id} for ${songId}.`,
                  );
                  continue;
                }

                // Re-check before fetching info.
                if (abortSignal.aborted || currentSongIdRef.current !== songId)
                  break;
                const info = await getInfo(item.video_id);

                // Re-check before adding to player.
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
            await delay(150); // Small delay to prevent overwhelming the API/player.
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

  /**
   * Plays an online song. If a playlist is provided, it will also queue the rest of the playlist
   * in the background. If no playlist, it will fetch and queue "Up Next" suggestions.
   * @param songToPlay The `Song` object to play.
   * @param playlist An optional array of `Song` objects representing the full playlist.
   */
  const playAudio = async (songToPlay: Song, playlist?: Song[]) => {
    // Check for internet connectivity.
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

      // Abort any previous background queue operations.
      if (backgroundQueueOperationsAbortControllerRef.current) {
        log("Aborting previous background queue operation.");
        backgroundQueueOperationsAbortControllerRef.current.abort();
      }
      // Create a new AbortController for the current playback session.
      backgroundQueueOperationsAbortControllerRef.current =
        new AbortController();
      const currentAbortSignal =
        backgroundQueueOperationsAbortControllerRef.current.signal;

      // Reset the TrackPlayer queue.
      await resetPlayerState();

      // Get detailed info for the target song.
      const targetSongInfo = await getInfo(
        songToPlay.id,
        songToPlay.title,
        songToPlay.artist,
      );

      // Check if the operation was aborted during getInfo.
      if (currentAbortSignal.aborted) {
        log(`Playback for ${songToPlay.title} aborted during/after getInfo.`);
        setIsLoading(false);
        return;
      }

      // Handle cases where song info cannot be retrieved.
      if (!targetSongInfo) {
        Alert.alert(
          "Playback Error",
          `The song "${songToPlay.title}" is unavailable.\n\nPlease try restarting the app.`,
        );
        setIsLoading(false);
        return;
      }

      // Add and play the song.
      await TrackPlayer.add(targetSongInfo);
      await TrackPlayer.play();
      setIsPlaying(true);
      currentSongIdRef.current = targetSongInfo.id;
      log(`Playing: ${targetSongInfo.title}`);

      // If a playlist is provided, add remaining tracks in background.
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
        // If no playlist, fetch and add "Up Next" suggestions.
        log(`No playlist context. Initiating up-next for ${songToPlay.title}.`);
        addUpNextSongs(songToPlay.id, currentAbortSignal).catch((e) =>
          log(`Error in detached addUpNextSongs call: ${e}`),
        );
      } else {
        // Empty playlist provided, no further queue additions.
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

  /**
   * Plays a downloaded song. If a playlist of downloaded songs is provided,
   * it will queue the rest of the playlist in the background.
   * @param songToPlay The `DownloadedSongMetadata` object to play.
   * @param playlist An optional array of `DownloadedSongMetadata` objects representing the full playlist.
   */
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

      // Abort any previous background queue operations.
      if (backgroundQueueOperationsAbortControllerRef.current) {
        log(
          "Aborting previous background queue operation (for downloaded song).",
        );
        backgroundQueueOperationsAbortControllerRef.current.abort();
      }
      // Create a new AbortController for the current playback session.
      backgroundQueueOperationsAbortControllerRef.current =
        new AbortController();
      const currentAbortSignal =
        backgroundQueueOperationsAbortControllerRef.current.signal;

      // Reset the TrackPlayer queue.
      await resetPlayerState();

      // Construct a TrackPlayer Track object from the downloaded song metadata.
      const targetTrack: Track = {
        id: songToPlay.id,
        url: songToPlay.localTrackUri,
        title: songToPlay.title,
        artist: songToPlay.artist,
        artwork: songToPlay.localArtworkUri,
        duration: songToPlay.duration,
      };

      // Check if the operation was aborted before adding to player.
      if (currentAbortSignal.aborted) {
        log(
          `Playback for downloaded ${songToPlay.title} aborted before adding to player.`,
        );
        setIsLoading(false);
        return;
      }

      // Add and play the downloaded song.
      await TrackPlayer.add(targetTrack);
      await TrackPlayer.play();
      setIsPlaying(true);
      currentSongIdRef.current = targetTrack.id;
      log(`Playing downloaded: ${targetTrack.title}`);

      // If a playlist is provided, add remaining downloaded tracks in background.
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

  /**
   * Plays an entire playlist of online songs, starting with the first song.
   * @param songs An array of `Song` objects representing the playlist.
   */
  const playPlaylist = async (songs: Song[]) => {
    log(`Play playlist request with ${songs.length} songs.`);
    if (!songs || songs.length === 0) {
      Alert.alert("Playback Error", "The playlist is empty.");
      return;
    }
    await playAudio(songs[0], songs);
  };

  /**
   * Plays an entire playlist of downloaded songs, starting with the first song.
   * @param songs An array of `DownloadedSongMetadata` objects representing the playlist.
   */
  const playAllDownloadedSongs = async (songs: DownloadedSongMetadata[]) => {
    log(`Play all downloaded with ${songs.length} songs.`);
    if (!songs || songs.length === 0) {
      Alert.alert("Playback Error", "Downloaded songs list is empty.");
      return;
    }
    await playDownloadedSong(songs[0], songs);
  };

  /**
   * Adds a list of songs to the TrackPlayer queue, prioritizing insertion after the current track.
   * Handles removing duplicates and fetching song info.
   * @param songsToAdd An array of `Song` objects to add to the queue.
   */
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

      // Determine the insertion index: after the current track, or at the end if no active track.
      if (typeof currentActivePlayerTrackIndex === "number") {
        insertAtIndex = currentActivePlayerTrackIndex + 1;
      } else {
        insertAtIndex = undefined; // Adds to the end.
      }

      for (const song of songsToAdd) {
        // Skip if the song is already the active track.
        if (song.id === activeTrackIdFromHook) {
          log(
            `PlayNext: Song "${song.title}" is (or was initially) the active track, skipping.`,
          );
          continue;
        }

        // Get fresh queue state to check for duplicates and adjust insertion index if needed.
        const currentQueue = await TrackPlayer.getQueue();
        const existingTrackIndex = currentQueue.findIndex(
          (t) => t.id === song.id,
        );

        // If the song already exists in the queue, remove it to re-add at the desired position.
        if (existingTrackIndex !== -1) {
          log(
            `PlayNext: Removing ${song.title} from index ${existingTrackIndex} to re-add.`,
          );
          await TrackPlayer.remove(existingTrackIndex);
          // Adjust insert index if the removed track was before the current insert point.
          if (
            insertAtIndex !== undefined &&
            existingTrackIndex < insertAtIndex
          ) {
            insertAtIndex--;
          }
        }

        // Fetch detailed song information.
        const info = await getInfo(song.id, song.title, song.artist);
        if (info) {
          // Add the song to the queue at the calculated index.
          await TrackPlayer.add(info, insertAtIndex);
          log(
            `PlayNext: Added "${info.title}"${
              insertAtIndex !== undefined
                ? ` at index ${insertAtIndex}`
                : " to the end"
            }.`,
          );

          // Increment insert index for the next song if inserting sequentially.
          if (insertAtIndex !== undefined) {
            insertAtIndex++;
          }
        }
      }
    } catch (error) {
      log(`Error in playNext: ${error}`);
      Alert.alert("Playback Error", "Failed to queue next song(s).");
    }
  };

  /**
   * Toggles the play/pause state of the current song.
   */
  const togglePlayPause = async () => {
    try {
      const playbackState = await TrackPlayer.getPlaybackState();
      const currentState = playbackState.state;

      // If currently playing or buffering, pause the player.
      if (currentState === State.Playing || currentState === State.Buffering) {
        await TrackPlayer.pause();
        setIsPlaying(false);
      } else {
        // If paused or stopped, check if there are songs in the queue and play.
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
