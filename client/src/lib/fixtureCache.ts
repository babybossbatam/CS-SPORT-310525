
import { FixtureResponse } from '@/types/fixtures';

interface CachedFixture {
  fixture: FixtureResponse;
  timestamp: number;
  source: string;
}

interface FixtureCacheStats {
  size: number;
  hits: number;
  misses: number;
  lastCleanup: number;
}

// Cache configuration
const FIXTURE_CACHE_CONFIG = {
  // Live/upcoming matches: 2 minutes (need frequent updates)
  LIVE_CACHE_DURATION: 2 * 60 * 1000,
  // Recent finished matches: 30 minutes (scores might be updated)
  RECENT_FINISHED_CACHE_DURATION: 30 * 60 * 1000,
  // Old finished matches: 7 days (stable, no updates expected)
  OLD_FINISHED_CACHE_DURATION: 7 * 24 * 60 * 60 * 1000,
  // Future matches: 6 hours (schedules can change)
  FUTURE_CACHE_DURATION: 6 * 60 * 60 * 1000,
  // Maximum cache size
  MAX_CACHE_SIZE: 5000,
  // Cleanup interval
  CLEANUP_INTERVAL: 10 * 60 * 1000, // 10 minutes
};

class FixtureCache {
  private cache = new Map<string, CachedFixture>();
  private stats: FixtureCacheStats = {
    size: 0,
    hits: 0,
    misses: 0,
    lastCleanup: Date.now()
  };

  /**
   * Generate cache key for a fixture
   */
  private generateKey(fixtureId: number | string, type: 'single' | 'date' = 'single', date?: string): string {
    if (type === 'date' && date) {
      return `fixtures_date_${date}`;
    }
    return `fixture_${fixtureId}`;
  }

  /**
   * Determine cache duration based on fixture status and timing
   */
  private getCacheDuration(fixture: FixtureResponse): number {
    const now = Date.now();
    const fixtureDate = new Date(fixture.fixture.date).getTime();
    const status = fixture.fixture.status.short;

    // Live or about to start - short cache
    if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT', 'NS'].includes(status)) {
      const minutesToKickoff = (fixtureDate - now) / (1000 * 60);
      if (minutesToKickoff <= 120) { // Within 2 hours of kickoff
        return FIXTURE_CACHE_CONFIG.LIVE_CACHE_DURATION;
      }
      return FIXTURE_CACHE_CONFIG.FUTURE_CACHE_DURATION;
    }

    // Finished matches
    if (['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(status)) {
      const hoursAgo = (now - fixtureDate) / (1000 * 60 * 60);
      if (hoursAgo <= 24) {
        return FIXTURE_CACHE_CONFIG.RECENT_FINISHED_CACHE_DURATION;
      }
      return FIXTURE_CACHE_CONFIG.OLD_FINISHED_CACHE_DURATION;
    }

    // Default cache duration
    return FIXTURE_CACHE_CONFIG.FUTURE_CACHE_DURATION;
  }

  /**
   * Check if cached data is still valid
   */
  private isValidCache(cachedItem: CachedFixture): boolean {
    const now = Date.now();
    const age = now - cachedItem.timestamp;
    const maxAge = this.getCacheDuration(cachedItem.fixture);
    
    return age < maxAge;
  }

  /**
   * Get fixture from cache
   */
  getCachedFixture(fixtureId: number | string): FixtureResponse | null {
    const key = this.generateKey(fixtureId);
    const cached = this.cache.get(key);

    if (!cached) {
      this.stats.misses++;
      console.log(`🔍 [fixtureCache] Cache miss for fixture ${fixtureId}`);
      return null;
    }

    if (!this.isValidCache(cached)) {
      this.cache.delete(key);
      this.stats.misses++;
      console.log(`⏰ [fixtureCache] Cache expired for fixture ${fixtureId}`);
      return null;
    }

    this.stats.hits++;
    console.log(`✅ [fixtureCache] Cache hit for fixture ${fixtureId}`);
    return cached.fixture;
  }

