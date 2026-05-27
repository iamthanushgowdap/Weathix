import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View, Platform, Animated as RNAnimated } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';

interface AtmosphericCanvasProps {
  rainIntensity: number; // 0.0 to 1.0
  windSpeed: number;     // kph
  cloudDensity: number;  // 0.0 to 1.0
  tempCelsius: number;   // celsius
  isDay: boolean;
  solarElevation: number; // calculated NOAA solar angle
  stormActive: boolean;
}

// ========================================================
// NATIVE CLOUD — Pure React Native animated cloud (no WebView)
// Avoids the WebView opaque-backing bug that covers the sun
// ========================================================
// ─── SVG Cloud ────────────────────────────────────────────────────────────────
// Renders the exact mathematical circles & capsule geometry as the beautiful web cloud.
// Guaranteed perfect puffy shape and zero distortion on any platform.
const NativeCloud: React.FC<{ screenWidth: number; index?: number }> = ({ screenWidth, index = 0 }) => {
  const translateX = useRef(new RNAnimated.Value(-340)).current;

  useEffect(() => {
    const totalTravel = screenWidth + 420;
    const baseDuration = 38000 + index * 6000;
    RNAnimated.loop(
      RNAnimated.timing(translateX, {
        toValue: totalTravel,
        duration: baseDuration,
        useNativeDriver: true,
      })
    ).start();
  }, [screenWidth]);

  return (
    <RNAnimated.View
      style={[styles.nativeCloudContainer, { transform: [{ translateX }] }]}
      pointerEvents="none"
    >
      <Svg width={260} height={170} viewBox="0 0 260 170">
        {/* Left Circle (equivalent to ::before) */}
        <Circle cx={95} cy={75} r={65} fill="rgba(255, 255, 255, 0.85)" />
        {/* Right Circle (equivalent to ::after) */}
        <Circle cx={172} cy={70} r={70} fill="rgba(255, 255, 255, 0.85)" />
        {/* Base Capsule */}
        <Rect x={0} y={75} width={260} height={95} rx={47.5} ry={47.5} fill="rgba(255, 255, 255, 0.85)" />
      </Svg>
    </RNAnimated.View>
  );
};

