
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Star, Calendar } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
import { formatMatchTimeWithTimezone } from "@/lib/timezoneApiService";
import { useSelectiveMatchUpdate } from "@/lib/selectiveMatchUpdates";
import "../../styles/MyLogoPositioning.css";
import "../../styles/flasheffect.css";

interface MySpecificLeaguesProps {
  selectedDate: string;
  onMatchCardClick: (fixture: any) => void;
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

const MySpecificLeagues: React.FC<MySpecificLeaguesProps> = ({
  selectedDate,
  onMatchCardClick,
}) => {
  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());

  // Only target leagues 2 (UEFA Champions League) and 667 (Friendlies Clubs)
  const targetLeagueIds = [2, 667];

  const fetchSpecificLeagues = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`🎯 [MySpecificLeagues] Fetching matches for leagues 2 and 667 on ${selectedDate}`);

      // Fetch all fixtures for the selected date
      const response = await apiRequest("GET", `/api/fixtures/date/${selectedDate}?all=true`);
      const allFixtures = await response.json();

      console.log(`📊 [MySpecificLeagues] Total fixtures for ${selectedDate}: ${allFixtures.length}`);

      // Filter for only leagues 2 and 667
      const targetFixtures = allFixtures.filter((fixture: FixtureData) => 
        targetLeagueIds.includes(fixture.league?.id)
      );

      console.log(`🎯 [MySpecificLeagues] Found ${targetFixtures.length} matches for target leagues:`, {
        league2Count: targetFixtures.filter(f => f.league.id === 2).length,
        league667Count: targetFixtures.filter(f => f.league.id === 667).length,
      });

      // Log details for each target league
      targetLeagueIds.forEach(leagueId => {
        const leagueFixtures = targetFixtures.filter(f => f.league.id === leagueId);
        if (leagueFixtures.length > 0) {
          console.log(`🏆 [MySpecificLeagues] League ${leagueId} matches:`, 
            leagueFixtures.map(f => ({
              id: f.fixture.id,
              teams: `${f.teams.home.name} vs ${f.teams.away.name}`,
              status: f.fixture.status.short,
              time: f.fixture.date,
            }))
          );
        } else {
          console.log(`❌ [MySpecificLeagues] No matches found for league ${leagueId} on ${selectedDate}`);
        }
      });

      setFixtures(targetFixtures);
    } catch (err) {
      console.error("❌ [MySpecificLeagues] Error fetching matches:", err);
      setError("Failed to load matches");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchSpecificLeagues();
  }, [fetchSpecificLeagues]);

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
    (match: FixtureData) => {
      console.log("🎯 [MySpecificLeagues] Match card clicked:", {
        fixtureId: match.fixture?.id,
        teams: `${match.teams?.home?.name} vs ${match.teams?.away?.name}`,
        league: match.league?.name,
        status: match.fixture?.status?.short,
      });
      if (onMatchCardClick) {
        onMatchCardClick(match);
      }
    },
    [onMatchCardClick],
  );

  const MatchCard = ({ match }: { match: FixtureData }) => {
    const matchId = match.fixture.id;
    const currentStatus = match.fixture.status.short;
    const isStarred = starredMatches.has(matchId);

    // Use selective updates for live matches
    const mightNeedUpdates = [
      "LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT", "FT", "AET", "PEN",
    ].includes(currentStatus);

    const matchState = mightNeedUpdates
      ? useSelectiveMatchUpdate(matchId, match)
      : { goals: match.goals, status: match.fixture.status };

    const currentGoals = matchState.goals || match.goals;
    const displayStatus = matchState.status?.short || currentStatus;

    return (
      <div key={matchId} className="country-matches-container">
        <div
          className="match-card-container group"
          data-fixture-id={matchId}
          onClick={() => handleMatchCardClick(match)}
          style={{ cursor: "pointer" }}
        >
          {/* Star Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStarMatch(matchId);
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
                const elapsed = matchState.status?.elapsed || match.fixture.status.elapsed;

                if (["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(displayStatus)) {
                  if (displayStatus === "HT") {
                    return <div className="match-status-label status-halftime">Halftime</div>;
                  } else if (displayStatus === "P") {
                    return <div className="match-status-label status-live-elapsed">Penalties</div>;
                  } else if (displayStatus === "ET") {
                    const extraTime = elapsed ? elapsed - 90 : 0;
                    return (
                      <div className="match-status-label status-live-elapsed">
                        {extraTime > 0 ? `90' + ${extraTime}'` : `${elapsed}'`}
                      </div>
                    );
                  } else {
                    return (
                      <div className="match-status-label status-live-elapsed">
                        {elapsed ? `${elapsed}'` : "LIVE"}
                      </div>
                    );
                  }
                }

                if (["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(displayStatus)) {
                  return <div className="match-status-label status-ended">Ended</div>;
                }

                if (displayStatus === "TBD") {
                  return <div className="match-status-label status-upcoming">Time TBD</div>;
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
                  ["FT", "AET", "PEN"].includes(displayStatus)
                    ? "winner"
                    : ""
                }`}
                style={{ textAlign: "right" }}
              >
                {shortenTeamName(match.teams.home.name) || "Unknown Team"}
              </div>

              {/* Home team logo */}
              <div className="home-team-logo-container" style={{ padding: "0 0.6rem" }}>
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
                  leagueContext={{ name: match.league.name, country: match.league.country }}
                />
              </div>

              {/* Score/Time Center */}
              <div className="match-score-container">
                {(() => {
                  if (["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT", "FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(displayStatus)) {
                    return (
                      <div className="match-score-display">
                        <span className="score-number">{currentGoals.home ?? 0}</span>
                        <span className="score-separator">-</span>
                        <span className="score-number">{currentGoals.away ?? 0}</span>
                      </div>
                    );
                  }

                  // Upcoming matches - show kick-off time
                  return (
                    <div className="match-time-display" style={{ fontSize: "0.882em" }}>
                      {displayStatus === "TBD" ? "TBD" : formatMatchTimeWithTimezone(match.fixture.date)}
                    </div>
                  );
                })()}
              </div>

              {/* Away team logo */}
              <div className="away-team-logo-container" style={{ padding: "0 0.5rem" }}>
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
                  leagueContext={{ name: match.league.name, country: match.league.country }}
                />
              </div>

              {/* Away Team Name */}
              <div
                className={`away-team-name ${
                  currentGoals.home !== null &&
                  currentGoals.away !== null &&
                  currentGoals.away > currentGoals.home &&
                  ["FT", "AET", "PEN"].includes(displayStatus)
                    ? "winner"
                    : ""
                }`}
                style={{ paddingLeft: "0.75rem", textAlign: "left" }}
              >
                {shortenTeamName(match.teams.away.name) || "Unknown Team"}
              </div>
            </div>

            {/* Bottom Grid: Penalty results if applicable */}
            <div className="match-penalty-bottom">
              {(() => {
                const isPenaltyMatch = displayStatus === "PEN";
                const penaltyHome = match.score?.penalty?.home;
                const penaltyAway = match.score?.penalty?.away;
                const hasPenaltyScores = penaltyHome !== null && penaltyAway !== null;

                if (isPenaltyMatch && hasPenaltyScores) {
                  const winnerText =
                    penaltyHome > penaltyAway
                      ? `${shortenTeamName(match.teams.home.name)} won ${penaltyHome}-${penaltyAway} on penalties`
                      : `${shortenTeamName(match.teams.away.name)} won ${penaltyAway}-${penaltyHome} on penalties`;

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

  if (loading) {
    return (
      <>
        <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
          <div className="flex justify-between items-center w-full">
            <span>UEFA Champions League & Friendlies Clubs</span>
          </div>
        </CardHeader>
        
        {[1, 2].map((i) => (
          <Card key={i} className="border bg-card text-card-foreground shadow-md overflow-hidden league-card-spacing">
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
                      <div className="match-status-top" style={{ minHeight: "20px" }}>
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

  // Group fixtures by league
  const fixturesByLeague = fixtures.reduce((acc, fixture) => {
    const leagueId = fixture.league.id;
    if (!acc[leagueId]) {
      acc[leagueId] = {
        league: fixture.league,
        matches: [],
      };
    }
    acc[leagueId].matches.push(fixture);
    return acc;
  }, {} as Record<number, { league: any; matches: FixtureData[] }>);

  // Sort matches within each league by status priority
  Object.values(fixturesByLeague).forEach((leagueGroup) => {
    leagueGroup.matches.sort((a, b) => {
      const aStatus = a.fixture.status.short;
      const bStatus = b.fixture.status.short;
      const aDate = new Date(a.fixture.date).getTime();
      const bDate = new Date(b.fixture.date).getTime();

      const getStatusPriority = (status: string) => {
        if (["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) return 1;
        if (["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status)) return 2;
        if (["NS", "TBD"].includes(status)) return 3;
        return 4;
      };

      const aPriority = getStatusPriority(aStatus);
      const bPriority = getStatusPriority(bStatus);

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      if (aPriority === 1) {
        const aElapsed = Number(a.fixture.status.elapsed) || 0;
        const bElapsed = Number(b.fixture.status.elapsed) || 0;
        if (aElapsed !== bElapsed) return aElapsed - bElapsed;
        return aDate - bDate;
      }

      if (aPriority === 2) return bDate - aDate;
      if (aPriority === 3) return aDate - bDate;
      return aDate - bDate;
    });
  });

  const totalMatches = fixtures.length;

  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        <div className="flex justify-between items-center w-full">
          <span>UEFA Champions League & Friendlies Clubs</span>
          <span className="text-sm text-gray-600">{totalMatches} matches</span>
        </div>
      </CardHeader>

      {/* Show message if no matches found */}
      {totalMatches === 0 && (
        <Card className="border bg-card text-card-foreground shadow-md overflow-hidden">
          <CardContent className="p-6 text-center">
            <div className="text-gray-500">
              No matches found for UEFA Champions League (ID: 2) and Friendlies Clubs (ID: 667) on {selectedDate}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Try selecting a different date or check back later for updates.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Render matches by league */}
      {Object.entries(fixturesByLeague)
        .sort(([a], [b]) => {
          // Prioritize UEFA Champions League (2) over Friendlies Clubs (667)
          if (a === "2") return -1;
          if (b === "2") return 1;
          return 0;
        })
        .map(([leagueId, leagueGroup]) => (
          <Card
            key={`specific-league-${leagueId}`}
            className="border bg-card text-card-foreground shadow-md overflow-hidden league-card-spacing"
          >
            {/* League Header */}
            <div className="w-full flex items-center gap-2 p-2 bg-white border-b border-gray-200">
              <button
                onClick={() => toggleStarMatch(parseInt(leagueId))}
                className="transition-colors"
                title={`${starredMatches.has(parseInt(leagueId)) ? "Remove from" : "Add to"} favorites`}
              >
                <Star
                  className={`h-5 w-5 transition-all ${
                    starredMatches.has(parseInt(leagueId))
                      ? "text-green-500 fill-green-500"
                      : "text-green-300"
                  }`}
                />
              </button>

              <img
                src={leagueGroup.league.logo || "/assets/fallback-logo.svg"}
                alt={leagueGroup.league.name || "Unknown League"}
                className="w-6 h-6 object-contain rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/assets/fallback-logo.svg";
                }}
              />
              
              <div className="flex flex-col flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800" style={{ fontSize: "13.3px" }}>
                    {leagueGroup.league.name || "Unknown League"}
                  </span>
                  
                  {(() => {
                    const liveMatches = leagueGroup.matches.filter((match) => {
                      const status = match.fixture.status.short;
                      return ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status);
                    }).length;

                    if (liveMatches > 0) {
                      return (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                          {liveMatches} LIVE
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <span className="text-xs text-gray-600" style={{ fontSize: "12px" }}>
                  {leagueGroup.league.country || "Unknown Country"}
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                {leagueGroup.matches.length} matches
              </div>
            </div>

            {/* Matches */}
            <div className="match-cards-wrapper">
              {leagueGroup.matches.map((match) => (
                <MatchCard key={match.fixture.id} match={match} />
              ))}
            </div>
          </Card>
        ))}
    </>
  );
};

export default MySpecificLeagues;
