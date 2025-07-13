import React, { useState, useEffect } from "react";
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
import { Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import { FAB, Divider } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useLastActiveTrack } from "@/hooks/useLastActiveTrack";
import { useActiveTrack } from "react-native-track-player";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMusicPlayer } from "@/components/MusicPlayerContext";
import { Colors } from "@/constants/Colors";
import {
  ScaledSheet,
  moderateScale,
  verticalScale,
} from "react-native-size-matters/extend";

const ItemList = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [formattedTracks, setFormattedTracks] = useState<Song[] | Video[]>([]);
  const [formattedTracksAlbums, setFormattedTracksAlbums] = useState<Album[]>(
    [],
  );
  const [formattedTracksArtists, setFormattedTracksArtists] = useState<
    Artist[]
  >([]);
  const { top, bottom } = useSafeAreaInsets();
  const { playAudio, playPlaylist } = useMusicPlayer();
  const lastActiveTrack = useLastActiveTrack();
  const activeTrack = useActiveTrack();
  const router = useRouter();
  const { data, type, title } = useLocalSearchParams<{
    data: string;
    type: string;
    title: string;
  }>();

  const isFloatingPlayerNotVisible = !(activeTrack ?? lastActiveTrack);

  const renderSongResult = ({ item }: { item: Song }) => (
    <View key={item.id} style={styles.searchResult}>
      <TouchableOpacity
        style={styles.searchResultTouchableArea}
        onPress={() => handleSongSelect(item)}
      >
        <FastImage
          source={{ uri: item.thumbnail }}
          style={styles.songThumbnail}
        />
        {activeTrack?.id === item.id && (
          <LoaderKit
            style={styles.songTrackPlayingIconIndicator}
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

  const renderVideoResult = ({ item }: { item: Song }) => (
    <View key={item.id} style={styles.searchResult}>
      <TouchableOpacity
        style={styles.searchResultTouchableArea}
        onPress={() => handleSongSelect(item)}
      >
        <FastImage
          source={{ uri: item.thumbnail }}
          style={styles.videoThumbnail}
        />
        {activeTrack?.id === item.id && (
          <LoaderKit
            style={styles.videoTrackPlayingIconIndicator}
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

  const renderAlbumResult = ({ item }: { item: Album }) => (
    <View key={item.id} style={styles.searchResult}>
      <TouchableOpacity
        style={styles.searchResultTouchableArea}
        onPress={() => {
          router.push({
            pathname: "/(tabs)/home/album",
            params: {
              id: item.id,
              title: item.title,
              thumbnail: item.thumbnail,
              artist: item.artist,
            },
          });
        }}
      >
        <FastImage
          source={{ uri: item.thumbnail }}
          style={styles.songThumbnail}
        />
        <View style={styles.resultText}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.resultArtist} numberOfLines={1}>
            {item.artist} • {item.year}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.5}
        onPress={() => {
          // Convert the song object to a JSON string
          const albumData = JSON.stringify({
            name: item.title,
            thumbnail: item.thumbnail,
            id: item.id,
            artist: item.artist,
          });

          router.push({
            pathname: "/(modals)/menu",
            params: {
              albumData: albumData,
              type: "album",
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
  );

  const renderArtistResult = ({ item }: { item: Artist }) => (
    <View key={item.id} style={styles.searchResult}>
      <TouchableOpacity
        style={styles.searchResultTouchableArea}
        onPress={() => {
          router.push({
            pathname: "/(tabs)/home/artist",
            params: { id: item.id, subtitle: item.subtitle },
          });
        }}
      >
        <FastImage
          source={{ uri: item.thumbnail }}
          style={styles.songThumbnail}
        />
        <View style={styles.resultText}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.resultArtist} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    const fetchTracks = async () => {
      setIsLoading(true);
      try {
        if (type === "song" || type === "video") {
          const tracks: Song[] = JSON.parse(data) as Song[];
          setFormattedTracks(tracks);
        }
        if (type === "album") {
          const tracks: Album[] = JSON.parse(data) as Album[];
          setFormattedTracksAlbums(tracks);
        }
        if (type === "artist") {
          const tracks: Artist[] = JSON.parse(data) as Artist[];
          setFormattedTracksArtists(tracks);
        }
      } catch (error) {
        console.error("Error fetching favorite tracks", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTracks();
  }, [data, type]);

  const handleSongSelect = (song: Song) => {
    playAudio(song, formattedTracks);
  };

  const getItems = () => {
    if (type === "song" || type === "video") return formattedTracks;
    if (type === "album") return formattedTracksAlbums;
    if (type === "artist") return formattedTracksArtists;
    return [];
  };
  const items = getItems();

  return (
    <View style={defaultStyles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          isScrolling ? styles.headerScrolled : {},
          { paddingTop: top },
        ]}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={moderateScale(25)}
          color={Colors.text}
          onPress={() => router.back()}
        />
        <Text style={styles.headerText}>{title}</Text>
      </View>

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
            items.length === 0 && { flex: 1 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            const currentScrollPosition =
              Math.floor(e.nativeEvent.contentOffset.y) || 0;
            setIsScrolling(currentScrollPosition > 5);
          }}
          scrollEventThrottle={16}
        >
          {items.length === 0 ? (
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
                No Result Found
              </Text>
            </View>
          ) : (
            items.map((item) => {
              if (type === "song")
                return renderSongResult({ item: item as Song });
              if (type === "video")
                return renderVideoResult({ item: item as Song });
              if (type === "album")
                return renderAlbumResult({ item: item as Album });
              if (type === "artist")
                return renderArtistResult({ item: item as Artist });
            })
          )}
        </ScrollView>
      )}

      {(type === "song" || type === "video") && formattedTracks.length > 0 && (
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
  );
};

export default ItemList;

const styles = ScaledSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  headerText: {
    fontSize: "20@ms",
    fontWeight: "bold",
    color: Colors.text,
    paddingLeft: 15,
  },
  headerScrolled: {
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  songList: {
    flexDirection: "column",
    width: "100%",
  },
  searchResult: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: "10@ms",
    paddingLeft: 10,
    paddingRight: 30,
  },
  searchResultTouchableArea: {
    flexDirection: "row",
    alignItems: "center",
  },
  songThumbnail: {
    width: "55@ms",
    height: "55@ms",
    marginHorizontal: "10@ms",
    borderRadius: 5,
  },
  songTrackPlayingIconIndicator: {
    position: "absolute",
    top: "17.5@ms",
    left: "28@ms",
    width: "20@ms",
    height: "20@ms",
  },
  videoThumbnail: {
    width: "64@ms",
    height: "36@ms",
    marginHorizontal: "10@ms",
    borderRadius: 5,
  },
  videoTrackPlayingIconIndicator: {
    position: "absolute",
    top: "10@ms",
    left: "33@ms",
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
