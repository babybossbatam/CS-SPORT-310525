
import { useTranslation } from '@/contexts/LanguageContext';

// League ID to English name mapping
export const LEAGUE_NAME_MAP: Record<number, string> = {
  38: 'Premier League',
  15: 'FIFA Club World Cup',
  2: 'UEFA Champions League',
  4: 'Euro Championship',
  10: 'Friendlies',
  11: 'CONMEBOL Sudamericana',
  848: 'UEFA Conference League',
  886: 'Leagues Cup',
  1022: 'UEFA Women\'s Euro',
  772: 'Leagues Cup',
  71: 'Serie B',
  3: 'UEFA Europa League',
  5: 'UEFA Nations League',
  531: 'UEFA Super Cup',
  22: 'CONCACAF Gold Cup',
  72: 'Serie C - Group A',
  73: 'Serie C - Group B',
  75: 'Serie C - Group C',
  76: 'Serie C - Promotion Play-offs',
  233: 'Egyptian Premier League',
  667: 'Segunda División RFEF',
  940: 'UEFA Youth League',
  908: 'UEFA Women\'s Champions League',
  1169: 'EAFF E-1 Football Championship',
  23: 'EAFF E-1 Football Championship',
  1077: 'WAFF Championship U23',
  253: 'Major League Soccer',
  850: 'USL Championship',
  893: 'Canadian Premier League',
  921: 'Liga de Expansión MX',
  130: 'Copa Libertadores Femenina',
  128: 'Primera División - Apertura',
  493: 'UEFA U19 Championship',
  239: 'Liga Dimayor I',
  265: 'Primera División',
  237: 'Primera División',
  235: 'Primera División',
  743: 'Baltic Cup'
};

// Automated league name detection and mapping
class SmartLeagueTranslation {
  private leagueCache = new Map<string, string>();
  private learnedLeagueMappings = new Map<string, any>();
  
  constructor() {
    this.loadLearnedMappings();
  }

  private loadLearnedMappings() {
    try {
      const stored = localStorage.getItem('learnedLeagueMappings');
      if (stored) {
        const mappings = JSON.parse(stored);
        this.learnedLeagueMappings = new Map(Object.entries(mappings));
        console.log(`🎓 [LeagueTranslation] Loaded ${this.learnedLeagueMappings.size} learned league mappings`);
      }
    } catch (error) {
      console.warn('[LeagueTranslation] Failed to load learned mappings:', error);
    }
  }

  private saveLearnedMappings() {
    try {
      const mappings = Object.fromEntries(this.learnedLeagueMappings);
      localStorage.setItem('learnedLeagueMappings', JSON.stringify(mappings));
    } catch (error) {
      console.warn('[LeagueTranslation] Failed to save learned mappings:', error);
    }
  }

  // Learn league names from API responses
  learnLeaguesFromFixtures(fixtures: any[]): void {
    let newMappingsCount = 0;
    
    fixtures.forEach(fixture => {
      if (!fixture?.league?.name || !fixture?.league?.country) return;
      
      const leagueName = fixture.league.name;
      const countryName = fixture.league.country;
      const leagueId = fixture.league.id;
      
      if (!this.learnedLeagueMappings.has(leagueName)) {
        const mapping = this.createLeagueMapping(leagueName, countryName, leagueId);
        if (mapping) {
          this.learnedLeagueMappings.set(leagueName, mapping);
          newMappingsCount++;
        }
      }
    });
    
    if (newMappingsCount > 0) {
      this.saveLearnedMappings();
      console.log(`📖 [LeagueTranslation] Learned ${newMappingsCount} new league mappings`);
    }
  }

  private createLeagueMapping(leagueName: string, countryName: string, leagueId: number) {
    return {
      id: leagueId,
      name: leagueName,
      country: countryName,
      translations: this.generateLeagueTranslations(leagueName, countryName)
    };
  }

  private generateLeagueTranslations(leagueName: string, countryName: string) {
    // Basic translation patterns based on common league structures
    const translations: Record<string, string> = {
      'en': leagueName
    };

    // Add specific translations based on league patterns
    if (leagueName.toLowerCase().includes('premier league')) {
      translations['zh'] = '超级联赛';
      translations['zh-hk'] = '超級聯賽';
      translations['zh-tw'] = '超級聯賽';
      translations['es'] = 'Liga Premier';
      translations['de'] = 'Premier League';
      translations['it'] = 'Premier League';
      translations['pt'] = 'Liga Premier';
    } else if (leagueName.toLowerCase().includes('championship')) {
      translations['zh'] = '冠军联赛';
      translations['zh-hk'] = '冠軍聯賽';
      translations['zh-tw'] = '冠軍聯賽';
      translations['es'] = 'Championship';
      translations['de'] = 'Championship';
      translations['it'] = 'Championship';
      translations['pt'] = 'Championship';
    } else if (leagueName.toLowerCase().includes('primera división') || leagueName.toLowerCase().includes('primera division')) {
      translations['zh'] = '甲级联赛';
      translations['zh-hk'] = '甲級聯賽';
      translations['zh-tw'] = '甲級聯賽';
      translations['es'] = 'Primera División';
      translations['de'] = 'Primera División';
      translations['it'] = 'Primera División';
      translations['pt'] = 'Primeira Divisão';
    }

    return translations;
  }

