import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import FastImage from "@d11/react-native-fast-image";
import LoaderKit from "react-native-loader-kit";
import { QuickPicksSection } from "@/components/QuickPicksSection";
import { TrendingSection } from "@/components/TrendingSection";
import { innertube } from "@/services/youtube";
import Innertube from "youtubei.js";
import { EvilIcons, Ionicons } from "@expo/vector-icons";
import { useMusicPlayer } from "@/components/MusicPlayerContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Divider } from "react-native-paper";
import { FullScreenGradientBackground } from "@/components/GradientBackground";
import { transparentIconUri } from "@/constants/images";
import { Colors } from "@/constants/Colors";
import {
  ScaledSheet,
  moderateScale,
  verticalScale,
} from "react-native-size-matters/extend";
import { useNetInfo } from "@react-native-community/netinfo";

interface FeedType {
  sections?: (MusicCarouselShelf | MusicTasteBuilderShelf)[];
}

interface MusicCarouselShelf {
  contents?: any[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MusicTasteBuilderShelf {}

function isMusicCarouselShelf(
  section: MusicCarouselShelf | MusicTasteBuilderShelf,
): section is MusicCarouselShelf {
  return "contents" in section;
}

export default function HomeScreen() {
  const [quickPicksResults, setQuickPicksResults] = useState<Song[]>([]);
  const [trendingResults, setTrendingResults] = useState<Song[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [gradientIndex, setGradientIndex] = useState(
    Math.floor(Math.random() * 12),
  );
  const { top, bottom } = useSafeAreaInsets();
  const { playAudio } = useMusicPlayer();
  const router = useRouter();
  const netInfo = useNetInfo();

  const getQuickPicks = async (yt: Innertube) => {
    try {
      const homeFeed: FeedType = await yt.music.getHomeFeed();

      if (homeFeed?.sections && homeFeed.sections.length > 0) {
        const quickPicks = homeFeed.sections[0];

        if (
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
          Alert.alert("No results", "No songs found in the home feed.");
        }
      } else {
        setQuickPicksResults([]);
        Alert.alert("No results", "Unable to fetch home feed.");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An error occurred while fetching the home feed. Please try again.",
      );

      console.error("Quick picks fetch error:", error);
    }
  };

  const getTrending = async (yt: Innertube) => {
    try {
      const exploreFeed: FeedType = await yt.music.getExplore();

      if (exploreFeed?.sections && exploreFeed.sections.length > 0) {
        const trending = exploreFeed.sections.find((section) => {
          const anySection = section as any;
          return anySection.header?.title?.text === "Trending";
        });

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
          Alert.alert("No results", "No songs found in the home feed.");
        }
      } else {
        setTrendingResults([]);
        Alert.alert("No results", "Unable to fetch home feed.");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An error occurred while fetching the home feed. Please try again.",
      );

      console.error("Trending fetch error:", error);
    }
  };

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const yt = await innertube;
    await getQuickPicks(yt);
    await getTrending(yt);
    setGradientIndex(Math.floor(Math.random() * 12));
    setRefreshing(false);
  }, []);

  const handleSongSelect = (song: Song) => {
    playAudio(song);
  };

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
          <EvilIcons
            name={"search"}
            color={"white"}
            size={moderateScale(35)}
            onPress={() => {
              router.navigate("/(tabs)/home/search");
            }}
          />
        </View>
      </View>
    );
  };

  if (netInfo.isInternetReachable === false) {
    return (
      <FullScreenGradientBackground index={gradientIndex}>
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
              onPress={() => router.navigate("/(tabs)/downloads")}
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
      </FullScreenGradientBackground>
    );
  }

  return (
    <FullScreenGradientBackground index={gradientIndex}>
      <View style={styles.container}>
        {headerView()}

        {isScrolling && (
          <Divider
            style={{ backgroundColor: "rgba(255,255,255,0.3)", height: 0.3 }}
          />
        )}

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
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["orange"]}
              />
            }
          >
            <QuickPicksSection
              results={quickPicksResults}
              onItemClick={handleSongSelect}
            />
            <TrendingSection
              results={trendingResults}
              onItemClick={handleSongSelect}
            />
          </ScrollView>
        )}
      </View>
    </FullScreenGradientBackground>
  );
}

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
