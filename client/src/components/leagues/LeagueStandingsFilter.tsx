
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';

// Using existing popular leagues from LeagueFilter
const POPULAR_LEAGUES = [
  { id: 2, name: 'Champions League', country: 'Europe' },
  { id: 39, name: 'Premier League', country: 'England' },
  { id: 140, name: 'La Liga', country: 'Spain' },
  { id: 135, name: 'Serie A', country: 'Italy' },
  { id: 78, name: 'Bundesliga', country: 'Germany' },
  { id: 3, name: 'Europa League', country: 'Europe' },
];

interface Standing {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  form: string;
}

const LeagueStandingsFilter = () => {
  const [selectedLeague, setSelectedLeague] = useState(POPULAR_LEAGUES[0].id.toString());

  const { data: standings, isLoading } = useQuery({
    queryKey: ['standings', selectedLeague],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/leagues/${selectedLeague}/standings`);
      const data = await response.json();
      return data?.league?.standings?.[0] || [];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>League Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>League Standings</CardTitle>
        <Select value={selectedLeague} onValueChange={setSelectedLeague}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select League" />
          </SelectTrigger>
          <SelectContent>
            {POPULAR_LEAGUES.map((league) => (
              <SelectItem key={league.id} value={league.id.toString()}>
                {league.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2 text-left">Team</th>
                <th className="px-2 py-2">P</th>
                <th className="px-2 py-2">GF/GA</th>
                <th className="px-2 py-2">+/-</th>
                <th className="px-2 py-2">PTS</th>
                <th className="px-2 py-2">W</th>
                <th className="px-2 py-2">D</th>
                <th className="px-2 py-2">L</th>
                <th className="px-2 py-2">Form</th>
                <th className="px-2 py-2">Next</th>
              </tr>
            </thead>
            <tbody>
              {standings?.slice(0, 7).map((standing: Standing) => (
                <tr key={standing.team.id} className="border-b hover:bg-gray-50">
                  <td className="px-2 py-2">{standing.rank}</td>
                  <td className="px-2 py-2 flex items-center gap-2">
                    <img 
                      src={standing.team.logo} 
                      alt={standing.team.name} 
                      className="w-5 h-5"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=T';
                      }}
                    />
                    <span className="truncate">{standing.team.name}</span>
                  </td>
                  <td className="px-2 py-2 text-center">{standing.all.played}</td>
                  <td className="px-2 py-2 text-center">{standing.all.goals.for}/{standing.all.goals.against}</td>
                  <td className="px-2 py-2 text-center">{standing.goalsDiff}</td>
                  <td className="px-2 py-2 font-bold text-center">{standing.points}</td>
                  <td className="px-2 py-2 text-center">{standing.all.win}</td>
                  <td className="px-2 py-2 text-center">{standing.all.draw}</td>
                  <td className="px-2 py-2 text-center">{standing.all.lose}</td>
                  <td className="px-2 py-2">
                    <div className="flex gap-1">
                      {standing.form?.split('').map((result, i) => (
                        <span
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            result === 'W' ? 'bg-green-500' :
                            result === 'D' ? 'bg-gray-500' :
                            'bg-red-500'
                          }`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-2 relative group">
                    <div className="flex items-center justify-center gap-2">
                      {standings?.find(opponent => 
                        opponent.team.id !== standing.team.id && 
                        opponent.rank > standing.rank
                      ) && (
                        <>
                          <img 
                            src={standings.find(opponent => 
                              opponent.team.id !== standing.team.id && 
                              opponent.rank > standing.rank
                            )?.team.logo} 
                            alt={`Next opponent: ${standings.find(opponent => 
                              opponent.team.id !== standing.team.id && 
                              opponent.rank > standing.rank
                            )?.team.name}`}
                            className="w-4 h-4 hover:scale-110 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/16?text=N';
                            }}
                          />
                          <div className="absolute opacity-0 group-hover:opacity-100 bg-white shadow-lg rounded-md p-2 z-50 right-8 top-1/2 transform -translate-y-1/2 whitespace-nowrap transition-opacity duration-200">
                            <div className="text-xs">
                              <span className="font-medium">{standing.team.name}</span>
                              <span className="mx-2">vs</span>
                              <span className="font-medium">
                                {standings.find(opponent => 
                                  opponent.team.id !== standing.team.id && 
                                  opponent.rank > standing.rank
                                )?.team.name}
                              </span>
                              <div className="text-gray-500 mt-1">
                                {(() => {
                                  const nextMatch = fixtures?.find(f => 
                                    (f.teams.home.id === standing.team.id || f.teams.away.id === standing.team.id) &&
                                    new Date(f.fixture.date) > new Date()
                                  );
                                  return nextMatch ? format(parseISO(nextMatch.fixture.date), 'dd/MM/yyyy') : 'No upcoming matches';
                                })()}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeagueStandingsFilter;
