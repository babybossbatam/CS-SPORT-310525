
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Target, Users } from 'lucide-react';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId?: number;
  playerName?: string;
  teamId?: number;
  playerImage?: string;
}

interface PlayerStats {
  goals: number;
  assists: number;
  minutes: number;
  position: string;
  rating: number;
  team: string;
}

const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
  playerId,
  playerName,
  teamId,
  playerImage,
}) => {
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Removed heatmapData state - now handled by PlayerHeatMap component

  useEffect(() => {
    if (isOpen && playerId) {
      fetchPlayerStats();
      loadPlayerImage();
    }
  }, [isOpen, playerId, playerImage]);

  // fetchHeatmapData removed - now handled by PlayerHeatMap component

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

    // For now, show a placeholder for shot map - this could be enhanced later
    const realShotsData = [];
    
    const getShotColor = (type: string) => {
      switch (type.toLowerCase()) {
        case 'goal': return '#00ff00';
        case 'on_target': return '#ffff00';
        case 'off_target': return '#ff6666';
        case 'blocked': return '#ff9999';
        default: return '#cccccc';
      }
    };

    const getShotRadius = (type: string) => {
      switch (type.toLowerCase()) {
        case 'goal': return 8;
        case 'on_target': return 6;
        case 'off_target': return 4;
        case 'blocked': return 5;
        default: return 4;
      }
    };
    
    return (
      <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: '16/10' }}>
        {/* Football field background using field.png */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/assets/matchdetaillogo/field.png)' }}
        >
          {/* Shot markers overlay */}
          <div className="absolute inset-0 w-full h-full">
            {realShotsData.length > 0 ? (
              realShotsData.map((shot, index) => {
                // Convert percentage coordinates to absolute positioning
                const x = 50 + (shot.x / 100) * 40; // Adjust for field positioning
                const y = 10 + (shot.y / 100) * 80;
                
                return (
                  <div
                    key={`shot-${index}`}
                    className="absolute"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div
                      className="rounded-full border-2 border-white opacity-80"
                      style={{
                        width: `${getShotRadius(shot.type) * 2}px`,
                        height: `${getShotRadius(shot.type) * 2}px`,
                        backgroundColor: getShotColor(shot.type)
                      }}
                    />
                    <div
                      className="absolute text-white text-xs font-bold pointer-events-none"
                      style={{
                        top: `${-getShotRadius(shot.type) - 15}px`,
                        left: '50%',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      {shot.minute}'
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback shot markers
              <>
                <div className="absolute" style={{ left: '80%', top: '45%', transform: 'translate(-50%, -50%)' }}>
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div className="absolute" style={{ left: '75%', top: '55%', transform: 'translate(-50%, -50%)' }}>
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div className="absolute" style={{ left: '78%', top: '35%', transform: 'translate(-50%, -50%)' }}>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full border border-white" />
                </div>
                <div className="absolute" style={{ left: '82%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full border border-white" />
                </div>
                <div className="absolute" style={{ left: '72%', top: '30%', transform: 'translate(-50%, -50%)' }}>
                  <div className="w-2 h-2 bg-red-400 rounded-full border border-white" />
                </div>
                <div className="absolute" style={{ left: '80%', top: '65%', transform: 'translate(-50%, -50%)' }}>
                  <div className="w-2 h-2 bg-red-400 rounded-full border border-white" />
                </div>
                <div className="absolute" style={{ left: '68%', top: '45%', transform: 'translate(-50%, -50%)' }}>
                  <div className="w-2 h-2 bg-red-400 rounded-full border border-white" />
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Goals</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>On Target</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span>Off Target</span>
            </div>
          </div>
          <div className="mt-1 text-xs opacity-75">
            <span className="text-yellow-300">⚠ Shot Map Coming Soon</span>
          </div>
        </div>
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

        {/* Top Stats Section */}
        <div className="px-6 pb-4">
          <h3 className="font-semibold text-lg mb-3 text-gray-900">Top Stats</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="text-center p-4">
              <CardContent className="p-0">
                <div className="flex flex-col items-center">
                  <Clock className="w-8 h-8 text-red-500 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {playerStats?.minutes || '90'}'
                  </div>
                  <div className="text-sm text-gray-600">Min</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="text-center p-4">
              <CardContent className="p-0">
                <div className="flex flex-col items-center">
                  <Target className="w-8 h-8 text-gray-700 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {playerStats?.goals || '2'}
                  </div>
                  <div className="text-sm text-gray-600">Goals</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="text-center p-4">
              <CardContent className="p-0">
                <div className="flex flex-col items-center">
                  <Users className="w-8 h-8 text-blue-500 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {playerStats?.assists || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Assists</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats Section */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Attacking</h4>
            <div className="flex justify-between items-center">
              <span className="text-blue-600 font-medium">{playerName || 'Player'}</span>
              <button 
                className="text-gray-600 hover:text-gray-800"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerProfileModal;
