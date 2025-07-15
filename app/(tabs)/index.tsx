/**
 * This file serves as the default entry point for the tab navigation.
 * It immediately redirects to the `home` tab, ensuring that the application
 * always starts on the main home screen when a user enters the tab flow.
 *
 * @packageDocumentation
 */

import { Redirect } from "expo-router";

/**
 * `Index` component.
 * A simple component that redirects the user to the home tab.
 */
export default function Index() {
  return <Redirect href="/(tabs)/home" />;
}
