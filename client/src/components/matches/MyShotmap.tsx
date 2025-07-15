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
        <CardTitle className="text-sm font-normal">Shot Map</CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="flex items-center justify-center p-8">
          <div className="text-center text-gray-500">
            <p>Shot map visualization will be available soon</p>
            <p className="text-sm mt-2">Player data accuracy improvements in progress</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyShotmap;