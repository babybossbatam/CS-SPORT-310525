
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

      {/* Conditional rendering based on match status */}
      {(() => {
        const matchStatus = match.fixture?.status?.short;
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

        console.log("🎬 [MyMatchTabCard] Match status check:", {
          matchStatus,
          isEnded,
          teams: `${match.teams?.home?.name} vs ${match.teams?.away?.name}`,
          willShowHighlights: isEnded
        });

        return (
          <>
            {/* Show MyHighlights only for ended matches */}
            {isEnded && (
              <div className="space-y-2">
                <MyHighlights 
                  homeTeam={match.teams?.home?.name || "Unknown Team"}
                  awayTeam={match.teams?.away?.name || "Unknown Team"}
                  leagueName={match.league?.name || "Unknown League"}
                  matchStatus={match.fixture?.status?.short}
                  match={match}
                />
              </div>
            )}

            {/* Show MyLiveAction only for live matches */}
            {isLive && !isEnded && (
              <div className="space-y-2">
                <MyLiveAction 
                  matchId={match.fixture?.id}
                  homeTeam={match.teams?.home}
                  awayTeam={match.teams?.away}
                  status={match.fixture?.status?.short}
                />
              </div>
            )}

            {/* For upcoming matches, neither component is shown */}
          </>
        );
      })()}

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
