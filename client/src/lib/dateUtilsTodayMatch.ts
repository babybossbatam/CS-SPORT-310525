
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

// Modified function to support TodayMatchPageCard's selected date pattern
// Instead of always returning "today", this can work with the component's selectedDate state
export const getCurrentUTCDateString = (selectedDate?: string): string => {
  // If a selectedDate is provided (from component state), validate and return it
  if (selectedDate) {
    try {
      // Validate the date format and ensure it's a valid date
      const date = new Date(selectedDate);
      if (!isNaN(date.getTime())) {
        return format(date, 'yyyy-MM-dd');
      }
    } catch (error) {
      console.error('Error processing selected date in TodayMatchPageCard:', error);
    }
  }
  
  // Fallback to today's date if no valid selectedDate provided
  return getTodayMatchPageCurrentUTCDateString();
};

export const formatYYYYMMDD = (date: Date): string => {
  return formatTodayMatchPageYYYYMMDD(date);
};
