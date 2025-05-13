import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { uiActions } from '@/lib/store';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import NewsSection from '@/components/news/NewsSection';
import { CircleDashed } from 'lucide-react';
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
        icon={<CircleDashed className="h-4 w-4 text-neutral-600" />} 
      />
      
      <main className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left column (8 columns) */}
          <div className="lg:col-span-8">
            {/* Basketball News Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-4">
              <h3 className="font-semibold text-gray-700 p-3">Basketball News</h3>
              <div className="px-3 pb-3">
                <NewsSection sport="basketball" />
              </div>
            </div>
            
            {/* Coming Soon Message */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-4 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-700 mb-4">Basketball Scores Coming Soon</h2>
              <p className="text-gray-600">
                We're working on adding basketball scores and statistics. Check back soon for updates on NBA, EuroLeague, and other basketball competitions!
              </p>
            </div>
          </div>
          
          {/* Right column (4 columns) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Basketball Competitions */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <h3 className="font-semibold text-gray-700 p-3">Top Basketball Competitions</h3>
              <ul className="divide-y divide-gray-100">
                <li className="p-3 hover:bg-gray-50 cursor-pointer">NBA</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">EuroLeague</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">NCAA</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">FIBA World Cup</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">EuroCup</li>
              </ul>
            </div>
            
            {/* Popular Teams */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-4">
              <h3 className="font-semibold text-gray-700 p-3">Popular Teams</h3>
              <ul className="divide-y divide-gray-100">
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Los Angeles Lakers</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Golden State Warriors</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Boston Celtics</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Chicago Bulls</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Miami Heat</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Basketball;