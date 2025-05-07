import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, fixturesActions } from '@/lib/store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Activity, ChevronLeft, ChevronRight, Clock, Calendar, Flag, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { formatElapsedTime, isLiveMatch, formatDateTime, formatMatchDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

// Import custom components
import TeamPerformanceChart from './TeamPerformanceChart';
import MatchIntensityIndicator from './MatchIntensityIndicator';

const LiveScoreboard = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const { live: liveFixtures, upcoming: upcomingFixtures, loading } = useSelector((state: RootState) => state.fixtures);
  
  // Fetch live fixtures
  useEffect(() => {
    const fetchLiveFixtures = async () => {
      try {
        dispatch(fixturesActions.setLoadingFixtures(true));
        
        const response = await apiRequest('GET', '/api/fixtures/live');
        const data = await response.json();
        
        dispatch(fixturesActions.setLiveFixtures(data));
      } catch (error) {
        console.error('Error fetching live fixtures:', error);
        toast({
          title: 'Error',
          description: 'Failed to load live matches',
          variant: 'destructive',
        });
      } finally {
        dispatch(fixturesActions.setLoadingFixtures(false));
      }
    };
    
    fetchLiveFixtures();
    
    // Poll for live updates every 30 minutes (1,800,000 ms)
    const intervalId = setInterval(fetchLiveFixtures, 1800000);
    
    return () => clearInterval(intervalId);
  }, [dispatch, toast]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="bg-white">
        <div className="container mx-auto px-4 py-4">
          <Card className="overflow-hidden">
            <CardHeader className="p-3 bg-gray-700 text-white">
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-white mr-2" />
                <h3 className="text-sm font-semibold">Featured Match</h3>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4">
                <Skeleton className="h-6 w-64 mx-auto mb-4" />
                <div className="text-center mb-4">
                  <Skeleton className="h-6 w-32 mx-auto" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col items-center w-1/3">
                    <Skeleton className="h-16 w-16 rounded-full mb-2" />
                    <Skeleton className="h-5 w-20 mb-1" />
                  </div>
                  <div className="flex flex-col items-center w-1/3">
                    <Skeleton className="h-8 w-16 mb-3" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex flex-col items-center w-1/3">
                    <Skeleton className="h-16 w-16 rounded-full mb-2" />
                    <Skeleton className="h-5 w-20 mb-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Choose a fixture to display - either a live one or upcoming
  const featureFixture = liveFixtures.length > 0 
    ? liveFixtures[0] 
    : upcomingFixtures && upcomingFixtures.length > 0 
      ? upcomingFixtures[0] 
      : null;
  
  // No matches to display
  if (!featureFixture) {
    return (
      <div className="bg-white">
        <div className="container mx-auto px-4 py-4">
          <Card className="overflow-hidden">
            <CardHeader className="p-3 bg-gray-700 text-white">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-white mr-2" />
                <h3 className="text-sm font-semibold">Featured Match</h3>
              </div>
            </CardHeader>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-500">No matches available right now</p>
              <p className="text-xs text-gray-400 mt-1">Check back later for upcoming fixtures</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Featured match view
  const isLive = isLiveMatch(featureFixture.fixture.status.short);
  const matchDate = formatMatchDate(featureFixture.fixture.date);
  const matchTime = formatDateTime(featureFixture.fixture.date).split('|')[1].trim();
  const venue = featureFixture.fixture.venue.name || '';
  
  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-4">
        <Card className="overflow-hidden">
          <CardHeader className="p-2 bg-gray-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {/* League Logo */}
                <img 
                  src={featureFixture.league.logo} 
                  alt={featureFixture.league.name}
                  className="h-5 w-5 mr-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=L';
                  }}
                />
                
                {/* League Name */}
                <h3 className="text-xs font-semibold">{featureFixture.league.name} - {featureFixture.league.round}</h3>
                
                {/* Animated Country Flag */}
                {featureFixture.league.flag && (
                  <motion.div 
                    className="ml-2 flex items-center"
                    initial={{ y: 0 }}
                    animate={{ 
                      y: [0, -3, 0, -3, 0],
                      rotateZ: [0, -5, 0, 5, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 3,
                      ease: "easeInOut"
                    }}
                  >
                    <img 
                      src={featureFixture.league.flag}
                      alt={`${featureFixture.league.country} flag`}
                      className="h-4 w-6 rounded-sm shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </motion.div>
                )}
                
                {!featureFixture.league.flag && (
                  <motion.div 
                    className="ml-2 flex items-center"
                    initial={{ opacity: 0.7, scale: 1 }}
                    animate={{ 
                      opacity: [0.7, 1, 0.7],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2,
                      ease: "easeInOut"
                    }}
                  >
                    <Flag className="h-3 w-3 text-yellow-400" />
                  </motion.div>
                )}
              </div>
              <Badge 
                variant="outline" 
                className="text-xs border-white/30 text-white"
              >
                Featured Match
              </Badge>
            </div>
          </CardHeader>
          <div className="text-center p-2 font-medium text-lg border-b border-gray-100">
            {isLive ? 'LIVE' : matchDate}
          </div>
          <CardContent className="p-0">
            <div 
              className="cursor-pointer"
              onClick={() => navigate(`/match/${featureFixture.fixture.id}`)}
            >
              <div className="relative flex justify-between bg-gradient-to-r from-blue-800 via-blue-600 to-red-600 text-white p-4">
                {/* Left Team (Home) */}
                <div className="w-2/5 flex flex-col items-center">
                  <img 
                    src={featureFixture.teams.home.logo} 
                    alt={featureFixture.teams.home.name}
                    className="h-16 w-16 mb-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                    }}
                  />
                  <div className="font-bold text-sm text-center">{featureFixture.teams.home.name}</div>
                </div>
                
                {/* Center VS */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="flex items-center justify-center bg-white text-blue-900 font-bold text-lg rounded-full h-10 w-10 shadow-lg">
                    VS
                  </div>
                </div>
                
                {/* Right Team (Away) */}
                <div className="w-2/5 flex flex-col items-center">
                  <img 
                    src={featureFixture.teams.away.logo} 
                    alt={featureFixture.teams.away.name}
                    className="h-16 w-16 mb-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                    }}
                  />
                  <div className="font-bold text-sm text-center">{featureFixture.teams.away.name}</div>
                </div>
              </div>

              {/* Match Details & Intensity */}
              <div className="py-3 px-4 flex items-center justify-between border-b border-gray-100">
                <div className="text-xs text-gray-600">
                  {matchTime} {venue ? `| ${venue}` : ''}
                </div>
                
                <MatchIntensityIndicator 
                  intensity={isLive ? 75 : 50} 
                  isLive={isLive} 
                />
              </div>
              
              {/* Team Performance Charts */}
              <div className="flex justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="w-5/12">
                  <div className="text-xs font-medium mb-1 text-gray-700">Home Form</div>
                  <TeamPerformanceChart 
                    teamId={featureFixture.teams.home.id}
                    recentForm="W,W,D,L,W"
                    performance={70}
                  />
                </div>
                
                <div className="border-r border-gray-200"></div>
                
                <div className="w-5/12">
                  <div className="text-xs font-medium mb-1 text-gray-700">Away Form</div>
                  <TeamPerformanceChart 
                    teamId={featureFixture.teams.away.id}
                    recentForm="L,W,W,D,W"
                    performance={80}
                  />
                </div>
              </div>
              
              <div className="flex justify-around p-2 border-t border-gray-100">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs flex items-center text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/match/${featureFixture.fixture.id}`);
                  }}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Match Page
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs flex items-center text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/match/${featureFixture.fixture.id}/lineups`);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  Lineups
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs flex items-center text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/match/${featureFixture.fixture.id}/stats`);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Stats
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {liveFixtures.length > 1 && (
          <div className="mt-4 text-center">
            <Button 
              variant="link" 
              size="sm" 
              className="text-xs text-blue-600"
              onClick={() => navigate('/live')}
            >
              View all {liveFixtures.length} live matches
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveScoreboard;