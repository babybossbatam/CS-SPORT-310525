import React, { useState, useRef, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChevronLeft, ChevronRight, ChevronDown, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RootState } from "@/lib/store";
import { uiActions } from "@/lib/store";
import MyNewLeague2 from "@/components/matches/MyNewLeague2";
import TodaysMatchesByCountryNew from "@/components/matches/TodaysMatchesByCountryNew";
import LiveMatchForAllCountry from "@/components/matches/LiveMatchForAllCountry";
import LiveMatchByTime from "@/components/matches/LiveMatchByTime";
import { format, addDays, subDays, parseISO, isValid } from "date-fns";

interface TodayMatchPageCardProps {
  fixtures?: any[];
  onMatchClick?: (matchId: number) => void;
  onMatchCardClick?: (fixture: any) => void;
}

const TodayMatchPageCard: React.FC<TodayMatchPageCardProps> = ({
  fixtures = [],
  onMatchClick,
  onMatchCardClick,
}) => {
  const dispatch = useDispatch();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const [timeFilterActive, setTimeFilterActive] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Handle click outside calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const goToPreviousDay = () => {
    const currentDate = new Date(selectedDate);
    const previousDay = subDays(currentDate, 1);
    const newDateString = format(previousDay, "yyyy-MM-dd");
    dispatch(uiActions.setSelectedDate(newDateString));
  };

  const goToNextDay = () => {
    const currentDate = new Date(selectedDate);
    const nextDay = addDays(currentDate, 1);
    const newDateString = format(nextDay, "yyyy-MM-dd");
    dispatch(uiActions.setSelectedDate(newDateString));
  };

  const getDisplayName = () => {
    try {
      const date = parseISO(selectedDate);
      if (!isValid(date)) {
        return "Invalid Date";
      }

      const today = new Date();
      const yesterday = subDays(today, 1);
      const tomorrow = addDays(today, 1);

      const todayString = format(today, "yyyy-MM-dd");
      const yesterdayString = format(yesterday, "yyyy-MM-dd");
      const tomorrowString = format(tomorrow, "yyyy-MM-dd");

      if (selectedDate === todayString) {
        return "Today's Matches";
      } else if (selectedDate === yesterdayString) {
        return "Yesterday's Matches";
      } else if (selectedDate === tomorrowString) {
        return "Tomorrow's Matches";
      } else {
        return format(date, "EEEE, MMMM do");
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Today's Matches";
    }
  };

  const handleMatchCardClick = (fixture: any) => {
    console.log('🎯 [TodayMatchPageCard] Match card clicked:', fixture);
    if (onMatchCardClick) {
      onMatchCardClick(fixture);
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
              <span className="font-medium">{getDisplayName()}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isCalendarOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
          <button
            onClick={goToNextDay}
            className="p-2 hover:bg-gray-100 rounded-l-full flex items-center -mr-4"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Live and By Time Filter Buttons */}
        <div className="flex space-x-2 mb-4 px-4">
          <button
            onClick={() => {
              setLiveFilterActive(!liveFilterActive);
              console.log("🔴 Live filter toggled:", !liveFilterActive);
            }}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              liveFilterActive
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Live
          </button>
          <button
            onClick={() => {
              setTimeFilterActive(!timeFilterActive);
              console.log("⏰ Time filter toggled:", !timeFilterActive);
            }}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              timeFilterActive
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            By time
          </button>
        </div>
      </Card>

      {/* Conditional Rendering Based on Filter States */}
      {liveFilterActive && timeFilterActive ? (
        // Combined state: Show live matches grouped by time
        <LiveMatchByTime
          liveFilterActive={liveFilterActive}
          timeFilterActive={timeFilterActive}
          setLiveFilterActive={setLiveFilterActive}
          onMatchCardClick={handleMatchCardClick}
        />
      ) : liveFilterActive && !timeFilterActive ? (
        // Live only - show LiveMatchForAllCountry
        <LiveMatchForAllCountry
          liveFilterActive={liveFilterActive}
          timeFilterActive={timeFilterActive}
          setLiveFilterActive={setLiveFilterActive}
          onMatchCardClick={handleMatchCardClick}
        />
      ) : timeFilterActive && !liveFilterActive ? (
        // Time only - show TodaysMatchesByCountryNew component
        <TodaysMatchesByCountryNew
          selectedDate={selectedDate}
          timeFilterActive={timeFilterActive}
          liveFilterActive={liveFilterActive}
          onMatchCardClick={onMatchCardClick}
        />
      ) : (
        // Neither filter active - show default view
        <MyNewLeague2
          selectedDate={selectedDate}
          onMatchCardClick={onMatchCardClick}
          timeFilterActive={timeFilterActive}
          liveFilterActive={liveFilterActive}
        />
      )}
    </>
  );
};

export default TodayMatchPageCard;