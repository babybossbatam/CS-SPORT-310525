
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
        <div className="flex items-center gap-2 mb-4">
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
        
        <div className="grid grid-cols-4 gap-4 mt-4 text-center">
          <div 
            className="flex flex-col items-center cursor-pointer"
            onClick={() => match?.fixture?.id && navigate(`/match/${match.fixture.id}/h2h`)}
          >
            <BarChart2 className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">H2H</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer"
            onClick={() => match?.fixture?.id && navigate(`/match/${match.fixture.id}/stats`)}
          >
            <LineChart className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">Stats</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer"
            onClick={() => match?.league?.id && navigate(`/league/${match.league.id}/bracket`)}
          >
            <Trophy className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">Bracket</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureMatchCard;
