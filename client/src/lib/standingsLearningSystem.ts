
// Comprehensive Standings Learning System
// Automatically learns and translates team names, league names, and standings data

import { smartTeamTranslation } from './smartTeamTranslation';
import { smartLeagueCountryTranslation } from './smartLeagueCountryTranslation';

interface StandingsData {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    standings: any[][];
  };
}

interface LearningStats {
  teamsLearned: number;
  leaguesLearned: number;
  countriesLearned: number;
  totalProcessed: number;
}

class StandingsLearningSystem {
  private learningStats: LearningStats = {
    teamsLearned: 0,
    leaguesLearned: 0,
    countriesLearned: 0,
    totalProcessed: 0
  };

  /**
   * Process standings data and auto-learn all translations
   */
  processStandingsData(standingsData: StandingsData): LearningStats {
    console.log('🧠 [LearningSystem] Processing standings data for auto-learning...');
    
    // Reset stats
    this.learningStats = {
      teamsLearned: 0,
      leaguesLearned: 0,
      countriesLearned: 0,
      totalProcessed: 0
    };

    // Learn league and country information
    this.learnLeagueAndCountry(standingsData.league);

    // Process all teams in standings
    this.processAllTeams(standingsData.league.standings);

    // Log results
    console.log('📊 [LearningSystem] Learning complete:', this.learningStats);
    
    return { ...this.learningStats };
  }

  /**
   * Learn league and country translations
   */
  private learnLeagueAndCountry(league: any): void {
    if (league.name) {
      smartLeagueCountryTranslation.autoLearnFromLeagueData(league.name, league.country);
      this.learningStats.leaguesLearned++;
    }

    if (league.country) {
      // Auto-learn country if not already known
      const countryTranslation = smartLeagueCountryTranslation.translateCountryName(league.country, 'zh-hk');
      if (countryTranslation === league.country) {
        // Country needs learning
        this.learningStats.countriesLearned++;
      }
    }
  }

  /**
   * Process all teams from standings
   */
  private processAllTeams(standings: any[][]): void {
    const allTeams: any[] = [];

    // Handle both group-based and single league format
    if (Array.isArray(standings[0])) {
      // Group-based standings (like World Cup qualifications)
      standings.forEach(group => {
        allTeams.push(...group);
      });
    } else {
      // Single league standings
      allTeams.push(...standings);
    }

    // Learn from each team
    allTeams.forEach(standing => {
      if (standing?.team?.name) {
        this.learnTeamTranslation(standing.team.name);
        this.learningStats.totalProcessed++;
      }
    });
  }

  /**
   * Learn individual team translation
   */
  private learnTeamTranslation(teamName: string): void {
    const trimmedName = teamName.trim();
    
    // Check if team already has translation
    const existingTranslation = smartTeamTranslation.getPopularTeamTranslation(trimmedName, 'zh-hk');
    
    if (!existingTranslation || existingTranslation === trimmedName) {
      // Team needs learning
      smartTeamTranslation.autoLearnFromStandingsData([{ team: { name: trimmedName } }]);
      this.learningStats.teamsLearned++;
    }
  }

  /**
   * Batch process multiple leagues standings
   */
  async batchProcessLeagues(leagueIds: number[]): Promise<LearningStats> {
    console.log(`🚀 [LearningSystem] Batch processing ${leagueIds.length} leagues...`);
    
    const totalStats: LearningStats = {
      teamsLearned: 0,
      leaguesLearned: 0,
      countriesLearned: 0,
      totalProcessed: 0
    };

    for (const leagueId of leagueIds) {
      try {
        const response = await fetch(`/api/leagues/${leagueId}/standings`);
        if (response.ok) {
          const standingsData = await response.json();
          const stats = this.processStandingsData(standingsData);
          
          // Accumulate stats
          totalStats.teamsLearned += stats.teamsLearned;
          totalStats.leaguesLearned += stats.leaguesLearned;
          totalStats.countriesLearned += stats.countriesLearned;
          totalStats.totalProcessed += stats.totalProcessed;
        }
      } catch (error) {
        console.warn(`⚠️ [LearningSystem] Failed to process league ${leagueId}:`, error);
      }

      // Small delay to be API-friendly
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ [LearningSystem] Batch processing complete:', totalStats);
    return totalStats;
  }

  /**
   * Auto-learn from all major leagues
   */
  async learnFromMajorLeagues(): Promise<LearningStats> {
    const majorLeagueIds = [
      38, 15, 2, 4, 10, 11, 848, 886, 1022, 772, 71, 3, 5, 531, 22, 
      72, 73, 75, 76, 233, 667, 940, 908, 1169, 23, 1077, 253, 850, 
      893, 921, 130, 128, 493, 239, 265, 237, 235, 743
    ];

    return this.batchProcessLeagues(majorLeagueIds);
  }

  /**
   * Get current learning statistics
   */
  getStats(): LearningStats {
    return { ...this.learningStats };
  }

  /**
   * Export learned data for backup
   */
  exportLearnedData(): any {
    return {
      teams: smartTeamTranslation.exportAllMappings?.() || {},
      leagues: smartLeagueCountryTranslation.exportAllMappings?.() || {},
      timestamp: new Date().toISOString(),
      stats: this.learningStats
    };
  }

  /**
   * Import learned data from backup
   */
  importLearnedData(data: any): void {
    try {
      if (data.teams && smartTeamTranslation.importMappings) {
        smartTeamTranslation.importMappings(data.teams);
      }
      if (data.leagues && smartLeagueCountryTranslation.importMappings) {
        smartLeagueCountryTranslation.importMappings(data.leagues);
      }
      console.log('📥 [LearningSystem] Successfully imported learned data');
    } catch (error) {
      console.error('❌ [LearningSystem] Failed to import data:', error);
    }
  }
}

// Export singleton instance
export const standingsLearningSystem = new StandingsLearningSystem();

// Console helper functions for manual learning
if (typeof window !== 'undefined') {
  (window as any).learnFromAllStandings = () => standingsLearningSystem.learnFromMajorLeagues();
  (window as any).exportLearnedStandings = () => standingsLearningSystem.exportLearnedData();
  (window as any).getLearnedStats = () => standingsLearningSystem.getStats();
}

export type { StandingsData, LearningStats };
