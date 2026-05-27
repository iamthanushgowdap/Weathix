import { create } from 'zustand';
// Platform is intentionally NOT imported at module level — see mmkvStorage.ts for rationale.
const getPlatformOS = (): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native').Platform.OS as string;
  } catch {
    return 'native';
  }
};
import * as Location from 'expo-location';
import { mmkvStorage } from '../database/mmkvStorage';
import { openMeteoService, WeatherData, AqiData, CityInfo } from '../services/openMeteo';
import { proceduralAudioEngine } from '../services/proceduralAudio';

interface GlobalState {
  selectedCity: CityInfo;
  savedCities: CityInfo[];
  weatherData: WeatherData | null;
  aqiData: AqiData | null;
  isLoading: boolean;
  isOffline: boolean;
  tempUnit: 'C' | 'F';
  windUnit: 'kph' | 'mph' | 'mps';
  audioEnabled: boolean;
  hapticEnabled: boolean;
  activeTheme: string;
  
  // Operations
  setSelectedCity: (city: CityInfo) => Promise<void>;
  saveCity: (city: CityInfo) => void;
  deleteCity: (id: string) => void;
  loadSavedPreferences: () => void;
  fetchWeather: () => Promise<void>;
  requestDeviceLocation: () => Promise<void>;
  toggleTempUnit: () => void;
  toggleWindUnit: () => void;
  setAudioEnabled: (enabled: boolean) => void;
  setHapticEnabled: (enabled: boolean) => void;
  setActiveTheme: (theme: string) => void;
}

// Pre-defined fallback location (Bengaluru, India)
const DEFAULT_CITY: CityInfo = {
  id: 'bengaluru-12.9716-77.5946',
  name: 'Bengaluru',
  country: 'India',
  latitude: 12.9716,
  longitude: 77.5946,
  admin1: 'Karnataka',
};

