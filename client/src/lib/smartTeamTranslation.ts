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

class SmartTeamTranslation {
  private teamCache = new Map<string, string>();
  private leagueTeamsCache: Record<number, any[]> = {};
  private learnedTeamMappings = new Map<string, TeamTranslation>(); // Stores learned mappings
  private automatedMappingsCache: any = null; // Cache for automated mappings
  private automatedMappings = new Map<string, any>(); // Store automated mappings
  private translationCache = new Map<string, { translation: string; timestamp: number }>(); // Add missing cache
  private isLoading = false;

  constructor() {
    // Clear cache on initialization to ensure updated translations are used
    this.clearCache();
    this.fixCorruptedCache();
    this.loadLearnedMappings(); // Load existing learned mappings from localStorage
    this.integrateAutomatedMappings(); // Automatically integrate any generated mappings
    console.log('🔄 [SmartTranslation] Initialized with cache cleared for fresh translations and automated mappings integrated');
  }

  // Comprehensive team translations for popular leagues
  private popularLeagueTeams: TeamTranslation = {
    // Premier League (38)
    'Arsenal': {
      'zh': '阿森纳', 'zh-hk': '阿仙奴', 'zh-tw': '阿森納',
      'es': 'Arsenal', 'de': 'Arsenal', 'it': 'Arsenal', 'pt': 'Arsenal'
    },
    'Aston Villa': {
      'zh': '阿斯顿维拉', 'zh-hk': '阿士東維拉', 'zh-tw': '阿斯頓維拉',
      'es': 'Aston Villa', 'de': 'Aston Villa', 'it': 'Aston Villa', 'pt': 'Aston Villa'
    },
    'Brighton': {
      'zh': '布莱顿', 'zh-hk': '白禮頓', 'zh-tw': '布萊頓',
      'es': 'Brighton', 'de': 'Brighton', 'it': 'Brighton', 'pt': 'Brighton'
    },
    'Burnley': {
      'zh': '伯恩利', 'zh-hk': '般尼', 'zh-tw': '伯恩利',
      'es': 'Burnley', 'de': 'Burnley', 'it': 'Burnley', 'pt': 'Burnley'
    },
    'Chelsea': {
      'zh': '切尔西', 'zh-hk': '車路士', 'zh-tw': '切爾西',
      'es': 'Chelsea', 'de': 'Chelsea', 'it': 'Chelsea', 'pt': 'Chelsea'
    },
    'Crystal Palace': {
      'zh': '水晶宫', 'zh-hk': '水晶宮', 'zh-tw': '水晶宮',
      'es': 'Crystal Palace', 'de': 'Crystal Palace', 'it': 'Crystal Palace', 'pt': 'Crystal Palace'
    },
    'Everton': {
      'zh': '埃弗顿', 'zh-hk': '愛華頓', 'zh-tw': '埃弗頓',
      'es': 'Everton', 'de': 'Everton', 'it': 'Everton', 'pt': 'Everton'
    },
    'Fulham': {
      'zh': '富勒姆', 'zh-hk': '富咸', 'zh-tw': '富勒姆',
      'es': 'Fulham', 'de': 'Fulham', 'it': 'Fulham', 'pt': 'Fulham'
    },
    'Liverpool': {
      'zh': '利物浦', 'zh-hk': '利物浦', 'zh-tw': '利物浦',
      'es': 'Liverpool', 'de': 'Liverpool', 'it': 'Liverpool', 'pt': 'Liverpool'
    },
    'Manchester City': {
      'zh': '曼城', 'zh-hk': '曼城', 'zh-tw': '曼城',
      'es': 'Manchester City', 'de': 'Manchester City', 'it': 'Manchester City', 'pt': 'Manchester City'
    },
    'Manchester United': {
      'zh': '曼联', 'zh-hk': '曼聯', 'zh-tw': '曼聯',
      'es': 'Manchester United', 'de': 'Manchester United', 'it': 'Manchester United', 'pt': 'Manchester United'
    },
    'Newcastle': {
      'zh': '纽卡斯尔', 'zh-hk': '紐卡素', 'zh-tw': '紐卡斯爾',
      'es': 'Newcastle', 'de': 'Newcastle', 'it': 'Newcastle', 'pt': 'Newcastle'
    },
    'Tottenham': {
      'zh': '热刺', 'zh-hk': '熱刺', 'zh-tw': '熱刺',
      'es': 'Tottenham', 'de': 'Tottenham', 'it': 'Tottenham', 'pt': 'Tottenham'
    },
    'West Ham': {
      'zh': '西汉姆', 'zh-hk': '韋斯咸', 'zh-tw': '西漢姆',
      'es': 'West Ham', 'de': 'West Ham', 'it': 'West Ham', 'pt': 'West Ham'
    },
    'Wolves': {
      'zh': '狼队', 'zh-hk': '狼隊', 'zh-tw': '狼隊',
      'es': 'Wolves', 'de': 'Wolves', 'it': 'Wolves', 'pt': 'Wolves'
    },
    'Bournemouth': {
      'zh': '伯恩茅斯', 'zh-hk': '伯恩茅斯', 'zh-tw': '伯恩茅斯',
      'es': 'Bournemouth', 'de': 'Bournemouth', 'it': 'Bournemouth', 'pt': 'Bournemouth'
    },

    // La Liga (15)
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
      'zh': '塞维利亚', 'zh-hk': '西維爾', 'zh-tw': '塞維亞',
      'es': 'Sevilla', 'de': 'Sevilla', 'it': 'Siviglia', 'pt': 'Sevilha'
    },
    'Valencia': {
      'zh': '瓦伦西亚', 'zh-hk': '華倫西亞', 'zh-tw': '瓦倫西亞',
      'es': 'Valencia', 'de': 'Valencia', 'it': 'Valencia', 'pt': 'Valencia'
    },
    'Villarreal': {
      'zh': '比利亚雷亚尔', 'zh-hk': '維拉利爾', 'zh-tw': '比利亞雷爾',
      'es': 'Villarreal', 'de': 'Villarreal', 'it': 'Villarreal', 'pt': 'Villarreal'
    },
    'Real Betis': {
      'zh': '皇家贝蒂斯', 'zh-hk': '皇家貝迪斯', 'zh-tw': '皇家貝蒂斯',
      'es': 'Real Betis', 'de': 'Real Betis', 'it': 'Real Betis', 'pt': 'Real Betis'
    },
    'Athletic Bilbao': {
      'zh': '毕尔巴鄂竞技', 'zh-hk': '畢爾包體育會', 'zh-tw': '畢爾包競技',
      'es': 'Athletic Bilbao', 'de': 'Athletic Bilbao', 'it': 'Athletic Bilbao', 'pt': 'Athletic Bilbao'
    },
    'Celta Vigo': {
      'zh': '切尔塔维戈', 'zh-hk': '切爾塔維戈', 'zh-tw': '切爾塔維戈',
      'es': 'Celta Vigo', 'de': 'Celta Vigo', 'it': 'Celta Vigo', 'pt': 'Celta Vigo'
    },
    'Espanyol': {
      'zh': '爱斯宾奴', 'zh-hk': '愛斯賓奴', 'zh-tw': '愛斯賓奴',
      'es': 'Espanyol', 'de': 'Espanyol', 'it': 'Espanyol', 'pt': 'Espanyol'
    },
    'Mallorca': {
      'zh': '马洛卡', 'zh-hk': '馬洛卡', 'zh-tw': '馬洛卡',
      'es': 'Mallorca', 'de': 'Mallorca', 'it': 'Mallorca', 'pt': 'Mallorca'
    },

