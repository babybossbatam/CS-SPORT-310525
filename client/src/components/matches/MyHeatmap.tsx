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

  useEffect(() => {
    const generateHeatmapData = () => {
      const points: HeatmapPoint[] = [];
      let pointId = 1;

      // Generate realistic formation-based heatmap data
      const formations = {
        home: {
          // 4-3-3 Formation positions for home team (playing left to right)
          positions: [
            // Goalkeeper
            { x: 8, y: 50, spread: 8 },
            // Defenders
            { x: 20, y: 20, spread: 12 },
            { x: 20, y: 35, spread: 12 },
            { x: 20, y: 65, spread: 12 },
            { x: 20, y: 80, spread: 12 },
            // Midfielders
            { x: 40, y: 30, spread: 15 },
            { x: 40, y: 50, spread: 15 },
            { x: 40, y: 70, spread: 15 },
            // Forwards
            { x: 65, y: 25, spread: 18 },
            { x: 65, y: 50, spread: 18 },
            { x: 65, y: 75, spread: 18 }
          ]
        },
        away: {
          // 4-2-3-1 Formation positions for away team (playing right to left)
          positions: [
            // Goalkeeper
            { x: 92, y: 50, spread: 8 },
            // Defenders
            { x: 80, y: 20, spread: 12 },
            { x: 80, y: 35, spread: 12 },
            { x: 80, y: 65, spread: 12 },
            { x: 80, y: 80, spread: 12 },
            // Defensive Midfielders
            { x: 60, y: 40, spread: 15 },
            { x: 60, y: 60, spread: 15 },
            // Attacking Midfielders
            { x: 45, y: 30, spread: 18 },
            { x: 45, y: 50, spread: 18 },
            { x: 45, y: 70, spread: 18 },
            // Striker
            { x: 35, y: 50, spread: 20 }
          ]
        }
      };

      // Generate points for home team
      formations.home.positions.forEach((pos, index) => {
        const numPoints = Math.floor(Math.random() * 4) + 3; // 3-6 points per position
        for (let i = 0; i < numPoints; i++) {
          const spread = pos.spread;
          const x = Math.max(5, Math.min(95, pos.x + (Math.random() - 0.5) * spread));
          const y = Math.max(5, Math.min(95, pos.y + (Math.random() - 0.5) * spread));

          points.push({
            id: pointId++,
            x,
            y,
            player: `Player ${index + 1}`,
            team: 'home',
            intensity: Math.random() * 0.5 + 0.5
          });
        }
      });

      // Generate points for away team
      formations.away.positions.forEach((pos, index) => {
        const numPoints = Math.floor(Math.random() * 4) + 3; // 3-6 points per position
        for (let i = 0; i < numPoints; i++) {
          const spread = pos.spread;
          const x = Math.max(5, Math.min(95, pos.x + (Math.random() - 0.5) * spread));
          const y = Math.max(5, Math.min(95, pos.y + (Math.random() - 0.5) * spread));

          points.push({
            id: pointId++,
            x,
            y,
            player: `Player ${index + 1}`,
            team: 'away',
            intensity: Math.random() * 0.5 + 0.5
          });
        }
      });

      setHeatmapData(points);
      setIsLoading(false);
    };

    // Simulate API call delay
    const timer = setTimeout(generateHeatmapData, 1000);
    return () => clearTimeout(timer);
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Player Heatmap</CardTitle>
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
              title={`${point.player} (${point.team === 'home' ? homeTeam : awayTeam})`}
            />
          ))}
        </div>

        {/* Legend */}
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

        {/* Info note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
          <p>🗺️ Player positioning heatmap shows where players spent time during the match. Similar to 365scores.com visualization.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyHeatmap;