
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

  // Expanded priority league IDs for comprehensive team translation database
  private priorityLeagueIds = [
    38, 15, 2, 4, 10, 11, 848, 886, 1022, 772, 71, 3, 5, 531, 22, 72, 73, 75,
    76, 233, 667, 940, 908, 1169, 23, 1077, 253, 850, 893, 921, 130, 128, 493,
    239, 265, 237, 235, 743
  ];

  async initializeTeamTranslations(language: string = 'zh') {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      console.log(`🌐 [SmartTranslation] Initializing team translations for language: ${language}`);
      console.log(`📋 [SmartTranslation] Processing ${this.priorityLeagueIds.length} priority leagues`);
      
      // Process leagues in batches to avoid overwhelming the API
      const batchSize = 5;
      const totalBatches = Math.ceil(this.priorityLeagueIds.length / batchSize);
      
      for (let i = 0; i < this.priorityLeagueIds.length; i += batchSize) {
        const batch = this.priorityLeagueIds.slice(i, i + batchSize);
        const currentBatch = Math.floor(i / batchSize) + 1;
        
        console.log(`🔄 [SmartTranslation] Processing batch ${currentBatch}/${totalBatches}: leagues ${batch.join(', ')}`);
        
        const teamPromises = batch.map(leagueId => 
          this.fetchLeagueTeams(leagueId)
        );

        const leagueTeamsResults = await Promise.allSettled(teamPromises);
        
        leagueTeamsResults.forEach((result, batchIndex) => {
          const leagueId = batch[batchIndex];
          if (result.status === 'fulfilled' && result.value) {
            this.leagueTeamsCache[leagueId] = result.value;
            console.log(`✅ [SmartTranslation] Cached ${result.value.length} teams for league ${leagueId}`);
          } else {
            console.warn(`⚠️ [SmartTranslation] Failed to fetch teams for league ${leagueId}:`, result.status === 'rejected' ? result.reason : 'Unknown error');
          }
        });
        
        // Small delay between batches to be API-friendly
        if (i + batchSize < this.priorityLeagueIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const totalCachedLeagues = Object.keys(this.leagueTeamsCache).length;
      const totalCachedTeams = Object.values(this.leagueTeamsCache).reduce((sum, teams) => sum + teams.length, 0);
      
      console.log(`✅ [SmartTranslation] Initialization complete: ${totalCachedLeagues} leagues, ${totalCachedTeams} total teams cached`);
      
      // Build dynamic translation patterns from fetched team data
      this.buildDynamicTranslationPatterns(language);
      
    } catch (error) {
      console.error('❌ [SmartTranslation] Error initializing translations:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  private buildDynamicTranslationPatterns(language: string) {
    console.log(`🔧 [SmartTranslation] Building dynamic translation patterns for ${language}`);
    
    let patternsBuilt = 0;
    
    // Analyze all cached team names to identify patterns
    Object.values(this.leagueTeamsCache).forEach(teams => {
      teams.forEach(team => {
        const teamName = team.name;
        
        // Build cache for common patterns we haven't manually defined
        if (!this.getManualTranslation(teamName, language)) {
          const smartTranslation = this.getSmartTranslation(teamName, language);
          if (smartTranslation && smartTranslation !== teamName) {
            const cacheKey = `${teamName.toLowerCase()}_${language}`;
            this.teamCache.set(cacheKey, smartTranslation);
            patternsBuilt++;
          }
        }
      });
    });
    
    console.log(`🎯 [SmartTranslation] Built ${patternsBuilt} dynamic translation patterns`);
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

    console.log(`🤖 [SmartTranslation] Translating "${teamName}" to ${language}`);

    // Check cache first
    const cacheKey = `${teamName.toLowerCase()}_${language}`;
    if (this.teamCache.has(cacheKey)) {
      const cached = this.teamCache.get(cacheKey)!;
      console.log(`💾 [SmartTranslation] Cache hit: "${teamName}" -> "${cached}"`);
      return cached;
    }

    // Try exact match from manual translations (keep your existing ones as fallback)
    const manualTranslation = this.getManualTranslation(teamName, language);
    if (manualTranslation && manualTranslation !== teamName) {
      console.log(`📖 [SmartTranslation] Manual translation: "${teamName}" -> "${manualTranslation}"`);
      this.teamCache.set(cacheKey, manualTranslation);
      return manualTranslation;
    }

    // Smart pattern matching for common team names
    const smartTranslation = this.getSmartTranslation(teamName, language);
    if (smartTranslation && smartTranslation !== teamName) {
      console.log(`🧠 [SmartTranslation] Smart pattern match: "${teamName}" -> "${smartTranslation}"`);
      this.teamCache.set(cacheKey, smartTranslation);
      return smartTranslation;
    }

    // Cache the original name to avoid repeated processing
    console.log(`❌ [SmartTranslation] No translation found for: "${teamName}"`);
    this.teamCache.set(cacheKey, teamName);
    return teamName;
  }

  private getManualTranslation(teamName: string, language: string): string | null {
    // Comprehensive manual translations database
    const manualTranslations: Record<string, Record<string, string>> = {
      // Premier League (England)
      'Manchester United': {
        'zh': '曼聯', 'zh-hk': '曼聯', 'zh-tw': '曼聯',
        'es': 'Manchester United', 'de': 'Manchester United', 'it': 'Manchester United', 'pt': 'Manchester United'
      },
      'Manchester City': {
        'zh': '曼城', 'zh-hk': '曼城', 'zh-tw': '曼城',
        'es': 'Manchester City', 'de': 'Manchester City', 'it': 'Manchester City', 'pt': 'Manchester City'
      },
      'Liverpool': {
        'zh': '利物浦', 'zh-hk': '利物浦', 'zh-tw': '利物浦',
        'es': 'Liverpool', 'de': 'Liverpool', 'it': 'Liverpool', 'pt': 'Liverpool'
      },
      'Arsenal': {
        'zh': '阿森纳', 'zh-hk': '阿仙奴', 'zh-tw': '阿森納',
        'es': 'Arsenal', 'de': 'Arsenal', 'it': 'Arsenal', 'pt': 'Arsenal'
      },
      'Chelsea': {
        'zh': '切尔西', 'zh-hk': '車路士', 'zh-tw': '切爾西',
        'es': 'Chelsea', 'de': 'Chelsea', 'it': 'Chelsea', 'pt': 'Chelsea'
      },
      'Tottenham': {
        'zh': '热刺', 'zh-hk': '熱刺', 'zh-tw': '熱刺',
        'es': 'Tottenham', 'de': 'Tottenham', 'it': 'Tottenham', 'pt': 'Tottenham'
      },
      'Newcastle': {
        'zh': '纽卡斯尔', 'zh-hk': '紐卡素', 'zh-tw': '紐卡索',
        'es': 'Newcastle', 'de': 'Newcastle', 'it': 'Newcastle', 'pt': 'Newcastle'
      },
      
      // La Liga (Spain)
      'Real Madrid': {
        'zh': '皇家马德里', 'zh-hk': '皇家馬德里', 'zh-tw': '皇家馬德里',
        'es': 'Real Madrid', 'de': 'Real Madrid', 'it': 'Real Madrid', 'pt': 'Real Madrid'
      },
      'Barcelona': {
        'zh': '巴塞罗那', 'zh-hk': '巴塞隆拿', 'zh-tw': '巴塞隆納',
        'es': 'Barcelona', 'de': 'Barcelona', 'it': 'Barcelona', 'pt': 'Barcelona'
      },
      'Atletico Madrid': {
        'zh': '马德里竞技', 'zh-hk': '馬德里體育會', 'zh-tw': '馬德里競技',
        'es': 'Atlético Madrid', 'de': 'Atlético Madrid', 'it': 'Atlético Madrid', 'pt': 'Atlético Madrid'
      },
      'Sevilla': {
        'zh': '塞维利亚', 'zh-hk': '西維爾', 'zh-tw': '塞維利亞',
        'es': 'Sevilla', 'de': 'Sevilla', 'it': 'Siviglia', 'pt': 'Sevilla'
      },
      'Valencia': {
        'zh': '瓦伦西亚', 'zh-hk': '華倫西亞', 'zh-tw': '瓦倫西亞',
        'es': 'Valencia', 'de': 'Valencia', 'it': 'Valencia', 'pt': 'Valencia'
      },
      'Villarreal': {
        'zh': '比利亚雷亚尔', 'zh-hk': '維拉利爾', 'zh-tw': '比利亞雷亞爾',
        'es': 'Villarreal', 'de': 'Villarreal', 'it': 'Villarreal', 'pt': 'Villarreal'
      },
      
      // Serie A (Italy)
      'Juventus': {
        'zh': '尤文图斯', 'zh-hk': '祖雲達斯', 'zh-tw': '尤文圖斯',
        'es': 'Juventus', 'de': 'Juventus', 'it': 'Juventus', 'pt': 'Juventus'
      },
      'AC Milan': {
        'zh': 'AC米兰', 'zh-hk': 'AC米蘭', 'zh-tw': 'AC米蘭',
        'es': 'AC Milan', 'de': 'AC Mailand', 'it': 'AC Milan', 'pt': 'AC Milan'
      },
      'Inter Milan': {
        'zh': '国际米兰', 'zh-hk': '國際米蘭', 'zh-tw': '國際米蘭',
        'es': 'Inter de Milán', 'de': 'Inter Mailand', 'it': 'Inter', 'pt': 'Inter de Milão'
      },
      'Roma': {
        'zh': '罗马', 'zh-hk': '羅馬', 'zh-tw': '羅馬',
        'es': 'Roma', 'de': 'AS Rom', 'it': 'Roma', 'pt': 'Roma'
      },
      'Napoli': {
        'zh': '那不勒斯', 'zh-hk': '拿坡里', 'zh-tw': '那不勒斯',
        'es': 'Nápoles', 'de': 'Neapel', 'it': 'Napoli', 'pt': 'Nápoles'
      },
      'Lazio': {
        'zh': '拉齐奥', 'zh-hk': '拉素', 'zh-tw': '拉齊奧',
        'es': 'Lazio', 'de': 'Lazio', 'it': 'Lazio', 'pt': 'Lazio'
      },
      'Atalanta': {
        'zh': '亚特兰大', 'zh-hk': '阿特蘭大', 'zh-tw': '亞特蘭大',
        'es': 'Atalanta', 'de': 'Atalanta', 'it': 'Atalanta', 'pt': 'Atalanta'
      },
      
      // Bundesliga (Germany)
      'Bayern Munich': {
        'zh': '拜仁慕尼黑', 'zh-hk': '拜仁慕尼黑', 'zh-tw': '拜仁慕尼黑',
        'es': 'Bayern Múnich', 'de': 'Bayern München', 'it': 'Bayern Monaco', 'pt': 'Bayern de Munique'
      },
      'Borussia Dortmund': {
        'zh': '多特蒙德', 'zh-hk': '多蒙特', 'zh-tw': '多特蒙德',
        'es': 'Borussia Dortmund', 'de': 'Borussia Dortmund', 'it': 'Borussia Dortmund', 'pt': 'Borussia Dortmund'
      },
      'RB Leipzig': {
        'zh': '莱比锡红牛', 'zh-hk': '萊比錫', 'zh-tw': '萊比錫紅牛',
        'es': 'RB Leipzig', 'de': 'RB Leipzig', 'it': 'RB Leipzig', 'pt': 'RB Leipzig'
      },
      'Bayer Leverkusen': {
        'zh': '勒沃库森', 'zh-hk': '利華古遜', 'zh-tw': '勒沃庫森',
        'es': 'Bayer Leverkusen', 'de': 'Bayer Leverkusen', 'it': 'Bayer Leverkusen', 'pt': 'Bayer Leverkusen'
      },
      
      // Ligue 1 (France)
      'Paris Saint-Germain': {
        'zh': '巴黎圣日耳曼', 'zh-hk': '巴黎聖日耳曼', 'zh-tw': '巴黎聖日耳曼',
        'es': 'Paris Saint-Germain', 'de': 'Paris Saint-Germain', 'it': 'Paris Saint-Germain', 'pt': 'Paris Saint-Germain'
      },
      'Marseille': {
        'zh': '马赛', 'zh-hk': '馬賽', 'zh-tw': '馬賽',
        'es': 'Marsella', 'de': 'Marseille', 'it': 'Marsiglia', 'pt': 'Marselha'
      },
      'Lyon': {
        'zh': '里昂', 'zh-hk': '里昂', 'zh-tw': '里昂',
        'es': 'Lyon', 'de': 'Lyon', 'it': 'Lione', 'pt': 'Lyon'
      },
      'Monaco': {
        'zh': '摩纳哥', 'zh-hk': '摩納哥', 'zh-tw': '摩納哥',
        'es': 'Mónaco', 'de': 'Monaco', 'it': 'Monaco', 'pt': 'Mônaco'
      },
      
      // MLS Teams (Major League Soccer)
      'Los Angeles Galaxy': {
        'zh': '洛杉矶银河', 'zh-hk': '洛杉磯銀河', 'zh-tw': '洛杉磯銀河',
        'es': 'LA Galaxy', 'de': 'LA Galaxy', 'it': 'LA Galaxy', 'pt': 'LA Galaxy'
      },
      'Inter Miami': {
        'zh': '国际迈阿密', 'zh-hk': '國際邁阿密', 'zh-tw': '國際邁阿密',
        'es': 'Inter Miami', 'de': 'Inter Miami', 'it': 'Inter Miami', 'pt': 'Inter Miami'
      },
      'New York Red Bulls': {
        'zh': '纽约红牛', 'zh-hk': '紐約紅牛', 'zh-tw': '紐約紅牛',
        'es': 'New York Red Bulls', 'de': 'New York Red Bulls', 'it': 'New York Red Bulls', 'pt': 'New York Red Bulls'
      },
      'Seattle Sounders': {
        'zh': '西雅图海湾人', 'zh-hk': '西雅圖海灣人', 'zh-tw': '西雅圖海灣人',
        'es': 'Seattle Sounders', 'de': 'Seattle Sounders', 'it': 'Seattle Sounders', 'pt': 'Seattle Sounders'
      },
      
      // Portuguese Liga
      'Porto': {
        'zh': '波尔图', 'zh-hk': '波圖', 'zh-tw': '波爾圖',
        'es': 'Oporto', 'de': 'Porto', 'it': 'Porto', 'pt': 'Porto'
      },
      'Benfica': {
        'zh': '本菲卡', 'zh-hk': '賓菲加', 'zh-tw': '本菲卡',
        'es': 'Benfica', 'de': 'Benfica', 'it': 'Benfica', 'pt': 'Benfica'
      },
      'Sporting CP': {
        'zh': '里斯本竞技', 'zh-hk': '士砵亭', 'zh-tw': '里斯本體育',
        'es': 'Sporting Lisboa', 'de': 'Sporting Lissabon', 'it': 'Sporting Lisbona', 'pt': 'Sporting'
      },
      
      // Brazilian Teams
      'Flamengo': {
        'zh': '弗拉门戈', 'zh-hk': '法林明高', 'zh-tw': '弗拉門戈',
        'es': 'Flamengo', 'de': 'Flamengo', 'it': 'Flamengo', 'pt': 'Flamengo'
      },
      'Palmeiras': {
        'zh': '帕尔梅拉斯', 'zh-hk': '彭美拉斯', 'zh-tw': '帕爾梅拉斯',
        'es': 'Palmeiras', 'de': 'Palmeiras', 'it': 'Palmeiras', 'pt': 'Palmeiras'
      },
      'Corinthians': {
        'zh': '科林蒂安', 'zh-hk': '哥連泰斯', 'zh-tw': '科林蒂安',
        'es': 'Corinthians', 'de': 'Corinthians', 'it': 'Corinthians', 'pt': 'Corinthians'
      },
      'Santos': {
        'zh': '桑托斯', 'zh-hk': '山度士', 'zh-tw': '桑托斯',
        'es': 'Santos', 'de': 'Santos', 'it': 'Santos', 'pt': 'Santos'
      },
      
      // Argentine Teams
      'Boca Juniors': {
        'zh': '博卡青年', 'zh-hk': '小保加', 'zh-tw': '博卡青年',
        'es': 'Boca Juniors', 'de': 'Boca Juniors', 'it': 'Boca Juniors', 'pt': 'Boca Juniors'
      },
      'River Plate': {
        'zh': '河床', 'zh-hk': '河床', 'zh-tw': '河床',
        'es': 'River Plate', 'de': 'River Plate', 'it': 'River Plate', 'pt': 'River Plate'
      },
      
      // National Teams
      'Brazil': {
        'zh': '巴西', 'zh-hk': '巴西', 'zh-tw': '巴西',
        'es': 'Brasil', 'de': 'Brasilien', 'it': 'Brasile', 'pt': 'Brasil'
      },
      'Argentina': {
        'zh': '阿根廷', 'zh-hk': '阿根廷', 'zh-tw': '阿根廷',
        'es': 'Argentina', 'de': 'Argentinien', 'it': 'Argentina', 'pt': 'Argentina'
      },
      'Spain': {
        'zh': '西班牙', 'zh-hk': '西班牙', 'zh-tw': '西班牙',
        'es': 'España', 'de': 'Spanien', 'it': 'Spagna', 'pt': 'Espanha'
      },
      'Germany': {
        'zh': '德国', 'zh-hk': '德國', 'zh-tw': '德國',
        'es': 'Alemania', 'de': 'Deutschland', 'it': 'Germania', 'pt': 'Alemanha'
      },
      'France': {
        'zh': '法国', 'zh-hk': '法國', 'zh-tw': '法國',
        'es': 'Francia', 'de': 'Frankreich', 'it': 'Francia', 'pt': 'França'
      },
      'England': {
        'zh': '英格兰', 'zh-hk': '英格蘭', 'zh-tw': '英格蘭',
        'es': 'Inglaterra', 'de': 'England', 'it': 'Inghilterra', 'pt': 'Inglaterra'
      },
      'Italy': {
        'zh': '意大利', 'zh-hk': '意大利', 'zh-tw': '意大利',
        'es': 'Italia', 'de': 'Italien', 'it': 'Italia', 'pt': 'Itália'
      },
      'Portugal': {
        'zh': '葡萄牙', 'zh-hk': '葡萄牙', 'zh-tw': '葡萄牙',
        'es': 'Portugal', 'de': 'Portugal', 'it': 'Portogallo', 'pt': 'Portugal'
      },
      'Netherlands': {
        'zh': '荷兰', 'zh-hk': '荷蘭', 'zh-tw': '荷蘭',
        'es': 'Países Bajos', 'de': 'Niederlande', 'it': 'Olanda', 'pt': 'Holanda'
      },
      'Mexico': {
        'zh': '墨西哥', 'zh-hk': '墨西哥', 'zh-tw': '墨西哥',
        'es': 'México', 'de': 'Mexiko', 'it': 'Messico', 'pt': 'México'
      },
      'United States': {
        'zh': '美国', 'zh-hk': '美國', 'zh-tw': '美國',
        'es': 'Estados Unidos', 'de': 'Vereinigte Staaten', 'it': 'Stati Uniti', 'pt': 'Estados Unidos'
      }
    };

    return manualTranslations[teamName]?.[language] || null;
  }

  private getSmartTranslation(teamName: string, language: string): string | null {
    // Support for more languages
    if (!['zh', 'zh-hk', 'zh-tw', 'es', 'de', 'it', 'pt'].includes(language)) {
      return null;
    }

    // Chinese language patterns
    if (['zh', 'zh-hk', 'zh-tw'].includes(language)) {
      const chinesePatterns = [
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
        
        // CF patterns
        { pattern: /^CF\s+(.+)$/, replacement: '$1' },
        { pattern: /^(.+)\s+CF$/, replacement: '$1' },
        
        // SC patterns (Sporting Club)
        { pattern: /^SC\s+(.+)$/, replacement: '$1體育會' },
        { pattern: /^(.+)\s+SC$/, replacement: '$1體育會' },
        
        // AC patterns
        { pattern: /^AC\s+(.+)$/, replacement: '$1' },
        { pattern: /^AS\s+(.+)$/, replacement: '$1' },
        
        // Internacional patterns
        { pattern: /^(.+)\s+Internacional$/, replacement: '$1國際' },
        
        // MLS patterns
        { pattern: /^(.+)\s+Galaxy$/, replacement: '$1銀河' },
        { pattern: /^(.+)\s+Sounders$/, replacement: '$1海灣人' },
        { pattern: /^(.+)\s+Fire$/, replacement: '$1火焰' },
        { pattern: /^(.+)\s+Revolution$/, replacement: '$1革命' },
        
        // European club patterns
        { pattern: /^Borussia\s+(.+)$/, replacement: '$1' },
        { pattern: /^Inter\s+(.+)$/, replacement: '國際$1' },
        { pattern: /^Sporting\s+(.+)$/, replacement: '$1體育' }
      ];

      for (const { pattern, replacement } of chinesePatterns) {
        if (pattern.test(teamName)) {
          return teamName.replace(pattern, replacement);
        }
      }
    }

    // Spanish language patterns
    if (language === 'es') {
      const spanishPatterns = [
        { pattern: /^FC\s+(.+)$/, replacement: '$1' },
        { pattern: /^(.+)\s+FC$/, replacement: '$1' },
        { pattern: /^(.+)\s+United$/, replacement: '$1 United' },
        { pattern: /^Real\s+(.+)$/, replacement: 'Real $1' },
        { pattern: /^Athletic\s+(.+)$/, replacement: 'Athletic $1' }
      ];

      for (const { pattern, replacement } of spanishPatterns) {
        if (pattern.test(teamName)) {
          return teamName.replace(pattern, replacement);
        }
      }
    }

    // German language patterns
    if (language === 'de') {
      const germanPatterns = [
        { pattern: /^FC\s+(.+)$/, replacement: '$1' },
        { pattern: /^(.+)\s+FC$/, replacement: '$1' },
        { pattern: /^(.+)\s+United$/, replacement: '$1 United' },
        { pattern: /^Borussia\s+(.+)$/, replacement: 'Borussia $1' },
        { pattern: /^Bayern\s+(.+)$/, replacement: 'Bayern $1' }
      ];

      for (const { pattern, replacement } of germanPatterns) {
        if (pattern.test(teamName)) {
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

  // Get translation database statistics
  getTranslationStats() {
    const totalLeagues = Object.keys(this.leagueTeamsCache).length;
    const totalTeams = Object.values(this.leagueTeamsCache).reduce((sum, teams) => sum + teams.length, 0);
    const totalCachedTranslations = this.teamCache.size;
    
    return {
      totalLeagues,
      totalTeams,
      totalCachedTranslations,
      leagueBreakdown: Object.entries(this.leagueTeamsCache).map(([leagueId, teams]) => ({
        leagueId: parseInt(leagueId),
        teamCount: teams.length
      })),
      isInitialized: totalLeagues > 0
    };
  }

  // Get all teams from the translation database
  getAllCachedTeams(): { leagueId: number; teams: TeamData[] }[] {
    return Object.entries(this.leagueTeamsCache).map(([leagueId, teams]) => ({
      leagueId: parseInt(leagueId),
      teams
    }));
  }

  // Force refresh translation data for a specific league
  async refreshLeagueTranslations(leagueId: number): Promise<boolean> {
    try {
      console.log(`🔄 [SmartTranslation] Refreshing translations for league ${leagueId}`);
      const teams = await this.fetchLeagueTeams(leagueId);
      
      if (teams) {
        this.leagueTeamsCache[leagueId] = teams;
        console.log(`✅ [SmartTranslation] Refreshed ${teams.length} teams for league ${leagueId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`❌ [SmartTranslation] Failed to refresh league ${leagueId}:`, error);
      return false;
    }
  }
}

export const smartTeamTranslation = new SmartTeamTranslation();
