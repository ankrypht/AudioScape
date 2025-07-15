/**
 * This file defines the `QuickPicksSection` component, which displays a horizontally
 * scrollable list of recommended songs, often referred to as "Quick Picks".
 * It shows song artwork, title, and artist, and indicates the currently playing track.
 *
 * @packageDocumentation
 */

import React from "react";
import { ScrollView, TouchableOpacity, View, Text } from "react-native";
import FastImage from "@d11/react-native-fast-image";
import LoaderKit from "react-native-loader-kit";
import { useActiveTrack } from "react-native-track-player";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { ScaledSheet } from "react-native-size-matters/extend";

/**
 * @interface QuickPicksSectionProps
 */
export interface QuickPicksSectionProps {
  results: Song[]; // An array of Song objects to display as quick picks.
  onItemClick: (item: Song) => void; // Callback function when a quick pick item is clicked.
}

/**
 * `QuickPicksSection` component.
 * Renders a section of quick pick songs in a two-row horizontal scroll view.
 * @param results - An array of Song objects to display as quick picks.
 * @param onItemClick - Callback function when a quick pick item is clicked.
 */
export const QuickPicksSection: React.FC<QuickPicksSectionProps> = ({
  results,
  onItemClick,
}) => {
  const router = useRouter();
  const activeTrack = useActiveTrack();

  /**
   * Renders an individual quick pick item (song).
   * @param item The Song object to render.
   * @returns A TouchableOpacity component representing the quick pick item.
   */
  const renderItem = (item: Song) => (
    <TouchableOpacity
      key={item.id}
      style={styles.itemContainer}
      onPress={() => onItemClick(item)}
      onLongPress={() => {
        // Prepare song data for the menu modal.
        const songData = JSON.stringify({
          id: item.id,
          title: item.title,
          artist: item.artist,
          thumbnail: item.thumbnail,
        });

        // Navigate to the menu modal with song details.
        router.push({
          pathname: "/(modals)/menu",
          params: { songData: songData, type: "song" },
        });
      }}
    >
      <View style={styles.imageContainer}>
        <FastImage source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        {/* Display a playing indicator if this is the active track */}
        {activeTrack?.id === item.id && (
          <LoaderKit
            style={styles.trackPlayingIconIndicator}
            name="LineScalePulseOutRapid"
            color="white"
          />
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>
        {item.artist}
      </Text>
    </TouchableOpacity>
  );

  // Split the results into two rows for display.
  const middleIndex = Math.ceil(results.length / 2);
  const topRowItems = results.slice(0, middleIndex);
  const bottomRowItems = results.slice(middleIndex);

  return (
    <View>
      <Text style={styles.header}>Quick Picks</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 13 }}
      >
        <View style={styles.rowsContainer}>
          <View style={styles.row}>{topRowItems.map(renderItem)}</View>
          <View style={styles.row}>{bottomRowItems.map(renderItem)}</View>
        </View>
      </ScrollView>
    </View>
  );
};

// Styles for the QuickPicksSection component.
const styles = ScaledSheet.create({
  header: {
    color: "white",
    fontSize: "20@ms",
    fontWeight: "bold",
    paddingHorizontal: 15,
    paddingBottom: 12,
  },
  rowsContainer: {
    flexDirection: "column",
  },
  row: {
    flexDirection: "row",
    marginBottom: "10@vs",
  },
  itemContainer: {
    marginRight: "10@ms",
    width: "100@ms",
    height: "145@ms",
  },
  imageContainer: {
    position: "relative",
  },
  thumbnail: {
    borderRadius: 12,
    width: "100@ms",
    height: "100@ms",
  },
  trackPlayingIconIndicator: {
    position: "absolute",
    top: "35@ms",
    left: "35@ms",
    width: "30@ms",
    height: "30@ms",
  },
  title: {
    color: Colors.text,
    fontSize: "14@ms",
    fontWeight: "bold",
    marginTop: 5,
  },
  artist: {
    fontSize: "12@ms",
    color: "#888",
  },
});
