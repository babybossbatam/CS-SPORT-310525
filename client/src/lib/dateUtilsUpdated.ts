import { format, parseISO, isValid, differenceInHours } from 'date-fns';

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

// Get current UTC date as string
export function getCurrentUTCDateString(): string {
  try {
    const now = new Date();
    return format(now, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error getting current UTC date string:', error);
    return format(new Date(), 'yyyy-MM-dd');
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