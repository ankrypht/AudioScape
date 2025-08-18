/**
 * This file defines the `HomeScreen` component, which serves as the main landing page
 * for the application. It displays dynamically fetched content such as "Quick Picks" and "Trending"
 * songs from YouTube Music. It also handles network connectivity status and provides navigation
 * to other parts of the application.
 *
 * @packageDocumentation
 */

import { useMusicPlayer } from "@/components/MusicPlayerContext";
import { QuickPicksSection } from "@/components/QuickPicksSection";
import { TrendingSection } from "@/components/TrendingSection";
import { Colors } from "@/constants/Colors";
import { transparentIconUri } from "@/constants/images";
import { triggerHaptic } from "@/helpers/haptics";
import { innertube } from "@/services/youtube";
import FastImage from "@d11/react-native-fast-image";
import { EvilIcons, Ionicons } from "@expo/vector-icons";
import { useNetInfo } from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LoaderKit from "react-native-loader-kit";
import { Divider } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ScaledSheet,
  moderateScale,
  verticalScale,
} from "react-native-size-matters/extend";
import InnertubeClass from "youtubei.js";

/**
 * @interface FeedType
 * @description Represents the structure of the home or explore feed from YouTube Music.
 */
interface FeedType {
  sections?: (MusicCarouselShelf | MusicTasteBuilderShelf)[];
}

/**
 * @interface MusicCarouselShelf
 * @description Represents a carousel section containing music items.
 */
interface MusicCarouselShelf {
  contents?: any[];
}

/**
 * @interface MusicTasteBuilderShelf
 * @description Represents a taste builder section (currently empty interface).
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MusicTasteBuilderShelf {}

/**
 * Type guard to check if a section is a `MusicCarouselShelf`.
 * @param section The section to check.
 * @returns True if the section has a `contents` property, false otherwise.
 */
function isMusicCarouselShelf(
  section: MusicCarouselShelf | MusicTasteBuilderShelf,
): section is MusicCarouselShelf {
  return "contents" in section;
}

/**
 * `HomeScreen` component.
 * Displays the main home feed with Quick Picks and Trending sections.
 */
export default function HomeScreen() {
  const [quickPicksResults, setQuickPicksResults] = useState<Song[]>([]);
  const [trendingResults, setTrendingResults] = useState<Song[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const { top, bottom } = useSafeAreaInsets();
  const { playAudio } = useMusicPlayer();
  const router = useRouter();
  const netInfo = useNetInfo();

  /**
   * Fetches "Quick Picks" data from the YouTube Music home feed.
   * @param yt The Innertube instance.
   */
  const getQuickPicks = async (yt: InnertubeClass) => {
    try {
      const homeFeed: FeedType = await yt.music.getHomeFeed();

      if (homeFeed?.sections && homeFeed.sections.length > 0) {
        const quickPicks = homeFeed.sections.find(
          (c: any) => c.header?.title?.text === "Quick picks",
        );

        if (
          quickPicks &&
          isMusicCarouselShelf(quickPicks) &&
          Array.isArray(quickPicks.contents)
        ) {
          const formattedResults: Song[] = quickPicks.contents
            .filter((item: any) => item?.id && item?.title)
            .map((item: any) => ({
              id: item.id,
              title: item.title,
              artist: item.artists?.[0]?.name ?? "Unknown Artist",
              thumbnail:
                item.thumbnail?.contents?.[0]?.url ?? "https://placehold.co/50",
            }));
          setQuickPicksResults(formattedResults);
        } else {
          setQuickPicksResults([]);
        }
      } else {
        setQuickPicksResults([]);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An error occurred while fetching the home feed. Please try again.",
      );

      console.error("Quick picks fetch error:", error);
    }
  };

  /**
   * Fetches "Trending" data from the YouTube Music explore feed.
   * @param yt The Innertube instance.
   */
  const getTrending = async (yt: InnertubeClass) => {
    try {
      const exploreFeed: FeedType = await yt.music.getExplore();

      if (exploreFeed?.sections && exploreFeed.sections.length > 0) {
        // Find the "Trending" section within the explore feed.
        const trending = exploreFeed.sections.find(
          (c: any) => c.header?.title?.text === "Trending",
        );

        if (
          trending &&
          isMusicCarouselShelf(trending) &&
          Array.isArray(trending.contents)
        ) {
          const formattedResults: Song[] = trending.contents
            .filter(
              (item: any) => item?.id && (item?.title || item?.title.text),
            )
            .map((item: any) => ({
              id: item.id,
              title:
                typeof item.title === "string"
                  ? item.title
                  : item.title?.text || "Unknown Title",
              artist:
                item.authors?.[0]?.name ??
                item.author?.name ??
                "Unknown Artist",
              thumbnail:
                item.thumbnail?.contents?.[0]?.url ??
                item.thumbnail?.[0]?.url ??
                "https://placehold.co/50",
            }));
          setTrendingResults(formattedResults);
        } else {
          setTrendingResults([]);
        }
      } else {
        setTrendingResults([]);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An error occurred while fetching the home feed. Please try again.",
      );

      console.error("Trending fetch error:", error);
    }
  };

  // Effect to fetch initial home feed data on component mount.
  useEffect(() => {
    async function getHomeFeed() {
      setIsLoading(true);
      const yt = await innertube;
      await getQuickPicks(yt);
      await getTrending(yt);
      setIsLoading(false);
    }

    getHomeFeed();
  }, []);

  /**
   * Handles refreshing the home feed data.
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const yt = await innertube;
    await getQuickPicks(yt);
    await getTrending(yt);
    setRefreshing(false);
  }, []);

  /**
   * Handles playing a selected song.
   * @param song The `Song` object to play.
   */
  const handleSongSelect = (song: Song) => {
    playAudio(song);
  };

  /**
   * Renders the header view for the home screen.
   */
  const headerView = () => {
    return (
      <View
        style={[
          styles.header,
          isScrolling ? styles.headerScrolled : {},
          { paddingTop: top },
        ]}
      >
        <FastImage
          source={{
            uri: transparentIconUri,
            priority: FastImage.priority.high,
          }}
          style={styles.logo}
        />
        <Text style={styles.headerText}>AudioScape</Text>
        <View
          style={{
            marginLeft: "auto",
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Search icon */}
          <EvilIcons
            name={"search"}
            color={"white"}
            size={moderateScale(35)}
            onPress={() => {
              triggerHaptic();
              router.navigate("/(tabs)/home/search");
            }}
          />
        </View>
      </View>
    );
  };

  // Render content based on network connectivity.
  if (netInfo.isInternetReachable === false) {
    return (
      <View style={styles.container}>
        {headerView()}
        <View style={styles.centeredMessageContainer}>
          <Ionicons name="cloud-offline-outline" size={40} color="white" />
          <Text style={styles.centeredMessageText}>
            There is no network connection now
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: "white",
              paddingVertical: 9,
              paddingHorizontal: 18,
              borderRadius: 100,
              marginBottom: 10,
            }}
            onPress={() => {
              triggerHaptic();
              router.navigate("/(tabs)/downloads");
            }}
          >
            <Text
              style={{
                color: "black",
                fontSize: moderateScale(15),
                fontWeight: "bold",
              }}
            >
              Go to Downloads
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {headerView()}

      {/* Divider that appears when scrolling */}
      {isScrolling && (
        <Divider
          style={{ backgroundColor: "rgba(255,255,255,0.3)", height: 0.3 }}
        />
      )}

      {/* Loading indicator for initial data fetch */}
      {isLoading ? (
        <View style={styles.centeredMessageContainer}>
          <LoaderKit
            style={{
              width: moderateScale(50),
              height: moderateScale(50),
              alignSelf: "center",
            }}
            name="BallSpinFadeLoader"
            color="white"
          />
          <Text style={styles.centeredMessageText}>
            Please Wait Sometimes It May Take Longer Than Usual To Load
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: verticalScale(138) + bottom,
            marginTop: 3,
          }}
          onScroll={(e) => {
            const currentScrollPosition =
              Math.floor(e.nativeEvent.contentOffset.y) || 0;
            setIsScrolling(currentScrollPosition > 5);
          }}
          scrollEventThrottle={16}
          refreshControl={
            // Pull-to-refresh functionality.
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["orange"]}
            />
          }
        >
          {/* Quick Picks Section */}
          <QuickPicksSection
            results={quickPicksResults}
            onItemClick={handleSongSelect}
          />
          {/* Trending Section */}
          <TrendingSection
            results={trendingResults}
            onItemClick={handleSongSelect}
          />
        </ScrollView>
      )}
    </View>
  );
}

// Styles for the HomeScreen component.
const styles = ScaledSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
  },
  headerScrolled: {
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  headerText: {
    fontFamily: "Meriva",
    fontSize: "18@ms",
    color: "white",
  },
  logo: {
    width: "42@ms",
    height: "42@ms",
    marginRight: 5,
    borderRadius: 8,
  },
  centeredMessageContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: "65%",
    paddingHorizontal: "20@s",
  },
  centeredMessageText: {
    color: Colors.text,
    textAlign: "center",
    fontSize: "16@ms",
    lineHeight: "26@ms",
    paddingBottom: 8,
  },
});
