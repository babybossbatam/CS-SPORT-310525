import { rapidApiService } from './rapidApi';
import { format, addDays, subDays } from 'date-fns';

interface U21Match {
  fixture: {
    id: number;
    date: string;
    status: {
      long: string;
      short: string;
    };
    venue?: {
      name: string;
      city: string;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
    country: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
  };
}

class UefaU21ApiService {
  private readonly leagueId = 38; // UEFA U21 Championship
  private readonly qualificationLeagueId = 867; // UEFA European Under-21 Championship Qualification

  /**
   * Get UEFA U21 fixtures for a specific date range
   */
  async getU21FixturesForDateRange(startDate: string, endDate: string): Promise<U21Match[]> {
    try {
      console.log(`🏆 [UEFA U21] Fetching fixtures from ${startDate} to ${endDate}`);

      const allFixtures: U21Match[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Fetch fixtures for each date in the range
      for (let date = start; date <= end; date = addDays(date, 1)) {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dailyFixtures = await this.getU21FixturesForDate(dateStr);
        allFixtures.push(...dailyFixtures);
      }

      // Remove duplicates based on fixture ID
      const uniqueFixtures = allFixtures.filter((fixture, index, self) => 
        index === self.findIndex(f => f.fixture.id === fixture.fixture.id)
      );

      console.log(`🏆 [UEFA U21] Found ${uniqueFixtures.length} unique U21 fixtures`);
      return uniqueFixtures;

    } catch (error) {
      console.error('❌ [UEFA U21] Error fetching U21 fixtures for date range:', error);
      return [];
    }
  }

  /**
   * Get UEFA U21 fixtures for a specific date
   */
  async getU21FixturesForDate(date: string): Promise<U21Match[]> {
    try {
      console.log(`🏆 [UEFA U21] Fetching fixtures for date: ${date}`);

      // Get all fixtures for the date
      const allFixtures = await rapidApiService.getFixturesByDate(date, true);

      // Filter for UEFA U21 Championship and related youth matches
      const u21Fixtures = allFixtures.filter(fixture => {
        const leagueName = fixture.league.name.toLowerCase();
        const homeTeam = fixture.teams.home.name.toLowerCase();
        const awayTeam = fixture.teams.away.name.toLowerCase();

        // More flexible filtering - check for U21 in team names or specific league IDs
        return (
          fixture.league.id === this.leagueId ||
          fixture.league.id === this.qualificationLeagueId ||
          leagueName.includes('u21') ||
          leagueName.includes('under 21') ||
          leagueName.includes('under-21') ||
          (leagueName.includes('uefa') && (leagueName.includes('u21') || leagueName.includes('under'))) ||
          homeTeam.includes('u21') ||
          awayTeam.includes('u21') ||
          homeTeam.includes('under 21') ||
          awayTeam.includes('under 21')
        );
      });

      console.log(`🏆 [UEFA U21] Found ${u21Fixtures.length} U21 fixtures for ${date}`);

      return u21Fixtures as U21Match[];

    } catch (error) {
      console.error(`❌ [UEFA U21] Error fetching U21 fixtures for ${date}:`, error);
      return [];
    }
  }

  /**
   * Get current UEFA U21 season fixtures
   */
  async getCurrentSeasonU21Fixtures(): Promise<U21Match[]> {
    try {
      console.log(`🏆 [UEFA U21] Fetching current season fixtures`);

      // Try multiple years as U21 championships span across years
      const currentYear = new Date().getFullYear();
      const years = [currentYear - 1, currentYear, currentYear + 1];
      let allFixtures: U21Match[] = [];

      for (const year of years) {
        try {
          // Try both UEFA U21 Championship and Qualification
          const leagueIds = [this.leagueId, this.qualificationLeagueId];

          for (const leagueId of leagueIds) {
            try {
              const yearlyFixtures = await rapidApiService.getFixturesByLeague(leagueId, year);
              console.log(`🏆 [UEFA U21] Found ${yearlyFixtures.length} fixtures for league ${leagueId}, year ${year}`);
              allFixtures.push(...(yearlyFixtures as U21Match[]));
            } catch (error) {
              console.warn(`⚠️ [UEFA U21] Could not fetch fixtures for league ${leagueId}, year ${year}:`, error);
            }
          }
        } catch (error) {
          console.warn(`⚠️ [UEFA U21] Could not fetch fixtures for year ${year}:`, error);
        }
      }

      // Remove duplicates
      const uniqueFixtures = allFixtures.filter((fixture, index, self) => 
        index === self.findIndex(f => f.fixture.id === fixture.fixture.id)
      );

      console.log(`🏆 [UEFA U21] Found ${uniqueFixtures.length} total current season fixtures`);

      return uniqueFixtures;

    } catch (error) {
      console.error('❌ [UEFA U21] Error fetching current season fixtures:', error);
      return [];
    }
  }

  /**
   * Get upcoming UEFA U21 matches (next 30 days)
   */
  async getUpcomingU21Matches(): Promise<U21Match[]> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextMonth = format(addDays(new Date(), 30), 'yyyy-MM-dd');

      console.log(`🏆 [UEFA U21] Searching upcoming matches from ${today} to ${nextMonth}`);

      const upcomingMatches = await this.getU21FixturesForDateRange(today, nextMonth);

      // If no matches found via date range, try getting current season fixtures and filter upcoming
      if (upcomingMatches.length === 0) {
        const seasonFixtures = await this.getCurrentSeasonU21Fixtures();
        const now = new Date();
        const futureMatches = seasonFixtures.filter(match => new Date(match.fixture.date) > now);
        console.log(`🏆 [UEFA U21] Found ${futureMatches.length} upcoming matches from season fixtures`);
        return futureMatches;
      }

      return upcomingMatches;

    } catch (error) {
      console.error('❌ [UEFA U21] Error fetching upcoming matches:', error);
      return [];
    }
  }

