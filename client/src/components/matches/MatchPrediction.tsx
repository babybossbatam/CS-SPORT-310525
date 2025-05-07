import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

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
  // Default to somewhat balanced predictions if none provided
  homeWinProbability = 40,
  drawProbability = 30,
  awayWinProbability = 30
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Find the highest probability
  const highestProb = Math.max(homeWinProbability, drawProbability, awayWinProbability);
  
  // Determine the likely outcome
  const likelyOutcome = 
    highestProb === homeWinProbability ? 'HOME_WIN' :
    highestProb === drawProbability ? 'DRAW' : 'AWAY_WIN';
    
  // Color for each prediction bar
  const homeBarColor = "bg-blue-600";
  const drawBarColor = "bg-gray-600";
  const awayBarColor = "bg-red-600";
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold">Match Prediction</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon 
                  size={16} 
                  className="text-gray-400 cursor-pointer"
                  onClick={() => setShowDetails(!showDetails)}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Based on team form, head to head stats and recent performance</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-4">
          {/* Home win prediction */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <div className="flex items-center">
                <img 
                  src={homeTeam.logo} 
                  alt={homeTeam.name} 
                  className="w-5 h-5 mr-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=Team';
                  }}
                />
                <span>{homeTeam.name} Win</span>
                {likelyOutcome === 'HOME_WIN' && (
                  <Badge className="ml-2 bg-blue-600 text-xs">Most Likely</Badge>
                )}
              </div>
              <span className="font-medium">{homeWinProbability}%</span>
            </div>
            <Progress value={homeWinProbability} className={`h-2 ${homeBarColor}`} />
          </div>
          
          {/* Draw prediction */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <div className="flex items-center">
                <span className="ml-7">Draw</span>
                {likelyOutcome === 'DRAW' && (
                  <Badge className="ml-2 bg-gray-600 text-xs">Most Likely</Badge>
                )}
              </div>
              <span className="font-medium">{drawProbability}%</span>
            </div>
            <Progress value={drawProbability} className={`h-2 ${drawBarColor}`} />
          </div>
          
          {/* Away win prediction */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <div className="flex items-center">
                <img 
                  src={awayTeam.logo} 
                  alt={awayTeam.name} 
                  className="w-5 h-5 mr-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=Team';
                  }}
                />
                <span>{awayTeam.name} Win</span>
                {likelyOutcome === 'AWAY_WIN' && (
                  <Badge className="ml-2 bg-red-600 text-xs">Most Likely</Badge>
                )}
              </div>
              <span className="font-medium">{awayWinProbability}%</span>
            </div>
            <Progress value={awayWinProbability} className={`h-2 ${awayBarColor}`} />
          </div>
        </div>
        
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
            <h4 className="font-medium mb-2">Prediction Factors:</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
              <li>Recent team form and performance</li>
              <li>Historical head-to-head results</li>
              <li>Home/away advantage</li>
              <li>Key player availability</li>
              <li>Recent scoring patterns</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchPrediction;