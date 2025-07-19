/**
 * This file defines the `DownloadsScreen` component, which displays a list of
 * songs that have been downloaded to the device. It allows users to play downloaded songs,
 * view active downloads with progress, and manage their local music library.
 *
 * @packageDocumentation
 */

import React, { useState, useMemo } from "react";
import { defaultStyles } from "@/styles";
import {
  TouchableOpacity,
  ActivityIndicator,
  View,
  Text,
  ScrollView,
} from "react-native";
import FastImage from "@d11/react-native-fast-image";
import LoaderKit from "react-native-loader-kit";
import Entypo from "@expo/vector-icons/Entypo";
import { Divider, AnimatedFAB } from "react-native-paper";
import { unknownTrackImageUri } from "@/constants/images";
import { useRouter } from "expo-router";
import { useLastActiveTrack } from "@/hooks/useLastActiveTrack";
import { useActiveTrack } from "react-native-track-player";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMusicPlayer } from "@/components/MusicPlayerContext";
import { FullScreenGradientBackground } from "@/components/GradientBackground";
import { Colors } from "@/constants/Colors";
import {
  ScaledSheet,
  moderateScale,
  verticalScale,
} from "react-native-size-matters/extend";
import {
  useDownloadedTracks,
  DownloadedSongMetadata,
  useActiveDownloads,
} from "@/store/library";

// Randomly select a gradient background for the screen.
const gradientIndex = Math.floor(Math.random() * 11);

/**
 * `DownloadsScreen` component.
 * Displays a list of downloaded songs and active downloads.
 */
