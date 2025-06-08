
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
  // Old finished matches: 30 days (stable, no updates expected)
  OLD_FINISHED_CACHE_DURATION: 30 * 24 * 60 * 60 * 1000,
  // Yesterday and past dates: 7 days (finished matches are stable)
  PAST_DATE_CACHE_DURATION: 7 * 24 * 60 * 60 * 1000,
  // Future matches: 6 hours (schedules can change)
  FUTURE_CACHE_DURATION: 6 * 60 * 60 * 1000,
  // Maximum cache size
  MAX_CACHE_SIZE: 10000,
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
   * Determine cache duration for date-based queries
   */
  private getDateCacheDuration(date: string): number {
    const today = new Date().toISOString().slice(0, 10);
    const queryDate = new Date(date);
    const todayDate = new Date(today);
    
    // Past dates get long cache duration since matches are finished
    if (queryDate < todayDate) {
      return FIXTURE_CACHE_CONFIG.PAST_DATE_CACHE_DURATION;
    }
    
    // Today and future dates get shorter cache duration
    return FIXTURE_CACHE_CONFIG.LIVE_CACHE_DURATION;
  }

  /**
   * Check if a date is in the past
   */
  private isPastDate(date: string): boolean {
    const today = new Date().toISOString().slice(0, 10);
    return date < today;
  }

  /**
   * Store finished matches in localStorage for persistent caching
   */
  private storeInPersistentCache(date: string, fixtures: FixtureResponse[]): void {
    if (!this.isPastDate(date)) return;
    
    try {
      const finishedFixtures = fixtures.filter(f => 
        ['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(f.fixture.status.short)
      );
      
      if (finishedFixtures.length > 0) {
        const cacheData = {
          fixtures: finishedFixtures,
          timestamp: Date.now(),
          date
        };
        
        localStorage.setItem(`finished_fixtures_${date}`, JSON.stringify(cacheData));
        console.log(`💾 [fixtureCache] Stored ${finishedFixtures.length} finished fixtures for ${date} in persistent storage`);
      }
    } catch (error) {
      console.error('Error storing finished fixtures in localStorage:', error);
    }
  }

  /**
   * Retrieve finished matches from localStorage
   */
  private getFromPersistentCache(date: string): FixtureResponse[] | null {
    if (!this.isPastDate(date)) return null;
    
    try {
      const cached = localStorage.getItem(`finished_fixtures_${date}`);
      if (!cached) return null;
      
      const { fixtures, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      // Use longer cache duration for persistent storage
      if (age < FIXTURE_CACHE_CONFIG.PAST_DATE_CACHE_DURATION) {
        console.log(`✅ [fixtureCache] Retrieved ${fixtures.length} finished fixtures for ${date} from persistent storage`);
        return fixtures;
      } else {
        localStorage.removeItem(`finished_fixtures_${date}`);
        console.log(`⏰ [fixtureCache] Removed expired persistent cache for ${date}`);
      }
    } catch (error) {
      console.error('Error retrieving from persistent cache:', error);
    }
    
    return null;
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
    // First check persistent cache for past dates
    if (this.isPastDate(date)) {
      const persistentData = this.getFromPersistentCache(date);
      if (persistentData) {
        this.stats.hits++;
        return persistentData;
      }
    }

    const key = this.generateKey(date, 'date', date);
    const cached = this.cache.get(key);

    if (!cached) {
      this.stats.misses++;
      console.log(`🔍 [fixtureCache] Cache miss for date ${date}`);
      return null;
    }

    // For date-based cache, check if any fixture needs updating
    const fixtures = cached.fixture as any as FixtureResponse[];
    const maxAge = this.getDateCacheDuration(date);

    if (Date.now() - cached.timestamp > maxAge) {
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
    
    // Store in persistent cache if it's a past date with finished matches
    this.storeInPersistentCache(date, fixtures);
    
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

  /**
   * Background process to ensure past dates are cached
   */
  async backgroundCachePastDates(days: number = 7): Promise<void> {
    const today = new Date();
    const promises: Promise<void>[] = [];

    for (let i = 1; i <= days; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - i);
      const dateStr = pastDate.toISOString().slice(0, 10);

      // Check if we already have this date cached
      if (!this.getCachedFixturesForDate(dateStr)) {
        promises.push(this.fetchAndCachePastDate(dateStr));
      }
    }

    if (promises.length > 0) {
      console.log(`🔄 [fixtureCache] Background caching ${promises.length} past dates`);
      await Promise.all(promises);
    }
  }

  /**
   * Fetch and cache a specific past date in background
   */
  private async fetchAndCachePastDate(date: string): Promise<void> {
    try {
      console.log(`🔄 [fixtureCache] Background fetching fixtures for ${date}`);
      const response = await fetch(`/api/fixtures/date/${date}?all=true`);
      const fixtures = await response.json();
      
      if (fixtures && fixtures.length > 0) {
        this.cacheFixturesForDate(date, fixtures, 'background');
        console.log(`✅ [fixtureCache] Background cached ${fixtures.length} fixtures for ${date}`);
      }
    } catch (error) {
      console.error(`❌ [fixtureCache] Error background caching ${date}:`, error);
    }
  }

  /**
   * Check if we need fresh data for a date (only for today and future)
   */
  shouldFetchFresh(date: string): boolean {
    const today = new Date().toISOString().slice(0, 10);
    
    // Past dates: only fetch if not cached at all
    if (date < today) {
      return !this.getCachedFixturesForDate(date);
    }
    
    // Today and future: use normal cache expiration logic
    const cached = this.getCachedFixturesForDate(date);
    return !cached;
  }

  /**
   * Get cache statistics including persistent storage
   */
  getEnhancedStats(): FixtureCacheStats & { hitRate: number; persistentCacheSize: number } {
    const total = this.stats.hits + this.stats.misses;
    let persistentCacheSize = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('finished_fixtures_')) {
          persistentCacheSize++;
        }
      }
    } catch (error) {
      // localStorage might not be available
    }
    
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      persistentCacheSize
    };
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
export const backgroundCachePastDates = (days?: number) => fixtureCache.backgroundCachePastDates(days);
export const shouldFetchFresh = (date: string) => fixtureCache.shouldFetchFresh(date);
export const getEnhancedCacheStats = () => fixtureCache.getEnhancedStats();
