import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MyMatchStats from './MyMatchStats';

interface MyStatsTabCardProps {
  match?: any;
}

const MyStatsTabCard: React.FC<MyStatsTabCardProps> = ({ match }) => {
  if (!match) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            No match data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const isUpcoming = match.fixture?.status?.short === "NS";
  const homeTeam = match.teams?.home;
  const awayTeam = match.teams?.away;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match Statistics</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isUpcoming ? (
          <div className="p-4">
            <div className="text-center text-gray-600 py-8">
              <div className="text-4xl mb-2">📊</div>
              <h3 className="text-lg font-medium mb-2">Statistics Coming Soon</h3>
              <p className="text-sm text-gray-500">
                Match statistics will be available once the game starts
              </p>
            </div>

            {/* Team Comparison Preview */}
            <div className="mt-6 space-y-4">
              <h4 className="font-medium text-center">Team Comparison Preview</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <img 
                    src={homeTeam?.logo || "/assets/fallback-logo.png"} 
                    alt={homeTeam?.name}
                    className="w-8 h-8 object-contain mx-auto mb-1"
                  />
                  <div className="font-medium truncate">{homeTeam?.name}</div>
                </div>
                <div className="text-center text-gray-500">
                  VS
                </div>
                <div className="text-center">
                  <img 
                    src={awayTeam?.logo || "/assets/fallback-logo.png"} 
                    alt={awayTeam?.name}
                    className="w-8 h-8 object-contain mx-auto mb-1"
                  />
                  <div className="font-medium truncate">{awayTeam?.name}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <MyMatchStats 
            fixtureId={match.fixture?.id}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            match={match}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default MyStatsTabCard;