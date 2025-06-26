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
import MyColoredBar from "./MyColoredBar";
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

// Define featured leagues
const FEATURED_MATCH_LEAGUE_IDS = [
  39, 140, 135, 78, 61, 2, 3, 848, 5, 1, 4, 15, 38, 9, 6,
];
const PRIORITY_LEAGUE_IDS = [15, 38]; // FIFA Club World Cup, UEFA U21 Championship

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

        // Use priority leagues from our clean list
        const priorityLeagueIds = PRIORITY_LEAGUE_IDS;
        const allFixtures: FeaturedMatch[] = [];

        console.log(
          "🔍 [MyHomeFeaturedMatchNew] Starting fetch with priority leagues:",
          priorityLeagueIds,
        );
        console.log(
          "🔍 [MyHomeFeaturedMatchNew] All featured league IDs:",
          FEATURED_MATCH_LEAGUE_IDS,
        );

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

        // Simple validation - only check for valid team names
        const isValidMatch = (fixture: any) => {
          return !!(fixture?.teams?.home?.name && fixture?.teams?.away?.name);
        };

        // Fetch live matches from API for real-time updates
        let liveFixtures: FeaturedMatch[] = [];
        try {
          if (forceRefresh) {
            console.log(
              "🔴 [MyHomeFeaturedMatchNew] Fetching live matches from dedicated endpoint",
            );
            const liveResponse = await apiRequest(
              "GET",
              "/api/featured-match/live?skipFilter=true",
            );
            const liveData = await liveResponse.json();

            if (Array.isArray(liveData)) {
              console.log(
                "🔍 [MyHomeFeaturedMatchNew] Processing live fixtures:",
                liveData.length,
              );

              // First filter by featured leagues, then by valid teams
              const featuredLiveFixtures = liveData.filter((fixture) =>
                FEATURED_MATCH_LEAGUE_IDS.includes(fixture.league?.id),
              );

              console.log(
                "🔍 [MyHomeFeaturedMatchNew] Featured live fixtures:",
                featuredLiveFixtures.length,
              );

              liveFixtures = featuredLiveFixtures
                .filter((fixture: any) => {
                  const isValid = isValidMatch(fixture);
                  if (!isValid) {
                    console.log(
                      "❌ [MyHomeFeaturedMatchNew] Filtered out invalid fixture:",
                      {
                        home: fixture.teams?.home?.name,
                        away: fixture.teams?.away?.name,
                        league: fixture.league?.name,
                      },
                    );
                  } else {
                    console.log(
                      "✅ [MyHomeFeaturedMatchNew] Valid featured live fixture:",
                      {
                        home: fixture.teams?.home?.name,
                        away: fixture.teams?.away?.name,
                        league: fixture.league?.name,
                        leagueId: fixture.league?.id,
                      },
                    );
                  }
                  return isValid;
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
              `✅ [MyHomeFeaturedMatchNew] Found ${liveFixtures.length} live matches (including all live matches regardless of league)`,
            );
          }
        } catch (error) {
          console.error(
            "❌ [MyHomeFeaturedMatchNew] Error fetching live matches:",
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
                `🔍 [MyHomeFeaturedMatchNew] Fetching cached data for league ${leagueId}`,
              );

              const fixturesResponse = await apiRequest(
                "GET",
                `/api/featured-match/leagues/${leagueId}/fixtures?skipFilter=true`,
              );
              const fixturesData = await fixturesResponse.json();

              if (Array.isArray(fixturesData)) {
                const cachedFixtures = fixturesData
                  .filter((fixture: any) => {
                    // Must have valid teams and NOT be live (since we already fetched live matches)
                    const hasValidTeams = isValidMatch(fixture);
                    const isNotLive = !isLiveMatch(
                      fixture.fixture.status.short,
                    );
                    const shouldInclude = hasValidTeams && isNotLive;

                    if (shouldInclude) {
                      console.log(
                        `✅ [MyHomeFeaturedMatchNew] Including priority league ${leagueId} fixture:`,
                        {
                          home: fixture.teams?.home?.name,
                          away: fixture.teams?.away?.name,
                          league: fixture.league?.name,
                          leagueId: fixture.league?.id,
                          status: fixture.fixture.status.short,
                        },
                      );
                    }

                    return shouldInclude;
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
                `🔍 [MyHomeFeaturedMatchNew] Fetching cached data for ${dateInfo.label}: ${dateInfo.date}`,
              );

              const response = await apiRequest(
                "GET",
                `/api/featured-match/date/${dateInfo.date}?all=true&skipFilter=true`,
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
                `❌ [MyHomeFeaturedMatchNew] Error fetching cached data for ${dateInfo.label}:`,
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
          `📋 [MyHomeFeaturedMatchNew] Total unique fixtures found:`,
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

              const aLive = isLiveMatch(aStatus);
              const bLive = isLiveMatch(bStatus);

              // Live matches always come first
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
            `✅ [MyHomeFeaturedMatchNew] Found ${fixturesForDay.length} featured matches for ${dateInfo.label}`,
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
        console.error("❌ [MyHomeFeaturedMatchNew] Error:", error);
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
          "🔄 [MyHomeFeaturedMatchNew] Live matches detected, refreshing data",
        );
        fetchFeaturedMatches(false); // Background refresh without loading state
      } else {
        console.log(
          "⏸️ [MyHomeFeaturedMatchNew] No live matches, skipping refresh",
        );
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
      <Card className="px-0 pt-0 pb-2 relative shadow-md">
        <Badge
          variant="secondary"
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
        >
          Featured Match
        </Badge>
        <div className="p-4">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-32 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="px-0 pt-0 pb-2 relative shadow-md">
      <Badge
        variant="secondary"
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
      >
        Featured Match
      </Badge>
      <div className="bg-gray-50 p-2 mt-6 relative">
        <div className="flex items-center justify-center">
          {currentMatch?.league?.logo ? (
            <img
              src={currentMatch.league.logo}
              alt={currentMatch.league.name}
              className="w-5 h-5 object-contain mr-2"
              onError={(e) => {
                e.currentTarget.src = "/assets/fallback-logo.svg";
              }}
            />
          ) : (
            <Trophy className="w-5 h-5 text-amber-500 mr-2" />
          )}
          <span className="text-sm font-medium">{currentMatch?.league?.name || "League Name"}</span>
          {getStatusDisplay(currentMatch).isLive ? (
            <div className="flex items-center gap-1.5 ml-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border border-red-500 text-red-500 animate-pulse"
              >
                LIVE
              </Badge>
            </div>
          ) : (
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 border ml-[3px] ${
                getStatusDisplay(currentMatch).text === "Full Time"
                  ? "border-gray-500 text-gray-500"
                  : "border-blue-500 text-blue-500"
              }`}
            >
              {(() => {
                const statusInfo = getStatusDisplay(currentMatch);
                const matchStatus = currentMatch?.fixture?.status?.short;
                
                if (statusInfo.isLive) {
                  return "LIVE";
                } else if (matchStatus === "FT") {
                  return "FINISHED";
                } else {
                  return currentMatch?.league?.round || "UPCOMING";
                }
              })()}
            </Badge>
          )}
        </div>
      </div>

      {allMatches.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-black h-[58px] w-[26px] p-2 rounded-r-full z-40 flex items-center border border-gray-200"
          >
            <ChevronLeft className="h-14 w-14" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-black h-[58px] w-[26px] p-2 rounded-l-full z-40 flex items-center border border-gray-200"
          >
            <ChevronRight className="h-25 w-25" />
          </button>
        </>
      )}

      <div className="pt-0">
        {allMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <p className="text-lg font-medium mb-1">No featured matches</p>
            <p className="text-sm">Check back later for upcoming games</p>
          </div>
        ) : (
          <div className="overflow-hidden h-full w-full bg-white shadow-sm cursor-pointer" onClick={() => currentMatch?.fixture?.id && navigate(`/match/${currentMatch.fixture.id}`)}>
            <div className="p-0 h-full mt-0 mb-[10px] relative">
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
                  <div className="text-lg font-bold text-gray-800 ">
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
                            <div className="text-red-600 text-sm animate-pulse flex items-center justify-center gap-2">
                              {elapsed && <span> {elapsed}'</span>}
                            </div>
                            <div className="text-2xl font-md">
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

                <div className="flex flex-col ">
                  {/* Horizontal logo display aligned with colored bar edges */}
                  <div className="flex items-center justify-between  relative-z-20 ">
                    {/* Home team logo positioned to align with left edge of colored bar */}
                    <div
                      className="flex items-center "
                      style={{ marginLeft: "-22px" }}
                    >
                      <MyWorldTeamLogo
                        teamName={currentMatch.teams.home.name}
                        teamLogo={currentMatch.teams.home.logo}
                        alt={currentMatch.teams.home.name}
                        size="65px"
                        className="object-contain "
                        leagueContext={{
                          name: currentMatch.league.name,
                          country: currentMatch.league.country,
                        }}
                      />
                    </div>

                    {/* Away team logo positioned to align with right edge of colored bar */}
                    <div
                      className="flex items-center flex-row-reverse relative "
                      style={{ marginRight: "255px" }}
                    >
                      <MyWorldTeamLogo
                        teamName={currentMatch.teams.away.name}
                        teamLogo={currentMatch.teams.away.logo}
                        alt={currentMatch.teams.away.name}
                        size="65px"
                        className="object-contain"
                        leagueContext={{
                          name: currentMatch.league.name,
                          country: currentMatch.league.country,
                        }}
                      />

                      </div>
                  </div>
                </div>

                {/* Bottom navigation */}
                <div className="flex justify-around border-t border-gray-200 pt-4">
                  <button
                    className="flex flex-col items-center cursor-pointer w-1/4"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/match/${currentMatch.fixture.id}`);
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      className="text-gray-600"
                    >
                      <path
                        d="M20 3H4C3.45 3 3 3.45 3 4V20C3 20.55 3.45 21 4 21H20C20.55 21 21 20.55 21 20V4C21 3.45 20.55 3 20 3ZM7 7H17V17H7V7Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="text-[0.75rem] text-gray-600 mt-1">
                      Match Page
                    </span>
                  </button>
                  <button
                    className="flex flex-col items-center cursor-pointer w-1/4"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/match/${currentMatch.fixture.id}/lineups`);
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      className="text-gray-600"
                    >
                      <path
                        d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM11 19H5V15H11V19ZM11 13H5V9H11V13ZM11 7H5V5H11V7ZM13 19V5H19V19H13Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="text-[0.75rem] text-gray-600 mt-1">
                      Lineups
                    </span>
                  </button>
                  <button
                    className="flex flex-col items-center cursor-pointer w-1/4"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/match/${currentMatch.fixture.id}/h2h`);
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      className="text-gray-600"
                    >
                      <path
                        d="M14.06 9.02L16.66 11.62L14.06 14.22L15.48 15.64L18.08 13.04L20.68 15.64L19.26 17.06L21.86 19.66L20.44 21.08L17.84 18.48L15.24 21.08L13.82 19.66L16.42 17.06L15.06 15.64L12.46 13.04L15.06 10.44L13.64 9.02L11.04 11.62L8.44 9.02L9.86 7.6L7.26 5L4.66 7.6L6.08 9.02L3.48 11.62L6.08 14.22L4.66 15.64L2.06 13.04L4.66 10.44L6.08 9.02L3.48 6.42L4.9 5L7.5 7.6L10.1 5L11.52 6.42L8.92 9.02L11.52 11.62L14.06 9.02M12 2C6.47 2 2 6.47 2 12C2 17.53 6.47 22 12 22C17.53 22 22 17.53 22 12C22 6.47 17.53 2 2 12Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="text-[0.75rem] text-gray-600 mt-1">
                      H2H
                    </span>
                  </button>
                  <button
                    className="flex flex-col items-center cursor-pointer w-1/4"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/match/${currentMatch.fixture.id}/standings`);
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      className="text-gray-600"
                    >
                      <path
                        d="M12 4C11.17 4 10.36 4.16 9.59 4.47L7.75 6.32L16.68 15.25L18.53 13.4C18.84 12.64 19 11.83 19 11C19 7.13 15.87 4 12 4M5.24 8.66L6.66 7.24L7.93 8.51C8.74 8.2 9.56 8 10.4 7.83L12.24 5.96L3.31 14.89L5.24 8.66M13.6 16.6L5.33 21.88C5.72 22.4 6.29 22.88 6.93 23.17L8.77 21.33L16.36 13.74L13.6 16.6M15.25 17.75L13.4 19.6C12.64 19.84 11.83 20 11 20C7.13 20 4 16.87 4 13C4 12.17 4.16 11.36 4.47 10.59L6.32 8.75L15.25 17.75Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="text-[0.75rem] text-gray-600 mt-1">
                      Standings
                    </span>
                  </button>
                </div>

                </div>
            </div>

            {/* Navigation dots */}
            {allMatches.length > 1 && (
              <div className="flex justify-center gap-2 py-2 mt-2">
                {allMatches.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentMatchIndex(index);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                      index === currentMatchIndex ? "bg-black" : "bg-gray-300"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default MyHomeFeaturedMatchNew;
