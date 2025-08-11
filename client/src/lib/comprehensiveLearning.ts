
// Comprehensive Learning System
// Triggers learning from all available data sources

import { standingsLearningSystem } from './standingsLearningSystem';
import { smartTeamTranslation } from './smartTeamTranslation';
import { smartLeagueCountryTranslation } from './smartLeagueCountryTranslation';

/**
 * Trigger comprehensive learning from all available sources
 */
export async function triggerComprehensiveLearning(): Promise<void> {
  console.log('🚀 [ComprehensiveLearning] Starting comprehensive learning process...');
  
  try {
    // 1. Learn from standings data
    console.log('📊 Learning from standings data...');
    const standingsStats = await standingsLearningSystem.learnFromMajorLeagues();
    
    // 2. Learn from fixtures data  
    console.log('⚽ Learning from fixtures data...');
    const today = new Date().toISOString().slice(0, 10);
    try {
      const fixturesResponse = await fetch(`/api/fixtures/date/${today}?all=true`);
      if (fixturesResponse.ok) {
        const fixturesData = await fixturesResponse.json();
        smartTeamTranslation.learnTeamsFromFixtures(fixturesData.response || []);
        smartLeagueCountryTranslation.learnFromFixtures(fixturesData.response || []);
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch fixtures for learning:', error);
    }

    // 3. Get final statistics
    const teamStats = smartTeamTranslation.getTranslationStats();
    const leagueStats = smartLeagueCountryTranslation.getTranslationStats();
    
    console.log('✅ [ComprehensiveLearning] Learning complete!');
    console.log('📈 Final Statistics:', {
      standings: standingsStats,
      teams: teamStats,
      leagues: leagueStats
    });
    
    // 4. Show summary
    const totalLearned = standingsStats.teamsLearned + teamStats.learnedMappings;
    console.log(`🎓 Total items learned: ${totalLearned}`);
    console.log('💡 Your app now has intelligent translations for teams and leagues!');
    
  } catch (error) {
    console.error('❌ [ComprehensiveLearning] Learning process failed:', error);
  }
}

// Make available in console
if (typeof window !== 'undefined') {
  (window as any).startLearning = triggerComprehensiveLearning;
  (window as any).learnFromStandings = () => standingsLearningSystem.learnFromMajorLeagues();
  (window as any).getTranslationStats = () => ({
    teams: smartTeamTranslation.getTranslationStats(),
    leagues: smartLeagueCountryTranslation.getTranslationStats()
  });
}
