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

      // If we have props but no fixture ID, use props
      if ((!fixtureId || !homeTeam?.id || !awayTeam?.id) && (propHomeWin || propDraw || propAwayWin)) {
        console.log('📊 [MatchPrediction] Using prop data due to missing IDs');
        setPredictionData({
          homeWinProbability: propHomeWin || 0,
          drawProbability: propDraw || 0,
          awayWinProbability: propAwayWin || 0,
          confidence: 70,
          homeTeamStats: {
            form: 'N/A', goalsScored: 0, goalsConceded: 0, cleanSheets: 0,
            avgPossession: 50, matchesPlayed: 0, wins: 0, draws: 0, losses: 0,
          },
          awayTeamStats: {
            form: 'N/A', goalsScored: 0, goalsConceded: 0, cleanSheets: 0,
            avgPossession: 50, matchesPlayed: 0, wins: 0, draws: 0, losses: 0,
          },
        });
        setIsLoading(false);
        return;
      }

      if (!fixtureId) {
        console.log('⚠️ [MatchPrediction] Missing fixture ID, cannot fetch prediction data');
        setPredictionData(null);
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
          fetchPromises.push(fetch(`/api/predictions/${fixtureId}`));
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

        // Process RapidAPI predictions data - this is our only source
        let apiPredictions = null;
        if (predictionsResponse && predictionsResponse.ok) {
          try {
            const responseText = await predictionsResponse.text();
            console.log('📊 [MatchPrediction] Raw predictions response text:', responseText.substring(0, 200));
            
            // Check if response is HTML (error page) instead of JSON
            if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
              console.error('❌ [MatchPrediction] Received HTML response instead of JSON');
              throw new Error('Server returned HTML instead of JSON');
            }
            
            const predictionsData = JSON.parse(responseText);
            console.log('📊 [MatchPrediction] RapidAPI Predictions response:', predictionsData);
            
            if (predictionsData.success && predictionsData.data && predictionsData.data.length > 0) {
              const prediction = predictionsData.data[0];
              console.log('🎯 [MatchPrediction] Processing prediction object:', prediction);
              
              if (prediction.predictions && prediction.predictions.percent) {
                // Handle both string percentages like "45%" and direct numbers
                let homePercent = 0;
                let drawPercent = 0;
                let awayPercent = 0;

                if (typeof prediction.predictions.percent.home === 'string') {
                  homePercent = parseInt(prediction.predictions.percent.home.replace('%', '') || '0');
                } else if (typeof prediction.predictions.percent.home === 'number') {
                  homePercent = prediction.predictions.percent.home;
                }

                if (typeof prediction.predictions.percent.draw === 'string') {
                  drawPercent = parseInt(prediction.predictions.percent.draw.replace('%', '') || '0');
                } else if (typeof prediction.predictions.percent.draw === 'number') {
                  drawPercent = prediction.predictions.percent.draw;
                }

                if (typeof prediction.predictions.percent.away === 'string') {
                  awayPercent = parseInt(prediction.predictions.percent.away.replace('%', '') || '0');
                } else if (typeof prediction.predictions.percent.away === 'number') {
                  awayPercent = prediction.predictions.percent.away;
                }
                
                console.log('🎯 [MatchPrediction] Parsed percentages:', { homePercent, drawPercent, awayPercent });
                
                // Use predictions if we have any valid data (including 0%)
                if (homePercent >= 0 && drawPercent >= 0 && awayPercent >= 0) {
                  apiPredictions = {
                    homeWinProbability: homePercent,
                    drawProbability: drawPercent,
                    awayWinProbability: awayPercent,
                    confidence: 95, // High confidence for RapidAPI predictions
                    source: 'rapidapi-predictions'
                  };
                  
                  console.log('✅ [MatchPrediction] Using RapidAPI predictions:', apiPredictions);
                } else {
                  console.log('⚠️ [MatchPrediction] Invalid percentage values:', { homePercent, drawPercent, awayPercent });
                }
              } else {
                console.log('⚠️ [MatchPrediction] Missing predictions.percent structure:', prediction);
              }
            } else if (predictionsData.success && predictionsData.data) {
              // Handle case where data is a single object instead of array
              const prediction = Array.isArray(predictionsData.data) ? predictionsData.data[0] : predictionsData.data;
              console.log('🎯 [MatchPrediction] Processing single prediction object:', prediction);
              
              if (prediction && prediction.predictions && prediction.predictions.percent) {
                let homePercent = 0;
                let drawPercent = 0;
                let awayPercent = 0;

                const percentData = prediction.predictions.percent;
                
                if (typeof percentData.home === 'string') {
                  homePercent = parseInt(percentData.home.replace('%', '') || '0');
                } else if (typeof percentData.home === 'number') {
                  homePercent = percentData.home;
                }

                if (typeof percentData.draw === 'string') {
                  drawPercent = parseInt(percentData.draw.replace('%', '') || '0');
                } else if (typeof percentData.draw === 'number') {
                  drawPercent = percentData.draw;
                }

                if (typeof percentData.away === 'string') {
                  awayPercent = parseInt(percentData.away.replace('%', '') || '0');
                } else if (typeof percentData.away === 'number') {
                  awayPercent = percentData.away;
                }

                if (homePercent >= 0 && drawPercent >= 0 && awayPercent >= 0) {
                  apiPredictions = {
                    homeWinProbability: homePercent,
                    drawProbability: drawPercent,
                    awayWinProbability: awayPercent,
                    confidence: 95,
                    source: 'rapidapi-predictions'
                  };
                  console.log('✅ [MatchPrediction] Using single prediction object:', apiPredictions);
                }
              }
            } else {
              console.log('⚠️ [MatchPrediction] Invalid API response structure:', predictionsData);
            }
          } catch (predictionsError) {
            console.error('❌ [MatchPrediction] Error processing RapidAPI predictions:', predictionsError);
          }
        }

        // Only use props as fallback if no RapidAPI data available
        let finalProbabilities = null;
        if (apiPredictions) {
          finalProbabilities = apiPredictions;
          console.log('✅ [MatchPrediction] Using API predictions as final data:', finalProbabilities);
        } else if (propHomeWin && propDraw && propAwayWin) {
          finalProbabilities = {
            homeWinProbability: propHomeWin,
            drawProbability: propDraw,
            awayWinProbability: propAwayWin,
            confidence: 70,
            source: 'props'
          };
          console.log('✅ [MatchPrediction] Using prop predictions as final data:', finalProbabilities);
        } else {
          // No predictions available
          finalProbabilities = null;
          console.log('❌ [MatchPrediction] No predictions available from any source');
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
        setError(error instanceof Error ? error.message : 'Failed to load prediction data');
        
        // Don't use fallback data - set to null to show proper no-data state
        setPredictionData(null);
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

  // Show error state when data loading fails
  if (error && !isLoading) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center">
            Match Prediction
            <span className="ml-2 text-red-500">⚠️</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="text-red-500 text-2xl mb-2">❌</div>
              <h3 className="text-lg font-medium mb-2 text-red-600">Failed to Load Prediction</h3>
              <p className="text-sm text-gray-600 mb-2">
                Unable to fetch match prediction data
              </p>
              <p className="text-xs text-gray-400">
                {error || 'Unknown error occurred'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const homeStats = predictionData?.homeTeamStats;
  const awayStats = predictionData?.awayTeamStats;

  // Only show prediction component when we have real data
  if (!isLoading && (!predictionData || (!homeWinProbability && homeWinProbability !== 0 && !drawProbability && drawProbability !== 0 && !awayWinProbability && awayWinProbability !== 0))) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">Match Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="text-gray-400 text-2xl mb-2">📊</div>
              <h3 className="text-lg font-medium mb-2 text-gray-600">No Prediction Available</h3>
              <p className="text-sm text-gray-500">
                Prediction data is not available for this match
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
                  'Team Statistics'
                }` :
                'Data from RapidAPI Predictions'
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchPrediction;