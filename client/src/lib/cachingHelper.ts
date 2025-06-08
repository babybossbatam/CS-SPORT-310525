
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
    backgroundRefresh = false, // Default to false to prevent frequent calls
    ...queryOptions
  } = options;

  // Check if we should use cached data
  const existingQuery = queryClient.getQueryData(queryKey);
  const queryState = queryClient.getQueryState(queryKey);
  
  const shouldUseCache = existingQuery && 
                        queryState?.dataUpdatedAt && 
                        CACHE_FRESHNESS.isFresh(queryState.dataUpdatedAt, maxAge) && 
                        !forceRefresh;

  console.log(`📋 [Cache Check] ${queryKey.join('-')}:`, {
    hasExistingData: !!existingQuery,
    dataAge: queryState?.dataUpdatedAt ? Date.now() - queryState.dataUpdatedAt : null,
    maxAge,
    shouldUseCache,
    forceRefresh
  });

  return useQuery({
    queryKey,
    queryFn: async () => {
      // If we have fresh cache and not forcing refresh, return cached data
      if (shouldUseCache && !forceRefresh) {
        console.log(`✅ [Cache Hit] Using cached data for: ${queryKey.join('-')}`);
        return existingQuery;
      }

      console.log(`🔄 [Cache Miss] Fetching fresh data for: ${queryKey.join('-')}`);
      const result = await queryFn();
      
      // Store in localStorage as backup
      try {
        const cacheKey = queryKey.join('-');
        localStorage.setItem(cacheKey, JSON.stringify({
          data: result,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('Failed to store in localStorage:', error);
      }
      
      return result;
    },
    enabled: queryOptions.enabled !== false,
    staleTime: maxAge,
    gcTime: maxAge * 3, // Keep in memory longer
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Never refetch on mount to prevent unnecessary calls
    refetchOnReconnect: false,
    retry: 1, // Reduce retry attempts
    ...queryOptions,
  });
};

// Smart cache manager
export const CacheManager = {
  // Get cached data with freshness check and localStorage fallback
  getCachedData: <T>(queryKey: string[], maxAge: number = 30 * 60 * 1000): T | null => {
    const cacheKey = queryKey.join('-');
    const data = queryClient.getQueryData<T>(queryKey);
    const state = queryClient.getQueryState(queryKey);
    
    console.log(`🔍 [CacheManager] Checking cache for: ${cacheKey}`, {
      hasData: !!data,
      dataUpdatedAt: state?.dataUpdatedAt,
      age: state?.dataUpdatedAt ? Date.now() - state.dataUpdatedAt : null,
      maxAge,
      isFresh: data && state?.dataUpdatedAt ? CACHE_FRESHNESS.isFresh(state.dataUpdatedAt, maxAge) : false
    });
    
    if (data && state?.dataUpdatedAt && CACHE_FRESHNESS.isFresh(state.dataUpdatedAt, maxAge)) {
      console.log(`✅ [CacheManager] Cache hit for: ${cacheKey}`);
      return data;
    }
    
    // Fallback to localStorage
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data: localData, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        console.log(`💾 [CacheManager] localStorage check for ${cacheKey}:`, { age, maxAge, valid: age < maxAge });
        
        if (age < maxAge) {
          console.log(`📂 [CacheManager] localStorage hit for: ${cacheKey}`);
          // Store back in React Query cache
          queryClient.setQueryData(queryKey, localData);
          return localData;
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage cache:', error);
    }
    
    console.log(`❌ [CacheManager] Cache miss for: ${cacheKey}`);
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
