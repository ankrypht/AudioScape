/**
 * This file defines the `FullScreenGradientBackground` component, which provides
 * a dynamic full-screen gradient background using a collection of pre-defined image assets.
 * It allows for a visually appealing backdrop that can change based on an index.
 *
 * @packageDocumentation
 */

import React from "react";
import {
  StyleSheet,
  View,
  ViewProps,
  ImageBackground,
  ImageSourcePropType,
} from "react-native";

/**
 * Props for the `FullScreenGradientBackground` component.
 */
export interface BackgroundImageProps extends ViewProps {
  index: number; // The index to select a background image from the predefined list.
  children?: React.ReactNode; // Child components to render on top of the background.
  style?: any; // Custom styles for the outer container.
}

// Array of imported background gradient images.
const backgroundImages: ImageSourcePropType[] = [
  require("@/assets/images/backgroundGradients/gradient-0.png"),
  require("@/assets/images/backgroundGradients/gradient-1.png"),
  require("@/assets/images/backgroundGradients/gradient-2.png"),
  require("@/assets/images/backgroundGradients/gradient-3.png"),
  require("@/assets/images/backgroundGradients/gradient-4.png"),
  require("@/assets/images/backgroundGradients/gradient-5.png"),
  require("@/assets/images/backgroundGradients/gradient-6.png"),
  require("@/assets/images/backgroundGradients/gradient-7.png"),
  require("@/assets/images/backgroundGradients/gradient-8.png"),
  require("@/assets/images/backgroundGradients/gradient-9.png"),
  require("@/assets/images/backgroundGradients/gradient-10.png"),
  require("@/assets/images/backgroundGradients/gradient-11.png"),
];

/**
 * `FullScreenGradientBackground` component.
 * Renders a full-screen background with a gradient image selected by index.
 * An overlay is applied to ensure content readability.
 * @param {BackgroundImageProps} { index, children, style, ...rest } Props for the component.
 */
const FullScreenGradientBackground: React.FC<BackgroundImageProps> = ({
  index,
  children,
  style,
  ...rest
}) => {
  // Select the image source based on the index, cycling through the array.
  const imageSource = backgroundImages[index % backgroundImages.length];

  return (
    <View style={[styles.outerContainer, style]} {...rest}>
      <ImageBackground
        source={imageSource}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Overlay to darken the background image for better text readability */}
        <View style={styles.overlay} />

        {/* Container for children, ensuring they are rendered on top of the background and overlay */}
        <View style={styles.childrenContainer}>{children}</View>
      </ImageBackground>
    </View>
  );
};

// Styles for the FullScreenGradientBackground component.
const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#000", // Fallback background color if image fails to load
  },
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.75)", // Dark semi-transparent overlay
  },
  childrenContainer: {
    flex: 1,
  },
});

export { FullScreenGradientBackground };
