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
import { Star, ArrowLeft, BarChart2, Timer, Trophy, ListOrdered, Info, Clock } from 'lucide-react';
import { formatDateTime, getMatchStatusText, isLiveMatch } from '@/lib/utils';
import { getTeamGradient, getTeamColor, getOpposingTeamColor, getTailwindToHex } from '@/lib/colorUtils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MatchPrediction from '@/components/matches/MatchPrediction';
import HistoricalMatchStats from '@/components/matches/HistoricalMatchStats';
import TeamPerformanceTimeline from '@/components/matches/TeamPerformanceTimeline';
import StatHighlight from '@/components/matches/StatHighlight';
import HistoricalStats from '@/components/matches/HistoricalStats';
import PredictionMeter from '@/components/matches/PredictionMeter';
import MatchScoreboard from '@/components/matches/MatchScoreboard';
import MatchTimeline, { MatchEvent } from '@/components/matches/MatchTimeline';

const MatchDetails = () => {
  const { id, tab = 'summary' } = useParams();
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const user = useSelector((state: RootState) => state.user);
  const { currentFixture, loading, error } = useSelector((state: RootState) => state.fixtures);
  
  const [activeTab, setActiveTab] = useState(tab);
  
  // Sample match events data for the interactive timeline
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([
    {
      id: 1,
      minute: 12,
      type: 'goal',
      team: 'home',
      player: 'Player Name',
      assistedBy: 'Teammate'
    },
    {
      id: 2,
      minute: 24,
      type: 'yellow_card',
      team: 'away',
      player: 'Opponent Player'
    },
    {
      id: 3,
      minute: 36,
      type: 'goal',
      team: 'away',
      player: 'Striker Name',
      assistedBy: 'Midfielder'
    },
    {
      id: 4,
      minute: 42,
      type: 'substitution',
      team: 'home',
      player: 'Substitute Player',
      detail: 'Injured Player'
    },
    {
      id: 5,
      minute: 58,
      type: 'var',
      team: 'home',
      player: 'Team Captain',
      detail: 'Goal disallowed for offside'
    },
    {
      id: 6,
      minute: 67,
      type: 'goal',
      team: 'home',
      player: 'Midfielder',
      assistedBy: 'Winger'
    },
    {
      id: 7,
      minute: 73,
      type: 'red_card',
      team: 'away',
      player: 'Defender'
    },
    {
      id: 8,
      minute: 85,
      type: 'penalty',
      team: 'home',
      player: 'Penalty Taker',
      detail: 'Scored'
    }
  ]);
  
  // Check if match is favorited
  const isFavorite = user.preferences.favoriteMatches.includes(id || '');
  
  // Fetch match details and highlights
  useEffect(() => {
    const fetchMatchDetails = async () => {
      if (!id) return;
      
      try {
        dispatch(fixturesActions.setLoadingFixtures(true));
        dispatch(fixturesActions.setFixturesError(null));
        
        // Implement fetch with a timeout to avoid hanging requests
        const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 15000) => {
          const controller = new AbortController();
          const { signal } = controller;
          
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          try {
            const response = await fetch(url, { ...options, signal });
            clearTimeout(timeoutId);
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('Network timeout: The request took too long to complete.');
            }
            throw error;
          }
        };
        
        // Use our custom fetch with timeout
        const response = await fetchWithTimeout(`/api/fixtures/${id}`, { 
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        dispatch(fixturesActions.setCurrentFixture(data));
        
        // Generate realistic match events based on fixture data
        generateMatchEvents(data);
      } catch (error) {
        console.error(`Error fetching match details for ID ${id}:`, error);
        
        // Create a user-friendly error message based on the type of error
        let errorMessage = 'Failed to load match details';
        if (error instanceof Error) {
          if (error.message.includes('Network timeout')) {
            errorMessage = 'The request timed out. Please check your connection and try again.';
          } else if (error.message.includes('Network error') || error.message.includes('fetch')) {
            errorMessage = 'Network error: Please check your internet connection and try again.';
          } else if (error.message.includes('Server error')) {
            errorMessage = `Server error: ${error.message.replace('Server error: ', '')}`;
          }
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        
        dispatch(fixturesActions.setFixturesError(errorMessage));
      } finally {
        dispatch(fixturesActions.setLoadingFixtures(false));
      }
    };
    

    
    // Function to generate realistic match events based on the fixture data
    const generateMatchEvents = (fixture: any) => {
      if (!fixture) return;
      
      const homeTeam = fixture.teams.home;
      const awayTeam = fixture.teams.away;
      const homeScore = fixture.goals.home || 0;
      const awayScore = fixture.goals.away || 0;
      
      const newEvents: MatchEvent[] = [];
      
      // Add goal events based on score
      for (let i = 0; i < homeScore; i++) {
        newEvents.push({
          id: newEvents.length + 1,
          minute: Math.floor(Math.random() * 90) + 1,
          type: 'goal',
          team: 'home',
          player: `${homeTeam.name} Player`,
          assistedBy: Math.random() > 0.5 ? `${homeTeam.name} Teammate` : undefined
        });
      }
      
      for (let i = 0; i < awayScore; i++) {
        newEvents.push({
          id: newEvents.length + 1,
          minute: Math.floor(Math.random() * 90) + 1,
          type: 'goal',
          team: 'away',
          player: `${awayTeam.name} Player`,
          assistedBy: Math.random() > 0.5 ? `${awayTeam.name} Teammate` : undefined
        });
      }
      
      // Add some yellow cards (1-3 per team)
      const homeYellowCards = Math.floor(Math.random() * 3) + 1;
      const awayYellowCards = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < homeYellowCards; i++) {
        newEvents.push({
          id: newEvents.length + 1,
          minute: Math.floor(Math.random() * 90) + 1,
          type: 'yellow_card',
          team: 'home',
          player: `${homeTeam.name} Player`
        });
      }
      
      for (let i = 0; i < awayYellowCards; i++) {
        newEvents.push({
          id: newEvents.length + 1,
          minute: Math.floor(Math.random() * 90) + 1,
          type: 'yellow_card',
          team: 'away',
          player: `${awayTeam.name} Player`
        });
      }
      
      // Add a red card with 20% probability
      if (Math.random() < 0.2) {
        newEvents.push({
          id: newEvents.length + 1,
          minute: Math.floor(Math.random() * 90) + 1,
          type: 'red_card',
          team: Math.random() < 0.5 ? 'home' : 'away',
          player: Math.random() < 0.5 ? `${homeTeam.name} Player` : `${awayTeam.name} Player`
        });
      }
      
      // Add substitutions (2-3 per team)
      const homeSubstitutions = Math.floor(Math.random() * 2) + 2;
      const awaySubstitutions = Math.floor(Math.random() * 2) + 2;
      
      for (let i = 0; i < homeSubstitutions; i++) {
        newEvents.push({
          id: newEvents.length + 1,
          minute: 45 + Math.floor(Math.random() * 45),
          type: 'substitution',
          team: 'home',
          player: `${homeTeam.name} Sub In`,
          detail: `${homeTeam.name} Sub Out`
        });
      }
      
      for (let i = 0; i < awaySubstitutions; i++) {
        newEvents.push({
          id: newEvents.length + 1,
          minute: 45 + Math.floor(Math.random() * 45),
          type: 'substitution',
          team: 'away',
          player: `${awayTeam.name} Sub In`,
          detail: `${awayTeam.name} Sub Out`
        });
      }
      
      // Add VAR event with 30% probability
      if (Math.random() < 0.3) {
        newEvents.push({
          id: newEvents.length + 1,
          minute: Math.floor(Math.random() * 90) + 1,
          type: 'var',
          team: Math.random() < 0.5 ? 'home' : 'away',
          player: Math.random() < 0.5 ? `${homeTeam.name} Player` : `${awayTeam.name} Player`,
          detail: Math.random() < 0.5 ? 'Goal disallowed for offside' : 'Penalty decision overturned'
        });
      }
      
      // Sort events by minute
      newEvents.sort((a, b) => a.minute - b.minute);
      
      // Update ID sequence to match sorted order
      newEvents.forEach((event, index) => {
        event.id = index + 1;
      });
      
      // Update the state with the generated events
      setMatchEvents(newEvents);
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
                  {typeof error === 'string' && error.includes('Network error') 
                    ? "Network connection issue: Please check your internet connection and try again."
                    : error || "There was a problem loading this match. Please try again later."}
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="default" 
                  onClick={() => navigate('/')}
                >
                  Return to Home
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Reload the fixture data
                    dispatch(fixturesActions.setLoadingFixtures(true));
                    dispatch(fixturesActions.setFixturesError(null));
                    
                    // Attempt to reload the match
                    apiRequest('GET', `/api/fixtures/${id}`)
                      .then(res => res.json())
                      .then(data => {
                        dispatch(fixturesActions.setCurrentFixture(data));
                        dispatch(fixturesActions.setLoadingFixtures(false));
                      })
                      .catch(err => {
                        dispatch(fixturesActions.setFixturesError(err.message || 'Failed to load match'));
                        dispatch(fixturesActions.setLoadingFixtures(false));
                        
                        toast({
                          title: 'Error',
                          description: 'Could not reload match details. Please try again later.',
                          variant: 'destructive',
                        });
                      });
                  }}
                >
                  Try Again
                </Button>
              </div>
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
            {/* Modern scoreboard using the MatchScoreboard component */}
            <div className="flex flex-col items-center w-full">
              <div className="text-sm text-gray-600 mb-2">
                {currentFixture.league.name} - {currentFixture.league.round}
              </div>
              <div className="text-gray-500 text-sm mb-4">
                {currentFixture.fixture.status.long}
              </div>
              
              <div className="text-4xl font-bold mb-6 flex items-center justify-center gap-4">
                {currentFixture.goals.home} - {currentFixture.goals.away}
              </div>
              
              <div className="w-full flex items-center justify-between mb-8">
                <div className="flex-1 flex flex-col items-center">
                  <img 
                    src={currentFixture.teams.home.logo} 
                    alt={currentFixture.teams.home.name}
                    className="w-24 h-24 object-contain mb-2"
                  />
                  <div className="text-xl font-bold uppercase text-center">
                    {currentFixture.teams.home.name}
                  </div>
                </div>
                
                <div className="text-2xl font-bold px-6">VS</div>
                
                <div className="flex-1 flex flex-col items-center">
                  <img 
                    src={currentFixture.teams.away.logo} 
                    alt={currentFixture.teams.away.name}
                    className="w-24 h-24 object-contain mb-2"
                  />
                  <div className="text-xl font-bold uppercase text-center">
                    {currentFixture.teams.away.name}
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                {format(new Date(currentFixture.fixture.date), "EEEE, do MMM | HH:mm")} | {currentFixture.fixture.venue.name}
              </div>
              
              <div className="flex items-center justify-center gap-12 w-full border-t pt-4">
                <button className="flex flex-col items-center text-gray-600 hover:text-gray-900">
                  <span className="text-sm">Match Page</span>
                </button>
                <button className="flex flex-col items-center text-gray-600 hover:text-gray-900">
                  <span className="text-sm">Lineups</span>
                </button>
                <button className="flex flex-col items-center text-gray-600 hover:text-gray-900">
                  <span className="text-sm">Stats</span>
                </button>
                <button className="flex flex-col items-center text-gray-600 hover:text-gray-900">
                  <span className="text-sm">Bracket</span>
                </button>
              </div>
            </div>
            <MatchScoreboard
              match={currentFixture}
              homeTeamColor="#6f7c93"
              awayTeamColor="#8b0000"
            />
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-7 mb-4">
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
                <TabsTrigger value="history" className="flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  <span>History</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Summary Tab */}
              <TabsContent value="summary" className="mt-2">
                {/* Your existing summary content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  {/* Match Info Card */}
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
                  
                  {/* Add other summary content as needed */}
                </div>
              </TabsContent>
              
              {/* Stats Tab */}
              <TabsContent value="stats" className="mt-2">
                {/* Your existing stats content */}
                <Card>
                  <CardContent className="p-4">
                    <h3>Statistics content here</h3>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* H2H Tab */}
              <TabsContent value="h2h" className="mt-2">
                {/* Your existing h2h content */}
                <Card>
                  <CardContent className="p-4">
                    <h3>Head to head content here</h3>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Lineups Tab */}
              <TabsContent value="lineups" className="mt-2">
                {/* Your existing lineups content */}
                <Card>
                  <CardContent className="p-4">
                    <h3>Lineups content here</h3>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* History Tab */}
              <TabsContent value="history" className="mt-2">
                {/* Your existing history content */}
                <Card>
                  <CardContent className="p-4">
                    <h3>History content here</h3>
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

export default MatchDetails;