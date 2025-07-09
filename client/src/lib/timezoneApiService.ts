
import { detectUserTimezone, getTimezoneAwareAPIParams, createTimezoneAwareDateFilter } from './timezoneDetection';
import { apiRequest } from './utils';

/**
 * Fetch fixtures for a specific date with timezone awareness
 */
export async function fetchFixturesWithTimezone(
  selectedDate: string,
  leagueId?: number
): Promise<any[]> {
  try {
    const timezoneParams = getTimezoneAwareAPIParams();
    const dateFilter = createTimezoneAwareDateFilter(selectedDate);
    
    console.log('🌍 [TIMEZONE API] Fetching fixtures with timezone:', {
      selectedDate,
      timezone: timezoneParams.timezone,
      offset: timezoneParams.offset,
      leagueId
    });
    
    const params = {
      date: selectedDate,
      timezone: timezoneParams.timezone,
      ...(leagueId && { league: leagueId })
    };
    
    const response = await apiRequest('GET', '/api/fixtures/date/' + selectedDate, {
      params
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch fixtures: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ [TIMEZONE API] Retrieved fixtures:', {
      count: data.length,
      timezone: timezoneParams.timezone,
      sampleFixture: data[0] ? {
        teams: `${data[0].teams?.home?.name} vs ${data[0].teams?.away?.name}`,
        date: data[0].fixture?.date,
        status: data[0].fixture?.status?.short
      } : null
    });
    
    return data;
  } catch (error) {
    console.error('❌ [TIMEZONE API] Error fetching fixtures:', error);
    throw error;
  }
}

/**
 * Fetch live matches with timezone awareness
 */
export async function fetchLiveMatchesWithTimezone(): Promise<any[]> {
  try {
    const timezoneParams = getTimezoneAwareAPIParams();
    
    console.log('🔴 [TIMEZONE API] Fetching live matches with timezone:', timezoneParams);
    
    const params = {
      timezone: timezoneParams.timezone,
      live: true
    };
    
    const response = await apiRequest('GET', '/api/fixtures/live', {
      params
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch live matches: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ [TIMEZONE API] Retrieved live matches:', {
      count: data.length,
      timezone: timezoneParams.timezone
    });
    
    return data;
  } catch (error) {
    console.error('❌ [TIMEZONE API] Error fetching live matches:', error);
    throw error;
  }
}

/**
 * Fetch league fixtures with timezone awareness
 */
export async function fetchLeagueFixturesWithTimezone(
  leagueId: number,
  season?: number
): Promise<any[]> {
  try {
    const timezoneParams = getTimezoneAwareAPIParams();
    
    console.log('🏆 [TIMEZONE API] Fetching league fixtures with timezone:', {
      leagueId,
      season,
      timezone: timezoneParams.timezone
    });
    
    const params = {
      timezone: timezoneParams.timezone,
      ...(season && { season })
    };
    
    const response = await apiRequest('GET', `/api/leagues/${leagueId}/fixtures`, {
      params
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch league fixtures: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ [TIMEZONE API] Retrieved league fixtures:', {
      leagueId,
      count: data.length,
      timezone: timezoneParams.timezone
    });
    
    return data;
  } catch (error) {
    console.error('❌ [TIMEZONE API] Error fetching league fixtures:', error);
    throw error;
  }
}

/**
 * Create timezone-aware match time display
 */
export function formatMatchTimeWithTimezone(
  matchDate: string,
  formatString: string = 'HH:mm'
): string {
  try {
    const timezoneInfo = detectUserTimezone();
    const date = new Date(matchDate);
    
    // Format time in user's timezone
    const formattedTime = new Intl.DateTimeFormat('en-US', {
      timeZone: timezoneInfo.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
    
    return formattedTime;
  } catch (error) {
    console.error('Error formatting match time with timezone:', error);
    return new Date(matchDate).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
}

/**
 * Get timezone-aware date range for API requests
 */
export function getTimezoneAwareDateRange(date: string): {
  from: string;
  to: string;
  timezone: string;
} {
  const timezoneInfo = detectUserTimezone();
  
  return {
    from: `${date}T00:00:00`,
    to: `${date}T23:59:59`,
    timezone: timezoneInfo.timezone
  };
}

export default {
  fetchFixturesWithTimezone,
  fetchLiveMatchesWithTimezone,
  fetchLeagueFixturesWithTimezone,
  formatMatchTimeWithTimezone,
  getTimezoneAwareDateRange
};