  translateLeague(leagueName: string, language: string): string {
    // Check static mappings first
    const staticTranslation = LEAGUE_TRANSLATION_PATTERNS[language]?.[leagueName];
    if (staticTranslation) return staticTranslation;

    // Check learned mappings
    const learned = this.learnedLeagueMappings.get(leagueName);
    if (learned?.translations?.[language]) {
      return learned.translations[language];
    }

    return leagueName;
  }

  clearCache(): void {
    this.leagueCache.clear();
    console.log('🧹 [SmartLeagueTranslation] Cache cleared');
  }
}

// Create singleton instance
export const smartLeagueTranslation = new SmartLeagueTranslation();

// Translation patterns for different languages
export const LEAGUE_TRANSLATION_PATTERNS: Record<string, Record<string, string>> = {
  'zh-hk': {
    'Premier League': '英格蘭超級聯賽',
    'FIFA Club World Cup': 'FIFA世界冠軍球會盃',
    'UEFA Champions League': '歐洲聯賽冠軍盃',
    'Euro Championship': '歐洲國家盃',
    'Friendlies': '友誼賽',
    'CONMEBOL Sudamericana': '南美洲盃',
    'UEFA Conference League': '歐洲協會聯賽',
    'Leagues Cup': '聯賽盃',
    'UEFA Women\'s Euro': '歐洲女子國家盃',
    'Serie B': '意乙',
    'UEFA Europa League': '歐霸盃',
    'UEFA Nations League': '歐洲國家聯賽',
    'UEFA Super Cup': '歐洲超級盃',
    'CONCACAF Gold Cup': '中北美洲及加勒比海金盃',
    'Serie C - Group A': '意丙 A組',
    'Serie C - Group B': '意丙 B組',
    'Serie C - Group C': '意丙 C組',
    'Serie C - Promotion Play-offs': '意丙升班附加賽',
    'Egyptian Premier League': '埃及超級聯賽',
    'Segunda División RFEF': '西班牙第三級聯賽',
    'UEFA Youth League': '歐洲青年聯賽',
    'UEFA Women\'s Champions League': '歐洲女子聯賽冠軍盃',
    'EAFF E-1 Football Championship': '東亞盃',
    'WAFF Championship U23': '西亞23歲以下錦標賽',
    'Major League Soccer': '美國職業足球大聯盟',
    'USL Championship': '美國足球冠軍聯賽',
    'Canadian Premier League': '加拿大超級聯賽',
    'Liga de Expansión MX': '墨西哥擴展聯賽',
    'Copa Libertadores Femenina': '南美解放者盃女子版',
    'Primera División - Apertura': '春季聯賽',
    'UEFA U19 Championship': '歐洲19歲以下錦標賽',
    'Liga Dimayor I': '哥倫比亞甲級聯賽',
    'Primera División': '甲級聯賽',
    'Baltic Cup': '波羅的海盃'
  },
  'zh': {
    'Premier League': '英格兰超级联赛',
    'FIFA Club World Cup': 'FIFA世界俱乐部杯',
    'UEFA Champions League': '欧洲冠军联赛',
    'Euro Championship': '欧洲杯',
    'Friendlies': '友谊赛',
    'CONMEBOL Sudamericana': '南美洲杯',
    'UEFA Conference League': '欧洲协会联赛',
    'Leagues Cup': '联赛杯',
    'UEFA Women\'s Euro': '欧洲女子杯',
    'Serie B': '意乙',
    'UEFA Europa League': '欧联杯',
    'UEFA Nations League': '欧洲国家联赛',
    'UEFA Super Cup': '欧洲超级杯',
    'CONCACAF Gold Cup': '中北美及加勒比海金杯',
    'Serie C - Group A': '意丙A组',
    'Serie C - Group B': '意丙B组',
    'Serie C - Group C': '意丙C组',
    'Serie C - Promotion Play-offs': '意丙升级附加赛',
    'Egyptian Premier League': '埃及超级联赛',
    'Segunda División RFEF': '西班牙第三级联赛',
    'UEFA Youth League': '欧洲青年联赛',
    'UEFA Women\'s Champions League': '欧洲女子冠军联赛',
    'EAFF E-1 Football Championship': '东亚杯',
    'WAFF Championship U23': '西亚23岁以下锦标赛',
    'Major League Soccer': '美国职业足球大联盟',
    'USL Championship': '美国足球冠军联赛',
    'Canadian Premier League': '加拿大超级联赛',
    'Liga de Expansión MX': '墨西哥扩展联赛',
    'Copa Libertadores Femenina': '南美解放者杯女子版',
    'Primera División - Apertura': '春季联赛',
    'UEFA U19 Championship': '欧洲19岁以下锦标赛',
    'Liga Dimayor I': '哥伦比亚甲级联赛',
    'Primera División': '甲级联赛',
    'Baltic Cup': '波罗的海杯'
  },
  'es': {
    'Premier League': 'Premier League',
    'FIFA Club World Cup': 'Copa Mundial de Clubes FIFA',
    'UEFA Champions League': 'Liga de Campeones de la UEFA',
    'Euro Championship': 'Eurocopa',
    'Friendlies': 'Amistosos',
    'CONMEBOL Sudamericana': 'Copa Sudamericana',
    'UEFA Conference League': 'Liga de la Conferencia UEFA',
    'Leagues Cup': 'Copa de Ligas',
    'UEFA Women\'s Euro': 'Eurocopa Femenina',
    'Serie B': 'Serie B',
    'UEFA Europa League': 'Liga Europa UEFA',
    'UEFA Nations League': 'Liga de Naciones UEFA',
    'UEFA Super Cup': 'Supercopa de Europa',
    'CONCACAF Gold Cup': 'Copa de Oro CONCACAF',
    'Serie C - Group A': 'Serie C - Grupo A',
    'Serie C - Group B': 'Serie C - Grupo B',
    'Serie C - Group C': 'Serie C - Grupo C',
    'Serie C - Promotion Play-offs': 'Serie C - Playoffs de Ascenso',
    'Egyptian Premier League': 'Liga Premier de Egipto',
    'Segunda División RFEF': 'Segunda División RFEF',
    'UEFA Youth League': 'Liga Juvenil UEFA',
    'UEFA Women\'s Champions League': 'Liga de Campeones Femenina UEFA',
    'EAFF E-1 Football Championship': 'Campeonato de Fútbol E-1 EAFF',
    'WAFF Championship U23': 'Campeonato WAFF Sub-23',
    'Major League Soccer': 'Liga Mayor de Fútbol',
    'USL Championship': 'Campeonato USL',
    'Canadian Premier League': 'Liga Premier Canadiense',
    'Liga de Expansión MX': 'Liga de Expansión MX',
    'Copa Libertadores Femenina': 'Copa Libertadores Femenina',
    'Primera División - Apertura': 'Primera División - Apertura',
    'UEFA U19 Championship': 'Campeonato Sub-19 UEFA',
    'Liga Dimayor I': 'Liga Dimayor I',
    'Primera División': 'Primera División',
    'Baltic Cup': 'Copa Báltica'
  }
};

