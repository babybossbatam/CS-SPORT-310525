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

interface MyMainLayoutRightProps {
  selectedFixture: any;
  onClose: () => void;
}

const MyMainLayoutRight: React.FC<MyMainLayoutRightProps> = ({ selectedFixture, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>("match");

  // Debug logging to verify data reception from MyNewLeague2
  console.log(`🔍 [MyMainLayoutRight] Received selectedFixture:`, {
    fixtureId: selectedFixture?.fixture?.id,
    teams: `${selectedFixture?.teams?.home?.name} vs ${selectedFixture?.teams?.away?.name}`,
    league: selectedFixture?.league?.name,
    status: selectedFixture?.fixture?.status?.short,
    fullData: selectedFixture
  });

  return (
    <div className="overflow-y-auto min-h-screen">
      <ScoreDetailsCard
        currentFixture={selectedFixture}
        onClose={onClose}
        activeTab={activeTab}
        onTabChange={setActiveTab}
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

<button
        onClick={onClose}
        className={cn(
          "text-gray-500 hover:text-gray-700",
          "md:text-sm text-lg md:p-1 p-2", // Larger on mobile for easier tapping
        )}
      >
        ✕
      </button>
    </div>
  );
};

export default MyMainLayoutRight;