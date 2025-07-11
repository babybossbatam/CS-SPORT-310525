
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export interface TimezoneInfo {
  timezone: string;
  offset: string;
  abbreviation: string;
  offsetMinutes: number;
}

/**
 * Detect the user's local timezone and return comprehensive timezone information
 * Optionally validate with server endpoint
 */
export function detectUserTimezone(validateWithServer: boolean = false): TimezoneInfo {
  try {
    // Get the user's timezone using Intl.DateTimeFormat
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Get the current date to calculate offset
    const now = new Date();
    
    // Calculate timezone offset in minutes (negative for timezones ahead of UTC)
    const offsetMinutes = -now.getTimezoneOffset();
    
    // Format offset as string (e.g., "+05:30", "-08:00")
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const offsetSign = offsetMinutes >= 0 ? '+' : '-';
    const offset = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`;
    
    // Get timezone abbreviation (e.g., "PST", "EST", "UTC")
    const abbreviation = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
      timeZone: timezone
    }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value || 'UTC';
    
    const timezoneInfo = {
      timezone,
      offset,
      abbreviation,
      offsetMinutes
    };
    
    // Log timezone detection for debugging
    console.log('🌍 [TIMEZONE DETECTION]', {
      detected: timezoneInfo,
      browserOffset: now.getTimezoneOffset(),
      sample: formatToUserTimezone(now.toISOString(), 'yyyy-MM-dd HH:mm:ss zzz', timezone)
    });
    
    // TODO: Optionally validate with server endpoint in the future
    if (validateWithServer) {
      // This could be implemented to call an API endpoint to validate timezone
      // For now, we trust the browser detection
    }
    
    return timezoneInfo;
  } catch (error) {
    console.error('Error detecting timezone:', error);
    
    // Fallback to UTC if detection fails
    return {
      timezone: 'UTC',
      offset: '+00:00',
      abbreviation: 'UTC',
      offsetMinutes: 0
    };
  }
}

/**
 * Format a date string to the user's local timezone
 */
export function formatToUserTimezone(
  dateString: string | Date,
  formatString: string = 'HH:mm',
  userTimezone?: string
): string {
  try {
    const timezone = userTimezone || detectUserTimezone().timezone;
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    
    return formatInTimeZone(date, timezone, formatString);
  } catch (error) {
    console.error('Error formatting date to user timezone:', error);
    
    // Fallback to basic formatting
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, formatString);
  }
}

/**
 * Convert UTC date to user's local timezone
 */
export function convertUTCToUserTimezone(utcDateString: string): Date {
  try {
    const utcDate = parseISO(utcDateString);
    const userTimezone = detectUserTimezone().timezone;
    
    // Create a new date in the user's timezone
    const localDate = new Date(utcDate.toLocaleString('en-US', { timeZone: userTimezone }));
    
    return localDate;
  } catch (error) {
    console.error('Error converting UTC to user timezone:', error);
    return parseISO(utcDateString);
  }
}

/**
 * Get timezone-aware API parameters for fetching data
 */
export function getTimezoneAwareAPIParams(): {
  timezone: string;
  offset: string;
} {
  const timezoneInfo = detectUserTimezone();
  
  return {
    timezone: timezoneInfo.timezone,
    offset: timezoneInfo.offset
  };
}

/**
 * Check if a date is in the user's "today" based on their timezone
 */
export function isDateTodayInUserTimezone(dateString: string): boolean {
  try {
    const userTimezone = detectUserTimezone().timezone;
    const date = parseISO(dateString);
    const now = new Date();
    
    // Format both dates in user's timezone to compare just the date part
    const dateInUserTZ = formatInTimeZone(date, userTimezone, 'yyyy-MM-dd');
    const todayInUserTZ = formatInTimeZone(now, userTimezone, 'yyyy-MM-dd');
    
    return dateInUserTZ === todayInUserTZ;
  } catch (error) {
    console.error('Error checking if date is today in user timezone:', error);
    return false;
  }
}

/**
 * Get a human-readable timezone display for the user
 */
export function getTimezoneDisplayName(): string {
  try {
    const timezoneInfo = detectUserTimezone();
    const now = new Date();
    
    // Get full timezone name (e.g., "Pacific Standard Time")
    const longName = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'long',
      timeZone: timezoneInfo.timezone
    }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value;
    
    return longName || timezoneInfo.timezone;
  } catch (error) {
    console.error('Error getting timezone display name:', error);
    return 'UTC';
  }
}

/**
 * Log timezone information for debugging
 */
export function logTimezoneInfo(): void {
  const timezoneInfo = detectUserTimezone();
  const displayName = getTimezoneDisplayName();
  
  console.log('🌍 [TIMEZONE INFO]', {
    timezone: timezoneInfo.timezone,
    offset: timezoneInfo.offset,
    abbreviation: timezoneInfo.abbreviation,
    offsetMinutes: timezoneInfo.offsetMinutes,
    displayName,
    sample: formatToUserTimezone(new Date().toISOString(), 'yyyy-MM-dd HH:mm:ss')
  });
}

/**
 * Create timezone-aware date filter for API requests
 */
export function createTimezoneAwareDateFilter(selectedDate: string): {
  startDate: string;
  endDate: string;
  timezone: string;
} {
  const timezoneInfo = detectUserTimezone();
  
  // Create start and end of day in user's timezone
  const startOfDay = `${selectedDate}T00:00:00`;
  const endOfDay = `${selectedDate}T23:59:59`;
  
  return {
    startDate: startOfDay,
    endDate: endOfDay,
    timezone: timezoneInfo.timezone
  };
}

// Export a default object with all functions for easy importing
export default {
  detectUserTimezone,
  formatToUserTimezone,
  convertUTCToUserTimezone,
  getTimezoneAwareAPIParams,
  isDateTodayInUserTimezone,
  getTimezoneDisplayName,
  logTimezoneInfo,
  createTimezoneAwareDateFilter
};