    // Bundesliga teams
    'Bayern Munich': {
      'zh': '拜仁慕尼黑', 'zh-hk': '拜仁慕尼黑', 'zh-tw': '拜仁慕尼黑',
      'es': 'Bayern Múnich', 'de': 'Bayern München', 'it': 'Bayern Monaco', 'pt': 'Bayern de Munique'
    },
    'Borussia Dortmund': {
      'zh': '多特蒙德', 'zh-hk': '多蒙特', 'zh-tw': '多特蒙德',
      'es': 'Borussia Dortmund', 'de': 'Borussia Dortmund', 'it': 'Borussia Dortmund', 'pt': 'Borussia Dortmund'
    },
    'RB Leipzig': {
      'zh': '莱比锡', 'zh-hk': '萊比錫', 'zh-tw': '萊比錫',
      'es': 'RB Leipzig', 'de': 'RB Leipzig', 'it': 'RB Lipsia', 'pt': 'RB Leipzig'
    },
    'Bayer Leverkusen': {
      'zh': '勒沃库森', 'zh-hk': '利華古遜', 'zh-tw': '勒沃库森',
      'es': 'Bayer Leverkusen', 'de': 'Bayer Leverkusen', 'it': 'Bayer Leverkusen', 'pt': 'Bayer Leverkusen'
    },

