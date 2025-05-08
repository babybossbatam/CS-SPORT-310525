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
import { Star, ArrowLeft, BarChart2, Timer, Trophy, ListOrdered, Info } from 'lucide-react';
import { formatDateTime, getMatchStatusText, isLiveMatch } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MatchPrediction from '@/components/matches/MatchPrediction';
import HistoricalMatchStats from '@/components/matches/HistoricalMatchStats';
import TeamPerformanceTimeline from '@/components/matches/TeamPerformanceTimeline';
import StatHighlight from '@/components/matches/StatHighlight';
import HistoricalStats from '@/components/matches/HistoricalStats';
import PredictionMeter from '@/components/matches/PredictionMeter';
import MatchAtmosphericSounds from '@/components/matches/MatchAtmosphericSounds';

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
            {/* Modern scoreboard with gradients */}
            <div className="relative rounded-lg overflow-hidden mb-8 shadow-lg">
              {/* Match status banner */}
              <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-70 text-white text-center py-1 text-sm">
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
              
              {/* Teams and score section */}
              <div className="flex">
                {/* Home Team - Left side gradient */}
                <div className="w-[45%] bg-gradient-to-r from-blue-900 to-blue-700 py-6 px-4 flex items-center">
                  <div className="flex items-center">
                    <div className="h-20 w-20 flex items-center justify-center bg-white rounded-full p-1 shadow-md mr-4">
                      <img 
                        src={currentFixture.teams.home.logo} 
                        alt={currentFixture.teams.home.name} 
                        className="max-h-full max-w-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Team';
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-white font-bold text-xl uppercase">{currentFixture.teams.home.name}</div>
                      {currentFixture.teams.home.winner && (
                        <div className="text-xs uppercase text-white mt-1 bg-green-600 inline-block px-2 rounded">Winner</div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Center score section */}
                <div className="w-[10%] flex items-center justify-center bg-white">
                  <div className="text-3xl font-bold text-gray-800">
                    {currentFixture.goals.home !== null ? currentFixture.goals.home : '0'}
                    <span className="mx-1">-</span>
                    {currentFixture.goals.away !== null ? currentFixture.goals.away : '0'}
                  </div>
                </div>
                
                {/* Away Team - Right side gradient */}
                <div className="w-[45%] bg-gradient-to-l from-red-900 to-red-700 py-6 px-4 flex items-center justify-end">
                  <div className="flex items-center">
                    <div>
                      <div className="text-white font-bold text-xl uppercase text-right">{currentFixture.teams.away.name}</div>
                      {currentFixture.teams.away.winner && (
                        <div className="text-xs uppercase text-white mt-1 bg-green-600 inline-block px-2 rounded float-right">Winner</div>
                      )}
                    </div>
                    <div className="h-20 w-20 flex items-center justify-center bg-white rounded-full p-1 shadow-md ml-4">
                      <img 
                        src={currentFixture.teams.away.logo} 
                        alt={currentFixture.teams.away.name} 
                        className="max-h-full max-w-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Team';
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Match details footer */}
              <div className="bg-gray-100 py-2 px-4 flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  {currentFixture.fixture.venue.name && (
                    <span>{currentFixture.fixture.venue.name}, {currentFixture.fixture.venue.city || ''}</span>
                  )}
                </div>
                
                {/* HT score if available */}
                {currentFixture.score.halftime.home !== null && currentFixture.score.halftime.away !== null && (
                  <div className="text-sm text-gray-700">
                    HT: {currentFixture.score.halftime.home} - {currentFixture.score.halftime.away}
                  </div>
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
                
                {/* Match Atmosphere Sound Controls */}
                <MatchAtmosphericSounds 
                  matchIntensity={isLiveMatch(currentFixture.fixture.status.short) ? 'high' : 'medium'}
                  homeTeamId={currentFixture.teams.home.id}
                  awayTeamId={currentFixture.teams.away.id}
                />
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
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MatchDetails;
