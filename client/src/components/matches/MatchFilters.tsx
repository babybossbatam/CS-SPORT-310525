import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, uiActions, fixturesActions } from '@/lib/store';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const MatchFilters = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const selectedFilter = useSelector((state: RootState) => state.ui.selectedFilter);
  const liveFixtures = useSelector((state: RootState) => state.fixtures.live);
  
  // Fetch live fixtures
  useEffect(() => {
    if (selectedFilter === 'live') {
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
    }
  }, [selectedFilter, dispatch, toast]);
  
  // Toggle live filter
  const toggleLiveFilter = () => {
    dispatch(uiActions.setSelectedFilter(
      selectedFilter === 'live' ? 'all' : 'live'
    ));
  };
  
  // Toggle time filter
  const toggleTimeFilter = () => {
    dispatch(uiActions.setSelectedFilter(
      selectedFilter === 'time' ? 'all' : 'time'
    ));
  };
  
  // Check if there are live matches
  const hasLiveMatches = liveFixtures.length > 0;
  
  return (
    <div className="bg-white border-b border-neutral-200">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          <Button
            variant={selectedFilter === 'live' ? 'default' : 'outline'}
            size="sm"
            className={`px-2 py-1 rounded-md text-xs flex items-center ${
              selectedFilter === 'live' 
                ? 'bg-[#48BB78] text-white hover:bg-[#38A169]' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={toggleLiveFilter}
            disabled={!hasLiveMatches && selectedFilter !== 'live'}
          >
            {selectedFilter === 'live' && (
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
            )}
            <span className={selectedFilter === 'live' ? 'text-white' : 'text-gray-700'}>
              LIVE {hasLiveMatches && `(${liveFixtures.length})`}
            </span>
          </Button>
          
          <Button
            variant={selectedFilter === 'time' ? 'default' : 'outline'}
            size="sm"
            className={`px-2 py-1 rounded-md text-xs flex items-center space-x-1 ${
              selectedFilter === 'time' 
                ? 'bg-gray-700 text-white hover:bg-gray-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={toggleTimeFilter}
          >
            <Clock className="h-3 w-3 mr-1" />
            <span>by time</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MatchFilters;
