
/**
 * Comprehensive Auto-Learning Service
 * Automatically learns team names, league names, and country names from fixture data
 * Provides intelligent translations without manual intervention
 */

import { smartTeamTranslation } from './smartTeamTranslation';
import { smartLeagueCountryTranslation } from './smartLeagueCountryTranslation';
import { smartCountryTranslation } from './countryNameMapping';

interface LearningStats {
  teamsLearned: number;
  leaguesLearned: number;
  countriesLearned: number;
  lastUpdate: string;
}

class AutoLearningService {
  private learningQueue: any[] = [];
  private isProcessing = false;
  private stats: LearningStats = {
    teamsLearned: 0,
    leaguesLearned: 0,
    countriesLearned: 0,
    lastUpdate: new Date().toISOString()
  };

  constructor() {
    this.loadStats();
    this.startBackgroundProcessing();
  }

  // Add fixtures to learning queue
  addFixturesToQueue(fixtures: any[]): void {
    if (!fixtures || fixtures.length === 0) return;

    const validFixtures = fixtures.filter(fixture => 
      fixture?.teams?.home?.name && 
      fixture?.teams?.away?.name && 
      fixture?.league?.name
    );

    this.learningQueue.push(...validFixtures);
    console.log(`📚 [Auto-Learning] Added ${validFixtures.length} fixtures to learning queue (total: ${this.learningQueue.length})`);

    // Process immediately if queue is large
    if (this.learningQueue.length > 50 && !this.isProcessing) {
      this.processLearningQueue();
    }
  }

  // Process learning queue in background
  private async processLearningQueue(): Promise<void> {
    if (this.isProcessing || this.learningQueue.length === 0) return;

    this.isProcessing = true;
    const batchSize = Math.min(100, this.learningQueue.length);
    const batch = this.learningQueue.splice(0, batchSize);

    try {
      console.log(`🔄 [Auto-Learning] Processing batch of ${batch.length} fixtures`);

      const startStats = { ...this.stats };

      // Learn team names
      const teamsBefore = smartTeamTranslation.getTranslationStats().learnedTeams;
      smartTeamTranslation.learnFromFixtures(batch);
      const teamsAfter = smartTeamTranslation.getTranslationStats().learnedTeams;
      const newTeams = teamsAfter - teamsBefore;

      // Learn league and country names
      const leaguesBefore = smartLeagueCountryTranslation.getTranslationStats().learnedLeagues;
      smartLeagueCountryTranslation.learnFromFixtures(batch);
      const leaguesAfter = smartLeagueCountryTranslation.getTranslationStats().learnedLeagues;
      const newLeagues = leaguesAfter - leaguesBefore;

      // Learn country mappings
      smartCountryTranslation.learnCountriesFromFixtures(batch);

      // Update stats
      this.stats.teamsLearned += newTeams;
      this.stats.leaguesLearned += newLeagues;
      this.stats.countriesLearned += 0; // smartCountryTranslation doesn't expose stats yet
      this.stats.lastUpdate = new Date().toISOString();

      this.saveStats();

      if (newTeams > 0 || newLeagues > 0) {
        console.log(`✅ [Auto-Learning] Batch complete: +${newTeams} teams, +${newLeagues} leagues`);
      }

      // Auto-generate comprehensive mappings for major leagues
      await this.generateComprehensiveMappings(batch);

    } catch (error) {
      console.error('❌ [Auto-Learning] Error processing batch:', error);
    } finally {
      this.isProcessing = false;

      // Continue processing if queue still has items
      if (this.learningQueue.length > 0) {
        setTimeout(() => this.processLearningQueue(), 1000);
      }
    }
  }

