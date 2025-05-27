import { isToday as dateFnsIsToday, isYesterday as dateFnsIsYesterday, isTomorrow as dateFnsIsTomorrow, format, parseISO, isValid } from 'date-fns';

export const formatDate = (dateString: string): string => {
  try {
    if (!dateString) return '';
    const date = parseISO(dateString);
    if (!isValid(date)) return '';
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    if (!dateString) return '';
    const date = parseISO(dateString);
    if (!isValid(date)) return '';
    return format(date, 'yyyy-MM-dd HH:mm');
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '';
  }
};

export const isToday = (date: Date): boolean => {
  try {
    return dateFnsIsToday(date);
  } catch (error) {
    console.error('Error checking if date is today:', error);
    return false;
  }
};

export const isYesterday = (date: Date): boolean => {
  try {
    return dateFnsIsYesterday(date);
  } catch (error) {
    console.error('Error checking if date is yesterday:', error);
    return false;
  }
};

export const isTomorrow = (date: Date): boolean => {
  try {
    return dateFnsIsTomorrow(date);
  } catch (error) {
    console.error('Error checking if date is tomorrow:', error);
    return false;
  }
};

export const safeSubstring = (value: any, start: number, end?: number): string => {
  if (value == null) {
    return '';
  }
  const str = String(value);
  return end !== undefined ? str.substring(start, end) : str.substring(start);
};

export const getCurrentUTCDateString = (): string => {
  try {
    const now = new Date();
    return format(now, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error getting current UTC date string:', error);
    return format(new Date(), 'yyyy-MM-dd');
  }
};