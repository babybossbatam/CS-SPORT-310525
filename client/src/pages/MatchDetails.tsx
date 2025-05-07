import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, fixturesActions, userActions } from '@/lib/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import { Star, ArrowLeft, BarChart2, Timer, Trophy, ListOrdered } from 'lucide-react';
import { formatDateTime, getMatchStatusText, isLiveMatch } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MatchPrediction from '@/components/matches/MatchPrediction';
import HistoricalMatchStats from '@/components/matches/HistoricalMatchStats';
import TeamPerformanceTimeline from '@/components/matches/TeamPerformanceTimeline';

const MatchDetails = () => {
  const { id, tab = 'summary' } = useParams();
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const user = useSelector((state: RootState) => state.user);
  const { currentFixture, loading, error } = useSelector((state: RootState) => state.fixtures);
  
  const [activeTab, setActiveTab] = useState(tab);
  
  // Check if match is favorited
  const isFavorite = user.preferences.favoriteMatches.includes(id || '');
  
  // Fetch match details
  useEffect(() => {
    const fetchMatchDetails = async () => {
      if (!id) return;
      
      try {
        dispatch(fixturesActions.setLoadingFixtures(true));
        
        const response = await apiRequest('GET', `/api/fixtures/${id}`);
        const data = await response.json();
        
        dispatch(fixturesActions.setCurrentFixture(data));
      } catch (error) {
        console.error(`Error fetching match details for ID ${id}:`, error);
        toast({
          title: 'Error',
          description: 'Failed to load match details',
          variant: 'destructive',
        });
        dispatch(fixturesActions.setFixturesError('Failed to load match details'));
      } finally {
        dispatch(fixturesActions.setLoadingFixtures(false));
      }
    };
    
    fetchMatchDetails();
    
    // If match is live, set up polling for updates
    if (currentFixture && isLiveMatch(currentFixture.fixture.status.short)) {
      const intervalId = setInterval(fetchMatchDetails, 1800000); // Update every 30 minutes (1,800,000 ms)
      return () => clearInterval(intervalId);
    }
  }, [id, dispatch, toast, currentFixture?.fixture.status.short]);
  
  // Update tab in URL when changed
  useEffect(() => {
    if (tab !== activeTab && id) {
      navigate(`/match/${id}/${activeTab}`);
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
      dispatch(userActions.removeFavoriteMatch(id || ''));
      
      // Update on server
      if (user.id) {
        apiRequest('PATCH', `/api/user/${user.id}/preferences`, {
          favoriteMatches: user.preferences.favoriteMatches.filter(matchId => matchId !== id)
        }).catch(err => {
          console.error('Failed to update preferences:', err);
        });
      }
    } else {
      dispatch(userActions.addFavoriteMatch(id || ''));
      
      // Update on server
      if (user.id) {
        apiRequest('PATCH', `/api/user/${user.id}/preferences`, {
          favoriteMatches: [...user.preferences.favoriteMatches, id]
        }).catch(err => {
          console.error('Failed to update preferences:', err);
        });
      }
    }
  };
  
  // Loading state
  if (loading || !currentFixture) {
    return (
      <>
        <Header />
        <SportsCategoryTabs />
        <TournamentHeader title="Loading match details..." />
        
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
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="flex flex-col items-center">
                  <Skeleton className="h-20 w-20 rounded mb-2" />
                  <Skeleton className="h-5 w-32 mb-1" />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <Skeleton className="h-10 w-20 mb-2" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex flex-col items-center">
                  <Skeleton className="h-20 w-20 rounded mb-2" />
                  <Skeleton className="h-5 w-32 mb-1" />
                </div>
              </div>
              
              <Skeleton className="h-8 w-full mb-4" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </>
    );
  }
  
  // Error state
  if (error) {
    return (
      <>
        <Header />
        <SportsCategoryTabs />
        <TournamentHeader title="Error loading match" />
        
        <div className="container mx-auto px-4 py-4">
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <div className="text-red-500 mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 mx-auto mb-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <h3 className="text-xl font-bold">Error Loading Match Details</h3>
                <p className="text-gray-600 mt-2">
                  {error || "There was a problem loading this match. Please try again later."}
                </p>
              </div>
              <Button 
                variant="default" 
                onClick={() => navigate('/')}
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }
  
  // Match details view
  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader title={`${currentFixture.league.name} - ${currentFixture.league.round}`} />
      
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
            <div className="text-sm font-medium">
              {isLiveMatch(currentFixture.fixture.status.short) && (
                <Badge variant="default" className="bg-[#48BB78]">LIVE</Badge>
              )}
              <span className="ml-2">
                {getMatchStatusText(
                  currentFixture.fixture.status.short, 
                  currentFixture.fixture.status.elapsed
                )}
              </span>
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
            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* Home Team */}
              <div className="flex flex-col items-center">
                <div className="h-40 w-40 flex items-center justify-center mb-3">
                  <img 
                    src={currentFixture.teams.home.logo} 
                    alt={currentFixture.teams.home.name} 
                    className="max-h-full max-w-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/160?text=Team';
                    }}
                  />
                </div>
                <div className="text-lg font-semibold text-center uppercase">{currentFixture.teams.home.name}</div>
                {currentFixture.teams.home.winner && (
                  <Badge variant="outline" className="mt-1 border-green-500 text-green-600">Winner</Badge>
                )}
              </div>
              
              {/* Score */}
              <div className="flex flex-col items-center justify-center">
                <div className="text-5xl font-bold mb-3 mt-4">
                  {currentFixture.goals.home !== null ? currentFixture.goals.home : '-'} - {currentFixture.goals.away !== null ? currentFixture.goals.away : '-'}
                </div>
                <div className="text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-2 shadow-sm">
                  {formatDateTime(currentFixture.fixture.date)}
                  {currentFixture.fixture.venue.name && (
                    <div className="text-center mt-1 font-medium">{currentFixture.fixture.venue.name}</div>
                  )}
                </div>
                
                {/* Show match status badge */}
                <div className="mt-4 mb-2">
                  {isLiveMatch(currentFixture.fixture.status.short) ? (
                    <Badge variant="default" className="bg-green-600 px-3 py-1">
                      LIVE {currentFixture.fixture.status.elapsed && `• ${currentFixture.fixture.status.elapsed}'`}
                    </Badge>
                  ) : currentFixture.fixture.status.short === "FT" ? (
                    <Badge variant="outline" className="px-3 py-1">FULL TIME</Badge>
                  ) : (
                    <Badge variant="outline" className="px-3 py-1">SCHEDULED</Badge>
                  )}
                </div>
                
                {/* Additional scores in a styled box */}
                {(currentFixture.score.halftime.home !== null || 
                  currentFixture.score.extratime.home !== null || 
                  currentFixture.score.penalty.home !== null) && (
                  <div className="text-xs text-gray-600 border border-gray-200 rounded p-2 mt-2 bg-gray-50 w-full max-w-[200px]">
                    {currentFixture.score.halftime.home !== null && currentFixture.score.halftime.away !== null && (
                      <div className="flex justify-between items-center py-1">
                        <span>Half Time:</span>
                        <span className="font-medium">{currentFixture.score.halftime.home} - {currentFixture.score.halftime.away}</span>
                      </div>
                    )}
                    
                    {currentFixture.score.extratime.home !== null && currentFixture.score.extratime.away !== null && (
                      <div className="flex justify-between items-center py-1 border-t border-gray-200">
                        <span>Extra Time:</span>
                        <span className="font-medium">{currentFixture.score.extratime.home} - {currentFixture.score.extratime.away}</span>
                      </div>
                    )}
                    
                    {currentFixture.score.penalty.home !== null && currentFixture.score.penalty.away !== null && (
                      <div className="flex justify-between items-center py-1 border-t border-gray-200">
                        <span>Penalties:</span>
                        <span className="font-medium">{currentFixture.score.penalty.home} - {currentFixture.score.penalty.away}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Away Team */}
              <div className="flex flex-col items-center">
                <div className="h-40 w-40 flex items-center justify-center mb-3">
                  <img 
                    src={currentFixture.teams.away.logo} 
                    alt={currentFixture.teams.away.name} 
                    className="max-h-full max-w-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/160?text=Team';
                    }}
                  />
                </div>
                <div className="text-lg font-semibold text-center uppercase">{currentFixture.teams.away.name}</div>
                {currentFixture.teams.away.winner && (
                  <Badge variant="outline" className="mt-1 border-green-500 text-green-600">Winner</Badge>
                )}
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="summary" className="flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  <span>Summary</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center">
                  <ListOrdered className="h-4 w-4 mr-2" />
                  <span>Stats</span>
                </TabsTrigger>
                <TabsTrigger value="h2h" className="flex items-center">
                  <Timer className="h-4 w-4 mr-2" />
                  <span>H2H</span>
                </TabsTrigger>
                <TabsTrigger value="lineups" className="flex items-center">
                  <Trophy className="h-4 w-4 mr-2" />
                  <span>Lineups</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="mt-2">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center text-sm text-gray-500">
                      {currentFixture.fixture.status.long === "Match Finished" ? (
                        <p>This match has ended. Final score: {currentFixture.goals.home} - {currentFixture.goals.away}</p>
                      ) : isLiveMatch(currentFixture.fixture.status.short) ? (
                        <p>
                          This match is currently in progress. 
                          {currentFixture.fixture.status.elapsed && ` Elapsed time: ${currentFixture.fixture.status.elapsed} minutes`}
                        </p>
                      ) : (
                        <p>This match has not started yet. Scheduled to begin at {formatDateTime(currentFixture.fixture.date)}</p>
                      )}
                      
                      {currentFixture.fixture.referee && (
                        <p className="mt-2">Referee: {currentFixture.fixture.referee}</p>
                      )}
                      
                      {currentFixture.fixture.venue.name && currentFixture.fixture.venue.city && (
                        <p className="mt-2">Venue: {currentFixture.fixture.venue.name}, {currentFixture.fixture.venue.city}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="stats" className="mt-2">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-4">
                        Detailed match statistics will be available here.
                      </p>
                      
                      {/* Placeholder for stats that would come from the API */}
                      <div className="space-y-4">
                        {['Possession', 'Shots', 'Shots on Target', 'Corners', 'Fouls'].map((stat) => (
                          <div key={stat} className="flex items-center justify-between">
                            <div className="w-16 text-right text-sm font-medium">--</div>
                            <div className="flex-1 mx-4">
                              <div className="text-xs text-center mb-1">{stat}</div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                              </div>
                            </div>
                            <div className="w-16 text-left text-sm font-medium">--</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="h2h" className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <HistoricalMatchStats 
                    homeTeam={currentFixture.teams.home}
                    awayTeam={currentFixture.teams.away}
                  />
                  <TeamPerformanceTimeline
                    team={currentFixture.teams.home}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="lineups" className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MatchPrediction 
                    homeTeam={currentFixture.teams.home}
                    awayTeam={currentFixture.teams.away}
                    homeWinProbability={55}
                    drawProbability={25}
                    awayWinProbability={20}
                  />
                  <TeamPerformanceTimeline
                    team={currentFixture.teams.away}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MatchDetails;
