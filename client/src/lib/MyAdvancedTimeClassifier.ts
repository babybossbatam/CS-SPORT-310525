
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
      
      // Past dates should never have live or upcoming matches
      if (['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(status)) {
        return {
          category: 'other',
          reason: `Invalid live match on past date ${requestedDate} - excluding`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: false
        };
      }
      
      if (['NS', 'TBD'].includes(status)) {
        return {
          category: 'other',
          reason: `Invalid upcoming match on past date ${requestedDate} - excluding`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: false
        };
      }
    }
    
    // FOR FUTURE DATES: Only show upcoming matches
    if (isFutureDate) {
      if (['NS', 'TBD'].includes(status)) {
        return {
          category: 'tomorrow',
          reason: `Future upcoming match on ${requestedDate} with ${status} status`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: true
        };
      }
      
      // Future dates should never have live or ended matches
      if (['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(status)) {
        return {
          category: 'other',
          reason: `Invalid live match on future date ${requestedDate} - excluding`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: false
        };
      }
      
      if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
        return {
          category: 'other',
          reason: `Invalid ended match on future date ${requestedDate} - excluding`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: false
        };
      }
    }
    
    // FOR TODAY (CURRENT DATE): Show all match types
    if (isToday) {
      // Handle live matches - always show
      if (['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(status)) {
        return {
          category: 'today',
          reason: `Live match today with ${status} status`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: true
        };
      }
      
      // Handle upcoming matches
      if (['NS', 'TBD'].includes(status)) {
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
          // For matches that were scheduled today but time has passed, still show them (they might be delayed)
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
