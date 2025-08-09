
interface TeamMapping {
  id: number;
  name: string;
  leagueId: number;
  leagueName: string;
  frequency: number;
}

interface LeagueTeamData {
  leagueId: number;
  leagueName: string;
  teams: Array<{
    id: number;
    name: string;
    frequency: number;
  }>;
}

class TeamMappingExtractor {
  private targetLeagueIds = [
    38, 15, 2, 4, 10, 11, 848, 886, 1022, 772, 71, 3, 5, 531, 22, 72, 73, 75,
    76, 233, 667, 940, 908, 1169, 23, 1077, 253, 850, 893, 921, 130, 128, 493,
    239, 265, 237, 235, 743
  ];

  private teamFrequencyMap = new Map<string, TeamMapping>();

  /**
   * Extract all teams from fixtures and build frequency map
   */
  extractTeamsFromFixtures(fixtures: any[]): LeagueTeamData[] {
    console.log(`🔍 [TeamMappingExtractor] Analyzing ${fixtures.length} fixtures from target leagues`);
    
    // Clear previous data
    this.teamFrequencyMap.clear();

    // Process each fixture
    fixtures.forEach((fixture) => {
      if (!fixture?.league?.id || !this.targetLeagueIds.includes(fixture.league.id)) {
        return; // Skip if not in target leagues
      }

      const leagueId = fixture.league.id;
      const leagueName = fixture.league.name || `League ${leagueId}`;

      // Process home team
      if (fixture.teams?.home?.id && fixture.teams?.home?.name) {
        this.addTeamToMap(
          fixture.teams.home.id,
          fixture.teams.home.name,
          leagueId,
          leagueName
        );
      }

      // Process away team
      if (fixture.teams?.away?.id && fixture.teams?.away?.name) {
        this.addTeamToMap(
          fixture.teams.away.id,
          fixture.teams.away.name,
          leagueId,
          leagueName
        );
      }
    });

    return this.generateLeagueTeamData();
  }

  /**
   * Add team to frequency map
   */
  private addTeamToMap(teamId: number, teamName: string, leagueId: number, leagueName: string) {
    const key = `${teamId}-${teamName}`;
    
    if (this.teamFrequencyMap.has(key)) {
      const existing = this.teamFrequencyMap.get(key)!;
      existing.frequency += 1;
    } else {
      this.teamFrequencyMap.set(key, {
        id: teamId,
        name: teamName,
        leagueId,
        leagueName,
        frequency: 1
      });
    }
  }

  /**
   * Generate organized league team data
   */
  private generateLeagueTeamData(): LeagueTeamData[] {
    const leagueMap = new Map<number, LeagueTeamData>();

    // Group teams by league
    this.teamFrequencyMap.forEach((team) => {
      if (!leagueMap.has(team.leagueId)) {
        leagueMap.set(team.leagueId, {
          leagueId: team.leagueId,
          leagueName: team.leagueName,
          teams: []
        });
      }

      leagueMap.get(team.leagueId)!.teams.push({
        id: team.id,
        name: team.name,
        frequency: team.frequency
      });
    });

    // Sort teams within each league by frequency (most common first)
    leagueMap.forEach((leagueData) => {
      leagueData.teams.sort((a, b) => b.frequency - a.frequency);
    });

    // Convert to array and sort by league priority
    const result = Array.from(leagueMap.values());
    
    // Sort leagues by priority (same order as targetLeagueIds)
    result.sort((a, b) => {
      const aIndex = this.targetLeagueIds.indexOf(a.leagueId);
      const bIndex = this.targetLeagueIds.indexOf(b.leagueId);
      return aIndex - bIndex;
    });

    return result;
  }

