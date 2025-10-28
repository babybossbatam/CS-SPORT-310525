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
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [filteredCountry, setFilteredCountry] = useState<string | null>(null);
  const [fixtures, setFixtures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [location, navigate] = useLocation();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);

  // Cleanup on mount/unmount
  useEffect(() => {
    cleanupFrames();
    return () => cleanupFrames();
  }, []);

  // Initialize selectedDate
  useEffect(() => {
    if (!selectedDate) {
      const today = format(new Date(), 'yyyy-MM-dd');
      dispatch(uiActions.setSelectedDate(today));
    }
  }, [selectedDate, dispatch]);

  // Use the cached standings system
  const { data: leagueStandings } = usePopularLeagueStandings();

  // Memoized selectors to prevent unnecessary re-renders
  const popularLeaguesData = useSelector((state: RootState) => state.leagues.popularLeagues);
  const fixturesByDate = useSelector((state: RootState) => state.fixtures.byDate);
  const allLeaguesData = useSelector((state: RootState) => state.leagues.list);
  const leaguesLoading = useSelector((state: RootState) => state.leagues.loading);
  const fixturesLoading = useSelector((state: RootState) => state.fixtures.loading);

  // Memoize array transformations
  const popularLeagues = useMemo(() => popularLeaguesData.slice(0, 5), [popularLeaguesData]);
  const allLeagues = useMemo(() => allLeaguesData.filter(league => league && league.league), [allLeaguesData]);

  // Country league mapping - reduced set
  const countryLeagueMap: Record<string, number[]> = {
    'england': [39],     // Premier League only
    'italy': [135],      // Serie A only
    'germany': [78],     // Bundesliga only
    'europe': [2, 3]     // Champions League, Europa League only
  };

  // Simplified league fetching with error boundaries
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        if (allLeagues.length > 0) {
          console.log(`Using cached leagues data (${allLeagues.length} leagues)`);
          dispatch(leaguesActions.setLoadingLeagues(false));
          return;
        }

        dispatch(leaguesActions.setLoadingLeagues(true));

        // Try main API first
        try {
          const response = await apiRequest('GET', '/api/leagues');
          const data = await response.json();

          if (data && data.length > 0) {
            console.log(`Loaded ${data.length} leagues from API`);
            dispatch(leaguesActions.setLeagues(data));
          } else {
            throw new Error('No leagues data');
          }
        } catch (apiError) {
          console.warn('API error, using minimal fallback data:', apiError);
          // Minimal fallback to prevent infinite loading
          const fallbackLeagues = [
            { league: { id: 39, name: 'Premier League' }, country: { name: 'England' } },
            { league: { id: 140, name: 'La Liga' }, country: { name: 'Spain' } },
            { league: { id: 78, name: 'Bundesliga' }, country: { name: 'Germany' } },
            { league: { id: 135, name: 'Serie A' }, country: { name: 'Italy' } },
            { league: { id: 2, name: 'UEFA Champions League' }, country: { name: 'World' } }
          ];
          dispatch(leaguesActions.setLeagues(fallbackLeagues));
        }
      } catch (error) {
        console.error('Critical error fetching leagues:', error);
        // Emergency fallback
        dispatch(leaguesActions.setLeagues([
          { league: { id: 39, name: 'Premier League' }, country: { name: 'England' } }
        ]));
        toast({
          title: 'Warning',
          description: 'Limited league data available',
          variant: 'destructive',
        });
      } finally {
        dispatch(leaguesActions.setLoadingLeagues(false));
        setIsLoading(false);
      }
    };

    fetchLeagues();
  }, [dispatch, toast, allLeagues.length]);

  // Simplified upcoming fixtures fetch
  useEffect(() => {
    const fetchUpcomingFixtures = async () => {
      try {
        const tomorrow = addDays(new Date(), 1);
        const tomorrowFormatted = format(tomorrow, 'yyyy-MM-dd');

        const response = await apiRequest('GET', `/api/fixtures/date/${tomorrowFormatted}`);
        const data = await response.json();

        if (data && data.length > 0) {
          dispatch(fixturesActions.setUpcomingFixtures(data.slice(0, 50))); // Limit to 50
          setFixtures(data.slice(0, 50));
        }
      } catch (error) {
        console.error('Error fetching upcoming fixtures:', error);
        // Silent fail - not critical
      }
    };

    fetchUpcomingFixtures();
  }, [dispatch]);

  const handleMatchClick = (matchId: number) => {
    navigate(`/match/${matchId}`);
  };

  // Show loading only if truly initial load
  const isInitialLoad = allLeagues.length === 0 && leaguesLoading;

  if (isInitialLoad) {
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
            <div className="lg:col-span-5 space-y-4">
              <Card className="bg-[#F4F4F6]">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-8 w-8" />
                    </div>

                    {[1, 2, 3].map((i) => (
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
                            <Skeleton className="h-4 w-20 ml-auto mb-1" />
                            <Skeleton className="h-8 w-8 rounded" />
                          </div>
                          <div className="flex items-center justify-center w-2/12">
                            <Skeleton className="h-6 w-12" />
                          </div>
                          <div className="flex items-center gap-3 w-5/12">
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-4 w-20 mb-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <Skeleton className="h-6 w-48 mx-auto mb-2" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                  </div>
                </CardContent>
              </Card>
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

      {/* Footer */}
      <div className="mt-16">
        <Footer />
      </div>
      <RegionModal />
    </>
  );
};

export default Football;