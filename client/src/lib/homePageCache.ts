
/**
 * Home Page Cache System
 * Unified caching for scoreboard, popular lists, teams, and standings
 */

import { apiRequest } from './utils';

// Cache interfaces
interface CachedItem<T> {
  data: T;
  timestamp: number;
  source: string;
}

interface HomePageCacheConfig {
  maxAge: number; // Cache duration in milliseconds
  maxSize: number; // Maximum number of cached items
}

const DEFAULT_CONFIG: HomePageCacheConfig = {
  maxAge: 30 * 60 * 1000, // 30 minutes for most data
  maxSize: 100,
};

// Different cache durations for different types
const CACHE_DURATIONS = {
  scoreboard: 2 * 60 * 1000, // 2 minutes for live scores
  fixtures: 5 * 60 * 1000, // 5 minutes for fixtures
  standings: 4 * 60 * 60 * 1000, // 4 hours for standings
  teams: 24 * 60 * 60 * 1000, // 24 hours for team data
  leagues: 24 * 60 * 60 * 1000, // 24 hours for league data
  topScorers: 6 * 60 * 60 * 1000, // 6 hours for top scorers
};

// localStorage keys
const STORAGE_KEYS = {
  scoreboard: 'home_scoreboard_cache',
  fixtures: 'home_fixtures_cache',
  standings: 'home_standings_cache',
  teams: 'home_teams_cache',
  leagues: 'home_leagues_cache',
  topScorers: 'home_topscorers_cache',
};

class HomePageCache {
  private static instance: HomePageCache;
  private memoryCache = new Map<string, CachedItem<any>>();
  private config: HomePageCacheConfig;

  static getInstance(): HomePageCache {
    if (!HomePageCache.instance) {
      HomePageCache.instance = new HomePageCache();
      HomePageCache.instance.loadFromStorage();
    }
    return HomePageCache.instance;
  }

