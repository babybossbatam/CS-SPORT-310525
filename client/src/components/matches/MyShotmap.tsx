
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

interface MyShotmapProps {
  match?: any;
  fixtureId?: string | number;
  homeTeam?: string;
  awayTeam?: string;
}

interface ShotData {
  id: number;
  x: number;
  y: number;
  type: 'goal' | 'shot' | 'saved' | 'blocked' | 'missed';
  player: string;
  team: string;
  minute: number;
  bodyPart: string;
}

const MyShotmap: React.FC<MyShotmapProps> = ({
  match,
  fixtureId,
  homeTeam,
  awayTeam,
}) => {
  const [shotData, setShotData] = useState<ShotData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away' | 'all'>('all');

  useEffect(() => {
    const fetchShotData = async () => {
      if (!fixtureId) {
        setError("No fixture ID provided");
        setIsLoading(false);
        return;
      }

      try {
        console.log(`⚽ [MyShotmap] Fetching shot data for fixture: ${fixtureId}`);
        
        // For now, generate mock shot data since we don't have a real shot API
        const mockShots: ShotData[] = [
          {
            id: 1,
            x: 85,
            y: 45,
            type: 'goal',
            player: 'Lionel Messi',
            team: homeTeam || 'Home Team',
            minute: 27,
            bodyPart: 'Left Foot'
          },
          {
            id: 2,
            x: 75,
            y: 35,
            type: 'shot',
            player: 'Luis Suárez',
            team: homeTeam || 'Home Team',
            minute: 45,
            bodyPart: 'Right Foot'
          },
          {
            id: 3,
            x: 20,
            y: 50,
            type: 'goal',
            player: 'Carles Gil',
            team: awayTeam || 'Away Team',
            minute: 80,
            bodyPart: 'Right Foot'
          },
          {
            id: 4,
            x: 90,
            y: 40,
            type: 'saved',
            player: 'Jordi Alba',
            team: homeTeam || 'Home Team',
            minute: 65,
            bodyPart: 'Left Foot'
          },
          {
            id: 5,
            x: 78,
            y: 25,
            type: 'blocked',
            player: 'Pedri',
            team: homeTeam || 'Home Team',
            minute: 38,
            bodyPart: 'Right Foot'
          },
          {
            id: 6,
            x: 15,
            y: 60,
            type: 'missed',
            player: 'Antoine Griezmann',
            team: awayTeam || 'Away Team',
            minute: 55,
            bodyPart: 'Header'
          }
        ];

        setShotData(mockShots);
        setError(null);
      } catch (error) {
        console.error(`❌ [MyShotmap] Error fetching shot data:`, error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch shot data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchShotData();
  }, [fixtureId, homeTeam, awayTeam]);

  const getShotColor = (type: string) => {
    switch (type) {
      case 'goal': return '#22c55e';
      case 'shot': return '#ef4444';
      case 'saved': return '#f59e0b';
      case 'blocked': return '#6b7280';
      case 'missed': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getShotSize = (type: string) => {
    return type === 'goal' ? 12 : 8;
  };

  const filteredShots = shotData.filter(shot => {
    if (selectedTeam === 'all') return true;
    if (selectedTeam === 'home') return shot.team === homeTeam;
    if (selectedTeam === 'away') return shot.team === awayTeam;
    return true;
  });

  const renderShotField = () => {
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

        {/* Shot markers */}
        {filteredShots.map(shot => (
          <div
            key={shot.id}
            className="absolute cursor-pointer group"
            style={{
              left: `${shot.x}%`,
              top: `${shot.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div
              className="rounded-full border-2 border-white shadow-lg"
              style={{
                backgroundColor: getShotColor(shot.type),
                width: `${getShotSize(shot.type)}px`,
                height: `${getShotSize(shot.type)}px`
              }}
            />
            
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {shot.player} - {shot.minute}' ({shot.type})
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Shot Map</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading shot data...</p>
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
          <CardTitle className="text-lg font-semibold">Shot Map</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-8">
            <div className="text-center text-gray-500">
              <p>Shot map data not available</p>
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
          <CardTitle className="text-lg font-semibold">Shot Map</CardTitle>
          
          {/* Team selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedTeam('all')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                selectedTeam === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
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
        {/* Shot field */}
        {renderShotField()}

        {/* Shot statistics */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">{homeTeam || 'Home Team'}</h4>
            <div className="space-y-1 text-sm">
              <div>Goals: {shotData.filter(s => s.team === homeTeam && s.type === 'goal').length}</div>
              <div>Shots: {shotData.filter(s => s.team === homeTeam).length}</div>
              <div>On Target: {shotData.filter(s => s.team === homeTeam && (s.type === 'goal' || s.type === 'saved')).length}</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">{awayTeam || 'Away Team'}</h4>
            <div className="space-y-1 text-sm">
              <div>Goals: {shotData.filter(s => s.team === awayTeam && s.type === 'goal').length}</div>
              <div>Shots: {shotData.filter(s => s.team === awayTeam).length}</div>
              <div>On Target: {shotData.filter(s => s.team === awayTeam && (s.type === 'goal' || s.type === 'saved')).length}</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <div className="text-xs text-gray-600">
            Shot Types:
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-500">Goal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-500">Shot</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-gray-500">Saved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-xs text-gray-500">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className="text-xs text-gray-500">Missed</span>
          </div>
        </div>

        {/* Info note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
          <p>⚽ Shot map visualization shows where shots were taken and their outcomes during the match.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyShotmap;
