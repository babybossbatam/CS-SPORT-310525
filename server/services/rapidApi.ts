import axios from 'axios';
import { FixtureResponse, LeagueResponse, PlayerStatistics } from '../types';

// Define standings type
interface LeagueStandings {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    standings: any[][];
  };
}

// Initialize API client
const apiKey = process.env.RAPID_API_KEY || '';
console.log(`Using RapidAPI Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'NOT SET'}`);

const apiClient = axios.create({
  baseURL: 'https://api-football-v1.p.rapidapi.com/v3',
  headers: {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
  }
});

// Cache and debounce control
const LIVE_DATA_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STATIC_DATA_CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const DEBOUNCE_DELAY = 2000; // 2 seconds

// Improved cache implementation with TTL
class Cache<T> {
  private store = new Map<string, { data: T; timestamp: number }>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  
  constructor(private ttl: number) {}

  get(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;
    
    const now = Date.now();
    if (now - item.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }
    
    return item.data;
  }

  async getOrSet(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached) return cached;

    // Debounce the fetch
    if (this.debounceTimers.has(key)) {
      const existing = this.get(key);
      if (existing) return existing;
    }

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        const data = await fetchFn();
        this.set(key, data);
        resolve(data);
        this.debounceTimers.delete(key);
      }, DEBOUNCE_DELAY);
      
      this.debounceTimers.set(key, timer);
    });
  }

  set(key: string, data: T): void {
    this.store.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.store.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

// Cache instances
const fixturesCache = new Cache<any>(LIVE_DATA_CACHE_DURATION);
const leaguesCache = new Cache<any>(STATIC_DATA_CACHE_DURATION);
const playersCache = new Cache<any>(STATIC_DATA_CACHE_DURATION);

// Mock data for popular leagues and teams
const popularLeagues: { [leagueId: number]: string[] } = {
  2: ['Real Madrid', 'Manchester City', 'Bayern Munich', 'PSG', 'Inter'], // Champions League
  3: ['Liverpool', 'Atalanta', 'Marseille', 'Roma', 'Leverkusen'], // Europa League
  39: ['Arsenal', 'Chelsea', 'Liverpool', 'Man United', 'Man City', 'Tottenham'], // Premier League
  140: ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Athletic Bilbao', 'Sevilla'], // La Liga
  135: ['Inter', 'Milan', 'Juventus', 'Roma', 'Napoli'], // Serie A
  78: ['Bayern Munich', 'Dortmund', 'Leipzig', 'Leverkusen', 'Frankfurt'], // Bundesliga
};

export const rapidApiService = {
  /**
   * Get fixtures by date
   */
  async getFixturesByDate(date: string): Promise<FixtureResponse[]> {
    const cacheKey = `fixtures-date-${date}`;
    const cached = fixturesCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < LIVE_DATA_CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await apiClient.get('/fixtures', {
        params: { date }
      });

      if (response.data && response.data.response) {
        fixturesCache.set(cacheKey, { 
          data: response.data.response, 
          timestamp: now 
        });
        return response.data.response;
      }

      return [];
    } catch (error) {
      console.error('Error fetching fixtures by date:', error);
      if (cached?.data) {
        console.log('Using cached data due to API error');
        return cached.data;
      }
      if (error instanceof Error) {
        throw new Error(`Failed to fetch fixtures: ${error.message}`);
      }
      throw new Error('Failed to fetch fixtures: Unknown error');
    }
  },

  /**
   * Get live fixtures
   */
  async getLiveFixtures(): Promise<FixtureResponse[]> {
    const cacheKey = 'fixtures-live';
    const cached = fixturesCache.get(cacheKey);

    const now = Date.now();
    // Short cache time for live fixtures (30 seconds)
    if (cached && now - cached.timestamp < 30 * 1000) {
      return cached.data;
    }

    try {
      const response = await apiClient.get('/fixtures', {
        params: { live: 'all' }
      });

      if (response.data && response.data.response) {
        fixturesCache.set(cacheKey, { 
          data: response.data.response, 
          timestamp: now 
        });
        return response.data.response;
      }

      return [];
    } catch (error) {
      console.error('Error fetching live fixtures:', error);
      if (cached?.data) {
        console.log('Using cached data due to API error');
        return cached.data;
      }
      console.error('API request failed and no cache available');
      return [];
    }
  },

  /**
   * Get fixture by ID
   */
  async getFixtureById(id: number): Promise<FixtureResponse | null> {
    const cacheKey = `fixture-${id}`;
    const cached = fixturesCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < LIVE_DATA_CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await apiClient.get('/fixtures', {
        params: { id }
      });

      if (response.data && response.data.response && response.data.response.length > 0) {
        const fixtureData = response.data.response[0];
        fixturesCache.set(cacheKey, { 
          data: fixtureData, 
          timestamp: now 
        });
        return fixtureData;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching fixture with ID ${id}:`, error);
      if (cached?.data) {
        console.log('Using cached data due to API error');
        return cached.data;
      }
      console.error('API request failed and no cache available');
      return null;
    }
  },

  /**
   * Get fixtures by league ID and season
   */
  async getFixturesByLeague(leagueId: number, season: number): Promise<FixtureResponse[]> {
    const cacheKey = `fixtures-league-${leagueId}-${season}`;
    const cached = fixturesCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < STATIC_DATA_CACHE_DURATION) {
      return cached.data;
    }

    try {
      console.log(`Fetching fixtures for league ${leagueId}, season ${season}`);

      // First let's check if the league exists and get the current season
      const leagueInfo = await this.getLeagueById(leagueId);
      if (!leagueInfo) {
        console.log(`League with ID ${leagueId} not found`);
        return [];
      }

      // Find the current season
      const currentSeason = leagueInfo.seasons.find(s => s.current) || leagueInfo.seasons[0];
      if (!currentSeason) {
        console.log(`No season data found for league ${leagueId}`);
        return [];
      }

      // Use the correct season from the league info
      const correctSeason = currentSeason.year;
      console.log(`Using correct season ${correctSeason} for league ${leagueId} (${leagueInfo.league.name})`);

      const response = await apiClient.get('/fixtures', {
        params: { league: leagueId, season: correctSeason }
      });

      console.log(`Fixtures API response status: ${response.status}, results count: ${response.data?.results || 0}`);

      if (response.data && response.data.response) {
        // Include all fixtures from the requested league
        const filteredFixtures = response.data.response;

        // Log the fixtures count
        console.log(`Received ${response.data.response.length} fixtures for league ${leagueId}`);

        fixturesCache.set(cacheKey, { 
          data: filteredFixtures, 
          timestamp: now 
        });
        return filteredFixtures;
      }

      return [];
    } catch (error) {
      console.error(`Error fetching fixtures for league ${leagueId}:`, error);
      if (cached?.data) {
        console.log('Using cached data due to API error');
        return cached.data;
      }
      console.error('API request failed and no cache available');
      return [];
    }
  },

  /**
   * Get all available leagues
   */
  async getLeagues(): Promise<LeagueResponse[]> {
    const cacheKey = 'leagues-all';
    const cached = leaguesCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < STATIC_DATA_CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await apiClient.get('/leagues');

      if (response.data && response.data.response) {
        leaguesCache.set(cacheKey, { 
          data: response.data.response, 
          timestamp: now 
        });
        return response.data.response;
      }

      return [];
    } catch (error) {
      console.error('Error fetching leagues:', error);
      if (cached?.data) {
        console.log('Using cached data due to API error');
        return cached.data;
      }
      console.error('API request failed and no cache available');
      return [];
    }
  },

  /**
   * Get league by ID
   */
  async getLeagueById(id: number): Promise<LeagueResponse | null> {
    const cacheKey = `league-${id}`;
    const cached = leaguesCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < STATIC_DATA_CACHE_DURATION) {
      return cached.data;
    }

    try {
      console.log(`Fetching league with ID ${id}`);
      const response = await apiClient.get('/leagues', {
        params: { id }
      });

      console.log(`API response status: ${response.status}, data:`, 
        JSON.stringify(response.data).substring(0, 200) + '...');

      if (response.data && response.data.response && response.data.response.length > 0) {
        const leagueData = response.data.response[0];
        leaguesCache.set(cacheKey, { 
          data: leagueData, 
          timestamp: now 
        });
        return leagueData;
      }

      console.log(`No league data found for ID ${id}`);
      return null;
    } catch (error) {
      console.error(`Error fetching league with ID ${id}:`, error);
      if (cached?.data) {
        console.log('Using cached data due to API error');
        return cached.data;
      }
      console.error('API request failed and no cache available');
      return null;
    }
  },

  /**
   * Get top scorers for a league and season
   */
  async getTopScorers(leagueId: number, season: number): Promise<PlayerStatistics[]> {
    const cacheKey = `top-scorers-${leagueId}-${season}`;
    const cached = playersCache.get(cacheKey);

    const now = Date.now();
    // Use shorter cache duration for top scorers (5 minutes)
    if (cached && now - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }

    try {
      console.log(`Fetching top scorers for league ${leagueId}, season ${season}`);

      // First let's check if the league exists and get the current season
      const leagueInfo = await this.getLeagueById(leagueId);
      if (!leagueInfo) {
        console.log(`League with ID ${leagueId} not found`);
        return [];
      }

      // Find the current season
      const currentSeason = leagueInfo.seasons.find(s => s.current) || leagueInfo.seasons[0];
      if (!currentSeason) {
        console.log(`No season data found for league ${leagueId}`);
        return [];
      }

      // Use the correct season from the league info
      const correctSeason = currentSeason.year;
      console.log(`Using correct season ${correctSeason} for league ${leagueId} (${leagueInfo.league.name})`);

      const response = await apiClient.get('/players/topscorers', {
        params: { league: leagueId, season: correctSeason }
      });

      console.log(`Top scorers API response status: ${response.status}, results count: ${response.data?.results || 0}`);

      if (response.data && response.data.response) {
        playersCache.set(cacheKey, { 
          data: response.data.response, 
          timestamp: now 
        });
        return response.data.response;
      }

      console.log(`No top scorers data for league ${leagueId}, season ${correctSeason}`);
      return [];
    } catch (error) {
      console.error(`Error fetching top scorers for league ${leagueId}:`, error);
      if (cached?.data) {
        console.log('Using cached data due to API error');
        return cached.data;
      }
      console.error('API request failed and no cache available');
      return [];
    }
  },

  /**
   * Get league standings by league ID and season
   */
  async getLeagueStandings(leagueId: number, season: number): Promise<LeagueStandings | null> {
    const cacheKey = `standings-${leagueId}-${season}`;
    const cached = leaguesCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < STATIC_DATA_CACHE_DURATION) {
      return cached.data;
    }

    try {
      console.log(`Fetching standings for league ${leagueId}, season ${season}`);

      // First let's check if the league exists and get the current season
      const leagueInfo = await this.getLeagueById(leagueId);
      if (!leagueInfo) {
        console.log(`League with ID ${leagueId} not found`);
        return null;
      }

      // Find the current season
      const currentSeason = leagueInfo.seasons.find(s => s.current) || leagueInfo.seasons[0];
      if (!currentSeason) {
        console.log(`No season data found for league ${leagueId}`);
        return null;
      }

      // Use the correct season from the league info
      const correctSeason = currentSeason.year;
      console.log(`Using correct season ${correctSeason} for league ${leagueId} (${leagueInfo.league.name})`);

      const response = await apiClient.get('/standings', {
        params: { league: leagueId, season: correctSeason }
      });

      console.log(`Standings API response status: ${response.status}, results count: ${response.data?.results || 0}`);

      if (response.data && response.data.response && response.data.response.length > 0) {
        const standingsData = response.data.response[0];
        leaguesCache.set(cacheKey, { 
          data: standingsData, 
          timestamp: now 
        });
        return standingsData;
      }

      console.log(`No standings data for league ${leagueId}, season ${correctSeason}`);
      return null;
    } catch (error) {
      console.error(`Error fetching standings for league ${leagueId}:`, error);
      if (cached?.data) {
        console.log('Using cached data due to API error');
        return cached.data;
      }
      console.error('API request failed and no cache available');
      return null;
    }
  }
};