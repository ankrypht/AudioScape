/**
 * This file defines the `Lyrics` component, which displays a single line of song lyrics.
 * It dynamically highlights the current lyric line based on the playback seek time, providing
 * a synchronized karaoke-like experience.
 */

import React from "react";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  SharedValue,
} from "react-native-reanimated";
import { ScaledSheet } from "react-native-size-matters/extend";

// Define colors for active and inactive lyric lines.
const DARK_LYRICS_COLOR = "rgba(255,255,255, 0.4)";
const DEFAULT_COLOR = "#555555";

/**
 * @interface LyricsProps
 */
export interface LyricsProps {
  data: {
    text: string;
    startTime?: number;
    endTime?: number; // Optional: Added to track when a line ends
  };
  seekTime: SharedValue<number>; // Shared value representing the current playback time.
  nextLineStartTime?: number; // Optional: The start time of the next lyric line, used to determine the current line's end.
}

/**
 * `Lyrics` component displays a single lyric line.
 * It changes color based on whether the line is currently being sung.
 */
export default function Lyrics({
  data,
  seekTime,
  nextLineStartTime,
}: LyricsProps) {
  // Safely handle the startTime property with proper fallbacks.
  const startTime = data?.startTime ?? 0;

  // `useDerivedValue` is used to create a reactive value for the lyrics color.
  const lyricsColor = useDerivedValue(() => {
    // Safety check for data existence.
    if (!data || !data.text) {
      return DEFAULT_COLOR;
    }

    // Define a small threshold to account for timing inaccuracies.
    const thresholdInSeconds = 0.1; // 100ms

    // Determine when this line ends: either using the next line's start time, an explicit endTime,
    // or defaulting to 5 seconds after its own start time.
    const endTime = nextLineStartTime || data.endTime || startTime + 5;

    // Check if the current seekTime falls within the active range of this lyric line.
    if (
      seekTime.value >= startTime - thresholdInSeconds &&
      seekTime.value < endTime
    ) {
      // If active, animate the color to white.
      return withTiming("white", {
        duration: 100,
      });
    } else {
      // If not active, set the color to a darker, less prominent shade.
      return DARK_LYRICS_COLOR;
    }
  });

  // `useAnimatedStyle` applies the dynamically calculated color to the text.
  const lyricsStyle = useAnimatedStyle(() => {
    return {
      color: lyricsColor.value,
    };
  });

  // If no data or text is provided, render nothing.
  if (!data || !data.text) {
    return null;
  }

  return (
    <Animated.Text
      style={[styles.text, lyricsStyle]}
      key={`${startTime}-${data.text}`} // Unique key for list rendering.
    >
      {data.text}
    </Animated.Text>
  );
}

// Styles for the Lyrics component.
const styles = ScaledSheet.create({
  text: {
    fontWeight: "700",
    fontSize: "24@ms",
    paddingVertical: 9,
    textAlign: "center",
  },
});
