
import axios from 'axios';

interface APIFootballTeam {
  id: number;
  name: string;
  code: string;
  country: string;
  founded: number;
  national: boolean;
  logo: string;
}

interface TeamTranslation {
  [key: string]: {
    zh: string;
    'zh-hk': string;
    'zh-tw': string;
    es: string;
    de: string;
    it: string;
    pt: string;
  };
}

class TeamMappingService {
  private apiKey: string;
  private baseUrl: string = 'https://v3.football.api-sports.io';

  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY || '';
  }

  // Fetch all teams from API-Football
  async fetchAllTeams(): Promise<APIFootballTeam[]> {
    console.log('🔄 [TeamMapping] Starting to fetch all teams from API-Football...');
    
    const allTeams: APIFootballTeam[] = [];
    let page = 1;
    let hasMorePages = true;

    try {
      while (hasMorePages) {
        console.log(`📄 [TeamMapping] Fetching page ${page}...`);
        
        const response = await axios.get(`${this.baseUrl}/teams`, {
          headers: {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': 'v3.football.api-sports.io'
          },
          params: {
            page: page
          }
        });

        if (response.data && response.data.response) {
          const teams = response.data.response.map((item: any) => item.team);
          allTeams.push(...teams);
          
          console.log(`✅ [TeamMapping] Page ${page}: ${teams.length} teams fetched`);
          
          // Check if there are more pages
          const paging = response.data.paging;
          hasMorePages = paging && paging.current < paging.total;
          page++;
          
          // Rate limiting - wait 1 second between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          hasMorePages = false;
        }
      }

      console.log(`🎉 [TeamMapping] Successfully fetched ${allTeams.length} teams total`);
      return allTeams;
    } catch (error) {
      console.error('❌ [TeamMapping] Error fetching teams:', error);
      return [];
    }
  }

  // Generate smart translations using AI/heuristic approaches
  private generateTranslations(teamName: string, country: string): TeamTranslation[string] {
    // This is a simplified version - in production, you might want to use
    // translation APIs or more sophisticated mapping
    
    const translations: TeamTranslation[string] = {
      zh: teamName, // Default to original name
      'zh-hk': teamName,
      'zh-tw': teamName,
      es: teamName,
      de: teamName,
      it: teamName,
      pt: teamName
    };

    // Apply some basic translation patterns based on common team names
    const lowerName = teamName.toLowerCase();
    
    // Common football club patterns
    if (lowerName.includes('real madrid')) {
      translations.zh = '皇家马德里';
      translations['zh-hk'] = '皇家馬德里';
      translations['zh-tw'] = '皇家馬德里';
    } else if (lowerName.includes('barcelona')) {
      translations.zh = '巴塞罗那';
      translations['zh-hk'] = '巴塞隆拿';
      translations['zh-tw'] = '巴塞隆納';
    } else if (lowerName.includes('manchester united')) {
      translations.zh = '曼联';
      translations['zh-hk'] = '曼聯';
      translations['zh-tw'] = '曼聯';
    } else if (lowerName.includes('manchester city')) {
      translations.zh = '曼城';
      translations['zh-hk'] = '曼城';
      translations['zh-tw'] = '曼城';
    } else if (lowerName.includes('liverpool')) {
      translations.zh = '利物浦';
      translations['zh-hk'] = '利物浦';
      translations['zh-tw'] = '利物浦';
    } else if (lowerName.includes('chelsea')) {
      translations.zh = '切尔西';
      translations['zh-hk'] = '車路士';
      translations['zh-tw'] = '切爾西';
    } else if (lowerName.includes('arsenal')) {
      translations.zh = '阿森纳';
      translations['zh-hk'] = '阿仙奴';
      translations['zh-tw'] = '阿森納';
    }
    
    // Add country-specific patterns
    if (country.toLowerCase() === 'spain') {
      // Apply Spanish team naming conventions
      if (lowerName.includes('atletico')) {
        translations.es = teamName.replace(/atletico/gi, 'Atlético');
      }
    }

    return translations;
  }

  // Convert teams to translation format
  convertTeamsToTranslations(teams: APIFootballTeam[]): TeamTranslation {
    console.log(`🔄 [TeamMapping] Converting ${teams.length} teams to translations...`);
    
    const translations: TeamTranslation = {};
    
    teams.forEach(team => {
      if (team.name && team.name.trim()) {
        const cleanName = team.name.trim();
        translations[cleanName] = this.generateTranslations(cleanName, team.country);
      }
    });

    console.log(`✅ [TeamMapping] Generated translations for ${Object.keys(translations).length} teams`);
    return translations;
  }

  // Save translations to file
  async saveTranslationsToFile(translations: TeamTranslation, filePath: string): Promise<void> {
    const fs = require('fs').promises;
    
    try {
      // Generate TypeScript code for the translations
      const translationCode = `// Auto-generated team translations from API-Football
// Generated at: ${new Date().toISOString()}

interface TeamTranslation {
  [key: string]: {
    zh: string;
    'zh-hk': string;
    'zh-tw': string;
    es: string;
    de: string;
    it: string;
    pt: string;
  };
}

export const autoGeneratedTeamTranslations: TeamTranslation = ${JSON.stringify(translations, null, 2)};
`;

      await fs.writeFile(filePath, translationCode, 'utf8');
      console.log(`✅ [TeamMapping] Translations saved to ${filePath}`);
    } catch (error) {
      console.error('❌ [TeamMapping] Error saving translations:', error);
    }
  }

  // Main method to generate all team mappings
  async generateAllTeamMappings(): Promise<TeamTranslation> {
    console.log('🚀 [TeamMapping] Starting complete team mapping generation...');
    
    const teams = await this.fetchAllTeams();
    if (teams.length === 0) {
      console.warn('⚠️ [TeamMapping] No teams fetched, returning empty translations');
      return {};
    }

    const translations = this.convertTeamsToTranslations(teams);
    
    // Save to file for backup/reference
    await this.saveTranslationsToFile(translations, 'generated-team-translations.ts');
    
    return translations;
  }

  // Merge with existing translations (prioritizing manual ones)
  mergeWithExistingTranslations(existing: TeamTranslation, generated: TeamTranslation): TeamTranslation {
    console.log('🔄 [TeamMapping] Merging existing and generated translations...');
    
    const merged = { ...generated };
    
    // Override with existing translations (manual ones take priority)
    Object.keys(existing).forEach(teamName => {
      merged[teamName] = existing[teamName];
    });

    console.log(`✅ [TeamMapping] Merged translations: ${Object.keys(merged).length} total teams`);
    return merged;
  }
}

export const teamMappingService = new TeamMappingService();
