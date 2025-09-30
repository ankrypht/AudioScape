/**
 * This file defines the `FloatingPlayer` component, a mini-player that appears
 * at the bottom of the screen to provide quick access to playback controls and track information.
 * It displays the currently active or last active track and allows navigation to the full player screen.
 */

import { useMemo } from "react";
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
import Color from "color";
import { ensureReadable } from "@/helpers/miscellaneous";
import { useRouter } from "expo-router";
import { TouchableOpacity, View, ViewProps } from "react-native";
import { ScaledSheet, moderateScale } from "react-native-size-matters/extend";
import { useActiveTrack, useProgress } from "react-native-track-player";
import { Colors } from "@/constants/Colors";
import { unknownTrackImageUri } from "@/constants/images";

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
  // Hook for getting track progress
  const { position, duration } = useProgress(250);
  // Hook to extract dominant colors from the track's artwork.
  const { imageColors } = useImageColors(
    activeTrack?.artwork ?? unknownTrackImageUri,
  );

  // Determine the dominant color for the player's background.
  const dominantColor = useMemo(() => {
    return ensureReadable(Color(imageColors?.dominant ?? "#000"));
  }, [imageColors?.dominant]);

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

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: dominantColor }, style]}>
      <View style={styles.playerContent}>
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
          <SkipToPreviousButton
            iconSize={moderateScale(30)}
            isFloatingPlayer={true}
          />
          <PlayPauseButton
            iconSize={moderateScale(40)}
            isFloatingPlayer={true}
          />
          <SkipToNextButton
            iconSize={moderateScale(30)}
            isFloatingPlayer={true}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.progressBarContainer}>
        <View
          style={[styles.progressBar, { width: `${progressPercentage}%` }]}
        />
      </View>
    </View>
  );
};

// Styles for the FloatingPlayer component.
const styles = ScaledSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
  },
  playerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: "8@s",
    paddingVertical: "8@vs",
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
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  trackTitleContainer: {
    flex: 1,
    overflow: "hidden",
    marginLeft: 10,
    marginRight: 8,
  },
  trackTitle: {
    color: "#fff",
    fontSize: "18@ms",
    fontWeight: "600",
  },
  trackArtist: {
    color: Colors.text,
    fontSize: "12@ms",
    fontWeight: "500",
  },
  trackControlsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBarContainer: {
    height: "1.5@ms",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#fff",
  },
});
