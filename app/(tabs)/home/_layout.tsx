/**
 * This file defines the layout for the `home` tab's nested stack navigator.
 * It configures the screens that are part of the home flow, such as the main home screen,
 * artist and album detail pages, search, and generic item lists.
 *
 * @packageDocumentation
 */

import { Stack } from "expo-router";

/**
 * `HomeStackLayout` component.
 * Configures the stack navigator for the home tab, hiding headers for all screens.
 * @returns The rendered stack layout for the home tab.
 */
export default function HomeStackLayout() {
  return (
    <Stack>
      {/* Main home screen */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* Artist detail screen */}
      <Stack.Screen name="artist" options={{ headerShown: false }} />
      {/* Album detail screen */}
      <Stack.Screen name="album" options={{ headerShown: false }} />
      {/* Search screen */}
      <Stack.Screen name="search" options={{ headerShown: false }} />
      {/* Generic item list screen */}
      <Stack.Screen name="itemList" options={{ headerShown: false }} />
    </Stack>
  );
}
