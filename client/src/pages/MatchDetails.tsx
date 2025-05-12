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
import { Star, ArrowLeft, BarChart2, Timer, Trophy, ListOrdered, Info, Clock, Sparkles, PlayCircle } from 'lucide-react';
import { HighlightGenerator } from '@/components/highlights/HighlightGenerator';
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
            {/* Modern scoreboard using the MatchScoreboard component */}
            <MatchScoreboard 
              match={currentFixture}
              homeTeamColor="#6f7c93" // Exact match to Atalanta blue-gray color in reference
              awayTeamColor="#8b0000" // Exact match to AS Roma dark red color in reference
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
                <TabsTrigger value="highlights" className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span>Highlights</span>
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  <span>Events</span>
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
              
              {/* Highlights Tab */}
              <TabsContent value="highlights" className="mt-2">
                <Card>
                  <CardHeader className="p-4 border-b flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
                    <h3 className="font-semibold">Match Highlights</h3>
                  </CardHeader>
                  <CardContent className="p-4">
                    {/* Highlights Video Player - Embedded at the top */}
                    <div className="mb-6 w-full">
                      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                        <iframe 
                          className="w-full h-full"
                          src={
                            currentFixture.teams.home.name.includes("Juventus") || currentFixture.teams.away.name.includes("Juventus") 
                              ? "https://www.youtube.com/embed/dPJ-rC2bPxc" // Juventus highlights
                              : currentFixture.teams.home.name.includes("Milan") || currentFixture.teams.away.name.includes("Milan")
                              ? "https://www.youtube.com/embed/YNLNHBVKAwI" // AC Milan highlights
                              : currentFixture.teams.home.name.includes("Arsenal") || currentFixture.teams.away.name.includes("Arsenal")
                              ? "https://www.youtube.com/embed/m7tPG-LbR8c" // Arsenal highlights
                              : currentFixture.teams.home.name.includes("Manchester") || currentFixture.teams.away.name.includes("Manchester")
                              ? "https://www.youtube.com/embed/qc5Pm0V7-d0" // Man City highlights
                              : "https://www.youtube.com/embed/RsIYKdzxYoo" // General football highlights
                          }
                          title={`${currentFixture.teams.home.name} vs ${currentFixture.teams.away.name} Highlights`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                        ></iframe>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <h3 className="text-sm font-medium">{currentFixture.teams.home.name} vs {currentFixture.teams.away.name} - Match Highlights</h3>
                        <div className="text-xs text-gray-500">
                          {currentFixture.league.name} | {new Date(currentFixture.fixture.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Events Tab - NEW */}
              <TabsContent value="events" className="mt-2">
                <MatchTimeline 
                  homeTeam={currentFixture.teams.home}
                  awayTeam={currentFixture.teams.away}
                  events={matchEvents}
                  matchStatus={currentFixture.fixture.status.long}
                  currentMinute={currentFixture.fixture.status.elapsed || 0}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MatchDetails;