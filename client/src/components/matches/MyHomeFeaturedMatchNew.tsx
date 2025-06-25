import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Calendar,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import TeamLogo from "./TeamLogo";
import LazyImage from "../common/LazyImage";
import MyColoredBarNew from "./MyColoredBarNew";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
}

// Popular leagues from PopularLeaguesList.tsx
const POPULAR_LEAGUES = [
  { id: 39, name: "Premier League", country: "England" },
  { id: 140, name: "La Liga", country: "Spain" },
  { id: 135, name: "Serie A", country: "Italy" },
  { id: 78, name: "Bundesliga", country: "Germany" },
  { id: 61, name: "Ligue 1", country: "France" },
  { id: 2, name: "UEFA Champions League", country: "Europe" },
  { id: 3, name: "UEFA Europa League", country: "Europe" },
  { id: 848, name: "UEFA Conference League", country: "Europe" },
  { id: 5, name: "UEFA Nations League", country: "Europe" },
  { id: 1, name: "World Cup", country: "World" },
  { id: 4, name: "Euro Championship", country: "World" },
  { id: 15, name: "FIFA Club World Cup", country: "World" },
  { id: 38, name: "UEFA U21 Championship", country: "World" },
  { id: 9, name: "Copa America", country: "World" },
  { id: 6, name: "Africa Cup of Nations", country: "World" },
];

interface FeaturedMatch {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed?: number;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
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
}

interface DayMatches {
  date: string;
  label: string;
  matches: FeaturedMatch[];
}

