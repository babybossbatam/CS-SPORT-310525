
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MatchPredictionsCardProps {
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  matchStatus?: string;
  homeWinProbability?: number;
  drawProbability?: number;
  awayWinProbability?: number;
  totalVotes?: number;
}

const MatchPredictionsCard: React.FC<MatchPredictionsCardProps> = ({
  homeTeam,
  awayTeam,
  homeTeamLogo,
  awayTeamLogo,
  matchStatus = "NS",
  homeWinProbability = 23,
  drawProbability = 19,
  awayWinProbability = 58,
  totalVotes = 4383,
}) => {
  return (
    <Card className="w-full mt-4 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-gray-600 font-normal">Predictions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Who Will Win?</h3>
          
          {/* Total Votes */}
          <div className="text-sm text-gray-500 mb-4">
            Total Votes: {totalVotes?.toLocaleString() || "4,383"}
          </div>

          {/* Horizontal Prediction Bar */}
          <div className="relative mb-6">
            <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
              {/* Home Team Bar */}
              <div 
                className="bg-gray-600 h-full"
                style={{ width: `${homeWinProbability}%` }}
              />
              {/* Draw Bar */}
              <div 
                className="bg-blue-400 h-full"
                style={{ width: `${drawProbability}%` }}
              />
              {/* Away Team Bar */}
              <div 
                className="bg-blue-500 h-full"
                style={{ width: `${awayWinProbability}%` }}
              />
            </div>
            
            {/* Percentages and Team Names */}
            <div className="flex justify-between items-center mt-3">
              {/* Home Team */}
              <div className="flex flex-col items-start">
                <div className="text-lg font-semibold text-gray-800">{homeWinProbability}%</div>
                <div className="flex items-center gap-2">
                  {homeTeamLogo && (
                    <img 
                      src={homeTeamLogo} 
                      alt={homeTeam}
                      className="w-4 h-4 object-contain"
                    />
                  )}
                  <span className="text-sm text-gray-600 truncate max-w-[100px]">
                    {homeTeam.length > 12 ? `${homeTeam.substring(0, 12)}...` : homeTeam}
                  </span>
                </div>
              </div>

              {/* Draw */}
              <div className="flex flex-col items-center">
                <div className="text-lg font-semibold text-gray-800">{drawProbability}%</div>
                <span className="text-sm text-gray-600">Draw</span>
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-end">
                <div className="text-lg font-semibold text-blue-600">{awayWinProbability}%</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-600 truncate max-w-[100px]">
                    {awayTeam.length > 12 ? `${awayTeam.substring(0, 12)}...` : awayTeam}
                  </span>
                  {awayTeamLogo && (
                    <img 
                      src={awayTeamLogo} 
                      alt={awayTeam}
                      className="w-4 h-4 object-contain"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation dots (optional) */}
          <div className="flex justify-center">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchPredictionsCard;
