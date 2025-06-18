
import { parseISO, isValid, format, addHours, subHours, zonedTimeToUtc, utcToZonedTime } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

export interface TournamentTimezoneConfig {
  leagueId: number;
  leagueName: string;
  tournamentTimezone: string;
  utcOffset: number; // hours offset from UTC
  groupByMatchDay?: boolean; // group by tournament match day instead of calendar date
  matchDayStartHour?: number; // hour when match day starts (default: 0)
}

export interface DateTimeConversionResult {
  originalFixtureTime: string; // Original fixture time as provided
  tournamentLocalTime: string;
  userLocalTime: string;
  tournamentDate: string; // YYYY-MM-DD in tournament timezone
  userDate: string; // YYYY-MM-DD in user timezone
  displayDate: string; // The date to use for grouping
  matchDay?: string; // Tournament match day identifier
  conversionMethod: 'original-timezone' | 'tournament-local' | 'match-day-grouping' | 'utc-fallback';
  reason: string;
}

export class MyNewDateTimeConverter {
  
  // Tournament-specific timezone configurations
  private static readonly TOURNAMENT_CONFIGS: TournamentTimezoneConfig[] = [
    // FIFA Club World Cup - Uses tournament local timezone (varies by host)
    {
      leagueId: 15,
      leagueName: "FIFA Club World Cup",
      tournamentTimezone: "America/New_York", // 2025 hosted in USA
      utcOffset: -5, // EST
      groupByMatchDay: true,
      matchDayStartHour: 6 // Match day starts at 6 AM tournament time
    },
    
    // UEFA Competitions - Use CET/CEST
    {
      leagueId: 2,
      leagueName: "UEFA Champions League",
      tournamentTimezone: "Europe/Zurich",
      utcOffset: 1, // CET
      groupByMatchDay: true,
      matchDayStartHour: 6
    },
    {
      leagueId: 3,
      leagueName: "UEFA Europa League", 
      tournamentTimezone: "Europe/Zurich",
      utcOffset: 1, // CET
      groupByMatchDay: true,
      matchDayStartHour: 6
    },
    
    // CONCACAF Gold Cup - Uses tournament local timezone
    {
      leagueId: 16,
      leagueName: "CONCACAF Gold Cup",
      tournamentTimezone: "America/New_York",
      utcOffset: -5, // EST
      groupByMatchDay: true,
      matchDayStartHour: 6
    },
    
    // Copa America - Uses tournament local timezone
    {
      leagueId: 9,
      leagueName: "Copa America",
      tournamentTimezone: "America/New_York", // 2024 hosted in USA
      utcOffset: -5, // EST
      groupByMatchDay: true,
      matchDayStartHour: 6
    },
    
    // World Cup Qualifications - Use tournament local timezone per confederation
    {
      leagueId: 32,
      leagueName: "World Cup - Qualification Europe",
      tournamentTimezone: "Europe/Zurich",
      utcOffset: 1, // CET
      groupByMatchDay: true,
      matchDayStartHour: 6
    },
    {
      leagueId: 34,
      leagueName: "World Cup - Qualification South America",
      tournamentTimezone: "America/Sao_Paulo",
      utcOffset: -3, // BRT
      groupByMatchDay: true,
      matchDayStartHour: 6
    }
  ];

  /**
   * Get tournament configuration for a league
   */
  private static getTournamentConfig(leagueId: number): TournamentTimezoneConfig | null {
    return this.TOURNAMENT_CONFIGS.find(config => config.leagueId === leagueId) || null;
  }

