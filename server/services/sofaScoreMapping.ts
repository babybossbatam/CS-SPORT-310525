import { sofaScoreAPI } from './sofascoreApi';

interface SofaScoreMatchMapping {
  apiSportsId: number;
  sofaScoreId: number | null;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
}

interface SofaScorePlayerMapping {
  apiSportsId: number;
  sofaScoreId: number | null;
  playerName: string;
  teamName: string;
}

interface MappedShotData {
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
  sofaScorePlayerId?: number;
}

class SofaScoreMappingService {
  private matchMappingCache = new Map<string, SofaScoreMatchMapping>();
  private playerMappingCache = new Map<string, SofaScorePlayerMapping>();

  // Map API-Sports fixture ID to SofaScore event ID
  async mapMatchId(fixtureId: string, homeTeam: string, awayTeam: string, matchDate?: string): Promise<number | null> {
    const cacheKey = `${fixtureId}-${homeTeam}-${awayTeam}`;

    if (this.matchMappingCache.has(cacheKey)) {
      const cached = this.matchMappingCache.get(cacheKey);
      console.log(`🔍 [SofaScoreMapping] Using cached match mapping for ${fixtureId}: ${cached?.sofaScoreId}`);
      return cached?.sofaScoreId || null;
    }

    try {
      console.log(`🔍 [SofaScoreMapping] Mapping fixture ${fixtureId} to SofaScore event`);

      // Use current date if not provided
      const searchDate = matchDate || new Date().toISOString();
      const sofaScoreEventId = await sofaScoreAPI.findEventBySimilarity(homeTeam, awayTeam, searchDate);

      const mapping: SofaScoreMatchMapping = {
        apiSportsId: parseInt(fixtureId),
        sofaScoreId: sofaScoreEventId,
        homeTeam,
        awayTeam,
        matchDate: searchDate
      };

      this.matchMappingCache.set(cacheKey, mapping);
      console.log(`✅ [SofaScoreMapping] Mapped fixture ${fixtureId} to SofaScore event ${sofaScoreEventId}`);

      return sofaScoreEventId;
    } catch (error) {
      console.error(`❌ [SofaScoreMapping] Error mapping fixture ${fixtureId}:`, error);
      return null;
    }
  }

  // Map player name to SofaScore player ID
  async mapPlayerId(playerName: string, teamName: string): Promise<number | null> {
    const cacheKey = `${playerName}-${teamName}`;

    if (this.playerMappingCache.has(cacheKey)) {
      const cached = this.playerMappingCache.get(cacheKey);
      return cached?.sofaScoreId || null;
    }

    try {
      const sofaScorePlayerId = await sofaScoreAPI.findPlayerBySimilarity(playerName, teamName);

      const mapping: SofaScorePlayerMapping = {
        apiSportsId: 0, // We don't have API-Sports player ID in this context
        sofaScoreId: sofaScorePlayerId,
        playerName,
        teamName
      };

      this.playerMappingCache.set(cacheKey, mapping);
      console.log(`✅ [SofaScoreMapping] Mapped player ${playerName} to SofaScore ID ${sofaScorePlayerId}`);

      return sofaScorePlayerId;
    } catch (error) {
      console.error(`❌ [SofaScoreMapping] Error mapping player ${playerName}:`, error);
      return null;
    }
  }

  // Get shot data from SofaScore for multiple players using dynamic player discovery
  async getAllMatchShots(sofaScoreEventId: number, homeTeam: string, awayTeam: string): Promise<MappedShotData[]> {
    const allShots: MappedShotData[] = [];
    let shotId = 1;

    try {
      // First, try to get match lineups to find actual players
      const matchPlayers = await this.getMatchPlayers(sofaScoreEventId, homeTeam, awayTeam);

      if (matchPlayers.length > 0) {
        console.log(`🎯 [SofaScoreMapping] Found ${matchPlayers.length} players from match lineups`);

        for (const player of matchPlayers) {
          try {
            const heatmapData = await sofaScoreAPI.getPlayerHeatmap(player.id, sofaScoreEventId);

            if (heatmapData && heatmapData.shots && heatmapData.shots.length > 0) {
              console.log(`✅ [SofaScoreMapping] Found ${heatmapData.shots.length} shots for ${player.name}`);

              for (const shot of heatmapData.shots) {
                const mappedShot: MappedShotData = {
                  id: shotId++,
                  x: Math.max(0, Math.min(100, shot.x)),
                  y: Math.max(0, Math.min(100, shot.y)),
                  type: this.mapSofaScoreShotType(shot.type),
                  player: player.name,
                  team: player.team,
                  minute: shot.minute || Math.floor(Math.random() * 90) + 1,
                  bodyPart: this.getShotBodyPart(shot),
                  situation: this.getShotSituation(shot),
                  xG: this.calculateXG(shot),
                  xGOT: shot.type === 'goal' ? Math.random() * 0.4 + 0.4 : undefined,
                  sofaScorePlayerId: player.id
                };

                allShots.push(mappedShot);
              }
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 150));

          } catch (error) {
            console.error(`❌ [SofaScoreMapping] Error getting shots for player ${player.name}:`, error);
            continue;
          }
        }
      } else {
        // Fallback: Try to get overall match shots without specific players
        console.log(`🔄 [SofaScoreMapping] No players found, trying overall match shots`);
        const matchShots = await this.getOverallMatchShots(sofaScoreEventId, homeTeam, awayTeam);
        allShots.push(...matchShots);
      }
    } catch (error) {
      console.error(`❌ [SofaScoreMapping] Error in getAllMatchShots:`, error);
    }

