import React from 'react';
import MatchPrediction from './MatchPrediction';
import MyHighlights from './MyHighlights';
import MyLiveAction from './MyLiveAction';
import MyMatchEventNew from './MyMatchEventNew';
import MyStatsTabCard from './MyStatsTabCard';

import MyShotmap from './MyShotmap';
import MyKeyPlayer from './MyKeyPlayer';

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

        // Check if match is truly live (not finished)
        const actuallyLive = [
          "1H",
          "2H", 
          "LIVE",
          "LIV",
          "HT",
          "ET",
          "P",
          "INT",
          "SUSP",
          "BT"
        ].includes(matchStatus);

        // Check if match is ended by status
        const isEnded = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "PST", "CANC", "SUSP"].includes(matchStatus);

        // Check if fixture indicates it's finished
        const fixtureFinished = match.fixture?.status?.long === "Match Finished" || 
                               match.fixture?.status?.short === "FT";

        // Final determination: if fixture is finished OR status indicates ended, treat as ended
        const finalIsEnded = isEnded || fixtureFinished;
        const finalIsLive = actuallyLive && !fixtureFinished && !isEnded;

        console.log(`🔍 [MyMatchTabCard] Match ${match.fixture?.id} status detection:`, {
          matchStatus,
          fixtureStatus: match.fixture?.status,
          actuallyLive,
          isEnded,
          fixtureFinished,
          finalIsLive,
          finalIsEnded
        });

        return (
          <>
            {/* Show MyHighlights for ended matches */}
            {finalIsEnded && (
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

            {/* Show MyLiveAction only for truly live matches */}
            {finalIsLive && (
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
         <MyStatsTabCard 
          match={match}
        />
      </div>



      {/* Shot Map */}
      <div className="space-y-2">

        <MyShotmap 
          match={match}
          fixtureId={match.fixture?.id}
          homeTeam={match.teams?.home?.name}
          awayTeam={match.teams?.away?.name}
        />
      </div>

      {/* Key Players */}
      <div className="space-y-2">

        <MyKeyPlayer 
          match={match}
          fixtureId={match.fixture?.id}
          homeTeam={match.teams?.home?.name}
          awayTeam={match.teams?.away?.name}
        />
      </div>
    </>
  );
};

export default MyMatchTabCard;