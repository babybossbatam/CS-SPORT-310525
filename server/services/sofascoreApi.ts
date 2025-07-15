
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
  private baseUrl = 'https://sofascore.p.rapidapi.com';
  private headers = {
    'X-RapidAPI-Key': process.env.RAPID_API_KEY || '',
    'X-RapidAPI-Host': 'sofascore.p.rapidapi.com',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  async getPlayerHeatmap(playerId: number, eventId: number): Promise<SofaScoreHeatmapData | null> {
    try {
      console.log(`🔍 [SofaScore] Fetching heatmap for player ${playerId} in event ${eventId}`);
      
      // SofaScore RapidAPI heatmap endpoint
      const heatmapUrl = `${this.baseUrl}/matches/get-player-heatmap`;
      
      const response = await axios.get(heatmapUrl, { 
        params: {
          matchId: eventId,
          playerId: playerId
        },
        headers: this.headers, 
        timeout: 8000,
        validateStatus: (status) => status < 500 // Accept 4xx as valid responses
      });

      if (response.status === 200 && response.data) {
        const rawData = response.data;
        console.log(`✅ [SofaScore] Raw heatmap response:`, rawData);
        
        // Process real SofaScore heatmap data
        const heatmapPoints = this.processHeatmapData(rawData.heatmap || rawData);
        
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
      const shotsUrl = `${this.baseUrl}/matches/get-shots`;
      
      const response = await axios.get(shotsUrl, { 
        params: {
          matchId: eventId,
          playerId: playerId
        },
        headers: this.headers, 
        timeout: 5000,
        validateStatus: (status) => status < 500
      });

      if (response.status === 200 && response.data) {
        return this.processShotsData(response.data.shots || response.data);
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
      
      const statsUrl = `${this.baseUrl}/matches/get-player-statistics`;
      const response = await axios.get(statsUrl, { 
        params: {
          matchId: eventId,
          playerId: playerId
        },
        headers: this.headers, 
        timeout: 8000,
        validateStatus: (status) => status < 500
      });

      if (response.status === 200 && response.data) {
        const stats = response.data.statistics || response.data;
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

  // Method to convert API-Sports event ID to SofaScore event ID with improved matching
  async findEventBySimilarity(homeTeam: string, awayTeam: string, date: string): Promise<number | null> {
    try {
      // Format date for SofaScore API (YYYY-MM-DD)
      const searchDate = date.split('T')[0];
      console.log(`🔍 [SofaScore] Searching for match: ${homeTeam} vs ${awayTeam} on ${searchDate}`);
      
      // Try multiple date formats and nearby dates
      const datesToTry = [
        searchDate,
        new Date(new Date(searchDate).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Previous day
        new Date(new Date(searchDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]  // Next day
      ];

      for (const tryDate of datesToTry) {
        const eventsUrl = `${this.baseUrl}/sport/football/events/date/${tryDate}`;
        
        try {
          console.log(`🔍 [SofaScore] Trying URL: ${eventsUrl}`);
          const response = await axios.get(eventsUrl, { 
            headers: this.headers, 
            timeout: 8000,
            validateStatus: (status) => status < 500
          });

          console.log(`📡 [SofaScore] API Response Status: ${response.status}`);
          
          if (response.status === 200 && response.data) {
            console.log(`📊 [SofaScore] Response data structure:`, {
              hasEvents: !!response.data.events,
              eventsCount: response.data.events?.length || 0,
              dataKeys: Object.keys(response.data)
            });

            if (response.data.events && response.data.events.length > 0) {
              console.log(`🎯 [SofaScore] Sample event:`, {
                id: response.data.events[0].id,
                homeTeam: response.data.events[0].homeTeam?.name,
                awayTeam: response.data.events[0].awayTeam?.name,
                status: response.data.events[0].status
              });

              const matchingEvent = this.findBestMatchingEvent(response.data.events, homeTeam, awayTeam);
              
              if (matchingEvent) {
                console.log(`✅ [SofaScore] Found matching event ID: ${matchingEvent.id} for ${matchingEvent.homeTeam?.name} vs ${matchingEvent.awayTeam?.name}`);
                return matchingEvent.id;
              } else {
                console.log(`⚠️ [SofaScore] No matching teams found among ${response.data.events.length} events on ${tryDate}`);
              }
            }
          } else {
            console.log(`⚠️ [SofaScore] Invalid response for date ${tryDate}:`, {
              status: response.status,
              hasData: !!response.data
            });
          }
        } catch (dateError) {
          console.error(`❌ [SofaScore] Error for date ${tryDate}:`, dateError.message);
          continue;
        }
      }
      
      console.log(`❌ [SofaScore] No matching event found for ${homeTeam} vs ${awayTeam} after trying all dates`);
      return null;
    } catch (error) {
      console.error(`❌ [SofaScore] Error searching for event:`, error);
      return null;
    }
  }

  private findBestMatchingEvent(events: any[], homeTeam: string, awayTeam: string): any {
    // Normalize team names for better matching
    const normalizeTeam = (name: string) => {
      return name.toLowerCase()
        .replace(/fc\s*/g, '')
        .replace(/\s*(fc|cf|sc|ac|real|atletico)\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalizedHome = normalizeTeam(homeTeam);
    const normalizedAway = normalizeTeam(awayTeam);

    let bestMatch = null;
    let bestScore = 0;

    for (const event of events) {
      const eventHome = normalizeTeam(event.homeTeam?.name || '');
      const eventAway = normalizeTeam(event.awayTeam?.name || '');

      // Calculate similarity score
      let score = 0;
      
      // Direct matches
      if (eventHome.includes(normalizedHome.split(' ')[0]) && eventAway.includes(normalizedAway.split(' ')[0])) {
        score += 2;
      }
      
      // Reverse matches (in case teams are swapped)
      if (eventHome.includes(normalizedAway.split(' ')[0]) && eventAway.includes(normalizedHome.split(' ')[0])) {
        score += 2;
      }

      // Partial matches
      if (eventHome.includes(normalizedHome.split(' ')[0]) || eventAway.includes(normalizedAway.split(' ')[0])) {
        score += 1;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = event;
      }
    }

    return bestScore >= 2 ? bestMatch : null;
  }

  // Get match lineups to find player IDs
  async getMatchLineups(eventId: number): Promise<any> {
    try {
      const lineupsUrl = `${this.baseUrl}/matches/get-lineups`;
      const response = await axios.get(lineupsUrl, {
        params: { matchId: eventId },
        headers: this.headers,
        timeout: 8000,
        validateStatus: (status) => status < 500
      });

      if (response.status === 200 && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ [SofaScore] Error fetching lineups for match ${eventId}:`, error);
      return null;
    }
  }

  // Get match events that include shots
  async getMatchEvents(eventId: number): Promise<any> {
    try {
      const eventsUrl = `${this.baseUrl}/matches/get-events`;
      const response = await axios.get(eventsUrl, {
        params: { matchId: eventId },
        headers: this.headers,
        timeout: 8000,
        validateStatus: (status) => status < 500
      });

      if (response.status === 200 && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ [SofaScore] Error fetching events for match ${eventId}:`, error);
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

  // Method to get player name by ID
  async getPlayerName(playerId: number): Promise<string | null> {
    try {
      console.log(`🔍 [SofaScore] Fetching player name for ID: ${playerId}`);
      
      const playerUrl = `${this.baseUrl}/players/get-info`;
      const response = await axios.get(playerUrl, { 
        params: {
          playerId: playerId
        },
        headers: this.headers, 
        timeout: 5000,
        validateStatus: (status) => status < 500
      });

      if (response.status === 200 && response.data) {
        const playerName = response.data.player?.name || response.data.name;
        console.log(`✅ [SofaScore] Found player name: ${playerName} for ID ${playerId}`);
        return playerName;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ [SofaScore] Error fetching player name for ID ${playerId}:`, error);
      return null;
    }
  }
}

export const sofaScoreAPI = new SofaScoreAPI();