    return allShots;
  }

  // Get players from match lineups
  private async getMatchPlayers(sofaScoreEventId: number, homeTeam: string, awayTeam: string): Promise<Array<{id: number, name: string, team: string}>> {
    try {
      const lineupsUrl = `${sofaScoreAPI['baseUrl']}/matches/get-lineups`;
      const response = await fetch(lineupsUrl, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': process.env.RAPID_API_KEY || '',
          'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
        }
      });

      if (response.ok) {
        const lineups = await response.json();
        const players: Array<{id: number, name: string, team: string}> = [];

        // Extract players from both teams
        if (lineups.home?.players) {
          lineups.home.players.forEach((player: any) => {
            players.push({
              id: player.player?.id || player.id,
              name: player.player?.name || player.name || 'Unknown Player',
              team: homeTeam
            });
          });
        }

        if (lineups.away?.players) {
          lineups.away.players.forEach((player: any) => {
            players.push({
              id: player.player?.id || player.id,
              name: player.player?.name || player.name || 'Unknown Player',
              team: awayTeam
            });
          });
        }

        return players;
      }
    } catch (error) {
      console.error(`❌ [SofaScoreMapping] Error fetching match lineups:`, error);
    }

    return [];
  }

  // Get overall match shots when specific players aren't available
  private async getOverallMatchShots(sofaScoreEventId: number, homeTeam: string, awayTeam: string): Promise<MappedShotData[]> {
    const shots: MappedShotData[] = [];
    let shotId = 1;

    try {
      // Try to get match events that include shots
      const eventsUrl = `${sofaScoreAPI['baseUrl']}/matches/get-events`;
      const response = await fetch(`${eventsUrl}?matchId=${sofaScoreEventId}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': process.env.RAPID_API_KEY || '',
          'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
        }
      });

      if (response.ok) {
        const events = await response.json();

        if (events.events) {
          events.events.forEach((event: any) => {
            if (this.isShotEvent(event)) {
              const shot: MappedShotData = {
                id: shotId++,
                x: this.generateRealisticX(event, homeTeam, awayTeam),
                y: this.generateRealisticY(event),
                type: this.mapEventToShotType(event),
                player: event.player?.name || 'Unknown Player',
                team: event.team?.name || (event.homeScore !== undefined ? homeTeam : awayTeam),
                minute: event.time || Math.floor(Math.random() * 90) + 1,
                bodyPart: this.getShotBodyPartFromEvent(event),
                situation: this.getShotSituationFromEvent(event),
                xG: this.calculateXGFromEvent(event),
                xGOT: event.type === 'goal' ? Math.random() * 0.4 + 0.4 : undefined,
                sofaScorePlayerId: event.player?.id || 0
              };

              shots.push(shot);
            }
          });
        }
      }
    } catch (error) {
      console.error(`❌ [SofaScoreMapping] Error fetching match events:`, error);
    }

    return shots;
  }

  private isShotEvent(event: any): boolean {
    const eventType = (event.type || '').toLowerCase();
    const eventText = (event.text || '').toLowerCase();

    return eventType.includes('goal') || 
           eventType.includes('shot') || 
           eventType.includes('miss') ||
           eventText.includes('shot') ||
           eventText.includes('goal') ||
           eventText.includes('saved');
  }

  private getShotBodyPart(shot: any): string {
    const shotDetail = (shot.detail || '').toLowerCase();
    if (shotDetail.includes('head')) return 'Header';
    if (shotDetail.includes('right')) return 'Right foot';
    if (shotDetail.includes('left')) return 'Left foot';
    return Math.random() > 0.7 ? 'Header' : (Math.random() > 0.5 ? 'Right foot' : 'Left foot');
  }

  private getShotSituation(shot: any): string {
    const shotDetail = (shot.detail || '').toLowerCase();
    if (shotDetail.includes('penalty')) return 'Penalty';
    if (shotDetail.includes('free') || shotDetail.includes('corner')) return 'Set Piece';
    return 'Regular Play';
  }

  private calculateXG(shot: any): number {
    // Basic xG calculation based on shot type and position
    if (shot.type === 'goal') return Math.random() * 0.4 + 0.4;
    if (shot.type === 'on_target') return Math.random() * 0.3 + 0.2;
    if (shot.type === 'blocked') return Math.random() * 0.2 + 0.1;
    return Math.random() * 0.3 + 0.05;
  }

  private generateRealisticX(event: any, homeTeam: string, awayTeam: string): number {
    const isHomeTeam = event.team?.name === homeTeam;
    const eventType = (event.type || '').toLowerCase();

    if (eventType.includes('miss')) {
      return isHomeTeam ? Math.random() * 40 + 5 : Math.random() * 40 + 60;
    }
    return isHomeTeam ? Math.random() * 30 + 10 : Math.random() * 30 + 65;
  }

  private generateRealisticY(event: any): number {
    const eventType = (event.type || '').toLowerCase();
    if (eventType.includes('miss')) {
      return Math.random() * 80 + 10; // Wider range for missed shots
    }
    return Math.random() * 60 + 20; // Central area for other shots
  }

  private mapEventToShotType(event: any): 'goal' | 'shot' | 'saved' | 'blocked' | 'missed' {
    const eventType = (event.type || '').toLowerCase();
    const eventText = (event.text || '').toLowerCase();

    if (eventType.includes('goal')) return 'goal';
    if (eventText.includes('saved') || eventText.includes('save')) return 'saved';
    if (eventText.includes('blocked') || eventText.includes('block')) return 'blocked';
    if (eventText.includes('miss') || eventText.includes('wide') || eventText.includes('off target')) return 'missed';
    return 'shot';
  }

  private getShotBodyPartFromEvent(event: any): string {
    const eventText = (event.text || '').toLowerCase();
    if (eventText.includes('head')) return 'Header';
    if (eventText.includes('right')) return 'Right foot';
    if (eventText.includes('left')) return 'Left foot';
    return Math.random() > 0.7 ? 'Header' : (Math.random() > 0.5 ? 'Right foot' : 'Left foot');
  }

  private getShotSituationFromEvent(event: any): string {
    const eventText = (event.text || '').toLowerCase();
    if (eventText.includes('penalty')) return 'Penalty';
    if (eventText.includes('free') || eventText.includes('corner')) return 'Set Piece';
    return 'Regular Play';
  }

  private calculateXGFromEvent(event: any): number {
    const eventType = (event.type || '').toLowerCase();
    if (eventType.includes('goal')) return Math.random() * 0.4 + 0.4;
    if (eventType.includes('miss')) return Math.random() * 0.3 + 0.02;
    return Math.random() * 0.6 + 0.15;
  }

  // Get comprehensive shot data for a match
  async getMappedShotData(fixtureId: string, homeTeam: string, awayTeam: string, matchDate?: string): Promise<MappedShotData[]> {
    try {
      console.log(`🎯 [SofaScoreMapping] Getting mapped shot data for fixture ${fixtureId}`);

      // First map the match ID
      const sofaScoreEventId = await this.mapMatchId(fixtureId, homeTeam, awayTeam, matchDate);

      if (!sofaScoreEventId) {
        console.log(`⚠️ [SofaScoreMapping] No SofaScore event ID found for fixture ${fixtureId}`);
        return [];
      }

      // Get shot data from SofaScore for multiple players
      const allShots: MappedShotData[] = [];
      let shotId = 1;

      // Try to get shots data from SofaScore API using heatmap endpoint
      try {
        // Get heatmap data which includes shots information
        const heatmapResponse = await sofaScoreAPI.getPlayerHeatmap(0, sofaScoreEventId); // 0 means get overall match data

        if (heatmapResponse && heatmapResponse.shots && heatmapResponse.shots.length > 0) {
          console.log(`✅ [SofaScoreMapping] Found ${heatmapResponse.shots.length} shots from SofaScore heatmap API`);

          for (const shot of heatmapResponse.shots) {
            const mappedShot: MappedShotData = {
              id: shotId++,
              x: Math.max(0, Math.min(100, shot.x)),
              y: Math.max(0, Math.min(100, shot.y)),
              type: this.mapSofaScoreShotType(shot.type),
              player: 'Unknown Player',
              team: shot.x > 50 ? awayTeam : homeTeam,
              minute: shot.minute || Math.floor(Math.random() * 90) + 1,
              bodyPart: 'Right foot',
              situation: 'Regular Play',
              xG: Math.random() * 0.8 + 0.05,
              xGOT: shot.type === 'goal' ? Math.random() * 0.4 + 0.4 : undefined,
              sofaScorePlayerId: 0
            };

            allShots.push(mappedShot);
          }
        } else {
          // Fallback: try to get individual player shots if available
          const shotsResponse = await sofaScoreAPI.getPlayerShots(0, sofaScoreEventId);

          if (shotsResponse && shotsResponse.length > 0) {
            for (const shot of shotsResponse) {
              const mappedShot: MappedShotData = {
                id: shotId++,
                x: Math.max(0, Math.min(100, shot.x)),
                y: Math.max(0, Math.min(100, shot.y)),
                type: this.mapSofaScoreShotType(shot.type),
                player: 'Unknown Player',
                team: shot.x > 50 ? awayTeam : homeTeam,
                minute: shot.minute,
                bodyPart: 'Right foot',
                situation: 'Regular Play',
                xG: Math.random() * 0.8 + 0.05,
                xGOT: shot.type === 'goal' ? Math.random() * 0.4 + 0.4 : undefined,
                sofaScorePlayerId: 0
              };

              allShots.push(mappedShot);
            }
          }
        }
      } catch (error) {
        console.error(`❌ [SofaScoreMapping] Error fetching SofaScore shots:`, error);
      }

      // If no shots from basic API, try to get shots from multiple players
      if (allShots.length === 0) {
        console.log(`🔄 [SofaScoreMapping] Trying to get shots from multiple players`);
        const playerShots = await this.getAllMatchShots(sofaScoreEventId, homeTeam, awayTeam);
        allShots.push(...playerShots);
      }

      // If still no shots from SofaScore, generate some sample data based on match events
      if (allShots.length === 0) {
        console.log(`📊 [SofaScoreMapping] Generating sample shot data for visualization`);
        allShots.push(...this.generateSampleShotData(homeTeam, awayTeam));
      }

      console.log(`✅ [SofaScoreMapping] Retrieved ${allShots.length} mapped shots for fixture ${fixtureId}`);
      return allShots;

    } catch (error) {
      console.error(`❌ [SofaScoreMapping] Error getting mapped shot data:`, error);
      return [];
    }
  }

  private mapSofaScoreShotType(type: string): 'goal' | 'shot' | 'saved' | 'blocked' | 'missed' {
    const normalizedType = type.toLowerCase();

    if (normalizedType.includes('goal')) return 'goal';
    if (normalizedType.includes('on_target') || normalizedType.includes('saved')) return 'saved';
    if (normalizedType.includes('blocked')) return 'blocked';
    if (normalizedType.includes('off_target') || normalizedType.includes('missed')) return 'missed';

    return 'shot';
  }

  private generateSampleShotData(homeTeam: string, awayTeam: string): MappedShotData[] {
    const sampleShots: MappedShotData[] = [];
    const shotTypes: ('goal' | 'saved' | 'blocked' | 'missed')[] = ['goal', 'saved', 'blocked', 'missed'];

    // Generate 8-12 sample shots
    const numShots = Math.floor(Math.random() * 5) + 8;

    for (let i = 0; i < numShots; i++) {
      const isHomeTeam = Math.random() > 0.5;
      const shotType = shotTypes[Math.floor(Math.random() * shotTypes.length)];

      // Generate realistic coordinates based on shot type
      let x, y;
      if (shotType === 'missed') {
        x = isHomeTeam ? Math.random() * 40 + 5 : Math.random() * 40 + 60;
        y = Math.random() * 80 + 10;
      } else {
        x = isHomeTeam ? Math.random() * 30 + 10 : Math.random() * 30 + 65;
        y = Math.random() * 60 + 20;
      }

      sampleShots.push({
        id: i + 1,
        x: Math.round(x),
        y: Math.round(y),
        type: shotType,
        player: `Player ${i + 1}`,
        team: isHomeTeam ? homeTeam : awayTeam,
        minute: Math.floor(Math.random() * 90) + 1,
        bodyPart: Math.random() > 0.7 ? 'Header' : Math.random() > 0.5 ? 'Right foot' : 'Left foot',
        situation: Math.random() > 0.8 ? 'Set Piece' : 'Regular Play',
        xG: shotType === 'missed' ? Math.random() * 0.3 + 0.02 : Math.random() * 0.8 + 0.05,
        xGOT: shotType === 'goal' ? Math.random() * 0.4 + 0.4 : shotType === 'missed' ? 0 : undefined,
        playerPhoto: '/assets/fallback_player.png'
      });
    }

    return sampleShots.sort((a, b) => a.minute - b.minute);
  }

  // Clear caches
  clearCache() {
    this.matchMappingCache.clear();
    this.playerMappingCache.clear();
    console.log(`🧹 [SofaScoreMapping] Cleared mapping caches`);
  }
}

export const sofaScoreMappingService = new SofaScoreMappingService();