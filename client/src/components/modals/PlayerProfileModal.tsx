
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
                  <img
                    src="/assets/matchdetaillogo/soccer-ball.svg"
                    alt="Goals"
                    className="w-8 h-8 mb-2"
                  />
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
