
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Player365Stats {
  id: number;
  name: string;
  teamId: number;
  position: string;
  stats: Record<string, any>;
  rating?: number;
  minutes?: number;
  gameId: number;
  matchStats: Record<string, any>;
}

interface Player365StatsSectionProps {
  playerId?: number;
  playerName?: string;
  gameId?: number; // This could be derived from teamId or match context
}

const Player365StatsSection: React.FC<Player365StatsSectionProps> = ({
  playerId,
  playerName,
  gameId
}) => {
  const [playerStats, setPlayerStats] = useState<Player365Stats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (playerId && gameId) {
      fetchPlayerStats();
    }
  }, [playerId, gameId]);

  const fetchPlayerStats = async () => {
    if (!playerId || !gameId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(`📊 [Player365Stats] Fetching stats for player ${playerId} in game ${gameId}`);
      
      const response = await fetch(`/api/365scores/game/${gameId}/player/${playerId}/stats?timezone=Asia/Manila`);
      
      if (response.ok) {
        const data = await response.json();
        setPlayerStats(data);
        console.log(`✅ [Player365Stats] Retrieved stats for ${playerName}`, data);
      } else {
        console.log(`⚠️ [Player365Stats] No stats found for player ${playerId}`);
        setError('Stats not available from 365scores');
      }
    } catch (error) {
      console.error(`❌ [Player365Stats] Error fetching stats:`, error);
      setError('Failed to load 365scores stats');
    } finally {
      setIsLoading(false);
    }
  };

  const formatStatValue = (value: any): string => {
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'string') {
      return value;
    }
    return '-';
  };

  const getKeyStats = (stats: Record<string, any>) => {
    // Extract key performance metrics
    const keyStats = [
      { label: 'Passes', value: stats.passes || stats.totalPasses },
      { label: 'Pass Accuracy', value: stats.passAccuracy ? `${stats.passAccuracy}%` : undefined },
      { label: 'Shots', value: stats.shots || stats.totalShots },
      { label: 'Shots on Target', value: stats.shotsOnTarget },
      { label: 'Tackles', value: stats.tackles || stats.totalTackles },
      { label: 'Interceptions', value: stats.interceptions },
      { label: 'Dribbles', value: stats.dribbles || stats.successfulDribbles },
      { label: 'Touches', value: stats.touches || stats.ballTouches },
      { label: 'Duels Won', value: stats.duelsWon },
      { label: 'Fouls', value: stats.fouls || stats.foulsConceded },
      { label: 'Yellow Cards', value: stats.yellowCards },
      { label: 'Red Cards', value: stats.redCards }
    ].filter(stat => stat.value !== undefined && stat.value !== null);

    return keyStats;
  };

  const getAttackingStats = (stats: Record<string, any>) => {
    return [
      { label: 'Goals', value: stats.goals },
      { label: 'Assists', value: stats.assists },
      { label: 'Key Passes', value: stats.keyPasses },
      { label: 'Shots', value: stats.shots },
      { label: 'Shots on Target', value: stats.shotsOnTarget },
      { label: 'Offsides', value: stats.offsides },
      { label: 'Dribbles', value: stats.dribbles },
      { label: 'Cross Accuracy', value: stats.crossAccuracy ? `${stats.crossAccuracy}%` : undefined }
    ].filter(stat => stat.value !== undefined && stat.value !== null);
  };

  const getDefensiveStats = (stats: Record<string, any>) => {
    return [
      { label: 'Tackles', value: stats.tackles },
      { label: 'Interceptions', value: stats.interceptions },
      { label: 'Clearances', value: stats.clearances },
      { label: 'Blocks', value: stats.blocks },
      { label: 'Duels Won', value: stats.duelsWon },
      { label: 'Aerial Duels Won', value: stats.aerialDuelsWon },
      { label: 'Fouls', value: stats.fouls }
    ].filter(stat => stat.value !== undefined && stat.value !== null);
  };

  if (!gameId) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            365Scores Match Stats
            <Badge variant="outline">Live Data</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Game ID not available for 365Scores stats</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            365Scores Match Stats
            <Badge variant="outline">Live Data</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading 365Scores data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !playerStats) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            365Scores Match Stats
            <Badge variant="outline">Live Data</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 p-4">
            <p>{error || '365Scores stats not available'}</p>
            <button 
              onClick={fetchPlayerStats}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const keyStats = getKeyStats(playerStats.stats);
  const attackingStats = getAttackingStats(playerStats.stats);
  const defensiveStats = getDefensiveStats(playerStats.stats);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          365Scores Match Stats
          <Badge variant="outline">Live Data</Badge>
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {playerStats.rating && (
            <div className="flex items-center gap-1">
              <span>Rating:</span>
              <Badge variant="secondary">{playerStats.rating}</Badge>
            </div>
          )}
          {playerStats.minutes && (
            <div className="flex items-center gap-1">
              <span>Minutes:</span>
              <Badge variant="outline">{playerStats.minutes}'</Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attacking">Attacking</TabsTrigger>
            <TabsTrigger value="defensive">Defensive</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {keyStats.map((stat, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">{stat.label}</span>
                  <span className="font-medium">{formatStatValue(stat.value)}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="attacking" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {attackingStats.map((stat, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="text-sm text-gray-600">{stat.label}</span>
                  <span className="font-medium text-green-700">{formatStatValue(stat.value)}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="defensive" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {defensiveStats.map((stat, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-sm text-gray-600">{stat.label}</span>
                  <span className="font-medium text-blue-700">{formatStatValue(stat.value)}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t text-xs text-gray-500">
          Data provided by 365Scores • Game ID: {playerStats.gameId}
        </div>
      </CardContent>
    </Card>
  );
};

export default Player365StatsSection;
