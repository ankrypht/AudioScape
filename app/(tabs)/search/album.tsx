/**
 * This file defines the `AlbumPageScreen` component, which displays detailed
 * information about a specific music album. It fetches album data from YouTube Music,
 * including its artwork, title, artist, and a list of its songs. Users can play
 * individual songs or the entire album from this screen.
 */

import { useMusicPlayer } from "@/components/MusicPlayerContext";
import { Colors } from "@/constants/Colors";
import { unknownTrackImageUri } from "@/constants/images";
import { triggerHaptic } from "@/helpers/haptics";
import { useImageColors } from "@/hooks/useImageColors";
import { useLastActiveTrack } from "@/hooks/useLastActiveTrack";
import { innertube, processAlbumPageData } from "@/services/youtube";
import { FlashList } from "@shopify/flash-list";
import FastImage from "@d11/react-native-fast-image";
import { Entypo, Ionicons } from "@expo/vector-icons";
import color from "color";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
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
 * `AlbumPageScreen` component.
 * Displays a detailed page for a specific album.
 */
export default function AlbumPageScreen() {
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [showHeaderTitle, setShowHeaderTitle] = useState<boolean>(false);
  const { top, bottom } = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [albumData, setAlbumData] = useState<AlbumPageData>();
  const router = useRouter();
  const lastActiveTrack = useLastActiveTrack();
  const activeTrack = useActiveTrack();
  const { playAudio, playPlaylist } = useMusicPlayer();
  const [titleLayout, setTitleLayout] = useState({ y: 0, height: 0 });
  const { id, artist } = useLocalSearchParams<{ id: string; artist: string }>();

  const { imageColors } = useImageColors(
    albumData?.thumbnail ?? unknownTrackImageUri,
  );

  const playableSongList =
    albumData?.songs?.map(({ duration, ...rest }) => ({
      ...rest,
      artist: artist,
      thumbnail: albumData?.thumbnail ?? unknownTrackImageUri,
    })) ?? [];

  const isFloatingPlayerNotVisible = !(activeTrack ?? lastActiveTrack);

  useEffect(() => {
    /**
     * Fetches the album's data from the YouTube Music API.
     */
    const fetchAlbumData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log(`Fetching data for album: ${id}`);
        const yt = await innertube;
        const album = await yt.music.getAlbum(id);
        const albumPage = processAlbumPageData(album);
        setAlbumData(albumPage);
      } catch (error) {
        console.error("Error fetching artist data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumData();
  }, [id]);

  /**
   * Handles playing a selected song from the playlist.
   * @param song - The `Song` object to play.
   * @param playList - An optional list of songs to play after the selected song.
   */
  const handleSongSelect = (song: Song, playList?: Song[]) => {
    playAudio(song, playList);
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  /**
   * Renders the header component for the album page.
   * @returns The rendered header component.
   */
  const ListHeader = () => (
    <>
      {/* Artwork Image */}
      <View style={styles.artworkImageContainer}>
        <FastImage
          source={{
            uri: albumData?.thumbnail ?? unknownTrackImageUri,
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
        {albumData?.title}
      </Text>

      <Text
        style={{
          color: Colors.text,
          textAlign: "center",
          fontSize: moderateScale(15),
          marginBottom: 5,
        }}
      >
        {albumData?.subtitle}
      </Text>
      <Text
        style={{
          color: Colors.text,
          textAlign: "center",
          fontSize: moderateScale(15),
          marginBottom: 5,
        }}
      >
        {albumData?.second_subtitle}
      </Text>
    </>
  );

  /**
   * Renders a song item from the album.
   * @param item - The song item to render.
   * @param index - The index of the song in the list.
   * @returns The rendered song item component.
   */
  const renderSongItem = ({ item, index }: { item: any; index: number }) => (
    <View key={item.id + index} style={styles.songItem}>
      <TouchableOpacity
        style={styles.songItemTouchableArea}
        onPress={() => {
          triggerHaptic();
          handleSongSelect(
            {
              id: item.id,
              title: item.title,
              artist: artist,
              thumbnail: albumData?.thumbnail ?? unknownTrackImageUri,
            },
            playableSongList,
          );
        }}
      >
        <View style={styles.indexContainer}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>
        <View style={styles.resultText}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.resultArtist} numberOfLines={1}>
            {item.duration}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          triggerHaptic();
          // Convert the song object to a JSON string
          const songData = JSON.stringify({
            id: item.id,
            title: item.title,
            artist: artist,
            thumbnail: albumData?.thumbnail ?? unknownTrackImageUri,
          });

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
            style={[styles.headerText, !showHeaderTitle && { opacity: 0 }, ,]}
          >
            {albumData?.title}
          </Text>
        </View>

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
          data={albumData?.songs}
          renderItem={renderSongItem}
          keyExtractor={(item: any) => item.id}
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

        {albumData?.songs && albumData?.songs.length > 0 && (
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
              if (albumData?.songs.length === 0) return;
              await playPlaylist(playableSongList);
              await router.navigate("/player");
            }}
          />
        )}
      </View>
    </LinearGradient>
  );
}

// Styles for the AlbumPageScreen component.
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
    paddingLeft: 0,
  },
  songItemTouchableArea: {
    flexDirection: "row",
    alignItems: "center",
    width: scale(370) - 60,
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