  constructor(config: Partial<HomePageCacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Load cache from localStorage
  private loadFromStorage(): void {
    Object.entries(STORAGE_KEYS).forEach(([type, storageKey]) => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const cache = JSON.parse(stored);
          const now = Date.now();
          
          let loadedCount = 0;
          Object.entries(cache).forEach(([key, item]: [string, any]) => {
            const maxAge = CACHE_DURATIONS[type as keyof typeof CACHE_DURATIONS] || this.config.maxAge;
            if (now - item.timestamp < maxAge) {
              this.memoryCache.set(key, item);
              loadedCount++;
            }
          });
          
          if (loadedCount > 0) {
            console.log(`🏠 Loaded ${loadedCount} ${type} items from localStorage cache`);
          }
        }
      } catch (error) {
        console.error(`Error loading ${type} cache from localStorage:`, error);
      }
    });
    
    this.logCacheStats();
  }

  // Save cache to localStorage
  private saveToStorage(type: keyof typeof STORAGE_KEYS): void {
    try {
      const storageKey = STORAGE_KEYS[type];
      const cacheObject: Record<string, CachedItem<any>> = {};
      
      // Filter cache items by type prefix
      this.memoryCache.forEach((item, key) => {
        if (key.startsWith(`${type}_`)) {
          cacheObject[key] = item;
        }
      });
      
      localStorage.setItem(storageKey, JSON.stringify(cacheObject));
    } catch (error) {
      console.error(`Error saving ${type} cache to localStorage:`, error);
    }
  }

  // Get cached data
  getCached<T>(key: string, type: keyof typeof CACHE_DURATIONS): T | null {
    const cached = this.memoryCache.get(key);
    
    if (cached) {
      const now = Date.now();
      const maxAge = CACHE_DURATIONS[type];
      const age = now - cached.timestamp;
      
      if (age < maxAge) {
        const ageMinutes = Math.floor(age / 60000);
        console.log(`✅ Cache hit for ${key} (age: ${ageMinutes} min)`);
        return cached.data;
      } else {
        // Remove expired item
        this.memoryCache.delete(key);
        console.log(`⏰ Expired cache for ${key}`);
      }
    }
    
    console.log(`❌ Cache miss for ${key}`);
    return null;
  }

  // Set cached data
  setCached<T>(key: string, data: T, type: keyof typeof CACHE_DURATIONS, source: string = 'api'): void {
    const cacheItem: CachedItem<T> = {
      data,
      timestamp: Date.now(),
      source,
    };
    
    this.memoryCache.set(key, cacheItem);
    this.saveToStorage(type);
    
    console.log(`💾 Cached ${type} data for ${key} from ${source}`);
  }

  // Scoreboard methods
  async getScoreboardData(date: string): Promise<any[]> {
    const cacheKey = `scoreboard_${date}`;
    const cached = this.getCached<any[]>(cacheKey, 'scoreboard');
    
    if (cached) return cached;

    try {
      console.log(`🔍 Fetching fresh scoreboard data for ${date}`);
      const response = await apiRequest('GET', `/api/fixtures/date/${date}?all=true`);
      
      if (!response.ok) {
        console.warn(`Failed to fetch scoreboard data: ${response.status}`);
        return [];
      }

      const data = await response.json();
      this.setCached(cacheKey, data, 'scoreboard');
      
      console.log(`✅ Fetched and cached ${data.length} matches for ${date}`);
      return data;
    } catch (error) {
      console.error(`Error fetching scoreboard data for ${date}:`, error);
      return [];
    }
  }

  // Popular leagues methods
  async getPopularLeagues(): Promise<any[]> {
    const cacheKey = 'leagues_popular';
    const cached = this.getCached<any[]>(cacheKey, 'leagues');
    
    if (cached) return cached;

    try {
      console.log('🔍 Fetching fresh popular leagues data');
      const response = await apiRequest('GET', '/api/leagues');
      
      if (!response.ok) {
        console.warn(`Failed to fetch leagues data: ${response.status}`);
        return this.getFallbackLeagues();
      }

      const data = await response.json();
      const popularLeagues = data.slice(0, 10); // Take top 10
      
      this.setCached(cacheKey, popularLeagues, 'leagues');
      
      console.log(`✅ Fetched and cached ${popularLeagues.length} popular leagues`);
      return popularLeagues;
    } catch (error) {
      console.error('Error fetching popular leagues:', error);
      return this.getFallbackLeagues();
    }
  }

  private getFallbackLeagues(): any[] {
    const fallback = [
      { league: { id: 39, name: 'Premier League' }, country: { name: 'England' } },
      { league: { id: 140, name: 'La Liga' }, country: { name: 'Spain' } },
      { league: { id: 135, name: 'Serie A' }, country: { name: 'Italy' } },
      { league: { id: 78, name: 'Bundesliga' }, country: { name: 'Germany' } },
      { league: { id: 2, name: 'UEFA Champions League' }, country: { name: 'World' } },
    ];
    
    this.setCached('leagues_popular', fallback, 'leagues', 'fallback');
    return fallback;
  }

  // Popular teams methods
  async getPopularTeams(): Promise<any[]> {
    const cacheKey = 'teams_popular';
    const cached = this.getCached<any[]>(cacheKey, 'teams');
    
    if (cached) return cached;

    try {
      console.log('🔍 Fetching fresh popular teams data');
      
      // Fetch teams from popular leagues
      const popularLeagueIds = [39, 140, 135, 78, 2]; // Premier League, La Liga, Serie A, Bundesliga, Champions League
      const teams: any[] = [];
      
      for (const leagueId of popularLeagueIds.slice(0, 2)) { // Limit to prevent too many requests
        try {
          const response = await apiRequest('GET', `/api/leagues/${leagueId}/teams`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              teams.push(...data.slice(0, 3)); // Take top 3 teams from each league
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch teams for league ${leagueId}:`, error);
        }
      }
      
      const popularTeams = teams.slice(0, 8); // Limit to 8 teams total
      
      if (popularTeams.length > 0) {
        this.setCached(cacheKey, popularTeams, 'teams');
        console.log(`✅ Fetched and cached ${popularTeams.length} popular teams`);
        return popularTeams;
      } else {
        return this.getFallbackTeams();
      }
    } catch (error) {
      console.error('Error fetching popular teams:', error);
      return this.getFallbackTeams();
    }
  }

  private getFallbackTeams(): any[] {
    const fallback = [
      { team: { id: 33, name: 'Manchester United', logo: 'https://media.api-sports.io/football/teams/33.png' } },
      { team: { id: 40, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' } },
      { team: { id: 50, name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png' } },
      { team: { id: 529, name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' } },
      { team: { id: 541, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' } },
    ];
    
    this.setCached('teams_popular', fallback, 'teams', 'fallback');
    return fallback;
  }

  // Top scorers methods
  async getTopScorers(leagueId: number): Promise<any[]> {
    const cacheKey = `topscorers_${leagueId}`;
    const cached = this.getCached<any[]>(cacheKey, 'topScorers');
    
    if (cached) return cached;

    try {
      console.log(`🔍 Fetching fresh top scorers for league ${leagueId}`);
      const response = await apiRequest('GET', `/api/leagues/${leagueId}/topscorers`);
      
      if (!response.ok) {
        console.warn(`Failed to fetch top scorers for league ${leagueId}: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const topScorers = data.slice(0, 10); // Top 10 scorers
      
      this.setCached(cacheKey, topScorers, 'topScorers');
      
      console.log(`✅ Fetched and cached ${topScorers.length} top scorers for league ${leagueId}`);
      return topScorers;
    } catch (error) {
      console.error(`Error fetching top scorers for league ${leagueId}:`, error);
      return [];
    }
  }

  // League standings methods (integrate with existing standings cache)
  async getLeagueStandings(leagueId: number): Promise<any> {
    const cacheKey = `standings_${leagueId}`;
    const cached = this.getCached<any>(cacheKey, 'standings');
    
    if (cached) return cached;

    try {
      console.log(`🔍 Fetching fresh standings for league ${leagueId}`);
      const response = await apiRequest('GET', `/api/leagues/${leagueId}/standings`);
      
      if (!response.ok) {
        console.warn(`Failed to fetch standings for league ${leagueId}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      this.setCached(cacheKey, data, 'standings');
      
      console.log(`✅ Fetched and cached standings for league ${leagueId} (${data?.league?.name || 'Unknown'})`);
      return data;
    } catch (error) {
      console.error(`Error fetching standings for league ${leagueId}:`, error);
      return null;
    }
  }

  // Featured match methods
  async getFeaturedMatch(date: string): Promise<any | null> {
    const cacheKey = `featured_${date}`;
    const cached = this.getCached<any>(cacheKey, 'fixtures');
    
    if (cached) return cached;

    try {
      const matches = await this.getScoreboardData(date);
      
      // Find the most important match (Champions League, Premier League, etc.)
      const popularLeagues = [2, 3, 39, 140, 135, 78]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga
      
      for (const leagueId of popularLeagues) {
        const featuredMatch = matches.find(match => 
          match.league?.id === leagueId && 
          (match.fixture?.status?.short === 'LIVE' || 
           match.fixture?.status?.short === 'HT' ||
           match.fixture?.status?.short === 'NS')
        );
        
        if (featuredMatch) {
          this.setCached(cacheKey, featuredMatch, 'fixtures');
          console.log(`✅ Found featured match: ${featuredMatch.teams?.home?.name} vs ${featuredMatch.teams?.away?.name}`);
          return featuredMatch;
        }
      }
      
      // If no featured match found, return first available match
      const fallbackMatch = matches[0] || null;
      this.setCached(cacheKey, fallbackMatch, 'fixtures');
      return fallbackMatch;
    } catch (error) {
      console.error(`Error finding featured match for ${date}:`, error);
      return null;
    }
  }

  // Cache management
  clearCache(): void {
    this.memoryCache.clear();
    
    Object.values(STORAGE_KEYS).forEach(storageKey => {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error(`Error clearing ${storageKey}:`, error);
      }
    });
    
    console.log('🧹 Home page cache cleared (memory + localStorage)');
  }

  logCacheStats(): void {
    const now = Date.now();
    const stats = {
      total: this.memoryCache.size,
      fresh: 0,
      expired: 0,
      byType: {} as Record<string, number>,
    };

    this.memoryCache.forEach((item, key) => {
      const type = key.split('_')[0];
      const maxAge = CACHE_DURATIONS[type as keyof typeof CACHE_DURATIONS] || this.config.maxAge;
      const age = now - item.timestamp;
      
      if (age < maxAge) {
        stats.fresh++;
      } else {
        stats.expired++;
      }
      
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    console.log(`🏠 Home Page Cache Stats:`, stats);
  }

  getCacheStats() {
    const now = Date.now();
    const stats = {
      total: this.memoryCache.size,
      fresh: 0,
      expired: 0,
      details: [] as Array<{key: string; type: string; age: string; source: string}>,
    };

    this.memoryCache.forEach((item, key) => {
      const type = key.split('_')[0];
      const maxAge = CACHE_DURATIONS[type as keyof typeof CACHE_DURATIONS] || this.config.maxAge;
      const age = now - item.timestamp;
      const ageMinutes = Math.floor(age / 60000);
      
      if (age < maxAge) {
        stats.fresh++;
      } else {
        stats.expired++;
      }

      stats.details.push({
        key,
        type,
        age: `${ageMinutes} min`,
        source: item.source,
      });
    });

    return stats;
  }
}

// Create singleton instance
const homePageCache = HomePageCache.getInstance();

// Export utility functions
export const homePageUtils = {
  getScoreboardData: (date: string) => homePageCache.getScoreboardData(date),
  getPopularLeagues: () => homePageCache.getPopularLeagues(),
  getPopularTeams: () => homePageCache.getPopularTeams(),
  getTopScorers: (leagueId: number) => homePageCache.getTopScorers(leagueId),
  getLeagueStandings: (leagueId: number) => homePageCache.getLeagueStandings(leagueId),
  getFeaturedMatch: (date: string) => homePageCache.getFeaturedMatch(date),
  clearCache: () => homePageCache.clearCache(),
  getCacheStats: () => homePageCache.getCacheStats(),
};

export default homePageCache;
