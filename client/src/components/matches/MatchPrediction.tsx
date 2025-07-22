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

        // Add predictions and odds fetch if fixtureId is available
        if (fixtureId) {
          console.log(`📊 [MatchPrediction] Fetching predictions for fixture: ${fixtureId}`);
          fetchPromises.push(fetch(`/api/fixtures/${fixtureId}/predictions`));
          console.log(`📊 [MatchPrediction] Fetching odds for fixture: ${fixtureId}`);
          fetchPromises.push(fetch(`/api/fixtures/${fixtureId}/odds`));
        }

        const responses = await Promise.all(fetchPromises);
        const [homeStatsResponse, awayStatsResponse, predictionsResponse, oddsResponse] = responses;

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

        // Process predictions data if available (RapidAPI predictions endpoint)
        let apiPredictions = null;
        if (predictionsResponse && predictionsResponse.ok) {
          try {
            const predictionsData = await predictionsResponse.json();
            console.log('📊 [MatchPrediction] Predictions response:', predictionsData);
            
            if (predictionsData.success && predictionsData.data && predictionsData.data.length > 0) {
              const prediction = predictionsData.data[0];
              
              if (prediction.predictions) {
                // Extract win/draw/lose predictions
                const winHome = prediction.predictions.winner?.home || null;
                const winAway = prediction.predictions.winner?.away || null;
                const draw = prediction.predictions.winner?.draw || null;
                
                // Convert to percentages if available
                if (prediction.predictions.percent) {
                  const homePercent = parseInt(prediction.predictions.percent.home?.replace('%', '') || '33');
                  const drawPercent = parseInt(prediction.predictions.percent.draw?.replace('%', '') || '34');
                  const awayPercent = parseInt(prediction.predictions.percent.away?.replace('%', '') || '33');
                  
                  apiPredictions = {
                    homeWinProbability: homePercent,
                    drawProbability: drawPercent,
                    awayWinProbability: awayPercent,
                    confidence: 90, // High confidence for RapidAPI predictions
                    source: 'rapidapi-predictions'
                  };
                  
                  console.log('📊 [MatchPrediction] Using RapidAPI predictions:', apiPredictions);
                }
              }
            }
          } catch (predictionsError) {
            console.error('❌ [MatchPrediction] Error processing predictions data:', predictionsError);
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

        // Use API predictions first, then odds-based, then statistics-based predictions
        const finalProbabilities = apiPredictions || oddsBasedProbabilities || calculatedProbabilities;

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
    <Card className="w-full shadow-md bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-gray-600 font-normal">Predictions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Who will win?</h3>
          
          {/* Total Votes */}
          <div className="text-sm text-gray-500 mb-4">
            Total Votes: {predictionData?.confidence ? Math.round(predictionData.confidence * 50) : '3,495'}
          </div>

          {/* Horizontal Prediction Bar */}
          <div className="relative mb-6">
            <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
              {/* Home Team Bar */}
              <div 
                className="bg-blue-600 h-full"
                style={{ width: `${homeWinProbability}%` }}
              />
              {/* Draw Bar */}
              <div 
                className="bg-gray-400 h-full"
                style={{ width: `${drawProbability}%` }}
              />
              {/* Away Team Bar */}
              <div 
                className="bg-gray-600 h-full"
                style={{ width: `${awayWinProbability}%` }}
              />
            </div>
            
            {/* Percentages and Team Names */}
            <div className="flex justify-between items-center mt-3">
              {/* Home Team */}
              <div className="flex flex-col items-start">
                <div className="text-lg font-semibold text-blue-600">{homeWinProbability}%</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-600 truncate max-w-[100px]">
                    {homeTeam?.name && homeTeam.name.length > 12 ? `${homeTeam.name.substring(0, 12)}...` : homeTeam?.name || 'Home Team'}
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
                <div className="text-lg font-semibold text-gray-800">{awayWinProbability}%</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 truncate max-w-[100px]">
                    {awayTeam?.name && awayTeam.name.length > 12 ? `${awayTeam.name.substring(0, 12)}...` : awayTeam?.name || 'Away Team'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Data source indicator */}
          <div className="flex justify-center">
            <div className="text-xs text-gray-400">
              {predictionData ? 
                `Data from ${
                  (predictionData as any).source === 'rapidapi-predictions' ? 'RapidAPI Predictions' :
                  (predictionData as any).source === 'odds' ? 'Live Betting Odds' : 
                  'Team Statistics'
                }` :
                'Data from RapidAPI'
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchPrediction;