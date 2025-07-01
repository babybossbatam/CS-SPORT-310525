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
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface PredictionOption {
  name: string;
  percentage: number;
  votes: number;
  isActive?: boolean;
}

interface MatchPredictionProps {
  title?: string;
  totalVotes: number;
  options: PredictionOption[];
  className?: string;
}

const MatchPrediction: React.FC<MatchPredictionProps> = ({
  title = "Who Will Win?",
  totalVotes,
  options,
  className = ""
}) => {
  return (
    <Card className={`prediction-container ${className}`}>
      <CardContent className="p-4">
        <div className="prediction-title text-lg font-semibold mb-4">
          {title}
        </div>
        
        <div className="prediction-results-container">
          <div className="prediction-total-votes text-sm text-gray-600 mb-3">
            Total Votes: {totalVotes}
          </div>
          
          {/* Results Bar */}
          <div className="prediction-results-bar flex h-2 rounded-full overflow-hidden mb-4">
            {options.map((option, index) => (
              <div
                key={index}
                className={`prediction-results-bar-item ${
                  index === 0 ? 'bg-blue-500' : 
                  index === options.length - 1 ? 'bg-green-500' : 
                  'bg-gray-400'
                } ${option.isActive ? 'opacity-100' : 'opacity-80'}`}
                style={{
                  flex: `${option.percentage} 1 0%`,
                  animationDelay: `${index * 320}ms`,
                  animationDuration: `${option.percentage * 10}ms`
                }}
              />
            ))}
          </div>
          
          {/* Results Options */}
          <div className="prediction-results-options flex justify-between">
            {options.map((option, index) => (
              <div
                key={index}
                className={`prediction-results-options-item flex flex-col items-center ${
                  option.isActive ? 'font-semibold' : ''
                }`}
                style={{
                  animationDelay: `${index * 320}ms`,
                  animationDuration: `${option.percentage * 10}ms`
                }}
              >
                <div className="prediction-results-options-vote text-sm font-medium">
                  {option.percentage}%
                </div>
                <div className="prediction-results-options-name text-xs text-center">
                  {option.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchPrediction;
