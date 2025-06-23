import { apiRequest } from './queryClient';
import { format, addDays, subDays, parseISO, isValid } from 'date-fns';

// Specific leagues we want to check (UEFA U21 and FIFA Club World Cup)
const TARGET_LEAGUES = [38, 15];

interface LeagueFixture {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
    };
    away: {
      id: number;
      name: string;
    };
  };
}

export class SimpleFetchingLeagues {
  /**
   * Fetch fixtures for specific leagues across multiple dates to handle timezone issues
   */
  static async fetchMultiDateFixtures(baseDate: string): Promise<{
    fixtures: LeagueFixture[];
    summary: {
      totalFixtures: number;
      byLeague: Record<number, number>;
      byDate: Record<string, number>;
      debugInfo: any[];
    };
  }> {
    console.log(`🔍 [SimpleFetchingLeagues] Starting multi-date fetch for ${baseDate}`);

    // Create date range: yesterday, today, tomorrow
    const baseDateObj = new Date(baseDate);
    const yesterday = format(subDays(baseDateObj, 1), 'yyyy-MM-dd');
    const today = baseDate;
    const tomorrow = format(addDays(baseDateObj, 1), 'yyyy-MM-dd');

    const datesToCheck = [yesterday, today, tomorrow];
    console.log(`📅 [SimpleFetchingLeagues] Checking dates: ${datesToCheck.join(', ')}`);

    let allFixtures: LeagueFixture[] = [];
    const debugInfo: any[] = [];
    const byDate: Record<string, number> = {};
    const byLeague: Record<number, number> = {};

    // Fetch fixtures for each date
    for (const dateStr of datesToCheck) {
      try {
        console.log(`🌍 [SimpleFetchingLeagues] Fetching all fixtures for ${dateStr}...`);

        const response = await apiRequest('GET', `/api/fixtures/date/${dateStr}?all=true`);
        const fixtures = await response.json();

        console.log(`📊 [SimpleFetchingLeagues] Got ${fixtures.length} total fixtures for ${dateStr}`);

        // Filter for our target leagues
        const targetFixtures = fixtures.filter((fixture: LeagueFixture) => 
          TARGET_LEAGUES.includes(fixture.league?.id)
        );

        console.log(`🎯 [SimpleFetchingLeagues] Found ${targetFixtures.length} target league fixtures for ${dateStr}`);

        // Debug each target fixture
        targetFixtures.forEach((fixture: LeagueFixture) => {
          const fixtureDate = parseISO(fixture.fixture.date);
          const localDate = isValid(fixtureDate) ? format(fixtureDate, 'yyyy-MM-dd') : 'Invalid';
          const localTime = isValid(fixtureDate) ? format(fixtureDate, 'HH:mm') : 'Invalid';

          console.log(`🔧 [SimpleFetchingLeagues] League ${fixture.league.id} (${fixture.league.name}):`, {
            fixtureId: fixture.fixture.id,
            apiDate: dateStr,
            utcDateTime: fixture.fixture.date,
            localDate,
            localTime,
            homeTeam: fixture.teams.home.name,
            awayTeam: fixture.teams.away.name,
            status: fixture.fixture.status.short
          });

          debugInfo.push({
            leagueId: fixture.league.id,
            leagueName: fixture.league.name,
            fixtureId: fixture.fixture.id,
            requestedDate: dateStr,
            utcDateTime: fixture.fixture.date,
            localDate,
            localTime,
            homeTeam: fixture.teams.home.name,
            awayTeam: fixture.teams.away.name,
            status: fixture.fixture.status.short,
            country: fixture.league.country
          });
        });

        allFixtures = [...allFixtures, ...targetFixtures];
        byDate[dateStr] = targetFixtures.length;

      } catch (error) {
        console.error(`❌ [SimpleFetchingLeagues] Error fetching fixtures for ${dateStr}:`, error);
        byDate[dateStr] = 0;
      }
    }

    // Count by league
    allFixtures.forEach(fixture => {
      const leagueId = fixture.league.id;
      byLeague[leagueId] = (byLeague[leagueId] || 0) + 1;
    });

    // Remove duplicates based on fixture ID
    const uniqueFixtures = allFixtures.filter((fixture, index, self) => 
      index === self.findIndex(f => f.fixture.id === fixture.fixture.id)
    );

    console.log(`📋 [SimpleFetchingLeagues] Summary:`, {
      totalFound: allFixtures.length,
      uniqueFixtures: uniqueFixtures.length,
      byLeague,
      byDate
    });

    return {
      fixtures: uniqueFixtures,
      summary: {
        totalFixtures: uniqueFixtures.length,
        byLeague,
        byDate,
        debugInfo
      }
    };
  }

