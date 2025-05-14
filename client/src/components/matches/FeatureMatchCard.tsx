import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart2, LineChart, Trophy } from 'lucide-react';
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

  const handleMatchClick = () => {
    if (match?.fixture?.id) {
      navigate(`/match/${match.fixture.id}`);
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden relative">
      <Badge 
        variant="secondary" 
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20"
      >
        Featured Match
      </Badge>

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
          {matchDate}
        </div>

        <MatchScoreboard 
          match={match}
          featured={true}
          homeTeamColor="#6f7c93"
          awayTeamColor="#8b0000"
          onClick={handleMatchClick}
        />

        <div className="flex justify-around border-t border-gray-200 mt-4 pt-3">
          <button 
            className="flex flex-col items-center cursor-pointer w-1/4"
            onClick={() => navigate(`/match/${match?.fixture?.id}`)}
          >
            <img src="/match-icon.png" alt="Match" className="w-5 h-5 mb-1" />
            <span className="text-xs text-gray-600">Match Page</span>
          </button>
          <button 
            className="flex flex-col items-center cursor-pointer w-1/4"
            onClick={() => navigate(`/match/${match?.fixture?.id}/lineups`)}
          >
            <img src="/lineup-icon.png" alt="Lineups" className="w-5 h-5 mb-1" />
            <span className="text-xs text-gray-600">Lineups</span>
          </button>
          <button 
            className="flex flex-col items-center cursor-pointer w-1/4"
            onClick={() => navigate(`/match/${match?.fixture?.id}/stats`)}
          >
            <img src="/stats-icon.png" alt="Stats" className="w-5 h-5 mb-1" />
            <span className="text-xs text-gray-600">Stats</span>
          </button>
          <button 
            className="flex flex-col items-center cursor-pointer w-1/4"
            onClick={() => navigate(`/match/${match?.fixture?.id}/standings`)}
          >
            <img src="/standings-icon.png" alt="Standings" className="w-5 h-5 mb-1" />
            <span className="text-xs text-gray-600">Standings</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureMatchCard;