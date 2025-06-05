import { apiRequest } from './queryClient';
import { format, parseISO, isValid } from 'date-fns';
import { shouldExcludeFromPopularLeagues } from './MyPopularLeagueExclusion';
import { MySmartTimeFilter } from './MySmartTimeFilter';
import { getCountryFlagWithFallbackSync } from './flagUtils';
import { isNationalTeam } from './teamLogoSources';

export interface FeatureMatchData {
  homeTeam: {
    name: string;
    logo: string;
    shortName: string;
    isNational: boolean;
  };
  awayTeam: {
    name: string;
    logo: string;
    shortName: string;
    isNational: boolean;
  };
  score: {
    home: number | null;
    away: number | null;
    status: string;
    elapsed?: number;
    displayTime: string;
    isLive: boolean;
    isFinished: boolean;
    isUpcoming: boolean;
  };
  league: {
    id: number;
    name: string;
    logo: string;
    country: string;
    flag: string;
    round?: string;
  };
  fixture: {
    id: number;
    date: string;
    venue?: string;
    status: string;
  };
  bracket: {
    status: 'group' | 'knockout' | 'final' | 'semifinal' | 'quarterfinal' | 'regular';
    round?: string;
  };
}

// Helper function to shorten team names (copied from TodayPopularLeagueNew)
const shortenTeamName = (teamName: string): string => {
  if (!teamName) return teamName;

  const suffixesToRemove = [
    "-sc", "-SC", " SC", " FC", " CF", " United", " City", " Islands", 
    " Republic", " National Team", " U23", " U21", " U20", " U19",
  ];

  let shortened = teamName;
  for (const suffix of suffixesToRemove) {
    if (shortened.endsWith(suffix)) {
      shortened = shortened.replace(suffix, "");
      break;
    }
  }

  const countryMappings: { [key: string]: string } = {
    "Cape Verde Islands": "Cape Verde",
    "Central African Republic": "CAR",
    "Dominican Republic": "Dominican Rep",
    "Bosnia and Herzegovina": "Bosnia",
    "Trinidad and Tobago": "Trinidad",
    "Papua New Guinea": "Papua NG",
    "United Arab Emirates": "UAE",
    "Saudi Arabia": "Saudi",
    "South Africa": "S. Africa",
    "New Zealand": "New Zealand",
    "Costa Rica": "Costa Rica",
    "Puerto Rico": "Puerto Rico",
  };

  if (countryMappings[shortened]) {
    shortened = countryMappings[shortened];
  }

  return shortened.trim();
};

// Determine bracket status from league name and round
const getBracketStatus = (leagueName: string, round?: string): FeatureMatchData['bracket'] => {
  const lowerLeague = leagueName.toLowerCase();
  const lowerRound = round?.toLowerCase() || '';

  if (lowerRound.includes('final') && !lowerRound.includes('semi')) {
    return { status: 'final', round };
  }
  if (lowerRound.includes('semi')) {
    return { status: 'semifinal', round };
  }
  if (lowerRound.includes('quarter')) {
    return { status: 'quarterfinal', round };
  }
  if (lowerRound.includes('knockout') || lowerRound.includes('round of')) {
    return { status: 'knockout', round };
  }
  if (lowerLeague.includes('champions') || lowerLeague.includes('europa') || lowerLeague.includes('conference')) {
    return { status: 'group', round };
  }

  return { status: 'regular', round };
};

// Format match time/status display
const formatMatchDisplay = (fixture: any): { displayTime: string; isLive: boolean; isFinished: boolean; isUpcoming: boolean } => {
  const status = fixture.status.short;
  const fixtureDate = parseISO(fixture.date);

  const isLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status);
  const isFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status);
  const isUpcoming = ["NS", "TBD"].includes(status);

  if (isLive) {
    if (status === "HT") {
      return { displayTime: "HT", isLive: true, isFinished: false, isUpcoming: false };
    }
    return { 
      displayTime: `${fixture.status.elapsed || 0}'`, 
      isLive: true, 
      isFinished: false, 
      isUpcoming: false 
    };
  }

  if (isFinished) {
    const statusText = status === "FT" ? "Ended" : 
                     status === "AET" ? "AET" :
                     status === "PEN" ? "PEN" : 
                     status === "CANC" ? "Cancelled" : status;
    return { displayTime: statusText, isLive: false, isFinished: true, isUpcoming: false };
  }

  if (isUpcoming) {
    if (status === "TBD") {
      return { displayTime: "TBD", isLive: false, isFinished: false, isUpcoming: true };
    }
    return { 
      displayTime: format(fixtureDate, "HH:mm"), 
      isLive: false, 
      isFinished: false, 
      isUpcoming: true 
    };
  }

  return { displayTime: format(fixtureDate, "HH:mm"), isLive: false, isFinished: false, isUpcoming: true };
};

