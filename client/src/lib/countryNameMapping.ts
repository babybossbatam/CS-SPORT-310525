import { COUNTRY_TRANSLATIONS, translateCountryName as staticTranslateCountryName, hasCountryTranslation } from '../constants/countriesAndLeagues';
import { CountryTranslation } from './countryNameMapping';


class SmartCountryTranslation {
  private countryCache = new Map<string, string>();
  private learnedCountryMappings = new Map<string, CountryTranslation[string]>();

  // Comprehensive country translations
  private popularCountries: CountryTranslation = {
    'England': {
      'zh': '英格兰', 'zh-hk': '英格蘭', 'zh-tw': '英格蘭',
      'es': 'Inglaterra', 'de': 'England', 'it': 'Inghilterra', 'pt': 'Inglaterra'
    },
    'Spain': {
      'zh': '西班牙', 'zh-hk': '西班牙', 'zh-tw': '西班牙',
      'es': 'España', 'de': 'Spanien', 'it': 'Spagna', 'pt': 'Espanha'
    },
    'Germany': {
      'zh': '德国', 'zh-hk': '德國', 'zh-tw': '德國',
      'es': 'Alemania', 'de': 'Deutschland', 'it': 'Germania', 'pt': 'Alemanha'
    },
    'Italy': {
      'zh': '意大利', 'zh-hk': '意大利', 'zh-tw': '意大利',
      'es': 'Italia', 'de': 'Italien', 'it': 'Italia', 'pt': 'Itália'
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
    'United States': {
      'zh': '美国', 'zh-hk': '美國', 'zh-tw': '美國',
      'es': 'Estados Unidos', 'de': 'Vereinigte Staaten', 'it': 'Stati Uniti', 'pt': 'Estados Unidos'
    },
    'Colombia': {
      'zh': '哥伦比亚', 'zh-hk': '哥倫比亞', 'zh-tw': '哥倫比亞',
      'es': 'Colombia', 'de': 'Kolumbien', 'it': 'Colombia', 'pt': 'Colômbia'
    },
    'Chile': {
      'zh': '智利', 'zh-hk': '智利', 'zh-tw': '智利',
      'es': 'Chile', 'de': 'Chile', 'it': 'Cile', 'pt': 'Chile'
    },
    'Egypt': {
      'zh': '埃及', 'zh-hk': '埃及', 'zh-tw': '埃及',
      'es': 'Egipto', 'de': 'Ägypten', 'it': 'Egitto', 'pt': 'Egito'
    },
    'Russia': {
      'zh': '俄罗斯', 'zh-hk': '俄羅斯', 'zh-tw': '俄羅斯',
      'es': 'Rusia', 'de': 'Russland', 'it': 'Russia', 'pt': 'Rússia'
    },
    'Netherlands': {
      'zh': '荷兰', 'zh-hk': '荷蘭', 'zh-tw': '荷蘭',
      'es': 'Países Bajos', 'de': 'Niederlande', 'it': 'Paesi Bassi', 'pt': 'Países Baixos'
    },
    'Portugal': {
      'zh': '葡萄牙', 'zh-hk': '葡萄牙', 'zh-tw': '葡萄牙',
      'es': 'Portugal', 'de': 'Portugal', 'it': 'Portogallo', 'pt': 'Portugal'
    },
    'Belgium': {
      'zh': '比利时', 'zh-hk': '比利時', 'zh-tw': '比利時',
      'es': 'Bélgica', 'de': 'Belgien', 'it': 'Belgio', 'pt': 'Bélgica'
    },
    'Mexico': {
      'zh': '墨西哥', 'zh-hk': '墨西哥', 'zh-tw': '墨西哥',
      'es': 'México', 'de': 'Mexiko', 'it': 'Messico', 'pt': 'México'
    },
    'World': {
      'zh': '世界', 'zh-hk': '世界', 'zh-tw': '世界',
      'es': 'Mundial', 'de': 'Welt', 'it': 'Mondo', 'pt': 'Mundial'
    },
    'Dominican Republic': {
      'zh': '多米尼加共和国', 'zh-hk': '多明尼加共和國', 'zh-tw': '多明尼加共和國',
      'es': 'República Dominicana', 'de': 'Dominikanische Republik', 'it': 'Repubblica Dominicana', 'pt': 'República Dominicana'
    },
    'Dominican-Republic': {
      'zh': '多米尼加共和国', 'zh-hk': '多明尼加共和國', 'zh-tw': '多明尼加共和國',
      'es': 'República Dominicana', 'de': 'Dominikanische Republik', 'it': 'Repubblica Dominicana', 'pt': 'República Dominicana'
    },
    'Czech Republic': {
      'zh': '捷克共和国', 'zh-hk': '捷克共和國', 'zh-tw': '捷克共和國',
      'es': 'República Checa', 'de': 'Tschechische Republik', 'it': 'Repubblica Ceca', 'pt': 'República Tcheca'
    },
    'Czech-Republic': {
      'zh': '捷克共和国', 'zh-hk': '捷克共和國', 'zh-tw': '捷克共和國',
      'es': 'República Checa', 'de': 'Tschechische Republik', 'it': 'Repubblica Ceca', 'pt': 'República Tcheca'
    }
  };

  constructor() {
    this.loadLearnedMappings();
  }

  private loadLearnedMappings() {
    try {
      const stored = localStorage.getItem('learnedCountryMappings');
      if (stored) {
        const mappings = JSON.parse(stored);
        this.learnedCountryMappings = new Map(Object.entries(mappings));
        console.log(`🎓 [CountryTranslation] Loaded ${this.learnedCountryMappings.size} learned country mappings`);
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

      if (!this.popularCountries[countryName] && !this.learnedCountryMappings.has(countryName)) {
        const mapping = this.createCountryMapping(countryName);
        if (mapping) {
          this.learnedCountryMappings.set(countryName, mapping);
          newMappingsCount++;
        }
      }
    });

    if (newMappingsCount > 0) {
      this.saveLearnedMappings();
      console.log(`📖 [CountryTranslation] Learned ${newMappingsCount} new country mappings`);
    }
  }

  private createCountryMapping(countryName: string): CountryTranslation[string] | null {
    // Basic fallback - keep original name for all languages
    return {
      'zh': countryName,
      'zh-hk': countryName,
      'zh-tw': countryName,
      'es': countryName,
      'de': countryName,
      'it': countryName,
      'pt': countryName
    };
  }

  translateCountryName(countryName: string, targetLanguage: string): string {
    // Check cache first
    const cacheKey = `${countryName}-${targetLanguage}`;
    if (this.countryCache.has(cacheKey)) {
      return this.countryCache.get(cacheKey)!;
    }

    let translatedName = countryName;

    // First, try the comprehensive static translations
    const staticTranslation = staticTranslateCountryName(countryName, targetLanguage);
    if (staticTranslation && staticTranslation !== countryName) {
      translatedName = staticTranslation;
    }
    // Fallback to local mappings
    else if (countryMappings[countryName] && countryMappings[countryName][targetLanguage as keyof CountryTranslation[string]]) {
      translatedName = countryMappings[countryName][targetLanguage as keyof CountryTranslation[string]];
    }

    // Cache the result
    this.countryCache.set(cacheKey, translatedName);
    return translatedName;
  }

  // Auto-detect and translate all countries in fixture data
  processFixtureCountries(fixtures: any[], language: string): any[] {
    this.learnCountriesFromFixtures(fixtures);

    return fixtures.map(fixture => {
      if (fixture?.league?.country) {
        return {
          ...fixture,
          league: {
            ...fixture.league,
            country: this.translateCountryName(fixture.league.country, language)
          }
        };
      }
      return fixture;
    });
  }
}

// Create singleton instance
export const smartCountryTranslation = new SmartCountryTranslation();

// Main translation function for country names
export function translateCountryName(countryName: string, language: string = 'en'): string {
  return smartCountryTranslation.translateCountryName(countryName, language);
}

// Bulk translation for multiple countries
export function translateMultipleCountries(
  countries: string[],
  language: string = 'en'
): Record<string, string> {
  const result: Record<string, string> = {};

  countries.forEach(country => {
    result[country] = translateCountryName(country, language);
  });

  return result;
}