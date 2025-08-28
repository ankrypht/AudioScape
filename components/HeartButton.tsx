import React, { useEffect } from "react";
import { OpaqueColorValue, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";
import { FontAwesome } from "@expo/vector-icons";

interface HeartButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size: number;
  notFavoriteColor?: string | OpaqueColorValue;
  favoriteColor?: string | OpaqueColorValue;
}

const HeartButton: React.FC<HeartButtonProps> = ({
  isFavorite,
  onToggle,
  size,
  notFavoriteColor = "#000",
  favoriteColor = "#E53935",
}) => {
  // shared value for scale animation
  const scale = useSharedValue(1);

  // when isFavorite changes, run a bounce animation
  useEffect(() => {
    scale.value = 0.8; // shrink a bit first
    scale.value = withSpring(1, {
      damping: 5,
      stiffness: 150,
    });
  }, [isFavorite, scale]);

  // apply animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={onToggle}>
      <Animated.View style={animatedStyle}>
        <FontAwesome
          name={isFavorite ? "heart" : "heart-o"}
          size={size}
          color={isFavorite ? favoriteColor : notFavoriteColor}
        />
      </Animated.View>
    </Pressable>
  );
};

export default HeartButton;
