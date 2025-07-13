
interface CachedData {
  data: any;
  timestamp: number;
  compressed?: boolean;
}

class AnalyticsCache {
  private cache = new Map<string, CachedData>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;

  // Compress large datasets
  private compressData(data: any): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('Failed to compress data:', error);
      return JSON.stringify({});
    }
  }

  // Decompress data
  private decompressData(compressedData: string): any {
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      console.error('Failed to decompress data:', error);
      return {};
    }
  }

  // Set cached data
  set(key: string, data: any, compress: boolean = false): void {
    // Clean old entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanOldEntries();
    }

    const cacheEntry: CachedData = {
      data: compress ? this.compressData(data) : data,
      timestamp: Date.now(),
      compressed: compress
    };

    this.cache.set(key, cacheEntry);
    console.log(`📦 [AnalyticsCache] Cached data for key: ${key}${compress ? ' (compressed)' : ''}`);
  }

  // Get cached data
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      console.log(`🗑️ [AnalyticsCache] Expired cache for key: ${key}`);
      return null;
    }

    const data = entry.compressed ? this.decompressData(entry.data as string) : entry.data;
    console.log(`✅ [AnalyticsCache] Cache hit for key: ${key}`);
    return data;
  }

  // Clean old entries
  private cleanOldEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });

    console.log(`🧹 [AnalyticsCache] Cleaned ${keysToDelete.length} expired entries`);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    console.log(`🗑️ [AnalyticsCache] Cleared all cache`);
  }

  // Get cache stats
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const analyticsCache = new AnalyticsCache();

// Cache key generators
export const getCacheKey = {
  heatmap: (playerId: number, matchId: number) => `heatmap_${playerId}_${matchId}`,
  shotmap: (matchId: number, teamId?: number) => `shotmap_${matchId}_${teamId || 'all'}`,
  playerStats: (playerId: number, season: number) => `stats_${playerId}_${season}`,
  matchEvents: (matchId: number) => `events_${matchId}`,
  predictions: (matchId: number) => `predictions_${matchId}`
};
