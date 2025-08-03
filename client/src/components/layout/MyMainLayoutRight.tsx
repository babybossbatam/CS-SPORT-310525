import React, { useState } from 'react';
import MatchPredictionsCard from '@/components/matches/MatchPredictionsCard';
import MyLiveAction from '@/components/matches/MyLiveAction';
import MyHighlights from '@/components/matches/MyHighlights';
import MyMatchEventNew from '@/components/matches/MyMatchEventNew';
import ScoreDetailsCard from '@/components/matches/ScoreDetailsCard';
import MyMatchTabCard from '@/components/matches/MyMatchTabCard';
import MyStatsTabCard from '@/components/matches/MyStatsTabCard';
import MyLineupsTabsCard from '@/components/matches/MyLineupsTabsCard';
import MyTrendsTabsCard from '@/components/matches/MyTrendsTabsCard';
import MyHeadtoheadTabsCard from '@/components/matches/MyHeadtoheadTabsCard';
import { cn } from '@/lib/utils';
import { useDeviceInfo } from '@/hooks/use-mobile';

interface MyMainLayoutRightProps {
  selectedFixture: any;
  onClose: () => void;
}

const MyMainLayoutRight: React.FC<MyMainLayoutRightProps> = ({ selectedFixture, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>("match");
  const { isMobile } = useDeviceInfo();

  // Debug logging to verify data reception from MyNewLeague2
  console.log(`🔍 [MyMainLayoutRight] Received selectedFixture:`, {
    fixtureId: selectedFixture?.fixture?.id,
    teams: `${selectedFixture?.teams?.home?.name} vs ${selectedFixture?.teams?.away?.name}`,
    league: selectedFixture?.league?.name,
    status: selectedFixture?.fixture?.status?.short,
    fullData: selectedFixture
  });

  return (
    <div className={cn(
      isMobile ? "mobile-layout-scroll" : "overflow-y-auto mobile-scroll",
      isMobile 
        ? "w-full px-2 pb-20" // Mobile: proper scroll container
        : "min-h-screen" // Desktop: original behavior
    )}>
      <div className={cn(
        isMobile ? "mb-4" : "mb-6"
      )}>
        <ScoreDetailsCard
          currentFixture={selectedFixture}
          onClose={onClose}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Tab Content */}
      <div className={cn(
        "space-y-4",
        isMobile ? "mobile-tab-content px-1" : ""
      )}>
        {activeTab === "match" && (
          <div className={cn(
            isMobile ? "space-y-3" : "space-y-4"
          )}>
            <MyMatchTabCard match={selectedFixture} onTabChange={setActiveTab} />
          </div>
        )}

        {activeTab === "stats" && (
          <div className={cn(
            isMobile ? "space-y-3" : "space-y-4"
          )}>
            <MyStatsTabCard 
              match={selectedFixture} 
              onTabChange={setActiveTab}
            />
          </div>
        )}

        {activeTab === "lineups" && (
          <div className={cn(
            isMobile ? "space-y-3" : "space-y-4"
          )}>
            <MyLineupsTabsCard match={selectedFixture} />
          </div>
        )}

        {activeTab === "trends" && (
          <div className={cn(
            isMobile ? "space-y-3" : "space-y-4"
          )}>
            <MyTrendsTabsCard match={selectedFixture} />
          </div>
        )}

        {activeTab === "h2h" && (
          <div className={cn(
            isMobile ? "space-y-3" : "space-y-4"
          )}>
            <MyHeadtoheadTabsCard match={selectedFixture} />
          </div>
        )}
      </div>




      {/* Conditional rendering based on match status */}
      {(() => {
        const matchStatus = selectedFixture?.fixture?.status?.short;
        const isLive = [
          "1H",
          "2H",
          "LIVE",
          "LIV",
          "HT",
          "ET",
          "P",
          "INT",
        ].includes(matchStatus);
        const isEnded = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "PST", "CANC", "SUSP"].includes(matchStatus);
        const isUpcoming = ["NS", "TBD"].includes(matchStatus);

        console.log(`🔍 [MyMainLayoutRight] Match ${selectedFixture?.fixture?.id} status detection:`, {
          matchStatus,
          isLive,
          isEnded,
          isUpcoming,
          fixtureStatus: selectedFixture?.fixture?.status
        });

        console.log(`📋 [MyMainLayoutRight] Complete selectedFixture data:`, {
          fixtureId: selectedFixture?.fixture?.id,
          fixtureDate: selectedFixture?.fixture?.date,
          status: selectedFixture?.fixture?.status,
          homeTeam: selectedFixture?.teams?.home,
          awayTeam: selectedFixture?.teams?.away,
          league: selectedFixture?.league,
          goals: selectedFixture?.goals,
          events: selectedFixture?.events?.length || 0,
          fullObject: selectedFixture
        });

        return (
          <>

            {/* For upcoming matches, neither component is shown */}
          </>
        );
      })()}

</div>
  );
};

export default MyMainLayoutRight;