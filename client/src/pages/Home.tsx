import React from 'react';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import MyMainLayout from '@/components/layout/MyMainLayout';
import RegionModal from '@/components/modals/RegionModal';
import { Trophy } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader 
        title="UEFA Champions League - Semi Finals" 
        icon={<Trophy className="h-4 w-4 text-neutral-600" />} 
      />

      <div className="flex-1">
        <MyMainLayout fixtures={[]} />
      </div>

      <RegionModal />
    </div>
  );
};

export default Home;