    // Serie A teams
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
    'AS Roma': {
      'zh': '罗马', 'zh-hk': '羅馬', 'zh-tw': '羅馬',
      'es': 'AS Roma', 'de': 'AS Rom', 'it': 'AS Roma', 'pt': 'AS Roma'
    },
    'Napoli': {
      'zh': '那不勒斯', 'zh-hk': '拿坡里', 'zh-tw': '那不勒斯',
      'es': 'Nápoles', 'de': 'Neapel', 'it': 'Napoli', 'pt': 'Napoli'
    },
    'Lazio': {
      'zh': '拉齐奥', 'zh-hk': '拉素', 'zh-tw': '拉齊奧',
      'es': 'Lazio', 'de': 'Lazio', 'it': 'Lazio', 'pt': 'Lazio'
    },

    // Ligue 1 teams
    'Paris Saint Germain': {
      'zh': '巴黎圣日耳曼', 'zh-hk': '巴黎聖日耳門', 'zh-tw': '巴黎聖日耳曼',
      'es': 'París Saint-Germain', 'de': 'Paris Saint-Germain', 'it': 'Paris Saint-Germain', 'pt': 'Paris Saint-Germain'
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
      'es': 'Mónaco', 'de': 'Monaco', 'it': 'Monaco', 'pt': 'Monaco'
    },

    // Portuguese teams (fixed duplicates)
    'FC Porto': {
      'zh': '波尔图', 'zh-hk': '波圖', 'zh-tw': '波爾圖',
      'es': 'Oporto', 'de': 'Porto', 'it': 'Porto', 'pt': 'Porto'
    },
    'SL Benfica': {
      'zh': '本菲卡', 'zh-hk': '賓菲加', 'zh-tw': '本菲卡',
      'es': 'SL Benfica', 'de': 'SL Benfica', 'it': 'SL Benfica', 'pt': 'SL Benfica'
    },
    'Sporting CP': {
      'zh': '里斯本竞技', 'zh-hk': '士砵亭', 'zh-tw': '里斯本競技',
      'es': 'Sporting de Lisboa', 'de': 'Sporting Lissabon', 'it': 'Sporting Lisbona', 'pt': 'Sporting'
    },
    'SC Braga': {
      'zh': '布拉加', 'zh-hk': '布拉加', 'zh-tw': '布拉加',
      'es': 'SC Braga', 'de': 'SC Braga', 'it': 'SC Braga', 'pt': 'SC Braga'
    },

    // MLS Teams
    'LA Galaxy': {
      'zh': '洛杉矶银河', 'zh-hk': '洛杉磯銀河', 'zh-tw': '洛杉磯銀河',
      'es': 'LA Galaxy', 'de': 'LA Galaxy', 'it': 'LA Galaxy', 'pt': 'LA Galaxy'
    },
    'Los Angeles Galaxy': {
      'zh': '洛杉矶银河', 'zh-hk': '洛杉磯銀河', 'zh-tw': '洛杉磯銀河',
      'es': 'Los Angeles Galaxy', 'de': 'Los Angeles Galaxy', 'it': 'Los Angeles Galaxy', 'pt': 'Los Angeles Galaxy'
    },
    'Inter Miami': {
      'zh': '迈阿密国际', 'zh-hk': '邁阿密國際', 'zh-tw': '邁阿密國際',
      'es': 'Inter Miami', 'de': 'Inter Miami', 'it': 'Inter Miami', 'pt': 'Inter Miami'
    },
    'Seattle Sounders': {
      'zh': '西雅图海湾人', 'zh-hk': '西雅圖海灣人', 'zh-tw': '西雅圖海灣人',
      'es': 'Seattle Sounders', 'de': 'Seattle Sounders', 'it': 'Seattle Sounders', 'pt': 'Seattle Sounders'
    },

    // Brazilian teams
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
    'São Paulo': {
      'zh': '圣保罗', 'zh-hk': '聖保羅', 'zh-tw': '聖保羅',
      'es': 'São Paulo', 'de': 'São Paulo', 'it': 'San Paolo', 'pt': 'São Paulo'
    },

