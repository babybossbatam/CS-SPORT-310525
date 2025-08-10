import { teamMappingExtractor } from './teamMappingExtractor';

/**
 * Generate complete team mapping for all teams in MyNewLeague2 leagues
 */
export async function generateCompleteTeamMapping(selectedDate: string = new Date().toISOString().split('T')[0]): Promise<void> {
  console.log(`🚀 [Complete Team Mapping] Starting comprehensive team mapping for date: ${selectedDate}`);

  const leagueIds = [
    38, 15, 2, 4, 10, 11, 848, 886, 1022, 772, 71, 3, 5, 531, 22, 72, 73, 75,
    76, 233, 667, 940, 908, 1169, 23, 1077, 253, 850, 893, 921, 130, 128, 493,
    239, 265, 237, 235, 743
  ];

  try {
    // Fetch fixtures from all target leagues
    const allFixtures: any[] = [];

    for (const leagueId of leagueIds) {
      try {
        console.log(`📡 [Complete Team Mapping] Fetching league ${leagueId}...`);
        const response = await fetch(`/api/leagues/${leagueId}/fixtures`);

        if (response.ok) {
          const data = await response.json();
          const fixtures = data.response || data || [];
          allFixtures.push(...fixtures);
          console.log(`✅ [Complete Team Mapping] League ${leagueId}: ${fixtures.length} fixtures`);
        } else {
          console.warn(`⚠️ [Complete Team Mapping] Failed to fetch league ${leagueId}: ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ [Complete Team Mapping] Error fetching league ${leagueId}:`, error);
      }

      // Add small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📊 [Complete Team Mapping] Total fixtures collected: ${allFixtures.length}`);

    // Extract team mappings
    const leagueTeamData = teamMappingExtractor.extractTeamsFromFixtures(allFixtures);
    const analysisReport = teamMappingExtractor.generateAnalysisReport();

    // Generate comprehensive report
    console.log(`🎯 [Complete Team Mapping] Final Analysis:`, {
      totalLeagues: leagueIds.length,
      leaguesWithData: analysisReport.leagueBreakdown.length,
      totalUniqueTeams: analysisReport.totalTeams,
      totalFixturesAnalyzed: analysisReport.totalFixtures
    });

    // Generate translation templates for different languages
    const languages = ['zh-hk', 'zh-cn', 'en', 'es', 'fr', 'de', 'it', 'pt'];

    languages.forEach(lang => {
      const template = teamMappingExtractor.generateTranslationTemplate(lang);
      console.log(`📋 [Translation Template - ${lang.toUpperCase()}]:`);
      console.log(template);
      console.log('\n' + '='.repeat(80) + '\n');
    });

    // Detailed league breakdown
    console.log(`📋 [League Breakdown]:`);
    analysisReport.leagueBreakdown.forEach(league => {
      console.log(`League ${league.leagueId} (${league.leagueName}): ${league.teamCount} teams`);
      league.topTeams.slice(0, 10).forEach((team, index) => {
        console.log(`  ${index + 1}. ${team.name} (${team.frequency} matches)`);
      });
      console.log('');
    });

    // Export data for manual use
    const exportData = {
      analysisDate: selectedDate,
      totalLeagues: leagueIds.length,
      leaguesAnalyzed: analysisReport.leagueBreakdown.length,
      totalTeams: analysisReport.totalTeams,
      totalFixtures: analysisReport.totalFixtures,
      leagueBreakdown: analysisReport.leagueBreakdown,
      allTeamsSortedByFrequency: teamMappingExtractor.getAllTeamsSortedByFrequency().slice(0, 200), // Top 200
      translationTemplates: languages.reduce((acc, lang) => {
        acc[lang] = teamMappingExtractor.generateTranslationTemplate(lang);
        return acc;
      }, {} as Record<string, string>)
    };

    // Store in localStorage for easy access
    localStorage.setItem('completeTeamMapping', JSON.stringify(exportData, null, 2));
    console.log(`💾 [Complete Team Mapping] Data exported to localStorage as 'completeTeamMapping'`);

    // Generate ready-to-use TypeScript code for smartTeamTranslation.ts
    const generateSmartTranslationCode = (language: string) => {
      const teams = teamMappingExtractor.getAllTeamsSortedByFrequency();
      const mappings: string[] = [];

      teams.forEach(team => {
        // Generate translations for common teams
        const teamName = team.name;
        let translation = teamName; // Default to original name

        // Add specific translations for Chinese languages
        if (language === 'zh-hk' || language === 'zh-cn') {
          // You can extend this with your translation logic
          translation = translateTeamNameToLanguage(teamName, language);
        }

        mappings.push(`    '${teamName}': {
      'zh': '${translation}', 'zh-hk': '${translation}', 'zh-tw': '${translation}',
      'es': '${teamName}', 'de': '${teamName}', 'it': '${teamName}', 'pt': '${teamName}'
    }`);
      });

      return mappings.join(',\n');
    };

    // Helper function to translate team names (you can enhance this)
    const translateTeamNameToLanguage = (teamName: string, language: string): string => {
      // Add your translation logic here
      // For now, return the original name
      return teamName;
    };

    // Create comprehensive downloadable file content
    const downloadContent = `
// Complete Team Mapping for MyNewLeague2
// Generated on: ${new Date().toISOString()}
// Analyzed Date: ${selectedDate}
// Total Teams: ${analysisReport.totalTeams}
// Total Fixtures: ${analysisReport.totalFixtures}
// Leagues: ${leagueIds.join(', ')}

// ============= READY-TO-USE TYPESCRIPT CODE =============
// Copy this into your smartTeamTranslation.ts file

export const teamTranslations = {
${generateSmartTranslationCode('zh-hk')}
};

${languages.map(lang => `
// ============= ${lang.toUpperCase()} TRANSLATIONS =============
${teamMappingExtractor.generateTranslationTemplate(lang)}
`).join('\n')}

// ============= RAW DATA =============
${JSON.stringify(exportData, null, 2)}
    `;

    // Create and trigger download
    const blob = new Blob([downloadContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complete-team-mapping-${selectedDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`📁 [Complete Team Mapping] File downloaded: complete-team-mapping-${selectedDate}.txt`);

  } catch (error) {
    console.error('❌ [Complete Team Mapping] Failed:', error);
  }
}

/**
 * Generate comprehensive team mapping for entire season (all dates)
 */
export async function generateSeasonWideTeamMapping(): Promise<void> {
  console.log('🏆 [Season Mapping] Starting season-wide team mapping...');

  const leagueIds = [
    38, 15, 2, 4, 10, 11, 848, 886, 1022, 772, 71, 3, 5, 531, 22, 72, 73, 75,
    76, 233, 667, 940, 908, 1169, 23, 1077, 253, 850, 893, 921, 130, 128, 493,
    239, 265, 237, 235, 743
  ];

  try {
    console.log(`📡 [Season Mapping] Fetching all teams from ${leagueIds.length} leagues...`);

    const allSeasonFixtures: any[] = [];

    // Fetch all fixtures from each league (regardless of date)
    for (const leagueId of leagueIds) {
      try {
        console.log(`📊 [Season Mapping] Processing league ${leagueId}...`);
        const response = await fetch(`/api/leagues/${leagueId}/fixtures`);

        if (response.ok) {
          const data = await response.json();
          const fixtures = data.response || data || [];
          allSeasonFixtures.push(...fixtures);
          console.log(`✅ [Season Mapping] League ${leagueId}: ${fixtures.length} fixtures`);
        } else {
          console.warn(`⚠️ [Season Mapping] Failed to fetch league ${leagueId}: ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ [Season Mapping] Error fetching league ${leagueId}:`, error);
      }

      // Add small delay to be API-friendly
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📈 [Season Mapping] Total season fixtures: ${allSeasonFixtures.length}`);

    // Extract all unique teams from season fixtures
    const seasonTeamData = teamMappingExtractor.extractTeamsFromFixtures(allSeasonFixtures);
    const seasonAnalysis = teamMappingExtractor.generateAnalysisReport();

    console.log(`🎯 [Season Mapping] Season Analysis Complete:`, {
      totalUniqueTeams: seasonAnalysis.totalTeams,
      totalMatches: seasonAnalysis.totalFixtures,
      leaguesAnalyzed: seasonAnalysis.leagueBreakdown.length
    });

    // Generate ready-to-paste TypeScript code
    const allTeams = teamMappingExtractor.getAllTeamsSortedByFrequency();

    let tsCode = '// ============= COMPLETE TEAM TRANSLATIONS =============\n';
    tsCode += '// Copy these into your smartTeamTranslation.ts file\n\n';

    allTeams.forEach(team => {
      const teamName = team.name;
      tsCode += `    '${teamName}': {\n`;
      tsCode += `      'zh': '${teamName}', 'zh-hk': '${teamName}', 'zh-tw': '${teamName}',\n`;
      tsCode += `      'es': '${teamName}', 'de': '${teamName}', 'it': '${teamName}', 'pt': '${teamName}'\n`;
      tsCode += `    },\n`;
    });

    // Save comprehensive results
    const seasonResults = {
      generatedOn: new Date().toISOString(),
      totalTeams: seasonAnalysis.totalTeams,
      totalFixtures: seasonAnalysis.totalFixtures,
      readyToUseCode: tsCode,
      leagueBreakdown: seasonAnalysis.leagueBreakdown,
      allTeams: allTeams.slice(0, 500) // Top 500 teams
    };

    localStorage.setItem('seasonTeamMapping', JSON.stringify(seasonResults, null, 2));

    // Create downloadable file
    const fullContent = `${tsCode}\n\n// ============= ANALYSIS DATA =============\n${JSON.stringify(seasonResults, null, 2)}`;

    const blob = new Blob([fullContent], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `season-team-mapping-${new Date().toISOString().split('T')[0]}.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`💾 [Season Mapping] Complete! Generated mapping for ${seasonAnalysis.totalTeams} teams`);
    console.log(`📁 [Season Mapping] File downloaded with ready-to-use TypeScript code`);

  } catch (error) {
    console.error('❌ [Season Mapping] Failed:', error);
  }
}

/**
 * Quick function to run team mapping analysis on current page data
 */
export function analyzeCurrentPageTeams(): void {
  console.log('🔍 [Quick Analysis] Analyzing teams from current page...');

  // This would be called from the browser console to analyze currently loaded data
  const event = new CustomEvent('analyzeTeams');
  window.dispatchEvent(event);
}

// Export to window for console access
if (typeof window !== 'undefined') {
  (window as any).generateCompleteTeamMapping = generateCompleteTeamMapping;
  (window as any).generateSeasonWideTeamMapping = generateSeasonWideTeamMapping;
  (window as any).analyzeCurrentPageTeams = analyzeCurrentPageTeams;
}

/**
 * Generate complete team mapping for specific league IDs with automatic translation
 */
export async function generateAutomatedTeamMappingForLeagues(leagueIds: number[]): Promise<void> {
  console.log(`🚀 [Automated Team Mapping] Starting automated mapping for leagues: ${leagueIds.join(', ')}`);

  try {
    const allFixtures: any[] = [];

    // Fetch fixtures from all specified leagues
    for (const leagueId of leagueIds) {
      try {
        console.log(`📡 [Automated] Fetching league ${leagueId}...`);
        const response = await fetch(`/api/leagues/${leagueId}/fixtures`);

        if (response.ok) {
          const data = await response.json();
          const fixtures = data.response || data || [];
          allFixtures.push(...fixtures);
          console.log(`✅ [Automated] League ${leagueId}: ${fixtures.length} fixtures`);
        } else {
          console.warn(`⚠️ [Automated] Failed to fetch league ${leagueId}: ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ [Automated] Error fetching league ${leagueId}:`, error);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📊 [Automated] Total fixtures collected: ${allFixtures.length}`);

    // Extract all unique teams
    const leagueTeamData = teamMappingExtractor.extractTeamsFromFixtures(allFixtures);
    const analysisReport = teamMappingExtractor.generateAnalysisReport();

    console.log(`🎯 [Automated] Analysis complete:`, {
      totalLeagues: leagueIds.length,
      totalTeams: analysisReport.totalTeams,
      totalFixtures: analysisReport.totalFixtures
    });

    // Generate automated TypeScript code with smart translations
    const generateAutomatedTranslations = (language: string) => {
      const teams = teamMappingExtractor.getAllTeamsSortedByFrequency();
      const mappings: string[] = [];

      teams.forEach(team => {
        const teamName = team.name;

        // Use smart translation (you can enhance this with ML or external translation APIs)
        const translations = generateSmartTranslationForTeam(teamName, language);

        mappings.push(`    '${teamName}': {
      'zh': '${translations.zh}', 'zh-hk': '${translations.zhHk}', 'zh-tw': '${translations.zhTw}',
      'es': '${translations.es}', 'de': '${translations.de}', 'it': '${translations.it}', 'pt': '${translations.pt}'
    }`);
      });

      return mappings.join(',\n');
    };

    // Create comprehensive ready-to-use code
    const automatedCode = `
// AUTOMATED TEAM MAPPING for leagues: ${leagueIds.join(', ')}
// Generated on: ${new Date().toISOString()}
// Total Teams: ${analysisReport.totalTeams}
// Total Fixtures: ${analysisReport.totalFixtures}

// ============= READY-TO-PASTE TYPESCRIPT CODE =============
// Copy this into your smartTeamTranslation.ts file

export const automatedTeamTranslations = {
${generateAutomatedTranslations('zh-hk')}
};

// ============= USAGE INSTRUCTIONS =============
// 1. Copy the above object into your smartTeamTranslation.ts file
// 2. Merge with existing popularLeagueTeams object
// 3. All teams from leagues ${leagueIds.join(', ')} are now mapped!

// ============= SUMMARY =============
// Leagues analyzed: ${leagueIds.join(', ')}
// Teams mapped: ${analysisReport.totalTeams}
// Fixtures analyzed: ${analysisReport.totalFixtures}
`;

    // Download the automated mapping file
    const blob = new Blob([automatedCode], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automated-team-mapping-leagues-${leagueIds.join('-')}-${new Date().toISOString().split('T')[0]}.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`📁 [Automated] File downloaded with complete team mappings for ${analysisReport.totalTeams} teams!`);

    // Also store in localStorage for easy access
    localStorage.setItem('automatedTeamMapping', JSON.stringify({
      leagueIds,
      teams: analysisReport.totalTeams,
      fixtures: analysisReport.totalFixtures,
      code: automatedCode,
      generatedAt: new Date().toISOString()
    }, null, 2));

  } catch (error) {
    console.error('❌ [Automated] Failed:', error);
  }
}

/**
 * Smart translation generator for team names
 */
function generateSmartTranslationForTeam(teamName: string, language: string): any {
  // Enhanced smart translation logic
  const lowerName = teamName.toLowerCase();

  // Common team name translations
  const commonTranslations: { [key: string]: any } = {
    // Spanish teams
    'real madrid': { zh: '皇家马德里', zhHk: '皇家馬德里', zhTw: '皇家馬德里', es: 'Real Madrid', de: 'Real Madrid', it: 'Real Madrid', pt: 'Real Madrid' },
    'barcelona': { zh: '巴塞罗那', zhHk: '巴塞隆拿', zhTw: '巴塞隆納', es: 'Barcelona', de: 'Barcelona', it: 'Barcelona', pt: 'Barcelona' },
    'atletico madrid': { zh: '马德里竞技', zhHk: '馬德里體育會', zhTw: '馬德里競技', es: 'Atlético Madrid', de: 'Atlético Madrid', it: 'Atlético Madrid', pt: 'Atlético Madrid' },
    'sevilla': { zh: '塞维利亚', zhHk: '西維爾', zhTw: '塞維亞', es: 'Sevilla', de: 'Sevilla', it: 'Siviglia', pt: 'Sevilha' },
    'valencia': { zh: '瓦伦西亚', zhHk: '華倫西亞', zhTw: '瓦倫西亞', es: 'Valencia', de: 'Valencia', it: 'Valencia', pt: 'Valencia' },
    'villarreal': { zh: '比利亚雷亚尔', zhHk: '維拉利爾', zhTw: '比利亞雷爾', es: 'Villarreal', de: 'Villarreal', it: 'Villarreal', pt: 'Villarreal' },
    'real betis': { zh: '皇家贝蒂斯', zhHk: '皇家貝迪斯', zhTw: '皇家貝蒂斯', es: 'Real Betis', de: 'Real Betis', it: 'Real Betis', pt: 'Real Betis' },
    'athletic bilbao': { zh: '毕尔巴鄂竞技', zhHk: '畢爾包體育會', zhTw: '畢爾包競技', es: 'Athletic Bilbao', de: 'Athletic Bilbao', it: 'Athletic Bilbao', pt: 'Athletic Bilbao' },

    // English teams
    'arsenal': { zh: '阿森纳', zhHk: '阿仙奴', zhTw: '阿森納', es: 'Arsenal', de: 'Arsenal', it: 'Arsenal', pt: 'Arsenal' },
    'chelsea': { zh: '切尔西', zhHk: '車路士', zhTw: '切爾西', es: 'Chelsea', de: 'Chelsea', it: 'Chelsea', pt: 'Chelsea' },
    'liverpool': { zh: '利物浦', zhHk: '利物浦', zhTw: '利物浦', es: 'Liverpool', de: 'Liverpool', it: 'Liverpool', pt: 'Liverpool' },
    'manchester united': { zh: '曼联', zhHk: '曼聯', zhTw: '曼聯', es: 'Manchester United', de: 'Manchester United', it: 'Manchester United', pt: 'Manchester United' },
    'manchester city': { zh: '曼城', zhHk: '曼城', zhTw: '曼城', es: 'Manchester City', de: 'Manchester City', it: 'Manchester City', pt: 'Manchester City' },
    'tottenham': { zh: '热刺', zhHk: '熱刺', zhTw: '熱刺', es: 'Tottenham', de: 'Tottenham', it: 'Tottenham', pt: 'Tottenham' },

    // Italian teams
    'juventus': { zh: '尤文图斯', zhHk: '祖雲達斯', zhTw: '尤文圖斯', es: 'Juventus', de: 'Juventus', it: 'Juventus', pt: 'Juventus' },
    'ac milan': { zh: 'AC米兰', zhHk: 'AC米蘭', zhTw: 'AC米蘭', es: 'AC Milan', de: 'AC Mailand', it: 'AC Milan', pt: 'AC Milan' },
    'inter milan': { zh: '国际米兰', zhHk: '國際米蘭', zhTw: '國際米蘭', es: 'Inter de Milán', de: 'Inter Mailand', it: 'Inter', pt: 'Inter de Milão' },
    'as roma': { zh: '罗马', zhHk: '羅馬', zhTw: '羅馬', es: 'AS Roma', de: 'AS Rom', it: 'AS Roma', pt: 'AS Roma' },
    'napoli': { zh: '那不勒斯', zhHk: '拿坡里', zhTw: '那不勒斯', es: 'Nápoles', de: 'Neapel', it: 'Napoli', pt: 'Napoli' },

    // German teams
    'bayern munich': { zh: '拜仁慕尼黑', zhHk: '拜仁慕尼黑', zhTw: '拜仁慕尼黑', es: 'Bayern Múnich', de: 'Bayern München', it: 'Bayern Monaco', pt: 'Bayern de Munique' },
    'borussia dortmund': { zh: '多特蒙德', zhHk: '多蒙特', zhTw: '多特蒙德', es: 'Borussia Dortmund', de: 'Borussia Dortmund', it: 'Borussia Dortmund', pt: 'Borussia Dortmund' },

    // French teams
    'paris saint germain': { zh: '巴黎圣日耳曼', zhHk: '巴黎聖日耳門', zhTw: '巴黎聖日耳曼', es: 'París Saint-Germain', de: 'Paris Saint-Germain', it: 'Paris Saint-Germain', pt: 'Paris Saint-Germain' },
    'marseille': { zh: '马赛', zhHk: '馬賽', zhTw: '馬賽', es: 'Marsella', de: 'Marseille', it: 'Marsiglia', pt: 'Marselha' },
    'lyon': { zh: '里昂', zhHk: '里昂', zhTw: '里昂', es: 'Lyon', de: 'Lyon', it: 'Lione', pt: 'Lyon' }
  };

  // Check for exact match first
  if (commonTranslations[lowerName]) {
    return commonTranslations[lowerName];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(commonTranslations)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return value;
    }
  }

  // Generate phonetic-based translation for unknown teams
  return generatePhoneticTranslation(teamName);
}

/**
 * Generate phonetic-based translations for unknown team names
 */
function generatePhoneticTranslation(teamName: string): any {
  // Basic phonetic mapping - you can enhance this
  const phoneticMap: { [key: string]: string } = {
    'a': '阿', 'b': '巴', 'c': '卡', 'd': '达', 'e': '埃', 'f': '法', 'g': '加', 'h': '哈',
    'i': '伊', 'j': '雅', 'k': '卡', 'l': '拉', 'm': '马', 'n': '纳', 'o': '奥', 'p': '帕',
    'q': '库', 'r': '拉', 's': '萨', 't': '塔', 'u': '乌', 'v': '维', 'w': '瓦', 'x': '克',
    'y': '伊', 'z': '扎'
  };

  let chineseTranslation = '';
  for (const char of teamName.toLowerCase()) {
    if (phoneticMap[char]) {
      chineseTranslation += phoneticMap[char];
    }
  }

  return {
    zh: chineseTranslation,
    zhHk: chineseTranslation,
    zhTw: chineseTranslation,
    es: teamName,
    de: teamName,
    it: teamName,
    pt: teamName
  };
}

/**
 * Quick function to map all teams from Spanish leagues (your example)
 */
export async function mapSpanishLeagueTeams(): Promise<void> {
  const spanishLeagues = [4, 667]; // La Liga and Segunda Division
  await generateAutomatedTeamMappingForLeagues(spanishLeagues);
}

/**
 * Quick function to map all teams from major European leagues
 */
export async function mapMajorEuropeanLeagues(): Promise<void> {
  const majorLeagues = [38, 15, 4, 667, 2, 23, 5, 3]; // Premier League, Championship, La Liga, Segunda, Bundesliga, Serie A, Ligue 1, Eredivisie
  await generateAutomatedTeamMappingForLeagues(majorLeagues);
}

/**
 * Generate automated team mapping for ALL available leagues
 */
export async function generateAutomatedTeamMappingForAllLeagues(): Promise<void> {
  console.log('🌍 [All Leagues Mapping] Fetching all available leagues...');

  try {
    // Try to fetch leagues from API first
    console.log(`🎯 [All Leagues Mapping] Fetching all leagues from /api/leagues/all...`);

    const response = await fetch('/api/leagues/all', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ [All Leagues Mapping] API Error: ${response.status} ${response.statusText}`);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const responseText = await response.text();
      console.error(`❌ [All Leagues Mapping] Unexpected response format:`, responseText.substring(0, 200));
      throw new Error(`Expected JSON response but got: ${contentType}`);
    }

    const leagues = await response.json();
    console.log(`✅ [All Leagues Mapping] Successfully fetched leagues data`);
    console.log(`🔍 [All Leagues Mapping] Raw response type: ${typeof leagues}, Array: ${Array.isArray(leagues)}, Length: ${leagues?.length}`);

    // Validate the response structure
    if (!Array.isArray(leagues)) {
      console.error(`❌ [All Leagues Mapping] Invalid response structure:`, typeof leagues);
      throw new Error(`Expected array of leagues but got: ${typeof leagues}`);
    }

    const allLeagueIds = leagues
      .map((league: any) => {
        // Handle both direct league object and nested league.league structure
        const leagueData = league.league || league;
        const id = leagueData?.id || league.id;
        return typeof id === 'number' && id > 0 ? id : null;
      })
      .filter((id: any) => id !== null);

    if (allLeagueIds.length === 0) {
      console.error(`❌ [All Leagues Mapping] No valid league IDs found in response`);
      console.error(`📋 [All Leagues Mapping] Sample raw data:`, leagues.slice(0, 3));
      throw new Error('No valid league IDs found in API response');
    }

    console.log(`🎯 [All Leagues Mapping] Found ${allLeagueIds.length} total leagues`);
    console.log(`📋 [All Leagues Mapping] Sample league IDs: ${allLeagueIds.slice(0, 20).join(', ')}${allLeagueIds.length > 20 ? '...' : ''}`);

    // Ensure we have a valid array before calling the function
    if (Array.isArray(allLeagueIds) && allLeagueIds.length > 0) {
      await generateAutomatedTeamMappingForLeagues(allLeagueIds);
    } else {
      throw new Error('Failed to extract valid league IDs from API response');
    }

  } catch (error) {
    console.error('❌ [All Leagues Mapping] Failed to fetch all leagues:', error);

    // Fallback to predefined comprehensive list
    console.log('🔄 [All Leagues Mapping] Using fallback comprehensive league list...');
    const fallbackLeagues = [
      38, 15, 2, 4, 10, 11, 848, 886, 1022, 772, 71, 3, 5, 531, 22, 72, 73, 75,
      76, 233, 667, 940, 908, 1169, 23, 1077, 253, 850, 893, 921, 130, 128, 493,
      239, 265, 237, 235, 743
    ];

    await generateAutomatedTeamMappingForLeagues(fallbackLeagues);
  }
}

// Make functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).generateCompleteTeamMapping = generateCompleteTeamMapping;
  (window as any).generateSeasonWideTeamMapping = generateSeasonWideTeamMapping;
  (window as any).analyzeCurrentPageTeams = analyzeCurrentPageTeams;
  (window as any).generateAutomatedTeamMappingForLeagues = generateAutomatedTeamMappingForLeagues;
  (window as any).generateAutomatedTeamMappingForAllLeagues = generateAutomatedTeamMappingForAllLeagues;
  (window as any).mapSpanishLeagueTeams = mapSpanishLeagueTeams;
  (window as any).mapMajorEuropeanLeagues = mapMajorEuropeanLeagues;

  // Helper function to directly generate team mappings for specific leagues
  (window as any).generateMappingForLeagues = async (leagueIds: number[]) => {
    console.log(`🎯 [Custom Mapping] Generating mappings for leagues: ${leagueIds.join(', ')}`);

    const allFixtures: any[] = [];

    for (const leagueId of leagueIds) {
      try {
        const response = await fetch(`/api/leagues/${leagueId}/fixtures`);
        if (response.ok) {
          const data = await response.json();
          const fixtures = data.response || data || [];
          allFixtures.push(...fixtures);
          console.log(`✅ League ${leagueId}: ${fixtures.length} fixtures`);
        }
      } catch (error) {
        console.error(`❌ Error fetching league ${leagueId}:`, error);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const teamData = teamMappingExtractor.extractTeamsFromFixtures(allFixtures);
    const analysis = teamMappingExtractor.generateAnalysisReport();

    console.log(`🎯 Custom mapping complete: ${analysis.totalTeams} teams from ${analysis.totalFixtures} fixtures`);
    return analysis;
  };

  console.log(`🛠️ [Automated Team Mapping] Available functions:`);
  console.log(`   • generateAutomatedTeamMappingForLeagues([4, 667]) - Map specific leagues`);
  console.log(`   • mapSpanishLeagueTeams() - Map all Spanish league teams`);
  console.log(`   • mapMajorEuropeanLeagues() - Map all major European leagues`);
}