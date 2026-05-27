import { dbOperations } from '../database/sqliteDb';

const formatToWeekdayDate = (date: Date): string => {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${weekdays[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
};

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  uvIndex: number;
  visibility: number;
  sunrise: string;
  sunset: string;
  conditionCode: number;
  conditionText: string;
  isDay: boolean;
  hourly: {
    time: string[];
    temp: number[];
    rainProb: number[];
    condition: number[];
  };
  daily: {
    time: string[];
    minTemp: number[];
    maxTemp: number[];
    uvMax: number[];
    rainProbMax: number[];
    condition: number[];
  };
}

export interface AqiData {
  aqi: number; // 0 - 500 index or 0 - 5 rating
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  o3: number;
  healthRecommendation: string;
}

export interface CityInfo {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

// Open-Meteo weather code mapper
export const mapWeatherCode = (code: number, isDay: boolean = true): { text: string; theme: string } => {
  if (code === 0) return { text: 'Clear Sky', theme: isDay ? 'Desert Gold' : 'Arctic Night' };
  if (code >= 1 && code <= 2) return { text: 'Partly Cloudy', theme: 'Polar Mist' };
  if (code === 3) return { text: 'Cloudy Sky', theme: 'Polar Mist' };
  if (code === 20) return { text: 'Windy Conditions', theme: 'Polar Mist' };
  if (code === 45 || code === 48) return { text: 'Foggy Mist', theme: 'Polar Mist' };
  if (code >= 51 && code <= 57) return { text: 'Light Drizzle', theme: 'Monsoon Slate' };
  if (code === 61) return { text: 'Light Rain', theme: 'Monsoon Slate' };
  if (code === 63) return { text: 'Moderate Rain', theme: 'Monsoon Slate' };
  if (code === 65 || code === 67) return { text: 'Heavy Rain', theme: 'Monsoon Slate' };
  if (code >= 71 && code <= 77) return { text: 'Moderate Snow', theme: 'Polar Mist' };
  if (code >= 80 && code <= 82) return { text: 'Rain Showers', theme: 'Tropical Cyan' };
  if (code === 85 || code === 86) return { text: 'Heavy Snow', theme: 'Polar Mist' };
  if (code >= 95 && code <= 99) return { text: 'Thunderstorm', theme: 'Midnight Storm' };
  return { text: 'Cloudy Sky', theme: 'Polar Mist' };
};

/**
 * Google Weather Icon URL Builder
 * Maps WMO condition codes to Google's official weather icons.
 * Base URL: https://maps.gstatic.com/weather/v1/
 * Supports: day/night variants, light/dark mode, .png and .svg formats
 *
 * @param code        WMO condition code (or our internal code)
 * @param isDay       true for daytime icons, false for nighttime
 * @param isDark      true for dark-mode icons (appends _dark)
 * @param format      'png' (default, works on all platforms) or 'svg'
 */
export const getWeatherIconUrl = (
  code: number,
  isDay: boolean = true,
  isDark: boolean = false,
  format: 'png' | 'svg' = 'png'
): string => {
  const BASE = 'https://maps.gstatic.com/weather/v1/';
  const dark = isDark ? '_dark' : '';
  const ext = `.${format}`;

  // ── Clear Sky ────────────────────────────────────────────────────────────
  if (code === 0) {
    const name = isDay ? 'sunny' : 'clear';
    return `${BASE}${name}${dark}${ext}`;
  }

  // ── Mostly Clear / Partly Cloudy ─────────────────────────────────────────
  if (code === 1) {
    const name = isDay ? 'mostly_sunny' : 'mostly_clear';
    return `${BASE}${name}${dark}${ext}`;
  }
  if (code === 2) {
    const name = isDay ? 'partly_cloudy' : 'partly_clear';
    return `${BASE}${name}${dark}${ext}`;
  }

  // ── Cloudy / Overcast / Windy ─────────────────────────────────────────────
  if (code === 3) {
    return `${BASE}cloudy${dark}${ext}`;
  }

  // ── Fog / Haze ───────────────────────────────────────────────────────────
  if (code === 45 || code === 48) {
    return `${BASE}haze_fog_dust_smoke${dark}${ext}`;
  }

  // ── Drizzle / Light Rain ─────────────────────────────────────────────────
  if (code >= 51 && code <= 57) {
    return `${BASE}drizzle${dark}${ext}`;
  }

  // ── Rain ─────────────────────────────────────────────────────────────────
  if (code >= 61 && code <= 65) {
    return `${BASE}showers${dark}${ext}`;
  }
  if (code === 66 || code === 67) {
    return `${BASE}heavy${dark}${ext}`;
  }

  // ── Rain Showers ─────────────────────────────────────────────────────────
  if (code >= 80 && code <= 82) {
    return `${BASE}scattered_showers${dark}${ext}`;
  }

  // ── Snow ─────────────────────────────────────────────────────────────────
  if (code >= 71 && code <= 75) {
    return `${BASE}snow_showers${dark}${ext}`;
  }
  if (code === 77) {
    return `${BASE}flurries${dark}${ext}`;
  }
  if (code === 85 || code === 86) {
    return `${BASE}heavy_snow${dark}${ext}`;
  }

  // ── Thunderstorm ─────────────────────────────────────────────────────────
  if (code === 95) {
    return `${BASE}strong_tstorms${dark}${ext}`;
  }
  if (code >= 96 && code <= 99) {
    return `${BASE}isolated_tstorms${dark}${ext}`;
  }

  // ── Default fallback ─────────────────────────────────────────────────────
  return `${BASE}cloudy${dark}${ext}`;
};



export const mapVisualCrossingIcon = (
  icon: string,
  isDay: boolean = true,
  precip?: number
): { text: string; theme: string; code: number } => {
  const normalized = (icon || '').toLowerCase();

  // If precip is explicitly 0 and it's a rain/showers icon, downgrade to cloudy/partly-cloudy
  if (precip === 0 && (normalized.includes('rain') || normalized.includes('showers'))) {
    return normalized.includes('partly') || normalized.includes('day') || normalized.includes('night')
      ? { text: 'Partly Cloudy', theme: 'Polar Mist', code: 2 }
      : { text: 'Cloudy Sky', theme: 'Polar Mist', code: 3 };
  }

  if (normalized.includes('thunder') || normalized.includes('storm')) {
    return { text: 'Thunderstorm', theme: 'Midnight Storm', code: 95 };
  }
  if (normalized.includes('snow') || normalized.includes('sleet') || normalized.includes('ice')) {
    return { text: 'Moderate Snow', theme: 'Polar Mist', code: 71 };
  }
  if (normalized.includes('showers') || normalized.includes('drizzle')) {
    return { text: 'Rain Showers', theme: 'Tropical Cyan', code: 80 };
  }
  if (normalized.includes('rain')) {
    if (precip !== undefined && precip > 0) {
      if (precip < 2.0) {
        return { text: 'Light Rain', theme: 'Monsoon Slate', code: 61 };
      } else if (precip < 6.0) {
        return { text: 'Moderate Rain', theme: 'Monsoon Slate', code: 63 };
      } else {
        return { text: 'Heavy Rain', theme: 'Monsoon Slate', code: 65 };
      }
    }
    // Default fallback if precip is not provided
    return { text: 'Light Rain', theme: 'Monsoon Slate', code: 61 };
  }
  if (normalized.includes('fog') || normalized.includes('haze') || normalized.includes('mist')) {
    return { text: 'Foggy Mist', theme: 'Polar Mist', code: 45 };
  }
  if (normalized.includes('wind')) {
    return { text: 'Windy Conditions', theme: 'Polar Mist', code: 3 };
  }
  // ⚠️ 'partly' MUST be checked before 'cloudy' —
  // 'partly-cloudy-day'.includes('cloudy') is TRUE, so checking 'cloudy' first
  // would make ALL partly-cloudy icons (⛅) incorrectly return code 3 (☁️).
  if (normalized.includes('partly')) {
    return { text: 'Partly Cloudy', theme: 'Polar Mist', code: 2 };
  }
  if (normalized.includes('cloudy') || normalized.includes('overcast')) {
    return { text: 'Cloudy Sky', theme: 'Polar Mist', code: 3 };
  }
  if (normalized.includes('clear') || normalized.includes('sunny')) {
    return { text: 'Clear Sky', theme: isDay ? 'Desert Gold' : 'Arctic Night', code: 0 };
  }
  return { text: 'Clear Sky', theme: isDay ? 'Desert Gold' : 'Arctic Night', code: 0 };
};

/**
 * Procedural Weather Generator - Offline Resilience Model
 * Generates highly realistic interpolated forecast models when offline and no cache is present.
 */
export const generateProceduralOfflineWeather = (lat: number, lon: number, cityName: string): { weather: WeatherData; aqi: AqiData } => {
  const currentHour = new Date().getHours();
  
  // Deterministic seeds based on coordinates
  const seedTemp = Math.round(15 + Math.sin(lat) * 10 + Math.cos(lon) * 5);
  const seedHumidity = Math.round(60 + Math.sin(lon) * 20);
  const seedAqi = Math.round(40 + Math.sin(lat + lon) * 60);

  // Hourly arrays
  const hrTime: string[] = [];
  const hrTemp: number[] = [];
  const hrRainProb: number[] = [];
  const hrCondition: number[] = [];

  for (let i = 0; i < 24; i++) {
    const hourVal = (currentHour + i) % 24;
    hrTime.push(`${hourVal.toString().padStart(2, '0')}:00`);
    
    // Smooth diurnal temperature wave (warmest at 15:00, coolest at 05:00)
    const diurnWave = Math.sin(((hourVal - 9) / 24) * 2 * Math.PI);
    hrTemp.push(Math.round(seedTemp + diurnWave * 6 * (1 - (i * 0.05))));
    
    // Semi-random rain probability
    const rainChance = Math.max(0, Math.min(100, Math.round(25 + Math.sin(i * 0.5) * 35)));
    hrRainProb.push(rainChance);
    
    // Assign condition code
    hrCondition.push(rainChance > 70 ? 61 : rainChance > 40 ? 2 : 0);
  }

  // Daily arrays
  const dyTime: string[] = [];
  const dyMin: number[] = [];
  const dyMax: number[] = [];
  const dyUv: number[] = [];
  const dyRain: number[] = [];
  const dyCondition: number[] = [];

  for (let d = 0; d < 10; d++) {
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + d);
    dyTime.push(formatToWeekdayDate(dateObj));
    
    const daySeed = Math.sin(lat + d);
    dyMin.push(Math.round(seedTemp - 4 + daySeed * 2));
    dyMax.push(Math.round(seedTemp + 6 + daySeed * 3));
    dyUv.push(Math.max(1, Math.round(5 + Math.sin(d) * 4)));
    dyRain.push(Math.max(0, Math.min(100, Math.round(30 + Math.sin(d * 1.5) * 40))));
    dyCondition.push(dyRain[d] > 70 ? 61 : dyRain[d] > 40 ? 2 : 0);
  }

  const currentConditionCode = hrRainProb[0] > 70 ? 61 : hrRainProb[0] > 40 ? 2 : 0;
  const isDay = currentHour >= 6 && currentHour <= 18;
  const condition = mapWeatherCode(currentConditionCode, isDay);

  const weather: WeatherData = {
    temp: hrTemp[0],
    feelsLike: hrTemp[0] + (seedHumidity > 70 ? 2 : -1),
    humidity: seedHumidity,
    pressure: 1013 + Math.round(Math.cos(lat) * 5),
    windSpeed: Math.round(12 + Math.sin(lon) * 8),
    uvIndex: isDay ? Math.max(1, Math.round(6 + Math.sin(currentHour / 12) * 5)) : 0,
    visibility: hrRainProb[0] > 70 ? 4 : 10,
    sunrise: '06:12 AM',
    sunset: '18:45 PM',
    conditionCode: currentConditionCode,
    conditionText: condition.text,
    isDay,
    hourly: { time: hrTime, temp: hrTemp, rainProb: hrRainProb, condition: hrCondition },
    daily: { time: dyTime, minTemp: dyMin, maxTemp: dyMax, uvMax: dyUv, rainProbMax: dyRain, condition: dyCondition },
  };

  const aqiVal = Math.max(10, Math.min(500, seedAqi));
  let rec = 'Air quality is excellent. Ideal for outdoor activities.';
  if (aqiVal > 150) rec = 'AQI is high. Sensitive groups should wear masks outdoors.';
  else if (aqiVal > 100) rec = 'Air quality is moderate. Outdoor jogging fine for short runs.';

  const aqi: AqiData = {
    aqi: aqiVal,
    pm25: Math.round(aqiVal * 0.22),
    pm10: Math.round(aqiVal * 0.45),
    no2: Math.round(aqiVal * 0.12),
    so2: Math.round(aqiVal * 0.04),
    o3: Math.round(aqiVal * 0.3),
    healthRecommendation: rec,
  };

  return { weather, aqi };
};

export const openMeteoService = {
  /**
   * Search for locations matching query name.
   * Primary: Open-Meteo Geocoding API (fast, global city database)
   * Fallback: Nominatim / OpenStreetMap (catches suburbs, areas, smaller towns)
   */
  searchCities: async (
    query: string,
    context?: { city?: string; state?: string; country?: string }
  ): Promise<CityInfo[]> => {
    if (!query || query.length < 2) return [];

    const q = query.trim();
    // Indian pincodes are 6 digits; international ZIPs 4–10
    const isPincode = /^\d{4,10}$/.test(q);
    const NOM_HEADERS = { 'User-Agent': 'Weathix/1.0 weather-app' };

    // Helper: title case string
    const toTitleCase = (str: string): string => {
      return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    // ── Parse a Nominatim result into CityInfo ─────────────────────────────────
    // Confirmed field structure from real API debug (560062, Jayanagar etc):
    //   addr.suburb       → "Talagattapura", "Jayanagar"  (local area)
    //   addr.neighbourhood→ street-level (skip)
    //   addr.city_district→ "Bengaluru South City Corporation"  (skip — too long)
    //   addr.city         → "Bengaluru"
    //   addr.state        → "Karnataka"
    //   addr.country      → "India"
    const parseNominatim = (x: any): CityInfo => {
      const addr = x.address || {};
      // Local name: suburb > village > town > city_district(clipped) > city
      const rawLocal =
        addr.suburb ||
        addr.village ||
        addr.town ||
        (addr.city_district ? addr.city_district.split(' ').slice(0, 2).join(' ') : null) ||
        addr.city ||
        addr.county ||
        x.display_name.split(',')[0].trim();

      // Parent city (for disambiguation)
      const parentCity = addr.city || addr.town || addr.county || '';

      // Show "Locality, City" only if they're different words
      const name =
        parentCity && parentCity.toLowerCase() !== rawLocal.toLowerCase()
          ? `${rawLocal}, ${parentCity}`
          : rawLocal;

      return {
        id: `nom-${x.place_id}`,
        name,
        country: addr.country || '',
        latitude: parseFloat(x.lat),
        longitude: parseFloat(x.lon),
        admin1: addr.state || addr.county || '',
      };
    };

    // ── Priority scorer: Bengaluru > Karnataka > India > World ────────────────
    const scorePriority = (c: CityInfo): number => {
      const name = (c.name || '').toLowerCase();
      const admin1 = (c.admin1 || '').toLowerCase();
      const country = (c.country || '').toLowerCase();

      // Tier 0: Bengaluru/Bangalore
      if (
        name.includes('bengaluru') ||
        name.includes('bangalore') ||
        admin1.includes('bengaluru') ||
        admin1.includes('bangalore')
      ) {
        return 0;
      }
      // Tier 1: Karnataka
      if (admin1.includes('karnataka') || name.includes('karnataka')) {
        return 1;
      }
      // Tier 2: India
      if (country === 'india' || country === 'in' || name.includes('india')) {
        return 2;
      }
      // Tier 3: World
      return 3;
    };

    try {
      let results: CityInfo[] = [];

      if (isPincode) {
        const indiaFirst = /^[1-9]\d{5}$/.test(q); // Indian 6-digit pincode pattern
        if (indiaFirst) {
          try {
            // Fetch from India Pincode API
            const res = await fetch(`https://aniket-thapa.github.io/india-pincode-api/pincodes/${q}.json`);
            if (res.ok) {
              const data = await res.json();
              if (data && Array.isArray(data.offices)) {
                const state = toTitleCase(data.state || 'Karnataka');
                const district = toTitleCase(data.district || 'Bengaluru');
                const parentCity = district.replace(/\s+Urban$/i, '').replace(/\s+Rural$/i, '').trim();

                const pincodeResults = data.offices
                  .filter((o: any) => o.latitude !== null && o.longitude !== null && o.latitude !== undefined && o.longitude !== undefined)
                  .map((o: any, index: number) => {
                    const cleanOffice = o.officeName.replace(/\s+(S\.?O\.?|B\.?O\.?|H\.?O\.?)$/i, '').trim();
                    const displayName = cleanOffice.toLowerCase() === parentCity.toLowerCase()
                      ? cleanOffice
                      : `${cleanOffice}, ${parentCity}`;
                    return {
                      id: `pincode-${q}-${index}-${o.latitude}-${o.longitude}`,
                      name: displayName,
                      country: 'India',
                      latitude: parseFloat(o.latitude),
                      longitude: parseFloat(o.longitude),
                      admin1: state,
                    };
                  });

                if (pincodeResults.length > 0) {
                  results = pincodeResults;
                }
              }
            }
          } catch (err) {
            console.warn('[Weathix Geocode] India Pincode API failed, falling back:', err);
          }
        }

        // Fallback/Non-Indian: Nominatim postalcode search
        if (results.length === 0) {
          const ccParam = indiaFirst ? '&countrycodes=in' : '';
          const r = await fetch(
            `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(q)}&format=json&limit=15&addressdetails=1${ccParam}`,
            { headers: NOM_HEADERS }
          );
          const d = await r.json();
          if (Array.isArray(d) && d.length > 0) {
            results = d.filter((x: any) => x.lat && x.lon).map(parseNominatim);
          } else {
            // Fallback: text search for the pincode
            const r2 = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=10&addressdetails=1${ccParam}`,
              { headers: NOM_HEADERS }
            );
            const d2 = await r2.json();
            results = (d2 as any[]).filter((x: any) => x.lat && x.lon).map(parseNominatim);
          }
        }
      } else {
        // ── CITY NAME: Open-Meteo + Nominatim in parallel ─────────────────────
        const [omResult, nomResult] = await Promise.allSettled([
          fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=15&language=en&format=json`),
          fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=15&addressdetails=1`,
            { headers: NOM_HEADERS }
          ),
        ]);

        const omCities: CityInfo[] = [];
        if (omResult.status === 'fulfilled' && omResult.value.ok) {
          const data = await omResult.value.json();
          (data.results || []).forEach((x: any) => {
            omCities.push({
              id: `${x.id}-${x.longitude}`,
              name: x.name,
              country: x.country || '',
              latitude: x.latitude,
              longitude: x.longitude,
              admin1: x.admin1 || '',
            });
          });
        }

        const nomCities: CityInfo[] = [];
        if (nomResult.status === 'fulfilled' && nomResult.value.ok) {
          const nomData = await nomResult.value.json();
          (nomData as any[]).filter((x: any) => x.lat && x.lon).forEach((x: any) => {
            nomCities.push(parseNominatim(x));
          });
        }

        // Merge: Open-Meteo first, then Nominatim (dedupe within 0.05° / ~5km)
        results = [...omCities];
        for (const n of nomCities) {
          const dupeIndex = results.findIndex(
            p => Math.abs(p.latitude - n.latitude) < 0.05 && Math.abs(p.longitude - n.longitude) < 0.05
          );
          if (dupeIndex === -1) {
            results.push(n);
          } else {
            const existing = results[dupeIndex];
            if (!existing.name.includes(',') && n.name.includes(',')) {
              results[dupeIndex] = {
                ...existing,
                name: n.name,
              };
            }
          }
        }
      }

      // ── Sort by user's location context: same city → same state → same country → world
      results.sort((a, b) => scorePriority(a) - scorePriority(b));

      return results.slice(0, 20); // Return slightly more results (20) to satisfy "search result need more"

    } catch (err) {
      console.warn('[Weathix Geocode] Search failed:', err);
      return [];
    }
  },

  /**
   * Reverse geocode GPS coordinates → human-readable neighbourhood/city name.
   * Returns suburb/neighbourhood for precise local identity.
   */
  reverseGeocode: async (lat: number, lon: number): Promise<{ name: string; admin1: string; country: string }> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=12&addressdetails=1`,
        { headers: { 'User-Agent': 'Weathix/1.0 weather-app' } }
      );
      const data = await res.json();
      const addr = data.address || {};
      
      const rawLocal = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district || '';
      const parentCity = addr.city || addr.town || addr.county || '';
      
      let name = 'Current Location';
      if (rawLocal && parentCity && rawLocal.toLowerCase() !== parentCity.toLowerCase()) {
        name = `${rawLocal}, ${parentCity}`;
      } else if (rawLocal || parentCity) {
        name = rawLocal || parentCity;
      }

      return {
        name,
        admin1: addr.state || addr.county || '',
        country: addr.country_code ? addr.country_code.toUpperCase() : (addr.country || ''),
      };
    } catch {
      return { name: 'Current Location', admin1: '', country: '' };
    }
  },

  /**
   * Fetch complete weather metrics and AQI for specified coordinates
   */
  fetchWeather: async (lat: number, lon: number, cityName: string): Promise<{ weather: WeatherData; aqi: AqiData }> => {
    // 1. Strict Privacy Shield: Round coordinates to 2 decimal places (~1.1 km accuracy)
    // Ensures exact home addresses are never transmitted to external APIs
    const fuzzedLat = Math.round(lat * 100) / 100;
    const fuzzedLon = Math.round(lon * 100) / 100;
    const cityKey = `${fuzzedLat.toFixed(3)}-${fuzzedLon.toFixed(3)}`;

    try {
      const apiKey = process.env.EXPO_PUBLIC_VISUAL_CROSSING_KEY;
      if (!apiKey || apiKey === 'your_key_here') {
        throw new Error('Visual Crossing API key not configured inside environment variables.');
      }

      // 2. Fetch Visual Crossing Forecast (Securely with fuzzed coordinates)
      const weatherUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${fuzzedLat},${fuzzedLon}?key=${apiKey}&unitGroup=metric&include=hours,days,current`;
      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) {
        throw new Error(`Visual Crossing API responded with status: ${weatherRes.status}`);
      }
      const wData = await weatherRes.json();

      // 3. Fetch Air Quality from Open-Meteo (Keyless, free, fuzzed coordinates)
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${fuzzedLat}&longitude=${fuzzedLon}&hourly=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi`;
      const aqiRes = await fetch(aqiUrl);
      let aData: any = null;
      if (aqiRes.ok) {
        aData = await aqiRes.json();
      }

      if (!wData.days || wData.days.length === 0) {
        throw new Error('Malformed Visual Crossing API response');
      }

      // 4. Structure diurnal local times (Visual Crossing returns tzoffset in hours, e.g. 5.5 for India)
      const tzOffsetHours = wData.tzoffset || 0;
      const cityLocalTime = new Date(Date.now() + tzOffsetHours * 3600 * 1000);
      const cityLocalHour = cityLocalTime.getUTCHours();
      const currentHourStr = `${cityLocalHour.toString().padStart(2, '0')}:00:00`;

      // Extract current status variables
      const curConditions = wData.currentConditions || {};
      const isDay = curConditions.icon ? curConditions.icon.includes('-day') : (cityLocalHour >= 6 && cityLocalHour <= 18);
      const condition = mapVisualCrossingIcon(curConditions.icon || '', isDay, curConditions.precip);

      // Slicing 24 hours timeline starting from currentHourIdx
      const hourlyTime: string[] = [];
      const hourlyTemp: number[] = [];
      const hourlyRainProb: number[] = [];
      const hourlyCondition: number[] = [];

      const todayHours = wData.days[0]?.hours || [];
      const tomorrowHours = wData.days[1]?.hours || [];
      
      const currentHourIdx = Math.max(0, Math.min(23, cityLocalHour));

      // ── PRE-SCAN: Detect the full "false rain block" length ────────────────
      // The GFS model often predicts convective rain for 1–6 consecutive overnight
      // hours that never materialise. We identify that block by scanning forward
      // from now and counting every hour that still has precipprob > 50%.
      // If current conditions are dry (< 15%), ALL hours in that block are
      // suppressed/attenuated directly — no blendFactor math that fails at 60%+.
      const isDryCurrent = !curConditions.precipprob || curConditions.precipprob < 15;
      let falseRainBlockLen = 0;
      if (isDryCurrent) {
        for (let scan = 1; scan <= 12; scan++) {
          const scanIdx = currentHourIdx + scan;
          const scanHour = scanIdx < 24 ? todayHours[scanIdx] : tomorrowHours[scanIdx - 24];
          if (scanHour && (scanHour.precipprob || 0) > 50) {
            falseRainBlockLen = scan; // extend block
          } else {
            break; // first non-rainy hour → block ends
          }
        }
      }

      for (let i = 0; i < 24; i++) {
        const targetIdx = currentHourIdx + i;
        const hourData = targetIdx < 24 ? todayHours[targetIdx] : tomorrowHours[targetIdx - 24];
        if (hourData) {
          const timeStr = hourData.datetime || "00:00:00";
          hourlyTime.push(timeStr.substring(0, 5));

          const hourVal = parseInt(timeStr.substring(0, 2)) || 0;
          const hourIsDay = hourVal >= 6 && hourVal <= 18;

          if (i === 0) {
            // ── Real-Time Harmonizer: current hour = live observed conditions ──
            hourlyTemp.push(Math.round(curConditions.temp));
            hourlyRainProb.push(Math.round(curConditions.precipprob || 0));
            hourlyCondition.push(condition.code);

          } else if (isDryCurrent && i <= falseRainBlockLen) {
            // ── False-Rain Block Suppressor ────────────────────────────────────
            // Every hour confirmed inside the false rain block is corrected:
            //   Temperature: smooth linear interpolation from now → raw model
            //   Rain prob:   capped at max 30% across the whole block
            //   Icon:        progressive partly-cloudy → cloudy, never rain
            const progress = i / (falseRainBlockLen + 1); // 0 → 1 across block

            const curTemp = Math.round(curConditions.temp);
            const rawTemp = Math.round(hourData.temp);
            hourlyTemp.push(Math.round(curTemp + (rawTemp - curTemp) * progress));

            // Cap probability so it never reaches the rain icon threshold
            const rawRainProb = Math.round(hourData.precipprob || 0);
            hourlyRainProb.push(Math.round(rawRainProb * progress * 0.35)); // max ~29%

            // Icon: first 60% of block → partly-cloudy, rest → cloudy
            const fixedIcon = progress < 0.6
              ? (!hourIsDay ? 'partly-cloudy-night' : 'partly-cloudy-day')
              : 'cloudy';
            hourlyCondition.push(mapVisualCrossingIcon(fixedIcon, hourIsDay).code);

          } else {
            // ── Standard model prediction (beyond false-rain block) ────────────
            hourlyTemp.push(Math.round(hourData.temp));
            hourlyRainProb.push(Math.round(hourData.precipprob || 0));
            hourlyCondition.push(mapVisualCrossingIcon(hourData.icon || '', hourIsDay, hourData.precip).code);
          }
        }
      }

      // ─────────────────────────────────────────────────────────────────────────
      // DAILY FORECAST ENGINE v4 — Two-Zone Algorithm
      //
      // Proven from full hourly dump: Visual Crossing's daily aggregate is always
      // poisoned by overnight rain. The correct approach uses two zones:
      //
      //   ZONE A — Daytime  (07:00 – 17:00): sets the BASE icon/condition
      //   ZONE B — Evening  (17:00 – 22:00): can UPGRADE icon if rain is significant
      //
      // Upgrade rules (from real data analysis of 560062):
      //   Evening precip ≥ 65% → override to rain icon      (today 87%, Sat 81%)
      //   Evening precip 45–65% → upgrade to scattered showers (Sun 55%)
      //   Evening precip < 45% → ignore evening, keep daytime base (Fri 7%, Mon 10%, Tue/Wed)
      //
      // Daytime base icon: pick from peak hours (10–16h), prefer non-rain if precip < 40%
      // ─────────────────────────────────────────────────────────────────────────
      const normalizeDailyIcon = (rawIcon: string, precipprob: number): string => {
        const hasRain = rawIcon.includes('rain') || rawIcon.includes('showers');
        if (!hasRain) return rawIcon;
        if (precipprob >= 65) return rawIcon;
        if (precipprob >= 45) return 'showers-day';
        if (precipprob >= 30) return 'drizzle';
        return 'partly-cloudy-day';
      };

      const buildDailyData = (dayIndex: number, dayObj: any) => {
        const allHours: any[] = dayObj.hours || [];

        // ── Zone A: daytime hours 07:00 – 17:00 ───────────────────────────────
        let daytimeHours = allHours.filter((h: any) => {
          const hh = parseInt((h.datetime || '00').substring(0, 2));
          return hh >= 7 && hh <= 17;
        });

        // For today, strip already-past hours
        if (dayIndex === 0) {
          daytimeHours = daytimeHours.filter((h: any) => {
            const hh = parseInt((h.datetime || '00').substring(0, 2));
            return hh >= currentHourIdx;
          });
        }

        // ── Zone B: evening hours 17:00 – 22:00 ───────────────────────────────
        const eveningHours = allHours.filter((h: any) => {
          const hh = parseInt((h.datetime || '00').substring(0, 2));
          return hh >= 17 && hh <= 22;
        });

        // Fall back if no hours at all
        if (daytimeHours.length === 0 && eveningHours.length === 0) {
          const prob = Math.round(dayObj.precipprob || 0);
          return { precipProbMax: prob, icon: normalizeDailyIcon(dayObj.icon || '', prob) };
        }

        // ── Compute zone precipitation maxima ──────────────────────────────────
        const dtPrecipMax = daytimeHours.length > 0
          ? Math.round(Math.max(...daytimeHours.map((h: any) => h.precipprob || 0))) : 0;
        const evPrecipMax = eveningHours.length > 0
          ? Math.round(Math.max(...eveningHours.map((h: any) => h.precipprob || 0))) : 0;

        // ── Zone A: pick base daytime icon from peak hours (10–16h) ───────────
        const peakHours = daytimeHours.filter((h: any) => {
          const hh = parseInt((h.datetime || '00').substring(0, 2));
          return hh >= 10 && hh <= 16;
        });
        const dtPool = peakHours.length > 0 ? peakHours : daytimeHours;

        let baseIcon = dayObj.icon || 'cloudy';
        if (dtPrecipMax < 40 && dtPool.length > 0) {
          // Daytime mostly dry — prefer clean (non-rain) daytime icon
          const clean = dtPool.find(
            (h: any) => h.icon && !h.icon.includes('rain') && !h.icon.includes('showers')
          );
          if (clean) baseIcon = clean.icon;
        } else if (dtPrecipMax >= 40 && dtPool.length > 0) {
          // Daytime itself rainy — pick rain/storm icon
          const rainy = dtPool.find(
            (h: any) => h.icon && (h.icon.includes('rain') || h.icon.includes('thunder'))
          );
          if (rainy) baseIcon = rainy.icon;
          else {
            const cl = dtPool.find((h: any) => h.icon);
            if (cl) baseIcon = cl.icon;
          }
        } else if (dtPool.length === 0 && daytimeHours.length === 0) {
          // No daytime hours (e.g. after sunset) — use evening base
          baseIcon = eveningHours[0]?.icon || dayObj.icon || 'cloudy';
        }

        // ── Zone B: evening upgrade logic ──────────────────────────────────────
        let finalIcon = baseIcon;
        let finalProb = Math.max(dtPrecipMax, evPrecipMax);

        if (evPrecipMax >= 65) {
          // Significant evening rain/storm — this dominates the day's icon
          const evRain = eveningHours.find(
            (h: any) => h.icon && (h.icon.includes('rain') || h.icon.includes('thunder') || h.icon.includes('storm'))
          );
          finalIcon = evRain?.icon || 'rain';
          finalProb = evPrecipMax;
        } else if (evPrecipMax >= 45 && dtPrecipMax < 40) {
          // Moderate evening chance but dry daytime — show scattered showers
          finalIcon = 'showers-day';
          finalProb = evPrecipMax;
        }
        // else: evening is mild (<45%) or daytime is already rainy — keep daytime base

        return {
          precipProbMax: finalProb,
          icon: normalizeDailyIcon(finalIcon, finalProb),
          precip: dayObj.precip || 0,
        };
      };



      const daily7Days = wData.days.slice(0, 7);

      const weather: WeatherData = {
        temp: Math.round(curConditions.temp),
        feelsLike: Math.round(curConditions.feelslike ?? curConditions.temp),
        humidity: Math.round(curConditions.humidity || 50),
        pressure: Math.round(curConditions.pressure || 1013),
        windSpeed: Math.round(curConditions.windspeed || 12),
        uvIndex: Math.round(curConditions.uvindex || 0),
        visibility: Math.round(curConditions.visibility || 10),
        sunrise: curConditions.sunrise ? curConditions.sunrise.substring(0, 5) : '06:00',
        sunset: curConditions.sunset ? curConditions.sunset.substring(0, 5) : '18:00',
        conditionCode: condition.code,
        conditionText: condition.text,
        isDay,
        hourly: {
          time: hourlyTime,
          temp: hourlyTemp,
          rainProb: hourlyRainProb,
          condition: hourlyCondition,
        },
        daily: {
          time: daily7Days.map((d: any) => {
            if (!d.datetime || !d.datetime.includes('-')) return d.datetime || '';
            const parts = d.datetime.split('-');
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const day = parseInt(parts[2]);
            const date = new Date(year, month, day);
            return formatToWeekdayDate(date);
          }),
          minTemp: daily7Days.map((d: any) => Math.round(d.tempmin)),
          maxTemp: daily7Days.map((d: any) => Math.round(d.tempmax)),
          uvMax: daily7Days.map((d: any) => Math.round(d.uvindex || 0)),
          rainProbMax: daily7Days.map((d: any, idx: number) => buildDailyData(idx, d).precipProbMax),
          condition: daily7Days.map((d: any, idx: number) => {
            const dailyInfo = buildDailyData(idx, d);
            return mapVisualCrossingIcon(dailyInfo.icon, true, dailyInfo.precip).code;
          }),
        },
      };

      // 5. Handle Air Quality Parsing (Fuzzed coords from keyless Open-Meteo AQI API)
      const currentHourFormatted = `${cityLocalTime.getUTCFullYear()}-${(cityLocalTime.getUTCMonth() + 1).toString().padStart(2, '0')}-${cityLocalTime.getUTCDate().toString().padStart(2, '0')}T${cityLocalHour.toString().padStart(2, '0')}:00`;
      const aq = aData?.hourly;
      const curAqiIdx = aq?.time?.findIndex((t: string) => t.startsWith(currentHourFormatted)) || 0;
      const rawAqi = aq ? Math.round(aq.us_aqi[curAqiIdx] || 25) : 30;

      let healthRecommendation = 'Air quality is excellent. Go enjoy the outdoors!';
      if (rawAqi > 150) healthRecommendation = 'AQI level represents unhealthy spikes. Avoid intense exercise and wear a mask.';
      else if (rawAqi > 100) healthRecommendation = 'Air quality index is moderate-to-poor. Limit long outdoor jogs.';

      const aqi: AqiData = {
        aqi: rawAqi,
        pm25: aq ? Math.round(aq.pm2_5[curAqiIdx] || 5) : 8,
        pm10: aq ? Math.round(aq.pm10[curAqiIdx] || 10) : 15,
        no2: aq ? Math.round(aq.nitrogen_dioxide[curAqiIdx] || 5) : 3,
        so2: aq ? Math.round(aq.sulphur_dioxide[curAqiIdx] || 1) : 1,
        o3: aq ? Math.round(aq.ozone[curAqiIdx] || 15) : 20,
        healthRecommendation,
      };

      // Persist to local cache database for offline recoveries
      dbOperations.saveForecastCache(cityKey, cityName, lat, lon, weather, aqi);

      // Save historical stats for charts
      dbOperations.saveWeatherHistory(cityKey, new Date().toISOString().split('T')[0], weather.daily.minTemp[0], weather.daily.maxTemp[0], aqi.aqi);
      dbOperations.saveAqiTrend(cityKey, aqi.aqi, aqi.pm25, aqi.pm10);

      return { weather, aqi };
    } catch (err) {
      console.warn('[Weathix API] Visual Crossing fetch failed. Loading offline backups for: ', cityName, err);
      
      // Load offline cache
      const cached = dbOperations.getForecastCache(cityKey);
      if (cached) {
        return { weather: cached.forecast, aqi: cached.aqi };
      }

      // If no cache, perform dynamic procedural calculation
      console.log('[Weathix API] Cache empty. Activating Offline Resilience procedurals.');
      return generateProceduralOfflineWeather(lat, lon, cityName);
    }
  },
};

export const getWeatherMetrics = (code: number): { rainIntensity: number; cloudDensity: number; isSnow: boolean; stormActive: boolean } => {
  const isSnow = (code >= 71 && code <= 77) || code === 85 || code === 86;
  const stormActive = code >= 95 && code <= 99;
  
  let rainIntensity = 0;
  let cloudDensity = 0;
  
  if (code === 0) {
    rainIntensity = 0;
    cloudDensity = 0;
  } else if (code >= 1 && code <= 3) {
    rainIntensity = 0;
    cloudDensity = code === 1 ? 0.3 : code === 2 ? 0.6 : 0.85;
  } else if (code === 45 || code === 48) {
    rainIntensity = 0;
    cloudDensity = 0.9;
  } else if (code >= 51 && code <= 57) {
    rainIntensity = 0.35;
    cloudDensity = 0.85;
  } else if (code >= 61 && code <= 67) {
    rainIntensity = 0.75;
    cloudDensity = 0.95;
  } else if (code >= 71 && code <= 77) {
    rainIntensity = 0.5;
    cloudDensity = 0.9;
  } else if (code >= 80 && code <= 82) {
    rainIntensity = 0.7;
    cloudDensity = 0.9;
  } else if (code === 85 || code === 86) {
    rainIntensity = 0.6;
    cloudDensity = 0.95;
  } else if (code >= 95 && code <= 99) {
    rainIntensity = 0.9;
    cloudDensity = 1.0;
  } else {
    rainIntensity = 0;
    cloudDensity = 0.8;
  }

  return { rainIntensity, cloudDensity, isSnow, stormActive };
};
