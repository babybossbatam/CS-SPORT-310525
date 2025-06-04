import { parseISO, isValid, format, differenceInHours, isSameDay, isAfter, isBefore } from 'date-fns';

export interface SmartDateResult {
  label: 'today' | 'yesterday' | 'tomorrow';
  reason: string;
  isActualDate: boolean;
  timeComparison: string;
}

/**
 * Smart date labeling based on match status and time comparison
 * If match is not started, compare current time vs fixture time to determine actual date label
 */
export class MySmartDateLabeling {

  /**
   * Determine smart date label based on match status and time comparison
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
   */
  private static getSmartTimeBasedLabel(fixture: Date, now: Date): SmartDateResult {
    const nowTime = now.getTime();
    const fixtureTime = fixture.getTime();

    // If fixture time has already passed, it should be considered "yesterday" 
    // even if it's the same calendar date
    if (fixtureTime < nowTime) {
      const hoursPassed = differenceInHours(now, fixture);

      if (isSameDay(fixture, now)) {
        // Same calendar date but time has passed
        return {
          label: 'yesterday',
          reason: `Match time ${format(fixture, 'HH:mm')} has passed (${hoursPassed}h ago)`,
          isActualDate: false,
          timeComparison: 'time-passed-same-day'
        };
      } else {
        // Different calendar date and time has passed
        return {
          label: 'yesterday',
          reason: `Match date and time have passed`,
          isActualDate: true,
          timeComparison: 'date-and-time-passed'
        };
      }
    }

    // If fixture time is in the future
    if (fixtureTime > nowTime) {
      const hoursUntil = differenceInHours(fixture, now);

      if (isSameDay(fixture, now)) {
        // Same calendar date and time is in future - check if it's within today's range
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        if (fixtureTime <= endOfToday.getTime()) {
          // Match is still within today's time range (before 23:59:59)
          return {
            label: 'today',
            reason: `Match at ${format(fixture, 'HH:mm')} is upcoming (in ${hoursUntil}h)`,
            isActualDate: true,
            timeComparison: 'same-day-upcoming'
          };
        } else {
          // This shouldn't happen as we already checked isSameDay, but keeping for safety
          return {
            label: 'today',
            reason: `Match at ${format(fixture, 'HH:mm')} is upcoming (in ${hoursUntil}h)`,
            isActualDate: true,
            timeComparison: 'same-day-upcoming'
          };
        }
      } else {
        // Different calendar date - check if it's tomorrow or future
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (isSameDay(fixture, tomorrow)) {
          // Special case: If current time is late (after midnight range) and fixture is early next day
          // Example: current time 10:30AM, fixture tomorrow 00:30AM
          const currentHour = now.getHours();
          const fixtureHour = fixture.getHours();

          // If current time has passed midnight range (after 00:00) and fixture is in early hours
          if (currentHour > 0 && fixtureHour < currentHour) {
            return {
              label: 'tomorrow',
              reason: `Match tomorrow at ${format(fixture, 'HH:mm')} (future match passed today's range)`,
              isActualDate: true,
              timeComparison: 'next-day-early-hours'
            };
          } else {
            return {
              label: 'tomorrow',
              reason: `Match is tomorrow at ${format(fixture, 'HH:mm')}`,
              isActualDate: true,
              timeComparison: 'next-day'
            };
          }
        } else {
          // More than 1 day away
          return {
            label: 'tomorrow',
            reason: `Match is in future (${format(fixture, 'MMM dd, HH:mm')})`,
            isActualDate: false,
            timeComparison: 'future-date'
          };
        }
      }
    }

    // Exact same time (very unlikely but handle it)
    return {
      label: 'today',
      reason: 'Match is happening now',
      isActualDate: true,
      timeComparison: 'exact-now'
    };
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