  /**
   * Convert fixture time to appropriate display timezone using original timezone
   */
  static convertFixtureDateTime(
    fixtureTimeString: string,
    leagueId: number,
    leagueName?: string
  ): DateTimeConversionResult {
    
    try {
      // Parse the original fixture time without assuming it's UTC
      const originalFixtureDate = parseISO(fixtureTimeString);
      
      if (!isValid(originalFixtureDate)) {
        return {
          originalFixtureTime: fixtureTimeString,
          tournamentLocalTime: fixtureTimeString,
          userLocalTime: fixtureTimeString,
          tournamentDate: fixtureTimeString.split('T')[0] || '',
          userDate: fixtureTimeString.split('T')[0] || '',
          displayDate: fixtureTimeString.split('T')[0] || '',
          conversionMethod: 'utc-fallback',
          reason: 'Invalid date format'
        };
      }

      // Check if this is a tournament with special timezone handling
      const tournamentConfig = this.getTournamentConfig(leagueId);
      
      if (tournamentConfig && tournamentConfig.groupByMatchDay) {
        try {
          // Use the tournament timezone for match day calculation
          const tournamentTime = utcToZonedTime(originalFixtureDate, tournamentConfig.tournamentTimezone);
          const matchDayStartHour = tournamentConfig.matchDayStartHour || 6;
          
          // Calculate match day by adjusting for match day start hour
          let matchDayDate = new Date(tournamentTime);
          if (tournamentTime.getHours() < matchDayStartHour) {
            // If it's before match day start hour, consider it part of previous day
            matchDayDate.setDate(matchDayDate.getDate() - 1);
          }
          
          const tournamentDate = format(tournamentTime, 'yyyy-MM-dd');
          const matchDay = format(matchDayDate, 'yyyy-MM-dd');
          const userDate = format(originalFixtureDate, 'yyyy-MM-dd');
          
          console.log(`🏆 [Match Day Grouping] ${tournamentConfig.leagueName}:`, {
            originalFixture: fixtureTimeString,
            tournamentTime: format(tournamentTime, 'yyyy-MM-dd HH:mm:ss'),
            tournamentTimezone: tournamentConfig.tournamentTimezone,
            matchDayStartHour,
            tournamentDate,
            matchDay,
            userDate,
            displayDate: matchDay
          });

          return {
            originalFixtureTime: fixtureTimeString,
            tournamentLocalTime: tournamentTime.toISOString(),
            userLocalTime: originalFixtureDate.toISOString(),
            tournamentDate,
            userDate,
            displayDate: matchDay,
            matchDay,
            conversionMethod: 'match-day-grouping',
            reason: `Using match day grouping for ${tournamentConfig.leagueName} in ${tournamentConfig.tournamentTimezone}`
          };
        } catch (timezoneError) {
          console.warn(`⚠️ Timezone conversion failed for ${tournamentConfig.leagueName}, falling back to offset calculation`);
          
          // Fallback to simple offset calculation
          const tournamentLocalTime = addHours(originalFixtureDate, tournamentConfig.utcOffset);
          const tournamentDate = format(tournamentLocalTime, 'yyyy-MM-dd');
          const userDate = format(originalFixtureDate, 'yyyy-MM-dd');
          
          return {
            originalFixtureTime: fixtureTimeString,
            tournamentLocalTime: tournamentLocalTime.toISOString(),
            userLocalTime: originalFixtureDate.toISOString(),
            tournamentDate,
            userDate,
            displayDate: tournamentDate,
            matchDay: tournamentDate,
            conversionMethod: 'tournament-local',
            reason: `Fallback offset calculation for ${tournamentConfig.leagueName}`
          };
        }
      }
      
      if (tournamentConfig) {
        // Tournament with timezone handling but no match day grouping
        const tournamentLocalTime = addHours(originalFixtureDate, tournamentConfig.utcOffset);
        const tournamentDate = format(tournamentLocalTime, 'yyyy-MM-dd');
        const userDate = format(originalFixtureDate, 'yyyy-MM-dd');
        
        console.log(`🌍 [Tournament Timezone] ${tournamentConfig.leagueName}:`, {
          originalFixture: fixtureTimeString,
          tournamentLocal: format(tournamentLocalTime, 'yyyy-MM-dd HH:mm:ss'),
          tournamentTimezone: tournamentConfig.tournamentTimezone,
          utcOffset: tournamentConfig.utcOffset,
          tournamentDate,
          userDate
        });

        return {
          originalFixtureTime: fixtureTimeString,
          tournamentLocalTime: tournamentLocalTime.toISOString(),
          userLocalTime: originalFixtureDate.toISOString(),
          tournamentDate,
          userDate,
          displayDate: tournamentDate,
          conversionMethod: 'tournament-local',
          reason: `Using ${tournamentConfig.tournamentTimezone} timezone for ${tournamentConfig.leagueName}`
        };
      }

      // Default: Use original fixture timezone (assume it's already in correct timezone)
      const fixtureDate = format(originalFixtureDate, 'yyyy-MM-dd');
      
      return {
        originalFixtureTime: fixtureTimeString,
        tournamentLocalTime: fixtureTimeString,
        userLocalTime: originalFixtureDate.toISOString(),
        tournamentDate: fixtureDate,
        userDate: fixtureDate,
        displayDate: fixtureDate,
        conversionMethod: 'original-timezone',
        reason: 'Using original fixture timezone without conversion'
      };

    } catch (error) {
      console.error('Error in datetime conversion:', error);
      
      const fallbackDate = fixtureTimeString.split('T')[0] || '';
      return {
        originalFixtureTime: fixtureTimeString,
        tournamentLocalTime: fixtureTimeString,
        userLocalTime: fixtureTimeString,
        tournamentDate: fallbackDate,
        userDate: fallbackDate,
        displayDate: fallbackDate,
        conversionMethod: 'utc-fallback',
        reason: `Conversion error: ${error}`
      };
    }
  }

