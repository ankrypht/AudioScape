/**
 * This file defines the `HeartButton` component, an animated button used for
 * marking items as favorites. It provides visual feedback with a spring animation
 * when its state changes (e.g., when a user favorites or unfavorites a song).
 */

import React, { useEffect } from "react";
import { OpaqueColorValue, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";
import { FontAwesome } from "@expo/vector-icons";

/**
 * @interface HeartButtonProps
 * Defines the props for the `HeartButton` component.
 */
interface HeartButtonProps {
  isFavorite: boolean; // Whether the item is currently favorited.
  onToggle: () => void; // Callback function to toggle the favorite state.
  size: number; // The size of the heart icon.
  notFavoriteColor?: string | OpaqueColorValue; // Optional: Color when not favorited.
  favoriteColor?: string | OpaqueColorValue; // Optional: Color when favorited.
}

/**
 * `HeartButton` component.
 * An animated heart-shaped button for toggling favorite status.
 * @param {HeartButtonProps} props - The props for the component.
 * @returns A React element representing the animated heart button.
 */
const HeartButton: React.FC<HeartButtonProps> = ({
  isFavorite,
  onToggle,
  size,
  notFavoriteColor = "#000",
  favoriteColor = "#E53935",
}) => {
  // Shared value for the scale animation, managed by `react-native-reanimated`.
  const scale = useSharedValue(1);

  // When `isFavorite` changes, trigger a bounce animation.
  useEffect(() => {
    scale.value = 0.8; // Shrink a bit first to create a bounce effect.
    // Use `withSpring` for a natural, springy animation.
    scale.value = withSpring(1, {
      damping: 5,
      stiffness: 150,
    });
  }, [isFavorite, scale]);

  // Apply the animated style to the button's container.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={onToggle}>
      <Animated.View style={animatedStyle}>
        <FontAwesome
          name={isFavorite ? "heart" : "heart-o"} // Toggle between filled and outline heart icons.
          size={size}
          color={isFavorite ? favoriteColor : notFavoriteColor} // Toggle color based on favorite state.
        />
      </Animated.View>
    </Pressable>
  );
};

export default HeartButton;
