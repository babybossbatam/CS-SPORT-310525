
interface PlayerTranslation {
  [key: string]: {
    zh: string;
    'zh-hk': string;
    'zh-tw': string;
    es: string;
    de: string;
    it: string;
    pt: string;
    fr: string;
    ar: string;
    ja: string;
    ko: string;
  };
}

class SmartPlayerTranslation {
  private playerCache = new Map<string, string>();
  private learnedPlayerMappings = new Map<string, PlayerTranslation>();
  private translationCache = new Map<string, { translation: string; timestamp: number }>();
  private isLoading = false;

  constructor() {
    this.clearCache();
    this.loadLearnedMappings();
    console.log('🎯 [SmartPlayerTranslation] Initialized player translation system');
  }

  // Core player translations for popular players
  private corePlayerTranslations: PlayerTranslation = {
    'Lionel Messi': {
      'zh': '莱昂内尔·梅西', 'zh-hk': '利昂內爾·美斯', 'zh-tw': '利昂內爾·梅西',
      'es': 'Lionel Messi', 'de': 'Lionel Messi', 'it': 'Lionel Messi', 'pt': 'Lionel Messi',
      'fr': 'Lionel Messi', 'ar': 'ليونيل ميسي', 'ja': 'リオネル・メッシ', 'ko': '리오넬 메시'
    },
    'Cristiano Ronaldo': {
      'zh': '克里斯蒂亚诺·罗纳尔多', 'zh-hk': '基斯坦奴·朗拿度', 'zh-tw': '克里斯蒂亞諾·羅納度',
      'es': 'Cristiano Ronaldo', 'de': 'Cristiano Ronaldo', 'it': 'Cristiano Ronaldo', 'pt': 'Cristiano Ronaldo',
      'fr': 'Cristiano Ronaldo', 'ar': 'كريستيانو رونالدو', 'ja': 'クリスティアーノ・ロナウド', 'ko': '크리스티아누 호날두'
    },
    'Kylian Mbappé': {
      'zh': '基利安·姆巴佩', 'zh-hk': '基利安·麥巴比', 'zh-tw': '基利安·姆巴佩',
      'es': 'Kylian Mbappé', 'de': 'Kylian Mbappé', 'it': 'Kylian Mbappé', 'pt': 'Kylian Mbappé',
      'fr': 'Kylian Mbappé', 'ar': 'كيليان مبابي', 'ja': 'キリアン・エムバペ', 'ko': '킬리안 음바페'
    },
    'Erling Haaland': {
      'zh': '埃尔林·哈兰德', 'zh-hk': '厄林·夏蘭', 'zh-tw': '埃爾林·哈蘭德',
      'es': 'Erling Haaland', 'de': 'Erling Haaland', 'it': 'Erling Haaland', 'pt': 'Erling Haaland',
      'fr': 'Erling Haaland', 'ar': 'إرلينغ هالاند', 'ja': 'アーリング・ホーランド', 'ko': '엘링 홀란'
    },
    'Neymar Jr': {
      'zh': '内马尔', 'zh-hk': '尼馬', 'zh-tw': '內馬爾',
      'es': 'Neymar Jr', 'de': 'Neymar Jr', 'it': 'Neymar Jr', 'pt': 'Neymar Jr',
      'fr': 'Neymar Jr', 'ar': 'نيمار', 'ja': 'ネイマール', 'ko': '네이마르'
    },
    'Mohamed Salah': {
      'zh': '穆罕默德·萨拉赫', 'zh-hk': '穆罕默德·沙拿', 'zh-tw': '穆罕默德·薩拉赫',
      'es': 'Mohamed Salah', 'de': 'Mohamed Salah', 'it': 'Mohamed Salah', 'pt': 'Mohamed Salah',
      'fr': 'Mohamed Salah', 'ar': 'محمد صلاح', 'ja': 'モハメド・サラー', 'ko': '모하메드 살라'
    },
    'Kevin De Bruyne': {
      'zh': '凯文·德布劳内', 'zh-hk': '奇雲·迪布尼', 'zh-tw': '凱文·德布勞內',
      'es': 'Kevin De Bruyne', 'de': 'Kevin De Bruyne', 'it': 'Kevin De Bruyne', 'pt': 'Kevin De Bruyne',
      'fr': 'Kevin De Bruyne', 'ar': 'كيفين دي بروين', 'ja': 'ケビン・デ・ブライネ', 'ko': '케빈 더 브라위너'
    },
    'Robert Lewandowski': {
      'zh': '罗伯特·莱万多夫斯基', 'zh-hk': '羅拔·利雲杜夫斯基', 'zh-tw': '羅伯特·萊萬多夫斯基',
      'es': 'Robert Lewandowski', 'de': 'Robert Lewandowski', 'it': 'Robert Lewandowski', 'pt': 'Robert Lewandowski',
      'fr': 'Robert Lewandowski', 'ar': 'روبرت ليفاندوفسكي', 'ja': 'ロベルト・レヴァンドフスキ', 'ko': '로베르트 레반도프스키'
    }
  };

