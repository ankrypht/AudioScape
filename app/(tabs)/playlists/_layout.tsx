/**
 * This file defines the layout for the `playlists` tab's nested stack navigator.
 * It configures the screens that are part of the playlist flow, such as the main playlists screen
 * and individual playlist detail screens.
 *
 * @packageDocumentation
 */

import { defaultStyles } from "@/styles";
import { Stack } from "expo-router";
import { View } from "react-native";

/**
 * `PlaylistsScreenLayout` component.
 * Configures the stack navigator for the playlists tab, hiding headers for all screens.
 */
const PlaylistsScreenLayout = () => {
  return (
    <View style={defaultStyles.container}>
      <Stack>
        {/* Main playlists screen */}
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Individual playlist detail screen, dynamically named by `playlistName` */}
        <Stack.Screen
          name="[playlistName]"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  );
};

export default PlaylistsScreenLayout;
