
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { uiActions } from '@/lib/store';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import MySnookerMain from '@/components/layout/MySnookerMain';
import NewsSection from '@/components/news/NewsSection';
import { Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Snooker = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  // Set the selected sport when this page loads
  useEffect(() => {
    dispatch(uiActions.setSelectedSport('snooker'));
  }, [dispatch]);
  
  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader 
        title="Snooker - World Championships" 
        icon={<Target className="h-4 w-4 text-neutral-600" />} 
      />
      
      <div className="flex-1" style={{ marginTop: "52px" }}>
        <MySnookerMain fixtures={[]}>
          <div className="space-y-4">
            {/* Snooker News Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <h3 className="font-semibold text-gray-700 p-3">Snooker News</h3>
              <div className="px-3 pb-3">
                <NewsSection sport="snooker" />
              </div>
            </div>
            
            {/* Coming Soon Message */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-700 mb-4">Snooker Scores Coming Soon</h2>
              <p className="text-gray-600">
                We're working on adding snooker scores and statistics. Check back soon for updates on World Championships, Masters, and other major tournaments!
              </p>
            </div>
          </div>
        </MySnookerMain>
      </div>
    </>
  );
};

export default Snooker;