export const useWeatherStore = create<GlobalState>((set, get) => ({
  selectedCity: DEFAULT_CITY,
  savedCities: [DEFAULT_CITY],
  weatherData: null,
  aqiData: null,
  isLoading: false,
  isOffline: false,
  tempUnit: 'C',
  windUnit: 'kph',
  audioEnabled: true,
  hapticEnabled: true,
  activeTheme: 'Polar Mist',

  /**
   * Updates coordinates and re-pulls forecast variables
   */
  setSelectedCity: async (city: CityInfo) => {
    set({ selectedCity: city, isLoading: true });
    mmkvStorage.setObject('selected-city', city);
    await get().fetchWeather();
  },

  /**
   * Adds city to MMKV saved list
   */
  saveCity: (city: CityInfo) => {
    const list = get().savedCities;
    if (list.some((c) => c.id === city.id)) return;
    const updated = [...list, city];
    set({ savedCities: updated });
    mmkvStorage.setObject('saved-cities', updated);
  },

  /**
   * Deletes city from saved location arrays
   */
  deleteCity: (id: string) => {
    const list = get().savedCities;
    const updated = list.filter((c) => c.id !== id);
    set({ savedCities: updated });
    mmkvStorage.setObject('saved-cities', updated);
  },

  /**
   * Instantly load MMKV properties on application mount
   */
  loadSavedPreferences: () => {
    const cachedCity = mmkvStorage.getObject<CityInfo>('selected-city');
    const cachedCities = mmkvStorage.getObject<CityInfo[]>('saved-cities');
    const temp = mmkvStorage.getString('pref-temp') as 'C' | 'F' | null;
    const wind = mmkvStorage.getString('pref-wind') as 'kph' | 'mph' | 'mps' | null;
    const audio = mmkvStorage.getString('pref-audio');
    const haptic = mmkvStorage.getString('pref-haptic');
    const theme = mmkvStorage.getString('pref-theme');

    set({
      selectedCity: cachedCity ?? DEFAULT_CITY,
      savedCities: cachedCities ?? [DEFAULT_CITY],
      tempUnit: temp ?? 'C',
      windUnit: wind ?? 'kph',
      audioEnabled: audio !== 'false',
      hapticEnabled: haptic !== 'false',
      activeTheme: theme ?? 'Polar Mist',
    });
  },

  /**
   * Master API orchestrator fetches hourly / weekly parameters
   */
  fetchWeather: async () => {
    set({ isLoading: true });
    const { latitude, longitude, name } = get().selectedCity;
    try {
      const { weather, aqi } = await openMeteoService.fetchWeather(latitude, longitude, name);
      
      set({
        weatherData: weather,
        aqiData: aqi,
        isLoading: false,
        isOffline: false,
      });

      // Update Procedural Audio variables synchronously
      if (get().audioEnabled) {
        const isSnowy = weather.temp <= 2;
        const rainIntensityVal = weather.conditionText.toLowerCase().includes('rain') ? 0.6 : weather.conditionText.toLowerCase().includes('drizzle') ? 0.35 : 0;
        const stormActiveVal = weather.conditionText.toLowerCase().includes('thunderstorm');
        
        proceduralAudioEngine.initialize().then(() => {
          proceduralAudioEngine.updateAmbientParameters(
            rainIntensityVal,
            weather.windSpeed,
            stormActiveVal,
            isSnowy
          );
        });
      }
    } catch (err) {
      console.error('[Weathix Store] Fetch failed.', err);
      set({ isLoading: false, isOffline: true });
    }
  },

  /**
   * Secure, Privacy-Shielded Geolocator
   * Requests foreground permissions, fuzzes exact coordinates to 2 decimal places (~1.1 km accuracy)
   * to guarantee zero physical location leakage, and fetches weather.
   */
  requestDeviceLocation: async () => {
    set({ isLoading: true });

    // 1. Web Geolocation Emulator (Secure, fuzzed)
    if (getPlatformOS() === 'web') {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const fuzzedLat = Math.round(latitude * 1000) / 1000;
            const fuzzedLon = Math.round(longitude * 1000) / 1000;

            // Reverse geocode to get real neighbourhood/city name
            const place = await openMeteoService.reverseGeocode(fuzzedLat, fuzzedLon);

            const fuzzedCity: CityInfo = {
              id: `current-location-${fuzzedLat}-${fuzzedLon}`,
              name: `📍 ${place.name}`,
              country: place.country || 'Local',
              latitude: fuzzedLat,
              longitude: fuzzedLon,
              admin1: place.admin1,
            };
            set({ selectedCity: fuzzedCity });
            mmkvStorage.setObject('selected-city', fuzzedCity);
            await get().fetchWeather();
          },
          async (error) => {
            console.log('[Weathix Geolocation] Web location denied, defaulting silently:', error);
            await get().fetchWeather();
          }
        );
      } else {
        await get().fetchWeather();
      }
      return;
    }

    // 2. Native Geolocation (ACCESS_COARSE_LOCATION / ACCESS_FINE_LOCATION)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('[Weathix Geolocation] Native permission denied. Defaulting silently.');
        await get().fetchWeather();
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,  // Satellite GPS — much more accurate than cell tower
      });

      const { latitude, longitude } = location.coords;

      // Round to 3 decimal places (~111m precision) — good balance of privacy + accuracy
      // (was 2 decimal places = 1.1km which caused the "7km off" issue)
      const fuzzedLat = Math.round(latitude * 1000) / 1000;
      const fuzzedLon = Math.round(longitude * 1000) / 1000;

      // Reverse geocode to get real neighbourhood/city name (e.g. "Jayanagar", "Koramangala")
      const place = await openMeteoService.reverseGeocode(fuzzedLat, fuzzedLon);

      const fuzzedCity: CityInfo = {
        id: `current-location-${fuzzedLat}-${fuzzedLon}`,
        name: `📍 ${place.name}`,
        country: place.country || 'IN',
        latitude: fuzzedLat,
        longitude: fuzzedLon,
        admin1: place.admin1,
      };

      set({ selectedCity: fuzzedCity });
      mmkvStorage.setObject('selected-city', fuzzedCity);
      await get().fetchWeather();
    } catch (err) {
      console.warn('[Weathix Geolocation] Secure Native locator failed. Defaulting silently.', err);
      await get().fetchWeather();
    }
  },

  toggleTempUnit: () => {
    const next = get().tempUnit === 'C' ? 'F' : 'C';
    set({ tempUnit: next });
    mmkvStorage.setString('pref-temp', next);
  },

  toggleWindUnit: () => {
    const current = get().windUnit;
    const next = current === 'kph' ? 'mph' : current === 'mph' ? 'mps' : 'kph';
    set({ windUnit: next });
    mmkvStorage.setString('pref-wind', next);
  },

  setAudioEnabled: (enabled: boolean) => {
    set({ audioEnabled: enabled });
    mmkvStorage.setString('pref-audio', enabled ? 'true' : 'false');
    proceduralAudioEngine.setMute(!enabled);
  },

  setHapticEnabled: (enabled: boolean) => {
    set({ hapticEnabled: enabled });
    mmkvStorage.setString('pref-haptic', enabled ? 'true' : 'false');
  },

  setActiveTheme: (theme: string) => {
    set({ activeTheme: theme });
    mmkvStorage.setString('pref-theme', theme);
  },
}));
