import React, { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, Linking } from "react-native";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { storage } from "@/storage";
import { Colors } from "@/constants/Colors";
import { ScaledSheet } from "react-native-size-matters/extend";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDMQ-6wcbIxzO_J8rqVT_AFgGXB3DZXnUM",
  authDomain: "audioscape-ankushsarkar.firebaseapp.com",
  projectId: "audioscape-ankushsarkar",
  storageBucket: "audioscape-ankushsarkar.firebasestorage.app",
  messagingSenderId: "160278040044",
  appId: "1:160278040044:web:9c98ba8c3b86bea94e04c9",
  measurementId: "G-CFXR04RLEH",
};

initializeApp(firebaseConfig);

export const MessageModal = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessage = async () => {
      const db = getFirestore();
      const docRef = doc(db, "appData", "activeMessage");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const storedMessageId = storage.getString("lastSeenMessageId");

        if (storedMessageId !== data.id || !data.showOnce) {
          setMessage(data.content);
          setIsModalVisible(true);

          storage.set("lastSeenMessageId", data.id);
        }
      }
    };

    fetchMessage();
  }, []);

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

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
                )
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
