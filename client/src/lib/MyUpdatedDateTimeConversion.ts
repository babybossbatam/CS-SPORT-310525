
import { parseISO, isValid, format } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export interface TournamentTimezoneConfig {
  leagueId: number;
  name: string;
  timezone: string;
  matchDayStart: string; // Time in tournament timezone when "match day" starts (e.g., "06:00")
  country?: string;
}

// Comprehensive tournament-specific timezone configurations
const TOURNAMENT_TIMEZONES: TournamentTimezoneConfig[] = [
  // FIFA Competitions
  { leagueId: 15, name: "FIFA Club World Cup", timezone: "America/New_York", matchDayStart: "06:00", country: "USA" },
  { leagueId: 1, name: "World Cup", timezone: "UTC", matchDayStart: "06:00", country: "Varies" },
  
  // CONCACAF Competitions
  { leagueId: 16, name: "CONCACAF Gold Cup", timezone: "America/Chicago", matchDayStart: "06:00", country: "USA" },
  { leagueId: 26, name: "CONCACAF Champions League", timezone: "America/Mexico_City", matchDayStart: "06:00", country: "Mexico" },
  
  // UEFA Competitions (Central European Time)
  { leagueId: 2, name: "UEFA Champions League", timezone: "Europe/Berlin", matchDayStart: "06:00", country: "Europe" },
  { leagueId: 3, name: "UEFA Europa League", timezone: "Europe/Berlin", matchDayStart: "06:00", country: "Europe" },
  { leagueId: 848, name: "UEFA Conference League", timezone: "Europe/Berlin", matchDayStart: "06:00", country: "Europe" },
  { leagueId: 38, name: "UEFA U21 Championship", timezone: "Europe/Berlin", matchDayStart: "06:00", country: "Europe" },
  { leagueId: 5, name: "UEFA Nations League", timezone: "Europe/Berlin", matchDayStart: "06:00", country: "Europe" },
  { leagueId: 4, name: "Euro Championship", timezone: "Europe/Berlin", matchDayStart: "06:00", country: "Europe" },
  
  // South American Competitions
  { leagueId: 9, name: "Copa America", timezone: "America/Santiago", matchDayStart: "06:00", country: "Chile" },
  { leagueId: 13, name: "Copa Libertadores", timezone: "America/Sao_Paulo", matchDayStart: "06:00", country: "Brazil" },
  { leagueId: 11, name: "Copa Sudamericana", timezone: "America/Sao_Paulo", matchDayStart: "06:00", country: "Brazil" },
  
  // Asian Competitions
  { leagueId: 22, name: "Asian Cup", timezone: "Asia/Tokyo", matchDayStart: "06:00", country: "Japan" },
  { leagueId: 23, name: "AFC Champions League", timezone: "Asia/Dubai", matchDayStart: "06:00", country: "UAE" },
  
  // African Competitions
  { leagueId: 6, name: "Africa Cup of Nations", timezone: "Africa/Cairo", matchDayStart: "06:00", country: "Egypt" },
  { leagueId: 12, name: "CAF Champions League", timezone: "Africa/Cairo", matchDayStart: "06:00", country: "Egypt" },
  
  // Olympic Competitions
  { leagueId: 480, name: "Olympics Men", timezone: "UTC", matchDayStart: "06:00", country: "Varies" },
  { leagueId: 481, name: "Olympics Women", timezone: "UTC", matchDayStart: "06:00", country: "Varies" },
  
  // Major European League Competitions
  { leagueId: 39, name: "Premier League", timezone: "Europe/London", matchDayStart: "06:00", country: "England" },
  { leagueId: 140, name: "La Liga", timezone: "Europe/Madrid", matchDayStart: "06:00", country: "Spain" },
  { leagueId: 135, name: "Serie A", timezone: "Europe/Rome", matchDayStart: "06:00", country: "Italy" },
  { leagueId: 78, name: "Bundesliga", timezone: "Europe/Berlin", matchDayStart: "06:00", country: "Germany" },
  { leagueId: 61, name: "Ligue 1", timezone: "Europe/Paris", matchDayStart: "06:00", country: "France" },
  { leagueId: 94, name: "Primeira Liga", timezone: "Europe/Lisbon", matchDayStart: "06:00", country: "Portugal" },
  { leagueId: 88, name: "Eredivisie", timezone: "Europe/Amsterdam", matchDayStart: "06:00", country: "Netherlands" },
  
  // Major American Leagues
  { leagueId: 253, name: "Major League Soccer", timezone: "America/New_York", matchDayStart: "06:00", country: "USA" },
  { leagueId: 71, name: "Brasileiro Serie A", timezone: "America/Sao_Paulo", matchDayStart: "06:00", country: "Brazil" },
  { leagueId: 128, name: "Argentine Primera División", timezone: "America/Argentina/Buenos_Aires", matchDayStart: "06:00", country: "Argentina" },
  
  // Asian National Leagues
  { leagueId: 188, name: "J1 League", timezone: "Asia/Tokyo", matchDayStart: "06:00", country: "Japan" },
  { leagueId: 292, name: "K League 1", timezone: "Asia/Seoul", matchDayStart: "06:00", country: "South Korea" },
  { leagueId: 169, name: "Chinese Super League", timezone: "Asia/Shanghai", matchDayStart: "06:00", country: "China" },
];

