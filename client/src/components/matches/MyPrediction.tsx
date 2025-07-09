
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface MyPredictionProps {
  homeTeam: { name: string; logo?: string; id?: number };
  awayTeam: { name: string; logo?: string; id?: number };
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  confidence?: number;
}

const MyPrediction: React.FC<MyPredictionProps> = ({
  homeTeam,
  awayTeam,
  homeWinProbability,
  drawProbability,
  awayWinProbability,
  confidence = 50
}) => {
  const getProbabilityColor = (probability: number) => {
    if (probability >= 60) return 'bg-green-600';
    if (probability >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRecommendation = () => {
    const highest = Math.max(homeWinProbability, drawProbability, awayWinProbability);
    const confidenceText = confidence >= 70 ? 'High confidence' : confidence >= 50 ? 'Moderate confidence' : 'Low confidence';

    if (highest === homeWinProbability && highest > 50) {
      return `${homeTeam.name} is favored to win with ${homeWinProbability}% probability. (${confidenceText})`;
    } else if (highest === awayWinProbability && highest > 50) {
      return `${awayTeam.name} is favored to win with ${awayWinProbability}% probability. (${confidenceText})`;
    } else if (highest === drawProbability && highest > 40) {
      return `This match is likely to end in a draw with ${drawProbability}% probability. (${confidenceText})`;
    } else {
      return `This match appears to be very competitive with no clear favorite. (${confidenceText})`;
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">Match Prediction</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Home Win */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <img 
                  src={homeTeam.logo || "/assets/fallback-logo.svg"}
                  alt={homeTeam.name} 
                  className="w-6 h-6 mr-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/assets/fallback-logo.svg";
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
                  src={awayTeam.logo || "/assets/fallback-logo.svg"}
                  alt={awayTeam.name} 
                  className="w-6 h-6 mr-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/assets/fallback-logo.svg";
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
      </CardContent>
    </Card>
  );
};

export default MyPrediction;