  /**
   * Get fixtures for a specific date from cache
   */
  getCachedFixturesForDate(date: string): FixtureResponse[] | null {
    const key = this.generateKey(date, 'date', date);
    const cached = this.cache.get(key);

    if (!cached) {
      this.stats.misses++;
      console.log(`🔍 [fixtureCache] Cache miss for date ${date}`);
      return null;
    }

    // For date-based cache, check if any fixture needs updating
    const fixtures = cached.fixture as any as FixtureResponse[];
    const now = Date.now();
    const hasLiveOrUpcoming = fixtures.some(f => 
      ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT', 'NS'].includes(f.fixture.status.short)
    );

    // If has live/upcoming matches, use shorter cache duration
    const maxAge = hasLiveOrUpcoming ? 
      FIXTURE_CACHE_CONFIG.LIVE_CACHE_DURATION : 
      FIXTURE_CACHE_CONFIG.RECENT_FINISHED_CACHE_DURATION;

    if (now - cached.timestamp > maxAge) {
      this.cache.delete(key);
      this.stats.misses++;
      console.log(`⏰ [fixtureCache] Cache expired for date ${date}`);
      return null;
    }

    this.stats.hits++;
    console.log(`✅ [fixtureCache] Cache hit for date ${date} (${fixtures.length} fixtures)`);
    return fixtures;
  }

  /**
   * Cache a single fixture
   */
  cacheFixture(fixture: FixtureResponse, source: string = 'api'): void {
    const key = this.generateKey(fixture.fixture.id);
    const cachedItem: CachedFixture = {
      fixture,
      timestamp: Date.now(),
      source
    };

    this.cache.set(key, cachedItem);
    this.stats.size = this.cache.size;
    
    console.log(`💾 [fixtureCache] Cached fixture ${fixture.fixture.id} (${source})`);
    this.cleanup();
  }

  /**
   * Cache fixtures for a specific date
   */
  cacheFixturesForDate(date: string, fixtures: FixtureResponse[], source: string = 'api'): void {
    const key = this.generateKey(date, 'date', date);
    const cachedItem: CachedFixture = {
      fixture: fixtures as any,
      timestamp: Date.now(),
      source
    };

    this.cache.set(key, cachedItem);
    this.stats.size = this.cache.size;
    
    console.log(`💾 [fixtureCache] Cached ${fixtures.length} fixtures for date ${date} (${source})`);
    
    // Also cache individual fixtures
    fixtures.forEach(fixture => {
      this.cacheFixture(fixture, `date_batch_${source}`);
    });
    
    this.cleanup();
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    
    // Only cleanup every 10 minutes
    if (now - this.stats.lastCleanup < FIXTURE_CACHE_CONFIG.CLEANUP_INTERVAL) {
      return;
    }

    const sizeBefore = this.cache.size;
    let expiredCount = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (!this.isValidCache(cached)) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    // If still too large, remove oldest entries
    if (this.cache.size > FIXTURE_CACHE_CONFIG.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = this.cache.size - FIXTURE_CACHE_CONFIG.MAX_CACHE_SIZE;
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }

    this.stats.size = this.cache.size;
    this.stats.lastCleanup = now;

    if (expiredCount > 0 || sizeBefore !== this.cache.size) {
      console.log(`🧹 [fixtureCache] Cleanup: removed ${expiredCount + (sizeBefore - this.cache.size)} entries, size: ${this.cache.size}`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): FixtureCacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0
    };
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      size: 0,
      hits: 0,
      misses: 0,
      lastCleanup: Date.now()
    };
    console.log(`🗑️ [fixtureCache] Cache cleared`);
  }
}

// Export singleton instance
export const fixtureCache = new FixtureCache();

// Helper functions
export const getCachedFixture = (fixtureId: number | string) => fixtureCache.getCachedFixture(fixtureId);
export const getCachedFixturesForDate = (date: string) => fixtureCache.getCachedFixturesForDate(date);
export const cacheFixture = (fixture: FixtureResponse, source?: string) => fixtureCache.cacheFixture(fixture, source);
export const cacheFixturesForDate = (date: string, fixtures: FixtureResponse[], source?: string) => 
  fixtureCache.cacheFixturesForDate(date, fixtures, source);
