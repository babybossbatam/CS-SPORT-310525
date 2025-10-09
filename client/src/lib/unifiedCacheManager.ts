
/**
 * Unified Cache Manager - Single source of truth for all caching
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
  source: 'api' | 'local' | 'memory';
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  memoryUsage: number;
}

class UnifiedCacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, memoryUsage: 0 };
  private maxMemorySize = 50 * 1024 * 1024; // 50MB
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    this.loadFromPersistent();
  }

  /**
   * Smart cache strategy based on data type and freshness requirements
   */
  private getTTL(key: string, dataType: 'live' | 'fixtures' | 'standings' | 'static'): number {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    switch (dataType) {
      case 'live':
        return 30 * 1000; // 30 seconds for live data
      case 'fixtures':
        if (key.includes(today)) {
          return 2 * 60 * 1000; // 2 minutes for today's matches
        } else if (key.includes('future')) {
          return 30 * 60 * 1000; // 30 minutes for future matches
        }
        return 60 * 60 * 1000; // 1 hour for past matches
      case 'standings':
        return 15 * 60 * 1000; // 15 minutes for standings
      case 'static':
        return 24 * 60 * 60 * 1000; // 24 hours for static data
      default:
        return 5 * 60 * 1000; // 5 minutes default
    }
  }

  /**
   * Get data with intelligent fallback strategy
   */
  async get<T>(key: string, dataType: 'live' | 'fixtures' | 'standings' | 'static' = 'fixtures'): Promise<T | null> {
    // Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry && Date.now() - memEntry.timestamp < memEntry.ttl) {
      this.stats.hits++;
      console.log(`✅ [UnifiedCache] Memory hit for: ${key}`);
      return memEntry.data;
    }

    // Check localStorage for non-live data
    if (dataType !== 'live') {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored);
          if (Date.now() - entry.timestamp < entry.ttl) {
            // Move back to memory cache
            this.memoryCache.set(key, entry);
            this.stats.hits++;
            console.log(`📂 [UnifiedCache] localStorage hit for: ${key}`);
            return entry.data;
          }
        }
      } catch (error) {
        console.warn('localStorage read error:', error);
      }
    }

    this.stats.misses++;
    console.log(`❌ [UnifiedCache] Cache miss for: ${key}`);
    return null;
  }

  /**
   * Set data with intelligent storage strategy
   */
  async set<T>(key: string, data: T, dataType: 'live' | 'fixtures' | 'standings' | 'static' = 'fixtures'): Promise<void> {
    const ttl = this.getTTL(key, dataType);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key,
      source: 'memory'
    };

    // Always store in memory
    this.memoryCache.set(key, entry);

    // Store non-live data in localStorage for persistence
    if (dataType !== 'live') {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
      } catch (error) {
        console.warn('localStorage write error:', error);
        // Clear some space and retry
        this.cleanupLocalStorage();
        try {
          localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
        } catch (retryError) {
          console.error('Failed to cache to localStorage even after cleanup');
        }
      }
    }

    this.updateStats();
    console.log(`💾 [UnifiedCache] Cached ${key} (TTL: ${ttl/1000}s, Type: ${dataType})`);
  }

  /**
   * Smart prefetch for related data
   */
  async prefetch(keys: string[], dataType: 'live' | 'fixtures' | 'standings' | 'static' = 'fixtures'): Promise<void> {
    const uncachedKeys = keys.filter(key => !this.has(key));
    if (uncachedKeys.length === 0) return;

    console.log(`🔄 [UnifiedCache] Prefetching ${uncachedKeys.length} keys`);
    // This would integrate with your API service
  }

  /**
   * Check if key exists and is fresh
   */
  has(key: string): boolean {
    const entry = this.memoryCache.get(key);
    if (entry && Date.now() - entry.timestamp < entry.ttl) {
      return true;
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (stored) {
        const entry: CacheEntry<any> = JSON.parse(stored);
        return Date.now() - entry.timestamp < entry.ttl;
      }
    } catch (error) {
      return false;
    }

    return false;
  }

  /**
   * Memory-aware cleanup
   */
  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    // Remove expired entries
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        removedCount++;
      }
    }

    // Check memory usage and clean if necessary
    if (this.getMemoryUsage() > this.maxMemorySize) {
      this.evictOldest();
    }

    if (removedCount > 0) {
      console.log(`🧹 [UnifiedCache] Cleaned ${removedCount} expired entries`);
    }

    this.updateStats();
  }

  private cleanupLocalStorage(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache_')) {
        keysToRemove.push(key);
      }
    }
    
    // Remove oldest half
    keysToRemove.slice(0, Math.floor(keysToRemove.length / 2))
      .forEach(key => localStorage.removeItem(key));
  }

  private evictOldest(): void {
    const entries = Array.from(this.memoryCache.entries())
      .sort(([,a], [,b]) => a.timestamp - b.timestamp);
    
    // Remove oldest 25%
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
  }

  private getMemoryUsage(): number {
    let size = 0;
    for (const entry of this.memoryCache.values()) {
      size += JSON.stringify(entry.data).length;
    }
    return size;
  }

  private updateStats(): void {
    this.stats.size = this.memoryCache.size;
    this.stats.memoryUsage = this.getMemoryUsage();
  }

  private loadFromPersistent(): void {
    // Load critical data from localStorage on startup
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache_') && (key.includes('today') || key.includes('live'))) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const entry = JSON.parse(stored);
            if (Date.now() - entry.timestamp < entry.ttl) {
              this.memoryCache.set(key.replace('cache_', ''), entry);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error loading from persistent cache:', error);
    }
  }

  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  clear(): void {
    this.memoryCache.clear();
    // Clear localStorage cache keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    this.stats = { hits: 0, misses: 0, size: 0, memoryUsage: 0 };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

export const unifiedCache = new UnifiedCacheManager();

// Export helper functions for easy integration
export const getFromCache = <T>(key: string, type?: 'live' | 'fixtures' | 'standings' | 'static') => 
  unifiedCache.get<T>(key, type);

export const setInCache = <T>(key: string, data: T, type?: 'live' | 'fixtures' | 'standings' | 'static') => 
  unifiedCache.set(key, data, type);

export const hasCached = (key: string) => unifiedCache.has(key);

export const prefetchData = (keys: string[], type?: 'live' | 'fixtures' | 'standings' | 'static') => 
  unifiedCache.prefetch(keys, type);
