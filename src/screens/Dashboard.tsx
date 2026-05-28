import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  ScrollView,
  Image,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Canvas, Path as SkiaPath, Skia } from '@shopify/react-native-skia';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import { useWeatherStore } from '../store/globalStore';
import { mmkvStorage } from '../database/mmkvStorage';
import { computeWardrobeIntelligence } from '../services/localWardrobeAI';
import { openMeteoService, CityInfo, mapWeatherCode, getWeatherIconUrl } from '../services/openMeteo';
import LoadingRadar from '../../components/ui/loading-radar';
import { WeatherPreloader } from '../../components/ui/weather-preloader';

const waveHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: transparent;
    }
    .wave-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .wave-glow {
      fill: none;
      stroke: #ffffff55;
      stroke-width: 10;
      stroke-linecap: round;
      filter: blur(8px);
      stroke-dasharray: 14 10;
      animation: waveMove 2s linear infinite;
    }
    .wave-line {
      fill: none;
      stroke: #ffffff;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-dasharray: 14 10;
      filter:
        drop-shadow(0 0 10px rgba(255,255,255,0.9))
        drop-shadow(0 0 20px rgba(255,255,255,0.4));
      animation:
        waveMove 2s linear infinite,
        waveFloat 3s ease-in-out infinite;
    }
    @keyframes waveMove {
      100% {
        stroke-dashoffset: -48;
      }
    }
    @keyframes waveFloat {
      50% {
        transform: translateY(-6px);
      }
    }
  </style>
</head>
<body>
  <svg class="wave-svg" viewBox="0 0 500 100">
    <path class="wave-glow" d="M0 50 Q60 10 120 50 T240 50 T360 50 T500 50" />
    <path class="wave-line" d="M0 50 Q60 10 120 50 T240 50 T360 50 T500 50" />
  </svg>
