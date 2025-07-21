
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { uiActions } from '@/lib/store';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import MyEsportMain from '@/components/layout/MyEsportMain';
import NewsSection from '@/components/news/NewsSection';
import { Gamepad2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Esport = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  // Set the selected sport when this page loads
  useEffect(() => {
    dispatch(uiActions.setSelectedSport('esports'));
  }, [dispatch]);
  
  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader 
        title="Esports - Major Tournaments" 
        icon={<Gamepad2 className="h-4 w-4 text-neutral-600" />} 
      />
      
      <main className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left column (8 columns) */}
          <div className="lg:col-span-8">
            {/* Esports News Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-4">
              <h3 className="font-semibold text-gray-700 p-3">Esports News</h3>
              <div className="px-3 pb-3">
                <NewsSection sport="esports" />
              </div>
            </div>
            
            {/* Coming Soon Message */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-4 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-700 mb-4">Esports Scores Coming Soon</h2>
              <p className="text-gray-600">
                We're working on adding esports scores and statistics. Check back soon for updates on League of Legends, CS2, Dota 2, and other major gaming competitions!
              </p>
            </div>
          </div>
          
          {/* Right column (4 columns) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Esports Competitions */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <h3 className="font-semibold text-gray-700 p-3">Top Esports Tournaments</h3>
              <ul className="divide-y divide-gray-100">
                <li className="p-3 hover:bg-gray-50 cursor-pointer">League of Legends World Championship</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">CS2 Major Championships</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">The International (Dota 2)</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Valorant Champions</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Overwatch World Cup</li>
              </ul>
            </div>
            
            {/* Popular Teams */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-4">
              <h3 className="font-semibold text-gray-700 p-3">Popular Teams</h3>
              <ul className="divide-y divide-gray-100">
                <li className="p-3 hover:bg-gray-50 cursor-pointer">T1 (League of Legends)</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">FaZe Clan (CS2)</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Team Spirit (Dota 2)</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Sentinels (Valorant)</li>
                <li className="p-3 hover:bg-gray-50 cursor-pointer">Cloud9 (Multi-game)</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Esport;
