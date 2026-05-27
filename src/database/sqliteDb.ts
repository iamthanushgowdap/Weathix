import * as SQLite from 'expo-sqlite';
// Platform is intentionally NOT imported at module level — accessing react-native
// native modules during JS bundle evaluation crashes Android before the bridge
// is ready. We lazily open the DB inside initDatabase() instead.

// Web mock-database structure in memory
const webDbStore: Record<string, any[]> = {
  weather_cache: [],
  weather_history: [],
  aqi_trends: [],
  ai_journal: [],
};

let sqliteDb: any = null;
let _dbInitialized = false;

/** Lazily opens the SQLite database; safe to call multiple times. */
const ensureDb = (): void => {
  if (_dbInitialized) return;
  _dbInitialized = true;
  try {
    // Only access Platform after the bridge is fully ready (inside a function call).
    const platformOS: string = require('react-native').Platform.OS;
    if (platformOS !== 'web') {
      sqliteDb = SQLite.openDatabaseSync('weathix_local.db');
    }
  } catch (err) {
    console.warn('[Weathix DB] expo-sqlite not loaded, falling back to Web mock mode.', err);
  }
};

/**
 * Run database migrations/table creations
 */
export const initDatabase = async (): Promise<void> => {
  ensureDb(); // Lazy-open SQLite now that the bridge is ready
  if (sqliteDb) {

    try {
      sqliteDb.execSync(`
        CREATE TABLE IF NOT EXISTS weather_cache (
          city_id TEXT PRIMARY KEY,
          city_name TEXT,
          latitude REAL,
          longitude REAL,
          forecast_json TEXT,
          aqi_json TEXT,
          timestamp INTEGER
        );

        CREATE TABLE IF NOT EXISTS weather_history (
          city_id TEXT,
          date TEXT,
          temp_min REAL,
          temp_max REAL,
          aqi REAL,
          PRIMARY KEY (city_id, date)
        );

        CREATE TABLE IF NOT EXISTS aqi_trends (
          city_id TEXT,
          timestamp INTEGER,
          aqi REAL,
          pm25 REAL,
          pm10 REAL
        );

        CREATE TABLE IF NOT EXISTS ai_journal (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER,
          weather_condition TEXT,
          temperature REAL,
          mood_score INTEGER,
          diary_note TEXT
        );
      `);
      console.log('[Weathix DB] SQLite tables verified/created successfully.');
    } catch (e) {
      console.error('[Weathix DB] SQLite migration failed.', e);
    }
  } else {
    console.log('[Weathix DB] Simulated memory-db ready.');
  }
};

/**
 * Data Access Layer Operations
 */
