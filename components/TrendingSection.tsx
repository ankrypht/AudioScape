/**
 * This file defines the `TrendingSection` component, which displays a horizontally
 * scrollable grid of trending songs. Each song is presented with its rank, artwork, title, and artist,
 * and includes an option to open a menu for additional actions.
 *
 * @packageDocumentation
 */

import { Colors } from "@/constants/Colors";
import { triggerHaptic } from "@/helpers/haptics";
import { FlashList } from "@shopify/flash-list";
import FastImage from "@d11/react-native-fast-image";
import Entypo from "@expo/vector-icons/Entypo";
import { useRouter } from "expo-router";
import React, { useMemo, useCallback } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import LoaderKit from "react-native-loader-kit";
import { ScaledSheet, moderateScale } from "react-native-size-matters/extend";
import { useActiveTrack } from "react-native-track-player";

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

  const handlePress = useCallback(
    (item: Song) => {
      triggerHaptic();
      onItemClick(item);
    },
    [onItemClick],
  );

  const handleMenuPress = useCallback(
    (item: Song) => {
      triggerHaptic();
      const songData = JSON.stringify({
        id: item.id,
        title: item.title,
        artist: item.artist,
        thumbnail: item.thumbnail,
      });
      router.push({
        pathname: "/(modals)/menu",
        params: { songData, type: "song" },
      });
    },
    [router],
  );

  const renderSongItem = useCallback(
    (item: Song, index: number) => (
      <View key={item.id} style={styles.itemContainer}>
        <TouchableOpacity
          style={styles.itemTouchableArea}
          onPress={() => handlePress(item)}
        >
          <View style={styles.rankContainer}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
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
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {item.artist}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleMenuPress(item)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Entypo
            name="dots-three-vertical"
            size={moderateScale(15)}
            color="white"
          />
        </TouchableOpacity>
      </View>
    ),
    [activeTrack, handlePress, handleMenuPress],
  );

  // Group songs into columns of 4 for horizontal display
  const data = useMemo(() => {
    const columns: Song[][] = [];
    for (let i = 0; i < results.length; i += 4) {
      columns.push(results.slice(i, i + 4));
    }
    return columns;
  }, [results]);

  if (results.length === 0) return null;

  return (
    <View>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Trending</Text>
      </View>
      <View style={styles.listContainer}>
        <FlashList
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16 }}
          estimatedItemSize={moderateScale(280)}
          keyExtractor={(col) => col.map((song) => song.id).join("-")}
          renderItem={({ item: column, index: colIndex }) => (
            <View style={styles.column}>
              {column.map((song, rowIndex) =>
                renderSongItem(song, colIndex * 4 + rowIndex),
              )}
            </View>
          )}
        />
      </View>
    </View>
  );
};

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
  listContainer: {
    height: "308@vs",
  },
  column: {
    flexDirection: "column",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: "25@s",
    width: "280@s",
    height: "72@vs",
    marginBottom: 5,
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
