import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Calendar, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useCachedQuery } from "@/lib/cachingHelper";
import { format, parseISO, isValid, differenceInHours } from "date-fns";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { shouldExcludeMatchByCountry } from "@/lib/MyMatchByCountryNewExclusion";
import { isToday, isYesterday, isTomorrow } from "@/lib/dateUtilsUpdated";
import { useDispatch, useSelector } from "react-redux";
import { RootState, fixturesActions, selectFixturesByDate } from "@/lib/store";
import {
  formatYYYYMMDD,
  getCurrentUTCDateString,
  getCurrentClientDateString,
  isDateStringToday,
  isDateStringYesterday,
  isDateStringTomorrow,
  isFixtureOnClientDate,
  getFixtureClientDate,
  isFixtureDateTimeStringToday,
  isFixtureDateTimeStringYesterday,
  isFixtureDateTimeStringTomorrow,
  getDateTimeRange,
} from "@/lib/dateUtilsUpdated";
import {
  getCachedFlag,
  getCountryFlagWithFallbackSync,
  clearFallbackFlagCache,
  countryCodeMap,
  flagCache,
  getCountryCode,
} from "@/lib/flagUtils";
import { getCachedCountryName, setCachedCountryName } from "@/lib/countryCache";

import { getCachedTeamLogo } from "../../lib/MyAPIFallback";
import { isNationalTeam } from "../../lib/teamLogoSources";
import { MySmartDateLabeling } from "../../lib/MySmartDateLabeling";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
import MyCircularFlag from "../common/MyCircularFlag";
import LazyMatchItem from "./LazyMatchItem";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import "../../styles/MyLogoPositioning.css";
import "../../styles/TodaysMatchByCountryNew.css";
import "../../styles/flasheffect.css";
import MyCountryGroupFlag from "../common/MyCountryGroupFlag";

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

  // If still too long (more than 12 characters), intelligently shorten multi-word names
  if (shortened.length > 12) {
    const words = shortened.split(" ");

    if (words.length > 1) {
      // For multi-word names, shorten the last word progressively
      const lastWordIndex = words.length - 1;
      const lastWord = words[lastWordIndex];

      if (lastWord.length > 4) {
        // First try 3 characters
        words[lastWordIndex] = lastWord.substring(0, 3);
        shortened = words.join(" ");

        // If still too long, try 2 characters for the last word
        if (shortened.length > 12) {
          words[lastWordIndex] = lastWord.substring(0, 2);
          shortened = words.join(" ");
        }
      }
    } else {
      // For single long words, truncate to 10 characters
      shortened = shortened.substring(0, 10);
    }
  }

  return shortened.trim();
};

interface TodaysMatchesByCountryNewProps {
  selectedDate: string;
  liveFilterActive?: boolean;
  timeFilterActive?: boolean;
  onMatchCardClick?: (fixture: any) => void;
}

