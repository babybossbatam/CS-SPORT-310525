import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Star, ChevronLeft, ChevronRight, ChevronDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Calendar } from '../ui/calendar';
import TodayPopularFootballLeagues from './TodayPopularFootballLeagues';
import TodayPopularFootballLeaguesNew from './TodayPopularFootballLeaguesNew';
import TodaysMatchesByCountry from './TodaysMatchesByCountry';
import TodaysMatchesByCountryNew from './TodaysMatchesByCountryNew';
import LiveMatchForAllCountry from './LiveMatchForAllCountry';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { formatYYYYMMDD, getCurrentUTCDateString } from '@/lib/dateUtilsTodayMatch';
import { useQuery } from '@tanstack/react-query';

interface TodayMatchPageCardProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
}

export const TodayMatchPageCard = ({ fixtures, onMatchClick }: TodayMatchPageCardProps) => {
  const [timeFilterActive, setTimeFilterActive] = useState(false);
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getCurrentUTCDateString());
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

  // Get standings from league data
  const { data: leagueStandings } = useQuery({
    queryKey: ['standings', selectedDate],
    queryFn: async () => {
      const leagues = [39, 140, 78, 135, 2, 3]; // Premier League, La Liga, Bundesliga, Serie A, UCL, UEL
      const standingsData = {};

      for (const leagueId of leagues) {
        const response = await apiRequest('GET', `/api/leagues/${leagueId}/standings`);
        const data = await response.json();
        if (data?.league?.standings?.[0]) {
          standingsData[leagueId] = {
            league: data.league,
            standings: data.league.standings[0]
          };
        }
      }
      return standingsData;
    }
  });

  // Deactivate live filter when selected date changes
  useEffect(() => {
    if (liveFilterActive) {
      setLiveFilterActive(false);
    }
  }, [selectedDate]);

  // Date navigation handlers
  const goToPreviousDay = () => {
    const newDate = format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
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
    const yesterday = format(subDays(parseISO(today), 1), 'yyyy-MM-dd');
    const tomorrow = format(addDays(parseISO(today), 1), 'yyyy-MM-dd');

    if (selectedDate === today) {
      return "Today's Matches";
    } else if (selectedDate === yesterday) {
      return "Yesterday's Matches";
    } else if (selectedDate === tomorrow) {
      return "Tomorrow's Matches";
    } else {
      // For any other date, show the formatted date
      return format(parseISO(selectedDate), 'MMM d, yyyy');
    }
  };

  // Debug logging
  console.log('TodayMatchPageCard - selected date:', selectedDate);
  console.log('TodayMatchPageCard - fixtures length:', fixtures?.length || 0);
  console.log('TodayMatchPageCard - league standings:', leagueStandings);

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
              <span className="font-medium">{getTodayMatchPageDisplayName()}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCalendarOpen && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-[320px]">
                <Calendar
                  mode="single"
                  selected={selectedDate ? parseISO(selectedDate) : new Date()}
                  onSelect={handleDateSelect}
                  className="w-full"
                />
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
          <TodayPopularFootballLeaguesNew 
            selectedDate={selectedDate} 
            timeFilterActive={timeFilterActive}
            showTop20={timeFilterActive}
          />
          <TodaysMatchesByCountryNew selectedDate={selectedDate} />
        </>
      )}
    </>
  );
};

export default TodayMatchPageCard;