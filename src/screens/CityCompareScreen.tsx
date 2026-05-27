import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useWeatherStore } from '../store/globalStore';
import { GlassCard } from '../components/common/GlassCard';
import { openMeteoService, CityInfo, WeatherData, AqiData } from '../services/openMeteo';
import { weatherHaptics } from '../sensors/useHaptics';
import { ArrowLeft, Search, Plus, MapPin, Sun, Moon, Wind, ShieldAlert } from 'lucide-react-native';

interface CityCompareScreenProps {
  onBack: () => void;
}

export const CityCompareScreen: React.FC<CityCompareScreenProps> = ({ onBack }) => {
  const { width: windowWidth } = useWindowDimensions();
  const width = Platform.OS === 'web' ? 312 : windowWidth;
  const { selectedCity, weatherData, aqiData, tempUnit } = useWeatherStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Second city state
  const [compareCity, setCompareCity] = useState<CityInfo | null>(null);
  const [compareWeather, setCompareWeather] = useState<WeatherData | null>(null);
  const [compareAqi, setCompareAqi] = useState<AqiData | null>(null);
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);

  // Initialize a default second city (e.g., Tokyo, Japan)
  useEffect(() => {
    handleSelectCompareCity({
      id: 'tokyo-35.6762-139.6503',
      name: 'Tokyo',
      country: 'Japan',
      latitude: 35.6762,
      longitude: 139.6503,
      admin1: 'Tokyo',
    });
  }, []);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const cities = await openMeteoService.searchCities(text);
      setSearchResults(cities);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCompareCity = async (city: CityInfo) => {
    weatherHaptics.selection();
    setSearchQuery('');
    setSearchResults([]);
    setCompareCity(city);
    setIsLoadingCompare(true);
    try {
      const { weather, aqi } = await openMeteoService.fetchWeather(city.latitude, city.longitude, city.name);
      setCompareWeather(weather);
      setCompareAqi(aqi);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCompare(false);
    }
  };

  const formattedTemp = (c: number) => {
    if (tempUnit === 'F') {
      return `${Math.round((c * 9) / 5 + 32)}°F`;
    }
    return `${c}°C`;
  };

  const getAqiColor = (aqi: number): string => {
    if (aqi > 150) return '#EF4444';
    if (aqi > 100) return '#F59E0B';
    return '#22C55E';
  };

  const getWindEmoji = (windSpeed: number): string => {
    if (windSpeed >= 40) return '🌪️';
    if (windSpeed >= 20) return '💨';
    return '🍃';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header back strip */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CITY COMPARE</Text>
      </View>

      {/* ========================================================
          SEARCH BAR FOR SECOND CITY
          ======================================================== */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search color="rgba(255, 255, 255, 0.4)" size={20} />
          <TextInput
            placeholder="Search compare city..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {isSearching && <ActivityIndicator size="small" color="#A855F7" />}
        </View>

        {searchResults.length > 0 && (
          <View style={styles.searchResultsPanel}>
            {searchResults.map((city) => (
              <TouchableOpacity
                key={city.id}
                style={styles.searchResultRow}
                onPress={() => handleSelectCompareCity(city)}
              >
                <Text style={styles.searchResultText}>{city.name}, {city.country}</Text>
                <Plus color="#A855F7" size={16} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {weatherData && aqiData && compareWeather && compareAqi && compareCity && (
        <View>
          {/* ========================================================
              SPLIT HEADER CARDS
              ======================================================== */}
          <View style={styles.splitCardsRow}>
            {/* Primary City Card */}
            <View style={styles.splitCardItem}>
              <GlassCard borderGlowColor="rgba(255,255,255,0.06)">
                <Text style={styles.cardIndicator}>PRIMARY</Text>
                <Text style={styles.cityName}>{selectedCity.name}</Text>
                <Text style={styles.tempNumber}>{formattedTemp(weatherData.temp)}</Text>
                <Text style={styles.conditionText}>{weatherData.conditionText}</Text>
              </GlassCard>
            </View>

            {/* Compare City Card */}
            <View style={styles.splitCardItem}>
              <GlassCard borderGlowColor="rgba(168, 85, 247, 0.22)">
                <Text style={[styles.cardIndicator, { color: '#A855F7' }]}>COMPARE</Text>
                <Text style={styles.cityName}>{compareCity.name}</Text>
                {isLoadingCompare ? (
                  <View style={styles.cardLoader}>
                    <ActivityIndicator size="small" color="#A855F7" />
                  </View>
                ) : (
                  <View>
                    <Text style={styles.tempNumber}>{formattedTemp(compareWeather.temp)}</Text>
                    <Text style={styles.conditionText}>{compareWeather.conditionText}</Text>
                  </View>
                )}
              </GlassCard>
            </View>
          </View>

          {/* ========================================================
              LIVE TEMPERATURE RACE ANIMATION
              ======================================================= */}
          <Text style={styles.sectionTitle}>LIVE TEMPERATURE RACE</Text>
          <GlassCard style={styles.marginGap} borderGlowColor="rgba(255,255,255,0.08)">
            <View style={styles.raceRow}>
              <Text style={styles.raceName}>{selectedCity.name}</Text>
              <View style={styles.raceBarBg}>
                {/* Clamp at max 45 degrees */}
                <View
                  style={[
                    styles.raceBarFill,
                    {
                      width: `${Math.max(10, Math.min(100, (weatherData.temp / 45) * 100))}%`,
                      backgroundColor: '#A855F7',
                    },
                  ]}
                />
              </View>
              <Text style={styles.raceVal}>{formattedTemp(weatherData.temp)}</Text>
            </View>

            <View style={[styles.raceRow, { marginTop: 14 }]}>
              <Text style={styles.raceName}>{compareCity.name}</Text>
              <View style={styles.raceBarBg}>
                <View
                  style={[
                    styles.raceBarFill,
                    {
                      width: `${Math.max(10, Math.min(100, (compareWeather.temp / 45) * 100))}%`,
                      backgroundColor: '#22D3EE',
                    },
                  ]}
                />
              </View>
              <Text style={styles.raceVal}>{formattedTemp(compareWeather.temp)}</Text>
            </View>
          </GlassCard>

          {/* ========================================================
              METRICS COMPARATIVE SHEET GRID
              ======================================================== */}
          <Text style={[styles.sectionTitle, styles.marginGap]}>CLIMATE METRICS</Text>
          <View style={styles.marginGap}>
            <GlassCard borderGlowColor="rgba(255,255,255,0.06)">
              {/* AQI COMPARATIVE */}
              <View style={styles.compareRow}>
                <View style={styles.compareCol}>
                  <Text style={[styles.compareValue, { color: getAqiColor(aqiData.aqi) }]}>{aqiData.aqi}</Text>
                  <Text style={styles.compareLabel}>US-AQI</Text>
                </View>
                <View style={styles.compareCenterCol}>
                  <ShieldAlert size={16} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.compareTitle}>ENVIRONMENT AQI</Text>
                </View>
                <View style={styles.compareCol}>
                  <Text style={[styles.compareValue, { color: getAqiColor(compareAqi.aqi) }]}>{compareAqi.aqi}</Text>
                  <Text style={styles.compareLabel}>US-AQI</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* WIND SPEED */}
              <View style={styles.compareRow}>
                <View style={styles.compareCol}>
                  <Text style={styles.compareValue}>{weatherData.windSpeed} km/h {getWindEmoji(weatherData.windSpeed)}</Text>
                  <Text style={styles.compareLabel}>Velocity</Text>
                </View>
                <View style={styles.compareCenterCol}>
                  <Wind size={16} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.compareTitle}>WIND VELOCITY</Text>
                </View>
                <View style={styles.compareCol}>
                  <Text style={styles.compareValue}>{compareWeather.windSpeed} km/h {getWindEmoji(compareWeather.windSpeed)}</Text>
                  <Text style={styles.compareLabel}>Velocity</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* SUNRISE */}
              <View style={styles.compareRow}>
                <View style={styles.compareCol}>
                  <Text style={styles.compareValue}>{weatherData.sunrise}</Text>
                  <Text style={styles.compareLabel}>Sunrise</Text>
                </View>
                <View style={styles.compareCenterCol}>
                  <Sun size={16} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.compareTitle}>SUNRISE TILES</Text>
                </View>
                <View style={styles.compareCol}>
                  <Text style={styles.compareValue}>{compareWeather.sunrise}</Text>
                  <Text style={styles.compareLabel}>Sunrise</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* SUNSET */}
              <View style={styles.compareRow}>
                <View style={styles.compareCol}>
                  <Text style={styles.compareValue}>{weatherData.sunset}</Text>
                  <Text style={styles.compareLabel}>Sunset</Text>
                </View>
                <View style={styles.compareCenterCol}>
                  <Moon size={16} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.compareTitle}>SUNSET TILES</Text>
                </View>
                <View style={styles.compareCol}>
                  <Text style={styles.compareValue}>{compareWeather.sunset}</Text>
                  <Text style={styles.compareLabel}>Sunset</Text>
                </View>
              </View>
            </GlassCard>
          </View>
        </View>
      )}
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
  searchSection: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    marginLeft: 10,
  },
  searchResultsPanel: {
    backgroundColor: 'rgba(15, 12, 35, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    marginTop: 8,
    overflow: 'hidden',
    zIndex: 10,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchResultText: {
    color: '#FFF',
    fontSize: 14,
  },
  splitCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  splitCardItem: {
    width: '48%',
  },
  cardIndicator: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  cityName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tempNumber: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '300',
    marginVertical: 4,
  },
  conditionText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
  },
  cardLoader: {
    height: 60,
    justifyContent: 'center',
  },
  sectionTitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 20,
  },
  marginGap: {
    marginTop: 14,
  },
  raceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  raceName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    width: '28%',
  },
  raceBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    flex: 1,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  raceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  raceVal: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    width: '15%',
    textAlign: 'right',
  },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  compareCol: {
    width: '32%',
    alignItems: 'center',
  },
  compareCenterCol: {
    width: '36%',
    alignItems: 'center',
  },
  compareValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  compareLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  compareTitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 4,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 14,
  },
});
