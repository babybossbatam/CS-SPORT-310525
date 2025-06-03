
import { format, parseISO, isValid, differenceInHours } from 'date-fns';

/**
 * MydateConversionFilter - Centralized datetime filtering and conversion utilities
 * Handles server-to-client date conversions, timezone considerations, and fixture filtering
 */

// ===== Core Date Conversion Functions =====

/**
 * Get current UTC date string in YYYY-MM-DD format
 */
export const getCurrentUTCDateString = (): string => {
  const now = new Date();
  return format(now, 'yyyy-MM-dd');
};

/**
 * Get current client date string in YYYY-MM-DD format (local timezone)
 */
export const getCurrentClientDateString = (): string => {
  const now = new Date();
  return format(now, 'yyyy-MM-dd');
};

/**
 * Convert UTC fixture time to client's local date
 */
export const getFixtureClientDate = (utcDateString: string): string => {
  try {
    const utcDate = parseISO(utcDateString);
    if (!isValid(utcDate)) return utcDateString.split('T')[0];
    
    // Convert to client's local timezone and get the date part
    const clientDate = new Date(utcDate.getTime());
    return format(clientDate, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error converting to client date:', error);
    return utcDateString.split('T')[0];
  }
};

/**
 * Convert UTC fixture time to user's local date (alias for consistency)
 */
export const getFixtureLocalDate = (utcDateString: string): string => {
  return getFixtureClientDate(utcDateString);
};

// ===== Date Validation Functions =====

/**
 * Safe date parsing with validation
 */
export const parseDate = (dateString: string): Date | null => {
  try {
    const date = parseISO(dateString);
    return isValid(date) ? date : null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Format date safely with fallback
 */
export const formatDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Get valid date with fallback to current date
 */
export const getValidDate = (dateString?: string): string => {
  try {
    if (!dateString) {
      return getCurrentUTCDateString();
    }
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'yyyy-MM-dd') : getCurrentUTCDateString();
  } catch (error) {
    console.error('Error getting valid date:', error);
    return getCurrentUTCDateString();
  }
};

// ===== Relative Date Check Functions =====

/**
 * Check if a date string represents today in client timezone
 */
export const isDateStringToday = (dateString: string): boolean => {
  const actualToday = getCurrentClientDateString();
  return dateString === actualToday;
};

/**
 * Check if a date string represents yesterday in client timezone
 */
export const isDateStringYesterday = (dateString: string): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const actualYesterday = format(yesterday, 'yyyy-MM-dd');
  return dateString === actualYesterday;
};

/**
 * Check if a date string represents tomorrow in client timezone
 */
export const isDateStringTomorrow = (dateString: string): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const actualTomorrow = format(tomorrow, 'yyyy-MM-dd');
  return dateString === actualTomorrow;
};

/**
 * Check if a fixture date-time is today considering client timezone
 */
export const isFixtureDateTimeStringToday = (dateTimeString: string): boolean => {
  try {
    const fixtureClientDate = getFixtureClientDate(dateTimeString);
    const todayClientDate = getCurrentClientDateString();
    return fixtureClientDate === todayClientDate;
  } catch {
    return false;
  }
};

/**
 * Check if a fixture date-time was yesterday considering client timezone
 */
export const isFixtureDateTimeStringYesterday = (dateTimeString: string): boolean => {
  try {
    const fixtureClientDate = getFixtureClientDate(dateTimeString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayClientDate = format(yesterday, 'yyyy-MM-dd');
    return fixtureClientDate === yesterdayClientDate;
  } catch {
    return false;
  }
};

/**
 * Check if a fixture date-time is tomorrow considering client timezone
 */
export const isFixtureDateTimeStringTomorrow = (dateTimeString: string): boolean => {
  try {
    const fixtureClientDate = getFixtureClientDate(dateTimeString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowClientDate = format(tomorrow, 'yyyy-MM-dd');
    return fixtureClientDate === tomorrowClientDate;
  } catch {
    return false;
  }
};

// ===== Enhanced Date Comparison Functions =====

/**
 * Enhanced date comparison that considers time for midnight matches
 */
export const isDateTimeStringToday = (dateTimeString: string): boolean => {
  try {
    const matchDate = parseISO(dateTimeString);
    if (!isValid(matchDate)) return false;
    
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    return matchDate >= todayStart && matchDate <= todayEnd;
  } catch {
    return false;
  }
};

/**
 * Enhanced date comparison for yesterday with time consideration
 */
export const isDateTimeStringYesterday = (dateTimeString: string): boolean => {
  try {
    const matchDate = parseISO(dateTimeString);
    if (!isValid(matchDate)) return false;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);
    
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);
    
    return matchDate >= yesterdayStart && matchDate <= yesterdayEnd;
  } catch {
    return false;
  }
};

