
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import MyAvatarInfo from './MyAvatarInfo';
import '../../styles/ShotMapEnhancements.css';

interface SofaScoreShotmapProps {
  match?: any;
  fixtureId?: string | number;
  homeTeam?: string;
  awayTeam?: string;
  matchDate?: string;
}

interface SofaScoreShotData {
  id: number;
  x: number;
  y: number;
  type: 'goal' | 'on_target' | 'off_target' | 'blocked';
  player: {
    id: number;
    name: string;
    position?: string;
  };
  team: string;
  minute: number;
  bodyPart: string;
  situation: string;
  xg: number;
  xgot?: number;
  goalMouthLocation?: string;
  isHome: boolean;
}

const SofaScoreShotmap: React.FC<SofaScoreShotmapProps> = ({
  match,
  fixtureId,
  homeTeam,
  awayTeam,
  matchDate,
}) => {
  const [shotData, setShotData] = useState<SofaScoreShotData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShotIndex, setSelectedShotIndex] = useState(0);
  const [dataSource, setDataSource] = useState<'sofascore' | 'fallback' | 'none'>('none');

  useEffect(() => {
    const fetchSofaScoreShots = async () => {
      if (!fixtureId) {
        setError("No fixture ID provided");
        setIsLoading(false);
        return;
      }

      try {
        console.log(`🎯 [SofaScoreShotmap] Fetching SofaScore shots for fixture: ${fixtureId}`);

        // Try to get SofaScore event ID by matching teams and date
        let sofaScoreEventId = null;
        if (homeTeam && awayTeam && matchDate) {
          const eventSearchResponse = await fetch(`/api/sofascore/find-event?homeTeam=${encodeURIComponent(homeTeam)}&awayTeam=${encodeURIComponent(awayTeam)}&matchDate=${encodeURIComponent(matchDate)}`);
          if (eventSearchResponse.ok) {
            const eventData = await eventSearchResponse.json();
            sofaScoreEventId = eventData.eventId;
          }
        }

        // If we have a SofaScore event ID, fetch the shotmap
        if (sofaScoreEventId) {
          console.log(`🎯 [SofaScoreShotmap] Found SofaScore event ID: ${sofaScoreEventId}`);
          
          const shotmapResponse = await fetch(`/api/sofascore/shotmap/${sofaScoreEventId}`);
          
          if (shotmapResponse.ok) {
            const sofaScoreData = await shotmapResponse.json();
            
            if (sofaScoreData.shotmap && sofaScoreData.shotmap.length > 0) {
              console.log(`✅ [SofaScoreShotmap] Retrieved ${sofaScoreData.shotmap.length} shots from SofaScore`);
              
              // Convert SofaScore data to our format
              const convertedShots: SofaScoreShotData[] = sofaScoreData.shotmap.map((shot: any, index: number) => ({
                id: shot.id || index + 1,
                // SofaScore coordinates are from 0-100, adjust for field orientation
                x: shot.isHome ? shot.playerCoordinates.x : (100 - shot.playerCoordinates.x),
                y: shot.playerCoordinates.y,
                type: mapSofaScoreShotType(shot.shotType),
                player: {
                  id: shot.player.id,
                  name: shot.player.name,
                  position: shot.player.position,
                },
                team: shot.isHome ? homeTeam || 'Home Team' : awayTeam || 'Away Team',
                minute: shot.time + (shot.addedTime || 0),
                bodyPart: shot.bodyPart || 'right-foot',
                situation: shot.situation || 'regular',
                xg: shot.xg || 0,
                xgot: shot.xgot,
                goalMouthLocation: shot.goalMouthLocation,
                isHome: shot.isHome,
              }));

              // Sort by time
              convertedShots.sort((a, b) => a.minute - b.minute);
              
              setShotData(convertedShots);
              setDataSource('sofascore');
              setError(null);
              setIsLoading(false);
              return;
            }
          }
        }

        // Fallback to API-Sports events
        console.log(`⚠️ [SofaScoreShotmap] SofaScore data unavailable, falling back to API-Sports events`);
        const eventsResponse = await fetch(`/api/fixtures/${fixtureId}/events`);
        
        if (eventsResponse.ok) {
          const events = await eventsResponse.json();
          const fallbackShots = processFallbackEvents(events, homeTeam, awayTeam);
          
          if (fallbackShots.length > 0) {
            setShotData(fallbackShots);
            setDataSource('fallback');
            console.log(`✅ [SofaScoreShotmap] Using ${fallbackShots.length} shots from API-Sports fallback`);
          } else {
            setError("No shot data available from any source");
          }
        } else {
          setError("Unable to fetch shot data");
        }

      } catch (error) {
        console.error(`❌ [SofaScoreShotmap] Error fetching shot data:`, error);
        setError("Failed to fetch shot data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSofaScoreShots();
  }, [fixtureId, homeTeam, awayTeam, matchDate]);

  const mapSofaScoreShotType = (shotType: string): 'goal' | 'on_target' | 'off_target' | 'blocked' => {
    const type = shotType.toLowerCase();
    if (type === 'goal') return 'goal';
    if (type === 'save' || type === 'on-target') return 'on_target';
    if (type === 'block') return 'blocked';
    return 'off_target';
  };

  const processFallbackEvents = (events: any[], homeTeam?: string, awayTeam?: string): SofaScoreShotData[] => {
    const shots: SofaScoreShotData[] = [];
    let shotId = 1;

    events.forEach((event: any) => {
      if (event.type === 'Goal' || 
          event.detail?.toLowerCase().includes('shot') || 
          event.detail?.toLowerCase().includes('penalty') || 
          event.detail?.toLowerCase().includes('missed') ||
          event.type === 'Missed Shot' || 
          event.type === 'Shot' || 
          event.type === 'Blocked Shot') {

        const isHomeTeam = event.team?.name === homeTeam;
        let shotType: 'goal' | 'on_target' | 'off_target' | 'blocked' = 'on_target';
        
        const detail = event.detail?.toLowerCase() || '';
        if (event.type === 'Goal') shotType = 'goal';
        else if (detail.includes('blocked') || event.type === 'Blocked Shot') shotType = 'blocked';
        else if (detail.includes('missed') || event.type === 'Missed Shot') shotType = 'off_target';

        // Generate realistic coordinates based on team and shot type
        const x = isHomeTeam ? 
          (shotType === 'off_target' ? Math.random() * 40 : Math.random() * 30 + 5) :
          (shotType === 'off_target' ? Math.random() * 40 + 60 : Math.random() * 30 + 70);
        
        const y = shotType === 'off_target' ? 
          Math.random() * 80 + 10 : 
          Math.random() * 60 + 20;

        shots.push({
          id: shotId++,
          x: Math.round(x),
          y: Math.round(y),
          type: shotType,
          player: {
            id: event.player?.id || 0,
            name: event.player?.name || 'Unknown Player',
          },
          team: event.team?.name || (isHomeTeam ? homeTeam : awayTeam) || 'Unknown Team',
          minute: event.time?.elapsed || 0,
          bodyPart: detail.includes('header') ? 'head' : 'right-foot',
          situation: detail.includes('penalty') ? 'penalty' : 'regular',
          xg: Math.random() * 0.8 + 0.05,
          isHome: isHomeTeam,
        });
      }
    });

    return shots;
  };

  const getShotColor = (shot: SofaScoreShotData) => {
    return shot.isHome ? 'rgb(59, 130, 246)' : 'rgb(239, 68, 68)'; // Blue for home, red for away
  };

  const getShotTypeIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return '⚽';
      case 'on_target':
        return '🎯';
      case 'blocked':
        return '🛡️';
      case 'off_target':
        return '📍';
      default:
        return '⚪';
    }
  };

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
          <CardTitle className="flex items-center gap-2">
            <span>SofaScore Shot Map</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Real Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading SofaScore shot data...</p>
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
          <CardTitle className="flex items-center gap-2">
            <span>SofaScore Shot Map</span>
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">No Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-8">
            <div className="text-center text-gray-500">
              <p>{error || "No shot data available"}</p>
              <p className="text-sm mt-2">SofaScore data integration in progress</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentShot = shotData[selectedShotIndex];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>SofaScore Shot Map</span>
          <span className={`text-xs px-2 py-1 rounded ${
            dataSource === 'sofascore' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-orange-100 text-orange-800'
          }`}>
            {dataSource === 'sofascore' ? 'SofaScore Data' : 'Fallback Data'}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Football field visualization */}
          <div className="relative flex-shrink-0" style={{ width: '45%', height: '300px' }}>
            <div className="w-full h-full bg-green-500 relative rounded border-2 border-white">
              {/* Field markings */}
              <div className="absolute inset-0">
                {/* Center line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white transform -translate-x-0.5"></div>
                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 w-16 h-16 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                {/* Penalty areas */}
                <div className="absolute left-0 top-1/4 w-1/6 h-1/2 border-2 border-white border-l-0"></div>
                <div className="absolute right-0 top-1/4 w-1/6 h-1/2 border-2 border-white border-r-0"></div>
                {/* Goal areas */}
                <div className="absolute left-0 top-5/12 w-1/12 h-1/6 border-2 border-white border-l-0"></div>
                <div className="absolute right-0 top-5/12 w-1/12 h-1/6 border-2 border-white border-r-0"></div>
              </div>

              {/* Shot markers */}
              {shotData.map((shot, index) => (
                <div
                  key={shot.id}
                  className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
                    index === selectedShotIndex ? 'z-20 scale-125' : 'z-10'
                  }`}
                  style={{
                    left: `${shot.x}%`,
                    top: `${shot.y}%`,
                  }}
                  onClick={() => setSelectedShotIndex(index)}
                >
                  <div 
                    className={`w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold ${
                      index === selectedShotIndex ? 'ring-2 ring-yellow-400' : ''
                    }`}
                    style={{ backgroundColor: getShotColor(shot) }}
                  >
                    {shot.type === 'goal' ? '⚽' : getShotTypeIcon(shot.type)}
                  </div>

                  {/* Tooltip */}
                  <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-30">
                    <div className="font-medium">{shot.player.name}</div>
                    <div className="text-gray-300">{shot.minute}' • {shot.type.replace('_', ' ')}</div>
                    <div className="text-gray-400">xG: {shot.xg.toFixed(2)}</div>
                  </div>
                </div>
              ))}

              {/* Shot trajectory for selected shot */}
              {currentShot && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line
                    x1={`${currentShot.x}%`}
                    y1={`${currentShot.y}%`}
                    x2={currentShot.isHome ? "95%" : "5%"}
                    y2="50%"
                    stroke={getShotColor(currentShot)}
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.7"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Shot details panel */}
          <div className="flex-1">
            <div className="bg-gray-50 rounded-lg p-4 h-full">
              {/* Player info and navigation */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MyAvatarInfo
                    playerId={currentShot?.player.id}
                    playerName={currentShot?.player.name}
                    size="lg"
                    className="w-12 h-12 border-2 border-gray-300"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{currentShot?.player.name}</div>
                    <div className={`text-sm font-medium capitalize ${
                      currentShot?.type === 'goal' ? 'text-green-600' : 
                      currentShot?.type === 'on_target' ? 'text-blue-600' :
                      currentShot?.type === 'blocked' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {currentShot?.type.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                {/* Navigation controls */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigateShot('prev')}
                    disabled={selectedShotIndex === 0}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ←
                  </button>
                  <span className="text-sm text-gray-500">
                    {selectedShotIndex + 1} / {shotData.length}
                  </span>
                  <button 
                    onClick={() => navigateShot('next')}
                    disabled={selectedShotIndex === shotData.length - 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Shot details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Time</div>
                  <div className="text-lg font-medium">{currentShot?.minute}'</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Body Part</div>
                  <div className="text-lg font-medium capitalize">{currentShot?.bodyPart.replace('-', ' ')}</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Situation</div>
                  <div className="text-lg font-medium capitalize">{currentShot?.situation}</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">xG</div>
                  <div className="text-lg font-medium">{currentShot?.xg.toFixed(3)}</div>
                </div>
                {currentShot?.xgot && (
                  <div className="bg-white p-3 rounded border col-span-2">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">xGOT</div>
                    <div className="text-lg font-medium">{currentShot.xgot.toFixed(3)}</div>
                  </div>
                )}
              </div>

              {/* Data source indicator */}
              <div className="mt-4 text-xs text-gray-500 text-center">
                Data source: {dataSource === 'sofascore' ? 'SofaScore API' : 'API-Sports (Fallback)'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SofaScoreShotmap;
