import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, fixturesActions } from '@/lib/store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Activity, ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { formatElapsedTime, isLiveMatch, formatDateTime, formatMatchDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
              <div className="flex items-center justify-center w-full">
                <div className="flex items-center">
                  <img 
                    src={featureFixture.league.logo} 
                    alt={featureFixture.league.name}
                    className="h-5 w-5 mr-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=L';
                    }}
                  />
                  <h3 className="text-xs font-semibold">{featureFixture.league.name} - {featureFixture.league.round}</h3>
                </div>
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
              <div className="flex bg-gradient-to-r from-blue-800 via-blue-600 to-red-600 text-white">
                <div className="w-1/2 bg-blue-800 p-4 flex items-center justify-between">
                  <div className="flex-grow text-right mr-3">
                    <div className="font-bold text-lg">{featureFixture.teams.home.name}</div>
                  </div>
                  <img 
                    src={featureFixture.teams.home.logo} 
                    alt={featureFixture.teams.home.name}
                    className="h-12 w-12"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=Team';
                    }}
                  />
                </div>
                <div className="flex items-center justify-center text-xl font-bold mx-2">VS</div>
                <div className="w-1/2 bg-red-600 p-4 flex items-center justify-between">
                  <img 
                    src={featureFixture.teams.away.logo} 
                    alt={featureFixture.teams.away.name}
                    className="h-12 w-12"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=Team';
                    }}
                  />
                  <div className="flex-grow ml-3">
                    <div className="font-bold text-lg">{featureFixture.teams.away.name}</div>
                  </div>
                </div>
              </div>

              <div className="text-center p-2 text-sm text-gray-600">
                {matchTime} {venue ? `| ${venue}` : ''}
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