
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

interface PredictionData {
  predictions: {
    winner: {
      id: number;
      name: string;
      comment: string;
    };
    win_or_draw: boolean;
    under_over: null | string;
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
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
}

interface MyPredictionCardProps {
  fixtureId?: string | number;
  homeTeam?: any;
  awayTeam?: any;
}

const MyPredictionCard: React.FC<MyPredictionCardProps> = ({
  fixtureId,
  homeTeam,
  awayTeam
}) => {
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fixtureId) return;

    const fetchPredictions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/predictions/${fixtureId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch predictions');
        }

        const data = await response.json();
        if (data && data.length > 0) {
          setPredictionData(data[0]);
        } else {
          setError('No prediction data available');
        }
      } catch (err) {
        console.error('Error fetching predictions:', err);
        setError('Failed to load predictions');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [fixtureId]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Predictions</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading predictions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !predictionData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Predictions</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-gray-500">
            <AlertCircle className="h-4 w-4" />
            <span>{error || 'No predictions available'}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const homePercent = parseInt(predictionData.predictions.percent.home.replace('%', ''));
  const drawPercent = parseInt(predictionData.predictions.percent.draw.replace('%', ''));
  const awayPercent = parseInt(predictionData.predictions.percent.away.replace('%', ''));

  const totalVotes = 293; // You can calculate this or make it dynamic

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Predictions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Who Will Win? */}
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Who Will Win?</h3>
            <p className="text-gray-500 text-sm mb-6">Total Votes: {totalVotes}</p>
          </div>

          {/* Prediction Bar */}
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="flex w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="bg-gray-600 h-full" 
                style={{ width: `${homePercent}%` }}
              />
              <div 
                className="bg-gray-400 h-full" 
                style={{ width: `${drawPercent}%` }}
              />
              <div 
                className="bg-blue-500 h-full" 
                style={{ width: `${awayPercent}%` }}
              />
            </div>

            {/* Team Info and Percentages */}
            <div className="flex justify-between items-center">
              {/* Home Team */}
              <div className="flex flex-col items-start flex-1">
                <div className="text-lg font-semibold text-gray-800">
                  {homePercent}%
                </div>
                <div className="flex items-center gap-2">
                  {homeTeam?.logo && (
                    <img 
                      src={homeTeam.logo} 
                      alt={homeTeam.name}
                      className="w-5 h-5 object-contain"
                    />
                  )}
                  <span className="text-sm text-gray-600 truncate max-w-[120px]">
                    {homeTeam?.name || predictionData.teams.home.name}
                  </span>
                </div>
              </div>

              {/* Draw */}
              <div className="flex flex-col items-center mx-4">
                <div className="text-lg font-semibold text-gray-800">
                  {drawPercent}%
                </div>
                <span className="text-sm text-gray-600">Draw</span>
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-end flex-1">
                <div className="text-lg font-semibold text-blue-600">
                  {awayPercent}%
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-600 truncate max-w-[120px]">
                    {awayTeam?.name || predictionData.teams.away.name}
                  </span>
                  {awayTeam?.logo && (
                    <img 
                      src={awayTeam.logo} 
                      alt={awayTeam.name}
                      className="w-5 h-5 object-contain"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Advice */}
          {predictionData.predictions.advice && (
            <div className="text-center">
              <p className="text-sm text-gray-600 font-medium">
                {predictionData.predictions.advice}
              </p>
            </div>
          )}

          {/* Winner Info */}
          {predictionData.predictions.winner && (
            <div className="text-center bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Prediction: </span>
                {predictionData.predictions.winner.name} - {predictionData.predictions.winner.comment}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyPredictionCard;
