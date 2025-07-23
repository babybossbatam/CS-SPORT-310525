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
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
import { formatMatchTimeWithTimezone } from "@/lib/timezoneApiService";
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

interface MyNewLeague2Props {
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

const MyNewLeague2: React.FC<MyNewLeague2Props> = ({
  selectedDate,
  timeFilterActive,
  showTop10,
  liveFilterActive,
  onMatchCardClick,
  useUTCOnly = true,
}) => {
  const [leagueFixtures, setLeagueFixtures] = useState<
    Map<number, FixtureData[]>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(
    new Set(),
  );

  // Flash animation states
  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(
    new Set(),
  );
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(
    new Set(),
  );
  const [goalFlashMatches, setGoalFlashMatches] = useState<Set<number>>(
    new Set(),
  );

  // Status and score tracking for flash effects
  const previousMatchStatusesRef = useRef<Map<number, string>>(new Map());
  const previousMatchScoresRef = useRef<
    Map<number, { home: number; away: number }>
  >(new Map());

  // Specific league IDs we want to show: 667 (Club Friendlies), 2 (UEFA Champions League), and 886 (UEFA Champions League Qualifiers)
  const leagueIds = [667, 2, 886];

  useEffect(() => {
    const fetchSpecificLeagueFixtures = async () => {
      if (!selectedDate) return;

      try {
        setIsLoading(true);
        setError(null);
        setLoading(true);

        console.log(`🎯 [MyNewLeague2] Fetching data for leagues 667 and 2 on ${selectedDate}`);

        // Set a timeout to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
          console.log(`⏰ [MyNewLeague2] Loading timeout reached for ${selectedDate} - clearing loading state`);
          setIsLoading(false);
          setLoading(false);
        }, 10000);

        // Fetch fixtures for the selected date
        const response = await fetch(`/api/fixtures/date/${selectedDate}?all=true`);
        if (!response.ok) {
          throw new Error(`Failed to fetch fixtures for ${selectedDate}`);
        }

        const allDateFixtures = await response.json();
        console.log(`📊 [MyNewLeague2] Got ${allDateFixtures.length} total fixtures for ${selectedDate}`);

        // Filter for our specific leagues (667, 2, and 886)
        const leagueFixturesMap = new Map();

        allDateFixtures.forEach((fixture: FixtureData) => {
          const leagueId = fixture.league?.id;
          if (leagueIds.includes(leagueId)) {
            // Log detailed filtering for all target leagues
            if (leagueIds.includes(leagueId)) {
              const leagueNames = {
                667: 'Club Friendlies',
                2: 'UEFA Champions League',
                886: 'UEFA CL Qualifiers',
                908: 'UEFA EL Qualifiers',
                848: 'UEFA Conference League',
                3: 'UEFA Europa League'
              };

              console.log(
                `🔍 [MyNewLeague2] Filtering ${leagueNames[leagueId] || 'Unknown'} (${leagueId}) fixture:`,
                {
                  fixtureId: fixture.fixture.id,
                  teams: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                  originalDate: fixture.fixture.date,
                  fixtureUTCDate,
                  selectedDate,
                  round: fixture.league.round,
                  status: fixture.fixture.status.short,
                  utcMatches: fixtureUTCDate === selectedDate,
                  willInclude: fixtureUTCDate === selectedDate,
                },
              );
            }
            // Simple UTC date filtering
            const fixtureUTCDate = fixture.fixture?.date?.substring(0, 10);

            console.log(`🔍 [MyNewLeague2] Filtering league ${leagueId} fixture:`, {
              fixtureId: fixture.fixture.id,
              teams: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
              originalDate: fixture.fixture.date,
              fixtureUTCDate,
              selectedDate,
              utcMatches: fixtureUTCDate === selectedDate,
              willInclude: fixtureUTCDate === selectedDate,
            });

            // Include only if UTC date matches selected date
            if (fixtureUTCDate === selectedDate) {
              if (!leagueFixturesMap.has(leagueId)) {
                leagueFixturesMap.set(leagueId, []);
              }
              leagueFixturesMap.get(leagueId).push(fixture);
            }
          }
        });

        // Convert to the expected format
        const newLeagueFixtures = new Map();
        leagueIds.forEach((leagueId) => {
          const fixtures = leagueFixturesMap.get(leagueId) || [];
          console.log(`✅ [MyNewLeague2] League ${leagueId}: Found ${fixtures.length} fixtures for ${selectedDate}`);
          newLeagueFixtures.set(leagueId, fixtures);
        });

        setLeagueFixtures(newLeagueFixtures);
        clearTimeout(loadingTimeout);

      } catch (error) {
        console.error("❌ [MyNewLeague2] Error fetching league fixtures:", error);
        setError("Failed to load matches for leagues 667 and 2");
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    };

    fetchSpecificLeagueFixtures();
  }, [selectedDate, showTop10, liveFilterActive]);

