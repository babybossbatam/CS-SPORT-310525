
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
      className={`flex relative h-[53px] rounded-md transition-all duration-300 ease-in-out opacity-100 mt-[-8px] ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="w-full h-full flex justify-between relative">
        {/* Home team colored bar and logo */}
        <div 
          className="h-full w-[calc(50%-67px)] ml-[77px] transition-all duration-500 ease-in-out opacity-100 relative" 
          style={{ 
            background: getTeamColor(homeTeam.id),
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <div 
            className="absolute left-[-32px] z-20 w-[64px] h-[64px] bg-white/10 rounded-full p-2 transition-transform duration-300 ease-in-out hover:scale-110 opacity-100 contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            style={{
              top: "calc(50% - 32px)",
              cursor: onClick ? 'pointer' : 'default'
            }}
          >
            <img
              src={homeTeam.logo || '/assets/fallback-logo.svg'}
              alt={homeTeam.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== '/assets/fallback-logo.svg') {
                  target.src = '/assets/fallback-logo.svg';
                }
              }}
            />
          </div>
        </div>

        {/* VS section with score */}
        <div 
          className="absolute text-white font-bold text-sm rounded-full h-[52px] w-[52px] flex items-center justify-center z-30 border-2 border-white overflow-hidden transition-all duration-300 ease-in-out hover:scale-110 opacity-100"
          style={{
            background: '#a00000',
            left: 'calc(50% - 26px)',
            top: 'calc(50% - 26px)',
            minWidth: '52px'
          }}
        >
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
            <span className="vs-text font-bold">VS</span>
          )}
        </div>

        {/* Away team colored bar and logo */}
        <div 
          className="h-full w-[calc(50%-67px)] mr-[77px] transition-all duration-500 ease-in-out opacity-100" 
          style={{ 
            background: getTeamColor(awayTeam.id),
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <div
            className="absolute right-[41px] z-20 w-[64px] h-[64px] bg-white/10 rounded-full p-2 transition-transform duration-300 ease-in-out hover:scale-110 opacity-100 contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            style={{
              top: "calc(50% - 32px)",
              cursor: onClick ? 'pointer' : 'default'
            }}
          >
            <img
              src={awayTeam.logo || '/assets/fallback-logo.svg'}
              alt={awayTeam.name}
              className="w-full h-full object-contain"
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
    </div>
  );
};

export default MyColoredBar;
