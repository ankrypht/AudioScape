/**
 * This file defines the `PlayerProgressBar` component, which displays the current
 * playback progress of a song using a seekable slider. It also shows the elapsed, remaining,
 * and total time of the track.
 */

import { fontSize } from "@/constants/tokens";
import { Colors } from "@/constants/Colors";
import { formatSecondsToMinutes } from "@/helpers/miscellaneous";
import { defaultStyles } from "@/styles";
import { Text, View, ViewProps } from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";
import TrackPlayer, { useProgress } from "react-native-track-player";
import { ScaledSheet, moderateScale } from "react-native-size-matters/extend";

/**
 * `PlayerProgressBar` component.
 * Displays a seekable progress bar for the current track, along with time information.
 * @param {ViewProps} { style } Props for the container View.
 */
export const PlayerProgressBar = ({ style }: ViewProps) => {
  // Get current playback progress and duration amount from TrackPlayer.
  const { duration, position } = useProgress(250); // Update every 250ms.

  // Shared values for the slider's internal state, used with `react-native-reanimated`.
  const isSliding = useSharedValue(false);
  const progress = useSharedValue(0);
  const slidingValue = useSharedValue(0);
  const min = useSharedValue(0);
  const max = useSharedValue(1);

  // Format time values for display.
  const trackElapsedTime = formatSecondsToMinutes(position);
  const trackRemainingTime = formatSecondsToMinutes(duration - position);
  const trackDuration = formatSecondsToMinutes(duration);

  // Update progress and cache values only when the user is not actively sliding the bar.
  if (!isSliding.value) {
    progress.value = duration > 0 ? position / duration : 0;
  }

  return (
    <View style={style}>
      <Slider
        progress={progress} // Current playback progress (0-1).
        minimumValue={min} // Minimum value of the slider (0).
        maximumValue={max} // Maximum value of the slider (1).
        containerStyle={{
          height: moderateScale(5),
          borderRadius: 16,
        }}
        // Custom bubble to display the time when sliding.
        renderBubble={() => (
          <View style={styles.bubbleContainer}>
            <Text style={styles.bubbleText}>
              {formatSecondsToMinutes(slidingValue.value * duration)}
            </Text>
          </View>
        )}
        // Custom thumb for the slider.
        renderThumb={() => (
          <View
            style={{
              width: moderateScale(15),
              height: moderateScale(15),
              borderRadius: moderateScale(15) / 2,
              backgroundColor: "#fff",
            }}
          />
        )}
        theme={{
          minimumTrackTintColor: Colors.minimumTrackTintColor,
          maximumTrackTintColor: Colors.maximumTrackTintColor,
        }}
        // Callback when the user starts sliding the thumb.
        onSlidingStart={() => (isSliding.value = true)}
        // Callback during sliding, updates the `slidingValue` and seeks the track.
        onValueChange={async (value) => {
          slidingValue.value = value;
          await TrackPlayer.seekTo(value * duration);
        }}
        // Callback when the user releases the thumb after sliding.
        onSlidingComplete={async (value) => {
          // Only seek if the user was actually sliding.
          if (!isSliding.value) return;

          isSliding.value = false;

          await TrackPlayer.seekTo(value * duration);
        }}
      />

      {/* Display elapsed, remaining, and total time */}
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{trackElapsedTime}</Text>

        <Text style={styles.timeText}>
          {"-"} {trackRemainingTime} {"/"} {trackDuration}
        </Text>
      </View>
    </View>
  );
};

// Styles for the PlayerProgressBar component.
const styles = ScaledSheet.create({
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: "20@vs",
  },
  timeText: {
    ...defaultStyles.text,
    color: Colors.text,
    fontSize: fontSize.xs,
    letterSpacing: 0.7,
    fontWeight: "500",
  },
  bubbleContainer: {
    backgroundColor: "transparent",
    alignItems: "flex-end",
    width: 67.5,
  },
  bubbleText: {
    color: Colors.text,
    fontWeight: "500",
  },
});
