/**
 * This file defines the `UpdateModal` component, which checks for new application
 * versions available on GitHub and prompts the user to update if a newer version is found.
 * It fetches release information from the GitHub API and displays a modal with update details.
 *
 * @packageDocumentation
 */

import { Colors } from "@/constants/Colors";
import { triggerHaptic } from "@/helpers/haptics";
import * as Application from "expo-application";
import React, { useEffect, useState } from "react";
import { Linking, Modal, Text, TouchableOpacity, View } from "react-native";
import { ScaledSheet } from "react-native-size-matters/extend";

/**
 * `UpdateModal` component.
 * Checks for new app versions on GitHub and displays a modal if an update is available.
 */
export const UpdateModal = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpToDate, setIsUpToDate] = useState(false);
  const [message, setMessage] = useState<string>("");

  /**
   * Compares two version strings (e.g., "1.0.0", "v1.0.1").
   * @param v1 - The first version string.
   * @param v2 - The second version string.
   * @returns {number} 1 if v1 > v2, -1 if v1 < v2, 0 if v1 === v2.
   */
  function compareVersions(v1: string, v2: string): number {
    // Normalize version strings by removing leading 'v' and splitting by '.'.
    const normalizeVersion = (version: string) => {
      return version.startsWith("v") ? version.slice(1) : version;
    };

    const [major1, minor1, patch1] = normalizeVersion(v1)
      .split(".")
      .map(Number);
    const [major2, minor2, patch2] = normalizeVersion(v2)
      .split(".")
      .map(Number);

    // Compare major, minor, and patch versions.
    if (major1 !== major2) return major1 > major2 ? 1 : -1;
    if (minor1 !== minor2) return minor1 > minor2 ? 1 : -1;
    if (patch1 !== patch2) return patch1 > patch2 ? 1 : -1;
    return 0;
  }

  useEffect(() => {
    /**
     * Fetches the latest release information from the GitHub API.
     * @returns {Promise<void>} A promise that resolves when the message is fetched.
     */
    const fetchMessage = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/repos/ankrypht/AudioScape/releases/latest",
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();

        // Construct the update message with the latest version and download URL.
        setMessage(
          `A new version of AudioScape is available!\n\nPlease update to version ${data.tag_name} to get the latest features and bug fixes.\n\nDownload and install the latest version from the link below:\n${data.assets[0].browser_download_url}`,
        );

        // Compare the current app version with the latest release version.
        if (
          compareVersions(
            `${Application.nativeApplicationVersion}`,
            data.tag_name,
          ) === -1
        ) {
          setIsModalVisible(true); // Show modal if a newer version is available.
        } else {
          setIsUpToDate(true); // Mark as up-to-date.
        }
      } catch (err: any) {
        console.error(err.message);
      }
    };

    fetchMessage();
  }, []);

  /**
   * Handles opening URLs found within the message text.
   * @param url The URL string to open.
   */
  const handleLinkPress = (url: string) => {
    triggerHaptic();
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err),
    );
  };

  // If the app is up-to-date, render nothing.
  if (isUpToDate) return null;

  return (
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={() => setIsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>
            {/* Process message content to replace \n with newlines and make URLs clickable */}
            {message
              .replace(/\\n/g, "\n")
              .split(/(https?:\/\/\S+)/) // Split by URL patterns
              .map((part, index) =>
                /^https?:\/\//.test(part) ? (
                  <Text
                    key={index}
                    style={styles.linkText}
                    onPress={() => handleLinkPress(part)}
                  >
                    {part}
                  </Text>
                ) : (
                  <Text key={index}>{part}</Text>
                ),
              )}
          </Text>

          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              triggerHaptic();
              setIsModalVisible(false);
            }}
          >
            <Text style={styles.modalButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Styles for the UpdateModal component.
const styles = ScaledSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  modalContent: {
    width: "300@ms",
    padding: "10@ms",
    backgroundColor: Colors.background,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#636363",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: "16@ms",
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center",
    flexWrap: "wrap",
  },
  linkText: {
    color: "#0252c2",
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "white",
    paddingVertical: "8@ms",
    paddingHorizontal: "16@ms",
    borderRadius: 50,
    flex: 1,
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: "black",
    fontSize: "15@ms",
    fontWeight: "bold",
    textAlign: "center",
  },
});
