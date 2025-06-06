import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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

  // Priority system for top-level matches
  const getMatchPriority = (leagueData: any) => {
    const name = (leagueData.league?.name || "").toLowerCase();
    
    // Priority 1: UEFA Nations League (HIGHEST PRIORITY)
    if (name.includes("uefa nations league") && !name.includes("women")) {
      return 1;
    }

    // Priority 2: UEFA Euro and major tournaments
    if (name.includes("uefa euro") && !name.includes("qualification") && !name.includes("women")) {
      return 2;
    }

    // Priority 3: UEFA Euro qualification and other major qualifications
    if (name.includes("uefa euro") && name.includes("qualification") && !name.includes("women")) {
      return 3;
    }

    return 999; // Lower priority
  };

  // Get featured matches with priority-based logic
  useEffect(() => {
    const getFeaturedMatches = async () => {
      try {
        setLoading(true);

        // Check cache first
        const cacheKey = ["featured-matches-priority", currentDate];
        const cachedData = CacheManager.getCachedData(cacheKey, 15 * 60 * 1000); // 15 minutes cache

        if (cachedData) {
          console.log("🎯 [FeaturedMatch] Using cached data:", cachedData.length, "matches");
          setMatches(cachedData);
          setCurrentIndex(0);
          setLoading(false);
          return;
        }

        console.log("🔍 [FeaturedMatch] Getting top priority level 1-3 matches for 3 days");

        // Get dates for today, tomorrow, and day after tomorrow
        const today = new Date();
        const todayString = format(today, "yyyy-MM-dd");
        const tomorrow = addDays(today, 1);
        const tomorrowString = format(tomorrow, "yyyy-MM-dd");
        const dayAfterTomorrow = addDays(today, 2);
        const dayAfterTomorrowString = format(dayAfterTomorrow, "yyyy-MM-dd");

        const allFeaturedMatches = [];

        // Track seen matches to avoid duplicates - now considering fixture ID and date
        const seenMatches = new Set<string>();
        const seenTeamPairs = new Set<string>();
        const addedMatches = new Map<string, number>(); // Track how many matches per date

        // Fetch matches for today, tomorrow, and day after tomorrow
        const datesToFetch = [
          { date: todayString, label: "Today" },
          { date: tomorrowString, label: "Tomorrow" },
          { date: dayAfterTomorrowString, label: "Day After Tomorrow" }
        ];

        for (const { date, label } of datesToFetch) {
          try {
            console.log(`🔍 [FeaturedMatch] Fetching ${label} matches for ${date}`);

            const response = await apiRequest('GET', `/api/fixtures/date/${date}?all=true`);
            if (!response.ok) continue;

            const allFixtures = await response.json();
            if (!allFixtures || allFixtures.length === 0) continue;

            // Filter to ONLY priority level 1-3 matches
            const priorityMatches = allFixtures.filter((fixture) => {
              if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
                return false;
              }

              const priority = getMatchPriority(fixture);
              return priority >= 1 && priority <= 3;
            });

            console.log(`🔍 [FeaturedMatch] Found ${priorityMatches.length} matches from priority levels 1-3 for ${label}`);

            // Sort matches by priority: Live > Upcoming > Finished
            const sortedMatches = priorityMatches.sort((a: any, b: any) => {
              const aStatus = a.fixture.status.short;
              const bStatus = b.fixture.status.short;
              const aDate = parseISO(a.fixture.date);
              const bDate = parseISO(b.fixture.date);

              // Ensure valid dates
              if (!isValid(aDate) || !isValid(bDate)) {
                return 0;
              }

              // Define status categories
              const aLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
              const bLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);

              const aUpcoming = aStatus === "NS" || aStatus === "TBD";
              const bUpcoming = bStatus === "NS" || bStatus === "TBD";

              // PRIORITY 1: LIVE matches always come first
              if (aLive && !bLive) return -1;
              if (!aLive && bLive) return 1;

              // PRIORITY 2: Upcoming matches come second
              if (aUpcoming && !bUpcoming) return -1;
              if (!aUpcoming && bUpcoming) return 1;

              // PRIORITY 3: Sort by match time
              return aDate.getTime() - bDate.getTime();
            });

            // Filter out duplicates using multiple strategies
            const uniqueMatches = [];
            let addedForThisDate = 0;
            const maxMatchesPerDate = 3;

            for (const match of sortedMatches) {
              if (addedForThisDate >= maxMatchesPerDate) break;

              // Create multiple unique identifiers to catch different types of duplicates
              const fixtureKey = `fixture-${match.fixture.id}`;
              const teamPairKey = `${match.teams.home.name}-vs-${match.teams.away.name}`;
              const reverseTeamPairKey = `${match.teams.away.name}-vs-${match.teams.home.name}`;
              const dateTeamKey = `${date}-${teamPairKey}`;
              
              // Check multiple conditions for duplicates
              const isFixtureDuplicate = seenMatches.has(fixtureKey);
              const isTeamPairDuplicate = seenTeamPairs.has(teamPairKey) || seenTeamPairs.has(reverseTeamPairKey);
              
              if (!isFixtureDuplicate && !isTeamPairDuplicate) {
                // Add to all tracking sets
                seenMatches.add(fixtureKey);
                seenMatches.add(dateTeamKey);
                seenTeamPairs.add(teamPairKey);
                
                uniqueMatches.push(match);
                addedForThisDate++;
                
                console.log(`✅ [FeaturedMatch] Added unique match: ${teamPairKey} (Fixture ID: ${match.fixture.id})`);
              } else {
                console.log(`🔍 [FeaturedMatch] Skipping duplicate match: ${teamPairKey} (Fixture ID: ${match.fixture.id})`);
              }
            }

            console.log(`🔍 [FeaturedMatch] Taking ${uniqueMatches.length} unique matches from ${label}:`, 
              uniqueMatches.map(m => `${m.teams.home.name} vs ${m.teams.away.name} (ID: ${m.fixture.id})`));

            addedMatches.set(date, uniqueMatches.length);
            allFeaturedMatches.push(...uniqueMatches);

          } catch (error) {
            console.error(`🔍 [FeaturedMatch] Error fetching data for ${date}:`, error);
          }
        }

        console.log(`🔍 [FeaturedMatch] Matches added per date:`, Object.fromEntries(addedMatches));

        // Enhanced final duplicate removal with fixture ID priority
        const finalUniqueMatches = [];
        const finalSeenFixtures = new Set<number>();
        const finalSeenTeamPairs = new Set<string>();

        console.log(`🔍 [FeaturedMatch] Starting final duplicate removal. Total collected: ${allFeaturedMatches.length}`);

        for (const match of allFeaturedMatches) {
          const fixtureId = match.fixture.id;
          const teamPairKey = `${match.teams.home.name}-vs-${match.teams.away.name}`;
          const reverseTeamPairKey = `${match.teams.away.name}-vs-${match.teams.home.name}`;
          
          // Check for fixture ID duplicate (most reliable)
          if (finalSeenFixtures.has(fixtureId)) {
            console.log(`🚫 [FeaturedMatch] Removed duplicate by fixture ID: ${teamPairKey} (ID: ${fixtureId})`);
            continue;
          }
          
          // Check for team pair duplicate
          if (finalSeenTeamPairs.has(teamPairKey) || finalSeenTeamPairs.has(reverseTeamPairKey)) {
            console.log(`🚫 [FeaturedMatch] Removed duplicate by team pair: ${teamPairKey} (ID: ${fixtureId})`);
            continue;
          }
          
          // This is a unique match
          finalSeenFixtures.add(fixtureId);
          finalSeenTeamPairs.add(teamPairKey);
          finalUniqueMatches.push(match);
          
          console.log(`✅ [FeaturedMatch] Kept unique match: ${teamPairKey} (ID: ${fixtureId}, League: ${match.league.name})`);
        }

        // Final sort to prioritize variety while maintaining status priority
        const finalSortedMatches = finalUniqueMatches.sort((a, b) => {
          const aStatus = a.fixture?.status?.short;
          const bStatus = b.fixture?.status?.short;

          // Live matches first
          const aIsLive = ["1H", "2H", "HT", "LIVE", "ET", "BT", "P"].includes(aStatus);
          const bIsLive = ["1H", "2H", "HT", "LIVE", "ET", "BT", "P"].includes(bStatus);

          if (aIsLive && !bIsLive) return -1;
          if (!aIsLive && bIsLive) return 1;

          // Recent finished matches (within last 6 hours)
          const now = new Date();
          const aDate = new Date(a.fixture?.date);
          const bDate = new Date(b.fixture?.date);

          const aIsRecentFinished =
            ["FT", "AET", "PEN"].includes(aStatus) &&
            now.getTime() - aDate.getTime() < 6 * 60 * 60 * 1000;
          const bIsRecentFinished =
            ["FT", "AET", "PEN"].includes(bStatus) &&
            now.getTime() - bDate.getTime() < 6 * 60 * 60 * 1000;

          if (aIsRecentFinished && !bIsRecentFinished) return -1;
          if (!aIsRecentFinished && bIsRecentFinished) return 1;

          // Sort by match time for upcoming matches
          return aDate.getTime() - bDate.getTime();
        });

        // Take maximum 9 unique matches total
        const finalMatches = finalSortedMatches.slice(0, 9);

        console.log(`🔍 [FeaturedMatch] Final unique matches: ${finalMatches.length} (removed ${allFeaturedMatches.length - finalMatches.length} duplicates)`);

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
            console.warn("🔍 [FeaturedMatch] Invalid match data:", match);
          }
          return isValid;
        });

        console.log("🔍 [FeaturedMatch] Final matches:", validMatches.length, "matches:", 
          validMatches.map(m => ({
            league: m.league?.name,
            homeTeam: m.teams?.home?.name,
            awayTeam: m.teams?.away?.name,
            status: m.fixture?.status?.short
          }))
        );

        // Cache the result
        CacheManager.setCachedData(cacheKey, validMatches);
        backgroundCache.set(`featured-matches-priority-${currentDate}`, validMatches, 15 * 60 * 1000);

        setMatches(validMatches);
        setCurrentIndex(0);
      } catch (error) {
        console.error("🔍 [FeaturedMatch] Error getting featured matches:", error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    getFeaturedMatches();
  }, [currentDate, maxMatches]);

  // Handle navigation
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

  // Validate current match
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

  // Get match status label
  const getMatchStatusLabel = (match) => {
    if (!match) return "";

    const { fixture } = match;

    if (["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(fixture.status.short)) {
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
            Loading featured matches...
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Top priority level 1-3 matches
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
            <p className="text-sm">No priority level 1-3 matches found</p>
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

          {/* Score display for live and finished matches */}
          {currentMatch?.fixture?.status?.short &&
            (["1H", "2H", "HT", "ET", "P", "FT", "AET", "PEN"].includes(
              currentMatch.fixture.status.short,
            )) && (
              <div className="match-score-container">
                <div className="match-score-display mb-4" style={{ fontSize: "calc(1.125rem * 0.968)" }}>
                  <span className="score-number">{currentMatch?.goals?.home ?? 0}</span>
                  <span className="score-separator">-</span>
                  <span className="score-number">{currentMatch?.goals?.away ?? 0}</span>
                </div>

                <div className="match-status-label status-live" style={{ marginTop: "-0.25rem" }}>
                  {(() => {
                    const status = currentMatch?.fixture?.status?.short;
                    const elapsed = currentMatch?.fixture?.status?.elapsed;

                    if (["LIVE", "1H", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                      if (status === "HT") return "HT";
                      return `${elapsed || 0}'`;
                    }
                    if (status === "FT") return "Ended";
                    if (status === "AET") return "After Extra Time";
                    if (status === "PEN") return "After Penalties";
                    return status || "Upcoming";
                  })()}
                </div>
              </div>
            )}

          {/* Match status for upcoming matches */}
          {currentMatch?.fixture?.status?.short &&
            !(["1H", "2H", "HT", "ET", "P", "FT", "AET", "PEN"].includes(
              currentMatch.fixture.status.short,
            )) && (
              <div className="match-score-container">
                <div className="match-score-display mb-4" style={{ fontSize: "calc(1.125rem * 0.968 * 1.1 * 1.1)" }}>
                  <span className="score-number">
                    {(() => {
                      const status = currentMatch?.fixture?.status?.short;

                      if (status === "NS") {
                        try {
                          const matchDate = parseISO(currentMatch.fixture.date);
                          const now = new Date();
                          const msToMatch = matchDate.getTime() - now.getTime();
                          const daysToMatch = Math.ceil(msToMatch / (1000 * 60 * 60 * 24));

                          if (daysToMatch === 0) return "Today";
                          else if (daysToMatch === 1) return "Tomorrow";
                          else if (daysToMatch > 1) return `${daysToMatch} Days`;
                          else return "Today";
                        } catch (e) {
                          return "Today";
                        }
                      }
                      if (status === "TBD") return "Time TBD";
                      if (status === "PST") return "Postponed";
                      return status || "";
                    })()}
                  </span>
                </div>

                <div className="match-status-label status-upcoming" style={{
                  fontSize: currentMatch?.fixture?.status?.short === "NS" ? "calc(1.5 * 1rem)" : "1rem",
                  marginTop: "16px"
                }}>
                  {currentMatch?.fixture?.status?.short === "NS" ? "" : (currentMatch?.fixture?.status?.short || "Upcoming")}
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
                      background: getTeamColor(currentMatch?.teams?.home?.id || 0),
                      transition: "all 0.3s ease-in-out",
                    }}
                  >
                    {currentMatch?.teams?.home && (
                      <img
                        src={currentMatch.teams.home.logo || `/assets/fallback-logo.svg`}
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
                          e.currentTarget.src = "/assets/fallback-logo.svg";
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
                    src={currentMatch?.teams?.away?.logo || `/assets/fallback-logo.svg`}
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
                    const isUpcoming = currentMatch.fixture.status.short === "NS" || currentMatch.fixture.status.short === "TBD";

                    return (
                      <>
                        {formattedDate}
                        {!isUpcoming && ` | ${timeOnly}`}
                        {currentMatch.fixture.venue?.name ? ` | ${currentMatch.fixture.venue.name}` : ""}
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
                onClick={() => currentMatch?.fixture?.id && navigate(`/match/${currentMatch.fixture.id}`)}
              >
                <img
                  src="/assets/matchdetaillogo/MatchDetail.svg"
                  alt="Match Page"
                  width="18"
                  height="18"
                  className="text-gray-600"
                />
                <span className="text-[0.75rem] text-gray-600 mt-1">Match Page</span>
              </button>
              <button
                className="flex flex-col items-center cursor-pointer w-1/4"
                onClick={() => currentMatch?.fixture?.id && navigate(`/match/${currentMatch.fixture.id}/lineups`)}
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
                onClick={() => currentMatch?.fixture?.id && navigate(`/match/${currentMatch.fixture.id}/h2h`)}
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
                onClick={() => currentMatch?.fixture?.id && navigate(`/match/${currentMatch.fixture.id}/standings`)}
              >
                <img
                  src="/assets/matchdetaillogo/standings.svg"
                  alt="Standings"
                  width="18"
                  height="18"
                  className="text-gray-600"
                />
                <span className="text-[0.75rem] text-gray-600 mt-1">Standings</span>
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