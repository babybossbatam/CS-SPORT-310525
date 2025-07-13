
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface HeatMapPoint {
  x: number;
  y: number;
  intensity: number;
}

interface PlayerHeatMapProps {
  playerId: number;
  matchId: number;
  playerName?: string;
  teamName?: string;
}

const PlayerHeatMap: React.FC<PlayerHeatMapProps> = ({
  playerId,
  matchId,
  playerName,
  teamName
}) => {
  const [heatmapData, setHeatmapData] = useState<HeatMapPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHeatmapData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/players/${playerId}/heatmap?eventId=${matchId}&playerName=${playerName}&teamName=${teamName}`);
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        // Still show fallback data if available
        setHeatmapData(data.heatmap || []);
        return;
      }

      setHeatmapData(data.heatmap || []);
    } catch (err) {
      console.error('❌ [PlayerHeatMap] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load heatmap data');
      // Set empty array as fallback
      setHeatmapData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (playerId && matchId) {
      fetchHeatmapData();
    }
  }, [playerId, matchId]);

  const renderHeatMap = () => {
    if (!heatmapData.length) return null;

    const maxIntensity = Math.max(...heatmapData.map(point => point.intensity));
    
    return (
      <div className="relative w-full h-64 bg-green-100 border-2 border-white overflow-hidden">
        {/* Football pitch background */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 64">
          {/* Pitch outline */}
          <rect x="2" y="2" width="96" height="60" fill="none" stroke="white" strokeWidth="0.5"/>
          {/* Center circle */}
          <circle cx="50" cy="32" r="8" fill="none" stroke="white" strokeWidth="0.5"/>
          {/* Center line */}
          <line x1="50" y1="2" x2="50" y2="62" stroke="white" strokeWidth="0.5"/>
          {/* Goal areas */}
          <rect x="2" y="20" width="12" height="24" fill="none" stroke="white" strokeWidth="0.5"/>
          <rect x="86" y="20" width="12" height="24" fill="none" stroke="white" strokeWidth="0.5"/>
          {/* Penalty areas */}
          <rect x="2" y="14" width="20" height="36" fill="none" stroke="white" strokeWidth="0.5"/>
          <rect x="78" y="14" width="20" height="36" fill="none" stroke="white" strokeWidth="0.5"/>
        </svg>

        {/* Heatmap points */}
        {heatmapData.map((point, index) => (
          <div
            key={index}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: '8px',
              height: '8px',
              backgroundColor: `rgba(255, 0, 0, ${point.intensity / maxIntensity})`,
              transform: 'translate(-50%, -50%)',
              filter: 'blur(2px)'
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Player Heat Map
          {playerName && <span className="text-sm font-normal text-gray-600">{playerName}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading heatmap data...</span>
          </div>
        )}

        {error && (
          <div className="text-center p-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchHeatmapData} variant="outline">
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && heatmapData.length > 0 && renderHeatMap()}

        {!isLoading && !error && heatmapData.length === 0 && (
          <div className="text-center p-8 text-gray-500">
            No heatmap data available for this player in this match.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerHeatMap;
