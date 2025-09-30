/**
 * This Redux slice manages the application's music library state, including
 * favorite tracks, user-created playlists, and downloaded songs. It also handles
 * persistence of this data to the device's file system using `expo-file-system`.
 */

import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { useDispatch, useSelector } from "react-redux";
import { Platform } from "react-native";

/**
 * Defines the structure of the entire library state managed by Redux.
 */
export interface LibraryState {
  favoriteTracks: Song[];
  playlists: Record<string, Song[]>;
  downloadedTracks: DownloadedSongMetadata[];
  activeDownloads: Record<string, { song: Song; progress: number }>;
}

/**
 * Defines the metadata structure for a song that has been downloaded to the device.
 */
export interface DownloadedSongMetadata {
  id: string;
  title: string;
  artist: string;
  duration?: number; // Duration in seconds
  localTrackUri: string; // Local content:// URI for playback
  localArtworkUri?: string; // Optional: Local content:// URI for downloaded thumbnail
  downloadDate: string; // ISO date string
}

/**
 * The initial state for the library slice.
 */
const initialState: LibraryState = {
  favoriteTracks: [],
  playlists: {},
  downloadedTracks: [],
  activeDownloads: {},
};

// The absolute path to the JSON file where library data will be stored.
const dataFilePath = `${FileSystem.documentDirectory}libraryData.json`;

/**
 * Saves the current library state to a JSON file on the device's file system.
 * @param data - The `LibraryState` object to be saved.
 * @returns {Promise<void>} A promise that resolves when the data is saved.
 */
const saveToFile = async (data: LibraryState) => {
  try {
    const jsonData = JSON.stringify(data);
    await FileSystem.writeAsStringAsync(dataFilePath, jsonData);
  } catch (error) {
    console.error("Failed to save data:", error);
  }
};

/**
 * Ensures that the library data file exists. If it doesn't, it creates the file
 * with the `initialState` data.
 */
const ensureFileExists = async () => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(dataFilePath);
    if (!fileInfo.exists) {
      await saveToFile(initialState);
    }
  } catch (error) {
    console.error("Failed to ensure file existence:", error);
  }
};