const MyHomeFeaturedMatchNew: React.FC<MyHomeFeaturedMatchNewProps> = ({
  maxMatches = 8,
}) => {
  const [, navigate] = useLocation();
  const [featuredMatches, setFeaturedMatches] = useState<DayMatches[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const fetchFeaturedMatches = useCallback(
    async (forceRefresh = false) => {
      try {
        // Only show loading on initial load or force refresh
        if (forceRefresh || featuredMatches.length === 0) {
          setIsLoading(true);
        }

        // Get dates for today, tomorrow, and day after tomorrow
        const today = new Date();
        const dates = [
          { date: format(today, "yyyy-MM-dd"), label: "Today" },
          { date: format(addDays(today, 1), "yyyy-MM-dd"), label: "Tomorrow" },
          {
            date: format(addDays(today, 2), "yyyy-MM-dd"),
            label: "Day After Tomorrow",
          },
        ];

        // Priority leagues: 38 (UEFA U21) first, then 15 (FIFA Club World Cup)
        const priorityLeagueIds = [38, 15];
        const allFixtures: FeaturedMatch[] = [];

        // Helper function to determine if match is live
        const isLiveMatch = (status: string) => {
          return ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
            status,
          );
        };

        // Helper function to determine if match is ended
        const isEndedMatch = (status: string) => {
          return [
            "FT",
            "AET",
            "PEN",
            "AWD",
            "WO",
            "ABD",
            "CANC",
            "SUSP",
          ].includes(status);
        };

        // Helper function to determine if match is upcoming
        const isUpcomingMatch = (status: string) => {
          return ["NS", "TBD", "PST"].includes(status);
        };

        // Fetch live matches from API for real-time updates
        let liveFixtures: FeaturedMatch[] = [];
        try {
          if (forceRefresh) {
            console.log("🔴 [FeaturedMatches] Fetching live matches from API");
            const liveResponse = await apiRequest("GET", "/api/fixtures/live");
            const liveData = await liveResponse.json();

            if (Array.isArray(liveData)) {
              liveFixtures = liveData
                .filter((fixture: any) => {
                  // Must have valid teams and be from priority leagues or popular leagues
                  const hasValidTeams =
                    fixture.teams?.home?.name && fixture.teams?.away?.name;
                  const isPriorityLeague = priorityLeagueIds.includes(
                    fixture.league?.id,
                  );
                  const isPopularLeague = POPULAR_LEAGUES.some(
                    (league) => league.id === fixture.league?.id,
                  );

                  return hasValidTeams && (isPriorityLeague || isPopularLeague);
                })
                .map((fixture: any) => ({
                  fixture: {
                    id: fixture.fixture.id,
                    date: fixture.fixture.date,
                    status: fixture.fixture.status,
                  },
                  league: {
                    id: fixture.league.id,
                    name: fixture.league.name,
                    country: fixture.league.country,
                    logo: fixture.league.logo,
                  },
                  teams: {
                    home: {
                      id: fixture.teams.home.id,
                      name: fixture.teams.home.name,
                      logo: fixture.teams.home.logo,
                    },
                    away: {
                      id: fixture.teams.away.id,
                      name: fixture.teams.away.name,
                      logo: fixture.teams.away.logo,
                    },
                  },
                  goals: {
                    home: fixture.goals?.home ?? null,
                    away: fixture.goals?.away ?? null,
                  },
                }));
            }
            console.log(
              `✅ [FeaturedMatches] Found ${liveFixtures.length} live matches`,
            );
          }
        } catch (error) {
          console.error(
            "❌ [FeaturedMatches] Error fetching live matches:",
            error,
          );
        }

        allFixtures.push(...liveFixtures);

        // Fetch non-live matches from cached data only on initial load or force refresh
        if (forceRefresh) {
          // Fetch non-live matches from cached data (priority leagues)
          for (const leagueId of priorityLeagueIds) {
            try {
              console.log(
                `🔍 [FeaturedMatches] Fetching cached data for league ${leagueId}`,
              );

              const fixturesResponse = await apiRequest(
                "GET",
                `/api/leagues/${leagueId}/fixtures`,
              );
              const fixturesData = await fixturesResponse.json();

              if (Array.isArray(fixturesData)) {
                const cachedFixtures = fixturesData
                  .filter((fixture: any) => {
                    // Must have valid teams and NOT be live (since we already fetched live matches)
                    const hasValidTeams =
                      fixture.teams?.home?.name && fixture.teams?.away?.name;
                    const isNotLive = !isLiveMatch(
                      fixture.fixture.status.short,
                    );

                    return hasValidTeams && isNotLive;
                  })
                  .map((fixture: any) => ({
                    fixture: {
                      id: fixture.fixture.id,
                      date: fixture.fixture.date,
                      status: fixture.fixture.status,
                    },
                    league: {
                      id: fixture.league.id,
                      name: fixture.league.name,
                      country: fixture.league.country,
                      logo: fixture.league.logo,
                    },
                    teams: {
                      home: {
                        id: fixture.teams.home.id,
                        name: fixture.teams.home.name,
                        logo: fixture.teams.home.logo,
                      },
                      away: {
                        id: fixture.teams.away.id,
                        name: fixture.teams.away.name,
                        logo: fixture.teams.away.logo,
                      },
                    },
                    goals: {
                      home: fixture.goals?.home ?? null,
                      away: fixture.goals?.away ?? null,
                    },
                  }));

                allFixtures.push(...cachedFixtures);
              }
            } catch (leagueError) {
              console.warn(
                `Failed to fetch cached data for league ${leagueId}:`,
                leagueError,
              );
            }
          }

          // Fetch non-live matches from cached date-based data
          for (const dateInfo of dates) {
            try {
              console.log(
                `🔍 [FeaturedMatches] Fetching cached data for ${dateInfo.label}: ${dateInfo.date}`,
              );

              const response = await apiRequest(
                "GET",
                `/api/fixtures/date/${dateInfo.date}?all=true`,
              );
              const fixtures = await response.json();

              if (fixtures?.length) {
                const cachedFixtures = fixtures
                  .filter((fixture: any) => {
                    // Must have valid teams, be from popular leagues, not priority leagues, and NOT be live
                    const hasValidTeams =
                      fixture.teams?.home?.name && fixture.teams?.away?.name;
                    const isPopularLeague = POPULAR_LEAGUES.some(
                      (league) => league.id === fixture.league?.id,
                    );
                    const isPriorityLeague = priorityLeagueIds.includes(
                      fixture.league?.id,
                    );
                    const isNotLive = !isLiveMatch(
                      fixture.fixture.status.short,
                    );

                    return (
                      hasValidTeams &&
                      isPopularLeague &&
                      !isPriorityLeague &&
                      isNotLive
                    );
                  })
                  .map((fixture: any) => ({
                    fixture: {
                      id: fixture.fixture.id,
                      date: fixture.fixture.date,
                      status: fixture.fixture.status,
                    },
                    league: {
                      id: fixture.league.id,
                      name: fixture.league.name,
                      country: fixture.league.country,
                      logo: fixture.league.logo,
                    },
                    teams: {
                      home: {
                        id: fixture.teams.home.id,
                        name: fixture.teams.home.name,
                        logo: fixture.teams.home.logo,
                      },
                      away: {
                        id: fixture.teams.away.id,
                        name: fixture.teams.away.name,
                        logo: fixture.teams.away.logo,
                      },
                    },
                    goals: {
                      home: fixture.goals?.home ?? null,
                      away: fixture.goals?.away ?? null,
                    },
                  }));

                allFixtures.push(...cachedFixtures);
              }
            } catch (error) {
              console.error(
                `❌ [FeaturedMatches] Error fetching cached data for ${dateInfo.label}:`,
                error,
              );
            }
          }
        }

        // Remove duplicates based on fixture ID
        const uniqueFixtures = allFixtures.filter(
          (fixture, index, self) =>
            index ===
            self.findIndex((f) => f.fixture.id === fixture.fixture.id),
        );

        console.log(
          `📋 [FeaturedMatches] Total unique fixtures found:`,
          uniqueFixtures.length,
        );

        // Group fixtures by date
        const allMatches: DayMatches[] = [];
        for (const dateInfo of dates) {
          const fixturesForDay = uniqueFixtures
            .filter((fixture) => {
              const matchDate = new Date(fixture.fixture.date);
              const year = matchDate.getFullYear();
              const month = String(matchDate.getMonth() + 1).padStart(2, "0");
              const day = String(matchDate.getDate()).padStart(2, "0");
              const matchDateString = `${year}-${month}-${day}`;
              return matchDateString === dateInfo.date;
            })
            .sort((a: FeaturedMatch, b: FeaturedMatch) => {
              // Priority sort: live matches first, then by league priority, then by time
              const aStatus = a.fixture.status.short;
              const bStatus = b.fixture.status.short;

              const aLive = [
                "LIVE",
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

              // Priority leagues first
              const aPriority = priorityLeagueIds.indexOf(a.league.id);
              const bPriority = priorityLeagueIds.indexOf(b.league.id);

              if (aPriority !== -1 && bPriority === -1) return -1;
              if (aPriority === -1 && bPriority !== -1) return 1;
              if (aPriority !== -1 && bPriority !== -1)
                return aPriority - bPriority;

              // Finally by time
              return (
                new Date(a.fixture.date).getTime() -
                new Date(b.fixture.date).getTime()
              );
            })
            .slice(0, maxMatches);

          console.log(
            `✅ [FeaturedMatches] Found ${fixturesForDay.length} featured matches for ${dateInfo.label}`,
          );

          allMatches.push({
            date: dateInfo.date,
            label: dateInfo.label,
            matches: fixturesForDay,
          });
        }

        // Only update state if data has actually changed
        setFeaturedMatches((prevMatches) => {
          const newMatchesString = JSON.stringify(allMatches);
          const prevMatchesString = JSON.stringify(prevMatches);

          if (newMatchesString !== prevMatchesString) {
            return allMatches;
          }
          return prevMatches;
        });
      } catch (error) {
        console.error("❌ [FeaturedMatches] Error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [maxMatches],
  );

  useEffect(() => {
    // Initial fetch with force refresh
    fetchFeaturedMatches(true);
  }, []); // Only run once on mount

  // Separate effect for live match refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      const hasLiveMatches = featuredMatches.some((dayData) =>
        dayData.matches.some((match) =>
          ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
            match.fixture.status.short,
          ),
        ),
      );

      if (hasLiveMatches) {
        console.log(
          "🔄 [FeaturedMatches] Live matches detected, refreshing data",
        );
        fetchFeaturedMatches(false); // Background refresh without loading state
      } else {
        console.log("⏸️ [FeaturedMatches] No live matches, skipping refresh");
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, [featuredMatches]); // Only depend on featuredMatches for live match detection

  const formatMatchTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "HH:mm");
    } catch {
      return "--:--";
    }
  };

  const getStatusDisplay = (match: FeaturedMatch) => {
    const status = match.fixture.status.short;
    const elapsed = match.fixture.status.elapsed;

    if (status === "NS") {
      return {
        text: formatMatchTime(match.fixture.date),
        color: "bg-blue-500",
        isLive: false,
      };
    }

    if (["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(status)) {
      let displayText = status;

      if (status === "HT") {
        displayText = "Half Time";
      } else if (status === "1H" || status === "2H" || status === "LIVE") {
        displayText = elapsed ? `${elapsed}'` : "LIVE";
      } else if (status === "ET") {
        displayText = elapsed ? `${elapsed}' ET` : "Extra Time";
      } else if (status === "P") {
        displayText = "Penalties";
      }

      return {
        text: displayText,
        color: "bg-red-500 animate-pulse",
        isLive: true,
      };
    }

    if (status === "FT") {
      return {
        text: "Full Time",
        color: "bg-gray-500",
        isLive: false,
      };
    }

    if (status === "PST") {
      return {
        text: "Postponed",
        color: "bg-yellow-500",
        isLive: false,
      };
    }

    if (status === "CANC") {
      return {
        text: "Cancelled",
        color: "bg-red-600",
        isLive: false,
      };
    }

    return {
      text: status,
      color: "bg-gray-400",
      isLive: false,
    };
  };

  // Memoize expensive calculations
  const allMatches = useMemo(() => {
    return featuredMatches.reduce((acc, dayData) => {
      return [...acc, ...dayData.matches];
    }, [] as FeaturedMatch[]);
  }, [featuredMatches]);

  const currentMatch = useMemo(() => {
    return allMatches[currentMatchIndex];
  }, [allMatches, currentMatchIndex]);

  const handlePrevious = useCallback(() => {
    if (allMatches.length > 0) {
      setCurrentMatchIndex((prev) =>
        prev === 0 ? allMatches.length - 1 : prev - 1,
      );
    }
  }, [allMatches.length]);

  const handleNext = useCallback(() => {
    if (allMatches.length > 0) {
      setCurrentMatchIndex((prev) =>
        prev === allMatches.length - 1 ? 0 : prev + 1,
      );
    }
  }, [allMatches.length]);

  const getTeamColor = useCallback((teamId: number) => {
    // Simple team color generator based on team ID
    const colors = [
      "#3B82F6", // blue
      "#EF4444", // red
      "#10B981", // green
      "#F59E0B", // amber
      "#8B5CF6", // violet
      "#EC4899", // pink
      "#14B8A6", // teal
      "#F97316", // orange
    ];
    return colors[teamId % colors.length];
  }, []);

  if (isLoading) {
    return (
      <Card className="px-0 pt-0 pb-2 relative shadow-md mb-4">
        <Badge
          variant="secondary"
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
        >
          Featured Match
        </Badge>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-32 bg-gray-100 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="px-0 pt-0 pb-2 relative shadow-md mb-4 overflow-hidden">
      <Badge
        variant="secondary"
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
      >
        Featured Match
      </Badge>

      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm"></CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {allMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <p className="text-lg font-medium mb-1">No featured matches</p>
            <p className="text-sm">Check back later for upcoming games</p>
          </div>
        ) : (
          <div className="relative">
            {/* Navigation arrows */}
            {allMatches.length > 1 && (
              <>
                <button onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={handleNext}>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Single match display */}
            {currentMatch && (
              <div
                key={`match-${currentMatch.fixture.id}-${currentMatchIndex}`}
                className="cursor-pointer transition-all duration-300"
                onClick={() => navigate(`/match/${currentMatch.fixture.id}`)}
              >
                {/* League header */}
                <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
                  <LazyImage
                    src={currentMatch.league.logo}
                    alt={currentMatch.league.name}
                    className="w-6 h-6"
                    fallbackSrc="/assets/fallback-logo.svg"
                  />
                  <span className="text-sm font-md text-gray-700">
                    {currentMatch.league.name}
                  </span>
                  {getStatusDisplay(currentMatch).isLive && (
                    <Star className="h-4 w-4 text-red-500 fill-current" />
                  )}
                </div>

                {/* Match day indicator */}
                <div className="text-center mb-4 ">
                  <div className="text-2xl font-bold text-gray-800 ">
                    {(() => {
                      const statusInfo = getStatusDisplay(currentMatch);
                      const matchStatus = currentMatch.fixture.status.short;
                      const matchDate = new Date(currentMatch.fixture.date);
                      const today = new Date();
                      const tomorrow = addDays(today, 1);

                      const matchDateString = format(matchDate, "yyyy-MM-dd");
                      const todayString = format(today, "yyyy-MM-dd");
                      const tomorrowString = format(tomorrow, "yyyy-MM-dd");

                      // Live matches - show elapsed time and live score
                      if (statusInfo.isLive) {
                        const elapsed = currentMatch.fixture.status.elapsed;
                        const homeScore = currentMatch.goals.home ?? 0;
                        const awayScore = currentMatch.goals.away ?? 0;

                        return (
                          <div className="space-y-1">
                            <div className="text-red-500 animate-pulse flex items-center justify-center gap-2">
                              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                              <span>LIVE</span>
                              {elapsed && <span>- {elapsed}'</span>}
                            </div>
                            <div className="text-3xl font-bold">
                              {homeScore} - {awayScore}
                            </div>
                          </div>
                        );
                      }

                      // Ended matches - show final score
                      if (
                        matchStatus === "FT" ||
                        matchStatus === "AET" ||
                        matchStatus === "PEN"
                      ) {
                        const homeScore = currentMatch.goals.home ?? 0;
                        const awayScore = currentMatch.goals.away ?? 0;

                        return (
                          <div className="space-y-1">
                            <div className="text-gray-600 text-sm ">
                              {matchStatus === "FT"
                                ? "Ended"
                                : matchStatus === "AET"
                                  ? "After Extra Time"
                                  : matchStatus === "PEN"
                                    ? "After Penalties"
                                    : "Ended"}
                            </div>
                            <div className="text-3xl font-bold">
                              {homeScore} - {awayScore}
                            </div>
                          </div>
                        );
                      }

                      // Upcoming matches - smart date labeling
                      if (matchDateString === todayString) {
                        return "Today";
                      } else if (matchDateString === tomorrowString) {
                        return "Tomorrow";
                      } else {
                        // Calculate days difference for upcoming matches
                        const daysDiff = Math.ceil(
                          (matchDate.getTime() - today.getTime()) /
                            (1000 * 60 * 60 * 24),
                        );

                        if (daysDiff > 0 && daysDiff <= 7) {
                          // For matches within a week, show day name and days from now
                          const dayName = format(matchDate, "EEEE");
                          return `${dayName} (${daysDiff} ${daysDiff === 1 ? "day" : "days"} from now)`;
                        } else if (daysDiff > 7) {
                          // For matches more than a week away, show date
                          return format(matchDate, "EEEE, MMM d");
                        } else {
                          // For past matches that aren't ended (edge case)
                          return format(matchDate, "EEEE, MMM d");
                        }
                      }
                    })()}
                  </div>
                </div>

                {/* Teams display using MyColoredBarNew component */}

                <div className="flex flex-col gap-2">
                  {/* Horizontal logo display aligned with colored bar edges */}
                  <div className="flex items-center justify-between px-4 relative">
                    {/* Home team logo positioned to align with left edge of colored bar */}
                    <div className="flex items-center gap-2" style={{ marginLeft: "4px" }}>
                      <MyWorldTeamLogo
                        teamName={currentMatch.teams.home.name}
                        teamLogo={currentMatch.teams.home.logo}
                        alt={currentMatch.teams.home.name}
                        size="50px"
                        className="object-contain"
                        leagueContext={{
                          name: currentMatch.league.name,
                          country: currentMatch.league.country,
                        }}
                      />
                    </div>

                    {/* Away team logo positioned to align with right edge of colored bar */}
                    <div className="flex items-center gap-2 flex-row-reverse" style={{ marginRight: "4px" }}>
                      <MyWorldTeamLogo
                        teamName={currentMatch.teams.away.name}
                        teamLogo={currentMatch.teams.away.logo}
                        alt={currentMatch.teams.away.name}
                        size="50px"
                        className="object-contain"
                        leagueContext={{
                          name: currentMatch.league.name,
                          country: currentMatch.league.country,
                        }}
                      />
                    </div>
                  </div>

                  {/* MyColoredBarNew component */}
                  <MyColoredBarNew
                    homeTeam={{
                      id: currentMatch.teams.home.id,
                      name: currentMatch.teams.home.name,
                      logo: currentMatch.teams.home.logo,
                    }}
                    awayTeam={{
                      id: currentMatch.teams.away.id,
                      name: currentMatch.teams.away.name,
                      logo: currentMatch.teams.away.logo,
                    }}
                    homeScore={currentMatch.goals.home}
                    awayScore={currentMatch.goals.away}
                    status={currentMatch.fixture.status.short}
                    fixture={{
                      id: currentMatch.fixture.id,
                      date: currentMatch.fixture.date,
                      status: currentMatch.fixture.status,
                    }}
                    onClick={() => navigate(`/match/${currentMatch.fixture.id}`)}
                    getTeamColor={getTeamColor}
                    className="h-20"
                    league={{
                      country: currentMatch.league.country,
                    }}
                  />
                </div>
                {/* Match Details */}
                <div className="text-center text-sm text-gray-600 mb-4">
                  {format(
                    new Date(currentMatch.fixture.date),
                    "EEEE, do MMMM | HH:mm",
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-around border-t border-gray-200 pt-4">
                  <button
                    className="flex flex-col items-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/match/${currentMatch.fixture.id}`);
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      className="text-blue-500"
                    >
                      <path
                        d="M20 3H4C3.45 3 3 3.45 3 4V20C3 20.55 3.45 21 4 21H20C20.55 21 21 20.55 21 20V4C21 3.45 20.55 3 20 3ZM7 7H17V17H7V7Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="text-xs text-gray-600 mt-1">
                      Match Page
                    </span>
                  </button>
                  <button
                    className="flex flex-col items-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      className="text-blue-500"
                    >
                      <path
                        d="M21.5 4H2.5C2.22386 4 2 4.22386 2 4.5V19.5C2 19.7761 2.22386 20 2.5 20H21.5C21.7761 20 22 19.7761 22 19.5V4.5C22 4.22386 21.7761 4 21.5 4Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                      />
                      <path
                        d="M21.5 9H18.5C18.2239 9 18 9.22386 18 9.5V14.5C18 14.7761 18.2239 15 18.5 15H21.5C21.7761 15 22 14.7761 22 14.5V9.5C22 9.22386 21.7761 9 21.5 9Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                      />
                      <path
                        d="M5.5 9H2.5C2.22386 9 2 9.22386 2 9.5V14.5C2 14.7761 2.22386 15 2.5 15H5.5C5.77614 15 6 14.7761 6 14.5V9.5C6 9.22386 5.77614 9 5.5 9Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                    <span className="text-xs text-gray-600 mt-1">Lineups</span>
                  </button>
                  <button
                    className="flex flex-col items-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      className="text-blue-500"
                    >
                      <path
                        d="M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM19.931 11H13V4.069C14.7598 4.29335 16.3953 5.09574 17.6498 6.3502C18.9043 7.60466 19.7066 9.24017 19.931 11ZM4 12C4 7.928 7.061 4.564 11 4.069V12C11.003 12.1526 11.0409 12.3024 11.111 12.438C11.126 12.468 11.133 12.501 11.152 12.531L15.354 19.254C14.3038 19.7442 13.159 19.9988 12 20C7.589 20 4 16.411 4 12ZM17.052 18.196L13.805 13H19.931C19.6746 15.0376 18.6436 16.8982 17.052 18.196Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="text-xs text-gray-600 mt-1">Stats</span>
                  </button>
                  <button
                    className="flex flex-col items-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/league/${currentMatch.league.id}/standings`);
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      className="text-blue-500"
                    >
                      <path
                        d="M4 6H6V8H4V6ZM4 11H6V13H4V11ZM4 16H6V18H4V16ZM20 8V6H8.023V8H18.8H20ZM8 11H20V13H8V11ZM8 16H20V18H8V16Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="text-xs text-gray-600 mt-1">Groups</span>
                  </button>
                </div>

                {/* Slide indicators */}
                {allMatches.length > 1 && (
                  <div className="flex justify-center mt-4 gap-1">
                    {allMatches.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMatchIndex(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentMatchIndex
                            ? "bg-blue-500"
                            : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyHomeFeaturedMatchNew;
