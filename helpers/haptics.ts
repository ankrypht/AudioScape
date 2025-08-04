import * as Haptics from "expo-haptics";

/**
 * Triggers a haptic feedback impact.
 * @param type The type of haptic impact to trigger. Defaults to `Haptics.AndroidHaptics.Confirm`.
 * @see https://docs.expo.dev/versions/latest/sdk/haptics/#hapticsperformandroidhapticsasynctype
 */
export const triggerHaptic = (
  type: Haptics.AndroidHaptics = Haptics.AndroidHaptics.Confirm,
) => {
  Haptics.performAndroidHapticsAsync(type);
};

/**
 * Triggers a notification-style haptic feedback.
 * @param type The type of notification feedback to trigger. Defaults to `Success`.
 * @see https://docs.expo.dev/versions/latest/sdk/haptics/#hapticsnotificationasynctype
 */
export const triggerNotificationHaptic = (
  type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType
    .Success,
) => {
  Haptics.notificationAsync(type);
};
