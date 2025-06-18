
import { parseISO, isValid, format } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export interface TournamentTimezoneConfig {
  leagueId: number;
  name: string;
  timezone: string;
  matchDayStart: string; // Time in tournament timezone when "match day" starts (e.g., "06:00")
}

// Tournament-specific timezone configurations
const TOURNAMENT_TIMEZONES: TournamentTimezoneConfig[] = [
  // FIFA Club World Cup (USA)
  { leagueId: 15, name: "FIFA Club World Cup", timezone: "America/New_York", matchDayStart: "06:00" },
  // CONCACAF Gold Cup (varies, using Central Time)
  { leagueId: 16, name: "CONCACAF Gold Cup", timezone: "America/Chicago", matchDayStart: "06:00" },
  // UEFA competitions (Central European Time)
  { leagueId: 2, name: "UEFA Champions League", timezone: "Europe/Berlin", matchDayStart: "06:00" },
  { leagueId: 3, name: "UEFA Europa League", timezone: "Europe/Berlin", matchDayStart: "06:00" },
  { leagueId: 848, name: "UEFA Conference League", timezone: "Europe/Berlin", matchDayStart: "06:00" },
  // UEFA Youth and International competitions
  { leagueId: 38, name: "UEFA U21 Championship", timezone: "Europe/Berlin", matchDayStart: "06:00" },
  { leagueId: 5, name: "UEFA Nations League", timezone: "Europe/Berlin", matchDayStart: "06:00" },
  { leagueId: 4, name: "Euro Championship", timezone: "Europe/Berlin", matchDayStart: "06:00" },
  { leagueId: 1, name: "World Cup", timezone: "UTC", matchDayStart: "06:00" }, // Varies by host
  // Copa America (varies by host country)
  { leagueId: 9, name: "Copa America", timezone: "America/Santiago", matchDayStart: "06:00" },
  // Asian Cup
  { leagueId: 22, name: "Asian Cup", timezone: "Asia/Tokyo", matchDayStart: "06:00" },
  // Africa Cup of Nations
  { leagueId: 6, name: "Africa Cup of Nations", timezone: "Africa/Cairo", matchDayStart: "06:00" },
  // Olympic Football Tournaments
  { leagueId: 480, name: "Olympics Men", timezone: "UTC", matchDayStart: "06:00" }, // Varies by host
  { leagueId: 481, name: "Olympics Women", timezone: "UTC", matchDayStart: "06:00" }, // Varies by host
];

// Default configuration for leagues without specific timezone settings
const DEFAULT_CONFIG: TournamentTimezoneConfig = {
  leagueId: 0,
  name: "Default",
  timezone: "UTC",
  matchDayStart: "06:00"
};

export class MyNewDateTimeConverter {
  private clientTimezone: string;
  private tournamentConfigs: Map<number, TournamentTimezoneConfig>;

  constructor(clientTimezone?: string) {
    // Detect client timezone if not provided
    this.clientTimezone = clientTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.tournamentConfigs = new Map(
      TOURNAMENT_TIMEZONES.map(config => [config.leagueId, config])
    );
  }

