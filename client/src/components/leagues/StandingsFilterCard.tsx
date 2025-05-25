
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  const { data: todayMatches } = useQuery({
    queryKey: ['fixtures', 'today'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await apiRequest('GET', `/api/fixtures/date/${today}`);
      const data = await response.json();
      return data || [];
    },
  });

  // Filter matches for popular leagues only
  const popularLeagueIds = POPULAR_LEAGUES.map(league => league.id);
  const popularLeagueMatches = todayMatches?.filter(match => popularLeagueIds.includes(match.league.id)) || [];

  // Group matches by league
  const matchesByLeague = POPULAR_LEAGUES.map(league => ({
    ...league,
    matches: popularLeagueMatches.filter(match => match.league.id === league.id)
  })).filter(league => league.matches.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <h3 className="text-lg font-semibold">Today's Matches</h3>
        </CardHeader>
        <CardContent className="p-4">
          {matchesByLeague.length > 0 ? (
            <div className="space-y-6">
              {matchesByLeague.map((league) => (
                <div key={league.id} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <img
                      src={league.logo}
                      alt={league.name}
                      className="h-5 w-5 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                      }}
                    />
                    <h4 className="font-semibold text-sm">{league.name}</h4>
                  </div>
                  
                  <div className="space-y-2">
                    {(() => {
                      const liveMatches = league.matches.filter(match => match.fixture.status.short === "LIVE");
                      const finishedMatches = league.matches.filter(match => ["FT", "AET", "PEN"].includes(match.fixture.status.short));
                      const upcomingMatches = league.matches.filter(match => match.fixture.status.short === "NS");

                      return (
                        <>
                          {/* Live Matches */}
                          {liveMatches.map((match) => (
                            <div key={match.fixture.id} className="flex items-center justify-between p-2 bg-red-50 rounded text-sm">
                              <div className="flex items-center gap-2 flex-1">
                                <img src={match.teams.home.logo} alt={match.teams.home.name} className="h-4 w-4" />
                                <span className="truncate">{match.teams.home.name}</span>
                              </div>
                              <div className="flex items-center gap-2 px-2">
                                <span className="font-bold">{match.goals.home ?? 0} - {match.goals.away ?? 0}</span>
                                <span className="text-xs text-red-500">{match.fixture.status.elapsed}'</span>
                              </div>
                              <div className="flex items-center gap-2 flex-1 justify-end">
                                <span className="truncate">{match.teams.away.name}</span>
                                <img src={match.teams.away.logo} alt={match.teams.away.name} className="h-4 w-4" />
                              </div>
                            </div>
                          ))}

                          {/* Finished Matches */}
                          {finishedMatches.map((match) => (
                            <div key={match.fixture.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                              <div className="flex items-center gap-2 flex-1">
                                <img src={match.teams.home.logo} alt={match.teams.home.name} className="h-4 w-4" />
                                <span className="truncate">{match.teams.home.name}</span>
                              </div>
                              <div className="flex flex-col items-center px-2">
                                <span className="font-bold">{match.goals.home ?? 0} - {match.goals.away ?? 0}</span>
                                <span className="text-xs text-gray-500">{match.fixture.status.short}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-1 justify-end">
                                <span className="truncate">{match.teams.away.name}</span>
                                <img src={match.teams.away.logo} alt={match.teams.away.name} className="h-4 w-4" />
                              </div>
                            </div>
                          ))}

                          {/* Upcoming Matches */}
                          {upcomingMatches.map((match) => (
                            <div key={match.fixture.id} className="flex items-center justify-between p-2 bg-blue-50 rounded text-sm">
                              <div className="flex items-center gap-2 flex-1">
                                <img src={match.teams.home.logo} alt={match.teams.home.name} className="h-4 w-4" />
                                <span className="truncate">{match.teams.home.name}</span>
                              </div>
                              <div className="flex flex-col items-center px-2">
                                <span className="text-xs text-blue-600">
                                  {new Date(match.fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-1 justify-end">
                                <span className="truncate">{match.teams.away.name}</span>
                                <img src={match.teams.away.logo} alt={match.teams.away.name} className="h-4 w-4" />
                              </div>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No matches today from popular leagues</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StandingsFilterCard;
