
import React from 'react';
import { getCountryFlagWithFallbackSync } from '../../lib/flagUtils';

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface MyColoredBarProps {
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number | null;
  awayScore?: number | null;
  status: string;
  onClick?: () => void;
  getTeamColor: (teamId: number) => string;
  className?: string;
  league?: {
    country: string;
  };
}

const MyColoredBar: React.FC<MyColoredBarProps> = ({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  onClick,
  getTeamColor,
  className = "",
  league
}) => {
  const isLiveOrFinished = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT', 'FT', 'AET', 'PEN'].includes(status);

  // Get country flags - fallback to team logos if no country info
  const getHomeFlag = () => {
    if (league?.country && league.country !== 'World') {
      return getCountryFlagWithFallbackSync(league.country);
    }
    return homeTeam.logo || '/assets/fallback-logo.svg';
  };

  const getAwayFlag = () => {
    if (league?.country && league.country !== 'World') {
      return getCountryFlagWithFallbackSync(league.country);
    }
    return awayTeam.logo || '/assets/fallback-logo.svg';
  };

  return (
    <div 
      className={`flex relative h-[60px] rounded-lg overflow-hidden transition-all duration-300 ease-in-out opacity-100 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Home team section */}
      <div 
        className="flex-1 h-full flex items-center justify-start pl-16 pr-4 relative"
        style={{ 
          background: getTeamColor(homeTeam.id),
          transition: 'all 0.3s ease-in-out'
        }}
      >
        {/* Home team flag circle */}
        <div 
          className="absolute left-2 w-12 h-12 bg-white rounded-full p-1 shadow-lg z-10"
          style={{
            top: "calc(50% - 24px)"
          }}
        >
          <img
            src={getHomeFlag()}
            alt={homeTeam.name}
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== '/assets/fallback-logo.svg') {
                target.src = '/assets/fallback-logo.svg';
              }
            }}
          />
        </div>

        {/* Home team name */}
        <div className="text-white font-bold text-lg uppercase tracking-wide ml-2">
          {homeTeam.name}
        </div>
      </div>

      {/* VS section */}
      <div 
        className="w-20 h-full flex flex-col items-center justify-center bg-white text-red-600 font-bold text-xl relative z-20"
      >
        <span className="font-bold">VS</span>
      </div>

      {/* Away team section */}
      <div 
        className="flex-1 h-full flex items-center justify-end pr-16 pl-4 relative"
        style={{ 
          background: getTeamColor(awayTeam.id),
          transition: 'all 0.3s ease-in-out'
        }}
      >
        {/* Away team name */}
        <div className="text-white font-bold text-lg uppercase tracking-wide mr-2">
          {awayTeam.name}
        </div>

        {/* Away team flag circle */}
        <div 
          className="absolute right-2 w-12 h-12 bg-white rounded-full p-1 shadow-lg z-10"
          style={{
            top: "calc(50% - 24px)"
          }}
        >
          <img
            src={getAwayFlag()}
            alt={awayTeam.name}
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== '/assets/fallback-logo.svg') {
                target.src = '/assets/fallback-logo.svg';
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MyColoredBar;
