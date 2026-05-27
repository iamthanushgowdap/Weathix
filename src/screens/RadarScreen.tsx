import React, { useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { Canvas, Circle, Rect, Line, Group, useClock, Path, Paint, Skia } from '@shopify/react-native-skia';
import { useSharedValue, useDerivedValue } from 'react-native-reanimated';
import { GlassCard } from '../components/common/GlassCard';
import { weatherHaptics } from '../sensors/useHaptics';
import { ArrowLeft, ZoomIn, ZoomOut, Compass } from 'lucide-react-native';

interface RadarScreenProps {
  onBack: () => void;
}

// ========================================================
// CORE WEB RADAR SYSTEM
// ========================================================
const RadarWebScreen: React.FC<RadarScreenProps> = ({ onBack }) => {
  const { width: windowWidth, height } = useWindowDimensions();
  const width = Platform.OS === 'web' ? 312 : windowWidth;
  const [scale, setScale] = React.useState(1.0);

  const cx = width / 2;
  const cy = height / 2.3;
  const radarRadius = width * 0.44;

  const handleZoomIn = () => {
    weatherHaptics.selection();
    setScale(prev => Math.min(2.0, prev + 0.25));
  };

  const handleZoomOut = () => {
    weatherHaptics.selection();
    setScale(prev => Math.max(0.5, prev - 0.25));
  };

  const stormFronts = useMemo(() => {
    return [
      { rx: cx - 50, ry: cy - 70, w: 90, h: 50, color: 'rgba(34, 197, 94, 0.35)', coreColor: 'rgba(239, 68, 68, 0.45)' },
      { rx: cx + 40, ry: cy + 30, w: 70, h: 40, color: 'rgba(234, 179, 8, 0.35)', coreColor: 'rgba(234, 179, 8, 0.5)' },
    ];
  }, [cx, cy]);

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, styles.bgOverlay]} />

      {/* SVG Canvas for Web Radar */}
      <svg width={width} height={height} style={{ position: 'absolute' }}>
        <defs>
          <filter id="webRadarBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* Concentric circular grids */}
        <circle cx={cx} cy={cy} r={radarRadius} stroke="rgba(168, 85, 247, 0.22)" strokeWidth={1} fill="none" />
        <circle cx={cx} cy={cy} r={radarRadius * 0.75} stroke="rgba(168, 85, 247, 0.22)" strokeWidth={1} fill="none" />
        <circle cx={cx} cy={cy} r={radarRadius * 0.5} stroke="rgba(168, 85, 247, 0.22)" strokeWidth={1} fill="none" />
        <circle cx={cx} cy={cy} r={radarRadius * 0.25} stroke="rgba(168, 85, 247, 0.22)" strokeWidth={1} fill="none" />

        {/* Crosshair lines */}
        <line x1={cx - radarRadius} y1={cy} x2={cx + radarRadius} y2={cy} stroke="rgba(168, 85, 247, 0.12)" strokeWidth={1} />
        <line x1={cx} y1={cy - radarRadius} x2={cx} y2={cy + radarRadius} stroke="rgba(168, 85, 247, 0.12)" strokeWidth={1} />

        {/* Storm Front Heatmaps */}
        <g style={{ animation: 'pulseIntensity 4s ease-in-out infinite' }}>
          {stormFronts.map((sf, idx) => (
            <g key={idx}>
              <ellipse
                cx={sf.rx + sf.w / 2}
                cy={sf.ry + sf.h / 2}
                rx={(sf.w / 2) * scale}
                ry={(sf.h / 2) * scale}
                fill={sf.color}
                filter="url(#webRadarBlur)"
              />
              <circle
                cx={sf.rx + sf.w / 2}
                cy={sf.ry + sf.h / 2}
                r={12 * scale}
                fill={sf.coreColor}
                filter="url(#webRadarBlur)"
              />
            </g>
          ))}
        </g>

        {/* Rotating sweep line */}
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - radarRadius}
          stroke="rgba(34, 211, 238, 0.85)"
          strokeWidth={2}
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: 'radarWebSweep 3.8s linear infinite',
          }}
        />

        {/* Sweep Trail overlay */}
        <circle
          cx={cx}
          cy={cy}
          r={radarRadius}
          fill="none"
          stroke="rgba(34, 211, 238, 0.02)"
          strokeWidth={1}
        />

        {/* Simulated strike spots */}
        <circle cx={cx - 25} cy={cy - 50} r={5} fill="#F59E0B" />
        <circle cx={cx - 25} cy={cy - 50} r={10} fill="none" stroke="rgba(245, 158, 11, 0.4)" strokeWidth={1} />
      </svg>

      {/* Interactive Controls Overlay */}
      <View style={styles.hudOverlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft color="#FFF" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GPU RADAR STATION</Text>
        </View>

        <View style={styles.hudCenterCompass}>
          <Compass size={24} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.compassLabel}>SWEEPER SWEEPING...</Text>
        </View>

        {/* Zoom Controls & Diagnostic Card */}
        <View style={styles.bottomCardWrapper}>
          <GlassCard borderGlowColor="rgba(34, 211, 238, 0.22)">
            <View style={styles.radarDiagnostics}>
              <View style={{ flex: 1 }}>
                <Text style={styles.diagTitle}>HUD STATION DIAGNOSTIC (WEB)</Text>
                <Text style={styles.diagCondition}>Front: Precipitation storms active</Text>
                <Text style={styles.diagDetail}>Range: 80km • Sweeper Rate: 54 RPM</Text>
              </View>
              
              <View style={styles.zoomButtonsColumn}>
                <TouchableOpacity onPress={handleZoomIn} style={styles.zoomBtn}>
                  <ZoomIn color="#FFF" size={20} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleZoomOut} style={[styles.zoomBtn, { marginTop: 8 }]}>
                  <ZoomOut color="#FFF" size={20} />
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>
        </View>
      </View>

      {/* CSS animations injected on Web */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes radarWebSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseIntensity {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.95; }
        }
      ` }} />
    </View>
  );
};

// ========================================================
// CORE NATIVE RADAR SYSTEM (SKIA GPU ACCELERATED)
// ========================================================
const RadarNativeScreen: React.FC<RadarScreenProps> = ({ onBack }) => {
  const { width: windowWidth, height } = useWindowDimensions();
  const width = Platform.OS === 'web' ? 312 : windowWidth;
  const clock = useClock();
  const scale = useSharedValue(1.0);

  const cx = width / 2;
  const cy = height / 2.3;
  const radarRadius = width * 0.44;

  const handleZoomIn = () => {
    weatherHaptics.selection();
    scale.value = Math.min(2.0, scale.value + 0.25);
  };

  const handleZoomOut = () => {
    weatherHaptics.selection();
    scale.value = Math.max(0.5, scale.value - 0.25);
  };

  const sweepAngle = useDerivedValue(() => {
    const timeMs = clock.value;
    return (timeMs * 0.0018) % (2 * Math.PI);
  });

  const sweepPath = useDerivedValue(() => {
    const angle = sweepAngle.value;
    const path = Skia.Path.Make();
    path.moveTo(cx, cy);
    path.lineTo(cx + Math.cos(angle) * radarRadius, cy + Math.sin(angle) * radarRadius);
    return path;
  });

  const stormFronts = useMemo(() => {
    return [
      { rx: cx - 50, ry: cy - 70, w: 90, h: 50, color: 'rgba(34, 197, 94, 0.35)', coreColor: 'rgba(239, 68, 68, 0.45)' },
      { rx: cx + 40, ry: cy + 30, w: 70, h: 40, color: 'rgba(234, 179, 8, 0.35)', coreColor: 'rgba(234, 179, 8, 0.5)' },
    ];
  }, [cx, cy]);

  const stormIntensity = useDerivedValue(() => {
    return Math.sin(clock.value * 0.004) * 0.2 + 0.8;
  });

  const lightningHits = useDerivedValue(() => {
    const timeSec = Math.floor(clock.value * 0.001);
    const strikes = [];
    
    if (timeSec % 3 === 0) {
      strikes.push({ x: cx - 25, y: cy - 50 });
    }
    if (timeSec % 5 === 0) {
      strikes.push({ x: cx + 60, y: cy + 50 });
    }
    return strikes;
  });

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, styles.bgOverlay]} />

      <Canvas style={StyleSheet.absoluteFill}>
        <Group color="rgba(168, 85, 247, 0.15)" strokeWidth={1} style="stroke">
          <Circle cx={cx} cy={cy} r={radarRadius} />
          <Circle cx={cx} cy={cy} r={radarRadius * 0.75} />
          <Circle cx={cx} cy={cy} r={radarRadius * 0.5} />
          <Circle cx={cx} cy={cy} r={radarRadius * 0.25} />
        </Group>

        <Group color="rgba(168, 85, 247, 0.1)" strokeWidth={1}>
          <Line p1={{ x: cx - radarRadius, y: cy }} p2={{ x: cx + radarRadius, y: cy }} />
          <Line p1={{ x: cx, y: cy - radarRadius }} p2={{ x: cx, y: cy + radarRadius }} />
        </Group>

        <Group opacity={stormIntensity.value}>
          {stormFronts.map((sf, idx) => {
            const path = Skia.Path.Make();
            path.addOval({ x: sf.rx, y: sf.ry, width: sf.w * scale.value, height: sf.h * scale.value });
            
            return (
              <Group key={idx}>
                <Path path={path} color={sf.color} />
                <Circle cx={sf.rx + sf.w / 2} cy={sf.ry + sf.h / 2} r={12 * scale.value} color={sf.coreColor} />
              </Group>
            );
          })}
        </Group>

        <Path
          path={sweepPath}
          color="rgba(34, 211, 238, 0.8)"
          strokeWidth={2}
          style="stroke"
        />

        <Circle cx={cx} cy={cy} r={radarRadius} color="rgba(34, 211, 238, 0.015)" />

        {lightningHits.value.map((strike, idx) => (
          <Group key={idx}>
            <Circle cx={strike.x} cy={strike.y} r={6} color="#F59E0B" />
            <Circle cx={strike.x} cy={strike.y} r={12} color="rgba(245, 158, 11, 0.2)" />
          </Group>
        ))}
      </Canvas>

      <View style={styles.hudOverlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft color="#FFF" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GPU RADAR STATION</Text>
        </View>

        <View style={styles.hudCenterCompass}>
          <Compass size={24} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.compassLabel}>SWEEPER SWEEPING...</Text>
        </View>

        <View style={styles.bottomCardWrapper}>
          <GlassCard borderGlowColor="rgba(34, 211, 238, 0.22)">
            <View style={styles.radarDiagnostics}>
              <View style={{ flex: 1 }}>
                <Text style={styles.diagTitle}>HUD STATION DIAGNOSTIC</Text>
                <Text style={styles.diagCondition}>Front: Precipitation storms active</Text>
                <Text style={styles.diagDetail}>Range: 80km • Sweeper Rate: 54 RPM</Text>
              </View>
              
              <View style={styles.zoomButtonsColumn}>
                <TouchableOpacity onPress={handleZoomIn} style={styles.zoomBtn}>
                  <ZoomIn color="#FFF" size={20} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleZoomOut} style={[styles.zoomBtn, { marginTop: 8 }]}>
                  <ZoomOut color="#FFF" size={20} />
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>
        </View>
      </View>
    </View>
  );
};

// ========================================================
// CORE WEB-SAFE CONDITIONAL SEPARATOR
// ========================================================
export const RadarScreen: React.FC<RadarScreenProps> = (props) => {
  if (Platform.OS === 'web' || typeof Skia === 'undefined' || !Skia) {
    return <RadarWebScreen {...props} />;
  }
  return <RadarNativeScreen {...props} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030209',
  },
  bgOverlay: {
    backgroundColor: '#030209',
    opacity: 0.95,
  },
  hudOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
    zIndex: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  hudCenterCompass: {
    alignItems: 'center',
    marginTop: -80,
  },
  compassLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
    marginTop: 8,
  },
  bottomCardWrapper: {
    width: '100%',
  },
  radarDiagnostics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diagTitle: {
    color: '#22D3EE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  diagCondition: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  diagDetail: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  zoomButtonsColumn: {
    alignItems: 'center',
  },
  zoomBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
