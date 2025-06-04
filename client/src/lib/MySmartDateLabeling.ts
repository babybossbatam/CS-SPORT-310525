import { parseISO, isValid, format, differenceInHours, isSameDay, isAfter, isBefore } from 'date-fns';

export interface SmartDateResult {
  label: 'today' | 'yesterday' | 'tomorrow' | 'custom';
  reason: string;
  isActualDate: boolean;
  timeComparison: string;
  customDate?: string; // Store the actual date when using custom label
}

/**
 * Smart date labeling based on match status and time comparison
 * If match is not started, compare current time vs fixture time to determine actual date label
 */
export class MySmartDateLabeling {

  /**
   * Determine smart date label for a specific target date
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

    const finishedStatuses = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'];
    const liveStatuses = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'];

    // For finished matches, use enhanced logic with target date
    if (finishedStatuses.includes(matchStatus)) {
      return this.getFinishedMatchDateLabelForDate(fixture, target, targetDate, now);
    }

    // For live matches, use standard date comparison with target date
    if (liveStatuses.includes(matchStatus)) {
      return this.getStandardDateLabelForDate(fixture, target, targetDate);
    }

    // For not started matches, use smart time comparison with target date
    if (matchStatus === 'NS' || matchStatus === 'TBD' || matchStatus === 'PST') {
      return this.getStandardDateLabelForDate(fixture, target, targetDate);
    }

    // Default to standard date comparison for other statuses
    return this.getStandardDateLabelForDate(fixture, target, targetDate);
  }

  /**
   * Determine smart date label based on match status and time comparison (legacy method)
   */
  static getSmartDateLabel(
    fixtureDate: string,
    matchStatus: string,
    currentTime?: Date
  ): SmartDateResult {
    const now = currentTime || new Date();
    const fixture = parseISO(fixtureDate);

    if (!isValid(fixture)) {
      return {
        label: 'today',
        reason: 'Invalid fixture date',
        isActualDate: false,
        timeComparison: 'invalid'
      };
    }

    const finishedStatuses = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'];
    const liveStatuses = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'];

    // For finished matches, use enhanced logic
    if (finishedStatuses.includes(matchStatus)) {
      return this.getFinishedMatchDateLabel(fixture, now);
    }

    // For live matches, use standard date comparison
    if (liveStatuses.includes(matchStatus)) {
      return this.getStandardDateLabel(fixture, now);
    }

    // For not started matches (NS, TBD, PST), use smart time comparison
    if (matchStatus === 'NS' || matchStatus === 'TBD' || matchStatus === 'PST') {
      return this.getSmartTimeBasedLabel(fixture, now);
    }

    // Default to standard date comparison for other statuses
    return this.getStandardDateLabel(fixture, now);
  }

  /**
   * Smart time-based labeling for not started matches
   * For NS matches, use standard date comparison since they haven't started yet
   * This ensures NS matches follow the correct logic:
   * - NS matches within today's calendar date → "today"  
   * - NS matches outside today's calendar date → "tomorrow"
   */
  private static getSmartTimeBasedLabel(fixture: Date, now: Date): SmartDateResult {
    // For not started matches (NS), always use standard date comparison
    // since they haven't started yet and shouldn't be affected by time ranges
    return this.getStandardDateLabel(fixture, now);
  }

  /**
   * Enhanced date labeling for finished matches
   */
  private static getFinishedMatchDateLabel(fixture: Date, now: Date): SmartDateResult {
    const nowTime = now.getTime();
    const fixtureTime = fixture.getTime();

    // Create today's time range boundaries (00:00:01 - 23:59:59)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 1, 0); // 00:00:01

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999); // 23:59:59

    const todayStartTime = todayStart.getTime();
    const todayEndTime = todayEnd.getTime();

    // If fixture time has already passed (which it should for finished matches)
    if (fixtureTime < nowTime) {
      // Check if finished match is within today's time range (00:00:01 - 23:59:59)
      if (fixtureTime >= todayStartTime && fixtureTime <= todayEndTime) {
        // Finished match from today's time range - count as "Today / Recent Match"
        const hoursPassed = differenceInHours(now, fixture);
        return {
          label: 'today',
          reason: `Finished match from ${format(fixture, 'MMM dd, HH:mm')} (${hoursPassed}h ago, within today's range)`,
          isActualDate: true,
          timeComparison: 'finished-within-today-range'
        };
      } else {
        // Finished match outside today's time range - count as "Yesterday"
        if (isSameDay(fixture, now)) {
          // Same calendar date but outside time range (edge case)
          const hoursPassed = differenceInHours(now, fixture);
          return {
            label: 'yesterday',
            reason: `Finished match from ${format(fixture, 'HH:mm')} (${hoursPassed}h ago, outside today's range)`,
            isActualDate: false,
            timeComparison: 'finished-same-day-outside-range'
          };
        } else {
          // Different calendar date and outside time range
          return {
            label: 'yesterday',
            reason: `Finished match from ${format(fixture, 'MMM dd, HH:mm')} (outside today's range)`,
            isActualDate: true,
            timeComparison: 'finished-previous-date-outside-range'
          };
        }
      }
    }

