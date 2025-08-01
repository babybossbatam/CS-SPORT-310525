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
        <div className="flex items-center border-b border-gray-200 px-4 pb-0 mt-4">
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