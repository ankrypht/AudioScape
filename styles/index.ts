/**
 * This file defines global styles used across the AudioScape application.
 * It centralizes common styling patterns to ensure consistency and reusability.
 */

import { fontSize } from "@/constants/tokens";
import { Colors } from "@/constants/Colors";
import { StyleSheet } from "react-native";

/**
 * Defines a set of default styles that can be applied to various components.
 */
export const defaultStyles = StyleSheet.create({
  /**
   * A basic container style that takes up all available space.
   */
  container: {
    flex: 1,
  },
  /**
   * Default text styling, including font size and color from the defined tokens.
   */
  text: {
    fontSize: fontSize.base,
    color: Colors.text,
  },
});
