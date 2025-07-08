import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface MyHeadtoheadTabsCardProps {
  match?: any;
}

const MyHeadtoHeadTabCard: React.FC<MyHeadtoheadTabsCardProps> = ({ match }) => {
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

  const homeTeam = match.teams?.home;
  const awayTeam = match.teams?.away;

  // Sample H2H data - in real implementation, this would come from API
  const h2hData = {
    totalMatches: 8,
    homeWins: 3,
    awayWins: 3,
    draws: 2,
    recentMatches: [
      {
        date: '2024-03-15',
        homeTeam: homeTeam?.name,
        awayTeam: awayTeam?.name,
        homeScore: 2,
        awayScore: 1,
        competition: 'Premier League'
      },
      {
        date: '2023-11-28',
        homeTeam: awayTeam?.name,
        awayTeam: homeTeam?.name,
        homeScore: 0,
        awayScore: 0,
        competition: 'Premier League'
      },
      {
        date: '2023-08-12',
        homeTeam: homeTeam?.name,
        awayTeam: awayTeam?.name,
        homeScore: 1,
        awayScore: 3,
        competition: 'Premier League'
      },
      {
        date: '2023-04-20',
        homeTeam: awayTeam?.name,
        awayTeam: homeTeam?.name,
        homeScore: 2,
        awayScore: 2,
        competition: 'Premier League'
      },
      {
        date: '2022-12-08',
        homeTeam: homeTeam?.name,
        awayTeam: awayTeam?.name,
        homeScore: 1,
        awayScore: 0,
        competition: 'Premier League'
      }
    ]
  };

  const getResultColor = (homeScore: number, awayScore: number, isHomeTeamFirst: boolean) => {
    if (homeScore === awayScore) return 'text-gray-600';
    const homeWon = homeScore > awayScore;
    if (isHomeTeamFirst) {
      return homeWon ? 'text-green-600' : 'text-red-600';
    } else {
      return homeWon ? 'text-red-600' : 'text-green-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Head to Head Record</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* Overall Record */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Overall Record</h3>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{h2hData.homeWins}</div>
                <div className="text-sm text-gray-600">{homeTeam?.name} wins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">{h2hData.draws}</div>
                <div className="text-sm text-gray-600">Draws</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{h2hData.awayWins}</div>
                <div className="text-sm text-gray-600">{awayTeam?.name} wins</div>
              </div>
            </div>
            <div className="text-center mt-3 text-sm text-gray-500">
              Total matches: {h2hData.totalMatches}
            </div>
          </div>
        </div>

        {/* Recent Meetings */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Recent Meetings</h3>

          <div className="space-y-3">
            {h2hData.recentMatches.map((match, index) => {
              const isHomeTeamFirst = match.homeTeam === homeTeam?.name;
              return (
                <div key={index} className="border rounded-lg p-3 bg-white">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1">
                        {format(new Date(match.date), 'MMM dd, yyyy')} • {match.competition}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          {match.homeTeam} vs {match.awayTeam}
                        </div>
                        <div className={`text-lg font-bold ${getResultColor(match.homeScore, match.awayScore, isHomeTeamFirst)}`}>
                          {match.homeScore} - {match.awayScore}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Statistics */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Key Statistics</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Average Goals per Game</div>
              <div className="text-2xl font-bold text-blue-800">2.3</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Clean Sheets</div>
              <div className="text-2xl font-bold text-green-800">25%</div>
            </div>
          </div>
        </div>

        {/* Historical Note */}
        <div className="bg-amber-50 p-4 rounded-lg">
          <h4 className="font-medium text-amber-800 mb-2">Historical Context</h4>
          <p className="text-sm text-amber-700">
            These teams have faced each other {h2hData.totalMatches} times in recent years, 
            with a fairly balanced record. Their matches tend to be competitive and 
            entertaining for neutral fans.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyHeadtoHeadTabCard;