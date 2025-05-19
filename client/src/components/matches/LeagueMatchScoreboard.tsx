import { useState, useEffect } from 'react';
import TeamLogo from './TeamLogo';

interface LeagueMatchScoreboardProps {
  homeTeamColor?: string;
  awayTeamColor?: string;
  compact?: boolean;
  onClick?: () => void;
}

export function LeagueMatchScoreboard({
  homeTeamColor = '#6f7c93',
  awayTeamColor = '#8b0000',
  compact = false,
  onClick
}: LeagueMatchScoreboardProps) {
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

export default LeagueMatchScoreboard;