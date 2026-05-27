import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Canvas, Path, Circle, Paint, Skia } from '@shopify/react-native-skia';
import { useWeatherStore } from '../store/globalStore';
import { GlassCard } from '../components/common/GlassCard';
import { ArrowLeft, ShieldAlert, Heart, Activity } from 'lucide-react-native';

interface AqiScreenProps {
  onBack: () => void;
}

// ========================================================
// CORE WEB AQI GRAPH (SVG GAUGE)
// ========================================================
const AqiWebScreen: React.FC<AqiScreenProps> = ({ onBack }) => {
  const { width: windowWidth } = useWindowDimensions();
  const width = Platform.OS === 'web' ? 312 : windowWidth;
  const { aqiData } = useWeatherStore();

  if (!aqiData) return null;

  const circleSize = 160;
  const radius = 70;
  const cx = circleSize / 2;
  const cy = circleSize / 2;

  const percentage = Math.min(1.0, aqiData.aqi / 300);
  const angleRad = (135 + percentage * 270) * (Math.PI / 180);
  const dotX = cx + radius * Math.cos(angleRad);
  const dotY = cy + radius * Math.sin(angleRad);

  const getAqiColor = (aqi: number): string => {
    if (aqi > 150) return '#EF4444';
    if (aqi > 100) return '#F59E0B';
    return '#22C55E';
  };

  const getAqiStatus = (aqi: number): string => {
    if (aqi > 150) return 'UNHEALTHY';
    if (aqi > 100) return 'SENSITIVE GROUPS';
    return 'EXCELLENT';
  };

  const pollutantLimits = { pm25: 15, pm10: 45, no2: 40, so2: 20, o3: 50 };

  // Calculate SVG arc path parameters
  // Start point (135 degrees)
  const startX = cx + radius * Math.cos(135 * Math.PI / 180);
  const startY = cy + radius * Math.sin(135 * Math.PI / 180);

  // Background arc (full 270 degrees to 45 degrees)
  const bgEndX = cx + radius * Math.cos(45 * Math.PI / 180);
  const bgEndY = cy + radius * Math.sin(45 * Math.PI / 180);
  const bgPathD = `M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${bgEndX} ${bgEndY}`;

  // Active arc
  const activePathD = `M ${startX} ${startY} A ${radius} ${radius} 0 ${percentage > 0.5 ? 1 : 0} 1 ${dotX} ${dotY}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AIR INTELLIGENCE</Text>
      </View>

      <View style={styles.circularGaugeArea}>
        <GlassCard style={styles.circularCard} borderGlowColor="rgba(34, 211, 238, 0.22)">
          <View style={styles.gaugeContent}>
            <View style={styles.skiaGaugeWrapper}>
              {/* Web SVG Circular Arc */}
              <svg width={circleSize} height={circleSize} style={{ position: 'absolute' }}>
                <path
                  d={bgPathD}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth={8}
                  strokeLinecap="round"
                />
                <path
                  d={activePathD}
                  fill="none"
                  stroke={getAqiColor(aqiData.aqi)}
                  strokeWidth={8}
                  strokeLinecap="round"
                />
                <circle cx={dotX} cy={dotY} r={6} fill="#FFF" />
              </svg>
              
              <View style={styles.internalGaugeText}>
                <Text style={[styles.gaugeNumber, { color: getAqiColor(aqiData.aqi) }]}>{aqiData.aqi}</Text>
                <Text style={styles.gaugeLabel}>US-AQI</Text>
              </View>
            </View>

            <Text style={styles.aqiStatusTag}>{getAqiStatus(aqiData.aqi)}</Text>
            <Text style={styles.aqiDisclaimer}>Computed in real-time across 5 core particulates</Text>
          </View>
        </GlassCard>
      </View>

      <Text style={styles.sectionTitle}>HEALTH RECOMMENDATION</Text>
      <GlassCard style={styles.marginGap} borderGlowColor="rgba(34, 211, 238, 0.15)">
        <View style={styles.recommendationHeader}>
          <ShieldAlert size={18} color="#22D3EE" />
          <Text style={styles.recommendationTitle}>ADVISORY PROTOCOL</Text>
        </View>
        <Text style={styles.recommendationText}>{aqiData.healthRecommendation}</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.healthTipsRow}>
          <View style={styles.healthTipCol}>
            <Heart size={16} color="#EC4899" />
            <Text style={styles.healthTipText}>{aqiData.aqi > 100 ? 'Jogging inside recommended' : 'Cycling fine outdoor'}</Text>
          </View>
          <View style={styles.healthTipCol}>
            <Activity size={16} color="#22C55E" />
            <Text style={styles.healthTipText}>{aqiData.aqi > 150 ? 'Wear N95 protection' : 'No protection needed'}</Text>
          </View>
        </View>
      </GlassCard>

      <Text style={[styles.sectionTitle, styles.marginGap]}>POLLUTANT METRICS</Text>
      <View style={styles.marginGap}>
        {/* PM2.5 */}
        <GlassCard style={styles.metricCard} borderGlowColor="rgba(255,255,255,0.06)">
          <View style={styles.metricRow}>
            <Text style={styles.metricName}>PM2.5 (Fine Particulates)</Text>
            <Text style={styles.metricValue}>{aqiData.pm25} µg/m³</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, (aqiData.pm25 / pollutantLimits.pm25) * 100)}%`, backgroundColor: getAqiColor(aqiData.aqi) },
              ]}
            />
          </View>
          <Text style={styles.limitLabel}>Safety Limit: {pollutantLimits.pm25} µg/m³</Text>
        </GlassCard>

        {/* PM10 */}
        <GlassCard style={styles.metricCard} borderGlowColor="rgba(255,255,255,0.06)">
          <View style={styles.metricRow}>
            <Text style={styles.metricName}>PM10 (Coarse Dust)</Text>
            <Text style={styles.metricValue}>{aqiData.pm10} µg/m³</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, (aqiData.pm10 / pollutantLimits.pm10) * 100)}%`, backgroundColor: getAqiColor(aqiData.aqi) },
              ]}
            />
          </View>
          <Text style={styles.limitLabel}>Safety Limit: {pollutantLimits.pm10} µg/m³</Text>
        </GlassCard>

        {/* Ozone */}
        <GlassCard style={styles.metricCard} borderGlowColor="rgba(255,255,255,0.06)">
          <View style={styles.metricRow}>
            <Text style={styles.metricName}>O₃ (Ground-level Ozone)</Text>
            <Text style={styles.metricValue}>{aqiData.o3} µg/m³</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, (aqiData.o3 / pollutantLimits.o3) * 100)}%`, backgroundColor: '#22C55E' },
              ]}
            />
          </View>
          <Text style={styles.limitLabel}>Safety Limit: {pollutantLimits.o3} µg/m³</Text>
        </GlassCard>
      </View>
    </ScrollView>
  );
};

