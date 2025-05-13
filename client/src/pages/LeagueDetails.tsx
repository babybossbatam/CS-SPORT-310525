import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useDispatch, useSelector } from 'react-redux';
import Header from '@/components/layout/Header';
import { RootState, leaguesActions, fixturesActions, userActions } from '@/lib/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EnhancedLeagueFixtures } from '@/components/matches/EnhancedLeagueFixtures';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LeagueDetailsHeader } from '@/components/layout/LeagueDetailsHeader';
import { Star, ArrowLeft, BarChart2, CalendarDays, Trophy, Table } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';

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

  // Check if league is favorited
  const isFavorite = user.preferences.favoriteLeagues.includes(id || '');

  // Fetch league details
  useEffect(() => {
    const fetchLeagueDetails = async () => {
      if (!id) return;

      // If league is already in state, don't fetch again
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

  // Fetch league fixtures
  useEffect(() => {
    const fetchLeagueFixtures = async () => {
      if (!id) return;

      // If fixtures are already in state, don't fetch again
      if (fixtures.length > 0) return;

      try {
        dispatch(fixturesActions.setLoadingFixtures(true));

        // Get current season
        const currentYear = new Date().getFullYear();

        const response = await apiRequest(
          'GET', 
          `/api/leagues/${id}/fixtures?season=${currentYear}`
        );
        const data = await response.json();

        dispatch(fixturesActions.setFixturesByLeague({ 
          leagueId: id,
          fixtures: data 
        }));
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

  // Update tab in URL when changed
  useEffect(() => {
    if (tab !== activeTab && id) {
      navigate(`/league/${id}/${activeTab}`);
    }
  }, [activeTab, id, navigate, tab]);

  // Toggle favorite status
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

      // Update on server
      if (user.id) {
        apiRequest('PATCH', `/api/user/${user.id}/preferences`, {
          favoriteLeagues: user.preferences.favoriteLeagues.filter(leagueId => leagueId !== id)
        }).catch(err => {
          console.error('Failed to update preferences:', err);
        });
      }
    } else {
      dispatch(userActions.addFavoriteLeague(id || ''));

      // Update on server
      if (user.id) {
        apiRequest('PATCH', `/api/user/${user.id}/preferences`, {
          favoriteLeagues: [...user.preferences.favoriteLeagues, id]
        }).catch(err => {
          console.error('Failed to update preferences:', err);
        });
      }
    }
  };

  // Loading state
  if (loading || !league) {
    return (
      <>
        <Header />
        <SportsCategoryTabs />
        <TournamentHeader title="Loading league details..." />

        <div className="container mx-auto px-4 py-4">
          <Card className="mb-6">
            <CardHeader className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center" 
                onClick={() => navigate('/')}
              >
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
      <LeagueDetailsHeader />

      <div className="container mx-auto px-4 py-4">
        <Card className="mb-6">
          <CardHeader className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center" 
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back</span>
            </Button>
            <div className="flex items-center">
              <img 
                src={league.league.logo} 
                alt={league.league.name} 
                className="h-8 w-8 mr-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=League';
                }}
              />
              <h2 className="text-lg font-semibold">{league.league.name}</h2>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFavorite}
              className={isFavorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}
            >
              <Star className={`h-5 w-5 ${isFavorite ? 'fill-yellow-400' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="text-center">
                <img 
                  src={league.league.logo} 
                  alt={league.league.name}
                  className="h-24 w-24 mx-auto mb-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=League';
                  }}
                />
                <h3 className="text-xl font-semibold">{league.league.name}</h3>
                <p className="text-sm text-gray-500">{league.country.name}</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="fixtures" className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <span>Fixtures</span>
                </TabsTrigger>
                <TabsTrigger value="standings" className="flex items-center">
                  <Table className="h-4 w-4 mr-2" />
                  <span>Standings</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  <span>Stats</span>
                </TabsTrigger>
                <TabsTrigger value="bracket" className="flex items-center">
                  <Trophy className="h-4 w-4 mr-2" />
                  <span>Bracket</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="fixtures" className="mt-2">
                {fixtures.length > 0 ? (
                  <EnhancedLeagueFixtures 
                    fixtures={[...fixtures].sort((a, b) => 
                      new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
                    )}
                    onMatchClick={(matchId) => navigate(`/match/${matchId}`)}
                  />
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
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">League standings will be displayed here.</p>
                    </div>
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
                      <p className="text-sm text-gray-500">Tournament bracket will be displayed here.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default LeagueDetails;