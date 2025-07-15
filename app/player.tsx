/**
 * This file defines the main music player screen of the application.
 * It displays the currently active track's artwork, title, artist, playback controls,
 * and progress. It also integrates features like favoriting, downloading, and navigating
 * to the queue and lyrics screens.
 *
 * @packageDocumentation
 */

import { MovingText } from "@/components/MovingText";
import {
  PlayerControls,
  DownloadSongButton,
} from "@/components/PlayerControls";
import { PlayerProgressBar } from "@/components/PlayerProgressbar";
import { screenPadding } from "@/constants/tokens";
import { Colors } from "@/constants/Colors";
import { useImageColors } from "@/hooks/useImageColors";
import { useTrackPlayerFavorite } from "@/hooks/useTrackPlayerFavorite";
import { defaultStyles } from "@/styles";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import FastImage from "@d11/react-native-fast-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useActiveTrack } from "react-native-track-player";
import VerticalSwipeGesture from "@/components/navigation/VerticalGesture";
import {
  ScaledSheet,
  verticalScale,
  scale,
  moderateScale,
} from "react-native-size-matters/extend";

/**
 * `PlayerScreen` component.
 * Displays the full-screen music player UI.
 */
const PlayerScreen = () => {
  const activeTrack = useActiveTrack();
  const router = useRouter();

  // Extract dominant colors from the active track's artwork for the background gradient.
  const { imageColors } = useImageColors(
    activeTrack?.artwork ?? "https://placehold.co/50",
  );

  // Get safe area insets to adjust UI elements for notches and system bars.
  const { top, bottom } = useSafeAreaInsets();

  // Hook to manage track favoriting.
  const { isFavorite, toggleFavoriteFunc } = useTrackPlayerFavorite();

  // Show a loading indicator if no active track is available.
  if (!activeTrack) {
    return (
      <View style={[defaultStyles.container, { justifyContent: "center" }]}>
        <ActivityIndicator color={Colors.icon} />
      </View>
    );
  }

  return (
    // Enable vertical swipe gesture to dismiss the player.
    <VerticalSwipeGesture>
      {/* Background gradient based on album artwork colors */}
      <LinearGradient
        style={{ flex: 1 }}
        colors={
          imageColors
            ? [imageColors.average, imageColors.dominant]
            : [Colors.background, "#000"]
        }
      >
        <View style={styles.overlayContainer}>
          {/* Dismiss player indicator */}
          <DismissPlayerSymbol />

          <View style={{ flex: 1, marginTop: top + verticalScale(50) }}>
            {/* Album artwork */}
            <View style={styles.artworkImageContainer}>
              <FastImage
                source={{
                  uri: activeTrack.artwork,
                  priority: FastImage.priority.high,
                }}
                resizeMode="cover"
                style={styles.artworkImage}
              />
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ marginTop: verticalScale(40) }}>
                <View style={{ height: verticalScale(50) }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {/* Track title, with marquee effect for long titles */}
                    <View style={styles.trackTitleContainer}>
                      <MovingText
                        text={activeTrack.title ?? ""}
                        animationThreshold={28}
                        style={styles.trackTitleText}
                      />
                    </View>

                    {/* Favorite button */}
                    <FontAwesome
                      name={isFavorite ? "heart" : "heart-o"}
                      size={moderateScale(22)}
                      color={isFavorite ? "#ff0000" : Colors.icon}
                      style={{ marginRight: 13, marginLeft: 8 }}
                      onPress={() => {
                        toggleFavoriteFunc();
                      }}
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    />

                    {/* Download song button */}
                    <DownloadSongButton style={{ paddingTop: 1 }} />
                  </View>

                  {/* Track artist */}
                  {activeTrack.artist && (
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.trackArtistText,
                        { marginTop: verticalScale(6) },
                      ]}
                    >
                      {activeTrack.artist}
                    </Text>
                  )}
                </View>

                {/* Playback progress bar */}
                <PlayerProgressBar style={{ marginTop: verticalScale(32) }} />

                {/* Player controls (play/pause, skip, repeat) */}
                <PlayerControls
                  style={{
                    marginTop: verticalScale(40),
                    marginBottom: verticalScale(125),
                  }}
                />
              </View>
            </View>
            {/* Bottom navigation buttons (Queue, Lyrics) */}
            <View
              style={{ flexDirection: "row", justifyContent: "space-evenly" }}
            >
              <TouchableOpacity
                activeOpacity={0.5}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                style={[
                  styles.bottomButton,
                  { bottom: verticalScale(20) + bottom },
                ]}
                onPress={() => router.push({ pathname: "/(modals)/queue" })}
              >
                <Text style={styles.bottomButtonText}>QUEUE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.5}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                style={[
                  styles.bottomButton,
                  { bottom: verticalScale(20) + bottom },
                ]}
                onPress={() => router.push({ pathname: "/(modals)/lyrics" })}
              >
                <Text style={styles.bottomButtonText}> LYRICS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    </VerticalSwipeGesture>
  );
};

/**
 * `DismissPlayerSymbol` component.
 * Displays a small horizontal bar at the top of the player screen,
 * indicating that the player can be dismissed by swiping down.
 * @returns The rendered dismiss symbol component.
 */
const DismissPlayerSymbol = () => {
  const { top } = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        top: top + 8,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
      }}
    >
      <View
        accessible={false}
        style={{
          width: scale(45),
          height: verticalScale(6),
          borderRadius: 8,
          backgroundColor: "#fff",
          opacity: 0.7,
        }}
      />
    </View>
  );
};

// Styles for the PlayerScreen component.
const styles = ScaledSheet.create({
  overlayContainer: {
    ...defaultStyles.container,
    paddingHorizontal: screenPadding.horizontal,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  artworkImageContainer: {
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 11,
    borderRadius: 12,
    width: "310@ms",
    height: "310@ms",
    alignSelf: "center",
  },
  artworkImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 12,
  },
  trackTitleContainer: {
    flex: 1,
    overflow: "hidden",
  },
  trackTitleText: {
    ...defaultStyles.text,
    fontSize: "22@ms",
    fontWeight: "700",
  },
  trackArtistText: {
    ...defaultStyles.text,
    fontSize: "20@ms",
    opacity: 0.8,
    maxWidth: "90%",
  },
  bottomButtonText: {
    textAlign: "center",
    color: Colors.text,
    flexShrink: 1,
    fontSize: "16@ms",
    fontWeight: "500",
  },
  bottomButton: {
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingVertical: "9@vs",
    paddingHorizontal: "15@s",
    borderRadius: 18,
    alignSelf: "center",
  },
});

export default PlayerScreen;
