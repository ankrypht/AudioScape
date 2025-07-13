/* eslint-disable @typescript-eslint/no-unused-vars */

interface BaseItem {
  id: string;
  thumbnail: string;
}

interface Song extends BaseItem {
  title: string;
  artist: string;
  url?: string;
  duration?: number;
}

interface Video extends BaseItem {
  title: string;
  artist: string;
}

interface Album extends BaseItem {
  title: string;
  artist: string;
  year: string | number;
}

interface Artist extends BaseItem {
  name: string;
  subtitle: string;
}

interface TopResult extends BaseItem {
  type: string;
  title: string;
  subtitle: string;
  artist: string;
}

interface SearchPageData {
  topResult: TopResult | null;
  songs: Song[];
  videos: Video[];
  albums: Album[];
  artists: Artist[];
}

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

interface ArtistPageItem {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  year?: string | number;
}

interface ArtistPageData {
  title: string;
  description: string;
  thumbnail: string;
  albums: ArtistPageItem[];
  songs: Song[];
  singlesAndEPs: ArtistPageItem[];
  videos: ArtistPageItem[];
}
