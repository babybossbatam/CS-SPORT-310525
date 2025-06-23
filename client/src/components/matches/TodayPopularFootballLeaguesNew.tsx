import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Calendar, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { RootState, userActions } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid, differenceInHours } from "date-fns";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
// Removed complex date utilities - using simple date filtering now
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import {
  shouldExcludeFromPopularLeagues,
  isPopularLeagueSuitable,
  isRestrictedUSLeague,
} from "@/lib/MyPopularLeagueExclusion";
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
import {
  getCountryFlagWithFallbackSync,
  clearVenezuelaFlagCache,
  forceRefreshVenezuelaFlag,
  clearAllFlagCache,
  getCountryCode,
} from "../../lib/flagUtils";
import { createFallbackHandler } from "../../lib/MyAPIFallback";
import { MyFallbackAPI } from "../../lib/MyFallbackAPI";
import { getCachedTeamLogo } from "../../lib/MyAPIFallback";
import { isNationalTeam } from "../../lib/teamLogoSources";
import { SimpleDateFilter } from "../../lib/simpleDateFilter";
import "../../styles/MyLogoPositioning.css";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";
import MyNormalFlag from "../common/MyNormalFlag";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";

// Helper function to shorten team names
export const shortenTeamName = (teamName: string): string => {
  if (!teamName) return teamName;

  // Remove common suffixes that make names too long
  const suffixesToRemove = [
    "-sc",
    "-SC",
    " SC",
    " FC",
    " CF",
    " United",
    " City",
    " Islands",
    " Republic",
    " National Team",
    " U23",
    " U21",
    " U20",
    " U19",
  ];

  let shortened = teamName;
  for (const suffix of suffixesToRemove) {
    if (shortened.endsWith(suffix)) {
      shortened = shortened.replace(suffix, "");
      break;
    }
  }

  // Handle specific country name shortenings
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
  onMatchCardClick?: (fixture: any) => void;
}

const TodayPopularFootballLeaguesNew: React.FC<
  TodayPopularFootballLeaguesNewProps
