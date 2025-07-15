
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface MyKeyPlayerProps {
  match?: any;
  fixtureId?: string | number;
  homeTeam?: string;
  awayTeam?: string;
}

interface KeyPlayerStats {
  playerId: number;
  playerName: string;
  position: string;
  teamId: number;
  teamName: string;
  stats: {
    interceptions?: number;
    clearances?: number;
    minutesPlayed?: number;
    tackles?: number;
    passes?: number;
    shots?: number;
    saves?: number;
    assists?: number;
    goals?: number;
  };
  photo?: string;
}

const MyKeyPlayer: React.FC<MyKeyPlayerProps> = ({
  match,
  fixtureId,
  homeTeam,
  awayTeam,
}) => {
  const [keyPlayers, setKeyPlayers] = useState<KeyPlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<'Attacker' | 'Midfielder' | 'Defender'>('Attacker');

  useEffect(() => {
    const fetchKeyPlayers = async () => {
      if (!fixtureId) {
        setError("No fixture ID provided");
        setIsLoading(false);
        return;
      }

      try {
        console.log(`🔍 [MyKeyPlayer] Fetching key players for fixture: ${fixtureId}`);
        
        const response = await fetch(`/api/365scores/game/${fixtureId}/key-players`);
        const data = await response.json();

        if (data.success && data.keyPlayers) {
          setKeyPlayers(data.keyPlayers);
          setError(null);
          console.log(`✅ [MyKeyPlayer] Loaded ${data.keyPlayers.length} key players`);
        } else {
          console.log(`⚠️ [MyKeyPlayer] No key players data available`);
          setKeyPlayers([]);
          setError(null);
        }
      } catch (error) {
        console.error(`❌ [MyKeyPlayer] Error fetching key players:`, error);
        setError(error instanceof Error ? error.message : "Failed to fetch key players data");
        setKeyPlayers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKeyPlayers();
  }, [fixtureId]);

  const getTopPlayersByPosition = (position: string) => {
    const filtered = keyPlayers.filter(player => {
      const playerPosition = player.position.toLowerCase();
      const targetPosition = position.toLowerCase();
      
      if (targetPosition === 'attacker') {
        return playerPosition.includes('forward') || playerPosition.includes('striker') || playerPosition.includes('winger');
      } else if (targetPosition === 'midfielder') {
        return playerPosition.includes('midfield') || playerPosition.includes('central') || playerPosition.includes('attacking midfielder') || playerPosition.includes('defensive midfielder');
      } else if (targetPosition === 'defender') {
        return playerPosition.includes('defender') || playerPosition.includes('back') || playerPosition.includes('centre-back') || playerPosition.includes('fullback');
      }
      return false;
    });

    // Sort by key stats based on position
    return filtered.sort((a, b) => {
      if (position === 'Attacker') {
        return (b.stats.goals || 0) + (b.stats.shots || 0) - ((a.stats.goals || 0) + (a.stats.shots || 0));
      } else if (position === 'Midfielder') {
        return (b.stats.passes || 0) + (b.stats.assists || 0) - ((a.stats.passes || 0) + (a.stats.assists || 0));
      } else {
        return (b.stats.interceptions || 0) + (b.stats.clearances || 0) - ((a.stats.interceptions || 0) + (a.stats.clearances || 0));
      }
    }).slice(0, 2); // Top 2 players per position
  };

  const getKeyStatsForPosition = (position: string) => {
    if (position === 'Attacker') {
      return ['goals', 'shots'];
    } else if (position === 'Midfielder') {
      return ['passes', 'assists'];
    } else {
      return ['interceptions', 'clearances'];
    }
  };

  const formatStatValue = (value: number | undefined): string => {
    return value !== undefined ? value.toString() : '0';
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Key Players</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading key players...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || keyPlayers.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Key Players</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-8">
            <div className="text-center text-gray-500">
              <p>Key players data not available</p>
              <p className="text-sm">This feature will be available soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topPlayers = getTopPlayersByPosition(selectedPosition);
  const keyStats = getKeyStatsForPosition(selectedPosition);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">Key Players</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* Position selector tabs */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          {(['Attacker', 'Midfielder', 'Defender'] as const).map((position) => (
            <button
              key={position}
              onClick={() => setSelectedPosition(position)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                selectedPosition === position
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {position}
            </button>
          ))}
        </div>

        {/* Key players comparison */}
        {topPlayers.length >= 2 ? (
          <div className="flex items-center justify-between">
            {/* Home team player (left) */}
            <div className="flex flex-col items-center flex-1">
              <Avatar className="w-16 h-16 mb-3 border-2 border-gray-300">
                <AvatarImage 
                  src={topPlayers[0]?.photo} 
                  alt={topPlayers[0]?.playerName}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/assets/fallback_player.png';
                  }}
                />
                <AvatarFallback className="text-lg font-semibold">
                  {topPlayers[0]?.playerName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div className="font-medium text-gray-900 text-sm mb-1">
                  {topPlayers[0]?.playerName}
                </div>
                <div className="text-xs text-gray-500">
                  {topPlayers[0]?.position}
                </div>
              </div>
            </div>

            {/* Stats comparison in the middle */}
            <div className="flex flex-col items-center mx-6 min-w-[120px]">
              {keyStats.map((statKey, index) => (
                <div key={statKey} className="flex items-center justify-between w-full mb-2">
                  <span className="text-lg font-semibold text-gray-900 w-8 text-center">
                    {formatStatValue(topPlayers[0]?.stats[statKey as keyof typeof topPlayers[0]['stats']] as number)}
                  </span>
                  <div className="flex flex-col items-center mx-3">
                    <span className="text-xs text-gray-500 capitalize">
                      {statKey === 'goals' ? 'Goals' : 
                       statKey === 'shots' ? 'Shots' :
                       statKey === 'passes' ? 'Passes' :
                       statKey === 'assists' ? 'Assists' :
                       statKey === 'interceptions' ? 'Interceptions' :
                       statKey === 'clearances' ? 'Clearances' : statKey}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900 w-8 text-center">
                    {formatStatValue(topPlayers[1]?.stats[statKey as keyof typeof topPlayers[1]['stats']] as number)}
                  </span>
                </div>
              ))}
              
              {/* Minutes played */}
              <div className="flex items-center justify-between w-full mt-2 pt-2 border-t">
                <span className="text-sm text-gray-600 w-8 text-center">
                  {formatStatValue(topPlayers[0]?.stats.minutesPlayed)}
                </span>
                <span className="text-xs text-gray-500 mx-3">Min</span>
                <span className="text-sm text-gray-600 w-8 text-center">
                  {formatStatValue(topPlayers[1]?.stats.minutesPlayed)}
                </span>
              </div>
            </div>

            {/* Away team player (right) */}
            <div className="flex flex-col items-center flex-1">
              <Avatar className="w-16 h-16 mb-3 border-2 border-gray-300">
                <AvatarImage 
                  src={topPlayers[1]?.photo} 
                  alt={topPlayers[1]?.playerName}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/assets/fallback_player.png';
                  }}
                />
                <AvatarFallback className="text-lg font-semibold">
                  {topPlayers[1]?.playerName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div className="font-medium text-gray-900 text-sm mb-1">
                  {topPlayers[1]?.playerName}
                </div>
                <div className="text-xs text-gray-500">
                  {topPlayers[1]?.position}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>Not enough {selectedPosition.toLowerCase()} data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyKeyPlayer;
