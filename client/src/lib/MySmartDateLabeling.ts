import { parseISO, isValid, format, differenceInHours, isSameDay, isAfter, isBefore } from 'date-fns';

export interface SmartDateResult {
  label: 'today' | 'yesterday' | 'tomorrow' | 'custom';
  reason: string;
  isActualDate: boolean;
  timeComparison: string;
  customDate?: string; // Store the actual date when using custom label
}

/**
 * Simplified Smart Date Labeling System
 * Focus on time ranges (00:01:00 - 23:59:59) and match status
 * All date selections treated as "today logic" with proper time range checks
 */
export class MySmartDateLabeling {

  /**
   * Main entry point for smart date labeling
   * Treats all dates as "today logic" with time range checks
   */
  static getSmartDateLabelForDate(
    fixtureDate: string,
    matchStatus: string,
    targetDate: string,
    currentTime?: Date
  ): SmartDateResult {
    const now = currentTime || new Date();
    const fixture = parseISO(fixtureDate);
    const target = parseISO(targetDate);

    if (!isValid(fixture) || !isValid(target)) {
      return {
        label: 'custom',
        reason: 'Invalid fixture or target date',
        isActualDate: false,
        timeComparison: 'invalid',
        customDate: targetDate
      };
    }

    return this.getTimeRangeBasedLabel(fixture, target, targetDate, matchStatus, now);
  }

  /**
   * Legacy method - redirects to new unified logic
   */
  static getSmartDateLabel(
    fixtureDate: string,
    matchStatus: string,
    currentTime?: Date,
    referenceDate?: Date
  ): SmartDateResult {
    const now = currentTime || new Date();
    const reference = referenceDate || now;
    const targetDateString = format(reference, 'yyyy-MM-dd');

    return this.getSmartDateLabelForDate(fixtureDate, matchStatus, targetDateString, now);
  }

