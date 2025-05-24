import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
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
              <div className="flex items-center gap-2 mb-2">
                <img src={league.logo} alt={league.name} className="h-6 w-6 object-contain" />
                <h3 className="font-semibold">{league.name}</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Home</TableHead>
                    <TableHead className="text-center">Time/Score</TableHead>
                    <TableHead>Away</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leagueFixtures.map((fixture: any) => (
                    <TableRow key={fixture.fixture.id}>
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
                        {(() => {
                          // Live or finished matches - show score
                          if (['1H', '2H', 'HT', 'FT'].includes(fixture.fixture.status.short)) {
                            return `${fixture.goals.home ?? 0} - ${fixture.goals.away ?? 0}`;
                          }
                          // Not started - show time
                          else {
                            try {
                              const time = format(parseISO(fixture.fixture.date), 'HH:mm');
                              return time.padStart(5, '0'); // Ensures format like "03:00"
                            } catch {
                              return 'TBD';
                            }
                          }
                        })()}
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