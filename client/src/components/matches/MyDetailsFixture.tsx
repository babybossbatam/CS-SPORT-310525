import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useQuery } from "@tanstack/react-query";
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
import { formatMatchTimeWithTimezone } from "@/lib/timezoneApiService";
import "../../styles/MyLogoPositioning.css";
import "../../styles/flasheffect.css";



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

interface MyDetailsFixtureProps {
  selectedDate: string;
  onMatchCardClick?: (fixture: any) => void; // Callback to pass match data to parent (for MyMatchdetailsScoreboard)
  match?: any; // Current match data (used for sample display)
  selectedMatchId?: number; // Match ID to highlight from featured match
  currentLeagueId?: number; // League ID to filter fixtures for current match's league only
}

const MyDetailsFixture = ({
  selectedDate,
  onMatchCardClick,
  match,
  selectedMatchId,
  currentLeagueId,
}: MyDetailsFixtureProps) => {
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
  console.log("🎯 [MyDetailsFixture] Received match data:", {
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
  const [internalSelectedMatchId, setInternalSelectedMatchId] = useState<number | null>(null);

  // Only use the current league ID - no fallback to multiple leagues
  const leagueIds = currentLeagueId ? [currentLeagueId] : [];

  // Helper function to add delay between requests
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Fetch fixtures for all leagues with throttling
  const {
    data: allFixtures,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["myDetailsFixture", "allFixtures", selectedDate],
    queryFn: async () => {
      console.log(
        `🎯 [MyDetailsFixture] Fetching fixtures for ${leagueIds.length} leagues on ${selectedDate}:`,
        leagueIds,
      );

      // Process leagues in batches to avoid rate limiting
      const batchSize = 3; // Reduce concurrent requests
      const results: any[] = [];

      for (let i = 0; i < leagueIds.length; i += batchSize) {
        const batch = leagueIds.slice(i, i + batchSize);
        console.log(`🔄 [MyDetailsFixture] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(leagueIds.length/batchSize)}: leagues ${batch.join(', ')}`);

        const batchPromises = batch.map(async (leagueId, index) => {
          // Add small delay between requests in the same batch
          if (index > 0) {
            await delay(200); // 200ms delay between requests
          }

          try {
            const response = await fetch(`/api/leagues/${leagueId}/fixtures`);

            if (!response.ok) {
              if (response.status === 429) {
                console.warn(`⚠️ [MyDetailsFixture] Rate limited for league ${leagueId}, will use cached data if available`);
                return { leagueId, fixtures: [], error: 'Rate limited', rateLimited: true };
              }
              console.log(
                `❌ [MyDetailsFixture] Failed to fetch league ${leagueId}: ${response.status} ${response.statusText}`,
              );
              return { leagueId, fixtures: [], error: `HTTP ${response.status}` };
            }

            const data = await response.json();
            const fixtures = data.response || data || [];
            console.log(
              `✅ [MyDetailsFixture] League ${leagueId}: ${fixtures.length} fixtures`,
            );
            return { leagueId, fixtures, error: null };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Handle specific fetch errors
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
              console.warn(`🌐 [MyDetailsFixture] Network error for league ${leagueId}: ${errorMessage}`);
              return { leagueId, fixtures: [], error: 'Network error', networkError: true };
            }

            console.error(
              `❌ [MyDetailsFixture] Error fetching league ${leagueId}:`,
              error,
            );
            return { leagueId, fixtures: [], error: errorMessage };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to be more API-friendly
        if (i + batchSize < leagueIds.length) {
          console.log(`⏳ [MyDetailsFixture] Waiting 500ms before next batch...`);
          await delay(500);
        }
      }

      // Deduplicate at the fetch level as well
      const allFixturesMap = new Map<number, FixtureData>();
      results.forEach((result) => {
        result.fixtures.forEach((fixture: FixtureData) => {
          if (fixture?.fixture?.id && !allFixturesMap.has(fixture.fixture.id)) {
            allFixturesMap.set(fixture.fixture.id, fixture);
          }
        });
      });

      const allFixtures = Array.from(allFixturesMap.values());

      // Log detailed results
      console.log(`🔄 [MyDetailsFixture] Fetch results:`, {
        totalLeagues: results.length,
        successfulFetches: results.filter((r) => r.fixtures.length > 0).length,
        totalFixtures: allFixtures.length,
        duplicatesRemoved: results.reduce((sum, r) => sum + r.fixtures.length, 0) - allFixtures.length,
        leagueBreakdown: results.map((r) => ({
          league: r.leagueId,
          fixtures: r.fixtures.length,
          error: r.error,
        })),
      });

      return allFixtures;
    },
    staleTime: 10 * 60 * 1000, // Increase cache time to 10 minutes
    refetchInterval: 60 * 1000, // Reduce refetch frequency to 1 minute
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on rate limiting or network errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('429') || 
            errorMessage.includes('rate limit') || 
            errorMessage.includes('too many requests')) {
          console.warn(`🚫 [MyDetailsFixture] Not retrying due to rate limiting`);
          return false;
        }
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Group fixtures by league with date filtering
  const fixturesByLeague = useMemo(() => {
    console.log(
      `🔍 [MyDetailsFixture] Processing fixtures for date ${selectedDate}:`,
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
      console.log(`❌ [MyDetailsFixture] No fixtures available`);
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
          `⚠️ [MyDetailsFixture] Invalid fixture at index ${index}:`,
          fixture,
        );
        return;
      }

      // Check for duplicate fixture IDs
      if (seenFixtures.has(fixture.fixture.id)) {
        console.log(
          `🔄 [MyDetailsFixture] Duplicate fixture ID detected and skipped:`,
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
          `🔄 [MyDetailsFixture] Duplicate matchup detected and skipped:`,
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

      console.log(
        `✅ [MyDetailsFixture] Added fixture:`,
        {
          fixtureId: fixture.fixture.id,
          teams: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
          league: fixture.league.name,
          matchupKey,
        },
      );
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
      `✅ [MyDetailsFixture] Date filtered fixtures for ${selectedDate}:`,
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

  const handleMatchClick = (fixture: FixtureData) => {
    console.log("🎯 [MyDetailsFixture] Match card clicked:", {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      status: fixture.fixture?.status?.short,
      source: "MyDetailsFixture",
    });

    // Call the callback to pass match data to parent component first (like MyNewLeague does)
    if (onMatchCardClick) {
      onMatchCardClick(fixture);
    }

    // Set the internal selected match ID
    setInternalSelectedMatchId(fixture.fixture.id);

    // Don't navigate automatically - let parent handle it if needed
    // navigate(`/match/${fixture.fixture.id}`);
  };

  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(new Set());
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(new Set());
  const [goalFlashMatches, setGoalFlashMatches] = useState<Set<number>>(new Set());
  const [kickoffFlashMatches, setKickoffFlashMatches] = useState<Set<number>>(new Set());
  const [finishFlashMatches, setFinishFlashMatches] = useState<Set<number>>(new Set());
  const [previousMatchStatuses, setPreviousMatchStatuses] = useState<Map<number, string>>(new Map());

  // Function to trigger the kickoff flash effect
  const triggerKickoffFlash = useCallback((matchId: number) => {
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
  }, [kickoffFlashMatches]);

  // Function to trigger the finish flash effect
  const triggerFinishFlash = useCallback((matchId: number) => {
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
  }, [finishFlashMatches]);

  // Track status changes for kickoff and finish flash effects
  useEffect(() => {
    if (!fixturesByLeague || Object.keys(fixturesByLeague).length === 0) return;

    const currentStatuses = new Map<number, string>();
    const allFixtures = Object.values(fixturesByLeague).flatMap(group => group.fixtures);

    allFixtures.forEach((fixture) => {
      const matchId = fixture.fixture.id;
      const currentStatus = fixture.fixture.status.short;
      const previousStatus = previousMatchStatuses.get(matchId);

      currentStatuses.set(matchId, currentStatus);

      // Check if status just changed from upcoming (NS/TBD) to kickoff (1H)
      if (
        (previousStatus === 'NS' || previousStatus === 'TBD') &&
        currentStatus === '1H'
      ) {
        console.log(`🟡 [KICKOFF DETECTION] Match ${matchId} transitioned from ${previousStatus} to ${currentStatus}`);
        triggerKickoffFlash(matchId);
      }

      // Check if status just changed from live to finished
      if (
        previousStatus &&
        ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT', 'LIVE', 'LIV'].includes(previousStatus) &&
        ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(currentStatus)
      ) {
        console.log(`🔵 [FINISH DETECTION] Match ${matchId} transitioned from ${previousStatus} to ${currentStatus}`);
        triggerFinishFlash(matchId);
      }
    });

    // Update previous statuses for next comparison
    setPreviousMatchStatuses(currentStatuses);
  }, [fixturesByLeague, previousMatchStatuses, triggerKickoffFlash, triggerFinishFlash]);

  if (isLoading) {
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
      </>
    );
  }

  if (error) {
    const isRateLimit = error.message?.toLowerCase().includes('429') || 
                       error.message?.toLowerCase().includes('rate limit') || 
                       error.message?.toLowerCase().includes('too many requests');

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="text-center">
            <div className={isRateLimit ? "text-orange-500" : "text-red-500"}>
              {isRateLimit ? "⚠️ API Rate Limit Reached" : "❌ Error loading leagues"}
            </div>
            <div className="text-xs mt-2 text-gray-600">
              {isRateLimit 
                ? "Too many requests to the API. Please wait a moment and the data will refresh automatically."
                : error.message
              }
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
        <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
          <div className="flex justify-between items-center w-full">
            <span>{currentLeagueId ? "League Fixtures" : "Popular Football Leagues"}</span>
          </div>
        </CardHeader>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="text-center text-gray-500">
              <div>{currentLeagueId ? "No matches found for this league" : "No matches found"}</div>
              <div className="text-xs mt-2">
                Searched {leagueIds.length} league{leagueIds.length > 1 ? 's' : ''}: {leagueIds.join(", ")}
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
      <div className="bg-gray-100 p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Fixtures</h2>
      </div>

      {/* Fixtures List */}
      <div className="bg-white">
        {/* Group all fixtures by date and display them in a simple list */}
        {(() => {
          // Flatten all fixtures and group by date
          const allFixtures = Object.values(fixturesByLeague).flatMap(group => 
            group.fixtures.map(fixture => ({ ...fixture, leagueInfo: group.league }))
          );

          // Group by date
          const fixturesByDate = allFixtures.reduce((acc, fixture) => {
            const fixtureDate = format(new Date(fixture.fixture.date), 'dd/MM/yyyy');
            if (!acc[fixtureDate]) {
              acc[fixtureDate] = [];
            }
            acc[fixtureDate].push(fixture);
            return acc;
          }, {} as Record<string, any[]>);

          return Object.entries(fixturesByDate).map(([date, fixtures]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">{date}</span>
              </div>

              {/* Fixtures for this date */}
              {fixtures.map((fixture: any) => {
                const status = fixture.fixture.status.short;
                const matchTime = new Date(fixture.fixture.date);
                const timeString = matchTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });

                return (
                  <div
                    key={fixture.fixture.id}
                    onClick={() => handleMatchClick(fixture)}
                    className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {/* Home Team */}
                    <div className="flex items-center flex-1 justify-end mr-4">
                      <span className="text-sm font-medium text-gray-900 text-right mr-3 truncate">
                        {shortenTeamName(fixture.teams.home.name)}
                      </span>
                      {fixture.leagueInfo.id === 10 ? (
                        <MyCircularFlag
                          teamName={fixture.teams.home.name || ""}
                          teamId={fixture.teams.home.id}
                          fallbackUrl={
                            fixture.teams.home.id
                              ? `/api/team-logo/square/${fixture.teams.home.id}?size=24`
                              : "/assets/fallback-logo.svg"
                          }
                          alt={fixture.teams.home.name}
                          size="24px"
                        />
                      ) : (
                        <MyWorldTeamLogo
                          teamName={fixture.teams.home.name || ""}
                          teamLogo={
                            fixture.teams.home.id
                              ? `/api/team-logo/square/${fixture.teams.home.id}?size=24`
                              : "/assets/fallback-logo.svg"
                          }
                          alt={fixture.teams.home.name}
                          size="24px"
                          leagueContext={leagueContext}
                        />
                      )}
                    </div>

                    {/* Score/Time */}
                    <div className="mx-4 text-center min-w-[60px]">
                      {["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT", "FT", "AET", "PEN"].includes(status) ? (
                        <div className="text-lg font-bold text-gray-900">
                          {fixture.goals.home ?? 0} - {fixture.goals.away ?? 0}
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-700">
                          {timeString}
                        </div>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center flex-1 ml-4">
                      {fixture.leagueInfo.id === 10 ? (
                        <MyCircularFlag
                          teamName={fixture.teams.away.name || ""}
                          teamId={fixture.teams.away.id}
                          fallbackUrl={
                            fixture.teams.away.id
                              ? `/api/team-logo/square/${fixture.teams.away.id}?size=24`
                              : "/assets/fallback-logo.svg"
                          }
                          alt={fixture.teams.away.name}
                          size="24px"
                        />
                      ) : (
                        <MyWorldTeamLogo
                          teamName={fixture.teams.away.name || ""}
                          teamLogo={
                            fixture.teams.away.id
                              ? `/api/team-logo/square/${fixture.teams.away.id}?size=24`
                              : "/assets/fallback-logo.svg"
                          }
                          alt={fixture.teams.away.name}
                          size="24px"
                          leagueContext={leagueContext}
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900 ml-3 truncate">
                        {shortenTeamName(fixture.teams.away.name)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ));
        })()}
      </div>
    </>
  );
};

export default MyDetailsFixture;