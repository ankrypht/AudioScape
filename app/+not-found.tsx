/**
 * This file defines the 404 "Not Found" screen for the application.
 * It is displayed when a user navigates to a route that does not exist.
 */

import { Link, Stack } from "expo-router";
import { StyleSheet, View, Text } from "react-native";

/**
 * `NotFoundScreen` component.
 * Renders a simple screen indicating that the requested page does not exist,
 * with a link to navigate back to the home screen.
 */
export default function NotFoundScreen() {
  return (
    <>
      {/* Set the title for the screen in the navigation header. */}
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Text style={styles.titleText}>This screen does not exist.</Text>
        {/* Link to navigate back to the home screen. */}
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

// Styles for the NotFoundScreen component.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  titleText: {
    color: "white",
    fontSize: 25,
    fontWeight: "bold",
    lineHeight: 32,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    lineHeight: 30,
    fontSize: 16,
    color: "#0a7ea4",
  },
});
