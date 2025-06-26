/**
 * Adding "USL League Two" to the featuredMatchExclusionTerms array.
 */
/**
 * Specialized exclusion filters for MyHomeFeaturedMatchNew component
 * This provides targeted filtering for the featured match display to ensure only high-quality matches are shown
 * Updated to match TodayPopularFootballLeaguesNew exclusion logic
 */

// Enhanced exclusion terms specifically for featured matches (copied from MyPopularLeagueExclusion)
export const featuredMatchExclusionTerms = [
  // Women's competitions (comprehensive exclusion)
  "women",
  "girls",
  "feminine",
  "feminin",
  "donne",
  "frauen",
  "femenino",
  "women's",
  "women",
  "uefa nations league - women",
  "uefa nations league women",
  "UEFA Nations League - Women",

  // Only exclude amateur and development leagues (allow youth u17-u23)
  "amateur",
  "reserve",
  "development",
  "academy",
  "primavera",
  "reserves",

  // Non-competitive/exhibition matches (but allow World Friendlies)
  "test",
  "exhibition",
  "testimonial",
  "charity",

  // Indoor/alternative formats
  "futsal",
  "indoor",
  "beach",
  "arena",

  // Esports and virtual competitions
  "esoccer",
  "e-soccer",
  "esports",
  "virtual",
  "cyber",
  "pes",
  "efootball",

  // Very low-tier regional competitions (for popular leagues display)
  "oberliga",
  "oberliga -",
  "oberliga westfalen",
  "oberliga baden",
  "oberliga bayern",
  "oberliga hessen",
  "oberliga niedersachsen",
  "oberliga rheinland",
  "oberliga schleswig", 
  "oberliga thüringen",
  "usl league two",
  "usl league 2",
  "usl 2",
  "usl championship 2",
];

// Safe substring helper function
function safeSubstring(str: string, start: number, end?: number): string {
  if (!str || typeof str !== "string") return "";
  return str.substring(start, end);
}

/**
 * Check if a fixture should be excluded from popular leagues display
 * This is the main exclusion function copied from MyPopularLeagueExclusion
 *
 * @param leagueName League name
 * @param homeTeamName Home team name
 * @param awayTeamName Away team name
 * @param country Country name (optional)
 * @returns true if fixture should be excluded
 */
export const shouldExcludeFeaturedMatch = (
  leagueName: string,
  homeTeamName: string,
  awayTeamName: string,
  country?: string,
): boolean => {
  // Convert to lowercase for case-insensitive matching
  const league = safeSubstring(leagueName, 0).toLowerCase();
  const homeTeam = safeSubstring(homeTeamName, 0).toLowerCase();
  const awayTeam = safeSubstring(awayTeamName, 0).toLowerCase();
  const countryLower = safeSubstring(country || "", 0).toLowerCase();

  // Check if this is a major international competition that should NEVER be excluded
  const isMajorInternationalCompetition =
    // UEFA competitions (excluding women's and youth, but including UEFA U21 Championship)
    (league.includes("uefa") &&
      !league.includes("women") &&
      !league.includes("youth") &&
      !league.includes("u15") &&
      !league.includes("u16") &&
      !league.includes("u17") &&
      !league.includes("u18") &&
      !league.includes("u19") &&
      (!league.includes("u21") || 
       league.includes("uefa u21 championship") || 
       league.includes("uefa european under-21 championship") ||
       league.includes("uefa european under-21") ||
       league === "uefa u21 championship" ||
       league === "uefa european under-21 championship")) ||
    (league.includes("world cup") &&
      !league.includes("women") &&
      !league.includes("youth") &&
      !league.includes("u15") &&
      !league.includes("u16") &&
      !league.includes("u17") &&
      !league.includes("u18") &&
      !league.includes("u19")) ||
    (league.includes("fifa") &&
      !league.includes("women") &&
      !league.includes("youth") &&
      !league.includes("u15") &&
      !league.includes("u16") &&
      !league.includes("u17") &&
      !league.includes("u18") &&
      !league.includes("u19")) ||
    (league.includes("champions league") && !league.includes("women")) ||
    (league.includes("europa league") && !league.includes("women")) ||
    (league.includes("conference league") && !league.includes("women")) ||
    (league.includes("uefa nations league") &&
      !league.includes("women") &&
      !league.includes("uefa nations league - women")) ||
    (league.includes("euro") &&
      league.includes("championship") &&
      !league.includes("women")) ||
    // FIFA competitions (excluding women's and youth)
    (league.includes("fifa club world cup") && !league.includes("women")) ||
    // CONMEBOL competitions (excluding women's)
    (league.includes("conmebol") && !league.includes("women")) ||
    (league.includes("copa america") && !league.includes("women")) ||
    (league.includes("copa libertadores") && !league.includes("women")) ||
    (league.includes("copa sudamericana") && !league.includes("women")) ||
    (league.includes("libertadores") && !league.includes("women")) ||
    (league.includes("sudamericana") && !league.includes("women")) ||
    // International friendlies (excluding women's)
    (league.includes("friendlies") &&
      !league.includes("women") &&
      countryLower.includes("world")) ||
    (league.includes("international") &&
      !league.includes("women") &&
      (countryLower.includes("world") ||
        countryLower.includes("europe") ||
        countryLower.includes("international")));

  // If it's a major international competition, never exclude it
  if (isMajorInternationalCompetition) {
    return false;
  }

  // Check if any exclusion term exists in league or team names
  return featuredMatchExclusionTerms.some(
    (term) =>
      league.includes(term) ||
      homeTeam.includes(term) ||
      awayTeam.includes(term),
  );
};

