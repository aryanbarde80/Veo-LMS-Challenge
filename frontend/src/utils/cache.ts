/**
 * Cache Manager - Centralized caching for API responses and computed values
 * Uses localStorage with TTL support and automatic invalidation
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
  tags: string[];
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private storagePrefix = 'veo_cache_';
  private maxSize = 50; // Maximum cache entries

  /**
   * Get cached value with TTL validation
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return this.getFromStorage<T>(key);

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.invalidate(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache value with TTL
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000, tags: string[] = []): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
    };

    this.cache.set(key, entry);
    this.saveToStorage(key, entry);
  }

  /**
   * Invalidate cache by key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    localStorage.removeItem(this.storagePrefix + key);
  }

  /**
   * Invalidate all cache entries with specific tag
   */
  invalidateByTag(tag: string): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (entry.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.invalidate(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.storagePrefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.invalidate(oldestKey);
    }
  }

  /**
   * Save to localStorage for persistence
   */
  private saveToStorage<T>(key: string, entry: CacheEntry<T>): void {
    try {
      localStorage.setItem(
        this.storagePrefix + key,
        JSON.stringify(entry)
      );
    } catch (e) {
      console.warn('[Cache] Failed to save to storage:', e);
    }
  }

  /**
   * Retrieve from localStorage
   */
  private getFromStorage<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(this.storagePrefix + key);
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);
      const isExpired = Date.now() - entry.timestamp > entry.ttl;

      if (isExpired) {
        localStorage.removeItem(this.storagePrefix + key);
        return null;
      }

      this.cache.set(key, entry);
      return entry.data;
    } catch (e) {
      console.warn('[Cache] Failed to read from storage:', e);
      return null;
    }
  }
}

export const cacheManager = new CacheManager();

/**
 * Cache decorator for async functions
 */
export function cacheable(ttl: number = 5 * 60 * 1000, tags: string[] = []) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}_${JSON.stringify(args)}`;
      const cached = cacheManager.get(cacheKey);

      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      cacheManager.set(cacheKey, result, ttl, tags);
      return result;
    };

    return descriptor;
  };
}

export default cacheManager;
