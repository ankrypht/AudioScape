/**
 * This file defines the main music player screen of the application.
 * It displays the currently active track's artwork, title, artist, playback controls,
 * and progress. It also integrates features like favoriting, downloading, and navigating
 * to the queue and lyrics screens.
 */

import { MovingText } from "@/components/MovingText";
import VerticalSwipeGesture from "@/components/navigation/VerticalGesture";
import {
  DownloadSongButton,
  PlayerControls,
} from "@/components/PlayerControls";
import HeartButton from "@/components/HeartButton";
import { PlayerProgressBar } from "@/components/PlayerProgressbar";
import { Colors } from "@/constants/Colors";
import { screenPadding } from "@/constants/tokens";
import { triggerHaptic } from "@/helpers/haptics";
import { useImageColors } from "@/hooks/useImageColors";
import { useTrackPlayerFavorite } from "@/hooks/useTrackPlayerFavorite";
import { defaultStyles } from "@/styles";
import FastImage from "@d11/react-native-fast-image";
import {
  MaterialIcons,
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  moderateScale,
  scale,
  ScaledSheet,
  verticalScale,
} from "react-native-size-matters/extend";
import { useActiveTrack } from "react-native-track-player";
import { unknownTrackImageUri } from "@/constants/images";

/**
 * `PlayerScreen` component.
 * Displays the full-screen music player UI.
 */
const PlayerScreen = () => {
  const activeTrack = useActiveTrack();
  const router = useRouter();

  // Extract dominant colors from the active track's artwork for the background gradient.
  const { imageColors } = useImageColors(
    activeTrack?.artwork ?? unknownTrackImageUri,
  );

  // Get safe area insets to adjust UI elements for notches and system bars.
  const { top, bottom } = useSafeAreaInsets();

  // Hook to manage track favoriting.
  const { isFavorite, toggleFavoriteFunc } = useTrackPlayerFavorite();

  // Function to handle sharing the current track.
  const onShare = async () => {
    triggerHaptic();
    try {
      await Share.share({
        message: "https://music.youtube.com/watch?v=" + activeTrack?.id,
        title: "Check out this song!",
      });
    } catch (error: any) {
      console.error(error.message);
    }
  };

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
            ? [imageColors.dominant, "#000"]
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
                    <View style={styles.favoriteBotton}>
                      <HeartButton
                        isFavorite={isFavorite}
                        onToggle={() => {
                          triggerHaptic();
                          toggleFavoriteFunc();
                        }}
                        size={moderateScale(20)}
                      />
                    </View>

                    <DownloadSongButton style={styles.downloadBotton} />

                    {/* Share button */}
                    <TouchableOpacity
                      onPress={onShare}
                      style={styles.shareButton}
                    >
                      <MaterialCommunityIcons
                        name="share-outline"
                        size={moderateScale(25)}
                        color={"#000"}
                      />
                    </TouchableOpacity>
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
              style={{
                flexDirection: "row",
                justifyContent: "space-evenly",
                bottom: verticalScale(20) + bottom,
              }}
            >
              <TouchableOpacity
                style={styles.bottomButton}
                onPress={() => {
                  triggerHaptic();
                  router.push({ pathname: "/(modals)/queue" });
                }}
              >
                <MaterialIcons
                  name="queue-music"
                  size={moderateScale(20)}
                  color={Colors.text}
                />
                <Text style={styles.bottomButtonText}>Queue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bottomButton}
                onPress={() => {
                  triggerHaptic();
                  router.push({ pathname: "/(modals)/lyrics" });
                }}
              >
                <Feather
                  name="align-center"
                  size={moderateScale(20)}
                  color={Colors.text}
                />
                <Text style={styles.bottomButtonText}>Lyrics</Text>
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
    backgroundColor: "rgba(0,0,0,0.25)",
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
  favoriteBotton: {
    height: "30@ms",
    width: "30@ms",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderBottomRightRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 10,
    borderTopLeftRadius: 10,
    marginLeft: 4,
  },
  downloadBotton: {
    height: "30@ms",
    width: "30@ms",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 6,
    marginHorizontal: 4,
  },
  shareButton: {
    height: "30@ms",
    width: "30@ms",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderBottomRightRadius: 10,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 6,
    borderTopLeftRadius: 6,
  },
  bottomButtonText: {
    textAlign: "center",
    color: Colors.text,
    flexShrink: 1,
    fontSize: "16@ms",
    fontWeight: "500",
    marginLeft: 5,
  },
  bottomButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: "9@vs",
    paddingHorizontal: "15@s",
    borderRadius: 18,
    alignSelf: "center",
  },
});

export default PlayerScreen;
