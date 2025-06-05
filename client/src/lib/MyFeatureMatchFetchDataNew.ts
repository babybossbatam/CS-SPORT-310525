
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
 * Fetch and process featured match data from popular leagues
 */
export const fetchFeaturedMatchData = async (selectedDate: string): Promise<FeatureMatchData[]> => {
  try {
    // Fetch fixtures for the selected date
    const response = await apiRequest('GET', `/api/fixtures/date/${selectedDate}?all=true`);
    const fixtures = await response.json();

    if (!fixtures?.length) {
      return [];
    }

    console.log(`🔍 [FeatureMatch] Processing ${fixtures.length} fixtures for date: ${selectedDate}`);

    // Apply the same filtering logic as TodayPopularLeagueNew
    const filteredFixtures = fixtures.filter((fixture: any) => {
      // Smart time filtering
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        const smartResult = MySmartTimeFilter.getSmartTimeLabel(
          fixture.fixture.date,
          fixture.fixture.status.short,
          selectedDate + "T12:00:00Z"
        );

        const today = new Date();
        const todayString = format(today, "yyyy-MM-dd");
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = format(tomorrow, "yyyy-MM-dd");
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = format(yesterday, "yyyy-MM-dd");

        const shouldInclude = (() => {
          if (selectedDate === tomorrowString && smartResult.label === "tomorrow") return true;
          if (selectedDate === todayString && smartResult.label === "today") return true;
          if (selectedDate === yesterdayString && smartResult.label === "yesterday") return true;
          if (selectedDate !== todayString && selectedDate !== tomorrowString && selectedDate !== yesterdayString) {
            if (smartResult.label === "custom" && smartResult.isWithinTimeRange) return true;
          }
          return false;
        })();

        if (!shouldInclude) return false;
      }

      // Apply exclusion filters
      if (shouldExcludeFromPopularLeagues(
        fixture.league.name,
        fixture.teams.home.name,
        fixture.teams.away.name,
        fixture.league.country
      )) {
        return false;
      }

      // Check for popular leagues or countries
      const leagueId = fixture.league?.id;
      const country = fixture.league?.country?.toLowerCase() || "";
      const leagueName = fixture.league?.name?.toLowerCase() || "";

      const isPopularLeague = POPULAR_LEAGUES.includes(leagueId);
      const isFromPopularCountry = POPULAR_COUNTRIES_ORDER.some(
        (popularCountry) => country.includes(popularCountry.toLowerCase())
      );

      // Check for international competitions
      const isInternationalCompetition = 
        leagueName.includes("champions league") ||
        leagueName.includes("europa league") ||
        leagueName.includes("conference league") ||
        leagueName.includes("uefa") ||
        leagueName.includes("world cup") ||
        leagueName.includes("fifa") ||
        leagueName.includes("conmebol") ||
        leagueName.includes("copa america") ||
        (leagueName.includes("friendlies") && !leagueName.includes("women")) ||
        country.includes("world") ||
        country.includes("europe") ||
        country.includes("international");

      return isPopularLeague || isFromPopularCountry || isInternationalCompetition;
    });

    console.log(`🔍 [FeatureMatch] Filtered to ${filteredFixtures.length} relevant fixtures`);

    // Transform fixtures to FeatureMatchData format
    const featureMatches: FeatureMatchData[] = filteredFixtures.map((fixture: any) => {
      const homeTeam = fixture.teams.home;
      const awayTeam = fixture.teams.away;
      const league = fixture.league;
      const displayInfo = formatMatchDisplay(fixture.fixture);

      return {
        homeTeam: {
          name: homeTeam.name,
          logo: homeTeam.id ? `/api/team-logo/square/${homeTeam.id}?size=36` : "/assets/fallback-logo.svg",
          shortName: shortenTeamName(homeTeam.name),
          isNational: isNationalTeam(homeTeam, league),
        },
        awayTeam: {
          name: awayTeam.name,
          logo: awayTeam.id ? `/api/team-logo/square/${awayTeam.id}?size=36` : "/assets/fallback-logo.svg",
          shortName: shortenTeamName(awayTeam.name),
          isNational: isNationalTeam(awayTeam, league),
        },
        score: {
          home: fixture.goals.home,
          away: fixture.goals.away,
          status: fixture.fixture.status.short,
          elapsed: fixture.fixture.status.elapsed,
          displayTime: displayInfo.displayTime,
          isLive: displayInfo.isLive,
          isFinished: displayInfo.isFinished,
          isUpcoming: displayInfo.isUpcoming,
        },
        league: {
          id: league.id,
          name: league.name,
          logo: league.logo || "/assets/fallback-logo.svg",
          country: league.country || "International",
          flag: getCountryFlagWithFallbackSync(league.country, league.flag),
          round: league.round,
        },
        fixture: {
          id: fixture.fixture.id,
          date: fixture.fixture.date,
          venue: fixture.fixture.venue?.name,
          status: fixture.fixture.status.short,
        },
        bracket: getBracketStatus(league.name, league.round),
      };
    });

    // Sort by priority: Live > Upcoming > Finished, with popular teams prioritized
    const sortedMatches = featureMatches.sort((a, b) => {
      // Priority 1: Live matches first
      if (a.score.isLive && !b.score.isLive) return -1;
      if (!a.score.isLive && b.score.isLive) return 1;

      // Priority 2: Finals/semifinals
      const aIsFinal = a.bracket.status === 'final' || a.bracket.status === 'semifinal';
      const bIsFinal = b.bracket.status === 'final' || b.bracket.status === 'semifinal';
      if (aIsFinal && !bIsFinal) return -1;
      if (!aIsFinal && bIsFinal) return 1;

      // Priority 3: Upcoming vs finished
      if (a.score.isUpcoming && b.score.isFinished) return -1;
      if (a.score.isFinished && b.score.isUpcoming) return 1;

      // Default: sort by date
      return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
    });

    console.log(`🔍 [FeatureMatch] Returning ${sortedMatches.length} processed matches`);
    return sortedMatches;

  } catch (error) {
    console.error('Error fetching feature match data:', error);
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