/**
 * Enhanced date comparison for tomorrow with time consideration
 */
export const isDateTimeStringTomorrow = (dateTimeString: string): boolean => {
  try {
    const matchDate = parseISO(dateTimeString);
    if (!isValid(matchDate)) return false;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);
    
    return matchDate >= tomorrowStart && matchDate <= tomorrowEnd;
  } catch {
    return false;
  }
};

// ===== Fixture Filtering Functions =====

/**
 * Check if a fixture belongs to a specific client date
 */
export const isFixtureOnClientDate = (fixtureUTCDate: string, targetClientDate: string): boolean => {
  try {
    const fixtureClientDate = getFixtureClientDate(fixtureUTCDate);
    return fixtureClientDate === targetClientDate;
  } catch (error) {
    console.error('Error checking fixture client date:', error);
    return false;
  }
};

/**
 * Check if a fixture belongs to a specific local date (alias for consistency)
 */
export const isFixtureOnLocalDate = (fixtureUTCDate: string, targetLocalDate: string): boolean => {
  return isFixtureOnClientDate(fixtureUTCDate, targetLocalDate);
};

/**
 * Convert UTC date to user's local timezone and format as time string
 */
export const formatFixtureTime = (utcDateString: string): string => {
  try {
    const utcDate = parseISO(utcDateString);
    if (!isValid(utcDate)) return '00:00';
    
    // Convert to user's local time
    const localTime = new Date(utcDate.getTime());
    return format(localTime, 'HH:mm');
  } catch (error) {
    console.error('Error formatting fixture time:', error);
    return '00:00';
  }
};

/**
 * Check if fixture date is in user's local timezone today
 */
export const isFixtureToday = (utcDateString: string): boolean => {
  try {
    const utcDate = parseISO(utcDateString);
    if (!isValid(utcDate)) return false;
    
    const localDate = new Date(utcDate.getTime());
    const today = new Date();
    
    return format(localDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error checking if fixture is today:', error);
    return false;
  }
};

/**
 * Check if fixture date is in user's local timezone tomorrow
 */
export const isFixtureTomorrow = (utcDateString: string): boolean => {
  try {
    const utcDate = parseISO(utcDateString);
    if (!isValid(utcDate)) return false;
    
    const localDate = new Date(utcDate.getTime());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return format(localDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error checking if fixture is tomorrow:', error);
    return false;
  }
};

/**
 * Check if fixture date is in user's local timezone yesterday
 */
export const isFixtureYesterday = (utcDateString: string): boolean => {
  try {
    const utcDate = parseISO(utcDateString);
    if (!isValid(utcDate)) return false;
    
    const localDate = new Date(utcDate.getTime());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return format(localDate, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error checking if fixture is yesterday:', error);
    return false;
  }
};

/**
 * Advanced fixture date validation with timezone-inclusive matching
 * Includes fixtures within ±1.5 days to capture timezone edge cases
 */
export const isFixtureValidForSelectedDate = (fixture: any, selectedDate: string): boolean => {
  try {
    if (!fixture?.fixture?.date) {
      return false;
    }

    const fixtureUTCDate = fixture.fixture.date;
    
    // Primary check: exact client date match
    const fixtureClientDate = getFixtureClientDate(fixtureUTCDate);
    if (fixtureClientDate === selectedDate) {
      return true;
    }

    // Secondary check: timezone-inclusive matching
    // Include fixtures from ±1 day that might be relevant due to timezone differences
    const targetDate = new Date(selectedDate);
    const fixtureDate = new Date(fixtureUTCDate);

    // Calculate date difference in days
    const timeDiff = Math.abs(fixtureDate.getTime() - targetDate.getTime());
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    // Include fixtures within 1.5 days to capture timezone edge cases
    return daysDiff <= 1.5;
  } catch (error) {
    console.warn('Date validation error for fixture:', fixture?.fixture?.id, error);
    return false;
  }
};

/**
 * Multi-timezone fixture filtering for comprehensive date coverage
 * Returns array of dates to fetch to cover all possible timezones
 */
export const getMultiTimezoneDateRange = (targetDate: string): string[] => {
  try {
    const targetDateObj = new Date(targetDate + 'T00:00:00Z');
    const previousDay = new Date(targetDateObj);
    previousDay.setDate(previousDay.getDate() - 1);
    const nextDay = new Date(targetDateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    return [
      previousDay.toISOString().split('T')[0],
      targetDate,
      nextDay.toISOString().split('T')[0]
    ];
  } catch (error) {
    console.error('Error generating multi-timezone date range:', error);
    return [targetDate];
  }
};

// ===== Date Range and Time Functions =====

/**
 * Get date range for a selected date (covers 00:01 to 23:59 of that day)
 */
export const getDateTimeRange = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      throw new Error('Invalid date string');
    }

    // Start of day: 00:01 AM
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 1, 0, 0);

    // End of day: 23:59 PM
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return {
      start: startOfDay,
      end: endOfDay,
      startTimestamp: Math.floor(startOfDay.getTime() / 1000),
      endTimestamp: Math.floor(endOfDay.getTime() / 1000)
    };
  } catch (error) {
    console.error('Error getting date time range:', error);
    // Fallback to current date
    const now = new Date();
    return getDateTimeRange(format(now, 'yyyy-MM-dd'));
  }
};

