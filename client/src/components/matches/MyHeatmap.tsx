
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

interface MyHeatmapProps {
  match?: any;
  fixtureId?: string | number;
  homeTeam?: string;
  awayTeam?: string;
}

interface HeatmapData {
  playerId: number;
  playerName: string;
  teamId: number;
  positions: Array<{
    x: number;
    y: number;
    intensity: number;
  }>;
}

const MyHeatmap: React.FC<MyHeatmapProps> = ({
  match,
  fixtureId,
  homeTeam,
  awayTeam,
}) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');

  useEffect(() => {
    const fetchHeatmapData = async () => {
      if (!fixtureId) {
        setError("No fixture ID provided");
        setIsLoading(false);
        return;
      }

      try {
        console.log(`🔥 [MyHeatmap] Fetching heatmap data for fixture: ${fixtureId}`);
        
        // For now, generate mock heatmap data since we don't have a real heatmap API
        const mockData: HeatmapData[] = [
          {
            playerId: 1,
            playerName: "Player 1",
            teamId: 1,
            positions: Array.from({ length: 50 }, (_, i) => ({
              x: Math.random() * 100,
              y: Math.random() * 100,
              intensity: Math.random(),
            })),
          },
          {
            playerId: 2,
            playerName: "Player 2",
            teamId: 1,
            positions: Array.from({ length: 30 }, (_, i) => ({
              x: Math.random() * 100,
              y: Math.random() * 100,
              intensity: Math.random(),
            })),
          },
        ];

        setHeatmapData(mockData);
        setError(null);
      } catch (error) {
        console.error(`❌ [MyHeatmap] Error fetching heatmap data:`, error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch heatmap data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeatmapData();
  }, [fixtureId]);

  const renderHeatmapField = () => {
    return (
      <div className="relative w-full h-80 bg-green-100 border-2 border-green-600 rounded-lg overflow-hidden">
        {/* Football field markings */}
        <div className="absolute inset-0">
          {/* Center line */}
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white transform -translate-x-px"></div>
          
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          
          {/* Goal areas */}
          <div className="absolute top-1/2 left-0 w-12 h-24 border-2 border-white border-l-0 transform -translate-y-1/2"></div>
          <div className="absolute top-1/2 right-0 w-12 h-24 border-2 border-white border-r-0 transform -translate-y-1/2"></div>
          
          {/* Penalty areas */}
          <div className="absolute top-1/2 left-0 w-20 h-40 border-2 border-white border-l-0 transform -translate-y-1/2"></div>
          <div className="absolute top-1/2 right-0 w-20 h-40 border-2 border-white border-r-0 transform -translate-y-1/2"></div>
        </div>

        {/* Heatmap data points */}
        {heatmapData.map((player, playerIndex) =>
          player.positions.map((position, posIndex) => (
            <div
              key={`${playerIndex}-${posIndex}`}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                backgroundColor: `rgba(255, 0, 0, ${position.intensity})`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Player Heatmap</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading heatmap data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Player Heatmap</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-8">
            <div className="text-center text-gray-500">
              <p>Heatmap data not available</p>
              <p className="text-sm">This feature will be available soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Player Heatmap</CardTitle>
          
          {/* Team selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedTeam('home')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                selectedTeam === 'home'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {homeTeam || 'Home'}
            </button>
            <button
              onClick={() => setSelectedTeam('away')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                selectedTeam === 'away'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {awayTeam || 'Away'}
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Heatmap field */}
        {renderHeatmapField()}

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4">
          <div className="text-xs text-gray-600">
            Activity Level:
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-200"></div>
            <span className="text-xs text-gray-500">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-500">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-800"></div>
            <span className="text-xs text-gray-500">High</span>
          </div>
        </div>

        {/* Info note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
          <p>📊 Player movement heatmap shows where players spent most of their time on the field.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyHeatmap;
