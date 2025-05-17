import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, leaguesActions, fixturesActions } from '@/lib/store';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import DateNavigator from '@/components/layout/DateNavigator';
import MatchFilters from '@/components/matches/MatchFilters';
import FeaturedMatch from '@/components/matches/FeaturedMatch';
import LeagueMatchCard from '@/components/matches/LeagueMatchCard';
import LiveScoreboardPage from '@/pages/LiveScoreboardPage';
import StatsPanel from '@/components/stats/StatsPanel';
import NewsSection from '@/components/news/NewsSection';
import RegionModal from '@/components/modals/RegionModal';
import LeagueCountryFilter from '@/components/leagues/LeagueCountryFilter';
import { apiRequest } from '@/lib/queryClient';
import { Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';

const Football = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [filteredCountry, setFilteredCountry] = useState<string | null>(null);

  const popularLeagues = useSelector((state: RootState) => state.leagues.popularLeagues);
  const allLeagues = useSelector((state: RootState) => state.leagues.list);

  // Map countries to league IDs - using the actual league IDs from our Popular Leagues list
  const countryLeagueMap: Record<string, number[]> = {
    'england': [39],     // Premier League
    'italy': [135],      // Serie A (Italy)
    'europe': [2],       // Champions League
    'brazil': [71],      // Serie A (Brazil)
    'spain': [140],      // La Liga
    'germany': [78]      // Bundesliga
  };

  // Pre-fetch all these leagues to ensure they're available for country filtering
  useEffect(() => {
    const preloadLeagueData = async () => {
      try {
        // Fetch data for all the leagues used in country filters
        const allLeagueIds = Object.values(countryLeagueMap).flat();

        for (const leagueId of allLeagueIds) {
          // Use React Query's caching through our wrapper
          const response = await apiRequest('GET', `/api/leagues/${leagueId}`);
          const data = await response.json();

          if (data && data.league && data.country) {
            // Add to Redux store if not already there
            if (!allLeagues.some(l => l.league.id === leagueId)) {
              dispatch(leaguesActions.setLeagues([...allLeagues, data]));
            }
          }
        }
      } catch (error) {
        console.error('Error preloading league data:', error);
      }
    };

    if (allLeagues.length === 0) {
      preloadLeagueData();
    }
  }, [dispatch, allLeagues, countryLeagueMap]);

  // Fetch all leagues
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        // Check if we have recent cached data
        const now = Date.now();
        const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

        if (allLeagues.length > 0) {
          return; // Use cached data if available
        }

        dispatch(leaguesActions.setLoadingLeagues(true));
        const response = await apiRequest('GET', '/api/leagues');
        const data = await response.json();

        if (data && data.length > 0) {
          console.log(`Loaded ${data.length} leagues from API`);
          dispatch(leaguesActions.setLeagues(data));
        } else {
          console.warn('No leagues data found from API');
          // If no global leagues are found, at least load the direct ones we need
          await Promise.all(
            popularLeagues.map(async (leagueId) => {
              try {
                const leagueResponse = await apiRequest('GET', `/api/leagues/${leagueId}`);
                const leagueData = await leagueResponse.json();

                if (leagueData && leagueData.league) {
                  console.log(`Directly loaded league: ${leagueData.league.name}`);
                  dispatch(leaguesActions.setLeagues([...allLeagues, leagueData]));
                }
              } catch (err) {
                console.error(`Error loading league ${leagueId}:`, err);
              }
            })
          );
        }
      } catch (error) {
        console.error('Error fetching leagues:', error);
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
  }, [dispatch, toast, popularLeagues, allLeagues]);

  // Fetch upcoming fixtures for tomorrow to display in the scoreboard when no live matches
  useEffect(() => {
    const fetchUpcomingFixtures = async () => {
      try {
        // Get tomorrow's date in YYYY-MM-DD format
        const tomorrow = addDays(new Date(), 1);
        const tomorrowFormatted = format(tomorrow, 'yyyy-MM-dd');

        const response = await apiRequest('GET', `/api/fixtures/date/${tomorrowFormatted}`);
        const data = await response.json();

        if (data && data.length > 0) {
          dispatch(fixturesActions.setUpcomingFixtures(data));
        }
      } catch (error) {
        console.error('Error fetching upcoming fixtures:', error);
        // No toast needed for this as it's not critical - we'll just fallback gracefully
      }
    };

    fetchUpcomingFixtures();
  }, [dispatch]);

  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader 
        title="Football - Major Leagues" 
        icon={<Trophy className="h-4 w-4 text-neutral-600" />} 
      />

      <DateNavigator />
      <MatchFilters />

      <main className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {/* Left column - Featured Match */}
          <div className="lg:col-span-4">
            <LiveScoreboardPage />
          </div>

          {/* Right column - Popular Leagues */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Country filter */}
            <LeagueCountryFilter onSelectCountry={setFilteredCountry} />

            <div className="space-y-1">
              {(filteredCountry 
                ? countryLeagueMap[filteredCountry] || [] 
                : popularLeagues
              ).map((leagueId) => (
                <LeagueMatchCard key={leagueId} leagueId={leagueId} />
              ))}
            </div>
          </div>
        </div>

        {/* Stats and News Section */}
        <div className="mt-8 grid grid-cols-1 gap-6">
          <StatsPanel />
          <div className="bg-white rounded-lg shadow p-4">
            <NewsSection />
          </div>
        </div>
      </main>

      <RegionModal />
    </>
  );
};

export default Football;