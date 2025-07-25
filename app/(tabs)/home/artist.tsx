/**
 * This file defines the `ArtistPageScreen` component, which displays detailed
 * information about a specific music artist. It fetches artist data from YouTube Music,
 * including their top songs, albums, singles, and videos. Users can play individual
 * songs or navigate to album/video detail pages from this screen.
 *
 * @packageDocumentation
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import FastImage from "@d11/react-native-fast-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Entypo } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  innertube,
  processArtistPageData,
  processItems,
} from "@/services/youtube";
import { Colors } from "@/constants/Colors";
import { useMusicPlayer } from "@/components/MusicPlayerContext";
import {
  moderateScale,
  verticalScale,
  scale,
  ScaledSheet,
} from "react-native-size-matters/extend";
import { YTMusic } from "youtubei.js";

const HEADER_HEIGHT = 300;

export default function ArtistPageScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [artist, setArtist] = useState<YTMusic.Artist>();
  const [artistData, setArtistData] = useState<ArtistPageData>();
  const [loading, setLoading] = useState(true);
  const { playAudio } = useMusicPlayer();
  const artistId = params.id as string;

  useEffect(() => {
    const fetchArtistData = async () => {
      if (!artistId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log(`Fetching data for artist: ${artistId}`);
        const yt = await innertube;
        const artist = await yt.music.getArtist(artistId);
        setArtist(artist);
        const artistPage = processArtistPageData(artist);
        setArtistData(artistPage);
      } catch (error) {
        console.error("Error fetching artist data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [artistId]);

  const handleSongSelect = (song: Song) => {
    playAudio(song);
  };

  /**
   * Renders a song item for the artist's page.
   * @param item - The song item to render.
   * @returns A View component representing the song item.
   */
  const renderSong = ({ item }: { item: Song }) => (
    <View key={item.id} style={styles.song}>
      <TouchableOpacity
        style={styles.songTouchableArea}
        onPress={() => handleSongSelect(item)}
      >
        <FastImage
          source={{ uri: item.thumbnail }}
          style={styles.songThumbnail}
        />
        <View style={styles.songText}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.5}
        onPress={() => {
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

  /**
   * Renders a large item (album or video) for an artist's page.
   * @param item - The artist page item to render.
   * @param type - The type of item ("album" or "video").
   * @returns A TouchableOpacity component representing the large item.
   */
  const renderLargeItem = (item: ArtistPageItem, type: "album" | "video") => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.largeItemContainer,
        type === "video" && { width: scale(160), height: scale(135) },
      ]}
      onPress={() => {
        if (type === "video")
          handleSongSelect({
            id: item.id,
            title: item.title,
            artist: item.subtitle.slice(0, item.subtitle.indexOf(" • ")),
            thumbnail: item.thumbnail,
          });
        else
          router.push({
            pathname: "/(tabs)/home/album",
            params: {
              id: item.id,
              title: item.title,
              subtitle: item.subtitle,
              thumbnail: item.thumbnail,
              artist: artistData?.title,
            },
          });
      }}
      onLongPress={() => {
        if (type === "video") {
          const songData = JSON.stringify({
            id: item.id,
            title: item.title,
            artist: item.subtitle.slice(0, item.subtitle.indexOf(" • ")),
            thumbnail: item.thumbnail,
          });

          router.push({
            pathname: "/(modals)/menu",
            params: { songData: songData, type: "song" },
          });
        }
      }}
    >
      <View style={styles.largeItemImageContainer}>
        <FastImage
          source={{ uri: item.thumbnail }}
          style={[
            styles.largeItemThumbnail,
            type === "video" && { width: scale(160), height: scale(90) },
          ]}
        />
      </View>
      <Text style={styles.largeItemTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.largeItemSubtitle} numberOfLines={1}>
        {item.subtitle}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: verticalScale(138) + bottom,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.headerContainer,
          { height: moderateScale(HEADER_HEIGHT) },
        ]}
      >
        <ImageBackground
          source={{ uri: artistData?.thumbnail }}
          style={styles.headerImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.4)", "rgba(0,0,0,1)"]}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>

        {/* --- TOP NAVIGATION ICONS --- */}
        <View style={[styles.topNav, { top: top }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={moderateScale(26)}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* --- ARTIST TITLE AND INFO --- */}
        <View style={styles.artistInfoContainer}>
          <Text style={styles.artistName}>{artistData?.title}</Text>
          <Text style={styles.artistSubtext}>
            {(params.subtitle as string).replace("Artist • ", "")}
          </Text>
        </View>
      </View>

      {artistData?.songs && artistData?.songs.length > 0 && (
        <>
          <Text style={styles.resultTypeText}>Top Songs</Text>
          {(artistData?.songs || []).map((item) => renderSong({ item }))}

          <TouchableOpacity
            style={styles.button}
            onPress={async () => {
              if (!artist) {
                return;
              }
              setLoading(true);

              const allSongsResult = await artist.getAllSongs();

              if (!allSongsResult)
                console.log("No songs found for this artist.");

              setLoading(false);

              if (allSongsResult && allSongsResult.contents) {
                const processedSongs = await processItems(
                  allSongsResult.contents,
                  "song",
                );

                router.push({
                  pathname: "/(tabs)/home/itemList",
                  params: {
                    data: JSON.stringify(processedSongs),
                    type: "song",
                    title: "Top Songs",
                  },
                });
              }
            }}
          >
            <Text style={styles.buttonText}>Show More</Text>
          </TouchableOpacity>
        </>
      )}

      {artistData?.albums && artistData?.albums.length > 0 && (
        <>
          <Text style={styles.resultTypeText}>Albums</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 13 }}
          >
            <View style={styles.largeItemRow}>
              {(artistData?.albums || []).map((item) =>
                renderLargeItem(item, "album"),
              )}
            </View>
          </ScrollView>
        </>
      )}

      {artistData?.singlesAndEPs && artistData?.singlesAndEPs.length > 0 && (
        <>
          <Text style={styles.resultTypeText}>Singles & EPs</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 13 }}
          >
            <View style={styles.largeItemRow}>
              {(artistData?.singlesAndEPs || []).map((item) =>
                renderLargeItem(item, "album"),
              )}
            </View>
          </ScrollView>
        </>
      )}

      {artistData?.videos && artistData?.videos.length > 0 && (
        <>
          <Text style={styles.resultTypeText}>Videos</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 13 }}
          >
            <View style={styles.largeItemRow}>
              {(artistData?.videos || []).map((item) =>
                renderLargeItem(item, "video"),
              )}
            </View>
          </ScrollView>
        </>
      )}
    </ScrollView>
  );
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  headerContainer: {
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  topNav: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  artistInfoContainer: {
    position: "absolute",
    bottom: 0,
    left: 15,
    right: 15,
  },
  artistName: {
    color: "white",
    fontSize: "45@ms",
    fontWeight: "bold",
  },
  artistSubtext: {
    color: "#E0E0E0",
    fontSize: "14@ms",
    fontWeight: "500",
  },
  resultTypeText: {
    color: Colors.text,
    fontSize: "20@ms",
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
    marginLeft: 20,
  },
  song: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: "8@ms",
    paddingLeft: 10,
    paddingRight: 30,
  },
  songTouchableArea: {
    flexDirection: "row",
    alignItems: "center",
  },
  songThumbnail: {
    width: "50@ms",
    height: "50@ms",
    marginHorizontal: 10,
    borderRadius: 5,
  },
  songText: {
    flex: 1,
  },
  songTitle: {
    color: Colors.text,
    fontSize: "14@ms",
  },
  songArtist: {
    color: Colors.textMuted,
    fontSize: "12@ms",
  },
  largeItemContainer: {
    marginRight: "10@ms",
    width: "100@ms",
    height: "145@ms",
  },
  largeItemImageContainer: {
    position: "relative",
  },
  largeItemThumbnail: {
    borderRadius: 12,
    width: "100@ms",
    height: "100@ms",
  },
  largeItemTitle: {
    color: Colors.text,
    fontSize: "14@ms",
    fontWeight: "bold",
    marginTop: 5,
  },
  largeItemSubtitle: {
    fontSize: "12@ms",
    color: "#888",
  },
  largeItemRow: {
    flexDirection: "row",
    marginBottom: "10@vs",
  },
  button: {
    backgroundColor: "transparent",
    borderColor: "#949392",
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 32,
    flex: 1,
    marginHorizontal: 12,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "white",
    fontSize: "12@ms",
    fontWeight: "bold",
    textAlign: "center",
  },
});