  /**
   * Time Range Based Labeling System
   * Core logic implementing your simplified approach
   */
  private static getTimeRangeBasedLabel(
    fixture: Date, 
    target: Date, 
    targetDateString: string, 
    matchStatus: string,
    now: Date
  ): SmartDateResult {
    const finishedStatuses = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'];
    const liveStatuses = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'];
    const notStartedStatuses = ['NS', 'TBD', 'PST'];

    // Check if target date is today relative to current time
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(target);
    targetDate.setHours(0, 0, 0, 0);
    const isTargetToday = targetDate.getTime() === today.getTime();

    // Special handling for midnight NS matches
    // ONLY move to next day if we're viewing TODAY's matches
    const fixtureHour = fixture.getHours();
    const fixtureMinute = fixture.getMinutes();
    const isExactMidnight = fixtureHour === 0 && fixtureMinute === 0;

    let effectiveFixture = fixture;
    let adjustedForMidnight = false;

    // For NS matches at exactly 00:00, treat them as belonging to the next day
    // ONLY when viewing TODAY's matches
    if (notStartedStatuses.includes(matchStatus) && isExactMidnight && isTargetToday) {
      effectiveFixture = new Date(fixture);
      effectiveFixture.setDate(effectiveFixture.getDate() + 1);
      effectiveFixture.setHours(0, 1, 0, 0); // Move to 00:01 of next day
      adjustedForMidnight = true;
    }

    // Create target date's time range boundaries (00:01:00 - 23:59:59)
    const targetStartOfDay = new Date(target);
    targetStartOfDay.setHours(0, 1, 0, 0); // 00:01:00

    const targetEndOfDay = new Date(target);
    targetEndOfDay.setHours(23, 59, 59, 999); // 23:59:59

    const fixtureTime = effectiveFixture.getTime();
    const targetStartTime = targetStartOfDay.getTime();
    const targetEndTime = targetEndOfDay.getTime();

    // Check if fixture is within target date's time range
    const isWithinTimeRange = fixtureTime >= targetStartTime && fixtureTime <= targetEndTime;

    // Handle NS (Not Started) matches
    if (notStartedStatuses.includes(matchStatus)) {
      if (isWithinTimeRange) {
        const reasonSuffix = adjustedForMidnight ? ' (midnight match moved to next day)' : '';
        return {
          label: 'custom',
          reason: `NS match within time range ${format(targetStartOfDay, 'HH:mm')}-${format(targetEndOfDay, 'HH:mm')}${reasonSuffix}`,
          isActualDate: true,
          timeComparison: adjustedForMidnight ? 'ns-midnight-moved-to-next-day' : 'ns-within-time-range',
          customDate: targetDateString
        };
      } else {
        // NS match outside time range - check if it's future or past
        if (fixtureTime > targetEndTime) {
          return {
            label: 'custom',
            reason: `NS match scheduled for future date ${format(effectiveFixture, 'MMM dd, HH:mm')}`,
            isActualDate: false,
            timeComparison: 'ns-future-outside-range',
            customDate: targetDateString
          };
        } else {
          // NS match in the past (edge case - shouldn't happen normally)
          return {
            label: 'custom',
            reason: `NS match scheduled for past date ${format(effectiveFixture, 'MMM dd, HH:mm')}`,
            isActualDate: false,
            timeComparison: 'ns-past-outside-range',
            customDate: targetDateString
          };
        }
      }
    }

    // Handle Finished matches
    if (finishedStatuses.includes(matchStatus)) {
      if (isWithinTimeRange) {
        const hoursSinceMatch = differenceInHours(now, fixture);
        return {
          label: 'custom',
          reason: `Finished match within time range (${hoursSinceMatch}h ago)`,
          isActualDate: true,
          timeComparison: 'finished-within-time-range',
          customDate: targetDateString
        };
      } else {
        // Finished match outside time range - it's history
        return {
          label: 'custom',
          reason: `Finished match from ${format(fixture, 'MMM dd, HH:mm')} (outside time range)`,
          isActualDate: false,
          timeComparison: 'finished-outside-range-history',
          customDate: targetDateString
        };
      }
    }

    // Handle Live matches - always check time range
    if (liveStatuses.includes(matchStatus)) {
      if (isWithinTimeRange) {
        return {
          label: 'custom',
          reason: `Live match within time range`,
          isActualDate: true,
          timeComparison: 'live-within-time-range',
          customDate: targetDateString
        };
      } else {
        return {
          label: 'custom',
          reason: `Live match outside time range`,
          isActualDate: false,
          timeComparison: 'live-outside-time-range',
          customDate: targetDateString
        };
      }
    }

    // Default case - unknown status
    if (isWithinTimeRange) {
      return {
        label: 'custom',
        reason: `Match with status ${matchStatus} within time range`,
        isActualDate: true,
        timeComparison: 'unknown-status-within-range',
        customDate: targetDateString
      };
    } else {
      return {
        label: 'custom',
        reason: `Match with status ${matchStatus} outside time range`,
        isActualDate: false,
        timeComparison: 'unknown-status-outside-range',
        customDate: targetDateString
      };
    }
  }

  /**
   * Special handling for midnight matches (00:00)
   * Moves NS matches at 00:00 to next day to avoid date selector confusion
   */
  static handleMidnightMatches(
    fixtureDate: string,
    matchStatus: string,
    targetDate: string,
    currentTime?: Date
  ): SmartDateResult {
    const fixture = parseISO(fixtureDate);
    const fixtureTime = format(fixture, 'HH:mm');

    // If NS match is scheduled for 00:00, move it to next day
    if (matchStatus === 'NS' && fixtureTime === '00:00') {
      const adjustedFixture = new Date(fixture);
      adjustedFixture.setDate(adjustedFixture.getDate() + 1);

      const adjustedFixtureDate = format(adjustedFixture, 'yyyy-MM-dd');
      const adjustedFixtureDateString = adjustedFixture.toISOString();

      return this.getSmartDateLabelForDate(adjustedFixtureDateString, matchStatus, targetDate, currentTime);
    }

    // Otherwise use standard logic
    return this.getSmartDateLabelForDate(fixtureDate, matchStatus, targetDate, currentTime);
  }

  /**
   * Check if a fixture should be labeled as "yesterday" based on smart logic
   */
  static isSmartYesterday(fixtureDate: string, matchStatus: string, currentTime?: Date, referenceDate?: Date): boolean {
    const result = this.getSmartDateLabel(fixtureDate, matchStatus, currentTime, referenceDate);
    return result.label === 'yesterday';
  }

  /**
   * Check if a fixture should be labeled as "today" based on smart logic
   */
  static isSmartToday(fixtureDate: string, matchStatus: string, currentTime?: Date, referenceDate?: Date): boolean {
    const result = this.getSmartDateLabel(fixtureDate, matchStatus, currentTime, referenceDate);
    return result.label === 'today';
  }

  /**
   * Check if a fixture should be labeled as "tomorrow" based on smart logic
   */
  static isSmartTomorrow(fixtureDate: string, matchStatus: string, currentTime?: Date, referenceDate?: Date): boolean {
    const result = this.getSmartDateLabel(fixtureDate, matchStatus, currentTime, referenceDate);
    return result.label === 'tomorrow';
  }

  /**
   * Check if a fixture should be included for a specific target date
   */
  static isSmartMatchForDate(fixtureDate: string, matchStatus: string, targetDate: string, currentTime?: Date): boolean {
    const result = this.getSmartDateLabelForDate(fixtureDate, matchStatus, targetDate, currentTime);
    return result.isActualDate;
  }

  /**
   * Get smart date result for any target date
   */
  static getSmartDateResultForDate(fixtureDate: string, matchStatus: string, targetDate: string, currentTime?: Date): SmartDateResult {
    return this.getSmartDateLabelForDate(fixtureDate, matchStatus, targetDate, currentTime);
  }

  /**
   * Get detailed info about smart date labeling decision
   */
  static getSmartDateInfo(fixtureDate: string, matchStatus: string, currentTime?: Date, referenceDate?: Date): {
    label: string;
    reason: string;
    isActualDate: boolean;
    timeComparison: string;
    fixtureTime: string;
    currentTime: string;
    timeDifference: string;
  } {
    const now = currentTime || new Date();
    const fixture = parseISO(fixtureDate);
    const result = this.getSmartDateLabel(fixtureDate, matchStatus, currentTime, referenceDate);

    return {
      label: result.label,
      reason: result.reason,
      isActualDate: result.isActualDate,
      timeComparison: result.timeComparison,
      fixtureTime: isValid(fixture) ? format(fixture, 'yyyy-MM-dd HH:mm:ss') : 'invalid',
      currentTime: format(now, 'yyyy-MM-dd HH:mm:ss'),
      timeDifference: isValid(fixture) ? `${differenceInHours(now, fixture)}h` : 'N/A'
    };
  }

  /**
   * Debug helper: Analyze time range logic
   */
  static debugTimeRangeLogic(fixtureDate: string, targetDate: string, matchStatus: string): {
    fixture: string;
    target: string;
    fixtureTime: number;
    targetStartTime: number;
    targetEndTime: number;
    isWithinRange: boolean;
    status: string;
    decision: string;
    midnightAdjusted: boolean;
  } {
    const fixture = parseISO(fixtureDate);
    const target = parseISO(targetDate);

    // Check for midnight adjustment
    const isExactMidnight = fixture.getHours() === 0 && fixture.getMinutes() === 0;
    const midnightAdjusted = matchStatus === 'NS' && isExactMidnight;

    let effectiveFixture = fixture;
    if (midnightAdjusted) {
      effectiveFixture = new Date(fixture);
      effectiveFixture.setDate(effectiveFixture.getDate() + 1);
      effectiveFixture.setHours(0, 1, 0, 0);
    }

    const targetStartOfDay = new Date(target);
    targetStartOfDay.setHours(0, 1, 0, 0);

    const targetEndOfDay = new Date(target);
    targetEndOfDay.setHours(23, 59, 59, 999);

    const fixtureTime = effectiveFixture.getTime();
    const targetStartTime = targetStartOfDay.getTime();
    const targetEndTime = targetEndOfDay.getTime();
    const isWithinRange = fixtureTime >= targetStartTime && fixtureTime <= targetEndTime;

    let decision = '';
    if (matchStatus === 'NS') {
      decision = isWithinRange ? 'TODAY (within range)' : 'TOMORROW (outside range)';
      if (midnightAdjusted) {
        decision += ' [MIDNIGHT ADJUSTED]';
      }
    } else if (['FT', 'AET', 'PEN'].includes(matchStatus)) {
      decision = isWithinRange ? 'TODAY (within range)' : 'YESTERDAY (outside range)';
    } else {
      decision = isWithinRange ? 'TODAY (within range)' : 'OTHER DATE (outside range)';
    }

    return {
      fixture: format(fixture, 'yyyy-MM-dd HH:mm:ss'),
      target: format(target, 'yyyy-MM-dd'),
      fixtureTime,
      targetStartTime,
      targetEndTime,
      isWithinRange,
      status: matchStatus,
      decision,
      midnightAdjusted
    };
  }
}