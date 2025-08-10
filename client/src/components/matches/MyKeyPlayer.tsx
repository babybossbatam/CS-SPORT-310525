import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import MyAvatarInfo from './MyAvatarInfo';
import '@/styles/MyStats.css';

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
    const fetchPlayerStats = async (retryCount = 0) => {
      if (!fixtureId) {
        setError("No fixture ID provided");
        setIsLoading(false);
        return;
      }

      const maxRetries = 2;

      if (retryCount > 0) {
        console.log(`🔄 [MyKeyPlayer] Retry attempt ${retryCount} for fixture ${fixtureId}`);
        // Add delay between retries
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }

      try {
        console.log(`🔍 [MyKeyPlayer] Fetching player statistics for fixture: ${fixtureId}`);

        // PRIORITY 1: Try API-Football (RapidAPI) fixtures/players endpoint first
        console.log(`🔄 [MyKeyPlayer] Trying RapidAPI fixtures/players endpoint first`);
        const rapidPlayersResponse = await fetch(`/api/fixtures/${fixtureId}/players`);
        const rapidPlayersData = await rapidPlayersResponse.json();

        console.log(`🔍 [MyKeyPlayer] RapidAPI fixtures/players response:`, rapidPlayersData);

        if (rapidPlayersData && Array.isArray(rapidPlayersData) && rapidPlayersData.length > 0) {
          const allPlayerStats: PlayerStats[] = [];

          rapidPlayersData.forEach((teamData: any) => {
            console.log(`🔍 [MyKeyPlayer] Processing team: ${teamData.team?.name}`, {
              playersCount: teamData.players?.length,
              hasPlayers: !!teamData.players
            });

            if (teamData.players && Array.isArray(teamData.players)) {
              teamData.players.forEach((playerData: any) => {
                if (playerData && playerData.player && playerData.statistics && playerData.statistics.length > 0) {
                  console.log(`📊 [MyKeyPlayer] Adding player: ${playerData.player.name}`, {
                    position: playerData.statistics[0]?.games?.position,
                    minutes: playerData.statistics[0]?.games?.minutes,
                    goals: playerData.statistics[0]?.goals?.total,
                    assists: playerData.statistics[0]?.goals?.assists
                  });
                  
                  // Transform the data to match our PlayerStats interface
                  const transformedPlayer: PlayerStats = {
                    player: {
                      id: playerData.player.id,
                      name: playerData.player.name,
                      photo: playerData.player.photo || '/assets/fallback_player.png'
                    },
                    statistics: playerData.statistics.map((stat: any) => ({
                      team: {
                        id: teamData.team?.id || 0,
                        name: teamData.team?.name || 'Unknown Team'
                      },
                      games: {
                        minutes: stat.games?.minutes || 0,
                        position: stat.games?.position || 'Unknown'
                      },
                      goals: {
                        total: stat.goals?.total || 0,
                        assists: stat.goals?.assists || 0
                      },
                      shots: {
                        total: stat.shots?.total || 0,
                        on: stat.shots?.on || 0
                      },
                      passes: {
                        total: stat.passes?.total || 0,
                        key: stat.passes?.key || 0,
                        accuracy: stat.passes?.accuracy || 0
                      },
                      tackles: {
                        total: stat.tackles?.total || 0,
                        blocks: stat.tackles?.blocks || 0,
                        interceptions: stat.tackles?.interceptions || 0
                      },
                      duels: {
                        total: stat.duels?.total || 0,
                        won: stat.duels?.won || 0
                      },
                      fouls: {
                        drawn: stat.fouls?.drawn || 0,
                        committed: stat.fouls?.committed || 0
                      }
                    }))
                  };
                  
                  allPlayerStats.push(transformedPlayer);
                }
              });
            }
          });

          if (allPlayerStats.length > 0) {
            console.log(`✅ [MyKeyPlayer] Successfully loaded ${allPlayerStats.length} player statistics from RapidAPI fixtures/players`);
            setPlayerStats(allPlayerStats);
            setError(null);
            setIsLoading(false);
            return;
          } else {
            console.log(`⚠️ [MyKeyPlayer] RapidAPI fixtures/players returned data but no valid player statistics found`);
          }
        } else {
          console.log(`⚠️ [MyKeyPlayer] RapidAPI fixtures/players returned no data or invalid format`);
        }

        // FALLBACK 1: Try the statistics endpoint if fixtures/players fails
        console.log(`🔄 [MyKeyPlayer] Trying RapidAPI statistics endpoint as fallback`);
        const rapidStatsResponse = await fetch(`/api/fixtures/${fixtureId}/statistics`);
        const rapidStatsData = await rapidStatsResponse.json();

        console.log(`🔍 [MyKeyPlayer] RapidAPI statistics response:`, rapidStatsData);

        if (rapidStatsData && Array.isArray(rapidStatsData) && rapidStatsData.length > 0) {
          const allPlayerStats: PlayerStats[] = [];

          rapidStatsData.forEach((teamStat: any) => {
            console.log(`🔍 [MyKeyPlayer] Processing team stats: ${teamStat.team?.name}`, {
              playersCount: teamStat.players?.length,
              hasPlayers: !!teamStat.players
            });

            if (teamStat.players && Array.isArray(teamStat.players)) {
              teamStat.players.forEach((playerData: any) => {
                if (playerData && playerData.player && playerData.statistics && playerData.statistics.length > 0) {
                  console.log(`📊 [MyKeyPlayer] Adding player from stats: ${playerData.player.name}`);
                  allPlayerStats.push(playerData);
                }
              });
            }
          });

          if (allPlayerStats.length > 0) {
            console.log(`✅ [MyKeyPlayer] Successfully loaded ${allPlayerStats.length} player statistics from RapidAPI statistics fallback`);
            setPlayerStats(allPlayerStats);
            setError(null);
            setIsLoading(false);
            return;
          } else {
            console.log(`⚠️ [MyKeyPlayer] RapidAPI statistics returned data but no valid player statistics found`);
          }
        } else {
          console.log(`⚠️ [MyKeyPlayer] RapidAPI statistics returned no data or invalid format`);
        }

        // FALLBACK 1: Try 365scores stats API only if RapidAPI fails
        try {
          console.log(`🔍 [MyKeyPlayer] RapidAPI failed, trying 365scores stats API for fixture: ${fixtureId}`);
          const response365Stats = await fetch(`/api/365scores/game/${fixtureId}/players`);
          const data365Stats = await response365Stats.json();

          console.log(`🔍 [MyKeyPlayer] 365scores stats API response:`, data365Stats);

          if (data365Stats && Array.isArray(data365Stats) && data365Stats.length > 0) {
            console.log(`✅ [MyKeyPlayer] Found ${data365Stats.length} players from 365scores stats API (fallback)`);
            setPlayerStats(data365Stats);
            setError(null);
            setIsLoading(false);
            return;
          }
        } catch (error365Stats) {
          console.error(`❌ [MyKeyPlayer] 365scores stats API failed:`, error365Stats);
        }

        // FALLBACK 2: Try 365scores key players API as last resort
        try {
          console.log(`🔍 [MyKeyPlayer] Both RapidAPI and 365scores stats failed, trying 365scores key players API`);
          const response365 = await fetch(`/api/365scores/game/${fixtureId}/key-players`);
          const data365 = await response365.json();

          console.log(`🔍 [MyKeyPlayer] 365scores key players API response:`, data365);

          // Handle both direct keyPlayers array and success wrapper formats
          const keyPlayersArray = data365?.keyPlayers || data365?.data?.keyPlayers || (Array.isArray(data365) ? data365 : []);

          if (keyPlayersArray && keyPlayersArray.length > 0) {
            console.log(`✅ [MyKeyPlayer] Found ${keyPlayersArray.length} key players from 365scores`);

            // Transform 365scores data to match our PlayerStats interface
            const transformedStats: PlayerStats[] = keyPlayersArray.map((player: any) => ({
              player: {
                id: player.playerId || player.id || Math.random(),
                name: player.playerName || player.name || 'Unknown Player',
                photo: player.photo || '/assets/fallback_player.png'
              },
              statistics: [{
                team: {
                  id: player.teamId || 0,
                  name: player.teamName || 'Unknown Team'
                },
                games: {
                  minutes: player.stats?.minutesPlayed || player.minutesPlayed || 90,
                  position: player.position || player.stats?.position || 'Midfielder'
                },
                goals: {
                  total: player.stats?.goals || player.goals || 0,
                  assists: player.stats?.assists || player.assists || 0
                },
                shots: {
                  total: player.stats?.shots || player.shots || 0,
                  on: player.stats?.shotsOnTarget || player.shotsOnTarget || 0
                },
                passes: {
                  total: player.stats?.passes || player.passes || 0,
                  key: player.stats?.keyPasses || player.keyPasses || 0,
                  accuracy: player.stats?.passAccuracy || player.passAccuracy || 0
                },
                tackles: {
                  total: player.stats?.tackles || player.tackles || 0,
                  blocks: player.stats?.blocks || player.blocks || 0,
                  interceptions: player.stats?.interceptions || player.interceptions || 0
                },
                duels: {
                  total: player.stats?.duels || player.duels || 0,
                  won: player.stats?.duelsWon || player.duelsWon || 0
                },
                fouls: {
                  drawn: player.stats?.foulsDrawn || player.foulsDrawn || 0,
                  committed: player.stats?.foulsCommitted || player.foulsCommitted || 0
                }
              }]
            }));

            console.log(`🎯 [MyKeyPlayer] Transformed ${transformedStats.length} players from 365scores:`, transformedStats);
            setPlayerStats(transformedStats);
            setError(null);
            setIsLoading(false);
            return;
          }
        } catch (error365) {
          console.error(`❌ [MyKeyPlayer] 365scores key players API failed:`, error365);
        }

        // FINAL FALLBACK: If everything fails, hide component completely
        console.log(`⚠️ [MyKeyPlayer] All player statistics APIs failed, hiding component`);
        setPlayerStats([]);
        setError("No player data available");
      } catch (error) {
        console.error(`❌ [MyKeyPlayer] Error fetching player statistics (attempt ${retryCount + 1}):`, error);
        
        // Retry logic
        if (retryCount < maxRetries) {
          console.log(`🔄 [MyKeyPlayer] Retrying in ${(retryCount + 1) * 1000}ms...`);
          setTimeout(() => fetchPlayerStats(retryCount + 1), (retryCount + 1) * 1000);
          return;
        }
        
        setError(error instanceof Error ? error.message : "Failed to fetch player statistics after multiple attempts");
        setPlayerStats([]);
      } finally {
        if (retryCount === 0) {
          setIsLoading(false);
        }
      }
    };

    fetchPlayerStats();
  }, [fixtureId]);

  const getTopPlayersByPosition = (position: string) => {
    console.log(`🔍 [MyKeyPlayer] Filtering ${playerStats.length} players for position: ${position}`);
    console.log(`🔍 [MyKeyPlayer] All available players:`, playerStats.map(p => ({ 
      name: p.player.name, 
      position: p.statistics[0]?.games?.position,
      team: p.statistics[0]?.team?.name 
    })));

    const filtered = playerStats.filter(playerStat => {
      const playerPosition = (playerStat.statistics[0]?.games?.position || '').toLowerCase().trim();
      const targetPosition = position.toLowerCase();

      console.log(`🔍 [MyKeyPlayer] Player: ${playerStat.player.name}, Position: "${playerPosition}", Target: "${targetPosition}"`);

      if (targetPosition === 'attacker') {
        const isAttacker = playerPosition.includes('forward') || 
                          playerPosition.includes('striker') || 
                          playerPosition.includes('winger') || 
                          playerPosition.includes('cf') || 
                          playerPosition.includes('lw') || 
                          playerPosition.includes('rw') ||
                          playerPosition.includes('attacker') ||
                          playerPosition.includes('attack') ||
                          playerPosition.includes('centre-forward') ||
                          playerPosition.includes('left winger') ||
                          playerPosition.includes('right winger') ||
                          playerPosition.includes('f') ||  // Single F for Forward
                          playerPosition === 'lw' ||       // Exact matches
                          playerPosition === 'rw' ||
                          playerPosition === 'cf' ||
                          playerPosition === 'st';         // Striker
        console.log(`🔍 [MyKeyPlayer] Is attacker: ${isAttacker}`);
        return isAttacker;
      } else if (targetPosition === 'midfielder') {
        const isMidfielder = playerPosition.includes('midfield') || 
                           playerPosition.includes('cm') || 
                           playerPosition.includes('am') || 
                           playerPosition.includes('dm') || 
                           playerPosition.includes('cam') || 
                           playerPosition.includes('cdm') ||
                           playerPosition.includes('midfielder') ||
                           playerPosition.includes('mid') ||
                           playerPosition.includes('central midfield') ||
                           playerPosition.includes('attacking midfield') ||
                           playerPosition.includes('defensive midfield') ||
                           playerPosition.includes('m') ||  // Single M for Midfielder
                           playerPosition === 'cm' ||       // Exact matches
                           playerPosition === 'am' ||
                           playerPosition === 'dm' ||
                           playerPosition === 'lm' ||
                           playerPosition === 'rm';
        console.log(`🔍 [MyKeyPlayer] Is midfielder: ${isMidfielder}`);
        return isMidfielder;
      } else if (targetPosition === 'defender') {
        const isDefender = playerPosition.includes('defender') || 
                         playerPosition.includes('back') || 
                         playerPosition.includes('cb') || 
                         playerPosition.includes('lb') || 
                         playerPosition.includes('rb') || 
                         playerPosition.includes('wb') ||
                         playerPosition.includes('defence') ||
                         playerPosition.includes('def') ||
                         playerPosition.includes('centre-back') ||
                         playerPosition.includes('left-back') ||
                         playerPosition.includes('right-back') ||
                         playerPosition.includes('d') ||  // Single D for Defender
                         playerPosition === 'cb' ||       // Exact matches
                         playerPosition === 'lb' ||
                         playerPosition === 'rb' ||
                         playerPosition === 'lwb' ||
                         playerPosition === 'rwb';
        console.log(`🔍 [MyKeyPlayer] Is defender: ${isDefender}`);
        return isDefender;
      }
      return false;
    });

    console.log(`🔍 [MyKeyPlayer] Filtered ${filtered.length} players for position ${position}:`, filtered.map(p => ({ 
      name: p.player.name, 
      position: p.statistics[0]?.games?.position,
      goals: p.statistics[0]?.goals?.total,
      assists: p.statistics[0]?.goals?.assists
    })));

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
      <Card className="w-full mystats-container">
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

  // Hide component completely when no data is available
  if (error && playerStats.length === 0) {
    return null;
  }

  

  const topPlayers = getTopPlayersByPosition(selectedPosition);

  return (
    <Card className="w-full mystats-container">
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
              <MyAvatarInfo
                playerId={topPlayers[0]?.player?.id}
                playerName={topPlayers[0]?.player?.name}
                size="lg"
                className="mb-3"
              />
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
              <MyAvatarInfo
                playerId={topPlayers[1]?.player?.id}
                playerName={topPlayers[1]?.player?.name}
                size="lg"
                className="mb-3"
              />
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
        ) : topPlayers.length === 1 ? (
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center">
              <MyAvatarInfo
                playerId={topPlayers[0]?.player?.id}
                playerName={topPlayers[0]?.player?.name}
                size="lg"
                className="mb-3"
              />
              <div className="text-center">
                <div className="font-medium text-gray-900 text-sm mb-1">
                  {topPlayers[0]?.player?.name}
                </div>
                <div className="text-xs text-gray-500">
                  {topPlayers[0]?.statistics[0]?.games?.position || 'Unknown'}
                </div>
              </div>
            </div>
          </div>
        ) : playerStats.length > 0 ? (
          <div className="text-center text-gray-500 py-4">
            <p>No {selectedPosition.toLowerCase()}s found</p>
            <p className="text-xs mt-1">Available players: {playerStats.length}</p>
            <div className="mt-2 text-xs">
              {playerStats.slice(0, 3).map((player, idx) => (
                <div key={idx}>
                  {player.player.name} ({player.statistics[0]?.games?.position || 'Unknown'})
                </div>
              ))}
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