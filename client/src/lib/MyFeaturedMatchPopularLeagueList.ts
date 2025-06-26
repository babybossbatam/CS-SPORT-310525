
// Centralized Popular Leagues Configuration for Featured Matches
// This file manages all league IDs that should appear in featured matches

export interface PopularLeague {
  id: number;
  name: string;
  country: string;
  logo?: string;
  priority: number;
}

// Featured Match Popular Leagues - these leagues get special treatment in featured matches
export const FEATURED_MATCH_POPULAR_LEAGUES: PopularLeague[] = [
  // UEFA Competitions (Highest Priority)
  { id: 2, name: 'UEFA Champions League', country: 'Europe', priority: 1 },
  { id: 3, name: 'UEFA Europa League', country: 'Europe', priority: 2 },
  { id: 848, name: 'UEFA Conference League', country: 'Europe', priority: 3 },
  { id: 5, name: 'UEFA Nations League', country: 'Europe', priority: 4 },
  
  // FIFA World Competitions
  { id: 1, name: 'World Cup', country: 'World', priority: 5 },
  { id: 4, name: 'Euro Championship', country: 'World', priority: 6 },
  { id: 15, name: 'FIFA Club World Cup', country: 'World', priority: 7 },
  
  // Youth Championships (Special Priority for Current Tournaments)
  { id: 38, name: 'UEFA U21 Championship', country: 'World', priority: 8 },
  
  // Top 5 European Leagues
  { id: 39, name: 'Premier League', country: 'England', priority: 10 },
  { id: 140, name: 'La Liga', country: 'Spain', priority: 11 },
  { id: 135, name: 'Serie A', country: 'Italy', priority: 12 },
  { id: 78, name: 'Bundesliga', country: 'Germany', priority: 13 },
  { id: 61, name: 'Ligue 1', country: 'France', priority: 14 },
  
  // Other Continental Competitions
  { id: 9, name: 'Copa America', country: 'World', priority: 15 },
  { id: 22, name: 'CONCACAF Gold Cup', country: 'World', priority: 16 },
  { id: 6, name: 'Africa Cup of Nations', country: 'World', priority: 17 },
  { id: 7, name: 'Asian Cup', country: 'World', priority: 18 },
  
  // Major Domestic Cups
  { id: 137, name: 'Coppa Italia', country: 'Italy', priority: 20 },
  { id: 45, name: 'FA Cup', country: 'England', priority: 21 },
  { id: 143, name: 'Copa del Rey', country: 'Spain', priority: 22 },
  { id: 81, name: 'DFB Pokal', country: 'Germany', priority: 23 },
  
  // Popular International Leagues
  { id: 307, name: 'Saudi Pro League', country: 'Saudi Arabia', priority: 25 },
  { id: 233, name: 'Egyptian Premier League', country: 'Egypt', priority: 26 },
];

// Extract just the league IDs for easy filtering
export const FEATURED_MATCH_POPULAR_LEAGUE_IDS = FEATURED_MATCH_POPULAR_LEAGUES.map(league => league.id);

// Priority leagues that get special treatment (top competitions)
export const FEATURED_MATCH_PRIORITY_LEAGUE_IDS = FEATURED_MATCH_POPULAR_LEAGUES
  .filter(league => league.priority <= 15) // Only top priority leagues
  .map(league => league.id);

// Helper function to check if a league is popular
export const isFeaturedMatchPopularLeague = (leagueId: number): boolean => {
  return FEATURED_MATCH_POPULAR_LEAGUE_IDS.includes(leagueId);
};

// Helper function to check if a league is priority
export const isFeaturedMatchPriorityLeague = (leagueId: number): boolean => {
  return FEATURED_MATCH_PRIORITY_LEAGUE_IDS.includes(leagueId);
};

// Helper function to get league priority
export const getFeaturedMatchLeaguePriority = (leagueId: number): number => {
  const league = FEATURED_MATCH_POPULAR_LEAGUES.find(l => l.id === leagueId);
  return league ? league.priority : 999;
};

// Helper function to get league info
export const getFeaturedMatchLeagueInfo = (leagueId: number): PopularLeague | undefined => {
  return FEATURED_MATCH_POPULAR_LEAGUES.find(l => l.id === leagueId);
};
