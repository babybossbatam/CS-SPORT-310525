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
  const loading = useSelector((state: RootState) => state.fixtures.loading);
  
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
  
  // Popular leagues IDs
  const popularLeagueIds = [2, 39, 135, 3, 78]; // Champions League, Premier League, Serie A, Europa League, Bundesliga
  
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
    
    // Filter matches to only include popular leagues
    matches = matches.filter(match => popularLeagueIds.includes(match.league.id));
    
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
    <div className="bg-white shadow-sm rounded-lg">
      <div className="flex justify-between items-center p-4 border-b">
        <Button
          variant={selectedFilter === 'live' ? 'default' : 'outline'}
          size="sm"
          className={`rounded-full text-xs px-3 py-1 ${
            selectedFilter === 'live' 
              ? 'bg-[#48BB78] text-white hover:bg-[#38A169]' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={toggleLiveFilter}
        >
          {selectedFilter === 'live' && (
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
          )}
          <span>LIVE</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-xs px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1"
          onClick={toggleTimeFilter}
        >
          <Clock className="h-3 w-3" />
          <span>by time</span>
        </Button>
      </div>
      
      {/* Match list in horizontal format */}
      <div className="py-2">
        {loading ? (
          // Loading state
          <div className="space-y-4 p-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col space-y-2">
                <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-10"></div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : matchesToDisplay.length > 0 ? (
          // Match list
          <div className="divide-y">
            {matchesToDisplay.map((match) => (
              <div key={match.fixture.id} className="px-4 py-3">
                {/* Status indicator at the top */}
                <div className="text-xs text-gray-500 text-center mb-1">
                  {match.fixture.status.short === 'FT' ? 'Ended' : 
                   match.fixture.status.short === 'AET' ? 'Ended' :
                   match.fixture.status.short === 'PEN' ? 'Ended' :
                   match.fixture.status.short === 'LIVE' ? 'LIVE' : 
                   format(new Date(match.fixture.date), 'HH:mm')}
                </div>
                
                <div className="flex flex-col">
                  {/* Main match display */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <img src={match.teams.home.logo} alt={match.teams.home.name} className="h-8 w-8 object-contain" />
                      <span className="font-medium">{match.teams.home.name}</span>
                    </div>
                    
                    <div className="font-bold text-base mx-2">
                      {match.fixture.status.short === 'FT' || match.fixture.status.short === 'AET' || match.fixture.status.short === 'PEN' || match.fixture.status.short === 'LIVE' ? (
                        <span>{match.goals.home}-{match.goals.away}</span>
                      ) : (
                        <span className="font-normal text-gray-500">vs</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{match.teams.away.name}</span>
                      <img src={match.teams.away.logo} alt={match.teams.away.name} className="h-8 w-8 object-contain" />
                    </div>
                  </div>
                  
                  {/* Extra time or penalties indicator */}
                  {(match.fixture.status.short === 'AET' || match.fixture.status.short === 'PEN') && (
                    <div className="text-xs text-center text-gray-500 mt-1">
                      {match.fixture.status.short === 'AET' ? 'After Extra Time' : 'Penalties'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-6 text-sm text-gray-500">
            No matches available for the selected filter
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchFilters;
