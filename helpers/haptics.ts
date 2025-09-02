/**
 * This file provides wrapper functions for the `expo-haptics` library,
 * making it easier to trigger different types of haptic feedback consistently
 * across the application.
 */

import * as Haptics from "expo-haptics";

/**
 * Triggers a haptic feedback impact, which is a short, distinct vibration.
 * This is useful for confirming actions like button presses or successful gestures.
 *
 * @param {Haptics.AndroidHaptics} [type=Haptics.AndroidHaptics.Confirm] - The specific type of
 *   haptic impact to trigger. Defaults to `Confirm`, which is a standard confirmation vibration.
 * @see https://docs.expo.dev/versions/latest/sdk/haptics/#hapticsperformandroidhapticsasynctype
 *   for a full list of available haptic types on Android.
 */
export const triggerHaptic = (
  type: Haptics.AndroidHaptics = Haptics.AndroidHaptics.Confirm,
) => {
  Haptics.performAndroidHapticsAsync(type);
};

/**
 * Triggers a notification-style haptic feedback, which is typically a more complex
 * vibration pattern used to signify success, a warning, or an error.
 *
 * @param {Haptics.NotificationFeedbackType} [type=Haptics.NotificationFeedbackType.Success] - The
 *   type of notification feedback to trigger. Defaults to `Success`.
 * @see https://docs.expo.dev/versions/latest/sdk/haptics/#hapticsnotificationasynctype
 *   for the different notification feedback types available.
 */
export const triggerNotificationHaptic = (
  type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType
    .Success,
) => {
  Haptics.notificationAsync(type);
};
