
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

interface MyMainLayoutRightProps {
  selectedFixture: any;
  onClose: () => void;
}

const MyMainLayoutRight: React.FC<MyMainLayoutRightProps> = ({ selectedFixture, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>("match");

  return (
    <>
      <ScoreDetailsCard
        currentFixture={selectedFixture}
        onClose={onClose}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === "match" && (
        <MyMatchTabCard match={selectedFixture} />
      )}

      {activeTab === "stats" && (
        <MyStatsTabCard match={selectedFixture} />
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


      
      {/* Match Predictions Card */}
      <MatchPredictionsCard
        homeTeam={selectedFixture?.teams?.home?.name || "Home Team"}
        awayTeam={selectedFixture?.teams?.away?.name || "Away Team"}
        homeTeamLogo={selectedFixture?.teams?.home?.logo}
        awayTeamLogo={selectedFixture?.teams?.away?.logo}
        matchStatus={selectedFixture?.fixture?.status?.short}
        fixtureId={selectedFixture?.fixture?.id}
        homeTeamId={selectedFixture?.teams?.home?.id}
        awayTeamId={selectedFixture?.teams?.away?.id}
        leagueId={selectedFixture?.league?.id}
      />

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

        return (
          <>
            {/* Show MyLiveAction only for live matches, not for finished matches */}
            {isLive && !isEnded && (
              <MyLiveAction
                matchId={selectedFixture?.fixture?.id}
                homeTeam={selectedFixture?.teams?.home}
                awayTeam={selectedFixture?.teams?.away}
                status={selectedFixture?.fixture?.status?.short}
              />
            )}

            {/* Show MyHighlights for finished matches */}
            {isEnded && (
              <MyHighlights
                homeTeam={selectedFixture?.teams?.home?.name}
                awayTeam={selectedFixture?.teams?.away?.name}
                leagueName={selectedFixture?.league?.name}
                matchStatus={selectedFixture?.fixture?.status?.short}
              />
            )}

            {/* For upcoming matches, neither component is shown */}
          </>
        );
      })()}

     
      </>
  );
};

export default MyMainLayoutRight;
