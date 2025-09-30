/**
 * This file contains a custom React hook for extracting prominent colors from an image.
 * It uses the `react-native-image-colors` library to analyze an image from a given URI (URL or local file path) and
 * provides the extracted color palette.
 */

import { Colors } from "@/constants/Colors";
import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useState } from "react";
import { getColors } from "react-native-image-colors";
import { AndroidImageColors } from "react-native-image-colors/build/types";

/**
 * Converts a local image file to a Base64 encoded string.
 * This is necessary for the `react-native-image-colors` library to process local files.
 * It dynamically determines the image type from the file extension.
 *
 * @param imageUri The local URI of the image file (e.g., 'file:///...').
 * @returns A Base64 encoded string with the appropriate data URI scheme, or null on error.
 */
const convertImageToBase64 = async (imageUri: string) => {
  try {
    let extension = imageUri.split(".").pop()?.toLowerCase() || "jpeg";
    if (extension === "jpg") {
      extension = "jpeg";
    }

    const base64code = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/${extension};base64,${base64code}`;
  } catch (error) {
    console.error("Error converting image to Base64:", error);
    return null;
  }
};

/**
 * A custom hook that extracts prominent colors from a given image URI.
 * It can handle both remote URLs and local file URIs.
 * It fetches and caches the colors, providing a fallback color if the process fails.
 * @param imageUrl The URI of the image from which to extract colors (can be a remote URL or a local file URI).
 * @returns An object containing the extracted `imageColors` (or null if not yet available),
 * which conforms to the `AndroidImageColors` type.
 */
export const useImageColors = (imageUrl: string) => {
  // State to store the extracted image colors.
  const [imageColors, setImageColors] = useState<AndroidImageColors | null>(
    null,
  );

  useEffect(() => {
    const fetchColors = async () => {
      // When the imageUrl changes, get the colors from the image.
      const source = imageUrl.startsWith("file:///")
        ? await convertImageToBase64(imageUrl)
        : imageUrl;
      getColors(source as string, {
        fallback: Colors.background, // Fallback color if extraction fails.
        cache: true, // Enable caching to avoid re-processing the same image.
        key: imageUrl, // Unique key for caching.
      })
        .then((colors) => setImageColors(colors as AndroidImageColors))
        .catch((error) => {
          console.error("Failed to get image colors:", error);
        });
    };
    fetchColors();
  }, [imageUrl]); // Re-run the effect if the imageUrl changes.

  return { imageColors };
};
