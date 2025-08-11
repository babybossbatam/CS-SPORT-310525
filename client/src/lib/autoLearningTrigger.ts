
/**
 * Auto Learning Trigger System
 * Automatically learns team translations from standings and fixtures data
 */

import { smartTeamTranslation } from './smartTeamTranslation';
import { smartLeagueCountryTranslation } from './smartLeagueCountryTranslation';

/**
 * Automatically trigger learning when new data is loaded
 */
export class AutoLearningTrigger {
  private static instance: AutoLearningTrigger;
  private learningQueue: Set<string> = new Set();
  private isProcessing = false;

  private constructor() {
    // Auto-trigger learning every 5 minutes
    setInterval(() => {
      this.processPendingLearning();
    }, 5 * 60 * 1000);
  }

  static getInstance(): AutoLearningTrigger {
    if (!AutoLearningTrigger.instance) {
      AutoLearningTrigger.instance = new AutoLearningTrigger();
    }
    return AutoLearningTrigger.instance;
  }

  /**
   * Add team for learning
   */
  addTeamForLearning(teamName: string): void {
    if (teamName && teamName.length > 2) {
      this.learningQueue.add(teamName);
      console.log(`🎓 [AutoLearning] Queued team for learning: ${teamName}`);
    }
  }

  /**
   * Add league for learning
   */
  addLeagueForLearning(leagueName: string, countryName?: string): void {
    if (leagueName && leagueName.length > 2) {
      smartLeagueCountryTranslation.autoLearnFromLeagueData(leagueName, countryName);
      console.log(`🎓 [AutoLearning] Learning league: ${leagueName} (${countryName})`);
    }
  }

  /**
   * Process all pending learning
   */
  private async processPendingLearning(): Promise<void> {
    if (this.isProcessing || this.learningQueue.size === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🚀 [AutoLearning] Processing ${this.learningQueue.size} pending items...`);

    try {
      // Convert to array for processing
      const teamsToLearn = Array.from(this.learningQueue);
      
      // Learn from team patterns
      for (const teamName of teamsToLearn) {
        this.learnTeamPatterns(teamName);
      }

      // Clear processed items
      this.learningQueue.clear();
      
      console.log(`✅ [AutoLearning] Completed learning for ${teamsToLearn.length} teams`);
    } catch (error) {
      console.error('❌ [AutoLearning] Error during processing:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Learn team translation patterns
   */
  private learnTeamPatterns(teamName: string): void {
    // Generate intelligent mapping based on team name patterns
    const lowerName = teamName.toLowerCase();
    
    // Portuguese team patterns
    if (lowerName.includes('porto')) {
      smartTeamTranslation.learnFromTranslationContext(teamName, '波圖', 'zh-hk');
      smartTeamTranslation.learnFromTranslationContext(teamName, '波尔图', 'zh');
      smartTeamTranslation.learnFromTranslationContext(teamName, '波爾圖', 'zh-tw');
    }
    
    if (lowerName.includes('benfica')) {
      smartTeamTranslation.learnFromTranslationContext(teamName, '賓菲加', 'zh-hk');
      smartTeamTranslation.learnFromTranslationContext(teamName, '本菲卡', 'zh');
      smartTeamTranslation.learnFromTranslationContext(teamName, '本菲卡', 'zh-tw');
    }
    
    if (lowerName.includes('sporting')) {
      smartTeamTranslation.learnFromTranslationContext(teamName, '士砵亭', 'zh-hk');
      smartTeamTranslation.learnFromTranslationContext(teamName, '里斯本竞技', 'zh');
      smartTeamTranslation.learnFromTranslationContext(teamName, '里斯本競技', 'zh-tw');
    }
    
    if (lowerName.includes('braga')) {
      smartTeamTranslation.learnFromTranslationContext(teamName, '布拉加', 'zh-hk');
      smartTeamTranslation.learnFromTranslationContext(teamName, '布拉加', 'zh');
      smartTeamTranslation.learnFromTranslationContext(teamName, '布拉加', 'zh-tw');
    }
    
    // European team patterns
    if (lowerName.includes('madrid')) {
      if (lowerName.includes('real')) {
        smartTeamTranslation.learnFromTranslationContext(teamName, '皇家馬德里', 'zh-hk');
      } else if (lowerName.includes('atletico')) {
        smartTeamTranslation.learnFromTranslationContext(teamName, '馬德里體育會', 'zh-hk');
      }
    }
    
    if (lowerName.includes('barcelona')) {
      smartTeamTranslation.learnFromTranslationContext(teamName, '巴塞隆拿', 'zh-hk');
      smartTeamTranslation.learnFromTranslationContext(teamName, '巴塞罗那', 'zh');
      smartTeamTranslation.learnFromTranslationContext(teamName, '巴塞隆納', 'zh-tw');
    }
    
    console.log(`🎯 [AutoLearning] Applied pattern learning for: ${teamName}`);
  }

  /**
   * Force process all pending learning immediately
   */
  async forceProcessAll(): Promise<void> {
    await this.processPendingLearning();
  }
}

// Export singleton instance
export const autoLearningTrigger = AutoLearningTrigger.getInstance();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).autoLearningTrigger = autoLearningTrigger;
}
