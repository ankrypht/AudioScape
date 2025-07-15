/**
 * This file defines the layout for the main tab navigation of the application.
 * It configures the appearance of the tab bar, including icons, labels, and background,
 * and specifies the screens accessible through each tab.
 *
 * @packageDocumentation
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { FloatingPlayer } from "@/components/FloatingPlayer";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters/extend";

/**
 * `TabLayoutContent` component.
 * Configures the tab navigation and renders the `FloatingPlayer`.
 */
function TabLayoutContent() {
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            borderTopWidth: 0,
            bottom: 0,
            left: 0,
            right: 0,
            position: "absolute",
            elevation: 0, // Remove shadow on Android.
          },
          tabBarLabelStyle: {
            fontSize: moderateScale(10),
            fontWeight: "900",
          },
          tabBarActiveTintColor: Colors.tint,
          tabBarInactiveTintColor: "#afafaf",
          headerShown: false, // Hide header for all tab screens.
          tabBarBackground: () => (
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
              }}
            >
              {/* Gradient overlay for the tab bar background */}
              <LinearGradient
                colors={["transparent", "black"]}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 115 + bottom,
                }}
              />
            </View>
          ),
        }}
      >
        {/* Home Tab */}
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "home" : "home-outline"}
                color={color}
              />
            ),
          }}
        />
        {/* Favorites Tab */}
        <Tabs.Screen
          name="favorites"
          options={{
            title: "Favorites",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "heart" : "heart-outline"}
                color={color}
              />
            ),
          }}
        />
        {/* Playlists Tab */}
        <Tabs.Screen
          name="playlists"
          options={{
            title: "Playlists",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "list" : "list-outline"}
                color={color}
              />
            ),
          }}
        />
        {/* Downloads Tab */}
        <Tabs.Screen
          name="downloads"
          options={{
            title: "Downloads",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "download" : "download-outline"}
                color={color}
              />
            ),
          }}
        />
        {/* Index screen, hidden from tabs */}
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
      {/* Floating player component, positioned above the tab bar */}
      <FloatingPlayer
        style={{
          position: "absolute",
          left: 8,
          right: 8,
          bottom: bottom + 60,
        }}
      />
    </View>
  );
}

/**
 * `TabLayout` component.
 * A wrapper component for `TabLayoutContent`.
 */
export default function TabLayout() {
  return <TabLayoutContent />;
}
