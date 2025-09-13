
/**
 * Shared fixtures cache utility for immediate data reuse across components
 * Used by TodaysMatchesByCountryNew, MyAllLeagueList, and other date-based components
 */

interface CachedFixturesData {
  fixtures: any[];
  timestamp: number;
  date: string;
}

class SharedFixturesCache {
  private memoryCache = new Map<string, CachedFixturesData>();

  /**
   * Get cached fixtures for a date from multiple cache layers
   */
  getCachedFixtures(date: string): any[] | null {
    // 1. Try memory cache first (fastest)
    const memoryCached = this.memoryCache.get(date);
    if (memoryCached && this.isValidCache(memoryCached, date)) {
      console.log(`⚡ [SharedCache] Memory cache hit for ${date} (${memoryCached.fixtures.length} fixtures)`);
      return memoryCached.fixtures;
    }

    // 2. Try session storage (immediate access)
    try {
      const sessionCached = sessionStorage.getItem(`session_fixtures_${date}`);
      if (sessionCached) {
        const data: CachedFixturesData = JSON.parse(sessionCached);
        if (this.isValidCache(data, date)) {
          // Store back in memory cache
          this.memoryCache.set(date, data);
          console.log(`🔥 [SharedCache] Session cache hit for ${date} (${data.fixtures.length} fixtures)`);
          return data.fixtures;
        }
      }
    } catch (error) {
      // Ignore session storage errors
    }

    // 3. Try localStorage (persistent cache)
    try {
      const localCached = localStorage.getItem(`shared_fixtures_${date}`);
      if (localCached) {
        const data: CachedFixturesData = JSON.parse(localCached);
        if (this.isValidCache(data, date)) {
          // Store back in memory and session cache
          this.memoryCache.set(date, data);
          try {
            sessionStorage.setItem(`session_fixtures_${date}`, JSON.stringify(data));
          } catch (e) {
            // Ignore session storage errors
          }
          console.log(`💾 [SharedCache] localStorage cache hit for ${date} (${data.fixtures.length} fixtures)`);
          return data.fixtures;
        }
      }
    } catch (error) {
      // Ignore localStorage errors
    }

    console.log(`❌ [SharedCache] No valid cache found for ${date}`);
    return null;
  }

  /**
   * Store fixtures in all cache layers
   */
  storeFixtures(date: string, fixtures: any[]): void {
    if (!fixtures || fixtures.length === 0) return;

    const cacheData: CachedFixturesData = {
      fixtures,
      timestamp: Date.now(),
      date
    };

    // Store in memory cache
    this.memoryCache.set(date, cacheData);

    // Store in session storage
    try {
      sessionStorage.setItem(`session_fixtures_${date}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to store in session storage:', error);
    }

    // Store in localStorage
    try {
      localStorage.setItem(`shared_fixtures_${date}`, JSON.stringify(cacheData));
      console.log(`✅ [SharedCache] Stored ${fixtures.length} fixtures for ${date} in all cache layers`);
    } catch (error) {
      console.warn('Failed to store in localStorage:', error);
    }
  }

  /**
   * Check if cached data is still valid
   */
  private isValidCache(data: CachedFixturesData, requestedDate: string): boolean {
    // Ensure date matches
    if (data.date !== requestedDate) {
      return false;
    }

    const age = Date.now() - data.timestamp;
    const today = new Date().toISOString().slice(0, 10);
    
    // Different cache durations based on date
    const maxAge = requestedDate === today ? 
      30 * 60 * 1000 : // 30 minutes for today
      24 * 60 * 60 * 1000; // 24 hours for other dates

    return age < maxAge;
  }

  /**
   * Clear cache for a specific date
   */
  clearDateCache(date: string): void {
    this.memoryCache.delete(date);
    
    try {
      sessionStorage.removeItem(`session_fixtures_${date}`);
      localStorage.removeItem(`shared_fixtures_${date}`);
      console.log(`🗑️ [SharedCache] Cleared all caches for ${date}`);
    } catch (error) {
      // Ignore storage errors
    }
  }

  /**
   * Clear all expired caches
   */
  cleanupExpiredCaches(): void {
    const now = Date.now();
    let cleanedCount = 0;

    // Clean memory cache
    for (const [date, data] of this.memoryCache.entries()) {
      if (!this.isValidCache(data, date)) {
        this.memoryCache.delete(date);
        cleanedCount++;
      }
    }

    // Clean localStorage (check all stored dates)
    try {
      const keys = Object.keys(localStorage);
      const fixtureKeys = keys.filter(key => key.startsWith('shared_fixtures_'));
      
      for (const key of fixtureKeys) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp && !this.isValidCache(data, data.date)) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (e) {
          // Remove invalid entries
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    } catch (error) {
      // Ignore localStorage errors
    }

    if (cleanedCount > 0) {
      console.log(`🧹 [SharedCache] Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const memorySize = this.memoryCache.size;
    let localStorageSize = 0;
    let sessionStorageSize = 0;

    try {
      const keys = Object.keys(localStorage);
      localStorageSize = keys.filter(key => key.startsWith('shared_fixtures_')).length;
    } catch (e) {
      // Ignore
    }

    try {
      const keys = Object.keys(sessionStorage);
      sessionStorageSize = keys.filter(key => key.startsWith('session_fixtures_')).length;
    } catch (e) {
      // Ignore
    }

    return {
      memorySize,
      localStorageSize,
      sessionStorageSize,
      totalEntries: memorySize + localStorageSize + sessionStorageSize
    };
  }
}

// Export singleton instance
export const sharedFixturesCache = new SharedFixturesCache();

// Cleanup expired caches on load
sharedFixturesCache.cleanupExpiredCaches();

// Helper functions for easy import
export const getCachedFixtures = (date: string) => sharedFixturesCache.getCachedFixtures(date);
export const storeFixtures = (date: string, fixtures: any[]) => sharedFixturesCache.storeFixtures(date, fixtures);
export const clearDateCache = (date: string) => sharedFixturesCache.clearDateCache(date);