  // Group matches by league
  const matchesByLeague = useMemo(() => {
    const combined: Record<number, { league: any; matches: FixtureData[] }> = {};

    leagueFixtures.forEach((fixtures, leagueId) => {
      if (fixtures && fixtures.length > 0) {
        combined[leagueId] = {
          league: fixtures[0].league,
          matches: fixtures
        };
      }
    });

    console.log(`📊 [MyNewLeague2] Combined matches:`, {
      totalLeagues: Object.keys(combined).length,
      totalMatches: Object.values(combined).reduce(
        (sum, group) => sum + group.matches.length,
        0,
      ),
      selectedDate,
      hasLeague667: !!combined[667],
      league667Matches: combined[667]?.matches.length || 0,
      hasLeague2: !!combined[2],
      league2Matches: combined[2]?.matches.length || 0,
    });

    return combined;
  }, [leagueFixtures]);

  // Auto-expand all leagues by default when data changes
  useEffect(() => {
    const leagueKeys = Object.keys(matchesByLeague).map(
      (leagueId: string) => `league-${leagueId}`,
    );
    setExpandedLeagues(new Set(leagueKeys));
  }, [Object.keys(matchesByLeague).length]);

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

  const handleMatchCardClick = useCallback(
    (match: any) => {
      console.log("🎯 [MyNewLeague2] Match card clicked:", {
        fixtureId: match.fixture?.id,
        teams: `${match.teams?.home?.name} vs ${match.teams?.away?.name}`,
        league: match.league?.name,
        status: match.fixture?.status?.short,
        source: "MyNewLeague2",
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

  // MatchCard component
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
    leagueContext,
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
    leagueContext: { name: string; country: string };
  }) => {
    // Use selective updates for live matches
    const currentStatus = initialMatch.fixture.status.short;
    const mightNeedUpdates = [
      "LIVE",
      "LIV",
      "1H",
      "HT",
      "2H",
      "ET",
      "BT",
      "P",
      "INT",
      "FT",
      "AET",
      "PEN",
    ].includes(currentStatus);

    const matchState = mightNeedUpdates
      ? useSelectiveMatchUpdate(matchId, initialMatch)
      : { goals: initialMatch.goals, status: initialMatch.fixture.status };

    const updatedStatus = matchState.status?.short || currentStatus;
    const isActuallyFinished = [
      "FT",
      "AET",
      "PEN",
      "AWD",
      "WO",
      "ABD",
      "CANC",
      "SUSP",
    ].includes(updatedStatus);

    const isLiveMatch =
      !isActuallyFinished &&
      ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
        updatedStatus,
      );

    const currentGoals =
      matchState.goals &&
      (matchState.goals.home !== null || matchState.goals.away !== null)
        ? matchState.goals
        : initialMatch.goals;

    const currentMatchStatus = updatedStatus;
    const currentStatusObj = matchState.status || initialMatch.fixture.status;

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
                const status = currentMatchStatus;
                const elapsed = currentStatusObj.elapsed;

                // Check if match finished more than 4 hours ago
                const matchDateTime = new Date(matchDate);
                const hoursOld =
                  (Date.now() - matchDateTime.getTime()) / (1000 * 60 * 60);
                const isStaleFinishedMatch = hoursOld > 4 && [
                  "FT",
                  "AET",
                  "PEN",
                  "AWD",
                  "WO",
                  "ABD",
                  "CANC",
                  "SUSP",
                ].includes(status);

                // Show live status
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
                    <div className={`match-status-label ${statusClass}`}>
                      {displayText}
                    </div>
                  );
                }

