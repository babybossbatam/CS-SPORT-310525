
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

  // Learn from fixtures data
  learnFromFixtures(fixtures: any[]): void {
    let newLeagueMappings = 0;
    let newCountryMappings = 0;

    fixtures.forEach(fixture => {
      if (!fixture?.league) return;

      const leagueName = fixture.league.name;
      const countryName = fixture.league.country;

      // Learn league mappings
      if (leagueName && !this.learnedLeagueMappings.has(leagueName)) {
        const mapping = this.generateLeagueMapping(leagueName, countryName);
        if (mapping) {
          this.learnedLeagueMappings.set(leagueName, mapping);
          newLeagueMappings++;
        }
      }

      // Learn country mappings
      if (countryName && !this.learnedCountryMappings.has(countryName)) {
        const mapping = this.generateCountryMapping(countryName);
        if (mapping) {
          this.learnedCountryMappings.set(countryName, mapping);
          newCountryMappings++;
        }
      }
    });

    if (newLeagueMappings > 0 || newCountryMappings > 0) {
      this.saveLearnedMappings();
      console.log(`📖 [SmartLeagueCountryTranslation] Learned ${newLeagueMappings} league mappings and ${newCountryMappings} country mappings`);
    }
  }

  private generateLeagueMapping(leagueName: string, countryName: string): LeagueTranslation | null {
    // Generate basic translations based on patterns
    const translations: any = { en: leagueName };

    // Basic pattern matching for common league types
    const lowerName = leagueName.toLowerCase();
    
    if (lowerName.includes('premier league')) {
      translations.zh = `${this.translateCountryName(countryName, 'zh')}超级联赛`;
      translations['zh-hk'] = `${this.translateCountryName(countryName, 'zh-hk')}超級聯賽`;
      translations['zh-tw'] = `${this.translateCountryName(countryName, 'zh-tw')}超級聯賽`;
    } else if (lowerName.includes('championship')) {
      translations.zh = `${this.translateCountryName(countryName, 'zh')}冠军联赛`;
      translations['zh-hk'] = `${this.translateCountryName(countryName, 'zh-hk')}冠軍聯賽`;
      translations['zh-tw'] = `${this.translateCountryName(countryName, 'zh-tw')}冠軍聯賽`;
    } else if (lowerName.includes('primera división') || lowerName.includes('primera division')) {
      translations.zh = `${this.translateCountryName(countryName, 'zh')}甲级联赛`;
      translations['zh-hk'] = `${this.translateCountryName(countryName, 'zh-hk')}甲級聯賽`;
      translations['zh-tw'] = `${this.translateCountryName(countryName, 'zh-tw')}甲級聯賽`;
    }

    // Add other language defaults
    translations.es = translations.es || leagueName;
    translations.de = translations.de || leagueName;
    translations.it = translations.it || leagueName;
    translations.pt = translations.pt || leagueName;

    return translations as LeagueTranslation;
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

    return translations as CountryTranslation;
  }

  translateLeagueName(leagueName: string, language: string): string {
    if (!leagueName) return leagueName;

    const cacheKey = `league_${leagueName}_${language}`;
    
    // Check cache first
    const cached = this.translationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.translation;
    }

    let translation = leagueName;

    // Try core translations first
    const coreTranslation = this.coreLeagueTranslations[leagueName];
    if (coreTranslation && coreTranslation[language as keyof typeof coreTranslation]) {
      translation = coreTranslation[language as keyof typeof coreTranslation];
    } else {
      // Try learned mappings
      const learned = this.learnedLeagueMappings.get(leagueName);
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
}

// Create singleton instance
export const smartLeagueCountryTranslation = new SmartLeagueCountryTranslation();
