
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
        
        return (
          fixture.league.id === this.leagueId ||
          leagueName.includes('u21') ||
          leagueName.includes('under 21') ||
          leagueName.includes('uefa u21') ||
          leagueName.includes('european u21') ||
          homeTeam.includes('u21') ||
          awayTeam.includes('u21')
        ) && (
          leagueName.includes('uefa') ||
          leagueName.includes('euro') ||
          leagueName.includes('championship') ||
          fixture.league.id === this.leagueId
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
          const yearlyFixtures = await rapidApiService.getFixturesByLeague(this.leagueId, year);
          console.log(`🏆 [UEFA U21] Found ${yearlyFixtures.length} fixtures for year ${year}`);
          allFixtures.push(...(yearlyFixtures as U21Match[]));
        } catch (error) {
          console.warn(`⚠️ [UEFA U21] Could not fetch fixtures for year ${year}`);
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
   * Get upcoming UEFA U21 matches (next 7 days)
   */
  async getUpcomingU21Matches(): Promise<U21Match[]> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      
      return this.getU21FixturesForDateRange(today, nextWeek);
      
    } catch (error) {
      console.error('❌ [UEFA U21] Error fetching upcoming matches:', error);
      return [];
    }
  }
  
  /**
   * Get recent UEFA U21 matches (past 7 days)
   */
  async getRecentU21Matches(): Promise<U21Match[]> {
    try {
      const lastWeek = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');
      
      return this.getU21FixturesForDateRange(lastWeek, today);
      
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
   * Get sample UEFA U21 matches from known teams
   */
  async getSampleU21Matches(): Promise<U21Match[]> {
    try {
      console.log(`🎯 [UEFA U21] Fetching sample U21 matches from known teams`);
      
      const knownU21Teams = [
        'Spain U21', 'Romania U21', 'France U21', 'Georgia U21',
        'Portugal U21', 'Poland U21', 'Slovakia U21', 'Italy U21',
        'Germany U21', 'England U21', 'Netherlands U21', 'Ukraine U21'
      ];
      
      let allMatches: U21Match[] = [];
      
      // Search in a wider date range
      const startDate = format(subDays(new Date(), 60), 'yyyy-MM-dd');
      const endDate = format(addDays(new Date(), 60), 'yyyy-MM-dd');
      
      const allFixtures = await this.getU21FixturesForDateRange(startDate, endDate);
      
      // Filter for matches with known U21 teams
      const sampleMatches = allFixtures.filter(fixture => {
        const homeTeam = fixture.teams.home.name;
        const awayTeam = fixture.teams.away.name;
        
        return knownU21Teams.some(team => 
          homeTeam.includes(team.replace(' U21', '')) || 
          awayTeam.includes(team.replace(' U21', ''))
        );
      });
      
      console.log(`🎯 [UEFA U21] Found ${sampleMatches.length} sample U21 matches`);
      
      return sampleMatches;
      
    } catch (error) {
      console.error('❌ [UEFA U21] Error fetching sample matches:', error);
      return [];
    }
  }
}

export const uefaU21ApiService = new UefaU21ApiService();
export type { U21Match };