/**
 * Get current UTC date string with time in YYYY-MM-DD-HH:mm:ss format
 */
export const getCurrentUTCDateTimeString = (): string => {
  const now = new Date();
  return format(now, 'yyyy-MM-dd-HH:mm:ss');
};

// ===== Display and Utility Functions =====

/**
 * Get relative date display name for UI
 */
export const getRelativeDateDisplayName = (dateString: string): string => {
  if (isDateStringToday(dateString)) return "Today's Matches";
  if (isDateStringYesterday(dateString)) return "Yesterday's Matches";
  if (isDateStringTomorrow(dateString)) return "Tomorrow's Matches";
  
  try {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'EEE, do MMM') + ' Matches' : dateString;
  } catch {
    return dateString;
  }
};

/**
 * Safe substring function to handle null/undefined values
 */
export const safeSubstring = (value: any, start: number, end?: number): string => {
  // Return empty string if value is null or undefined
  if (value == null) {
    return '';
  }

  // Convert to string if it's not already (handles numbers, etc.)
  const str = String(value);

  // If end is provided, use it, otherwise just use start parameter
  return end !== undefined ? str.substring(start, end) : str.substring(start);
};

/**
 * Format date as YYYY-MM-DD with error handling
 */
export const formatYYYYMMDD = (date: Date): string => {
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date to YYYY-MM-DD:', error);
    return format(new Date(), 'yyyy-MM-dd');
  }
};

// ===== Legacy Date Check Functions (for compatibility) =====

/**
 * Check if a date is today (Date object version)
 */
export const isToday = (date: Date): boolean => {
  if (!date || !isValid(date)) return false;
  const today = new Date();
  return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
};

/**
 * Check if a date is yesterday (Date object version)
 */
export const isYesterday = (date: Date): boolean => {
  if (!date || !isValid(date)) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd');
};

/**
 * Check if a date is tomorrow (Date object version)
 */
export const isTomorrow = (date: Date): boolean => {
  if (!date || !isValid(date)) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return format(date, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd');
};

// ===== Export Default Configuration =====

/**
 * Default configuration object for common date filtering scenarios
 */
export const dateFilterConfig = {
  // Common date ranges
  timezoneTolerance: 1.5, // days
  cacheAge: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
  
  // Status codes for live matches
  liveStatuses: ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'],
  
  // Status codes for finished matches
  finishedStatuses: ['FT', 'AET', 'PEN'],
  
  // Status codes for upcoming matches
  upcomingStatuses: ['TBD', 'NS', 'WO', 'CANC', 'ABD', 'AWD', 'PST']
};

/**
 * Main export object with all utilities
 */
export default {
  // Core conversion functions
  getCurrentUTCDateString,
  getCurrentClientDateString,
  getFixtureClientDate,
  getFixtureLocalDate,
  
  // Date validation
  parseDate,
  formatDate,
  getValidDate,
  
  // Relative date checks
  isDateStringToday,
  isDateStringYesterday,
  isDateStringTomorrow,
  isFixtureDateTimeStringToday,
  isFixtureDateTimeStringYesterday,
  isFixtureDateTimeStringTomorrow,
  
  // Enhanced date comparisons
  isDateTimeStringToday,
  isDateTimeStringYesterday,
  isDateTimeStringTomorrow,
  
  // Timezone-aware fixture checks
  isFixtureToday,
  isFixtureTomorrow,
  isFixtureYesterday,
  formatFixtureTime,
  
  // Fixture filtering
  isFixtureOnClientDate,
  isFixtureOnLocalDate,
  isFixtureValidForSelectedDate,
  getMultiTimezoneDateRange,
  
  // Date ranges and time
  getDateTimeRange,
  getCurrentUTCDateTimeString,
  
  // Display utilities
  getRelativeDateDisplayName,
  safeSubstring,
  formatYYYYMMDD,
  
  // Legacy compatibility
  isToday,
  isYesterday,
  isTomorrow,
  
  // Configuration
  dateFilterConfig
};
