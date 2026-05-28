import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import Svg, { Path, Defs, RadialGradient, Stop, Filter, FeGaussianBlur } from "react-native-svg";

const LoadingRadar: React.FC = () => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      {/* inner dashed ring */}
      <View style={styles.dashedRing} />

      {/* center dashed circle */}
      <View style={styles.dashedCenter} />

      {/* radar sweep */}
      <Animated.View
        style={[
          styles.sweepContainer,
          {
            transform: [{ rotate: spin }],
          },
        ]}
      >
        <Svg width={150} height={150} viewBox="0 0 150 150" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient
              id="glowGrad"
              cx="75"
              cy="75"
              rx="75"
              ry="75"
              fx="75"
              fy="75"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="seagreen" stopOpacity={0.8} />
              <Stop offset="50%" stopColor="seagreen" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="seagreen" stopOpacity={0} />
            </RadialGradient>
            <Filter id="blur">
              <FeGaussianBlur stdDeviation="5" />
            </Filter>
          </Defs>
          
          {/* Seagreen Glow Sector rotated -55 deg (behind the sweep line) */}
          <Path
            d="M 75 75 L 150 75 A 75 75 0 0 0 118.02 13.56 Z"
            fill="url(#glowGrad)"
            filter="url(#blur)"
            opacity={0.85}
          />
          
          {/* White dashed line */}
          <Path
            d="M 75 75 L 150 75"
            stroke="white"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "rgba(0,0,0,0.55)",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.55,
    shadowRadius: 75,
    // Android shadow
    elevation: 8,
  },
  dashedRing: {
    position: "absolute",
    top: 20,
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 55,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#444",
  },
  dashedCenter: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#444",
  },
  sweepContainer: {
    position: "absolute",
    width: 150,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LoadingRadar;

