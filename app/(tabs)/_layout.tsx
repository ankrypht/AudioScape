import React from "react";
import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { FloatingPlayer } from "@/components/FloatingPlayer";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters/extend";

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
            elevation: 0,
          },
          tabBarLabelStyle: {
            fontSize: moderateScale(10),
            fontWeight: "900",
          },
          tabBarActiveTintColor: Colors.tint,
          tabBarInactiveTintColor: "#afafaf",
          headerShown: false,
          tabBarBackground: () => (
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
              }}
            >
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
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
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

export default function TabLayout() {
  return <TabLayoutContent />;
}
