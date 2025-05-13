import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { uiActions } from '@/lib/store';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import NewsSection from '@/components/news/NewsSection';
import { Dumbbell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Baseball = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  // Set the selected sport when this page loads
  useEffect(() => {
    dispatch(uiActions.setSelectedSport('baseball'));
  }, [dispatch]);
  
  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader 
        title="Baseball - Major Leagues" 
        icon={<Dumbbell className="h-4 w-4 text-neutral-600" />} 
      />
      
      <main className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left column (8 columns) */}
          <div className="lg:col-span-8">
            {/* Baseball News Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-4">
              <h3 className="font-semibold text-gray-700 p-3">Baseball News</h3>
              <div className="px-3 pb-3">
                <NewsSection sport="baseball" />
              </div>
            </div>
            
            {/* Coming Soon Message */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-4 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-700 mb-4">Baseball Scores Coming Soon</h2>
              <p className="text-gray-600">
                We're working on adding baseball scores and statistics. Check back soon for updates on MLB, NPB, and other baseball competitions!
              </p>
            </div>
          </div>
          
          {/* Right column (4 columns) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Baseball Competitions */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <h3 className="font-semibold text-gray-700 p-3">Top Baseball Competitions</h3>
              <ul className="divide-y divide-gray-100">
                <li className="p-3 hover:bg-gray-50 cursor-pointer">MLB</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">NPB (Japan)</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">KBO (Korea)</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">CPBL (Taiwan)</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">World Baseball Classic</li>
              </ul>
            </div>
            
            {/* Popular Teams */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-4">
              <h3 className="font-semibold text-gray-700 p-3">Popular Teams</h3>
              <ul className="divide-y divide-gray-100">
                <li className="p-3 hover:bg-gray-50 cursor-pointer">New York Yankees</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Boston Red Sox</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Los Angeles Dodgers</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Chicago Cubs</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Houston Astros</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Baseball;