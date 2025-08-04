/**
 * This file defines various reusable components for controlling music playback,
 * including play/pause, skip, repeat, add to playlist, and download buttons.
 * These components interact with `react-native-track-player` and Redux store for state management.
 *
 * @packageDocumentation
 */

import { Colors } from "@/constants/Colors";
import { triggerHaptic } from "@/helpers/haptics";
import { useTrackPlayerRepeatMode } from "@/hooks/useTrackPlayerRepeatMode";
import { downloadAndSaveSong } from "@/services/download";
import { useIsSongDownloaded } from "@/store/library";
import {
  Entypo,
  FontAwesome6,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { ComponentProps, useCallback } from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import { moderateScale } from "react-native-size-matters/extend";
import TrackPlayer, {
  RepeatMode,
  useActiveTrack,
  useIsPlaying,
} from "react-native-track-player";
import { match } from "ts-pattern";

/**
 * Props for the `PlayerControls` component.
 */
export type PlayerControlsProps = {
  style?: ViewStyle; // Custom styles for the container View.
};

/**
 * Props for individual player button components.
 */
export type PlayerButtonProps = {
  style?: ViewStyle; // Custom styles for the button's container View.
  iconSize?: number; // Size of the icon.
};

/**
 * `PlayerControls` component.
 * Displays a full set of music playback controls including add to playlist, skip, play/pause, and repeat.
 * @param style - Custom styles for the container View.
 */
export const PlayerControls = ({ style }: PlayerControlsProps) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <AddToPlaylistButton />

        <SkipToPreviousButton />

        <PlayPauseButton />

        <SkipToNextButton />

        <RepeatToggle />
      </View>
    </View>
  );
};

/**
 * `ReducedPlayerControls` component.
 * Displays a simplified set of music playback controls (skip, play/pause).
 * @param style - Custom styles for the container View.
 */
export const ReducedPlayerControls = ({ style }: PlayerControlsProps) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <SkipToPreviousButton />

        <PlayPauseButton />

        <SkipToNextButton />
      </View>
    </View>
  );
};

/**
 * `PlayPauseButton` component.
 * Toggles between play and pause states for the music player.
 */
export const PlayPauseButton = ({
  style,
  iconSize = moderateScale(50),
}: PlayerButtonProps) => {
  const { playing } = useIsPlaying();

  return (
    <View style={[{ height: iconSize }, style]}>
      <TouchableOpacity
        onPress={() => {
          triggerHaptic();
          if (playing) {
            TrackPlayer.pause();
          } else {
            TrackPlayer.play();
          }
        }}
      >
        <FontAwesome6
          name={playing ? "pause" : "play"}
          size={iconSize}
          color={Colors.text}
        />
      </TouchableOpacity>
    </View>
  );
};

/**
 * `SkipToNextButton` component.
 * Skips to the next track in the queue.
 */
export const SkipToNextButton = ({
  iconSize = moderateScale(40),
}: PlayerButtonProps) => {
  return (
    <TouchableOpacity
      onPress={() => {
        triggerHaptic();
        TrackPlayer.skipToNext();
      }}
    >
      <Entypo name="controller-next" size={iconSize} color={Colors.text} />
    </TouchableOpacity>
  );
};

/**
 * `SkipToPreviousButton` component.
 * Skips to the previous track in the queue.
 */
export const SkipToPreviousButton = ({
  iconSize = moderateScale(40),
}: PlayerButtonProps) => {
  return (
    <TouchableOpacity
      onPress={() => {
        triggerHaptic();
        TrackPlayer.skipToPrevious();
      }}
    >
      <Entypo
        name="controller-jump-to-start"
        size={iconSize}
        color={Colors.text}
      />
    </TouchableOpacity>
  );
};

/**
 * `AddToPlaylistButton` component.
 * Navigates to the "Add to Playlist" modal.
 * @param iconSize - Size of the icon.
 */
export const AddToPlaylistButton = ({ iconSize = moderateScale(30) }) => {
  const router = useRouter();

  return (
    <View>
      <TouchableOpacity
        onPress={() => {
          triggerHaptic();
          router.push({ pathname: "/(modals)/addToPlaylist" });
        }}
      >
        <MaterialIcons
          name="playlist-add"
          size={iconSize}
          color={Colors.text}
        />
      </TouchableOpacity>
    </View>
  );
};

/**
 * `DownloadSongButton` component.
 * Initiates the download of the currently active track. Changes icon based on download status.
 */
export const DownloadSongButton = ({
  style,
  iconSize = moderateScale(27),
}: PlayerButtonProps) => {
  const activeTrack = useActiveTrack();
  // Check if the active track is already downloaded.
  const downloaded = useIsSongDownloaded(activeTrack?.id || "");

  /**
   * Handles the download action for the active track.
   */
  const handleDownload = useCallback(async () => {
    if (!activeTrack || downloaded) return; // Do nothing if no active track or already downloaded.
    triggerHaptic();
    await downloadAndSaveSong({
      id: activeTrack.id,
      title: activeTrack.title || "Unknown Title",
      artist: activeTrack.artist || "Unknown Artist",
      duration: activeTrack.duration,
      url: activeTrack.url,
      thumbnailUrl: activeTrack.artwork,
    });

    // No local setState is needed as Redux update will trigger re-render.
  }, [activeTrack, downloaded]);

  return (
    <View style={[{ height: iconSize }, style]}>
      <TouchableOpacity onPress={handleDownload}>
        <MaterialIcons
          name={downloaded ? "download-done" : "download"}
          size={iconSize}
          color={downloaded ? "white" : Colors.icon}
        />
      </TouchableOpacity>
    </View>
  );
};

/**
 * Props for the repeat icon, excluding the `name` property.
 */
export type RepeatIconProps = Omit<
  ComponentProps<typeof MaterialCommunityIcons>,
  "name"
>;

/**
 * Type for the name of the MaterialCommunityIcons icon.
 */
type RepeatIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

// Defines the order of repeat modes to cycle through.
const repeatOrder = [
  RepeatMode.Off,
  RepeatMode.Track,
  RepeatMode.Queue,
] as const;

/**
 * `RepeatToggle` component.
 * Toggles the repeat mode of the music player (Off -> Repeat Track -> Repeat Queue).
 * @param {RepeatIconProps} { ...iconProps } Props for the MaterialCommunityIcons component.
 */
export const RepeatToggle = ({ ...iconProps }: RepeatIconProps) => {
  const { repeatMode, changeRepeatMode } = useTrackPlayerRepeatMode();

  /**
   * Cycles through the repeat modes and updates the player.
   */
  const toggleRepeatMode = () => {
    triggerHaptic();
    if (repeatMode == null) return;

    // Determine the next repeat mode in the defined order.
    const currentIndex = repeatOrder.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % repeatOrder.length;

    changeRepeatMode(repeatOrder[nextIndex]);
  };

  // Determine the appropriate icon based on the current repeat mode.
  const icon = match(repeatMode)
    .returnType<RepeatIconName>()
    .with(RepeatMode.Off, () => "repeat-off")
    .with(RepeatMode.Track, () => "repeat-once")
    .with(RepeatMode.Queue, () => "repeat")
    .otherwise(() => "repeat-off");

  return (
    <MaterialCommunityIcons
      name={icon}
      onPress={toggleRepeatMode}
      color={Colors.text}
      size={moderateScale(32)}
      {...iconProps}
    />
  );
};

// Styles for the PlayerControls components.
const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
});