  /**
   * Get tournament configuration for a specific league
   */
  private getTournamentConfig(leagueId?: number): TournamentTimezoneConfig {
    if (!leagueId) {
      console.log(`🌍 [DateTimeConverter] No league ID provided, using default UTC timezone`);
      return DEFAULT_CONFIG;
    }
    
    const config = this.tournamentConfigs.get(leagueId);
    if (config) {
      console.log(`🌍 [DateTimeConverter] League ${leagueId} (${config.name}) using timezone: ${config.timezone}`);
      return config;
    } else {
      console.log(`⚠️ [DateTimeConverter] League ${leagueId} not configured, using default UTC timezone`);
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Convert match datetime from tournament timezone to client timezone and determine match day
   */
  convertMatchToClientTime(matchDatetime: string, leagueId?: number): {
    clientTime: Date;
    clientTimeString: string;
    tournamentMatchDay: string;
    clientMatchDay: string;
    tournamentTimezone: string;
    clientTimezone: string;
  } {
    try {
      const config = this.getTournamentConfig(leagueId);
      
      // Parse the original datetime (should be in ISO format)
      const originalDate = parseISO(matchDatetime);
      
      if (!isValid(originalDate)) {
        throw new Error(`Invalid date format: ${matchDatetime}`);
      }

      // Convert original UTC time to tournament timezone
      const tournamentTime = toZonedTime(originalDate, config.timezone);
      
      // Determine tournament match day based on tournament timezone
      const tournamentMatchDay = this.getTournamentMatchDay(tournamentTime, config);
      
      // Convert to client timezone
      const clientTime = toZonedTime(originalDate, this.clientTimezone);
      const clientTimeString = formatInTimeZone(originalDate, this.clientTimezone, 'yyyy-MM-dd HH:mm:ss zzz');
      
      // Determine client match day
      const clientMatchDay = format(clientTime, 'yyyy-MM-dd');

      return {
        clientTime,
        clientTimeString,
        tournamentMatchDay,
        clientMatchDay,
        tournamentTimezone: config.timezone,
        clientTimezone: this.clientTimezone
      };
    } catch (error) {
      console.error('Error converting match time:', error);
      // Fallback to basic parsing
      const fallbackDate = parseISO(matchDatetime);
      return {
        clientTime: fallbackDate,
        clientTimeString: format(fallbackDate, 'yyyy-MM-dd HH:mm:ss'),
        tournamentMatchDay: format(fallbackDate, 'yyyy-MM-dd'),
        clientMatchDay: format(fallbackDate, 'yyyy-MM-dd'),
        tournamentTimezone: 'UTC',
        clientTimezone: this.clientTimezone
      };
    }
  }

  /**
   * Determine tournament match day based on tournament-specific logic
   */
  private getTournamentMatchDay(tournamentTime: Date, config: TournamentTimezoneConfig): string {
    try {
      // Parse match day start time
      const [startHour, startMinute] = config.matchDayStart.split(':').map(Number);
      
      // Get the tournament time
      const matchHour = tournamentTime.getHours();
      const matchMinute = tournamentTime.getMinutes();
      
      // If match is before the "match day start" time, it belongs to the previous day
      const matchMinutesSinceMidnight = matchHour * 60 + matchMinute;
      const dayStartMinutes = startHour * 60 + startMinute;
      
      let adjustedDate = new Date(tournamentTime);
      
      if (matchMinutesSinceMidnight < dayStartMinutes) {
        // Match is early morning, belongs to previous day
        adjustedDate.setDate(adjustedDate.getDate() - 1);
      }
      
      return format(adjustedDate, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Error determining tournament match day:', error);
      return format(tournamentTime, 'yyyy-MM-dd');
    }
  }

  /**
   * Group matches by tournament match days
   */
  groupMatchesByTournamentDay(matches: any[]): Map<string, any[]> {
    const groupedMatches = new Map<string, any[]>();

    matches.forEach(match => {
      try {
        const matchDatetime = match.fixture?.date || match.date;
        const leagueId = match.league?.id;

        if (!matchDatetime) {
          console.warn('Match without date found:', match);
          return;
        }

        const { tournamentMatchDay } = this.convertMatchToClientTime(matchDatetime, leagueId);

        if (!groupedMatches.has(tournamentMatchDay)) {
          groupedMatches.set(tournamentMatchDay, []);
        }

        groupedMatches.get(tournamentMatchDay)!.push({
          ...match,
          convertedTime: this.convertMatchToClientTime(matchDatetime, leagueId)
        });
      } catch (error) {
        console.error('Error processing match for grouping:', error, match);
      }
    });

    return groupedMatches;
  }

  /**
   * Filter matches for a specific tournament match day or client date
   */
  filterMatchesForDate(matches: any[], targetDate: string, useClientTimezone: boolean = false): any[] {
    return matches.filter(match => {
      try {
        const matchDatetime = match.fixture?.date || match.date;
        const leagueId = match.league?.id;

        if (!matchDatetime) {
          return false;
        }

        const { tournamentMatchDay, clientMatchDay } = this.convertMatchToClientTime(matchDatetime, leagueId);
        
        if (useClientTimezone) {
          return clientMatchDay === targetDate;
        } else {
          return tournamentMatchDay === targetDate;
        }
      } catch (error) {
        console.error('Error filtering match for date:', error, match);
        return false;
      }
    });
  }

  /**
   * Check if a match is on a specific date (considering tournament timezone)
   */
  isMatchOnDate(matchDatetime: string, targetDate: string, leagueId?: number): { 
    isMatch: boolean; 
    reason: string;
    tournamentMatchDay: string;
    clientMatchDay: string;
  } {
    try {
      const { tournamentMatchDay, clientMatchDay } = this.convertMatchToClientTime(matchDatetime, leagueId);
      
      const isMatch = tournamentMatchDay === targetDate;
      
      return {
        isMatch,
        reason: isMatch 
          ? `Tournament match day ${tournamentMatchDay} matches target date ${targetDate}` 
          : `Tournament match day ${tournamentMatchDay} does not match target date ${targetDate}`,
        tournamentMatchDay,
        clientMatchDay
      };
    } catch (error) {
      console.error('Error checking if match is on date:', error);
      return {
        isMatch: false,
        reason: `Error checking date: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tournamentMatchDay: '',
        clientMatchDay: ''
      };
    }
  }

  /**
   * Get current client date
   */
  getCurrentClientDate(): string {
    const now = new Date();
    const clientNow = toZonedTime(now, this.clientTimezone);
    return format(clientNow, 'yyyy-MM-dd');
  }

  /**
   * Static method for quick date checking
   */
  static isFixtureOnDate(
    fixtureDateTime: string, 
    targetDate: string, 
    leagueId?: number, 
    leagueName?: string
  ): { isMatch: boolean; reason: string } {
    try {
      const converter = new MyNewDateTimeConverter();
      const { isMatch, reason } = converter.isMatchOnDate(fixtureDateTime, targetDate, leagueId);
      
      return { isMatch, reason };
    } catch (error) {
      console.error('Error checking if fixture is on date:', error);
      return {
        isMatch: false,
        reason: `Error checking date: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export utility functions
export const createDateTimeConverter = (clientTimezone?: string) => {
  return new MyNewDateTimeConverter(clientTimezone);
};

export const convertMatchToClientTimezone = (
  matchDatetime: string, 
  clientTimezone?: string, 
  leagueId?: number
) => {
  const converter = new MyNewDateTimeConverter(clientTimezone);
  return converter.convertMatchToClientTime(matchDatetime, leagueId);
};
