import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isValid, addDays } from "date-fns";
import { useCentralData } from '@/providers/CentralDataProvider';
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import { CacheManager } from "@/lib/cachingHelper";
import { backgroundCache } from "@/lib/backgroundCache";
import { apiRequest } from "@/lib/queryClient";
import { getCachedFixturesForDate, cacheFixturesForDate } from "@/lib/fixtureCache";
import { useQueryClient } from "@tanstack/react-query";

interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
}

const MyFeaturedMatchSlide: React.FC<MyHomeFeaturedMatchNewProps> = ({
  selectedDate,
  maxMatches = 1,
}) => {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Function to get tomorrow's cached data from central provider
  const getTomorrowsCachedData = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];

    return queryClient.getQueryData(['central-date-fixtures', tomorrowDate]);
  };

  // Get current date if not provided
  const currentDate = selectedDate || new Date().toISOString().split("T")[0];

  // Basic exclusion filter
  const shouldExcludeMatch = (fixture: any) => {
    if (!fixture || !fixture.league || !fixture.teams) {
      return true;
    }

    const leagueName = (fixture.league?.name || "").toLowerCase();

    // Exclude women's competitions
    if (leagueName.includes("women")) {
      return true;
    }

    // Exclude youth competitions
    if (
      leagueName.includes("u15") ||
      leagueName.includes("u16") ||
      leagueName.includes("u17") ||
      leagueName.includes("u18") ||
      leagueName.includes("u19") ||
      leagueName.includes("u20") ||
      leagueName.includes("u21") ||
      leagueName.includes("u23") ||
      leagueName.includes("youth") ||
      leagueName.includes("junior") ||
      leagueName.includes("reserve")
    ) {
      return true;
    }

    // Exclude non-competitive matches
    if (leagueName.includes("friendlies") || leagueName.includes("friendly")) {
      return true;
    }

    return false;
  };

  // Use central data cache like TodayMatchByTime
  const { fixtures, liveFixtures, isLoading, error: centralError } = useCentralData();

  console.log(`🏠 [MyHomeFeaturedMatchNew] Got ${fixtures?.length || 0} fixtures from central cache`);

  // Get featured matches using the same filtering logic as TodayPopularFootballLeaguesNew
  useEffect(() => {
    const getFeaturedMatches = () => {
      try {
        console.log("🏠 [MyHomeFeaturedMatchNew] === APPLYING SAME FILTERING AS TODAYPOPULARLEAGUE ===");
        setLoading(true);
        setError(null);

        if (!fixtures?.length) {
          console.log("🏠 [MyHomeFeaturedMatchNew] No fixtures available from central cache");
          setMatches([]);
          setLoading(false);
          return;
        }

        console.log(`🏠 [MyHomeFeaturedMatchNew] Found ${fixtures.length} fixtures from central data`);

        // Apply smart time filtering first like TodayMatchByTime
        const timeFilterResult = MySmartTimeFilter.filterTodayFixtures(fixtures, currentDate);
        const timeFiltered = timeFilterResult.todayFixtures;
        console.log(`🏠 [MyHomeFeaturedMatchNew] After time filtering: ${timeFiltered.length} fixtures`);

        // Apply the same filtering logic as TodayPopularFootballLeaguesNew
        const POPULAR_LEAGUES = [2, 3, 848, 39, 140, 135, 78, 61, 45, 48, 143, 137, 81, 66, 301, 233];
        const POPULAR_COUNTRIES = ["England", "Spain", "Italy", "Germany", "France", "World", "Europe", "South America", "Brazil", "Saudi Arabia", "Egypt", "Colombia", "United States", "USA", "US", "United Arab Emirates"];

        const filteredMatches = timeFiltered.filter(fixture => {
          // Basic validation
          if (!fixture || !fixture.league || !fixture.teams || !fixture.fixture) {
            console.log("🏠 [MyHomeFeaturedMatchNew] Filtered out fixture due to missing data:", {
              hasFixture: !!fixture,
              hasLeague: !!fixture?.league,
              hasTeams: !!fixture?.teams,
              hasFixtureData: !!fixture?.fixture
            });
            return false;
          }

          // Apply exclusion filters (same as TodayPopularFootballLeaguesNew)
          if (shouldExcludeMatch(fixture)) {
            return false;
          }

          const leagueId = fixture.league?.id;
          const country = fixture.league?.country?.toLowerCase() || "";
          const leagueName = fixture.league?.name?.toLowerCase() || "";

          // Check if it's a popular league
          const isPopularLeague = POPULAR_LEAGUES.includes(leagueId);

          // Check if it's from a popular country
          const isFromPopularCountry = POPULAR_COUNTRIES.some(
            (popularCountry) => country.includes(popularCountry.toLowerCase())
          );

          // Check if it's an international competition
          const isInternationalCompetition =
            leagueName.includes("champions league") ||
            leagueName.includes("europa league") ||
            leagueName.includes("conference league") ||
            leagueName.includes("uefa") ||
            leagueName.includes("world cup") ||
            leagueName.includes("fifa") ||
            leagueName.includes("conmebol") ||
            leagueName.includes("copa america") ||
            leagueName.includes("copa libertadores") ||
            leagueName.includes("copa sudamericana") ||
            country.includes("world") ||
            country.includes("europe") ||
            country.includes("international");

          return isPopularLeague || isFromPopularCountry || isInternationalCompetition;
        });

        console.log(`🏠 [MyHomeFeaturedMatchNew] Filtered to ${filteredMatches.length} matches`);

        // Prioritize matches exactly like TodayPopularFootballLeaguesNew
        const featuredMatches = filteredMatches
          .sort((a, b) => {
            // Priority 1: Live matches first
            const aLive = ["1H", "2H", "HT", "LIVE", "ET", "BT", "P", "INT"].includes(a.fixture?.status?.short);
            const bLive = ["1H", "2H", "HT", "LIVE", "ET", "BT", "P", "INT"].includes(b.fixture?.status?.short);

            if (aLive && !bLive) return -1;
            if (!aLive && bLive) return 1;

            // Priority 2: Top tier leagues (Champions League, Premier League, etc.)
            const topTierLeagues = [2, 3, 39, 140, 135, 78]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga
            const aTopTier = topTierLeagues.includes(a.league?.id);
            const bTopTier = topTierLeagues.includes(b.league?.id);

            if (aTopTier && !bTopTier) return -1;
            if (!aTopTier && bTopTier) return 1;

            // Priority 3: Popular leagues
            const aPopular = POPULAR_LEAGUES.includes(a.league?.id);
            const bPopular = POPULAR_LEAGUES.includes(b.league?.id);

            if (aPopular && !bPopular) return -1;
            if (!aPopular && bPopular) return 1;

            // Priority 4: Sort by date (earlier matches first)
            return new Date(a.fixture?.date || 0).getTime() - new Date(b.fixture?.date || 0).getTime();
          })
          .slice(0, maxMatches || 9); // Take top matches for carousel

        console.log(`🏠 [MyHomeFeaturedMatchNew] Selected ${featuredMatches.length} featured matches`);

        setMatches(featuredMatches);
        setCurrentIndex(0);
      } catch (error) {
        console.error("🏠 [MyHomeFeaturedMatchNew] Error getting featured matches:", error);
        setError(error instanceof Error ? error.message : "Unknown error occurred");
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    getFeaturedMatches();
  }, [fixtures, liveFixtures, currentDate, maxMatches]);

  // Memoize current match
  const currentMatch = useMemo(() => {
    if (!Array.isArray(matches) || matches.length === 0 || currentIndex < 0 || currentIndex >= matches.length) {
      console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Invalid array access:", {
        isArray: Array.isArray(matches),
        length: matches?.length || 0,
        currentIndex,
        isValidIndex: currentIndex >= 0 && currentIndex < (matches?.length || 0)
      });
      return null;
    }
    
    const match = matches[currentIndex];
    console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Current match memoization:");
    console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] - Current index:", currentIndex);
    console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] - Total matches:", matches.length);
    console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] - Current match:", match ? {
      homeTeam: match.teams?.home?.name,
      awayTeam: match.teams?.away?.name,
      league: match.league?.name,
      status: match.fixture?.status?.short
    } : null);
    return match;
  }, [matches, currentIndex]);

  // Memoize match validation
  const isValidMatch = useMemo(() => {
    const isValid = currentMatch &&
      currentMatch.teams &&
      currentMatch.teams.home &&
      currentMatch.teams.away &&
      currentMatch.fixture &&
      currentMatch.league;

    console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Match validation result:", isValid);
    if (!isValid && currentMatch) {
      console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Validation failed - missing:", {
        hasMatch: !!currentMatch,
        hasTeams: !!currentMatch?.teams,
        hasHome: !!currentMatch?.teams?.home,
        hasAway: !!currentMatch?.teams?.away,
        hasFixture: !!currentMatch?.fixture,
        hasLeague: !!currentMatch?.league
      });
    }

    return isValid;
  }, [currentMatch]);

  // Memoize navigation handlers
  const handlePrevious = useCallback(() => {
    console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Previous button clicked");
    if (matches.length <= 1) {
      console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Cannot navigate - insufficient matches");
      return;
    }
    const newIndex = currentIndex > 0 ? currentIndex - 1 : matches.length - 1;
    console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Navigating from index", currentIndex, "to", newIndex);
    setCurrentIndex(newIndex);
  }, [matches.length, currentIndex]);

  const handleNext = useCallback(() => {
    console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Next button clicked");
    if (matches.length <= 1) {
      console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Cannot navigate - insufficient matches");
      return;
    }
    const newIndex = currentIndex < matches.length - 1 ? currentIndex + 1 : 0;
    console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Navigating from index", currentIndex, "to", newIndex);
    setCurrentIndex(newIndex);
  }, [matches.length, currentIndex]);

  const handleMatchClick = useCallback(() => {
    if (isValidMatch && currentMatch.fixture.id) {
      navigate(`/match/${currentMatch.fixture.id}`);
    }
  }, [isValidMatch, currentMatch, navigate]);

  // Memoize match status functions for better performance
  const getMatchStatus = useCallback((match) => {
    if (!match) return "";
    const status = match.fixture.status.short;
    const elapsed = match.fixture.status.elapsed;

    if (["1H", "2H"].includes(status)) {
      return `${elapsed}'`;
    }
    if (status === "HT") return "HT";
    if (status === "FT") return "FT";
    if (status === "NS") {
      const matchDate = new Date(match.fixture.date);
      return format(matchDate, "HH:mm");
    }
    return status;
  }, []);

  const getMatchStatusLabel = useCallback((match) => {
    if (!match) return "";

    const { fixture } = match;

    if (
      ["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(
        fixture.status.short,
      )
    ) {
      return "LIVE";
    } else if (fixture.status.short === "FT") {
      return "FINISHED";
    } else {
      return "UPCOMING";
    }
  }, []);

  const getTeamColor = useCallback((teamId) => {
    const colors = [
      "#6f7c93", // blue-gray
      "#8b0000", // dark red
      "#1d3557", // dark blue
      "#2a9d8f", // teal
      "#e63946", // red
    ];
    return colors[teamId % colors.length];
  }, []);

  // Error state
  if (error) {
    console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] 🚫 RENDERING: Error state");
    return (
      <Card className="bg-white rounded-lg shadow-md mb-8 overflow-hidden relative">
        <Badge
          variant="secondary"
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
        >
          Featured Match
        </Badge>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">Error Loading Featured Match</p>
            <p className="text-sm text-center">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setMatches([]);
                setCurrentIndex(0);
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state with proper skeleton
  if (loading || isLoading) {
    console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] 🔄 RENDERING: Loading state");
    return (
      <Card className="bg-white rounded-lg shadow-md mb-8 overflow-hidden relative">
        <Badge
          variant="secondary"
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
        >
          Featured Match
        </Badge>

        {/* Skeleton loading content */}
        <CardContent className="p-0">
          {/* League info skeleton */}
          <div className="bg-white p-2 mt-6 relative mt-4 mb-4">
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 bg-gray-200 rounded mr-2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-16 ml-2 animate-pulse" />
            </div>
          </div>

          {/* Score display skeleton */}
          <div className="match-score-container">
            <div className="match-score-display mb-4 flex items-center justify-center">
              <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
            </div>
            <div className="match-status-label flex justify-center">
              <div className="h-5 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
          </div>

          {/* Team scoreboard skeleton */}
          <div className="relative px-6">
            <div className="flex relative h-[53px] rounded-md mb-8">
              <div className="w-full h-full flex justify-between relative">
                {/* Home team skeleton */}
                <div className="h-full w-[calc(50%-16px)] ml-[77px] bg-gray-300 animate-pulse relative">
                  <div
                    className="absolute z-20 w-[64px] h-[64px] bg-gray-200 rounded-full animate-pulse"
                    style={{
                      top: "calc(50% - 32px)",
                      left: "-32px",
                    }}
                  />
                </div>

                <div
                  className="absolute bg-gray-200 rounded w-32 h-6 animate-pulse"
                  style={{
                    top: "calc(50% - 12px)",
                    left: "112px",
                  }}
                />

                {/* VS circle skeleton */}
                <div
                  className="absolute bg-gray-300 rounded-full h-[52px] w-[52px] flex items-center justify-center z-30 animate-pulse"
                  style={{
                    left: "calc(50% - 26px)",
                    top: "calc(50% - 26px)",
                  }}
                >
                  <div className="h-3 bg-gray-400 rounded w-6" />
                </div>

                {/* Away team skeleton */}
                <div className="h-full w-[calc(50%-26px)] mr-[87px] bg-gray-300 animate-pulse" />

                <div
                  className="absolute bg-gray-200 rounded w-32 h-6 animate-pulse"
                  style={{
                    top: "calc(50% - 12px)",
                    right: "130px",
                  }}
                />

                <div
                  className="absolute z-20 w-[64px] h-[64px] bg-gray-200 rounded-full animate-pulse"
                  style={{
                    top: "calc(50% - 32px)",
                    right: "87px",
                    transform: "translateX(50%)",
                  }}
                />
              </div>
            </div>

            {/* Match date skeleton */}
            <div className="flex justify-center mt-8">
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
            </div>
          </div>

          {/* Bottom navigation skeleton */}
          <div className="flex justify-around border-t border-gray-200 pt-4 mt-12 pb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center w-1/4">
                <div className="w-[18px] h-[18px] bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 bg-gray-200 rounded w-12 animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // No matches state
  if (!isValidMatch || matches.length === 0) {
    console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] 🚫 RENDERING: No matches state");
    console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] - isValidMatch:", isValidMatch);
    console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] - matches.length:", matches.length);
    return (
      <Card className="bg-white rounded-lg shadow-md mb-8 overflow-hidden relative">
        <Badge
          variant="secondary"
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
        >
          Featured Match
        </Badge>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">
              No featured matches available
            </p>
            <p className="text-sm">No matches available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] ✅ RENDERING: Success state");
  console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Final render data:", {
    currentIndex,
    totalMatches: matches.length,
    currentMatch: currentMatch ? {
      id: currentMatch.fixture?.id,
      homeTeam: currentMatch.teams?.home?.name,
      awayTeam: currentMatch.teams?.away?.name,
      league: currentMatch.league?.name,
      status: currentMatch.fixture?.status?.short,
      date: currentMatch.fixture?.date
    } : null,
    hasNavigation: matches.length > 1
  });

  return (
    <Card className="px-0 pt-0 pb-2 relative shadow-md mb-8">
      <Badge
        variant="secondary"
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
      >
        Featured Match
      </Badge>

      {/* Navigation arrows */}
      {matches.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 w-10 h-10 rounded-full shadow-lg border border-gray-200 z-40 flex items-center justify-center transition-all duration-200 hover:shadow-xl"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 w-10 h-10 rounded-full shadow-lg border border-gray-200 z-40 flex items-center justify-center transition-all duration-200 hover:shadow-xl"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

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
          {/* League info section */}
          <div className="bg-white p-2 mt-6 relative mt-4 mb-4">
            <div className="flex items-center justify-center">
              {currentMatch?.league?.logo ? (
                <img
                  src={currentMatch.league.logo}
                  alt={currentMatch.league.name}
                  className="w-5 h-5 object-contain mr-2 drop-shadow-md"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/fallback-logo.svg";
                  }}
                />
              ) : (
                <Trophy className="w-5 h-5 text-amber-500 mr-2" />
              )}
              <span className="text-sm font-medium">
                {currentMatch?.league?.name || "League Name"}
              </span>
              {getMatchStatusLabel(currentMatch) === "LIVE" ? (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 border border-red-500 text-red-500 animate-pulse ml-2"
                >
                  LIVE
                </Badge>
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

          {/* Combined Score and Status Display */}
          <div
            className="score-area"
            style={{
              height: "80px",
              gridArea: "score",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              fontSize: "calc(1.125rem * 0.968)",
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {(() => {
              const status = currentMatch?.fixture?.status?.short;
              const elapsed = currentMatch?.fixture?.status?.elapsed;
              const isLive = getMatchStatusLabel(currentMatch) === "LIVE";
              const hasScore = currentMatch?.fixture?.status?.short &&
                ["1H", "2H", "HT", "ET", "P", "FT", "AET", "PEN"].includes(status);

              // Combined display logic
              if (hasScore) {
                // Show status and score together
                const statusText = (() => {
                  if (["1H", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                    return `${elapsed || 0}'`;
                  }
                  if (status === "HT") return "HT";
                  if (status === "FT") return "FT";
                  if (status === "AET") return "AET";
                  if (status === "PEN") return "PEN";
                  return status || "";
                })();

                const scoreText = `${currentMatch?.goals?.home ?? 0}   -   ${currentMatch?.goals?.away ?? 0}`;

                return (
                  <div style={{ 
                    color: isLive ? "#dc2626" : "#1a1a1a",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px"
                  }}>
                    <div style={{ 
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      {statusText}
                    </div>
                    <div style={{ fontSize: "1.125rem" }}>
                      {scoreText}
                    </div>
                  </div>
                );
              } else {
                // Show only status for upcoming matches
                const statusText = (() => {
                  if (status === "NS") return "UPCOMING";
                  return status || "UPCOMING";
                })();

                return (
                  <div style={{ 
                    color: "#6b7280",
                    fontSize: "0.875rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    {statusText}
                  </div>
                );
              }
            })()}
          </div>

          {/* Team scoreboard with colored bars */}
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
                      className="absolute z-20 w-[64px] h-[64px] object-cover rounded-full transition-opacity duration-200"
                      style={{
                        cursor: "pointer",
                        top: "calc(50% - 32px)",
                        left: "-32px",
                        filter:
                          "contrast(115%) brightness(105%) drop-shadow(4px 4px 6px rgba(0, 0, 0, 0.3))",
                      }}
                      onClick={handleMatchClick}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = "/assets/fallback-logo.svg";
                      }}
                      onLoad={(e) => {
                        e.currentTarget.style.opacity = "1";
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
                  className="absolute z-20 w-[64px] h-[64px] object-cover rounded-full transition-all duration-300 ease-in-out hover:scale-110 hover:contrast-125 hover:brightness-110 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  style={{
                    cursor: "pointer",
                    top: "calc(50% - 32px)",
                    right: "87px",
                    transform: "translateX(50%)",
                    filter:
                      "contrast(115%) brightness(105%) drop-shadow(4px 4px 6px rgba(0, 0, 0, 0.3))",
                  }}
                  onClick={handleMatchClick}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/fallback-logo.svg";
                  }}
                  onLoad={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                />
              </div>
            </div>

            {/* Match date and venue */}
            <div
              className="absolute text-center text-xs text-black font-medium"
              style={{
                fontSize: "0.875rem",
                whiteSpace: "nowrap",
                overflow: "visible",
                textAlign: "center",
                position: "flex",
                left: "50%",
                transform: "translateX(-50%)",
                top: "calc(100% + 20px)",
                width: "max-content",
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              {(() => {
                try {
                  const matchDate = parseISO(currentMatch.fixture.date);
                  const formattedDate = format(matchDate, "EEEE, do MMM");
                  const timeOnly = format(matchDate, "HH:mm");
                  const isUpcoming =
                    currentMatch.fixture.status.short === "NS" ||
                    currentMatch.fixture.status.short === "TBD";

                  return (
                    <>
                      {formattedDate}
                      {!isUpcoming && ` | ${timeOnly}`}
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
          </div>

          {/* Bottom navigation */}
          <div className="flex justify-around border-t border-gray-200 pt-4 mt-12 pb-4">
            <button
              className="flex flex-col items-center cursor-pointer w-1/4"
              onClick={() => {
                if (currentMatch?.fixture?.id) {
                  navigate(`/match/${currentMatch.fixture.id}`);
                }
              }}
            >
              <img
                src="/assets/matchdetaillogo/MatchDetail.svg"
                alt="Match Page"
                width="18"
                height="18"
                className="text-gray-600"
              />
              <span className="text-[0.75rem] text-gray-600 mt-1">Match Page
              </span>
            </button>
            <button
              className="flex flex-col items-center cursor-pointer w-1/4"
              onClick={() => {
                if (currentMatch?.fixture?.id) {
                  navigate(`/match/${currentMatch.fixture.id}/lineups`);
                }
              }}
            >
              <img
                src="/assets/matchdetaillogo/lineups.svg"
                alt="Lineups"
                width="18"
                height="18"
                className="text-gray-600"
              />
              <span className="text-[0.75rem] text-gray-600 mt-1">Lineups</span>
            </button>
            <button
              className="flex flex-col items-center cursor-pointer w-1/4"
              onClick={() => {
                if (currentMatch?.fixture?.id) {
                  navigate(`/match/${currentMatch.fixture.id}/h2h`);
                }
              }}
            >
              <img
                src="/assets/matchdetaillogo/stats.svg"
                alt="H2H"
                width="18"
                height="18"
                className="text-gray-600"
              />
              <span className="text-[0.75rem] text-gray-600 mt-1">H2H</span>
            </button>
            <button
              className="flex flex-col items-center cursor-pointer w-1/4"
              onClick={() => {
                if (currentMatch?.fixture?.id) {
                  navigate(`/match/${currentMatch.fixture.id}/standings`);
                }
              }}
            >
              <img
                src="/assets/matchdetaillogo/standings.svg"
                alt="Standings"
                width="18"
                height="18"
                className="text-gray-600"
              />
              <span className="text-[0.75rem] text-gray-600 mt-1">
                Standings
              </span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation dots */}
      {matches.length > 1 && (
        <div className="flex justify-center gap-2 py-2 mt-2">
          {matches.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-1 h-1 rounded-full transition-all duration-200 ${
                index === currentIndex ? "bg-black" : "bg-gray-300"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </Card>
  );
};

export default MyFeaturedMatchSlide;