
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

  // First check for specific women's competitions
  const isSpecificWomensCompetition = specificWomensCompetitions.some(competition => 
    league.includes(competition)
  );

  if (isSpecificWomensCompetition) {
    return true;
  }

  // Check for general women's competitions (but be more careful)
  const isWomensCompetition = womensCompetitionTerms.some(term => {
    // Only exclude if the term appears in the league name or team names
    // Don't exclude based on country alone to avoid false positives
    return league.includes(term) || 
           (homeTeam.includes(term) && homeTeam.includes('women')) || 
           (awayTeam.includes(term) && awayTeam.includes('women'));
  });

  // Check for other unwanted competitions (esports, virtual, etc.)
  const isUnwantedCompetition = unwantedTerms.some(term =>
    league.includes(term) || 
    homeTeam.includes(term) || 
    awayTeam.includes(term)
  );

  return isWomensCompetition || isUnwantedCompetition;
};

/**
 * Check specifically for women's competitions
 */
export const isWomensCompetition = (leagueName: string): boolean => {
  const league = leagueName.toLowerCase();
  return womensCompetitionTerms.some(term => league.includes(term));
};
