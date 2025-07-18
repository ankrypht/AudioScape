/**
 * This file defines the `PlaylistView` component, which displays the contents
 * of a specific playlist. It shows the playlist's name, its songs, and allows users to
 * play individual songs or the entire playlist. It also provides options to manage songs within the playlist.
 *
 * @packageDocumentation
 */

import React, { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { unknownTrackImageUri } from "@/constants/images";
import { FAB, Divider } from "react-native-paper";
import LoaderKit from "react-native-loader-kit";
import color from "color";
import { LinearGradient } from "expo-linear-gradient";
import { useLastActiveTrack } from "@/hooks/useLastActiveTrack";
import { useActiveTrack } from "react-native-track-player";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMusicPlayer } from "@/components/MusicPlayerContext";
import { usePlaylists } from "@/store/library";
import { useImageColors } from "@/hooks/useImageColors";
import { Ionicons, Entypo } from "@expo/vector-icons";
import FastImage from "@d11/react-native-fast-image";
import {
  ScaledSheet,
  moderateScale,
  verticalScale,
  scale,
} from "react-native-size-matters/extend";

/**
 * `PlaylistView` component.
 * Displays the songs within a specific playlist.
 */
const PlaylistView = () => {
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [showHeaderTitle, setShowHeaderTitle] = useState<boolean>(false);
  const [titleLayout, setTitleLayout] = useState({ y: 0, height: 0 });
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const lastActiveTrack = useLastActiveTrack();
  const activeTrack = useActiveTrack();
  const { playAudio, playPlaylist } = useMusicPlayer();
  // Get the playlist name from local search parameters.
  const { playlistName } = useLocalSearchParams<{ playlistName: string }>();

  // Fetch playlists from the Redux store.
  const { playlists } = usePlaylists();

  // Get the specific playlist data.
  const playlist = playlists[playlistName];

  // Get playlist thumbnail colors.
  const { imageColors } = useImageColors(
    playlist[0]?.thumbnail ?? unknownTrackImageUri,
  );

  // Determine if the floating player should be visible.
  const isFloatingPlayerNotVisible = !(activeTrack ?? lastActiveTrack);

  /**
   * Handles playing a selected song from the playlist.
   * @param song - The `Song` object to play.
   */
  const handleSongSelect = (song: Song) => {
    playAudio(song, playlist);
  };

  return (
    <LinearGradient
      style={{ flex: 1 }}
      colors={
        imageColors
          ? [color(imageColors.average).darken(0.2).hex(), "#000"]
          : [Colors.background, "#000"]
      }
    >
      <View style={styles.container}>
        {/* Header with back button and playlist name */}
        <View
          style={[
            styles.header,
            isScrolling ? styles.headerScrolled : {},
            { paddingTop: top },
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(28)}
            color={Colors.text}
            style={{
              paddingLeft: 15,
              paddingRight: 10,
              marginTop: 2,
            }}
            onPress={() => router.back()}
          />

          <Text
            numberOfLines={1}
            style={[
              styles.headerText,
              !showHeaderTitle && { color: "transparent" },
            ]}
          >
            {playlistName}
          </Text>
        </View>

        {/* Divider that appears when scrolling */}
        {isScrolling && (
          <Divider
            style={{
              backgroundColor: "rgba(255,255,255,0.3)",
              height: 0.3,
              marginHorizontal: -15,
            }}
          />
        )}

        <ScrollView
          contentContainerStyle={{
            paddingBottom: verticalScale(190) + bottom,
            paddingHorizontal: 15,
          }}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            const currentScrollPosition =
              Math.floor(e.nativeEvent.contentOffset.y) || 0;
            setIsScrolling(currentScrollPosition > 0);
            setShowHeaderTitle(
              currentScrollPosition > titleLayout.y + titleLayout.height,
            );
          }}
          scrollEventThrottle={16}
        >
          {/* Playlist artwork (first song's thumbnail) */}
          <View style={styles.artworkImageContainer}>
            <FastImage
              source={{
                uri: playlist[0]?.thumbnail ?? unknownTrackImageUri,
                priority: FastImage.priority.high,
              }}
              style={styles.artworkImage}
            />
          </View>

          <Text
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              setTitleLayout({ y: layout.y, height: layout.height });
            }}
            style={styles.titleText}
          >
            {playlistName}
          </Text>

          {/* Display total number of tracks in the playlist */}
          {playlist.length !== 0 && (
            <Text
              style={{
                color: Colors.text,
                textAlign: "center",
                fontSize: moderateScale(15),
                marginBottom: 5,
              }}
            >
              {playlist.length} {`Track${playlist.length > 1 ? "s" : ""}`}
            </Text>
          )}

          {/* List of songs in the playlist */}
          <View>
            {playlist.map((item: Song) => (
              <View key={item.id} style={styles.songItem}>
                <TouchableOpacity
                  style={styles.songItemTouchableArea}
                  onPress={() => handleSongSelect(item)}
                >
                  <FastImage
                    source={{ uri: item.thumbnail }}
                    style={styles.resultThumbnail}
                  />
                  {/* Playing indicator for the active track */}
                  {activeTrack?.id === item.id && (
                    <LoaderKit
                      style={styles.trackPlayingIconIndicator}
                      name="LineScalePulseOutRapid"
                      color="white"
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
                {/* Options menu button for the song */}
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

                    // Navigate to the menu modal.
                    router.push({
                      pathname: "/(modals)/menu",
                      params: {
                        songData: songData,
                        type: "playlistSong",
                        playlistName: playlistName,
                      },
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
            ))}
          </View>
        </ScrollView>

        {/* Floating Action Button to play the entire playlist */}
        {playlist.length > 0 && (
          <FAB
            style={{
              borderRadius: 50,
              position: "absolute",
              marginRight: 16,
              marginBottom:
                (isFloatingPlayerNotVisible ? 60 : moderateScale(138)) + bottom,
              right: 0,
              bottom: 0,
              backgroundColor: "white",
            }}
            customSize={moderateScale(56)}
            theme={{ roundness: 7 }}
            icon="play"
            color="black"
            onPress={async () => {
              if (playlist.length === 0) return;
              await playPlaylist(playlist);
              await router.navigate("/player");
            }}
          />
        )}
      </View>
    </LinearGradient>
  );
};

export default PlaylistView;

// Styles for the PlaylistView component.
const styles = ScaledSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingBottom: 10,
  },
  headerText: {
    fontSize: "20@ms",
    fontWeight: "bold",
    color: Colors.text,
    textAlign: "left",
    width: "82%",
  },
  headerScrolled: {
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  artworkImageContainer: {
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 11,
    borderRadius: 12,
    alignSelf: "center",
    height: "240@ms",
    width: "240@ms",
    marginBottom: 10,
  },
  artworkImage: {
    width: "240@ms",
    height: "240@ms",
    resizeMode: "cover",
    borderRadius: 12,
  },
  titleText: {
    fontSize: "24@ms",
    fontWeight: "bold",
    color: Colors.text,
    marginHorizontal: 15,
    textAlign: "center",
    marginBottom: 5,
  },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  songItemTouchableArea: {
    flexDirection: "row",
    alignItems: "center",
    width: scale(360) - 60,
  },
  resultThumbnail: {
    width: "55@ms",
    height: "55@ms",
    marginRight: 10,
    borderRadius: 8,
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
});
