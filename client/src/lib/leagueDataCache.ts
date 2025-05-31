
/**
 * League Data Cache System
 * Handles caching and fetching of league information
 */

import { leagueLogoCache, getLeagueLogoCacheKey } from './logoCache';

export interface LeagueData {
  id: number;
  name: string;
  country: string;
  logo: string;
  priority?: number;
  type?: 'domestic' | 'international';
}

interface CachedLeagueData {
  leagues: LeagueData[];
  timestamp: number;
  source: string;
}

const CACHE_KEY = 'popular_leagues_data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Default fallback data (same as your current hardcoded data)
const DEFAULT_LEAGUES: LeagueData[] = [
  { id: 2, name: 'UEFA Champions League', country: 'Europe', logo: 'https://media.api-sports.io/football/leagues/2.png', priority: 1, type: 'international' },
  { id: 39, name: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png', priority: 2, type: 'domestic' },
  { id: 140, name: 'La Liga', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/140.png', priority: 3, type: 'domestic' },
  { id: 135, name: 'Serie A', country: 'Italy', logo: 'https://media.api-sports.io/football/leagues/135.png', priority: 4, type: 'domestic' },
  { id: 78, name: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png', priority: 5, type: 'domestic' },
  { id: 3, name: 'UEFA Europa League', country: 'Europe', logo: 'https://media.api-sports.io/football/leagues/3.png', priority: 6, type: 'international' },
  { id: 137, name: 'Coppa Italia', country: 'Italy', logo: 'https://media.api-sports.io/football/leagues/137.png', priority: 7, type: 'domestic' },
  { id: 45, name: 'FA Cup', country: 'England', logo: 'https://media.api-sports.io/football/leagues/45.png', priority: 8, type: 'domestic' },
  { id: 40, name: 'Community Shield', country: 'England', logo: 'https://media.api-sports.io/football/leagues/40.png', priority: 9, type: 'domestic' },
  { id: 48, name: 'EFL Cup', country: 'England', logo: 'https://media.api-sports.io/football/leagues/48.png', priority: 10, type: 'domestic' }
];

class LeagueDataCache {
  private cache: Map<string, CachedLeagueData> = new Map();

  /**
   * Get cached league data or fetch from server
   */
  async getPopularLeagues(): Promise<LeagueData[]> {
    const cached = this.getCachedData(CACHE_KEY);
    
    if (cached && this.isValidCache(cached)) {
      console.log('Using cached league data');
      return cached.leagues;
    }

    console.log('Fetching fresh league data...');
    
    try {
      // Try to fetch from your API
      const response = await fetch('/api/leagues/popular');
      if (response.ok) {
        const apiData = await response.json();
        const leagues = this.normalizeLeagueData(apiData);
        
        // Cache the API data
        this.setCachedData(CACHE_KEY, {
          leagues,
          timestamp: Date.now(),
          source: 'api'
        });
        
        return leagues;
      }
    } catch (error) {
      console.warn('Failed to fetch league data from API:', error);
    }

    // Fallback to default data and cache it
    console.log('Using default league data');
    this.setCachedData(CACHE_KEY, {
      leagues: DEFAULT_LEAGUES,
      timestamp: Date.now(),
      source: 'default'
    });

    return DEFAULT_LEAGUES;
  }

  /**
   * Get leagues filtered by type
   */
  async getLeaguesByType(type: 'domestic' | 'international'): Promise<LeagueData[]> {
    const allLeagues = await this.getPopularLeagues();
    return allLeagues.filter(league => league.type === type);
  }

  /**
   * Get specific league by ID
   */
  async getLeagueById(id: number): Promise<LeagueData | null> {
    const allLeagues = await this.getPopularLeagues();
    return allLeagues.find(league => league.id === id) || null;
  }

  /**
   * Refresh cache by fetching new data
   */
  async refreshCache(): Promise<LeagueData[]> {
    this.cache.delete(CACHE_KEY);
    return this.getPopularLeagues();
  }

  /**
   * Normalize league data from different sources
   */
  private normalizeLeagueData(apiData: any): LeagueData[] {
    if (Array.isArray(apiData)) {
      return apiData.map((league, index) => ({
        id: league.id || league.league_id,
        name: league.name || league.league_name,
        country: league.country || league.country_name || 'Unknown',
        logo: league.logo || league.logo_url || `https://media.api-sports.io/football/leagues/${league.id}.png`,
        priority: league.priority || index + 1,
        type: this.determineLeagueType(league.name, league.country)
      }));
    }
    
    return DEFAULT_LEAGUES;
  }

  /**
   * Determine if league is domestic or international
   */
  private determineLeagueType(name: string, country: string): 'domestic' | 'international' {
    const internationalKeywords = ['UEFA', 'Champions', 'Europa', 'Conference', 'World', 'International'];
    const isInternational = internationalKeywords.some(keyword => 
      name.toUpperCase().includes(keyword.toUpperCase())
    ) || country.toLowerCase() === 'europe';
    
    return isInternational ? 'international' : 'domestic';
  }

  /**
   * Cache management methods
   */
  private getCachedData(key: string): CachedLeagueData | null {
    return this.cache.get(key) || null;
  }

  private setCachedData(key: string, data: CachedLeagueData): void {
    this.cache.set(key, data);
  }

  private isValidCache(cached: CachedLeagueData): boolean {
    return Date.now() - cached.timestamp < CACHE_DURATION;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    const cached = this.getCachedData(CACHE_KEY);
    return {
      hasCachedData: !!cached,
      lastUpdated: cached?.timestamp ? new Date(cached.timestamp) : null,
      source: cached?.source || 'none',
      isExpired: cached ? !this.isValidCache(cached) : true
    };
  }
}

// Create singleton instance
export const leagueDataCache = new LeagueDataCache();

// Utility functions for components
export async function getPopularLeagues(): Promise<LeagueData[]> {
  return leagueDataCache.getPopularLeagues();
}

export async function getLeagueById(id: number): Promise<LeagueData | null> {
  return leagueDataCache.getLeagueById(id);
}

export async function getDomesticLeagues(): Promise<LeagueData[]> {
  return leagueDataCache.getLeaguesByType('domestic');
}

export async function getInternationalLeagues(): Promise<LeagueData[]> {
  return leagueDataCache.getLeaguesByType('international');
}

export default leagueDataCache;
