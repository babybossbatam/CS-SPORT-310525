import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Star, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid } from "date-fns";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
import { fixtureCache } from "@/lib/fixtureCache";
import { 
  formatMatchTimeWithTimezone 
} from "@/lib/timezoneApiService";
import { MyAdvancedTimeClassifier } from "@/lib/MyAdvancedTimeClassifier";
import { useSelectiveMatchUpdate } from "@/lib/selectiveMatchUpdates";
import "../../styles/MyLogoPositioning.css";
import "../../styles/flasheffect.css";

// Lazy load the team logo component for better performance
const LazyTeamLogo = lazy(() => Promise.resolve({ 
  default: ({ teamName, logoUrl, size, leagueContext }: { 
    teamName: string; 
    logoUrl: string; 
    size: string;
    leagueContext?: { name: string; country: string; };
  }) => (
    <MyWorldTeamLogo
      teamName={teamName}
      teamLogo={logoUrl}
      alt={teamName}
      size={size}
      className="popular-leagues-size"
      leagueContext={leagueContext}
    />
  )
}));

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

interface MyNewLeagueProps {
  selectedDate: string;
  timeFilterActive: boolean;
  showTop10: boolean;
  liveFilterActive: boolean;
  onMatchCardClick: (fixture: any) => void;
  useUTCOnly?: boolean;
}

