/**
 * Common exclusion filters for filtering unwanted matches
 * Used throughout the application to maintain consistent filtering
 */

// Minimal exclusion terms - Only exclude alternative formats and women's competitions
export const exclusionTerms = [
  // Women's competitions (keep minimal exclusion)
  'women', 'girls', 'feminine', 'women\'s', "women's",

  // Indoor/alternative formats only
  'futsal', 'indoor', 'beach', 'arena',

  // Only exclude clearly non-competitive exhibition matches
  'exhibition', 'testimonial'
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

  // Tier 3: Major football countries - greatly expanded to include more regions
  const tier3Countries = ['brazil', 'argentina', 'saudi arabia', 'egypt', 'colombia', 'usa', 'mexico', 
                          'netherlands', 'portugal', 'chile', 'ecuador', 'peru', 'uruguay', 'venezuela',
                          'china', 'south korea', 'japan', 'australia', 'turkey', 'russia', 'ukraine',
                          'belgium', 'croatia', 'poland', 'czech republic', 'denmark', 'sweden', 'norway',
                          'scotland', 'wales', 'ireland', 'greece', 'serbia', 'switzerland', 'austria',
                          'romania', 'bulgaria', 'slovenia', 'slovakia', 'hungary', 'finland', 'iceland',
                          'estonia', 'latvia', 'lithuania', 'belarus', 'moldova', 'georgia', 'armenia',
                          'azerbaijan', 'kazakhstan', 'uzbekistan', 'kyrgyzstan', 'tajikistan', 'iran',
                          'iraq', 'lebanon', 'jordan', 'syria', 'palestine', 'israel', 'uae', 'qatar',
                          'kuwait', 'bahrain', 'oman', 'yemen', 'morocco', 'tunisia', 'algeria', 'libya',
                          'sudan', 'ethiopia', 'kenya', 'uganda', 'tanzania', 'ghana', 'nigeria', 'senegal',
                          'ivory coast', 'cameroon', 'mali', 'burkina faso', 'zambia', 'zimbabwe',
                          'south africa', 'botswana', 'namibia', 'madagascar', 'mauritius', 'india',
                          'bangladesh', 'pakistan', 'afghanistan', 'nepal', 'sri lanka', 'maldives',
                          'thailand', 'vietnam', 'cambodia', 'laos', 'myanmar', 'malaysia', 'singapore',
                          'indonesia', 'philippines', 'mongolia', 'north korea', 'new zealand', 'fiji',
                          'papua new guinea', 'solomon islands', 'vanuatu', 'samoa', 'tonga', 'cook islands'];
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