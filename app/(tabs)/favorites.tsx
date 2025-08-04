/**
 * This file defines the `FavoritesScreen` component, which displays a list of
 * songs marked as favorites by the user. It allows users to play individual favorite songs
 * or play all of them, and provides options to manage their favorite status.
 *
 * @packageDocumentation
 */

import { FullScreenGradientBackground } from "@/components/GradientBackground";
import { useMusicPlayer } from "@/components/MusicPlayerContext";
import { Colors } from "@/constants/Colors";
import { triggerHaptic } from "@/helpers/haptics";
import { useLastActiveTrack } from "@/hooks/useLastActiveTrack";
import { useFavorites } from "@/store/library";
import { defaultStyles } from "@/styles";
import FastImage from "@d11/react-native-fast-image";
import Entypo from "@expo/vector-icons/Entypo";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LoaderKit from "react-native-loader-kit";
import { Divider, FAB } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ScaledSheet,
  moderateScale,
  verticalScale,
} from "react-native-size-matters/extend";
import { useActiveTrack } from "react-native-track-player";

// Randomly select a gradient background for the screen.
const gradientIndex = Math.floor(Math.random() * 11);

/**
 * `FavoritesScreen` component.
 * Displays a list of favorite songs.
 */
const FavoritesScreen = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [formattedTracks, setFormattedTracks] = useState<Song[]>([]);
  const { top, bottom } = useSafeAreaInsets();
  const { playAudio, playPlaylist } = useMusicPlayer();
  const lastActiveTrack = useLastActiveTrack();
  const activeTrack = useActiveTrack();
  const router = useRouter();

  // Fetch favorite tracks from the Redux store.
  const favoritesTracks = useFavorites().favoriteTracks;

  // Determine if the floating player should be visible.
  const isFloatingPlayerNotVisible = !(activeTrack ?? lastActiveTrack);

  // Effect to fetch and format favorite tracks when the `favoritesTracks` state changes.
  useEffect(() => {
    const fetchFavoriteTracks = async () => {
      setIsLoading(true);
      try {
        const tracks: Song[] = favoritesTracks;
        setFormattedTracks(tracks);
      } catch (error) {
        console.error("Error fetching favorite tracks", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteTracks();
  }, [favoritesTracks]);

  /**
   * Handles playing a single favorite song.
   * @param song - The `Song` object to play.
   */
  const handleSongSelect = (song: Song) => {
    triggerHaptic();
    playAudio(song, formattedTracks);
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
          Favorites
        </Text>

        {/* Divider that appears when scrolling */}
        {isScrolling && (
          <Divider
            style={{ backgroundColor: "rgba(255,255,255,0.3)", height: 0.3 }}
          />
        )}

        {/* Loading Indicator */}
        {isLoading ? (
          <ActivityIndicator color="white" size="large" />
        ) : (
          <ScrollView
            style={styles.songList}
            contentContainerStyle={[
              { paddingBottom: verticalScale(190) + bottom },
              formattedTracks.length === 0 && { flex: 1 },
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={(e) => {
              const currentScrollPosition =
                Math.floor(e.nativeEvent.contentOffset.y) || 0;
              setIsScrolling(currentScrollPosition > 5);
            }}
            scrollEventThrottle={16}
          >
            {/* Message when no favorites are added */}
            {formattedTracks.length === 0 ? (
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
                    fontSize: moderateScale(20),
                    paddingHorizontal: 20,
                  }}
                >
                  No favorites yet! {"\n"}Start adding your favorite songs.
                </Text>
              </View>
            ) : (
              // Map and render each favorite song item.
              formattedTracks.map((item) => (
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
              ))
            )}
            {/* Display total number of favorite tracks */}
            {formattedTracks.length !== 0 && (
              <Text
                style={{
                  color: Colors.textMuted,
                  textAlign: "center",
                  fontSize: moderateScale(15),
                }}
              >
                {formattedTracks.length}{" "}
                {`Track${formattedTracks.length > 1 ? "s" : ""}`}
              </Text>
            )}
          </ScrollView>
        )}

        {/* Floating Action Button to play all favorite songs */}
        {formattedTracks.length > 0 && (
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
              if (formattedTracks.length === 0) return;
              await playPlaylist(formattedTracks);
              await router.navigate("/player");
            }}
          />
        )}
      </View>
    </FullScreenGradientBackground>
  );
};

export default FavoritesScreen;

// Styles for the FavoritesScreen component.
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
