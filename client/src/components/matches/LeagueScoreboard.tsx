
import { useState, useEffect } from 'react';

interface LeagueScoreboardProps {
  league: {
    id: number;
    name: string;
    logo: string;
    country: string;
  };
  onClick?: () => void;
  homeTeamColor?: string;
  awayTeamColor?: string;
  compact?: boolean;
}

export function LeagueScoreboard({ 
  league,
  onClick, 
  homeTeamColor = '#6f7c93',
  awayTeamColor = '#8b0000',
  compact = false 
}: LeagueScoreboardProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`flex relative rounded-lg bg-gradient-to-r from-[${homeTeamColor}] to-[${awayTeamColor}] ${compact ? 'h-10 mb-4' : 'h-12 mb-6'} transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="w-full h-full flex items-center px-4">
        {/* League logo */}
        <img 
          src={league?.logo} 
          alt={league?.name}
          className="h-6 w-6 object-contain mr-3"
        />
        
        {/* League name */}
        <div className="text-white font-semibold text-sm">
          {league?.name}
        </div>
        
        {/* Country name */}
        <div className="ml-auto text-white font-medium text-sm uppercase">
          {league?.country}
        </div>
      </div>
    </div>
  );
}

export default LeagueScoreboard;
