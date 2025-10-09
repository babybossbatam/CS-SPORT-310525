import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, leaguesActions, fixturesActions, uiActions } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { usePopularLeagueStandings } from '@/lib/MyStandingsCachedNew';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import MyFootballMain from '@/components/layout/MyFootballMain';
import RegionModal from '@/components/modals/RegionModal';
import { Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from "wouter";
import Footer from '@/components/layout/Footer';

// Cleanup any stale video references
const cleanupFrames = () => {
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => iframe.remove());
};

const Football = () => {
  useEffect(() => {
    cleanupFrames();
    return () => cleanupFrames();
  }, []);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [filteredCountry, setFilteredCountry] = useState<string | null>(null);
  const [fixtures, setFixtures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [location, navigate] = useLocation();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);

  // Ensure selectedDate is properly initialized
  useEffect(() => {
    if (!selectedDate) {
      const today = format(new Date(), 'yyyy-MM-dd');
      dispatch(uiActions.setSelectedDate(today));
    }
  }, [selectedDate, dispatch]);

  // Use the cached standings system instead of direct API calls
  const { data: leagueStandings } = usePopularLeagueStandings();

  // Use direct state access to avoid identity function warnings - OPTIMIZED
  const popularLeaguesData = useSelector((state: RootState) => state.leagues.popularLeagues);
  const allLeaguesData = useSelector((state: RootState) => state.leagues.list);
  
  // Further reduce initial data load
  const popularLeagues = useMemo(() => popularLeaguesData.slice(0, 2), [popularLeaguesData]); // Reduced to just 2
  const allLeagues = useMemo(() => {
    // Only process if we have data to avoid unnecessary calculations
    if (allLeaguesData.length === 0) return [];
    return allLeaguesData.filter(league => league?.league?.id).slice(0, 5); // Limit to 5 leagues only
  }, [allLeaguesData]);

  useEffect(() => {
    // Cleanup function to handle unmounting
    return () => {
      cleanupFrames();
    };
  }, []);

  // Map countries to league IDs - only including the requested leagues
  const countryLeagueMap: Record<string, number[]> = {
    'england': [39],     // Premier League
    'italy': [135],      // Serie A (Italy)
    'germany': [78],     // Bundesliga
    'europe': [2, 3, 848]     // Champions League (2), Europa League (3), Conference League (848)
  };

  // DISABLED: Remove background preloading to reduce system load
  // useEffect(() => {
  //   const preloadEssentialLeagues = async () => {
  //     try {
  //       // Only load the most essential leagues (Premier League, Champions League)
  //       const essentialLeagues = [39, 2]; // Premier League, Champions League only
        
        for (const leagueId of essentialLeagues) {
          if (!allLeagues.some(l => l.league?.id === leagueId)) {
            try {
              const response = await apiRequest('GET', `/api/leagues/${leagueId}`);
              const data = await response.json();
              if (data?.league?.id) {
                dispatch(leaguesActions.setLeagues(prev => [...prev, data]));
              }
            } catch (error) {
              console.warn(`Failed to load league ${leagueId}:`, error);
              // Continue with next league instead of breaking
            }
          }
        }
      } catch (error) {
        console.error('Error preloading essential leagues:', error);
      }
    };

    // Only preload if we have no leagues at all
    if (allLeagues.length === 0) {
      // Use requestIdleCallback to avoid blocking main thread
      requestIdleCallback(() => {
        preloadEssentialLeagues();
      }, { timeout: 2000 });
    }
  }, [dispatch, allLeagues.length]); // Changed dependency to length only

  // Fetch all leagues with proper caching
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        // Check if we already have leagues data in the store
        if (allLeagues.length > 0) {
          console.log(`Using cached leagues data (${allLeagues.length} leagues)`);
          dispatch(leaguesActions.setLoadingLeagues(false)); // Ensure loading is false
          return;
        }

        dispatch(leaguesActions.setLoadingLeagues(true));

        try {
          const response = await apiRequest('GET', '/api/leagues');
          const data = await response.json();

          if (data && data.length > 0) {
            console.log(`Loaded ${data.length} leagues from API`);
            dispatch(leaguesActions.setLeagues(data));
          } else {
            console.warn('No leagues data found from API, loading individual leagues');
            // Load minimal league data to prevent infinite loading
            const minimalLeagues = [
              { league: { id: 39, name: 'Premier League' }, country: { name: 'England' } },
              { league: { id: 140, name: 'La Liga' }, country: { name: 'Spain' } },
              { league: { id: 78, name: 'Bundesliga' }, country: { name: 'Germany' } },
              { league: { id: 135, name: 'Serie A' }, country: { name: 'Italy' } },
              { league: { id: 2, name: 'UEFA Champions League' }, country: { name: 'World' } }
            ];
            dispatch(leaguesActions.setLeagues(minimalLeagues));
          }
        } catch (apiError) {
          console.error('API error, using fallback data:', apiError);
          // Set minimal data to prevent infinite loading
          const fallbackLeagues = [
            { league: { id: 39, name: 'Premier League' }, country: { name: 'England' } },
            { league: { id: 140, name: 'La Liga' }, country: { name: 'Spain' } }
          ];
          dispatch(leaguesActions.setLeagues(fallbackLeagues));
        }
      } catch (error) {
        console.error('Error fetching leagues:', error);
        // Even on error, set some data to prevent infinite loading
        dispatch(leaguesActions.setLeagues([
          { league: { id: 39, name: 'Premier League' }, country: { name: 'England' } }
        ]));
        toast({
          title: 'Error',
          description: 'Failed to load leagues information',
          variant: 'destructive',
        });
      } finally {
        dispatch(leaguesActions.setLoadingLeagues(false));
      }
    };

    fetchLeagues();
  }, [dispatch, toast]); // Simplified dependencies

  // OPTIMIZED: Lazy load upcoming fixtures only when needed
  useEffect(() => {
    const fetchUpcomingFixtures = async () => {
      try {
        // Only fetch if we don't already have fixtures
        if (fixtures.length > 0) return;
        
        // Get tomorrow's date in YYYY-MM-DD format
        const tomorrow = addDays(new Date(), 1);
        const tomorrowFormatted = format(tomorrow, 'yyyy-MM-dd');

        // Use a timeout to delay this non-critical request
        setTimeout(async () => {
          try {
            const response = await apiRequest('GET', `/api/fixtures/date/${tomorrowFormatted}?limit=20`); // Limit results
            const data = await response.json();

            if (data && data.length > 0) {
              dispatch(fixturesActions.setUpcomingFixtures(data.slice(0, 20))); // Limit to 20 fixtures
              setFixtures(data.slice(0, 20));
            }
          } catch (error) {
            console.warn('Failed to fetch upcoming fixtures:', error);
            // Set empty array to prevent retry loops
            setFixtures([]);
          }
        }, 3000); // Delay by 3 seconds to let page load first
      } catch (error) {
        console.error('Error setting up upcoming fixtures fetch:', error);
      }
    };

    // Only fetch after initial render is complete
    requestIdleCallback(() => {
      fetchUpcomingFixtures();
    }, { timeout: 5000 });
  }, [dispatch]); // Removed fixtures dependency to prevent loops

  const leaguesLoading = useSelector((state: RootState) => state.leagues.loading);
  const fixturesLoading = useSelector((state: RootState) => state.fixtures.loading);
  const isInitialLoad = useSelector((state: RootState) => state.leagues.list.length === 0);

    const handleMatchClick = (matchId: number) => {
        navigate(`/match/${matchId}`);
    };


  // Only show loading if we're in initial load state and actually loading
  if (isInitialLoad && (leaguesLoading || fixturesLoading)) {
    return (
      <>
        <Header />
        <SportsCategoryTabs />
        <TournamentHeader 
          title="Football - Major Leagues" 
          icon={<Trophy className="h-4 w-4 text-neutral-600" />} 
        />

        <Card className="my-4 bg-[#FDFBF7]" style={{ marginLeft: '150px', marginRight: '150px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left column skeleton */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="bg-[#F4F4F6]">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Date navigator skeleton */}
                    <div className="flex items-center justify-between mb-4">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-8 w-8" />
                    </div>

                    {/* Match cards skeleton */}
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="border-b border-gray-100 last:border-b-0 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 w-5/12">
                            <div className="text-right w-full">
                              <Skeleton className="h-4 w-20 ml-auto mb-1" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded" />
                          </div>
                          <div className="flex items-center justify-center w-2/12">
                            <Skeleton className="h-6 w-12" />
                          </div>
                          <div className="flex items-center gap-3 w-5/12">
                            <Skeleton className="h-8 w-8 rounded" />
                            <div className="w-full">
                              <Skeleton className="h-4 w-20 mb-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Matches by country skeleton */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-52" />
                  </div>
                  <Skeleton className="h-3 w-44" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="border-b border-gray-100 last:border-b-0">
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-6 h-4 rounded-sm" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-8" />
                            <Skeleton className="h-5 w-12 rounded-full" />
                          </div>
                          <Skeleton className="h-4 w-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column skeleton */}
            <div className="lg:col-span-7 space-y-4">
              {/* Featured match skeleton */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <Skeleton className="h-6 w-48 mx-auto mb-2" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col items-center">
                      <Skeleton className="h-16 w-16 rounded mb-2" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <div className="flex flex-col items-center">
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex flex-col items-center">
                      <Skeleton className="h-16 w-16 rounded mb-2" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top scorers skeleton */}
              <Card>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-32 mb-4" />
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* News skeleton */}
              <Card>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-40 mb-4" />
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border-b border-gray-100 last:border-b-0 pb-4 mb-4">
                      <div className="flex gap-3">
                        <Skeleton className="w-20 h-16 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-12" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* League standings skeleton */}
              <Card>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-40 mb-4" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-6 w-6" />
                          <Skeleton className="h-6 w-6 rounded" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-4 w-8" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Popular leagues and teams skeleton */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-32 mb-3" />
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <Skeleton className="h-6 w-6 rounded" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-28 mb-3" />
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <Skeleton className="h-6 w-6 rounded" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader 
        title="Football - Major Leagues" 
        icon={<Trophy className="h-4 w-4 text-neutral-600" />} 
      />
     
      <MyFootballMain fixtures={fixtures} />

      <div className="mt-16">
        <Footer />
      </div>
      <RegionModal />
    </>
  );
};

export default Football;