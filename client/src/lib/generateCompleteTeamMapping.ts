
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

    // Create downloadable file content
    const downloadContent = `
// Complete Team Mapping for MyNewLeague2
// Generated on: ${new Date().toISOString()}
// Analyzed Date: ${selectedDate}
// Total Teams: ${analysisReport.totalTeams}
// Total Fixtures: ${analysisReport.totalFixtures}
// Leagues: ${leagueIds.join(', ')}

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
  (window as any).analyzeCurrentPageTeams = analyzeCurrentPageTeams;
}