/**
 * Check if a league is suitable for popular leagues display
 * @param leagueName League name
 * @param country Country name
 * @returns true if league should be included in popular leagues
 */
export function isPopularLeagueSuitable(
  leagueName: string,
  country?: string,
): boolean {
  const league = safeSubstring(leagueName, 0).toLowerCase();
  const countryLower = safeSubstring(country || "", 0).toLowerCase();

  // Always include major international competitions
  const isMajorInternational =
    league.includes("champions league") ||
    league.includes("europa league") ||
    league.includes("conference league") ||
    league.includes("nations league") ||
    league.includes("uefa nations league") ||
    league.includes("world cup") ||
    league.includes("copa america") ||
    league.includes("copa libertadores") ||
    league.includes("copa sudamericana") ||
    countryLower.includes("world") ||
    countryLower.includes("europe") ||
    countryLower.includes("international");

  if (
    isMajorInternational &&
    !league.includes("women") &&
    !league.includes("concacaf") &&
    !league.includes("asia")
  ) {
    return true;
  }

  // Check against exclusion terms
  return !shouldExcludeFeaturedMatch(leagueName, "", "", country);
}

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
  return (
    (name.includes("champions league") ||
      name.includes("europa league") ||
      name.includes("conference league") ||
      name.includes("uefa nations league") ||
      name.includes("world cup") ||
      name.includes("copa america") ||
      name.includes("libertadores")) &&
    !name.includes("women")
  );
};

/**
 * Check if teams are considered "big" or popular enough for featuring
 */
export const hasPopularTeams = (
  match: any,
  popularTeamIds: number[] = [],
): boolean => {
  const homeTeamId = match.teams?.home?.id;
  const awayTeamId = match.teams?.away?.id;

  return (
    popularTeamIds.includes(homeTeamId) || popularTeamIds.includes(awayTeamId)
  );
};

/**
 * Check if a match qualifies as "featured" based on multiple criteria
 */
export const isFeaturedWorthy = (
  match: any,
  popularTeamIds: number[] = [],
): boolean => {
  // Must not be excluded
  if (
    shouldExcludeFeaturedMatch(
      match.league?.name || "",
      match.teams?.home?.name || "",
      match.teams?.away?.name || "",
      match.league?.country || "",
    )
  ) {
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
  maxMatches: number = 5,
): any[] => {
  // Filter to featured-worthy matches
  const featuredCandidates = matches.filter((match) =>
    isFeaturedWorthy(match, popularTeamIds),
  );

  // Simple sorting by match status and time
  const sortedMatches = featuredCandidates.sort((a, b) => {
    // Live matches first
    const aStatus = a.fixture?.status?.short;
    const bStatus = b.fixture?.status?.short;

    const aIsLive = ["1H", "2H", "HT", "LIVE", "ET", "BT", "P"].includes(
      aStatus,
    );
    const bIsLive = ["1H", "2H", "HT", "LIVE", "ET", "BT", "P"].includes(
      bStatus,
    );

    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;

    // Then by popular teams
    const aHasPopular = hasPopularTeams(a, popularTeamIds);
    const bHasPopular = hasPopularTeams(b, popularTeamIds);

    if (aHasPopular && !bHasPopular) return -1;
    if (!aHasPopular && bHasPopular) return 1;

    // Finally by time
    return (
      new Date(a.fixture?.date || 0).getTime() -
      new Date(b.fixture?.date || 0).getTime()
    );
  });

  return sortedMatches.slice(0, maxMatches);
};
`