// Popular leagues and countries (from TodayPopularLeagueNew)
const POPULAR_COUNTRIES_ORDER = [
  "England", "Spain", "Italy", "Germany", "France", "World", "Europe", 
  "South America", "Brazil", "Saudi Arabia", "Egypt", "Colombia", 
  "United States", "USA", "US", "United Arab Emirates", "United-Arab-Emirates",
];

const POPULAR_LEAGUES_BY_COUNTRY = {
  England: [39, 45, 48], // Premier League, FA Cup, EFL Cup
  Spain: [140, 143], // La Liga, Copa del Rey
  Italy: [135, 137], // Serie A, Coppa Italia
  Germany: [78, 81], // Bundesliga, DFB Pokal
  France: [61, 66], // Ligue 1, Coupe de France
  "United Arab Emirates": [301], // UAE Pro League
  Egypt: [233], // Egyptian Premier League
  International: [15], // FIFA Club World Cup
  World: [914, 848, 15], // COSAFA Cup, UEFA Conference League, FIFA Club World Cup
};

const POPULAR_LEAGUES = [
  ...Object.values(POPULAR_LEAGUES_BY_COUNTRY).flat(),
  914, // COSAFA Cup
  2, 3, // Champions League, Europa League
];

/**
 * Fetch and process featured match data from popular leagues (prioritizing first league match)
 */
export const fetchFeaturedMatchData = async (selectedDate?: string, maxMatches: number = 8) => {
  try {
    console.log('🔍 [FeatureMatch] Starting fetch for featured matches');

    // Use today's date if no date is provided
    const targetDate = selectedDate || format(new Date(), 'yyyy-MM-dd');

    // Fetch all fixtures for the selected date
    const response = await apiRequest('GET', `/api/fixtures/date/${targetDate}?all=true`);
    const fixtures = await response.json();

    if (!fixtures?.length) {
      console.log('🔍 [FeatureMatch] No fixtures found for date:', targetDate);
      return [];
    }

    console.log(`🔍 [FeatureMatch] Processing ${fixtures.length} fixtures for date: ${targetDate}`);

    // Apply the same filtering logic as TodayPopularLeagueNew
    const filteredFixtures = fixtures.filter((fixture: any) => {
      // Apply smart time filtering with selected date context
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        const smartResult = MySmartTimeFilter.getSmartTimeLabel(
          fixture.fixture.date,
          fixture.fixture.status.short,
          targetDate + "T12:00:00Z", // Pass selected date as context
        );

        // Determine what type of date is selected
        const today = new Date();
        const todayString = format(today, "yyyy-MM-dd");
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = format(tomorrow, "yyyy-MM-dd");
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = format(yesterday, "yyyy-MM-dd");

        // Check if this match should be included based on the selected date
        const shouldInclude = (() => {
          if (targetDate === tomorrowString && smartResult.label === "tomorrow")
            return true;
          if (targetDate === todayString && smartResult.label === "today")
            return true;
          if (targetDate === yesterdayString && smartResult.label === "yesterday")
            return true;

          // Handle custom dates (dates that are not today/tomorrow/yesterday)
          if (
            targetDate !== todayString &&
            targetDate !== tomorrowString &&
            targetDate !== yesterdayString
          ) {
            if (smartResult.label === "custom" && smartResult.isWithinTimeRange)
              return true;
          }

          return false;
        })();

        if (!shouldInclude) {
          return false;
        }
      }

      // Apply exclusion check FIRST, before checking international competitions
      const leagueName = fixture.league?.name?.toLowerCase() || "";
      const homeTeamName = fixture.teams?.home?.name?.toLowerCase() || "";
      const awayTeamName = fixture.teams?.away?.name?.toLowerCase() || "";
      const country = fixture.league?.country?.toLowerCase() || "";

      // Early exclusion for women's competitions and other unwanted matches
      if (
        shouldExcludeFromPopularLeagues(
          fixture.league.name,
          fixture.teams.home.name,
          fixture.teams.away.name,
          country,
        )
      ) {
        return false;
      }

      // Check if it's an international competition (after exclusion check)
      const isInternationalCompetition =
        // UEFA competitions (but women's already excluded above)
        leagueName.includes("champions league") ||
        leagueName.includes("europa league") ||
        leagueName.includes("conference league") ||
        leagueName.includes("uefa") ||
        // FIFA competitions
        leagueName.includes("world cup") ||
        leagueName.includes("fifa club world cup") ||
        leagueName.includes("fifa") ||
        // CONMEBOL competitions
        leagueName.includes("conmebol") ||
        leagueName.includes("copa america") ||
        leagueName.includes("copa libertadores") ||
        leagueName.includes("copa sudamericana") ||
        leagueName.includes("libertadores") ||
        leagueName.includes("sudamericana") ||
        // Men's International Friendlies (excludes women's)
        (leagueName.includes("friendlies") && !leagueName.includes("women")) ||
        (leagueName.includes("international") && !leagueName.includes("women")) ||
        country.includes("world") ||
        country.includes("europe") ||
        country.includes("international");

      // Check if it's a popular league
      const leagueId = fixture.league?.id;
      const isPopularLeague = POPULAR_LEAGUES.includes(leagueId);

      // Check if it's from a popular country
      const isFromPopularCountry = POPULAR_COUNTRIES_ORDER.some(
        (popularCountry) => country.includes(popularCountry.toLowerCase()),
      );

      return (
        isPopularLeague || isFromPopularCountry || isInternationalCompetition
      );
    });

    // Group fixtures by country and league like TodayPopularLeagueNew
    const fixturesByCountry = filteredFixtures.reduce((acc: any, fixture: any) => {
      if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
        return acc;
      }

      const league = fixture.league;
      if (!league.id || !league.name) {
        return acc;
      }

      const country = league.country;

      // Apply exclusion check again
      const leagueName = league.name?.toLowerCase() || "";
      const homeTeamName = fixture.teams?.home?.name || "";
      const awayTeamName = fixture.teams?.away?.name || "";

      if (
        shouldExcludeFromPopularLeagues(
          leagueName,
          homeTeamName,
          awayTeamName,
          country,
        )
      ) {
        return acc;
      }

      // Additional check for restricted US leagues
      if (isRestrictedUSLeague(league.id, country)) {
        return acc;
      }

      // Skip fixtures without a valid country, but keep World and Europe competitions
      if (
        !country ||
        country === null ||
        country === undefined ||
        typeof country !== "string" ||
        country.trim() === "" ||
        country.toLowerCase() === "unknown"
      ) {
        // Allow World competitions, CONMEBOL, UEFA, and FIFA competitions to pass through
        if (
          league.name &&
          (league.name.toLowerCase().includes("world") ||
            league.name.toLowerCase().includes("europe") ||
            league.name.toLowerCase().includes("uefa") ||
            league.name.toLowerCase().includes("fifa") ||
            league.name.toLowerCase().includes("fifa club world cup") ||
            league.name.toLowerCase().includes("champions") ||
            league.name.toLowerCase().includes("conference") ||
            // Men's International Friendlies only (excludes women's)
            (league.name.toLowerCase().includes("friendlies") &&
              !league.name.toLowerCase().includes("women")) ||
            (league.name.toLowerCase().includes("international") &&
              !league.name.toLowerCase().includes("women")) ||
            league.name.toLowerCase().includes("conmebol") ||
            league.name.toLowerCase().includes("copa america") ||
            league.name.toLowerCase().includes("copa libertadores") ||
            league.name.toLowerCase().includes("copa sudamericana"))
        ) {
          // Determine the appropriate country key
          let countryKey = "World";
          if (
            league.name.toLowerCase().includes("fifa club world cup") ||
            league.name.toLowerCase().includes("club world cup")
          ) {
            countryKey = "International";
          } else if (
            league.name.toLowerCase().includes("conmebol") ||
            league.name.toLowerCase().includes("copa america") ||
            league.name.toLowerCase().includes("copa libertadores") ||
            league.name.toLowerCase().includes("copa sudamericana")
          ) {
            countryKey = "South America";
          } else if (
            league.name.toLowerCase().includes("uefa") ||
            league.name.toLowerCase().includes("europe") ||
            league.name.toLowerCase().includes("champions") ||
            league.name.toLowerCase().includes("conference") ||
            league.name.toLowerCase().includes("nations league")
          ) {
            countryKey = "Europe";
          }

          if (!acc[countryKey]) {
            acc[countryKey] = {
              country: countryKey,
              flag: getCountryFlagWithFallbackSync(countryKey),
              leagues: {},
              hasPopularLeague: true,
            };
          }
          const leagueId = league.id;

          if (!acc[countryKey].leagues[leagueId]) {
            acc[countryKey].leagues[leagueId] = {
              league: { ...league, country: countryKey },
              matches: [],
              isPopular: POPULAR_LEAGUES.includes(leagueId) || true,
              isFriendlies: league.name.toLowerCase().includes("friendlies"),
            };
          }
          acc[countryKey].leagues[leagueId].matches.push(fixture);
          return acc;
        }

        return acc;
      }

      const validCountry = country.trim();

      // Only allow valid country names, World, and Europe
      if (
        validCountry !== "World" &&
        validCountry !== "Europe" &&
        validCountry.length === 0
      ) {
        return acc;
      }

      const leagueId = league.id;
      if (!acc[country]) {
        acc[country] = {
          country,
          flag: getCountryFlagWithFallbackSync(country, league.flag),
          leagues: {},
          hasPopularLeague: false,
        };
      }

      // Check if this is a popular league for this country
      const countryPopularLeagues = POPULAR_LEAGUES_BY_COUNTRY[country] || [];
      const isPopularForCountry = countryPopularLeagues.includes(leagueId);
      const isGloballyPopular = POPULAR_LEAGUES.includes(leagueId);

      // For unrestricted countries, consider all leagues as "popular" to show them all
      const unrestrictedCountries = [
        "Brazil",
        "Colombia",
        "Saudi Arabia",
        "USA",
        "United States",
        "United-States",
        "US",
        "United Arab Emirates",
        "United-Arab-Emirates",
        "Europe",
        "South America",
        "World",
      ];
      const isUnrestrictedCountry = unrestrictedCountries.includes(country);

      if (isPopularForCountry || isGloballyPopular || isUnrestrictedCountry) {
        acc[country].hasPopularLeague = true;
      }

      if (!acc[country].leagues[leagueId]) {
        acc[country].leagues[leagueId] = {
          league: {
            ...league,
            logo:
              league.logo ||
              "https://media.api-sports.io/football/leagues/1.png",
          },
          matches: [],
          isPopular:
            isPopularForCountry || isGloballyPopular || isUnrestrictedCountry,
          isPopularForCountry: isPopularForCountry || isUnrestrictedCountry,
          isFriendlies: league.name.toLowerCase().includes("friendlies"),
        };
      }

      // Validate team data before adding
      if (
        fixture.teams.home &&
        fixture.teams.away &&
        fixture.teams.home.name &&
        fixture.teams.away.name
      ) {
        acc[country].leagues[leagueId].matches.push({
          ...fixture,
          teams: {
            home: {
              ...fixture.teams.home,
              logo: fixture.teams.home.logo || "/assets/fallback-logo.svg",
            },
            away: {
              ...fixture.teams.away,
              logo: fixture.teams.away.logo || "/assets/fallback-logo.svg",
            },
          },
        });
      }

      return acc;
    }, {});

    // Filter to show only popular countries with badge system
    const filteredCountries = Object.values(fixturesByCountry).filter(
      (countryData: any) => {
        return countryData.hasPopularLeague;
      },
    );

    // Sort countries by the POPULAR_COUNTRIES_ORDER
    const sortedCountries = filteredCountries.sort((a: any, b: any) => {
      const getPopularCountryIndex = (country: string) => {
        if (!country) return 999;
        const index = POPULAR_COUNTRIES_ORDER.findIndex(
          (pc) => country.toLowerCase() === pc.toLowerCase(),
        );
        return index === -1 ? 999 : index;
      };

      const aPopularIndex = getPopularCountryIndex(a.country);
      const bPopularIndex = getPopularCountryIndex(b.country);

      const aIsPopularCountry = aPopularIndex !== 999;
      const bIsPopularCountry = bPopularIndex !== 999;

      // Priority order: Popular countries with badge leagues first
      if (
        aIsPopularCountry &&
        a.hasPopularLeague &&
        (!bIsPopularCountry || !b.hasPopularLeague)
      )
        return -1;
      if (
        bIsPopularCountry &&
        b.hasPopularLeague &&
        (!aIsPopularCountry || !a.hasPopularLeague)
      )
        return 1;

      // Both are popular countries with badge leagues - sort by priority order
      if (
        aIsPopularCountry &&
        a.hasPopularLeague &&
        bIsPopularCountry &&
        b.hasPopularLeague
      ) {
        return aPopularIndex - bPopularIndex;
      }

      // Default to alphabetical sorting for other cases
      const countryA = a.country || "";
      const countryB = b.country || "";
      return countryA.localeCompare(countryB);
    });

    // Get the first match from the first league of the first country (mimicking TodayPopularLeagueNew order)
    let firstMatch = null;

    // Iterate through sorted countries to find first available match
    for (const countryData of sortedCountries) {
      const leagues = Object.values(countryData.leagues)
        .sort((a: any, b: any) => {
          // Apply same league sorting as TodayPopularLeagueNew
          if (countryData.country === "World") {
            const getWorldLeaguePriority = (leagueData: any) => {
              const name = (leagueData.league?.name || "").toLowerCase();
              const isFriendlies = leagueData.isFriendlies || name.includes("friendlies");

              // Priority 1: UEFA Nations League (HIGHEST PRIORITY)
              if (name.includes("uefa nations league") && !name.includes("women")) {
                return 1;
              }

              // Priority 2: Friendlies
              if (isFriendlies && !name.includes("uefa nations league") && !name.includes("women")) {
                return 2;
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

              // Priority 7: Tournoi Maurice Revello
              if (name.includes("tournoi maurice revello")) {
                return 7;
              }

              return 999;
            };

            const aPriority = getWorldLeaguePriority(a);
            const bPriority = getWorldLeaguePriority(b);

            if (aPriority !== bPriority) {
              return aPriority - bPriority;
            }

            // If same priority, sort alphabetically by league name
            const aName = a.league?.name || "";
            const bName = b.league?.name || "";
            return aName.localeCompare(bName);
          }

          // Prioritize leagues that are popular for this specific country
          if (a.isPopularForCountry && !b.isPopularForCountry) return -1;
          if (!a.isPopularForCountry && b.isPopularForCountry) return 1;

          // Then globally popular leagues
          if (a.isPopular && !b.isPopular) return -1;
          if (!a.isPopular && b.isPopular) return 1;

          return 0;
        });

      // Get first league with matches
      for (const leagueData of leagues) {
        if (leagueData.matches && leagueData.matches.length > 0) {
          // Sort matches within the league (same sorting as TodayPopularLeagueNew)
          const sortedMatches = leagueData.matches.sort((a: any, b: any) => {
            const aStatus = a.fixture.status.short;
            const bStatus = b.fixture.status.short;
            const aDate = parseISO(a.fixture.date);
            const bDate = parseISO(b.fixture.date);

            // Ensure valid dates
            if (!isValid(aDate) || !isValid(bDate)) {
              return 0;
            }

            const aTime = aDate.getTime();
            const bTime = bDate.getTime();

            // Define status categories
            const aLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
            const bLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);

            const aUpcoming = aStatus === "NS" || aStatus === "TBD";
            const bUpcoming = bStatus === "NS" || bStatus === "TBD";

            const aFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(aStatus);
            const bFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(bStatus);

            // PRIORITY 1: LIVE matches always come first
            if (aLive && !bLive) return -1;
            if (!aLive && bLive) return 1;

            // If both are LIVE, sort by elapsed time (shortest first), then alphabetically by home team
            if (aLive && bLive) {
              const aElapsed = Number(a.fixture.status.elapsed) || 0;
              const bElapsed = Number(b.fixture.status.elapsed) || 0;

              if (aElapsed !== bElapsed) {
                return aElapsed - bElapsed;
              }

              // If same elapsed time, sort alphabetically by home team name
              const aHomeTeam = a.teams?.home?.name || "";
              const bHomeTeam = b.teams?.home?.name || "";
              return aHomeTeam.localeCompare(bHomeTeam);
            }

            // PRIORITY 2: Upcoming matches come second, sorted by time first, then alphabetically
            if (aUpcoming && !bUpcoming) return -1;
            if (!aUpcoming && bUpcoming) return 1;

            // If both are upcoming, sort by time first, then alphabetically by home team
            if (aUpcoming && bUpcoming) {
              if (aTime !== bTime) {
                return aTime - bTime; // Earlier matches first
              }

              // If same time, sort alphabetically by home team name
              const aHomeTeam = a.teams?.home?.name || "";
              const bHomeTeam = b.teams?.home?.name || "";
              return aHomeTeam.localeCompare(bHomeTeam);
            }

            // PRIORITY 3: Finished matches come last, sorted alphabetically by home team
            if (aFinished && !bFinished) return 1;
            if (!aFinished && bFinished) return -1;

            // If both are finished, sort alphabetically by home team name
            if (aFinished && bFinished) {
              const aHomeTeam = a.teams?.home?.name || "";
              const bHomeTeam = b.teams?.home?.name || "";
              return aHomeTeam.localeCompare(bHomeTeam);
            }

            // DEFAULT: For any other cases, sort alphabetically by home team name
            const aHomeTeam = a.teams?.home?.name || "";
            const bHomeTeam = b.teams?.home?.name || "";
            return aHomeTeam.localeCompare(bHomeTeam);
          });

          // Take the first match from this league
          firstMatch = sortedMatches[0];
          break;
        }
      }

      // If we found a match, break out of the country loop
      if (firstMatch) {
        break;
      }
    }

    // If no match found from popular leagues, return empty array
    if (!firstMatch) {
      console.log('🔍 [FeatureMatch] No matches found in popular leagues');
      return [];
    }

    // Process the first match into the format expected by MyHomeFeaturedMatchNew
    const status = firstMatch.fixture.status.short;
    let displayStatus = status;

    // Convert status to display format
    if (["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
      displayStatus = status === "HT" ? "Half Time" : "Live";
    } else if (status === "NS" || status === "TBD") {
      displayStatus = "Upcoming";
    } else if (["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status)) {
      displayStatus = "Finished";
    }

    const processedMatch = {
      fixture: firstMatch.fixture,
      league: firstMatch.league,
      homeTeam: {
        id: firstMatch.teams.home.id,
        name: firstMatch.teams.home.name,
        logo: firstMatch.teams.home.logo || "/assets/fallback-logo.svg"
      },
      awayTeam: {
        id: firstMatch.teams.away.id,
        name: firstMatch.teams.away.name,
        logo: firstMatch.teams.away.logo || "/assets/fallback-logo.svg"
      },
      score: {
        home: firstMatch.goals.home,
        away: firstMatch.goals.away,
        status: displayStatus
      }
    };

    console.log(`🔍 [FeatureMatch] Returning first match from popular leagues:`, {
      league: processedMatch.league.name,
      homeTeam: processedMatch.homeTeam.name,
      awayTeam: processedMatch.awayTeam.name,
      status: displayStatus
    });

    return [processedMatch];

  } catch (error) {
    console.error('🔍 [FeatureMatch] Error fetching featured matches:', error);
    return [];
  }
};

/**
 * Get the top featured match for display
 */
export const getTopFeatureMatch = async (selectedDate: string): Promise<FeatureMatchData | null> => {
  const matches = await fetchFeaturedMatchData(selectedDate);
  return matches.length > 0 ? matches[0] : null;
};

/**
 * Get multiple featured matches for carousel/slider
 */
export const getFeaturedMatchesCarousel = async (selectedDate: string, limit: number = 6): Promise<FeatureMatchData[]> => {
  const matches = await fetchFeaturedMatchData(selectedDate);
  return matches.slice(0, limit);
};