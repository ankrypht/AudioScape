/**
 * This file defines the `FloatingPlayer` component, a mini-player that appears
 * at the bottom of the screen to provide quick access to playback controls and track information.
 * It displays the currently active or last active track and allows navigation to the full player screen.
 *
 * @packageDocumentation
 */

import { MovingText } from "@/components/MovingText";
import {
  PlayPauseButton,
  SkipToNextButton,
  SkipToPreviousButton,
} from "@/components/PlayerControls";
import { triggerHaptic } from "@/helpers/haptics";
import { useImageColors } from "@/hooks/useImageColors";
import { useLastActiveTrack } from "@/hooks/useLastActiveTrack";
import FastImage from "@d11/react-native-fast-image";
import color from "color";
import { useRouter } from "expo-router";
import { TouchableOpacity, View, ViewProps } from "react-native";
import { ScaledSheet, moderateScale } from "react-native-size-matters/extend";
import { useActiveTrack } from "react-native-track-player";

/**
 * `FloatingPlayer` component displays a compact music player at the bottom of the screen.
 * It shows the current track's artwork, title, artist, and basic playback controls.
 * @param {ViewProps} { style } Props for the container View.
 */
export const FloatingPlayer = ({ style }: ViewProps) => {
  // Hook to get the last active track, useful when no track is currently playing.
  const lastActiveTrack = useLastActiveTrack();
  // Hook to get the currently active track from `react-native-track-player`.
  const activeTrack = useActiveTrack();
  // Hook to extract dominant colors from the track's artwork.
  const { imageColors } = useImageColors(
    activeTrack?.artwork ?? "https://placehold.co/50",
  );

  // Determine the dominant color for the player's background.
  const dominantColor = activeTrack ? imageColors?.dominant : "#101010";
  // Darken the dominant color for a subtle background effect.
  const darkerColor =
    dominantColor === "#101010"
      ? "#101010"
      : color(dominantColor).darken(0.5).hex();

  const router = useRouter();

  // Prioritize the active track; if none, use the last active track.
  const displayedTrack = activeTrack ?? lastActiveTrack;

  /**
   * Handles the press event on the floating player, navigating to the full player screen.
   */
  const handlePress = () => {
    triggerHaptic();
    router.navigate("/player");
  };

  // If no track is available to display, render nothing.
  if (!displayedTrack) return null;

  return (
    <View style={[styles.container, { backgroundColor: darkerColor }, style]}>
      <TouchableOpacity onPress={handlePress} style={styles.touchableArea}>
        {/* Track artwork */}
        <FastImage
          source={{
            uri: displayedTrack.artwork,
            priority: FastImage.priority.high,
          }}
          style={styles.trackArtworkImage}
        />

        {/* Track title and artist, using MovingText for marquee effect */}
        <View style={styles.trackTitleContainer}>
          <MovingText
            style={styles.trackTitle}
            text={displayedTrack.title ?? ""}
            animationThreshold={18}
          />
          <MovingText
            style={styles.trackArtist}
            text={displayedTrack.artist ?? ""}
            animationThreshold={48}
          />
        </View>
      </TouchableOpacity>

      {/* Playback controls */}
      <TouchableOpacity style={styles.trackControlsContainer}>
        <SkipToPreviousButton iconSize={moderateScale(25)} />
        <PlayPauseButton iconSize={moderateScale(25)} />
        <SkipToNextButton iconSize={moderateScale(25)} />
      </TouchableOpacity>
    </View>
  );
};

// Styles for the FloatingPlayer component.
const styles = ScaledSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: "8@s",
    paddingVertical: "8@vs",
    borderRadius: 12,
  },
  touchableArea: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  trackArtworkImage: {
    width: "50@ms",
    height: "50@ms",
    borderRadius: 8,
  },
  trackTitleContainer: {
    flex: 1,
    overflow: "hidden",
    marginLeft: 10,
  },
  trackTitle: {
    color: "#f2f2f0",
    fontSize: "18@ms",
    fontWeight: "600",
  },
  trackArtist: {
    color: "#a9a9a9",
    fontSize: "12@ms",
    fontWeight: "500",
  },
  trackControlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: "13@s",
  },
});
