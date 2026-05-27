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
import { GlassCard } from '../components/common/GlassCard';
import { PremiumButton } from '../components/common/PremiumButton';
import { computeWardrobeIntelligence } from '../services/localWardrobeAI';
import { dbOperations } from '../database/sqliteDb';
import { weatherHaptics } from '../sensors/useHaptics';
import { ArrowLeft, Sparkles, BookOpen, Smile, PenTool, CheckCircle, Sun, Wind, Droplet } from 'lucide-react-native';

interface AiDashboardProps {
  onBack: () => void;
}

export const AiDashboard: React.FC<AiDashboardProps> = ({ onBack }) => {
  const { weatherData, aqiData } = useWeatherStore();
  const [diaryNote, setDiaryNote] = useState('');
  const [moodScore, setMoodScore] = useState(3); // 1 to 5 scale
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Load existing journal records on mount
    setJournalEntries(dbOperations.getJournalEntries());
  }, []);

  if (!weatherData || !aqiData) return null;

  // Compute local AI recommendations
  const cloudDensityVal = weatherData.conditionText.toLowerCase().includes('cloud') ? 0.75 : weatherData.conditionText.toLowerCase().includes('rain') ? 0.9 : 0;
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
    
    // Save to SQLite
    dbOperations.saveJournalEntry(
      weatherData.conditionText,
      weatherData.temp,
      moodScore,
      diaryNote
    );

    // Refresh list & reset inputs
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header back strip */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft color="#FFF" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI INSIGHTS CENTER</Text>
        </View>

        {/* ========================================================
            OUTDOOR ACTIVITIES RATINGS BAR CHART
            ======================================================== */}
        <Text style={styles.sectionTitle}>OUTDOOR SUITABILITY INDEX</Text>
        <View style={styles.marginGap}>
          <GlassCard borderGlowColor="rgba(168, 85, 247, 0.22)">
            {/* Jogging */}
            <View style={styles.activityRow}>
              <View style={styles.activityMeta}>
                <Text style={styles.activityName}>Jogging Conditions</Text>
                <Text style={styles.activityValue}>{ai.activities.jogging}/10</Text>
              </View>
              <View style={styles.activityBarBg}>
                <View style={[styles.activityBarFill, { width: `${ai.activities.jogging * 10}%`, backgroundColor: '#A855F7' }]} />
              </View>
            </View>

            {/* Cycling */}
            <View style={[styles.activityRow, { marginTop: 14 }]}>
              <View style={styles.activityMeta}>
                <Text style={styles.activityName}>Cycling / Commuting</Text>
                <Text style={styles.activityValue}>{ai.activities.cycling}/10</Text>
              </View>
              <View style={styles.activityBarBg}>
                <View style={[styles.activityBarFill, { width: `${ai.activities.cycling * 10}%`, backgroundColor: '#22D3EE' }]} />
              </View>
            </View>

            {/* Landscape Photography */}
            <View style={[styles.activityRow, { marginTop: 14 }]}>
              <View style={styles.activityMeta}>
                <Text style={styles.activityName}>Photography Golden Hour</Text>
                <Text style={styles.activityValue}>{ai.activities.photography}/10</Text>
              </View>
              <View style={styles.activityBarBg}>
                <View style={[styles.activityBarFill, { width: `${ai.activities.photography * 10}%`, backgroundColor: '#EC4899' }]} />
              </View>
            </View>

            {/* Stargazing */}
            <View style={[styles.activityRow, { marginTop: 14 }]}>
              <View style={styles.activityMeta}>
                <Text style={styles.activityName}>Night Stargazing Clarity</Text>
                <Text style={styles.activityValue}>{ai.activities.stargazing}/10</Text>
              </View>
              <View style={styles.activityBarBg}>
                <View style={[styles.activityBarFill, { width: `${ai.activities.stargazing * 10}%`, backgroundColor: '#F59E0B' }]} />
              </View>
            </View>
          </GlassCard>
        </View>

        {/* ========================================================
            SLEEP COMFORT DIAGNOSTICS WIDGET
            ======================================================== */}
        <Text style={[styles.sectionTitle, styles.marginGap]}>SLEEP QUALITY METRIC</Text>
        <View style={styles.marginGap}>
          <GlassCard borderGlowColor="rgba(34, 211, 238, 0.22)">
            <View style={styles.sleepMetricsRow}>
              <View style={styles.sleepScoreBadge}>
                <Text style={styles.sleepScoreNumber}>{ai.sleepComfortIndex.score}</Text>
                <Text style={styles.sleepScoreLabel}>Index</Text>
              </View>
              <View style={styles.sleepTextCol}>
                <Text style={styles.sleepTitle}>BEDROOM COMFORT LEVEL</Text>
                <Text style={styles.sleepRecommendation}>{ai.sleepComfortIndex.recommendation}</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* ========================================================
            WARDROBE INTELLIGENCE & AESTHETIC VIBE
            ======================================================== */}
        <Text style={[styles.sectionTitle, styles.marginGap]}>WARDROBE INTELLIGENCE</Text>
        <View style={styles.marginGap}>
          <GlassCard borderGlowColor="rgba(255,255,255,0.06)">
            <View style={styles.wardrobeHeader}>
              <Sparkles size={16} color="#A855F7" />
              <Text style={styles.wardrobeTitle}>RECOMMENDED LAYERING STRATEGY</Text>
            </View>
            
            <View style={styles.vibeBadge}>
              <Text style={styles.vibeBadgeLabel}>STYLE THEME</Text>
              <Text style={styles.vibeBadgeValue}>{ai.aestheticVibe}</Text>
            </View>

            {ai.layers.map((layer, index) => (
              <View key={index} style={styles.layerCard}>
                <Text style={styles.layerNumber}>LAYER {index + 1}</Text>
                <Text style={styles.layerText}>{layer}</Text>
              </View>
            ))}
          </GlassCard>
        </View>

        {/* ========================================================
            BIO-ATMOSPHERIC DEFENSE SYSTEMS
            ======================================================== */}
        <Text style={[styles.sectionTitle, styles.marginGap]}>BIO-ATMOSPHERIC SHIELD</Text>
        <View style={styles.marginGap}>
          <GlassCard borderGlowColor="rgba(34, 211, 238, 0.22)">
            {/* Actinic UV Shielding */}
            <View style={styles.bioMetricItem}>
              <View style={styles.bioMetricHeader}>
                <Sun size={16} color="#F59E0B" />
                <Text style={[styles.bioMetricTitle, { color: '#F59E0B' }]}>DERMAL UV SUN-SHIELD</Text>
              </View>
              <Text style={styles.bioMetricValue}>{ai.uvAdvice}</Text>
            </View>

            <View style={styles.dividerLine} />

            {/* Hair Frizz Index */}
            <View style={styles.bioMetricItem}>
              <View style={styles.bioMetricHeader}>
                <Wind size={16} color="#A855F7" />
                <Text style={[styles.bioMetricTitle, { color: '#A855F7' }]}>FOLLICLE FRIZZ EXPOSURE</Text>
                <Text style={styles.bioMetricBadge}>{ai.hairFrizz.level} ({ai.hairFrizz.percent}%)</Text>
              </View>
              <Text style={styles.bioMetricValue}>{ai.hairFrizz.tip}</Text>
            </View>

            <View style={styles.dividerLine} />

            {/* Skin Hydration Index */}
            <View style={styles.bioMetricItem}>
              <View style={styles.bioMetricHeader}>
                <Droplet size={16} color="#38BDF8" />
                <Text style={[styles.bioMetricTitle, { color: '#38BDF8' }]}>TRANSEPI-DERMAL HYDRATION</Text>
                <Text style={[styles.bioMetricBadge, { color: '#38BDF8', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                  {ai.skinHydration.level}
                </Text>
              </View>
              <Text style={styles.bioMetricValue}>{ai.skinHydration.tip}</Text>
            </View>
          </GlassCard>
        </View>

        {/* ========================================================
            CREATIVE ATMOSPHERIC SPARK
            ======================================================== */}
        <Text style={[styles.sectionTitle, styles.marginGap]}>CREATIVE ATMOSPHERIC SPARK</Text>
        <View style={styles.marginGap}>
          <GlassCard borderGlowColor="rgba(236, 72, 153, 0.25)">
            <View style={styles.creativeHeader}>
              <Sparkles size={18} color="#EC4899" />
              <Text style={styles.creativeTitle}>CREATIVE SPARK</Text>
            </View>
            <Text style={styles.creativeContent}>{ai.creativeSpark}</Text>
          </GlassCard>
        </View>

        {/* ========================================================
            AI WEATHER JOURNAL & MOOD LOGGER (SQLite INTEGRATION)
            ======================================================== */}
        <Text style={[styles.sectionTitle, styles.marginGap]}>AI WEATHER JOURNAL & MEMORIES</Text>
        <View style={styles.marginGap}>
          <GlassCard borderGlowColor="rgba(255,255,255,0.08)">
            <View style={styles.journalHeader}>
              <BookOpen size={16} color="#A855F7" />
              <Text style={styles.journalTitle}>LOG WEATHER MOOD MEMORY</Text>
            </View>

            {/* Mood selector buttons */}
            <Text style={styles.journalSubtext}>How does current atmosphere affect your mood?</Text>
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
              placeholder="Log local activity memories, outfit performance or comfort notes..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
              numberOfLines={3}
              value={diaryNote}
              onChangeText={setDiaryNote}
              style={styles.diaryInput}
            />

            {saveSuccess ? (
              <View style={styles.successMessage}>
                <CheckCircle size={16} color="#22C55E" />
                <Text style={styles.successText}>Log entry saved in local SQLite storage!</Text>
              </View>
            ) : (
              <PremiumButton
                onPress={handleSaveJournal}
                title="SAVE JOURNAL LOG"
                style={styles.saveBtn}
              />
            )}

            {/* List of recent weather memories */}
            {journalEntries.length > 0 && (
              <View style={styles.journalHistoryArea}>
                <View style={styles.innerDivider} />
                <Text style={styles.historyTitle}>RECENT MOOD CORRELATIONS</Text>
                {journalEntries.slice(0, 3).map((entry) => (
                  <View key={entry.id} style={styles.entryRow}>
                    <Text style={styles.entryEmoji}>{getMoodEmoji(entry.mood_score)}</Text>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.entryMeta}>
                        {new Date(entry.timestamp).toLocaleDateString()} • {entry.temperature}°C • {entry.weather_condition}
                      </Text>
                      <Text style={styles.entryText}>{entry.diary_note}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </GlassCard>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  activityRow: {
    width: '100%',
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  activityValue: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  activityBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  activityBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  sleepMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sleepScoreBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderWidth: 1.5,
    borderColor: '#22D3EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sleepScoreNumber: {
    color: '#22D3EE',
    fontSize: 22,
    fontWeight: '800',
  },
  sleepScoreLabel: {
    color: '#22D3EE',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: -4,
  },
  sleepTextCol: {
    flex: 1,
    marginLeft: 16,
  },
  sleepTitle: {
    color: '#22D3EE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  sleepRecommendation: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18,
  },
  wardrobeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  wardrobeTitle: {
    color: '#A855F7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginLeft: 8,
  },
  layerCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  layerNumber: {
    color: '#A855F7',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  layerText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  journalTitle: {
    color: '#A855F7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginLeft: 8,
  },
  journalSubtext: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodBtnActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: '#A855F7',
  },
  moodBtnEmoji: {
    fontSize: 22,
  },
  diaryInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    color: '#FFF',
    fontSize: 14,
    padding: 16,
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
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  successText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  journalHistoryArea: {
    marginTop: 10,
  },
  innerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 16,
  },
  historyTitle: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  entryRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  entryEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  entryMeta: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  entryText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 18,
  },
  vibeBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vibeBadgeLabel: {
    color: '#A855F7',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  vibeBadgeValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bioMetricItem: {
    width: '100%',
    paddingVertical: 4,
  },
  bioMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  bioMetricTitle: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginLeft: 8,
    marginRight: 'auto',
  },
  bioMetricBadge: {
    fontSize: 9,
    color: '#A855F7',
    fontWeight: '800',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(168, 85, 247, 0.05)',
  },
  bioMetricValue: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  dividerLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 14,
  },
  creativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  creativeTitle: {
    color: '#EC4899',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginLeft: 8,
  },
  creativeContent: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
