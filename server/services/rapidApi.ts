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

// Cache control - 5 minutes for live data, 1 hour for static data
const LIVE_DATA_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STATIC_DATA_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Cache objects
const fixturesCache = new Map<string, { data: any, timestamp: number }>();
const leaguesCache = new Map<string, { data: any, timestamp: number }>();
const playersCache = new Map<string, { data: any, timestamp: number }>();

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
      return cached?.data || [];
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
      return cached?.data || [];
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
      return cached?.data || null;
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
        fixturesCache.set(cacheKey, { 
          data: response.data.response, 
          timestamp: now 
        });
        return response.data.response;
      }

      return [];
    } catch (error) {
      console.error(`Error fetching fixtures for league ${leagueId}:`, error);
      return cached?.data || [];
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
      return cached?.data || [];
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
      return cached?.data || null;
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
      return cached?.data || [];
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
      return cached?.data || null;
    }
  }
};