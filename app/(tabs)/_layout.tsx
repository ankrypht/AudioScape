/**
 * This file defines the layout for the main tab navigation of the application.
 * It configures the appearance of the tab bar, including icons, labels, and background,
 * and specifies the screens accessible through each tab.
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
          name="index"
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
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "search" : "search-outline"}
                color={color}
              />
            ),
          }}
        />
        {/* Library Tab */}
        <Tabs.Screen
          name="library"
          options={{
            title: "Library",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "albums" : "albums-outline"}
                color={color}
              />
            ),
          }}
        />
        {/* Settings Tab */}
        <Tabs.Screen name="settings" options={{ href: null }} />
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
