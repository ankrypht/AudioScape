import React, { useState, useEffect } from "react";
import { useFavorites } from "@/store/library";
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
import { FAB, Divider } from "react-native-paper";
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

const gradientIndex = Math.floor(Math.random() * 12);

const FavoritesScreen = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [formattedTracks, setFormattedTracks] = useState<Song[]>([]);
  const { top, bottom } = useSafeAreaInsets();
  const { playAudio, playPlaylist } = useMusicPlayer();
  const lastActiveTrack = useLastActiveTrack();
  const activeTrack = useActiveTrack();
  const router = useRouter();

  const favoritesTracks = useFavorites().favoriteTracks;

  const isFloatingPlayerNotVisible = !(activeTrack ?? lastActiveTrack);

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

  const handleSongSelect = (song: Song) => {
    playAudio(song, formattedTracks);
  };

  return (
    <FullScreenGradientBackground index={gradientIndex}>
      <View style={defaultStyles.container}>
        {/* Header */}
        <Text
          style={[
            styles.header,
            isScrolling ? styles.headerScrolled : {},
            { paddingTop: top },
          ]}
        >
          Favorites
        </Text>

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
              ))
            )}
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

        {formattedTracks.length > 0 && (
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
