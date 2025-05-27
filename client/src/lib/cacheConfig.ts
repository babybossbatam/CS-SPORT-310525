
import { UseQueryOptions } from '@tanstack/react-query';

// Cache durations in milliseconds
export const CACHE_DURATIONS = {
  ONE_HOUR: 60 * 60 * 1000,
  SIX_HOURS: 6 * 60 * 60 * 1000,
  TWELVE_HOURS: 12 * 60 * 60 * 1000,
  TWENTY_FOUR_HOURS: 24 * 60 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  THIRTY_SECONDS: 30 * 1000,
} as const;

// Cache presets for different data types
export const CACHE_PRESETS = {
  // For frequently changing data like live scores
  LIVE_DATA: {
    staleTime: CACHE_DURATIONS.THIRTY_SECONDS,
    gcTime: CACHE_DURATIONS.FIVE_MINUTES,
    refetchInterval: CACHE_DURATIONS.THIRTY_SECONDS,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  },

  // For match fixtures and schedules
  FIXTURES: {
    staleTime: CACHE_DURATIONS.TWENTY_FOUR_HOURS,
    gcTime: CACHE_DURATIONS.TWENTY_FOUR_HOURS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  },

  // For league standings and static data
  STANDINGS: {
    staleTime: CACHE_DURATIONS.SIX_HOURS,
    gcTime: CACHE_DURATIONS.TWELVE_HOURS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  },

  // For player statistics and top scorers
  PLAYER_STATS: {
    staleTime: CACHE_DURATIONS.TWELVE_HOURS,
    gcTime: CACHE_DURATIONS.TWENTY_FOUR_HOURS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  },

  // For news articles
  NEWS: {
    staleTime: CACHE_DURATIONS.FIVE_MINUTES,
    gcTime: CACHE_DURATIONS.THIRTY_MINUTES,
    refetchOnWindowFocus: false,
    retry: 1,
  },

  // For popular fixtures with 24-hour cache
  POPULAR_FIXTURES: {
    staleTime: CACHE_DURATIONS.TWENTY_FOUR_HOURS,
    gcTime: CACHE_DURATIONS.TWENTY_FOUR_HOURS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  },

  // For moderate caching (league data, team info)
  MODERATE: {
    staleTime: CACHE_DURATIONS.ONE_HOUR,
    gcTime: CACHE_DURATIONS.SIX_HOURS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  },

  // For short-term caching
  SHORT_TERM: {
    staleTime: CACHE_DURATIONS.FIVE_MINUTES,
    gcTime: CACHE_DURATIONS.THIRTY_MINUTES,
    refetchOnWindowFocus: false,
    retry: 1,
  },
} as const;

// Helper function to create query options with cache presets
export function createQueryOptions<T>(
  preset: keyof typeof CACHE_PRESETS,
  overrides?: Partial<UseQueryOptions<T>>
): Partial<UseQueryOptions<T>> {
  return {
    ...CACHE_PRESETS[preset],
    ...overrides,
  };
}

// Specific cache configurations for common query patterns
export const QUERY_CONFIGS = {
  // All fixtures by date (24-hour cache, no refetch)
  allFixturesByDate: (selectedDate: string, enableFetching: boolean) =>
    createQueryOptions('FIXTURES', {
      queryKey: ['all-fixtures-by-date', selectedDate],
      enabled: !!selectedDate && enableFetching,
    }),

  // Popular league fixtures (24-hour cache)
  popularFixtures: (selectedDate: string, enableFetching: boolean, popularLeagues: number[]) =>
    createQueryOptions('POPULAR_FIXTURES', {
      queryKey: ['popular-fixtures', selectedDate],
      enabled: popularLeagues.length > 0 && !!selectedDate && enableFetching,
    }),

  // Live fixtures (30-second refresh)
  liveFixtures: (enableFetching: boolean, refreshInterval?: number) =>
    createQueryOptions('LIVE_DATA', {
      queryKey: ['live-fixtures-all-countries'],
      enabled: enableFetching,
      refetchInterval: refreshInterval || CACHE_DURATIONS.THIRTY_SECONDS,
    }),

  // League standings
  leagueStandings: (leagueId: number) =>
    createQueryOptions('STANDINGS', {
      queryKey: [`/api/leagues/${leagueId}/standings`],
    }),

  // League fixtures
  leagueFixtures: (leagueId: number) =>
    createQueryOptions('FIXTURES', {
      queryKey: [`/api/leagues/${leagueId}/fixtures`],
    }),

  // Top scorers
  topScorers: (leagueId: number) =>
    createQueryOptions('PLAYER_STATS', {
      queryKey: [`/api/leagues/${leagueId}/topscorers`],
    }),

  // News articles
  news: (sport?: string) =>
    createQueryOptions('NEWS', {
      queryKey: ['news', sport || 'football'],
    }),

  // League data
  leagueData: (leagueId: number) =>
    createQueryOptions('MODERATE', {
      queryKey: [`/api/leagues/${leagueId}`],
    }),
} as const;

