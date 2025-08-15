import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Calendar, Activity, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { RootState, userActions } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid, differenceInHours } from "date-fns";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
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
import { isNationalTeam, getTeamLogoSources } from "../../lib/teamLogoSources";
import { SimpleDateFilter } from "../../lib/simpleDateFilter";
import "../../styles/MyLogoPositioning.css";
import "../../styles/TodaysMatchByCountryNew.css";
import "../../styles/flasheffect.css";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";
import NoLiveMatchesEmpty from "./NoLiveMatchesEmpty";

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

interface LiveMatchForAllCountryProps {
  refreshInterval?: number;
  isTimeFilterActive?: boolean;
  liveFilterActive?: boolean;
  timeFilterActive?: boolean;
  liveFixtures?: any[]; // Accept shared live fixtures
  setLiveFilterActive?: (active: boolean) => void;
  onMatchCardClick?: (match: any) => void;
}

const LiveMatchForAllCountry: React.FC<LiveMatchForAllCountryProps> = ({
  refreshInterval = 30000,
  isTimeFilterActive = false,
  liveFilterActive = false,
  timeFilterActive = false,
  liveFixtures: propsFixtures,
  setLiveFilterActive,
  onMatchCardClick,
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(),
  );
  const [enableFetching, setEnableFetching] = useState(true);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(new Set());
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(new Set());
  const [previousMatchStatuses, setPreviousMatchStatuses] = useState<Map<number, string>>(new Map());
  
  const { t } = useTranslation();

  // Popular leagues for prioritization
  const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga

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

  // Fetch all live fixtures with automatic refresh only if not provided via props
  const { data: fetchedFixtures = [], isLoading } = useQuery({
    queryKey: ["live-fixtures-all-countries"],
    queryFn: async () => {
      console.log("Fetching live fixtures for all countries");
      const response = await apiRequest("GET", "/api/fixtures/live");
      const data = await response.json();

      console.log(`Received ${data.length} live fixtures`);

      // Log World competition fixtures for debugging
      const worldFixtures = data.filter((fixture: any) => 
        fixture.league?.country === 'World' || 
        fixture.league?.country === 'Europe' ||
        fixture.league?.name?.toLowerCase().includes('fifa') ||
        fixture.league?.name?.toLowerCase().includes('uefa')
      );

      if (worldFixtures.length > 0) {
        console.log(`🌍 Found ${worldFixtures.length} World competition fixtures:`, 
          worldFixtures.map((f: any) => `${f.league.name}: ${f.teams.home.name} vs ${f.teams.away.name}`)
        );
      }

      return data;
    },
    staleTime: 20000, // 20 seconds for faster World competition updates
    gcTime: 2 * 60 * 1000, // 2 minutes garbage collection time
    enabled: enableFetching && !propsFixtures, // Only fetch if no props data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: refreshInterval, // Auto-refresh every 30 seconds
  });

  // Use props data if available, otherwise use fetched data
  const fixtures = propsFixtures || fetchedFixtures;

  // Effect to detect halftime and fulltime status changes
  useEffect(() => {
    if (!fixtures?.length) return;

    const newHalftimeMatches = new Set<number>();
    const newFulltimeMatches = new Set<number>();
    const currentStatuses = new Map<number, string>();

    fixtures.forEach((fixture) => {
      const matchId = fixture.fixture.id;
      const currentStatus = fixture.fixture.status.short;
      const previousStatus = previousMatchStatuses.get(matchId);

      currentStatuses.set(matchId, currentStatus);

      // Only check for changes if we have a previous status (not on first load)
      if (previousStatus && previousStatus !== currentStatus) {
        // Check if status just changed to halftime
        if (currentStatus === 'HT') {
          console.log(`🟠 [HALFTIME FLASH] Match ${matchId} just went to halftime!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousStatus,
            currentStatus
          });
          newHalftimeMatches.add(matchId);
        }

        // Check if status just changed to fulltime
        if (currentStatus === 'FT') {
          console.log(`🔵 [FULLTIME FLASH] Match ${matchId} just finished!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousStatus,
            currentStatus
          });
          newFulltimeMatches.add(matchId);
        }

        // Check for goal changes (when score changes but status stays the same)
        if (['1H', '2H', 'LIVE'].includes(currentStatus) && ['1H', '2H', 'LIVE'].includes(previousStatus)) {
          // You could add goal flash detection here if needed
          console.log(`⚽ [POTENTIAL GOAL] Match ${matchId} score might have changed`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            score: `${fixture.goals?.home || 0}-${fixture.goals?.away || 0}`,
            status: currentStatus
          });
        }
      }
    });

    // Update previous statuses AFTER checking for changes
    setPreviousMatchStatuses(currentStatuses);

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
  }, [fixtures]);

  // Add comprehensive debugging logs for fixture analysis
  useEffect(() => {
    if (fixtures && fixtures.length > 0) {
      console.log(`🔍 [LiveMatchForAllCountry] Analyzing ${fixtures.length} fixtures:`);

      // Log first few fixtures with detailed info
      const sampleFixtures = fixtures.slice(0, 5);
      sampleFixtures.forEach((fixture, index) => {
        console.log(`📊 [LiveMatchForAllCountry] Fixture ${index + 1}:`, {
          fixtureId: fixture.fixture?.id,
          originalDate: fixture.fixture?.date,
          statusShort: fixture.fixture?.status?.short,
          statusLong: fixture.fixture?.status?.long,
          elapsed: fixture.fixture?.status?.elapsed,
          teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          league: fixture.league?.name,
          country: fixture.league?.country,
          goals: `${fixture.goals?.home || 0}-${fixture.goals?.away || 0}`,
          venue: fixture.fixture?.venue?.name
        });
      });

      // Status breakdown
      const statusBreakdown = fixtures.reduce((acc: any, fixture: any) => {
        const status = fixture.fixture?.status?.short || 'UNKNOWN';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      console.log(`📈 [LiveMatchForAllCountry] Status breakdown:`, statusBreakdown);

      // Live matches analysis
      const liveMatches = fixtures.filter((fixture: any) => 
        ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(fixture.fixture?.status?.short)
      );

      if (liveMatches.length > 0) {
        console.log(`🔴 [LiveMatchForAllCountry] Found ${liveMatches.length} live matches:`);
        liveMatches.forEach((fixture: any, index: number) => {
          const now = new Date();
          const matchDate = new Date(fixture.fixture.date);
          const minutesSinceStart = Math.floor((now.getTime() - matchDate.getTime()) / (1000 * 60));

          console.log(`🔴 [LiveMatchForAllCountry] Live Match ${index + 1}:`, {
            fixtureId: fixture.fixture.id,
            teams: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
            status: fixture.fixture.status.short,
            elapsed: fixture.fixture.status.elapsed,
            originalStartTime: fixture.fixture.date,
            minutesSinceScheduledStart: minutesSinceStart,
            score: `${fixture.goals.home || 0}-${fixture.goals.away || 0}`,
            league: fixture.league.name,
            country: fixture.league.country
          });
        });
      }

      // Country breakdown
      const countryBreakdown = fixtures.reduce((acc: any, fixture: any) => {
        const country = fixture.league?.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {});

      console.log(`🌍 [LiveMatchForAllCountry] Country breakdown:`, countryBreakdown);

      // Time analysis
      const now = new Date();
      const timeAnalysis = fixtures.map((fixture: any) => {
        const matchDate = new Date(fixture.fixture.date);
        const hoursDiff = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
        return {
          fixtureId: fixture.fixture.id,
          status: fixture.fixture.status.short,
          hoursDiff: Math.round(hoursDiff * 100) / 100,
          isToday: matchDate.toDateString() === now.toDateString()
        };
      });

      console.log(`⏰ [LiveMatchForAllCountry] Time analysis (first 10):`, timeAnalysis.slice(0, 10));
    }
  }, [fixtures]);

  // Enhanced team logo source with 365scores integration
  const getTeamLogoUrl = (team: any, league?: any) => {
    const isNational = isNationalTeam(team, league);
    const sources = getTeamLogoSources(team, isNational);

    // Return the highest priority source
    return sources[0]?.url || "/assets/fallback-logo.svg";
  };

  // Enhanced country flag mapping with better null safety
  const getCountryFlag = (
    country: string | null | undefined,
    leagueFlag?: string | null,
  ) => {
    // Use league flag if available and valid
    if (
      leagueFlag &&
      typeof leagueFlag === "string" &&
      leagueFlag.trim() !== ""
    ) {
      return leagueFlag;
    }

    // Add comprehensive null/undefined check for country
    if (!country || typeof country !== "string" || country.trim() === "") {
      return "/assets/fallback-logo.svg"; // Default football logo
    }

    const cleanCountry = country.trim();

    // Special handling for Unknown country only
    if (cleanCountry === "Unknown") {
      return "/assets/fallback-logo.svg"; // Default football logo
    }

    // Special cases for international competitions
    if (cleanCountry === "World") {
      return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzMzNzNkYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS0yMCA0aDIwbS0yMC04aDIwIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMmE0IDE0IDAgMCAwIDAgMjBBNCAxNCAwIDAgMCAxMiAyIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K";
    }

    if (cleanCountry === "Europe") {
      return "https://flagsapi.com/EU/flat/24.png";
    }

    // Use centralized countryCodeMap from flagUtils

    // Use country mapping, fallback to SportsRadar for unknown countries
    let countryCode = "XX";
    if (countryCodeMap[cleanCountry]) {
      countryCode = countryCodeMap[cleanCountry];
      return `https://flagsapi.com/${countryCode}/flat/24.png`;
    } else {
      // Try SportsRadar flags API as fallback
      return `https://api.sportradar.com/flags-images-t3/sr/country-flags/flags/${cleanCountry.toLowerCase().replace(/\s+/g, "_")}/flag_24x24.png`;
    }
  };

  // Use only the live fixtures data
  const allFixtures = fixtures;

  // Add comparison logs with TodaysMatchesByCountryNew
  useEffect(() => {
    if (fixtures && fixtures.length > 0) {
      console.log(`🔄 [LiveMatchForAllCountry] COMPARISON DATA:`, {
        component: 'LiveMatchForAllCountry',
        totalFixtures: fixtures.length,
        liveMatchesCount: fixtures.filter(f => 
          ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(f.fixture?.status?.short)
        ).length,
        uniqueCountries: [...new Set(fixtures.map(f => f.league?.country))].length,
        dataSource: 'live fixtures API endpoint',
        timestamp: new Date().toISOString(),
        refreshInterval: refreshInterval
      });
    }
  }, [fixtures, refreshInterval]);

  // For live matches component, we want to show all fixtures that are currently live
  // or recently finished (within the last 2 hours)
  const [filteredFixtures, setFilteredFixtures] = useState<any[]>([]);
  const [hasLiveMatches, setHasLiveMatches] = useState(false);

  // Filter live matches and update state
  useEffect(() => {
    if (!fixtures || fixtures.length === 0) {
      console.log('🔍 [LiveMatchForAllCountry] No live fixtures available', {
        isLoading,
        hasFixtures: !!fixtures,
        fixturesLength: fixtures?.length || 0
      });
      setFilteredFixtures([]);
      setHasLiveMatches(false);
      return;
    }

    // Filter fixtures that are actually live or finished within the last 2 hours
    const now = new Date();
    const recentlyFinishedThreshold = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

    const actualLiveFixtures = fixtures.filter((fixture: any) => {
      const status = fixture.fixture?.status?.short;
      const isLive = ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(status);

      // Check if the match is recently finished
      const isFinished = ['FT', 'AET', 'PEN'].includes(status);
      let isRecentlyFinished = false;
      if (isFinished) {
        const fixtureDate = new Date(fixture.fixture.date);
        const timeDiff = now.getTime() - fixtureDate.getTime();
        isRecentlyFinished = timeDiff <= recentlyFinishedThreshold;
      }

      if (isLive) {
        console.log(`✅ [LiveMatchForAllCountry] Including live match: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name} (${status})`);
      }

      if (isRecentlyFinished) {
          console.log(`✅ [LiveMatchForAllCountry] Including recently finished match: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name} (${status})`);
      }

      return isLive || isRecentlyFinished;
    });

    console.log(`🔍 [LiveMatchForAllCountry] Live and recently finished matches check:`, {
      totalFixtures: fixtures.length,
      filteredFixtures: actualLiveFixtures.length,
      hasLiveMatches: actualLiveFixtures.length > 0,
      liveFilterActive,
      allFixturesLength: allFixtures?.length || 0,
      firstFewStatuses: fixtures.slice(0, 5).map((f: any) => f.fixture?.status?.short)
    });

    setFilteredFixtures(actualLiveFixtures);
    setHasLiveMatches(actualLiveFixtures.length > 0);
  }, [fixtures, isLoading, liveFilterActive]);

  // Group fixtures by country
  const fixturesByCountry = filteredFixtures.reduce((acc: any, fixture: any) => {
    // Validate fixture structure
    if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
      return acc;
    }

    // Validate league data
    const league = fixture.league;
    if (!league.id || !league.name) {
      return acc;
    }

    // Validate team data
    if (
      !fixture.teams.home ||
      !fixture.teams.away ||
      !fixture.teams.home.name ||
      !fixture.teams.away.name
    ) {
      return acc;
    }

    // Apply exclusion filtering consistent with popular leagues
    const leagueName = league.name?.toLowerCase() || "";
    const homeTeamName = fixture.teams?.home?.name?.toLowerCase() || "";
    const awayTeamName = fixture.teams?.away?.name?.toLowerCase() || "";

    // Apply exclusion check using the same logic as TodayPopularFootballLeaguesNew
    if (
      shouldExcludeFromPopularLeagues(
        league.name,
        fixture.teams.home.name,
        fixture.teams.away.name,
        league.country,
      )
    ) {
      return acc;
    }

    const country = league.country;

    // Skip fixtures without a valid country, but keep World and Europe competitions
    if (
      !country ||
      country === null ||
      country === undefined ||
      typeof country !== "string" ||
      country.trim() === "" ||
      country.toLowerCase() === "unknown"
    ) {
      // Allow World competitions, UEFA, and FIFA competitions to pass through
      if (league.name && (
          league.name.toLowerCase().includes('world') || 
          league.name.toLowerCase().includes('europe') ||
          league.name.toLowerCase().includes('uefa') ||
          league.name.toLowerCase().includes('fifa') ||
          league.name.toLowerCase().includes('champions') ||
          league.name.toLowerCase().includes('conference') ||
          league.name.toLowerCase().includes('nations league') ||
          (league.name.toLowerCase().includes('friendlies') &&
            !league.name.toLowerCase().includes('women')) ||
          league.name.toLowerCase().includes('conmebol') ||
          league.name.toLowerCase().includes('copa america') ||
          league.name.toLowerCase().includes('copa libertadores') ||
          league.name.toLowerCase().includes('copa sudamericana'))) {

        // Use the original country from API, or fallback to "World" only for truly missing data
        let countryKey = country || "World";

        console.log(`[COUNTRY DEBUG] Using original API country in LiveMatchForAllCountry:`, {
          leagueName: league.name,
          leagueId: league.id,
          originalCountry: country,
          countryKey: countryKey,
        });

        if (
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
            flag: getCountryFlag(countryKey, league.flag),
            leagues: {},
            hasPopularLeague: true,
          };
        }

        const leagueId = league.id;
        if (!acc[countryKey].leagues[leagueId]) {
          acc[countryKey].leagues[leagueId] = {
            league: { ...league, country: countryKey },
            matches: [],
            isPopular: POPULAR_LEAGUES.includes(leagueId) || true, // International competitions are considered popular
          };
        }

        acc[countryKey].leagues[leagueId].matches.push({
          ...fixture,
          teams: {
            home: {
              ...fixture.teams.home,
              logo: getTeamLogoUrl(fixture.teams.home, league),
            },
            away: {
              ...fixture.teams.away,
              logo: getTeamLogoUrl(fixture.teams.away, league),
            },
          },
        });
        return acc;
      }

      console.warn(
        "Skipping fixture with invalid/unknown country:",
        country,
        fixture,
      );
      return acc;
    }

    // Only allow valid country names, World, and Europe
    const validCountry = country.trim();
    if (
      validCountry !== "World" &&
      validCountry !== "Europe" &&
      validCountry.length === 0
    ) {
      console.warn(
        "Skipping fixture with empty country name:",
        country,
        fixture,
      );
      return acc;
    }

    const leagueId = league.id;

    if (!acc[country]) {
      acc[country] = {
        country,
        flag: getCountryFlag(country, league.flag),
        leagues: {},
        hasPopularLeague: POPULAR_LEAGUES.includes(leagueId),
      };
    }

    if (!acc[country].leagues[leagueId]) {
      acc[country].leagues[leagueId] = {
        league: {
          ...league,
          logo:
            league.logo || "https://media.api-sports.io/football/leagues/1.png",
        },
        matches: [],
        isPopular: POPULAR_LEAGUES.includes(leagueId),
      };
    }

    // Add fixture with enhanced team logo data
    acc[country].leagues[leagueId].matches.push({
      ...fixture,
      teams: {
        home: {
          ...fixture.teams.home,
          logo: getTeamLogoUrl(fixture.teams.home, league),
        },
        away: {
          ...fixture.teams.away,
          logo: getTeamLogoUrl(fixture.teams.away, league),
        },
      },
    });

    return acc;
  }, {});

  // Sort countries: those with popular leagues first, then alphabetically
  const sortedCountries = Object.values(fixturesByCountry).sort(
    (a: any, b: any) => {
      // First sort by popular leagues
      if (a.hasPopularLeague && !b.hasPopularLeague) return -1;
      if (!a.hasPopularLeague && b.hasPopularLeague) return 1;

      // Then alphabetically
      const countryA = a.country || "";
      const countryB = b.country || "";
      return countryA.localeCompare(countryB);
    },
  );

  // Use the sorted countries directly without deprecated MySmartDateLabeling
  const processedCountries = sortedCountries;

  // Show loading only if we're actually loading and have no data
  if (isLoading && !fixtures.length) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-3 w-44" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-b border-gray-100 last:border-b-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-6 h-4 rounded-sm" />
                    <Skeleton className="h-4 w-28" />
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

  // Check if there are any live matches specifically
  const actuallyHasLiveMatches = filteredFixtures.some((fixture: any) => 
    ['LIVE', 'LIV', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(fixture.fixture?.status?.short)
  );

  console.log(`🔍 [LiveMatchForAllCountry] Live and recently finished matches check:`, {
    totalFixtures: fixtures.length,
    filteredFixtures: filteredFixtures.length,
    hasLiveMatches: actuallyHasLiveMatches,
    liveFilterActive,
    allFixturesLength: allFixtures.length
  });

  // Show loading state while fetching data (only when actually loading and no previous data)
  if (isLoading && !fixtures?.length) {
    return (
      <>
        {/* Header Section */}
        <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
          Popular Football Live Score
        </CardHeader>
        <div className="bg-gray-100 min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Loading live matches...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the latest scores</p>
          </div>
        </div>
      </>
    );
  }

  // Show no live matches when data has been loaded but no live matches found
  if (!isLoading && (!fixtures?.length || (liveFilterActive && !actuallyHasLiveMatches))) {
    console.log(`📺 [LiveMatchForAllCountry] Showing NoLiveMatchesEmpty - no live matches found`, {
      hasFixtures: !!fixtures?.length,
      fixturesCount: fixtures?.length || 0,
      liveFilterActive,
      actuallyHasLiveMatches,
      isLoading
    });

    return (
      <>
        {/* Header Section */}
        <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold text-sm">
          Popular Football Live Score
        </CardHeader>
        <div className="bg-gray-100 min-h-[400px]">
          <NoLiveMatchesEmpty 
            showBackButton={true}
            onBackToHome={() => {
              // Navigate to all matches or home page
              window.location.href = '/';
            }}
            setLiveFilterActive={setLiveFilterActive}
          />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        <div className="flex justify-between items-center w-full">
          <span>
            {liveFilterActive && timeFilterActive
              ? t('popular_football_leagues')
              : liveFilterActive && !timeFilterActive
                ? t('popular_football_leagues')
                : !liveFilterActive && timeFilterActive
                  ? "All Matches by Time"
                  : t('popular_football_leagues')}
          </span>
        </div>
      </CardHeader>
      {/* Create individual league cards from all countries */}
      {processedCountries.flatMap((countryData: any, countryIndex: number) =>
        Object.values(countryData.leagues)
          .sort((a: any, b: any) => {
            // First prioritize popular leagues (Champions League, Europa League, etc.)
            if (a.isPopular && !b.isPopular) return -1;
            if (!a.isPopular && b.isPopular) return 1;

            // If both or neither are popular, prioritize by league importance
            const aLeagueName = a.league?.name?.toLowerCase() || "";
            const bLeagueName = b.league?.name?.toLowerCase() || "";

            // Top tier leagues get highest priority
            const topTierLeagues = [
              "uefa champions league",
              "uefa europa league",
              "premier league",
              "la liga",
              "serie a",
              "bundesliga",
              "ligue 1",
            ];

            const aIsTopTier = topTierLeagues.some((league) =>
              aLeagueName.includes(league),
            );
            const bIsTopTier = topTierLeagues.some((league) =>
              bLeagueName.includes(league),
            );

            if (aIsTopTier && !bIsTopTier) return -1;
            if (!aIsTopTier && bIsTopTier) return 1;

            // Then alphabetically
            return a.league.name.localeCompare(b.league.name);
          })
          .map((leagueData: any, leagueIndex: number) => {
            // Calculate if this is the very first card across all countries
            const isFirstCard = countryIndex === 0 && leagueIndex === 0;

            return (
              <Card
                key={`${countryData.country}-${leagueData.league.id}`}
                className={`overflow-hidden ${isFirstCard ? "" : "mt-4"}`}
              >
                {/* League Header */}
                <CardContent className="flex items-center gap-2 p-2 bg-white border-b border-gray-200">
                  <img
                    src={leagueData.league.logo || "/assets/fallback-logo.svg"}
                    alt={leagueData.league.name || "Unknown League"}
                    className="w-6 h-6 object-contain rounded-full"
                    style={{ backgroundColor: "transparent" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/assets/fallback-logo.svg";
                    }}
                  />
                  <div className="flex flex-col flex-1">
                    <span className="font-semibold text-gray-800" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '13.3px' }}>
                      {safeSubstring(leagueData.league.name, 0) ||
                        "Unknown League"}
                    </span>
                    <span className="text-gray-600" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '13.3px' }}>
                      {leagueData.league.country || "Unknown Country"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {leagueData.isPopular && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '11.3px' }}>
                        Popular
                      </span>
                    )}
                  </div>
                </CardContent>
                {/* Live Matches */}
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {leagueData.matches
                      .sort((a: any, b: any) => {
                        // Sort live matches by elapsed time ascending (shorter elapsed time first)
                        const aStatus = a.fixture.status.short;
                        const bStatus = b.fixture.status.short;

                        const aIsLive = [
                          "LIVE",
                          "1H",
                          "HT",
                          "2H",
                          "ET",
                          "BT",
                          "P",
                          "INT",
                        ].includes(aStatus);
                        const bIsLive = [
                          "LIVE",
                          "1H",
                          "HT",
                          "2H",
                          "ET",
                          "BT",
                          "P",
                          "INT",
                        ].includes(bStatus);

                        // If both are live, sort by elapsed time ascending
                        if (aIsLive && bIsLive) {
                          const aElapsed =
                            Number(a.fixture.status.elapsed) || 0;
                          const bElapsed =
                            Number(b.fixture.status.elapsed) || 0;
                          return aElapsed - bElapsed; // Ascending order: shorter elapsed time first
                        }

                        // Live matches first
                        if (aIsLive && !bIsLive) return -1;
                        if (!aIsLive && bIsLive) return 1;

                        // If neither is live, maintain original order
                        return 0;
                      })
                      .map((match: any) => (
                        <div
                          key={match.fixture.id}
                          className="country-matches-container"
                        >
                          <div 
                            className={`match-card-container group ${
                              halftimeFlashMatches.has(match.fixture.id) ? 'halftime-flash' : ''
                            } ${
                              fulltimeFlashMatches.has(match.fixture.id) ? 'fulltime-flash' : ''
                            }`}
                            data-fixture-id={match.fixture.id}
                            onClick={() => {
                              console.log('🔴 [LiveMatchForAllCountry] Match card clicked:', {
                                fixtureId: match.fixture?.id,
                                teams: `${match.teams?.home?.name} vs ${match.teams?.away?.name}`,
                                league: match.league?.name,
                                country: match.league?.country,
                                status: match.fixture?.status?.short,
                                hasCallback: !!onMatchCardClick
                              });
                              onMatchCardClick?.(match);
                            }}
                            style={{ cursor: onMatchCardClick ? 'pointer' : 'default' }}
                          >
                            {/* Star Button with slide-in effect */}
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
                                  starredMatches.has(match.fixture.id) ? "starred" : ""
                                }`}
                              />
                            </button>

                            <div className="match-three-grid-container">
                              {/* Top grid for status */}
                              <div className="match-status-top">
                                {(() => {
                                  const status = match.fixture.status.short;

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
                                      <div className={`match-status-label ${status === "HT" ? "status-halftime" : "status-live-elapsed"}`}>
                                        {status === "HT"
                                          ? "Halftime"
                                          : `${match.fixture.status.elapsed || 0}'`}
                                      </div>
                                    );
                                  }

                                  // Finished matches
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
                                    );
                                  }

                                  // Postponed matches
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
                                      <div className="match-status-label status-postponed">
                                        {status === "PST"
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
                                                    : status}
                                      </div>
                                    );
                                  }

                                  // Upcoming matches
                                  if (status === "TBD") {
                                    return (
                                      <div className="match-status-label status-upcoming">
                                        Time TBD
                                      </div>
                                    );
                                  }

                                  return null;
                                })()}
                              </div>

                              {/* Middle grid for main content */}
                              <div className="match-content-container">
                                {/* Home Team Name */}
                                <div
                                  className={`home-team-name ${
                                    match.goals.home !== null &&
                                    match.goals.away !== null &&
                                    match.goals.home > match.goals.away
                                      ? "winner"
                                      : ""
                                  }`}
                                >
                                  {match.teams.home.name || "Unknown Team"}
                                </div>

                                {/* Home team logo */}
                                <div className="home-team-logo-container">
                                  {(() => {
                                    // Check if this is a national team
                                    const isActualNationalTeam = isNationalTeam(
                                      match.teams.home,
                                      leagueData.league,
                                    );

                                    // Check for youth teams
                                    const isYouthTeam = match.teams.home.name?.includes("U20") || 
                                                       match.teams.home.name?.includes("U21") ||
                                                       match.teams.home.name?.includes("U19") ||
                                                       match.teams.home.name?.includes("U23");

                                    // Check if this is FIFA Club World Cup (club competition, not national teams)
                                    const isFifaClubWorldCup = leagueData.league.name?.toLowerCase().includes("fifa club world cup");

                                    // Check if this is UEFA Europa Conference League (club competition, not national teams)
                                    const isUefaConferenceLeague = leagueData.league.name?.toLowerCase().includes("uefa europa conference league") || 
                                                                  leagueData.league.name?.toLowerCase().includes("europa conference league");

                                    // Use MyCircularFlag for national teams and youth teams, but NOT for club competitions like FIFA Club World Cup or UEFA Europa Conference League
                                    if ((isActualNationalTeam || isYouthTeam) && !isFifaClubWorldCup && !isUefaConferenceLeague) {
                                      return (
                                        <MyCircularFlag
                                          teamName={match.teams.home.name || ""}
                                          fallbackUrl={
                                            match.teams.home.id
                                              ? `/api/team-logo/square/${match.teams.home.id}?size=32`
                                              : "/assets/fallback-logo.svg"
                                          }
                                          alt={match.teams.home.name}
                                          size="34px"
                                          className="popular-leagues-size"
                                        />
                                      );
                                    }

                                    // Default to regular team logo for club teams
                                    return (
                                      <LazyImage
                                        src={
                                          match.teams.home.id
                                            ? `/api/team-logo/square/${match.teams.home.id}?size=32`
                                            : "/assets/fallback-logo.svg"
                                        }
                                        alt={match.teams.home.name}
                                        title={match.teams.home.name}
                                        className="team-logo"
                                        style={{ backgroundColor: "transparent" }}
                                      />
                                    );
                                  })()}
                                </div>

                                {/* Score/Time Center */}
                                <div className="match-score-container">
                                  {(() => {
                                    const status = match.fixture.status.short;
                                    const fixtureDate = parseISO(match.fixture.date);

                                    // Live matches - show score
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

                                    // Finished matches - show final score
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
                                        return (
                                          <div className="match-time-display">
                                            {format(fixtureDate, "HH:mm")}
                                          </div>
                                        );
                                      }
                                    }

                                    // Upcoming matches - show time
                                    return (
                                      <div className="match-time-display">
                                        {status === "TBD"
                                          ? "TBD"
                                          : format(fixtureDate, "HH:mm")}
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Away team logo */}
                                <div className="away-team-logo-container">
                                  {(() => {
                                    // Check if this is a national team
                                    const isActualNationalTeam = isNationalTeam(
                                      match.teams.away,
                                      leagueData.league,
                                    );

                                    // Check for youth teams
                                    const isYouthTeam = match.teams.away.name?.includes("U20") || 
                                                       match.teams.away.name?.includes("U21") ||
                                                       match.teams.away.name?.includes("U19") ||
                                                       match.teams.away.name?.includes("U23");

                                    // Check if this is FIFA Club World Cup (club competition, not national teams)
                                    const isFifaClubWorldCup = leagueData.league.name?.toLowerCase().includes("fifa club world cup");

                                    // Check if this is UEFA Europa Conference League (club competition, not national teams)
                                    const isUefaConferenceLeague = leagueData.league.name?.toLowerCase().includes("uefa europa conference league") || 
                                                                  leagueData.league.name?.toLowerCase().includes("europa conference league");

                                    // Use MyCircularFlag for national teams and youth teams, but NOT for club competitions like FIFA Club World Cup or UEFA Europa Conference League
                                    if ((isActualNationalTeam || isYouthTeam) && !isFifaClubWorldCup && !isUefaConferenceLeague) {
                                      return (
                                        <MyCircularFlag
                                          teamName={match.teams.away.name || ""}
                                          fallbackUrl={
                                            match.teams.away.id
                                              ? `/api/team-logo/square/${match.teams.away.id}?size=32`
                                              : "/assets/fallback-logo.svg"
                                          }
                                          alt={match.teams.away.name}
                                          size="34px"
                                          className="popular-leagues-size"
                                        />
                                      );
                                    }

                                    // Default to regular team logo for club teams
                                    return (
                                      <LazyImage
                                        src={
                                          match.teams.away.id
                                            ? `/api/team-logo/square/${match.teams.away.id}?size=32`
                                            : "/assets/fallback-logo.svg"
                                        }
                                        alt={match.teams.away.name}
                                        title={match.teams.away.name}
                                        className="team-logo"
                                        style={{
                                          filter:
                                            "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))",
                                        }}
                                      />
                                    );
                                  })()}
                                </div>

                                {/* Away Team Name */}
                                <div
                                  className={`away-team-name ${
                                    match.goals.home !== null &&
                                    match.goals.away !== null &&
                                    match.goals.away > match.goals.home
                                      ? "winner"
                                      : ""
                                  }`}
                                >
                                  {match.teams.away.name || "Unknown Team"}
                                </div>
                              </div>

                              {/* Bottom grid for penalty results (if needed) */}
                              <div className="match-penalty-bottom">
                                {/* This can be used for penalty shootout results or other additional info */}
                              </div>
                            </div>
                          </div>
                        </div>
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

export default LiveMatchForAllCountry;