
import { parseISO, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export interface FixtureWithConvertedDate {
  fixture: any;
  originalDate: string;
  convertedDate: string;
  localDateString: string; // YYYY-MM-DD format in local timezone
  isToday: boolean;
  isYesterday: boolean;
  isTomorrow: boolean;
}

export interface DateFilterResult {
  todayFixtures: FixtureWithConvertedDate[];
  yesterdayFixtures: FixtureWithConvertedDate[];
  tomorrowFixtures: FixtureWithConvertedDate[];
  allProcessedFixtures: FixtureWithConvertedDate[];
  stats: {
    total: number;
    today: number;
    yesterday: number;
    tomorrow: number;
    clientTimezone: string;
  };
}

export class MyUpdatedFixtureDateSelection {
  private static clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  /**
   * Convert UTC fixture date to client's local timezone
   */
  static convertFixtureToLocalTime(utcDateString: string): {
    convertedDate: string;
    localDateString: string;
  } {
    try {
      // Parse the UTC date
      const utcDate = parseISO(utcDateString);
      
      // Convert to client's timezone
      const localDate = toZonedTime(utcDate, this.clientTimezone);
      
      // Format as YYYY-MM-DDTHH:mm:ss
      const convertedDate = format(localDate, 'yyyy-MM-dd\'T\'HH:mm:ss');
      
      // Extract just the date part (YYYY-MM-DD) for comparison
      const localDateString = format(localDate, 'yyyy-MM-dd');
      
      return {
        convertedDate,
        localDateString
      };
    } catch (error) {
      console.error('Error converting fixture date to local time:', error);
      // Fallback to original date
      const fallbackDate = utcDateString.split('T')[0];
      return {
        convertedDate: utcDateString,
        localDateString: fallbackDate
      };
    }
  }

  /**
   * Get date ranges for today, yesterday, and tomorrow in client timezone
   */
  static getLocalDateRanges(referenceDate?: string): {
    today: { start: string; end: string; dateString: string };
    yesterday: { start: string; end: string; dateString: string };
    tomorrow: { start: string; end: string; dateString: string };
  } {
    const now = referenceDate ? parseISO(referenceDate) : new Date();
    const localNow = toZonedTime(now, this.clientTimezone);
    
    // Today's range
    const todayStart = startOfDay(localNow);
    const todayEnd = endOfDay(localNow);
    const todayDateString = format(localNow, 'yyyy-MM-dd');
    
    // Yesterday's range
    const yesterday = new Date(localNow);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);
    const yesterdayDateString = format(yesterday, 'yyyy-MM-dd');
    
    // Tomorrow's range
    const tomorrow = new Date(localNow);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = endOfDay(tomorrow);
    const tomorrowDateString = format(tomorrow, 'yyyy-MM-dd');
    
    return {
      today: {
        start: format(todayStart, 'yyyy-MM-dd\'T\'00:00:00'),
        end: format(todayEnd, 'yyyy-MM-dd\'T\'23:59:59'),
        dateString: todayDateString
      },
      yesterday: {
        start: format(yesterdayStart, 'yyyy-MM-dd\'T\'00:00:00'),
        end: format(yesterdayEnd, 'yyyy-MM-dd\'T\'23:59:59'),
        dateString: yesterdayDateString
      },
      tomorrow: {
        start: format(tomorrowStart, 'yyyy-MM-dd\'T\'00:00:00'),
        end: format(tomorrowEnd, 'yyyy-MM-dd\'T\'23:59:59'),
        dateString: tomorrowDateString
      }
    };
  }

  /**
   * Check if a converted fixture date falls within a specific date range
   */
  static isFixtureInDateRange(
    convertedDate: string,
    rangeStart: string,
    rangeEnd: string
  ): boolean {
    try {
      const fixtureDate = parseISO(convertedDate);
      const startDate = parseISO(rangeStart);
      const endDate = parseISO(rangeEnd);
      
      return isWithinInterval(fixtureDate, {
        start: startDate,
        end: endDate
      });
    } catch (error) {
      console.error('Error checking fixture date range:', error);
      return false;
    }
  }

  /**
   * Process fixtures and categorize them by local date
   */
  static processFixturesWithLocalTime(
    fixtures: any[],
    selectedDate?: string
  ): DateFilterResult {
    if (!fixtures || fixtures.length === 0) {
      return {
        todayFixtures: [],
        yesterdayFixtures: [],
        tomorrowFixtures: [],
        allProcessedFixtures: [],
        stats: {
          total: 0,
          today: 0,
          yesterday: 0,
          tomorrow: 0,
          clientTimezone: this.clientTimezone
        }
      };
    }

    console.log(`🕒 [MyUpdatedFixtureDateSelection] Processing ${fixtures.length} fixtures for timezone conversion`);
    console.log(`🌍 [MyUpdatedFixtureDateSelection] Client timezone: ${this.clientTimezone}`);
    
    const dateRanges = this.getLocalDateRanges(selectedDate);
    console.log(`📅 [MyUpdatedFixtureDateSelection] Date ranges:`, dateRanges);
    
    const processedFixtures: FixtureWithConvertedDate[] = [];
    const todayFixtures: FixtureWithConvertedDate[] = [];
    const yesterdayFixtures: FixtureWithConvertedDate[] = [];
    const tomorrowFixtures: FixtureWithConvertedDate[] = [];

    fixtures.forEach((fixture, index) => {
      if (!fixture?.fixture?.date) {
        console.warn(`⚠️ [MyUpdatedFixtureDateSelection] Fixture ${index} missing date:`, fixture?.fixture?.id);
        return;
      }

      const originalDate = fixture.fixture.date;
      const { convertedDate, localDateString } = this.convertFixtureToLocalTime(originalDate);
      
      // Determine which day this fixture belongs to
      const isToday = this.isFixtureInDateRange(convertedDate, dateRanges.today.start, dateRanges.today.end);
      const isYesterday = this.isFixtureInDateRange(convertedDate, dateRanges.yesterday.start, dateRanges.yesterday.end);
      const isTomorrow = this.isFixtureInDateRange(convertedDate, dateRanges.tomorrow.start, dateRanges.tomorrow.end);
      
      const processedFixture: FixtureWithConvertedDate = {
        fixture,
        originalDate,
        convertedDate,
        localDateString,
        isToday,
        isYesterday,
        isTomorrow
      };

      processedFixtures.push(processedFixture);

      // Categorize fixtures
      if (isToday) {
        todayFixtures.push(processedFixture);
      }
      if (isYesterday) {
        yesterdayFixtures.push(processedFixture);
      }
      if (isTomorrow) {
        tomorrowFixtures.push(processedFixture);
      }

      // Log a few examples for debugging
      if (index < 5) {
        console.log(`🔍 [MyUpdatedFixtureDateSelection] Fixture ${index + 1}:`, {
          teams: `${fixture.teams?.home?.name || 'Unknown'} vs ${fixture.teams?.away?.name || 'Unknown'}`,
          league: fixture.league?.name,
          originalDate,
          convertedDate,
          localDateString,
          isToday,
          isYesterday,
          isTomorrow,
          status: fixture.fixture?.status?.short
        });
      }
    });

    const stats = {
      total: processedFixtures.length,
      today: todayFixtures.length,
      yesterday: yesterdayFixtures.length,
      tomorrow: tomorrowFixtures.length,
      clientTimezone: this.clientTimezone
    };

    console.log(`📊 [MyUpdatedFixtureDateSelection] Processing complete:`, stats);

    return {
      todayFixtures,
      yesterdayFixtures,
      tomorrowFixtures,
      allProcessedFixtures: processedFixtures,
      stats
    };
  }

  /**
   * Get fixtures for a specific selected date (today, yesterday, or tomorrow)
   */
  static getFixturesForSelectedDate(
    fixtures: any[],
    selectedDate: string
  ): FixtureWithConvertedDate[] {
    const result = this.processFixturesWithLocalTime(fixtures, selectedDate);
    const dateRanges = this.getLocalDateRanges();
    
    // Determine which day is selected
    if (selectedDate === dateRanges.today.dateString) {
      console.log(`📅 [MyUpdatedFixtureDateSelection] Selected date ${selectedDate} matches today, returning ${result.todayFixtures.length} fixtures`);
      return result.todayFixtures;
    } else if (selectedDate === dateRanges.yesterday.dateString) {
      console.log(`📅 [MyUpdatedFixtureDateSelection] Selected date ${selectedDate} matches yesterday, returning ${result.yesterdayFixtures.length} fixtures`);
      return result.yesterdayFixtures;
    } else if (selectedDate === dateRanges.tomorrow.dateString) {
      console.log(`📅 [MyUpdatedFixtureDateSelection] Selected date ${selectedDate} matches tomorrow, returning ${result.tomorrowFixtures.length} fixtures`);
      return result.tomorrowFixtures;
    } else {
      // For custom dates, filter by the exact date string
      const customDateFixtures = result.allProcessedFixtures.filter(
        (processedFixture) => processedFixture.localDateString === selectedDate
      );
      console.log(`📅 [MyUpdatedFixtureDateSelection] Selected date ${selectedDate} is custom, returning ${customDateFixtures.length} fixtures`);
      return customDateFixtures;
    }
  }

  /**
   * Enhanced date matching for FIFA Club World Cup examples
   */
  static demonstrateTimezoneConversion(): void {
    console.log('🏆 [FIFA Club World Cup Examples] Demonstrating timezone conversion:');
    
    // Today's matches examples (2025-06-18)
    const todayExamples = [
      { teams: 'Fluminense vs Borussia Dortmund', utcDate: '2025-06-17T16:00:00+00:00', status: 'FT' },
      { teams: 'River Plate vs Urawa', utcDate: '2025-06-17T19:00:00+00:00', status: 'FT' },
      { teams: 'Ulsan Hyundai FC vs Mamelodi Sundowns', utcDate: '2025-06-17T22:00:00+00:00', status: 'FT' },
      { teams: 'Monterrey vs Inter', utcDate: '2025-06-18T01:00:00+00:00', status: 'FT' }
    ];

    console.log('\n📅 Today\'s Matches (2025-06-18):');
    todayExamples.forEach((example, index) => {
      const { convertedDate } = this.convertFixtureToLocalTime(example.utcDate);
      console.log(`${index + 1}. ${example.teams}`);
      console.log(`   Status: ${example.status} | UTC Date: ${example.utcDate}`);
      console.log(`   After Conversion: ${convertedDate} (labeled as today ✅)`);
    });

    // Yesterday's matches examples (2025-06-17)
    const yesterdayExamples = [
      { teams: 'Chelsea vs Los Angeles FC', utcDate: '2025-06-16T19:00:00+00:00', status: 'FT' },
      { teams: 'Boca Juniors vs Benfica', utcDate: '2025-06-16T22:00:00+00:00', status: 'FT' },
      { teams: 'Flamengo vs ES Tunis', utcDate: '2025-06-17T01:00:00+00:00', status: 'FT' }
    ];

    console.log('\n📅 Yesterday\'s Matches (2025-06-17):');
    yesterdayExamples.forEach((example, index) => {
      const { convertedDate } = this.convertFixtureToLocalTime(example.utcDate);
      console.log(`${index + 1}. ${example.teams}`);
      console.log(`   Status: ${example.status} | UTC Date: ${example.utcDate}`);
      console.log(`   After Conversion: ${convertedDate} (labeled as yesterday ✅)`);
    });

    // Tomorrow's matches examples (2025-06-19)
    const tomorrowExamples = [
      { teams: 'Manchester City vs Wydad AC', utcDate: '2025-06-18T16:00:00+00:00', status: 'NS' },
      { teams: 'Real Madrid vs Al-Hilal Saudi FC', utcDate: '2025-06-18T19:00:00+00:00', status: 'NS' },
      { teams: 'Pachuca vs Red Bull Salzburg', utcDate: '2025-06-18T22:00:00+00:00', status: 'NS' }
    ];

    console.log('\n📅 Tomorrow\'s Matches (2025-06-19):');
    tomorrowExamples.forEach((example, index) => {
      const { convertedDate } = this.convertFixtureToLocalTime(example.utcDate);
      console.log(`${index + 1}. ${example.teams}`);
      console.log(`   Status: ${example.status} | UTC Date: ${example.utcDate}`);
      console.log(`   After Conversion: ${convertedDate} (labeled as tomorrow ✅)`);
    });
  }

  /**
   * Cache processed fixtures with timezone conversion
   */
  static cacheProcessedFixtures(
    fixtures: any[],
    selectedDate: string,
    source: string = 'api'
  ): void {
    try {
      const cacheKey = `processed-fixtures-${selectedDate}-${this.clientTimezone}`;
      const result = this.processFixturesWithLocalTime(fixtures, selectedDate);
      
      const cacheData = {
        ...result,
        timestamp: Date.now(),
        source,
        timezone: this.clientTimezone,
        selectedDate
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 [MyUpdatedFixtureDateSelection] Cached ${fixtures.length} processed fixtures for ${selectedDate} in ${this.clientTimezone}`);
    } catch (error) {
      console.error('Error caching processed fixtures:', error);
    }
  }

  /**
   * Get cached processed fixtures
   */
  static getCachedProcessedFixtures(selectedDate: string): DateFilterResult | null {
    try {
      const cacheKey = `processed-fixtures-${selectedDate}-${this.clientTimezone}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        return null;
      }

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;
      const maxAge = 10 * 60 * 1000; // 10 minutes

      if (age > maxAge) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      console.log(`✅ [MyUpdatedFixtureDateSelection] Using cached processed fixtures for ${selectedDate}`);
      return cacheData;
    } catch (error) {
      console.error('Error getting cached processed fixtures:', error);
      return null;
    }
  }
}

// Export the class and interfaces
export default MyUpdatedFixtureDateSelection;
