/**
 * This file defines the background playback service for `react-native-track-player`.
 * It registers event listeners for remote control commands (e.g., from lock screen, headphones)
 * and maps them to corresponding TrackPlayer actions.
 */

import TrackPlayer, { Event } from "react-native-track-player";

/**
 * The playback service function that registers event listeners for remote control commands.
 * This function runs in a separate background thread managed by `react-native-track-player`.
 */
export const playbackService = async () => {
  // Listen for the "play" command from remote controls.
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  // Listen for the "pause" command from remote controls.
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  // Listen for the "stop" command from remote controls.
  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.stop();
  });

  // Listen for the "next track" command from remote controls.
  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    TrackPlayer.skipToNext();
  });

  // Listen for the "previous track" command from remote controls.
  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    TrackPlayer.skipToPrevious();
  });

  // Listen for the "seek to" command from remote controls.
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    TrackPlayer.seekTo(event.position);
  });

  // Listen for the "jump forward" command from remote controls.
  TrackPlayer.addEventListener(Event.RemoteJumpForward, async (event) => {
    TrackPlayer.seekBy(event.interval);
  });

  // Listen for the "jump backward" command from remote controls.
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async (event) => {
    TrackPlayer.seekBy(-event.interval);
  });
};
