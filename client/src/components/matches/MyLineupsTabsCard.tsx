import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MyLineupsTabsCardProps {
  match?: any;
}

const MyLineupsTabsCard: React.FC<MyLineupsTabsCardProps> = ({ match }) => {
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
        <CardTitle>
          {isUpcoming ? "Probable Lineups" : "Team Lineups"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-6">
          {/* Home Team Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <img 
                src={homeTeam?.logo || "/assets/fallback-logo.png"} 
                alt={homeTeam?.name}
                className="w-6 h-6 object-contain"
              />
              {homeTeam?.name}
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-center text-gray-600 py-8">
                <div className="text-4xl mb-2">⚽</div>
                <p className="text-sm">
                  {isUpcoming 
                    ? "Probable lineup will be available closer to kickoff"
                    : "Lineup data not available for this match"
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Away Team Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <img 
                src={awayTeam?.logo || "/assets/fallback-logo.png"} 
                alt={awayTeam?.name}
                className="w-6 h-6 object-contain"
              />
              {awayTeam?.name}
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-center text-gray-600 py-8">
                <div className="text-4xl mb-2">⚽</div>
                <p className="text-sm">
                  {isUpcoming 
                    ? "Probable lineup will be available closer to kickoff"
                    : "Lineup data not available for this match"
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Formation Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Expected Formations</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
              <div className="text-center">
                <span className="font-medium">{homeTeam?.name}</span>
                <div className="text-lg font-bold">4-4-2</div>
              </div>
              <div className="text-center">
                <span className="font-medium">{awayTeam?.name}</span>
                <div className="text-lg font-bold">4-3-3</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyLineupsTabsCard;