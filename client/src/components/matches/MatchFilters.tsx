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
    
    // Always filter to include popular leagues - even if we don't have many matches
    // Convert league IDs to strings for comparison since some APIs might return them as strings
    const popularLeagueIdsSet = new Set(popularLeagueIds.map(id => id.toString()));
    
    // Explicitly exclude youth leagues and lower divisions
    const excludedMatches = matches.filter(match => {
      if (!match || !match.league || !match.teams) return false;
      
      const leagueName = match.league.name || '';
      const homeTeamName = match.teams.home.name || '';
      const awayTeamName = match.teams.away.name || '';
      
      // Use our centralized exclusion filter function that also excludes South American leagues
      return !shouldExcludeFixture(leagueName, homeTeamName, awayTeamName);
    });
    
    // From the non-excluded matches, filter for popular leagues
    const filteredMatches = excludedMatches.filter(match => {
      const leagueIdStr = match.league.id.toString();
      if (popularLeagueIdsSet.has(leagueIdStr)) return true;
      
      // Check if league name contains common popular league names
      const leagueName = match.league.name ? match.league.name.toLowerCase() : '';
      const popularNames = [
        'premier', 'bundesliga', 'la liga', 'serie a', 'ligue 1', 'champions league', 
        'europa', 'uefa', 'world cup', 'euro', 'copa del rey', 'fa cup', 'copa america',
        'mls', 'eredivisie', 'primeira liga', 'championship', 'super league', 'pro league'
      ];
      
      // Check for country name of major football countries
      const country = match.league.country ? match.league.country.toLowerCase() : '';
      const popularCountries = [
        'england', 'spain', 'italy', 'germany', 'france', 'netherlands', 
        'portugal', 'belgium', 'saudi arabia', 'usa', 'brazil', 'argentina'
      ];
      
      // Extra check: popular leagues must be from popular countries
      return (popularNames.some(name => leagueName.includes(name)) && 
             popularCountries.some(name => country.includes(name))) ||
             (popularCountries.includes(country) && leagueName.includes('league 1'));
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
      
      {/* Match list in vertical compact format exactly like 365scores */}
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
          // New simplified 365scores style popular leagues list
          <div className="w-full">
            {/* Popular Football Leagues Header */}
            <div className="px-3 py-2 flex items-center border-b border-gray-100">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#40A2D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    <path d="M2 12h20"></path>
                  </svg>
                </div>
                <span className="text-sm font-medium">Popular Football Leagues</span>
              </div>
            </div>
            
            {/* Show matches with more lenient filter - similar to 365scores.com approach */}
            {Object.entries(
              // Create league-grouped matches directly without additional filtering - this was the problem
              // We're using all available matches now to ensure we show results
              fixturesByDate.reduce((acc, match) => {
                // Skip if match is missing key properties
                if (!match || !match.league || !match.teams) return acc;
                
                const leagueId = match.league.id.toString();
                if (!acc[leagueId]) {
                  acc[leagueId] = {
                    league: match.league,
                    matches: [],
                    isPopular: popularLeagueIds.includes(match.league.id)
                  };
                }
                acc[leagueId].matches.push(match);
                return acc;
              }, {} as Record<string, { league: any, matches: typeof matchesToDisplay, isPopular: boolean }>)
            )
            // Sort to show popular leagues first
            .sort(([_, a], [__, b]) => a.isPopular ? -1 : b.isPopular ? 1 : 0)
            // Limit to first 8 leagues to avoid overwhelming the user
            .slice(0, 8)  
            .map(([leagueId, { league, matches }]) => (
              <div key={leagueId} className="mb-2">
                {/* League header */}
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center">
                  <img 
                    src={league.logo} 
                    alt={league.name}
                    className="h-4 w-4 object-contain mr-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://media.api-sports.io/football/leagues/${league.id}.png`;
                      target.onerror = () => {
                        target.src = 'https://static.livescore.com/i/competition/default.png';
                        target.onerror = null;
                      };
                    }}
                  />
                  <span className="text-xs font-medium">{league.name}</span>
                  {league.country && (
                    <>
                      <span className="mx-1 text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{league.country}</span>
                    </>
                  )}
                </div>
                
                {matches.map((match) => (
                  <div 
                    key={match.fixture.id} 
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setLocation(`/fixtures/${match.fixture.id}`)}
                  >
                    {/* Match row with simplified design like 365scores */}
                    <div className="px-3 py-2 flex items-center">
                      {/* Time/Status */}
                      <div className="w-[10%] mr-2">
                        {['LIVE', '1H', '2H', 'HT'].includes(match.fixture.status.short) ? (
                          <div className="w-10 text-center">
                            <span className="text-xs font-semibold px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                              {match.fixture.status.short === 'HT' ? 'HT' : 
                               match.fixture.status.elapsed ? `${match.fixture.status.elapsed}'` : 'LIVE'}
                            </span>
                          </div>
                        ) : (
                          <div className="w-10 text-center text-xs text-gray-500">
                            {format(new Date(match.fixture.date), 'HH:mm')}
                          </div>
                        )}
                      </div>
                      
                      {/* Left team */}
                      <div className="flex items-center justify-end w-[35%]">
                        <span className="text-sm font-medium truncate text-right max-w-[130px] mr-2">
                          {match.teams.home.name}
                        </span>
                        <img 
                          src={match.teams.home.logo} 
                          alt={match.teams.home.name} 
                          className="h-5 w-5 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://media.api-sports.io/football/teams/${match.teams.home.id}.png`;
                            target.onerror = () => {
                              target.src = 'https://static.livescore.com/i/team/default.png';
                              target.onerror = null;
                            };
                          }}
                        />
                      </div>
                      
                      {/* Score in the middle */}
                      <div className="flex items-center justify-center min-w-[40px] px-2 text-center">
                        {['FT', 'AET', 'PEN', 'LIVE', 'HT', '1H', '2H'].includes(match.fixture.status.short) ? (
                          <div className={`${['LIVE', '1H', '2H', 'HT'].includes(match.fixture.status.short) ? 'text-red-600' : ''} text-sm font-bold`}>
                            {match.goals.home} - {match.goals.away}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm">
                            vs
                          </div>
                        )}
                      </div>
                      
                      {/* Right team */}
                      <div className="flex items-center w-[35%]">
                        <img 
                          src={match.teams.away.logo} 
                          alt={match.teams.away.name} 
                          className="h-5 w-5 object-contain mr-2"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://media.api-sports.io/football/teams/${match.teams.away.id}.png`;
                            target.onerror = () => {
                              target.src = 'https://static.livescore.com/i/team/default.png';
                              target.onerror = null;
                            };
                          }}
                        />
                        <span className="text-sm font-medium truncate max-w-[130px]">
                          {match.teams.away.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
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
