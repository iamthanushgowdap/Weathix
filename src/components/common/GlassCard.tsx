import React from 'react';
import { StyleSheet, View, ViewStyle, useWindowDimensions, Platform } from 'react-native';
import { Canvas, Rect, Shader, vec } from '@shopify/react-native-skia';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { getShader } from '../../theme/agslShaders';
import { useGyroscopeParallax } from '../../sensors/useGyroscope';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number; // Blur intensity multiplier
  borderGlowColor?: string; // Light accent color for edge glow
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  borderGlowColor = 'rgba(255, 255, 255, 0.05)',
  intensity = 20,
}) => {
  const { width, height } = useWindowDimensions();
  const gyro = useGyroscopeParallax(8, 8); // Track physical gyroscope tilts
  const glassShader = getShader('glassRefraction');

  // Parallax tilt interpolation for the card container itself - disabled to prevent card shaking/movement
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: 0 },
        { translateY: 0 },
      ],
    };
  });

  return (
    <Animated.View style={[styles.cardContainer, cardAnimatedStyle, style]}>
      {/* ========================================================
          LAYER 1: BACKDROP BLUR & REFRACTION
          ======================================================== */}
      {Platform.OS === 'web' ? (
        // Web physical backdrop-filter blur
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backdropFilter: `blur(${intensity}px)`,
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
        } as any} />
      ) : (
        // Native high-speed JSI BlurView with beautiful frosted glass translucent fallback on Android
        <BlurView 
          intensity={intensity} 
          tint="dark" 
          style={[
            StyleSheet.absoluteFill,
            Platform.OS === 'android' && { backgroundColor: 'rgba(255, 255, 255, 0.08)' }
          ]} 
        />
      )}

      {/* GPU Chromatic Refraction overlay (Native only if shader available) */}
      {glassShader && Platform.OS !== 'web' && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Canvas style={StyleSheet.absoluteFill}>
            <Rect x={0} y={0} width={width} height={height}>
              <Shader
                source={glassShader}
                uniforms={{
                  u_time: 0,
                  u_resolution: vec(100, 100),
                  u_gyro: vec(gyro.x.value * 0.05, gyro.y.value * 0.05),
                }}
              />
            </Rect>
          </Canvas>
        </View>
      )}

      {/* ========================================================
          LAYER 2: ASYMMETRICAL OUTLINE EDGE LIGHTING
          ======================================================== */}
      <View style={[StyleSheet.absoluteFill, styles.borderOutline, { borderColor: borderGlowColor }]} />

      {/* ========================================================
          LAYER 3: CARD CONTENTS
          ======================================================== */}
      <View style={styles.contentWrapper}>
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: Platform.OS === 'android' ? 0 : 6,
  },
  borderOutline: {
    borderRadius: 24,
    borderWidth: 1,
    opacity: 0.7,
  },
  contentWrapper: {
    padding: 20,
    zIndex: 2,
  },
});
