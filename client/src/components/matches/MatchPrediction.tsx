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

  // Debug logging
  console.log('🔍 [MatchPrediction] Props received:', {
    homeTeam: homeTeam ? { id: homeTeam.id, name: homeTeam.name, hasLogo: !!homeTeam.logo } : null,
    awayTeam: awayTeam ? { id: awayTeam.id, name: awayTeam.name, hasLogo: !!awayTeam.logo } : null,
    propHomeWin,
    propDraw,
    propAwayWin,
    fixtureId,
    leagueId,
    season
  });

  // More robust team data validation
  if (!homeTeam || !awayTeam || !homeTeam.name || !awayTeam.name) {
    console.warn('❌ [MatchPrediction] Missing team data:', { 
      homeTeam: homeTeam ? { name: homeTeam.name, logo: homeTeam.logo } : null, 
      awayTeam: awayTeam ? { name: awayTeam.name, logo: awayTeam.logo } : null 
    });
    
    // Try to show basic prediction even with incomplete data
    if (homeTeam?.name && awayTeam?.name) {
      console.log('✅ [MatchPrediction] Found team names, proceeding with basic prediction');
    } else {
      return (
        <Card className="w-full shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Match Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <p className="text-sm text-gray-500">Team data not available</p>
                <p className="text-xs text-gray-400 mt-1">
                  Home: {homeTeam?.name || 'Unknown'} | Away: {awayTeam?.name || 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  // Use props as fallback if API data is not available
  const homeWinProbability = predictionData?.homeWinProbability ?? propHomeWin ?? 33;
  const drawProbability = predictionData?.drawProbability ?? propDraw ?? 34;
  const awayWinProbability = predictionData?.awayWinProbability ?? propAwayWin ?? 33;

  useEffect(() => {
    const fetchPredictionData = async () => {
      console.log('📊 [MatchPrediction] Starting prediction data fetch:', {
        homeTeamId: homeTeam?.id,
        awayTeamId: awayTeam?.id,
        fixtureId,
        hasProps: { propHomeWin, propDraw, propAwayWin }
      });

      if (!homeTeam?.id || !awayTeam?.id) {
        console.log('⚠️ [MatchPrediction] Missing team IDs, using fallback prediction');
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
        
        const fallbackPrediction = {
          homeWinProbability: propHomeWin ?? 33,
          drawProbability: propDraw ?? 34,
          awayWinProbability: propAwayWin ?? 33,
          confidence: 50,
          homeTeamStats: defaultStats,
          awayTeamStats: defaultStats,
        };

        console.log('✅ [MatchPrediction] Set fallback prediction:', fallbackPrediction);
        setPredictionData(fallbackPrediction);
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        
        // Fetch team statistics and odds in parallel
        const fetchPromises = [
          fetch(`/api/teams/${homeTeam.id}/statistics?league=${leagueId}&season=${season || new Date().getFullYear()}`),
          fetch(`/api/teams/${awayTeam.id}/statistics?league=${leagueId}&season=${season || new Date().getFullYear()}`)
        ];

        // Add odds fetch if fixtureId is available
        if (fixtureId) {
          console.log(`📊 [MatchPrediction] Fetching odds for fixture: ${fixtureId}`);
          fetchPromises.push(fetch(`/api/fixtures/${fixtureId}/odds`));
        }

        const responses = await Promise.all(fetchPromises);
        const [homeStatsResponse, awayStatsResponse, oddsResponse] = responses;

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

        // Process odds data if available
        let oddsBasedProbabilities = null;
        if (oddsResponse && oddsResponse.ok) {
          try {
            const oddsData = await oddsResponse.json();
            console.log('📊 [MatchPrediction] Odds response:', oddsData);
            
            if (oddsData.success && oddsData.data && oddsData.data.length > 0) {
              // Find 1X2 (Match Winner) odds from a major bookmaker
              const bookmaker = oddsData.data.find((bm: any) => 
                bm.bookmaker?.name && ['Bet365', '1xBet', 'Unibet', 'William Hill', 'Pinnacle'].includes(bm.bookmaker.name)
              ) || oddsData.data[0];

              console.log('📊 [MatchPrediction] Using bookmaker:', bookmaker?.bookmaker?.name);

              if (bookmaker?.bets) {
                const matchWinnerBet = bookmaker.bets.find((bet: any) => 
                  bet.name === 'Match Winner' || bet.name === '1X2'
                );

                if (matchWinnerBet?.values && matchWinnerBet.values.length >= 3) {
                  const homeOdd = parseFloat(matchWinnerBet.values[0]?.odd || '2.0');
                  const drawOdd = parseFloat(matchWinnerBet.values[1]?.odd || '3.0');
                  const awayOdd = parseFloat(matchWinnerBet.values[2]?.odd || '2.0');

                  console.log('📊 [MatchPrediction] Raw odds:', { homeOdd, drawOdd, awayOdd });

                  // Convert odds to implied probabilities
                  const homeProb = (1 / homeOdd) * 100;
                  const drawProb = (1 / drawOdd) * 100;
                  const awayProb = (1 / awayOdd) * 100;

                  // Normalize to ensure they add up to 100%
                  const total = homeProb + drawProb + awayProb;
                  oddsBasedProbabilities = {
                    homeWinProbability: Math.round((homeProb / total) * 100),
                    drawProbability: Math.round((drawProb / total) * 100),
                    awayWinProbability: Math.round((awayProb / total) * 100),
                    confidence: 85, // High confidence for bookmaker odds
                    source: 'odds'
                  };

                  console.log('📊 [MatchPrediction] Using odds-based predictions from', bookmaker.bookmaker?.name, oddsBasedProbabilities);
                }
              }
            }
          } catch (oddsError) {
            console.error('❌ [MatchPrediction] Error processing odds data:', oddsError);
          }
        }

        // Calculate probabilities based on team performance if we have stats
        let calculatedProbabilities = {
          homeWinProbability: propHomeWin ?? 33,
          drawProbability: propDraw ?? 34,
          awayWinProbability: propAwayWin ?? 33,
          confidence: 50,
          source: 'fallback'
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
              confidence: Math.min(90, Math.max(50, (homeStats.matchesPlayed + awayStats.matchesPlayed) * 2)),
              source: 'statistics'
            };
          }
        }

        // Use odds-based predictions if available, otherwise use statistics-based predictions
        const finalProbabilities = oddsBasedProbabilities || calculatedProbabilities;

        setPredictionData({
          ...finalProbabilities,
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
  }, [homeTeam?.id, awayTeam?.id, fixtureId, leagueId, season, propHomeWin, propDraw, propAwayWin]);
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
      return `${homeTeam?.name || 'Home Team'} is favored to win this match with a ${homeWinProbability}% probability. (${confidenceText})`;
    } else if (highest === awayWinProbability && highest > 50) {
      return `${awayTeam?.name || 'Away Team'} is favored to win this match with a ${awayWinProbability}% probability. (${confidenceText})`;
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

  if (error && !predictionData) {
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
                    `Predictions based on ${(predictionData as any).source === 'odds' ? 'live betting odds' : 'team statistics including form, goals scored/conceded, and recent performance'}. Confidence: ${predictionData.confidence}%` :
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
                  src={
                    homeTeam?.id
                      ? `/api/team-logo/square/${homeTeam.id}?size=24`
                      : homeTeam?.logo || "/assets/fallback-logo.svg"
                  }
                  alt={homeTeam?.name || 'Home Team'} 
                  className="w-6 h-6 mr-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/assets/fallback-logo.svg";
                  }}  
                />
                <span className="text-sm font-medium">{homeTeam?.name || 'Home Team'} Win</span>
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
                  src={
                    awayTeam?.id
                      ? `/api/team-logo/square/${awayTeam.id}?size=24`
                      : awayTeam?.logo || "/assets/fallback-logo.svg"
                  }
                  alt={awayTeam?.name || 'Away Team'} 
                  className="w-6 h-6 mr-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/assets/fallback-logo.svg";
                  }}  
                />
                <span className="text-sm font-medium">{awayTeam?.name || 'Away Team'} Win</span>
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

export default MatchPrediction;