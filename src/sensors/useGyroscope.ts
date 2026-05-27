import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import { useSharedValue, withSpring } from 'react-native-reanimated';
// Safe lazy Platform accessor
const getPlatformOS = (): string => {
  try { return require('react-native').Platform.OS; } catch { return 'native'; }
};


/**
 * High-performance, battery-optimized Gyroscope Hook
 * Translates device tilts into low-latency spring-damped coordinate variables.
 */
export function useGyroscopeParallax(scaleX = 15, scaleY = 15) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  useEffect(() => {
    let subscription: any = null;
    let reduceMotionEnabled = false;

    // 1. Check system accessibility parameters first
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotionEnabled = enabled;
    });

    const checkAccessibilityChange = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        reduceMotionEnabled = enabled;
        if (enabled) {
          x.value = 0;
          y.value = 0;
        }
      }
    );

    // 2. Initialise Gyroscope listener in native contexts
    if (getPlatformOS() !== 'web') {
      Gyroscope.isAvailableAsync().then((isAvailable) => {
        if (!isAvailable) {
          console.log('[Weathix Gyroscope] Native Gyroscope is not available on this device.');
          return;
        }
        try {
          // Set update interval to a battery-safe 30Hz (approx 33ms)
          Gyroscope.setUpdateInterval(33);

          subscription = Gyroscope.addListener((data) => {
            if (reduceMotionEnabled) return;

            // Apply sensor multiplier scale
            const targetX = -data.y * scaleX;
            const targetY = data.x * scaleY;

            // Drive Reanimated shared values using responsive springs
            x.value = withSpring(targetX, { damping: 18, stiffness: 100 });
            y.value = withSpring(targetY, { damping: 18, stiffness: 100 });
          });
        } catch (err) {
          console.log('[Weathix Gyroscope] Native Gyroscope listener setup failed:', err);
        }
      }).catch((e) => {
        console.log('[Weathix Gyroscope] Error checking gyroscope availability:', e);
      });
    } else {
      // Web environments mouse-move emulation for beautiful browser previews
      const handleMouseMove = (e: MouseEvent) => {
        if (reduceMotionEnabled) return;

        const w = window.innerWidth;
        const h = window.innerHeight;
        // Normalise around center [-1, 1]
        const normX = (e.clientX / w) * 2 - 1;
        const normY = (e.clientY / h) * 2 - 1;

        x.value = withSpring(normX * scaleX * 1.5, { damping: 20, stiffness: 80 });
        y.value = withSpring(normY * scaleY * 1.5, { damping: 20, stiffness: 80 });
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        checkAccessibilityChange.remove();
      };
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
      checkAccessibilityChange.remove();
    };
  }, [scaleX, scaleY]);

  return { x, y };
}
