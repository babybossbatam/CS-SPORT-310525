import { UseQueryOptions } from '@tanstack/react-query';

// Cache durations in milliseconds - optimized for performance and reduced API calls
export const CACHE_DURATIONS = {
  ONE_HOUR: 60 * 60 * 1000,
  SIX_HOURS: 6 * 60 * 60 * 1000,
  TWELVE_HOURS: 12 * 60 * 60 * 1000,
  TWENTY_FOUR_HOURS: 24 * 60 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  TEN_MINUTES: 10 * 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  TWO_MINUTES: 2 * 60 * 1000,
  FOUR_HOURS: 4 * 60 * 60 * 1000,
  // Extended durations for better performance
  TWO_HOURS: 2 * 60 * 60 * 1000,
  EIGHT_HOURS: 8 * 60 * 60 * 1000,
} as const;

// Cache presets for different data types
export const CACHE_PRESETS = {
  // For frequently changing data like live scores - optimized
  LIVE_DATA: {
    staleTime: CACHE_DURATIONS.TWO_MINUTES,
    gcTime: CACHE_DURATIONS.FIVE_MINUTES,
    refetchInterval: CACHE_DURATIONS.TWO_MINUTES,
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    refetchOnMount: false,
    refetchOnReconnect: true,
  },

  // For match fixtures and schedules (smart cache based on date) - EXTENDED CACHE
  FIXTURES: {
    staleTime: CACHE_DURATIONS.TWENTY_FOUR_HOURS, // Extended to 24 hours for better performance
    gcTime: CACHE_DURATIONS.TWENTY_FOUR_HOURS * 7, // Keep in memory for 7 days
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false, // Disable automatic refetching completely
    retry: 1,
  },

  // For upcoming fixtures (longer cache since they rarely change)
  UPCOMING_FIXTURES: {
    staleTime: CACHE_DURATIONS.TWELVE_HOURS,
    gcTime: CACHE_DURATIONS.TWENTY_FOUR_HOURS * 3, // Keep in memory for 72 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  },

  // For league standings and static data
  STANDINGS: {
    staleTime: CACHE_DURATIONS.TWENTY_FOUR_HOURS, // Extended to 24 hours
    gcTime: CACHE_DURATIONS.TWENTY_FOUR_HOURS * 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  },

  // For player statistics and top scorers
  PLAYER_STATS: {
    staleTime: CACHE_DURATIONS.FOUR_HOURS, // Top scorers change infrequently
    gcTime: CACHE_DURATIONS.TWELVE_HOURS,
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
    gcTime: CACHE_DURATIONS.TWENTY_FOUR_HOURS * 2, // Keep in memory for 48 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  },

  // For moderate caching (league data, team info)
  MODERATE: {
    staleTime: CACHE_DURATIONS.FOUR_HOURS, // Increased from 1 hour
    gcTime: CACHE_DURATIONS.TWELVE_HOURS,
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
  // All fixtures by date (smart cache based on date)
  allFixturesByDate: (selectedDate: string, enableFetching: boolean) => {
    const today = new Date().toISOString().slice(0, 10);
    const isToday = selectedDate === today;
    const isFuture = selectedDate > today;

    // Use shorter cache for today (live matches), longer for future dates
    const preset = isToday ? 'FIXTURES' : isFuture ? 'UPCOMING_FIXTURES' : 'POPULAR_FIXTURES';

    return createQueryOptions(preset, {
      queryKey: ['all-fixtures-by-date', selectedDate],
      enabled: !!selectedDate && enableFetching,
    });
  },

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
      refetchInterval: refreshInterval || CACHE_DURATIONS.THIRTY_MINUTES, // Corrected to THIRTY_MINUTES, assuming a typo in original thought for 30-seconds
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

export const CACHE_FRESHNESS = {
  // Live data - very short cache for real-time updates
  LIVE_FIXTURES: 30 * 1000, // 30 seconds
  LIVE_SCORES: 15 * 1000, // 15 seconds

  // Today's data - short cache for frequent updates
  TODAY_FIXTURES: 5 * 60 * 1000, // 5 minutes
  TODAY_POPULAR: 10 * 60 * 1000, // 10 minutes

  // World competitions - shorter cache for better updates
  WORLD_COMPETITIONS: 5 * 60 * 1000, // 5 minutes
  MAJOR_COMPETITIONS: 10 * 60 * 1000, // 10 minutes

  // Featured matches - medium cache
  FEATURED_MATCHES: 15 * 60 * 1000, // 15 minutes

  // Static-ish data - longer cache
  LEAGUE_DATA: 60 * 60 * 1000, // 1 hour
  TEAM_DATA: 60 * 60 * 1000, // 1 hour
  STANDINGS: 30 * 60 * 1000, // 30 minutes

  // Very stable data - very long cache
  COUNTRY_FLAGS: 24 * 60 * 60 * 1000, // 24 hours
  TEAM_LOGOS: 12 * 60 * 60 * 1000, // 12 hours

  // Helper function to check if data is fresh
  isFresh: (dataUpdatedAt: number, maxAge: number): boolean => {
    if (!dataUpdatedAt) return false;
    const age = Date.now() - dataUpdatedAt;
    return age < maxAge;
  },

  // Helper function to check if data needs refresh
  needsRefresh: (dataUpdatedAt: number, maxAge: number = 30 * 60 * 1000): boolean => {
    if (!dataUpdatedAt) return true;
    const age = Date.now() - dataUpdatedAt;
    return age >= maxAge;
  },
};

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