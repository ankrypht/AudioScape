/**
 * This file defines the `SwipeToDismissPlayer` component, which allows users to
 * dismiss its child content (e.g., a music player screen) by swiping downwards.
 * It leverages `react-native-gesture-handler` for gesture recognition and
 * `react-native-reanimated` for smooth, performant animations.
 */

import React, { ReactNode } from "react";
import { StyleSheet, Dimensions } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";

// Get the full height of the window for dismissal animation calculations.
const { height } = Dimensions.get("window");

/**
 * @interface SwipeToDismissPlayerProps
 */
export interface SwipeToDismissPlayerProps {
  children: ReactNode; // The content to be rendered within the swipeable area.
  duration?: number; // Optional: The duration of the dismissal animation in milliseconds.
}

/**
 * `SwipeToDismissPlayer` component.
 * Wraps content and provides a vertical swipe-to-dismiss gesture.
 * If the swipe exceeds a certain threshold, the content animates off-screen and navigates back.
 * Otherwise, it springs back to its original position.
 * @param children - The content to be rendered within the swipeable area.
 * @param duration - The duration of the dismissal animation in milliseconds.
 * @default 1000 - The default duration for the dismissal animation.
 */
const SwipeToDismissPlayer: React.FC<SwipeToDismissPlayerProps> = ({
  children,
  duration = 1000,
}) => {
  // Shared value to control the Y-axis translation for animation.
  const translateY = useSharedValue(0);
  const router = useRouter();

  /**
   * Navigates back using `expo-router`.
   */
  const goBack = () => {
    router.back();
  };

  // Define the pan gesture handler.
  const gestureHandler = Gesture.Pan()
    .onChange((event) => {
      // Only allow downward swipes.
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      // If the swipe distance exceeds 10% of the screen height, dismiss.
      if (event.translationY > height * 0.1) {
        translateY.value = withTiming(
          height + 100, // Move 100 units beyond the screen height.
          {
            duration: duration, // Animation duration.
            easing: Easing.out(Easing.exp), // Easing function for a smooth exit.
          },
          () => {
            // After the animation completes, execute `goBack` on the JS thread.
            runOnJS(goBack)();
          },
        );
      } else {
        // Otherwise, spring back to the original position.
        translateY.value = withSpring(0);
      }
    });

  // Animated style for applying the translateY transformation.
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <GestureDetector gesture={gestureHandler}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

// Styles for the SwipeToDismissPlayer component.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SwipeToDismissPlayer;