const librarySlice = createSlice({
  name: "library",
  initialState,
  reducers: {
    /**
     * Toggles a song's favorite status. Adds to favorites if not present, removes if present.
     * @param state The current Redux state.
     * @param action The payload containing the `Song` to toggle.
     */
    toggleFavorite: (state, action: PayloadAction<Song>) => {
      const trackInfo = action.payload;
      const index = state.favoriteTracks.findIndex(
        (track) => track.id === trackInfo.id,
      );
      if (index !== -1) {
        state.favoriteTracks.splice(index, 1);
      } else {
        state.favoriteTracks.push(trackInfo);
      }
      saveToFile(state);
    },
    /**
     * Adds a track to a specified playlist. Creates the playlist if it doesn't exist.
     * @param state The current Redux state.
     * @param action The payload containing the `track` and `playlistName`.
     */
    addToPlaylist: (
      state,
      action: PayloadAction<{ track: Song; playlistName: string }>,
    ) => {
      const { track, playlistName } = action.payload;
      if (!state.playlists[playlistName]) {
        state.playlists[playlistName] = [];
      }
      if (!state.playlists[playlistName].some((t) => t.id === track.id)) {
        state.playlists[playlistName].push(track);
      }
      saveToFile(state);
    },
    /**
     * Removes a track from a specified playlist.
     * @param state The current Redux state.
     * @param action The payload containing the `trackId` and `playlistName`.
     */
    removeFromPlaylist: (
      state,
      action: PayloadAction<{ trackId: string; playlistName: string }>,
    ) => {
      const { trackId, playlistName } = action.payload;
      if (state.playlists[playlistName]) {
        state.playlists[playlistName] = state.playlists[playlistName].filter(
          (track) => track.id !== trackId,
        );
        saveToFile(state);
      }
    },
    /**
     * Creates a new playlist with an optional initial set of tracks.
     * @param state The current Redux state.
     * @param action The payload containing the `playlistName` and optional `tracks`.
     */
    createPlaylist: (
      state,
      action: PayloadAction<{ playlistName: string; tracks?: Song[] }>,
    ) => {
      const { playlistName, tracks = [] } = action.payload;
      if (!state.playlists[playlistName]) {
        state.playlists[playlistName] = tracks;
        saveToFile(state);
      }
    },
    /**
     * Deletes an existing playlist.
     * @param state The current Redux state.
     * @param action The payload containing the `playlistName` to delete.
     */
    deletePlaylist: (state, action: PayloadAction<string>) => {
      const playlistName = action.payload;
      if (state.playlists[playlistName]) {
        delete state.playlists[playlistName];
        saveToFile(state);
      }
    },
    /**
     * Sets the entire list of favorite tracks. Used for loading from storage.
     * @param state The current Redux state.
     * @param action The payload containing an array of `Song` objects.
     */
    setFavoriteTracks: (state, action: PayloadAction<Song[]>) => {
      state.favoriteTracks = action.payload;
    },
    /**
     * Sets the entire collection of playlists. Used for loading from storage.
     * @param state The current Redux state.
     * @param action The payload containing a record of playlist names to `Song` arrays.
     */
    setPlaylists: (state, action: PayloadAction<Record<string, Song[]>>) => {
      state.playlists = action.payload;
    },
    /**
     * Adds a downloaded track's metadata to the state. Updates if already exists.
     * @param state The current Redux state.
     * @param action The payload containing the `DownloadedSongMetadata`.
     */
    addDownloadedTrack: (
      state,
      action: PayloadAction<DownloadedSongMetadata>,
    ) => {
      const index = state.downloadedTracks.findIndex(
        (track) => track.id === action.payload.id,
      );
      if (index !== -1) {
        state.downloadedTracks[index] = action.payload;
      } else {
        state.downloadedTracks.push(action.payload);
      }
      saveToFile(state);
    },
    /**
     * Removes a downloaded track's metadata from the state.
     * @param state The current Redux state.
     * @param action The payload containing the `songId` to remove.
     */
    removeDownloadedTrack: (
      state,
      action: PayloadAction<string /* songId */>,
    ) => {
      state.downloadedTracks = state.downloadedTracks.filter(
        (track) => track.id !== action.payload,
      );
      saveToFile(state);
    },
    /**
     * Sets the entire list of downloaded tracks. Used for loading from storage.
     * @param state The current Redux state.
     * @param action The payload containing an array of `DownloadedSongMetadata`.
     */
    setDownloadedTracks: (
      state,
      action: PayloadAction<DownloadedSongMetadata[]>,
    ) => {
      state.downloadedTracks = action.payload;
    },
    /**
     * Sets the progress of an active song download.
     * @param state The current Redux state.
     * @param action The payload containing the `song` and its `progress`.
     */
    setSongDownloading: (
      state,
      action: PayloadAction<{ song: Song; progress: number }>,
    ) => {
      const { song, progress } = action.payload;
      state.activeDownloads[song.id] = { song, progress };
    },
    /**
     * Removes a song from the active downloads list.
     * @param state The current Redux state.
     * @param action The payload containing the `songId` to remove.
     */
    removeSongDownloading: (state, action: PayloadAction<string>) => {
      delete state.activeDownloads[action.payload];
    },
  },
});

// Export the action creators generated by createSlice.
export const {
  toggleFavorite,
  addToPlaylist,
  removeFromPlaylist,
  createPlaylist,
  deletePlaylist,
  setFavoriteTracks,
  setPlaylists,
  addDownloadedTrack,
  removeDownloadedTrack,
  setDownloadedTracks,
  setSongDownloading,
  removeSongDownloading,
} = librarySlice.actions;

// Export the reducer.
const libraryReducer = librarySlice.reducer;

// Configure the Redux store.
const store = configureStore({
  reducer: {
    library: libraryReducer,
  },
});

// Define RootState and AppDispatch types for type-safe Redux usage.
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

// Custom hooks for type-safe useDispatch and useSelector.
const useAppDispatch: () => AppDispatch = useDispatch;
const useAppSelector: <T>(selector: (state: RootState) => T) => T = useSelector;

/**
 * A custom hook to interact with favorite tracks in the Redux store.
 * @returns An object containing `favoriteTracks` and `toggleFavoriteTrack` function.
 */
