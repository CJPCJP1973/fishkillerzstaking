const GEO_CACHE_KEY = 'geoCache';
const EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Caches geo-check results in localStorage with expiration.
 * @param {string} key - The key for the cache.
 * @param {any} value - The value to cache.  
 */
function setGeoCache(key, value) {
    const cacheObject = {
        value,
        timestamp: new Date().getTime()
    };
    localStorage.setItem(GEO_CACHE_KEY + '-' + key, JSON.stringify(cacheObject));
}

/**
 * Retrieves cached geo-check results if not expired.
 * @param {string} key - The key for the cache.
 * @returns {any|null} - The cached value or null if expired.
 */
function getGeoCache(key) {
    const cachedData = localStorage.getItem(GEO_CACHE_KEY + '-' + key);
    if (cachedData) {
        const { value, timestamp } = JSON.parse(cachedData);
        if (new Date().getTime() - timestamp < EXPIRATION_TIME) {
            return value;
        } else {
            // Remove expired cache
            localStorage.removeItem(GEO_CACHE_KEY + '-' + key);
        }
    }
    return null;
}

export { setGeoCache, getGeoCache };