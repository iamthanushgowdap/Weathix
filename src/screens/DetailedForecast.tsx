import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Canvas, Path, LinearGradient, vec, Circle, Skia } from '@shopify/react-native-skia';
import { useWeatherStore } from '../store/globalStore';
import { GlassCard } from '../components/common/GlassCard';
import { weatherHaptics } from '../sensors/useHaptics';
import { ChevronDown, ChevronUp, Sun, CloudRain, CloudSnow, Cloud, ArrowLeft, CloudSun, CloudLightning, CloudFog, Wind } from 'lucide-react-native';

interface DetailedForecastProps {
  onBack: () => void;
}

// ========================================================
// CORE WEB FORECAST SYSTEM (SVG BEZIER CHARTS)
// ========================================================
const DetailedForecastWeb: React.FC<DetailedForecastProps> = ({ onBack }) => {
  const { width: windowWidth } = useWindowDimensions();
  const width = Platform.OS === 'web' ? 312 : windowWidth;
  const { weatherData, tempUnit } = useWeatherStore();
  const [expandedDayIdx, setExpandedDayIdx] = useState<number | null>(null);

  if (!weatherData) return null;

  const hourly = weatherData.hourly;
  const daily = weatherData.daily;

  const chartHeight = 120;
  const chartPadding = 20;
  const chartWidth = width - 40;

  const maxTemp = Math.max(...hourly.temp.slice(0, 10));
  const minTemp = Math.min(...hourly.temp.slice(0, 10));
  const tempRange = maxTemp - minTemp || 1;

  const points = hourly.temp.slice(0, 10).map((t, idx) => {
    const x = chartPadding + idx * ((chartWidth - 2 * chartPadding) / 9);
    const y = chartHeight - chartPadding - ((t - minTemp) / tempRange) * (chartHeight - 2 * chartPadding);
    return { x, y, temp: t };
  });

  // Build SVG Bezier Path
  const getBezierPathD = () => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  // Build SVG Gradient Area Path
  const getFillPathD = () => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${chartHeight} L ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    d += ` L ${points[points.length - 1].x} ${chartHeight} Z`;
    return d;
  };

  const toggleExpandDay = (idx: number) => {
    weatherHaptics.selection();
    setExpandedDayIdx(expandedDayIdx === idx ? null : idx);
  };

  const getConditionIcon = (code: number, size = 20) => {
    if (code === 0) {
      return <Sun color="#F59E0B" size={size} />;
    }
    if (code >= 1 && code <= 2) {
      return <CloudSun color="#F59E0B" size={size} />;
    }
    if (code === 3) {
      return <Cloud color="#94A3B8" size={size} />;
    }
    if ((code >= 51 && code <= 57) || (code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
      return <CloudRain color="#0EA5E9" size={size} />;
    }
    if (code >= 95 && code <= 99) {
      return <CloudLightning color="#A855F7" size={size} />;
    }
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
      return <CloudSnow color="#E2E8F0" size={size} />;
    }
    if (code === 45 || code === 48) {
      return <CloudFog color="#94A3B8" size={size} />;
    }
    if (code === 20) {
      return <Wind color="#38BDF8" size={size} />;
    }
    return <Cloud color="rgba(255,255,255,0.7)" size={size} />;
  };

  const formattedTemp = (c: number) => {
    if (tempUnit === 'F') {
      return `${Math.round((c * 9) / 5 + 32)}°F`;
    }
    return `${c}°C`;
  };

  const pathD = getBezierPathD();
  const fillD = getFillPathD();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FORECAST HUB</Text>
      </View>

      <Text style={styles.sectionTitle}>HOURLY TREND (24H)</Text>
      <GlassCard style={styles.marginGap} borderGlowColor="rgba(168, 85, 247, 0.2)">
        <Text style={styles.chartLegend}>Interpolated Bezier Path (°C) (WEB)</Text>
        
        <View style={styles.chartContainer}>
          {/* SVG representation for Web */}
          {points.length > 0 && (
            <svg width={chartWidth} height={chartHeight} style={{ position: 'relative' }}>
              <defs>
                <linearGradient id="webForecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(168, 85, 247, 0.35)" />
                  <stop offset="100%" stopColor="rgba(168, 85, 247, 0.0)" />
                </linearGradient>
              </defs>
              <path d={fillD} fill="url(#webForecastGrad)" />
              <path d={pathD} fill="none" stroke="#A855F7" strokeWidth={3} />
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={4} fill="#FFF" />
              ))}
            </svg>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timelineLabelsScroll}>
          {points.map((p, idx) => (
            <View key={idx} style={[styles.timelineLabelCol, { width: chartWidth / 7.6 }]}>
              <Text style={styles.timelineLabelTemp}>{formattedTemp(p.temp)}</Text>
              <Text style={styles.timelineLabelTime}>{hourly.time[idx]}</Text>
              {getConditionIcon(hourly.condition[idx], 16)}
              <Text style={styles.timelineLabelRain}>{hourly.rainProb[idx]}%</Text>
            </View>
          ))}
        </ScrollView>
      </GlassCard>

      <Text style={[styles.sectionTitle, styles.marginGap]}>10-DAY OUTLOOK</Text>
      <View style={styles.marginGap}>
        {daily.time.map((dayTime, idx) => {
          const isExpanded = expandedDayIdx === idx;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => toggleExpandDay(idx)}
              style={styles.dayCardWrapper}
            >
              <GlassCard borderGlowColor={isExpanded ? 'rgba(168, 85, 247, 0.35)' : 'rgba(255,255,255,0.06)'}>
                <View style={styles.dayCardHeader}>
                  <Text style={styles.dayDate}>{dayTime}</Text>
                  
                  <View style={styles.dayCardHeaderRight}>
                    {getConditionIcon(daily.condition[idx], 20)}
                    <Text style={styles.dayTempRange}>
                      {formattedTemp(daily.maxTemp[idx])}  /  <Text style={styles.lowTempText}>{formattedTemp(daily.minTemp[idx])}</Text>
                    </Text>
                    {isExpanded ? <ChevronUp color="rgba(255,255,255,0.5)" size={18} /> : <ChevronDown color="rgba(255,255,255,0.5)" size={18} />}
                  </View>
                </View>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.divider} />
                    <View style={styles.expandedGrid}>
                      <View style={styles.expandedGridItem}>
                        <Text style={styles.expandedLabel}>RAIN CHANCE</Text>
                        <Text style={styles.expandedValue}>{daily.rainProbMax[idx]}%</Text>
                      </View>
                      <View style={styles.expandedGridItem}>
                        <Text style={styles.expandedLabel}>MAX UV INDEX</Text>
                        <Text style={styles.expandedValue}>{daily.uvMax[idx]}</Text>
                      </View>
                      <View style={styles.expandedGridItem}>
                        <Text style={styles.expandedLabel}>HUMIDITY</Text>
                        <Text style={styles.expandedValue}>{weatherData.humidity}%</Text>
                      </View>
                      <View style={styles.expandedGridItem}>
                        <Text style={styles.expandedLabel}>ATM PRESSURE</Text>
                        <Text style={styles.expandedValue}>{weatherData.pressure} hPa</Text>
                      </View>
                    </View>
                  </View>
                )}
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

