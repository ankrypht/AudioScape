/**
 * This file defines the `MenuModal` component, a context-sensitive modal
 * that provides various actions for songs, playlists, and albums. Actions include
 * playing, adding to queue, downloading, and deleting, dynamically displayed based on the item type.
 */

import { useMusicPlayer } from "@/components/MusicPlayerContext";
import VerticalSwipeGesture from "@/components/navigation/VerticalGesture";
import { Colors } from "@/constants/Colors";
import { unknownTrackImageUri } from "@/constants/images";
import { triggerHaptic } from "@/helpers/haptics";
import { useTrackPlayerFavorite } from "@/hooks/useTrackPlayerFavorite";
import {
  downloadAndSaveSong,
  isSongDownloaded,
  isSongDownloading,
  removeDownloadedSong,
} from "@/services/download";
import {
  getInfo,
  innertube,
  processAlbumPageData,
  processPlaylistPageData,
} from "@/services/youtube";
import { usePlaylists } from "@/store/library";
import FastImage from "@d11/react-native-fast-image";
import {
  Feather,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import HeartButton from "@/components/HeartButton";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  Share,
} from "react-native";
import { Divider } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ScaledSheet,
  moderateScale,
  scale,
  verticalScale,
} from "react-native-size-matters/extend";
import TrackPlayer from "react-native-track-player";

/**
 * `MenuModal` component.
 * Displays a context-sensitive menu for various media types (song, playlist, album).
 * Actions are dynamically shown based on the `type` parameter.
 * @returns The rendered menu modal component.
 */
