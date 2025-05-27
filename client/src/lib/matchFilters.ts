
import { parseISO } from "date-fns";
import type { Match } from "@/types/fixtures";

export interface FilterOptions {
  popularLeagues?: number[];
  popularTeamIds?: number[];
  excludeTeamIds?: number[];
  maxMatches?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  prioritizeCountries?: string[];
}

export interface FilterResult {
  matches: Match[];
  breakdown: {
    live: number;
    upcoming: number;
    finished: number;
    total: number;
  };
}

// Default popular leagues (Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga)
export const DEFAULT_POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78];

// Default popular teams (big clubs)
export const DEFAULT_POPULAR_TEAMS = [
  33, 42, 40, 39, 49, 48, 529, 530, 541, 497, 505, 157, 165
];

// Teams to exclude by default
export const DEFAULT_EXCLUDE_TEAMS = [52, 76];

// Popular countries for country-based filtering
export const POPULAR_COUNTRIES = [
  'England', 'Spain', 'Italy', 'Germany', 'France', 
  'Brazil', 'Argentina', 'Netherlands', 'Portugal', 'World'
];

/**
 * Check if match is currently live
 */
export const isLiveMatch = (statusShort: string): boolean => {
  return ["1H", "2H", "HT", "BT", "ET", "P", "SUSP", "INT", "LIVE"].includes(statusShort);
};

/**
 * Check if match is a final or semifinal
 */
export const isFinalOrSemifinal = (match: Match): boolean => {
  const round = match.league.round?.toLowerCase() || "";
  return (
    round.includes("final") ||
    round.includes("semi") ||
    round.includes("semi-final")
  );
};

/**
 * Check if team is considered popular
 */
export const isPopularTeamMatch = (match: Match, popularTeamIds: number[]): boolean => {
  return (
    popularTeamIds.includes(match.teams.home.id) ||
    popularTeamIds.includes(match.teams.away.id)
  );
};

/**
 * Check if match should be excluded
 */
export const shouldExcludeMatch = (match: Match, excludeTeamIds: number[]): boolean => {
  return (
    excludeTeamIds.includes(match.teams.home.id) ||
    excludeTeamIds.includes(match.teams.away.id)
  );
};

/**
 * Check if match is from popular country
 */
export const isFromPopularCountry = (match: Match, popularCountries: string[]): boolean => {
  return popularCountries.some(country => 
    match.league.country.toLowerCase().includes(country.toLowerCase())
  );
};

/**
 * Filter matches by popular leagues
 */
export const filterByPopularLeagues = (
  matches: Match[], 
  popularLeagues: number[] = DEFAULT_POPULAR_LEAGUES
): Match[] => {
  return matches.filter(match => popularLeagues.includes(match.league.id));
};

/**
 * Filter matches by popular countries
 */
export const filterByPopularCountries = (
  matches: Match[], 
  popularCountries: string[] = POPULAR_COUNTRIES
): Match[] => {
  return matches.filter(match => isFromPopularCountry(match, popularCountries));
};

/**
 * Categorize matches by status and timing
 */
export const categorizeMatches = (matches: Match[], currentTime: Date = new Date()) => {
  const now = currentTime;
  
  const liveMatches = matches.filter(match => isLiveMatch(match.fixture.status.short));
  
  const upcomingMatches = matches
    .filter(match => {
      if (match.fixture.status.short !== "NS") return false;
      
      const matchDate = new Date(match.fixture.date);
      const timeDiffHours = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const timeDiffDays = timeDiffHours / 24;
      
      if (timeDiffHours < 0) return false;
      
      // For finals/semifinals, give more leeway
      if (isFinalOrSemifinal(match) && timeDiffDays <= 5) return true;
      
      return timeDiffDays <= 30;
    })
    .sort((a, b) => {
      const aIsFinal = isFinalOrSemifinal(a);
      const bIsFinal = isFinalOrSemifinal(b);
      
      if (aIsFinal && !bIsFinal) return -1;
      if (!aIsFinal && bIsFinal) return 1;
      
      return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
    });
  
  const finishedMatches = matches
    .filter(match => {
      if (!["FT", "AET", "PEN"].includes(match.fixture.status.short)) return false;
      
      const matchDate = new Date(match.fixture.date);
      const matchEndTime = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000);
      const hoursSinceCompletion = (now.getTime() - matchEndTime.getTime()) / (1000 * 60 * 60);
      
      return hoursSinceCompletion >= 0 && hoursSinceCompletion <= 8;
    })
    .sort((a, b) => {
      const aIsFinal = isFinalOrSemifinal(a);
      const bIsFinal = isFinalOrSemifinal(b);
      
      if (aIsFinal && !bIsFinal) return -1;
      if (!aIsFinal && bIsFinal) return 1;
      
      return new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime();
    });
  
  return { liveMatches, upcomingMatches, finishedMatches };
};

/**
 * Apply priority-based filtering for featured matches
 */
