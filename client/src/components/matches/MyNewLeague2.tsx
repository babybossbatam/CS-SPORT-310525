import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";
import BrandedLoading from "../common/BrandedLoading";
import { formatMatchTimeWithTimezone } from "@/lib/timezoneApiService";
import "../../styles/MyLogoPositioning.css";
import "../../styles/flasheffect.css";

// Intersection Observer Hook for lazy loading
const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      const isElementIntersecting = entry.isIntersecting;
      setIsIntersecting(isElementIntersecting);

      if (isElementIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, hasIntersected, options.threshold, options.rootMargin]);

  return { isIntersecting, hasIntersected };
};

interface FixtureData {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed?: number;
    };
    venue?: {
      name: string;
      city: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
    penalty?: {
      home: number | null;
      away: number | null;
    };
  };
}

interface MyNewLeague2Props {
  selectedDate: string;
  timeFilterActive?: boolean;
  showTop10?: boolean;
  liveFilterActive?: boolean;
  onMatchCardClick?: (fixture: any | null) => void; // Callback to pass match data to parent (for MyMatchdetailsScoreboard)
  match?: any; // Current match data (used for sample display)
  useUTCOnly?: boolean;
}

// Main component that loads data
const MyNewLeague2Component: React.FC<MyNewLeague2Props> = ({
  selectedDate,
  onMatchCardClick,
  match,
}) => {
  // Sample match data for demonstration (similar to MyMatchdetailsScoreboard)
  const sampleMatch = {
    fixture: {
      id: 1100311,
      date: "2025-06-11T21:00:00+00:00",
      status: { short: "NS", long: "Not Started" },
      venue: { name: "Estadio Nacional de Lima", city: "Lima" },
      referee: "Andres Rojas, Colombia",
    },
    league: {
      id: 135,
      name: "World Cup - Qualification South America",
      country: "World",
      round: "Group Stage - 16",
    },
    teams: {
      home: {
        id: 2382,
        name: "Portugal U21",
        logo: "https://media.api-sports.io/football/teams/2382.png",
      },
      away: {
        id: 768,
        name: "France U21",
        logo: "https://media.api-sports.io/football/teams/768.png",
      },
    },
    goals: {
      home: null,
      away: null,
    },
    score: {
      halftime: { home: null, away: null },
      fulltime: { home: null, away: null },
    },
  };

  // Use passed match data or fallback to sample (like MyMatchdetailsScoreboard)
  const displayMatch = match || sampleMatch;

  // Define league context for logo rendering
  const leagueContext = {
    leagueId: displayMatch?.league?.id || null,
    leagueName: displayMatch?.league?.name || null,
    country: displayMatch?.league?.country || null,
  };

  // Debug: Log the match data being received
  console.log("🎯 [MyNewLeague2] Received match data:", {
    hasMatch: !!match,
    fixtureId: displayMatch?.fixture?.id,
    teams: `${displayMatch?.teams?.home?.name} vs ${displayMatch?.teams?.away?.name}`,
    status: displayMatch?.fixture?.status?.short,
    league: displayMatch?.league?.name,
  });

  const [, navigate] = useLocation();
  const [collapsedLeagues, setCollapsedLeagues] = useState<Set<number>>(
    new Set(),
  );
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(
    new Set(),
  );
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [hoveredMatchId, setHoveredMatchId] = useState<number | null>(null);
  const [manuallyDeselectedMatches, setManuallyDeselectedMatches] = useState<Set<number>>(new Set());

  // League IDs without any filtering - removed duplicates
  const leagueIds = [
    38, 15, 2, 4, 10, 11, 848, 886, 1022, 772, 71, 3, 5, 531, 22, 72, 73, 75,
    76, 233, 667, 940, 908, 1169, 23, 1077, 253, 850, 893, 921, 130, 128, 493,
    239, 265, 237, 235, 743,
  ];

  // Helper function to add delay between requests
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Helper function to check if match ended more than 4 hours ago
  const isMatchOldEnded = useCallback((fixture: FixtureData): boolean => {
    const status = fixture.fixture.status.short;
    const isEnded = [
      "FT",
      "AET",
      "PEN",
      "AWD",
      "WO",
      "ABD",
      "CANC",
      "SUSP",
    ].includes(status);

    if (!isEnded) return false;

    const matchDate = new Date(fixture.fixture.date);
    const hoursAgo = (Date.now() - matchDate.getTime()) / (1000 * 60 * 60);

    return hoursAgo > 2;
  }, []);

  // Check localStorage quota and manage storage efficiently
  const checkStorageQuota = useCallback(() => {
    try {
      const test = 'test';
      localStorage.setItem('quota_test', test);
      localStorage.removeItem('quota_test');
      return true;
    } catch (error) {
      console.warn('🚨 [MyNewLeague2] localStorage quota exceeded, emergency cleanup...');
      
      try {
        // Emergency cleanup - remove ALL cache entries to free up space
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('ended_matches_') ||
            key.startsWith('league-fixtures-') ||
            key.startsWith('featured-match-') ||
            key.startsWith('popular_') ||
            key.includes('cache') ||
            key.includes('logo') ||
            key.includes('flag')
          )) {
            keysToRemove.push(key);
          }
        }
        
        // Remove all cache entries in emergency
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            // Ignore errors during cleanup
          }
        });
        
        console.log(`🧹 [MyNewLeague2] Emergency cleanup: removed ${keysToRemove.length} cache entries`);
        
        // Try to set test again after cleanup
        try {
          localStorage.setItem('quota_test_after_cleanup', 'test');
          localStorage.removeItem('quota_test_after_cleanup');
          return true;
        } catch (e) {
          console.error('🚨 [MyNewLeague2] Still quota exceeded after emergency cleanup');
          return false;
        }
      } catch (cleanupError) {
        console.error('🚨 [MyNewLeague2] Error during emergency cleanup:', cleanupError);
        return false;
      }
    }
  }, []);

  // Cache key for ended matches
  const getCacheKey = useCallback((date: string, leagueId: number) => {
    return `ended_matches_${date}_${leagueId}`;
  }, []);

  // Get cached ended matches with strict date validation
  const getCachedEndedMatches = useCallback(
    (date: string, leagueId: number): FixtureData[] => {
      try {
        const cacheKey = getCacheKey(date, leagueId);
        const cached = localStorage.getItem(cacheKey);

        if (!cached) return [];

        const parsedCache = JSON.parse(cached);
        
        // Handle both old and new cache formats
        const fixtures = parsedCache.fixtures || parsedCache.f || [];
        const timestamp = parsedCache.timestamp || parsedCache.t || 0;
        const cachedDate = parsedCache.date || parsedCache.d || '';

        // CRITICAL: Ensure cached date exactly matches requested date
        if (cachedDate !== date) {
          console.log(
            `🚨 [MyNewLeague2] Date mismatch in cache - cached: ${cachedDate}, requested: ${date}, clearing cache`,
          );
          localStorage.removeItem(cacheKey);
          return [];
        }

        const cacheAge = Date.now() - timestamp;
        const today = new Date().toISOString().slice(0, 10);
        const isToday = date === today;

        // For ended matches older than 4h: 7 days cache (much longer for optimization)
        // For today: 30 minutes max (shorter for live data accuracy)
        const maxCacheAge = isToday ? 30 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

        if (cacheAge < maxCacheAge && fixtures.length > 0) {
          console.log(
            `✅ [MyNewLeague2] Using cached ended matches for league ${leagueId} on ${date}: ${fixtures.length} matches`,
          );
          
          // Convert minimal format back to full format if needed
          if (fixtures[0] && fixtures[0].f) {
            // New minimal format - convert back
            return fixtures.map((f: any) => ({
              fixture: {
                id: f.f.i,
                date: f.f.d,
                status: { short: f.f.s }
              },
              league: {
                id: f.l.i,
                name: f.l.n
              },
              teams: {
                home: {
                  id: f.t.h.i,
                  name: f.t.h.n
                },
                away: {
                  id: f.t.a.i,
                  name: f.t.a.n
                }
              },
              goals: f.g
            }));
          } else {
            // Old format - use as is
            return fixtures;
          }
        } else {
          // Remove expired or empty cache
          localStorage.removeItem(cacheKey);
          console.log(
            `⏰ [MyNewLeague2] Removed expired/empty cache for league ${leagueId} on ${date} (age: ${Math.round(cacheAge / 60000)}min)`,
          );
        }
      } catch (error) {
        console.error("Error reading cached ended matches:", error);
        // Clear corrupted cache
        const cacheKey = getCacheKey(date, leagueId);
        localStorage.removeItem(cacheKey);
      }

      return [];
    },
    [getCacheKey],
  );

  // Cache ended matches with quota management
  const cacheEndedMatches = useCallback(
    (date: string, leagueId: number, fixtures: FixtureData[]) => {
      try {
        const endedFixtures = fixtures.filter(isMatchOldEnded);

        if (endedFixtures.length === 0) return;

        // Skip caching for large leagues to prevent quota issues
        if (endedFixtures.length > 50) {
          console.log(`⚠️ [MyNewLeague2] Skipping cache for large league ${leagueId} (${endedFixtures.length} matches)`);
          return;
        }

        // Check quota before attempting to cache
        if (!checkStorageQuota()) {
          console.warn(`⚠️ [MyNewLeague2] Skipping cache for league ${leagueId} due to quota limits`);
          return;
        }

        const cacheKey = getCacheKey(date, leagueId);
        
        // Create ultra-minimal cache data - only absolute essentials
        const ultraMinimalFixtures = endedFixtures.slice(0, 20).map(fixture => ({
          f: { // fixture
            i: fixture.fixture.id, // id
            d: fixture.fixture.date, // date
            s: fixture.fixture.status.short // status
          },
          l: { // league
            i: fixture.league.id, // id
            n: fixture.league.name.substring(0, 30) // name (truncated)
          },
          t: { // teams
            h: { // home
              i: fixture.teams.home.id,
              n: fixture.teams.home.name.substring(0, 20) // truncated name
            },
            a: { // away
              i: fixture.teams.away.id,
              n: fixture.teams.away.name.substring(0, 20) // truncated name
            }
          },
          g: fixture.goals // goals
        }));

        const cacheData = {
          f: ultraMinimalFixtures, // fixtures
          t: Date.now(), // timestamp
          d: date, // date
          l: leagueId, // league
        };

        const jsonString = JSON.stringify(cacheData);
        
        // Check if the data is too large (> 50KB)
        if (jsonString.length > 50000) {
          console.log(`⚠️ [MyNewLeague2] Cache data too large for league ${leagueId}, skipping`);
          return;
        }

        localStorage.setItem(cacheKey, jsonString);
        console.log(
          `💾 [MyNewLeague2] Cached ${ultraMinimalFixtures.length} ended matches for league ${leagueId} (${jsonString.length} bytes)`,
        );
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.warn(`🚨 [MyNewLeague2] Quota exceeded while caching league ${leagueId}, cleaning up...`);
          if (checkStorageQuota()) {
            // Try caching again with even less data after cleanup
            try {
              const cacheKey = getCacheKey(date, leagueId);
              const minimalData = {
                f: [], // Empty to save space
                t: Date.now(),
                d: date,
                l: leagueId,
              };
              localStorage.setItem(cacheKey, JSON.stringify(minimalData));
            } catch (retryError) {
              console.warn(`⚠️ [MyNewLeague2] Failed to cache even after cleanup for league ${leagueId}`);
            }
          }
        } else {
          console.error("Error caching ended matches:", error);
        }
      }
    },
    [getCacheKey, isMatchOldEnded, checkStorageQuota],
  );

  // Smart cache configuration based on live match detection (will be set in useEffect)
  const [dynamicCacheConfig, setDynamicCacheConfig] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    const isToday = selectedDate === today;
    
    return isToday ? {
      staleTime: 5 * 60 * 1000, // 5 minutes - default for today
      refetchInterval: 60 * 1000, // 1 minute - default for today
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    } : {
      staleTime: 60 * 60 * 1000, // 1 hour - for past/future dates
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    };
  });

  // Get query client for cache management
  const queryClient = useQueryClient();

  // Cleanup old cache entries on mount to prevent quota issues
  useEffect(() => {
    const cleanupOldCache = () => {
      try {
        const keys = Object.keys(localStorage);
        const allCacheKeys = keys.filter(key => 
          key.startsWith('ended_matches_') ||
          key.startsWith('league-fixtures-') ||
          key.startsWith('featured-match-') ||
          key.startsWith('popular_') ||
          key.includes('cache')
        );
        
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // Reduced to 1 day
        
        let cleanedCount = 0;
        let totalCacheSize = 0;
        
        // Calculate total cache size and remove old entries
        allCacheKeys.forEach(key => {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              totalCacheSize += cached.length;
              
              // Try to parse and check timestamp
              const parsedCache = JSON.parse(cached);
              const timestamp = parsedCache.timestamp || parsedCache.t || 0;
              const age = now - timestamp;
              
              if (age > maxAge || timestamp === 0) {
                localStorage.removeItem(key);
                cleanedCount++;
              }
            }
          } catch (error) {
            // Remove corrupted entries
            localStorage.removeItem(key);
            cleanedCount++;
          }
        });
        
        // If cache is still too large (> 1MB), remove more aggressively
        if (totalCacheSize > 1000000) {
          console.warn(`🚨 [MyNewLeague2] Cache size too large (${Math.round(totalCacheSize/1024)}KB), aggressive cleanup...`);
          
          const remainingKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('ended_matches_') ||
            key.startsWith('league-fixtures-') ||
            key.startsWith('featured-match-')
          );
          
          // Remove 80% of remaining cache entries
          const toRemove = Math.ceil(remainingKeys.length * 0.8);
          for (let i = 0; i < toRemove && i < remainingKeys.length; i++) {
            localStorage.removeItem(remainingKeys[i]);
            cleanedCount++;
          }
        }
        
        if (cleanedCount > 0) {
          console.log(`🧹 [MyNewLeague2] Cleaned up ${cleanedCount} cache entries on mount (was ${Math.round(totalCacheSize/1024)}KB)`);
        }
        
        // Final quota check
        checkStorageQuota();
      } catch (error) {
        console.error('Error during cache cleanup:', error);
        // Emergency cleanup if regular cleanup fails
        try {
          Object.keys(localStorage).forEach(key => {
            if (key.includes('cache') || key.includes('matches') || key.includes('league')) {
              localStorage.removeItem(key);
            }
          });
        } catch (e) {
          console.error('Emergency cleanup also failed:', e);
        }
      }
    };
    
    cleanupOldCache();
  }, [checkStorageQuota]);

  // Fetch fixtures for all leagues with optimized caching for ended matches
  const {
    data: allFixtures,
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["myNewLeague2", "allFixtures", selectedDate],
    queryFn: async () => {
      console.log(
        `🎯 [MyNewLeague2] Fetching fixtures for ${leagueIds.length} leagues on ${selectedDate}:`,
        leagueIds,
      );

      // First, get cached ended matches for all leagues
      const cachedEndedMatches: FixtureData[] = [];
      leagueIds.forEach((leagueId) => {
        const cached = getCachedEndedMatches(selectedDate, leagueId);
        cachedEndedMatches.push(...cached);
      });

      console.log(
        `💾 [MyNewLeague2] Retrieved ${cachedEndedMatches.length} cached ended matches`,
      );

      // Process leagues in batches to avoid rate limiting
      const batchSize = 3; // Reduce concurrent requests
      const results: any[] = [];

      for (let i = 0; i < leagueIds.length; i += batchSize) {
        const batch = leagueIds.slice(i, i + batchSize);
        console.log(
          `🔄 [MyNewLeague2] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(leagueIds.length / batchSize)}: leagues ${batch.join(", ")}`,
        );

        const batchPromises = batch.map(async (leagueId, index) => {
          // Add small delay between requests in the same batch
          if (index > 0) {
            await delay(25); // 25ms delay between requests
          }

          try {
            const response = await fetch(`/api/leagues/${leagueId}/fixtures`);

            if (!response.ok) {
              if (response.status === 429) {
                console.warn(
                  `⚠️ [MyNewLeague2] Rate limited for league ${leagueId}, will use cached data if available`,
                );
                return {
                  leagueId,
                  fixtures: [],
                  error: "Rate limited",
                  rateLimited: true,
                };
              }
              console.log(
                `❌ [MyNewLeague2] Failed to fetch league ${leagueId}: ${response.status} ${response.statusText}`,
              );
              return {
                leagueId,
                fixtures: [],
                error: `HTTP ${response.status}`,
              };
            }

            const data = await response.json();
            const fixtures = data.response || data || [];

            // Cache ended matches for this league
            cacheEndedMatches(selectedDate, leagueId, fixtures);

            console.log(
              `✅ [MyNewLeague2] League ${leagueId}: ${fixtures.length} fixtures`,
            );
            return { leagueId, fixtures, error: null };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";

            // Handle specific fetch errors
            if (
              errorMessage.includes("Failed to fetch") ||
              errorMessage.includes("fetch")
            ) {
              console.warn(
                `🌐 [MyNewLeague2] Network error for league ${leagueId}: ${errorMessage}`,
              );
              return {
                leagueId,
                fixtures: [],
                error: "Network error",
                networkError: true,
              };
            }

            console.error(
              `❌ [MyNewLeague2] Error fetching league ${leagueId}:`,
              error,
            );
            return { leagueId, fixtures: [], error: errorMessage };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to be more API-friendly
        if (i + batchSize < leagueIds.length) {
          console.log(`⏳ [MyNewLeague2] Waiting 500ms before next batch...`);
          await delay(25);
        }
      }

      // Combine fresh fixtures with cached ended matches
      const allFixturesMap = new Map<number, FixtureData>();

      // Add cached ended matches first
      cachedEndedMatches.forEach((fixture) => {
        if (fixture?.fixture?.id && !allFixturesMap.has(fixture.fixture.id)) {
          allFixturesMap.set(fixture.fixture.id, fixture);
        }
      });

      // Add fresh fixtures (this will overwrite cached ones if they exist in fresh data)
      results.forEach((result) => {
        result.fixtures.forEach((fixture: FixtureData) => {
          if (fixture?.fixture?.id) {
            // Only add if not cached or if it's not an old ended match
            if (
              !allFixturesMap.has(fixture.fixture.id) ||
              !isMatchOldEnded(fixture)
            ) {
              allFixturesMap.set(fixture.fixture.id, fixture);
            }
          }
        });
      });

      const allFixtures = Array.from(allFixturesMap.values());

      // Log detailed results
      console.log(`🔄 [MyNewLeague2] Fetch results:`, {
        totalLeagues: results.length,
        successfulFetches: results.filter((r) => r.fixtures.length > 0).length,
        cachedEndedMatches: cachedEndedMatches.length,
        totalFixtures: allFixtures.length,
        duplicatesRemoved:
          results.reduce((sum, r) => sum + r.fixtures.length, 0) +
          cachedEndedMatches.length -
          allFixtures.length,
        leagueBreakdown: results.map((r) => ({
          league: r.leagueId,
          fixtures: r.fixtures.length,
          error: r.error,
        })),
      });

      return allFixtures;
    },
    // Apply dynamic cache configuration
    ...dynamicCacheConfig,
    // Additional configuration for better UX
    retry: (failureCount, error) => {
      // Don't retry too aggressively for historical data (no refetchInterval)
      if (!dynamicCacheConfig.refetchInterval) return failureCount < 2;
      // For live data, allow more retries
      return failureCount < 3;
    },
  });

  // Smart cache adjustment based on live match detection and proximity to kickoff
  useEffect(() => {
    if (!allFixtures || allFixtures.length === 0) return;

    const today = new Date().toISOString().slice(0, 10);
    const isToday = selectedDate === today;
    const now = new Date();

    const liveMatches = allFixtures.filter((match) =>
      ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(
        match?.fixture?.status?.short,
      ),
    );

    // Check for matches starting soon (within 2 hours)
    const upcomingMatches = allFixtures.filter((match) => {
      if (match?.fixture?.status?.short !== "NS") return false;
      const matchTime = new Date(match.fixture.date);
      const minutesUntilKickoff = (matchTime.getTime() - now.getTime()) / (1000 * 60);
      return minutesUntilKickoff > 0 && minutesUntilKickoff <= 120; // Within 2 hours
    });

    // Check for matches starting very soon (within 30 minutes)
    const imminentMatches = allFixtures.filter((match) => {
      if (match?.fixture?.status?.short !== "NS") return false;
      const matchTime = new Date(match.fixture.date);
      const minutesUntilKickoff = (matchTime.getTime() - now.getTime()) / (1000 * 60);
      return minutesUntilKickoff > 0 && minutesUntilKickoff <= 30; // Within 30 minutes
    });

    let newCacheConfig;

    if (liveMatches.length > 0 && isToday) {
      // LIVE matches detected - most aggressive cache
      newCacheConfig = {
        staleTime: 1 * 60 * 1000, // 1 minute
        refetchInterval: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: false,
        refetchOnReconnect: true
      };
      console.log(`🔴 [MyNewLeague2] ${liveMatches.length} live matches detected - using most aggressive cache (1min/30s)`);
    } else if (imminentMatches.length > 0 && isToday) {
      // Matches starting within 30 minutes - very aggressive cache
      newCacheConfig = {
        staleTime: 2 * 60 * 1000, // 2 minutes
        refetchInterval: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: false,
        refetchOnReconnect: true
      };
      console.log(`🟡 [MyNewLeague2] ${imminentMatches.length} matches starting within 30min - using very aggressive cache (2min/30s)`);
    } else if (upcomingMatches.length > 0 && isToday) {
      // Matches starting within 2 hours - aggressive cache
      newCacheConfig = {
        staleTime: 3 * 60 * 1000, // 3 minutes
        refetchInterval: 45 * 1000, // 45 seconds
        refetchOnWindowFocus: false,
        refetchOnReconnect: true
      };
      console.log(`🟠 [MyNewLeague2] ${upcomingMatches.length} matches starting within 2h - using aggressive cache (3min/45s)`);
    } else if (isToday && liveMatches.length === 0) {
      // Today but no live or imminent matches - moderate cache
      newCacheConfig = {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        refetchOnReconnect: true
      };
      console.log(`⏸️ [MyNewLeague2] No live/imminent matches on today's date - using moderate cache (5min/1min)`);
    } else {
      // Past/future dates - extended cache
      newCacheConfig = {
        staleTime: 60 * 60 * 1000, // 1 hour
        refetchInterval: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false
      };
      console.log(`📅 [MyNewLeague2] Non-today date - using extended cache (1 hour/no refetch)`);
    }

    // Update cache config if it changed
    setDynamicCacheConfig(prevConfig => {
      if (JSON.stringify(prevConfig) !== JSON.stringify(newCacheConfig)) {
        console.log(`🔄 [MyNewLeague2] Cache config updated:`, newCacheConfig);
        return newCacheConfig;
      }
      return prevConfig;
    });
  }, [allFixtures, selectedDate]);

  // Group fixtures by league with date filtering
  const fixturesByLeague = useMemo(() => {
    console.log(
      `🔍 [MyNewLeague2] Processing fixtures for date ${selectedDate}:`,
      {
        allFixturesLength: allFixtures?.length || 0,
        sampleFixtures: allFixtures?.slice(0, 3)?.map((f) => ({
          id: f?.fixture?.id,
          league: f?.league?.name,
          teams: `${f?.teams?.home?.name} vs ${f?.teams?.away?.name}`,
          date: f?.fixture?.date,
        })),
      },
    );

    if (!allFixtures?.length) {
      console.log(`❌ [MyNewLeague2] No fixtures available`);
      return {};
    }

    const grouped: { [key: number]: { league: any; fixtures: FixtureData[] } } =
      {};
    const seenFixtures = new Set<number>(); // Track seen fixture IDs to prevent duplicates
    const seenMatchups = new Set<string>(); // Track unique team matchups as well

    allFixtures.forEach((fixture: FixtureData, index) => {
      // Validate fixture structure
      if (
        !fixture ||
        !fixture.league ||
        !fixture.teams ||
        !fixture.fixture?.date ||
        !fixture.fixture?.id
      ) {
        console.warn(
          `⚠️ [MyNewLeague2] Invalid fixture at index ${index}:`,
          fixture,
        );
        return;
      }

      // Check for duplicate fixture IDs
      if (seenFixtures.has(fixture.fixture.id)) {
        console.log(
          `🔄 [MyNewLeague2] Duplicate fixture ID detected and skipped:`,
          {
            fixtureId: fixture.fixture.id,
            teams: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
            league: fixture.league.name,
          },
        );
        return;
      }

      // Create unique matchup key (team IDs + league + date)
      const matchupKey = `${fixture.teams.home.id}-${fixture.teams.away.id}-${fixture.league.id}-${fixture.fixture.date}`;

      // Check for duplicate team matchups
      if (seenMatchups.has(matchupKey)) {
        console.log(
          `🔄 [MyNewLeague2] Duplicate matchup detected and skipped:`,
          {
            fixtureId: fixture.fixture.id,
            teams: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
            league: fixture.league.name,
            matchupKey,
          },
        );
        return;
      }

      // Apply date filtering - extract date from fixture and compare with selected date
      const fixtureDate = new Date(fixture.fixture.date);
      const fixtureDateString = format(fixtureDate, "yyyy-MM-dd");

      // Only include fixtures that match the selected date
      if (fixtureDateString !== selectedDate) {
        return;
      }

      const leagueId = fixture.league.id;

      if (!grouped[leagueId]) {
        grouped[leagueId] = {
          league: fixture.league,
          fixtures: [],
        };
      }

      // Mark this fixture as seen and add it to the group
      seenFixtures.add(fixture.fixture.id);
      seenMatchups.add(matchupKey);
      grouped[leagueId].fixtures.push(fixture);

      console.log(`✅ [MyNewLeague2] Added fixture:`, {
        fixtureId: fixture.fixture.id,
        teams: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
        league: fixture.league.name,
        matchupKey,
      });
    });

    // Sort fixtures by priority within each league: Live > Upcoming > Ended
    Object.values(grouped).forEach((group) => {
      group.fixtures.sort((a, b) => {
        const aStatus = a.fixture.status.short;
        const bStatus = b.fixture.status.short;
        const aDate = new Date(a.fixture.date).getTime();
        const bDate = new Date(b.fixture.date).getTime();

        // Define status priorities
        const getStatusPriority = (status: string) => {
          // Priority 1: Live matches (highest priority)
          if (
            ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
              status,
            )
          ) {
            return 1;
          }
          // Priority 2: Upcoming matches (second priority)
          if (["NS", "TBD"].includes(status)) {
            return 2;
          }
          // Priority 3: Ended matches (third priority)
          if (
            ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(
              status,
            )
          ) {
            return 3;
          }
          // Priority 4: Other/unknown statuses (lowest priority)
          return 4;
        };

        const aPriority = getStatusPriority(aStatus);
        const bPriority = getStatusPriority(bStatus);

        // Primary sort: by status priority (Live -> Upcoming -> Ended -> Other)
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        // Secondary sort: within same status category
        if (aPriority === 1) {
          // Live matches: sort by elapsed time (shortest elapsed time first)
          const aElapsed = Number(a.fixture.status.elapsed) || 0;
          const bElapsed = Number(b.fixture.status.elapsed) || 0;
          if (aElapsed !== bElapsed) {
            return aElapsed - bElapsed;
          }
          // If same elapsed time, sort by date
          return aDate - bDate;
        }

        if (aPriority === 2) {
          // Upcoming matches: sort by earliest start time first (soonest first)
          return aDate - bDate;
        }

        if (aPriority === 3) {
          // Ended matches: sort by most recent end time first (latest finished first)
          return bDate - aDate;
        }

        // For other statuses, sort by date (earliest first)
        return aDate - bDate;
      });
    });

    const groupedKeys = Object.keys(grouped);
    const totalValidFixtures = Object.values(grouped).reduce(
      (sum, group) => sum + group.fixtures.length,
      0,
    );

    console.log(
      `✅ [MyNewLeague2] Date filtered fixtures for ${selectedDate}:`,
      {
        originalFixtures: allFixtures?.length || 0,
        filteredFixtures: totalValidFixtures,
        leagueCount: groupedKeys.length,
        leagueIds: groupedKeys,
        leagueDetails: Object.entries(grouped).map(([id, data]) => ({
          id: Number(id),
          name: data.league.name,
          fixtures: data.fixtures.length,
        })),
      },
    );

    return grouped;
  }, [allFixtures, selectedDate]);

  // Auto-expand all leagues by default when data changes
  useEffect(() => {
    const leagueKeys = Object.keys(fixturesByLeague).map(
      (leagueId) => `league-${leagueId}`,
    );
    setExpandedLeagues(new Set(leagueKeys));
  }, [fixturesByLeague]);

  const toggleStarMatch = useCallback((matchId: number) => {
    setStarredMatches((prev) => {
      const newStarred = new Set(prev);
      if (newStarred.has(matchId)) {
        newStarred.delete(matchId);
      } else {
        newStarred.add(matchId);
      }
      return newStarred;
    });
  }, []);

  const toggleLeague = useCallback((leagueId: number) => {
    setExpandedLeagues((prev) => {
      const newExpanded = new Set(prev);
      const leagueKey = `league-${leagueId}`;
      if (newExpanded.has(leagueKey)) {
        newExpanded.delete(leagueKey);
      } else {
        newExpanded.add(leagueKey);
      }
      return newExpanded;
    });
  }, []);

  const handleMatchClick = (fixture: FixtureData | null) => {
    try {
      if (fixture === null) {
        // Clear selection when null is passed (from close button)
        console.log("🎯 [MyNewLeague2] Clearing selected match");
        
        // Add the current selected match to manually deselected set
        if (selectedMatchId !== null) {
          setManuallyDeselectedMatches(prev => {
            try {
              const newSet = new Set(prev || []);
              newSet.add(selectedMatchId);
              console.log(`🚫 [MyNewLeague2] Added match ${selectedMatchId} to manually deselected set`);
              return newSet;
            } catch (error) {
              console.error("🚨 [MyNewLeague2] Error updating manually deselected matches:", error);
              return new Set();
            }
          });
        }
        
        setSelectedMatchId(null);

        // Remove selected-match CSS class from all match containers as backup
        try {
          const selectedMatches = document.querySelectorAll(".selected-match");
          if (selectedMatches) {
            selectedMatches.forEach((match) => {
              if (match && match.classList && typeof match.classList.remove === 'function') {
                match.classList.remove("selected-match");
              }
            });
          }
        } catch (error) {
          console.error("🚨 [MyNewLeague2] Error removing selected-match classes:", error);
        }

        // Also call the callback to notify parent component
        try {
          if (onMatchCardClick && typeof onMatchCardClick === 'function') {
            onMatchCardClick(null);
          }
        } catch (error) {
          console.error("🚨 [MyNewLeague2] Error calling onMatchCardClick with null:", error);
        }
        return;
      }

      // Validate fixture data structure with comprehensive null checks
      if (!fixture) {
        console.error("🚨 [MyNewLeague2] Fixture is null or undefined");
        return;
      }

      if (!fixture.fixture) {
        console.error("🚨 [MyNewLeague2] Fixture.fixture is missing:", fixture);
        return;
      }

      if (!fixture.fixture.id || typeof fixture.fixture.id !== 'number' || isNaN(fixture.fixture.id)) {
        console.error("🚨 [MyNewLeague2] Invalid fixture ID:", fixture.fixture.id);
        return;
      }

      if (!fixture.teams || !fixture.teams.home || !fixture.teams.away) {
        console.error("🚨 [MyNewLeague2] Fixture teams data is incomplete:", fixture.teams);
        return;
      }

      if (!fixture.league) {
        console.error("🚨 [MyNewLeague2] Fixture league data is missing:", fixture.league);
        return;
      }

      const matchId = fixture.fixture.id;

      console.log("🎯 [MyNewLeague2] Match card clicked:", {
        fixtureId: matchId,
        teams: `${fixture.teams?.home?.name || 'Unknown'} vs ${fixture.teams?.away?.name || 'Unknown'}`,
        league: fixture.league?.name || 'Unknown League',
        status: fixture.fixture?.status?.short || 'Unknown',
        source: "MyNewLeague2",
        currentlySelected: selectedMatchId,
      });

      // Remove disable-hover class from all match containers to allow re-selection
      try {
        const allMatchContainers = document.querySelectorAll(".match-card-container");
        if (allMatchContainers && allMatchContainers.length > 0) {
          allMatchContainers.forEach((container) => {
            if (container && container.classList && typeof container.classList.remove === 'function') {
              container.classList.remove("disable-hover");
            }
          });
        }
      } catch (error) {
        console.error("🚨 [MyNewLeague2] Error removing disable-hover classes:", error);
      }

      // Remove from manually deselected set when manually clicked
      setManuallyDeselectedMatches(prev => {
        try {
          const prevSet = prev || new Set();
          if (!prevSet || typeof prevSet.has !== 'function') {
            console.warn("🚨 [MyNewLeague2] Invalid manually deselected matches state, resetting");
            return new Set();
          }
          const newSet = new Set(prevSet);
          const wasManuallyDeselected = newSet.has(matchId);
          newSet.delete(matchId);
          if (wasManuallyDeselected) {
            console.log(`✅ [MyNewLeague2] Removed match ${matchId} from manually deselected set (user clicked)`);
          }
          return newSet;
        } catch (error) {
          console.error("🚨 [MyNewLeague2] Error updating manually deselected matches:", error);
          return new Set();
        }
      });

      // Set this match as selected
      try {
        setSelectedMatchId(matchId);
      } catch (error) {
        console.error("🚨 [MyNewLeague2] Error setting selected match ID:", error);
        return; // Stop execution if we can't set the selected match
      }

      // Call the callback to pass match data to parent component
      try {
        if (onMatchCardClick && typeof onMatchCardClick === 'function') {
          // Create a safe copy of fixture data to prevent reference issues
          const safeFixture = {
            fixture: {
              id: fixture.fixture.id,
              date: fixture.fixture.date || '',
              status: { 
                short: fixture.fixture.status?.short || 'NS',
                long: fixture.fixture.status?.long || 'Not Started',
                elapsed: fixture.fixture.status?.elapsed || null
              },
              venue: fixture.fixture.venue ? { 
                name: fixture.fixture.venue.name || '',
                city: fixture.fixture.venue.city || ''
              } : undefined
            },
            league: {
              id: fixture.league.id || 0,
              name: fixture.league.name || '',
              country: fixture.league.country || '',
              logo: fixture.league.logo || '',
              flag: fixture.league.flag || ''
            },
            teams: {
              home: {
                id: fixture.teams.home.id || 0,
                name: fixture.teams.home.name || '',
                logo: fixture.teams.home.logo || ''
              },
              away: {
                id: fixture.teams.away.id || 0,
                name: fixture.teams.away.name || '',
                logo: fixture.teams.away.logo || ''
              }
            },
            goals: { 
              home: fixture.goals?.home || null,
              away: fixture.goals?.away || null
            },
            score: fixture.score ? { 
              halftime: {
                home: fixture.score.halftime?.home || null,
                away: fixture.score.halftime?.away || null
              },
              fulltime: {
                home: fixture.score.fulltime?.home || null,
                away: fixture.score.fulltime?.away || null
              },
              penalty: fixture.score.penalty ? {
                home: fixture.score.penalty.home || null,
                away: fixture.score.penalty.away || null
              } : undefined
            } : undefined
          };
          onMatchCardClick(safeFixture);
        } else {
          console.warn("🚨 [MyNewLeague2] onMatchCardClick is not a function or is undefined");
        }
      } catch (error) {
        console.error("🚨 [MyNewLeague2] Error calling onMatchCardClick:", error);
        // Don't re-throw the error to prevent runtime errors
      }
    } catch (error) {
      console.error("🚨 [MyNewLeague2] Unexpected error in handleMatchClick:", error);
      // Prevent the error from bubbling up and causing runtime errors
      if (error instanceof Error) {
        console.error("🚨 [MyNewLeague2] Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      // Explicitly prevent error propagation
      return false;
    }
  };

  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(
    new Set(),
  );
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(
    new Set(),
  );
  const [goalFlashMatches, setGoalFlashMatches] = useState<Set<number>>(
    new Set(),
  );
  const [kickoffFlashMatches, setKickoffFlashMatches] = useState<Set<number>>(
    new Set(),
  );
  const [finishFlashMatches, setFinishFlashMatches] = useState<Set<number>>(
    new Set(),
  );
  const [previousMatchStatuses, setPreviousMatchStatuses] = useState<
    Map<number, string>
  >(new Map());

  // Function to trigger the kickoff flash effect
  const triggerKickoffFlash = useCallback(
    (matchId: number) => {
      if (!kickoffFlashMatches.has(matchId)) {
        console.log(`🟡 [KICKOFF FLASH] Match ${matchId} just kicked off!`);
        setKickoffFlashMatches((prev) => {
          const newKickoffFlashMatches = new Set(prev);
          newKickoffFlashMatches.add(matchId);
          return newKickoffFlashMatches;
        });

        // Remove the flash after a delay (e.g., 4 seconds)
        setTimeout(() => {
          setKickoffFlashMatches((prev) => {
            const newKickoffFlashMatches = new Set(prev);
            newKickoffFlashMatches.delete(matchId);
            return newKickoffFlashMatches;
          });
        }, 4000);
      }
    },
    [kickoffFlashMatches],
  );

  // Function to trigger the finish flash effect
  const triggerFinishFlash = useCallback(
    (matchId: number) => {
      if (!finishFlashMatches.has(matchId)) {
        console.log(`🔵 [FINISH FLASH] Match ${matchId} just finished!`);
        setFinishFlashMatches((prev) => {
          const newFinishFlashMatches = new Set(prev);
          newFinishFlashMatches.add(matchId);
          return newFinishFlashMatches;
        });

        // Remove the flash after a delay (4 seconds)
        setTimeout(() => {
          setFinishFlashMatches((prev) => {
            const newFinishFlashMatches = new Set(prev);
            newFinishFlashMatches.delete(matchId);
            return newFinishFlashMatches;
          });
        }, 4000);
      }
    },
    [finishFlashMatches],
  );

  // Track status changes for kickoff and finish flash effects
  useEffect(() => {
    if (!fixturesByLeague || Object.keys(fixturesByLeague).length === 0) return;

    const currentStatuses = new Map<number, string>();
    const allFixtures = Object.values(fixturesByLeague).flatMap(
      (group) => group.fixtures,
    );

    allFixtures.forEach((fixture) => {
      const matchId = fixture.fixture.id;
      const currentStatus = fixture.fixture.status.short;
      const previousStatus = previousMatchStatuses.get(matchId);

      currentStatuses.set(matchId, currentStatus);

      // Check if status just changed from upcoming (NS/TBD) to kickoff (1H)
      if (
        (previousStatus === "NS" || previousStatus === "TBD") &&
        currentStatus === "1H"
      ) {
        console.log(
          `🟡 [KICKOFF DETECTION] Match ${matchId} transitioned from ${previousStatus} to ${currentStatus}`,
        );
        triggerKickoffFlash(matchId);
      }

      // Check if status just changed from live to finished
      if (
        previousStatus &&
        ["1H", "2H", "HT", "ET", "BT", "P", "INT", "LIVE", "LIV"].includes(
          previousStatus,
        ) &&
        ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(
          currentStatus,
        )
      ) {
        console.log(
          `🔵 [FINISH DETECTION] Match ${matchId} transitioned from ${previousStatus} to ${currentStatus}`,
        );
        triggerFinishFlash(matchId);
      }
    });

    // Update previous statuses for next comparison
    setPreviousMatchStatuses(currentStatuses);
  }, [fixturesByLeague, triggerKickoffFlash, triggerFinishFlash]);

  // Show cached data immediately if available, no loading spinner
  if (isLoading && Object.keys(fixturesByLeague).length === 0) {
    return (
      <>
        {/* Header Section */}
        <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 font-semibold text-black dark:text-white">
          <div className="flex justify-between items-center w-full">
            <span className="text-sm font-semibold">
              Popular Football Leagues
            </span>
          </div>
        </CardHeader>

        <Card className="mb-4">
          <CardContent className="p-4">
            <BrandedLoading className="h-32" />
          </CardContent>
        </Card>
      </>
    );
  }

  if (error) {
    const isRateLimit =
      error.message?.toLowerCase().includes("429") ||
      error.message?.toLowerCase().includes("rate limit") ||
      error.message?.toLowerCase().includes("too many requests");

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="text-center">
            <div className={isRateLimit ? "text-orange-500" : "text-red-500"}>
              {isRateLimit
                ? "⚠️ API Rate Limit Reached"
                : "❌ Error loading leagues"}
            </div>
            <div className="text-xs mt-2 text-gray-600">
              {isRateLimit
                ? "Too many requests to the API. Please wait a moment and the data will refresh automatically."
                : error.message}
            </div>
            {isRateLimit && (
              <div className="text-xs mt-1 text-blue-600">
                Using cached data where available...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const leagueEntries = Object.entries(fixturesByLeague);

  if (leagueEntries.length === 0) {
    return (
      <>
        {/* Header Section */}
        <CardHeader className="flex items-left gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
          <div className="flex justify-between  w-full">
            <span className="text-sm font-semibold">
              Popular Football Leagues
            </span>
          </div>
        </CardHeader>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="text-center text-gray-500">
              <div>No matches found</div>
              <div className="text-xs mt-2">
                Searched {leagueIds.length} leagues: {leagueIds.join(", ")}
              </div>
              <div className="text-xs mt-1">
                Raw fixtures count: {allFixtures?.length || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 font-semibold text-black dark:text-white">
        <div className="flex justify-between items-center w-full">
          <span className="text-sm font-semibold">
            Popular Football Leagues
          </span>
        </div>
      </CardHeader>

      {/* Individual League Cards */}
      {leagueEntries
        .sort(([aId], [bId]) => {
          // Define priority order - same as MyNewLeague
          const priorityOrder = [
            38, 15, 2, 5, 22, 10, 11, 1022, 772, 71, 72, 667, 3, 848, 73, 75,
            239, 233, 253,
          ];

          const aIndex = priorityOrder.indexOf(Number(aId));
          const bIndex = priorityOrder.indexOf(Number(bId));

          // If both leagues are in priority list, sort by their position
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }

          // If only one is in priority list, prioritize it
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;

          // For other leagues, maintain original order
          return 0;
        })
        .map(([leagueId, { league, fixtures }]) => {
          const leagueIdNum = Number(leagueId);
          const isExpanded = expandedLeagues.has(`league-${leagueIdNum}`);

          return (
            <Card
              key={`mynewleague2-${leagueIdNum}`}
              className="border bg-card text-card-foreground shadow-md overflow-hidden league-card-spacing mobile-card rounded-none"
            >
              {/* League Header - Clickable and collapsible */}
              <button
                onClick={() => toggleLeague(leagueIdNum)}
                className="w-full flex items-center gap-2 p-2 md:p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700 min-h-[56px] touch-target"
              >
                {/* League Star Toggle Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStarMatch(leagueIdNum);
                  }}
                  className="transition-colors"
                  title={`${starredMatches.has(leagueIdNum) ? "Remove from" : "Add to"} favorites`}
                >
                  <Star
                    className={`h-5 w-5 transition-all ${
                      starredMatches.has(leagueIdNum)
                        ? "text-green-500 fill-green-500"
                        : "text-green-300"
                    }`}
                  />
                </button>

                <LazyImage
                  src={
                    league.logo ||
                    `/api/league-logo/${leagueIdNum}` ||
                    "/assets/matchdetaillogo/fallback.png"
                  }
                  alt={league.name || "Unknown League"}
                  className="w-6 h-6 md:w-7 md:h-7 object-contain rounded-full flex-shrink-0"
                  style={{ backgroundColor: "transparent" }}
                  loading="lazy"
                />
                <div className="flex flex-col flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-semibold text-gray-800 dark:text-white group-hover:underline transition-all duration-200 text-sm md:text-base leading-tight"
                      style={{
                        fontFamily:
                          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        fontSize: "14px",
                        lineHeight: "1.3",
                      }}
                    >
                      {safeSubstring(league.name, 0) || "Unknown League"}
                    </span>

                    {(() => {
                      const liveMatchesInLeague = fixtures.filter(
                        (match: any) => {
                          const status = match.fixture.status.short;
                          const isActuallyFinished = [
                            "FT",
                            "AET",
                            "PEN",
                            "AWD",
                            "WO",
                            "ABD",
                            "CANC",
                            "SUSP",
                          ].includes(status);
                          const isLiveStatus = [
                            "LIVE",
                            "1H",
                            "HT",
                            "2H",
                            "ET",
                            "BT",
                            "P",
                            "INT",
                          ].includes(status);

                          // Check if match is stale (more than 4 hours old)
                          const matchDate = new Date(match.fixture.date);
                          const hoursOld =
                            (Date.now() - matchDate.getTime()) /
                            (1000 * 60 * 60);
                          const isStale = hoursOld > 4;

                          // Only consider it live if it has live status AND is not finished AND is not stale
                          return (
                            isLiveStatus && !isActuallyFinished && !isStale
                          );
                        },
                      ).length;

                      if (liveMatchesInLeague > 0) {
                        return (
                          <span
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold whitespace-nowrap"
                            style={{
                              minWidth: "50px",
                              textAlign: "center",
                              animation: "none",
                              transition: "none",
                              fontSize: "11px",
                            }}
                          >
                            {liveMatchesInLeague} LIVE
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <span
                    className="text-xs md:text-sm text-gray-600 dark:text-gray-300 leading-tight"
                    style={{
                      fontFamily:
                        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      fontSize: "12px",
                      lineHeight: "1.2",
                    }}
                  >
                    {league.country || "Unknown Country"}
                  </span>
                </div>
                <div className="flex gap-2 items-center"></div>
              </button>

              {/* Matches - Show when league is expanded */}
              {isExpanded && (
                <div className="match-cards-wrapper ">
                  {fixtures.map((fixture: FixtureData) => {
                    const matchId = fixture.fixture.id;
                    const isHalftimeFlash = halftimeFlashMatches.has(matchId);
                    const isFulltimeFlash = fulltimeFlashMatches.has(matchId);
                    const isGoalFlash = goalFlashMatches.has(matchId);
                    const isKickoffFlash = kickoffFlashMatches.has(matchId);
                    const isFinishFlash = finishFlashMatches.has(matchId);
                    const isStarred = starredMatches.has(matchId);

                    return (
                      <div key={matchId} className="country-matches-container ">
                        <div
                          className={`match-card-container group border-b border-gray-200 ${
                            isHalftimeFlash ? "halftime-flash" : ""
                          }${isFulltimeFlash ? "fulltime-flash" : ""} ${
                            isGoalFlash ? "goal-flash" : ""
                          } ${isKickoffFlash ? "kickoff-flash" : ""} ${
                            isFinishFlash ? "finish-flash" : ""
                          } ${
                            selectedMatchId === matchId ? "selected-match" : ""
                          } ${
                            hoveredMatchId === matchId ? "hovered-match" : ""
                          }`}
                          data-fixture-id={matchId}
                          onClick={(e) => {
                            try {
                              // Safely handle event object
                              if (e && typeof e.preventDefault === 'function') {
                                e.preventDefault();
                              }
                              if (e && typeof e.stopPropagation === 'function') {
                                e.stopPropagation();
                              }
                              
                              // Validate fixture before passing to handleMatchClick
                              if (!fixture || !fixture.fixture || !fixture.fixture.id) {
                                console.error("🚨 [MyNewLeague2] Invalid fixture data in click handler:", fixture);
                                return false;
                              }
                              
                              // Additional safety check for required properties
                              if (!fixture.teams || !fixture.teams.home || !fixture.teams.away) {
                                console.error("🚨 [MyNewLeague2] Invalid teams data in click handler:", fixture.teams);
                                return false;
                              }
                              
                              if (!fixture.league) {
                                console.error("🚨 [MyNewLeague2] Invalid league data in click handler:", fixture.league);
                                return false;
                              }
                              
                              handleMatchClick(fixture);
                            } catch (error) {
                              console.error("🚨 [MyNewLeague2] Error in match container click handler:", error);
                              // Prevent error from propagating and causing runtime errors
                              return false;
                            }
                          }}
                          onMouseEnter={() => {
                            try {
                              const container = document.querySelector(
                                `[data-fixture-id="${matchId}"]`,
                              );
                              // Only allow hover if not manually deselected and not currently selected
                              if (
                                container &&
                                !container.classList.contains("disable-hover") &&
                                selectedMatchId !== matchId &&
                                manuallyDeselectedMatches &&
                                !manuallyDeselectedMatches.has(matchId)
                              ) {
                                setHoveredMatchId(matchId);
                              }
                            } catch (error) {
                              console.error("🚨 [MyNewLeague2] Error in mouse enter handler:", error);
                            }
                          }}
                          onMouseLeave={() => {
                            try {
                              // Always clear hover state when leaving, regardless of selection status
                              setHoveredMatchId(null);
                            } catch (error) {
                              console.error("🚨 [MyNewLeague2] Error in mouse leave handler:", error);
                            }
                          }}
                          style={{
                            cursor: "pointer",
                          }}
                        >
                          {/* Star Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStarMatch(matchId);
                            }}
                            className="match-star-button"
                            title="Add to My Selections"
                            onMouseEnter={(e) => {
                              const container = e.currentTarget.closest(
                                ".match-card-container",
                              );
                              container?.classList.add("disable-hover");
                              setHoveredMatchId(null);
                            }}
                            onMouseLeave={(e) => {
                              const container = e.currentTarget.closest(
                                ".match-card-container",
                              );
                              container?.classList.remove("disable-hover");
                            }}
                          >
                            <Star
                              className={`match-star-icon ${isStarred ? "starred" : ""}`}
                            />
                          </button>

                          {/* Match content container */}
                          <div className="match-three-grid-container">
                            {/* Top Grid: Match Status */}
                            <div
                              className="match-status-top"
                              style={{
                                minHeight: "20px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              {(() => {
                                const status = fixture.fixture.status.short;
                                const elapsed = fixture.fixture.status.elapsed;

                                // Check if match finished more than 4 hours ago
                                const matchDateTime = new Date(
                                  fixture.fixture.date,
                                );
                                const hoursOld =
                                  (Date.now() - matchDateTime.getTime()) /
                                  (1000 * 60 * 60);
                                const isStaleFinishedMatch =
                                  (["FT", "AET", "PEN"].includes(status) &&
                                    hoursOld > 4) ||
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
                                    [
                                      "LIVE",
                                      "1H",
                                      "2H",
                                      "HT",
                                      "ET",
                                      "BT",
                                      "P",
                                      "INT",
                                    ].includes(status));

                                // Show live status only for truly live matches (not finished and not stale)
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
                                  let statusClass = "status-live-elapsed";

                                  if (status === "HT") {
                                    displayText = "Halftime";
                                    statusClass = "status-halftime";
                                  } else if (status === "P") {
                                    displayText = "Penalties";
                                  } else if (status === "ET") {
                                    if (elapsed) {
                                      const extraTime = elapsed - 90;
                                      displayText =
                                        extraTime > 0
                                          ? `90' + ${extraTime}'`
                                          : `${elapsed}'`;
                                    } else {
                                      displayText = "Extra Time";
                                    }
                                  } else if (status === "BT") {
                                    displayText = "Break Time";
                                  } else if (status === "INT") {
                                    displayText = "Interrupted";
                                  } else {
                                    displayText = elapsed
                                      ? `${elapsed}'`
                                      : "LIVE";
                                  }

                                  return (
                                    <div
                                      className={`match-status-label ${statusClass}`}
                                    >
                                      {displayText}
                                    </div>
                                  );
                                }

                                // Postponed/Cancelled matches
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

                                // Check for overdue matches that should be marked as postponed
                                if (status === "NS" || status === "TBD") {
                                  const matchTime = new Date(
                                    fixture.fixture.date,
                                  );
                                  const now = new Date();
                                  const hoursAgo =
                                    (now.getTime() - matchTime.getTime()) /
                                    (1000 * 60 * 60);

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
                              {/* Home Team Name */}
                              <div
                                className={`home-team-name ${
                                  fixture.goals.home !== null &&
                                  fixture.goals.away !== null &&
                                  fixture.goals.home > fixture.goals.away &&
                                  ["FT", "AET", "PEN"].includes(
                                    fixture.fixture.status.short,
                                  )
                                    ? "winner"
                                    : ""
                                }`}
                                style={{
                                  textAlign: "right",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {shortenTeamName(fixture.teams.home.name) ||
                                  "Unknown Team"}
                              </div>

                              {/* Home team logo */}
                              <div
                                className="home-team-logo-container"
                                style={{ padding: "0 0.6rem" }}
                              >
                                {fixture.league.id === 10 ? (
                                  <MyCircularFlag
                                    teamName={fixture.teams.home.name || ""}
                                    teamId={fixture.teams.home.id}
                                    fallbackUrl={
                                      fixture.teams.home.id
                                        ? `/api/team-logo/square/${fixture.teams.home.id}?size=32`
                                        : "/assets/fallback-logo.svg"
                                    }
                                    alt={fixture.teams.home.name}
                                    size="34px"
                                    className="popular-leagues-size"
                                  />
                                ) : (
                                  <MyWorldTeamLogo
                                    teamName={fixture.teams.home.name || ""}
                                    teamLogo={
                                      fixture.teams.home.id
                                        ? `/api/team-logo/square/${fixture.teams.home.id}?size=32`
                                        : "/assets/fallback-logo.svg"
                                    }
                                    alt={fixture.teams.home.name}
                                    size="34px"
                                    className="popular-leagues-size"
                                    leagueContext={leagueContext}
                                  />
                                )}
                              </div>

                              {/* Score/Time Center */}
                              <div className="match-score-container">
                                {(() => {
                                  const status = fixture.fixture.status.short;

                                  // Live matches - show current score
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
                                      "45",
                                      "90",
                                    ].includes(status)
                                  ) {
                                    return (
                                      <div className="match-score-display">
                                        <span className="score-number">
                                          {fixture.goals.home ?? 0}
                                        </span>
                                        <span className="score-separator">
                                          -
                                        </span>
                                        <span className="score-number">
                                          {fixture.goals.away ?? 0}
                                        </span>
                                      </div>
                                    );
                                  }

                                  // Ended matches - show final score
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
                                      <div className="match-score-display">
                                        <span className="score-number">
                                          {fixture.goals.home ?? 0}
                                        </span>
                                        <span className="score-separator">
                                          -
                                        </span>
                                        <span className="score-number">
                                          {fixture.goals.away ?? 0}
                                        </span>
                                      </div>
                                    );
                                  }

                                  // For postponed matches and upcoming matches - show kick-off time
                                  if (
                                    status === "NS" ||
                                    status === "TBD" ||
                                    [
                                      "PST",
                                      "CANC",
                                      "ABD",
                                      "SUSP",
                                      "AWD",
                                      "WO",
                                    ].includes(status)
                                  ) {
                                    const matchTime = new Date(
                                      fixture.fixture.date,
                                    );

                                    // For postponed/cancelled matches, still show the kick-off time
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
                                      const localTime =
                                        matchTime.toLocaleTimeString("en-US", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: false,
                                        });

                                      return (
                                        <div
                                          className="match-time-display"
                                          style={{ fontSize: "0.882em" }}
                                        >
                                          {localTime}
                                        </div>
                                      );
                                    }

                                    // Check if match should have started already (more than 2 hours ago) for NS/TBD
                                    const now = new Date();
                                    const hoursAgo =
                                      (now.getTime() - matchTime.getTime()) /
                                      (1000 * 60 * 60);

                                    // If match is more than 2 hours overdue, show kick-off time but with postponed styling
                                    if (hoursAgo > 2) {
                                      const localTime =
                                        matchTime.toLocaleTimeString("en-US", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: false,
                                        });

                                      return (
                                        <div
                                          className="match-time-display text-orange-600"
                                          style={{ fontSize: "0.8em" }}
                                        >
                                          {localTime}
                                        </div>
                                      );
                                    }

                                    // Use simplified local time formatting for regular upcoming matches
                                    const localTime =
                                      matchTime.toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                      });

                                    return (
                                      <div
                                        className="match-time-display"
                                        style={{ fontSize: "0.882em" }}
                                      >
                                        {status === "TBD" ? "TBD" : localTime}
                                      </div>
                                    );
                                  }

                                  // Fallback for any unhandled status - show time or score if available
                                  if (
                                    fixture.goals.home !== null ||
                                    fixture.goals.away !== null
                                  ) {
                                    return (
                                      <div className="match-score-display">
                                        <span className="score-number">
                                          {fixture.goals.home ?? 0}
                                        </span>
                                        <span className="score-separator">
                                          -
                                        </span>
                                        <span className="score-number">
                                          {fixture.goals.away ?? 0}
                                        </span>
                                      </div>
                                    );
                                  }

                                  // Last resort - show match time
                                  return (
                                    <div
                                      className="match-time-display"
                                      style={{ fontSize: "0.882em" }}
                                    >
                                      {formatMatchTimeWithTimezone(
                                        fixture.fixture.date,
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Away team logo */}
                              <div
                                className="away-team-logo-container"
                                style={{ padding: "0 0.5rem" }}
                              >
                                {fixture.league.id === 10 ? (
                                  <MyCircularFlag
                                    teamName={fixture.teams.away.name || ""}
                                    teamId={fixture.teams.away.id}
                                    fallbackUrl={
                                      fixture.teams.away.id
                                        ? `/api/team-logo/square/${fixture.teams.away.id}?size=32`
                                        : "/assets/fallback-logo.svg"
                                    }
                                    alt={fixture.teams.away.name}
                                    size="34px"
                                    className="popular-leagues-size"
                                  />
                                ) : (
                                  <MyWorldTeamLogo
                                    teamName={fixture.teams.away.name || ""}
                                    teamLogo={
                                      fixture.teams.away.id
                                        ? `/api/team-logo/square/${fixture.teams.away.id}?size=32`
                                        : "/assets/fallback-logo.svg"
                                    }
                                    alt={fixture.teams.away.name}
                                    size="34px"
                                    className="popular-leagues-size"
                                    leagueContext={leagueContext}
                                  />
                                )}
                              </div>

                              {/* Away Team Name */}
                              <div
                                className={`away-team-name ${
                                  fixture.goals.home !== null &&
                                  fixture.goals.away !== null &&
                                  fixture.goals.away > fixture.goals.home &&
                                  ["FT", "AET", "PEN"].includes(
                                    fixture.fixture.status.short,
                                  )
                                    ? "winner"
                                    : ""
                                }`}
                                style={{
                                  paddingLeft: "0.75rem",
                                  textAlign: "left",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {shortenTeamName(fixture.teams.away.name) ||
                                  "Unknown Team"}
                              </div>
                            </div>

                            {/* Bottom Grid: Penalty Result Status */}
                            <div className="match-penalty-bottom">
                              {(() => {
                                const isPenaltyMatch =
                                  fixture.fixture.status.short === "PEN";
                                const penaltyHome =
                                  fixture.score?.penalty?.home;
                                const penaltyAway =
                                  fixture.score?.penalty?.away;
                                const hasPenaltyScores =
                                  penaltyHome !== null &&
                                  penaltyAway !== null;

                                if (isPenaltyMatch && hasPenaltyScores) {
                                  const winnerText =
                                    penaltyHome > penaltyAway
                                      ? `${shortenTeamName(fixture.teams.home.name)} won ${penaltyHome}-${penaltyAway} on penalties`
                                      : `${shortenTeamName(fixture.teams.away.name)} won ${penaltyAway}-${penaltyHome} on penalties`;

                                  return (
                                    <div className="penalty-result-display">
                                      <span
                                        className="penalty-winner"
                                        style={{ background: "transparent" }}
                                      >
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
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
    </>
  );
};

// Lazy Loading Wrapper Component
const LazyMyNewLeague2Wrapper: React.FC<MyNewLeague2Props> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { hasIntersected } = useIntersectionObserver(containerRef, {
    threshold: 0.01, // Trigger even earlier
    rootMargin: '200px' // Start loading 200px before it comes into view
  });

  // Check if we have cached data available
  const cachedData = queryClient.getQueryData(["myNewLeague2", "allFixtures", props.selectedDate]);
  const hasCachedData = cachedData && Array.isArray(cachedData) && cachedData.length > 0;

  // If we have cached data OR component has intersected, show the actual component
  if (hasCachedData || hasIntersected) {
    return <MyNewLeague2Component {...props} />;
  }

  // If no cached data and not intersected yet, show proper loading skeleton
  if (!hasIntersected) {
    return (
      <div ref={containerRef}>
        {/* Header Section Skeleton */}
        <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 font-semibold text-black dark:text-white">
          <div className="flex justify-between items-center w-full">
            <Skeleton className="h-4 w-48" />
          </div>
        </CardHeader>

        {/* League Cards Skeleton */}
        {[1, 2, 3].map((i) => (
          <Card
            key={`skeleton-league-${i}`}
            className="border bg-card text-card-foreground shadow-md overflow-hidden league-card-spacing mobile-card rounded-none"
          >
            {/* League Header Skeleton */}
            <div className="w-full flex items-center gap-2 p-2 md:p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 min-h-[56px] touch-target">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="w-6 h-6 md:w-7 md:h-7 rounded-full" />
              <div className="flex flex-col flex-1 gap-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>

            {/* Enhanced Match Skeleton Cards with 3-grid layout */}
            <div className="match-cards-wrapper">
              {[1, 2, 3].map((j) => (
                <div key={`skeleton-match-${i}-${j}`} className="country-matches-container">
                  <div className="match-card-container">
                    {/* Star Button Skeleton */}
                    <div className="match-star-button">
                      <Skeleton className="h-4 w-4 rounded-full" />
                    </div>

                    {/* Three-grid layout container */}
                    <div className="match-three-grid-container">
                      {/* Top grid for status */}
                      <div className="match-status-top" style={{ minHeight: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Skeleton className="h-4 w-16 rounded" />
                      </div>

                      {/* Middle grid for main content */}
                      <div className="match-content-container">
                        {/* Home Team Name */}
                        <div className="home-team-name" style={{ textAlign: "right" }}>
                          <Skeleton className="h-4 w-20" />
                        </div>

                        {/* Home team logo */}
                        <div className="home-team-logo-container" style={{ padding: "0 0.6rem" }}>
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>

                        {/* Score/Time Center */}
                        <div className="match-score-container">
                          <Skeleton className="h-6 w-12 rounded" />
                        </div>

                        {/* Away team logo */}
                        <div className="away-team-logo-container" style={{ padding: "0 0.5rem" }}>
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>

                        {/* Away Team Name */}
                        <div className="away-team-name" style={{ paddingLeft: "0.75rem", textAlign: "left" }}>
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>

                      {/* Bottom grid placeholder */}
                      <div className="match-penalty-bottom" style={{ minHeight: '16px' }}>
                        {/* Empty space for penalty results when applicable */}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Render actual component when intersected
  return <MyNewLeague2Component {...props} />;
};

export default LazyMyNewLeague2Wrapper;