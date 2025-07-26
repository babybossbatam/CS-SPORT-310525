
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Clock, Calendar, Star } from "lucide-react";
import { parseISO, isValid, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
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

interface TodayMatchByTimeProps {
  selectedDate: string;
  timeFilterActive: boolean;
  liveFilterActive: boolean;
  onMatchCardClick?: (fixture: any) => void;
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  timeFilterActive,
  liveFilterActive,
  onMatchCardClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());

  // League IDs to fetch data from
  const leagueIds = [
    38, 15, 2, 10, 11, 848, 886, 71, 3, 5, 531, 22, 72, 73, 75, 76, 233, 667,
    531, 940, 908, 1169, 23, 1077, 253, 850, 893, 921, 130, 128, 493, 239, 265,
    237, 235, 743,
  ];

  // Fetch fixtures for all leagues
  const {
    data: allFixtures,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["todayMatchByTime", "allFixtures", selectedDate],
    queryFn: async () => {
      console.log(
        `🎯 [TodayMatchByTime] Fetching fixtures for ${leagueIds.length} leagues for date ${selectedDate}:`,
        leagueIds,
      );

      const promises = leagueIds.map(async (leagueId) => {
        try {
          const response = await fetch(`/api/leagues/${leagueId}/fixtures`);
          if (!response.ok) {
            console.log(
              `❌ [TodayMatchByTime] Failed to fetch league ${leagueId}: ${response.status} ${response.statusText}`,
            );
            return [];
          }
          const data = await response.json();
          return data.response || data || [];
        } catch (error) {
          console.error(
            `❌ [TodayMatchByTime] Error fetching league ${leagueId}:`,
            error,
          );
          return [];
        }
      });

      const results = await Promise.all(promises);
      const allFixtures = results.flatMap((fixtures) => fixtures);

      console.log(`🔄 [TodayMatchByTime] Total fixtures fetched: ${allFixtures.length}`);
      return allFixtures;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000,
    enabled: timeFilterActive,
  });

  // Process and sort fixtures by kick-off time
  const sortedFixtures = useMemo(() => {
    if (!allFixtures?.length) {
      return [];
    }

    // Filter fixtures for the selected date and sort by kick-off time
    const filteredFixtures = allFixtures.filter((fixture: FixtureData) => {
      if (!fixture?.league || !fixture?.teams || !fixture?.fixture?.date) {
        return false;
      }

      // Apply date filtering
      const fixtureDate = new Date(fixture.fixture.date);
      const fixtureDateString = format(fixtureDate, "yyyy-MM-dd");
      return fixtureDateString === selectedDate;
    });

    // Sort by kick-off time (nearest to farthest)
    const sorted = filteredFixtures.sort((a, b) => {
      const aTime = new Date(a.fixture.date).getTime();
      const bTime = new Date(b.fixture.date).getTime();
      const now = Date.now();

      // Calculate distance from current time
      const aDistance = Math.abs(aTime - now);
      const bDistance = Math.abs(bTime - now);

      return aDistance - bDistance;
    });

    console.log(`✅ [TodayMatchByTime] Sorted ${sorted.length} fixtures by kick-off time for ${selectedDate}`);
    return sorted;
  }, [allFixtures, selectedDate]);

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

  const handleMatchClick = (fixture: FixtureData) => {
    console.log("🎯 [TodayMatchByTime] Match card clicked:", {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      status: fixture.fixture?.status?.short,
    });

    if (onMatchCardClick) {
      onMatchCardClick(fixture);
    }
  };

  if (!timeFilterActive) return null;

  if (isLoading) {
    return (
      <Card className="mt-4 overflow-hidden">
        <CardHeader className="cursor-pointer flex items-center justify-between p-3 bg-white border-b">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-gray-800">Matches by Time</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="country-matches-container">
              <div className="match-card-container">
                <div className="match-three-grid-container">
                  <div className="match-status-top" style={{ minHeight: "20px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                  <div className="match-content-container">
                    <div className="home-team-name" style={{ textAlign: "right" }}>
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="home-team-logo-container" style={{ padding: "0 0.6rem" }}>
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                    <div className="match-score-container">
                      <Skeleton className="h-6 w-12" />
                    </div>
                    <div className="away-team-logo-container" style={{ padding: "0 0.5rem" }}>
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                    <div className="away-team-name" style={{ textAlign: "left" }}>
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-4 overflow-hidden">
        <CardHeader className="cursor-pointer flex items-center justify-between p-3 bg-white border-b">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-gray-800">Matches by Time</span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-red-500">
            <div>Error loading matches</div>
            <div className="text-xs mt-2">{error.message}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 overflow-hidden">
      <CardHeader 
        className="cursor-pointer flex items-center justify-between p-3 bg-white border-b"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="font-semibold text-gray-800">Matches by Time ({sortedFixtures.length})</span>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          {sortedFixtures.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div>No matches found for {selectedDate}</div>
            </div>
          ) : (
            <div className="match-cards-wrapper">
              {sortedFixtures.map((fixture: FixtureData) => {
                const matchId = fixture.fixture.id;
                const isStarred = starredMatches.has(matchId);
                const leagueContext = {
                  name: fixture.league.name,
                  country: fixture.league.country,
                };

                return (
                  <div key={matchId} className="country-matches-container">
                    <div
                      className="match-card-container group"
                      data-fixture-id={matchId}
                      onClick={() => handleMatchClick(fixture)}
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
                        <Star
                          className={`match-star-icon ${isStarred ? "starred" : ""}`}
                        />
                      </button>

                      {/* Match content container */}
                      <div className="match-three-grid-container">
                        {/* Top Grid: Match Status and League Info */}
                        <div
                          className="match-status-top"
                          style={{
                            minHeight: "20px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0 0.5rem",
                          }}
                        >
                          <div className="text-xs text-gray-500 truncate" style={{ maxWidth: "50%" }}>
                            {fixture.league.name}
                          </div>
                          <div>
                            {(() => {
                              const status = fixture.fixture.status.short;
                              const elapsed = fixture.fixture.status.elapsed;

                              // Live matches
                              if (
                                ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)
                              ) {
                                let displayText = "";
                                let statusClass = "status-live-elapsed";

                                if (status === "HT") {
                                  displayText = "Halftime";
                                  statusClass = "status-halftime";
                                } else if (status === "P") {
                                  displayText = "Penalties";
                                } else if (status === "ET") {
                                  displayText = elapsed ? `${elapsed}'` : "Extra Time";
                                } else {
                                  displayText = elapsed ? `${elapsed}'` : "LIVE";
                                }

                                return (
                                  <div className={`match-status-label ${statusClass}`}>
                                    {displayText}
                                  </div>
                                );
                              }

                              // Ended matches
                              if (["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status)) {
                                return (
                                  <div className="match-status-label status-ended">
                                    {status === "FT" ? "Ended" : status}
                                  </div>
                                );
                              }

                              // Upcoming matches - show time
                              if (status === "NS" || status === "TBD") {
                                const matchTime = new Date(fixture.fixture.date);
                                const localTime = matchTime.toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                });

                                return (
                                  <div className="match-status-label status-upcoming" style={{ fontSize: "0.75rem" }}>
                                    {status === "TBD" ? "TBD" : localTime}
                                  </div>
                                );
                              }

                              return null;
                            })()}
                          </div>
                        </div>

                        {/* Middle Grid: Main match content */}
                        <div className="match-content-container">
                          {/* Home Team Name */}
                          <div
                            className={`home-team-name ${
                              fixture.goals.home !== null &&
                              fixture.goals.away !== null &&
                              fixture.goals.home > fixture.goals.away &&
                              ["FT", "AET", "PEN"].includes(fixture.fixture.status.short)
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
                            {shortenTeamName(fixture.teams.home.name) || "Unknown Team"}
                          </div>

                          {/* Home team logo */}
                          <div className="home-team-logo-container" style={{ padding: "0 0.6rem" }}>
                            <MyWorldTeamLogo
                              teamName={fixture.teams.home.name}
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
                          </div>

                          {/* Score/Time Center */}
                          <div className="match-score-container">
                            {(() => {
                              const status = fixture.fixture.status.short;

                              // Live/Ended matches - show score
                              if (
                                ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT", "FT", "AET", "PEN"].includes(status)
                              ) {
                                return (
                                  <div className="match-score-display">
                                    <span className="score-number">{fixture.goals.home ?? 0}</span>
                                    <span className="score-separator">-</span>
                                    <span className="score-number">{fixture.goals.away ?? 0}</span>
                                  </div>
                                );
                              }

                              // Upcoming matches - show kick-off time
                              if (status === "NS" || status === "TBD") {
                                const matchTime = new Date(fixture.fixture.date);
                                const localTime = matchTime.toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                });

                                return (
                                  <div className="match-time-display" style={{ fontSize: "0.882em" }}>
                                    {status === "TBD" ? "TBD" : localTime}
                                  </div>
                                );
                              }

                              return (
                                <div className="match-time-display" style={{ fontSize: "0.882em" }}>
                                  {formatMatchTimeWithTimezone(fixture.fixture.date)}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Away team logo */}
                          <div className="away-team-logo-container" style={{ padding: "0 0.5rem" }}>
                            <MyWorldTeamLogo
                              teamName={fixture.teams.away.name}
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
                          </div>

                          {/* Away Team Name */}
                          <div
                            className={`away-team-name ${
                              fixture.goals.home !== null &&
                              fixture.goals.away !== null &&
                              fixture.goals.away > fixture.goals.home &&
                              ["FT", "AET", "PEN"].includes(fixture.fixture.status.short)
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
                            {shortenTeamName(fixture.teams.away.name) || "Unknown Team"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default TodayMatchByTime;
