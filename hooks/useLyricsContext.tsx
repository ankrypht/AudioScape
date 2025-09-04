/**
 * This file defines a React Context and a custom hook for managing and providing
 * song lyrics throughout the application. It fetches synchronized lyrics from the `lrclib-api`
 * based on the currently active track and makes them available to any component wrapped
 * within the `LyricsProvider`.
 */

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  useTrackPlayerEvents,
  Event,
  useActiveTrack,
} from "react-native-track-player";
import { Client, Query } from "lrclib-api";

// Create a new client instance for the lyrics API.
const client = new Client();

/**
 * Represents a single line of a song's lyrics.
 */
export type LyricLine = {
  text: string;
  startTime?: number; // The time in seconds when the line should be displayed.
};

/**
 * Defines the shape of the data and functions provided by the LyricsContext.
 */
export type LyricsContextType = {
  lyrics: LyricLine[]; // The array of lyric lines for the current track.
  isFetchingLyrics: boolean; // A flag indicating if the lyrics are being fetched.
  heights: number[]; // An array to store the rendered height of each lyric line.
  updateHeight: (index: number, height: number) => void; // Function to update a specific line's height.
  resetHeights: (length: number) => void; // Function to reset the heights array.
};

// Create the React Context for the lyrics.
const LyricsContext = createContext<LyricsContextType | undefined>(undefined);

/**
 * A React component that provides the lyrics context to its children.
 * It fetches lyrics for the active track and manages the lyrics state.
 */
export const LyricsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);
  const [heights, setHeights] = useState<number[]>([]);
  const [lastLoadedTrackId, setLastLoadedTrackId] = useState<string | null>(
    null,
  );

  const activeTrack = useActiveTrack();
  const activeTrackIdRef = useRef(activeTrack?.id);
  activeTrackIdRef.current = activeTrack?.id;

  /**
   * Fetches lyrics for the currently active track.
   */
  const fetchLyrics = useCallback(async () => {
    const trackForFetch = activeTrack;
    if (!trackForFetch) return;

    // Avoid refetching if lyrics for the current track are already loaded.
    if (lastLoadedTrackId === trackForFetch.id) {
      return;
    }

    setLastLoadedTrackId(trackForFetch.id);
    setIsFetchingLyrics(true);

    try {
      if (trackForFetch.title && trackForFetch.artist) {
        const searchParams: Query = {
          track_name: trackForFetch.title,
          artist_name: trackForFetch.artist,
        };

        if (trackForFetch.duration !== undefined) {
          searchParams.duration = trackForFetch.duration * 1000; // Convert to milliseconds.
        }

        const syncedLyrics = await client.getSynced(searchParams);

        if (activeTrackIdRef.current === trackForFetch.id) {
          if (syncedLyrics && syncedLyrics.length > 0) {
            const sortedLyrics = [...syncedLyrics].sort(
              (a, b) => (a.startTime || 0) - (b.startTime || 0),
            );
            setLyrics(sortedLyrics);
            setHeights(new Array(sortedLyrics.length).fill(0));
          } else {
            setLyrics([{ text: "No lyrics available", startTime: 0 }]);
            setHeights([0]);
          }
        }
      } else {
        if (activeTrackIdRef.current === trackForFetch.id) {
          setLyrics([{ text: "No lyrics available", startTime: 0 }]);
          setHeights([0]);
        }
      }
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      if (activeTrackIdRef.current === trackForFetch.id) {
        setLyrics([{ text: "Error loading lyrics", startTime: 0 }]);
        setHeights([0]);
      }
    } finally {
      if (activeTrackIdRef.current === trackForFetch.id) {
        setIsFetchingLyrics(false);
      }
    }
  }, [activeTrack, lastLoadedTrackId]);

  /**
   * Updates the height of a specific lyric line at a given index.
   */
  const updateHeight = useCallback((index: number, height: number) => {
    setHeights((prevHeights) => {
      const newHeights = [...prevHeights];
      newHeights[index] = height;
      return newHeights;
    });
  }, []);

  /**
   * Resets the heights array to a new length, initialized with zeros.
   */
  const resetHeights = useCallback((length: number) => {
    setHeights(new Array(length).fill(0));
  }, []);

  // Fetch lyrics when the active track changes.
  useEffect(() => {
    if (activeTrack?.id && activeTrack.id !== lastLoadedTrackId) {
      fetchLyrics();
    }
  }, [activeTrack?.id, fetchLyrics, lastLoadedTrackId]);

  // Also fetch lyrics on the track change event for robustness.
  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
    if (event.type === Event.PlaybackActiveTrackChanged && event.track) {
      if (event.track.id !== lastLoadedTrackId) {
        await fetchLyrics();
      }
    }
  });

  const contextValue: LyricsContextType = {
    lyrics,
    isFetchingLyrics,
    heights,
    updateHeight,
    resetHeights,
  };

  return (
    <LyricsContext.Provider value={contextValue}>
      {children}
    </LyricsContext.Provider>
  );
};

/**
 * A custom hook to easily access the lyrics context.
 * Throws an error if used outside of a `LyricsProvider`.
 * @returns The lyrics context.
 */
export const useLyricsContext = () => {
  const context = useContext(LyricsContext);
  if (context === undefined) {
    throw new Error("useLyricsContext must be used within a LyricsProvider");
  }
  return context;
};