  private clearCache() {
    this.playerCache.clear();
    this.translationCache.clear();
  }

  private loadLearnedMappings() {
    try {
      const storedPlayers = localStorage.getItem('learnedPlayerMappings');
      
      if (storedPlayers) {
        const mappings = JSON.parse(storedPlayers);
        this.learnedPlayerMappings = new Map(Object.entries(mappings));
        console.log(`🎓 [SmartPlayerTranslation] Loaded ${this.learnedPlayerMappings.size} learned player mappings`);
      }
    } catch (error) {
      console.warn('[SmartPlayerTranslation] Failed to load learned mappings:', error);
    }
  }

  private saveLearnedMappings() {
    try {
      const playerMappings = Object.fromEntries(this.learnedPlayerMappings);
      localStorage.setItem('learnedPlayerMappings', JSON.stringify(playerMappings));
    } catch (error) {
      console.warn('[SmartPlayerTranslation] Failed to save learned mappings:', error);
    }
  }

  // Enhanced learning from player data
  learnFromPlayerData(players: any[]): void {
    let newPlayerMappings = 0;

    players.forEach(player => {
      if (!player?.name) return;

      const playerName = player.name.trim();
      
      // Skip if already learned
      if (this.learnedPlayerMappings.has(playerName) || this.corePlayerTranslations[playerName]) {
        return;
      }

      // Generate player mapping
      const mapping = this.generatePlayerMapping(playerName, player);
      if (mapping) {
        this.learnedPlayerMappings.set(playerName, mapping);
        newPlayerMappings++;
      }
    });

    if (newPlayerMappings > 0) {
      this.saveLearnedMappings();
      console.log(`📖 [SmartPlayerTranslation] Learned ${newPlayerMappings} new player mappings`);
    }
  }

  // Auto-learn from any player data encountered in the app
  autoLearnFromPlayerData(playerName: string, playerData?: any): void {
    if (!playerName || playerName.length < 2) return;

    // Clean player name
    const cleanPlayerName = playerName.trim();
    
    // Skip if it's already well-known
    if (this.corePlayerTranslations[cleanPlayerName] || this.learnedPlayerMappings.has(cleanPlayerName)) {
      return;
    }

    // Auto-learn this player
    const mapping = this.generatePlayerMapping(cleanPlayerName, playerData);
    if (mapping) {
      this.learnedPlayerMappings.set(cleanPlayerName, mapping);
      this.saveLearnedMappings();
      console.log(`🎓 [Auto-Learn] Added new player mapping for: ${cleanPlayerName}`);
    }
  }

