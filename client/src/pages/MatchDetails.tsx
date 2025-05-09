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
import { Star, ArrowLeft, BarChart2, Timer, Trophy, ListOrdered, Info, Clock, Sparkles } from 'lucide-react';
import { HighlightGenerator } from '@/components/highlights/HighlightGenerator';
import { formatDateTime, getMatchStatusText, isLiveMatch, getTeamGradient } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MatchPrediction from '@/components/matches/MatchPrediction';
import HistoricalMatchStats from '@/components/matches/HistoricalMatchStats';
import TeamPerformanceTimeline from '@/components/matches/TeamPerformanceTimeline';
import StatHighlight from '@/components/matches/StatHighlight';
import HistoricalStats from '@/components/matches/HistoricalStats';
import PredictionMeter from '@/components/matches/PredictionMeter';

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
            {/* Modern scoreboard with gradients - matching the main page style */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 mb-8 relative">
              {/* League and status info */}
              <div className="text-center p-2 flex justify-center items-center gap-2">
                <img 
                  src={currentFixture.league.logo}
                  alt={currentFixture.league.name}
                  className="w-4 h-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/16?text=L';
                  }}
                />
                <span className="text-sm">{currentFixture.league.name} - {currentFixture.league.round}</span>
              </div>
              
              {/* Status badge */}
              <div className="text-xs text-center text-gray-500 -mt-1 mb-1">
                {isLiveMatch(currentFixture.fixture.status.short) ? (
                  <div className="flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
                    LIVE {currentFixture.fixture.status.elapsed && `• ${currentFixture.fixture.status.elapsed}'`}
                  </div>
                ) : currentFixture.fixture.status.short === "FT" ? (
                  <span>FULL TIME</span>
                ) : (
                  <span>{formatDateTime(currentFixture.fixture.date)}</span>
                )}
              </div>
              
              {/* Score */}
              <div className="text-center px-4 py-1">
                <div className="text-3xl font-bold">
                  {currentFixture.goals.home !== null ? currentFixture.goals.home : '0'} - {currentFixture.goals.away !== null ? currentFixture.goals.away : '0'}
                </div>
              </div>
              
              {/* Teams with dynamic gradients based on team names - equal width meeting in middle */}
              <div className="flex rounded-md overflow-hidden relative h-16">
                {/* Container for both gradients that meet in the middle with same width */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center" style={{ height: '40px' }}>
                  {/* Home team logo - positioned at the leftmost */}
                  <div className="absolute bottom-0 left-0 z-10">
                    <img 
                      src={currentFixture.teams.home.logo} 
                      alt={currentFixture.teams.home.name}
                      className="h-16 w-16 transform transition-transform duration-300 hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                      }}
                    />
                  </div>
                  
                  {/* Home team - gradient extending exactly to meet at the middle */}
                  <div className={`h-full w-[50%] ${getTeamGradient(currentFixture.teams.home.name, 'to-r')} flex items-center -ml-[100%]`}>
                    <div className="ml-20 text-white font-bold text-lg uppercase">
                      {currentFixture.teams.home.name}
                      {currentFixture.teams.home.winner && (
                        <span className="text-xs uppercase text-white ml-2 bg-green-600 inline-block px-2 rounded">Winner</span>
                      )}
                    </div>
                  </div>
                  
                  {/* VS label (positioned exactly in the center where gradients meet, shifted 3px to the right) */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 translate-x-3 text-white font-bold text-xl bg-black/70 rounded-full h-8 w-8 flex items-center justify-center z-20">
                    VS
                  </div>
                  
                  {/* Away team - gradient extending exactly to meet at the middle */}
                  <div className={`h-full w-[50%] ${getTeamGradient(currentFixture.teams.away.name, 'to-l')} flex items-center justify-end -mr-[100%]`}>
                    <div className="mr-20 text-white font-bold text-lg uppercase text-right">
                      {currentFixture.teams.away.name}
                      {currentFixture.teams.away.winner && (
                        <span className="text-xs uppercase text-white mr-2 bg-green-600 inline-block px-2 rounded">Winner</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Away team logo - positioned at the rightmost */}
                  <div className="absolute bottom-0 right-0 z-10">
                    <img 
                      src={currentFixture.teams.away.logo} 
                      alt={currentFixture.teams.away.name}
                      className="h-16 w-16 transform transition-transform duration-300 hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Match details footer */}
              <div className="p-2 text-center text-sm border-t border-gray-100">
                <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                  <Clock className="h-3 w-3" />
                  <span>{formatDateTime(currentFixture.fixture.date)}</span>
                  {currentFixture.fixture.venue.name && (
                    <span> | {currentFixture.fixture.venue.name}, {currentFixture.fixture.venue.city || ''}</span>
                  )}
                </div>
                
                {/* HT score if available */}
                {currentFixture.score.halftime.home !== null && currentFixture.score.halftime.away !== null && (
                  <div className="text-xs text-gray-700 mt-1">
                    HT: {currentFixture.score.halftime.home} - {currentFixture.score.halftime.away}
                  </div>
                )}
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 mb-4">
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
                <TabsTrigger value="highlights" className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span>Highlights</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="mt-2">
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
                      
                      {/* Match Stats Highlights */}
                      <div className="mt-6 border-t pt-4">
                        <h3 className="text-sm font-medium text-center mb-4">Key Match Statistics</h3>
                        <div className="space-y-3">
                          <StatHighlight 
                            label="Possession" 
                            homeValue={55} 
                            awayValue={45} 
                            isPrimary={true} 
                          />
                          <StatHighlight 
                            label="Shots on Goal" 
                            homeValue={8} 
                            awayValue={6} 
                          />
                          <StatHighlight 
                            label="Corner Kicks" 
                            homeValue={7} 
                            awayValue={4} 
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Prediction Meter Card */}
                  <PredictionMeter 
                    homeTeam={{
                      id: currentFixture.teams.home.id,
                      name: currentFixture.teams.home.name,
                      logo: currentFixture.teams.home.logo,
                      prediction: {
                        chance: 45,
                        form: 'ascending',
                        history: 50
                      }
                    }}
                    awayTeam={{
                      id: currentFixture.teams.away.id,
                      name: currentFixture.teams.away.name,
                      logo: currentFixture.teams.away.logo,
                      prediction: {
                        chance: 35,
                        form: 'stable',
                        history: 35
                      }
                    }}
                    drawChance={20}
                    confidence={75}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="stats" className="mt-2">
                <Card>
                  <CardHeader className="p-4 border-b flex items-center">
                    <BarChart2 className="h-5 w-5 mr-2 text-blue-600" />
                    <h3 className="font-semibold">Match Statistics</h3>
                  </CardHeader>
                  <CardContent className="p-4">
                    {/* Enhanced Stats with interactive highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium mb-3 text-gray-600">Match Control</h4>
                        
                        <StatHighlight 
                          label="Possession (%)" 
                          homeValue={58} 
                          awayValue={42} 
                          isPrimary={true}
                        />
                        
                        <StatHighlight 
                          label="Passing Accuracy (%)" 
                          homeValue={86} 
                          awayValue={79} 
                        />
                        
                        <StatHighlight 
                          label="Total Passes" 
                          homeValue={452} 
                          awayValue={321} 
                        />
                        
                        <StatHighlight 
                          label="Attacks" 
                          homeValue={83} 
                          awayValue={64} 
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium mb-3 text-gray-600">Attack Effectiveness</h4>
                        
                        <StatHighlight 
                          label="Shots" 
                          homeValue={16} 
                          awayValue={9} 
                          isPrimary={true}
                        />
                        
                        <StatHighlight 
                          label="Shots on Target" 
                          homeValue={7} 
                          awayValue={4} 
                        />
                        
                        <StatHighlight 
                          label="Corner Kicks" 
                          homeValue={6} 
                          awayValue={3} 
                        />
                        
                        <StatHighlight 
                          label="Expected Goals (xG)" 
                          homeValue={2.3} 
                          awayValue={1.1} 
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium mb-3 text-gray-600">Discipline</h4>
                        
                        <StatHighlight 
                          label="Fouls" 
                          homeValue={12} 
                          awayValue={15} 
                        />
                        
                        <StatHighlight 
                          label="Yellow Cards" 
                          homeValue={2} 
                          awayValue={3} 
                        />
                        
                        <StatHighlight 
                          label="Red Cards" 
                          homeValue={0} 
                          awayValue={0} 
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium mb-3 text-gray-600">Defense</h4>
                        
                        <StatHighlight 
                          label="Tackles" 
                          homeValue={22} 
                          awayValue={28} 
                        />
                        
                        <StatHighlight 
                          label="Interceptions" 
                          homeValue={14} 
                          awayValue={19} 
                        />
                        
                        <StatHighlight 
                          label="Saves" 
                          homeValue={2} 
                          awayValue={5} 
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 text-center text-xs text-gray-500">
                      <p>Hover over each stat bar to see more details and insights</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="h2h" className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <HistoricalMatchStats 
                    homeTeam={currentFixture.teams.home}
                    awayTeam={currentFixture.teams.away}
                  />
                  <TeamPerformanceTimeline
                    team={currentFixture.teams.home}
                  />
                </div>
                
                {/* New Historical Stats Component with enhanced UI */}
                <HistoricalStats
                  homeTeamId={currentFixture.teams.home.id}
                  homeTeamName={currentFixture.teams.home.name}
                  homeTeamLogo={currentFixture.teams.home.logo}
                  awayTeamId={currentFixture.teams.away.id}
                  awayTeamName={currentFixture.teams.away.name}
                  awayTeamLogo={currentFixture.teams.away.logo}
                  previousMatches={[
                    {
                      date: "2025-03-15",
                      homeTeam: currentFixture.teams.home.name,
                      awayTeam: currentFixture.teams.away.name,
                      homeScore: 2,
                      awayScore: 1,
                      competition: currentFixture.league.name
                    },
                    {
                      date: "2024-11-22",
                      homeTeam: currentFixture.teams.away.name,
                      awayTeam: currentFixture.teams.home.name,
                      homeScore: 0,
                      awayScore: 3,
                      competition: currentFixture.league.name
                    },
                    {
                      date: "2024-08-05",
                      homeTeam: currentFixture.teams.home.name,
                      awayTeam: currentFixture.teams.away.name,
                      homeScore: 1,
                      awayScore: 1,
                      competition: "Cup"
                    }
                  ]}
                  headToHead={{
                    totalMatches: 10,
                    homeWins: 4,
                    awayWins: 3,
                    draws: 3,
                    lastFiveResults: ['H', 'A', 'D', 'H', 'A']
                  }}
                  teamForm={{
                    homeTeamForm: ['W', 'W', 'D', 'L', 'W'],
                    awayTeamForm: ['L', 'W', 'W', 'D', 'L'],
                    homeTeamPosition: 4,
                    awayTeamPosition: 7
                  }}
                />
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
              
              <TabsContent value="highlights" className="mt-2">
                <Card>
                  <CardHeader className="p-4 border-b flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
                    <h3 className="font-semibold">Create Your Own Highlights</h3>
                  </CardHeader>
                  <CardContent className="p-4">
                    {currentFixture && (
                      <HighlightGenerator match={currentFixture} />
                    )}
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
