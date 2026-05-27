import * as Haptics from 'expo-haptics';
// Safe lazy accessor — avoids bridge-not-ready crash on Android during module eval
const isWeb = (): boolean => {
  try { return require('react-native').Platform.OS === 'web'; } catch { return false; }
};

/**
 * Procedural Haptics Weather Engine
 * Formulates detailed tactile vibrations synced with weather phenomena.
 */
export const weatherHaptics = {
  /**
   * Selection tick for simple user gestures (elastic buttons, card clicks)
   */
  selection: async (): Promise<void> => {
    if (isWeb()) return;
    try {
      await Haptics.selectionAsync();
    } catch {
      // Fail silently in environments lacking haptic support
    }
  },

  /**
   * Micro-drizzle tap pattern (delicate soft ticks)
   */
  triggerDrizzleTick: async (): Promise<void> => {
    if (isWeb()) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  },

  /**
   * Heavy Rain Storm Vibrations
   */
  triggerHeavyStormVibe: async (): Promise<void> => {
    if (isWeb()) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
  },

  /**
   * Sunrise Cinematic Ambient Glow Pulse (Gentle rise and fall)
   */
  triggerSunriseGlowPulse: async (): Promise<void> => {
    if (isWeb()) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 250);
    } catch {}
  },

  /**
   * Lightning Strike 4-Pulse Shock Sequence
   * 0ms (Heavy), 80ms (Medium), 160ms (Heavy), 300ms (Light)
   */
  triggerLightningStrikeSequence: async (): Promise<void> => {
    if (isWeb()) return;
    try {
      // First flash impact
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 80);

      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 160);

      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 300);
    } catch {}
  },
};