  private generatePlayerMapping(playerName: string, playerData?: any): PlayerTranslation | null {
    // Generate translations based on comprehensive patterns
    const translations: any = { en: playerName };

    // Extract name parts for analysis
    const nameParts = playerName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts[nameParts.length - 1] || '';

    // Arabic name patterns
    if (this.isArabicName(playerName)) {
      translations.ar = playerName; // Keep original Arabic if detected
      translations.zh = this.transliterateArabicToChinese(playerName);
      translations['zh-hk'] = this.transliterateArabicToCantonese(playerName);
      translations['zh-tw'] = translations.zh;
    }
    // European name patterns
    else if (this.isEuropeanName(playerName)) {
      translations.zh = this.transliterateEuropeanToChinese(playerName);
      translations['zh-hk'] = this.transliterateEuropeanToCantonese(playerName);
      translations['zh-tw'] = translations.zh;
    }
    // Latin American patterns
    else if (this.isLatinAmericanName(playerName)) {
      translations.zh = this.transliterateLatinToChinese(playerName);
      translations['zh-hk'] = this.transliterateLatinToCantonese(playerName);
      translations['zh-tw'] = translations.zh;
    }
    // African name patterns
    else if (this.isAfricanName(playerName)) {
      translations.zh = this.transliterateAfricanToChinese(playerName);
      translations['zh-hk'] = this.transliterateAfricanToCantonese(playerName);
      translations['zh-tw'] = translations.zh;
    }
    // Generic fallback
    else {
      translations.zh = this.genericTransliteration(playerName);
      translations['zh-hk'] = translations.zh;
      translations['zh-tw'] = translations.zh;
    }

    // Ensure all languages have defaults
    translations.es = translations.es || playerName;
    translations.de = translations.de || playerName;
    translations.it = translations.it || playerName;
    translations.pt = translations.pt || playerName;
    translations.fr = translations.fr || playerName;
    translations.ar = translations.ar || playerName;
    translations.ja = translations.ja || this.transliterateToJapanese(playerName);
    translations.ko = translations.ko || this.transliterateToKorean(playerName);

    return translations as PlayerTranslation;
  }

  // Language detection helpers
  private isArabicName(name: string): boolean {
    const arabicPatterns = /[\u0600-\u06FF]|Mohamed|Ahmed|Omar|Ali|Hassan|Hussein|Mahmoud|Salah|Zaki/i;
    return arabicPatterns.test(name);
  }

  private isEuropeanName(name: string): boolean {
    const europeanSuffixes = /son$|sen$|sson$|ović$|ić$|ski$|sky$|enko$|ov$|ev$/i;
    const europeanPrefixes = /^De |^Van |^Von |^Di |^Da |^Del |^Mac |^Mc |^O'/i;
    return europeanSuffixes.test(name) || europeanPrefixes.test(name);
  }

  private isLatinAmericanName(name: string): boolean {
    const latinPatterns = /ez$|es$|os$|as$|inho$|ão$|Jr$|Filho$/i;
    return latinPatterns.test(name);
  }

  private isAfricanName(name: string): boolean {
    const africanPatterns = /Abdou|Mamadou|Ousmane|Ibrahima|Moussa|Kante|Drogba|Eto'o/i;
    return africanPatterns.test(name);
  }

  // Transliteration methods
  private transliterateArabicToChinese(name: string): string {
    const arabicToChinese: { [key: string]: string } = {
      'Mohamed': '穆罕默德', 'Mohammed': '穆罕默德', 'Muhammad': '穆罕默德',
      'Ahmed': '艾哈迈德', 'Ahmad': '艾哈迈德',
      'Omar': '奥马尔', 'Umar': '奥马尔',
      'Ali': '阿里', 'Hassan': '哈桑', 'Hussein': '侯赛因',
      'Salah': '萨拉赫', 'Mahmoud': '马哈茂德'
    };

    let result = name;
    Object.entries(arabicToChinese).forEach(([arabic, chinese]) => {
      result = result.replace(new RegExp(arabic, 'gi'), chinese);
    });

    return result !== name ? result : this.genericTransliteration(name);
  }

