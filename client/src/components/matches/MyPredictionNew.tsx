
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MyPredictionNewProps {
  match?: any;
  fixtureId?: string | number;
}

interface PredictionData {
  fixture: {
    id: number;
    timezone: string;
    date: string;
    timestamp: number;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      last_5: {
        form: string;
        att: string;
        def: string;
        goals: {
          for: {
            total: number;
            average: string;
          };
          against: {
            total: number;
            average: string;
          };
        };
      };
    };
    away: {
      id: number;
      name: string;
      logo: string;
      last_5: {
        form: string;
        att: string;
        def: string;
        goals: {
          for: {
            total: number;
            average: string;
          };
          against: {
            total: number;
            average: string;
          };
        };
      };
    };
  };
  predictions: {
    winner: {
      id: number;
      name: string;
      comment: string;
    };
    win_or_draw: boolean;
    under_over: string;
    goals: {
      home: string;
      away: string;
    };
    advice: string;
    percent: {
      home: string;
      draw: string;
      away: string;
    };
  };
}

const MyPredictionNew: React.FC<MyPredictionNewProps> = ({ match, fixtureId }) => {
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract fixture ID from props or match object
  const extractedFixtureId = fixtureId || match?.fixture?.id;

  // Debug logging for fixture ID analysis
  console.log('🔮 [MyPredictionNew] Component initialized with:', {
    fixtureIdProp: fixtureId,
    matchObject: match,
    matchFixtureId: match?.fixture?.id,
    extractedFixtureId: extractedFixtureId,
    fixtureIdType: typeof extractedFixtureId,
    matchStructure: match ? {
      hasFixture: !!match.fixture,
      fixtureKeys: match.fixture ? Object.keys(match.fixture) : null,
      teams: match.teams ? {
        home: match.teams.home?.name,
        away: match.teams.away?.name
      } : null
    } : 'No match object'
  });

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!extractedFixtureId) {
        setError('No fixture ID available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log(`🔮 [MyPredictionNew] Starting prediction fetch process:`, {
          extractedFixtureId,
          fixtureIdType: typeof extractedFixtureId,
          timestamp: new Date().toISOString(),
          requestUrl: `/api/predictions/${extractedFixtureId}`
        });

        const response = await fetch(`/api/predictions/${extractedFixtureId}`);
        
        console.log(`🔮 [MyPredictionNew] API Response received:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: {
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length')
          },
          url: response.url
        });
        
        if (!response.ok) {
          console.error(`❌ [MyPredictionNew] HTTP Error:`, {
            status: response.status,
            statusText: response.statusText,
            fixtureId: extractedFixtureId
          });
          throw new Error(`Failed to fetch prediction: ${response.status} ${response.statusText}`);
        }

        const responseText = await response.text();
        
        console.log(`🔮 [MyPredictionNew] Raw response received:`, {
          responseLength: responseText.length,
          responseStart: responseText.substring(0, 200),
          isHTML: responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html'),
          fixtureId: extractedFixtureId
        });
        
        // Check if response is HTML (error page) instead of JSON
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          console.error(`❌ [MyPredictionNew] Received HTML instead of JSON:`, {
            fixtureId: extractedFixtureId,
            responsePreview: responseText.substring(0, 500)
          });
          throw new Error('Prediction service temporarily unavailable');
        }

        let data;
        try {
          data = JSON.parse(responseText);
          console.log(`✅ [MyPredictionNew] JSON parsed successfully:`, {
            fixtureId: extractedFixtureId,
            dataKeys: Object.keys(data),
            hasResponse: !!data.response,
            responseType: Array.isArray(data.response) ? 'array' : typeof data.response,
            responseLength: Array.isArray(data.response) ? data.response.length : 'not array',
            hasError: !!data.error,
            errorMessage: data.error
          });
        } catch (parseError) {
          console.error(`❌ [MyPredictionNew] JSON parse error:`, {
            fixtureId: extractedFixtureId,
            parseError: parseError instanceof Error ? parseError.message : parseError,
            responseText: responseText.substring(0, 1000)
          });
          throw new Error('Invalid response format from prediction service');
        }
        
        if (data.error) {
          console.error(`❌ [MyPredictionNew] API returned error:`, {
            fixtureId: extractedFixtureId,
            error: data.error,
            fullData: data
          });
          throw new Error(data.error);
        }

        if (!data.response || data.response.length === 0) {
          console.warn(`⚠️ [MyPredictionNew] No prediction data:`, {
            fixtureId: extractedFixtureId,
            hasResponse: !!data.response,
            responseLength: data.response?.length,
            fullData: data
          });
          throw new Error('No prediction data available for this match');
        }

        // Handle both array and single object responses
        const predictionResponse = Array.isArray(data.response) ? data.response[0] : data.response;
        
        console.log(`✅ [MyPredictionNew] Prediction processing successful:`, {
          fixtureId: extractedFixtureId,
          predictionKeys: predictionResponse ? Object.keys(predictionResponse) : null,
          hasPredictions: !!predictionResponse?.predictions,
          hasTeams: !!predictionResponse?.teams,
          homeTeam: predictionResponse?.teams?.home?.name,
          awayTeam: predictionResponse?.teams?.away?.name
        });
        
        setPredictionData(predictionResponse);
        console.log(`✅ [MyPredictionNew] Prediction data loaded for fixture: ${extractedFixtureId}`);

      } catch (err) {
        console.error(`❌ [MyPredictionNew] Complete error analysis:`, {
          fixtureId: extractedFixtureId,
          errorType: err instanceof Error ? err.constructor.name : typeof err,
          errorMessage: err instanceof Error ? err.message : String(err),
          errorStack: err instanceof Error ? err.stack : null,
          timestamp: new Date().toISOString()
        });

        // Test if it's a connectivity issue
        const errorMessage = err instanceof Error ? err.message : 'Failed to load prediction';
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          setError('Connection error - Please check your internet connection');
        } else if (errorMessage.includes('temporarily unavailable')) {
          setError('Prediction service is temporarily down - Please try again later');
        } else if (errorMessage.includes('No prediction data')) {
          setError('No prediction available for this match');
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [extractedFixtureId]);

  // Don't render if no fixture ID
  if (!extractedFixtureId) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Match Prediction</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm text-gray-600">Loading prediction...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !predictionData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Match Prediction</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center py-6">
            <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
            <span className="text-sm text-red-600 font-medium mb-2">
              {error || 'No prediction available'}
            </span>
            <span className="text-xs text-gray-500">
              Fixture ID: {extractedFixtureId}
            </span>
            <span className="text-xs text-gray-400 mt-1">
              This match may not have prediction data available from the API
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { predictions, teams } = predictionData;

  // Helper function to get form trend icon based on percentage
  const getFormIcon = (formPercentage: string) => {
    const percentage = parseInt(formPercentage?.replace('%', '') || '0');
    
    if (percentage >= 60) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (percentage <= 30) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  // Helper function to get form color based on percentage
  const getFormColor = (formPercentage: string) => {
    const percentage = parseInt(formPercentage?.replace('%', '') || '0');
    
    if (percentage >= 60) return 'text-green-600';
    if (percentage <= 30) return 'text-red-600';
    return 'text-gray-600';
  };

  // Helper function to parse percentage strings
  const parsePercentage = (percentStr: string) => {
    return parseInt(percentStr?.replace('%', '') || '0');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          🔮 Match Prediction
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* Winner Prediction */}
        <div className="text-center">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Predicted Winner</h3>
            <div className="text-xl font-bold text-blue-800">
              {predictions.winner.name}
            </div>
            <p className="text-sm text-blue-700 mt-1">
              {predictions.winner.comment}
            </p>
          </div>
        </div>

        {/* Win Probabilities */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">Win Probabilities</h4>
          
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img 
                src={teams.home.logo} 
                alt={teams.home.name}
                className="w-6 h-6 object-contain"
              />
              <span className="text-sm font-medium">{teams.home.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${parsePercentage(predictions.percent.home)}%` }}
                />
              </div>
              <span className="text-sm font-semibold min-w-[3rem] text-right">
                {predictions.percent.home}
              </span>
            </div>
          </div>

          {/* Draw */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded">
                <Minus className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium">Draw</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${parsePercentage(predictions.percent.draw)}%` }}
                />
              </div>
              <span className="text-sm font-semibold min-w-[3rem] text-right">
                {predictions.percent.draw}
              </span>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img 
                src={teams.away.logo} 
                alt={teams.away.name}
                className="w-6 h-6 object-contain"
              />
              <span className="text-sm font-medium">{teams.away.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${parsePercentage(predictions.percent.away)}%` }}
                />
              </div>
              <span className="text-sm font-semibold min-w-[3rem] text-right">
                {predictions.percent.away}
              </span>
            </div>
          </div>
        </div>

        {/* Predicted Goals */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600 mb-1">Predicted Goals</div>
            <div className="flex items-center justify-center space-x-2">
              <img 
                src={teams.home.logo} 
                alt={teams.home.name}
                className="w-5 h-5 object-contain"
              />
              <span className="font-bold text-lg">{predictions.goals.home}</span>
              <span className="text-gray-500">-</span>
              <span className="font-bold text-lg">{predictions.goals.away}</span>
              <img 
                src={teams.away.logo} 
                alt={teams.away.name}
                className="w-5 h-5 object-contain"
              />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600 mb-1">Under/Over</div>
            <div className="font-bold text-lg">{predictions.under_over || 'N/A'}</div>
          </div>
        </div>

        {/* Team Form */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">Recent Form (Last 5 Games)</h4>
          
          {/* Home Team Form */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <img 
                src={teams.home.logo} 
                alt={teams.home.name}
                className="w-6 h-6 object-contain"
              />
              <span className="text-sm font-medium">{teams.home.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              {getFormIcon(teams.home.last_5.form)}
              <span className={`text-sm ${getFormColor(teams.home.last_5.form)}`}>
                Form: {teams.home.last_5.form}
              </span>
              {teams.home.league?.form && (
                <span className="text-xs text-gray-500 font-mono">
                  ({teams.home.league.form.slice(-5)})
                </span>
              )}
            </div>
          </div>

          {/* Away Team Form */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <img 
                src={teams.away.logo} 
                alt={teams.away.name}
                className="w-6 h-6 object-contain"
              />
              <span className="text-sm font-medium">{teams.away.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              {getFormIcon(teams.away.last_5.form)}
              <span className={`text-sm ${getFormColor(teams.away.last_5.form)}`}>
                Form: {teams.away.last_5.form}
              </span>
              {teams.away.league?.form && (
                <span className="text-xs text-gray-500 font-mono">
                  ({teams.away.league.form.slice(-5)})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Betting Advice */}
        {predictions.advice && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="font-semibold text-yellow-800 mb-2">Betting Advice</h4>
            <p className="text-sm text-yellow-700">{predictions.advice}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyPredictionNew;
