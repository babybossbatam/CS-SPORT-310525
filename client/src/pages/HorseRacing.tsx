
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { uiActions } from '@/lib/store';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import MyHorseMain from '@/components/layout/MyHorseMain';
import NewsSection from '@/components/news/NewsSection';
import { Horse } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const HorseRacing = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  // Set the selected sport when this page loads
  useEffect(() => {
    dispatch(uiActions.setSelectedSport('horseracing'));
  }, [dispatch]);
  
  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader 
        title="Horse Racing - Top Races" 
        icon={<Horse className="h-4 w-4 text-neutral-600" />} 
      />
      
      <div className="flex-1" style={{ marginTop: "52px" }}>
        <MyHorseMain fixtures={[]}>
          <div className="space-y-4">
            {/* Horse Racing News Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <h3 className="font-semibold text-gray-700 p-3">Horse Racing News</h3>
              <div className="px-3 pb-3">
                <NewsSection sport="horseracing" />
              </div>
            </div>
            
            {/* Coming Soon Message */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-700 mb-4">Horse Racing Results Coming Soon</h2>
              <p className="text-gray-600">
                We're working on adding horse racing results and statistics. Check back soon for updates on major races, tracks, and competitions worldwide!
              </p>
            </div>
          </div>
        </MyHorseMain>
      </div>
    </>
  );
};

export default HorseRacing;
