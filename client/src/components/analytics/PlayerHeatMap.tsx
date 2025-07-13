
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Activity, TrendingUp } from 'lucide-react';
import { analyticsCache, getCacheKey } from '@/lib/analyticsCache';

interface HeatMapPoint {
  x: number;
  y: number;
  intensity: number;
}

interface PlayerHeatMapProps {
  playerId: number;
  matchId: number;
  playerName?: string;
  teamName?: string;
}

const PlayerHeatMap: React.FC<PlayerHeatMapProps> = ({
  playerId,
  matchId,
  playerName,
  teamName
}) => {
  const [heatmapData, setHeatmapData] = useState<HeatMapPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);

  const fetchHeatmapData = useCallback(async (useCache: boolean = true) => {
    const cacheKey = getCacheKey.heatmap(playerId, matchId);
    
    // Try cache first
    if (useCache) {
      const cachedData = analyticsCache.get(cacheKey);
      if (cachedData) {
        setHeatmapData(cachedData.heatmap || []);
        setLastUpdate(new Date(cachedData.timestamp));
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/players/${playerId}/heatmap?eventId=${matchId}&playerName=${playerName}&teamName=${teamName}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch heatmap data');
      }

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }

      const heatmapPoints = data.heatmap || [];
      setHeatmapData(heatmapPoints);
      setLastUpdate(new Date());

      // Cache the data with compression for large datasets
      const shouldCompress = heatmapPoints.length > 100;
      analyticsCache.set(cacheKey, { heatmap: heatmapPoints, timestamp: Date.now() }, shouldCompress);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [playerId, matchId, playerName, teamName]);

  // WebSocket connection for live updates
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    const wsUrl = `ws://${window.location.host}/ws/player-heatmap/${playerId}/${matchId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ [PlayerHeatMap] WebSocket connected');
      setConnectionStatus('connected');
      setIsLive(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'heatmap_update') {
          setHeatmapData(data.heatmap);
          setLastUpdate(new Date());
          
          // Update cache with real-time data
          const cacheKey = getCacheKey.heatmap(playerId, matchId);
          analyticsCache.set(cacheKey, { heatmap: data.heatmap, timestamp: Date.now() });
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ [PlayerHeatMap] WebSocket error:', error);
      setConnectionStatus('disconnected');
      setIsLive(false);
    };

    ws.onclose = () => {
      console.log('🔌 [PlayerHeatMap] WebSocket disconnected');
      setConnectionStatus('disconnected');
      setIsLive(false);
    };

    wsRef.current = ws;
  }, [playerId, matchId]);

  useEffect(() => {
    if (playerId && matchId) {
      fetchHeatmapData();
      
      // Try to connect WebSocket for live updates
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [playerId, matchId, fetchHeatmapData, connectWebSocket]);

  const renderHeatMap = () => {
    if (!heatmapData.length) return null;

    const maxIntensity = Math.max(...heatmapData.map(point => point.intensity));
    const totalTouches = heatmapData.reduce((sum, point) => sum + point.intensity, 0);
    const avgIntensity = totalTouches / heatmapData.length;
    
    // Calculate zone statistics
    const attackingThird = heatmapData.filter(point => point.x > 66).length;
    const middleThird = heatmapData.filter(point => point.x >= 33 && point.x <= 66).length;
    const defensiveThird = heatmapData.filter(point => point.x < 33).length;
    
    return (
      <div className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="text-center">
            <div className="font-semibold text-blue-600">{heatmapData.length}</div>
            <div className="text-gray-500">Positions</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">{totalTouches}</div>
            <div className="text-gray-500">Total Touches</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-purple-600">{avgIntensity.toFixed(1)}</div>
            <div className="text-gray-500">Avg Intensity</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-red-600">{attackingThird}</div>
            <div className="text-gray-500">Attack Zone</div>
          </div>
        </div>

        {/* Heatmap visualization */}
        <div className="relative w-full h-64 bg-gradient-to-r from-green-600 via-green-500 to-green-600 border-2 border-white overflow-hidden rounded-lg">
          {/* Football pitch background */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 64">
            {/* Pitch outline */}
            <rect x="2" y="2" width="96" height="60" fill="none" stroke="white" strokeWidth="0.8"/>
            {/* Center circle */}
            <circle cx="50" cy="32" r="8" fill="none" stroke="white" strokeWidth="0.8"/>
            <circle cx="50" cy="32" r="1" fill="white"/>
            {/* Center line */}
            <line x1="50" y1="2" x2="50" y2="62" stroke="white" strokeWidth="0.8"/>
            {/* Goal areas */}
            <rect x="2" y="20" width="12" height="24" fill="none" stroke="white" strokeWidth="0.8"/>
            <rect x="86" y="20" width="12" height="24" fill="none" stroke="white" strokeWidth="0.8"/>
            {/* Six-yard boxes */}
            <rect x="2" y="26" width="6" height="12" fill="none" stroke="white" strokeWidth="0.8"/>
            <rect x="92" y="26" width="6" height="12" fill="none" stroke="white" strokeWidth="0.8"/>
            {/* Penalty areas */}
            <rect x="2" y="14" width="20" height="36" fill="none" stroke="white" strokeWidth="0.8"/>
            <rect x="78" y="14" width="20" height="36" fill="none" stroke="white" strokeWidth="0.8"/>
            {/* Penalty spots */}
            <circle cx="12" cy="32" r="0.8" fill="white"/>
            <circle cx="88" cy="32" r="0.8" fill="white"/>
            {/* Goals */}
            <rect x="1" y="28" width="1" height="8" fill="white"/>
            <rect x="98" y="28" width="1" height="8" fill="white"/>
          </svg>

          {/* Zone indicators */}
          <div className="absolute inset-0">
            <div className="absolute left-0 top-0 w-1/3 h-full bg-red-500 opacity-10"></div>
            <div className="absolute left-1/3 top-0 w-1/3 h-full bg-yellow-500 opacity-10"></div>
            <div className="absolute left-2/3 top-0 w-1/3 h-full bg-green-500 opacity-10"></div>
          </div>

          {/* Heatmap points with enhanced visualization */}
          {heatmapData.map((point, index) => {
            const intensity = point.intensity / maxIntensity;
            const size = Math.max(6, intensity * 16);
            const opacity = Math.max(0.3, intensity);
            
            return (
              <div
                key={index}
                className="absolute rounded-full pointer-events-none animate-pulse"
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: `rgba(255, ${255 - (intensity * 200)}, 0, ${opacity})`,
                  transform: 'translate(-50%, -50%)',
                  filter: 'blur(3px)',
                  boxShadow: `0 0 ${size/2}px rgba(255, ${255 - (intensity * 200)}, 0, ${opacity/2})`
                }}
                title={`Position: (${point.x.toFixed(1)}, ${point.y.toFixed(1)}) - Intensity: ${point.intensity}`}
              />
            );
          })}
        </div>

        {/* Zone breakdown */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="font-semibold text-red-600">{defensiveThird}</div>
            <div className="text-red-500">Defensive Third</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <div className="font-semibold text-yellow-600">{middleThird}</div>
            <div className="text-yellow-500">Middle Third</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="font-semibold text-green-600">{attackingThird}</div>
            <div className="text-green-500">Attacking Third</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            Player Heat Map
            {isLive && (
              <Badge variant="destructive" className="animate-pulse">
                <Activity className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
            )}
            {connectionStatus === 'connecting' && (
              <Badge variant="secondary">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Connecting
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {playerName && <span className="text-sm font-normal text-gray-600">{playerName}</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchHeatmapData(false)}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        {lastUpdate && (
          <p className="text-xs text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading heatmap data...</span>
          </div>
        )}

        {error && (
          <div className="text-center p-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchHeatmapData} variant="outline">
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && heatmapData.length > 0 && renderHeatMap()}

        {!isLoading && !error && heatmapData.length === 0 && (
          <div className="text-center p-8 text-gray-500">
            No heatmap data available for this player in this match.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerHeatMap;
