
/**
 * Auto Learning Trigger
 * Automatically improves translations based on user interactions and data patterns
 */

import { smartTeamTranslation } from './smartTeamTranslation';
import { smartLeagueCountryTranslation } from './smartLeagueCountryTranslation';
import { standingsLearningSystem } from './standingsLearningSystem';

class AutoLearningTrigger {
  private learningQueue = new Set<string>();
  private isProcessing = false;
  private lastLearningTime = 0;
  private readonly LEARNING_INTERVAL = 30000; // 30 seconds

  constructor() {
    // Start auto-learning process
    this.startAutoLearning();
  }

  /**
   * Add team to learning queue
   */
  queueTeamForLearning(teamName: string, context?: any): void {
    if (teamName && teamName.trim().length > 0) {
      this.learningQueue.add(teamName.trim());
      console.log(`📝 [AutoLearning] Queued "${teamName}" for learning`);
    }
  }

  /**
   * Process learning queue
   */
  private async processLearningQueue(): Promise<void> {
    if (this.isProcessing || this.learningQueue.size === 0) return;

    this.isProcessing = true;
    const now = Date.now();

    try {
      console.log(`🔄 [AutoLearning] Processing ${this.learningQueue.size} teams for learning...`);

      const teamsToLearn = Array.from(this.learningQueue);
      this.learningQueue.clear();

      // Create mock standings data for learning
      const mockStandings = teamsToLearn.map(teamName => ({
        team: { name: teamName }
      }));

      // Trigger learning
      smartTeamTranslation.autoLearnFromStandingsData(mockStandings);

      // Update learning time
      this.lastLearningTime = now;

      console.log(`✅ [AutoLearning] Processed ${teamsToLearn.length} teams successfully`);
    } catch (error) {
      console.error('❌ [AutoLearning] Failed to process learning queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Start automatic learning process
   */
  private startAutoLearning(): void {
    setInterval(() => {
      this.processLearningQueue();
    }, this.LEARNING_INTERVAL);

    console.log('🚀 [AutoLearning] Auto-learning system started');
  }

  /**
   * Learn from page interactions
   */
  learnFromPageInteraction(data: any): void {
    if (data?.teams) {
      // Learn from fixture data
      const teams = Array.isArray(data.teams) ? data.teams : [data.teams.home, data.teams.away].filter(Boolean);
      teams.forEach((team: any) => {
        if (team?.name) {
          this.queueTeamForLearning(team.name);
        }
      });
    }

    if (data?.league?.name) {
      // Learn league translations
      smartLeagueCountryTranslation.autoLearnFromLeagueData(data.league.name, data.league.country);
    }
  }

  /**
   * Get learning statistics
   */
  getStats() {
    return {
      queueSize: this.learningQueue.size,
      isProcessing: this.isProcessing,
      lastLearningTime: this.lastLearningTime,
      teamStats: smartTeamTranslation.getTranslationStats(),
      leagueStats: smartLeagueCountryTranslation.getTranslationStats()
    };
  }
}

// Export singleton instance
export const autoLearningTrigger = new AutoLearningTrigger();

// Make available in console for debugging
if (typeof window !== 'undefined') {
  (window as any).autoLearningTrigger = autoLearningTrigger;
  (window as any).learningStats = () => autoLearningTrigger.getStats();
}