  /**
   * Get recent UEFA U21 matches (past 30 days)
   */
  async getRecentU21Matches(): Promise<U21Match[]> {
    try {
      const lastMonth = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      console.log(`🏆 [UEFA U21] Searching recent matches from ${lastMonth} to ${today}`);

      const recentMatches = await this.getU21FixturesForDateRange(lastMonth, today);

      // If no matches found via date range, try getting current season fixtures and filter recent
      if (recentMatches.length === 0) {
        const seasonFixtures = await this.getCurrentSeasonU21Fixtures();
        const now = new Date();
        const pastMatches = seasonFixtures.filter(match => new Date(match.fixture.date) <= now);
        console.log(`🏆 [UEFA U21] Found ${pastMatches.length} recent matches from season fixtures`);
        return pastMatches;
      }

      return recentMatches;

    } catch (error) {
      console.error('❌ [UEFA U21] Error fetching recent matches:', error);
      return [];
    }
  }

  /**
   * Search for specific U21 matches by team names
   */
  async searchU21MatchesByTeams(homeTeam: string, awayTeam: string): Promise<U21Match[]> {
    try {
      console.log(`🔍 [UEFA U21] Searching for: ${homeTeam} vs ${awayTeam}`);

      // Get a wider date range to find the match
      const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const endDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');

      const allFixtures = await this.getU21FixturesForDateRange(startDate, endDate);

      const matchingFixtures = allFixtures.filter(fixture => {
        const home = fixture.teams.home.name.toLowerCase();
        const away = fixture.teams.away.name.toLowerCase();
        const searchHome = homeTeam.toLowerCase().replace(' u21', '');
        const searchAway = awayTeam.toLowerCase().replace(' u21', '');

        return (
          (home.includes(searchHome) && away.includes(searchAway)) ||
          (home.includes(searchAway) && away.includes(searchHome))
        );
      });

      console.log(`🔍 [UEFA U21] Found ${matchingFixtures.length} matching fixtures`);
      return matchingFixtures;

    } catch (error) {
      console.error('❌ [UEFA U21] Error searching for specific matches:', error);
      return [];
    }
  }

