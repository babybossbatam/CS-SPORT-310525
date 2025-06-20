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

      // Smart status converter implementation start
      let convertedStatus = matchStatus;
      if (notStartedStatuses.includes(matchStatus)) {
          const now = new Date();

          // Only convert to FT if the fixture is actually in the past AND on a past date
          // Don't convert future dates even if the time has passed today
          const fixtureDateOnly = format(fixtureDate, 'yyyy-MM-dd');
          const todayDateOnly = format(now, 'yyyy-MM-dd');

          // Only convert if the fixture date is actually before today's date
          if (fixtureDateOnly < todayDateOnly) {
              convertedStatus = 'FT';
              console.log(`🔄 [SMART STATUS] Converted NS to FT: ${fixtureDateOnly} < ${todayDateOnly}`);
          }
          // For same day fixtures, only convert if time has passed AND we're viewing today
          else if (fixtureDateOnly === todayDateOnly && fixtureDate < now && isSelectedToday) {
              convertedStatus = 'FT';
              console.log(`🔄 [SMART STATUS] Converted NS to FT (same day): ${format(fixtureDate, 'HH:mm')} < ${format(now, 'HH:mm')}`);
          }
          // Keep NS status for future dates regardless of time
          else {
              console.log(`✅ [SMART STATUS] Keeping NS status: fixture=${fixtureDateOnly}, today=${todayDateOnly}, selected=${selectedDateString}`);
          }
      }
      // Smart status converter implementation end

      // TOMORROW DATE LOGIC
      if (isSelectedTomorrow) {
        // Add debug logging for COSAFA Cup matches
        const isCOSAFACup = fixtureDateTime.includes('COSAFA') || matchStatus.includes('COSAFA');

        if (notStartedStatuses.includes(convertedStatus)) {
          // 1. NS status: show only if fixture date matches selected date (tomorrow)
          if (fixtureDateString === selectedDateString) {
            if (isCOSAFACup) {
              console.log(`🏆 [COSAFA DEBUG] TOMORROW - NS match INCLUDED:`, {
                fixtureDateString,
                selectedDateString,
                matchStatus,
                convertedStatus,
                fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
                selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
              });
            }
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
            if (isCOSAFACup) {
              console.log(`🏆 [COSAFA DEBUG] TOMORROW - NS match EXCLUDED (wrong date):`, {
                fixtureDateString,
                selectedDateString,
                matchStatus,
                convertedStatus,
                reason: 'Date mismatch',
                fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
                selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
              });
            }
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
          if (isCOSAFACup) {
            console.log(`🏆 [COSAFA DEBUG] TOMORROW - Finished match EXCLUDED:`, {
              fixtureDateString,
              selectedDateString,
              matchStatus,
              reason: 'Finished match not for tomorrow',
              fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
              selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
            });
          }
          return {
            label: 'custom',
            reason: `Finished match not on tomorrow's date (${fixtureDateString} ≠ ${selectedDateString}) - belongs to today/yesterday`,
            isWithinTimeRange: false,
            matchStatus,
            fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
            selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
          };
        }

        // Log if COSAFA Cup match reaches here without being handled
        if (isCOSAFACup) {
          console.log(`🏆 [COSAFA DEBUG] TOMORROW - Match not handled by NS/Finished logic:`, {
            fixtureDateString,
            selectedDateString,
            matchStatus,
            convertedStatus,
            notStartedStatuses,
            finishedStatuses,
            fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss')
          });
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

        // Get current time for comparison
        const now = new Date();

        if (notStartedStatuses.includes(convertedStatus)) {
          if (isWithinTodayRange) {
            // For NS matches, if current time has passed fixture time, move to tomorrow
            if (fixtureDate < now) {
              return {
                label: 'custom',
                reason: `NS match time has passed (${format(fixtureDate, 'HH:mm:ss')} < ${format(now, 'HH:mm:ss')}) - should be moved to tomorrow`,
                isWithinTimeRange: false,
                matchStatus,
                fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
                selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
              };
            }

            // For NS matches on today's date that haven't passed yet
            if (fixtureDateString === selectedDateString) {
              return {
                label: 'today',
                reason: `NS match within today's time range and hasn't started yet (${format(todayStart, 'HH:mm:ss')} - ${format(todayEnd, 'HH:mm:ss')})`,
                isWithinTimeRange: true,
                matchStatus,
                fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
                selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
              };
            } else {
              return {
                label: 'custom',
                reason: `NS match within today's time range but wrong date (${fixtureDateString} ≠ ${selectedDateString})`,
                isWithinTimeRange: false,
                matchStatus,
                fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
                selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
              };
            }
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

      // CUSTOM DATE LOGIC (for dates that are not today/tomorrow/yesterday)
      if (!isSelectedToday && !isSelectedTomorrow && !isSelectedYesterday) {

        // For NS (Not Started) matches on custom dates - use original status, not converted
        if (notStartedStatuses.includes(matchStatus)) {
          if (fixtureDateString === selectedDateString) {
            return {
              label: 'custom',
              reason: `NS match on selected custom date (${fixtureDateString} = ${selectedDateString})`,
              isWithinTimeRange: true,
              matchStatus,
              fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
              selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
            };
          } else {
            return {
              label: 'custom',
              reason: `NS match not on selected custom date (${fixtureDateString} ≠ ${selectedDateString})`,
              isWithinTimeRange: false,
              matchStatus,
              fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
              selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
            };
          }
        }

        // For finished matches on custom dates
        if (finishedStatuses.includes(matchStatus)) {
          if (fixtureDateString === selectedDateString) {
            return {
              label: 'custom',
              reason: `Finished match on selected custom date (${fixtureDateString} = ${selectedDateString})`,
              isWithinTimeRange: true,
              matchStatus,
              fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
              selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
            };
          } else {
            return {
              label: 'custom',
              reason: `Finished match not on selected custom date (${fixtureDateString} ≠ ${selectedDateString})`,
              isWithinTimeRange: false,
              matchStatus,
              fixtureTime: format(fixtureDate, 'yyyy/MM/dd HH:mm:ss'),
              selectedTime: format(selectedDate, 'yyyy/MM/dd HH:mm:ss')
            };
          }
        }

      // Live matches - convert to local timezone first, then validate date using our smart labeling system
      if (liveStatuses.includes(matchStatus)) {
        // Convert fixture time to local timezone for proper date comparison
        const fixtureLocalDate = new Date(fixtureDate.getTime());
        const selectedLocalDate = new Date(selectedDate.getTime());

        // Get date strings in local timezone after conversion
        const fixtureLocalDateString = format(fixtureLocalDate, 'yyyy-MM-dd');
        const selectedLocalDateString = format(selectedLocalDate, 'yyyy-MM-dd');

        console.log(`🕐 [LIVE TIMEZONE DEBUG] Live match timezone conversion:`, {
          originalUTC: fixtureDateTime,
          selectedUTC: selectedDateTime || 'current time',
          fixtureLocalDate: format(fixtureLocalDate, 'yyyy-MM-dd HH:mm:ss'),
          selectedLocalDate: format(selectedLocalDate, 'yyyy-MM-dd HH:mm:ss'),
          fixtureLocalDateString,
          selectedLocalDateString,
          datesMatch: fixtureLocalDateString === selectedLocalDateString
        });

        // Check if the live match date matches the selected date after timezone conversion
        if (fixtureLocalDateString === selectedLocalDateString) {
          return {
            label: isSelectedToday ? 'today' : isSelectedTomorrow ? 'tomorrow' : isSelectedYesterday ? 'yesterday' : 'custom',
            reason: `Live match on ${isSelectedToday ? 'today' : isSelectedTomorrow ? 'tomorrow' : isSelectedYesterday ? 'yesterday' : 'selected date'} after timezone conversion (${fixtureLocalDateString})`,
            isWithinTimeRange: true,
            matchStatus,
            fixtureTime: format(fixtureLocalDate, 'yyyy/MM/dd HH:mm:ss'),
            selectedTime: format(selectedLocalDate, 'yyyy/MM/dd HH:mm:ss')
          };
        } else {
          // Live match on different date after timezone conversion - exclude it
          return {
            label: 'custom',
            reason: `Live match excluded after timezone conversion (${fixtureLocalDateString} ≠ ${selectedLocalDateString}) - belongs to ${fixtureLocalDateString}`,
            isWithinTimeRange: false,
            matchStatus,
            fixtureTime: format(fixtureLocalDate, 'yyyy/MM/dd HH:mm:ss'),
            selectedTime: format(selectedLocalDate, 'yyyy/MM/dd HH:mm:ss')
          };
        }
      }
      }

      // GENERAL LOGIC FOR TODAY/YESTERDAY CASES (fallback)
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
          label: isSelectedToday ? 'today' : 'custom',
          reason: `Live match (${isSelectedToday ? 'considered today' : 'on custom date'})`,
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
        selectedTime: selectedDateTime || new Date().toISOString()
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