// Cache key helpers
export const CACHE_KEYS = {
  fixtures: {
    byDate: (date: string) => ['all-fixtures-by-date', date],
    byLeague: (leagueId: number) => [`/api/leagues/${leagueId}/fixtures`],
    popular: (date: string) => ['popular-fixtures', date],
    live: () => ['live-fixtures-all-countries'],
  },
  leagues: {
    data: (leagueId: number) => [`/api/leagues/${leagueId}`],
    standings: (leagueId: number) => [`/api/leagues/${leagueId}/standings`],
    topScorers: (leagueId: number) => [`/api/leagues/${leagueId}/topscorers`],
    all: () => ['/api/leagues'],
  },
  news: (sport?: string) => ['news', sport || 'football'],
} as const;

// Cache freshness validation
export const CACHE_FRESHNESS = {
  // Check if cache is fresh (within specified duration)
  isFresh: (timestamp: string | number, maxAge: number): boolean => {
    const now = Date.now();
    const cacheTime = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
    return (now - cacheTime) < maxAge;
  },

  // Get cache age in milliseconds
  getAge: (timestamp: string | number): number => {
    const now = Date.now();
    const cacheTime = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
    return now - cacheTime;
  },

  // Check if cache needs refresh (30 minutes = 1800000ms)
  needsRefresh: (timestamp: string | number, refreshInterval: number = 30 * 60 * 1000): boolean => {
    return !CACHE_FRESHNESS.isFresh(timestamp, refreshInterval);
  },
} as const;

// Background refresh functionality
export const CACHE_REFRESH = {
  // Setup automatic cache refresh for specific queries
  setupAutoRefresh: (queryClient: any, queryKey: string[], refreshInterval: number = 30 * 60 * 1000) => {
    return setInterval(() => {
      const query = queryClient.getQueryData(queryKey);
      if (query) {
        console.log(`Auto-refreshing cache for query: ${queryKey.join('-')}`);
        queryClient.invalidateQueries({ queryKey });
      }
    }, refreshInterval);
  },

  // Selective refresh based on data importance
  refreshCriticalData: (queryClient: any) => {
    // Refresh live fixtures
    queryClient.invalidateQueries({ queryKey: ['live-fixtures-all-countries'] });
    
    // Refresh today's fixtures
    const today = new Date().toISOString().split('T')[0];
    queryClient.invalidateQueries({ queryKey: ['all-fixtures-by-date', today] });
    queryClient.invalidateQueries({ queryKey: ['popular-fixtures', today] });
    
    console.log('Critical data refreshed');
  },

  // Smart refresh - only refresh stale data
  refreshStaleData: (queryClient: any) => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    queries.forEach((query) => {
      if (query.state.dataUpdatedAt && CACHE_FRESHNESS.needsRefresh(query.state.dataUpdatedAt)) {
        console.log(`Refreshing stale query: ${query.queryKey.join('-')}`);
        queryClient.invalidateQueries({ queryKey: query.queryKey });
      }
    });
  },
} as const;

// Cache invalidation helpers
export const CACHE_INVALIDATION = {
  // Invalidate all fixture-related caches
  fixtures: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: ['all-fixtures-by-date'] });
    queryClient.invalidateQueries({ queryKey: ['popular-fixtures'] });
    queryClient.invalidateQueries({ queryKey: ['live-fixtures-all-countries'] });
  },

  // Invalidate league-specific caches
  league: (queryClient: any, leagueId: number) => {
    queryClient.invalidateQueries({ queryKey: [`/api/leagues/${leagueId}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/leagues/${leagueId}/fixtures`] });
    queryClient.invalidateQueries({ queryKey: [`/api/leagues/${leagueId}/standings`] });
    queryClient.invalidateQueries({ queryKey: [`/api/leagues/${leagueId}/topscorers`] });
  },

  // Clear all caches
  all: (queryClient: any) => {
    queryClient.clear();
  },

  // Smart invalidation - only invalidate stale data
  staleOnly: (queryClient: any, maxAge: number = 30 * 60 * 1000) => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    queries.forEach((query) => {
      if (query.state.dataUpdatedAt && !CACHE_FRESHNESS.isFresh(query.state.dataUpdatedAt, maxAge)) {
        queryClient.invalidateQueries({ queryKey: query.queryKey });
      }
    });
  },
} as const;
