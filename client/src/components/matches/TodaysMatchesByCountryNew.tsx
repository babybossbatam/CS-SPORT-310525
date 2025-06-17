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
import LazyMatchItem from './LazyMatchItem';
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import "../../styles/MyLogoPositioning.css";
import "../../styles/TodaysMatchByCountryNew.css";
import { DebugWidget } from '../debug/DebugWidget';

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
    114, 116, 120, 121, 122, 123, 124, 125, 126, 127
  ]; // Significantly expanded to include major leagues from all continents



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
            teams: `${f.teams?.home?.name} vs ${f.teams?.away?.name}`,
          })),
        };

        console.log(`📊 [DEBUG] API Data Analysis:`, apiAnalysis);
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

      // Cache the fetched data
      if (data && Array.isArray(data)) {
        cacheFixturesForDate(selectedDate, data, "api");
        console.log(
          `💾 [TodaysMatchesByCountryNew] Cached ${data.length} fixtures for ${selectedDate}`,
        );

        // Detailed API data analysis for fresh data
        const apiAnalysis = {
          totalFixtures: data.length,
          countries: [
            ...new Set(data.map((f) => f.league?.country).filter(Boolean)),
          ].length,
          leagues: [...new Set(data.map((f) => f.league?.name).filter(Boolean))]
            .length,
          statuses: [
            ...new Set(
              data.map((f) => f.fixture?.status?.short).filter(Boolean),
            ),
          ],
          dateRange: {
            earliest: data.reduce(
              (min, f) => (f.fixture?.date < min ? f.fixture.date : min),
              data[0]?.fixture?.date || "",
            ),
            latest: data.reduce(
              (max, f) => (f.fixture?.date > max ? f.fixture.date : max),
              data[0]?.fixture?.date || "",
            ),
          },
          sampleFixtures: data.slice(0, 5).map((f) => ({
            id: f.fixture?.id,
            date: f.fixture?.date,
            status: f.fixture?.status?.short,
            league: f.league?.name,
            country: f.league?.country,
            teams: `${f.teams?.home?.name} vs ${f.teams?.away?.name}`,
          })),
        };

        console.log(`📊 [DEBUG] Fresh API Data Analysis:`, apiAnalysis);
      }

      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for live data
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection time
    enabled: !!selectedDate && enableFetching,
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
      console.log(`🔍 [TodaysMatchesByCountryNew] Analyzing ${fixtures.length} fixtures for date: ${selectedDate}`);

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
          venue: fixture.fixture?.venue?.name
        });
      });

      // Status breakdown
      const statusBreakdown = fixtures.reduce((acc: any, fixture: any) => {
        const status = fixture.fixture?.status?.short || 'UNKNOWN';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      console.log(`📈 [TodaysMatchesByCountryNew] Status breakdown:`, statusBreakdown);

      // Live matches analysis
      const liveMatches = fixtures.filter((fixture: any) => 
        ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(fixture.fixture?.status?.short)
      );

      if (liveMatches.length > 0) {
        console.log(`🔴 [TodaysMatchesByCountryNew] Found ${liveMatches.length} live matches:`);
        liveMatches.forEach((fixture: any, index: number) => {
          const now = new Date();
          const matchDate = new Date(fixture.fixture.date);
          const minutesSinceStart = Math.floor((now.getTime() - matchDate.getTime()) / (1000 * 60));

          console.log(`🔴 [TodaysMatchesByCountryNew] Live Match ${index + 1}:`, {
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

      console.log(`🌍 [TodaysMatchesByCountryNew] Country breakdown:`, countryBreakdown);

      // Time analysis
      const now = new Date();
      const selectedDateObj = new Date(selectedDate);
      const timeAnalysis = fixtures.map((fixture: any) => {
        const matchDate = new Date(fixture.fixture.date);
        const hoursDiff = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
        const matchDateString = matchDate.toISOString().split('T')[0];
        const isSelectedDate = matchDateString === selectedDate;

        return {
          fixtureId: fixture.fixture.id,
          status: fixture.fixture.status.short,
          matchDateString,
          selectedDate,
          isSelectedDate,
          hoursDiff: Math.round(hoursDiff * 100) / 100,
          isToday: matchDate.toDateString() === now.toDateString()
        };
      });

      console.log(`⏰ [TodaysMatchesByCountryNew] Time analysis (first 10):`, timeAnalysis.slice(0, 10));

      // Date filtering analysis
      const dateFilterAnalysis = {
        totalFixtures: fixtures.length,
        selectedDate,
        fixturesOnSelectedDate: timeAnalysis.filter(f => f.isSelectedDate).length,
        fixturesOnToday: timeAnalysis.filter(f => f.isToday).length,
        statusDistribution: statusBreakdown,
        sampleDateMismatches: timeAnalysis.filter(f => !f.isSelectedDate).slice(0, 5)
      };

      console.log(`📅 [TodaysMatchesByCountryNew] Date filtering analysis:`, dateFilterAnalysis);
    }
  }, [fixtures, selectedDate]);

  // Apply smart time filtering directly and detect stale matches
  const { validFixtures, rejectedFixtures, stats } = useMemo(() => {
    if (!fixtures?.length) {
      return {
        validFixtures: [],
        rejectedFixtures: [],
        stats: { total: 0, valid: 0, rejected: 0, methods: {} }
      };
    }

    // Debug FIFA Club World Cup fixtures specifically
    const fifaFixtures = fixtures.filter(f => f.league?.id === 15);
    if (fifaFixtures.length > 0) {
      console.log(`🏆 [FIFA DEBUG] Found ${fifaFixtures.length} FIFA Club World Cup fixtures:`, 
        fifaFixtures.map(f => ({
          id: f.fixture.id,
          date: f.fixture.date,
          status: f.fixture.status.short,
          teams: `${f.teams.home.name} vs ${f.teams.away.name}`,
          selectedDate
        }))
      );
    }

    // Check for stale matches and force refresh if found
    const staleMatches = fixtures.filter(fixture => {
      if (!fixture?.fixture?.date || !fixture?.fixture?.status?.short) return false;

      const matchDate = new Date(fixture.fixture.date);
      const now = new Date();
      const hoursSinceStart = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
      const status = fixture.fixture.status.short;

      return hoursSinceStart > 4 && ["1H", "2H", "LIVE", "HT", "ET", "BT", "P", "INT"].includes(status);
    });

    if (staleMatches.length > 0) {
      console.log(`🚨 [PRO API] Found ${staleMatches.length} stale matches, forcing fresh API call...`);
      // Force refresh by invalidating cache and refetching
      setTimeout(() => {
        // Clear cache and refetch
        const cacheKey = `all-fixtures-by-date-${selectedDate}`;
        localStorage.removeItem(cacheKey);
        window.location.reload(); // Force page refresh to get latest data
      }, 1000);
    }

    // Use MySmartTimeFilter directly for consistent filtering
    const filtered = fixtures.filter(fixture => {
      if (!fixture?.fixture?.date || !fixture?.fixture?.status?.short) {
        return false;
      }

      const smartResult = MySmartTimeFilter.getSmartTimeLabel(
        fixture.fixture.date,
        fixture.fixture.status.short,
        selectedDate + 'T12:00:00Z'
      );

      // Debug FIFA Club World Cup filtering specifically
      if (fixture.league?.id === 15) {
        console.log(`🏆 [FIFA FILTER DEBUG] Fixture ${fixture.fixture.id}:`, {
          originalDate: fixture.fixture.date,
          selectedDate,
          smartLabel: smartResult.label,
          isWithinTimeRange: smartResult.isWithinTimeRange,
          status: fixture.fixture.status.short,
          teams: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
          willBeIncluded: false // We'll update this below
        });
      }

      // Determine what type of date is selected
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = format(tomorrow, 'yyyy-MM-dd');
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = format(yesterday, 'yyyy-MM-dd');

      // Match based on selected date type
      const isTomorrow = selectedDate === tomorrowString && smartResult.label === 'tomorrow';
      const isToday = selectedDate === todayString && smartResult.label === 'today';
      const isYesterday = selectedDate === yesterdayString && smartResult.label === 'yesterday';
      const isCustomDate = selectedDate !== todayString && selectedDate !== tomorrowString && selectedDate !== yesterdayString && smartResult.label === 'custom' && smartResult.isWithinTimeRange;

      const shouldInclude = isTomorrow || isToday || isYesterday || isCustomDate;

      // Debug FIFA Club World Cup decisions
      if (fixture.league?.id === 15) {
        console.log(`🏆 [FIFA DECISION] Fixture ${fixture.fixture.id}:`, {
          selectedDate,
          todayString,
          tomorrowString,
          yesterdayString,
          smartLabel: smartResult.label,
          isWithinTimeRange: smartResult.isWithinTimeRange,
          checks: { isTomorrow, isToday, isYesterday, isCustomDate },
          finalDecision: shouldInclude ? 'INCLUDED' : 'REJECTED'
        });
      }

      return shouldInclude;
    });

    const rejectedFixtures = fixtures.filter(f => !filtered.includes(f));
    const labelCounts = filtered.reduce((acc, fixture) => {
      const smartResult = MySmartTimeFilter.getSmartTimeLabel(
        fixture.fixture.date,
        fixture.fixture.status.short,
        selectedDate + 'T12:00:00Z'
      );
      acc[smartResult.label] = (acc[smartResult.label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      validFixtures: filtered,
      rejectedFixtures: rejectedFixtures.map(f => ({ fixture: f, reason: 'Date mismatch' })),
      stats: {
        total: fixtures.length,
        valid: filtered.length,
        rejected: fixtures.length - filtered.length,
        methods: { 
          'smart-time-filter': filtered.length,
          ...labelCounts
        }
      }
    };
  }, [fixtures, selectedDate]);

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
    component: 'TodaysMatchesByCountryNew',
    selectedDate,
    totalRawFixtures: fixtures.length,
    validAfterFiltering: validFixtures.length,
    rejectedCount: rejectedFixtures.length,
    liveMatchesCount: validFixtures.filter(f => 
      ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(f.fixture?.status?.short)
    ).length,
    uniqueCountries: [...new Set(validFixtures.map(f => f.league?.country))].length,
    dataSource: 'date-specific API endpoint',
    timestamp: new Date().toISOString()
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
  const fixturesByCountry = validFixtures.reduce(
    (acc: any, fixture: any) => {
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
      const countryName = league.country || "";

      // Apply minimal exclusion filters - only for alternative formats and women's competitions
      const shouldExclude = shouldExcludeMatchByCountry(
        leagueName,
        homeTeamName,
        awayTeamName,
        false,
        countryName,
      );

      if (shouldExclude) {
        console.log(`🚫 [DEBUG] Excluding match due to format/competition type:`, {
          fixtureId: fixture.fixture.id,
          league: leagueName,
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          country: countryName,
          reason: "Alternative format or women's competition",
        });
        return acc;
      }

      const country = league.country;
      const displayCountry = getCountryDisplayName(country);

      // Skip fixtures without a valid country
      if (
        !country ||
        country === null ||
        country === undefined ||
        typeof country !== "string" ||
        country.trim() === ""
      ) {
        console.warn(
          "❌ [DEBUG] Skipping fixture with invalid country:",
          country,
          fixture.fixture.id,
        );
        return acc;
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
              league.logo ||
              "https://media.api-sports.io/football/leagues/1.png",
          },
          matches: [],
          isPopular: POPULAR_LEAGUES.includes(leagueId),
        };
      }

      // Check if this fixture already exists in this league to prevent duplicates
      const existingMatch = acc[displayCountry].leagues[leagueId].matches.find(
        (existingFixture: any) => existingFixture.fixture.id === fixture.fixture.id
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
    },
    {},
  );

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
  const sortedCountries = Object.values(fixturesByCountry).sort(
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
            match.fixture.status.short
          )
        )
      );
      const bHasLive = Object.values(b.leagues).some((league: any) =>
        league.matches.some((match: any) =>
          ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
            match.fixture.status.short
          )
        )
      );

      // Priority: World with live matches first, then World without live, then others alphabetically
      if (aIsWorld && aHasLive && (!bIsWorld || !bHasLive)) return -1;
      if (bIsWorld && bHasLive && (!aIsWorld || !aHasLive)) return 1;
      if (aIsWorld && !bIsWorld) return -1;
      if (bIsWorld && !aIsWorld) return 1;

      return countryA.localeCompare(countryB);
    },
  );

  // Start with all countries collapsed by default
  useEffect(() => {
    // Reset to collapsed state when selected date changes
    setExpandedCountries(new Set());

    // Auto-expand the first league in each country by default (using the same sorting logic as display)
    const firstLeagues = new Set<string>();
    sortedCountries.forEach((countryData: any) => {
      const sortedLeagues = Object.values(countryData.leagues)
        .sort((a: any, b: any) => {
          if (a.isPopular && !b.isPopular) return -1;
          if (!a.isPopular && b.isPopular) return 1;
          return a.league.name.localeCompare(b.league.name);
        });

      if (sortedLeagues.length > 0) {
        // Expand the first league after sorting (same order as displayed)
        const firstLeague = sortedLeagues[0];
        const leagueKey = `${countryData.country}-${firstLeague.league.id}`;
        firstLeagues.add(leagueKey);
      }
    });
    setExpandedLeagues(firstLeagues);
  }, [selectedDate, sortedCountries.length]);

  // Single flag fetching effect with deduplication
  useEffect(() => {
    const countries = sortedCountries
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
  }, [sortedCountries.length]); // Only depend on count, not the specific countries

  const toggleCountry = useCallback((country: string) => {
    setExpandedCountries((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(country)) {
        newExpanded.delete(country);      } else {
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
        `/api/fixtures/date/${selectedDate}?all=true&fresh=true&t=${Date.now()}`
      );
      const freshData = await response.json();

      if (freshData && Array.isArray(freshData)) {
        // Cache fresh data
        cacheFixturesForDate(selectedDate, freshData, "manual-refresh");
        console.log(`✅ [MANUAL REFRESH] Got ${freshData.length} fresh fixtures`);

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
            return `${format(customDate, 'EEEE, MMMM do')} Football Matches by Country`;
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
        apiRequest('GET', `/api/fixtures/${fixtureId}`),
        apiRequest('GET', `/api/fixtures/${fixtureId}/lineups`).catch(() => null),
        apiRequest('GET', `/api/fixtures/${fixtureId}/statistics`).catch(() => null)
      ];
      await Promise.allSettled(promises);
    } catch (error) {
      console.warn('Background prefetch failed for fixture:', fixtureId);
    }
  }, []);

  // Show loading only if we're actually loading and have no data
  if (isLoading && !fixtures.length) {
    return (      <Card>
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
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {getHeaderTitle()}
            </h2>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-50"
          >
            {isRefreshing ? "Refreshing..." : "🔄 Refresh"}
          </button>
        </div>
        <p className="text-sm text-gray-500">
          {validFixtures.length} matches found
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
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
                
                  
                    
                      
                        
                          
                            
                              
                            
                            
                              {typeof countryData.country === 'string' ? countryData.country : countryData.country?.name || 'Unknown'}
                            
                            
                              ({totalMatches})
                            
                            {/* Live/Recent badges */}
                            {liveMatches > 0 && (
                              
                                {liveMatches} LIVE
                              
                            )}
                            {recentMatches > 0 && !liveMatches && (
                              
                                {recentMatches} Recent
                              
                            )}
                          
                          {isExpanded ? (
                            
                          ) : (
                            
                          )}
                        
                      
                      {isExpanded && (
                        
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
                              
                                {/* League Header - Now clickable */}
                                
                                  
                                    
                                      
                                    
                                    
                                      
                                        
                                          {safeSubstring(leagueData.league.name, 0) ||
                                            "Unknown League"}
                                        
                                        
                                          ({leagueData.matches.length})
                                        
                                        {(() => {
                                          const liveMatchesInLeague = leagueData.matches.filter((match: any) =>
                                            ["LIVE", "1H", "HT", "2H", "ET"].includes(
                                              match.fixture.status.short,
                                            ),
                                          ).length;

                                          if (liveMatchesInLeague > 0) {
                                            return (
                                              
                                                {liveMatchesInLeague} LIVE
                                              
                                            );
                                          }
                                          return null;
                                        })()}
                                      
                                      
                                        {leagueData.league.country || "Unknown Country"}
                                      
                                    
                                    {leagueData.isPopular && (
                                      
                                        Popular
                                      
                                    )}
                                  

                                  {/* Matches - Show when league is expanded OR when it's the first league */}
                                  {(isLeagueExpanded) && (
                                    
                                    {leagueData.matches
                                      .filter((match: any, index: number, array: any[]) => {
                                        // Remove duplicates by fixture ID and filter hidden matches
                                        const isFirstOccurrence = array.findIndex(m => m.fixture.id === match.fixture.id) === index;
                                        const isNotHidden = !hiddenMatches.has(match.fixture.id);
                                        return isFirstOccurrence && isNotHidden;
                                      })
                                      .sort((a: any, b: any) => {
                                        // Priority order: Live > Upcoming > Ended
                                        const aStatus = a.fixture.status.short;
                                        const bStatus = b.fixture.status.short;
                                        const aDate = new Date(
                                          a.fixture.date,
                                        ).getTime();
                                        const bDate = new Date(
                                          b.fixture.date,
                                        ).getTime();

                                        // Define status categories
                                        const aLive = [
                                          "LIVE",
                                          "1H",
                                          "HT",
                                          "2H",
                                          "ET",
                                        ].includes(aStatus);
                                        const bLive = [
                                          "LIVE",
                                          "1H",
                                          "HT",
                                          "2H",
                                          "ET",
                                        ].includes(bStatus);

                                        const aUpcoming = aStatus === "NS" && !aLive;
                                        const bUpcoming = bStatus === "NS" && !bLive;

                                        const aEnded = [
                                          "FT",
                                          "AET",
                                          "PEN",
                                          "AWD",
                                          "WO",
                                          "ABD",
                                          "CANC",
                                          "SUSP",
                                        ].includes(aStatus);
                                        const bEnded = [
                                          "FT",
                                          "AET",
                                          "PEN",
                                          "AWD",
                                          "WO",
                                          "ABD",
                                          "CANC",
                                          "SUSP",
                                        ].includes(bStatus);

                                        // Assign priority scores (lower = higher priority)
                                        let aPriority = 0;
                                        let bPriority = 0;

                                        if (aLive) aPriority = 1;
                                        else if (aUpcoming) aPriority = 2;
                                        else if (aEnded) aPriority = 3;
                                        else aPriority = 4; // Other statuses

                                        if (bLive) bPriority = 1;
                                        else if (bUpcoming) bPriority = 2;
                                        else if (bEnded) bPriority = 3;
                                        else bPriority = 4; // Other statuses

                                        // First sort by priority
                                        if (aPriority !== bPriority) {
                                          return aPriority - bPriority;
                                        }

                                        // If same priority, sort by time within category
                                        if (aLive && bLive) {
                                          // For live matches, show earliest start time first
                                          return aDate - bDate;
                                        }

                                        if (aUpcoming && bUpcoming) {
                                          // For upcoming matches, show earliest start time first
                                          return aDate - bDate;
                                        }

                                        if (aEnded && bEnded) {
                                          // For ended matches, show most recent first
                                          return bDate - aDate;
                                        }

                                        // Default time-based sorting
                                        return aDate - bDate;
                                      })
                                      .map((match: any, matchIndex) => (

                                        
                                          {/* Star Button with true slide-in effect */}
                                          
                                            
                                              
                                                starred"
                                              : ""
                                            }`}
                                          />
                                        
                                          {/* Three-grid layout container */}
                                          
                                            {/* Top Grid: Match Status */}
                                            
                                              {(() => {
                                                const status = match.fixture.status.short;

                                                // Live matches status
                                                if (
                                                  [
                                                    "LIVE",
                                                    "LIV",
                                                    "1H",
                                                    "HT",
                                                    "2H",
                                                    "ET",
                                                  ].includes(status)
                                                ) {
                                                  return (
                                                    
                                                      {status === "HT"
                                                        ? "Halftime"
                                                        : `${match.fixture.status.elapsed || 0}'`}
                                                    
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
                                                    
                                                      {statusText}
                                                    
                                                  );
                                                }

                                                // Upcoming matches (TBD status)
                                                if (status === "TBD") {
                                                  return (
                                                    
                                                      Time TBD
                                                    
                                                  );
                                                }

                                                // Default - no status display for regular upcoming matches
                                                return null;
                                              })()}
                                            

                                            {/* Middle Grid: Main match content */}
                                            
                                              {/* Home Team Name - positioned further left */}
                                              
                                                {shortenTeamName(match.teams.home.name) ||
                                                  "Unknown Team"}
                                              

                                              {/* Home team logo - grid area */}
                                              
                                                {(() => {
                                                  // Check if this is a national team
                                                  const isActualNationalTeam = isNationalTeam(match.teams.home, {
                                                    name: leagueData.league.name,
                                                    country: leagueData.league.country,
                                                  });

                                                  // Check for youth teams
                                                  const isYouthTeam = match.teams.home.name?.includes("U20") || 
                                                                    match.teams.home.name?.includes("U21") ||
                                                                    match.teams.home.name?.includes("U19") ||
                                                                    match.teams.home.name?.includes("U23");

                                                  // Use MyCircularFlag for all national teams and youth teams
                                                  if (isActualNationalTeam || isYouthTeam) {
                                                    return (
                                                      
                                                        
                                                      
                                                    );
                                                  }

                                                  // Default to regular team logo for club teams
                                                  return (
                                                    
                                                      
                                                        
                                                      
                                                    
                                                  );
                                                })()}
                                              

                                              {/* Score/Time Center - Fixed width and centered */}
                                              
                                {(() => {
                                  const status = match.fixture.status.short;
                                  const fixtureDate = parseISO(match.fixture.date);

                                  // Get smart time filter result for consistent status handling
                                  const smartResult = MySmartTimeFilter.getSmartTimeLabel(
                                    match.fixture.date,
                                    status,
                                    selectedDate + 'T12:00:00Z'
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
                                    ].includes(displayStatus)
                                  ) {
                                    return (
                                      
                                        
                                          {match.goals.home ?? 0}
                                        
                                        -
                                        
                                          {match.goals.away ?? 0}
                                        
                                      
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
                                        
                                          
                                            {homeScore}
                                          
                                          -
                                          
                                            {awayScore}
                                          
                                        
                                      );
                                    } else {
                                      // Match is finished but no valid score data - show time in user's timezone
                                      return (
                                        
                                          {format(fixtureDate, "HH:mm")}
                                        
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
                                      
                                        {format(fixtureDate, "HH:mm")}
                                      
                                    );
                                  }

                                  // Upcoming matches (NS = Not Started, TBD = To Be Determined)
                                  // Show time in user's local timezone (date-fns format automatically converts from UTC)
                                  return (
                                    
                                      {displayStatus === "TBD"
                                        ? "TBD"
                                        : format(fixtureDate, "HH:mm")}
                                    
                                  );
                                })()}
                                              

                                              {/* Away team logo - grid area */}
                                              
                                                {(() => {
                                                  // Check if this is a national team
                                                  const isActualNationalTeam = isNationalTeam(match.teams.away, {
                                                    name: leagueData.league.name,
                                                    country: leagueData.league.country,
                                                  });

                                                  // Check for youth teams
                                                  const isYouthTeam = match.teams.away.name?.includes("U20") || 
                                                                    match.teams.away.name?.includes("U21") ||
                                                                    match.teams.away.name?.includes("U19") ||
                                                                    match.teams.away.name?.includes("U23");

                                                  // Use MyCircularFlag for all national teams and youth teams
                                                  if (isActualNationalTeam || isYouthTeam) {
                                                    return (
                                                      
                                                        
                                                      
                                                    );
                                                  }

                                                  // Default to regular team logo for club teams
                                                  return (
                                                    
                                                      
                                                        
                                                      
                                                    
                                                  );
                                                })()}
                                              

                                              {/* Away Team Name - positioned further right */}
                                              
                                                {shortenTeamName(match.teams.away.name) ||
                                                  "Unknown Team"}
                                              
                                            

                                            {/* Bottom Grid: Penalty Result Status */}
                                            
                                              {(() => {
                                                const status = match.fixture.status.short;
                                                const isPenaltyMatch = status === "PEN";
                                                const penaltyHome =
                                                  match.score?.penalty?.home;
                                                const penaltyAway =
                                                  match.score?.penalty?.away;
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
                                                    
                                                      
                                                        {winnerText}
                                                      
                                                    
                                                  );
                                                }
                                                return null;
                                              })()}
                                            
                                          
                                        
                                      ))
                                    }
                                  
                                )}
                              
                            );
                            })}
                        
                      )}
                    
                  
                
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodaysMatchesByCountryNew;