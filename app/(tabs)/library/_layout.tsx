import { Stack } from "expo-router";

export default function LibraryStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="favorites" options={{ headerShown: false }} />
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