export const applyPriorityFiltering = (
  matches: Match[],
  options: FilterOptions = {}
): FilterResult => {
  const {
    popularTeamIds = DEFAULT_POPULAR_TEAMS,
    excludeTeamIds = DEFAULT_EXCLUDE_TEAMS,
    maxMatches = 6
  } = options;
  
  const currentTime = new Date();
  const { liveMatches, upcomingMatches, finishedMatches } = categorizeMatches(matches, currentTime);
  
  let finalMatches: Match[] = [];
  
  // PRIORITY 1: Live matches with popular teams or finals/semifinals
  const livePopularMatches = liveMatches
    .filter(match => 
      isPopularTeamMatch(match, popularTeamIds) || isFinalOrSemifinal(match)
    )
    .filter(match => !shouldExcludeMatch(match, excludeTeamIds));
  
  if (livePopularMatches.length > 0) {
    finalMatches = [...livePopularMatches];
  }
  
  // PRIORITY 2: Finals or semifinals (upcoming or just finished)
  const specialMatches = [...upcomingMatches, ...finishedMatches]
    .filter(match => isFinalOrSemifinal(match))
    .filter(match => !shouldExcludeMatch(match, excludeTeamIds));
  
  if (specialMatches.length > 0 && finalMatches.length < maxMatches) {
    const specialToAdd = specialMatches
      .filter(match => !finalMatches.some(m => m.fixture.id === match.fixture.id))
      .slice(0, maxMatches - finalMatches.length);
    finalMatches = [...finalMatches, ...specialToAdd];
  }
  
  // PRIORITY 3: Recently finished matches with popular teams
  const finishedPopularMatches = finishedMatches
    .filter(match => isPopularTeamMatch(match, popularTeamIds))
    .filter(match => !shouldExcludeMatch(match, excludeTeamIds))
    .filter(match => !finalMatches.some(m => m.fixture.id === match.fixture.id));
  
  if (finishedPopularMatches.length > 0 && finalMatches.length < maxMatches) {
    const finishedToAdd = finishedPopularMatches.slice(0, maxMatches - finalMatches.length);
    finalMatches = [...finalMatches, ...finishedToAdd];
  }
  
  // PRIORITY 4: Upcoming matches with popular teams
  const upcomingPopularMatches = upcomingMatches
    .filter(match => isPopularTeamMatch(match, popularTeamIds))
    .filter(match => !shouldExcludeMatch(match, excludeTeamIds))
    .filter(match => !finalMatches.some(m => m.fixture.id === match.fixture.id));
  
  if (upcomingPopularMatches.length > 0 && finalMatches.length < maxMatches) {
    const upcomingToAdd = upcomingPopularMatches.slice(0, maxMatches - finalMatches.length);
    finalMatches = [...finalMatches, ...upcomingToAdd];
  }
  
  // Ensure we don't exceed max matches
  finalMatches = finalMatches.slice(0, maxMatches);
  
  return {
    matches: finalMatches,
    breakdown: {
      live: liveMatches.length,
      upcoming: upcomingMatches.length,
      finished: finishedMatches.length,
      total: finalMatches.length
    }
  };
};

/**
 * Filter matches for popular leagues (main FixedScoreboard logic)
 */
export const filterPopularLeagueMatches = (
  allMatches: Match[],
  topTeamIds: number[] = [],
  options: FilterOptions = {}
): FilterResult => {
  const {
    popularLeagues = DEFAULT_POPULAR_LEAGUES,
    maxMatches = 6
  } = options;
  
  // Filter to popular leagues only
  const popularLeagueMatches = filterByPopularLeagues(allMatches, popularLeagues);
  
  // Combine manual popular teams with top teams from standings
  const combinedPopularTeams = Array.from(
    new Set([...DEFAULT_POPULAR_TEAMS, ...topTeamIds])
  );
  
  // Apply priority filtering
  return applyPriorityFiltering(popularLeagueMatches, {
    ...options,
    popularTeamIds: combinedPopularTeams,
    maxMatches
  });
};

/**
 * Filter matches for popular countries
 */
export const filterPopularCountryMatches = (
  allMatches: Match[],
  options: FilterOptions = {}
): FilterResult => {
  const {
    prioritizeCountries = POPULAR_COUNTRIES,
    maxMatches = 6
  } = options;
  
  // Filter matches from popular countries
  const countryMatches = filterByPopularCountries(allMatches, prioritizeCountries);
  
  // Apply priority filtering
  return applyPriorityFiltering(countryMatches, {
    ...options,
    maxMatches
  });
};

/**
 * Get matches within time window (for countdown timers)
 */
export const getMatchesWithinTimeWindow = (
  matches: Match[],
  hoursWindow: number = 8,
  currentTime: Date = new Date()
): Match[] => {
  return matches.filter(match => {
    if (match.fixture.status.short !== "NS") return false;
    
    try {
      const matchDate = parseISO(match.fixture.date);
      const hoursToMatch = (matchDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
      return hoursToMatch >= 0 && hoursToMatch <= hoursWindow;
    } catch (e) {
      return false;
    }
  });
};
