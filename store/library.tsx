import { createSlice, configureStore, PayloadAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import * as FileSystem from "expo-file-system";

interface LibraryState {
  favoriteTracks: Song[];
  playlists: Record<string, Song[]>;
  downloadedTracks: DownloadedSongMetadata[];
  activeDownloads: Record<string, { song: Song; progress: number }>;
}

export interface DownloadedSongMetadata {
  id: string;
  title: string;
  artist: string;
  duration?: number; // Duration in seconds
  localTrackUri: string; // Local content:// URI for playback (from MediaLibrary)
  mediaLibraryAssetId: string; // MediaLibrary asset ID for the song file
  localArtworkUri?: string; // Optional: Local content:// URI for downloaded thumbnail
  downloadDate: string; // ISO date string
}

const initialState: LibraryState = {
  favoriteTracks: [],
  playlists: {},
  downloadedTracks: [],
  activeDownloads: {},
};

// Path to store the data file
const dataFilePath = `${FileSystem.documentDirectory}libraryData.json`;

const saveToFile = async (data: LibraryState) => {
  try {
    const jsonData = JSON.stringify(data);
    await FileSystem.writeAsStringAsync(dataFilePath, jsonData);
  } catch (error) {
    console.error("Failed to save data:", error);
  }
};

// Check if the file exists, and if not, create it with initial state
const ensureFileExists = async () => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(dataFilePath);
    if (!fileInfo.exists) {
      // Create file with initial state if it doesn't exist
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
      saveToFile(state); // Save to file after updating state
    },
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
      saveToFile(state); // Save to file after updating state
    },
    removeFromPlaylist: (
      state,
      action: PayloadAction<{ trackId: string; playlistName: string }>,
    ) => {
      const { trackId, playlistName } = action.payload;
      if (state.playlists[playlistName]) {
        state.playlists[playlistName] = state.playlists[playlistName].filter(
          (track) => track.id !== trackId,
        );
        saveToFile(state); // Save to file after updating state
      }
    },
    createPlaylist: (
      state,
      action: PayloadAction<{ playlistName: string; tracks?: Song[] }>,
    ) => {
      const { playlistName, tracks = [] } = action.payload;
      if (!state.playlists[playlistName]) {
        state.playlists[playlistName] = tracks;
        saveToFile(state); // Save to file after updating state
      }
    },
    deletePlaylist: (state, action: PayloadAction<string>) => {
      const playlistName = action.payload;
      if (state.playlists[playlistName]) {
        delete state.playlists[playlistName];
        saveToFile(state); // Save to file after updating state
      }
    },
    setFavoriteTracks: (state, action: PayloadAction<Song[]>) => {
      state.favoriteTracks = action.payload;
    },
    setPlaylists: (state, action: PayloadAction<Record<string, Song[]>>) => {
      state.playlists = action.payload;
    },
    addDownloadedTrack: (
      state,
      action: PayloadAction<DownloadedSongMetadata>,
    ) => {
      // Avoid duplicates, or update if already exists
      const index = state.downloadedTracks.findIndex(
        (track) => track.id === action.payload.id,
      );
      if (index !== -1) {
        state.downloadedTracks[index] = action.payload; // Update existing
      } else {
        state.downloadedTracks.push(action.payload); // Add new
      }
      saveToFile(state);
    },
    removeDownloadedTrack: (
      state,
      action: PayloadAction<string /* songId */>,
    ) => {
      state.downloadedTracks = state.downloadedTracks.filter(
        (track) => track.id !== action.payload,
      );
      saveToFile(state);
    },
    setDownloadedTracks: (
      state,
      action: PayloadAction<DownloadedSongMetadata[]>,
    ) => {
      state.downloadedTracks = action.payload;
    },
    setSongDownloading: (
      state,
      action: PayloadAction<{ song: Song; progress: number }>,
    ) => {
      const { song, progress } = action.payload;
      state.activeDownloads[song.id] = { song, progress };
    },
    removeSongDownloading: (state, action: PayloadAction<string>) => {
      delete state.activeDownloads[action.payload];
    },
  },
});

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
const libraryReducer = librarySlice.reducer;

const store = configureStore({
  reducer: {
    library: libraryReducer,
  },
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

const useAppDispatch: () => AppDispatch = useDispatch;
const useAppSelector: <T>(selector: (state: RootState) => T) => T = useSelector;

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
export const useDownloadedTracks = () => {
  return useAppSelector((state) => state.library.downloadedTracks);
};

export const useIsSongDownloaded = (songId: string) => {
  const downloadedTracks = useAppSelector(
    (state) => state.library.downloadedTracks,
  );
  return downloadedTracks.some((track) => track.id === songId);
};

export const useDownloadedTrackDetails = (songId: string) => {
  const downloadedTracks = useAppSelector(
    (state) => state.library.downloadedTracks,
  );
  return downloadedTracks.find((track) => track.id === songId);
};

export const useActiveDownloads = () => {
  const activeDownloads = useAppSelector(
    (state) => state.library.activeDownloads,
  );
  return Object.values(activeDownloads).map(({ song, progress }) => ({
    ...song,
    progress,
  }));
};

// Load data from file system
const loadStoredData = async (dispatch: AppDispatch) => {
  try {
    const storedData = await FileSystem.readAsStringAsync(dataFilePath);
    const parsedData: LibraryState = JSON.parse(storedData);

    dispatch(setFavoriteTracks(parsedData.favoriteTracks || []));
    dispatch(setPlaylists(parsedData.playlists || {}));
    dispatch(setDownloadedTracks(parsedData.downloadedTracks || []));
  } catch (error) {
    console.error("Failed to load stored data:", error);
    // Initialize with empty state if loading fails or file is new/corrupt
    dispatch(setFavoriteTracks(initialState.favoriteTracks));
    dispatch(setPlaylists(initialState.playlists));
    dispatch(setDownloadedTracks(initialState.downloadedTracks));
  }
};

export const initializeLibrary = async () => {
  await ensureFileExists(); // Ensure the file exists before loading data
  loadStoredData(store.dispatch);
};

export { store };
