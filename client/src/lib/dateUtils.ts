/**
 * Date Utilities
 * Centralized utilities for date handling to ensure consistent behavior across the application
 */

import { parseISO, format } from 'date-fns';

/**
 * Format date to YYYY-MM-DD format
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatYYYYMMDD(date?: Date | string | number | null): string {
  try {
    if (!date) {
      return format(new Date(), 'yyyy-MM-dd');
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
      return format(new Date(), 'yyyy-MM-dd');
    }
    
    return format(d, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error in formatYYYYMMDD:', error);
    // Fallback to hardcoded format
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayFormatted(): string {
  return formatYYYYMMDD(new Date());
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
        : new Date(input);        // Unix timestamp in milliseconds
    } else {
      result = input;
    }
    
    // Validate date
    if (isNaN(result.getTime())) {
      console.error('Invalid date in getValidDate:', input);
      return new Date();
    }

    // Validate date range (between 2020 and 2025)
    const year = result.getFullYear();
    if (year < 2020 || year > 2025) {
      console.error('Date out of valid range (2020-2025):', input);
      return new Date();
    }
    
    return result;
  } catch (error) {
    console.error('Error in getValidDate:', error);
    return new Date();
  }
}

export function isValidMatchDate(date: Date): boolean {
  const now = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(now.getFullYear() - 2);
  
  const oneYearAhead = new Date();
  oneYearAhead.setFullYear(now.getFullYear() + 1);
  
  return date >= twoYearsAgo && date <= oneYearAhead;
}