// ========================================================
// CORE NATIVE FORECAST SYSTEM (SKIA GPU ACCELERATED)
// ========================================================
const DetailedForecastNative: React.FC<DetailedForecastProps> = ({ onBack }) => {
  const { width: windowWidth } = useWindowDimensions();
  const width = Platform.OS === 'web' ? 312 : windowWidth;
  const { weatherData, tempUnit } = useWeatherStore();
  const [expandedDayIdx, setExpandedDayIdx] = useState<number | null>(null);

  if (!weatherData) return null;

  const hourly = weatherData.hourly;
  const daily = weatherData.daily;

  const chartHeight = 120;
  const chartPadding = 20;
  const chartWidth = width - 40;

  const maxTemp = Math.max(...hourly.temp.slice(0, 10));
  const minTemp = Math.min(...hourly.temp.slice(0, 10));
  const tempRange = maxTemp - minTemp || 1;

  const points = hourly.temp.slice(0, 10).map((t, idx) => {
    const x = chartPadding + idx * ((chartWidth - 2 * chartPadding) / 9);
    const y = chartHeight - chartPadding - ((t - minTemp) / tempRange) * (chartHeight - 2 * chartPadding);
    return { x, y, temp: t };
  });

  const curvePath = React.useMemo(() => {
    const path = Skia.Path.Make();
    if (points.length === 0) return path;

    path.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      path.cubicTo(cpX1, cpY1, cpX2, cpY2, p1.x, p1.y);
    }
    return path;
  }, [points]);

  const fillPath = React.useMemo(() => {
    const path = Skia.Path.Make();
    if (points.length === 0) return path;

    path.moveTo(points[0].x, chartHeight);
    path.lineTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      path.cubicTo(cpX1, cpY1, cpX2, cpY2, p1.x, p1.y);
    }

    path.lineTo(points[points.length - 1].x, chartHeight);
    path.close();
    return path;
  }, [points]);

  const toggleExpandDay = (idx: number) => {
    weatherHaptics.selection();
    setExpandedDayIdx(expandedDayIdx === idx ? null : idx);
  };

  const getConditionIcon = (code: number, size = 20) => {
    if (code === 0) {
      return <Sun color="#F59E0B" size={size} />;
    }
    if (code >= 1 && code <= 2) {
      return <CloudSun color="#F59E0B" size={size} />;
    }
    if (code === 3) {
      return <Cloud color="#94A3B8" size={size} />;
    }
    if ((code >= 51 && code <= 57) || (code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
      return <CloudRain color="#0EA5E9" size={size} />;
    }
    if (code >= 95 && code <= 99) {
      return <CloudLightning color="#A855F7" size={size} />;
    }
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
      return <CloudSnow color="#E2E8F0" size={size} />;
    }
    if (code === 45 || code === 48) {
      return <CloudFog color="#94A3B8" size={size} />;
    }
    if (code === 20) {
      return <Wind color="#38BDF8" size={size} />;
    }
    return <Cloud color="rgba(255,255,255,0.7)" size={size} />;
  };

  const formattedTemp = (c: number) => {
    if (tempUnit === 'F') {
      return `${Math.round((c * 9) / 5 + 32)}°F`;
    }
    return `${c}°C`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FORECAST HUB</Text>
      </View>

      <Text style={styles.sectionTitle}>HOURLY TREND (24H)</Text>
      <GlassCard style={styles.marginGap} borderGlowColor="rgba(168, 85, 247, 0.2)">
        <Text style={styles.chartLegend}>Interpolated Bezier Path (°C)</Text>
        
        <View style={styles.chartContainer}>
          <Canvas style={{ width: chartWidth, height: chartHeight }}>
            <Path path={fillPath}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, chartHeight)}
                colors={['rgba(168, 85, 247, 0.3)', 'rgba(168, 85, 247, 0.0)']}
              />
            </Path>
            <Path
              path={curvePath}
              style="stroke"
              strokeWidth={3}
              color="#A855F7"
            />
            {points.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={4} color="#FFF" />
            ))}
          </Canvas>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timelineLabelsScroll}>
          {points.map((p, idx) => (
            <View key={idx} style={[styles.timelineLabelCol, { width: chartWidth / 7.6 }]}>
              <Text style={styles.timelineLabelTemp}>{formattedTemp(p.temp)}</Text>
              <Text style={styles.timelineLabelTime}>{hourly.time[idx]}</Text>
              {getConditionIcon(hourly.condition[idx], 16)}
              <Text style={styles.timelineLabelRain}>{hourly.rainProb[idx]}%</Text>
            </View>
          ))}
        </ScrollView>
      </GlassCard>

      <Text style={[styles.sectionTitle, styles.marginGap]}>10-DAY OUTLOOK</Text>
      <View style={styles.marginGap}>
        {daily.time.map((dayTime, idx) => {
          const isExpanded = expandedDayIdx === idx;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => toggleExpandDay(idx)}
              style={styles.dayCardWrapper}
            >
              <GlassCard borderGlowColor={isExpanded ? 'rgba(168, 85, 247, 0.35)' : 'rgba(255,255,255,0.06)'}>
                <View style={styles.dayCardHeader}>
                  <Text style={styles.dayDate}>{dayTime}</Text>
                  
                  <View style={styles.dayCardHeaderRight}>
                    {getConditionIcon(daily.condition[idx], 20)}
                    <Text style={styles.dayTempRange}>
                      {formattedTemp(daily.maxTemp[idx])}  /  <Text style={styles.lowTempText}>{formattedTemp(daily.minTemp[idx])}</Text>
                    </Text>
                    {isExpanded ? <ChevronUp color="rgba(255,255,255,0.5)" size={18} /> : <ChevronDown color="rgba(255,255,255,0.5)" size={18} />}
                  </View>
                </View>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.divider} />
                    <View style={styles.expandedGrid}>
                      <View style={styles.expandedGridItem}>
                        <Text style={styles.expandedLabel}>RAIN CHANCE</Text>
                        <Text style={styles.expandedValue}>{daily.rainProbMax[idx]}%</Text>
                      </View>
                      <View style={styles.expandedGridItem}>
                        <Text style={styles.expandedLabel}>MAX UV INDEX</Text>
                        <Text style={styles.expandedValue}>{daily.uvMax[idx]}</Text>
                      </View>
                      <View style={styles.expandedGridItem}>
                        <Text style={styles.expandedLabel}>HUMIDITY</Text>
                        <Text style={styles.expandedValue}>{weatherData.humidity}%</Text>
                      </View>
                      <View style={styles.expandedGridItem}>
                        <Text style={styles.expandedLabel}>ATM PRESSURE</Text>
                        <Text style={styles.expandedValue}>{weatherData.pressure} hPa</Text>
                      </View>
                    </View>
                  </View>
                )}
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

// ========================================================
// CORE WEB-SAFE CONDITIONAL SEPARATOR
// ========================================================
export const DetailedForecast: React.FC<DetailedForecastProps> = (props) => {
  if (Platform.OS === 'web' || typeof Skia === 'undefined' || !Skia) {
    return <DetailedForecastWeb {...props} />;
  }
  return <DetailedForecastNative {...props} />;
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
  chartLegend: {
    color: '#A855F7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  timelineLabelsScroll: {
    marginTop: 16,
    flexDirection: 'row',
  },
  timelineLabelCol: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  timelineLabelTemp: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  timelineLabelTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineLabelRain: {
    color: '#0EA5E9',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
  },
  dayCardWrapper: {
    marginBottom: 10,
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayDate: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dayCardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayTempRange: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  lowTempText: {
    color: 'rgba(255,255,255,0.4)',
  },
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
  },
  expandedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  expandedGridItem: {
    width: '46%',
    marginBottom: 12,
  },
  expandedLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  expandedValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
});
