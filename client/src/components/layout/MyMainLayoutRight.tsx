
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

  const tabs = [
    { id: "match", label: "Match", icon: "⚽" },
    { id: "stats", label: "Stats", icon: "📊" },
    { id: "lineups", label: "Lineups", icon: "👥" },
    { id: "trends", label: "Trends", icon: "📈" },
    { id: "h2h", label: "H2H", icon: "🔄" }
  ];

  return (
    <>
      <ScoreDetailsCard
        currentFixture={selectedFixture}
        onClose={onClose}
      />

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

     

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md p-4 mt-4">
        <div className="flex border-b border-gray-200 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-4">
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
        </div>
      </div>

      </>
  );
};

export default MyMainLayoutRight;
