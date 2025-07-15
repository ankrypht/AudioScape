/**
 * This file contains a custom React hook for extracting prominent colors from an image.
 * It uses the `react-native-image-colors` library to analyze an image from a given URL and
 * provides the extracted color palette.
 *
 * @packageDocumentation
 */

import { Colors } from "@/constants/Colors";
import { useEffect, useState } from "react";
import { getColors } from "react-native-image-colors";
import { AndroidImageColors } from "react-native-image-colors/build/types";

/**
 * A custom hook that extracts prominent colors from an image URL.
 * It fetches and caches the colors, providing a fallback color if the process fails.
 * @param imageUrl The URL of the image from which to extract colors.
 * @returns An object containing the extracted `imageColors` (or null if not yet available),
 * which conforms to the `AndroidImageColors` type.
 */
export const useImageColors = (imageUrl: string) => {
  // State to store the extracted image colors.
  const [imageColors, setImageColors] = useState<AndroidImageColors | null>(
    null,
  );

  useEffect(() => {
    // When the imageUrl changes, get the colors from the image.
    getColors(imageUrl, {
      fallback: Colors.background, // Fallback color if extraction fails.
      cache: true, // Enable caching to avoid re-processing the same image.
      key: imageUrl, // Unique key for caching.
    }).then((colors) => setImageColors(colors as AndroidImageColors));
  }, [imageUrl]); // Re-run the effect if the imageUrl changes.

  return { imageColors };
};
