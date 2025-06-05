
import { parseISO, isValid, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export interface SmartTimeResult {
  label: 'today' | 'yesterday' | 'tomorrow' | 'custom';
  reason: string;
  isWithinTimeRange: boolean;
  matchStatus: string;
  fixtureTime: string;
  selectedTime: string;
}

export class MySmartTimeFilter {
  
  /**
   * Check if a fixture should be labeled based on match status and selected date
   */
  static getSmartTimeLabel(
    fixtureDateTime: string, 
    matchStatus: string, 
    selectedDateTime?: string
  ): SmartTimeResult {
    
    try {
      const fixtureDate = parseISO(fixtureDateTime);
      const selectedDate = selectedDateTime ? parseISO(selectedDateTime) : new Date();
      
      if (!isValid(fixtureDate) || !isValid(selectedDate)) {
        return {
          label: 'custom',
          reason: 'Invalid date format',
          isWithinTimeRange: false,
          matchStatus,
          fixtureTime: fixtureDateTime,
          selectedTime: selectedDateTime || new Date().toISOString()
        };
      }

      // Get date strings for comparison (without time)
      const fixtureDateString = format(fixtureDate, 'yyyy-MM-dd');
      const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
      
      // Get actual today, tomorrow, yesterday dates
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = format(tomorrow, 'yyyy-MM-dd');
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = format(yesterday, 'yyyy-MM-dd');

      // Determine what type of date is selected
      const isSelectedToday = selectedDateString === todayString;
      const isSelectedTomorrow = selectedDateString === tomorrowString;
      const isSelectedYesterday = selectedDateString === yesterdayString;

      // Define status categories
      const notStartedStatuses = ['NS', 'TBD', 'PST'];
      const finishedStatuses = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'];
      const liveStatuses = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'];

      // TOMORROW DATE LOGIC
      if (isSelectedTomorrow) {
        if (notStartedStatuses.includes(matchStatus)) {
          // 1. NS status: show only if fixture date matches selected date (tomorrow)
          if (fixtureDateString === selectedDateString) {
            return {
              label: 'tomorrow',
              reason: `NS match on tomorrow's date (${fixtureDateString} = ${selectedDateString})`,
              isWithinTimeRange: true,
              matchStatus,
              fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
              selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
            };
          } else {
            // 2. NS but different date = today's matches, don't display
            return {
              label: 'custom',
              reason: `NS match not on tomorrow's date (${fixtureDateString} ≠ ${selectedDateString}) - belongs to today`,
              isWithinTimeRange: false,
              matchStatus,
              fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
              selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
            };
          }
        } else if (finishedStatuses.includes(matchStatus)) {
          // 3. & 4. Finished matches on different date = today's/yesterday's matches, don't display
          return {
            label: 'custom',
            reason: `Finished match not on tomorrow's date (${fixtureDateString} ≠ ${selectedDateString}) - belongs to today/yesterday`,
            isWithinTimeRange: false,
            matchStatus,
            fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
            selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
          };
        }
      }

      // TODAY DATE LOGIC  
      if (isSelectedToday) {
        // Define today's time range (00:01:00 - 23:59:59)
        const todayStart = startOfDay(selectedDate);
        todayStart.setHours(0, 1, 0, 0); // 00:01:00
        
        const todayEnd = endOfDay(selectedDate);
        todayEnd.setHours(23, 59, 59, 999); // 23:59:59
        
        const isWithinTodayRange = isWithinInterval(fixtureDate, {
          start: todayStart,
          end: todayEnd
        });

        if (notStartedStatuses.includes(matchStatus)) {
          if (isWithinTodayRange) {
            return {
              label: 'today',
              reason: `NS match within today's time range (${format(todayStart, 'HH:mm:ss')} - ${format(todayEnd, 'HH:mm:ss')})`,
              isWithinTimeRange: true,
              matchStatus,
              fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
              selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
            };
          } else {
            return {
              label: 'custom',
              reason: `NS match outside today's time range`,
              isWithinTimeRange: false,
              matchStatus,
              fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
              selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
            };
          }
        }
      }

      // YESTERDAY DATE LOGIC
      if (isSelectedYesterday) {
        if (finishedStatuses.includes(matchStatus)) {
          if (fixtureDateString === selectedDateString) {
            return {
              label: 'yesterday',
              reason: `Finished match on yesterday's date (${fixtureDateString} = ${selectedDateString})`,
              isWithinTimeRange: true,
              matchStatus,
              fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
              selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
            };
          }
        }
      }

      // GENERAL LOGIC FOR OTHER CASES
      if (finishedStatuses.includes(matchStatus)) {
        if (fixtureDateString === selectedDateString) {
          return {
            label: isSelectedToday ? 'today' : isSelectedYesterday ? 'yesterday' : 'custom',
            reason: `Finished match on selected date (${fixtureDateString} = ${selectedDateString})`,
            isWithinTimeRange: true,
            matchStatus,
            fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
            selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
          };
        } else {
          return {
            label: 'custom',
            reason: `Finished match not on selected date (${fixtureDateString} ≠ ${selectedDateString})`,
            isWithinTimeRange: false,
            matchStatus,
            fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
            selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
          };
        }
      }

      // Live matches - always show if they're happening
      if (liveStatuses.includes(matchStatus)) {
        return {
          label: 'today',
          reason: `Live match (always considered today)`,
          isWithinTimeRange: true,
          matchStatus,
          fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
          selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
        };
      }

      // Default case for unknown status
      return {
        label: 'custom',
        reason: `Unknown match status: ${matchStatus}`,
        isWithinTimeRange: false,
        matchStatus,
        fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
        selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
      };

    } catch (error) {
      return {
        label: 'custom',
        reason: `Error processing dates: ${error}`,
        isWithinTimeRange: false,
        matchStatus,
        fixtureTime: fixtureDateTime,
        selectedTime: selectedDateTime || new Date().toISOString()
      };
    }
  }

  /**
   * Check if a fixture is within today's time range
   */
  static isFixtureWithinTodayRange(
    fixtureDateTime: string, 
    referenceDateTime?: string
  ): boolean {
    try {
      const fixtureDate = parseISO(fixtureDateTime);
      const referenceDate = referenceDateTime ? parseISO(referenceDateTime) : new Date();
      
      if (!isValid(fixtureDate) || !isValid(referenceDate)) {
        return false;
      }

      // Define today's time range (00:01:00 - 23:59:59)
      const todayStart = startOfDay(referenceDate);
      todayStart.setHours(0, 1, 0, 0);
      
      const todayEnd = endOfDay(referenceDate);
      todayEnd.setHours(23, 59, 59, 999);
      
      return isWithinInterval(fixtureDate, {
        start: todayStart,
        end: todayEnd
      });
    } catch (error) {
      console.error('Error checking if fixture is within today range:', error);
      return false;
    }
  }

  /**
   * Filter fixtures based on smart time logic for "TODAY"
   */
  static filterTodayFixtures(
    fixtures: any[], 
    selectedDateTime?: string
  ): {
    todayFixtures: any[];
    tomorrowFixtures: any[];
    rejectedFixtures: Array<{ fixture: any; reason: string }>;
    stats: {
      total: number;
      today: number;
      tomorrow: number;
      rejected: number;
      statusBreakdown: {
        ns: number;
        finished: number;
        live: number;
        other: number;
      };
    };
  } {
    const todayFixtures: any[] = [];
    const tomorrowFixtures: any[] = [];
    const rejectedFixtures: Array<{ fixture: any; reason: string }> = [];
    const statusBreakdown = { ns: 0, finished: 0, live: 0, other: 0 };

    fixtures.forEach(fixture => {
      if (!fixture?.fixture?.date || !fixture?.fixture?.status?.short) {
        rejectedFixtures.push({ fixture, reason: 'Missing fixture date or status' });
        return;
      }

      const smartResult = this.getSmartTimeLabel(
        fixture.fixture.date,
        fixture.fixture.status.short,
        selectedDateTime
      );

      if (smartResult.label === 'today') {
        todayFixtures.push(fixture);
        
        // Update status breakdown
        const status = fixture.fixture.status.short;
        if (['NS', 'TBD', 'PST'].includes(status)) {
          statusBreakdown.ns++;
        } else if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
          statusBreakdown.finished++;
        } else if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
          statusBreakdown.live++;
        } else {
          statusBreakdown.other++;
        }

        console.log(`✅ [MySmartTimeFilter] Fixture labeled as TODAY:`, {
          fixtureId: fixture.fixture.id,
          status: smartResult.matchStatus,
          reason: smartResult.reason,
          fixtureTime: smartResult.fixtureTime,
          selectedTime: smartResult.selectedTime,
          isWithinTimeRange: smartResult.isWithinTimeRange
        });
      } else if (smartResult.label === 'tomorrow') {
        tomorrowFixtures.push(fixture);
        
        // Update status breakdown for tomorrow
        const status = fixture.fixture.status.short;
        if (['NS', 'TBD', 'PST'].includes(status)) {
          statusBreakdown.ns++;
        }

        console.log(`🌅 [MySmartTimeFilter] Fixture labeled as TOMORROW:`, {
          fixtureId: fixture.fixture.id,
          status: smartResult.matchStatus,
          reason: smartResult.reason,
          fixtureTime: smartResult.fixtureTime,
          selectedTime: smartResult.selectedTime,
          isWithinTimeRange: smartResult.isWithinTimeRange
        });
      } else {
        rejectedFixtures.push({ fixture, reason: smartResult.reason });
        
        console.log(`❌ [MySmartTimeFilter] Fixture rejected:`, {
          fixtureId: fixture.fixture.id,
          status: smartResult.matchStatus,
          reason: smartResult.reason,
          label: smartResult.label
        });
      }
    });

    return {
      todayFixtures,
      tomorrowFixtures,
      rejectedFixtures,
      stats: {
        total: fixtures.length,
        today: todayFixtures.length,
        tomorrow: tomorrowFixtures.length,
        rejected: rejectedFixtures.length,
        statusBreakdown
      }
    };
  }

  /**
   * Debug helper to log smart time filtering details
   */
  static debugSmartTimeFilter(
    fixtureDateTime: string, 
    matchStatus: string, 
    selectedDateTime?: string
  ): void {
    const result = this.getSmartTimeLabel(fixtureDateTime, matchStatus, selectedDateTime);
    
    console.log(`🔍 [MySmartTimeFilter] Debug Info:`, {
      input: {
        fixtureDateTime,
        matchStatus,
        selectedDateTime: selectedDateTime || 'current time'
      },
      result: {
        label: result.label,
        reason: result.reason,
        isWithinTimeRange: result.isWithinTimeRange,
        fixtureTime: result.fixtureTime,
        selectedTime: result.selectedTime
      },
      timeRange: {
        start: '00:01:00',
        end: '23:59:59'
      }
    });
  }
}

export default MySmartTimeFilter;
