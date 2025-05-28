
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

// Legacy function names for backward compatibility - using the same logic as shared utils
export const getCurrentUTCDateString = (): string => {
  return getTodayMatchPageCurrentUTCDateString();
};

export const formatYYYYMMDD = (date: Date): string => {
  return formatTodayMatchPageYYYYMMDD(date);
};
