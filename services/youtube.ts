/**
 * This file serves as a wrapper for the youtubei.js library, enabling interaction
 * with YouTube's internal API (Innertube). It handles fetching video information, stream URLs,
 * search results, and processing various page data types like albums and artists.
 * It includes necessary polyfills to ensure compatibility with the React Native environment.
 */

// === START === Polyfills for youtubei.js in React Native
// The following section includes polyfills and global assignments required for youtubei.js
// to function correctly in a non-browser environment like React Native.
import { unknownTrackImageUri } from "@/constants/images";
import { decode, encode } from "base-64";
import "event-target-polyfill";
import { MMKV } from "react-native-mmkv";
import { Track } from "react-native-track-player";
import "react-native-url-polyfill/auto";
import "text-encoding-polyfill";
import "web-streams-polyfill";
import { Innertube } from "youtubei.js";

// Polyfill for btoa and atob, which are not available in React Native's JavaScriptCore.
if (!global.btoa) {
  global.btoa = encode;
}

if (!global.atob) {
  global.atob = decode;
}

// Assign MMKV storage to the global scope for youtubei.js to use for caching.
// @ts-expect-error
global.mmkvStorage = MMKV as any;

/**
 * CustomEvent polyfill.
 * The DOM 'CustomEvent' is not available in React Native, so this is a basic implementation.
 */
class CustomEvent extends Event {
  #detail;

  constructor(type: string, options?: CustomEventInit<any[]>) {
    super(type, options);
    this.#detail = options?.detail ?? null;
  }

  get detail() {
    return this.#detail;
  }
}

global.CustomEvent = CustomEvent as any;
// === END === Polyfills for youtubei.js in React Native

/**
 * A promise that resolves to a singleton Innertube instance.
 * This is initialized asynchronously by fetching necessary tokens from a custom API.
 * Using a promise ensures that any part of the app can access the instance
 * without worrying about its initialization state.
 */
export const innertube: Promise<Innertube> = (async () => {
  // Fetch the PO token and visitor data required to initialize Innertube.
  console.log(
    `[MusicPlayer] Fetching YouTube PO token and visitor data from ${process.env.EXPO_PUBLIC_PO_TOKEN_API}`,
  );

  const res = await fetch(`${process.env.EXPO_PUBLIC_PO_TOKEN_API}`);
  const data = await res.json();
  const poToken = data.poToken;
  const visitorData = data.visitorData;

  console.log(
    `[MusicPlayer] Fetched PO token: ${poToken}, Visitor Data: ${visitorData}`,
  );

  // Create the Innertube instance with the fetched credentials and a universal cache.
  const client = await Innertube.create({
    po_token: poToken,
    visitor_data: visitorData,
    generate_session_locally: true,
    player_id: "0004de42",
  });

  console.log("[MusicPlayer] Innertube instance created successfully.");

  return client;
})();

/**
 * Retrieves detailed information for a given YouTube video ID and formats it as a Track object.
 * @param inid - The YouTube video ID.
 * @param [title] - An optional title to override the fetched title.
 * @param [author] - An optional author to override the fetched author.
 * @returns {Promise<Track | null>} A promise that resolves to a Track object, or null if the video is unavailable or an error occurs.
 */
