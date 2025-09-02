/**
 * This file contains a custom React hook for logging various states and events
 * from the `react-native-track-player`. This is primarily a debugging tool to help monitor
 * the player's behavior during development.
 */

import { Event, useTrackPlayerEvents } from "react-native-track-player";

// An array of track player events that we want to listen to.
const events = [
  Event.PlaybackState, // Fired when the playback state changes (e.g., playing, paused).
  Event.PlaybackError, // Fired when an error occurs during playback.
  Event.PlaybackActiveTrackChanged, // Fired when the active track changes.
];

/**
 * A custom hook that logs key events from the `react-native-track-player`.
 * This hook does not return any value and is used for its side effects (logging).
 */
export const useLogTrackPlayerState = () => {
  // The `useTrackPlayerEvents` hook registers a listener for the specified events.
  useTrackPlayerEvents(events, async (event) => {
    switch (event.type) {
      // Log an error when a playback error event occurs.
      case Event.PlaybackError:
        console.warn("An error occurred: ", event);
        break;
      // Log the new playback state.
      case Event.PlaybackState:
        console.log("Playback state: ", event.state);
        break;
      // Log the index of the new active track.
      case Event.PlaybackActiveTrackChanged:
        console.log("Track changed to index:", event.index);
        break;
    }
  });
};
