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
  const translateLeagueName = useCallback((originalLeague: string): string => {
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
  }, [currentLanguage, contextTranslateLeagueName]);

  // Use the enhanced country translation function
  const translateCountryName = useCallback((originalCountry: string): string => {
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
  }, [currentLanguage, contextTranslateLeagueName]);

  // Add smart team translation function
  const translateTeamNameSmart = useCallback((
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
  }, [currentLanguage, translateTeamName]);

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

  // Optimized popular leagues for prioritization
  const POPULAR_LEAGUES = useMemo(() => [
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
    667,
  ], []);

  // Smart cached data fetching with improved timeout and retry logic
  const today = new Date().toISOString().slice(0, 10);
  const isTodaySelected = selectedDate === today;

  // Improved cache configuration with timeout handling
  const getDynamicCacheConfig = useCallback(() => {
    if (!isTodaySelected) {
      return {
        staleTime: 5 * 60 * 1000, // 5 minutes for non-today dates
        refetchInterval: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      };
    }

    return {
      staleTime: 0, // Always fresh for today
      refetchInterval: 30 * 1000, // 30 seconds refresh
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    };
  }, [isTodaySelected]);

  // Optimized state management
  const [visibleCountries, setVisibleCountries] = useState<Set<string>>(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Use smart cached query with improved error handling
  const {
    data: fixtures = [],
    isLoading,
    error: queryError,
    refetch,
  } = useCachedQuery(
    ["all-fixtures-by-date", selectedDate],
    async () => {
      if (!selectedDate) return [];

      console.log(`🔍 [TodaysMatchesByCountryNew] Fetching for date: ${selectedDate}`);

      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const response = await apiRequest(
          "GET",
          `/api/fixtures/date/${selectedDate}?all=true`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ [TodaysMatchesByCountryNew] Received ${data?.length || 0} fixtures`);

        return Array.isArray(data) ? data : [];
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - server took too long to respond');
        }
        throw error;
      }
    },
    {
      ...getDynamicCacheConfig(),
      enabled: !!selectedDate,
      retry: (failureCount, error) => {
        // Improved retry logic
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        if (errorMessage.includes("timeout") || errorMessage.includes("AbortError")) {
          return failureCount < 2; // Retry timeouts up to 2 times
        }
        if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
          return false; // Don't retry rate limits
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      onError: (err: any) => {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`💥 [TodaysMatchesByCountryNew] Error for ${selectedDate}:`, errorMessage);
      },
    },
  );

  // Improved error handling
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message.includes("timeout") || queryError.message.includes("AbortError")
        ? "Request timeout. Please try again."
        : queryError.message.includes("Failed to fetch") || queryError.message.includes("NetworkError")
          ? "Network connection issue. Please check your connection."
          : "Failed to load fixtures. Please try again."
      : "Unknown error occurred"
    : null;

  // Heavily optimized data processing with web workers simulation
  const processedCountryData = useMemo(() => {
    // Early bail-out for empty data
    if (!fixtures?.length) return {};

    const startTime = performance.now();
    console.log(`🚀 [TodaysMatchesByCountryNew] Processing ${fixtures.length} fixtures`);

    // Use Map for O(1) lookups
    const countryMap = new Map<string, any>();
    const processedFixtures = new Set<number>();

    // Process in optimized chunks to prevent UI blocking
    const validFixtures = fixtures.filter(fixture => {
      if (!fixture?.fixture?.id || !fixture?.teams || !fixture?.league) return false;
      if (processedFixtures.has(fixture.fixture.id)) return false;
      if (!fixture.fixture.date?.startsWith(selectedDate)) return false;
      if (!fixture.league.country) return false;

      processedFixtures.add(fixture.fixture.id);
      return true;
    });

    // Batch processing to prevent blocking
    for (const fixture of validFixtures) {
      const country = fixture.league.country;
      const leagueId = fixture.league.id;
      const leagueName = fixture.league.name || "";

      // Quick exclusion check
      if (shouldExcludeMatchByCountry(leagueName, "", "", false, country)) {
        continue;
      }

      // Efficient map-based grouping
      if (!countryMap.has(country)) {
        countryMap.set(country, {
          country,
          leagues: new Map(),
          hasPopularLeague: false,
        });
      }

      const countryData = countryMap.get(country);
      if (!countryData.leagues.has(leagueId)) {
        const isPopular = POPULAR_LEAGUES.includes(leagueId);
        countryData.leagues.set(leagueId, {
          league: fixture.league,
          matches: [],
          isPopular,
        });
        if (isPopular) countryData.hasPopularLeague = true;
      }

      countryData.leagues.get(leagueId).matches.push(fixture);
    }

    // Convert Maps to Objects for final result
    const result = {};
    for (const [country, countryData] of countryMap) {
      result[country] = {
        ...countryData,
        leagues: Object.fromEntries(countryData.leagues)
      };
    }

    const processingTime = performance.now() - startTime;
    console.log(`⚡ [TodaysMatchesByCountryNew] Processed in ${processingTime.toFixed(2)}ms`);

    return result;
  }, [fixtures, selectedDate, POPULAR_LEAGUES]);

  // Extract valid fixtures and country list with better performance
  const { validFixtures, countryList } = useMemo(() => {
    const startTime = performance.now();
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

    const processingTime = performance.now() - startTime;
    console.log(`📊 [TodaysMatchesByCountryNew] Country extraction: ${processingTime.toFixed(2)}ms`);

    return {
      validFixtures: allValidFixtures,
      countryList: sortedCountries,
    };
  }, [processedCountryData]);

  // Validate early return
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

  // Cached country display name function
  const getCountryDisplayName = useCallback((
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

    // Additional mappings for common variations
    const additionalMappings: { [key: string]: string } = {
      "czech republic": "Czech-Republic",
      "india": "India",
      "ae": "United Arab Emirates",
      "united arab emirates": "United Arab Emirates",
      "uae": "United Arab Emirates",
      "ba": "Bosnia & Herzegovina",
      "mk": "North Macedonia",
      "sa": "Saudi Arabia",
      "saudi arabia": "Saudi Arabia",
      "gb": "United Kingdom",
      "united kingdom": "United Kingdom",
      "us": "United States",
      "usa": "United States",
      "united states": "United States",
    };

    const cleanCountry = country.trim().toLowerCase();
    const displayName =
      countryNameMap[cleanCountry] ||
      additionalMappings[cleanCountry] ||
      country;

    // Cache the result
    setCachedCountryName(country, displayName, "country-mapping");

    return displayName;
  }, []);

  // Optimized country loading with progressive rendering
  useEffect(() => {
    if (countryList.length === 0) {
      setVisibleCountries(new Set());
      return;
    }

    // Use requestIdleCallback for non-blocking updates
    const scheduleCountryBatch = (countries: string[], startIndex: number) => {
      if (startIndex >= countries.length) return;

      requestIdleCallback(() => {
        const batchSize = Math.min(10, countries.length - startIndex);
        const batch = countries.slice(startIndex, startIndex + batchSize);

        setVisibleCountries(prev => new Set([...prev, ...batch]));

        // Schedule next batch
        if (startIndex + batchSize < countries.length) {
          scheduleCountryBatch(countries, startIndex + batchSize);
        }
      }, { timeout: 50 });
    };

    // Start progressive loading
    scheduleCountryBatch(countryList, 0);
  }, [countryList]);

  const getCountryData = useCallback(
    (country: string) => {
      return processedCountryData[country];
    },
    [processedCountryData],
  );

  // Optimized toggle functions
  const toggleCountry = useCallback((country: string) => {
    setExpandedCountries(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(country)) {
        newExpanded.delete(country);
        // Also collapse all leagues in this country
        setExpandedLeagues(prevLeagues => {
          const newExpandedLeagues = new Set(prevLeagues);
          const countryData = getCountryData(country);
          if (countryData) {
            Object.values(countryData.leagues).forEach((leagueData: any) => {
              const leagueKey = `${country}-${leagueData.league.id}`;
              newExpandedLeagues.delete(leagueKey);
            });
          }
          return newExpandedLeagues;
        });
      } else {
        newExpanded.add(country);
        // Auto-expand first league
        const countryData = getCountryData(country);
        if (countryData) {
          const leagues = Object.values(countryData.leagues);
          if (leagues.length > 0) {
            const sortedLeagues = leagues.sort((a: any, b: any) => {
              if (a.isPopular && !b.isPopular) return -1;
              if (!a.isPopular && b.isPopular) return 1;
              return a.league.name.localeCompare(b.league.name);
            });

            const firstLeague = sortedLeagues[0] as any;
            const firstLeagueKey = `${country}-${firstLeague.league.id}`;

            setExpandedLeagues(prevLeagues => {
              const newExpandedLeagues = new Set(prevLeagues);
              newExpandedLeagues.add(firstLeagueKey);
              return newExpandedLeagues;
            });
          }
        }
      }
      return newExpanded;
    });
  }, [getCountryData]);

  const toggleStarMatch = useCallback((matchId: number) => {
    setStarredMatches(prev => {
      const newStarred = new Set(prev);
      if (newStarred.has(matchId)) {
        newStarred.delete(matchId);
      } else {
        newStarred.add(matchId);
      }
      return newStarred;
    });
  }, []);

  const toggleLeague = useCallback((country: string, leagueId: number) => {
    const leagueKey = `${country}-${leagueId}`;
    setExpandedLeagues(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(leagueKey)) {
        newExpanded.delete(leagueKey);
      } else {
        newExpanded.add(leagueKey);
      }
      return newExpanded;
    });
  }, []);

  // Get header title based on selected date
  const getHeaderTitle = useCallback(() => {
    if (liveFilterActive && timeFilterActive) {
      return "Popular Football Live Score";
    } else if (liveFilterActive && !timeFilterActive) {
      return "Live Football Scores";
    } else if (!liveFilterActive && timeFilterActive) {
      return "All Matches by Time";
    }

    if (isDateStringToday(selectedDate)) {
      return "Today's Football Matches by Country";
    } else if (isDateStringYesterday(selectedDate)) {
      return "Yesterday's Football Matches by Country";
    } else if (isDateStringTomorrow(selectedDate)) {
      return "Tomorrow's Football Matches by Country";
    } else {
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
  }, [selectedDate, liveFilterActive, timeFilterActive]);

  // Enhanced flash effects with cleanup
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

      // Check for status changes
      if (previousStatus && previousStatus !== currentStatus) {
        if (currentStatus === "HT") {
          newHalftimeMatches.add(matchId);
        }
        if (currentStatus === "FT") {
          newFulltimeMatches.add(matchId);
        }
      }

      // Check for score changes
      if (previousScore && ["1H", "2H", "LIVE"].includes(currentStatus)) {
        const scoreChanged =
          currentScore.home !== previousScore.home ||
          currentScore.away !== previousScore.away;
        if (scoreChanged) {
          newGoalMatches.add(matchId);
        }
      }
    });

    setPreviousMatchStatuses(currentStatuses);
    setPreviousMatchScores(currentScores);

    // Flash effects with cleanup
    if (newHalftimeMatches.size > 0) {
      setHalftimeFlashMatches(newHalftimeMatches);
      const timeoutId = setTimeout(() => setHalftimeFlashMatches(new Set()), 3000);
      return () => clearTimeout(timeoutId);
    }

    if (newFulltimeMatches.size > 0) {
      setFulltimeFlashMatches(newFulltimeMatches);
      const timeoutId = setTimeout(() => setFulltimeFlashMatches(new Set()), 3000);
      return () => clearTimeout(timeoutId);
    }

    if (newGoalMatches.size > 0) {
      setGoalFlashMatches(newGoalMatches);
      const timeoutId = setTimeout(() => setGoalFlashMatches(new Set()), 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [validFixtures]);

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

  // Get visible countries list
  const visibleCountriesList = countryList.filter((country) => visibleCountries.has(country));

  // Format match time
  const formatMatchTime = useCallback((dateString: string | null | undefined) => {
    if (!dateString || typeof dateString !== "string") return "--:--";

    try {
      const utcDate = parseISO(dateString);
      if (!isValid(utcDate)) return "--:--";
      return format(utcDate, "HH:mm");
    } catch (error) {
      console.error("Error formatting match time:", error);
      return "--:--";
    }
  }, []);

  // Optimized Country Section with better memoization
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
    }) => {
      const totalMatches = Object.values(countryData.leagues).reduce(
        (sum: number, league: any) => sum + league.matches.length,
        0,
      );

      const liveMatches = Object.values(countryData.leagues).reduce(
        (count: number, league: any) => {
          return (
            count +
            league.matches.filter((match: any) => {
              const status = match.fixture.status.short;
              return ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status);
            }).length
          );
        },
        0,
      );

      return (
        <div className={`border-b border-gray-100 last:border-b-0 country-section ${isExpanded ? "expanded" : "collapsed"}`}>
          <button
            onClick={() => onToggleCountry(countryData.country)}
            className={`w-full p-4 flex items-center justify-between transition-colors pt-[12px] pb-[12px] font-normal text-[14.7px] country-header-button border-b border-stone-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 ${isExpanded ? "expanded" : ""}`}
          >
            <div className="flex items-center gap-3 font-normal text-[14px]">
              <MyCountryGroupFlag
                teamName={countryData.country === "World" ? "World" : countryData.country}
                fallbackUrl={countryData.country === "World" ? "/assets/matchdetaillogo/cotif tournament.png" : "/assets/fallback-logo.svg"}
                alt={countryData.country}
                className="country-group-flag-header"
              />
              <span
                className="font-medium text-gray-900 dark:text-white"
                style={{
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontSize: "13.3px",
                }}
              >
                {translateCountryName(countryData.country)}
              </span>
              <span
                className="text-gray-500 dark:text-white"
                style={{
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontSize: "13.3px",
                }}
              >
                ({totalMatches})
              </span>

              {liveMatches > 0 && (
                <span
                  className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded-full font-medium"
                  style={{
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: "13.3px",
                  }}
                >
                  {liveMatches} LIVE
                </span>
              )}
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400 chevron-icon rotated" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 chevron-icon" />
            )}
          </button>
          {isExpanded && (
            <div className="bg-gray-50 dark:bg-gray-900 border-t border-stone-200 dark:border-gray-700 league-content">
              {Object.values(countryData.leagues)
                .sort((a: any, b: any) => {
                  if (a.isPopular && !b.isPopular) return -1;
                  if (!a.isPopular && b.isPopular) return 1;
                  return a.league.name.localeCompare(b.league.name);
                })
                .map((leagueData: any) => {
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
      return (
        prevProps.country === nextProps.country &&
        prevProps.isExpanded === nextProps.isExpanded &&
        prevProps.expandedLeagues.size === nextProps.expandedLeagues.size &&
        prevProps.starredMatches.size === nextProps.starredMatches.size
      );
    },
  );

  // Optimized League Section
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
        return ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status);
      }).length;

      return (
        <div className="border-b border-stone-200 dark:border-gray-700 last:border-b-0">
          <button
            onClick={() => onToggleLeague(countryData.country, leagueData.league.id)}
            className="w-full flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border-b border-stone-200 dark:border-gray-700 transition-colors cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700"
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
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/assets/fallback-logo.svg";
              }}
            />
            <div className="flex flex-col flex-1 text-left">
              <div className="flex items-center gap-2">
                <span
                  className="font-semibold text-gray-800 dark:text-gray-100 group-hover:underline transition-all duration-200"
                  style={{
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: "13.3px",
                  }}
                >
                  {translateLeagueName(safeSubstring(leagueData.league.name, 0) || "Unknown League")}
                </span>
                <span
                  className="text-gray-500 dark:text-white"
                  style={{
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
                {translateCountryName(leagueData.league.country || "Unknown Country")}
              </span>
            </div>
          </button>

          {isLeagueExpanded && (
            <div className="space-y-0 league-matches-container">
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

  // Optimized Match Card
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
        onClick={() => onMatchClick?.(match)}
        style={{ cursor: onMatchClick ? "pointer" : "default" }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStarMatch(match.fixture.id);
          }}
          className="match-star-button"
          title="Add to favorites"
        >
          <Star
            className={`match-star-icon ${
              starredMatches.has(match.fixture.id) ? "starred" : ""
            }`}
          />
        </button>

        <div className="match-three-grid-container">
          {/* Match status */}
          <div className="match-status-top">
            {(() => {
              const status = match.fixture.status.short;
              const elapsed = match.fixture.status.elapsed;

              if (["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                if (status === "HT") {
                  return <div className="match-status-label status-live-elapsed">Halftime</div>;
                } else if (elapsed) {
                  return <div className="match-status-label status-live-elapsed">{elapsed}'</div>;
                }
                return <div className="match-status-label status-live-elapsed">LIVE</div>;
              }

              if (["FT", "AET", "PEN"].includes(status)) {
                return <div className="match-status-label status-finished">Ended</div>;
              }

              return null;
            })()}
          </div>

          {/* Main match content */}
          <div className="match-content-container">
            {/* Home team */}
            <div
              className={`home-team-name ${
                match.goals.home !== null &&
                match.goals.away !== null &&
                match.goals.home > match.goals.away
                  ? "winner"
                  : ""
              }`}
            >
              {shortenTeamName(translateTeamNameSmart(match.teams.home.name || "Unknown Team", {
                name: leagueData.league.name,
                country: leagueData.league.country,
              }))}
            </div>

            <div className="home-team-logo-container">
              <MyWorldTeamLogo
                teamName={match.teams.home.name || ""}
                teamId={match.teams.home.id}
                teamLogo={
                  match.teams.home.id
                    ? `/api/team-logo/square/${match.teams.home.id}?size=32`
                    : "/assets/matchdetaillogo/fallback.png"
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

            {/* Score/Time center */}
            <div className="match-score-container">
              {(() => {
                const status = match.fixture.status.short;
                const fixtureDate = parseISO(match.fixture.date);

                if (["FT", "AET", "PEN"].includes(status) || ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                  const homeScore = match.goals.home;
                  const awayScore = match.goals.away;

                  if (homeScore !== null && awayScore !== null) {
                    return (
                      <div className="match-score-display">
                        <span className="score-number">{homeScore}</span>
                        <span className="score-separator">-</span>
                        <span className="score-number">{awayScore}</span>
                      </div>
                    );
                  }
                }

                return (
                  <div className="match-time-display">
                    {formatMatchTime(match.fixture.date)}
                  </div>
                );
              })()}
            </div>

            <div className="away-team-logo-container">
              <MyWorldTeamLogo
                teamName={match.teams.away.name || ""}
                teamId={match.teams.away.id}
                teamLogo={
                  match.teams.away.id
                    ? `/api/team-logo/square/${match.teams.away.id}?size=32`
                    : "/assets/matchdetaillogo/fallback.png"
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

            <div
              className={`away-team-name ${
                match.goals.home !== null &&
                match.goals.away !== null &&
                match.goals.away > match.goals.home
                  ? "winner"
                  : ""
              }`}
            >
              {shortenTeamName(translateTeamNameSmart(match.teams.away.name || "Unknown Team", {
                name: leagueData.league.name,
                country: leagueData.league.country,
              }))}
            </div>
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
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: "13.3px",
            }}
          >
            {getHeaderTitle()}
          </h3>
        </div>
      </CardHeader>
      <CardContent className="p-0 dark:bg-gray-800">
        <div className="country-matches-container todays-matches-by-country-container dark:bg-gray-800">
          {visibleCountriesList.map((country: string) => {
            const countryData = getCountryData(country);
            if (!countryData) return null;

            const isExpanded = expandedCountries.has(countryData.country);

            return (
              <CountrySection
                key={`${countryData.country}-${selectedDate}`}
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
              />
            );
          })}

          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <div className="animate-pulse text-gray-500 text-sm">
                Loading more countries...
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodaysMatchesByCountryNew;