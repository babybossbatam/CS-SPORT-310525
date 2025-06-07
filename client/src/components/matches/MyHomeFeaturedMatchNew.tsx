import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isValid, addDays } from "date-fns";
import { CacheManager } from "@/lib/cachingHelper";
import { backgroundCache } from "@/lib/backgroundCache";
import { apiRequest } from "@/lib/queryClient";

interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
}

const MyFeaturedMatchSlide: React.FC<MyHomeFeaturedMatchNewProps> = ({
  selectedDate,
  maxMatches = 1,
}) => {
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Get featured matches from cached popular leagues data
  useEffect(() => {
    const getFeaturedMatches = async () => {
      try {
        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] === STARTING FEATURED MATCH FETCH ===");
        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Current date:", currentDate);
        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Max matches:", maxMatches);
        
        setLoading(true);

        // Check cache first
        const cacheKey = ["featured-matches-from-popular-cache", currentDate];
        const cachedData = CacheManager.getCachedData(cacheKey, 10 * 60 * 1000); // 10 minutes cache

        if (cachedData) {
          console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] ✅ CACHE HIT - Using cached data");
          console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Cached matches count:", cachedData.length);
          console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Cache data preview:", cachedData.slice(0, 2).map(m => ({
            id: m.fixture?.id,
            homeTeam: m.teams?.home?.name,
            awayTeam: m.teams?.away?.name,
            league: m.league?.name,
            status: m.fixture?.status?.short
          })));
          
          setMatches(cachedData);
          setCurrentIndex(0);
          setLoading(false);
          return;
        }

        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] ❌ CACHE MISS - Fetching new data");
        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Cache key:", cacheKey);

        // Get dates for today, tomorrow, and day after tomorrow
        const today = new Date();
        const todayString = format(today, "yyyy-MM-dd");
        const tomorrow = addDays(today, 1);
        const tomorrowString = format(tomorrow, "yyyy-MM-dd");
        const dayAfterTomorrow = addDays(today, 2);
        const dayAfterTomorrowString = format(dayAfterTomorrow, "yyyy-MM-dd");

        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Date processing:");
        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Today:", todayString);
        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Tomorrow:", tomorrowString);
        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Day After Tomorrow:", dayAfterTomorrowString);

        const allFeaturedMatches = [];
        const seenMatches = new Set<string>();

        // Fetch matches from popular leagues cache for each date
        const datesToFetch = [
          { date: todayString, label: "Today" },
          { date: tomorrowString, label: "Tomorrow" },
          { date: dayAfterTomorrowString, label: "Day After Tomorrow" },
        ];

        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Processing dates:", datesToFetch.map(d => d.label));

        for (const { date, label } of datesToFetch) {
          try {
            console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] === PROCESSING ${label.toUpperCase()} (${date}) ===`);

            // Try to get cached popular leagues data
            const popularLeaguesCacheKey = ["all-fixtures-by-date", date];
            let popularLeaguesData = CacheManager.getCachedData(
              popularLeaguesCacheKey,
              30 * 60 * 1000, // 30 minutes - same as popular leagues cache
            );

            console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] Cache key for ${label}:`, popularLeaguesCacheKey);
            console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] Raw cache data length for ${label}:`, popularLeaguesData?.length || 0);

            if (!popularLeaguesData || popularLeaguesData.length === 0) {
              console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] ❌ No cached data for ${label} - FETCHING FROM API`);
              
              // Fetch from API if cache is empty
              try {
                const response = await apiRequest('GET', `/api/fixtures/date/${date}?all=true`);
                if (response.ok) {
                  popularLeaguesData = await response.json();
                  console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] ✅ Fetched ${popularLeaguesData?.length || 0} fixtures from API for ${label}`);
                  
                  // Cache the data for future use
                  if (popularLeaguesData && popularLeaguesData.length > 0) {
                    CacheManager.setCachedData(popularLeaguesCacheKey, popularLeaguesData);
                  }
                } else {
                  console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] ❌ API request failed for ${label}:`, response.status);
                  continue;
                }
              } catch (apiError) {
                console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] ❌ API request error for ${label}:`, apiError);
                continue;
              }
            }

            if (!popularLeaguesData || popularLeaguesData.length === 0) {
              console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] ❌ No data available for ${label} - SKIPPING`);
              continue;
            }

            // Apply exclusion filter to get valid matches
            const validMatches = popularLeaguesData.filter(
              (fixture) => !shouldExcludeMatch(fixture),
            );

            console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] Valid matches after exclusion for ${label}:`, validMatches.length);
            console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] Excluded ${popularLeaguesData.length - validMatches.length} matches for ${label}`);

            // Analyze match statuses before prioritization
            const statusCounts = validMatches.reduce((acc, match) => {
              const status = match.fixture?.status?.short || 'UNKNOWN';
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {});

            console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] Match status breakdown for ${label}:`, statusCounts);

            // Prioritize matches by:
            // 1. Live matches first
            // 2. Popular leagues (Champions League, Europa League, Premier League, etc.)
            // 3. Popular teams
            // 4. Upcoming matches in chronological order
            const prioritizedMatches = validMatches.sort((a, b) => {
              // Priority 1: Live matches
              const aLive = ["1H", "2H", "HT", "LIVE", "ET", "BT", "P"].includes(a.fixture?.status?.short);
              const bLive = ["1H", "2H", "HT", "LIVE", "ET", "BT", "P"].includes(b.fixture?.status?.short);

              if (aLive && !bLive) return -1;
              if (!aLive && bLive) return 1;

              // Priority 2: Popular leagues (UEFA competitions, top 5 leagues)
              const popularLeagueIds = [2, 3, 848, 39, 140, 135, 78, 61]; // Champions League, Europa League, Conference League, Premier League, La Liga, Serie A, Bundesliga, Ligue 1
              const aPopularLeague = popularLeagueIds.includes(a.league?.id);
              const bPopularLeague = popularLeagueIds.includes(b.league?.id);

              if (aPopularLeague && !bPopularLeague) return -1;
              if (!aPopularLeague && bPopularLeague) return 1;

              // Priority 3: By fixture date (earlier matches first for upcoming)
              const aDate = new Date(a.fixture?.date || 0);
              const bDate = new Date(b.fixture?.date || 0);
              return aDate.getTime() - bDate.getTime();
            });

            // Analyze top matches after prioritization
            const topMatches = prioritizedMatches.slice(0, 10);
            console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] Top 10 prioritized matches for ${label}:`);
            topMatches.forEach((match, idx) => {
              console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] ${idx + 1}. ${match.teams?.home?.name} vs ${match.teams?.away?.name} (${match.league?.name}, Status: ${match.fixture?.status?.short})`);
            });

            // Take top matches for this date, avoiding duplicates
            const matchesToAdd = [];
            let duplicateCount = 0;
            
            for (const match of prioritizedMatches) {
              const matchKey = `${match.fixture?.id}-${match.teams?.home?.name}-${match.teams?.away?.name}`;

              if (seenMatches.has(matchKey)) {
                duplicateCount++;
                continue;
              }

              if (matchesToAdd.length < 4) {
                seenMatches.add(matchKey);
                matchesToAdd.push(match);
              } else {
                break;
              }
            }

            console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] Duplicate detection for ${label}:`);
            console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] - Duplicates found: ${duplicateCount}`);
            console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] - Matches added: ${matchesToAdd.length}/4`);
            console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] - Total seen matches: ${seenMatches.size}`);

            allFeaturedMatches.push(...matchesToAdd);

            console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] Selected matches from ${label}:`);
            matchesToAdd.forEach((match, idx) => {
              console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] ${idx + 1}. ${match.teams?.home?.name} vs ${match.teams?.away?.name} (ID: ${match.fixture?.id}, League: ${match.league?.name}, Status: ${match.fixture?.status?.short})`);
            });
          } catch (error) {
            console.error(
              `🔍 [FeaturedMatch] Error extracting data for ${date}:`,
              error,
            );
          }
        }

        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] === FINAL PROCESSING ===");
        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Total collected matches:", allFeaturedMatches.length);

        // Take first 9 matches total and validate
        const finalMatches = allFeaturedMatches.slice(0, 9);
        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Matches after slicing to 9:", finalMatches.length);

        // Validate data structure
        const validMatches = finalMatches.filter((match) => {
          const isValid =
            match &&
            match.teams &&
            match.teams.home &&
            match.teams.away &&
            match.fixture &&
            match.league;

          if (!isValid) {
            console.warn("🏠 [MyHomeFeaturedMatchNew Debugging report] ❌ Invalid match data:", {
              hasMatch: !!match,
              hasTeams: !!match?.teams,
              hasHome: !!match?.teams?.home,
              hasAway: !!match?.teams?.away,
              hasFixture: !!match?.fixture,
              hasLeague: !!match?.league
            });
          }
          return isValid;
        });

        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Valid matches after validation:", validMatches.length);
        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Invalid matches removed:", finalMatches.length - validMatches.length);

        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Final match summary:");
        validMatches.forEach((match, idx) => {
          console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report] ${idx + 1}. ${match.teams?.home?.name} vs ${match.teams?.away?.name}`);
          console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report]    League: ${match.league?.name}`);
          console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report]    Status: ${match.fixture?.status?.short}`);
          console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report]    Date: ${match.fixture?.date}`);
          console.log(`🏠 [MyHomeFeaturedMatchNew Debugging report]    ID: ${match.fixture?.id}`);
        });

        // Cache the result
        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Caching results with key:", cacheKey);
        CacheManager.setCachedData(cacheKey, validMatches);
        backgroundCache.set(
          `featured-matches-from-popular-cache-${currentDate}`,
          validMatches,
          10 * 60 * 1000,
        );

        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] ✅ Setting state with", validMatches.length, "matches");
        setMatches(validMatches);
        setCurrentIndex(0);
      } catch (error) {
        console.error("🏠 [MyHomeFeaturedMatchNew Debugging report] ❌ ERROR occurred:", error);
        console.error("🏠 [MyHomeFeaturedMatchNew Debugging report] Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        setMatches([]);
      } finally {
        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] === FETCH COMPLETED ===");
        console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] Setting loading to false");
        setLoading(false);
      }
    };

    console.log("🏠 [MyHomeFeaturedMatchNew Debugging report] 🚀 INITIATING getFeaturedMatches()");
    getFeaturedMatches();
  }, [currentDate, maxMatches]);

  // Memoize current match
  const currentMatch = useMemo(() => {
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

  // Loading state with proper skeleton
  if (loading) {
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

          {/* Score area using flexbox positioning */}
          <div
            className="score-area"
            style={{
              height: "80px",
              gridArea: "score",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
              position: "relative",
              paddingTop: "0px",
            }}
          >
            {/* Match status display */}
            <div
              className="match-status-display"
              style={{
                fontSize: "0.75rem",
                fontWeight: "600",
                color: getMatchStatusLabel(currentMatch) === "LIVE" ? "#dc2626" : "#6b7280",
                marginBottom: "2px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {(() => {
                const status = currentMatch?.fixture?.status?.short;
                const elapsed = currentMatch?.fixture?.status?.elapsed;

                if (["1H", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                  return `${elapsed || 0}'`;
                }
                if (status === "HT") return "HALFTIME";
                if (status === "FT") return "FULL TIME";
                if (status === "AET") return "AFTER EXTRA TIME";
                if (status === "PEN") return "PENALTIES";
                if (status === "NS") return "UPCOMING";
                return status || "UPCOMING";
              })()}
            </div>

            {/* Main score/time display */}
            <div
              className="match-score-display"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "calc(1.125rem * 0.968)",
                flex: "1",
              }}
            >
              {currentMatch?.fixture?.status?.short &&
              ["1H", "2H", "HT", "ET", "P", "FT", "AET", "PEN"].includes(
                currentMatch.fixture.status.short,
              ) ? (
                // Score display for live and finished matches
                <>
                  <span className="score-number">
                    {currentMatch?.goals?.home ?? 0}
                  </span>
                  <span className="score-separator">-</span>
                  <span className="score-number">
                    {currentMatch?.goals?.away ?? 0}
                  </span>
                </>
              ) : null}
            </div>


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
              onClick={() =>
                currentMatch?.fixture?.id &&
                navigate(`/match/${currentMatch.fixture.id}`)
              }
            >
              <img
                src="/assets/matchdetaillogo/MatchDetail.svg"
                alt="Match Page"
                width="18"
                height="18"
                className="text-gray-600"
              />
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
              onClick={() =>
                currentMatch?.fixture?.id &&
                navigate(`/match/${currentMatch.fixture.id}/h2h`)
              }
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
              onClick={() =>
                currentMatch?.fixture?.id &&
                navigate(`/match/${currentMatch.fixture.id}/standings`)
              }
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