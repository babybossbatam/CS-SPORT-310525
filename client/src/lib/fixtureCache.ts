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

// Cache configuration - EXTENDED DURATIONS FOR BETTER PERFORMANCE
const FIXTURE_CACHE_CONFIG = {
  // Live/upcoming matches: 2 minutes (need frequent updates but not excessive)
  LIVE_CACHE_DURATION: 2 * 60 * 1000,
  // Recent finished matches: 6 hours (scores are stable after match ends)
  RECENT_FINISHED_CACHE_DURATION: 6 * 60 * 60 * 1000,
  // Old finished matches: 30 days (stable, no updates expected)
  OLD_FINISHED_CACHE_DURATION: 30 * 24 * 60 * 60 * 1000,
  // Yesterday and past dates: 7 days (finished matches are stable)
  PAST_DATE_CACHE_DURATION: 7 * 24 * 60 * 60 * 1000,
  // Future matches: 24 hours (schedules rarely change)
  FUTURE_CACHE_DURATION: 24 * 60 * 60 * 1000,
  // Today's matches: 30 minutes (balance between freshness and performance)
  TODAY_CACHE_DURATION: 30 * 60 * 1000,
  // Maximum cache size
  MAX_CACHE_SIZE: 10000,
  // Cleanup interval
  CLEANUP_INTERVAL: 10 * 60 * 1000, // 10 minutes
};

export interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt?: number;
  status?: string; // Track match status for transition detection
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  lastCleanup: number;
}

interface StatusTransition {
  fixtureId: number;
  fromStatus: string;
  toStatus: string;
  timestamp: number;
}

class FixtureCache {
  private cache = new Map<string, CachedFixture>();
  private statusTransitions = new Map<number, StatusTransition>();
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
  private getFixtureCacheDuration(fixture: FixtureResponse): number {
    const status = fixture.fixture.status.short;
    const fixtureDate = new Date(fixture.fixture.date).getTime();
    const now = Date.now();

    // Live matches get minimal cache (30 seconds)
    if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
      return FIXTURE_CACHE_CONFIG.LIVE_CACHE_DURATION;
    }

