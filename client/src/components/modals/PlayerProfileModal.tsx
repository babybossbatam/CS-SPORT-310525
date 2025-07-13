import React, { useState, useEffect } from 'react';
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
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);

  useEffect(() => {
    if (isOpen && playerId) {
      fetchHeatmapData();
      loadPlayerImage();
    }
  }, [isOpen, playerId, playerImage]);

  const fetchHeatmapData = async () => {
    if (!playerId) return;

    setLoadingHeatmap(true);
    try {
      // Build URL with all available parameters for better SofaScore matching
      const params = new URLSearchParams();
      params.append('eventId', (teamId || 1326523).toString());
      if (playerName) params.append('playerName', playerName);
      if (teamId) params.append('teamName', `Team_${teamId}`);

      // Add additional context that might help SofaScore API matching
      // These would typically come from the match data
      // params.append('homeTeam', 'Home Team Name');
      // params.append('awayTeam', 'Away Team Name');
      // params.append('matchDate', '2025-01-15T10:00:00Z');

      const response = await fetch(`/api/players/${playerId}/heatmap?${params}`);

      if (response.ok) {
        const data = await response.json();
        setHeatmapData(data);

        if (data.source === 'sofascore') {
          console.log('✅ [PlayerProfileModal] Loaded REAL SofaScore heatmap data:', data);
        } else {
          console.log('⚠️ [PlayerProfileModal] Using fallback heatmap data:', data);
        }
      } else {
        console.log('❌ [PlayerProfileModal] API request failed, using null data');
        setHeatmapData(null);
      }
    } catch (error) {
      console.error('❌ [PlayerProfileModal] Error fetching heatmap:', error);
      setHeatmapData(null);
    } finally {
      setLoadingHeatmap(false);
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
    if (loadingHeatmap) {
      return (
        <div className="relative w-full bg-green-600 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/10' }}>
          <div className="text-white text-lg">Loading heatmap data...</div>
        </div>
      );
    }

    const realHeatmapData = heatmapData?.heatmap || [];

    return (
      <div className="relative w-full bg-green-600 rounded-lg overflow-hidden" style={{ aspectRatio: '16/10' }}>
        {/* Football field background */}
        <svg viewBox="0 0 640 400" className="w-full h-full">
          {/* Field background */}
          <rect width="640" height="400" fill="#2d5016" />

          {/* Field lines */}
          <g stroke="white" strokeWidth="2" fill="none">
            {/* Outer boundary */}
            <rect x="20" y="20" width="600" height="360" />

            {/* Center line */}
            <line x1="320" y1="20" x2="320" y2="380" />

            {/* Center circle */}
            <circle cx="320" cy="200" r="50" />
            <circle cx="320" cy="200" r="2" fill="white" />

            {/* Left penalty area */}
            <rect x="20" y="120" width="80" height="160" />
            <rect x="20" y="160" width="40" height="80" />

            {/* Right penalty area */}
            <rect x="540" y="120" width="80" height="160" />
            <rect x="580" y="160" width="40" height="80" />

            {/* Goals */}
            <rect x="20" y="180" width="8" height="40" />
            <rect x="612" y="180" width="8" height="40" />
          </g>

          {/* Dynamic heatmap based on real data */}
          <defs>
            {realHeatmapData.map((_, index) => (
              <radialGradient key={`heatspot-${index}`} id={`heatspot-${index}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={`rgba(255, ${Math.floor(255 * (1 - realHeatmapData[index]?.value || 0.5))}, 0, ${realHeatmapData[index]?.value || 0.5})`} />
                <stop offset="50%" stopColor={`rgba(255, 165, 0, ${(realHeatmapData[index]?.value || 0.3) * 0.7})`} />
                <stop offset="100%" stopColor={`rgba(255, 255, 0, ${(realHeatmapData[index]?.value || 0.1) * 0.3})`} />
              </radialGradient>
            ))}

            {/* Fallback gradients if no real data */}
            <radialGradient id="fallback1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255, 0, 0, 0.8)" />
              <stop offset="50%" stopColor="rgba(255, 165, 0, 0.6)" />
              <stop offset="100%" stopColor="rgba(255, 255, 0, 0.3)" />
            </radialGradient>
            <radialGradient id="fallback2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255, 165, 0, 0.7)" />
              <stop offset="50%" stopColor="rgba(255, 255, 0, 0.5)" />
              <stop offset="100%" stopColor="rgba(173, 255, 47, 0.2)" />
            </radialGradient>
          </defs>

          {/* Real heatmap data visualization */}
          {realHeatmapData.length > 0 ? (
            realHeatmapData.map((point, index) => {
              // Convert percentage coordinates to SVG coordinates
              const x = 20 + (point.x / 100) * 600;
              const y = 20 + (point.y / 100) * 360;
              const intensity = point.value;
              const radius = Math.max(20, intensity * 80);

              return (
                <ellipse
                  key={`heatmap-${index}`}
                  cx={x}
                  cy={y}
                  rx={radius}
                  ry={radius * 0.8}
                  fill={`url(#heatspot-${index})`}
                />
              );
            })
          ) : (
            // Fallback visualization
            <>
              <ellipse cx="450" cy="150" rx="80" ry="60" fill="url(#fallback1)" />
              <ellipse cx="380" cy="200" rx="90" ry="70" fill="url(#fallback2)" />
              <ellipse cx="500" cy="250" rx="70" ry="50" fill="url(#fallback1)" />
            </>
          )}

          {/* Player position dots from real data */}
          {realHeatmapData.map((point, index) => {
            const x = 20 + (point.x / 100) * 600;
            const y = 20 + (point.y / 100) * 360;
            return (
              <circle 
                key={`dot-${index}`}
                cx={x} 
                cy={y} 
                r="2" 
                fill="white" 
                opacity={point.value}
              />
            );
          })}
        </svg>

        {/* Data source indicator */}
        <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
          {heatmapData?.source === 'sofascore' ? (
            <span className="text-green-300">✓ Real SofaScore Data</span>
          ) : heatmapData?.source === 'fallback' ? (
            <span className="text-yellow-300">⚠ Fallback Data</span>
          ) : (
            <span className="text-red-300">✗ Demo Data</span>
          )}
        </div>

        {/* Back button */}
        <button 
          className="absolute top-4 right-4 w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70"
          onClick={onClose}
        >
          ←
        </button>
      </div>
    );
  };

  const ShotMapVisualization = () => {
    if (loadingHeatmap) {
      return (
        <div className="relative w-full bg-green-600 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/10' }}>
          <div className="text-white text-lg">Loading shot map data...</div>
        </div>
      );
    }

    const realShotsData = heatmapData?.shots || [];

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
      <div className="relative w-full bg-green-600 rounded-lg overflow-hidden" style={{ aspectRatio: '16/10' }}>
        {/* Football field background */}
        <svg viewBox="0 0 640 400" className="w-full h-full">
          {/* Field background */}
          <rect width="640" height="400" fill="#2d5016" />

          {/* Field lines */}
          <g stroke="white" strokeWidth="2" fill="none">
            {/* Show only attacking half */}
            <rect x="320" y="20" width="300" height="360" />

            {/* Center line */}
            <line x1="320" y1="20" x2="320" y2="380" />

            {/* Center circle (half) */}
            <path d="M 320 150 A 50 50 0 0 1 320 250" />

            {/* Right penalty area */}
            <rect x="540" y="120" width="80" height="160" />
            <rect x="580" y="160" width="40" height="80" />

            {/* Goal */}
            <rect x="612" y="180" width="8" height="40" />
          </g>

          {/* Real shot markers */}
          {realShotsData.length > 0 ? (
            realShotsData.map((shot, index) => {
              // Convert percentage coordinates to SVG coordinates (attacking half only)
              const x = 320 + (shot.x / 100) * 300;
              const y = 20 + (shot.y / 100) * 360;

              return (
                <g key={`shot-${index}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r={getShotRadius(shot.type)}
                    fill={getShotColor(shot.type)}
                    stroke="white"
                    strokeWidth="1"
                    opacity="0.8"
                  />
                  {/* Minute label */}
                  <text
                    x={x}
                    y={y - getShotRadius(shot.type) - 5}
                    fill="white"
                    fontSize="10"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {shot.minute}'
                  </text>
                </g>
              );
            })
          ) : (
            // Fallback shot markers
            <>
              <circle cx="580" cy="190" r="8" fill="#00ff00" stroke="white" strokeWidth="2" />
              <circle cx="560" cy="210" r="8" fill="#00ff00" stroke="white" strokeWidth="2" />
              <circle cx="570" cy="170" r="6" fill="#ffff00" stroke="white" strokeWidth="1" />
              <circle cx="590" cy="200" r="6" fill="#ffff00" stroke="white" strokeWidth="1" />
              <circle cx="550" cy="160" r="4" fill="#ff6666" stroke="white" strokeWidth="1" />
              <circle cx="580" cy="240" r="4" fill="#ff6666" stroke="white" strokeWidth="1" />
              <circle cx="530" cy="190" r="4" fill="#ff6666" stroke="white" strokeWidth="1" />
            </>
          )}
        </svg>

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
            {heatmapData?.source === 'sofascore' ? (
              <span className="text-green-300">✓ Real SofaScore Data</span>
            ) : heatmapData?.source === 'fallback' ? (
              <span className="text-yellow-300">⚠ Fallback Data</span>
            ) : (
              <span className="text-red-300">✗ Demo Data</span>
            )}
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
              </div>
              <p className="text-gray-600">Player</p>
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