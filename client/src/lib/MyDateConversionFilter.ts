
import { parseISO, isValid } from 'date-fns';

/**
 * MyDateConversionFilter - Centralized date filtering and conversion utilities
 * Handles timezone-aware date filtering for fixtures to minimize match loss
 */

/**
 * Extract date from fixture UTC string without timezone conversion
 * This prevents timezone-related match loss by using simple string extraction
 */
export function extractFixtureDate(fixtureUTCDate: string): string {
  try {
    // Simple extraction: "2025-06-03T10:30:00+00:00" -> "2025-06-03"
    if (!fixtureUTCDate || typeof fixtureUTCDate !== 'string') {
      return '';
    }
    
    // Extract date part before 'T'
    const datePart = fixtureUTCDate.split('T')[0];
    
    // Validate the extracted date format (YYYY-MM-DD)
    if (datePart && datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return datePart;
    }
    
    return '';
  } catch (error) {
    console.warn('Error extracting fixture date:', error);
    return '';
  }
}

/**
 * Check if fixture matches the selected date using simple string comparison
 * This approach minimizes timezone-related match loss
 */
export function isFixtureOnSelectedDate(fixtureUTCDate: string, selectedDate: string): boolean {
  try {
    if (!fixtureUTCDate || !selectedDate) {
      return false;
    }
    
    // Extract date without timezone conversion
    const fixtureDate = extractFixtureDate(fixtureUTCDate);
    
    // Direct string comparison
    if (fixtureDate === selectedDate) {
      return true;
    }
    
    // Secondary check: Parse dates for edge case validation
    const fixtureDateTime = parseISO(fixtureUTCDate);
    const selectedDateTime = parseISO(selectedDate);
    
    if (isValid(fixtureDateTime) && isValid(selectedDateTime)) {
      // Calculate date difference in days for tolerance
      const timeDiff = Math.abs(fixtureDateTime.getTime() - selectedDateTime.getTime());
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      
      // Allow fixtures within 1.5 days to capture timezone edge cases
      if (daysDiff <= 1.5) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.warn('Error checking fixture date match:', error);
    return false;
  }
}

/**
 * Filter fixtures array by selected date with comprehensive validation
 */
export function filterFixturesByDate(fixtures: any[], selectedDate: string): any[] {
  if (!fixtures || !Array.isArray(fixtures) || !selectedDate) {
    return [];
  }
  
  return fixtures.filter((fixture: any) => {
    // Validate fixture structure
    if (!fixture?.fixture?.date) {
      return false;
    }
    
    return isFixtureOnSelectedDate(fixture.fixture.date, selectedDate);
  });
}

/**
 * Get current date in YYYY-MM-DD format for date filtering
 */
export function getCurrentDateString(): string {
  try {
    const now = new Date();
    return now.toISOString().split('T')[0];
  } catch (error) {
    console.warn('Error getting current date string:', error);
    return '';
  }
}

/**
 * Validate date string format (YYYY-MM-DD)
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  
  // Check format
  if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return false;
  }
  
  // Check if it's a valid date
  const date = parseISO(dateString);
  return isValid(date);
}

/**
 * Get date range for multi-day filtering (previous, current, next day)
 * Useful for timezone-inclusive filtering
 */
export function getDateRange(selectedDate: string): string[] {
  try {
    if (!isValidDateString(selectedDate)) {
      return [getCurrentDateString()];
    }
    
    const date = parseISO(selectedDate);
    
    const previousDay = new Date(date);
    previousDay.setDate(date.getDate() - 1);
    
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    
    return [
      previousDay.toISOString().split('T')[0],
      selectedDate,
      nextDay.toISOString().split('T')[0]
    ];
  } catch (error) {
    console.warn('Error getting date range:', error);
    return [selectedDate || getCurrentDateString()];
  }
}

/**
 * Debug logging for date filtering operations
 */
export function logDateFilterDebug(
  fixtureId: string | number,
  fixtureUTCDate: string,
  selectedDate: string,
  isMatch: boolean,
  reason?: string
): void {
  const debugInfo = {
    fixtureId,
    fixtureUTCDate,
    extractedDate: extractFixtureDate(fixtureUTCDate),
    selectedDate,
    isMatch,
    reason: reason || (isMatch ? 'Date match' : 'Date mismatch')
  };
  
  if (isMatch) {
    console.log(`✅ [DateFilter] Match found:`, debugInfo);
  } else {
    console.log(`❌ [DateFilter] No match:`, debugInfo);
  }
}

export default {
  extractFixtureDate,
  isFixtureOnSelectedDate,
  filterFixturesByDate,
  getCurrentDateString,
  isValidDateString,
  getDateRange,
  logDateFilterDebug
};