export async function getInfo(
  inid: string,
  title?: string,
  author?: string,
): Promise<Track | null> {
  try {
    // Await the singleton Innertube instance.
    const yt = await innertube;
    // Fetch basic video information.
    const info = await yt.getBasicInfo(inid, { client: "YTMUSIC" });

    // Check if the video is playable.
    if (info.playability_status?.status !== "OK") {
      console.log(
        `[MusicPlayer] Video ${inid} is not available: ${info.playability_status?.reason}`,
      );
      return null;
    }

    // Select the best available audio format.
    const format = info.chooseFormat({ type: "audio", quality: "best" });
    if (!format) {
      console.log(`[MusicPlayer] No suitable audio format found for ${inid}`);
      return null;
    }

    // Decipher the stream URL using the session player.
    const streamUrl = `${format.decipher(yt.session.player)}`;
    const item = info.basic_info;

    // Construct the Track object with the fetched and provided data.
    const res: Track = {
      id: inid,
      url: streamUrl,
      title: title || item.title || "Unknown title",
      artist:
        author || item.author?.replace(" - Topic", "") || "Unknown artist",
      artwork:
        item.thumbnail && item.thumbnail[0]
          ? item.thumbnail[0].url
          : unknownTrackImageUri,
      duration: item.duration,
    };
    return res;
  } catch (error) {
    console.log(
      `[MusicPlayer] Error getting info for ${inid}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
    return null;
  }
}

/**
 * Processes a list of raw items from the YouTube API into a structured format.
 * This function uses overloads to provide type safety based on the `type` parameter.
 * @param items - An array of items from the YouTube API response.
 * @param type - The type of items to process (e.g., "song", "video", "album", "artist").
 * @returns {Song[] | Video[] | Album[] | Artist[]} A processed array of items with a standardized structure.
 */
export function processItems(items: any[], type: "song"): Song[];
export function processItems(items: any[], type: "video"): Video[];
export function processItems(items: any[], type: "album"): Album[];
export function processItems(items: any[], type: "artist"): Artist[];
export function processItems(
  items: any[],
  type: "song" | "video" | "album" | "artist",
): (Song | Video | Album | Artist)[] {
  return items
    .filter((item) => item?.id && (item.title || item.name)) // Filter out items that lack an ID or a title/name.
    .map((item) => {
      const baseItem: BaseItem = {
        id: item.id,
        thumbnail: item.thumbnail?.contents?.[0]?.url ?? unknownTrackImageUri,
      };
      switch (type) {
        case "song":
          return {
            ...baseItem,
            title: item.title,
            artist: item.artists?.[0]?.name ?? "Unknown Artist",
          } as Song;
        case "video":
          return {
            ...baseItem,
            title: item.title,
            artist: item.authors?.[0]?.name ?? "Unknown Artist",
          } as Video;
        case "album":
          return {
            ...baseItem,
            title: item.title,
            artist: item.author?.name ?? "Unknown Artist",
            year: item.year ?? "",
          } as Album;
        case "artist":
          return {
            ...baseItem,
            name: item.name,
            subtitle: item.subtitle?.text,
          } as Artist;
        default:
          return null;
      }
    })
    .filter((item): item is Song | Video | Album | Artist => item !== null); // Filter out any null results from the map.
}

/**
 * Processes the full response from a search query into a structured SearchPageData object.
 * @param searchResultsAll - The raw search results object from the YouTube API.
 * @returns {SearchPageData} A structured object containing the top result and categorized lists of songs, videos, albums, and artists.
 */
export function processSearchPageData(searchResultsAll: any): SearchPageData {
  // Find the "Top result" section in the search response.
  const topResultSection = searchResultsAll.contents?.find(
    (c: any) => c.header?.title?.text === "Top result",
  );

  let topResult: TopResult | null = null;
  if (topResultSection) {
    topResult = {
      type: topResultSection.title.text.toLowerCase().includes("radio")
        ? "radio"
        : topResultSection.subtitle?.runs?.[0]?.text?.toLowerCase() ||
          "unknown",
      id:
        topResultSection.title.endpoint.payload.browseId ||
        topResultSection.title.endpoint.payload.videoId,
      title: topResultSection.title.text,
      thumbnail:
        topResultSection.thumbnail.contents[0]?.url ?? unknownTrackImageUri,
      subtitle: topResultSection.subtitle.text,
      artist: topResultSection.subtitle?.runs?.[2]?.text ?? "Unknown Artist",
    };
  }

  // Process each category of search results.
  return {
    topResult,
    songs: processItems(searchResultsAll.songs?.contents || [], "song"),
    videos: processItems(searchResultsAll.videos?.contents || [], "video"),
    albums: processItems(searchResultsAll.albums?.contents || [], "album"),
    artists: processItems(searchResultsAll.artists?.contents || [], "artist"),
  };
}

/**
 * Processes the response from an album page query into a structured AlbumPageData object.
 * @param albumResponse - The raw album page response from the YouTube API.
 * @returns {AlbumPageData} A structured object containing album details and a list of its songs.
 */
export function processAlbumPageData(albumResponse: any): AlbumPageData {
  return {
    title: albumResponse?.header?.title?.text,
    subtitle: albumResponse?.header?.subtitle?.text,
    second_subtitle: albumResponse?.header?.second_subtitle?.text,
    thumbnail:
      albumResponse?.header?.thumbnail?.contents?.[0]?.url ??
      "unknownTrackImageUri",
    songs:
      albumResponse?.contents
        ?.filter((item: any) => item?.id && item?.title)
        .map((song: any) => ({
          id: song?.id,
          title: song?.title,
          duration: song?.duration?.text,
        })) ?? [],
  };
}

/**
 * Processes the response from a playlist page query into a structured PlaylistPageData object.
 * @param playlistResponse - The raw playlist page response from the YouTube API.
 * @returns {PlaylistPageData} A structured object containing playlist details and a list of its songs.
 */
export function processPlaylistPageData(
  playlistResponse: any,
): PlaylistPageData {
  return {
    title: playlistResponse?.header?.title?.text,
    subtitle: playlistResponse?.header?.subtitle?.text,
    second_subtitle: playlistResponse?.header?.second_subtitle?.text,
    thumbnail:
      playlistResponse?.header?.thumbnail?.contents?.[0]?.url ??
      "unknownTrackImageUri",
    songs:
      playlistResponse?.contents
        ?.filter((item: any) => item?.id && item?.title)
        .map((song: any) => ({
          id: song?.id,
          title: song?.title,
          duration: song?.duration?.seconds,
          thumbnail:
            song?.thumbnail?.contents?.[0]?.url ?? "unknownTrackImageUri",
          artist: song?.authors?.[0]?.name ?? "Unknown Artist",
        })) ?? [],
  };
}

/**
 * A helper function to process items for an artist's page (albums or videos).
 * @param items - The raw items to process.
 * @param type - The type of item ("album" or "video").
 * @returns A processed array of ArtistPageItem objects.
 */
function processArtistPageDataItem(
  items: any[],
  type: "album" | "video",
): ArtistPageItem[] {
  return items
    .filter((item) => item?.id && item.title?.text)
    .map((item) => {
      const baseItem: ArtistPageItem = {
        id: item.id,
        title: item.title.text,
        subtitle: item.subtitle?.text ?? "",
        thumbnail: item.thumbnail?.[0]?.url ?? "unknownTrackImageUri",
      };

      if (type === "album") {
        baseItem.year = item.year ?? "";
      }

      return baseItem;
    });
}

/**
 * Processes the response from an artist page query into a structured ArtistPageData object.
 * @param artistPage The raw artist page response from the YouTube API.
 * @returns A structured object containing artist details and categorized lists of their work.
 */
export function processArtistPageData(artistPage: any): ArtistPageData {
  /**
   * Finds a specific section within the artist page data by its title.
   * @param titles An array of possible section titles to look for.
   * @returns The contents of the found section, or an empty array if not found.
   */
  const findSection = (titles: string[]): any[] => {
    for (const title of titles) {
      const section = artistPage.sections.find(
        (s: any) => s.title?.text === title || s.header?.title?.text === title,
      );
      // If a section is found and it has contents, return them immediately.
      if (section?.contents) {
        return section.contents;
      }
    }
    // If no section with content is found after checking all titles, return an empty array.
    return [];
  };

  return {
    title: artistPage.header?.title?.text,
    description: artistPage.header?.description?.text ?? "",
    thumbnail:
      artistPage.header?.thumbnail?.contents?.[0]?.url ??
      "unknownTrackImageUri",
    albums: processArtistPageDataItem(findSection(["Albums"]), "album"),
    songs: processItems(findSection(["Top songs", "Songs"]), "song"),
    singlesAndEPs: processArtistPageDataItem(
      findSection(["Singles & EPs", "Singles and EPs"]),
      "album",
    ),
    videos: processArtistPageDataItem(findSection(["Videos"]), "video"),
  };
}
