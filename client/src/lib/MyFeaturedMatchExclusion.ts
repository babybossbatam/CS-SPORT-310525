/**
 * Specialized exclusion filters for MyHomeFeaturedMatchNew component
 * This provides targeted filtering for the featured match display to ensure only high-quality matches are shown
 */

// Enhanced exclusion terms for featured matches (more restrictive than general filtering)
export const featuredMatchExclusionTerms = [
  // Women's competitions (comprehensive exclusion)
  'women', 'girls', 'feminine', 'feminin', 'donne', 'frauen', 'femenino',
  'women\'s', "women's", 'friendlies women', 'women friendlies',

  // Youth competitions (stricter for featured matches)
  'u15', 'u16', 'u17', 'u18', 'u19', 'u20', 'u21', 'u23',
  'youth', 'junior', 'reserve', 'reserves', 'amateur',
  'development', 'academy', 'primavera',
  'juvenil', 'cadete', 'infantil',

  // Non-competitive matches
  'test', 'testimonial', 'charity', 'exhibition', 'friendlies',

  // Indoor/alternative formats
  'futsal', 'indoor', 'beach', 'arena',

  // Esports and virtual competitions
  'esoccer', 'e-soccer', 'esports', 'virtual', 'cyber', 'pes', 'efootball',

  // World Cup qualification exclusions (all regions for featured matches)
  'world cup - qualification asia',
  'world cup - qualification concacaf',
  'qualification asia',
  'qualification concacaf',

  // Additional regional exclusions
  'asia',
  'concacaf',

  // Specific tournament and league exclusions for featured matches
  'tournoi maurice revello',
  'maurice revello',
  'serie a',
  'serie b',
  'brazil serie a',
  'usa'
];

// Lower-tier league patterns that should be excluded from featured matches
export const lowerTierLeagueTerms = [
  // Regional and lower divisions
  'regional', 'provincial', 'district', 'amateur',
  'county', 'state', 'local', 'municipal',
  'third division', '3rd division', 'fourth division', '4th division',
  'quinta division', 'sexta division',
  'relegation', 'promotion playoff',

  // Specific lower-tier indicators
  'segunda b', 'tercera', 'cuarta',
  'division 3', 'division 4', 'division 5',
  'liga regional', 'liga provincial',

  // Russian lower tiers (specifically for current matches showing)
  'second league', 'second league -', 'second league a',
  'second league b', 'second league group',
  'third league', 'fourth league',
  'pfl', 'professional football league',

  // German lower tiers
  'oberliga', 'regionalliga', 'verbandsliga',
  'landesliga', 'bezirksliga', 'kreisliga',

  // English lower tiers
  'conference', 'isthmian', 'northern premier',
  'southern league', 'national league north',
  'national league south', 'step',

  // Italian lower tiers
  'serie c', 'serie d', 'eccellenza',
  'promozione', 'prima categoria',

  // Spanish lower tiers
  'segunda rfef', 'tercera rfef',
  'regional preferente', 'primera regional',

  // French lower tiers
  'national 2', 'national 3',
  'regional', 'championnat national',

  // General lower tier patterns
  'group 1', 'group 2', 'group 3', 'group 4',
  'group 5', 'group 6', 'group 7', 'group 8',
  'zone', 'section', 'pool',
  'spring season', 'autumn season',
  'gold', 'silver', 'bronze'
];

// Teams that should be excluded from featured matches (reserve teams, etc.)
export const excludedTeamPatterns = [
  'ii', ' ii ', ' 2 ', ' b ', ' reserve', ' reserves',
  'amateur', 'youth', 'academy', 'development',
  'under 23', 'u23', 'under 21', 'u21', 'under 19', 'u19'
];

/**
 * Check if a fixture should be excluded from featured match display
 * This is more restrictive than general match filtering
 * 
 * @param leagueName - The name of the league
 * @param homeTeamName - The name of the home team
 * @param awayTeamName - The name of the away team
 * @returns true if the fixture should be excluded, false otherwise
 */