// Default configuration for leagues without specific timezone settings
const DEFAULT_CONFIG: TournamentTimezoneConfig = {
  leagueId: 0,
  name: "Default",
  timezone: "UTC",
  matchDayStart: "06:00",
  country: "Unknown"
};

export class MyUpdatedDateTimeConversion {
  private clientTimezone: string;
  private tournamentConfigs: Map<number, TournamentTimezoneConfig>;

  constructor(clientTimezone?: string) {
    // Detect client timezone if not provided
    this.clientTimezone = clientTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.tournamentConfigs = new Map(
      TOURNAMENT_TIMEZONES.map(config => [config.leagueId, config])
    );
    
    console.log(`🌍 [DateTimeConversion] Initialized with client timezone: ${this.clientTimezone}`);
  }

  /**
   * 1. UTC Storage & API Response Handler
   * Receives match times in UTC from RapidAPI and validates format
   */
  private parseUTCDateTime(utcDateString: string): Date {
    if (!utcDateString || typeof utcDateString !== 'string') {
      throw new Error(`Invalid UTC date string: ${utcDateString}`);
    }

    // Ensure the date string is in ISO format from RapidAPI
    const utcDate = parseISO(utcDateString);
    
    if (!isValid(utcDate)) {
      throw new Error(`Invalid UTC date format: ${utcDateString}`);
    }

    console.log(`📡 [DateTimeConversion] Parsed UTC: ${utcDateString} → ${utcDate.toISOString()}`);
    return utcDate;
  }

  /**
   * 2. Tournament-Specific Timezone Mapping
   * Get tournament configuration for a specific league
   */
  private getTournamentConfig(leagueId?: number): TournamentTimezoneConfig {
    if (!leagueId) {
      console.log(`🌍 [DateTimeConversion] No league ID provided, using default UTC timezone`);
      return DEFAULT_CONFIG;
    }
    
    const config = this.tournamentConfigs.get(leagueId);
    if (config) {
      console.log(`🏆 [DateTimeConversion] League ${leagueId} (${config.name}) → ${config.timezone} (${config.country})`);
      return config;
    } else {
      console.log(`⚠️ [DateTimeConversion] League ${leagueId} not configured, using default UTC timezone`);
      return { ...DEFAULT_CONFIG, leagueId };
    }
  }

