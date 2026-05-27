import React from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, ViewStyle, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { weatherHaptics } from '../../sensors/useHaptics';

interface PremiumButtonProps {
  onPress: () => void;
  title: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  glowColor?: string;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  onPress,
  title,
  style,
  textStyle,
  glowColor = 'rgba(168, 85, 247, 0.4)', // Default purple glow accent
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    // Drive spring compression
    scale.value = withSpring(0.92, { damping: 10, stiffness: 200 });
    weatherHaptics.selection();
  };

  const handlePressOut = () => {
    // Release compression with fluid recoil
    scale.value = withSpring(1, { damping: 12, stiffness: 120 });
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.button,
          { shadowColor: glowColor },
          animatedStyle,
          style,
        ]}
      >
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    paddingHorizontal: 24,
  },
  text: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
});
