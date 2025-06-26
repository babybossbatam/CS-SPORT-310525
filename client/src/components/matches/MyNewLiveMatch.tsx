
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Star, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid } from "date-fns";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
import "../../styles/MyLogoPositioning.css";
import "../../styles/flasheffect.css";

interface MyNewLiveMatchProps {
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

const MyNewLiveMatch: React.FC<MyNewLiveMatchProps> = ({
  liveFilterActive,
  onMatchCardClick,
  useUTCOnly = true,
}) => {
  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());

  // Flash animation states
  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(new Set());
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(new Set());
  const [goalFlashMatches, setGoalFlashMatches] = useState<Set<number>>(new Set());

  // Status and score tracking for flash effects
  const [previousMatchStatuses, setPreviousMatchStatuses] = useState<Map<number, string>>(new Map());
  const [previousMatchScores, setPreviousMatchScores] = useState<Map<number, {home: number, away: number}>>(new Map());

  // Using specific league IDs for live matches (UEFA U21 and FIFA Club World Cup)
  const leagueIds = [38, 15];

  // Background refresh function for live data
  const backgroundRefreshLiveData = useCallback(async () => {
    if (!liveFilterActive) return;

    try {
      console.log("🔄 [MyNewLiveMatch] Background refresh for live matches");
      
      // Fetch live fixtures from the live endpoint
      try {
        const liveResponse = await apiRequest("GET", `/api/fixtures/live?_t=${Date.now()}`);
        const liveFixtures = await liveResponse.json();
        
        if (Array.isArray(liveFixtures) && liveFixtures.length > 0) {
          console.log(`🔴 [MyNewLiveMatch] Found ${liveFixtures.length} live fixtures from live endpoint`);
          
          // Filter live fixtures for our target leagues
          const relevantLiveFixtures = liveFixtures.filter(fixture => 
            leagueIds.includes(fixture.league?.id) &&
            ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(fixture.fixture?.status?.short)
          );
          
          if (relevantLiveFixtures.length > 0) {
            console.log(`✅ [MyNewLiveMatch] Found ${relevantLiveFixtures.length} relevant live fixtures`);
            setFixtures(relevantLiveFixtures);
            return;
          }
        }
      } catch (liveError) {
        console.warn("❌ [MyNewLiveMatch] Live endpoint failed:", liveError);
      }

      // If no live fixtures found, clear the list
      setFixtures([]);
    } catch (err) {
      console.error("❌ [MyNewLiveMatch] Background refresh error:", err);
    }
  }, [liveFilterActive, leagueIds]);

  // Initial data fetch when live filter becomes active
  useEffect(() => {
    const fetchLiveData = async () => {
      if (!liveFilterActive) {
        setFixtures([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`MyNewLiveMatch - Fetching live data for leagues: ${leagueIds.join(', ')}`);

        // Fetch live fixtures
        const liveResponse = await apiRequest("GET", `/api/fixtures/live`);
        const liveFixtures = await liveResponse.json();

        if (Array.isArray(liveFixtures)) {
          // Filter for our target leagues and live status
          const filteredFixtures = liveFixtures.filter((fixture) => {
            const isTargetLeague = leagueIds.includes(fixture.league?.id);
            const isLive = ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(fixture.fixture?.status?.short);
            
            console.log(`MyNewLiveMatch - Fixture ${fixture.fixture.id}:`, {
              teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
              league: fixture.league?.name,
              leagueId: fixture.league?.id,
              status: fixture.fixture?.status?.short,
              isTargetLeague,
              isLive,
              included: isTargetLeague && isLive
            });

            return isTargetLeague && isLive;
          });

          console.log(`MyNewLiveMatch - Filtered ${liveFixtures.length} fixtures to ${filteredFixtures.length} live matches`);
          setFixtures(filteredFixtures);
        } else {
          setFixtures([]);
        }
      } catch (err) {
        console.error("Error fetching live data:", err);
        setError("Failed to load live matches");
        setFixtures([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveData();
  }, [liveFilterActive, leagueIds]);

  // Background refresh interval for live matches
  useEffect(() => {
    if (!liveFilterActive) return;

    const hasLiveMatches = fixtures.some(fixture => 
      ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(fixture.fixture.status.short)
    );
    
    let interval: NodeJS.Timeout;
    
    if (hasLiveMatches || liveFilterActive) {
      // Frequent updates for live matches (every 30 seconds)
      console.log("🔴 [MyNewLiveMatch] Setting up frequent refresh (30s)");
      interval = setInterval(() => {
        backgroundRefreshLiveData();
      }, 30000);
      
      // Immediate refresh
      backgroundRefreshLiveData();
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [backgroundRefreshLiveData, fixtures, liveFilterActive]);

  // Group matches by league ID
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

  // Sort matches within each league by status priority: live > halftime > other live statuses
  Object.values(matchesByLeague).forEach((leagueGroup) => {
    leagueGroup.matches.sort((a, b) => {
      const statusPriority = (status: string) => {
        if (["LIVE", "1H", "2H"].includes(status)) return 1; // Active play
        if (status === "HT") return 2; // Halftime
        if (["ET", "BT", "P", "INT"].includes(status)) return 3; // Other live statuses
        return 4; // Other
      };

      const aPriority = statusPriority(a.fixture.status.short);
      const bPriority = statusPriority(b.fixture.status.short);

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Within same status category, sort by elapsed time (descending for live matches)
      const aElapsed = a.fixture.status.elapsed || 0;
      const bElapsed = b.fixture.status.elapsed || 0;
      return bElapsed - aElapsed;
    });
  });

  const totalMatches = Object.values(matchesByLeague).reduce(
    (sum, group) => sum + group.matches.length,
    0,
  );

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

  // Enhanced effect to detect status and score changes with flash effects
  useEffect(() => {
    if (!fixtures?.length) return;

    const newHalftimeMatches = new Set<number>();
    const newFulltimeMatches = new Set<number>();
    const newGoalMatches = new Set<number>();
    const currentStatuses = new Map<number, string>();
    const currentScores = new Map<number, {home: number, away: number}>();

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
        // Check if status just changed to halftime
        if (currentStatus === 'HT') {
          console.log(`🟠 [HALFTIME FLASH] Match ${matchId} just went to halftime!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousStatus,
            currentStatus
          });
          newHalftimeMatches.add(matchId);
        }

        // Check if status just changed to fulltime
        if (currentStatus === 'FT') {
          console.log(`🔵 [FULLTIME FLASH] Match ${matchId} just finished!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousStatus,
            currentStatus
          });
          newFulltimeMatches.add(matchId);
        }
      }

      // Check for goal changes
      if (previousScore && 
          (currentScore.home !== previousScore.home || currentScore.away !== previousScore.away)) {
        console.log(`⚽ [GOAL FLASH] Match ${matchId} score changed!`, {
          home: fixture.teams?.home?.name,
          away: fixture.teams?.away?.name,
          previousScore,
          currentScore
        });
        newGoalMatches.add(matchId);
      }
    });

    // Update previous statuses and scores for next comparison
    setPreviousMatchStatuses(currentStatuses);
    setPreviousMatchScores(currentScores);

    // Trigger flash for new halftime matches
    if (newHalftimeMatches.size > 0) {
      setHalftimeFlashMatches(newHalftimeMatches);
      setTimeout(() => {
        setHalftimeFlashMatches(new Set());
      }, 3000);
    }

    // Trigger flash for new fulltime matches
    if (newFulltimeMatches.size > 0) {
      setFulltimeFlashMatches(newFulltimeMatches);
      setTimeout(() => {
        setFulltimeFlashMatches(new Set());
      }, 3000);
    }

    // Trigger flash for new goal matches
    if (newGoalMatches.size > 0) {
      setGoalFlashMatches(newGoalMatches);
      setTimeout(() => {
        setGoalFlashMatches(new Set());
      }, 2000);
    }
  }, [fixtures, backgroundRefreshLiveData]);

  // Don't render anything if live filter is not active
  if (!liveFilterActive) {
    return null;
  }

  if (loading) {
    return (
      <Card className="mt-4">
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
      <Card className="mt-4">
        <CardContent className="p-6 text-center">
          <div className="text-center py-4 text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (totalMatches === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No live matches available right now</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          Featured Live Matches
        </div>
      </CardHeader>

      {/* Create individual league cards - prioritize league 38 first, then 15 */}
      {Object.values(matchesByLeague)
        .sort((a, b) => {
          // League 38 (UEFA U21) first priority
          if (a.league.id === 38 && b.league.id !== 38) return -1;
          if (a.league.id !== 38 && b.league.id === 38) return 1;

          // League 15 (FIFA Club World Cup) second priority
          if (a.league.id === 15 && b.league.id !== 15) return -1;
          if (a.league.id !== 15 && b.league.id === 15) return 1;

          // For other leagues, maintain original order
          return 0;
        })
        .map((leagueGroup) => {
        return (
          <Card
            key={`mynewlivematch-${leagueGroup.league.id}`}
            className="border bg-card text-card-foreground shadow-md overflow-hidden league-card-spacing mt-4"
          >
            {/* League Header */}
            <CardContent className="flex items-center gap-2 p-2 bg-white border-b border-gray-200">
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
              <div className="flex flex-col flex-1">
                <span
                  className="font-semibold text-gray-800"
                  style={{
                    fontFamily:
                      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: "13.3px",
                  }}
                >
                  {safeSubstring(leagueGroup.league.name, 0) ||
                    "Unknown League"}
                </span>
                <span
                  className="text-gray-600"
                  style={{
                    fontFamily:
                      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: "13.3px",
                  }}
                >
                  {leagueGroup.league.country || "Unknown Country"}
                </span>
              </div>
              <div className="flex gap-1">
                <span
                  className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium"
                  style={{ fontSize: "calc(0.75rem * 0.85)" }}
                >
                  LIVE • {leagueGroup.matches.length} Match
                  {leagueGroup.matches.length !== 1 ? "es" : ""}
                </span>
              </div>
            </CardContent>

            {/* Live Matches */}
            <div className="match-cards-wrapper">
              {leagueGroup.matches.map((match: any) => {
                const matchId = match.fixture.id;
                const isHalftimeFlash = halftimeFlashMatches.has(matchId);
                const isFulltimeFlash = fulltimeFlashMatches.has(matchId);
                const isGoalFlash = goalFlashMatches.has(matchId);

                return (
                  <div
                    key={match.fixture.id}
                    className={`match-card-container group ${
                      isHalftimeFlash ? 'halftime-flash' : 
                      isFulltimeFlash ? 'fulltime-flash' :
                      isGoalFlash ? 'goal-flash' : ''
                    }`}
                    data-match-id={match.fixture.id}
                    onClick={() => onMatchCardClick?.(match)}
                    style={{
                      cursor: onMatchCardClick ? "pointer" : "default",
                    }}
                  >
                    {/* Star Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStarMatch(match.fixture.id);
                      }}
                      className="match-star-button"
                      title="Add to favorites"
                      onMouseEnter={() => {
                        const container = document.querySelector(`[data-match-id="${match.fixture.id}"]`);
                        if (container) container.classList.add('disable-hover');
                      }}
                      onMouseLeave={() => {
                        const container = document.querySelector(`[data-match-id="${match.fixture.id}"]`);
                        if (container) container.classList.remove('disable-hover');
                      }}
                    >
                      <Star
                        className={`match-star-icon ${
                          starredMatches.has(match.fixture.id) ? "starred" : ""
                        }`}
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
                          {shortenTeamName(match.teams.home.name) ||
                            "Unknown Team"}
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

                        {/* Score Center */}
                        <div className="match-score-container">
                          <div className="match-score-display">
                            <span className="score-number">
                              {match.goals.home ?? 0}
                            </span>
                            <span className="score-separator">-</span>
                            <span className="score-number">
                              {match.goals.away ?? 0}
                            </span>
                          </div>
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
                          {shortenTeamName(match.teams.away.name) ||
                            "Unknown Team"}
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
                );
              })}
            </div>
          </Card>
        );
      })}
    </>
  );
};

export default MyNewLiveMatch;
