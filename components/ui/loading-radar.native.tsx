import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";

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
        <View style={styles.sweepLine} />
        <View style={styles.sweepGlow} />
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
    top: "50%",
    left: "50%",
    width: 75,
    height: 150,
    overflow: "visible",
  },
  sweepLine: {
    width: 75,
    height: 1,
    borderStyle: "dashed",
    borderWidth: 0.5,
    borderColor: "#fff",
  },
  sweepGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 75,
    height: 75,
    backgroundColor: "seagreen",
    opacity: 0.25,
    borderRadius: 37,
  },
});

export default LoadingRadar;
