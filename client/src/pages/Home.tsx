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
import HomeTopScorersList from '@/components/leagues/HomeTopScorersList';
import PopularTeamsList from '@/components/teams/PopularTeamsList';
import PopularLeaguesList from '@/components/leagues/PopularLeaguesList';
import LeagueStandingsFilter from '@/components/leagues/LeagueStandingsFilter';


import ChampionsLeagueSchedule from '@/components/leagues/ChampionsLeagueSchedule';
import PremierLeagueSchedule from '@/components/leagues/PremierLeagueSchedule';
import SerieASchedule from '@/components/leagues/SerieASchedule';
import EuropaLeagueSchedule from '@/components/leagues/EuropaLeagueSchedule';
import BundesligaSchedule from '@/components/leagues/BundesligaSchedule';
import { apiRequest } from '@/lib/queryClient';
import { Trophy, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

const Home = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [filteredCountry, setFilteredCountry] = useState<string | null>(null);

  const popularLeagues = useSelector((state: RootState) => state.leagues.popularLeagues);
  const allLeagues = useSelector((state: RootState) => state.leagues.list);

  // Map countries to league IDs - only including the requested leagues
  const countryLeagueMap: Record<string, number[]> = {
    'england': [39],     // Premier League
    'italy': [135],      // Serie A (Italy)
    'germany': [78],     // Bundesliga
    'europe': [2, 3]     // Champions League (2), Europa League (3)
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

  // Fetch all leagues with proper caching
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        // Check if we already have leagues data in the store
        if (allLeagues.length > 0) {
          console.log(`Using cached leagues data (${allLeagues.length} leagues)`);
          return; // Skip API call if we already have data
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
  }, [dispatch, toast, popularLeagues]); // Removed allLeagues from dependencies

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
        title="UEFA Champions League - Semi Finals" 
        icon={<Trophy className="h-4 w-4 text-neutral-600" />} 
      />

      <main className="container mx-auto px-2 py-2 ml-[15%]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left column (8 columns) - Live Scoreboard */}
          <div className="lg:col-span-8">
            {/* Featured Match - Added at the top */}
            <FeaturedMatch />

            {/* Top Scorers Section */}
            <Card className="mt-4">
              <CardHeader className="border-b border-gray-100">
                <h3 className="font-semibold text-gray-700 flex items-center justify-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Top Scorers
                </h3>
              </CardHeader>
              <CardContent>
                <HomeTopScorersList />
              </CardContent>
            </Card>

            <div className="mt-4">
              <LeagueStandingsFilter />
            </div>

            {/* Popular Leagues section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-4">
              <h3 className="font-semibold text-gray-700 p-3">Popular Leagues</h3>
              <div>
                <PopularLeaguesList />
              </div>
            </div>

            {/* Popular Teams Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-4">
              <h3 className="font-semibold text-gray-700 p-3">Popular Teams</h3>
              <div>
                <PopularTeamsList />
              </div>
            </div>
          </div>

          {/* Right column (4 columns) */}
          <div className="lg:col-span-4 space-y-4">
          </div>
        </div>

        
      </main>

      <RegionModal />
    </>
  );
};

export default Home;