  /**
   * 3. Client-Side Conversion
   * Convert UTC → Tournament Timezone → User's Local Timezone
   */
  convertMatchDateTime(utcDateString: string, leagueId?: number): {
    // Original UTC data
    utcTime: Date;
    utcString: string;
    
    // Tournament timezone data
    tournamentTime: Date;
    tournamentTimeString: string;
    tournamentTimezone: string;
    tournamentMatchDay: string;
    
    // Client timezone data
    clientTime: Date;
    clientTimeString: string;
    clientTimezone: string;
    clientMatchDay: string;
    
    // Display helpers
    displayTime: string;
    displayDate: string;
    isToday: boolean;
    isTomorrow: boolean;
    isYesterday: boolean;
  } {
    try {
      // Step 1: Parse UTC from API
      const utcTime = this.parseUTCDateTime(utcDateString);
      const config = this.getTournamentConfig(leagueId);

      // Step 2: Convert UTC to Tournament Timezone
      const tournamentTime = toZonedTime(utcTime, config.timezone);
      const tournamentTimeString = formatInTimeZone(utcTime, config.timezone, 'yyyy-MM-dd HH:mm:ss zzz');
      
      // Step 3: Convert UTC to Client Timezone
      const clientTime = toZonedTime(utcTime, this.clientTimezone);
      const clientTimeString = formatInTimeZone(utcTime, this.clientTimezone, 'yyyy-MM-dd HH:mm:ss zzz');
      
      // Step 4: Determine match days using tournament timezone
      const tournamentMatchDay = this.getTournamentMatchDay(tournamentTime, config);
      const clientMatchDay = format(clientTime, 'yyyy-MM-dd');
      
      // Display helpers
      const displayTime = format(clientTime, 'HH:mm');
      const displayDate = format(clientTime, 'yyyy-MM-dd');
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const tomorrow = format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const yesterday = format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

      return {
        utcTime,
        utcString: utcTime.toISOString(),
        tournamentTime,
        tournamentTimeString,
        tournamentTimezone: config.timezone,
        tournamentMatchDay,
        clientTime,
        clientTimeString,
        clientTimezone: this.clientTimezone,
        clientMatchDay,
        displayTime,
        displayDate,
        isToday: displayDate === today,
        isTomorrow: displayDate === tomorrow,
        isYesterday: displayDate === yesterday
      };
    } catch (error) {
      console.error('❌ [DateTimeConversion] Error converting match time:', error);
      
      // Fallback to basic parsing
      const fallbackDate = new Date(utcDateString);
      const fallbackDisplay = format(fallbackDate, 'yyyy-MM-dd');
      
      return {
        utcTime: fallbackDate,
        utcString: fallbackDate.toISOString(),
        tournamentTime: fallbackDate,
        tournamentTimeString: format(fallbackDate, 'yyyy-MM-dd HH:mm:ss'),
        tournamentTimezone: 'UTC',
        tournamentMatchDay: format(fallbackDate, 'yyyy-MM-dd'),
        clientTime: fallbackDate,
        clientTimeString: format(fallbackDate, 'yyyy-MM-dd HH:mm:ss'),
        clientTimezone: this.clientTimezone,
        clientMatchDay: format(fallbackDate, 'yyyy-MM-dd'),
        displayTime: format(fallbackDate, 'HH:mm'),
        displayDate: fallbackDisplay,
        isToday: false,
        isTomorrow: false,
        isYesterday: false
      };
    }
  }

