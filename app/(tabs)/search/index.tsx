/**
 * This file defines the `SearchScreen` component, which provides a comprehensive
 * search functionality for music content (songs, videos, albums, artists) from YouTube Music.
 * It includes features like search suggestions, dynamic rendering of search results based on type,
 * and navigation to detailed content pages.
 */

import { useMusicPlayer } from "@/components/MusicPlayerContext";
import { Colors } from "@/constants/Colors";
import { triggerHaptic } from "@/helpers/haptics";
import {
  innertube,
  processItems,
  processSearchPageData,
} from "@/services/youtube";
import FastImage from "@d11/react-native-fast-image";
import { Entypo, EvilIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LoaderKit from "react-native-loader-kit";
import { Searchbar } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ScaledSheet,
  moderateScale,
  verticalScale,
} from "react-native-size-matters/extend";
import { useActiveTrack } from "react-native-track-player";

/**
 * @interface SearchSuggestions
 * @description Defines the structure for a search suggestion item.
 */
interface SearchSuggestions {
  text: string;
}

/**
 * `SearchScreen` component.
 * Provides a search interface for music content.
 */
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

  /**
   * Handles the main search operation based on the provided query.
   * @param query - The search query string.
   */
  const handleSearch = async (query: string) => {
    if (!query) return;

    Keyboard.dismiss(); // Dismiss the keyboard when search is initiated.

    setIsSearching(false);
    setIsLoading(true);
    try {
      const yt = await innertube;
      // Perform a comprehensive search and process the results.
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

  /**
   * Fetches and updates search suggestions based on the current search query.
   */
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
        // Format the raw suggestions into a simpler array of objects.
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

  // Effect to fetch search suggestions whenever the search query changes.
  useEffect(() => {
    async function fetchResults() {
      await handleSearchSuggestions();
    }

    fetchResults();
  }, [handleSearchSuggestions]);

  /**
   * Handles playing a selected song from the search results.
   * @param song - The `Song` object to play.
   */
  const handleSongSelect = (song: Song) => {
    triggerHaptic();
    playAudio(song);
  };

  /**
   * Handles selecting a search suggestion, performing a full search with the suggestion.
   * @param suggestion - The selected `SearchSuggestions` item.
   */
  const handleSearchSuggestionsSelect = async (
    suggestion: SearchSuggestions,
  ) => {
    triggerHaptic();
    Keyboard.dismiss();
    await setSearchQuery(suggestion.text);
    await handleSearch(suggestion.text);
  };

  /**
   * Renders the top search result item.
   * @param item - The `TopResult` item to render.
   * @returns A View component representing the top result.
   */
  const renderTopResult = (item: TopResult) => (
    <View key={item.id} style={styles.searchResult}>
      <TouchableOpacity
        style={styles.searchResultTouchableArea}
        onPress={() => {
          triggerHaptic();
          // Navigate to song/video player or artist/playlist page based on item type.
          if (item.type === "song" || item.type === "video")
            handleSongSelect({
              id: item.id,
              title: item.title,
              artist: item.artist,
              thumbnail: item.thumbnail,
            });
          if (item.type === "artist") {
            router.push({
              pathname: "/(tabs)/search/artist",
              params: { id: item.id, subtitle: item.subtitle },
            });
          }
          if (item.type === "album") {
            router.push({
              pathname: "/(tabs)/search/album",
              params: {
                id: item.id,
                title: item.title,
                thumbnail: item.thumbnail,
                artist: item.artist,
              },
            });
          }
          if (item.type === "playlist" || item.type === "radio") {
            router.push({
              pathname: "/(tabs)/search/playlist",
              params: {
                id: item.id,
              },
            });
          }
        }}
      >
        <FastImage
          source={{ uri: item.thumbnail }}
          style={
            item.type === "video" ? styles.videoThumbnail : styles.songThumbnail
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

      {(item.type === "song" ||
        item.type === "video" ||
        item.type === "album" ||
        item.type === "playlist" ||
        item.type === "radio") && (
        <TouchableOpacity
          onPress={() => {
            triggerHaptic();
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
            if (item.type === "album") {
              const albumData = JSON.stringify({
                name: item.title,
                thumbnail: item.thumbnail,
                id: item.id,
                artist: item.artist,
              });

              router.push({
                pathname: "/(modals)/menu",
                params: { albumData: albumData, type: "album" },
              });
            }
            if (item.type === "playlist" || item.type === "radio") {
              const remotePlaylistData = JSON.stringify({
                name: item.title,
                thumbnail: item.thumbnail,
                id: item.id,
                artist: item.artist,
              });

              router.push({
                pathname: "/(modals)/menu",
                params: {
                  remotePlaylistData: remotePlaylistData,
                  type: "remotePlaylist",
                },
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

  /**
   * Renders a song search result item.
   * @param item - The song item to render.
   * @returns A View component representing a song result.
   */
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
        onPress={() => {
          triggerHaptic();
          // Convert the song object to a JSON string.
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
   * Renders a video search result item.
   * @param item - The video item to render.
   * @returns A View component representing a video result.
   */
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
        onPress={() => {
          triggerHaptic();
          // Convert the song object to a JSON string.
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
   * Renders an album search result item.
   * @param item - The album item to render.
   * @returns A View component representing an album result.
   */
  const renderAlbumResult = ({ item }: { item: Album }) => (
    <View key={item.id} style={styles.searchResult}>
      <TouchableOpacity
        style={styles.searchResultTouchableArea}
        onPress={() => {
          triggerHaptic();
          router.push({
            pathname: "/(tabs)/search/album",
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
        onPress={() => {
          triggerHaptic();
          // Convert the album object to a JSON string.
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

  /**
   * Renders an artist search result item.
   * @param item - The artist item to render.
   * @returns A View component representing an artist result.
   */
  const renderArtistResult = ({ item }: { item: Artist }) => (
    <View key={item.id} style={styles.searchResult}>
      <TouchableOpacity
        style={styles.searchResultTouchableArea}
        onPress={() => {
          triggerHaptic();
          router.push({
            pathname: "/(tabs)/search/artist",
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

  /**
   * Renders a search suggestion item.
   * @param item - The search suggestion item to render.
   * @returns A TouchableOpacity component representing a search suggestion.
   */
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

  /**
   * Renders a "Show All" button for a specific search result type.
   * @param type The type of content (song, video, album, artist).
   * @param title The title for the item list screen.
   * @returns A TouchableOpacity component for the "Show All" button.
   */
  const showAllButton = (
    type: "song" | "video" | "album" | "artist",
    title: string,
  ) => {
    return (
      <TouchableOpacity
        style={styles.button}
        onPress={async () => {
          triggerHaptic();
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
              pathname: "/(tabs)/search/itemList",
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

  // Focus the search bar when the screen gains focus.
  useFocusEffect(
    React.useCallback(() => {
      if (searchBarRef.current) {
        searchBarRef.current.focus();
      }
    }, []),
  );

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {/* Search bar input component */}
      <Searchbar
        placeholder="Search for a song"
        value={searchQuery}
        onChangeText={setSearchQuery}
        mode={"view"}
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
          triggerHaptic();
          Keyboard.dismiss();
          router.back();
        }}
        onClearIconPress={() => {
          triggerHaptic();
          Keyboard.dismiss();
        }}
        onSubmitEditing={() => handleSearch(searchQuery)}
        style={styles.searchbar}
        inputStyle={{
          color: "white",
          fontSize: moderateScale(15),
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

      {/* Conditional rendering based on search state (suggestions, loading, results) */}
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
            {/* Top Result section */}
            {searchResults.topResult && (
              <>
                <Text style={styles.searchResultTypeText}>Top Result</Text>
                {renderTopResult(searchResults.topResult)}
              </>
            )}

            {/* Songs section */}
            {searchResults?.songs && searchResults.songs.length > 0 && (
              <>
                <Text style={styles.searchResultTypeText}>Songs</Text>
                {searchResults.songs.map((item) => renderSongResult({ item }))}
                {showAllButton("song", "Songs")}
              </>
            )}

            {/* Videos section */}
            {searchResults?.videos && searchResults.videos.length > 0 && (
              <>
                <Text style={styles.searchResultTypeText}>Videos</Text>
                {searchResults.videos.map((item) =>
                  renderVideoResult({ item }),
                )}
                {showAllButton("video", "Videos")}
              </>
            )}

            {/* Albums section */}
            {searchResults?.albums && searchResults.albums.length > 0 && (
              <>
                <Text style={styles.searchResultTypeText}>Albums</Text>
                {searchResults.albums.map((item) =>
                  renderAlbumResult({ item }),
                )}
                {showAllButton("album", "Albums")}
              </>
            )}

            {/* Artists section */}
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
    </View>
  );
}

// Styles for the SearchScreen component.
const styles = ScaledSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  searchbar: {
    height: "56@ms",
    backgroundColor: "black",
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
