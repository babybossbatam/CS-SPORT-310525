/**
 * Date Utilities
 * Centralized utilities for date handling to ensure consistent behavior across the application
 * Includes timezone-aware functionality similar to 365scores.com
 */

import { parseISO, format, formatInTimeZone } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

/**
 * Get user's timezone
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error getting user timezone:', error);
    return 'UTC';
  }
}

/**
 * Format date to YYYY-MM-DD format in user's timezone
 * @param date Date to format
 * @param timezone Optional timezone, defaults to user's timezone
 * @returns Formatted date string
 */
export function formatYYYYMMDD(date?: Date | string | number | null, timezone?: string): string {
  try {
    const userTimezone = timezone || getUserTimezone();
    
    if (!date) {
      return formatInTimeZone(new Date(), userTimezone, 'yyyy-MM-dd');
    }
    
    let d: Date;
    if (typeof date === 'string') {
      d = parseISO(date);
    } else if (typeof date === 'number') {
      // Convert Unix timestamp (seconds) to milliseconds if needed
      d = date.toString().length <= 10
        ? new Date(date * 1000)  // Unix timestamp in seconds
        : new Date(date);        // Unix timestamp in milliseconds or other number
    } else {
      d = date;
    }
    
    if (isNaN(d.getTime())) {
      console.error('Invalid date in formatYYYYMMDD:', date);
      return formatInTimeZone(new Date(), userTimezone, 'yyyy-MM-dd');
    }
    
    return formatInTimeZone(d, userTimezone, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error in formatYYYYMMDD:', error);
    // Fallback to hardcoded format in user timezone
    const now = new Date();
    const userTimezone = getUserTimezone();
    return formatInTimeZone(now, userTimezone, 'yyyy-MM-dd');
  }
}

/**
 * Get today's date in YYYY-MM-DD format in user's timezone
 */
export function getTodayFormatted(): string {
  return formatYYYYMMDD(new Date());
}

/**
 * Format time in user's timezone
 * @param date Date to format
 * @param formatStr Format string (default: 'HH:mm')
 * @param timezone Optional timezone, defaults to user's timezone
 */
export function formatTimeInUserTimezone(date: Date | string, formatStr: string = 'HH:mm', timezone?: string): string {
  try {
    const userTimezone = timezone || getUserTimezone();
    const d = typeof date === 'string' ? parseISO(date) : date;
    
    if (isNaN(d.getTime())) {
      return 'TBD';
    }
    
    return formatInTimeZone(d, userTimezone, formatStr);
  } catch (error) {
    console.error('Error formatting time in timezone:', error);
    return 'TBD';
  }
}

/**
 * Convert UTC date to user's timezone
 * @param date UTC date
 * @param timezone Optional timezone, defaults to user's timezone
 */
export function convertToUserTimezone(date: Date | string, timezone?: string): Date {
  try {
    const userTimezone = timezone || getUserTimezone();
    const d = typeof date === 'string' ? parseISO(date) : date;
    
    if (isNaN(d.getTime())) {
      return new Date();
    }
    
    return utcToZonedTime(d, userTimezone);
  } catch (error) {
    console.error('Error converting to user timezone:', error);
    return new Date();
  }
}

/**
 * Convert local date to UTC
 * @param date Local date
 * @param timezone Optional timezone, defaults to user's timezone
 */
export function convertToUTC(date: Date | string, timezone?: string): Date {
  try {
    const userTimezone = timezone || getUserTimezone();
    const d = typeof date === 'string' ? parseISO(date) : date;
    
    if (isNaN(d.getTime())) {
      return new Date();
    }
    
    return zonedTimeToUtc(d, userTimezone);
  } catch (error) {
    console.error('Error converting to UTC:', error);
    return new Date();
  }
}

/**
 * Check if a date is today in user's timezone
 * @param date Date to check
 * @param timezone Optional timezone, defaults to user's timezone
 */
export function isToday(date: Date | string, timezone?: string): boolean {
  try {
    const userTimezone = timezone || getUserTimezone();
    const d = typeof date === 'string' ? parseISO(date) : date;
    const today = new Date();
    
    const dateInUserTz = formatInTimeZone(d, userTimezone, 'yyyy-MM-dd');
    const todayInUserTz = formatInTimeZone(today, userTimezone, 'yyyy-MM-dd');
    
    return dateInUserTz === todayInUserTz;
  } catch (error) {
    console.error('Error checking if date is today:', error);
    return false;
  }
}

/**
 * Check if a date is yesterday in user's timezone
 * @param date Date to check
 * @param timezone Optional timezone, defaults to user's timezone
 */
export function isYesterday(date: Date | string, timezone?: string): boolean {
  try {
    const userTimezone = timezone || getUserTimezone();
    const d = typeof date === 'string' ? parseISO(date) : date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateInUserTz = formatInTimeZone(d, userTimezone, 'yyyy-MM-dd');
    const yesterdayInUserTz = formatInTimeZone(yesterday, userTimezone, 'yyyy-MM-dd');
    
    return dateInUserTz === yesterdayInUserTz;
  } catch (error) {
    console.error('Error checking if date is yesterday:', error);
    return false;
  }
}

/**
 * Check if a date is tomorrow in user's timezone
 * @param date Date to check
 * @param timezone Optional timezone, defaults to user's timezone
 */
export function isTomorrow(date: Date | string, timezone?: string): boolean {
  try {
    const userTimezone = timezone || getUserTimezone();
    const d = typeof date === 'string' ? parseISO(date) : date;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateInUserTz = formatInTimeZone(d, userTimezone, 'yyyy-MM-dd');
    const tomorrowInUserTz = formatInTimeZone(tomorrow, userTimezone, 'yyyy-MM-dd');
    
    return dateInUserTz === tomorrowInUserTz;
  } catch (error) {
    console.error('Error checking if date is tomorrow:', error);
    return false;
  }
}

/**
 * Safe function to get a proper Date object from any type of input
 * @param input Any kind of date input
 * @returns A valid Date object
 */
export function getValidDate(input?: Date | string | number | null): Date {
  try {
    if (!input) {
      return new Date();
    }
    
    let result: Date;
    if (typeof input === 'string') {
      result = parseISO(input);
    } else if (typeof input === 'number') {
      // Convert Unix timestamp (seconds) to milliseconds if needed
      result = input.toString().length <= 10
        ? new Date(input * 1000)  // Unix timestamp in seconds
        : new Date(input);        // Unix timestamp in milliseconds or other number
    } else {
      result = input;
    }
    
    // Validate that the date is valid
    if (isNaN(result.getTime())) {
      console.error('Invalid date in getValidDate:', input);
      return new Date();
    }
    
    return result;
  } catch (error) {
    console.error('Error in getValidDate:', error);
    return new Date();
  }
}