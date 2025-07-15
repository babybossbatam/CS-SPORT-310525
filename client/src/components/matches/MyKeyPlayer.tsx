
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface MyKeyPlayerProps {
  match?: any;
  fixtureId?: string | number;
  homeTeam?: string;
  awayTeam?: string;
}

interface PlayerStats {
  player: {
    id: number;
    name: string;
    photo: string;
  };
  statistics: Array<{
    team: {
      id: number;
      name: string;
    };
    games: {
      minutes: number;
      position: string;
    };
    goals: {
      total: number;
      assists: number;
    };
    shots: {
      total: number;
      on: number;
    };
    passes: {
      total: number;
      key: number;
      accuracy: number;
    };
    tackles: {
      total: number;
      blocks: number;
      interceptions: number;
    };
    duels: {
      total: number;
      won: number;
    };
    fouls: {
      drawn: number;
      committed: number;
    };
  }>;
}

const MyKeyPlayer: React.FC<MyKeyPlayerProps> = ({
  match,
  fixtureId,
  homeTeam,
  awayTeam,
}) => {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<'Attacker' | 'Midfielder' | 'Defender'>('Attacker');

  useEffect(() => {
    const fetchPlayerStats = async () => {
      if (!fixtureId) {
        setError("No fixture ID provided");
        setIsLoading(false);
        return;
      }

      try {
        console.log(`🔍 [MyKeyPlayer] Fetching player statistics for fixture: ${fixtureId}`);
        
        // Try 365scores API first
        try {
          const response365 = await fetch(`/api/365scores/game/${fixtureId}/key-players`);
          const data365 = await response365.json();
          
          if (data365?.success && data365?.keyPlayers && data365.keyPlayers.length > 0) {
            console.log(`✅ [MyKeyPlayer] Found ${data365.keyPlayers.length} key players from 365scores`);
            
            // Transform 365scores data to match our PlayerStats interface
            const transformedStats: PlayerStats[] = data365.keyPlayers.map((player: any) => ({
              player: {
                id: player.playerId,
                name: player.playerName,
                photo: player.photo || '/assets/fallback_player.png'
              },
              statistics: [{
                team: {
                  id: player.teamId,
                  name: player.teamName
                },
                games: {
                  minutes: player.stats?.minutesPlayed || 90,
                  position: player.position || 'Unknown'
                },
                goals: {
                  total: player.stats?.goals || 0,
                  assists: player.stats?.assists || 0
                },
                shots: {
                  total: player.stats?.shots || 0,
                  on: 0
                },
                passes: {
                  total: player.stats?.passes || 0,
                  key: 0,
                  accuracy: 0
                },
                tackles: {
                  total: player.stats?.tackles || 0,
                  blocks: 0,
                  interceptions: player.stats?.interceptions || 0
                },
                duels: {
                  total: 0,
                  won: 0
                },
                fouls: {
                  drawn: 0,
                  committed: 0
                }
              }]
            }));
            
            setPlayerStats(transformedStats);
            setError(null);
            return;
          }
        } catch (error365) {
          console.log(`⚠️ [MyKeyPlayer] 365scores API failed, falling back to API-Football`);
        }
        
        // Fallback to API-Football
        const response = await fetch(`/api/fixtures/${fixtureId}/statistics`);
        const data = await response.json();

        if (data && Array.isArray(data) && data.length > 0) {
          // API-Football returns team statistics with players array
          const allPlayerStats: PlayerStats[] = [];
          
          data.forEach((teamStat: any) => {
            console.log(`🔍 [MyKeyPlayer] Processing team: ${teamStat.team?.name}`, teamStat);
            
            if (teamStat.players && Array.isArray(teamStat.players)) {
              console.log(`📊 [MyKeyPlayer] Found ${teamStat.players.length} players for ${teamStat.team?.name}`);
              teamStat.players.forEach((playerData: any) => {
                if (playerData && playerData.player && playerData.statistics) {
                  allPlayerStats.push(playerData);
                }
              });
            } else {
              console.log(`⚠️ [MyKeyPlayer] No players array found for team: ${teamStat.team?.name}`);
            }
          });

          setPlayerStats(allPlayerStats);
          setError(null);
          console.log(`✅ [MyKeyPlayer] Loaded ${allPlayerStats.length} player statistics`);
        } else {
          console.log(`⚠️ [MyKeyPlayer] No team statistics data available`);
          setPlayerStats([]);
          setError(null);
        }
      } catch (error) {
        console.error(`❌ [MyKeyPlayer] Error fetching player statistics:`, error);
        setError(error instanceof Error ? error.message : "Failed to fetch player statistics");
        setPlayerStats([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerStats();
  }, [fixtureId]);

  const getTopPlayersByPosition = (position: string) => {
    const filtered = playerStats.filter(playerStat => {
      const playerPosition = playerStat.statistics[0]?.games?.position?.toLowerCase() || '';
      const targetPosition = position.toLowerCase();
      
      if (targetPosition === 'attacker') {
        return playerPosition.includes('forward') || playerPosition.includes('striker') || playerPosition.includes('winger') || playerPosition.includes('cf') || playerPosition.includes('lw') || playerPosition.includes('rw');
      } else if (targetPosition === 'midfielder') {
        return playerPosition.includes('midfield') || playerPosition.includes('cm') || playerPosition.includes('am') || playerPosition.includes('dm') || playerPosition.includes('cam') || playerPosition.includes('cdm');
      } else if (targetPosition === 'defender') {
        return playerPosition.includes('defender') || playerPosition.includes('back') || playerPosition.includes('cb') || playerPosition.includes('lb') || playerPosition.includes('rb') || playerPosition.includes('wb');
      }
      return false;
    });

    // Sort by key stats based on position
    return filtered.sort((a, b) => {
      const aStats = a.statistics[0];
      const bStats = b.statistics[0];
      
      if (position === 'Attacker') {
        const aScore = (aStats?.goals?.total || 0) + (aStats?.shots?.total || 0) * 0.1;
        const bScore = (bStats?.goals?.total || 0) + (bStats?.shots?.total || 0) * 0.1;
        return bScore - aScore;
      } else if (position === 'Midfielder') {
        const aScore = (aStats?.passes?.total || 0) * 0.01 + (aStats?.goals?.assists || 0) * 2;
        const bScore = (bStats?.passes?.total || 0) * 0.01 + (bStats?.goals?.assists || 0) * 2;
        return bScore - aScore;
      } else {
        const aScore = (aStats?.tackles?.total || 0) + (aStats?.tackles?.interceptions || 0) + (aStats?.tackles?.blocks || 0);
        const bScore = (bStats?.tackles?.total || 0) + (bStats?.tackles?.interceptions || 0) + (bStats?.tackles?.blocks || 0);
        return bScore - aScore;
      }
    }).slice(0, 2); // Top 2 players per position
  };

  const getKeyStatsForPosition = (position: string, playerStats: any) => {
    const stats = playerStats.statistics[0];
    
    if (position === 'Attacker') {
      return {
        stat1: { label: 'Goals', value: stats?.goals?.total || 0 },
        stat2: { label: 'Shots', value: stats?.shots?.total || 0 }
      };
    } else if (position === 'Midfielder') {
      return {
        stat1: { label: 'Passes', value: stats?.passes?.total || 0 },
        stat2: { label: 'Assists', value: stats?.goals?.assists || 0 }
      };
    } else {
      return {
        stat1: { label: 'Tackles', value: stats?.tackles?.total || 0 },
        stat2: { label: 'Interceptions', value: stats?.tackles?.interceptions || 0 }
      };
    }
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

  if (error || playerStats.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Key Players</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-8">
            <div className="text-center text-gray-500">
              <p>Key players data not available</p>
              <p className="text-sm">Player statistics will load after the match</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topPlayers = getTopPlayersByPosition(selectedPosition);

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
            {/* Player 1 (left) */}
            <div className="flex flex-col items-center flex-1">
              <Avatar className="w-16 h-16 mb-3 border-2 border-gray-300">
                <AvatarImage 
                  src={topPlayers[0]?.player?.photo} 
                  alt={topPlayers[0]?.player?.name}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/assets/fallback_player.png';
                  }}
                />
                <AvatarFallback className="text-lg font-semibold">
                  {topPlayers[0]?.player?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div className="font-medium text-gray-900 text-sm mb-1">
                  {topPlayers[0]?.player?.name}
                </div>
                <div className="text-xs text-gray-500">
                  {topPlayers[0]?.statistics[0]?.games?.position || 'Unknown'}
                </div>
              </div>
            </div>

            {/* Stats comparison in the middle */}
            <div className="flex flex-col items-center mx-6 min-w-[120px]">
              {(() => {
                const player1Stats = getKeyStatsForPosition(selectedPosition, topPlayers[0]);
                const player2Stats = getKeyStatsForPosition(selectedPosition, topPlayers[1]);
                
                return (
                  <>
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-lg font-semibold text-gray-900 w-8 text-center">
                        {player1Stats.stat1.value}
                      </span>
                      <div className="flex flex-col items-center mx-3">
                        <span className="text-xs text-gray-500">
                          {player1Stats.stat1.label}
                        </span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900 w-8 text-center">
                        {player2Stats.stat1.value}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-lg font-semibold text-gray-900 w-8 text-center">
                        {player1Stats.stat2.value}
                      </span>
                      <div className="flex flex-col items-center mx-3">
                        <span className="text-xs text-gray-500">
                          {player1Stats.stat2.label}
                        </span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900 w-8 text-center">
                        {player2Stats.stat2.value}
                      </span>
                    </div>
                    
                    {/* Minutes played */}
                    <div className="flex items-center justify-between w-full mt-2 pt-2 border-t">
                      <span className="text-sm text-gray-600 w-8 text-center">
                        {topPlayers[0]?.statistics[0]?.games?.minutes || 0}
                      </span>
                      <span className="text-xs text-gray-500 mx-3">Min</span>
                      <span className="text-sm text-gray-600 w-8 text-center">
                        {topPlayers[1]?.statistics[0]?.games?.minutes || 0}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Player 2 (right) */}
            <div className="flex flex-col items-center flex-1">
              <Avatar className="w-16 h-16 mb-3 border-2 border-gray-300">
                <AvatarImage 
                  src={topPlayers[1]?.player?.photo} 
                  alt={topPlayers[1]?.player?.name}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/assets/fallback_player.png';
                  }}
                />
                <AvatarFallback className="text-lg font-semibold">
                  {topPlayers[1]?.player?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div className="font-medium text-gray-900 text-sm mb-1">
                  {topPlayers[1]?.player?.name}
                </div>
                <div className="text-xs text-gray-500">
                  {topPlayers[1]?.statistics[0]?.games?.position || 'Unknown'}
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
