import React, { useState, useEffect, memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ShotData {
  id: number;
  x: number;
  y: number;
  type: 'goal' | 'shot' | 'saved' | 'blocked';
  player: string;
  team: string;
  minute: number;
  bodyPart: string;
}

interface ShotMapProps {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
}

const ShotMapVisualization: React.FC<ShotMapProps> = ({
  matchId,
  homeTeam,
  awayTeam
}) => {
  const [shots, setShots] = useState<ShotData[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate shot data - in real implementation, fetch from API
    const mockShots: ShotData[] = [
      { id: 1, x: 85, y: 45, type: 'goal', player: 'Lionel Messi', team: homeTeam, minute: 27, bodyPart: 'Left Foot' },
      { id: 2, x: 75, y: 35, type: 'shot', player: 'Luis Suárez', team: homeTeam, minute: 45, bodyPart: 'Right Foot' },
      { id: 3, x: 20, y: 50, type: 'goal', player: 'Carles Gil', team: awayTeam, minute: 80, bodyPart: 'Right Foot' },
      { id: 4, x: 90, y: 40, type: 'saved', player: 'Jordi Alba', team: homeTeam, minute: 65, bodyPart: 'Left Foot' },
    ];

    setTimeout(() => {
      setShots(mockShots);
      setIsLoading(false);
    }, 1000);
  }, [matchId, homeTeam, awayTeam]);

  const filteredShots = shots.filter(shot => {
    if (selectedTeam !== 'all' && shot.team !== selectedTeam) return false;
    if (selectedPlayer !== 'all' && shot.player !== selectedPlayer) return false;
    return true;
  });

  const uniquePlayers = [...new Set(shots.map(shot => shot.player))];

  const getShotColor = (type: string) => {
    switch (type) {
      case 'goal': return '#22c55e';
      case 'shot': return '#ef4444';
      case 'saved': return '#f59e0b';
      case 'blocked': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getShotSize = (type: string) => {
    return type === 'goal' ? 12 : 8;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shot Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            Loading shot data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shot Map - {homeTeam} vs {awayTeam}</CardTitle>
        <div className="flex gap-4 mt-4">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value={homeTeam}>{homeTeam}</SelectItem>
              <SelectItem value={awayTeam}>{awayTeam}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by player" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Players</SelectItem>
              {uniquePlayers.map(player => (
                <SelectItem key={player} value={player}>{player}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-80 bg-green-200 border-2 border-white mb-4">
          {/* Football pitch */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 64">
            {/* Pitch elements */}
            <rect x="2" y="2" width="96" height="60" fill="none" stroke="white" strokeWidth="0.8"/>
            <circle cx="50" cy="32" r="8" fill="none" stroke="white" strokeWidth="0.8"/>
            <line x1="50" y1="2" x2="50" y2="62" stroke="white" strokeWidth="0.8"/>
            <rect x="2" y="20" width="12" height="24" fill="none" stroke="white" strokeWidth="0.8"/>
            <rect x="86" y="20" width="12" height="24" fill="none" stroke="white" strokeWidth="0.8"/>
            <rect x="2" y="14" width="20" height="36" fill="none" stroke="white" strokeWidth="0.8"/>
            <rect x="78" y="14" width="20" height="36" fill="none" stroke="white" strokeWidth="0.8"/>
          </svg>

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

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Goal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Shot</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Saved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Blocked</span>
          </div>
        </div>

        {/* Shot statistics */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">{homeTeam}</h4>
            <div className="space-y-1 text-sm">
              <div>Goals: {shots.filter(s => s.team === homeTeam && s.type === 'goal').length}</div>
              <div>Shots: {shots.filter(s => s.team === homeTeam).length}</div>
              <div>On Target: {shots.filter(s => s.team === homeTeam && (s.type === 'goal' || s.type === 'saved')).length}</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">{awayTeam}</h4>
            <div className="space-y-1 text-sm">
              <div>Goals: {shots.filter(s => s.team === awayTeam && s.type === 'goal').length}</div>
              <div>Shots: {shots.filter(s => s.team === awayTeam).length}</div>
              <div>On Target: {shots.filter(s => s.team === awayTeam && (s.type === 'goal' || s.type === 'saved')).length}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShotMapVisualization;