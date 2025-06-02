
/**
 * Specialized exclusion filters for TodaysMatchesByCountryNew component
 * This is a copy of the main exclusion filters that can be optimized specifically for this component
 */

// Enhanced exclusion terms organized by category for TodaysMatchesByCountryNew filtering
export const matchByCountryExclusionTerms = [
  // Women's competitions (comprehensive exclusion)
  'women', 'girls', 'feminine', 'feminin', 'donne', 'frauen', 'femenino',
  'women\'s', "women's", 'friendlies women', 'women friendlies',

  // Non-competitive matches (allow exhibition and FIFA matches)
  'test', 'testimonial', 'charity',

  // Indoor/alternative formats
  'futsal', 'indoor', 'beach', 'arena',

  // Esports and virtual competitions (but allow FIFA competitions)
  'esoccer', 'e-soccer', 'esports', 'virtual', 'cyber', 'pes', 'efootball',

  // Unknown/unspecified competitions
  'unknown', 'tbd', 'to be determined', 'unspecified'
];

// Youth/development terms - now used for limiting rather than excluding
export const youthDevelopmentTerms = [
  'u15', 'u16', 'u17', 'u18', 'u19', 'u20', 'u21', 'u23', 'youth', 'junior', 'reserve', 'amateur',
  'development', 'academy', 'primavera', 'reserves', 'juvenil', 'cadete', 'infantil'
];

/**
 * Check if a fixture should be excluded based on league name and team names
 * Specialized version for TodaysMatchesByCountryNew component
 * 
 * @param leagueName - The name of the league
 * @param homeTeamName - The name of the home team
 * @param awayTeamName - The name of the away team
 * @param applyYouthFilter - Whether to apply youth/development limiting (when match count > 10)
 * @returns true if the fixture should be excluded, false otherwise
 */
export const shouldExcludeMatchByCountry = (
  leagueName: string, 
  homeTeamName: string, 
  awayTeamName: string,
  applyYouthFilter: boolean = false
): boolean => {
  // Convert to lowercase for case-insensitive matching
  const league = leagueName.toLowerCase();
  const homeTeam = homeTeamName.toLowerCase();
  const awayTeam = awayTeamName.toLowerCase();

  // Check if this is a regional/international competition that should NEVER be excluded
  const isRegionalCompetition = 
    // UEFA competitions
    league.includes('uefa') ||
    league.includes('champions league') ||
    league.includes('europa league') ||
    league.includes('conference league') ||
    league.includes('euro') ||
    league.includes('european') ||
    // FIFA competitions
    league.includes('fifa') ||
    league.includes('world cup') ||
    league.includes('fifa club world cup') ||
    // CONMEBOL competitions
    league.includes('conmebol') ||
    league.includes('copa america') ||
    league.includes('copa libertadores') ||
    league.includes('copa sudamericana') ||
    league.includes('libertadores') ||
    league.includes('sudamericana') ||
    // International Friendlies (both men's and women's for regional competitions)
    league.includes('friendlies') ||
    league.includes('international') ||
    // Other regional competitions
    league.includes('nations league') ||
    league.includes('confederation') ||
    league.includes('qualifying') ||
    league.includes('world') ||
    league.includes('continental');

  // If it's a regional/international competition, never exclude it
  if (isRegionalCompetition) {
    return false;
  }

  // Check if any main exclusion term exists in league or team names
  const isMainExcluded = matchByCountryExclusionTerms.some(term => 
    league.includes(term) || 
    homeTeam.includes(term) || 
    awayTeam.includes(term)
  );

  // If main exclusion applies, exclude the match
  if (isMainExcluded) return true;

  // If youth filter is enabled and this is a youth match, apply limiting logic
  if (applyYouthFilter) {
    const isYouthMatch = youthDevelopmentTerms.some(term => 
      league.includes(term) || 
      homeTeam.includes(term) || 
      awayTeam.includes(term)
    );
    if (isYouthMatch) return true; // Still exclude when limiting is needed
  }

  return false;
};

/**
 * Additional filtering functions for specific use cases
 */

/**
 * Check if a match is from an unknown or invalid source
 */
export const isUnknownMatch = (leagueName: string): boolean => {
  const league = leagueName.toLowerCase();
  return ['unknown', 'tbd', 'to be determined', 'unspecified'].some(term => 
    league.includes(term)
  );
};

/**
 * Check if a match is an esports/virtual match
 */
export const isEsportsMatch = (leagueName: string, homeTeamName: string, awayTeamName: string): boolean => {
  const league = leagueName.toLowerCase();
  const homeTeam = homeTeamName.toLowerCase();
  const awayTeam = awayTeamName.toLowerCase();
  
  const esportsTerms = ['esoccer', 'e-soccer', 'esports', 'virtual', 'cyber', 'fifa', 'pes', 'efootball'];
  
  return esportsTerms.some(term => 
    league.includes(term) || 
    homeTeam.includes(term) || 
    awayTeam.includes(term)
  );
};

/**
 * Check if a match is from youth/development leagues
 */
export const isYouthMatch = (leagueName: string, homeTeamName?: string, awayTeamName?: string): boolean => {
  const league = leagueName.toLowerCase();
  const homeTeam = homeTeamName?.toLowerCase() || '';
  const awayTeam = awayTeamName?.toLowerCase() || '';
  
  return youthDevelopmentTerms.some(term => 
    league.includes(term) || 
    homeTeam.includes(term) || 
    awayTeam.includes(term)
  );
};

/**
 * Check if a match should be limited (youth matches when there are too many)
 * This is used for priority-based filtering instead of hard exclusion
 */
export const shouldLimitYouthMatch = (
  leagueName: string,
  homeTeamName: string,
  awayTeamName: string,
  totalMatchCount: number,
  maxMatches: number = 10
): boolean => {
  // Only apply youth limiting when we have more matches than the limit
  if (totalMatchCount <= maxMatches) {
    return false;
  }
  
  return isYouthMatch(leagueName, homeTeamName, awayTeamName);
};

/**
 * Check if a match is from women's competitions
 */
export const isWomensMatch = (leagueName: string): boolean => {
  const league = leagueName.toLowerCase();
  const womensTerms = ['women', 'girls', 'feminine', 'feminin', 'donne', 'frauen', 'femenino', 'women\'s', "women's"];
  
  return womensTerms.some(term => league.includes(term));
};