export default function MenuModal() {
  const { bottom } = useSafeAreaInsets();
  const {
    songData,
    type,
    playlistName,
    playlistData,
    albumData,
    remotePlaylistData,
  } = useLocalSearchParams<{
    songData: string;
    playlistData: string;
    type: string;
    playlistName: string;
    albumData: string;
    remotePlaylistData: string;
  }>();
  const { playNext, playAudio, playPlaylist } = useMusicPlayer();
  const { playlists, removeTrackFromPlaylist } = usePlaylists();
  const router = useRouter();

  const { checkIfFavorite, toggleFavoriteFunc } = useTrackPlayerFavorite();

  const selectedSong: Song | null = songData ? JSON.parse(songData) : null;
  const selectedPlaylist: { name: string; thumbnail: string | null } | null =
    playlistData ? JSON.parse(playlistData) : null;
  const selectedAlbum: {
    name: string;
    id: string;
    artist: string;
    thumbnail: string | null;
  } | null = albumData ? JSON.parse(albumData) : null;
  const selectedRemotePlaylist: {
    name: string;
    id: string;
    artist: string;
    thumbnail: string | null;
  } | null = remotePlaylistData ? JSON.parse(remotePlaylistData) : null;

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (selectedSong?.id) {
        const fav = await checkIfFavorite(selectedSong.id);
        setIsFavorite(fav);
      }
    };

    fetchFavoriteStatus();
  }, [selectedSong?.id, checkIfFavorite]);

  /**
   * Renders the header for a song item in the menu.
   * @param song The song object to display.
   * @returns JSX for the song header.
   */
  const renderSongItem = (song: Song) => (
    <View style={styles.menuHeaderItem}>
      <FastImage
        source={{ uri: song.thumbnail ?? unknownTrackImageUri }}
        style={styles.thumbnail}
      />
      <View style={styles.menuHeaderText}>
        <Text style={styles.menuHeaderTitle} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {song.artist}
        </Text>
      </View>

      {/* Favorite button in the header */}
      <HeartButton
        isFavorite={isFavorite}
        onToggle={() => {
          triggerHaptic();
          toggleFavoriteFunc(song);
          setIsFavorite((prev) => !prev);
        }}
        size={moderateScale(24)}
        notFavoriteColor={Colors.icon}
        favoriteColor={"#ff0000"}
      />
    </View>
  );

  /**
   * Renders the header for a playlist or album item in the menu.
   * @param item - The playlist or album item to display.
   * @returns JSX for the playlist/album header.
   */
  const renderPlaylistItem = ({
    item,
  }: {
    item:
      | { name: string; thumbnail: string | null }
      | { name: string; id: string; artist: string; thumbnail: string | null };
  }) => (
    <View style={styles.menuHeaderItem}>
      <FastImage
        source={{ uri: item.thumbnail ?? unknownTrackImageUri }}
        style={styles.thumbnail}
      />
      <View style={styles.menuHeaderText}>
        <Text style={styles.menuHeaderTitle} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
    </View>
  );

  // Define all possible menu items and their associated actions and types.
  const menuItems = [
    {
      types: ["song", "playlistSong", "queueSong"],
      label: "Start radio",
      icon: (
        <Feather name="radio" size={moderateScale(24)} color={Colors.text} />
      ),
      onPress: async () => {
        triggerHaptic();
        if (selectedSong) await playAudio(selectedSong);
        router.back();
      },
    },
    {
      types: ["song", "playlistSong", "queueSong"],
      label: "Add to playlist",
      icon: (
        <MaterialIcons
          name="playlist-add"
          size={moderateScale(26)}
          color={Colors.text}
        />
      ),
      onPress: async () => {
        triggerHaptic();
        await router.push({
          pathname: "/(modals)/addToPlaylist",
          params: selectedSong
            ? { track: JSON.stringify(selectedSong) }
            : undefined,
        });
      },
    },
    {
      types: ["song", "playlistSong", "queueSong", "downloadedSong"],
      label: "Play next",
      icon: (
        <MaterialIcons
          name="playlist-play"
          size={moderateScale(26)}
          color={Colors.text}
        />
      ),
      onPress: async () => {
        triggerHaptic();
        await playNext(selectedSong ? [selectedSong] : null);
        ToastAndroid.show("Song will play next", ToastAndroid.SHORT);
        router.back();
      },
    },
    {
      types: ["queueSong"],
      label: "Remove from queue",
      icon: (
        <MaterialIcons
          name="playlist-remove"
          size={moderateScale(26)}
          color={Colors.text}
        />
      ),
      onPress: async () => {
        triggerHaptic();
        if (selectedSong) {
          const queue = await TrackPlayer.getQueue();
          await TrackPlayer.remove(
            queue.findIndex((item) => item.id === selectedSong.id),
          );
          ToastAndroid.show("Song removed from queue", ToastAndroid.SHORT);
        }
        router.back();
      },
    },
    {
      types: ["playlistSong"],
      label: "Remove from playlist",
      icon: (
        <MaterialIcons
          name="playlist-remove"
          size={moderateScale(26)}
          color={Colors.text}
        />
      ),
      onPress: async () => {
        triggerHaptic();
        if (selectedSong) {
          await removeTrackFromPlaylist(selectedSong.id, playlistName);
          ToastAndroid.show("Song removed from playlist", ToastAndroid.SHORT);
        }
        router.back();
      },
    },
    {
      types: ["playlist"],
      label: "Play playlist",
      icon: (
        <MaterialIcons
          name="playlist-play"
          size={moderateScale(26)}
          color={Colors.text}
        />
      ),
      onPress: async () => {
        triggerHaptic();
        if (selectedPlaylist) {
          const playlistSongs = playlists[selectedPlaylist.name];
          if (playlistSongs.length === 0) return;
          await playPlaylist(playlistSongs);
        }
        router.back();
      },
    },
    {
      types: ["playlist"],
      label: "Play next",
      icon: (
        <MaterialIcons
          name="playlist-play"
          size={moderateScale(26)}
          color={Colors.text}
        />
      ),
      onPress: async () => {
        triggerHaptic();
        if (selectedPlaylist) {
          const playlistSongs = playlists[selectedPlaylist.name];
          if (playlistSongs.length === 0) return;
          ToastAndroid.show("Playlist will play next", ToastAndroid.SHORT);
          router.back();
          playNext(playlistSongs ? playlistSongs : null);
        }
      },
    },
    {
      types: ["playlist"],
      label: "Delete playlist",
      icon: (
        <MaterialCommunityIcons
          name="delete-forever-outline"
          size={moderateScale(24)}
          color={Colors.text}
        />
      ),
      onPress: async () => {
        triggerHaptic();
        if (selectedPlaylist) {
          router.push({
            pathname: "/(modals)/deletePlaylist",
            params: { playlistName: selectedPlaylist.name },
          });
        }
      },
    },
    {
      types: ["downloadedSong"],
      label: "Delete song",
      icon: (
        <MaterialCommunityIcons
          name="delete-forever-outline"
          size={moderateScale(24)}
          color={Colors.text}
        />
      ),
      onPress: async () => {
        triggerHaptic();
        if (selectedSong) {
          await removeDownloadedSong(selectedSong.id);
          ToastAndroid.show("Song removed from downloads", ToastAndroid.SHORT);
        }
        router.back();
      },
    },
    {
      types: ["song", "playlistSong", "queueSong"],
      label: "Download",
      icon: (
        <MaterialIcons
          name="download"
          size={moderateScale(24)}
          color={Colors.text}
        />
      ),
      onPress: async () => {
        triggerHaptic();
        if (selectedSong) {
          const isDownloaded = isSongDownloaded(selectedSong.id);
          if (isDownloaded) {
            ToastAndroid.show("Song already downloaded", ToastAndroid.SHORT);
            return;
          }
          const isDownloading = isSongDownloading(selectedSong.id);
          if (isDownloading) {
            ToastAndroid.show(
              "Song is already downloading",
              ToastAndroid.SHORT,
            );
            return;
          }

          const info = await getInfo(
            selectedSong.id,
            selectedSong.title,
            selectedSong.artist,
          );
          if (!info) return;

          downloadAndSaveSong({
            id: info.id,
            title: info.title || "Unknown Title",
            artist: info.artist || "Unknown Artist",
            duration: info.duration,
            url: info.url,
            thumbnailUrl: info.artwork,
          });
        }
        router.back();
      },
    },
    {
      types: ["album"],
      label: "Play album",
      icon: (
        <MaterialIcons
          name="playlist-play"
          size={moderateScale(26)}
          color={Colors.text}
        />
      ),
      onPress: async () => {
        triggerHaptic();
        if (selectedAlbum) {
          const yt = await innertube;
          const album = await yt.music.getAlbum(selectedAlbum.id);
          const albumData = processAlbumPageData(album);
          const playableSongList =
            albumData?.songs?.map(({ duration, ...rest }) => ({
              ...rest,
              artist: selectedAlbum.artist,
              thumbnail: albumData?.thumbnail ?? unknownTrackImageUri,
            })) ?? [];
          if (playableSongList.length === 0) return;
          await playPlaylist(playableSongList);
        }
        router.back();
      },
    },
    {
      types: ["album"],
      label: "Play next",
      icon: (
        <MaterialIcons
          name="playlist-play"
          size={moderateScale(26)}
          color={Colors.text}
        />
      ),
      onPress: async () => {
        triggerHaptic();
        if (selectedAlbum) {
          const yt = await innertube;
          const album = await yt.music.getAlbum(selectedAlbum.id);
          const albumData = processAlbumPageData(album);
          const playableSongList =
            albumData?.songs?.map(({ duration, ...rest }) => ({
              ...rest,
              artist: selectedAlbum.artist,
              thumbnail: albumData?.thumbnail ?? unknownTrackImageUri,
            })) ?? [];
          if (playableSongList.length === 0) return;
          ToastAndroid.show("Album will play next", ToastAndroid.SHORT);
          router.back();
          playNext(playableSongList ? playableSongList : null);
        }
      },
    },
    {
      types: ["remotePlaylist"],
      label: "Play playlist",
      icon: (
        <MaterialIcons
          name="playlist-play"
          size={moderateScale(26)}
          color={Colors.text}
        />
      ),
      onPress: async () => {
        triggerHaptic();
        if (selectedRemotePlaylist) {
          const yt = await innertube;
          const playlist = await yt.music.getPlaylist(
            selectedRemotePlaylist.id,
          );
          const playlistData = processPlaylistPageData(playlist);
          if (playlistData.songs.length === 0) return;
          await playPlaylist(playlistData.songs);
        }
        router.back();
      },
    },
    {
      types: ["remotePlaylist"],
      label: "Play next",
      icon: (
        <MaterialIcons
          name="playlist-play"
          size={moderateScale(26)}
          color={Colors.text}
        />
      ),
      onPress: async () => {
        triggerHaptic();
        if (selectedRemotePlaylist) {
          const yt = await innertube;
          const playlist = await yt.music.getPlaylist(
            selectedRemotePlaylist.id,
          );
          const playlistData = processPlaylistPageData(playlist);
          if (playlistData.songs.length === 0) return;
          ToastAndroid.show("Playlist will play next", ToastAndroid.SHORT);
          router.back();
          playNext(playlistData.songs ? playlistData.songs : null);
        }
      },
    },
    {
      types: ["song", "playlistSong", "queueSong", "downloadedSong"],
      label: "Share",
      icon: (
        <MaterialCommunityIcons
          name="share-outline"
          size={moderateScale(24)}
          color={Colors.text}
        />
      ),
      onPress: async () => {
        triggerHaptic();
        if (selectedSong) {
          await Share.share({
            message: "https://music.youtube.com/watch?v=" + selectedSong.id,
            title: "Check out this song!",
          });
        }
      },
    },
  ];

  return (
    <View style={styles.modalBackground}>
      <VerticalSwipeGesture duration={400}>
        <View style={[styles.modalOverlay, { paddingBottom: bottom + 60 }]}>
          <View style={styles.modalContent}>
            {/* Dismiss symbol at the top of the modal */}
            <DismissMenuModalSymbol />
            <View style={{ paddingBottom: bottom }}>
              {/* Render header based on the type of item */}
              {selectedSong !== null
                ? renderSongItem(selectedSong)
                : selectedPlaylist !== null && type === "playlist"
                  ? renderPlaylistItem({ item: selectedPlaylist })
                  : selectedAlbum !== null && type === "album"
                    ? renderPlaylistItem({ item: selectedAlbum })
                    : selectedRemotePlaylist !== null &&
                        type === "remotePlaylist"
                      ? renderPlaylistItem({ item: selectedRemotePlaylist })
                      : null}

              <Divider
                style={{
                  backgroundColor: "rgba(255,255,255,0.3)",
                  height: 0.3,
                }}
              />

              {/* Render menu items filtered by the item type */}
              {menuItems
                .filter((item) => item.types.includes(type))
                .map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.menuItem}
                    onPress={item.onPress}
                  >
                    {item.icon}
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        </View>
      </VerticalSwipeGesture>
    </View>
  );
}

