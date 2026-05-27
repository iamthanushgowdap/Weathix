import React, { useEffect } from 'react';
import { StyleSheet, View, Platform, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { Canvas, Circle, RadialGradient, BlurMask, vec } from '@shopify/react-native-skia';
import { useWeatherStore } from '../../store/globalStore';
import { mapWeatherCode } from '../../services/openMeteo';

interface FloatingWeatherOrbProps {
  conditionText?: string;
  isDay?: boolean;
}

export const FloatingWeatherOrb: React.FC<FloatingWeatherOrbProps> = ({
  conditionText = '',
  isDay = true,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const width = Platform.OS === 'web' ? 312 : windowWidth;
  const { weatherData } = useWeatherStore();
  const floatY = useSharedValue(0);

  useEffect(() => {
    // Elegant continuous looping float motion
    floatY.value = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const text = conditionText.toLowerCase();
  
  // Select Orb colors matching the theme or atmospheric profiles
  let colors: string[] = [];
  let glowColor = 'rgba(255, 255, 255, 0.2)';
  
  const weatherTheme = React.useMemo(() => {
    if (!weatherData) return 'Polar Mist';
    return mapWeatherCode(weatherData.conditionCode, weatherData.isDay).theme;
  }, [weatherData]);

  switch (weatherTheme) {
    case 'Lush Forest':
      // Gorgeous shimmering forest bubble (Mint -> Emerald -> Forest Green)
      colors = ['#CFFFDC', '#68BA7F', '#2E6F40'];
      glowColor = 'rgba(104, 186, 127, 0.45)';
      break;

    case 'Arctic Night':
      colors = ['#FCFDFE', '#E9D5FF', '#C084FC'];
      glowColor = 'rgba(192, 132, 252, 0.4)';
      break;

    case 'Desert Gold':
      colors = ['#FFFDF5', '#FDBA74', '#F43F5E'];
      glowColor = 'rgba(244, 63, 94, 0.3)';
      break;

    case 'Monsoon Slate':
      colors = ['#E0F2FE', '#7DD3FC', '#0284C7'];
      glowColor = 'rgba(14, 165, 233, 0.35)';
      break;

    case 'Aurora Dream':
      colors = ['#F0FDF4', '#86EFAC', '#16A34A'];
      glowColor = 'rgba(74, 222, 128, 0.4)';
      break;

    case 'Midnight Storm':
      colors = ['#E0F7FA', '#06B6D4', '#0891B2'];
      glowColor = 'rgba(6, 182, 210, 0.35)';
      break;

    case 'Tropical Cyan':
      colors = ['#ECFEFF', '#67E8F9', '#0891B2'];
      glowColor = 'rgba(6, 182, 210, 0.35)';
      break;

    case 'Sunset Ember':
      colors = ['#FFF5F5', '#FECACA', '#EF4444'];
      glowColor = 'rgba(239, 68, 68, 0.35)';
      break;

    case 'Polar Mist':
    default:
      // Snowy: Luminous Frozen Frost
      colors = ['#F0F9FF', '#BAE6FD', '#7DD3FC'];
      glowColor = 'rgba(125, 211, 252, 0.3)';
      break;
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value * 16 - 8 }],
  }));

  const size = Math.min(240, width * 0.46);
  const radius = size / 2;

  // Render Web-friendly SVG version to completely bypass Skia undefined crashes
  if (Platform.OS === 'web' || typeof vec === 'undefined') {
    return (
      <Animated.View style={[styles.container, { width: size, height: size }, animatedStyle]}>
        <svg width={size} height={size} style={{ position: 'absolute' }}>
          <defs>
            <radialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={colors[0]} />
              <stop offset="60%" stopColor={colors[1]} />
              <stop offset="100%" stopColor={colors[2]} />
            </radialGradient>
            <filter id="orbBloom" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="16" />
            </filter>
          </defs>
          {/* Outer Atmospheric Bloom Glow */}
          <circle cx={radius} cy={radius} r={radius - 8} fill={colors[2]} opacity={0.3} filter="url(#orbBloom)" />
          {/* Main Glassmorphic Orb Body */}
          <circle cx={radius} cy={radius} r={radius - 12} fill="url(#orbGrad)" />
        </svg>
      </Animated.View>
    );
  }

  // Render Native Skia GPU version
  return (
    <Animated.View style={[styles.container, { width: size, height: size }, animatedStyle]}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Layer 1: Ambient Bloom Glow Circle */}
        <Circle cx={radius} cy={radius} r={radius - 8} color={colors[2]} opacity={0.24}>
          <BlurMask blur={24} style="solid" />
        </Circle>
        {/* Layer 2: Main Shaded Sphere */}
        <Circle cx={radius} cy={radius} r={radius - 12}>
          <RadialGradient
            c={vec(radius, radius)}
            r={radius - 12}
            colors={colors}
          />
        </Circle>
      </Canvas>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
