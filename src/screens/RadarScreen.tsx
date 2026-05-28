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
  const [isManualOpen, setIsManualOpen] = React.useState(false);

  const cx = width / 2;
  const cy = height / 2.3;
  const radarSize = Math.min(270, Math.max(220, width * 0.72));

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
      <View 
        style={[
          styles.centerContainer, 
          { 
            width: radarSize,
            height: radarSize,
            left: cx - radarSize / 2, 
            top: cy - radarSize / 2, 
            transform: [{ scale }] 
          } as any
        ]}
      >
        <LoadingRadar size={radarSize} />
      </View>

      {/* Interactive Controls Overlay */}
      <View style={styles.hudOverlay}>
        <View style={styles.topHudContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <ArrowLeft color="#FFF" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>GPU RADAR STATION</Text>
          </View>

          <View style={styles.hudCenterCompass}>
            <Compass size={18} color="#22D3EE" />
            <Text style={styles.compassLabel}>SWEEPER ACTIVE • SCANNING RANGE</Text>
          </View>
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

            <View style={styles.divider} />

            <TouchableOpacity 
              onPress={() => {
                weatherHaptics.selection();
                setIsManualOpen(prev => !prev);
              }}
              style={styles.collapsibleHeader}
              activeOpacity={0.7}
            >
              <Text style={styles.instructionsHeader}>HOW DOPPLER RADAR CALCULATIONS WORK</Text>
              <Text style={styles.toggleArrow}>{isManualOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {isManualOpen && (
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsText}>
                  • <Text style={{ color: '#22D3EE', fontWeight: '700' }}>Active Sweeper:</Text> Emits radial pulse waves to calculate storm cell distance and precipitation intensity in real-time.{"\n"}
                  • <Text style={{ color: '#22D3EE', fontWeight: '700' }}>Reflectivity Return:</Text> Faded seagreen trail represents signals bounced back from clouds. Darker greens indicate denser moisture.{"\n"}
                  • <Text style={{ color: '#22D3EE', fontWeight: '700' }}>Zoom Controls:</Text> Adjust sweep scale. Higher zoom reveals storm micro-structures; lower zoom extends peripheral range.
                </Text>
              </View>
            )}
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
  const [isManualOpen, setIsManualOpen] = React.useState(false);

  const cx = width / 2;
  const cy = height / 2.3;
  const radarSize = Math.min(270, Math.max(220, width * 0.72));

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
      <Animated.View 
        style={[
          styles.centerContainer, 
          { 
            width: radarSize,
            height: radarSize,
            left: cx - radarSize / 2, 
            top: cy - radarSize / 2 
          }, 
          animatedScaleStyle
        ]}
      >
        <LoadingRadar size={radarSize} />
      </Animated.View>

      <View style={styles.hudOverlay}>
        <View style={styles.topHudContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <ArrowLeft color="#FFF" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>GPU RADAR STATION</Text>
          </View>

          <View style={styles.hudCenterCompass}>
            <Compass size={18} color="#22D3EE" />
            <Text style={styles.compassLabel}>SWEEPER ACTIVE • SCANNING RANGE</Text>
          </View>
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

            <View style={styles.divider} />

            <TouchableOpacity 
              onPress={() => {
                weatherHaptics.selection();
                setIsManualOpen(prev => !prev);
              }}
              style={styles.collapsibleHeader}
              activeOpacity={0.7}
            >
              <Text style={styles.instructionsHeader}>HOW DOPPLER RADAR CALCULATIONS WORK</Text>
              <Text style={styles.toggleArrow}>{isManualOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {isManualOpen && (
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsText}>
                  • <Text style={{ color: '#22D3EE', fontWeight: '700' }}>Active Sweeper:</Text> Emits radial pulse waves to calculate storm cell distance and precipitation intensity in real-time.{"\n"}
                  • <Text style={{ color: '#22D3EE', fontWeight: '700' }}>Reflectivity Return:</Text> Faded seagreen trail represents signals bounced back from clouds. Darker greens indicate denser moisture.{"\n"}
                  • <Text style={{ color: '#22D3EE', fontWeight: '700' }}>Zoom Controls:</Text> Adjust sweep scale. Higher zoom reveals storm micro-structures; lower zoom extends peripheral range.
                </Text>
              </View>
            )}
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
  topHudContainer: {
    width: '100%',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(34, 211, 238, 0.05)',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.15)',
  },
  compassLabel: {
    color: '#22D3EE',
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginLeft: 6,
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
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleArrow: {
    color: '#22D3EE',
    fontSize: 12,
    fontWeight: '800',
  },
  instructionsContainer: {
    marginTop: 10,
  },
  instructionsHeader: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  instructionsText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
});



