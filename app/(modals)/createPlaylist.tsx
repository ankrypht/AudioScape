/**
 * This file defines the `CreatePlaylistModal` component, a modal screen
 * that allows users to create a new playlist by providing a name.
 *
 * @packageDocumentation
 */

import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ToastAndroid,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { ScaledSheet } from "react-native-size-matters/extend";

/**
 * Props for the `CreatePlaylistModal` component.
 * @property visible - Controls the visibility of the modal.
 * @property onCreate - Callback function when a new playlist is created.
 * @property onCancel - Callback function when the modal is cancelled.
 */
export interface CreatePlaylistModalProps {
  visible: boolean;
  onCreate: (playlistName: string) => void;
  onCancel: () => void;
}

/**
 * `CreatePlaylistModal` component.
 * Provides an input field for the user to enter a new playlist name and buttons to create or cancel.
 * @function
 * @param props - The properties for the modal.
 * @returns The rendered modal component.
 */
const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  visible,
  onCreate,
  onCancel,
}) => {
  const [playlistName, setPlaylistName] = useState("");

  /**
   * Handles the creation of the playlist.
   * Validates the input and calls the `onCreate` callback.
   */
  const handleCreate = () => {
    if (!playlistName.trim()) {
      ToastAndroid.show(
        "Please enter a valid playlist name.",
        ToastAndroid.LONG,
      );
      return;
    }
    onCreate(playlistName.trim());
    setPlaylistName(""); // Clear the input field after creation.
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create New Playlist</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter playlist name"
            placeholderTextColor={Colors.textMuted}
            value={playlistName}
            onChangeText={setPlaylistName}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={handleCreate}>
              <Text style={styles.modalButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CreatePlaylistModal;

// Styles for the CreatePlaylistModal component.
const styles = ScaledSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "288@ms",
    backgroundColor: "#101010",
    padding: "20@ms",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: "20@ms",
    color: Colors.text,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    height: "40@ms",
    fontSize: "16@ms",
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    color: "white",
    paddingHorizontal: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
    flex: 1,
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: "black",
    fontSize: "16@ms",
    fontWeight: "bold",
    textAlign: "center",
  },
  cancelButtonText: {
    color: "white",
  },
  cancelButton: {
    backgroundColor: "#101010",
    borderColor: "#333",
    borderWidth: 1,
  },
});
