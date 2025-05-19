
import { useState, useEffect } from 'react';
import { FixtureResponse } from '@/types/fixtures';
import { getTeamColor, getOpposingTeamColor } from '@/lib/colorUtils';

interface LeagueMatchScoreboardProps {
  match?: FixtureResponse;
  matches?: FixtureResponse[];
  onClick?: () => void;
  compact?: boolean;
}

export function LeagueMatchScoreboard({
  match,
  matches = [],
  compact = false,
  onClick
}: LeagueMatchScoreboardProps) {
  const allMatches = match ? [match, ...matches].slice(0, 5) : [];
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (allMatches.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentMatchIndex((prev) => (prev + 1) % allMatches.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [allMatches.length]);

  if (!match || allMatches.length === 0) {
    return (
      <div
        className={`flex relative h-[53px] rounded-md ${compact ? 'mb-4' : 'mb-8'} transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} mt-[-8px]`}
        style={{ background: '#1a1a1a' }}
        onClick={onClick}
      >
        <div className="w-full h-full flex justify-between relative">
          <div className="w-full h-full flex items-center justify-center text-white">
            No matches available
          </div>
        </div>
      </div>
    );
  }

  const currentMatch = allMatches[currentMatchIndex];
  const homeTeamColor = getTeamColor(currentMatch.teams.home.id);
  const awayTeamColor = getOpposingTeamColor(currentMatch.teams.away.id);

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
          <img 
            src={currentMatch.teams.home.logo}
            alt={currentMatch.teams.home.name}
            className={`absolute left-[-32px] z-20 w-[64px] h-[64px] object-contain transition-transform duration-300 ease-in-out hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0'} contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`}
            style={{
              top: "calc(50% - 32px)"
            }}
          />
        </div>

        <div className={`absolute left-[125px] text-white font-bold text-sm uppercase transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} max-w-[120px] truncate md:max-w-[200px]`} style={{top: "calc(50% - 8px)"}}>
          {currentMatch.teams.home.name}
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

        <img 
          src={currentMatch.teams.away.logo}
          alt={currentMatch.teams.away.name}
          className={`absolute right-[41px] z-20 w-[64px] h-[64px] object-contain transition-transform duration-300 ease-in-out hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0'} contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`}
          style={{
            top: "calc(50% - 32px)"
          }}
        />

        <div className={`absolute right-[125px] text-white font-bold text-sm uppercase text-right transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} max-w-[120px] truncate md:max-w-[200px]`} style={{top: "calc(50% - 8px)"}}>
          {currentMatch.teams.away.name}
        </div>
      </div>
    </div>
  );
}

export default LeagueMatchScoreboard;
