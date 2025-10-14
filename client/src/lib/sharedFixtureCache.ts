import { queryClient } from './queryClient';

interface CachedFixtureData {
  data: any[];
  timestamp: number;
  source: string;
}

export class SharedFixtureCache {
  private static instance: SharedFixtureCache;

  static getInstance(): SharedFixtureCache {
    if (!SharedFixtureCache.instance) {
      SharedFixtureCache.instance = new SharedFixtureCache();
    }
    return SharedFixtureCache.instance;
  }

  /**
   * Get fixtures for a date with fallback chain:
   * 1. React Query cache
   * 2. localStorage cache
   * 3. null (trigger fetch)
   */
  getFixtures(selectedDate: string): any[] | null {
    if (!selectedDate) return null;

    console.log(`🔍 [SharedFixtureCache] Looking for fixtures: ${selectedDate}`);

    // First try React Query cache
    const queryClient = window.__REACT_QUERY_CLIENT__;
    if (queryClient) {
      const cachedData = queryClient.getQueryData(["all-fixtures-by-date", selectedDate]);
      if (cachedData && Array.isArray(cachedData)) {
        console.log(`✅ [SharedFixtureCache] React Query cache hit for ${selectedDate} (${cachedData.length} fixtures)`);
        return cachedData;
      }
    }

    // Try localStorage cache
    try {
      const stored = localStorage.getItem(`fixtures_cache_${selectedDate}`);
      if (stored) {
        const parsed: CachedFixtureData = JSON.parse(stored);
        const age = Date.now() - parsed.timestamp;
        const maxAge = 60 * 60 * 1000; // 1 hour

        if (age < maxAge && Array.isArray(parsed.data)) {
          console.log(`📂 [SharedFixtureCache] localStorage hit for ${selectedDate} (${parsed.data.length} fixtures, age: ${Math.round(age / 60000)}min, source: ${parsed.source})`);

          // Populate React Query cache for future use
          if (queryClient) {
            queryClient.setQueryData(["all-fixtures-by-date", selectedDate], parsed.data);
          }

          return parsed.data;
        } else {
          console.log(`⏰ [SharedFixtureCache] localStorage cache expired for ${selectedDate}`);
          localStorage.removeItem(`fixtures_cache_${selectedDate}`);
        }
      }
    } catch (error) {
      console.warn('[SharedFixtureCache] Error reading localStorage:', error);
    }

    console.log(`❌ [SharedFixtureCache] No cache found for ${selectedDate}`);
    return null;
  }

  /**
   * Store fixtures in both React Query and localStorage
   */
  setFixtures(selectedDate: string, fixtures: any[], source: string = 'unknown'): void {
    if (!selectedDate || !Array.isArray(fixtures)) return;

    console.log(`💾 [SharedFixtureCache] Storing ${fixtures.length} fixtures for ${selectedDate} (source: ${source})`);

    // Store in React Query cache
    const queryClient = window.__REACT_QUERY_CLIENT__;
    if (queryClient) {
      queryClient.setQueryData(["all-fixtures-by-date", selectedDate], fixtures);
    }

    // Store in localStorage
    try {
      const cacheData: CachedFixtureData = {
        data: fixtures,
        timestamp: Date.now(),
        source
      };
      localStorage.setItem(`fixtures_cache_${selectedDate}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('[SharedFixtureCache] Error storing in localStorage:', error);
    }
  }

  /**
   * Check if we have valid cache for a date
   */
  hasValidCache(selectedDate: string): boolean {
    return this.getFixtures(selectedDate) !== null;
  }

  /**
   * Clear cache for a specific date
   */
  clearCache(selectedDate: string): void {
    console.log(`🗑️ [SharedFixtureCache] Clearing cache for ${selectedDate}`);

    // Clear React Query cache
    const queryClient = window.__REACT_QUERY_CLIENT__;
    if (queryClient) {
      queryClient.removeQueries({ queryKey: ["all-fixtures-by-date", selectedDate] });
    }

    // Clear localStorage
    try {
      localStorage.removeItem(`fixtures_cache_${selectedDate}`);
    } catch (error) {
      console.warn('[SharedFixtureCache] Error clearing localStorage:', error);
    }
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats(): { reactQueryEntries: number; localStorageEntries: number } {
    let reactQueryEntries = 0;
    let localStorageEntries = 0;

    // Count React Query entries
    const queryClient = window.__REACT_QUERY_CLIENT__;
    if (queryClient) {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      reactQueryEntries = queries.filter(q => 
        q.queryKey[0] === "all-fixtures-by-date"
      ).length;
    }

    // Count localStorage entries
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fixtures_cache_')) {
          localStorageEntries++;
        }
      }
    } catch (error) {
      // localStorage might not be available
    }

    return { reactQueryEntries, localStorageEntries };
  }

  /**
   * Preload fixtures for adjacent dates
   */
  async preloadAdjacentDates(selectedDate: string): Promise<void> {
    const date = new Date(selectedDate);
    const yesterday = new Date(date);
    yesterday.setDate(date.getDate() - 1);
    const tomorrow = new Date(date);
    tomorrow.setDate(date.getDate() + 1);

    const adjacentDates = [
      yesterday.toISOString().split('T')[0],
      tomorrow.toISOString().split('T')[0]
    ];

    console.log(`🔄 [SharedFixtureCache] Preloading adjacent dates for ${selectedDate}:`, adjacentDates);

    const preloadPromises = adjacentDates.map(async (date) => {
      if (!this.hasValidCache(date)) {
        try {
          const response = await fetch(`/api/fixtures/date/${date}?all=true`);
          if (response.ok) {
            const fixtures = await response.json();
            if (Array.isArray(fixtures)) {
              this.setFixtures(date, fixtures, 'preload');
            }
          }
        } catch (error) {
          console.warn(`[SharedFixtureCache] Failed to preload ${date}:`, error);
        }
      }
    });

    await Promise.allSettled(preloadPromises);
  }
}

// Export singleton instance
export const sharedFixtureCache = SharedFixtureCache.getInstance();

// Export hook for React components
export const useSharedFixtureCache = (selectedDate: string) => {
  return {
    getCachedFixtures: () => sharedFixtureCache.getFixtures(selectedDate),
    setCachedFixtures: (fixtures: any[], source?: string) => 
      sharedFixtureCache.setFixtures(selectedDate, fixtures, source),
    hasCache: () => sharedFixtureCache.hasValidCache(selectedDate),
    clearCache: () => sharedFixtureCache.clearCache(selectedDate),
    preloadAdjacent: () => sharedFixtureCache.preloadAdjacentDates(selectedDate),
  };
};