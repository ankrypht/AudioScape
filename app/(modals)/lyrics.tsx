import React, { useEffect, useState } from "react";
import { View, Text, useWindowDimensions, ViewStyle } from "react-native";
import { useProgress, useActiveTrack } from "react-native-track-player";
import { usePlayerBackground } from "@/hooks/usePlayerBackground";
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

const THRESHOLD = 150;
const GRADIENT_HEIGHT = 50;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function LyricsModal() {
  useKeepAwake();
  const { lyrics, heights, updateHeight } = useLyricsContext();
  const { height } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const { position } = useProgress(250);
  const positionShared = useSharedValue(0);
  const halfScrollComponentHeight = 0.3 * height;

  const activeTrack = useActiveTrack();
  const { imageColors } = usePlayerBackground(
    activeTrack?.artwork ?? "https://placehold.co/50",
  );

  // Shared values for performance
  const heightsShared = useSharedValue<number[]>([]);
  const lyricsShared = useSharedValue<any[]>([]);

  // State to capture scroll view layout
  const [scrollLayout, setScrollLayout] = useState({ y: 0, height: 0 });

  useEffect(() => {
    positionShared.value = position;
  }, [position, positionShared]);

  useEffect(() => {
    heightsShared.value = heights;
  }, [heights, heightsShared]);

  useEffect(() => {
    lyricsShared.value = lyrics;
  }, [lyrics, lyricsShared]);

  const lyricsScrollValue = useDerivedValue(() => {
    const currentLyrics = lyricsShared.value;
    const currentHeights = heightsShared.value;
    const currentPosition = positionShared.value;

    if (currentLyrics.length === 0) {
      return 0;
    }

    // Ensure all heights are measured
    let allHeightsMeasured =
      currentHeights.length === currentLyrics.length &&
      currentHeights.every((h) => h > 0);

    if (!allHeightsMeasured) {
      return 0;
    }

    const sumOfHeights = (index: number) => {
      let sum = 0;
      for (let i = 0; i < index && i < currentHeights.length; ++i) {
        sum += currentHeights[i];
      }
      return sum;
    };

    if (
      currentPosition <
      (currentLyrics[0]?.startTime ?? 0) - THRESHOLD / 1000
    ) {
      return 0;
    }

    const maxIndex = Math.min(
      currentLyrics.length - 2,
      currentLyrics.length - 1,
    );

    for (let index = 1; index < maxIndex; index++) {
      const currTime = currentLyrics[index]?.startTime ?? 0;
      const lastTime = currentLyrics[index - 1]?.startTime ?? 0;

      if (
        currentPosition > lastTime &&
        currentPosition < currTime - THRESHOLD / 1000
      ) {
        return sumOfHeights(index - 1);
      } else if (currentPosition < currTime) {
        return withTiming(sumOfHeights(index), {
          duration: THRESHOLD,
          easing: Easing.quad,
        });
      }
    }

    if (currentLyrics.length > 2) {
      return sumOfHeights(currentLyrics.length - 2);
    }
    return 0;
  }, [positionShared, heightsShared, lyricsShared]);

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

  // Explicitly typed dynamic styles for gradient overlays
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
                <DismissLyricsModalSymbol />

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

                <Text numberOfLines={1} style={styles.songTitle}>
                  {activeTrack?.title ?? "Unknown Track"}
                </Text>
                <Text numberOfLines={1} style={styles.artistName}>
                  {activeTrack?.artist ?? "Unknown Artist"}
                </Text>

                <AnimatedLinearGradient
                  colors={[
                    color(imageColors?.average).darken(0.15).hex() ??
                      Colors.background,
                    "transparent",
                  ]}
                  style={[topGradientDynamicStyle, topGradientAnimatedStyle]}
                />

                <Animated.ScrollView
                  style={styles.scrollView}
                  overScrollMode={"never"}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
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
                          updateHeight(index, layoutHeight);
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
                    <View style={{ height: 0.3 * height }} />
                  </Animated.View>
                </Animated.ScrollView>

                <LinearGradient
                  colors={[
                    "transparent",
                    color(imageColors?.average).darken(0.15).hex() ??
                      Colors.background,
                  ]}
                  style={bottomGradientDynamicStyle}
                />
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
