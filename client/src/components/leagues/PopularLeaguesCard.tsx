
import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import MyNewLeagueLogo from '@/components/common/MyNewLeagueLogo';

interface League {
  id: number;
  name: string;
  country: string;
}

interface PopularLeaguesCardProps {
  className?: string;
}

const PopularLeaguesCard: React.FC<PopularLeaguesCardProps> = ({ className = '' }) => {
  const [favoriteLeagues, setFavoriteLeagues] = useState<number[]>([]);

  const popularLeagues: League[] = [
    { id: 2, name: "UEFA Champions League Qualifiers", country: "Europe" },
    { id: 3, name: "UEFA Champions League", country: "Europe" },
    { id: 39, name: "Premier League", country: "England" },
    { id: 1, name: "FA Cup", country: "England" },
    { id: 140, name: "LaLiga", country: "Spain" },
    { id: 135, name: "Serie A", country: "Italy" },
    { id: 5, name: "UEFA Europa League", country: "Europe" },
    { id: 4, name: "Community Shield", country: "England" },
    { id: 48, name: "EFL Cup", country: "England" },
    { id: 78, name: "Bundesliga", country: "Germany" }
  ];

  const toggleFavorite = (leagueId: number) => {
    setFavoriteLeagues(prev => 
      prev.includes(leagueId) 
        ? prev.filter(id => id !== leagueId)
        : [...prev, leagueId]
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <h3 className="text-lg font-semibold text-gray-900">Popular Leagues</h3>
      </CardHeader>
      <CardContent className="space-y-0">
        {popularLeagues.map((league) => (
          <div 
            key={league.id} 
            className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-200 px-2 rounded-md"
          >
            <div className="flex items-center space-x-3">
              <MyNewLeagueLogo
                leagueId={league.id}
                leagueName={league.name}
                size="24px"
                className="flex-shrink-0"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 leading-tight">
                  {league.name}
                </span>
                <span className="text-xs text-gray-500">
                  {league.country}
                </span>
              </div>
            </div>
            <button
              onClick={() => toggleFavorite(league.id)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors duration-200"
              aria-label={favoriteLeagues.includes(league.id) ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star 
                size={16} 
                className={`transition-colors duration-200 ${
                  favoriteLeagues.includes(league.id) 
                    ? 'fill-blue-500 text-blue-500' 
                    : 'text-gray-400 hover:text-blue-500'
                }`}
              />
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PopularLeaguesCard;
