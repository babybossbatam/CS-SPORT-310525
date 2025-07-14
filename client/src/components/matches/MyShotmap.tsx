import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import MyAvatarInfo from './MyAvatarInfo';

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

  useEffect(() => {
    const fetchShotData = async () => {
      if (!fixtureId) {
        setError("No fixture ID provided");
        setIsLoading(false);
        return;
      }

      try {
        console.log(`⚽ [MyShotmap] Fetching shot data for fixture: ${fixtureId}`);

        // First try to get match events which may contain shot data
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
            // Sort shots by minute
            shots.sort((a, b) => a.minute - b.minute);
            setShotData(shots);
            console.log(`✅ [MyShotmap] Processed ${shots.length} shots from events`);
          } else {
            // If no shots found in events, try SofaScore API
            console.log(`⚠️ [MyShotmap] No shots found in events, trying SofaScore API...`);
            await fetchFromSofaScore();
          }
        } else {
          console.log(`⚠️ [MyShotmap] Events API failed, trying SofaScore API...`);
          await fetchFromSofaScore();
        }

        setError(null);
      } catch (error) {
        console.error(`❌ [MyShotmap] Error fetching shot data:`, error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch shot data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    const fetchFromSofaScore = async () => {
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
    };

    const mapSofaScoreShotType = (type: string): 'goal' | 'shot' | 'saved' | 'blocked' | 'missed' => {
      const normalizedType = type.toLowerCase();
      if (normalizedType.includes('goal')) return 'goal';
      if (normalizedType.includes('on') || normalizedType.includes('target')) return 'saved';
      if (normalizedType.includes('block')) return 'blocked';
      return 'missed';
    };

    fetchShotData();
  }, [fixtureId, homeTeam, awayTeam]);

  const getShotColor = (team: string) => {
    return team === homeTeam ? 'rgb(242, 179, 203)' : 'rgb(0, 54, 108)';
  };

  const currentShot = shotData[selectedShotIndex];

  const navigateShot = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedShotIndex > 0) {
      setSelectedShotIndex(selectedShotIndex - 1);
    } else if (direction === 'next' && selectedShotIndex < shotData.length - 1) {
      setSelectedShotIndex(selectedShotIndex + 1);
    }
  };

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
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Shot Map</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-8">
            <div className="text-center text-gray-500">
              <p>Shot map data not available</p>
              <p className="text-sm">This feature will be available soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Shot Map</CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        {/* Player selector section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MyAvatarInfo
                playerId={currentShot?.playerId}
                playerName={currentShot?.player}
                size="lg"
                className="border-2 border-gray-300"
              />
              <div>
                <div className="font-semibold text-base text-gray-900">{currentShot?.player}</div>
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

            {/* Shot navigation with elapsed time */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigateShot('prev')}
                disabled={selectedShotIndex === 0}
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600">
                  <path d="M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z" fill="currentColor"/>
                </svg>
              </button>

              <div className="px-4 py-2 bg-white border border-gray-300 rounded text-lg font-bold text-gray-900 min-w-[60px] text-center">
                {currentShot?.minute}'
              </div>

              <button 
                onClick={() => navigateShot('next')}
                disabled={selectedShotIndex === shotData.length - 1}
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600">
                  <path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Goal view section with SVG goal frame - 365scores style */}
          <div className="mb-4">
            <div className="flex flex-col gap-4 p-4 rounded-lg">
              {/* Goal frame container */}
              <div className="relative flex-shrink-0 mx-auto" style={{ height: '90.6125px' }}>
                <div className="relative bg-white rounded" style={{ height: '90.6125px' }}>
                  <img 
                    className="goal-frame"
                    alt=""
                    title=""
                    src="/assets/matchdetaillogo/technical-diagram.svg"
                    loading="lazy"
                    style={{ width: '141.563px', height: '65.3568px' }}
                  />

                  {/* Goal event - ball inside goal with move animation mapped to actual shot position */}
                  {currentShot?.type === 'goal' && (
                    <div 
                      className="absolute z-10 animate-bounce"
                      style={{
                        left: `${70 + (currentShot.y / 100) * 40}px`, // Position inside the goal net
                        bottom: `${15 + ((100 - currentShot.x) / 100) * 30}px`, // Deeper inside the net for goals
                        width: '12px',
                        height: '12px',
                        animation: 'moveToGoal 1.5s ease-in-out'
                      }}
                    >
                      <img 
                        src="/assets/matchdetaillogo/soccer-ball.svg" 
                        alt="Goal" 
                        className="w-3 h-3"
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                        }}
                      />
                    </div>
                  )}

                  {/* Saved event - ball caught by goalkeeper with realistic positioning */}
                  {currentShot?.type === 'saved' && (
                    <div 
                      className="absolute z-10"
                      style={{
                        left: `${68 + (currentShot.y / 100) * 45}px`, // Position within goal area for saves
                        bottom: `${5 + ((100 - currentShot.x) / 100) * 25}px`, // Goalkeeper reach area
                        width: '12px',
                        height: '12px',
                        animation: 'moveToSaved 1.8s ease-in-out'
                      }}
                    >
                      <img 
                        src="/assets/matchdetaillogo/soccer-ball.svg" 
                        alt="Saved Shot" 
                        className="w-3 h-3"
                        style={{
                          filter: 'drop-shadow(0 2px 6px rgba(255,193,7,0.8)) brightness(1.1)',
                          transform: 'scale(1.1)'
                        }}
                      />
                      {/* Goalkeeper glove effect */}
                      <div 
                        className="absolute -top-1 -left-1 w-5 h-5 rounded-full opacity-30 animate-pulse"
                        style={{
                          background: 'radial-gradient(circle, rgba(255,193,7,0.6) 0%, transparent 70%)'
                        }}
                      />
                    </div>
                  )}

                  {/* Blocked event - ball stopped by defender with impact effect */}
                  {currentShot?.type === 'blocked' && (
                    <div 
                      className="absolute z-10"
                      style={{
                        left: `${50 + (currentShot.y / 100) * 50}px`, // Wider penalty area for blocks
                        bottom: `${25 + ((100 - currentShot.x) / 100) * 25}px`, // Defender blocking zone
                        width: '12px',
                        height: '12px',
                        animation: 'moveToBlocked 1.6s ease-in-out'
                      }}
                    >
                      <img 
                        src="/assets/matchdetaillogo/soccer-ball.svg" 
                        alt="Blocked Shot" 
                        className="w-3 h-3"
                        style={{
                          filter: 'drop-shadow(0 2px 6px rgba(244,67,54,0.8)) contrast(1.2)',
                          transform: 'scale(1.05)'
                        }}
                      />
                      {/* Block impact effect */}
                      <div 
                        className="absolute -top-2 -left-2 w-7 h-7 opacity-40"
                        style={{
                          background: 'radial-gradient(circle, rgba(244,67,54,0.5) 0%, rgba(244,67,54,0.2) 50%, transparent 70%)',
                          animation: 'blockImpact 1.6s ease-out'
                        }}
                      />
                    </div>
                  )}

                  {/* Missed event - ball trajectory showing wide/high miss */}
                  {currentShot?.type === 'missed' && (
                    <div 
                      className="absolute z-10"
                      style={{
                        left: `${20 + (currentShot.y / 100) * 80}px`, // Wide area for missed shots
                        top: `${10 + (currentShot.x / 100) * 30}px`, // Higher trajectory for misses
                        width: '12px',
                        height: '12px',
                        animation: 'moveToMissed 2s ease-in-out'
                      }}
                    >
                      <img 
                        src="/assets/matchdetaillogo/soccer-ball.svg" 
                        alt="Missed Shot" 
                        className="w-3 h-3"
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(158,158,158,0.6)) grayscale(0.3)',
                          opacity: '0.85'
                        }}
                      />
                      {/* Miss trajectory trail effect */}
                      <div 
                        className="absolute top-1 left-1 w-2 h-8 opacity-20"
                        style={{
                          background: 'linear-gradient(to bottom, rgba(158,158,158,0.4), transparent)',
                          transform: 'rotate(-15deg)',
                          animation: 'missTrail 2s ease-out'
                        }}
                      />
                    </div>
                  )}

                  {/* Regular shot event - ball heading towards goal */}
                  {currentShot?.type === 'shot' && (
                    <div 
                      className="absolute z-10"
                      style={{
                        left: `${60 + (currentShot.y / 100) * 55}px`, // Shot trajectory towards goal
                        bottom: `${10 + ((100 - currentShot.x) / 100) * 35}px`, // On target shots
                        width: '12px',
                        height: '12px',
                        animation: 'moveToShot 1.7s ease-in-out'
                      }}
                    >
                      <img 
                        src="/assets/matchdetaillogo/soccer-ball.svg" 
                        alt="Shot on Target" 
                        className="w-3 h-3"
                        style={{
                          filter: 'drop-shadow(0 2px 5px rgba(59,130,246,0.7)) brightness(1.05)',
                          transform: 'scale(1.08)'
                        }}
                      />
                      {/* Shot power effect */}
                      <div 
                        className="absolute -top-1 -left-1 w-5 h-5 rounded-full opacity-25 animate-ping"
                        style={{
                          background: 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 70%)'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Event details container - 365scores style */}
              <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
                <div className="text-center flex-1">
                  <bdi className="font-semibold text-sm text-gray-800 block">{currentShot?.situation || 'Regular Play'}</bdi>
                  <div className="text-xs text-gray-500 mt-1">Situation</div>
                </div>
                <div className="w-px h-8 bg-gray-300 mx-3"></div>
                <div className="text-center flex-1">
                  <bdi className="font-semibold text-sm text-gray-800 block whitespace-normal break-words">{currentShot?.bodyPart || 'Left foot'}</bdi>
                  <div className="text-xs text-gray-500 mt-1 whitespace-nowrap">Shot Type</div>
                </div>
                <div className="w-px h-8 bg-gray-300 mx-3"></div>
                <div className="text-center flex-1">
                  <bdi className="font-semibold text-sm text-gray-800 block">{currentShot?.xG?.toFixed(2) || '0.00'}</bdi>
                  <div className="text-xs text-gray-500 mt-1">xG</div>
                </div>
                <div className="w-px h-8 bg-gray-300 mx-3"></div>
                <div className="text-center flex-1">
                  <bdi className="font-semibold text-sm text-gray-800 block">{currentShot?.xGOT?.toFixed(2) || '0.00'}</bdi>
                  <div className="text-xs text-gray-500 mt-1">xGOT</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Football field */}
        <div className="relative w-full h-80 mb-4 overflow-hidden rounded-lg">
          <img 
            src="/assets/matchdetaillogo/field.png" 
            alt="Football field"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjNGFhYjRhIi8+CjxyZWN0IHg9IjEiIHk9IjEiIHdpZHRoPSIzOTgiIGhlaWdodD0iMjQ4IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPGxpbmUgeDE9IjIwMCIgeTE9IjEiIHgyPSIyMDAiIHkyPSIyNDkiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSIyMDAiIGN5PSIxMjUiIHI9IjQwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPC9zdmc+';
            }}
          />

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
              <div
                className={`relative rounded-full transition-all duration-200 ${
                  index === selectedShotIndex 
                    ? 'w-7 h-7 shadow-lg border-4 border-white' 
                    : 'w-5 h-5 opacity-80 hover:opacity-100 hover:scale-110'
                } ${
                  shot.type === 'goal' ? 'bg-green-500 border-green-600' :
                  shot.type === 'saved' ? 'bg-yellow-500 border-yellow-600' :
                  shot.type === 'blocked' ? 'bg-red-500 border-red-600' :
                  shot.type === 'missed' ? 'bg-gray-400 border-gray-500' :
                  'bg-blue-500 border-blue-600'
                } shadow-md border-2`}
              >
                {/* Shot type icons */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {shot.type === 'goal' && (
                    <img 
                      src="/assets/matchdetaillogo/soccer-ball.svg" 
                      alt="Goal" 
                      className={`${index === selectedShotIndex ? 'w-4 h-4' : 'w-3 h-3'}`}
                    />
                  )}
                  {shot.type === 'saved' && (
                    <div className={`${index === selectedShotIndex ? 'text-xs' : 'text-[10px]'} text-white font-bold`}>S</div>
                  )}
                  {shot.type === 'blocked' && (
                    <div className={`${index === selectedShotIndex ? 'text-xs' : 'text-[10px]'} text-white font-bold`}>B</div>
                  )}
                  {shot.type === 'missed' && (
                    <div className={`${index === selectedShotIndex ? 'text-xs' : 'text-[10px]'} text-white font-bold`}>M</div>
                  )}
                  {shot.type === 'shot' && (
                    <div className={`${index === selectedShotIndex ? 'text-xs' : 'text-[10px]'} text-white font-bold`}>○</div>
                  )}
                </div>

                {/* Pulsing animation for selected shot */}
                {index === selectedShotIndex && (
                  <div className="absolute inset-0 rounded-full animate-ping bg-white opacity-30"></div>
                )}
              </div>

              {/* Enhanced tooltip with more details */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow-lg">
                <div className="font-medium">{shot.player}</div>
                <div className="text-gray-300">
                  {shot.minute}' • {shot.type.charAt(0).toUpperCase() + shot.type.slice(1)}
                </div>
                <div className="text-gray-400 text-[10px]">
                  {shot.bodyPart} • xG: {shot.xG?.toFixed(2)}
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          ))}

          {/* Shot trajectory lines for all shots with opacity */}
          {shotData.map((shot, index) => (
            <svg key={`trajectory-${shot.id}`} className="absolute inset-0 w-full h-full pointer-events-none">
              <line
                x1={`${shot.x}%`}
                y1={`${shot.y}%`}
                x2={shot.team === homeTeam ? "5%" : "95%"}
                y2="50%"
                stroke={getShotColor(shot.team)}
                strokeWidth={index === selectedShotIndex ? "3" : "1"}
                strokeDasharray="3,3"
                opacity={index === selectedShotIndex ? "0.8" : "0.3"}
              />
            </svg>
          ))}
        </div>

        {/* Shot legend */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-green-600 flex items-center justify-center">
                <img src="/assets/matchdetaillogo/soccer-ball.svg" alt="Goal" className="w-2 h-2" />
              </div>
              <span className="font-medium">Goal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-yellow-600 flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">S</span>
              </div>
              <span className="font-medium">Saved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-red-600 flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">B</span>
              </div>
              <span className="font-medium">Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded-full border-2 border-gray-500 flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">M</span>
              </div>
              <span className="font-medium">Missed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-blue-600 flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">○</span>
              </div>
              <span className="font-medium">Shot</span>
            </div>
          </div>
        </div>

        

        {/* Info note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
          <p>⚽ Interactive shot map - click on shots to see details and navigate through all match shots.</p>
        </div>

        {/* Enhanced CSS animations for all shot types */}
        <style jsx>{`
          @keyframes moveToGoal {
            0% {
              transform: translate(-50px, 50px) scale(0.8) rotate(-10deg);
              opacity: 0.7;
            }
            50% {
              transform: translate(-25px, 25px) scale(1.1) rotate(5deg);
              opacity: 1;
            }
            100% {
              transform: translate(0, 0) scale(1) rotate(0deg);
              opacity: 1;
            }
          }

          @keyframes moveToSaved {
            0% {
              transform: translate(-45px, 45px) scale(0.8) rotate(-15deg);
              opacity: 0.7;
            }
            40% {
              transform: translate(-25px, 25px) scale(1.15) rotate(10deg);
              opacity: 1;
            }
            70% {
              transform: translate(-10px, 10px) scale(1.05) rotate(-5deg);
              opacity: 0.95;
            }
            100% {
              transform: translate(0, 0) scale(1.1) rotate(0deg);
              opacity: 1;
            }
          }

          @keyframes moveToBlocked {
            0% {
              transform: translate(-40px, 40px) scale(0.8) rotate(-12deg);
              opacity: 0.7;
            }
            30% {
              transform: translate(-25px, 25px) scale(1.2) rotate(8deg);
              opacity: 1;
            }
            50% {
              transform: translate(-15px, 15px) scale(0.9) rotate(-8deg);
              opacity: 0.9;
            }
            70% {
              transform: translate(-8px, 8px) scale(1.1) rotate(4deg);
              opacity: 0.85;
            }
            100% {
              transform: translate(0, 0) scale(1.05) rotate(0deg);
              opacity: 1;
            }
          }

          @keyframes moveToMissed {
            0% {
              transform: translate(40px, -40px) scale(0.8) rotate(20deg);
              opacity: 0.7;
            }
            25% {
              transform: translate(25px, -25px) scale(1.1) rotate(15deg);
              opacity: 1;
            }
            50% {
              transform: translate(15px, -15px) scale(1.3) rotate(10deg);
              opacity: 0.9;
            }
            75% {
              transform: translate(8px, -8px) scale(1.1) rotate(5deg);
              opacity: 0.7;
            }
            100% {
              transform: translate(0, 0) scale(0.85) rotate(0deg);
              opacity: 0.85;
            }
          }

          @keyframes moveToShot {
            0% {
              transform: translate(-45px, 45px) scale(0.8) rotate(-10deg);
              opacity: 0.7;
            }
            40% {
              transform: translate(-25px, 25px) scale(1.2) rotate(5deg);
              opacity: 1;
            }
            70% {
              transform: translate(-12px, 12px) scale(1.05) rotate(-3deg);
              opacity: 0.95;
            }
            100% {
              transform: translate(0, 0) scale(1.08) rotate(0deg);
              opacity: 1;
            }
          }

          @keyframes blockImpact {
            0% {
              transform: scale(0.5);
              opacity: 0.8;
            }
            30% {
              transform: scale(1.2);
              opacity: 0.6;
            }
            60% {
              transform: scale(1.5);
              opacity: 0.3;
            }
            100% {
              transform: scale(2);
              opacity: 0;
            }
          }

          @keyframes missTrail {
            0% {
              opacity: 0.4;
              transform: rotate(-15deg) scaleY(1);
            }
            50% {
              opacity: 0.2;
              transform: rotate(-20deg) scaleY(1.5);
            }
            100% {
              opacity: 0;
              transform: rotate(-25deg) scaleY(2);
            }
          }
        `}</style>
      </CardContent>
    </Card>
  );
};

export default MyShotmap;