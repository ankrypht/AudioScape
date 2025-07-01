import * as React from "react";
import { ToastAndroid } from "react-native";
import { Button, Dialog } from "react-native-paper";
import { Colors } from "@/constants/Colors";
import { usePlaylists } from "@/store/library";
import { useRouter, useLocalSearchParams } from "expo-router";
import { moderateScale } from "react-native-size-matters/extend";

const DeletePlaylistDialog = () => {
  const { playlistName } = useLocalSearchParams<{ playlistName: string }>();
  const { deleteExistingPlaylist } = usePlaylists();
  const router = useRouter();

  async function deletePlaylist() {
    await deleteExistingPlaylist(playlistName);
    await ToastAndroid.show("Playlist deleted", ToastAndroid.SHORT);
    await router.back();
    if (await router.canDismiss()) await router.dismiss();
  }

  return (
    <Dialog
      visible={true}
      onDismiss={() => router.back()}
      style={{ backgroundColor: "#101010", padding: moderateScale(8) }}
    >
      <Dialog.Title style={{ color: Colors.text, fontSize: moderateScale(20) }}>
        Delete this playlist?
      </Dialog.Title>
      <Dialog.Actions>
        <Button
          textColor={Colors.text}
          labelStyle={{ fontSize: moderateScale(13) }}
          onPress={() => router.back()}
        >
          Cancel
        </Button>
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
