import React, { useEffect, useState } from 'react';
import { StyleSheet, View, StatusBar, Platform, SafeAreaView, TouchableOpacity } from 'react-native';
import { useWeatherStore } from './src/store/globalStore';
import { initDatabase } from './src/database/sqliteDb';
import { mmkvStorage } from './src/database/mmkvStorage';
import { calculateSolarPosition, getSkyColorsForSolarElevation } from './src/services/noaaCalculator';
import { AtmosphericCanvas } from './src/components/weather-effects/AtmosphericCanvas';
import { getWeatherMetrics, mapWeatherCode } from './src/services/openMeteo';
import { LinearGradient } from 'expo-linear-gradient';
import { SplashOnboarding } from './src/screens/SplashOnboarding';
import { Dashboard } from './src/screens/Dashboard';
import { DetailedForecast } from './src/screens/DetailedForecast';
import { RadarScreen } from './src/screens/RadarScreen';
import { MenuBar } from './components/ui/bottom-menu';
import { AqiScreen } from './src/screens/AqiScreen';
import { NotificationCenter } from './src/screens/NotificationCenter';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AiDashboard } from './src/screens/AiDashboard';
import { CityCompareScreen } from './src/screens/CityCompareScreen';
import { WidgetCustomizer } from './src/screens/WidgetCustomizer';
import { GlassCard } from './src/components/common/GlassCard';
import { weatherHaptics } from './src/sensors/useHaptics';
import { Home, Sliders, Bell, Sparkles, Layout, Compass } from 'lucide-react-native';

const getSkyGradientString = (selectedTheme: string): string => {
  switch (selectedTheme) {
    case 'Lush Forest':
      return `radial-gradient(circle at top left, #CFFFDC 0%, transparent 35%), linear-gradient(180deg, #68BA7F 0%, #2E6F40 50%, #253D2C 100%)`;

    case 'Arctic Night':
      return `radial-gradient(circle at top right, rgba(255, 255, 255, 0.1) 0%, transparent 30%), linear-gradient(180deg, #1E1B4B 0%, #0A0E1A 50%, #180E24 100%)`;

    case 'Desert Gold':
      return `radial-gradient(circle at top left, #fff4c4 0%, transparent 30%), linear-gradient(180deg, #FFD84D 0%, #FFB36B 45%, #F6C7E2 100%)`;

    case 'Monsoon Slate':
      return `radial-gradient(circle at top left, rgba(255, 255, 255, 0.1) 0%, transparent 25%), linear-gradient(180deg, #475569 0%, #1E293B 50%, #0F172A 100%)`;

    case 'Aurora Dream':
      return `radial-gradient(circle at top left, #86EFAC 0%, transparent 35%), linear-gradient(180deg, #05180E 0%, #090514 60%, #1E1B4B 100%)`;

    case 'Midnight Storm':
      return `radial-gradient(circle at top right, rgba(255, 255, 255, 0.15) 0%, transparent 20%), linear-gradient(180deg, #7A6BFF 0%, #5A5DE6 45%, #A76EFF 100%)`;

    case 'Tropical Cyan':
      return `radial-gradient(circle at top left, #67E8F9 0%, transparent 30%), linear-gradient(180deg, #06B6D4 0%, #083344 60%, #020617 100%)`;

    case 'Sunset Ember':
      return `radial-gradient(circle at top left, #FECACA 0%, transparent 30%), linear-gradient(180deg, #F43F5E 0%, #BE123C 50%, #4C0519 100%)`;

    case 'Polar Mist':
    default:
      return `radial-gradient(circle at top right, rgba(255, 255, 255, 0.15) 0%, transparent 25%), linear-gradient(180deg, #93C5FD 0%, #3B82F6 50%, #1E3A8A 100%)`;
  }
};