    // Fallback to standard labeling for edge cases
    return this.getStandardDateLabel(fixture, now);
  }

  /**
   * Enhanced date labeling for finished matches with target date
   */
  private static getFinishedMatchDateLabelForDate(
    fixture: Date, 
    target: Date, 
    targetDateString: string, 
    now: Date
  ): SmartDateResult {
    const fixtureTime = fixture.getTime();
    const targetStartOfDay = new Date(target);
    targetStartOfDay.setHours(0, 0, 1, 0);
    const targetEndOfDay = new Date(target);
    targetEndOfDay.setHours(23, 59, 59, 999);

    // Check if finished match falls within target date range
    if (fixtureTime >= targetStartOfDay.getTime() && fixtureTime <= targetEndOfDay.getTime()) {
      const hoursSinceMatch = differenceInHours(now, fixture);
      return {
        label: 'custom',
        reason: `Finished match from ${format(fixture, 'MMM dd, HH:mm')} (${hoursSinceMatch}h ago, within target date)`,
        isActualDate: true,
        timeComparison: 'finished-within-target-date',
        customDate: targetDateString
      };
    }

    return {
      label: 'custom',
      reason: `Finished match outside target date range`,
      isActualDate: false,
      timeComparison: 'finished-outside-target-date',
      customDate: targetDateString
    };
  }

  /**
   * Standard date labeling for any target date
   */
  private static getStandardDateLabelForDate(fixture: Date, target: Date, targetDateString: string): SmartDateResult {
    const fixtureDate = format(fixture, 'yyyy-MM-dd');
    const targetDate = format(target, 'yyyy-MM-dd');

    if (fixtureDate === targetDate) {
      return {
        label: 'custom',
        reason: `Match is on target date ${targetDate}`,
        isActualDate: true,
        timeComparison: 'standard-target-date',
        customDate: targetDateString
      };
    }

    return {
      label: 'custom',
      reason: `Match is not on target date ${targetDate}`,
      isActualDate: false,
      timeComparison: 'standard-not-target-date',
      customDate: targetDateString
    };
  }

  /**
   * Standard date labeling for finished/live matches
   */
  private static getStandardDateLabel(fixture: Date, now: Date): SmartDateResult {
    const today = new Date(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (isSameDay(fixture, today)) {
      return {
        label: 'today',
        reason: 'Match is on today\'s date',
        isActualDate: true,
        timeComparison: 'standard-today'
      };
    } else if (isSameDay(fixture, yesterday)) {
      return {
        label: 'yesterday',
        reason: 'Match is on yesterday\'s date',
        isActualDate: true,
        timeComparison: 'standard-yesterday'
      };
    } else if (isSameDay(fixture, tomorrow)) {
      return {
        label: 'tomorrow',
        reason: 'Match is on tomorrow\'s date',
        isActualDate: true,
        timeComparison: 'standard-tomorrow'
      };
    } else if (isBefore(fixture, yesterday)) {
      return {
        label: 'yesterday',
        reason: 'Match is from a past date',
        isActualDate: false,
        timeComparison: 'standard-past'
      };
    } else {
      return {
        label: 'tomorrow',
        reason: 'Match is on a future date',
        isActualDate: false,
        timeComparison: 'standard-future'
      };
    }
  }

  /**
   * Check if a fixture should be labeled as "yesterday" based on smart logic
   */
  static isSmartYesterday(fixtureDate: string, matchStatus: string, currentTime?: Date): boolean {
    const result = this.getSmartDateLabel(fixtureDate, matchStatus, currentTime);
    return result.label === 'yesterday';
  }

  /**
   * Check if a fixture should be labeled as "today" based on smart logic
   */
  static isSmartToday(fixtureDate: string, matchStatus: string, currentTime?: Date): boolean {
    const result = this.getSmartDateLabel(fixtureDate, matchStatus, currentTime);
    return result.label === 'today';
  }

  /**
   * Check if a fixture should be labeled as "tomorrow" based on smart logic
   */
  static isSmartTomorrow(fixtureDate: string, matchStatus: string, currentTime?: Date): boolean {
    const result = this.getSmartDateLabel(fixtureDate, matchStatus, currentTime);
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
  static getSmartDateInfo(fixtureDate: string, matchStatus: string, currentTime?: Date): {
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
    const result = this.getSmartDateLabel(fixtureDate, matchStatus, currentTime);

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
}