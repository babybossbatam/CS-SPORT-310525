import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, leaguesActions, fixturesActions } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import DateNavigator from '@/components/layout/DateNavigator';
import MatchFilters from '@/components/matches/MatchFilters';
import FeaturedMatch from '@/components/matches/FeaturedMatch';
import LeagueMatchCard from '@/components/matches/LeagueMatchCard';

import StatsPanel from '@/components/stats/StatsPanel';
import NewsSection from '@/components/news/NewsSection';
import RegionModal from '@/components/modals/RegionModal';
import LeagueCountryFilter from '@/components/leagues/LeagueCountryFilter';
import HomeTopScorersList from '@/components/leagues/HomeTopScorersList';
import PopularTeamsList from '@/components/teams/PopularTeamsList';
import PopularLeaguesList from '@/components/leagues/PopularLeaguesList';
import PopularLeagueStandingsCard from '@/components/leagues/PopularLeagueStandingsCard';
import LeagueStandingsFilter from '@/components/leagues/LeagueStandingsFilter';

import ChampionsLeagueSchedule from '@/components/leagues/ChampionsLeagueSchedule';
import PremierLeagueSchedule from '@/components/leagues/PremierLeagueSchedule';
import SerieASchedule from '@/components/leagues/SerieASchedule';
import EuropaLeagueSchedule from '@/components/leagues/EuropaLeagueSchedule';
import BundesligaSchedule from '@/components/leagues/BundesligaSchedule';
import { Trophy, Activity, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import MatchFixturesCard from '@/components/matches/MatchFixturesCard';
import { useLocation } from "wouter";

// Cleanup any stale video references
const cleanupFrames = () => {
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => iframe.remove());
};

const Home = () => {
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

  const { data: leagueStandings } = useQuery({
    queryKey: ['standings'],
    queryFn: async () => {
      const leagues = [39, 140, 78, 135, 2, 3]; // Premier League, La Liga, Bundesliga, Serie A, UCL, UEL
      const standingsData = {};

      for (const leagueId of leagues) {
        const response = await apiRequest('GET', `/api/leagues/${leagueId}/standings`);
        const data = await response.json();
        if (data?.league?.standings?.[0]) {
          standingsData[leagueId] = {
            league: data.league,
            standings: data.league.standings[0]
          };
        }
      }
      return standingsData;
    }
  });

  // Limit to essential leagues only
  const popularLeagues = useSelector((state: RootState) => 
    state.leagues.popularLeagues.slice(0, 5)
  );
  const allLeagues = useSelector((state: RootState) => state.leagues.list);

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
          setFixtures(data);
        }
      } catch (error) {
        console.error('Error fetching upcoming fixtures:', error);
        // No toast needed for this as it's not critical - we'll just fallback gracefully
      }
    };

    fetchUpcomingFixtures();
  }, [dispatch]);

  const loading = useSelector((state: RootState) => state.leagues.loading || state.fixtures.loading);

  if (loading) {
    return (
      <>
        <Header />
        <SportsCategoryTabs />
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">Loading matches...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader 
        title="UEFA Champions League - Semi Finals" 
        icon={<Trophy className="h-4 w-4 text-neutral-600" />} 
      />

      <Card className="my-4" style={{ marginLeft: '150px', marginRight: '150px' }}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left column (5 columns) */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="bg-[#F4F4F6]">
                  <CardContent className="p-0">
                    <MatchFixturesCard
                      fixtures={fixtures}
                      onMatchClick={(matchId) => navigate(`/match/${matchId}`)}
                    />
                  </CardContent>
                </Card>
                <StandingsFilterCard />
                {leagueStandings && Object.values(leagueStandings).map((leagueData: any) => (
                  <Card key={leagueData.league.id} className="bg-white shadow-md mb-4 overflow-hidden">
                    
                    <CardContent className="p-4">
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No data to display</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Right column (7 columns) */}
              <div className="lg:col-span-7 space-y-4">
                <FeaturedMatch />
                <Card>
                  <CardContent>
                    <HomeTopScorersList />
                  </CardContent>
                </Card>
                <LeagueStandingsFilter />

                {/* Popular Leagues and Teams sections */}
                <div className="grid grid-cols-2 gap-4">
                  <PopularLeaguesList />
                  <Card className="w-full">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold mb-2">Popular Teams</h3>
                      <PopularTeamsList />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </Card>

      <RegionModal />
    </>
  );
};

export default Home;