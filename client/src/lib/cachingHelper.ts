
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import { CACHE_CONFIGS, CACHE_FRESHNESS, CACHE_REFRESH } from './cacheConfig';

interface CachedQueryOptions<T> extends Partial<UseQueryOptions<T>> {
  forceRefresh?: boolean;
  maxAge?: number;
  backgroundRefresh?: boolean;
}

// Enhanced useQuery hook with smart caching
export const useCachedQuery = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: CachedQueryOptions<T> = {}
) => {
  const {
    forceRefresh = false,
    maxAge = 30 * 60 * 1000, // 30 minutes default
    backgroundRefresh = true,
    ...queryOptions
  } = options;

  // Check if we should use cached data
  const existingQuery = queryClient.getQueryData(queryKey);
  const queryState = queryClient.getQueryState(queryKey);
  
  const shouldUseCache = existingQuery && 
                        queryState?.dataUpdatedAt && 
                        CACHE_FRESHNESS.isFresh(queryState.dataUpdatedAt, maxAge) && 
                        !forceRefresh;

  return useQuery({
    queryKey,
    queryFn: async () => {
      // If we have fresh cache and not forcing refresh, return cached data
      if (shouldUseCache) {
        console.log(`Using cached data for: ${queryKey.join('-')}`);
        return existingQuery;
      }

      console.log(`Fetching fresh data for: ${queryKey.join('-')}`);
      return await queryFn();
    },
    enabled: true,
    staleTime: maxAge,
    gcTime: maxAge * 2,
    refetchOnWindowFocus: false,
    refetchOnMount: !shouldUseCache,
    refetchOnReconnect: false,
    ...queryOptions,
  });
};

// Smart cache manager
export const CacheManager = {
  // Get cached data with freshness check and localStorage fallback
  getCachedData: <T>(queryKey: string[], maxAge: number = 30 * 60 * 1000): T | null => {
    const data = queryClient.getQueryData<T>(queryKey);
    const state = queryClient.getQueryState(queryKey);
    
    if (data && state?.dataUpdatedAt && CACHE_FRESHNESS.isFresh(state.dataUpdatedAt, maxAge)) {
      return data;
    }
    
    // Fallback to localStorage
    try {
      const cacheKey = queryKey.join('-');
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data: localData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < maxAge) {
          return localData;
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage cache:', error);
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
