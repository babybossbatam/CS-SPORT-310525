import React from 'react';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './utils';
import { CACHE_DURATIONS } from './cacheConfig';

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
const CACHE_EXPIRY_TIME = 4 * 60 * 60 * 1000; // 4 hours

interface CachedStandingsItem {
  data: LeagueStandings;
  timestamp: number;
  leagueId: number;
  season: number;
}

interface StandingsStorageCache {
  [key: string]: CachedStandingsItem;
}

// Popular leagues for batch fetching
const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78, 848, 15]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga, Conference League, FIFA Club World Cup

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
            this.memoryCache.set(key, item);
            loadedCount++;
          }
        });

        console.log(`🏆 Loaded ${loadedCount} standings from localStorage cache`);
        this.logCacheStats();
      }
    } catch (error) {
      console.error('Error loading standings cache from localStorage:', error);
    }
  }

  // Save standings cache to localStorage
  private saveToStorage(): void {
    try {
      const cacheObject: StandingsStorageCache = {};
      this.memoryCache.forEach((item, key) => {
        cacheObject[key] = item;
      });
      localStorage.setItem(STANDINGS_STORAGE_KEY, JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Error saving standings cache to localStorage:', error);
    }
  }

  // Get cached standings from memory/localStorage - prioritize any cached data over API calls
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
        // For popular leagues, use expired cache instead of making API calls
        const isPopularLeague = [2, 3, 39, 140, 135, 78, 848, 15].includes(leagueId);
        if (isPopularLeague) {
          console.log(`🔄 Using expired cache for popular league ${leagueId} (age: ${Math.floor(age / 60000)} min) to avoid API calls`);
          return cached.data;
        }
        
        // For non-popular leagues, mark as expired but don't delete yet
        console.log(`⏰ Expired standings cache for league ${leagueId} (age: ${Math.floor(age / 60000)} min)`);
      }
    }

    console.log(`❌ Cache miss for standings league ${leagueId}`);
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

    this.memoryCache.set(cacheKey, cacheItem);
    
    try {
      this.saveToStorage();
      console.log(`💾 Successfully cached standings for league ${leagueId} (${data.league.name}) with key: ${cacheKey}`);
    } catch (error) {
      console.error(`❌ Failed to save standings cache to localStorage for league ${leagueId}:`, error);
    }
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

    // PRIORITY 2: Check if we have ANY cached data (even expired) - use it instead of API call
    const anyCached = this.memoryCache.get(cacheKey);
    if (anyCached) {
      const age = Date.now() - anyCached.timestamp;
      const ageHours = Math.floor(age / (60 * 60 * 1000));
      console.log(`🏆 Avoiding API call for popular league ${leagueId} - will return null instead of failing`);
      console.log(`⚠️ Avoiding API call for popular league ${leagueId} - will return null instead of failing`);
      return null;
    }

    // PRIORITY 3: For popular leagues, be extremely conservative about API calls
    const isPopularLeague = [2, 3, 39, 140, 135, 78, 848, 15].includes(leagueId);
    if (isPopularLeague) {
      console.log(`⚠️ Avoiding API call for popular league ${leagueId} - will return null instead of failing`);
      return null;
    }

    // PRIORITY 4: Only make API calls for non-popular leagues as last resort
    try {
      console.log(`🔍 Making API call for non-popular league ${leagueId} (season: ${season || 'current'})`);
      const response = await apiRequest('GET', `/api/leagues/${leagueId}/standings`, {
        params: season ? { season } : undefined
      });

      if (!response.ok) {
        console.warn(`❌ Failed to fetch standings for league ${leagueId}: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();

      // Check if the response indicates an error
      if (data.error) {
        console.warn(`API returned error for league ${leagueId}:`, data.message);
        return null;
      }

      // Cache the fetched data
      if (data && data.league) {
        this.setCachedStandings(leagueId, data, season);
        console.log(`✅ Successfully fetched and cached standings for league ${leagueId} (${data.league.name}) - ${data.league.standings?.[0]?.length || 0} teams`);
      } else {
        console.warn(`⚠️ API returned data but missing league structure for league ${leagueId}`);
      }

      return data;
    } catch (error) {
      console.error(`Error fetching standings for league ${leagueId}:`, error);
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
          console.error(`Error in batch fetch for league ${leagueId}:`, error);
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
  return useBatchStandings(POPULAR_LEAGUES, season);
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

    queryClient.prefetchQuery({
      queryKey: ['batch-standings', POPULAR_LEAGUES, targetSeason],
      queryFn: () => standingsCache.fetchBatchStandings(POPULAR_LEAGUES, season),
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

  // Popular leagues constant
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