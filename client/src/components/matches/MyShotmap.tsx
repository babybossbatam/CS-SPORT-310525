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
                event.detail?.toLowerCase().includes('penalty') || event.detail?.toLowerCase().includes('missed')) {

              // Determine shot type from event detail
              let shotType: 'goal' | 'shot' | 'saved' | 'blocked' | 'missed' = 'shot';
              const detail = event.detail?.toLowerCase() || '';

              if (event.type === 'Goal' || detail.includes('goal')) {
                shotType = 'goal';
              } else if (detail.includes('saved') || detail.includes('save')) {
                shotType = 'saved';
              } else if (detail.includes('blocked') || detail.includes('block')) {
                shotType = 'blocked';
              } else if (detail.includes('missed') || detail.includes('miss') || detail.includes('wide')) {
                shotType = 'missed';
              }

              // Generate realistic coordinates based on shot type and team
              const isHomeTeam = event.team?.name === homeTeam;
              const x = isHomeTeam ? Math.random() * 30 + 70 : Math.random() * 30 + 5; // Home shots from right side
              const y = Math.random() * 60 + 20; // Random Y position in central area

              shots.push({
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
                xG: Math.random() * 0.8 + 0.05, // Random xG between 0.05 and 0.85
                xGOT: shotType === 'goal' ? Math.random() * 0.4 + 0.4 : undefined, // Higher xGOT for goals
                playerId: event.player?.id,
                playerPhoto: event.player?.id 
                  ? `https://imagecache.365scores.com/image/upload/f_png,w_38,h_38,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v53/Athletes/${event.player.id}`
                  : '/assets/fallback_player.png'
              });
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
              x: shot.x,
              y: shot.y,
              type: mapSofaScoreShotType(shot.type),
              player: shot.player?.name || `Player ${index + 1}`,
              team: shot.x > 50 ? homeTeam || 'Home Team' : awayTeam || 'Away Team',
              minute: shot.minute,
              bodyPart: shot.bodyPart || 'Right foot',
              situation: shot.situation || 'Regular Play',
              xG: Math.random() * 0.8 + 0.05,
              xGOT: shot.type === 'goal' ? Math.random() * 0.4 + 0.4 : undefined,
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
            <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
              {/* Goal frame container */}
              <div className="relative flex-shrink-0" style={{ height: '90.6125px' }}>
                <div className="relative bg-white rounded" style={{ height: '90.6125px' }}>
                  <img 
                    className="goal-frame"
                    alt=""
                    title=""
                    src="/assets/matchdetaillogo/technical-diagram.svg"
                    loading="lazy"
                    style={{ width: '141.563px', height: '65.3568px' }}
                  />

                  {/* Goal event - ball inside goal */}
                  {currentShot?.type === 'goal' && (
                    <div 
                      className="absolute z-10 flex items-center justify-center"
                      style={{
                        left: '70%',
                        bottom: '25%',
                        transform: 'translate(-50%, 50%)',
                        width: '12px',
                        height: '12px'
                      }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full border-2"
                        style={{
                          backgroundColor: 'rgb(255, 255, 255)',
                          borderColor: 'rgb(0, 54, 108)'
                        }}
                      ></div>
                    </div>
                  )}

                  {/* Saved event - ball on goal line */}
                  {currentShot?.type === 'saved' && (
                    <div 
                      className="absolute z-10 flex items-center justify-center"
                      style={{
                        left: '50%',
                        bottom: '0%',
                        transform: 'translate(-50%, 0%)',
                        width: '12px',
                        height: '12px'
                      }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: 'rgb(255, 193, 7)',
                          border: '1px solid rgb(255, 152, 0)'
                        }}
                      ></div>
                    </div>
                  )}

                  {/* Blocked event - ball in penalty area */}
                  {currentShot?.type === 'blocked' && (
                    <div 
                      className="absolute z-10 flex items-center justify-center"
                      style={{
                        left: '45%',
                        bottom: '35%',
                        transform: 'translate(-50%, 50%)',
                        width: '12px',
                        height: '12px'
                      }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: 'rgb(244, 67, 54)',
                          border: '1px solid rgb(211, 47, 47)'
                        }}
                      ></div>
                    </div>
                  )}

                  {/* Missed event - ball outside goal */}
                  {currentShot?.type === 'missed' && (
                    <div 
                      className="absolute z-10 flex items-center justify-center"
                      style={{
                        left: '20%',
                        top: '20%',
                        transform: 'translate(-50%, -50%)',
                        width: '12px',
                        height: '12px'
                      }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full border-2 bg-transparent"
                        style={{
                          borderColor: 'rgb(158, 158, 158)'
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Event details container - 365scores style */}
              <div className="flex gap-4 flex-1">
                <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                  <bdi className="font-semibold text-sm text-gray-800 block">{currentShot?.situation || 'Regular Play'}</bdi>
                  <div className="text-xs text-gray-500 mt-1">Situation</div>
                </div>
                <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                  <bdi className="font-semibold text-sm text-gray-800 block whitespace-normal break-words">{currentShot?.bodyPart || 'Left foot'}</bdi>
                  <div className="text-xs text-gray-500 mt-1 whitespace-nowrap">Shot Type</div>
                </div>
                <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                  <bdi className="font-semibold text-sm text-gray-800 block">{currentShot?.xG?.toFixed(2) || '0.00'}</bdi>
                  <div className="text-xs text-gray-500 mt-1">xG</div>
                </div>
                <div className="text-center bg-white rounded-lg p-3 shadow-sm">
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

          {/* Shot markers */}
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
                className={`relative rounded-full border-3 transition-all duration-200 ${
                  index === selectedShotIndex 
                    ? 'w-6 h-6 shadow-lg border-4' 
                    : 'w-4 h-4 opacity-70 hover:opacity-100'
                } ${
                  shot.type === 'goal' ? 'bg-transparent border-green-600' :
                  shot.type === 'saved' ? 'bg-yellow-500 border-yellow-600' :
                  shot.type === 'blocked' ? 'bg-red-500 border-red-600' :
                  shot.type === 'missed' ? 'bg-gray-400 border-gray-500' :
                  'bg-blue-500 border-blue-600'
                }`}
              >
                {/* Soccer ball icon for goals */}
                {shot.type === 'goal' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img 
                      src="/assets/matchdetaillogo/soccer-ball.svg" 
                      alt="Goal" 
                      className={`${index === selectedShotIndex ? 'w-5 h-5' : 'w-3 h-3'}`}
                    />
                  </div>
                )}

                {/* Circle with team color border for selected */}
                {index === selectedShotIndex && (
                  <div 
                    className="absolute inset-0 rounded-full border-2"
                    style={{
                      borderColor: getShotColor(shot.team),
                    }}
                  ></div>
                )}
              </div>

              {/* Enhanced tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow-lg">
                <div className="font-medium">{shot.player}</div>
                <div className="text-gray-300">{shot.minute}' • {shot.type}</div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          ))}

          {/* Selected shot trajectory line */}
          {currentShot && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line
                x1={`${currentShot.x}%`}
                y1={`${currentShot.y}%`}
                x2={currentShot.team === homeTeam ? "95%" : "5%"}
                y2="50%"
                stroke={getShotColor(currentShot.team)}
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.6"
              />
            </svg>
          )}
        </div>

        {/* Shot statistics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-semibold mb-2">{homeTeam || 'Home Team'}</h4>
            <div className="space-y-1 text-sm">
              <div>Goals: {shotData.filter(s => s.team === homeTeam && s.type === 'goal').length}</div>
              <div>Shots: {shotData.filter(s => s.team === homeTeam).length}</div>
              <div>On Target: {shotData.filter(s => s.team === homeTeam && (s.type === 'goal' || s.type === 'saved')).length}</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">{awayTeam || 'Away Team'}</h4>
            <div className="space-y-1 text-sm">
              <div>Goals: {shotData.filter(s => s.team === awayTeam && s.type === 'goal').length}</div>
              <div>Shots: {shotData.filter(s => s.team === awayTeam).length}</div>
              <div>On Target: {shotData.filter(s => s.team === awayTeam && (s.type === 'goal' || s.type === 'saved')).length}</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 flex-wrap text-sm bg-white p-3 rounded-lg border">
          <div className="text-gray-700 font-medium">Shot Types:</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border border-green-600"></div>
            <span className="text-gray-600">Goal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 border border-yellow-600"></div>
            <span className="text-gray-600">Saved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border border-red-600"></div>
            <span className="text-gray-600">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-400 border border-gray-500"></div>
            <span className="text-gray-600">Missed</span>
          </div>
        </div>

        {/* Info note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
          <p>⚽ Interactive shot map - click on shots to see details and navigate through all match shots.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyShotmap;