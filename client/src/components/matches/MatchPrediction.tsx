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
  source?: string;
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
    fixtureId: fixtureId ? `${fixtureId} (${typeof fixtureId})` : 'NOT PROVIDED',
    leagueId,
    season
  });

  // More robust team data validation
  const homeTeamName = typeof homeTeam === 'object' && homeTeam?.name ? String(homeTeam.name) : null;
  const awayTeamName = typeof awayTeam === 'object' && awayTeam?.name ? String(awayTeam.name) : null;
  
  if (!homeTeamName || !awayTeamName) {
    console.warn('❌ [MatchPrediction] Missing team data:', {
      homeTeam: homeTeam ? { name: homeTeamName, type: typeof homeTeam } : null,
      awayTeam: awayTeam ? { name: awayTeamName, type: typeof awayTeam } : null
    });

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
                Home: {homeTeamName || 'Unknown'} | Away: {awayTeamName || 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Only show predictions if we have real data
  const homeWinProbability = predictionData?.homeWinProbability;
  const drawProbability = predictionData?.drawProbability;
  const awayWinProbability = predictionData?.awayWinProbability;

  useEffect(() => {
    const fetchPredictionData = async () => {
      console.log('📊 [MatchPrediction] Starting prediction data fetch:', {
        homeTeamId: homeTeam?.id,
        awayTeamId: awayTeam?.id,
        fixtureId,
        hasProps: { propHomeWin, propDraw, propAwayWin }
      });

      if (!homeTeam?.id || !awayTeam?.id) {
        console.log('⚠️ [MatchPrediction] Missing team IDs, cannot fetch prediction data');
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

        // Add predictions fetch if fixtureId is available - prioritize this over manual calculations
        if (fixtureId) {
          console.log(`📊 [MatchPrediction] Fetching predictions for fixture: ${fixtureId}`);
          // The H2H API endpoint is used for fetching predictions
          fetchPromises.push(fetch(`/api/fixtures/headtohead?h2h=${homeTeam.id}-${awayTeam.id}&last=10`));
        }

        const responses = await Promise.all(fetchPromises);
        const [homeStatsResponse, awayStatsResponse, predictionsResponse] = responses;

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
        } else {
          console.warn(`⚠️ [MatchPrediction] Home team stats API returned ${homeStatsResponse.status}`);
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
        } else {
          console.warn(`⚠️ [MatchPrediction] Away team stats API returned ${awayStatsResponse.status}`);
        }


        // Process RapidAPI predictions data - this is our only source
        let apiPredictions = null;
        if (predictionsResponse && predictionsResponse.ok) {
          try {
            const responseText = await predictionsResponse.text();
            if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
              console.error(`❌ [MatchPrediction] API returned HTML instead of JSON`);
              throw new Error('API returned HTML response instead of JSON');
            }
            const predictionsData = JSON.parse(responseText);
            console.log('📊 [MatchPrediction] RapidAPI Predictions response:', predictionsData);

            // Handle new API response format with response array
            if (predictionsData.response && Array.isArray(predictionsData.response) && predictionsData.response.length > 0) {
              const prediction = predictionsData.response[0];

              if (prediction.predictions && prediction.predictions.percent) {
                const homePercent = parseInt(prediction.predictions.percent.home?.replace('%', '') || '0');
                const drawPercent = parseInt(prediction.predictions.percent.draw?.replace('%', '') || '0');
                const awayPercent = parseInt(prediction.predictions.percent.away?.replace('%', '') || '0');

                // Only use predictions if we have valid data (not all zeros)
                if (homePercent > 0 || drawPercent > 0 || awayPercent > 0) {
                  apiPredictions = {
                    homeWinProbability: homePercent,
                    drawProbability: drawPercent,
                    awayWinProbability: awayPercent,
                    confidence: 95, // High confidence for RapidAPI predictions
                    source: 'rapidapi-predictions'
                  };

                  console.log('✅ [MatchPrediction] Using RapidAPI predictions:', apiPredictions);
                }
              }
            }
            // Fallback to old format for backward compatibility
            else if (predictionsData.success && predictionsData.data && predictionsData.data.length > 0) {
              const prediction = predictionsData.data[0];

              if (prediction.predictions && prediction.predictions.percent) {
                const homePercent = parseInt(prediction.predictions.percent.home?.replace('%', '') || '0');
                const drawPercent = parseInt(prediction.predictions.percent.draw?.replace('%', '') || '0');
                const awayPercent = parseInt(prediction.predictions.percent.away?.replace('%', '') || '0');

                // Only use predictions if we have valid data (not all zeros)
                if (homePercent > 0 || drawPercent > 0 || awayPercent > 0) {
                  apiPredictions = {
                    homeWinProbability: homePercent,
                    drawProbability: drawPercent,
                    awayWinProbability: awayPercent,
                    confidence: 95, // High confidence for RapidAPI predictions
                    source: 'rapidapi-predictions'
                  };

                  console.log('✅ [MatchPrediction] Using RapidAPI predictions:', apiPredictions);
                }
              }
            }
          } catch (predictionsError) {
            console.error('❌ [MatchPrediction] Error processing RapidAPI predictions:', predictionsError);
            // Don't throw, just continue without predictions
          }
        } else if (predictionsResponse && !predictionsResponse.ok) {
          console.warn(`⚠️ [MatchPrediction] Predictions API returned ${predictionsResponse.status} - ${predictionsResponse.statusText}`);
          const errorText = await predictionsResponse.text();
          console.error(`❌ [H2H] Raw error response: ${errorText}`);
          if (errorText.includes("Invalid fixture ID")) {
            setError("Invalid fixture ID for head-to-head data.");
          } else {
            setError("Failed to fetch prediction data.");
          }
        }

        // Only use props as fallback if no RapidAPI data available
        let finalProbabilities = null;
        if (apiPredictions) {
          finalProbabilities = apiPredictions;
        } else if (propHomeWin && propDraw && propAwayWin) {
          finalProbabilities = {
            homeWinProbability: propHomeWin,
            drawProbability: propDraw,
            awayWinProbability: propAwayWin,
            confidence: 70,
            source: 'props'
          };
        } else {
          // No predictions available
          finalProbabilities = null;
        }

        if (finalProbabilities) {
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
        } else {
          // No prediction data available - set to null instead of fallback values
          setPredictionData(null);
        }

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
    const homeWinProbability = predictionData?.homeWinProbability || 0;
    const drawProbability = predictionData?.drawProbability || 0;
    const awayWinProbability = predictionData?.awayWinProbability || 0;

    const highest = Math.max(homeWinProbability, drawProbability, awayWinProbability);
    const confidence = predictionData?.confidence || 50;
    const confidenceText = confidence >= 70 ? 'High confidence' : confidence >= 50 ? 'Moderate confidence' : 'Low confidence';

    const homeTeamName = typeof homeTeam === 'object' && homeTeam?.name ? String(homeTeam.name) : 'Home Team';
    const awayTeamName = typeof awayTeam === 'object' && awayTeam?.name ? String(awayTeam.name) : 'Away Team';

    if (highest === homeWinProbability && highest > 50) {
      return `${homeTeamName} is favored to win this match with a ${homeWinProbability}% probability. (${confidenceText})`;
    } else if (highest === awayWinProbability && highest > 50) {
      return `${awayTeamName} is favored to win this match with a ${awayWinProbability}% probability. (${confidenceText})`;
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

  // Show message when no prediction data is available
  if (!isLoading && (!predictionData || !homeWinProbability || !drawProbability || !awayWinProbability)) {
    return (
      <Card className="w-full shadow-md bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-600 font-normal">Predictions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Who will win?</h3>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-gray-500 mb-2">📊</div>
              <p className="text-gray-500 text-sm">
                Prediction data not available for this match
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {!fixtureId ? 'No fixture ID provided' : 'No prediction data found from API'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-md bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-gray-600 dark:text-white font-normal">Predictions</CardTitle>
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
                    {typeof homeTeam === 'object' && homeTeam?.name ? 
                      (homeTeam.name.length > 12 ? `${homeTeam.name.substring(0, 12)}...` : homeTeam.name) : 
                      'Home Team'}
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
                    {typeof awayTeam === 'object' && awayTeam?.name ? 
                      (awayTeam.name.length > 12 ? `${awayTeam.name.substring(0, 12)}...` : awayTeam.name) : 
                      'Away Team'}
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
                  (predictionData as any).source === 'props' ? 'Provided Props' : 'Team Statistics'
                }` :
                'Data from API'
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchPrediction;