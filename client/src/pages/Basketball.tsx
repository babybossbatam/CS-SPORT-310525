import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { uiActions } from '@/lib/store';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import MyBasketMain from '@/components/layout/MyBasketMain';
import NewsSection from '@/components/news/NewsSection';
import { Dribbble } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Basketball = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  // Set the selected sport when this page loads
  useEffect(() => {
    dispatch(uiActions.setSelectedSport('basketball'));
  }, [dispatch]);
  
  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader 
        title="Basketball - Top Leagues" 
        icon={<Dribbble className="h-4 w-4 text-neutral-600" />} 
      />
      
      <div className="flex-1" style={{ marginTop: "52px" }}>
        <MyBasketMain fixtures={[]}>
          <div className="space-y-4">
            {/* Basketball News Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <h3 className="font-semibold text-gray-700 p-3">Basketball News</h3>
              <div className="px-3 pb-3">
                <NewsSection sport="basketball" />
              </div>
            </div>
            
            {/* Coming Soon Message */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-700 mb-4">Basketball Scores Coming Soon</h2>
              <p className="text-gray-600">
                We're working on adding basketball scores and statistics. Check back soon for updates on NBA, EuroLeague, and other basketball competitions!
              </p>
            </div>
          </div>
        </MyBasketMain>
      </div>
    </>
  );
};

export default Basketball;