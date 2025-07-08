
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import MyMatchStats from './MyMatchStats';

interface MyStatsTabCardProps {
  match: any;
}

const MyStatsTabCard = ({ match }: MyStatsTabCardProps) => {
  if (!match) return null;

  return (
    <Card className="mt-4">
      <CardContent className="p-0">
        <div className="space-y-2 p-4 pb-0">
          <h3 className="text-lg font-semibold text-gray-800">Match Statistics</h3>
        </div>
        <MyMatchStats
          fixtureId={match.fixture?.id}
          homeTeam={match.teams?.home}
          awayTeam={match.teams?.away}
          onClose={() => {}} // No close functionality needed in tab card
        />
      </CardContent>
    </Card>
  );
};

export default MyStatsTabCard;
