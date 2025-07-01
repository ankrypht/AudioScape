import React, { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, Linking } from "react-native";
import * as Application from "expo-application";
import { Colors } from "@/constants/Colors";
import { ScaledSheet } from "react-native-size-matters/extend";

export const UpdateModal = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpToDate, setIsUpToDate] = useState(false);
  const [message, setMessage] = useState<string>("");

  function compareVersions(v1: string, v2: string): number {
    const normalizeVersion = (version: string) => {
      return version.startsWith("v") ? version.slice(1) : version;
    };

    const [major1, minor1, patch1] = normalizeVersion(v1)
      .split(".")
      .map(Number);
    const [major2, minor2, patch2] = normalizeVersion(v2)
      .split(".")
      .map(Number);

    if (major1 !== major2) return major1 > major2 ? 1 : -1;
    if (minor1 !== minor2) return minor1 > minor2 ? 1 : -1;
    if (patch1 !== patch2) return patch1 > patch2 ? 1 : -1;
    return 0;
  }

  //const message = `A new version of AudioScape is available!\n\nPlease update to version ${latestVersion} to get the latest features and bug fixes.\n\nDownload and install the latest version from "Assets" section from : https://github.com/ankrypht/AudioScape/releases/latest`;

  useEffect(() => {
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

        setMessage(
          `A new version of AudioScape is available!\n\nPlease update to version ${data.tag_name} to get the latest features and bug fixes.\n\nDownload and install the latest version from the link below:\n${data.assets[0].browser_download_url}`,
        );

        if (
          compareVersions(
            `${Application.nativeApplicationVersion}`,
            data.tag_name,
          ) === -1
        ) {
          setIsModalVisible(true);
        } else {
          setIsUpToDate(true);
        }
      } catch (err: any) {
        console.error(err.message);
      }
    };

    fetchMessage();
  }, []);

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err),
    );
  };

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
            {message
              .replace(/\\n/g, "\n")
              .split(/(https?:\/\/\S+)/)
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
            onPress={() => setIsModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

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
