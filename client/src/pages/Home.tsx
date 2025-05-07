import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, leaguesActions, fixturesActions } from '@/lib/store';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import DateNavigator from '@/components/layout/DateNavigator';
import MatchFilters from '@/components/matches/MatchFilters';
import FeaturedMatch from '@/components/matches/FeaturedMatch';
import LeagueMatchCard from '@/components/matches/LeagueMatchCard';
import LiveScoreboard from '@/components/matches/LiveScoreboard';
import StatsPanel from '@/components/stats/StatsPanel';
import NewsSection from '@/components/news/NewsSection';
import RegionModal from '@/components/modals/RegionModal';
import { apiRequest } from '@/lib/queryClient';
import { Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';

const Home = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const popularLeagues = useSelector((state: RootState) => state.leagues.popularLeagues);
  
  // Fetch all leagues
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        dispatch(leaguesActions.setLoadingLeagues(true));
        
        const response = await apiRequest('GET', '/api/leagues');
        const data = await response.json();
        
        if (data && data.length > 0) {
          dispatch(leaguesActions.setLeagues(data));
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
  }, [dispatch, toast]);
  
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
      
      {/* Live Scoreboard */}
      <LiveScoreboard />
      
      <DateNavigator />
      <MatchFilters />
      
      <main className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {/* Left column - Popular Leagues */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-3 border-b">
              <h2 className="text-base font-bold">Popular Football Leagues</h2>
            </div>
            
            <div className="space-y-1">
              {popularLeagues.map((leagueId) => (
                <LeagueMatchCard key={leagueId} leagueId={leagueId} />
              ))}
            </div>
          </div>
          
          {/* Right column - Featured Match */}
          <div className="lg:col-span-4">
            <LiveScoreboard />
          </div>
        </div>
        
        <div className="mt-8">
          <StatsPanel />
          <NewsSection />
        </div>
      </main>
      
      <RegionModal />
    </>
  );
};

export default Home;
