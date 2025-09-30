/**
 * This file defines the `QueueModal` component, a modal screen that displays
 * the current playback queue of songs. Users can view the order of upcoming tracks,
 * see the currently playing song, and jump to any song in the queue.
 */

import VerticalDismiss from "@/components/navigation/VerticalArrowDismiss";
import { Colors } from "@/constants/Colors";
import { unknownTrackImageUri } from "@/constants/images";
import { triggerHaptic } from "@/helpers/haptics";
import FastImage from "@d11/react-native-fast-image";
import { Entypo } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import LoaderKit from "react-native-loader-kit";
import { Divider } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScaledSheet, moderateScale } from "react-native-size-matters/extend";
import TrackPlayer, {
  Event,
  Track,
  useActiveTrack,
  useTrackPlayerEvents,
} from "react-native-track-player";

/**
 * `QueueModal` component.
 * Displays the current music playback queue.
 * @returns The rendered queue modal component.
 */
export default function QueueModal() {
  const [queue, setQueue] = useState<Track[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const activeTrack = useActiveTrack();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const activeTrackId = activeTrack?.id;

  /**
   * Fetches the current queue and active track index from TrackPlayer.
   * @returns A promise that resolves when the queue is fetched.
   */
  const fetchQueue = useCallback(async () => {
    const currentQueue = await TrackPlayer.getQueue();
    setQueue(currentQueue);
    const activeIndex = await TrackPlayer.getActiveTrackIndex();

    if (activeIndex !== undefined && activeIndex !== null)
      setActiveIndex(activeIndex);
    else setActiveIndex(0);
  }, []);

  // Fetch queue on component mount.
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Set up polling to check for queue changes periodically.
  useEffect(() => {
    const intervalId = setInterval(fetchQueue, 2000); // Check every 2 seconds.

    // Clean up interval on component unmount.
    return () => clearInterval(intervalId);
  }, [fetchQueue]);

  // Listen for TrackPlayer events to update the queue in real-time.
  useTrackPlayerEvents(
    [Event.PlaybackQueueEnded, Event.PlaybackActiveTrackChanged],
    fetchQueue,
  );

  /**
   * Handles selecting a song from the queue, skipping to that song.
   * @param song - The selected song from the queue.
   */
  const handleSongSelect = useCallback(
    async (song: Track) => {
      triggerHaptic();
      await TrackPlayer.skip(queue.indexOf(song));
    },
    [queue],
  );

  /**
   * Renders an individual song item in the FlashList.
   * @param item - The song item to render.
   * @param index - Its index in the queue.
   * @returns A View component representing a song in the queue.
   */
  const renderSongItem = useCallback(
    ({ item, index }: { item: Track; index: number }) => (
      <View
        key={item.id}
        style={[
          styles.songItem,
          activeTrackId === item.id && styles.activeSongItem, // Highlight active song.
        ]}
      >
        <TouchableOpacity
          style={styles.songItemTouchableArea}
          onPress={() => handleSongSelect(item)}
        >
          {/* Song index in the queue */}
          <View style={styles.indexContainer}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
          {/* Song artwork */}
          <FastImage
            source={{ uri: item.artwork ?? unknownTrackImageUri }}
            style={styles.thumbnail}
          />
          {/* Playing indicator for the active track */}
          {activeTrack?.id === item.id && (
            <LoaderKit
              style={styles.trackPlayingIconIndicator}
              name="LineScalePulseOutRapid"
              color={"white"}
            />
          )}
          {/* Song title and artist */}
          <View style={styles.songText}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.songArtist} numberOfLines={1}>
              {item.artist}
            </Text>
          </View>

          {/* Options menu button for the song */}
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              // Prepare song data for the menu modal.
              const songData = JSON.stringify({
                id: item.id,
                title: item.title,
                artist: item.artist,
                thumbnail: item.artwork ?? unknownTrackImageUri,
              });

              // Navigate to the menu modal with song details.
              router.push({
                pathname: "/(modals)/menu",
                params: { songData: songData, type: "queueSong" },
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
        </TouchableOpacity>
      </View>
    ),
    [activeTrack, activeTrackId, handleSongSelect, router],
  );

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
              {/* Modal title showing current song index and total queue length */}
              <Text style={styles.modalTitle}>
                Queue ({activeIndex + 1}/{queue.length})
              </Text>
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

            {/* FlashList to display the song queue */}
            <View style={{ flex: 1 }}>
              <FlashList
                data={queue}
                keyExtractor={(item) => item.id}
                renderItem={renderSongItem}
                extraData={activeTrackId}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
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
          </View>
        </View>
      )}
    </VerticalDismiss>
  );
}

// Styles for the QueueModal component.
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
    paddingTop: 15,
    maxHeight: "60%",
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingLeft: 20,
  },
  dismissButton: {
    marginTop: -11,
  },
  modalTitle: {
    fontSize: "18@ms",
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 10,
    marginLeft: 10,
  },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: "10@ms",
    paddingHorizontal: 5,
    marginHorizontal: 5,
  },
  activeSongItem: {
    backgroundColor: "rgba(255, 255, 255, 0.045)", // Subtle highlight for active track.
    borderRadius: 16,
  },
  songItemTouchableArea: {
    flexDirection: "row",
    alignItems: "center",
  },
  indexContainer: {
    width: "40@ms",
    alignItems: "center",
  },
  indexText: {
    color: "#888",
    fontSize: "18@ms",
    fontWeight: "bold",
  },
  thumbnail: {
    width: "50@ms",
    height: "50@ms",
    borderRadius: 8,
    marginRight: 15,
  },
  trackPlayingIconIndicator: {
    position: "absolute",
    top: "15@ms",
    left: "56@ms",
    width: "20@ms",
    height: "20@ms",
  },
  songText: {
    flex: 1,
  },
  songTitle: {
    color: Colors.text,
    fontSize: "16@ms",
  },
  songArtist: {
    color: Colors.textMuted,
    fontSize: "14@ms",
  },
});
