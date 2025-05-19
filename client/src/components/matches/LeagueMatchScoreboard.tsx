import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import TeamLogo from './TeamLogo';
import { useState, useEffect } from 'react';
import { FixtureResponse } from '@/types/fixtures';

interface LeagueMatchScoreboardProps {
  match?: FixtureResponse;
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
  match,
  matches = [],
  onClick,
  maxMatches = 5
}: LeagueMatchScoreboardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % (matches.length || 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [matches.length]);

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
        {match ? (
          <div className="w-full h-full flex items-center justify-between px-4">
            <div className="flex items-center space-x-4">
              <img
                src={match.teams.home.logo}
                alt={match.teams.home.name}
                className="h-8 w-8 object-contain"
              />
              <span className="text-white font-medium">{match.teams.home.name}</span>
            </div>
            <div className="text-white font-bold">
              {match.goals.home} - {match.goals.away}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white font-medium">{match.teams.away.name}</span>
              <img
                src={match.teams.away.logo}
                alt={match.teams.away.name}
                className="h-8 w-8 object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            No matches available
          </div>
        )}
      </div>
    </div>
  );
}

export default LeagueMatchScoreboard;