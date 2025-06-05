import { apiRequest } from './queryClient';

export interface FeatureMatchData {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed?: number;
    };
    venue?: {
      name: string;
      city: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag?: string;
  };
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  score: {
    home: number | null;
    away: number | null;
    status: string;
  };
}

/**
 * Fetch featured match data using the same logic as TodayPopularFootballLeaguesNew
 */
export const fetchFeaturedMatchData = async (selectedDate: string, maxMatches: number = 8): Promise<FeatureMatchData[]> => {
  try {
    console.log(`🔍 [FeatureMatch] Fetching featured matches for date: ${selectedDate}`);

    // Fetch all fixtures for the selected date (same as TodayPopularFootballLeaguesNew)
    const response = await apiRequest(
      "GET",
      `/api/fixtures/date/${selectedDate}?all=true`,
    );
    const fixtures = await response.json();

    if (!fixtures?.length) {
      console.log(`🔍 [FeatureMatch] No fixtures found for date: ${selectedDate}`);
      return [];
    }

    console.log(`🔍 [FeatureMatch] Found ${fixtures.length} total fixtures for ${selectedDate}`);

    // Apply the same filtering logic as TodayPopularFootballLeaguesNew
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

    const POPULAR_COUNTRIES_ORDER = [
      "England",
      "Spain", 
      "Italy",
      "Germany",
      "France",
      "World",
      "Europe",
      "South America",
      "Brazil",
      "Saudi Arabia",
      "Egypt",
      "Colombia",
      "United States",
      "USA",
      "US", 
      "United Arab Emirates",
      "United-Arab-Emirates",
    ];

    // Filter fixtures using the same logic as TodayPopularFootballLeaguesNew
    const filteredFixtures = fixtures.filter((fixture: any) => {
      if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
        return false;
      }

      const league = fixture.league;
      const country = league.country?.toLowerCase() || "";
      const leagueName = league.name?.toLowerCase() || "";

      // Skip women's competitions and other unwanted matches
      if (
        leagueName.includes("women") ||
        leagueName.includes("youth") ||
        leagueName.includes("u19") ||
        leagueName.includes("u21") ||
        leagueName.includes("u23") ||
        leagueName.includes("reserve")
      ) {
        return false;
      }

      // Check if it's a popular league
      const isPopularLeague = POPULAR_LEAGUES.includes(league.id);

      // Check if it's from a popular country
      const isFromPopularCountry = POPULAR_COUNTRIES_ORDER.some(
        (popularCountry) => country.includes(popularCountry.toLowerCase()),
      );

      // Check if it's an international competition
      const isInternationalCompetition =
        leagueName.includes("champions league") ||
        leagueName.includes("europa league") ||
        leagueName.includes("conference league") ||
        leagueName.includes("uefa") ||
        leagueName.includes("world cup") ||
        leagueName.includes("fifa club world cup") ||
        leagueName.includes("fifa") ||
        leagueName.includes("conmebol") ||
        leagueName.includes("copa america") ||
        leagueName.includes("copa libertadores") ||
        leagueName.includes("copa sudamericana") ||
        leagueName.includes("libertadores") ||
        leagueName.includes("sudamericana") ||
        (leagueName.includes("friendlies") && !leagueName.includes("women")) ||
        (leagueName.includes("international") && !leagueName.includes("women")) ||
        country.includes("world") ||
        country.includes("europe") ||
        country.includes("international");

      return isPopularLeague || isFromPopularCountry || isInternationalCompetition;
    });

    console.log(`🔍 [FeatureMatch] Filtered to ${filteredFixtures.length} popular league fixtures`);

    if (filteredFixtures.length === 0) {
      return [];
    }

    // Sort matches with the same priority as TodayPopularFootballLeaguesNew
    const sortedFixtures = filteredFixtures.sort((a: any, b: any) => {
      const aStatus = a.fixture.status.short;
      const bStatus = b.fixture.status.short;

      // Priority 1: LIVE matches
      const aLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
      const bLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);

      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;

      // Priority 2: Upcoming matches
      const aUpcoming = aStatus === "NS" || aStatus === "TBD";
      const bUpcoming = bStatus === "NS" || bStatus === "TBD";

      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;

      // Priority 3: Sort by league popularity
      const aLeaguePopular = POPULAR_LEAGUES.includes(a.league.id);
      const bLeaguePopular = POPULAR_LEAGUES.includes(b.league.id);

      if (aLeaguePopular && !bLeaguePopular) return -1;
      if (!aLeaguePopular && bLeaguePopular) return 1;

      // Default: alphabetical by home team
      const aHomeTeam = a.teams?.home?.name || "";
      const bHomeTeam = b.teams?.home?.name || "";
      return aHomeTeam.localeCompare(bHomeTeam);
    });

    // Take the top matches up to maxMatches
    const topMatches = sortedFixtures.slice(0, maxMatches);

    // Convert to FeatureMatchData format
    const featuredMatches: FeatureMatchData[] = topMatches.map((match: any) => {
      const status = match.fixture.status.short;
      let displayStatus = status;

      // Convert status to display format
      if (["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
        displayStatus = "LIVE";
      } else if (status === "FT") {
        displayStatus = "FINISHED";
      } else if (status === "NS" || status === "TBD") {
        displayStatus = "UPCOMING";
      }

      return {
        fixture: {
          id: match.fixture.id,
          date: match.fixture.date,
          status: {
            short: match.fixture.status.short,
            long: match.fixture.status.long,
            elapsed: match.fixture.status.elapsed,
          },
          venue: {
            name: match.fixture.venue?.name || "TBA",
            city: match.fixture.venue?.city || "TBA",
          },
        },
        league: {
          id: match.league.id,
          name: match.league.name,
          country: match.league.country,
          logo: match.league.logo || "/assets/fallback-logo.svg",
          flag: match.league.flag,
        },
        homeTeam: {
          id: match.teams.home.id,
          name: match.teams.home.name,
          logo: match.teams.home.logo || "/assets/fallback-logo.svg",
        },
        awayTeam: {
          id: match.teams.away.id,
          name: match.teams.away.name,
          logo: match.teams.away.logo || "/assets/fallback-logo.svg",
        },
        score: {
          home: match.goals.home,
          away: match.goals.away,
          status: displayStatus,
        },
      };
    });

    console.log(`🔍 [FeatureMatch] Returning ${featuredMatches.length} featured matches:`, {
      matches: featuredMatches.map(m => ({
        league: m.league.name,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        status: m.score.status
      }))
    });

    return featuredMatches;

  } catch (error) {
    console.error('🔍 [FeatureMatch] Error fetching featured matches:', error);
    return [];
  }
};

/**
 * Get the top featured match for display
 */
export const getTopFeatureMatch = async (selectedDate: string): Promise<FeatureMatchData | null> => {
  const matches = await fetchFeaturedMatchData(selectedDate, 1);
  return matches.length > 0 ? matches[0] : null;
};

/**
 * Get multiple featured matches for carousel/slider
 */
export const getFeaturedMatchesCarousel = async (selectedDate: string, limit: number = 6): Promise<FeatureMatchData[]> => {
  const matches = await fetchFeaturedMatchData(selectedDate, limit);
  return matches;
};