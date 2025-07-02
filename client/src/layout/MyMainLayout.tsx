import React from 'react';
import MyLiveAction from '@/components/matches/MyLiveAction';
import MyLiveMatchTracker from '@/components/matches/MyLiveMatchTracker';

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
                selectedMatch?.fixture?.status?.short === '2H';

  return (
    <div className="w-full space-y-6">
      {/* MyLiveAction component */}
      <MyLiveAction 
        matchId={selectedMatchId}
        homeTeam={selectedMatch?.teams?.home}
        awayTeam={selectedMatch?.teams?.away}
        status={selectedMatch?.fixture?.status?.short}
        className="mb-6"
      />

      {/* MyLiveMatchTracker component - only show for live matches or when a match is selected */}
      {(selectedMatchId || isLive) && (
        <MyLiveMatchTracker
          matchId={selectedMatchId}
          homeTeam={selectedMatch?.teams?.home}
          awayTeam={selectedMatch?.teams?.away}
          isLive={isLive}
          className="mb-6"
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