// ========================================================
// CORE WEB ATMOSPHERIC SYSTEM
// ========================================================
const AtmosphericWebCanvas: React.FC<AtmosphericCanvasProps> = ({
  rainIntensity,
  windSpeed,
  cloudDensity,
  tempCelsius,
  isDay,
  solarElevation,
  stormActive,
}) => {
  const { width, height } = useWindowDimensions();
  const isSnow = tempCelsius <= 2;

  // Lightning Flash Opacity Animation
  const flashOpacity = useSharedValue(0);
  useEffect(() => {
    if (!stormActive) return;
    const interval = setInterval(() => {
      flashOpacity.value = withTiming(0.8, { duration: 60 }, () => {
        flashOpacity.value = withTiming(0, { duration: 180 }, () => {
          flashOpacity.value = withTiming(0.4, { duration: 40 }, () => {
            flashOpacity.value = withTiming(0, { duration: 250 });
          });
        });
      });
    }, 6000 + Math.random() * 6000);

    return () => clearInterval(interval);
  }, [stormActive]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Layer 1: Night Starfield (SVG render) */}
      {!isDay && (
        <View style={StyleSheet.absoluteFill}>
          <svg width={width} height={height * 0.45} style={{ position: 'absolute' }}>
            {Array.from({ length: 45 }).map((_, i) => {
              const starX = Math.round((Math.sin(i * 987.6) * 0.5 + 0.5) * width);
              const starY = Math.round((Math.cos(i * 123.4) * 0.5 + 0.5) * height * 0.35);
              const starSize = 1 + (i % 2);
              const twinkleDur = 2 + (i % 3);
              return (
                <circle
                  key={i}
                  cx={starX}
                  cy={starY}
                  r={starSize}
                  fill="#FFF"
                  style={{
                    animation: `webTwinkle ${twinkleDur}s ease-in-out infinite`,
                    animationDelay: `${(i % 4) * 0.5}s`,
                  }}
                />
              );
            })}
            {/* Soft Glowing Moon */}
            <circle cx={width * 0.78} cy={120} r={28} fill="rgba(255, 255, 255, 0.03)" />
            <circle cx={width * 0.78} cy={120} r={18} fill="#FFF" opacity={0.8} />
          </svg>
        </View>
      )}

      {/* Layer 2: Aurora Curtains (Web CSS Gradient Ribbon) */}
      {!isDay && Math.abs(solarElevation) > 18 && (
        <View style={styles.webAuroraWrapper}>
          <div style={{
            width: '120%',
            height: '100%',
            marginLeft: '-10%',
            background: 'linear-gradient(180deg, rgba(74, 222, 128, 0.6) 0%, rgba(139, 92, 246, 0.2) 60%, rgba(0,0,0,0) 100%)',
            filter: 'blur(30px)',
            animation: 'webAuroraShift 10s ease-in-out infinite',
          } as any} />
        </View>
      )}

      {/* Layer 3: Replaced with the Custom Drifting Cloud */}
      {cloudDensity > 0.05 && (
        <View style={StyleSheet.absoluteFill}>
          <div className="cloud"></div>
        </View>
      )}

      {/* Layer 4: Rain Animation (SVG) */}
      {rainIntensity > 0.05 && !isSnow && (
        <View style={StyleSheet.absoluteFill}>
          <svg width={width} height={height} style={{ position: 'absolute' }}>
            {Array.from({ length: 35 }).map((_, i) => {
              const dropX = ((Math.sin(i * 321.4) * 0.5 + 0.5) * width);
              const speed = 0.8 + (i % 3) * 0.3;
              const delay = (i % 6) * 0.25;
              return (
                <line
                  key={i}
                  x1={dropX}
                  y1={-50}
                  x2={dropX - (windSpeed / 100) * 12}
                  y2={0}
                  stroke="rgba(180, 210, 255, 0.5)"
                  strokeWidth={1.3}
                  style={{
                    animation: `webRainFall ${speed}s linear infinite`,
                    animationDelay: `${delay}s`,
                  }}
                />
              );
            })}
          </svg>
        </View>
      )}

      {/* Layer 5: Snow Animation (SVG) */}
      {isSnow && (
        <View style={StyleSheet.absoluteFill}>
          <svg width={width} height={height} style={{ position: 'absolute' }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const flakeX = ((Math.sin(i * 654.3) * 0.5 + 0.5) * width);
              const size = 2 + (i % 4);
              const speed = 2.5 + (i % 4) * 0.7;
              const delay = (i % 5) * 0.4;
              return (
                <circle
                  key={i}
                  cx={flakeX}
                  cy={-20}
                  r={size}
                  fill="#FFF"
                  opacity={0.65}
                  style={{
                    animation: `webSnowFall ${speed}s linear infinite`,
                    animationDelay: `${delay}s`,
                  }}
                />
              );
            })}
          </svg>
        </View>
      )}

      {/* Layer 6: Lightning Storm Flash overlay */}
      {stormActive && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.webFlashOverlay, flashStyle]} />
      )}

      {/* Web-Only CSS animations injector */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes webTwinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1.0; }
        }
        @keyframes webRainFall {
          0% { transform: translateY(-50px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(${height + 80}px); opacity: 0; }
        }
        @keyframes webSnowFall {
          0% { transform: translateY(-20px) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(${height + 50}px) translateX(30px); opacity: 0; }
        }
        @keyframes webAuroraShift {
          0%, 100% { transform: scaleY(1.0) skewX(0deg); opacity: 0.2; }
          50% { transform: scaleY(1.15) skewX(5deg); opacity: 0.45; }
        }

        .cloud {
          position: absolute;
          top: 220px;
          left: -100px;
          width: 260px;
          height: 95px;
          background: white;
          border-radius: 100px;
          filter: drop-shadow(0 20px 30px rgba(255,255,255,.2));
          animation: moveCloud 34s linear infinite;
          pointer-events: none;
          z-index: 2;
          opacity: 0.3;
        }

        .cloud::before {
          content: '';
          position: absolute;
          width: 130px;
          height: 130px;
          background: white;
          border-radius: 50%;
          top: -65px;
          left: 30px;
        }

        .cloud::after {
          content: '';
          position: absolute;
          width: 140px;
          height: 140px;
          background: white;
          border-radius: 50%;
          top: -75px;
          right: 18px;
        }

        @keyframes moveCloud {
          100% {
            transform: translateX(${width + 120}px);
          }
        }
      ` }} />
    </View>
  );
};

// ========================================================
// CORE NATIVE WEB-FREE EFFECTS (REANIMATED & SVG)
// Safe from JSI memory leaks and shader crashes
// ========================================================
const NightStars: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const stars = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * (height * 0.4),
      size: 1.5 + Math.random() * 2.5,
      delay: Math.random() * 3000,
      duration: 1500 + Math.random() * 2000,
    }));
  }, [width, height]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {stars.map((star) => (
        <StarItem key={star.id} star={star} />
      ))}
    </View>
  );
};

const StarItem: React.FC<{ star: any }> = ({ star }) => {
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = withDelay(
      star.delay,
      withRepeat(withTiming(0.9, { duration: star.duration }), -1, true)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.star,
        animatedStyle,
        {
          left: star.x,
          top: star.y,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
        },
      ]}
    />
  );
};

const SunnySun: React.FC<{ width: number; height: number; cloudDensity: number }> = ({
  width,
  height,
  cloudDensity,
}) => {
  const scale = useSharedValue(1);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.04, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    glowScale.value = withRepeat(
      withTiming(1.1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.sunGlow,
          glowStyle,
          {
            right: width * 0.05 - 100,
            top: 60 - 100,
            opacity: 0.16 * (1 - cloudDensity),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.sunOrb,
          sunStyle,
          {
            right: width * 0.08,
            top: 90,
            opacity: 0.95 * (1 - cloudDensity),
          },
        ]}
      />
    </View>
  );
};

const FallingRain: React.FC<{
  width: number;
  height: number;
  rainIntensity: number;
  windSpeed: number;
}> = ({ width, height, rainIntensity, windSpeed }) => {
  const dropsCount = Math.round(18 + rainIntensity * 12);
  const drops = useMemo(() => {
    return Array.from({ length: dropsCount }).map((_, i) => ({
      id: i,
      left: Math.random() * width,
      delay: Math.random() * 1000,
      duration: 600 + Math.random() * 400,
      length: 12 + Math.random() * 10,
    }));
  }, [width, dropsCount]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {drops.map((drop) => (
        <RainDropItem
          key={drop.id}
          drop={drop}
          height={height}
          windSpeed={windSpeed}
        />
      ))}
    </View>
  );
};

const RainDropItem: React.FC<{ drop: any; height: number; windSpeed: number }> = ({
  drop,
  height,
  windSpeed,
}) => {
  const translateY = useSharedValue(-50);

  useEffect(() => {
    translateY.value = -50;
    translateY.value = withDelay(
      drop.delay,
      withRepeat(withTiming(height + 20, { duration: drop.duration, easing: Easing.linear }), -1, false)
    );
  }, [height]);

  const skewAngle = (windSpeed / 100) * 12;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: -translateY.value * Math.tan((skewAngle * Math.PI) / 180) },
      { skewX: `${skewAngle}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.rainDrop,
        animatedStyle,
        {
          left: drop.left,
          height: drop.length,
        },
      ]}
    />
  );
};

