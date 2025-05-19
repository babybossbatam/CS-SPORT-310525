import React, { useState, useEffect } from 'react';

interface EmptyScoreboardProps {
  onClick?: () => void;
  homeTeamColor?: string;
  awayTeamColor?: string;
  compact?: boolean;
}

export function EmptyScoreboard({ 
  onClick, 
  homeTeamColor = '#6f7c93',
  awayTeamColor = '#8b0000',
  compact = false 
}: EmptyScoreboardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`flex relative h-[53px] rounded-md ${compact ? 'mb-4' : 'mb-8'} transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} mt-[-8px]`}
      onClick={onClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <div className="w-full h-full flex justify-between relative">
        {/* Home team colored bar and logo */}
        <div className={`h-full w-[calc(50%-67px)] ml-[77px] transition-all duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} relative`} 
          style={{ 
            background: homeTeamColor,
            transition: 'all 0.3s ease-in-out'
          }}>
          <div 
            className={`absolute left-[-32px] z-20 w-[64px] h-[64px] bg-white/10 rounded-full p-2 transition-transform duration-300 ease-in-out hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0'} contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`}
            style={{
              cursor: onClick ? 'pointer' : 'default',
              top: "calc(50% - 32px)"
            }}
          />
        </div>

        <div className={`absolute left-[125px] text-white font-bold text-sm uppercase transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} max-w-[120px] truncate md:max-w-[200px]`} style={{top: "calc(50% - 8px)"}}>
          {/* Intentionally empty */}
        </div>

        {/* VS section */}
        <div 
          className={`absolute text-white font-bold text-sm rounded-full h-[52px] w-[52px] flex items-center justify-center z-30 border-2 border-white overflow-hidden transition-all duration-300 ease-in-out hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{
            background: '#a00000',
            left: 'calc(50% - 26px)',
            top: 'calc(50% - 26px)',
            minWidth: '52px'
          }}
        >
          <span className="vs-text font-bold">VS</span>
        </div>

        {/* Away team colored bar and logo */}
        <div className={`h-full w-[calc(50%-67px)] mr-[77px] transition-all duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
          style={{ 
            background: awayTeamColor,
            transition: 'all 0.3s ease-in-out'
          }}>
        </div>

        <div
          className={`absolute right-[41px] z-20 w-[64px] h-[64px] bg-white/10 rounded-full p-2 transition-transform duration-300 ease-in-out hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0'} contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`}
          style={{
            cursor: onClick ? 'pointer' : 'default',
            top: "calc(50% - 32px)"
          }}
        />

        <div className={`absolute right-[125px] text-white font-bold text-sm uppercase text-right transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} max-w-[120px] truncate md:max-w-[200px]`} style={{top: "calc(50% - 8px)"}}>
          {/* Intentionally empty */}
        </div>
      </div>
    </div>
  );
}

export default EmptyScoreboard;