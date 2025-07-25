/**
 * This file defines the `LyricsModal` component, which displays synchronized lyrics
 * for the currently playing song. It features automatic scrolling to the active lyric line,
 * a gradient background based on album artwork, and playback controls.
 *
 * @packageDocumentation
 */

import React, { useEffect, useState } from "react";
import { View, Text, useWindowDimensions, ViewStyle } from "react-native";
import { useProgress, useActiveTrack } from "react-native-track-player";
import { useImageColors } from "@/hooks/useImageColors";
import { Colors } from "@/constants/Colors";
import Lyrics from "@/components/Lyrics";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import VerticalDismiss from "@/components/navigation/VerticalArrowDismiss";
import { Entypo } from "@expo/vector-icons";
import color from "color";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLyricsContext } from "@/hooks/useLyricsContext";
import { useKeepAwake } from "expo-keep-awake";
import { ReducedPlayerControls } from "@/components/PlayerControls";
import { PlayerProgressBar } from "@/components/PlayerProgressbar";
import VerticalSwipeGesture from "@/components/navigation/VerticalGesture";
import {
  ScaledSheet,
  moderateScale,
  scale,
  verticalScale,
} from "react-native-size-matters/extend";

const THRESHOLD = 150; // Threshold for lyric line activation in milliseconds.
const GRADIENT_HEIGHT = 50; // Height of the top and bottom gradient overlays.

// Create an animated version of LinearGradient for reanimated styles.
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * `LyricsModal` component.
 * Displays a full-screen modal with synchronized lyrics for the active track.
 * Features include automatic scrolling, dynamic background, and playback controls.
 * @returns The rendered lyrics modal component.
 */
export default function LyricsModal() {
  useKeepAwake(); // Keep the screen awake while lyrics are displayed.
  const { lyrics, heights, updateHeight } = useLyricsContext();
  const { height } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const { position } = useProgress(250); // Get playback position, updated every 250ms.
  const positionShared = useSharedValue(0); // Shared value for playback position for reanimated.
  const halfScrollComponentHeight = 0.3 * height; // Used for centering the active lyric line.

  const activeTrack = useActiveTrack();
  // Get image colors from the active track's artwork for background.
  const { imageColors } = useImageColors(
    activeTrack?.artwork ?? "https://placehold.co/50",
  );

  // Shared values for performance, to avoid re-renders of the component.
  const heightsShared = useSharedValue<number[]>([]);
  const lyricsShared = useSharedValue<any[]>([]);

  // State to capture the layout of the scroll view for accurate gradient positioning.
  const [scrollLayout, setScrollLayout] = useState({ y: 0, height: 0 });

  // Update shared values when their dependencies change.
  useEffect(() => {
    positionShared.value = position;
  }, [position, positionShared]);

  useEffect(() => {
    heightsShared.value = heights;
  }, [heights, heightsShared]);

  useEffect(() => {
    lyricsShared.value = lyrics;
  }, [lyrics, lyricsShared]);

  // Derived value to calculate the scroll position for the lyrics.
  const lyricsScrollValue = useDerivedValue(() => {
    const currentLyrics = lyricsShared.value;
    const currentHeights = heightsShared.value;
    const currentPosition = positionShared.value;

    if (currentLyrics.length === 0) {
      return 0;
    }

    // Check if all lyric line heights have been measured.
    let allHeightsMeasured =
      currentHeights.length === currentLyrics.length &&
      currentHeights.every((h) => h > 0);

    if (!allHeightsMeasured) {
      return 0;
    }

    /**
     * Calculates the sum of heights of lyric lines up to a given index.
     * @param index - The index up to which to sum heights.
     * @returns The total height.
     */
    const sumOfHeights = (index: number) => {
      let sum = 0;
      for (let i = 0; i < index && i < currentHeights.length; ++i) {
        sum += currentHeights[i];
      }
      return sum;
    };

    // If current position is before the first lyric, scroll to top.
    if (
      currentPosition <
      (currentLyrics[0]?.startTime ?? 0) - THRESHOLD / 1000
    ) {
      return 0;
    }

    // Iterate through lyrics to find the active line and calculate scroll position.
    const maxIndex = Math.min(
      currentLyrics.length - 2,
      currentLyrics.length - 1,
    );

    for (let index = 1; index < maxIndex; index++) {
      const currTime = currentLyrics[index]?.startTime ?? 0;
      const lastTime = currentLyrics[index - 1]?.startTime ?? 0;

      // If current position is within the previous line's active time.
      if (
        currentPosition > lastTime &&
        currentPosition < currTime - THRESHOLD / 1000
      ) {
        return sumOfHeights(index - 1);
      } else if (currentPosition < currTime) {
        // If current position is approaching the current line, animate scroll.
        return withTiming(sumOfHeights(index), {
          duration: THRESHOLD,
          easing: Easing.quad,
        });
      }
    }

    // Handle the last few lines.
    if (currentLyrics.length > 2) {
      return sumOfHeights(currentLyrics.length - 2);
    }
    return 0;
  }, [positionShared, heightsShared, lyricsShared]);

  // Animated style for the scroll view to automatically center the active lyric.
  const scrollViewStyle = useAnimatedStyle(() => {
    if (lyricsShared.value.length === 0)
      return { transform: [{ translateY: 0 }] };

    return {
      transform: [
        {
          translateY:
            lyricsScrollValue.value > halfScrollComponentHeight
              ? -lyricsScrollValue.value + halfScrollComponentHeight
              : 0,
        },
      ],
    };
  });

  // Animated style for the top gradient overlay, fading in/out based on scroll position.
  const topGradientAnimatedStyle = useAnimatedStyle(() => {
    if (lyricsScrollValue.value > halfScrollComponentHeight) {
      return {
        opacity: withTiming(1, {
          duration: 300,
        }),
      };
    }
    return {
      opacity: 0,
    };
  });

  // Explicitly typed dynamic styles for gradient overlays.
  const topGradientDynamicStyle: ViewStyle = {
    position: "absolute",
    top: scrollLayout.y,
    left: 0,
    right: 0,
    height: GRADIENT_HEIGHT,
    zIndex: 2,
  };

  const bottomGradientDynamicStyle: ViewStyle = {
    position: "absolute",
    top: scrollLayout.y + scrollLayout.height - GRADIENT_HEIGHT,
    left: 0,
    right: 0,
    height: GRADIENT_HEIGHT,
    zIndex: 2,
  };

  return (
    // Enable vertical swipe gesture to dismiss the modal.
    <VerticalSwipeGesture>
      <VerticalDismiss>
        {(handleDismiss) => (
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.backgroundGradient,
                {
                  marginTop: top,
                  backgroundColor: imageColors?.average ?? Colors.background,
                },
              ]}
            >
              <View style={styles.modalContent}>
                {/* Dismiss symbol at the top of the modal */}
                <DismissLyricsModalSymbol />

                {/* Header with dismiss button */}
                <View style={styles.header}>
                  <Entypo
                    name="chevron-down"
                    size={moderateScale(28)}
                    style={styles.dismissButton}
                    activeOpacity={0.7}
                    color={Colors.text}
                    onPress={handleDismiss}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  />
                </View>

                {/* Song title and artist */}
                <Text numberOfLines={1} style={styles.songTitle}>
                  {activeTrack?.title ?? "Unknown Track"}
                </Text>
                <Text numberOfLines={1} style={styles.artistName}>
                  {activeTrack?.artist ?? "Unknown Artist"}
                </Text>

                {/* Top gradient overlay for fading effect */}
                <AnimatedLinearGradient
                  colors={[
                    color(imageColors?.average).darken(0.15).hex() ??
                      Colors.background,
                    "transparent",
                  ]}
                  style={[topGradientDynamicStyle, topGradientAnimatedStyle]}
                />

                {/* Scrollable lyrics content */}
                <Animated.ScrollView
                  style={styles.scrollView}
                  overScrollMode={"never"}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false} // Disable manual scrolling, controlled by animation.
                  contentContainerStyle={{ flexGrow: 1, paddingBottom: 25 }}
                  onLayout={(event) => {
                    const layout = event.nativeEvent.layout;
                    setScrollLayout({ y: layout.y, height: layout.height });
                  }}
                >
                  <Animated.View style={scrollViewStyle}>
                    {lyrics.map((line, index) => (
                      <View
                        key={`${index}_${line.startTime ?? 0}_${line.text}`}
                        onLayout={(event) => {
                          const { height: layoutHeight } =
                            event.nativeEvent.layout;
                          updateHeight(index, layoutHeight); // Measure and update height of each lyric line.
                        }}
                      >
                        <Lyrics
                          data={line}
                          seekTime={positionShared}
                          nextLineStartTime={
                            index < lyrics.length - 1
                              ? lyrics[index + 1]?.startTime
                              : undefined
                          }
                        />
                      </View>
                    ))}
                    {/* Spacer at the bottom to allow last lyrics to scroll to center */}
                    <View style={{ height: 0.3 * height }} />
                  </Animated.View>
                </Animated.ScrollView>

                {/* Bottom gradient overlay for fading effect */}
                <LinearGradient
                  colors={[
                    "transparent",
                    color(imageColors?.average).darken(0.15).hex() ??
                      Colors.background,
                  ]}
                  style={bottomGradientDynamicStyle}
                />
                {/* Player progress bar and reduced controls */}
                <PlayerProgressBar
                  style={{ marginTop: 15, marginHorizontal: 20 }}
                />
                <ReducedPlayerControls
                  style={{ marginBottom: verticalScale(20) + bottom }}
                />
              </View>
            </View>
          </View>
        )}
      </VerticalDismiss>
    </VerticalSwipeGesture>
  );
}

/**
 * `DismissLyricsModalSymbol` component.
 * Displays a small horizontal bar at the top of the lyrics modal,
 * indicating that the modal can be dismissed by swiping down.
 * @returns The rendered dismiss symbol component.
 */
const DismissLyricsModalSymbol = () => {
  const { top } = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        top: top - 10,
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

// Styles for the LyricsModal component.
const styles = ScaledSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  backgroundGradient: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
  },
  modalContent: {
    backgroundColor: "rgba(0,0,0,0.15)",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    height: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingLeft: 20,
  },
  dismissButton: {
    marginTop: -11,
    elevation: 3,
  },
  songTitle: {
    fontSize: "18@ms",
    color: Colors.text,
    fontFamily: "Meriva",
    textAlign: "center",
    marginTop: 10,
    marginHorizontal: 20,
  },
  artistName: {
    fontSize: "14@ms",
    color: Colors.text,
    fontFamily: "Meriva",
    textAlign: "center",
    marginBottom: 10,
    marginHorizontal: 20,
  },
  scrollView: {
    backgroundColor: "transparent",
    width: "100%",
    paddingHorizontal: "5%",
    flex: 1,
  },
});
