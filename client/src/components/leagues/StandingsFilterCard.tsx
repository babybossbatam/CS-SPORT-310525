
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';

const POPULAR_LEAGUES = [
  { id: 2, name: 'Champions League', country: 'Europe', logo: 'https://media.api-sports.io/football/leagues/2.png' },
  { id: 39, name: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png' },
  { id: 140, name: 'La Liga', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { id: 135, name: 'Serie A', country: 'Italy', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { id: 78, name: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png' },
  { id: 3, name: 'Europa League', country: 'Europe', logo: 'https://media.api-sports.io/football/leagues/3.png' }
];

const StandingsFilterCard = () => {
  const [selectedLeague, setSelectedLeague] = useState(POPULAR_LEAGUES[0].id.toString());

  const { data: todayMatches } = useQuery({
    queryKey: ['fixtures', 'today', selectedLeague],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await apiRequest('GET', `/api/fixtures/date/${today}`);
      const data = await response.json();
      return data?.filter(match => match.league.id.toString() === selectedLeague) || [];
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {POPULAR_LEAGUES.map((league) => (
        <Card key={league.id}>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <img
                src={league.logo}
                alt={league.name}
                className="h-6 w-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                }}
              />
              <h3 className="text-lg font-semibold">{league.name}</h3>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {todayMatches?.length ? (
              <div className="space-y-2">
                {todayMatches.map((match) => (
                  <div key={match.fixture.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <img src={match.teams.home.logo} alt={match.teams.home.name} className="h-4 w-4" />
                      <span>{match.teams.home.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{match.goals.home ?? 0} - {match.goals.away ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{match.teams.away.name}</span>
                      <img src={match.teams.away.logo} alt={match.teams.away.name} className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-2">No matches today</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StandingsFilterCard;
