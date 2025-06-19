import { format, parseISO, isValid, differenceInHours } from 'date-fns';

// Get current UTC date string in YYYY-MM-DD format
export const getCurrentUTCDateString = (): string => {
  const now = new Date();
  return format(now, 'yyyy-MM-dd');
};

// Get current UTC date string with time in YYYY-MM-DD-HH:mm:ss format
export const getCurrentUTCDateTimeString = (): string => {
  const now = new Date();
  return format(now, 'yyyy-MM-dd-HH:mm:ss');
};

// Enhanced date comparison that considers time for midnight matches
export function isDateTimeStringToday(dateTimeString: string): boolean {
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
}

// Enhanced date comparison for yesterday with time consideration
export function isDateTimeStringYesterday(dateTimeString: string): boolean {
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
}

// Enhanced date comparison for tomorrow with time consideration
export function isDateTimeStringTomorrow(dateTimeString: string): boolean {
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
}

// Safe substring function to handle null/undefined values
export function safeSubstring(value: any, start: number, end?: number): string {
  // Return empty string if value is null or undefined
  if (value == null) {
    return '';
  }

  // Convert to string if it's not already (handles numbers, etc.)
  const str = String(value);

  // If end is provided, use it, otherwise just use start parameter
  return end !== undefined ? str.substring(start, end) : str.substring(start);
}

// Check if a date is today
export function isToday(date: Date): boolean {
  if (!date || !isValid(date)) return false;
  const today = new Date();
  return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
}

// Check if a date is yesterday
export function isYesterday(date: Date): boolean {
  if (!date || !isValid(date)) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd');
}

// Check if a date is tomorrow
export function isTomorrow(date: Date): boolean {
  if (!date || !isValid(date)) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return format(date, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd');
}

// Format date for display
export function formatDate(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

// Parse date safely
export function parseDate(dateString: string): Date | null {
  try {
    const date = parseISO(dateString);
    return isValid(date) ? date : null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

// Get valid date
export function getValidDate(dateString?: string): string {
  try {
    if (!dateString) {
      return getCurrentUTCDateString();
    }
    const date = parseISO(dateString);
    return isValid(date) ? formatYYYYMMDD(date) : getCurrentUTCDateString();
  } catch (error) {
    console.error('Error getting valid date:', error);
    return getCurrentUTCDateString();
  }
}

// Format date as YYYY-MM-DD
export function formatYYYYMMDD(date: Date): string {
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date to YYYY-MM-DD:', error);
    return format(new Date(), 'yyyy-MM-dd');
  }
}

// Get date range for a selected date (covers 00:01 to 23:59 of that day)
export function getDateTimeRange(dateString: string) {
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
    return getDateTimeRange(formatYYYYMMDD(now));
  }
}

// Get current date in client's timezone
export const getCurrentClientDateString = (): string => {
  const now = new Date();
  return format(now, 'yyyy-MM-dd');
};

// Convert UTC fixture time to client's local date
export function getFixtureClientDate(utcDateString: string): string {
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
}

// Check if a fixture belongs to a specific client date
export function isFixtureOnClientDate(fixtureUTCDate: string, targetClientDate: string): boolean {
  try {
    const fixtureClientDate = getFixtureClientDate(fixtureUTCDate);
    return fixtureClientDate === targetClientDate;
  } catch (error) {
    console.error('Error checking fixture client date:', error);
    return false;
  }
}

// Check if a date string represents today in client timezone
export function isDateStringToday(dateString: string): boolean {
  const actualToday = getCurrentClientDateString();
  return dateString === actualToday;
}

// Check if a date string represents yesterday in client timezone
export function isDateStringYesterday(dateString: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const actualYesterday = format(yesterday, 'yyyy-MM-dd');
  return dateString === actualYesterday;
}

// Check if a date string represents tomorrow in client timezone
export function isDateStringTomorrow(dateString: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const actualTomorrow = format(tomorrow, 'yyyy-MM-dd');
  return dateString === actualTomorrow;
}

// Enhanced date comparison that considers client timezone for fixture times
export function isFixtureDateTimeStringToday(dateTimeString: string): boolean {
  try {
    const fixtureClientDate = getFixtureClientDate(dateTimeString);
    const todayClientDate = getCurrentClientDateString();
    return fixtureClientDate === todayClientDate;
  } catch {
    return false;
  }
}

// Enhanced date comparison for yesterday with client timezone consideration
export function isFixtureDateTimeStringYesterday(dateTimeString: string): boolean {
  try {
    const fixtureClientDate = getFixtureClientDate(dateTimeString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayClientDate = format(yesterday, 'yyyy-MM-dd');
    return fixtureClientDate === yesterdayClientDate;
  } catch {
    return false;
  }
}

// Enhanced date comparison for tomorrow with client timezone consideration
export function isFixtureDateTimeStringTomorrow(dateTimeString: string): boolean {
  try {
    const fixtureClientDate = getFixtureClientDate(dateTimeString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowClientDate = format(tomorrow, 'yyyy-MM-dd');
    return fixtureClientDate === tomorrowClientDate;
  } catch {
    return false;
  }
}

// 365scores.com style: Convert UTC fixture time to user's local date
export function getFixtureLocalDate(utcDateString: string): string {
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

// 365scores.com style: Check if a fixture belongs to a specific local date
export function isFixtureOnLocalDate(fixtureUTCDate: string, targetLocalDate: string): boolean {
  try {
    const fixtureLocalDate = getFixtureLocalDate(fixtureUTCDate);
    return fixtureLocalDate === targetLocalDate;
  } catch (error) {
    console.error('Error checking fixture local date:', error);
    return false;
  }
}

// Get relative date display name
export function getRelativeDateDisplayName(dateString: string): string {
  if (isDateStringToday(dateString)) return "Today's Matches";
  if (isDateStringYesterday(dateString)) return "Yesterday's Matches";
  if (isDateStringTomorrow(dateString)) return "Tomorrow's Matches";
  
  try {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'EEE, do MMM') + ' Matches' : dateString;
  } catch {
    return dateString;
  }
}

// Format match time for display
export function formatMatchTime(dateString: string | Date | number | null | undefined): string {
  if (!dateString) {
    return 'TBD';
  }

  try {
    let date: Date;

    // Handle different input types
    if (typeof dateString === 'string') {
      date = parseISO(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === 'number') {
      date = new Date(dateString);
    } else {
      return 'TBD';
    }

    // Check for invalid date
    if (!isValid(date)) {
      return 'TBD';
    }

    return format(date, 'h:mm a');
  } catch (error) {
    console.error('Error formatting match time:', error);
    return 'TBD';
  }
}