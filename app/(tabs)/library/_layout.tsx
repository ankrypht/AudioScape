/**
 * This file defines the layout for the `library` tab's nested stack navigator.
 * It configures the screens that are part of the library flow, such as the
 * main library screen, favorites, downloads, and individual playlist pages.
 */

import { Stack } from "expo-router";

/**
 * `LibraryStackLayout` component.
 * Configures the stack navigator for the library tab, hiding headers for all screens.
 * @returns The rendered stack layout for the library tab.
 */
export default function LibraryStackLayout() {
  return (
    <Stack>
      {/* Main library screen */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* Favorites screen */}
      <Stack.Screen name="favorites" options={{ headerShown: false }} />
      {/* Downloads screen */}
      <Stack.Screen name="downloads" options={{ headerShown: false }} />
      {/* Individual playlist detail screen, dynamically named by `playlistName` */}
      <Stack.Screen
        name="[playlistName]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
