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

  // Youth and development leagues (strict filtering for popular leagues)
  "u15",
  "u16",
  "u17",
  "u18",
  "u19",
  "u20",

  "youth",
  "junior",
  "reserve",
  "amateur",
  "development",
  "academy",
  "primavera",
  "reserves",
  "juvenil",
  "cadete",
  "infantil",

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
export const shouldExcludeFromPopularLeagues = (
  leagueName: string,
  homeTeamName: string,
  awayTeamName: string,
  country?: string
): boolean => {
  if (!leagueName || !homeTeamName || !awayTeamName) {
    return true; // Exclude invalid data
  }

  const lowerLeagueName = leagueName.toLowerCase();
  const lowerHomeTeam = homeTeamName.toLowerCase();
  const lowerAwayTeam = awayTeamName.toLowerCase();
  const lowerCountry = country?.toLowerCase() || "";

  // Debug logging for target leagues
  if (lowerLeagueName.includes("u21") || lowerLeagueName.includes("fifa club world cup")) {
    console.log(`🎯 [EXCLUSION DEBUG] Checking ${leagueName}: ${homeTeamName} vs ${awayTeamName} (Country: ${country})`);
  }

  // First check for exclusion patterns

  // Check if this is a major international competition that should NEVER be excluded
  const isMajorInternationalCompetition =
    // UEFA competitions (but women's already excluded above)
    leagueName.toLowerCase().includes("uefa") ||
    leagueName.toLowerCase().includes("champions league") ||
    leagueName.toLowerCase().includes("europa league") ||
    leagueName.toLowerCase().includes("conference league") ||
    leagueName.toLowerCase().includes("euro") ||
    leagueName.toLowerCase().includes("european championship") ||
    // FIFA competitions
    leagueName.toLowerCase().includes("fifa") ||
    leagueName.toLowerCase().includes("world cup") ||
    leagueName.toLowerCase().includes("fifa club world cup") ||
    // CONMEBOL competitions
    leagueName.toLowerCase().includes("conmebol") ||
    leagueName.toLowerCase().includes("copa america") ||
    leagueName.toLowerCase().includes("copa libertadores") ||
    leagueName.toLowerCase().includes("copa sudamericana") ||
    leagueName.toLowerCase().includes("libertadores") ||
    leagueName.toLowerCase().includes("sudamericana") ||
    // Youth international tournaments (but exclude women's)
    leagueName.toLowerCase().includes("tournoi maurice revello") ||
    leagueName.toLowerCase().includes("maurice revello") ||
    // International competitions (but exclude women's and Asia/CONCACAF qualifications)
    (leagueName.toLowerCase().includes("nations league") && !leagueName.toLowerCase().includes("women")) ||
    (leagueName.toLowerCase().includes("uefa nations league") && !leagueName.toLowerCase().includes("women")) ||
    (leagueName.toLowerCase().includes("confederation") && !leagueName.toLowerCase().includes("women")) ||
    (leagueName.toLowerCase().includes("qualifying") &&
      (leagueName.toLowerCase().includes("world cup") || leagueName.toLowerCase().includes("euro")) &&
      !leagueName.toLowerCase().includes("women") &&
      !leagueName.toLowerCase().includes("asia") &&
      !leagueName.toLowerCase().includes("concacaf")) ||
    (leagueName.toLowerCase().includes("international") &&
      (leagueName.toLowerCase().includes("cup") || leagueName.toLowerCase().includes("championship")) &&
      !leagueName.toLowerCase().includes("women")) ||
    // Men's International Friendlies (excludes women's)
    (leagueName.toLowerCase().includes("friendlies") && !leagueName.toLowerCase().includes("women"));

  // If it's a major international competition, never exclude it
  if (isMajorInternationalCompetition) {
    return false;
  }
    // Define exclusion terms array
    const exclusionTerms = popularLeagueExclusionTerms;

  // PRIORITY: Never exclude UEFA U21 Championship or FIFA Club World Cup
  if (
    lowerLeagueName.includes("uefa u21") ||
    lowerLeagueName.includes("uefa european under-21") ||
    lowerLeagueName.includes("fifa club world cup")
  ) {
    console.log(`✅ [EXCLUSION DEBUG] Allowing priority league: ${leagueName}`);
    return false; // Never exclude these leagues
  }

  // Check for general exclusion terms
  for (const term of exclusionTerms) {
    if (
      lowerLeagueName.includes(term) ||
      lowerHomeTeam.includes(term) ||
      lowerAwayTeam.includes(term)
    ) {
      // Double-check to ensure we don't exclude our priority leagues
      if (
        lowerLeagueName.includes("uefa u21") ||
        lowerLeagueName.includes("uefa european under-21") ||
        lowerLeagueName.includes("fifa club world cup")
      ) {
        console.log(`⚠️ [EXCLUSION DEBUG] Almost excluded priority league ${leagueName} due to term: ${term}`);
        return false;
      }
      return true;
    }
  }
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