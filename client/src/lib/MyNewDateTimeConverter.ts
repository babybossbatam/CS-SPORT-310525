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
  // Copa America (varies by host country)
  { leagueId: 9, name: "Copa America", timezone: "America/Santiago", matchDayStart: "06:00" },
  // Asian Cup
  { leagueId: 22, name: "Asian Cup", timezone: "Asia/Tokyo", matchDayStart: "06:00" },
  // Africa Cup of Nations
  { leagueId: 6, name: "Africa Cup of Nations", timezone: "Africa/Cairo", matchDayStart: "06:00" },
];

// Default configuration for leagues without specific timezone settings
const DEFAULT_CONFIG: TournamentTimezoneConfig = {
  leagueId: 0,
  name: "Default",
  timezone: "UTC",
  matchDayStart: "06:00"
};

export class MyNewDateTimeConverter {
  private userTimezone: string;
  private tournamentConfigs: Map<number, TournamentTimezoneConfig>;

  constructor(userTimezone: string = 'Asia/Manila') {
    this.userTimezone = userTimezone;
    this.tournamentConfigs = new Map(
      TOURNAMENT_TIMEZONES.map(config => [config.leagueId, config])
    );
  }

  /**
   * Get tournament configuration for a specific league
   */
  private getTournamentConfig(leagueId?: number): TournamentTimezoneConfig {
    if (!leagueId) return DEFAULT_CONFIG;
    return this.tournamentConfigs.get(leagueId) || DEFAULT_CONFIG;
  }

  /**
   * Convert match time to user's local timezone without UTC centralization
   */
  convertToUserTimezone(matchDatetime: string, leagueId?: number): {
    userTime: Date;
    userTimeString: string;
    originalTimezone: string;
    matchDay: string;
  } {
    try {
      const config = this.getTournamentConfig(leagueId);

      // Parse the original datetime (assuming it comes in ISO format)
      const originalDate = parseISO(matchDatetime);

      if (!isValid(originalDate)) {
        throw new Error(`Invalid date format: ${matchDatetime}`);
      }

      // If the datetime has timezone info, use it; otherwise assume tournament timezone
      let sourceTimezone = config.timezone;

      // Check if the datetime string contains timezone information
      if (matchDatetime.includes('+') || matchDatetime.includes('Z')) {
        // Use the timezone from the datetime string
        sourceTimezone = matchDatetime.endsWith('Z') ? 'UTC' : 'UTC'; // Will be handled by date-fns-tz
      }

      // Convert to user's timezone
      const userTime = toZonedTime(originalDate, this.userTimezone);
      const userTimeString = formatInTimeZone(originalDate, this.userTimezone, 'yyyy-MM-dd HH:mm:ss zzz');

      // Determine match day based on tournament timezone
      const tournamentTime = toZonedTime(originalDate, config.timezone);
      const matchDay = this.getMatchDay(tournamentTime, config);

      return {
        userTime,
        userTimeString,
        originalTimezone: sourceTimezone,
        matchDay
      };
    } catch (error) {
      console.error('Error converting timezone:', error);
      // Fallback to original parsing
      const fallbackDate = parseISO(matchDatetime);
      return {
        userTime: fallbackDate,
        userTimeString: format(fallbackDate, 'yyyy-MM-dd HH:mm:ss'),
        originalTimezone: 'Unknown',
        matchDay: format(fallbackDate, 'yyyy-MM-dd')
      };
    }
  }

  /**
   * Determine match day based on tournament-specific logic
   */
  private getMatchDay(tournamentTime: Date, config: TournamentTimezoneConfig): string {
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
      console.error('Error determining match day:', error);
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

        const { matchDay } = this.convertToUserTimezone(matchDatetime, leagueId);

        if (!groupedMatches.has(matchDay)) {
          groupedMatches.set(matchDay, []);
        }

        groupedMatches.get(matchDay)!.push({
          ...match,
          convertedTime: this.convertToUserTimezone(matchDatetime, leagueId)
        });
      } catch (error) {
        console.error('Error processing match for grouping:', error, match);
      }
    });

    return groupedMatches;
  }

  /**
   * Filter matches for a specific tournament match day
   */
  filterMatchesForTournamentDay(matches: any[], targetDay: string): any[] {
    const grouped = this.groupMatchesByTournamentDay(matches);
    return grouped.get(targetDay) || [];
  }

  /**
   * Get user's current date in their timezone
   */
  getCurrentUserDate(): string {
    const now = new Date();
    const userNow = toZonedTime(now, this.userTimezone);
    return format(userNow, 'yyyy-MM-dd');
  }

  /**
   * Check if a match is happening "today" based on tournament context
   */
  isMatchToday(matchDatetime: string, leagueId?: number): boolean {
    try {
      const { matchDay } = this.convertToUserTimezone(matchDatetime, leagueId);
      const currentUserDate = this.getCurrentUserDate();
      return matchDay === currentUserDate;
    } catch (error) {
      console.error('Error checking if match is today:', error);
      return false;
    }
  }

  /**
   * Static method to check if a fixture is on a specific date
   */
  static isFixtureOnDate(
    fixtureDateTime: string, 
    targetDate: string, 
    leagueId?: number, 
    leagueName?: string
  ): { isMatch: boolean; reason: string } {
    try {
      const converter = new MyNewDateTimeConverter('Asia/Manila');
      const { matchDay } = converter.convertToUserTimezone(fixtureDateTime, leagueId);
      
      const isMatch = matchDay === targetDate;
      
      return {
        isMatch,
        reason: isMatch 
          ? `Match day ${matchDay} matches target date ${targetDate}` 
          : `Match day ${matchDay} does not match target date ${targetDate}`
      };
    } catch (error) {
      console.error('Error checking if fixture is on date:', error);
      return {
        isMatch: false,
        reason: `Error checking date: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export utility functions for direct use
export const createDateTimeConverter = (userTimezone: string = 'Asia/Manila') => {
  return new MyNewDateTimeConverter(userTimezone);
};

export const convertMatchToUserTimezone = (
  matchDatetime: string, 
  userTimezone: string = 'Asia/Manila', 
  leagueId?: number
) => {
  const converter = new MyNewDateTimeConverter(userTimezone);
  return converter.convertToUserTimezone(matchDatetime, leagueId);
};