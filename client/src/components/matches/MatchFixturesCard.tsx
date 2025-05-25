import React, { useState } from 'react';
import { Calendar as CalendarIcon, Star, ChevronLeft, ChevronRight, ChevronDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Select, SelectContent, SelectTrigger } from '../ui/select';
import { Calendar } from '../ui/calendar';
import StandingsFilterCard from '../leagues/StandingsFilterCard';

interface FixtureProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
}

import { useQuery } from '@tanstack/react-query';

export const MatchFixturesCard = ({ fixtures, onMatchClick }: FixtureProps) => {
  const [selectedFilter, setSelectedFilter] = useState("Today's Matches");

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

  return (
    <div className="space-y-4">
      <Card className="bg-white shadow-md w-full space-y-4">
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
                  selected={new Date()}
                  onSelect={(date) => {
                    if (date) {
                      const today = new Date();
                      const tomorrow = new Date(today);
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const yesterday = new Date(today);
                      yesterday.setDate(yesterday.getDate() - 1);

                      if (date.toDateString() === today.toDateString()) {
                        setSelectedFilter("Today's Matches");
                      } else if (date.toDateString() === yesterday.toDateString()) {
                        setSelectedFilter("Yesterday's Matches");
                      } else if (date.toDateString() === tomorrow.toDateString()) {
                        setSelectedFilter("Tomorrow's Matches");
                      } else {
                        setSelectedFilter(date.toDateString());
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
        <div className="flex items-center justify-between px-4 pb-4">
          <button className="flex items-center gap-1 px-1.5 py-0.5 bg-neutral-800 text-white rounded-full text-xs font-medium w-fit">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            Live
          </button>
          <button className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-gray-100 rounded-full text-xs font-medium w-fit">
            <Clock className="h-3.5 w-3.5" />
            By time
          </button>
        </div>
      </Card>
      <StandingsFilterCard />
    </div>
  );
};

export default MatchFixturesCard;