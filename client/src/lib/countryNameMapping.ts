
// Country Name Mapping with Enhanced Translation Support
import { getCachedCountryName, setCachedCountryName } from './countryCache';

interface CountryMapping {
  [key: string]: {
    en: string;
    zh?: string;
    'zh-hk'?: string;
    'zh-tw'?: string;
    es?: string;
    de?: string;
    it?: string;
    pt?: string;
  };
}

// Core country mappings - most commonly used
const coreCountryMappings: CountryMapping = {
  'england': {
    en: 'England',
    zh: '英格兰',
    'zh-hk': '英格蘭',
    'zh-tw': '英格蘭',
    es: 'Inglaterra',
    de: 'England',
    it: 'Inghilterra',
    pt: 'Inglaterra'
  },
  'spain': {
    en: 'Spain',
    zh: '西班牙',
    'zh-hk': '西班牙',
    'zh-tw': '西班牙',
    es: 'España',
    de: 'Spanien',
    it: 'Spagna',
    pt: 'Espanha'
  },
  'germany': {
    en: 'Germany',
    zh: '德国',
    'zh-hk': '德國',
    'zh-tw': '德國',
    es: 'Alemania',
    de: 'Deutschland',
    it: 'Germania',
    pt: 'Alemanha'
  },
  'italy': {
    en: 'Italy',
    zh: '意大利',
    'zh-hk': '意大利',
    'zh-tw': '意大利',
    es: 'Italia',
    de: 'Italien',
    it: 'Italia',
    pt: 'Itália'
  },
  'france': {
    en: 'France',
    zh: '法国',
    'zh-hk': '法國',
    'zh-tw': '法國',
    es: 'Francia',
    de: 'Frankreich',
    it: 'Francia',
    pt: 'França'
  },
  'brazil': {
    en: 'Brazil',
    zh: '巴西',
    'zh-hk': '巴西',
    'zh-tw': '巴西',
    es: 'Brasil',
    de: 'Brasilien',
    it: 'Brasile',
    pt: 'Brasil'
  },
  'argentina': {
    en: 'Argentina',
    zh: '阿根廷',
    'zh-hk': '阿根廷',
    'zh-tw': '阿根廷',
    es: 'Argentina',
    de: 'Argentinien',
    it: 'Argentina',
    pt: 'Argentina'
  },
  'netherlands': {
    en: 'Netherlands',
    zh: '荷兰',
    'zh-hk': '荷蘭',
    'zh-tw': '荷蘭',
    es: 'Países Bajos',
    de: 'Niederlande',
    it: 'Paesi Bassi',
    pt: 'Países Baixos'
  },
  'portugal': {
    en: 'Portugal',
    zh: '葡萄牙',
    'zh-hk': '葡萄牙',
    'zh-tw': '葡萄牙',
    es: 'Portugal',
    de: 'Portugal',
    it: 'Portogallo',
    pt: 'Portugal'
  },
  'world': {
    en: 'World',
    zh: '世界',
    'zh-hk': '世界',
    'zh-tw': '世界',
    es: 'Mundial',
    de: 'Welt',
    it: 'Mondo',
    pt: 'Mundial'
  },
  'europe': {
    en: 'Europe',
    zh: '欧洲',
    'zh-hk': '歐洲',
    'zh-tw': '歐洲',
    es: 'Europa',
    de: 'Europa',
    it: 'Europa',
    pt: 'Europa'
  },
  'international': {
    en: 'International',
    zh: '国际',
    'zh-hk': '國際',
    'zh-tw': '國際',
    es: 'Internacional',
    de: 'International',
    it: 'Internazionale',
    pt: 'Internacional'
  }
};

