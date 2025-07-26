
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  lazy,
  Suspense,
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
import { formatMatchTimeWithTimezone } from "@/lib/timezoneApiService";
import "../../styles/MyLogoPositioning.css";
import "../../styles/flasheffect.css";

// Lazy load the team logo component for better performance
const LazyTeamLogo = lazy(() =>
  Promise.resolve({
    default: ({
      teamName,
      logoUrl,
      size,
      leagueContext,
    }: {
      teamName: string;
      logoUrl: string;
      size: string;
      leagueContext?: { name: string; country: string };
    }) => (
      <MyWorldTeamLogo
        teamName={teamName}
        teamLogo={logoUrl}
        alt={teamName}
        size={size}
        className="popular-leagues-size"
        leagueContext={leagueContext}
      />
    ),
  }),
);

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

interface MyBasketballLeagueProps {
  selectedDate: string;
  onMatchCardClick?: (fixture: any) => void; // Callback to pass match data to parent
  match?: any; // Current match data (used for sample display)
}

const MyBasketballLeague = ({
  selectedDate,
  onMatchCardClick,
  match,
}: MyBasketballLeagueProps) => {
  // Sample match data for demonstration
  const sampleMatch = {
    fixture: {
      id: 1100311,
      date: "2025-06-11T21:00:00+00:00",
      status: { short: "NS", long: "Not Started" },
      venue: { name: "Madison Square Garden", city: "New York" },
      referee: "Scott Foster",
    },
    league: {
      id: 12,
      name: "NBA",
      country: "USA",
      round: "Regular Season",
    },
    teams: {
      home: {
        id: 1001,
        name: "Lakers",
        logo: "https://media.api-sports.io/basketball/teams/1001.png",
      },
      away: {
        id: 1002,
        name: "Warriors",
        logo: "https://media.api-sports.io/basketball/teams/1002.png",
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

  // Use passed match data or fallback to sample
  const displayMatch = match || sampleMatch;

  // Debug: Log the match data being received
  console.log("🏀 [MyBasketballLeague] Received match data:", {
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

  // Basketball League IDs - popular basketball leagues
  const leagueIds = [
    12, // NBA
    117, // NCAA
    120, // EuroLeague
    121, // EuroCup
    122, // Basketball Champions League
    123, // FIBA Europe Cup
    124, // Turkish Basketball Super League
    125, // Greek Basket League
    126, // Spanish Liga ACB
    127, // Italian Lega Basket Serie A
    128, // French LNB Pro A
    129, // German Basketball Bundesliga
    130, // VTB United League
  ];

  // Fetch fixtures for all basketball leagues
  const {
    data: allFixtures,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["myBasketballLeague", "allFixtures", selectedDate],
    queryFn: async () => {
      console.log(
        `🏀 [MyBasketballLeague] Fetching fixtures for ${leagueIds.length} basketball leagues on ${selectedDate}:`,
        leagueIds,
      );

      const promises = leagueIds.map(async (leagueId) => {
        try {
          const response = await fetch(`/api/basketball/leagues/${leagueId}/fixtures`);
          if (!response.ok) {
            console.log(
              `❌ [MyBasketballLeague] Failed to fetch league ${leagueId}: ${response.status} ${response.statusText}`,
            );
            return { leagueId, fixtures: [], error: `HTTP ${response.status}` };
          }
          const data = await response.json();
          const fixtures = data.response || data || [];
          console.log(
            `✅ [MyBasketballLeague] League ${leagueId}: ${fixtures.length} fixtures`,
          );
          return { leagueId, fixtures, error: null };
        } catch (error) {
          console.error(
            `❌ [MyBasketballLeague] Error fetching league ${leagueId}:`,
            error,
          );
          return { leagueId, fixtures: [], error: error.message };
        }
      });

      const results = await Promise.all(promises);
      
      // Deduplicate at the fetch level
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
      console.log(`🔄 [MyBasketballLeague] Fetch results:`, {
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
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Group fixtures by league with date filtering
  const fixturesByLeague = useMemo(() => {
    console.log(
      `🔍 [MyBasketballLeague] Processing fixtures for date ${selectedDate}:`,
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
      console.log(`❌ [MyBasketballLeague] No fixtures available`);
      return {};
    }

    const grouped: { [key: number]: { league: any; fixtures: FixtureData[] } } =
      {};
    const seenFixtures = new Set<number>();
    const seenMatchups = new Set<string>();

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
          `⚠️ [MyBasketballLeague] Invalid fixture at index ${index}:`,
          fixture,
        );
        return;
      }

      // Check for duplicate fixture IDs
      if (seenFixtures.has(fixture.fixture.id)) {
        console.log(
          `🔄 [MyBasketballLeague] Duplicate fixture ID detected and skipped:`,
          {
            fixtureId: fixture.fixture.id,
            teams: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
            league: fixture.league.name,
          },
        );
        return;
      }

      // Create unique matchup key
      const matchupKey = `${fixture.teams.home.id}-${fixture.teams.away.id}-${fixture.league.id}-${fixture.fixture.date}`;
      
      // Check for duplicate team matchups
      if (seenMatchups.has(matchupKey)) {
        console.log(
          `🔄 [MyBasketballLeague] Duplicate matchup detected and skipped:`,
          {
            fixtureId: fixture.fixture.id,
            teams: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
            league: fixture.league.name,
            matchupKey,
          },
        );
        return;
      }

      // Apply date filtering
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
        `✅ [MyBasketballLeague] Added fixture:`,
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

        // Define status priorities for basketball
        const getStatusPriority = (status: string) => {
          // Priority 1: Live matches
          if (
            ["LIVE", "LIV", "Q1", "Q2", "Q3", "Q4", "OT", "BT", "HT"].includes(
              status,
            )
          ) {
            return 1;
          }
          // Priority 2: Upcoming matches
          if (["NS", "TBD"].includes(status)) {
            return 2;
          }
          // Priority 3: Ended matches
          if (
            ["FT", "AOT", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(
              status,
            )
          ) {
            return 3;
          }
          return 4;
        };

        const aPriority = getStatusPriority(aStatus);
        const bPriority = getStatusPriority(bStatus);

        // Primary sort: by status priority
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        // Secondary sort: within same status category
        if (aPriority === 1) {
          // Live matches: sort by elapsed time
          const aElapsed = Number(a.fixture.status.elapsed) || 0;
          const bElapsed = Number(b.fixture.status.elapsed) || 0;
          if (aElapsed !== bElapsed) {
            return aElapsed - bElapsed;
          }
          return aDate - bDate;
        }

        if (aPriority === 2) {
          // Upcoming matches: sort by earliest start time first
          return aDate - bDate;
        }

        if (aPriority === 3) {
          // Ended matches: sort by most recent end time first
          return bDate - aDate;
        }

        return aDate - bDate;
      });
    });

    const groupedKeys = Object.keys(grouped);
    const totalValidFixtures = Object.values(grouped).reduce(
      (sum, group) => sum + group.fixtures.length,
      0,
    );

    console.log(
      `✅ [MyBasketballLeague] Date filtered fixtures for ${selectedDate}:`,
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
  }, [Object.keys(fixturesByLeague).length]);

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
    console.log("🏀 [MyBasketballLeague] Match card clicked:", {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      status: fixture.fixture?.status?.short,
      source: "MyBasketballLeague",
    });

    // Call the callback to pass match data to parent component
    if (onMatchCardClick) {
      onMatchCardClick(fixture);
    }
  };

  // Lazy loading team logo component with skeleton fallback
  const TeamLogo = ({
    teamName,
    logoUrl,
    size,
    leagueContext,
  }: {
    teamName: string;
    logoUrl: string;
    size: string;
    leagueContext?: { name: string; country: string };
  }) => (
    <Suspense fallback={<Skeleton className={`h-8 w-8 rounded`} />}>
      <LazyTeamLogo
        teamName={teamName}
        logoUrl={logoUrl}
        size={size}
        leagueContext={leagueContext}
      />
    </Suspense>
  );

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
                        {/* Empty for overtime results */}
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
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="text-center text-red-500">
            <div>Error loading basketball leagues</div>
            <div className="text-xs mt-2">{error.message}</div>
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
            <span>Popular Basketball Leagues</span>
          </div>
        </CardHeader>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="text-center text-gray-500">
              <div>No basketball matches found</div>
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
          <span>Popular Basketball Leagues</span>
        </div>
      </CardHeader>

      {/* Individual League Cards */}
      {leagueEntries
        .sort(([aId], [bId]) => {
          // Define priority order for basketball leagues
          const priorityOrder = [
            12, // NBA
            117, // NCAA
            120, // EuroLeague
            121, // EuroCup
            122, // Basketball Champions League
            124, // Turkish Basketball Super League
            125, // Greek Basket League
          ];

          const aIndex = priorityOrder.indexOf(Number(aId));
          const bIndex = priorityOrder.indexOf(Number(bId));

          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }

          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;

          return 0;
        })
        .map(([leagueId, { league, fixtures }]) => {
          const leagueIdNum = Number(leagueId);
          const isExpanded = expandedLeagues.has(`league-${leagueIdNum}`);

          return (
            <Card
              key={`mybasketballleague-${leagueIdNum}`}
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
                        ? "text-orange-500 fill-orange-500"
                        : "text-orange-300"
                    }`}
                  />
                </button>

                <img
                  src={league.logo || "/assets/fallback-logo.svg"}
                  alt={league.name || "Unknown League"}
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
                      {safeSubstring(league.name, 0) || "Unknown League"}
                    </span>

                    {(() => {
                      const liveMatchesInLeague = fixtures.filter(
                        (match: any) => {
                          const status = match.fixture.status.short;
                          const isActuallyFinished = [
                            "FT",
                            "AOT",
                            "AWD",
                            "WO",
                            "ABD",
                            "CANC",
                            "SUSP",
                          ].includes(status);
                          const isLiveStatus = [
                            "LIVE",
                            "Q1",
                            "Q2",
                            "Q3",
                            "Q4",
                            "OT",
                            "BT",
                            "HT",
                          ].includes(status);

                          // Check if match is stale (more than 4 hours old)
                          const matchDate = new Date(match.fixture.date);
                          const hoursOld =
                            (Date.now() - matchDate.getTime()) /
                            (1000 * 60 * 60);
                          const isStale = hoursOld > 4;

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
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* Matches - Show when league is expanded */}
              {isExpanded && (
                <div className="match-cards-wrapper">
                  {fixtures.map((fixture: FixtureData) => {
                    const matchId = fixture.fixture.id;
                    const isStarred = starredMatches.has(matchId);
                    const leagueContext = {
                      name: league.name,
                      country: league.country,
                    };

                    return (
                      <div key={matchId} className="country-matches-container">
                        <div
                          className="match-card-container group"
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
                                  (["FT", "AOT"].includes(status) &&
                                    hoursOld > 4) ||
                                  ([
                                    "FT",
                                    "AOT",
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
                                      "Q1",
                                      "Q2",
                                      "Q3",
                                      "Q4",
                                      "OT",
                                      "BT",
                                      "HT",
                                    ].includes(status));

                                // Show live status for basketball matches
                                if (
                                  ![
                                    "FT",
                                    "AOT",
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
                                    "Q1",
                                    "Q2",
                                    "Q3",
                                    "Q4",
                                    "OT",
                                    "BT",
                                    "HT",
                                  ].includes(status)
                                ) {
                                  let displayText = "";
                                  let statusClass = "status-live-elapsed";

                                  if (status === "HT") {
                                    displayText = "Halftime";
                                    statusClass = "status-halftime";
                                  } else if (status === "OT") {
                                    displayText = "Overtime";
                                  } else if (status === "BT") {
                                    displayText = "Break Time";
                                  } else if (["Q1", "Q2", "Q3", "Q4"].includes(status)) {
                                    displayText = status;
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

                                // Check for overdue matches
                                if (status === "NS" || status === "TBD") {
                                  const matchTime = new Date(
                                    fixture.fixture.date,
                                  );
                                  const now = new Date();
                                  const hoursAgo =
                                    (now.getTime() - matchTime.getTime()) /
                                    (1000 * 60 * 60);

                                  if (hoursAgo > 2) {
                                    return (
                                      <div className="match-status-label status-postponed">
                                        Postponed
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
                                }

                                // Show "Ended" status for finished matches
                                if (
                                  [
                                    "FT",
                                    "AOT",
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
                                        : status === "AOT"
                                          ? "After Overtime"
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
                                  ["FT", "AOT"].includes(
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
                                <TeamLogo
                                  teamName={fixture.teams.home.name}
                                  logoUrl={
                                    fixture.teams.home.id
                                      ? `/api/basketball/team-logo/square/${fixture.teams.home.id}?size=32`
                                      : "/assets/fallback-logo.svg"
                                  }
                                  size="34px"
                                  leagueContext={leagueContext}
                                />
                              </div>

                              {/* Score/Time Center */}
                              <div className="match-score-container">
                                {(() => {
                                  const status = fixture.fixture.status.short;

                                  // Live matches - show current score
                                  if (
                                    [
                                      "LIVE",
                                      "Q1",
                                      "Q2",
                                      "Q3",
                                      "Q4",
                                      "OT",
                                      "BT",
                                      "HT",
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
                                      "AOT",
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

                                  // For upcoming matches - show kick-off time
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

                                    // For postponed/cancelled matches
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

                                    // Check if match should have started already
                                    const now = new Date();
                                    const hoursAgo =
                                      (now.getTime() - matchTime.getTime()) /
                                      (1000 * 60 * 60);

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

                                  // Fallback
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
                                <TeamLogo
                                  teamName={fixture.teams.away.name}
                                  logoUrl={
                                    fixture.teams.away.id
                                      ? `/api/basketball/team-logo/square/${fixture.teams.away.id}?size=32`
                                      : "/assets/fallback-logo.svg"
                                  }
                                  size="34px"
                                  leagueContext={leagueContext}
                                />
                              </div>

                              {/* Away Team Name */}
                              <div
                                className={`away-team-name ${
                                  fixture.goals.home !== null &&
                                  fixture.goals.away !== null &&
                                  fixture.goals.away > fixture.goals.home &&
                                  ["FT", "AOT"].includes(
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

                            {/* Bottom Grid: Overtime Result Status */}
                            <div className="match-penalty-bottom">
                              {(() => {
                                const isOvertimeMatch =
                                  fixture.fixture.status.short === "AOT";

                                if (isOvertimeMatch) {
                                  const winnerText =
                                    fixture.goals.home > fixture.goals.away
                                      ? `${shortenTeamName(fixture.teams.home.name)} won in overtime`
                                      : `${shortenTeamName(fixture.teams.away.name)} won in overtime`;

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

export default MyBasketballLeague;
