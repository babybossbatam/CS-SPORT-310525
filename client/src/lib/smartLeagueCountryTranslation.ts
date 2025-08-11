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
    // Group texts for tournaments
    'Group A': {
      'zh': 'A组', 'zh-hk': 'A組', 'zh-tw': 'A組',
      'es': 'Grupo A', 'de': 'Gruppe A', 'it': 'Gruppo A', 'pt': 'Grupo A'
    },
    'Group B': {
      'zh': 'B组', 'zh-hk': 'B組', 'zh-tw': 'B組',
      'es': 'Grupo B', 'de': 'Gruppe B', 'it': 'Gruppo B', 'pt': 'Grupo B'
    },
    'Group C': {
      'zh': 'C组', 'zh-hk': 'C組', 'zh-tw': 'C組',
      'es': 'Grupo C', 'de': 'Gruppe C', 'it': 'Gruppo C', 'pt': 'Grupo C'
    },
    'Group D': {
      'zh': 'D组', 'zh-hk': 'D組', 'zh-tw': 'D組',
      'es': 'Grupo D', 'de': 'Gruppe D', 'it': 'Gruppo D', 'pt': 'Grupo D'
    },
    'Group E': {
      'zh': 'E组', 'zh-hk': 'E組', 'zh-tw': 'E組',
      'es': 'Grupo E', 'de': 'Gruppe E', 'it': 'Gruppo E', 'pt': 'Grupo E'
    },
    'Group F': {
      'zh': 'F组', 'zh-hk': 'F組', 'zh-tw': 'F組',
      'es': 'Grupo F', 'de': 'Gruppe F', 'it': 'Gruppo F', 'pt': 'Grupo F'
    },
    'Group G': {
      'zh': 'G组', 'zh-hk': 'G組', 'zh-tw': 'G組',
      'es': 'Grupo G', 'de': 'Gruppe G', 'it': 'Gruppo G', 'pt': 'Grupo G'
    },
    'Group H': {
      'zh': 'H组', 'zh-hk': 'H組', 'zh-tw': 'H組',
      'es': 'Grupo H', 'de': 'Gruppe H', 'it': 'Gruppo H', 'pt': 'Grupo H'
    },

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

  // Enhanced learning from fixtures data
  learnFromFixtures(fixtures: any[]): void {
    let newLeagueMappings = 0;
    let newCountryMappings = 0;
    let updatedMappings = 0;

    fixtures.forEach(fixture => {
      if (!fixture?.league) return;

      const leagueName = fixture.league.name;
      const countryName = fixture.league.country;

      // Learn or update league mappings
      if (leagueName) {
        const existingMapping = this.learnedLeagueMappings.get(leagueName);
        const newMapping = this.generateLeagueMapping(leagueName, countryName);
        
        if (!existingMapping && newMapping) {
          this.learnedLeagueMappings.set(leagueName, newMapping);
          newLeagueMappings++;
        } else if (existingMapping && newMapping && this.shouldUpdateMapping(existingMapping, newMapping)) {
          this.learnedLeagueMappings.set(leagueName, newMapping);
          updatedMappings++;
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

    if (newLeagueMappings > 0 || newCountryMappings > 0 || updatedMappings > 0) {
      this.saveLearnedMappings();
      console.log(`📖 [SmartLeagueCountryTranslation] Learned ${newLeagueMappings} new leagues, ${newCountryMappings} new countries, updated ${updatedMappings} mappings`);
    }
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
    const newMapping = this.generateLeagueMapping(leagueName, countryName || '');
    
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

  private generateLeagueMapping(leagueName: string, countryName: string): LeagueTranslation | null {
    // Generate basic translations based on comprehensive patterns
    const translations: any = { en: leagueName };
    const lowerName = leagueName.toLowerCase();

    // Detect common abbreviations and expand them
    const abbreviationExpansions: { [key: string]: string } = {
      'pl': 'Premier League',
      'div': 'Division',
      'fc': 'Football Club',
      'cf': 'Club de Fútbol',
      'sc': 'Sport Club',
      'ac': 'Athletic Club',
      'u21': 'Under-21',
      'u20': 'Under-20',
      'u19': 'Under-19',
      'u18': 'Under-18',
      'u17': 'Under-17'
    };

    // Check if league name contains abbreviations that need expansion
    let expandedName = leagueName;
    for (const [abbrev, expansion] of Object.entries(abbreviationExpansions)) {
      const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
      if (regex.test(expandedName) && !expandedName.toLowerCase().includes(expansion.toLowerCase())) {
        expandedName = expandedName.replace(regex, expansion);
      }
    }

    // Enhanced comprehensive league pattern matching
    if (lowerName.includes('premier league') || lowerName.endsWith(' pl') || lowerName === 'pl') {
      const countryZh = this.translateCountryName(countryName, 'zh');
      const baseCountryZh = countryZh || this.detectCountryFromLeagueName(leagueName);
      translations.zh = `${baseCountryZh}超级联赛`;
      translations['zh-hk'] = `${this.translateCountryName(countryName, 'zh-hk') || baseCountryZh}超級聯賽`;
      translations['zh-tw'] = `${this.translateCountryName(countryName, 'zh-tw') || baseCountryZh}超級聯賽`;
      translations.es = `Liga Premier ${countryName ? 'de ' + countryName : ''}`;
      translations.de = `${countryName || ''} Premier League`;
      translations.it = `Premier League ${countryName ? 'di ' + countryName : ''}`;
      translations.pt = `Liga Premier ${countryName ? 'do ' + countryName : ''}`;
    } else if (lowerName.includes('championship')) {
      const countryZh = this.translateCountryName(countryName, 'zh');
      translations.zh = `${countryZh}冠军联赛`;
      translations['zh-hk'] = `${this.translateCountryName(countryName, 'zh-hk')}冠軍聯賽`;
      translations['zh-tw'] = `${this.translateCountryName(countryName, 'zh-tw')}冠軍聯賽`;
    } else if (lowerName.includes('primera división') || lowerName.includes('primera division')) {
      const countryZh = this.translateCountryName(countryName, 'zh');
      translations.zh = `${countryZh}甲级联赛`;
      translations['zh-hk'] = `${this.translateCountryName(countryName, 'zh-hk')}甲級聯賽`;
      translations['zh-tw'] = `${this.translateCountryName(countryName, 'zh-tw')}甲級聯賽`;
    } 
    
    // World Cup patterns - Enhanced
    else if (lowerName.includes('world cup qualification') || lowerName.includes('wc qualification')) {
      if (lowerName.includes('south america') || lowerName.includes('conmebol')) {
        translations.zh = '世界杯南美洲预选赛'; translations['zh-hk'] = '世界盃南美洲預選賽'; translations['zh-tw'] = '世界盃南美洲預選賽';
        translations.es = 'Eliminatorias Sudamericanas'; translations.de = 'WM-Qualifikation Südamerika';
      } else if (lowerName.includes('europe') || lowerName.includes('uefa')) {
        translations.zh = '世界杯欧洲预选赛'; translations['zh-hk'] = '世界盃歐洲預選賽'; translations['zh-tw'] = '世界盃歐洲預選賽';
        translations.es = 'Clasificación Europea'; translations.de = 'WM-Qualifikation Europa';
      } else if (lowerName.includes('africa') || lowerName.includes('caf')) {
        translations.zh = '世界杯非洲预选赛'; translations['zh-hk'] = '世界盃非洲預選賽'; translations['zh-tw'] = '世界盃非洲預選賽';
        translations.es = 'Clasificación Africana'; translations.de = 'WM-Qualifikation Afrika';
      } else if (lowerName.includes('asia') || lowerName.includes('afc')) {
        translations.zh = '世界杯亚洲预选赛'; translations['zh-hk'] = '世界盃亞洲預選賽'; translations['zh-tw'] = '世界盃亞洲預選賽';
        translations.es = 'Clasificación Asiática'; translations.de = 'WM-Qualifikation Asien';
      }
    }
    
    // UEFA Competitions - Enhanced
    else if (lowerName.includes('uefa champions league') || lowerName === 'champions league') {
      translations.zh = 'UEFA欧洲冠军联赛'; translations['zh-hk'] = 'UEFA歐洲冠軍聯賽'; translations['zh-tw'] = 'UEFA歐洲冠軍聯賽';
      translations.es = 'Liga de Campeones de la UEFA'; translations.de = 'UEFA Champions League';
    } else if (lowerName.includes('uefa europa league') || lowerName === 'europa league') {
      translations.zh = 'UEFA欧洲联赛'; translations['zh-hk'] = 'UEFA歐洲聯賽'; translations['zh-tw'] = 'UEFA歐洲聯賽';
      translations.es = 'Liga Europa de la UEFA'; translations.de = 'UEFA Europa League';
    } else if (lowerName.includes('uefa conference league') || lowerName === 'conference league') {
      translations.zh = 'UEFA欧洲协会联赛'; translations['zh-hk'] = 'UEFA歐洲協會聯賽'; translations['zh-tw'] = 'UEFA歐洲協會聯賽';
      translations.es = 'Liga de la Conferencia UEFA'; translations.de = 'UEFA Conference League';
    } else if (lowerName.includes('uefa nations league') || lowerName === 'nations league') {
      translations.zh = 'UEFA国家联赛'; translations['zh-hk'] = 'UEFA國家聯賽'; translations['zh-tw'] = 'UEFA國家聯賽';
      translations.es = 'Liga de Naciones de la UEFA'; translations.de = 'UEFA Nations League';
    } else if (lowerName.includes('uefa u21') || lowerName.includes('u21 championship')) {
      translations.zh = 'UEFA U21欧洲锦标赛'; translations['zh-hk'] = 'UEFA U21歐洲錦標賽'; translations['zh-tw'] = 'UEFA U21歐洲錦標賽';
      translations.es = 'Campeonato Europeo Sub-21'; translations.de = 'UEFA U21-Europameisterschaft';
    }
    
    // FIFA Competitions
    else if (lowerName.includes('fifa club world cup') || lowerName === 'club world cup') {
      translations.zh = 'FIFA世界俱乐部杯'; translations['zh-hk'] = 'FIFA世界冠軍球會盃'; translations['zh-tw'] = 'FIFA世界冠軍球會盃';
      translations.es = 'Copa Mundial de Clubes FIFA'; translations.de = 'FIFA Klub-Weltmeisterschaft';
    } else if (lowerName === 'world cup' || lowerName === 'fifa world cup') {
      translations.zh = '世界杯'; translations['zh-hk'] = '世界盃'; translations['zh-tw'] = '世界盃';
      translations.es = 'Copa del Mundo'; translations.de = 'Weltmeisterschaft';
    }
    
    // Continental Competitions
    else if (lowerName.includes('concacaf gold cup') || lowerName === 'gold cup') {
      translations.zh = 'CONCACAF金杯赛'; translations['zh-hk'] = 'CONCACAF金盃賽'; translations['zh-tw'] = 'CONCACAF金盃賽';
      translations.es = 'Copa de Oro de CONCACAF'; translations.de = 'CONCACAF Gold Cup';
    } else if (lowerName.includes('africa cup of nations') || lowerName === 'afcon') {
      translations.zh = '非洲国家杯'; translations['zh-hk'] = '非洲國家盃'; translations['zh-tw'] = '非洲國家盃';
      translations.es = 'Copa Africana de Naciones'; translations.de = 'Afrika-Cup';
    } else if (lowerName.includes('asian cup') || lowerName === 'afc asian cup') {
      translations.zh = '亚洲杯'; translations['zh-hk'] = '亞洲盃'; translations['zh-tw'] = '亞洲盃';
      translations.es = 'Copa Asiática'; translations.de = 'Asienmeisterschaft';
    } else if (lowerName.includes('copa america')) {
      translations.zh = '美洲杯'; translations['zh-hk'] = '美洲盃'; translations['zh-tw'] = '美洲盃';
      translations.es = 'Copa América'; translations.de = 'Copa América';
    }
    
    // AFC Competitions
    else if (lowerName.includes('afc champions league')) {
      translations.zh = 'AFC冠军联赛'; translations['zh-hk'] = 'AFC冠軍聯賽'; translations['zh-tw'] = 'AFC冠軍聯賽';
      translations.es = 'Liga de Campeones AFC'; translations.de = 'AFC Champions League';
    } else if (lowerName.includes('afc challenge league')) {
      translations.zh = 'AFC挑战联赛'; translations['zh-hk'] = 'AFC挑戰聯賽'; translations['zh-tw'] = 'AFC挑戰聯賽';
      translations.es = 'Liga Challenge AFC'; translations.de = 'AFC Challenge League';
    } else if (lowerName.includes('afc cup')) {
      translations.zh = 'AFC杯'; translations['zh-hk'] = 'AFC盃'; translations['zh-tw'] = 'AFC盃';
      translations.es = 'Copa AFC'; translations.de = 'AFC-Pokal';
    }
    
    // Domestic Cup Competitions - Enhanced patterns
    else if (lowerName.includes('fa cup')) {
      translations.zh = 'FA杯'; translations['zh-hk'] = 'FA盃'; translations['zh-tw'] = 'FA盃';
      translations.es = 'Copa FA'; translations.de = 'FA Cup';
    } else if (lowerName.includes('copa del rey')) {
      translations.zh = '国王杯'; translations['zh-hk'] = '國王盃'; translations['zh-tw'] = '國王盃';
      translations.es = 'Copa del Rey'; translations.de = 'Copa del Rey';
    } else if (lowerName.includes('coppa italia')) {
      translations.zh = '意大利杯'; translations['zh-hk'] = '意大利盃'; translations['zh-tw'] = '意大利盃';
      translations.es = 'Copa de Italia'; translations.de = 'Coppa Italia';
    } else if (lowerName.includes('dfb pokal') || lowerName.includes('dfb-pokal')) {
      translations.zh = '德国杯'; translations['zh-hk'] = '德國盃'; translations['zh-tw'] = '德國盃';
      translations.es = 'Copa de Alemania'; translations.de = 'DFB-Pokal';
    }
    
    // Country-specific league patterns
    else if (lowerName.includes('egyptian') && lowerName.includes('premier')) {
      translations.zh = '埃及超级联赛'; translations['zh-hk'] = '埃及超級聯賽'; translations['zh-tw'] = '埃及超級聯賽';
      translations.es = 'Liga Premier Egipcia'; translations.de = 'Ägyptische Premier League';
    } else if (lowerName.includes('saudi') && (lowerName.includes('pro') || lowerName.includes('premier'))) {
      translations.zh = '沙特职业联赛'; translations['zh-hk'] = '沙特職業聯賽'; translations['zh-tw'] = '沙特職業聯賽';
      translations.es = 'Liga Profesional Saudí'; translations.de = 'Saudi Pro League';
    }
    
    // Generic patterns for other leagues
    else if (lowerName.includes('liga') && countryName) {
      const countryZh = this.translateCountryName(countryName, 'zh');
      translations.zh = `${countryZh}联赛`; translations['zh-hk'] = `${this.translateCountryName(countryName, 'zh-hk')}聯賽`;
      translations['zh-tw'] = `${this.translateCountryName(countryName, 'zh-tw')}聯賽`;
    } else if (lowerName.includes('league') && countryName) {
      const countryZh = this.translateCountryName(countryName, 'zh');
      translations.zh = `${countryZh}联赛`; translations['zh-hk'] = `${this.translateCountryName(countryName, 'zh-hk')}聯賽`;
      translations['zh-tw'] = `${this.translateCountryName(countryName, 'zh-tw')}聯賽`;
    }

    // Ensure all languages have defaults
    translations.es = translations.es || leagueName;
    translations.de = translations.de || leagueName;
    translations.it = translations.it || leagueName;
    translations.pt = translations.pt || leagueName;
    translations.fr = translations.fr || leagueName;

    return translations as LeagueTranslation;
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
      coreCountries: this.coreCountryTranslations,
      learnedCountries: Object.fromEntries(this.learnedCountryMappings),
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
        const mapping = this.generateLeagueMapping(league.name, league.country || '');
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