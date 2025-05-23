/**
 * Common exclusion filters for filtering unwanted matches
 * Used throughout the application to maintain consistent filtering
 */

// Expanded and organized list of terms that indicate unwanted matches
export const exclusionTerms = [
  // Youth and development leagues
  'u15', 'u16', 'u17', 'u18', 'u19', 'u20', 'u21', 'u23', 'youth', 'junior', 'reserve', 'amateur',
  'development', 'academy', 'primavera', 'reserves',
  
  // Women's competitions
  'women', 'girls', 
  
  // Lower divisions and regional competitions
  'regional', 'division 3', 'division 4', 'kosice', 'boys', 
  
  // Non-competitive matches
  'friendly', 'test', 'club friendlies', 'exhibition',
  
  // Indoor/alternative formats
  'futsal', 'indoor',
  
  // Minor competitions
  'national cup 3', 'cup qualifying',
  
  // South American leagues we want to exclude
  'brazilian serie b', 'brazilian serie c', 'chilean primera b', 'copa chile', 
  'copa do brasil', 'copa argentina', 'copa colombia', 'copa ecuador',
  'paraguay division profesional', 'peruvian primera division',
  'uruguayan primera division', 'venezuelan primera division'
];

/**
 * Helper function to check if a fixture should be excluded based on exclusion terms
 * @param leagueName League name (will be converted to lowercase)
 * @param homeTeamName Home team name (will be converted to lowercase) 
 * @param awayTeamName Away team name (will be converted to lowercase)
 * @returns true if fixture should be excluded, false if it should be kept
 */
export function shouldExcludeFixture(
  leagueName: string,
  homeTeamName: string,
  awayTeamName: string
): boolean {
  // Convert inputs to lowercase
  const league = leagueName.toLowerCase();
  const homeTeam = homeTeamName.toLowerCase();
  const awayTeam = awayTeamName.toLowerCase();
  
  // Check if any exclusion term exists in league or team names
  return exclusionTerms.some(term => 
    league.includes(term) || 
    homeTeam.includes(term) || 
    awayTeam.includes(term)
  );
}