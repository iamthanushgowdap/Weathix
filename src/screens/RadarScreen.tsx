import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { GlassCard } from '../components/common/GlassCard';
import { weatherHaptics } from '../sensors/useHaptics';
import { ArrowLeft, ZoomIn, ZoomOut, Compass } from 'lucide-react-native';
import LoadingRadar from '../../components/ui/loading-radar';

interface RadarScreenProps {
  onBack: () => void;
}

const RadarWebScreen: React.FC<RadarScreenProps> = ({ onBack }) => {
  const { width: windowWidth, height } = useWindowDimensions();
  const width = Platform.OS === 'web' ? 312 : windowWidth;
  const [scale, setScale] = React.useState(1.0);

  const cx = width / 2;
  const cy = height / 2.3;

  const handleZoomIn = () => {
    weatherHaptics.selection();
    setScale(prev => Math.min(2.0, prev + 0.25));
  };

  const handleZoomOut = () => {
    weatherHaptics.selection();
    setScale(prev => Math.max(0.5, prev - 0.25));
  };

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, styles.bgOverlay]} />

      {/* Centered Radar */}
      <View style={[styles.centerContainer, { left: cx - 75, top: cy - 75, transform: [{ scale }] } as any]}>
        <LoadingRadar />
      </View>

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
    </View>
  );
};

const RadarNativeScreen: React.FC<RadarScreenProps> = ({ onBack }) => {
  const { width: windowWidth, height } = useWindowDimensions();
  const width = Platform.OS === 'web' ? 312 : windowWidth;
  const scale = useSharedValue(1.0);

  const cx = width / 2;
  const cy = height / 2.3;

  const handleZoomIn = () => {
    weatherHaptics.selection();
    scale.value = Math.min(2.0, scale.value + 0.25);
  };

  const handleZoomOut = () => {
    weatherHaptics.selection();
    scale.value = Math.max(0.5, scale.value - 0.25);
  };

  const animatedScaleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, styles.bgOverlay]} />

      {/* Centered Radar */}
      <Animated.View style={[styles.centerContainer, { left: cx - 75, top: cy - 75 }, animatedScaleStyle]}>
        <LoadingRadar />
      </Animated.View>

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

export const RadarScreen: React.FC<RadarScreenProps> = (props) => {
  return Platform.OS === 'web' ? <RadarWebScreen {...props} /> : <RadarNativeScreen {...props} />;
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
  centerContainer: {
    position: 'absolute',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
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