// ========================================================
// CORE NATIVE AQI GRAPH (SKIA GAUGE)
// ========================================================
const AqiNativeScreen: React.FC<AqiScreenProps> = ({ onBack }) => {
  const { aqiData } = useWeatherStore();

  if (!aqiData) return null;

  const circleSize = 160;
  const radius = 70;
  const cx = circleSize / 2;
  const cy = circleSize / 2;

  const arcPath = React.useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc({ x: cx - radius, y: cy - radius, width: radius * 2, height: radius * 2 }, 135, 270);
    return path;
  }, [cx, cy, radius]);

  const percentage = Math.min(1.0, aqiData.aqi / 300);
  const angleRad = (135 + percentage * 270) * (Math.PI / 180);
  const dotX = cx + radius * Math.cos(angleRad);
  const dotY = cy + radius * Math.sin(angleRad);

  const getAqiColor = (aqi: number): string => {
    if (aqi > 150) return '#EF4444';
    if (aqi > 100) return '#F59E0B';
    return '#22C55E';
  };

  const getAqiStatus = (aqi: number): string => {
    if (aqi > 150) return 'UNHEALTHY';
    if (aqi > 100) return 'SENSITIVE GROUPS';
    return 'EXCELLENT';
  };

  const pollutantLimits = { pm25: 15, pm10: 45, no2: 40, so2: 20, o3: 50 };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AIR INTELLIGENCE</Text>
      </View>

      <View style={styles.circularGaugeArea}>
        <GlassCard style={styles.circularCard} borderGlowColor="rgba(34, 211, 238, 0.22)">
          <View style={styles.gaugeContent}>
            <View style={styles.skiaGaugeWrapper}>
              <Canvas style={{ width: circleSize, height: circleSize }}>
                <Path path={arcPath} style="stroke" strokeWidth={8} color="rgba(255, 255, 255, 0.05)" />
                <Path
                  path={arcPath}
                  style="stroke"
                  strokeWidth={8}
                  color={getAqiColor(aqiData.aqi)}
                  strokeCap="round"
                />
                <Circle cx={dotX} cy={dotY} r={6} color="#FFF" />
              </Canvas>
              
              <View style={styles.internalGaugeText}>
                <Text style={[styles.gaugeNumber, { color: getAqiColor(aqiData.aqi) }]}>{aqiData.aqi}</Text>
                <Text style={styles.gaugeLabel}>US-AQI</Text>
              </View>
            </View>

            <Text style={styles.aqiStatusTag}>{getAqiStatus(aqiData.aqi)}</Text>
            <Text style={styles.aqiDisclaimer}>Computed in real-time across 5 core particulates</Text>
          </View>
        </GlassCard>
      </View>

      <Text style={styles.sectionTitle}>HEALTH RECOMMENDATION</Text>
      <GlassCard style={styles.marginGap} borderGlowColor="rgba(34, 211, 238, 0.15)">
        <View style={styles.recommendationHeader}>
          <ShieldAlert size={18} color="#22D3EE" />
          <Text style={styles.recommendationTitle}>ADVISORY PROTOCOL</Text>
        </View>
        <Text style={styles.recommendationText}>{aqiData.healthRecommendation}</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.healthTipsRow}>
          <View style={styles.healthTipCol}>
            <Heart size={16} color="#EC4899" />
            <Text style={styles.healthTipText}>{aqiData.aqi > 100 ? 'Jogging inside recommended' : 'Cycling fine outdoor'}</Text>
          </View>
          <View style={styles.healthTipCol}>
            <Activity size={16} color="#22C55E" />
            <Text style={styles.healthTipText}>{aqiData.aqi > 150 ? 'Wear N95 protection' : 'No protection needed'}</Text>
          </View>
        </View>
      </GlassCard>

      <Text style={[styles.sectionTitle, styles.marginGap]}>POLLUTANT METRICS</Text>
      <View style={styles.marginGap}>
        {/* PM2.5 */}
        <GlassCard style={styles.metricCard} borderGlowColor="rgba(255,255,255,0.06)">
          <View style={styles.metricRow}>
            <Text style={styles.metricName}>PM2.5 (Fine Particulates)</Text>
            <Text style={styles.metricValue}>{aqiData.pm25} µg/m³</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, (aqiData.pm25 / pollutantLimits.pm25) * 100)}%`, backgroundColor: getAqiColor(aqiData.aqi) },
              ]}
            />
          </View>
          <Text style={styles.limitLabel}>Safety Limit: {pollutantLimits.pm25} µg/m³</Text>
        </GlassCard>

        {/* PM10 */}
        <GlassCard style={styles.metricCard} borderGlowColor="rgba(255,255,255,0.06)">
          <View style={styles.metricRow}>
            <Text style={styles.metricName}>PM10 (Coarse Dust)</Text>
            <Text style={styles.metricValue}>{aqiData.pm10} µg/m³</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, (aqiData.pm10 / pollutantLimits.pm10) * 100)}%`, backgroundColor: getAqiColor(aqiData.aqi) },
              ]}
            />
          </View>
          <Text style={styles.limitLabel}>Safety Limit: {pollutantLimits.pm10} µg/m³</Text>
        </GlassCard>

        {/* Ozone */}
        <GlassCard style={styles.metricCard} borderGlowColor="rgba(255,255,255,0.06)">
          <View style={styles.metricRow}>
            <Text style={styles.metricName}>O₃ (Ground-level Ozone)</Text>
            <Text style={styles.metricValue}>{aqiData.o3} µg/m³</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, (aqiData.o3 / pollutantLimits.o3) * 100)}%`, backgroundColor: '#22C55E' },
              ]}
            />
          </View>
          <Text style={styles.limitLabel}>Safety Limit: {pollutantLimits.o3} µg/m³</Text>
        </GlassCard>
      </View>
    </ScrollView>
  );
};

// ========================================================
// CORE WEB-SAFE CONDITIONAL SEPARATOR
// ========================================================
export const AqiScreen: React.FC<AqiScreenProps> = (props) => {
  if (Platform.OS === 'web' || typeof Skia === 'undefined' || !Skia) {
    return <AqiWebScreen {...props} />;
  }
  return <AqiNativeScreen {...props} />;
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
  circularGaugeArea: {
    alignItems: 'center',
    marginVertical: 10,
  },
  circularCard: {
    width: '100%',
    alignItems: 'center',
  },
  gaugeContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skiaGaugeWrapper: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  internalGaugeText: {
    position: 'absolute',
    alignItems: 'center',
  },
  gaugeNumber: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
  },
  gaugeLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: -2,
  },
  aqiStatusTag: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 10,
  },
  aqiDisclaimer: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionTitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 20,
  },
  marginGap: {
    marginTop: 14,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    color: '#22D3EE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginLeft: 8,
  },
  recommendationText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 14,
  },
  healthTipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthTipCol: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  healthTipText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8,
  },
  metricCard: {
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  metricValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  limitLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