  /**
   * 4. Match Day Grouping
   * Group matches by "football day" rather than strict calendar dates
   */
  private getTournamentMatchDay(tournamentTime: Date, config: TournamentTimezoneConfig): string {
    try {
      // Parse match day start time (default: 6 AM)
      const [startHour, startMinute] = config.matchDayStart.split(':').map(Number);
      
      // Get the tournament time components
      const matchHour = tournamentTime.getHours();
      const matchMinute = tournamentTime.getMinutes();
      
      // Calculate minutes since midnight
      const matchMinutesSinceMidnight = matchHour * 60 + matchMinute;
      const dayStartMinutes = startHour * 60 + startMinute;
      
      let adjustedDate = new Date(tournamentTime);
      
      // If match is before the "match day start" time, it belongs to the previous day
      if (matchMinutesSinceMidnight < dayStartMinutes) {
        adjustedDate.setDate(adjustedDate.getDate() - 1);
        console.log(`🌅 [DateTimeConversion] Early morning match moved to previous day: ${format(adjustedDate, 'yyyy-MM-dd')}`);
      }
      
      return format(adjustedDate, 'yyyy-MM-dd');
    } catch (error) {
      console.error('❌ [DateTimeConversion] Error determining tournament match day:', error);
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
          console.warn('⚠️ [DateTimeConversion] Match without date found:', match);
          return;
        }

        const conversion = this.convertMatchDateTime(matchDatetime, leagueId);

        if (!groupedMatches.has(conversion.tournamentMatchDay)) {
          groupedMatches.set(conversion.tournamentMatchDay, []);
        }

        groupedMatches.get(conversion.tournamentMatchDay)!.push({
          ...match,
          dateTimeConversion: conversion
        });

        console.log(`📅 [DateTimeConversion] Grouped match: ${match.teams?.home?.name} vs ${match.teams?.away?.name} → ${conversion.tournamentMatchDay}`);
      } catch (error) {
        console.error('❌ [DateTimeConversion] Error processing match for grouping:', error, match);
      }
    });

    return groupedMatches;
  }

  /**
   * Filter matches for a specific tournament match day
   */
  filterMatchesForDate(matches: any[], targetDate: string): any[] {
    return matches.filter(match => {
      try {
        const matchDatetime = match.fixture?.date || match.date;
        const leagueId = match.league?.id;

        if (!matchDatetime) {
          return false;
        }

        const conversion = this.convertMatchDateTime(matchDatetime, leagueId);
        const isMatch = conversion.tournamentMatchDay === targetDate;
        
        if (isMatch) {
          console.log(`✅ [DateTimeConversion] Match included: ${match.teams?.home?.name} vs ${match.teams?.away?.name} (${conversion.tournamentMatchDay})`);
        }
        
        return isMatch;
      } catch (error) {
        console.error('❌ [DateTimeConversion] Error filtering match for date:', error, match);
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
    conversion: ReturnType<typeof this.convertMatchDateTime>;
  } {
    try {
      const conversion = this.convertMatchDateTime(matchDatetime, leagueId);
      const isMatch = conversion.tournamentMatchDay === targetDate;
      
      const reason = isMatch 
        ? `✅ Tournament match day ${conversion.tournamentMatchDay} matches target ${targetDate}` 
        : `❌ Tournament match day ${conversion.tournamentMatchDay} ≠ target ${targetDate}`;
      
      console.log(`🎯 [DateTimeConversion] ${reason}`);
      
      return {
        isMatch,
        reason,
        conversion
      };
    } catch (error) {
      console.error('❌ [DateTimeConversion] Error checking if match is on date:', error);
      return {
        isMatch: false,
        reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        conversion: {} as any
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
   * Format match time for display in client timezone
   */
  formatMatchTimeForDisplay(utcDateString: string, leagueId?: number): string {
    try {
      const conversion = this.convertMatchDateTime(utcDateString, leagueId);
      return conversion.displayTime;
    } catch (error) {
      console.error('❌ [DateTimeConversion] Error formatting match time:', error);
      return '--:--';
    }
  }

  /**
   * Static method for quick date checking
   */
  static isFixtureOnDate(
    fixtureDateTime: string, 
    targetDate: string, 
    leagueId?: number
  ): { isMatch: boolean; reason: string } {
    try {
      const converter = new MyUpdatedDateTimeConversion();
      const { isMatch, reason } = converter.isMatchOnDate(fixtureDateTime, targetDate, leagueId);
      
      return { isMatch, reason };
    } catch (error) {
      console.error('❌ [DateTimeConversion] Static method error:', error);
      return {
        isMatch: false,
        reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Add new tournament timezone configuration
   */
  addTournamentConfig(config: TournamentTimezoneConfig): void {
    this.tournamentConfigs.set(config.leagueId, config);
    console.log(`➕ [DateTimeConversion] Added tournament config: ${config.name} (${config.timezone})`);
  }

  /**
   * Get all supported tournament timezones
   */
  getSupportedTournaments(): TournamentTimezoneConfig[] {
    return Array.from(this.tournamentConfigs.values());
  }
}

// Export utility functions
export const createUpdatedDateTimeConverter = (clientTimezone?: string) => {
  return new MyUpdatedDateTimeConversion(clientTimezone);
};

export const convertMatchToClientTimezone = (
  matchDatetime: string, 
  clientTimezone?: string, 
  leagueId?: number
) => {
  const converter = new MyUpdatedDateTimeConversion(clientTimezone);
  return converter.convertMatchDateTime(matchDatetime, leagueId);
};