const FallingSnow: React.FC<{ width: number; height: number; rainIntensity: number }> = ({
  width,
  height,
  rainIntensity,
}) => {
  const flakeCount = Math.round(15 + rainIntensity * 15);
  const flakes = useMemo(() => {
    return Array.from({ length: flakeCount }).map((_, i) => ({
      id: i,
      left: Math.random() * width,
      delay: Math.random() * 2000,
      duration: 2000 + Math.random() * 1500,
      size: 3 + Math.random() * 5,
    }));
  }, [width, flakeCount]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {flakes.map((flake) => (
        <SnowFlakeItem key={flake.id} flake={flake} height={height} />
      ))}
    </View>
  );
};

const SnowFlakeItem: React.FC<{ flake: any; height: number }> = ({ flake, height }) => {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateY.value = -20;
    translateY.value = withDelay(
      flake.delay,
      withRepeat(withTiming(height + 20, { duration: flake.duration, easing: Easing.linear }), -1, false)
    );

    translateX.value = withRepeat(
      withTiming(15, { duration: 1500 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [height]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.snowFlake,
        animatedStyle,
        {
          left: flake.left,
          width: flake.size,
          height: flake.size,
          borderRadius: flake.size / 2,
        },
      ]}
    />
  );
};

const AtmosphericNativeEffects: React.FC<AtmosphericCanvasProps> = ({
  rainIntensity,
  windSpeed,
  cloudDensity,
  tempCelsius,
  isDay,
}) => {
  const { width, height } = useWindowDimensions();
  const isSnow = tempCelsius <= 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* 1. Night Stars */}
      {!isDay && <NightStars width={width} height={height} />}

      {/* 2. SVG cloud — proper cloud shape, rendered BEFORE sun, no WebView */}
      {cloudDensity > 0.05 && (
        <NativeCloud screenWidth={width} index={0} />
      )}

      {/* 3. Sunny Sun & Ambient Glow — only for clear/sunny sky (Desert Gold) */}
      {isDay && rainIntensity === 0 && cloudDensity < 0.1 && (
        <SunnySun width={width} height={height} cloudDensity={cloudDensity} />
      )}

      {/* 4. Falling Rain */}
      {rainIntensity > 0.05 && !isSnow && (
        <FallingRain width={width} height={height} rainIntensity={rainIntensity} windSpeed={windSpeed} />
      )}

      {/* 5. Falling Snow */}
      {isSnow && rainIntensity > 0.05 && (
        <FallingSnow width={width} height={height} rainIntensity={rainIntensity} />
      )}
    </View>
  );
};

