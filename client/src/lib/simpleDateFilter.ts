
import { parseISO, isValid, format } from 'date-fns';

export interface SimpleDateFilterResult {
  isMatch: boolean;
  reason: string;
  fixtureDate: string;
  selectedDate: string;
}

/**
 * Simple date filtering - no timezone conversion, no smart labeling
 * Just match fixture date with selected date directly
 */
export class SimpleDateFilter {
  
  /**
   * Extract date part from datetime string (YYYY-MM-DD)
   */
  static extractDate(dateTimeString: string): string {
    try {
      if (!dateTimeString) return '';
      
      // Handle ISO date strings
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
      console.error('Error extracting date:', error);
      return '';
    }
  }

  /**
   * Simple date match - no complex logic, just direct comparison
   */
  static isFixtureOnDate(fixtureDateTime: string, targetDate: string): SimpleDateFilterResult {
    const fixtureDate = this.extractDate(fixtureDateTime);
    const isMatch = fixtureDate === targetDate;
    
    return {
      isMatch,
      reason: isMatch ? 'Date match' : `Date mismatch: ${fixtureDate} vs ${targetDate}`,
      fixtureDate,
      selectedDate: targetDate
    };
  }

  /**
   * Filter fixtures for a specific date
   */
  static filterFixturesForDate(fixtures: any[], selectedDate: string): {
    validFixtures: any[];
    rejectedFixtures: Array<{ fixture: any; reason: string }>;
    stats: {
      total: number;
      valid: number;
      rejected: number;
    };
  } {
    const validFixtures: any[] = [];
    const rejectedFixtures: Array<{ fixture: any; reason: string }> = [];

    fixtures.forEach(fixture => {
      if (!fixture?.fixture?.date) {
        rejectedFixtures.push({ fixture, reason: 'No fixture date' });
        return;
      }

      const result = this.isFixtureOnDate(fixture.fixture.date, selectedDate);
      
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
        rejected: rejectedFixtures.length
      }
    };
  }

  /**
   * Get current date string
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
}
