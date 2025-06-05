import React from 'react';

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
}

const MyColoredBar: React.FC<MyColoredBarProps> = ({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  onClick,
  getTeamColor,
  className = ""
}) => {
  const isLiveOrFinished = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT', 'FT', 'AET', 'PEN'].includes(status);

  return (
    <div 
      className={`flex items-center h-16 rounded-full overflow-hidden shadow-lg relative ${onClick ? 'cursor-pointer hover:shadow-xl' : ''} ${className}`}
      onClick={onClick}
      style={{
        background: `linear-gradient(to right, ${getTeamColor(homeTeam.id)} 0%, ${getTeamColor(homeTeam.id)} 45%, #8B0000 45%, #8B0000 55%, ${getTeamColor(awayTeam.id)} 55%, ${getTeamColor(awayTeam.id)} 100%)`
      }}
    >
      {/* Home Team Side */}
      <div className="flex items-center h-full w-[45%] relative">
        {/* Home Team Logo Circle */}
        <div className="absolute left-2 w-12 h-12 bg-white rounded-full p-1 shadow-lg z-10">
          <img
            src={homeTeam.logo || '/assets/fallback-logo.svg'}
            alt={homeTeam.name}
            className="w-full h-full object-contain rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== '/assets/fallback-logo.svg') {
                target.src = '/assets/fallback-logo.svg';
              }
            }}
          />
        </div>

        {/* Home Team Name */}
        <div className="ml-16 text-white font-bold text-sm uppercase tracking-wide truncate pr-4">
          {homeTeam.name}
        </div>
      </div>

      {/* VS Section in Middle */}
      <div className="flex items-center justify-center w-[10%] h-full">
        <div className="bg-white text-red-600 font-bold text-lg px-3 py-1 rounded-full shadow-md">
          {isLiveOrFinished ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-xs">
                <span>{homeScore ?? 0}</span>
                <span>-</span>
                <span>{awayScore ?? 0}</span>
              </div>
              {['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status) && (
                <div className="text-[8px] animate-pulse">LIVE</div>
              )}
            </div>
          ) : (
            'VS'
          )}
        </div>
      </div>

      {/* Away Team Side */}
      <div className="flex items-center justify-end h-full w-[45%] relative">
        {/* Away Team Name */}
        <div className="mr-16 text-white font-bold text-sm uppercase tracking-wide truncate pl-4 text-right">
          {awayTeam.name}
        </div>

        {/* Away Team Logo Circle */}
        <div className="absolute right-2 w-12 h-12 bg-white rounded-full p-1 shadow-lg z-10">
          <img
            src={awayTeam.logo || '/assets/fallback-logo.svg'}
            alt={awayTeam.name}
            className="w-full h-full object-contain rounded-full"
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