export default function App() {
  const {
    selectedCity,
    weatherData,
    loadSavedPreferences,
    fetchWeather,
    requestDeviceLocation,
    audioEnabled,
  } = useWeatherStore();

  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<string>('Home');

  // 1. Initialise core database structures and configurations
  useEffect(() => {
    // Run SQLite migrations
    initDatabase();
    
    // Load mmkv parameters
    loadSavedPreferences();

    // Check onboarding completion
    const onboardFlag = mmkvStorage.getString('onboarding-finished');
    if (onboardFlag === 'true') {
      setOnboardingComplete(true);
    }

    // Trigger initial fuzzed geolocation request (falls back to Bengaluru default)
    requestDeviceLocation();
  }, []);

  // 2. Continuous solar calculation to drive real-time background gradient mesh
  const solarElevation = React.useMemo(() => {
    return calculateSolarPosition(selectedCity.latitude, selectedCity.longitude).elevation;
  }, [selectedCity, weatherData]);

  // Translate solar coordinates to sky gradations
  const skyConfig = React.useMemo(() => {
    if (!weatherData) {
      return {
        colors: ['#93C5FD', '#3B82F6', '#1E3A8A'],
        ambientGlow: '#93C5FD',
        skyBlur: 25,
      };
    }

    const metrics = getWeatherMetrics(weatherData.conditionCode);
    const cloudDensityVal = metrics.cloudDensity;
    const mapped = mapWeatherCode(weatherData.conditionCode, weatherData.isDay);
    const weatherTheme = mapped.theme;

    return getSkyColorsForSolarElevation(solarElevation, cloudDensityVal, weatherData.conditionText, weatherTheme);
  }, [solarElevation, weatherData]);

  const handleOnboardingComplete = () => {
    weatherHaptics.selection();
    mmkvStorage.setString('onboarding-finished', 'true');
    setOnboardingComplete(true);
  };

  const handleNavPress = (screen: string) => {
    weatherHaptics.selection();
    setCurrentScreen(screen);
  };

  const menuItems = React.useMemo(() => [
    {
      icon: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      label: "Home"
    },
    {
      icon: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
      label: "Radar Map"
    },
    {
      icon: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
      ),
      label: "AI Insights"
    },
    {
      icon: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      ),
      label: "Notifications"
    },
    {
      icon: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      ),
      label: "Widgets"
    },
    {
      icon: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      ),
      label: "Settings"
    }
  ], []);

  const handleMenuItemClick = (index: number) => {
    const screens = [
      'Home',
      'Radar Map',
      'AI Insights',
      'Notification Center',
      'Widgets',
      'Settings'
    ];
    handleNavPress(screens[index]);
  };

  if (!onboardingComplete) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" translucent />
        <SplashOnboarding onComplete={handleOnboardingComplete} />
      </View>
    );
  }

  // Active Screen Selector Switch
  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return <Dashboard onNavigate={setCurrentScreen} />;
      case 'Detailed Forecast':
        return <DetailedForecast onBack={() => setCurrentScreen('Home')} />;
      case 'Radar Map':
        return <RadarScreen onBack={() => setCurrentScreen('Home')} />;
      case 'AQI Details':
        return <AqiScreen onBack={() => setCurrentScreen('Home')} />;
      case 'Notification Center':
        return <NotificationCenter onBack={() => setCurrentScreen('Home')} />;
      case 'Settings':
        return (
          <SettingsScreen
            onBack={() => setCurrentScreen('Home')}
            onResetOnboarding={() => {
              mmkvStorage.setString('onboarding-finished', 'false');
              setOnboardingComplete(false);
            }}
          />
        );
      case 'AI Insights':
        return <AiDashboard onBack={() => setCurrentScreen('Home')} />;
      case 'Compare':
        return <CityCompareScreen onBack={() => setCurrentScreen('Home')} />;
      case 'Widgets':
        return <WidgetCustomizer onBack={() => setCurrentScreen('Home')} />;
      default:
        return <Dashboard onNavigate={setCurrentScreen} />;
    }
  };

  if (Platform.OS === 'web') {
    const isTabActive = (s: string) => currentScreen === s;
    const getThemeAccentColor = (theme: string) => {
      switch (theme) {
        case 'Lush Forest': return '#68BA7F';
        case 'Arctic Night': return '#C084FC';
        case 'Desert Gold': return '#FB923C';
        case 'Monsoon Slate': return '#60A5FA';
        case 'Aurora Dream': return '#4ADE80';
        case 'Midnight Storm': return '#06B6D4';
        case 'Tropical Cyan': return '#06B6D4';
        case 'Sunset Ember': return '#F43F5E';
        case 'Polar Mist':
        default:
          return '#93C5FD';
      }
    };

    const hexToRgba = (hex: string, opacity: number) => {
      const clean = hex.replace('#', '');
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const weatherTheme = weatherData ? mapWeatherCode(weatherData.conditionCode, weatherData.isDay).theme : 'Polar Mist';
    const themeAccent = getThemeAccentColor(weatherTheme);
    const dockGlowColor = hexToRgba(themeAccent, 0.24);

    const isSunny = weatherData && weatherData.isDay && (weatherData.conditionText.toLowerCase().includes('sunny') || weatherData.conditionText.toLowerCase().includes('clear'));
    const isRainy = weatherData && (weatherData.conditionText.toLowerCase().includes('rain') || weatherData.conditionText.toLowerCase().includes('drizzle') || weatherData.conditionText.toLowerCase().includes('storm') || weatherData.conditionText.toLowerCase().includes('thunderstorm') || weatherData.conditionText.toLowerCase().includes('shower'));

    const getWebSkyGradient = () => {
      if (!weatherData) return getSkyGradientString('Polar Mist');
      const mapped = mapWeatherCode(weatherData.conditionCode, weatherData.isDay);
      return getSkyGradientString(mapped.theme);
    };

    return (
      <div className="scene-container">
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap');
          
          .scene-container {
            font-family: 'Inter', sans-serif;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            background:
              radial-gradient(circle at top left, #313131 0%, #111 40%),
              radial-gradient(circle at bottom right, #171717 0%, #090909 60%);
            display: flex;
            align-items: center;
            justify-content: center;
            perspective: 2200px;
            position: relative;
            z-index: 1;
          }

          /* Background Glow */
          .scene-container::before {
            content: '';
            position: absolute;
            width: 900px;
            height: 900px;
            background: radial-gradient(circle, #6f5bff33 0%, transparent 70%);
            filter: blur(120px);
            animation: bgPulse 8s ease-in-out infinite;
            pointer-events: none;
            z-index: 0;
          }

          @keyframes bgPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }

          .scene {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            transform-style: preserve-3d;
            z-index: 1;
          }

          /* Floating Particles */
          .particle {
            position: absolute;
            border-radius: 50%;
            background: white;
            opacity: .4;
            animation: float 12s linear infinite;
            pointer-events: none;
            z-index: 0;
          }

          @keyframes float {
            from { transform: translateY(100vh) translateX(0); }
            to { transform: translateY(-120vh) translateX(80px); }
          }

          .phone {
            position: relative;
            width: 340px;
            height: 720px;
            border-radius: 50px;
            padding: 14px;
            background: #000;
            box-shadow: 0 50px 120px rgba(0,0,0,.7);
            transform-style: preserve-3d;
            overflow: hidden;
            transition: 1s ease;
          }

          .phone.center {
            z-index: 5;
          }

          .phone:hover {
            transform: scale(1.02) translateY(-10px);
          }

          .screen {
            position: relative;
            width: 100%;
            height: 100%;
            border-radius: 40px;
            overflow: hidden;
          }

          /* Dynamic Backgrounds */
          .sunny {
            background: radial-gradient(circle at top, #ffe86b 0%, #ffcf33 25%, #f3b7a1 70%, #f7dfbf 100%);
          }

          .storm {
            background: radial-gradient(circle at top, #c98fff 0%, #7561ff 35%, #4a58ff 65%, #2a1c63 100%);
          }

          .dark-bg {
            background: radial-gradient(circle at top, #111 0%, #050505 100%);
          }

          /* Grain */
          .screen::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image: url("https://grainy-gradients.vercel.app/noise.svg");
            opacity: .12;
            mix-blend-mode: overlay;
            pointer-events: none;
            z-index: 1;
          }

          /* Status Bar */
          .status {
            display: flex;
            justify-content: space-between;
            padding: 18px 24px 5px;
            color: white;
            font-size: 14px;
            position: relative;
            z-index: 2;
            font-weight: 500;
          }

          .dynamic-island {
            position: absolute;
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            width: 120px;
            height: 34px;
            background: black;
            border-radius: 20px;
            z-index: 10;
          }

          /* Weather Hero */
          .hero {
            position: relative;
            z-index: 2;
            text-align: center;
            padding-top: 120px;
            color: white;
          }

          .hero h1 {
            font-size: 100px;
            font-weight: 900;
            line-height: 1;
            letter-spacing: -6px;
          }

          .hero p {
            font-size: 22px;
            opacity: .9;
            font-weight: 400;
          }

          .location {
            margin-top: 8px;
            font-size: 16px;
            opacity: .8;
            font-weight: 500;
          }

          /* Glass Cards */
          .glass {
            backdrop-filter: blur(30px);
            background: rgba(255,255,255,.12);
            border: 1px solid rgba(255,255,255,.18);
            box-shadow:
              inset 0 1px 1px rgba(255,255,255,.3),
              0 10px 40px rgba(0,0,0,.2);
          }

          /* Forecast Strip */
          .forecast-strip {
            position: absolute;
            left: 18px;
            right: 18px;
            bottom: 40px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            z-index: 3;
          }

          .forecast-card {
            height: 68px;
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 22px;
            color: white;
            animation: cardFloat 6s ease-in-out infinite;
          }

          .forecast-card:nth-child(2) {
            animation-delay: 1s;
          }

          @keyframes cardFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }

          /* Weather Icons */
          .cloud {
            position: absolute;
            width: 220px;
            height: 80px;
            background: white;
            border-radius: 100px;
            animation: cloudMove 18s linear infinite;
          }

          .cloud::before,
          .cloud::after {
            content: '';
            position: absolute;
            background: white;
            border-radius: 50%;
          }

          .cloud::before {
            width: 100px;
            height: 100px;
            top: -50px;
            left: 30px;
          }

          .cloud::after {
            width: 120px;
            height: 120px;
            top: -65px;
            right: 25px;
          }

          @keyframes cloudMove {
            0% { transform: translateX(-180px); }
            100% { transform: translateX(360px); }
          }

          .sun {
            position: absolute;
            width: 180px;
            height: 180px;
            border-radius: 50%;
            background: #ffd500;
            top: 90px;
            right: 30px;
            box-shadow:
              0 0 80px #ffd500,
              0 0 160px #ffd50099;
            animation: sunPulse 5s ease-in-out infinite;
          }

          @keyframes sunPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
          }

          /* Rain */
          .rain {
            position: absolute;
            inset: 0;
            overflow: hidden;
            z-index: 2;
          }

          .drop {
            position: absolute;
            width: 2px;
            height: 20px;
            background: linear-gradient(to bottom, #fff, #69a7ff);
            opacity: .7;
            border-radius: 10px;
            animation: rainFall linear infinite;
          }

          @keyframes rainFall {
            from { transform: translateY(-120px); }
            to { transform: translateY(720px); }
          }

          /* AI Insight */
          .ai-card {
            position: absolute;
            left: 18px;
            right: 18px;
            bottom: 200px;
            padding: 18px;
            border-radius: 28px;
            color: white;
            z-index: 3;
          }

          .ai-title {
            display: none;
          }

          .ai-message {
            font-size: 13px;
            line-height: 1.5;
            font-weight: 500;
          }

          /* Graph */
          .graph {
            position: absolute;
            width: 100%;
            bottom: 310px;
            z-index: 2;
            opacity: .7;
          }

          /* Floating Rings */
          .ring {
            position: absolute;
            border: 1px solid rgba(255,255,255,.2);
            border-radius: 50%;
            animation: ringFloat 8s ease-in-out infinite;
          }

          @keyframes ringFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(8deg); }
          }

          /* Header — removed from UI, hiding for safety */
          .top-icons {
            display: none;
          }

          .icon-btn {
            width: 46px;
            height: 46px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
          }

          /* Bottom Blur */
          .bottom-blur {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 220px;
            background: linear-gradient(to top, rgba(255,255,255,.15), transparent);
            backdrop-filter: blur(30px);
            z-index: 2;
            pointer-events: none;
          }

          /* Neon Glow */
          .glow {
            position: absolute;
            width: 300px;
            height: 300px;
            border-radius: 50%;
            filter: blur(100px);
            opacity: .3;
            pointer-events: none;
          }

          .glow.yellow {
            background: #ffe600;
            top: 100px;
            right: -100px;
          }

          .glow.purple {
            background: #7d6bff;
            top: 100px;
            left: -100px;
          }

          /* Diagonal Glass Shine for Real Center Phone */
          @keyframes webGlassShine {
            0% { left: -220px; }
            35% { left: 450px; }
            100% { left: 450px; }
          }

          .webShineOverlay {
            position: absolute;
            width: 200px;
            height: 120%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.18), transparent);
            transform: rotate(25deg);
            top: -120px;
            left: -220px;
            z-index: 99;
            animation: webGlassShine 6s linear infinite;
            pointer-events: none;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .tooltip-content {
            display: inline-block;
            white-space: nowrap;
          }
          .tooltip-content-wrapper {
            position: relative;
            height: 16px;
            overflow: hidden;
            animation: fadeIn 150ms ease-out;
          }
          .tooltip-label {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            opacity: 1;
            transform: translateY(0);
            transition: all 800ms cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          [data-state='closed'] {
            opacity: 0;
            transition: opacity 150ms ease-out;
          }
          [data-state='open'] {
            opacity: 1;
            transition: opacity 150ms ease-out, width 800ms cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(-100%); opacity: 0; }
          }
          .tooltip-content.slide-in {
            animation: slideIn 150ms ease-out;
          }
          .tooltip-content.slide-out {
            animation: slideOut 150ms ease-out;
          }
          @keyframes slideInUp {
            from { transform: translateY(-5px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .tooltip-animation {
            animation: fadeIn 0.3s ease-in-out, slideInUp 0.3s ease-in-out;
          }
        ` }} />

        <div className="bg-glow"></div>

        <div className="scene">
          {/* ========================================================
              SINGLE MOBILE INTERACTIVE WEATHER EXPERIENCE
              ======================================================== */}
          <div className="phone center">
            <div className="screen" style={{ background: '#000' }}>
              <div className="dynamic-island"></div>

              {/* Contained live layout exactly mapped from screenWrapper */}
              <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: '40px' }}>
                {/* Layer 1: Dynamic Sky gradient */}
                <View style={[
                  StyleSheet.absoluteFill,
                  { background: getWebSkyGradient() } as any
                ]} />

                {/* Layer 2: Asymmetric mockup glows & weather effects */}
                {isSunny && (
                  <>
                    <div className="glow yellow" style={{ pointerEvents: 'none', zIndex: 1 }}></div>
                    <div className="sun" style={{ pointerEvents: 'none', zIndex: 1 }}></div>
                    <div className="cloud" style={{ top: '220px', pointerEvents: 'none', zIndex: 1 }}></div>
                  </>
                )}

                {isRainy && (
                  <>
                    <div className="glow purple" style={{ pointerEvents: 'none', zIndex: 1 }}></div>
                    <div className="rain" style={{ pointerEvents: 'none', zIndex: 1 }}>
                      <div className="drop" style={{ left: '20%', animationDuration: '1s' }}></div>
                      <div className="drop" style={{ left: '40%', animationDuration: '1.2s' }}></div>
                      <div className="drop" style={{ left: '60%', animationDuration: '0.8s' }}></div>
                      <div className="drop" style={{ left: '75%', animationDuration: '1.1s' }}></div>
                      <div className="drop" style={{ left: '90%', animationDuration: '1.3s' }}></div>
                    </div>
                    <div className="cloud" style={{ top: '160px', pointerEvents: 'none', zIndex: 1 }}></div>
                  </>
                )}

                <View style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")`,
                    opacity: 0.12,
                    mixBlendMode: 'overlay',
                    pointerEvents: 'none',
                    zIndex: 2,
                  } as any
                ]} />

                {weatherData && (() => {
                  const m = getWeatherMetrics(weatherData.conditionCode);
                  return (
                    <AtmosphericCanvas
                      rainIntensity={m.rainIntensity}
                      windSpeed={weatherData.windSpeed}
                      cloudDensity={m.cloudDensity}
                      tempCelsius={weatherData.temp}
                      isDay={weatherData.isDay}
                      solarElevation={solarElevation}
                      stormActive={m.stormActive}
                    />
                  );
                })()}

                {/* Diagonal sweeping shine reflection inside center screen */}
                <div className="webShineOverlay"></div>

                {/* Real-time status indicators mockup over interactive content */}
                <div className="status" style={{ paddingLeft: 22, paddingRight: 22, paddingTop: 18, zIndex: 10 }}>
                  <span>{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}</span>
                  <span>⚡︎ 📶 🔋</span>
                </div>

                {/* Active page renderer */}
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 }}>
                  {renderActiveScreen()}
                </View>

                {/* Layer 5: Glowing Navigation Dock */}
                {currentScreen === 'Home' && (
                  <View style={styles.navDockWrapper}>
                    <MenuBar items={menuItems} onItemClick={handleMenuItemClick} />
                  </View>
                )}
              </div>
            </div>
          </div>


        </div>
      </div>
    );
  }

  // ========================================================
  // NATIVE VIEWPORT RENDERING BLOCK (iOS / ANDROID)
  // ========================================================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      <SafeAreaView style={styles.screenWrapper}>
        {/* ========================================================
            LAYER 1: CONTINUOUS DYNAMIC ATMOSPHERIC SKY CANVAS (CONTAINED)
            ======================================================== */}
        <LinearGradient
          colors={skyConfig.colors as any}
          style={StyleSheet.absoluteFill}
        />

        {weatherData && (() => {
          const m = getWeatherMetrics(weatherData.conditionCode);
          return (
            <AtmosphericCanvas
              rainIntensity={m.rainIntensity}
              windSpeed={weatherData.windSpeed}
              cloudDensity={m.cloudDensity}
              tempCelsius={weatherData.temp}
              isDay={weatherData.isDay}
              solarElevation={solarElevation}
              stormActive={m.stormActive}
            />
          );
        })()}

        {/* Active Screen Rendering */}
        <View style={{ flex: 1 }}>
          {renderActiveScreen()}
        </View>

        {/* ========================================================
            LAYER 3: FLOATING GLOWING GLASS NAVIGATION DOCK
            ======================================================== */}
        {currentScreen === 'Home' && (() => {
          const isTabActive = (s: string) => currentScreen === s;
          const getThemeAccentColor = (theme: string) => {
            switch (theme) {
              case 'Lush Forest': return '#68BA7F';
              case 'Arctic Night': return '#C084FC';
              case 'Desert Gold': return '#FB923C';
              case 'Monsoon Slate': return '#60A5FA';
              case 'Aurora Dream': return '#4ADE80';
              case 'Midnight Storm': return '#06B6D4';
              case 'Tropical Cyan': return '#06B6D4';
              case 'Sunset Ember': return '#F43F5E';
              case 'Polar Mist':
              default:
                return '#93C5FD';
            }
          };

          const hexToRgba = (hex: string, opacity: number) => {
            const clean = hex.replace('#', '');
            const r = parseInt(clean.substring(0, 2), 16);
            const g = parseInt(clean.substring(2, 4), 16);
            const b = parseInt(clean.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
          };

          const weatherTheme = weatherData ? mapWeatherCode(weatherData.conditionCode, weatherData.isDay).theme : 'Polar Mist';
          const themeAccent = getThemeAccentColor(weatherTheme);
          const dockGlowColor = hexToRgba(themeAccent, 0.24);

          return (
            <View style={styles.navDockWrapper}>
              <GlassCard borderGlowColor={dockGlowColor} style={styles.glassDock}>
                <View style={styles.dockRow}>
                  <TouchableOpacity onPress={() => handleNavPress('Home')} style={styles.dockTab}>
                    <Home size={22} color={isTabActive('Home') ? themeAccent : 'rgba(255,255,255,0.4)'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleNavPress('Radar Map')} style={styles.dockTab}>
                    <Compass size={22} color={isTabActive('Radar Map') ? themeAccent : 'rgba(255,255,255,0.4)'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleNavPress('AI Insights')} style={styles.dockTab}>
                    <Sparkles size={22} color={isTabActive('AI Insights') ? themeAccent : 'rgba(255,255,255,0.4)'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleNavPress('Notification Center')} style={styles.dockTab}>
                    <Bell size={22} color={isTabActive('Notification Center') ? themeAccent : 'rgba(255,255,255,0.4)'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleNavPress('Widgets')} style={styles.dockTab}>
                    <Layout size={22} color={isTabActive('Widgets') ? themeAccent : 'rgba(255,255,255,0.4)'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleNavPress('Settings')} style={styles.dockTab}>
                    <Sliders size={22} color={isTabActive('Settings') ? themeAccent : 'rgba(255,255,255,0.4)'} />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </View>
          );
        })()}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#0c0c0f' : '#03020A',
    justifyContent: Platform.OS === 'web' ? 'center' : undefined,
    alignItems: Platform.OS === 'web' ? 'center' : undefined,
  },
  screenWrapper: {
    flex: Platform.OS === 'web' ? undefined : 1,
    width: '100%',
    height: Platform.OS === 'web' ? 690 : '100%',
    maxWidth: Platform.OS === 'web' ? 320 : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' : undefined,
    borderRadius: Platform.OS === 'web' ? 42 : 0,
    overflow: 'hidden',
    position: 'relative',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 0 3px rgba(255,255,255,0.08), 0 40px 80px rgba(0,0,0,0.65)'
    } : {}),
  } as any,
  navDockWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    zIndex: 100,
  },
  glassDock: {
    paddingVertical: 12,
    borderRadius: 20,
  },
  dockRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  dockTab: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webShineOverlay: {
    position: 'absolute',
    width: 200,
    height: '120%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.18), transparent)',
    transform: [{ rotate: '25deg' }],
    top: -120,
    left: -220,
    zIndex: 99,
    animation: 'webGlassShine 6s linear infinite',
  } as any,
});
