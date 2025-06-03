import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid, differenceInHours } from "date-fns";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { shouldExcludeFixture } from "@/lib/exclusionFilters";
import { isToday, isYesterday, isTomorrow } from "@/lib/dateUtilsUpdated";
import { getCountryFlagWithFallback } from "@/lib/flagUtils";
import { MySmartDateLabeling } from "@/lib/MySmartDateLabeling";
import { 
  isDateStringToday,
  isDateStringYesterday,
  isDateStringTomorrow,
  isFixtureOnClientDate 
} from '@/lib/dateUtilsUpdated';

interface TodayMatchByTimeProps {
  selectedDate: string;
  timeFilterActive?: boolean;
  liveFilterActive?: boolean;
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  timeFilterActive = false,
  liveFilterActive = false,
}) => {
  const [enableFetching, setEnableFetching] = useState(true);

  // Popular leagues for prioritization
  const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga

  // Fetch all fixtures for the selected date
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ['all-fixtures-by-date', selectedDate],
    queryFn: async () => {
      console.log(`Fetching fixtures for date: ${selectedDate}`);
      const response = await apiRequest(
        "GET",
        `/api/fixtures/date/${selectedDate}?all=true`,
      );
      const data = await response.json();

      console.log(`Received ${data.length} fixtures for ${selectedDate}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection time
    enabled: !!selectedDate && enableFetching,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Apply smart date filtering to prevent yesterday matches from appearing in today view
  const smartFilteredFixtures = fixtures.filter((fixture: any) => {
    if (!fixture?.fixture?.date || !fixture?.fixture?.status?.short) return true;

    const smartResult = MySmartDateLabeling.getSmartDateLabel(
      fixture.fixture.date,
      fixture.fixture.status.short
    );

    // For selected date filtering, accept matches that smart labeling considers appropriate
    const isSelectedToday = isDateStringToday(selectedDate);
    const isSelectedYesterday = isDateStringYesterday(selectedDate);
    const isSelectedTomorrow = isDateStringTomorrow(selectedDate);

    // Strict matching: only include if smart labeling matches selected date type
    if (isSelectedToday && smartResult.label === 'today') return true;
    if (isSelectedYesterday && smartResult.label === 'yesterday') return true;
    if (isSelectedTomorrow && smartResult.label === 'tomorrow') return true;

    // For matches with finished/live status, use standard date matching as fallback
    const finishedStatuses = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'];
    const liveStatuses = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'];

    if (finishedStatuses.includes(fixture.fixture.status.short) || 
        liveStatuses.includes(fixture.fixture.status.short)) {
      return isFixtureOnClientDate(fixture.fixture.date, selectedDate);
    }

    // For not started matches, strictly follow smart date labeling - no fallback
    return false;
  });

  // Use only the main fixtures data
  const allFixtures = fixtures;

  // Collect all matches from all leagues and add league info
  const allMatches = allFixtures
    .map((fixture: any) => ({
      ...fixture,
      leagueInfo: {
        name: fixture.league?.name || "Unknown League",
        country: fixture.league?.country || "Unknown Country",
        logo: fixture.league?.logo || "/assets/fallback-logo.svg",
      },
    }))
    .filter((fixture: any) => {
      // Validate fixture structure
      if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
        return false;
      }

      // Apply smart date filtering first
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        const smartResult = MySmartDateLabeling.getSmartDateLabel(
          fixture.fixture.date,
          fixture.fixture.status.short
        );

        // Check if this fixture belongs to the selected date using smart logic
        const selectedDateObj = new Date(selectedDate);
        const currentDate = new Date();

        const isSelectedToday = isToday(selectedDateObj);
        const isSelectedYesterday = isYesterday(selectedDateObj);
        const isSelectedTomorrow = isTomorrow(selectedDateObj);

        // Apply smart filtering - only include if it matches the selected date's smart label
        let matchesSmartDate = false;
        if (isSelectedToday && smartResult.label === 'today') matchesSmartDate = true;
        if (isSelectedYesterday && smartResult.label === 'yesterday') matchesSmartDate = true;
        if (isSelectedTomorrow && smartResult.label === 'tomorrow') matchesSmartDate = true;

        // For other dates, use standard date matching
        if (!isSelectedToday && !isSelectedYesterday && !isSelectedTomorrow) {
          const fixtureDate = parseISO(fixture.fixture.date);
          if (isValid(fixtureDate)) {
            const fixtureLocalDate = format(fixtureDate, 'yyyy-MM-dd');
            matchesSmartDate = fixtureLocalDate === selectedDate;
          }
        }

        if (!matchesSmartDate) return false;
      }

      // Apply exclusion filters
      const leagueName = fixture.league.name || "";
      const homeTeamName = fixture.teams?.home?.name || "";
      const awayTeamName = fixture.teams?.away?.name || "";

      // Skip exclusion filter for Egypt matches
      if (fixture.league.country?.toLowerCase() !== "egypt") {
        if (shouldExcludeFixture(leagueName, homeTeamName, awayTeamName)) {
          return false;
        }
      }

      return true;
    });

  // Filter for live matches only when both filters are active
  const filteredMatches =
    liveFilterActive && timeFilterActive
      ? allMatches.filter((match: any) => {
          const status = match.fixture.status.short;
          return ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
            status,
          );
        })
      : allMatches;

  // Sort all matches by priority: Live → Upcoming → Finished
  const sortedMatches = filteredMatches.sort((a: any, b: any) => {
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

    // Check if matches are live
    const aIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
      aStatus,
    );
    const bIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
      bStatus,
    );

    // Live matches first
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;

    // If both are live, sort by elapsed time ascending (shorter elapsed time first)
    if (aIsLive && bIsLive) {
      const aElapsed = Number(a.fixture.status.elapsed) || 0;
      const bElapsed = Number(b.fixture.status.elapsed) || 0;
      return aElapsed - bElapsed; // Ascending order: shorter elapsed time first
    }

    // Check if matches are finished
    const aIsFinished = ["FT", "AET", "PEN"].includes(aStatus);
    const bIsFinished = ["FT", "AET", "PEN"].includes(bStatus);

    // Upcoming matches before finished matches
    if (!aIsFinished && bIsFinished) return -1;
    if (aIsFinished && !bIsFinished) return 1;

    // Within same category, sort by time
    return aTime - bTime;
  });

  // Get header title based on button states and selected date
  const getHeaderTitle = () => {
    // Check for different button states first
    if (liveFilterActive && timeFilterActive) {
      return "Popular Football Live Score";
    } else if (!liveFilterActive && timeFilterActive) {
      return "All Matches by Time";
    }

    // Default behavior based on selected date
    const selectedDateObj = new Date(selectedDate);

    if (isToday(selectedDateObj)) {
      return "Today's Matches by Time";
    } else if (isYesterday(selectedDateObj)) {
      return "Yesterday's Matches by Time";
    } else if (isTomorrow(selectedDateObj)) {
      return "Tomorrow's Matches by Time";
    } else {
      return `Football Matches - ${format(selectedDateObj, "MMM d, yyyy")}`;
    }
  };

  // Show loading only if we're actually loading and have no data
  if (isLoading && !fixtures.length) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-3 w-44" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-b border-gray-100 last:border-b-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-6 h-4 rounded-sm" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!allFixtures.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No matches available for this date</p>
        </CardContent>
      </Card>
    );
  }

  // Group matches by time slots with enhanced prioritization
  const matchesByTime = smartFilteredFixtures
    .filter((fixture: any) => {
      // Validate fixture structure
      if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
        return false;
      }

      const matchDate = parseISO(fixture.fixture.date);
      if (!isValid(matchDate)) return false;

      return true;
    })
    .reduce((acc: Record<string, any[]>, fixture: any) => {
      const matchDate = parseISO(fixture.fixture.date);
      if (!isValid(matchDate)) return acc;

      const timeSlot = format(matchDate, "HH:00");

      if (!acc[timeSlot]) {
        acc[timeSlot] = [];
      }

      // Add other fixture details as needed
      acc[timeSlot].push(fixture);
      return acc;
    }, {});

    // Prioritize popular leagues and sort by time
  const matchesByTimeWithPriority = useMemo(() => {
    const timeGroups: Record<string, any[]> = {};

    // Popular leagues for prioritization (matching MyPopularLeagueExclusion logic)
    const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78, 848, 15]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga, Conference League, FIFA Club World Cup

    filteredMatches.forEach((match: any) => {
      const matchDate = parseISO(match.fixture.date);
      if (!isValid(matchDate)) return;

      const timeSlot = format(matchDate, "HH:00");

      if (!timeGroups[timeSlot]) {
        timeGroups[timeSlot] = [];
      }

      // Add priority flag for popular leagues
      match.isPopularLeague = POPULAR_LEAGUES.includes(match.league.id);

      timeGroups[timeSlot].push(match);
    });

    // Sort matches within each time slot by league priority and match importance
    Object.keys(timeGroups).forEach(timeSlot => {
      timeGroups[timeSlot].sort((a: any, b: any) => {
        // First prioritize popular leagues
        if (a.isPopularLeague && !b.isPopularLeague) return -1;
        if (!a.isPopularLeague && b.isPopularLeague) return 1;

        // Then by match status (live matches first)
        const aStatus = a.fixture.status.short;
        const bStatus = b.fixture.status.short;
        const aIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
        const bIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);

        if (aIsLive && !bIsLive) return -1;
        if (!aIsLive && bIsLive) return 1;

        // Prioritize major international competitions
        const aMajorInternational = a.league.name.toLowerCase().includes('champions league') ||
                                   a.league.name.toLowerCase().includes('europa league') ||
                                   a.league.name.toLowerCase().includes('world cup') ||
                                   a.league.name.toLowerCase().includes('copa america');
        const bMajorInternational = b.league.name.toLowerCase().includes('champions league') ||
                                   b.league.name.toLowerCase().includes('europa league') ||
                                   b.league.name.toLowerCase().includes('world cup') ||
                                   b.league.name.toLowerCase().includes('copa america');

        if (aMajorInternational && !bMajorInternational) return -1;
        if (!aMajorInternational && bMajorInternational) return 1;

        // Finally by league name
        return a.league.name.localeCompare(b.league.name);
      });
    });

    return timeGroups;
  }, [filteredMatches]);

  return (
    <>
      {/* Main Header */}

      {/* Single consolidated card with all matches sorted by time */}
      <Card className="mt-4 overflow-hidden">
        {/* Header showing total matches */}
        <div className="flex items-start gap-2 p-3 bg-white border-b border-gray-200">
          <div className="flex flex-col">
            <span className="font-semibold text-base text-gray-800">
              Popular Football Leagues
            </span>
          </div>
          {liveFilterActive && timeFilterActive && (
            <div className="flex gap-1 ml-auto">
              <span className="relative flex h-3 w-3 mt-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
          )}
        </div>

        {/* All Matches */}
        <CardContent className="p-0">
          <div className="space-y-0">
            {Object.entries(matchesByTime).map(([timeSlot, matches]) => (
              <div key={timeSlot}>

                {matches.map((match: any) => (
                  <div
                    key={match.fixture.id}
                    className="bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center px-3 py-3 flex-1 min-h-[60px]">
                      {/* Home Team - Fixed width to prevent overflow */}
                      <div className="text-right text-sm text-gray-900 w-[100px] pr-2 truncate flex-shrink-0">
                        {match.teams.home.name || "Unknown Team"}
                      </div>

                      <div className="flex-shrink-0 mx-1 flex items-center justify-center">
                        <img
                          src={match.teams.home.logo || "/assets/fallback-logo.svg"}
                          alt={match.teams.home.name}
                          className="w-9 h-9 object-cover rounded-full"
                          style={{
                            aspectRatio: "1/1",
                            minWidth: "36px",
                            minHeight: "36px",
                            objectFit: "cover",
                            objectPosition: "center",
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== "/assets/fallback-logo.svg") {
                              target.src = "/assets/fallback-logo.svg";
                            }
                          }}
                        />
                      </div>

                      {/* Score/Time Center - Fixed width to maintain position */}
                      <div className="flex flex-col items-center justify-center px-4 w-[80px] flex-shrink-0 relative h-12">
                        {(() => {
                          const status = match.fixture.status.short;
                          const fixtureDate = parseISO(match.fixture.date);

                          // Live matches
                          if (
                            [
                              "LIVE",
                              "1H",
                              "HT",
                              "2H",
                              "ET",
                              "BT",
                              "P",
                              "INT",
                            ].includes(status)
                          ) {
                            return (
                              <div className="relative">
                                <div className="text-lg font-bold flex items-center gap-2">
                                  <span className="text-black">
                                    {match.goals?.home ?? 0}
                                  </span>
                                  <span className="text-gray-400">-</span>
                                  <span className="text-black">
                                    {match.goals?.away ?? 0}
                                  </span>
                                </div>
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs font-semibold">
                                  <span className="text-red-600 animate-pulse bg-white px-1 rounded">
                                    {status === "HT"
                                      ? "HT"
                                      : `${match.fixture.status.elapsed || 0}'`}
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          // Finished matches
                          if (
                            [
                              "FT",
                              "AET",
                              "PEN",
                              "AWD",
                              "WO",
                              "ABD",
                              "CANC",
                              "SUSP",
                            ].includes(status)
                          ) {
                            const homeScore = match.goals?.home;
                            const awayScore = match.goals?.away;
                            const hasValidScores =
                              homeScore !== null &&
                              homeScore !== undefined &&
                              awayScore !== null &&
                              awayScore !== undefined &&
                              !isNaN(Number(homeScore)) &&
                              !isNaN(Number(awayScore));

                            if (hasValidScores) {
                              return (
                                <div className="relative">
                                  <div className="text-lg font-bold flex items-center gap-2">
                                    <span className="text-black">{homeScore}</span>
                                    <span className="text-gray-400">-</span>
                                    <span className="text-black">{awayScore}</span>
                                  </div>
                                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs font-semibold">
                                    <span className="text-gray-600 bg-white px-1 rounded">
                                      {status === "FT" ? "Ended" : status}
                                    </span>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div className="relative">
                                  <div className="text-sm font-medium text-gray-900">
                                    {format(fixtureDate, "HH:mm")}
                                  </div>
                                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs font-semibold">
                                    <span className="text-gray-600 bg-white px-1 rounded">
                                      {status === "FT" ? "No Score" : status}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                          }

                          // Upcoming matches
                          return (
                            <div className="relative flex items-center justify-center h-full">
                              <div className="text-base font-medium text-black">
                                {status === "TBD"
                                  ? "TBD"
                                  : format(fixtureDate, "HH:mm")}
                              </div>
                              {status === "TBD" && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs">
                                  <span className="text-gray-500 bg-white px-1 rounded">
                                    Time TBD
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex-shrink-0 mx-1 flex items-center justify-center">
                        <img
                          src={match.teams.away.logo || "/assets/fallback-logo.svg"}
                          alt={match.teams.away.name}
                          className="w-9 h-9 object-cover rounded-full"
                          style={{
                            aspectRatio: "1/1",
                            minWidth: "36px",
                            minHeight: "36px",
                            objectFit: "cover",
                            objectPosition: "center",
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== "/assets/fallback-logo.svg") {
                              target.src = "/assets/fallback-logo.svg";
                            }
                          }}
                        />
                      </div>

                      {/* Away Team - Fixed width for consistency */}
                      <div className="text-left text-sm text-gray-900 w-[100px] pl-2 truncate flex-shrink-0">
                        {match.teams.away.name || "Unknown Team"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default TodayMatchByTime;