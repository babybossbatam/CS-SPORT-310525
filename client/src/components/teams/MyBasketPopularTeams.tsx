
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MyWorldTeamLogo from '@/components/common/MyWorldTeamLogo';
import MyCircularFlag from '@/components/common/MyCircularFlag';

interface BasketballTeam {
  id: number;
  name: string;
  code: string;
  country: string;
  logo: string;
  league: {
    id: number;
    name: string;
  };
  isPopular: boolean;
}

const popularBasketballTeams: BasketballTeam[] = [
  {
    id: 145,
    name: 'Los Angeles Lakers',
    code: 'LAL',
    country: 'USA',
    logo: 'https://media.api-sports.io/basketball/teams/145.png',
    league: { id: 12, name: 'NBA' },
    isPopular: true
  },
  {
    id: 149,
    name: 'Golden State Warriors',
    code: 'GSW',
    country: 'USA',
    logo: 'https://media.api-sports.io/basketball/teams/149.png',
    league: { id: 12, name: 'NBA' },
    isPopular: true
  },
  {
    id: 150,
    name: 'Boston Celtics',
    code: 'BOS',
    country: 'USA',
    logo: 'https://media.api-sports.io/basketball/teams/150.png',
    league: { id: 12, name: 'NBA' },
    isPopular: true
  },
  {
    id: 155,
    name: 'Chicago Bulls',
    code: 'CHI',
    country: 'USA',
    logo: 'https://media.api-sports.io/basketball/teams/155.png',
    league: { id: 12, name: 'NBA' },
    isPopular: true
  },
  {
    id: 142,
    name: 'Miami Heat',
    code: 'MIA',
    country: 'USA',
    logo: 'https://media.api-sports.io/basketball/teams/142.png',
    league: { id: 12, name: 'NBA' },
    isPopular: true
  },
  {
    id: 1313,
    name: 'Real Madrid',
    code: 'RMA',
    country: 'Spain',
    logo: 'https://media.api-sports.io/basketball/teams/1313.png',
    league: { id: 120, name: 'EuroLeague' },
    isPopular: true
  },
  {
    id: 1314,
    name: 'FC Barcelona',
    code: 'FCB',
    country: 'Spain',
    logo: 'https://media.api-sports.io/basketball/teams/1314.png',
    league: { id: 120, name: 'EuroLeague' },
    isPopular: true
  },
  {
    id: 1329,
    name: 'Panathinaikos',
    code: 'PAO',
    country: 'Greece',
    logo: 'https://media.api-sports.io/basketball/teams/1329.png',
    league: { id: 120, name: 'EuroLeague' },
    isPopular: true
  },
  {
    id: 1343,
    name: 'Fenerbahçe',
    code: 'FEN',
    country: 'Turkey',
    logo: 'https://media.api-sports.io/basketball/teams/1343.png',
    league: { id: 120, name: 'EuroLeague' },
    isPopular: true
  },
  {
    id: 1377,
    name: 'CSKA Moscow',
    code: 'CSKA',
    country: 'Russia',
    logo: 'https://media.api-sports.io/basketball/teams/1377.png',
    league: { id: 120, name: 'EuroLeague' },
    isPopular: true
  }
];

const MyBasketPopularTeams: React.FC = () => {
  const handleTeamClick = (teamId: number) => {
    console.log(`🏀 [MyBasketPopularTeams] Clicked team: ${teamId}`);
    // Navigate to team details or filter matches by team
  };

  return (
    <div className="space-y-2">
      {popularBasketballTeams.map((team) => (
        <div
          key={team.id}
          onClick={() => handleTeamClick(team.id)}
          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
        >
          <div className="flex items-center space-x-2 flex-1">
            <MyWorldTeamLogo 
              teamId={team.id}
              teamName={team.name}
              logoUrl={team.logo}
              size="small"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {team.name}
              </p>
              <div className="flex items-center space-x-1">
                <MyCircularFlag 
                  countryName={team.country}
                  size="xs"
                />
                <p className="text-xs text-gray-500">
                  {team.league.name}
                </p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {team.code}
          </Badge>
        </div>
      ))}
    </div>
  );
};

export default MyBasketPopularTeams;