const DownloadsScreen = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const { top, bottom } = useSafeAreaInsets();
  const { playDownloadedSong, playAllDownloadedSongs } = useMusicPlayer();
  const lastActiveTrack = useLastActiveTrack();
  const activeTrack = useActiveTrack();
  const router = useRouter();

  // Fetch downloaded tracks and active downloads from the Redux store.
  const downloadedTracksMeta = useDownloadedTracks();
  const activeDownloads = useActiveDownloads();

  // Determine if the floating player should be visible.
  const isFloatingPlayerNotVisible = !(activeTrack ?? lastActiveTrack);

  // Memoize and format downloaded tracks for rendering.
  const formattedTracks: DownloadedSongMetadata[] = useMemo(() => {
    setIsLoading(true);
    const tracks = [...downloadedTracksMeta].reverse(); // Display newest first.
    setIsLoading(false);
    return tracks;
  }, [downloadedTracksMeta]);

  /**
   * Handles playing a single downloaded song.
   * @param song - The `DownloadedSongMetadata` of the song to play.
   */
  const handleSongSelect = (song: DownloadedSongMetadata) => {
    playDownloadedSong(song, formattedTracks);
  };

  /**
   * Handles playing all downloaded songs.
   */
  const handlePlayAllDownloads = async () => {
    if (formattedTracks.length === 0) return;
    await playAllDownloadedSongs(formattedTracks);
    await router.navigate("/player");
  };

  /**
   * Handles opening the menu for a specific downloaded song.
   * @param song - The `DownloadedSongMetadata` of the song to open the menu for.
   */
  const handleOpenMenu = (song: DownloadedSongMetadata) => {
    // Find the original metadata to ensure all necessary fields are passed.
    const originalMetadata = downloadedTracksMeta.find((m) => m.id === song.id);
    if (!originalMetadata) return;

    // Prepare song data for the menu modal.
    const songDataForMenu = JSON.stringify({
      id: originalMetadata.id,
      title: originalMetadata.title,
      artist: originalMetadata.artist,
      thumbnail: originalMetadata.localArtworkUri,
      url: originalMetadata.localTrackUri,
      duration: originalMetadata.duration,
    });

    // Navigate to the menu modal.
    router.push({
      pathname: "/(modals)/menu",
      params: { songData: songDataForMenu, type: "downloadedSong" },
    });
  };

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
          Downloads
        </Text>

        {/* Divider that appears when scrolling */}
        {isScrolling && (
          <Divider
            style={{ backgroundColor: "rgba(255,255,255,0.3)", height: 0.3 }}
          />
        )}

        {/* Loading indicator */}
        {isLoading ? (
          <View style={styles.centeredMessageContainer}>
            <ActivityIndicator color={Colors.text} size="large" />
          </View>
        ) : (
          <ScrollView
            style={styles.songList}
            contentContainerStyle={[
              { paddingBottom: verticalScale(190) + bottom },
              formattedTracks.length === 0 &&
                activeDownloads.length === 0 &&
                styles.centeredMessageContainer,
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={(e) => {
              const currentScrollPosition =
                Math.floor(e.nativeEvent.contentOffset.y) || 0;
              setIsScrolling(currentScrollPosition > 5);
            }}
            scrollEventThrottle={16}
          >
            {/* Message when no songs are downloaded */}
            {formattedTracks.length === 0 && activeDownloads.length === 0 ? (
              <Text style={styles.centeredMessageText}>
                No songs downloaded yet! {"\n"}Find songs and tap the download
                icon.
              </Text>
            ) : (
              <>
                {/* Display active downloads */}
                {activeDownloads.length > 0 && (
                  <View style={{ marginBottom: 10 }}>
                    {activeDownloads.map((song) => (
                      <View key={song.id} style={styles.songItem}>
                        <FastImage
                          source={{
                            uri: song.thumbnail ?? unknownTrackImageUri,
                          }}
                          style={[styles.resultThumbnail, { opacity: 0.6 }]}
                        />
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={styles.resultTitle}>
                            {song.title}
                          </Text>
                          <Text style={styles.resultArtist}>
                            {song.progress.toFixed(0)}%
                          </Text>
                          {/* Simple progress bar for active downloads */}
                          <View style={styles.progressBarBackground}>
                            <View
                              style={[
                                styles.progressBarFill,
                                { width: `${Math.floor(song.progress)}%` },
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                {/* Display downloaded songs */}
                {formattedTracks.map((item) => (
                  <View key={item.id} style={styles.songItem}>
                    <TouchableOpacity
                      style={styles.songItemTouchableArea}
                      onPress={() => handleSongSelect(item)}
                    >
                      <FastImage
                        source={{
                          uri: item.localArtworkUri ?? unknownTrackImageUri,
                        }}
                        style={styles.resultThumbnail}
                      />
                      {/* Playing indicator for downloaded active track */}
                      {activeTrack?.id === item.id &&
                        activeTrack.url === item.localTrackUri && (
                          <LoaderKit
                            style={styles.trackPlayingIconIndicator}
                            name="LineScalePulseOutRapid"
                            color={"white"}
                          />
                        )}
                      <View style={styles.resultText}>
                        <Text style={styles.resultTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.resultArtist} numberOfLines={1}>
                          {item.artist}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Options menu button for downloaded song */}
                    <TouchableOpacity
                      activeOpacity={0.5}
                      onPress={() => handleOpenMenu(item)}
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                      <Entypo
                        name="dots-three-vertical"
                        size={moderateScale(15)}
                        color={"white"}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            {/* Display total number of downloaded tracks */}
            {formattedTracks.length > 0 && (
              <Text style={styles.trackCountText}>
                {formattedTracks.length}{" "}
                {`Track${formattedTracks.length > 1 ? "s" : ""}`}
              </Text>
            )}
          </ScrollView>
        )}

        {/* Floating Action Button to play all downloaded songs */}
        {formattedTracks.length > 0 && (
          <AnimatedFAB
            style={[
              styles.fab,
              {
                marginBottom:
                  (isFloatingPlayerNotVisible ? 60 : moderateScale(138)) +
                  bottom,
              },
            ]}
            theme={{ roundness: 1 }}
            extended={!isScrolling}
            animateFrom={"right"}
            icon="play"
            label="Play All"
            color="black"
            onPress={handlePlayAllDownloads}
          />
        )}
      </View>
    </FullScreenGradientBackground>
  );
};

export default DownloadsScreen;

// Styles for the DownloadsScreen component.
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
  songList: {
    flexDirection: "column",
    width: "100%",
  },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: "10@ms",
    paddingLeft: 20,
    paddingRight: 30,
  },
  songItemTouchableArea: {
    flexDirection: "row",
    alignItems: "center",
  },
  resultThumbnail: {
    width: "55@ms",
    height: "55@ms",
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)", // Placeholder bg for image.
  },
  trackPlayingIconIndicator: {
    position: "absolute",
    top: "18@ms",
    left: "19@ms",
    width: "20@ms",
    height: "20@ms",
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    color: Colors.text,
    fontSize: "16@ms",
  },
  resultArtist: {
    color: Colors.textMuted,
    fontSize: "14@ms",
  },
  centeredMessageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "20@s",
  },
  centeredMessageText: {
    color: Colors.text,
    textAlign: "center",
    fontSize: "18@ms",
    lineHeight: "26@ms",
  },
  trackCountText: {
    color: Colors.textMuted,
    textAlign: "center",
    fontSize: "15@ms",
  },
  fab: {
    position: "absolute",
    marginRight: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "white",
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 4,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.textMuted,
  },
});