  // Generate comprehensive mappings for major leagues found in fixtures
  private async generateComprehensiveMappings(fixtures: any[]): Promise<void> {
    const majorLeagues = new Set<number>();

    fixtures.forEach(fixture => {
      const leagueId = fixture.league?.id;
      if (leagueId && this.isMajorLeague(leagueId)) {
        majorLeagues.add(leagueId);
      }
    });

    if (majorLeagues.size > 0) {
      try {
        const { generateAutomatedTeamMappingForLeagues } = await import('./generateCompleteTeamMapping');
        const leagueIds = Array.from(majorLeagues);
        
        console.log(`🗺️ [Auto-Learning] Generating comprehensive mappings for major leagues: ${leagueIds.join(', ')}`);
        
        // Run in background without blocking
        generateAutomatedTeamMappingForLeagues(leagueIds).catch(error => {
          console.warn('⚠️ [Auto-Learning] Comprehensive mapping generation failed:', error);
        });
      } catch (error) {
        console.warn('⚠️ [Auto-Learning] Could not load comprehensive mapping generator:', error);
      }
    }
  }

  // Check if league is considered major (high priority for comprehensive mapping)
  private isMajorLeague(leagueId: number): boolean {
    const majorLeagues = [
      // UEFA Competitions
      2, 3, 848, 15, 5, 8, 16,
      // Top European Leagues
      39, 140, 135, 78, 61, 94, 88, 179, 218,
      // Major International Competitions
      22, 9, 13, 4, 21, 914,
      // European Second Tier
      144, 103, 106, 119, 113, 203,
      // Major American Leagues
      253, 71, 72, 73, 128, 274,
      // Major South American Leagues
      325, 265, 267, 268, 269, 270,
      // Major Asian Leagues
      292, 301, 188, 169, 271, 294
    ];

    return majorLeagues.includes(leagueId);
  }

  // Start background processing with periodic intervals
  private startBackgroundProcessing(): void {
    // Process queue every 30 seconds
    setInterval(() => {
      if (this.learningQueue.length > 0) {
        this.processLearningQueue();
      }
    }, 30000);

    // Generate comprehensive stats every 5 minutes
    setInterval(() => {
      this.generateLearningReport();
    }, 300000);
  }

  // Generate learning report
  private generateLearningReport(): void {
    const teamStats = smartTeamTranslation.getTranslationStats();
    const leagueStats = smartLeagueCountryTranslation.getTranslationStats();

    console.log(`📊 [Auto-Learning Report] Total learned: Teams=${teamStats.learnedTeams}, Leagues=${leagueStats.learnedLeagues}, Countries=${leagueStats.learnedCountries}`);
  }

  // Load stats from localStorage
  private loadStats(): void {
    try {
      const stored = localStorage.getItem('autoLearningStats');
      if (stored) {
        this.stats = { ...this.stats, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('⚠️ [Auto-Learning] Failed to load stats:', error);
    }
  }

  // Save stats to localStorage
  private saveStats(): void {
    try {
      localStorage.setItem('autoLearningStats', JSON.stringify(this.stats));
    } catch (error) {
      console.warn('⚠️ [Auto-Learning] Failed to save stats:', error);
    }
  }

  // Get current learning statistics
  getStats(): LearningStats {
    return { ...this.stats };
  }

  // Force process all queued items immediately
  async forceProcess(): Promise<void> {
    console.log(`🚀 [Auto-Learning] Force processing ${this.learningQueue.length} queued fixtures`);
    while (this.learningQueue.length > 0 && !this.isProcessing) {
      await this.processLearningQueue();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Export all learned mappings
  exportLearnedMappings(): any {
    return {
      teams: smartTeamTranslation.exportAllMappings(),
      leagues: smartLeagueCountryTranslation.exportAllMappings(),
      stats: this.getStats(),
      exportDate: new Date().toISOString()
    };
  }

  // Import mappings from external source
  importMappings(mappings: any): void {
    try {
      if (mappings.teams) {
        smartTeamTranslation.importMappings(mappings.teams);
      }
      if (mappings.leagues) {
        smartLeagueCountryTranslation.importMappings(mappings.leagues);
      }
      console.log('✅ [Auto-Learning] Successfully imported external mappings');
    } catch (error) {
      console.error('❌ [Auto-Learning] Failed to import mappings:', error);
    }
  }
}

// Create singleton instance
export const autoLearningService = new AutoLearningService();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).autoLearningService = autoLearningService;
}
