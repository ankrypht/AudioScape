/**
 * This file contains miscellaneous helper functions used throughout the application.
 */
import Color, { ColorInstance } from "color";

/**
 * Converts a given number of seconds into a MM:SS time format.
 * @param seconds - The total number of seconds to format.
 * @returns A string representing the time in MM:SS format.
 */
export const formatSecondsToMinutes = (seconds: number) => {
  // Calculate the whole minutes by dividing seconds by 60.
  const minutes = Math.floor(seconds / 60);
  // Calculate the remaining seconds using the modulo operator.
  const remainingSeconds = Math.floor(seconds % 60);

  // Pad the minutes and seconds with a leading zero if they are less than 10.
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
};

/**
 * Generates a unique identifier for a list of tracks, optionally including a search term.
 * This is useful for creating unique keys for lists in contexts like React.
 * @param trackListName - The base name of the track list (e.g., "favorites", "downloads").
 * @param search - An optional search query that was used to filter the list.
 * @returns A unique string ID, combining the list name and the search term if provided.
 */
export const generateTracksListId = (
  trackListName: string,
  search?: string,
) => {
  // Concatenate the track list name with the search term (if it exists).
  return `${trackListName}${`-${search}` || ""}`;
};

/**
 * Ensures that the provided background color has sufficient contrast against the text color.
 * If not, it darkens the background color until the contrast ratio is acceptable.
 * @param bg - The background color to check and adjust.
 * @param text - The text color to ensure contrast against (default is white).
 * @returns A hex string of the adjusted background color with sufficient contrast.
 */
export function ensureReadable(
  bg: ColorInstance,
  text: ColorInstance = Color("#fff"),
) {
  let c = bg;
  let steps = 0;

  while (c.contrast(text) < 4.5) {
    c = c.mix(Color("black"), 0.1 * (steps + 1)); // blend more black each step
    steps++;
  }
  return c.hex();
}
