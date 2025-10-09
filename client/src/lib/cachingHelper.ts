
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import { CACHE_CONFIGS, CACHE_FRESHNESS, CACHE_REFRESH } from './cacheConfig';

interface CachedQueryOptions<T> extends Partial<UseQueryOptions<T>> {
  forceRefresh?: boolean;
  maxAge?: number;
  backgroundRefresh?: boolean;
}

// Simplified cached query hook - selective fetching approach
export const useCachedQuery = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: CachedQueryOptions<T> = {}
) => {
  const {
    forceRefresh = false,
    maxAge = 30 * 60 * 1000,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey,
    queryFn,
    enabled: queryOptions.enabled !== false,
    staleTime: maxAge,
    gcTime: maxAge * 2, // Reduce memory usage
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    ...queryOptions,
  });
};

// Smart cache manager
export const CacheManager = {
  // Lightweight cache check - reduced logging to improve performance
  getCachedData: <T>(queryKey: string[], maxAge: number = 30 * 60 * 1000): T | null => {
    const data = queryClient.getQueryData<T>(queryKey);
    const state = queryClient.getQueryState(queryKey);
    
    if (data && state?.dataUpdatedAt && CACHE_FRESHNESS.isFresh(state.dataUpdatedAt, maxAge)) {
      return data;
    }
    
    // Simplified localStorage check - no heavy logging
    try {
      const cacheKey = queryKey.join('-');
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data: localData, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < maxAge) {
          queryClient.setQueryData(queryKey, localData);
          return localData;
        }
      }
    } catch (error) {
      // Silent fail for localStorage errors
    }
    
    return null;
  },

  // Set cached data
  setCachedData: <T>(queryKey: string[], data: T) => {
    queryClient.setQueryData(queryKey, data);
  },

  // Check if data is stale
  isStale: (queryKey: string[], maxAge: number = 30 * 60 * 1000): boolean => {
    const state = queryClient.getQueryState(queryKey);
    return !state?.dataUpdatedAt || !CACHE_FRESHNESS.isFresh(state.dataUpdatedAt, maxAge);
  },

  // Force refresh specific query
  forceRefresh: (queryKey: string[]) => {
    queryClient.invalidateQueries({ queryKey });
  },

  // Background refresh if stale
  backgroundRefreshIfStale: (queryKey: string[], queryFn: () => Promise<any>, maxAge: number = 30 * 60 * 1000) => {
    if (CacheManager.isStale(queryKey, maxAge)) {
      console.log(`Background refreshing stale data: ${queryKey.join('-')}`);
      queryClient.prefetchQuery({ queryKey, queryFn, staleTime: maxAge });
    }
  },

  // Get cache statistics
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const stats = {
      totalQueries: queries.length,
      freshQueries: 0,
      staleQueries: 0,
      failedQueries: 0,
      oldestQuery: null as Date | null,
      newestQuery: null as Date | null,
    };

    queries.forEach((query) => {
      if (query.state.dataUpdatedAt) {
        const updateTime = new Date(query.state.dataUpdatedAt);
        
        if (!stats.oldestQuery || updateTime < stats.oldestQuery) {
          stats.oldestQuery = updateTime;
        }
        
        if (!stats.newestQuery || updateTime > stats.newestQuery) {
          stats.newestQuery = updateTime;
        }

        if (CACHE_FRESHNESS.isFresh(query.state.dataUpdatedAt, 30 * 60 * 1000)) {
          stats.freshQueries++;
        } else {
          stats.staleQueries++;
        }
      }

      if (query.state.status === 'error') {
        stats.failedQueries++;
      }
    });

    return stats;
  },
};

// Preloading utilities
export const CachePreloader = {
  // Preload today's fixtures
  preloadTodayFixtures: async () => {
    const today = new Date().toISOString().split('T')[0];
    const queryKey = ['all-fixtures-by-date', today];
    
    if (CacheManager.isStale(queryKey)) {
      console.log('Preloading today\'s fixtures');
      await queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
          const response = await fetch(`/api/fixtures/date/${today}?all=true`);
          return response.json();
        },
        staleTime: 30 * 60 * 1000,
      });
    }
  },

  // Preload popular leagues
  preloadPopularLeagues: async () => {
    const popularLeagues = [2, 3, 39, 140, 135, 78]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga
    
    for (const leagueId of popularLeagues) {
      const queryKey = [`/api/leagues/${leagueId}`];
      
      if (CacheManager.isStale(queryKey)) {
        console.log(`Preloading league ${leagueId}`);
        await queryClient.prefetchQuery({
          queryKey,
          queryFn: async () => {
            const response = await fetch(`/api/leagues/${leagueId}`);
            return response.json();
          },
          staleTime: 60 * 60 * 1000, // 1 hour for league data
        });
      }
    }
  },

  // Preload live fixtures
  preloadLiveFixtures: async () => {
    const queryKey = ['live-fixtures-all-countries'];
    
    console.log('Preloading live fixtures');
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const response = await fetch('/api/fixtures/live');
        return response.json();
      },
      staleTime: 30 * 1000, // 30 seconds for live data
    });
  },
};

// API request wrapper with caching
export const apiRequest = async (method: string, url: string, options: RequestInit = {}) => {
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
};

export default useCachedQuery;
