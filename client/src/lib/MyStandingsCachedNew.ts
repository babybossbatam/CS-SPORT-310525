
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

// Popular leagues for batch fetching
const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78, 848, 15]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga, Conference League, FIFA Club World Cup

class StandingsCache {
  private static instance: StandingsCache;
  private batchCache = new Map<string, Promise<BatchStandingsResponse>>();
  private individualCache = new Map<string, Promise<LeagueStandings | null>>();

  static getInstance(): StandingsCache {
    if (!StandingsCache.instance) {
      StandingsCache.instance = new StandingsCache();
    }
    return StandingsCache.instance;
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

    try {
      const response = await apiRequest('GET', `/api/leagues/${leagueId}/standings`, {
        params: season ? { season } : undefined
      });

      if (!response.ok) {
        console.warn(`Failed to fetch standings for league ${leagueId}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log(`✅ Fetched standings for league ${leagueId}`);
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
    console.log('🧹 Standings cache cleared');
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
