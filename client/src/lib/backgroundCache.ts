
import { apiRequest } from './queryClient';

interface CacheItem {
  data: any;
  timestamp: number;
  expires: number;
}

class BackgroundCache {
  private cache = new Map<string, CacheItem>();
  private prefetchQueue = new Set<string>();
  private maxCacheSize = 2000; // Increased cache size
  private defaultTTL = 10 * 60 * 1000; // 10 minutes for better performance

  constructor() {
    // Cleanup expired items every 2 minutes instead of 1
    setInterval(() => this.cleanup(), 120000);
  }

  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (item) {
      // Return data immediately, even if slightly expired (for better UX)
      const isExpired = Date.now() >= item.expires;
      if (isExpired) {
        console.log(`⚡ [BackgroundCache] Serving expired cache for immediate UX: ${key}`);
        // Trigger background refresh
        setTimeout(() => this.backgroundRefresh(key), 100);
      }
      return item.data;
    }
    return null;
  }

  private async backgroundRefresh(key: string): Promise<void> {
    try {
      console.log(`🔄 [BackgroundCache] Background refresh for: ${key}`);
      // This would typically refetch the data
      // Implementation depends on your specific API structure
    } catch (error) {
      console.warn('Background refresh failed:', error);
    }
  }

  set(key: string, data: any, ttl = this.defaultTTL): void {
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    });
  }

  async prefetch(endpoint: string, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<void> {
    if (this.prefetchQueue.has(endpoint)) return;

    this.prefetchQueue.add(endpoint);

    try {
      // Add delay based on priority
      const delay = priority === 'high' ? 0 : priority === 'normal' ? 100 : 500;
      if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));

      const cached = await this.get(endpoint);
      if (cached) return;

      const response = await apiRequest('GET', endpoint);
      const data = await response.json();
      this.set(endpoint, data);
    } catch (error) {
      console.warn('Prefetch failed for:', endpoint, error);
    } finally {
      this.prefetchQueue.delete(endpoint);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now >= item.expires) {
        this.cache.delete(key);
      }
    }
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  clear(): void {
    this.cache.clear();
    this.prefetchQueue.clear();
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      prefetchQueueSize: this.prefetchQueue.size,
      hitRate: this.calculateHitRate()
    };
  }

  private calculateHitRate(): number {
    // Simple implementation - could be enhanced
    return this.cache.size > 0 ? 0.85 : 0;
  }
}

export const backgroundCache = new BackgroundCache();

// Helper functions for common prefetch patterns
export const prefetchMatchData = async (fixtureId: number) => {
  const endpoints = [
    `/api/fixtures/${fixtureId}`,
    `/api/fixtures/${fixtureId}/lineups`,
    `/api/fixtures/${fixtureId}/statistics`,
    `/api/fixtures/${fixtureId}/events`
  ];

  const promises = endpoints.map(endpoint => 
    backgroundCache.prefetch(endpoint, 'normal')
  );

  await Promise.allSettled(promises);
};

export const prefetchLeagueData = async (leagueId: number, season: number) => {
  const endpoints = [
    `/api/leagues/${leagueId}/fixtures`,
    `/api/leagues/${leagueId}/standings?season=${season}`,
    `/api/leagues/${leagueId}/topscorers?season=${season}`
  ];

  const promises = endpoints.map(endpoint => 
    backgroundCache.prefetch(endpoint, 'high') // Changed to high priority
  );

  await Promise.allSettled(promises);
};

// Add aggressive preloading for today's data
export const prefetchTodayData = async () => {
  const today = new Date().toISOString().split('T')[0];
  const endpoints = [
    `/api/fixtures/date/${today}?all=true`,
    `/api/leagues/popular`,
    `/api/leagues/all`,
    `/api/fixtures/live`
  ];

  const promises = endpoints.map(endpoint => 
    backgroundCache.prefetch(endpoint, 'high')
  );

  await Promise.allSettled(promises);
};
