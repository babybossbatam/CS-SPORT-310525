import { format, parseISO, isValid, differenceInHours } from 'date-fns';

// Get current UTC date string in YYYY-MM-DD format
export const getCurrentUTCDateString = (): string => {
  const now = new Date();
  return format(now, 'yyyy-MM-dd');
};

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

// Check if a date string represents today
export function isDateStringToday(dateString: string): boolean {
  const actualToday = getCurrentUTCDateString();
  return dateString === actualToday;
}

// Check if a date string represents yesterday
export function isDateStringYesterday(dateString: string): boolean {
  const actualYesterday = formatYYYYMMDD(new Date(Date.now() - 24 * 60 * 60 * 1000));
  return dateString === actualYesterday;
}

// Check if a date string represents tomorrow
export function isDateStringTomorrow(dateString: string): boolean {
  const actualTomorrow = formatYYYYMMDD(new Date(Date.now() + 24 * 60 * 60 * 1000));
  return dateString === actualTomorrow;
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