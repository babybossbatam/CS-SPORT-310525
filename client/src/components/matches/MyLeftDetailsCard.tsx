import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Clock } from "lucide-react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Filter, Activity } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";


import LiveMatchForAllCountry from "./LiveMatchForAllCountry";
import LiveMatchByTime from "./LiveMatchByTime";
import TodayMatchByTime from "./TodayMatchByTime";
import MyDetailsFixture from "./MyDetailsFixture";
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



interface MyLeftDetailsCardProps {
  fixtures: any[];
  featuredMatchId?: number;
  onMatchClick?: (matchId: number) => void;
  onMatchCardClick?: (fixture: any) => void;
}

export const MyLeftDetailsCard = ({
  fixtures,
  featuredMatchId,
  onMatchClick,
  onMatchCardClick,
}: MyLeftDetailsCardProps) => {
  const [timeFilterActive, setTimeFilterActive] = useState(false);
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getCurrentUTCDateString());
  const calendarRef = useRef<HTMLDivElement>(null);




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

  // Dedicated date display function for MyLeftDetailsCard
  const getMyLeftDetailsCardDisplayName = () => {
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

  console.log(`📊 [MyLeftDetailsCard] Rendering for date: ${selectedDate}`);

  const handleMatchCardClick = (fixture: any) => {
    console.log('🎯 [MyLeftDetailsCard] Match card clicked:', {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      country: fixture.league?.country,
      homeTeamId: fixture.teams?.home?.id,
      awayTeamId: fixture.teams?.away?.id,
      source: 'MyLeftDetailsCard'
    });
    onMatchCardClick?.(fixture);
  };

  const handleLiveMatchClick = (fixture: any) => {
    console.log('🔴 [MyLeftDetailsCard] LIVE Match card clicked from LiveMatchForAllCountry:', {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      country: fixture.league?.country,
      status: fixture.fixture?.status?.short,
      source: 'LiveMatchForAllCountry'
    });
    onMatchCardClick?.(fixture);
  };

  // Using native UTC methods instead of date-fns to avoid timezone conversion

  // Format match time for display in UTC (no timezone conversion)
  const formatMatchTime = (dateString: string | null | undefined) => {
    if (!dateString || typeof dateString !== "string") return "--:--";

    try {
      // Parse and display in UTC - no timezone conversion
      const utcDate = new Date(dateString);
      if (isNaN(utcDate.getTime())) return "--:--";

      // Return UTC time formatted as HH:MM
      return utcDate.toISOString().substring(11, 16);
    } catch (error) {
      console.error("Error formatting match time:", error);
      return "--:--";
    }
  };


  return (
    <>


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
                {getMyLeftDetailsCardDisplayName()}
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
        <div className="flex items-center border-b border-gray-200 px-4 pb-0 mt-[20px]">
          {/* Scores Overview Tab */}
          <button
            onClick={() => {
              setLiveFilterActive(false);
              setTimeFilterActive(false);
            }}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
              !liveFilterActive && !timeFilterActive
                ? "text-blue-600 border-blue-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Scores Overview
          </button>

          {/* Results Tab */}
          <button
            onClick={() => {
              setLiveFilterActive(false);
              setTimeFilterActive(true);
            }}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
              !liveFilterActive && timeFilterActive
                ? "text-blue-600 border-blue-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Results
          </button>

          {/* Fixtures Tab */}
          <button
            onClick={() => {
              setLiveFilterActive(true);
              setTimeFilterActive(false);
              const today = getCurrentUTCDateString();
              setSelectedDate(today);
            }}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
              liveFilterActive && !timeFilterActive
                ? "text-blue-600 border-blue-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Fixtures
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
        // Time only - show new TodayMatchByTime component
        <TodayMatchByTime
          selectedDate={selectedDate}
          timeFilterActive={timeFilterActive}
          liveFilterActive={liveFilterActive}
        />

      ) : (

        // Neither filter active - show default view
        <>
          <MyDetailsFixture
            selectedDate={selectedDate}
            selectedMatchId={featuredMatchId}
            onMatchCardClick={onMatchCardClick}
            currentLeagueId={undefined} // Use undefined for general view, pass specific league ID from match details
          />

        </>
      )
    }
</>
  );
};

export default MyLeftDetailsCard;