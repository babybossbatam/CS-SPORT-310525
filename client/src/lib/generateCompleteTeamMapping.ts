
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
}
