
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Clock } from 'lucide-react';
import { Card } from '../ui/card';
import { Calendar } from '../ui/calendar';
import TodayPopularFootballLeagues from './TodayPopularFootballLeagues';
import TodaysMatchesByCountry from './TodaysMatchesByCountry';
import TodaysMatchesByCountryNew from './TodaysMatchesByCountryNew';
import LiveMatchForAllCountry from './LiveMatchForAllCountry';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { formatYYYYMMDD, getCurrentUTCDateString, getRelativeDateDisplayName } from '@/lib/dateUtilsUpdated';

import { useEffect, useRef } from 'react';

export const TodayMatchCard = () => {
  const [selectedFilter, setSelectedFilter] = useState("Today's Matches");
  const [timeFilterActive, setTimeFilterActive] = useState(false);
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [localSelectedDate, setLocalSelectedDate] = useState(getCurrentUTCDateString());
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  

  

  // Date navigation handlers
  const goToPreviousDay = () => {
    const newDate = format(subDays(parseISO(localSelectedDate), 1), 'yyyy-MM-dd');
    setLocalSelectedDate(newDate);
    setSelectedFilter(getRelativeDateDisplayName(newDate));
  };

  const goToNextDay = () => {
    const newDate = format(addDays(parseISO(localSelectedDate), 1), 'yyyy-MM-dd');
    setLocalSelectedDate(newDate);
    setSelectedFilter(getRelativeDateDisplayName(newDate));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const selectedDateString = formatYYYYMMDD(date);
      setLocalSelectedDate(selectedDateString);
      setSelectedFilter(getRelativeDateDisplayName(selectedDateString));
      setIsCalendarOpen(false);
    }
  };

  const goToToday = () => {
    const today = getCurrentUTCDateString();
    setLocalSelectedDate(today);
    setSelectedFilter("Today's Matches");
    setIsCalendarOpen(false);
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
              <span className="font-medium">{selectedFilter}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isCalendarOpen && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-[320px]">
                <Calendar
                  mode="single"
                  selected={localSelectedDate ? parseISO(localSelectedDate) : new Date()}
                  onSelect={handleDateSelect}
                  className="w-full"
                />
                <div className="flex justify-center pt-3 border-t mt-3">
                  <button
                    onClick={goToToday}
                    className="text-blue-500 text-sm font-medium hover:text-blue-600 transition-colors px-4 py-1 hover:bg-blue-50 rounded"
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
              setLiveFilterActive(!liveFilterActive);
              setTimeFilterActive(false); // Reset time filter when live is activated
            }}
            className={`flex items-center justify-center gap-1 px-0.5 py-0.5 rounded-full text-xs font-medium w-fit transition-colors duration-200 ${
              liveFilterActive 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-gray-300 text-black hover:bg-gray-400'
            }`} 
            style={{minWidth: 'calc(2rem + 15px)'}}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${liveFilterActive ? 'bg-white' : 'bg-red-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${liveFilterActive ? 'bg-white' : 'bg-red-500'}`}></span>
            </span>
            Live
          </button>

          {/* Spacer to maintain layout */}
          <div className="flex items-center gap-2"></div>

          {/* By time button */}
          <button 
            onClick={() => {
              setTimeFilterActive(!timeFilterActive);
              setLiveFilterActive(false); // Reset live filter when time filter is activated
            }}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium w-fit transition-all duration-200 ${
              timeFilterActive 
                ? 'bg-gray-400 text-black hover:bg-gray-500' 
                : 'bg-gray-300 text-black hover:bg-gray-400'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            By time
          </button>
        </div>
      </Card>

      {liveFilterActive ? (
        <LiveMatchForAllCountry />
      ) : (
        <>
          <TodayPopularFootballLeagues 
            selectedDate={localSelectedDate} 
            timeFilterActive={timeFilterActive}
            showTop20={timeFilterActive}
          />
          <TodaysMatchesByCountry selectedDate={localSelectedDate} />
          <TodaysMatchesByCountryNew selectedDate={localSelectedDate} />
        </>
      )}
    </>
  );
};

export default TodayMatchCard;
