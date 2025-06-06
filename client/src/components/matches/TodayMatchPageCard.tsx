import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Clock } from "lucide-react";
import { Card } from "../ui/card";
import { Calendar } from "../ui/calendar";
import TodayPopularFootballLeaguesNew from "./TodayPopularFootballLeaguesNew";
import TodaysMatchesByCountryNew from "./TodaysMatchesByCountryNew";
import LiveMatchForAllCountry from "./LiveMatchForAllCountry";
import LiveMatchByTime from "./LiveMatchByTime";
import TodayMatchByTime from "./TodayMatchByTime";
import { format, parseISO, addDays, subDays } from "date-fns";
import {
  formatYYYYMMDD,
  getCurrentUTCDateString,
} from "@/lib/dateUtilsUpdated";

interface TodayMatchPageCardProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
}

export const TodayMatchPageCard = ({
  fixtures,
  onMatchClick,
}: TodayMatchPageCardProps) => {
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
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
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
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 bg-white rounded-lg shadow-lg p-2 w-[300px]"
                style={{ marginLeft: "0px" }}
              >
                <Calendar
                  mode="single"
                  selected={selectedDate ? parseISO(selectedDate) : new Date()}
                  onSelect={handleDateSelect}
                  className="w-full"
                  classNames={{
                    months:
                      "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button:
                      "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell:
                      "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md",
                    day_range_end: "day-range-end",
                    day_selected:
                      "bg-blue-500 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-500 focus:text-white",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside:
                      "day-outside text-gray-400 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                    day_disabled: "text-gray-400 opacity-50",
                    day_range_middle:
                      "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                />
                <div className="flex justify-center pt-3 border-t mt-3">
                  <button
                    onClick={goToToday}
                    className="text-blue-500 hover:text-blue-600 text-sm font-medium"
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
        />
      ) : liveFilterActive && !timeFilterActive ? (
        // Live only - show LiveMatchForAllCountry
        <LiveMatchForAllCountry
          isTimeFilterActive={false}
          liveFilterActive={liveFilterActive}
          timeFilterActive={timeFilterActive}
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
          <TodayPopularFootballLeaguesNew
            selectedDate={selectedDate}
            timeFilterActive={timeFilterActive}
            showTop20={timeFilterActive}
          />
          <TodaysMatchesByCountryNew
            selectedDate={selectedDate}
            liveFilterActive={liveFilterActive}
            timeFilterActive={timeFilterActive}
          />
        </>
      )}
    </>
  );
};

export default TodayMatchPageCard;
