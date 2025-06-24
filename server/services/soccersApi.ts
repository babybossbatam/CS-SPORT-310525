
import axios from 'axios';

// SoccersAPI Configuration
const SOCCERS_API_BASE_URL = 'https://api.soccersapi.com/v2.2';
const SOCCERS_API_USER = 'noname051188';
const SOCCERS_API_TOKEN = '682332cd2df08e20ab52928dae60122c';

// Base API configuration
const apiClient = axios.create({
  baseURL: SOCCERS_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'CSSPORT-API/1.0'
  }
});

// Helper function for making API requests
async function makeRequest(endpoint: string, params: any = {}): Promise<any> {
  try {
    const requestParams = {
      user: SOCCERS_API_USER,
      token: SOCCERS_API_TOKEN,
      ...params
    };

    console.log(`🏈 [SoccersAPI] Making request to: ${endpoint}`, requestParams);

    const response = await apiClient.get(endpoint, { 
      params: requestParams 
    });

    console.log(`✅ [SoccersAPI] Response status: ${response.status}`);
    
    if (response.data) {
      return response.data;
    } else {
      throw new Error('No data received from SoccersAPI');
    }
  } catch (error) {
    console.error(`❌ [SoccersAPI] Error making request to ${endpoint}:`, error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        console.log('⏰ [SoccersAPI] Rate limit hit, waiting before retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return makeRequest(endpoint, params);
      }
      
      throw new Error(`SoccersAPI error: ${error.response?.status} - ${error.response?.statusText}`);
    }
    
    throw error;
  }
}

// Get all leagues
export async function getLeagues(): Promise<any[]> {
  try {
    const data = await makeRequest('/leagues/', { t: 'list' });
    console.log(`📊 [SoccersAPI] Retrieved ${data?.data?.length || 0} leagues`);
    return data?.data || [];
  } catch (error) {
    console.error('❌ [SoccersAPI] Error fetching leagues:', error);
    return [];
  }
}

// Get live matches
export async function getLiveMatches(): Promise<any[]> {
  try {
    const data = await makeRequest('/matches/', { 
      t: 'list',
      d: new Date().toISOString().split('T')[0], // Today's date
      st: 'live' // Live status
    });
    
    console.log(`🔴 [SoccersAPI] Retrieved ${data?.data?.length || 0} live matches`);
    return data?.data || [];
  } catch (error) {
    console.error('❌ [SoccersAPI] Error fetching live matches:', error);
    return [];
  }
}

// Get match details with live events
export async function getMatchDetails(matchId: string): Promise<any> {
  try {
    const data = await makeRequest('/matches/', { 
      t: 'info',
      id: matchId
    });
    
    console.log(`📋 [SoccersAPI] Retrieved match details for ID: ${matchId}`);
    return data?.data || null;
  } catch (error) {
    console.error(`❌ [SoccersAPI] Error fetching match details for ${matchId}:`, error);
    return null;
  }
}

// Get live events for a specific match
export async function getMatchEvents(matchId: string): Promise<any[]> {
  try {
    const data = await makeRequest('/matches/', { 
      t: 'events',
      id: matchId
    });
    
    console.log(`⚽ [SoccersAPI] Retrieved ${data?.data?.length || 0} events for match: ${matchId}`);
    return data?.data || [];
  } catch (error) {
    console.error(`❌ [SoccersAPI] Error fetching events for match ${matchId}:`, error);
    return [];
  }
}

// Get live statistics for a specific match
export async function getMatchStatistics(matchId: string): Promise<any> {
  try {
    const data = await makeRequest('/matches/', { 
      t: 'stats',
      id: matchId
    });
    
    console.log(`📊 [SoccersAPI] Retrieved statistics for match: ${matchId}`);
    return data?.data || null;
  } catch (error) {
    console.error(`❌ [SoccersAPI] Error fetching statistics for match ${matchId}:`, error);
    return null;
  }
}

// Get live lineups for a specific match
export async function getMatchLineups(matchId: string): Promise<any> {
  try {
    const data = await makeRequest('/matches/', { 
      t: 'lineups',
      id: matchId
    });
    
    console.log(`👥 [SoccersAPI] Retrieved lineups for match: ${matchId}`);
    return data?.data || null;
  } catch (error) {
    console.error(`❌ [SoccersAPI] Error fetching lineups for match ${matchId}:`, error);
    return null;
  }
}

// Convert SoccersAPI match data to our internal format
export function mapSoccersApiToInternal(match: any): any {
  return {
    fixture: {
      id: match.id,
      referee: match.referee || null,
      timezone: 'UTC',
      date: match.date_start || '',
      timestamp: new Date(match.date_start || '').getTime() / 1000,
      status: {
        long: match.status_name || 'Not Started',
        short: mapStatusShort(match.status || ''),
        elapsed: match.time || null
      }
    },
    league: {
      id: match.league_id || 0,
      name: match.league_name || '',
      country: match.country_name || '',
      logo: match.league_logo || null,
      season: match.season || new Date().getFullYear()
    },
    teams: {
      home: {
        id: match.home_team_id || 0,
        name: match.home_team_name || '',
        logo: match.home_team_logo || null
      },
      away: {
        id: match.away_team_id || 0,
        name: match.away_team_name || '',
        logo: match.away_team_logo || null
      }
    },
    goals: {
      home: match.score_home || 0,
      away: match.score_away || 0
    }
  };
}

// Map SoccersAPI status to short format
function mapStatusShort(status: string): string {
  switch (status?.toLowerCase()) {
    case 'live':
    case 'inplay':
      return 'LIVE';
    case 'finished':
    case 'ended':
      return 'FT';
    case 'halftime':
      return 'HT';
    case 'not_started':
    case 'scheduled':
      return 'NS';
    case 'postponed':
      return 'PST';
    case 'cancelled':
      return 'CANC';
    default:
      return status?.substring(0, 3)?.toUpperCase() || 'NS';
  }
}

export default {
  getLeagues,
  getLiveMatches,
  getMatchDetails,
  getMatchEvents,
  getMatchStatistics,
  getMatchLineups,
  mapSoccersApiToInternal
};
