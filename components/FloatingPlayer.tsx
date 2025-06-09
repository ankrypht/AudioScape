import {
  PlayPauseButton,
  SkipToNextButton,
  SkipToPreviousButton,
} from "@/components/PlayerControls";
import { useLastActiveTrack } from "@/hooks/useLastActiveTrack";
import { useRouter } from "expo-router";
import { View, ViewProps, TouchableOpacity } from "react-native";
import FastImage from "@d11/react-native-fast-image";
import color from "color";
import { useActiveTrack } from "react-native-track-player";
import { usePlayerBackground } from "@/hooks/usePlayerBackground";
import { MovingText } from "@/components/MovingText";
import { ScaledSheet, scale } from "react-native-size-matters/extend";

export const FloatingPlayer = ({ style }: ViewProps) => {
  const lastActiveTrack = useLastActiveTrack();
  const activeTrack = useActiveTrack();
  const { imageColors } = usePlayerBackground(
    activeTrack?.artwork ?? "https://placehold.co/50",
  );
  const dominantColor = activeTrack ? imageColors?.dominant : "#101010";
  const darkerColor =
    dominantColor === "#101010"
      ? "#101010"
      : color(dominantColor).darken(0.5).hex();

  const router = useRouter();

  const displayedTrack = activeTrack ?? lastActiveTrack;

  const handlePress = () => {
    router.navigate("/player");
  };

  if (!displayedTrack) return null;

  return (
    <View style={[styles.container, { backgroundColor: darkerColor }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.5}
        style={styles.touchableArea}
      >
        <FastImage
          source={{
            uri: displayedTrack.artwork,
            priority: FastImage.priority.high,
          }}
          style={styles.trackArtworkImage}
        />

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

      <TouchableOpacity
        activeOpacity={0.5}
        style={styles.trackControlsContainer}
      >
        <SkipToPreviousButton iconSize={scale(25)} />
        <PlayPauseButton iconSize={scale(25)} />
        <SkipToNextButton iconSize={scale(25)} />
      </TouchableOpacity>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "8@s",
    paddingVertical: "8@vs",
    borderRadius: 12,
  },
  touchableArea: {
    flexDirection: "row",
    alignItems: "center",
    width: "235@s",
  },
  trackArtworkImage: {
    width: "50@s",
    height: "50@s",
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
