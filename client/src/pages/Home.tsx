import React from 'react';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import MyMainLayout from '@/components/layout/MyMainLayout';
import Footer from '@/components/layout/Footer';
import RegionModal from '@/components/modals/RegionModal';
import { Trophy } from 'lucide-react';
import TodayPopularFootballLeaguesNew from "@/components/matches/TodayPopularFootballLeaguesNew";
import TodaysMatchesByCountryNew from "@/components/matches/TodaysMatchesByCountryNew";

const Home = () => {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [timeFilterActive, setTimeFilterActive] = React.useState(false);
  const [showTop20, setShowTop20] = React.useState(false);
  const [liveFilterActive, setLiveFilterActive] = React.useState(false);

  const handleMatchCardClick = (match: any) => {
    console.log("Match card clicked:", match);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader 
        title="UEFA Champions League - Semi Finals" 
        icon={<Trophy className="h-4 w-4 text-neutral-600" />} 
      />

      <div className="flex-1">
        <MyMainLayout fixtures={[]} >
            <TodayPopularFootballLeaguesNew
              selectedDate={selectedDate.toISOString().split('T')[0]}
              timeFilterActive={timeFilterActive}
              showTop20={showTop20}
              liveFilterActive={liveFilterActive}
              onMatchCardClick={handleMatchCardClick}
            />
        </MyMainLayout>
      </div>

      <Footer />
      <RegionModal />
    </div>
  );
};

export default Home;