
import { parseISO, isValid, format } from 'date-fns';

export interface SimpleDateFilterResult {
  isMatch: boolean;
  reason: string;
  fixtureDate: string;
  selectedDate: string;
  fixtureLocalDate?: string;
  fixtureUTCDate?: string;
}

/**
 * Enhanced date filtering with proper timezone conversion
 * Converts fixture UTC time to user's local timezone first, then compares dates
 */
export class SimpleDateFilter {
  
  /**
   * Extract date part from datetime string, but convert to local timezone first
   */
  static extractLocalDate(dateTimeString: string): string {
    try {
      if (!dateTimeString) return '';
      
      // Parse the UTC datetime
      const utcDate = parseISO(dateTimeString);
      if (!isValid(utcDate)) {
        // Fallback to original string parsing if invalid
        return dateTimeString.includes('T') ? dateTimeString.split('T')[0] : dateTimeString;
      }
      
      // Convert to user's local timezone by creating a new Date object
      // This automatically converts UTC to local timezone
      const localDate = new Date(utcDate.getTime());
      
      // Extract the local date part (YYYY-MM-DD)
      return format(localDate, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Error extracting local date:', error);
      // Fallback to original method
      if (dateTimeString.includes('T')) {
        return dateTimeString.split('T')[0];
      }
      return dateTimeString;
    }
  }

  /**
   * Extract UTC date part without timezone conversion (for debugging)
   */
  static extractUTCDate(dateTimeString: string): string {
    try {
      if (!dateTimeString) return '';
      
      // Handle ISO date strings - just get the date part
      if (dateTimeString.includes('T')) {
        return dateTimeString.split('T')[0];
      }
      
      // Handle date-only strings
      const date = parseISO(dateTimeString);
      if (isValid(date)) {
        return format(date, 'yyyy-MM-dd');
      }
      
      return dateTimeString;
    } catch (error) {
      console.error('Error extracting UTC date:', error);
      return '';
    }
  }

  /**
   * Smart date match with timezone conversion
   * Converts fixture datetime to local timezone first, then compares with selected date
   */
  static isFixtureOnDate(fixtureDateTime: string, targetDate: string): SimpleDateFilterResult {
    const fixtureLocalDate = this.extractLocalDate(fixtureDateTime);
    const fixtureUTCDate = this.extractUTCDate(fixtureDateTime);
    const isMatch = fixtureLocalDate === targetDate;
    
    const reason = isMatch 
      ? `Date match after timezone conversion: ${fixtureUTCDate} (UTC) → ${fixtureLocalDate} (local) = ${targetDate}` 
      : `Date mismatch after timezone conversion: ${fixtureUTCDate} (UTC) → ${fixtureLocalDate} (local) ≠ ${targetDate}`;
    
    return {
      isMatch,
      reason,
      fixtureDate: fixtureLocalDate,
      selectedDate: targetDate,
      fixtureLocalDate,
      fixtureUTCDate
    };
  }

  /**
   * Filter fixtures for a specific date with timezone conversion
   */
  static filterFixturesForDate(fixtures: any[], selectedDate: string): {
    validFixtures: any[];
    rejectedFixtures: Array<{ fixture: any; reason: string }>;
    stats: {
      total: number;
      valid: number;
      rejected: number;
      timezoneConversions: number;
    };
  } {
    const validFixtures: any[] = [];
    const rejectedFixtures: Array<{ fixture: any; reason: string }> = [];
    let timezoneConversions = 0;

    fixtures.forEach(fixture => {
      if (!fixture?.fixture?.date) {
        rejectedFixtures.push({ fixture, reason: 'No fixture date' });
        return;
      }

      const result = this.isFixtureOnDate(fixture.fixture.date, selectedDate);
      
      // Count timezone conversions where UTC date differs from local date
      if (result.fixtureUTCDate !== result.fixtureLocalDate) {
        timezoneConversions++;
        console.log(`🌍 [TIMEZONE CONVERSION] ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}:`, {
          utcDateTime: fixture.fixture.date,
          utcDate: result.fixtureUTCDate,
          localDate: result.fixtureLocalDate,
          selectedDate,
          included: result.isMatch
        });
      }
      
      if (result.isMatch) {
        validFixtures.push(fixture);
      } else {
        rejectedFixtures.push({ fixture, reason: result.reason });
      }
    });

    return {
      validFixtures,
      rejectedFixtures,
      stats: {
        total: fixtures.length,
        valid: validFixtures.length,
        rejected: rejectedFixtures.length,
        timezoneConversions
      }
    };
  }

  /**
   * Get current date string in local timezone
   */
  static getCurrentDate(): string {
    return format(new Date(), 'yyyy-MM-dd');
  }

  /**
   * Get date display name
   */
  static getDateDisplayName(dateString: string): string {
    const today = this.getCurrentDate();
    
    if (dateString === today) {
      return "Today's Matches";
    }
    
    // Calculate yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = format(yesterday, 'yyyy-MM-dd');
    
    if (dateString === yesterdayString) {
      return "Yesterday's Matches";
    }
    
    // Calculate tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = format(tomorrow, 'yyyy-MM-dd');
    
    if (dateString === tomorrowString) {
      return "Tomorrow's Matches";
    }
    
    // Format other dates
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'EEE, do MMM') + ' Matches' : dateString;
    } catch {
      return dateString;
    }
  }

  /**
   * Debug timezone conversion for a specific fixture
   */
  static debugTimezoneConversion(fixtureDateTime: string, selectedDate: string): void {
    const result = this.isFixtureOnDate(fixtureDateTime, selectedDate);
    
    console.log(`🔍 [TIMEZONE DEBUG] Fixture: ${fixtureDateTime}`, {
      originalUTC: fixtureDateTime,
      utcDatePart: result.fixtureUTCDate,
      localDatePart: result.fixtureLocalDate,
      selectedDate: selectedDate,
      isMatch: result.isMatch,
      reason: result.reason,
      timezoneChanged: result.fixtureUTCDate !== result.fixtureLocalDate
    });
  }
}
