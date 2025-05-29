import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectTrigger } from '../ui/select';
import { Calendar } from '../ui/calendar';
import TodayPopularFootballLeagues from './TodayPopularFootballLeagues';
import TodaysMatchesByCountry from './TodaysMatchesByCountry';
import LiveMatchForAllCountry from './LiveMatchForAllCountry';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { formatYYYYMMDD, getCurrentUTCDateString } from '@/lib/dateUtilsUpdated';

interface FixtureProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
}



export const MatchFixturesCard = ({ fixtures, onMatchClick }: FixtureProps) => {
  const [selectedFilter, setSelectedFilter] = useState("Today's Matches");
  const [timeFilterActive, setTimeFilterActive] = useState(false);
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const dispatch = useDispatch();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);

  

  

  return (
    <>
      <Card className="shadow-md w-full">
        <div className="flex items-center justify-between h-9 p-4">
          <button className="p-2 hover:bg-gray-100 rounded-r-full flex items-center -ml-4">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="relative h-full flex items-center">
            <Select>
              <SelectTrigger className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded-md h-full border-0 bg-transparent">
                <span className="font-medium">{selectedFilter}</span>
              </SelectTrigger>
              <SelectContent align="start" className="w-[280px] p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate ? parseISO(selectedDate) : new Date()}
                  onSelect={(date) => {
                    if (date) {
                      // Use consistent UTC date formatting for API consistency
                      const selectedDateString = formatYYYYMMDD(date);
                      
                      // Get the actual current date for comparison
                      const actualToday = getCurrentUTCDateString();
                      const actualYesterday = formatYYYYMMDD(subDays(new Date(), 1));
                      const actualTomorrow = formatYYYYMMDD(addDays(new Date(), 1));

                      // Update Redux store with selected date
                      dispatch({ type: 'ui/setSelectedDate', payload: selectedDateString });

                      console.log('Date selected:', selectedDateString);
                      console.log('Actual Today:', actualToday);
                      console.log('Actual Yesterday:', actualYesterday);
                      console.log('Actual Tomorrow:', actualTomorrow);

                      // Compare with actual dates to determine the filter label
                      if (selectedDateString === actualToday) {
                        setSelectedFilter("Today's Matches");
                      } else if (selectedDateString === actualYesterday) {
                        setSelectedFilter("Yesterday's Matches");
                      } else if (selectedDateString === actualTomorrow) {
                        setSelectedFilter("Tomorrow's Matches");
                      } else {
                        setSelectedFilter(format(date, 'MMM d, yyyy'));
                      }

                      // Close the dropdown
                      const select = document.querySelector('[data-state="open"]')?.parentElement;
                      if (select) {
                        const event = new Event('mousedown', { bubbles: true });
                        select.dispatchEvent(event);
                      }
                    }
                  }}
                  className="rounded-md"
                />
              </SelectContent>
            </Select>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-l-full flex items-center -mr-4">
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
            selectedDate={selectedDate} 
            timeFilterActive={timeFilterActive}
            showTop20={timeFilterActive}
          />
          <TodaysMatchesByCountry selectedDate={selectedDate} />
        </>
      )}
    </>
  );
};

export default MatchFixturesCard;