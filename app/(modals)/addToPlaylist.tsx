/**
 * This file defines the `AddToPlaylistModal` component, a modal screen
 * that allows users to add the currently playing or selected song to an existing playlist
 * or create a new one. It integrates with the Redux store for playlist management.
 *
 * @packageDocumentation
 */

import CreatePlaylistModal from "@/app/(modals)/createPlaylist";
import VerticalDismiss from "@/components/navigation/VerticalArrowDismiss";
import { Colors } from "@/constants/Colors";
import { unknownTrackImageUri } from "@/constants/images";
import { triggerHaptic } from "@/helpers/haptics";
import { usePlaylists } from "@/store/library";
import FastImage from "@d11/react-native-fast-image";
import { Entypo } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { Divider } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScaledSheet, moderateScale } from "react-native-size-matters/extend";
import { useActiveTrack } from "react-native-track-player";

/**
 * `AddToPlaylistModal` component.
 * Displays a list of existing playlists and an option to create a new one.
 * Allows adding the current or a specified song to a selected playlist.
 *
 * @returns The rendered modal component.
 */
export default function AddToPlaylistModal() {
  const { playlists, addTrackToPlaylist, createNewPlaylist } = usePlaylists();
  const { bottom } = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const activeTrack = useActiveTrack();
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Convert the playlists object into an array for FlatList rendering.
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

  // Determine the track to add: either from navigation params or the active track.
  const trackFromParams = useMemo(() => {
    return params?.track ? JSON.parse(params.track as string) : null;
  }, [params]);

  const track =
    trackFromParams ??
    (activeTrack
      ? {
          id: activeTrack.id,
          title: activeTrack.title || "",
          artist: activeTrack.artist || "",
          thumbnail: activeTrack.artwork || "https://placehold.co/50",
        }
      : undefined);

  /**
   * Renders an individual playlist item in the FlatList.
   * @param item - The playlist item to render.
   * @param handleDismiss - Function to dismiss the modal.
   * @returns A TouchableOpacity component representing a playlist.
   */
  const renderPlaylistItem = (
    { item }: { item: { name: string; thumbnail: string | null } },
    handleDismiss: () => void,
  ) => {
    return (
      <TouchableOpacity
        style={styles.playlistItem}
        onPress={() => {
          triggerHaptic();
          ToastAndroid.show(`Added song to ${item.name}`, ToastAndroid.SHORT);
          if (track) addTrackToPlaylist(track, item.name);
          handleDismiss(); // Dismiss the modal after adding.
          console.log(`Selected playlist: ${item.name}`);
        }}
      >
        <FastImage
          source={{ uri: item.thumbnail ?? unknownTrackImageUri }}
          style={styles.thumbnail}
        />
        <Text style={styles.playlistName}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <VerticalDismiss>
      {(handleDismiss) => (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              {/* Dismiss button */}
              <Entypo
                name="chevron-down"
                size={moderateScale(28)}
                style={styles.dismissButton}
                activeOpacity={0.7}
                color={Colors.text}
                onPress={handleDismiss}
              />

              <Text style={styles.modalTitle}>Choose a playlist</Text>

              {/* Button to create a new playlist */}
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => {
                  triggerHaptic();
                  setModalVisible(true);
                }}
              >
                <Text style={styles.createButtonText}>+ New Playlist</Text>
              </TouchableOpacity>
            </View>

            {/* Divider that appears when scrolling */}
            {isScrolling && (
              <Divider
                style={{
                  backgroundColor: "rgba(255,255,255,0.3)",
                  height: 0.3,
                }}
              />
            )}

            {/* List of playlists */}
            <View>
              <FlatList
                data={playlistArray}
                keyExtractor={(item) => item.name}
                renderItem={(props) => renderPlaylistItem(props, handleDismiss)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  flexGrow: 1,
                  paddingBottom: bottom + 10,
                }}
                onScroll={(e) => {
                  const currentScrollPosition =
                    Math.floor(e.nativeEvent.contentOffset.y) || 0;
                  setIsScrolling(currentScrollPosition > 5);
                }}
                scrollEventThrottle={16}
              />
            </View>

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
        </View>
      )}
    </VerticalDismiss>
  );
}

// Styles for the AddToPlaylistModal component.
const styles = ScaledSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  modalContent: {
    backgroundColor: "#101010",
    borderTopLeftRadius: "25@ms",
    borderTopRightRadius: "25@ms",
    paddingVertical: 20,
    maxHeight: "60%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  dismissButton: {
    position: "absolute",
    left: 20,
    top: "3@vs",
  },
  modalTitle: {
    fontSize: "18@ms",
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 10,
    marginLeft: "35@s",
  },
  playlistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  thumbnail: {
    width: "50@ms",
    height: "50@ms",
    borderRadius: 8,
    marginRight: 15,
  },
  playlistName: {
    fontSize: "16@ms",
    color: Colors.text,
  },
  createButton: {
    backgroundColor: "white",
    paddingVertical: "9@ms",
    paddingHorizontal: "18@ms",
    borderRadius: 20,
    marginBottom: 10,
  },
  createButtonText: {
    color: "black",
    fontSize: "12@ms",
    fontWeight: "bold",
  },
});
