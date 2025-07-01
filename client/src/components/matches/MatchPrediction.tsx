import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HelpCircle, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TeamInfo {
  id?: number;
  name: string;
  logo: string;
}

interface TeamStats {
  form: string;
  goalsScored: number;
  goalsConceded: number;
  cleanSheets: number;
  avgPossession: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
}

interface PredictionData {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  confidence: number;
  homeTeamStats: TeamStats;
  awayTeamStats: TeamStats;
}

interface MatchPredictionProps {
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeWinProbability?: number;
  drawProbability?: number;
  awayWinProbability?: number;
  fixtureId?: number;
  leagueId?: number;
  season?: number;
}

const MatchPrediction: React.FC<MatchPredictionProps> = ({
  homeTeam,
  awayTeam,
  homeWinProbability: propHomeWin,
  drawProbability: propDraw,
  awayWinProbability: propAwayWin,
  fixtureId,
  leagueId,
  season,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use props as fallback if API data is not available
  const homeWinProbability = predictionData?.homeWinProbability ?? propHomeWin ?? 33;
  const drawProbability = predictionData?.drawProbability ?? propDraw ?? 34;
  const awayWinProbability = predictionData?.awayWinProbability ?? propAwayWin ?? 33;

  useEffect(() => {
    const fetchPredictionData = async () => {
      if (!homeTeam?.id || !awayTeam?.id) {
        // If no team IDs, use default probabilities and generate basic stats
        const defaultStats: TeamStats = {
          form: 'N/A',
          goalsScored: 0,
          goalsConceded: 0,
          cleanSheets: 0,
          avgPossession: 50,
          matchesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
        };
        
        setPredictionData({
          homeWinProbability: propHomeWin ?? 33,
          drawProbability: propDraw ?? 34,
          awayWinProbability: propAwayWin ?? 33,
          confidence: 50,
          homeTeamStats: defaultStats,
          awayTeamStats: defaultStats,
        });
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        
        // Fetch team statistics in parallel
        const [homeStatsResponse, awayStatsResponse] = await Promise.all([
          fetch(`/api/teams/${homeTeam.id}/statistics?league=${leagueId}&season=${season || new Date().getFullYear()}`),
          fetch(`/api/teams/${awayTeam.id}/statistics?league=${leagueId}&season=${season || new Date().getFullYear()}`)
        ]);

        let homeStats: TeamStats | null = null;
        let awayStats: TeamStats | null = null;

        // Process home team stats
        if (homeStatsResponse.ok) {
          const homeData = await homeStatsResponse.json();
          if (homeData?.response?.[0]) {
            const stats = homeData.response[0];
            homeStats = {
              form: stats.form || 'N/A',
              goalsScored: stats.goals?.for?.total || 0,
              goalsConceded: stats.goals?.against?.total || 0,
              cleanSheets: stats.clean_sheet?.total || 0,
              avgPossession: stats.ball_possession?.average ? parseInt(stats.ball_possession.average) : 50,
              matchesPlayed: stats.fixtures?.played?.total || 0,
              wins: stats.fixtures?.wins?.total || 0,
              draws: stats.fixtures?.draws?.total || 0,
              losses: stats.fixtures?.loses?.total || 0,
            };
          }
        }

        // Process away team stats
        if (awayStatsResponse.ok) {
          const awayData = await awayStatsResponse.json();
          if (awayData?.response?.[0]) {
            const stats = awayData.response[0];
            awayStats = {
              form: stats.form || 'N/A',
              goalsScored: stats.goals?.for?.total || 0,
              goalsConceded: stats.goals?.against?.total || 0,
              cleanSheets: stats.clean_sheet?.total || 0,
              avgPossession: stats.ball_possession?.average ? parseInt(stats.ball_possession.average) : 50,
              matchesPlayed: stats.fixtures?.played?.total || 0,
              wins: stats.fixtures?.wins?.total || 0,
              draws: stats.fixtures?.draws?.total || 0,
              losses: stats.fixtures?.loses?.total || 0,
            };
          }
        }

        // Calculate probabilities based on team performance if we have stats
        let calculatedProbabilities = {
          homeWinProbability: propHomeWin ?? 33,
          drawProbability: propDraw ?? 34,
          awayWinProbability: propAwayWin ?? 33,
          confidence: 50
        };

        if (homeStats && awayStats && homeStats.matchesPlayed > 0 && awayStats.matchesPlayed > 0) {
          // Calculate win percentages
          const homeWinRate = (homeStats.wins / homeStats.matchesPlayed) * 100;
          const awayWinRate = (awayStats.wins / awayStats.matchesPlayed) * 100;
          
          // Calculate goal difference ratios
          const homeGoalDiff = homeStats.goalsScored - homeStats.goalsConceded;
          const awayGoalDiff = awayStats.goalsScored - awayStats.goalsConceded;
          
          // Simple prediction algorithm based on form and stats
          const homeFactor = homeWinRate + (homeGoalDiff * 2) + 5; // Home advantage
          const awayFactor = awayWinRate + (awayGoalDiff * 2);
          const total = homeFactor + awayFactor;
          
          if (total > 0) {
            const homeProb = Math.max(10, Math.min(80, (homeFactor / total) * 100));
            const awayProb = Math.max(10, Math.min(80, (awayFactor / total) * 100));
            const drawProb = Math.max(10, 100 - homeProb - awayProb);
            
            // Normalize to 100%
            const totalProb = homeProb + drawProb + awayProb;
            calculatedProbabilities = {
              homeWinProbability: Math.round((homeProb / totalProb) * 100),
              drawProbability: Math.round((drawProb / totalProb) * 100),
              awayWinProbability: Math.round((awayProb / totalProb) * 100),
              confidence: Math.min(90, Math.max(50, (homeStats.matchesPlayed + awayStats.matchesPlayed) * 2))
            };
          }
        }

        setPredictionData({
          ...calculatedProbabilities,
          homeTeamStats: homeStats || {
            form: 'N/A',
            goalsScored: 0,
            goalsConceded: 0,
            cleanSheets: 0,
            avgPossession: 50,
            matchesPlayed: 0,
            wins: 0,
            draws: 0,
            losses: 0,
          },
          awayTeamStats: awayStats || {
            form: 'N/A',
            goalsScored: 0,
            goalsConceded: 0,
            cleanSheets: 0,
            avgPossession: 50,
            matchesPlayed: 0,
            wins: 0,
            draws: 0,
            losses: 0,
          },
        });
        
      } catch (error) {
        console.error('❌ [MatchPrediction] Error fetching prediction data:', error);
        setError('Failed to load prediction data');
        
        // Use fallback data
        const fallbackStats: TeamStats = {
          form: 'N/A',
          goalsScored: 0,
          goalsConceded: 0,
          cleanSheets: 0,
          avgPossession: 50,
          matchesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
        };
        
        setPredictionData({
          homeWinProbability: propHomeWin ?? 33,
          drawProbability: propDraw ?? 34,
          awayWinProbability: propAwayWin ?? 33,
          confidence: 50,
          homeTeamStats: fallbackStats,
          awayTeamStats: fallbackStats,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictionData();
  }, [homeTeam?.id, awayTeam?.id, leagueId, season, propHomeWin, propDraw, propAwayWin]);
  // Get color based on probability
  const getProbabilityColor = (probability: number) => {
    if (probability >= 60) return 'bg-green-600';
    if (probability >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Generate recommendation text based on probabilities
  const getRecommendation = () => {
    const highest = Math.max(homeWinProbability, drawProbability, awayWinProbability);
    const confidence = predictionData?.confidence || 50;
    const confidenceText = confidence >= 70 ? 'High confidence' : confidence >= 50 ? 'Moderate confidence' : 'Low confidence';

    if (highest === homeWinProbability && highest > 50) {
      return `${homeTeam.name} is favored to win this match with a ${homeWinProbability}% probability. (${confidenceText})`;
    } else if (highest === awayWinProbability && highest > 50) {
      return `${awayTeam.name} is favored to win this match with a ${awayWinProbability}% probability. (${confidenceText})`;
    } else if (highest === drawProbability && highest > 40) {
      return `This match is likely to end in a draw with a ${drawProbability}% probability. (${confidenceText})`;
    } else {
      return `This match appears to be very competitive with no clear favorite. (${confidenceText})`;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center">
            Match Prediction
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading prediction data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">Match Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-sm text-red-500 mb-2">{error}</p>
              <p className="text-xs text-gray-500">Using fallback data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const homeStats = predictionData?.homeTeamStats;
  const awayStats = predictionData?.awayTeamStats;

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
                  {predictionData ? 
                    `Predictions based on real team statistics including form, goals scored/conceded, and recent performance. Confidence: ${predictionData.confidence}%` :
                    'Win probabilities based on team form, head-to-head records, and other statistical factors.'
                  }
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
                <span>Form:</span>
                <span className="font-semibold">{homeStats?.form || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Goals Scored:</span>
                <span className="font-semibold">{homeStats?.goalsScored || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Goals Conceded:</span>
                <span className="font-semibold">{homeStats?.goalsConceded || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Clean Sheets:</span>
                <span className="font-semibold">{homeStats?.cleanSheets || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Win Rate:</span>
                <span className="font-semibold">
                  {homeStats?.matchesPlayed ? Math.round((homeStats.wins / homeStats.matchesPlayed) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="text-sm font-medium mb-2">vs</div>
            <div className="text-xs text-gray-500 text-center">
              Stats based on<br/>current season data
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-center">{awayTeam.name}</h4>
            <div className="flex flex-col space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Form:</span>
                <span className="font-semibold">{awayStats?.form || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Goals Scored:</span>
                <span className="font-semibold">{awayStats?.goalsScored || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Goals Conceded:</span>
                <span className="font-semibold">{awayStats?.goalsConceded || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Clean Sheets:</span>
                <span className="font-semibold">{awayStats?.cleanSheets || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Win Rate:</span>
                <span className="font-semibold">
                  {awayStats?.matchesPlayed ? Math.round((awayStats.wins / awayStats.matchesPlayed) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchPrediction;