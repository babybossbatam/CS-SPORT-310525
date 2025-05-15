import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

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
    <>
      <div 
        className={`flex relative h-[36px] rounded-md ${compact ? 'mb-4' : 'mb-8'}`}
        onClick={onClick}
        style={{ 
          cursor: onClick ? 'pointer' : 'default'
        }}
      >
        <div className="w-full h-full flex justify-between relative">
          {/* Country name */}
          <div className="absolute right-4 text-black dark:text-white font-bold text-sm uppercase text-right bg-white/10 px-2 py-1 rounded" style={{top: "calc(50% - 10px)"}}>
            {league?.country || 'Country'}
          </div>
        </div>
      </div>
    </>
  );
}

export default LeagueScoreboard;