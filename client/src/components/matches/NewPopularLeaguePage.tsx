
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, Clock, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid } from "date-fns";
import { useCachedQuery } from "@/lib/cachingHelper";
import { getCurrentUTCDateString } from "@/lib/dateUtilsUpdated";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";
import { isNationalTeam } from "@/lib/teamLogoSources";
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";

interface NewPopularLeaguePageProps {
  selectedDate: string;
  onBack?: () => void;
}

// Major competitions mapping with their league IDs
const MAJOR_COMPETITIONS = {
  "Euro Championship": [4],
  "World Cup": [1],
  "UEFA Champions League": [2],
  "FIFA Club World Cup": [15],
  "Olympics Men": [480],
  "UEFA Europa League": [3],
  "Africa Cup of Nations": [6],
  "Copa America": [9],
  "CONCACAF Champions League": [26],
  "AFC Champions League": [1],
  "Friendlies": [], // Special handling for friendlies
  "UEFA Nations League": [5],
  "CONMEBOL Sudamericana": [13],
  "CAF Champions League": [12],
  "CONMEBOL Libertadores": [11],
  "UEFA Europa Conference League": [848]
};

const NewPopularLeaguePage: React.FC<NewPopularLeaguePageProps> = ({
  selectedDate,
  onBack
}) => {
  const [expandedCompetitions, setExpandedCompetitions] = useState<Set<string>>(new Set());

  // Fetch fixtures for the selected date
  const { data: fixtures = [], isLoading } = useCachedQuery(
    ["new-popular-leagues-fixtures", selectedDate],
    async () => {
      console.log(`🔄 [NewPopularLeague] Fetching fixtures for date: ${selectedDate}`);
      const response = await apiRequest("GET", `/api/fixtures/date/${selectedDate}?all=true`);
      const data = await response.json();
      console.log(`✅ [NewPopularLeague] Received ${data?.length || 0} fixtures`);
      return data;
    },
    {
      enabled: !!selectedDate,
      maxAge: 2 * 60 * 60 * 1000, // 2 hours cache
      staleTime: 2 * 60 * 60 * 1000,
    }
  );

  // Process fixtures to group by major competitions
  const competitionData = useMemo(() => {
    if (!fixtures?.length) return [];

    const competitionMatches: any = {};

    fixtures.forEach((fixture: any) => {
      if (!fixture?.league || !fixture?.teams) return;

      const leagueName = fixture.league.name?.toLowerCase() || "";
      const leagueId = fixture.league.id;
      const country = fixture.league.country?.toLowerCase() || "";

      // Check each major competition
      Object.entries(MAJOR_COMPETITIONS).forEach(([competitionName, leagueIds]) => {
        let isMatch = false;

        if (competitionName === "Friendlies") {
          // Special handling for friendlies
          isMatch = leagueName.includes("friendlies") && 
                   !leagueName.includes("women") &&
                   (country === "world" || country === "international");
        } else {
          // Check by league ID or name matching
          isMatch = leagueIds.includes(leagueId) || 
                   leagueName.includes(competitionName.toLowerCase().replace(/[^a-z ]/g, ""));
        }

        if (isMatch) {
          if (!competitionMatches[competitionName]) {
            competitionMatches[competitionName] = {
              name: competitionName,
              matches: [],
              count: 0
            };
          }

          // Apply smart time filtering
          if (fixture.fixture.date && fixture.fixture.status?.short) {
            const smartResult = MySmartTimeFilter.getSmartTimeLabel(
              fixture.fixture.date,
              fixture.fixture.status.short,
              selectedDate + "T12:00:00Z"
            );

            const today = getCurrentUTCDateString();
            const tomorrow = format(new Date(new Date().getTime() + 24 * 60 * 60 * 1000), "yyyy-MM-dd");
            const yesterday = format(new Date(new Date().getTime() - 24 * 60 * 60 * 1000), "yyyy-MM-dd");

            const shouldInclude = (() => {
              if (selectedDate === tomorrow && smartResult.label === "tomorrow") return true;
              if (selectedDate === today && smartResult.label === "today") return true;
              if (selectedDate === yesterday && smartResult.label === "yesterday") return true;
              if (selectedDate !== today && selectedDate !== tomorrow && selectedDate !== yesterday) {
                return smartResult.label === "custom" && smartResult.isWithinTimeRange;
              }
              return false;
            })();

            if (shouldInclude) {
              competitionMatches[competitionName].matches.push(fixture);
              competitionMatches[competitionName].count++;
            }
          }
        }
      });
    });

    // Convert to array and sort by match count (descending)
    const result = Object.values(competitionMatches)
      .filter((comp: any) => comp.count > 0)
      .sort((a: any, b: any) => b.count - a.count);

    console.log(`🏆 [NewPopularLeague] Found competitions:`, 
      result.map((comp: any) => `${comp.name}: ${comp.count} matches`)
    );

    return result;
  }, [fixtures, selectedDate]);

  const toggleCompetition = (competitionName: string) => {
    setExpandedCompetitions(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(competitionName)) {
        newExpanded.delete(competitionName);
      } else {
        newExpanded.add(competitionName);
      }
      return newExpanded;
    });
  };

  const formatMatchTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "HH:mm");
    } catch (error) {
      return "--:--";
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-64" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!competitionData.length) {
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            🔥 MAJOR COMPETITIONS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No major competitions on this date</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              🔥 MAJOR COMPETITIONS WITH MATCHES
            </CardTitle>
            {onBack && (
              <button
                onClick={onBack}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid gap-3">
            {competitionData.map((competition: any) => (
              <div key={competition.name} className="space-y-2">
                {/* Competition Header */}
                <div 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleCompetition(competition.name)}
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <span className="font-semibold">{competition.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                      {competition.count} match{competition.count !== 1 ? "es" : ""}
                    </span>
                    <span className="text-gray-400">
                      {expandedCompetitions.has(competition.name) ? "▼" : "▶"}
                    </span>
                  </div>
                </div>

                {/* Matches */}
                {expandedCompetitions.has(competition.name) && (
                  <div className="pl-4 space-y-2">
                    {competition.matches.map((match: any) => (
                      <div key={match.fixture.id} className="bg-white border rounded-lg p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-gray-500">
                            {match.league.name} • {match.league.country}
                          </div>
                          <div className="text-xs font-medium">
                            {(() => {
                              const status = match.fixture.status.short;
                              if (["LIVE", "LIV", "1H", "HT", "2H"].includes(status)) {
                                return (
                                  <span className="text-red-600 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    LIVE {match.fixture.status.elapsed || 0}'
                                  </span>
                                );
                              }
                              if (["FT", "AET", "PEN"].includes(status)) {
                                return <span className="text-gray-600">FT</span>;
                              }
                              return <span className="text-blue-600">{formatMatchTime(match.fixture.date)}</span>;
                            })()}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Home Team */}
                          <div className="flex items-center gap-2 flex-1">
                            {isNationalTeam(match.teams.home, match.league) ? (
                              <MyCircularFlag
                                teamName={match.teams.home.name}
                                fallbackUrl={match.teams.home.logo}
                                size="24px"
                              />
                            ) : (
                              <LazyImage
                                src={match.teams.home.id ? `/api/team-logo/square/${match.teams.home.id}?size=24` : "/assets/fallback-logo.svg"}
                                alt={match.teams.home.name}
                                className="w-6 h-6 object-contain"
                                fallbackSrc="/assets/fallback-logo.svg"
                              />
                            )}
                            <span className="text-sm font-medium truncate">
                              {shortenTeamName(match.teams.home.name)}
                            </span>
                          </div>

                          {/* Score/Time */}
                          <div className="flex items-center justify-center px-3">
                            {match.goals.home !== null && match.goals.away !== null ? (
                              <span className="text-lg font-bold">
                                {match.goals.home} - {match.goals.away}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">vs</span>
                            )}
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center gap-2 flex-1 justify-end">
                            <span className="text-sm font-medium truncate">
                              {shortenTeamName(match.teams.away.name)}
                            </span>
                            {isNationalTeam(match.teams.away, match.league) ? (
                              <MyCircularFlag
                                teamName={match.teams.away.name}
                                fallbackUrl={match.teams.away.logo}
                                size="24px"
                              />
                            ) : (
                              <LazyImage
                                src={match.teams.away.id ? `/api/team-logo/square/${match.teams.away.id}?size=24` : "/assets/fallback-logo.svg"}
                                alt={match.teams.away.name}
                                className="w-6 h-6 object-contain"
                                fallbackSrc="/assets/fallback-logo.svg"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewPopularLeaguePage;