export const useFavorites = () => {
  const favoriteTracks = useAppSelector(
    (state) => state.library.favoriteTracks,
  );
  const dispatch = useAppDispatch();

  const toggleFavoriteTrack = (trackInfo: Song) => {
    dispatch(toggleFavorite(trackInfo));
  };

  return { favoriteTracks, toggleFavoriteTrack };
};

/**
 * A custom hook to interact with playlists in the Redux store.
 * @returns An object containing `playlists` and functions to manage them.
 */
export const usePlaylists = () => {
  const playlists = useAppSelector((state) => state.library.playlists);
  const dispatch = useAppDispatch();

  const addTrackToPlaylist = (track: Song, playlistName: string) => {
    dispatch(addToPlaylist({ track, playlistName }));
  };

  const removeTrackFromPlaylist = (trackId: string, playlistName: string) => {
    dispatch(removeFromPlaylist({ trackId, playlistName }));
  };

  const createNewPlaylist = (playlistName: string, tracks?: Song[]) => {
    dispatch(createPlaylist({ playlistName, tracks }));
  };

  const deleteExistingPlaylist = (playlistName: string) => {
    dispatch(deletePlaylist(playlistName));
  };

  return {
    playlists,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    createNewPlaylist,
    deleteExistingPlaylist,
  };
};

/**
 * A custom hook to get all downloaded tracks from the Redux store.
 * @returns An array of `DownloadedSongMetadata`.
 */
export const useDownloadedTracks = () => {
  return useAppSelector((state) => state.library.downloadedTracks);
};

/**
 * A custom hook to check if a specific song is downloaded.
 * @param songId The ID of the song to check.
 * @returns A boolean indicating whether the song is downloaded.
 */
export const useIsSongDownloaded = (songId: string) => {
  const downloadedTracks = useAppSelector(
    (state) => state.library.downloadedTracks,
  );
  return downloadedTracks.some((track) => track.id === songId);
};

/**
 * A custom hook to check if a specific song is currently downloading.
 * @param songId The ID of the song to check
 * @returns True if the song is downloading, false otherwise.
 */
export const useIsSongDownloading = (songId: string) => {
  const downloadingTracks = useAppSelector(
    (state) => state.library.activeDownloads,
  );
  return Object.values(downloadingTracks).some(
    (download) => download.song.id === songId,
  );
};

/**
 * A custom hook to get the details of a specific downloaded song.
 * @param songId The ID of the song to get details for.
 * @returns The `DownloadedSongMetadata` object for the song, or `undefined` if not found.
 */
export const useDownloadedTrackDetails = (songId: string) => {
  const downloadedTracks = useAppSelector(
    (state) => state.library.downloadedTracks,
  );
  return downloadedTracks.find((track) => track.id === songId);
};

/**
 * A custom hook to get a list of currently active song downloads with their progress.
 * @returns An array of song objects with an added `progress` property.
 */
export const useActiveDownloads = () => {
  const activeDownloads = useAppSelector(
    (state) => state.library.activeDownloads,
  );
  return Object.values(activeDownloads).map(({ song, progress }) => ({
    ...song,
    progress,
  }));
};

/**
 * Loads the saved library data from the file system into the Redux store.
 * If loading fails, it initializes the state with empty arrays/objects.
 * @param dispatch The Redux dispatch function.
 */
const loadStoredData = async (dispatch: AppDispatch) => {
  try {
    const storedData = await FileSystem.readAsStringAsync(dataFilePath);
    const parsedData: LibraryState = JSON.parse(storedData);

    dispatch(setFavoriteTracks(parsedData.favoriteTracks || []));
    dispatch(setPlaylists(parsedData.playlists || {}));
    dispatch(setDownloadedTracks(parsedData.downloadedTracks || []));
  } catch (error) {
    console.error("Failed to load stored data:", error);
    // Initialize with empty state if loading fails or file is new/corrupt.
    dispatch(setFavoriteTracks(initialState.favoriteTracks));
    dispatch(setPlaylists(initialState.playlists));
    dispatch(setDownloadedTracks(initialState.downloadedTracks));
  }
};

/**
 * Initializes the music library by ensuring the data file exists and then loading
 * any previously saved data into the Redux store.
 */
export const initializeLibrary = async () => {
  await ensureFileExists();
  loadStoredData(store.dispatch);
};

