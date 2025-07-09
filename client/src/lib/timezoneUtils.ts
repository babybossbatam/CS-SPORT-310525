
import { format } from 'date-fns';

/**
 * Get the client's timezone identifier (e.g., "America/New_York", "Europe/London", "Asia/Tokyo")
 */
export function getClientTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Could not detect client timezone, falling back to UTC:', error);
    return 'UTC';
  }
}

/**
 * Get timezone offset in minutes from UTC
 */
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset();
}

/**
 * Get timezone offset as a string (e.g., "+05:30", "-08:00")
 */
export function getTimezoneOffsetString(): string {
  const offset = getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset > 0 ? '-' : '+';
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Convert UTC datetime to client's local timezone
 */
export function convertUTCToLocalTime(utcDateString: string): Date {
  try {
    const utcDate = new Date(utcDateString);
    return new Date(utcDate.getTime());
  } catch (error) {
    console.error('Error converting UTC to local time:', error);
    return new Date();
  }
}

/**
 * Convert local datetime to UTC
 */
export function convertLocalToUTC(localDate: Date): Date {
  return new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000));
}

/**
 * Format date in client's timezone
 */
export function formatInClientTimezone(dateString: string, formatString: string = 'yyyy-MM-dd HH:mm'): string {
  try {
    const localDate = convertUTCToLocalTime(dateString);
    return format(localDate, formatString);
  } catch (error) {
    console.error('Error formatting date in client timezone:', error);
    return dateString;
  }
}

/**
 * Check if a fixture date matches the selected date in client's timezone
 */
export function isFixtureOnSelectedDate(fixtureUTCDate: string, selectedDate: string): boolean {
  try {
    const fixtureLocalDate = convertUTCToLocalTime(fixtureUTCDate);
    const fixtureLocalDateString = format(fixtureLocalDate, 'yyyy-MM-dd');
    return fixtureLocalDateString === selectedDate;
  } catch (error) {
    console.error('Error checking fixture date:', error);
    return false;
  }
}

/**
 * Get current date in client's timezone
 */
export function getCurrentDateInClientTimezone(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Validate if a timezone string is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get timezone display name (e.g., "Eastern Standard Time", "Pacific Daylight Time")
 */
export function getTimezoneDisplayName(timezone?: string): string {
  try {
    const tz = timezone || getClientTimezone();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'long'
    });
    const parts = formatter.formatToParts(new Date());
    const timeZoneName = parts.find(part => part.type === 'timeZoneName');
    return timeZoneName?.value || tz;
  } catch (error) {
    return timezone || 'UTC';
  }
}

/**
 * Cache for timezone info to avoid repeated API calls
 */
let cachedTimezoneInfo: {
  timezone: string;
  offset: string;
  displayName: string;
  timestamp: number;
} | null = null;

/**
 * Get comprehensive timezone information with caching
 */
export function getTimezoneInfo(): {
  timezone: string;
  offset: string;
  displayName: string;
} {
  const now = Date.now();
  const cacheValidDuration = 60 * 60 * 1000; // 1 hour

  if (cachedTimezoneInfo && (now - cachedTimezoneInfo.timestamp) < cacheValidDuration) {
    return {
      timezone: cachedTimezoneInfo.timezone,
      offset: cachedTimezoneInfo.offset,
      displayName: cachedTimezoneInfo.displayName
    };
  }

  const timezone = getClientTimezone();
  const offset = getTimezoneOffsetString();
  const displayName = getTimezoneDisplayName(timezone);

  cachedTimezoneInfo = {
    timezone,
    offset,
    displayName,
    timestamp: now
  };

  return { timezone, offset, displayName };
}

/**
 * Debug timezone information
 */
export function debugTimezoneInfo(): void {
  const info = getTimezoneInfo();
  console.log('🌍 [Timezone Debug] Client timezone information:', {
    timezone: info.timezone,
    offset: info.offset,
    displayName: info.displayName,
    rawOffset: getTimezoneOffset(),
    currentTime: new Date().toISOString(),
    localTime: new Date().toString()
  });
}
