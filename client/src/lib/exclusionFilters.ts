/**
 * Common exclusion filters for filtering unwanted matches
 * Used throughout the application to maintain consistent filtering
 */

// Enhanced exclusion terms organized by category for geographic filtering
export const exclusionTerms = [
  // Youth and development leagues (strict filtering)
  'u15', 'u16', 'u17', 'u18', 'u19', 'u20', 'u21', 'u23', 'youth', 'junior', 'reserve', 'amateur',
  'development', 'academy', 'primavera', 'reserves', 'juvenil', 'cadete', 'infantil',

  // Women's competitions (filter unless specifically requested)
  'women', 'girls', 'feminine', 'feminin', 'donne', 'frauen', 'femenino',

  // Lower divisions and regional competitions
  'regional', 'division 3', 'division 4', 'division 5', 'third division', 'fourth division',
  '2. bundesliga', '2 bundesliga', 'second bundesliga', 'bundesliga 2', '2nd bundesliga', 'zweite bundesliga',
  'serie b', 'serie c', 'serie d', 'segunda division', 'tercera division',
  'championship', 'league one', 'league two', 'non-league',

  // Non-competitive/exhibition matches (but allow World Friendlies)
  'test', 'exhibition', 'testimonial', 'charity',
  
  // Women's specific competitions
  'friendlies women', 'women friendlies',

  // Indoor/alternative formats
  'futsal', 'indoor', 'beach', 'arena',

  // Minor competitions and qualifying rounds
  'national cup 3', 'cup qualifying', 'preliminary', 'qualification',

  // Specific lower-tier leagues to exclude
  'eintracht braunschweig', 'fc saarbrücken', 'kosice', 'boys',

  // South American lower divisions (exclude unless major competition)
  'brazilian serie b', 'brazilian serie c', 'chilean primera b', 'copa chile', 
  'copa do brasil', 'copa argentina', 'copa colombia', 'copa ecuador',
  'paraguay division profesional', 'peruvian primera division',
  'uruguayan primera division', 'venezuelan primera division', 'gaúcho', 'gaucho',

  // Additional regional/state competitions to filter
  'catarinense', 'paulista', 'carioca', 'mineiro', 'gaucho', 'baiano', 'pernambucano',
  'sergipano', 'alagoano', 'paraibano', 'cearense', 'potiguar', 'maranhense'
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

  // Tier 3: Other popular countries (only major leagues)
  const tier3Countries = ['brazil', 'saudi arabia', 'egypt'];
  if (tier3Countries.some(c => countryLower.includes(c))) {
    return 3;
  }

  // Tier 4: CONMEBOL competitions
  if (countryLower.includes('conmebol') || 
      leagueLower.includes('copa libertadores') || 
      leagueLower.includes('copa sudamericana')) {
    return 4;
  }

  return 999; // Low priority
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