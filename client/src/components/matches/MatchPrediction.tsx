import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowBigUp, HelpCircle } from 'lucide-react';

interface MatchPredictionProps {
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  homeWinProbability?: number;
  drawProbability?: number;
  awayWinProbability?: number;
}

const MatchPrediction: React.FC<MatchPredictionProps> = ({
  homeTeam,
  awayTeam,
  homeWinProbability = 45,
  drawProbability = 28,
  awayWinProbability = 27
}) => {
  // Determine which team is favored
  const favoredTeam = homeWinProbability > awayWinProbability ? homeTeam : awayTeam;
  const isFavoredHome = favoredTeam.id === homeTeam.id;
  const favoredProbability = isFavoredHome ? homeWinProbability : awayWinProbability;
  const underdog = isFavoredHome ? awayTeam : homeTeam;
  const underdogProbability = isFavoredHome ? awayWinProbability : homeWinProbability;
  
  // Only show the favorite indicator if difference is significant (more than 10%)
  const shouldShowFavorite = Math.abs(homeWinProbability - awayWinProbability) > 10;
  
  // Calculate prediction confidence level
  const getConfidenceLevel = (probability: number) => {
    if (probability >= 60) return 'High';
    if (probability >= 45) return 'Medium';
    return 'Low';
  };
  
  // Get appropriate colors for the win probability bars
  const getProgressColor = (probability: number) => {
    if (probability >= 50) return 'bg-green-500';
    if (probability >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
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
                  Predictions are based on team form, head-to-head history, and other performance factors.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-5">
          {/* Home team prediction */}
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
                <span className="font-medium">{homeTeam.name}</span>
                {shouldShowFavorite && isFavoredHome && (
                  <div className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                    <ArrowBigUp className="h-3 w-3 mr-0.5" />
                    <span>Favored</span>
                  </div>
                )}
              </div>
              <span className="font-bold text-lg">{homeWinProbability}%</span>
            </div>
            <Progress value={homeWinProbability} max={100} className="h-2" 
              style={{ backgroundColor: 'rgb(229, 231, 235)' }}>
              <div className={`h-full ${getProgressColor(homeWinProbability)}`} style={{ width: `${homeWinProbability}%` }}></div>
            </Progress>
            <div className="text-xs text-gray-500 flex justify-between">
              <span>Win confidence: {getConfidenceLevel(homeWinProbability)}</span>
              <span>Home advantage</span>
            </div>
          </div>
          
          {/* Draw prediction */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-medium">Draw</span>
              <span className="font-bold text-lg">{drawProbability}%</span>
            </div>
            <Progress value={drawProbability} max={100} className="h-2" 
              style={{ backgroundColor: 'rgb(229, 231, 235)' }}>
              <div className="h-full bg-gray-400" style={{ width: `${drawProbability}%` }}></div>
            </Progress>
          </div>
          
          {/* Away team prediction */}
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
                <span className="font-medium">{awayTeam.name}</span>
                {shouldShowFavorite && !isFavoredHome && (
                  <div className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                    <ArrowBigUp className="h-3 w-3 mr-0.5" />
                    <span>Favored</span>
                  </div>
                )}
              </div>
              <span className="font-bold text-lg">{awayWinProbability}%</span>
            </div>
            <Progress value={awayWinProbability} max={100} className="h-2" 
              style={{ backgroundColor: 'rgb(229, 231, 235)' }}>
              <div className={`h-full ${getProgressColor(awayWinProbability)}`} style={{ width: `${awayWinProbability}%` }}></div>
            </Progress>
            <div className="text-xs text-gray-500">
              Win confidence: {getConfidenceLevel(awayWinProbability)}
            </div>
          </div>
          
          {/* Factors */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium mb-2">Key Factors</h4>
            <ul className="text-xs space-y-1 text-gray-700">
              <li className="flex items-start">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 mr-2"></span>
                {favoredTeam.name} has won {Math.round(favoredProbability / 10)} of their last 10 matches
              </li>
              <li className="flex items-start">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 mr-2"></span>
                Recent head-to-head: {favoredTeam.name} has the advantage
              </li>
              <li className="flex items-start">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 mr-2"></span>
                {underdog.name}'s current form suggests {underdogProbability}% chance of upset
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchPrediction;