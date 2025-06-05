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
import { install } from "react-native-quick-crypto";

install();

SplashScreen.preventAutoHideAsync();

TrackPlayer.registerPlaybackService(() => playbackService);

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [trackPlayerLoaded, setTrackPlayerLoaded] = useState(false);

  const handleTrackPlayerLoaded = useCallback(async () => {
    await TrackPlayer.reset();
    setTrackPlayerLoaded(true);
  }, []);

  useSetupTrackPlayer({
    onLoad: handleTrackPlayerLoaded,
  });

  useLogTrackPlayerState();
  useNotificationClickHandler();

  useEffect(() => {
    const initialize = async () => {
      await setupNotificationChannel();
      await initializeLibrary();
      await SystemBars.setStyle({
        statusBar: "light",
        navigationBar: "light",
      });
      if (fontsLoaded && trackPlayerLoaded) {
        await SplashScreen.hideAsync();
      }
    };

    initialize();
  }, [fontsLoaded, trackPlayerLoaded]);

  if (!fontsLoaded || !trackPlayerLoaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <MusicPlayerProvider>
        <LyricsProvider>
          <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <ThemeProvider value={DarkTheme}>
                <Stack>
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="player"
                    options={{
                      presentation: "transparentModal",
                      headerShown: false,
                    }}
                  />
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
                  <Stack.Screen name="+not-found" />
                </Stack>
              </ThemeProvider>
              <UpdateModal />
              <MessageModal />
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </LyricsProvider>
      </MusicPlayerProvider>
    </Provider>
  );
}