    // Finished matches - ENHANCED WITH 2-HOUR RULE
    if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'CANC', 'PST', 'SUSP', 'ABD'].includes(status)) {
      const hoursAgo = (now - fixtureDate) / (1000 * 60 * 60);

      // Matches ended more than 2 hours ago get extended cache (24 hours)
      if (hoursAgo >= 2) {
        console.log(`📦 [FixtureCache] Match ended ${Math.round(hoursAgo)}h ago, using extended cache:`, {
          teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          status,
          cacheDuration: '24 hours'
        });
        return 24 * 60 * 60 * 1000; // 24 hours for matches ended 2+ hours ago
      }

      // Recent matches (under 2 hours) get shorter cache (6 hours)
      if (hoursAgo <= 24) {
        console.log(`🕒 [FixtureCache] Recent match (${Math.round(hoursAgo * 60)}min ago), using short cache:`, {
          teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          status,
          cacheDuration: '6 hours'
        });
        return FIXTURE_CACHE_CONFIG.RECENT_FINISHED_CACHE_DURATION;
      }

      // Very old matches get longest cache (30 days)
      return FIXTURE_CACHE_CONFIG.OLD_FINISHED_CACHE_DURATION;
    }

    // Default cache duration
    return FIXTURE_CACHE_CONFIG.FUTURE_CACHE_DURATION;
  }

  /**
   * Determine cache duration based on fixture status and timing
   */
  private getCacheDuration(fixture: FixtureResponse): number {
    const now = Date.now();
    const fixtureDate = new Date(fixture.fixture.date).getTime();
    const status = fixture.fixture.status.short;

    // Live matches - NO CACHE (return 0 to force fresh fetch)
    if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
      return 0; // No caching for live matches
    }

    // Upcoming matches within 2 hours - short cache
    if (status === 'NS') {
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

    // Today gets moderate cache (2 hours) for live updates
    if (date === today) {
      return FIXTURE_CACHE_CONFIG.TODAY_CACHE_DURATION;
    }

    // Future dates get longer cache (4 hours) since they rarely change
    return FIXTURE_CACHE_CONFIG.FUTURE_CACHE_DURATION;
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
   * Check if a fixture is live and should bypass cache
   */
  private isLiveFixture(fixture: FixtureResponse): boolean {
    const status = fixture.fixture.status.short;
    const isLiveStatus = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status);

    // Also check if match started recently (within last 3 hours) even if status seems stale
    if (!isLiveStatus) {
      const fixtureTime = new Date(fixture.fixture.date).getTime();
      const now = Date.now();
      const hoursSinceKickoff = (now - fixtureTime) / (1000 * 60 * 60);

      // If match started within last 3 hours and status is NS, it might be stale cache
      if (status === 'NS' && hoursSinceKickoff > 0 && hoursSinceKickoff <= 3) {
        console.log(`🚨 [fixtureCache] Potential stale NS status for recent match:`, {
          teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          status,
          hoursSinceKickoff: Math.round(hoursSinceKickoff * 100) / 100,
          fixtureTime: new Date(fixture.fixture.date).toISOString()
        });
        return true; // Treat as live to bypass cache
      }
    }

    return isLiveStatus;
  }

  /**
   * Check if a fixture recently ended and should bypass cache
   */
  private isRecentlyEndedFixture(fixture: FixtureResponse): boolean {
    const status = fixture.fixture.status.short;
    const now = Date.now();
    const fixtureDate = new Date(fixture.fixture.date).getTime();
    const hoursAfterMatch = (now - fixtureDate) / (1000 * 60 * 60);

    return ['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(status) && hoursAfterMatch <= 3;
  }

  /**
   * Check if cached data is still valid
   */
  private isValidCache(cachedItem: CachedFixture): boolean {
    // Live fixtures should never use cache
    if (this.isLiveFixture(cachedItem.fixture)) {
      console.log(`🔴 [fixtureCache] Live fixture ${cachedItem.fixture.fixture.id} bypassing cache`);
      return false;
    }

    // Recently ended fixtures should never use cache
    if (this.isRecentlyEndedFixture(cachedItem.fixture)) {
      console.log(`🔄 [fixtureCache] Recently ended fixture ${cachedItem.fixture.fixture.id} bypassing cache`);
      return false;
    }

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
   * Cache a single fixture (but skip live and recently ended fixtures)
   */
  cacheFixture(fixture: FixtureResponse, source: string = 'api'): void {
    // Don't cache live fixtures - they need real-time updates
    if (this.isLiveFixture(fixture)) {
      console.log(`🔴 [fixtureCache] Skipping cache for live fixture ${fixture.fixture.id} (${fixture.fixture.status.short})`);
      return;
    }

    // Don't cache recently ended fixtures - they might still have updates
    if (this.isRecentlyEndedFixture(fixture)) {
      console.log(`🔄 [fixtureCache] Skipping cache for recently ended fixture ${fixture.fixture.id} (${fixture.fixture.status.short})`);
      return;
    }

    const key = this.generateKey(fixture.fixture.id);
    const cachedItem: CachedFixture = {
      fixture,
      timestamp: Date.now(),
      source
    };

    this.cache.set(key, cachedItem);
    this.stats.size = this.cache.size;

    console.log(`💾 [fixtureCache] Cached stable fixture ${fixture.fixture.id} (${source})`);
    this.cleanup();
  }

  /**
   * Cache fixtures for a specific date (excluding live and recently ended fixtures)
   */
  cacheFixturesForDate(date: string, fixtures: FixtureResponse[], source: string = 'api'): void {
    // Separate live, recently ended, and cacheable fixtures
    const liveFixtures = fixtures.filter(f => this.isLiveFixture(f));
    const recentlyEndedFixtures = fixtures.filter(f => this.isRecentlyEndedFixture(f));
    const cacheableFixtures = fixtures.filter(f => !this.isLiveFixture(f) && !this.isRecentlyEndedFixture(f));

    if (liveFixtures.length > 0) {
      console.log(`🔴 [fixtureCache] Skipping cache for ${liveFixtures.length} live fixtures in date ${date}`);
    }

    if (recentlyEndedFixtures.length > 0) {
      console.log(`🔄 [fixtureCache] Skipping cache for ${recentlyEndedFixtures.length} recently ended fixtures in date ${date}`);
    }

    if (cacheableFixtures.length === 0) {
      console.log(`⚠️ [fixtureCache] No cacheable fixtures for date ${date}`);
      return;
    }

    const key = this.generateKey(date, 'date', date);
    const cachedItem: CachedFixture = {
      fixture: cacheableFixtures as any,
      timestamp: Date.now(),
      source
    };

    this.cache.set(key, cachedItem);
    this.stats.size = this.cache.size;

    console.log(`💾 [fixtureCache] Cached ${cacheableFixtures.length} stable fixtures for date ${date} (${source}, skipped ${liveFixtures.length} live + ${recentlyEndedFixtures.length} recently ended)`);

    // Store in persistent cache if it's a past date with finished matches
    this.storeInPersistentCache(date, cacheableFixtures);

    // Also cache individual cacheable fixtures
    cacheableFixtures.forEach(fixture => {
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

  clearCache() {
    this.cache.clear();
    this.statusTransitions.clear();
    this.stats.size = 0;
    console.log('🗑️ [FixtureCache] Cache cleared');
  }

  /**
   * Clear cache for a specific date
   */
  clearCacheForDate(date: string) {
    const dateKey = this.generateKey(date, 'date', date);
    this.cache.delete(dateKey);

    // Also clear persistent storage for this date
    try {
      localStorage.removeItem(`finished_fixtures_${date}`);
      console.log(`🗑️ [FixtureCache] Cleared cache for date ${date}`);
    } catch (error) {
      console.error('Error clearing persistent cache for date:', error);
    }

    this.stats.size = this.cache.size;
  }

  /**
   * Track status transitions and invalidate related cache entries
   */
  trackStatusTransition(fixtureId: number, fromStatus: string, toStatus: string) {
    const transition: StatusTransition = {
      fixtureId,
      fromStatus,
      toStatus,
      timestamp: Date.now()
    };

    this.statusTransitions.set(fixtureId, transition);

    console.log(`🔄 [StatusTransition] Match ${fixtureId}: ${fromStatus} → ${toStatus}`);

    // Invalidate related cache entries when status changes
    this.invalidateCacheForStatusTransition(fixtureId, fromStatus, toStatus);
  }

  /**
   * Invalidate cache entries when match status transitions
   */
  private invalidateCacheForStatusTransition(fixtureId: number, fromStatus: string, toStatus: string) {
    const keysToInvalidate: string[] = [];

    // Find all cache keys that might contain this fixture
    for (const [key] of this.cache) {
      // Invalidate fixture-specific cache
      if (key.includes(`fixture-${fixtureId}`) || key.includes(`match-${fixtureId}`)) {
        keysToInvalidate.push(key);
      }

      // Invalidate date-based cache when transitioning from NS to LIVE
      if (fromStatus === 'NS' && ['LIVE', '1H', '2H', 'HT'].includes(toStatus)) {
        if (key.includes('fixtures-date') || key.includes('live-fixtures')) {
          keysToInvalidate.push(key);
        }
      }

      // Invalidate date-based cache when transitioning from LIVE to ended
      if (['LIVE', '1H', '2H', 'HT', 'ET'].includes(fromStatus) && ['FT', 'AET', 'PEN'].includes(toStatus)) {
        if (key.includes('fixtures-date') || key.includes('live-fixtures')) {
          keysToInvalidate.push(key);
        }
      }

      // Invalidate league-specific cache
      if (key.includes('league-') && (fromStatus === 'NS' || toStatus === 'FT')) {
        keysToInvalidate.push(key);
      }
    }

    // Remove invalidated cache entries
    keysToInvalidate.forEach(key => {
      this.cache.delete(key);
      console.log(`❌ [CacheInvalidation] Removed stale cache: ${key} (status: ${fromStatus} → ${toStatus})`);
    });

    if (keysToInvalidate.length > 0) {
      this.stats.size = this.cache.size;
      console.log(`🔄 [CacheInvalidation] Invalidated ${keysToInvalidate.length} cache entries for match ${fixtureId}`);
    }
  }

  /**
   * Get status transition for a fixture
   */
  getStatusTransition(fixtureId: number): StatusTransition | undefined {
    return this.statusTransitions.get(fixtureId);
  }

  /**
   * Check if a fixture has transitioned from upcoming to live
   */
  hasTransitionedToLive(fixtureId: number): boolean {
    const transition = this.statusTransitions.get(fixtureId);
    return transition ? 
      transition.fromStatus === 'NS' && 
      ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(transition.toStatus) : 
      false;
  }

  /**
   * Check if a fixture has transitioned from live to ended
   */
  hasTransitionedToEnded(fixtureId: number): boolean {
    const transition = this.statusTransitions.get(fixtureId);
    return transition ? 
      ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(transition.fromStatus) && 
      ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(transition.toStatus) : 
      false;
  }

  /**
   * Force refresh cache for fixtures that have changed status
   */
  invalidateTransitionedFixtures() {
    const now = Date.now();
    const staleTransitions: number[] = [];

    for (const [fixtureId, transition] of this.statusTransitions) {
      // Remove transitions older than 1 hour
      if (now - transition.timestamp > 60 * 60 * 1000) {
        staleTransitions.push(fixtureId);
      }
    }

    staleTransitions.forEach(fixtureId => {
      this.statusTransitions.delete(fixtureId);
    });

    if (staleTransitions.length > 0) {
      console.log(`🧹 [StatusTransition] Cleaned up ${staleTransitions.length} old transitions`);
    }
  }

    /**
   * Pre-cache data immediately when received from API
   */
  preCacheFixtures(date: string, fixtures: FixtureResponse[], source: string = 'api'): void {
    console.log(`🚀 [fixtureCache] Pre-caching ${fixtures.length} fixtures for ${date} from ${source}`);

    // Cache the full dataset
    this.cacheFixturesForDate(date, fixtures, source);

    // Also cache adjacent dates if there's timezone overlap
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    // Cache fixtures that might belong to adjacent dates due to timezone differences
    const yesterdayFixtures = fixtures.filter(f => {
      const fixtureDate = new Date(f.fixture.date).toISOString().slice(0, 10);
      return fixtureDate === yesterdayStr;
    });

    const tomorrowFixtures = fixtures.filter(f => {
      const fixtureDate = new Date(f.fixture.date).toISOString().slice(0, 10);
      return fixtureDate === tomorrowStr;
    });

    if (yesterdayFixtures.length > 0) {
      console.log(`📅 [fixtureCache] Pre-caching ${yesterdayFixtures.length} fixtures for ${yesterdayStr} (timezone overlap)`);
      this.cacheFixturesForDate(yesterdayStr, yesterdayFixtures, `${source}_timezone_overlap`);
    }

    if (tomorrowFixtures.length > 0) {
      console.log(`📅 [fixtureCache] Pre-caching ${tomorrowFixtures.length} fixtures for ${tomorrowStr} (timezone overlap)`);
      this.cacheFixturesForDate(tomorrowStr, tomorrowFixtures, `${source}_timezone_overlap`);
    }
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

  /**
   * Check if we need fresh data for a date (improved logic)
   */
  shouldFetchFresh(date: string): boolean {
    const today = new Date().toISOString().slice(0, 10);
    const cached = this.getCachedFixturesForDate(date);

    // If no cache exists, we need fresh data
    if (!cached) {
      console.log(`🔍 [fixtureCache] No cache found for ${date}, fetching fresh data`);
      return true;
    }

    // CRITICAL: Validate all cached fixtures actually belong to the requested date
    const dateMatchedFixtures = cached.filter(fixture => {
      const fixtureDate = new Date(fixture.fixture.date);
      const fixtureDateString = fixtureDate.toISOString().slice(0, 10);
      return fixtureDateString === date;
    });

    if (dateMatchedFixtures.length !== cached.length) {
      console.log(`🚨 [fixtureCache] Date contamination detected - ${cached.length - dateMatchedFixtures.length} fixtures don't match date ${date}, clearing cache`);
      this.clearCacheForDate(date);
      return true;
    }

    // CRITICAL: Check for invalid NS status on past dates
    if (date < today) {
      const hasInvalidNSMatches = cached.some(fixture => {
        const status = fixture.fixture.status.short;
        const fixtureTime = new Date(fixture.fixture.date).getTime();
        const now = Date.now();
        const hoursAfterFixture = (now - fixtureTime) / (1000 * 60 * 60);

        // If match is NS but should have finished (past date + time passed), force refresh
        if (status === 'NS' && hoursAfterFixture > 2) {
          console.log(`🚨 [fixtureCache] Invalid NS status for past match on ${date}:`, {
            teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
            status,
            hoursAfterFixture: Math.round(hoursAfterFixture),
            fixtureTime: new Date(fixture.fixture.date).toISOString()
          });
          return true;
        }
        return false;
      });

      if (hasInvalidNSMatches) {
        console.log(`🔄 [fixtureCache] Found invalid NS matches for past date ${date}, forcing fresh fetch`);
        this.clearCacheForDate(date);
        return true;
      }
    }

    // Check if any cached fixtures might have transitioned to live status
    const hasUpcomingMatches = cached.some(fixture => {
      const status = fixture.fixture.status.short;
      const fixtureTime = new Date(fixture.fixture.date).getTime();
      const now = Date.now();
      const minutesUntilKickoff = (fixtureTime - now) / (1000 * 60);

      // If match was upcoming and kickoff time is near or passed, force refresh
      return status === 'NS' && minutesUntilKickoff <= 15; // 15 minutes before kickoff
    });

    if (hasUpcomingMatches) {
      console.log(`🔄 [fixtureCache] Found upcoming matches near kickoff time for ${date}, forcing fresh fetch`);
      return true;
    }

    // Past dates: be more lenient with cache but not for data integrity issues
    if (date < today) {
      const cacheKey = this.generateKey(date, 'date', date);
      const cachedItem = this.cache.get(cacheKey);

      if (cachedItem) {
        const cacheAge = Date.now() - cachedItem.timestamp;
        const isVeryOld = cacheAge > FIXTURE_CACHE_CONFIG.PAST_DATE_CACHE_DURATION;

        if (isVeryOld) {
          console.log(`⏰ [fixtureCache] Past date ${date} cache very old (${Math.round(cacheAge / 60000)}min), fetching fresh`);
          return true;
        }
      }

      console.log(`✅ [fixtureCache] Using existing cache for past date ${date} (data integrity verified)`);
      return false; // We have cache and it's a past date, don't fetch
    }

    // For today and future dates, check cache age more strictly
    const cacheKey = this.generateKey(date, 'date', date);
    const cachedItem = this.cache.get(cacheKey);

    if (cachedItem) {
      const cacheAge = Date.now() - cachedItem.timestamp;
      const maxAge = date === today ? 
        FIXTURE_CACHE_CONFIG.TODAY_CACHE_DURATION : 
        FIXTURE_CACHE_CONFIG.FUTURE_CACHE_DURATION;

      const needsFresh = cacheAge >= maxAge;
      console.log(`🕒 [fixtureCache] Cache age check for ${date}: ${Math.round(cacheAge / 60000)}min (max: ${Math.round(maxAge / 60000)}min) - ${needsFresh ? 'FETCH FRESH' : 'USE CACHE'}`);
      return needsFresh;
    }

    return true;
  }

  /**
   * Set a cache entry
   */
  set(key: string, data: any, ttl?: number) {
    const expiresAt = ttl ? Date.now() + ttl : undefined;

    // Extract status if data contains fixture information
    let status: string | undefined;
    if (data && typeof data === 'object') {
      if (Array.isArray(data)) {
        // For arrays of fixtures, we don't track individual statuses here
        status = undefined;
      } else if (data.fixture?.status?.short) {
        status = data.fixture.status.short;
      }
    }

    this.cache.set(key, { 
      fixture: data, 
      timestamp: Date.now(), 
      source: 'api'
    });
    this.stats.size = this.cache.size;
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