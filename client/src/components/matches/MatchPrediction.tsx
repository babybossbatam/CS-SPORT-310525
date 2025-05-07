import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TeamInfo {
  id: number;
  name: string;
  logo: string;
}

interface MatchPredictionProps {
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
}

const MatchPrediction: React.FC<MatchPredictionProps> = ({
  homeTeam,
  awayTeam,
  homeWinProbability,
  drawProbability,
  awayWinProbability,
}) => {
  // Get color based on probability
  const getProbabilityColor = (probability: number) => {
    if (probability >= 60) return 'bg-green-600';
    if (probability >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Generate recommendation text based on probabilities
  const getRecommendation = () => {
    const highest = Math.max(homeWinProbability, drawProbability, awayWinProbability);
    
    if (highest === homeWinProbability && highest > 50) {
      return `${homeTeam.name} is favored to win this match with a ${homeWinProbability}% probability.`;
    } else if (highest === awayWinProbability && highest > 50) {
      return `${awayTeam.name} is favored to win this match with a ${awayWinProbability}% probability.`;
    } else if (highest === drawProbability && highest > 40) {
      return `This match is likely to end in a draw with a ${drawProbability}% probability.`;
    } else {
      return 'This match appears to be very competitive with no clear favorite.';
    }
  };
  
  // Sample team stats - in a real app these would come from API
  const teamStats = {
    [homeTeam.id]: {
      form: 'WWDWL',
      goalsScored: 12,
      goalsConceded: 5,
      cleanSheets: 2,
      avgPossession: 58,
    },
    [awayTeam.id]: {
      form: 'LWDLD',
      goalsScored: 7,
      goalsConceded: 9,
      cleanSheets: 1,
      avgPossession: 48,
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center">
          Match Prediction
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-xs">
                  Win probabilities based on team form, head-to-head records, and other statistical factors.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Prediction visualization */}
        <div className="space-y-4">
          {/* Home Win */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <img 
                  src={homeTeam.logo} 
                  alt={homeTeam.name} 
                  className="w-6 h-6 mr-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=Team';
                  }}  
                />
                <span className="text-sm font-medium">{homeTeam.name} Win</span>
              </div>
              <span className="text-sm font-bold">{homeWinProbability}%</span>
            </div>
            <Progress value={homeWinProbability} className={`h-2 ${getProbabilityColor(homeWinProbability)}`} />
          </div>
          
          {/* Draw */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2 text-xs font-bold">
                  D
                </div>
                <span className="text-sm font-medium">Draw</span>
              </div>
              <span className="text-sm font-bold">{drawProbability}%</span>
            </div>
            <Progress value={drawProbability} className={`h-2 ${getProbabilityColor(drawProbability)}`} />
          </div>
          
          {/* Away Win */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <img 
                  src={awayTeam.logo} 
                  alt={awayTeam.name} 
                  className="w-6 h-6 mr-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=Team';
                  }}  
                />
                <span className="text-sm font-medium">{awayTeam.name} Win</span>
              </div>
              <span className="text-sm font-bold">{awayWinProbability}%</span>
            </div>
            <Progress value={awayWinProbability} className={`h-2 ${getProbabilityColor(awayWinProbability)}`} />
          </div>
        </div>
        
        {/* Recommendation */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-800">
          <p className="font-medium">Prediction</p>
          <p>{getRecommendation()}</p>
        </div>
        
        {/* Team Stats Comparison */}
        <div className="mt-6 grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-center">{homeTeam.name}</h4>
            <div className="flex flex-col space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Goals Scored:</span>
                <span className="font-semibold">{teamStats[homeTeam.id].goalsScored}</span>
              </div>
              <div className="flex justify-between">
                <span>Goals Conceded:</span>
                <span className="font-semibold">{teamStats[homeTeam.id].goalsConceded}</span>
              </div>
              <div className="flex justify-between">
                <span>Clean Sheets:</span>
                <span className="font-semibold">{teamStats[homeTeam.id].cleanSheets}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg. Possession:</span>
                <span className="font-semibold">{teamStats[homeTeam.id].avgPossession}%</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <div className="text-sm font-medium mb-2">vs</div>
            <div className="text-xs text-gray-500 text-center">
              Comparison based on<br/>last 5 matches
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-center">{awayTeam.name}</h4>
            <div className="flex flex-col space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Goals Scored:</span>
                <span className="font-semibold">{teamStats[awayTeam.id].goalsScored}</span>
              </div>
              <div className="flex justify-between">
                <span>Goals Conceded:</span>
                <span className="font-semibold">{teamStats[awayTeam.id].goalsConceded}</span>
              </div>
              <div className="flex justify-between">
                <span>Clean Sheets:</span>
                <span className="font-semibold">{teamStats[awayTeam.id].cleanSheets}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg. Possession:</span>
                <span className="font-semibold">{teamStats[awayTeam.id].avgPossession}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchPrediction;