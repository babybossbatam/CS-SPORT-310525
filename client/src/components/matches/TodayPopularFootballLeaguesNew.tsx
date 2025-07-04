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
// Removed cached query system for live match updates
import { getCurrentUTCDateString } from "@/lib/dateUtilsUpdated";
import { POPULAR_LEAGUES } from "@/lib/constants";
import {
  DEFAULT_POPULAR_TEAMS,
  DEFAULT_POPULAR_LEAGUES,
  POPULAR_COUNTRIES,
  isLiveMatch,
  isEndedMatch,
  isUpcomingMatch,
} from "@/lib/matchFilters";
import { CURRENT_POPULAR_LEAGUES } from "../leagues/PopularLeaguesList";
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
import { smartFetch, fetchLeagueFixtures } from '@/lib/MyFetchingLogic';

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
  const [goalFlashMatches, setGoalFlashMatches] = useState<Set<number>>(new Set());
  const [previousMatchScores, setPreviousMatchScores] = useState<Map<number, {home: number, away: number}>>(new Map());

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

  // Extract league IDs from the popular leagues list component
  const POPULAR_LEAGUE_IDS = [...CURRENT_POPULAR_LEAGUES.map(league => league.id), 667]; // Add Friendlies Clubs

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
    Brazil: [71, 72, 73], // Serie A, Serie B, Copa do Brasil
    Colombia: [239, 240], // Primera A, Copa Colombia
    "Saudi Arabia": [307], // Pro League
    USA: [253, 254], // MLS, MLS Cup
    "United States": [253, 254], // MLS, MLS Cup
    US: [253, 254], // MLS, MLS Cup
    // International competitions
    World: [1, 2, 3, 4, 5, 15, 16, 17, 914, 38], // Champions League, Europa, Conference, World Cup, FIFA Club World Cup, CONCACAF Gold Cup, COSAFA Cup, World Cup Qualification
    Europe: [1, 2, 3, 4, 5, 848], // UEFA competitions
    International: [15, 16, 17], // FIFA competitions
  };

  // Use popular leagues from PopularLeaguesList component as primary source
  const POPULAR_LEAGUES = POPULAR_LEAGUE_IDS;

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

  // Direct API calls without caching for live updates

  // Use direct API calls like MyNewLeague for live data, cached for static data
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const fetchFixtures = async () => {
      setIsLoading(true);
      setIsFetching(true);

      try {
        console.log(
          `🔄 [TodayPopularLeagueNew] Fetching fresh data for date: ${selectedDate}`,
        );

        // For live matches, fetch directly without caching
        // const response = await apiRequest(
        //   "GET",
        //   `/api/fixtures/date/${selectedDate}?all=true`,
        // );
        // const data = await response.json();

        // console.log(
        //   `✅ [TodayPopularLeagueNew] Received ${data?.length || 0} fixtures for ${selectedDate}`,
        // );

        // setFixtures(data || []);
      } catch (error) {
        console.error('Error fetching fixtures:', error);
        setFixtures([]);
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    };

    if (selectedDate && enableFetching) {
      //fetchFixtures();
    }
  }, [selectedDate, enableFetching]);

  // Auto-refresh for live matches every 30 seconds like MyNewLeague
  useEffect(() => {
    const hasLiveMatches = fixtures.some(fixture => 
      ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(fixture.fixture?.status?.short)
    );

    if (!hasLiveMatches || !selectedDate || !enableFetching) return;

    const interval = setInterval(async () => {
      console.log('🔄 [TodayPopularLeagueNew] Auto-refreshing for live matches');
      setIsFetching(true);

      try {
        // const response = await apiRequest(
        //   "GET",
        //   `/api/fixtures/date/${selectedDate}?all=true`,
        // );
        // const data = await response.json();
        // setFixtures(data || []);
      } catch (error) {
        console.error('Error auto-refreshing fixtures:', error);
      } finally {
        setIsFetching(false);
      }
    }, 30000); // 30 seconds like MyNewLeague

    return () => clearInterval(interval);
  }, [fixtures, selectedDate, enableFetching]);

  // Simple fixture processing like MyNewLeague
  const processedFixtures = useMemo(() => {
    console.log(`🎯 [TodayPopularLeagueNew] Processing ${fixtures.length} fixtures`);
    return fixtures;
  }, [fixtures]);

  // Use the prioritized popular countries list
  const POPULAR_COUNTRIES = POPULAR_COUNTRIES_ORDER;

  // Smart filtering operations with intelligent data source selection
  const filteredFixtures = useMemo(() => {
    if (!processedFixtures?.length) return [];

    console.log(
      `🔍 [FILTER DEBUG] Processing ${processedFixtures.length} fixtures for date: ${selectedDate} with timezone-aware filtering`,
    );

    // Debug a few sample fixtures to show timezone conversion
    if (processedFixtures.length > 0) {
      const sampleFixtures = processedFixtures.slice(0, 3);
      sampleFixtures.forEach(fixture => {
        SimpleDateFilter.debugTimezoneConversion(fixture.fixture.date, selectedDate);
      });
    }

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

      // Check if it's a popular league from our curated list
      const isPopularLeague = POPULAR_LEAGUE_IDS.includes(leagueId);

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

      // Apply exclusion check FIRST, but skip for key international competitions
      const leagueName = fixture.league?.name?.toLowerCase() || "";
      const homeTeamName = fixture.teams?.home?.name?.toLowerCase() || "";
      const awayTeamName = fixture.teams?.away?.name?.toLowerCase() || "";

      // Check if this is a key international competition that should never be excluded
      const isKeyInternationalCompetition = [1, 2, 3, 4, 5, 15, 16, 17, 914, 38, 848].includes(leagueId);

      // Early exclusion for women's competitions and other unwanted matches (but skip key international competitions)
      const shouldExclude = !isKeyInternationalCompetition && shouldExcludeFromPopularLeagues(
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
            isKeyInternationalCompetition,
            shouldExclude,
            homeTeam: fixture.teams?.home?.name,
            awayTeam: fixture.teams?.away?.name,
            exclusionReason: shouldExclude
              ? "Contains exclusion terms"
              : isKeyInternationalCompetition 
                ? "Key international competition - bypassed exclusion"
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
        // Direct league ID check for international competitions
        [1, 2, 3, 4, 5, 15, 16, 17, 914, 38, 848].includes(leagueId) ||
        // UEFA competitions (but women's already excluded above)
        leagueName.includes("champions league") ||
        leagueName.includes("europa league") ||
        leagueName.includes("conference league") ||
        leagueName.includes("uefa") ||
        leagueName.includes("euro u21") ||
        leagueName.includes("uefa u21") ||
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

      // Check for international competitions first - use direct league ID check
      const isInternationalCompetition =
        // Direct league ID check for key international competitions
        [1, 2, 3, 4, 5, 15, 16, 17, 914, 38, 848].includes(leagueId) ||
        // UEFA competitions
        leagueNameLower.includes("champions league") ||
        leagueNameLower.includes("europa league") ||
        leagueNameLower.includes("conference league") ||
        leagueNameLower.includes("uefa") ||
        leagueNameLower.includes("euro") ||
        leagueNameLower.includes("euro u21") ||
        leagueNameLower.includes("uefa u21") ||
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
        console.log(`🌍 [INTERNATIONAL DEBUG] Allowing international competition: League ${leagueId} - ${fixture.league.name}`);
        return true;
      }

      // Always include leagues from our popular leagues list
      if (POPULAR_LEAGUE_IDS.includes(leagueId)) {
        console.log(`✅ [POPULAR LEAGUE] Including popular league: ${fixture.league.name} (ID: ${leagueId})`);
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

    // Debug: Check final result for target leagues INCLUDING Serie D (75)
    const targetLeaguesInFinal = [38, 15, 16, 914, 75];
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
              // Show actual dates for Serie D fixtures
              actualDates: leagueId === 75 ? originalLeagueFixtures.slice(0, 5).map(f => ({
                date: f.fixture?.date,
                home: f.teams?.home?.name,
                away: f.teams?.away?.name,
                localDate: f.fixture?.date ? f.fixture.date.split('T')[0] : 'Invalid'
              })) : undefined
            },
          );
        }
      }
    });

    // Special debugging for Serie D - show what dates their fixtures are actually on
    const serieDFixtures = processedFixtures.filter((f) => f.league?.id === 75);
    if (serieDFixtures.length > 0) {
      const serieDDates = serieDFixtures.map(f => ({
        fixtureDate: f.fixture?.date,
        localDate: f.fixture?.date ? f.fixture.date.split('T')[0] : 'Invalid',
        home: f.teams?.home?.name,
        away: f.teams?.away?.name,
        status: f.fixture?.status?.short
      }));

      // Group by date
      const dateGroups = serieDDates.reduce((acc: any, fixture) => {
        const date = fixture.localDate;
        if (!acc[date]) acc[date] = [];
        acc[date].push(fixture);
        return acc;
      }, {});

      console.log(`🏆 [SERIE D DEBUG] Serie D fixtures grouped by date:`, {
        selectedDate,
        totalFixtures: serieDFixtures.length,
        dateGroups: Object.keys(dateGroups).sort().reduce((acc: any, date) => {
          acc[date] = dateGroups[date].length;
          return acc;
        }, {}),
        sampleFixturesPerDate: Object.keys(dateGroups).sort().slice(0, 3).reduce((acc: any, date) => {
          acc[date] = dateGroups[date].slice(0, 2);
          return acc;
        }, {})
      });
    }

    return finalFiltered;
  }, [processedFixtures, selectedDate]);

  // Group fixtures by country and league, with special handling for Friendlies
  const fixturesByCountry = filteredFixtures.reduce(
    (acc: any, fixture: any) => {
      // Add comprehensive null checks
      if (!fixture || !fixture.league || !fixture.fixture|| !fixture.teams) {
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
      const leagueName = league.name?.toLowerCase() || "";
      const homeTeamName = fixture.teams?.home?.name || "";
      const awayTeamName = fixture.teams?.away?.name || "";

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

      // Check if fixture should be excluded using popular league specialized filter
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

      // Handle fixtures with null/undefined country
      if (!country || typeof country !== "string" || country.trim() === "") {
        console.warn(`[COUNTRY DEBUG] Skipping fixture with missing country data:`, {
          leagueName: league.name,
          leagueId: league.id,
          originalCountry: country,
          homeTeam: fixture.teams?.home?.name,
          awayTeam: fixture.teams?.away?.name,
          selectedDate: selectedDate,
        });
        return acc;
      }

      const validCountry = country.trim();

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
      const isGloballyPopular = POPULAR_LEAGUE_IDS.includes(leagueId);

      // Mark country as having popular leagues if any league qualifies
      if (isPopularForCountry || isGloballyPopular) {
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
          isPopular: isPopularForCountry || isGloballyPopular,
          isPopularForCountry: isPopularForCountry,
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

  // Time filtering is now just for additional time-based sorting when active
  const timeFilteredCountries = useMemo(() => {
    // Smart filtering is already applied in filteredFixtures, so just return sorted countries
    // timeFilterActive now only affects sorting/prioritization, not inclusion/exclusion
    return sortedCountries;
  }, [sortedCountries]);

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

  // Real-time timer for live match updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Enhanced effect to detect status and score changes with flash effects - matches MyNewLeague implementation
  useEffect(() => {
    if (!fixtures?.length) return;

    const newHalftimeMatches = new Set<number>();
    const newFulltimeMatches = new Set<number>();
    const newGoalMatches = new Set<number>();
    const currentStatuses = new Map<number, string>();
    const currentScores = new Map<number, {home: number, away: number}>();

    fixtures.forEach((fixture) => {
      const matchId = fixture.fixture.id;
      const currentStatus = fixture.fixture.status.short;
      const previousStatus = previousMatchStatuses.get(matchId);
      const currentScore = {
        home: fixture.goals.home ?? 0,
        away: fixture.goals.away ?? 0
      };
      const previousScore = previousMatchScores.get(matchId);

      currentStatuses.set(matchId, currentStatus);
      currentScores.set(matchId, currentScore);

      // Only check for changes if we have a previous status (not on first load)
      if (previousStatus && previousStatus !== currentStatus) {
        console.log(`🔄 [TodayPopularLeagueNew STATUS TRANSITION] Match ${matchId}:`, {
          teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          transition: `${previousStatus} → ${currentStatus}`,
          time: new Date().toLocaleTimeString()
        });

        // Check if status just changed to halftime
        if (currentStatus === 'HT') {
          console.log(`🟠 [TodayPopularLeagueNew HALFTIME FLASH] Match ${matchId} just went to halftime!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousStatus,
            currentStatus
          });
          newHalftimeMatches.add(matchId);
        }

        // Check if status just changed to fulltime
        if (currentStatus === 'FT') {
          console.log(`🔵 [TodayPopularLeagueNew FULLTIME FLASH] Match ${matchId} just finished!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousStatus,
            currentStatus
          });
          newFulltimeMatches.add(matchId);
        }

        // Detect transition from upcoming to live
        const wasUpcoming = ['NS', 'TBD'].includes(previousStatus);
        const isNowLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(currentStatus);

        if (wasUpcoming && isNowLive) {
          console.log(`🟢 [TodayPopularLeagueNew MATCH STARTED] Match ${matchId} started!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousStatus,
            currentStatus
          });
        }

        // Detect transition from live to ended
        const wasLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(previousStatus);
        const isNowEnded = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(currentStatus);

        if (wasLive && isNowEnded) {
          console.log(`🏁 [TodayPopularLeagueNew MATCH ENDED] Match ${matchId} ended!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            finalScore: `${currentScore.home}-${currentScore.away}`,
            previousStatus,
            currentStatus
          });
        }
      }

      // Check for goal changes during live matches
      if (previousScore && 
          (currentScore.home !== previousScore.home || currentScore.away !== previousScore.away) &&
          ['1H', '2H', 'LIVE', 'LIV'].includes(currentStatus)) {
        console.log(`⚽ [TodayPopularLeagueNew GOAL FLASH] Match ${matchId} score changed!`, {
          home: fixture.teams?.home?.name,
          away: fixture.teams?.away?.name,
          previousScore,
          currentScore,
          status: currentStatus
        });
        newGoalMatches.add(matchId);
      }
    });

    // Update previous statuses and scores AFTER checking for changes
    setPreviousMatchStatuses(currentStatuses);
    setPreviousMatchScores(currentScores);

    // Trigger flash for new halftime matches
    if (newHalftimeMatches.size > 0) {
      setHalftimeFlashMatches(newHalftimeMatches);

      // Remove flash after 3 seconds (increased duration)
      setTimeout(() => {
        setHalftimeFlashMatches(new Set());
      }, 3000);
    }

    // Trigger flash for new fulltime matches
    if (newFulltimeMatches.size > 0) {
      setFulltimeFlashMatches(newFulltimeMatches);

      // Remove flash after 3 seconds (increased duration)
      setTimeout(() => {
        setFulltimeFlashMatches(new Set());
      }, 3000);
    }

    // Trigger flash for new goal matches
    if (newGoalMatches.size > 0) {
      setGoalFlashMatches(newGoalMatches);

      // Remove flash after 2 seconds for goals
      setTimeout(() => {
        setGoalFlashMatches(new Set());
      }, 2000);
    }
  }, [fixtures]);



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

  // Show loading only if we're actually loading and don't have any data
  const showLoading = isLoading && !fixtures.length;

  const { data: allFixtures = [], isLoading, isFetching, error } = useQuery({
    queryKey: ['smart-fetch-popular-leagues', selectedDate],
    queryFn: async () => {
      console.log(`🔄 [TodayPopularLeagueNew] Smart fetching fixtures for ${selectedDate}`);

      // Use smart fetch for intelligent caching and live match handling
      const fixtures = await smartFetch(selectedDate, {
        source: 'TodayPopularLeagueNew',
        forceRefresh: isToday(new Date(selectedDate)) // Force refresh for today's matches
      });

      console.log(`✅ [TodayPopularLeagueNew] Smart fetched ${fixtures.length} fixtures for ${selectedDate}`);
      return fixtures;
    },
    staleTime: isToday(new Date(selectedDate)) ? 1 * 60 * 1000 : 5 * 60 * 1000, // 1 min for today, 5 min for other dates
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: isToday(new Date(selectedDate)), // Only refetch on focus for today
    retry: 1,
  });

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
    return null; // Let parent component handle empty state
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
      {/* Create individual league cards from all countries */}

      {top20FilteredCountries.flatMap(
        (countryData: any, countryIndex: number) =>
          Object.values(countryData.leagues)
            .sort((a: any, b: any) => {
              // Debug: Log all World leagues before sorting
              if (countryData.country === "World") {
                console.log(
                  `🌍 [WORLD DEBUG] All World leagues before sorting:`,
                  Object.values(countryData.leagues).map((league: any) => ({
                    id: league.league?.id,
                    name: league.league?.name,
                    isFriendlies: league.isFriendlies,
                    matchCount: league.matches?.length,
                  })),
                );
              }

              // Check for UEFA Nations League - Women first (lowest priority)
              const aIsWomensNationsLeague =
                a.league.name?.toLowerCase().includes("uefa nations league") &&
                a.league.name?.toLowerCase().includes("women");
              const bIsWomensNationsLeague =
                b.league.name?.toLowerCase().includes("uefa nations league") &&
                b.league.name?.toLowerCase().includes("women");

              if (aIsWomensNationsLeague && !bIsWomensNationsLeague) return 1; // a goes to bottom
              if (!aIsWomensNationsLeague && bIsWomensNationsLeague) return -1; // b goes to bottom
              if (aIsWomensNationsLeague && bIsWomensNationsLeague) return 0; // both same priority

              // Prioritize leagues that are popular for this specific country
              if (a.isPopularForCountry && !b.isPopularForCountry) return -1;
              if (!a.isPopularForCountry && b.isPopularForCountry) return 1;

              // Then globally popular leagues
              if (a.isPopular && !b.isPopular) return -1;
              if (!a.isPopular && b.isPopular) return 1;

              // Custom sorting for World leagues
              if (countryData.country === "World") {
                console.log(`🌍 [WORLD SORTING DEBUG] Sorting World leagues:`, {
                  leagueA: {
                    name: a.league?.name,
                    isFriendlies: a.isFriendlies,
                    matchCount: a.matches?.length,
                  },
                  leagueB: {
                    name: b.league?.name,
                    isFriendlies: b.isFriendlies,
                    matchCount: b.matches?.length,
                  },
                });

                const getWorldLeaguePriority = (leagueData: any) => {
                  const name = (leagueData.league?.name || "").toLowerCase();
                  // Check if it's marked as friendlies or contains friendlies in name
                  const isFriendlies =
                    leagueData.isFriendlies || name.includes("friendlies");

                  console.log(
                    `🔍 [PRIORITY CHECK] League: "${leagueData.league?.name}"`,
                    {
                      nameToLower: name,
                      isFriendlies,
                      leagueDataIsFriendlies: leagueData.isFriendlies,
                      nameIncludesFriendlies: name.includes("friendlies"),
                      nameIncludesUefaNationsLeague: name.includes(
                        "uefa nations league",
                      ),
                      exactNameMatch: name === "uefa nations league",
                    },
                  );

                  // Priority 1: FIFA Club World Cup (HIGHEST PRIORITY - moved to top)
                  if (
                    name.includes("fifa club world cup") ||
                    name.includes("club world cup")
                  ) {
                    console.log(
                      `✅ [PRIORITY 1] FIFA Club World Cup found: "${leagueData.league?.name}" - TOP PRIORITY`,
                    );
                    return 1;
                  }

                  // Priority 2: UEFA Nations League
                  if (
                    name.includes("uefa nations league") &&
                    !name.includes("women")
                  ) {
                    console.log(
                      `✅ [PRIORITY 2] UEFA Nations League found: "${leagueData.league?.name}"`,
                    );
                    return 2;
                  }

                  // Priority 3: World Cup Qualification South America
                  if (
                    name.includes("world cup") &&
                    name.includes("qualification") &&
                    name.includes("south america")
                  ) {
                    console.log(
                      `✅ [PRIORITY 3] World Cup Qualification South America found: "${leagueData.league?.name}"`,
                    );
                    return 3;
                  }

                  // Priority 4: World Cup Qualification Europe
                  if (
                    name.includes("world cup") &&
                    name.includes("qualification") &&
                    name.includes("europe")
                  ) {
                    console.log(
                      `✅ [PRIORITY 4] World Cup Qualification Europe found: "${leagueData.league?.name}"`,
                    );
                    return 4;
                  }

                  // Priority 5: Friendlies (but exclude UEFA Nations League and women's matches)
                  if (
                    isFriendlies &&
                    !name.includes("uefa nations league") &&
                    !name.includes("women")
                  ) {
                    console.log(
                      `✅ [PRIORITY 5] Friendlies found: "${leagueData.league?.name}"`,
                    );
                    return 5;
                  }

                  // Priority 6: World Cup Qualification Asia
                  if (
                    name.includes("world cup") &&
                    name.includes("qualification") &&
                    name.includes("asia")
                  ) {
                    console.log(
                      `✅ [PRIORITY 6] World Cup Qualification Asia found: "${leagueData.league?.name}"`,
                    );
                    return 6;
                  }

                  // Priority 7: World Cup Qualification CONCACAF
                  if (
                    name.includes("world cup") &&
                    name.includes("qualification") &&
                    name.includes("concacaf")
                  ) {
                    console.log(
                      `✅ [PRIORITY 7] World Cup Qualification CONCACAF found: "${leagueData.league?.name}"`,
                    );
                    return 7;
                  }

                  // Priority 8: Tournoi Maurice Revello
                  if (name.includes("tournoi maurice revello")) {
                    console.log(
                      `✅ [PRIORITY 8] Tournoi Maurice Revello found: "${leagueData.league?.name}"`,
                    );
                    return 8;
                  }

                  console.log(
                    `❌ [PRIORITY 999] No priority match for: "${leagueData.league?.name}"`,
                  );
                  return 999; // Other leagues go to bottom
                };

                const aPriority = getWorldLeaguePriority(a);
                const bPriority = getWorldLeaguePriority(b);

                console.log(`🎯 [FINAL PRIORITY] Comparison result:`, {
                  leagueA: a.league?.name,
                  priorityA: aPriority,
                  leagueB: b.league?.name,
                  priorityB: bPriority,
                  sortResult: aPriority - bPriority,
                });

                if (aPriority !== bPriority) {
                  return aPriority - bPriority;
                }

                // If same priority, sort alphabetically by league name
                const aName = a.league?.name || "";
                const bName = b.league?.name || "";
                console.log(
                  `📝 [ALPHABETICAL] Same priority, sorting alphabetically:`,
                  {
                    aName,
                    bName,
                    result: aName.localeCompare(bName),
                  },
                );
                return aName.localeCompare(bName);
              }

              // For non-World countries, no additional sorting after popularity checks
              return 0;
            })
            .map((leagueData: any, leagueIndex: number) => {
              const isFirstCard = countryIndex === 0 && leagueIndex === 0;
              return (
                <Card
                  key={`${countryData.country}-${leagueData.league.id}`}
                  className="border bg-card text-card-foreground shadow-md overflow-visible league-card-spacing min-h-[120px]"
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
                        onLoad={() => {
                          // Debug Venezuela specifically
                          if (leagueData.league.country === "Venezuela") {
                            console.log(`🇻🇪 Venezuela league detected:`, {
                              country: leagueData.league.country,
                              leagueName: leagueData.league.name,
                              logo: leagueData.league.logo,
                              flag: countryData.flag,
                              expectedVenezuelaFlag:
                                "https://flagcdn.com/w40/ve.png",
                              flagFromSync:
                                getCountryFlagWithFallbackSync("Venezuela"),
                              flagCacheKey: `flag_venezuela`,
                              countryCodeMapping: "VE", // Should be VE for Venezuela
                            });

                            // Check if Venezuela flag is wrong (Colombia flag)
                            if (
                              countryData.flag &&
                              (countryData.flag.includes("/co.png") ||
                                countryData.flag.includes("/co."))
                            ) {
                              console.log(
                                `🚨 Venezuela flag cache corruption detected! Using Colombia flag: ${countryData.flag}`,
                              );
                              console.log(
                                `🔧 Attempting to clear and refresh Venezuela flag...`,
                              );

                              // Clear the corrupted cache and force refresh
                              clearVenezuelaFlagCache();

                              // Force refresh the flag asynchronously
                              forceRefreshVenezuelaFlag()
                                .then((newFlag) => {
                                  console.log(
                                    `✅ Venezuelaflag refreshed to: ${newFlag}`,
                                  );
                                  //                                  // Trigger a re-render ifneeded
                                  window.location.reload();
                                })
                                .catch((error) => {
                                  console.error(
                                    `❌ Failed to refresh Venezuela flag:`,
                                    error,
                                  );
                                });
                            }

                            // Force correct Venezuela flag if wrong
                            if (
                              !countryData.flag.includes("/ve.png") &&
                              !countryData.flag.includes("/ve.")
                            ) {
                              console.log(
                                `🔧 Forcing correct Venezuela flag...`,
                              );
                              const correctFlag =
                                "https://flagcdn.com/w40/ve.png";
                              console.log(
                                `🇻🇪 Setting Venezuela flag to: ${correctFlag}`,
                              );
                              // Force update the flag in the data
                              countryData.flag = correctFlag;
                            }

                            // Check if Venezuela flag is cached incorrectly
                            const debugCountryFlagMapping = (
                              country: string,
                            ) => {
                              console.log(
                                `🔍 Venezuela Debug - Flag mapping for: "${country}"`,
                              );
                              console.log(
                                `🔍 Venezuela Debug - Country code: VE`,
                              );
                              console.log(
                                `🔍 Venezuela Debug - Expected URL: https://flagcdn.com/w40/ve.png`,
                              );
                              console.log(
                                `🔍 Venezuela Debug - Current flag from countryData: ${countryData.flag}`,
                              );
                            };
                            debugCountryFlagMapping("Venezuela");
                          }
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
                        {leagueData.isPopular &&
                          !leagueData.isPopularForCountry && (
                            <span
                              className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium"
                              style={{ fontSize: "calc(0.75rem * 0.85)" }}
                            >
                              Popular
                            </span>
                          )}
                      </div>
                    </CardContent>
                  )}
                  {/* Matches - Show for all leagues */}

                  <div className="match-cards-wrapper min-h-[80px] overflow-visible">
                    {leagueData.matches
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
                      .map((match: any) => {
                        const matchId = match.fixture.id;
                        const isHalftimeFlash = halftimeFlashMatches.has(matchId);
                        const isFulltimeFlash = fulltimeFlashMatches.has(matchId);
                        const isGoalFlash = goalFlashMatches.has(matchId);
                        const isStarred = starredMatches.has(matchId);

                        return (
                          <div
                            key={match.fixture.id}
                            className={`match-card-container group ${
                              isHalftimeFlash ? 'halftime-flash' : ''
                            } ${
                              isFulltimeFlash ? 'fulltime-flash' : ''
                            } ${
                              isGoalFlash ? 'goal-flash' : ''
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
                                className={`match-star-icon ${isStarred ? "starred" : ""}`}
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
                                      // For LIVE, LIV, 1H, 2H - use API elapsed time, ensure it's current
                                      displayText = elapsed && elapsed > 0 ? `${elapsed}'` : "LIVE";
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
                        );
                      })}
                  </div>
                </Card>
              );
            }),
      )}
    </>
  );
};

export default TodayPopularFootballLeaguesNew;