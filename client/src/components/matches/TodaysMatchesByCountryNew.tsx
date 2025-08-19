import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Calendar, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useCachedQuery, CacheManager } from "@/lib/cachingHelper";
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
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";
import { smartLeagueCountryTranslation } from "@/lib/smartLeagueCountryTranslation";
import { smartTeamTranslation } from "@/lib/smartTeamTranslation";

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
  const {
    translateLeagueName: contextTranslateLeagueName,
    translateTeamName,
    currentLanguage,
  } = useLanguage();
  const { t } = useTranslation();

  // Add league name translation
  const translateLeagueName = (originalLeague: string): string => {
    if (!originalLeague) return "";

    // Use smart league translation
    const translated = smartLeagueCountryTranslation.translateLeagueName(
      originalLeague,
      currentLanguage,
    );
    if (translated !== originalLeague) {
      return translated;
    }

    // Fallback to context translation
    return contextTranslateLeagueName(originalLeague);
  };

  // Use the enhanced country translation function
  const translateCountryName = (originalCountry: string): string => {
    if (!originalCountry) return "";

    // Use smart country translation
    const translated = smartLeagueCountryTranslation.translateCountryName(
      originalCountry,
      currentLanguage,
    );
    if (translated !== originalCountry) {
      return translated;
    }

    // Fallback to context translation for untranslated countries
    return contextTranslateLeagueName(originalCountry);
  };

  // Add smart team translation function
  const translateTeamNameSmart = (
    originalTeam: string,
    leagueInfo?: any,
  ): string => {
    if (!originalTeam) return "";

    // Use smart team translation
    const translated = smartTeamTranslation.translateTeamName(
      originalTeam,
      currentLanguage,
      leagueInfo,
    );
    if (translated !== originalTeam) {
      return translated;
    }

    // Fallback to context translation
    return translateTeamName ? translateTeamName(originalTeam) : originalTeam;
  };
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(),
  );
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(
    new Set(),
  );
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  const [hiddenMatches, setHiddenMatches] = useState<Set<number>>(new Set());
  // Flash animation states
  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(
    new Set(),
  );
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(
    new Set(),
  );
  const [previousMatchStatuses, setPreviousMatchStatuses] = useState<
    Map<number, string>
  >(new Map());
  const [goalFlashMatches, setGoalFlashMatches] = useState<Set<number>>(
    new Set(),
  );
  const [previousMatchScores, setPreviousMatchScores] = useState<
    Map<number, { home: number; away: number }>
  >(new Map());

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
    2,
    3,
    848,
    15,
    5,
    8,
    16,
    // Top European Leagues
    39,
    140,
    135,
    78,
    61,
    94,
    88,
    179,
    218,
    // Major International Competitions
    22,
    9,
    13,
    4,
    21,
    914,
    // European Second Tier Leagues
    144,
    103,
    106,
    119,
    113,
    203,
    345,
    384,
    317,
    244,
    // Major American Leagues
    253,
    71,
    72,
    73,
    128,
    274,
    556,
    // Asian Leagues
    292,
    301,
    188,
    169,
    271,
    294,
    279,
    290,
    // African & Middle Eastern Leagues
    307,
    233,
    239,
    302,
    383,
    551,
    332,
    556,
    // South American Leagues
    71,
    72,
    325,
    265,
    267,
    268,
    269,
    270,
    // European Third Tier Leagues
    327,
    329,
    361,
    365,
    218,
    319,
    373,
    380,
    // Additional Regional Leagues
    114,
    116,
    120,
    121,
    122,
    123,
    124,
    125,
    126,
    127,
    // Club Friendlies
    667, // Friendlies Clubs
  ]; // Significantly expanded to include major leagues from all continents

  // Smart cached data fetching using useCachedQuery like MyNewLeague2
  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === today;

  // Immediate display cache configuration - show cached data instantly
  const getDynamicCacheConfig = () => {
    if (!isToday) {
      // Historical or future dates - show cached data immediately
      return {
        staleTime: 24 * 60 * 60 * 1000, // 24 hours - consider data fresh for longer
        refetchInterval: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        networkMode: "online",
        retry: 1,
      };
    }

    // Today's matches - show cached data immediately, refresh in background
    return {
      staleTime: 5 * 60 * 1000, // 5 minutes - show cached data immediately
      refetchInterval: 30 * 1000, // 30 seconds background refresh
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: "online",
      retry: 2,
    };
  };

  // Show all countries immediately - no lazy loading
  const [visibleCountries, setVisibleCountries] = useState<Set<string>>(
    new Set(),
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Use smart cached query
  const {
    data: fixtures = [],
    isLoading,
    error: queryError,
    refetch,
  } = useCachedQuery(
    ["all-fixtures-by-date", selectedDate],
    async () => {
      if (!selectedDate) return [];

      console.log(
        `🔍 [TodaysMatchesByCountryNew] Smart fetch for date: ${selectedDate}`,
      );

      const response = await apiRequest(
        "GET",
        `/api/fixtures/date/${selectedDate}?all=true`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log(
        `✅ [TodaysMatchesByCountryNew] Smart cached: ${data?.length || 0} fixtures`,
      );

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
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";

        if (
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("NetworkError")
        ) {
          console.warn(
            `🌐 [TodaysMatchesByCountryNew] Network issue for date: ${selectedDate}`,
          );
        } else if (errorMessage.includes("timeout")) {
          console.warn(
            `⏱️ [TodaysMatchesByCountryNew] Request timeout for date: ${selectedDate}`,
          );
        } else {
          console.error(
            `💥 [TodaysMatchesByCountryNew] Smart cache error for date: ${selectedDate}:`,
            err,
          );
        }
      },
    },
  );

  // Error handling with user-friendly messages
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message.includes("Failed to fetch") ||
        queryError.message.includes("NetworkError")
        ? "Network connection issue. Please check your internet connection and try again."
        : queryError.message.includes("timeout")
          ? "Request timeout. The server took too long to respond."
          : "Failed to load fixtures. Please try again later."
      : "Unknown error occurred"
    : null;

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
      const hoursUntilKickoff =
        (matchTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilKickoff > 0 && hoursUntilKickoff <= 2; // Within 2 hours
    });

    const imminentMatches = fixtures.filter((match: any) => {
      if (match.fixture?.status?.short !== "NS") return false;
      const matchTime = new Date(match.fixture.date);
      const minutesUntilKickoff =
        (matchTime.getTime() - now.getTime()) / (1000 * 60);
      return minutesUntilKickoff > 0 && minutesUntilKickoff <= 30; // Within 30 minutes
    });

    if (liveMatches.length > 0 && isToday) {
      console.log(
        `🔴 [TodaysMatchesByCountryNew] ${liveMatches.length} live matches detected - using most aggressive cache (30s refresh)`,
      );
    } else if (imminentMatches.length > 0 && isToday) {
      console.log(
        `🟡 [TodaysMatchesByCountryNew] ${imminentMatches.length} matches starting within 30min - using aggressive cache`,
      );
    } else if (upcomingMatches.length > 0 && isToday) {
      console.log(
        `🟠 [TodaysMatchesByCountryNew] ${upcomingMatches.length} matches starting within 2h - using moderate cache`,
      );
    } else if (isToday && liveMatches.length === 0) {
      console.log(
        `🔵 [TodaysMatchesByCountryNew] Today but no live/imminent matches - using standard cache`,
      );
    } else {
      console.log(
        `⚫ [TodaysMatchesByCountryNew] Non-today date - using extended cache`,
      );
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

  // Optimized data processing with immediate cache return
  const processedCountryData = useMemo(() => {
    const cacheKey = `processed-country-data-${selectedDate}`;

    // Return cached data immediately if available - longer cache for better UX
    const cached = CacheManager.getCachedData(
      [cacheKey],
      isToday ? 10 * 60 * 1000 : 60 * 60 * 1000,
    );
    if (cached) {
      console.log(
        `📦 [Cache Hit] Returning cached processed data for ${selectedDate} with ${Object.keys(cached).length} countries`,
      );
      return cached;
    }

    // Early return for empty data
    if (!fixtures?.length) return {};

    // Optimized processing with reduced operations
    const countryMap = new Map<string, any>();
    const seenFixtures = new Set<number>();

    // Single pass processing
    for (const fixture of fixtures) {
      // Quick validation
      if (
        !fixture?.fixture?.id ||
        !fixture?.teams ||
        !fixture?.league ||
        seenFixtures.has(fixture.fixture.id)
      )
        continue;

      // Date validation (optimized)
      const fixtureDate = fixture.fixture.date;
      if (!fixtureDate || !fixtureDate.startsWith(selectedDate)) continue;

      const country = fixture.league.country;
      if (!country) continue;

      seenFixtures.add(fixture.fixture.id);

      // Skip exclusions for faster processing
      const leagueId = fixture.league.id;
      const leagueName = fixture.league.name || "";

      if (shouldExcludeMatchByCountry(leagueName, "", "", false, country))
        continue;

      // Build country data structure
      if (!countryMap.has(country)) {
        countryMap.set(country, {
          country,
          leagues: {},
          hasPopularLeague: false,
        });
      }

      const countryData = countryMap.get(country);
      if (!countryData.leagues[leagueId]) {
        const isPopular = POPULAR_LEAGUES.includes(leagueId);
        countryData.leagues[leagueId] = {
          league: fixture.league,
          matches: [],
          isPopular,
        };
        if (isPopular) countryData.hasPopularLeague = true;
      }

      countryData.leagues[leagueId].matches.push(fixture);
    }

    // Convert to object
    const result = Object.fromEntries(countryMap);

    // Cache result
    CacheManager.setCachedData([cacheKey], result);

    return result;
  }, [fixtures, selectedDate]);

  // Extract valid fixtures and country list from processed data
  const { validFixtures, countryList } = useMemo(() => {
    const allValidFixtures: any[] = [];
    const countries: string[] = [];

    Object.values(processedCountryData).forEach((countryData: any) => {
      if (countryData.country) {
        countries.push(countryData.country);

        // Extract all matches from all leagues in this country
        Object.values(countryData.leagues).forEach((leagueData: any) => {
          allValidFixtures.push(...leagueData.matches);
        });
      }
    });

    // Sort countries with World first
    const sortedCountries = countries.sort((a, b) => {
      if (a === "World") return -1;
      if (b === "World") return 1;
      return a.localeCompare(b);
    });

    return {
      validFixtures: allValidFixtures,
      countryList: sortedCountries,
    };
  }, [processedCountryData]);

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
    if (
      lastFilterCache?.current?.key === cacheKey &&
      lastFilterCache?.current?.data
    ) {
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

  // Simplified logging for performance
  useEffect(() => {
    if (validFixtures && validFixtures.length > 0) {
      const liveMatches = validFixtures.filter((fixture: any) =>
        ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
          fixture.fixture?.status?.short,
        ),
      );

      console.log(
        `⚡ [TodaysMatchesByCountryNew] Processed ${validFixtures.length} fixtures (${liveMatches.length} live) for ${selectedDate}`,
      );
    }
  }, [validFixtures.length, selectedDate]);

  // Show countries immediately with batching for large lists
  useEffect(() => {
    if (countryList.length === 0) return;

    // For large lists, batch the updates to prevent UI blocking
    if (countryList.length > 50) {
      const batchSize = 20;
      let currentIndex = 0;

      const addBatch = () => {
        const batch = countryList.slice(currentIndex, currentIndex + batchSize);
        setVisibleCountries((prev) => new Set([...prev, ...batch]));
        currentIndex += batchSize;

        if (currentIndex < countryList.length) {
          requestAnimationFrame(addBatch);
        }
      };

      addBatch();
    } else {
      // For smaller lists, show all immediately
      setVisibleCountries(new Set(countryList));
    }
  }, [countryList]);

  const getCountryData = useCallback(
    (country: string) => {
      return processedCountryData[country];
    },
    [processedCountryData],
  );

  // No additional initialization needed - handled above

  // Optimized batch loading with progressive enhancement
  const loadMoreCountries = useCallback(async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    const remainingCountries = countryList.filter(
      (country) => !visibleCountries.has(country),
    );

    if (remainingCountries.length > 0) {
      // Progressive loading in smaller chunks to prevent UI blocking
      const chunkSize = 10;
      const chunks = [];
      for (let i = 0; i < remainingCountries.length; i += chunkSize) {
        chunks.push(remainingCountries.slice(i, i + chunkSize));
      }

      // Load all chunks with micro-delays
      for (const chunk of chunks) {
        setVisibleCountries((prev) => new Set([...prev, ...chunk]));
        if (chunks.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      console.log(
        `📈 [TodaysMatchesByCountryNew] Progressively loaded ${remainingCountries.length} countries`,
      );
    }

    setIsLoadingMore(false);
  }, [countryList, visibleCountries, isLoadingMore]);

  // Lightweight analysis - only when needed
  const analysisStats = useMemo(
    () => ({
      selectedDate,
      totalCountries: countryList.length,
      totalMatches: validFixtures.length,
      visibleCountries: visibleCountries.size,
      cachedCountries: Object.keys(processedCountryData).length,
    }),
    [
      selectedDate,
      countryList.length,
      validFixtures.length,
      visibleCountries.size,
      processedCountryData,
    ],
  );

  console.log(
    `⚡ [TodaysMatchesByCountryNew] Lightweight Analysis:`,
    analysisStats,
  );

  // No need for heavy sorting - countries are already sorted in countryList
  const visibleCountriesList = useMemo(
    () => countryList.filter((country) => visibleCountries.has(country)),
    [countryList, Array.from(visibleCountries).join(",")],
  );

  // No auto-expansion - all countries start collapsed
  useEffect(() => {
    // Start with all countries collapsed - users must manually expand
    setExpandedCountries(new Set<string>());
    setExpandedLeagues(new Set<string>());

    console.log(
      `📦 [No Auto-expand] All ${countryList.length} countries start collapsed - manual expansion required`,
    );
  }, [
    selectedDate,
    countryList.join(","),
    Object.keys(processedCountryData).length,
  ]);

  // Invalidate processed data cache when date changes
  useEffect(() => {
    const previousCacheKey = `processed-country-data-${selectedDate}`;
    // The cache will automatically check if data is stale, but we log the cache strategy
    console.log(
      `🔄 [Cache Strategy] Date changed to ${selectedDate}, will use cached processed data if available`,
    );
  }, [selectedDate]);

  // Simplified flag loading - load all flags immediately for better UX
  const preloadFlags = useCallback(() => {
    if (!countryList.length) return;

    const flagsToLoad: { [country: string]: string } = {};

    countryList.forEach((country) => {
      if (!flagMap[country]) {
        const syncFlag = getCountryFlagWithFallbackSync(country);
        if (syncFlag) {
          flagsToLoad[country] = syncFlag;
        }
      }
    });

    if (Object.keys(flagsToLoad).length > 0) {
      setFlagMap((prev) => ({ ...prev, ...flagsToLoad }));
    }
  }, [countryList, flagMap]);

  // Load flags immediately when countries are available
  useEffect(() => {
    preloadFlags();
  }, [preloadFlags]);

  // Simplified observe function (no-op for compatibility)
  const observeCountryElement = useCallback(
    (_element: HTMLElement | null, _country: string) => {
      // No-op - flags are loaded immediately now
    },
    [],
  );

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
      return t("today_matches_by_country");
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
    const currentScores = new Map<number, { home: number; away: number }>();

    validFixtures.forEach((fixture) => {
      const matchId = fixture.fixture.id;
      const currentStatus = fixture.fixture.status.short;
      const previousStatus = previousMatchStatuses.get(matchId);
      const currentScore = {
        home: fixture.goals.home ?? 0,
        away: fixture.goals.away ?? 0,
      };
      const previousScore = previousMatchScores.get(matchId);

      currentStatuses.set(matchId, currentStatus);
      currentScores.set(matchId, currentScore);

      // Only check for changes if we have a previous status (not on first load)
      if (previousStatus && previousStatus !== currentStatus) {
        // Check if status just changed to halftime
        if (currentStatus === "HT") {
          console.log(
            `🟠 [HALFTIME FLASH] Match ${matchId} just went to halftime!`,
            {
              home: fixture.teams?.home?.name,
              away: fixture.teams?.away?.name,
              previousStatus,
              currentStatus,
            },
          );
          newHalftimeMatches.add(matchId);
        }

        // Check if status just changed to fulltime
        if (currentStatus === "FT") {
          console.log(`🔵 [FULLTIME FLASH] Match ${matchId} just finished!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousStatus,
            currentStatus,
          });
          newFulltimeMatches.add(matchId);
        }
      }

      // Check for goal changes (when score changes but status stays the same or during live matches)
      if (previousScore && ["1H", "2H", "LIVE"].includes(currentStatus)) {
        const scoreChanged =
          currentScore.home !== previousScore.home ||
          currentScore.away !== previousScore.away;
        if (scoreChanged) {
          console.log(`⚽ [GOAL FLASH] Match ${matchId} score changed!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousScore: `${previousScore.home}-${previousScore.away}`,
            currentScore: `${currentScore.home}-${currentScore.away}`,
            status: currentStatus,
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

  // Only show loading if we're actually loading, have no data, and no cached processed data
  if (
    isLoading &&
    !fixtures.length &&
    Object.keys(processedCountryData).length === 0
  ) {
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

  // Only return null if we have no fixtures AND no processed data AND not loading
  if (
    !validFixtures.length &&
    Object.keys(processedCountryData).length === 0 &&
    !isLoading
  ) {
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

  // Optimized country section with stable props
  const CountrySection = React.memo(
    ({
      country,
      countryData,
      isExpanded,
      expandedLeagues,
      starredMatches,
      hiddenMatches,
      halftimeFlashMatches,
      fulltimeFlashMatches,
      goalFlashMatches,
      onToggleCountry,
      onToggleLeague,
      onStarMatch,
      onMatchClick,
      observeCountryElement,
    }: {
      country: string;
      countryData: any;
      isExpanded: boolean;
      expandedLeagues: Set<string>;
      starredMatches: Set<number>;
      hiddenMatches: Set<number>;
      halftimeFlashMatches: Set<number>;
      fulltimeFlashMatches: Set<number>;
      goalFlashMatches: Set<number>;
      onToggleCountry: (country: string) => void;
      onToggleLeague: (country: string, leagueId: number) => void;
      onStarMatch: (matchId: number) => void;
      onMatchClick?: (fixture: any) => void;
      observeCountryElement: (
        element: HTMLElement | null,
        country: string,
      ) => void;
    }) => {
      const totalMatches = Object.values(countryData.leagues).reduce(
        (sum: number, league: any) => sum + league.matches.length,
        0,
      );

      // Count live matches for badge
      const liveMatches = Object.values(countryData.leagues).reduce(
        (count: number, league: any) => {
          return (
            count +
            league.matches.filter((match: any) => {
              const status = match.fixture.status.short;
              const matchDateTime = new Date(match.fixture.date);
              const hoursOld =
                (Date.now() - matchDateTime.getTime()) / (1000 * 60 * 60);
              const isStaleFinishedMatch =
                (["FT", "AET", "PEN"].includes(status) && hoursOld > 4) ||
                ([
                  "FT",
                  "AET",
                  "PEN",
                  "AWD",
                  "WO",
                  "ABD",
                  "CANC",
                  "SUSP",
                ].includes(status) &&
                  hoursOld > 4) ||
                (hoursOld > 4 &&
                  ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(
                    status,
                  ));

              return (
                ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
                  status,
                ) &&
                !isStaleFinishedMatch &&
                hoursOld <= 4
              );
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
              return ["FT", "AET", "PEN"].includes(status) && hoursAgo <= 3;
            }).length
          );
        },
        0,
      );

      return (
        <div
          className={`border-b border-gray-100 last:border-b-0 country-section ${
            isExpanded ? "expanded" : "collapsed"
          }`}
        >
          <button
            ref={(el) => observeCountryElement(el, countryData.country)}
            onClick={() =>
              onToggleCountry(
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
                {translateCountryName(
                  typeof countryData.country === "string"
                    ? countryData.country
                    : countryData.country?.name || "Unknown",
                )}
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
              {/* Leagues content */}
              {Object.values(countryData.leagues)
                .sort((a: any, b: any) => {
                  if (a.isPopular && !b.isPopular) return -1;
                  if (!a.isPopular && b.isPopular) return 1;
                  return a.league.name.localeCompare(b.league.name);
                })
                .map((leagueData: any, leagueIndex: number) => {
                  const leagueKey = `${countryData.country}-${leagueData.league.id}`;
                  const isLeagueExpanded = expandedLeagues.has(leagueKey);

                  return (
                    <LeagueSection
                      key={leagueData.league.id}
                      leagueData={leagueData}
                      countryData={countryData}
                      leagueKey={leagueKey}
                      isLeagueExpanded={isLeagueExpanded}
                      starredMatches={starredMatches}
                      hiddenMatches={hiddenMatches}
                      halftimeFlashMatches={halftimeFlashMatches}
                      fulltimeFlashMatches={fulltimeFlashMatches}
                      goalFlashMatches={goalFlashMatches}
                      onToggleLeague={onToggleLeague}
                      onStarMatch={onStarMatch}
                      onMatchClick={onMatchClick}
                    />
                  );
                })}
            </div>
          )}
        </div>
      );
    },
    (prevProps, nextProps) => {
      // Custom comparison for better memoization
      return (
        prevProps.country === nextProps.country &&
        prevProps.isExpanded === nextProps.isExpanded &&
        prevProps.countryData === nextProps.countryData &&
        prevProps.expandedLeagues === nextProps.expandedLeagues &&
        prevProps.starredMatches === nextProps.starredMatches &&
        prevProps.hiddenMatches === nextProps.hiddenMatches &&
        prevProps.halftimeFlashMatches === nextProps.halftimeFlashMatches &&
        prevProps.fulltimeFlashMatches === nextProps.fulltimeFlashMatches &&
        prevProps.goalFlashMatches === nextProps.goalFlashMatches
      );
    },
  );

  // Optimized league section component
  const LeagueSection = React.memo(
    ({
      leagueData,
      countryData,
      leagueKey,
      isLeagueExpanded,
      starredMatches,
      hiddenMatches,
      halftimeFlashMatches,
      fulltimeFlashMatches,
      goalFlashMatches,
      onToggleLeague,
      onStarMatch,
      onMatchClick,
    }: {
      leagueData: any;
      countryData: any;
      leagueKey: string;
      isLeagueExpanded: boolean;
      starredMatches: Set<number>;
      hiddenMatches: Set<number>;
      halftimeFlashMatches: Set<number>;
      fulltimeFlashMatches: Set<number>;
      goalFlashMatches: Set<number>;
      onToggleLeague: (country: string, leagueId: number) => void;
      onStarMatch: (matchId: number) => void;
      onMatchClick?: (fixture: any) => void;
    }) => {
      const liveMatchesInLeague = leagueData.matches.filter((match: any) => {
        const status = match.fixture.status.short;
        const matchDateTime = new Date(match.fixture.date);
        const hoursOld =
          (Date.now() - matchDateTime.getTime()) / (1000 * 60 * 60);
        const isStaleFinishedMatch =
          (["FT", "AET", "PEN"].includes(status) && hoursOld > 4) ||
          (["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(
            status,
          ) &&
            hoursOld > 4) ||
          (hoursOld > 4 &&
            ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(
              status,
            ));

        return (
          ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status) &&
          !isStaleFinishedMatch &&
          hoursOld <= 4
        );
      }).length;

      return (
        <div className="border-b border-stone-200 dark:border-gray-700 last:border-b-0">
          <button
            onClick={() =>
              onToggleLeague(countryData.country, leagueData.league.id)
            }
            className={`w-full flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border-b border-stone-200 dark:border-gray-700 transition-colors cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700`}
          >
            <img
              src={(() => {
                const leagueName = leagueData.league.name?.toLowerCase() || "";
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
                if (
                  leagueName.includes("cotif") &&
                  !target.src.includes("fallback-logo.svg")
                ) {
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
                  {translateLeagueName(
                    safeSubstring(leagueData.league.name, 0) ||
                      "Unknown League",
                  )}
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
                {liveMatchesInLeague > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded-full font-semibold">
                    {liveMatchesInLeague} LIVE
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {translateCountryName(
                  leagueData.league.country || "Unknown Country",
                )}
              </span>
            </div>
          </button>

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
                .filter((match: any) => !hiddenMatches.has(match.fixture.id))
                .map((match: any, matchIndex: number) => (
                  <MatchCard
                    key={`${match.fixture.id}-${countryData.country}-${leagueData.league.id}-${matchIndex}`}
                    match={match}
                    leagueData={leagueData}
                    starredMatches={starredMatches}
                    halftimeFlashMatches={halftimeFlashMatches}
                    fulltimeFlashMatches={fulltimeFlashMatches}
                    goalFlashMatches={goalFlashMatches}
                    onStarMatch={onStarMatch}
                    onMatchClick={onMatchClick}
                  />
                ))}
            </div>
          )}
        </div>
      );
    },
  );

  // Memoized match card component
  const MatchCard = React.memo(
    ({
      match,
      leagueData,
      starredMatches,
      halftimeFlashMatches,
      fulltimeFlashMatches,
      goalFlashMatches,
      onStarMatch,
      onMatchClick,
    }: {
      match: any;
      leagueData: any;
      starredMatches: Set<number>;
      halftimeFlashMatches: Set<number>;
      fulltimeFlashMatches: Set<number>;
      goalFlashMatches: Set<number>;
      onStarMatch: (matchId: number) => void;
      onMatchClick?: (fixture: any) => void;
    }) => (
      <div
        className={`match-card-container group ${
          halftimeFlashMatches.has(match.fixture.id) ? "halftime-flash" : ""
        } ${
          fulltimeFlashMatches.has(match.fixture.id) ? "fulltime-flash" : ""
        } ${goalFlashMatches.has(match.fixture.id) ? "goal-flash" : ""}`}
        onClick={() => {
          console.log(`🔍 [MATCH DEBUG] Clicked match:`, {
            fixtureId: match.fixture.id,
            fixtureDate: match.fixture.date,
            teams: `${match.teams.home.name} vs ${match.teams.away.name}`,
            status: match.fixture.status.short,
            dataSource: "TodaysMatchesByCountryNew",
          });
          onMatchClick?.(match);
        }}
        style={{
          cursor: onMatchClick ? "pointer" : "default",
        }}
      >
        {/* Star Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStarMatch(match.fixture.id);
          }}
          className="match-star-button"
          title="Add to favorites"
          onMouseEnter={(e) => {
            e.currentTarget.closest(".group")?.classList.add("disable-hover");
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

        {/* Match content - updated to use proper grid positioning like MyNewLeague2 */}
        <div className="match-three-grid-container">
          {/* Top Grid: Match Status and Elapsed Time */}
          <div className="match-status-top">
            {(() => {
              const status = match.fixture.status.short;
              const elapsed = match.fixture.status.elapsed;

              // Check if match finished more than 4 hours ago for stale status
              const matchDateTime = new Date(match.fixture.date);
              const hoursOld =
                (Date.now() - matchDateTime.getTime()) / (1000 * 60 * 60);
              const isStaleFinishedMatch =
                (["FT", "AET", "PEN"].includes(status) && hoursOld > 4) ||
                ([
                  "FT",
                  "AET",
                  "PEN",
                  "AWD",
                  "WO",
                  "ABD",
                  "CANC",
                  "SUSP",
                ].includes(status) &&
                  hoursOld > 4) ||
                (hoursOld > 4 &&
                  ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(
                    status,
                  ));

              // Function to translate match status
              const translateMatchStatus = (statusText: string): string => {
                if (currentLanguage === "en") return statusText;

                const statusTranslations: Record<
                  string,
                  Record<string, string>
                > = {
                  Halftime: {
                    zh: "中场休息",
                    "zh-hk": "中場休息",
                    "zh-tw": "中場休息",
                    es: "Descanso",
                    de: "Halbzeit",
                    it: "Intervallo",
                    pt: "Intervalo",
                  },
                  Penalties: {
                    zh: "点球",
                    "zh-hk": "點球",
                    "zh-tw": "點球",
                    es: "Penales",
                    de: "Elfmeterschießen",
                    it: "Rigori",
                    pt: "Pênaltis",
                  },
                  "Break Time": {
                    zh: "休息时间",
                    "zh-hk": "休息時間",
                    "zh-tw": "休息時間",
                    es: "Descanso",
                    de: "Pause",
                    it: "Pausa",
                    pt: "Intervalo",
                  },
                  Interrupted: {
                    zh: "中断",
                    "zh-hk": "中斷",
                    "zh-tw": "中斷",
                    es: "Interrumpido",
                    de: "Unterbrochen",
                    it: "Interrotto",
                    pt: "Interrompido",
                  },
                  LIVE: {
                    zh: "直播",
                    "zh-hk": "直播",
                    "zh-tw": "直播",
                    es: "En Vivo",
                    de: "Live",
                    it: "Live",
                    pt: "Ao Vivo",
                  },
                  Ended: {
                    zh: "结束",
                    "zh-hk": "結束",
                    "zh-tw": "結束",
                    es: "Finalizado",
                    de: "Beendet",
                    it: "Finito",
                    pt: "Terminado",
                  },
                  "After ET": {
                    zh: "加时后",
                    "zh-hk": "加時後",
                    "zh-tw": "延長賽後",
                    es: "Después de ET",
                    de: "Nach Verl.",
                    it: "Dopo i TS",
                    pt: "Após Prorr.",
                  },
                  Awarded: {
                    zh: "判定",
                    "zh-hk": "判定",
                    "zh-tw": "判定",
                    es: "Otorgado",
                    de: "Zuerkannt",
                    it: "Assegnato",
                    pt: "Atribuído",
                  },
                  Walkover: {
                    zh: "不战而胜",
                    "zh-hk": "不戰而勝",
                    "zh-tw": "不戰而勝",
                    es: "WO",
                    de: "Kampflos",
                    it: "A tavolino",
                    pt: "WO",
                  },
                  Abandoned: {
                    zh: "放弃",
                    "zh-hk": "放棄",
                    "zh-tw": "放棄",
                    es: "Abandonado",
                    de: "Abgebrochen",
                    it: "Abbandonato",
                    pt: "Abandonado",
                  },
                  Cancelled: {
                    zh: "取消",
                    "zh-hk": "取消",
                    "zh-tw": "取消",
                    es: "Cancelado",
                    de: "Abgesagt",
                    it: "Annullato",
                    pt: "Cancelado",
                  },
                  Suspended: {
                    zh: "暂停",
                    "zh-hk": "暫停",
                    "zh-tw": "暫停",
                    es: "Suspendido",
                    de: "Unterbrochen",
                    it: "Sospeso",
                    pt: "Suspenso",
                  },
                  Postponed: {
                    zh: "推迟",
                    "zh-hk": "推遲",
                    "zh-tw": "延期",
                    es: "Pospuesto",
                    de: "Verschoben",
                    it: "Rinviato",
                    pt: "Adiado",
                  },
                  "Time TBD": {
                    zh: "时间待定",
                    "zh-hk": "時間待定",
                    "zh-tw": "時間待定",
                    es: "Hora por confirmar",
                    de: "Zeit offen",
                    it: "Orario da definire",
                    pt: "Horário a definir",
                  },
                };

                return (
                  statusTranslations[statusText]?.[currentLanguage] ||
                  statusText
                );
              };

              // Live status and elapsed time
              if (
                ![
                  "FT",
                  "AET",
                  "PEN",
                  "AWD",
                  "WO",
                  "ABD",
                  "CANC",
                  "SUSP",
                ].includes(status) &&
                !isStaleFinishedMatch &&
                hoursOld <= 4 &&
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
                  displayText = translateMatchStatus("Halftime");
                } else if (status === "P") {
                  displayText = translateMatchStatus("Penalties");
                } else if (status === "ET") {
                  const extraTime = elapsed ? elapsed - 90 : 0;
                  displayText =
                    extraTime > 0 ? `90' + ${extraTime}'` : `${elapsed}'`;
                } else if (status === "BT") {
                  displayText = translateMatchStatus("Break Time");
                } else if (status === "INT") {
                  displayText = translateMatchStatus("Interrupted");
                } else {
                  displayText = elapsed
                    ? `${elapsed}'`
                    : translateMatchStatus("LIVE");
                }
                return (
                  <div className="match-status-label status-live-elapsed">
                    {displayText}
                  </div>
                );
              }

              // Finished matches - show final status
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
                ].includes(status) ||
                isStaleFinishedMatch
              ) {
                const statusText =
                  status === "FT"
                    ? "Ended"
                    : status === "AET"
                      ? "After ET"
                      : status === "PEN"
                        ? "Penalties"
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
                                  : status;

                return (
                  <div className="match-status-label status-finished">
                    {translateMatchStatus(statusText)}
                  </div>
                );
              }

              // Postponed/Cancelled matches
              if (
                ["PST", "CANC", "ABD", "SUSP", "AWD", "WO"].includes(status)
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
                    {translateMatchStatus(statusText)}
                  </div>
                );
              }

              // Overdue matches that should be marked as postponed
              if (status === "NS" || status === "TBD") {
                const matchTime = new Date(match.fixture.date);
                const now = new Date();
                const hoursAgo =
                  (now.getTime() - matchTime.getTime()) / (1000 * 60 * 60);

                if (hoursAgo > 2) {
                  return (
                    <div className="match-status-label status-postponed">
                      {translateMatchStatus("Postponed")}
                    </div>
                  );
                }
                if (status === "TBD") {
                  return (
                    <div className="match-status-label status-upcoming">
                      {translateMatchStatus("Time TBD")}
                    </div>
                  );
                }
                // For NS status, don't show any status label - only show kick-off time in the center
                return null;
              }

              return null;
            })()}
          </div>

          {/* Main Grid: Match Content with proper grid positioning */}
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
              {(() => {
                const originalName = match.teams.home.name || "Unknown Team";
                const translatedName = translateTeamNameSmart(originalName, {
                  name: leagueData.league.name,
                  country: leagueData.league.country,
                });
                return shortenTeamName(translatedName);
              })()}
            </div>

            {/* Home team logo */}
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

            {/* Score/Time Center */}
            <div className="match-score-container">
              {(() => {
                const status = match.fixture.status.short;
                const fixtureDate = parseISO(match.fixture.date);

                const matchDateTime = new Date(match.fixture.date);
                const hoursOld =
                  (Date.now() - matchDateTime.getTime()) / (1000 * 60 * 60);
                const isStaleFinishedMatch =
                  (["FT", "AET", "PEN"].includes(status) && hoursOld > 4) ||
                  ([
                    "FT",
                    "AET",
                    "PEN",
                    "AWD",
                    "WO",
                    "ABD",
                    "CANC",
                    "SUSP",
                  ].includes(status) &&
                    hoursOld > 4) ||
                  (hoursOld > 4 &&
                    ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(
                      status,
                    ));

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
                  ].includes(status) ||
                  isStaleFinishedMatch
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
                        <span className="score-number">{homeScore}</span>
                        <span className="score-separator">-</span>
                        <span className="score-number">{awayScore}</span>
                      </div>
                    );
                  } else {
                    // Show time if score data is missing
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

                // Live matches - show current score
                if (
                  !isStaleFinishedMatch &&
                  hoursOld <= 4 &&
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
                        <span className="score-number">{homeScore}</span>
                        <span className="score-separator">-</span>
                        <span className="score-number">{awayScore}</span>
                      </div>
                    );
                  }
                }

                // Postponed/Cancelled matches - show kick-off time
                if (
                  ["PST", "CANC", "ABD", "SUSP", "AWD", "WO"].includes(status)
                ) {
                  return (
                    <div className="match-time-display">
                      {format(fixtureDate, "HH:mm")}
                    </div>
                  );
                }

                // Upcoming matches - show kick-off time
                if (status === "NS" || status === "TBD") {
                  const matchTime = new Date(match.fixture.date);
                  const now = new Date();
                  const hoursAgo =
                    (now.getTime() - matchTime.getTime()) / (1000 * 60 * 60);

                  if (hoursAgo > 2) {
                    return (
                      <div className="match-time-display">
                        {format(fixtureDate, "HH:mm")}
                      </div>
                    );
                  }
                  if (status === "TBD") {
                    return <div className="match-time-display">TBD</div>;
                  }
                  return (
                    <div className="match-time-display">
                      {format(fixtureDate, "HH:mm")}
                    </div>
                  );
                }

                return null;
              })()}
            </div>

            {/* Away team logo */}
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
              {(() => {
                const originalName = match.teams.away.name || "Unknown Team";
                const translatedName = translateTeamNameSmart(originalName, {
                  name: leagueData.league.name,
                  country: leagueData.league.country,
                });
                return shortenTeamName(translatedName);
              })()}
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
                // Function to translate penalty text
                const translatePenaltyText = (text: string): string => {
                  if (currentLanguage === "en") return text;

                  const penaltyTranslations: Record<
                    string,
                    Record<string, string>
                  > = {
                    won: {
                      zh: "获胜",
                      "zh-hk": "獲勝",
                      "zh-tw": "獲勝",
                      es: "ganó",
                      de: "gewann",
                      it: "ha vinto",
                      pt: "venceu",
                    },
                    "on penalties": {
                      zh: "点球",
                      "zh-hk": "點球",
                      "zh-tw": "點球決勝",
                      es: "en penales",
                      de: "im Elfmeterschießen",
                      it: "ai rigori",
                      pt: "nos pênaltis",
                    },
                  };

                  let translatedText = text;
                  Object.entries(penaltyTranslations).forEach(
                    ([english, translations]) => {
                      if (translations[currentLanguage]) {
                        translatedText = translatedText.replace(
                          english,
                          translations[currentLanguage],
                        );
                      }
                    },
                  );

                  return translatedText;
                };

                const homeTeamTranslated = translateTeamNameSmart(
                  match.teams.home.name,
                  {
                    name: leagueData.league.name,
                    country: leagueData.league.country,
                  },
                );
                const awayTeamTranslated = translateTeamNameSmart(
                  match.teams.away.name,
                  {
                    name: leagueData.league.name,
                    country: leagueData.league.country,
                  },
                );

                const winnerText =
                  penaltyHome > penaltyAway
                    ? `${shortenTeamName(homeTeamTranslated)} won ${penaltyHome}-${penaltyAway} on penalties`
                    : `${shortenTeamName(awayTeamTranslated)} won ${penaltyAway}-${penaltyHome} on penalties`;

                return (
                  <div className="penalty-result-display">
                    <span
                      className="penalty-winner"
                      style={{ backgroundColor: "transparent" }}
                    >
                      {translatePenaltyText(winnerText)}
                    </span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    ),
  );

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
          {/* Show subtle loading indicator when refreshing in background */}
          {isLoading && validFixtures.length > 0 && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 dark:bg-gray-800">
        <div className="country-matches-container todays-matches-by-country-container dark:bg-gray-800">
          {/* Use optimized visible countries list */}
          {visibleCountriesList.map((country: string) => {
            const countryData = getCountryData(country);
            const isExpanded = expandedCountries.has(countryData.country);

            return (
              <CountrySection
                key={countryData.country}
                country={countryData.country}
                countryData={countryData}
                isExpanded={isExpanded}
                expandedLeagues={expandedLeagues}
                starredMatches={starredMatches}
                hiddenMatches={hiddenMatches}
                halftimeFlashMatches={halftimeFlashMatches}
                fulltimeFlashMatches={fulltimeFlashMatches}
                goalFlashMatches={goalFlashMatches}
                onToggleCountry={toggleCountry}
                onToggleLeague={toggleLeague}
                onStarMatch={toggleStarMatch}
                onMatchClick={onMatchCardClick}
                observeCountryElement={observeCountryElement}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodaysMatchesByCountryNew;
