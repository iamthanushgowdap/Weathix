import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useWeatherStore } from '../store/globalStore';
import { GlassCard } from '../components/common/GlassCard';
import { weatherHaptics } from '../sensors/useHaptics';
import { ArrowLeft, Bell, AlertTriangle, CloudRain, Shield, Settings } from 'lucide-react-native';

interface NotificationCenterProps {
  onBack: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onBack }) => {
  const { weatherData } = useWeatherStore();

  const [morningBrief, setMorningBrief] = useState(true);
  const [severeWarnings, setSevereWarnings] = useState(true);
  const [rainAlerts, setRainAlerts] = useState(true);
  const [widgetSync, setWidgetSync] = useState(true);

  const alertsList = React.useMemo(() => {
    const list: any[] = [];
    if (!weatherData) return list;

    // Procedural warnings based on current weather variables
    if (weatherData.hourly.rainProb[0] > 50) {
      list.push({
        id: '1',
        title: 'Dynamic Rain Alert',
        desc: `Heavy rain incoming with a ${weatherData.hourly.rainProb[0]}% precipitation probability. Carry waterproof layers.`,
        severity: 'MEDIUM',
        icon: <CloudRain color="#0EA5E9" size={20} />,
      });
    }

    if (weatherData.windSpeed > 30) {
      list.push({
        id: '2',
        title: 'Severe Gale Advisory',
        desc: `Stiff gusty wind speeds recorded at ${weatherData.windSpeed} km/h. Anchor lightweight items.`,
        severity: 'MEDIUM',
        icon: <AlertTriangle color="#F59E0B" size={20} />,
      });
    }

    // Default basic alert
    list.push({
      id: '3',
      title: 'Atmospheric Stability Perfect',
      desc: 'All meteorological barometers are reporting stable high-latitude index conditions.',
      severity: 'OPTIMAL',
      icon: <Shield color="#22C55E" size={20} />,
    });

    return list;
  }, [weatherData]);

  const handleToggleMorning = (val: boolean) => {
    weatherHaptics.selection();
    setMorningBrief(val);
  };

  const handleToggleSevere = (val: boolean) => {
    weatherHaptics.selection();
    setSevereWarnings(val);
  };

  const handleToggleRain = (val: boolean) => {
    weatherHaptics.selection();
    setRainAlerts(val);
  };

  const handleToggleWidget = (val: boolean) => {
    weatherHaptics.selection();
    setWidgetSync(val);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header back strip */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>WARNING STATIONS</Text>
      </View>

      {/* ========================================================
          ACTIVE WARNING SYSTEM CARDS
          ======================================================== */}
      <Text style={styles.sectionTitle}>ACTIVE METEOROLOGICAL WARNINGS</Text>
      <View style={styles.marginGap}>
        {alertsList.map((alert) => (
          <View key={alert.id} style={styles.alertCardWrapper}>
            <GlassCard
              borderGlowColor={
                alert.severity === 'HIGH'
                  ? 'rgba(239, 68, 68, 0.4)'
                  : alert.severity === 'MEDIUM'
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(255,255,255,0.06)'
              }
            >
              <View style={styles.alertRow}>
                <View style={styles.alertIconCol}>{alert.icon}</View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <View style={styles.alertHeaderRow}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <View
                      style={[
                        styles.severityPill,
                        {
                          backgroundColor:
                            alert.severity === 'HIGH'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : alert.severity === 'MEDIUM'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(34, 197, 94, 0.15)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityText,
                          {
                            color:
                              alert.severity === 'HIGH'
                                ? '#EF4444'
                                : alert.severity === 'MEDIUM'
                                ? '#F59E0B'
                                : '#22C55E',
                          },
                        ]}
                      >
                        {alert.severity}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.alertDesc}>{alert.desc}</Text>
                </View>
              </View>
            </GlassCard>
          </View>
        ))}
      </View>

      {/* ========================================================
          NOTIFICATION SCHEDULING INTERFACE
          ======================================================== */}
      <Text style={[styles.sectionTitle, styles.marginGap]}>SCHEDULING PROTOCOLS</Text>
      <View style={styles.marginGap}>
        <GlassCard borderGlowColor="rgba(255,255,255,0.06)">
          {/* Morning briefing */}
          <View style={styles.switchRow}>
            <View style={styles.switchLabelCol}>
              <Bell size={18} color="#A855F7" />
              <View style={styles.switchTextCol}>
                <Text style={styles.switchTitle}>Morning Atmospheric Brief</Text>
                <Text style={styles.switchDesc}>Daily weather highlights pushed at 7:00 AM</Text>
              </View>
            </View>
            <Switch
              value={morningBrief}
              onValueChange={handleToggleMorning}
              trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#A855F7' }}
              thumbColor={morningBrief ? '#FFF' : '#A1A1AA'}
            />
          </View>

          <View style={styles.innerDivider} />

          {/* Severe storm warning */}
          <View style={styles.switchRow}>
            <View style={styles.switchLabelCol}>
              <AlertTriangle size={18} color="#F59E0B" />
              <View style={styles.switchTextCol}>
                <Text style={styles.switchTitle}>Severe Warnings Broadcast</Text>
                <Text style={styles.switchDesc}>Instant alerts for lightning, floods or extreme gales</Text>
              </View>
            </View>
            <Switch
              value={severeWarnings}
              onValueChange={handleToggleSevere}
              trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#A855F7' }}
              thumbColor={severeWarnings ? '#FFF' : '#A1A1AA'}
            />
          </View>

          <View style={styles.innerDivider} />

          {/* Rain arrival warning */}
          <View style={styles.switchRow}>
            <View style={styles.switchLabelCol}>
              <CloudRain size={18} color="#0EA5E9" />
              <View style={styles.switchTextCol}>
                <Text style={styles.switchTitle}>Precipitation Arrival Alerts</Text>
                <Text style={styles.switchDesc}>Smart timing alerts triggered 30 mins before rain hits</Text>
              </View>
            </View>
            <Switch
              value={rainAlerts}
              onValueChange={handleToggleRain}
              trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#A855F7' }}
              thumbColor={rainAlerts ? '#FFF' : '#A1A1AA'}
            />
          </View>

          <View style={styles.innerDivider} />

          {/* Lockscreen Widget updates */}
          <View style={styles.switchRow}>
            <View style={styles.switchLabelCol}>
              <Settings size={18} color="#22D3EE" />
              <View style={styles.switchTextCol}>
                <Text style={styles.switchTitle}>Lockscreen Widget Synchrony</Text>
                <Text style={styles.switchDesc}>Refreshes widget metrics silently on background updates</Text>
              </View>
            </View>
            <Switch
              value={widgetSync}
              onValueChange={handleToggleWidget}
              trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#A855F7' }}
              thumbColor={widgetSync ? '#FFF' : '#A1A1AA'}
            />
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
  alertCardWrapper: {
    marginBottom: 12,
  },
  alertRow: {
    flexDirection: 'row',
  },
  alertIconCol: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  severityPill: {
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  severityText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alertDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 16,
  },
  switchTextCol: {
    marginLeft: 14,
  },
  switchTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  switchDesc: {
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
});