export const dbOperations = {
  /**
   * Save Open-Meteo forecast snapshot in local cache
   */
  saveForecastCache: (
    cityId: string,
    cityName: string,
    lat: number,
    lon: number,
    forecast: any,
    aqi: any
  ): void => {
    const timestamp = Date.now();
    const forecastJson = JSON.stringify(forecast);
    const aqiJson = JSON.stringify(aqi);

    if (sqliteDb) {
      try {
        sqliteDb.runSync(
          `INSERT OR REPLACE INTO weather_cache (city_id, city_name, latitude, longitude, forecast_json, aqi_json, timestamp) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [cityId, cityName, lat, lon, forecastJson, aqiJson, timestamp]
        );
      } catch (err) {
        console.error('[Weathix DB] Failed to save forecast cache.', err);
      }
    } else {
      const idx = webDbStore.weather_cache.findIndex((x) => x.city_id === cityId);
      const cacheObj = { city_id: cityId, city_name: cityName, latitude: lat, longitude: lon, forecast_json: forecastJson, aqi_json: aqiJson, timestamp };
      if (idx >= 0) {
        webDbStore.weather_cache[idx] = cacheObj;
      } else {
        webDbStore.weather_cache.push(cacheObj);
      }
    }
  },

  /**
   * Load Open-Meteo cached forecast snapshot
   */
  getForecastCache: (cityId: string): any | null => {
    if (sqliteDb) {
      try {
        const row: any = sqliteDb.getFirstSync(
          'SELECT * FROM weather_cache WHERE city_id = ?',
          [cityId]
        );
        if (row) {
          return {
            ...row,
            forecast: JSON.parse(row.forecast_json),
            aqi: JSON.parse(row.aqi_json),
          };
        }
      } catch (err) {
        console.error('[Weathix DB] Failed to load forecast cache.', err);
      }
    } else {
      const row = webDbStore.weather_cache.find((x) => x.city_id === cityId);
      if (row) {
        return {
          ...row,
          forecast: JSON.parse(row.forecast_json),
          aqi: JSON.parse(row.aqi_json),
        };
      }
    }
    return null;
  },

  /**
   * Insert historical forecast metrics (for 30-day trends view)
   */
  saveWeatherHistory: (cityId: string, date: string, minTemp: number, maxTemp: number, aqi: number): void => {
    if (sqliteDb) {
      try {
        sqliteDb.runSync(
          `INSERT OR REPLACE INTO weather_history (city_id, date, temp_min, temp_max, aqi) VALUES (?, ?, ?, ?, ?)`,
          [cityId, date, minTemp, maxTemp, aqi]
        );
      } catch (err) {
        console.error('[Weathix DB] Failed to save weather history.', err);
      }
    } else {
      const idx = webDbStore.weather_history.findIndex((x) => x.city_id === cityId && x.date === date);
      const item = { city_id: cityId, date, temp_min: minTemp, temp_max: maxTemp, aqi };
      if (idx >= 0) {
        webDbStore.weather_history[idx] = item;
      } else {
        webDbStore.weather_history.push(item);
      }
    }
  },

  /**
   * Get 30-day historical logs
   */
  getWeatherHistory: (cityId: string): any[] => {
    if (sqliteDb) {
      try {
        return sqliteDb.getAllSync(
          'SELECT * FROM weather_history WHERE city_id = ? ORDER BY date DESC LIMIT 30',
          [cityId]
        );
      } catch (err) {
        console.error('[Weathix DB] Failed to query weather history.', err);
        return [];
      }
    } else {
      return webDbStore.weather_history
        .filter((x) => x.city_id === cityId)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30);
    }
  },

  /**
   * Add AQI real-time record to database for trend charts
   */
  saveAqiTrend: (cityId: string, aqi: number, pm25: number, pm10: number): void => {
    const timestamp = Date.now();
    if (sqliteDb) {
      try {
        sqliteDb.runSync(
          `INSERT INTO aqi_trends (city_id, timestamp, aqi, pm25, pm10) VALUES (?, ?, ?, ?, ?)`,
          [cityId, timestamp, aqi, pm25, pm10]
        );
      } catch (err) {
        console.error('[Weathix DB] Failed to save AQI trend.', err);
      }
    } else {
      webDbStore.aqi_trends.push({ city_id: cityId, timestamp, aqi, pm25, pm10 });
    }
  },

  /**
   * Get recent AQI trends
   */
  getAqiTrends: (cityId: string): any[] => {
    if (sqliteDb) {
      try {
        return sqliteDb.getAllSync(
          'SELECT * FROM aqi_trends WHERE city_id = ? ORDER BY timestamp DESC LIMIT 48',
          [cityId]
        );
      } catch (err) {
        console.error('[Weathix DB] Failed to fetch AQI trends.', err);
        return [];
      }
    } else {
      return webDbStore.aqi_trends
        .filter((x) => x.city_id === cityId)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 48);
    }
  },

  /**
   * Weather Journal Log (mood-weather correlation)
   */
  saveJournalEntry: (weatherCondition: string, temp: number, moodScore: number, diaryNote: string): void => {
    const timestamp = Date.now();
    if (sqliteDb) {
      try {
        sqliteDb.runSync(
          `INSERT INTO ai_journal (timestamp, weather_condition, temperature, mood_score, diary_note) VALUES (?, ?, ?, ?, ?)`,
          [timestamp, weatherCondition, temp, moodScore, diaryNote]
        );
      } catch (err) {
        console.error('[Weathix DB] Failed to save journal entry.', err);
      }
    } else {
      webDbStore.ai_journal.push({
        id: webDbStore.ai_journal.length + 1,
        timestamp,
        weather_condition: weatherCondition,
        temperature: temp,
        mood_score: moodScore,
        diary_note: diaryNote,
      });
    }
  },

  /**
   * Get all weather journal logs
   */
  getJournalEntries: (): any[] => {
    if (sqliteDb) {
      try {
        return sqliteDb.getAllSync('SELECT * FROM ai_journal ORDER BY timestamp DESC');
      } catch (err) {
        console.error('[Weathix DB] Failed to load journal entries.', err);
        return [];
      }
    } else {
      return [...webDbStore.ai_journal].sort((a, b) => b.timestamp - a.timestamp);
    }
  },
};
