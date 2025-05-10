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
  
  // Get popular leagues IDs from the store now that we've expanded the list
  const popularLeagueIds = useSelector((state: RootState) => state.leagues.popularLeagues);
  
  // Function to get matches to display in the list
  const getMatchesToDisplay = () => {
    // Use fixtures for today by default
    let matches = [...fixturesByDate];
    
    // If we're in live mode and have live matches, show only live matches
    if (selectedFilter === 'live' && liveFixtures.length > 0) {
      matches = [...liveFixtures];
    }
    // If no matches for today or we want more variety, add upcoming fixtures
    else if (fixturesByDate.length < 10 && upcomingFixtures.length > 0) {
      matches = [...fixturesByDate, ...upcomingFixtures.slice(0, 20 - fixturesByDate.length)];
    }
    
    // Filter matches to only include popular leagues - IF we have enough matches
    // If we don't have many matches, show all available regardless of league
    if (matches.length > 15) {
      matches = matches.filter(match => popularLeagueIds.includes(match.league.id));
    }
    
    // Sort by status first (live matches first), then by time
    return matches.sort((a, b) => {
      // Live matches first
      if (a.fixture.status.short === 'LIVE' && b.fixture.status.short !== 'LIVE') return -1;
      if (a.fixture.status.short !== 'LIVE' && b.fixture.status.short === 'LIVE') return 1;
      
      // Finished matches next, sorted by most recent
      const aFinished = ['FT', 'AET', 'PEN'].includes(a.fixture.status.short);
      const bFinished = ['FT', 'AET', 'PEN'].includes(b.fixture.status.short);
      if (aFinished && !bFinished) return -1;
      if (!aFinished && bFinished) return 1;
      if (aFinished && bFinished) {
        // Most recent finished match first
        return new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime();
      }
      
      // Finally sort upcoming matches by time (soonest first)
      const timeA = new Date(a.fixture.date).getTime();
      const timeB = new Date(b.fixture.date).getTime();
      return timeA - timeB;
    }).slice(0, 20); // Show more matches for better coverage
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
      
      {/* Match list in horizontal scrolling format with league badges */}
      <div className="py-2 overflow-x-auto">
        {loading ? (
          // Loading state
          <div className="space-y-4 p-4">
            {[...Array(3)].map((_, i) => (
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
          // 365scores-style match list with horizontal scrolling section
          <div className="px-4 pb-2">
            {/* Group matches by league */}
            {Object.entries(
              matchesToDisplay.reduce((acc, match) => {
                const leagueId = match.league.id.toString();
                if (!acc[leagueId]) {
                  acc[leagueId] = {
                    league: match.league,
                    matches: []
                  };
                }
                acc[leagueId].matches.push(match);
                return acc;
              }, {} as Record<string, { league: any, matches: typeof matchesToDisplay }>)
            ).map(([leagueId, { league, matches }]) => (
              <div key={leagueId} className="mb-6 last:mb-2">
                {/* League header */}
                <div className="flex items-center gap-2 mb-3">
                  <img 
                    src={league.logo} 
                    alt={league.name} 
                    className="h-5 w-5 object-contain" 
                  />
                  <span className="text-xs font-semibold text-gray-700">
                    {league.name}
                  </span>
                </div>
                
                {/* Matches for this league */}
                <div className="space-y-3">
                  {matches.map((match) => (
                    <div key={match.fixture.id} className="bg-gray-50 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                      {/* Match status indicator */}
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          {match.fixture.status.short === 'LIVE' && (
                            <Badge className="bg-red-500 text-[10px] px-1.5 mr-1.5">LIVE</Badge>
                          )}
                          <span className="text-xs font-medium">
                            {match.fixture.status.short === 'FT' ? 'Full Time' : 
                             match.fixture.status.short === 'AET' ? 'After Extra Time' :
                             match.fixture.status.short === 'PEN' ? 'Penalties' :
                             match.fixture.status.short === 'HT' ? 'Half Time' :
                             match.fixture.status.short === 'LIVE' ? 
                               `${match.fixture.status.elapsed}'` : 
                             format(new Date(match.fixture.date), 'HH:mm')}
                          </span>
                        </div>
                        
                        {/* Match venue or round info if available */}
                        {match.fixture.venue.name && (
                          <span className="text-[10px] text-gray-500">
                            {match.fixture.venue.name}
                          </span>
                        )}
                      </div>

                      {/* Main match display with team colors */}
                      <div className="flex justify-between items-center">
                        {/* Home team */}
                        <div className="flex items-center gap-2 w-[40%]">
                          <div className="relative">
                            <img 
                              src={match.teams.home.logo} 
                              alt={match.teams.home.name} 
                              className="h-8 w-8 object-contain drop-shadow-md" 
                            />
                            {match.teams.home.winner === true && (
                              <div className="absolute -right-1 -bottom-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <span className="font-medium text-sm truncate">
                            {match.teams.home.name}
                          </span>
                        </div>
                        
                        {/* Score/time */}
                        <div className="font-bold text-base mx-2 min-w-[60px] text-center">
                          {match.fixture.status.short === 'FT' || 
                           match.fixture.status.short === 'AET' || 
                           match.fixture.status.short === 'PEN' || 
                           match.fixture.status.short === 'LIVE' || 
                           match.fixture.status.short === 'HT' ? (
                            <span className="text-center">
                              {match.goals.home} - {match.goals.away}
                            </span>
                          ) : (
                            <span className="font-normal text-gray-500">vs</span>
                          )}
                        </div>
                        
                        {/* Away team */}
                        <div className="flex items-center justify-end gap-2 w-[40%]">
                          <span className="font-medium text-sm truncate text-right">
                            {match.teams.away.name}
                          </span>
                          <div className="relative">
                            <img 
                              src={match.teams.away.logo} 
                              alt={match.teams.away.name} 
                              className="h-8 w-8 object-contain drop-shadow-md" 
                            />
                            {match.teams.away.winner === true && (
                              <div className="absolute -right-1 -bottom-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
