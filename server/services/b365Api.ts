
import axios from 'axios';

// B365 API configuration
const B365_API_TOKEN = process.env.B365_API_TOKEN || '221793-jlaSvgWyBbF0py';
const B365_BASE_URL = 'https://api.b365api.com/v3';

console.log(`Using B365API Token: ${B365_API_TOKEN ? B365_API_TOKEN.substring(0, 6) + '...' : 'NOT SET'}`);

const apiClient = axios.create({
  baseURL: B365_BASE_URL,
  timeout: 10000, // 10 second timeout
});

// Cache for B365 data
const liveMatchesCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds for live data

export interface B365LiveMatch {
  id: string;
  time: string;
  time_status: number;
  league: {
    id: string;
    name: string;
    cc: string;
  };
  home: {
    id: string;
    name: string;
    image_id: string;
  };
  away: {
    id: string;
    name: string;
    image_id: string;
  };
  ss: string; // score string like "1-0"
  extra: {
    stadium: string;
    minute: string;
  };
}

export const b365ApiService = {
  /**
   * Get live football matches
   */
  async getLiveFootballMatches(): Promise<B365LiveMatch[]> {
    const cacheKey = 'live-football-matches';
    const cached = liveMatchesCache.get(cacheKey);
    
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      console.log('Using cached B365 live matches data');
      return cached.data;
    }

    try {
      console.log('Fetching live football matches from B365API...');
      
      const response = await apiClient.get('/events/inplay', {
        params: {
          sport_id: 1, // Football
          token: B365_API_TOKEN
        }
      });

      if (response.data && response.data.results) {
        const liveMatches = response.data.results;
        console.log(`B365API: Retrieved ${liveMatches.length} live matches`);
        
        liveMatchesCache.set(cacheKey, {
          data: liveMatches,
          timestamp: now
        });
        
        return liveMatches;
      }

      console.log('B365API: No live matches data received');
      return [];
    } catch (error) {
      console.error('B365API: Error fetching live matches:', error);
      
      // Return cached data if available, even if expired
      if (cached?.data) {
        console.log('B365API: Using expired cached data due to error');
        return cached.data;
      }
      
      // Return empty array instead of throwing
      return [];
    }
  },

  /**
   * Get events by date
   */
  async getEventsByDate(date: string): Promise<any[]> {
    try {
      console.log(`B365API: Fetching events for date ${date}...`);
      
      const response = await apiClient.get('/events/upcoming', {
        params: {
          sport_id: 1, // Football
          day: date, // Format should be YYYYMMDD
          token: B365_API_TOKEN
        }
      });

      if (response.data && response.data.results) {
        console.log(`B365API: Retrieved ${response.data.results.length} events for ${date}`);
        return response.data.results;
      }

      console.log(`B365API: No events data received for ${date}`);
      return [];
    } catch (error) {
      console.error(`B365API: Error fetching events for ${date}:`, error);
      return [];
    }
  },

  /**
   * Convert B365 match to RapidAPI format for compatibility
   */
  convertToRapidApiFormat(b365Match: B365LiveMatch): any {
    const scores = b365Match.ss ? b365Match.ss.split('-') : ['0', '0'];
    
    return {
      fixture: {
        id: parseInt(b365Match.id),
        referee: null,
        timezone: 'UTC',
        date: new Date().toISOString(), // B365 doesn't provide exact date for live matches
        timestamp: Math.floor(Date.now() / 1000),
        periods: {
          first: null,
          second: null
        },
        venue: {
          id: null,
          name: b365Match.extra?.stadium || null,
          city: null
        },
        status: {
          long: b365Match.time_status === 1 ? 'Match Finished' : 'Match Live',
          short: b365Match.time_status === 1 ? 'FT' : 'LIVE',
          elapsed: b365Match.extra?.minute ? parseInt(b365Match.extra.minute) : null
        }
      },
      league: {
        id: parseInt(b365Match.league.id),
        name: b365Match.league.name,
        country: b365Match.league.cc,
        logo: null,
        flag: null,
        season: new Date().getFullYear(),
        round: 'Regular Season'
      },
      teams: {
        home: {
          id: parseInt(b365Match.home.id),
          name: b365Match.home.name,
          logo: b365Match.home.image_id ? `https://assets.b365api.com/images/team/m/${b365Match.home.image_id}.png` : null,
          winner: null
        },
        away: {
          id: parseInt(b365Match.away.id),
          name: b365Match.away.name,
          logo: b365Match.away.image_id ? `https://assets.b365api.com/images/team/m/${b365Match.away.image_id}.png` : null,
          winner: null
        }
      },
      goals: {
        home: scores[0] ? parseInt(scores[0]) : 0,
        away: scores[1] ? parseInt(scores[1]) : 0
      },
      score: {
        halftime: { home: null, away: null },
        fulltime: { 
          home: scores[0] ? parseInt(scores[0]) : 0, 
          away: scores[1] ? parseInt(scores[1]) : 0 
        },
        extratime: { home: null, away: null },
        penalty: { home: null, away: null }
      }
    };
  }
};
