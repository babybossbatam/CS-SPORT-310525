/**
 * Common exclusion filters for filtering unwanted matches
 * Used throughout the application to maintain consistent filtering
 */

// Reduced exclusion terms - Only exclude clearly amateur/non-professional leagues
export const exclusionTerms = [
  // Only exclude clearly amateur leagues
  'amateur', 'development', 'academy', 'primavera',

  // Women's competitions (keep minimal exclusion)
  'women', 'girls', 'feminine', 'women\'s', "women's",

  // Only exclude very low divisions
  'division 4', 'division 5', 
  'oberliga westfalen', 'oberliga baden', 'oberliga bayern',

  // Indoor/alternative formats
  'futsal', 'indoor', 'beach', 'arena',

  // Only exclude clearly non-competitive matches
  'exhibition', 'testimonial', 'charity',

  // US semi-professional only
  'npsl', 'usl w league', 'wpsl'
];

// Safe substring function to handle null/undefined values
function safeSubstring(value: any, start: number, end?: number): string {
  // Return empty string if value is null or undefined
  if (value == null) {
    return '';
  }

  // Convert to string if it's not already (handles numbers, etc.)
  const str = String(value);

  // If end is provided, use it, otherwise just use start parameter
  return end !== undefined ? str.substring(start, end) : str.substring(start);
}

/**
 * Check if a fixture should be prioritized based on geographic preferences
 * @param country Country name
 * @param leagueName League name
 * @returns priority tier (1 = highest, 999 = lowest)
 */
export function getGeographicPriority(country: string, leagueName: string): number {
  const countryLower = country?.toLowerCase() || '';
  const leagueLower = leagueName?.toLowerCase() || '';

  // Tier 1: Top European countries
  const tier1Countries = ['england', 'spain', 'italy', 'germany', 'france'];
  if (tier1Countries.some(c => countryLower.includes(c))) {
    return 1;
  }

  // Tier 2: International competitions
  if (countryLower.includes('world') || countryLower.includes('europe') ||
      leagueLower.includes('champions league') || leagueLower.includes('europa league') ||
      leagueLower.includes('conference league') || leagueLower.includes('world cup') ||
      leagueLower.includes('euro') || leagueLower.includes('copa america')) {
    return 2;
  }

  // Tier 3: Major football countries - significantly expanded
  const tier3Countries = ['brazil', 'argentina', 'saudi arabia', 'egypt', 'colombia', 'usa', 'mexico', 
                          'netherlands', 'portugal', 'chile', 'ecuador', 'peru', 'uruguay', 'venezuela',
                          'china', 'south korea', 'japan', 'australia', 'turkey', 'russia', 'ukraine',
                          'belgium', 'croatia', 'poland', 'czech republic', 'denmark', 'sweden', 'norway',
                          'scotland', 'wales', 'ireland', 'greece', 'serbia', 'switzerland', 'austria'];
  if (tier3Countries.some(c => countryLower.includes(c))) {
    return 3;
  }

  // Tier 4: CONMEBOL and other continental competitions
  if (countryLower.includes('conmebol') || countryLower.includes('concacaf') ||
      countryLower.includes('caf') || countryLower.includes('afc') ||
      leagueLower.includes('copa libertadores') || 
      leagueLower.includes('copa sudamericana') ||
      leagueLower.includes('gold cup') || leagueLower.includes('asian cup')) {
    return 4;
  }

  // Tier 5: All other countries (instead of low priority)
  return 5;
}

/**
 * Helper function to check if a fixture should be excluded based on exclusion terms
 * @param leagueName League name (will be converted to lowercase)
 * @param homeTeamName Home team name (will be converted to lowercase) 
 * @param awayTeamName Away team name (will be converted to lowercase)
 * @param country Optional country name to check for null/invalid values
 * @returns true if fixture should be excluded, false if it should be kept
 */
export function shouldExcludeFixture(
  leagueName: string,
  homeTeamName: string,
  awayTeamName: string,
  country?: string | null
): boolean {
  // Exclude fixtures with null, undefined, or invalid country values
  if (country !== undefined && (!country || country === null || country.trim() === '' || country.toLowerCase() === 'unknown')) {
    return true;
  }

  // Convert inputs to lowercase with safe handling
  const league = safeSubstring(leagueName, 0).toLowerCase();
  const homeTeam = safeSubstring(homeTeamName, 0).toLowerCase();
  const awayTeam = safeSubstring(awayTeamName, 0).toLowerCase();

  // Check if any exclusion term exists in league or team names
  return exclusionTerms.some(term => 
    league.includes(term) || 
    homeTeam.includes(term) || 
    awayTeam.includes(term)
  );
}