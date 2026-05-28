import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useWeatherStore } from '../store/globalStore';
import { computeWardrobeIntelligence } from '../services/localWardrobeAI';
import { dbOperations } from '../database/sqliteDb';
import { weatherHaptics } from '../sensors/useHaptics';
import { PremiumButton } from '../components/common/PremiumButton';
import {
  ArrowLeft,
  Sparkles,
  BookOpen,
  CheckCircle,
  Sun,
  Wind,
  Droplet,
  AlertTriangle,
  Info,
  AlertCircle,
  ShieldCheck,
  Zap,
  Thermometer,
  Eye,
} from 'lucide-react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Native Alert Card Design System (mirrors alert-1.tsx for React Native)
// ─────────────────────────────────────────────────────────────────────────────

type AlertVariant = 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'secondary';

interface NativeAlertProps {
  variant?: AlertVariant;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  badge?: string;
}

const ALERT_THEME: Record<AlertVariant, {
  bg: string;
  border: string;
  iconColor: string;
  titleColor: string;
  descColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}> = {
  primary: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    iconColor: '#2563EB',
    titleColor: '#1E3A5F',
    descColor: '#374151',
    badgeBg: '#DBEAFE',
    badgeBorder: '#93C5FD',
    badgeText: '#1D4ED8',
  },
  success: {
    bg: '#F0FDF4',
    border: '#BBF7D0',
    iconColor: '#16A34A',
    titleColor: '#14532D',
    descColor: '#374151',
    badgeBg: '#DCFCE7',
    badgeBorder: '#86EFAC',
    badgeText: '#15803D',
  },
  warning: {
    bg: '#FFFBEB',
    border: '#FDE68A',
    iconColor: '#D97706',
    titleColor: '#78350F',
    descColor: '#374151',
    badgeBg: '#FEF3C7',
    badgeBorder: '#FCD34D',
    badgeText: '#B45309',
  },
  destructive: {
    bg: '#FFF1F2',
    border: '#FECDD3',
    iconColor: '#DC2626',
    titleColor: '#7F1D1D',
    descColor: '#374151',
    badgeBg: '#FFE4E6',
    badgeBorder: '#FDA4AF',
    badgeText: '#BE123C',
  },
  info: {
    bg: '#F5F3FF',
    border: '#DDD6FE',
    iconColor: '#7C3AED',
    titleColor: '#2E1065',
    descColor: '#374151',
    badgeBg: '#EDE9FE',
    badgeBorder: '#C4B5FD',
    badgeText: '#6D28D9',
  },
  secondary: {
    bg: '#F9FAFB',
    border: '#E5E7EB',
    iconColor: '#6B7280',
    titleColor: '#111827',
    descColor: '#374151',
    badgeBg: '#F3F4F6',
    badgeBorder: '#D1D5DB',
    badgeText: '#374151',
  },
};

