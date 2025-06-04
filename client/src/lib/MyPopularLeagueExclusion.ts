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
  "u21",
  "u23",
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
  "nwsl",

  // Additional filtering for cleaner popular league display
  "boys",
  "kosice",
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
  // Only exclude fixtures with null, undefined, or invalid country values for data integrity
  if (
    country !== undefined &&
    (!country ||
      country === null ||
      country.trim() === "" ||
      country.toLowerCase() === "unknown")
  ) {
    return true;
  }

  // All other matches are allowed through - no exclusions
  return false;
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
    league.includes("world cup") ||
    league.includes("copa america") ||
    league.includes("copa libertadores") ||
    league.includes("copa sudamericana") ||
    countryLower.includes("world") ||
    countryLower.includes("europe") || 
    countryLower.includes("international");

  if (isMajorInternational && !league.includes("women")) {
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