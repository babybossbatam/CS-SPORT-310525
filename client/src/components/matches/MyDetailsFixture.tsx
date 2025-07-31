
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
}

const MyDetailsFixture = ({
  selectedDate,
  onMatchCardClick,
  match,
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

  // League IDs without any filtering - removed duplicates
  const leagueIds = [
    38, 15, 2, 4, 10, 11, 848, 886, 71, 3, 5, 531, 22, 72, 73, 75, 76, 233, 667,
    940, 908, 1169, 23, 1077, 253, 850, 893, 921, 130, 128, 493, 239, 265, 237,
    235, 743,
  ];

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
            <span>Popular Football Leagues</span>
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
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        <div className="flex justify-between items-center w-full">
          <span>Popular Football Leagues</span>
        </div>
      </CardHeader>

      {/* Individual League Cards */}
      {leagueEntries
        .sort(([aId], [bId]) => {
          // Define priority order - same as MyNewLeague
          const priorityOrder = [
            38, 15, 2, 5, 22, 10, 11, 71, 72, 667, 3, 848, 73, 75, 239, 233,
            253,
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
              key={`mydetailsfixture-${leagueIdNum}`}
              className="border bg-card text-card-foreground shadow-md overflow-hidden league-card-spacing"
            >
              {/* League Header - Clickable and collapsible */}
              <button
                onClick={() => toggleLeague(leagueIdNum)}
                className="w-full flex items-center gap-2 p-2 bg-white border-b border-gray-200 transition-colors cursor-pointer group hover:bg-gray-50"
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
                  src={league.logo || `/api/league-logo/${leagueIdNum}` || "/assets/fallback-logo.svg"}
                  alt={league.name || "Unknown League"}
                  className="w-6 h-6 object-contain rounded-full"
                  style={{ backgroundColor: "transparent" }}
                  loading="lazy"
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
                    {league.country || "Unknown Country"}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                </div>
              </button>

              {/* Matches - Show when league is expanded */}
              {isExpanded && (
                <div className="match-cards-wrapper">
                  {fixtures.map((fixture: FixtureData) => {
                    const matchId = fixture.fixture.id;
                    const isHalftimeFlash = halftimeFlashMatches.has(matchId);
                    const isFulltimeFlash = fulltimeFlashMatches.has(matchId);
                    const isGoalFlash = goalFlashMatches.has(matchId);
                    const isKickoffFlash = kickoffFlashMatches.has(matchId);
                    const isFinishFlash = finishFlashMatches.has(matchId);
                    const isStarred = starredMatches.has(matchId);

                    return (
                      <div key={matchId} className="country-matches-container">
                        <div
                          className={`match-card-container group ${
                            isHalftimeFlash ? 'halftime-flash' : ''
                          }${
                            isFulltimeFlash ? 'fulltime-flash' : ''
                          } ${
                            isGoalFlash ? 'goal-flash' : ''
                          } ${
                            isKickoffFlash ? 'kickoff-flash' : ''
                          } ${
                            isFinishFlash ? 'finish-flash' : ''
                          }`}
                          data-fixture-id={matchId}
                          onClick={() => handleMatchClick(fixture)}
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
                                  penaltyHome !== undefined &&
                                  penaltyAway !== null &&
                                  penaltyAway !== undefined;

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

export default MyDetailsFixture;
