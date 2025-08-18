/**
 * This file defines the `PlaylistScreen` component, which displays a list of
 * all user-created playlists. It allows users to navigate into a playlist to view its songs,
 * create new playlists, and access options to manage existing playlists.
 *
 * @packageDocumentation
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
import { Entypo } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
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
 * `PlaylistScreen` component.
 * Displays a list of user-created playlists.
 */
export default function PlaylistScreen() {
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
              pathname: `/(tabs)/playlists/[playlistName]`,
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

        <Text style={[styles.header, { paddingTop: top }]}>Playlists</Text>

        {isScrolling && (
          <Divider
            style={{ backgroundColor: "rgba(255,255,255,0.3)", height: 0.3 }}
          />
        )}
      </View>

      <FlashList
        data={playlistArray}
        renderItem={renderPlaylist}
        estimatedItemSize={moderateScale(75)}
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
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: Colors.text,
                textAlign: "center",
                fontSize: moderateScale(18),
                paddingHorizontal: 20,
              }}
            >
              No playlists found! {"\n"}Create a playlist and start adding your
              favorite songs.
            </Text>
          </View>
        }
        ListFooterComponent={
          playlistArray.length > 0 ? (
            <Text
              style={{
                color: Colors.textMuted,
                textAlign: "center",
                fontSize: moderateScale(15),
              }}
            >
              {playlistArray.length}{" "}
              {`Playlist${playlistArray.length > 1 ? "s" : ""}`}
            </Text>
          ) : null
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

// Styles for the PlaylistScreen component.
const styles = ScaledSheet.create({
  header: {
    fontSize: "24@ms",
    color: Colors.text,
    fontFamily: "Meriva",
    textAlign: "center",
    paddingVertical: 10,
  },
  playlistList: {
    flexDirection: "column",
    width: "100%",
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
