/**
 * This file manages the downloading and local storage of songs and their artwork.
 * It handles file system operations, sends download
 * progress notifications, and updates the Redux store to reflect the state of downloaded tracks.
 */

import {
  addDownloadedTrack,
  DownloadedSongMetadata,
  removeDownloadedTrack,
  removeSongDownloading,
  setSongDownloading,
  store,
} from "@/store/library";
import * as FileSystem from "expo-file-system";
import * as Notifications from "expo-notifications";
import { ToastAndroid } from "react-native";

/**
 * Defines the structure for a song object that is available for download.
 */
export interface RemoteSong {
  id: string;
  url: string;
  title: string;
  artist: string;
  duration?: number;
  thumbnailUrl?: string;
  mimeType?: string; // e.g., "audio/mp4", "audio/mpeg"
}

// Folder names within the app's document directory.
const ARTWORK_FOLDER = "Artworks";
const SONGS_FOLDER = "Songs";

/**
 * Attempts to determine a file extension from a URL or an explicit MIME type.
 * @param url - The URL of the content.
 * @param explicitMimeType - An optional, explicitly provided MIME type.
 * @returns A file extension string (e.g., 'mp3', 'm4a', 'jpg').
 */
const getFileExtensionFromUrlOrMime = (
  url: string,
  explicitMimeType?: string,
): string => {
  let mimeType = explicitMimeType;

  // Attempt to extract MIME type from URL parameters if not explicitly provided.
  if (!mimeType) {
    try {
      const urlObj = new URL(url);
      const mimeParam = urlObj.searchParams.get("mime");
      if (mimeParam) {
        mimeType = mimeParam;
      }
    } catch (e) {
      console.warn("Could not parse URL to find mime type:", e);
    }
  }

  // Determine extension based on MIME type.
  if (mimeType) {
    if (mimeType.includes("audio/mp4") || mimeType.includes("audio/aac"))
      return "m4a";
    if (mimeType.includes("audio/mpeg")) return "mp3";
    if (mimeType.includes("audio/ogg")) return "ogg";
    if (mimeType.includes("audio/wav")) return "wav";
    if (mimeType.includes("audio/webm")) return "webm";
    if (mimeType.includes("image/jpeg")) return "jpg";
    if (mimeType.includes("image/png")) return "png";
    if (mimeType.includes("image/webp")) return "webp";
  }

  // As a fallback, try to extract the extension from the URL path.
  try {
    const path = new URL(url).pathname;
    const lastDot = path.lastIndexOf(".");
    if (lastDot !== -1) {
      const ext = path.substring(lastDot + 1).toLowerCase();
      if (
        [
          "mp3",
          "m4a",
          "aac",
          "ogg",
          "wav",
          "webm",
          "jpg",
          "jpeg",
          "png",
          "webp",
        ].includes(ext)
      ) {
        return ext;
      }
    }
  } catch (e) {
    console.warn("Could not parse URL to find file extension:", e);
  }

  // If still unknown, make a final guess based on URL content or default.
  if (url.includes("audio")) return "mp3";
  if (url.includes("image") || explicitMimeType?.includes("image"))
    return "jpg";

  console.warn(
    `Could not determine specific file extension for URL: ${url} (MIME: ${
      mimeType || "unknown"
    }). Defaulting based on content.`,
  );
  return explicitMimeType?.startsWith("image/") ? "jpg" : "mp3";
};

const NOTIFICATION_CHANNEL_ID = "download_channel_audioscape";

/**
 * Sets up the notification channel for download notifications on Android.
 * This should be called once when the app initializes.
 */
export async function setupNotificationChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: "Download Notifications",
    importance: Notifications.AndroidImportance.LOW, // Use LOW to avoid sound/vibration for progress updates.
  });
  console.log("Notification channel for downloads set up.");
}

/**
 * Requests notification permissions from the user.
 * @returns A promise that resolves to true if permissions are granted, false otherwise.
 */
export async function requestAppNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    console.warn("Notification permissions not granted.");
    return false;
  }
  return true;
}

