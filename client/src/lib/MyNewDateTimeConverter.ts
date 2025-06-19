
import { parseISO, isValid, format, addHours, subHours } from 'date-fns';

export interface TournamentTimezoneConfig {
  leagueId: number;
  leagueName: string;
  tournamentTimezone: string;
  utcOffset: number; // hours offset from UTC
  groupByMatchDay?: boolean; // group by tournament match day instead of calendar date
}

export interface DateTimeConversionResult {
  originalUtcTime: string;
  tournamentLocalTime: string;
  userLocalTime: string;
  tournamentDate: string; // YYYY-MM-DD in tournament timezone
  userDate: string; // YYYY-MM-DD in user timezone
  displayDate: string; // The date to use for grouping
  conversionMethod: 'utc' | 'tournament-local' | 'match-day-grouping';
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
      groupByMatchDay: true
    },
    
    // UEFA Competitions - Use CET/CEST
    {
      leagueId: 2,
      leagueName: "UEFA Champions League",
      tournamentTimezone: "Europe/Zurich",
      utcOffset: 1, // CET
      groupByMatchDay: true
    },
    {
      leagueId: 3,
      leagueName: "UEFA Europa League", 
      tournamentTimezone: "Europe/Zurich",
      utcOffset: 1, // CET
      groupByMatchDay: true
    },
    
    // CONCACAF Gold Cup - Uses tournament local timezone
    {
      leagueId: 16,
      leagueName: "CONCACAF Gold Cup",
      tournamentTimezone: "America/New_York",
      utcOffset: -5, // EST
      groupByMatchDay: true
    },
    
    // Copa America - Uses tournament local timezone
    {
      leagueId: 9,
      leagueName: "Copa America",
      tournamentTimezone: "America/New_York", // 2024 hosted in USA
      utcOffset: -5, // EST
      groupByMatchDay: true
    },
    
    // World Cup Qualifications - Use tournament local timezone per confederation
    {
      leagueId: 32,
      leagueName: "World Cup - Qualification Europe",
      tournamentTimezone: "Europe/Zurich",
      utcOffset: 1, // CET
      groupByMatchDay: true
    },
    {
      leagueId: 34,
      leagueName: "World Cup - Qualification South America",
      tournamentTimezone: "America/Sao_Paulo",
      utcOffset: -3, // BRT
      groupByMatchDay: true
    }
  ];

  /**
   * Get tournament configuration for a league
   */
  private static getTournamentConfig(leagueId: number): TournamentTimezoneConfig | null {
    return this.TOURNAMENT_CONFIGS.find(config => config.leagueId === leagueId) || null;
  }

  /**
   * Convert UTC fixture time to appropriate display timezone
   */
  static convertFixtureDateTime(
    fixtureUtcTime: string,
    leagueId: number,
    leagueName?: string
  ): DateTimeConversionResult {
    
    try {
      const fixtureDate = parseISO(fixtureUtcTime);
      
      if (!isValid(fixtureDate)) {
        return {
          originalUtcTime: fixtureUtcTime,
          tournamentLocalTime: fixtureUtcTime,
          userLocalTime: fixtureUtcTime,
          tournamentDate: fixtureUtcTime.split('T')[0] || '',
          userDate: fixtureUtcTime.split('T')[0] || '',
          displayDate: fixtureUtcTime.split('T')[0] || '',
          conversionMethod: 'utc',
          reason: 'Invalid date format'
        };
      }

      // Check if this is a tournament with special timezone handling
      const tournamentConfig = this.getTournamentConfig(leagueId);
      
      if (tournamentConfig) {
        // Convert to tournament local time
        const tournamentLocalTime = addHours(fixtureDate, tournamentConfig.utcOffset);
        const tournamentDate = format(tournamentLocalTime, 'yyyy-MM-dd');
        
        // User local time (browser automatically handles this)
        const userLocalTime = fixtureDate; // Date object is already in user's timezone when displayed
        const userDate = format(userLocalTime, 'yyyy-MM-dd');
        
        console.log(`🌍 [Tournament Timezone] ${tournamentConfig.leagueName}:`, {
          originalUtc: format(fixtureDate, 'yyyy-MM-dd HH:mm:ss'),
          tournamentLocal: format(tournamentLocalTime, 'yyyy-MM-dd HH:mm:ss'),
          tournamentTimezone: tournamentConfig.tournamentTimezone,
          utcOffset: tournamentConfig.utcOffset,
          tournamentDate,
          userDate,
          groupByMatchDay: tournamentConfig.groupByMatchDay
        });

        return {
          originalUtcTime: fixtureUtcTime,
          tournamentLocalTime: tournamentLocalTime.toISOString(),
          userLocalTime: userLocalTime.toISOString(),
          tournamentDate,
          userDate,
          displayDate: tournamentConfig.groupByMatchDay ? tournamentDate : userDate,
          conversionMethod: tournamentConfig.groupByMatchDay ? 'match-day-grouping' : 'tournament-local',
          reason: `Using ${tournamentConfig.tournamentTimezone} timezone for ${tournamentConfig.leagueName}`
        };
      }

      // Default: Use user's local timezone (standard behavior)
      const userDate = format(fixtureDate, 'yyyy-MM-dd');
      
      return {
        originalUtcTime: fixtureUtcTime,
        tournamentLocalTime: fixtureUtcTime, // Same as UTC for non-tournament matches
        userLocalTime: fixtureDate.toISOString(),
        tournamentDate: userDate,
        userDate,
        displayDate: userDate,
        conversionMethod: 'utc',
        reason: 'Standard UTC to user local timezone conversion'
      };

    } catch (error) {
      console.error('Error in datetime conversion:', error);
      
      const fallbackDate = fixtureUtcTime.split('T')[0] || '';
      return {
        originalUtcTime: fixtureUtcTime,
        tournamentLocalTime: fixtureUtcTime,
        userLocalTime: fixtureUtcTime,
        tournamentDate: fallbackDate,
        userDate: fallbackDate,
        displayDate: fallbackDate,
        conversionMethod: 'utc',
        reason: `Conversion error: ${error}`
      };
    }
  }

  /**
   * Check if a fixture should be grouped on a specific selected date
   */
  static isFixtureOnDate(
    fixtureUtcTime: string,
    selectedDate: string, // YYYY-MM-DD
    leagueId: number,
    leagueName?: string
  ): { isMatch: boolean; reason: string; conversionUsed: string } {
    
    const conversion = this.convertFixtureDateTime(fixtureUtcTime, leagueId, leagueName);
    const isMatch = conversion.displayDate === selectedDate;
    
    console.log(`📅 [Date Match Check] ${leagueName || 'Unknown League'}:`, {
      fixtureUtc: fixtureUtcTime,
      selectedDate,
      displayDate: conversion.displayDate,
      isMatch,
      conversionMethod: conversion.conversionMethod,
      reason: conversion.reason
    });
    
    return {
      isMatch,
      reason: isMatch 
        ? `Match found on ${selectedDate} using ${conversion.conversionMethod} method`
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
    fixtureUtcTime: string,
    leagueId: number,
    leagueName?: string
  ): string {
    const conversion = this.convertFixtureDateTime(fixtureUtcTime, leagueId, leagueName);
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