// Extended country mappings
const extendedCountryMappings: CountryMapping = {
  'united-states': {
    en: 'United States',
    zh: '美国',
    'zh-hk': '美國',
    'zh-tw': '美國',
    es: 'Estados Unidos',
    de: 'Vereinigte Staaten',
    it: 'Stati Uniti',
    pt: 'Estados Unidos'
  },
  'united-kingdom': {
    en: 'United Kingdom',
    zh: '英国',
    'zh-hk': '英國',
    'zh-tw': '英國',
    es: 'Reino Unido',
    de: 'Vereinigtes Königreich',
    it: 'Regno Unito',
    pt: 'Reino Unido'
  },
  'russia': {
    en: 'Russia',
    zh: '俄罗斯',
    'zh-hk': '俄羅斯',
    'zh-tw': '俄羅斯',
    es: 'Rusia',
    de: 'Russland',
    it: 'Russia',
    pt: 'Rússia'
  },
  'china': {
    en: 'China',
    zh: '中国',
    'zh-hk': '中國',
    'zh-tw': '中國',
    es: 'China',
    de: 'China',
    it: 'Cina',
    pt: 'China'
  },
  'japan': {
    en: 'Japan',
    zh: '日本',
    'zh-hk': '日本',
    'zh-tw': '日本',
    es: 'Japón',
    de: 'Japan',
    it: 'Giappone',
    pt: 'Japão'
  },
  'south-korea': {
    en: 'South Korea',
    zh: '韩国',
    'zh-hk': '韓國',
    'zh-tw': '韓國',
    es: 'Corea del Sur',
    de: 'Südkorea',
    it: 'Corea del Sud',
    pt: 'Coreia do Sul'
  },
  'australia': {
    en: 'Australia',
    zh: '澳大利亚',
    'zh-hk': '澳大利亞',
    'zh-tw': '澳大利亞',
    es: 'Australia',
    de: 'Australien',
    it: 'Australia',
    pt: 'Austrália'
  },
  'canada': {
    en: 'Canada',
    zh: '加拿大',
    'zh-hk': '加拿大',
    'zh-tw': '加拿大',
    es: 'Canadá',
    de: 'Kanada',
    it: 'Canada',
    pt: 'Canadá'
  },
  'mexico': {
    en: 'Mexico',
    zh: '墨西哥',
    'zh-hk': '墨西哥',
    'zh-tw': '墨西哥',
    es: 'México',
    de: 'Mexiko',
    it: 'Messico',
    pt: 'México'
  },
  'colombia': {
    en: 'Colombia',
    zh: '哥伦比亚',
    'zh-hk': '哥倫比亞',
    'zh-tw': '哥倫比亞',
    es: 'Colombia',
    de: 'Kolumbien',
    it: 'Colombia',
    pt: 'Colômbia'
  },
  'chile': {
    en: 'Chile',
    zh: '智利',
    'zh-hk': '智利',
    'zh-tw': '智利',
    es: 'Chile',
    de: 'Chile',
    it: 'Cile',
    pt: 'Chile'
  },
  'uruguay': {
    en: 'Uruguay',
    zh: '乌拉圭',
    'zh-hk': '烏拉圭',
    'zh-tw': '烏拉圭',
    es: 'Uruguay',
    de: 'Uruguay',
    it: 'Uruguay',
    pt: 'Uruguai'
  },
  'peru': {
    en: 'Peru',
    zh: '秘鲁',
    'zh-hk': '秘魯',
    'zh-tw': '秘魯',
    es: 'Perú',
    de: 'Peru',
    it: 'Perù',
    pt: 'Peru'
  },
  'ecuador': {
    en: 'Ecuador',
    zh: '厄瓜多尔',
    'zh-hk': '厄瓜多爾',
    'zh-tw': '厄瓜多爾',
    es: 'Ecuador',
    de: 'Ecuador',
    it: 'Ecuador',
    pt: 'Equador'
  },
  'bolivia': {
    en: 'Bolivia',
    zh: '玻利维亚',
    'zh-hk': '玻利維亞',
    'zh-tw': '玻利維亞',
    es: 'Bolivia',
    de: 'Bolivien',
    it: 'Bolivia',
    pt: 'Bolívia'
  },
  'venezuela': {
    en: 'Venezuela',
    zh: '委内瑞拉',
    'zh-hk': '委內瑞拉',
    'zh-tw': '委內瑞拉',
    es: 'Venezuela',
    de: 'Venezuela',
    it: 'Venezuela',
    pt: 'Venezuela'
  },
  'paraguay': {
    en: 'Paraguay',
    zh: '巴拉圭',
    'zh-hk': '巴拉圭',
    'zh-tw': '巴拉圭',
    es: 'Paraguay',
    de: 'Paraguay',
    it: 'Paraguay',
    pt: 'Paraguai'
  }
};

// Combine all mappings
const allCountryMappings = { ...coreCountryMappings, ...extendedCountryMappings };

