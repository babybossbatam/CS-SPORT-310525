import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, uiActions, fixturesActions } from '@/lib/store';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format, isSameDay } from 'date-fns';
import { useLocation } from 'wouter';
import { shouldExcludeFixture } from '@/lib/exclusionFilters';

const MatchFilters = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Mark the component as mounted after it's been rendered
    setMounted(true);
    
    // Clear the mounted state when the component unmounts
    return () => setMounted(false);
  }, []);
  
  const selectedFilter = useSelector((state: RootState) => state.ui.selectedFilter);
  const liveFixtures = useSelector((state: RootState) => state.fixtures.live);
  const loading = useSelector((state: RootState) => state.fixtures.loading);
  
  // Get fixtures by date for the selected date
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const fixturesByDate = useSelector((state: RootState) => 
    state.fixtures.byDate[selectedDate] || []
  );
  const byDate = useSelector((state: RootState) => state.fixtures.byDate);
  
  // Get upcoming fixtures for display
  const upcomingFixtures = useSelector((state: RootState) => state.fixtures.upcoming);
  
  // Fetch fixtures for selected date
  useEffect(() => {
    const fetchFixturesByDate = async () => {
      try {
        // Always set loading state when changing date
        dispatch(fixturesActions.setLoadingFixtures(true));
        
        // Check if we already have data for this date
        const existingFixtures = byDate[selectedDate];
        if (existingFixtures && existingFixtures.length > 0) {
          console.log(`Using ${existingFixtures.length} cached fixtures for date ${selectedDate}`);
          // We still make an API call to refresh in the background, but don't wait for it
          setTimeout(() => {
            apiRequest('GET', `/api/fixtures/date/${selectedDate}`)
              .then(response => response.json())
              .then(data => {
                if (data && data.length > 0) {
                  dispatch(fixturesActions.setFixturesByDate({ date: selectedDate, fixtures: data }));
                }
              })
              .catch(err => console.error('Background refresh error:', err));
          }, 100);
          
          // Keep showing existing data immediately
          dispatch(fixturesActions.setLoadingFixtures(false));
          return;
        }
        
        // Always fetch fresh data when date changes or we don't have data
        const response = await apiRequest('GET', `/api/fixtures/date/${selectedDate}`);
        const data = await response.json();
        
        dispatch(fixturesActions.setFixturesByDate({ date: selectedDate, fixtures: data }));
      } catch (error) {
        console.error('Error fetching fixtures by date:', error);
        // Don't show toast on every error as it might be rate limiting
        // Only show toast if we don't have any data at all for this date
        if (!byDate[selectedDate] || byDate[selectedDate].length === 0) {
          toast({
            title: 'Error',
            description: 'Failed to load matches for selected date',
            variant: 'destructive',
          });
        }
      } finally {
        // Always clear loading state when done
        dispatch(fixturesActions.setLoadingFixtures(false));
      }
    };
    
    fetchFixturesByDate();
  }, [selectedDate, dispatch, toast, byDate]);

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
      
      // Poll for live updates every 30 minutes (1,800,000 ms)
      const intervalId = setInterval(fetchLiveFixtures, 1800000);
      
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
    // Initialize with an empty array instead of undefined to prevent flickering
    // Always work with a copy to avoid mutation issues
    let matches = fixturesByDate ? [...fixturesByDate] : [];
    
    console.log(`Getting matches to display: ${matches.length} for date ${selectedDate}`);
    
    // If we're in live mode and have live matches, show only live matches
    if (selectedFilter === 'live' && liveFixtures && liveFixtures.length > 0) {
      console.log(`Using ${liveFixtures.length} live matches`);
      matches = [...liveFixtures];
    }
    // If no matches for the selected date but we're loading, use a transition state
    else if ((matches.length === 0 || !matches) && loading) {
      console.log("No matches for selected date but loading, using transition state");
      
      // Create an array from all fixtures we have in different dates
      let previousDateFixtures: any[] = [];
      
      // Safely collect fixtures from other dates
      if (byDate && typeof byDate === 'object') {
        Object.entries(byDate).forEach(([date, fixtures]) => {
          if (Array.isArray(fixtures) && fixtures.length > 0 && date !== selectedDate) {
            console.log(`Found ${fixtures.length} fixtures for date ${date}`);
            previousDateFixtures = [...previousDateFixtures, ...fixtures];
          }
        });
      }
      
      // Use previous fixtures to prevent flickering
      if (previousDateFixtures.length > 0) {
        console.log(`Using ${Math.min(previousDateFixtures.length, 20)} previous fixtures to prevent flickering`);
        matches = [...previousDateFixtures.slice(0, 20)];
      }
    }
    // If no or few matches and we have upcoming fixtures, supplement with those
    else if (matches.length < 10 && upcomingFixtures && upcomingFixtures.length > 0) {
      // Add some upcoming fixtures to ensure we have content
      console.log(`Adding ${Math.min(upcomingFixtures.length, 20 - matches.length)} upcoming fixtures`);
      matches = [...matches, ...upcomingFixtures.slice(0, 20 - matches.length)];
    }
    
    // When matches is empty, show a loading indicator or message in the UI
    // But always return a valid array even if empty to prevent rendering errors
    
    console.log(`Before filtering: ${matches.length} matches, popular leagues: ${popularLeagueIds}`);
    
    // DEBUG: Print first few matches to check league IDs
    if (matches.length > 0) {
      console.log("Sample matches with league IDs:");
      for (let i = 0; i < Math.min(5, matches.length); i++) {
        if (matches[i] && matches[i].league) {
          console.log(`Match ${i}: League ID ${matches[i].league.id} (${typeof matches[i].league.id}), Name: ${matches[i].league.name}`);
        }
      }
    }
    
    // Convert league IDs to strings for comparison since some APIs might return them as strings
    const popularLeagueIdsArray = popularLeagueIds.map(id => id.toString());
    
    // Log popular leagues for debugging
    console.log("Popular league IDs:", popularLeagueIdsArray);
    
    // First, filter out youth and lower division matches using our exclusion filter
    const excludedMatches = matches.filter(match => {
      if (!match || !match.league || !match.teams) return false;
      
      const leagueName = match.league.name || '';
      const homeTeamName = match.teams.home.name || '';
      const awayTeamName = match.teams.away.name || '';
      
      return !shouldExcludeFixture(leagueName, homeTeamName, awayTeamName);
    });
    
    console.log(`After exclusion filter: ${excludedMatches.length} matches remain`);
    
    // Now, be less restrictive in identifying popular leagues by using multiple criteria
    const filteredMatches = excludedMatches.filter(match => {
      if (!match.league) return false;
      
      // Check by ID - most reliable method
      const leagueIdStr = String(match.league.id);
      
      // Debug any potential league ID matches
      if (popularLeagueIdsArray.includes(leagueIdStr)) {
        console.log(`Found popular league match: ${match.league.name} (ID: ${leagueIdStr})`);
        return true;
      }
      
      // Extended check by league name
      const leagueName = (match.league.name || '').toLowerCase();
      const popularNames = [
        'premier', 'bundesliga', 'la liga', 'serie a', 'ligue 1', 'champions league', 
        'europa', 'uefa', 'world cup', 'euro', 'copa del rey', 'fa cup', 'copa america',
        'mls', 'eredivisie', 'primeira liga', 'championship', 'super league', 'pro league'
      ];
      
      // Check by country
      const country = (match.league.country || '').toLowerCase();
      const popularCountries = [
        'england', 'spain', 'italy', 'germany', 'france', 'netherlands', 
        'portugal', 'belgium', 'saudi arabia', 'usa', 'brazil', 'argentina'
      ];
      
      // More lenient check allowing major leagues without strict country restrictions
      if (popularNames.some(name => leagueName.includes(name))) {
        console.log(`Found popular league by name: ${match.league.name} (Country: ${match.league.country})`);
        return true;
      }
      
      return false;
    });
    
    // Use filtered matches if we have enough, otherwise prioritize them but include some others
    if (filteredMatches.length >= 10) {
      console.log(`After filtering: ${filteredMatches.length} matches in popular leagues`);
      matches = filteredMatches;
    } else if (filteredMatches.length > 0) {
      console.log(`Few matches in popular leagues (${filteredMatches.length}), prioritizing them`);
      // Use all popular matches, then add other matches up to 20 total
      const otherMatches = matches
        .filter(match => !filteredMatches.includes(match))
        .slice(0, 20 - filteredMatches.length);
      matches = [...filteredMatches, ...otherMatches];
    } else {
      console.log(`No matches in popular leagues, showing top 20 matches from ${matches.length} total`);
      // If no popular matches, just take first 20
      matches = matches.slice(0, 20);
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
  
  // Get the matches to display in the list, with error handling
  const matchesToDisplay = (() => {
    try {
      return getMatchesToDisplay();
    } catch (error) {
      console.error("Error getting matches to display:", error);
      return []; // Return empty array on error instead of breaking the component
    }
  })();
  
  // Determine if we should show the component based on our current location
  // Prevent flickering by checking if we're mounted and not in transition between pages
  const shouldShowComponent = mounted;
  
  // Early return when we're navigating between pages or not yet mounted
  if (!shouldShowComponent) {
    return null;
  }
  
  // Log to help debug what we're actually displaying
  console.log(`Displaying ${matchesToDisplay.length} matches for date ${selectedDate}`);
  console.log(`Filter: ${selectedFilter}, Loading: ${loading}`);
  
  
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
      
      {/* Match list with Popular Leagues card at the top */}
      <div className="overflow-y-auto max-h-[700px]">
        {loading ? (
          // Loading state
          <div className="space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-2">
                <div className="flex items-center gap-2 w-[40%]">
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-10"></div>
                <div className="flex items-center gap-2 w-[40%] justify-end">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : matchesToDisplay.length > 0 ? (
          // New layout with Popular Leagues card at the top
          <div className="w-full">
            {/* Popular Leagues Card - added based on user's image */}
            <div className="bg-white rounded-lg mb-4 shadow-sm">
              <div className="px-3 py-2 border-b border-gray-100">
                <span className="text-sm font-bold">Popular Leagues</span>
              </div>
              <div className="p-2">
                <ul className="space-y-2">
                  {/* Popular Leagues items with click handlers */}
                  {[
                    { id: 2, name: 'UEFA Champions League', country: 'Europe' },
                    { id: 3, name: 'UEFA Europa League', country: 'Europe' },
                    { id: 39, name: 'Premier League', country: 'England' },
                    { id: 45, name: 'FA Cup', country: 'England' },
                    { id: 140, name: 'La Liga', country: 'Spain' },
                    { id: 135, name: 'Serie A', country: 'Italy' },
                    { id: 78, name: 'Bundesliga', country: 'Germany' },
                    { id: 207, name: 'EFL Cup', country: 'England' },
                    { id: 219, name: 'Community Shield', country: 'England' },
                    { id: 203, name: 'Championship', country: 'England' }
                  ].map((league) => (
                    <li 
                      key={league.id}
                      className="flex items-center py-1.5 px-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => {
                        // Dispatch action to set selected league
                        dispatch(uiActions.setSelectedLeague(league.id));
                        
                        // Navigate to league page
                        setLocation(`/leagues/${league.id}`);
                        
                        // Announce the change for screen readers
                        toast({
                          title: `Navigating to ${league.name}`,
                          description: "Loading league information...",
                          duration: 2000
                        });
                      }}
                    >
                      <div className="w-6 h-6 mr-2 flex items-center justify-center">
                        <img 
                          src={`https://media.api-sports.io/football/leagues/${league.id}.png`} 
                          alt={league.name} 
                          className="w-5 h-5"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://static.livescore.com/i/competition/default.png';
                          }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{league.name}</span>
                        <span className="text-xs text-gray-400">{league.country}</span>
                      </div>
                      <div className="ml-auto text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        ) : (
          // Empty state with helpful message
          <div className="text-center py-8 px-4 text-sm text-gray-500">
            <p className="mb-2">No matches available for the selected date.</p>
            <p>Try selecting a different date or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchFilters;