// Main translation function for league names
export function translateLeagueName(leagueId: number | string, leagueName?: string, currentLanguage: string = 'en'): string {
  // Convert to number if string
  const numericLeagueId = typeof leagueId === 'string' ? parseInt(leagueId, 10) : leagueId;
  
  // Get the English name from mapping
  const englishName = LEAGUE_NAME_MAP[numericLeagueId] || leagueName;
  
  if (!englishName) {
    return `League ${numericLeagueId}`;
  }
  
  // If current language is English or not supported, return English name
  if (currentLanguage === 'en' || !LEAGUE_TRANSLATION_PATTERNS[currentLanguage]) {
    return englishName;
  }
  
  // Get translation for the current language
  const translations = LEAGUE_TRANSLATION_PATTERNS[currentLanguage];
  return translations[englishName] || englishName;
}

// Hook for easy integration with React components
export function useLeagueNameTranslation() {
  const { currentLanguage } = useTranslation();
  
  return {
    translateLeague: (leagueId: number | string, fallbackName?: string) => 
      translateLeagueName(leagueId, fallbackName, currentLanguage),
    getLeagueMapping: () => LEAGUE_NAME_MAP,
    getSupportedLanguages: () => Object.keys(LEAGUE_TRANSLATION_PATTERNS)
  };
}

// Bulk translation for multiple leagues
export function translateMultipleLeagues(
  leagueIds: Array<number | string>, 
  currentLanguage: string = 'en'
): Record<string, string> {
  const result: Record<string, string> = {};
  
  leagueIds.forEach(id => {
    result[id.toString()] = translateLeagueName(id, undefined, currentLanguage);
  });
  
  return result;
}

// Get all league names for a specific language
export function getAllLeagueNamesForLanguage(language: string = 'en'): Record<number, string> {
  const result: Record<number, string> = {};
  
  Object.entries(LEAGUE_NAME_MAP).forEach(([id, englishName]) => {
    const numericId = parseInt(id, 10);
    result[numericId] = translateLeagueName(numericId, englishName, language);
  });
  
  return result;
}
