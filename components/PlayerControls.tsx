/**
 * This file defines various reusable components for controlling music playback,
 * including play/pause, skip, repeat, add to playlist, and download buttons.
 * These components interact with `react-native-track-player` and Redux store for state management.
 */

import { Colors } from "@/constants/Colors";
import { unknownTrackImageUri } from "@/constants/images";
import { triggerHaptic } from "@/helpers/haptics";
import { useTrackPlayerRepeatMode } from "@/hooks/useTrackPlayerRepeatMode";
import { downloadAndSaveSong } from "@/services/download";
import { useIsSongDownloaded, useIsSongDownloading } from "@/store/library";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { ComponentProps, useCallback } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
  RegisteredStyle,
  ToastAndroid,
  ActivityIndicator,
} from "react-native";
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
  style?:
    | ViewStyle
    | RegisteredStyle<ViewStyle>
    | (ViewStyle | RegisteredStyle<ViewStyle>)[]; // Custom styles for the button's container View.
  iconSize?: number; // Size of the icon.
  isFloatingPlayer?: boolean; // Whether the button is for the floating player.
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
  iconSize = moderateScale(65),
  isFloatingPlayer = false,
}: PlayerButtonProps) => {
  const { playing } = useIsPlaying();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        isFloatingPlayer
          ? { height: iconSize }
          : {
              height: iconSize,
              width: iconSize,
              borderRadius: playing ? iconSize * 0.35 : iconSize / 2,
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
            },
        style,
      ]}
      onPress={() => {
        triggerHaptic();
        if (playing) {
          TrackPlayer.pause();
        } else {
          TrackPlayer.play();
        }
      }}
    >
      <MaterialIcons
        name={playing ? "pause" : "play-arrow"}
        size={isFloatingPlayer ? iconSize : iconSize * 0.65}
        color={isFloatingPlayer ? "#fff" : "#000"}
      />
    </TouchableOpacity>
  );
};

/**
 * `SkipToNextButton` component.
 * Skips to the next track in the queue.
 */
export const SkipToNextButton = ({
  iconSize = moderateScale(40),
  isFloatingPlayer = false,
}: PlayerButtonProps) => {
  return (
    <TouchableOpacity
      onPress={() => {
        triggerHaptic();
        TrackPlayer.skipToNext();
      }}
    >
      {isFloatingPlayer ? (
        <MaterialIcons name="skip-next" size={iconSize} color="#fff" />
      ) : (
        <MaterialCommunityIcons
          name="skip-next-outline"
          size={iconSize}
          color={"#fff"}
        />
      )}
    </TouchableOpacity>
  );
};

/**
 * `SkipToPreviousButton` component.
 * Skips to the previous track in the queue.
 */
export const SkipToPreviousButton = ({
  iconSize = moderateScale(40),
  isFloatingPlayer = false,
}: PlayerButtonProps) => {
  return (
    <TouchableOpacity
      onPress={() => {
        triggerHaptic();
        TrackPlayer.skipToPrevious();
      }}
    >
      {isFloatingPlayer ? (
        <MaterialIcons name="skip-previous" size={iconSize} color="#fff" />
      ) : (
        <MaterialCommunityIcons
          name="skip-previous-outline"
          size={iconSize}
          color={"#fff"}
        />
      )}
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
  const activeTrack = useActiveTrack();

  return (
    <View>
      <TouchableOpacity
        onPress={async () => {
          triggerHaptic();
          await router.push({
            pathname: "/(modals)/addToPlaylist",
            params: activeTrack
              ? {
                  track: JSON.stringify({
                    id: activeTrack.id,
                    title: activeTrack.title || "",
                    artist: activeTrack.artist || "",
                    thumbnail: activeTrack.artwork || unknownTrackImageUri,
                  }),
                }
              : undefined,
          });
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
  iconSize = moderateScale(25),
}: PlayerButtonProps) => {
  const activeTrack = useActiveTrack();
  // Check if the active track is already downloaded.
  const downloaded = useIsSongDownloaded(activeTrack?.id || "");
  // Check if the active track is currently downloading.
  const downloading = useIsSongDownloading(activeTrack?.id || "");

  /**
   * Handles the download action for the active track.
   */
  const handleDownload = useCallback(async () => {
    if (!activeTrack || downloaded) return; // Do nothing if no active track or already downloaded.
    if (downloading) {
      ToastAndroid.show("Song is already downloading", ToastAndroid.SHORT);
      return;
    }
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
  }, [activeTrack, downloaded, downloading]);

  return (
    <View style={style}>
      <TouchableOpacity onPress={handleDownload}>
        {downloading ? (
          <ActivityIndicator size={iconSize} color={"#000"} />
        ) : (
          <MaterialIcons
            name={downloaded ? "file-download-done" : "file-download"}
            size={iconSize}
            color={"#000"}
          />
        )}
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
