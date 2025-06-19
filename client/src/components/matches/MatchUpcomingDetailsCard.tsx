
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MatchUpcomingDetailsCardProps {
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
}

const MatchUpcomingDetailsCard: React.FC<MatchUpcomingDetailsCardProps> = ({
  homeTeam,
  awayTeam,
  homeTeamLogo,
  awayTeamLogo,
}) => {
  return (
    <Card className="w-full mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-gray-600 font-normal">Upcoming Match</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Match Preview</h3>
          
          <div className="flex items-center justify-center gap-4">
            {/* Home Team Button */}
            <Button
              variant="outline"
              className="flex-1 max-w-[150px] h-12 rounded-full border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {homeTeamLogo && (
                  <img 
                    src={homeTeamLogo} 
                    alt={homeTeam}
                    className="w-5 h-5 object-contain"
                  />
                )}
                <span className="text-sm font-medium truncate">
                  {homeTeam.length > 10 ? `${homeTeam.substring(0, 10)}...` : homeTeam}
                </span>
              </div>
            </Button>

            {/* Draw Button */}
            <Button
              variant="outline"
              className="px-8 h-12 rounded-full border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">Draw</span>
            </Button>

            {/* Away Team Button */}
            <Button
              variant="outline"
              className="flex-1 max-w-[150px] h-12 rounded-full border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {awayTeamLogo && (
                  <img 
                    src={awayTeamLogo} 
                    alt={awayTeam}
                    className="w-5 h-5 object-contain"
                  />
                )}
                <span className="text-sm font-medium truncate">
                  {awayTeam.length > 10 ? `${awayTeam.substring(0, 10)}...` : awayTeam}
                </span>
              </div>
            </Button>
          </div>

          {/* Prediction indicators */}
          <div className="flex justify-center mt-4">
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

export default MatchUpcomingDetailsCard;
