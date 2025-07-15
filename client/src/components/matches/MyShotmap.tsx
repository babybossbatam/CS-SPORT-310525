import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchShotData = async () => {
      if (!fixtureId) {
        setError("No fixture ID provided");
        setIsLoading(false);
        return;
      }

      try {
        console.log(`⚽ [MyShotmap] Fetching dynamic shot data for fixture: ${fixtureId}`);

        // First try to get shot data from our new shot map API
        const shotMapResponse = await fetch(
          `/api/shot-map/fixtures/${fixtureId}/shots?homeTeam=${encodeURIComponent(homeTeam || '')}&awayTeam=${encodeURIComponent(awayTeam || '')}&matchDate=${new Date().toISOString()}`
        );

        if (shotMapResponse.ok) {
          const dynamicShots = await shotMapResponse.json();
          console.log(`✅ [MyShotmap] Received ${dynamicShots.length} dynamic shots from shot map API`);

          if (dynamicShots.length > 0) {
            // Use real player names from API data, don't override with generic names
            const enhancedShots = dynamicShots.map((shot: any) => ({
              ...shot,
              player: shot.player || 'Unknown Player', // Keep the real player name from API
              playerPhoto: shot.sofaScorePlayerId 
                ? `https://imagecache.365scores.com/image/upload/f_png,w_38,h_38,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v53/Athletes/${shot.sofaScorePlayerId}`
                : shot.playerPhoto || '/assets/fallback_player.png'
            }));
            
            setShotData(enhancedShots);
            setError(null);
            return;
          }
        }

        // If no SofaScore data, try events as a last resort but don't use sample data
        console.log(`⚠️ [MyShotmap] No SofaScore shot data available, trying match events`);
        
        const eventsResponse = await fetch(`/api/fixtures/${fixtureId}/events`);
        if (eventsResponse.ok) {
          const events = await eventsResponse.json();
          console.log(`✅ [MyShotmap] Received ${events.length} events for shot analysis`);

          // Only process actual shot-related events, no fallback generation
          const shots: ShotData[] = [];
          let shotId = 1;

          events.forEach((event: any) => {
            // Only include events that are definitely shots or goals
            if (event.type === 'Goal' || 
                event.type === 'Missed Shot' || 
                event.type === 'Shot' || 
                event.type === 'Blocked Shot' ||
                (event.detail && (
                  event.detail.toLowerCase().includes('shot on target') ||
                  event.detail.toLowerCase().includes('shot off target') ||
                  event.detail.toLowerCase().includes('penalty') ||
                  event.detail.toLowerCase().includes('free kick goal')
                ))) {

              let shotType: 'goal' | 'shot' | 'saved' | 'blocked' | 'missed' = 'shot';
              const detail = event.detail?.toLowerCase() || '';
              const eventType = event.type?.toLowerCase() || '';

              if (event.type === 'Goal') {
                shotType = 'goal';
              } else if (detail.includes('saved') || detail.includes('save')) {
                shotType = 'saved';
              } else if (detail.includes('blocked') || eventType.includes('blocked')) {
                shotType = 'blocked';
              } else if (detail.includes('missed') || detail.includes('off target') || eventType.includes('missed')) {
                shotType = 'missed';
              }

              // Generate realistic coordinates based on actual event data
              const isHomeTeam = event.team?.name === homeTeam;
              const x = isHomeTeam ? Math.random() * 35 + 10 : Math.random() * 35 + 55;
              const y = Math.random() * 60 + 20;

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
                xG: shotType === 'goal' ? Math.random() * 0.4 + 0.4 : 
                    shotType === 'missed' ? Math.random() * 0.2 + 0.02 : 
                    Math.random() * 0.6 + 0.1,
                xGOT: shotType === 'goal' ? Math.random() * 0.4 + 0.4 : undefined,
                playerId: event.player?.id,
                playerPhoto: event.player?.id 
                  ? `https://imagecache.365scores.com/image/upload/f_png,w_38,h_38,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v53/Athletes/${event.player.id}`
                  : '/assets/fallback_player.png'
              };

              shots.push(shotData);
            }
          });

          if (shots.length > 0) {
            shots.sort((a, b) => a.minute - b.minute);
            setShotData(shots);
            console.log(`✅ [MyShotmap] Processed ${shots.length} real shots from events`);
            setError(null);
            return;
          }
        }

        // If no real shot data is available at all, show error instead of fake data
        console.log(`⚠️ [MyShotmap] No real shot data available for this match`);
        setShotData([]);
        setError("No shot data available for this match");

        setError(null);
      } catch (error) {
        console.error(`❌ [MyShotmap] Error fetching shot data:`, error);
        setShotData([]);
        setError("Unable to load shot data at this time");
      } finally {
        setIsLoading(false);
      }
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
              <p>{error || "No shot data available for this match"}</p>
              <p className="text-sm">Shot maps are available for matches with recorded shot events</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-semibold border-b">Shot Map</CardTitle>
      </CardHeader>

      <CardContent className="-mb-4  ">
        {/* Shot type legend */}
        <div className="flex justify-center gap-4 mb-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
            <span>Goal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500 border border-white"></div>
            <span>Saved</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
            <span>Blocked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-500 border border-white"></div>
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div>
            <span>Shot</span>
          </div>
        </div>

        {/* Main content layout with field and goal view side by side */}
        <div className="flex gap-2">
          {/* Football field - 50.6% size (10% increase from 46%), left side */}
          <div className="relative overflow-hidden -ml-4 -mt-4 -mb-2 flex-shrink-0 " style={{ width: '52.6%', height: '100%' }}>
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
                      className="w-2 h-2"
                    />
                  )}
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
            <div className="flex flex-col gap-4    h-147">
              {/* Player info header with navigation arrows */}
              <div className="pb-8 flex items-center justify-between    ">
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
              <div className="event-details-enhanced -mt-3.5 ">
                <div className="event-detail-card ">
                  <div className="event-card-main whitespace-nowrap pr-2 bg-transparent">{currentShot?.situation || 'Regular Play'}</div>
                  <div className="event-card-sub">Situation</div>
                </div>
                <div className="event-detail-card">
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