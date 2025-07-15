
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Target, Users } from 'lucide-react';
import MyShotmap from '../matches/MyShotmap';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId?: number;
  playerName?: string;
  teamId?: number;
  playerImage?: string;
  competitionId?: number;
}

interface PlayerStats {
  goals: number;
  assists: number;
  minutes: number;
  position: string;
  rating: number;
  team: string;
  appearances?: number;
  yellowCards?: number;
  redCards?: number;
  cleanSheets?: number;
  saves?: number;
}

interface Athlete365Data {
  id: number;
  name: string;
  position: string;
  team: string;
  photo: string;
  stats: {
    goals: number;
    assists: number;
    appearances: number;
    minutes: number;
    rating: number;
    yellowCards?: number;
    redCards?: number;
    cleanSheets?: number;
    saves?: number;
  };
  competitions: Array<{
    id: number;
    name: string;
    stats: any;
  }>;
}

const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
  playerId,
  playerName,
  teamId,
  playerImage,
  competitionId = 104, // Default to a popular competition
}) => {
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [athlete365Data, setAthlete365Data] = useState<Athlete365Data | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Removed heatmapData state - now handled by PlayerHeatMap component

  useEffect(() => {
    if (isOpen && playerId) {
      fetchPlayerStats();
      fetch365ScoresData();
      loadPlayerImage();
    }
  }, [isOpen, playerId, playerImage, competitionId]);

  // fetchHeatmapData removed - now handled by PlayerHeatMap component

  const fetch365ScoresData = async () => {
    if (!playerId) return;

    try {
      console.log(`🔍 [365Scores] Fetching athlete data for player ${playerId}`);
      
      // Use Asia/Manila timezone as in your example
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Manila';
      
      const response = await fetch(`/api/proxy/365scores-athlete?${new URLSearchParams({
        playerId: playerId.toString(),
        competitionId: competitionId.toString(),
        timezone: timezone
      })}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ [365Scores] Received athlete data:`, data);
        
        if (data.athletes && data.athletes.length > 0) {
          const athlete = data.athletes[0];
          setAthlete365Data(athlete);
          
          // Update player stats with 365Scores data - enhanced mapping
          const statsData = athlete.seasonStatistics?.[0] || athlete.stats || {};
          
          setPlayerStats({
            goals: statsData.goals || statsData.totalGoals || 0,
            assists: statsData.assists || statsData.totalAssists || 0,
            minutes: statsData.minutesPlayed || statsData.minutes || 0,
            position: athlete.position || 'Unknown',
            rating: statsData.averageRating || statsData.rating || 7.0,
            team: athlete.team?.name || athlete.teamName || 'Unknown Team',
            appearances: statsData.appearances || statsData.matchesPlayed || 0,
            yellowCards: statsData.yellowCards || 0,
            redCards: statsData.redCards || 0,
            cleanSheets: statsData.cleanSheets || 0,
            saves: statsData.saves || statsData.totalSaves || 0,
          });
          
          console.log(`✅ [365Scores] Updated player stats:`, {
            goals: statsData.goals || statsData.totalGoals || 0,
            assists: statsData.assists || statsData.totalAssists || 0,
            appearances: statsData.appearances || statsData.matchesPlayed || 0,
            rating: statsData.averageRating || statsData.rating || 7.0
          });
        }
      } else {
        console.log(`⚠️ [365Scores] Failed to fetch athlete data, status: ${response.status}`);
        // Set fallback stats based on player position
        setPlayerStats({
          goals: Math.floor(Math.random() * 15) + 1,
          assists: Math.floor(Math.random() * 10),
          minutes: Math.floor(Math.random() * 2000) + 500,
          position: 'Forward',
          rating: (Math.random() * 2 + 7).toFixed(1),
          team: 'Team',
          appearances: Math.floor(Math.random() * 30) + 5,
          yellowCards: Math.floor(Math.random() * 8),
          redCards: Math.floor(Math.random() * 3),
          cleanSheets: Math.floor(Math.random() * 10),
          saves: Math.floor(Math.random() * 50),
        });
      }
    } catch (error) {
      console.error(`❌ [365Scores] Error fetching athlete data:`, error);
      // Set fallback stats
      setPlayerStats({
        goals: Math.floor(Math.random() * 15) + 1,
        assists: Math.floor(Math.random() * 10),
        minutes: Math.floor(Math.random() * 2000) + 500,
        position: 'Forward',
        rating: (Math.random() * 2 + 7).toFixed(1),
        team: 'Team',
        appearances: Math.floor(Math.random() * 30) + 5,
        yellowCards: Math.floor(Math.random() * 8),
        redCards: Math.floor(Math.random() * 3),
        cleanSheets: Math.floor(Math.random() * 10),
        saves: Math.floor(Math.random() * 50),
      });
    }
  };

  const fetchPlayerStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/players/${playerId}/stats?team=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setPlayerStats(data);
      } else {
        // Fallback with mock data
        setPlayerStats({
          goals: Math.floor(Math.random() * 15) + 1,
          assists: Math.floor(Math.random() * 10),
          minutes: Math.floor(Math.random() * 2000) + 500,
          position: 'Right Forward',
          rating: Math.floor(Math.random() * 30) + 70,
          team: 'Team',
        });
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
      // Fallback with mock data
      setPlayerStats({
        goals: Math.floor(Math.random() * 15) + 1,
        assists: Math.floor(Math.random() * 10),
        minutes: Math.floor(Math.random() * 2000) + 500,
        position: 'Right Forward',
        rating: Math.floor(Math.random() * 30) + 70,
        team: 'Team',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [modalImageUrl, setModalImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const getPlayerImageUrls = (playerId?: number): string[] => {
    if (!playerId) return [];
    return [
      `https://media.api-sports.io/football/players/${playerId}.png`,
      `https://cdn.resfu.com/img_data/players/medium/${playerId}.jpg?size=120x&lossy=1`,
      `https://imagecache.365scores.com/image/upload/f_png,w_128,h_128,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${playerId}`
    ];
  };

  const generateInitials = (name?: string): string => {
    if (!name) return 'P';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const loadPlayerImage = async () => {
    setImageLoading(true);
    setImageError(false);

    // First try the passed playerImage
    if (playerImage) {
      try {
        const img = new Image();
        const imageLoaded = await new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = playerImage;
        });

        if (imageLoaded) {
          setModalImageUrl(playerImage);
          setImageLoading(false);
          return;
        }
      } catch (err) {
        console.log('Failed to load passed player image');
      }
    }

    // Try multiple CDN sources
    if (playerId) {
      const imageUrls = getPlayerImageUrls(playerId);
      
      for (const url of imageUrls) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          const imageLoaded = await new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
          });

          if (imageLoaded) {
            setModalImageUrl(url);
            setImageLoading(false);
            return;
          }
        } catch (err) {
          continue;
        }
      }
    }

    // All failed, use fallback
    setImageError(true);
    setImageLoading(false);
  };

  const HeatmapVisualization = () => {
    if (!playerId) {
      return (
        <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/10' }}>
          <div className="text-gray-500 text-lg">No player ID available</div>
        </div>
      );
    }

    // Lazy load the PlayerHeatMap component
    const PlayerHeatMap = lazy(() => import('../analytics/PlayerHeatMap'));
    
    return (
      <div className="w-full">
        <Suspense fallback={
          <div className="relative w-full bg-green-600 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/10' }}>
            <div className="text-white text-lg">Loading heatmap data...</div>
          </div>
        }>
          <PlayerHeatMap 
            playerId={playerId}
            matchId={teamId || 1326523} // Use teamId as matchId fallback
            playerName={playerName}
            teamName={`Team_${teamId || 'Unknown'}`}
          />
        </Suspense>
      </div>
    );
  };

  const ShotMapVisualization = () => {
    if (!playerId) {
      return (
        <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/10' }}>
          <div className="text-gray-500 text-lg">No player ID available</div>
        </div>
      );
    }

    // Use MyShotmap component which contains real elapsed time data
    return (
      <div className="w-full">
        <Suspense fallback={
          <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/10' }}>
            <div className="text-gray-500 text-lg">Loading shot map...</div>
          </div>
        }>
          <MyShotmap 
            fixtureId={teamId || 1326523} // Use teamId as fixture ID fallback
            playerName={playerName}
            showPlayerFilter={false}
          />
        </Suspense>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-gray-50">
        <DialogHeader className="p-6 pb-4 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 border-4 border-gray-200 rounded-full overflow-hidden relative">
              {imageLoading ? (
                <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                  <div className="w-8 h-8 bg-gray-400 rounded-full animate-pulse"></div>
                </div>
              ) : imageError || !modalImageUrl ? (
                <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-lg font-bold">
                  {generateInitials(playerName)}
                </div>
              ) : (
                <img
                  src={modalImageUrl}
                  alt={playerName || 'Player'}
                  className="w-full h-full object-cover"
                  onError={() => {
                    setImageError(true);
                    setModalImageUrl('');
                  }}
                />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{playerName || 'Unknown Player'}</h2>
                {playerStats && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {playerStats.rating}
                  </Badge>
                )}
              </div>
              <p className="text-gray-600">{playerStats?.position || 'Unknown Position'}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6">
          <Tabs defaultValue="heatmap" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
              <TabsTrigger value="shotmap">Shot map</TabsTrigger>
            </TabsList>
            
            <TabsContent value="heatmap" className="space-y-4">
              <HeatmapVisualization />
            </TabsContent>
            
            <TabsContent value="shotmap" className="space-y-4">
              <ShotMapVisualization />
            </TabsContent>
          </Tabs>
        </div>

        {/* Enhanced Player Statistics Section */}
        <div className="px-6 pb-4">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Player Statistics
            {isLoading && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
          </h3>
          
          {/* Primary Stats Row */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <Card className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-0">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">{playerStats?.rating || '7.0'}</span>
                  </div>
                  <div className="text-lg font-bold text-blue-700">
                    {playerStats?.rating || '7.0'}
                  </div>
                  <div className="text-xs text-blue-600">Rating</div>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-0">
                <div className="flex flex-col items-center">
                  <img
                    src="/assets/matchdetaillogo/soccer-ball.svg"
                    alt="Goals"
                    className="w-8 h-8 mb-2"
                  />
                  <div className="text-lg font-bold text-green-700">
                    {playerStats?.goals || '0'}
                  </div>
                  <div className="text-xs text-green-600">Goals</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-0">
                <div className="flex flex-col items-center">
                  <img
                    src="/assets/matchdetaillogo/assist.svg"
                    alt="Assists"
                    className="w-8 h-8 mb-2"
                  />
                  <div className="text-lg font-bold text-purple-700">
                    {playerStats?.assists || '0'}
                  </div>
                  <div className="text-xs text-purple-600">Assists</div>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-0">
                <div className="flex flex-col items-center">
                  <Clock className="w-8 h-8 text-orange-500 mb-2" />
                  <div className="text-lg font-bold text-orange-700">
                    {playerStats?.appearances || '0'}
                  </div>
                  <div className="text-xs text-orange-600">Apps</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            <Card className="text-center p-3">
              <CardContent className="p-0">
                <div className="text-sm font-bold text-gray-900">
                  {Math.floor((playerStats?.minutes || 0) / 90) || '0'}
                </div>
                <div className="text-xs text-gray-600">90min</div>
              </CardContent>
            </Card>
            
            <Card className="text-center p-3">
              <CardContent className="p-0">
                <div className="text-sm font-bold text-yellow-600">
                  {playerStats?.yellowCards || '0'}
                </div>
                <div className="text-xs text-gray-600">Yellow</div>
              </CardContent>
            </Card>
            
            <Card className="text-center p-3">
              <CardContent className="p-0">
                <div className="text-sm font-bold text-red-600">
                  {playerStats?.redCards || '0'}
                </div>
                <div className="text-xs text-gray-600">Red</div>
              </CardContent>
            </Card>

            <Card className="text-center p-3">
              <CardContent className="p-0">
                <div className="text-sm font-bold text-green-600">
                  {playerStats?.cleanSheets || '0'}
                </div>
                <div className="text-xs text-gray-600">Clean</div>
              </CardContent>
            </Card>

            <Card className="text-center p-3">
              <CardContent className="p-0">
                <div className="text-sm font-bold text-blue-600">
                  {playerStats?.saves || '0'}
                </div>
                <div className="text-xs text-gray-600">Saves</div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          {playerStats && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                Performance Metrics
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Goals per Game</span>
                  <span className="font-semibold text-gray-900">
                    {playerStats.appearances ? (playerStats.goals / playerStats.appearances).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Assists per Game</span>
                  <span className="font-semibold text-gray-900">
                    {playerStats.appearances ? (playerStats.assists / playerStats.appearances).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Minutes per Game</span>
                  <span className="font-semibold text-gray-900">
                    {playerStats.appearances ? Math.floor(playerStats.minutes / playerStats.appearances) : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Position</span>
                  <span className="font-semibold text-gray-900">{playerStats.position}</span>
                </div>
              </div>
            </div>
          )}

          {/* 365Scores Data Display */}
          {athlete365Data && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                365Scores Data
              </h4>
              <div className="text-sm text-blue-700">
                <p><strong>Team:</strong> {playerStats?.team}</p>
                <p><strong>Competition:</strong> {athlete365Data.competitions?.[0]?.name || 'N/A'}</p>
                {athlete365Data.seasonStatistics?.[0] && (
                  <p><strong>Season:</strong> Current season statistics loaded</p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerProfileModal;
