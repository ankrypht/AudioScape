/**
 * This file defines the `TrendingSection` component, which displays a horizontally
 * scrollable grid of trending songs. Each song is presented with its rank, artwork, title, and artist,
 * and includes an option to open a menu for additional actions.
 *
 * @packageDocumentation
 */

import React from "react";
import { ScrollView, TouchableOpacity, View, Text } from "react-native";
import FastImage from "@d11/react-native-fast-image";
import LoaderKit from "react-native-loader-kit";
import Entypo from "@expo/vector-icons/Entypo";
import { useRouter } from "expo-router";
import { useActiveTrack } from "react-native-track-player";
import { Colors } from "@/constants/Colors";
import { ScaledSheet, moderateScale } from "react-native-size-matters/extend";

/**
 * @interface TrendingSectionProps
 */
export interface TrendingSectionProps {
  results: Song[]; // An array of Song objects to display as trending items.
  onItemClick: (item: Song) => void; // Callback function when a trending item is clicked.
}

/**
 * `TrendingSection` component.
 * Renders a section of trending songs in a multi-row horizontal scroll view.
 * @param {TrendingSectionProps} { results, onItemClick } Props for the component.
 */
export const TrendingSection: React.FC<TrendingSectionProps> = ({
  results,
  onItemClick,
}) => {
  const router = useRouter();
  const activeTrack = useActiveTrack();

  /**
   * Creates a row of trending song items, filtering results based on the starting index.
   * This allows for a grid-like layout within a horizontal ScrollView.
   * @param startIndex - The starting index to filter results for this row.
   * @returns {JSX.Element[]} An array of JSX elements representing the song items in a row.
   */
  const createRow = (startIndex: number) => {
    return results
      .filter((_, index) => index % 4 === startIndex) // Filter to create rows with specific items.
      .map((item, index) => (
        <View key={item.id} style={styles.itemContainer}>
          <TouchableOpacity
            key={item.id}
            style={styles.itemTouchableArea}
            onPress={() => onItemClick(item)}
          >
            {/* Display the rank of the song */}
            <View style={styles.rankContainer}>
              <Text style={styles.rankText}>{startIndex + 1 + index * 4}</Text>
            </View>
            {/* Song artwork and playing indicator */}
            <View style={styles.imageContainer}>
              <FastImage
                source={{ uri: item.thumbnail }}
                style={styles.thumbnail}
              />
              {activeTrack?.id === item.id && (
                <LoaderKit
                  style={styles.trackPlayingIconIndicator}
                  name="LineScalePulseOutRapid"
                  color="white"
                />
              )}
            </View>
            {/* Song title and artist */}
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {item.artist}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Options menu button */}
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => {
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
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Entypo
              name="dots-three-vertical"
              size={moderateScale(15)}
              color="white"
            />
          </TouchableOpacity>
        </View>
      ));
  };

  return (
    <View>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Trending</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {/* Render four rows of trending items */}
          <View style={styles.row}>{createRow(0)}</View>
          <View style={styles.row}>{createRow(1)}</View>
          <View style={styles.row}>{createRow(2)}</View>
          <View style={styles.row}>{createRow(3)}</View>
        </View>
      </ScrollView>
    </View>
  );
};

// Styles for the TrendingSection component.
const styles = ScaledSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  header: {
    color: "white",
    fontSize: "20@ms",
    fontWeight: "bold",
  },
  gridContainer: {
    paddingLeft: 16,
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: "25@s",
    width: "280@s",
    height: "72@vs",
  },
  itemTouchableArea: {
    flexDirection: "row",
    alignItems: "center",
  },
  rankContainer: {
    width: "40@s",
    alignItems: "center",
  },
  rankText: {
    color: "#888",
    fontSize: "26@ms",
    fontWeight: "bold",
  },
  imageContainer: {
    marginRight: "12@s",
  },
  thumbnail: {
    width: "72@ms",
    height: "40.5@ms",
    borderRadius: 8,
  },
  trackPlayingIconIndicator: {
    position: "absolute",
    top: "9@vs",
    left: "27@ms",
    width: "20@ms",
    height: "20@ms",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    color: Colors.text,
    fontSize: "16@ms",
    fontWeight: "bold",
    marginBottom: "4@vs",
  },
  artist: {
    fontSize: "14@ms",
    color: "#888",
  },
});
