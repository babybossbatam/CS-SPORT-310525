import { useState, useEffect } from "react";
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
  DEFAULT_POPULAR_LEAGUES,
  type FilterOptions
} from "@/lib/matchFilters";

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

  // Fetch matches from popular leagues with proper filtering
  useEffect(() => {
    const currentSeason = 2024;

    const fetchMatches = async () => {
      try {
        setIsLoading(true);

        // Use a smaller date range to reduce data
        const todayDate = "2025-05-19";
        const tomorrowDate = "2025-05-20";
        const yesterdayDate = "2025-05-18";
        // Only fetch 2 additional days
        const day3Date = "2025-05-21";
        const day4Date = "2025-05-22";

        // Include UEFA Conference League (848) and FIFA World Cup (1) with other popular leagues
        const leaguesWithConferenceAndWorldCup = [...DEFAULT_POPULAR_LEAGUES, 848, 1];

        // Fetch fixtures for popular leagues for latest season with better error handling
        const leaguePromises = leaguesWithConferenceAndWorldCup.map(async (leagueId) => {
          try {
            const response = await apiRequest(
              "GET",
              `/api/leagues/${leagueId}/fixtures?season=${currentSeason}`,
            );
            if (!response.ok) {
              console.log(
                `Error fetching league ${leagueId} fixtures: ${response.status}`,
              );
              return [];
            }
            return await response.json();
          } catch (error) {
            console.error(
              `Error processing league ${leagueId} fixtures:`,
              error,
            );
            return [];
          }
        });

        // Fetch today's fixtures with better error handling
        const todayPromise = (async () => {
          try {
            // Check localStorage for cached data
            const cacheKey = `/api/fixtures/date/${todayDate}`;
            const cachedData = localStorage.getItem(cacheKey);

            if (cachedData) {
              return JSON.parse(cachedData);
            }

            const response = await apiRequest(
              "GET",
              `/api/fixtures/date/${todayDate}`,
            );
            if (!response.ok) {
              console.log(
                `Error fetching today's fixtures: ${response.status}`,
              );
              return [];
            }

            const data = await response.json();
            localStorage.setItem(cacheKey, JSON.stringify(data)); // Store in localStorage
            return data;
          } catch (error) {
            console.error("Error processing today's fixtures:", error);
            return [];
          }
        })();

        // Fetch tomorrow's fixtures with better error handling
        const tomorrowPromise = (async () => {
          try {
            // Check localStorage for cached data
            const cacheKey = `/api/fixtures/date/${tomorrowDate}`;
            const cachedData = localStorage.getItem(cacheKey);

            if (cachedData) {
              return JSON.parse(cachedData);
            }

            const response = await apiRequest(
              "GET",
              `/api/fixtures/date/${tomorrowDate}`,
            );
            if (!response.ok) {
              console.log(
                `Error fetching tomorrow's fixtures: ${response.status}`,
              );
              return [];
            }

            const data = await response.json();
            localStorage.setItem(cacheKey, JSON.stringify(data)); // Store in localStorage
            return data;
          } catch (error) {
            console.error("Error processing tomorrow's fixtures:", error);
            return [];
          }
        })();

        // Fetch yesterday's fixtures with better error handling
        const yesterdayPromise = (async () => {
          try {
            // Check localStorage for cached data
            const cacheKey = `/api/fixtures/date/${yesterdayDate}`;
            const cachedData = localStorage.getItem(cacheKey);

            if (cachedData) {
              return JSON.parse(cachedData);
            }

            const response = await apiRequest(
              "GET",
              `/api/fixtures/date/${yesterdayDate}`,
            );
            if (!response.ok) {
              console.log(
                `Error fetching yesterday's fixtures: ${response.status}`,
              );
              return [];
            }

            const data = await response.json();
            localStorage.setItem(cacheKey, JSON.stringify(data)); // Store in localStorage
            return data;
          } catch (error) {
            console.error("Error processing yesterday's fixtures:", error);
            return [];
          }
        })();

        // Fetch day 3 fixtures
        const day3Promise = (async () => {
          try {
            // Check localStorage for cached data
            const cacheKey = `/api/fixtures/date/${day3Date}`;
            const cachedData = localStorage.getItem(cacheKey);

            if (cachedData) {
              return JSON.parse(cachedData);
            }

            const response = await apiRequest(
              "GET",
              `/api/fixtures/date/${day3Date}`,
            );
            if (!response.ok) {
              console.log(`Error fetching day 3 fixtures: ${response.status}`);
              return [];
            }

            const data = await response.json();
            localStorage.setItem(cacheKey, JSON.stringify(data)); // Store in localStorage
            return data;
          } catch (error) {
            console.error("Error processing day 3 fixtures:", error);
            return [];
          }
        })();

        // Fetch day 4 fixtures
        const day4Promise = (async () => {
          try {
            // Check localStorage for cached data
            const cacheKey = `/api/fixtures/date/${day4Date}`;
            const cachedData = localStorage.getItem(cacheKey);

            if (cachedData) {
              return JSON.parse(cachedData);
            }

            const response = await apiRequest(
              "GET",
              `/api/fixtures/date/${day4Date}`,
            );
            if (!response.ok) {
              console.log(`Error fetching day 4 fixtures: ${response.status}`);
              return [];
            }

            const data = await response.json();
            localStorage.setItem(cacheKey, JSON.stringify(data)); // Store in localStorage
            return data;
          } catch (error) {
            console.error("Error processing day 4 fixtures:", error);
            return [];
          }
        })();

        // Fetch standings for popular leagues to identify top teams
        const standingsPromises = leaguesWithConferenceAndWorldCup.map(async (leagueId) => {
          try {
            const response = await apiRequest(
              "GET",
              `/api/leagues/${leagueId}/standings`,
            );
            if (!response.ok) {
              console.log(
                `Error fetching league ${leagueId} standings: ${response.status}`,
              );
              return null;
            }
            return await response.json();
          } catch (error) {
            console.error(
              `Error processing league ${leagueId} standings:`,
              error,
            );
            return null;
          }
        });

        // Wait for all API calls to complete
        const [fixtureResults, standingsResults] = await Promise.all([
          Promise.all([
            ...leaguePromises,
            todayPromise,
            tomorrowPromise,
            yesterdayPromise,
            day3Promise,
            day4Promise,
          ]),
          Promise.all(standingsPromises),
        ]);

        // Combine and filter out duplicate matches
        const allMatches = Array.from(
          new Map(
            fixtureResults
              .flat()
              .filter(
                (match) =>
                  match && match.fixture && match.teams && match.league,
              )
              .map((match) => [match.fixture.id, match]),
          ).values(),
        );

        // Use a date that matches our fixture data to ensure we show matches within 8 hours
        // When using the real API, this will be 'new Date()' to always show recent matches
        const now = new Date();

        // Extract top 10 teams from standings for each league
        let topTeamIds: number[] = [];
        standingsResults.forEach((leagueStanding) => {
          if (
            leagueStanding &&
            leagueStanding.league &&
            leagueStanding.league.standings
          ) {
            leagueStanding.league.standings.forEach((standingGroup: any) => {
              // Get top 10 teams from each standings group
              if (Array.isArray(standingGroup) && standingGroup.length > 0) {
                const groupTopTeams = standingGroup
                  .slice(0, 10)
                  .map((teamData: any) => {
                    return teamData?.team?.id;
                  })
                  .filter(Boolean);
                topTeamIds.push(...groupTopTeams);
              }
            });
          }
        });

        // Use a more lenient filtering approach for featured matches

        // Filter matches from popular leagues first
        const popularLeagueMatches = allMatches.filter(match => {
          return DEFAULT_POPULAR_LEAGUES.includes(match.league.id) || 
                 match.league.id === 848 || // UEFA Conference League
                 match.league.id === 1;     // FIFA World Cup
        });

        // Sort matches by priority: Featured match first, then Live > Upcoming Within 24hours > Other Upcoming > Recent Finished
        const sortedMatches = popularLeagueMatches.sort((a, b) => {
          const aDate = new Date(a.fixture.date);
          const bDate = new Date(b.fixture.date);
          const aStatus = a.fixture.status.short;
          const bStatus = b.fixture.status.short;

          // Check for featured match (PSG vs Inter)
          const aIsFeatured = (a.teams.home.name === 'Paris Saint Germain' && a.teams.away.name === 'Inter') ||
                             (a.teams.home.name === 'Inter' && a.teams.away.name === 'Paris Saint Germain');
          const bIsFeatured = (b.teams.home.name === 'Paris Saint Germain' && a.teams.away.name === 'Inter') ||
                             (b.teams.home.name === 'Inter' && b.teams.away.name === 'Paris Saint Germain');

          // Featured match always comes first
          if (aIsFeatured && !bIsFeatured) return -1;
          if (!aIsFeatured && bIsFeatured) return 1;

          // Live matches first
          const aLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(aStatus);
          const bLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(bStatus);
          if (aLive && !bLive) return -1;
          if (!aLive && bLive) return 1;

          // Upcoming matches within 24 hours
          const hoursToA = (aDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          const hoursToB = (bDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          const aUpcomingSoon = aStatus === 'NS' && hoursToA >= 0 && hoursToA <= 24;
          const bUpcomingSoon = bStatus === 'NS' && hoursToB >= 0 && hoursToB <= 24;
          if (aUpcomingSoon && !bUpcomingSoon) return -1;
          if (!aUpcomingSoon && bUpcomingSoon) return 1;

          // Other upcoming matches (beyond 24 hours)
          const aOtherUpcoming = aStatus === 'NS' && hoursToA > 24;
          const bOtherUpcoming = bStatus === 'NS' && hoursToB > 24;
          if (aOtherUpcoming && !bOtherUpcoming) return -1;
          if (!aOtherUpcoming && bOtherUpcoming) return 1;

          // Recent finished matches (within last 12 hours)
          const hoursAgo = (now.getTime() - aDate.getTime()) / (1000 * 60 * 60);
          const hoursBgo = (now.getTime() - bDate.getTime()) / (1000 * 60 * 60);
          const aRecentFinished = aStatus === 'FT' && hoursAgo >= 0 && hoursAgo <= 12;
          const bRecentFinished = bStatus === 'FT' && hoursBgo >= 0 && hoursBgo <= 12;
          if (aRecentFinished && !bRecentFinished) return -1;
          if (!aRecentFinished && bRecentFinished) return 1;

          // Sort by date within same category
          return Math.abs(aDate.getTime() - now.getTime()) - Math.abs(bDate.getTime() - now.getTime());
        });

        // Take the top 8 matches
        const featuredMatches = sortedMatches.slice(0, 8);

        setMatches(featuredMatches);
      } catch (error) {
        console.error("Error fetching matches:", error);
        setError(error as Error);
        toast({
          title: "Error",
          description: "Failed to load matches. Retrying...",
          variant: "destructive",
        });
        // Retry after 5 seconds
        setTimeout(() => {
          fetchMatches();
        }, 5000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();

    // Refresh data every 5 minutes
    const interval = setInterval(
      () => {
        fetchMatches();
        // Clear local storage to re-fetch every day (or shorter interval if needed)
        localStorage.clear();
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [toast]);

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
      console.log(
        `Found match with countdown: ${matches[upcomingMatchIndex].teams.home.name} vs ${matches[upcomingMatchIndex].teams.away.name}`,
      );
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

        // For matches today, show a simple format
        if (daysToMatch === 0) {
          try {
            const hoursToMatch = Math.floor(msToMatch / (1000 * 60 * 60));
            // Calculate hours to match - if more than 12 hours away, return null to hide the timer
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
              // More than 8 hours away
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
                          ```text
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