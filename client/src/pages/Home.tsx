import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, leaguesActions } from '@/lib/store';
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
import { apiRequest } from '@/lib/queryClient';
import { Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  
  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader 
        title="UEFA Champions League - Semi Finals" 
        icon={<Trophy className="h-4 w-4 text-neutral-600" />} 
      />
      
      {/* Ad Banner - Placeholder */}
      <div className="bg-gray-100 py-4">
        <div className="container mx-auto px-4">
          <div className="bg-gray-200 rounded-md h-20 flex items-center justify-center">
            <span className="text-gray-500 text-sm">Advertisement</span>
          </div>
        </div>
      </div>
      
      <DateNavigator />
      <MatchFilters />
      
      <main className="container mx-auto px-4 py-4">
        <FeaturedMatch />
        
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <h3 className="text-sm font-semibold">Popular Football Leagues</h3>
          </div>
          
          {popularLeagues.map((leagueId) => (
            <LeagueMatchCard key={leagueId} leagueId={leagueId} />
          ))}
        </div>
        
        <StatsPanel />
        <NewsSection />
      </main>
      
      <RegionModal />
    </>
  );
};

export default Home;
