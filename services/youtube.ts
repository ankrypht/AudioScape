// === START ===  Making Youtube.js work
import "event-target-polyfill";
import "web-streams-polyfill";
import "text-encoding-polyfill";
import "react-native-url-polyfill/auto";
import { decode, encode } from "base-64";
import { MMKV } from "react-native-mmkv";
import Innertube, { UniversalCache } from "youtubei.js";
import { Track } from "react-native-track-player";
import { fetch } from "expo/fetch";

if (!global.btoa) {
  global.btoa = encode;
}

if (!global.atob) {
  global.atob = decode;
}

// @ts-expect-error
global.mmkvStorage = MMKV as any;

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

// === END === Making Youtube.js work

// Create and export a promise that resolves to an Innertube instance
export const innertube: Promise<Innertube> = (async () => {
  const res = await fetch(`${process.env.EXPO_PUBLIC_PO_TOKEN_API}`);
  const data = await res.json();
  const poToken = data.poToken;
  const visitorData = data.visitorData;

  //console.log("poToken", poToken);
  //console.log("visitorData", visitorData);

  return Innertube.create({
    po_token: poToken,
    visitor_data: visitorData,
    cache: new UniversalCache(true),
    generate_session_locally: true,
  });
})();

export async function getInfo(
  inid: string,
  title?: string,
  author?: string,
): Promise<Track | null> {
  try {
    const yt = await innertube;
    const info = await yt.getBasicInfo(inid, "MWEB");

    if (info.playability_status?.status !== "OK") {
      console.log(
        `[MusicPlayer] Video ${inid} is not available: ${info.playability_status?.reason}`,
      );
      return null;
    }

    const format = info.chooseFormat({ type: "audio", quality: "best" });
    if (!format) {
      console.log(`[MusicPlayer] No suitable audio format found for ${inid}`);
      return null;
    }

    const streamUrl = `${format.decipher(yt.session.player)}`;
    const item = info.basic_info;

    const res: Track = {
      id: inid,
      url: streamUrl,
      title: title || item.title || "Unknown title",
      artist:
        author || item.author?.replace(" - Topic", "") || "Unknown artist",
      artwork:
        item.thumbnail && item.thumbnail[0]
          ? item.thumbnail[0].url
          : "https://placehold.co/512x512/000000/FFFFFF?text=Music",
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

export function processItems(items: any[], type: "song"): Song[];
export function processItems(items: any[], type: "video"): Video[];
export function processItems(items: any[], type: "album"): Album[];
export function processItems(items: any[], type: "artist"): Artist[];
export function processItems(
  items: any[],
  type: "song" | "video" | "album" | "artist",
): (Song | Video | Album | Artist)[] {
  return items
    .filter((item) => item?.id && (item.title || item.name))
    .map((item) => {
      const baseItem: BaseItem = {
        id: item.id,
        thumbnail:
          item.thumbnail?.contents?.[0]?.url ??
          "https://placehold.co/100x100/333/fff?text=?",
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
    .filter((item): item is Song | Video | Album | Artist => item !== null);
}

export function processSearchPageData(searchResultsAll: any): SearchPageData {
  const topResultSection = searchResultsAll.contents?.find(
    (c: any) => c.header?.title?.text === "Top result",
  );

  let topResult: TopResult | null = null;
  if (topResultSection) {
    topResult = {
      type:
        topResultSection.subtitle?.runs?.[0]?.text?.toLowerCase() || "unknown",
      id:
        topResultSection.title.endpoint.payload.browseId ||
        topResultSection.title.endpoint.payload.videoId,
      title: topResultSection.title.text,
      thumbnail:
        topResultSection.thumbnail.contents[0]?.url ??
        "https://placehold.co/50",
      subtitle: topResultSection.subtitle.text,
      artist: topResultSection.subtitle?.runs?.[2]?.text ?? "Unknown Artist",
    };
  }

  return {
    topResult,
    songs: processItems(searchResultsAll.songs?.contents || [], "song"),
    videos: processItems(searchResultsAll.videos?.contents || [], "video"),
    albums: processItems(searchResultsAll.albums?.contents || [], "album"),
    artists: processItems(searchResultsAll.artists?.contents || [], "artist"),
  };
}

export function processAlbumPageData(albumResponse: any): AlbumPageData {
  return {
    title: albumResponse?.header?.title?.text,
    subtitle: albumResponse?.header?.subtitle?.text,
    second_subtitle: albumResponse?.header?.second_subtitle?.text,
    thumbnail:
      albumResponse?.header?.thumbnail?.contents?.[0]?.url ??
      "https://placehold.co/50",
    songs:
      albumResponse?.contents?.map((song: any) => ({
        id: song?.id,
        title: song?.title,
        duration: song?.duration?.text,
      })) ?? [],
  };
}

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
        thumbnail: item.thumbnail?.[0]?.url ?? "https://placehold.co/50",
      };

      if (type === "album") {
        baseItem.year = item.year ?? "";
      }

      return baseItem;
    });
}

export function processArtistPageData(artistPage: any): ArtistPageData {
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
      "https://placehold.co/50",
    albums: processArtistPageDataItem(findSection(["Albums"]), "album"),
    songs: processItems(findSection(["Top songs", "Songs"]), "song"),
    singlesAndEPs: processArtistPageDataItem(
      findSection(["Singles & EPs", "Singles and EPs"]),
      "album",
    ),
    videos: processArtistPageDataItem(findSection(["Videos"]), "video"),
  };
}
