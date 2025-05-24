import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { format } from 'date-fns';
import { getMatchStatusText } from '@/lib/utils';

const POPULAR_LEAGUES = [
  { id: 2, name: 'Champions League', country: 'Europe', logo: 'https://media.api-sports.io/football/leagues/2.png' },
  { id: 39, name: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png' },
  { id: 140, name: 'La Liga', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { id: 135, name: 'Serie A', country: 'Italy', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { id: 78, name: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png' },
  { id: 3, name: 'Europa League', country: 'Europe', logo: 'https://media.api-sports.io/football/leagues/3.png' }
];

const StandingsFilterCard = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const formattedDate = format(new Date(selectedDate), 'yyyy-MM-dd');

  const { data: fixtures } = useQuery({
    queryKey: ['fixtures', 'date', formattedDate],
    queryFn: async () => {
      const response = await fetch(`/api/fixtures/date/${formattedDate}`);
      return response.json();
    }
  });

  const filteredFixtures = fixtures?.filter((fixture: any) => 
    POPULAR_LEAGUES.some(league => league.id === fixture.league.id)
  );

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        {POPULAR_LEAGUES.map(league => {
          const leagueFixtures = filteredFixtures?.filter((f: any) => f.league.id === league.id);
          if (!leagueFixtures?.length) return null;

          return (
            <div key={league.id} className="mb-4 last:mb-0">
              <CardHeader className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <img 
                    src={league.logo} 
                    alt={league.name} 
                    className="h-7 w-7 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                    }}
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{league.name}</h3>
                    <p className="text-sm text-gray-500">{league.country}</p>
                  </div>
                </div>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Home</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead>Away</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leagueFixtures.map((fixture: any) => (
                    <TableRow key={fixture.fixture.id}>
                      <TableCell className="text-sm">
                        {getMatchStatusText(fixture.fixture.status.short)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img 
                            src={fixture.teams.home.logo} 
                            alt={fixture.teams.home.name} 
                            className="h-4 w-4 object-contain"
                          />
                          <span className="text-sm">{fixture.teams.home.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {fixture.goals.home !== null ? `${fixture.goals.home} - ${fixture.goals.away}` : 'vs'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img 
                            src={fixture.teams.away.logo} 
                            alt={fixture.teams.away.name} 
                            className="h-4 w-4 object-contain"
                          />
                          <span className="text-sm">{fixture.teams.away.name}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default StandingsFilterCard;