/**
 * `DismissMenuModalSymbol` component.
 * Displays a small horizontal bar at the top of the menu modal,
 * indicating that the modal can be dismissed by swiping down.
 * @returns The rendered dismiss symbol component.
 */
const DismissMenuModalSymbol = () => {
  return (
    <View
      style={{
        position: "absolute",
        top: 8,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
      }}
    >
      <View
        accessible={false}
        style={{
          width: scale(30),
          height: verticalScale(4.5),
          borderRadius: 8,
          backgroundColor: "#fff",
          opacity: 0.7,
        }}
      />
    </View>
  );
};

// Styles for the MenuModal component.
const styles = ScaledSheet.create({
  modalBackground: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#151515",
    borderRadius: 10,
    paddingTop: 16,
    paddingBottom: 8,
    height: verticalScale(736 * 0.6),
    width: "342@s",
    alignSelf: "center",
  },
  menuHeaderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  thumbnail: {
    width: "35@s",
    height: "35@s",
    borderRadius: 8,
    marginRight: 15,
  },
  menuHeaderText: {
    flex: 1,
  },
  menuHeaderTitle: {
    color: Colors.text,
    fontSize: "16@ms",
  },
  songArtist: {
    color: Colors.textMuted,
    fontSize: "14@ms",
  },
  menuItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  menuItemText: {
    color: Colors.text,
    fontSize: "18@ms",
    paddingLeft: 18,
    fontWeight: "400",
  },
});
