/**
 * This file defines TypeScript interfaces for various data structures
 * related to search results and content from the YouTube API. These interfaces
 * ensure type safety and consistency when handling data across the application.
 */

/**
 * Base interface for all searchable items, providing common properties.
 */
interface BaseItem {
  id: string;
  thumbnail: string;
}

/**
 * Represents a song item, typically from search results or playlists.
 */
interface Song extends BaseItem {
  title: string;
  artist: string;
  url?: string;
  duration?: number;
}

/**
 * Represents a video item from search results.
 */
interface Video extends BaseItem {
  title: string;
  artist: string;
}

/**
 * Represents an album item from search results.
 */
interface Album extends BaseItem {
  title: string;
  artist: string;
  year: string | number;
}

/**
 * Represents an artist item from search results.
 */
interface Artist extends BaseItem {
  name: string;
  subtitle: string;
}

/**
 * Represents the top result in a search query.
 */
interface TopResult extends BaseItem {
  type: string;
  title: string;
  subtitle: string;
  artist: string;
}

/**
 * Defines the structure of data returned for a search results page.
 */
interface SearchPageData {
  topResult: TopResult | null;
  songs: Song[];
  videos: Video[];
  albums: Album[];
  artists: Artist[];
}

/**
 * Defines the structure of data returned for an album's page.
 */
interface AlbumPageData {
  title: string;
  subtitle: string;
  second_subtitle: string;
  thumbnail: string;
  songs: {
    id: string;
    title: string;
    duration: string;
  }[];
}

/**
 * Defines the structure of data returned for a playlist's page.
 */
interface PlaylistPageData {
  title: string;
  subtitle: string;
  second_subtitle: string;
  thumbnail: string;
  songs: {
    id: string;
    title: string;
    duration: number;
    thumbnail: string;
    artist: string;
  }[];
}

/**
 * Represents an item (album or video) displayed on an artist's page.
 */
interface ArtistPageItem {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  year?: string | number;
}

/**
 * Defines the structure of data returned for an artist's page.
 */
interface ArtistPageData {
  title: string;
  description: string;
  thumbnail: string;
  albums: ArtistPageItem[];
  songs: Song[];
  singlesAndEPs: ArtistPageItem[];
  videos: ArtistPageItem[];
}
