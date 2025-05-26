
/**
 * Date Utilities - UTC Only Version
 * Simplified utilities that work exclusively with UTC to avoid timezone complexity
 */

import { format, parseISO, isValid, startOfDay, endOfDay } from 'date-fns';

/**
 * Format date to YYYY-MM-DD string in UTC
 */
export function formatYYYYMMDD(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return format(new Date(), 'yyyy-MM-dd');
  
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return format(new Date(), 'yyyy-MM-dd');
    return format(date, 'yyyy-MM-dd');
  } catch {
    return format(new Date(), 'yyyy-MM-dd');
  }
}

/**
 * Get current UTC date as YYYY-MM-DD string
 */
export function getCurrentUTCDateString(): string {
  const now = new Date();
  // Create UTC date by using UTC methods
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const utcDate = now.getUTCDate();
  
  // Create a new date in UTC
  const utcDateObj = new Date(Date.UTC(utcYear, utcMonth, utcDate));
  return format(utcDateObj, 'yyyy-MM-dd');
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateString: string): Date {
  return parseISO(dateString);
}

/**
 * Check if date is today (UTC)
 */
export function isToday(date: Date | string): boolean {
  const targetDate = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return format(targetDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
}

/**
 * Get start of day in UTC
 */
export function getStartOfDay(date: Date | string): Date {
  const targetDate = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(targetDate);
}

/**
 * Get end of day in UTC
 */
export function getEndOfDay(date: Date | string): Date {
  const targetDate = typeof date === 'string' ? parseISO(date) : date;
  return endOfDay(targetDate);
}

/**
 * Format time for display (UTC)
 */
export function formatTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'TBD';
  
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return 'TBD';
    return format(date, 'HH:mm');
  } catch {
    return 'TBD';
  }
}

/**
 * Format full date and time for display (UTC)
 */
export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'TBD';
  
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return 'TBD';
    return format(date, 'yyyy-MM-dd HH:mm');
  } catch {
    return 'TBD';
  }
}
