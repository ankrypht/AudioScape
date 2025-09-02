/**
 * This file contains a custom React hook that keeps track of the last active track
 * in the music player. This is useful for scenarios where you need to reference the previously
 * playing track even after the player has stopped and the active track becomes undefined.
 */

import { useEffect, useState } from "react";
import { Track, useActiveTrack } from "react-native-track-player";

/**
 * A custom hook that returns the last track that was active in the player.
 * It listens for changes in the active track and stores the last valid track object.
 * @returns The last active `Track` object, or `undefined` if no track has been active yet.
 */
export const useLastActiveTrack = () => {
  // Get the currently active track from the track player.
  const activeTrack = useActiveTrack();
  // State to store the last active track.
  const [lastActiveTrack, setLastActiveTrack] = useState<Track>();

  useEffect(() => {
    // If there is a new active track, update the last active track state.
    if (activeTrack) {
      setLastActiveTrack(activeTrack);
    }
  }, [activeTrack]); // This effect runs whenever the active track changes.

  // Return the last active track. This will persist even when `activeTrack` becomes undefined.
  return lastActiveTrack;
};
