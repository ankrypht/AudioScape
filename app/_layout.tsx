/**
 * This file serves as the root layout for the entire AudioScape application.
 * It is responsible for setting up global contexts and providers such as Redux, music player,
 * lyrics, safe area, and gesture handling. It also handles font loading, TrackPlayer initialization,
 * splash screen management, and defines the main navigation stack for the app.
 *
 * @packageDocumentation
 */

import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import "react-native-reanimated";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useSetupTrackPlayer } from "@/hooks/useSetupTrackPlayer";
import { SystemBars } from "react-native-edge-to-edge";
import { useLogTrackPlayerState } from "@/hooks/useLogTrackPlayerState";
import useNotificationClickHandler from "@/hooks/useNotificationClickHandler";
import TrackPlayer from "react-native-track-player";
import { MessageModal } from "@/components/MessageModal";
import { UpdateModal } from "@/components/UpdateModal";
import { playbackService } from "@/constants/playbackService";
import { MusicPlayerProvider } from "@/components/MusicPlayerContext";
import { LyricsProvider } from "@/hooks/useLyricsContext";
import { initializeLibrary, store } from "@/store/library";
import { Provider } from "react-redux";
import { setupNotificationChannel } from "@/services/download";

// Prevent the splash screen from auto-hiding until fonts and TrackPlayer are loaded.
SplashScreen.preventAutoHideAsync();

// Register the background playback service for TrackPlayer.
TrackPlayer.registerPlaybackService(() => playbackService);

// Configure Reanimated logger for debugging animations.
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

/**
 * RootLayout component.
 * This is the main entry point for the application's layout and global setup.
 */
export default function RootLayout() {
  // Load custom fonts.
  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Meriva: require("../assets/fonts/Meriva.ttf"),
  });
  // State to track if TrackPlayer has been successfully loaded and initialized.
  const [trackPlayerLoaded, setTrackPlayerLoaded] = useState(false);

  /**
   * Callback function executed once TrackPlayer is loaded.
   * Resets the player and updates the `trackPlayerLoaded` state.
   */
  const handleTrackPlayerLoaded = useCallback(async () => {
    await TrackPlayer.reset();
    setTrackPlayerLoaded(true);
  }, []);

  // Hook to set up and initialize TrackPlayer.
  useSetupTrackPlayer({
    onLoad: handleTrackPlayerLoaded,
  });

  // Hooks for logging TrackPlayer state and handling notification clicks.
  useLogTrackPlayerState();
  useNotificationClickHandler();

  // Effect to perform initialization tasks once fonts and TrackPlayer are loaded.
  useEffect(() => {
    const initialize = async () => {
      // Setup notification channel for downloads.
      await setupNotificationChannel();
      // Initialize the Redux library store (e.g., load saved data).
      await initializeLibrary();
      // Set system bar styles for a consistent look.
      await SystemBars.setStyle({
        statusBar: "light",
        navigationBar: "light",
      });
      // Hide the splash screen once all necessary assets and services are ready.
      if (fontsLoaded && trackPlayerLoaded) {
        await SplashScreen.hideAsync();
      }
    };

    initialize();
  }, [fontsLoaded, trackPlayerLoaded]);

  // Render nothing until fonts and TrackPlayer are loaded to prevent flickering.
  if (!fontsLoaded || !trackPlayerLoaded) {
    return null;
  }

  return (
    // Provide the Redux store to the entire application.
    <Provider store={store}>
      {/* Provide the music player context. */}
      <MusicPlayerProvider>
        {/* Provide the lyrics context. */}
        <LyricsProvider>
          {/* Ensure content is rendered within safe area boundaries. */}
          <SafeAreaProvider>
            {/* Root view for gesture handling. */}
            <GestureHandlerRootView style={{ flex: 1 }}>
              {/* Apply the dark theme from react-navigation. */}
              <ThemeProvider value={DarkTheme}>
                {/* Define the main navigation stack. */}
                <Stack>
                  {/* Main tabs screen, without a header. */}
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  {/* Player screen, presented as a transparent modal without a header. */}
                  <Stack.Screen
                    name="player"
                    options={{
                      presentation: "transparentModal",
                      headerShown: false,
                    }}
                  />
                  {/* Modals for various actions, presented as transparent modals without headers. */}
                  <Stack.Screen
                    name="(modals)/addToPlaylist"
                    options={{
                      presentation: "transparentModal",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="(modals)/deletePlaylist"
                    options={{
                      presentation: "transparentModal",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="(modals)/queue"
                    options={{
                      presentation: "transparentModal",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="(modals)/lyrics"
                    options={{
                      presentation: "transparentModal",
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="(modals)/menu"
                    options={{
                      presentation: "transparentModal",
                      headerShown: false,
                    }}
                  />
                  {/* Catch-all screen for unmatched routes. */}
                  <Stack.Screen name="+not-found" />
                </Stack>
              </ThemeProvider>
              {/* Global modals for updates and messages. */}
              <UpdateModal />
              <MessageModal />
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </LyricsProvider>
      </MusicPlayerProvider>
    </Provider>
  );
}
