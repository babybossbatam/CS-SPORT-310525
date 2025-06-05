import React, { useState, useMemo, useEffect, useCallback, memo } from "react";
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
import { useCachedTeamLogo } from "../../lib/MyAPIFallback";
import { isNationalTeam } from "../../lib/teamLogoSources";
import { createFallbackHandler } from "../../lib/MyAPIFallback";
import { MyFallbackAPI } from "../../lib/MyFallbackAPI";
import {
  DEFAULT_POPULAR_TEAMS,
  DEFAULT_POPULAR_LEAGUES,
  POPULAR_COUNTRIES,
  isLiveMatch,
} from "@/lib/matchFilters";
import { getCountryFlagWithFallbackSync } from "../../lib/flagUtils";
import { SimpleDateFilter } from "../../lib/simpleDateFilter";
import "../../styles/MyLogoPositioning.css";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";
import { LazyLoader } from '@/components/common/LazyLoader';

// Helper function to shorten team names
const shortenTeamName = (teamName: string): string => {
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
    International: [15], // FIFA Club World Cup as separate category
    World: [914, 848, 15], // COSAFA Cup, UEFA Conference League, FIFA Club World Cup
  };

  // Flatten popular leagues for backward compatibility and add COSAFA Cup
  const POPULAR_LEAGUES = [
    ...Object.values(POPULAR_LEAGUES_BY_COUNTRY).flat(),
    914,
  ]; // 914 is COSAFA Cup

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

  // Smart filtering operations
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length) return [];

    console.log(
      `🔍 [TOMORROW DEBUG] Processing ${fixtures.length} fixtures for date: ${selectedDate}`,
    );

    // Count COSAFA Cup matches in input
    const cosafaMatches = fixtures.filter(
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

    const filtered = fixtures.filter((fixture) => {
      // Apply smart time filtering with selected date context
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        const smartResult = MySmartTimeFilter.getSmartTimeLabel(
          fixture.fixture.date,
          fixture.fixture.status.short,
          selectedDate + "T12:00:00Z", // Pass selected date as context
        );

        // Check if this match should be included based on the selected date
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

        if (!shouldInclude) {
          console.log(
            `❌ [SMART FILTER] Match excluded: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
            {
              fixtureDate: fixture.fixture.date,
              status: fixture.fixture.status.short,
              reason: smartResult.reason,
              label: smartResult.label,
              selectedDate,
              isWithinTimeRange: smartResult.isWithinTimeRange,
            },
          );
          return false;
        }

        // Additional debug for COSAFA Cup matches
        const isCOSAFAMatch =
          fixture.league?.name?.toLowerCase().includes("cosafa") ||
          fixture.teams?.home?.name?.toLowerCase().includes("cosafa") ||
          fixture.teams?.away?.name?.toLowerCase().includes("cosafa");

        if (isCOSAFAMatch) {
          console.log(
            `🏆 [COSAFA SMART FILTER] Match included: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
            {
              fixtureId: fixture.fixture?.id,
              fixtureDate: fixture.fixture.date,
              status: fixture.fixture.status.short,
              reason: smartResult.reason,
              label: smartResult.label,
              selectedDate,
              isWithinTimeRange: smartResult.isWithinTimeRange,
              league: fixture.league?.name,
            },
          );
        } else {
          console.log(
            `✅ [SMART FILTER] Match included: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
            {
              fixtureDate: fixture.fixture.date,
              status: fixture.fixture.status.short,
              reason: smartResult.reason,
              label: smartResult.label,
              selectedDate,
              isWithinTimeRange: smartResult.isWithinTimeRange,
            },
          );
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

      // Apply exclusion check FIRST, before checking international competitions
      const leagueName = fixture.league?.name?.toLowerCase() || "";
      const homeTeamName = fixture.teams?.home?.name?.toLowerCase() || "";
      const awayTeamName = fixture.teams?.away?.name?.toLowerCase() || "";

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
        (leagueName.includes("international") &&
          !leagueName.includes("women")) ||
        country.includes("world") ||
        country.includes("europe") ||
        country.includes("international");

      return (
        isPopularLeague || isFromPopularCountry || isInternationalCompetition
      );
    });

    const finalFiltered = filtered.filter((fixture) => {
      // Apply popular league exclusion filters
      if (
        shouldExcludeFromPopularLeagues(
          fixture.league.name,
          fixture.teams.home.name,
          fixture.teams.away.name,
          fixture.league.country,
        )
      ) {
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
      `🔍 [TOMORROW DEBUG] Filtered ${fixtures.length} fixtures to ${finalFiltered.length} in ${endTime - startTime}ms`,
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
        console.log(`🏆 [UEFA/FIFA DEBUG] Found:`, {
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
            // For unrestricted countries (Brazil, Colombia, Saudi Arabia, USA, Europe, South America, World),
            // consider all leagues as "popular" to show them all
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
            const isUnrestrictedCountry =
              unrestrictedCountries.includes(countryKey);

            acc[countryKey].leagues[leagueId] = {
              league: { ...league, country: countryKey },
              matches: [],
              isPopular:
                POPULAR_LEAGUES.includes(leagueId) || isUnrestrictedCountry,
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

      // For unrestricted countries (Brazil, Colombia, Saudi Arabia, USA, UAE, Europe, South America, World),
      // consider all leagues as "popular" to show them all
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
        // For unrestricted countries (Brazil, Colombia, Saudi Arabia, USA, UAE, Europe, South America, World),
        // consider all leagues as "popular" to show them all
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

  const isMatchStarred = (matchId: number) => {
    return starredMatches.has(matchId);
  };

  return (
    <Card className="shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h4 className="text-sm font-semibold tracking-tight">
          Today's Popular Leagues
        </h4>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-xs text-gray-500">{selectedDate}</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading || isFetching ? (
          <div className="flex flex-col space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : top20FilteredCountries.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No popular matches today.
          </div>
        ) : (
          <ul className="space-y-2">
            {top20FilteredCountries.map((countryData: any, index: number) => (
              <li key={index} className="border-b last:border-none">
                <button
                  onClick={() => toggleCountry(countryData.country)}
                  className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    {countryData.flag && (
                      <LazyImage
                        src={countryData.flag}
                        alt={`${countryData.country} Flag`}
                        className="h-6 w-8 object-cover rounded-sm"
                        width={32}
                        height={24}
                        priority={true}
                      />
                    )}
                    <span className="text-sm font-medium">
                      {countryData.country}
                    </span>
                  </div>
                  {expandedCountries.has(countryData.country) ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </button>
                {expandedCountries.has(countryData.country) && (
                  <ul className="space-y-2">
                    {Object.entries(countryData.leagues).map(
                      ([leagueId, leagueData]: any) => (
                        <li key={leagueId} className="border-b last:border-none">
                          <div className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors duration-200">
                            <div className="flex items-center space-x-3">
                              {leagueData.league.logo && (
                                <LazyImage
                                  src={leagueData.league.logo}
                                  alt={`${leagueData.league.name} Logo`}
                                  className="h-5 w-5 object-cover rounded-full"
                                  width={20}
                                  height={20}
                                  priority={true}
                                />
                              )}
                              <span className="text-xs font-medium">
                                {leagueData.league.name}
                              </span>
                            </div>
                          </div>
                          <ul className="space-y-1">
                            {leagueData.matches.map((match: any) => (
                              <LazyMatchItem
                                key={match.fixture.id}
                                match={match}
                                toggleFavoriteTeam={toggleFavoriteTeam}
                                isTeamFavorite={isTeamFavorite}
                                toggleStarMatch={toggleStarMatch}
                                isMatchStarred={isMatchStarred}
                              />
                            ))}
                          </ul>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(TodayPopularFootballLeaguesNew);