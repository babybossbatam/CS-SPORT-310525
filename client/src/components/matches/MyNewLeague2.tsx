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

interface MyNewLeague2Props {
  selectedDate: string;
  timeFilterActive?: boolean;
  showTop10?: boolean;
  liveFilterActive?: boolean;
  onMatchCardClick?: (fixture: any | null) => void; // Callback to pass match data to parent (for MyMatchdetailsScoreboard)
  match?: any; // Current match data (used for sample display)
  useUTCOnly?: boolean;
}

const MyNewLeague2 = ({
  selectedDate,
  onMatchCardClick,
  match,
}: MyNewLeague2Props) => {
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

  // Priority leagues for fast initial loading (top 3)
  const priorityLeagueIds = [38, 15, 2]; // Premier League, Champions League, Bundesliga
  // Remaining leagues for secondary loading
  const remainingLeagueIds = [
    4, 10, 11, 848, 886, 1022, 772, 71, 3, 5, 531, 22, 72, 73, 75,
    76, 233, 667, 940, 908, 1169, 23, 1077, 253, 850, 893, 921, 130, 128, 493,
    239, 265, 237, 235, 743,
  ];

  // State for managing priority vs full loading
  const [showingPriorityOnly, setShowingPriorityOnly] = useState(true);
  const [priorityFixtures, setPriorityFixtures] = useState<FixtureData[]>([]);
  const [remainingFixtures, setRemainingFixtures] = useState<FixtureData[]>([]);
  const [showAllLeagues, setShowAllLeagues] = useState(false); // State to control showing all leagues

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

  // Helper function to check if the fixture date matches the selected date
  const isDateMatch = (fixtureDate: string, selectedDate: string): boolean => {
    const date = new Date(fixtureDate);
    const dateString = format(date, "yyyy-MM-dd");
    return dateString === selectedDate;
  };

  // Function to simulate API requests (replace with actual fetch)
  const apiRequest = async <T,>(url: string): Promise<T> => {
    // In a real app, this would be a fetch or axios call
    // For this example, we'll simulate a delayed response
    await delay(200); // Simulate network latency
    // Mock API response - replace with your actual API call
    // Example: fetch(url).then(res => res.json())
    // For now, returning empty array or specific mock data as needed for testing
    return [] as T; // Placeholder
  };

  // Get cached ended matches with strict date validation
  const getCachedEndedMatches = useCallback(
    (date: string, leagueId: number): FixtureData[] => {
      try {
        const cacheKey = `ended_matches_${date}_${leagueId}`;
        const cached = localStorage.getItem(cacheKey);

        if (!cached) return [];

        const { fixtures, timestamp, cachedDate } = JSON.parse(cached);

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

        if (cacheAge < maxCacheAge) {
          // Additional validation: check if fixtures actually match the date
          const validFixtures = fixtures.filter((fixture: any) => {
            const fixtureDate = new Date(fixture.fixture.date);
            const fixtureDateString = fixtureDate.toISOString().slice(0, 10);
            return fixtureDateString === date;
          });

          if (validFixtures.length !== fixtures.length) {
            console.log(
              `🚨 [MyNewLeague2] Found ${fixtures.length - validFixtures.length} fixtures with wrong dates in cache, clearing`,
            );
            localStorage.removeItem(cacheKey);
            return [];
          }

          console.log(
            `✅ [MyNewLeague2] Using cached ended matches for league ${leagueId} on ${date}: ${validFixtures.length} matches`,
          );
          return validFixtures;
        } else {
          // Remove expired cache
          localStorage.removeItem(cacheKey);
          console.log(
            `⏰ [MyNewLeague2] Removed expired cache for league ${leagueId} on ${date} (age: ${Math.round(cacheAge / 60000)}min)`,
          );
        }
      } catch (error) {
        console.error("Error reading cached ended matches:", error);
        // Clear corrupted cache
        const cacheKey = `ended_matches_${date}_${leagueId}`;
        localStorage.removeItem(cacheKey);
      }

      return [];
    },
    [],
  );

  // Cache ended matches
  const cacheEndedMatches = useCallback(
    (date: string, leagueId: number, fixtures: FixtureData[]) => {
      try {
        const endedFixtures = fixtures.filter(isMatchOldEnded);

        if (endedFixtures.length === 0) return;

        const cacheKey = `ended_matches_${date}_${leagueId}`;
        const cacheData = {
          fixtures: endedFixtures,
          timestamp: Date.now(),
          date,
          leagueId,
        };

        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log(
          `💾 [MyNewLeague2] Cached ${endedFixtures.length} ended matches for league ${leagueId} on ${date}`,
        );
      } catch (error) {
        console.error("Error caching ended matches:", error);
      }
    },
    [isMatchOldEnded],
  );

  // Load all leagues to find first 3 with matches
  const { data: allFixtures, isLoading } = useQuery<FixtureData[]>({
    queryKey: [`/api/leagues/all-fixtures`, selectedDate],
    queryFn: async () => {
      console.log(`🚀 [MyNewLeague2] Loading all leagues to find first 3 with matches on ${selectedDate}`);

      const allLeagueIds = [...priorityLeagueIds, ...remainingLeagueIds];

      const results = await Promise.allSettled(
        allLeagueIds.map(async (leagueId) => {
          try {
            const fixtures = await apiRequest<FixtureData[]>(`/api/leagues/${leagueId}/fixtures`);
            const validFixtures = fixtures.filter((fixture: FixtureData) =>
              fixture?.fixture?.date && isDateMatch(fixture.fixture.date, selectedDate)
            );
            console.log(`✅ [MyNewLeague2] League ${leagueId}: ${validFixtures.length} fixtures`);
            return { leagueId, fixtures: validFixtures };
          } catch (error) {
            console.error(`❌ [MyNewLeague2] Failed to load league ${leagueId}:`, error);
            return { leagueId, fixtures: [] };
          }
        })
      );

      const allFixturesMap = new Map<number, FixtureData>();

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          result.value.fixtures.forEach((fixture: FixtureData) => {
            if (fixture?.fixture?.id) {
              if (!allFixturesMap.has(fixture.fixture.id) || !isMatchOldEnded(fixture)) {
                allFixturesMap.set(fixture.fixture.id, fixture);
              }
            }
          });
        }
      });

      const fixtures = Array.from(allFixturesMap.values());
      console.log(`🚀 [MyNewLeague2] All leagues loaded: ${fixtures.length} fixtures`);

      return fixtures;
    },
    staleTime: 10 * 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: false,
  });

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
    if (fixture === null) {
      // Clear selection when null is passed (from close button)
      console.log("🎯 [MyNewLeague2] Clearing selected match");
      setSelectedMatchId(null);

      // Remove selected-match CSS class from all match containers as backup
      const selectedMatches = document.querySelectorAll(".selected-match");
      selectedMatches.forEach((match) => {
        match.classList.remove("selected-match");
      });

      // Also call the callback to notify parent component
      if (onMatchCardClick) {
        onMatchCardClick(null);
      }
      return;
    }

    const matchId = fixture.fixture?.id;

    console.log("🎯 [MyNewLeague2] Match card clicked:", {
      fixtureId: matchId,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      status: fixture.fixture?.status?.short,
      source: "MyNewLeague2",
      currentlySelected: selectedMatchId,
    });

    // Remove disable-hover class from all match containers to allow re-selection
    const allMatchContainers = document.querySelectorAll(".match-card-container");
    allMatchContainers.forEach((container) => {
      container.classList.remove("disable-hover");
    });

    // Set this match as selected
    setSelectedMatchId(matchId);

    // Call the callback to pass match data to parent component first (like MyNewLeague does)
    if (onMatchCardClick) {
      onMatchCardClick(fixture);
    }

    // Don't navigate automatically - let parent handle it if needed
    // navigate(`/match/${fixture.fixture.id}`);
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
        {[1, 2, 3].map((i) => ( // Display only 3 skeleton cards initially
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
            <span className="text-sm font-semibold">Popular Football Leagues</span>
          </div>
        </CardHeader>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="text-center text-gray-500">
              <div>No matches found</div>
              <div className="text-xs mt-2">
                Searched {priorityLeagueIds.length + remainingLeagueIds.length} leagues: {[...priorityLeagueIds, ...remainingLeagueIds].join(", ")}
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
          <span className="text-sm font-semibold">Popular Football Leagues</span>
        </div>
      </CardHeader>

      {/* Individual League Cards */}
      {leagueEntries
        .sort(([aId, aData], [bId, bData]) => {
          // Sort to show first 3 leagues with matches first, regardless of league priority
          const aHasMatches = aData.length > 0;
          const bHasMatches = bData.length > 0;

          // If both have matches or both don't have matches, maintain some order
          if (aHasMatches === bHasMatches) {
            // Use the existing priority order as secondary sort
            const priorityOrder = [
              38, 15, 2, 5, 22, 10, 11, 1022, 772, 71, 72, 667, 3, 848, 73, 75,
              239, 233, 253,
            ];

            const aIndex = priorityOrder.indexOf(aId);
            const bIndex = priorityOrder.indexOf(bId);

            if (aIndex !== -1 && bIndex !== -1) {
              return aIndex - bIndex;
            }
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return aId - bId;
          }

          // Leagues with matches come first
          return bHasMatches ? 1 : -1;
        })
        .slice(0, showAllLeagues ? leagueEntries.length : 3) // Show only first 3 cards initially for fast loading
        .map(([leagueId, { league, fixtures }], index) => {
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
                          onClick={() => handleMatchClick(fixture)}
                          onMouseEnter={() => {
                            const container = document.querySelector(`[data-fixture-id="${matchId}"]`);
                            if (!container?.classList.contains("disable-hover") && selectedMatchId !== matchId) {
                              setHoveredMatchId(matchId);
                            }
                          }}
                          onMouseLeave={() => {
                            const container = document.querySelector(`[data-fixture-id="${matchId}"]`);
                            if (!container?.classList.contains("disable-hover") && selectedMatchId !== matchId) {
                              setHoveredMatchId(null);
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
                            title="Add to favorites"
                            onMouseEnter={(e) => {
                              const container = e.currentTarget.closest(".match-card-container");
                              container?.classList.add("disable-hover");
                              setHoveredMatchId(null);
                            }}
                            onMouseLeave={(e) => {
                              const container = e.currentTarget.closest(".match-card-container");
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

      {/* Show More Button */}
      {leagueEntries.length > 3 && !showAllLeagues && (
        <div className="text-center mt-4">
          <button
            onClick={() => setShowAllLeagues(true)}
            className="text-blue-600 hover:underline text-sm font-semibold"
          >
            Show More Leagues
          </button>
        </div>
      )}
    </>
  );
};

export default MyNewLeague2;