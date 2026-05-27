import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useWeatherStore } from '../store/globalStore';
import { GlassCard } from '../components/common/GlassCard';
import { weatherHaptics } from '../sensors/useHaptics';
import { ArrowLeft, Volume2, VolumeX, Smartphone, Eye, Sliders, Sun } from 'lucide-react-native';

interface SettingsScreenProps {
  onBack: () => void;
  onResetOnboarding?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onResetOnboarding,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const width = Platform.OS === 'web' ? 312 : windowWidth;
  const {
    tempUnit,
    windUnit,
    audioEnabled,
    hapticEnabled,
    toggleTempUnit,
    toggleWindUnit,
    setAudioEnabled,
    setHapticEnabled,
  } = useWeatherStore();

  const handleToggleTemp = () => {
    weatherHaptics.selection();
    toggleTempUnit();
  };

  const handleToggleWind = () => {
    weatherHaptics.selection();
    toggleWindUnit();
  };

  const handleToggleAudio = (val: boolean) => {
    weatherHaptics.selection();
    setAudioEnabled(val);
  };

  const handleToggleHaptics = (val: boolean) => {
    weatherHaptics.selection();
    setHapticEnabled(val);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header back strip */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CONTROL STATION</Text>
      </View>

      {/* ========================================================
          UNIT PREFERENCES SECTION
          ======================================================== */}
      <Text style={styles.sectionTitle}>UNIT SETTINGS</Text>
      <View style={styles.marginGap}>
        {/* Temperature Unit */}
        <TouchableOpacity onPress={handleToggleTemp} style={styles.optionWrapper}>
          <GlassCard borderGlowColor="rgba(255,255,255,0.06)">
            <View style={styles.optionRow}>
              <View>
                <Text style={styles.optionTitle}>Temperature Metrics</Text>
                <Text style={styles.optionDesc}>Toggle between metric scale and imperial</Text>
              </View>
              <View style={styles.pillToggle}>
                <Text style={styles.pillToggleText}>{tempUnit === 'C' ? 'Celsius (°C)' : 'Fahrenheit (°F)'}</Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Wind Unit */}
        <TouchableOpacity onPress={handleToggleWind} style={[styles.optionWrapper, { marginTop: 12 }]}>
          <GlassCard borderGlowColor="rgba(255,255,255,0.06)">
            <View style={styles.optionRow}>
              <View>
                <Text style={styles.optionTitle}>Wind Velocity Scale</Text>
                <Text style={styles.optionDesc}>Select units for aerodynamic speed</Text>
              </View>
              <View style={styles.pillToggle}>
                <Text style={styles.pillToggleText}>{windUnit.toUpperCase()}</Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </View>

      {/* ========================================================
          HARDWARE & SENSORS SYSTEM CONTROL
          ======================================================== */}
      <Text style={[styles.sectionTitle, styles.marginGap]}>SYSTEM CONTROLS</Text>
      <View style={styles.marginGap}>
        <GlassCard borderGlowColor="rgba(255,255,255,0.06)">
          {/* Ambient Sound loop */}
          <View style={styles.switchRow}>
            <View style={styles.switchLabelArea}>
              {audioEnabled ? <Volume2 size={20} color="#A855F7" /> : <VolumeX size={20} color="rgba(255,255,255,0.3)" />}
              <View style={styles.switchTextColumn}>
                <Text style={styles.optionTitle}>Procedural Ambient Audio</Text>
                <Text style={styles.optionDesc}>Fades atmospheric loops based on precipitation</Text>
              </View>
            </View>
            <Switch
              value={audioEnabled}
              onValueChange={handleToggleAudio}
              trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#A855F7' }}
              thumbColor={audioEnabled ? '#FFF' : '#A1A1AA'}
            />
          </View>

          <View style={styles.innerDivider} />

          {/* Haptics Ticks */}
          <View style={styles.switchRow}>
            <View style={styles.switchLabelArea}>
              <Smartphone size={20} color={hapticEnabled ? '#A855F7' : 'rgba(255,255,255,0.3)'} />
              <View style={styles.switchTextColumn}>
                <Text style={styles.optionTitle}>Cinematic Haptics</Text>
                <Text style={styles.optionDesc}>Triggers delay-spaced multi-pulse shockwaves</Text>
              </View>
            </View>
            <Switch
              value={hapticEnabled}
              onValueChange={handleToggleHaptics}
              trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#A855F7' }}
              thumbColor={hapticEnabled ? '#FFF' : '#A1A1AA'}
            />
          </View>
        </GlassCard>
      </View>

      {/* ========================================================
          DEVELOPER / SYSTEM DIAGNOSTICS CONTROL
          ======================================================== */}
      <Text style={[styles.sectionTitle, styles.marginGap]}>SYSTEM DIAGNOSTICS</Text>
      <View style={styles.marginGap}>
        <TouchableOpacity
          onPress={() => {
            weatherHaptics.selection();
            onResetOnboarding?.();
          }}
          style={styles.optionWrapper}
        >
          <GlassCard borderGlowColor="rgba(239, 68, 68, 0.2)">
            <View style={styles.optionRow}>
              <View>
                <Text style={[styles.optionTitle, { color: '#EF4444' }]}>Replay Onboarding Splash</Text>
                <Text style={styles.optionDesc}>Reset system synchronization and play the 3D globe splash</Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
  },
  sectionTitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 10,
  },
  marginGap: {
    marginTop: 14,
  },
  optionWrapper: {
    width: '100%',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  optionDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  pillToggle: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pillToggleText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchLabelArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 16,
  },
  switchTextColumn: {
    marginLeft: 14,
  },
  innerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 14,
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  themeGridItem: {
    width: '48%',
    marginBottom: 16,
  },
  themePillHeader: {
    height: 38,
    borderRadius: 8,
    opacity: 0.7,
    marginBottom: 10,
  },
  themeName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  themeDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 12,
    marginTop: 2,
    height: 24,
  },
});
