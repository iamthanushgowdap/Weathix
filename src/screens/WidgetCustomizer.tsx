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
import { useAtom } from 'jotai';
import { useWeatherStore } from '../store/globalStore';
import { GlassCard } from '../components/common/GlassCard';
import { weatherHaptics } from '../sensors/useHaptics';
import {
  widgetTransparentModeAtom,
  widgetShowAqiGaugeAtom,
  widgetShowRainTrendAtom,
  widgetBorderGlowAtom,
} from '../store/widgetAtoms';
import { ArrowLeft, Maximize2, Sparkles, Layout } from 'lucide-react-native';

interface WidgetCustomizerProps {
  onBack: () => void;
}

export const WidgetCustomizer: React.FC<WidgetCustomizerProps> = ({ onBack }) => {
  const { width: windowWidth } = useWindowDimensions();
  const width = Platform.OS === 'web' ? 312 : windowWidth;
  const { weatherData, aqiData, tempUnit } = useWeatherStore();

  // Jotai Atom states
  const [transparentMode, setTransparentMode] = useAtom(widgetTransparentModeAtom);
  const [showAqi, setShowAqi] = useAtom(widgetShowAqiGaugeAtom);
  const [showRain, setShowRain] = useAtom(widgetShowRainTrendAtom);
  const [borderGlow, setBorderGlow] = useAtom(widgetBorderGlowAtom);

  const glowColors = [
    { color: '#A855F7', name: 'Violet Spark' },
    { color: '#22D3EE', name: 'Cyan Mist' },
    { color: '#EC4899', name: 'Pink Flame' },
    { color: '#F59E0B', name: 'Gold Solar' },
    { color: 'rgba(255,255,255,0.15)', name: 'Ghost White' },
  ];

  if (!weatherData || !aqiData) return null;

  const formattedTemp = (c: number) => {
    if (tempUnit === 'F') {
      return `${Math.round((c * 9) / 5 + 32)}°F`;
    }
    return `${c}°C`;
  };

  const handleToggleTransparent = (val: boolean) => {
    weatherHaptics.selection();
    setTransparentMode(val);
  };

  const handleToggleAqi = (val: boolean) => {
    weatherHaptics.selection();
    setShowAqi(val);
  };

  const handleToggleRain = (val: boolean) => {
    weatherHaptics.selection();
    setShowRain(val);
  };

  const handleSelectGlow = (col: string) => {
    weatherHaptics.selection();
    setBorderGlow(col);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header back strip */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>WIDGET WORKSHOP</Text>
      </View>

      {/* ========================================================
          LIVE MOCKUP WIDGET PREVIEWS
          ======================================================== */}
      <Text style={styles.sectionTitle}>LIVE PHONE SCREEN MOCKUPS</Text>
      <View style={styles.marginGap}>
        {/* Android / iOS Home Screen Mockup */}
        <View style={styles.mockPhoneScreen}>
          <View style={styles.mockStatusBar}>
            <Text style={styles.mockTime}>10:00</Text>
            <View style={styles.mockSystemIcons} />
          </View>
          
          <Text style={styles.mockWidgetTag}>ANDROID COMPACT WEATHER WIDGET</Text>
          
          {/* Main Simulated Home Screen Widget */}
          <GlassCard
            borderGlowColor={borderGlow}
            style={[
              styles.simulatedWidget,
              !transparentMode ? styles.opaqueWidgetOverride : null,
            ] as any}
          >
            <View style={styles.widgetHeader}>
              <View>
                <Text style={styles.widgetCity}>{weatherData.isDay ? 'Sunny' : 'Clear'}</Text>
                <Text style={styles.widgetLocation}>Chennai</Text>
              </View>
              <Text style={styles.widgetTemp}>{formattedTemp(weatherData.temp)}</Text>
            </View>

            <View style={styles.widgetFooter}>
              {showRain && (
                <View>
                  <Text style={styles.widgetLabel}>RAIN PROB</Text>
                  <Text style={styles.widgetVal}>{weatherData.hourly.rainProb[0]}%</Text>
                </View>
              )}
              {showAqi && (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.widgetLabel}>US-AQI</Text>
                  <Text style={[styles.widgetVal, { color: aqiData.aqi > 100 ? '#EF4444' : '#22C55E' }]}>
                    {aqiData.aqi}
                  </Text>
                </View>
              )}
            </View>
          </GlassCard>

          {/* iOS Lockscreen Widget Mockup */}
          <Text style={[styles.mockWidgetTag, { marginTop: 24 }]}>iOS LOCKSCREEN COMPACT GLYPHS</Text>
          <View style={styles.lockscreenRow}>
            {/* Round lockscreen widget */}
            <View style={styles.iosLockWidgetRound}>
              <Text style={styles.lockWidgetText}>{formattedTemp(weatherData.temp)}</Text>
              <Text style={styles.lockWidgetSmallText}>Chennai</Text>
            </View>

            {/* Rectangular lockscreen widget */}
            <View style={styles.iosLockWidgetRect}>
              <Text style={styles.lockWidgetTitle}>WEATHIX OS</Text>
              <Text style={styles.lockWidgetVal}>
                {weatherData.conditionText} • AQI {aqiData.aqi}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ========================================================
          WIDGET CUSTOMIZER OPTIONS SHEET
          ======================================================== */}
      <Text style={[styles.sectionTitle, styles.marginGap]}>WIDGET CONFIGURATOR</Text>
      <View style={styles.marginGap}>
        <GlassCard borderGlowColor="rgba(255,255,255,0.06)">
          {/* Glassmorphism Transparency Switch */}
          <View style={styles.switchRow}>
            <View style={styles.switchLabelArea}>
              <Layout size={18} color="#A855F7" />
              <View style={styles.switchTextColumn}>
                <Text style={styles.optionTitle}>Transparent Glassmorphism</Text>
                <Text style={styles.optionDesc}>Toggles transparent refractions or opaque slate</Text>
              </View>
            </View>
            <Switch
              value={transparentMode}
              onValueChange={handleToggleTransparent}
              trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#A855F7' }}
              thumbColor={transparentMode ? '#FFF' : '#A1A1AA'}
            />
          </View>

          <View style={styles.innerDivider} />

          {/* Show AQI Switch */}
          <View style={styles.switchRow}>
            <View style={styles.switchLabelArea}>
              <Sparkles size={18} color="#22D3EE" />
              <View style={styles.switchTextColumn}>
                <Text style={styles.optionTitle}>Render AQI Index Badge</Text>
                <Text style={styles.optionDesc}>Pushes air quality index metrics to footer</Text>
              </View>
            </View>
            <Switch
              value={showAqi}
              onValueChange={handleToggleAqi}
              trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#A855F7' }}
              thumbColor={showAqi ? '#FFF' : '#A1A1AA'}
            />
          </View>

          <View style={styles.innerDivider} />

          {/* Show Rain Switch */}
          <View style={styles.switchRow}>
            <View style={styles.switchLabelArea}>
              <Maximize2 size={18} color="#0EA5E9" />
              <View style={styles.switchTextColumn}>
                <Text style={styles.optionTitle}>Rain Probability Metric</Text>
                <Text style={styles.optionDesc}>Displays immediate precipitation risks on card</Text>
              </View>
            </View>
            <Switch
              value={showRain}
              onValueChange={handleToggleRain}
              trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#A855F7' }}
              thumbColor={showRain ? '#FFF' : '#A1A1AA'}
            />
          </View>
        </GlassCard>
      </View>

      {/* ========================================================
          NEON BORDER GLOW COLOR PICKER
          ======================================================== */}
      <Text style={[styles.sectionTitle, styles.marginGap]}>WIDGET EDGE GLOW COLOR</Text>
      <View style={styles.marginGap}>
        <GlassCard borderGlowColor="rgba(255,255,255,0.06)">
          <View style={styles.glowRow}>
            {glowColors.map((col, idx) => {
              const isSelected = borderGlow === col.color;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSelectGlow(col.color)}
                  style={[
                    styles.glowPill,
                    { backgroundColor: col.color === 'rgba(255,255,255,0.15)' ? 'rgba(255,255,255,0.05)' : col.color },
                    isSelected && styles.glowPillActive,
                  ]}
                />
              );
            })}
          </View>
        </GlassCard>
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
  mockPhoneScreen: {
    backgroundColor: '#0A0A10',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    paddingTop: 24,
  },
  mockStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mockTime: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mockSystemIcons: {
    width: 40,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  mockWidgetTag: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  simulatedWidget: {
    width: '100%',
  },
  opaqueWidgetOverride: {
    backgroundColor: '#1E1B4B',
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  widgetCity: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  widgetLocation: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  widgetTemp: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '300',
  },
  widgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  widgetLabel: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  widgetVal: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  lockscreenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iosLockWidgetRound: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockWidgetText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  lockWidgetSmallText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 8,
    fontWeight: '700',
    marginTop: -2,
  },
  iosLockWidgetRect: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 16,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  lockWidgetTitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  lockWidgetVal: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
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
  innerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 14,
  },
  glowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  glowPill: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  glowPillActive: {
    borderColor: '#FFF',
    transform: [{ scale: 1.1 }],
  },
});
