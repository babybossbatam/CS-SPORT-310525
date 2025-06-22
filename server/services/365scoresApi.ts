
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
