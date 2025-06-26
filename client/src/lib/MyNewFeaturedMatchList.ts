
/**
 * Clean featured match list with only inclusion filters
 * No exclusion logic - only fetches matches from specified popular leagues
 */

// Featured match priority leagues - only these will be fetched
export const FEATURED_MATCH_LEAGUES = [
  // Priority international competitions
  { id: 38, name: "UEFA U21 Championship", country: "World", priority: 1 },
  { id: 15, name: "FIFA Club World Cup", country: "World", priority: 2 },
  
  // Major UEFA competitions
  { id: 2, name: "UEFA Champions League", country: "Europe", priority: 3 },
  { id: 3, name: "UEFA Europa League", country: "Europe", priority: 4 },
  { id: 848, name: "UEFA Conference League", country: "Europe", priority: 5 },
  { id: 5, name: "UEFA Nations League", country: "Europe", priority: 6 },
  
  // World competitions
  { id: 1, name: "World Cup", country: "World", priority: 7 },
  { id: 4, name: "Euro Championship", country: "World", priority: 8 },
  { id: 9, name: "Copa America", country: "World", priority: 9 },
  { id: 6, name: "Africa Cup of Nations", country: "World", priority: 10 },
  
  // Top domestic leagues
  { id: 39, name: "Premier League", country: "England", priority: 11 },
  { id: 140, name: "La Liga", country: "Spain", priority: 12 },
  { id: 135, name: "Serie A", country: "Italy", priority: 13 },
  { id: 78, name: "Bundesliga", country: "Germany", priority: 14 },
  { id: 61, name: "Ligue 1", country: "France", priority: 15 },
];

// Extract just the league IDs for easy filtering
export const FEATURED_MATCH_LEAGUE_IDS = FEATURED_MATCH_LEAGUES.map(league => league.id);

// Priority leagues (UEFA U21 and FIFA Club World Cup get highest priority)
export const PRIORITY_LEAGUE_IDS = [38, 15];

/**
 * Check if a fixture should be included (simple inclusion check)
 */
export const shouldIncludeInFeaturedMatches = (fixture: any): boolean => {
  if (!fixture?.league?.id) {
    return false;
  }

  // Only include if it's in our featured leagues list
  return FEATURED_MATCH_LEAGUE_IDS.includes(fixture.league.id);
};

/**
 * Check if teams have valid names (minimal validation)
 */
export const hasValidTeams = (fixture: any): boolean => {
  return !!(fixture?.teams?.home?.name && fixture?.teams?.away?.name);
};

/**
 * Get league priority (lower number = higher priority)
 */
export const getLeaguePriority = (leagueId: number): number => {
  const league = FEATURED_MATCH_LEAGUES.find(l => l.id === leagueId);
  return league?.priority || 999;
};

/**
 * Filter fixtures to only featured matches with simple validation
 */
export const filterFeaturedMatches = (fixtures: any[]): any[] => {
  if (!Array.isArray(fixtures)) {
    return [];
  }

  return fixtures.filter(fixture => {
    // Must be in our featured leagues list
    if (!shouldIncludeInFeaturedMatches(fixture)) {
      return false;
    }

    // Must have valid team names
    if (!hasValidTeams(fixture)) {
      return false;
    }

    return true;
  });
};

/**
 * Sort matches by priority and status
 */
export const sortFeaturedMatches = (matches: any[]): any[] => {
  return matches.sort((a, b) => {
    const aStatus = a.fixture?.status?.short || '';
    const bStatus = b.fixture?.status?.short || '';
    
    // Live matches first
    const aIsLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(aStatus);
    const bIsLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(bStatus);
    
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;
    
    // Priority leagues next
    const aPriority = getLeaguePriority(a.league?.id);
    const bPriority = getLeaguePriority(b.league?.id);
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // Finally by time
    return new Date(a.fixture?.date || 0).getTime() - new Date(b.fixture?.date || 0).getTime();
  });
};

/**
 * Main function to get featured matches with clean filtering
 */
export const getFeaturedMatches = (fixtures: any[], maxMatches: number = 8): any[] => {
  const filtered = filterFeaturedMatches(fixtures);
  const sorted = sortFeaturedMatches(filtered);
  return sorted.slice(0, maxMatches);
};
