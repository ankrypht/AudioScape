/**
 * This file defines the `PlaylistScreen` component, which displays a list of
 * all user-created playlists. It allows users to navigate into a playlist to view its songs,
 * create new playlists, and access options to manage existing playlists.
 *
 * @packageDocumentation
 */

import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import FastImage from "@d11/react-native-fast-image";
import { Colors } from "@/constants/Colors";
import { unknownTrackImageUri } from "@/constants/images";
import { usePlaylists } from "@/store/library";
import { useRouter } from "expo-router";
import { FAB, Divider } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLastActiveTrack } from "@/hooks/useLastActiveTrack";
import { useActiveTrack } from "react-native-track-player";
import { Entypo } from "@expo/vector-icons";
import { FullScreenGradientBackground } from "@/components/GradientBackground";
import CreatePlaylistModal from "@/app/(modals)/createPlaylist";
import { defaultStyles } from "@/styles";
import {
  ScaledSheet,
  moderateScale,
  verticalScale,
} from "react-native-size-matters/extend";

// Randomly select a gradient background for the screen.
const gradientIndex = Math.floor(Math.random() * 12);

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
  const [modalVisible, setModalVisible] = useState(false);

  // Determine if the floating player should be visible.
  const isFloatingPlayerNotVisible = !(activeTrack ?? lastActiveTrack);

  // Convert the playlists object into an array for rendering.
  const playlistArray = Object.entries(playlists).map(([name, tracks]) => ({
    name,
    thumbnail: tracks.length > 0 ? tracks[0].thumbnail : null,
  }));

  /**
   * Handles the creation of a new playlist.
   * @param playlistName - The name of the new playlist.
   */
  const handleCreatePlaylist = (playlistName: string) => {
    if (playlists[playlistName]) {
      console.warn("A playlist with this name already exists.");
      return;
    }
    createNewPlaylist(playlistName);
    setModalVisible(false);
  };

  /**
   * Renders an individual playlist item.
   * @param item - The playlist item to render.
   * @returns A View component representing a playlist.
   */
  const renderPlaylist = ({
    item,
  }: {
    item: { name: string; thumbnail: string | null };
  }) => (
    <View key={item.name} style={styles.playlistItem}>
      <TouchableOpacity
        style={styles.playlistItemTouchableArea}
        onPress={() => {
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
        activeOpacity={0.5}
        onPress={() => {
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
  );

  return (
    <FullScreenGradientBackground index={gradientIndex}>
      <View style={defaultStyles.container}>
        {/* Header with screen title */}
        <Text
          style={[
            styles.header,
            isScrolling ? styles.headerScrolled : {},
            { paddingTop: top },
          ]}
        >
          Playlists
        </Text>

        {/* Divider that appears when scrolling */}
        {isScrolling && (
          <Divider
            style={{ backgroundColor: "rgba(255,255,255,0.3)", height: 0.3 }}
          />
        )}

        <ScrollView
          style={styles.playlistList}
          contentContainerStyle={[
            { paddingBottom: verticalScale(190) + bottom },
            playlistArray.length === 0 && { flex: 1 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            const currentScrollPosition =
              Math.floor(e.nativeEvent.contentOffset.y) || 0;
            setIsScrolling(currentScrollPosition > 5);
          }}
          scrollEventThrottle={16}
        >
          {/* Message when no playlists are found */}
          {playlistArray.length === 0 ? (
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
                No playlists found! {"\n"}Create a playlist and start adding
                your favorite songs.
              </Text>
            </View>
          ) : (
            // Render each playlist item.
            playlistArray.map((item) => renderPlaylist({ item }))
          )}
          {/* Display total number of playlists */}
          {playlistArray.length !== 0 && (
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
          )}
        </ScrollView>

        {/* Floating Action Button to create a new playlist */}
        <FAB
          style={{
            borderRadius: 20,
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
          customSize={moderateScale(56)}
          label="Create Playlist"
          color="black"
          onPress={() => setModalVisible(true)}
        />

        {/* Modal for creating a new playlist */}
        <CreatePlaylistModal
          visible={modalVisible}
          onCreate={handleCreatePlaylist}
          onCancel={() => setModalVisible(false)}
        />
      </View>
    </FullScreenGradientBackground>
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
  headerScrolled: {
    backgroundColor: "rgba(0,0,0,0.3)",
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
