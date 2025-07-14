
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

interface MyHeatmapProps {
  match?: any;
  fixtureId?: string | number;
  homeTeam?: string;
  awayTeam?: string;
}

interface HeatmapPoint {
  id: number;
  x: number;
  y: number;
  player: string;
  team: 'home' | 'away';
  intensity: number;
  playerId?: number;
}

const MyHeatmap: React.FC<MyHeatmapProps> = ({
  match,
  fixtureId,
  homeTeam,
  awayTeam,
}) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away' | 'both'>('both');
  const [dataSource, setDataSource] = useState<'sofascore' | 'none'>('none');

  useEffect(() => {
    const fetchHeatmapData = async () => {
      if (!fixtureId) {
        setError('No fixture ID provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Try to fetch real SofaScore heatmap data
        const response = await fetch(`/api/players/1/heatmap?eventId=${fixtureId}&homeTeam=${encodeURIComponent(homeTeam || '')}&awayTeam=${encodeURIComponent(awayTeam || '')}&matchDate=${new Date().toISOString()}`);
        
        if (response.ok) {
          const sofaScoreData = await response.json();
          
          if (sofaScoreData.source === 'sofascore' && sofaScoreData.heatmap && sofaScoreData.heatmap.length > 0) {
            console.log(`✅ [MyHeatmap] Using real SofaScore data with ${sofaScoreData.heatmap.length} points`);
            
            // Convert SofaScore data to our format
            const convertedPoints: HeatmapPoint[] = sofaScoreData.heatmap.map((point: any, index: number) => ({
              id: index + 1,
              x: Math.max(0, Math.min(100, point.x || 50)),
              y: Math.max(0, Math.min(100, point.y || 50)),
              player: point.player || `Player ${index + 1}`,
              team: (point.x || 50) > 50 ? 'away' : 'home', // Assume right side is away team
              intensity: Math.max(0, Math.min(1, point.value || point.intensity || 0.5)),
              playerId: point.playerId
            }));

            setHeatmapData(convertedPoints);
            setDataSource('sofascore');
            setIsLoading(false);
            return;
          }
        }

        // No real data available
        console.log('⚠️ [MyHeatmap] No real SofaScore heatmap data available');
        setHeatmapData([]);
        setDataSource('sofascore');
        setIsLoading(false);
        
      } catch (error) {
        console.error('❌ [MyHeatmap] Error fetching SofaScore data:', error);
        setError('Failed to fetch heatmap data');
        setIsLoading(false);
      }
    };

    

    fetchHeatmapData();
  }, [fixtureId, homeTeam, awayTeam]);

  const filteredPoints = heatmapData.filter(point => {
    if (selectedTeam === 'both') return true;
    return point.team === selectedTeam;
  });

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
          <div className="text-center p-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>Player Heatmap</span>
          <div className="flex items-center gap-2">
            {dataSource === 'sofascore' && heatmapData.length > 0 && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                📊 SofaScore Data
              </span>
            )}
            {dataSource === 'none' && (
              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                📊 No Data Available
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* Team Filter */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Show:</span>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value as 'home' | 'away' | 'both')}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="both">Both Teams</option>
              <option value="home">{homeTeam || 'Home Team'}</option>
              <option value="away">{awayTeam || 'Away Team'}</option>
            </select>
          </div>
        </div>

        {/* Football Field with Heatmap */}
        {heatmapData.length === 0 ? (
          <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-gray-600 font-medium">No Heatmap Data Available</p>
              <p className="text-gray-500 text-sm mt-1">Real player positioning data not available for this match</p>
            </div>
          </div>
        ) : (
        <div className="relative w-full bg-green-600 rounded-lg overflow-hidden" style={{ aspectRatio: '16/10' }}>
          {/* Field Background SVG */}
          <svg 
            viewBox="0 0 800 500" 
            className="w-full h-full absolute inset-0"
            style={{ backgroundColor: '#4a9a4a' }}
          >
            {/* Field outline */}
            <rect x="20" y="20" width="760" height="460" 
                  fill="none" stroke="white" strokeWidth="2"/>

            {/* Center line */}
            <line x1="400" y1="20" x2="400" y2="480" 
                  stroke="white" strokeWidth="2"/>

            {/* Center circle */}
            <circle cx="400" cy="250" r="60" 
                    fill="none" stroke="white" strokeWidth="2"/>

            {/* Left penalty area */}
            <rect x="20" y="140" width="120" height="220" 
                  fill="none" stroke="white" strokeWidth="2"/>

            {/* Left goal area */}
            <rect x="20" y="190" width="40" height="120" 
                  fill="none" stroke="white" strokeWidth="2"/>

            {/* Right penalty area */}
            <rect x="660" y="140" width="120" height="220" 
                  fill="none" stroke="white" strokeWidth="2"/>

            {/* Right goal area */}
            <rect x="740" y="190" width="40" height="120" 
                  fill="none" stroke="white" strokeWidth="2"/>

            {/* Corner arcs */}
            <path d="M 20 20 Q 30 20 30 30" 
                  fill="none" stroke="white" strokeWidth="2"/>
            <path d="M 780 20 Q 770 20 770 30" 
                  fill="none" stroke="white" strokeWidth="2"/>
            <path d="M 20 480 Q 30 480 30 470" 
                  fill="none" stroke="white" strokeWidth="2"/>
            <path d="M 780 480 Q 770 480 770 470" 
                  fill="none" stroke="white" strokeWidth="2"/>
          </svg>

          {/* Heatmap Points */}
          {filteredPoints.map((point) => (
            <div
              key={point.id}
              className="absolute rounded-full transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                width: `${8 + point.intensity * 12}px`,
                height: `${8 + point.intensity * 12}px`,
                backgroundColor: point.team === 'home' 
                  ? `rgba(255, 255, 255, ${0.6 + point.intensity * 0.4})` 
                  : `rgba(255, 255, 255, ${0.6 + point.intensity * 0.4})`,
                boxShadow: point.team === 'home' 
                  ? `0 0 ${4 + point.intensity * 8}px rgba(66, 153, 225, 0.8)` 
                  : `0 0 ${4 + point.intensity * 8}px rgba(236, 72, 153, 0.8)`,
                border: point.team === 'home' 
                  ? '2px solid rgba(66, 153, 225, 0.8)' 
                  : '2px solid rgba(236, 72, 153, 0.8)',
                zIndex: Math.floor(point.intensity * 10)
              }}
              title={`${point.player} (${point.team === 'home' ? homeTeam : awayTeam}) - Intensity: ${(point.intensity * 100).toFixed(0)}%`}
            />
          ))}
        </div>
        )}

        {/* Legend */}
        {heatmapData.length > 0 && (
          <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-white border-2 border-blue-400"></div>
                <span>{homeTeam || 'Home Team'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-white border-2 border-pink-400"></div>
                <span>{awayTeam || 'Away Team'}</span>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              Larger dots = More activity
            </div>
          </div>
        )}

        {/* Info note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
          <p>
            🗺️ Player positioning heatmap shows where players spent time during the match. 
            {dataSource === 'sofascore' && heatmapData.length > 0
              ? ' Using real SofaScore data.' 
              : ' No heatmap data available for this match.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyHeatmap;
