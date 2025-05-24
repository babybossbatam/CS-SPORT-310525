
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
      return data || [];
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {POPULAR_LEAGUES.map((league) => {
        const leagueMatches = todayMatches?.filter(match => match.league.id === league.id) || [];
        
        return (
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
            {leagueMatches.length > 0 ? (
              <div className="space-y-4">
                {(() => {
                  const liveMatches = leagueMatches.filter(match => match.fixture.status.short === "LIVE");
                  const finishedMatches = leagueMatches.filter(match => ["FT", "AET", "PEN"].includes(match.fixture.status.short));

                  return (
                    <div className="border-b pb-4 last:border-b-0">

                  if (liveMatches.length === 0 && finishedMatches.length === 0) return null;

                  return (
                    <div key={league.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center gap-2 mb-3">
                        <img src={league.logo} alt={league.name} className="h-5 w-5" />
                        <h3 className="font-semibold">{league.name}</h3>
                      </div>

                      {/* Live Matches */}
                      {liveMatches.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-500 mb-2">Live Matches</h4>
                          {liveMatches.map((match) => (
                            <div key={match.fixture.id} className="flex items-center justify-between p-2 bg-red-50 rounded mb-2">
                              <div className="flex items-center gap-2">
                                <img src={match.teams.home.logo} alt={match.teams.home.name} className="h-4 w-4" />
                                <span>{match.teams.home.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{match.goals.home ?? 0} - {match.goals.away ?? 0}</span>
                                <span className="text-xs text-red-500">{match.fixture.status.elapsed}'</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span>{match.teams.away.name}</span>
                                <img src={match.teams.away.logo} alt={match.teams.away.name} className="h-4 w-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Finished Matches */}
                      {finishedMatches.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-600 mb-2">Finished Matches</h4>
                          {finishedMatches.map((match) => (
                            <div key={match.fixture.id} className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
                              <div className="flex items-center gap-2">
                                <img src={match.teams.home.logo} alt={match.teams.home.name} className="h-4 w-4" />
                                <span>{match.teams.home.name}</span>
                              </div>
                              <div className="flex flex-col items-center gap-1">
                                <span>{match.goals.home ?? 0} - {match.goals.away ?? 0}</span>
                                <span className="text-xs text-gray-500">{match.fixture.status.short}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span>{match.teams.away.name}</span>
                                <img src={match.teams.away.logo} alt={match.teams.away.name} className="h-4 w-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Upcoming Matches */}
                {todayMatches.filter(match => match.fixture.status.short === "NS").length > 0 && (
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-2">Upcoming Matches</h4>
                    {todayMatches
                      .filter(match => match.fixture.status.short === "NS")
                      .map((match) => (
                        <div key={match.fixture.id} className="flex items-center justify-between p-2 bg-blue-50 rounded mb-2">
                          <div className="flex items-center gap-2">
                            <img src={match.teams.home.logo} alt={match.teams.home.name} className="h-4 w-4" />
                            <span>{match.teams.home.name}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-blue-600">{new Date(match.fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>{match.teams.away.name}</span>
                            <img src={match.teams.away.logo} alt={match.teams.away.name} className="h-4 w-4" />
                          </div>
                        </div>
                    ))}
                  </div>
                )}
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
