import { format } from 'date-fns';

// Get current UTC date string in YYYY-MM-DD format for TodayMatchPageCard
export const getTodayMatchPageCurrentUTCDateString = (): string => {
  const now = new Date();
  return format(now, 'yyyy-MM-dd');
};

// Format date as YYYY-MM-DD for TodayMatchPageCard
export const formatTodayMatchPageYYYYMMDD = (date: Date): string => {
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date to YYYY-MM-DD in TodayMatchPageCard:', error);
    return format(new Date(), 'yyyy-MM-dd');
  }
};

// Get current UTC date string in YYYY-MM-DD format
export const getCurrentUTCDateString = (selectedDate?: string): string => {
  // If selectedDate is provided, validate and return it
  if (selectedDate) {
    try {
      const date = parseISO(selectedDate);
      if (isValid(date)) {
        return format(date, 'yyyy-MM-dd');
      }
    } catch (error) {
      console.error('Error parsing selected date:', error);
    }
  }

  // Return current date in YYYY-MM-DD format (date only, no timestamp)
  const now = new Date();
  return format(now, 'yyyy-MM-dd');
};

export const formatYYYYMMDD = (date: Date): string => {
  return formatTodayMatchPageYYYYMMDD(date);
};