  /**
   * Get fixtures for today's date specifically, but check multiple API dates
   */
  static async getTodayFixtures(todayDate: string): Promise<{
    todayFixtures: LeagueFixture[];
    allFoundFixtures: LeagueFixture[];
    analysis: {
      correctDateMatches: number;
      wrongDateMatches: number;
      timezoneIssues: any[];
    };
  }> {
    const result = await this.fetchMultiDateFixtures(todayDate);

    const todayFixtures: LeagueFixture[] = [];
    const timezoneIssues: any[] = [];

    result.fixtures.forEach(fixture => {
      const fixtureDate = parseISO(fixture.fixture.date);
      if (isValid(fixtureDate)) {
        const fixtureLocalDate = format(fixtureDate, 'yyyy-MM-dd');

        if (fixtureLocalDate === todayDate) {
          todayFixtures.push(fixture);
        } else {
          timezoneIssues.push({
            fixtureId: fixture.fixture.id,
            leagueId: fixture.league.id,
            leagueName: fixture.league.name,
            expectedDate: todayDate,
            actualDate: fixtureLocalDate,
            utcDateTime: fixture.fixture.date,
            teams: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`
          });
        }
      }
    });

    console.log(`🎯 [SimpleFetchingLeagues] Today analysis for ${todayDate}:`, {
      correctDateMatches: todayFixtures.length,
      wrongDateMatches: timezoneIssues.length,
      timezoneIssues
    });

    return {
      todayFixtures,
      allFoundFixtures: result.fixtures,
      analysis: {
        correctDateMatches: todayFixtures.length,
        wrongDateMatches: timezoneIssues.length,
        timezoneIssues
      }
    };
  }

  /**
   * Debug function to check specific league availability
   */
  static async debugLeagueAvailability(leagueIds: number[] = TARGET_LEAGUES): Promise<void> {
    const today = format(new Date(), 'yyyy-MM-dd');
    console.log(`🔍 [SimpleFetchingLeagues] Debugging leagues ${leagueIds.join(', ')} for ${today}`);

    const result = await this.fetchMultiDateFixtures(today);

    leagueIds.forEach(leagueId => {
      const leagueFixtures = result.fixtures.filter(f => f.league.id === leagueId);
      console.log(`📊 League ${leagueId} analysis:`, {
        totalFound: leagueFixtures.length,
        fixtures: leagueFixtures.map(f => ({
          id: f.fixture.id,
          date: f.fixture.date,
          localDate: format(parseISO(f.fixture.date), 'yyyy-MM-dd HH:mm'),
          teams: `${f.teams.home.name} vs ${f.teams.away.name}`,
          status: f.fixture.status.short
        }))
      });
    });

    return;
  }

  async fetchFixturesForDate(selectedDate: string): Promise<LeagueFixture[]> {
    try {
      console.log(`🌍 [SimpleFetchingLeagues] Fetching all fixtures for ${selectedDate}...`);

      const response = await apiRequest('GET', `/api/fixtures/date/${selectedDate}?all=true`);
      const fixtures = await response.json();

      console.log(`📊 [SimpleFetchingLeagues] Got ${fixtures.length} total fixtures for ${selectedDate}`);
      return fixtures;
    } catch (error) {
      console.error(`❌ [SimpleFetchingLeagues] Error fetching fixtures for ${selectedDate}:`, error);
      return [];
    }
  }
}

// Export utility functions
export const fetchLeagueFixturesMultiDate = SimpleFetchingLeagues.fetchMultiDateFixtures;
export const getTodayLeagueFixtures = async (selectedDate: string) => {
  try {
    console.log(`🔍 [SimpleFetchingLeagues] Debugging leagues 38 and 15 for date: ${selectedDate}`);

    // Use the existing SimpleFetchingLeagues class to get fixtures
    const simpleFetcher = new SimpleFetchingLeagues();
    const fixtures = await simpleFetcher.fetchFixturesForDate(selectedDate);

    if (!fixtures || fixtures.length === 0) {
      console.warn(`⚠️ [SimpleFetchingLeagues] No fixtures found for date: ${selectedDate}`);
      return {
        todayFixtures: [],
        allFoundFixtures: [],
        analysis: {
          correctDateMatches: 0,
          wrongDateMatches: 0
        }
      };
    }

    console.log(`📊 [SimpleFetchingLeagues] Found ${fixtures.length} total fixtures for ${selectedDate}`);

    // Check specifically for leagues 38 and 15 with safe filtering
    const league38Fixtures = fixtures.filter(f => 
      f && f.league && f.league.id === 38
    ) || [];

    const league15Fixtures = fixtures.filter(f => 
      f && f.league && f.league.id === 15
    ) || [];

    console.log(`🎯 [SimpleFetchingLeagues] League 38 fixtures: ${league38Fixtures.length}`);
    console.log(`🏆 [SimpleFetchingLeagues] League 15 fixtures: ${league15Fixtures.length}`);

    const analysis = {
      correctDateMatches: league38Fixtures.length + league15Fixtures.length,
      wrongDateMatches: 0
    };

    return {
      todayFixtures: fixtures,
      allFoundFixtures: fixtures,
      analysis
    };

  } catch (error) {
    console.error(`❌ [SimpleFetchingLeagues] Error debugging target leagues:`, error);
    return {
      todayFixtures: [],
      allFoundFixtures: [],
      analysis: {
        correctDateMatches: 0,
        wrongDateMatches: 0
      }
    };
  }
};
export const debugTargetLeagues = SimpleFetchingLeagues.debugLeagueAvailability;