/**
 * This file centralizes the import and export of image assets used throughout the application.
 * It provides resolved URIs for images, making them easily accessible and consistent.
 */

import unknownTrackImage from "@/assets/images/unknown_track.png";
import transparentIconImage from "@/assets/images/transparent-icon.png";
import { Image } from "react-native";

/**
 * URI for the default unknown track image.
 * This image is used as a placeholder when a track's artwork is not available.
 */
export const unknownTrackImageUri =
  Image.resolveAssetSource(unknownTrackImage).uri;

/**
 * URI for the transparent icon image.
 * This icon might be used for various UI elements or as a placeholder.
 */
export const transparentIconUri =
  Image.resolveAssetSource(transparentIconImage).uri;
