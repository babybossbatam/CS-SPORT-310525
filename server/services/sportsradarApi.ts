import axios from 'axios';
import { RapidApiResponse, SportsradarFixture, SportsradarLeague } from '../types';

// Constants
const SPORTSRADAR_API_HOST = 'sportsradar-sportsbook-api.p.rapidapi.com';
const API_KEY = process.env.RAPID_API_KEY;

// Base API configuration
const apiClient = axios.create({
  baseURL: 'https://sportsradar-sportsbook-api.p.rapidapi.com/api/v1/sportsradar',
  headers: {
    'x-rapidapi-key': API_KEY || '',
    'x-rapidapi-host': SPORTSRADAR_API_HOST,
    'Content-Type': 'application/json'
  }
});

// Helper function for making API requests with rate limit handling
async function makeRequest(url: string, params: any = {}): Promise<any> {
  try {
    const response = await apiClient.get(url, { params });
    
    // Check if response has the expected structure
    if (response.data && response.data.success === true) {
      // Different endpoints have different data structures - check for common response formats
      if (response.data.sports) {
        return response.data.sports;
      } else if (response.data.tournaments) {
        return response.data.tournaments;
      } else if (response.data.matches) {
        return response.data.matches;
      } else if (response.data.data) {
        return response.data.data;
      } else {
        // If we don't recognize the format, return the whole data object
        console.log('Unrecognized response format:', Object.keys(response.data));
        return response.data;
      }
    } else {
      // API returned an error
      console.error('API error:', response.data);
      throw new Error(response.data?.message || 'Unknown API error');
    }
  } catch (error) {
    console.error(`Error making API request to ${url}:`, error);
    
    // If we hit a rate limit, wait and try again (exponential backoff)
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      console.log('Rate limit hit, waiting before retrying...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return makeRequest(url, params);
    }
    
    throw error;
  }
}

// Get all sports
export async function getAllSports() {
  return makeRequest('/allsports');
}

// Get all football/soccer leagues
export async function getFootballLeagues() {
  // Soccer is always sport ID "sr:sport:1" in SportsRadar
  const SOCCER_ID = 'sr:sport:1';
  
  try {
    console.log(`Getting soccer leagues with ID: ${SOCCER_ID}`);
    return makeRequest(`/sports/${SOCCER_ID}/tournaments`);
  } catch (error) {
    console.error('Error getting soccer leagues:', error);
    throw error;
  }
}

// Get fixtures for a specific league
export async function getFixturesByLeague(leagueId: string) {
  return makeRequest(`/tournaments/${leagueId}/matches`);
}

// Get fixtures for a specific date
export async function getFixturesByDate(date: string) {
  // Format date as YYYY-MM-DD if needed
  return makeRequest('/matches/date', { date });
}

// Get live fixtures
export async function getLiveFixtures() {
  return makeRequest('/matches/live');
}

// Get league details
export async function getLeagueDetails(leagueId: string) {
  return makeRequest(`/tournaments/${leagueId}`);
}

// Get top scorers for a league
export async function getTopScorers(leagueId: string) {
  return makeRequest(`/tournaments/${leagueId}/top-scorers`);
}

// Get standings for a league
export async function getStandings(leagueId: string) {
  return makeRequest(`/tournaments/${leagueId}/standings`);
}

// Map Sportsradar data to our internal format
export function mapSportsradarFixtureToInternal(fixture: SportsradarFixture): any {
  // Implement mapping logic based on the Sportsradar response structure
  return {
    fixture: {
      id: fixture.id,
      referee: fixture.referee || null,
      timezone: fixture.timezone || 'UTC',
      date: fixture.scheduled || '',
      timestamp: new Date(fixture.scheduled || '').getTime() / 1000,
      periods: {
        first: null,
        second: null
      },
      venue: {
        id: null,
        name: fixture.venue?.name || null,
        city: fixture.venue?.city || null
      },
      status: {
        long: fixture.status || 'Not Started',
        short: getStatusShort(fixture.status || ''),
        elapsed: fixture.minute || null
      }
    },
    league: {
      id: fixture.tournament?.id || 0,
      name: fixture.tournament?.name || '',
      country: fixture.tournament?.category?.name || '',
      logo: fixture.tournament?.logo || `https://sportsradar-sportsbook-api.p.rapidapi.com/api/v1/sportsradar/tournaments/${fixture.tournament?.id}/logo`,
      flag: fixture.tournament?.category?.cc ? `https://sportsradar-sportsbook-api.p.rapidapi.com/api/v1/sportsradar/countries/${fixture.tournament?.category?.cc}/flag` : null,
      season: new Date().getFullYear(),
      round: fixture.round?.name || ''
    },
    teams: {
      home: {
        id: fixture.home_team?.id || 0,
        name: fixture.home_team?.name || '',
        logo: fixture.home_team?.logo || `https://sportsradar-sportsbook-api.p.rapidapi.com/api/v1/sportsradar/teams/${fixture.home_team?.id}/logo`,
        winner: isWinner(fixture, 'home')
      },
      away: {
        id: fixture.away_team?.id || 0,
        name: fixture.away_team?.name || '',
        logo: fixture.away_team?.logo || `https://sportsradar-sportsbook-api.p.rapidapi.com/api/v1/sportsradar/teams/${fixture.away_team?.id}/logo`,
        winner: isWinner(fixture, 'away')
      }
    },
    goals: {
      home: fixture.home_score || 0,
      away: fixture.away_score || 0
    },
    score: {
      halftime: {
        home: fixture.home_score_half_1 || null,
        away: fixture.away_score_half_1 || null
      },
      fulltime: {
        home: fixture.home_score || null,
        away: fixture.away_score || null
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

// Helper functions
function getStatusShort(status: string): string {
  switch (status.toLowerCase()) {
    case 'not started':
      return 'NS';
    case 'live':
    case 'in progress':
      return 'LIVE';
    case 'half time':
      return 'HT';
    case 'finished':
    case 'ended':
      return 'FT';
    case 'postponed':
      return 'PST';
    case 'cancelled':
      return 'CANC';
    default:
      return status.substring(0, 3).toUpperCase();
  }
}

function isWinner(fixture: SportsradarFixture, team: 'home' | 'away'): boolean | undefined {
  if (!fixture.status || !['finished', 'ended'].includes(fixture.status.toLowerCase())) {
    return undefined;
  }
  
  const homeScore = fixture.home_score || 0;
  const awayScore = fixture.away_score || 0;
  
  if (homeScore === awayScore) {
    return false;
  }
  
  return team === 'home' ? homeScore > awayScore : awayScore > homeScore;
}

export default {
  getAllSports,
  getFootballLeagues,
  getFixturesByLeague,
  getFixturesByDate,
  getLiveFixtures,
  getLeagueDetails,
  getTopScorers,
  getStandings,
  mapSportsradarFixtureToInternal
};