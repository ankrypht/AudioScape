/**
 * This file contains a custom React hook for managing the repeat mode of the
 * `react-native-track-player`. It allows components to get and set the current repeat mode
 * (e.g., Off, Track, Queue).
 */

import { useCallback, useEffect, useState } from "react";
import TrackPlayer, { RepeatMode } from "react-native-track-player";

/**
 * A custom hook that manages the repeat mode of the track player.
 * It provides the current repeat mode and a function to change it.
 * @returns An object containing:
 * - `repeatMode`: The current `RepeatMode` of the player.
 * - `changeRepeatMode`: A function to change the player's repeat mode.
 */
export const useTrackPlayerRepeatMode = () => {
  // State to store the current repeat mode.
  const [repeatMode, setRepeatMode] = useState<RepeatMode>();

  /**
   * Changes the repeat mode of the track player.
   * @param newRepeatMode The new repeat mode to set.
   */
  const changeRepeatMode = useCallback(async (newRepeatMode: RepeatMode) => {
    // Set the repeat mode in the track player.
    await TrackPlayer.setRepeatMode(newRepeatMode);
    // Update the local state to reflect the change.
    setRepeatMode(newRepeatMode);
  }, []);

  // On initial render, get the current repeat mode from the track player.
  useEffect(() => {
    TrackPlayer.getRepeatMode().then(setRepeatMode);
  }, []);

  return { repeatMode, changeRepeatMode };
};
