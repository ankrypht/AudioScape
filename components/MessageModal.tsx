/**
 * This file defines the `MessageModal` component, which displays a dynamic message
 * fetched from a Firebase Firestore database. The modal can be configured to show once per message ID
 * and supports clickable links within its content.
 */

import { Colors } from "@/constants/Colors";
import { triggerHaptic } from "@/helpers/haptics";
import { storage } from "@/storage";
import { initializeApp } from "firebase/app";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Linking, Modal, Text, TouchableOpacity, View } from "react-native";
import { ScaledSheet } from "react-native-size-matters/extend";

// Firebase configuration for initializing the app.
const firebaseConfig = {
  apiKey: "AIzaSyDMQ-6wcbIxzO_J8rqVT_AFgGXB3DZXnUM",
  authDomain: "audioscape-ankushsarkar.firebaseapp.com",
  projectId: "audioscape-ankushsarkar",
  storageBucket: "audioscape-ankushsarkar.firebasestorage.app",
  messagingSenderId: "160278040044",
  appId: "1:160278040044:web:9c98ba8c3b86bea94e04c9",
  measurementId: "G-CFXR04RLEH",
};

// Initialize Firebase with the provided configuration.
initializeApp(firebaseConfig);

/**
 * `MessageModal` component.
 * Fetches and displays a message from Firestore. The message can be dismissed
 * and will not reappear if `showOnce` is true and it has been seen.
 */
export const MessageModal = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Fetches the active message from Firestore.
     * @returns {Promise<void>} A promise that resolves when the message is fetched.
     */
    const fetchMessage = async () => {
      const db = getFirestore();
      const docRef = doc(db, "appData", "activeMessage");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const storedMessageId = storage.getString("lastSeenMessageId");

        // Check if the message is new or if it should always be shown.
        if (storedMessageId !== data.id || !data.showOnce) {
          setMessage(data.content);
          setIsModalVisible(true);

          // Store the ID of the message that was just shown.
          storage.set("lastSeenMessageId", data.id);
        }
      }
    };

    fetchMessage();
  }, []);

  /**
   * Handles opening URLs found within the message text.
   * @param url - The URL string to open.
   */
  const handleLinkPress = (url: string) => {
    triggerHaptic();
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err),
    );
  };

  // If no message is loaded, render nothing.
  if (!message) return null;

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

// Styles for the MessageModal component.
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
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: "black",
    fontSize: "15@ms",
    fontWeight: "bold",
    textAlign: "center",
  },
});
