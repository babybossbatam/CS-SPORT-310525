
import { translationService } from '../services/translationService.js';

// Extract core league translations from your existing smartLeagueCountryTranslation.ts
const coreLeagueTranslations = {
  'UEFA Champions League': {
    en: 'UEFA Champions League',
    zh: 'UEFA歐洲冠軍聯賽',
    'zh-hk': 'UEFA歐洲冠軍聯賽',
    'zh-tw': 'UEFA歐洲冠軍聯賽',
    es: 'Liga de Campeones de la UEFA',
    de: 'UEFA Champions League',
    it: 'UEFA Champions League',
    pt: 'Liga dos Campeões da UEFA'
  },
  'UEFA Europa League': {
    en: 'UEFA Europa League',
    zh: 'UEFA歐洲聯賽',
    'zh-hk': 'UEFA歐洲聯賽',
    'zh-tw': 'UEFA歐洲聯賽',
    es: 'Liga Europa de la UEFA',
    de: 'UEFA Europa League',
    it: 'UEFA Europa League',
    pt: 'Liga Europa da UEFA'
  },
  'UEFA Conference League': {
    en: 'UEFA Conference League',
    zh: 'UEFA歐洲協會聯賽',
    'zh-hk': 'UEFA歐洲協會聯賽',
    'zh-tw': 'UEFA歐洲協會聯賽',
    es: 'Liga de la Conferencia UEFA',
    de: 'UEFA Conference League',
    it: 'UEFA Conference League',
    pt: 'Liga da Conferência UEFA'
  },
  'Premier League': {
    en: 'Premier League',
    zh: '英格蘭超級聯賽',
    'zh-hk': '英格蘭超級聯賽',
    'zh-tw': '英格蘭超級聯賽',
    es: 'Premier League',
    de: 'Premier League',
    it: 'Premier League',
    pt: 'Premier League'
  },
  'La Liga': {
    en: 'La Liga',
    zh: '西班牙甲級聯賽',
    'zh-hk': '西班牙甲級聯賽',
    'zh-tw': '西班牙甲級聯賽',
    es: 'La Liga',
    de: 'La Liga',
    it: 'La Liga',
    pt: 'La Liga'
  },
  'Serie A': {
    en: 'Serie A',
    zh: '意大利甲級聯賽',
    'zh-hk': '意大利甲級聯賽',
    'zh-tw': '意大利甲級聯賽',
    es: 'Serie A',
    de: 'Serie A',
    it: 'Serie A',
    pt: 'Serie A'
  },
  'Bundesliga': {
    en: 'Bundesliga',
    zh: '德國甲級聯賽',
    'zh-hk': '德國甲級聯賽',
    'zh-tw': '德國甲級聯賽',
    es: 'Bundesliga',
    de: 'Bundesliga',
    it: 'Bundesliga',
    pt: 'Bundesliga'
  },
  'Ligue 1': {
    en: 'Ligue 1',
    zh: '法國甲級聯賽',
    'zh-hk': '法國甲級聯賽',
    'zh-tw': '法國甲級聯賽',
    es: 'Ligue 1',
    de: 'Ligue 1',
    it: 'Ligue 1',
    pt: 'Ligue 1'
  },
  'CONMEBOL Libertadores': {
    en: 'CONMEBOL Libertadores',
    zh: 'CONMEBOL自由杯',
    'zh-hk': 'CONMEBOL自由盃',
    'zh-tw': 'CONMEBOL自由盃',
    es: 'CONMEBOL Libertadores',
    de: 'CONMEBOL Libertadores',
    it: 'CONMEBOL Libertadores',
    pt: 'CONMEBOL Libertadores'
  },
  'CONMEBOL Sudamericana': {
    en: 'CONMEBOL Sudamericana',
    zh: 'CONMEBOL南美杯',
    'zh-hk': 'CONMEBOL南美盃',
    'zh-tw': 'CONMEBOL南美盃',
    es: 'CONMEBOL Sudamericana',
    de: 'CONMEBOL Sudamericana',
    it: 'CONMEBOL Sudamericana',
    pt: 'CONMEBOL Sudamericana'
  },
  'AFC Cup': {
    en: 'AFC Cup',
    zh: 'AFC杯',
    'zh-hk': 'AFC盃',
    'zh-tw': 'AFC盃',
    es: 'Copa AFC',
    de: 'AFC-Pokal',
    it: 'Coppa AFC',
    pt: 'Copa AFC'
  },
  'World Cup': {
    en: 'World Cup',
    zh: '世界杯',
    'zh-hk': '世界盃',
    'zh-tw': '世界盃',
    es: 'Copa del Mundo',
    de: 'Weltmeisterschaft',
    it: 'Coppa del Mondo',
    pt: 'Copa do Mundo'
  },
  'Copa America': {
    en: 'Copa América',
    zh: '美洲杯',
    'zh-hk': '美洲盃',
    'zh-tw': '美洲盃',
    es: 'Copa América',
    de: 'Copa América',
    it: 'Copa América',
    pt: 'Copa América'
  }
};

const coreCountryTranslations = {
  'World': {
    en: 'World',
    zh: '世界',
    'zh-hk': '世界',
    'zh-tw': '世界',
    es: 'Mundial',
    de: 'Welt',
    it: 'Mondo',
    pt: 'Mundial'
  },
  'England': {
    en: 'England',
    zh: '英格兰',
    'zh-hk': '英格蘭',
    'zh-tw': '英格蘭',
    es: 'Inglaterra',
    de: 'England',
    it: 'Inghilterra',
    pt: 'Inglaterra'
  },
  'Spain': {
    en: 'Spain',
    zh: '西班牙',
    'zh-hk': '西班牙',
    'zh-tw': '西班牙',
    es: 'España',
    de: 'Spanien',
    it: 'Spagna',
    pt: 'Espanha'
  },
  'Italy': {
    en: 'Italy',
    zh: '意大利',
    'zh-hk': '意大利',
    'zh-tw': '意大利',
    es: 'Italia',
    de: 'Italien',
    it: 'Italia',
    pt: 'Itália'
  },
  'Germany': {
    en: 'Germany',
    zh: '德國',
    'zh-hk': '德國',
    'zh-tw': '德國',
    es: 'Alemania',
    de: 'Deutschland',
    it: 'Germania',
    pt: 'Alemanha'
  },
  'France': {
    en: 'France',
    zh: '法國',
    'zh-hk': '法國',
    'zh-tw': '法國',
    es: 'Francia',
    de: 'Frankreich',
    it: 'Francia',
    pt: 'França'
  },
  'Brazil': {
    en: 'Brazil',
    zh: '巴西',
    'zh-hk': '巴西',
    'zh-tw': '巴西',
    es: 'Brasil',
    de: 'Brasilien',
    it: 'Brasile',
    pt: 'Brasil'
  },
  'Argentina': {
    en: 'Argentina',
    zh: '阿根廷',
    'zh-hk': '阿根廷',
    'zh-tw': '阿根廷',
    es: 'Argentina',
    de: 'Argentinien',
    it: 'Argentina',
    pt: 'Argentina'
  },
  'United States': {
    en: 'United States',
    zh: '美國',
    'zh-hk': '美國',
    'zh-tw': '美國',
    es: 'Estados Unidos',
    de: 'Vereinigte Staaten',
    it: 'Stati Uniti',
    pt: 'Estados Unidos'
  },
  'Netherlands': {
    en: 'Netherlands',
    zh: '荷蘭',
    'zh-hk': '荷蘭',
    'zh-tw': '荷蘭',
    es: 'Países Bajos',
    de: 'Niederlande',
    it: 'Paesi Bassi',
    pt: 'Países Baixos'
  }
};

export async function migrateExistingTranslations() {
  console.log('🚀 [Migration] Starting translation migration...');
  
  try {
    // Migrate league translations
    console.log('📥 [Migration] Migrating league translations...');
    await translationService.bulkLoadLeagueTranslations(coreLeagueTranslations);
    
    // Migrate country translations
    console.log('📥 [Migration] Migrating country translations...');
    await translationService.bulkLoadCountryTranslations(coreCountryTranslations);
    
    console.log('✅ [Migration] Translation migration completed successfully!');
    
    const stats = translationService.getCacheStats();
    console.log('📊 [Migration] Final stats:', stats);
    
  } catch (error) {
    console.error('❌ [Migration] Translation migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateExistingTranslations()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
