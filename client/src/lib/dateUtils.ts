/**
 * Date Utilities - Local Timezone Version (like 365scores.com)
 * Uses user's local timezone for date comparisons while keeping UTC for API calls
 */

import { format, parseISO, isValid, startOfDay, endOfDay, isToday as dateFnsIsToday } from 'date-fns';

/**
 * Format date to YYYY-MM-DD string in user's local timezone
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
 * Get current date as YYYY-MM-DD string in user's local timezone
 */
export function getCurrentUTCDateString(): string {
  // Use local date instead of UTC to match user's perception of "today"
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateString: string): Date {
  return parseISO(dateString);
}

/**
 * Check if date is today in user's local timezone
 */
export function isToday(date: Date | string): boolean {
  const targetDate = typeof date === 'string' ? parseISO(date) : date;
  return dateFnsIsToday(targetDate);
}

/**
 * Check if date is yesterday in user's local timezone
 */
export function isYesterday(date: Date | string): boolean {
  const targetDate = typeof date === 'string' ? parseISO(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return format(targetDate, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd');
}

/**
 * Check if date is tomorrow in user's local timezone
 */
export function isTomorrow(date: Date | string): boolean {
  const targetDate = typeof date === 'string' ? parseISO(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return format(targetDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd');
}

/**
 * Check if a match date falls within the user's selected local date
 */
export function isMatchOnDate(matchDate: string | Date, targetDate: string): boolean {
  try {
    const match = typeof matchDate === 'string' ? parseISO(matchDate) : matchDate;
    const target = parseISO(targetDate);

    // Compare just the date parts in local timezone
    return format(match, 'yyyy-MM-dd') === format(target, 'yyyy-MM-dd');
  } catch {
    return false;
  }
}

/**
 * Get start of day in local timezone
 */
export function getStartOfDay(date: Date | string): Date {
  const targetDate = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(targetDate);
}

/**
 * Get end of day in local timezone  
 */
export function getEndOfDay(date: Date | string): Date {
  const targetDate = typeof date === 'string' ? parseISO(date) : date;
  return endOfDay(targetDate);
}

/**
 * Format time for display in user's local timezone
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
 * Format full date and time for display in user's local timezone
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

/**
 * Get yesterday's date in local timezone
 */
export function getYesterday(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return format(yesterday, 'yyyy-MM-dd');
}

/**
 * Get tomorrow's date in local timezone
 */
export function getTomorrow(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return format(tomorrow, 'yyyy-MM-dd');
}