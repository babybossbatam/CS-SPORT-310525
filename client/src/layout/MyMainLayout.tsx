import React from 'react';
import MyLiveAction from '@/components/matches/MyLiveAction';
import MyLiveMatchTracker from '@/components/matches/MyLiveMatchTracker';
import MyLiveTrackerNew from '@/components/matches/MyLiveTrackerNew';

interface MyMainLayoutProps {
  selectedMatchId?: number;
  selectedMatch?: any;
  children?: React.ReactNode;
}

const MyMainLayout: React.FC<MyMainLayoutProps> = ({ 
  selectedMatchId, 
  selectedMatch, 
  children 
}) => {
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

      {/* MyLiveTrackerNew component - enhanced live tracker for live matches */}
      {isLive && selectedMatchId && (
        <MyLiveTrackerNew
          matchId={selectedMatchId}
          homeTeam={selectedMatch?.teams?.home}
          awayTeam={selectedMatch?.teams?.away}
          isLive={isLive}
          className=""
        />
      )}

      {/* MyLiveMatchTracker component - show below MyLiveAction for live matches */}
      {isLive && selectedMatchId && (
        <MyLiveMatchTracker
          matchId={selectedMatchId}
          homeTeam={selectedMatch?.teams?.home}
          awayTeam={selectedMatch?.teams?.away}
          isLive={isLive}
          className=""
        />
      )}

      {/* Any additional children content */}
      {children && (
        <div className="mt-6">
          {children}
        </div>
      )}
    </div>
  );
};

export default MyMainLayout;