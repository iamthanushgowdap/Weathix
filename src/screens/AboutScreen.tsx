import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { GlassCard } from '../components/common/GlassCard';
import { weatherHaptics } from '../sensors/useHaptics';
import { ArrowLeft, ArrowUpRight, Award, Shield, AlertTriangle } from 'lucide-react-native';

interface AboutScreenProps {
  onBack: () => void;
}

// ─── Polar Mist deep navy — permanent for About page ─────────────────────────
const PM_COLORS: [string, string, string] = ['#1E3A8A', '#0F172A', '#060D1F'];

// ─── Deterministic star field (same every render, no random flicker) ──────────
// We pre-compute 80 stars using a simple seeded LCG so the pattern is
// always identical without storing state.
function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

interface Star {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
}

function buildStars(width: number, height: number, count = 90): Star[] {
  const rand = lcg(42); // fixed seed → same stars every time
  return Array.from({ length: count }, () => ({
    cx: rand() * width,
    cy: rand() * height * 0.65, // only in upper 65% of screen
    r: rand() * 1.4 + 0.4,
    opacity: rand() * 0.6 + 0.3,
  }));
}

// ─── Inline SVG social icons ──────────────────────────────────────────────────
const GithubIcon = (props: any) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={props.color || '#fff'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <Path d="M9 18c-4.51 2-5-2-7-2" />
  </Svg>
);

const LinkedinIcon = (props: any) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={props.color || '#fff'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <Rect x="2" y="9" width="4" height="12" />
    <Circle cx="4" cy="4" r="2" />
  </Svg>
);

