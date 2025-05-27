import React, { useState } from 'react';
import { Calendar as CalendarIcon, Star, ChevronLeft, ChevronRight, ChevronDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Select, SelectContent, SelectTrigger } from '../ui/select';
import { Calendar } from '../ui/calendar';
import TodayPopularFootballLeagues from './TodayPopularFootballLeagues';
import TodaysMatchesByCountry from './TodaysMatchesByCountry';
import MatchesByCountryAndSeason from './MatchesByCountryAndSeason';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { format, parseISO } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { formatYYYYMMDD, getCurrentUTCDateString } from '@/lib/dateUtils';

interface FixtureProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
}

import { useQuery } from '@tanstack/react-query';

export const MatchFixturesCard = ({ fixtures, onMatchClick }: FixtureProps) => {
  const [selectedFilter, setSelectedFilter] = useState("Today's Matches");
  const [timeFilterActive, setTimeFilterActive] = useState(false);
  const dispatch = useDispatch();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);

  // Get standings from league data
  const { data: leagueStandings } = useQuery({
    queryKey: ['standings', selectedFilter],
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

  const renderStandings = (standings: any) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 border-b">
            <th className="py-2 text-left pl-4">Pos</th>
            <th className="py-2 text-left">Team</th>
            <th className="py-2 text-center">P</th>
            <th className="py-2 text-center">W</th>
            <th className="py-2 text-center">D</th>
            <th className="py-2 text-center">L</th>
            <th className="py-2 text-center">GD</th>
            <th className="py-2 text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team: any) => (
            <tr key={team.team.id} className="hover:bg-gray-50 border-b last:border-b-0">
              <td className="py-2 pl-4">{team.rank}</td>
              <td className="py-2">
                <div className="flex items-center space-x-2">
                  <img 
                    src={team.team.logo} 
                    alt={team.team.name}
                    className="h-5 w-5 object-contain"
                  />
                  <span>{team.team.name}</span>
                </div>
              </td>
              <td className="text-center">{team.all.played}</td>
              <td className="text-center">{team.all.win}</td>
              <td className="text-center">{team.all.draw}</td>
              <td className="text-center">{team.all.lose}</td>
              <td className="text-center">{team.goalsDiff}</td>
              <td className="text-center font-semibold">{team.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Debug logging to check what data we have
  console.log('MatchFixturesCard - selected filter:', selectedFilter);
  console.log('MatchFixturesCard - fixtures length:', fixtures?.length || 0);
  console.log('MatchFixturesCard - league standings:', leagueStandings);

  return (
    <div className="space-y-4">
      <Card className="bg-white shadow-md w-full">
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
                      const todayString = getCurrentUTCDateString();

                      // Calculate yesterday and tomorrow using UTC timezone for consistency
                      const today = new Date();
                      const yesterday = new Date(today);
                      yesterday.setUTCDate(today.getUTCDate() - 1);
                      const tomorrow = new Date(today);
                      tomorrow.setUTCDate(today.getUTCDate() + 1);

                      const yesterdayString = formatYYYYMMDD(yesterday);
                      const tomorrowString = formatYYYYMMDD(tomorrow);

                      // Update Redux store with selected date
                      dispatch({ type: 'ui/setSelectedDate', payload: selectedDateString });

                      console.log('Date selected (Local):', selectedDateString);
                      console.log('Today (Local):', todayString);
                      console.log('Yesterday (Local):', yesterdayString);
                      console.log('Tomorrow (Local):', tomorrowString);

                      // Compare date strings for accurate filtering
                      console.log('Date comparison:', {
                        selected: selectedDateString,
                        today: todayString,
                        yesterday: yesterdayString,
                        tomorrow: tomorrowString
                      });

                      if (selectedDateString === todayString) {
                        setSelectedFilter("Today's Matches");
                      } else if (selectedDateString === yesterdayString) {
                        setSelectedFilter("Yesterday's Matches");
                      } else if (selectedDateString === tomorrowString) {
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
        <div className="flex items-center justify-between px-4 pb-4 mt-[10px] text-[110.25%] h-9">
          {/* Live button */}
          <button className="flex items-center gap-1 px-0.5 py-0.5 bg-gray-300 text-black rounded-full text-xs font-medium w-fit hover:bg-gray-400 transition-colors duration-200" style={{minWidth: 'calc(2rem + 5px)'}}>
            Live
          </button>

          {/* Spacer to maintain layout */}
          <div className="flex items-center gap-2"></div>

          {/* By time button */}
          <button 
            onClick={() => {
              setTimeFilterActive(!timeFilterActive);
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

      <div className="space-y-4">
        <TodayPopularFootballLeagues 
          selectedDate={selectedDate} 
          timeFilterActive={timeFilterActive}
          showTop20={timeFilterActive}
        />
      </div>
      <TodaysMatchesByCountry selectedDate={selectedDate} />
    </div>
  );
};

export default MatchFixturesCard;