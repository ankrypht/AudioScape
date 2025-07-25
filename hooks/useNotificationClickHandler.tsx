/**
 * This file contains a custom React hook that handles clicks on the music player
 * notification. When the notification is tapped, it deep-links back into the app and navigates
 * the user to the main player screen.
 *
 * @packageDocumentation
 */

import { useEffect } from "react";
import { Linking } from "react-native";
import { useRouter } from "expo-router";

/**
 * A custom hook that sets up a listener for notification click events.
 * It uses React Native's `Linking` module to handle deep links and `expo-router`
 * to navigate to the player screen.
 */
const useNotificationClickHandler = () => {
  const router = useRouter();

  useEffect(() => {
    /**
     * Handles the deep link event triggered by a notification click.
     * @param event The linking event containing the URL.
     */
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      // Check if the URL matches the one sent from the notification.
      if (url === "trackplayer://notification.click") {
        // Navigate to the player screen.
        // The logic here attempts to dismiss any existing modals before navigating.
        await router.push("..");
        if (await router.canDismiss()) {
          await router.dismissTo("/player");
        } else {
          await router.navigate("/player");
        }
      }
    };

    // Add the event listener for deep links.
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Clean up the event listener when the component unmounts.
    return () => {
      subscription.remove();
    };
  }, [router]);
};

export default useNotificationClickHandler;
