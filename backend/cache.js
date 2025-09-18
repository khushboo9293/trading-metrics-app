// Simple in-memory cache for performance
class Cache {
  constructor(ttlSeconds = 30) {
    this.cache = new Map();
    this.ttl = ttlSeconds * 1000; // Convert to milliseconds
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl
    });
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }

  // Clear cache entries for a specific user
  clearUser(userId) {
    for (const key of this.cache.keys()) {
      if (key.includes(`user:${userId}`)) {
        this.cache.delete(key);
      }
    }
  }
}

// Create cache instances with different TTLs
export const summaryCache = new Cache(30); // 30 seconds for summary data
export const trendCache = new Cache(60); // 60 seconds for trend data
export const staticCache = new Cache(300); // 5 minutes for relatively static data

export default Cache;