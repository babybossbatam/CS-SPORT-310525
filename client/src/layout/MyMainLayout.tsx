import React from 'react';
import MyLiveAction from '@/components/matches/MyLiveAction';
import MyLMTLive from '@/components/matches/MyLMTLive';
import MyNewLMT from '@/components/matches/MyNewLMT';

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