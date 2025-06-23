
import { apiRequest } from './queryClient';
import { format, parseISO, isValid } from 'date-fns';

interface Scores365StyleMatch {
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
  goals?: {
    home: number | null;
    away: number | null;
  };
}

export class Scores365StyleFetcher {
  /**
   * Fetch matches in 365scores.com style - focus on major competitions
   */
  static async fetchMajorGamesOnly(date: string, timezone: string = 'UTC'): Promise<{
    matches: Scores365StyleMatch[];
    summary: {
      totalMatches: number;
      majorLeagues: Record<number, number>;
      timezoneInfo: {
        requested: string;
        actual: string;
      };
      debugInfo: any[];
    };
  }> {
    console.log(`🏆 [365scores Style] Fetching major games for ${date} in ${timezone}`);
    
    // Major league IDs similar to 365scores prioritization
    const majorLeagueIds = [
      // Top European competitions
      2,    // UEFA Champions League
      3,    // UEFA Europa League
      848,  // UEFA Conference League
      
      // Top domestic leagues
      39,   // Premier League
      140,  // La Liga
      135,  // Serie A
      78,   // Bundesliga
      61,   // Ligue 1
      
      // International competitions
      4,    // Euro Championship
      1,    // World Cup
      15,   // FIFA Club World Cup
      38,   // UEFA U21 Championship
      
      // Other major leagues
      144,  // Eredivisie
      203,  // Primeira Liga
      218,  // Liga MX
      71,   // Serie A Brazil
      128,  // Primera División Argentina
    ];

    try {
      // Fetch all fixtures for the date
      const response = await apiRequest('GET', `/api/fixtures/date/${date}?all=true`);
      const allFixtures = await response.json();
      
      console.log(`📊 [365scores Style] Got ${allFixtures.length} total fixtures`);
      
      // Filter for major leagues only (365scores style)
      const majorMatches = allFixtures.filter((fixture: Scores365StyleMatch) => 
        majorLeagueIds.includes(fixture.league?.id)
      );
      
      console.log(`🎯 [365scores Style] Found ${majorMatches.length} major league matches`);
      
      // Count by league
      const majorLeagues: Record<number, number> = {};
      const debugInfo: any[] = [];
      
      majorMatches.forEach(match => {
        const leagueId = match.league.id;
        majorLeagues[leagueId] = (majorLeagues[leagueId] || 0) + 1;
        
        const fixtureDate = parseISO(match.fixture.date);
        const localDate = isValid(fixtureDate) ? format(fixtureDate, 'yyyy-MM-dd') : 'Invalid';
        const localTime = isValid(fixtureDate) ? format(fixtureDate, 'HH:mm') : 'Invalid';
        
        debugInfo.push({
          leagueId: match.league.id,
          leagueName: match.league.name,
          fixtureId: match.fixture.id,
          utcDateTime: match.fixture.date,
          localDate,
          localTime,
          homeTeam: match.teams.home.name,
          awayTeam: match.teams.away.name,
          status: match.fixture.status.short,
          country: match.league.country,
          homeGoals: match.goals?.home,
          awayGoals: match.goals?.away
        });
      });
      
      // Sort by league priority (like 365scores does)
      majorMatches.sort((a, b) => {
        const aPriority = majorLeagueIds.indexOf(a.league.id);
        const bPriority = majorLeagueIds.indexOf(b.league.id);
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // Then by match time
        return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
      });
      
      console.log(`📋 [365scores Style] Summary:`, {
        totalMatches: majorMatches.length,
        majorLeagues,
        topLeagues: Object.entries(majorLeagues)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([id, count]) => ({ leagueId: id, matches: count }))
      });
      
      return {
        matches: majorMatches,
        summary: {
          totalMatches: majorMatches.length,
          majorLeagues,
          timezoneInfo: {
            requested: timezone,
            actual: 'UTC' // Our API returns UTC
          },
          debugInfo
        }
      };
      
    } catch (error) {
      console.error(`❌ [365scores Style] Error fetching major games:`, error);
      throw error;
    }
  }
  
  /**
   * Compare our data with 365scores-style filtering
   */
  static async compareWithTargetLeagues(date: string): Promise<{
    majorGames: Scores365StyleMatch[];
    targetLeagues: Scores365StyleMatch[];
    comparison: {
      majorGamesCount: number;
      targetLeaguesCount: number;
      overlap: number;
      uniqueToMajor: number;
      uniqueToTarget: number;
    };
  }> {
    console.log(`🔍 [365scores Style] Comparing major games vs target leagues for ${date}`);
    
    // Get both datasets
    const majorGamesResult = await this.fetchMajorGamesOnly(date);
    
    // Import and use SimpleFetchingLeagues for comparison
    const { SimpleFetchingLeagues } = await import('./simpleFetchingLeagues');
    const targetResult = await SimpleFetchingLeagues.fetchMultiDateFixtures(date);
    
    const majorGames = majorGamesResult.matches;
    const targetLeagues = targetResult.fixtures;
    
    // Find overlaps
    const majorIds = new Set(majorGames.map(m => m.fixture.id));
    const targetIds = new Set(targetLeagues.map(m => m.fixture.id));
    
    const overlap = [...majorIds].filter(id => targetIds.has(id)).length;
    const uniqueToMajor = majorGames.filter(m => !targetIds.has(m.fixture.id)).length;
    const uniqueToTarget = targetLeagues.filter(m => !majorIds.has(m.fixture.id)).length;
    
    console.log(`📊 [365scores Style] Comparison results:`, {
      majorGamesCount: majorGames.length,
      targetLeaguesCount: targetLeagues.length,
      overlap,
      uniqueToMajor,
      uniqueToTarget
    });
    
    return {
      majorGames,
      targetLeagues,
      comparison: {
        majorGamesCount: majorGames.length,
        targetLeaguesCount: targetLeagues.length,
        overlap,
        uniqueToMajor,
        uniqueToTarget
      }
    };
  }
  
  /**
   * Debug function to analyze timezone discrepancies
   */
  static async debugTimezoneIssues(date: string): Promise<void> {
    console.log(`🌐 [365scores Style] Debugging timezone issues for ${date}`);
    
    const result = await this.fetchMajorGamesOnly(date, 'Asia/Manila');
    
    // Analyze matches that might be affected by timezone
    const timezoneIssues = result.summary.debugInfo.filter(match => {
      const expectedDate = date;
      const actualDate = match.localDate;
      return expectedDate !== actualDate;
    });
    
    console.log(`⏰ [365scores Style] Timezone analysis:`, {
      totalMatches: result.summary.totalMatches,
      correctDate: result.summary.debugInfo.length - timezoneIssues.length,
      wrongDate: timezoneIssues.length,
      issues: timezoneIssues.map(issue => ({
        league: issue.leagueName,
        teams: `${issue.homeTeam} vs ${issue.awayTeam}`,
        expectedDate: date,
        actualDate: issue.localDate,
        utcTime: issue.utcDateTime
      }))
    });
  }
}

// Export convenience functions
export const fetchMajorGamesOnly = Scores365StyleFetcher.fetchMajorGamesOnly;
export const compareWithTargetLeagues = Scores365StyleFetcher.compareWithTargetLeagues;
export const debugTimezoneIssues = Scores365StyleFetcher.debugTimezoneIssues;
