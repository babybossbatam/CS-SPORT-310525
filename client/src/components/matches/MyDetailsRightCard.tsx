import React, { useState } from 'react';
import MyDetailsRightScoreboard from "@/components/matches/MyDetailsRightScoreboard";
import MyMatchTabCard from '@/components/matches/MyMatchTabCard';
import MyStatsTabCard from '@/components/matches/MyStatsTabCard';
import MyLineupsTabsCard from '@/components/matches/MyLineupsTabsCard';
import MyTrendsTabsCard from '@/components/matches/MyTrendsTabsCard';
import MyHeadtoheadTabsCard from '@/components/matches/MyHeadtoheadTabsCard';
import { useDeviceInfo } from "@/hooks/use-mobile";

interface MyDetailsRightCardProps {
  selectedFixture: any;
  onClose: () => void;
  onMatchCardClick?: (match: any) => void;
}

const MyDetailsRightCard: React.FC<MyDetailsRightCardProps> = ({ selectedFixture, onClose, onMatchCardClick }) => {
  const [activeTab, setActiveTab] = useState<string>("match");
  const { isMobile, isTablet, isPortrait } = useDeviceInfo();

  // Debug logging to verify data reception from MyNewLeague2
  console.log(`🔍 [MyDetailsRightCard] Received selectedFixture:`, {
    fixtureId: selectedFixture?.fixture?.id,
    teams: `${selectedFixture?.teams?.home?.name} vs ${selectedFixture?.teams?.away?.name}`,
    league: selectedFixture?.league?.name,
    status: selectedFixture?.fixture?.status?.short,
    fullData: selectedFixture
  });

  return (
    <div className={`
      ${isMobile ? 'fixed inset-0 z-50 bg-white' : 'relative'}
      ${isMobile ? 'overflow-y-auto' : ''}
      ${isMobile ? 'safe-area-inset' : ''}
    `}>
      {/* Mobile overlay background */}
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div className={`
        ${isMobile ? 'relative z-50 bg-white min-h-screen' : ''}
        ${isMobile && isPortrait ? 'pb-safe-bottom' : ''}
      `}>
        <div className={`
          ${isMobile ? 'sticky top-0 z-10 bg-white border-b' : ''}
        `}>
          <MyDetailsRightScoreboard
            match={selectedFixture}
            onClose={onClose}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onMatchCardClick={onMatchCardClick}
          />
        </div>

        {/* Tab Content with mobile optimizations */}
        <div className={`
          ${isMobile ? 'px-3 py-2' : 'px-4 py-4'}
          ${isMobile ? 'space-y-3' : 'space-y-4'}
        `}>
          {activeTab === "match" && (
            <div className={`
              ${isMobile ? 'rounded-lg' : 'rounded-xl'}
              bg-white
              ${isMobile ? 'shadow-sm' : 'shadow-md'}
            `}>
              <MyMatchTabCard match={selectedFixture} onTabChange={setActiveTab} />
            </div>
          )}

          {activeTab === "stats" && (
            <div className={`
              ${isMobile ? 'rounded-lg' : 'rounded-xl'}
              bg-white
              ${isMobile ? 'shadow-sm' : 'shadow-md'}
            `}>
              <MyStatsTabCard 
                match={selectedFixture} 
                onTabChange={setActiveTab}
              />
            </div>
          )}

          {activeTab === "lineups" && (
            <div className={`
              ${isMobile ? 'rounded-lg' : 'rounded-xl'}
              bg-white
              ${isMobile ? 'shadow-sm' : 'shadow-md'}
            `}>
              <MyLineupsTabsCard match={selectedFixture} />
            </div>
          )}

          {activeTab === "trends" && (
            <div className={`
              ${isMobile ? 'rounded-lg' : 'rounded-xl'}
              bg-white
              ${isMobile ? 'shadow-sm' : 'shadow-md'}
            `}>
              <MyTrendsTabsCard match={selectedFixture} />
            </div>
          )}

          {activeTab === "h2h" && (
            <div className={`
              ${isMobile ? 'rounded-lg' : 'rounded-xl'}
              bg-white
              ${isMobile ? 'shadow-sm' : 'shadow-md'}
            `}>
              <MyHeadtoheadTabsCard match={selectedFixture} />
            </div>
          )}
        </div>

        {/* Mobile bottom padding for safe area */}
        {isMobile && <div className="h-8" />}
      </div>
    </div>
  );
};

export default MyDetailsRightCard;