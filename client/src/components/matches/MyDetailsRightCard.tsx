import React, { useState } from 'react';
import MyDetailsRightScoreboard from "@/components/matches/MyDetailsRightScoreboard";
import MyMatchTabCard from '@/components/matches/MyMatchTabCard';
import MyStatsTabCard from '@/components/matches/MyStatsTabCard';
import MyLineupsTabsCard from '@/components/matches/MyLineupsTabsCard';
import MyTrendsTabsCard from '@/components/matches/MyTrendsTabsCard';
import MyHeadtoheadTabsCard from '@/components/matches/MyHeadtoheadTabsCard';

interface MyDetailsRightCardProps {
  selectedFixture: any;
  onClose: () => void;
  onMatchCardClick?: (match: any) => void;
}

const MyDetailsRightCard: React.FC<MyDetailsRightCardProps> = ({ selectedFixture, onClose, onMatchCardClick }) => {
  const [activeTab, setActiveTab] = useState<string>("match");

  // Debug logging to verify data reception from MyNewLeague2
  console.log(`🔍 [MyDetailsRightCard] Received selectedFixture:`, {
    fixtureId: selectedFixture?.fixture?.id,
    teams: `${selectedFixture?.teams?.home?.name} vs ${selectedFixture?.teams?.away?.name}`,
    league: selectedFixture?.league?.name,
    status: selectedFixture?.fixture?.status?.short,
    fullData: selectedFixture
  });

  return (
    <>
      <MyDetailsRightScoreboard
        match={selectedFixture}
        onClose={onClose}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onMatchCardClick={onMatchCardClick}
      />

      {/* Tab Content */}
      {activeTab === "match" && (
        <>
          <MyMatchTabCard match={selectedFixture} onTabChange={setActiveTab} />


        </>
      )}

      {activeTab === "stats" && (
        <MyStatsTabCard 
          match={selectedFixture} 
          onTabChange={setActiveTab}
        />
      )}

      {activeTab === "lineups" && (
        <MyLineupsTabsCard match={selectedFixture} />
      )}

      {activeTab === "trends" && (
        <MyTrendsTabsCard match={selectedFixture} />
      )}

      {activeTab === "h2h" && (
        <MyHeadtoheadTabsCard match={selectedFixture} />
      )}
    </>
  );
};

export default MyDetailsRightCard;