// ─── Star field SVG layer ──────────────────────────────────────────────────────
const StarField: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const stars = useMemo(() => buildStars(width, height), [width, height]);
  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill as any}
      pointerEvents="none"
    >
      {stars.map((s, i) => (
        <Circle
          key={i}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill="#FFFFFF"
          opacity={s.opacity}
        />
      ))}
    </Svg>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export const AboutScreen: React.FC<AboutScreenProps> = ({ onBack }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const developerInfo = {
    name: 'Thanush Gowda P',
    title: 'Founder & Lead AI Developer',
    institution: 'APS College of Engineering',
    bio: 'Building Weathix — an advanced local-first weather operating system. Passionate about sleek interfaces, clean architectures, and privacy-first local computing.',
    socialLinks: [
      { id: 'github',   icon: GithubIcon,   label: 'GitHub',   href: 'https://github.com/iamthanushgowdap/Weathix' },
      { id: 'linkedin', icon: LinkedinIcon,  label: 'LinkedIn', href: 'https://www.linkedin.com/in/iamthanushgowda/' },
    ],
    actionButton: { text: 'Get in Touch', href: 'mailto:chocolatethanush@gmail.com' },
  };

  const handleOpenURL = (url: string) => {
    weatherHaptics.selection();
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  return (
    <View style={styles.root}>
      {/* ── Layer 1: Polar Mist deep navy gradient (PERMANENT) ── */}
      <LinearGradient
        colors={PM_COLORS}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* ── Layer 2: Star field (SVG dots, deterministic, never changes) ── */}
      <StarField width={windowWidth} height={windowHeight} />

      {/* ── Layer 3: Subtle nebula glow in top-left ── */}
      <View style={styles.nebulaGlow} pointerEvents="none" />

      {/* ── Layer 4: Scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft color="#FFF" size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ABOUT WEATHIX</Text>
        </View>

        {/* ══════════════════════════════════════════════════════
            DEVELOPER GLASSMORPHIC PROFILE CARD
        ══════════════════════════════════════════════════════ */}
        <View style={styles.profileSection}>
          <GlassCard borderGlowColor="rgba(147, 197, 253, 0.35)" style={styles.profileCard}>
            <View style={styles.centerAlignWrapper}>

              {/* App Logo */}
              <View style={styles.avatarFrame}>
                <Image
                  source={require('../../assets/icon.png')}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </View>

              {/* App name badge */}
              <View style={styles.appNameBadge}>
                <Text style={styles.appNameText}>WEATHIX</Text>
              </View>

              <Text style={styles.devName}>{developerInfo.name}</Text>

              {/* Founder title — white text, glass pill background */}
              <View style={styles.titlePill}>
                <Text style={styles.devTitle}>{developerInfo.title}</Text>
              </View>

              <Text style={styles.devInstitution}>{developerInfo.institution}</Text>
              <Text style={styles.devBio}>{developerInfo.bio}</Text>

              <View style={styles.divider} />

              {/* Social links */}
              <View style={styles.socialRow}>
                {developerInfo.socialLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleOpenURL(item.href)}
                      style={styles.socialButton}
                      activeOpacity={0.7}
                    >
                      <Icon color="rgba(255, 255, 255, 0.9)" />
                      <Text style={styles.socialLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Get in touch */}
              <TouchableOpacity
                onPress={() => handleOpenURL(developerInfo.actionButton.href)}
                style={styles.actionBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnText}>{developerInfo.actionButton.text}</Text>
                <ArrowUpRight size={16} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>

        {/* ══════════════════════════════════════════════════════
            APP TECHNICAL BLUEPRINT
        ══════════════════════════════════════════════════════ */}
        <Text style={styles.sectionTitle}>APP TECHNICAL BLUEPRINT</Text>
        <View style={styles.marginGap}>
          <GlassCard borderGlowColor="rgba(34, 211, 238, 0.25)" style={styles.infoCard}>

            <View style={styles.infoRow}>
              <Award size={20} color="#93C5FD" />
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoCardTitle}>Local-First Architecture</Text>
                <Text style={styles.infoCardDesc}>
                  Weathix stores weather forecasts and AQI logs locally in a sandboxed SQLite database, optimizing offline stability and network overhead.
                </Text>
              </View>
            </View>

            <View style={styles.innerDivider} />

            <View style={styles.infoRow}>
              <Shield size={20} color="#6EE7B7" />
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoCardTitle}>Privacy-Shielded GPS</Text>
                <Text style={styles.infoCardDesc}>
                  Uses exact coordinate resolution for local updates while processing telemetry internally. We protect user identity by design.
                </Text>
              </View>
            </View>

            <View style={styles.innerDivider} />

            <View style={styles.infoRow}>
              <AlertTriangle size={20} color="#FCD34D" />
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoCardTitle}>Free Warning Station Alerts</Text>
                <Text style={styles.infoCardDesc}>
                  Triggers storm alerts and precipitation warnings locally on your device's native system — free, without paid remote push servers or analytics.
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060D1F',
  },
  // Nebula glow: soft blue-purple radial halo in top-left corner
  nebulaGlow: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 110,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 16,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2.5,
    textShadowColor: 'rgba(147, 197, 253, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  // ── Profile card ──
  profileSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 28,
  },
  profileCard: { width: '100%' },
  centerAlignWrapper: {
    width: '100%',
    alignItems: 'center',
  },

  // Logo frame
  avatarFrame: {
    width: 88,
    height: 88,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(147, 197, 253, 0.35)',
    padding: 5,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },

  // App name badge
  appNameBadge: {
    backgroundColor: 'rgba(147, 197, 253, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 12,
  },
  appNameText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
  },

  devName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(147, 197, 253, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  // ── Founder title — glass pill + WHITE text ──
  titlePill: {
    backgroundColor: 'rgba(147, 197, 253, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginTop: 8,
    marginBottom: 4,
  },
  devTitle: {
    color: '#FFFFFF',          // White — explicit user requirement
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  devInstitution: {
    color: 'rgba(147, 197, 253, 0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  devBio: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 8,
  },
  divider: {
    width: '50%',
    height: 1,
    backgroundColor: 'rgba(147, 197, 253, 0.15)',
    marginVertical: 20,
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 7,
  },
  socialLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '600',
  },

  // Action button
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 28,
    marginTop: 22,
    shadowColor: '#93C5FD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
    gap: 6,
  },
  actionBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },

  // ── Blueprint section ──
  sectionTitle: {
    color: 'rgba(147, 197, 253, 0.5)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  marginGap: { marginTop: 12 },
  infoCard: { width: '100%' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  infoTextWrapper: { flex: 1 },
  infoCardTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  infoCardDesc: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 4,
  },
  innerDivider: {
    height: 1,
    backgroundColor: 'rgba(147, 197, 253, 0.08)',
    marginVertical: 14,
  },
});