> = ({
  selectedDate,
  timeFilterActive = false,
  showTop20 = false,
  liveFilterActive = false,
  onMatchCardClick,
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(),
  );
  const [enableFetching, setEnableFetching] = useState(true);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(new Set());
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(new Set());
  const [previousMatchStatuses, setPreviousMatchStatuses] = useState<Map<number, string>>(new Map());

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
    "Iraq",
    "Chile",
    "Colombia",
    "United States",
    "USA",
    "US",
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
    "United Arab Emirates": [301], // UAE Pro League
    Egypt: [233], // Egyptian Premier League (only major league)
    Iraq: [332], // Iraq League
    Chile: [265], // Primera Division
    International: [15], // FIFA Club World Cup as separate category
    World: [914, 848, 15], // COSAFA Cup, UEFA Conference League, FIFA Club World Cup
  };

  // Flatten popular leagues for backward compatibility and add COSAFA Cup and CONCACAF Gold Cup
  const POPULAR_LEAGUES = [
    ...Object.values(POPULAR_LEAGUES_BY_COUNTRY).flat(),
    914, // COSAFA Cup
    16, // CONCACAF Gold Cup
    38, // World Cup - Qualification CONCACAF
    15, // FIFA Club World Cup
  ];

  // Debug: Log the popular leagues list
  console.log(
    "🎯 [POPULAR LEAGUES DEBUG] Full popular leagues list:",
    POPULAR_LEAGUES,
  );
  console.log("🎯 [POPULAR LEAGUES DEBUG] Target leagues check:", {
    league38InList: POPULAR_LEAGUES.includes(38),
    league15InList: POPULAR_LEAGUES.includes(15),
    league16InList: POPULAR_LEAGUES.includes(16),
    league914InList: POPULAR_LEAGUES.includes(914),
  });

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

  // Smart cache duration based on date type
  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === today;
  const isFuture = selectedDate > today;

  // Longer cache for upcoming dates (4 hours), shorter for today (2 hours)
  const cacheMaxAge = isFuture
    ? 4 * 60 * 60 * 1000
    : isToday
      ? 2 * 60 * 60 * 1000
      : 30 * 60 * 1000;

  // Check if we have fresh cached data
  const fixturesQueryKey = ["all-fixtures-by-date", selectedDate];

  // Removed live fixtures fetching - this component now only handles date-based fixtures

  // Fetch all fixtures for the selected date with smart caching
  const {
    data: fixtures = [],
    isLoading,
    isFetching,
  } = useCachedQuery(
    fixturesQueryKey,
    async () => {
      console.log(
        `🔄 [TodayPopularLeagueNew] Fetching fresh data for date: ${selectedDate}`,
      );
      const response = await apiRequest(
        "GET",
        `/api/fixtures/date/${selectedDate}?all=true`,
      );
      const data = await response.json();
      console.log(
        `✅ [TodayPopularLeagueNew] Received ${data?.length || 0} fixtures for ${selectedDate}`,
      );
      return data;
    },
    {
      enabled: !!selectedDate && enableFetching,
      maxAge: cacheMaxAge,
      backgroundRefresh: false, // Disable background refresh to prevent frequent calls
      staleTime: cacheMaxAge, // Use the same duration for stale time
      gcTime: cacheMaxAge * 2, // Keep in memory longer
      refetchOnMount: false, // Don't refetch on component mount
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: false, // Don't refetch on reconnect
    },
  );

  // Simple fixture processing - only use cached/date-based fixtures
  const processedFixtures = useMemo(() => {
    if (!fixtures?.length) return [];

    console.log(`🎯 [TodayPopularLeagueNew] Processing ${fixtures.length} fixtures from date-based API`);

    // Return fixtures as-is from the date-based API endpoint
    return fixtures;
  }, [fixtures]);

  // Use the prioritized popular countries list
  const POPULAR_COUNTRIES = POPULAR_COUNTRIES_ORDER;

  // Smart filtering operations with intelligent data source selection
  const filteredFixtures = useMemo(() => {
    if (!processedFixtures?.length) return [];

    console.log(
      `🔍 [FILTER DEBUG] Processing ${processedFixtures.length} fixtures for date: ${selectedDate} with intelligent data sources`,
    );

    // Debug: Check for target leagues in raw data
    const targetLeagues = [38, 15, 16, 914];
    targetLeagues.forEach((leagueId) => {
      const leagueFixtures = processedFixtures.filter(
        (f) => f.league?.id === leagueId,
      );
      console.log(
        `🔍 [RAW DATA DEBUG] League ${leagueId} fixtures in raw data:`,
        {
          count: leagueFixtures.length,
          fixtures: leagueFixtures.map((f) => ({
            id: f.fixture?.id,
            date: f.fixture?.date,
            status: f.fixture?.status?.short,
            league: f.league?.name,
            country: f.league?.country,
            home: f.teams?.home?.name,
            away: f.teams?.away?.name,
          })),
        },
      );
    });

    // Count COSAFA Cup matches in input
    const cosafaMatches = processedFixtures.filter(
      (f) =>
        f.league?.name?.toLowerCase().includes("cosafa") ||
        f.teams?.home?.name?.toLowerCase().includes("cosafa") ||
        f.teams?.away?.name?.toLowerCase().includes("cosafa"),
    );
    console.log(
      `🏆 [COSAFA DEBUG] Found ${cosafaMatches.length} COSAFA Cup matches in input fixtures:`,
      cosafaMatches.map((m) => ({
        id: m.fixture?.id,
        date: m.fixture?.date,
        status: m.fixture?.status?.short,
        league: m.league?.name,
        home: m.teams?.home?.name,
        away: m.teams?.away?.name,
      })),
    );

    const startTime = Date.now();

    // Determine what type of date is selected
    const today = new Date();
    const todayString = format(today, "yyyy-MM-dd");
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = format(tomorrow, "yyyy-MM-dd");
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = format(yesterday, "yyyy-MM-dd");

    const isSelectedTomorrow = selectedDate === tomorrowString;

    // Debug: Check for target leagues in raw data BEFORE any filtering
    targetLeagues.forEach((leagueId) => {
      const leagueFixtures = processedFixtures.filter(
        (f) => f.league?.id === leagueId,
      );
      if (leagueFixtures.length > 0) {
        console.log(
          `🔍 [RAW DATA DEBUG] League ${leagueId} fixtures in raw processed data:`,
          {
            leagueId,
            count: leagueFixtures.length,
            fixtures: leagueFixtures.map((f) => ({
              id: f.fixture?.id,
              date: f.fixture?.date,
              status: f.fixture?.status?.short,
              league: f.league?.name,
              country: f.league?.country,
              home: f.teams?.home?.name,
              away: f.teams?.away?.name,
            })),
          },
        );
      } else {
        console.log(
          `❌ [RAW DATA DEBUG] League ${leagueId} - NO FIXTURES FOUND in raw processed data`,
        );
      }
    });

    const filtered = processedFixtures.filter((fixture) => {
      // Debug target leagues specifically
      const isTargetLeague = [38, 15, 16, 914].includes(fixture.league?.id);
      if (isTargetLeague) {
        console.log(
          `🎯 [TARGET LEAGUE DEBUG] Processing league ${fixture.league?.id}:`,
          {
            leagueId: fixture.league?.id,
            leagueName: fixture.league?.name,
            country: fixture.league?.country,
            fixtureId: fixture.fixture?.id,
            date: fixture.fixture?.date,
            status: fixture.fixture?.status?.short,
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            selectedDate: selectedDate,
          },
        );
      }

      // Apply smart time filtering with selected date context
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        const smartResult = MySmartTimeFilter.getSmartTimeLabel(
          fixture.fixture.date,
          fixture.fixture.status.short,
          selectedDate + "T12:00:00Z", // Pass selected date as context
        );

        // Check if this match should be included based on the selected date (standardized logic)
        const shouldInclude = (() => {
          if (
            selectedDate === tomorrowString &&
            smartResult.label === "tomorrow"
          )
            return true;
          if (selectedDate === todayString && smartResult.label === "today")
            return true;
          if (
            selectedDate === yesterdayString &&
            smartResult.label === "yesterday"
          )
            return true;

          // Handle custom dates (dates that are not today/tomorrow/yesterday)
          if (
            selectedDate !== todayString &&
            selectedDate !== tomorrowString &&
            selectedDate !== yesterdayString
          ) {
            if (smartResult.label === "custom" && smartResult.isWithinTimeRange)
              return true;
          }

          return false;
        })();

        if (shouldInclude) {
          if (isTargetLeague) {
            console.log(
              `✅ [TARGET LEAGUE] Smart filter PASSED for league ${fixture.league?.id}: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
              {
                fixtureId: fixture.fixture?.id,
                fixtureDate: fixture.fixture.date,
                status: fixture.fixture.status.short,
                reason: smartResult.reason,
                label: smartResult.label,
                selectedDate,
                isWithinTimeRange: smartResult.isWithinTimeRange,
              },
            );
          }
        } else {
          if (isTargetLeague) {
            console.log(
              `❌ [TARGET LEAGUE] Smart filter FAILED for league ${fixture.league?.id}: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
              {
                fixtureId: fixture.fixture?.id,
                fixtureDate: fixture.fixture.date,
                status: fixture.fixture.status.short,
                reason: smartResult.reason,
                label: smartResult.label,
                selectedDate,
                isWithinTimeRange: smartResult.isWithinTimeRange,
              },
            );
          }
          return false;
        }
      }

      // Client-side filtering for popular leagues and countries
      const leagueId = fixture.league?.id;
      const country = fixture.league?.country?.toLowerCase() || "";

      // Check if it's a popular league
      const isPopularLeague = POPULAR_LEAGUES.includes(leagueId);

      // Check if it's from a popular country
      const isFromPopularCountry = POPULAR_COUNTRIES_ORDER.some(
        (popularCountry) => country.includes(popularCountry.toLowerCase()),
      );

      // Debug target leagues filtering logic
      if (isTargetLeague) {
        console.log(
          `🎯 [POPULAR LEAGUES DEBUG] League ${leagueId} filtering check:`,
          {
            leagueId,
            leagueName: fixture.league?.name,
            country: fixture.league?.country,
            countryLower: country,
            isPopularLeague,
            isFromPopularCountry,
            popularLeaguesIncludes: POPULAR_LEAGUES.includes(leagueId),
            matchingPopularCountry: POPULAR_COUNTRIES_ORDER.find((pc) =>
              country.includes(pc.toLowerCase()),
            ),
          },
        );
      }

      // Apply exclusion check FIRST, before checking international competitions
      const leagueName = fixture.league?.name?.toLowerCase() || "";
      const homeTeamName = fixture.teams?.home?.name?.toLowerCase() || "";
      const awayTeamName = fixture.teams?.away?.name?.toLowerCase() || "";

      // Early exclusion for women's competitions and other unwanted matches
      const shouldExclude = shouldExcludeFromPopularLeagues(
        fixture.league.name,
        fixture.teams.home.name,
        fixture.teams.away.name,
        country,
      );

      if (isTargetLeague) {
        console.log(
          `✅ [EXCLUSION RESULT] League ${fixture.league?.id} exclusion check:`,
          {
            leagueId: fixture.league?.id,
            leagueName: fixture.league?.name,
            country: fixture.league?.country,
            shouldExclude,
            homeTeam: fixture.teams?.home?.name,
            awayTeam: fixture.teams?.away?.name,
            exclusionReason: shouldExclude
              ? "Contains exclusion terms"
              : "Passed exclusion check",
          },
        );
      }

      if (shouldExclude) {
        if (isTargetLeague) {
          console.log(
            `❌ [EXCLUSION RESULT] League ${fixture.league?.id} EXCLUDED by shouldExcludeFromPopularLeagues`,
          );
        }
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
        // CONCACAF competitions
        leagueName.includes("concacaf") ||
        leagueName.includes("gold cup") ||
        leagueName.includes("concacaf gold cup") ||
        // Men's International Friendlies (excludes women's)
        (leagueName.includes("friendlies") && !leagueName.includes("women")) ||
        (leagueName.includes("international") &&
          !leagueName.includes("women")) ||
        country.includes("world") ||
        country.includes("europe") ||
        country.includes("international");

      if (isTargetLeague) {
        console.log(
          `🌍 [WORLD DEBUG] League ${leagueId} international competition check:`,
          {
            leagueId,
            leagueName: fixture.league?.name,
            country: fixture.league?.country,
            isInternationalCompetition,
            hasWorldInCountry: country.includes("world"),
            hasEuropeInCountry: country.includes("europe"),
            hasInternationalInCountry: country.includes("international"),
            hasConcacafInName: leagueName.includes("concacaf"),
            hasGoldCupInName: leagueName.includes("gold cup"),
            hasFifaInName: leagueName.includes("fifa"),
            hasWorldCupInName: leagueName.includes("world cup"),
          },
        );
      }

      const finalDecision =
        isPopularLeague || isFromPopularCountry || isInternationalCompetition;

      if (isTargetLeague) {
        console.log(
          `🎯 [FINAL DECISION] League ${fixture.league?.id} final filtering result:`,
          {
            leagueId: fixture.league?.id,
            leagueName: fixture.league?.name,
            country: fixture.league?.country,
            isPopularLeague,
            isFromPopularCountry,
            isInternationalCompetition,
            finalDecision,
            reason: finalDecision
              ? `${isPopularLeague ? "Popular League" : ""}${isFromPopularCountry ? " Popular Country" : ""}${isInternationalCompetition ? " International Competition" : ""}`
              : "Not popular league, not from popular country, not international competition",
          },
        );
      }

      return finalDecision;
    });

    const finalFiltered = filtered.filter((fixture) => {
      // Debug World country processing
      const country = fixture.league?.country?.toLowerCase() || "";
      if (country === "world") {
        console.log(
          `🌍 [POPULAR DEBUG] Processing World league: ${fixture.league.name} | ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
        );
      }

      // Apply popular league exclusion filters
      if (
        shouldExcludeFromPopularLeagues(
          fixture.league.name,
          fixture.teams.home.name,
          fixture.teams.away.name,
          fixture.league.country,
        )
      ) {
        if (country === "world") {
          console.log(
            `❌ [POPULAR DEBUG] World league excluded: ${fixture.league.name}`,
          );
        }
        return false;
      }

      // Additional check for restricted US leagues
      if (isRestrictedUSLeague(fixture.league.id, fixture.league.country)) {
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
        // CONCACAF competitions
        leagueNameLower.includes("concacaf") ||
        leagueNameLower.includes("gold cup") ||
        leagueNameLower.includes("concacaf gold cup") ||
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

    // Count COSAFA Cup matches in final filtered results
    const finalCosafaMatches = finalFiltered.filter(
      (f) =>
        f.league?.name?.toLowerCase().includes("cosafa") ||
        f.teams?.home?.name?.toLowerCase().includes("cosafa") ||
        f.teams?.away?.name?.toLowerCase().includes("cosafa"),
    );

    console.log(
      `🔍 [TOMORROW DEBUG] Filtered ${processedFixtures.length} fixtures to ${finalFiltered.length} in ${endTime - startTime}ms`,
    );
    console.log(
      `🏆 [COSAFA DEBUG] Final result: ${finalCosafaMatches.length} COSAFA Cup matches for ${selectedDate}:`,
      finalCosafaMatches.map((m) => ({
        id: m.fixture?.id,
        date: m.fixture?.date,
        status: m.fixture?.status?.short,
        league: m.league?.name,
        home: m.teams?.home?.name,
        away: m.teams?.away?.name,
      })),
    );

    // Debug: Check final result for target leagues
    const targetLeaguesInFinal = [38, 15, 16, 914];
    targetLeaguesInFinal.forEach((leagueId) => {
      const leagueFixtures = finalFiltered.filter(
        (f) => f.league?.id === leagueId,
      );
      if (leagueFixtures.length > 0) {
        console.log(
          `🎯 [FINAL RESULT DEBUG] League ${leagueId} in final filtered result:`,
          {
            leagueId,
            count: leagueFixtures.length,
            fixtures: leagueFixtures.map((f) => ({
              id: f.fixture?.id,
              date: f.fixture?.date,
              status: f.fixture?.status?.short,
              league: f.league?.name,
              country: f.league?.country,
              home: f.teams?.home?.name,
              away: f.teams?.away?.name,
            })),
          },
        );
      } else {
        console.log(
          `❌ [FINAL RESULT DEBUG] League ${leagueId} - NO FIXTURES in final filtered result for ${selectedDate}`,
        );

        // Additional debugging: Check if these fixtures exist in the original data but got filtered out
        const originalLeagueFixtures = processedFixtures.filter(
          (f) => f.league?.id === leagueId,
        );
        if (originalLeagueFixtures.length > 0) {
          console.log(
            `🔍 [FINAL RESULT DEBUG] League ${leagueId} was in original data but filtered out:`,
            {
              originalCount: originalLeagueFixtures.length,
              sampleFixture: originalLeagueFixtures[0]
                ? {
                    id: originalLeagueFixtures[0].fixture?.id,
                    date: originalLeagueFixtures[0].fixture?.date,
                    status: originalLeagueFixtures[0].fixture?.status?.short,
                    league: originalLeagueFixtures[0].league?.name,
                    country: originalLeagueFixtures[0].league?.country,
                  }
                : null,
            },
          );
        }
      }
    });

    return finalFiltered;
  }, [processedFixtures, selectedDate]);

  // Group fixtures by league directly (365scores style) - no country grouping
  const fixturesByLeague = filteredFixtures.reduce(
    (acc: any, fixture: any) => {
      // Add comprehensive null checks
      if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
        return acc;
      }

      const league = fixture.league;
      if (!league.id || !league.name) {
        console.warn("Invalid league data:", league);
        return acc;
      }

      const leagueId = league.id;
      const leagueName = league.name?.toLowerCase() || "";
      const homeTeamName = fixture.teams?.home?.name || "";
      const awayTeamName = fixture.teams?.away?.name || "";
      const country = league.country;

      // Debug: Log UEFA/FIFA competitions
      if (
        leagueName.includes("uefa") ||
        leagueName.includes("fifa") ||
        leagueName.includes("champions") ||
        leagueName.includes("europa") ||
        leagueName.includes("conference")
      ) {
        console.log("[UEFA/FIFA DEBUG] Found:", {
          leagueId: fixture.league.id,
          leagueName: fixture.league.name,
          country: fixture.league.country,
          homeTeam: fixture.teams.home.name,
          awayTeam: fixture.teams.away.name,
          date: fixture.fixture.date,
          status: fixture.fixture.status.short,
        });
      }

      // Apply exclusion filters
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

      if (isRestrictedUSLeague(league.id, country)) {
        return acc;
      }

      // Check if this league is in our popular leagues list
      const isPopularLeague = POPULAR_LEAGUES.includes(leagueId);

      // Only show popular leagues (365scores approach)
      if (!isPopularLeague) {
        return false;
      }

      console.log(`[LEAGUE DEBUG] Processing popular league:`, {
        leagueId,
        leagueName: league.name,
        country: league.country,
        homeTeam: fixture.teams?.home?.name,
        awayTeam: fixture.teams?.away?.name,
      });

      // Create league group if it doesn't exist
      if (!acc[leagueId]) {
        acc[leagueId] = {
          league: {
            ...league,
            logo: league.logo || "https://media.api-sports.io/football/leagues/1.png",
          },
          matches: [],
          isPopular: true,
          isFriendlies: leagueName.includes("friendlies"),
        };
      }

      // Validate and add match data
      if (
        fixture.teams.home &&
        fixture.teams.away &&
        fixture.teams.home.name &&
        fixture.teams.away.name
      ) {
        acc[leagueId].matches.push({
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

  // Convert league groups to array and sort by league priority (365scores style)
  const sortedLeagues = useMemo(() => {
    const leaguesArray = Object.values(fixturesByLeague);
    
    return leaguesArray.sort((a: any, b: any) => {
      const aLeagueId = a.league.id;
      const bLeagueId = b.league.id;
      const aLeagueName = (a.league.name || "").toLowerCase();
      const bLeagueName = (b.league.name || "").toLowerCase();
      const aCountry = a.league.country || "";
      const bCountry = b.league.country || "";

      // Priority 1: FIFA Club World Cup (highest priority)
      if (
        aLeagueName.includes("fifa club world cup") ||
        aLeagueName.includes("club world cup")
      ) return -1;
      if (
        bLeagueName.includes("fifa club world cup") ||
        bLeagueName.includes("club world cup")
      ) return 1;

      // Priority 2: UEFA competitions
      const aIsUEFA = aLeagueName.includes("champions league") || 
                     aLeagueName.includes("europa league") || 
                     aLeagueName.includes("conference league");
      const bIsUEFA = bLeagueName.includes("champions league") || 
                     bLeagueName.includes("europa league") || 
                     bLeagueName.includes("conference league");
      
      if (aIsUEFA && !bIsUEFA) return -1;
      if (!aIsUEFA && bIsUEFA) return 1;

      // Priority 3: Top 5 European leagues
      const topLeagues = [39, 140, 135, 78, 61]; // Premier League, La Liga, Serie A, Bundesliga, Ligue 1
      const aIsTop = topLeagues.includes(aLeagueId);
      const bIsTop = topLeagues.includes(bLeagueId);
      
      if (aIsTop && !bIsTop) return -1;
      if (!aIsTop && bIsTop) return 1;

      // Priority 4: International competitions (World, Nations League, etc.)
      const aIsInternational = aCountry === "World" || aCountry === "Europe" || 
                              aLeagueName.includes("nations league") ||
                              aLeagueName.includes("world cup") ||
                              aLeagueName.includes("friendlies");
      const bIsInternational = bCountry === "World" || bCountry === "Europe" || 
                              bLeagueName.includes("nations league") ||
                              bLeagueName.includes("world cup") ||
                              bLeagueName.includes("friendlies");
      
      if (aIsInternational && !bIsInternational) return -1;
      if (!aIsInternational && bIsInternational) return 1;

      // Default: Sort by league name alphabetically
      return aLeagueName.localeCompare(bLeagueName);
    });
  }, [fixturesByLeague]);

  // Apply live filters to leagues directly
  const liveFilteredLeagues = useMemo(() => {
    if (!liveFilterActive) return sortedLeagues;

    return sortedLeagues
      .map((leagueData: any) => {
        const updatedMatches = leagueData.matches.filter((match: any) => {
          return (
            match.fixture.status.short === "LIV" ||
            match.fixture.status.short === "HT"
          );
        });

        if (updatedMatches.length > 0) {
          return {
            ...leagueData,
            matches: updatedMatches,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [sortedLeagues, liveFilterActive]);

  // Apply top 20 filters to leagues
  const finalFilteredLeagues = useMemo(() => {
    if (!showTop20) return liveFilteredLeagues;
    return liveFilteredLeagues.slice(0, 20);
  }, [liveFilteredLeagues, showTop20]);
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

  // Real-time timer for live match updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Effect to track status changes for flash effects - works with intelligent data flow
  useEffect(() => {
    if (!processedFixtures?.length) return;

    const newHalftimeMatches = new Set<number>();
    const newFulltimeMatches = new Set<number>();
    const currentStatuses = new Map<number, string>();

    processedFixtures.forEach((fixture) => {
      const matchId = fixture.fixture.id;
      const currentStatus = fixture.fixture.status.short;
      const previousStatus = previousMatchStatuses.get(matchId);

      currentStatuses.set(matchId, currentStatus);

      // Check if status just changed to halftime
      if (currentStatus === 'HT' && previousStatus && previousStatus !== 'HT') {
        console.log(`🟠 [HALFTIME FLASH] Match ${matchId} just went to halftime!`, {
          home: fixture.teams?.home?.name,
          away: fixture.teams?.away?.name,
          previousStatus,
          currentStatus
        });
        newHalftimeMatches.add(matchId);
      }

      // Check if status just changed to fulltime
      if (currentStatus === 'FT' && previousStatus && previousStatus !== 'FT') {
        console.log(`🔵 [FULLTIME FLASH] Match ${matchId} just finished!`, {
          home: fixture.teams?.home?.name,
          away: fixture.teams?.away?.name,
          previousStatus,
          currentStatus
        });
        newFulltimeMatches.add(matchId);
      }
    });

    // Update previous statuses
    setPreviousMatchStatuses(currentStatuses);

    // Trigger flash for new halftime matches
    if (newHalftimeMatches.size > 0) {
      setHalftimeFlashMatches(newHalftimeMatches);

      // Remove flash after 2 seconds
      setTimeout(() => {
        setHalftimeFlashMatches(new Set());
      }, 2000);
    }

    // Trigger flash for new fulltime matches
    if (newFulltimeMatches.size > 0) {
      setFulltimeFlashMatches(newFulltimeMatches);

      // Remove flash after 2 seconds
      setTimeout(() => {
        setFulltimeFlashMatches(new Set());
      }, 2000);
    }
  }, [processedFixtures, previousMatchStatuses]);

  // Clear Venezuela flag cache on component mount to ensure fresh fetch
  useEffect(() => {
    console.log("🔄 Clearing Venezuela flag cache for fresh fetch...");
    clearVenezuelaFlagCache();

    // Also force refresh Venezuela flag asynchronously
    forceRefreshVenezuelaFlag()
      .then((newFlag) => {
        console.log(`✅ Venezuela flag refreshed to: ${newFlag}`);
      })
      .catch((error) => {
        console.error(`❌ Failed to refresh Venezuela flag:`, error);
      });

    // Clear all fallback flags as well to ensure clean state
    clearAllFlagCache();
    console.log("🧹 Cleared all flag cache including fallback flags");
  }, []);

  // Simple date comparison handled by SimpleDateFilter

  // Show loading only if we're actually loading and don't have any cached data
  const showLoading =
    (isLoading && !fixtures?.length) || (isFetching && !fixtures?.length);

  if (showLoading) {
    console.log(
      `⏳ [TodayPopularLeagueNew] Showing loading for ${selectedDate} - isLoading: ${isLoading}, isFetching: ${isFetching}, fixturesLength: ${fixtures?.length || 0}`,
    );

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
        <CardContent className="p-6  text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No matches available for this date</p>
        </CardContent>
      </Card>
    );
  }

  // Simple date display
  const currentDate = SimpleDateFilter.getCurrentDate();

  // Get header title
  const getHeaderTitle = () => {
    return "Popular Football Leagues";
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

      {/* Create individual league cards (365scores style) */}

      {finalFilteredLeagues.map((leagueData: any, leagueIndex: number) => {
        const isFirstCard = leagueIndex === 0;
        return (
          <Card
            key={`league-${leagueData.league.id}`}
            className="border bg-card text-card-foreground shadow-md overflow-hidden league-card-spacing"
          >
            {/* League Header - Always show unless time filter is active */}
            {!timeFilterActive && (
              <CardContent className="flex items-center gap-2 p-2  bg-white border-b border-gray-200">
                {/* League Star Toggle Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStarMatch(leagueData.league.id);
                  }}
                  className="transition-colors"
                  title={`${starredMatches.has(leagueData.league.id) ? "Remove from" : "Add to"} favorites`}
                >
                  <Star
                    className={`h-5 w-5 transition-all ${
                      starredMatches.has(leagueData.league.id)
                        ? "text-blue-500 fill-blue-500"
                        : "text-blue-300"
                    }`}
                  />
                </button>

                <img
                  src={
                    leagueData.league.logo || "/assets/fallback-logo.svg"
                  }
                  alt={leagueData.league.name || "Unknown League"}
                  className="w-6 h-6 object-contain rounded-full"
                  style={{ backgroundColor: "transparent" }}
                  onError={(e) => {
                    console.log(
                      `🚨 League logo failed for: ${leagueData.league.name} in ${leagueData.league.country}`,
                    );
                    (e.target as HTMLImageElement).src =
                      "/assets/fallback-logo.svg";
                  }}
                />
                <div className="flex flex-col flex-1">
                  <span
                    className="font-semibold text-gray-800"
                    style={{
                      fontFamily:
                        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      fontSize: "13.3px",
                    }}
                  >
                    {safeSubstring(leagueData.league.name, 0) ||
                      "Unknown League"}
                  </span>
                  <span
                    className="text-gray-600"
                    style={{
                      fontFamily:
                        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      fontSize: "13.3px",
                    }}
                  >
                    {leagueData.league.country || "Unknown Country"}
                  </span>
                </div>
                <div className="flex gap-1">
                  <span
                    className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium"
                    style={{ fontSize: "calc(0.75rem * 0.85)" }}
                  >
                    Popular
                  </span>
                </div>
              </CardContent>
            )}
            {/* Matches - Show for all leagues */}

            <div className="match-cards-wrapper">
              {leagueData.matches
            .slice(0, timeFilterActive && showTop20 ? 20 : undefined)
                      .slice(0, timeFilterActive && showTop20 ? 20 : undefined)
                      .sort((a: any, b: any) => {
                        const now = new Date();
                        const aDate = parseISO(a.fixture.date);
                        const bDate = parseISO(b.fixture.date);
                        const aStatus = a.fixture.status.short;
                        const bStatus = b.fixture.status.short;

                        // Ensure valid dates
                        if (!isValid(aDate) || !isValid(bDate)) {
                          return 0;
                        }

                        const aTime = aDate.getTime();
                        const bTime = bDate.getTime();
                        const nowTime = now.getTime();

                        // Define status categories
                        const aLive = [
                          "LIVE",
                          "LIV",
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
                          "LIV",
                          "1H",
                          "HT",
                          "2H",
                          "ET",
                          "BT",
                          "P",
                          "INT",
                        ].includes(bStatus);

                        const aUpcoming = aStatus === "NS" || aStatus === "TBD";
                        const bUpcoming = bStatus === "NS" || bStatus === "TBD";

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

                        // PRIORITY 1: LIVE matches always come first
                        if (aLive && !bLive) return -1;
                        if (!aLive && bLive) return 1;

                        // If both are LIVE, sort by elapsed time (shortest first)
                        if (aLive && bLive) {
                          const aElapsed =
                            Number(a.fixture.status.elapsed) || 0;
                          const bElapsed =
                            Number(b.fixture.status.elapsed) || 0;
                          return aElapsed - bElapsed;
                        }

                        // PRIORITY 2: Upcoming matches, sorted by time proximity to current time
                        if (aUpcoming && !bUpcoming) return -1;
                        if (!aUpcoming && bUpcoming) return 1;

                        if (aUpcoming && bUpcoming) {
                          // Sort by time distance from now (nearest first)
                          const aDistance = Math.abs(aTime - nowTime);
                          const bDistance = Math.abs(bTime - nowTime);
                          return aDistance - bDistance;
                        }

                        // PRIORITY 3: Recently finished matches, sorted by recency (most recent first)
                        if (aFinished && !bFinished) return 1;
                        if (!aFinished && bFinished) return -1;

                        if (aFinished && bFinished) {
                          // For finished matches, prioritize the most recently finished
                          // (those closest to current time but in the past)
                          const aDistance = Math.abs(nowTime - aTime);
                          const bDistance = Math.abs(nowTime - bTime);
                          return aDistance - bDistance;
                        }

                        // DEFAULT: Sort by time proximity to current time
                        const aDistance = Math.abs(aTime - nowTime);
                        const bDistance = Math.abs(bTime - nowTime);
                        return aDistance - bDistance;
                      })
                      .map((match: any) => (
                        <div
                          key={match.fixture.id}
                          className={`match-card-container group ${
                            halftimeFlashMatches.has(match.fixture.id) ? 'halftime-flash' : ''
                          } ${
                            fulltimeFlashMatches.has(match.fixture.id) ? 'fulltime-flash' : ''
                          }`}
                          onClick={() => onMatchCardClick?.(match)}
                          style={{
                            cursor: onMatchCardClick ? "pointer" : "default",
                          }}
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

                          {/* Three-grid layout container */}
                          <div className="match-three-grid-container">
                            {/* Top Grid: Match Status */}
                            <div className="match-status-top">
                              {(() => {
                                const status = match.fixture.status.short;
                                const elapsed = match.fixture.status.elapsed;

                                // Live matches status - use API data as-is
                                if (
                                  [
                                    "LIVE",
                                    "LIV",
                                    "1H",
                                    "HT",
                                    "2H",
                                    "ET",
                                    "BT",
                                    "P",
                                    "INT",
                                  ].includes(status)
                                ) {
                                  let displayText = "";

                                  if (status === "HT") {
                                    displayText = "Halftime";
                                  } else if (status === "P") {
                                    displayText = "Penalties";
                                  } else if (status === "ET") {
                                    displayText = elapsed
                                      ? `${elapsed}' ET`
                                      : "Extra Time";
                                  } else if (status === "BT") {
                                    displayText = "Break Time";
                                  } else if (status === "INT") {
                                    displayText = "Interrupted";
                                  } else {
                                    // For LIVE, LIV, 1H, 2H - use API elapsed time
                                    displayText = elapsed ? `${elapsed}'` : "LIVE";
                                  }

                                  return (
                                    <div className="match-status-label status-live">
                                      {displayText}
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
                                  return (
                                    <div className="match-status-label status-ended">
                                      {status === "FT"
                                        ? "Ended"
                                        : status === "AET"
                                          ? "Ended (AET)"
                                          : status === "PEN"
                                            ? "Ended (Penalties)"
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
                                  );
                                }

                                // Postponed matches status
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
                                    <div className="match-status-label status-postponed">
                                      {statusText}
                                    </div>
                                  );
                                }

                                // Upcoming matches (TBD status)
                                if (status === "TBD") {
                                  return (
                                    <div className="match-status-label status-upcoming">
                                      Time TBD
                                    </div>
                                  );
                                }

                                // Default - no status display for regular upcoming matches
                                return null;
                              })()}
                            </div>

                            {/* Middle Grid: Main match content */}
                            <div className="match-content-container">
                              {/* Home Team Name - positioned further left */}
                              <div
                                className={`home-team-name ${
                                  match.goals.home !== null &&
                                  match.goals.away !== null &&
                                  match.goals.home > match.goals.away
                                    ? "winner"
                                    : ""
                                }`}
                              >
                                {shortenTeamName(match.teams.home.name) ||
                                  "Unknown Team"}
                              </div>

                              {/* Home team logo - grid area */}
                              <div className="home-team-logo-container">
                                <MyWorldTeamLogo
                                  teamName={match.teams.home.name}
                                  teamLogo={
                                    match.teams.home.id
                                      ? `/api/team-logo/square/${match.teams.home.id}?size=32`
                                      : "/assets/fallback-logo.svg"
                                  }
                                  alt={match.teams.home.name}
                                  size="34px"
                                  className="popular-leagues-size"
                                  leagueContext={{
                                    name: leagueData.league.name,
                                    country: leagueData.league.country,
                                  }}
                                />
                              </div>

                              {/* Score/Time Center - Fixed width and centered */}
                              <div className="match-score-container">
                                {(() => {
                                  const status = match.fixture.status.short;
                                  const fixtureDate = parseISO(
                                    match.fixture.date,
                                  );

                                  // Live matches - show score only
                                  if (
                                    [
                                      "LIVE",
                                      "LIV",
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
                                    );
                                  }

                                  // All finished match statuses - show score only
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
                                      );
                                    } else {
                                      // Match is finished but no valid score data
                                      return (
                                        <div
                                          className="match-time-display"
                                          style={{ fontSize: "0.882em" }}
                                        >
                                          {format(fixtureDate, "HH:mm")}
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
                                    return (
                                      <div
                                        className="match-time-display"
                                        style={{ fontSize: "0.882em" }}
                                      >
                                        {format(fixtureDate, "HH:mm")}
                                      </div>
                                    );
                                  }

                                  // Upcoming matches (NS = Not Started, TBD = To Be Determined)
                                  return (
                                    <div
                                      className="match-time-display"
                                      style={{ fontSize: "0.882em" }}
                                    >
                                      {status === "TBD"
                                        ? "TBD"
                                        : format(fixtureDate, "HH:mm")}
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Away team logo - grid area */}
                              <div className="away-team-logo-container">
                                <MyWorldTeamLogo
                                  teamName={match.teams.away.name}
                                  teamLogo={
                                    match.teams.away.id
                                      ? `/api/team-logo/square/${match.teams.away.id}?size=32`
                                      : "/assets/fallback-logo.svg"
                                  }
                                  alt={match.teams.away.name}
                                  size="34px"
                                  className="popular-leagues-size"
                                  leagueContext={{
                                    name: leagueData.league.name,
                                    country: leagueData.league.country,
                                  }}
                                />
                              </div>

                              {/* Away Team Name - positioned further right */}
                              <div
                                className={`away-team-name ${
                                  match.goals.home !== null &&
                                  match.goals.away !== null &&
                                  match.goals.away > match.goals.home
                                    ? "winner"
                                    : ""
                                }`}
                              >
                                {shortenTeamName(match.teams.away.name) ||
                                  "Unknown Team"}
                              </div>
                            </div>

                            {/* Bottom Grid: Penalty Result Status */}
                            <div className="match-penalty-bottom">
                              {(() => {
                                const status = match.fixture.status.short;
                                const isPenaltyMatch = status === "PEN";
                                const penaltyHome = match.score?.penalty?.home;
                                const penaltyAway = match.score?.penalty?.away;
                                const hasPenaltyScores =
                                  penaltyHome !== null &&
                                  penaltyHome !== undefined &&
                                  penaltyAway !== null &&
                                  penaltyAway !== undefined;

                                if (isPenaltyMatch && hasPenaltyScores) {
                                  const winnerText =
                                    penaltyHome > penaltyAway
                                      ? `${shortenTeamName(match.teams.home.name)} won ${penaltyHome}-${penaltyAway} on penalties`
                                      : `${shortenTeamName(match.teams.away.name)} won ${penaltyAway}-${penaltyHome} on penalties`;

                                  return (
                                    <div className="penalty-result-display">
                                      <span className="penalty-winner">
                                        {winnerText}
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </div>
                      ))}
            </div>
          </Card>
        );
      })}
    </>
  );
};

export default TodayPopularFootballLeaguesNew;