</body>
</html>
`;
import { weatherHaptics } from '../sensors/useHaptics';
import { Search, ChevronRight, MapPin, Clock, X, Trash2 } from 'lucide-react-native';

const SEARCH_HISTORY_KEY = 'search-city-history';
const MAX_HISTORY = 5;

function loadSearchHistory(): CityInfo[] {
  try {
    const raw = mmkvStorage.getObject<CityInfo[]>(SEARCH_HISTORY_KEY);
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveSearchHistory(history: CityInfo[]): void {
  try {
    mmkvStorage.setObject(SEARCH_HISTORY_KEY, history.slice(0, MAX_HISTORY));
  } catch {}
}

function addCityToHistory(city: CityInfo, history: CityInfo[]): CityInfo[] {
  const filtered = history.filter((c) => c.id !== city.id);
  return [city, ...filtered].slice(0, MAX_HISTORY);
}
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

interface DashboardProps {
  onNavigate: (screen: string) => void;
}

// ========================================================
// CORE DASHBOARD — PREMIUM WEATHER UI
// Matches Sunny/Rainy mockup design language exactly:
//   Hero at top → Wave → AI card → Forecast strip at bottom
//   All bottom elements absolutely positioned
// ========================================================
export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { width: windowWidth } = useWindowDimensions();
  const width = Platform.OS === 'web' ? 312 : windowWidth;
  const {
    selectedCity,
    weatherData,
    aqiData,
    isLoading,
    isOffline,
    tempUnit,
    windUnit,
    savedCities,
    deleteCity,
    setSelectedCity,
    saveCity,
    fetchWeather,
    requestDeviceLocation,
  } = useWeatherStore();

  const formatWindSpeed = (speedKph: number) => {
    if (windUnit === 'mph') {
      return `${Math.round(speedKph * 0.621371)} mph`;
    }
    if (windUnit === 'mps') {
      return `${Math.round(speedKph * 0.277778 * 10) / 10} m/s`;
    }
    return `${speedKph} km/h`;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<CityInfo[]>(() => loadSearchHistory());
  const [isLocating, setIsLocating] = useState(false);

  const arrowTranslateX = useSharedValue(0);

  React.useEffect(() => {
    arrowTranslateX.value = withRepeat(
      withTiming(6, { duration: 800 }),
      -1,
      true
    );
  }, []);

  const animatedArrowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: arrowTranslateX.value }],
    };
  });

  // Derive Local AI Wardrobe Recommendations
  const wardrobe = React.useMemo(() => {
    if (!weatherData || !aqiData) return null;
    const cloudDensityVal = weatherData.conditionText.toLowerCase().includes('cloud')
      ? 0.75
      : weatherData.conditionText.toLowerCase().includes('rain')
        ? 0.9
        : 0;
    return computeWardrobeIntelligence(
      weatherData.temp,
      weatherData.hourly.rainProb[0] || 0,
      weatherData.windSpeed,
      weatherData.humidity,
      weatherData.uvIndex,
      aqiData.aqi,
      weatherData.isDay,
      cloudDensityVal
    );
  }, [weatherData, aqiData]);

  // SVG wave path for the graph
  const wavePath = 'M0 50 Q60 10 120 50 T240 50 T360 50 T500 50';

  // Skia path for native wave rendering
  const skiaWavePath = React.useMemo(() => {
    if (Platform.OS === 'web' || typeof Skia === 'undefined' || !Skia) {
      return null;
    }
    try {
      if (Skia.Path && typeof Skia.Path.MakeFromSVGString === 'function') {
        return Skia.Path.MakeFromSVGString(wavePath);
      }
    } catch (e) {
      console.log('[Weathix Dashboard] Skia path compilation failed:', e);
    }
    return null;
  }, [wavePath]);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      // Pass current location as context so results are priority-sorted:
      // same city first → same state → same country → world
      const cities = await openMeteoService.searchCities(text, {
        city: selectedCity.name?.replace('📍 ', ''),
        state: selectedCity.admin1,
        country: selectedCity.country,
      });
      setSearchResults(cities);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCity = async (city: CityInfo) => {
    weatherHaptics.selection();
    // Persist to search history
    const updated = addCityToHistory(city, searchHistory);
    setSearchHistory(updated);
    saveSearchHistory(updated);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchOpen(false);
    await setSelectedCity(city);
  };

  const handleRemoveHistory = (id: string) => {
    const updated = searchHistory.filter((c) => c.id !== id);
    setSearchHistory(updated);
    saveSearchHistory(updated);
  };

  const handleUseCurrentLocation = async () => {
    weatherHaptics.selection();
    setIsLocating(true);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    try {
      await requestDeviceLocation();
    } finally {
      setIsLocating(false);
    }
  };

  const handleSaveCity = (city: CityInfo) => {
    weatherHaptics.selection();
    saveCity(city);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchWeather();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formattedTemp = (c: number) => {
    if (tempUnit === 'F') {
      return `${Math.round((c * 9) / 5 + 32)}°`;
    }
    return `${c}°`;
  };


  const getWindEmoji = (windSpeed: number): string => {
    if (windSpeed >= 40) return '🌪️';
    if (windSpeed >= 20) return '💨';
    return '🍃';
  };

  const weatherTheme = React.useMemo(() => {
    if (!weatherData) return 'Polar Mist';
    return mapWeatherCode(weatherData.conditionCode, weatherData.isDay).theme;
  }, [weatherData]);

  // Theme-aware color system
  // Desert Gold (Clear Sky) is always a warm/light theme — white text over orange
  // All other night/dark themes are listed explicitly
  const isDarkTheme =
    weatherTheme === 'Arctic Night' ||
    weatherTheme === 'Midnight Storm' ||
    weatherTheme === 'Aurora Dream' ||
    weatherTheme === 'Monsoon Slate' ||
    weatherTheme === 'Lush Forest' ||
    weatherTheme === 'Tropical Cyan' ||
    weatherTheme === 'Sunset Ember' ||
    weatherTheme === 'Polar Mist' ||
    (!weatherData?.isDay && weatherTheme !== 'Desert Gold');

  // Returns the Google Weather icon URL for a given WMO condition code,
  // automatically applying dark/light mode based on current theme.
  const getConditionIcon = (code: number, isDay: boolean = true): string =>
    getWeatherIconUrl(code, isDay, isDarkTheme, 'png');

  const mainTextColor = isDarkTheme ? '#FFF' : '#111';
  const cardBg = isDarkTheme ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.18)';
  const cardBorder = isDarkTheme ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.25)';
  const waveStroke = isDarkTheme ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.25)';

  // ========================================================
  // LOADING STATE
  // ========================================================
  if (isLoading && !weatherData) {
    return (
      <View style={styles.container}>
        <View style={styles.loaderArea}>
          <WeatherPreloader />
        </View>
      </View>
    );
  }

  if (!weatherData) return null;

  const hi = formattedTemp(weatherData.daily.maxTemp[0]);
  const lo = formattedTemp(weatherData.daily.minTemp[0]);



  return (
    <View style={styles.container}>

      {/* ========================================================
          GPS LOCATING FULL-SCREEN OVERLAY
          ======================================================== */}
      {isLocating && (
        <View style={styles.locatingOverlay}>
          <WeatherPreloader />
        </View>
      )}

      {/* ========================================================
          SEARCH TOGGLE (top-right corner)
          ======================================================== */}
      <TouchableOpacity
        style={[styles.searchToggle, { backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
        onPress={() => {
          weatherHaptics.selection();
          setIsSearchOpen(!isSearchOpen);
        }}
      >
        <Search size={16} color={isDarkTheme ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'} />
      </TouchableOpacity>

      {/* ========================================================
          SEARCH OVERLAY (appears when toggled)
          ======================================================== */}
      {isSearchOpen && (
        <View style={styles.searchOverlay}>
          {/* Search input row */}
          <View style={[styles.searchBox, { backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.85)' }]}>
            <Search size={14} color={isDarkTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} />
            <TextInput
              placeholder="Search city..."
              placeholderTextColor={isDarkTheme ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'}
              style={[styles.searchInput, { color: mainTextColor }]}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
            {isSearching && <ActivityIndicator size="small" color={mainTextColor} />}
          </View>

          {/* Use Current Location — always visible at top */}
          <TouchableOpacity style={styles.currentLocationRow} onPress={handleUseCurrentLocation} activeOpacity={0.75}>
            <View style={styles.currentLocationIcon}>
              <MapPin size={14} color="#22D3EE" />
            </View>
            <Text style={styles.currentLocationText}>
              {isLocating ? 'Detecting location…' : '📍  Use Current Location'}
            </Text>
          </TouchableOpacity>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <>
              <Text style={styles.searchSectionLabel}>RESULTS</Text>
              {searchResults.map((city) => (
                <View key={city.id} style={styles.searchResultRow}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => handleSelectCity(city)}>
                    <Text style={styles.searchResultText}>
                      {city.name}{city.admin1 ? `, ${city.admin1}` : ''}, {city.country}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleSaveCity(city)} style={styles.addCityBtn}>
                    <Text style={styles.plusText}>+</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* Saved Locations — shown when no search query and savedCities exists */}
          {searchQuery.length === 0 && savedCities.length > 0 && (
            <>
              <View style={styles.historyHeaderRow}>
                <MapPin size={11} color="#22D3EE" />
                <Text style={[styles.searchSectionLabel, { color: '#22D3EE', marginLeft: 6 }]}>SAVED LOCATIONS</Text>
              </View>
              {savedCities.map((city) => (
                <View key={city.id} style={styles.searchResultRow}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => handleSelectCity(city)}>
                    <Text style={styles.searchResultText}>
                      {city.name}{city.admin1 ? `, ${city.admin1}` : ''}, {city.country}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteCity(city.id)} style={styles.addCityBtn}>
                    <Trash2 size={13} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={{ height: 16 }} />
            </>
          )}

          {/* Search History — shown when no search query */}
          {searchQuery.length === 0 && searchHistory.length > 0 && (
            <>
              <View style={styles.historyHeaderRow}>
                <Clock size={11} color="rgba(255,255,255,0.4)" />
                <Text style={styles.searchSectionLabel}>RECENT SEARCHES</Text>
              </View>
              {searchHistory.map((city) => (
                <View key={city.id} style={styles.searchResultRow}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => handleSelectCity(city)}>
                    <Text style={styles.searchResultText}>
                      {city.name}{city.admin1 ? `, ${city.admin1}` : ''}, {city.country}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemoveHistory(city.id)} style={styles.addCityBtn}>
                    <X size={14} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </View>
      )}

      {/* ========================================================
          SCROLL VIEW WRAPPER — Handles scrolling naturally across form factors
          ======================================================== */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={mainTextColor}
            colors={[mainTextColor]}
            progressBackgroundColor={cardBg}
          />
        }
      >
        {/* ========================================================
            HERO SECTION — Centered, massive typography
            ======================================================== */}
        <View style={styles.hero}>
          <Text style={[styles.conditionLabel, { color: mainTextColor }]}>
            {weatherData.conditionText}
          </Text>
          <Text style={[styles.hugeTemp, { color: mainTextColor }]}>
            {formattedTemp(weatherData.temp)}
          </Text>
          <Text style={[styles.cityInfo, { color: mainTextColor }]}>
            {selectedCity.name}
          </Text>
          <Text style={[styles.weatherSubInfo, { color: mainTextColor }]}>
            {lo} / {hi} • {getWindEmoji(weatherData.windSpeed)} {formatWindSpeed(weatherData.windSpeed)}
          </Text>
        </View>

        {/* ========================================================
            WAVE GRAPH — Sitting below the hero
            ======================================================== */}
        <View style={styles.waveContainer}>
          {Platform.OS === 'web' ? (
            <View style={{ width: '100%', height: 100, position: 'relative', overflow: 'visible' }}>
              <svg viewBox="0 0 500 100" style={{ width: '100%', overflow: 'visible' }}>
                <path className="wave-glow" d="M0 50 Q60 10 120 50 T240 50 T360 50 T500 50" />
                <path className="wave-line" d="M0 50 Q60 10 120 50 T240 50 T360 50 T500 50" />
              </svg>
              <style dangerouslySetInnerHTML={{ __html: `
                .wave-glow {
                  fill: none;
                  stroke: #ffffff55;
                  stroke-width: 10;
                  stroke-linecap: round;
                  filter: blur(8px);
                  stroke-dasharray: 14 10;
                  animation: waveMove 2s linear infinite;
                }
                .wave-line {
                  fill: none;
                  stroke: #ffffff;
                  stroke-width: 3;
                  stroke-linecap: round;
                  stroke-dasharray: 14 10;
                  filter:
                    drop-shadow(0 0 10px rgba(255,255,255,0.9))
                    drop-shadow(0 0 20px rgba(255,255,255,0.4));
                  animation:
                    waveMove 2s linear infinite,
                    waveFloat 3s ease-in-out infinite;
                }
                @keyframes waveMove {
                  100% {
                    stroke-dashoffset: -48;
                  }
                }
                @keyframes waveFloat {
                  50% {
                    transform: translateY(-6px);
                  }
                }
              ` }} />
            </View>
          ) : (
            <View style={{ width: '100%', height: 100 }}>
              <WebView
                source={{ html: waveHtml }}
                style={{ backgroundColor: 'transparent' }}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                underlayColor="transparent"
                backgroundColor="transparent"
                scrollEnabled={false}
              />
            </View>
          )}
        </View>

        {/* ========================================================
            AI INSIGHT CARD — Glassmorphic card
            ======================================================== */}
        {wardrobe && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onNavigate('AI Insights')}
            style={[
              styles.aiCard,
              Platform.OS === 'web'
                ? {
                    background: cardBg,
                    backdropFilter: 'blur(25px)',
                    borderColor: cardBorder,
                  } as any
                : {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                  },
            ]}
          >
            <Text style={[styles.aiText, { color: mainTextColor }]} numberOfLines={3}>
              {wardrobe.summaryText}
            </Text>
          </TouchableOpacity>
        )}

        {/* ========================================================
            HOURLY FORECAST — All 24 hours scrollable horizontally
            ======================================================== */}
        <Text style={[styles.sectionTitle, { color: mainTextColor }]}>Hourly Forecast</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.forecastScroll}
          contentContainerStyle={styles.forecastScrollContent}
        >
          {weatherData.hourly.temp.slice(0, 24).map((t, idx) => {
            const timeLabel = weatherData.hourly.time[idx] || '00:00';
            const hour = parseInt(timeLabel.split(':')[0]) || 0;
            const formattedHour =
              hour === 0
                ? '12 AM'
                : hour === 12
                  ? '12 PM'
                  : hour > 12
                    ? `${hour - 12} PM`
                    : `${hour} AM`;

            return (
              <View
                key={idx}
                style={[
                  styles.forecastCard,
                  Platform.OS === 'web'
                    ? {
                        background: cardBg,
                        backdropFilter: 'blur(25px)',
                        borderColor: cardBorder,
                      } as any
                    : {
                        backgroundColor: cardBg,
                        borderColor: cardBorder,
                      },
                ]}
              >
                <Text style={[styles.forecastTime, { color: mainTextColor }]}>
                  {formattedHour}
                </Text>
                <Image
                  source={{ uri: getConditionIcon(weatherData.hourly.condition[idx], weatherData.isDay) }}
                  style={styles.forecastIcon}
                  resizeMode="contain"
                />
                <Text style={[styles.forecastTemp, { color: mainTextColor }]}>
                  {formattedTemp(t)}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* ========================================================
            7-DAY DAILY FORECAST — Scrollable Horizontally with Slide Indicator
            ======================================================== */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: mainTextColor, marginTop: 0 }]}>7-Day Forecast</Text>
          <Animated.View style={[styles.arrowContainer, animatedArrowStyle]}>
            <ChevronRight size={14} color={mainTextColor} style={{ opacity: 0.6 }} />
          </Animated.View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dailyScroll}
          contentContainerStyle={styles.dailyScrollContent}
        >
          {weatherData.daily.time.slice(0, 7).map((day, idx) => {
            const minT = formattedTemp(weatherData.daily.minTemp[idx]);
            const maxT = formattedTemp(weatherData.daily.maxTemp[idx]);
            const iconUrl = getConditionIcon(weatherData.daily.condition[idx], true);

            // day is formatted as "Mon, May 24"
            const parts = day ? day.split(', ') : [];
            const weekday = parts[0] || day || '';
            const calendarDate = parts[1] || '';

            return (
              <View
                key={idx}
                style={[
                  styles.dailyCard,
                  Platform.OS === 'web'
                    ? {
                        background: cardBg,
                        backdropFilter: 'blur(25px)',
                        borderColor: cardBorder,
                      } as any
                    : {
                        backgroundColor: cardBg,
                        borderColor: cardBorder,
                      },
                ]}
              >
                <Text style={[styles.dailyDay, { color: mainTextColor }]}>
                  {weekday}
                </Text>
                <Text style={[styles.dailyDate, { color: mainTextColor }]}>
                  {calendarDate}
                </Text>
                <Image
                  source={{ uri: iconUrl }}
                  style={styles.dailyIcon}
                  resizeMode="contain"
                />
                <Text style={[styles.dailyTemp, { color: mainTextColor }]}>
                  {minT} / {maxT}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </ScrollView>

      {/* Offline indicator */}
      {isOffline && (
        <View style={styles.offlinePill}>
          <Text style={styles.offlineText}>OFFLINE</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  loaderArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginTop: 20,
  },

  // ===== SEARCH =====
  searchToggle: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 18,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  searchOverlay: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 54 : 86) : 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(20, 18, 32, 0.78)',
    borderRadius: 20,
    padding: 14,
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  searchResultText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  },
  addCityBtn: {
    padding: 6,
  },
  plusText: {
    color: '#22D3EE',
    fontSize: 18,
    fontWeight: '700',
  },
  currentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: 2,
  },
  currentLocationIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationText: {
    color: '#22D3EE',
    fontSize: 13,
    fontWeight: '600',
  },
  searchSectionLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  // ===== GPS LOCATING OVERLAY =====
  locatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  // ===== HERO =====
  hero: {
    paddingTop: 100,
    alignItems: 'center',
    zIndex: 2,
  },
  conditionLabel: {
    fontSize: 22,
    fontWeight: '500',
  },
  hugeTemp: {
    fontSize: 100,
    fontWeight: '900',
    letterSpacing: -6,
    lineHeight: 110,
  },
  cityInfo: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 6,
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  weatherSubInfo: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    opacity: 0.6,
    textAlign: 'center',
  },

  // ===== SCROLL VIEW =====
  scrollContent: {
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginLeft: 24,
    marginTop: 20,
    marginBottom: 10,
    opacity: 0.5,
  },

  // ===== WAVE GRAPH =====
  waveContainer: {
    marginVertical: 10,
    width: '100%',
    opacity: 0.7,
  },

  // ===== AI INSIGHT CARD =====
  aiCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
  },
  aiText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },

  // ===== FORECAST SCROLL =====
  forecastScroll: {
    marginVertical: 5,
  },
  forecastScrollContent: {
    paddingLeft: 20,
    paddingRight: 40,
    flexDirection: 'row',
    gap: 10,
  },
  forecastCard: {
    width: 75,
    height: 110,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  forecastTime: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  forecastIcon: {
    width: 32,
    height: 32,
  },
  forecastTemp: {
    fontSize: 15,
    fontWeight: '700',
  },

  // ===== DAILY SCROLL =====
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 20,
    marginBottom: 10,
    gap: 6,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyScroll: {
    marginVertical: 5,
  },
  dailyScrollContent: {
    paddingLeft: 20,
    paddingRight: 40,
    flexDirection: 'row',
    gap: 10,
  },
  dailyCard: {
    width: 100,
    height: 135,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  dailyDay: {
    fontSize: 14,
    fontWeight: '700',
  },
  dailyDate: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.6,
    marginBottom: 4,
  },
  dailyIcon: {
    width: 36,
    height: 36,
    marginBottom: 4,
  },
  dailyTemp: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ===== OFFLINE =====
  offlinePill: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  offlineText: {
    color: '#FCA5A5',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
