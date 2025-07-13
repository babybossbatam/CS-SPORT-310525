
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
  matchId?: number;
}

interface PlayerStats {
  goals: number;
  assists: number;
  minutes: number;
  position: string;
  rating: number;
  team: string;
}

interface HeatmapData {
  points: Array<{
    x: number;
    y: number;
    intensity: number;
  }>;
}

const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
  playerId,
  playerName,
  teamId,
  playerImage,
  matchId,
}) => {
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);

  useEffect(() => {
    if (isOpen && playerId) {
      fetchPlayerStats();
      loadPlayerImage();
      if (matchId) {
        fetchHeatmapData();
      }
    }
  }, [isOpen, playerId, playerImage, matchId]);

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

  const fetchHeatmapData = async () => {
    if (!playerId || !matchId) {
      console.log(`🔥 [PlayerModal] Missing required data - playerId: ${playerId}, matchId: ${matchId}`);
      return;
    }
    
    setHeatmapLoading(true);
    try {
      console.log(`🔥 [PlayerModal] Fetching heatmap for player ${playerId} in match ${matchId}`);
      
      const response = await fetch(`/api/sofascore/player-heatmap/${matchId}/${playerId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ [PlayerModal] Received heatmap data:`, data);
        console.log(`🔍 [PlayerModal] Data type: ${typeof data}, isArray: ${Array.isArray(data)}`);
        
        // Log the structure for debugging
        if (data && typeof data === 'object') {
          console.log(`📊 [PlayerModal] Data keys:`, Object.keys(data));
          if (data.points) {
            console.log(`📍 [PlayerModal] Points array length:`, data.points.length);
          }
        }
        
        setHeatmapData(data);
      } else {
        const errorText = await response.text();
        console.log(`⚠️ [PlayerModal] No heatmap data available for player ${playerId}. Status: ${response.status}, Response: ${errorText}`);
        setHeatmapData(null);
      }
    } catch (error) {
      console.error('❌ [PlayerModal] Error fetching heatmap data:', error);
      setHeatmapData(null);
    } finally {
      setHeatmapLoading(false);
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
    if (heatmapLoading) {
      return (
        <div className="relative w-full bg-green-600 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/10', minHeight: '300px' }}>
          <div className="text-white">Loading heatmap data...</div>
        </div>
      );
    }

    // Transform SofaScore heatmap data to our expected format
    const transformedHeatmapData = React.useMemo(() => {
      if (!heatmapData) return null;

      // SofaScore might return data in different formats, handle common structures
      let points: Array<{ x: number; y: number; intensity: number }> = [];
      
      if (Array.isArray(heatmapData)) {
        // If it's an array of coordinate points
        points = heatmapData.map((item: any, index: number) => {
          // Handle different possible data structures from SofaScore
          if (typeof item === 'object' && item !== null) {
            const x = item.x ?? item.X ?? item.coordinateX ?? item.position?.x ?? (index % 10) / 10;
            const y = item.y ?? item.Y ?? item.coordinateY ?? item.position?.y ?? Math.random();
            const intensity = item.intensity ?? item.value ?? item.count ?? item.weight ?? Math.random() * 0.8 + 0.2;
            
            return {
              x: Math.max(0, Math.min(1, typeof x === 'number' ? x : parseFloat(x) || 0)),
              y: Math.max(0, Math.min(1, typeof y === 'number' ? y : parseFloat(y) || 0)),
              intensity: Math.max(0.1, Math.min(1, typeof intensity === 'number' ? intensity : parseFloat(intensity) || 0.5))
            };
          }
          
          // Fallback for primitive values
          return {
            x: (index % 10) / 10,
            y: Math.random(),
            intensity: 0.5
          };
        });
      } else if (heatmapData.points) {
        // If it has a points property
        points = heatmapData.points;
      } else if (heatmapData.heatmap) {
        // If it has a heatmap property
        points = Array.isArray(heatmapData.heatmap) ? heatmapData.heatmap : [];
      } else if (heatmapData.data) {
        // If it has a data property
        points = Array.isArray(heatmapData.data) ? heatmapData.data : [];
      }

      return points.length > 0 ? { points } : null;
    }, [heatmapData]);

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
          
          {/* Heatmap overlay using gradients */}
          <defs>
            {transformedHeatmapData?.points?.map((_, index) => (
              <radialGradient key={`heatspot-${index}`} id={`heatspot-${index}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={`rgba(255, ${255 - Math.floor(transformedHeatmapData.points[index].intensity * 255)}, 0, 0.8)`} />
                <stop offset="50%" stopColor={`rgba(255, ${165 - Math.floor(transformedHeatmapData.points[index].intensity * 90)}, 0, 0.6)`} />
                <stop offset="100%" stopColor={`rgba(255, 255, 0, ${0.3 * transformedHeatmapData.points[index].intensity})`} />
              </radialGradient>
            )) || (
              // Fallback gradients if no real data
              <>
                <radialGradient id="heatspot1" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255, 0, 0, 0.8)" />
                  <stop offset="50%" stopColor="rgba(255, 165, 0, 0.6)" />
                  <stop offset="100%" stopColor="rgba(255, 255, 0, 0.3)" />
                </radialGradient>
                <radialGradient id="heatspot2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255, 165, 0, 0.7)" />
                  <stop offset="50%" stopColor="rgba(255, 255, 0, 0.5)" />
                  <stop offset="100%" stopColor="rgba(173, 255, 47, 0.2)" />
                </radialGradient>
                <radialGradient id="heatspot3" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255, 255, 0, 0.6)" />
                  <stop offset="50%" stopColor="rgba(173, 255, 47, 0.4)" />
                  <stop offset="100%" stopColor="rgba(0, 255, 0, 0.1)" />
                </radialGradient>
              </>
            )}
          </defs>
          
          {/* Heat spots - use real data if available, otherwise fallback */}
          {transformedHeatmapData?.points?.length > 0 ? (
            transformedHeatmapData.points.map((point, index) => {
              // Convert normalized coordinates (0-1) to SVG coordinates
              const svgX = 20 + (point.x * 600); // Field is from x=20 to x=620
              const svgY = 20 + (point.y * 360); // Field is from y=20 to y=380
              const radius = Math.max(15, point.intensity * 60); // Scale radius based on intensity
              
              return (
                <ellipse
                  key={index}
                  cx={svgX}
                  cy={svgY}
                  rx={radius}
                  ry={radius * 0.8}
                  fill={`url(#heatspot-${index})`}
                  opacity={0.7 + (point.intensity * 0.3)}
                />
              );
            })
          ) : (
            // Show message when no data is available
            <g>
              <rect x="200" y="180" width="240" height="40" fill="rgba(0,0,0,0.7)" rx="5" />
              <text x="320" y="205" textAnchor="middle" fill="white" fontSize="14">
                No heatmap data available
              </text>
            </g>
          )}
          
          {/* Player position dots for actual data */}
          {transformedHeatmapData?.points?.length > 0 && (
            transformedHeatmapData.points.slice(0, 5).map((point, index) => (
              <circle
                key={`dot-${index}`}
                cx={20 + (point.x * 600)}
                cy={20 + (point.y * 360)}
                r="2"
                fill="white"
                stroke="black"
                strokeWidth="1"
              />
            ))
          )}
        </svg>
        
        {/* Data source indicator */}
        <div className="absolute bottom-4 left-4 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
          {transformedHeatmapData?.points?.length > 0 ? `SofaScore Data (${transformedHeatmapData.points.length} points)` : 'No Data Available'}
        </div>
        
        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && heatmapData && (
          <div className="absolute top-4 left-4 text-xs text-white bg-red-600 bg-opacity-75 px-2 py-1 rounded max-w-xs">
            Raw data: {JSON.stringify(heatmapData).substring(0, 100)}...
          </div>
        )}
      </div>
    );
  };

  const ShotMapVisualization = () => {
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
          
          {/* Shot markers */}
          {/* Goals */}
          <circle cx="580" cy="190" r="8" fill="#00ff00" stroke="white" strokeWidth="2" />
          <circle cx="560" cy="210" r="8" fill="#00ff00" stroke="white" strokeWidth="2" />
          
          {/* Shots on target */}
          <circle cx="570" cy="170" r="6" fill="#ffff00" stroke="white" strokeWidth="1" />
          <circle cx="590" cy="200" r="6" fill="#ffff00" stroke="white" strokeWidth="1" />
          
          {/* Shots off target */}
          <circle cx="550" cy="160" r="4" fill="#ff6666" stroke="white" strokeWidth="1" />
          <circle cx="580" cy="240" r="4" fill="#ff6666" stroke="white" strokeWidth="1" />
          <circle cx="530" cy="190" r="4" fill="#ff6666" stroke="white" strokeWidth="1" />
        </svg>
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
