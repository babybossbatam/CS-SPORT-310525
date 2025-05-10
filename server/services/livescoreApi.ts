import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { format } from 'date-fns';
import { 
  LivescoreLeagueResponse, LivescoreFixtureResponse, 
  LivescoreStandingsResponse, LeagueResponse, FixtureResponse 
} from '../types';

/**
 * Livescore API Service
 * Provides methods to interact with the Livescore API
 */
const BASE_URL = 'https://livescore6.p.rapidapi.com';
const HEADERS = {
  'x-rapidapi-key': process.env.RAPID_API_KEY || '',
  'x-rapidapi-host': 'livescore6.p.rapidapi.com'
};

/**
 * Helper function to make API requests with rate limiting and retry logic
 * @param config Axios request configuration
 * @param maxRetries Maximum number of retry attempts
 * @returns The response data or throws an error
 */
async function makeResilientRequest(
  config: AxiosRequestConfig, 
  maxRetries: number = 3
): Promise<any> {
  let retries = 0;
  let lastError: any;
  
  // Implement exponential backoff strategy
  while (retries < maxRetries) {
    try {
      // Make the request
      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error (429)
      if (error.response && error.response.status === 429) {
        const delayMs = Math.pow(2, retries) * 1000; // Exponential backoff
        console.log(`Rate limited. Retrying in ${delayMs}ms (attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        retries++;
      } else {
        // For other errors, don't retry
        break;
      }
    }
  }
  
  // If we've exhausted our retries or hit an error that's not 429, throw the error
  throw lastError;
}

/**
 * Converts Livescore API fixture format to our application fixture format
 */
function mapFixtureResponse(fixture: LivescoreFixtureResponse): FixtureResponse {
  // Default team images/logos if not available
  const defaultTeamLogo = 'https://lsm-static-prod.livescore.com/medium/generic-team.png';
  
  // Extract home team data safely with fallbacks
  const homeTeam = fixture.T1 && fixture.T1.length > 0 ? fixture.T1[0] : undefined;
  const homeTeamId = homeTeam?.Tid || '0';
  const homeTeamName = homeTeam?.Nm || 'Home Team';
  const homeTeamImg = homeTeam?.Img || 'generic-team';
  
  // Extract away team data safely with fallbacks
  const awayTeam = fixture.T2 && fixture.T2.length > 0 ? fixture.T2[0] : undefined;
  const awayTeamId = awayTeam?.Tid || '0';
  const awayTeamName = awayTeam?.Nm || 'Away Team';
  const awayTeamImg = awayTeam?.Img || 'generic-team';
  
  // Country code with fallback
  const countryCode = fixture.Ccd || 'generic';
  
  return {
    fixture: {
      id: parseInt(fixture.Eid || '0'),
      referee: null,
      timezone: 'UTC',
      date: fixture.Esd || new Date().toISOString(),
      timestamp: new Date(fixture.Esd || '').getTime() / 1000,
      periods: {
        first: null,
        second: null
      },
      venue: {
        id: null,
        name: fixture.Vnm || null,
        city: null
      },
      status: {
        long: getStatusLong(fixture.Eps),
        short: getStatusShort(fixture.Eps),
        elapsed: parseInt(fixture.Min || '0')
      }
    },
    league: {
      id: parseInt(fixture.Cid || '0'),
      name: fixture.Cnm || '',
      country: countryCode,
      logo: `https://lsm-static-prod.livescore.com/medium/${countryCode}.png`,
      flag: `https://lsm-static-prod.livescore.com/medium/${countryCode}.png`,
      season: new Date().getFullYear(),
      round: fixture.Scd || ''
    },
    teams: {
      home: {
        id: parseInt(homeTeamId),
        name: homeTeamName,
        logo: homeTeamImg ? `https://lsm-static-prod.livescore.com/medium/${homeTeamImg}.png` : defaultTeamLogo,
        winner: parseInt(fixture.Tr1 || '0') > parseInt(fixture.Tr2 || '0')
      },
      away: {
        id: parseInt(awayTeamId),
        name: awayTeamName,
        logo: awayTeamImg ? `https://lsm-static-prod.livescore.com/medium/${awayTeamImg}.png` : defaultTeamLogo,
        winner: parseInt(fixture.Tr2 || '0') > parseInt(fixture.Tr1 || '0')
      }
    },
    goals: {
      home: parseInt(fixture.Tr1 || '0'),
      away: parseInt(fixture.Tr2 || '0')
    },
    score: {
      halftime: {
        home: parseInt(fixture.Trh1 || '0'),
        away: parseInt(fixture.Trh2 || '0')
      },
      fulltime: {
        home: parseInt(fixture.Tr1 || '0'),
        away: parseInt(fixture.Tr2 || '0')
      },
      extratime: {
        home: null,
        away: null
      },
      penalty: {
        home: null,
        away: null
      }
    }
  };
}

/**
 * Maps Livescore status to our application status format
 */
function getStatusShort(status: string | undefined): string {
  if (!status) return 'NS'; // Not Started
  
  switch(status.toLowerCase()) {
    case 'finished':
    case 'ended':
      return 'FT'; // Full Time
    case 'in play':
    case 'live':
      return 'LIVE';
    case 'halftime':
    case 'ht':
      return 'HT'; // Half Time
    case 'postponed':
      return 'PST'; // Postponed
    case 'canceled':
    case 'cancelled':
      return 'CANC'; // Canceled
    case 'abandoned':
      return 'ABD'; // Abandoned
    case 'suspended':
      return 'SUSP'; // Suspended
    case 'interrupted':
      return 'INT'; // Interrupted
    case 'awaiting penalties':
      return 'PEN'; // Penalties
    case 'after penalties':
      return 'PEN'; // After Penalties
    case 'after extra time':
      return 'AET'; // After Extra Time
    default:
      return 'NS'; // Not Started
  }
}

/**
 * Maps Livescore status to long format
 */
function getStatusLong(status: string | undefined): string {
  if (!status) return 'Not Started';
  return status;
}

/**
 * Convert Livescore API league format to our application league format
 */
function mapLeagueResponse(league: LivescoreLeagueResponse): LeagueResponse {
  return {
    league: {
      id: parseInt(league.Id || '0'),
      name: league.CompN || '',
      type: league.CompT || 'League',
      logo: `https://lsm-static-prod.livescore.com/medium/${league.Ccd}.png`,
      country: league.CountryName || ''
    },
    country: {
      name: league.CountryName || '',
      code: league.Ccd || '',
      flag: `https://lsm-static-prod.livescore.com/medium/${league.Ccd}.png`
    },
    seasons: [
      {
        year: new Date().getFullYear(),
        start: format(new Date(), 'yyyy-MM-dd'),
        end: format(new Date(new Date().getFullYear() + 1, 5, 30), 'yyyy-MM-dd'),
        current: true
      }
    ]
  };
}

export const livescoreApiService = {
  /**
   * Get fixtures by date
   */
  async getFixturesByDate(date: string): Promise<FixtureResponse[]> {
    try {
      // Format date to "YYYYMMDD" for Livescore API
      const formattedDate = format(new Date(date), 'yyyyMMdd');
      
      // Use our resilient request method with exponential backoff and retries
      const data = await makeResilientRequest({
        method: 'get',
        url: `${BASE_URL}/matches/v2/list-by-date`,
        headers: HEADERS,
        params: {
          Category: 'soccer',
          Date: formattedDate,
          Timezone: '+0'
        }
      });
      
      if (!data?.Stages) {
        return [];
      }
      
      // Process and map the data to our application format
      const fixtures: FixtureResponse[] = [];
      
      data.Stages.forEach((stage: any) => {
        stage.Events?.forEach((event: LivescoreFixtureResponse) => {
          fixtures.push(mapFixtureResponse(event));
        });
      });
      
      return fixtures;
    } catch (error) {
      console.error('Error fetching fixtures by date:', error);
      return [];
    }
  },

  /**
   * Get live fixtures
   */
  async getLiveFixtures(): Promise<FixtureResponse[]> {
    try {
      // Use our resilient request method with exponential backoff and retries
      const data = await makeResilientRequest({
        method: 'get',
        url: `${BASE_URL}/matches/v2/list-live`,
        headers: HEADERS,
        params: {
          Category: 'soccer',
          Timezone: '+0'
        }
      });
      
      if (!data?.Stages) {
        return [];
      }
      
      // Process and map the data to our application format
      const fixtures: FixtureResponse[] = [];
      
      data.Stages.forEach((stage: any) => {
        stage.Events?.forEach((event: LivescoreFixtureResponse) => {
          fixtures.push(mapFixtureResponse(event));
        });
      });
      
      return fixtures;
    } catch (error) {
      console.error('Error fetching live fixtures:', error);
      return [];
    }
  },

  /**
   * Get fixture by ID
   */
  async getFixtureById(id: number): Promise<FixtureResponse | null> {
    try {
      const response = await axios.get(`${BASE_URL}/matches/v2/detail`, {
        headers: HEADERS,
        params: {
          Eid: id.toString(),
          Category: 'soccer'
        }
      });
      
      if (!response.data) {
        return null;
      }
      
      return mapFixtureResponse(response.data);
    } catch (error) {
      console.error('Error fetching fixture by ID:', error);
      return null;
    }
  },

  /**
   * Get fixtures by league ID and season
   */
  async getFixturesByLeague(leagueId: number, season: number): Promise<FixtureResponse[]> {
    try {
      // Use our resilient request method with exponential backoff and retries
      const data = await makeResilientRequest({
        method: 'get',
        url: `${BASE_URL}/matches/v2/list-by-league`,
        headers: HEADERS,
        params: {
          Category: 'soccer',
          Cid: leagueId.toString()
        }
      });
      
      if (!data?.Stages) {
        return [];
      }
      
      // Process and map the data to our application format
      const fixtures: FixtureResponse[] = [];
      
      data.Stages.forEach((stage: any) => {
        stage.Events?.forEach((event: LivescoreFixtureResponse) => {
          fixtures.push(mapFixtureResponse(event));
        });
      });
      
      // Log successful retrieval for monitoring
      console.log(`Received ${fixtures.length} fixtures for league ${leagueId} from RapidAPI`);
      
      return fixtures;
    } catch (error) {
      console.error('Error fetching fixtures by league:', error);
      return [];
    }
  },

  /**
   * Get all available leagues
   */
  async getLeagues(): Promise<LeagueResponse[]> {
    try {
      const response = await axios.get(`${BASE_URL}/leagues/list`, {
        headers: HEADERS,
        params: {
          Category: 'soccer'
        }
      });
      
      if (!response.data?.Ccg) {
        return [];
      }
      
      // Process and map the data to our application format
      const leagues: LeagueResponse[] = [];
      
      response.data.Ccg.forEach((countryGroup: any) => {
        countryGroup.Ccd.forEach((country: any) => {
          country.Stages.forEach((league: LivescoreLeagueResponse) => {
            // Add country information to the league object
            league.CountryName = country.Cnm || '';
            league.Ccd = country.Ccd || '';
            leagues.push(mapLeagueResponse(league));
          });
        });
      });
      
      return leagues;
    } catch (error) {
      console.error('Error fetching leagues:', error);
      return [];
    }
  },

  /**
   * Get league by ID
   */
  async getLeagueById(id: number): Promise<LeagueResponse | null> {
    try {
      // First get all leagues
      const leagues = await this.getLeagues();
      
      // Find the league by ID
      const league = leagues.find(l => l.league.id === id);
      
      return league || null;
    } catch (error) {
      console.error('Error fetching league by ID:', error);
      return null;
    }
  },

  /**
   * Get top scorers for a league and season
   */
  async getTopScorers(leagueId: number, season: number): Promise<any[]> {
    try {
      const response = await axios.get(`${BASE_URL}/statistics/v2/player/goalscorers`, {
        headers: HEADERS,
        params: {
          Category: 'soccer',
          Cid: leagueId.toString()
        }
      });
      
      if (!response.data?.Statistics) {
        return [];
      }
      
      // Process and map the data to our application format
      // This would require more complex mapping as the data structure is different
      return response.data.Statistics;
    } catch (error) {
      console.error('Error fetching top scorers:', error);
      return [];
    }
  },

  /**
   * Get league standings by league ID and season
   */
  async getLeagueStandings(leagueId: number, season: number): Promise<LivescoreStandingsResponse | null> {
    try {
      const response = await axios.get(`${BASE_URL}/leagues/table`, {
        headers: HEADERS,
        params: {
          Category: 'soccer',
          Cid: leagueId.toString()
        }
      });
      
      if (!response.data?.LeagueTable) {
        return null;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching league standings:', error);
      return null;
    }
  }
};