class CountryTranslationService {
  private learnedCountryMappings = new Map<string, CountryMapping[string]>();

  constructor() {
    this.loadLearnedMappings();
  }

  // Get country translation
  getCountryTranslation(countryName: string, language: string = 'en'): string {
    if (!countryName) return '';

    // Check cache first
    const cacheKey = `${countryName.toLowerCase()}-${language}`;
    const cached = getCachedCountryName(countryName, 'country-translation');
    if (cached && cached !== countryName) {
      return cached;
    }

    const normalizedCountry = this.normalizeCountryName(countryName);
    
    // Check core mappings
    const coreMapping = allCountryMappings[normalizedCountry];
    if (coreMapping) {
      const translation = coreMapping[language as keyof CountryMapping[string]] || coreMapping.en || countryName;
      setCachedCountryName(countryName, translation, 'country-translation');
      return translation;
    }

    // Check learned mappings
    const learnedMapping = this.learnedCountryMappings.get(normalizedCountry);
    if (learnedMapping) {
      const translation = learnedMapping[language as keyof CountryMapping[string]] || learnedMapping.en || countryName;
      setCachedCountryName(countryName, translation, 'country-translation');
      return translation;
    }

    // Return original if no translation found
    return countryName;
  }

  // Normalize country name for mapping lookup
  private normalizeCountryName(countryName: string): string {
    return countryName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }

  // Create country mapping from analysis
  private createCountryMapping(countryName: string): CountryMapping[string] | null {
    const normalized = countryName.toLowerCase().trim();
    
    // Simple heuristics for common patterns
    if (normalized.includes('united states') || normalized.includes('usa')) {
      return allCountryMappings['united-states'];
    }
    
    if (normalized.includes('united kingdom') || normalized.includes('uk')) {
      return allCountryMappings['united-kingdom'];
    }
    
    if (normalized.includes('south korea')) {
      return allCountryMappings['south-korea'];
    }

    // Return null if no mapping can be created
    return null;
  }

  // Load learned mappings from localStorage
  private loadLearnedMappings() {
    try {
      const stored = localStorage.getItem('learnedCountryMappings');
      if (stored) {
        const mappings = JSON.parse(stored);
        this.learnedCountryMappings = new Map(Object.entries(mappings));
      }
    } catch (error) {
      console.warn('[CountryTranslation] Failed to load learned mappings:', error);
    }
  }

  private saveLearnedMappings() {
    try {
      const mappings = Object.fromEntries(this.learnedCountryMappings);
      localStorage.setItem('learnedCountryMappings', JSON.stringify(mappings));
    } catch (error) {
      console.warn('[CountryTranslation] Failed to save learned mappings:', error);
    }
  }

  // Learn country names from API responses
  learnCountriesFromFixtures(fixtures: any[]): void {
    let newMappingsCount = 0;
    
    fixtures.forEach(fixture => {
      if (!fixture?.league?.country) return;
      
      const countryName = fixture.league.country;
      
      if (!allCountryMappings[this.normalizeCountryName(countryName)] && !this.learnedCountryMappings.has(this.normalizeCountryName(countryName))) {
        const mapping = this.createCountryMapping(countryName);
        if (mapping) {
          this.learnedCountryMappings.set(this.normalizeCountryName(countryName), mapping);
          newMappingsCount++;
        }
      }
    });
    
    if (newMappingsCount > 0) {
      this.saveLearnedMappings();
      console.log(`📖 [CountryTranslation] Learned ${newMappingsCount} new country mappings`);
    }
  }

  // Get cache stats
  getCacheStats() {
    return {
      coreCountries: Object.keys(allCountryMappings).length,
      learnedCountries: this.learnedCountryMappings.size,
      totalCountries: Object.keys(allCountryMappings).length + this.learnedCountryMappings.size
    };
  }
}

// Create singleton instance
const countryTranslationService = new CountryTranslationService();

// Export the service and utility functions
export { countryTranslationService };
export const getCountryTranslation = (countryName: string, language: string = 'en') => 
  countryTranslationService.getCountryTranslation(countryName, language);
export const learnCountriesFromFixtures = (fixtures: any[]) => 
  countryTranslationService.learnCountriesFromFixtures(fixtures);
export const getCountryTranslationStats = () => 
  countryTranslationService.getCacheStats();
