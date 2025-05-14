
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
        className={`flex relative h-[36px] rounded-md ${compact ? 'mb-4' : 'mb-8'} transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClick}
        style={{ 
          cursor: onClick ? 'pointer' : 'default'
        }}
      >
        <div className="w-full h-full flex justify-between relative">
          {/* League logo */}
          <img 
            src={league?.logo}
            alt={league?.name || 'League'} 
            className={`absolute left-[1px] z-20 w-[72px] h-[72px] object-contain transition-transform duration-300 ease-in-out hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0'} contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`}
            style={{
              cursor: onClick ? 'pointer' : 'default',
              top: "calc(50% - 6px)"
            }}
            onClick={onClick}
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/72?text=' + (league?.name?.substring(0, 1) || 'L');
            }}
          />

          <div className={`absolute left-20 text-white font-bold text-sm uppercase transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`} style={{top: "calc(50% - 10px)", fontFamily: "Calibri"}}>
            {league?.name || 'League Name'}
          </div>

          {/* Colored bar */}
          <div className={`h-full w-full ml-[57px] transition-all duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
            style={{ 
              background: `linear-gradient(90deg, ${homeTeamColor} 0%, ${awayTeamColor} 100%)`,
              transition: 'all 0.3s ease-in-out'
            }}>
          </div>

          {/* Country name */}
          <div className={`absolute right-4 text-white font-bold text-sm uppercase text-right transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`} style={{top: "calc(50% - 10px)"}}>
            {league?.country || 'Country'}
          </div>
        </div>
      </div>

      {!compact && (
        <div className="flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors duration-200 mt-2">
          <span>ID: {league?.id}</span>
        </div>
      )}
    </>
  );
}

export default LeagueScoreboard;
