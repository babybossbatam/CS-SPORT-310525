import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  lazy,
  Suspense,
} from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Star, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid } from "date-fns";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { shortenTeamName } from "@/lib/teamNameUtils";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
import { fixtureCache } from "@/lib/fixtureCache";
import { formatMatchTimeWithTimezone } from "@/lib/timezoneApiService";
import { MyAdvancedTimeClassifier } from "@/lib/MyAdvancedTimeClassifier";
import { useSelectiveMatchUpdate } from "@/lib/selectiveMatchUpdates";
import "../../styles/MyLogoPositioning.css";
import "../../styles/flasheffect.css";

// Lazy load the team logo component for better performance
const LazyTeamLogo = lazy(() =>
  Promise.resolve({
    default: ({
      teamName,
      logoUrl,
      size,
    }: {
      teamName: string;
      logoUrl: string;
      size: string;
    }) => (
      <MyWorldTeamLogo
        teamName={teamName}
        teamLogo={logoUrl}
        alt={teamName}
        size={size}
        className="popular-leagues-size"
      />
    ),
  }),
);

// Intersection Observer Hook for lazy loading
const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {},
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);

        if (isElementIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      },
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, hasIntersected, options.threshold, options.rootMargin]);

  return { isIntersecting, hasIntersected };
};

