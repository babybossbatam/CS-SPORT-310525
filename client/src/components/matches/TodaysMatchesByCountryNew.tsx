import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Calendar, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import {
  getCachedFixturesForDate,
  cacheFixturesForDate,
} from "@/lib/fixtureCache";
import { getCachedCountryName, setCachedCountryName } from "@/lib/countryCache";

import { getCachedTeamLogo } from "../../lib/MyAPIFallback";
import { isNationalTeam } from "../../lib/teamLogoSources";
import { MySmartDateLabeling } from "../../lib/MySmartDateLabeling";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";
import LazyMatchItem from "./LazyMatchItem";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import MyUpdatedFixtureDateSelection from "@/lib/MyUpdatedFixtureDateSelection";
import "../../styles/MyLogoPositioning.css";
import "../../styles/TodaysMatchByCountryNew.css";

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
  const [enableFetching, setEnableFetching] = useState(true);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  const [hiddenMatches, setHiddenMatches] = useState<Set<number>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
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
  ]; // Significantly expanded to include major leagues from all continents

  // Fetch live fixtures with reasonable refresh rates
  const { data: liveFixtures = [] } = useQuery({
    queryKey: ["live-fixtures-all-countries"],
    queryFn: async () => {
      console.log("🔴 [TodaysMatchesByCountryNew] Fetching live fixtures");
      const response = await apiRequest("GET", "/api/fixtures/live");
      const data = await response.json();
      console.log(
        `🔴 [TodaysMatchesByCountryNew] Received ${data.length} live fixtures`,
      );
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - live scores don't change every 20 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
    enabled: enableFetching,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: false, // No automatic polling - user can refresh manually
  });

  // Always call hooks in the same order - validate after hooks
  // Fetch all fixtures for the selected date with comprehensive caching
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ["all-fixtures-by-date", selectedDate],
    queryFn: async () => {
      console.log(
        `🔍 [TodaysMatchesByCountryNew] Checking cache for date: ${selectedDate}`,
      );

      // Check our custom cache first
      const cachedFixtures = getCachedFixturesForDate(selectedDate);
      if (cachedFixtures) {
        console.log(
          `✅ [TodaysMatchesByCountryNew] Using cached fixtures: ${cachedFixtures.length} matches`,
        );

        // Detailed API data analysis
        const apiAnalysis = {
          totalFixtures: cachedFixtures.length,
          countries: [
            ...new Set(
              cachedFixtures.map((f) => f.league?.country).filter(Boolean),
            ),
          ].length,
          leagues: [
            ...new Set(
              cachedFixtures.map((f) => f.league?.name).filter(Boolean),
            ),
          ].length,
          statuses: [
            ...new Set(
              cachedFixtures
                .map((f) => f.fixture?.status?.short)
                .filter(Boolean),
            ),
          ],
          dateRange: {
            earliest: cachedFixtures.reduce(
              (min, f) => (f.fixture?.date < min ? f.fixture.date : min),
              cachedFixtures[0]?.fixture?.date || "",
            ),
            latest: cachedFixtures.reduce(
              (max, f) => (f.fixture?.date > max ? f.fixture.date : max),
              cachedFixtures[0]?.fixture?.date || "",
            ),
          },
          sampleFixtures: cachedFixtures.slice(0, 5).map((f) => ({
            id: f.fixture?.id,
            date: f.fixture?.date,
            status: f.fixture?.status?.short,
            league: f.league?.name,
            country: f.league?.country,
            teams: `${f.teams?.home?.name || "Unknown"} vs ${f.teams?.away?.name || "Unknown"}`,
          })),
        };

        console.log(`📊 [DEBUG] API Data Analysis:`, apiAnalysis);
        return cachedFixtures;
      }

      // Check if we really need fresh data based on cache age and date type
      const today = new Date().toISOString().slice(0, 10);
      const isPastDate = selectedDate < today;

      // For past dates, be very conservative about refetching
      if (isPastDate && cachedFixtures && cachedFixtures.length > 0) {
        console.log(
          `📦 [TodaysMatchesByCountryNew] Using cached data for past date ${selectedDate} (${cachedFixtures.length} fixtures)`,
        );
        return cachedFixtures;
      }

      console.log(
        `📡 [TodaysMatchesByCountryNew] Fetching fresh data for date: ${selectedDate}`,
      );
      const response = await apiRequest(
        "GET",
        `/api/fixtures/date/${selectedDate}?all=true`,
      );
      const data = await response.json();

      // Cache the fetched data with intelligent pre-caching
      if (data && Array.isArray(data)) {
        cacheFixturesForDate(selectedDate, data, "api");
        console.log(
          `💾 [TodaysMatchesByCountryNew] Cached ${data.length} fixtures for ${selectedDate}`,
        );
      }

      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - scheduled matches don't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection time
    enabled: !!selectedDate && enableFetching && !liveFilterActive, // Don't fetch date fixtures when live filter is active
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

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
      "congo (the democratic republic of the)": "Democratic Republic of Congo",
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
    if (fixtures && fixtures.length > 0) {
      console.log(
        `🔍 [TodaysMatchesByCountryNew] Analyzing ${fixtures.length} fixtures for date: ${selectedDate}`,
      );

      // Log first few fixtures with detailed info
      const sampleFixtures = fixtures.slice(0, 5);
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
      const statusBreakdown = fixtures.reduce((acc: any, fixture: any) => {
        const status = fixture.fixture?.status?.short || "UNKNOWN";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      console.log(
        `📈 [TodaysMatchesByCountryNew] Status breakdown:`,
        statusBreakdown,
      );

      // Live matches analysis
      const liveMatches = fixtures.filter((fixture: any) =>
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
      const countryBreakdown = fixtures.reduce((acc: any, fixture: any) => {
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
      const timeAnalysis = fixtures.map((fixture: any) => {
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
        totalFixtures: fixtures.length,
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
  }, [fixtures, selectedDate]);

  // Enhanced status verification function
  const verifyMatchStatusWithSportsRadar = useCallback(async (fixture: any) => {
    try {
      const homeTeam = fixture.teams?.home?.name || '';
      const awayTeam = fixture.teams?.away?.name || '';
      
      // Call debug endpoint to get SportsRadar comparison
      const response = await fetch(`/api/debug/fixture/${fixture.fixture.id}/compare`);
      const comparison = await response.json();
      
      if (comparison.sportsRadar?.available && comparison.sportsRadar?.data) {
        const sportsRadarStatus = comparison.sportsRadar.data.status;
        
        // Check if SportsRadar shows the match as finished
        const isFinishedInSportsRadar = ['completed', 'closed', 'ended', 'finished'].some(
          status => sportsRadarStatus?.toLowerCase().includes(status)
        );
        
        if (isFinishedInSportsRadar) {
          console.log(`✅ SportsRadar confirms match is finished: ${homeTeam} vs ${awayTeam}`);
          return 'FT';
        } else {
          console.log(`⚠️ SportsRadar shows match still active: ${homeTeam} vs ${awayTeam} - status: ${sportsRadarStatus}`);
          return fixture.fixture.status.short; // Keep original status
        }
      }
      
      // If SportsRadar data not available, use time-based validation
      console.warn(`📡 SportsRadar data not available for ${homeTeam} vs ${awayTeam}, using time-based validation`);
      return null; // Will use fallback logic
    } catch (error) {
      console.error(`❌ Error verifying match status with SportsRadar:`, error);
      return null; // Will use fallback logic
    }
  }, []);

  // Timezone-aware fixture filtering with live match validation
  const { validFixtures, rejectedFixtures, stats } = useMemo(() => {
    let allFixtures;
    
    if (liveFilterActive) {
      // When live filter is active, only show live matches
      allFixtures = liveFixtures;
    } else {
      // When showing date fixtures, merge with live updates for accurate status
      allFixtures = fixtures.map(fixture => {
        // Find if this fixture has a live update
        const liveUpdate = liveFixtures.find(live => live.fixture.id === fixture.fixture.id);
        
        if (liveUpdate) {
          // Use live data for status, score, and elapsed time
          return {
            ...fixture,
            fixture: {
              ...fixture.fixture,
              status: liveUpdate.fixture.status
            },
            goals: liveUpdate.goals
          };
        }
        
        return fixture;
      });
    }
    
    if (!allFixtures?.length) {
      return {
        validFixtures: [],
        rejectedFixtures: [],
        stats: { total: 0, valid: 0, rejected: 0, methods: {} },
      };
    }

    console.log(`🕒 [TIMEZONE FILTER] Starting timezone-aware filtering for ${allFixtures.length} fixtures`);
    
    // Use timezone-aware filtering for date-based fixtures
    let timezoneFilteredFixtures = allFixtures;
    
    if (!liveFilterActive) {
      // Apply timezone-aware date filtering
      const processedFixtures = MyUpdatedFixtureDateSelection.getFixturesForSelectedDate(
        allFixtures,
        selectedDate
      );
      
      // Extract just the fixtures from the processed result
      timezoneFilteredFixtures = processedFixtures.map(processed => processed.fixture);
      
      console.log(`🕒 [TIMEZONE FILTER] After timezone filtering: ${timezoneFilteredFixtures.length} fixtures remaining`);
      
      // Log some examples of timezone conversion
      if (processedFixtures.length > 0) {
        console.log(`🕒 [TIMEZONE FILTER] First 3 examples:`, 
          processedFixtures.slice(0, 3).map(p => ({
            teams: `${p.fixture.teams?.home?.name} vs ${p.fixture.teams?.away?.name}`,
            originalDate: p.originalDate,
            convertedDate: p.convertedDate,
            localDateString: p.localDateString,
            isToday: p.isToday,
            isYesterday: p.isYesterday,
            isTomorrow: p.isTomorrow
          }))
        );
      }
    }

    // Apply additional validation filters
    const filtered = timezoneFilteredFixtures.filter((fixture: any) => {
      // Basic validation
      if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
        console.log(`❌ [VALIDATION FILTER] Invalid fixture structure:`, fixture?.fixture?.id);
        return false;
      }

      const status = fixture.fixture.status?.short;
      const matchDate = new Date(fixture.fixture.date);
      const now = new Date();
      const hoursElapsed = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);

      // Check if status claims to be live
      const claimsLive = ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status);
      
      if (claimsLive && hoursElapsed > 3) {
        // Trigger async verification in background
        verifyMatchStatusWithSportsRadar(fixture).then((verifiedStatus) => {
          if (verifiedStatus === 'FT') {
            // Force re-render by updating the fixture status
            fixture.fixture.status.short = "FT";
            fixture.fixture.status.long = "Match Finished";
            // Force component re-render
            setEnableFetching(prev => !prev);
            setTimeout(() => setEnableFetching(prev => !prev), 100);
          }
        });
        
        // For immediate filtering, use time-based validation
        if (hoursElapsed > 3.5) {
          console.warn(`⚠️ Stale live match detected (immediate): ${fixture.teams.home.name} vs ${fixture.teams.away.name} - status: ${status}, hours elapsed: ${hoursElapsed.toFixed(1)}`);
          fixture.fixture.status.short = "FT";
          fixture.fixture.status.long = "Match Finished";
        }
      }

      // Apply filtering logic for live filter
      if (liveFilterActive) {
        const isGenuinelyLive = ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(fixture.fixture.status.short);
        return isGenuinelyLive;
      }

      return true;
    });

    const rejectedFixtures = allFixtures.filter((f) => !timezoneFilteredFixtures.includes(f));

    return {
      validFixtures: filtered,
      rejectedFixtures: rejectedFixtures.map((f) => ({
        fixture: f,
        reason: "Timezone filtering or validation applied",
      })),
      stats: {
        total: allFixtures.length,
        valid: filtered.length,
        rejected: allFixtures.length - filtered.length,
        methods: {
          "timezone-filter": filtered.length,
        },
      },
    };
  }, [fixtures, selectedDate, liveFilterActive, liveFixtures, verifyMatchStatusWithSportsRadar]);

  // Log filtering statistics
  console.log(`📊 [MyDateFilter] Filtering Results for ${selectedDate}:`, {
    total: stats.total,
    valid: stats.valid,
    rejected: stats.rejected,
    methods: stats.methods,
    selectedDate,
  });

  // Add comparison logs with LiveMatchForAllCountry
  console.log(`🔄 [TodaysMatchesByCountryNew] COMPARISON DATA:`, {
    component: "TodaysMatchesByCountryNew",
    selectedDate,
    totalRawFixtures: fixtures.length,
    validAfterFiltering: validFixtures.length,
    rejectedCount: rejectedFixtures.length,
    liveMatchesCount: validFixtures.filter((f) =>
      ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
        f.fixture?.status?.short,
      ),
    ).length,
    uniqueCountries: [...new Set(validFixtures.map((f) => f.league?.country))]
      .length,
    dataSource: "date-specific API endpoint",
    timestamp: new Date().toISOString(),
  });

  // Comprehensive filtering analysis
  const filterAnalysis = {
    selectedDate,
    originalCount: fixtures.length,
    filteredCount: validFixtures.length,
    removedCount: fixtures.length - validFixtures.length,
    removedFixtures: fixtures
      .filter((f) => !validFixtures.includes(f))
      .slice(0, 10)
      .map((f) => ({
        id: f.fixture?.id,
        date: f.fixture?.date,
        status: f.fixture?.status?.short,
        league: f.league?.country,
        country: f.league?.country,
        teams: `${f.teams?.home?.name} vs ${f.teams?.away?.name}`,
        reason: "Date mismatch",
      })),
    statusBreakdown: {
      original: [
        ...new Set(
          fixtures.map((f) => f.fixture?.status?.short).filter(Boolean),
        ),
      ],
      filtered: [
        ...new Set(
          validFixtures.map((f) => f.fixture?.status?.short).filter(Boolean),
        ),
      ],
    },
    dateBreakdown: {
      original: [
        ...new Set(
          fixtures.map((f) => f.fixture?.date?.split("T")[0]).filter(Boolean),
        ),
      ],
      filtered: [
        ...new Set(
          validFixtures
            .map((f) => f.fixture?.date?.split("T")[0])
            .filter(Boolean),
        ),
      ],
    },
  };

  console.log(`📊 [DEBUG] Comprehensive Filtering Analysis:`, filterAnalysis);

  // Group fixtures by country and league with comprehensive null checks
  const fixturesByCountry = validFixtures.reduce((acc: any, fixture: any) => {
    // Validate fixture structure
    if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
      console.warn("❌ [DEBUG] Invalid fixture data structure:", fixture);
      return acc;
    }

    // Validate league data
    const league = fixture.league;
    if (!league.id || !league.name) {
      console.warn("❌ [DEBUG] Invalid league data:", league);
      return acc;
    }

    // Validate team data
    if (
      !fixture.teams.home ||
      !fixture.teams.away ||
      !fixture.teams.home.name ||
      !fixture.teams.away.name
    ) {
      console.warn("❌ [DEBUG] Invalid team data:", fixture.teams);
      return acc;
    }

    const leagueName = league.name || "";
    const homeTeamName = fixture.teams?.home?.name || "";
    const awayTeamName = fixture.teams?.away?.name || "";

    // Use original country from league data directly
    const country = league.country;

    // International Competition Handling (lines 640-680):
    // Forces certain international competitions to be assigned to "World" country
    // Includes: FIFA, UEFA, Champions League, Europa League, World Cup, Euro, CONMEBOL, Copa America, CONCACAF, Gold Cup, UEFA U21, and Friendlies (non-women)

    let displayCountry = getCountryDisplayName(country);

    // Force certain international competitions to be assigned to "World" country
    const leagueNameLower = league.name.toLowerCase();
    if (
      leagueNameLower.includes("fifa") ||
      leagueNameLower.includes("uefa champions league") ||
      leagueNameLower.includes("uefa europa league") ||
      leagueNameLower.includes("uefa europa conference league") ||
      leagueNameLower.includes("uefa nations league") ||
      leagueNameLower.includes("uefa u21 championship") ||
      leagueNameLower.includes("uefa u19 championship") ||
      leagueNameLower.includes("uefa u17 championship") ||
      leagueNameLower.includes("world cup") ||
      leagueNameLower.includes("euro championship") ||
      leagueNameLower.includes("conmebol") ||
      leagueNameLower.includes("copa america") ||
      leagueNameLower.includes("concacaf") ||
      leagueNameLower.includes("gold cup") ||
      (leagueNameLower.includes("friendlies") && 
       !leagueNameLower.includes("women") && 
       (country === "World" || country === "Europe" || country === "International"))
    ) {
      displayCountry = "World";
    }

    const leagueId = league.id;

    if (!acc[displayCountry]) {
      console.log(`🆕 [DEBUG] Creating new country group:`, {
        originalCountry: country,
        displayCountry,
        fixtureId: fixture.fixture.id,
        league: leagueName,
      });
      acc[displayCountry] = {
        country: displayCountry,
        flag: "",
        leagues: {},
        hasPopularLeague: POPULAR_LEAGUES.includes(leagueId),
      };
    }

    if (!acc[displayCountry].leagues[leagueId]) {
      console.log(`🆕 [DEBUG] Creating new league group:`, {
        country: displayCountry,
        leagueId,
        leagueName,
        fixtureId: fixture.fixture.id,
      });
      acc[displayCountry].leagues[leagueId] = {
        league: {
          ...league,
          logo:
            league.logo || "https://media.api-sports.io/football/leagues/1.png",
        },
        matches: [],
        isPopular: POPULAR_LEAGUES.includes(leagueId),
      };
    }

    // Check if this fixture already exists in this league to prevent duplicates
    const existingMatch = acc[displayCountry].leagues[leagueId].matches.find(
      (existingFixture: any) =>
        existingFixture.fixture.id === fixture.fixture.id,
    );

    if (!existingMatch) {
      // Add fixture with safe team data only if it doesn't already exist
      acc[displayCountry].leagues[leagueId].matches.push({
        ...fixture,
        teams: {
          home: {
            ...fixture.teams.home,
            logo: fixture.teams.home.logo || "/assets/fallback-logo.png",
          },
          away: {
            ...fixture.teams.away,
            logo: fixture.teams.away.logo || "/assets/fallback-logo.png",
          },
        },
      });
    } else {
      console.log(`🔄 [DEBUG] Duplicate fixture prevented:`, {
        fixtureId: fixture.fixture.id,
        league: leagueName,
        country: displayCountry,
        teams: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
      });
    }

    console.log(`✅ [DEBUG] Added match to country group:`, {
      country: displayCountry,
      league: leagueName,
      match: `${homeTeamName} vs ${awayTeamName}`,
      fixtureId: fixture.fixture.id,
      status: fixture.fixture.status?.short,
    });

    return acc;
  }, {});

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

        // Priority: World with live matches first, then World without live, then others alphabetically
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

  // Single flag fetching effect with deduplication
  useEffect(() => {
    if (!validFixtures.length) return;

    const countries = Object.values(fixturesByCountry)
      .map((c: any) => c.country)
      .filter(Boolean);
    const uniqueCountries = [...new Set(countries)];

    // Only process countries that aren't already in flagMap
    const missingCountries = uniqueCountries.filter(
      (country) => !flagMap[country],
    );

    if (missingCountries.length === 0) {
      return;
    }

    console.log(
      `🎯 Need flags for ${missingCountries.length} countries: ${missingCountries.join(", ")}`,
    );

    // Pre-populate flagMap with sync flags to prevent redundant calls
    const syncFlags: { [country: string]: string } = {};
    missingCountries.forEach((country) => {
      const syncFlag = getCountryFlagWithFallbackSync(country);
      if (syncFlag) {
        syncFlags[country] = syncFlag;
      }
    });

    if (Object.keys(syncFlags).length > 0) {
      setFlagMap((prev) => ({ ...prev, ...syncFlags }));
      console.log(
        `⚡ Pre-populated ${Object.keys(syncFlags).length} flags synchronously`,
      );
    }
  }, [Object.keys(fixturesByCountry).length]); // Only depend on country count, not the actual data

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

  const handleManualRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    console.log("🔄 [MANUAL REFRESH] Forcing fresh API call...");

    // Clear all relevant caches
    const cacheKey = `all-fixtures-by-date-${selectedDate}`;
    localStorage.removeItem(cacheKey);

    // Force fresh API call
    try {
      const response = await apiRequest(
        "GET",
        `/api/fixtures/date/${selectedDate}?all=true&fresh=true&t=${Date.now()}`,
      );
      const freshData = await response.json();

      if (freshData && Array.isArray(freshData)) {
        // Cache fresh data
        cacheFixturesForDate(selectedDate, freshData, "manual-refresh");
        console.log(
          `✅ [MANUAL REFRESH] Got ${freshData.length} fresh fixtures`,
        );

        // Force component re-render by updating a state that triggers useQuery
        setEnableFetching(false);
        setTimeout(() => setEnableFetching(true), 100);
      }
    } catch (error) {
      console.error("❌ [MANUAL REFRESH] Failed:", error);
    } finally {
      setIsRefreshing(false);
    }
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
      return "bg-red-100 text-red-700 font-semibold animate-pulse";
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

  if (!validFixtures.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No matches available for this date</p>
        </CardContent>
      </Card>
    );
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
    <Card className="mt-4">
      <CardHeader className="flex flex-row justify-between items-center space-y-0 p-2 border-b border-stone-200">
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
      </CardHeader>
      <CardContent className="p-0">
        <div className="country-matches-container todays-matches-by-country-container">
          {/* Use sortedCountries directly */}
          {sortedCountries.map((countryData: any) => {
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
                  league.matches.filter((match: any) =>
                    ["LIVE", "1H", "HT", "2H", "ET"].includes(
                      match.fixture.status.short,
                    ),
                  ).length
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
                  onClick={() =>
                    toggleCountry(
                      typeof countryData.country === "string"
                        ? countryData.country
                        : countryData.country?.name || "Unknown",
                    )
                  }
                  className={`w-full p-4 flex items-center justify-between transition-colors pt-[12px] pb-[12px] font-normal text-[14.7px] country-header-button border-b border-stone-200 ${
                    isExpanded ? "expanded" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 font-normal text-[14px]">
                    <img
                      src={(() => {
                        const countryName =
                          typeof countryData.country === "string"
                            ? countryData.country
                            : countryData.country?.name || "Unknown";

                        if (countryName === "World") {
                          return "/assets/world flag_new.png";
                        }

                        // For England specifically, always use the England flag
                        if (countryName === "England") {
                          return "https://flagcdn.com/w40/gb-eng.png";
                        }

                        // Check if we have a cached flag for other countries
                        const cachedFlag = flagMap[countryName];
                        if (cachedFlag) {
                          return cachedFlag;
                        }

                        // For other countries, use the fallback sync function
                        return (
                          getCountryFlagWithFallbackSync(countryName) ||
                          "/assets/fallback.svg"
                        );
                      })()}
                      alt={
                        typeof countryData.country === "string"
                          ? countryData.country
                          : countryData.country?.name || "Unknown"
                      }
                      className="w-5 h-3 object-cover rounded-sm shadow-sm"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const countryName =
                          typeof countryData.country === "string"
                            ? countryData.country
                            : countryData.country?.name || "Unknown";

                        // For World flag, use fallback
                        if (countryName === "World") {
                          target.src = "/assets/fallback.svg";
                          return;
                        }
                        // For England specifically, ensure we try the correct flag first
                        if (
                          countryName === "England" &&
                          !target.src.includes("fallback-logo.svg")
                        ) {
                          if (!target.src.includes("gb-eng")) {
                            // First try the England flag
                            target.src = "https://flagcdn.com/w40/gb-eng.png";
                            return;
                          } else {
                            // If England flag fails, use GB flag
                            target.src = "https://flagcdn.com/w40/gb.png";
                            return;
                          }
                        }
                        // For other GB subdivisions
                        if (
                          (countryName === "Scotland" ||
                            countryName === "Wales" ||
                            countryName === "Northern Ireland") &&
                          !target.src.includes("fallback-logo.svg")
                        ) {
                          if (
                            target.src.includes("gb-sct") ||
                            target.src.includes("gb-wls") ||
                            target.src.includes("gb-nir")
                          ) {
                            target.src = "https://flagcdn.com/w40/gb.png"; // Fallback to GB flag
                          } else if (target.src.includes("/gb.png")) {
                            target.src = "/assets/fallback.svg";
                          }
                          return;
                        }
                        if (!target.src.includes("/assets/fallback.svg")) {
                          target.src = "/assets/fallback.svg";
                        }
                      }}
                    />
                    <span
                      className="font-medium text-gray-900"
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
                      className="text-gray-500"
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
                        className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium animate-pulse"
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
                        className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium"
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
                      className={`h-4 w-4 text-gray-500 chevron-icon rotated`}
                    />
                  ) : (
                    <ChevronDown
                      className={`h-4 w-4 text-gray-500 chevron-icon`}
                    />
                  )}
                </button>
                {isExpanded && (
                  <div
                    className={`bg-gray-50 border-t border-stone-200 league-content ${
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
                        const isLeagueExpanded = expandedLeagues.has(leagueKey);

                        return (
                          <div
                            key={leagueData.league.id}
                            className="border-b border-stone-200 last:border-b-0"
                          >
                            {/* League Header - Now clickable */}
                            <button
                              onClick={() =>
                                toggleLeague(
                                  countryData.country,
                                  leagueData.league.id,
                                )
                              }
                              className={`w-full flex items-center gap-2 p-2 bg-white border-b border-stone-200 transition-colors cursor-pointer group`}
                            >
                              <img
                                src={
                                  leagueData.league.logo ||
                                  "/assets/fallback-logo.svg"
                                }
                                alt={leagueData.league.name || "Unknown League"}
                                className="w-6 h-6 object-contain rounded-full"
                                style={{ backgroundColor: "transparent" }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/assets/fallback-logo.svg";
                                }}
                              />
                              <div className="flex flex-col flex-1 text-left">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="font-semibold text-gray-800 group-hover:underline transition-all duration-200"
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
                                    className="text-gray-500"
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
                                      leagueData.matches.filter((match: any) =>
                                        [
                                          "LIVE",
                                          "1H",
                                          "HT",
                                          "2H",
                                          "ET",
                                          "BT",
                                          "P",
                                          "INT",
                                        ].includes(match.fixture.status.short),
                                      ).length;

                                    if (liveMatchesInLeague > 0) {
                                      return (
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                                          {liveMatchesInLeague} LIVE
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                                <span className="text-xs text-gray-600">
                                  {leagueData.league.country ||
                                    "Unknown Country"}
                                </span>
                              </div>
                              <div className="flex gap-2 items-center">
                                {leagueData.isPopular && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                    Popular
                                  </span>
                                )}
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
                                  .sort((a: any, b: any) => {
                                    // Priority order: Live > Ended (Recent) > Upcoming > Ended (Old)
                                    const aStatus = a.fixture.status.short;
                                    const bStatus = b.fixture.status.short;
                                    const aDate = new Date(a.fixture.date).getTime();
                                    const bDate = new Date(b.fixture.date).getTime();
                                    const now = new Date().getTime();

                                    // Define status categories
                                    const aLive = [
                                      "LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"
                                    ].includes(aStatus);
                                    const bLive = [
                                      "LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"
                                    ].includes(bStatus);

                                    const aEnded = [
                                      "FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"
                                    ].includes(aStatus);
                                    const bEnded = [
                                      "FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"
                                    ].includes(bStatus);

                                    const aUpcoming = aStatus === "NS" || aStatus === "TBD";
                                    const bUpcoming = bStatus === "NS" || bStatus === "TBD";

                                    // For ended matches, check if they're recent (within 3 hours)
                                    const aRecentEnded = aEnded && (now - aDate) <= (3 * 60 * 60 * 1000);
                                    const bRecentEnded = bEnded && (now - bDate) <= (3 * 60 * 60 * 1000);

                                    // Assign priority scores (lower = higher priority)
                                    let aPriority = 4; // default
                                    let bPriority = 4; // default

                                    if (aLive) aPriority = 1;
                                    else if (aRecentEnded) aPriority = 2;
                                    else if (aUpcoming) aPriority = 3;
                                    else if (aEnded) aPriority = 4;

                                    if (bLive) bPriority = 1;
                                    else if (bRecentEnded) bPriority = 2;
                                    else if (bUpcoming) bPriority = 3;
                                    else if (bEnded) bPriority = 4;

                                    // First sort by priority
                                    if (aPriority !== bPriority) {
                                      return aPriority - bPriority;
                                    }

                                    // Within same priority, sort by time
                                    if (aLive && bLive) {
                                      // Live matches: earliest start time first
                                      return aDate - bDate;
                                    }

                                    if ((aRecentEnded && bRecentEnded) || (aEnded && bEnded)) {
                                      // Ended matches: most recent first
                                      return bDate - aDate;
                                    }

                                    if (aUpcoming && bUpcoming) {
                                      // Upcoming matches: earliest start time first
                                      return aDate - bDate;
                                    }

                                    // Default: sort by time
                                    return aDate - bDate;
                                  })
                                  .map((match: any, matchIndex) => (
                                    <div
                                      key={`${match.fixture.id}-${countryData.country}-${leagueData.league.id}-${matchIndex}`}
                                      className="match-card-container group"
                                      onClick={() => onMatchCardClick?.(match)}
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
                                        {/* Top Grid: Match Status */}
                                        <div className="match-status-top">
                                          {(() => {
                                            const status =
                                              match.fixture.status.short;

                                            // Live matches status
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
                                                <div className="match-status-label status-live">
                                                  {status === "HT"
                                                    ? "Halftime"
                                                    : `${match.fixture.status.elapsed || 0}'`}
                                                </div>
                                              );
                                            }

                                            // Finished matches status
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
                                                              : status ===
                                                                  "CANC"
                                                                ? "Cancelled"
                                                                : status ===
                                                                    "SUSP"
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
                                            {(() => {
                                              // Check if this is a national team
                                              const isActualNationalTeam =
                                                isNationalTeam(
                                                  match.teams.home,
                                                  {
                                                    name: leagueData.league
                                                      .name,
                                                    country:
                                                      leagueData.league.country,
                                                  },
                                                );

                                              // Check for youth teams
                                              const isYouthTeam =
                                                match.teams.home.name?.includes(
                                                  "U20",
                                                ) ||
                                                match.teams.home.name?.includes(
                                                  "U21",
                                                ) ||
                                                match.teams.home.name?.includes(
                                                  "U19",
                                                ) ||
                                                match.teams.home.name?.includes(
                                                  "U23",
                                                );

                                              // Check if this is FIFA Club World Cup (club competition, not national teams)
                                              const isFifaClubWorldCup =
                                                leagueData.league.name
                                                  ?.toLowerCase()
                                                  .includes(
                                                    "fifa club world cup",
                                                  );

                                              // Use MyCircularFlag for national teams and youth teams, but NOT for club competitions like FIFA Club World Cup
                                              if (
                                                (isActualNationalTeam ||
                                                  isYouthTeam) &&
                                                !isFifaClubWorldCup
                                              ) {
                                                return (
                                                  <MyCircularFlag
                                                    teamName={
                                                      match.teams.home.name ||
                                                      ""
                                                    }
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
                                                  style={{
                                                    filter:
                                                      "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))",
                                                  }}
                                                  fallbackSrc="/assets/fallback-logo.svg"
                                                />
                                              );
                                            })()}
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
                                            {(() => {
                                              // Check if this is a national team
                                              const isActualNationalTeam =
                                                isNationalTeam(
                                                  match.teams.away,
                                                  {
                                                    name: leagueData.league
                                                      .name,
                                                    country:
                                                      leagueData.league.country,
                                                  },
                                                );

                                              // Check for youth teams
                                              const isYouthTeam =
                                                match.teams.away.name?.includes(
                                                  "U20",
                                                ) ||
                                                match.teams.away.name?.includes(
                                                  "U21",
                                                ) ||
                                                match.teams.away.name?.includes(
                                                  "U19",
                                                ) ||
                                                match.teams.away.name?.includes(
                                                  "U23",
                                                );

                                              // Check if this is FIFA Club World Cup (club competition, not national teams)
                                              const isFifaClubWorldCup =
                                                leagueData.league.name
                                                  ?.toLowerCase()
                                                  .includes(
                                                    "fifa club world cup",
                                                  );

                                              // Use MyCircularFlag for national teams and youth teams, but NOT for club competitions like FIFA Club World Cup
                                              if (
                                                (isActualNationalTeam ||
                                                  isYouthTeam) &&
                                                !isFifaClubWorldCup
                                              ) {
                                                return (
                                                  <MyCircularFlag
                                                    teamName={
                                                      match.teams.away.name ||
                                                      ""
                                                    }
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
                                                  fallbackSrc="/assets/fallback-logo.svg"
                                                />
                                              );
                                            })()}
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
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodaysMatchesByCountryNew;