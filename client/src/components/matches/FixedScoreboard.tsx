import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, addDays } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FixedMatchTimer from "./FixedMatchTimer";
import {
  filterPopularLeagueMatches,
  getMatchesWithinTimeWindow,
  type FilterOptions
} from "@/lib/matchFilters";
import { standingsUtils } from "@/lib/MyStandingsCachedNew";

import {
  type Team,
  type Fixture,
  type League,
  type Match,
} from "@/types/fixtures";

const FixedScoreboard = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Reset error state on component mount
  useEffect(() => {
    setError(null);
  }, []);

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

  const fetchFeaturedMatches = useCallback(
    async (forceRefresh = false) => {
      try {
        // Only show loading on initial load or force refresh
        if (forceRefresh || matches.length === 0) {
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
        const allFixtures: Match[] = [];

        console.log(
          "🔍 [FixedScoreboard] Starting fetch with priority leagues:",
          priorityLeagueIds,
        );
        console.log(
          "🔍 [FixedScoreboard] All featured league IDs:",
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
        let liveFixtures: Match[] = [];
        try {
          if (forceRefresh) {
            console.log(
              "🔴 [FixedScoreboard] Fetching live matches from dedicated endpoint",
            );
            const liveResponse = await apiRequest(
              "GET",
              "/api/featured-match/live?skipFilter=true",
            );
            const liveData = await liveResponse.json();

            if (Array.isArray(liveData)) {
              console.log(
                "🔍 [FixedScoreboard] Processing live fixtures:",
                liveData.length,
              );

              // First filter by featured leagues, then by valid teams
              const featuredLiveFixtures = liveData.filter((fixture) =>
                FEATURED_MATCH_LEAGUE_IDS.includes(fixture.league?.id),
              );

              console.log(
                "🔍 [FixedScoreboard] Featured live fixtures:",
                featuredLiveFixtures.length,
              );

              liveFixtures = featuredLiveFixtures
                .filter((fixture: any) => {
                  const isValid = isValidMatch(fixture);
                  if (!isValid) {
                    console.log(
                      "❌ [FixedScoreboard] Filtered out invalid fixture:",
                      {
                        home: fixture.teams?.home?.name,
                        away: fixture.teams?.away?.name,
                        league: fixture.league?.name,
                      },
                    );
                  } else {
                    console.log(
                      "✅ [FixedScoreboard] Valid featured live fixture:",
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
                    venue: fixture.fixture.venue,
                  },
                  league: {
                    id: fixture.league.id,
                    name: fixture.league.name,
                    country: fixture.league.country,
                    logo: fixture.league.logo,
                    round: fixture.league.round,
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
              `✅ [FixedScoreboard] Found ${liveFixtures.length} live matches (including all live matches regardless of league)`,
            );
          }
        } catch (error) {
          console.error(
            "❌ [FixedScoreboard] Error fetching live matches:",
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
                `🔍 [FixedScoreboard] Fetching cached data for league ${leagueId}`,
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
                        `✅ [FixedScoreboard] Including priority league ${leagueId} fixture:`,
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
                      venue: fixture.fixture.venue,
                    },
                    league: {
                      id: fixture.league.id,
                      name: fixture.league.name,
                      country: fixture.league.country,
                      logo: fixture.league.logo,
                      round: fixture.league.round,
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
                `🔍 [FixedScoreboard] Fetching cached data for ${dateInfo.label}: ${dateInfo.date}`,
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
                      venue: fixture.fixture.venue,
                    },
                    league: {
                      id: fixture.league.id,
                      name: fixture.league.name,
                      country: fixture.league.country,
                      logo: fixture.league.logo,
                      round: fixture.league.round,
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
                `❌ [FixedScoreboard] Error fetching cached data for ${dateInfo.label}:`,
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
          `📋 [FixedScoreboard] Total unique fixtures found:`,
          uniqueFixtures.length,
        );

        // Sort fixtures by priority
        const sortedFixtures = uniqueFixtures.sort((a: Match, b: Match) => {
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
        });

        // Take the top 8 matches
        const featuredMatches = sortedFixtures.slice(0, 8);

        console.log(
          `✅ [FixedScoreboard] Found ${featuredMatches.length} featured matches`,
        );

        // Only update state if data has actually changed
        setMatches((prevMatches) => {
          const newMatchesString = JSON.stringify(featuredMatches);
          const prevMatchesString = JSON.stringify(prevMatches);

          if (newMatchesString !== prevMatchesString) {
            return featuredMatches;
          }
          return prevMatches;
        });
      } catch (error) {
        console.error("❌ [FixedScoreboard] Error:", error);
        setError(error as Error);
        toast({
          title: "Error",
          description: "Failed to load matches. Retrying...",
          variant: "destructive",
        });
        // Retry after 5 seconds
        setTimeout(() => {
          fetchFeaturedMatches(true);
        }, 5000);
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    // Initial fetch with force refresh
    fetchFeaturedMatches(true);
  }, []); // Only run once on mount

  // Separate effect for live match refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      const hasLiveMatches = matches.some((match) =>
        ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
          match.fixture.status.short,
        ),
      );

      if (hasLiveMatches) {
        console.log(
          "🔄 [FixedScoreboard] Live matches detected, refreshing data",
        );
        fetchFeaturedMatches(false); // Background refresh without loading state
      } else {
        console.log(
          "⏸️ [FixedScoreboard] No live matches, skipping refresh",
        );
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, [matches]); // Only depend on matches for live match detection

  const currentMatch = matches[currentIndex];

  // Find and display match with countdown timer if one exists
  useEffect(() => {
    if (!matches.length) return;

    // Preload team logos
    matches.forEach((match) => {
      const homeLogo = match?.teams?.home?.logo;
      const awayLogo = match?.teams?.away?.logo;
      if (homeLogo) {
        const img = new Image();
        img.src = homeLogo;
      }
      if (awayLogo) {
        const img = new Image();
        img.src = awayLogo;
      }
    });

    // Find match within 8 hours window using extracted function
    const matchesWithinWindow = getMatchesWithinTimeWindow(matches, 8);
    const upcomingMatchIndex = matchesWithinWindow.length > 0 
      ? matches.findIndex(match => match.fixture.id === matchesWithinWindow[0].fixture.id)
      : -1;

    // If we found a match within 8 hours, display it
    if (upcomingMatchIndex !== -1) {
      setCurrentIndex(upcomingMatchIndex);
    }
  }, [matches]);

  // Only use effect for fetching match data
  useEffect(() => {
    // Just a placeholder to ensure the component works
    if (matches.length === 0) return;

    // Any additional match data initialization can go here if needed
  }, [matches]);

  // Navigation handlers
  const handlePrevious = () => {
    if (matches.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? matches.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (matches.length <= 1) return;
    setCurrentIndex((prev) => (prev === matches.length - 1 ? 0 : prev + 1));
  };

  const handleMatchClick = () => {
    if (currentMatch?.fixture?.id) {
      navigate(`/match/${currentMatch.fixture.id}`);
    }
  };

  // State to track elapsed time for live matches
  const [liveElapsed, setLiveElapsed] = useState<number | null>(null);

  // Update timer for live matches
  useEffect(() => {
    if (!currentMatch) return;

    // Only set up timer for live matches
    if (!["1H", "2H"].includes(currentMatch.fixture.status.short)) {
      setLiveElapsed(null);
      return;
    }

    // Initialize with current elapsed time from the API
    if (currentMatch.fixture.status.elapsed) {
      setLiveElapsed(currentMatch.fixture.status.elapsed);
    }

    // Update timer every minute for live matches
    const timer = setInterval(() => {
      setLiveElapsed((prev) => (prev !== null ? prev + 1 : prev));
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [currentMatch]);

  // Format match status to show appropriate information based on match state
  const getMatchStatus = (match: Match | undefined) => {
    if (!match) return "No Match Data";

    const { fixture } = match;
    // Use hardcoded "now" for demo purposes to match the fixture dates in our data
    const now = new Date();

    // LIVE MATCHES - show match minute or halftime
    if (
      ["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(
        fixture.status.short,
      )
    ) {
      // For halftime
      if (fixture.status.short === "HT") {
        return "Half Time";
      }
      // For live match with timer
      else if (["1H", "2H"].includes(fixture.status.short)) {
        // Use our tracked elapsed time if available, otherwise fall back to API
        const elapsed = liveElapsed || fixture.status.elapsed || 0;
        const halfLabel =
          fixture.status.short === "1H" ? "First half" : "Second half";
        return `${halfLabel}: ${elapsed}'`;
      }
      // For other live states
      else {
        return fixture.status.long || "LIVE";
      }
    }
    // FINISHED MATCHES
    else if (fixture.status.short === "FT") {
        try {
          const matchDate = parseISO(fixture.date);
          // Calculate how long ago match ended (add ~2 hours to start time)
          const estimatedEndTime = new Date(
            matchDate.getTime() + 2 * 60 * 60 * 1000,
          );
          const hoursSince = Math.floor(
            (now.getTime() - estimatedEndTime.getTime()) / (1000 * 60 * 60),
          );

          const statusText = hoursSince <= 1 ? "Ended" : hoursSince < 8 ? `${hoursSince}h ago` : "Full Time";
          return (
            <div className="flex flex-col items-center mt-0">{statusText}</div>
          );
        } catch (error) {
          return "Full Time";
        }
    }
    // UPCOMING MATCHES
    else {
      try {
        const matchDate = parseISO(fixture.date);
        const now = new Date(); // Use same hardcoded time as above for consistency

        // Get time differences in various units
        const msToMatch = matchDate.getTime() - now.getTime();
        const daysToMatch = Math.floor(msToMatch / (1000 * 60 * 60 * 24));

        // For matches today, show enhanced status
        if (daysToMatch === 0) {
          try {
            const hoursToMatch = Math.floor(msToMatch / (1000 * 60 * 60));
            const minutesToMatch = Math.floor((msToMatch % (1000 * 60 * 60)) / (1000 * 60));
            
            // Check if match is live
            if (['1H', '2H', 'HT', 'LIVE', 'BT', 'ET', 'P', 'SUSP', 'INT'].includes(fixture.status.short)) {
              const elapsed = liveElapsed || fixture.status.elapsed || 0;
              const halfLabel = fixture.status.short === '1H' ? '1st Half' : 
                               fixture.status.short === '2H' ? '2nd Half' : 
                               fixture.status.short === 'HT' ? 'Half Time' : 'LIVE';
              
              return (
                <div className="flex flex-col items-center space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-500 font-semibold animate-pulse">LIVE</span>
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <span className="text-black text-sm">
                    {fixture.status.short === 'HT' ? 'Half Time' : `${halfLabel}: ${elapsed}'`}
                  </span>
                </div>
              );
            }
            
            // Check if match has ended today
            if (fixture.status.short === 'FT' && hoursToMatch < 0) {
              const hoursAgo = Math.abs(hoursToMatch);
              const endedText = hoursAgo <= 1 ? 'Just Ended' : hoursAgo < 8 ? `${hoursAgo}h ago` : 'Ended Today';
              
              return (
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-gray-600 text-sm">{endedText}</span>
                  <div className="text-lg font-bold text-black flex items-center gap-2">
                    <span>{currentMatch?.goals?.home ?? 0}</span>
                    <span className="text-gray-400">-</span>
                    <span>{currentMatch?.goals?.away ?? 0}</span>
                  </div>
                </div>
              );
            }
            
            // Upcoming match today - show countdown if within 12 hours
            if (hoursToMatch >= 0 && hoursToMatch < 12) {
              return (
                <div className="flex flex-col space-y-0 relative pb-1">
                  <span className="text-black">Today</span>
                  <span className="text-red-500" style={{
                      fontSize: "0.975rem",
                      position: "absolute",
                      top: "0",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "200px",
                      textAlign: "center",
                      zIndex: 20,
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontWeight: "normal"
                    }}>
                      <FixedMatchTimer matchDate={matchDate.toISOString()} />
                    </span>
                </div>
              );
            } else {
              // More than 12 hours away
              return <span className="text-black">Today</span>;
            }
          } catch (e) {
            return <span className="text-black">Today</span>;
          }
        }

        // For matches tomorrow or later, show the regular format
        if (daysToMatch === 1) {
          return <span className="text-black">Tomorrow</span>;
        } else if (daysToMatch <= 7) {
          return <span className="text-black">{daysToMatch} more days</span>;
        } else {
          const daysToMatch = Math.ceil((matchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return <span className="text-black">{daysToMatch} more days</span>;
        }
      } catch (e) {
        return <span className="text-black">Upcoming</span>;
      }
    }
  };

  // Get match status label with proper formatting
  const getMatchStatusLabel = (match: Match | undefined) => {
    if (!match) return "";

    const { fixture, league } = match;

    if (
      ["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(
        fixture.status.short,
      )
    ) {
      return "LIVE";
    } else if (fixture.status.short === "FT") {
      return "FINISHED";
    } else {
      // Show league/tournament round for upcoming matches
      return league.round || "UPCOMING";
    }
  };

  // Team color helper function
  const getTeamColor = (teamId: number) => {
    const colors = [
      "#6f7c93", // blue-gray
      "#8b0000", // dark red
      "#1d3557", // dark blue
      "#2a9d8f", // teal
      "#e63946", // red
    ];
    return colors[teamId % colors.length];
  };

  return (
    <>
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
                  {getMatchStatusLabel(currentMatch) === "LIVE" ? (
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
                        getMatchStatusLabel(currentMatch) === "FINISHED"
                          ? "border-gray-500 text-gray-500"
                          : "border-blue-500 text-blue-500"
                      }`}
                    >
                      {getMatchStatusLabel(currentMatch)}
                    </Badge>
                  )}
            </div>
          </div>

        {matches.length > 1 && (
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
        {isLoading && matches.length === 0 ? (
          // Loading state with skeleton
          <div className="p-4">
            {/* League info skeleton */}
            <div className="flex items-center justify-center mb-4">
              <Skeleton className="h-5 w-5 rounded-full mr-2" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Match time skeleton */}
            <Skeleton className="h-6 w-40 mx-auto mb-6" />

            {/* Teams skeleton */}
            <div className="relative mt-4">
              <div className="flex justify-between items-center h-[53px] mb-8">
                <div className="flex items-center w-[45%]">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="h-6 w-24 ml-4" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex items-center justify-end w-[45%]">
                  <Skeleton className="h-6 w-24 mr-4" />
                  <Skeleton className="h-16 w-16 rounded-full" />
                </div>
              </div>
            </div>

            {/* Bottom nav skeleton */}
            <div className="flex justify-around mt-4 pt-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center w-1/4">
                  <Skeleton className="h-5 w-5 mb-1" />
                  <Skeleton className="h-3 w-16mb-1" />
                </div>
              ))}
            </div>
          </div>
        ) : !currentMatch ? (
          // Empty state - no matches available
          <div className="flex justify-center items-center py-14 text-gray-500">
            <span>No matches available at this moment</span>
          </div>
        ) : (
          // Matches available - show content
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden h-full w-full bg-white shadow-sm cursor-pointer"
              onClick={handleMatchClick}
            >
              <div className="p-0 h-full mt-0 mb-[10px] relative">
                {/* Fixed height container for match status and score */}
                <div
                  className="h-[98px] flex flex-col justify-center"
                  style={{ marginBottom: "-5px" }}
                >
                  {/* Match time/status display */}
                  <div className="text-center text-black"
                    style={{
                      fontSize: "calc(0.875rem * 1.5)",
                      fontWeight: "700",
                      color: "#000000",
                      marginTop: "-15px"
                    }}
                  >
                    {" "}
                    {getMatchStatus(currentMatch)}
                  </div>

                  {/* Score display for live and finished matches */}
                  {currentMatch?.fixture?.status?.short &&
                    (["1H", "2H", "HT", "ET", "P", "FT", "AET", "PEN"].includes(
                      currentMatch.fixture.status.short,
                    )) && (
                      <>
                        <div className="text-2xl text-black-500 font-bold flex items-center justify-center w-full">
                          <span>{currentMatch?.goals?.home ?? 0}</span>
                          <span className="text-2xl mx-2">-</span>
                          <span>{currentMatch?.goals?.away ?? 0}</span>
                        </div>
                      </>
                    )}
                </div>

                {/* Team scoreboard */}
                <div className="relative">
                  <div
                    className="flex relative h-[53px] rounded-md mb-8"
                    onClick={handleMatchClick}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="w-full h-full flex justify-between relative">
                      {/* Home team colored bar and logo */}
                      <div
                        className="h-full w-[calc(50%-16px)] ml-[77px] transition-all duration-500 ease-in-out opacity-100 relative"
                        style={{
                          background: getTeamColor(
                            currentMatch?.teams?.home?.id || 0,
                          ),
                          transition: "all 0.3s ease-in-out",
                        }}
                      >
                        {currentMatch?.teams?.home && (
                          <img
                            src={
                              currentMatch.teams.home.logo ||
                              `/assets/fallback-logo.svg`
                            }
                            alt={currentMatch.teams.home.name || "Home Team"}
                            className="absolute z-20 w-[64px] h-[64px] object-contain transition-all duration-300 ease-in-out hover:scale-110 hover:contrast-125 hover:brightness-110 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                            style={{
                              cursor: "pointer",
                              top: "calc(50% - 32px)",
                              left: "-32px",
                              filter: "contrast(115%) brightness(105%)",
                            }}
                            onClick={handleMatchClick}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (
                                target.src.includes("sportmonks") &&
                                currentMatch.teams.home.logo
                              ) {
                                target.src = currentMatch.teams.home.logo;
                              } else if (
                                target.src !== "/assets/fallback-logo.svg"
                              ) {
                                target.src = "/assets/fallback-logo.svg";
                              }
                            }}
                          />
                        )}
                      </div>

                      <div
                        className="absolute text-white uppercase text-center max-w-[160px] truncate md:max-w-[240px] font-sans"
                        style={{
                          top: "calc(50% - 13px)",
                          left: "120px",
                          fontSize: "1.24rem",
                          fontWeight: "normal",
                        }}
                      >
                        {currentMatch?.teams?.home?.name || "TBD"}
                      </div>

                      {/* VS circle */}
                      <div
                        className="absolute text-white font-bold text-sm rounded-full h-[52px] w-[52px] flex items-center justify-center z-30 border-2 border-white overflow-hidden"
                        style={{
                          background: "#a00000",
                          left: "calc(50% - 26px)",
                          top: "calc(50% - 26px)",
                          minWidth: "52px",
                        }}
                      >
                        <span className="vs-text font-bold">VS</span>
                      </div>

                      {/* Match date and venue - centered below VS */}
                      <div
                        className="absolute text-center text-xs text-black font-medium"
                        style={{
                          fontSize: "0.875rem",
                          whiteSpace: "nowrap",
                          overflow: "visible",
                          textAlign: "center",
                          position: "absolute",
                          left: "50%",
                          transform: "translateX(-50%)",
                          bottom: "-25px",
                          width: "max-content",
                          fontFamily: "'Inter', system-ui, sans-serif",
                        }}
                      >
                        {(() => {
                          try {
                            const matchDate = parseISO(
                              currentMatch.fixture.date,
                            );
                            const formattedDate = format(
                              matchDate,
                              "EEEE, do MMM",
                            );
                            const timeOnly = format(matchDate, "HH:mm");

                            return (
                              <>
                                {formattedDate} | {timeOnly}
                                {currentMatch.fixture.venue?.name
                                  ? ` | ${currentMatch.fixture.venue.name}`
                                  : ""}
                              </>
                            );
                          } catch (e) {
                            return currentMatch.fixture.venue?.name || "";
                          }
                                                })()}
                      </div>

                      {/* Away team colored bar and logo */}
                      <div
                        className="h-full w-[calc(50%-26px)] mr-[87px] transition-all duration-500 ease-in-out opacity-100"
                        style={{
                          background: getTeamColor(currentMatch.teams.away.id),
                          transition: "all 0.3s ease-in-out",
                        }}
                      ></div>

                      <div
                        className="absolute text-white uppercase text-center max-w-[120px] truncate md:max-w-[200px] font-sans"
                        style={{
                          top: "calc(50% - 13px)",
                          right: "130px",
                          fontSize: "1.24rem",
                          fontWeight: "normal",
                        }}
                      >
                        {currentMatch?.teams?.away?.name || "Away Team"}
                      </div>

                      <img
                        src={
                          currentMatch?.teams?.away?.logo ||
                          `/assets/fallback-logo.svg`
                        }
                        alt={currentMatch?.teams?.away?.name || "Away Team"}
                        className="absolute z-20 w-[64px] h-[64px] object-contain transition-all duration-300 ease-in-out hover:scale-110 hover:contrast-125 hover:brightness-110 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                        style={{
                          cursor: "pointer",
                          top: "calc(50% - 32px)",
                          right: "87px",
                          transform: "translateX(50%)",
                          filter: "contrast(115%) brightness(105%)",
                        }}
                        onClick={handleMatchClick}
                        onError={(e) => {
                          e.currentTarget.src = "/assets/fallback-logo.svg";
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom navigation */}
                <div className="flex justify-around border-t border-gray-200 pt-4">
                  <button
                    className="flex flex-col items-center cursor-pointer w-1/4"
                    onClick={() =>
                      currentMatch?.fixture?.id &&
                      navigate(`/match/${currentMatch.fixture.id}`)
                    }
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
                    onClick={() =>
                      currentMatch?.fixture?.id &&
                      navigate(`/match/${currentMatch.fixture.id}/lineups`)
                    }
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
                    onClick={() =>
                      currentMatch?.fixture?.id &&
                      navigate(`/match/${currentMatch.fixture.id}/h2h`)
                    }
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
                    onClick={() =>
                      currentMatch?.fixture?.id &&
                      navigate(`/match/${currentMatch.fixture.id}/standings`)
                    }
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
            </motion.div>
          </AnimatePresence>
        )}

        {/* Navigation dots */}
        {matches.length > 1 && (
          <div className="flex justify-center gap-2 py-2 mt-2">
            {matches.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  index === currentIndex ? "bg-black" : "bg-gray-300"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </Card>
    </>
  );
};

export default FixedScoreboard;