import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  ScrollView,
  Keyboard,
  TextInput,
  Text,
  View,
} from "react-native";
import FastImage from "@d11/react-native-fast-image";
import { Searchbar } from "react-native-paper";
import LoaderKit from "react-native-loader-kit";
import { useActiveTrack } from "react-native-track-player";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMusicPlayer } from "@/components/MusicPlayerContext";
import { EvilIcons, Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  innertube,
  processItems,
  processSearchPageData,
} from "@/services/youtube";
import { Colors } from "@/constants/Colors";
import {
  ScaledSheet,
  moderateScale,
  verticalScale,
} from "react-native-size-matters/extend";

interface SearchSuggestions {
  text: string;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchPageData>();
  const [searchSuggestions, setSearchSuggestions] = useState<
    SearchSuggestions[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const activeTrack = useActiveTrack();
  const { playAudio } = useMusicPlayer();
  const searchBarRef = useRef<TextInput>(null);

  const handleSearch = async (query: string) => {
    if (!query) return;

    Keyboard.dismiss();

    setIsSearching(false);
    setIsLoading(true);
    try {
      const yt = await innertube;
      const searchResults = processSearchPageData(
        await yt.music.search(query, { type: "all" }),
      );

      setSearchResults(searchResults);
    } catch (error) {
      console.error("Error searching:", error);
      Alert.alert(
        "Error",
        "An error occurred while searching. Please try again.",
      );
    }
    setIsLoading(false);
  };

  const handleSearchSuggestions = useCallback(async () => {
    if (!searchQuery) return;

    setIsSearching(true);
    try {
      const yt = await innertube;
      const searchSuggestions =
        await yt.music.getSearchSuggestions(searchQuery);

      if (
        searchSuggestions &&
        Array.isArray(searchSuggestions) &&
        searchSuggestions.length > 0 &&
        searchSuggestions[0].contents
      ) {
        const formattedResults: SearchSuggestions[] =
          searchSuggestions[0].contents
            .filter(
              (item: any) => item && item.suggestion && item.suggestion.text,
            )
            .map((item: any) => ({
              text: item.suggestion.text,
            }));

        setSearchSuggestions(formattedResults);
      } else {
        setSearchSuggestions([]);
        Alert.alert("No results", "No songs found for your search query.");
      }
    } catch (error) {
      console.error("Error searching:", error);
      Alert.alert(
        "Error",
        "An error occurred while searching. Please try again.",
      );
    }
  }, [searchQuery]);

  useEffect(() => {
    async function fetchResults() {
      await handleSearchSuggestions();
    }

    fetchResults();
  }, [handleSearchSuggestions]);

  const handleSongSelect = (song: Song) => {
    playAudio(song);
  };

  const handleSearchSuggestionsSelect = async (
    suggestion: SearchSuggestions,
  ) => {
    Keyboard.dismiss();
    await setSearchQuery(suggestion.text);
    await handleSearch(suggestion.text);
  };

  const renderTopResult = (item: TopResult) => (
    <View key={item.id} style={styles.searchResult}>
      <TouchableOpacity
        style={styles.searchResultTouchableArea}
        onPress={() => {
          if (item.type === "song" || item.type === "video")
            handleSongSelect({
              id: item.id,
              title: item.title,
              artist: item.artist,
              thumbnail: item.thumbnail,
            });
          if (item.type === "artist") {
            router.push({
              pathname: "/(tabs)/home/artist",
              params: { id: item.id, subtitle: item.subtitle },
            });
          }
        }}
      >
        <FastImage
          source={{ uri: item.thumbnail }}
          style={
            item.type === "song" || item.type === "artist"
              ? styles.songThumbnail
              : styles.videoThumbnail
          }
        />
        {activeTrack?.id === item.id && (
          <LoaderKit
            style={
              item.type === "song"
                ? styles.songTrackPlayingIconIndicator
                : styles.videoTrackPlayingIconIndicator
            }
            name="LineScalePulseOutRapid"
            color="white"
          />
        )}
        <View style={styles.resultText}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.resultArtist} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>
      </TouchableOpacity>

      {(item.type === "song" || item.type === "video") && (
        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() => {
            if (item.type === "song" || item.type === "video") {
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
            }
          }}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Entypo
            name="dots-three-vertical"
            size={moderateScale(15)}
            color="white"
          />
        </TouchableOpacity>
      )}
    </View>
  );

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

  const renderSearchSuggestions = ({ item }: { item: SearchSuggestions }) => (
    <TouchableOpacity
      style={styles.searchResult}
      onPress={() => handleSearchSuggestionsSelect(item)}
    >
      <EvilIcons
        name="search"
        size={moderateScale(30)}
        color={Colors.text}
        style={{ marginRight: 10, marginLeft: 10, marginTop: -3 }}
      />
      <Text style={styles.resultTitle}>{item.text}</Text>
    </TouchableOpacity>
  );

  const showAllButton = (
    type: "song" | "video" | "album" | "artist",
    title: string,
  ) => {
    return (
      <TouchableOpacity
        style={styles.button}
        onPress={async () => {
          setIsLoading(true);
          const yt = await innertube;
          const allResult = await yt.music.search(searchQuery, {
            type: type,
          });

          setIsLoading(false);

          if (
            allResult &&
            allResult.contents &&
            allResult.contents.length > 0 &&
            allResult.contents[0].contents
          ) {
            let processedSongs: Song[] | Video[] | Album[] | Artist[] = [];
            if (type === "song")
              processedSongs = await processItems(
                allResult.contents[0].contents,
                "song",
              );
            if (type === "video")
              processedSongs = await processItems(
                allResult.contents[0].contents,
                "video",
              );
            if (type === "album")
              processedSongs = await processItems(
                allResult.contents[0].contents,
                "album",
              );
            if (type === "artist")
              processedSongs = await processItems(
                allResult.contents[0].contents,
                "artist",
              );

            router.push({
              pathname: "/(tabs)/home/itemList",
              params: {
                data: JSON.stringify(processedSongs),
                type: type,
                title: title,
              },
            });
          }
        }}
      >
        <Text style={styles.buttonText}>Show All</Text>
      </TouchableOpacity>
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      if (searchBarRef.current) {
        searchBarRef.current.focus();
      }
    }, []),
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: top }]}>
      <Searchbar
        placeholder="Search for a song"
        value={searchQuery}
        onChangeText={setSearchQuery}
        mode={"bar"}
        autoFocus
        icon={() => (
          <MaterialCommunityIcons
            name="arrow-left"
            color={"white"}
            size={moderateScale(25)}
          />
        )}
        iconColor="white"
        onIconPress={() => {
          Keyboard.dismiss();
          router.back();
        }}
        onClearIconPress={() => {
          Keyboard.dismiss();
        }}
        onSubmitEditing={() => handleSearch(searchQuery)}
        style={styles.searchbar}
        inputStyle={{
          color: "white",
          fontSize: moderateScale(16),
          alignSelf: "center",
        }}
        placeholderTextColor={Colors.textMuted}
        theme={{
          colors: {
            primary: "white",
          },
        }}
        ref={searchBarRef}
      />

      {isSearching ? (
        <FlatList
          data={searchSuggestions}
          renderItem={renderSearchSuggestions}
          keyExtractor={(item) => item.text}
          style={styles.searchResults}
          contentContainerStyle={{
            paddingBottom: verticalScale(138) + bottom,
          }}
          keyboardShouldPersistTaps="handled"
        />
      ) : isLoading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <LoaderKit
            style={{
              width: moderateScale(50),
              height: moderateScale(50),
              alignSelf: "center",
            }}
            name="BallSpinFadeLoader"
            color="white"
          />
        </View>
      ) : (
        searchResults && (
          <ScrollView
            style={styles.searchResults}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: verticalScale(138) + bottom,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {searchResults.topResult && (
              <>
                <Text style={styles.searchResultTypeText}>Top Result</Text>
                {renderTopResult(searchResults.topResult)}
              </>
            )}

            {searchResults?.songs && searchResults.songs.length > 0 && (
              <>
                <Text style={styles.searchResultTypeText}>Songs</Text>
                {searchResults.songs.map((item) => renderSongResult({ item }))}
                {showAllButton("song", "Songs")}
              </>
            )}

            {searchResults?.videos && searchResults.videos.length > 0 && (
              <>
                <Text style={styles.searchResultTypeText}>Videos</Text>
                {searchResults.videos.map((item) =>
                  renderVideoResult({ item }),
                )}
                {showAllButton("video", "Videos")}
              </>
            )}

            {searchResults?.albums && searchResults.albums.length > 0 && (
              <>
                <Text style={styles.searchResultTypeText}>Albums</Text>
                {searchResults.albums.map((item) =>
                  renderAlbumResult({ item }),
                )}
                {showAllButton("album", "Albums")}
              </>
            )}

            {searchResults?.artists && searchResults.artists.length > 0 && (
              <>
                <Text style={styles.searchResultTypeText}>Artists</Text>
                {searchResults.artists.map((item) =>
                  renderArtistResult({ item }),
                )}
                {showAllButton("artist", "Artists")}
              </>
            )}
          </ScrollView>
        )
      )}
    </SafeAreaView>
  );
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  searchbar: {
    width: "342@s",
    height: "56@ms",
    backgroundColor: "#101010",
  },
  searchResults: {
    width: "360@s",
  },
  searchResultTypeText: {
    color: Colors.text,
    fontSize: moderateScale(20),
    fontWeight: "bold",
    marginTop: 15,
    marginLeft: 20,
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
  button: {
    backgroundColor: "transparent",
    borderColor: "#C9C8C7",
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
