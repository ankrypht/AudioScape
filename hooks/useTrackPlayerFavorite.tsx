/**
 * This file contains a custom React hook for managing the favorite status of a track.
 * It interacts with the Redux store to persist favorite tracks and updates the track metadata
 * in the `react-native-track-player` to reflect the favorite status in the notification controls.
 */

import { useFavorites } from "@/store/library";
import { useCallback, useEffect, useState } from "react";
import TrackPlayer, { useActiveTrack } from "react-native-track-player";

/**
 * A custom hook that manages the favorite status of the active track.
 * It provides a function to toggle the favorite status and checks if the current track is a favorite.
 * @returns An object containing:
 * - `isFavorite`: A boolean indicating if the active track is a favorite.
 * - `toggleFavoriteFunc`: A function to toggle the favorite status of a track.
 * - `checkIfFavorite`: A function to check if a track with a given ID is a favorite.
 */
export const useTrackPlayerFavorite = () => {
  const activeTrack = useActiveTrack();
  const { favoriteTracks, toggleFavoriteTrack } = useFavorites();
  const [isFavorite, setIsFavorite] = useState(false);

  // Update the favorite status whenever the active track or the list of favorite tracks changes.
  useEffect(() => {
    if (activeTrack) {
      setIsFavorite(
        favoriteTracks.some((track) => track.id === activeTrack.id),
      );
    }
  }, [activeTrack, favoriteTracks]);

  /**
   * Checks if a track with a given ID is in the list of favorite tracks.
   * @param id The ID of the track to check.
   * @returns A promise that resolves to a boolean indicating if the track is a favorite.
   */
  const checkIfFavorite = useCallback(
    async (id: string) => {
      return favoriteTracks.some((track) => track.id === id);
    },
    [favoriteTracks],
  );

  /**
   * Toggles the favorite status of a track.
   * If no track is provided, it defaults to the currently active track.
   * @param track The track to toggle the favorite status for.
   */
  const toggleFavoriteFunc = useCallback(
    async (
      track = activeTrack
        ? {
            id: activeTrack.id,
            title: activeTrack.title || "",
            artist: activeTrack.artist || "",
            thumbnail: activeTrack.artwork || "",
          }
        : undefined,
    ) => {
      if (!track) return;

      // Dispatch the action to toggle the favorite status in the Redux store.
      toggleFavoriteTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail,
      });

      // Update the track metadata in the player queue to reflect the new favorite status.
      // This is used to update the notification controls.
      try {
        const queue = await TrackPlayer.getQueue();
        const trackIndex = queue.findIndex((t) => t.id === track.id);

        if (trackIndex !== -1) {
          await TrackPlayer.updateMetadataForTrack(trackIndex, {
            rating: isFavorite ? 0 : 1, // 1 for favorite, 0 for not favorite.
          });
        }
      } catch (error) {
        console.error("Error updating track metadata:", error);
      }
    },
    [activeTrack, isFavorite, toggleFavoriteTrack],
  );

  return { isFavorite, toggleFavoriteFunc, checkIfFavorite };
};
