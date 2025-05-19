
import { useState, useEffect } from 'react';
import { FixtureResponse } from '@/types/fixtures';

interface LeagueMatchScoreboardProps {
  match: FixtureResponse;
  matches?: FixtureResponse[];
  onClick?: () => void;
  featured?: boolean;
  homeTeamColor?: string;
  awayTeamColor?: string;
  compact?: boolean;
  maxMatches?: number;
}

export function LeagueMatchScoreboard({ 
  featured = false,
  homeTeamColor = '#6f7c93',
  awayTeamColor = '#8b0000',
  compact = false,
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
    >
      <div className="w-full h-full flex justify-between relative">
        {/* Empty scoreboard */}
        <div className="w-full h-full flex items-center justify-center text-white">
          No matches available
        </div>
      </div>
    </div>
  );
}

export default LeagueMatchScoreboard;
