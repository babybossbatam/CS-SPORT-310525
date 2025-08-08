
import { apiRequest } from './utils';

interface TeamData {
  id: number;
  name: string;
  logo: string;
}

interface LeagueTeams {
  [leagueId: number]: TeamData[];
}

class SmartTeamTranslation {
  private teamCache: Map<string, string> = new Map();
  private leagueTeamsCache: LeagueTeams = {};
  private isLoading = false;

  // Your priority league IDs
  private priorityLeagueIds = [
    38, 15, 2, 4, 10, 11, 848, 886, 1022, 772, 71, 3, 5, 531, 22, 72, 73, 75
  ];

  async initializeTeamTranslations(language: string = 'zh') {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      console.log(`🌐 [SmartTranslation] Initializing team translations for language: ${language}`);
      
      // Fetch teams from all priority leagues
      const teamPromises = this.priorityLeagueIds.map(leagueId => 
        this.fetchLeagueTeams(leagueId)
      );

      const leagueTeamsResults = await Promise.allSettled(teamPromises);
      
      leagueTeamsResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          this.leagueTeamsCache[this.priorityLeagueIds[index]] = result.value;
        }
      });

      console.log(`✅ [SmartTranslation] Cached teams from ${Object.keys(this.leagueTeamsCache).length} leagues`);
    } catch (error) {
      console.error('❌ [SmartTranslation] Error initializing translations:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async fetchLeagueTeams(leagueId: number): Promise<TeamData[] | null> {
    try {
      // First try to get teams from standings (more reliable)
      const standingsResponse = await apiRequest('GET', `/api/leagues/${leagueId}/standings`);
      
      if (standingsResponse.ok) {
        const standingsData = await standingsResponse.json();
        if (standingsData && standingsData.length > 0) {
          const teams = standingsData[0]?.league?.standings?.[0]?.map((standing: any) => ({
            id: standing.team.id,
            name: standing.team.name,
            logo: standing.team.logo
          }));
          
          if (teams && teams.length > 0) {
            console.log(`✅ [SmartTranslation] Fetched ${teams.length} teams from league ${leagueId} standings`);
            return teams;
          }
        }
      }

      // Fallback: try to get teams from recent fixtures
      const fixturesResponse = await apiRequest('GET', `/api/leagues/${leagueId}/fixtures`);
      
      if (fixturesResponse.ok) {
        const fixturesData = await fixturesResponse.json();
        if (fixturesData && fixturesData.length > 0) {
          const teamsSet = new Set<string>();
          const teams: TeamData[] = [];
          
          fixturesData.forEach((fixture: any) => {
            if (fixture.teams?.home && !teamsSet.has(fixture.teams.home.name)) {
              teamsSet.add(fixture.teams.home.name);
              teams.push({
                id: fixture.teams.home.id,
                name: fixture.teams.home.name,
                logo: fixture.teams.home.logo
              });
            }
            
            if (fixture.teams?.away && !teamsSet.has(fixture.teams.away.name)) {
              teamsSet.add(fixture.teams.away.name);
              teams.push({
                id: fixture.teams.away.id,
                name: fixture.teams.away.name,
                logo: fixture.teams.away.logo
              });
            }
          });
          
          console.log(`✅ [SmartTranslation] Fetched ${teams.length} teams from league ${leagueId} fixtures`);
          return teams;
        }
      }

      return null;
    } catch (error) {
      console.error(`❌ [SmartTranslation] Error fetching teams for league ${leagueId}:`, error);
      return null;
    }
  }

  // Smart translation with fallbacks
  translateTeamName(teamName: string, language: string = 'zh'): string {
    if (!teamName) return '';

    // Check cache first
    const cacheKey = `${teamName.toLowerCase()}_${language}`;
    if (this.teamCache.has(cacheKey)) {
      return this.teamCache.get(cacheKey)!;
    }

    // Try exact match from manual translations (keep your existing ones as fallback)
    const manualTranslation = this.getManualTranslation(teamName, language);
    if (manualTranslation && manualTranslation !== teamName) {
      this.teamCache.set(cacheKey, manualTranslation);
      return manualTranslation;
    }

    // Smart pattern matching for common team names
    const smartTranslation = this.getSmartTranslation(teamName, language);
    if (smartTranslation && smartTranslation !== teamName) {
      this.teamCache.set(cacheKey, smartTranslation);
      return smartTranslation;
    }

    // Cache the original name to avoid repeated processing
    this.teamCache.set(cacheKey, teamName);
    return teamName;
  }

  private getManualTranslation(teamName: string, language: string): string | null {
    // Keep your existing manual translations as a fallback
    const manualTranslations: Record<string, Record<string, string>> = {
      'Manchester United': {
        'zh': '曼聯',
        'zh-hk': '曼聯',
        'zh-tw': '曼聯'
      },
      'Manchester City': {
        'zh': '曼城',
        'zh-hk': '曼城',
        'zh-tw': '曼城'
      },
      'Liverpool': {
        'zh': '利物浦',
        'zh-hk': '利物浦',
        'zh-tw': '利物浦'
      },
      'Arsenal': {
        'zh': '阿森纳',
        'zh-hk': '阿仙奴',
        'zh-tw': '阿森納'
      },
      'Chelsea': {
        'zh': '切尔西',
        'zh-hk': '車路士',
        'zh-tw': '切爾西'
      },
      'Real Madrid': {
        'zh': '皇家马德里',
        'zh-hk': '皇家馬德里',
        'zh-tw': '皇家馬德里'
      },
      'Barcelona': {
        'zh': '巴塞罗那',
        'zh-hk': '巴塞隆拿',
        'zh-tw': '巴塞隆納'
      }
      // Add more as needed, but this will be supplemented by smart translation
    };

    return manualTranslations[teamName]?.[language] || null;
  }

  private getSmartTranslation(teamName: string, language: string): string | null {
    if (language !== 'zh' && language !== 'zh-hk' && language !== 'zh-tw') {
      return null;
    }

    // Smart pattern matching for common patterns
    const patterns = [
      // FC patterns
      { pattern: /^FC\s+(.+)$/, replacement: '$1' },
      { pattern: /^(.+)\s+FC$/, replacement: '$1' },
      
      // United patterns
      { pattern: /^(.+)\s+United$/, replacement: (language === 'zh-hk') ? '$1聯' : '$1联' },
      
      // City patterns  
      { pattern: /^(.+)\s+City$/, replacement: '$1城' },
      
      // Real patterns
      { pattern: /^Real\s+(.+)$/, replacement: '皇家$1' },
      
      // Athletic patterns
      { pattern: /^Athletic\s+(.+)$/, replacement: '$1體育' },
      
      // Remove common prefixes/suffixes that don't need translation
      { pattern: /^AC\s+(.+)$/, replacement: '$1' },
      { pattern: /^AS\s+(.+)$/, replacement: '$1' },
      { pattern: /^CF\s+(.+)$/, replacement: '$1' }
    ];

    for (const { pattern, replacement } of patterns) {
      if (pattern.test(teamName)) {
        if (typeof replacement === 'function') {
          return teamName.replace(pattern, replacement);
        } else {
          return teamName.replace(pattern, replacement);
        }
      }
    }

    return null;
  }

  // Get all teams for a specific league
  getLeagueTeams(leagueId: number): TeamData[] {
    return this.leagueTeamsCache[leagueId] || [];
  }

  // Clear cache when needed
  clearCache() {
    this.teamCache.clear();
    this.leagueTeamsCache = {};
  }
}

export const smartTeamTranslation = new SmartTeamTranslation();
