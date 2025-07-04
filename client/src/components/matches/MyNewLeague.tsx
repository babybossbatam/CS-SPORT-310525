import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Star, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid } from "date-fns";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
import "../../styles/MyLogoPositioning.css";
import "../../styles/flasheffect.css";
import { useQuery } from '@tanstack/react-query';
import { FixtureResponse } from '@/types/fixtures';
import { isLiveMatch, isEndedMatch, isUpcomingMatch } from '@/lib/matchFilters';
import { sortMatchesByKickoffTime } from '@/lib/dateUtilsUpdated';
import { isToday } from 'date-fns';
import { smartFetch, fetchLeagueFixtures } from '@/lib/MyFetchingLogic';

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
  const leagueIds = [38, 15, 71, 22, 72, 73, 75, 128, 667]; // Added Brazilian Serie A (71), CONCACAF Gold Cup (22), Serie B (72), Serie C (73), Serie D (75), Copa Argentina (128) before Friendlies Clubs

  // Memoize the data fetching function to prevent unnecessary re-renders
  const fetchLeagueData = useCallback(async (isUpdate = false) => {
    if (!isUpdate) {
      setLoading(true);
      setError(null);
    }

    try {
      const allFixtures: FixtureData[] = [];
      let primaryLeagueInfo: LeagueData | null = null;

      // First, fetch live fixtures for real-time data
      try {
        console.log(`MyNewLeague - Fetching live fixtures for real-time data`);
        const liveResponse = await apiRequest("GET", "/api/fixtures/live");
        const liveData = await liveResponse.json();

        if (Array.isArray(liveData)) {
          // Filter live fixtures to only include our target leagues
          const relevantLiveFixtures = liveData.filter(fixture => 
            leagueIds.includes(fixture.league?.id)
          );

          console.log(`MyNewLeague - Found ${relevantLiveFixtures.length} live fixtures from target leagues`);
          allFixtures.push(...relevantLiveFixtures);
        }
      } catch (liveError) {
        console.warn("Failed to fetch live fixtures:", liveError);
      }

      // Then fetch cached data from individual leagues for non-live matches
      for (const leagueId of leagueIds) {
        try {
          console.log(`MyNewLeague - Fetching cached data for league ${leagueId}`);

          // Fetch league info only on initial load
          if (!isUpdate) {
            const leagueResponse = await apiRequest(
              "GET",
              `/api/leagues/${leagueId}`,
            );
            const leagueData = await leagueResponse.json();
            console.log(`MyNewLeague - League ${leagueId} info:`, leagueData);

            if (!primaryLeagueInfo) {
              primaryLeagueInfo = leagueData;
            }
          }

          // Fetch fixtures for the league
          const fixturesResponse = await apiRequest(
            "GET",
            `/api/leagues/${leagueId}/fixtures`,
          );

          if (!fixturesResponse.ok) {
            console.warn(`Failed to fetch fixtures for league ${leagueId}, status: ${fixturesResponse.status}`);
            continue; // Skip this league and try the next one
          }

          const fixturesData = await fixturesResponse.json();
          console.log(
            `MyNewLeague - League ${leagueId} fixtures count:`,
            fixturesData?.length || 0,
          );

          if (Array.isArray(fixturesData)) {
            // Filter out fixtures that are already in live data to avoid duplicates
            const liveFixtureIds = new Set(allFixtures.map(f => f.fixture.id));
            const nonLiveFixtures = fixturesData.filter(fixture => 
              !liveFixtureIds.has(fixture.fixture.id)
            );

            console.log(`MyNewLeague - Processing ${nonLiveFixtures.length} non-live fixtures for league ${leagueId}`);

            nonLiveFixtures.forEach((fixture, index) => {
              if (index < 5) { // Only log first 5 to avoid spam
                console.log(`MyNewLeague - Fixture ${fixture.fixture.id}:`, {
                  teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
                  league: fixture.league?.name,
                  status: fixture.fixture?.status?.short,
                  date: fixture.fixture?.date,
                });
              }
            });

            allFixtures.push(...nonLiveFixtures);
          }
        } catch (leagueError) {
          const errorMessage = leagueError instanceof Error ? leagueError.message : 'Unknown error';
          console.warn(
            `Failed to fetch data for league ${leagueId}:`,
            errorMessage,
          );

          // If it's a network error, don't spam the console
          if (errorMessage.includes('Network error') || errorMessage.includes('Failed to fetch')) {
            console.log(`🌐 Network connectivity issue for league ${leagueId}, will retry later`);
          }
        }
      }

      if (!isUpdate && primaryLeagueInfo) {
        setLeagueInfo(primaryLeagueInfo);
      }

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
  }, []);

  useEffect(() => {
    fetchLeagueData(false);

    // Set up periodic refresh for live match updates with reduced re-renders
    const interval = setInterval(() => {
      fetchLeagueData(true); // Pass true to indicate this is an update
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchLeagueData]);



  // Debug logging
  console.log("MyNewLeague - All fixtures:", fixtures.length);

  // Enhanced debugging for Friendlies Clubs
  const friendliesFixtures = fixtures.filter(f => f.league.id === 667);
  console.log("🏆 [MyNewLeague FRIENDLIES] Total Friendlies fixtures:", friendliesFixtures.length);

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

  // Filter matches to show matches for the selected date
  const selectedDateFixtures = fixtures.filter((f) => {
    const matchDate = new Date(f.fixture.date);
    // Extract just the date part for comparison (YYYY-MM-DD format)
    const year = matchDate.getFullYear();
    const month = String(matchDate.getMonth() + 1).padStart(2, "0");
    const day = String(matchDate.getDate()).padStart(2, "0");
    const matchDateString = `${year}-${month}-${day}`;
    const dateMatches = matchDateString === selectedDate;

    // Debug for Friendlies Clubs specifically
    if (f.league.id === 667 && !dateMatches) {
      console.log(`🏆 [FRIENDLIES DATE FILTER] Excluded match: ${f.teams.home.name} vs ${f.teams.away.name}`, {
        fixtureDate: f.fixture.date,
        matchDateString,
        selectedDate,
        reason: 'Date mismatch'
      });
    }

    return dateMatches;
  });

  // Log filtering results for Friendlies
  const friendliesFiltered = selectedDateFixtures.filter(f => f.league.id === 667);
  console.log(`🏆 [MyNewLeague FRIENDLIES] After date filtering: ${friendliesFiltered.length} matches for ${selectedDate}`);

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

  // Sort matches within each league by status priority: live > ended > upcoming
  Object.values(matchesByLeague).forEach((leagueGroup) => {
    // Check if there are any live matches in this league
    const hasLiveMatches = leagueGroup.matches.some(match => 
      ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(match.fixture.status.short)
    );

    leagueGroup.matches.sort((a, b) => {
      // First sort by status priority
      const statusPriority = (status: string) => {
        const isLive = ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(status);
        const isEnded = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status);
        const isUpcoming = ["NS", "TBD"].includes(status);

        if (isLive) return 1; // Live matches always first

        // If no live matches exist, ended matches get priority 1, otherwise priority 2
        if (isEnded) return hasLiveMatches ? 2 : 1;

        // Upcoming matches get lowest priority
        if (isUpcoming) return hasLiveMatches ? 3 : 2;

        return 4; // Other statuses last
      };

      const aPriority = statusPriority(a.fixture.status.short);
      const bPriority = statusPriority(b.fixture.status.short);

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Within same status category, sort by date in ascending order (earliest first)
      return (
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
      );
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

  // Memoized match card component to prevent unnecessary re-renders
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
  });

  // Enhanced effect to detect status and score changes with flash effects - matches LiveMatchForAllCountry implementation
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
        console.log(`🔄 [MyNewLeague STATUS TRANSITION] Match ${matchId}:`, {
          teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          transition: `${previousStatus} → ${currentStatus}`,
          time: new Date().toLocaleTimeString()
        });

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

        // Check for goal changes (when score changes but status stays the same)
        if (['1H', '2H', 'LIVE'].includes(currentStatus) && ['1H', '2H', 'LIVE'].includes(previousStatus)) {
          // You could add goal flash detection here if needed
          console.log(`⚽ [MyNewLeague POTENTIAL GOAL] Match ${matchId} score might have changed`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            score: `${fixture.goals?.home || 0}-${fixture.goals?.away || 0}`,
            status: currentStatus
          });
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
          status: currentStatus
        });
        newGoalMatches.add(matchId);
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
  }, [fixtures]);

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

  if (totalMatches === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No matches available for this date</p>
        </CardContent>
      </Card>
    );
  }

  const { data: allFixtures = [], isLoading, error: queryError } = useQuery({
    queryKey: ['smart-fetch-fixtures', selectedDate],
    queryFn: async () => {
      // Use smart fetch for intelligent caching and live match handling
      return await smartFetch(selectedDate, {
        source: 'MyNewLeague',
        forceRefresh: isToday(new Date(selectedDate)) // Force refresh for today's matches
      });
    },
    staleTime: isToday(new Date(selectedDate)) ? 1 * 60 * 1000 : 5 * 60 * 1000, // 1 min for today, 5 min for other dates
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: isToday(new Date(selectedDate)), // Only refetch on focus for today
    retry: 1,
  });

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
          const priorityOrder = [38, 15, 71, 22, 72, 73, 75, 128, 667]; // UEFA U21, FIFA Club World Cup, Serie A, CONCACAF Gold Cup, Serie B, Serie C, Serie D, Copa Argentina, Friendlies Clubs

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
                .sort((a: any, b: any) => {
                  const now = new Date();
                  const aDate = parseISO(a.fixture.date);
                  const bDate = parseISO(b.fixture.date);
                  const aStatus = a.fixture.status.short;
                  const bStatus = b.fixture.status.short;

                  if (!isValid(aDate) || !isValid(bDate)) {
                    return 0;
                  }

                  const aTime = aDate.getTime();
                  const bTime = bDate.getTime();
                  const nowTime = now.getTime();

                  // Live matches first
                  const aLive = [
                    "LIVE",
                    "LIV",
                    "1H",
                    "HT",
                    "2H",
                    "ET",
                    "BT",
                    "P",
                    "INT",
                  ].includes(aStatus);
                  const bLive = [
                    "LIVE",

"LIV",
                    "1H",
                    "HT",
                    "2H",
                    "ET",
                    "BT",
                    "P",
                    "INT",
                  ].includes(bStatus);

                  if (aLive && !bLive) return -1;
                  if (!aLive && bLive) return 1;

                  // Then by time proximity
                  const aDistance = Math.abs(aTime - nowTime);
                  const bDistance = Math.abs(bTime - nowTime);
                  return aDistance - bDistance;
                })
                .map((match: any) => {
                  const matchId = match.fixture.id;
                  const isHalftimeFlash = halftimeFlashMatches.has(matchId);
                  const isFulltimeFlash = fulltimeFlashMatches.has(matchId);
                  const isGoalFlash = goalFlashMatches.has(matchId);
                  const isStarred = starredMatches.has(matchId)
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
              className={`match-star-icon ${starredMatches.has(match.fixture.id) ? "starred" : ""}`}
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