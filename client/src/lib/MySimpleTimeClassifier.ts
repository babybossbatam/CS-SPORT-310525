
import { parseISO, format, isValid } from 'date-fns';

export interface TimeClassificationResult {
  category: 'today' | 'tomorrow' | 'yesterday' | 'other';
  reason: string;
  fixtureTime: string;
  currentTime: string;
  status: string;
  isWithinTimeRange: boolean;
}

export class MySimpleTimeClassifier {
  
  /**
   * Classify fixtures based on simple time rules
   */
  static classifyFixture(
    fixtureDateTime: string,
    matchStatus: string,
    currentDateTime?: string
  ): TimeClassificationResult {
    
    try {
      const fixtureDate = parseISO(fixtureDateTime);
      const currentDate = currentDateTime ? parseISO(currentDateTime) : new Date();

      if (!isValid(fixtureDate) || !isValid(currentDate)) {
        return {
          category: 'other',
          reason: 'Invalid date format',
          fixtureTime: fixtureDateTime,
          currentTime: currentDateTime || new Date().toISOString(),
          status: matchStatus,
          isWithinTimeRange: false
        };
      }

      // Extract time components
      const fixtureTimeOnly = format(fixtureDate, 'HH:mm');
      const currentTimeOnly = format(currentDate, 'HH:mm');
      
      // Convert to minutes for comparison
      const fixtureMinutes = this.timeToMinutes(fixtureTimeOnly);
      const currentMinutes = this.timeToMinutes(currentTimeOnly);

      // Check if within 00:00 - 23:59 range (always true for valid times)
      const isWithinTimeRange = fixtureMinutes >= 0 && fixtureMinutes <= 1439; // 23:59 = 1439 minutes

      console.log(`🕐 [MySimpleTimeClassifier] Analyzing fixture:`, {
        fixtureTime: fixtureTimeOnly,
        currentTime: currentTimeOnly,
        fixtureMinutes,
        currentMinutes,
        status: matchStatus,
        isWithinTimeRange
      });

      if (!isWithinTimeRange) {
        return {
          category: 'other',
          reason: 'Time outside valid range',
          fixtureTime: fixtureTimeOnly,
          currentTime: currentTimeOnly,
          status: matchStatus,
          isWithinTimeRange: false
        };
      }

      // Rule 1: NS status and fixture time > current time = Today's Matches
      if (matchStatus === 'NS' && fixtureMinutes > currentMinutes) {
        return {
          category: 'today',
          reason: `NS match scheduled for later today (${fixtureTimeOnly} > ${currentTimeOnly})`,
          fixtureTime: fixtureTimeOnly,
          currentTime: currentTimeOnly,
          status: matchStatus,
          isWithinTimeRange: true
        };
      }

      // Rule 2: NS status and fixture time < current time = Tomorrow's Matches
      if (matchStatus === 'NS' && fixtureMinutes < currentMinutes) {
        return {
          category: 'tomorrow',
          reason: `NS match time has passed, moving to tomorrow (${fixtureTimeOnly} < ${currentTimeOnly})`,
          fixtureTime: fixtureTimeOnly,
          currentTime: currentTimeOnly,
          status: matchStatus,
          isWithinTimeRange: true
        };
      }

      // Rule 3: FT status and fixture time < current time = Yesterday's Ended Matches
      if (matchStatus === 'FT' && fixtureMinutes < currentMinutes) {
        // Additional check: if the fixture date is actually from yesterday
        const fixtureDateString = format(fixtureDate, 'yyyy-MM-dd');
        const currentDateString = format(currentDate, 'yyyy-MM-dd');
        
        if (fixtureDateString < currentDateString) {
          return {
            category: 'yesterday',
            reason: `FT match from yesterday (${fixtureDateString} < ${currentDateString})`,
            fixtureTime: fixtureTimeOnly,
            currentTime: currentTimeOnly,
            status: matchStatus,
            isWithinTimeRange: true
          };
        } else {
          return {
            category: 'today',
            reason: `FT match ended earlier today (${fixtureTimeOnly} < ${currentTimeOnly})`,
            fixtureTime: fixtureTimeOnly,
            currentTime: currentTimeOnly,
            status: matchStatus,
            isWithinTimeRange: true
          };
        }
      }

      // Handle FT matches where fixture time > current time (shouldn't happen but handle gracefully)
      if (matchStatus === 'FT' && fixtureMinutes >= currentMinutes) {
        return {
          category: 'today',
          reason: `FT match completed today (${fixtureTimeOnly})`,
          fixtureTime: fixtureTimeOnly,
          currentTime: currentTimeOnly,
          status: matchStatus,
          isWithinTimeRange: true
        };
      }

      // Handle NS matches where times are equal
      if (matchStatus === 'NS' && fixtureMinutes === currentMinutes) {
        return {
          category: 'today',
          reason: `NS match starting now (${fixtureTimeOnly} = ${currentTimeOnly})`,
          fixtureTime: fixtureTimeOnly,
          currentTime: currentTimeOnly,
          status: matchStatus,
          isWithinTimeRange: true
        };
      }

      // Handle live matches
      if (['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(matchStatus)) {
        return {
          category: 'today',
          reason: `Live match in progress (${matchStatus})`,
          fixtureTime: fixtureTimeOnly,
          currentTime: currentTimeOnly,
          status: matchStatus,
          isWithinTimeRange: true
        };
      }

      // Default case for other statuses
      return {
        category: 'other',
        reason: `Unhandled status: ${matchStatus}`,
        fixtureTime: fixtureTimeOnly,
        currentTime: currentTimeOnly,
        status: matchStatus,
        isWithinTimeRange: true
      };

    } catch (error) {
      return {
        category: 'other',
        reason: `Error processing: ${error}`,
        fixtureTime: fixtureDateTime,
        currentTime: currentDateTime || new Date().toISOString(),
        status: matchStatus,
        isWithinTimeRange: false
      };
    }
  }

  /**
   * Convert time string (HH:mm) to minutes since midnight
   */
  private static timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Filter fixtures for today's matches
   */
  static filterTodayMatches(fixtures: any[], currentDateTime?: string): any[] {
    return fixtures.filter(fixture => {
      if (!fixture?.fixture?.date || !fixture?.fixture?.status?.short) {
        return false;
      }

      const result = this.classifyFixture(
        fixture.fixture.date,
        fixture.fixture.status.short,
        currentDateTime
      );

      const isToday = result.category === 'today';
      
      if (isToday) {
        console.log(`✅ [MySimpleTimeClassifier] Today's match:`, {
          teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          time: result.fixtureTime,
          status: result.status,
          reason: result.reason
        });
      }

      return isToday;
    });
  }

  /**
   * Filter fixtures for tomorrow's matches
   */
  static filterTomorrowMatches(fixtures: any[], currentDateTime?: string): any[] {
    return fixtures.filter(fixture => {
      if (!fixture?.fixture?.date || !fixture?.fixture?.status?.short) {
        return false;
      }

      const result = this.classifyFixture(
        fixture.fixture.date,
        fixture.fixture.status.short,
        currentDateTime
      );

      const isTomorrow = result.category === 'tomorrow';
      
      if (isTomorrow) {
        console.log(`🌅 [MySimpleTimeClassifier] Tomorrow's match:`, {
          teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          time: result.fixtureTime,
          status: result.status,
          reason: result.reason
        });
      }

      return isTomorrow;
    });
  }

  /**
   * Filter fixtures for yesterday's ended matches
   */
  static filterYesterdayMatches(fixtures: any[], currentDateTime?: string): any[] {
    return fixtures.filter(fixture => {
      if (!fixture?.fixture?.date || !fixture?.fixture?.status?.short) {
        return false;
      }

      const result = this.classifyFixture(
        fixture.fixture.date,
        fixture.fixture.status.short,
        currentDateTime
      );

      const isYesterday = result.category === 'yesterday';
      
      if (isYesterday) {
        console.log(`📅 [MySimpleTimeClassifier] Yesterday's match:`, {
          teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          time: result.fixtureTime,
          status: result.status,
          reason: result.reason
        });
      }

      return isYesterday;
    });
  }

  /**
   * Debug helper to test classification
   */
  static debugClassification(
    fixtureDateTime: string,
    matchStatus: string,
    currentDateTime?: string
  ): void {
    const result = this.classifyFixture(fixtureDateTime, matchStatus, currentDateTime);
    
    console.log(`🔍 [MySimpleTimeClassifier] Debug Classification:`, {
      input: {
        fixtureDateTime,
        matchStatus,
        currentDateTime: currentDateTime || 'current time'
      },
      result: {
        category: result.category,
        reason: result.reason,
        fixtureTime: result.fixtureTime,
        currentTime: result.currentTime,
        isWithinTimeRange: result.isWithinTimeRange
      }
    });
  }
}

export default MySimpleTimeClassifier;
