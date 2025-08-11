
/**
 * Manual Learning Commands
 * Helper functions for manually teaching the system team translations
 */

import { smartTeamTranslation } from './smartTeamTranslation';
import { smartLeagueCountryTranslation } from './smartLeagueCountryTranslation';
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
 * Manually teach a league translation
 */
export function teachLeague(leagueName: string, translations: {
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
      smartLeagueCountryTranslation.learnFromTranslationContext(leagueName, translation, language);
    }
  });
  
  console.log(`✅ Taught league translations for ${leagueName}:`, translations);
}

/**
 * Teach common FIFA competitions
 */
export function teachFifaCompetitions() {
  const leagues = {
    'FIFA Club World Cup': {
      'zh': 'FIFA俱乐部世界杯',
      'zh-hk': 'FIFA球會世界盃',
      'zh-tw': 'FIFA球會世界盃'
    },
    'FIFA World Cup': {
      'zh': 'FIFA世界杯',
      'zh-hk': 'FIFA世界盃',
      'zh-tw': 'FIFA世界盃'
    },
    'World Cup - Qualification Europe': {
      'zh': '世界杯欧洲区预选赛',
      'zh-hk': '世界盃歐洲區外圍賽',
      'zh-tw': '世界盃歐洲區外圍賽'
    }
  };
  
  Object.entries(leagues).forEach(([leagueName, translations]) => {
    teachLeague(leagueName, translations);
  });
  
  console.log('🌍 Taught all FIFA competition translations!');
}

/**
 * Test current league translation
 */
export function testLeagueTranslation(leagueName: string, language: string = 'zh-hk') {
  const translation = smartLeagueCountryTranslation.translateLeague(leagueName, language);
  console.log(`${leagueName} (${language}) → ${translation}`);
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
  
  // Extract league names from select options or headers
  const leagueNames: string[] = [];
  const leagueSelectors = document.querySelectorAll('select option, [data-league-name], .league-name');
  leagueSelectors.forEach(el => {
    const leagueName = el.getAttribute('data-league-name') || el.textContent?.trim();
    if (leagueName && leagueName.length > 3) leagueNames.push(leagueName);
  });
  
  // Learn from found teams
  teamNames.forEach(teamName => {
    autoLearningTrigger.addTeamForLearning(teamName);
  });
  
  // Learn from found leagues
  leagueNames.forEach(leagueName => {
    autoLearningTrigger.addLeagueForLearning(leagueName);
  });
  
  console.log(`📚 Learning from ${teamNames.length} teams and ${leagueNames.length} leagues found on page:`, {teamNames, leagueNames});
  
  // Force process learning
  autoLearningTrigger.forceProcessAll();
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).teachTeam = teachTeam;
  (window as any).teachPortugueseTeams = teachPortugueseTeams;
  (window as any).testTranslation = testTranslation;
  (window as any).teachLeague = teachLeague;
  (window as any).teachFifaCompetitions = teachFifaCompetitions;
  (window as any).testLeagueTranslation = testLeagueTranslation;
  (window as any).learnFromCurrentPage = learnFromCurrentPage;
  
  console.log('🎓 Learning commands available:');
  console.log('- teachTeam("FC Porto", {"zh-hk": "波圖"})');
  console.log('- teachPortugueseTeams()');
  console.log('- testTranslation("FC Porto", "zh-hk")');
  console.log('- teachLeague("FIFA Club World Cup", {"zh-hk": "FIFA球會世界盃"})');
  console.log('- teachFifaCompetitions()');
  console.log('- testLeagueTranslation("FIFA Club World Cup", "zh-hk")');
  console.log('- learnFromCurrentPage()');
}
</new_str>
