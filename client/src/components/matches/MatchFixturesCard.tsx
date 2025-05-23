
import React from 'react';
import { Calendar as CalendarIcon, Star, ChevronLeft, ChevronRight, ChevronDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';

interface FixtureProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
}

export const MatchFixturesCard = ({ fixtures, onMatchClick }: FixtureProps) => {
  const [selectedFilter, setSelectedFilter] = useState("Yesterday's Matches");
  
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
      <Card className="bg-white shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="relative">
                <button className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded-md">
                  <span className="font-medium">{selectedFilter}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-3 py-1 bg-neutral-800 text-white rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Live
              </button>
              <button className="flex items-center gap-1 px-3 py-1 hover:bg-gray-100 rounded-full text-sm">
                <Clock className="h-4 w-4" />
                By time
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
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
