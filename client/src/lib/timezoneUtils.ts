
import { format, parseISO, isValid } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

// Get user's timezone
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error getting user timezone:', error);
    return 'UTC'; // Fallback to UTC
  }
};

// Get timezone offset in minutes
export const getTimezoneOffset = (): number => {
  return new Date().getTimezoneOffset();
};

// Convert UTC date to user's local timezone
export const convertUTCToUserTimezone = (utcDateString: string): Date => {
  try {
    const utcDate = parseISO(utcDateString);
    if (!isValid(utcDate)) return new Date();
    
    const userTimezone = getUserTimezone();
    return toZonedTime(utcDate, userTimezone);
  } catch (error) {
    console.error('Error converting UTC to user timezone:', error);
    return new Date();
  }
};

// Convert user's local time to UTC
export const convertUserTimezoneToUTC = (localDate: Date): Date => {
  try {
    const userTimezone = getUserTimezone();
    return fromZonedTime(localDate, userTimezone);
  } catch (error) {
    console.error('Error converting user timezone to UTC:', error);
    return localDate;
  }
};

// Format date in user's timezone
export const formatDateInUserTimezone = (dateString: string, formatString: string = 'yyyy-MM-dd HH:mm'): string => {
  try {
    const localDate = convertUTCToUserTimezone(dateString);
    return format(localDate, formatString);
  } catch (error) {
    console.error('Error formatting date in user timezone:', error);
    return dateString;
  }
};

// Get current date in user's timezone
export const getCurrentDateInUserTimezone = (): string => {
  const now = new Date();
  return format(now, 'yyyy-MM-dd');
};

// Check if a fixture date matches a specific date in user's timezone
export const isFixtureOnUserDate = (fixtureUTCDate: string, targetDate: string): boolean => {
  try {
    const localDate = convertUTCToUserTimezone(fixtureUTCDate);
    const localDateString = format(localDate, 'yyyy-MM-dd');
    return localDateString === targetDate;
  } catch (error) {
    console.error('Error checking fixture date:', error);
    return false;
  }
};

// Get timezone info for API requests
export const getTimezoneInfo = () => {
  const timezone = getUserTimezone();
  const offset = getTimezoneOffset();
  
  return {
    timezone,
    offset,
    offsetHours: Math.floor(Math.abs(offset) / 60),
    offsetMinutes: Math.abs(offset) % 60,
    sign: offset <= 0 ? '+' : '-'
  };
};

// Format timezone for API requests (e.g., "Asia/Manila", "America/New_York")
export const getTimezoneForAPI = (): string => {
  return getUserTimezone();
};

export default {
  getUserTimezone,
  getTimezoneOffset,
  convertUTCToUserTimezone,
  convertUserTimezoneToUTC,
  formatDateInUserTimezone,
  getCurrentDateInUserTimezone,
  isFixtureOnUserDate,
  getTimezoneInfo,
  getTimezoneForAPI
};
