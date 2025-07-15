/**
 * This file defines design tokens for the AudioScape application, such as font sizes
 * and padding values. Using design tokens ensures consistent styling across the application
 * and simplifies theme management.
 *
 * @packageDocumentation
 */

import { moderateScale } from "react-native-size-matters/extend";

/**
 * Defines a set of responsive font sizes using `moderateScale` for consistent scaling
 * across different device screen densities.
 */
export const fontSize = {
  xs: moderateScale(12),
  sm: moderateScale(16),
  base: moderateScale(20),
  lg: moderateScale(24),
};

/**
 * Defines standard padding values used for screen layouts.
 */
export const screenPadding = {
  horizontal: 24,
};
