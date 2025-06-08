
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './utils';

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

// Cache configuration
const STANDINGS_CACHE_CONFIG = {
  staleTime: 2 * 60 * 60 * 1000, // 2 hours
  gcTime: 4 * 60 * 60 * 1000, // 4 hours
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  retry: 1,
  retryDelay: 3000,
};

// Simple fetch function with better error handling
async function fetchLeagueStandings(leagueId: number, season?: number): Promise<LeagueStandings | null> {
  if (!leagueId || leagueId <= 0) {
    console.warn(`Invalid league ID: ${leagueId}`);
    return null;
  }

  try {
    console.log(`🏆 Fetching standings for league ${leagueId}`);
    
    const response = await apiRequest('GET', `/api/leagues/${leagueId}/standings`, {
      params: season ? { season } : undefined,
      timeout: 10000,
      retries: 1
    });

    if (!response.ok) {
      console.warn(`API error for league ${leagueId}: ${response.status}`);
      return getFallbackStandings(leagueId);
    }

    const data = await response.json();

    if (!data || !data.league || !data.league.standings) {
      console.warn(`Invalid data structure for league ${leagueId}`);
      return getFallbackStandings(leagueId);
    }

    console.log(`✅ Successfully fetched standings for league ${leagueId}`);
    return data;

  } catch (error) {
    console.error(`Error fetching standings for league ${leagueId}:`, error);
    return getFallbackStandings(leagueId);
  }
}

// Fallback standings for popular leagues
function getFallbackStandings(leagueId: number): LeagueStandings | null {
  const popularLeagues = {
    39: 'Premier League',
    140: 'La Liga',
    135: 'Serie A',
    78: 'Bundesliga',
    61: 'Ligue 1',
    2: 'UEFA Champions League',
    3: 'UEFA Europa League',
    848: 'UEFA Europa Conference League'
  };

  if (popularLeagues[leagueId]) {
    console.log(`🔄 Using fallback data for league ${leagueId}`);
    return {
      league: {
        id: leagueId,
        name: popularLeagues[leagueId],
        country: 'Unknown',
        logo: '',
        flag: '',
        season: new Date().getFullYear(),
        standings: [[]]
      }
    };
  }

  return null;
}

/**
 * Simple hook to fetch individual league standings
 */
export function useLeagueStandings(leagueId: number | null, season?: number) {
  return useQuery({
    queryKey: ['simple-standings', leagueId, season || new Date().getFullYear()],
    queryFn: () => fetchLeagueStandings(leagueId!, season),
    enabled: !!leagueId && leagueId > 0,
    ...STANDINGS_CACHE_CONFIG,
  });
}

/**
 * Hook for Premier League standings with filtering
 */
export function usePremierLeagueStandings(filters?: {
  topN?: number;
  sortBy?: 'points' | 'goalsDiff' | 'rank';
}) {
  const { data, ...queryResult } = useLeagueStandings(39);

  const processedData = React.useMemo(() => {
    if (!data?.league?.standings?.[0]) return null;

    let standings = data.league.standings[0];

    // Apply sorting
    if (filters?.sortBy === 'points') {
      standings = [...standings].sort((a, b) => b.points - a.points);
    } else if (filters?.sortBy === 'goalsDiff') {
      standings = [...standings].sort((a, b) => b.goalsDiff - a.goalsDiff);
    } else {
      standings = [...standings].sort((a, b) => a.rank - b.rank);
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
 * Utility hook to prefetch standings
 */
export function usePrefetchStandings() {
  const queryClient = useQueryClient();

  const prefetchLeagueStandings = React.useCallback((leagueId: number, season?: number) => {
    const currentYear = new Date().getFullYear();
    const targetSeason = season || currentYear;

    queryClient.prefetchQuery({
      queryKey: ['simple-standings', leagueId, targetSeason],
      queryFn: () => fetchLeagueStandings(leagueId, season),
      ...STANDINGS_CACHE_CONFIG,
    });
  }, [queryClient]);

  return { prefetchLeagueStandings };
}

// Export types
export type { TeamStanding, LeagueStandings };
