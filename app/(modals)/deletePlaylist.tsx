/**
 * This file defines the `DeletePlaylistDialog` component, a modal dialog
 * that prompts the user for confirmation before deleting a playlist. It integrates
 * with the Redux store to perform the deletion and provides visual feedback.
 */

import { Colors } from "@/constants/Colors";
import { triggerHaptic } from "@/helpers/haptics";
import { usePlaylists } from "@/store/library";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { ToastAndroid } from "react-native";
import { Button, Dialog } from "react-native-paper";
import { moderateScale } from "react-native-size-matters/extend";

/**
 * `DeletePlaylistDialog` component.
 * Displays a confirmation dialog for deleting a playlist.
 * @function
 * @returns The rendered dialog component.
 */
const DeletePlaylistDialog = () => {
  // Get the playlist name from local search parameters.
  const { playlistName } = useLocalSearchParams<{ playlistName: string }>();
  // Hook to access playlist management functions from Redux.
  const { deleteExistingPlaylist } = usePlaylists();
  const router = useRouter();

  /**
   * Handles the playlist deletion process.
   * Deletes the playlist, shows a toast message, and navigates back.
   */
  async function deletePlaylist(): Promise<void> {
    if (playlistName) {
      triggerHaptic();
      await deleteExistingPlaylist(playlistName);
      ToastAndroid.show("Playlist deleted", ToastAndroid.SHORT);
    }
    // Navigate back and dismiss the modal.
    await router.back();
    if (await router.canDismiss()) await router.dismiss();
  }

  return (
    <Dialog
      visible={true} // The dialog is always visible when this component is mounted.
      onDismiss={() => router.back()} // Dismiss the dialog when the user taps outside or presses back.
      style={{ backgroundColor: "#101010", padding: moderateScale(8) }}
    >
      <Dialog.Title style={{ color: Colors.text, fontSize: moderateScale(20) }}>
        Delete this playlist?
      </Dialog.Title>
      <Dialog.Actions>
        {/* Cancel button */}
        <Button
          textColor={Colors.text}
          labelStyle={{ fontSize: moderateScale(13) }}
          onPress={() => {
            triggerHaptic();
            router.back();
          }}
        >
          Cancel
        </Button>
        {/* Delete button */}
        <Button
          textColor={"red"}
          labelStyle={{ fontSize: moderateScale(13) }}
          onPress={deletePlaylist}
        >
          Delete
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

export default DeletePlaylistDialog;
