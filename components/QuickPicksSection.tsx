import React from "react";
import { ScrollView, TouchableOpacity, View, Text } from "react-native";
import FastImage from "@d11/react-native-fast-image";
import LoaderKit from "react-native-loader-kit";
import { useActiveTrack } from "react-native-track-player";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { ScaledSheet } from "react-native-size-matters/extend";

interface QuickPicksSectionProps {
  results: Song[];
  onItemClick: (item: Song) => void;
}

export const QuickPicksSection: React.FC<QuickPicksSectionProps> = ({
  results,
  onItemClick,
}) => {
  const router = useRouter();
  const activeTrack = useActiveTrack();

  const renderItem = (item: Song) => (
    <TouchableOpacity
      key={item.id}
      style={styles.itemContainer}
      onPress={() => onItemClick(item)}
      onLongPress={() => {
        // Convert the song object to a JSON string
        const songData = JSON.stringify({
          id: item.id,
          title: item.title,
          artist: item.artist,
          thumbnail: item.thumbnail,
        });

        router.push({
          pathname: "/(modals)/menu",
          params: { songData: songData, type: "song" },
        });
      }}
    >
      <View style={styles.imageContainer}>
        <FastImage source={{ uri: item.thumbnail }} style={styles.thumbnail} />
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