const NativeAlert: React.FC<NativeAlertProps> = ({
  variant = 'secondary',
  icon,
  title,
  description,
  badge,
}) => {
  const t = ALERT_THEME[variant];
  return (
    <View style={[alertStyles.card, { backgroundColor: t.bg, borderColor: t.border }]}>
      <View style={[alertStyles.iconWrap, { backgroundColor: t.badgeBg }]}>
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<any>, { color: t.iconColor, size: 20 })
          : icon}
      </View>
      <View style={alertStyles.content}>
        <View style={alertStyles.titleRow}>
          <Text style={[alertStyles.title, { color: t.titleColor }]}>{title}</Text>
          {badge ? (
            <View style={[alertStyles.badge, { backgroundColor: t.badgeBg, borderColor: t.badgeBorder }]}>
              <Text style={[alertStyles.badgeText, { color: t.badgeText }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {description ? (
          <Text style={[alertStyles.description, { color: t.descColor }]}>{description}</Text>
        ) : null}
      </View>
    </View>
  );
};

const alertStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <Text style={styles.sectionTitle}>{label}</Text>
);

// ─────────────────────────────────────────────────────────────────────────────
// Activity Bar Row
// ─────────────────────────────────────────────────────────────────────────────
const ActivityBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <View style={styles.activityRow}>
    <View style={styles.activityMeta}>
      <Text style={styles.activityName}>{label}</Text>
      <Text style={[styles.activityValue, { color }]}>{value}/10</Text>
    </View>
    <View style={styles.activityBarBg}>
      <View style={[styles.activityBarFill, { width: `${value * 10}%`, backgroundColor: color }]} />
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
interface AiDashboardProps {
  onBack: () => void;
}

export const AiDashboard: React.FC<AiDashboardProps> = ({ onBack }) => {
  const { weatherData, aqiData } = useWeatherStore();
  const [diaryNote, setDiaryNote] = useState('');
  const [moodScore, setMoodScore] = useState(3);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setJournalEntries(dbOperations.getJournalEntries());
  }, []);

  if (!weatherData || !aqiData) return null;

  const cloudDensityVal = weatherData.conditionText.toLowerCase().includes('cloud')
    ? 0.75
    : weatherData.conditionText.toLowerCase().includes('rain')
    ? 0.9
    : 0;

  const ai = computeWardrobeIntelligence(
    weatherData.temp,
    weatherData.hourly.rainProb[0] || 0,
    weatherData.windSpeed,
    weatherData.humidity,
    weatherData.uvIndex,
    aqiData.aqi,
    weatherData.isDay,
    cloudDensityVal
  );

  const handleSaveJournal = () => {
    if (!diaryNote.trim()) return;
    weatherHaptics.selection();
    dbOperations.saveJournalEntry(weatherData.conditionText, weatherData.temp, moodScore, diaryNote);
    setJournalEntries(dbOperations.getJournalEntries());
    setDiaryNote('');
    setMoodScore(3);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const getMoodEmoji = (score: number) => {
    const emojis = ['😢', '😕', '😐', '🙂', '😊'];
    return emojis[score - 1] || '😐';
  };

  // Derive dynamic alert messages from AI data
  const uvAlertVariant = weatherData.uvIndex >= 8 ? 'destructive' : weatherData.uvIndex >= 5 ? 'warning' : 'success';
  const aqiAlertVariant = aqiData.aqi >= 150 ? 'destructive' : aqiData.aqi >= 100 ? 'warning' : aqiData.aqi >= 51 ? 'info' : 'success';
  const rainAlertVariant = (weatherData.hourly.rainProb[0] || 0) >= 70 ? 'destructive' : (weatherData.hourly.rainProb[0] || 0) >= 40 ? 'warning' : 'success';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      {/* Solid white background — no theme sky bleeding */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.solidBg} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft color="#1E293B" size={22} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>AI INSIGHTS CENTER</Text>
            <Text style={styles.headerSub}>Personalised atmospheric intelligence</Text>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════
            LIVE CONDITION ALERTS  (Alert Card System)
        ═══════════════════════════════════════════════════════════ */}
        <SectionHeader label="LIVE CONDITION ALERTS" />
        <View style={styles.section}>
          <NativeAlert
            variant={uvAlertVariant as AlertVariant}
            icon={<Sun />}
            title="UV Radiation Index"
            description={ai.uvAdvice}
            badge={`UV ${weatherData.uvIndex}`}
          />
          <NativeAlert
            variant={aqiAlertVariant as AlertVariant}
            icon={<Eye />}
            title="Air Quality Status"
            description={`AQI reads ${aqiData.aqi} — ${aqiData.aqi >= 150 ? 'Unhealthy: limit outdoor exposure.' : aqiData.aqi >= 100 ? 'Sensitive groups should reduce activity.' : aqiData.aqi >= 51 ? 'Moderate air quality today.' : 'Air quality is good — enjoy outdoors!'}`}
            badge={`AQI ${aqiData.aqi}`}
          />
          <NativeAlert
            variant={rainAlertVariant as AlertVariant}
            icon={<Droplet />}
            title="Precipitation Forecast"
            description={`${weatherData.hourly.rainProb[0] || 0}% probability next hour. ${(weatherData.hourly.rainProb[0] || 0) >= 70 ? 'Take an umbrella — rain is very likely.' : (weatherData.hourly.rainProb[0] || 0) >= 40 ? 'Carry a light jacket just in case.' : 'Skies look clear — no rain expected.'}`}
            badge={`${weatherData.hourly.rainProb[0] || 0}% Rain`}
          />
          <NativeAlert
            variant="info"
            icon={<Thermometer />}
            title="Feels-Like Temperature"
            description={`Current conditions feel like ${weatherData.feelsLike ?? weatherData.temp}°C. ${ai.layers[0] ?? 'Dress comfortably for today.'}`}
            badge={`${weatherData.feelsLike ?? weatherData.temp}°C`}
          />
        </View>

        {/* ═══════════════════════════════════════════════════════════
            OUTDOOR SUITABILITY INDEX
        ═══════════════════════════════════════════════════════════ */}
        <SectionHeader label="OUTDOOR SUITABILITY INDEX" />
        <View style={styles.section}>
          <View style={styles.card}>
            <ActivityBar label="Jogging Conditions" value={ai.activities.jogging} color="#7C3AED" />
            <View style={styles.activityDivider} />
            <ActivityBar label="Cycling / Commuting" value={ai.activities.cycling} color="#0EA5E9" />
            <View style={styles.activityDivider} />
            <ActivityBar label="Photography Golden Hour" value={ai.activities.photography} color="#EC4899" />
            <View style={styles.activityDivider} />
            <ActivityBar label="Night Stargazing Clarity" value={ai.activities.stargazing} color="#F59E0B" />
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════
            WARDROBE & BIO-SHIELD ALERTS
        ═══════════════════════════════════════════════════════════ */}
        <SectionHeader label="WARDROBE INTELLIGENCE" />
        <View style={styles.section}>
          <NativeAlert
            variant="primary"
            icon={<Sparkles />}
            title={`Style Theme · ${ai.aestheticVibe}`}
            description={ai.layers.join(' → ')}
          />
          <NativeAlert
            variant={ai.hairFrizz.level === 'High' || ai.hairFrizz.level === 'Very High' ? 'warning' : 'secondary'}
            icon={<Wind />}
            title="Follicle Frizz Exposure"
            description={ai.hairFrizz.tip}
            badge={`${ai.hairFrizz.level} · ${ai.hairFrizz.percent}%`}
          />
          <NativeAlert
            variant={ai.skinHydration.level === 'Parched' || ai.skinHydration.level === 'Dry' ? 'warning' : 'success'}
            icon={<Droplet />}
            title="Transepidermal Hydration"
            description={ai.skinHydration.tip}
            badge={ai.skinHydration.level}
          />
        </View>

        {/* ═══════════════════════════════════════════════════════════
            SLEEP QUALITY
        ═══════════════════════════════════════════════════════════ */}
        <SectionHeader label="SLEEP QUALITY METRIC" />
        <View style={styles.section}>
          <View style={[styles.card, styles.sleepRow]}>
            <View style={styles.sleepScoreBadge}>
              <Text style={styles.sleepScoreNumber}>{ai.sleepComfortIndex.score}</Text>
              <Text style={styles.sleepScoreLabel}>INDEX</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.sleepTitle}>BEDROOM COMFORT LEVEL</Text>
              <Text style={styles.sleepRec}>{ai.sleepComfortIndex.recommendation}</Text>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════
            CREATIVE ATMOSPHERIC SPARK
        ═══════════════════════════════════════════════════════════ */}
        <SectionHeader label="CREATIVE ATMOSPHERIC SPARK" />
        <View style={styles.section}>
          <NativeAlert
            variant="info"
            icon={<Zap />}
            title="Creative Spark"
            description={ai.creativeSpark}
          />
        </View>

        {/* ═══════════════════════════════════════════════════════════
            WEATHER JOURNAL & MOOD LOGGER
        ═══════════════════════════════════════════════════════════ */}
        <SectionHeader label="AI WEATHER JOURNAL & MEMORIES" />
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.journalHeader}>
              <BookOpen size={16} color="#7C3AED" />
              <Text style={styles.journalTitle}>LOG WEATHER MOOD MEMORY</Text>
            </View>
            <Text style={styles.journalSubtext}>How does the current atmosphere affect your mood?</Text>

            {/* Mood Selector */}
            <View style={styles.moodSelectorRow}>
              {[1, 2, 3, 4, 5].map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[styles.moodBtn, moodScore === score && styles.moodBtnActive]}
                  onPress={() => setMoodScore(score)}
                >
                  <Text style={styles.moodBtnEmoji}>{getMoodEmoji(score)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Log activity memories, outfit performance or comfort notes..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              value={diaryNote}
              onChangeText={setDiaryNote}
              style={styles.diaryInput}
            />

            {saveSuccess ? (
              <View style={styles.successMessage}>
                <CheckCircle size={16} color="#16A34A" />
                <Text style={styles.successText}>Log entry saved in local SQLite storage!</Text>
              </View>
            ) : (
              <PremiumButton onPress={handleSaveJournal} title="SAVE JOURNAL LOG" style={styles.saveBtn} />
            )}

            {journalEntries.length > 0 && (
              <View style={styles.journalHistoryArea}>
                <View style={styles.innerDivider} />
                <Text style={styles.historyTitle}>RECENT MOOD CORRELATIONS</Text>
                {journalEntries.slice(0, 3).map((entry) => (
                  <View key={entry.id} style={styles.entryRow}>
                    <Text style={styles.entryEmoji}>{getMoodEmoji(entry.mood_score)}</Text>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.entryMeta}>
                        {new Date(entry.timestamp).toLocaleDateString()} · {entry.temperature}°C · {entry.weather_condition}
                      </Text>
                      <Text style={styles.entryText}>{entry.diary_note}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles — light theme throughout
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  solidBg: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 110,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 14,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerSub: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },

  // Section label
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 18,
    marginBottom: 10,
  },

  // Generic content wrapper
  section: {
    gap: 0,
  },

  // White card for bar charts / tables
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Activity bars
  activityRow: {
    width: '100%',
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  activityName: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  activityValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  activityBarBg: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  activityBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },

  // Sleep card
  sleepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sleepScoreBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#93C5FD',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sleepScoreNumber: {
    color: '#2563EB',
    fontSize: 20,
    fontWeight: '800',
  },
  sleepScoreLabel: {
    color: '#2563EB',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: -2,
  },
  sleepTitle: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  sleepRec: {
    color: '#374151',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Journal card
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  journalTitle: {
    color: '#7C3AED',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  journalSubtext: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
  },
  moodSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  moodBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodBtnActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#7C3AED',
  },
  moodBtnEmoji: {
    fontSize: 22,
  },
  diaryInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    color: '#0F172A',
    fontSize: 14,
    padding: 14,
    height: 90,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  saveBtn: {
    height: 46,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    gap: 8,
  },
  successText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
  },
  journalHistoryArea: {
    marginTop: 6,
  },
  innerDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  historyTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  entryRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  entryEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  entryMeta: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  entryText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 18,
  },
});
