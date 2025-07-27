import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import MyMatchdetailsScoreboard from "./MyMatchdetailsScoreboard";
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
import "../../styles/flasheffect.css";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";
import { useCentralData } from "../../providers/CentralDataProvider";
import CombinedLeagueCards from "./CombinedLeagueCards";

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
  onMatchCardClick?: (fixture: any) => void;
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  refreshInterval = 30000,
  isTimeFilterActive = false,
  liveFilterActive = false,
  timeFilterActive = false,
  onMatchCardClick,
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(),
  );
  const [enableFetching, setEnableFetching] = useState(true);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  const [visibleMatches, setVisibleMatches] = useState<Set<number>>(new Set());
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Flash animation states
  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(new Set());
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(new Set());
  const [goalFlashMatches, setGoalFlashMatches] = useState<Set<number>>(new Set());
  const [previousMatchStatuses, setPreviousMatchStatuses] = useState<Map<number, string>>(new Map());
  const [previousMatchScores, setPreviousMatchScores] = useState<Map<number, {home: number, away: number}>>(new Map());

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

  // Enhanced effect to detect status and score changes with flash effects - matches MyNewLeague implementation
  useEffect(() => {
    if (!filteredFixtures?.length) return;

    const newHalftimeMatches = new Set<number>();
    const newFulltimeMatches = new Set<number>();
    const newGoalMatches = new Set<number>();
    const currentStatuses = new Map<number, string>();
    const currentScores = new Map<number, {home: number, away: number}>();

    filteredFixtures.forEach((fixture) => {
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
        console.log(`🔄 [TodayMatchByTime STATUS TRANSITION] Match ${matchId}:`, {
          teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          transition: `${previousStatus} → ${currentStatus}`,
          time: new Date().toLocaleTimeString()
        });

        // Check if status just changed to halftime
        if (currentStatus === 'HT') {
          console.log(`🟠 [TodayMatchByTime HALFTIME FLASH] Match ${matchId} just went to halftime!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousStatus,
            currentStatus
          });
          newHalftimeMatches.add(matchId);
        }

        // Check if status just changed to fulltime
        if (currentStatus === 'FT') {
          console.log(`🔵 [TodayMatchByTime FULLTIME FLASH] Match ${matchId} just finished!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousStatus,
            currentStatus
          });
          newFulltimeMatches.add(matchId);
        }
      }

      // Check for goal changes during live matches
      if (previousScore && 
          (currentScore.home !== previousScore.home || currentScore.away !== previousScore.away) &&
          ['1H', '2H', 'LIVE', 'LIV'].includes(currentStatus)) {
        console.log(`⚽ [TodayMatchByTime GOAL FLASH] Match ${matchId} score changed!`, {
          home: fixture.teams?.home?.name,
          away: fixture.teams?.away?.name,
          previousScore,
          currentScore,
          status: currentStatus
        });
        newGoalMatches.add(matchId);
      }
    });

    // Only update state if there are actual changes to prevent infinite loops
    setPreviousMatchStatuses(prev => {
      const hasChanges = Array.from(currentStatuses.entries()).some(([id, status]) => prev.get(id) !== status);
      return hasChanges ? currentStatuses : prev;
    });

    setPreviousMatchScores(prev => {
      const hasChanges = Array.from(currentScores.entries()).some(([id, score]) => {
        const prevScore = prev.get(id);
        return !prevScore || prevScore.home !== score.home || prevScore.away !== score.away;
      });
      return hasChanges ? currentScores : prev;
    });

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
  }, [filteredFixtures, previousMatchStatuses, previousMatchScores]);

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

  // Initialize intersection observer for lazy loading
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const matchId = parseInt(entry.target.getAttribute('data-match-id') || '0');
            if (matchId) {
              setVisibleMatches((prev) => new Set(prev).add(matchId));
            }
          }
        });
      },
      { 
        rootMargin: '100px',
        threshold: 0.1 
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Lazy loading ref callback
  const createLazyRef = useCallback((matchId: number) => {
    return (node: HTMLDivElement | null) => {
      if (node && observerRef.current && !node.hasAttribute('data-observed')) {
        node.setAttribute('data-match-id', matchId.toString());
        node.setAttribute('data-observed', 'true');
        observerRef.current.observe(node);
      }
    };
  }, []);

  const handleMatchClick = (match: any) => {
    // Set the selected match locally instead of passing up
    setSelectedMatch(match);

    // Still call parent callback if provided for any additional handling
    if (onMatchCardClick) {
      onMatchCardClick(match);
    }
  };

  const handleBackToMatches = () => {
    setSelectedMatch(null);
  };

  if (isLoadingCentral) {
    return null; // Let CombinedLeagueCards handle loading state
  }

  // Lazy loading skeleton component
  const LazyMatchSkeleton = () => (
    <div className="country-matches-container">
      <div className="match-card-container">
        <div className="match-three-grid-container">
          <div className="match-status-top">
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="match-content-container">
            <div className="home-team-name">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="home-team-logo-container">
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <div className="match-score-container">
              <Skeleton className="h-6 w-12" />
            </div>
            <div className="away-team-logo-container">
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <div className="away-team-name">
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="match-penalty-bottom">
            {/* Empty for additional info */}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {selectedMatch ? (
        // Show match details when a match is selected
        <MyMatchdetailsScoreboard 
          match={selectedMatch} 
          onClose={handleBackToMatches}
        />
      ) : (
        // Show match list when no match is selected
        <CombinedLeagueCards
          selectedDate={selectedDate}
          timeFilterActive={timeFilterActive}
          showTop20={true}
          liveFilterActive={liveFilterActive}
          filteredFixtures={filteredFixtures}
          onMatchCardClick={handleMatchClick}
          lazyLoadingProps={{
            visibleMatches,
            createLazyRef,
            LazyMatchSkeleton
          }}
        />
      )}
    </>
  );
};

export default TodayMatchByTime;