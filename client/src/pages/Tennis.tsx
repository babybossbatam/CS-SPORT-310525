import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { uiActions } from '@/lib/store';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import NewsSection from '@/components/news/NewsSection';
import { Tablet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Tennis = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  // Set the selected sport when this page loads
  useEffect(() => {
    dispatch(uiActions.setSelectedSport('tennis'));
  }, [dispatch]);
  
  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader 
        title="Tennis - Grand Slams" 
        icon={<Tablet className="h-4 w-4 text-neutral-600" />} 
      />
      
      <main className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left column (8 columns) */}
          <div className="lg:col-span-8">
            {/* Tennis News Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-4">
              <h3 className="font-semibold text-gray-700 p-3">Tennis News</h3>
              <div className="px-3 pb-3">
                <NewsSection sport="tennis" />
              </div>
            </div>
            
            {/* Coming Soon Message */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-4 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-700 mb-4">Tennis Scores Coming Soon</h2>
              <p className="text-gray-600">
                We're working on adding tennis scores and statistics. Check back soon for updates on Grand Slams, ATP, and WTA tournaments!
              </p>
            </div>
          </div>
          
          {/* Right column (4 columns) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Tennis Competitions */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <h3 className="font-semibold text-gray-700 p-3">Top Tennis Competitions</h3>
              <ul className="divide-y divide-gray-100">
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Australian Open</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">French Open</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Wimbledon</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">US Open</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">ATP Finals</li>
              </ul>
            </div>
            
            {/* Popular Players */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-4">
              <h3 className="font-semibold text-gray-700 p-3">Top Tennis Players</h3>
              <ul className="divide-y divide-gray-100">
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Novak Djokovic</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Rafael Nadal</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Carlos Alcaraz</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Iga Swiatek</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Coco Gauff</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Tennis;