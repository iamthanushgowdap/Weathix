import React, { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { GlobeInteractive } from '../components/ui/cobe-globe-interactive';

interface SplashOnboardingProps {
  onComplete: () => void;
}

export const SplashOnboardingNative: React.FC<SplashOnboardingProps> = ({ onComplete }) => {
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    console.log("=== SplashOnboardingNative.tsx (NATIVE) mounted ===");
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Cinematic Gradients */}
      <LinearGradient
        colors={['#050814', '#000000', '#0a0d1a']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative Aurora Back-Glow */}
      <LinearGradient
        colors={['rgba(37, 99, 235, 0.12)', 'transparent']}
        style={styles.auroraGlow}
      />

      {/* ========================================================
          GLOBE & ORBITS SECTION (CLEAN CINEMATIC STATE)
          ======================================================== */}
      <View style={styles.globeWrapper}>
        {/* Concentric Decorative Rings */}
        <View style={[styles.ring, styles.ringOne]} />
        <View style={[styles.ring, styles.ringTwo]} />
        <View style={[styles.ring, styles.ringThree]} />

        {/* Cinematic Glowing Center Indicator */}
        <View style={styles.globe}>
          <GlobeInteractive />
        </View>
      </View>

      {/* ========================================================
          BRANDING SECTION
          ======================================================== */}
      <View style={styles.brandContainer}>
        <Text style={styles.brandTitle}>Weathix</Text>
        <Text style={styles.brandSubtitle}>Atmospheric Intelligence</Text>
      </View>

      {/* ========================================================
          ENTRY BUTTON
          ======================================================== */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={onComplete} style={styles.arrowButton}>
          <ArrowRight color="#000" size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  auroraGlow: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    top: '30%',
    left: '50%',
    marginLeft: -300,
    marginTop: -300,
    opacity: 0.7,
  },
  globeWrapper: {
    width: 420,
    height: 420,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -80,
    marginBottom: 30,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  ringOne: {
    width: 370,
    height: 370,
  },
  ringTwo: {
    width: 410,
    height: 410,
  },
  ringThree: {
    width: 450,
    height: 450,
  },
  globe: {
    width: 340,
    height: 340,
    borderRadius: Platform.OS === 'android' ? 0 : 170,
    overflow: Platform.OS === 'android' ? 'visible' : 'hidden',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: Platform.OS === 'android' ? 0 : 8,
  },
  brandContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 180,
    zIndex: 10,
  },
  brandTitle: {
    fontSize: 52,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -3,
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#8b8b8b',
    letterSpacing: 1,
    fontWeight: '400',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  arrowButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
