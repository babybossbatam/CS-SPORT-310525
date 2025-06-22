import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, leaguesActions, fixturesActions, uiActions } from '@/lib/store';
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
import RegionModal from '@/components/modals/RegionModal';
import LeagueCountryFilter from '@/components/leagues/LeagueCountryFilter';
import HomeTopScorersList from '@/components/leagues/HomeTopScorersList';
import PopularTeamsList from '@/components/teams/PopularTeamsList';
import PopularLeaguesList from '@/components/leagues/PopularLeaguesList';
import PopularLeagueStandingsCard from '@/components/leagues/PopularLeagueStandingsCard';
import LeagueStandingsFilter from '@/components/leagues/LeagueStandingsFilter';
import CacheMonitor from '@/components/debug/CacheMonitor';

import ChampionsLeagueSchedule from '@/components/leagues/ChampionsLeagueSchedule';
import PremierLeagueSchedule from '@/components/leagues/PremierLeagueSchedule';
import SerieASchedule from '@/components/leagues/SerieASchedule';
import EuropaLeagueSchedule from '@/components/leagues/EuropaLeagueSchedule';
import ConferenceLeagueSchedule from '@/components/leagues/ConferenceLeagueSchedule';
import BundesligaSchedule from '@/components/leagues/BundesligaSchedule';
import { Trophy, Activity, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { getCurrentUTCDateString } from '@/lib/dateUtilsUpdated';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from "wouter";

// Import the new TodayMatchCard component
import MyMainLayout from '@/components/layout/MyMainLayout';
import { Button } from "@/components/ui/button";
import { UnifiedDebugPanel } from "../components/debug/UnifiedDebugPanel";
import Footer from '@/components/layout/Footer';



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
  const [location, navigate] = useLocation();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [timeFilterActive, setTimeFilterActive] = useState(false);
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const [todayPopularFixtures, setTodayPopularFixtures] = useState<any[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Ensure selectedDate is properly initialized
  useEffect(() => {
    if (!selectedDate) {
      const today = format(new Date(), 'yyyy-MM-dd');
      dispatch(uiActions.setSelectedDate(today));
    }
  }, [selectedDate, dispatch]);

  // Note: Using league standing data instead of cached standings

  // Use direct state access to avoid identity function warnings
  const popularLeaguesData = useSelector((state: RootState) => state.leagues.popularLeagues);
  const fixturesByDate = useSelector((state: RootState) => state.fixtures.byDate);
  const allLeaguesData = useSelector((state: RootState) => state.leagues.list);
  const selectedLeagues = useSelector((state: RootState) => state.leagues.popularLeagues);
  const standingsByLeague = useSelector((state: RootState) => state.stats.topScorers);
  const selectedCountries = useSelector((state: RootState) => state.user.preferences.region);

  // Memoize array transformations to prevent unnecessary re-renders
  const popularLeagues = useMemo(() => popularLeaguesData.slice(0, 5), [popularLeaguesData]);
  const allLeagues = useMemo(() => allLeaguesData.filter(league => league && league.league), [allLeaguesData]);

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

  

    const handleMatchClick = (matchId: number) => {
        navigate(`/match/${matchId}`);
    };


  

  

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader 
        title="UEFA Champions League - Semi Finals" 
        icon={<Trophy className="h-4 w-4 text-neutral-600" />} 
      />

      <div className="flex-1">
        <MyMainLayout fixtures={fixtures || []} />
      </div>

      <RegionModal />
      <CacheMonitor />

      {/* Debug Panel */}
      <UnifiedDebugPanel 
        isVisible={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
      />
    </div>
  );
};

export default Home;