interface FixtureData {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      elapsed?: number;
    };
    venue?: {
      name: string;
    };
  };
  teams: {
    home: {
      id?: number;
      name: string;
      logo?: string;
    };
    away: {
      id?: number;
      name: string;
      logo?: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  league: {
    id: number;
    name: string;
    logo?: string;
    country: string;
  };
  score?: {
    penalty?: {
      home: number | null;
      away: number | null;
    };
  };
}

interface LeagueData {
  league: {
    id: number;
    name: string;
    type: string;
    logo?: string;
  };
  country: {
    name: string;
  };
}

// Lazy Loading Wrapper Component
const LazyMyNewLeagueWrapper: React.FC<MyNewLeagueProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { hasIntersected } = useIntersectionObserver(containerRef, {
    threshold: 0.1,
    rootMargin: '100px'
  });

  // Placeholder skeleton while not intersected
  if (!hasIntersected) {
    return (
      <div ref={containerRef}>
        {/* Header Section Skeleton */}
        <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
          <div className="flex justify-between items-center w-full">
            <Skeleton className="h-5 w-48" />
          </div>
        </CardHeader>

        {/* Multiple League Cards Skeleton */}
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border bg-card text-card-foreground shadow-md overflow-hidden league-card-spacing">
            <div className="w-full flex items-center gap-2 p-2 bg-white border-b border-gray-200">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="w-6 h-6 rounded-full" />
              <div className="flex flex-col flex-1 gap-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <div className="match-cards-wrapper">
              {[1, 2, 3].map((j) => (
                <div key={j} className="country-matches-container">
                  <div className="match-card-container">
                    <div className="match-three-grid-container">
                      <div className="match-status-top" style={{ minHeight: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Skeleton className="h-4 w-16 rounded" />
                      </div>
                      <div className="match-content-container">
                        <div className="home-team-name" style={{ textAlign: "right" }}>
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="home-team-logo-container" style={{ padding: "0 0.6rem" }}>
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                        <div className="match-score-container">
                          <Skeleton className="h-6 w-12" />
                        </div>
                        <div className="away-team-logo-container" style={{ padding: "0 0.5rem" }}>
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                        <div className="away-team-name" style={{ textAlign: "left" }}>
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      <div className="match-penalty-bottom">
                        {/* Empty for penalty results */}
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
  return <MyNewLeagueComponent {...props} />;
};

const MyNewLeagueComponent: React.FC<MyNewLeagueProps> = ({
  selectedDate,
  timeFilterActive,
  showTop10,
  liveFilterActive,
  onMatchCardClick,
  useUTCOnly = true,
}) => {
  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [leagueInfo, setLeagueInfo] = useState<LeagueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(new Set());

  // Flash animation states - stabilized
  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(new Set());
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(new Set());
  const [goalFlashMatches, setGoalFlashMatches] = useState<Set<number>>(new Set());

  // Status and score tracking for flash effects - stabilized with refs
  const previousMatchStatusesRef = useRef<Map<number, string>>(new Map());
  const previousMatchScoresRef = useRef<Map<number, {home: number, away: number}>>(new Map());
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [leagueFixtures, setLeagueFixtures] = useState<Map<number, FixtureData[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Using league ID 38 (UEFA U21) first priority, then 15 (FIFA Club World Cup) second priority
  const leagueIds = [38, 15, 2, 11, 71, 3, 848,  22, 72, 73, 75, 76, 233, 10, 667, 940, 908, 1169, 23, 1077, 253, 850, 893,  531, 921, 886, 130, 128, 493, 239, 265, 237, 235]; // Added UEFA Champions League (2), CONMEBOL Sudamericana (11), Brazilian Serie A (71), CONCACEF Gold Cup (22), Serie B (72), Serie C (73), Serie D (75), Iraqi League (233), UEFA Europa Conference League (848), Friendlies Clubs (667), and new leagues (908, 1169, 23, 1077), MLS (253), and additional leagues (850, 893, 3, 531, 921, 886, 493)

  // Check if a match ended more than 24 hours ago
  const isMatchOldEnded = useCallback((fixture: FixtureData): boolean => {
    const status = fixture.fixture.status.short;
    const isEnded = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status);

    if (!isEnded) return false;

    const matchDate = new Date(fixture.fixture.date);
    const hoursAgo = (Date.now() - matchDate.getTime()) / (1000 * 60 * 60);

    return hoursAgo > 24;
  }, []);

  // Cache key for ended matches
  const getCacheKey = useCallback((date: string, leagueId: number) => {
    return `ended_matches_${date}_${leagueId}`;
  }, []);

  // Get cached ended matches with strict date validation and immediate cleanup
  const getCachedEndedMatches = useCallback((date: string, leagueId: number): FixtureData[] => {
    try {
      const cacheKey = getCacheKey(date, leagueId);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) return [];

      const { fixtures, timestamp, date: cachedDate } = JSON.parse(cached);

      // CRITICAL: Ensure cached date exactly matches requested date
      if (cachedDate !== date) {
        console.log(`🚨 [MyNewLeague] Date mismatch in cache - cached: ${cachedDate}, requested: ${date}, clearing cache`);
        localStorage.removeItem(cacheKey);
        return [];
      }

      const cacheAge = Date.now() - timestamp;
      const today = new Date().toISOString().slice(0, 10);
      const isToday = date === today;

      // Reduced cache times for better real-time accuracy
      // For today: 5 minutes max (much shorter for live data)
      // For past dates: 30 minutes max (much shorter to prevent stale data)
      const maxCacheAge = isToday ? 5 * 60 * 1000 : 30 * 60 * 1000;

      if (cacheAge < maxCacheAge) {
        // Additional validation: check if fixtures actually match the date
        const validFixtures = fixtures.filter((fixture: any) => {
          const fixtureDate = new Date(fixture.fixture.date);
          const fixtureDateString = fixtureDate.toISOString().slice(0, 10);
          return fixtureDateString === date;
        });

        if (validFixtures.length !== fixtures.length) {
          console.log(`🚨 [MyNewLeague] Found ${fixtures.length - validFixtures.length} fixtures with wrong dates in cache, clearing`);
          localStorage.removeItem(cacheKey);
          return [];
        }

        console.log(`✅ [MyNewLeague] Using cached ended matches for league ${leagueId} on ${date}: ${validFixtures.length} matches`);
        return validFixtures;
      } else {
        // Remove expired cache
        localStorage.removeItem(cacheKey);
        console.log(`⏰ [MyNewLeague] Removed expired cache for league ${leagueId} on ${date} (age: ${Math.round(cacheAge / 60000)}min)`);
      }
    } catch (error) {
      console.error('Error reading cached ended matches:', error);
      // Clear corrupted cache
      const cacheKey = getCacheKey(date, leagueId);
      localStorage.removeItem(cacheKey);
    }

    return [];
  }, [getCacheKey]);

  // Cache ended matches
  const cacheEndedMatches = useCallback((date: string, leagueId: number, fixtures: FixtureData[]) => {
    try {
      const endedFixtures = fixtures.filter(isMatchOldEnded);

      if (endedFixtures.length === 0) return;

      const cacheKey = getCacheKey(date, leagueId);
      const cacheData = {
        fixtures: endedFixtures,
        timestamp: Date.now(),
        date,
        leagueId
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 [MyNewLeague] Cached ${endedFixtures.length} ended matches for league ${leagueId} on ${date}`);
    } catch (error) {
      console.error('Error caching ended matches:', error);
    }
  }, [getCacheKey, isMatchOldEnded]);



  // Enhanced data fetching function for initial load and non-live data
  const fetchLeagueData = useCallback(async (isUpdate = false) => {
    if (!isUpdate) {
      setLoading(true);
      setError(null);
    }

    try {
      const allFixtures: FixtureData[] = [];
      let primaryLeagueInfo: LeagueData | null = null;

      console.log(`🔍 [MyNewLeague] Fetching data for ${selectedDate}`);

      // For initial load or updates, fetch live fixtures
      if (!isUpdate) {
        try {
          console.log(`🔴 [MyNewLeague] Fetching live fixtures for initial load`);
          const response = await apiRequest("GET", "/api/fixtures/live");
          const liveData = await response.json();

          if (Array.isArray(liveData)) {
            const relevantLiveFixtures = liveData.filter(fixture => 
              leagueIds.includes(fixture.league?.id)
            );

            if (relevantLiveFixtures.length > 0) {
              console.log(`🔴 [MyNewLeague] Found ${relevantLiveFixtures.length} live fixtures from target leagues`);
            }

            allFixtures.push(...relevantLiveFixtures);
          }
        } catch (liveError) {
          console.warn("🔴 [MyNewLeague] Failed to fetch live fixtures:", liveError);
        }
      }

      // Iterate through each league to fetch fixtures
      for (const leagueId of leagueIds) {
        try {
          console.log(`🔍 [MyNewLeague] Processing league ${leagueId}`);

          // Check cache first for ended matches
          const cachedEndedMatches = getCachedEndedMatches(selectedDate, leagueId);
          let leagueFixtures: FixtureData[] = [...cachedEndedMatches];

          // Fetch fresh data for this league
          const response = await apiRequest("GET", `/api/leagues/${leagueId}/fixtures?season=2025`);
          const freshFixtures = await response.json();

          console.log(`MyNewLeague - League ${leagueId} fixtures count:`, freshFixtures?.length || 0);

          if (Array.isArray(freshFixtures)) {
            // Filter to only include fixtures for the selected date using simple UTC date matching
            const nonLiveFixtures = freshFixtures.filter(fixture => {
              // Skip if already included as live fixture
              const isAlreadyLive = allFixtures.some(liveFixture => liveFixture.fixture.id === fixture.fixture.id);
              return !isAlreadyLive;
            });



            console.log(`🎯 [MyNewLeague] League ${leagueId}: ${freshFixtures.length} → ${nonLiveFixtures.length} fixtures after date filtering`);

            // Log sample fixtures for debugging
            if (nonLiveFixtures.length > 0) {
              nonLiveFixtures.slice(0, 3).forEach(fixture => {
                console.log(`MyNewLeague - Fixture ${fixture.fixture.id}:`, {
                  teams: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                  league: fixture.league.name,
                  status: fixture.fixture.status.short,
                  date: fixture.fixture.date,
                  source: "api"
                });
              });
            }

            // Merge cached and fresh fixtures, avoiding duplicates
            const existingIds = new Set(leagueFixtures.map(f => f.fixture.id));
            const newFixtures = nonLiveFixtures.filter(f => !existingIds.has(f.fixture.id));

            leagueFixtures = [...leagueFixtures, ...newFixtures];

            // Cache ended matches for this league
            cacheEndedMatches(selectedDate, leagueId, nonLiveFixtures);
          }

          // Add league fixtures to overall collection
          allFixtures.push(...leagueFixtures);

        } catch (leagueError) {
          console.warn(`Failed to fetch league ${leagueId}:`, leagueError);
        }
      }

      // Fetch league info only on initial load (using the first league as primary)
      if (!isUpdate && leagueIds.length > 0) {
        try {
          const leagueResponse = await apiRequest("GET", `/api/leagues/${leagueIds[0]}`);
          const leagueData = await leagueResponse.json();
          console.log(`MyNewLeague - Primary league ${leagueIds[0]} info:`, leagueData);
          primaryLeagueInfo = leagueData;
        } catch (leagueInfoError) {
          console.warn("Failed to fetch primary league info:", leagueInfoError);
        }
      }

      if (!isUpdate && primaryLeagueInfo) {
        setLeagueInfo(primaryLeagueInfo);
      }

      console.log(`📊 [MyNewLeague] Final result: ${allFixtures.length} fixtures`);

      // Log breakdown by league
      leagueIds.forEach(leagueId => {
        const leagueFixtures = allFixtures.filter(f => f.league.id === leagueId);
        if (leagueFixtures.length > 0) {
          console.log(`🎯 [MyNewLeague] League ${leagueId}: ${leagueFixtures.length} fixtures`);
        }
      });

      // Only update fixtures if there are actual changes
      setFixtures(prevFixtures => {
        const hasChanges = JSON.stringify(prevFixtures) !== JSON.stringify(allFixtures);
        return hasChanges ? allFixtures : prevFixtures;
      });
    } catch (err) {
      console.error("Error fetching league data:", err);
      if (!isUpdate) {
        setError("Failed to load league data");
      }
    } finally {
      if (!isUpdate) {
        setLoading(false);
      }
    }
  }, [selectedDate, getCachedEndedMatches, cacheEndedMatches]);

  useEffect(() => {
    const fetchAllLeagueFixtures = async () => {
      if (!selectedDate) return;

      try {
        setIsLoading(true);
        setError(null);

        // Smart fetching: Use date-based API for efficiency
        console.log(`🎯 [MyNewLeague] Smart fetching for date: ${selectedDate}`);

        const response = await fetch(`/api/fixtures/date/${selectedDate}?all=true`);
        if (!response.ok) {
          throw new Error(`Failed to fetch fixtures for ${selectedDate}`);
        }

        const allDateFixtures = await response.json();
        console.log(`📊 [MyNewLeague] Got ${allDateFixtures.length} total fixtures for ${selectedDate}`);

        // Group fixtures by league and filter for our target leagues with timezone awareness
        const leagueFixturesMap = new Map();

        // Debug logging for league 908 fixtures in allDateFixtures
        const league908Fixtures = allDateFixtures.filter((f: FixtureData) => f.league?.id === 908);
        if (league908Fixtures.length > 0) {
          console.log(`🔍 [MyNewLeague] Found ${league908Fixtures.length} league 908 fixtures in allDateFixtures:`, 
            league908Fixtures.map(f => ({
              id: f.fixture.id,
              date: f.fixture.date,
              localDate: new Date(f.fixture.date).toLocaleDateString('en-CA'),
              status: f.fixture.status.short,
              teams: `${f.teams.home.name} vs ${f.teams.away.name}`,
              league: f.league.name
            }))
          );
        }

        allDateFixtures.forEach((fixture: FixtureData) => {
              const leagueId = fixture.league?.id;
              if (leagueIds.includes(leagueId)) {
                // Simple date filtering - extract UTC date from fixture
                const fixtureUTCDate = fixture.fixture?.date?.substring(0, 10);

                if (fixtureUTCDate === selectedDate) {
                  if (!leagueFixturesMap.has(leagueId)) {
                    leagueFixturesMap.set(leagueId, []);
                  }
                  leagueFixturesMap.get(leagueId).push(fixture);
                }
              }
            });

              // Convert to the expected format
              const promises = leagueIds.map(async (leagueId) => {
              const fixtures = leagueFixturesMap.get(leagueId) || [];
              console.log(`✅ [MyNewLeague] League ${leagueId}: Found ${fixtures.length} fixtures for ${selectedDate}`);
              return { leagueId, fixtures };
              });

              const results = await Promise.all(promises);

              const newLeagueFixtures = new Map();
              results.forEach(({ leagueId, fixtures }) => {
              newLeagueFixtures.set(leagueId, fixtures);
              });

              // Debug logging for league 908 before setting state
              if (newLeagueFixtures.has(908)) {
              console.log(`🔍 [MyNewLeague] Setting league 908 fixtures in state:`, {
              count: newLeagueFixtures.get(908)?.length || 0,
              fixtures: newLeagueFixtures.get(908)?.map(f => ({
              id: f.fixture.id,
              date: f.fixture.date,
              status: f.fixture.status.short,
              teams: `${f.teams.home.name} vs ${f.teams.away.name}`
              })) || []
              });
              } else {
              console.log(`❌ [MyNewLeague] League 908 NOT found in newLeagueFixtures for date ${selectedDate}`);
              }

              setLeagueFixtures(newLeagueFixtures);

              // Cache the results with date validation
              sessionStorage.setItem(`league-fixtures-${selectedDate}`, JSON.stringify({
              data: Array.from(newLeagueFixtures.entries()),
              timestamp: Date.now(),
              date: selectedDate // Include date for validation
              }));

              } catch (error) {
              console.error('❌ [MyNewLeague] Error fetching league fixtures:', error);
              setError('Failed to load matches');
              } finally {
              setIsLoading(false);

              // Ensure loading is cleared even on error
              setTimeout(() => {
              setLoading(false);
              }, 100);
              }
              };

              // Check cache first for non-live data with stricter validation
              const cacheKey = `league-fixtures-${selectedDate}`;
              const cached = sessionStorage.getItem(cacheKey);

              if (cached && !liveFilterActive) {
              try {
              const { data, timestamp, date: cachedDateKey } = JSON.parse(cached);
              const age = Date.now() - timestamp;

              // Validate cached date matches exactly
              if (cachedDateKey && cachedDateKey !== selectedDate) {
              console.log(`🚨 [MyNewLeague] Session cache date mismatch - clearing: ${cachedDateKey} !== ${selectedDate}`);
              sessionStorage.removeItem(cacheKey);
              } else {
              // Much shorter cache times to prevent stale data
              // For today: 30 seconds max
              // For other dates: 2 minutes max
              const maxAge = selectedDate === new Date().toISOString().split('T')[0] ? 30000 : 120000;

              if (age < maxAge) {
              console.log(`💾 [MyNewLeague] Using cached data for ${selectedDate} (age: ${Math.round(age/1000)}s)`);
              setLeagueFixtures(new Map(data));
              setIsLoading(false);
              return;
              } else {
              console.log(`⏰ [MyNewLeague] Session cache expired for ${selectedDate} (age: ${Math.round(age/1000)}s)`);
              sessionStorage.removeItem(cacheKey);
              }
              }
              } catch (error) {
              console.warn('Failed to parse session cache:', error);
              sessionStorage.removeItem(cacheKey);
              }
              }

              fetchAllLeagueFixtures();
              }, [selectedDate, showTop10, liveFilterActive]);

              // Comprehensive cache cleanup on date change and component mount
              useEffect(() => {
              const cleanupOldCache = () => {
              try {
              const keys = Object.keys(localStorage);
              const cacheKeys = keys.filter(key => key.startsWith('ended_matches_') || key.startsWith('finished_fixtures_'));

              let cleanedCount = 0;
              const today = new Date().toISOString().slice(0, 10);

              cacheKeys.forEach(key => {
              try {
              const cached = localStorage.getItem(key);
              if (cached) {
              const { timestamp, date: cachedDate } = JSON.parse(cached);
              const cacheAge = Date.now() - timestamp;

              // More aggressive cleanup - remove cache older than 24 hours for recent dates
              const maxAge = cachedDate >= today ? 1 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

              if (cacheAge > maxAge) {
                localStorage.removeItem(key);
                cleanedCount++;
                console.log(`🗑️ [MyNewLeague] Removed stale cache: ${key} (age: ${Math.round(cacheAge / 60000)}min)`);
              }
              }
              } catch (error) {
              // Remove corrupted cache entries
              localStorage.removeItem(key);
              cleanedCount++;
              }
              });

              if (cleanedCount > 0) {
              console.log(`🧹 [MyNewLeague] Cleaned up ${cleanedCount} old cache entries`);
              }
              } catch (error) {
              console.error('Error cleaning up cache:', error);
              }
              };

              cleanupOldCache();
              }, [selectedDate]); // Re-run when selected date changes

              // Immediate cache clearing when date changes to prevent cross-date contamination
              useEffect(() => {
              const clearAllRelatedCache = () => {
              try {
              console.log(`🔄 [MyNewLeague] Performing immediate cache clear for date change to ${selectedDate}`);

              // Clear all fixture-related caches immediately
              fixtureCache.clearCache();

              // Clear ALL localStorage entries for leagues and matches (aggressive cleanup)
              const keys = Object.keys(localStorage);
              const allCacheKeys = keys.filter(key => 
              key.startsWith('ended_matches_') || 
              key.startsWith('finished_fixtures_') ||
              key.startsWith('league-fixtures-') ||
              key.startsWith('match-data-')
              );

              let clearedCount = 0;
              allCacheKeys.forEach(key => {
              try {
              localStorage.removeItem(key);
              clearedCount++;
              } catch (error) {
              console.warn(`Failed to clear cache key: ${key}`, error);
              }
              });

              // Clear sessionStorage as well
              const sessionKeys = Object.keys(sessionStorage);
              const sessionCacheKeys = sessionKeys.filter(key => 
              key.startsWith('league-fixtures-') || 
              key.startsWith('match-data-')
              );

              sessionCacheKeys.forEach(key => {
              try {
              sessionStorage.removeItem(key);
              clearedCount++;
              } catch (error) {
              console.warn(`Failed to clear session cache key: ${key}`, error);
              }
              });

              // Reset component state to ensure fresh data
              setLeagueFixtures(new Map());
              setIsLoading(true);

              console.log(`🧹 [MyNewLeague] Cleared ${clearedCount} cache entries for date ${selectedDate}`);
              } catch (error) {
              console.error('Error clearing all related cache:', error);
              }
              };

              clearAllRelatedCache();
              }, [selectedDate]);

              // Remove conflicting data fetch - using leagueFixtures from the new effect above

              // Debug logging
              console.log("MyNewLeague - All fixtures:", fixtures.length);

              // Enhanced debugging for specific leagues
              const friendliesFixtures = fixtures.filter(f => f.league.id === 667);
              const iraqiFixtures = fixtures.filter(f => f.league.id === 233);
              const copaArgentinaFixtures = fixtures.filter(f => f.league.id === 128);

              console.log("🏆 [MyNewLeague FRIENDLIES] Total Friendlies fixtures:", friendliesFixtures.length);
              console.log("🇮🇶 [MyNewLeague IRAQI] Total Iraqi League fixtures:", iraqiFixtures.length);
              console.log("🇦🇷 [MyNewLeague COPA ARG] Total Copa Argentina fixtures:", copaArgentinaFixtures.length);

              // Debug logging for leagueFixtures data
              console.log(`📊 [MyNewLeague] LeagueFixtures data:`, {
              leagueFixturesSize: leagueFixtures.size,
              selectedDate,
              totalMatchesAcrossLeagues: Array.from(leagueFixtures.values()).reduce((total, fixtures) => total + fixtures.length, 0)
              });

              // Debug specific leagues
              leagueFixtures.forEach((fixtures, leagueId) => {
              if (fixtures.length > 0) {
              console.log(`🎯 [MyNewLeague] League ${leagueId}: ${fixtures.length} fixtures`);
              // Log first few fixtures for debugging
              fixtures.slice(0, 3).forEach(f => {
              console.log(`  - ${f.teams.home.name} vs ${f.teams.away.name} (${f.fixture.status.short})`);
              });
              }
              });

              // Use leagueFixtures as primary data source and group matches by league ID
              const matchesByLeague = useMemo(() => {
              const result: Record<number, { league: any; matches: FixtureData[] }> = {};

              // Process leagueFixtures map to create the grouped structure
              leagueFixtures.forEach((fixtures, leagueId) => {
              if (fixtures && fixtures.length > 0) {
              // Debug logging for league 908
              if (leagueId === 908) {
              console.log(`🔍 [MyNewLeague] League 908 fixtures before filtering:`, {
              totalFixtures: fixtures.length,
              selectedDate,
              fixtures: fixtures.map(f => ({
              id: f.fixture.id,
              date: f.fixture.date,
              localDate: new Date(f.fixture.date).toLocaleDateString('en-CA'),
              status: f.fixture.status.short,
              teams: `${f.teams.home.name} vs ${f.teams.away.name}`
              }))
              });
              }

              // Simple UTC date filtering
              const filteredFixtures = fixtures.filter(fixture => {
                const fixtureDate = fixture.fixture?.date;
                if (!fixtureDate) return false;

                // Extract UTC date part (YYYY-MM-DD)
                const fixtureUTCDate = fixtureDate.substring(0, 10);
                return fixtureUTCDate === selectedDate;
              });

              if (leagueId === 908) {
              console.log(`🔍 [MyNewLeague] League 908 after filtering:`, {
              filteredCount: filteredFixtures.length,
              willBeIncluded: filteredFixtures.length > 0
              });
              }

              if (filteredFixtures.length > 0) {
              result[leagueId] = {
              league: filteredFixtures[0].league,
              matches: filteredFixtures,
              };
              }
              }
              });

              console.log(`📊 [MyNewLeague] Processed matchesByLeague:`, {
              totalLeagues: Object.keys(result).length,
              totalMatches: Object.values(result).reduce((sum, group) => sum + group.matches.length, 0),
              selectedDate,
              leagueFixturesSize: leagueFixtures.size
,
        hasLeague908: !!result[908],
        league908Matches: result[908]?.matches.length || 0
      });

      return result;
    }, [leagueFixtures, selectedDate]);

    // Auto-expand all leagues by default when data changes and ensure loading state is cleared
    useEffect(() => {
      const leagueKeys = Object.keys(matchesByLeague).map((leagueId: string) => `league-${leagueId}`);
      setExpandedLeagues(new Set(leagueKeys));

      // Clear loading state once we have data or finished loading
      if (Object.keys(matchesByLeague).length > 0 || (!isLoading && !loading)) {
        console.log(`✅ [MyNewLeague] Data loaded successfully:`, {
          totalLeagues: Object.keys(matchesByLeague).length,
          totalMatches: Object.values(matchesByLeague).reduce((sum, group) => sum + group.matches.length, 0),
          selectedDate
        });
        setLoading(false);
        setIsLoading(false);
      }
    }, [Object.keys(matchesByLeague).length, isLoading, loading]);

    // Sort matches within each league by status priority: Live > Ended > Upcoming
    Object.values(matchesByLeague).forEach((leagueGroup) => {
      leagueGroup.matches.sort((a, b) => {
        const aStatus = a.fixture.status.short;
        const bStatus = b.fixture.status.short;
        const aDate = new Date(a.fixture.date).getTime();
        const bDate = new Date(b.fixture.date).getTime();

        // Define clear status priorities with explicit numbering
        const getStatusPriority = (status: string) => {
          // Priority 1: Live matches (highest priority)
          if (["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
            return 1;
          }
          // Priority 2: Ended matches (second priority)  
          if (["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status)) {
            return 2;
          }
          // Priority 3: Upcoming matches (third priority)
          if (["NS", "TBD"].includes(status)) {
            return 3;
          }
          // Priority 4: Other/unknown statuses (lowest priority)
          return 4;
        };

        const aPriority = getStatusPriority(aStatus);
        const bPriority = getStatusPriority(bStatus);

        // Primary sort: by status priority (Live -> Ended -> Upcoming -> Other)
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
          // Ended matches: sort by most recent end time first (latest finished first)
          return bDate - aDate;
        }

        if (aPriority === 3) {
          // Upcoming matches: sort by earliest start time first (soonest first)
          return aDate - bDate;
        }

        // For other statuses, sort by date (earliest first)
        return aDate - bDate;
      });
    });

    // Calculate total matches for logging
    const totalMatches = Object.values(matchesByLeague).reduce((sum, group) => sum + group.matches.length, 0);
    console.log(`📊 [MyNewLeague] Final stats: ${totalMatches} total matches in ${Object.keys(matchesByLeague).length} leagues for ${selectedDate}`);

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

    // Memoize the match click handler to prevent infinite re-renders
    const handleMatchCardClick = useCallback((match: any) => {
      console.log('🎯 [MyNewLeague] Match card clicked:', {
        fixtureId: match.fixture?.id,
        teams: `${match.teams?.home?.name} vs ${match.teams?.away?.name}`,
        league: match.league?.name,
        status: match.fixture?.status?.short,
        source: 'MyNewLeague'
      });
      if (onMatchCardClick) {
        onMatchCardClick(match);
      }
    }, [onMatchCardClick]);

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

    // Lazy loading team logo component with skeleton fallback
    const TeamLogo = ({ teamName, logoUrl, size, leagueContext }: {
      teamName: string;
      logoUrl: string;
      size: string;
      leagueContext?: { name: string; country: string; };
    }) => (
      <Suspense fallback={<Skeleton className={`h-8 w-8 rounded`} />}>
        <LazyTeamLogo teamName={teamName} logoUrl={logoUrl} size={size} leagueContext={leagueContext} />
      </Suspense>
    );

    // Enhanced lazy loading skeleton for league card
    const LeagueCardSkeleton = () => (
      <Card className="border bg-card text-card-foreground shadow-md overflow-hidden league-card-spacing">
        <div className="w-full flex items-center gap-2 p-2 bg-white border-b border-gray-200">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="w-6 h-6 rounded-full" />
          <div className="flex flex-col flex-1 gap-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
        <div className="match-cards-wrapper">
          {[1, 2, 3].map((i) => (
            <div key={i} className="country-matches-container">
              <div className="match-card-container">
                <div className="match-three-grid-container">
                  <div className="match-status-top" style={{ minHeight: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                  <div className="match-content-container">
                    <div className="home-team-name" style={{ textAlign: "right" }}>
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="home-team-logo-container" style={{ padding: "0 0.6rem" }}>
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                    <div className="match-score-container">
                      <Skeleton className="h-6 w-12" />
                    </div>
                    <div className="away-team-logo-container" style={{ padding: "0 0.5rem" }}>
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                    <div className="away-team-name" style={{ textAlign: "left" }}>
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="match-penalty-bottom">
                    {/* Empty for penalty results */}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );

    // Optimized MatchCard component with selective updates - no memoization needed
    const MatchCard = ({ 
      matchId,
      homeTeamName,
      awayTeamName,
      homeTeamId,
      awayTeamId,
      initialMatch,
      matchDate,
      penaltyHome,
      penaltyAway,
      isHalftimeFlash, 
      isFulltimeFlash, 
      isGoalFlash, 
      isStarred, 
      onStarToggle, 
      onMatchClick,
      leagueContext
    }: {
      matchId: number;
      homeTeamName: string;
      awayTeamName: string;
      homeTeamId: number;
      awayTeamId: number;
      initialMatch: any;
      matchDate: string;
      penaltyHome: number | null;
      penaltyAway: number | null;
      isHalftimeFlash: boolean;
      isFulltimeFlash: boolean;
      isGoalFlash: boolean;
      isStarred: boolean;
      onStarToggle: (matchId: number) => void;
      onMatchClick?: (matchId: number, homeTeamName: string, awayTeamName: string) => void;
      leagueContext: { name: string; country: string; }
    }) => {
      // Always use selective updates for any match that might be live or recently finished
      const currentStatus = initialMatch.fixture.status.short;
      const mightNeedUpdates = ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT", "FT", "AET", "PEN"].includes(currentStatus);

      // Use selective updates for matches that might need real-time data
      const matchState = mightNeedUpdates ? useSelectiveMatchUpdate(matchId, initialMatch) : { goals: initialMatch.goals, status: initialMatch.fixture.status };

      // Prioritize updated status from selective updates over initial status
      const updatedStatus = matchState.status?.short || currentStatus;
      const isActuallyFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(updatedStatus);

      // Enhanced live match detection - exclude finished matches
      const isLiveMatch = !isActuallyFinished && ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(updatedStatus);

      // Check if match data is stale - but don't show stale indicator for finished matches
      const matchDateTime = new Date(initialMatch.fixture.date);
      const hoursOld = (Date.now() - matchDateTime.getTime()) / (1000 * 60 * 60);
      const isStaleData = false; // Remove stale data indicator to avoid confusion

      // Debug logging for match updates
      console.log(`🔄 [MatchCard ${matchId}] Update check:`, {
        teams: `${homeTeamName} vs ${awayTeamName}`,
        initialStatus: initialMatch.fixture.status.short,
        initialGoals: `${initialMatch.goals.home}-${initialMatch.goals.away}`,
        updatedStatus: matchState.status?.short,
        updatedGoals: matchState.goals ? `${matchState.goals.home}-${matchState.goals.away}` : 'none',
        isLiveMatch,
        hasUpdates: !!matchState.status
      });

      // Use updated data if available, otherwise fallback to initial data
      const currentGoals = (matchState.goals && (matchState.goals.home !== null || matchState.goals.away !== null)) 
        ? matchState.goals 
        : initialMatch.goals;

      // Always prioritize the most recent status from selective updates
      const currentMatchStatus = updatedStatus;
      const currentStatusObj = matchState.status || initialMatch.fixture.status;

      // For display purposes, always show the updated status
      const displayStatus = currentMatchStatus;

      const handleMatchClick = () => {
        if (onMatchClick) {
          onMatchClick(matchId, homeTeamName, awayTeamName);
        }
      };

      return (
        <div
          key={matchId}
          className="country-matches-container"
        >
          <div 
            className={`match-card-container group ${
              isHalftimeFlash ? 'halftime-flash' : ''
            } ${
              isFulltimeFlash ? 'fulltime-flash' : ''
            } ${
              isGoalFlash ? 'goal-flash' : ''
            }`}
            data-fixture-id={matchId}
            onClick={handleMatchClick}
            style={{
              cursor: onMatchClick ? "pointer" : "default",
            }}
          >
            {/* Star Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStarToggle(matchId);
              }}
              className="match-star-button"
              title="Add to favorites"
              onMouseEnter={(e) => {
                e.currentTarget
                  .closest(".match-card-container")
                  ?.classList.add("disable-hover");
              }}
              onMouseLeave={(e) => {
                e.currentTarget
                  .closest(".match-card-container")
                  ?.classList.remove("disable-hover");
              }}
            >
              <Star
                className={`match-star-icon ${isStarred ? "starred" : ""}`}
              />
            </button>

            {/* Match content container */}
            <div className="match-three-grid-container">
              {/* Top Grid: Match Status */}
              <div className="match-status-top" style={{ minHeight: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {(() => {
                  const status = currentMatchStatus;
                  const elapsed = currentStatusObj.elapsed;

                  // Check if match finished more than 4 hours ago
                  const matchDateTime = new Date(matchDate);
                  const hoursOld = (Date.now() - matchDateTime.getTime()) / (1000 * 60 * 60);
                  const isStaleFinishedMatch = (["FT", "AET", "PEN"].includes(status) && hoursOld > 4) || 
                                               (isActuallyFinished && hoursOld > 4) ||
                                               (hoursOld > 4 && ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(status));

                  // Show live status only for truly live matches (not finished and not stale)
                  // Skip showing elapsed time for stale matches (more than 4 hours old)
                  if (
                    !isActuallyFinished && 
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
                      "INT"
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
                    ].includes(status) || isStaleFinishedMatch
                  ) {
                    return (
                      <div 
                        className="match-status-label status-ended"
                        style={{
                          minWidth: '60px',
                          textAlign: 'center',
                          transition: 'none',
                          animation: 'none'
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

                  if (status === "TBD") {
                    return (
                      <div 
                        className="match-status-label status-upcoming"
                        style={{
                          minWidth: '60px',
                          textAlign: 'center',
                          transition: 'none',
                          animation: 'none'
                        }}
                      >
                        Time TBD
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
                    currentGoals.home !== null &&
                    currentGoals.away !== null &&
                    currentGoals.home > currentGoals.away &&
                    ["FT", "AET", "PEN"].includes(currentMatchStatus)
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
                  {shortenTeamName(homeTeamName) || "Unknown Team"}
                </div>

                {/* Home team logo */}
                <div
                  className="home-team-logo-container"
                  style={{ padding: "0 0.6rem" }}
                >
                  <TeamLogo
                    teamName={homeTeamName}
                    logoUrl={
                      homeTeamId
                        ? `/api/team-logo/square/${homeTeamId}?size=32`
                        : "/assets/fallback-logo.svg"
                    }
                    size="34px"
                    leagueContext={leagueContext}
                  />
                </div>

                {/* Score/Time Center */}
                <div className="match-score-container">
                  {(() => {
                    const status = currentMatchStatus;

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
                        "90"
                      ].includes(status)
                    ) {
                      return (
                        <div className="match-score-display">
                          <span className="score-number">
                            {currentGoals.home ?? 0}
                          </span>
                          <span className="score-separator">-</span>
                          <span className="score-number">
                            {currentGoals.away ?? 0}
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
                            {currentGoals.home ?? 0}
                          </span>
                          <span className="score-separator">-</span>
                          <span className="score-number">
                            {currentGoals.away ?? 0}
                          </span>
                        </div>
                      );
                    }

                    // Upcoming matches - show kick-off time
                    if (status === "NS" || status === "TBD") {
                      // Check if match should have started already (more than 2 hours ago)
                      const matchTime = new Date(matchDate);
                      const now = new Date();
                      const hoursAgo = (now.getTime() - matchTime.getTime()) / (1000 * 60 * 60);

                      // If match is more than 2 hours overdue, show as postponed/cancelled
                      if (hoursAgo > 2) {
                        console.log(`⚠️ [Match Status] Match ${matchId} is ${hoursAgo.toFixed(1)}h overdue - likely postponed/cancelled`);
                        return (
                          <div
                            className="match-time-display text-orange-600"
                            style={{ fontSize: "0.8em" }}
                          >
                            Postponed
                          </div>
                        );
                      }

                      // Use simplified local time formatting
                      const localTime = matchTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
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
                    if (currentGoals.home !== null || currentGoals.away !== null) {
                      return (
                        <div className="match-score-display">
                          <span className="score-number">
                            {currentGoals.home ?? 0}
                          </span>
                          <span className="score-separator">-</span>
                          <span className="score-number">
                            {currentGoals.away ?? 0}
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
                        {formatMatchTimeWithTimezone(matchDate)}
                      </div>
                    );
                  })()}
                </div>

                {/* Away team logo */}
                <div
                  className="away-team-logo-container"
                  style={{ padding: "0 0.5rem" }}
                >
                  <TeamLogo
                    teamName={awayTeamName}
                    logoUrl={
                      awayTeamId
                        ? `/api/team-logo/square/${awayTeamId}?size=32`
                        : "/assets/fallback-logo.svg"
                    }
                    size="34px"
                    leagueContext={leagueContext}
                  />
                </div>

                {/* Away Team Name */}
                <div
                  className={`away-team-name ${
                    currentGoals.home !== null &&
                    currentGoals.away !== null &&
                    currentGoals.away > currentGoals.home &&
                    ["FT", "AET", "PEN"].includes(currentMatchStatus)
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
                  {shortenTeamName(awayTeamName) || "Unknown Team"}
                </div>
              </div>

              {/* Bottom Grid: Penalty Result Status */}
              <div className="match-penalty-bottom">
                {(() => {
                  const isPenaltyMatch = status === "PEN";
                  const hasPenaltyScores =
                    penaltyHome !== null &&
                    penaltyHome !== undefined &&
                    penaltyAway !== null &&
                    penaltyAway !== undefined;

                  if (isPenaltyMatch && hasPenaltyScores) {
                    const winnerText =
                      penaltyHome > penaltyAway
                        ? `${shortenTeamName(homeTeamName)} won ${penaltyHome}-${penaltyAway} on penalties`
                        : `${shortenTeamName(awayTeamName)} won ${penaltyAway}-${penaltyHome} on penalties`;

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
        </div>
      );
    };

    // Fetch live data for a specific match when time-based transition is detected
    const fetchLiveDataForMatch = useCallback(async (matchId: number) => {
      try {
        console.log(`🔴 [TIME-BASED FETCH] Fetching live data for match ${matchId}`);

        const response = await apiRequest("GET", "/api/fixtures/live");
        const liveData = await response.json();

        if (Array.isArray(liveData)) {
          const matchUpdate = liveData.find((fixture: FixtureData) => fixture.fixture.id === matchId);

          if (matchUpdate) {
            console.log(`✅ [TIME-BASED FETCH] Found live update for match ${matchId}:`, {
              status: matchUpdate.fixture.status.short,
              elapsed: matchUpdate.fixture.status.elapsed,
              goals: `${matchUpdate.goals.home}-${matchUpdate.goals.away}`
            });

            // Update the specific match in state
            setLeagueFixtures((prev: Map<number, FixtureData[]>) => {
              const updated = new Map(prev);

              // Find and update the match across all leagues
              leagueIds.forEach((leagueId: number) => {
                const leagueMatches = updated.get(leagueId) || [];
                const updatedMatches = leagueMatches.map((match: FixtureData) => 
                  match.fixture.id === matchId ? matchUpdate : match
                );
                updated.set(leagueId, updatedMatches);
              });

              return updated;
            });
          } else {
            console.log(`❌ [TIME-BASED FETCH] No live data found for match ${matchId}`);
          }
        }
      } catch (error) {
        console.error(`❌ [TIME-BASED FETCH] Failed to fetch live data for match ${matchId}:`, error);
      }
    }, []);

    // Clear cache for specific match when status transitions occur
    const clearMatchCache = useCallback((matchId: number, transition: string, fixtureDate: string) => {
      try {
        const matchDate = new Date(fixtureDate);
        const year = matchDate.getFullYear();
        const month = String(matchDate.getMonth() + 1).padStart(2, "0");
        const day = String(matchDate.getDate()).padStart(2, "0");
        const dateString = `${year}-${month}-${day}`;

        // Clear cache for all leagues for this specific date
        leagueIds.forEach(leagueId => {
          const cacheKey = getCacheKey(dateString, leagueId);

          try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const { fixtures } = JSON.parse(cached);
              // Check if this match exists in the cache
              const hasMatch = fixtures.some((f: any) => f.fixture.id === matchId);

              if (hasMatch) {
                localStorage.removeItem(cacheKey);
                console.log(`🗑️ [Cache Clear] Cleared cache for league ${leagueId} on ${dateString} due to match ${matchId} ${transition}`);
              }
            }
          } catch (error) {
            console.warn(`Failed to clear cache for league ${leagueId}:`, error);
          }
        });

        // Also clear any related fixture cache entries
        const allKeys = Object.keys(localStorage);
        const relatedKeys = allKeys.filter(key => 
          key.startsWith('ended_matches_') && key.includes(dateString)
        );

        relatedKeys.forEach(key => {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const { fixtures } = JSON.parse(cached);
              const hasMatch = fixtures.some((f: any) => f.fixture.id === matchId);

              if (hasMatch) {
                localStorage.removeItem(key);
                console.log(`🗑️ [Cache Clear] Cleared related cache ${key} due to match ${matchId} ${transition}`);
              }
            }
          } catch (error) {
            console.warn(`Failed to clear related cache ${key}:`, error);
          }
        });

      } catch (error) {
        console.error(`Failed to clear cache for match ${matchId}:`, error);
      }
    }, [getCacheKey]);

    // Enhanced status change detection with time-based live transition
    useEffect(() => {
      const allMatches = Object.values(matchesByLeague).flatMap(group => group.matches);
      if (!allMatches?.length) return;

      const newHalftimeMatches = new Set<number>();
      const newFulltimeMatches = new Set<number>();
      const newGoalMatches = new Set<number>();
      const now = new Date();

      allMatches.forEach((fixture) => {
        const matchId = fixture.fixture.id;
        const currentStatus = fixture.fixture.status.short;
        const previousStatus = previousMatchStatusesRef.current.get(matchId);
        const currentScore = {
          home: fixture.goals.home ?? 0,
          away: fixture.goals.away ?? 0
        };
        const previousScore = previousMatchScoresRef.current.get(matchId);

        // **TIME-BASED LIVE TRANSITION DETECTION**
        const matchDateTime = new Date(fixture.fixture.date);
        const minutesSinceKickoff = (now.getTime() - matchDateTime.getTime()) / (1000 * 60);

        // Check if match should be live based on time (kick-off + 5 minutes tolerance)
        const shouldBeLiveByTime = minutesSinceKickoff >= -5 && minutesSinceKickoff <= 120; // -5min to +120min window
        const isUpcomingStatus = ['NS', 'TBD'].includes(currentStatus);

        if (shouldBeLiveByTime && isUpcomingStatus) {
          console.log(`🕐 [TIME-BASED TRANSITION] Match ${matchId} should be LIVE: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`, {
            kickoffTime: fixture.fixture.date,
            currentTime: now.toISOString(),
            minutesSinceKickoff: minutesSinceKickoff.toFixed(1),
            currentStatus,
            shouldFetchLiveData: true
          });

          // Trigger immediate live data fetch for this specific match
          fetchLiveDataForMatch(matchId);
        }

        // Only track changes for live/upcoming matches
        const isLiveOrUpcoming = ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT', 'NS', 'TBD'].includes(currentStatus);

        if (isLiveOrUpcoming && previousStatus && previousStatus !== currentStatus) {
          console.log(`🔄 [MyNewLeague] Status change: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name} (${previousStatus} → ${currentStatus})`);

          if (currentStatus === 'HT') {
            newHalftimeMatches.add(matchId);
          }
          if (currentStatus === 'FT') {
            newFulltimeMatches.add(matchId);
          }
        }

        // Check for goal changes only during live matches
        if (previousScore && 
            (currentScore.home !== previousScore.home || currentScore.away !== previousScore.away) &&
            ['1H', '2H', 'LIVE', 'LIV'].includes(currentStatus)) {
          console.log(`⚽ [MyNewLeague] Goal scored: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`);
          newGoalMatches.add(matchId);
        }

        // Update refs for all matches
        previousMatchStatusesRef.current.set(matchId, currentStatus);
        previousMatchScoresRef.current.set(matchId, currentScore);
      });

      // Trigger flash effects
      if (newHalftimeMatches.size > 0) {
        setHalftimeFlashMatches(newHalftimeMatches);
        setTimeout(() => setHalftimeFlashMatches(new Set()), 3000);
      }

      if (newFulltimeMatches.size > 0) {
        setFulltimeFlashMatches(newFulltimeMatches);
        setTimeout(() => setFulltimeFlashMatches(new Set()), 3000);
      }

      if (newGoalMatches.size > 0) {
        setGoalFlashMatches(newGoalMatches);
        setTimeout(() => setGoalFlashMatches(new Set()), 2000);
      }
    }, [matchesByLeague, fetchLiveDataForMatch]);

    // Timer-based check for matches that should transition to live
    useEffect(() => {
      const checkInterval = setInterval(() => {
        const allMatches = Object.values(matchesByLeague).flatMap(group => group.matches);
        const now = new Date();

        const upcomingMatches = allMatches.filter(match => 
          ['NS', 'TBD'].includes(match.fixture.status.short)
        );

        upcomingMatches.forEach(match => {
          const matchDateTime = new Date(match.fixture.date);
          const minutesSinceKickoff = (now.getTime() - matchDateTime.getTime()) / (1000 * 60);

          // Check if match should have started (with 2-minute tolerance)
          if (minutesSinceKickoff >= -2 && minutesSinceKickoff <= 120) {
            console.log(`⏰ [TIMER CHECK] Match ${match.fixture.id} should be live (${minutesSinceKickoff.toFixed(1)}min since kickoff)`);
            fetchLiveDataForMatch(match.fixture.id);
          }
        });
      }, 30000); // Check every 30 seconds

      return () => clearInterval(checkInterval);
    }, [matchesByLeague, fetchLiveDataForMatch]);

    // Show loading only if we're actually loading and have no data
    const shouldShowLoading = (loading || isLoading) && Object.keys(matchesByLeague).length === 0;

    if (shouldShowLoading) {
      return (
        <>
          {/* Header Section Skeleton */}
          <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
            <div className="flex justify-between items-center w-full">
              <Skeleton className="h-5 w-48" />

            </div>
          </CardHeader>

          {/* Multiple League Cards Skeleton */}
          {[1, 2, 3, 4].map((i) => (
            <LeagueCardSkeleton key={i} />
          ))}
        </>
      );
    }

    if (error) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-center py-4 text-red-500">{error}</div>
          </CardContent>
        </Card>
      );
    }

    // Removed the "No matches available" fallback - let the component render normally
    // even if totalMatches is 0, as this might be a temporary loading state

    return (
      <>
        {/* Header Section */}
        <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
          <div className="flex justify-between items-center w-full">
            <span>Popular Football Leagues</span>
          </div>
        </CardHeader>

        {/* Create individual league cards - prioritize league 38 first, then 15 */}
        {Object.values(matchesByLeague)
          .sort((a, b) => {
            // Define priority order
            const priorityOrder = [38, 15, 2, 11, 71, 22, 72, 73, 75, 233, 667, 253]; // UEFA U21, FIFA Club World Cup, UEFA Champions League, CONMEBOL Sudamericana, Serie A, CONCACAF Gold Cup, Serie B, Serie C, Serie D, Iraqi League, Friendlies Clubs, MLS

            const aIndex = priorityOrder.indexOf(a.league.id);
            const bIndex = priorityOrder.indexOf(b.league.id);

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
          .map((leagueGroup) => {
            return (
              <Card
                key={`mynewleague-${leagueGroup.league.id}`}
                className="border bg-card text-card-foreground shadow-md overflow-hidden league-card-spacing"
              >
                {/* League Header - Now clickable and collapsible */}
                {!timeFilterActive && (
                  <button
                    onClick={() => toggleLeague(leagueGroup.league.id)}
                    className="w-full flex items-center gap-2 p-2 bg-white border-b border-gray-200 transition-colors cursor-pointer group hover:bg-gray-50"
                  >
                    {/* League Star Toggle Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStarMatch(leagueGroup.league.id);
                      }}
                      className="transition-colors"
                      title={`${starredMatches.has(leagueGroup.league.id) ? "Remove from" : "Add to"} favorites`}
                    >
                      <Star
                        className={`h-5 w-5 transition-all ${
                          starredMatches.has(leagueGroup.league.id)
                            ? "text-green-500 fill-green-500"
                            : "text-green-300"
                        }`}
                      />
                    </button>

                    <img
                      src={leagueGroup.league.logo || "/assets/fallback-logo.svg"}
                      alt={leagueGroup.league.name || "Unknown League"}
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
                          {safeSubstring(leagueGroup.league.name, 0) ||
                            "Unknown League"}
                        </span>

                        {(() => {
                          const liveMatchesInLeague = leagueGroup.matches.filter((match: any) => {
                            const status = match.fixture.status.short;
                            const isActuallyFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status);
                            const isLiveStatus = ["LIVE", "1H", "HT", "2H", "ET","BT", "P", "INT"].includes(status);

                            // Check if match is stale (more than 4 hours old)
                            const matchDate = new Date(match.fixture.date);
                            const hoursOld = (Date.now() - matchDate.getTime()) / (1000 * 60 * 60);
                            const isStale = hoursOld > 4;

                            // Only consider it live if it has live status AND is not finished AND is not stale
                            return isLiveStatus && !isActuallyFinished && !isStale;
                          }).length;

                          if (liveMatchesInLeague > 0) {
                            return (
                              <span 
                                className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold"
                                style={{
                                  minWidth: '50px',
                                  textAlign: 'center',
                                  animation: 'none',
                                  transition: 'none'
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
                        className="text-xs text-gray-600"
                        style={{
                          fontFamily:
                            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                          fontSize: "12px",
                        }}
                      >
                        {leagueGroup.league.country || "Unknown Country"}
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                    </div>
                  </button>
                )}

                {/* Matches - Show when league is expanded */}
                {(timeFilterActive || expandedLeagues.has(`league-${leagueGroup.league.id}`)) && (
                  <div className="match-cards-wrapper">
                    {leagueGroup.matches

                      .map((match: any) => {
                        const matchId = match.fixture.id;
                        const isHalftimeFlash = halftimeFlashMatches.has(matchId);
                        const isFulltimeFlash = fulltimeFlashMatches.has(matchId);
                        const isGoalFlash = goalFlashMatches.has(matchId);
                        const isStarred = starredMatches.has(matchId);
                        // Pass league context to MatchCard
                        const leagueContext = {
                          name: leagueGroup.league.name,
                          country: leagueGroup.league.country,
                        };

                        return (
                          <MatchCard
                            key={match.fixture.id}
                            matchId={matchId}
                            homeTeamName={match.teams.home.name}
                            awayTeamName={match.teams.away.name}
                            homeTeamId={match.teams.home.id}
                            awayTeamId={match.teams.away.id}
                            initialMatch={match}
                            matchDate={match.fixture.date}
                            penaltyHome={match.score?.penalty?.home}
                            penaltyAway={match.score?.penalty?.away}
                            isHalftimeFlash={isHalftimeFlash}
                            isFulltimeFlash={isFulltimeFlash}
                            isGoalFlash={isGoalFlash}
                            isStarred={isStarred}
                            onStarToggle={toggleStarMatch}
                            onMatchClick={(matchId, homeTeamName, awayTeamName) => {
                              // Find the full match object for the callback
                              const fullMatch = leagueGroup.matches.find((m: any) => m.fixture.id === matchId);
                              if (fullMatch) {
                                handleMatchCardClick(fullMatch);
                              }
                            }}
                            leagueContext={leagueContext} // Pass leagueContext
                          />
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

  // Set display name for debugging
  MyNewLeagueComponent.displayName = 'MyNewLeagueComponent';
  LazyMyNewLeagueWrapper.displayName = 'LazyMyNewLeagueWrapper';

  // Main export using lazy loading wrapper
  const MyNewLeague: React.FC<MyNewLeagueProps> = (props) => {
    return <LazyMyNewLeagueWrapper {...props} />;
  };

  MyNewLeague.displayName = 'MyNewLeague';

  export default MyNewLeague;