/**
 * Downloads a song and its artwork, saves them to the local file system,
 * and updates the Redux store with the song's metadata.
 * @param song The RemoteSong object to download.
 * @returns A promise that resolves to the metadata of the downloaded song, or null if the download fails.
 */
export const downloadAndSaveSong = async (
  song: RemoteSong,
): Promise<DownloadedSongMetadata | null> => {
  const hasNotificationPermissions = await requestAppNotificationPermissions();

  const {
    id,
    url: remoteTrackUrl,
    title,
    artist,
    duration,
    thumbnailUrl: remoteArtworkUrl,
    mimeType: explicitMimeType,
  } = song;

  // Check if the song is already downloaded.
  const existingDownload = getDownloadedSongMetadataById(id);
  if (existingDownload) {
    console.log(`Song "${title}" is already downloaded.`);
    return existingDownload;
  }

  ToastAndroid.show("Song download started", ToastAndroid.SHORT);

  const notificationId = `download_song_${id}`;

  const trackFileExtension = getFileExtensionFromUrlOrMime(
    remoteTrackUrl,
    explicitMimeType,
  );
  const artworkFileExtension = getFileExtensionFromUrlOrMime(
    remoteArtworkUrl || "",
    "image/jpeg",
  );

  const trackFileName = `${id}.${trackFileExtension}`;
  const artworkFileNameInDocs = `artwork_${id}.${artworkFileExtension}`;

  const tempTrackUriInCache = (FileSystem.cacheDirectory || "") + trackFileName;
  let tempArtworkUriInCache: string | undefined = remoteArtworkUrl
    ? (FileSystem.cacheDirectory || "") + `temp_${artworkFileNameInDocs}`
    : undefined;

  const finalArtworkUriInDocs = remoteArtworkUrl
    ? `${FileSystem.documentDirectory}${ARTWORK_FOLDER}/${artworkFileNameInDocs}`
    : undefined;
  const finalTrackUriInDocs = `${FileSystem.documentDirectory}${SONGS_FOLDER}/${trackFileName}`;

  // Set up notification handler and schedule initial notification.
  if (hasNotificationPermissions) {
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: `Downloading: ${title}`,
        body: "Starting download...",
        sticky: true,
        data: { songId: id },
      },
      trigger: { channelId: NOTIFICATION_CHANNEL_ID },
    }).catch((e) =>
      console.warn("Failed to schedule initial notification:", e),
    );
  }

  let lastNotifiedProgressPercent = -1;

  // Callback to handle download progress updates.
  const downloadProgressCallback = (
    downloadProgress: FileSystem.DownloadProgressData,
  ) => {
    const progress =
      downloadProgress.totalBytesWritten /
      downloadProgress.totalBytesExpectedToWrite;
    const progressPercent = Math.round(progress * 100);

    // Throttle notifications to only update when the percentage changes.
    if (progressPercent > lastNotifiedProgressPercent) {
      lastNotifiedProgressPercent = progressPercent;

      // Dispatch progress to Redux store.
      store.dispatch(
        setSongDownloading({
          song: {
            id: song.id,
            title: song.title,
            artist: song.artist,
            thumbnail: song.thumbnailUrl ?? "https://placehold.co/50",
          },
          progress: progressPercent,
        }),
      );

      // Update the persistent notification with the new progress.
      if (hasNotificationPermissions) {
        (async () => {
          try {
            await Notifications.scheduleNotificationAsync({
              identifier: notificationId,
              content: {
                title: `Downloading: ${title}`,
                body: `Progress: ${progressPercent}%`,
                sticky: true,
              },
              trigger: { channelId: NOTIFICATION_CHANNEL_ID },
            });
          } catch (e) {
            console.warn("Failed to update progress notification:", e);
          }
        })();
      }
    }
  };

  try {
    console.log(`Starting audio download for: ${title} (as ${trackFileName})`);

    // Create and start the track download.
    const trackDownloadResumable = await FileSystem.createDownloadResumable(
      remoteTrackUrl,
      tempTrackUriInCache,
      {},
      downloadProgressCallback,
    );
    const trackDownloadResult = await trackDownloadResumable.downloadAsync();

    if (!trackDownloadResult || trackDownloadResult.status !== 200) {
      console.error("Failed to download track:", trackDownloadResult);
      if (trackDownloadResult?.uri)
        await FileSystem.deleteAsync(trackDownloadResult.uri, {
          idempotent: true,
        });
      throw new Error(
        `Failed to download track: ${title}. Status: ${trackDownloadResult?.status}`,
      );
    }
    console.log(
      "Track downloaded to temporary cache location:",
      trackDownloadResult.uri,
    );

    // Download and save artwork if a URL is provided.
    let storedArtworkPath: string | undefined = undefined;
    if (remoteArtworkUrl && tempArtworkUriInCache && finalArtworkUriInDocs) {
      console.log(`Starting artwork download for: ${title}`);
      const artworkDownloadResumable = await FileSystem.createDownloadResumable(
        remoteArtworkUrl,
        tempArtworkUriInCache,
        {},
      );
      const artworkDownloadResult =
        await artworkDownloadResumable.downloadAsync();

      if (artworkDownloadResult && artworkDownloadResult.status === 200) {
        console.log(
          "Artwork downloaded to temporary cache location:",
          artworkDownloadResult.uri,
        );
        // Ensure the artwork directory exists.
        const artworkDir = `${FileSystem.documentDirectory}${ARTWORK_FOLDER}`;
        const dirInfo = await FileSystem.getInfoAsync(artworkDir);
        if (!dirInfo.exists) {
          console.log(`Creating artwork directory: ${artworkDir}`);
          await FileSystem.makeDirectoryAsync(artworkDir, {
            intermediates: true,
          });
        }
        // Move artwork from cache to permanent storage.
        await FileSystem.moveAsync({
          from: artworkDownloadResult.uri,
          to: finalArtworkUriInDocs,
        });
        storedArtworkPath = finalArtworkUriInDocs;
        console.log("Artwork saved to document directory:", storedArtworkPath);
      } else {
        console.warn(
          "Failed to download artwork. Result:",
          artworkDownloadResult,
        );
        if (artworkDownloadResult?.uri) {
          await FileSystem.deleteAsync(artworkDownloadResult.uri, {
            idempotent: true,
          });
        }
      }
    }

    // Ensure the songs directory exists.
    const songsDir = `${FileSystem.documentDirectory}${SONGS_FOLDER}`;
    const songsDirInfo = await FileSystem.getInfoAsync(songsDir);
    if (!songsDirInfo.exists) {
      console.log(`Creating songs directory: ${songsDir}`);
      await FileSystem.makeDirectoryAsync(songsDir, {
        intermediates: true,
      });
    }

    // Move track from cache to permanent storage.
    await FileSystem.moveAsync({
      from: trackDownloadResult.uri,
      to: finalTrackUriInDocs,
    });
    console.log("Track saved to document directory:", finalTrackUriInDocs);

    // Prepare the metadata for the downloaded song.
    const metadata: DownloadedSongMetadata = {
      id,
      title,
      artist,
      duration,
      localTrackUri: finalTrackUriInDocs,
      localArtworkUri: storedArtworkPath,
      downloadDate: new Date().toISOString(),
    };

    // Show a completion notification.
    if (hasNotificationPermissions) {
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: "Download Complete",
          body: `${title} has been successfully downloaded.`,
          sticky: false,
        },
        trigger: { channelId: NOTIFICATION_CHANNEL_ID },
      }).catch((e) =>
        console.warn("Failed to schedule completion notification:", e),
      );
    }

    // Add the track to the Redux store.
    store.dispatch(addDownloadedTrack(metadata));
    console.log(`Successfully processed: ${title}.`);
    return metadata;
  } catch (error) {
    console.error(`Error during download for ${title}:`, error);

    // Show a failure notification.
    if (hasNotificationPermissions) {
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: "Download Failed",
          body: `Could not download ${title}.`,
          sticky: false,
        },
        trigger: { channelId: NOTIFICATION_CHANNEL_ID },
      }).catch((e) =>
        console.warn("Failed to schedule error notification:", e),
      );
    }

    // Clean up any temporary files.
    await FileSystem.deleteAsync(tempTrackUriInCache, {
      idempotent: true,
    }).catch((e) => console.warn("Cleanup error for temp track in cache:", e));
    if (tempArtworkUriInCache) {
      const tempArtworkInfo = await FileSystem.getInfoAsync(
        tempArtworkUriInCache,
      ).catch(() => ({ exists: false }));
      if (tempArtworkInfo.exists) {
        await FileSystem.deleteAsync(tempArtworkUriInCache, {
          idempotent: true,
        }).catch((e) =>
          console.warn("Cleanup error for temp artwork in cache:", e),
        );
      }
    }

    alert(`Failed to download ${title}`);
    return null;
  } finally {
    // Always remove the song from the "downloading" state in Redux.
    store.dispatch(removeSongDownloading(id));
  }
};

