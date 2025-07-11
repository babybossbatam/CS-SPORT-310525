
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
   * Classify a fixture based on advanced time rules - Updated to match 365scores.com behavior
   */
  static classifyFixture(fixtureDate: string, status: string): TimeClassificationResult {
    const now = new Date();
    const fixture = new Date(fixtureDate);
    
    // Extract time components
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    const fixtureHour = fixture.getHours();
    const fixtureMinute = fixture.getMinutes();
    const fixtureTimeString = `${fixtureHour.toString().padStart(2, '0')}:${fixtureMinute.toString().padStart(2, '0')}`;
    
    // Check if fixture is within the same date as today
    const todayDate = now.toISOString().slice(0, 10);
    const fixtureDate_str = fixture.toISOString().slice(0, 10);
    const isWithinTimeRange = fixtureDate_str === todayDate;
    
    console.log(`🕐 [AdvancedTimeClassifier] Analyzing fixture:`, {
      fixtureDate,
      fixtureTime: fixtureTimeString,
      currentTime: currentTimeString,
      status,
      isWithinTimeRange,
      fixtureDate_str,
      todayDate
    });
    
    // Handle live matches - always show regardless of date/time
    if (['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(status)) {
      return {
        category: 'today',
        reason: `Live match with ${status} status`,
        fixtureTime: fixtureTimeString,
        currentTime: currentTimeString,
        status,
        shouldShow: true
      };
    }
    
    // Handle upcoming matches (NS, TBD)
    if (['NS', 'TBD'].includes(status)) {
      if (isWithinTimeRange) {
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
      } else {
        // Check if it's a future date (tomorrow or later)
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().slice(0, 10);
        
        if (fixtureDate_str >= tomorrowDate) {
          return {
            category: 'tomorrow',
            reason: `Future match on ${fixtureDate_str} with ${status} status`,
            fixtureTime: fixtureTimeString,
            currentTime: currentTimeString,
            status,
            shouldShow: false
          };
        }
        
        // For past dates with NS/TBD status, still show them (might be rescheduled)
        return {
          category: 'today',
          reason: `Rescheduled or delayed match from ${fixtureDate_str} with ${status} status`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: true
        };
      }
    }
    
    // Handle ended matches (FT, AET, PEN, etc.) - More permissive approach like 365scores
    if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
      // Show ended matches if they're on today's date
      if (isWithinTimeRange) {
        return {
          category: 'today',
          reason: `Ended match today with ${status} status`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: true
        };
      }
      
      // Check if it's yesterday's match
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
      
      // For matches from other dates, check if they should be shown
      // 365scores typically shows recent matches (within 2-3 days)
      const matchDate = new Date(fixtureDate_str);
      const daysDifference = Math.abs((now.getTime() - matchDate.getTime()) / (1000 * 3600 * 24));
      
      if (daysDifference <= 3) {
        return {
          category: 'recent',
          reason: `Recent ended match from ${fixtureDate_str} with ${status} status (${daysDifference.toFixed(1)} days ago)`,
          fixtureTime: fixtureTimeString,
          currentTime: currentTimeString,
          status,
          shouldShow: true
        };
      }
    }
    
    // Default case - for very old matches or unknown statuses
    return {
      category: 'other',
      reason: `Old or unknown match - status: ${status}, date: ${fixtureDate_str}`,
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
        fixture.fixture.status.short
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
