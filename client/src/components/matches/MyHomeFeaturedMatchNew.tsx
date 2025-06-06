import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Users,
  Clock,
  Grid3X3,
  Star,
} from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isValid, addDays } from "date-fns";
import { CacheManager } from "@/lib/cachingHelper";
import { backgroundCache } from "@/lib/backgroundCache";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import LazyImage from "../common/LazyImage";
import { isNationalTeam } from "../../lib/teamLogoSources";
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";
import { apiRequest } from "@/lib/queryClient";
import {
  shouldExcludeFromPopularLeagues,
  isPopularLeagueSuitable,
  isRestrictedUSLeague,
} from "@/lib/MyPopularLeagueExclusion";
import {
  shouldExcludeFeaturedMatch,
} from "@/lib/MyFeaturedMatchExclusion";

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

  // Get TOP 3 leagues dynamically from TodayPopularLeagueNew data
  const getDynamicTop3Leagues = async (dateString: string) => {
    try {
      const response = await apiRequest('GET', `/api/fixtures/date/${dateString}?all=true`);
      if (!response.ok) return [];

      const allFixtures = await response.json();
      if (!allFixtures || allFixtures.length === 0) return [];

      // Apply SAME filtering logic as TodayPopularLeagueNew
      const POPULAR_COUNTRIES_ORDER = [
        "England",
        "Spain", 
        "Italy",
        "Germany",
        "France",
        "World",
        "Europe",
        "South America",
        "Brazil",
        "Saudi Arabia",
        "Egypt",
        "Colombia",
        "United States",
        "USA",
        "US",
        "United Arab Emirates",
        "United-Arab-Emirates",
      ];

      // Filter fixtures EXACTLY like TodayPopularLeagueNew does
      const filteredFixtures = allFixtures.filter((fixture) => {
        if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
          return false;
        }

        // Apply exclusion filters first
        if (
          shouldExcludeFromPopularLeagues(
            fixture.league.name,
            fixture.teams.home.name,
            fixture.teams.away.name,
            fixture.league.country,
          )
        ) {
          return false;
        }

        // Apply MyFeaturedMatchExclusion for additional filtering
        if (
          shouldExcludeFeaturedMatch(
            fixture.league.name,
            fixture.teams.home.name,
            fixture.teams.away.name,
          )
        ) {
          return false;
        }

        return true;
      });

      // Group by league and count matches
      const leagueCounts = filteredFixtures.reduce((acc: any, fixture: any) => {
        const leagueId = fixture.league.id;
        if (!acc[leagueId]) {
          acc[leagueId] = {
            leagueId,
            leagueName: fixture.league.name,
            country: fixture.league.country,
            matchCount: 0,
            league: fixture.league,
          };
        }
        acc[leagueId].matchCount++;
        return acc;
      }, {});

      // Sort leagues by match count and get top 3
      const sortedLeagues = Object.values(leagueCounts)
        .sort((a: any, b: any) => b.matchCount - a.matchCount)
        .slice(0, 3);

      console.log(
        `🎯 [FeaturedMatch] Dynamic TOP 3 leagues for ${dateString}:`,
        sortedLeagues.map((l: any) => `${l.leagueName} (${l.matchCount} matches)`),
      );

      return sortedLeagues.map((l: any) => l.leagueId);
    } catch (error) {
      console.error(`🔍 [FeaturedMatch] Error getting dynamic leagues for ${dateString}:`, error);
      return [];
    }
  };

  // Fetch featured match data using dynamic TOP 3 leagues from TodayPopularLeagueNew
  useEffect(() => {
    const loadFeaturedMatches = async () => {
      try {
        setLoading(true);

        // Check cache first
        const cacheKey = ["featured-matches", currentDate];
        const cachedData = CacheManager.getCachedData(cacheKey, 15 * 60 * 1000); // 15 minutes cache

        if (cachedData) {
          console.log(
            "🎯 [FeaturedMatch] Using cached data:",
            cachedData.length,
            "matches",
          );
          setMatches(cachedData);
          setCurrentIndex(0);
          setLoading(false);
          return;
        }

        console.log(
          "🔍 [FeaturedMatch] Fetching fresh data for date:",
          currentDate,
        );

        // Get dates for today, tomorrow, and day after tomorrow
        const today = new Date();
        const todayString = format(today, "yyyy-MM-dd");
        const tomorrow = addDays(today, 1);
        const tomorrowString = format(tomorrow, "yyyy-MM-dd");
        const dayAfterTomorrow = addDays(today, 2);
        const dayAfterTomorrowString = format(dayAfterTomorrow, "yyyy-MM-dd");

        const featuredMatches = [];

        // Fetch exactly 3 matches from each day's dynamic TOP 3 leagues (total 9, but we'll limit to 8)
        const datesToFetch = [
          { date: todayString, maxMatches: 3 },
          { date: tomorrowString, maxMatches: 3 },
          { date: dayAfterTomorrowString, maxMatches: 2 }, // Only 2 from day after tomorrow to total 8
        ];

        for (const { date, maxMatches: dateMaxMatches } of datesToFetch) {
          try {
            // Get dynamic TOP 3 leagues for this date
            const dynamicTop3Leagues = await getDynamicTop3Leagues(date);

            if (dynamicTop3Leagues.length === 0) {
              console.log(`🔍 [FeaturedMatch] No dynamic TOP 3 leagues found for ${date}`);
              continue;
            }

            const response = await apiRequest('GET', `/api/fixtures/date/${date}?all=true`);
            if (!response.ok) continue;

            const allFixtures = await response.json();
            if (!allFixtures || allFixtures.length === 0) continue;

            console.log(
              `🔍 [FeaturedMatch] Found ${allFixtures.length} fixtures for ${date}`,
            );

            // Filter to ONLY dynamic TOP 3 leagues that are shown in TodayPopularLeagueNew
            const topLeagueFixtures = allFixtures.filter((fixture) => {
              if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
                return false;
              }

              // ONLY keep fixtures from dynamic TOP 3 leagues
              const leagueId = fixture.league?.id;
              return dynamicTop3Leagues.includes(leagueId);
            });

            console.log(
              `🔍 [FeaturedMatch] Found ${topLeagueFixtures.length} dynamic TOP 3 league fixtures for ${date}`,
            );

            if (topLeagueFixtures.length === 0) continue;

            // Apply ONLY the basic exclusions (same as TodayPopularLeagueNew)
            const filteredFixtures = topLeagueFixtures.filter((fixture) => {
              // Apply popular league exclusion filters
              if (
                shouldExcludeFromPopularLeagues(
                  fixture.league.name,
                  fixture.teams.home.name,
                  fixture.teams.away.name,
                  fixture.league.country,
                )
              ) {
                return false;
              }

              // Apply MyFeaturedMatchExclusion for additional filtering
              if (
                shouldExcludeFeaturedMatch(
                  fixture.league.name,
                  fixture.teams.home.name,
                  fixture.teams.away.name,
                )
              ) {
                return false;
              }

              return true;
            });

            // Sort ALL matches from dynamic TOP 3 leagues using SAME sorting as TodayPopularLeagueNew
            const sortedMatches = filteredFixtures.sort((a: any, b: any) => {
              const aStatus = a.fixture.status.short;
              const bStatus = b.fixture.status.short;
              const aDate = parseISO(a.fixture.date);
              const bDate = parseISO(b.fixture.date);

              // Ensure valid dates
              if (!isValid(aDate) || !isValid(bDate)) {
                return 0;
              }

              const aTime = aDate.getTime();
              const bTime = bDate.getTime();

              // Define status categories
              const aLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
              const bLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);

              const aUpcoming = aStatus === "NS" || aStatus === "TBD";
              const bUpcoming = bStatus === "NS" || bStatus === "TBD";

              const aFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(aStatus);
              const bFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(bStatus);

              // PRIORITY 1: LIVE matches always come first
              if (aLive && !bLive) return -1;
              if (!aLive && bLive) return 1;

              // If both are LIVE, sort by elapsed time (shortest first), then alphabetically by home team
              if (aLive && bLive) {
                const aElapsed = Number(a.fixture.status.elapsed) || 0;
                const bElapsed = Number(b.fixture.status.elapsed) || 0;

                if (aElapsed !== bElapsed) {
                  return aElapsed - bElapsed;
                }

                // If same elapsed time, sort alphabetically by home team name
                const aHomeTeam = a.teams?.home?.name || "";
                const bHomeTeam = b.teams?.home?.name || "";
                return aHomeTeam.localeCompare(bHomeTeam);
              }

              // PRIORITY 2: Upcoming (NS/TBD) matches come second, sorted by time first, then alphabetically by home team
              if (aUpcoming && !bUpcoming) return -1;
              if (!aUpcoming && bUpcoming) return 1;

              // If both are upcoming, sort by time first, then alphabetically by home team
              if (aUpcoming && bUpcoming) {
                if (aTime !== bTime) {
                  return aTime - bTime; // Earlier matches first
                }

                // If same time, sort alphabetically by home team name
                const aHomeTeam = a.teams?.home?.name || "";
                const bHomeTeam = b.teams?.home?.name || "";
                return aHomeTeam.localeCompare(bHomeTeam);
              }

              // PRIORITY 3: Finished matches come last, sorted alphabetically by home team
              if (aFinished && !bFinished) return 1;
              if (!aFinished && bFinished) return -1;

              // If both are finished, sort alphabetically by home team name
              if (aFinished && bFinished) {
                const aHomeTeam = a.teams?.home?.name || "";
                const bHomeTeam = b.teams?.home?.name || "";
                return aHomeTeam.localeCompare(bHomeTeam);
              }

              // DEFAULT: For any other cases, sort alphabetically by home team name
              const aHomeTeam = a.teams?.home?.name || "";
              const bHomeTeam = b.teams?.home?.name || "";
              return aHomeTeam.localeCompare(bHomeTeam);
            });

            // Take exactly the number of matches specified for this date
            const selectedMatches = sortedMatches.slice(0, dateMaxMatches);

            // Add matches to featured collection with unique ID tracking
            for (const match of selectedMatches) {
              // Avoid duplicates by checking fixture ID
              const isDuplicate = featuredMatches.some(existing => existing.fixture?.id === match.fixture?.id);

              if (!isDuplicate) {
                featuredMatches.push({
                  ...match,
                  league: {
                    ...match.league,
                    country: match.league.country,
                  },
                  dateContext: date, // Add context for which date this match is from
                });
              }
            }

            const addedCount = selectedMatches.filter(match => 
              !featuredMatches.slice(0, -selectedMatches.length).some(existing => existing.fixture?.id === match.fixture?.id)
            ).length;

            console.log(
              `🔍 [FeaturedMatch] Added ${addedCount} unique matches from ${date} (requested: ${dateMaxMatches})`,
            );
          } catch (error) {
            console.error(`🔍 [FeaturedMatch] Error fetching data for ${date}:`, error);
          }
        }

        // Final sorting: Prioritize live matches, then by date context and match importance
        const sortedFeaturedMatches = featuredMatches.sort((a, b) => {
          const aStatus = a.fixture?.status?.short;
          const bStatus = b.fixture?.status?.short;

          // Live matches first
          const aIsLive = ["1H", "2H", "HT", "LIVE", "ET", "BT", "P"].includes(aStatus);
          const bIsLive = ["1H", "2H", "HT", "LIVE", "ET", "BT", "P"].includes(bStatus);

          if (aIsLive && !bIsLive) return -1;
          if (!aIsLive && bIsLive) return 1;

          // Sort by date context (today first, then tomorrow, then day after)
          const aDateOrder = a.dateContext === todayString ? 0 : a.dateContext === tomorrowString ? 1 : 2;
          const bDateOrder = b.dateContext === todayString ? 0 : b.dateContext === tomorrowString ? 1 : 2;

          if (aDateOrder !== bDateOrder) {
            return aDateOrder - bDateOrder;
          }

          // Within same day, sort by match time
          const aDate = new Date(a.fixture?.date);
          const bDate = new Date(b.fixture?.date);
          return aDate.getTime() - bDate.getTime();
        });

        // Take exactly 8 total matches for the slide
        const finalMatches = sortedFeaturedMatches.slice(0, 8);

        // Validate data structure before setting
        const validMatches = finalMatches.filter((match) => {
          const isValid =
            match &&
            match.teams &&
            match.teams.home &&
            match.teams.away &&
            match.fixture &&
            match.league;

          if (!isValid) {
            console.warn("🔍 [FeaturedMatch] Invalid match data:", match);
          }
          return isValid;
        });

        // Only show slides if we have matches from dynamic TOP 3 leagues
        if (validMatches.length === 0) {
          console.log("🔍 [FeaturedMatch] No matches found from TodayPopularLeagueNew TOP 3 leagues");
          setMatches([]);
          setCurrentIndex(0);
          setLoading(false);
          return;
        }

        console.log(
          "🔍 [FeaturedMatch] Returning matches from TodayPopularLeagueNew data:",
          validMatches.length,
          "matches:",
          {
            distribution: {
              today: validMatches.filter(m => m.dateContext === todayString).length,
              tomorrow: validMatches.filter(m => m.dateContext === tomorrowString).length,
              dayAfter: validMatches.filter(m => m.dateContext === dayAfterTomorrowString).length
            },
            matches: validMatches.map((m) => ({
              fixtureId: m.fixture?.id || "Unknown ID",
              league: m.league?.name || "Unknown League",
              leagueId: m.league?.id || "Unknown ID",
              homeTeam: m.teams?.home?.name || "Unknown Home",
              awayTeam: m.teams?.away?.name || "Unknown Away",
              dateContext: m.dateContext || "Unknown Date",
              status:
                m.fixture?.status?.short === "NS"
                  ? "UPCOMING"
                  : ["1H", "2H", "HT", "LIVE", "ET", "BT", "P"].includes(
                        m.fixture?.status?.short,
                      )
                    ? "LIVE"
                    : "FINISHED",
            })),
          },
        );

        // Cache the result
        CacheManager.setCachedData(cacheKey, validMatches);

        // Store in background cache as well
        backgroundCache.set(
          `featured-matches-${currentDate}`,
          validMatches,
          15 * 60 * 1000,
        );

        setMatches(validMatches);
        setCurrentIndex(0);
      } catch (error) {
        console.error(
          "🔍 [FeaturedMatch] Error fetching featured matches:",
          error,
        );
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedMatches();
  }, [currentDate, maxMatches]);

  // Handle navigation (slide functions)
  const handlePrevious = () => {
    if (matches.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : matches.length - 1));
  };

  const handleNext = () => {
    if (matches.length <= 1) return;
    setCurrentIndex((prev) => (prev < matches.length - 1 ? prev + 1 : 0));
  };

  const handleMatchClick = () => {
    if (isValidMatch && currentMatch.fixture.id) {
      navigate(`/match/${currentMatch.fixture.id}`);
    }
  };

  // Get current match
  const currentMatch = matches[currentIndex];

  // Validate current match has required data structure
  const isValidMatch =
    currentMatch &&
    currentMatch.teams &&
    currentMatch.teams.home &&
    currentMatch.teams.away &&
    currentMatch.fixture &&
    currentMatch.league;

  // Get match status display
  const getMatchStatus = (match) => {
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
  };

  // Get match status color
  const getStatusColor = (status) => {
    if (["1H", "2H", "LIVE"].includes(status)) return "bg-red-500";
    if (status === "HT") return "bg-orange-500";
    if (status === "FT") return "bg-gray-500";
    return "bg-blue-500";
  };

  // Get match status label
  const getMatchStatusLabel = (match) => {
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
  };

  // Team color helper function
  const getTeamColor = (teamId) => {
    const colors = [
      "#6f7c93", // blue-gray
      "#8b0000", // dark red
      "#1d3557", // dark blue
      "#2a9d8f", // teal
      "#e63946", // red
    ];
    return colors[teamId % colors.length];
  };

  // Loading state
  if (loading) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-8 overflow-hidden relative">
        <Badge
          variant="secondary"
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
        >
          Featured Match
        </Badge>
        <CardContent className="p-6 text-center">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-blue-500 animate-pulse" />
          <p className="text-gray-600 font-medium">
            Loading today's featured match...
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Getting matches from TOP 3 shown leagues
          </p>
        </CardContent>
      </Card>
    );
  }

  // No matches state
  if (!isValidMatch || matches.length === 0) {
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
            <p className="text-sm">No matches from TOP 3 shown leagues today</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
                  <div className="w-2h-2 rounded-fullbg-red-500 animate-pulse" />
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 border border-red-500 text-red-500 animate-pulse"
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

          {/* Score display for live and finished matches using grid */}
          {currentMatch?.fixture?.status?.short &&
            (["1H", "2H", "HT", "ET", "P", "FT", "AET", "PEN"].includes(
              currentMatch.fixture.status.short,
            )) && (
              <div className="match-score-container">
                {/* Score using grid display - moved to top */}
                <div className="match-score-display mb-4" style={{ fontSize: "calc(1.125rem * 0.968)" }}>
                  <span className="score-number">{currentMatch?.goals?.home ?? 0}</span>
                  <span className="score-separator">-</span>
                  <span className="score-number">{currentMatch?.goals?.away ?? 0}</span>
                </div>

                {/* Match status label positioned below score */}
                <div className="match-status-label status-live" style={{ marginTop: "-0.25rem" }}>
                  {(() => {
                    const status = currentMatch?.fixture?.status?.short;
                    const elapsed = currentMatch?.fixture?.status?.elapsed;

                    // Live matches - show elapsed time
                    if (["LIVE", "1H", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                      if (status === "HT") {
                        return "HT";
                      }
                      return `${elapsed || 0}'`;
                    }

                    // Finished matches
                    if (status === "FT") return "Ended";
                    if (status === "AET") return "After Extra Time";
                    if (status === "PEN") return "After Penalties";
                    if (status === "AWD") return "Awarded";
                    if (status === "WO") return "Walkover";
                    if (status === "ABD") return "Abandoned";
                    if (status === "CANC") return "Cancelled";
                    if (status === "SUSP") return "Suspended";

                    // Half time
                    if (status === "HT") return "Half Time";

                    // Upcoming matches
                    if (status === "NS") return "Upcoming";
                    if (status === "TBD") return "Time TBD";
                    if (status === "PST") return "Postponed";

                    // Default
                    return status || "Upcoming";
                  })()}
                </div>
              </div>
            )}

          {/* Match status for matches without scores using grid - same layout as score display */}
          {currentMatch?.fixture?.status?.short &&
            !(["1H", "2H", "HT", "ET", "P", "FT", "AET", "PEN"].includes(
              currentMatch.fixture.status.short,
            )) && (
              <div className="match-score-container">
                {/* Status display - positioned same as score display */}
                <div className="match-score-display mb-4" style={{ fontSize: "calc(1.125rem * 0.968 * 1.1 * 1.1)" }}>
                  <span className="score-number">
                    {(() => {
                      const status = currentMatch?.fixture?.status?.short;

                      // Upcoming matches - calculate days until match
                      if (status === "NS") {
                        try {
                          const matchDate = parseISO(currentMatch.fixture.date);
                          const now = new Date();

                          // Calculate difference in days
                          const msToMatch = matchDate.getTime() - now.getTime();
                          const daysToMatch = Math.ceil(msToMatch / (1000 * 60 * 60 * 24));

                          if (daysToMatch === 0) {
                            return "Today";
                          } else if (daysToMatch === 1) {
                            return "Tomorrow";
                          } else if (daysToMatch > 1) {
                            return `${daysToMatch} Days`;
                          } else {
                            return "Today"; // Past date defaults to Today
                          }
                        } catch (e) {
                          return "Today";
                        }
                      }
                      if (status === "TBD") return "Time TBD";
                      if (status === "PST") return "Postponed";

                      // Default
                      return status || "";
                    })()}
                  </span>
                </div>

                {/* Match status label positioned below - same as score version */}
                <div className="match-status-label status-upcoming" style={{
                  fontSize: currentMatch?.fixture?.status?.short === "NS" ? "calc(1.5 * 1rem)" : "1rem",
                  marginTop: "16px"
                }}>
                  {(() => {
                    const status = currentMatch?.fixture?.status?.short;
                    const elapsed = currentMatch?.fixture?.status?.elapsed;

                    // Live matches - show elapsed time
                    if (["LIVE", "1H", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                      if (status === "HT") {
                        return "HT";
                      }
                      return `${elapsed || 0}'`;
                    }

                    // Finished matches
                    if (status === "FT") return "Ended";
                    if (status === "AET") return "After Extra Time";
                    if (status === "PEN") return "After Penalties";
                    if (status === "AWD") return "Awarded";
                    if (status === "WO") return "Walkover";
                    if (status === "ABD") return "Abandoned";
                    if (status === "CANC") return "Cancelled";
                    if (status === "SUSP") return "Suspended";

                    // Half time
                    if (status === "HT") return "Half Time";

                    // Upcoming matches - don't show days here to avoid duplication with score display
                    if (status === "NS") {
                      return ""; // Days are already shown in the score display section above
                    }
                    if (status === "TBD") return "Time TBD";
                    if (status === "PST") return "Postponed";

                    // Default
                    return status || "Upcoming";
                  })()}
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs text-gray-500">
                  {/* Additional content positioned absolutely below without affecting grid */}
                </div>
              </div>
            )}

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
                        className="absolute z-20 w-[64px] h-[64px] object-cover rounded-full"
                        style={{
                          cursor: "pointer",
                          top: "calc(50% - 32px)",
                          left: "-32px",
                          filter: "contrast(115%) brightness(105%) drop-shadow(4px 4px 6px rgba(0, 0, 0, 0.3))",
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
                      filter: "contrast(115%) brightness(105%) drop-shadow(4px 4px 6px rgba(0, 0, 0, 0.3))",
                    }}
                    onClick={handleMatchClick}
                    onError={(e) => {
                      e.currentTarget.src = "/assets/fallback-logo.svg";
                    }}
                  />
                </div>
              </div>

              {/* Match date and venue - aligned with VS component */}
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
                    const matchDate = parseISO(
                      currentMatch.fixture.date,
                    );
                    const formattedDate = format(
                      matchDate,
                      "EEEE, do MMM",
                      );
                    const timeOnly = format(matchDate, "HH:mm");
                    const isUpcoming = currentMatch.fixture.status.short === "NS" || currentMatch.fixture.status.short === "TBD";

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
                <img
                  src="/assets/matchdetaillogo/stats.svg"
                  alt="H2H"
                  width="18"
                  height="18"
                  className="text-gray-600"
                />
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
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
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