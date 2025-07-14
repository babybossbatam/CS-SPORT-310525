
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
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300">
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

          {/* Goal view section with SVG goal frame */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-6">
              {/* Goal frame visualization using technical diagram SVG */}
              <div className="relative flex-shrink-0">
                <div className="w-40 h-24 border-2 border-gray-300 bg-white rounded relative overflow-hidden">
                  {/* Technical diagram pattern */}
                  <img 
                    src="/assets/matchdetaillogo/technical-diagram.svg" 
                    alt="Technical diagram"
                    className="absolute inset-0 w-full h-full object-cover"
                  /></div>
                  
                  {/* Ball position in goal for goals */}
                  {currentShot?.type === 'goal' && (
                    <div 
                      className="absolute w-3 h-3 bg-black rounded-full z-10"
                      style={{
                        left: '70%',
                        bottom: '25%',
                        transform: 'translate(-50%, 50%)'
                      }}
                    ></div>
                  )}
                  
                  {/* Shot target indicator for other shots */}
                  {currentShot?.type !== 'goal' && (
                    <div 
                      className={`absolute w-3 h-3 rounded-full z-10 ${
                        currentShot?.type === 'saved' ? 'bg-yellow-500' : 
                        currentShot?.type === 'blocked' ? 'bg-red-500' : 
                        'bg-gray-400'
                      }`}
                      style={{
                        left: currentShot?.type === 'missed' ? '20%' : '50%',
                        top: currentShot?.type === 'saved' ? '30%' : '50%',
                        transform: 'translate(-50%, -50%)'
                      }}
                    ></div>
                  )}
                </div>
              </div>

              {/* Shot details */}
              <div className="grid grid-cols-2 gap-6 flex-1">
                <div className="text-center">
                  <div className="font-semibold text-sm text-gray-600">{currentShot?.situation || 'Regular Play'}</div>
                  <div className="text-xs text-gray-400">Situation</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm text-gray-600">{currentShot?.bodyPart || 'Left foot'}</div>
                  <div className="text-xs text-gray-400">Shot Type</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm text-gray-600">{currentShot?.xG?.toFixed(2) || '0.00'}</div>
                  <div className="text-xs text-gray-400">xG</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm text-gray-600">{currentShot?.xGOT?.toFixed(2) || '0.00'}</div>
                  <div className="text-xs text-gray-400">xGOT</div>
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
                  shot.type === 'goal' ? 'bg-green-500 border-green-600' :
                  shot.type === 'saved' ? 'bg-yellow-500 border-yellow-600' :
                  shot.type === 'blocked' ? 'bg-red-500 border-red-600' :
                  shot.type === 'missed' ? 'bg-gray-400 border-gray-500' :
                  'bg-blue-500 border-blue-600'
                }`}
              >
                {/* Special icon for goals */}
                {shot.type === 'goal' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
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
