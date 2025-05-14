import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, leaguesActions, fixturesActions, userActions } from '@/lib/store';
import { LeagueStandings } from '@/components/stats/LeagueStandings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import TeamLogo from "@/components/matches/TeamLogo";
import { EnhancedLeagueFixtures } from '@/components/matches/EnhancedLeagueFixtures';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/layout/Header';
import TournamentHeader from '@/components/layout/TournamentHeader';
import { Star, ArrowLeft, BarChart2, CalendarDays, Trophy, Table } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';
import LeagueTabs from '@/components/layout/LeagueTabs';

const LeagueDetails = () => {
  const { id, tab = 'fixtures' } = useParams();
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();

  const user = useSelector((state: RootState) => state.user);
  const { list: leagues, loading: leagueLoading } = useSelector((state: RootState) => state.leagues);
  const { byLeague: fixturesByLeague, loading: fixturesLoading } = useSelector((state: RootState) => state.fixtures);

  const league = leagues.find(l => l.league.id.toString() === id);
  const fixtures = fixturesByLeague[id || ''] || [];
  const loading = leagueLoading || fixturesLoading;

  const [activeTab, setActiveTab] = useState(tab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/league/${id}/${value}`);
  };

  // Check if league is favorited
  const isFavorite = user.preferences.favoriteLeagues.includes(id || '');

  useEffect(() => {
    const fetchLeagueDetails = async () => {
      if (!id) return;
      if (league) return;

      try {
        dispatch(leaguesActions.setLoadingLeagues(true));
        const response = await apiRequest('GET', `/api/leagues/${id}`);
        const data = await response.json();
        if (data) {
          dispatch(leaguesActions.setLeagues([...leagues, data]));
        }
      } catch (error) {
        console.error(`Error fetching league ${id}:`, error);
        toast({
          title: 'Error',
          description: 'Failed to load league information',
          variant: 'destructive',
        });
      } finally {
        dispatch(leaguesActions.setLoadingLeagues(false));
      }
    };

    fetchLeagueDetails();
  }, [id, league, leagues, dispatch, toast]);

  useEffect(() => {
    const fetchLeagueFixtures = async () => {
      if (!id) return;
      if (fixtures.length > 0) return;

      try {
        dispatch(fixturesActions.setLoadingFixtures(true));
        const currentYear = new Date().getFullYear();
        const response = await apiRequest('GET', `/api/leagues/${id}/fixtures?season=${currentYear}`);
        const data = await response.json();
        dispatch(fixturesActions.setFixturesByLeague({ leagueId: id, fixtures: data }));
      } catch (error) {
        console.error(`Error fetching fixtures for league ${id}:`, error);
        toast({
          title: 'Error',
          description: 'Failed to load league fixtures',
          variant: 'destructive',
        });
      } finally {
        dispatch(fixturesActions.setLoadingFixtures(false));
      }
    };

    fetchLeagueFixtures();
  }, [id, fixtures.length, dispatch, toast]);

  useEffect(() => {
    if (id) {
      navigate(`/league/${id}/${activeTab}`);
    }
  }, [activeTab, id, navigate]);

  const toggleFavorite = () => {
    if (!user.isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to save favorites',
      });
      navigate('/login');
      return;
    }

    if (isFavorite) {
      dispatch(userActions.removeFavoriteLeague(id || ''));
      if (user.id) {
        apiRequest('PATCH', `/api/user/${user.id}/preferences`, {
          favoriteLeagues: user.preferences.favoriteLeagues.filter(leagueId => leagueId !== id)
        }).catch(err => {
          console.error('Failed to update preferences:', err);
        });
      }
    } else {
      dispatch(userActions.addFavoriteLeague(id || ''));
      if (user.id) {
        apiRequest('PATCH', `/api/user/${user.id}/preferences`, {
          favoriteLeagues: [...user.preferences.favoriteLeagues, id]
        }).catch(err => {
          console.error('Failed to update preferences:', err);
        });
      }
    }
  };

  if (loading || !league) {
    return (
      <>
        <Header />
        <TournamentHeader title="Loading league details..." />
        <div className="container mx-auto px-4 py-4">
          <Card className="mb-6">
            <CardHeader className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <Button variant="ghost" size="sm" className="flex items-center" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Back</span>
              </Button>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-6">
                <Skeleton className="h-24 w-24 rounded mb-2" />
              </div>
              <Skeleton className="h-8 w-full mb-4" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <TournamentHeader title={league.league.name} />
      <LeagueTabs 
        leagueId={league?.league?.id} 
        leagueName={league?.league?.name} 
        leagueLogo={league?.league?.logo}
        fixtures={fixtures} 
      />
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <Card className="mb-6">
              <CardHeader className="p-4 border-b border-neutral-200">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">

                  <TabsContent value="fixtures" className="mt-2">
                    {fixtures.length > 0 ? (
                      <>
                        <EnhancedLeagueFixtures 
                          fixtures={[...fixtures].sort((a, b) => 
                            new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
                          )}
                          onMatchClick={(matchId) => {
                            const selectedFixture = fixtures.find(f => f.fixture.id === matchId);
                            if (selectedFixture) {
                              return (
                                <Card>
                                  <CardContent className="p-6">
                                    <div className="flex flex-col items-center w-full">
                                      <div className="text-sm text-gray-600 mb-2">
                                        {selectedFixture.league.name} - {selectedFixture.league.round}
                                      </div>
                                      <div className="text-gray-500 text-sm mb-4">
                                        {selectedFixture.fixture.status.long}
                                      </div>
                                      <div className="text-4xl font-bold mb-6 flex items-center justify-center gap-4">
                                        {selectedFixture.goals.home} - {selectedFixture.goals.away}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {format(new Date(selectedFixture.fixture.date), "EEEE, do MMM | HH:mm")} | {selectedFixture.fixture.venue.name}
                                      </div>
                                      <Tabs defaultValue="summary" className="w-full mt-4">
                                        <TabsList>
                                          <TabsTrigger value="summary">Summary</TabsTrigger>
                                          <TabsTrigger value="stats">Stats</TabsTrigger>
                                          <TabsTrigger value="h2h">H2H</TabsTrigger>
                                          <TabsTrigger value="lineups">Lineups</TabsTrigger>
                                          <TabsTrigger value="history">History</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="stats">
                                          <h3>Statistics content here</h3>
                                        </TabsContent>
                                      </Tabs>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            }
                            navigate(`/match/${matchId}`);
                          }}
                        />
                      </>
                    ) : (
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-gray-500">No fixtures available for this league.</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="standings" className="mt-2">
                    <Card>
                      <CardContent className="p-4">
                        {league && (
                          <LeagueStandings 
                            leagueId={league.league.id} 
                            season={league.league.season} 
                          />
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="stats" className="mt-2">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-500">League statistics will be displayed here.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="bracket" className="mt-2">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center py-8">
                          {loading ? (
                            <div className="space-y-4">
                              <Skeleton className="h-8 w-48 mx-auto" />
                              <Skeleton className="h-64 w-full" />
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Tournament bracket will be displayed here.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader className="p-4 border-b border-neutral-200">
                <h3 className="font-semibold text-gray-700">League Information</h3>
              </CardHeader>
              <CardContent className="p-4">
                <Tabs defaultValue="fixtures" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
                    <TabsTrigger value="results">Results</TabsTrigger>
                  </TabsList>
                  <TabsContent value="fixtures" className="mt-2">
                    <div className="space-y-4">
                      {fixtures
                        .filter(match => new Date(match.fixture.date) > new Date())
                        .slice(0, 5)
                        .map(match => (
                          <div key={match.fixture.id} 
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                            onClick={() => navigate(`/match/${match.fixture.id}`)}
                          >
                            <div className="flex items-center gap-2">
                              <TeamLogo teamId={match.teams.home.id} size="small" />
                              <span className="text-sm">{match.teams.home.name}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatDateTime(new Date(match.fixture.date))}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{match.teams.away.name}</span>
                              <TeamLogo teamId={match.teams.away.id} size="small" />
                            </div>
                          </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="results" className="mt-2">
                    <div className="space-y-4">
                      {fixtures
                        .filter(match => new Date(match.fixture.date) <= new Date())
                        .slice(0, 5)
                        .map(match => (
                          <div key={match.fixture.id} 
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                            onClick={() => navigate(`/match/${match.fixture.id}`)}
                          >
                            <div className="flex items-center gap-2">
                              <TeamLogo teamId={match.teams.home.id} size="small" />
                              <span className="text-sm">{match.teams.home.name}</span>
                            </div>
                            <div className="text-sm font-semibold">
                              {match.goals.home} - {match.goals.away}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{match.teams.away.name}</span>
                              <TeamLogo teamId={match.teams.away.id} size="small" />
                            </div>
                          </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="mt-4 text-xs text-gray-500 text-center">
                  Powered by CS Sport
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeagueDetails;