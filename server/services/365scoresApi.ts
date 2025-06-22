
import axios from 'axios';

interface Scores365Config {
  baseUrl: string;
  defaultParams: {
    appTypeId: number;
    langId: number;
    timezoneName: string;
    sports: number;
  };
}

class Scores365API {
  private config: Scores365Config;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 30000; // 30 seconds

  constructor() {
    this.config = {
      baseUrl: 'https://webws.365scores.com/web',
      defaultParams: {
        appTypeId: 5,
        langId: 1,
        timezoneName: 'Asia/Manila',
        sports: 1
      }
    };
  }

  private getCacheKey(endpoint: string, params: any): string {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  private async makeRequest(endpoint: string, params: any = {}) {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = this.cache.get(cacheKey);

    if (cached && this.isValidCache(cached.timestamp)) {
      console.log(`🔄 [365scores] Using cached data for ${endpoint}`);
      return cached.data;
    }

    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      const requestParams = { ...this.config.defaultParams, ...params };

      console.log(`🔄 [365scores] Fetching from: ${url}`, requestParams);

      const response = await axios.get(url, {
        params: requestParams,
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.365scores.com/',
          'Origin': 'https://www.365scores.com'
        }
      });

      const data = response.data;
      this.cache.set(cacheKey, { data, timestamp: Date.now() });

      console.log(`✅ [365scores] Successfully fetched ${endpoint}`);
      return data;

    } catch (error) {
      console.error(`❌ [365scores] Error fetching ${endpoint}:`, error.message);
      throw error;
    }
  }

  async getLiveMatches(date: string) {
    try {
      const params = {
        startDate: date,
        endDate: date,
        showOdds: true,
        onlyLiveGames: true,
        withTop: true
      };

      const data = await this.makeRequest('/games/allscores/', params);
      
      console.log(`📊 [365scores] Found ${data.games?.length || 0} live matches`);
      return data;

    } catch (error) {
      console.error('❌ [365scores] Error fetching live matches:', error);
      return { games: [] };
    }
  }

  async getMatchById(matchId: string, date: string) {
    try {
      const liveData = await this.getLiveMatches(date);
      const match = liveData.games?.find((game: any) => 
        game.id.toString() === matchId.toString()
      );

      if (match) {
        console.log(`🎯 [365scores] Found match ${matchId}`);
        return match;
      }

      console.log(`❌ [365scores] Match ${matchId} not found in live games`);
      return null;

    } catch (error) {
      console.error(`❌ [365scores] Error fetching match ${matchId}:`, error);
      return null;
    }
  }

  async getMatchEvents(gameId: string) {
    try {
      const data = await this.makeRequest(`/game/${gameId}/events/`, {});
      
      console.log(`📊 [365scores] Found ${data.events?.length || 0} events for game ${gameId}`);
      return data;

    } catch (error) {
      console.error(`❌ [365scores] Error fetching events for game ${gameId}:`, error);
      return { events: [] };
    }
  }

  async getMatchLineups(gameId: string) {
    try {
      const data = await this.makeRequest(`/game/${gameId}/lineups/`, {});
      
      console.log(`📊 [365scores] Found lineups for game ${gameId}`);
      return data;

    } catch (error) {
      console.error(`❌ [365scores] Error fetching lineups for game ${gameId}:`, error);
      return { lineups: { home: { players: [] }, away: { players: [] } } };
    }
  }

  async getMatchDetails(gameId: string) {
    try {
      const data = await this.makeRequest(`/game/${gameId}/`, {});
      
      console.log(`📊 [365scores] Found details for game ${gameId}`);
      return data;

    } catch (error) {
      console.error(`❌ [365scores] Error fetching details for game ${gameId}:`, error);
      return null;
    }
  }
}

export const scores365API = new Scores365API();
interface LiveMatch {
  id: string;
  homeCompetitor: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  awayCompetitor: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  homeScore: number;
  awayScore: number;
  statusText: string;
  gameTime: number;
  startTime: string;
  competitionDisplayName: string;
  events?: LiveEvent[];
}

interface LiveEvent {
  id: string;
  eventType: string;
  minute: number;
  playerName?: string;
  team: 'home' | 'away';
  description?: string;
  position?: {
    x: number;
    y: number;
  };
}

class Scores365ApiService {
  private baseUrl = 'https://webws.365scores.com/web';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 10000; // 10 seconds for live data

