import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Star, Calendar, ChevronDown, ChevronUp } from "lucide-react";
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
import "../../styles/MyLogoPositioning.css";
import "../../styles/flasheffect.css";

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
  const [leagueFixtures, setLeagueFixtures] = useState<Map<number, FixtureData[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Using league ID 38 (UEFA U21) first priority, then 15 (FIFA Club World Cup) second priority
  const leagueIds = [38, 15, 2, 71, 3, 848,  22, 72, 73, 75, 128, 233,  667, 253, 850, 893,  531, 921, 886, 493]; // Added UEFA Champions League (2), Brazilian Serie A (71), CONCACAF Gold Cup (22), Serie B (72), Serie C (73), Serie D (75), Copa Argentina (128), Iraqi League (233), UEFA Europa Conference League (848), Friendlies Clubs (667), MLS (253), and additional leagues (850, 893, 3, 531, 921, 886, 493)

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

  // Enhanced data fetching function combining original league iteration with Simple API
  const fetchLeagueData = useCallback(async (isUpdate = false) => {
    if (!isUpdate) {
      setLoading(true);
      setError(null);
    }

    try {
      const allFixtures: FixtureData[] = [];
      let primaryLeagueInfo: LeagueData | null = null;

      console.log(`🔍 [MyNewLeague] Fetching data for ${selectedDate}`);

      // Always fetch live fixtures for real-time data
      try {
        console.log(`🔴 [MyNewLeague] Fetching live fixtures`);
        const response = await apiRequest("GET", "/api/fixtures/live");
        const liveData = await response.json();

        if (Array.isArray(liveData)) {
          // Filter live fixtures to only include our target leagues
          const relevantLiveFixtures = liveData.filter(fixture => 
            leagueIds.includes(fixture.league?.id)
          );

          if (relevantLiveFixtures.length > 0) {
            console.log(`🔴 [MyNewLeague] Found ${relevantLiveFixtures.length} live fixtures from target leagues`);

            // Check if any live fixtures were previously cached as upcoming
            relevantLiveFixtures.forEach(liveFixture => {
              const previousFixture = fixtures.find(f => f.fixture.id === liveFixture.fixture.id);
              if (previousFixture && previousFixture.fixture.status.short === 'NS') {
                console.log(`🔄 [MyNewLeague] Status transition detected: ${liveFixture.teams.home.name} vs ${liveFixture.teams.away.name} (NS → ${liveFixture.fixture.status.short})`);
              }
            });
          }

          // Add live fixtures first
          allFixtures.push(...relevantLiveFixtures);
        }
      } catch (liveError) {
        console.warn("🔴 [MyNewLeague] Failed to fetch live fixtures:", liveError);
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

            // Filter to only include matches for the selected date using raw UTC date (no timezone conversion)
            const filteredFixtures = nonLiveFixtures.filter(fixture => {
              const fixtureDate = fixture.fixture?.date;
              if (!fixtureDate) return false;

              // Extract date from UTC string directly without timezone conversion
              const utcDateString = fixtureDate.substring(0, 10); // Extract YYYY-MM-DD from ISO string

              return utcDateString === selectedDate;
            });

            console.log(`🎯 [MyNewLeague] League ${leagueId}: ${freshFixtures.length} → ${filteredFixtures.length} fixtures after date filtering`);

            // Log sample fixtures for debugging
            if (filteredFixtures.length > 0) {
              filteredFixtures.slice(0, 3).forEach(fixture => {
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
            const newFixtures = filteredFixtures.filter(f => !existingIds.has(f.fixture.id));

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

        // Group fixtures by league and filter for our target leagues
        const leagueFixturesMap = new Map();

        allDateFixtures.forEach(fixture => {
          const leagueId = fixture.league?.id;
          if (leagueIds.includes(leagueId)) {
            if (!leagueFixturesMap.has(leagueId)) {
              leagueFixturesMap.set(leagueId, []);
            }
            leagueFixturesMap.get(leagueId).push(fixture);
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

        setLeagueFixtures(newLeagueFixtures);

        // Cache the results to avoid refetching
        sessionStorage.setItem(`league-fixtures-${selectedDate}`, JSON.stringify({
          data: Array.from(newLeagueFixtures.entries()),
          timestamp: Date.now()
        }));

      } catch (error) {
        console.error('❌ [MyNewLeague] Error fetching league fixtures:', error);
        setError('Failed to load matches');
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
        const maxAge = selectedDate === new Date().toISOString().split('T')[0] ? 60000 : 300000;

        if (age < maxAge) {
          console.log(`💾 [MyNewLeague] Using cached data for ${selectedDate} (age: ${Math.round(age/1000)}s)`);
          setLeagueFixtures(new Map(data));
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.warn('Failed to parse cache:', error);
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

    // More aggressive refresh for live matches, less aggressive for non-live
    const refreshInterval = hasLiveMatches ? 15000 : 60000; // 15s for live, 60s for non-live

    console.log(`⏰ [MyNewLeague] Setting refresh interval to ${refreshInterval/1000}s (hasLiveMatches: ${hasLiveMatches})`);

    // Set up periodic refresh with dynamic interval
    const interval = setInterval(() => {
      fetchLeagueData(true); // Pass true to indicate this is an update
    }, refreshInterval);

    // Set up periodic cleanup of status transitions - every 5 minutes
    const cleanupInterval = setInterval(() => {
      fixtureCache.invalidateTransitionedFixtures();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearInterval(cleanupInterval);
    };
  }, [fetchLeagueData, selectedDate, fixtures.length]);

  // Debug logging
  console.log("MyNewLeague - All fixtures:", fixtures.length);

  // Enhanced debugging for specific leagues
  const friendliesFixtures = fixtures.filter(f => f.league.id === 667);
  const iraqiFixtures = fixtures.filter(f => f.league.id === 233);
  const copaArgentinaFixtures = fixtures.filter(f => f.league.id === 128);

  console.log("🏆 [MyNewLeague FRIENDLIES] Total Friendlies fixtures:", friendliesFixtures.length);
  console.log("🇮🇶 [MyNewLeague IRAQI] Total Iraqi League fixtures:", iraqiFixtures.length);
  console.log("🇦🇷 [MyNewLeague COPA ARG] Total Copa Argentina fixtures:", copaArgentinaFixtures.length);

  // Debug Iraqi League
  if (iraqiFixtures.length > 0) {
    console.log("🇮🇶 [MyNewLeague IRAQI] Sample fixtures with dates:");
    iraqiFixtures.slice(0, 5).forEach((f) => {
      const matchDate = new Date(f.fixture.date);
      const year = matchDate.getFullYear();
      const month = String(matchDate.getMonth() + 1).padStart(2, "0");
      const day = String(matchDate.getDate()).padStart(2, "0");
      const matchDateString = `${year}-${month}-${day}`;

      console.log(`🇮🇶 Iraqi Match: ${f.teams.home.name} vs ${f.teams.away.name}`, {
        fixtureDate: f.fixture.date,
        matchDateString,
        selectedDate,
        dateMatches: matchDateString === selectedDate,
        status: f.fixture.status.short,
        league: f.league.name
      });
    });
  }

  // Debug Copa Argentina
  if (copaArgentinaFixtures.length > 0) {
    console.log("🇦🇷 [MyNewLeague COPA ARG] Sample fixtures with dates:");
    copaArgentinaFixtures.slice(0, 5).forEach((f) => {
      const matchDate = new Date(f.fixture.date);
      const year = matchDate.getFullYear();
      const month = String(matchDate.getMonth() + 1).padStart(2, "0");
      const day = String(matchDate.getDate()).padStart(2, "0");
      const matchDateString = `${year}-${month}-${day}`;

      console.log(`🇦🇷 Copa Argentina Match: ${f.teams.home.name} vs ${f.teams.away.name}`, {
        fixtureDate: f.fixture.date,
        matchDateString,
        selectedDate,
        dateMatches: matchDateString === selectedDate,
        status: f.fixture.status.short,
        league: f.league.name
      });
    });
  }

  // Debug Friendlies
  if (friendliesFixtures.length > 0) {
    console.log("🏆 [MyNewLeague FRIENDLIES] Sample fixtures with dates:");
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
        league: f.league.name
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

  // Filter matches using improved date-aware time classification
  const selectedDateFixtures = fixtures.filter((f) => {
    const fixtureDate = f.fixture.date;
    if (!fixtureDate) return false;

    // Use the improved advanced time classifier with date awareness
    const classification = MyAdvancedTimeClassifier.classifyFixture(
      f.fixture.date,
      f.fixture.status.short,
      selectedDate
    );

    // Debug log for time classification
    console.log(`🕐 [DATE-AWARE TIME CLASSIFICATION] Match: ${f.teams.home.name} vs ${f.teams.away.name}`, {
      fixtureDate: f.fixture.date,
      selectedDate,
      status: f.fixture.status.short,
      category: classification.category,
      reason: classification.reason,
      shouldShow: classification.shouldShow,
      league: f.league.name,
      leagueId: f.league.id
    });

    if (!classification.shouldShow) {
      console.log(`❌ [DATE-AWARE FILTER] Excluded match: ${f.teams.home.name} vs ${f.teams.away.name}`, {
        classification: classification.category,
        reason: classification.reason,
        status: f.fixture.status.short,
        selectedDate
      });
    }

    return classification.shouldShow;
  });

  // Log filtering results for all target leagues
  const friendliesFiltered = selectedDateFixtures.filter(f => f.league.id === 667);
  const iraqiFiltered = selectedDateFixtures.filter(f => f.league.id === 233);
  const copaArgentinaFiltered = selectedDateFixtures.filter(f => f.league.id === 128);

  console.log(`🏆 [MyNewLeague FRIENDLIES] After date filtering: ${friendliesFiltered.length} matches for ${selectedDate}`);
  console.log(`🇮🇶 [MyNewLeague IRAQI] After date filtering: ${iraqiFiltered.length} matches for ${selectedDate}`);
  console.log(`🇦🇷 [MyNewLeague COPA ARG] After date filtering: ${copaArgentinaFiltered.length} matches for ${selectedDate}`);

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

  // Memoize the match click handler to prevent infinite re-renders
  const handleMatchCardClick = useCallback((match: any) => {
    console.log('🎯 [MyNewLeague] Match card clicked:', {      fixtureId: match.fixture?.id,
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

  // Memoize team logos separately to prevent logo rerenders
  const TeamLogo = memo(({ teamId, teamName, logoUrl, size, leagueGroup }: {
    teamId: number;
    teamName: string;
    logoUrl: string;
    size: string;
    leagueGroup: any;
  }) => (
    <MyWorldTeamLogo
      teamName={teamName}
      teamLogo={logoUrl}
      alt={teamName}
      size={size}
      className="popular-leagues-size"
      leagueContext={{
        name: leagueGroup.league.name,
        country: leagueGroup.league.country,
      }}
    />
  ));

  // Memoized match card component to prevent unnecessary re-renders
  const MatchCard = memo(({ 
    match, 
    isHalftimeFlash, isFulltimeFlash, 
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
    // Memoize the click handler to prevent re-renders
    const handleMatchClick = useCallback(() => {
      if (onMatchClick) {
        onMatchClick(match);
      }
    }, [match, onMatchClick]);

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
          onClick={handleMatchClick}
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
                <TeamLogo
                  teamId={match.teams.home.id}
                  teamName={match.teams.home.name}
                  logoUrl={
                    match.teams.home.id
                      ? `/api/team-logo/square/${match.teams.home.id}?size=32`
                      : "/assets/fallback-logo.svg"
                  }
                  size="34px"
                  leagueGroup={leagueGroup}
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
                          {formatMatchTimeWithTimezone(match.fixture.date)}
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
                        : formatMatchTimeWithTimezone(match.fixture.date)}
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
                  teamId={match.teams.away.id}
                  teamName={match.teams.away.name}
                  logoUrl={
                    match.teams.away.id
                      ? `/api/team-logo/square/${match.teams.away.id}?size=32`
                      : "/assets/fallback-logo.svg"
                  }
                  size="34px"
                  leagueGroup={leagueGroup}
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
  }, [fixtures, clearMatchCache, previousMatchStatuses, previousMatchScores]);

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
                      onMatchClick={handleMatchCardClick}
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