/**
 * Retrieves the metadata for all downloaded songs from the Redux store.
 * @returns An array of DownloadedSongMetadata objects.
 */
export const getAllDownloadedSongsMetadata = (): DownloadedSongMetadata[] => {
  const state = store.getState();
  return state.library?.downloadedTracks || [];
};

/**
 * Retrieves the metadata for a specific downloaded song by its ID.
 * @param songId The ID of the song.
 * @returns The DownloadedSongMetadata object for the song, or undefined if not found.
 */
export const getDownloadedSongMetadataById = (
  songId: string,
): DownloadedSongMetadata | undefined => {
  const downloadedSongs = getAllDownloadedSongsMetadata();
  return downloadedSongs.find((s) => s.id === songId);
};

/**
 * Deletes a downloaded song from the file system and Redux store.
 * @param songId The ID of the song to remove.
 * @returns A promise that resolves to true if the deletion was successful, false otherwise.
 */
export const removeDownloadedSong = async (
  songId: string,
): Promise<boolean> => {
  try {
    const songToRemove = getDownloadedSongMetadataById(songId);
    if (!songToRemove) {
      console.log("Song not found in metadata, cannot remove:", songId);
      return true; // Already removed, so consider it a success.
    }

    // Delete the local track file.
    if (songToRemove.localTrackUri) {
      console.log("Deleting local track:", songToRemove.localTrackUri);
      await FileSystem.deleteAsync(songToRemove.localTrackUri, {
        idempotent: true,
      }).catch((e) => {
        console.warn(
          `Failed to delete local track ${songToRemove.localTrackUri}:`,
          e,
        );
      });
    }

    // Delete the local artwork file.
    if (songToRemove.localArtworkUri) {
      console.log("Deleting local artwork:", songToRemove.localArtworkUri);
      await FileSystem.deleteAsync(songToRemove.localArtworkUri, {
        idempotent: true,
      }).catch((e) => {
        console.warn(
          `Failed to delete local artwork ${songToRemove.localArtworkUri}:`,
          e,
        );
      });
    }

    // Remove the track from the Redux store.
    store.dispatch(removeDownloadedTrack(songId));
    console.log("Dispatched removeDownloadedTrack for song:", songId);
    return true;
  } catch (e) {
    console.error(`Failed to remove downloaded song ${songId}:`, e);
    alert(String(e));
    return false;
  }
};

/**
 * Checks if a song is downloaded by looking for it in the Redux store.
 * @param id The ID of the song to check.
 * @returns True if the song is downloaded, false otherwise.
 */
export const isSongDownloaded = (id: string): boolean => {
  const state = store.getState();
  return state.library.downloadedTracks.some((track) => track.id === id);
};

/**
 * Checks if a song is currently downloading by looking for it in the Redux store.
 * @param id The ID of the song to check.
 * @returns True if the song is downloading, false otherwise.
 */
export const isSongDownloading = (id: string): boolean => {
  const state = store.getState();
  return Object.values(state.library.activeDownloads).some(
    (download) => download.song.id === id,
  );
};
