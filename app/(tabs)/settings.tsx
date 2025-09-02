/**
 * This file defines the `SettingsScreen` component, which provides users with
 * options to manage their library data, such as importing and exporting playlists
 * and favorite tracks. It also displays the current application version.
 */

import { Colors } from "@/constants/Colors";
import { triggerHaptic } from "@/helpers/haptics";
import { exportLibraryData, importLibraryData } from "@/store/library";
import { defaultStyles } from "@/styles";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
  ToastAndroid,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScaledSheet, moderateScale } from "react-native-size-matters/extend";
import { Divider } from "react-native-paper";
import * as Application from "expo-application";

/**
 * `SettingsScreen` component.
 * Renders the settings page with options for library management and app information.
 */
const SettingsScreen = () => {
  const { top } = useSafeAreaInsets();
  const router = useRouter();

  /**
   * Handles the export of library data.
   * Triggers a haptic feedback, calls the export function, and shows a toast message.
   */
  const handleExport = async () => {
    triggerHaptic();
    try {
      await exportLibraryData();
      ToastAndroid.show("Library data has been exported.", ToastAndroid.LONG);
    } catch (error) {
      console.error("Export failed:", error);
      ToastAndroid.show(
        "An error occurred while exporting your library data.",
        ToastAndroid.LONG,
      );
    }
  };

  /**
   * Handles the import of library data.
   * Triggers a haptic feedback, calls the import function, and shows a toast message.
   */
  const handleImport = async () => {
    triggerHaptic();
    try {
      await importLibraryData();
      ToastAndroid.show(
        "Library data imported successfully.",
        ToastAndroid.LONG,
      );
    } catch (error) {
      console.error("Import failed:", error);
      ToastAndroid.show(
        "An error occurred while importing library data.",
        ToastAndroid.LONG,
      );
    }
  };

  return (
    <View style={defaultStyles.container}>
      {/* Header section with back button and title */}
      <View style={[styles.header, { paddingTop: top }]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={moderateScale(25)}
            color={Colors.text}
            onPress={() => {
              triggerHaptic();
              router.back();
            }}
            style={{ marginRight: 10 }}
          />

          <Text style={styles.headerText}>Settings</Text>
        </View>
      </View>
      <Divider
        style={{
          backgroundColor: "rgba(255,255,255,0.3)",
          height: 0.3,
        }}
      />
      <View style={styles.content}>
        {/* Library Management section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Library Management</Text>
          <Text style={styles.description}>
            Backup your playlists and favorite tracks, or import them from a
            file.
          </Text>

          {/* Import and Export buttons */}
          <TouchableOpacity style={styles.button} onPress={handleImport}>
            <Ionicons
              name="cloud-upload-outline"
              color={Colors.text}
              size={25}
            />
            <Text style={styles.buttonText}>Import Library</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleExport}>
            <Ionicons
              name="cloud-download-outline"
              color={Colors.text}
              size={25}
            />
            <Text style={styles.buttonText}>Export Library</Text>
          </TouchableOpacity>
        </View>
        {/* Footer with GitHub link and app version */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL("https://github.com/ankrypht/AudioScape")
            }
          >
            <Ionicons name="logo-github" size={30} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.versionText}>
            v{Application.nativeApplicationVersion}
          </Text>
        </View>
      </View>
    </View>
  );
};

// Styles for the SettingsScreen component.
const styles = ScaledSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 10,
    marginBottom: 2,
  },
  headerText: {
    fontSize: "22@ms",
    color: Colors.text,
    fontFamily: "Meriva",
    textAlign: "center",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: "22@ms",
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 10,
    marginTop: 20,
  },
  description: {
    fontSize: "16@ms",
    color: Colors.textMuted,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: Colors.text,
    fontSize: "18@ms",
    fontWeight: "bold",
    marginLeft: 10,
  },
  footer: {
    alignItems: "center",
  },
  versionText: {
    color: Colors.textMuted,
    fontSize: "12@ms",
    marginTop: 5,
  },
});

export default SettingsScreen;