/**
 * Exports the library data file (`libraryData.json`).
 * On Android, it uses the Storage Access Framework to allow the user to select a
 * directory to save the file. On iOS and other platforms, it uses the native
 * sharing UI.
 *
 * @returns {Promise<void>} A promise that resolves when the export action is
 *   completed or dismissed.
 */
export const exportLibraryData = async () => {
  if (Platform.OS === "android") {
    try {
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const data = await FileSystem.readAsStringAsync(dataFilePath);
        const uri = permissions.directoryUri;
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          uri,
          "libraryData.json",
          "application/json",
        );
        await FileSystem.writeAsStringAsync(fileUri, data);
        console.log("Library data exported successfully to:", fileUri);
      } else {
        console.log("File system permissions not granted.");
        // You might want to inform the user that permission is required.
      }
    } catch (err) {
      console.error("Error exporting library data on Android:", err);
      throw err; // Re-throw the error to be handled by the calling UI component
    }
  } else {
    // Fallback to original method for iOS and other platforms
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        console.error("Sharing is not available on this device.");
        // The UI component should handle this error.
        throw new Error("Sharing is not available on this device.");
      }

      await Sharing.shareAsync(dataFilePath, {
        mimeType: "application/json",
        dialogTitle: "Export Library Data",
        UTI: "public.json", // Uniform Type Identifier for JSON on iOS
      });
    } catch (error) {
      console.error("Error exporting library data:", error);
      throw error; // Re-throw for the UI component
    }
  }
};

/**
 * Imports library data from a user-selected JSON file. It merges the imported
 * `favoriteTracks` and `playlists` with the existing data, avoiding duplicates.
 * Data related to downloads is ignored as requested.
 *
 * @returns {Promise<void>} A promise that resolves when the import and data
 *   update process is complete.
 */
export const importLibraryData = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      // User cancelled the picker, so we do nothing.
      return;
    }

    const fileContent = await FileSystem.readAsStringAsync(
      result.assets[0].uri,
    );
    const importedData = JSON.parse(fileContent) as Partial<LibraryState>;

    // Ensure the library file exists before we try to read and merge.
    await ensureFileExists();
    const currentDataString = await FileSystem.readAsStringAsync(dataFilePath);
    const currentData = JSON.parse(currentDataString) as LibraryState;

    // Merge favorite tracks, avoiding duplicates.
    if (
      importedData.favoriteTracks &&
      Array.isArray(importedData.favoriteTracks)
    ) {
      const existingFavIds = new Set(
        currentData.favoriteTracks.map((t) => t.id),
      );
      const newFavorites = importedData.favoriteTracks.filter(
        (t) => t.id && !existingFavIds.has(t.id),
      );
      currentData.favoriteTracks.push(...newFavorites);
    }

    // Merge playlists, and tracks within playlists, avoiding duplicates.
    if (importedData.playlists && typeof importedData.playlists === "object") {
      for (const playlistName in importedData.playlists) {
        if (
          Object.prototype.hasOwnProperty.call(
            importedData.playlists,
            playlistName,
          )
        ) {
          const importedTracks = importedData.playlists[playlistName];

          if (Array.isArray(importedTracks)) {
            if (!currentData.playlists[playlistName]) {
              // If playlist doesn't exist locally, create it.
              currentData.playlists[playlistName] = importedTracks.filter(
                (t) => t.id,
              ); // Ensure tracks have IDs
            } else {
              // If playlist exists, merge tracks, avoiding duplicates.
              const existingTrackIds = new Set(
                currentData.playlists[playlistName].map((t) => t.id),
              );
              const newTracks = importedTracks.filter(
                (t) => t.id && !existingTrackIds.has(t.id),
              );
              currentData.playlists[playlistName].push(...newTracks);
            }
          }
        }
      }
    }

    // Save the newly merged data back to the file.
    await saveToFile(currentData);

    // Reload the data into the Redux store to reflect changes in the UI.
    await loadStoredData(store.dispatch);

    console.log("Library data imported successfully.");
    // Optionally, you can show a success message to the user.
    // alert("Library data imported successfully!");
  } catch (error) {
    console.error("Error importing library data:", error);
    // Optionally, you can show an error message to the user.
    // alert("An error occurred while importing library data.");
  }
};

export { store };
