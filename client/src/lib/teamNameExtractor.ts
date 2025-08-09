
interface TeamNameAnalysis {
  teamName: string;
  leagueName: string;
  leagueId: number;
  country: string;
  frequency: number;
}

interface ExtractionResult {
  teams: TeamNameAnalysis[];
  missingTranslations: string[];
  totalTeams: number;
  uniqueTeams: number;
}

class TeamNameExtractor {
  // Extract all unique team names from fixture data
  extractTeamNames(fixtures: any[]): ExtractionResult {
    const teamMap = new Map<string, TeamNameAnalysis>();
    const missingTranslations: string[] = [];

    fixtures.forEach(fixture => {
      if (fixture.teams?.home && fixture.teams?.away && fixture.league) {
        const homeTeam = fixture.teams.home.name?.trim();
        const awayTeam = fixture.teams.away.name?.trim();
        const leagueName = fixture.league.name;
        const leagueId = fixture.league.id;
        const country = fixture.league.country || 'Unknown';

        [homeTeam, awayTeam].forEach(teamName => {
          if (teamName) {
            const key = teamName.toLowerCase();
            if (teamMap.has(key)) {
              teamMap.get(key)!.frequency++;
            } else {
              teamMap.set(key, {
                teamName,
                leagueName,
                leagueId,
                country,
                frequency: 1
              });
            }

            // Check if translation is missing
            const translated = this.hasTranslation(teamName);
            if (!translated && !missingTranslations.includes(teamName)) {
              missingTranslations.push(teamName);
            }
          }
        });
      }
    });

    const teams = Array.from(teamMap.values())
      .sort((a, b) => b.frequency - a.frequency); // Sort by frequency

    return {
      teams,
      missingTranslations,
      totalTeams: teams.reduce((sum, team) => sum + team.frequency, 0),
      uniqueTeams: teams.length
    };
  }

  // Check if a team name has translation (simplified check)
  private hasTranslation(teamName: string): boolean {
    try {
      // Use dynamic import instead of require for browser compatibility
      // For now, just return false as a placeholder since we can't use require in browser
      // This method should be called from the server side or refactored
      return false;
    } catch (error) {
      console.warn('Translation check failed:', error);
      return false;
    }
  }

  // Generate translation entries for missing teams
  generateMissingTranslations(missingTeams: string[]): Record<string, any> {
    const translations: Record<string, any> = {};

    missingTeams.forEach(teamName => {
      // Generate basic translations (you can enhance this with real translations)
      translations[teamName] = {
        'zh': this.generateChineseTranslation(teamName),
        'zh-hk': this.generateChineseTranslation(teamName),
        'zh-tw': this.generateChineseTranslation(teamName),
        'es': teamName,
        'de': teamName,
        'it': teamName,
        'pt': teamName
      };
    });

    return translations;
  }

  // Basic Chinese translation generator (enhance with real translations)
  private generateChineseTranslation(teamName: string): string {
    // Common Brazilian/South American team translations
    const commonTranslations: Record<string, string> = {
      // Brazilian teams
      'Ferroviária': '费罗维亚里亚',
      'Amazonas': '亚马逊',
      'Coritiba': '科里蒂巴',
      'Chapecoense': '沙佩科恩斯',
      'Grêmio': '格雷米奥',
      'Internacional': '国际',
      'Santos': '桑托斯',
      'Botafogo': '博塔弗戈',
      'Vasco': '华斯高',
      'Athletico Paranaense': '巴拉那竞技',
      
      // Argentine teams  
      'Tigre': '老虎',
      'Huracán': '飓风',
      'Newell\'s Old Boys': '纽韦尔老男孩',
      'Córdoba': '科尔多瓦',
      'Lanús': '拉努斯',
      
      // Other South American
      'Palestino': '巴勒斯坦人',
      'Deportes Iquique': '伊基克体育',
      
      // Add more as needed...
    };

    return commonTranslations[teamName] || teamName;
  }

  // Analyze fixtures and generate report
  analyzeFixtures(fixtures: any[]): void {
    const result = this.extractTeamNames(fixtures);
    
    console.log('🔍 Team Name Analysis Report:');
    console.log(`Total fixtures processed: ${fixtures.length}`);
    console.log(`Total team appearances: ${result.totalTeams}`);
    console.log(`Unique teams found: ${result.uniqueTeams}`);
    console.log(`Teams missing translations: ${result.missingTranslations.length}`);
    
    // Show top 20 most frequent teams
    console.log('\n📊 Top 20 Most Frequent Teams:');
    result.teams.slice(0, 20).forEach((team, index) => {
      console.log(`${index + 1}. ${team.teamName} (${team.country} - ${team.leagueName}) - ${team.frequency} matches`);
    });

    // Show teams missing translations
    if (result.missingTranslations.length > 0) {
      console.log('\n❌ Teams Missing Translations (first 50):');
      result.missingTranslations.slice(0, 50).forEach((team, index) => {
        console.log(`${index + 1}. ${team}`);
      });
    }

    return result;
  }
}

export const teamNameExtractor = new TeamNameExtractor();
export type { TeamNameAnalysis, ExtractionResult };