  private transliterateArabicToCantonese(name: string): string {
    const arabicToCantonese: { [key: string]: string } = {
      'Mohamed': '穆罕默德', 'Mohammed': '穆罕默德', 'Muhammad': '穆罕默德',
      'Ahmed': '阿曼', 'Ahmad': '阿曼',
      'Omar': '奧馬', 'Umar': '奧馬',
      'Ali': '阿里', 'Hassan': '哈辛', 'Hussein': '侯賽因',
      'Salah': '沙拿', 'Mahmoud': '馬哈茂德'
    };

    let result = name;
    Object.entries(arabicToCantonese).forEach(([arabic, cantonese]) => {
      result = result.replace(new RegExp(arabic, 'gi'), cantonese);
    });

    return result !== name ? result : this.genericTransliteration(name);
  }

  private transliterateEuropeanToChinese(name: string): string {
    // European name transliteration patterns
    const europeanPatterns: { [key: string]: string } = {
      'ović': '奥维奇', 'ić': '伊奇', 'ski': '斯基', 'son': '森',
      'Van ': '范·', 'De ': '德·', 'Von ': '冯·'
    };

    let result = name;
    Object.entries(europeanPatterns).forEach(([pattern, chinese]) => {
      result = result.replace(new RegExp(pattern, 'gi'), chinese);
    });

    return result !== name ? result : this.genericTransliteration(name);
  }

  private transliterateEuropeanToCantonese(name: string): string {
    // Cantonese-specific European patterns
    const europeanPatterns: { [key: string]: string } = {
      'ović': '奧域治', 'ić': '域治', 'ski': '史基', 'son': '臣',
      'Van ': '雲·', 'De ': '迪·', 'Von ': '馮·'
    };

    let result = name;
    Object.entries(europeanPatterns).forEach(([pattern, cantonese]) => {
      result = result.replace(new RegExp(pattern, 'gi'), cantonese);
    });

    return result !== name ? result : this.genericTransliteration(name);
  }

  private transliterateLatinToChinese(name: string): string {
    // Latin American patterns
    const latinPatterns: { [key: string]: string } = {
      'ez$': '斯', 'es$': '斯', 'inho$': '尼奥', 'ão$': '奥'
    };

    let result = name;
    Object.entries(latinPatterns).forEach(([pattern, chinese]) => {
      result = result.replace(new RegExp(pattern, 'gi'), chinese);
    });

    return result !== name ? result : this.genericTransliteration(name);
  }

  private transliterateLatinToCantonese(name: string): string {
    // Cantonese Latin patterns
    const latinPatterns: { [key: string]: string } = {
      'ez$': '斯', 'es$': '斯', 'inho$': '連奴', 'ão$': '奧'
    };

    let result = name;
    Object.entries(latinPatterns).forEach(([pattern, cantonese]) => {
      result = result.replace(new RegExp(pattern, 'gi'), cantonese);
    });

    return result !== name ? result : this.genericTransliteration(name);
  }

  private transliterateAfricanToChinese(name: string): string {
    // African name patterns
    const africanPatterns: { [key: string]: string } = {
      'Abdou': '阿卜杜', 'Mamadou': '马马杜', 'Ousmane': '乌斯曼',
      'Ibrahima': '易卜拉欣', 'Moussa': '穆萨'
    };

    let result = name;
    Object.entries(africanPatterns).forEach(([african, chinese]) => {
      result = result.replace(new RegExp(african, 'gi'), chinese);
    });

    return result !== name ? result : this.genericTransliteration(name);
  }

  private transliterateAfricanToCantonese(name: string): string {
    // Cantonese African patterns
    const africanPatterns: { [key: string]: string } = {
      'Abdou': '阿卜杜', 'Mamadou': '馬馬杜', 'Ousmane': '烏斯曼',
      'Ibrahima': '易卜拉欣', 'Moussa': '穆薩'
    };

    let result = name;
    Object.entries(africanPatterns).forEach(([african, cantonese]) => {
      result = result.replace(new RegExp(african, 'gi'), cantonese);
    });

    return result !== name ? result : this.genericTransliteration(name);
  }

