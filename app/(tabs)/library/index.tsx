/**
 * This file defines the `LibraryScreen` component, which serves as the main navigation hub
 * for the user's personal music library. It provides access to different sections like
 * Favorites, Downloads, and Playlists.
 */

import React, { useCallback, useMemo, useState } from "react";
import CreatePlaylistModal from "@/app/(modals)/createPlaylist";
import { Colors } from "@/constants/Colors";
import { unknownTrackImageUri } from "@/constants/images";
import { triggerHaptic } from "@/helpers/haptics";
import { useLastActiveTrack } from "@/hooks/useLastActiveTrack";
import { usePlaylists } from "@/store/library";
import { defaultStyles } from "@/styles";
import { FlashList } from "@shopify/flash-list";
import FastImage from "@d11/react-native-fast-image";
import { Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Route, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { AnimatedFAB, Divider } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ScaledSheet,
  moderateScale,
  verticalScale,
} from "react-native-size-matters/extend";
import { useActiveTrack } from "react-native-track-player";

/**
 * `LibraryScreen` component.
 * Displays the user's library.
 */
export default function LibraryScreen() {
  const { playlists, createNewPlaylist } = usePlaylists();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const lastActiveTrack = useLastActiveTrack();
  const activeTrack = useActiveTrack();
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  // Determine if the floating player should be visible.
  const isFloatingPlayerNotVisible = !(activeTrack ?? lastActiveTrack);

  // Convert the playlists object into an array for rendering.
  const playlistArray = useMemo(
    () =>
      Object.entries(playlists).map(([name, tracks]) => ({
        name,
        thumbnail: tracks[0]?.thumbnail ?? null,
      })),
    [playlists],
  );

  // Predefined library sections (static items like Favorites, Downloads, etc.)
  const sections: {
    name: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    path: Route;
  }[] = [
    {
      name: "Favorites",
      icon: "heart-outline",
      path: "/library/favorites" as Route,
    },
    {
      name: "Downloads",
      icon: "download-outline",
      path: "/library/downloads" as Route,
    },
  ];

  /**
   * Handles the creation of a new playlist.
   * @param playlistName - The name of the new playlist.
   */
  const handleCreatePlaylist = (playlistName: string) => {
    if (playlists[playlistName]) {
      triggerHaptic(Haptics.AndroidHaptics.Reject);
      ToastAndroid.show(
        "A playlist with this name already exists.",
        ToastAndroid.SHORT,
      );
      return;
    }
    triggerHaptic();
    createNewPlaylist(playlistName);
    setModalVisible(false);
  };

  /**
   * Renders an individual section item (Favorites, Downloaded, etc.).
   * @param item - The section item to render.
   * @returns A View component representing a section.
   */
  const renderSection = useCallback(
    ({
      item,
    }: {
      item: {
        name: string;
        icon: keyof typeof MaterialCommunityIcons.glyphMap;
        path: Route;
      };
    }) => (
      <TouchableOpacity
        style={styles.sectionItem}
        onPress={() => {
          triggerHaptic();
          router.push(item.path);
        }}
      >
        <View style={styles.sectionIconBox}>
          <MaterialCommunityIcons
            name={item.icon}
            size={moderateScale(25)}
            color={"white"}
          />
        </View>
        <Text style={styles.sectionName}>{item.name}</Text>
      </TouchableOpacity>
    ),
    [router],
  );

  /**
   * Renders an individual playlist item.
   * @param item - The playlist item to render.
   * @returns A View component representing a playlist.
   */
  const renderPlaylist = useCallback(
    ({ item }: { item: { name: string; thumbnail: string | null } }) => (
      <View style={styles.playlistItem}>
        <TouchableOpacity
          style={styles.playlistItemTouchableArea}
          onPress={() => {
            triggerHaptic();
            // Navigate to the individual playlist screen.
            router.push({
              pathname: `/library/[playlistName]`,
              params: { playlistName: item.name },
            });
          }}
        >
          <FastImage
            source={{ uri: item.thumbnail ?? unknownTrackImageUri }}
            style={styles.thumbnail}
          />
          <Text style={styles.playlistName}>{item.name}</Text>
        </TouchableOpacity>
        {/* Options menu button for the playlist */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic();
            // Prepare playlist data for the menu modal.
            const playlistData = JSON.stringify({
              name: item.name,
              thumbnail: item.thumbnail,
            });

            // Navigate to the menu modal.
            router.push({
              pathname: "/(modals)/menu",
              params: { playlistData: playlistData, type: "playlist" },
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
    ),
    [router],
  );

  return (
    <View style={defaultStyles.container}>
      {/* Header Overlay */}
      <View
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          overflow: "hidden",
        }}
      >
        {/* Gradient background */}
        {isScrolling && (
          <LinearGradient
            colors={["rgba(0,0,0,1)", "rgba(0,0,0,0.9)"]}
            locations={[0.2, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        <Text style={[styles.header, { paddingTop: top }]}>Library</Text>

        {isScrolling && (
          <Divider
            style={{ backgroundColor: "rgba(255,255,255,0.3)", height: 0.3 }}
          />
        )}
      </View>

      <FlashList
        data={playlistArray}
        renderItem={renderPlaylist}
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: verticalScale(190) + bottom,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const currentScrollPosition =
            Math.floor(e.nativeEvent.contentOffset.y) || 0;
          setIsScrolling(currentScrollPosition > 5);
        }}
        keyExtractor={(item) => item.name}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View>
            {/* Sections List */}
            <FlashList
              data={sections}
              renderItem={renderSection}
              keyExtractor={(item) => item.name}
              scrollEnabled={false}
            />

            {/* Playlists header */}
            {playlistArray.length > 0 && (
              <Text style={styles.playlistHeader}>
                {`Playlist${playlistArray.length > 1 ? "s" : ""} (${
                  playlistArray.length
                })`}
              </Text>
            )}
          </View>
        }
      />

      {/* Floating Action Button to create a new playlist */}
      <AnimatedFAB
        style={{
          position: "absolute",
          marginRight: 16,
          marginBottom:
            (isFloatingPlayerNotVisible ? 60 : moderateScale(138)) + bottom,
          right: 0,
          bottom: 0,
          backgroundColor: "white",
        }}
        theme={{ roundness: 1 }}
        icon="plus"
        extended={!isScrolling}
        animateFrom={"right"}
        label="Create Playlist"
        color="black"
        onPress={() => {
          triggerHaptic();
          setModalVisible(true);
        }}
      />

      {/* Modal for creating a new playlist */}
      <CreatePlaylistModal
        visible={modalVisible}
        onCreate={handleCreatePlaylist}
        onCancel={() => {
          triggerHaptic();
          setModalVisible(false);
        }}
      />
    </View>
  );
}

// Styles for the LibraryScreen component.
const styles = ScaledSheet.create({
  header: {
    fontSize: "24@ms",
    color: Colors.text,
    fontFamily: "Meriva",
    textAlign: "center",
    paddingVertical: 10,
  },
  playlistHeader: {
    color: Colors.text,
    fontSize: "16@ms",
    marginBottom: "10@ms",
    marginLeft: 20,
    marginTop: "10@ms",
  },
  sectionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: "12@ms",
    paddingLeft: 20,
  },
  sectionIconBox: {
    height: "55@ms",
    width: "55@ms",
    textAlign: "center",
    marginRight: 20,
    borderRadius: 6,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionName: {
    fontSize: "16@ms",
    color: "white",
  },
  playlistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: "10@ms",
    paddingLeft: 20,
    paddingRight: 30,
  },
  playlistItemTouchableArea: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnail: {
    width: "55@ms",
    height: "55@ms",
    borderRadius: 8,
    marginRight: 15,
  },
  playlistName: {
    fontSize: "16@ms",
    color: "white",
    flex: 1,
  },
});