  /**
   * Check if a fixture should be grouped on a specific selected date
   */
  static isFixtureOnDate(
    fixtureTimeString: string,
    selectedDate: string, // YYYY-MM-DD
    leagueId: number,
    leagueName?: string
  ): { isMatch: boolean; reason: string; conversionUsed: string } {
    
    const conversion = this.convertFixtureDateTime(fixtureTimeString, leagueId, leagueName);
    const isMatch = conversion.displayDate === selectedDate;
    
    console.log(`📅 [Date Match Check] ${leagueName || 'Unknown League'}:`, {
      originalFixture: fixtureTimeString,
      selectedDate,
      displayDate: conversion.displayDate,
      matchDay: conversion.matchDay,
      isMatch,
      conversionMethod: conversion.conversionMethod,
      reason: conversion.reason
    });
    
    return {
      isMatch,
      reason: isMatch 
        ? `Match found on ${selectedDate} using ${conversion.conversionMethod} method${conversion.matchDay ? ` (match day: ${conversion.matchDay})` : ''}`
        : `No match: fixture on ${conversion.displayDate}, selected ${selectedDate}`,
      conversionUsed: conversion.conversionMethod
    };
  }

  /**
   * Get all tournament leagues that use special timezone handling
   */
  static getTournamentLeagues(): TournamentTimezoneConfig[] {
    return [...this.TOURNAMENT_CONFIGS];
  }

  /**
   * Check if a league uses tournament-specific timezone handling
   */
  static isTournamentLeague(leagueId: number): boolean {
    return this.TOURNAMENT_CONFIGS.some(config => config.leagueId === leagueId);
  }

  /**
   * Get display date for grouping fixtures
   */
  static getDisplayDate(
    fixtureTimeString: string,
    leagueId: number,
    leagueName?: string
  ): string {
    const conversion = this.convertFixtureDateTime(fixtureTimeString, leagueId, leagueName);
    return conversion.displayDate;
  }

  /**
   * Batch process multiple fixtures for date grouping
   */
  static processFixturesForDate(
    fixtures: any[],
    selectedDate: string
  ): {
    matchingFixtures: any[];
    nonMatchingFixtures: any[];
    conversionStats: Record<string, number>;
  } {
    
    const matchingFixtures: any[] = [];
    const nonMatchingFixtures: any[] = [];
    const conversionStats: Record<string, number> = {
      'utc': 0,
      'tournament-local': 0,
      'match-day-grouping': 0
    };

    fixtures.forEach(fixture => {
      const leagueId = fixture.league?.id;
      const leagueName = fixture.league?.name;
      const fixtureDate = fixture.fixture?.date;
      
      if (!fixtureDate || !leagueId) {
        nonMatchingFixtures.push(fixture);
        return;
      }

      const dateCheck = this.isFixtureOnDate(fixtureDate, selectedDate, leagueId, leagueName);
      
      if (dateCheck.isMatch) {
        matchingFixtures.push(fixture);
      } else {
        nonMatchingFixtures.push(fixture);
      }

      // Track conversion method usage
      conversionStats[dateCheck.conversionUsed] = (conversionStats[dateCheck.conversionUsed] || 0) + 1;
    });

    console.log(`📊 [Batch Conversion] Processed ${fixtures.length} fixtures:`, {
      selectedDate,
      matching: matchingFixtures.length,
      nonMatching: nonMatchingFixtures.length,
      conversionStats
    });

    return {
      matchingFixtures,
      nonMatchingFixtures,
      conversionStats
    };
  }
}