// ========================================================
// CORE WEB-SAFE CONDITIONAL SEPARATOR
// ========================================================
export const AtmosphericCanvas: React.FC<AtmosphericCanvasProps> = (props) => {
  if (Platform.OS === 'web') {
    return <AtmosphericWebCanvas {...props} />;
  }
  return <AtmosphericNativeEffects {...props} />;
};

const styles = StyleSheet.create({
  webAuroraWrapper: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '40%',
    overflow: 'hidden',
    opacity: 0.35,
  },
  webFlashOverlay: {
    backgroundColor: 'rgba(230, 240, 255, 0.45)',
    zIndex: 1,
  },
  // Native Weather styles
  star: {
    position: 'absolute',
    backgroundColor: '#FFF',
  },
  // SVG cloud container — no overflow needed, shape is self-contained
  nativeCloudContainer: {
    position: 'absolute',
    top: 130,
    left: -340,
    opacity: 0.28,
  },
  sunOrb: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFB938',
    shadowColor: '#FFB938',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 30,
    elevation: 8,
  },
  sunGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 185, 56, 0.16)',
  },
  rainDrop: {
    position: 'absolute',
    top: 0,
    width: 1.2,
    backgroundColor: 'rgba(174, 207, 255, 0.65)',
    borderRadius: 1,
  },
  snowFlake: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#FFF',
    opacity: 0.65,
  },
});
