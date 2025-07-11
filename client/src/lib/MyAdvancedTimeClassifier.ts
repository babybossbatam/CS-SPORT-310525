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
  fixtureLocalDate?: string; // add this
}

export class MyAdvancedTimeClassifier {

   /**
   * Get fixture's local date in user's timezone
   */
  static getFixtureLocalDate(fixtureDate: string, timezone: string = 'UTC'): string {
      try {
          // Use toLocaleDateString with the IANA timezone
          const date = new Date(fixtureDate);
          const localDateString = date.toLocaleDateString('en-CA', {
              timeZone: timezone,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
          });

          // Convert the en-CA format (YYYY-MM-DD) to ISO format
          const [year, month, day] = localDateString.split('/');
          return `${year}-${month}-${day}`;
      } catch (error) {
          console.error("Error converting date to timezone:", error);
          return fixtureDate.slice(0, 10); // Fallback to original date if timezone conversion fails
      }
  }


  /**
   * Classify a fixture based on advanced time rules
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

    // Get user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Convert fixture date to user's local date
    const fixtureLocalDate = this.getFixtureLocalDate(fixtureDate, userTimezone);

    // Get today, yesterday, and tomorrow dates in user's timezone
    const today = this.getFixtureLocalDate(now.toISOString(), userTimezone);
    const yesterday = this.getFixtureLocalDate(new Date(now.setDate(now.getDate() - 1)).toISOString(), userTimezone);
    const tomorrow = this.getFixtureLocalDate(new Date(now.setDate(now.getDate() + 2)).toISOString(), userTimezone);

    console.log(`🕐 [AdvancedTimeClassifier] Analyzing fixture:`, {
      fixtureDate,
      fixtureTime: fixtureTimeString,
      currentTime: currentTimeString,
      status,
      fixtureLocalDate,
      userTimezone,
      today,
      yesterday,
      tomorrow
    });

    // Determine which date category this fixture belongs to in user's timezone
    let category: 'today' | 'tomorrow' | 'yesterday' | 'other' = 'other';
    let shouldShow = false;
    let reason = '';

    if (fixtureLocalDate === today) {
      category = 'today';

      // Handle live matches - always show
      if (['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(status)) {
        shouldShow = true;
        reason = `Today's live match with ${status} status`;
      }
      // Handle ended matches from today
      else if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
        shouldShow = true;
        reason = `Today's ended match with ${status} status`;
      }
      // Handle upcoming matches for today
      else if (status === 'NS') {
        shouldShow = true;
        reason = `Today's upcoming match with ${status} status`;
      }
      else {
        reason = `Today's match with unknown status: ${status}`;
      }
    }
    else if (fixtureLocalDate === yesterday) {
      category = 'yesterday';
      shouldShow = false; // Don't show yesterday's matches unless specifically requested
      reason = `Yesterday's match with ${status} status - not shown on today's date`;
    }
    else if (fixtureLocalDate === tomorrow) {
      category = 'tomorrow';
      shouldShow = false; // Don't show tomorrow's matches unless specifically requested
      reason = `Tomorrow's match with ${status} status - not shown on today's date`;
    }
    else {
      category = 'other';
      shouldShow = false;
      reason = `Match from ${fixtureLocalDate} - not today/yesterday/tomorrow`;
    }

    return {
      category,
      reason,
      fixtureTime: fixtureTimeString,
      currentTime: currentTimeString,
      status,
      shouldShow,
      fixtureLocalDate
    };
  }

  /**
   * Filter fixtures for a specific selected date using timezone-aware date matching
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

      // Get the fixture's local date in user's timezone
      const fixtureLocalDate = this.getFixtureLocalDate(fixture.fixture.date);

      // Check if the fixture's local date matches the selected date
      const shouldShowOnSelectedDate = fixtureLocalDate === selectedDate;

      console.log(`🔍 [AdvancedTimeClassifier] Match: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`, {
        classification: classification.category,
        reason: classification.reason,
        shouldShow: classification.shouldShow,
        selectedDate,
        fixtureLocalDate,
        fixtureUTCDate: fixture.fixture.date.slice(0, 10),
        shouldShowOnSelectedDate,
        timezoneConversion: fixtureLocalDate !== fixture.fixture.date.slice(0, 10) ? 'YES' : 'NO'
      });

      return shouldShowOnSelectedDate;
    });
  }
}