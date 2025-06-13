import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Calendar, Clock, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { RootState, userActions } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
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
import { isNationalTeam } from "../../lib/teamLogoSources";
import { SimpleDateFilter } from "../../lib/simpleDateFilter";
import "../../styles/MyLogoPositioning.css";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";
import { useCentralData } from "../../providers/CentralDataProvider";

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

interface TodayMatchByTimeProps {
  selectedDate: string;
  refreshInterval?: number;
  isTimeFilterActive?: boolean;
  liveFilterActive?: boolean;
  timeFilterActive?: boolean;
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  refreshInterval = 30000,
  isTimeFilterActive = false,
  liveFilterActive = false,
  timeFilterActive = false,
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(),
  );
  const [enableFetching, setEnableFetching] = useState(true);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());

  // Fetch live fixtures only
  const { data: liveFixturesData = [], isLoading: liveLoading } = useQuery({
    queryKey: ["live-fixtures-all-countries"],
    queryFn: async () => {
      console.log("Fetching live fixtures for all countries");
      const response = await apiRequest("GET", "/api/fixtures/live");
      const data = await response.json();
      console.log(`Received ${data.length} live fixtures`);
      return data;
    },
    staleTime: 30000,
    gcTime: 2 * 60 * 1000,
    enabled: enableFetching,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: refreshInterval,
  });

  // Process live fixtures
  const processedLiveFixtures = useMemo(() => {
    return liveFixturesData.filter((fixture) => {
      const status = fixture.fixture.status.short;
      return ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status);
    });
  }, [liveFixturesData]);

  // Calculate summary stats from live fixtures only (popular league stats will be shown in TodayPopularFootballLeaguesNew)
  const summaryStats = useMemo(() => {
    const liveCount = processedLiveFixtures.length;

    // Get top leagues and countries from live matches
    const leagueCounts = processedLiveFixtures.reduce((acc: any, f) => {
      const leagueName = f.league?.name;
      if (leagueName) {
        acc[leagueName] = (acc[leagueName] || 0) + 1;
      }
      return acc;
    }, {});

    const countryCounts = processedLiveFixtures.reduce((acc: any, f) => {
      const country = f.league?.country;
      if (country) {
        acc[country] = (acc[country] || 0) + 1;
      }
      return acc;
    }, {});

    const topLeagues = Object.entries(leagueCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([name]) => name);

    const topCountries = Object.entries(countryCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([name]) => name);

    return {
      liveCount,
      topLeagues,
      topCountries,
    };
  }, [processedLiveFixtures]);

  // Use central data cache
  const { fixtures, liveFixtures, isLoading, error } = useCentralData();

  console.log(`📊 [TodayMatchByTime] Got ${fixtures?.length || 0} fixtures from central cache`);

    // Define shouldExcludeFixture function
    const shouldExcludeFixture = (leagueName: string, homeTeam: string, awayTeam: string): boolean => {
      const excludedLeagues = ["Belarusian"];
      const excludedTeams = ["BATE", "Dinamo Minsk", "Shakhtyor"];

      if (excludedLeagues.some(excludedLeague => leagueName.includes(excludedLeague))) {
        return true;
      }

      if (excludedTeams.some(excludedTeam => homeTeam.includes(excludedTeam) || awayTeam.includes(excludedTeam))) {
        return true;
      }

      return false;
    };

  // Apply component-specific filtering
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length) {
      console.log(`⚠️ [TodayMatchByTime] No fixtures available from central cache`);
      return [];
    }

    // Apply smart time filtering
    const timeFilterResult = MySmartTimeFilter.filterTodayFixtures(fixtures, selectedDate);
    const timeFiltered = timeFilterResult.todayFixtures;
    console.log(`📊 [TodayMatchByTime] After time filtering: ${timeFiltered.length} fixtures`);

    // Apply exclusion filtering if needed
    const exclusionFiltered = timeFiltered.filter(fixture => {
      if (!fixture?.league || !fixture?.teams) return false;
      const leagueName = fixture.league.name || '';
      const homeTeam = fixture.teams.home.name || '';
      const awayTeam = fixture.teams.away.name || '';
      return !shouldExcludeFixture(leagueName, homeTeam, awayTeam);
    });

    console.log(`📊 [TodayMatchByTime] After exclusion filtering: ${exclusionFiltered.length} fixtures`);
    return exclusionFiltered;
  }, [fixtures, selectedDate]);

  const allFixturesError = error;

  const isLoadingCentral = isLoading;

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

  if (isLoadingCentral) {
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

  return (
    <>
      {/* Use new CombinedLeagueCards component */}
      <CombinedLeagueCards
        selectedDate={selectedDate}
        timeFilterActive={timeFilterActive}
        showTop20={true}
        liveFilterActive={liveFilterActive}
        filteredFixtures={filteredFixtures}
      />
    </>
  );
};

export default TodayMatchByTime;