
/**
 * Specialized exclusion filters for TodaysMatchesByCountryNew component
 * This is a copy of the main exclusion filters that can be optimized specifically for this component
 */

// Enhanced exclusion terms organized by category for TodaysMatchesByCountryNew filtering
export const matchByCountryExclusionTerms = [
  // Women's competitions (comprehensive exclusion)
  'women', 'girls', 'feminine', 'feminin', 'donne', 'frauen', 'femenino',
  'women\'s', "women's", 'friendlies women', 'women friendlies',

  // Non-competitive/exhibition matches (but allow World Friendlies)
  'test', 'exhibition', 'testimonial', 'charity',

  // Indoor/alternative formats
  'futsal', 'indoor', 'beach', 'arena',

  // Esports and virtual competitions
  'esoccer', 'e-soccer', 'esports', 'virtual', 'cyber', 'fifa', 'pes', 'efootball',

  // Unknown/unspecified competitions
  'unknown', 'tbd', 'to be determined', 'unspecified'
];

// Optional youth/development terms - only applied when match limit is reached
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
 * @param applyYouthFilter - Whether to apply youth/development filtering (when match count > 10)
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

  // Check if any main exclusion term exists in league or team names
  const isMainExcluded = matchByCountryExclusionTerms.some(term => 
    league.includes(term) || 
    homeTeam.includes(term) || 
    awayTeam.includes(term)
  );

  // If main exclusion applies, exclude the match
  if (isMainExcluded) return true;

  // If youth filter is enabled and this is a youth match, exclude it
  if (applyYouthFilter) {
    const isYouthMatch = youthDevelopmentTerms.some(term => 
      league.includes(term) || 
      homeTeam.includes(term) || 
      awayTeam.includes(term)
    );
    if (isYouthMatch) return true;
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
export const isYouthMatch = (leagueName: string): boolean => {
  const league = leagueName.toLowerCase();
  
  return youthDevelopmentTerms.some(term => league.includes(term));
};

/**
 * Check if a match is from women's competitions
 */
export const isWomensMatch = (leagueName: string): boolean => {
  const league = leagueName.toLowerCase();
  const womensTerms = ['women', 'girls', 'feminine', 'feminin', 'donne', 'frauen', 'femenino', 'women\'s', "women's"];
  
  return womensTerms.some(term => league.includes(term));
};
