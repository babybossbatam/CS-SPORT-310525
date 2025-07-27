
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
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
    id: 1,
    name: 'FIBA World Cup',
    country: 'International',
    logo: 'https://media.api-sports.io/basketball/leagues/1.png',
    flag: 'https://media.api-sports.io/flags/world.svg',
    season: 2024,
    current: true
  },
  {
    id: 127,
    name: 'ACB',
    country: 'Spain',
    logo: 'https://media.api-sports.io/basketball/leagues/127.png',
    flag: 'https://media.api-sports.io/flags/es.svg',
    season: 2024,
    current: true
  },
  {
    id: 2,
    name: 'Olympics Basketball - Men',
    country: 'Olympics',
    logo: 'https://media.api-sports.io/basketball/leagues/2.png',
    flag: 'https://media.api-sports.io/flags/olympic.svg',
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
    id: 133,
    name: 'Lega A',
    country: 'Italy',
    logo: 'https://media.api-sports.io/basketball/leagues/133.png',
    flag: 'https://media.api-sports.io/flags/it.svg',
    season: 2024,
    current: true
  },
  {
    id: 143,
    name: 'BBL',
    country: 'United Kingdom',
    logo: 'https://media.api-sports.io/basketball/leagues/143.png',
    flag: 'https://media.api-sports.io/flags/gb.svg',
    season: 2024,
    current: true
  },
  {
    id: 122,
    name: 'Eurobasket',
    country: 'Europe',
    logo: 'https://media.api-sports.io/basketball/leagues/122.png',
    flag: 'https://media.api-sports.io/flags/eu.svg',
    season: 2024,
    current: true
  },
  {
    id: 134,
    name: 'LNB Élite',
    country: 'France',
    logo: 'https://media.api-sports.io/basketball/leagues/134.png',
    flag: 'https://media.api-sports.io/flags/fr.svg',
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
        <CardTitle className="text-base font-semibold text-gray-900">
          Popular Leagues
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-4">
        {popularBasketballLeagues.map((league) => (
          <div
            key={league.id}
            onClick={() => handleLeagueClick(league.id)}
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex-shrink-0">
                <img
                  src={league.logo}
                  alt={league.name}
                  className="w-full h-full object-contain rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {league.name}
                </span>
                <span className="text-xs text-gray-500">
                  {league.country}
                </span>
              </div>
            </div>
            <Star 
              className="w-5 h-5 text-gray-300 hover:text-blue-500 transition-colors cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation();
                // Handle star click for favorites
                console.log(`⭐ Starred league: ${league.name}`);
              }}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MyBasketPopularLeagues;
