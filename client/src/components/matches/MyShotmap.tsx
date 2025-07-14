
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

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
        
        // Enhanced mock data with more details
        const mockShots: ShotData[] = [
          {
            id: 1,
            x: 85,
            y: 45,
            type: 'goal',
            player: 'Lionel Messi',
            team: homeTeam || 'Home Team',
            minute: 27,
            bodyPart: 'Left foot',
            situation: 'Regular Play',
            xG: 0.20,
            xGOT: 0.65,
            playerPhoto: 'https://imagecache.365scores.com/image/upload/f_png,w_38,h_38,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v53/Athletes/874'
          },
          {
            id: 2,
            x: 75,
            y: 35,
            type: 'shot',
            player: 'Luis Suárez',
            team: homeTeam || 'Home Team',
            minute: 45,
            bodyPart: 'Right foot',
            situation: 'Regular Play',
            xG: 0.15,
            playerPhoto: 'https://imagecache.365scores.com/image/upload/f_png,w_38,h_38,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v53/Athletes/874'
          },
          {
            id: 3,
            x: 20,
            y: 50,
            type: 'goal',
            player: 'Carles Gil',
            team: awayTeam || 'Away Team',
            minute: 80,
            bodyPart: 'Right foot',
            situation: 'Counter Attack',
            xG: 0.25,
            xGOT: 0.55,
            playerPhoto: 'https://imagecache.365scores.com/image/upload/f_png,w_38,h_38,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v53/Athletes/874'
          },
          {
            id: 4,
            x: 90,
            y: 40,
            type: 'saved',
            player: 'Jordi Alba',
            team: homeTeam || 'Home Team',
            minute: 65,
            bodyPart: 'Left foot',
            situation: 'Set Piece',
            xG: 0.18,
            playerPhoto: 'https://imagecache.365scores.com/image/upload/f_png,w_38,h_38,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v53/Athletes/874'
          },
          {
            id: 5,
            x: 78,
            y: 25,
            type: 'blocked',
            player: 'Pedri',
            team: homeTeam || 'Home Team',
            minute: 38,
            bodyPart: 'Right foot',
            situation: 'Regular Play',
            xG: 0.12,
            playerPhoto: 'https://imagecache.365scores.com/image/upload/f_png,w_38,h_38,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v53/Athletes/874'
          }
        ];

        setShotData(mockShots);
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
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                <img 
                  src={currentShot?.playerPhoto || '/assets/fallback_player.png'} 
                  alt={currentShot?.player}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/assets/fallback_player.png';
                  }}
                />
              </div>
              <div>
                <div className="font-semibold text-sm">{currentShot?.player}</div>
                <div className={`text-xs ${currentShot?.type === 'goal' ? 'text-green-600 font-semibold' : 'text-gray-600'}`}>
                  {currentShot?.type === 'goal' ? 'Goal' : currentShot?.type.charAt(0).toUpperCase() + currentShot?.type.slice(1)}
                </div>
              </div>
            </div>

            {/* Shot navigation */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigateShot('prev')}
                disabled={selectedShotIndex === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z" fill="currentColor"/>
                </svg>
              </button>
              
              <div className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
                {currentShot?.minute}'
              </div>
              
              <button 
                onClick={() => navigateShot('next')}
                disabled={selectedShotIndex === shotData.length - 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Goal view section for goals */}
          {currentShot?.type === 'goal' && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                {/* Goal frame visualization */}
                <div className="relative">
                  <div className="w-32 h-20 border-2 border-gray-400 rounded-sm bg-green-100 relative">
                    <div className="absolute w-6 h-12 border-2 border-gray-400 border-r-0 -left-2 top-1/2 transform -translate-y-1/2 bg-green-50"></div>
                    {/* Ball position in goal */}
                    <div 
                      className="absolute w-2 h-2 bg-black rounded-full"
                      style={{
                        left: '60%',
                        bottom: '10%'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Shot details */}
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="text-center">
                    <div className="font-semibold text-sm">{currentShot.situation}</div>
                    <div className="text-xs text-gray-500">Situation</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-sm">{currentShot.bodyPart}</div>
                    <div className="text-xs text-gray-500">Shot Type</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-sm">{currentShot.xG.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">xG</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-sm">{currentShot.xGOT?.toFixed(2) || '-'}</div>
                    <div className="text-xs text-gray-500">xGOT</div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
              className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                index === selectedShotIndex ? 'z-10' : 'z-5'
              }`}
              style={{
                left: `${shot.x}%`,
                top: `${shot.y}%`,
              }}
              onClick={() => setSelectedShotIndex(index)}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 bg-white transition-all duration-200 ${
                  index === selectedShotIndex 
                    ? 'scale-125 shadow-lg border-4' 
                    : 'scale-100 opacity-80'
                } ${shot.type === 'goal' ? 'border-green-500' : ''}`}
                style={{
                  borderColor: getShotColor(shot.team),
                  opacity: index === selectedShotIndex ? 1 : 0.8,
                }}
              >
                {shot.type === 'goal' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                      <path 
                        d="M19.0736 4.93537C18.1476 4.00326 17.0457 3.26388 15.8316 2.76002C14.6175 2.25616 13.3153 1.99784 12.0006 2.00001C10.6855 1.99796 9.38313 2.25633 8.16871 2.76017C6.9543 3.26402 5.85198 4.00334 4.92551 4.93537C1.02483 8.82986 1.02483 15.1691 4.92551 19.0646C5.852 19.9969 6.95446 20.7364 8.16908 21.2403C9.3837 21.7441 10.6863 22.0023 12.0016 22C13.3163 22.0023 14.6183 21.7441 15.8324 21.2404C17.0465 20.7368 18.1485 19.9976 19.0746 19.0656C22.9753 15.1711 22.9753 8.83185 19.0736 4.93537ZM18.2453 16.9955H16.0013L14.7427 19.5092C13.8648 19.8332 12.9365 19.9999 12.0006 20.0018C11.0629 20.0001 10.1329 19.833 9.25338 19.5082L7.99784 17.0055H5.76187C4.93695 15.9813 4.37909 14.7689 4.13817 13.4767L5.99697 11.0009L4.78045 8.57009C5.16862 7.74542 5.69624 6.99375 6.34012 6.34809C7.2413 5.44497 8.34588 4.77043 9.56151 4.38087L11.9996 6.0054L14.4386 4.38187C15.6539 4.7717 16.7583 5.44582 17.66 6.34809C18.3032 6.99298 18.8304 7.7436 19.2187 8.56709L18.0022 11.0009L19.861 13.4767C19.6211 14.7647 19.0661 15.9735 18.2453 16.9955Z" 
                        fill="#151E22"
                      />
                      <path 
                        d="M8.49805 11.0009L9.9987 14.9973H14.0004L15.5011 11.0009L11.9996 8.50315L8.49805 11.0009Z" 
                        fill="#151E22"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                {shot.player} - {shot.minute}' ({shot.type})
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
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="text-gray-600">Shot Types:</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-500">Goal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-500">Shot</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-500">Saved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-gray-500">Blocked</span>
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
