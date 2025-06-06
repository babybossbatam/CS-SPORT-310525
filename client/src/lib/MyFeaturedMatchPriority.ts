
/**
 * Specialized priority system for MyHomeFeaturedMatchNew component
 * This provides focused league prioritization specifically for featured match displays
 */

/**
 * Get league priority for featured matches
 * Lower numbers = higher priority (will appear first)
 * @param match Match object with league and country information
 * @returns Priority number (1 = highest priority, 999 = lowest)
 */
export const getFeaturedMatchLeaguePriority = (match: any): number => {
  const name = (match.league?.name || "").toLowerCase();
  const country = (match.league?.country || "").toLowerCase();

  // SAFETY CHECK: Block Tournoi Maurice Revello from getting any priority
  if (name.includes("tournoi maurice revello") || name.includes("maurice revello") || name.includes("tournoi maurice")) {
    console.log(`🚫 [FeaturedMatchPriority] BLOCKED: Tournoi Maurice Revello rejected: ${match.teams?.home?.name} vs ${match.teams?.away?.name}`);
    return 9999; // Lowest possible priority to ensure exclusion
  }

  // Handle World/International leagues with specific priority order
  if (country.includes("world") || country.includes("europe") || 
      country.includes("international") || name.includes("uefa") ||
      name.includes("fifa") || name.includes("conmebol")) {

    // Priority 1: UEFA Nations League (HIGHEST PRIORITY)
    if (name.includes("uefa nations league") && !name.includes("women")) {
      return 1;
    }

    // Priority 2: Champions League
    if (name.includes("champions league") && !name.includes("women")) {
      return 2;
    }

    // Priority 3: Europa League
    if (name.includes("europa league") && !name.includes("women")) {
      return 3;
    }

    // Priority 4: Conference League
    if (name.includes("conference league") && !name.includes("women")) {
      return 4;
    }

    // Priority 5: World Cup related (but not qualifications)
    if (name.includes("world cup") && !name.includes("qualification") && !name.includes("women")) {
      return 5;
    }

    // Priority 6: Euro Championship
    if (name.includes("euro") && name.includes("championship") && !name.includes("women")) {
      return 6;
    }

    // Priority 7: CONMEBOL competitions
    if ((name.includes("copa america") || name.includes("libertadores") || 
         name.includes("sudamericana")) && !name.includes("women")) {
      return 7;
    }

    // Priority 8: World Cup Qualification Europe
    if (name.includes("world cup") && name.includes("qualification") && name.includes("europe")) {
      return 8;
    }

    // Priority 9: World Cup Qualification South America
    if (name.includes("world cup") && name.includes("qualification") && name.includes("south america")) {
      return 9;
    }

    // Priority 10: International friendlies (but not women's)
    if (name.includes("friendlies") && !name.includes("women")) {
      return 10;
    }

    // Priority 50: Other international competitions
    return 50;
  }

  // Handle domestic leagues
  const popularLeagues = [39, 140, 135, 78, 61]; // Premier League, La Liga, Serie A, Bundesliga, Ligue 1
  if (popularLeagues.includes(match.league?.id)) {
    return 15; // High priority for top domestic leagues
  }

  // Priority 20: Other major domestic leagues
  const majorLeagues = [301, 233, 15]; // UAE Pro League, Egyptian Premier League, FIFA Club World Cup
  if (majorLeagues.includes(match.league?.id)) {
    return 20;
  }

  // Default priority for other leagues
  return 100;
};

/**
 * Sort matches by featured match priority
 * @param matches Array of match objects
 * @returns Sorted array with highest priority matches first
 */
