/**
 * This file defines the layout for the `search` tab's nested stack navigator.
 * It configures the screens that are part of the search flow, such as the
 * artist and album detail pages, search, and generic item lists.
 */

import { Stack } from "expo-router";

/**
 * `HomeStackLayout` component.
 * Configures the stack navigator for the home tab, hiding headers for all screens.
 * @returns The rendered stack layout for the home tab.
 */
export default function SearchStackLayout() {
  return (
    <Stack>
      {/* Search screen */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* Artist detail screen */}
      <Stack.Screen name="artist" options={{ headerShown: false }} />
      {/* Album detail screen */}
      <Stack.Screen name="album" options={{ headerShown: false }} />
      {/* Playlist detail screen */}
      <Stack.Screen name="playlist" options={{ headerShown: false }} />
      {/* Generic item list screen */}
      <Stack.Screen name="itemList" options={{ headerShown: false }} />
    </Stack>
  );
}
