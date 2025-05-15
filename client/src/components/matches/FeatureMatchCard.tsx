import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart2, LineChart, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { FixtureResponse } from '../../../../server/types';
import MatchScoreboard from './MatchScoreboard';

interface FeatureMatchCardProps {
  match: FixtureResponse;
  leagueName: string;
  leagueLogo: string | null;
  matchDate: string;
}

const FeatureMatchCard = ({ match, leagueName, leagueLogo, matchDate }: FeatureMatchCardProps) => {
  const [, navigate] = useLocation();
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matches, setMatches] = useState<FixtureResponse[]>([]);

  useEffect(() => {
    if (match) {
      // Fetch 5 matches from the same league
      fetch(`/api/leagues/${match.league.id}/fixtures`)
        .then(res => res.json())
        .then(data => {
          setMatches(data.slice(0, 5));
        });
    }
  }, [match]);

  const handleMatchClick = () => {
    if (matches[currentMatchIndex]?.fixture?.id) {
      navigate(`/match/${matches[currentMatchIndex].fixture.id}`);
    }
  };

  const handlePrevious = () => {
    setCurrentMatchIndex(prev => (prev > 0 ? prev - 1 : matches.length - 1));
  };

  const handleNext = () => {
    setCurrentMatchIndex(prev => (prev < matches.length - 1 ? prev + 1 : 0));
  };

  const currentMatch = matches[currentMatchIndex] || match;

  return (
    <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden relative">
      <Badge 
        variant="secondary" 
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
      >
        Featured Match
      </Badge>

      <button
        onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
        className="absolute left-0 top-[45%] h-[14%] -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-black px-1 rounded-r-full z-30 flex items-center border border-gray-200 transition-all duration-200 ease-in-out hover:shadow-md hover:scale-105"
      >
        <ChevronLeft className="h-3 w-3" />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); handleNext(); }}
        className="absolute right-0 top-[45%] h-[14%] -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-black px-1 rounded-l-full z-30 flex items-center border border-gray-200 transition-all duration-200 ease-in-out hover:shadow-md hover:scale-105"
      >
        <ChevronRight className="h-3 w-3" />
      </button>

      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            {leagueLogo ? (
              <img 
                src={leagueLogo}
                alt={leagueName}
                className="w-5 h-5"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=L';
                }}
              />
            ) : (
              <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
            )}
            <span className="text-sm font-medium">{leagueName}</span>
          </div>

          <span className="text-gray-400">-</span>

          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-800">
            {match.fixture.status.short === 'LIVE' ? 'LIVE' : 
             match.fixture.status.short === 'HT' ? 'Half Time' :
             match.fixture.status.short === 'FT' ? 'Full Time' :
             match.league.round || 'Upcoming'}
          </span>
          </div>
        </div>

        <div className="text-lg font-semibold text-center mb-4">
          {currentMatch.fixture.status.short === 'FT' ? (
            <div className="flex flex-col items-center">
              <span className="text-emerald-600 mb-1">Match Ended</span>
              <span className="text-lg font-bold -mt-1">{currentMatch.goals.home} - {currentMatch.goals.away}</span>
            </div>
          ) : matchDate}
        </div>

        <div className="relative">
          
          <MatchScoreboard 
            match={currentMatch}
            featured={true}
            homeTeamColor="#6f7c93"
            awayTeamColor="#8b0000"
            onClick={handleMatchClick}
          />
        </div>

        <div className="flex justify-around border-t border-gray-200 mt-4 pt-3">
          <button 
            className="flex flex-col items-center cursor-pointer w-1/4"
            onClick={() => navigate(`/match/${match?.fixture?.id}`)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-600">
              <path d="M20 3H4C3.45 3 3 3.45 3 4V20C3 20.55 3.45 21 4 21H20C20.55 21 21 20.55 21 20V4C21 3.45 20.55 3 20 3ZM7 7H17V17H7V7Z" fill="currentColor" />
            </svg>
            <span className="text-xs text-gray-600 mt-1">Match Page</span>
          </button>
          <button 
            className="flex flex-col items-center cursor-pointer w-1/4"
            onClick={() => navigate(`/match/${match?.fixture?.id}/lineups`)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-600">
              <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM11 19H5V15H11V19ZM11 13H5V9H11V13ZM11 7H5V5H11V7ZM19 19H13V17H19V19ZM19 15H13V13H19V15ZM19 11H13V9H19V11ZM19 7H13V5H19V7Z" fill="currentColor" />
            </svg>
            <span className="text-xs text-gray-600 mt-1">Lineups</span>
          </button>
          <button 
            className="flex flex-col items-center cursor-pointer w-1/4"
            onClick={() => navigate(`/match/${match?.fixture?.id}/stats`)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-600">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" fill="currentColor" />
            </svg>
            <span className="text-xs text-gray-600 mt-1">Stats</span>
          </button>
          <button 
            className="flex flex-col items-center cursor-pointer w-1/4"
            onClick={() => {
              navigate(`/league/${match?.league?.id}/standings`);
              // Focus standings tab after a small delay to ensure DOM is ready
              setTimeout(() => {
                const standingsTab = document.querySelector('[role="tab"][value="standings"]');
                if (standingsTab instanceof HTMLElement) {
                  standingsTab.focus();
                  standingsTab.click();
                }
              }, 100);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-600">
              <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor" />
              <path d="M7 7H9V17H7V7Z" fill="currentColor" />
              <path d="M11 7H13V17H11V7Z" fill="currentColor" />
              <path d="M15 7H17V17H15V7Z" fill="currentColor" />
            </svg>
            <span className="text-xs text-gray-600 mt-1">Standings</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureMatchCard;