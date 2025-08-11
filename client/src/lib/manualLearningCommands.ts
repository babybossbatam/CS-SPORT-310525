
/**
 * Manual Learning Commands
 * Helper functions for manually teaching the system team translations
 */

import { smartTeamTranslation } from './smartTeamTranslation';
import { autoLearningTrigger } from './autoLearningTrigger';

/**
 * Manually teach a team translation
 */
export function teachTeam(teamName: string, translations: {
  zh?: string;
  'zh-hk'?: string;
  'zh-tw'?: string;
  es?: string;
  de?: string;
  it?: string;
  pt?: string;
}) {
  Object.entries(translations).forEach(([language, translation]) => {
    if (translation) {
      smartTeamTranslation.learnFromTranslationContext(teamName, translation, language);
    }
  });
  
  console.log(`✅ Taught translations for ${teamName}:`, translations);
}

/**
 * Teach common Portuguese teams
 */
export function teachPortugueseTeams() {
  const teams = {
    'FC Porto': {
      'zh': '波尔图',
      'zh-hk': '波圖', 
      'zh-tw': '波爾圖',
      'es': 'Oporto'
    },
    'Benfica': {
      'zh': '本菲卡',
      'zh-hk': '賓菲加',
      'zh-tw': '本菲卡'
    },
    'Sporting CP': {
      'zh': '里斯本竞技',
      'zh-hk': '士砵亭',
      'zh-tw': '里斯本競技'
    },
    'SC Braga': {
      'zh': '布拉加',
      'zh-hk': '布拉加',
      'zh-tw': '布拉加'
    }
  };
  
  Object.entries(teams).forEach(([teamName, translations]) => {
    teachTeam(teamName, translations);
  });
  
  console.log('🇵🇹 Taught all Portuguese team translations!');
}

/**
 * Test current translation for a team
 */
export function testTranslation(teamName: string, language: string = 'zh-hk') {
  const translation = smartTeamTranslation.translateTeam(teamName, language);
  console.log(`${teamName} (${language}) → ${translation}`);
  return translation;
}

/**
 * Force learning from current page
 */
export function learnFromCurrentPage() {
  // Get all team names from the current page
  const teamElements = document.querySelectorAll('[data-team-name]');
  const teamNames: string[] = [];
  
  teamElements.forEach(el => {
    const teamName = el.getAttribute('data-team-name');
    if (teamName) teamNames.push(teamName);
  });
  
  // Also try to extract from text content
  const standingsRows = document.querySelectorAll('table tbody tr');
  standingsRows.forEach(row => {
    const teamCell = row.querySelector('td:nth-child(2)');
    if (teamCell) {
      const teamText = teamCell.textContent?.trim();
      if (teamText) teamNames.push(teamText);
    }
  });
  
  // Learn from found teams
  teamNames.forEach(teamName => {
    autoLearningTrigger.addTeamForLearning(teamName);
  });
  
  console.log(`📚 Learning from ${teamNames.length} teams found on page:`, teamNames);
  
  // Force process learning
  autoLearningTrigger.forceProcessAll();
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).teachTeam = teachTeam;
  (window as any).teachPortugueseTeams = teachPortugueseTeams;
  (window as any).testTranslation = testTranslation;
  (window as any).learnFromCurrentPage = learnFromCurrentPage;
  
  console.log('🎓 Learning commands available:');
  console.log('- teachTeam("FC Porto", {"zh-hk": "波圖"})');
  console.log('- teachPortugueseTeams()');
  console.log('- testTranslation("FC Porto", "zh-hk")');
  console.log('- learnFromCurrentPage()');
}
</new_str>
