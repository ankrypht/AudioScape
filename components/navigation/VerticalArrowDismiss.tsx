/**
 * This file defines the `VerticalDismiss` component, which enables a vertical
 * dismissal gesture for its child content. It uses `react-native-reanimated` for smooth
 * animations and `expo-router` for navigation.
 */

import { triggerHaptic } from "@/helpers/haptics";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { ReactNode } from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Get the full height of the window for dismissal animation.
const { height } = Dimensions.get("window");

/**
 * @interface VerticalDismissProps
 */
export interface VerticalDismissProps {
  children: (handleDismiss: () => void) => ReactNode; // A render prop that provides the dismiss function.
}

/**
 * `VerticalDismiss` component.
 * Wraps content and provides a vertical dismissal animation.
 * @param children - A render prop that provides the dismiss function.
 */
const VerticalDismiss: React.FC<VerticalDismissProps> = ({ children }) => {
  // Shared value to control the Y-axis translation for animation.
  const translateY = useSharedValue(0);
  const router = useRouter();

  /**
   * Navigates back using `expo-router`.
   */
  const goBack = () => {
    router.back();
  };

  /**
   * Initiates the vertical dismissal animation.
   * Moves the component off-screen downwards and then navigates back.
   */
  const handleDismiss = () => {
    triggerHaptic(Haptics.AndroidHaptics.Gesture_Start); // Trigger haptic feedback on dismiss.
    translateY.value = withTiming(
      height + 100, // Move 100 units beyond the screen height.
      {
        duration: 2000, // Animation duration.
        easing: Easing.out(Easing.exp), // Easing function for a smooth exit.
      },
      () => {
        // After the animation completes, execute `goBack` on the JS thread.
        runOnJS(goBack)();
      },
    );
  };

  // Animated style for applying the translateY transformation.
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children(handleDismiss)}
    </Animated.View>
  );
};

// Styles for the VerticalDismiss component.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default VerticalDismiss;
