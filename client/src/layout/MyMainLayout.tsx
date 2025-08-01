import React, { useState } from 'react';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import MyLiveAction from '@/components/matches/MyLiveAction';

import MyMatchTabCard from '@/components/matches/MyMatchTabCard';
import MyLineupsTabsCard from '@/components/matches/MyLineupsTabsCard';
import MyStatsTabCard from '@/components/matches/MyStatsTabCard';
import MyTrendsTabsCard from '@/components/matches/MyTrendsTabsCard';
import MyHeadtoheadTabsCard from '@/components/matches/MyHeadtoheadTabsCard';

interface MyMainLayoutProps {
  selectedMatchId?: number;
  selectedMatch?: any;
  children?: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const MyMainLayout: React.FC<MyMainLayoutProps> = ({ 
  selectedMatchId, 
  selectedMatch, 
  children,
  activeTab,
  onTabChange
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<string>("match");
  const currentActiveTab = activeTab || internalActiveTab;

  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };
  const isLive = selectedMatch?.fixture?.status?.short === 'LIVE' || 
                selectedMatch?.fixture?.status?.short === 'HT' ||
                selectedMatch?.fixture?.status?.short === '1H' ||
                selectedMatch?.fixture?.status?.short === '2H' ||
                selectedMatch?.fixture?.status?.short === 'LIV' ||
                selectedMatch?.fixture?.status?.short === 'ET' ||
                selectedMatch?.fixture?.status?.short === 'P' ||
                selectedMatch?.fixture?.status?.short === 'INT' ||
                selectedMatch?.fixture?.status?.short === 'SUSP' ||
                selectedMatch?.fixture?.status?.short === 'BT';

  return (
    <div className="w-full space-y-6">
      {/* MyLiveAction component - show for live matches */}
      {isLive && (
        <MyLiveAction 
          matchId={selectedMatchId}
          homeTeam={selectedMatch?.teams?.home}
          awayTeam={selectedMatch?.teams?.away}
          status={selectedMatch?.fixture?.status?.short}
          className=""
        />
      )}



      {/* Tab Content for Selected Match */}
      {selectedMatch && (
        <div className="mt-6">
          {currentActiveTab === "match" && (
            <MyMatchTabCard match={selectedMatch} />
          )}

          {currentActiveTab === "stats" && (
            <MyStatsTabCard match={selectedMatch} />
          )}

          {currentActiveTab === "lineups" && (
            <MyLineupsTabsCard match={selectedMatch} />
          )}

          {currentActiveTab === "trends" && (
            <MyTrendsTabsCard match={selectedMatch} />
          )}

          {currentActiveTab === "h2h" && (
            <MyHeadtoheadTabsCard match={selectedMatch} />
          )}
        </div>
      )}

      {/* Any additional children content */}
      {children && (
        <div className="mt-6">
          {children}
        </div>
      )}
      <MobileBottomNav />
    </div>
  );
};

export default MyMainLayout;