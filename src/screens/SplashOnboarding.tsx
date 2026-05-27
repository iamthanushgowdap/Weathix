import React from 'react';
import { Platform } from 'react-native';
import { SplashOnboardingNative } from './SplashOnboardingNative';
import { SplashOnboardingWeb } from './SplashOnboardingWeb';

interface SplashOnboardingProps {
  onComplete: () => void;
}

export const SplashOnboarding: React.FC<SplashOnboardingProps> = (props) => {
  if (Platform.OS === 'web') {
    return <SplashOnboardingWeb {...props} />;
  }
  return <SplashOnboardingNative {...props} />;
};
