/**
 * This file defines the `MovingText` component, which displays text that can
 * automatically marquee (scroll) horizontally if its content exceeds a specified length.
 * This is useful for displaying long titles or artist names in a compact space.
 */

import { Text, TextStyle, StyleProp } from "react-native";
import { Marquee } from "@animatereactnative/marquee";

/**
 * @interface MovingTextProps
 */
export type MovingTextProps = {
  text: string; // The text content to display.
  animationThreshold: number; // The minimum length of the text to trigger the marquee animation.
  style: StyleProp<TextStyle>; // Custom styles to apply to the text.
};

/**
 * `MovingText` component.
 * Renders text that will marquee if its length exceeds `animationThreshold`.
 * @param {MovingTextProps} { text, animationThreshold, style } Props for the component.
 */
export const MovingText = ({
  text,
  animationThreshold,
  style,
}: MovingTextProps) => {
  // Determine if the text length is greater than or equal to the animation threshold.
  const shouldAnimate = text.length >= animationThreshold;

  if (shouldAnimate) {
    // If animation is needed, render the text within a `Marquee` component.
    return (
      <Marquee spacing={60} speed={0.3} withGesture={false}>
        <Text numberOfLines={1} style={style}>
          {text}
        </Text>
      </Marquee>
    );
  } else {
    // Otherwise, render a regular `Text` component.
    return (
      <Text numberOfLines={1} style={style}>
        {text}
      </Text>
    );
  }
};
