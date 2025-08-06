import React from 'react';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './utils';
import { CACHE_DURATIONS } from './cacheConfig';
import { fixtureCache } from './fixtureCache';

// Standing types
interface TeamStanding {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
}

interface LeagueStandings {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    standings: TeamStanding[][];
  };
}

interface BatchStandingsRequest {
  leagueIds: number[];
  season?: number;
}

interface BatchStandingsResponse {
  [leagueId: number]: LeagueStandings | null;
}

// Cache configuration for standings - 4 hours as requested
const STANDINGS_CACHE_CONFIG = {
  staleTime: 4 * 60 * 60 * 1000, // 4 hours
  gcTime: 8 * 60 * 60 * 1000, // 8 hours (keep in memory longer)
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

// localStorage cache manager for standings
const STANDINGS_STORAGE_KEY = 'standings_cache';
// Cache configuration - reduced for space efficiency
const CACHE_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes (reduced from 2 hours)
const MAX_CACHE_SIZE = 20; // Maximum number of entries in memory cache (reduced from 50)

interface CachedStandingsItem {
  data: LeagueStandings;
  timestamp: number;
  leagueId: number;
  season: number;
}

interface StandingsStorageCache {
  [key: string]: CachedStandingsItem;
}

// Get popular leagues from TodayPopularFootballLeaguesNew cached data
const getPopularLeaguesFromCache = (): number[] => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Try to get cached fixture data to extract league IDs
    const cachedFixtures = fixtureCache.getCachedFixturesForDate(today);

    if (cachedFixtures && Array.isArray(cachedFixtures)) {
      // Extract unique league IDs from cached fixtures
      const leagueIds = [...new Set(
        cachedFixtures
          .filter(fixture => fixture?.league?.id)
          .map(fixture => fixture.league.id)
      )];

      console.log(`📊 [StandingsCache] Found ${leagueIds.length} leagues from TodayPopularLeagueNew cache`);
      return leagueIds.length > 0 ? leagueIds : [];
    }

    // Return empty array instead of fallback leagues to prevent automatic fetching
    console.log(`⚠️ [StandingsCache] No cached data from TodayPopularLeagueNew, returning empty array`);
    return [];
  } catch (error) {
    console.error('Error getting popular leagues from cache:', error);
    return []; // Return empty array instead of fallback leagues
  }
};

// Dynamic popular leagues based on TodayPopularLeagueNew data - will be empty initially
const POPULAR_LEAGUES = getPopularLeaguesFromCache();

class StandingsCache {
  private static instance: StandingsCache;
  private batchCache = new Map<string, Promise<BatchStandingsResponse>>();
  private individualCache = new Map<string, Promise<LeagueStandings | null>>();
  private memoryCache = new Map<string, CachedStandingsItem>();

  static getInstance(): StandingsCache {
    if (!StandingsCache.instance) {
      StandingsCache.instance = new StandingsCache();
      // Load cache from localStorage on initialization
      StandingsCache.instance.loadFromStorage();
    }
    return StandingsCache.instance;
  }