                // Show "Ended" status for finished matches
                if (isActuallyFinished || isStaleFinishedMatch) {
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
                      "90",
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
                    const matchTime = new Date(matchDate);
                    const now = new Date();
                    const hoursAgo =
                      (now.getTime() - matchTime.getTime()) / (1000 * 60 * 60);

                    if (hoursAgo > 2) {
                      return (
                        <div
                          className="match-time-display text-orange-600"
                          style={{ fontSize: "0.8em" }}
                        >
                          Postponed
                        </div>
                      );
                    }

                    const utcTime = matchTime.toISOString().substring(11, 16);

                    return (
                      <div
                        className="match-time-display"
                        style={{ fontSize: "0.882em" }}
                      >
                        {status === "TBD" ? "TBD" : utcTime}
                      </div>
                    );
                  }

                  // Fallback
                  if (
                    currentGoals.home !== null ||
                    currentGoals.away !== null
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
                const isPenaltyMatch = currentMatchStatus === "PEN";
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

  // Show loading skeleton
  if (loading || isLoading) {
    return (
      <>
        {/* Header Section Skeleton */}
        <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
          <div className="flex justify-between items-center w-full">
            <Skeleton className="h-5 w-64" />
          </div>
        </CardHeader>

        {/* League Cards Skeleton */}
        {[1, 2].map((i) => (
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
            </div>
            <div className="match-cards-wrapper">
              {[1, 2].map((j) => (
                <div key={j} className="country-matches-container">
                  <div className="match-card-container">
                    <div className="match-three-grid-container">
                      <div className="match-status-top">
                        <Skeleton className="h-4 w-16 rounded" />
                      </div>
                      <div className="match-content-container">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-4 w-24" />
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
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-center py-4 text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total matches
  const totalMatches = Object.values(matchesByLeague).reduce(
    (sum, group) => sum + group.matches.length,
    0,
  );

  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 font-semibold">
        <div className="flex justify-between items-center w-full">
          <span className="text-green-800">Specific Leagues: Club Friendlies (667), UEFA Champions League (2) & UEFA CL Qualifiers (886)</span>
          <span className="text-green-600 text-sm">{totalMatches} matches</span>
        </div>
      </CardHeader>

      {/* Render league matches */}
      {Object.values(matchesByLeague)
        .sort((a, b) => {
          // Prioritize UEFA Champions League (2), then UEFA CL Qualifiers (886), then Club Friendlies (667)
          if (a.league.id === 2) return -1;
          if (b.league.id === 2) return 1;
          if (a.league.id === 886) return -1;
          if (b.league.id === 886) return 1;
          return 0;
        })
        .map((leagueGroup) => {
          return (
            <Card
              key={`mynewleague2-${leagueGroup.league.id}`}
              className="border bg-card text-card-foreground shadow-md overflow-hidden league-card-spacing"
            >
              {/* League Header */}
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
                    {leagueGroup.league.country || "Unknown Country"}
                  </span>
                </div>
              </button>

              {/* Matches - Show when league is expanded */}
              {expandedLeagues.has(`league-${leagueGroup.league.id}`) && (
                <div className="match-cards-wrapper">
                  {leagueGroup.matches.map((match: any) => {
                    const matchId = match.fixture.id;
                    const isHalftimeFlash = halftimeFlashMatches.has(matchId);
                    const isFulltimeFlash = fulltimeFlashMatches.has(matchId);
                    const isGoalFlash = goalFlashMatches.has(matchId);
                    const isStarred = starredMatches.has(matchId);
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
                          const fullMatch = leagueGroup.matches.find(
                            (m: any) => m.fixture.id === matchId,
                          );
                          if (fullMatch) {
                            handleMatchCardClick(fullMatch);
                          }
                        }}
                        leagueContext={leagueContext}
                      />
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}

      {totalMatches === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-center py-4 text-gray-500">
              No matches found for Club Friendlies (667), UEFA Champions League (2), and UEFA CL Qualifiers (886) on {selectedDate}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default MyNewLeague2;