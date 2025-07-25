
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
          const errorText = await response.text();
          console.error('Predictions API error:', response.status, errorText);
          throw new Error(`Failed to fetch predictions: ${response.status}`);
        }

        const data = await response.json();
        console.log('Predictions API response:', data);
        
        if (data && Array.isArray(data) && data.length > 0) {
          setPredictionData(data[0]);
        } else if (data && !Array.isArray(data)) {
          // Handle single object response
          setPredictionData(data);
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
    <Card className="w-full bg-white">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-left">
            <h3 className="text-xl font-semibold text-gray-900">Predictions</h3>
          </div>

          {/* Who Will Win Section */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Who Will Win?</h2>
            <p className="text-gray-500 text-sm mb-6">Total Votes: {totalVotes}</p>
          </div>

          {/* Progress Bar - matches the design with correct proportions */}
          <div className="space-y-4">
            <div className="flex w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="bg-gray-600 h-full transition-all duration-300" 
                style={{ width: `${homePercent}%` }}
              />
              <div 
                className="bg-gray-400 h-full transition-all duration-300" 
                style={{ width: `${drawPercent}%` }}
              />
              <div 
                className="bg-blue-500 h-full transition-all duration-300" 
                style={{ width: `${awayPercent}%` }}
              />
            </div>

            {/* Team percentages and names below progress bar */}
            <div className="flex justify-between items-center pt-2">
              {/* Home Team - Left */}
              <div className="flex flex-col items-start flex-1 max-w-[30%]">
                <div className="text-xl font-bold text-gray-900 mb-1">
                  {homePercent}%
                </div>
                <div className="text-sm text-gray-700 font-medium truncate max-w-full">
                  {homeTeam?.name || predictionData.teams.home.name}
                </div>
              </div>

              {/* Draw - Center */}
              <div className="flex flex-col items-center mx-8">
                <div className="text-xl font-bold text-gray-900 mb-1">
                  {drawPercent}%
                </div>
                <div className="text-sm text-gray-700 font-medium">
                  Draw
                </div>
              </div>

              {/* Away Team - Right */}
              <div className="flex flex-col items-end flex-1 max-w-[30%]">
                <div className="text-xl font-bold text-blue-600 mb-1">
                  {awayPercent}%
                </div>
                <div className="text-sm text-blue-600 font-medium truncate max-w-full text-right">
                  {awayTeam?.name || predictionData.teams.away.name}
                </div>
              </div>
            </div>
          </div>

          {/* Additional prediction info if available */}
          {predictionData.predictions.advice && (
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 italic">
                {predictionData.predictions.advice}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyPredictionCard;
