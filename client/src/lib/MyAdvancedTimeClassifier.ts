
/**
 * Advanced Time Classifier for Match Filtering
 * 
 * Rules:
 * 1. Past dates: Only show ended matches (FT, AET, PEN, etc.)
 * 2. Current date: Show all match types (live, upcoming, ended)
 * 3. Future dates: Only show upcoming matches (NS, TBD)
 */

export interface TimeClassificationResult {
  category: 'today' | 'tomorrow' | 'yesterday' | 'other';
  reason: string;
  fixtureTime: string;
  currentTime: string;
  status: string;
  shouldShow: boolean;
}

export class MyAdvancedTimeClassifier {
  /**
   * Classify a fixture based on advanced time rules - Updated to match 365scores.com behavior
   */
  static classifyFixture(fixtureDate: string, status: string, selectedDate?: string): TimeClassificationResult {
    const now = new Date();
    const fixture = new Date(fixtureDate);
    
    // Extract time components for current time (local)
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Extract time components from UTC fixture time
    const fixtureHour = fixture.getUTCHours();
    const fixtureMinute = fixture.getUTCMinutes();
    const fixtureTimeString = `${fixtureHour.toString().padStart(2, '0')}:${fixtureMinute.toString().padStart(2, '0')}`;
    
    // Get date strings for comparison - using raw UTC dates
    const todayDate = now.toISOString().slice(0, 10);
    const fixtureDate_str = fixtureDate.substring(0, 10); // Extract YYYY-MM-DD directly from UTC string
    const requestedDate = selectedDate || todayDate;
    
    // CRITICAL VALIDATION: Log suspicious combinations that shouldn't exist
    const isLiveMatch = ['LIVE', 'LIV', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(status);
    const isUpcomingMatch = ['NS', 'TBD'].includes(status);
    const isEndedMatch = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status);
    
    if (isLiveMatch && requestedDate < todayDate) {
      console.error(`🚨 [DATA VALIDATION ERROR] Live match on past date:`, {
        fixtureDate,
        status,
        requestedDate,
        todayDate,
        severity: 'CRITICAL - Live matches cannot exist on past dates'
      });
    }
    
    if (isUpcomingMatch && requestedDate < todayDate) {
      console.error(`🚨 [DATA VALIDATION ERROR] Upcoming match on past date:`, {
        fixtureDate,
        status,
        requestedDate,
        todayDate,
        severity: 'CRITICAL - Upcoming matches cannot exist on past dates'
      });
    }
    
    if ((isLiveMatch || isEndedMatch) && requestedDate > todayDate) {
      console.error(`🚨 [DATA VALIDATION ERROR] Live/Ended match on future date:`, {
        fixtureDate,
        status,
        requestedDate,
        todayDate,
        severity: 'CRITICAL - Live/Ended matches cannot exist on future dates'
      });
    }
    
    console.log(`🕐 [AdvancedTimeClassifier] Analyzing fixture:`, {
      fixtureDate,
      fixtureTime: fixtureTimeString,
      currentTime: currentTimeString,
      status,
      fixtureDate_str,
      todayDate,
      requestedDate,
      isPastDate: requestedDate < todayDate,
      isToday: requestedDate === todayDate,
      isFutureDate: requestedDate > todayDate
    });
    
    // Determine if requested date is past, present, or future
    const isPastDate = requestedDate < todayDate;
    const isToday = requestedDate === todayDate;
    const isFutureDate = requestedDate > todayDate;
    
    // Check if fixture date matches the requested date
    const fixtureMatchesRequestedDate = fixtureDate_str === requestedDate;
    
    // If fixture doesn't match the requested date, exclude it
    if (!fixtureMatchesRequestedDate) {
      return {
        category: 'other',
        reason: `Fixture date ${fixtureDate_str} doesn't match requested date ${requestedDate}`,
        fixtureTime: fixtureTimeString,
        currentTime: currentTimeString,
        status,
        shouldShow: false
      };
    }
    
    // FOR PAST DATES: Only show ended matches
    if (isPastDate) {
      if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
        return {
          category: 'yesterday',
          reason: `Historical ended match from ${requestedDate} with ${status} status`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: true
        };
      }
      
      // CRITICAL: Past dates should NEVER have live matches
      if (['LIVE', 'LIV', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(status)) {
        console.warn(`🚨 [CRITICAL DATA ERROR] Live match found on past date ${requestedDate}:`, {
          status,
          fixtureDate,
          requestedDate,
          reason: 'Live matches cannot exist on past dates - this indicates data inconsistency'
        });
        
        return {
          category: 'other',
          reason: `CRITICAL: Invalid live match on past date ${requestedDate} with ${status} status - data error`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: false
        };
      }
      
      // CRITICAL: Past dates should NEVER have upcoming matches
      if (['NS', 'TBD'].includes(status)) {
        console.warn(`🚨 [CRITICAL DATA ERROR] Upcoming match found on past date ${requestedDate}:`, {
          status,
          fixtureDate,
          requestedDate,
          reason: 'Upcoming matches cannot exist on past dates - this indicates data inconsistency'
        });
        
        return {
          category: 'other',
          reason: `CRITICAL: Invalid upcoming match on past date ${requestedDate} with ${status} status - data error`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: false
        };
      }
      
      // For any other status on past dates, exclude it
      return {
        category: 'other',
        reason: `Unknown status ${status} on past date ${requestedDate} - excluding for safety`,
        fixtureTime: fixtureTimeString,
        currentTime: currentTimeString,
        status,
        shouldShow: false
      };
    }
    
    // FOR FUTURE DATES: Only show upcoming matches
    if (isFutureDate) {
      if (['NS', 'TBD'].includes(status)) {
        // Validate that fixture date matches requested date
        if (fixtureDate_str === requestedDate) {
          return {
            category: 'tomorrow',
            reason: `Future upcoming match on ${requestedDate} with ${status} status (validated: ${fixtureDate_str} = ${requestedDate})`,
            fixtureTime: fixtureTimeString,
            currentTime: currentTimeString,
            status,
            shouldShow: true
          };
        } else {
          return {
            category: 'other',
            reason: `Upcoming match date mismatch: fixture=${fixtureDate_str}, requested=${requestedDate} - excluding`,
            fixtureTime: fixtureTimeString,
            currentTime: currentTimeString,
            status,
            shouldShow: false
          };
        }
      }
      
      // CRITICAL: Future dates should NEVER have live matches
      if (['LIVE', 'LIV', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(status)) {
        console.error(`🚨 [CRITICAL DATA ERROR] Live match found on future date ${requestedDate}:`, {
          status,
          fixtureDate,
          requestedDate,
          reason: 'Live matches cannot exist on future dates - this indicates serious data corruption'
        });
        
        return {
          category: 'other',
          reason: `CRITICAL: Invalid live match on future date ${requestedDate} with ${status} status - data corruption`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: false
        };
      }
      
      // CRITICAL: Future dates should NEVER have ended matches
      if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
        console.error(`🚨 [CRITICAL DATA ERROR] Ended match found on future date ${requestedDate}:`, {
          status,
          fixtureDate,
          requestedDate,
          reason: 'Ended matches cannot exist on future dates - this indicates serious data corruption'
        });
        
        return {
          category: 'other',
          reason: `CRITICAL: Invalid ended match on future date ${requestedDate} with ${status} status - data corruption`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: false
        };
      }
      
      // For any other status on future dates, exclude it
      return {
        category: 'other',
        reason: `Unknown status ${status} on future date ${requestedDate} - excluding for safety`,
        fixtureTime: fixtureTimeString,
        currentTime: currentTimeString,
        status,
        shouldShow: false
      };
    }
    
    // FOR TODAY (CURRENT DATE): Show all match types
    if (isToday) {
      // Handle live matches - but double-check they're actually happening today
      if (['LIVE', 'LIV', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(status)) {
        // Additional validation: ensure the fixture date is actually today
        if (fixtureDate_str === todayDate) {
          return {
            category: 'today',
            reason: `Live match today with ${status} status (validated: ${fixtureDate_str} = ${todayDate})`,
            fixtureTime: fixtureTimeString,
            currentTime: currentTimeString,
            status,
            shouldShow: true
          };
        } else {
          console.warn(`🚨 [LIVE MATCH VALIDATION] Live match has mismatched date:`, {
            status,
            fixtureDate_str,
            todayDate,
            requestedDate,
            reason: 'Live match date does not match today - excluding'
          });
          
          return {
            category: 'other',
            reason: `Live match date mismatch: fixture=${fixtureDate_str}, today=${todayDate} - excluding`,
            fixtureTime: fixtureTimeString,
            currentTime: currentTimeString,
            status,
            shouldShow: false
          };
        }
      }
      
      // Handle upcoming matches
      if (['NS', 'TBD'].includes(status)) {
        // First validate the date matches
        if (fixtureDate_str !== todayDate) {
          console.warn(`🚨 [UPCOMING MATCH VALIDATION] Upcoming match has wrong date:`, {
            status,
            fixtureDate_str,
            todayDate,
            requestedDate,
            reason: 'Upcoming match date does not match requested date'
          });
          
          return {
            category: 'other',
            reason: `Upcoming match date mismatch: fixture=${fixtureDate_str}, today=${todayDate} - excluding`,
            fixtureTime: fixtureTimeString,
            currentTime: currentTimeString,
            status,
            shouldShow: false
          };
        }
        
        const fixtureTimeMinutes = fixtureHour * 60 + fixtureMinute;
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        
        if (fixtureTimeMinutes > currentTimeMinutes) {
          return {
            category: 'today',
            reason: `Upcoming match today - Fixture time ${fixtureTimeString} > Current time ${currentTimeString} with ${status} status`,
            fixtureTime: fixtureTimeString,
            currentTime: currentTimeString,
            status,
            shouldShow: true
          };
        } else {
          // For matches that were scheduled today but time has passed, show warning but allow (might be delayed)
          console.log(`⚠️ [DELAYED MATCH] Match scheduled for past time but still NS/TBD:`, {
            status,
            fixtureTime: fixtureTimeString,
            currentTime: currentTimeString,
            reason: 'Match time has passed but still showing as upcoming - possibly delayed'
          });
          
          return {
            category: 'today',
            reason: `Scheduled match today (possibly delayed) - Fixture time ${fixtureTimeString} <= Current time ${currentTimeString} with ${status} status`,
            fixtureTime: fixtureTimeString,
            currentTime: currentTimeString,
            status,
            shouldShow: true
          };
        }
      }
      
      // Handle ended matches
      if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
        return {
          category: 'today',
          reason: `Ended match today with ${status} status`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: true
        };
      }
    }
    
    // Default case - for unknown statuses
    return {
      category: 'other',
      reason: `Unknown status: ${status} on date: ${requestedDate}`,
      fixtureTime: fixtureTimeString,
      currentTime: currentTimeString,
      status,
      shouldShow: false
    };
  }
  
  /**
   * Filter fixtures for a specific selected date using advanced time rules
   */
  static filterFixturesForDate(fixtures: any[], selectedDate: string): any[] {
    return fixtures.filter(fixture => {
      if (!fixture?.fixture?.date || !fixture?.fixture?.status?.short) {
        return false;
      }
      
      const classification = this.classifyFixture(
        fixture.fixture.date,
        fixture.fixture.status.short,
        selectedDate
      );
      
      console.log(`🔍 [AdvancedTimeClassifier] Match: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`, {
        fixtureDate: fixture.fixture.date,
        selectedDate,
        status: fixture.fixture.status.short,
        classification: classification.category,
        reason: classification.reason,
        shouldShow: classification.shouldShow
      });
      
      return classification.shouldShow;
    });
  }
}
