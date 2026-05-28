import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import Svg, { Path, Defs, RadialGradient, Stop, Filter, FeGaussianBlur } from "react-native-svg";

interface LoadingRadarProps {
  size?: number;
}

const LoadingRadar: React.FC<LoadingRadarProps> = ({ size = 150 }) => {
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

  const innerDashedRingInset = size * 0.133;
  const centerDashedCircleSize = size * 0.333;
  const centerCoord = size / 2;

  const r = size / 2;
  const x2 = centerCoord + r * 0.5736;
  const y2 = centerCoord - r * 0.8192;

  return (
    <View 
      style={[
        styles.container, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
        }
      ]}
    >
      {/* inner dashed ring */}
      <View 
        style={[
          styles.dashedRing,
          {
            top: innerDashedRingInset,
            bottom: innerDashedRingInset,
            left: innerDashedRingInset,
            right: innerDashedRingInset,
            borderRadius: (size - 2 * innerDashedRingInset) / 2,
          }
        ]}
      />

      {/* center dashed circle */}
      <View 
        style={[
          styles.dashedCenter,
          {
            width: centerDashedCircleSize,
            height: centerDashedCircleSize,
            borderRadius: centerDashedCircleSize / 2,
          }
        ]}
      />

      {/* radar sweep */}
      <Animated.View
        style={[
          styles.sweepContainer,
          {
            width: size,
            height: size,
            transform: [{ rotate: spin }],
          },
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient
              id="glowGrad"
              cx={centerCoord}
              cy={centerCoord}
              rx={r}
              ry={r}
              fx={centerCoord}
              fy={centerCoord}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="seagreen" stopOpacity={0.95} />
              <Stop offset="45%" stopColor="seagreen" stopOpacity={0.6} />
              <Stop offset="100%" stopColor="seagreen" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          
          {/* Sector 1: 0 to -18 deg (Strongest) */}
          <Path
            d={`M ${centerCoord} ${centerCoord} L ${size} ${centerCoord} A ${r} ${r} 0 0 0 ${centerCoord + r * 0.9511} ${centerCoord - r * 0.3090} Z`}
            fill="url(#glowGrad)"
            opacity={0.7}
          />
          {/* Sector 2: -18 to -36 deg (Medium) */}
          <Path
            d={`M ${centerCoord} ${centerCoord} L ${centerCoord + r * 0.9511} ${centerCoord - r * 0.3090} A ${r} ${r} 0 0 0 ${centerCoord + r * 0.8090} ${centerCoord - r * 0.5878} Z`}
            fill="url(#glowGrad)"
            opacity={0.45}
          />
          {/* Sector 3: -36 to -54 deg (Weakest) */}
          <Path
            d={`M ${centerCoord} ${centerCoord} L ${centerCoord + r * 0.8090} ${centerCoord - r * 0.5878} A ${r} ${r} 0 0 0 ${centerCoord + r * 0.5878} ${centerCoord - r * 0.8090} Z`}
            fill="url(#glowGrad)"
            opacity={0.2}
          />
          
          {/* White dashed line */}
          <Path
            d={`M ${centerCoord} ${centerCoord} L ${size} ${centerCoord}`}
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
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#444",
  },
  dashedCenter: {
    position: "absolute",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#444",
  },
  sweepContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LoadingRadar;

