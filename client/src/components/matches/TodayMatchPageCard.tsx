import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Clock } from "lucide-react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Filter, Activity } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTodayPopularFixtures } from "../../hooks/useTodayPopularFixtures";
import TodayPopularFootballLeaguesNew from "./TodayPopularFootballLeaguesNew";
import TodaysMatchesByCountryNew from "./TodaysMatchesByCountryNew";
import LiveMatchForAllCountry from "./LiveMatchForAllCountry";
import LiveMatchByTime from "./LiveMatchByTime";
import TodayMatchByTime from "./TodayMatchByTime";
import MyNewPopularLeague from "./MyNewPopularLeague";
import EnhancementLeague from "./EnhancementLeague";

import { useCachedQuery } from "@/lib/cachingHelper";
import { format, parseISO, addDays, subDays } from "date-fns";
import {
  formatYYYYMMDD,
  getCurrentUTCDateString,
} from "@/lib/dateUtilsUpdated";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import {
  shouldExcludeFromPopularLeagues,
  isRestrictedUSLeague,
} from "@/lib/MyPopularLeagueExclusion";
import { SimpleFetchingLeagues, getTodayLeagueFixtures } from "@/lib/simpleFetchingLeagues";
import { Scores365StyleFetcher, compareWithTargetLeagues } from "@/lib/scores365StyleFetcher";


interface TodayMatchPageCardProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
  onMatchCardClick?: (fixture: any) => void;
}