export const sortMatchesByFeaturedPriority = (matches: any[]): any[] => {
  return matches.sort((a, b) => {
    const aPriority = getFeaturedMatchLeaguePriority(a);
    const bPriority = getFeaturedMatchLeaguePriority(b);

    // If priorities are different, sort by priority
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // If same priority, apply status-based sorting
    const aStatus = a.fixture?.status?.short;
    const bStatus = b.fixture?.status?.short;

    const aIsLive = ["1H", "2H", "HT", "LIVE", "ET", "BT", "P"].includes(aStatus);
    const bIsLive = ["1H", "2H", "HT", "LIVE", "ET", "BT", "P"].includes(bStatus);

    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;

    // Recent finished matches
    const now = new Date();
    const aDate = new Date(a.fixture?.date);
    const bDate = new Date(b.fixture?.date);

    const aIsRecentFinished =
      ["FT", "AET", "PEN"].includes(aStatus) &&
      now.getTime() - aDate.getTime() < 6 * 60 * 60 * 1000;
    const bIsRecentFinished =
      ["FT", "AET", "PEN"].includes(bStatus) &&
      now.getTime() - bDate.getTime() < 6 * 60 * 60 * 1000;

    if (aIsRecentFinished && !bIsRecentFinished) return -1;
    if (!aIsRecentFinished && bIsRecentFinished) return 1;

    // If same priority and status, sort alphabetically by league name
    const aLeagueName = a.league?.name?.toLowerCase() || "";
    const bLeagueName = b.league?.name?.toLowerCase() || "";
    return aLeagueName.localeCompare(bLeagueName);
  });
};

/**
 * Check if a league should be excluded from featured matches
 * @param leagueName League name
 * @param homeTeamName Home team name
 * @param awayTeamName Away team name
 * @returns true if should be excluded, false if should be included
 */
export const shouldExcludeFromFeaturedMatch = (
  leagueName: string,
  homeTeamName: string,
  awayTeamName: string
): boolean => {
  const league = (leagueName || "").toLowerCase();
  const homeTeam = (homeTeamName || "").toLowerCase();
  const awayTeam = (awayTeamName || "").toLowerCase();

  // ABSOLUTE BLOCK: Tournoi Maurice Revello
  if (league.includes("tournoi maurice revello") || 
      league.includes("maurice revello") || 
      league.includes("tournoi maurice")) {
    return true;
  }

  // Exclude women's competitions
  if (league.includes("women") || league.includes("womens") || 
      homeTeam.includes("women") || awayTeam.includes("women")) {
    return true;
  }

  // Exclude youth competitions
  const youthTerms = ["u15", "u16", "u17", "u18", "u19", "u20", "u21", "u23", "youth", "junior"];
  if (youthTerms.some(term => 
    league.includes(term) || homeTeam.includes(term) || awayTeam.includes(term)
  )) {
    return true;
  }

  // Exclude very low-tier competitions
  const lowTierTerms = ["amateur", "reserve", "reserves", "oberliga", "division 2", "division 3"];
  if (lowTierTerms.some(term => 
    league.includes(term) || homeTeam.includes(term) || awayTeam.includes(term)
  )) {
    return true;
  }

  return false;
};

/**
 * Get top leagues from grouped fixtures for featured matches
 * @param fixturesByCountry Grouped fixtures by country
 * @param maxLeagues Maximum number of leagues to return
 * @returns Array of top league data
 */
export const getTopLeaguesForFeaturedMatch = (fixturesByCountry: any, maxLeagues: number = 3): any[] => {
  // Get all leagues from all countries
  const allLeaguesFlat = Object.values(fixturesByCountry).flatMap((countryData: any) =>
    Object.values(countryData.leagues).map((leagueData: any) => ({
      ...leagueData,
      country: countryData.country,
    }))
  );

  // Sort leagues by featured match priority
  const sortedLeagues = allLeaguesFlat.sort((a: any, b: any) => {
    // Create mock match objects to get priority
    const aMockMatch = { league: a.league, teams: { home: { name: "" }, away: { name: "" } } };
    const bMockMatch = { league: b.league, teams: { home: { name: "" }, away: { name: "" } } };

    const aPriority = getFeaturedMatchLeaguePriority(aMockMatch);
    const bPriority = getFeaturedMatchLeaguePriority(bMockMatch);

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // If same priority, sort alphabetically by league name
    const aLeagueName = a.league?.name?.toLowerCase() || "";
    const bLeagueName = b.league?.name?.toLowerCase() || "";
    return aLeagueName.localeCompare(bLeagueName);
  });

  // Take only the top leagues
  return sortedLeagues.slice(0, maxLeagues);
};
