
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="mt-4">
      <CardContent className="p-4 space-y-6">
        {/* Match Prediction */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">Match Prediction</h3>
          <MatchPrediction 
            homeTeam={match.teams?.home}
            awayTeam={match.teams?.away}
            fixtureId={match.fixture?.id}
          />
        </div>

        {/* Match Highlights */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">Match Highlights</h3>
          <MyHighlights 
            homeTeam={match.teams?.home?.name || "Unknown Team"}
            awayTeam={match.teams?.away?.name || "Unknown Team"}
            leagueName={match.league?.name || "Unknown League"}
            matchStatus={match.fixture?.status?.short}
          />
        </div>

        {/* Live Action */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">Live Action</h3>
          <MyLiveAction 
            matchId={match.fixture?.id}
            homeTeam={match.teams?.home}
            awayTeam={match.teams?.away}
            status={match.fixture?.status?.short}
          />
        </div>

        {/* Match Events */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">Match Events</h3>
          <MyMatchEventNew 
            fixtureId={match.fixture?.id}
            homeTeam={match.teams?.home?.name}
            awayTeam={match.teams?.away?.name}
            matchData={match}
            theme="light"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MyMatchTabCard;
