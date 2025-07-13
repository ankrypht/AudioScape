import { Stack } from "expo-router";

export default function HomeStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="artist" options={{ headerShown: false }} />
      <Stack.Screen name="album" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="itemList" options={{ headerShown: false }} />
    </Stack>
  );
}
