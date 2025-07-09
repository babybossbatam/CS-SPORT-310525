import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Star, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid } from "date-fns";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
import { fixtureCache } from "@/lib/fixtureCache";
import "../../styles/MyLogoPositioning.css";
import "../../styles/flasheffect.css";
import { getUserTimezone } from "@/lib/timezoneUtils";

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

const MyNewLeague: React.FC<MyNewLeagueProps> = ({
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

  // Flash animation states
  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(new Set());
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(new Set());
  const [goalFlashMatches, setGoalFlashMatches] = useState<Set<number>>(new Set());

  // Status and score tracking for flash effects
  const [previousMatchStatuses, setPreviousMatchStatuses] = useState<Map<number, string>>(new Map());
  const [previousMatchScores, setPreviousMatchScores] = useState<Map<number, {home: number, away: number}>>(new Map());

  // Using league ID 38 (UEFA U21) first priority, then 15 (FIFA Club World Cup) second priority
  const leagueIds = [38, 15, 2, 71, 22, 72, 73, 75, 128, 233, 667, 253]; // Added UEFA Champions League (2), Brazilian Serie A (71), CONCACAF Gold Cup (22), Serie B (72), Serie C (73), Serie D (75), Copa Argentina (128), Iraqi League (233), Friendlies Clubs (667), and MLS (253)

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

  // Get cached ended matches with strict date validation
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

  // Optimized data fetching - only update scores and status for existing matches
  const fetchLeagueData = useCallback(async (isUpdate = false) => {
    if (!isUpdate) {
      setLoading(true);
      setError(null);
    }

    try {
      console.log(`🔍 [MyNewLeague] ${isUpdate ? 'Updating' : 'Fetching'} data for ${selectedDate}`);

      // Get user's timezone for API request
      const userTimezone = getUserTimezone();

      // Fetch fixtures directly from the date endpoint with user timezone
      const response = await apiRequest(
        "GET", 
        `/api/fixtures/date/${selectedDate}?timezone=${encodeURIComponent(userTimezone)}&all=true`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch fixtures: ${response.status}`);
      }

      const allFixtures = await response.json();
      console.log(`📊 [MyNewLeague] Received ${allFixtures.length} fixtures for ${selectedDate} with timezone ${userTimezone}`);

      // Filter to only include our target leagues - REMOVED additional date filtering since server already handles this
      const leagueFixtures = allFixtures.filter((fixture: FixtureData) => 
        leagueIds.includes(fixture.league?.id)
      );

      console.log(`🎯 [MyNewLeague] Filtered to ${leagueFixtures.length} fixtures from target leagues (server pre-filtered by date)`);

      // Log league breakdown with fixture details for debugging
      const leagueBreakdown = leagueFixtures.reduce((acc, fixture) => {
        const leagueId = fixture.league.id;
        const leagueName = fixture.league.name;
        if (!acc[leagueId]) {
          acc[leagueId] = { name: leagueName, count: 0, fixtures: [] };
        }
        acc[leagueId].count++;
        acc[leagueId].fixtures.push({
          id: fixture.fixture.id,
          teams: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
          status: fixture.fixture.status.short,
          date: fixture.fixture.date
        });
        return acc;
      }, {} as Record<number, { name: string; count: number; fixtures: any[] }>);

      console.log(`📋 [MyNewLeague] League breakdown with fixtures:`, leagueBreakdown);

      // For updates, only merge dynamic data (scores, status, elapsed time) to prevent flashing
      if (isUpdate && fixtures.length > 0) {
        setFixtures(prevFixtures => {
          const updatedFixtures = prevFixtures.map(prevFixture => {
            const updatedFixture = leagueFixtures.find(f => f.fixture.id === prevFixture.fixture.id);
            if (updatedFixture) {
              // Only update dynamic fields, keep static data (team names, logos, league info)
              return {
                ...prevFixture,
                fixture: {
                  ...prevFixture.fixture,
                  status: updatedFixture.fixture.status, // Update status and elapsed time
                },
                goals: updatedFixture.goals, // Update scores
                score: updatedFixture.score, // Update penalty scores
              };
            }
            return prevFixture;
          });

          // Add any new fixtures that weren't in the previous list
          const newFixtures = leagueFixtures.filter(newFixture => 
            !prevFixtures.some(prevFixture => prevFixture.fixture.id === newFixture.fixture.id)
          );

          console.log(`🔄 [MyNewLeague] Updated ${updatedFixtures.length} existing fixtures, added ${newFixtures.length} new fixtures`);
          return [...updatedFixtures, ...newFixtures];
        });
      } else {
        // Initial load or full refresh - server already filtered by date and timezone
        setFixtures(leagueFixtures);

        // Log some sample fixtures for debugging
        leagueFixtures.slice(0, 3).forEach((fixture: FixtureData) => {
          console.log(`✅ [MyNewLeague] Fixture ${fixture.fixture.id}:`, {
            teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
            league: fixture.league?.name,
            status: fixture.fixture?.status?.short,
            date: fixture.fixture?.date,
          });
        });
      }
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
  }, [selectedDate, fixtures.length]);

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

  // Clear cache when date changes to prevent cross-date contamination
  useEffect(() => {
    const clearDateSpecificCache = () => {
      try {
        // Clear fixtureCache for the new date
        fixtureCache.clearCache();

        // Clear any stale localStorage entries that might contain wrong date data
        const keys = Object.keys(localStorage);
        const staleCacheKeys = keys.filter(key => 
          (key.startsWith('ended_matches_') || key.startsWith('finished_fixtures_')) &&
          !key.includes(selectedDate)
        );

        staleCacheKeys.forEach(key => {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const { date: cachedDate, timestamp } = JSON.parse(cached);
              const cacheAge = Date.now() - timestamp;

              // If cache is recent but for wrong date, clear it
              if (cacheAge < 2 * 60 * 60 * 1000 && cachedDate !== selectedDate) {
                localStorage.removeItem(key);
                console.log(`🗑️ [MyNewLeague] Cleared cross-date cache: ${key} (cached: ${cachedDate}, selected: ${selectedDate})`);
              }
            }
          } catch (error) {
            localStorage.removeItem(key);
          }
        });

        console.log(`🔄 [MyNewLeague] Cache cleared for date change to ${selectedDate}`);
      } catch (error) {
        console.error('Error clearing date-specific cache:', error);
      }
    };

    clearDateSpecificCache();
  }, [selectedDate]);

  useEffect(() => {
    fetchLeagueData(false);

    // Check if we have any live matches to determine refresh frequency
    const hasLiveMatches = fixtures.some(fixture => 
      ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(fixture.fixture.status.short)
    );

    // Optimized refresh intervals - reduce API calls for non-live content
    const refreshInterval = hasLiveMatches ? 30000 : 300000; // 30s for live, 5min for non-live

    // Smart refresh logic based on content type and date
    const hasUpcomingMatches = fixtures.some(fixture => 
      ['NS', 'TBD', 'PST'].includes(fixture.fixture.status.short)
    );
    
    const isToday = selectedDate === new Date().toISOString().slice(0, 10);
    const isFutureDate = selectedDate > new Date().toISOString().slice(0, 10);
    
    // Only refresh if:
    // 1. We have live matches (any date)
    // 2. We have upcoming matches for today or future dates
    // 3. Skip refresh for past dates unless there are live matches
    const shouldRefresh = hasLiveMatches || (hasUpcomingMatches && (isToday || isFutureDate));
    
    console.log(`⏰ [MyNewLeague] Setting refresh interval to ${refreshInterval/1000}s (hasLiveMatches: ${hasLiveMatches}, shouldRefresh: ${shouldRefresh})`);

    // Set up periodic refresh with dynamic interval - only when needed
    const interval = setInterval(() => {
      if (shouldRefresh) {
        console.log(`🔄 [MyNewLeague] Auto-refresh (update only) - Live matches: ${hasLiveMatches}`);
        fetchLeagueData(true); // Pass true to indicate this is an update
      } else {
        console.log(`⏸️ [MyNewLeague] Skipping refresh - no live/upcoming matches for today`);
      }
    }, refreshInterval);

    // Set up periodic cleanup of status transitions - every 5 minutes
    const cleanupInterval = setInterval(() => {
      fixtureCache.invalidateTransitionedFixtures();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearInterval(cleanupInterval);
    };
  }, [fetchLeagueData, selectedDate]); // Remove fixtures.length dependency to prevent unnecessary re-renders

  // Server already filters by date and timezone, so we use fixtures directly
  console.log(`✅ [MyNewLeague] Using ${fixtures.length} fixtures (server pre-filtered by date and timezone)`);

  // Enhanced debugging for specific leagues
  const leagueBreakdown = fixtures.reduce((acc, f) => {
    const leagueId = f.league.id;
    const leagueName = f.league.name;
    if (!acc[leagueId]) {
      acc[leagueId] = { name: leagueName, count: 0, fixtures: [] };
    }
    acc[leagueId].count++;
    acc[leagueId].fixtures.push({
      id: f.fixture.id,
      teams: `${f.teams.home.name} vs ${f.teams.away.name}`,
      status: f.fixture.status.short,
      date: f.fixture.date
    });
    return acc;
  }, {} as Record<number, { name: string; count: number; fixtures: any[] }>);

  // Log breakdown by league
  Object.entries(leagueBreakdown).forEach(([leagueId, data]) => {
    console.log(`🏆 [MyNewLeague] League ${leagueId} (${data.name}): ${data.count} matches`);
    if (data.fixtures.length > 0) {
      console.log(`   Sample: ${data.fixtures[0].teams} (${data.fixtures[0].status})`);
    }
  });

  // Group matches by league ID (fixtures are already filtered by server)
  const matchesByLeague = fixtures.reduce(
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

  console.log(`📊 [MyNewLeague] Grouped into ${Object.keys(matchesByLeague).length} leagues:`, 
    Object.entries(matchesByLeague).map(([id, data]) => `${data.league.name}: ${data.matches.length} matches`)
  );

  // Auto-expand all leagues by default when data changes
  useEffect(() => {
    const leagueKeys = Object.keys(matchesByLeague).map(leagueId => `league-${leagueId}`);
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
        if (["LIVE", "LIV", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(status)) {
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
        const bElapsed = Number(
b.fixture.status.elapsed) || 0;
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

  // Heavily memoized match card component to prevent unnecessary re-renders
  const MatchCard = memo(({ 
    match, 
    isHalftimeFlash, 
    isFulltimeFlash, 
    isGoalFlash, 
    isStarred, 
    onStarToggle, 
    onMatchClick,
    leagueGroup 
  }: {
    match: any;
    isHalftimeFlash: boolean;
    isFulltimeFlash: boolean;
    isGoalFlash: boolean;
    isStarred: boolean;
    onStarToggle: (matchId: number) => void;
    onMatchClick?: (match: any) => void;
    leagueGroup: any;
  }) => {
    return (
      <div
        key={match.fixture.id}
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
          data-fixture-id={match.fixture.id}
          onClick={() => onMatchClick?.(match)}
          style={{
            cursor: onMatchClick ? "pointer" : "default",
          }}
        >
          {/* Star Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStarToggle(match.fixture.id);
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
            <div className="match-status-top">
              {(() => {
                const status = match.fixture.status.short;
                const elapsed = match.fixture.status.elapsed;

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
                    displayText = elapsed
                      ? `${elapsed}' ET`
                      : "Extra Time";
                  } else if (status === "BT") {
                    displayText = "Break Time";
                  } else if (status === "INT") {
                    displayText = "Interrupted";
                  } else {
                    displayText = elapsed ? `${elapsed}'` : "LIVE";
                  }

                  return (
                    <div className="match-status-label status-live">
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
                    <div className="match-status-label status-ended">
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
                    <div className="match-status-label status-upcoming">
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
                  match.goals.home !== null &&
                  match.goals.away !== null &&
                  match.goals.home > match.goals.away
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
                {shortenTeamName(match.teams.home.name) || "Unknown Team"}
              </div>

              {/* Home team logo */}
              <div
                className="home-team-logo-container"
                style={{ padding: "0 0.6rem" }}
              >
                <MyWorldTeamLogo
                  teamName={match.teams.home.name}
                  teamLogo={
                    match.teams.home.id
                      ? `/api/team-logo/square/${match.teams.home.id}?size=32`
                      : "/assets/fallback-logo.svg"
                  }
                  alt={match.teams.home.name}
                  size="34px"
                  className="popular-leagues-size"
                  leagueContext={{
                    name: leagueGroup.league.name,
                    country: leagueGroup.league.country,
                  }}
                />
              </div>

              {/* Score/Time Center */}
              <div className="match-score-container">
                {(() => {
                  const status = match.fixture.status.short;
                  const fixtureDate = parseISO(match.fixture.date);

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
                          {match.goals.home ?? 0}
                        </span>
                        <span className="score-separator">-</span>
                        <span className="score-number">
                          {match.goals.away ?? 0}
                        </span>
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
                          <span className="score-number">
                            {homeScore}
                          </span>
                          <span className="score-separator">-</span>
                          <span className="score-number">
                            {awayScore}
                          </span>
                        </div>
                      );
                    } else {
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

                  return (
                    <div
                      className="match-time-display"
                      style={{ fontSize: "0.882em" }}
                    >
                      {status === "TBD"
                        ? "TBD"
                        : format(fixtureDate, "HH:mm")}
                    </div>
                  );
                })()}
              </div>

              {/* Away team logo */}
              <div
                className="away-team-logo-container"
                style={{ padding: "0 0.5rem" }}
              >
                <MyWorldTeamLogo
                  teamName={match.teams.away.name}
                  teamLogo={
                    match.teams.away.id
                      ? `/api/team-logo/square/${match.teams.away.id}?size=32`
                      : "/assets/fallback-logo.svg"
                  }
                  alt={match.teams.away.name}
                  size="34px"
                  className="popular-leagues-size"
                  leagueContext={{
                    name: leagueGroup.league.name,
                    country: leagueGroup.league.country,
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
                style={{
                  paddingLeft: "0.75rem",
                  textAlign: "left",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {shortenTeamName(match.teams.away.name) || "Unknown Team"}
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
      </div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison to prevent re-renders unless essential data changes
    const prevMatch = prevProps.match;
    const nextMatch = nextProps.match;

    // Only re-render if dynamic data changed (status, scores, flash states)
    return (
      prevMatch.fixture.id === nextMatch.fixture.id &&
      prevMatch.fixture.status.short === nextMatch.fixture.status.short &&
      prevMatch.fixture.status.elapsed === nextMatch.fixture.status.elapsed &&
      prevMatch.goals.home === nextMatch.goals.home &&
      prevMatch.goals.away === nextMatch.goals.away &&
      prevProps.isHalftimeFlash === nextProps.isHalftimeFlash &&
      prevProps.isFulltimeFlash === nextProps.isFulltimeFlash &&
      prevProps.isGoalFlash === nextProps.isGoalFlash &&
      prevProps.isStarred === nextProps.isStarred &&
      JSON.stringify(prevMatch.score?.penalty) === JSON.stringify(nextMatch.score?.penalty)
    );
  });

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

  // Enhanced effect to detect status and score changes with flash effects and cache clearing
  useEffect(() => {
    if (!fixtures?.length) return;

    const newHalftimeMatches = new Set<number>();
    const newFulltimeMatches = new Set<number>();
    const newGoalMatches = new Set<number>();
    const currentStatuses = new Map<number, string>();
    const currentScores = new Map<number, {home: number, away: number}>();

    // Check for stale live matches that should be updated
    const staleLiveMatches = fixtures.filter((fixture) => {
      const status = fixture.fixture.status.short;
      const isLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(status);

      if (!isLive) return false;

      // Check if elapsed time seems stale (same for too long)
      const elapsed = fixture.fixture.status.elapsed;
      const previousElapsed = previousMatchStatuses.get(fixture.fixture.id);

      // If elapsed time hasn't changed for a live match in 2+ minutes, it might be stale
      if (elapsed && previousElapsed === status) {
        const timeSinceLastUpdate = Date.now() - (fixture.lastUpdated || 0);
        if (timeSinceLastUpdate > 2 * 60 * 1000) { // 2 minutes
          console.log(`🚨 [MyNewLeague STALE LIVE] Match ${fixture.fixture.id} might have stale data:`, {
            teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
            status,
            elapsed,
            timeSinceLastUpdate: Math.round(timeSinceLastUpdate / 1000) + 's'
          });
          return true;
        }
      }

      return false;
    });

    // Force refresh for stale live matches
    if (staleLiveMatches.length > 0) {
      console.log(`🔄 [MyNewLeague] Found ${staleLiveMatches.length} potentially stale live matches, forcing refresh`);
      staleLiveMatches.forEach(match => {
        clearMatchCache(match.fixture.id, 'STALE_LIVE', match.fixture.date);
      });

      // Trigger a fresh fetch in 5 seconds to get updated data
      setTimeout(() => {
        fetchLeagueData(true);
      }, 5000);
    }

    fixtures.forEach((fixture) => {
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
        console.log(`🔄 [MyNewLeague STATUS TRANSITION] Match ${matchId}:`, {
          teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          transition: `${previousStatus} → ${currentStatus}`,
          time: new Date().toLocaleTimeString(),
          elapsed: fixture.fixture.status.elapsed
        });

        // Track status transition in cache system for invalidation
        fixtureCache.trackStatusTransition(matchId, previousStatus, currentStatus);

        // Handle NS → LIVE transition - clear upcoming match cache
        if (previousStatus === 'NS' && ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(currentStatus)) {
          console.log(`🟢 [MyNewLeague NS→LIVE] Match ${matchId} started! Clearing upcoming cache`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousStatus,
            currentStatus,
            elapsed: fixture.fixture.status.elapsed
          });

          // Clear cache for this specific match
          clearMatchCache(matchId, 'NS→LIVE', fixture.fixture.date);

          // Force immediate refresh for this live match
          setTimeout(() => {
            fetchLeagueData(true);
          }, 10000); // Refresh in 10 seconds to ensure live updates
        }

        // Handle LIVE → ENDED transition - clear live match cache
        if (['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(previousStatus) && 
            ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(currentStatus)) {
          console.log(`🏁 [MyNewLeague LIVE→ENDED] Match ${matchId} ended! Clearing live cache`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousStatus,
            currentStatus,
            finalScore: `${currentScore.home}-${currentScore.away}`
          });

          // Clear cache for this specific match
          clearMatchCache(matchId, 'LIVE→ENDED', fixture.fixture.date);
        }

        // Check if status just changed to halftime
        if (currentStatus === 'HT') {
          console.log(`🟠 [MyNewLeague HALFTIME FLASH] Match ${matchId} just went to halftime!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousStatus,
            currentStatus
          });
          newHalftimeMatches.add(matchId);
        }

        // Check if status just changed to fulltime
        if (currentStatus === 'FT') {
          console.log(`🔵 [MyNewLeague FULLTIME FLASH] Match ${matchId} just finished!`, {
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
        console.log(`⚽ [MyNewLeague GOAL FLASH] Match ${matchId} score changed!`, {
          home: fixture.teams?.home?.name,
          away: fixture.teams?.away?.name,
          previousScore,
          currentScore,
          status: currentStatus,
          elapsed: fixture.fixture.status.elapsed
        });
        newGoalMatches.add(matchId);

        // Clear cache immediately when goals are scored
        clearMatchCache(matchId, 'GOAL_SCORED', fixture.fixture.date);
      }

      // Check for elapsed time changes in live matches
      if (previousStatus === currentStatus && 
          ['1H', '2H', 'LIVE', 'LIV'].includes(currentStatus)) {
        const previousElapsed = previousMatchStatuses.get(`${matchId}_elapsed`);
        const currentElapsed = fixture.fixture.status.elapsed;

        if (previousElapsed && currentElapsed && previousElapsed !== currentElapsed) {
          console.log(`⏱️ [MyNewLeague TIME UPDATE] Match ${matchId} time updated:`, {
            teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
            elapsed: `${previousElapsed}' → ${currentElapsed}'`,
            status: currentStatus
          });
        }

        // Store elapsed time for tracking
        currentStatuses.set(`${matchId}_elapsed`, currentElapsed?.toString() || '');
      }
    });

    // Update previous statuses and scores AFTER checking for changes
    setPreviousMatchStatuses(currentStatuses);
    setPreviousMatchScores(currentScores);

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
  }, [fixtures, clearMatchCache]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="h-3 w-40 bg-gray-200 animate-pulse rounded" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-100 last:border-b-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-4 bg-gray-200 animate-pulse rounded-sm" />
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                    <div className="h-4 w-8 bg-gray-200 animate-pulse rounded" />
                    <div className="h-5 w-12 bg-gray-200 animate-pulse rounded-full" />
                  </div>
                  <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
          const priorityOrder = [38, 15, 2, 71, 22, 72, 73, 75, 128, 233, 667, 253]; // UEFA U21, FIFA Club World Cup, UEFA Champions League, Serie A, CONCACAF Gold Cup, Serie B, Serie C, Serie D, Copa Argentina, Iraqi League, Friendlies Clubs, MLS

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
                      const liveMatchesInLeague = leagueGroup.matches.filter((match: any) =>
                        ["LIVE", "1H", "HT", "2H", "ET","BT", "P", "INT"].includes(match.fixture.status.short)
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
                .slice(0, timeFilterActive && showTop10 ? 10 : undefined)
                .map((match: any) => {
                  const matchId = match.fixture.id;
                  const isHalftimeFlash = halftimeFlashMatches.has(matchId);
                  const isFulltimeFlash = fulltimeFlashMatches.has(matchId);
                  const isGoalFlash = goalFlashMatches.has(matchId);
                  const isStarred = starredMatches.has(matchId)
                  return (
                    <MatchCard
                      key={match.fixture.id}
                      match={match}
                      isHalftimeFlash={isHalftimeFlash}
                      isFulltimeFlash={isFulltimeFlash}
                      isGoalFlash={isGoalFlash}
                      isStarred={isStarred}
                      onStarToggle={toggleStarMatch}
                      onMatchClick={onMatchCardClick}
                      leagueGroup={leagueGroup}
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

export default MyNewLeague;