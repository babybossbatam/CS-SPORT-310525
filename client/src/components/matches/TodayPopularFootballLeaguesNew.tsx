import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Calendar, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { RootState, userActions } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  format,
  parseISO,
  isValid,
  differenceInHours,
  subDays,
  addDays,
} from "date-fns";
import {
  getFixtureLocalDate,
  isFixtureOnLocalDate,
  isFixtureOnClientDate,
} from "@/lib/dateUtilsUpdated";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { shouldExcludeFromPopularLeagues, isPopularLeagueSuitable, isRestrictedUSLeague } from "@/lib/MyPopularLeagueExclusion";
import { QUERY_CONFIGS, CACHE_FRESHNESS } from "@/lib/cacheConfig";
import { useCachedQuery, CacheManager } from "@/lib/cachingHelper";
import { getCurrentUTCDateString } from "@/lib/dateUtilsUpdated";
import { POPULAR_LEAGUES } from "@/lib/constants";
import {
  DEFAULT_POPULAR_TEAMS,
  DEFAULT_POPULAR_LEAGUES,
  POPULAR_COUNTRIES,
  isLiveMatch,
} from "@/lib/matchFilters";
import { getCountryFlagWithFallbackSync } from "../../lib/flagUtils";
import { createFallbackHandler } from "../../lib/MyAPIFallback";
import { MyFallbackAPI } from "../../lib/MyFallbackAPI";
import { getCachedTeamLogo } from "../../lib/MyAPIFallback";
import { isNationalTeam } from "../../lib/teamLogoSources";
import { MySmartDateLabeling } from "../../lib/MySmartDateLabeling";
import "../../styles/MyLogoPositioning.css";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";

// Helper function to shorten team names
const shortenTeamName = (teamName: string): string => {
  if (!teamName) return teamName;

  // Remove common suffixes that make names too long
  const suffixesToRemove = [
    '-sc', '-SC', ' SC', ' FC', ' CF', ' United', ' City',
    ' Islands', ' Republic', ' National Team', ' U23', ' U21', ' U20', ' U19'
  ];

  let shortened = teamName;
  for (const suffix of suffixesToRemove) {
    if (shortened.endsWith(suffix)) {
      shortened = shortened.replace(suffix, '');
      break;
    }
  }

  // Handle specific country name shortenings
  const countryMappings: { [key: string]: string } = {
    'Cape Verde Islands': 'Cape Verde',
    'Central African Republic': 'CAR',
    'Dominican Republic': 'Dominican Rep',
    'Bosnia and Herzegovina': 'Bosnia',
    'Trinidad and Tobago': 'Trinidad',
    'Papua New Guinea': 'Papua NG',
    'United Arab Emirates': 'UAE',
    'Saudi Arabia': 'Saudi',
    'South Africa': 'S. Africa',
    'New Zealand': 'New Zealand',
    'Costa Rica': 'Costa Rica',
    'Puerto Rico': 'Puerto Rico'
  };

  // Check if the team name matches any country mappings
  if (countryMappings[shortened]) {
    shortened = countryMappings[shortened];
  }

  return shortened.trim();
};

interface TodayPopularFootballLeaguesNewProps {
  selectedDate: string;
  timeFilterActive?: boolean;
  showTop20?: boolean;
  liveFilterActive?: boolean;
}

const TodayPopularFootballLeaguesNew: React.FC<
  TodayPopularFootballLeaguesNewProps
> = ({
  selectedDate,
  timeFilterActive = false,
  showTop20 = false,
  liveFilterActive = false,
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(),
  );
  const [enableFetching, setEnableFetching] = useState(true);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());

  const dispatch = useDispatch();
  const { toast } = useToast();
  const favoriteTeams = useSelector(
    (state: RootState) => state.user.favoriteTeams,
  );

  // Popular countries prioritization with new requirements
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
    "United Arab Emirates",
    "United-Arab-Emirates",
  ];

  // Enhanced leagues by country with tier-based filtering
  const POPULAR_LEAGUES_BY_COUNTRY = {
    England: [39, 45, 48], // Premier League, FA Cup, EFL Cup
    Spain: [140, 143], // La Liga, Copa del Rey
    Italy: [135, 137], // Serie A, Coppa Italia
    Germany: [78, 81], // Bundesliga, DFB Pokal
    France: [61, 66], // Ligue 1, Coupe de France
    // Removed league restrictions for Brazil, Colombia, Saudi Arabia, Europe, South America, World
    // These countries will now show all their leagues (exclusion filtering will be applied later)
    USA: [253, 254], // Only Major League Soccer (MLS) and MLS Next Pro
    "United Arab Emirates": [301], // UAE Pro League
    Egypt: [233], // Egyptian Premier League (only major league)
    International: [15], // FIFA Club World Cup as separate category
  };

  // Flatten popular leagues for backward compatibility
  const POPULAR_LEAGUES = Object.values(POPULAR_LEAGUES_BY_COUNTRY).flat();

  // Popular teams for match prioritization
  const POPULAR_TEAMS = [
    // Premier League
    33,
    40,
    42,
    50,
    47,
    49, // Manchester United, Liverpool, Arsenal, Manchester City, Tottenham, Chelsea
    // La Liga
    529,
    541,
    530,
    548,
    727, // Barcelona, Real Madrid, Atletico Madrid, Real Sociedad, Athletic Bilbao
    // Serie A
    489,
    492,
    496,
    500,
    502,
    505, // AC Milan, Napoli, Juventus, Inter, Fiorentina, Lazio
    // Bundesliga
    157,
    165,
    168,
    173,
    192, // Bayern Munich, Borussia Dortmund, Bayer Leverkusen, RB Leipzig, Eintracht Frankfurt
    // Champions League popular teams
    85,
    81,
    212,
    548, // Paris Saint Germain, AS Monaco, Real Sociedad, Real Sociedad
  ];

  // Check if we have fresh cached data
  const fixturesQueryKey = ["all-fixtures-by-date", selectedDate];

  const cachedFixtures = CacheManager.getCachedData(
    fixturesQueryKey,
    30 * 60 * 1000,
  ); // 30 minutes

  // Fetch all fixtures for the selected date with smart caching
  const {
    data: fixtures = [],
    isLoading,
    isFetching,
  } = useCachedQuery(
    fixturesQueryKey,
    async () => {
      const response = await apiRequest(
        "GET",
        `/api/fixtures/date/${selectedDate}?all=true`,
      );
      const data = await response.json();
      return data;
    },
    {
      enabled: !!selectedDate && enableFetching,
      maxAge: 30 * 60 * 1000, // 30 minutes
      backgroundRefresh: true,
    },
  );

  // Use the prioritized popular countries list
  const POPULAR_COUNTRIES = POPULAR_COUNTRIES_ORDER;

  // Memoize expensive filtering operations
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length) return [];

    console.log(`Processing ${fixtures.length} fixtures for filtering`);
    const startTime = Date.now();

    const filtered = fixtures.filter((fixture) => {
      // Apply smart date filtering first
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        const smartResult = MySmartDateLabeling.getSmartDateLabel(
          fixture.fixture.date,
          fixture.fixture.status.short
        );

        // For selected date filtering, accept matches that smart labeling considers appropriate
        const todayDate = new Date().toISOString().slice(0, 10);
        const yesterdayDate = subDays(new Date(), 1).toISOString().slice(0, 10);
        const tomorrowDate = addDays(new Date(), 1).toISOString().slice(0, 10);

        const isSelectedToday = selectedDate === todayDate;
        const isSelectedYesterday = selectedDate === yesterdayDate;
        const isSelectedTomorrow = selectedDate === tomorrowDate;

        // Strict matching: only include if smart labeling matches selected date type
        if (isSelectedToday && smartResult.label === 'today') return true;
        if (isSelectedYesterday && smartResult.label === 'yesterday') return true;
        if (isSelectedTomorrow && smartResult.label === 'tomorrow') return true;

        // For matches with finished/live status, use standard date matching as fallback
        const finishedStatuses = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'];
        const liveStatuses = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'];

        if (finishedStatuses.includes(fixture.fixture.status.short) || 
            liveStatuses.includes(fixture.fixture.status.short)) {
          return isFixtureOnClientDate(fixture.fixture.date, selectedDate);
        }

        // For not started matches, strictly follow smart date labeling - no fallback
        return false;
      }

      // Client-side filtering for popular leagues and countries
      const leagueId = fixture.league?.id;
      const country = fixture.league?.country?.toLowerCase() || "";

      // Check if it's a popular league
      const isPopularLeague = POPULAR_LEAGUES.includes(leagueId);

      // Check if it's from a popular country
      const isFromPopularCountry = POPULAR_COUNTRIES_ORDER.some(
        (popularCountry) =>
          country.includes(popularCountry.toLowerCase()),
      );

      // Apply exclusion check FIRST, before checking international competitions
      const leagueName = fixture.league?.name?.toLowerCase() || "";
      const homeTeamName = fixture.teams?.home?.name?.toLowerCase() || "";
      const awayTeamName = fixture.teams?.away?.name?.toLowerCase() || "";

      // Early exclusion for women's competitions and other unwanted matches
      if (shouldExcludeFromPopularLeagues(fixture.league.name, fixture.teams.home.name, fixture.teams.away.name, country)) {
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
        (leagueName.includes("friendlies") &&
          !leagueName.includes("women")) ||
        (leagueName.includes("international") &&
          !leagueName.includes("women")) ||
        country.includes("world") ||
        country.includes("europe") ||
        country.includes("international");

      return (
        isPopularLeague ||
        isFromPopularCountry ||
        isInternationalCompetition
      );
    });

    const finalFiltered = filtered.filter((fixture) => {
      // Apply popular league exclusion filters
      if (
        shouldExcludeFromPopularLeagues(
          fixture.league.name,
          fixture.teams.home.name,
          fixture.teams.away.name,
          fixture.league.country
        )
      ) {
        return false;
      }

      // Additional check for restricted US leagues
      if (isRestrictedUSLeague(fixture.league.id, fixture.league.country, fixture.league.name)) {
        console.log(`🚫 [DEBUG] Restricted US League filtered out:`, {
          leagueId: fixture.league.id,
          leagueName: fixture.league.name,
          country: fixture.league.country,
          teams: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`
        });
        return false;
      }

      // Skip fixtures with null or undefined country
      if (!fixture.league.country) {
        return false;
      }

      const countryName = fixture.league.country?.toLowerCase() || "";
      const leagueId = fixture.league.id;
      const leagueNameLower = fixture.league.name?.toLowerCase() || "";

      // Check for international competitions first
      const isInternationalCompetition =
        // UEFA competitions
        leagueNameLower.includes("champions league") ||
        leagueNameLower.includes("europa league") ||
        leagueNameLower.includes("conference league") ||
        leagueNameLower.includes("uefa") ||
        leagueNameLower.includes("euro") ||
        // FIFA competitions
        leagueNameLower.includes("world cup") ||
        leagueNameLower.includes("fifa club world cup") ||
        leagueNameLower.includes("fifa cup") ||
        leagueNameLower.includes("fifa") ||
        // CONMEBOL competitions
        leagueNameLower.includes("conmebol") ||
        leagueNameLower.includes("copa america") ||
        leagueNameLower.includes("copa libertadores") ||
        leagueNameLower.includes("copa sudamericana") ||
        leagueNameLower.includes("libertadores") ||
        leagueNameLower.includes("sudamericana") ||
        // Men's International Friendlies (excludes women's)
        (leagueNameLower.includes("friendlies") &&
          !leagueNameLower.includes("women")) ||
        (leagueNameLower.includes("international") &&
          !leagueNameLower.includes("women")) ||
        countryName.includes("world") ||
        countryName.includes("europe") ||
        countryName.includes("international");

      // Allow all international competitions through
      if (isInternationalCompetition) {
        return true;
      }

      // Check if it's a popular country
      const matchingCountry = POPULAR_COUNTRIES.find((country) =>
        countryName.includes(country.toLowerCase()),
      );

      if (!matchingCountry) {
        return false;
      }

      return true;
    });

    const endTime = Date.now();
    console.log(
      `Filtered ${fixtures.length} fixtures to ${finalFiltered.length} in ${endTime - startTime}ms`,
    );

    return finalFiltered;
  }, [fixtures, selectedDate]);

  // Group fixtures by country and league, with special handling for Friendlies
  const fixturesByCountry = filteredFixtures.reduce(
    (acc: any, fixture: any) => {
      // Add comprehensive null checks
      if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
        return acc;
      }

      // Ensure league has required properties
      const league = fixture.league;
      if (!league.id || !league.name) {
        console.warn("Invalid league data:", league);
        return acc;
      }

      const country = league.country;

      // Use centralized exclusion filter
      const leagueName = league.name || "";
      const homeTeamName = fixture.teams?.home?.name || "";
      const awayTeamName = fixture.teams?.away?.name || "";

      // Check if fixture should be excluded using popular league specialized filter
      if (shouldExcludeFromPopularLeagues(leagueName, homeTeamName, awayTeamName, country)) {
        return acc;
      }

      // Additional check for restricted US leagues
      if (isRestrictedUSLeague(league.id, country, league.name)) {
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
            league.name.toLowerCase().includes("conference")
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
            const unrestrictedCountries = ['Brazil', 'Colombia', 'Saudi Arabia', 'Europe', 'South America', 'World'];
            const isUnrestrictedCountry = unrestrictedCountries.includes(countryKey);

            acc[countryKey].leagues[leagueId] = {
              league: { ...league, country: countryKey },
              matches: [],
              isPopular: POPULAR_LEAGUES.includes(leagueId) || isUnrestrictedCountry,
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

      // For unrestricted countries (Brazil, Colombia, Saudi Arabia, Europe, South America, World), 
      // consider all leagues as "popular" to show them all
      const unrestrictedCountries = ['Brazil', 'Colombia', 'Saudi Arabia', 'Europe', 'South America', 'World'];
      const isUnrestrictedCountry = unrestrictedCountries.includes(country);

      if (isPopularForCountry || isGloballyPopular || isUnrestrictedCountry) {
        acc[country].hasPopularLeague = true;
      }

      if (!acc[country].leagues[leagueId]) {
        const unrestrictedCountries = ['Brazil', 'Colombia', 'Saudi Arabia', 'Europe', 'South America', 'World'];
        const isUnrestrictedCountry = unrestrictedCountries.includes(country);

        acc[country].leagues[leagueId] = {
          league: {
            ...league,
            logo:
              league.logo ||
              "https://media.api-sports.io/football/leagues/1.png",
          },
          matches: [],
          isPopular: isPopularForCountry || isGloballyPopular || isUnrestrictedCountry,
          isPopularForCountry: isPopularForCountry || isUnrestrictedCountry,
          isFriendlies: false,
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
    },
    {},
  );

  // Filter to show only popular countries with badge system
  const filteredCountries = Object.values(fixturesByCountry).filter(
    (countryData: any) => {
      return countryData.hasPopularLeague;
    },
  );

  // Sort countries by the POPULAR_COUNTRIES_ORDER
  const sortedCountries = useMemo(() => {
    return filteredCountries.sort((a: any, b: any) => {
      const getPopularCountryIndex = (country: string) => {
        if (!country) return 999;
        const index = POPULAR_COUNTRIES_ORDER.findIndex(
          (pc) =>
            safeSubstring(country, 0).toLowerCase() ===
            safeSubstring(pc, 0).toLowerCase(),
        );
        return index === -1 ? 999 : index;
      };

      const aPopularIndex = getPopularCountryIndex(a.country);
      const bPopularIndex = getPopularCountryIndex(b.country);

      const aIsPopularCountry = aPopularIndex !== 999;
      const bIsPopularCountry = bPopularIndex !== 999;

      // Check if countries are World or Europe (International competitions)
      const aIsWorldOrEurope = a.country === "World" || a.country === "Europe";
      const bIsWorldOrEurope = b.country === "World" || b.country === "Europe";

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
  }, [filteredCountries]);

  // Apply time filters
  const timeFilteredCountries = useMemo(() => {
    if (!timeFilterActive) return sortedCountries;

    return sortedCountries
      .map((countryData) => {
        const updatedLeagues = Object.entries(countryData.leagues).reduce(
          (acc: any, [leagueId, leagueData]: any) => {
            const updatedMatches = leagueData.matches.filter((match: any) => {
              if (!match?.fixture?.date) return false;

              try {
                const fixtureDate = parseISO(match.fixture.date);
                if (!isValid(fixtureDate)) return false;

                const now = new Date();
                const hoursDifference = differenceInHours(fixtureDate, now);
                return hoursDifference >= -2 && hoursDifference <= 12;
              } catch (error) {
                return false;
              }
            });

            if (updatedMatches.length > 0) {
              acc[leagueId] = {
                ...leagueData,
                matches: updatedMatches,
              };
            }
            return acc;
          },
          {},
        );

        return {
          ...countryData,
          leagues: updatedLeagues,
        };
      })
      .filter((countryData) => Object.keys(countryData.leagues).length > 0);
  }, [sortedCountries, timeFilterActive]);

  // Apply live filters
  const liveFilteredCountries = useMemo(() => {
    if (!liveFilterActive) return timeFilteredCountries;

    return timeFilteredCountries
      .map((countryData) => {
        const updatedLeagues = Object.entries(countryData.leagues).reduce(
          (acc: any, [leagueId, leagueData]: any) => {
            const updatedMatches = leagueData.matches.filter((match: any) => {
              return (
                match.fixture.status.short === "LIV" ||
                match.fixture.status.short === "HT"
              );
            });

            if (updatedMatches.length > 0) {
              acc[leagueId] = {
                ...leagueData,
                matches: updatedMatches,
              };
            }
            return acc;
          },
          {},
        );

        return {
          ...countryData,
          leagues: updatedLeagues,
        };
      })
      .filter((countryData) => Object.keys(countryData.leagues).length > 0);
  }, [timeFilteredCountries, liveFilterActive]);

  // Apply top 20 filters (by default)
  const top20FilteredCountries = useMemo(() => {
    if (!showTop20) return liveFilteredCountries;
    return liveFilteredCountries.slice(0, 20);
  }, [liveFilteredCountries, showTop20]);

  const toggleCountry = useCallback((country: string) => {
    setExpandedCountries((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(country)) {
        newExpanded.delete(country);
      } else {
        newExpanded.add(country);
      }
      return newExpanded;
    });
  }, []);

  // Favorite team functionality
  const toggleFavoriteTeam = async (teamId: number, teamName: string) => {
    try {
      const isFavorite =
        favoriteTeams?.some((team) => team.id === teamId) || false;

      if (isFavorite) {
        dispatch(userActions.removeFavoriteTeam(teamId));
        toast({
          title: "Removed from favorites",
          description: `${teamName} has been removed from your favorites.`,
        });
      } else {
        dispatch(userActions.addFavoriteTeam({ id: teamId, name: teamName }));
        toast({
          title: "Added to favorites",
          description: `${teamName} has been added to your favorites.`,
        });
      }
    } catch (error) {
      console.error("Error toggling favorite team:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isTeamFavorite = (teamId: number) => {
    return favoriteTeams?.some((team) => team.id === teamId) || false;
  };

  const toggleStarMatch = (matchId: number) => {
    setStarredMatches((prev) => {
      const newStarred = new Set(prev);
      if (newStarred.has(matchId)) {
        newStarred.delete(matchId);
      } else {
        newStarred.add(matchId);
      }
      return newStarred;
    });
  };

  // Start with all countries collapsed by default
  useEffect(() => {
    // Reset to collapsed state when selected date changes
    setExpandedCountries(new Set());
  }, [selectedDate]);

  // Helper function to check if fixture date matches client date
  const isFixtureOnLocalDate = (fixtureDate: string, selectedDate: string): boolean => {
    try {
      const fixtureLocalDate = getFixtureLocalDate(fixtureDate);
      return fixtureLocalDate === selectedDate;
    } catch (error) {
      console.error("Error comparing fixture date:", error);
      return false;
    }
  };


  if (isLoading || isFetching) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-3 w-40" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-100 last:border-b-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-6 h-4 rounded-sm" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!filteredFixtures.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No matches available for this date</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate date strings for comparison - use actual current date for reference
  const actualCurrentDate = new Date();
  const actualTodayString = format(actualCurrentDate, "yyyy-MM-dd");
  const actualYesterdayString = format(
    subDays(actualCurrentDate, 1),
    "yyyy-MM-dd",
  );
  const actualTomorrowString = format(
    addDays(actualCurrentDate, 1),
    "yyyy-MM-dd",
  );

  // Get header title based on selected date with accurate date comparison
  const getHeaderTitle = () => {
    let baseTitle = "Popular Football Leagues";

    // Add time filter indicator
    if (timeFilterActive && showTop20) {
      baseTitle += " (Top 20 by Time)";
    }

    return baseTitle;
  };

  // Format the time for display
  const formatMatchTime = (dateString: string | null | undefined) => {
    try {
      if (!dateString) return "--:--";
      const date = new Date(dateString);
      return format(date, "HH:mm");
    } catch (error) {
      console.error("Error formatting match time:", error);
      return "--:--";
    }
  };

  const addFavoriteTeam = (team: any) => {
    dispatch(userActions.addFavoriteTeam(team));
    toast({
      title: "Added to favorites",
      description: `${team.name} has been added to your favorites.`,
    });
  };

  const removeFavoriteTeam = (teamId: number) => {
    dispatch(userActions.removeFavoriteTeam(teamId));
    toast({
      title: "Removed from favorites",
      description: `Team has been removed from your favorites.`,
    });
  };

  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        {getHeaderTitle()}
      </CardHeader>
      {/* Create individual league cards from all countries */}
      {top20FilteredCountries.flatMap(
        (countryData: any, countryIndex: number) =>
          Object.values(countryData.leagues)
            .sort((a: any, b: any) => {
              // Check for UEFA Nations League - Women first (lowest priority)
              const aIsWomensNationsLeague = a.league.name?.toLowerCase().includes('uefa nations league') && a.league.name?.toLowerCase().includes('women');
              const bIsWomensNationsLeague = b.league.name?.toLowerCase().includes('uefa nations league') && b.league.name?.toLowerCase().includes('women');

              if (aIsWomensNationsLeague && !bIsWomensNationsLeague) return 1; // a goes to bottom
              if (!aIsWomensNationsLeague && bIsWomensNationsLeague) return -1; // b goes to bottom
              if (aIsWomensNationsLeague && bIsWomensNationsLeague) return 0; // both same priority

              //              // Prioritize leagues that are popular for this specific country
              if (a.isPopularForCountry && !b.isPopularForCountry) return -1;
              if (!a.isPopularForCountry && b.isPopularForCountry) return 1;

              // Then globally popular leagues
              if (a.isPopular && !b.isPopular) return -1;
              if (!a.isPopular && b.isPopular) return 1;

              // Finally alphabetical
              return a.league.name.localeCompare(b.league.name);
            })
            .map((leagueData: any, leagueIndex: number) => {
              const isFirstCard = countryIndex === 0 && leagueIndex === 0;
              return (
                <Card
                  key={`${countryData.country}-${leagueData.league.id}`}
                  className="border bg-card text-card-foreground shadow-md overflow-hidden mb-4"
                >
                  {/* League Header - Always show unless time filter is active */}
                  {!timeFilterActive && (
                    <>
                      {leagueData.isFriendlies ? (
                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                          <img
                            src={
                              leagueData.league.logo ||
                              "/assets/fallback-logo.svg"
                            }
                            alt={leagueData.league.name || "Unknown League"}
                            className="w-5 h-5 object-contain rounded-full"
                            style={{ backgroundColor: "transparent" }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/assets/fallback-logo.svg";
                            }}
                          />
                          <span className="font-medium text-sm text-blue-800">
                            {leagueData.league.name || "Unknown League"}
                          </span>
                          <span className="text-xs text-blue-600">
                            {leagueData.matches.length}{" "}
                            {leagueData.matches.length === 1
                              ? "match"
                              : "matches"}
                          </span>
                        </div>
                      ) : (
                        <CardContent className="flex items-start gap-2 p-3 bg-white border-b border-gray-200 pb-[12px] mb-[0px]">
                          <img
                            src={
                              leagueData.league.logo ||
                              "/assets/fallback-logo.svg"
                            }
                            alt={leagueData.league.name || "Unknown League"}
                            className="w-9 h-9 object-contain mt-0.5 rounded-full"
                            style={{ backgroundColor: "transparent" }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/assets/fallback-logo.svg";
                            }}
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold text-base text-gray-800">
                              {safeSubstring(leagueData.league.name, 0) ||
                                "Unknown League"}
                            </span>
                            <span className="text-xs text-gray-600">
                              {leagueData.league.country || "Unknown Country"}
                            </span>
                          </div>
                          <div className="flex gap-1 ml-auto">
                            {leagueData.isPopular &&
                              !leagueData.isPopularForCountry && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                  Popular
                                </span>
                              )}
                          </div>
                        </CardContent>
                      )}
                    </>                  )}
                  {/* Matches - Show for all leagues */}
                  <CardContent className="p-0">
                    <div className="space-y-0">
                      {leagueData.matches
                        .slice(
                          0,
                          timeFilterActive && showTop20 ? 20 : undefined,
                        )
                        .sort((a: any, b: any) => {
                          // When time filter is active, prioritize by time more strictly
                          if (timeFilterActive) {
                            const aDate = parseISO(a.fixture.date);
                            const bDate = parseISO(b.fixture.date);
                            const now = new Date();

                            // Ensure valid dates
                            if (!isValid(aDate) || !isValid(bDate)) {
                              return 0;
                            }

                            const aTime = aDate.getTime();
                            const bTime = bDate.getTime();
                            const nowTime = now.getTime();

                            // Calculate time distance from now
                            const aDistance = Math.abs(aTime - nowTime);
                            const bDistance = Math.abs(bTime - nowTime);

                            // Prioritize matches closest to current time
                            return aDistance - bDistance;
                          }

                          // Original sorting logic when time filter is not active
                          const aStatus = a.fixture.status.short;
                          const bStatus = b.fixture.status.short;
                          const aDate = parseISO(a.fixture.date);

                          const bDate = parseISO(b.fixture.date);

                          // Ensure valid dates
                          if (!isValid(aDate) || !isValid(bDate)) {
                            return 0;
                          }

                          const now = new Date();
                          const aTime = aDate.getTime();
                          const bTime = bDate.getTime();

                          // Check if matches involve popular teams (with null safety)
                          const aHasPopularTeam =
                            (a.teams?.home?.id &&
                              POPULAR_TEAMS.includes(a.teams.home.id)) ||
                            (a.teams?.away?.id &&
                              POPULAR_TEAMS.includes(a.teams.away.id));
                          const bHasPopularTeam =
                            (b.teams?.home?.id &&
                              POPULAR_TEAMS.includes(b.teams.home.id)) ||
                            (b.teams?.away?.id &&
                              POPULAR_TEAMS.includes(b.teams.away.id));

                          // Prioritize popular team matches first
                          if (aHasPopularTeam && !bHasPopularTeam) return -1;
                          if (!aHasPopularTeam && bHasPopularTeam) return 1;

                          // Define status categories
                          const aLive = [
                            "LIVE",
                            "1H",
                            "HT",
                            "2H",
                            "ET",
                            "BT",
                            "P",
                            "INT",
                          ].includes(aStatus);
                          const bLive = [
                            "LIVE",
                            "1H",
                            "HT",
                            "2H",
                            "ET",
                            "BT",
                            "P",
                            "INT",
                          ].includes(bStatus);

                          const aFinished = [
                            "FT",
                            "AET",
                            "PEN",
                            "AWD",
                            "WO",
                            "ABD",
                            "CANC",
                            "SUSP",
                          ].includes(aStatus);
                          const bFinished = [
                            "FT",
                            "AET",
                            "PEN",
                            "AWD",
                            "WO",
                            "ABD",
                            "CANC",
                            "SUSP",
                          ].includes(bStatus);

                          const aUpcoming =
                            aStatus === "NS" && !aLive && !aFinished;
                          const bUpcoming =
                            bStatus === "NS" && !bLive && !bFinished;

                          // Assign priority scores (lower = higher priority)
                          let aPriority = 0;
                          let bPriority = 0;

                          if (aLive) aPriority = 1;
                          else if (aUpcoming) aPriority = 2;
                          else if (aFinished) aPriority = 3;
                          else aPriority = 4;

                          if (bLive) bPriority = 1;
                          else if (bUpcoming) bPriority = 2;
                          else if (bFinished) bPriority = 3;
                          else bPriority = 4;

                          // Second sort by match status priority
                          if (aPriority !== bPriority) {
                            return aPriority - bPriority;
                          }

                          // If same priority, sort by time within category
                          if (aLive && bLive) {
                            // For live matches, show earliest start time first
                            return aTime - bTime;
                          }

                          if (aUpcoming && bUpcoming) {
                            // For upcoming matches, show earliest start time first
                            return aTime - bTime;
                          }

                          if (aFinished && bFinished) {
                            // For finished matches, show most recent first
                            return bTime - aTime;
                          }

                          // Default time-based sorting
                          return aTime - bTime;
                        })
                        .map((match: any) => (
                          <LazyMatchItem key={match.fixture.id}>
                            <div
                              key={match.fixture.id}
                              className="match-card-container group"
                            >
                              {/* Star Button with true slide-in effect */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStarMatch(match.fixture.id);
                                }}
                                className="match-star-button"
                                title="Add to favorites"
                                onMouseEnter={(e) => {
                                  e.currentTarget
                                    .closest(".group")
                                    ?.classList.add("disable-hover");
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget
                                    .closest(".group")
                                    ?.classList.remove("disable-hover");
                                }}
                              >
                                <Star
                                  className={`match-star-icon ${
                                    starredMatches.has(match.fixture.id)
                                      ? "starred"
                                      : ""
                                  }`}
                                />
                              </button>

                              <div className="match-content-container">
                                {/* Home Team Name - positioned further left */}
                                <div className="home-team-name">
                                  {shortenTeamName(match.teams.home.name) || "Unknown Team"}
                                </div>

                                {/* Home team logo - closer to center */}
                                <div className="team-logo-container">
                                  <LazyImage
                                    src={
                                      match.teams.home.id
                                        ? `/api/team-logo/square/${match.teams.home.id}?size=36`
                                        : "/assets/fallback-logo.svg"
                                    }
                                    alt={match.teams.home.name}
                                    title={match.teams.home.name}
                                    className={`team-logo ${
                                      isNationalTeam(
                                        match.teams.home,
                                        leagueData.league
                                      )
                                        ? "national-team"
                                        : ""
                                    }`}
                                    fallbackSrc="/assets/fallback-logo.svg"
                                  />
                                </div>

                                {/* Score/Time Center - Fixed width and centered */}
                                <div className="match-score-container">
                                  {(() => {
                                    const status = match.fixture.status.short;
                                    const fixtureDate = parseISO(
                                      match.fixture.date,
                                    );

                                    // Live matches
                                    if (
                                      [
                                        "LIVE",
                                        "1H",
                                        "HT",
                                        "2H",
                                        "ET",
                                        "BT",
                                        "P",
                                        "INT",
                                      ].includes(status)
                                    ) {
                                      return (
                                        <div className="relative">
                                          <div className="match-score-display">
                                            <span className="score-number">
                                              {match.goals.home ?? 0}
                                            </span>
                                            <span className="score-separator">
                                              -
                                            </span>
                                            <span className="score-number">
                                              {match.goals.away ?? 0}
                                            </span>
                                          </div>
                                          <div className="match-status-label status-live">
                                            {status === "HT"
                                              ? "HT"
                                              : `${match.fixture.status.elapsed || 0}'`}
                                          </div>
                                        </div>
                                      );
                                    }

                                    // All finished match statuses
                                    if (
                                      [
                                        "FT",
                                        "AET",
                                        "PEN",
                                        "AWD",
                                        "WO",
                                        "ABD",
                                        "CANC",
                                        "SUSP",
                                      ].includes(status)
                                    ) {
                                      // Check if we have actual numerical scores
                                      const homeScore = match.goals.home;
                                      const awayScore = match.goals.away;
                                      const hasValidScores =
                                        homeScore !== null &&
                                        homeScore !== undefined &&
                                        awayScore !== null &&
                                        awayScore !== undefined &&
                                        !isNaN(Number(homeScore)) &&
                                        !isNaN(Number(awayScore));

                                      if (hasValidScores) {
                                        return (
                                          <div className="relative">
                                            <div className="match-score-display">
                                              <span className="score-number">
                                                {homeScore}
                                              </span>
                                              <span className="score-separator">
                                                -
                                              </span>
                                              <span className="score-number">
                                                {awayScore}
                                              </span>
                                            </div>
                                            <div className="match-status-label status-ended">
                                              {status === "FT"
                                                ? "Ended"
                                                : status === "AET"
                                                  ? "AET"
                                                  : status === "PEN"
                                                    ? "PEN"
                                                    : status === "AWD"
                                                      ? "Awarded"
                                                      : status === "WO"
                                                        ? "Walkover"
                                                        : status === "ABD"
                                                          ? "Abandoned"
                                                          : status === "CANC"
                                                            ? "Cancelled"
                                                            : status === "SUSP"
                                                              ? "Suspended"
                                                              : status}
                                            </div>
                                          </div>
                                        );
                                      } else {
                                        // Match is finished but no valid score data
                                        const statusText =
                                          status === "FT"
                                            ? "No Score"
                                            : status === "AET"
                                              ? "AET"
                                              : status === "PEN"
                                                ? "PEN"
                                                : status === "AWD"
                                                  ? "Awarded"
                                                  : status === "WO"
                                                    ? "Walkover"
                                                    : status === "ABD"
                                                      ? "Abandoned"
                                                      : status === "CANC"
                                                        ? "Cancelled"
                                                        : status === "SUSP"
                                                          ? "Suspended"
                                                          : "No Score";

                                        return (
                                          <div className="relative">
                                            <div className="text-sm font-medium text-gray-900">
                                              {format(fixtureDate, "HH:mm")}
                                            </div>
                                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs font-semibold">
                                              <span className="text-gray-600 bg-white px-1 rounded">
                                                {statusText}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      }
                                    }

                                    // Postponed or delayed matches
                                    if (
                                      [
                                        "PST",
                                        "CANC",
                                        "ABD",
                                        "SUSP",
                                        "AWD",
                                        "WO",
                                      ].includes(status)
                                    ) {
                                      const statusText =
                                        status === "PST"
                                          ? "Postponed"
                                          : status === "CANC"
                                            ? "Cancelled"
                                            : status === "ABD"
                                              ? "Abandoned"
                                              : status === "SUSP"
                                                ? "Suspended"
                                                : status === "AWD"
                                                  ? "Awarded"
                                                  : status === "WO"
                                                    ? "Walkover"
                                                    : status;

                                      return (
                                        <div className="relative">
                                          <div className="text-sm font-medium text-gray-900">
                                            {format(fixtureDate, "HH:mm")}
                                          </div>
                                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs font-semibold">
                                            <span className="text-red-600 bg-white px-1 rounded">
                                              {statusText}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    }

                                    // Upcoming matches (NS = Not Started, TBD = To Be Determined)
                                    return (
                                      <div className="relative flex items-center justify-center h-full">
                                        <div className="match-time-display">
                                          {status === "TBD"
                                            ? "TBD"
                                            : format(fixtureDate, "HH:mm")}
                                        </div>
                                        {status === "TBD" && (
                                          <div className="match-status-label status-upcoming">
                                            Time TBD
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Away team logo - closer to center */}
                                <div className="team-logo-container">
                                  <LazyImage
                                    src={
                                      match.teams.away.id
                                        ? `/api/team-logo/square/${match.teams.away.id}?size=36`
                                        : "/assets/fallback-logo.svg"
                                    }
                                    alt={match.teams.away.name}
                                    title={match.teams.away.name}
                                    className={`team-logo ${
                                      isNationalTeam(
                                        match.teams.away,
                                        leagueData.league
                                      )
                                        ? "national-team"
                                        : ""
                                    }`}
                                    fallbackSrc="/assets/fallback-logo.svg"
                                  />
                                </div>

                                {/* Away Team Name - positioned further right */}
                                <div className="away-team-name">
                                  {shortenTeamName(match.teams.away.name) || "Unknown Team"}
                                </div>
                              </div>
                            </div>
                          </LazyMatchItem>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              );
            }),
      )}
    </>
  );
};

export default TodayPopularFootballLeaguesNew;