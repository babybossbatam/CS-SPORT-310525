
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MyCircularFlag from '@/components/common/MyCircularFlag';

interface BasketballLeague {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
  season: number;
  current: boolean;
}

const popularBasketballLeagues: BasketballLeague[] = [
  {
    id: 12,
    name: 'NBA',
    country: 'USA',
    logo: 'https://media.api-sports.io/basketball/leagues/12.png',
    flag: 'https://media.api-sports.io/flags/us.svg',
    season: 2024,
    current: true
  },
  {
    id: 120,
    name: 'EuroLeague',
    country: 'Europe',
    logo: 'https://media.api-sports.io/basketball/leagues/120.png',
    flag: 'https://media.api-sports.io/flags/eu.svg',
    season: 2024,
    current: true
  },
  {
    id: 127,
    name: 'Liga ACB',
    country: 'Spain',
    logo: 'https://media.api-sports.io/basketball/leagues/127.png',
    flag: 'https://media.api-sports.io/flags/es.svg',
    season: 2024,
    current: true
  },
  {
    id: 133,
    name: 'Lega Basket Serie A',
    country: 'Italy',
    logo: 'https://media.api-sports.io/basketball/leagues/133.png',
    flag: 'https://media.api-sports.io/flags/it.svg',
    season: 2024,
    current: true
  },
  {
    id: 132,
    name: 'Bundesliga',
    country: 'Germany',
    logo: 'https://media.api-sports.io/basketball/leagues/132.png',
    flag: 'https://media.api-sports.io/flags/de.svg',
    season: 2024,
    current: true
  },
  {
    id: 134,
    name: 'LNB Pro A',
    country: 'France',
    logo: 'https://media.api-sports.io/basketball/leagues/134.png',
    flag: 'https://media.api-sports.io/flags/fr.svg',
    season: 2024,
    current: true
  },
  {
    id: 122,
    name: 'EuroCup',
    country: 'Europe',
    logo: 'https://media.api-sports.io/basketball/leagues/122.png',
    flag: 'https://media.api-sports.io/flags/eu.svg',
    season: 2024,
    current: true
  },
  {
    id: 117,
    name: 'CBA',
    country: 'China',
    logo: 'https://media.api-sports.io/basketball/leagues/117.png',
    flag: 'https://media.api-sports.io/flags/cn.svg',
    season: 2024,
    current: true
  }
];

const MyBasketPopularLeagues: React.FC = () => {
  const handleLeagueClick = (leagueId: number) => {
    console.log(`🏀 [MyBasketPopularLeagues] Clicked league: ${leagueId}`);
    // Navigate to league details or filter matches by league
  };

  return (
    <Card className="w-full shadow-md bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-800">
          Popular Basketball Leagues
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {popularBasketballLeagues.map((league) => (
          <div
            key={league.id}
            onClick={() => handleLeagueClick(league.id)}
            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-2 flex-1">
              <MyCircularFlag 
                countryName={league.country}
                size="small"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {league.name}
                </p>
                <p className="text-xs text-gray-500">
                  {league.country}
                </p>
              </div>
            </div>
            {league.current && (
              <Badge variant="outline" className="text-xs">
                Active
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MyBasketPopularLeagues;
