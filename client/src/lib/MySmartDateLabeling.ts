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
    currentTime?: Date,
    referenceDate?: Date
  ): SmartDateResult {
    const now = currentTime || new Date();
    const reference = referenceDate || now;
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

    // For finished matches, use enhanced logic with reference date
    if (finishedStatuses.includes(matchStatus)) {
      return this.getFinishedMatchDateLabelWithReference(fixture, now, reference);
    }

    // For live matches, use standard date comparison with reference
    if (liveStatuses.includes(matchStatus)) {
      return this.getStandardDateLabelWithReference(fixture, reference);
    }

    // For not started matches (NS, TBD, PST), use smart time comparison with reference
    if (matchStatus === 'NS' || matchStatus === 'TBD' || matchStatus === 'PST') {
      return this.getSmartTimeBasedLabelWithReference(fixture, reference);
    }

    // Default to standard date comparison with reference
    return this.getStandardDateLabelWithReference(fixture, reference);
  }

  /**
   * Smart time-based labeling for not started matches
   * For NS matches, check if fixture is within today's time range (00:01:00-23:59:59)
   * - NS matches within today's time range → "today"  
   * - NS matches outside today's time range → "tomorrow"
   * IMPORTANT: NS matches should NOT have past dates (data inconsistency)
   */
  private static getSmartTimeBasedLabel(fixture: Date, now: Date): SmartDateResult {
    // Convert fixture to local time for proper comparison
    const fixtureLocal = new Date(fixture.getTime());
    const nowLocal = new Date(now.getTime());
    
    // Get the local date string for comparison
    const fixtureLocalDateString = format(fixtureLocal, 'yyyy-MM-dd');
    const nowLocalDateString = format(nowLocal, 'yyyy-MM-dd');
    
    const fixtureTime = fixtureLocal.getTime();

    // CRITICAL CHECK: NS matches should not have past dates
    // This indicates data inconsistency - an NS match cannot be in the past
    const nowTime = nowLocal.getTime();
    if (fixtureTime < nowTime) {
      console.warn(`⚠️ [Smart Date] INVALID NS MATCH - Past date detected:`, {
        fixture: format(fixtureLocal, 'yyyy-MM-dd HH:mm:ss'),
        current: format(nowLocal, 'yyyy-MM-dd HH:mm:ss'),
        status: 'NS',
        issue: 'NS match cannot have past date - data inconsistency'
      });
      
      // Reject past NS matches as invalid - they should be PST, CANC, or have other status
      return {
        label: 'custom',
        reason: `INVALID: NS match cannot have past date ${format(fixtureLocal, 'MMM dd, HH:mm')} - data inconsistency`,
        isActualDate: false,
        timeComparison: 'ns-invalid-past-date'
      };
    }

    // Create today's time range boundaries based on current LOCAL date (00:01:00 - 23:59:59)
    const todayStart = new Date(nowLocal);
    todayStart.setHours(0, 1, 0, 0); // 00:01:00

    const todayEnd = new Date(nowLocal);
    todayEnd.setHours(23, 59, 59, 999); // 23:59:59

    const todayStartTime = todayStart.getTime();
    const todayEndTime = todayEnd.getTime();

    // Debug logging for time range checking
    console.log(`🕒 [Smart Date] Checking NS match:`, {
      fixture: format(fixtureLocal, 'yyyy-MM-dd HH:mm:ss'),
      current: format(nowLocal, 'yyyy-MM-dd HH:mm:ss'),
      fixtureLocalDate: fixtureLocalDateString,
      nowLocalDate: nowLocalDateString,
      todayRange: `${format(todayStart, 'yyyy-MM-dd HH:mm:ss')} - ${format(todayEnd, 'yyyy-MM-dd HH:mm:ss')}`,
      dateMatches: fixtureLocalDateString === nowLocalDateString,
      withinTimeRange: fixtureTime >= todayStartTime && fixtureTime <= todayEndTime,
      isFutureMatch: fixtureTime >= nowTime
    });

    // Primary check: Are we on the same local date?
    if (fixtureLocalDateString === nowLocalDateString) {
      return {
        label: 'today',
        reason: `NS match from ${format(fixtureLocal, 'MMM dd, HH:mm')} (same local date as today)`,
        isActualDate: true,
        timeComparison: 'ns-same-local-date'
      };
    }
    
    // Secondary check: If different date, check if it's tomorrow
    const tomorrowLocal = new Date(nowLocal);
    tomorrowLocal.setDate(tomorrowLocal.getDate() + 1);
    const tomorrowLocalDateString = format(tomorrowLocal, 'yyyy-MM-dd');
    
    if (fixtureLocalDateString === tomorrowLocalDateString) {
      return {
        label: 'tomorrow',
        reason: `NS match from ${format(fixtureLocal, 'MMM dd, HH:mm')} (tomorrow's local date)`,
        isActualDate: false,
        timeComparison: 'ns-tomorrow-local-date'
      };
    }

    // For future dates beyond tomorrow
    return {
      label: 'tomorrow',
      reason: `NS match from ${format(fixtureLocal, 'MMM dd, HH:mm')} (future date)`,
      isActualDate: false,
      timeComparison: 'ns-future-date'
    };
  }

  /**
   * Smart time-based labeling for not started matches with reference date
   */
  private static getSmartTimeBasedLabelWithReference(fixture: Date, reference: Date): SmartDateResult {
    const fixtureTime = fixture.getTime();

    // Create reference date's time range boundaries (00:01:00 - 23:59:59)
    const referenceStart = new Date(reference);
    referenceStart.setHours(0, 1, 0, 0); // 00:01:00

    const referenceEnd = new Date(reference);
    referenceEnd.setHours(23, 59, 59, 999); // 23:59:59

    const referenceStartTime = referenceStart.getTime();
    const referenceEndTime = referenceEnd.getTime();

    // Check if NS fixture is within reference date's time range
    if (fixtureTime >= referenceStartTime && fixtureTime <= referenceEndTime) {
      return {
        label: 'today',
        reason: `NS match from ${format(fixture, 'MMM dd, HH:mm')} (within reference date's time range 00:01-23:59)`,
        isActualDate: true,
        timeComparison: 'ns-within-reference-range'
      };
    } else if (fixtureTime > referenceEndTime) {
      // Future NS match outside reference range
      return {
        label: 'tomorrow',
        reason: `NS match from ${format(fixture, 'MMM dd, HH:mm')} (future, outside reference date's time range)`,
        isActualDate: false,
        timeComparison: 'ns-future-outside-reference-range'
      };
    } else {
      // Past NS match outside reference range (edge case)
      return {
        label: 'tomorrow',
        reason: `NS match from ${format(fixture, 'MMM dd, HH:mm')} (past NS match, treated as future)`,
        isActualDate: false,
        timeComparison: 'ns-past-outside-reference-range'
      };
    }
  }

  /**
   * Enhanced date labeling for finished matches
   * Finished matches outside time range (00:01:00-23:59:59) are labeled as "yesterday"
   */
  private static getFinishedMatchDateLabel(fixture: Date, now: Date): SmartDateResult {
    const fixtureTime = fixture.getTime();

    // Create today's time range boundaries (00:01:00 - 23:59:59)
    const todayStart = new Date(now);
    todayStart.setHours(0, 1, 0, 0); // 00:01:00

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999); // 23:59:59

    const todayStartTime = todayStart.getTime();
    const todayEndTime = todayEnd.getTime();

    // Check if finished match is within today's time range (00:01:00 - 23:59:59)
    if (fixtureTime >= todayStartTime && fixtureTime <= todayEndTime) {
      // Finished match from today's time range - count as "Today"
      const hoursPassed = differenceInHours(now, fixture);
      return {
        label: 'today',
        reason: `Finished match from ${format(fixture, 'MMM dd, HH:mm')} (${hoursPassed}h ago, within today's range)`,
        isActualDate: true,
        timeComparison: 'finished-within-today-range'
      };
    } else {
      // Finished match outside today's time range - count as "Yesterday" (history)
      const hoursPassed = differenceInHours(now, fixture);
      return {
        label: 'yesterday',
        reason: `Finished match from ${format(fixture, 'MMM dd, HH:mm')} (${hoursPassed}h ago, outside today's range - history)`,
        isActualDate: false,
        timeComparison: 'finished-outside-range-history'
      };
    }
  }

  /**
   * Enhanced date labeling for finished matches with reference date
   * Finished matches outside reference time range are labeled as "yesterday"
   */
  private static getFinishedMatchDateLabelWithReference(fixture: Date, now: Date, reference: Date): SmartDateResult {
    const fixtureTime = fixture.getTime();

    // Create reference date's time range boundaries (00:01:00 - 23:59:59)
    const referenceStart = new Date(reference);
    referenceStart.setHours(0, 1, 0, 0); // 00:01:00

    const referenceEnd = new Date(reference);
    referenceEnd.setHours(23, 59, 59, 999); // 23:59:59

    const referenceStartTime = referenceStart.getTime();
    const referenceEndTime = referenceEnd.getTime();

    // Check if finished match is within reference date's time range (00:01:00 - 23:59:59)
    if (fixtureTime >= referenceStartTime && fixtureTime <= referenceEndTime) {
      // Finished match from reference date's time range - count as "Today"
      const hoursPassed = differenceInHours(now, fixture);
      return {
        label: 'today',
        reason: `Finished match from ${format(fixture, 'MMM dd, HH:mm')} (${hoursPassed}h ago, within reference date's range)`,
        isActualDate: true,
        timeComparison: 'finished-within-reference-range'
      };
    } else {
      // Finished match outside reference date's time range - count as "Yesterday" (history)
      const hoursPassed = differenceInHours(now, fixture);
      return {
        label: 'yesterday',
        reason: `Finished match from ${format(fixture, 'MMM dd, HH:mm')} (${hoursPassed}h ago, outside reference range - history)`,
        isActualDate: false,
        timeComparison: 'finished-outside-reference-range-history'
      };
    }
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
    targetStartOfDay.setHours(0, 1, 0, 0);
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
   * Past dates (before yesterday) → "yesterday" (history)
   * Future dates (after tomorrow) → "tomorrow" (future)
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
        reason: 'Match is from a past date (history - before yesterday)',
        isActualDate: false,
        timeComparison: 'standard-past-history'
      };
    } else {
      return {
        label: 'tomorrow',
        reason: 'Match is on a future date (after tomorrow)',
        isActualDate: false,
        timeComparison: 'standard-future-after-tomorrow'
      };
    }
  }

  /**
   * Standard date labeling with reference date
   * Past dates (before reference yesterday) → "yesterday" (history)
   * Future dates (after reference tomorrow) → "tomorrow" (future)
   */
  private static getStandardDateLabelWithReference(fixture: Date, reference: Date): SmartDateResult {
    const today = new Date(reference);
    const yesterday = new Date(reference);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(reference);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (isSameDay(fixture, today)) {
      return {
        label: 'today',
        reason: 'Match is on reference date (treated as today)',
        isActualDate: true,
        timeComparison: 'standard-reference-today'
      };
    } else if (isSameDay(fixture, yesterday)) {
      return {
        label: 'yesterday',
        reason: 'Match is on day before reference date (treated as yesterday)',
        isActualDate: true,
        timeComparison: 'standard-reference-yesterday'
      };
    } else if (isSameDay(fixture, tomorrow)) {
      return {
        label: 'tomorrow',
        reason: 'Match is on day after reference date (treated as tomorrow)',
        isActualDate: true,
        timeComparison: 'standard-reference-tomorrow'
      };
    } else if (isBefore(fixture, yesterday)) {
      return {
        label: 'yesterday',
        reason: 'Match is from a past date relative to reference (history - before yesterday)',
        isActualDate: false,
        timeComparison: 'standard-reference-past-history'
      };
    } else {
      return {
        label: 'tomorrow',
        reason: 'Match is on a future date relative to reference (after tomorrow)',
        isActualDate: false,
        timeComparison: 'standard-reference-future-after-tomorrow'
      };
    }
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
}