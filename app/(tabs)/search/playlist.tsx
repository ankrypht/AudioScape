/**
 * This file defines the `PlaylistView` component for remote playlists, which displays the contents
 * of a specific playlist. It shows the playlist's name, its songs, and allows users to
 * play individual songs or the entire playlist. It also provides options to manage songs within the playlist.
 */

import { useMusicPlayer } from "@/components/MusicPlayerContext";
import { Colors } from "@/constants/Colors";
import { unknownTrackImageUri } from "@/constants/images";
import { triggerHaptic } from "@/helpers/haptics";
import { useImageColors } from "@/hooks/useImageColors";
import { useLastActiveTrack } from "@/hooks/useLastActiveTrack";
import { innertube, processPlaylistPageData } from "@/services/youtube";
import { FlashList } from "@shopify/flash-list";
import FastImage from "@d11/react-native-fast-image";
import { Entypo, Ionicons } from "@expo/vector-icons";
import color from "color";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import LoaderKit from "react-native-loader-kit";
import { Divider, FAB } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ScaledSheet,
  moderateScale,
  scale,
  verticalScale,
} from "react-native-size-matters/extend";
import { useActiveTrack } from "react-native-track-player";

/**
 * `PlaylistView` component.
 * Displays the songs within a specific playlist.
 */
const PlaylistView = () => {
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [showHeaderTitle, setShowHeaderTitle] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [titleLayout, setTitleLayout] = useState({ y: 0, height: 0 });
  const [playlistData, setPlaylistData] = useState<PlaylistPageData>();
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const lastActiveTrack = useLastActiveTrack();
  const activeTrack = useActiveTrack();
  const { playAudio, playPlaylist } = useMusicPlayer();
  // Get the playlist name from local search parameters.
  const { id } = useLocalSearchParams<{ id: string }>();

  // Get playlist thumbnail colors.
  const { imageColors } = useImageColors(
    playlistData?.thumbnail ?? unknownTrackImageUri,
  );

  // Determine if the floating player should be visible.
  const isFloatingPlayerNotVisible = !(activeTrack ?? lastActiveTrack);

  useEffect(() => {
    const fetchPlaylistData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log(`Fetching data for album: ${id}`);
        const yt = await innertube;
        const album = await yt.music.getPlaylist(id);
        const albumPage = processPlaylistPageData(album);
        setPlaylistData(albumPage);
      } catch (error) {
        console.error("Error fetching artist data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistData();
  }, [id]);

  /**
   * Handles playing a selected song from the playlist.
   * @param song - The `Song` object to play.
   */
  const handleSongSelect = (song: Song) => {
    triggerHaptic();
    playAudio(song, playlistData?.songs);
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  const ListHeader = () => (
    <>
      {/* Playlist artwork */}
      <View style={styles.artworkImageContainer}>
        <FastImage
          source={{
            uri: playlistData?.thumbnail ?? unknownTrackImageUri,
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
        {playlistData?.title}
      </Text>

      <Text
        style={{
          color: Colors.text,
          textAlign: "center",
          fontSize: moderateScale(15),
          marginBottom: 5,
        }}
      >
        {playlistData?.subtitle}
      </Text>
      <Text
        style={{
          color: Colors.text,
          textAlign: "center",
          fontSize: moderateScale(15),
          marginBottom: 5,
        }}
      >
        {playlistData?.second_subtitle}
      </Text>
    </>
  );

  const renderSongItem = ({ item }: { item: Song }) => (
    <View style={styles.songItem}>
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
        onPress={() => {
          triggerHaptic();
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
  );

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
            onPress={() => {
              triggerHaptic();
              router.back();
            }}
          />

          <Text
            numberOfLines={1}
            style={[styles.headerText, !showHeaderTitle && { opacity: 0 }]}
          >
            {playlistData?.title}
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

        <FlashList
          data={playlistData?.songs}
          renderItem={renderSongItem}
          keyExtractor={(item: any) => item.id}
          extraData={activeTrack}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{
            paddingHorizontal: 15,
            paddingBottom: verticalScale(190) + bottom,
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
        />

        {/* Floating Action Button to play the entire playlist */}
        {playlistData?.songs && playlistData.songs.length > 0 && (
          <FAB
            style={{
              position: "absolute",
              marginRight: 16,
              marginBottom:
                (isFloatingPlayerNotVisible ? 60 : moderateScale(138)) + bottom,
              right: 0,
              bottom: 0,
              backgroundColor: "white",
            }}
            theme={{ roundness: 7 }}
            icon="play"
            color="black"
            onPress={async () => {
              triggerHaptic();
              if (playlistData.songs.length === 0) return;
              await playPlaylist(playlistData.songs);
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
  centeredContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
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
