
import React from 'react';
import { Calendar as CalendarIcon, Star } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';

interface FixtureProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
}

export const MatchFixturesCard = ({ fixtures, onMatchClick }: FixtureProps) => {
  // Group fixtures by league
  const fixturesByLeague = fixtures.reduce((acc: any, fixture: any) => {
    const leagueId = fixture.league.id;
    if (!acc[leagueId]) {
      acc[leagueId] = {
        league: fixture.league,
        fixtures: []
      };
    }
    acc[leagueId].fixtures.push(fixture);
    return acc;
  }, {});

  const renderFixture = (fixture: any) => (
    <div 
      key={fixture.fixture.id}
      onClick={() => onMatchClick(fixture.fixture.id)}
      className="hover:bg-gray-50 cursor-pointer border-b last:border-b-0 py-4"
    >
      <div className="grid grid-cols-7 items-center px-4">
        <div className="col-span-3 flex items-center justify-end space-x-3">
          <span className="font-medium text-right">{fixture.teams.home.name}</span>
          <img 
            src={fixture.teams.home.logo}
            alt={fixture.teams.home.name}
            className="h-6 w-6 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=Team';
            }}
          />
        </div>

        <div className="col-span-1 flex justify-center font-semibold">
          <span className="px-3 rounded text-gray-500">
            {fixture.fixture.status.short === "FT" 
              ? `${fixture.goals.home} - ${fixture.goals.away}`
              : "-"
            }
          </span>
        </div>

        <div className="col-span-3 flex items-center space-x-3">
          <img 
            src={fixture.teams.away.logo}
            alt={fixture.teams.away.name}
            className="h-6 w-6 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=Team';
            }}
          />
          <span className="font-medium">{fixture.teams.away.name}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pt-10">
      {Object.values(fixturesByLeague).map((leagueData: any) => (
        <Card key={leagueData.league.id} className="bg-white shadow-md">
          <CardHeader className="p-4 border-b border-gray-100">
            <div className="flex items-center">
              <img 
                src={leagueData.league.logo}
                alt={leagueData.league.name}
                className="h-6 w-6 mr-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                }}
              />
              <span className="font-semibold text-gray-800">{leagueData.league.name}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {leagueData.fixtures.map(renderFixture)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MatchFixturesCard;
