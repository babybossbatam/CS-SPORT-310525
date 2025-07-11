
/**
 * Advanced Time Classifier for Match Filtering
 * 
 * Rules:
 * 1. If fixture time > CurrentTime but status "NS" and within time range 00:00 - 23:59 then its Today's Matches
 * 2. If fixture time < CurrentTime but status "NS" and within time range 00:00 - 23:59 then its Tomorrow's Matches
 * 3. If fixture time < CurrentTime but status "FT" and within time range 00:00 - 23:59 then its Yesterday's Ended Matches
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
   * Classify a fixture based on advanced time rules
   */
  static classifyFixture(fixtureDate: string, status: string, selectedDate?: string): TimeClassificationResult {
    const now = new Date();
    const fixture = new Date(fixtureDate);
    
    // Use selected date if provided, otherwise use today
    const referenceDate = selectedDate ? selectedDate : now.toISOString().slice(0, 10);
    
    // Extract time components
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    const fixtureHour = fixture.getHours();
    const fixtureMinute = fixture.getMinutes();
    const fixtureTimeString = `${fixtureHour.toString().padStart(2, '0')}:${fixtureMinute.toString().padStart(2, '0')}`;
    
    // Check if fixture is within the same date as reference date (selected date or today)
    const todayDate = now.toISOString().slice(0, 10);
    const fixtureDate_str = fixture.toISOString().slice(0, 10);
    const isWithinTimeRange = fixtureDate_str === referenceDate;
    
    console.log(`🕐 [AdvancedTimeClassifier] Analyzing fixture:`, {
      fixtureDate,
      fixtureTime: fixtureTimeString,
      currentTime: currentTimeString,
      status,
      isWithinTimeRange,
      fixtureDate_str,
      selectedDate: referenceDate,
      todayDate
    });
    
    // For any selected date, show matches that fall on that date
    if (isWithinTimeRange) {
      // If it's a future date (NS status), show it
      if (status === 'NS') {
        return {
          category: 'today',
          reason: `Upcoming match on selected date ${referenceDate} with NS status`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: true
        };
      }
      
      // If it's an ended match on the selected date, show it
      if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
        return {
          category: 'today',
          reason: `Ended match on selected date ${referenceDate} with ${status} status`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: true
        };
      }
      
      // If it's a live match on the selected date, show it
      if (['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(status)) {
        return {
          category: 'today',
          reason: `Live match on selected date ${referenceDate} with ${status} status`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: true
        };
      }
    }
    
    // If match is not on the selected date, don't show it
    if (selectedDate && !isWithinTimeRange) {
      return {
        category: 'other',
        reason: `Match date ${fixtureDate_str} does not match selected date ${selectedDate}`,
        fixtureTime: fixtureTimeString,
        currentTime: currentTimeString,
        status,
        shouldShow: false
      };
    }
    
    // Legacy logic for today/yesterday when no specific date is selected
    if (!selectedDate) {
      // Rule 1: If fixture time > CurrentTime but status "NS" and within time range 00:00 - 23:59 then its Today's Matches
      if (status === 'NS' && fixtureDate_str === todayDate) {
        const fixtureTimeMinutes = fixtureHour * 60 + fixtureMinute;
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        
        if (fixtureTimeMinutes > currentTimeMinutes) {
          return {
            category: 'today',
            reason: `Fixture time ${fixtureTimeString} > Current time ${currentTimeString} with NS status`,
            fixtureTime: fixtureTimeString,
            currentTime: currentTimeString,
            status,
            shouldShow: true
          };
        } else {
          return {
            category: 'tomorrow',
            reason: `Fixture time ${fixtureTimeString} < Current time ${currentTimeString} with NS status`,
            fixtureTime: fixtureTimeString,
            currentTime: currentTimeString,
            status,
            shouldShow: false
          };
        }
      }
      
      // Rule 3: Check for yesterday's matches (only when no specific date selected)
      if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().slice(0, 10);
        
        if (fixtureDate_str === yesterdayDate) {
          return {
            category: 'yesterday',
            reason: `Yesterday's ended match with ${status} status`,
            fixtureTime: fixtureTimeString,
            currentTime: currentTimeString,
            status,
            shouldShow: true
          };
        }
      }
    }
    
    // IMPORTANT: If a specific date is selected, do NOT show yesterday's matches
    // Yesterday's matches should only appear in the default "today" view
    
    // Handle live matches - only show on today's date
    if (['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(status)) {
      const todayDate = now.toISOString().slice(0, 10);
      
      // If no specific date is selected, always show live matches (default today behavior)
      if (!selectedDate) {
        return {
          category: 'today',
          reason: `Live match with ${status} status`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: true
        };
      }
      
      // If a specific date is selected, only show live matches if it's today's date
      if (selectedDate === todayDate) {
        return {
          category: 'today',
          reason: `Live match with ${status} status on today's date`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: true
        };
      } else {
        return {
          category: 'other',
          reason: `Live match with ${status} status but selected date ${selectedDate} is not today (${todayDate})`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: false
        };
      }
    }
    
    // Default case
    return {
      category: 'other',
      reason: `Does not match any specific rule - status: ${status}`,
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
        selectedDate  // Pass the selected date
      );
      
      console.log(`🔍 [AdvancedTimeClassifier] Match: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`, {
        classification: classification.category,
        reason: classification.reason,
        shouldShow: classification.shouldShow,
        selectedDate
      });
      
      return classification.shouldShow;
    });
  }
}