  private transliterateToJapanese(name: string): string {
    // Basic Japanese transliteration
    const toKatakana: { [key: string]: string } = {
      'a': 'ア', 'e': 'エ', 'i': 'イ', 'o': 'オ', 'u': 'ウ',
      'ka': 'カ', 'ke': 'ケ', 'ki': 'キ', 'ko': 'コ', 'ku': 'ク',
      'sa': 'サ', 'se': 'セ', 'si': 'シ', 'so': 'ソ', 'su': 'ス',
      'ta': 'タ', 'te': 'テ', 'ti': 'ティ', 'to': 'ト', 'tu': 'ツ',
      'na': 'ナ', 'ne': 'ネ', 'ni': 'ニ', 'no': 'ノ', 'nu': 'ヌ',
      'ma': 'マ', 'me': 'メ', 'mi': 'ミ', 'mo': 'モ', 'mu': 'ム',
      'ra': 'ラ', 're': 'レ', 'ri': 'リ', 'ro': 'ロ', 'ru': 'ル'
    };

    // Simplified: just return the original name for now
    return name;
  }

  private transliterateToKorean(name: string): string {
    // Basic Korean transliteration - simplified for now
    return name;
  }

  private genericTransliteration(name: string): string {
    // Phonetic-based transliteration for unknown names
    const phoneticMap: { [key: string]: string } = {
      'A': '阿', 'B': '巴', 'C': '卡', 'D': '达', 'E': '埃',
      'F': '法', 'G': '加', 'H': '哈', 'I': '伊', 'J': '雅',
      'K': '卡', 'L': '拉', 'M': '马', 'N': '纳', 'O': '奥',
      'P': '帕', 'Q': '库', 'R': '拉', 'S': '萨', 'T': '塔',
      'U': '乌', 'V': '瓦', 'W': '瓦', 'X': '克斯', 'Y': '亚', 'Z': '扎'
    };

    return name.split('').map(char => 
      phoneticMap[char.toUpperCase()] || char
    ).join('');
  }

  translatePlayerName(playerName: string, language: string): string {
    if (!playerName) return playerName;

    // Auto-learn this player if we encounter it
    this.autoLearnFromPlayerData(playerName);

    const cacheKey = `player_${playerName}_${language}`;

    // Check cache first
    const cached = this.translationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.translation;
    }

    let translation = playerName;
    let foundTranslation = false;

    // Try core translations first
    const coreTranslation = this.corePlayerTranslations[playerName];
    if (coreTranslation && coreTranslation[language as keyof typeof coreTranslation]) {
      translation = coreTranslation[language as keyof typeof coreTranslation];
      foundTranslation = true;
    } else {
      // Try learned mappings
      const learned = this.learnedPlayerMappings.get(playerName);
      if (learned && learned[language as keyof typeof learned]) {
        translation = learned[language as keyof typeof learned];
        foundTranslation = true;
      }
    }

    // If no translation found, auto-learn this player
    if (!foundTranslation) {
      this.autoLearnFromPlayerData(playerName);
      
      // Try again after auto-learning
      const newLearned = this.learnedPlayerMappings.get(playerName);
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

  getTranslationStats() {
    return {
      corePlayers: Object.keys(this.corePlayerTranslations).length,
      learnedPlayers: this.learnedPlayerMappings.size,
      cacheSize: this.translationCache.size
    };
  }

  // Export all mappings for backup
  exportAllMappings() {
    return {
      corePlayers: this.corePlayerTranslations,
      learnedPlayers: Object.fromEntries(this.learnedPlayerMappings),
      exportDate: new Date().toISOString()
    };
  }

  // Force learn from a specific set of players
  bulkLearnFromPlayerList(players: Array<{name: string, data?: any}>) {
    let learned = 0;
    players.forEach(player => {
      if (!this.learnedPlayerMappings.has(player.name) && !this.corePlayerTranslations[player.name]) {
        const mapping = this.generatePlayerMapping(player.name, player.data);
        if (mapping) {
          this.learnedPlayerMappings.set(player.name, mapping);
          learned++;
        }
      }
    });
    
    if (learned > 0) {
      this.saveLearnedMappings();
      console.log(`🎓 [Bulk Learn] Added ${learned} new player mappings`);
    }
    
    return learned;
  }
}

// Create singleton instance
export const smartPlayerTranslation = new SmartPlayerTranslation();