  /**
   * Get all unique teams sorted by frequency
   */
  getAllTeamsSortedByFrequency(): TeamMapping[] {
    const teams = Array.from(this.teamFrequencyMap.values());
    return teams.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Generate translation template for all teams
   */
  generateTranslationTemplate(language: string = 'zh-hk'): string {
    const teams = this.getAllTeamsSortedByFrequency();
    
    let template = `// Translation mappings for ${language} - Generated from MyNewLeague2 fixtures\n`;
    template += `// Total teams: ${teams.length}\n`;
    template += `// Sorted by frequency (most common first)\n\n`;

    // Group by league for better organization
    const leagueGroups = this.generateLeagueTeamData();
    
    leagueGroups.forEach((leagueData) => {
      template += `  // ${leagueData.leagueName} (League ID: ${leagueData.leagueId})\n`;
      
      leagueData.teams.slice(0, 20).forEach((team) => { // Limit to top 20 per league
        template += `  '${team.name}': '${team.name}', // ID: ${team.id}, Frequency: ${team.frequency}\n`;
      });
      
      template += '\n';
    });

    return template;
  }

  /**
   * Generate comprehensive team analysis report
   */
  generateAnalysisReport(): {
    totalTeams: number;
    totalFixtures: number;
    leagueBreakdown: Array<{
      leagueId: number;
      leagueName: string;
      teamCount: number;
      topTeams: Array<{ name: string; frequency: number }>;
    }>;
    mostCommonTeams: Array<{ name: string; frequency: number; leagueName: string }>;
  } {
    const leagueData = this.generateLeagueTeamData();
    const allTeams = this.getAllTeamsSortedByFrequency();

    return {
      totalTeams: allTeams.length,
      totalFixtures: allTeams.reduce((sum, team) => sum + team.frequency, 0),
      leagueBreakdown: leagueData.map(league => ({
        leagueId: league.leagueId,
        leagueName: league.leagueName,
        teamCount: league.teams.length,
        topTeams: league.teams.slice(0, 5).map(team => ({
          name: team.name,
          frequency: team.frequency
        }))
      })),
      mostCommonTeams: allTeams.slice(0, 20).map(team => ({
        name: team.name,
        frequency: team.frequency,
        leagueName: team.leagueName
      }))
    };
  }

  /**
   * Get teams missing from smart translation
   */
  getMissingTranslations(currentLanguage: string): string[] {
    const allTeams = this.getAllTeamsSortedByFrequency();
    const missingTeams: string[] = [];
    
    // Check which teams need translations
    allTeams.forEach(team => {
      // This would integrate with your smart translation system
      // For now, we'll assume teams that are not translated are missing
      const teamName = team.name;
      
      // Skip teams that are too short or likely acronyms
      if (teamName.length <= 3 && /^[A-Z]+$/.test(teamName)) {
        return;
      }
      
      // Add to missing if no proper translation exists
      missingTeams.push(teamName);
    });
    
    return missingTeams;
  }

  /**
   * Generate translation suggestions based on team frequency and league context
   */
  generateTranslationSuggestions(): Array<{
    teamName: string;
    frequency: number;
    leagueName: string;
    country: string;
    suggestedTranslation: string;
  }> {
    const allTeams = this.getAllTeamsSortedByFrequency();
    
    return allTeams.map(team => ({
      teamName: team.name,
      frequency: team.frequency,
      leagueName: team.leagueName,
      country: this.getCountryFromLeagueName(team.leagueName),
      suggestedTranslation: this.generateSmartTranslationSuggestion(team.name, team.leagueName)
    }));
  }

  private getCountryFromLeagueName(leagueName: string): string {
    const lowerName = leagueName.toLowerCase();
    
    if (lowerName.includes('brazil') || lowerName.includes('serie a') || lowerName.includes('serie b')) {
      return 'Brazil';
    }
    if (lowerName.includes('argentina') || lowerName.includes('primera division')) {
      return 'Argentina';
    }
    if (lowerName.includes('premier league') && lowerName.includes('egypt')) {
      return 'Egypt';
    }
    if (lowerName.includes('segunda division')) {
      return 'Spain';
    }
    if (lowerName.includes('liga mx') || lowerName.includes('expansion mx')) {
      return 'Mexico';
    }
    
    return 'Unknown';
  }

  private generateSmartTranslationSuggestion(teamName: string, leagueName: string): string {
    // This could integrate with your existing translation logic
    // For now, return the original name as a placeholder
    return teamName;
  }
}

// Export singleton instance
export const teamMappingExtractor = new TeamMappingExtractor();

// Export types
export type { TeamMapping, LeagueTeamData };
