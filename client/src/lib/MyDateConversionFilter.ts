
import { parseISO, isValid, format } from 'date-fns';

export interface DateFilterResult {
  isMatch: boolean;
  reason: string;
  fixtureLocalDate: string;
  fixtureUTCDate: string;
  selectedDate: string;
  method: '365scores' | 'timezone-inclusive' | 'exact-match';
}

export interface FixtureForDateFilter {
  fixture: {
    id: number;
    date: string;
    status?: {
      short: string;
    };
  };
  teams?: {
    home: { name: string };
    away: { name: string };
  };
}

/**
 * MyDateConversionFilter - Handles date filtering like 365scores.com
 * 
 * Key principles:
 * 1. Keep server/API dates raw without conversion
 * 2. Handle timezone mismatches intelligently
 * 3. Allow fixtures to appear on both days when they cross midnight
 */
export class MyDateConversionFilter {
  
  /**
   * 365scores.com approach: Convert UTC fixture time to user's local date
   */
  static getFixtureLocalDate(utcDateString: string): string {
    try {
      const utcDate = parseISO(utcDateString);
      if (!isValid(utcDate)) return utcDateString.split('T')[0];
      
      // Convert to user's local timezone and get the date part
      const localDate = new Date(utcDate.getTime());
      return format(localDate, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Error converting to local date:', error);
      return utcDateString.split('T')[0];
    }
  }

  /**
   * Get UTC date part without timezone conversion (raw server date)
   */
  static getFixtureUTCDate(utcDateString: string): string {
    try {
      return utcDateString.split('T')[0];
    } catch (error) {
      console.error('Error extracting UTC date:', error);
      return utcDateString;
    }
  }

  /**
   * 365scores.com style: Check if a fixture belongs to a specific local date
   */
  static isFixtureOnLocalDate(fixtureUTCDate: string, targetLocalDate: string): boolean {
    try {
      const fixtureLocalDate = this.getFixtureLocalDate(fixtureUTCDate);
      return fixtureLocalDate === targetLocalDate;
    } catch (error) {
      console.error('Error checking fixture local date:', error);
      return false;
    }
  }

  /**
   * Enhanced filtering that checks multiple date scenarios like 365scores.com
   */
  static isFixtureValidForDate(fixture: FixtureForDateFilter, selectedDate: string): DateFilterResult {
    const fixtureUTCDateString = fixture.fixture.date;
    
    if (!fixtureUTCDateString) {
      return {
        isMatch: false,
        reason: 'No fixture date provided',
        fixtureLocalDate: '',
        fixtureUTCDate: '',
        selectedDate,
        method: 'exact-match'
      };
    }

    const fixtureUTCDate = this.getFixtureUTCDate(fixtureUTCDateString);
    const fixtureLocalDate = this.getFixtureLocalDate(fixtureUTCDateString);

    // Method 1: 365scores approach - Check local date match
    if (fixtureLocalDate === selectedDate) {
      return {
        isMatch: true,
        reason: 'Local date match (365scores method)',
        fixtureLocalDate,
        fixtureUTCDate,
        selectedDate,
        method: '365scores'
      };
    }

    // Method 2: UTC date match (exact server date)
    if (fixtureUTCDate === selectedDate) {
      return {
        isMatch: true,
        reason: 'UTC date exact match',
        fixtureLocalDate,
        fixtureUTCDate,
        selectedDate,
        method: 'exact-match'
      };
    }

    // Method 3: Timezone-inclusive (±1 day for cross-timezone matches)
    const selectedDateObj = new Date(selectedDate + 'T00:00:00Z');
    const previousDay = new Date(selectedDateObj);
    previousDay.setDate(previousDay.getDate() - 1);
    const nextDay = new Date(selectedDateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    const validDates = [
      previousDay.toISOString().split('T')[0],
      selectedDate,
      nextDay.toISOString().split('T')[0]
    ];

    if (validDates.includes(fixtureUTCDate)) {
      return {
        isMatch: true,
        reason: 'Timezone-inclusive match (±1 day)',
        fixtureLocalDate,
        fixtureUTCDate,
        selectedDate,
        method: 'timezone-inclusive'
      };
    }

    return {
      isMatch: false,
      reason: 'No date match found',
      fixtureLocalDate,
      fixtureUTCDate,
      selectedDate,
      method: 'exact-match'
    };
  }

  /**
   * Filter fixtures array for a specific date using 365scores approach
   */
  static filterFixturesForDate(fixtures: FixtureForDateFilter[], selectedDate: string): {
    validFixtures: FixtureForDateFilter[];
    rejectedFixtures: Array<{ fixture: FixtureForDateFilter; reason: string }>;
    stats: {
      total: number;
      valid: number;
      rejected: number;
      methods: {
        '365scores': number;
        'timezone-inclusive': number;
        'exact-match': number;
      };
    };
  } {
    const validFixtures: FixtureForDateFilter[] = [];
    const rejectedFixtures: Array<{ fixture: FixtureForDateFilter; reason: string }> = [];
    const methods = {
      '365scores': 0,
      'timezone-inclusive': 0,
      'exact-match': 0
    };

    fixtures.forEach(fixture => {
      const result = this.isFixtureValidForDate(fixture, selectedDate);
      
      if (result.isMatch) {
        validFixtures.push(fixture);
        methods[result.method]++;
        
        // Debug log for successful matches
        console.log(`✅ [MyDateFilter] Match found:`, {
          fixtureId: fixture.fixture.id,
          method: result.method,
          reason: result.reason,
          fixtureUTCDate: result.fixtureUTCDate,
          fixtureLocalDate: result.fixtureLocalDate,
          selectedDate: result.selectedDate,
          homeTeam: fixture.teams?.home?.name,
          awayTeam: fixture.teams?.away?.name,
          status: fixture.fixture.status?.short
        });
      } else {
        rejectedFixtures.push({ fixture, reason: result.reason });
        
        // Debug log for rejected matches
        console.log(`❌ [MyDateFilter] Fixture rejected:`, {
          fixtureId: fixture.fixture.id,
          reason: result.reason,
          fixtureUTCDate: result.fixtureUTCDate,
          fixtureLocalDate: result.fixtureLocalDate,
          selectedDate: result.selectedDate,
          homeTeam: fixture.teams?.home?.name,
          awayTeam: fixture.teams?.away?.name,
          status: fixture.fixture.status?.short
        });
      }
    });

    return {
      validFixtures,
      rejectedFixtures,
      stats: {
        total: fixtures.length,
        valid: validFixtures.length,
        rejected: rejectedFixtures.length,
        methods
      }
    };
  }

  /**
   * Get current date in user's local timezone (365scores approach)
   */
  static getCurrentLocalDate(): string {
    return format(new Date(), 'yyyy-MM-dd');
  }

  /**
   * Check if a date string represents today in user's local timezone
   */
  static isDateToday(dateString: string): boolean {
    return dateString === this.getCurrentLocalDate();
  }

  /**
   * Check if a date string represents yesterday in user's local timezone
   */
  static isDateYesterday(dateString: string): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateString === format(yesterday, 'yyyy-MM-dd');
  }

  /**
   * Check if a date string represents tomorrow in user's local timezone
   */
  static isDateTomorrow(dateString: string): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateString === format(tomorrow, 'yyyy-MM-dd');
  }

