// Simplified translation system for leagues and countries
interface Translation {
  zh: string;
  'zh-hk': string;
  'zh-tw': string;
  es: string;
  de: string;
  it: string;
  pt: string;
}

class SimpleTranslation {
  private countryTranslations: { [key: string]: Translation } = {
    'World': {
      'zh': '世界', 'zh-hk': '世界', 'zh-tw': '世界',
      'es': 'Mundial', 'de': 'Welt', 'it': 'Mondo', 'pt': 'Mundial'
    },
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
      'zh': '德國', 'zh-hk': '德國', 'zh-tw': '德國',
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
    'Netherlands': {
      'zh': '荷兰', 'zh-hk': '荷蘭', 'zh-tw': '荷蘭',
      'es': 'Países Bajos', 'de': 'Niederlande', 'it': 'Paesi Bassi', 'pt': 'Países Baixos'
    },
    'Portugal': {
      'zh': '葡萄牙', 'zh-hk': '葡萄牙', 'zh-tw': '葡萄牙',
      'es': 'Portugal', 'de': 'Portugal', 'it': 'Portogallo', 'pt': 'Portugal'
    }
  };

  private leagueTranslations: { [key: string]: Translation } = {
    'Premier League': {
      'zh': '英超', 'zh-hk': '英超', 'zh-tw': '英超',
      'es': 'Premier League', 'de': 'Premier League', 'it': 'Premier League', 'pt': 'Premier League'
    },
    'La Liga': {
      'zh': '西甲', 'zh-hk': '西甲', 'zh-tw': '西甲',
      'es': 'La Liga', 'de': 'La Liga', 'it': 'La Liga', 'pt': 'La Liga'
    },
    'Serie A': {
      'zh': '意甲', 'zh-hk': '意甲', 'zh-tw': '意甲',
      'es': 'Serie A', 'de': 'Serie A', 'it': 'Serie A', 'pt': 'Serie A'
    },
    'Bundesliga': {
      'zh': '德甲', 'zh-hk': '德甲', 'zh-tw': '德甲',
      'es': 'Bundesliga', 'de': 'Bundesliga', 'it': 'Bundesliga', 'pt': 'Bundesliga'
    },
    'Ligue 1': {
      'zh': '法甲', 'zh-hk': '法甲', 'zh-tw': '法甲',
      'es': 'Ligue 1', 'de': 'Ligue 1', 'it': 'Ligue 1', 'pt': 'Ligue 1'
    }
  };

  translateCountryName(countryName: string, language: string = 'en'): string {
    if (language === 'en' || !countryName) return countryName;
    
    const translation = this.countryTranslations[countryName];
    if (translation && translation[language as keyof Translation]) {
      return translation[language as keyof Translation];
    }
    
    return countryName;
  }

  translateLeagueName(leagueName: string, language: string = 'en'): string {
    if (language === 'en' || !leagueName) return leagueName;
    
    const translation = this.leagueTranslations[leagueName];
    if (translation && translation[language as keyof Translation]) {
      return translation[language as keyof Translation];
    }
    
    return leagueName;
  }
}

// Export singleton instance
export const simpleTranslation = new SimpleTranslation();
export default simpleTranslation;