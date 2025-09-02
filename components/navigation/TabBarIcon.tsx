/**
 * This file defines the `TabBarIcon` component, a reusable component for rendering
 * icons in a tab bar. It uses `Ionicons` from `@expo/vector-icons` and applies default styling.
 */

import Ionicons from "@expo/vector-icons/Ionicons";
import { type IconProps } from "@expo/vector-icons/build/createIconSet";
import { type ComponentProps } from "react";

/**
 * `TabBarIcon` component.
 * Renders an Ionicons icon with default styling suitable for a tab bar.
 * @param {IconProps<ComponentProps<typeof Ionicons>["name"]>} { style, ...rest } Props for the icon component.
 * @returns A React element representing the tab bar icon.
 */
export function TabBarIcon({
  style,
  ...rest
}: IconProps<ComponentProps<typeof Ionicons>["name"]>) {
  return (
    <Ionicons
      size={25} // Default size for the icon.
      style={[{ marginBottom: -3 }, style]} // Default and custom styles.
      {...rest} // Pass any other Ionicons props.
    />
  );
}
