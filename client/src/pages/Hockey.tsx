import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { uiActions } from '@/lib/store';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import MyHorseMain from '@/components/layout/MyHorseMain';
import NewsSection from '@/components/news/NewsSection';
import { Dumbbell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Hockey = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  // Set the selected sport when this page loads
  useEffect(() => {
    dispatch(uiActions.setSelectedSport('hockey'));
  }, [dispatch]);
  
  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader 
        title="Hockey - Top Leagues" 
        icon={<Dumbbell className="h-4 w-4 text-neutral-600" />} 
      />
      
      <div className="flex-1" style={{ marginTop: "52px" }}>
        <MyHorseMain fixtures={[]}>
          <div className="space-y-4">
            {/* Hockey News Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <h3 className="font-semibold text-gray-700 p-3">Hockey News</h3>
              <div className="px-3 pb-3">
                <NewsSection sport="hockey" />
              </div>
            </div>
            
            {/* Coming Soon Message */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-700 mb-4">Hockey Scores Coming Soon</h2>
              <p className="text-gray-600">
                We're working on adding hockey scores and statistics. Check back soon for updates on NHL, KHL, and other hockey competitions!
              </p>
            </div>
          </div>
        </MyHorseMain>
      </div>
    </>
  );
};

export default Hockey;