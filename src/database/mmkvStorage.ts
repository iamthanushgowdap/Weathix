// Platform is intentionally NOT imported at module level — accessing react-native
// native modules during JS bundle evaluation crashes Android before the bridge
// is ready. Instead we lazily read getPlatformOS() inside each function.
const getPlatformOS = (): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native').getPlatformOS() as string;
  } catch {
    return 'native';
  }
};

const nativeFallbackStore: Record<string, string> = {};

let MMKVClass: any = null;
try {
  MMKVClass = require('react-native-mmkv').MMKV;
} catch {}

let storage: any = null;
try {
  if (MMKVClass) {
    storage = new MMKVClass({
      id: 'weathix-persistent-storage',
    });
  }
} catch (error) {
  console.log('[Weathix Storage] MMKV JSI bindings unavailable. Operating in Web fallback mode.');
}

export const mmkvStorage = {
  /**
   * Persists a string value to the database
   */
  setString: (key: string, value: string): void => {
    try {
      if (storage) {
        storage.set(key, value);
        return;
      }
    } catch (e) {
      console.log('[Weathix Storage] MMKV setString failed, falling back.', e);
    }
    if (getPlatformOS() === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (err) {
        console.log('[Weathix Storage] localStorage setItem failed.', err);
      }
    } else {
      nativeFallbackStore[key] = value;
    }
  },

  /**
   * Retrieves a string value
   */
  getString: (key: string): string | null => {
    try {
      if (storage) {
        return storage.getString(key) ?? null;
      }
    } catch (e) {
      console.log('[Weathix Storage] MMKV getString failed, falling back.', e);
    }
    if (getPlatformOS() === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch (err) {
        console.log('[Weathix Storage] localStorage getItem failed.', err);
      }
    } else {
      return nativeFallbackStore[key] ?? null;
    }
    return null;
  },

  /**
   * Persists an object (serializes to JSON)
   */
  setObject: <T>(key: string, value: T): void => {
    const json = JSON.stringify(value);
    try {
      if (storage) {
        storage.set(key, json);
        return;
      }
    } catch (e) {
      console.log('[Weathix Storage] MMKV setObject failed, falling back.', e);
    }
    if (getPlatformOS() === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, json);
        }
      } catch (err) {
        console.log('[Weathix Storage] localStorage setObject failed.', err);
      }
    } else {
      nativeFallbackStore[key] = json;
    }
  },

  /**
   * Retrieves and parses an object from storage
   */
  getObject: <T>(key: string): T | null => {
    const raw = mmkvStorage.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * Removes a key from database
   */
  remove: (key: string): void => {
    try {
      if (storage) {
        storage.delete(key);
        return;
      }
    } catch (e) {
      console.log('[Weathix Storage] MMKV remove failed, falling back.', e);
    }
    if (getPlatformOS() === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (err) {
        console.log('[Weathix Storage] localStorage removeItem failed.', err);
      }
    } else {
      delete nativeFallbackStore[key];
    }
  },

  /**
   * Clears all storage keys
   */
  clearAll: (): void => {
    try {
      if (storage) {
        storage.clearAll();
        return;
      }
    } catch (e) {
      console.log('[Weathix Storage] MMKV clearAll failed, falling back.', e);
    }
    if (getPlatformOS() === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.clear();
        }
      } catch (err) {
        console.log('[Weathix Storage] localStorage clear failed.', err);
      }
    } else {
      for (const k of Object.keys(nativeFallbackStore)) {
        delete nativeFallbackStore[k];
      }
    }
  },
};
