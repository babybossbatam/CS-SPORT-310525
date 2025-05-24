
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
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
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={league.logo} 
                    alt={league.name} 
                    className="h-8 w-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                    }}
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{league.name}</h3>
                    <p className="text-sm text-gray-500">{league.country}</p>
                  </div>
                </div>
              </CardContent>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default StandingsFilterCard;
