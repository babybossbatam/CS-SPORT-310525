
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO } from 'date-fns';

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

const StandingsFilterCard = () => {
  const [selectedLeague, setSelectedLeague] = useState(POPULAR_LEAGUES[0].name);
  const [activeTab, setActiveTab] = useState("standings");

  const leagueQueries = POPULAR_LEAGUES.map(league => {
    return {
      standings: useQuery({
        queryKey: ['standings', league.id.toString()],
        queryFn: async () => {
          const response = await apiRequest('GET', `/api/leagues/${league.id}/standings`);
          const data = await response.json();
          return { league, standings: data?.league?.standings?.[0] || [] };
        },
      }),
      fixtures: useQuery({
        queryKey: ['fixtures', league.id.toString()],
        queryFn: async () => {
          const response = await apiRequest('GET', `/api/leagues/${league.id}/fixtures`);
          const data = await response.json();
          return data || [];
        },
      })
    };
  });

  const renderFixture = (fixture: any) => (
    <div key={fixture.fixture.id} className="p-4 border-b last:border-b-0">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {format(parseISO(fixture.fixture.date), 'dd MMM yyyy HH:mm')}
        </div>
        <div className="text-sm font-medium">{fixture.league.round}</div>
      </div>
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center gap-2">
          <img src={fixture.teams.home.logo} alt={fixture.teams.home.name} className="w-4 h-4" />
          <span>{fixture.teams.home.name}</span>
        </div>
        <div className="font-semibold">
          {fixture.goals.home !== null ? `${fixture.goals.home} - ${fixture.goals.away}` : 'vs'}
        </div>
        <div className="flex items-center gap-2">
          <span>{fixture.teams.away.name}</span>
          <img src={fixture.teams.away.logo} alt={fixture.teams.away.name} className="w-4 h-4" />
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <Select
          value={selectedLeague}
          onValueChange={setSelectedLeague}
        >
          <SelectTrigger className="w-full">
            <SelectValue>{selectedLeague}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {POPULAR_LEAGUES.map((league) => (
              <SelectItem key={league.id} value={league.name}>
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
      <CardContent className="p-0">
        {leagueQueries.map((query, index) => {
          if (!query.standings.data?.standings?.length || query.standings.data.league.name !== selectedLeague) return null;
          const league = query.standings.data.league;
          const leagueStandings = query.standings.data.standings;
          const fixtures = query.fixtures.data;

          return (
            <div key={league.id} className="mb-4 last:mb-0">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <img
                    src={league.logo}
                    alt={league.name}
                    className="h-6 w-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                    }}
                  />
                  <h2 className="text-xl font-semibold">{league.name}</h2>
                </div>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="standings" className="flex-1">Standings</TabsTrigger>
                  <TabsTrigger value="fixtures" className="flex-1">Fixtures</TabsTrigger>
                  <TabsTrigger value="results" className="flex-1">Results</TabsTrigger>
                </TabsList>
                <TabsContent value="standings">
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leagueStandings?.map((standing: any) => {
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
                                  {standing.description}
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
                                {standing.form?.split('').map((result: string, i: number) => (
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
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="fixtures">
                  <div className="max-h-[400px] overflow-y-auto">
                    {fixtures?.filter((f: any) => !f.fixture.status.short.includes('FT'))
                      .slice(0, 10)
                      .map(renderFixture)}
                  </div>
                </TabsContent>
                <TabsContent value="results">
                  <div className="max-h-[400px] overflow-y-auto">
                    {fixtures?.filter((f: any) => f.fixture.status.short.includes('FT'))
                      .slice(0, 10)
                      .map(renderFixture)}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default StandingsFilterCard;
