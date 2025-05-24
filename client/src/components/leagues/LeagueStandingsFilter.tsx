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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Using existing popular leagues from LeagueFilter
const POPULAR_LEAGUES = [
  { id: 2, name: 'Champions League', country: 'Europe', logo: 'https://media.api-sports.io/football/leagues/2.png' },
  { id: 39, name: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png' },
  { id: 140, name: 'La Liga', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { id: 135, name: 'Serie A', country: 'Italy', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { id: 78, name: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png' },
  { id: 3, name: 'Europa League', country: 'Europe', logo: 'https://media.api-sports.io/football/leagues/3.png' },
  { id: 307, name: 'Saudi League', country: 'Saudi Arabia', logo: 'https://media.api-sports.io/football/leagues/307.png' },
  { id: 233, name: 'Premier League', country: 'Egypt', logo: 'https://media.api-sports.io/football/leagues/233.png' }
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
  description?: string; // Added description property
}

const LeagueStandingsFilter = () => {
  const [selectedLeague, setSelectedLeague] = useState(POPULAR_LEAGUES[0].id.toString());
  const [selectedLeagueName, setSelectedLeagueName] = useState(POPULAR_LEAGUES[0].name);

  const { data: standings, isLoading: standingsLoading } = useQuery({
    queryKey: ['standings', selectedLeague],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/leagues/${selectedLeague}/standings`);
      const data = await response.json();
      return data?.league?.standings?.[0] || [];
    },
  });

  const { data: fixtures, isLoading: fixturesLoading } = useQuery({
    queryKey: ['fixtures', selectedLeague],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/leagues/${selectedLeague}/fixtures`);
      return response.json();
    },
  });

  const isLoading = standingsLoading || fixturesLoading;

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
        <Select 
          value={selectedLeague} 
          onValueChange={(value) => {
            setSelectedLeague(value);
            const league = POPULAR_LEAGUES.find(l => l.id.toString() === value);
            if (league) {
              setSelectedLeagueName(league.name);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center gap-2">
                <img
                  src={POPULAR_LEAGUES.find(l => l.id.toString() === selectedLeague)?.logo}
                  alt={selectedLeagueName}
                  className="h-5 w-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                  }}
                />
                {selectedLeagueName}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {POPULAR_LEAGUES.map((league) => (
              <SelectItem key={league.id} value={league.id.toString()}>
                <div className="flex items-center gap-2">
                  <img
                    src={league.logo}
                    alt={league.name}
                    className="h-5 w-5 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                    }}
                  />
                  {league.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Table>
            <TableHeader>
              <TableRow>
                  <TableHead className="w-[40px] text-center">#</TableHead>
                  <TableHead className="pl-4">Team</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">F:A</TableHead>
                  <TableHead className="text-center">+/-</TableHead>
                  <TableHead className="text-center">PTS</TableHead>
                  <TableHead className="text-center">W</TableHead>
                  <TableHead className="text-center">D</TableHead>
                  <TableHead className="text-center">L</TableHead>
                  <TableHead className="text-center">Form</TableHead>
                  <TableHead className="text-center">Next</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {standings?.slice(0, 7).map((standing: Standing) => {
                const stats = standing.all;
                return (
                  <TableRow key={standing.team.id} className="border-b border-gray-100">
                      <TableCell className="font-medium text-[0.9em] text-center">{standing.rank}</TableCell>
                      <TableCell className="flex flex-col font-normal pl-4">
                        <div className="flex items-center">
                          <img
                            src={standing.team.logo}
                            alt={standing.team.name}
                            className="mr-2 h-5 w-5 rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=T';
                            }}
                          />
                          <span className="text-[0.9em]">{standing.team.name}</span>
                          {standing.rank === 1 && <span className="ml-2">👑</span>}
                        </div>
                        {standing.description && (
                          <span className="text-[0.75em] text-yellow-500">
                            {standing.rank === 1 ? 'Won title • CAF Champions League' : standing.description}
                          </span>
                        )}
                      </TableCell>
                    <TableCell className="text-center text-[0.9em]">{stats.played}</TableCell>
                    <TableCell className="text-center text-[0.9em]">{stats.goals.for}:{stats.goals.against}</TableCell>
                    <TableCell className="text-center text-[0.9em]">{standing.goalsDiff}</TableCell>
                    <TableCell className="text-center font-bold text-[0.9em]">{standing.points}</TableCell>
                    <TableCell className="text-center text-[0.9em]">{stats.win}</TableCell>
                    <TableCell className="text-center text-[0.9em]">{stats.draw}</TableCell>
                    <TableCell className="text-center text-[0.9em]">{stats.lose}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
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
                    </TableCell>
                    <TableCell className="px-2 py-2 relative group">
                      <div className="flex items-center justify-center gap-2">
                        {fixtures?.find(fixture => 
                          (fixture.teams.home.id === standing.team.id || fixture.teams.away.id === standing.team.id) &&
                          new Date(fixture.fixture.date) > new Date()
                        ) && (
                          <>
                            <div className="flex items-center gap-1">
                              <img 
                                src={standing.team.logo}
                                alt={standing.team.name}
                                className="w-4 h-4 hover:scale-110 transition-transform"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                                }}
                              />
                              <span className="text-xs">vs</span>
                              <img 
                                src={fixtures.find(fixture => 
                                  (fixture.teams.home.id === standing.team.id || fixture.teams.away.id === standing.team.id) &&
                                  new Date(fixture.fixture.date) > new Date()
                                )?.teams[standing.team.id === fixtures.find(fixture => 
                                  (fixture.teams.home.id === standing.team.id || fixture.teams.away.id === standing.team.id) &&
                                  new Date(fixture.fixture.date) > new Date()
                                )?.teams.home.id ? 'away' : 'home'].logo} 
                                alt="Next opponent"
                                className="w-4 h-4 hover:scale-110 transition-transform"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeagueStandingsFilter;