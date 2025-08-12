
import { FixtureResponse } from '@/types/fixtures';
import { fixtureCache } from './fixtureCache';
import { format, differenceInHours, isToday, addHours } from 'date-fns';

interface FetchOptions {
  forceRefresh?: boolean;
  skipCache?: boolean;
  source?: string;
}

interface MatchStatus {
  isLive: boolean;
  isEnded: boolean;
  isUpcoming: boolean;
  isToday: boolean;
  hoursUntilKickoff?: number;
  hoursSinceEnd?: number;
}

export class MyFetchingLogic {
  private static readonly LIVE_STATUSES = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'];
  private static readonly ENDED_STATUSES = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'CANC', 'PST', 'SUSP'];
  private static readonly UPCOMING_STATUSES = ['NS', 'TBD'];
  
  private static readonly CACHE_DURATIONS = {
    LIVE: 0, // No cache for live matches
    RECENTLY_ENDED: 30 * 60 * 1000, // 30 minutes
    OLD_ENDED: 24 * 60 * 60 * 1000, // 24 hours
    UPCOMING_TODAY: 10 * 60 * 1000, // 10 minutes
    UPCOMING_FUTURE: 60 * 60 * 1000, // 1 hour
  };

  /**
   * Analyze match status and timing
   */
  private static analyzeMatchStatus(fixture: FixtureResponse): MatchStatus {
    const status = fixture.fixture.status.short;
    const matchDate = new Date(fixture.fixture.date);
    const now = new Date();
    
    const isLive = this.LIVE_STATUSES.includes(status);
    const isEnded = this.ENDED_STATUSES.includes(status);
    const isUpcoming = this.UPCOMING_STATUSES.includes(status);
    const isMatchToday = isToday(matchDate);
    
    let hoursUntilKickoff: number | undefined;
    let hoursSinceEnd: number | undefined;
    
    if (isUpcoming) {
      hoursUntilKickoff = differenceInHours(matchDate, now);
    }
    
    if (isEnded) {
      hoursSinceEnd = differenceInHours(now, matchDate);
    }
    
    return {
      isLive,
      isEnded,
      isUpcoming,
      isToday: isMatchToday,
      hoursUntilKickoff,
      hoursSinceEnd
    };
  }

  /**
   * Fetch live matches using live API endpoint
   */
  static async fetchLiveMatches(options: FetchOptions = {}): Promise<FixtureResponse[]> {
    const { source = 'live-api' } = options;
    
    try {
      console.log(`🔴 [MyFetchingLogic] Fetching live matches from live API endpoint`);
      
      const response = await fetch('/api/fixtures/live', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Live API responded with ${response.status}`);
      }

      const fixtures: FixtureResponse[] = await response.json();
      
      console.log(`✅ [MyFetchingLogic] Retrieved ${fixtures.length} live matches`);
      
      // Don't cache live matches - they need real-time updates
      return fixtures;
      
    } catch (error) {
      console.error(`❌ [MyFetchingLogic] Error fetching live matches:`, error);
      throw error;
    }
  }

  /**
   * Fetch ended matches with intelligent caching
   */
  static async fetchEndedMatches(
    date: string, 
    options: FetchOptions = {}
  ): Promise<FixtureResponse[]> {
    const { forceRefresh = false, source = 'ended-api' } = options;
    
    try {
      // Check cache first for non-recent ended matches
      if (!forceRefresh) {
        const cached = fixtureCache.getCachedFixturesForDate(date);
        if (cached) {
          const endedMatches = cached.filter(fixture => {
            const matchStatus = this.analyzeMatchStatus(fixture);
            return matchStatus.isEnded;
          });
          
          if (endedMatches.length > 0) {
            console.log(`✅ [MyFetchingLogic] Using cached ended matches for ${date}: ${endedMatches.length} matches`);
            return endedMatches;
          }
        }
      }

      console.log(`🔄 [MyFetchingLogic] Fetching ended matches for ${date}`);
      
      const response = await fetch(`/api/fixtures/date/${date}?all=true`);
      
      if (!response.ok) {
        throw new Error(`Ended matches API responded with ${response.status}`);
      }

      const allFixtures: FixtureResponse[] = await response.json();
      
      // Filter and categorize ended matches
      const endedMatches: FixtureResponse[] = [];
      const recentlyEndedMatches: FixtureResponse[] = [];
      
      for (const fixture of allFixtures) {
        const matchStatus = this.analyzeMatchStatus(fixture);
        
        if (matchStatus.isEnded) {
          endedMatches.push(fixture);
          
          // Check if recently ended (within 2 hours)
          if (matchStatus.hoursSinceEnd && matchStatus.hoursSinceEnd <= 2) {
            recentlyEndedMatches.push(fixture);
          }
        }
      }

      // Cache ended matches (excluding recently ended ones)
      const cacheableMatches = endedMatches.filter(fixture => {
        const matchStatus = this.analyzeMatchStatus(fixture);
        return matchStatus.hoursSinceEnd && matchStatus.hoursSinceEnd > 2;
      });
      
      if (cacheableMatches.length > 0) {
        fixtureCache.cacheFixturesForDate(date, cacheableMatches, `${source}-ended`);
      }

      console.log(`✅ [MyFetchingLogic] Retrieved ${endedMatches.length} ended matches (${recentlyEndedMatches.length} recently ended)`);
      
      return endedMatches;
      
    } catch (error) {
      console.error(`❌ [MyFetchingLogic] Error fetching ended matches:`, error);
      throw error;
    }
  }

  /**
   * Fetch upcoming matches with smart caching and live transition
   */
  static async fetchUpcomingMatches(
    date: string, 
    options: FetchOptions = {}
  ): Promise<FixtureResponse[]> {
    const { forceRefresh = false, source = 'upcoming-api' } = options;
    
    try {
      // Check cache first for future dates
      if (!forceRefresh && !isToday(new Date(date))) {
        const cached = fixtureCache.getCachedFixturesForDate(date);
        if (cached) {
          const upcomingMatches = cached.filter(fixture => {
            const matchStatus = this.analyzeMatchStatus(fixture);
            return matchStatus.isUpcoming;
          });
          
          if (upcomingMatches.length > 0) {
            console.log(`✅ [MyFetchingLogic] Using cached upcoming matches for ${date}: ${upcomingMatches.length} matches`);
            return upcomingMatches;
          }
        }
      }

      console.log(`🔄 [MyFetchingLogic] Fetching upcoming matches for ${date}`);
      
      const response = await fetch(`/api/fixtures/date/${date}?all=true`);
      
      if (!response.ok) {
        throw new Error(`Upcoming matches API responded with ${response.status}`);
      }

      const allFixtures: FixtureResponse[] = await response.json();
      
      // Filter and categorize upcoming matches
      const upcomingMatches: FixtureResponse[] = [];
      const nearKickoffMatches: FixtureResponse[] = [];
      
      for (const fixture of allFixtures) {
        const matchStatus = this.analyzeMatchStatus(fixture);
        
        if (matchStatus.isUpcoming) {
          upcomingMatches.push(fixture);
          
          // Check if near kickoff (within 30 minutes)
          if (matchStatus.isToday && matchStatus.hoursUntilKickoff && matchStatus.hoursUntilKickoff <= 0.5) {
            nearKickoffMatches.push(fixture);
          }
        }
      }

      // Cache upcoming matches based on timing
      const cacheableMatches = upcomingMatches.filter(fixture => {
        const matchStatus = this.analyzeMatchStatus(fixture);
        // Don't cache matches that are very close to kickoff
        return !matchStatus.isToday || (matchStatus.hoursUntilKickoff && matchStatus.hoursUntilKickoff > 1);
      });
      
      if (cacheableMatches.length > 0) {
        const cacheDuration = isToday(new Date(date)) ? 
          this.CACHE_DURATIONS.UPCOMING_TODAY : 
          this.CACHE_DURATIONS.UPCOMING_FUTURE;
        
        fixtureCache.cacheFixturesForDate(date, cacheableMatches, `${source}-upcoming`);
      }

      console.log(`✅ [MyFetchingLogic] Retrieved ${upcomingMatches.length} upcoming matches (${nearKickoffMatches.length} near kickoff)`);
      
      return upcomingMatches;
      
    } catch (error) {
      console.error(`❌ [MyFetchingLogic] Error fetching upcoming matches:`, error);
      throw error;
    }
  }

  /**
   * Smart fetch that automatically determines the best strategy
   */
  static async smartFetch(
    date: string, 
    options: FetchOptions = {}
  ): Promise<FixtureResponse[]> {
    const { forceRefresh = false, source = 'smart-fetch' } = options;
    
    try {
      console.log(`🎯 [MyFetchingLogic] Smart fetch for ${date}`);
      
      // For today's date, we need to check for live matches
      if (isToday(new Date(date))) {
        console.log(`📅 [MyFetchingLogic] Today's date detected - checking for live matches`);
        
        // Fetch all today's fixtures
        const response = await fetch(`/api/fixtures/date/${date}?all=true`);
        
        if (!response.ok) {
          throw new Error(`Smart fetch API responded with ${response.status}`);
        }

        const allFixtures: FixtureResponse[] = await response.json();
        
        // Categorize matches
        const liveMatches: FixtureResponse[] = [];
        const endedMatches: FixtureResponse[] = [];
        const upcomingMatches: FixtureResponse[] = [];
        
        for (const fixture of allFixtures) {
          const matchStatus = this.analyzeMatchStatus(fixture);
          
          if (matchStatus.isLive) {
            liveMatches.push(fixture);
          } else if (matchStatus.isEnded) {
            endedMatches.push(fixture);
          } else if (matchStatus.isUpcoming) {
            upcomingMatches.push(fixture);
          }
        }

        // For live matches, get fresh data
        if (liveMatches.length > 0) {
          console.log(`🔴 [MyFetchingLogic] Found ${liveMatches.length} live matches - fetching fresh data`);
          const freshLiveMatches = await this.fetchLiveMatches({ source: `${source}-live` });
          
          // Combine with cached ended/upcoming matches
          const nonLiveMatches = [...endedMatches, ...upcomingMatches];
          return [...freshLiveMatches, ...nonLiveMatches];
        }

        // No live matches, return all fixtures
        console.log(`✅ [MyFetchingLogic] No live matches found for today`);
        return allFixtures;
        
      } else {
        // For past/future dates, use standard date-based fetch
        console.log(`📅 [MyFetchingLogic] Non-today date - using standard fetch`);
        
        const response = await fetch(`/api/fixtures/date/${date}?all=true`);
        
        if (!response.ok) {
          throw new Error(`Smart fetch API responded with ${response.status}`);
        }

        const fixtures: FixtureResponse[] = await response.json();
        
        // Cache if not forcing refresh
        if (!forceRefresh) {
          fixtureCache.cacheFixturesForDate(date, fixtures, `${source}-standard`);
        }
        
        return fixtures;
      }
      
    } catch (error) {
      console.error(`❌ [MyFetchingLogic] Smart fetch error:`, error);
      throw error;
    }
  }

  /**
   * Fetch fixtures by league with intelligent caching
   */
  static async fetchLeagueFixtures(
    leagueId: number, 
    options: FetchOptions = {}
  ): Promise<FixtureResponse[]> {
    const { forceRefresh = false, source = 'league-api' } = options;
    
    try {
      console.log(`🏆 [MyFetchingLogic] Fetching fixtures for league ${leagueId}`);
      
      const response = await fetch(`/api/leagues/${leagueId}/fixtures`);
      
      if (!response.ok) {
        throw new Error(`League fixtures API responded with ${response.status}`);
      }

      const fixtures: FixtureResponse[] = await response.json();
      
      // Categorize matches by status
      const liveMatches = fixtures.filter(f => {
        const status = this.analyzeMatchStatus(f);
        return status.isLive;
      });
      
      const endedMatches = fixtures.filter(f => {
        const status = this.analyzeMatchStatus(f);
        return status.isEnded;
      });
      
      const upcomingMatches = fixtures.filter(f => {
        const status = this.analyzeMatchStatus(f);
        return status.isUpcoming;
      });

      console.log(`✅ [MyFetchingLogic] League ${leagueId}: ${fixtures.length} total (${liveMatches.length} live, ${endedMatches.length} ended, ${upcomingMatches.length} upcoming)`);
      
      return fixtures;
      
    } catch (error) {
      console.error(`❌ [MyFetchingLogic] Error fetching league ${leagueId} fixtures:`, error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return fixtureCache.getEnhancedStats();
  }

  /**
   * Clear all caches
   */
  static clearAllCaches() {
    fixtureCache.clear();
    console.log(`🗑️ [MyFetchingLogic] All caches cleared`);
  }
}

// Export convenience functions for easier usage
export const fetchLiveMatches = MyFetchingLogic.fetchLiveMatches;
export const fetchEndedMatches = MyFetchingLogic.fetchEndedMatches;
export const fetchUpcomingMatches = MyFetchingLogic.fetchUpcomingMatches;
export const smartFetch = MyFetchingLogic.smartFetch;
export const fetchLeagueFixtures = MyFetchingLogic.fetchLeagueFixtures;
export const getCacheStats = MyFetchingLogic.getCacheStats;
export const clearAllCaches = MyFetchingLogic.clearAllCaches;

// Export getCachedFixturesForDate from fixtureCache
export const getCachedFixturesForDate = (date: string) => {
  return fixtureCache.getCachedFixturesForDate(date);
};

export default MyFetchingLogic;
