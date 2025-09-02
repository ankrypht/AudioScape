/**
 * This file contains a custom React hook for initializing and configuring the
 * `react-native-track-player`. This setup is essential for the music player to function
 * correctly and should be run once when the app starts.
 */

import { useEffect, useRef } from "react";
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
} from "react-native-track-player";

/**
 * Sets up the `react-native-track-player` with the desired options and capabilities.
 * This function is called by the `useSetupTrackPlayer` hook.
 */
const setupPlayer = async () => {
  // Initialize the player with a max cache size.
  await TrackPlayer.setupPlayer({
    maxCacheSize: 1024 * 10, // 10 MB
  });

  // Configure the player's options.
  await TrackPlayer.updateOptions({
    android: {
      // Define the behavior when the app is killed.
      appKilledPlaybackBehavior:
        AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
    },
    // Define the capabilities of the player (i.e., what controls are available).
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.Stop,
      Capability.SeekTo,
      Capability.JumpForward,
      Capability.JumpBackward,
    ],
    // Define the capabilities available in the notification.
    notificationCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.Stop,
      Capability.SeekTo,
    ],
  });

  // Set the initial volume and repeat mode.
  await TrackPlayer.setVolume(1);
  await TrackPlayer.setRepeatMode(RepeatMode.Off);
};

/**
 * A custom hook that initializes the `react-native-track-player`.
 * It ensures that the setup is only run once.
 * @param onLoad An optional callback function to be executed when the player is successfully set up.
 */
export const useSetupTrackPlayer = ({ onLoad }: { onLoad?: () => void }) => {
  const isInitialized = useRef(false);

  useEffect(() => {
    // Prevent re-initialization.
    if (isInitialized.current) return;

    setupPlayer()
      .then(() => {
        isInitialized.current = true;
        onLoad?.(); // Call the onLoad callback if provided.
      })
      .catch((error) => {
        isInitialized.current = false;
        console.error("Error setting up track player:", error);
      });
  }, [onLoad]);
};