interface MyScoresLeagueProps {
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
const LazyMyScoresLeagueWrapper: React.FC<MyScoresLeagueProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { hasIntersected } = useIntersectionObserver(containerRef, {
    threshold: 0.1,
    rootMargin: "100px",
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
          <Card
            key={i}
            className="border bg-card text-card-foreground shadow-md overflow-hidden league-card-spacing"
          >
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
                      <div
                        className="match-status-top"
                        style={{
                          minHeight: "20px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Skeleton className="h-4 w-16 rounded" />
                      </div>
                      <div className="match-content-container">
                        <div
                          className="home-team-name"
                          style={{ textAlign: "right" }}
                        >
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div
                          className="home-team-logo-container"
                          style={{ padding: "0 0.6rem" }}
                        >
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                        <div className="match-score-container">
                          <Skeleton className="h-6 w-12" />
                        </div>
                        <div
                          className="away-team-logo-container"
                          style={{ padding: "0 0.5rem" }}
                        >
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                        <div
                          className="away-team-name"
                          style={{ textAlign: "left" }}
                        >
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
  return <MyScoresLeagueComponent {...props} />;
};

const MyScoresLeagueComponent: React.FC<MyScoresLeagueProps> = ({
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
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(
    new Set(),
  );

  // Flash animation states - stabilized
  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(
    new Set(),
  );
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(
    new Set(),
  );
  const [goalFlashMatches, setGoalFlashMatches] = useState<Set<number>>(
    new Set(),
  );

  // Status and score tracking for flash effects - stabilized with refs
  const previousMatchStatusesRef = useRef<Map<number, string>>(new Map());
  const previousMatchScoresRef = useRef<
    Map<number, { home: number; away: number }>
  >(new Map());
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [leagueFixtures, setLeagueFixtures] = useState<
    Map<number, FixtureData[]>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Using league ID 38 (UEFA U21) first priority, then 15 (FIFA Club World Cup) second priority
  const leagueIds = [38, 2, 848, 3, 5, 531, 921, 493, 893, 850, 14]; // Added UEFA Champions League (2), CONMEBOL Sudamericana (11), Brazilian Serie A (71), CONCACEF Gold Cup (22), Serie B (72), Serie C (73), Serie D (75), Iraqi League (233), UEFA Europa Conference League (848), Friendlies Clubs (667), and new leagues (908, 1169, 23, 1077), MLS (253), and additional leagues (850, 893, 3, 531, 921, 886, 493)

  // Check if a match ended more than 2 hours ago (performance optimization)
  const isMatchOldEnded = useCallback(
    (fixture: FixtureData): boolean => {
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

      // Performance optimization: use 2-hour rule instead of 24-hour
      return hoursAgo > 2;
    },
    [],
  );

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

        const { fixtures, timestamp, date: cachedDate } = JSON.parse(cached);

        // CRITICAL: Ensure cached date exactly matches requested date
        if (cachedDate !== date) {
          console.log(
            `🚨 [MyScoresLeague] Date mismatch in cache - cached: ${cachedDate}, requested: ${date}, clearing cache`,
          );
          localStorage.removeItem(cacheKey);
          return [];
        }

        const cacheAge = Date.now() - timestamp;

        // More aggressive cache validation for recent dates
        const today = new Date().toISOString().slice(0, 10);
        const isToday = date === today;
        const isPastDate = date < today;

        // For today: 1 hour cache max
        // For past dates: 24 hours cache max (reduced from 7 days)
        const maxCacheAge = isToday ? 1 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

        if (cacheAge < maxCacheAge) {
          // Additional validation: check if fixtures actually match the date
          const validFixtures = fixtures.filter((fixture: any) => {
            const fixtureDate = new Date(fixture.fixture.date);
            const fixtureDateString = fixtureDate.toISOString().slice(0, 10);
            return fixtureDateString === date;
          });

          if (validFixtures.length !== fixtures.length) {
            console.log(
              `🚨 [MyScoresLeague] Found ${fixtures.length - validFixtures.length} fixtures with wrong dates in cache, clearing`,
            );
            localStorage.removeItem(cacheKey);
            return [];
          }

          console.log(
            `✅ [MyScoresLeague] Using cached ended matches for league ${leagueId} on ${date}: ${validFixtures.length} matches`,
          );
          return validFixtures;
        } else {
          // Remove expired cache
          localStorage.removeItem(cacheKey);
          console.log(
            `⏰ [MyScoresLeague] Removed expired cache for league ${leagueId} on ${date} (age: ${Math.round(cacheAge / 60000)}min)`,
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

  // Cache ended matches
  const cacheEndedMatches = useCallback(
    (date: string, leagueId: number, fixtures: FixtureData[]) => {
      try {
        const endedFixtures = fixtures.filter(isMatchOldEnded);

        if (endedFixtures.length === 0) return;

        const cacheKey = getCacheKey(date, leagueId);
        const cacheData = {
          fixtures: endedFixtures,
          timestamp: Date.now(),
          date,
          leagueId,
        };

        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log(
          `💾 [MyScoresLeague] Cached ${endedFixtures.length} ended matches for league ${leagueId} on ${date}`,
        );
      } catch (error) {
        console.error("Error caching ended matches:", error);
      }
    },
    [getCacheKey, isMatchOldEnded],
  );

  // Optimized live data update - only for truly live matches
  const updateLiveMatchData = useCallback(async () => {
    try {
      // Get current live matches to avoid unnecessary API calls
      const currentLiveMatches = fixtures.filter((fixture) =>
        ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(
          fixture.fixture.status.short,
        ),
      );

      if (currentLiveMatches.length === 0) {
        console.log(
          "🚫 [MyScoresLeague] No live matches found, skipping live data update",
        );
        return;
      }

      console.log(
        `🔴 [MyScoresLeague] Updating ${currentLiveMatches.length} live matches`,
      );

      const response = await apiRequest("GET", "/api/fixtures/live/selective");
      const liveData = await response.json();

      if (Array.isArray(liveData)) {
        const relevantLiveFixtures = liveData.filter(
          (fixture) =>
            leagueIds.includes(fixture.league?.id) &&
            ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(
              fixture.fixture.status.short,
            ),
        );

        if (relevantLiveFixtures.length > 0) {
          setFixtures((prevFixtures) => {
            const updatedFixtures = prevFixtures.map((fixture) => {
              const liveUpdate = relevantLiveFixtures.find(
                (live) => live.fixture.id === fixture.fixture.id,
              );

              if (
                liveUpdate &&
                ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(
                  fixture.fixture.status.short,
                )
              ) {
                return {
                  ...fixture,
                  fixture: {
                    ...fixture.fixture,
                    status: liveUpdate.fixture.status,
                  },
                  goals: liveUpdate.goals,
                };
              }

              return fixture;
            });

            return updatedFixtures;
          });
        }
      }
    } catch (error) {
      console.warn("Failed to fetch live updates:", error);
    }
  }, [fixtures.length]);

  // Enhanced data fetching function for initial load and non-live data
  const fetchLeagueData = useCallback(
    async (isUpdate = false) => {
      if (!isUpdate) {
        setLoading(true);
        setError(null);
      }

      try {
        const allFixtures: FixtureData[] = [];
        let primaryLeagueInfo: LeagueData | null = null;

        console.log(`🔍 [MyScoresLeague] Fetching data for ${selectedDate}`);

        // For initial load or updates, fetch live fixtures
        if (!isUpdate) {
          try {
            console.log(
              `🔴 [MyScoresLeague] Fetching live fixtures for initial load`,
            );
            const response = await apiRequest("GET", "/api/fixtures/live");
            const liveData = await response.json();

            if (Array.isArray(liveData)) {
              const relevantLiveFixtures = liveData.filter((fixture) =>
                leagueIds.includes(fixture.league?.id),
              );

              if (relevantLiveFixtures.length > 0) {
                console.log(
                  `🔴 [MyScoresLeague] Found ${relevantLiveFixtures.length} live fixtures from target leagues`,
                );
              }

              allFixtures.push(...relevantLiveFixtures);
            }
          } catch (liveError) {
            console.warn(
              "🔴 [MyScoresLeague] Failed to fetch live fixtures:",
              liveError,
            );
          }
        }

        // Iterate through each league to fetch fixtures
        for (const leagueId of leagueIds) {
          try {
            console.log(`🔍 [MyScoresLeague] Processing league ${leagueId}`);

            // Check cache first for ended matches
            const cachedEndedMatches = getCachedEndedMatches(
              selectedDate,
              leagueId,
            );
            let leagueFixtures: FixtureData[] = [...cachedEndedMatches];

            // Fetch fresh data for this league
            const response = await apiRequest(
              "GET",
              `/api/leagues/${leagueId}/fixtures?season=2025`,
            );
            const freshFixtures = await response.json();

            console.log(
              `MyScoresLeague - League ${leagueId} fixtures count:`,
              freshFixtures?.length || 0,
            );

            if (Array.isArray(freshFixtures)) {
              // Filter to only include fixtures for the selected date using simple UTC date matching
              const nonLiveFixtures = freshFixtures.filter((fixture) => {
                // Skip if already included as live fixture
                const isAlreadyLive = allFixtures.some(
                  (liveFixture) =>
                    liveFixture.fixture.id === fixture.fixture.id,
                );
                return !isAlreadyLive;
              });

              // Filter to only include matches for the selected date using timezone-aware conversion
              const filteredFixtures = nonLiveFixtures.filter((fixture) => {
                const fixtureDate = fixture.fixture?.date;
                if (!fixtureDate) return false;

                // Convert fixture UTC time to user's local timezone
                const fixtureUTCDate = new Date(fixtureDate);
                const fixtureLocalDate =
                  fixtureUTCDate.toLocaleDateString("en-CA"); // YYYY-MM-DD format in local timezone

                const matches = fixtureLocalDate === selectedDate;

                if (matches) {
                  console.log(
                    `🎯 [TIMEZONE AWARE FETCH] Including match: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
                    {
                      fixtureUTCTime: fixtureDate,
                      fixtureLocalDate,
                      selectedDate,
                      timezone:
                        Intl.DateTimeFormat().resolvedOptions().timeZone,
                    },
                  );
                }

                return matches;
              });

              console.log(
                `🎯 [MyScoresLeague] League ${leagueId}: ${freshFixtures.length} → ${filteredFixtures.length} fixtures after date filtering`,
              );

              // Log sample fixtures for debugging
              if (filteredFixtures.length > 0) {
                filteredFixtures.slice(0, 3).forEach((fixture) => {
                  console.log(
                    `MyScoresLeague - Fixture ${fixture.fixture.id}:`,
                    {
                      teams: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                      league: fixture.league.name,
                      status: fixture.fixture.status.short,
                      date: fixture.fixture.date,
                      source: "api",
                    },
                  );
                });
              }

              // Merge cached and fresh fixtures, avoiding duplicates
              const existingIds = new Set(
                leagueFixtures.map((f) => f.fixture.id),
              );
              const newFixtures = filteredFixtures.filter(
                (f) => !existingIds.has(f.fixture.id),
              );

              leagueFixtures = [...leagueFixtures, ...newFixtures];

              // Cache ended matches for this league
              cacheEndedMatches(selectedDate, leagueId, filteredFixtures);
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
            const leagueResponse = await apiRequest(
              "GET",
              `/api/leagues/${leagueIds[0]}`,
            );
            const leagueData = await leagueResponse.json();
            console.log(
              `MyScoresLeague - Primary league ${leagueIds[0]} info:`,
              leagueData,
            );
            primaryLeagueInfo = leagueData;
          } catch (leagueInfoError) {
            console.warn(
              "Failed to fetch primary league info:",
              leagueInfoError,
            );
          }
        }

        if (!isUpdate && primaryLeagueInfo) {
          setLeagueInfo(primaryLeagueInfo);
        }

        console.log(
          `📊 [MyScoresLeague] Final result: ${allFixtures.length} fixtures`,
        );

        // Log breakdown by league
        leagueIds.forEach((leagueId) => {
          const leagueFixtures = allFixtures.filter(
            (f) => f.league.id === leagueId,
          );
          if (leagueFixtures.length > 0) {
            console.log(
              `🎯 [MyScoresLeague] League ${leagueId}: ${leagueFixtures.length} fixtures`,
            );
          }
        });

        // Only update fixtures if there are actual changes
        setFixtures((prevFixtures) => {
          const hasChanges =
            JSON.stringify(prevFixtures) !== JSON.stringify(allFixtures);
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
    },
    [selectedDate, getCachedEndedMatches, cacheEndedMatches],
  );

  useEffect(() => {
    const fetchAllLeagueFixtures = async () => {
      if (!selectedDate) return;

      try {
        setIsLoading(true);
        setError(null);

        // Smart fetching: Use date-based API for efficiency
        console.log(
          `🎯 [MyScoresLeague] Smart fetching for date: ${selectedDate}`,
        );

        const response = await fetch(
          `/api/fixtures/date/${selectedDate}?all=true`,
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch fixtures for ${selectedDate}`);
        }

        const allDateFixtures = await response.json();
        console.log(
          `📊 [MyScoresLeague] Got ${allDateFixtures.length} total fixtures for ${selectedDate}`,
        );

        // Group fixtures by league and filter for our target leagues with timezone awareness
        const leagueFixturesMap = new Map();

        allDateFixtures.forEach((fixture) => {
          const leagueId = fixture.league?.id;
          if (leagueIds.includes(leagueId)) {
            // Apply timezone-aware date filtering
            const fixtureDate = fixture.fixture?.date;
            if (fixtureDate) {
              const fixtureUTCDate = new Date(fixtureDate);
              const fixtureLocalDate =
                fixtureUTCDate.toLocaleDateString("en-CA"); // YYYY-MM-DD format in local timezone

              // Only include fixtures that match the selected date in local timezone
              if (fixtureLocalDate === selectedDate) {
                if (!leagueFixturesMap.has(leagueId)) {
                  leagueFixturesMap.set(leagueId, []);
                }
                leagueFixturesMap.get(leagueId).push(fixture);

                console.log(
                  `🌍 [SMART FETCH TIMEZONE] Including: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
                  {
                    fixtureUTCTime: fixtureDate,
                    fixtureLocalDate,
                    selectedDate,
                    league: fixture.league?.name,
                  },
                );
              }
            }
          }
        });

        // Convert to the expected format
        const promises = leagueIds.map(async (leagueId) => {
          const fixtures = leagueFixturesMap.get(leagueId) || [];
          console.log(
            `✅ [MyScoresLeague] League ${leagueId}: Found ${fixtures.length} fixtures for ${selectedDate}`,
          );
          return { leagueId, fixtures };
        });

        const results = await Promise.all(promises);

        const newLeagueFixtures = new Map();
        results.forEach(({ leagueId, fixtures }) => {
          newLeagueFixtures.set(leagueId, fixtures);
        });

        setLeagueFixtures(newLeagueFixtures);

        // Cache the results to avoid refetching
        sessionStorage.setItem(
          `league-fixtures-${selectedDate}`,
          JSON.stringify({
            data: Array.from(newLeagueFixtures.entries()),
            timestamp: Date.now(),
          }),
        );
      } catch (error) {
        console.error(
          "❌ [MyScoresLeague] Error fetching league fixtures:",
          error,
        );
        setError("Failed to load matches");
      } finally {
        setIsLoading(false);
      }
    };

    // Check cache first for non-live data
    const cacheKey = `league-fixtures-${selectedDate}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached && !liveFilterActive) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        // Use cache if less than 5 minutes old for historical data, 1 minute for today
        const maxAge =
          selectedDate === new Date().toISOString().split("T")[0]
            ? 60000
            : 300000;

        if (age < maxAge) {
          console.log(
            `💾 [MyScoresLeague] Using cached data for ${selectedDate} (age: ${Math.round(age / 1000)}s)`,
          );
          setLeagueFixtures(new Map(data));
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.warn("Failed to parse cache:", error);
      }
    }

    fetchAllLeagueFixtures();
  }, [selectedDate, showTop10, liveFilterActive]);

  // Comprehensive cache cleanup on date change and component mount
  useEffect(() => {
    const cleanupOldCache = () => {
      try {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(
          (key) =>
            key.startsWith("ended_matches_") ||
            key.startsWith("finished_fixtures_"),
        );

        let cleanedCount = 0;
        const today = new Date().toISOString().slice(0, 10);

        cacheKeys.forEach((key) => {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const { timestamp, date: cachedDate } = JSON.parse(cached);
              const cacheAge = Date.now() - timestamp;

              // More aggressive cleanup - remove cache older than 24 hours for recent dates
              const maxAge =
                cachedDate >= today ? 1 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

              if (cacheAge > maxAge) {
                localStorage.removeItem(key);
                cleanedCount++;
                console.log(
                  `🗑️ [MyScoresLeague] Removed stale cache: ${key} (age: ${Math.round(cacheAge / 60000)}min)`,
                );
              }
            }
          } catch (error) {
            // Remove corrupted cache entries
            localStorage.removeItem(key);
            cleanedCount++;
          }
        });

        if (cleanedCount > 0) {
          console.log(
            `🧹 [MyScoresLeague] Cleaned up ${cleanedCount} old cache entries`,
          );
        }
      } catch (error) {
        console.error("Error cleaning up cache:", error);
      }
    };

    cleanupOldCache();
  }, [selectedDate]); // Re-run when selected date changes

  // Clear cache when date changes to prevent cross-date contamination
  useEffect(() => {
    const clearDateSpecificCache = () => {
      try {
        // Clear fixtureCache for the new date
        fixtureCache.clearCache();

        // Clear any stale localStorage entries that might contain wrong date data
        const keys = Object.keys(localStorage);
        const staleCacheKeys = keys.filter(
          (key) =>
            (key.startsWith("ended_matches_") ||
              key.startsWith("finished_fixtures_")) &&
            !key.includes(selectedDate),
        );

        staleCacheKeys.forEach((key) => {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const { date: cachedDate, timestamp } = JSON.parse(cached);
              const cacheAge = Date.now() - timestamp;

              // If cache is recent but for wrong date, clear it
              if (
                cacheAge < 2 * 60 * 60 * 1000 &&
                cachedDate !== selectedDate
              ) {
                localStorage.removeItem(key);
                console.log(
                  `🗑️ [MyScoresLeague] Cleared cross-date cache: ${key} (cached: ${cachedDate}, selected: ${selectedDate})`,
                );
              }
            }
          } catch (error) {
            localStorage.removeItem(key);
          }
        });

        console.log(
          `🔄 [MyScoresLeague] Cache cleared for date change to ${selectedDate}`,
        );
      } catch (error) {
        console.error("Error clearing date-specific cache:", error);
      }
    };

    clearDateSpecificCache();
  }, [selectedDate]);

  useEffect(() => {
    fetchLeagueData(false);

    console.log(
      `🎯 [MyScoresLeague] Data fetched for ${selectedDate}, selective updates will handle live matches`,
    );
  }, [fetchLeagueData, selectedDate]);

  // Debug logging
  console.log("MyScoresLeague - All fixtures:", fixtures.length);

  // Enhanced debugging for specific leagues
  const friendliesFixtures = fixtures.filter((f) => f.league.id === 667);
  const iraqiFixtures = fixtures.filter((f) => f.league.id === 233);
  const copaArgentinaFixtures = fixtures.filter((f) => f.league.id === 128);

  console.log(
    "🏆 [MyScoresLeague FRIENDLIES] Total Friendlies fixtures:",
    friendliesFixtures.length,
  );
  console.log(
    "🇮🇶 [MyScoresLeague IRAQI] Total Iraqi League fixtures:",
    iraqiFixtures.length,
  );
  console.log(
    "🇦🇷 [MyScoresLeague COPA ARG] Total Copa Argentina fixtures:",
    copaArgentinaFixtures.length,
  );

  // Debug Iraqi League
  if (iraqiFixtures.length > 0) {
    console.log("🇮🇶 [MyScoresLeague IRAQI] Sample fixtures with dates:");
    iraqiFixtures.slice(0, 5).forEach((f) => {
      const matchDate = new Date(f.fixture.date);
      const year = matchDate.getFullYear();
      const month = String(matchDate.getMonth() + 1).padStart(2, "0");
      const day = String(matchDate.getDate()).padStart(2, "0");
      const matchDateString = `${year}-${month}-${day}`;

      console.log(
        `🇮🇶 Iraqi Match: ${f.teams.home.name} vs ${f.teams.away.name}`,
        {
          fixtureDate: f.fixture.date,
          matchDateString,
          selectedDate,
          dateMatches: matchDateString === selectedDate,
          status: f.fixture.status.short,
          league: f.league.name,
        },
      );
    });
  }

  // Debug Copa Argentina
  if (copaArgentinaFixtures.length > 0) {
    console.log("🇦🇷 [MyScoresLeague COPA ARG] Sample fixtures with dates:");
    copaArgentinaFixtures.slice(0, 5).forEach((f) => {
      const matchDate = new Date(f.fixture.date);
      const year = matchDate.getFullYear();
      const month = String(matchDate.getMonth() + 1).padStart(2, "0");
      const day = String(matchDate.getDate()).padStart(2, "0");
      const matchDateString = `${year}-${month}-${day}`;

      console.log(
        `🇦🇷 Copa Argentina Match: ${f.teams.home.name} vs ${f.teams.away.name}`,
        {
          fixtureDate: f.fixture.date,
          matchDateString,
          selectedDate,
          dateMatches: matchDateString === selectedDate,
          status: f.fixture.status.short,
          league: f.league.name,
        },
      );
    });
  }

  // Debug Friendlies
  if (friendliesFixtures.length > 0) {
    console.log("🏆 [MyScoresLeague FRIENDLIES] Sample fixtures with dates:");
    friendliesFixtures.slice(0, 5).forEach((f) => {
      const matchDate = new Date(f.fixture.date);
      const year = matchDate.getFullYear();
      const month = String(matchDate.getMonth() + 1).padStart(2, "0");
      const day = String(matchDate.getDate()).padStart(2, "0");
      const matchDateString = `${year}-${month}-${day}`;

      console.log(`🏆 Match: ${f.teams.home.name} vs ${f.teams.away.name}`, {
        fixtureDate: f.fixture.date,
        matchDateString,
        selectedDate,
        dateMatches: matchDateString === selectedDate,
        status: f.fixture.status.short,
        league: f.league.name,
      });
    });
  }

  fixtures.forEach((f) => {
    console.log("Fixture:", {
      id: f.fixture.id,
      teams: `${f.teams.home.name} vs ${f.teams.away.name}`,
      status: f.fixture.status.short,
      league: f.league.name,
      date: f.fixture.date,
    });
  });

  // Filter matches using timezone-aware date filtering
  const selectedDateFixtures = fixtures.filter((f) => {
    const fixtureDate = f.fixture.date;
    if (!fixtureDate) return false;

    // Convert fixture UTC time to user's local timezone first
    const fixtureUTCDate = new Date(fixtureDate);
    const fixtureLocalDate = fixtureUTCDate.toLocaleDateString("en-CA"); // YYYY-MM-DD format in local timezone

    // Debug timezone conversion
    console.log(
      `🌍 [TIMEZONE CONVERSION] Match: ${f.teams.home.name} vs ${f.teams.away.name}`,
      {
        fixtureUTCTime: fixtureDate,
        fixtureUTCDate: fixtureUTCDate.toISOString().split("T")[0],
        fixtureLocalDate: fixtureLocalDate,
        selectedDate,
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateMatches: fixtureLocalDate === selectedDate,
      },
    );

    // Primary filter: match the local date with selected date
    const dateMatches = fixtureLocalDate === selectedDate;

    if (!dateMatches) {
      console.log(
        `❌ [TIMEZONE DATE FILTER] Excluded match: ${f.teams.home.name} vs ${f.teams.away.name}`,
        {
          reason: "Date mismatch after timezone conversion",
          fixtureLocalDate,
          selectedDate,
          status: f.fixture.status.short,
        },
      );
      return false;
    }

    // Secondary filter: Use time classification for additional filtering
    const classification = MyAdvancedTimeClassifier.classifyFixture(
      f.fixture.date,
      f.fixture.status.short,
      selectedDate,
    );

    console.log(
      `✅ [TIMEZONE DATE FILTER] Included match: ${f.teams.home.name} vs ${f.teams.away.name}`,
      {
        reason: "Date matches after timezone conversion",
        fixtureLocalDate,
        selectedDate,
        status: f.fixture.status.short,
        classification: classification.category,
      },
    );

    return true; // Include all matches that match the local date
  });

  // Log filtering results for all target leagues
  const friendliesFiltered = selectedDateFixtures.filter(
    (f) => f.league.id === 667,
  );
  const iraqiFiltered = selectedDateFixtures.filter((f) => f.league.id === 233);
  const copaArgentinaFiltered = selectedDateFixtures.filter(
    (f) => f.league.id === 128,
  );

  console.log(
    `🏆 [MyScoresLeague FRIENDLIES] After date filtering: ${friendliesFiltered.length} matches for ${selectedDate}`,
  );
  console.log(
    `🇮🇶 [MyScoresLeague IRAQI] After date filtering: ${iraqiFiltered.length} matches for ${selectedDate}`,
  );
  console.log(
    `🇦🇷 [MyScoresLeague COPA ARG] After date filtering: ${copaArgentinaFiltered.length} matches for ${selectedDate}`,
  );

  // Group matches by league ID
  const matchesByLeague = selectedDateFixtures.reduce(
    (acc, fixture) => {
      const leagueId = fixture.league.id;
      if (!acc[leagueId]) {
        acc[leagueId] = {
          league: fixture.league,
          matches: [],
        };
      }
      acc[leagueId].matches.push(fixture);
      return acc;
    },
    {} as Record<number, { league: any; matches: FixtureData[] }>,
  );

  // Auto-expand all leagues by default when data changes
  useEffect(() => {
    const leagueKeys = Object.keys(matchesByLeague).map(
      (leagueId) => `league-${leagueId}`,
    );
    setExpandedLeagues(new Set(leagueKeys));
  }, [Object.keys(matchesByLeague).length]);

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
        if (
          ["LIVE", "LIV", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(
            status,
          )
        ) {
          return 1;
        }
        // Priority 2: Ended matches (second priority)
        if (
          ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(
            status,
          )
        ) {
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

  const totalMatches = Object.values(matchesByLeague).reduce(
    (sum, group) => sum + group.matches.length,
    0,
  );

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
  const handleMatchCardClick = useCallback(
    (match: any) => {
      console.log("🎯 [MyScoresLeague] Match card clicked:", {
        fixtureId: match.fixture?.id,
        teams: `${match.teams?.home?.name} vs ${match.teams?.away?.name}`,
        league: match.league?.name,
        status: match.fixture?.status?.short,
        source: "MyScoresLeague",
      });
      if (onMatchCardClick) {
        onMatchCardClick(match);
      }
    },
    [onMatchCardClick],
  );

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
  const TeamLogo = ({
    teamName,
    logoUrl,
    size,
  }: {
    teamName: string;
    logoUrl: string;
    size: string;
  }) => (
    <Suspense fallback={<Skeleton className={`h-8 w-8 rounded`} />}>
      <LazyTeamLogo teamName={teamName} logoUrl={logoUrl} size={size} />
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
                <div
                  className="match-status-top"
                  style={{
                    minHeight: "20px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <div className="match-content-container">
                  <div
                    className="home-team-name"
                    style={{ textAlign: "right" }}
                  >
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div
                    className="home-team-logo-container"
                    style={{ padding: "0 0.6rem" }}
                  >
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                  <div className="match-score-container">
                    <Skeleton className="h-6 w-12" />
                  </div>
                  <div
                    className="away-team-logo-container"
                    style={{ padding: "0 0.5rem" }}
                  >
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
    onMatchClick?: (
      matchId: number,
      homeTeamName: string,
      awayTeamName: string,
    ) => void;
  }) => {
    // Use selective updates only for live matches
    const isLiveMatch = [
      "LIVE",
      "LIV",
      "1H",
      "HT",
      "2H",
      "ET",
      "BT",
      "P",
      "INT",
    ].includes(initialMatch.fixture.status.short);
    const matchState = useSelectiveMatchUpdate(matchId, initialMatch);

    // Use live data if available, otherwise use initial data
    const currentGoals = isLiveMatch ? matchState.goals : initialMatch.goals;
    const currentStatus = isLiveMatch
      ? matchState.status
      : initialMatch.fixture.status;

    const handleMatchClick = () => {
      if (onMatchClick) {
        onMatchClick(matchId, homeTeamName, awayTeamName);
      }
    };

    return (
      <div key={matchId} className="country-matches-container">
        <div
          className={`match-card-container group ${
            isHalftimeFlash ? "halftime-flash" : ""
          } ${isFulltimeFlash ? "fulltime-flash" : ""} ${
            isGoalFlash ? "goal-flash" : ""
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
            <Star className={`match-star-icon ${isStarred ? "starred" : ""}`} />
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
                const status = currentStatus.short;
                const elapsed = currentStatus.elapsed;

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
                  let displayText = "";
                  if (status === "HT") {
                    displayText = "Halftime";
                  } else if (status === "P") {
                    displayText = "Penalties";
                  } else if (status === "ET") {
                    if (elapsed) {
                      const extraTime = elapsed - 90;
                      displayText =
                        extraTime > 0 ? `90' + ${extraTime}'` : `${elapsed}'`;
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
                    <div
                      className={`match-status-label ${status === "HT" ? "status-halftime" : "status-live-elapsed"}`}
                    >
                      {displayText}
                    </div>
                  );
                }

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
                    <div
                      className="match-status-label status-ended"
                      style={{
                        minWidth: "60px",
                        textAlign: "center",
                        transition: "none",
                        animation: "none",
                      }}
                    >
                      {status === "FT"
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
                        minWidth: "60px",
                        textAlign: "center",
                        transition: "none",
                        animation: "none",
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
                  currentGoals.home > currentGoals.away
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
                />
              </div>

              {/* Score/Time Center */}
              <div className="match-score-container">
                {(() => {
                  const status = currentStatus.short;

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
                    return (
                      <div
                        className="match-time-display"
                        style={{ fontSize: "0.882em" }}
                      >
                        {status === "TBD"
                          ? "TBD"
                          : formatMatchTimeWithTimezone(matchDate)}
                      </div>
                    );
                  }

                  // For any other status, don't show anything
                  return null;
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
                />
              </div>

              {/* Away Team Name */}
              <div
                className={`away-team-name ${
                  currentGoals.home !== null &&
                  currentGoals.away !== null &&
                  currentGoals.away > currentGoals.home
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
                      <span className="penalty-winner">{winnerText}</span>
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

  // Clear cache for specific match when status transitions occur
  const clearMatchCache = useCallback(
    (matchId: number, transition: string, fixtureDate: string) => {
      try {
        const matchDate = new Date(fixtureDate);
        const year = matchDate.getFullYear();
        const month = String(matchDate.getMonth() + 1).padStart(2, "0");
        const day = String(matchDate.getDate()).padStart(2, "0");
        const dateString = `${year}-${month}-${day}`;

        // Clear cache for all leagues for this specific date
        leagueIds.forEach((leagueId) => {
          const cacheKey = getCacheKey(dateString, leagueId);

          try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const { fixtures } = JSON.parse(cached);
              // Check if this match exists in the cache
              const hasMatch = fixtures.some(
                (f: any) => f.fixture.id === matchId,
              );

              if (hasMatch) {
                localStorage.removeItem(cacheKey);
                console.log(
                  `🗑️ [Cache Clear] Cleared cache for league ${leagueId} on ${dateString} due to match ${matchId} ${transition}`,
                );
              }
            }
          } catch (error) {
            console.warn(
              `Failed to clear cache for league ${leagueId}:`,
              error,
            );
          }
        });

        // Also clear any related fixture cache entries
        const allKeys = Object.keys(localStorage);
        const relatedKeys = allKeys.filter(
          (key) => key.startsWith("ended_matches_") && key.includes(dateString),
        );

        relatedKeys.forEach((key) => {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const { fixtures } = JSON.parse(cached);
              const hasMatch = fixtures.some(
                (f: any) => f.fixture.id === matchId,
              );

              if (hasMatch) {
                localStorage.removeItem(key);
                console.log(
                  `🗑️ [Cache Clear] Cleared related cache ${key} due to match ${matchId} ${transition}`,
                );
              }
            }
          } catch (error) {
            console.warn(`Failed to clear related cache ${key}:`, error);
          }
        });
      } catch (error) {
        console.error(`Failed to clear cache for match ${matchId}:`, error);
      }
    },
    [getCacheKey],
  );

  // Simplified status change detection - only for live matches
  useEffect(() => {
    if (!fixtures?.length) return;

    const newHalftimeMatches = new Set<number>();
    const newFulltimeMatches = new Set<number>();
    const newGoalMatches = new Set<number>();

    fixtures.forEach((fixture) => {
      const matchId = fixture.fixture.id;
      const currentStatus = fixture.fixture.status.short;
      const previousStatus = previousMatchStatusesRef.current.get(matchId);
      const currentScore = {
        home: fixture.goals.home ?? 0,
        away: fixture.goals.away ?? 0,
      };
      const previousScore = previousMatchScoresRef.current.get(matchId);

      // Only track changes for live/upcoming matches
      const isLiveOrUpcoming = [
        "LIVE",
        "1H",
        "2H",
        "HT",
        "ET",
        "BT",
        "P",
        "INT",
        "NS",
        "TBD",
      ].includes(currentStatus);

      if (
        isLiveOrUpcoming &&
        previousStatus &&
        previousStatus !== currentStatus
      ) {
        console.log(
          `🔄 [MyScoresLeague] Status change: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name} (${previousStatus} → ${currentStatus})`,
        );

        if (currentStatus === "HT") {
          newHalftimeMatches.add(matchId);
        }
        if (currentStatus === "FT") {
          newFulltimeMatches.add(matchId);
        }
      }

      // Check for goal changes only during live matches
      if (
        previousScore &&
        (currentScore.home !== previousScore.home ||
          currentScore.away !== previousScore.away) &&
        ["1H", "2H", "LIVE", "LIV"].includes(currentStatus)
      ) {
        console.log(
          `⚽ [MyScoresLeague] Goal scored: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
        );
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
  }, [fixtures]);

  if (loading || isLoading) {
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
          const priorityOrder = [
            38, 15, 2, 11, 71, 22, 72, 73, 75, 233, 667, 253,
          ]; // UEFA U21, FIFA Club World Cup, UEFA Champions League, CONMEBOL Sudamericana, Serie A, CONCACAF Gold Cup, Serie B, Serie C, Serie D, Iraqi League, Friendlies Clubs, MLS

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
              key={`myscoresleague-${leagueGroup.league.id}`}
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
                        const liveMatchesInLeague = leagueGroup.matches.filter(
                          (match: any) =>
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
                            <span
                              className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold"
                              style={{
                                minWidth: "50px",
                                textAlign: "center",
                                animation: "none",
                                transition: "none",
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
                  <div className="flex gap-2 items-center"></div>
                </button>
              )}

              {/* Matches - Show when league is expanded */}
              {(timeFilterActive ||
                expandedLeagues.has(`league-${leagueGroup.league.id}`)) && (
                <div className="match-cards-wrapper">
                  {leagueGroup.matches
                    .slice(0, timeFilterActive && showTop10 ? 10 : undefined)
                    .map((match: any) => {
                      const matchId = match.fixture.id;
                      const isHalftimeFlash = halftimeFlashMatches.has(matchId);
                      const isFulltimeFlash = fulltimeFlashMatches.has(matchId);
                      const isGoalFlash = goalFlashMatches.has(matchId);
                      const isStarred = starredMatches.has(matchId);
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
                          onMatchClick={(
                            matchId,
                            homeTeamName,
                            awayTeamName,
                          ) => {
                            // Find the full match object for the callback
                            const fullMatch = leagueGroup.matches.find(
                              (m: any) => m.fixture.id === matchId,
                            );
                            if (fullMatch) {
                              handleMatchCardClick(fullMatch);
                            }
                          }}
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
MyScoresLeagueComponent.displayName = "MyScoresLeagueComponent";
LazyMyScoresLeagueWrapper.displayName = "LazyMyScoresLeagueWrapper";

// Main export using lazy loading wrapper
const MyScoresLeague: React.FC<MyScoresLeagueProps> = (props) => {
  return <LazyMyScoresLeagueWrapper {...props} />;
};

MyScoresLeague.displayName = "MyScoresLeague";

export default MyScoresLeague;