export const TodayMatchPageCard = ({
  fixtures,
  onMatchClick,
  onMatchCardClick,
}: TodayMatchPageCardProps) => {
  const [timeFilterActive, setTimeFilterActive] = useState(false);
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getCurrentUTCDateString());
  const calendarRef = useRef<HTMLDivElement>(null);
  const [debugLeagueData, setDebugLeagueData] = useState<any>(null);
  const [scores365Comparison, setScores365Comparison] = useState<any>(null);



  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Handle button state changes when date changes
  useEffect(() => {
    const today = getCurrentUTCDateString();
    if (liveFilterActive && timeFilterActive && selectedDate !== today) {
      // If both filters are active and date changes from today, activate time filter and deactivate live
      setLiveFilterActive(false);
      setTimeFilterActive(false);
    } else if (liveFilterActive && selectedDate !== today) {
      // If only live filter is active but date is not today, switch to time filter
      setLiveFilterActive(false);
      setTimeFilterActive(false);
    }
  }, [selectedDate, liveFilterActive, timeFilterActive]);

  // Date navigation handlers
  const goToPreviousDay = () => {
    const newDate = format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd");
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd");
    setSelectedDate(newDate);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const selectedDateString = formatYYYYMMDD(date);
      setSelectedDate(selectedDateString);
      setIsCalendarOpen(false);
    }
  };

  const goToToday = () => {
    const today = getCurrentUTCDateString();
    setSelectedDate(today);
    setIsCalendarOpen(false);
  };

  // Dedicated date display function for TodayMatchPageCard
  const getTodayMatchPageDisplayName = () => {
    const today = getCurrentUTCDateString();
    const yesterday = format(subDays(parseISO(today), 1), "yyyy-MM-dd");
    const tomorrow = format(addDays(parseISO(today), 1), "yyyy-MM-dd");

    if (selectedDate === today) {
      return "Today's Matches";
    } else if (selectedDate === yesterday) {
      return "Yesterday's Matches";
    } else if (selectedDate === tomorrow) {
      return "Tomorrow's Matches";
    } else {
      // For any other date, show the formatted date
      return format(parseISO(selectedDate), "EEE, do MMM");
    }
  };

  // Fetch live fixtures once when either live filter is active
  const { data: sharedLiveFixtures = [], isLoading: isLoadingLive } = useQuery({
    queryKey: ["shared-live-fixtures"],
    queryFn: async () => {
      console.log("Fetching shared live fixtures");
      const response = await apiRequest("GET", "/api/fixtures/live");
      const data = await response.json();
      console.log(`Received ${data.length} shared live fixtures`);
      return data;
    },
    staleTime: 30000,
    gcTime: 2 * 60 * 1000,
    enabled: liveFilterActive, // Only fetch when live filter is active
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 30000,
  });

  // Use the shared fixtures data for all components
  const { filteredFixtures, isLoading } = useTodayPopularFixtures(selectedDate);

  console.log(
    `📊 [TodayMatchPageCard] Got ${filteredFixtures.length} fixtures for ${selectedDate}`,
  );

  // Debug: Show details of the fixtures
  if (filteredFixtures.length > 0) {
    console.log(`🔍 [TodayMatchPageCard] Fixture details for ${selectedDate}:`, 
      filteredFixtures.slice(0, 10).map(fixture => ({
        id: fixture.fixture?.id,
        date: fixture.fixture?.date,
        status: fixture.fixture?.status?.short,
        league: fixture.league?.name,
        country: fixture.league?.country,
        homeTeam: fixture.teams?.home?.name,
        awayTeam: fixture.teams?.away?.name,
        homeGoals: fixture.goals?.home,
        awayGoals: fixture.goals?.away
      }))
    );

    if (filteredFixtures.length > 10) {
      console.log(`📋 [TodayMatchPageCard] ... and ${filteredFixtures.length - 10} more fixtures`);
    }
  }

  // Extract the same fixtures that TodayPopularFootballLeaguesNew would show
  // We need to flatten the fixtures from the country/league structure to individual matches
  const [popularLeagueFixtures, setPopularLeagueFixtures] = useState<any[]>([]);

  useEffect(() => {
    // This is a simple way to get the fixtures that will be shown in TodayPopularFootballLeaguesNew
    // by applying the same filtering logic
    setPopularLeagueFixtures(filteredFixtures);
  }, [filteredFixtures]);

  const handleMatchCardClick = (fixture: any) => {
    console.log('🎯 [TodayMatchPageCard] Match card clicked:', {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      country: fixture.league?.country,
      source: 'TodayMatchPageCard'
    });
    onMatchCardClick?.(fixture);
  };

  const handleLiveMatchClick = (fixture: any) => {
    console.log('🔴 [TodayMatchPageCard] LIVE Match card clicked from LiveMatchForAllCountry:', {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      country: fixture.league?.country,
      status: fixture.fixture?.status?.short,
      source: 'LiveMatchForAllCountry'
    });
    onMatchCardClick?.(fixture);
  };

    // Debug effect for leagues 38 and 15 with 365scores comparison
    useEffect(() => {
      const debugTargetLeagues = async () => {
        try {
          console.log(`🔍 [TodayMatchPageCard] Debugging leagues 38 and 15 for date: ${selectedDate}`);
  
          const result = await getTodayLeagueFixtures(selectedDate);
  
          console.log(`📊 [TodayMatchPageCard] League 38 & 15 Debug Results:`, {
            todayFixtures: result.todayFixtures.length,
            allFoundFixtures: result.allFoundFixtures.length,
            analysis: result.analysis
          });
  
          // Check specifically for leagues 38 and 15
          const league38Fixtures = result.allFoundFixtures.filter(f => f.league.id === 38);
          const league15Fixtures = result.allFoundFixtures.filter(f => f.league.id === 15);
  
          console.log(`🎯 [TodayMatchPageCard] League 38 (UEFA U21) fixtures:`, league38Fixtures.map(f => ({
            id: f.fixture.id,
            date: f.fixture.date,
            localDate: format(parseISO(f.fixture.date), 'yyyy-MM-dd HH:mm'),
            teams: `${f.teams.home.name} vs ${f.teams.away.name}`,
            status: f.fixture.status.short
          })));
  
          console.log(`🏆 [TodayMatchPageCard] League 15 (FIFA Club World Cup) fixtures:`, league15Fixtures.map(f => ({
            id: f.fixture.id,
            date: f.fixture.date,
            localDate: format(parseISO(f.fixture.date), 'yyyy-MM-dd HH:mm'),
            teams: `${f.teams.home.name} vs ${f.teams.away.name}`,
            status: f.fixture.status.short
          })));
  
          setDebugLeagueData({
            league38: league38Fixtures,
            league15: league15Fixtures,
            analysis: result.analysis,
            selectedDate
          });

          // 365scores-style comparison
          console.log(`🏆 [TodayMatchPageCard] Running 365scores-style comparison...`);
          const comparison = await compareWithTargetLeagues(selectedDate);
          
          console.log(`📊 [TodayMatchPageCard] 365scores vs Target Leagues:`, {
            majorGames: comparison.comparison.majorGamesCount,
            targetLeagues: comparison.comparison.targetLeaguesCount,
            overlap: comparison.comparison.overlap,
            uniqueToMajor: comparison.comparison.uniqueToMajor,
            uniqueToTarget: comparison.comparison.uniqueToTarget
          });

          setScores365Comparison(comparison);
  
        } catch (error) {
          console.error(`❌ [TodayMatchPageCard] Error debugging target leagues:`, error);
        }
      };
  
      debugTargetLeagues();
    }, [selectedDate]);

  return (
    <>
            {/* Debug Section for Leagues 38 & 15 */}
            {debugLeagueData && (
        <Card className="mb-4 border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <div className="text-sm font-semibold text-blue-800">
              🔍 Debug: Leagues 38 & 15 for {selectedDate}
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div>
              <strong>League 38 (UEFA U21):</strong> {debugLeagueData.league38.length} fixtures found
              {debugLeagueData.league38.map((fixture: any, index: number) => (
                <div key={fixture.fixture.id} className="ml-2 text-gray-600">
                  {index + 1}. {fixture.teams.home.name} vs {fixture.teams.away.name} 
                  ({format(parseISO(fixture.fixture.date), 'yyyy-MM-dd HH:mm')}) [{fixture.fixture.status.short}]
                </div>
              ))}
            </div>
            <div>
              <strong>League 15 (FIFA Club World Cup):</strong> {debugLeagueData.league15.length} fixtures found
              {debugLeagueData.league15.map((fixture: any, index: number) => (
                <div key={fixture.fixture.id} className="ml-2 text-gray-600">
                  {index + 1}. {fixture.teams.home.name} vs {fixture.teams.away.name} 
                  ({format(parseISO(fixture.fixture.date), 'yyyy-MM-dd HH:mm')}) [{fixture.fixture.status.short}]
                </div>
              ))}
            </div>
            <div className="text-blue-700">
              <strong>Analysis:</strong> {debugLeagueData.analysis.correctDateMatches} correct, {debugLeagueData.analysis.wrongDateMatches} timezone issues
            </div>
          </CardContent>
        </Card>
      )}

      {/* 365scores-style Comparison */}
      {scores365Comparison && (
        <Card className="mb-4 border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <div className="text-sm font-semibold text-green-800">
              🏆 365scores Style vs Target Leagues Comparison
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Major Games (365scores style):</strong> {scores365Comparison.comparison.majorGamesCount}
                <div className="text-gray-600">Champions League, Premier League, etc.</div>
              </div>
              <div>
                <strong>Target Leagues (38 & 15):</strong> {scores365Comparison.comparison.targetLeaguesCount}
                <div className="text-gray-600">UEFA U21 & FIFA Club World Cup</div>
              </div>
            </div>
            <div className="text-green-700">
              <strong>Overlap:</strong> {scores365Comparison.comparison.overlap} matches found in both | 
              <strong> Unique to Major:</strong> {scores365Comparison.comparison.uniqueToMajor} | 
              <strong> Unique to Target:</strong> {scores365Comparison.comparison.uniqueToTarget}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-md w-full">
        <div className="flex items-center justify-between h-9 p-4">
          <button
            onClick={goToPreviousDay}
            className="p-2 hover:bg-gray-100 rounded-r-full flex items-center -ml-4"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="relative h-full flex items-center" ref={calendarRef}>
            <button
              onClick={() => {
                console.log(
                  "Calendar button clicked, current state:",
                  isCalendarOpen,
                );
                setIsCalendarOpen(!isCalendarOpen);
              }}
              className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded-md h-full"
            >
              <span className="font-medium">
                {getTodayMatchPageDisplayName()}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isCalendarOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isCalendarOpen && (
              <div
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 z-[9999] bg-white shadow-xl border border-gray-200 p-1 w-[320px ]"
                onClick={(e) => e.stopPropagation()}
              >
                <Calendar
                  mode="single"
                  selected={selectedDate ? parseISO(selectedDate) : new Date()}
                  onSelect={handleDateSelect}
                  className="w-full"
                  classNames={{
                    months:
                      "flex flex-row space-x-4 space-y-0 justify-between w-full",
                    month: "space-y-1  flex-1",
                    caption:
                      "flex justify-center pt-0 relative items-center mb-2",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button:
                      "h-9 w-9 bg-transparent p-3 opacity-50 hover:opacity-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell:
                      "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "h-6 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-6 w-6 p-0 text-xs font-normal aria-selected:opacity-100 hover:bg-gray-300 rounded-full border-transparent",
                    day_range_end: "day-range-end",
                    day_selected:
                      "bg-blue-500 text-white hover:bg-stone-300 hover:text-gray-900 focus:bg-blue-400 focus:text-white rounded-full",
                    day_today:
                      "text-blue-500 font-normal hover:text-gray-900 hover:bg-stone-300 rounded-full ",
                    day_outside:
                      "day-outside text-gray-400 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-100",
                    day_disabled: "text-gray-600 opacity-50",
                    day_range_middle:
                      "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                />
                <div className="flex justify-center pt-2 ">
                  <button
                    onClick={goToToday}
                    className="text-blue-500 hover:bg-stone-300 text-sm font-medium"
                  >
                    Today
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={goToNextDay}
            className="p-2 hover:bg-gray-100 rounded-l-full flex items-center -mr-4"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center justify-between px-4 pb-4 mt-[20px] text-[110.25%] h-9">
          {/* Live button */}
          <button
            onClick={() => {
              if (!liveFilterActive) {
                // Activating live filter
                setLiveFilterActive(true);
                const today = getCurrentUTCDateString();
                setSelectedDate(today);
                // If time filter is active, keep it active for combined state
                // Otherwise reset it
                if (!timeFilterActive) {
                  setTimeFilterActive(false);
                }
              } else {
                // Deactivating live filter
                setLiveFilterActive(false);
                // Only activate time filter if it was already active (combined state)
                // Otherwise return to default view
                if (!timeFilterActive) {
                  // Return to default view (TodayPopularFootballLeaguesNew)
                  setTimeFilterActive(false);
                } else {
                  // Keep time filter active if it was already active
                  setTimeFilterActive(true);
                }
              }
            }}
            className={`flex items-center justify-center gap-1 px-0.5 py-0.5 rounded-full text-xs font-medium w-fit transition-colors duration-200 ${
              liveFilterActive
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gray-300 text-black hover:bg-gray-400"
            }`}
            style={{ minWidth: "calc(2rem + 15px)" }}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${liveFilterActive ? "bg-white" : "bg-red-400"} opacity-75`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${liveFilterActive ? "bg-white" : "bg-red-500"}`}
              ></span>
            </span>
            Live
          </button>

          {/* Spacer to maintain layout */}
          <div className="flex items-center gap-2"></div>

          {/* By time button */}
          <button
            onClick={() => {
              if (!timeFilterActive) {
                // Activating by time filter
                setTimeFilterActive(true);
                // If live filter is active, keep it active for combined state
                // Otherwise reset it
                if (!liveFilterActive) {
                  setLiveFilterActive(false);
                }
              } else {
                // Deactivating by time filter
                setTimeFilterActive(false);
                // Only activate live if it wasn't already active
                if (!liveFilterActive) {
                  // Return to default view (TodayPopularFootballLeaguesNew)
                  setLiveFilterActive(false);
                } else {
                  // Keep live active if it was already active
                  const today = getCurrentUTCDateString();
                  setSelectedDate(today);
                }
              }
            }}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium w-fit transition-all duration-200 ${
              timeFilterActive
                ? "bg-blue-400 text-white hover:bg-blue-500"
                : "bg-gray-300 text-black hover:bg-gray-400"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            By time
          </button>
        </div>
      </Card>

      {liveFilterActive && timeFilterActive ? (
        // Combined state: Show live matches grouped by time
        <LiveMatchByTime
          liveFilterActive={liveFilterActive}
          timeFilterActive={timeFilterActive}
          liveFixtures={sharedLiveFixtures}
          setLiveFilterActive={setLiveFilterActive}
        />
      ) : liveFilterActive && !timeFilterActive ? (
        // Live only - show LiveMatchForAllCountry
        <LiveMatchForAllCountry
          liveFilterActive={liveFilterActive}
          timeFilterActive={timeFilterActive}
          liveFixtures={sharedLiveFixtures}
          setLiveFilterActive={setLiveFilterActive}
          onMatchCardClick={handleMatchCardClick}
        />
      ) : timeFilterActive && !liveFilterActive ? (
        // Time only - show new TodayMatchByTime component with shared data
        <>
          {console.log(
            `📊 [TodayMatchPageCard] Passing ${popularLeagueFixtures.length} fixtures to TodayMatchByTime`,
          )}
          <TodayMatchByTime
            selectedDate={selectedDate}
            timeFilterActive={timeFilterActive}
            liveFilterActive={liveFilterActive}
          />
        </>
      ) : (
        // Neither filter active - show default view
        <>
          <TodayPopularFootballLeaguesNew
            selectedDate={selectedDate}
            timeFilterActive={timeFilterActive}
            showTop20={timeFilterActive}
            liveFilterActive={liveFilterActive}
            onMatchCardClick={onMatchCardClick}
          />
          <EnhancementLeague
            selectedDate={selectedDate}
            timeFilterActive={false}
            showTop10={false}
            liveFilterActive={false}
            onMatchCardClick={handleMatchCardClick}
            useUTCOnly={true}
          />
          <TodaysMatchesByCountryNew
            selectedDate={selectedDate}
            liveFilterActive={liveFilterActive}
            timeFilterActive={timeFilterActive}
            onMatchCardClick={onMatchCardClick}
          />
        </>
      )}
    </>
  );
};

export default TodayMatchPageCard;