
import axios from 'axios';

interface SofaScoreHeatmapData {
  heatmap: Array<{
    x: number;
    y: number;
    value: number;
  }>;
  shots: Array<{
    x: number;
    y: number;
    type: 'goal' | 'on_target' | 'off_target' | 'blocked';
    minute: number;
  }>;
}

interface SofaScorePlayerStats {
  rating: number;
  goals: number;
  assists: number;
  minutes: number;
  position: string;
  heatmapData?: SofaScoreHeatmapData;
}

class SofaScoreAPI {
  private baseUrl = 'https://api.sofascore.com/api/v1';
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': 'https://www.sofascore.com/',
    'Origin': 'https://www.sofascore.com'
  };

  async getPlayerHeatmap(playerId: number, eventId: number): Promise<SofaScoreHeatmapData | null> {
    try {
      console.log(`🔍 [SofaScore] Fetching heatmap for player ${playerId} in event ${eventId}`);
      
      // Real SofaScore heatmap endpoint
      const heatmapUrl = `${this.baseUrl}/event/${eventId}/player/${playerId}/heatmap`;
      
      const response = await axios.get(heatmapUrl, { 
        headers: this.headers, 
        timeout: 8000,
        validateStatus: (status) => status < 500 // Accept 4xx as valid responses
      });

      if (response.status === 200 && response.data) {
        const rawData = response.data;
        
        // Process real SofaScore heatmap data
        const heatmapPoints = this.processHeatmapData(rawData);
        
        // Also try to get shots data
        const shotsData = await this.getPlayerShots(playerId, eventId);
        
        return {
          heatmap: heatmapPoints,
          shots: shotsData || []
        };
      } else {
        console.log(`⚠️ [SofaScore] Heatmap API returned status ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ [SofaScore] Error fetching player heatmap:`, error);
      return null;
    }
  }

  async getPlayerShots(playerId: number, eventId: number): Promise<Array<{x: number, y: number, type: string, minute: number}> | null> {
    try {
      const shotsUrl = `${this.baseUrl}/event/${eventId}/player/${playerId}/shots`;
      
      const response = await axios.get(shotsUrl, { 
        headers: this.headers, 
        timeout: 5000,
        validateStatus: (status) => status < 500
      });

      if (response.status === 200 && response.data) {
        return this.processShotsData(response.data);
      }
      
      return null;
    } catch (error) {
      console.error(`❌ [SofaScore] Error fetching shots data:`, error);
      return null;
    }
  }

  async getPlayerStats(playerId: number, eventId: number): Promise<SofaScorePlayerStats | null> {
    try {
      console.log(`🔍 [SofaScore] Fetching player stats for ${playerId} in event ${eventId}`);
      
      const statsUrl = `${this.baseUrl}/event/${eventId}/player/${playerId}/statistics`;
      const response = await axios.get(statsUrl, { 
        headers: this.headers, 
        timeout: 8000,
        validateStatus: (status) => status < 500
      });

      if (response.status === 200 && response.data) {
        const stats = response.data;
        const heatmapData = await this.getPlayerHeatmap(playerId, eventId);

        return {
          rating: stats.rating || stats.averageRating || 7.0,
          goals: stats.goals || 0,
          assists: stats.assists || 0,
          minutes: stats.minutesPlayed || 90,
          position: stats.position || stats.positionName || 'Unknown',
          heatmapData
        };
      }
      
      return null;
    } catch (error) {
      console.error(`❌ [SofaScore] Error fetching player stats:`, error);
      return null;
    }
  }

  private processHeatmapData(data: any): Array<{x: number, y: number, value: number}> {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(point => ({
      x: Math.max(0, Math.min(100, point.x || point.positionX || 0)),
      y: Math.max(0, Math.min(100, point.y || point.positionY || 0)),
      value: Math.max(0, Math.min(1, point.value || point.intensity || 0.5))
    }));
  }

  private processShotsData(data: any): Array<{x: number, y: number, type: string, minute: number}> {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(shot => ({
      x: Math.max(0, Math.min(100, shot.x || shot.positionX || 0)),
      y: Math.max(0, Math.min(100, shot.y || shot.positionY || 0)),
      type: this.mapShotType(shot.shotType || shot.type),
      minute: shot.minute || shot.time || 0
    }));
  }

  private mapShotType(type: string): 'goal' | 'on_target' | 'off_target' | 'blocked' {
    const normalizedType = (type || '').toLowerCase();
    
    if (normalizedType.includes('goal')) return 'goal';
    if (normalizedType.includes('on') || normalizedType.includes('target')) return 'on_target';
    if (normalizedType.includes('block')) return 'blocked';
    return 'off_target';
  }

  // Method to convert API-Sports event ID to SofaScore event ID
  async findEventBySimilarity(homeTeam: string, awayTeam: string, date: string): Promise<number | null> {
    try {
      // Format date for SofaScore API (YYYY-MM-DD)
      const searchDate = date.split('T')[0];
      const eventsUrl = `${this.baseUrl}/sport/football/events/date/${searchDate}`;
      
      const response = await axios.get(eventsUrl, { 
        headers: this.headers, 
        timeout: 5000 
      });

      if (response.data && response.data.events) {
        const matchingEvent = response.data.events.find((event: any) => {
          const homeTeamName = event.homeTeam?.name || '';
          const awayTeamName = event.awayTeam?.name || '';
          
          return (
            homeTeamName.toLowerCase().includes(homeTeam.toLowerCase().split(' ')[0]) &&
            awayTeamName.toLowerCase().includes(awayTeam.toLowerCase().split(' ')[0])
          ) || (
            homeTeamName.toLowerCase().includes(awayTeam.toLowerCase().split(' ')[0]) &&
            awayTeamName.toLowerCase().includes(homeTeam.toLowerCase().split(' ')[0])
          );
        });

        return matchingEvent?.id || null;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ [SofaScore] Error searching for event:`, error);
      return null;
    }
  }

  // Method to convert API-Sports player name to SofaScore player ID
  async findPlayerBySimilarity(playerName: string, teamName: string): Promise<number | null> {
    try {
      const searchUrl = `${this.baseUrl}/search/${encodeURIComponent(playerName)}`;
      const response = await axios.get(searchUrl, { 
        headers: this.headers, 
        timeout: 5000 
      });

      if (response.data && response.data.results) {
        const players = response.data.results.filter((result: any) => 
          result.entity?.type === 'player' && 
          result.entity?.team?.name?.toLowerCase().includes(teamName.toLowerCase())
        );

        return players?.[0]?.entity?.id || null;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ [SofaScore] Error searching for player:`, error);
      return null;
    }
  }
}

export const sofaScoreAPI = new SofaScoreAPI();
