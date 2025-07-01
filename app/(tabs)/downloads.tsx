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
import { Divider, FAB } from "react-native-paper";
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

const gradientIndex = Math.floor(Math.random() * 12);

const DownloadsScreen = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const { top, bottom } = useSafeAreaInsets();
  const { playDownloadedSong, playAllDownloadedSongs } = useMusicPlayer();
  const lastActiveTrack = useLastActiveTrack();
  const activeTrack = useActiveTrack();
  const router = useRouter();

  // Fetch downloaded tracks from Redux store
  const downloadedTracksMeta = useDownloadedTracks();
  const activeDownloads = useActiveDownloads();

  const isFloatingPlayerNotVisible = !(activeTrack ?? lastActiveTrack);

  // Format downloaded metadata into DownloadedSongMetadata objects for rendering and playback
  const formattedTracks: DownloadedSongMetadata[] = useMemo(() => {
    setIsLoading(true);
    const tracks = [...downloadedTracksMeta].reverse();
    setIsLoading(false);
    return tracks;
  }, [downloadedTracksMeta]);

  const handleSongSelect = (song: DownloadedSongMetadata) => {
    playDownloadedSong(song, formattedTracks);
  };

  const handlePlayAllDownloads = async () => {
    if (formattedTracks.length === 0) return;
    await playAllDownloadedSongs(formattedTracks);
    await router.navigate("/player");
  };

  const handleOpenMenu = (song: DownloadedSongMetadata) => {
    const originalMetadata = downloadedTracksMeta.find((m) => m.id === song.id);
    if (!originalMetadata) return;

    const songDataForMenu = JSON.stringify({
      id: originalMetadata.id,
      title: originalMetadata.title,
      artist: originalMetadata.artist,
      thumbnail: originalMetadata.localArtworkUri,
      url: originalMetadata.localTrackUri,
      duration: originalMetadata.duration,
    });

    router.push({
      pathname: "/(modals)/menu",
      params: { songData: songDataForMenu, type: "downloadedSong" },
    });
  };

  return (
    <FullScreenGradientBackground index={gradientIndex}>
      <View style={defaultStyles.container}>
        <Text
          style={[
            styles.header,
            isScrolling ? styles.headerScrolled : {},
            { paddingTop: top },
          ]}
        >
          Downloads
        </Text>

        {isScrolling && (
          <Divider
            style={{ backgroundColor: "rgba(255,255,255,0.3)", height: 0.3 }}
          />
        )}

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
            {formattedTracks.length === 0 && activeDownloads.length === 0 ? (
              <Text style={styles.centeredMessageText}>
                No songs downloaded yet! {"\n"}Find songs and tap the download
                icon.
              </Text>
            ) : (
              <>
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
                          {/* A simple progress bar */}
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

            {formattedTracks.length > 0 && (
              <Text style={styles.trackCountText}>
                {formattedTracks.length}{" "}
                {`Track${formattedTracks.length > 1 ? "s" : ""}`}
              </Text>
            )}
          </ScrollView>
        )}

        {formattedTracks.length > 0 && (
          <FAB
            style={[
              styles.fab,
              {
                marginBottom:
                  (isFloatingPlayerNotVisible ? 60 : moderateScale(138)) +
                  bottom,
              },
            ]}
            theme={{ roundness: 1 }}
            customSize={moderateScale(56)}
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
    backgroundColor: "rgba(255,255,255,0.1)", // Placeholder bg for image
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
    borderRadius: 20,
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
