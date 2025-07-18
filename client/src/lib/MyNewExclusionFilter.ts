
/**
 * Simple exclusion filter specifically for MyHomeFeaturedMatchNew component
 * Excludes women's competitions and other unwanted matches
 */

// Specific women's competitions to exclude
const specificWomensCompetitions = [
  'copa america femenina',
  'africa cup of nations - women',
  'uefa nations league - women',
  'fifa women\'s world cup',
  'uefa women\'s championship',
  'olympic women\'s tournament'
];

// General women's competition terms to exclude
const womensCompetitionTerms = [
  'women', 'girls', 'feminine', 'feminin', 'donne', 'frauen', 'femenina', 'femenino',
  'women\'s', "women's", 'ladies', 'female'
];

// Other unwanted competition terms
const unwantedTerms = [
  'esoccer', 'e-soccer', 'esports', 'virtual', 'cyber', 'pes', 'efootball',
  'futsal', 'indoor', 'beach', 'arena'
];

/**
 * Check if a match should be excluded from MyHomeFeaturedMatchNew
 * @param leagueName - League name to check
 * @param homeTeamName - Home team name to check  
 * @param awayTeamName - Away team name to check
 * @param country - Country name to check
 * @returns true if match should be excluded, false otherwise
 */
export const shouldExcludeFromFeaturedMatch = (
  leagueName: string,
  homeTeamName: string = '',
  awayTeamName: string = '',
  country: string = ''
): boolean => {
  // Convert to lowercase for case-insensitive matching
  const league = leagueName.toLowerCase();
  const homeTeam = homeTeamName.toLowerCase();
  const awayTeam = awayTeamName.toLowerCase();
  const countryLower = country.toLowerCase();
  
  // Debug logging to see what's being excluded
  const debugMatch = () => {
    console.log(`🔍 [EXCLUSION DEBUG] Checking: ${homeTeamName} vs ${awayTeamName}`, {
      league: leagueName,
      country: country,
      isSpecificWomens: false,
      isGeneralWomens: false,
      isUnwanted: false
    });
  };

  // First check for specific women's competitions
  const isSpecificWomensCompetition = specificWomensCompetitions.some(competition => 
    league.includes(competition)
  );

  if (isSpecificWomensCompetition) {
    return true;
  }

  // Check for general women's competitions (be very specific)
  const isWomensCompetition = womensCompetitionTerms.some(term => {
    // Only exclude if the term appears clearly in context of women's sports
    const leagueMatch = league.includes(term) && 
                       (league.includes('women') || league.includes('femenina') || league.includes('feminine'));
    
    const teamMatch = (homeTeam.includes(term) && homeTeam.includes('women')) || 
                     (awayTeam.includes(term) && awayTeam.includes('women'));
    
    // Be extra specific for common false positive terms
    if (term === 'women' || term === 'girls') {
      return leagueMatch || teamMatch;
    }
    
    // For other terms, only match if clearly in women's context
    return leagueMatch || teamMatch;
  });

  // Check for other unwanted competitions (esports, virtual, etc.)
  const isUnwantedCompetition = unwantedTerms.some(term =>
    league.includes(term) || 
    homeTeam.includes(term) || 
    awayTeam.includes(term)
  );

  const shouldExcludeResult = isWomensCompetition || isUnwantedCompetition;
  
  // Debug log exclusions
  if (shouldExcludeResult) {
    console.log(`❌ [EXCLUSION] Excluding: ${homeTeamName} vs ${awayTeamName}`, {
      league: leagueName,
      country: country,
      reason: isSpecificWomensCompetition ? 'Specific women\'s competition' : 
              isWomensCompetition ? 'General women\'s competition' : 
              isUnwantedCompetition ? 'Unwanted competition type' : 'Unknown'
    });
  }
  
  return shouldExcludeResult;
};

/**
 * Check specifically for women's competitions
 */
export const isWomensCompetition = (leagueName: string): boolean => {
  const league = leagueName.toLowerCase();
  return womensCompetitionTerms.some(term => league.includes(term));
};
