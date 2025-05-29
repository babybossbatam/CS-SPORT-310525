
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isValid, differenceInHours } from 'date-fns';
import { useCachedQuery } from '@/lib/cachingHelper';
import { apiRequest } from '@/lib/queryClient';
import { getCurrentUTCDateString } from '@/lib/dateUtilsTodayMatch';
import { shouldExcludeFixture } from '@/lib/exclusionFilters';
import FixedMatchTimer from './FixedMatchTimer';

interface MyHomeScoreboardNewProps {
  filterByPopularCountry?: boolean;
  maxMatches?: number;
}

const MyHomeScoreboardNew: React.FC<MyHomeScoreboardNewProps> = ({ 
  filterByPopularCountry = false,
  maxMatches = 6
}) => {
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liveElapsed, setLiveElapsed] = useState<number | null>(null);

  // Use current date for fetching
  const currentDate = getCurrentUTCDateString();

  // Popular leagues for featured matches
  const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78, 61, 848, 1];

  // Popular countries for filtering
  const POPULAR_COUNTRIES = [
    'World', 'Europe', 'International',
    'England', 'Spain', 'Italy', 'Germany', 'France',
    'Egypt', 'Saudi Arabia', 'United Arab Emirates'
  ];

  // Popular teams for prioritization
  const POPULAR_TEAMS = [
    // Premier League
    33, 40, 42, 50, 47, 49,
    // La Liga
    529, 541, 530, 548, 727,
    // Serie A
    489, 492, 496, 500, 502, 505,
    // Bundesliga
    157, 165, 168, 173, 192,
    // Other popular teams
    85, 81, 212
  ];

  // Fetch fixtures using optimized approach
  const { data: allFixtures = [], isLoading, isFetching } = useCachedQuery(
    ['scoreboard-matches', currentDate, filterByPopularCountry],
    async () => {
      console.log(`MyHomeScoreboardNew - Fetching fixtures for ${currentDate}`);

      // Generate date range
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(today);
      dayAfter.setDate(dayAfter.getDate() + 2);

      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
      const todayStr = currentDate;
      const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
      const dayAfterStr = format(dayAfter, 'yyyy-MM-dd');

      const allData = [];

      // Fetch league fixtures in batches
      const batchSize = 3;
      const leagueBatches = [];
      for (let i = 0; i < POPULAR_LEAGUES.length; i += batchSize) {
        leagueBatches.push(POPULAR_LEAGUES.slice(i, i + batchSize));
      }

      // Process league batches with small delays
      for (const [batchIndex, batch] of leagueBatches.entries()) {
        if (batchIndex > 0) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between batches
        }

        const batchPromises = batch.map(async (leagueId) => {
          try {
            const response = await apiRequest('GET', `/api/leagues/${leagueId}/fixtures`);
            const leagueFixtures = await response.json();
            return leagueFixtures || [];
          } catch (error) {
            console.error(`Error fetching fixtures for league ${leagueId}:`, error);
            return [];
          }
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(matches => allData.push(...matches));
      }

      // Fetch daily fixtures
      const datePromises = [yesterdayStr, todayStr, tomorrowStr, dayAfterStr].map(async (dateStr) => {
        try {
          const response = await apiRequest('GET', `/api/fixtures/date/${dateStr}`);
          return await response.json() || [];
        } catch (error) {
          console.error(`Error fetching fixtures for ${dateStr}:`, error);
          return [];
        }
      });

      const dateResults = await Promise.all(datePromises);
      dateResults.forEach(matches => allData.push(...matches));

      // Remove duplicates
      const uniqueFixtures = Array.from(
        new Map(allData.map(match => [match.fixture?.id, match])).values()
      );

      console.log(`MyHomeScoreboardNew - Fetched ${uniqueFixtures.length} total fixtures`);
      return uniqueFixtures;
    },
    {
      enabled: !!currentDate,
      maxAge: 30 * 60 * 1000, // 30 minutes cache
      backgroundRefresh: true,
      staleTime: 15 * 60 * 1000, // Don't refetch for 15 minutes
    }
  );

  // Filter and prioritize matches
  const scoreboard = useMemo(() => {
    if (!allFixtures?.length) return [];

    const now = new Date();

    // Apply filtering
    const filtered = allFixtures.filter(fixture => {
      // Basic validation
      if (!fixture?.fixture?.id || !fixture?.teams?.home || !fixture?.teams?.away) {
        return false;
      }

      // Apply exclusion filters
      if (shouldExcludeFixture(
        fixture.league?.name,
        fixture.teams.home.name,
        fixture.teams.away.name
      )) {
        return false;
      }

      // Filter by popular countries if enabled
      if (filterByPopularCountry) {
        const leagueCountry = fixture.league?.country;
        if (!POPULAR_COUNTRIES.includes(leagueCountry)) {
          return false;
        }
      } else {
        // Filter by popular leagues
        if (!POPULAR_LEAGUES.includes(fixture.league?.id)) {
          return false;
        }
      }

      return true;
    });

    console.log(`Filtered to ${filtered.length} matches`);

    // Prioritize matches
    const prioritized = filtered.sort((a, b) => {
      const aStatus = a.fixture.status.short;
      const bStatus = b.fixture.status.short;
      const aDate = parseISO(a.fixture.date);
      const bDate = parseISO(b.fixture.date);
      const hoursToA = differenceInHours(aDate, now);
      const hoursToB = differenceInHours(bDate, now);

      // Check if teams are popular
      const aHasPopularTeam = POPULAR_TEAMS.includes(a.teams.home.id) || POPULAR_TEAMS.includes(a.teams.away.id);
      const bHasPopularTeam = POPULAR_TEAMS.includes(b.teams.home.id) || POPULAR_TEAMS.includes(b.teams.away.id);

      // Match status categories
      const liveStatuses = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'];
      const finishedStatuses = ['FT', 'AET', 'PEN'];

      const aLive = liveStatuses.includes(aStatus);
      const bLive = liveStatuses.includes(bStatus);
      const aUpcoming = aStatus === 'NS' && hoursToA > 0;
      const bUpcoming = bStatus === 'NS' && hoursToB > 0;
      const aFinished = finishedStatuses.includes(aStatus);
      const bFinished = finishedStatuses.includes(bStatus);

      // Priority 1: Featured matches (popular teams)
      if (aHasPopularTeam && !bHasPopularTeam) return -1;
      if (!aHasPopularTeam && bHasPopularTeam) return 1;

      // Priority 2: Live matches
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;

      // Priority 3: Upcoming within 24 hours
      const aUpcoming24h = aUpcoming && hoursToA <= 24;
      const bUpcoming24h = bUpcoming && hoursToB <= 24;
      if (aUpcoming24h && !bUpcoming24h) return -1;
      if (!aUpcoming24h && bUpcoming24h) return 1;

      // Priority 4: Other upcoming matches
      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;

      // Priority 5: Recent finished matches (within 8 hours)
      if (aFinished && bFinished) {
        const aHoursAgo = Math.abs(hoursToA);
        const bHoursAgo = Math.abs(hoursToB);
        const aRecent = aHoursAgo <= 8;
        const bRecent = bHoursAgo <= 8;

        if (aRecent && !bRecent) return -1;
        if (!aRecent && bRecent) return 1;

        return aHoursAgo - bHoursAgo;
      }

      // Default: sort by time proximity
      return Math.abs(hoursToA) - Math.abs(hoursToB);
    });

    return prioritized.slice(0, maxMatches);
  }, [allFixtures, filterByPopularCountry, maxMatches]);

  // Auto-select match with countdown timer
  useEffect(() => {
    if (!scoreboard.length) return;

    const now = new Date();
    const upcomingMatchIndex = scoreboard.findIndex((match) => {
      if (match.fixture.status.short !== "NS") return false;

      try {
        const matchDate = parseISO(match.fixture.date);
        const hoursToMatch = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursToMatch >= 0 && hoursToMatch <= 8;
      } catch (e) {
        return false;
      }
    });

    if (upcomingMatchIndex !== -1) {
      setCurrentIndex(upcomingMatchIndex);
    }
  }, [scoreboard]);

  // Update live timer
  useEffect(() => {
    const currentMatch = scoreboard[currentIndex];
    if (!currentMatch) return;

    if (!["1H", "2H"].includes(currentMatch.fixture.status.short)) {
      setLiveElapsed(null);
      return;
    }

    if (currentMatch.fixture.status.elapsed) {
      setLiveElapsed(currentMatch.fixture.status.elapsed);
    }

    const timer = setInterval(() => {
      setLiveElapsed((prev) => (prev !== null ? prev + 1 : prev));
    }, 60000);

    return () => clearInterval(timer);
  }, [scoreboard, currentIndex]);

  // Navigation handlers
  const handlePrevious = () => {
    if (scoreboard.length <= 1) return;
    setCurrentIndex(prev => (prev === 0 ? scoreboard.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (scoreboard.length <= 1) return;
    setCurrentIndex(prev => (prev === scoreboard.length - 1 ? 0 : prev + 1));
  };

  const handleMatchClick = () => {
    const currentMatch = scoreboard[currentIndex];
    if (currentMatch?.fixture?.id) {
      navigate(`/match/${currentMatch.fixture.id}`);
    }
  };

  // Get match status
  const getMatchStatus = (match: any) => {
    if (!match) return "No Match Data";

    const { fixture } = match;
    const now = new Date();

    // Live matches
    if (['1H', '2H', 'HT', 'LIVE', 'BT', 'ET', 'P', 'SUSP', 'INT'].includes(fixture.status.short)) {
      if (fixture.status.short === 'HT') {
        return 'Half Time';
      } else if (['1H', '2H'].includes(fixture.status.short)) {
        const elapsed = liveElapsed || fixture.status.elapsed || 0;
        const halfLabel = fixture.status.short === '1H' ? 'First half' : 'Second half';
        return `${halfLabel}: ${elapsed}'`;
      } else {
        return fixture.status.long || 'LIVE';
      }
    }
    // Finished matches
    else if (fixture.status.short === 'FT') {
      try {
        const matchDate = parseISO(fixture.date);
        const estimatedEndTime = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000);
        const hoursSince = Math.floor((now.getTime() - estimatedEndTime.getTime()) / (1000 * 60 * 60));

        const statusText = hoursSince <= 1 ? 'Ended' : hoursSince < 8 ? `${hoursSince}h ago` : 'Full Time';
        return <div className="flex flex-col items-center mt-0">{statusText}</div>;
      } catch (error) {
        return 'Full Time';
      }
    }
    // Upcoming matches
    else {
      try {
        const matchDate = parseISO(fixture.date);
        const msToMatch = matchDate.getTime() - now.getTime();
        const daysToMatch = Math.floor(msToMatch / (1000 * 60 * 60 * 24));

        if (daysToMatch === 0) {
          const hoursToMatch = Math.floor(msToMatch / (1000 * 60 * 60));
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
            return <span className="text-black">Today</span>;
          }
        }

        if (daysToMatch === 1) {
          return <span className="text-black">Tomorrow</span>;
        } else if (daysToMatch <= 7) {
          return <span className="text-black">{daysToMatch} more days</span>;
        } else {
          return <span className="text-black">{Math.ceil(msToMatch / (1000 * 60 * 60 * 24))} more days</span>;
        }
      } catch (e) {
        return <span className="text-black">Upcoming</span>;
      }
    }
  };

  // Get match status label
  const getMatchStatusLabel = (match: any) => {
    if (!match) return "";

    const { fixture, league } = match;

    if (['1H', '2H', 'HT', 'LIVE', 'BT', 'ET', 'P', 'SUSP', 'INT'].includes(fixture.status.short)) {
      return "LIVE";
    } else if (fixture.status.short === "FT") {
      return "FINISHED";
    } else {
      return league.round || "UPCOMING";
    }
  };

  // Team color helper
  const getTeamColor = (teamId: number) => {
    const colors = ['#6f7c93', '#8b0000', '#1d3557', '#2a9d8f', '#e63946'];
    return colors[teamId % colors.length];
  };

  const currentMatch = scoreboard[currentIndex];

  // Loading state
  if (isLoading && scoreboard.length === 0) {
    return (
      <Card className="px-0 pt-0 pb-2 relative mt-0">
        <Badge
          variant="secondary"
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
        >
          {filterByPopularCountry ? 'Popular Countries' : 'Featured Match'}
        </Badge>
        
        <div className="bg-gray-50 border-b p-2 mt-0">
          <div className="flex items-center justify-center">
            <Skeleton className="h-5 w-5 rounded-full mr-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="p-4">
          <Skeleton className="h-6 w-40 mx-auto mb-6" />
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
          <div className="flex justify-around mt-4 pt-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center w-1/4">
                <Skeleton className="h-5 w-5 mb-1" />
                <Skeleton className="h-3 w-16 mb-1" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // No matches state
  if (!currentMatch) {
    return (
      <Card className="px-0 pt-0 pb-2 relative mt-0">
        <Badge
          variant="secondary"
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
        >
          {filterByPopularCountry ? 'Popular Countries' : 'Featured Match'}
        </Badge>
        
        <div className="flex justify-center items-center py-14 text-gray-500">
          <span>No matches available</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="px-0 pt-0 pb-2 relative mt-0">
      <Badge
        variant="secondary"
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
      >
        {filterByPopularCountry ? 'Popular Countries' : 'Featured Match'}
      </Badge>

      <div className="bg-gray-50 border-b p-2 mt-0">
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

      {scoreboard.length > 1 && (
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
                      background: getTeamColor(currentMatch?.teams?.home?.id || 0),
                      transition: "all 0.3s ease-in-out",
                    }}
                  >
                    {currentMatch?.teams?.home && (
                      <img
                        src={currentMatch.teams.home.logo || `/assets/fallback-logo.svg`}
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
                        const matchDate = parseISO(currentMatch.fixture.date);
                        const formattedDate = format(matchDate, "EEEE, do MMM");
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
                    src={currentMatch?.teams?.away?.logo || `/assets/fallback-logo.svg`}
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
                <svg width="18" height="18" viewBox="0 0 24 24" className="text-gray-600">
                  <path
                    d="M20 3H4C3.45 3 3 3.45 3 4V20C3 20.55 3.45 21 4 21H20C20.55 21 21 20.55 21 20V4C21 3.45 20.55 3 20 3ZM7 7H17V17H7V7Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="text-[0.75rem] text-gray-600 mt-1">Match Page</span>
              </button>
              <button
                className="flex flex-col items-center cursor-pointer w-1/4"
                onClick={() =>
                  currentMatch?.fixture?.id &&
                  navigate(`/match/${currentMatch.fixture.id}/lineups`)
                }
              >
                <svg width="18" height="18" viewBox="0 0 24 24" className="text-gray-600">
                  <path
                    d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM11 19H5V15H11V19ZM11 13H5V9H11V13ZM11 7H5V5H11V7ZM13 19V5H19V19H13Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="text-[0.75rem] text-gray-600 mt-1">Lineups</span>
              </button>
              <button
                className="flex flex-col items-center cursor-pointer w-1/4"
                onClick={() =>
                  currentMatch?.fixture?.id &&
                  navigate(`/match/${currentMatch.fixture.id}/h2h`)
                }
              >
                <svg width="18" height="18" viewBox="0 0 24 24" className="text-gray-600">
                  <path
                    d="M14.06 9.02L16.66 11.62L14.06 14.22L15.48 15.64L18.08 13.04L20.68 15.64L19.26 17.06L21.86 19.66L20.44 21.08L17.84 18.48L15.24 21.08L13.82 19.66L16.42 17.06L15.06 15.64L12.46 13.04L15.06 10.44L13.64 9.02L11.04 11.62L8.44 9.02L9.86 7.6L7.26 5L4.66 7.6L6.08 9.02L3.48 11.62L6.08 14.22L4.66 15.64L2.06 13.04L4.66 10.44L6.08 9.02L3.48 6.42L4.9 5L7.5 7.6L10.1 5L11.52 6.42L8.92 9.02L11.52 11.62L14.06 9.02M12 2C6.47 2 2 6.47 2 12C2 17.53 6.47 22 12 22C17.53 22 22 17.53 22 12C22 6.47 17.53 2 2 12Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="text-[0.75rem] text-gray-600 mt-1">H2H</span>
              </button>
              <button
                className="flex flex-col items-center cursor-pointer w-1/4"
                onClick={() =>
                  currentMatch?.fixture?.id &&
                  navigate(`/match/${currentMatch.fixture.id}/standings`)
                }
              >
                <svg width="18" height="18" viewBox="0 0 24 24" className="text-gray-600">
                  <path
                    d="M12 4C11.17 4 10.36 4.16 9.59 4.47L7.75 6.32L16.68 15.25L18.53 13.4C18.84 12.64 19 11.83 19 11C19 7.13 15.87 4 12 4M5.24 8.66L6.66 7.24L7.93 8.51C8.74 8.2 9.56 8 10.4 7.83L12.24 5.96L3.31 14.89L5.24 8.66M13.6 16.6L5.33 21.88C5.72 22.4 6.29 22.88 6.93 23.17L8.77 21.33L16.36 13.74L13.6 16.6M15.25 17.75L13.4 19.6C12.64 19.84 11.83 20 11 20C7.13 20 4 16.87 4 13C4 12.17 4.16 11.36 4.47 10.59L6.32 8.75L15.25 17.75Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="text-[0.75rem] text-gray-600 mt-1">Standings</span>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation dots */}
      {scoreboard.length > 1 && (
        <div className="flex justify-center gap-2 py-2 mt-2">
          {scoreboard.map((_, index) => (
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

export default MyHomeScoreboardNew;
