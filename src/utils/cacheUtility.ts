const CACHE_KEY = 'geo_location_cache';
const EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  value: unknown;
  timestamp: number;
}

export const cacheUtility = {
  getLocation(): unknown | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() - entry.timestamp < EXPIRATION_MS) {
        return entry.value;
      }
      localStorage.removeItem(CACHE_KEY);
    } catch {
      // ignore
    }
    return null;
  },

  setLocation(value: unknown): void {
    try {
      const entry: CacheEntry = { value, timestamp: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch {
      // ignore
    }
  },
};