const TodaysMatchesByCountryNew: React.FC<TodaysMatchesByCountryNewProps> = ({
  selectedDate,
  liveFilterActive = false,
  timeFilterActive = false,
  onMatchCardClick,
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(),
  );
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(
    new Set(),
  );
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  const [hiddenMatches, setHiddenMatches] = useState<Set<number>>(new Set());
  // Flash animation states
  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(new Set());
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(new Set());
  const [previousMatchStatuses, setPreviousMatchStatuses] = useState<Map<number, string>>(new Map());
  const [goalFlashMatches, setGoalFlashMatches] = useState<Set<number>>(new Set());
  const [previousMatchScores, setPreviousMatchScores] = useState<Map<number, {home: number, away: number}>>(new Map());

  // Test flash effect buttons (remove after testing)
  const [showTestButtons, setShowTestButtons] = useState(false);
  // Initialize flagMap with immediate synchronous values for better rendering
 const [flagMap, setFlagMap] = useState<{ [country: string]: string }>(() => {
    // Pre-populate with synchronous flag URLs to prevent initial undefined state
    const initialMap: { [country: string]: string } = {};
    // Let World flag be fetched through the normal caching system
    return initialMap;
  });

  // Popular leagues for prioritization - Significantly expanded to include more leagues worldwide
  const POPULAR_LEAGUES = [
    // UEFA Competitions
    2, 3, 848, 15, 5, 8, 16,
    // Top European Leagues
    39, 140, 135, 78, 61, 94, 88, 179, 218,
    // Major International Competitions
    22, 9, 13, 4, 21, 914,
    // European Second Tier Leagues
    144, 103, 106, 119, 113, 203, 345, 384, 317, 244,
    // Major American Leagues
    253, 71, 72, 73, 128, 274, 556,
    // Asian Leagues
    292, 301, 188, 169, 271, 294, 279, 290,
    // African & Middle Eastern Leagues
    307, 233, 239, 302, 383, 551, 332, 556,
    // South American Leagues
    71, 72, 325, 265, 267, 268, 269, 270,
    // European Third Tier Leagues
    327, 329, 361, 365, 218, 319, 373, 380,
    // Additional Regional Leagues
    114, 116, 120, 121, 122, 123, 124, 125, 126, 127,
    // Club Friendlies
    667, // Friendlies Clubs
  ]; // Significantly expanded to include major leagues from all continents

  // Smart cached data fetching using useCachedQuery like MyNewLeague2
  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === today;

  // Dynamic cache configuration based on date and live match detection
  const getDynamicCacheConfig = () => {
    if (!isToday) {
      // Historical or future dates - use longer cache times
      return {
        staleTime: 30 * 60 * 1000, // 30 minutes
        refetchInterval: false, // No auto-refresh for non-today dates
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      };
    }

    // Today's matches - more aggressive caching
    return {
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 30 * 1000, // 30 seconds for today
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    };
  };

  // State for lazy loading countries with performance optimization
  const [visibleCountries, setVisibleCountries] = useState<Set<string>>(new Set());
  const [initialLoadCount] = useState(5); // Start with 5 countries for better UX
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Use smart cached query
  const {
    data: fixtures = [],
    isLoading,
    error: queryError,
    refetch
  } = useCachedQuery(
    ['all-fixtures-by-date', selectedDate],
    async () => {
      if (!selectedDate) return [];

      console.log(`🔍 [TodaysMatchesByCountryNew] Smart fetch for date: ${selectedDate}`);

      const response = await apiRequest(
        "GET",
        `/api/fixtures/date/${selectedDate}?all=true`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log(`✅ [TodaysMatchesByCountryNew] Smart cached: ${data?.length || 0} fixtures`);

      return Array.isArray(data) ? data : [];
    },
    {
      ...getDynamicCacheConfig(),
      enabled: !!selectedDate,
      retry: (failureCount, error) => {
        // Don't retry too aggressively for historical data
        if (!isToday) return failureCount < 2;
        // For today's data, allow more retries
        return failureCount < 3;
      },
      onError: (err: any) => {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';

        if (errorMessage.includes('Failed to fetch') || 
            errorMessage.includes('NetworkError')) {
          console.warn(`🌐 [TodaysMatchesByCountryNew] Network issue for date: ${selectedDate}`);
        } else if (errorMessage.includes('timeout')) {
          console.warn(`⏱️ [TodaysMatchesByCountryNew] Request timeout for date: ${selectedDate}`);
        } else {
          console.error(`💥 [TodaysMatchesByCountryNew] Smart cache error for date: ${selectedDate}:`, err);
        }
      },
    }
  );

  

  // Error handling with user-friendly messages
  const error = queryError ? (
    queryError instanceof Error ? 
      queryError.message.includes('Failed to fetch') || queryError.message.includes('NetworkError') ?
        "Network connection issue. Please check your internet connection and try again." :
      queryError.message.includes('timeout') ?
        "Request timeout. The server took too long to respond." :
        "Failed to load fixtures. Please try again later."
      : 'Unknown error occurred'
  ) : null;

  // Smart cache adjustment based on live match detection and proximity to kickoff - like MyNewLeague2
  useEffect(() => {
    if (!fixtures || fixtures.length === 0) return;

    const now = new Date();
    const liveMatches = fixtures.filter((match: any) =>
      ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(
        match.fixture?.status?.short,
      ),
    );

    const upcomingMatches = fixtures.filter((match: any) => {
      if (match.fixture?.status?.short !== "NS") return false;
      const matchTime = new Date(match.fixture.date);
      const hoursUntilKickoff = (matchTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilKickoff > 0 && hoursUntilKickoff <= 2; // Within 2 hours
    });

    const imminentMatches = fixtures.filter((match: any) => {
      if (match.fixture?.status?.short !== "NS") return false;
      const matchTime = new Date(match.fixture.date);
      const minutesUntilKickoff = (matchTime.getTime() - now.getTime()) / (1000 * 60);
      return minutesUntilKickoff > 0 && minutesUntilKickoff <= 30; // Within 30 minutes
    });

    if (liveMatches.length > 0 && isToday) {
      console.log(`🔴 [TodaysMatchesByCountryNew] ${liveMatches.length} live matches detected - using most aggressive cache (30s refresh)`);
    } else if (imminentMatches.length > 0 && isToday) {
      console.log(`🟡 [TodaysMatchesByCountryNew] ${imminentMatches.length} matches starting within 30min - using aggressive cache`);
    } else if (upcomingMatches.length > 0 && isToday) {
      console.log(`🟠 [TodaysMatchesByCountryNew] ${upcomingMatches.length} matches starting within 2h - using moderate cache`);
    } else if (isToday && liveMatches.length === 0) {
      console.log(`🔵 [TodaysMatchesByCountryNew] Today but no live/imminent matches - using standard cache`);
    } else {
      console.log(`⚫ [TodaysMatchesByCountryNew] Non-today date - using extended cache`);
    }

    // Log cache status
    const cacheStats = {
      date: selectedDate,
      isToday,
      totalFixtures: fixtures.length,
      liveMatches: liveMatches.length,
      imminentMatches: imminentMatches.length,
      upcomingMatches: upcomingMatches.length,
    };
    console.log(`📊 [TodaysMatchesByCountryNew] Cache stats:`, cacheStats);

  }, [fixtures, selectedDate, isToday]);

  // Smart fixture processing with deduplication like MyNewLeague2
  const processedFixtures = useMemo(() => {
    if (!fixtures || fixtures.length === 0) return [];

    // Apply deduplication by fixture ID and matchup key
    const seenFixtures = new Set<number>();
    const seenMatchups = new Set<string>();
    const deduplicatedFixtures: any[] = [];

    fixtures.forEach((fixture: any) => {
      if (!fixture?.fixture?.id || !fixture?.teams) return;

      // Check for duplicate fixture IDs
      if (seenFixtures.has(fixture.fixture.id)) return;

      // Create unique matchup key
      const matchupKey = `${fixture.teams.home?.id}-${fixture.teams.away?.id}-${fixture.league?.id}-${fixture.fixture.date}`;
      if (seenMatchups.has(matchupKey)) return;

      // Mark as seen and add to deduplicated list
      seenFixtures.add(fixture.fixture.id);
      seenMatchups.add(matchupKey);
      deduplicatedFixtures.push(fixture);
    });

    console.log(`🔄 [TodaysMatchesByCountryNew] Processed ${fixtures.length} fixtures → ${deduplicatedFixtures.length} after deduplication`);

    return deduplicatedFixtures;
  }, [fixtures]);

// Memoized filtering with performance optimizations using smart cached data
  const { validFixtures, rejectedFixtures, stats } = useMemo(() => {
    const allFixtures = processedFixtures;
    if (!allFixtures?.length) {
      console.log(`📊 [TodaysMatchesByCountryNew] No processed fixtures available for ${selectedDate}`);
      return {
        validFixtures: [],
        rejectedFixtures: [],
        stats: { total: 0, valid: 0, rejected: 0, methods: {} },
      };
    }

    const filtered: any[] = [];
    const rejected: Array<{ fixture: any; reason: string }> = [];
    const seenFixtures = new Set<number>(); // Track seen fixture IDs to prevent duplicates
    const seenMatchups = new Set<string>(); // Track unique team matchups as well

    allFixtures.forEach((fixture: any, index) => {
      // Validate fixture structure (same as MyNewLeague2)
      if (
        !fixture ||
        !fixture.league ||
        !fixture.teams ||
        !fixture.fixture?.date ||
        !fixture.fixture?.id
      ) {
        rejected.push({ fixture, reason: 'Invalid fixture structure' });
        return;
      }

      // Check for duplicate fixture IDs (same as MyNewLeague2)
      if (seenFixtures.has(fixture.fixture.id)) {
        rejected.push({ fixture, reason: 'Duplicate fixture ID' });
        return;
      }

      // Create unique matchup key (same as MyNewLeague2)
      const matchupKey = `${fixture.teams.home.id}-${fixture.teams.away.id}-${fixture.league.id}-${fixture.fixture.date}`;

      // Check for duplicate team matchups
      if (seenMatchups.has(matchupKey)) {
        rejected.push({ fixture, reason: 'Duplicate matchup' });
        return;
      }

      // Apply date filtering - extract date from fixture and compare with selected date (same as MyNewLeague2)
      const fixtureDate = new Date(fixture.fixture.date);
      const fixtureDateString = format(fixtureDate, "yyyy-MM-dd");

      // Only include fixtures that match the selected date
      if (fixtureDateString !== selectedDate) {
        rejected.push({ fixture, reason: 'Date mismatch' });
        return;
      }

      // Mark this fixture as seen and add it to the filtered list
      seenFixtures.add(fixture.fixture.id);
      seenMatchups.add(matchupKey);
      filtered.push(fixture);
    });

    return {
      validFixtures: filtered,
      rejectedFixtures: rejected,
      stats: {
        total: allFixtures.length,
        valid: filtered.length,
        rejected: rejected.length,
        methods: {
          "date-filter": filtered.length,
        },
      },
    };
  }, [processedFixtures, selectedDate]);

  // Cache the last filter results
  const lastFilterCache = useRef<{
    key: string;
    data: any[];
  } | null>(null);

// Memoized filtering with performance optimizations
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length || !selectedDate) {
      return [];
    }

    // Early return for cached results
    const cacheKey = `filtered_${selectedDate}_${fixtures.length}`;
    if (lastFilterCache?.current?.key === cacheKey && lastFilterCache?.current?.data) {
      return lastFilterCache.current.data;
    }

    const filtered = fixtures.filter((fixture) => {
      if (!fixture?.fixture?.date) {
        return false;
      }

      const fixtureDate = new Date(fixture.fixture.date);
      const fixtureDateString = format(fixtureDate, "yyyy-MM-dd");
      return fixtureDateString === selectedDate;
    });

    // Update cache
    lastFilterCache.current = {
      key: cacheKey,
      data: filtered,
    };

    return filtered;
  }, [fixtures, selectedDate]);

  // Now validate after all hooks are called
  if (!selectedDate) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Please select a valid date</p>
        </CardContent>
      </Card>
    );
  }

  // Country code to full name mapping with caching
  const getCountryDisplayName = (
    country: string | null | undefined,
  ): string => {
    if (!country || typeof country !== "string" || country.trim() === "") {
      return "Unknown";
    }

    // Check cache first
    const cachedName = getCachedCountryName(country);
    if (cachedName) {
      return cachedName;
    }

    // Create reverse mapping from country code to country name using the centralized countryCodeMap
    const countryNameMap: { [key: string]: string } = {};
    Object.entries(countryCodeMap).forEach(([countryName, countryCode]) => {
      if (countryCode.length === 2) {
        countryNameMap[countryCode.toLowerCase()] = countryName;
      }
    });

    // Additional mappings for common variations and full country names from API
    const additionalMappings: { [key: string]: string } = {
      "czech republic": "Czech-Republic",
      india: "India",
      ae: "United Arab Emirates",
      "united arab emirates": "United Arab Emirates",
      "united arab emirates (the)": "United Arab Emirates",
      uae: "United Arab Emirates",
      ba: "Bosnia & Herzegovina",
      mk: "North Macedonia",
      sa: "Saudi Arabia",
      "saudi arabia": "Saudi Arabia",
      gb: "United Kingdom",
      gbr: "United Kingdom",
      "united kingdom": "United Kingdom",
      "united kingdom of great britain and northern ireland": "United Kingdom",
      "united kingdom of great britain and northern ireland (the)":
        "United Kingdom",
      us: "United States",
      usa: "United States",
      "united states": "United States",
      "united states of america": "United States",
      "united states minor outlying islands": "United States",
      "united states minor outlying islands (the)": "United States",
      um: "United States",
      umi: "United States",
      "korea republic": "South Korea",
      "korea (republic of)": "South Korea",
      "korea democratic people's republic": "North Korea",
      "korea (democratic people's republic of)": "North Korea",
      "iran islamic republic": "Iran",
      "iran (islamic republic of)": "Iran",
      "russian federation": "Russia",
      "russian federation (the)": "Russia",
      "venezuela bolivarian republic": "Venezuela",
      "venezuela (bolivarian republic of)": "Venezuela",
      "bolivia plurinational state": "Bolivia",
      "bolivia (plurinational state of)": "Bolivia",
      "tanzania united republic": "Tanzania",
      "tanzania (united republic of)": "Tanzania",
      "moldova republic": "Moldova",
      "moldova (republic of)": "Moldova",
      "macedonia former yugoslav republic": "North Macedonia",
      "macedonia (the former yugoslav republic of)": "North Macedonia",
      "palestinian territory occupied": "Palestine",
      "palestinian territory (occupied)": "Palestine",
      "palestine state": "Palestine",
      "palestine (state of)": "Palestine",
      "congo democratic republic": "Democratic Republic of Congo",
      "congo (the democratic republic of)": "Democratic Republic of Congo",
      "lao people's democratic republic": "Laos",
      "lao people's democratic republic (the)": "Laos",
    };

    const cleanCountry = country.trim().toLowerCase();
    const displayName =
      countryNameMap[cleanCountry] ||
      additionalMappings[cleanCountry] ||
      country;

    // Cache the result for future use
    setCachedCountryName(country, displayName, "country-mapping");

    return displayName;
  };

  // Helper function to convert UTC date to user's local date
  const getFixtureLocalDate = (utcDateString: string): string => {
    const utcDate = parseISO(utcDateString);
    return format(utcDate, "yyyy-MM-dd");
  };

  // Add comprehensive debugging logs for fixture analysis
  useEffect(() => {
    if (processedFixtures && processedFixtures.length > 0) {
      console.log(
        `🔍 [TodaysMatchesByCountryNew] Analyzing ${processedFixtures.length} fixtures for date: ${selectedDate}`,
      );

      // Log first few fixtures with detailed info
      const sampleFixtures = processedFixtures.slice(0, 5);
      sampleFixtures.forEach((fixture, index) => {
        console.log(`📊 [TodaysMatchesByCountryNew] Fixture ${index + 1}:`, {
          fixtureId: fixture.fixture?.id,
          originalDate: fixture.fixture?.date,
          statusShort: fixture.fixture?.status?.short,
          statusLong: fixture.fixture?.status?.long,
          elapsed: fixture.fixture?.status?.elapsed,
          teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          league: fixture.league?.name,
          country: fixture.league?.country,
          goals: `${fixture.goals?.home || 0}-${fixture.goals?.away || 0}`,
          venue: fixture.fixture?.venue?.name,
        });
      });

      // Status breakdown
      const statusBreakdown = processedFixtures.reduce((acc: any, fixture: any) => {
        const status = fixture.fixture?.status?.short || "UNKNOWN";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      console.log(
        `📈 [TodaysMatchesByCountryNew] Status breakdown:`,
        statusBreakdown,
      );

      // Live matches analysis
      const liveMatches = processedFixtures.filter((fixture: any) =>
        ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
          fixture.fixture?.status?.short,
        ),
      );

      if (liveMatches.length > 0) {
        console.log(
          `🔴 [TodaysMatchesByCountryNew] Found ${liveMatches.length} live matches:`,
        );
        liveMatches.forEach((fixture: any, index: number) => {
          const now = new Date();
          const matchDate = new Date(fixture.fixture.date);
          const minutesSinceStart = Math.floor(
            (now.getTime() - matchDate.getTime()) / (1000 * 60),
          );

          console.log(
            `🔴 [TodaysMatchesByCountryNew] Live Match ${index + 1}:`,
            {
              fixtureId: fixture.fixture.id,
              teams: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
              status: fixture.fixture.status.short,
              elapsed: fixture.fixture.status.elapsed,
              originalStartTime: fixture.fixture.date,
              minutesSinceScheduledStart: minutesSinceStart,
              score: `${fixture.goals.home || 0}-${fixture.goals.away || 0}`,
              league: fixture.league.name,
              country: fixture.league.country,
            },
          );
        });
      }

      // Country breakdown
      const countryBreakdown = processedFixtures.reduce((acc: any, fixture: any) => {
        const country = fixture.league?.country || "Unknown";
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {});

      console.log(
        `🌍 [TodaysMatchesByCountryNew] Country breakdown:`,
        countryBreakdown,
      );

      // Time analysis
      const now = new Date();
      const selectedDateObj = new Date(selectedDate);
      const timeAnalysis = processedFixtures.map((fixture: any) => {
        const matchDate = new Date(fixture.fixture.date);
        const hoursDiff =
          (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
        const matchDateString = matchDate.toISOString().split("T")[0];
        const isSelectedDate = matchDateString === selectedDate;

        return {
          fixtureId: fixture.fixture.id,
          status: fixture.fixture.status.short,
          matchDateString,
          selectedDate,
          isSelectedDate,
          hoursDiff: Math.round(hoursDiff * 100) / 100,
          isToday: matchDate.toDateString() === now.toDateString(),
        };
      });

      console.log(
        `⏰ [TodaysMatchesByCountryNew] Time analysis (first 10):`,
        timeAnalysis.slice(0, 10),
      );

      // Date filtering analysis
      const dateFilterAnalysis = {
        totalFixtures: processedFixtures.length,
        selectedDate,
        fixturesOnSelectedDate: timeAnalysis.filter((f) => f.isSelectedDate)
          .length,
        fixturesOnToday: timeAnalysis.filter((f) => f.isToday).length,
        statusDistribution: statusBreakdown,
        sampleDateMismatches: timeAnalysis
          .filter((f) => !f.isSelectedDate)
          .slice(0, 5),
      };

      console.log(
        `📅 [TodaysMatchesByCountryNew] Date filtering analysis:`,
        dateFilterAnalysis,
      );
    }
  }, [processedFixtures, selectedDate]);

// Optimized grouping with minimal dependencies to reduce re-renders
  const fixturesByCountry = useMemo(() => {
    if (!validFixtures?.length) {
      return {};
    }

    console.log(`🚀 [TodaysMatchesByCountryNew] Processing ${validFixtures.length} fixtures for grouping`);
    
    const grouped: { [key: string]: { country: string; leagues: any; hasPopularLeague: boolean } } = {};
    const seenFixtures = new Set<number>();
    const seenMatchups = new Set<string>();

    validFixtures.forEach((fixture: any) => {
      // Quick validation
      if (!fixture?.league?.country || !fixture?.fixture?.id || !fixture?.teams) {
        return;
      }

      // Duplicate checks
      if (seenFixtures.has(fixture.fixture.id)) return;
      
      const matchupKey = `${fixture.teams.home.id}-${fixture.teams.away.id}-${fixture.league.id}`;
      if (seenMatchups.has(matchupKey)) return;

      const country = fixture.league.country;
      const leagueId = fixture.league.id;

      // Quick exclusion check (simplified)
      const leagueName = fixture.league.name || "";
      if (shouldExcludeMatchByCountry(leagueName, "", "", false, country)) {
        return;
      }

      // Group by country
      if (!grouped[country]) {
        grouped[country] = { country, leagues: {}, hasPopularLeague: false };
      }

      if (!grouped[country].leagues[leagueId]) {
        grouped[country].leagues[leagueId] = {
          league: fixture.league,
          matches: [],
          isPopular: POPULAR_LEAGUES.includes(leagueId),
        };
      }

      seenFixtures.add(fixture.fixture.id);
      seenMatchups.add(matchupKey);
      grouped[country].leagues[leagueId].matches.push(fixture);
    });

    console.log(`✅ [TodaysMatchesByCountryNew] Grouped into ${Object.keys(grouped).length} countries`);
    return grouped;
  }, [validFixtures.length, selectedDate]); // Minimized dependencies

  // Optimized country initialization with priority-based loading
  useEffect(() => {
    const countryKeys = Object.keys(fixturesByCountry);
    if (countryKeys.length === 0) return;

    // Prioritize countries with live matches first
    const prioritizedCountries = countryKeys.sort((a, b) => {
      const aData = fixturesByCountry[a];
      const bData = fixturesByCountry[b];
      
      // World first
      if (a === "World") return -1;
      if (b === "World") return 1;
      
      // Then countries with live matches
      const aHasLive = Object.values(aData.leagues).some((league: any) =>
        league.matches.some((match: any) =>
          ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(match.fixture.status.short)
        )
      );
      const bHasLive = Object.values(bData.leagues).some((league: any) =>
        league.matches.some((match: any) =>
          ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(match.fixture.status.short)
        )
      );
      
      if (aHasLive && !bHasLive) return -1;
      if (!aHasLive && bHasLive) return 1;
      
      return a.localeCompare(b);
    });

    const initialCountries = prioritizedCountries.slice(0, initialLoadCount);
    setVisibleCountries(new Set(initialCountries));
    console.log(`🎯 [TodaysMatchesByCountryNew] Fast-loaded ${initialCountries.length}/${countryKeys.length} countries`);
  }, [fixturesByCountry, initialLoadCount]);

  // Optimized batch loading - show ALL remaining countries at once
  const loadMoreCountries = useCallback(async () => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    const countryKeys = Object.keys(fixturesByCountry);
    const remainingCountries = countryKeys.filter(country => !visibleCountries.has(country));
    
    if (remainingCountries.length > 0) {
      // Add small delay to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 100));
      setVisibleCountries(prev => new Set([...prev, ...remainingCountries]));
      console.log(`📈 [TodaysMatchesByCountryNew] Loaded ALL ${remainingCountries.length} remaining countries`);
    }
    
    setIsLoadingMore(false);
  }, [fixturesByCountry, visibleCountries, isLoadingMore]);

  // Final summary of grouped data with comprehensive analysis
  const countryStats = Object.entries(fixturesByCountry).map(
    ([country, data]: [string, any]) => ({
      country,
      totalMatches: Object.values(data.leagues).reduce(
        (sum: number, league: any) => sum + league.matches.length,
        0,
      ),
      leagues: Object.keys(data.leagues).length,
      leagueNames: Object.values(data.leagues).map((l: any) => l.league.name),
      sampleMatches: Object.values(data.leagues)
        .flatMap((l: any) => l.matches)
        .slice(0, 3)
        .map((m: any) => ({
          id: m.fixture?.id,
          date: m.fixture?.date,
          status: m.fixture?.status?.short,
          teams: `${m.teams?.home?.name} vs ${m.teams?.away?.name}`,
        })),
    }),
  );

  const groupingAnalysis = {
    selectedDate,
    totalCountries: Object.keys(fixturesByCountry).length,
    totalMatches: countryStats.reduce((sum, c) => sum + c.totalMatches, 0),
    totalLeagues: countryStats.reduce((sum, c) => sum + c.leagues, 0),
    countriesWithMatches: countryStats.filter((c) => c.totalMatches > 0).length,
    topCountries: countryStats
      .sort((a, b) => b.totalMatches - a.totalMatches)
      .slice(0, 5),
    pipeline: {
      step1_rawFixtures: fixtures.length,
      step2_dateFiltered: validFixtures.length,
      step3_countryGrouped: countryStats.reduce(
        (sum, c) => sum + c.totalMatches,
        0,
      ),
      step4_exclusionFiltered: countryStats.reduce(
        (sum, c) => sum + c.totalMatches,
        0,
      ),
    },
  };

  console.log(`📊 [DEBUG] Comprehensive Grouping Analysis:`, groupingAnalysis);

  // Live match prioritization: Live World matches are sorted first
  const sortedCountries = useMemo(() => {
    return Object.values(fixturesByCountry).sort(
      (a: any, b: any) => {
        const countryA = a.country || "";
        const countryB = b.country || "";

        // Check if either country is World
        const aIsWorld = countryA.toLowerCase() === "world";
        const bIsWorld = countryB.toLowerCase() === "world";

        // Check for live matches in each country
        const aHasLive = Object.values(a.leagues).some((league: any) =>
          league.matches.some((match: any) =>
            ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
              match.fixture.status.short,
            ),
          ),
        );
        const bHasLive = Object.values(b.leagues).some((league: any) =>
          league.matches.some((match: any) =>
            ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
              match.fixture.status.short,
            ),
          ),
        );

        // Priority: World with live matches first, then World without live, then others alphabetically
        if (aIsWorld && aHasLive && (!bIsWorld || !bHasLive)) return -1;
        if (bIsWorld && bHasLive && (!aIsWorld || !aHasLive)) return 1;
        if (aIsWorld && !bIsWorld) return -1;
        if (bIsWorld && !aIsWorld) return 1;

        return countryA.localeCompare(countryB);
      },
    );
  }, [Object.keys(fixturesByCountry).length, validFixtures.length]);

  // Start with all countries collapsed by default
  useEffect(() => {
    // Reset to collapsed state when selected date changes
    setExpandedCountries(new Set());

    // Auto-expand the first league in each country by default (using the same sorting logic as display)
    const firstLeagues = new Set<string>();
    const sortedCountriesArray = Object.values(fixturesByCountry).sort(
      (a: any, b: any) => {
        const countryA = a.country || "";
        const countryB = b.country || "";

        // Check if either country is World
        const aIsWorld = countryA.toLowerCase() === "world";
        const bIsWorld = countryB.toLowerCase() === "world";

        // Check for live matches in each country
        const aHasLive = Object.values(a.leagues).some((league: any) =>
          league.matches.some((match: any) =>
            ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
              match.fixture.status.short,
            ),
          ),
        );
        const bHasLive = Object.values(b.leagues).some((league: any) =>
          league.matches.some((match: any) =>
            ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
              match.fixture.status.short,
            ),
          ),
        );

        // Priority: World with live matches first, then World with live, then others alphabetically
        if (aIsWorld && aHasLive && (!bIsWorld || !bHasLive)) return -1;
        if (bIsWorld && bHasLive && (!aIsWorld || !aHasLive)) return 1;
        if (aIsWorld && !bIsWorld) return -1;
        if (bIsWorld && !aIsWorld) return 1;

        return countryA.localeCompare(countryB);
      },
    );

    sortedCountriesArray.forEach((countryData: any) => {
      const sortedLeagues = Object.values(countryData.leagues).sort(
        (a: any, b: any) => {
          if (a.isPopular && !b.isPopular) return -1;
          if (!a.isPopular && b.isPopular) return 1;
          return a.league.name.localeCompare(b.league.name);
        },
      );

      if (sortedLeagues.length > 0) {
        // Expand the first league after sorting (same order as displayed)
        const firstLeague = sortedLeagues[0];
        const leagueKey = `${countryData.country}-${firstLeague.league.id}`;
        firstLeagues.add(leagueKey);
      }
    });
    setExpandedLeagues(firstLeagues);
  }, [selectedDate, Object.keys(fixturesByCountry).length]);

  // Lazy flag loading with intersection observer
  const flagObserver = useRef<IntersectionObserver | null>(null);
  const countryRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Initialize intersection observer for lazy flag loading
  useEffect(() => {
    if (typeof window === 'undefined') return;

    flagObserver.current = new IntersectionObserver(
      (entries) => {
        const newFlags: { [country: string]: string } = {};
        
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const country = entry.target.getAttribute('data-country');
            if (country && !flagMap[country]) {
              const syncFlag = getCountryFlagWithFallbackSync(country);
              if (syncFlag) {
                newFlags[country] = syncFlag;
              }
            }
          }
        });

        if (Object.keys(newFlags).length > 0) {
          setFlagMap(prev => ({ ...prev, ...newFlags }));
          console.log(`⚡ [Flags] Lazy-loaded ${Object.keys(newFlags).length} flags via intersection observer`);
        }
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    return () => {
      flagObserver.current?.disconnect();
    };
  }, []);

  // Observe country elements for lazy flag loading
  const observeCountryElement = useCallback((element: HTMLElement | null, country: string) => {
    if (!element || !flagObserver.current) return;
    
    const existingElement = countryRefs.current.get(country);
    if (existingElement) {
      flagObserver.current.unobserve(existingElement);
    }
    
    countryRefs.current.set(country, element);
    element.setAttribute('data-country', country);
    flagObserver.current.observe(element);
  }, []);

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

  const toggleHideMatch = (matchId: number) => {
    setHiddenMatches((prev) => {
      const newHidden = new Set(prev);
      if (newHidden.has(matchId)) {
        newHidden.delete(matchId);
      } else {
        newHidden.add(matchId);
      }
      return newHidden;
    });
  };



  const toggleLeague = (country: string, leagueId: number) => {
    const leagueKey = `${country}-${leagueId}`;
    const newExpanded = new Set(expandedLeagues);
    if (newExpanded.has(leagueKey)) {
      newExpanded.delete(leagueKey);
    } else {
      newExpanded.add(leagueKey);
    }
    setExpandedLeagues(newExpanded);
  };

  // Enhanced match status logic
  const getMatchStatus = (fixture: any) => {
    const status = fixture.fixture.status.short;
    const fixtureDate = new Date(fixture.fixture.date);
    const now = new Date();
    const hoursAgo = differenceInHours(now, fixtureDate);

    // Finished matches
    if (
      ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status)
    ) {
      if (hoursAgo <= 2) return "Just Finished";
      if (hoursAgo <= 24) return "Recent";
      return status;
    }

    // Live matches
    if (["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
      return status === "HT" ? "Half Time" : "LIVE";
    }

    // Upcoming matches
    if (fixtureDate < now && status === "NS") {
      return "Delayed";
    }

    return "Scheduled";
  };

  const getStatusColor = (fixture: any) => {
    const status = fixture.fixture.status.short;
    const fixtureDate = new Date(fixture.fixture.date);
    const now = new Date();
    const hoursAgo = differenceInHours(now, fixtureDate);

    if (
      ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status)
    ) {
      if (hoursAgo <= 2) return "bg-green-100 text-green-700 font-semibold";
      return "bg-gray-100 text-gray-700 font-semibold";
    }

    if (["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
      return "bg-red-100 text-red-700 font-semibold";
    }

    if (fixtureDate < now && status === "NS") {
      return "bg-orange-100 text-orange-700";
    }

    return "bg-blue-100 text-blue-700";
  };

  // Get header title based on button states and selected date (client timezone aware)
  const getHeaderTitle = () => {
    // Check for different button states first
    if (liveFilterActive && timeFilterActive) {
      return "Popular Football Live Score";
    } else if (liveFilterActive && !timeFilterActive) {
      return "Live Football Scores";
    } else if (!liveFilterActive && timeFilterActive) {
      return "All Matches by Time";
    }

    // Default behavior based on selected date (client timezone)
    const selectedDateObj = new Date(selectedDate);

    if (isDateStringToday(selectedDate)) {
      return "Today's Football Matches by Country";
    } else if (isDateStringYesterday(selectedDate)) {
      return "Yesterday's Football Matches by Country";
    } else if (isDateStringTomorrow(selectedDate)) {
      return "Tomorrow's Football Matches by Country";
    } else {
      // Custom date - format it nicely
      try {
        const customDate = parseISO(selectedDate);
        if (isValid(customDate)) {
          return `${format(customDate, "EEEE, MMMM do")} Football Matches by Country`;
        } else {
          return "Football Matches by Country";
        }
      } catch {
        return "Football Matches by Country";
      }
    }
  };

  // Enhanced effect to detect status and score changes with flash effects
  useEffect(() => {
    if (!validFixtures?.length) return;

    const newHalftimeMatches = new Set<number>();
    const newFulltimeMatches = new Set<number>();
    const newGoalMatches = new Set<number>();
    const currentStatuses = new Map<number, string>();
    const currentScores = new Map<number, {home: number, away: number}>();

    validFixtures.forEach((fixture) => {
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
      }

      // Check for goal changes (when score changes but status stays the same or during live matches)
      if (previousScore && ['1H', '2H', 'LIVE'].includes(currentStatus)) {
        const scoreChanged = currentScore.home !== previousScore.home || currentScore.away !== previousScore.away;
        if (scoreChanged) {
          console.log(`⚽ [GOAL FLASH] Match ${matchId} score changed!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousScore: `${previousScore.home}-${previousScore.away}`,
            currentScore: `${currentScore.home}-${currentScore.away}`,
            status: currentStatus
          });
          newGoalMatches.add(matchId);
        }
      }
    });

    // Update previous statuses and scores AFTER checking for changes
    setPreviousMatchStatuses(currentStatuses);
    setPreviousMatchScores(currentScores);

    // Trigger flash for new halftime matches
    if (newHalftimeMatches.size > 0) {
      setHalftimeFlashMatches(newHalftimeMatches);
      setTimeout(() => {
        setHalftimeFlashMatches(new Set());
      }, 3000);
    }

    // Trigger flash for new fulltime matches
    if (newFulltimeMatches.size > 0) {
      setFulltimeFlashMatches(newFulltimeMatches);
      setTimeout(() => {
        setFulltimeFlashMatches(new Set());
      }, 3000);
    }

    // Trigger flash for goal changes
    if (newGoalMatches.size > 0) {
      setGoalFlashMatches(newGoalMatches);
      setTimeout(() => {
        setGoalFlashMatches(new Set());
      }, 2000); // Shorter duration for goals
    }
  }, [validFixtures]);

  // Prefetch function for background loading
  const prefetchMatchData = useCallback(async (fixtureId: number) => {
    try {
      // Prefetch match details, lineups, and stats in background
      const promises = [
        apiRequest("GET", `/api/fixtures/${fixtureId}`),
        apiRequest("GET", `/api/fixtures/${fixtureId}/lineups`).catch(
          () => null,
        ),
        apiRequest("GET", `/api/fixtures/${fixtureId}/statistics`).catch(
          () => null,
        ),
      ];
      await Promise.allSettled(promises);
    } catch (error) {
      console.warn("Background prefetch failed for fixture:", fixtureId);
    }
  }, []);

  // Show error state with retry option
  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="text-red-500 font-medium text-sm">{error}</div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading only if we're actually loading and have no data
  if (isLoading && !fixtures.length) {
    return (
      <Card className="mt-4">
        <CardHeader className="flex flex-row justify-between items-center space-y-0 p-2 border-b border-stone-200">
          <div className="flex justify-between items-center w-full">
            <h3
              className="font-semibold"
              style={{
                fontFamily:
                  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontSize: "13.3px",
              }}
            >
              {getHeaderTitle()}
            </h3>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
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

  if (!validFixtures.length) {
    return null; // Let parent component handle empty state
  }

  // Format the time for display in user's local timezone
  const formatMatchTime = (dateString: string | null | undefined) => {
    if (!dateString || typeof dateString !== "string") return "--:--";

    try {
      // Parse UTC time and convert to user's local timezone automatically
      const utcDate = parseISO(dateString);
      if (!isValid(utcDate)) return "--:--";

      // format() automatically converts to user's local timezone
      return format(utcDate, "HH:mm");
    } catch (error) {
      console.error("Error formatting match time:", error);
      return "--:--";
    }
  };

  const isMatchLive = (
    status: string | null | undefined,
    dateString: string | null | undefined,
  ) => {
    if (!status || !dateString) return false;

    const liveStatuses = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"];

    // Check if status indicates live match
    if (liveStatuses.some((liveStatus) => status.includes(liveStatus))) {
      return true;
    }

    // For "NS" (Not Started) status, check if match time is within reasonable live window
    if (status === "NS") {
      try {
        const matchTime = new Date(dateString);
        const now = new Date();
        const diffInMinutes =
          (now.getTime() - matchTime.getTime()) / (1000 * 60);

        // Consider it live if it's within 15 minutes of start time
        return diffInMinutes >= 0 && diffInMinutes <= 15;
      } catch (error) {
        console.error("Error checking live match status:", error);
        return false;
      }
    }

    return false;
  };

  return (
    <Card className="mt-4 dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="flex flex-row justify-between items-center space-y-0 p-2 border-b border-stone-200 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex justify-between items-center w-full">
          <h3
            className="font-semibold text-gray-900 dark:text-white"
            style={{
              fontFamily:
                "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: "13.3px",
            }}
          >
            {getHeaderTitle()}
          </h3>
        </div>
      </CardHeader>
      <CardContent className="p-0 dark:bg-gray-800">
        <div className="country-matches-container todays-matches-by-country-container dark:bg-gray-800">
          {/* Use sortedCountries with lazy loading */}
          {sortedCountries
            .filter((countryData: any) => visibleCountries.has(countryData.country))
            .map((countryData: any) => {
            const isExpanded = expandedCountries.has(countryData.country);
            const totalMatches = Object.values(countryData.leagues).reduce(
              (sum: number, league: any) => sum + league.matches.length,
              0,
            );

            // Count live and recent matches for badge
            const liveMatches = Object.values(countryData.leagues).reduce(
              (count: number, league: any) => {
                return (
                  count +
                  league.matches.filter((match: any) => {
                    const status = match.fixture.status.short;

                    // Check if match finished more than 4 hours ago
                    const matchDateTime = new Date(match.fixture.date);
                    const hoursOld = (Date.now() - matchDateTime.getTime()) / (1000 * 60 * 60);
                    const isStaleFinishedMatch =
                      (["FT", "AET", "PEN"].includes(status) && hoursOld > 4) ||
                      (["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status) && hoursOld > 4) ||
                      (hoursOld > 4 && ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(status));

                    // Only count as live if status indicates live and match is not stale
                    return ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status) && 
                           !isStaleFinishedMatch && 
                           hoursOld <= 4;
                  }).length
                );
              },
              0,
            );

            const recentMatches = Object.values(countryData.leagues).reduce(
              (count: number, league: any) => {
                return (
                  count +
                  league.matches.filter((match: any) => {
                    const status = match.fixture.status.short;
                    const hoursAgo = differenceInHours(
                      new Date(),
                      new Date(match.fixture.date),
                    );
                    return (
                      ["FT", "AET", "PEN"].includes(status) && hoursAgo <= 3
                    );
                  }).length
                );
              },
              0,
            );

            return (
              <div
                key={countryData.country}
                className={`border-b border-gray-100 last:border-b-0 country-section ${
                  isExpanded ? "expanded" : "collapsed"
                }`}
              >
                <button
                  ref={(el) => observeCountryElement(el, countryData.country)}
                  onClick={() =>
                    toggleCountry(
                      typeof countryData.country === "string"
                        ? countryData.country
                        : countryData.country?.name || "Unknown",
                    )
                  }
                  className={`w-full p-4 flex items-center justify-between transition-colors pt-[12px] pb-[12px] font-normal text-[14.7px] country-header-button border-b border-stone-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 ${
                    isExpanded ? "expanded" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 font-normal text-[14px]">
                    {(() => {
                      const countryName =
                        typeof countryData.country === "string"
                          ? countryData.country
                          : countryData.country?.name || "Unknown";

                      // Special case for World - use COTIF tournament logo with consistent styling
                      if (countryName === "World") {
                        return (
                          <MyCountryGroupFlag
                            teamName="World"
                            fallbackUrl="/assets/matchdetaillogo/cotif tournament.png"
                            alt="World"
                            className="country-group-flag-header"
                          />
                        );
                      }

                      // For all other countries, use MyCountryGroupFlag
                      return (
                        <MyCountryGroupFlag
                          teamName={countryName}
                          fallbackUrl="/assets/fallback-logo.svg"
                          alt={countryName}
                          className="country-group-flag-header"
                        />
                      );
                    })()}
                    <span
                      className="font-medium text-gray-900 dark:text-white"
                      style={{
                        fontFamily:
                          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        fontSize: "13.3px",
                      }}
                    >
                      {typeof countryData.country === "string"
                        ? countryData.country
                        : countryData.country?.name || "Unknown"}
                    </span>
                    <span
                      className="text-gray-500 dark:text-white"
                      style={{
                        fontFamily:
                          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        fontSize: "13.3px",
                      }}
                    >
                      ({totalMatches})
                    </span>

                    {/* Live/Recent badges */}
                    {liveMatches > 0 && (
                      <span
                        className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded-full font-medium"
                        style={{
                          fontFamily:
                            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                          fontSize: "13.3px",
                        }}
                      >
                        {liveMatches} LIVE
                      </span>
                    )}
                    {recentMatches > 0 && !liveMatches && (
                      <span
                        className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full font-medium"
                        style={{
                          fontFamily:
                            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                          fontSize: "13.3px",
                        }}
                      >
                        {recentMatches} Recent
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp
                      className={`h-4 w-4 text-gray-500 dark:text-gray-400 chevron-icon rotated`}
                    />
                  ) : (
                    <ChevronDown
                      className={`h-4 w-4 text-gray-500 dark:text-gray-400 chevron-icon`}
                    />
                  )}
                </button>
                {isExpanded && (
                  <div
                    className={`bg-gray-50 dark:bg-gray-900 border-t border-stone-200 dark:border-gray-700 league-content ${
                      isExpanded ? "expanded" : "collapsed"
                    }`}
                  >
                    {/* Sort leagues - popular first */}
                    {Object.values(countryData.leagues)
                      .sort((a: any, b: any) => {
                        if (a.isPopular && !b.isPopular) return -1;
                        if (!a.isPopular && b.isPopular) return 1;
                        return a.league.name.localeCompare(b.league.name);
                      })
                      .map((leagueData: any, leagueIndex: number) => {
                        const leagueKey = `${countryData.country}-${leagueData.league.id}`;
                        const isFirstLeague = leagueIndex === 0;

                        // First league should be expanded by default, rest should be collapsed
                        const isLeagueExpanded = expandedLeagues.has(leagueKey);return (
                          <div
                            key={leagueData.league.id}
                            className="border-b border-stone-200 dark:border-gray-700 last:border-b-0"
                          >
                            {/* League Header - Now clickable */}
                            <button
                              onClick={() =>
                                toggleLeague(
                                  countryData.country,
                                  leagueData.league.id,
                                )
                              }
                              className={`w-full flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border-b border-stone-200 dark:border-gray-700 transition-colors cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700`}
                            >
                              <img
                                src={(() => {
                                  const leagueName = leagueData.league.name?.toLowerCase() || "";

                                  // Use specific COTIF tournament logo
                                  if (leagueName.includes("cotif")) {
                                    return "/assets/matchdetaillogo/cotif tournament.png";
                                  }

                                  return leagueData.league.logo || "/assets/fallback-logo.svg";
                                })()}
                                alt={leagueData.league.name || "Unknown League"}
                                className="w-6 h-6 object-contain rounded-full"
                                style={{ backgroundColor: "transparent" }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const leagueName = leagueData.league.name?.toLowerCase() || "";

                                  // If COTIF logo fails, try fallback
                                  if (leagueName.includes("cotif") && !target.src.includes("fallback-logo.svg")) {
                                    target.src = "/assets/fallback-logo.svg";
                                  } else if (!target.src.includes("fallback-logo.svg")) {
                                    target.src = "/assets/fallback-logo.svg";
                                  }
                                }}
                              />
                              <div className="flex flex-col flex-1 text-left">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="font-semibold text-gray-800 dark:text-gray-100 group-hover:underline transition-all duration-200"
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
                                    className="text-gray-500 dark:text-white"
                                    style={{
                                      fontFamily:
                                        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                                      fontSize: "13.3px",
                                    }}
                                  >
                                    ({leagueData.matches.length})
                                  </span>
                                  {(() => {
                                    const liveMatchesInLeague =
                                      leagueData.matches.filter((match: any) => {
                                        const status = match.fixture.status.short;

                                        // Check if match finished more than 4 hours ago
                                        const matchDateTime = new Date(match.fixture.date);
                                        const hoursOld = (Date.now() - matchDateTime.getTime()) / (1000 * 60 * 60);
                                        const isStaleFinishedMatch =
                                          (["FT", "AET", "PEN"].includes(status) && hoursOld > 4) ||
                                          (["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status) && hoursOld > 4) ||
                                          (hoursOld > 4 && ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(status));

                                        // Only count as live if status indicates live and match is not stale
                                        return ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status) && 
                                               !isStaleFinishedMatch && 
                                               hoursOld <= 4;
                                      }).length;

                                    if (liveMatchesInLeague > 0) {
                                      return (
                                        <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded-full font-semibold">
                                          {liveMatchesInLeague} LIVE
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {leagueData.league.country ||
                                    "Unknown Country"}
                                </span>
                              </div>
                              <div className="flex gap-2 items-center">
                              </div>
                            </button>

                            {/* Matches - Show when league is expanded OR when it's the first league */}
                            {isLeagueExpanded && (
                              <div
                                className="space-y-0 league-matches-container"
                                style={{
                                  animation: isLeagueExpanded
                                    ? "slideDown 0.3s ease-out"
                                    : "slideUp 0.3s ease-out",
                                }}
                              >
                                {leagueData.matches
                                  .filter((match: any) => {
                                    // Only filter out hidden matches
                                    return !hiddenMatches.has(match.fixture.id);
                                  })
                                  .map((match: any, matchIndex) => (

                                    <div
                                      key={`${match.fixture.id}-${countryData.country}-${leagueData.league.id}-${matchIndex}`}
                                      className={`match-card-container group ${
                                        halftimeFlashMatches.has(match.fixture.id) ? 'halftime-flash' : ''
                                      } ${
                                        fulltimeFlashMatches.has(match.fixture.id) ? 'fulltime-flash' : ''
                                      } ${
                                        goalFlashMatches.has(match.fixture.id) ? 'goal-flash' : ''
                                      }`}
                                      onClick={() => {
                                        console.log(`🔍 [MATCH DEBUG] Clicked match:`, {
                                          fixtureId: match.fixture.id,
                                          fixtureDate: match.fixture.date,
                                          teams: `${match.teams.home.name} vs ${match.teams.away.name}`,
                                          selectedDate,
                                          status: match.fixture.status.short,
                                          dataSource: 'TodaysMatchesByCountryNew'
                                        });
                                        onMatchCardClick?.(match);
                                      }}
                                      style={{
                                        cursor: onMatchCardClick
                                          ? "pointer"
                                          : "default",
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
                                        {/* Top grid for match status - EXACTLY like MyNewLeague2 */}
                                        <div className="match-status-top">
                                          {(() => {
                                            const status = match.fixture.status.short;
                                            const elapsed = match.fixture.status.elapsed;

                                            // Check if match finished more than 4 hours ago
                                            const matchDateTime = new Date(match.fixture.date);
                                            const hoursOld = (Date.now() - matchDateTime.getTime()) / (1000 * 60 * 60);
                                            const isStaleFinishedMatch =
                                              (["FT", "AET", "PEN"].includes(status) && hoursOld > 4) ||
                                              (["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status) && hoursOld > 4) ||
                                              (hoursOld > 4 && ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(status));

                                            // Show live status only for truly live matches (not finished and not stale)
                                            if (
                                              !["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status) &&
                                              !isStaleFinishedMatch &&
                                              hoursOld <= 4 &&
                                              ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)
                                            ) {
                                              let displayText = "";
                                              let statusClass = "status-live-elapsed";

                                              if (status === "HT") {
                                                displayText = "Halftime";
                                                statusClass = "status-halftime";
                                              } else if (status === "P") {
                                                displayText = "Penalties";
                                              } else if (status === "ET") {
                                                if (elapsed) {
                                                  const extraTime = elapsed - 90;
                                                  displayText = extraTime > 0 ? `90' + ${extraTime}'` : `${elapsed}'`;
                                                } else {
                                                  displayText = "Extra Time";
                                                }
                                              } else if (status === "BT") {
                                                displayText = "Break Time";
                                              } else if (status === "INT") {
                                                displayText = "Interrupted";
                                              } else {
                                                displayText = elapsed ? `${elapsed}'` : "LIVE";
                                              }

                                              return (
                                                <div className={`match-status-label ${statusClass}`}>
                                                  {displayText}
                                                </div>
                                              );
                                            }

                                            // Postponed/Cancelled matches
                                            if (
                                              ["PST", "CANC", "ABD", "SUSP", "AWD", "WO"].includes(status)
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

                                            // Check for overdue matches that should be marked as postponed
                                            if (status === "NS" || status === "TBD") {
                                              const matchTime = new Date(match.fixture.date);
                                              const now = new Date();
                                              const hoursAgo = (now.getTime() - matchTime.getTime()) / (1000 * 60 * 60);

                                              // If match is more than 2 hours overdue, show postponed status
                                              if (hoursAgo > 2) {
                                                return (
                                                  <div className="match-status-label status-postponed">
                                                    Postponed
                                                  </div>
                                                );
                                              }

                                              // Show TBD status for matches with undefined time
                                              if (status === "TBD") {
                                                return (
                                                  <div className="match-status-label status-upcoming">
                                                    Time TBD
                                                  </div>
                                                );
                                              }

                                              // For upcoming matches, don't show status in top grid
                                              return null;
                                            }

                                            // Show "Ended" status for finished matches or stale matches
                                            if (
                                              ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status) ||
                                              isStaleFinishedMatch
                                            ) {
                                              return (
                                                <div
                                                  className="match-status-label status-ended"
                                                  style={{
                                                    minWidth: "60px",
                                                    textAlign: "center",
                                                    transition: "none",
                                                    animation: "none",
                                                  }}
                                                >
                                                  {status === "FT" || isStaleFinishedMatch
                                                    ? "Ended"
                                                    : status === "AET"
                                                      ? "After Extra Time"
                                                      : status}
                                                </div>
                                              );
                                            }

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
                                              match.goals.home >
                                                match.goals.away
                                                ? "winner"
                                                : ""
                                            }`}
                                          >
                                            {shortenTeamName(
                                              match.teams.home.name,
                                            ) || "Unknown Team"}
                                          </div>

                                          {/* Home team logo - grid area */}
                                          <div className="home-team-logo-container">
                                            <MyWorldTeamLogo
                                              teamName={match.teams.home.name || ""}
                                              teamId={match.teams.home.id}
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
                                              const status =
                                                match.fixture.status.short;
                                              const fixtureDate = parseISO(
                                                match.fixture.date,
                                              );

                                              // Get smart time filter result for consistent status handling
                                              const smartResult =
                                                MySmartTimeFilter.getSmartTimeLabel(
                                                  match.fixture.date,
                                                  status,
                                                  selectedDate + "T12:00:00Z",
                                                );

                                              // Use smart filter's converted status if available, otherwise use original
                                              const displayStatus = status;

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
                                                ].includes(displayStatus)
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
                                                ].includes(displayStatus)
                                              ) {
                                                // Check if we have actual numerical scores
                                                const homeScore =
                                                  match.goals.home;
                                                const awayScore =
                                                  match.goals.away;
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
                                                  // Match is finished but no valid score data - show time in user's timezone
                                                  return (
                                                    <div
                                                      className="match-time-display"
                                                      style={{
                                                        fontSize: "0.882em",
                                                      }}
                                                    >
                                                      {format(
                                                        fixtureDate,
                                                        "HH:mm",
                                                      )}
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
                                                ].includes(displayStatus)
                                              ) {
                                                return (
                                                  <div
                                                    className="match-time-display"
                                                    style={{
                                                      fontSize: "0.882em",
                                                    }}
                                                  >
                                                    {format(
                                                      fixtureDate,
                                                      "HH:mm",
                                                    )}
                                                  </div>
                                                );
                                              }

                                              // Upcoming matches (NS = Not Started, TBD = To Be Determined)
                                              // Show time in user's local timezone (date-fns format automatically converts from UTC)
                                              return (
                                                <div
                                                  className="match-time-display"
                                                  style={{
                                                    fontSize: "0.882em",
                                                  }}
                                                >
                                                  {displayStatus === "TBD"
                                                    ? "TBD"
                                                    : format(
                                                        fixtureDate,
                                                        "HH:mm",
                                                      )}
                                                </div>
                                              );
                                            })()}
                                          </div>

                                          {/* Away team logo - grid area */}
                                          <div className="away-team-logo-container">
                                            <MyWorldTeamLogo
                                              teamName={match.teams.away.name || ""}
                                              teamId={match.teams.away.id}
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
                                              match.goals.away >
                                                match.goals.home
                                                ? "winner"
                                                : ""
                                            }`}
                                          >
                                            {shortenTeamName(
                                              match.teams.away.name,
                                            ) || "Unknown Team"}
                                          </div>
                                        </div>

                                        {/* Bottom Grid: Penalty Result Status */}
                                        <div className="match-penalty-bottom">
                                          {(() => {
                                            const status =
                                              match.fixture.status.short;
                                            const isPenaltyMatch =
                                              status === "PEN";
                                            const penaltyHome =
                                              match.score?.penalty?.home;
                                            const penaltyAway =
                                              match.score?.penalty?.away;
                                            const hasPenaltyScores =
                                              penaltyHome !== null &&
                                              penaltyHome !== undefined &&
                                              penaltyAway !== null &&
                                              penaltyAway !== undefined;

                                            if (
                                              isPenaltyMatch &&
                                              hasPenaltyScores
                                            ) {
                                              const winnerText =
                                                penaltyHome > penaltyAway
                                                  ? `${shortenTeamName(match.teams.home.name)} won ${penaltyHome}-${penaltyAway} on penalties`
                                                  : `${shortenTeamName(match.teams.away.name)} won ${penaltyAway}-${penaltyHome} on penalties`;

                                              return (
                                                <div className="penalty-result-display">
                                                  <span className="penalty-winner" style={{ backgroundColor: 'transparent' }}>
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
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Optimized Load More Button - Shows ALL remaining countries */}
          {visibleCountries.size < Object.keys(fixturesByCountry).length && (
            <div className="flex justify-center p-4">
              <button
                onClick={loadMoreCountries}
                disabled={isLoadingMore}
                className={`px-4 py-2 text-white rounded-md transition-colors text-sm ${
                  isLoadingMore 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isLoadingMore 
                  ? 'Loading All Countries...' 
                  : `Show All Countries (${Object.keys(fixturesByCountry).length - visibleCountries.size} remaining)`
                }
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodaysMatchesByCountryNew;