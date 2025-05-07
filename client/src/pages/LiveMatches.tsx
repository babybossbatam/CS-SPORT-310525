import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, fixturesActions } from '@/lib/store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Activity } from 'lucide-react';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import { apiRequest } from '@/lib/queryClient';
import { formatElapsedTime } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const LiveMatches = () => {
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
    
    // Poll for live updates every 30 minutes (1,800,000 ms)
    const intervalId = setInterval(fetchLiveFixtures, 1800000);
    
    return () => clearInterval(intervalId);
  }, [dispatch, toast]);
  
  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader 
        title="Live Matches" 
        icon={<Activity className="h-4 w-4 text-red-500" />} 
      />
      
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
            <h2 className="text-lg font-semibold">Live Scores</h2>
            <div className="w-10"></div> {/* Spacer for layout balance */}
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              // Loading state
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="p-3 border-b border-neutral-200">
                  <div className="flex items-center text-sm mb-1">
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3 w-5/12">
                      <div className="text-right w-full">
                        <Skeleton className="h-4 w-24 ml-auto" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <div className="flex items-center justify-center space-x-2 w-2/12">
                      <Skeleton className="h-6 w-12" />
                    </div>
                    <div className="flex items-center space-x-3 w-5/12">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="w-full">
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : liveFixtures.length > 0 ? (
              // Display live matches
              liveFixtures.map((fixture) => (
                <div 
                  key={fixture.fixture.id} 
                  className="p-3 border-b border-neutral-200 cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/match/${fixture.fixture.id}`)}
                >
                  <div className="flex items-center text-sm mb-1">
                    <span className="text-xs bg-red-500 text-white px-1 rounded mr-2">LIVE</span>
                    <span className="text-xs text-neutral-500 mr-2">
                      {fixture.league.name}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {fixture.league.round || ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3 w-5/12">
                      <div className="text-right w-full">
                        <span className="font-medium">{fixture.teams.home.name}</span>
                      </div>
                      <img 
                        src={fixture.teams.home.logo} 
                        alt={fixture.teams.home.name} 
                        className="h-8 w-8"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=Team';
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-center justify-center w-2/12">
                      <span className="font-bold text-lg">
                        {fixture.goals.home !== null ? fixture.goals.home : '-'} - {fixture.goals.away !== null ? fixture.goals.away : '-'}
                      </span>
                      <Badge variant="default" className="px-1 py-0 text-[10px] h-4 bg-red-500 text-white mt-1">
                        {formatElapsedTime(fixture.fixture.status.elapsed, null)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-3 w-5/12">
                      <img 
                        src={fixture.teams.away.logo} 
                        alt={fixture.teams.away.name} 
                        className="h-8 w-8"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=Team';
                        }}
                      />
                      <div className="w-full">
                        <span className="font-medium">{fixture.teams.away.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // No live matches available
              <div className="p-8 text-center">
                <Activity className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <h3 className="text-lg font-medium text-gray-700">No Live Matches</h3>
                <p className="text-sm text-gray-500 mb-4">
                  There are no matches currently in play. Check back later for live score updates.
                </p>
                <Button onClick={() => navigate('/')}>
                  Back to Home
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default LiveMatches;