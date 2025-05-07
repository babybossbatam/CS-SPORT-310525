import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, fixturesActions } from '@/lib/store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import { Heart, Star, CalendarDays } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';

const MyScores = () => {
  const [location, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const { isAuthenticated, preferences } = useSelector((state: RootState) => state.user);
  const { byLeague: fixturesByLeague, loading } = useSelector((state: RootState) => state.fixtures);
  const { list: leagues } = useSelector((state: RootState) => state.leagues);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to view your saved favorites',
      });
      navigate('/login');
    }
  }, [isAuthenticated, navigate, toast]);
  
  // Fetch data for favorite leagues
  useEffect(() => {
    if (!isAuthenticated || preferences.favoriteLeagues.length === 0) return;
    
    const fetchFavoriteLeaguesData = async () => {
      for (const leagueId of preferences.favoriteLeagues) {
        // Skip if we already have fixtures for this league
        if (fixturesByLeague[leagueId] && fixturesByLeague[leagueId].length > 0) continue;
        
        try {
          dispatch(fixturesActions.setLoadingFixtures(true));
          
          // Get current season
          const currentYear = new Date().getFullYear();
          
          const response = await apiRequest(
            'GET', 
            `/api/leagues/${leagueId}/fixtures?season=${currentYear}`
          );
          const data = await response.json();
          
          dispatch(fixturesActions.setFixturesByLeague({ 
            leagueId,
            fixtures: data 
          }));
        } catch (error) {
          console.error(`Error fetching fixtures for league ${leagueId}:`, error);
        }
      }
      
      dispatch(fixturesActions.setLoadingFixtures(false));
    };
    
    fetchFavoriteLeaguesData();
  }, [isAuthenticated, preferences.favoriteLeagues, dispatch, fixturesByLeague]);
  
  // Get favorite fixtures
  const getFavoriteFixtures = () => {
    const allFixtures = Object.values(fixturesByLeague).flat();
    return allFixtures.filter(fixture => 
      preferences.favoriteMatches.includes(fixture.fixture.id.toString())
    );
  };
  
  // Get fixtures from favorite leagues
  const getFavoriteLeagueFixtures = () => {
    return preferences.favoriteLeagues.flatMap(leagueId => 
      fixturesByLeague[leagueId] || []
    );
  };
  
  // Get fixtures for favorite teams
  const getFavoriteTeamFixtures = () => {
    const allFixtures = Object.values(fixturesByLeague).flat();
    return allFixtures.filter(fixture => 
      preferences.favoriteTeams.includes(fixture.teams.home.id.toString()) ||
      preferences.favoriteTeams.includes(fixture.teams.away.id.toString())
    );
  };
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader title="My Scores" icon={<Star className="h-4 w-4 text-neutral-600" />} />
      
      <div className="container mx-auto px-4 py-4">
        <Card className="mb-6">
          <CardHeader className="p-4 border-b border-neutral-200">
            <h2 className="text-xl font-bold text-center">My Favorites</h2>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="matches" className="w-full">
              <TabsList className="w-full grid grid-cols-3 rounded-none">
                <TabsTrigger value="matches" className="rounded-none">
                  <Star className="h-4 w-4 mr-2" />
                  <span>Matches</span>
                </TabsTrigger>
                <TabsTrigger value="leagues" className="rounded-none">
                  <Trophy className="h-4 w-4 mr-2" />
                  <span>Leagues</span>
                </TabsTrigger>
                <TabsTrigger value="teams" className="rounded-none">
                  <Heart className="h-4 w-4 mr-2" />
                  <span>Teams</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="matches" className="mt-0">
                {loading ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500">Loading your favorite matches...</p>
                  </div>
                ) : (
                  <>
                    {getFavoriteFixtures().length > 0 ? (
                      <div>
                        {getFavoriteFixtures().map(fixture => (
                          <div 
                            key={fixture.fixture.id} 
                            className="p-3 border-b border-neutral-200 cursor-pointer hover:bg-gray-50"
                            onClick={() => navigate(`/match/${fixture.fixture.id}`)}
                          >
                            <div className="flex items-center text-sm mb-1">
                              <span className="text-xs text-neutral-500 mr-2">
                                {formatDateTime(fixture.fixture.date)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 w-5/12">
                                <div className="text-right w-full">
                                  <span className="font-medium">{fixture.teams.home.name}</span>
                                </div>
                                <img 
                                  src={fixture.teams.home.logo} 
                                  alt={fixture.teams.home.name} 
                                  className="h-8 w-8"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=Team';
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-center w-2/12">
                                <span className="font-bold text-lg">
                                  {fixture.goals.home !== null ? fixture.goals.home : '-'} - {fixture.goals.away !== null ? fixture.goals.away : '-'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3 w-5/12">
                                <img 
                                  src={fixture.teams.away.logo} 
                                  alt={fixture.teams.away.name} 
                                  className="h-8 w-8"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=Team';
                                  }}
                                />
                                <div className="w-full">
                                  <span className="font-medium">{fixture.teams.away.name}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <CalendarDays className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <h3 className="text-lg font-medium text-gray-700">No Favorite Matches</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          You haven't saved any matches as favorites yet.
                        </p>
                        <Button onClick={() => navigate('/')}>
                          Browse Matches
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="leagues" className="mt-0">
                {loading ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500">Loading your favorite leagues...</p>
                  </div>
                ) : (
                  <>
                    {preferences.favoriteLeagues.length > 0 ? (
                      <div>
                        {preferences.favoriteLeagues.map(leagueId => {
                          const league = leagues.find(l => l.league.id.toString() === leagueId);
                          
                          return league ? (
                            <div 
                              key={leagueId}
                              className="p-3 border-b border-neutral-200 cursor-pointer hover:bg-gray-50"
                              onClick={() => navigate(`/league/${leagueId}`)}
                            >
                              <div className="flex items-center">
                                <img 
                                  src={league.league.logo} 
                                  alt={league.league.name} 
                                  className="h-10 w-10 mr-3"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=League';
                                  }}
                                />
                                <div>
                                  <h3 className="font-medium">{league.league.name}</h3>
                                  <p className="text-xs text-gray-500">{league.country.name}</p>
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <h3 className="text-lg font-medium text-gray-700">No Favorite Leagues</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          You haven't saved any leagues as favorites yet.
                        </p>
                        <Button onClick={() => navigate('/')}>
                          Browse Leagues
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="teams" className="mt-0">
                {loading ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500">Loading your favorite teams...</p>
                  </div>
                ) : (
                  <>
                    {preferences.favoriteTeams.length > 0 ? (
                      <div>
                        {preferences.favoriteTeams.map(teamId => {
                          // Find a fixture where this team plays
                          const allFixtures = Object.values(fixturesByLeague).flat();
                          const fixtureWithTeam = allFixtures.find(
                            fixture => 
                              fixture.teams.home.id.toString() === teamId || 
                              fixture.teams.away.id.toString() === teamId
                          );
                          
                          const team = fixtureWithTeam
                            ? (fixtureWithTeam.teams.home.id.toString() === teamId 
                                ? fixtureWithTeam.teams.home 
                                : fixtureWithTeam.teams.away)
                            : null;
                            
                          return team ? (
                            <div 
                              key={teamId}
                              className="p-3 border-b border-neutral-200 cursor-pointer hover:bg-gray-50"
                              // In a real app, we would have a team details page
                              onClick={() => toast({
                                title: 'Team Details',
                                description: `View all matches for ${team.name}`
                              })}
                            >
                              <div className="flex items-center">
                                <img 
                                  src={team.logo} 
                                  alt={team.name} 
                                  className="h-10 w-10 mr-3"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=Team';
                                  }}
                                />
                                <div>
                                  <h3 className="font-medium">{team.name}</h3>
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Heart className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <h3 className="text-lg font-medium text-gray-700">No Favorite Teams</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          You haven't saved any teams as favorites yet.
                        </p>
                        <Button onClick={() => navigate('/')}>
                          Browse Teams
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader className="p-4 border-b border-neutral-200">
            <h2 className="text-xl font-bold text-center">Upcoming Matches</h2>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500">Loading upcoming matches...</p>
              </div>
            ) : (
              <>
                {getFavoriteLeagueFixtures().length > 0 ? (
                  <div>
                    {getFavoriteLeagueFixtures()
                      .filter(fixture => new Date(fixture.fixture.date) > new Date())
                      .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
                      .slice(0, 5)
                      .map(fixture => (
                        <div 
                          key={fixture.fixture.id} 
                          className="p-3 border-b border-neutral-200 cursor-pointer hover:bg-gray-50"
                          onClick={() => navigate(`/match/${fixture.fixture.id}`)}
                        >
                          <div className="flex items-center text-sm mb-1">
                            <span className="text-xs text-neutral-500 mr-2">
                              {formatDateTime(fixture.fixture.date)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 w-5/12">
                              <div className="text-right w-full">
                                <span className="font-medium">{fixture.teams.home.name}</span>
                              </div>
                              <img 
                                src={fixture.teams.home.logo} 
                                alt={fixture.teams.home.name} 
                                className="h-8 w-8"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=Team';
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-center w-2/12">
                              <span className="font-bold text-lg">
                                {fixture.goals.home !== null ? fixture.goals.home : '-'} - {fixture.goals.away !== null ? fixture.goals.away : '-'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 w-5/12">
                              <img 
                                src={fixture.teams.away.logo} 
                                alt={fixture.teams.away.name} 
                                className="h-8 w-8"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=Team';
                                }}
                              />
                              <div className="w-full">
                                <span className="font-medium">{fixture.teams.away.name}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <CalendarDays className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <h3 className="text-lg font-medium text-gray-700">No Upcoming Matches</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Follow leagues or teams to see their upcoming matches here.
                    </p>
                    <Button onClick={() => navigate('/')}>
                      Browse Matches
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MyScores;
