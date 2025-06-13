/**
 * Specialized exclusion filters for TodayPopularFootballLeaguesNew component
 * This provides focused filtering specifically for popular league displays
 */

// Enhanced exclusion terms specifically for popular leagues display
export const popularLeagueExclusionTerms = [
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

  // Brazilian state leagues (lower-tier regional competitions)
  "amazonense",
  "baiano",
  "carioca",
  "catarinense",
  "gaucho",
  "gaúcho",
  "goiano",
  "minero",
  "mineiro",
  "paranaense",
  "copa espírito santo",
  "espirito santo",
  "paulista série b",
  "matogrossense 2",
  "paraense b1",
  "copa do nordeste",
  "copa paulista",

  // Brazilian youth leagues to exclude
  "brasileiro u20 a",
  "brasiliense u20",
  "alagoano u20",

  // Women's leagues (additional exclusions)
  "liga femenina",

  // US lower-tier leagues that shouldn't appear in popular leagues
  "npsl",
  "usl league pro",
  "usl pro",
  "usl w league",
  "wpsl",
  "usl league two",
  "usl championship",
  "usl league one",
  "usl super league",
  "nwsl",
  "mls next pro",

  // Additional filtering for cleaner popular league display
  "boys",
  "kosice",

  // Regional competitions not suitable for popular leagues
  "cosafa cup",

  // World Cup qualification exclusions for featured matches
  "world cup - qualification asia",
  "world cup - qualification concacaf",
  "qualification asia",
  "qualification concacaf",

  // CONCACAF competitions exclusion
  "concacaf",
];

// Safe substring function to handle null/undefined values
function safeSubstring(value: any, start: number, end?: number): string {
  if (value == null) {
    return "";
  }
  const str = String(value);
  return end !== undefined ? str.substring(start, end) : str.substring(start);
}

/**
 * Main exclusion function for popular leagues display
 * @param leagueName League name (will be converted to lowercase)
 * @param homeTeamName Home team name (will be converted to lowercase)
 * @param awayTeamName Away team name (will be converted to lowercase)
 * @param country Optional country name to check for null/invalid values
 * @returns true if fixture should be excluded, false if it should be kept
 */
export function shouldExcludeFromPopularLeagues(
  leagueName: string,
  homeTeamName: string,
  awayTeamName: string,
  country?: string | null,
): boolean {
  // Convert inputs to lowercase with safe handling
  const league = safeSubstring(leagueName, 0).toLowerCase();
  const homeTeam = safeSubstring(homeTeamName, 0).toLowerCase();
  const awayTeam = safeSubstring(awayTeamName, 0).toLowerCase();
  const countryLower = safeSubstring(country || "", 0).toLowerCase();

  // SPECIAL HANDLING FOR WORLD COUNTRY - Add debugging
  if (countryLower === "world") {
    console.log(`🌍 [WORLD DEBUG] Checking World league: "${leagueName}" | ${homeTeamName} vs ${awayTeamName} | Country: ${country}`);
    
    // For World country, only exclude if it contains explicit exclusion terms
    const hasExclusionTerms = popularLeagueExclusionTerms.some(
      (term) =>
        league.includes(term) ||
        homeTeam.includes(term) ||
        awayTeam.includes(term),
    );

    if (hasExclusionTerms) {
      console.log(`❌ [WORLD DEBUG] Excluding World league due to exclusion terms: "${leagueName}"`);
      return true;
    }

    console.log(`✅ [WORLD DEBUG] Allowing World league: "${leagueName}"`);
    return false; // Allow all other World leagues
  }

  // Exclude fixtures with null, undefined, or invalid country values (but not World)
  if (
    country !== undefined &&
    (!country ||
      country === null ||
      country.trim() === "" ||
      country.toLowerCase() === "unknown")
  ) {
    return true;
  }

  // FIRST: Check for UEFA Nations League Women specifically - always exclude
  if (
    league.includes("uefa nations league") &&
    (league.includes("women") || league.includes("womens"))
  ) {
    return true; // Exclude UEFA Nations League Women
  }

  // SECOND: Check for CONCACAF competitions - always exclude
  if (league.includes("concacaf")) {
    return true; // Exclude all CONCACAF competitions
  }

  // THIRD: Check for Asia competitions - always exclude
  if (league.includes("asia")) {
    return true; // Exclude all Asia competitions
  }

  // Check if this is a major international competition that should NEVER be excluded
  const isMajorInternationalCompetition =
    // UEFA competitions (but women's already excluded above)
    league.includes("uefa") ||
    league.includes("champions league") ||
    league.includes("europa league") ||
    league.includes("conference league") ||
    league.includes("euro") ||
    league.includes("european championship") ||
    // Specifically allow UEFA U21 Championship
    league.includes("uefa u21 championship") ||
    league.includes("uefa european under-21 championship") ||
    // FIFA competitions
    league.includes("fifa") ||
    league.includes("world cup") ||
    league.includes("fifa club world cup") ||
    // CONMEBOL competitions
    league.includes("conmebol") ||
    league.includes("copa america") ||
    league.includes("copa libertadores") ||
    league.includes("copa sudamericana") ||
    league.includes("libertadores") ||
    league.includes("sudamericana") ||
    // Youth international tournaments (but exclude women's)
    league.includes("tournoi maurice revello") ||
    league.includes("maurice revello") ||
    // International competitions (but exclude women's and Asia/CONCACAF qualifications)
    (league.includes("nations league") && !league.includes("women")) ||
    (league.includes("uefa nations league") && !league.includes("women")) ||
    (league.includes("confederation") && !league.includes("women")) ||
    (league.includes("qualifying") &&
      (league.includes("world cup") || league.includes("euro")) &&
      !league.includes("women") &&
      !league.includes("asia") &&
      !league.includes("concacaf")) ||
    (league.includes("international") &&
      (league.includes("cup") || league.includes("championship")) &&
      !league.includes("women")) ||
    // Men's International Friendlies (excludes women's)
    (league.includes("friendlies") && !league.includes("women"));

  // If it's a major international competition, never exclude it
  if (isMajorInternationalCompetition) {
    return false;
  }

  // Check if any exclusion term exists in league or team names
  return popularLeagueExclusionTerms.some(
    (term) =>
      league.includes(term) ||
      homeTeam.includes(term) ||
      awayTeam.includes(term),
  );
}

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

  // Exclude leagues with problematic terms
  const hasExclusionTerms = popularLeagueExclusionTerms.some((term) =>
    league.includes(term),
  );

  return !hasExclusionTerms;
}

/**
 * Additional helper function to check if a match is from a restricted US league
 * (for use in popular leagues display)
 */
export function isRestrictedUSLeague(
  leagueId: number,
  country: string,
): boolean {
  // USA restrictions removed - allow all USA leagues through
  return false;
}