  /**
   * Get display name for a date (Today, Yesterday, Tomorrow, or formatted date)
   */
  static getDateDisplayName(dateString: string): string {
    if (this.isDateToday(dateString)) return "Today's Matches";
    if (this.isDateYesterday(dateString)) return "Yesterday's Matches";
    if (this.isDateTomorrow(dateString)) return "Tomorrow's Matches";
    
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'EEE, do MMM') + ' Matches' : dateString;
    } catch {
      return dateString;
    }
  }

  /**
   * Debug helper: Log date conversion details
   */
  static debugDateConversion(fixtureUTCDate: string, selectedDate: string): void {
    const fixtureLocalDate = this.getFixtureLocalDate(fixtureUTCDate);
    const fixtureUTCDateOnly = this.getFixtureUTCDate(fixtureUTCDate);
    
    console.log(`🔍 [MyDateFilter] Date Conversion Debug:`, {
      originalUTC: fixtureUTCDate,
      extractedUTCDate: fixtureUTCDateOnly,
      convertedLocalDate: fixtureLocalDate,
      selectedDate: selectedDate,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      matches: {
        localDateMatch: fixtureLocalDate === selectedDate,
        utcDateMatch: fixtureUTCDateOnly === selectedDate
      }
    });
  }
}

export default MyDateConversionFilter;
