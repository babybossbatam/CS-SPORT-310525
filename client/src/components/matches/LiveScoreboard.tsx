import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, fixturesActions } from '@/lib/store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Activity, ChevronRight, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { formatElapsedTime, isLiveMatch } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const LiveScoreboard = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const { live: liveFixtures, loading } = useSelector((state: RootState) => state.fixtures);
  
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
    
    // Poll for live updates every 60 seconds
    const intervalId = setInterval(fetchLiveFixtures, 60000);
    
    return () => clearInterval(intervalId);
  }, [dispatch, toast]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="bg-white">
        <div className="container mx-auto px-4 py-4">
          <Card>
            <CardHeader className="p-3 border-b border-neutral-200">
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-red-500 mr-2" />
                <h3 className="text-sm font-semibold">Live Matches</h3>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-3 border-b border-neutral-200">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col w-1/3">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex items-center justify-center space-x-2 w-1/3">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-5 w-10" />
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                    <div className="flex flex-col items-end w-1/3">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // No live matches
  if (liveFixtures.length === 0) {
    return (
      <div className="bg-white">
        <div className="container mx-auto px-4 py-4">
          <Card>
            <CardHeader className="p-3 border-b border-neutral-200">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-neutral-500 mr-2" />
                <h3 className="text-sm font-semibold">Live Matches</h3>
              </div>
            </CardHeader>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-500">No live matches right now</p>
              <p className="text-xs text-gray-400 mt-1">Check back later for live score updates</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Live matches view
  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-4">
        <Card>
          <CardHeader className="p-3 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-red-500 mr-2" />
                <h3 className="text-sm font-semibold">Live Matches</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs flex items-center text-neutral-500"
                onClick={() => navigate('/live')}
              >
                See all
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {liveFixtures.slice(0, 5).map((fixture) => (
              <div 
                key={fixture.fixture.id} 
                className="p-3 border-b border-neutral-200 cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/match/${fixture.fixture.id}`)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex flex-col w-1/3">
                    <span className="text-xs text-neutral-500">{fixture.league.name}</span>
                    <span className="text-sm font-medium truncate">{fixture.teams.home.name}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 w-1/3">
                    <img 
                      src={fixture.teams.home.logo} 
                      alt={fixture.teams.home.name}
                      className="h-5 w-5"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=T';
                      }}
                    />
                    <div className="flex flex-col items-center">
                      <div className="flex items-center">
                        <span className="font-bold text-sm">
                          {fixture.goals.home} - {fixture.goals.away}
                        </span>
                      </div>
                      <Badge variant="default" className="px-1 py-0 text-[10px] h-4 bg-red-500 text-white">
                        {formatElapsedTime(fixture.fixture.status.elapsed, null)}
                      </Badge>
                    </div>
                    <img 
                      src={fixture.teams.away.logo} 
                      alt={fixture.teams.away.name}
                      className="h-5 w-5"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=T';
                      }}
                    />
                  </div>
                  <div className="flex flex-col items-end w-1/3">
                    <span className="text-xs text-neutral-500">{fixture.league.round}</span>
                    <span className="text-sm font-medium truncate">{fixture.teams.away.name}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {liveFixtures.length > 5 && (
              <div className="p-2 text-center">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveScoreboard;