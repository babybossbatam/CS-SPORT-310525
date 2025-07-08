
import React from 'react';
import MatchPrediction from './MatchPrediction';
import MyHighlights from './MyHighlights';
import MyLiveAction from './MyLiveAction';
import MyMatchEventNew from './MyMatchEventNew';

interface MyMatchTabCardProps {
  match: any;
}

const MyMatchTabCard = ({ match }: MyMatchTabCardProps) => {
  if (!match) return null;

  return (
    <>
      {/* Match Prediction */}
      <div className="space-y-2">
        
        <MatchPrediction 
          homeTeam={match.teams?.home}
          awayTeam={match.teams?.away}
          fixtureId={match.fixture?.id}
        />
      </div>

      {/* Match Highlights */}
      <div className="space-y-2">
       
        <MyHighlights 
          homeTeam={match.teams?.home?.name || "Unknown Team"}
          awayTeam={match.teams?.away?.name || "Unknown Team"}
          leagueName={match.league?.name || "Unknown League"}
          matchStatus={match.fixture?.status?.short}
        />
      </div>

      {/* Live Action */}
      <div className="space-y-2">
       
        <MyLiveAction 
          matchId={match.fixture?.id}
          homeTeam={match.teams?.home}
          awayTeam={match.teams?.away}
          status={match.fixture?.status?.short}
        />
      </div>

      {/* Match Events */}
      <div className="space-y-2">
        
        <MyMatchEventNew 
          fixtureId={match.fixture?.id}
          homeTeam={match.teams?.home?.name}
          awayTeam={match.teams?.away?.name}
          matchData={match}
          theme="light"
        />
      </div>
    </>
  );
};

export default MyMatchTabCard;
