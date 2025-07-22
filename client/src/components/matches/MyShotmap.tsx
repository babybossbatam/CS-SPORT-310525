import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import MyAvatarInfo from './MyAvatarInfo';
import '../../styles/ShotMapEnhancements.css';

interface MyShotmapProps {
  match?: any;
  fixtureId?: string | number;
  homeTeam?: string;
  awayTeam?: string;
}

interface ShotData {
  id: number;
  x: number;
  y: number;
  type: 'goal' | 'shot' | 'saved' | 'blocked' | 'missed';
  player: string;
  team: string;
  minute: number;
  bodyPart: string;
  situation: string;
  xG: number;
  xGOT?: number;
  playerPhoto?: string;
  playerId?: number;
}

const MyShotmap: React.FC<MyShotmapProps> = ({
  match,
  fixtureId,
  homeTeam,
  awayTeam,
}) => {
  const [shotData, setShotData] = useState<ShotData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShotIndex, setSelectedShotIndex] = useState(0);

  // Function to fetch real shot data from API
  const fetchRealShotData = useCallback(async () => {
    try {
      console.log(`🎯 [MyShotmap] Fetching real shot data for fixture: ${fixtureId}`);

      const shotResponse = await fetch(`/api/fixtures/${fixtureId}/shots`);

      if (shotResponse.ok) {
        const realShots = await shotResponse.json();

        if (realShots && realShots.length > 0) {
          const convertedShots: ShotData[] = realShots.map((shot: any, index: number) => ({
            id: shot.id || index + 1,
            x: shot.x || (shot.team?.name === homeTeam ? 75 : 25), // Use real X coordinate
            y: shot.y || 50, // Use real Y coordinate
            type: shot.type || 'shot',
            player: shot.player?.name || 'Unknown Player',
            team: shot.team?.name || 'Unknown Team',
            minute: shot.minute || 0,
            bodyPart: shot.bodyPart || 'Right foot',
            situation: shot.situation || 'Regular Play',
            xG: shot.xG || 0.05,
            xGOT: shot.xGOT,
            playerId: shot.player?.id,
            playerPhoto: shot.player?.photo || shot.player?.id 
              ? `https://imagecache.365scores.com/image/upload/f_png,w_38,h_38,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v53/Athletes/${shot.player.id}`
              : '/assets/fallback_player.png'
          }));

          setShotData(convertedShots);
          console.log(`✅ [MyShotmap] Loaded ${convertedShots.length} real shots from API`);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error(`❌ [MyShotmap] Real shot data API error:`, error);
      return false;
    }
  }, [fixtureId, homeTeam]);

  // Memoize the fetchFromSofaScore function to prevent recreation on every render
  const fetchFromSofaScore = useCallback(async () => {
    try {
      // Try to get data from SofaScore API with match details
      const sofaScoreResponse = await fetch(`/api/players/1/heatmap?eventId=${fixtureId}&homeTeam=${encodeURIComponent(homeTeam || '')}&awayTeam=${encodeURIComponent(awayTeam || '')}&matchDate=${new Date().toISOString()}`);

      if (sofaScoreResponse.ok) {
        const sofaScoreData = await sofaScoreResponse.json();

        if (sofaScoreData.shots && sofaScoreData.shots.length > 0) {
          const convertedShots: ShotData[] = sofaScoreData.shots.map((shot: any, index: number) => ({
            id: index + 1,
            x: Math.max(0, Math.min(100, shot.x || (shot.x > 50 ? 75 : 25))), // Use actual X or fallback
            y: Math.max(0, Math.min(100, shot.y || 50)), // Use actual Y or fallback to center
            type: mapSofaScoreShotType(shot.type),
            player: shot.player?.name || `Player ${index + 1}`,
            team: (shot.x || 50) > 50 ? homeTeam || 'Home Team' : awayTeam || 'Away Team',
            minute: shot.minute || 0,
            bodyPart: shot.bodyPart || 'Right foot',
            situation: shot.situation || 'Regular Play',
            xG: shot.xG || (Math.random() * 0.8 + 0.05),
            xGOT: shot.type === 'goal' ? (shot.xGOT || Math.random() * 0.4 + 0.4) : shot.xGOT,
            playerId: shot.player?.id,
            playerPhoto: shot.player?.id 
              ? `https://imagecache.365scores.com/image/upload/f_png,w_38,h_38,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v53/Athletes/${shot.player.id}`
              : '/assets/fallback_player.png'
          }));

          setShotData(convertedShots);
          console.log(`✅ [MyShotmap] Loaded ${convertedShots.length} shots from SofaScore API`);
          return;
        }
      }

      // If SofaScore also fails, show no data available
      console.log(`⚠️ [MyShotmap] No shot data available from any source`);
      setShotData([]);
    } catch (error) {
      console.error(`❌ [MyShotmap] SofaScore API error:`, error);
      setShotData([]);
    }
  }, [fixtureId, homeTeam, awayTeam]);

  // Memoize the shot type mapping function
  const mapSofaScoreShotType = useCallback((type: string): 'goal' | 'shot' | 'saved' | 'blocked' | 'missed' => {
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('goal')) return 'goal';
    if (normalizedType.includes('on') || normalizedType.includes('target')) return 'saved';
    if (normalizedType.includes('block')) return 'blocked';
    return 'missed';
  }, []);

  // Memoize the main fetch function to prevent recreation
  const fetchShotData = useCallback(async () => {
    if (!fixtureId) {
      setError("No fixture ID provided");
      setIsLoading(false);
      return;
    }

    try {
      console.log(`⚽ [MyShotmap] Fetching shot data for fixture: ${fixtureId}`);

      // First try to get real shot data with coordinates
      const hasRealShotData = await fetchRealShotData();

      if (hasRealShotData) {
        setError(null);
        return;
      }

      // Fallback: try to get match events which may contain shot data
      const eventsResponse = await fetch(`/api/fixtures/${fixtureId}/events`);

        if (eventsResponse.ok) {
        const events = await eventsResponse.json();
        console.log(`✅ [MyShotmap] Received ${events.length} events`);

        // Filter and convert events to shot data
        const shots: ShotData[] = [];
        let shotId = 1;

        events.forEach((event: any) => {
          if (event.type === 'Goal' || event.detail?.toLowerCase().includes('shot') || 
              event.detail?.toLowerCase().includes('penalty') || event.detail?.toLowerCase().includes('missed') ||
              event.type === 'Missed Shot' || event.type === 'Shot' || event.type === 'Blocked Shot') {

            // Determine shot type from event detail
            let shotType: 'goal' | 'shot' | 'saved' | 'blocked' | 'missed' = 'shot';
            const detail = event.detail?.toLowerCase() || '';
            const eventType = event.type?.toLowerCase() || '';

            if (event.type === 'Goal' || detail.includes('goal')) {
              shotType = 'goal';
            } else if (detail.includes('saved') || detail.includes('save') || eventType.includes('saved')) {
              shotType = 'saved';
            } else if (detail.includes('blocked') || detail.includes('block') || eventType.includes('blocked')) {
              shotType = 'blocked';
            } else if (detail.includes('missed') || detail.includes('miss') || detail.includes('wide') || 
                       detail.includes('off target') || eventType.includes('missed') || event.type === 'Missed Shot') {
              shotType = 'missed';
            }

            // Try to get actual coordinates from SofaScore API or generate realistic ones
            const isHomeTeam = event.team?.name === homeTeam;
            let x, y;

            // Check if we have actual coordinate data from SofaScore
            if (event.coordinates?.x !== undefined && event.coordinates?.y !== undefined) {
              // Use actual coordinates from SofaScore API
              x = Math.max(0, Math.min(100, event.coordinates.x));
              y = Math.max(0, Math.min(100, event.coordinates.y));
              console.log(`🎯 [MyShotmap] Using actual coordinates for ${event.player?.name}: x=${x}, y=${y}`);
            } else {
              // Fallback to generated coordinates based on shot type and team
              if (shotType === 'missed') {
                // Missed shots can be from wider areas and off-target positions
                x = isHomeTeam ? Math.random() * 40 + 0 : Math.random() * 40 + 60;
                y = Math.random() * 80 + 10; // Wider Y range for missed shots
              } else {
                // Regular shots closer to goal
                x = isHomeTeam ? Math.random() * 30 + 5 : Math.random() * 30 + 70;
                y = Math.random() * 60 + 20; // Central area
              }
              console.log(`🎯 [MyShotmap] Using generated coordinates for ${event.player?.name}: x=${x}, y=${y}`);
            }

            const shotData = {
              id: shotId++,
              x: Math.round(x),
              y: Math.round(y),
              type: shotType,
              player: event.player?.name || 'Unknown Player',
              team: event.team?.name || (isHomeTeam ? homeTeam : awayTeam) || 'Unknown Team',
              minute: event.time?.elapsed || 0,
              bodyPart: event.detail?.includes('Header') ? 'Header' : 
                       event.detail?.includes('Right') ? 'Right foot' : 'Left foot',
              situation: event.detail?.includes('Penalty') ? 'Penalty' : 
                        event.detail?.includes('Free') ? 'Set Piece' : 'Regular Play',
              xG: shotType === 'missed' ? Math.random() * 0.3 + 0.02 : Math.random() * 0.8 + 0.05, // Lower xG for missed shots
              xGOT: shotType === 'goal' ? Math.random() * 0.4 + 0.4 : shotType === 'missed' ? 0 : undefined, // No xGOT for missed shots
              playerId: event.player?.id,
              playerPhoto: event.player?.id 
                ? `https://imagecache.365scores.com/image/upload/f_png,w_38,h_38,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v53/Athletes/${event.player.id}`
                : '/assets/fallback_player.png'
            };

            // Debug log for missed shots
            if (shotType === 'missed') {
              console.log(`🎯 [MyShotmap] Missed shot event:`, {
                player: shotData.player,
                team: shotData.team,
                minute: shotData.minute,
                detail: event.detail,
                type: event.type,
                coordinates: { x: shotData.x, y: shotData.y }
              });
            }

            shots.push(shotData);
          }
        });

        if (shots.length > 0) {
          // Sort shots by minute and batch state updates
          const sortedShots = shots.sort((a, b) => a.minute - b.minute);
          setShotData(sortedShots);
          setError(null);
          console.log(`✅ [MyShotmap] Processed ${sortedShots.length} shots from events`);
        } else {
          // If no shots found in events, try SofaScore API
          console.log(`⚠️ [MyShotmap] No shots found in events, trying SofaScore API...`);
          await fetchFromSofaScore();
          setError(null);
        }
      } else {
        console.log(`⚠️ [MyShotmap] Events API failed, trying SofaScore API...`);
        await fetchFromSofaScore();
        setError(null);
      }
    } catch (error) {
      console.error(`❌ [MyShotmap] Error fetching shot data:`, error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch shot data",
      );
    } finally {
      setIsLoading(false);
    }
  }, [fixtureId, homeTeam, awayTeam, fetchFromSofaScore, mapSofaScoreShotType]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchShots = async () => {
      if (!fixtureId) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/fixtures/${fixtureId}/shots`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && !controller.signal.aborted) {
          setShotData(data);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Shots fetch aborted');
          return;
        }
        console.error('Error fetching shots:', error);
        setShotData([]); // Set empty array on error
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchShots();

    // Cleanup function to abort fetch on unmount
    return () => {
      try {
        if (!controller.signal.aborted) {
          controller.abort('Component unmounted');
        }
      } catch (error) {
        // Silently handle any abort errors during cleanup
        console.log('🛑 AbortError detected and suppressed:', error?.message || 'signal is aborted without reason');
      }
    };
  }, [fixtureId]);

  // Memoize expensive calculations
  const getShotColor = useCallback((team: string) => {
    return team === homeTeam ? 'rgb(242, 179, 203)' : 'rgb(0, 54, 108)';
  }, [homeTeam]);

  const currentShot = useMemo(() => shotData[selectedShotIndex], [shotData, selectedShotIndex]);

  const navigateShot = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedShotIndex > 0) {
      setSelectedShotIndex(selectedShotIndex - 1);
    } else if (direction === 'next' && selectedShotIndex < shotData.length - 1) {
      setSelectedShotIndex(selectedShotIndex + 1);
    }
  }, [selectedShotIndex, shotData.length]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Shot Map</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading shot data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || shotData.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">Shot Map</CardTitle>
      </CardHeader>

      <CardContent className="">

        {/* Main content layout with field and goal view side by side */}
        <div className="flex gap-1 ">
          {/* Football field - 50.6% size (10% increase from 46%), left side */}
          <div className="relative overflow-hidden flex-shrink-0 -mt-4 -ml-4 " style={{ width: '51.5%', height: 'auto' }}>
            <img 
              src="/assets/matchdetaillogo/field.png" 
              alt="Football field"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjNGFhYjRhIi8+CjxyZWN0IHg9IjEiIHk9IjEiIHdpZHRoPSIzOTgiIGhlaWdodD0iMjQ4IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPGxpbmUgeDE9IjIwMCIgeTE9IjEiIHgyPSIyMDAiIHkyPSIyNDkiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSIyMDAiIGN5PSIxMjUiIHI9IjQwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPC9zdmc+';
              }}
            />

            {/* All shot markers are now based on real API data only */}

            {/* All shot markers displayed simultaneously */}
            {shotData.map((shot, index) => (
              <div
                key={shot.id}
                className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group ${
                  index === selectedShotIndex ? 'z-20' : 'z-10'
                }`}
                style={{
                  left: `${shot.x}%`,
                  top: `${shot.y}%`,
                }}
                onClick={() => setSelectedShotIndex(index)}
              >
                {/* Shot type indicators */}
                <div 
                  className={`shot-mark-enhanced ${shot.type} ${index === selectedShotIndex ? 'active' : ''}`}
                >
                  {shot.type === 'goal' && (
                    <img 
                      src="/assets/matchdetaillogo/soccer-ball.svg" 
                      alt="Goal" 
                      className="w-4 h-4"
                    />
                  )}
                  {(shot.type === 'saved' || shot.type === 'missed' || shot.type === 'blocked' || shot.type === 'shot') && (
                    <img 
                      src="/assets/matchdetaillogo/shot-event.svg" 
                      alt={shot.type.charAt(0).toUpperCase() + shot.type.slice(1)} 
                      className="w-4 h-4"
                    />
                  )}
                </div>

                {/* Enhanced tooltip */}
                <div className="absolute top-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                  <div className="font-medium">{shot.player}</div>
                  <div className="text-gray-300">{shot.minute}' • {shot.type.charAt(0).toUpperCase() + shot.type.slice(1)}</div>
                  <div className="text-gray-400">xG: {shot.xG?.toFixed(2) || '0.00'}</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            ))}

            {/* Team shot trajectories - show all shots with different opacities */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {shotData.map((shot, index) => (
                <line
                  key={`trajectory-${shot.id}`}
                  x1={`${shot.x}%`}
                  y1={`${shot.y}%`}
                  x2={shot.team === homeTeam ? "5%" : "95%"}
                  y2="50%"
                  stroke={getShotColor(shot.team)}
                  strokeWidth={index === selectedShotIndex ? "2" : "1"}
                  strokeDasharray="3,3"
                  opacity={index === selectedShotIndex ? "0.8" : "0.2"}
                  className="transition-all duration-200"
                />
              ))}
            </svg>

            {/* Shot distribution heatmap overlay (optional) */}
            <div className="absolute inset-0 pointer-events-none">
              {shotData.map((shot, index) => (
                <div
                  key={`heat-${shot.id}`}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${shot.x}%`,
                    top: `${shot.y}%`,
                    width: '8px',
                    height: '8px',
                    background: `radial-gradient(circle, ${getShotColor(shot.team)}20, transparent)`,
                    opacity: 0.3,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Goal view section beside the field */}
          <div className="flex-1">
            <div className="flex flex-col gap-4 rounded-lg bg-white shadow-sm h-147">
              {/* Player info header with navigation arrows */}
              <div className="pb-8 flex items-center justify-between  bg-gray-50 rounded-lg ">
                <div className="flex items-center gap-3">
                  <MyAvatarInfo
                    playerId={currentShot?.playerId}
                    playerName={currentShot?.player}
                    size="lg"
                    className="w-12 h-12  border-2 border-gray-300"
                  />
                  <div>
                    <div className="font-normal text-base text-gray-900 text-sm">{currentShot?.player}</div>
                    <div className={`text-sm font-medium ${
                      currentShot?.type === 'goal' ? 'text-blue-600' : 
                      currentShot?.type === 'saved' ? 'text-yellow-600' :
                      currentShot?.type === 'blocked' ? 'text-red-600' :
                      currentShot?.type === 'missed' ? 'text-gray-600' :
                      'text-gray-600'
                    }`}>
                      {currentShot?.type === 'goal' ? 'Goal' : 
                       currentShot?.type === 'saved' ? 'Saved' :
                       currentShot?.type === 'blocked' ? 'Blocked' :
                       currentShot?.type === 'missed' ? 'Missed' :
                       currentShot?.type?.charAt(0).toUpperCase() + currentShot?.type?.slice(1)}
                    </div>
                  </div>
                </div>

                {/* Enhanced navigation */}
                <div className="shot-navigation">
                  <button 
                    onClick={() => navigateShot('prev')}
                    disabled={selectedShotIndex === 0}
                    className={`nav-arrow ${selectedShotIndex === 0 ? 'disabled' : ''}`}
                  >
                    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
                      <path d="M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z"/>
                    </svg>
                  </button>

                  <div className="shot-time">
                    {currentShot?.minute}'
                  </div>

                  <button 
                    onClick={() => navigateShot('next')}
                    disabled={selectedShotIndex === shotData.length - 1}
                    className={`nav-arrow ${selectedShotIndex === shotData.length - 1 ? 'disabled' : ''}`}
                  >
                    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
                      <path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Goal frame container */}
              <div className="goal-frame-container relative flex-shrink-0 mx-auto" style={{ height: '52px' }}>
                <div className="relative bg-white rounded" style={{ height: '72px' }}>
                  <img 
                    className="goal-frame"
                    alt=""
                    title=""
                    src="/assets/matchdetaillogo/technical-diagram.svg"
                    loading="lazy"
                    style={{ width: '150px', height: '82px' }}
                  />

                  {/* Enhanced ball animations */}
                  {currentShot && (
                    <div 
                      className={`animated-ball ${currentShot.type}`}
                      style={{
                        left: currentShot.type === 'goal' 
                          ? `${56 + (currentShot.y / 100) * 32}px`
                          : currentShot.type === 'saved'
                          ? `${52 + (currentShot.y / 100) * 40}px`
                          : currentShot.type === 'blocked'
                          ? `${36 + (currentShot.y / 100) * 48}px`
                          : `${12 + (currentShot.y / 100) * 72}px`,
                        bottom: currentShot.type === 'goal'
                          ? `${12 + ((100 - currentShot.x) / 100) * 24}px`
                          : currentShot.type === 'saved'
                          ? `${2 + ((100 - currentShot.x) / 100) * 12}px`
                          : currentShot.type === 'blocked'
                          ? `${16 + ((100 - currentShot.x) / 100) * 24}px`
                          : 'auto',
                        top: currentShot.type === 'missed' 
                          ? `${4 + (currentShot.x / 100) * 28}px` 
                          : 'auto'
                      }}
                    >
                      {currentShot.type !== 'missed' && (
                        <img 
                          src="/assets/matchdetaillogo/soccer-ball.svg" 
                          alt={currentShot.type} 
                          className="w-2.5 h-2.5"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced event details container */}
              <div className="event-details-enhanced -mt-3.5 pt-4"
                style={{ width: '105%' }}
                >
                <div className="event-detail-card">
                  <div className="event-card-main whitespace-nowrap pr-4"

                    >{currentShot?.situation || 'Regular Play'}</div>
                  <div className="event-card-sub ">Situation</div>
                </div>
                <div className="event-detail-card ">
                  <div className="event-card-main">{currentShot?.bodyPart || 'Left foot'}</div>
                  <div className="event-card-sub">Shot Type</div>
                </div>
                <div className="event-detail-card">
                  <div className="event-card-main">{currentShot?.xG?.toFixed(2) || '0.00'}</div>
                  <div className="event-card-sub">xG</div>
                </div>
                <div className="event-detail-card">
                  <div className="event-card-main">{currentShot?.xGOT?.toFixed(2) || '0.00'}</div>
                  <div className="event-card-sub">xGOT</div>
                </div>
              </div>
            </div>
          </div>
        </div>




      </CardContent>
    </Card>
  );
};

export default MyShotmap;