  /**
   * Fetch live matches for today
   */
  async getLiveMatches(date?: string): Promise<LiveMatch[]> {
    const targetDate = date || new Date().toLocaleDateString('en-GB').split('/').reverse().join('/');
    const cacheKey = `live-matches-${targetDate}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const url = `${this.baseUrl}/games/allscores/?appTypeId=5&langId=1&timezoneName=Asia/Manila&sports=1&startDate=${targetDate}&endDate=${targetDate}&showOdds=true&onlyLiveGames=true&withTop=true`;
      
      console.log(`🎯 [365scores] Fetching live matches: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.365scores.com/',
        }
      });

      if (!response.ok) {
        throw new Error(`365scores API responded with status ${response.status}`);
      }

      const data = await response.json();
      const liveMatches = this.parseLiveMatches(data);
      
      this.cache.set(cacheKey, {
        data: liveMatches,
        timestamp: Date.now()
      });

      console.log(`✅ [365scores] Retrieved ${liveMatches.length} live matches`);
      return liveMatches;

    } catch (error) {
      console.error('❌ [365scores] Error fetching live matches:', error);
      
      // Return cached data if available
      if (cached?.data) {
        console.log('📦 [365scores] Using cached data due to API error');
        return cached.data;
      }
      
      return [];
    }
  }

  /**
   * Fetch events for a specific match
   */
  async getMatchEvents(gameId: string): Promise<LiveEvent[]> {
    const cacheKey = `match-events-${gameId}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const url = `${this.baseUrl}/games/${gameId}/events`;
      
      console.log(`📊 [365scores] Fetching events for match ${gameId}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.365scores.com/',
        }
      });

      if (!response.ok) {
        throw new Error(`365scores Events API responded with status ${response.status}`);
      }

      const data = await response.json();
      const events = this.parseMatchEvents(data);
      
      this.cache.set(cacheKey, {
        data: events,
        timestamp: Date.now()
      });

      console.log(`✅ [365scores] Retrieved ${events.length} events for match ${gameId}`);
      return events;

    } catch (error) {
      console.error(`❌ [365scores] Error fetching events for match ${gameId}:`, error);
      
      // Return cached data if available
      if (cached?.data) {
        console.log('📦 [365scores] Using cached events due to API error');
        return cached.data;
      }
      
      return [];
    }
  }

  /**
   * Parse live matches from 365scores response
   */
  private parseLiveMatches(data: any): LiveMatch[] {
    try {
      if (!data?.games) {
        return [];
      }

      const matches: LiveMatch[] = [];

      for (const game of data.games) {
        // Only include live matches
        if (!this.isLiveMatch(game)) {
          continue;
        }

        const match: LiveMatch = {
          id: game.id?.toString() || '',
          homeCompetitor: {
            id: game.homeCompetitor?.id?.toString() || '',
            name: game.homeCompetitor?.name || 'Home Team',
            imageUrl: game.homeCompetitor?.imageUrl
          },
          awayCompetitor: {
            id: game.awayCompetitor?.id?.toString() || '',
            name: game.awayCompetitor?.name || 'Away Team',
            imageUrl: game.awayCompetitor?.imageUrl
          },
          homeScore: game.homeScore || 0,
          awayScore: game.awayScore || 0,
          statusText: game.statusText || 'Live',
          gameTime: game.gameTime || 0,
          startTime: game.startTime || new Date().toISOString(),
          competitionDisplayName: game.competitionDisplayName || 'Unknown League'
        };

        matches.push(match);
      }

      return matches;
    } catch (error) {
      console.error('❌ [365scores] Error parsing live matches:', error);
      return [];
    }
  }

  /**
   * Parse match events from 365scores response
   */
  private parseMatchEvents(data: any): LiveEvent[] {
    try {
      if (!data?.events) {
        return [];
      }

      const events: LiveEvent[] = [];

      for (const event of data.events) {
        const parsedEvent: LiveEvent = {
          id: event.id?.toString() || `event_${Date.now()}`,
          eventType: this.mapEventType(event.type || event.eventType),
          minute: event.minute || event.time || 0,
          playerName: event.playerName || event.player?.name,
          team: this.determineTeam(event),
          description: event.description || this.generateEventDescription(event),
          position: event.position ? {
            x: event.position.x || 50,
            y: event.position.y || 50
          } : undefined
        };

        events.push(parsedEvent);
      }

      return events.sort((a, b) => b.minute - a.minute); // Most recent first
    } catch (error) {
      console.error('❌ [365scores] Error parsing match events:', error);
      return [];
    }
  }

  /**
   * Check if a match is currently live
   */
  private isLiveMatch(game: any): boolean {
    const liveStatuses = ['1H', '2H', 'HT', 'LIVE', 'Live', 'First Half', 'Second Half', 'Half Time'];
    return liveStatuses.some(status => 
      game.statusText?.includes(status) || game.status?.includes(status)
    );
  }

  /**
   * Map 365scores event types to our standard types
   */
  private mapEventType(eventType: string): string {
    const typeMap: { [key: string]: string } = {
      'goal': 'goal',
      'yellowCard': 'yellowCard',
      'redCard': 'redCard',
      'substitution': 'substitution',
      'corner': 'corner',
      'shot': 'shot',
      'save': 'save',
      'foul': 'foul',
      'offside': 'offside'
    };

    return typeMap[eventType] || eventType;
  }

  /**
   * Determine which team the event belongs to
   */
  private determineTeam(event: any): 'home' | 'away' {
    if (event.team === 'home' || event.team === 1) return 'home';
    if (event.team === 'away' || event.team === 2) return 'away';
    
    // Try to determine from other fields
    if (event.isHome) return 'home';
    if (event.isAway) return 'away';
    
    return 'home'; // Default fallback
  }

  /**
   * Generate event description if not provided
   */
  private generateEventDescription(event: any): string {
    const eventType = this.mapEventType(event.type || event.eventType);
    const playerName = event.playerName || event.player?.name || 'Player';
    
    switch (eventType) {
      case 'goal':
        return `⚽ GOAL! ${playerName}`;
      case 'yellowCard':
        return `🟨 Yellow Card ${playerName}`;
      case 'redCard':
        return `🟥 Red Card ${playerName}`;
      case 'substitution':
        return `🔄 Substitution ${playerName}`;
      case 'corner':
        return `📐 Corner kick`;
      case 'shot':
        return `🎯 Shot by ${playerName}`;
      case 'save':
        return `🥅 Save by ${playerName}`;
      default:
        return `${eventType} - ${playerName}`;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 [365scores] Cache cleared');
  }
}

export const scores365ApiService = new Scores365ApiService();
