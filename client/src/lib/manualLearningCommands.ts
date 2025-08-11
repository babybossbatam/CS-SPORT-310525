
/**
 * Manual Learning Commands
 * Console commands for immediate translation learning and testing
 */

import { smartTeamTranslation } from './smartTeamTranslation';
import { smartLeagueCountryTranslation } from './smartLeagueCountryTranslation';
import { autoLearningTrigger } from './autoLearningTrigger';

/**
 * Learn specific team translations immediately
 */
export function learnTeam(teamName: string, translations?: any) {
  if (translations) {
    // Manual mapping
    smartTeamTranslation.learnFromTranslationContext(teamName, translations.translation, translations.language || 'zh-hk');
  } else {
    // Auto-learn
    autoLearningTrigger.queueTeamForLearning(teamName);
  }
  console.log(`✅ Learning triggered for: ${teamName}`);
}

/**
 * Test translation for a team
 */
export function testTranslation(teamName: string, language: string = 'zh-hk') {
  const translation = smartTeamTranslation.translateTeam(teamName, language);
  console.log(`🔍 Translation test: "${teamName}" -> "${translation}" (${language})`);
  return translation;
}

/**
 * Bulk learn from standings data
 */
export function learnFromStandings(standingsData: any) {
  if (standingsData?.league?.standings) {
    const allTeams: any[] = [];
    
    if (Array.isArray(standingsData.league.standings[0])) {
      standingsData.league.standings.forEach((group: any[]) => {
        allTeams.push(...group);
      });
    } else {
      allTeams.push(...standingsData.league.standings);
    }
    
    smartTeamTranslation.autoLearnFromStandingsData(allTeams);
    console.log(`✅ Learned from ${allTeams.length} teams in standings`);
  }
}

/**
 * Get learning statistics
 */
export function getLearningStats() {
  const stats = {
    autoLearning: autoLearningTrigger.getStats(),
    teams: smartTeamTranslation.getTranslationStats(),
    leagues: smartLeagueCountryTranslation.getTranslationStats()
  };
  console.table(stats);
  return stats;
}

// Make available in console
if (typeof window !== 'undefined') {
  (window as any).learnTeam = learnTeam;
  (window as any).testTranslation = testTranslation;
  (window as any).learnFromStandings = learnFromStandings;
  (window as any).getLearningStats = getLearningStats;
  
  // Quick commands for common scenarios
  (window as any).learnFCPorto = () => learnTeam('FC Porto', { translation: '波圖', language: 'zh-hk' });
  (window as any).testFCPorto = () => testTranslation('FC Porto');
}