  // Load standings cache from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STANDINGS_STORAGE_KEY);
      if (stored) {
        const cache: StandingsStorageCache = JSON.parse(stored);
        const now = Date.now();

        let loadedCount = 0;
        Object.entries(cache).forEach(([key, item]) => {
          // Only load non-expired items
          if (now - item.timestamp < CACHE_EXPIRY_TIME) {
            // Ensure we don't exceed MAX_CACHE_SIZE during initial load
            if (this.memoryCache.size < MAX_CACHE_SIZE) {
              this.memoryCache.set(key, item);
              loadedCount++;
            } else {
              console.log(`⚠️ [StandingsCache] Max cache size reached (${MAX_CACHE_SIZE}), skipping item: ${key}`);
            }
          }
        });

        console.log(`🏆 Loaded ${loadedCount} standings from localStorage cache`);
        this.logCacheStats();
      }
    } catch (error) {
      console.error('Error loading standings cache from localStorage:', error);
      // If loading fails or storage is full, clear it to prevent further issues
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded during load. Clearing cache.');
        this.clearCache();
      }
    }
  }

  // Save standings cache to localStorage
  private saveToStorage(): void {
    try {
      const cacheObject: StandingsStorageCache = {};
      let itemCount = 0;
      // Iterate over memoryCache and add to cacheObject, respecting MAX_CACHE_SIZE
      this.memoryCache.forEach((item, key) => {
        if (itemCount < MAX_CACHE_SIZE) {
          cacheObject[key] = item;
          itemCount++;
        } else {
          // If we exceed the limit, stop adding
          return;
        }
      });
      localStorage.setItem(STANDINGS_STORAGE_KEY, JSON.stringify(cacheObject));
      console.log(`💾 Saved ${itemCount} standings to localStorage cache`);
    } catch (error) {
      console.error('Error saving standings cache to localStorage:', error);
      // Handle QuotaExceededError specifically to prune the cache
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded during save. Attempting to prune cache.');
        this.pruneCache();
        // Attempt to save again after pruning
        try {
          const cacheObject: StandingsStorageCache = {};
          let itemCount = 0;
          this.memoryCache.forEach((item, key) => {
            if (itemCount < MAX_CACHE_SIZE) {
              cacheObject[key] = item;
              itemCount++;
            } else {
              return;
            }
          });
          localStorage.setItem(STANDINGS_STORAGE_KEY, JSON.stringify(cacheObject));
          console.log(`💾 Successfully re-saved ${itemCount} standings after pruning.`);
        } catch (retryError) {
          console.error('Failed to save cache even after pruning:', retryError);
        }
      }
    }
  }

  // Prune the cache if it exceeds MAX_CACHE_SIZE
  private pruneCache(): void {
    if (this.memoryCache.size > MAX_CACHE_SIZE) {
      console.warn(`Pruning cache: current size ${this.memoryCache.size}, max size ${MAX_CACHE_SIZE}`);
      const sortedEntries = Array.from(this.memoryCache.entries()).sort(([, a], [, b]) => a.timestamp - b.timestamp);
      const entriesToRemove = this.memoryCache.size - MAX_CACHE_SIZE;

      for (let i = 0; i < entriesToRemove; i++) {
        const [keyToRemove] = sortedEntries[i];
        this.memoryCache.delete(keyToRemove);
        console.log(`Pruned oldest cache entry: ${keyToRemove}`);
      }
      console.log(`Cache pruned. New size: ${this.memoryCache.size}`);
    }
  }

  // Get cached standings from memory/localStorage - only return fresh cache here
  private getCachedStandings(leagueId: number, season?: number): LeagueStandings | null {
    const cacheKey = this.getStandingsKey(leagueId, season);
    const cached = this.memoryCache.get(cacheKey);

    if (cached) {
      const now = Date.now();
      const age = now - cached.timestamp;

      if (age < CACHE_EXPIRY_TIME) {
        console.log(`🏆 Cache hit for standings league ${leagueId} (age: ${Math.floor(age / 60000)} min)`);
        return cached.data;
      } else {
        console.log(`⏰ Expired standings cache for league ${leagueId} (age: ${Math.floor(age / 60000)} min)`);
        // Optionally remove expired item from memory cache here to free up memory
        // this.memoryCache.delete(cacheKey);
      }
    } else {
      console.log(`❌ Cache miss for standings league ${leagueId}`);
    }

    return null;
  }

  // Set cached standings in memory and localStorage
  private setCachedStandings(leagueId: number, data: LeagueStandings, season?: number): void {
    const cacheKey = this.getStandingsKey(leagueId, season);
    const currentYear = new Date().getFullYear();
    const targetSeason = season || currentYear;

    const cacheItem: CachedStandingsItem = {
      data,
      timestamp: Date.now(),
      leagueId,
      season: targetSeason,
    };

    // Before adding, check if we need to prune
    if (this.memoryCache.size >= MAX_CACHE_SIZE) {
      console.log(`Cache full (${this.memoryCache.size}/${MAX_CACHE_SIZE}), pruning before adding new item.`);
      this.pruneCache();
    }

    this.memoryCache.set(cacheKey, cacheItem);

    // Save to storage to persist the cache
    this.saveToStorage();
  }

  // Log cache statistics
  private logCacheStats(): void {
    const now = Date.now();
    const stats = {
      total: this.memoryCache.size,
      fresh: 0,
      expired: 0,
    };

    this.memoryCache.forEach((item) => {
      const age = now - item.timestamp;
      if (age < CACHE_EXPIRY_TIME) {
        stats.fresh++;
      } else {
        stats.expired++;
      }
    });

    console.log(`🏆 Standings Cache Stats:`, stats);

    if (stats.total > 0) {
      const details = Array.from(this.memoryCache.entries()).map(([key, item]) => {
        const age = Math.floor((now - item.timestamp) / 60000);
        return {
          league: item.data.league.name,
          leagueId: item.leagueId,
          season: item.season,
          age: `${age} min`
        };
      });
      console.log(`📊 Standings Cache Details:`, details.slice(0, 10)); // Show first 10
    }
  }

  // Generate consistent cache keys
  private getStandingsKey(leagueId: number, season?: number): string {
    const currentYear = new Date().getFullYear();
    const targetSeason = season || currentYear;
    return `standings-${leagueId}-${targetSeason}`;
  }

  private getBatchKey(leagueIds: number[], season?: number): string {
    const currentYear = new Date().getFullYear();
    const targetSeason = season || currentYear;
    const sortedIds = [...leagueIds].sort((a, b) => a - b);
    return `batch-standings-${sortedIds.join(',')}-${targetSeason}`;
  }

  // Fetch individual league standings
  async fetchLeagueStandings(leagueId: number, season?: number): Promise<LeagueStandings | null> {
    const cacheKey = this.getStandingsKey(leagueId, season);

    if (this.individualCache.has(cacheKey)) {
      return this.individualCache.get(cacheKey)!;
    }

    const promise = this.performIndividualFetch(leagueId, season);
    this.individualCache.set(cacheKey, promise);

    // Clean up cache after some time
    setTimeout(() => {
      this.individualCache.delete(cacheKey);
    }, STANDINGS_CACHE_CONFIG.staleTime);

    return promise;
  }

  private async performIndividualFetch(leagueId: number, season?: number): Promise<LeagueStandings | null> {
    // Validate league ID before making API call
    if (!leagueId || leagueId <= 0 || typeof leagueId !== 'number') {
      console.warn(`Invalid league ID provided: ${leagueId}`);
      return null;
    }

    const cacheKey = this.getStandingsKey(leagueId, season);

    // PRIORITY 1: Check fresh cache first
    const cached = this.getCachedStandings(leagueId, season);
    if (cached) {
      console.log(`🎯 Using fresh cached standings for league ${leagueId} - no API call needed`);
      return cached;
    }

    // PRIORITY 2: Check if we have ANY cached data (even expired) for popular leagues
    const isPopularLeague = [2, 3, 39, 140, 135, 78, 848, 15].includes(leagueId);
    const anyCached = this.memoryCache.get(cacheKey);

    if (anyCached && isPopularLeague) {
      const age = Date.now() - anyCached.timestamp;
      const ageHours = Math.floor(age / (60 * 60 * 1000));
      console.log(`🏆 Using expired cache for popular league ${leagueId} (age: ${ageHours}h) to avoid API strain`);
      return anyCached.data;
    }

    // PRIORITY 3: For popular leagues without any cache, refetch the popular league standings data
    if (isPopularLeague && !anyCached) {
      console.log(`⚠️ Popular league ${leagueId} has no cached data - proceeding with cautious API call`);
    }

    try {
      console.log(`🔍 Fetching fresh standings for league ${leagueId} (season: ${season || 'current'})`);

      const response = await apiRequest('GET', `/api/leagues/${leagueId}/standings`, {
        params: season ? { season } : undefined,
        timeout: 15000 // Increased timeout to 15 seconds
      });

      // Check for network connectivity issues first
      if (response.status === 0 || !response.ok) {
        const isNetworkError = response.status === 0;
        const errorType = isNetworkError ? 'Network connectivity' : 'API error';

        console.warn(`🌐 ${errorType} for league ${leagueId} (status: ${response.status})`);

        // For network errors or API failures, always use cached data if available (regardless of age)
        if (anyCached) {
          const age = Date.now() - anyCached.timestamp;
          const ageHours = Math.floor(age / (60 * 60 * 1000));
          console.log(`🔄 Using cached data for league ${leagueId} (age: ${ageHours}h) due to ${errorType.toLowerCase()}`);
          return anyCached.data;
        }

        // If no cache available but this is a popular league, provide minimal fallback data
        if (isPopularLeague) {
          const leagueNames = {
            39: 'Premier League',
            140: 'La Liga',
            135: 'Serie A',
            78: 'Bundesliga',
            61: 'Ligue 1',
            2: 'UEFA Champions League',
            3: 'UEFA Europa League'
          };

          console.warn(`🏆 Creating minimal fallback data for popular league ${leagueId}`);
          return {
            league: {
              id: leagueId,
              name: leagueNames[leagueId] || `League ${leagueId}`,
              country: 'Unknown',
              logo: '',
              flag: '',
              season: new Date().getFullYear(),
              standings: [[]]
            }
          };
        }

        // If no cache available, return null
        console.warn(`❌ No cached data available for league ${leagueId} and ${errorType.toLowerCase()}`);
        return null;
      }



      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.warn(`❌ Failed to parse JSON response for league ${leagueId}:`, jsonError);

        // If we have any cached data, use it as fallback
        if (anyCached) {
          console.log(`🔄 Falling back to expired cache for league ${leagueId} due to JSON parse error`);
          return anyCached.data;
        }

        return null;
      }

      // Check if the response indicates an error
      if (data.error) {
        console.warn(`API returned error for league ${leagueId}:`, data.message);

        // If we have any cached data, use it as fallback
        if (anyCached) {
          console.log(`🔄 Falling back to expired cache for league ${leagueId} due to API error`);
          return anyCached.data;
        }

        return null;
      }

      // Validate response structure
      if (!data || !data.league || !data.league.standings) {
        console.warn(`⚠️ API returned invalid data structure for league ${leagueId}`);

        // If we have any cached data, use it as fallback
        if (anyCached) {
          console.log(`🔄 Falling back to expired cache for league ${leagueId} due to invalid API response`);
          return anyCached.data;
        }

        return null;
      }

      // Cache the fetched data
      this.setCachedStandings(leagueId, data, season);
      console.log(`✅ Successfully fetched and cached standings for league ${leagueId} (${data.league.name}) - ${data.league.standings?.[0]?.length || 0} teams`);

      return data;
    } catch (error) {
      console.error(`Error fetching standings for league ${leagueId}:`, error);

      // If we have any cached data (even expired), use it as fallback
      if (anyCached) {
        const age = Date.now() - anyCached.timestamp;
        const ageHours = Math.floor(age / (60 * 60 * 1000));
        console.log(`🔄 Falling back to expired cache for league ${leagueId} (age: ${ageHours}h) due to API error`);
        return anyCached.data;
      }

      return null;
    }
  }

  // Batch fetch multiple league standings
  async fetchBatchStandings(leagueIds: number[], season?: number): Promise<BatchStandingsResponse> {
    const cacheKey = this.getBatchKey(leagueIds, season);

    if (this.batchCache.has(cacheKey)) {
      return this.batchCache.get(cacheKey)!;
    }

    const promise = this.performBatchFetch(leagueIds, season);
    this.batchCache.set(cacheKey, promise);

    // Clean up cache after some time
    setTimeout(() => {
      this.batchCache.delete(cacheKey);
    }, STANDINGS_CACHE_CONFIG.staleTime);

    return promise;
  }

  private async performBatchFetch(leagueIds: number[], season?: number): Promise<BatchStandingsResponse> {
    console.log(`🔄 Batch fetching standings for leagues: ${leagueIds.join(', ')}`);

    const results: BatchStandingsResponse = {};
    const batchSize = 3; // Process in smaller batches to avoid overwhelming the API

    for (let i = 0; i < leagueIds.length; i += batchSize) {
      const batch = leagueIds.slice(i, i + batchSize);

      // Add small delay between batches
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const batchPromises = batch.map(async (leagueId) => {
        try {
          const standings = await this.performIndividualFetch(leagueId, season);
          return { leagueId, standings };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Error in batch fetch for league ${leagueId}: ${errorMsg}`);

          // Check if we have any cached data for this league as fallback
          const cacheKey = this.getStandingsKey(leagueId, season);
          const cachedData = this.memoryCache.get(cacheKey);

          if (cachedData) {
            const age = Date.now() - cachedData.timestamp;
            const ageHours = Math.floor(age / (60 * 60 * 1000));
            console.log(`🔄 Using cached data for league ${leagueId} in batch (age: ${ageHours}h) due to fetch error`);
            return { leagueId, standings: cachedData.data };
          }

          return { leagueId, standings: null };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      batchResults.forEach(({ leagueId, standings }) => {
        results[leagueId] = standings;
      });
    }

    console.log(`✅ Batch fetch completed for ${leagueIds.length} leagues`);
    return results;
  }

  // Sort standings by various criteria
  sortStandings(standings: TeamStanding[], sortBy: 'points' | 'goalsDiff' | 'rank' = 'rank'): TeamStanding[] {
    return [...standings].sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return b.points - a.points;
        case 'goalsDiff':
          return b.goalsDiff - a.goalsDiff;
        case 'rank':
        default:
          return a.rank - b.rank;
      }
    });
  }

  // Filter standings by position range
  filterStandingsByPosition(standings: TeamStanding[], start: number, end: number): TeamStanding[] {
    return standings.filter(team => team.rank >= start && team.rank <= end);
  }

  // Get top teams from standings
  getTopTeams(standings: TeamStanding[], count: number = 10): TeamStanding[] {
    return this.sortStandings(standings, 'rank').slice(0, count);
  }

  // Get relegated teams (bottom N teams)
  getRelegatedTeams(standings: TeamStanding[], count: number = 3): TeamStanding[] {
    const sorted = this.sortStandings(standings, 'rank');
    return sorted.slice(-count);
  }

  // Clear all caches
  clearCache(): void {
    this.batchCache.clear();
    this.individualCache.clear();
    this.memoryCache.clear();

    try {
      localStorage.removeItem(STANDINGS_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing standings localStorage:', error);
    }

    console.log('🧹 Standings cache cleared (memory + localStorage)');
  }

  // Get cache statistics for debugging
  getCacheStats(): {
    total: number;
    fresh: number;
    expired: number;
    details: Array<{league: string; leagueId: number; season: number; age: string}>;
  } {
    const now = Date.now();
    const stats = {
      total: this.memoryCache.size,
      fresh: 0,
      expired: 0,
      details: [] as Array<{league: string; leagueId: number; season: number; age: string}>,
    };

    this.memoryCache.forEach((item) => {
      const age = now - item.timestamp;
      const ageMinutes = Math.floor(age / 60000);

      if (age < CACHE_EXPIRY_TIME) {
        stats.fresh++;
      } else {
        stats.expired++;
      }

      stats.details.push({
        league: item.data.league.name,
        leagueId: item.leagueId,
        season: item.season,
        age: `${ageMinutes} min`,
      });
    });

    return stats;
  }
}

// Singleton instance
const standingsCache = StandingsCache.getInstance();

// React hooks for components

/**
 * Hook to fetch individual league standings with optimized caching
 */
export function useLeagueStandings(leagueId: number, season?: number) {
  return useQuery({
    queryKey: ['standings', leagueId, season || new Date().getFullYear()],
    queryFn: () => standingsCache.fetchLeagueStandings(leagueId, season),
    enabled: !!leagueId,
    ...STANDINGS_CACHE_CONFIG,
  });
}

/**
 * Hook to fetch multiple league standings in batch with optimized caching
 */
export function useBatchStandings(leagueIds: number[], season?: number) {
  return useQuery({
    queryKey: ['batch-standings', leagueIds.sort((a, b) => a - b), season || new Date().getFullYear()],
    queryFn: () => standingsCache.fetchBatchStandings(leagueIds, season),
    enabled: leagueIds.length > 0,
    ...STANDINGS_CACHE_CONFIG,
  });
}

/**
 * Hook to fetch popular league standings (optimized batch request)
 */
export function usePopularLeagueStandings(season?: number) {
  const dynamicLeagues = React.useMemo(() => {
    try {
      return getPopularLeaguesFromCache();
    } catch (error) {
      console.warn('Failed to get dynamic leagues, returning empty array:', error);
      return [];
    }
  }, []);

  // Only fetch if we have actual league IDs from fixtures cache
  return useBatchStandings(dynamicLeagues, season);
}

/**
 * Hook to fetch specific leagues standings using useQueries for parallel processing
 */
export function useMultipleLeagueStandings(leagueIds: number[], season?: number) {
  return useQueries({
    queries: leagueIds.map(leagueId => ({
      queryKey: ['standings', leagueId, season || new Date().getFullYear()],
      queryFn: () => standingsCache.fetchLeagueStandings(leagueId, season),
      enabled: !!leagueId,
      ...STANDINGS_CACHE_CONFIG,
    })),
  });
}

/**
 * Hook for Premier League standings with additional filtering
 */
export function usePremierLeagueStandings(filters?: {
  topN?: number;
  sortBy?: 'points' | 'goalsDiff' | 'rank';
  positionRange?: { start: number; end: number };
}) {
  const { data, ...queryResult } = useLeagueStandings(39); // Premier League ID

  const processedData = React.useMemo(() => {
    if (!data?.league?.standings?.[0]) return null;

    let standings = data.league.standings[0];

    // Apply sorting
    if (filters?.sortBy) {
      standings = standingsCache.sortStandings(standings, filters.sortBy);
    }

    // Apply position range filter
    if (filters?.positionRange) {
      standings = standingsCache.filterStandingsByPosition(
        standings,
        filters.positionRange.start,
        filters.positionRange.end
      );
    }

    // Apply top N filter
    if (filters?.topN) {
      standings = standings.slice(0, filters.topN);
    }

    return {
      ...data,
      league: {
        ...data.league,
        standings: [standings]
      }
    };
  }, [data, filters]);

  return {
    ...queryResult,
    data: processedData
  };
}

/**
 * Utility hook to prefetch standings for better UX
 */
export function usePrefetchStandings() {
  const queryClient = useQueryClient();

  const prefetchLeagueStandings = React.useCallback((leagueId: number, season?: number) => {
    const currentYear = new Date().getFullYear();
    const targetSeason = season || currentYear;

    queryClient.prefetchQuery({
      queryKey: ['standings', leagueId, targetSeason],
      queryFn: () => standingsCache.fetchLeagueStandings(leagueId, season),
      ...STANDINGS_CACHE_CONFIG,
    });
  }, [queryClient]);

  const prefetchPopularLeaguesStandings = React.useCallback((season?: number) => {
    const currentYear = new Date().getFullYear();
    const targetSeason = season || currentYear;

    let dynamicLeagues;
    try {
      dynamicLeagues = getPopularLeaguesFromCache();
    } catch (error) {
      console.warn('Failed to get dynamic leagues for prefetch, returning early:', error);
      return; // Don't prefetch if no leagues available
    }

    // Only prefetch if we have actual leagues from fixtures
    if (dynamicLeagues.length === 0) {
      console.log(`🔄 [StandingsCache] No leagues to prefetch, skipping`);
      return;
    }

    console.log(`🔄 [StandingsCache] Prefetching standings for ${dynamicLeagues.length} leagues`);

    queryClient.prefetchQuery({
      queryKey: ['batch-standings', dynamicLeagues.sort((a, b) => a - b), targetSeason],
      queryFn: () => standingsCache.fetchBatchStandings(dynamicLeagues, season),
      ...STANDINGS_CACHE_CONFIG,
    });
  }, [queryClient]);

  return {
    prefetchLeagueStandings,
    prefetchPopularLeaguesStandings,
  };
}

// Utility functions for direct cache access (non-React contexts)
export const standingsUtils = {
  // Get cached standings directly
  getCachedStandings: (leagueId: number, season?: number) => {
    return standingsCache.fetchLeagueStandings(leagueId, season);
  },

  // Get batch cached standings
  getCachedBatchStandings: (leagueIds: number[], season?: number) => {
    return standingsCache.fetchBatchStandings(leagueIds, season);
  },

  // Sorting utilities
  sortStandings: standingsCache.sortStandings.bind(standingsCache),
  filterByPosition: standingsCache.filterStandingsByPosition.bind(standingsCache),
  getTopTeams: standingsCache.getTopTeams.bind(standingsCache),
  getRelegatedTeams: standingsCache.getRelegatedTeams.bind(standingsCache),

  // Cache management
  clearCache: standingsCache.clearCache.bind(standingsCache),

  // Popular leagues constant (will be empty until fixtures are loaded)
  POPULAR_LEAGUES,
};

// Export types for use in components
export type {
  TeamStanding,
  LeagueStandings,
  BatchStandingsResponse,
  BatchStandingsRequest,
};

export default standingsCache;