
/**
 * Specialized priority system for MyHomeFeaturedMatchNew component
 * This ensures Tournoi Maurice Revello and other unwanted leagues never get priority
 */

export interface LeagueData {
  league?: {
    id?: number;
    name?: string;
  };
  country?: string;
  matches?: any[];
}

/**
 * Get specialized league priority for featured matches with strict exclusions
 */
export const getFeaturedMatchLeaguePriority = (leagueData: LeagueData): number => {
  const name = (leagueData.league?.name || "").toLowerCase();
  const country = (leagueData.country || "").toLowerCase();

  // ABSOLUTE FIRST: Block all unwanted leagues from getting ANY priority
  const blockedLeagues = [
    'tournoi maurice revello',
    'maurice revello',
    'tournoi maurice',
    'friendlies',
    'women',
    'womens',
    'uefa nations league - women',
    'uefa nations league women'
  ];

  if (blockedLeagues.some(blocked => name.includes(blocked))) {
    console.log(`🚫 [FeaturedMatchPriority] BLOCKED league: "${leagueData.league?.name}"`);
    return 9999; // Lowest possible priority to ensure exclusion
  }

  // Handle World leagues with specific priority order (only non-blocked leagues)
  if (country.includes("world") || country.includes("europe") || 
      country.includes("international") || name.includes("uefa") ||
      name.includes("fifa") || name.includes("conmebol")) {

    // Priority 1: UEFA Nations League (HIGHEST PRIORITY - but only men's)
    if (name.includes("uefa nations league") && !name.includes("women")) {
      return 1;
    }

    // Priority 3: World Cup Qualification Asia
    if (name.includes("world cup") && name.includes("qualification") && name.includes("asia")) {
      return 3;
    }

    // Priority 4: World Cup Qualification CONCACAF
    if (name.includes("world cup") && name.includes("qualification") && name.includes("concacaf")) {
      return 4;
    }

    // Priority 5: World Cup Qualification Europe
    if (name.includes("world cup") && name.includes("qualification") && name.includes("europe")) {
      return 5;
    }

    // Priority 6: World Cup Qualification South America
    if (name.includes("world cup") && name.includes("qualification") && name.includes("south america")) {
      return 6;
    }

    // Priority 8: Champions League
    if (name.includes("champions league")) {
      return 8;
    }

    // Priority 9: Europa League
    if (name.includes("europa league")) {
      return 9;
    }

    // Priority 10: Conference League
    if (name.includes("conference league")) {
      return 10;
    }

    return 50; // Other international competitions
  }

  // Handle domestic leagues
  const POPULAR_LEAGUES = [
    39, 45, 48, // England: Premier League, FA Cup, EFL Cup
    140, 143, // Spain: La Liga, Copa del Rey
    135, 137, // Italy: Serie A, Coppa Italia
    78, 81, // Germany: Bundesliga, DFB Pokal
    61, 66, // France: Ligue 1, Coupe de France
    301, // UAE Pro League
    233, // Egyptian Premier League
    15, // FIFA Club World Cup
    914, 848, // COSAFA Cup, UEFA Conference League
    2, 3, // Champions League, Europa League
  ];

  if (POPULAR_LEAGUES.includes(leagueData.league?.id)) {
    return 15; // High priority for popular domestic leagues
  }

  return 100; // Default priority for other leagues
};

/**
 * Sort leagues for featured matches with strict blocking
 */
export const sortLeaguesForFeaturedMatch = (leagues: LeagueData[]): LeagueData[] => {
  return leagues.sort((a: LeagueData, b: LeagueData) => {
    const aPriority = getFeaturedMatchLeaguePriority(a);
    const bPriority = getFeaturedMatchLeaguePriority(b);

    // If priorities are different, sort by priority
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // If same priority, sort alphabetically by league name
    const aLeagueName = a.league?.name?.toLowerCase() || "";
    const bLeagueName = b.league?.name?.toLowerCase() || "";
    return aLeagueName.localeCompare(bLeagueName);
  });
};

/**
 * Check if a league should be completely excluded from featured matches
 */
export const shouldExcludeFromFeaturedMatch = (leagueName: string): boolean => {
  const lowerLeagueName = leagueName.toLowerCase();
  
  const excludedTerms = [
    'tournoi maurice revello',
    'maurice revello', 
    'tournoi maurice',
    'friendlies',
    'women',
    'womens',
    'uefa nations league - women',
    'uefa nations league women'
  ];

  return excludedTerms.some(term => lowerLeagueName.includes(term));
};
