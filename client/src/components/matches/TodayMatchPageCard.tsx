import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Clock } from "lucide-react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Filter, Activity } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { useTranslation, useLanguage } from "@/contexts/LanguageContext";

import TodaysMatchesByCountryNew from "./TodaysMatchesByCountryNew";
import LiveMatchForAllCountry from "./LiveMatchForAllCountry";
import LiveMatchByTime from "./LiveMatchByTime";
import TodayMatchByTime from "./TodayMatchByTime";
import MyNewLeague2 from "./MyNewLeague2";
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

// Import MyRightContent
import MyRightContent from "../layout/MyRightContent";


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
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  // Calendar translation helpers
  const getMonthName = (monthIndex: number): string => {
    const monthKeys = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    return t(monthKeys[monthIndex]);
  };

  const formatCaption = (date: Date) => {
    return `${getMonthName(date.getMonth())} ${date.getFullYear()}`;
  };

  // Get translated weekday names
  const getWeekdayNames = () => {
    return [
      t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')
    ];
  };


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

  // Dedicated date display function for match page
  const getDateDisplayName = () => {
    const today = getCurrentUTCDateString();
    const yesterday = format(subDays(parseISO(today), 1), "yyyy-MM-dd");
    const tomorrow = format(addDays(parseISO(today), 1), "yyyy-MM-dd");

    console.log(`🌍 [DateDisplay] Current language: ${currentLanguage}, Selected date: ${selectedDate}`);

    if (selectedDate === today) {
      const translation = t('today_matches');
      console.log(`📅 [DateDisplay] Today translation for ${currentLanguage}: ${translation}`);
      return translation;
    } else if (selectedDate === yesterday) {
      const translation = t('yesterday_matches');
      console.log(`📅 [DateDisplay] Yesterday translation for ${currentLanguage}: ${translation}`);
      return translation;
    } else if (selectedDate === tomorrow) {
      const translation = t('tomorrow_matches');
      console.log(`📅 [DateDisplay] Tomorrow translation for ${currentLanguage}: ${translation}`);
      return translation;
    } else {
      // Format the date based on language
      const date = parseISO(selectedDate);
      if (currentLanguage.startsWith('zh')) {
        // Get day of week in Chinese
        const dayOfWeek = format(date, 'EEEE');
        const dayKey = dayOfWeek.toLowerCase();
        const translatedDay = t(dayKey) !== dayKey ? t(dayKey) : dayOfWeek;

        // Format as "週五, 8月8日" style
        return `${translatedDay}, ${format(date, 'M月d日')}`;
      } else {
        return format(date, 'MMM d');
      }
    }
  };

  // Helper function for ordinal suffix (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
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

  console.log(`📊 [TodayMatchPageCard] Rendering for date: ${selectedDate}`);

  const handleMatchCardClick = (fixture: any) => {
    console.log('🎯 [TodayMatchPageCard] Match card clicked:', {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      country: fixture.league?.country,
      homeTeamId: fixture.teams?.home?.id,
      awayTeamId: fixture.teams?.away?.id,
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
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-r-full flex items-center -ml-4"
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
              className="flex items-center gap-3 px-3 py-4   h-full"
            >
              <span className={`font-medium ${currentLanguage.startsWith('zh') ? 'font-sans' : ''}`}>
                {getDateDisplayName()}
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
                  formatters={{
                    formatCaption: formatCaption,
                    formatWeekdayName: (date: Date) => {
                      const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                      return t(dayKeys[date.getDay()]);
                    }
                  }}
                  labels={{
                    labelMonthDropdown: () => t('month'),
                    labelYearDropdown: () => t('year'),
                    labelNext: () => t('next_month'),
                    labelPrevious: () => t('previous_month'),
                    labelDay: (date) => date.getDate().toString(),
                    labelWeekday: (date) => {
                      const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                      return t(dayKeys[date.getDay()]);
                    }
                  }}
                  weekStartsOn={0}
                  locale={{
                    localize: {
                      day: (n: number) => {
                        const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                        return t(dayKeys[n]);
                      }
                    }
                  }}
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
                    {t('today')}
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={goToNextDay}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-l-full flex items-center -mr-4"
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
            {t('live')}
          </button>

          {/* Spacer to maintain layout */}
          <div className="flex items-center gap-2"></div>

          {/* By time button */}
          <button
            onClick={() => {
              // Check if Live is active but no live matches exist - disable functionality
              if (liveFilterActive && (!sharedLiveFixtures || sharedLiveFixtures.length === 0)) {
                return; // Do nothing if Live is active but no live matches
              }

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
              // Disable button appearance when Live is active but no live matches
              liveFilterActive && (!sharedLiveFixtures || sharedLiveFixtures.length === 0)
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : timeFilterActive
                ? "bg-blue-400 text-white hover:bg-blue-500"
                : "bg-gray-300 text-black hover:bg-gray-400"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            {t('by_time')}
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
          <MyNewLeague2
            selectedDate={selectedDate}
            timeFilterActive={false}
            showTop10={false}
            liveFilterActive={liveFilterActive}
            onMatchCardClick={handleMatchCardClick}
            useUTCOnly={true}
          />

          <TodaysMatchesByCountryNew
            selectedDate={selectedDate}
            liveFilterActive={liveFilterActive}
            timeFilterActive={timeFilterActive}
            onMatchCardClick={onMatchCardClick}
          />

          {/* Render MyRightContent below TodaysMatchesByCountryNew on mobile */}
          <div className="md:hidden">
            <MyRightContent />
          </div>

        </>
      )
    }
</>
  );
};

export default TodayMatchPageCard;