    // Argentine teams
    'Boca Juniors': {
      'zh': '博卡青年', 'zh-hk': '小保加', 'zh-tw': '博卡青年',
      'es': 'Boca Juniors', 'de': 'Boca Juniors', 'it': 'Boca Juniors', 'pt': 'Boca Juniors'
    },
    'River Plate': {
      'zh': '河床', 'zh-hk': '河床', 'zh-tw': '河床',
      'es': 'River Plate', 'de': 'River Plate', 'it': 'River Plate', 'pt': 'River Plate'
    }
  };

  // Main translation method
  translateTeamName(teamName: string, targetLanguage: string): string {
    if (!teamName || !targetLanguage) return teamName;

    // Check cache first
    const cacheKey = `${teamName.toLowerCase()}_${targetLanguage}`;
    if (this.teamCache.has(cacheKey)) {
      return this.teamCache.get(cacheKey)!;
    }

    // Try popular teams translation
    const translation = this.getPopularTeamTranslation(teamName, targetLanguage);
    if (translation && translation !== teamName) {
      this.teamCache.set(cacheKey, translation);
      return translation;
    }

    // Try enhanced fallback
    const fallbackTranslation = this.getEnhancedFallback(teamName, targetLanguage);
    if (fallbackTranslation && fallbackTranslation !== teamName) {
      this.teamCache.set(cacheKey, fallbackTranslation);
      return fallbackTranslation;
    }

    // Return original if no translation found
    this.teamCache.set(cacheKey, teamName);
    return teamName;
  }

  // Get direct translation from popular teams mapping
  private getPopularTeamTranslation(teamName: string, language: string): string | null {
    if (!teamName || !language) return null;

    // Check exact match in static mappings first
    const teamTranslations = this.popularLeagueTeams[teamName];
    if (teamTranslations) {
      const exactTranslation = teamTranslations[language as keyof typeof teamTranslations];
      if (exactTranslation && exactTranslation !== teamName) {
        return exactTranslation;
      }
    }

    // Check learned mappings
    const learnedTeamTranslations = this.learnedTeamMappings.get(teamName);
    if (learnedTeamTranslations) {
      const learnedTranslation = learnedTeamTranslations[language as keyof typeof learnedTeamTranslations];
      if (learnedTranslation && learnedTranslation !== teamName) {
        console.log(`🎓 [SmartTranslation] Using learned mapping: "${teamName}" -> "${learnedTranslation}" (${language})`);
        return learnedTranslation;
      }
    }

    return null;
  }

  // Enhanced fallback for common team patterns
  private getEnhancedFallback(teamName: string, language: string): string | null {
    if (!teamName || !language) return null;

    // Try pattern-based matching
    const enhancedPatterns: Record<string, Record<string, string>> = {
      'FC': {
        'zh': '足球俱乐部', 'zh-hk': '足球會', 'zh-tw': '足球俱樂部',
        'es': 'FC', 'de': 'FC', 'it': 'FC', 'pt': 'FC'
      },
      'United': {
        'zh': '联合', 'zh-hk': '聯合', 'zh-tw': '聯合',
        'es': 'United', 'de': 'United', 'it': 'United', 'pt': 'United'
      },
      'City': {
        'zh': '城', 'zh-hk': '城', 'zh-tw': '城',
        'es': 'City', 'de': 'City', 'it': 'City', 'pt': 'City'
      }
    };

    // Try pattern-based matching
    for (const [pattern, translations] of Object.entries(enhancedPatterns)) {
      if (teamName.toLowerCase().includes(pattern.toLowerCase())) {
        const translation = translations[language as keyof typeof translations];
        if (translation && translation !== pattern) {
          return teamName.replace(new RegExp(pattern, 'gi'), translation);
        }
      }
    }

    return null;
  }

  // Clear cache
  clearCache(): void {
    this.teamCache.clear();
    if (this.translationCache) {
      this.translationCache.clear();
    }
    console.log('🧹 [SmartTranslation] Cache cleared');
  }

  // Fix corrupted cache
  fixCorruptedCache(): void {
    try {
      // Remove any corrupted localStorage entries
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('smart_translation_')) {
          try {
            const value = localStorage.getItem(key);
            if (!value || value === 'undefined' || value === 'null') {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🔧 [SmartTranslation] Fixed ${keysToRemove.length} corrupted cache entries`);
    } catch (error) {
      console.warn('⚠️ [SmartTranslation] Error fixing corrupted cache:', error);
    }
  }

  // Load learned mappings from localStorage
  private loadLearnedMappings(): void {
    try {
      const stored = localStorage.getItem('smart_translation_learned_mappings');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.learnedTeamMappings = new Map(Object.entries(parsed));
        console.log(`🎓 [SmartTranslation] Loaded ${this.learnedTeamMappings.size} learned mappings from localStorage`);
      }
    } catch (error) {
      console.warn('🚨 [SmartTranslation] Failed to load learned mappings:', error);
      this.learnedTeamMappings = new Map();
    }
  }

  // Save learned mappings to localStorage
  private saveLearnedMappings(): void {
    try {
      const mappingsObject = Object.fromEntries(this.learnedTeamMappings.entries());
      localStorage.setItem('smart_translation_learned_mappings', JSON.stringify(mappingsObject));
    } catch (error) {
      console.warn('🚨 [SmartTranslation] Failed to save learned mappings:', error);
    }
  }

  // Automatically integrate generated team mappings from the automated system
  integrateAutomatedMappings(): void {
    try {
      const automatedData = localStorage.getItem('automatedTeamMapping');
      if (automatedData) {
        const data = JSON.parse(automatedData);
        console.log(`🤖 [SmartTranslation] Found automated mappings for ${data.teams || 0} teams`);
        this.automatedMappingsCache = data;
        console.log(`✅ [SmartTranslation] Integrated automated mappings cache`);
      }
    } catch (error) {
      console.warn('🚨 [SmartTranslation] Failed to integrate automated mappings:', error);
    }
  }

  // Get translation statistics
  getTranslationStats() {
    return {
      learnedMappings: this.learnedTeamMappings.size,
      automatedMappings: this.automatedMappings?.size || 0,
      cacheSize: this.teamCache?.size || 0
    };
  }

  // Auto-learn teams from API fixture responses
  learnTeamsFromFixtures(fixtures: any[]): void {
    let newMappingsCount = 0;

    fixtures.forEach(fixture => {
      if (!fixture?.teams?.home?.name || !fixture?.teams?.away?.name) return;

      const homeTeam = fixture.teams.home.name;
      const awayTeam = fixture.teams.away.name;

      [homeTeam, awayTeam].forEach(teamName => {
        if (this.shouldLearnTeamMapping(teamName)) {
          const mapping = this.createTeamMappingFromName(teamName);
          if (mapping && !this.learnedTeamMappings.has(teamName)) {
            this.learnedTeamMappings.set(teamName, mapping);
            newMappingsCount++;
          }
        }
      });
    });

    if (newMappingsCount > 0) {
      this.saveLearnedMappings();
      console.log(`📖 [SmartTranslation] Learned ${newMappingsCount} new team mappings from fixtures`);
    }
  }

  // Check if we should learn a mapping for this team name
  private shouldLearnTeamMapping(teamName: string): boolean {
    if (this.popularLeagueTeams[teamName] || this.learnedTeamMappings.has(teamName)) {
      return false;
    }

    if (teamName.length < 3 || /[^\w\s\-'.]/i.test(teamName)) {
      return false;
    }

    return true;
  }

  // Create a team mapping from analyzing the team name
  private createTeamMappingFromName(teamName: string): TeamTranslation | null {
    const cleanName = teamName.trim();

    return {
      'zh': cleanName,
      'zh-hk': cleanName,
      'zh-tw': cleanName,
      'es': cleanName,
      'de': cleanName,
      'it': cleanName,
      'pt': cleanName
    };
  }

  // Generate team mappings from current fixtures
  generateTeamMappingsFromCurrentFixtures(fixtures: any[]): string {
    const teamsByCountry = new Map<string, Set<string>>();

    fixtures.forEach(fixture => {
      if (!fixture?.teams?.home?.name || !fixture?.teams?.away?.name) return;

      const country = fixture.league?.country || 'Unknown';

      if (!teamsByCountry.has(country)) {
        teamsByCountry.set(country, new Set());
      }

      teamsByCountry.get(country)!.add(fixture.teams.home.name);
      teamsByCountry.get(country)!.add(fixture.teams.away.name);
    });

    let output = '// Auto-generated team mappings from current fixtures\n\n';

    Array.from(teamsByCountry.entries()).forEach(([country, teams]) => {
      if (teams.size > 0) {
        output += `// ${country} Teams (${teams.size} teams)\n`;
        Array.from(teams).sort().forEach(teamName => {
          const existing = this.getPopularTeamTranslation(teamName, 'zh-hk');
          if (!existing || existing === teamName) {
            output += `'${teamName}': {\n`;
            output += `  'zh': '${teamName}', 'zh-hk': '${teamName}', 'zh-tw': '${teamName}',\n`;
            output += `  'es': '${teamName}', 'de': '${teamName}', 'it': '${teamName}', 'pt': '${teamName}'\n`;
            output += `},\n`;
          }
        });
        output += '\n';
      }
    });

    console.log('📋 Generated team mappings from fixtures:', output);
    return output;
  }
}

// Export singleton instance
export const smartTeamTranslation = new SmartTeamTranslation();