  /**
   * Get live UEFA U21 matches
   */
  async getLiveU21Matches(): Promise<U21Match[]> {
    try {
      console.log(`🔴 [UEFA U21] Fetching live U21 matches`);

      const liveFixtures = await rapidApiService.getLiveFixtures();

      const liveU21Fixtures = liveFixtures.filter(fixture => {
        const leagueName = fixture.league.name.toLowerCase();
        const homeTeam = fixture.teams.home.name.toLowerCase();
        const awayTeam = fixture.teams.away.name.toLowerCase();

        return (
          fixture.league.id === this.leagueId ||
          fixture.league.id === this.qualificationLeagueId ||
          leagueName.includes('u21') ||
          homeTeam.includes('u21') ||
          awayTeam.includes('u21')
        );
      });

      console.log(`🔴 [UEFA U21] Found ${liveU21Fixtures.length} live U21 matches`);

      return liveU21Fixtures as U21Match[];

    } catch (error) {
      console.error('❌ [UEFA U21] Error fetching live matches:', error);
      return [];
    }
  }

  /**
   * Get real UEFA U21 matches from multiple leagues and competitions
   */
  async getRealU21Matches(): Promise<U21Match[]> {
    try {
      console.log(`🔍 [UEFA U21] Fetching real-time U21 matches from API...`);

      // Try multiple approaches to find U21 matches
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextMonth = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      const lastMonth = format(subDays(new Date(), 30), 'yyyy-MM-dd');

      let allMatches: U21Match[] = [];

      // 1. Try UEFA U21 Championship (league ID 38) - most important
      try {
        const currentYear = new Date().getFullYear();
        const uefaMatches = await rapidApiService.getFixturesByLeague(this.leagueId, currentYear);
        if (uefaMatches.length > 0) {
          console.log(`✅ [UEFA U21] Found ${uefaMatches.length} UEFA Championship matches`);
          allMatches.push(...(uefaMatches as U21Match[]));
        }
      } catch (error) {
        console.warn(`⚠️ [UEFA U21] Could not fetch UEFA Championship matches:`, error);
      }

      // 2. Try UEFA U21 Qualification (league ID 867)
      try {
        const currentYear = new Date().getFullYear();
        const qualificationMatches = await rapidApiService.getFixturesByLeague(this.qualificationLeagueId, currentYear);
        if (qualificationMatches.length > 0) {
          console.log(`✅ [UEFA U21] Found ${qualificationMatches.length} UEFA U21 Qualification matches`);
          allMatches.push(...(qualificationMatches as U21Match[]));
        }
      } catch (error) {
        console.warn(`⚠️ [UEFA U21] Could not fetch UEFA U21 Qualification matches:`, error);
      }

      // 3. Search by date range for any U21 matches in fixtures
      const dateRange = [lastMonth, today, nextMonth];
      for (const date of dateRange) {
        try {
          const dailyMatches = await this.getU21FixturesForDate(date);
          if (dailyMatches.length > 0) {
            console.log(`✅ [UEFA U21] Found ${dailyMatches.length} U21 matches for ${date}`);
            allMatches.push(...dailyMatches);
          }
        } catch (error) {
          console.warn(`⚠️ [UEFA U21] Could not fetch matches for ${date}:`, error);
        }
      }

      // Remove duplicates
      const uniqueMatches = allMatches.filter((match, index, self) => 
        index === self.findIndex(m => m.fixture.id === match.fixture.id)
      );

      // Sort by date
      const sortedMatches = uniqueMatches.sort((a, b) => 
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
      );

      console.log(`🎯 [UEFA U21] Found ${sortedMatches.length} total real U21 matches`);

      return sortedMatches;

    } catch (error) {
      console.error('❌ [UEFA U21] Error fetching real U21 matches:', error);
      return [];
    }
  }
}

export const uefaU21ApiService = new UefaU21ApiService();
export type { U21Match };