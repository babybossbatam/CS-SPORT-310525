
import React, { useState } from 'react';
import { Calendar as CalendarIcon, Star, ChevronLeft, ChevronRight, ChevronDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Select, SelectContent, SelectTrigger } from '../ui/select';
import { Calendar } from '../ui/calendar';
import TodayPopularFootballLeagues from './TodayPopularFootballLeagues';
import TodaysMatchesByCountry from './TodaysMatchesByCountry';
import MatchesByCountryAndSeason from './MatchesByCountryAndSeason';
import LiveMatchForAllCountry from './LiveMatchForAllCountry';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, selectFixturesByDate, selectStandingsByLeague } from '@/lib/store';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { formatYYYYMMDD, getCurrentUTCDateString } from '@/lib/dateUtilsUpdated';

interface FixtureProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
}

import { useQuery } from '@tanstack/react-query';

export const TodayMatchCard = ({ fixtures, onMatchClick }: FixtureProps) => {
  const [selectedFilter, setSelectedFilter] = useState("Today's Matches");
  const [timeFilterActive, setTimeFilterActive] = useState(false);
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
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
  console.log('TodayMatchCard - selected filter:', selectedFilter);
  console.log('TodayMatchCard - fixtures length:', fixtures?.length || 0);
  console.log('TodayMatchCard - league standings:', leagueStandings);

  return (
    <>
      <Card className="shadow-md w-full">
        <div className="flex items-center justify-between h-9 p-4">
          <button className="p-2 hover:bg-gray-100 rounded-r-full flex items-center -ml-4">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="relative h-full flex items-center">
            <Select>
              <SelectTrigger 
                className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded-md h-full border-0 bg-transparent"
                onClick={() => setCalendarOpen(!calendarOpen)}
              >
                <span className="font-medium">{selectedFilter}</span>
                <ChevronDown className="h-4 w-4" />
              </SelectTrigger>
              {calendarOpen && (
                <SelectContent align="start" className="w-[350px] p-4">
                  <div className="flex items-center justify-between mb-4">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="font-medium">May 2025</span>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 text-sm">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                      <div key={day} className="p-2 text-center text-gray-500 font-medium">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar days */}
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <button
                        key={day}
                        className={`p-2 text-center hover:bg-gray-100 rounded transition-colors ${
                          day === 28 ? 'bg-blue-500 text-white hover:bg-blue-600' : ''
                        }`}
                        onClick={() => {
                          const selectedDateString = `2025-05-${day.toString().padStart(2, '0')}`;
                          dispatch({ type: 'ui/setSelectedDate', payload: selectedDateString });
                          setSelectedFilter(day === 28 ? "Today's Matches" : `May ${day}, 2025`);
                          setCalendarOpen(false);
                        }}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <button 
                      className="w-full text-center text-blue-500 hover:text-blue-600 font-medium"
                      onClick={() => {
                        const today = getCurrentUTCDateString();
                        dispatch({ type: 'ui/setSelectedDate', payload: today });
                        setSelectedFilter("Today's Matches");
                        setCalendarOpen(false);
                      }}
                    >
                      Today
                    </button>
                  </div>
                </SelectContent>
              )}
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

export default TodayMatchCard;
