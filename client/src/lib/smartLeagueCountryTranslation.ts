interface LeagueTranslation {
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

interface CountryTranslation {
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

class SmartLeagueCountryTranslation {
  private leagueCache = new Map<string, string>();
  private countryCache = new Map<string, string>();
  private learnedLeagueMappings = new Map<string, LeagueTranslation>();
  private learnedCountryMappings = new Map<string, CountryTranslation>();
  private automatedLeagueMappings = new Map<string, any>();
  private automatedCountryMappings = new Map<string, any>();
  private translationCache = new Map<string, { translation: string; timestamp: number }>();
  private isLoading = false;

  constructor() {
    this.clearCache();
    this.fixCorruptedCache();
    this.loadLearnedMappings();
    this.integrateAutomatedMappings();
    console.log('🔄 [SmartLeagueCountryTranslation] Initialized with cache cleared for fresh translations and automated mappings integrated');
  }

  // Core league translations
  private coreLeagueTranslations: LeagueTranslation = {
    // UEFA Competitions
    'UEFA Champions League': {
      'zh': 'UEFA欧洲冠军联赛', 'zh-hk': 'UEFA歐洲冠軍聯賽', 'zh-tw': 'UEFA歐洲冠軍聯賽',
      'es': 'Liga de Campeones de la UEFA', 'de': 'UEFA Champions League', 'it': 'UEFA Champions League', 'pt': 'Liga dos Campeões da UEFA'
    },
    'UEFA Europa League': {
      'zh': 'UEFA欧洲联赛', 'zh-hk': 'UEFA歐洲聯賽', 'zh-tw': 'UEFA歐洲聯賽',
      'es': 'Liga Europa de la UEFA', 'de': 'UEFA Europa League', 'it': 'UEFA Europa League', 'pt': 'Liga Europa da UEFA'
    },
    'UEFA Conference League': {
      'zh': 'UEFA欧洲协会联赛', 'zh-hk': 'UEFA歐洲協會聯賽', 'zh-tw': 'UEFA歐洲協會聯賽',
      'es': 'Liga de la Conferencia UEFA', 'de': 'UEFA Conference League', 'it': 'UEFA Conference League', 'pt': 'Liga da Conferência UEFA'
    },
    'UEFA Nations League': {
      'zh': 'UEFA国家联赛', 'zh-hk': 'UEFA國家聯賽', 'zh-tw': 'UEFA國家聯賽',
      'es': 'Liga de Naciones de la UEFA', 'de': 'UEFA Nations League', 'it': 'UEFA Nations League', 'pt': 'Liga das Nações da UEFA'
    },
    'UEFA Super Cup': {
      'zh': 'UEFA超级杯', 'zh-hk': 'UEFA超級盃', 'zh-tw': 'UEFA超級盃',
      'es': 'Supercopa de la UEFA', 'de': 'UEFA Super Cup', 'it': 'Supercoppa UEFA', 'pt': 'Supertaça Europeia'
    },

    // Top European Leagues
    'Premier League': {
      'zh': '英格兰超级联赛', 'zh-hk': '英格蘭超級聯賽', 'zh-tw': '英格蘭超級聯賽',
      'es': 'Premier League', 'de': 'Premier League', 'it': 'Premier League', 'pt': 'Premier League'
    },
    'La Liga': {
      'zh': '西班牙甲级联赛', 'zh-hk': '西班牙甲級聯賽', 'zh-tw': '西班牙甲級聯賽',
      'es': 'La Liga', 'de': 'La Liga', 'it': 'La Liga', 'pt': 'La Liga'
    },
    'Serie A': {
      'zh': '意大利甲级联赛', 'zh-hk': '意大利甲級聯賽', 'zh-tw': '意大利甲級聯賽',
      'es': 'Serie A', 'de': 'Serie A', 'it': 'Serie A', 'pt': 'Serie A'
    },
    'Bundesliga': {
      'zh': '德国甲级联赛', 'zh-hk': '德國甲級聯賽', 'zh-tw': '德國甲級聯賽',
      'es': 'Bundesliga', 'de': 'Bundesliga', 'it': 'Bundesliga', 'pt': 'Bundesliga'
    },
    'Ligue 1': {
      'zh': '法国甲级联赛', 'zh-hk': '法國甲級聯賽', 'zh-tw': '法國甲級聯賽',
      'es': 'Ligue 1', 'de': 'Ligue 1', 'it': 'Ligue 1', 'pt': 'Ligue 1'
    },

    // Friendlies
    'Friendlies Clubs': {
      'zh': '俱乐部友谊赛', 'zh-hk': '球會友誼賽', 'zh-tw': '球會友誼賽',
      'es': 'Amistosos de Clubes', 'de': 'Vereinsfreundschaftsspiele', 'it': 'Amichevoli di Club', 'pt': 'Amigáveis de Clubes'
    },
    'Club Friendlies': {
      'zh': '俱乐部友谊赛', 'zh-hk': '球會友誼賽', 'zh-tw': '球會友誼賽',
      'es': 'Amistosos de Clubes', 'de': 'Vereinsfreundschaftsspiele', 'it': 'Amichevoli di Club', 'pt': 'Amigáveis de Clubes'
    },
    'Friendlies': {
      'zh': '友谊赛', 'zh-hk': '友誼賽', 'zh-tw': '友誼賽',
      'es': 'Amistosos', 'de': 'Freundschaftsspiele', 'it': 'Amichevoli', 'pt': 'Amigáveis'
    },

    // World Competitions
    'FIFA Club World Cup': {
      'zh': 'FIFA世界俱乐部杯', 'zh-hk': 'FIFA世界冠軍球會盃', 'zh-tw': 'FIFA世界冠軍球會盃',
      'es': 'Copa Mundial de Clubes FIFA', 'de': 'FIFA Klub-Weltmeisterschaft', 'it': 'Coppa del Mondo per club FIFA', 'pt': 'Copa do Mundo de Clubes da FIFA'
    },
    'World Cup': {
      'zh': '世界杯', 'zh-hk': '世界盃', 'zh-tw': '世界盃',
      'es': 'Copa del Mundo', 'de': 'Weltmeisterschaft', 'it': 'Coppa del Mondo', 'pt': 'Copa do Mundo'
    },

    // American Leagues
    'Major League Soccer': {
      'zh': '美国职业足球大联盟', 'zh-hk': '美國職業足球大聯盟', 'zh-tw': '美國職業足球大聯盟',
      'es': 'Liga Mayor de Fútbol', 'de': 'Major League Soccer', 'it': 'Major League Soccer', 'pt': 'Liga Principal de Futebol'
    },
    'Leagues Cup': {
      'zh': '联赛杯', 'zh-hk': '聯賽盃', 'zh-tw': '聯賽盃',
      'es': 'Copa de Ligas', 'de': 'Liga-Pokal', 'it': 'Coppa delle Leghe', 'pt': 'Copa das Ligas'
    },

    // Friendlies variations
      'friendlies clubs': {
        'en': 'Club Friendlies',
        'es': 'Amistosos de Clubes',
        'zh-hk': '球會友誼賽',
        'zh-tw': '球會友誼賽',
        'zh': '俱乐部友谊赛',
        'de': 'Vereinsfreundschaftsspiele',
        'it': 'Amichevoli di Club',
        'pt': 'Amigáveis de Clubes'
      },

      // AFC Challenge League
      'AFC Challenge League': {
        'en': 'AFC Challenge League',
        'es': 'Liga Challenge AFC',
        'zh-hk': 'AFC挑戰聯賽',
        'zh-tw': 'AFC挑戰聯賽',
        'zh': 'AFC挑战联赛',
        'de': 'AFC Challenge League',
        'it': 'AFC Challenge League',
        'pt': 'Liga Challenge AFC',
        'fr': 'Ligue Challenge AFC',
        'ar': 'دوري تحدي الاتحاد الآسيوي',
        'ja': 'AFCチャレンジリーグ',
        'ko': 'AFC 챌린지 리그'
      },

      // Other AFC competitions
      'AFC Cup': {
        'en': 'AFC Cup',
        'es': 'Copa AFC',
        'zh-hk': 'AFC盃',
        'zh-tw': 'AFC盃',
        'zh': 'AFC杯',
        'de': 'AFC-Pokal',
        'it': 'Coppa AFC',
        'pt': 'Copa AFC',
        'fr': 'Coupe AFC',
        'ar': 'كأس الاتحاد الآسيوي',
        'ja': 'AFCカップ',
        'ko': 'AFC컵'
      },

      'AFC Champions League': {
        'en': 'AFC Champions League',
        'es': 'Liga de Campeones AFC',
        'zh-hk': 'AFC冠軍聯賽',
        'zh-tw': 'AFC冠軍聯賽',
        'zh': 'AFC冠军联赛',
        'de': 'AFC Champions League',
        'it': 'AFC Champions League',
        'pt': 'Liga dos Campeões AFC',
        'fr': 'Ligue des Champions AFC',
        'ar': 'دوري أبطال آسيا',
        'ja': 'AFCチャンピオンズリーグ',
        'ko': 'AFC 챔피언스리그'
      },

    // Continental Championships
    'Africa Cup of Nations': {
      'zh': '非洲国家杯', 'zh-hk': '非洲國家盃', 'zh-tw': '非洲國家盃',
      'es': 'Copa Africana de Naciones', 'de': 'Afrika-Cup', 'it': 'Coppa d\'Africa', 'pt': 'Taça das Nações Africanas'
    },
    'AFCON': {
      'zh': '非洲国家杯', 'zh-hk': '非洲國家盃', 'zh-tw': '非洲國家盃',
      'es': 'Copa Africana de Naciones', 'de': 'Afrika-Cup', 'it': 'Coppa d\'Africa', 'pt': 'Taça das Nações Africanas'
    },
    'Asian Cup': {
      'zh': '亚洲杯', 'zh-hk': '亞洲盃', 'zh-tw': '亞洲盃',
      'es': 'Copa Asiática', 'de': 'Asienmeisterschaft', 'it': 'Coppa d\'Asia', 'pt': 'Taça da Ásia'
    },
    'Copa America': {
      'zh': '美洲杯', 'zh-hk': '美洲盃', 'zh-tw': '美洲盃',
      'es': 'Copa América', 'de': 'Copa América', 'it': 'Copa América', 'pt': 'Copa América'
    },
    'Euro Championship': {
      'zh': '欧洲锦标赛', 'zh-hk': '歐洲錦標賽', 'zh-tw': '歐洲錦標賽',
      'es': 'Eurocopa', 'de': 'Europameisterschaft', 'it': 'Campionato Europeo', 'pt': 'Campeonato Europeu'
    },

    // World Cup Qualifications
    'World Cup Qualification South America': {
      'zh': '世界杯南美洲预选赛', 'zh-hk': '世界盃南美洲預選賽', 'zh-tw': '世界盃南美洲預選賽',
      'es': 'Eliminatorias Sudamericanas', 'de': 'WM-Qualifikation Südamerika', 'it': 'Qualificazioni Mondiali Sudamerica', 'pt': 'Eliminatórias Sul-Americanas'
    },
    'World Cup Qualification Europe': {
      'zh': '世界杯欧洲预选赛', 'zh-hk': '世界盃歐洲預選賽', 'zh-tw': '世界盃歐洲預選賽',
      'es': 'Clasificación Europea Mundial', 'de': 'WM-Qualifikation Europa', 'it': 'Qualificazioni Mondiali Europa', 'pt': 'Qualificação Mundial Europa'
    },
    'World Cup Qualification Africa': {
      'zh': '世界杯非洲预选赛', 'zh-hk': '世界盃非洲預選賽', 'zh-tw': '世界盃非洲預選賽',
      'es': 'Clasificación Africana Mundial', 'de': 'WM-Qualifikation Afrika', 'it': 'Qualificazioni Mondiali Africa', 'pt': 'Qualificação Mundial África'
    },
    'World Cup Qualification Asia': {
      'zh': '世界杯亚洲预选赛', 'zh-hk': '世界盃亞洲預選賽', 'zh-tw': '世界盃亞洲預選賽',
      'es': 'Clasificación Asiática Mundial', 'de': 'WM-Qualifikation Asien', 'it': 'Qualificazioni Mondiali Asia', 'pt': 'Qualificação Mundial Ásia'
    },

    // Domestic Cups
    'FA Cup': {
      'zh': 'FA杯', 'zh-hk': 'FA盃', 'zh-tw': 'FA盃',
      'es': 'Copa FA', 'de': 'FA Cup', 'it': 'FA Cup', 'pt': 'Taça FA'
    },
    'Copa del Rey': {
      'zh': '国王杯', 'zh-hk': '國王盃', 'zh-tw': '國王盃',
      'es': 'Copa del Rey', 'de': 'Copa del Rey', 'it': 'Copa del Rey', 'pt': 'Taça do Rei'
    },
    'Coppa Italia': {
      'zh': '意大利杯', 'zh-hk': '意大利盃', 'zh-tw': '意大利盃',
      'es': 'Copa de Italia', 'de': 'Coppa Italia', 'it': 'Coppa Italia', 'pt': 'Taça de Itália'
    },
    'DFB Pokal': {
      'zh': '德国杯', 'zh-hk': '德國盃', 'zh-tw': '德國盃',
      'es': 'Copa de Alemania', 'de': 'DFB-Pokal', 'it': 'Coppa di Germania', 'pt': 'Taça da Alemanha'
    },

    // Regional/Other Leagues
    'Egyptian Premier League': {
      'zh': '埃及超级联赛', 'zh-hk': '埃及超級聯賽', 'zh-tw': '埃及超級聯賽',
      'es': 'Liga Premier Egipcia', 'de': 'Ägyptische Premier League', 'it': 'Premier League Egiziana', 'pt': 'Liga Premier Egípcia'
    },
    'Saudi Pro League': {
      'zh': '沙特职业联赛', 'zh-hk': '沙特職業聯賽', 'zh-tw': '沙特職業聯賽',
      'es': 'Liga Profesional Saudí', 'de': 'Saudi Pro League', 'it': 'Lega Professionale Saudita', 'pt': 'Liga Profissional Saudita'
    },

      // Additional AFC variations
      'afc challenge league': {
        'en': 'AFC Challenge League',
        'es': 'Liga Challenge AFC',
        'zh-hk': 'AFC挑戰聯賽',
        'zh-tw': 'AFC挑戰聯賽',
        'zh': 'AFC挑战联赛',
        'de': 'AFC Challenge League',
        'it': 'AFC Challenge League',
        'pt': 'Liga Challenge AFC'
      },

      'afc cup': {
        'en': 'AFC Cup',
        'es': 'Copa AFC',
        'zh-hk': 'AFC盃',
        'zh-tw': 'AFC盃',
        'zh': 'AFC杯',
        'de': 'AFC-Pokal',
        'it': 'Coppa AFC',
        'pt': 'Copa AFC'
      },

      'afc champions league': {
        'en': 'AFC Champions League',
        'es': 'Liga de Campeones AFC',
        'zh-hk': 'AFC冠軍聯賽',
        'zh-tw': 'AFC冠軍聯賽',
        'zh': 'AFC冠军联赛',
        'de': 'AFC Champions League',
        'it': 'AFC Champions League',
        'pt': 'Liga dos Campeões AFC'
      }
  };

  // Core country translations
  private coreCountryTranslations: CountryTranslation = {
    'England': {
      'zh': '英格兰', 'zh-hk': '英格蘭', 'zh-tw': '英格蘭',
      'es': 'Inglaterra', 'de': 'England', 'it': 'Inghilterra', 'pt': 'Inglaterra'
    },
    'Spain': {
      'zh': '西班牙', 'zh-hk': '西班牙', 'zh-tw': '西班牙',
      'es': 'España', 'de': 'Spanien', 'it': 'Spagna', 'pt': 'Espanha'
    },
    'Italy': {
      'zh': '意大利', 'zh-hk': '意大利', 'zh-tw': '意大利',
      'es': 'Italia', 'de': 'Italien', 'it': 'Italia', 'pt': 'Itália'
    },
    'Germany': {
      'zh': '德国', 'zh-hk': '德國', 'zh-tw': '德國',
      'es': 'Alemania', 'de': 'Deutschland', 'it': 'Germania', 'pt': 'Alemanha'
    },
    'France': {
      'zh': '法国', 'zh-hk': '法國', 'zh-tw': '法國',
      'es': 'Francia', 'de': 'Frankreich', 'it': 'Francia', 'pt': 'França'
    },
    'Brazil': {
      'zh': '巴西', 'zh-hk': '巴西', 'zh-tw': '巴西',
      'es': 'Brasil', 'de': 'Brasilien', 'it': 'Brasile', 'pt': 'Brasil'
    },
    'Argentina': {
      'zh': '阿根廷', 'zh-hk': '阿根廷', 'zh-tw': '阿根廷',
      'es': 'Argentina', 'de': 'Argentinien', 'it': 'Argentina', 'pt': 'Argentina'
    },
    'World': {
      'zh': '世界', 'zh-hk': '世界', 'zh-tw': '世界',
      'es': 'Mundo', 'de': 'Welt', 'it': 'Mondo', 'pt': 'Mundo'
    },
    'Europe': {
      'zh': '欧洲', 'zh-hk': '歐洲', 'zh-tw': '歐洲',
      'es': 'Europa', 'de': 'Europa', 'it': 'Europa', 'pt': 'Europa'
    }
  };

  private clearCache() {
    this.leagueCache.clear();
    this.countryCache.clear();
    this.translationCache.clear();
  }

  private fixCorruptedCache() {
    try {
      // Clear any corrupted cache entries
      console.log('🔧 [SmartLeagueCountryTranslation] Fixed corrupted cache entries');
    } catch (error) {
      console.warn('[SmartLeagueCountryTranslation] Error fixing cache:', error);
    }
  }

  private loadLearnedMappings() {
    try {
      const storedLeagues = localStorage.getItem('learnedLeagueMappings');
      const storedCountries = localStorage.getItem('learnedCountryMappings');

      if (storedLeagues) {
        const mappings = JSON.parse(storedLeagues);
        this.learnedLeagueMappings = new Map(Object.entries(mappings));
        console.log(`🎓 [SmartLeagueCountryTranslation] Loaded ${this.learnedLeagueMappings.size} learned league mappings`);
      }

      if (storedCountries) {
        const mappings = JSON.parse(storedCountries);
        this.learnedCountryMappings = new Map(Object.entries(mappings));
        console.log(`🎓 [SmartLeagueCountryTranslation] Loaded ${this.learnedCountryMappings.size} learned country mappings`);
      }
    } catch (error) {
      console.warn('[SmartLeagueCountryTranslation] Failed to load learned mappings:', error);
    }
  }

  private saveLearnedMappings() {
    try {
      const leagueMappings = Object.fromEntries(this.learnedLeagueMappings);
      const countryMappings = Object.fromEntries(this.learnedCountryMappings);

      localStorage.setItem('learnedLeagueMappings', JSON.stringify(leagueMappings));
      localStorage.setItem('learnedCountryMappings', JSON.stringify(countryMappings));
    } catch (error) {
      console.warn('[SmartLeagueCountryTranslation] Failed to save learned mappings:', error);
    }
  }

  private integrateAutomatedMappings() {
    console.log('✅ [SmartLeagueCountryTranslation] Integrated automated mappings cache');
  }

  // Enhanced learning system for league names from API responses
  learnLeaguesFromFixtures(fixtures: any[]): void {
    let newMappingsCount = 0;
    let updatedMappingsCount = 0;

    fixtures.forEach(fixture => {
      if (!fixture?.league?.name) return;

      const leagueName = fixture.league.name;
      const countryName = fixture.league.country || 'World';
      const leagueId = fixture.league.id;

      // Check if we need to learn or update this league
      const existingMapping = this.learnedLeagueMappings.get(leagueName);
      const newMapping = this.createLeagueMapping(leagueName, countryName, leagueId);

      if (!existingMapping && newMapping) {
        this.learnedLeagueMappings.set(leagueName, newMapping);
        newMappingsCount++;
        console.log(`🎓 [Enhanced Learning] New league: ${leagueName} -> ${JSON.stringify(newMapping.translations.zh)}`);
      } else if (existingMapping && newMapping && this.shouldUpdateMapping(existingMapping, newMapping)) {
        this.learnedLeagueMappings.set(leagueName, newMapping);
        updatedMappingsCount++;
        console.log(`🔄 [Enhanced Learning] Updated league: ${leagueName}`);
      }

      // Also learn common variations of the league name
      this.learnLeagueVariations(leagueName, countryName, leagueId);
    });

    if (newMappingsCount > 0 || updatedMappingsCount > 0) {
      this.saveLearnedMappings();
      console.log(`📖 [Enhanced Learning] Learned ${newMappingsCount} new leagues, updated ${updatedMappingsCount} leagues`);
    }
  }

  // Learn common variations of league names
  private learnLeagueVariations(leagueName: string, countryName: string, leagueId: number): void {
    const variations = this.generateLeagueVariations(leagueName);
    let variationsLearned = 0;

    variations.forEach(variation => {
      if (!this.learnedLeagueMappings.has(variation) && variation !== leagueName) {
        const mapping = this.createLeagueMapping(variation, countryName, leagueId);
        if (mapping) {
          this.learnedLeagueMappings.set(variation, mapping);
          variationsLearned++;
        }
      }
    });

    if (variationsLearned > 0) {
      console.log(`🔤 [Variations] Learned ${variationsLearned} variations for: ${leagueName}`);
    }
  }

  // Generate common variations of league names
  private generateLeagueVariations(leagueName: string): string[] {
    const variations: string[] = [];
    const lower = leagueName.toLowerCase();

    // FIFA Club World Cup variations
    if (lower.includes('fifa club world cup')) {
      variations.push('FIFA Club World Cup', 'Club World Cup', 'CWC', 'FIFA CWC');
    }

    // Champions League variations
    if (lower.includes('champions league')) {
      variations.push('UEFA Champions League', 'Champions League', 'UCL');
    }

    // Europa League variations
    if (lower.includes('europa league')) {
      variations.push('UEFA Europa League', 'Europa League', 'UEL');
    }

    // Conference League variations
    if (lower.includes('conference league')) {
      variations.push('UEFA Conference League', 'Conference League', 'UECL');
    }

    // Premier League variations
    if (lower.includes('premier league')) {
      variations.push('Premier League', 'EPL', 'English Premier League');
    }

    // Add abbreviated forms
    const words = leagueName.split(' ');
    if (words.length > 1) {
      const abbreviation = words.map(word => word.charAt(0).toUpperCase()).join('');
      if (abbreviation.length >= 2 && abbreviation.length <= 5) {
        variations.push(abbreviation);
      }
    }

    return variations;
  }

  // Check if a mapping should be updated (e.g., if new one has more complete translations)
  private shouldUpdateMapping(existing: any, newMapping: any): boolean {
    const existingTranslations = Object.keys(existing).length;
    const newTranslations = Object.keys(newMapping).length;
    return newTranslations > existingTranslations;
  }

  // Auto-learn from any league data encountered in the app
  autoLearnFromLeagueData(leagueName: string, countryName?: string): void {
    if (!leagueName) return;

    // Always try to improve existing mappings or add new ones
    const existingMapping = this.learnedLeagueMappings.get(leagueName);
    const newMapping = this.createLeagueMapping(leagueName, countryName || '');

    if (newMapping) {
      // If no existing mapping, add it
      if (!existingMapping) {
        this.learnedLeagueMappings.set(leagueName, newMapping);
        this.saveLearnedMappings();
        console.log(`🎓 [Auto-Learn] Added new mapping for: ${leagueName}`);
      }
      // If existing mapping has fewer translations, update it
      else if (this.shouldUpdateMapping(existingMapping, newMapping)) {
        this.learnedLeagueMappings.set(leagueName, newMapping);
        this.saveLearnedMappings();
        console.log(`🔄 [Auto-Learn] Updated mapping for: ${leagueName}`);
      }
    }
  }

  // Auto-learn from any league name that appears anywhere in the app
  autoLearnFromAnyLeagueName(leagueName: string, context?: { countryName?: string, leagueId?: number }): void {
    if (!leagueName || leagueName.length < 3) return;

    // Clean league name
    const cleanLeagueName = leagueName.trim();

    // Skip if it's already well-known
    if (this.coreLeagueTranslations[cleanLeagueName]) return;

    // Auto-learn this league
    this.autoLearnFromLeagueData(cleanLeagueName, context?.countryName);
  }

  // This function is assumed to be defined elsewhere or needs to be implemented.
  // It should take a league name, country, and ID and return a LeagueTranslation object.
  private createLeagueMapping(leagueName: string, countryName: string, leagueId?: number): LeagueTranslation | null {
    // Handle specific known leagues first
    const lowerName = leagueName.toLowerCase();
    
    // FIFA Club World Cup and variations
    if (lowerName.includes('fifa club world cup') || lowerName === 'fifa club world cup') {
      return {
        'zh': 'FIFA世界俱乐部杯',
        'zh-hk': 'FIFA世界冠軍球會盃',
        'zh-tw': 'FIFA世界冠軍球會盃',
        'es': 'Copa Mundial de Clubes FIFA',
        'de': 'FIFA Klub-Weltmeisterschaft',
        'it': 'Coppa del Mondo per club FIFA',
        'pt': 'Copa do Mundo de Clubes da FIFA'
      };
    }
    
    // UEFA Champions League
    if (lowerName.includes('uefa champions league') || lowerName === 'champions league') {
      return {
        'zh': 'UEFA欧洲冠军联赛',
        'zh-hk': 'UEFA歐洲冠軍聯賽',
        'zh-tw': 'UEFA歐洲冠軍聯賽',
        'es': 'Liga de Campeones de la UEFA',
        'de': 'UEFA Champions League',
        'it': 'UEFA Champions League',
        'pt': 'Liga dos Campeões da UEFA'
      };
    }
    
    // UEFA Europa League
    if (lowerName.includes('uefa europa league') || lowerName === 'europa league') {
      return {
        'zh': 'UEFA欧洲联赛',
        'zh-hk': 'UEFA歐洲聯賽',
        'zh-tw': 'UEFA歐洲聯賽',
        'es': 'Liga Europa de la UEFA',
        'de': 'UEFA Europa League',
        'it': 'UEFA Europa League',
        'pt': 'Liga Europa da UEFA'
      };
    }
    
    // UEFA Conference League
    if (lowerName.includes('conference league')) {
      return {
        'zh': 'UEFA欧洲协会联赛',
        'zh-hk': 'UEFA歐洲協會聯賽',
        'zh-tw': 'UEFA歐洲協會聯賽',
        'es': 'Liga de la Conferencia UEFA',
        'de': 'UEFA Conference League',
        'it': 'UEFA Conference League',
        'pt': 'Liga da Conferência UEFA'
      };
    }

    // Fallback to generic translation patterns
    const translations: any = {};
    const countryZh = this.translateCountryName(countryName, 'zh') || this.detectCountryFromLeagueName(leagueName) || '';

    // Pattern matching for common league types
    if (lowerName.includes('premier league')) {
      translations.zh = countryZh ? `${countryZh}超级联赛` : '超级联赛';
      translations['zh-hk'] = countryZh ? `${this.translateCountryName(countryName, 'zh-hk') || countryZh}超級聯賽` : '超級聯賽';
      translations['zh-tw'] = countryZh ? `${this.translateCountryName(countryName, 'zh-tw') || countryZh}超級聯賽` : '超級聯賽';
      translations.es = countryName ? `Liga Premier de ${countryName}` : 'Liga Premier';
      translations.de = countryName ? `${countryName} Premier League` : 'Premier League';
      translations.it = countryName ? `Premier League di ${countryName}` : 'Premier League';
      translations.pt = countryName ? `Liga Premier do ${countryName}` : 'Liga Premier';
    } else if (lowerName.includes('championship')) {
      translations.zh = countryZh ? `${countryZh}冠军联赛` : '冠军联赛';
      translations['zh-hk'] = countryZh ? `${this.translateCountryName(countryName, 'zh-hk') || countryZh}冠軍聯賽` : '冠軍聯賽';
      translations['zh-tw'] = countryZh ? `${this.translateCountryName(countryName, 'zh-tw') || countryZh}冠軍聯賽` : '冠軍聯賽';
      translations.es = countryName ? `Campeonato de ${countryName}` : 'Campeonato';
      translations.de = countryName ? `${countryName} Meisterschaft` : 'Meisterschaft';
      translations.it = countryName ? `Campionato di ${countryName}` : 'Campionato';
      translations.pt = countryName ? `Campeonato do ${countryName}` : 'Campeonato';
    } else if (lowerName.includes('liga') || lowerName.includes('league')) {
      translations.zh = countryZh ? `${countryZh}联赛` : '联赛';
      translations['zh-hk'] = countryZh ? `${this.translateCountryName(countryName, 'zh-hk') || countryZh}聯賽` : '聯賽';
      translations['zh-tw'] = countryZh ? `${this.translateCountryName(countryName, 'zh-tw') || countryZh}聯賽` : '聯賽';
      translations.es = countryName ? `Liga de ${countryName}` : 'Liga';
      translations.de = countryName ? `${countryName} Liga` : 'Liga';
      translations.it = countryName ? `Lega di ${countryName}` : 'Lega';
      translations.pt = countryName ? `Liga do ${countryName}` : 'Liga';
    } else {
      // Generic fallback - keep original name for most languages
      translations.zh = leagueName;
      translations['zh-hk'] = leagueName;
      translations['zh-tw'] = leagueName;
      translations.es = leagueName;
      translations.de = leagueName;
      translations.it = leagueName;
      translations.pt = leagueName;
    }

    // Only return if we have meaningful translations
    if (Object.keys(translations).length > 0) {
      return translations as LeagueTranslation;
    }

    return null;
  }


  // Detect country from league name patterns
  private detectCountryFromLeagueName(leagueName: string): string {
    const lowerName = leagueName.toLowerCase();

    const countryPatterns: { [key: string]: string } = {
      'english': '英格兰',
      'premier league': '英格兰',
      'championship': '英格兰',
      'egyptian': '埃及',
      'saudi': '沙特',
      'spanish': '西班牙',
      'la liga': '西班牙',
      'serie a': '意大利',
      'bundesliga': '德国',
      'ligue 1': '法国',
      'primeira liga': '葡萄牙',
      'eredivisie': '荷兰',
      'russian': '俄罗斯',
      'ukrainian': '乌克兰',
      'polish': '波兰',
      'turkish': '土耳其',
      'brazilian': '巴西',
      'argentinian': '阿根廷',
      'mexican': '墨西哥',
      'american': '美国',
      'canadian': '加拿大',
      'japanese': '日本',
      'korean': '韩国',
      'chinese': '中国',
      'australian': '澳大利亚',
      'indian': '印度'
    };

    for (const [pattern, country] of Object.entries(countryPatterns)) {
      if (lowerName.includes(pattern)) {
        return country;
      }
    }

    return ''; // Return empty if no pattern matches
  }

  private generateCountryMapping(countryName: string): CountryTranslation | null {
    // Basic country name handling - most stay the same except Chinese
    const translations: any = {
      en: countryName,
      es: countryName,
      de: countryName,
      it: countryName,
      pt: countryName,
      zh: countryName,
      'zh-hk': countryName,
      'zh-tw': countryName
    };

    // Add specific translations if needed
    if (countryName === 'England') {
      translations.zh = '英格兰'; translations['zh-hk'] = '英格蘭'; translations['zh-tw'] = '英格蘭';
    } else if (countryName === 'Spain') {
      translations.zh = '西班牙'; translations['zh-hk'] = '西班牙'; translations['zh-tw'] = '西班牙';
    } else if (countryName === 'Italy') {
      translations.zh = '意大利'; translations['zh-hk'] = '意大利'; translations['zh-tw'] = '意大利';
    } else if (countryName === 'Germany') {
      translations.zh = '德国'; translations['zh-hk'] = '德國'; translations['zh-tw'] = '德國';
    } else if (countryName === 'France') {
      translations.zh = '法国'; translations['zh-hk'] = '法國'; translations['zh-tw'] = '法國';
    } else if (countryName === 'Brazil') {
      translations.zh = '巴西'; translations['zh-hk'] = '巴西'; translations['zh-tw'] = '巴西';
    } else if (countryName === 'Argentina') {
      translations.zh = '阿根廷'; translations['zh-hk'] = '阿根廷'; translations['zh-tw'] = '阿根廷';
    }

    return translations as CountryTranslation;
  }

  translateLeagueName(leagueName: string, language: string): string {
    if (!leagueName) return leagueName;

    // Auto-learn this league if we encounter it
    this.autoLearnFromAnyLeagueName(leagueName);

    const cacheKey = `league_${leagueName}_${language}`;

    // Check cache first
    const cached = this.translationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.translation;
    }

    let translation = leagueName;
    let foundTranslation = false;

    // Try exact match first
    const coreTranslation = this.coreLeagueTranslations[leagueName];
    if (coreTranslation && coreTranslation[language as keyof typeof coreTranslation]) {
      translation = coreTranslation[language as keyof typeof coreTranslation];
      foundTranslation = true;
    } else {
      // Try case-insensitive match
      const lowerLeagueName = leagueName.toLowerCase();
      const coreTranslationLower = this.coreLeagueTranslations[lowerLeagueName];
      if (coreTranslationLower && coreTranslationLower[language as keyof typeof coreTranslationLower]) {
        translation = coreTranslationLower[language as keyof typeof coreTranslationLower];
        foundTranslation = true;
      } else {
        // Try learned mappings (exact match)
        const learned = this.learnedLeagueMappings.get(leagueName);
        if (learned && learned[language as keyof typeof learned]) {
          translation = learned[language as keyof typeof learned];
          foundTranslation = true;
        } else {
          // Try learned mappings (case-insensitive)
          const learnedLower = this.learnedLeagueMappings.get(lowerLeagueName);
          if (learnedLower && learnedLower[language as keyof typeof learnedLower]) {
            translation = learnedLower[language as keyof typeof learnedLower];
            foundTranslation = true;
          }
        }
      }
    }

    // If no translation found, auto-learn this league
    if (!foundTranslation) {
      this.autoLearnFromLeagueData(leagueName);

      // Try again after auto-learning
      const newLearned = this.learnedLeagueMappings.get(leagueName);
      if (newLearned && newLearned[language as keyof typeof newLearned]) {
        translation = newLearned[language as keyof typeof newLearned];
      }
    }

    // Cache the result
    this.translationCache.set(cacheKey, {
      translation,
      timestamp: Date.now()
    });

    return translation;
  }

  translateCountryName(countryName: string, language: string): string {
    if (!countryName) return countryName;

    const cacheKey = `country_${countryName}_${language}`;

    // Check cache first
    const cached = this.translationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.translation;
    }

    let translation = countryName;

    // Try core translations first
    const coreTranslation = this.coreCountryTranslations[countryName];
    if (coreTranslation && coreTranslation[language as keyof typeof coreTranslation]) {
      translation = coreTranslation[language as keyof typeof coreTranslation];
    } else {
      // Try learned mappings
      const learned = this.learnedCountryMappings.get(countryName);
      if (learned && learned[language as keyof typeof learned]) {
        translation = learned[language as keyof typeof learned];
      }
    }

    // Cache the result
    this.translationCache.set(cacheKey, {
      translation,
      timestamp: Date.now()
    });

    return translation;
  }

  getTranslationStats() {
    return {
      coreLeagues: Object.keys(this.coreLeagueTranslations).length,
      learnedLeagues: this.learnedLeagueMappings.size,
      coreCountries: Object.keys(this.coreCountryTranslations).length,
      learnedCountries: this.learnedCountryMappings.size,
      cacheSize: this.translationCache.size
    };
  }

  // Export all mappings for backup or sharing
  exportAllMappings() {
    return {
      coreLeagues: this.coreLeagueTranslations,
      learnedLeagues: Object.fromEntries(this.learnedLeagueMappings),
      coreCountries: Object.fromEntries(this.learnedCountryMappings),
      exportDate: new Date().toISOString()
    };
  }

  // Import comprehensive mappings
  importMappings(mappings: any) {
    try {
      if (mappings.learnedLeagues) {
        Object.entries(mappings.learnedLeagues).forEach(([key, value]) => {
          this.learnedLeagueMappings.set(key, value);
        });
      }
      if (mappings.learnedCountries) {
        Object.entries(mappings.learnedCountries).forEach(([key, value]) => {
          this.learnedCountryMappings.set(key, value);
        });
      }
      this.saveLearnedMappings();
      console.log('📥 [SmartLeagueCountryTranslation] Successfully imported comprehensive mappings');
    } catch (error) {
      console.error('❌ [SmartLeagueCountryTranslation] Failed to import mappings:', error);
    }
  }

  // Force learn from a specific set of leagues (useful for bulk updates)
  bulkLearnFromLeagueList(leagues: Array<{name: string, country?: string}>) {
    let learned = 0;
    leagues.forEach(league => {
      if (!this.learnedLeagueMappings.has(league.name)) {
        const mapping = this.createLeagueMapping(league.name, league.country || '');
        if (mapping) {
          this.learnedLeagueMappings.set(league.name, mapping);
          learned++;
        }
      }
    });

    if (learned > 0) {
      this.saveLearnedMappings();
      console.log(`🎓 [Bulk Learn] Added ${learned} new league mappings`);
    }

    return learned;
  }
}

// Create singleton instance
export const smartLeagueCountryTranslation = new SmartLeagueCountryTranslation();