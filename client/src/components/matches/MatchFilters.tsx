import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, uiActions, fixturesActions } from '@/lib/store';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const MatchFilters = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const selectedFilter = useSelector((state: RootState) => state.ui.selectedFilter);
  const liveFixtures = useSelector((state: RootState) => state.fixtures.live);
  const isLoading = useSelector((state: RootState) => state.fixtures.isLoading);
  
  // Get fixtures by date for the selected date
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const fixturesByDate = useSelector((state: RootState) => 
    state.fixtures.byDate[selectedDate] || []
  );
  
  // Get upcoming fixtures for display
  const upcomingFixtures = useSelector((state: RootState) => state.fixtures.upcoming);
  
  // Fetch fixtures for selected date
  useEffect(() => {
    const fetchFixturesByDate = async () => {
      try {
        if (!fixturesByDate.length) {
          dispatch(fixturesActions.setLoadingFixtures(true));
          
          const response = await apiRequest('GET', `/api/fixtures/date/${selectedDate}`);
          const data = await response.json();
          
          dispatch(fixturesActions.setFixturesByDate({ date: selectedDate, fixtures: data }));
        }
      } catch (error) {
        console.error('Error fetching fixtures by date:', error);
        toast({
          title: 'Error',
          description: 'Failed to load matches for selected date',
          variant: 'destructive',
        });
      } finally {
        dispatch(fixturesActions.setLoadingFixtures(false));
      }
    };
    
    fetchFixturesByDate();
  }, [selectedDate, dispatch, toast, fixturesByDate.length]);

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
  
  // Function to get matches to display in the list
  const getMatchesToDisplay = () => {
    // Use fixtures for today by default
    let matches = [...fixturesByDate];
    
    // If we're in live mode and have live matches, show only live matches
    if (selectedFilter === 'live' && liveFixtures.length > 0) {
      matches = [...liveFixtures];
    }
    // If no matches for today or we want more variety, add upcoming fixtures
    else if (fixturesByDate.length < 5 && upcomingFixtures.length > 0) {
      matches = [...fixturesByDate, ...upcomingFixtures.slice(0, 14 - fixturesByDate.length)];
    }
    
    // Sort by time
    return matches.sort((a, b) => {
      const timeA = new Date(a.fixture.date).getTime();
      const timeB = new Date(b.fixture.date).getTime();
      return timeA - timeB;
    }).slice(0, 14); // Limit to 14 matches as requested
  };
  
  // Get the matches to display in the list
  const matchesToDisplay = getMatchesToDisplay();
  
  return (
    <div>
      <div className="px-3 py-2">
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
      
      {/* Match list - Added as requested */}
      <div className="border-t border-gray-100">
        <div className="px-3 py-2 space-y-3">
          {isLoading ? (
            // Loading state
            <div className="py-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 animate-pulse">
                  <div className="flex-1 text-right pr-2">
                    <div className="h-4 bg-gray-200 rounded w-24 ml-auto"></div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-10 bg-gray-200 rounded"></div>
                    <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                  </div>
                  
                  <div className="flex-1 text-left pl-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : matchesToDisplay.length > 0 ? (
            // Match list
            matchesToDisplay.map((match) => (
              <div key={match.fixture.id} className="flex justify-between items-center py-1.5">
                <div className="flex-1 text-right pr-2">
                  <span className="text-sm font-medium truncate max-w-[120px] inline-block">{match.teams.home.name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <img src={match.teams.home.logo} alt={match.teams.home.name} className="h-5 w-5 object-contain" />
                  <div className="text-sm font-medium">
                    {match.fixture.status.short === 'LIVE' ? (
                      <span className="text-[#48BB78]">{match.fixture.status.elapsed}'</span>
                    ) : (
                      format(new Date(match.fixture.date), 'HH:mm')
                    )}
                  </div>
                  <img src={match.teams.away.logo} alt={match.teams.away.name} className="h-5 w-5 object-contain" />
                </div>
                
                <div className="flex-1 text-left pl-2">
                  <span className="text-sm font-medium truncate max-w-[120px] inline-block">{match.teams.away.name}</span>
                </div>
              </div>
            ))
          ) : (
            // Empty state
            <div className="text-center py-4 text-sm text-gray-500">
              No matches available for the selected filter
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchFilters;
