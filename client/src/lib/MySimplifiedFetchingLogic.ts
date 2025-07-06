
import { FixtureResponse } from '@/types/fixtures';
import { format, differenceInHours, isToday, addHours } from 'date-fns';

interface MatchState {
  isUpcoming: boolean;
  isLive: boolean;
  isRecentlyEnded: boolean;
  isOldEnded: boolean;
  hoursFromNow: number;
}

export class MySimplifiedFetchingLogic {
  private static readonly LIVE_STATUSES = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'];
  private static readonly ENDED_STATUSES = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'CANC', 'PST', 'SUSP'];
  private static readonly UPCOMING_STATUSES = ['NS', 'TBD'];

  /**
   * Determine match state based on time and status
   */
  private static getMatchState(fixture: FixtureResponse): MatchState {
    const matchDate = new Date(fixture.fixture.date);
    const now = new Date();
    const hoursFromNow = differenceInHours(matchDate, now);
    const status = fixture.fixture.status.short;

    const isUpcoming = this.UPCOMING_STATUSES.includes(status) && hoursFromNow >= 6;
    const isLive = this.LIVE_STATUSES.includes(status);
    const isRecentlyEnded = this.ENDED_STATUSES.includes(status) && hoursFromNow >= -24; // Within 24 hours
    const isOldEnded = this.ENDED_STATUSES.includes(status) && hoursFromNow < -24;

    return {
      isUpcoming,
      isLive,
      isRecentlyEnded,
      isOldEnded,
      hoursFromNow
    };
  }

  /**
   * 1. Fetch upcoming matches (>= 6 hours from now) and cache them
   */
  static async fetchUpcomingMatches(date: string): Promise<FixtureResponse[]> {
    try {
      console.log(`📅 [Simplified] Fetching upcoming matches for ${date}`);
      
      // Check server cache first
      const cachedKey = `upcoming_${date}`;
      const cached = localStorage.getItem(cachedKey);
      
      if (cached) {
        const { fixtures, timestamp } = JSON.parse(cached);
        const cacheAge = Date.now() - timestamp;
        
        // Use cache for 4 hours
        if (cacheAge < 4 * 60 * 60 * 1000) {
          console.log(`✅ [Simplified] Using cached upcoming matches: ${fixtures.length}`);
          return fixtures;
        }
      }

      // Fetch fresh data
      const response = await fetch(`/api/fixtures/date/${date}?all=true`);
      const allFixtures: FixtureResponse[] = await response.json();
      
      // Filter only upcoming matches (>= 6 hours from now)
      const upcomingMatches = allFixtures.filter(fixture => {
        const state = this.getMatchState(fixture);
        return state.isUpcoming;
      });

      // Cache upcoming matches
      localStorage.setItem(cachedKey, JSON.stringify({
        fixtures: upcomingMatches,
        timestamp: Date.now()
      }));

      console.log(`✅ [Simplified] Fetched ${upcomingMatches.length} upcoming matches`);
      return upcomingMatches;
      
    } catch (error) {
      console.error(`❌ [Simplified] Error fetching upcoming matches:`, error);
      return [];
    }
  }

  /**
   * 2. Fetch live matches (always fresh from API)
   */
  static async fetchLiveMatches(): Promise<FixtureResponse[]> {
    try {
      console.log(`🔴 [Simplified] Fetching live matches (always fresh)`);
      
      // Always fetch fresh live data - no caching
      const response = await fetch('/api/fixtures/live', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      const liveFixtures: FixtureResponse[] = await response.json();
      
      console.log(`✅ [Simplified] Retrieved ${liveFixtures.length} live matches`);
      return liveFixtures;
      
    } catch (error) {
      console.error(`❌ [Simplified] Error fetching live matches:`, error);
      return [];
    }
  }

  /**
   * 3. Fetch recently ended matches (within 24 hours) and cache them
   */
  static async fetchRecentlyEndedMatches(date: string): Promise<FixtureResponse[]> {
    try {
      console.log(`📊 [Simplified] Fetching recently ended matches for ${date}`);
      
      // Check cache first
      const cachedKey = `recently_ended_${date}`;
      const cached = localStorage.getItem(cachedKey);
      
      if (cached) {
        const { fixtures, timestamp } = JSON.parse(cached);
        const cacheAge = Date.now() - timestamp;
        
        // Use cache for 2 hours
        if (cacheAge < 2 * 60 * 60 * 1000) {
          console.log(`✅ [Simplified] Using cached recently ended matches: ${fixtures.length}`);
          return fixtures;
        }
      }

      const response = await fetch(`/api/fixtures/date/${date}?all=true`);
      const allFixtures: FixtureResponse[] = await response.json();
      
      // Filter recently ended matches (within 24 hours)
      const recentlyEndedMatches = allFixtures.filter(fixture => {
        const state = this.getMatchState(fixture);
        return state.isRecentlyEnded;
      });

      // Cache recently ended matches
      localStorage.setItem(cachedKey, JSON.stringify({
        fixtures: recentlyEndedMatches,
        timestamp: Date.now()
      }));

      console.log(`✅ [Simplified] Fetched ${recentlyEndedMatches.length} recently ended matches`);
      return recentlyEndedMatches;
      
    } catch (error) {
      console.error(`❌ [Simplified] Error fetching recently ended matches:`, error);
      return [];
    }
  }

  /**
   * 4. Clear outdated data (upcoming matches that should now be live/ended)
   */
  static clearOutdatedData(): void {
    try {
      console.log(`🧹 [Simplified] Clearing outdated cache data`);
      
      const keys = Object.keys(localStorage);
      let clearedCount = 0;

      keys.forEach(key => {
        if (key.startsWith('upcoming_') || key.startsWith('recently_ended_')) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const { fixtures, timestamp } = JSON.parse(cached);
              
              // For upcoming matches, check if any should now be live
              if (key.startsWith('upcoming_')) {
                const hasExpiredMatches = fixtures.some((fixture: FixtureResponse) => {
                  const state = this.getMatchState(fixture);
                  return !state.isUpcoming; // If no longer upcoming, clear cache
                });
                
                if (hasExpiredMatches) {
                  localStorage.removeItem(key);
                  clearedCount++;
                  console.log(`🗑️ [Simplified] Cleared outdated upcoming cache: ${key}`);
                }
              }
              
              // For recently ended, check if too old
              if (key.startsWith('recently_ended_')) {
                const cacheAge = Date.now() - timestamp;
                if (cacheAge > 24 * 60 * 60 * 1000) { // Older than 24 hours
                  localStorage.removeItem(key);
                  clearedCount++;
                  console.log(`🗑️ [Simplified] Cleared old recently ended cache: ${key}`);
                }
              }
            }
          } catch (error) {
            // Remove corrupted cache
            localStorage.removeItem(key);
            clearedCount++;
          }
        }
      });
      
      if (clearedCount > 0) {
        console.log(`✅ [Simplified] Cleared ${clearedCount} outdated cache entries`);
      }
      
    } catch (error) {
      console.error(`❌ [Simplified] Error clearing outdated data:`, error);
    }
  }

  /**
   * Get all matches for a specific date using simplified logic
   */
  static async getAllMatchesForDate(date: string): Promise<{
    upcoming: FixtureResponse[];
    live: FixtureResponse[];
    recentlyEnded: FixtureResponse[];
    total: number;
  }> {
    try {
      console.log(`🎯 [Simplified] Getting all matches for ${date}`);
      
      // Clear outdated data first
      this.clearOutdatedData();
      
      // Fetch all types of matches
      const [upcoming, live, recentlyEnded] = await Promise.all([
        this.fetchUpcomingMatches(date),
        this.fetchLiveMatches(),
        this.fetchRecentlyEndedMatches(date)
      ]);
      
      // Filter live matches for the specific date
      const liveForDate = live.filter(fixture => {
        const fixtureDate = format(new Date(fixture.fixture.date), 'yyyy-MM-dd');
        return fixtureDate === date;
      });
      
      const result = {
        upcoming,
        live: liveForDate,
        recentlyEnded,
        total: upcoming.length + liveForDate.length + recentlyEnded.length
      };
      
      console.log(`✅ [Simplified] Retrieved matches for ${date}:`, {
        upcoming: result.upcoming.length,
        live: result.live.length,
        recentlyEnded: result.recentlyEnded.length,
        total: result.total
      });
      
      return result;
      
    } catch (error) {
      console.error(`❌ [Simplified] Error getting matches for ${date}:`, error);
      return {
        upcoming: [],
        live: [],
        recentlyEnded: [],
        total: 0
      };
    }
  }

  /**
   * Force refresh all data (clear cache and fetch fresh)
   */
  static async forceRefresh(date: string): Promise<FixtureResponse[]> {
    console.log(`🔄 [Simplified] Force refreshing all data for ${date}`);
    
    // Clear all related cache
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes(date) && (key.startsWith('upcoming_') || key.startsWith('recently_ended_'))) {
        localStorage.removeItem(key);
      }
    });
    
    const result = await this.getAllMatchesForDate(date);
    return [...result.upcoming, ...result.live, ...result.recentlyEnded];
  }
}

export default MySimplifiedFetchingLogic;