export const shouldExcludeFeaturedMatch = (
  leagueName: string, 
  homeTeamName: string, 
  awayTeamName: string
): boolean => {
  // Convert to lowercase for case-insensitive matching
  const league = leagueName.toLowerCase();
  const homeTeam = homeTeamName.toLowerCase();
  const awayTeam = awayTeamName.toLowerCase();

  // Check if this is a major international competition that should NEVER be excluded
  const isMajorInternationalCompetition = 
    // UEFA competitions
    (league.includes('uefa') && !league.includes('women') && !league.includes('youth')) ||
    (league.includes('champions league') && !league.includes('women')) ||
    (league.includes('europa league') && !league.includes('women')) ||
    (league.includes('conference league') && !league.includes('women')) ||
    (league.includes('euro') && league.includes('championship') && !league.includes('women')) ||
    // FIFA competitions
    (league.includes('fifa') && !league.includes('women') && !league.includes('youth')) ||
    (league.includes('world cup') && !league.includes('women') && !league.includes('youth')) ||
    // CONMEBOL competitions
    (league.includes('conmebol') && !league.includes('women')) ||
    (league.includes('copa america') && !league.includes('women')) ||
    (league.includes('copa libertadores') && !league.includes('women')) ||
    (league.includes('copa sudamericana') && !league.includes('women')) ||
    (league.includes('libertadores') && !league.includes('women')) ||
    (league.includes('sudamericana') && !league.includes('women'));

  // If it's a major international competition, never exclude it
  if (isMajorInternationalCompetition) {
    return false;
  }

  // Check main exclusion terms
  const isMainExcluded = featuredMatchExclusionTerms.some(term => 
    league.includes(term) || 
    homeTeam.includes(term) || 
    awayTeam.includes(term)
  );

  if (isMainExcluded) return true;

  // Check lower-tier league patterns for featured matches
  const isLowerTier = lowerTierLeagueTerms.some(term => 
    league.includes(term)
  );

  if (isLowerTier) return true;

  // Check for excluded team patterns (reserve teams, etc.)
  const hasExcludedTeam = excludedTeamPatterns.some(pattern => 
    homeTeam.includes(pattern) || 
    awayTeam.includes(pattern)
  );

  if (hasExcludedTeam) return true;

  return false;
};

/**
 * Check if a match is from a high-priority league suitable for featuring
 */
export const isHighPriorityLeague = (match: any): boolean => {
  const name = (match.league?.name || "").toLowerCase();
  const popularLeagues = [39, 140, 135, 78, 61]; // Premier League, La Liga, Serie A, Bundesliga, Ligue 1
  
  // Popular domestic leagues
  if (popularLeagues.includes(match.league?.id)) {
    return true;
  }

  // Major international competitions
  return (name.includes("champions league") ||
          name.includes("europa league") ||
          name.includes("conference league") ||
          name.includes("uefa nations league") ||
          name.includes("world cup") ||
          name.includes("copa america") ||
          name.includes("libertadores")) && !name.includes("women");
};

/**
 * Check if teams are considered "big" or popular enough for featuring
 */
export const hasPopularTeams = (match: any, popularTeamIds: number[] = []): boolean => {
  const homeTeamId = match.teams?.home?.id;
  const awayTeamId = match.teams?.away?.id;

  return popularTeamIds.includes(homeTeamId) || popularTeamIds.includes(awayTeamId);
};

/**
 * Check if a match qualifies as "featured" based on multiple criteria
 */
export const isFeaturedWorthy = (
  match: any, 
  popularTeamIds: number[] = []
): boolean => {
  // Must not be excluded
  if (shouldExcludeFeaturedMatch(
    match.league?.name || '',
    match.teams?.home?.name || '',
    match.teams?.away?.name || ''
  )) {
    return false;
  }

  // Must be from a high-priority league OR have popular teams
  const isHighPriority = isHighPriorityLeague(match);
  const hasPopular = hasPopularTeams(match, popularTeamIds);

  return isHighPriority || hasPopular;
};

/**
 * Filter and sort matches specifically for featured match display
 */
export const filterFeaturedMatches = (
  matches: any[], 
  popularTeamIds: number[] = [],
  maxMatches: number = 5
): any[] => {
  // Filter to featured-worthy matches
  const featuredCandidates = matches.filter(match => 
    isFeaturedWorthy(match, popularTeamIds)
  );

  // Simple sorting by match status and time
  const sortedMatches = featuredCandidates.sort((a, b) => {
    // Live matches first
    const aStatus = a.fixture?.status?.short;
    const bStatus = b.fixture?.status?.short;

    const aIsLive = ["1H", "2H", "HT", "LIVE", "ET", "BT", "P"].includes(aStatus);
    const bIsLive = ["1H", "2H", "HT", "LIVE", "ET", "BT", "P"].includes(bStatus);

    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;

    // Then by popular teams
    const aHasPopular = hasPopularTeams(a, popularTeamIds);
    const bHasPopular = hasPopularTeams(b, popularTeamIds);

    if (aHasPopular && !bHasPopular) return -1;
    if (!aHasPopular && bHasPopular) return 1;

    // Finally by time
    return new Date(a.fixture?.date || 0).getTime() - new Date(b.fixture?.date || 0).getTime();
  });

  return sortedMatches.slice(0, maxMatches);
};