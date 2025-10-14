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
    this.cleanCorruptedLearnedMappings(); // Clean any corrupted learned mappings
    this.integrateAutomatedMappings(); // Automatically integrate any generated mappings
    console.log('🔄 [SmartTranslation] Initialized with cache cleared for fresh translations and automated mappings integrated');
  }

  // Clean corrupted learned mappings
  private cleanCorruptedLearnedMappings(): void {
    let cleanedCount = 0;
    const toDelete: string[] = [];

    this.learnedTeamMappings.forEach((mapping, teamName) => {
      Object.entries(mapping).forEach(([lang, translation]) => {
        if (typeof translation === 'string' && this.isCorruptedTranslation(translation, teamName)) {
          toDelete.push(teamName);
          cleanedCount++;
        }
      });
    });

    toDelete.forEach(teamName => {
      this.learnedTeamMappings.delete(teamName);
    });

    if (cleanedCount > 0) {
      this.saveLearnedMappings();
      console.log(`🧹 [SmartTranslation] Cleaned ${cleanedCount} corrupted learned mappings`);
    }
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

    // Bundesliga (2)
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

    // Serie A (4)
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

    // Ligue 1 (3)
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

    // MLS Teams (no duplicates)
    'LA Galaxy': {
      'zh': '洛杉矶银河', 'zh-hk': '洛杉磯銀河', 'zh-tw': '洛杉磯銀河',
      'es': 'LA Galaxy', 'de': 'LA Galaxy', 'it': 'LA Galaxy', 'pt': 'LA Galaxy'
    },
    'Los Angeles Galaxy': {
      'zh': '洛杉矶银河', 'zh-hk': '洛杉磯銀河', 'zh-tw': '洛杉磯銀河',
      'es': 'Los Angeles Galaxy', 'de': 'Los Angeles Galaxy', 'it': 'Los Angeles Galaxy', 'pt': 'Los Angeles Galaxy'
    },
    'Los Angeles FC': {
      'zh': '洛杉矶FC', 'zh-hk': '洛杉磯FC', 'zh-tw': '洛杉磯FC',
      'es': 'Los Ángeles FC', 'de': 'Los Angeles FC', 'it': 'Los Angeles FC', 'pt': 'Los Angeles FC'
    },
    'LAFC': {
      'zh': '洛杉矶FC', 'zh-hk': '洛杉磯FC', 'zh-tw': '洛杉磯FC',
      'es': 'LAFC', 'de': 'LAFC', 'it': 'LAFC', 'pt': 'LAFC'
    },
    'Inter Miami': {
      'zh': '迈阿密国际', 'zh-hk': '邁阿密國際', 'zh-tw': '邁阿密國際',
      'es': 'Inter Miami', 'de': 'Inter Miami', 'it': 'Inter Miami', 'pt': 'Inter Miami'
    },
    'Inter Miami CF': {
      'zh': '迈阿密国际', 'zh-hk': '邁阿密國際', 'zh-tw': '邁阿密國際',
      'es': 'Inter Miami CF', 'de': 'Inter Miami CF', 'it': 'Inter Miami CF', 'pt': 'Inter Miami CF'
    },
    'New York City FC': {
      'zh': '纽约城', 'zh-hk': '紐約城', 'zh-tw': '紐約城',
      'es': 'New York City FC', 'de': 'New York City FC', 'it': 'New York City FC', 'pt': 'New York City FC'
    },
    'New York Red Bulls': {
      'zh': '纽约红牛', 'zh-hk': '紐約紅牛', 'zh-tw': '紐約紅牛',
      'es': 'New York Red Bulls', 'de': 'New York Red Bulls', 'it': 'New York Red Bulls', 'pt': 'New York Red Bulls'
    },
    'Atlanta United': {
      'zh': '亚特兰大联', 'zh-hk': '亞特蘭大聯', 'zh-tw': '亞特蘭大聯',
      'es': 'Atlanta United', 'de': 'Atlanta United', 'it': 'Atlanta United', 'pt': 'Atlanta United'
    },
    'Atlanta United FC': {
      'zh': '亚特兰大联', 'zh-hk': '亞特蘭大聯', 'zh-tw': '亞特蘭大聯',
      'es': 'Atlanta United FC', 'de': 'Atlanta United FC', 'it': 'Atlanta United FC', 'pt': 'Atlanta United FC'
    },
    'Seattle Sounders': {
      'zh': '西雅图海湾人', 'zh-hk': '西雅圖海灣人', 'zh-tw': '西雅圖海灣人',
      'es': 'Seattle Sounders', 'de': 'Seattle Sounders', 'it': 'Seattle Sounders', 'pt': 'Seattle Sounders'
    },
    'Seattle Sounders FC': {
      'zh': '西雅图海湾人', 'zh-hk': '西雅圖海灣人', 'zh-tw': '西雅圖海灣人',
      'es': 'Seattle Sounders FC', 'de': 'Seattle Sounders FC', 'it': 'Seattle Sounders FC', 'pt': 'Seattle Sounders FC'
    },
    'Portland Timbers': {
      'zh': '波特兰伐木者', 'zh-hk': '波特蘭伐木者', 'zh-tw': '波特蘭伐木者',
      'es': 'Portland Timbers', 'de': 'Portland Timbers', 'it': 'Portland Timbers', 'pt': 'Portland Timbers'
    },
    'Colorado Rapids': {
      'zh': '科罗拉多急流', 'zh-hk': '科羅拉多急流', 'zh-tw': '科羅拉多急流',
      'es': 'Colorado Rapids', 'de': 'Colorado Rapids', 'it': 'Colorado Rapids', 'pt': 'Colorado Rapids'
    },
    'FC Cincinnati': {
      'zh': '辛辛那提', 'zh-hk': '辛辛那提', 'zh-tw': '辛辛那提',
      'es': 'FC Cincinnati', 'de': 'FC Cincinnati', 'it': 'FC Cincinnati', 'pt': 'FC Cincinnati'
    },
    'Charlotte FC': {
      'zh': '夏洛特', 'zh-hk': '夏洛特', 'zh-tw': '夏洛特',
      'es': 'Charlotte FC', 'de': 'Charlotte FC', 'it': 'Charlotte FC', 'pt': 'Charlotte FC'
    },
    'Charlotte': {
      'zh': '夏洛特', 'zh-hk': '夏洛特', 'zh-tw': '夏洛特',
      'es': 'Charlotte', 'de': 'Charlotte', 'it': 'Charlotte', 'pt': 'Charlotte'
    },
    'Toronto FC': {
      'zh': '多伦多', 'zh-hk': '多倫多', 'zh-tw': '多倫多',
      'es': 'Toronto FC', 'de': 'Toronto FC', 'it': 'Toronto FC', 'pt': 'Toronto FC'
    },

    // Cruz Azul
    'Cruz Azul': {
      'zh': '蓝十字', 'zh-hk': '藍十字', 'zh-tw': '藍十字',
      'es': 'Cruz Azul', 'de': 'Cruz Azul', 'it': 'Cruz Azul', 'pt': 'Cruz Azul'
    },
    'Santos Laguna': {
      'zh': '桑托斯拉古纳', 'zh-hk': '山度士拉古納', 'zh-tw': '山度士拉古納',
      'es': 'Santos Laguna', 'de': 'Santos Laguna', 'it': 'Santos Laguna', 'pt': 'Santos Laguna'
    },
    'CF Monterrey': {
      'zh': '蒙特雷', 'zh-hk': '蒙特雷', 'zh-tw': '蒙特雷',
      'es': 'CF Monterrey', 'de': 'CF Monterrey', 'it': 'CF Monterrey', 'pt': 'CF Monterrey'
    },
    'FC Juarez': {
      'zh': '华雷斯', 'zh-hk': '華雷斯', 'zh-tw': '華雷斯',
      'es': 'FC Juárez', 'de': 'FC Juárez', 'it': 'FC Juárez', 'pt': 'FC Juárez'
    },

    // Brazilian teams (comprehensive)
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
    'Sao Paulo': {
      'zh': '圣保罗', 'zh-hk': '聖保羅', 'zh-tw': '聖保羅',
      'es': 'São Paulo', 'de': 'São Paulo', 'it': 'San Paolo', 'pt': 'São Paulo'
    },
    'Botafogo': {
      'zh': '博塔弗戈', 'zh-hk': '博塔弗戈', 'zh-tw': '博塔弗戈',
      'es': 'Botafogo', 'de': 'Botafogo', 'it': 'Botafogo', 'pt': 'Botafogo'
    },
    'Vasco da Gama': {
      'zh': '华斯高', 'zh-hk': '華士高', 'zh-tw': '華斯高',
      'es': 'Vasco da Gama', 'de': 'Vasco da Gama', 'it': 'Vasco da Gama', 'pt': 'Vasco da Gama'
    },
    'Vasco': {
      'zh': '华斯高', 'zh-hk': '華士高', 'zh-tw': '華斯高',
      'es': 'Vasco', 'de': 'Vasco', 'it': 'Vasco', 'pt': 'Vasco'
    },
    'Santos': {
      'zh': '桑托斯', 'zh-hk': '山度士', 'zh-tw': '山度士',
      'es': 'Santos', 'de': 'Santos', 'it': 'Santos', 'pt': 'Santos'
    },
    'Grêmio': {
      'zh': '格雷米奥', 'zh-hk': '格雷米奧', 'zh-tw': '格雷米奧',
      'es': 'Grêmio', 'de': 'Grêmio', 'it': 'Grêmio', 'pt': 'Grêmio'
    },
    'Gremio': {
      'zh': '格雷米奥', 'zh-hk': '格雷米奧', 'zh-tw': '格雷米奧',
      'es': 'Grêmio', 'de': 'Grêmio', 'it': 'Grêmio', 'pt': 'Grêmio'
    },
    'Internacional': {
      'zh': '国际', 'zh-hk': '國際', 'zh-tw': '國際',
      'es': 'Internacional', 'de': 'Internacional', 'it': 'Internacional', 'pt': 'Internacional'
    },
    'Athletico Paranaense': {
      'zh': '巴拉那竞技', 'zh-hk': '巴拉那競技', 'zh-tw': '巴拉那競技',
      'es': 'Athletico Paranaense', 'de': 'Athletico Paranaense', 'it': 'Athletico Paranaense', 'pt': 'Athletico Paranaense'
    },
    'Athletico-PR': {
      'zh': '巴拉那竞技', 'zh-hk': '巴拉那競技', 'zh-tw': '巴拉那競技',
      'es': 'Athletico-PR', 'de': 'Athletico-PR', 'it': 'Athletico-PR', 'pt': 'Athletico-PR'
    },
    'Coritiba': {
      'zh': '科里蒂巴', 'zh-hk': '科里蒂巴', 'zh-tw': '科里蒂巴',
      'es': 'Coritiba', 'de': 'Coritiba', 'it': 'Coritiba', 'pt': 'Coritiba'
    },
    'Chapecoense': {
      'zh': '沙佩科恩斯', 'zh-hk': '沙佩科恩斯', 'zh-tw': '沙佩科恩斯',
      'es': 'Chapecoense', 'de': 'Chapecoense', 'it': 'Chapecoense', 'pt': 'Chapecoense'
    },
    'Ferroviária': {
      'zh': '费罗维亚里亚', 'zh-hk': '費羅維亞里亞', 'zh-tw': '費羅維亞里亞',
      'es': 'Ferroviária', 'de': 'Ferroviária', 'it': 'Ferroviária', 'pt': 'Ferroviária'
    },
    'Amazonas': {
      'zh': '亚马逊', 'zh-hk': '亞馬遜', 'zh-tw': '亞馬遜',
      'es': 'Amazonas', 'de': 'Amazonas', 'it': 'Amazonas', 'pt': 'Amazonas'
    },
    'Imperatriz': {
      'zh': '因佩拉特里斯', 'zh-hk': '因佩拉特里斯', 'zh-tw': '因佩拉特里斯',
      'es': 'Imperatriz', 'de': 'Imperatriz', 'it': 'Imperatriz', 'pt': 'Imperatriz'
    },
    'Sao Jose': {
      'zh': '圣若泽', 'zh-hk': '聖若澤', 'zh-tw': '聖若澤',
      'es': 'São José', 'de': 'São José', 'it': 'São José', 'pt': 'São José'
    },
    'Manaus FC': {
      'zh': '马瑙斯', 'zh-hk': '馬瑙斯足球會', 'zh-tw': '馬瑙斯',
      'es': 'Manaus FC', 'de': 'Manaus FC', 'it': 'Manaus FC', 'pt': 'Manaus FC'
    },

    'Atlético Mineiro': {
      'zh': '米内罗竞技', 'zh-hk': '米內羅競技', 'zh-tw': '米內羅競技',
      'es': 'Atlético Mineiro', 'de': 'Atlético Mineiro', 'it': 'Atlético Mineiro', 'pt': 'Atlético Mineiro'
    },
    'Atletico Mineiro': {
      'zh': '米内罗竞技', 'zh-hk': '米內羅競技', 'zh-tw': '米內羅競技',
      'es': 'Atlético Mineiro', 'de': 'Atlético Mineiro', 'it': 'Atlético Mineiro', 'pt': 'Atlético Mineiro'
    },
    'Bahia': {
      'zh': '巴伊亚', 'zh-hk': '巴伊亞', 'zh-tw': '巴伊亞',
      'es': 'Bahia', 'de': 'Bahia', 'it': 'Bahia', 'pt': 'Bahia'
    },
    'Ceará': {
      'zh': '塞阿拉', 'zh-hk': '塞阿拉', 'zh-tw': '塞阿拉',
      'es': 'Ceará', 'de': 'Ceará', 'it': 'Ceará', 'pt': 'Ceará'
    },
    'Ceara': {
      'zh': '塞阿拉', 'zh-hk': '塞阿拉', 'zh-tw': '塞阿拉',
      'es': 'Ceará', 'de': 'Ceará', 'it': 'Ceará', 'pt': 'Ceará'
    },
    'Fortaleza': {
      'zh': '福塔雷萨', 'zh-hk': '福塔雷薩', 'zh-tw': '福塔雷薩',
      'es': 'Fortaleza', 'de': 'Fortaleza', 'it': 'Fortaleza', 'pt': 'Fortaleza'
    },

    // Argentine teams (comprehensive)
    'Boca Juniors': {
      'zh': '博卡青年', 'zh-hk': '小保加', 'zh-tw': '博卡青年',
      'es': 'Boca Juniors', 'de': 'Boca Juniors', 'it': 'Boca Juniors', 'pt': 'Boca Juniors'
    },
    'River Plate': {
      'zh': '河床', 'zh-hk': '河床', 'zh-tw': '河床',
      'es': 'River Plate', 'de': 'River Plate', 'it': 'River Plate', 'pt': 'River Plate'
    },
    'Racing Club': {
      'zh': '竞技俱乐部', 'zh-hk': '競技會', 'zh-tw': '競技俱樂部',
      'es': 'Racing Club', 'de': 'Racing Club', 'it': 'Racing Club', 'pt': 'Racing Club'
    },
    'Independiente': {
      'zh': '独立', 'zh-hk': '獨立', 'zh-tw': '獨立',
      'es': 'Independiente', 'de': 'Independiente', 'it': 'Independiente', 'pt': 'Independiente'
    },
    'Tigre': {
      'zh': '老虎', 'zh-hk': '老虎', 'zh-tw': '老虎',
      'es': 'Tigre', 'de': 'Tigre', 'it': 'Tigre', 'pt': 'Tigre'
    },
    'Huracán': {
      'zh': '飓风', 'zh-hk': '颶風', 'zh-tw': '颶風',
      'es': 'Huracán', 'de': 'Huracán', 'it': 'Huracán', 'pt': 'Huracán'
    },
    'Huracan': {
      'zh': '飓风', 'zh-hk': '颶風', 'zh-tw': '颶風',
      'es': 'Huracán', 'de': 'Huracán', 'it': 'Huracán', 'pt': 'Huracán'
    },
    'Newell\'s Old Boys': {
      'zh': '纽韦尔老男孩', 'zh-hk': '紐韋爾老男孩', 'zh-tw': '紐韋爾老男孩',
      'es': 'Newell\'s Old Boys', 'de': 'Newell\'s Old Boys', 'it': 'Newell\'s Old Boys', 'pt': 'Newell\'s Old Boys'
    },
    'Newells Old Boys': {
      'zh': '纽韦尔老男孩', 'zh-hk': '紐韋爾老男孩', 'zh-tw': '紐韋爾老男孩',
      'es': 'Newell\'s Old Boys', 'de': 'Newell\'s Old Boys', 'it': 'Newell\'s Old Boys', 'pt': 'Newell\'s Old Boys'
    },
    'Córdoba': {
      'zh': '科尔多瓦', 'zh-hk': '哥多華', 'zh-tw': '科爾多瓦',
      'es': 'Córdoba', 'de': 'Córdoba', 'it': 'Córdoba', 'pt': 'Córdoba'
    },

    'Lanús': {
      'zh': '拉努斯', 'zh-hk': '拉努斯', 'zh-tw': '拉努斯',
      'es': 'Lanús', 'de': 'Lanús', 'it': 'Lanús', 'pt': 'Lanús'
    },
    'Lanus': {
      'zh': '拉努斯', 'zh-hk': '拉努斯', 'zh-tw': '拉努斯',
      'es': 'Lanús', 'de': 'Lanús', 'it': 'Lanús', 'pt': 'Lanús'
    },
    'Talleres': {
      'zh': '塔列雷斯', 'zh-hk': '塔列雷斯', 'zh-tw': '塔列雷斯',
      'es': 'Talleres', 'de': 'Talleres', 'it': 'Talleres', 'pt': 'Talleres'
    },
    'Talleres Córdoba': {
      'zh': '科尔多瓦塔列雷斯', 'zh-hk': '科爾多瓦塔列雷斯', 'zh-tw': '科爾多瓦塔列雷斯',
      'es': 'Talleres Córdoba', 'de': 'Talleres Córdoba', 'it': 'Talleres Córdoba', 'pt': 'Talleres Córdoba'
    },
    'Talleres Cordoba': {
      'zh': '科尔多瓦塔列雷斯', 'zh-hk': '科爾多瓦塔列雷斯', 'zh-tw': '科爾多瓦塔列雷斯',
      'es': 'Talleres Córdoba', 'de': 'Talleres Córdoba', 'it': 'Talleres Córdoba', 'pt': 'Talleres Córdoba'
    },
    'Central Córdoba': {
      'zh': '中央科尔多瓦', 'zh-hk': '中央科爾多瓦', 'zh-tw': '中央科爾多瓦',
      'es': 'Central Córdoba', 'de': 'Central Córdoba', 'it': 'Central Córdoba', 'pt': 'Central Córdoba'
    },
    'Central Cordoba': {
      'zh': '中央科尔多瓦', 'zh-hk': '中央科爾多瓦', 'zh-tw': '中央科爾多瓦',
      'es': 'Central Córdoba', 'de': 'Central Córdoba', 'it': 'Central Córdoba', 'pt': 'Central Córdoba'
    },
    'Central Córdoba de Santiago': {
      'zh': '圣地亚哥中央科尔多瓦', 'zh-hk': '聖地亞哥中央科爾多瓦', 'zh-tw': '聖地亞哥中央科爾多瓦',
      'es': 'Central Córdoba de Santiago', 'de': 'Central Córdoba de Santiago', 'it': 'Central Córdoba de Santiago', 'pt': 'Central Córdoba de Santiago'
    },
    'Central Cordoba de Santiago': {
      'zh': '圣地亚哥中央科尔多瓦', 'zh-hk': '聖地亞哥中央科爾多瓦', 'zh-tw': '聖地亞哥中央科爾多瓦',
      'es': 'Central Córdoba de Santiago', 'de': 'Central Córdoba de Santiago', 'it': 'Central Córdoba de Santiago', 'pt': 'Central Córdoba de Santiago'
    },
    'San Lorenzo': {
      'zh': '圣洛伦索', 'zh-hk': '聖洛倫索', 'zh-tw': '聖洛倫索',
      'es': 'San Lorenzo', 'de': 'San Lorenzo', 'it': 'San Lorenzo', 'pt': 'San Lorenzo'
    },
    'Vélez Sarsfield': {
      'zh': '萨斯菲尔德', 'zh-hk': '薩斯菲爾德', 'zh-tw': '薩斯菲爾德',
      'es': 'Vélez Sarsfield', 'de': 'Vélez Sarsfield', 'it': 'Vélez Sarsfield', 'pt': 'Vélez Sarsfield'
    },
    'Velez Sarsfield': {
      'zh': '萨斯菲尔德', 'zh-hk': '薩斯菲爾德', 'zh-tw': '薩斯菲爾德',
      'es': 'Vélez Sarsfield', 'de': 'Vélez Sarsfield', 'it': 'Vélez Sarsfield', 'pt': 'Vélez Sarsfield'
    },
    'Godoy Cruz': {
      'zh': '戈多伊克鲁斯', 'zh-hk': '戈多伊克魯斯', 'zh-tw': '戈多伊克魯斯',
      'es': 'Godoy Cruz', 'de': 'Godoy Cruz', 'it': 'Godoy Cruz', 'pt': 'Godoy Cruz'
    },
    'Gimnasia La Plata': {
      'zh': '拉普拉塔体操', 'zh-hk': '拉普拉塔體操', 'zh-tw': '拉普拉塔體操',
      'es': 'Gimnasia La Plata', 'de': 'Gimnasia La Plata', 'it': 'Gimnasia La Plata', 'pt': 'Gimnasia La Plata'
    },
    'Estudiantes': {
      'zh': '拉普拉塔大学生', 'zh-hk': '拉普拉塔大學生', 'zh-tw': '拉普拉塔大學生',
      'es': 'Estudiantes', 'de': 'Estudiantes', 'it': 'Estudiantes', 'pt': 'Estudiantes'
    },
    'Estudiantes L.P.': {
      'zh': '拉普拉塔大学生', 'zh-hk': '拉普拉塔大學生', 'zh-tw': '拉普拉塔大學生',
      'es': 'Estudiantes', 'de': 'Estudiantes', 'it': 'Estudiantes', 'pt': 'Estudiantes'
    },

    // Champions League common teams
    'Real Sociedad': {
      'zh': '皇家社会', 'zh-hk': '皇家蘇斯達', 'zh-tw': '皇家社會',
      'es': 'Real Sociedad', 'de': 'Real Sociedad', 'it': 'Real Sociedad', 'pt': 'Real Sociedad'
    },
    'Porto': {
      'zh': '波尔图', 'zh-hk': '波圖', 'zh-tw': '波爾圖',
      'es': 'Oporto', 'de': 'Porto', 'it': 'Porto', 'pt': 'Porto'
    },
    'Benfica': {
      'zh': '本菲卡', 'zh-hk': '賓菲加', 'zh-tw': '本菲卡',
      'es': 'Benfica', 'de': 'Benfica', 'it': 'Benfica', 'pt': 'Benfica'
    },
    'Sporting CP': {
      'zh': '里斯本竞技', 'zh-hk': '士砵亭', 'zh-tw': '里斯本競技',
      'es': 'Sporting de Lisboa', 'de': 'Sporting Lissabon', 'it': 'Sporting Lisbona', 'pt': 'Sporting'
    },
    'Ajax': {
      'zh': '阿贾克斯', 'zh-hk': '阿積士', 'zh-tw': '阿賈克斯',
      'es': 'Ajax', 'de': 'Ajax Amsterdam', 'it': 'Ajax', 'pt': 'Ajax'
    },
    'PSV': {
      'zh': 'PSV埃因霍温', 'zh-hk': 'PSV燕豪芬', 'zh-tw': 'PSV埃因霍溫',
      'es': 'PSV Eindhoven', 'de': 'PSV Eindhoven', 'it': 'PSV Eindhoven', 'pt': 'PSV Eindhoven'
    },

    // Chilean teams
    'Palestino': {
      'zh': '巴勒斯坦人', 'zh-hk': '巴勒斯坦人', 'zh-tw': '巴勒斯坦人',
      'es': 'Palestino', 'de': 'Palestino', 'it': 'Palestino', 'pt': 'Palestino'
    },
    'Deportes Iquique': {
      'zh': '伊基克体育', 'zh-hk': '伊基克體育', 'zh-tw': '伊基克體育',
      'es': 'Deportes Iquique', 'de': 'Deportes Iquique', 'it': 'Deportes Iquique', 'pt': 'Deportes Iquique'
    },
    'Colo Colo': {
      'zh': '科洛科洛', 'zh-hk': '科洛科洛', 'zh-tw': '科洛科洛',
      'es': 'Colo Colo', 'de': 'Colo Colo', 'it': 'Colo Colo', 'pt': 'Colo Colo'
    },
    'Universidad de Chile': {
      'zh': '智利大学', 'zh-hk': '智利大學', 'zh-tw': '智利大學',
      'es': 'Universidad de Chile', 'de': 'Universidad de Chile', 'it': 'Universidad de Chile', 'pt': 'Universidad de Chile'
    },

    // Colombian teams
    'Millonarios': {
      'zh': '百万富翁', 'zh-hk': '百萬富翁', 'zh-tw': '百萬富翁',
      'es': 'Millonarios', 'de': 'Millonarios', 'it': 'Millonarios', 'pt': 'Millonarios'
    },
    'Deportivo Pasto': {
      'zh': '帕斯托体育', 'zh-hk': '帕斯托體育', 'zh-tw': '帕斯托體育',
      'es': 'Deportivo Pasto', 'de': 'Deportivo Pasto', 'it': 'Deportivo Pasto', 'pt': 'Deportivo Pasto'
    },
    'Atlético Nacional': {
      'zh': '国民竞技', 'zh-hk': '國民競技', 'zh-tw': '國民競技',
      'es': 'Atlético Nacional', 'de': 'Atlético Nacional', 'it': 'Atlético Nacional', 'pt': 'Atlético Nacional'
    },
    'Atletico Nacional': {
      'zh': '国民竞技', 'zh-hk': '國民競技', 'zh-tw': '國民競技',
      'es': 'Atlético Nacional', 'de': 'Atlético Nacional', 'it': 'Atlético Nacional', 'pt': 'Atlético Nacional'
    },

    // Russian teams (from your data)
    'Krylia Sovetov': {
      'zh': '苏维埃之翼', 'zh-hk': '蘇維埃之翼', 'zh-tw': '蘇維埃之翼',
      'es': 'Krylia Sovetov', 'de': 'Krylia Sovetov', 'it': 'Krylia Sovetov', 'pt': 'Krylia Sovetov'
    },
    'Baltika': {
      'zh': '波罗的海', 'zh-hk': '波羅的海', 'zh-tw': '波羅的海',
      'es': 'Baltika', 'de': 'Baltika', 'it': 'Baltika', 'pt': 'Baltika'
    },
    'CSKA Moscow': {
      'zh': '莫斯科中央陆军', 'zh-hk': '莫斯科中央陸軍', 'zh-tw': '莫斯科中央陸軍',
      'es': 'CSKA Moscú', 'de': 'ZSKA Moskau', 'it': 'CSKA Mosca', 'pt': 'CSKA Moscou'
    },
    'Rubin': {
      'zh': '喀山红宝石', 'zh-hk': '喀山紅寶石', 'zh-tw': '喀山紅寶石',
      'es': 'Rubin Kazan', 'de': 'Rubin Kasan', 'it': 'Rubin Kazan', 'pt': 'Rubin Kazan'
    },
    'Lokomotiv': {
      'zh': '莫斯科火车头', 'zh-hk': '莫斯科火車頭', 'zh-tw': '莫斯科火車頭',
      'es': 'Lokomotiv', 'de': 'Lokomotiv', 'it': 'Lokomotiv', 'pt': 'Lokomotiv'
    },
    'Lokomotiv Moscow': {
      'zh': '莫斯科火车头', 'zh-hk': '莫斯科火車頭', 'zh-tw': '莫斯科火車頭',
      'es': 'Lokomotiv Moscú', 'de': 'Lokomotiv Moskau', 'it': 'Lokomotiv Mosca', 'pt': 'Lokomotiv Moscou'
    },
    'Spartak Moscow': {
      'zh': '莫斯科斯巴达', 'zh-hk': '莫斯科斯巴達', 'zh-tw': '莫斯科斯巴達',
      'es': 'Spartak de Moscú', 'de': 'Spartak Moskau', 'it': 'Spartak Mosca', 'pt': 'Spartak Moscou'
    },
    'Makhachkala': {
      'zh': '马哈奇卡拉', 'zh-hk': '馬哈奇卡拉', 'zh-tw': '馬哈奇卡拉',
      'es': 'Makhachkala', 'de': 'Makhachkala', 'it': 'Makhachkala', 'pt': 'Makhachkala'
    },
    'Akron': {
      'zh': '阿克伦', 'zh-hk': '阿克倫', 'zh-tw': '阿克倫',
      'es': 'Akron', 'de': 'Akron', 'it': 'Akron', 'pt': 'Akron'
    },

    // Australian teams (from your data)
    'Brisbane Roar': {
      'zh': '布里斯班狮吼', 'zh-hk': '布里斯班獅吼', 'zh-tw': '布里斯班獅吼',
      'es': 'Brisbane Roar', 'de': 'Brisbane Roar', 'it': 'Brisbane Roar', 'pt': 'Brisbane Roar'
    },
    'Sydney FC': {
      'zh': '悉尼FC', 'zh-hk': '悉尼FC', 'zh-tw': '雪梨FC',
      'es': 'Sydney FC', 'de': 'Sydney FC', 'it': 'Sydney FC', 'pt': 'Sydney FC'
    },
    'Melbourne Victory': {
      'zh': '墨尔本胜利', 'zh-hk': '墨爾本勝利', 'zh-tw': '墨爾本勝利',
      'es': 'Melbourne Victory', 'de': 'Melbourne Victory', 'it': 'Melbourne Victory', 'pt': 'Melbourne Victory'
    },

    // Spanish lower division teams (from your data)
    'Ucam Murcia': {
      'zh': '穆尔西亚UCAM', 'zh-hk': '穆爾西亞UCAM', 'zh-tw': '穆爾西亞UCAM',
      'es': 'UCAM Murcia', 'de': 'UCAM Murcia', 'it': 'UCAM Murcia', 'pt': 'UCAM Murcia'
    },
    'Eldense': {
      'zh': '埃尔登塞', 'zh-hk': '埃爾登塞', 'zh-tw': '埃爾登塞',
      'es': 'Eldense', 'de': 'Eldense', 'it': 'Eldense', 'pt': 'Eldense'
    },

    // Additional European teams
    'Olympiakos Piraeus': {
      'zh': '奥林匹亚科斯', 'zh-hk': '奧林比亞高斯', 'zh-tw': '奧林匹亞科斯',
      'es': 'Olympiakos Piraeus', 'de': 'Olympiakos Piräus', 'it': 'Olympiakos Pireo', 'pt': 'Olympiakos Pireu'
    },
    'Olympiakos': {
      'zh': '奥林匹亚科斯', 'zh-hk': '奧林比亞高斯', 'zh-tw': '奧林匹亞科斯',
      'es': 'Olympiakos', 'de': 'Olympiakos', 'it': 'Olympiakos', 'pt': 'Olympiakos'
    },

    // Spanish Segunda División and lower division teams
    'Albacete': {
      'zh': '阿尔瓦塞特', 'zh-hk': '阿爾瓦塞特', 'zh-tw': '阿爾瓦塞特',
      'es': 'Albacete', 'de': 'Albacete', 'it': 'Albacete', 'pt': 'Albacete'
    },
    'Albacete Balompié': {
      'zh': '阿尔瓦塞特', 'zh-hk': '阿爾瓦塞特', 'zh-tw': '阿爾瓦塞特',
      'es': 'Albacete Balompié', 'de': 'Albacete Balompié', 'it': 'Albacete Balompié', 'pt': 'Albacete Balompié'
    },
    'CD Leganes': {
      'zh': '莱加内斯', 'zh-hk': '萊加內斯', 'zh-tw': '萊加內斯',
      'es': 'CD Leganés', 'de': 'CD Leganés', 'it': 'CD Leganés', 'pt': 'CD Leganés'
    },
    'Leganes': {
      'zh': '莱加内斯', 'zh-hk': '萊加內斯', 'zh-tw': '萊加內斯',
      'es': 'Leganés', 'de': 'Leganés', 'it': 'Leganés', 'pt': 'Leganés'
    },
    'Real Oviedo': {
      'zh': '皇家奥维耶多', 'zh-hk': '皇家奧維耶多', 'zh-tw': '皇家奧維耶多',
      'es': 'Real Oviedo', 'de': 'Real Oviedo', 'it': 'Real Oviedo', 'pt': 'Real Oviedo'
    },
    'Oviedo': {
      'zh': '奥维耶多', 'zh-hk': '奧維耶多', 'zh-tw': '奧維耶多',
      'es': 'Oviedo', 'de': 'Oviedo', 'it': 'Oviedo', 'pt': 'Oviedo'
    },
    'FC Cartagena': {
      'zh': '卡塔赫纳', 'zh-hk': '卡塔赫納', 'zh-tw': '卡塔赫納',
      'es': 'FC Cartagena', 'de': 'FC Cartagena', 'it': 'FC Cartagena', 'pt': 'FC Cartagena'
    },
    'Cartagena': {
      'zh': '卡塔赫纳', 'zh-hk': '卡塔赫納', 'zh-tw': '卡塔赫納',
      'es': 'Cartagena', 'de': 'Cartagena', 'it': 'Cartagena', 'pt': 'Cartagena'
    },
    'CD Castellón': {
      'zh': '卡斯特利翁', 'zh-hk': '卡斯特利翁', 'zh-tw': '卡斯特利翁',
      'es': 'CD Castellón', 'de': 'CD Castellón', 'it': 'CD Castellón', 'pt': 'CD Castellón'
    },
    'Castellón': {
      'zh': '卡斯特利翁', 'zh-hk': '卡斯特利翁', 'zh-tw': '卡斯特利翁',
      'es': 'Castellón', 'de': 'Castellón', 'it': 'Castellón', 'pt': 'Castellón'
    },
    'Burgos CF': {
      'zh': '布尔戈斯', 'zh-hk': '布爾戈斯', 'zh-tw': '布爾戈斯',
      'es': 'Burgos CF', 'de': 'Burgos CF', 'it': 'Burgos CF', 'pt': 'Burgos CF'
    },
    'Burgos': {
      'zh': '布尔戈斯', 'zh-hk': '布爾戈斯', 'zh-tw': '布爾戈斯',
      'es': 'Burgos', 'de': 'Burgos', 'it': 'Burgos', 'pt': 'Burgos'
    },
    'Real Valladolid': {
      'zh': '皇家巴利亚多利德', 'zh-hk': '皇家巴利亞多利德', 'zh-tw': '皇家巴利亞多利德',
      'es': 'Real Valladolid', 'de': 'Real Valladolid', 'it': 'Real Valladolid', 'pt': 'Real Valladolid'
    },
    'Valladolid': {
      'zh': '巴利亚多利德', 'zh-hk': '巴利亞多利德', 'zh-tw': '巴利亞多利德',
      'es': 'Valladolid', 'de': 'Valladolid', 'it': 'Valladolid', 'pt': 'Valladolid'
    },
    'CD Lugo': {
      'zh': '卢戈', 'zh-hk': '盧戈', 'zh-tw': '盧戈',
      'es': 'CD Lugo', 'de': 'CD Lugo', 'it': 'CD Lugo', 'pt': 'CD Lugo'
    },
    'Lugo': {
      'zh': '卢戈', 'zh-hk': '盧戈', 'zh-tw': '盧戈',
      'es': 'Lugo', 'de': 'Lugo', 'it': 'Lugo', 'pt': 'Lugo'
    },
    'Cultural Leonesa': {
      'zh': '莱昂文化', 'zh-hk': '萊昂文化', 'zh-tw': '萊昂文化',
      'es': 'Cultural Leonesa', 'de': 'Cultural Leonesa', 'it': 'Cultural Leonesa', 'pt': 'Cultural Leonesa'
    },
    'Cultural y Deportiva Leonesa': {
      'zh': '莱昂文化体育', 'zh-hk': '萊昂文化體育', 'zh-tw': '萊昂文化體育',
      'es': 'Cultural y Deportiva Leonesa', 'de': 'Cultural y Deportiva Leonesa', 'it': 'Cultural y Deportiva Leonesa', 'pt': 'Cultural y Deportiva Leonesa'
    },
    'SD Compostela': {
      'zh': '孔波斯特拉', 'zh-hk': '孔波斯特拉', 'zh-tw': '孔波斯特拉',
      'es': 'SD Compostela', 'de': 'SD Compostela', 'it': 'SD Compostela', 'pt': 'SD Compostela'
    },
    'Compostela': {
      'zh': '孔波斯特拉', 'zh-hk': '孔波斯特拉', 'zh-tw': '孔波斯特拉',
      'es': 'Compostela', 'de': 'Compostela', 'it': 'Compostela', 'pt': 'Compostela'
    },
    'CF Talavera': {
      'zh': '塔拉韦拉', 'zh-hk': '塔拉韋拉', 'zh-tw': '塔拉韋拉',
      'es': 'CF Talavera', 'de': 'CF Talavera', 'it': 'CF Talavera', 'pt': 'CF Talavera'
    },
    'Talavera': {
      'zh': '塔拉韦拉', 'zh-hk': '塔拉韋拉', 'zh-tw': '塔拉韋拉',
      'es': 'Talavera', 'de': 'Talavera', 'it': 'Talavera', 'pt': 'Talavera'
    },
    'AD Parla': {
      'zh': '帕尔拉', 'zh-hk': '帕爾拉', 'zh-tw': '帕爾拉',
      'es': 'AD Parla', 'de': 'AD Parla', 'it': 'AD Parla', 'pt': 'AD Parla'
    },
    'Parla': {
      'zh': '帕尔拉', 'zh-hk': '帕爾拉', 'zh-tw': '帕爾拉',
      'es': 'Parla', 'de': 'Parla', 'it': 'Parla', 'pt': 'Parla'
    },
    'Azuqueca': {
      'zh': '阿苏凯卡', 'zh-hk': '阿蘇凱卡', 'zh-tw': '阿蘇凱卡',
      'es': 'Azuqueca', 'de': 'Azuqueca', 'it': 'Azuqueca', 'pt': 'Azuqueca'
    },
    'CD Azuqueca': {
      'zh': '阿苏凯卡', 'zh-hk': '阿蘇凱卡', 'zh-tw': '阿蘇凱卡',
      'es': 'CD Azuqueca', 'de': 'CD Azuqueca', 'it': 'CD Azuqueca', 'pt': 'CD Azuqueca'
    },

    // Italian teams
    'Cagliari': {
      'zh': '卡利亚里', 'zh-hk': '卡利亞里', 'zh-tw': '卡利亞里',
      'es': 'Cagliari', 'de': 'Cagliari', 'it': 'Cagliari', 'pt': 'Cagliari'
    },
    'Cagliari Calcio': {
      'zh': '卡利亚里', 'zh-hk': '卡利亞里', 'zh-tw': '卡利亞里',
      'es': 'Cagliari Calcio', 'de': 'Cagliari Calcio', 'it': 'Cagliari Calcio', 'pt': 'Cagliari Calcio'
    },
    'Udinese': {
      'zh': '乌迪内斯', 'zh-hk': '烏迪內斯', 'zh-tw': '烏迪內斯',
      'es': 'Udinese', 'de': 'Udinese', 'it': 'Udinese', 'pt': 'Udinese'
    },
    'Udinese Calcio': {
      'zh': '乌迪内斯', 'zh-hk': '烏迪內斯', 'zh-tw': '烏迪內斯',
      'es': 'Udinese Calcio', 'de': 'Udinese Calcio', 'it': 'Udinese Calcio', 'pt': 'Udinese Calcio'
    },
    'Fiorentina': {
      'zh': '佛罗伦萨', 'zh-hk': '佛羅倫斯', 'zh-tw': '佛羅倫斯',
      'es': 'Fiorentina', 'de': 'Fiorentina', 'it': 'Fiorentina', 'pt': 'Fiorentina'
    },
    'ACF Fiorentina': {
      'zh': '佛罗伦萨', 'zh-hk': '佛羅倫斯', 'zh-tw': '佛羅倫斯',
      'es': 'ACF Fiorentina', 'de': 'ACF Fiorentina', 'it': 'ACF Fiorentina', 'pt': 'ACF Fiorentina'
    },
    'Ascoli': {
      'zh': '阿斯科利', 'zh-hk': '阿斯科利', 'zh-tw': '阿斯科利',
      'es': 'Ascoli', 'de': 'Ascoli', 'it': 'Ascoli', 'pt': 'Ascoli'
    },
    'Ascoli Calcio': {
      'zh': '阿斯科利', 'zh-hk': '阿斯科利', 'zh-tw': '阿斯科利',
      'es': 'Ascoli Calcio', 'de': 'Ascoli Calcio', 'it': 'Ascoli Calcio', 'pt': 'Ascoli Calcio'
    },
    'Parma': {
      'zh': '帕尔马', 'zh-hk': '帕爾馬', 'zh-tw': '帕爾馬',
      'es': 'Parma', 'de': 'Parma', 'it': 'Parma', 'pt': 'Parma'
    },
    'Parma Calcio': {
      'zh': '帕尔马', 'zh-hk': '帕爾馬', 'zh-tw': '帕爾馬',
      'es': 'Parma Calcio', 'de': 'Parma Calcio', 'it': 'Parma Calcio', 'pt': 'Parma Calcio'
    },
    'Venezia': {
      'zh': '威尼斯', 'zh-hk': '威尼斯', 'zh-tw': '威尼斯',
      'es': 'Venezia', 'de': 'Venezia', 'it': 'Venezia', 'pt': 'Venezia'
    },
    'Venezia FC': {
      'zh': '威尼斯', 'zh-hk': '威尼斯', 'zh-tw': '威尼斯',
      'es': 'Venezia FC', 'de': 'Venezia FC', 'it': 'Venezia FC', 'pt': 'Venezia FC'
    },
    'Atalanta': {
      'zh': '亚特兰大', 'zh-hk': '亞特蘭大', 'zh-tw': '亞特蘭大',
      'es': 'Atalanta', 'de': 'Atalanta', 'it': 'Atalanta', 'pt': 'Atalanta'
    },
    'Atalanta BC': {
      'zh': '亚特兰大', 'zh-hk': '亞特蘭大', 'zh-tw': '亞特蘭大',
      'es': 'Atalanta BC', 'de': 'Atalanta BC', 'it': 'Atalanta BC', 'pt': 'Atalanta BC'
    },
    'Bologna': {
      'zh': '博洛尼亚', 'zh-hk': '博洛尼亞', 'zh-tw': '博洛尼亞',
      'es': 'Bologna', 'de': 'Bologna', 'it': 'Bologna', 'pt': 'Bologna'
    },
    'Bologna FC': {
      'zh': '博洛尼亚', 'zh-hk': '博洛尼亞', 'zh-tw': '博洛尼亞',
      'es': 'Bologna FC', 'de': 'Bologna FC', 'it': 'Bologna FC', 'pt': 'Bologna FC'
    },

    // German teams
    'VfL Wolfsburg': {
      'zh': '沃尔夫斯堡', 'zh-hk': '沃爾夫斯堡', 'zh-tw': '沃爾夫斯堡',
      'es': 'VfL Wolfsburg', 'de': 'VfL Wolfsburg', 'it': 'VfL Wolfsburg', 'pt': 'VfL Wolfsburg'
    },
    'Wolfsburg': {
      'zh': '沃尔夫斯堡', 'zh-hk': '沃爾夫斯堡', 'zh-tw': '沃爾夫斯堡',
      'es': 'Wolfsburg', 'de': 'Wolfsburg', 'it': 'Wolfsburg', 'pt': 'Wolfsburg'
    },
    'Werder Bremen': {
      'zh': '云达不来梅', 'zh-hk': '雲達不萊梅', 'zh-tw': '雲達不萊梅',
      'es': 'Werder Bremen', 'de': 'Werder Bremen', 'it': 'Werder Bremen', 'pt': 'Werder Bremen'
    },
    'SV Werder Bremen': {
      'zh': '云达不来梅', 'zh-hk': '雲達不萊梅', 'zh-tw': '雲達不萊梅',
      'es': 'SV Werder Bremen', 'de': 'SV Werder Bremen', 'it': 'SV Werder Bremen', 'pt': 'SV Werder Bremen'
    },
    'VfB Stuttgart': {
      'zh': '斯图加特', 'zh-hk': '史特加', 'zh-tw': '史圖加特',
      'es': 'VfB Stuttgart', 'de': 'VfB Stuttgart', 'it': 'VfB Stuttgart', 'pt': 'VfB Stuttgart'
    },
    'Stuttgart': {
      'zh': '斯图加特', 'zh-hk': '史特加', 'zh-tw': '史圖加特',
      'es': 'Stuttgart', 'de': 'Stuttgart', 'it': 'Stuttgart', 'pt': 'Stuttgart'
    },
    'SC Freiburg': {
      'zh': '弗赖堡', 'zh-hk': '弗賴堡', 'zh-tw': '弗賴堡',
      'es': 'SC Freiburg', 'de': 'SC Freiburg', 'it': 'SC Freiburg', 'pt': 'SC Freiburg'
    },
    'Freiburg': {
      'zh': '弗赖堡', 'zh-hk': '弗賴堡', 'zh-tw': '弗賴堡',
      'es': 'Freiburg', 'de': 'Freiburg', 'it': 'Freiburg', 'pt': 'Freiburg'
    },
    '1.FC Köln': {
      'zh': '科隆', 'zh-hk': '科隆', 'zh-tw': '科隆',
      'es': '1.FC Köln', 'de': '1.FC Köln', 'it': '1.FC Köln', 'pt': '1.FC Köln'
    },
    'FC Köln': {
      'zh': '科隆', 'zh-hk': '科隆', 'zh-tw': '科隆',
      'es': 'FC Köln', 'de': 'FC Köln', 'it': 'FC Köln', 'pt': 'FC Köln'
    },
    'Köln': {
      'zh': '科隆', 'zh-hk': '科隆', 'zh-tw': '科隆',
      'es': 'Köln', 'de': 'Köln', 'it': 'Köln', 'pt': 'Köln'
    },
    '1. FC Heidenheim': {
      'zh': '海登海姆', 'zh-hk': '海登海姆', 'zh-tw': '海登海姆',
      'es': '1. FC Heidenheim', 'de': '1. FC Heidenheim', 'it': '1. FC Heidenheim', 'pt': '1. FC Heidenheim'
    },
    'Heidenheim': {
      'zh': '海登海姆', 'zh-hk': '海登海姆', 'zh-tw': '海登海姆',
      'es': 'Heidenheim', 'de': 'Heidenheim', 'it': 'Heidenheim', 'pt': 'Heidenheim'
    },
    'FSV Mainz 05': {
      'zh': '美因茨', 'zh-hk': '美因茨', 'zh-tw': '美因茨',
      'es': 'FSV Mainz 05', 'de': 'FSV Mainz 05', 'it': 'FSV Mainz 05', 'pt': 'FSV Mainz 05'
    },
    'Mainz': {
      'zh': '美因茨', 'zh-hk': '美因茨', 'zh-tw': '美因茨',
      'es': 'Mainz', 'de': 'Mainz', 'it': 'Mainz', 'pt': 'Mainz'
    },
    '1899 Hoffenheim': {
      'zh': '霍芬海姆', 'zh-hk': '賀芬咸', 'zh-tw': '霍芬海姆',
      'es': '1899 Hoffenheim', 'de': '1899 Hoffenheim', 'it': '1899 Hoffenheim', 'pt': '1899 Hoffenheim'
    },
    'TSG 1899 Hoffenheim': {
      'zh': '霍芬海姆', 'zh-hk': '賀芬咸', 'zh-tw': '霍芬海姆',
      'es': 'TSG 1899 Hoffenheim', 'de': 'TSG 1899 Hoffenheim', 'it': 'TSG 1899 Hoffenheim', 'pt': 'TSG 1899 Hoffenheim'
    },
    'Hoffenheim': {
      'zh': '霍芬海姆', 'zh-hk': '賀芬咸', 'zh-tw': '霍芬海姆',
      'es': 'Hoffenheim', 'de': 'Hoffenheim', 'it': 'Hoffenheim', 'pt': 'Hoffenheim'
    },
    'Sunderland': {
      'zh': '桑德兰', 'zh-hk': '新特蘭', 'zh-tw': '桑德蘭',
      'es': 'Sunderland', 'de': 'Sunderland', 'it': 'Sunderland', 'pt': 'Sunderland'
    },

    // French teams
    'RC Strasbourg': {
      'zh': '斯特拉斯堡', 'zh-hk': '史特拉斯堡', 'zh-tw': '史特拉斯堡',
      'es': 'RC Strasbourg', 'de': 'RC Strasbourg', 'it': 'RC Strasbourg', 'pt': 'RC Strasbourg'
    },
    'Strasbourg': {
      'zh': '斯特拉斯堡', 'zh-hk': '史特拉斯堡', 'zh-tw': '史特拉斯堡',
      'es': 'Strasbourg', 'de': 'Strasbourg', 'it': 'Strasbourg', 'pt': 'Strasbourg'
    },
    'FC Metz': {
      'zh': '梅斯', 'zh-hk': '梅斯', 'zh-tw': '梅斯',
      'es': 'FC Metz', 'de': 'FC Metz', 'it': 'FC Metz', 'pt': 'FC Metz'
    },
    'Metz': {
      'zh': '梅斯', 'zh-hk': '梅斯', 'zh-tw': '梅斯',
      'es': 'Metz', 'de': 'Metz', 'it': 'Metz', 'pt': 'Metz'
    },
    'Lille OSC': {
      'zh': '里尔', 'zh-hk': '里爾', 'zh-tw': '里爾',
      'es': 'Lille OSC', 'de': 'Lille OSC', 'it': 'Lille OSC', 'pt': 'Lille OSC'
    },
    'Lille': {
      'zh': '里尔', 'zh-hk': '里爾', 'zh-tw': '里爾',
      'es': 'Lille', 'de': 'Lille', 'it': 'Lille', 'pt': 'Lille'
    },
    'SCO Angers': {
      'zh': '昂热', 'zh-hk': '昂熱', 'zh-tw': '昂熱',
      'es': 'SCO Angers', 'de': 'SCO Angers', 'it': 'SCO Angers', 'pt': 'SCO Angers'
    },
    'Angers': {
      'zh': '昂热', 'zh-hk': '昂熱', 'zh-tw': '昂熱',
      'es': 'Angers', 'de': 'Angers', 'it': 'Angers', 'pt': 'Angers'
    },
    'FC Lorient': {
      'zh': '洛里昂', 'zh-hk': '洛里昂', 'zh-tw': '洛里昂',
      'es': 'FC Lorient', 'de': 'FC Lorient', 'it': 'FC Lorient', 'pt': 'FC Lorient'
    },
    'Lorient': {
      'zh': '洛里昂', 'zh-hk': '洛里昂', 'zh-tw': '洛里昂',
      'es': 'Lorient', 'de': 'Lorient', 'it': 'Lorient', 'pt': 'Lorient'
    },

    // Dutch teams
    'Katwijk': {
      'zh': '卡特韦克', 'zh-hk': '卡特韋克', 'zh-tw': '卡特韋克',
      'es': 'Katwijk', 'de': 'Katwijk', 'it': 'Katwijk', 'pt': 'Katwijk'
    },
    'VV Katwijk': {
      'zh': '卡特韦克', 'zh-hk': '卡特韋克', 'zh-tw': '卡特韋克',
      'es': 'VV Katwijk', 'de': 'VV Katwijk', 'it': 'VV Katwijk', 'pt': 'VV Katwijk'
    },
    'Zwaluwen': {
      'zh': '兹瓦吕文', 'zh-hk': '茲瓦呂文', 'zh-tw': '茲瓦呂文',
      'es': 'Zwaluwen', 'de': 'Zwaluwen', 'it': 'Zwaluwen', 'pt': 'Zwaluwen'
    },
    'De Graafschap': {
      'zh': '德拉夫斯哈普', 'zh-hk': '德拉夫斯哈普', 'zh-tw': '德拉夫斯哈普',
      'es': 'De Graafschap', 'de': 'De Graafschap', 'it': 'De Graafschap', 'pt': 'De Graafschap'
    },

    // Portuguese teams
    'Portugaleᴛᴇ': {
      'zh': '葡萄牙人', 'zh-hk': '葡萄牙人', 'zh-tw': '葡萄牙人',
      'es': 'Portugaleᴛᴇ', 'de': 'Portugaleᴛᴇ', 'it': 'Portugaleᴛᴇ', 'pt': 'Portugaleᴛᴇ'
    },
    'CD Feirense': {
      'zh': '费伦斯', 'zh-hk': '費倫斯', 'zh-tw': '費倫斯',
      'es': 'CD Feirense', 'de': 'CD Feirense', 'it': 'CD Feirense', 'pt': 'CD Feirense'
    },
    'Deusto': {
      'zh': '德乌斯托', 'zh-hk': '德烏斯托', 'zh-tw': '德烏斯托',
      'es': 'Deusto', 'de': 'Deusto', 'it': 'Deusto', 'pt': 'Deusto'
    },

    // Basque teams
    'SD Deusto': {
      'zh': '德乌斯托', 'zh-hk': '德烏斯托', 'zh-tw': '德烏斯托',
      'es': 'SD Deusto', 'de': 'SD Deusto', 'it': 'SD Deusto', 'pt': 'SD Deusto'
    },

    // Minor teams and club friendlies
    'ACV': {
      'zh': 'ACV', 'zh-hk': 'ACV', 'zh-tw': 'ACV',
      'es': 'ACV', 'de': 'ACV', 'it': 'ACV', 'pt': 'ACV'
    },
    'Sámano': {
      'zh': '萨马诺', 'zh-hk': '薩馬諾', 'zh-tw': '薩馬諾',
      'es': 'Sámano', 'de': 'Sámano', 'it': 'Sámano', 'pt': 'Sámano'
    },
    'Vimenor': {
      'zh': '维门诺', 'zh-hk': '維門諾', 'zh-tw': '維門諾',
      'es': 'Vimenor', 'de': 'Vimenor', 'it': 'Vimenor', 'pt': 'Vimenor'
    },
    'Al Taawon': {
      'zh': '塔阿万', 'zh-hk': '塔阿萬', 'zh-tw': '塔阿萬',
      'es': 'Al Taawon', 'de': 'Al Taawon', 'it': 'Al Taawon', 'pt': 'Al Taawon'
    },
    'Al-Taawon': {
      'zh': '塔阿万', 'zh-hk': '塔阿萬', 'zh-tw': '塔阿萬',
      'es': 'Al-Taawon', 'de': 'Al-Taawon', 'it': 'Al-Taawon', 'pt': 'Al-Taawon'
    },
    'FC Augsburg': {
      'zh': '奥格斯堡', 'zh-hk': '奧格斯堡', 'zh-tw': '奧格斯堡',
      'es': 'FC Augsburg', 'de': 'FC Augsburg', 'it': 'FC Augsburg', 'pt': 'FC Augsburg'
    },
    'Augsburg': {
      'zh': '奥格斯堡', 'zh-hk': '奧格斯堡', 'zh-tw': '奧格斯堡',
      'es': 'Augsburg', 'de': 'Augsburg', 'it': 'Augsburg', 'pt': 'Augsburg'
    },
    'Pisa': {
      'zh': '比萨', 'zh-hk': '比薩', 'zh-tw': '比薩',
      'es': 'Pisa', 'de': 'Pisa', 'it': 'Pisa', 'pt': 'Pisa'
    },
    'Frosinone': {
      'zh': '弗罗西诺内', 'zh-hk': '弗羅西諾內', 'zh-tw': '弗羅西諾內',
      'es': 'Frosinone', 'de': 'Frosinone', 'it': 'Frosinone', 'pt': 'Frosinone'
    },
    'Benevento': {
      'zh': '贝内文托', 'zh-hk': '賓尼雲圖', 'zh-tw': '貝內文托',
      'es': 'Benevento', 'de': 'Benevento', 'it': 'Benevento', 'pt': 'Benevento'
    },
    'Marbella': {
      'zh': '马贝拉', 'zh-hk': '馬貝拉', 'zh-tw': '馬貝拉',
      'es': 'Marbella', 'de': 'Marbella', 'it': 'Marbella', 'pt': 'Marbella'
    },
    'AD Ceuta FC': {
      'zh': '塞乌塔', 'zh-hk': '塞烏塔', 'zh-tw': '塞烏塔',
      'es': 'AD Ceuta FC', 'de': 'AD Ceuta FC', 'it': 'AD Ceuta FC', 'pt': 'AD Ceuta FC'
    },
    'Ceuta': {
      'zh': '塞乌塔', 'zh-hk': '塞烏塔', 'zh-tw': '塞烏塔',
      'es': 'Ceuta', 'de': 'Ceuta', 'it': 'Ceuta', 'pt': 'Ceuta'
    },
    'Singburi': {
      'zh': '信武里', 'zh-hk': '信武里', 'zh-tw': '信武里',
      'es': 'Singburi', 'de': 'Singburi', 'it': 'Singburi', 'pt': 'Singburi'
    },
    'Eibar': {
      'zh': '埃瓦尔', 'zh-hk': '艾巴', 'zh-tw': '埃瓦爾',
      'es': 'Eibar', 'de': 'Eibar', 'it': 'Eibar', 'pt': 'Eibar'
    },
    'SD Eibar': {
      'zh': '埃瓦尔', 'zh-hk': '艾巴', 'zh-tw': '埃瓦爾',
      'es': 'SD Eibar', 'de': 'SD Eibar', 'it': 'SD Eibar', 'pt': 'SD Eibar'
    },
    'Osasuna II': {
      'zh': '奥萨苏纳二队', 'zh-hk': '奧薩蘇納二隊', 'zh-tw': '奧薩蘇納二隊',
      'es': 'Osasuna II', 'de': 'Osasuna II', 'it': 'Osasuna II', 'pt': 'Osasuna II'
    },
    'Osasuna': {
      'zh': '奥萨苏纳', 'zh-hk': '奧薩蘇納', 'zh-tw': '奧薩蘇納',
      'es': 'Osasuna', 'de': 'Osasuna', 'it': 'Osasuna', 'pt': 'Osasuna'
    },
    'Andorra': {
      'zh': '安道尔', 'zh-hk': '安道爾', 'zh-tw': '安道爾',
      'es': 'Andorra', 'de': 'Andorra', 'it': 'Andorra', 'pt': 'Andorra'
    },
    'FC Andorra': {
      'zh': '安道尔', 'zh-hk': '安道爾', 'zh-tw': '安道爾',
      'es': 'FC Andorra', 'de': 'FC Andorra', 'it': 'FC Andorra', 'pt': 'FC Andorra'
    },
    'Cordoba': {
      'zh': '科尔多瓦', 'zh-hk': '哥多華', 'zh-tw': '科爾多瓦',
      'es': 'Córdoba', 'de': 'Córdoba', 'it': 'Córdoba', 'pt': 'Córdoba'
    },

    // Spanish lower division teams
    'Elche': {
      'zh': '埃尔切', 'zh-hk': '埃爾切', 'zh-tw': '埃爾切',
      'es': 'Elche', 'de': 'Elche', 'it': 'Elche', 'pt': 'Elche'
    },
    'Almeria': {
      'zh': '阿尔梅里亚', 'zh-hk': '阿爾梅里亞', 'zh-tw': '阿爾梅里亞',
      'es': 'Almería', 'de': 'Almería', 'it': 'Almería', 'pt': 'Almería'
    },
    'UD Almeria': {
      'zh': '阿尔梅里亚', 'zh-hk': '阿爾梅里亞', 'zh-tw': '阿爾梅里亞',
      'es': 'UD Almería', 'de': 'UD Almería', 'it': 'UD Almería', 'pt': 'UD Almería'
    },
    'Elche CF': {
      'zh': '埃尔切', 'zh-hk': '埃爾切', 'zh-tw': '埃爾切',
      'es': 'Elche CF', 'de': 'Elche CF', 'it': 'Elche CF', 'pt': 'Elche CF'
    },
    'Levante UD': {
      'zh': '勒万特', 'zh-hk': '勒萬特', 'zh-tw': '勒萬特',
      'es': 'Levante UD', 'de': 'Levante UD', 'it': 'Levante UD', 'pt': 'Levante UD'
    },

    // Italian lower division teams
    'Terranuova Traiana': {
      'zh': '特拉努奥瓦特莱亚纳', 'zh-hk': '特拉努奧瓦特萊亞納', 'zh-tw': '特拉努奧瓦特萊亞納',
      'es': 'Terranuova Traiana', 'de': 'Terranuova Traiana', 'it': 'Terranuova Traiana', 'pt': 'Terranuova Traiana'
    },
    'Arezzo': {
      'zh': '阿雷佐', 'zh-hk': '阿雷佐', 'zh-tw': '阿雷佐',
      'es': 'Arezzo', 'de': 'Arezzo', 'it': 'Arezzo', 'pt': 'Arezzo'
    },

    // Cyprus teams
    'AEL': {
      'zh': 'AEL利马索尔', 'zh-hk': 'AEL利馬索爾', 'zh-tw': 'AEL利馬索爾',
      'es': 'AEL Limassol', 'de': 'AEL Limassol', 'it': 'AEL Limassol', 'pt': 'AEL Limassol'
    },
    'AEL Limassol': {
      'zh': 'AEL利马索尔', 'zh-hk': 'AEL利馬索爾', 'zh-tw': 'AEL利馬索爾',
      'es': 'AEL Limassol', 'de': 'AEL Limassol', 'it': 'AEL Limassol', 'pt': 'AEL Limassol'
    },
    'Enosis': {
      'zh': '埃诺西斯', 'zh-hk': '埃諾西斯', 'zh-tw': '埃諾西斯',
      'es': 'Enosis', 'de': 'Enosis', 'it': 'Enosis', 'pt': 'Enosis'
    },
    'Enosis Neon Paralimni': {
      'zh': '埃诺西斯', 'zh-hk': '埃諾西斯', 'zh-tw': '埃諾西斯',
      'es': 'Enosis Neon Paralimni', 'de': 'Enosis Neon Paralimni', 'it': 'Enosis Neon Paralimni', 'pt': 'Enosis Neon Paralimni'
    },

    // Saudi teams
    'NEOM': {
      'zh': '尼欧姆', 'zh-hk': '尼歐姆', 'zh-tw': '尼歐姆',
      'es': 'NEOM', 'de': 'NEOM', 'it': 'NEOM', 'pt': 'NEOM'
    },
    'NEOM SC': {
      'zh': '尼欧姆', 'zh-hk': '尼歐姆', 'zh-tw': '尼歐姆',
      'es': 'NEOM SC', 'de': 'NEOM SC', 'it': 'NEOM SC', 'pt': 'NEOM SC'
    },

    // Egyptian teams
    'Smouha SC': {
      'zh': '斯穆哈', 'zh-hk': '斯穆哈', 'zh-tw': '斯穆哈',
      'es': 'Smouha SC', 'de': 'Smouha SC', 'it': 'Smouha SC', 'pt': 'Smouha SC'
    },
    'El Geish': {
      'zh': '军队', 'zh-hk': '軍隊', 'zh-tw': '軍隊',
      'es': 'El Geish', 'de': 'El Geish', 'it': 'El Geish', 'pt': 'El Geish'
    },
    'El Mokawloon': {
      'zh': '承包商', 'zh-hk': '承包商', 'zh-tw': '承包商',
      'es': 'El Mokawloon', 'de': 'El Mokawloon', 'it': 'El Mokawloon', 'pt': 'El Mokawloon'
    },
    'Masr': {
      'zh': '埃及', 'zh-hk': '埃及', 'zh-tw': '埃及',
      'es': 'Masr', 'de': 'Masr', 'it': 'Masr', 'pt': 'Masr'
    },
    'Ceramica Cleopatra': {
      'zh': '克利奥帕特拉陶瓷', 'zh-hk': '克利奧帕特拉陶瓷', 'zh-tw': '克利奧帕特拉陶瓷',
      'es': 'Ceramica Cleopatra', 'de': 'Ceramica Cleopatra', 'it': 'Ceramica Cleopatra', 'pt': 'Ceramica Cleopatra'
    },
    'Zamalek SC': {
      'zh': '扎马雷克', 'zh-hk': '扎馬雷克', 'zh-tw': '扎馬雷克',
      'es': 'Zamalek SC', 'de': 'Zamalek SC', 'it': 'Zamalek SC', 'pt': 'Zamalek SC'
    },

    // Spanish youth teams
    'Valencia U21': {
      'zh': '瓦伦西亚U21', 'zh-hk': '華倫西亞U21', 'zh-tw': '瓦倫西亞U21',
      'es': 'Valencia U21', 'de': 'Valencia U21', 'it': 'Valencia U21', 'pt': 'Valencia U21'
    },

    // Colombian teams (additional)
    'Deportivo Cali': {
      'zh': '卡利体育', 'zh-hk': '卡利體育', 'zh-tw': '卡利體育',
      'es': 'Deportivo Cali', 'de': 'Deportivo Cali', 'it': 'Deportivo Cali', 'pt': 'Deportivo Cali'
    },
    'Alianza Petrolera': {
      'zh': '石油联盟', 'zh-hk': '石油聯盟', 'zh-tw': '石油聯盟',
      'es': 'Alianza Petrolera', 'de': 'Alianza Petrolera', 'it': 'Alianza Petrolera', 'pt': 'Alianza Petrolera'
    },


    'Union Magdalena': {
      'zh': '马格达莱纳联合', 'zh-hk': '馬格達萊納聯合', 'zh-tw': '馬格達萊納聯合',
      'es': 'Unión Magdalena', 'de': 'Unión Magdalena', 'it': 'Unión Magdalena', 'pt': 'Unión Magdalena'
    },

    'Chico': {
      'zh': '奇科', 'zh-hk': '奇科', 'zh-tw': '奇科',
      'es': 'Chico', 'de': 'Chico', 'it': 'Chico', 'pt': 'Chico'
    },
    'La Equidad': {
      'zh': '公平竞技', 'zh-hk': '公平競技', 'zh-tw': '公平競技',
      'es': 'La Equidad', 'de': 'La Equidad', 'it': 'La Equidad', 'pt': 'La Equidad'
    },

    // Egyptian teams
    'Wadi Degla': {
      'zh': '瓦迪德格拉', 'zh-hk': '瓦迪德格拉', 'zh-tw': '瓦迪德格拉',
      'es': 'Wadi Degla', 'de': 'Wadi Degla', 'it': 'Wadi Degla', 'pt': 'Wadi Degla'
    },
    'Pyramids FC': {
      'zh': '金字塔', 'zh-hk': '金字塔', 'zh-tw': '金字塔',
      'es': 'Pyramids FC', 'de': 'Pyramids FC', 'it': 'Pyramids FC', 'pt': 'Pyramids FC'
    },

    // Argentine teams


    'Independ. Rivadavia': {
      'zh': '里瓦达维亚独立', 'zh-hk': '里瓦達維亞獨立', 'zh-tw': '里瓦達維亞獨立',
      'es': 'Independiente Rivadavia', 'de': 'Independiente Rivadavia', 'it': 'Independiente Rivadavia', 'pt': 'Independiente Rivadavia'
    },


    'Gimnasia L.P.': {
      'zh': '拉普拉塔体操', 'zh-hk': '拉普拉塔體操', 'zh-tw': '拉普拉塔體操',
      'es': 'Gimnasia La Plata', 'de': 'Gimnasia La Plata', 'it': 'Gimnasia La Plata', 'pt': 'Gimnasia La Plata'
    },

    // Italian teams (avoid duplicates)


    // Saudi Arabian teams



    // Spanish lower division teams



    // Thai teams
    'Port FC': {
      'zh': '港口', 'zh-hk': '港口', 'zh-tw': '港口',
      'es': 'Port FC', 'de': 'Port FC', 'it': 'Port FC', 'pt': 'Port FC'
    },

    // Updated and new translations for teams from the user's request
    'AZ Picerno': {
      'zh': 'AZ皮切诺', 'zh-hk': 'AZ皮切諾', 'zh-tw': 'AZ皮切諾',
      'es': 'AZ Picerno', 'de': 'AZ Picerno', 'it': 'AZ Picerno', 'pt': 'AZ Picerno'
    },
    'Sudtirol': {
      'zh': '南蒂罗尔', 'zh-hk': '南蒂羅爾', 'zh-tw': '南蒂羅爾',
      'es': 'Sudtirol', 'de': 'Südtirol', 'it': 'Sudtirol', 'pt': 'Sudtirol'
    },
    'Hercules': {
      'zh': '赫拉克勒斯', 'zh-hk': '赫拉克勒斯', 'zh-tw': '赫拉克勒斯',
      'es': 'Hércules', 'de': 'Hércules', 'it': 'Hércules', 'pt': 'Hércules'
    },
    'Poortugaal': {
      'zh': '波尔图加尔', 'zh-hk': '波爾圖加爾', 'zh-tw': '波爾圖加爾',
      'es': 'Poortugaal', 'de': 'Poortugaal', 'it': 'Poortugaal', 'pt': 'Poortugaal'
    },
    'Gemert': {
      'zh': '格梅尔特', 'zh-hk': '格梅爾特', 'zh-tw': '格梅爾特',
      'es': 'Gemert', 'de': 'Gemert', 'it': 'Gemert', 'pt': 'Gemert'
    },
    'Wittenhorst': {
      'zh': '维滕霍斯特', 'zh-hk': '維滕霍斯特', 'zh-tw': '維滕霍斯特',
      'es': 'Wittenhorst', 'de': 'Wittenhorst', 'it': 'Wittenhorst', 'pt': 'Wittenhorst'
    },
    'Osogovo': {
      'zh': '奥索戈沃', 'zh-hk': '奧索戈沃', 'zh-tw': '奧索戈沃',
      'es': 'Osogovo', 'de': 'Osogovo', 'it': 'Osogovo', 'pt': 'Osogovo'
    },
    'Detonit Plachkovica': {
      'zh': '德托尼特普拉奇科维察', 'zh-hk': '德托尼特普拉奇科維察', 'zh-tw': '德托尼特普拉奇科維察',
      'es': 'Detonit Plachkovica', 'de': 'Detonit Plachkovica', 'it': 'Detonit Plachkovica', 'pt': 'Detonit Plachkovica'
    },
    'Sloga Vinica': {
      'zh': '斯洛加维尼察', 'zh-hk': '斯洛加維尼察', 'zh-tw': '斯洛加維尼察',
      'es': 'Sloga Vinica', 'de': 'Sloga Vinica', 'it': 'Sloga Vinica', 'pt': 'Sloga Vinica'
    },
    'Pobeda': {
      'zh': '波贝达', 'zh-hk': '波貝達', 'zh-tw': '波貝達',
      'es': 'Pobeda', 'de': 'Pobeda', 'it': 'Pobeda', 'pt': 'Pobeda'
    },
    'GVVV Veenendaal': {
      'zh': '菲嫩达尔GVVV', 'zh-hk': '菲嫩達爾GVVV', 'zh-tw': '菲嫩達爾GVVV',
      'es': 'GVVV Veenendaal', 'de': 'GVVV Veenendaal', 'it': 'GVVV Veenendaal', 'pt': 'GVVV Veenendaal'
    },
    'Dovo': {
      'zh': '多沃', 'zh-hk': '多沃', 'zh-tw': '多沃',
      'es': 'Dovo', 'de': 'Dovo', 'it': 'Dovo', 'pt': 'Dovo'
    },
    'Tubize': {
      'zh': '蒂比兹', 'zh-hk': '蒂比茲', 'zh-tw': '蒂比茲',
      'es': 'Tubize', 'de': 'Tubize', 'it': 'Tubize', 'pt': 'Tubize'
    },
    'Drecht': {
      'zh': '德雷赫特', 'zh-hk': '德雷赫特', 'zh-tw': '德雷赫特',
      'es': 'Drecht', 'de': 'Drecht', 'it': 'Drecht', 'pt': 'Drecht'
    },
    'ASWH': {
      'zh': 'ASWH', 'zh-hk': 'ASWH', 'zh-tw': 'ASWH',
      'es': 'ASWH', 'de': 'ASWH', 'it': 'ASWH', 'pt': 'ASWH'
    },
    'De Treffers': {
      'zh': '德特雷弗斯', 'zh-hk': '德特雷弗斯', 'zh-tw': '德特雷弗斯',
      'es': 'De Treffers', 'de': 'De Treffers', 'it': 'De Treffers', 'pt': 'De Treffers'
    },
    'Merel': {
      'zh': '梅雷尔', 'zh-hk': '梅雷爾', 'zh-tw': '梅雷爾',
      'es': 'Merel', 'de': 'Merel', 'it': 'Merel', 'pt': 'Merel'
    },
    'Noordwijk': {
      'zh': '诺德韦克', 'zh-hk': '諾德韋克', 'zh-tw': '諾德韋克',
      'es': 'Noordwijk', 'de': 'Noordwijk', 'it': 'Noordwijk', 'pt': 'Noordwijk'
    },
    'Rijnvogels': {
      'zh': '莱恩沃格尔斯', 'zh-hk': '萊恩沃格爾斯', 'zh-tw': '萊恩沃格爾斯',
      'es': 'Rijnvogels', 'de': 'Rijnvogels', 'it': 'Rijnvogels', 'pt': 'Rijnvogels'
    },
    'Spakenburg': {
      'zh': '斯帕肯堡', 'zh-hk': '斯帕肯堡', 'zh-tw': '斯帕肯堡',
      'es': 'Spakenburg', 'de': 'Spakenburg', 'it': 'Spakenburg', 'pt': 'Spakenburg'
    },
    'AFC Amsterdam': {
      'zh': 'AFC阿姆斯特丹', 'zh-hk': 'AFC阿姆斯特丹', 'zh-tw': 'AFC阿姆斯特丹',
      'es': 'AFC Amsterdam', 'de': 'AFC Amsterdam', 'it': 'AFC Amsterdam', 'pt': 'AFC Amsterdam'
    },
    'Zwartewaal': {
      'zh': '兹瓦特瓦尔', 'zh-hk': '茲瓦特瓦爾', 'zh-tw': '茲瓦特瓦爾',
      'es': 'Zwartewaal', 'de': 'Zwartewaal', 'it': 'Zwartewaal', 'pt': 'Zwartewaal'
    },
    'Celta Vigo': {
      'zh': '切尔塔维戈', 'zh-hk': '切爾塔維戈', 'zh-tw': '切爾塔維戈',
      'es': 'Celta Vigo', 'de': 'Celta Vigo', 'it': 'Celta Vigo', 'pt': 'Celta Vigo'
    },
    'Granada CF': {
      'zh': '格拉纳达', 'zh-hk': '格拉納達', 'zh-tw': '格拉納達',
      'es': 'Granada CF', 'de': 'Granada CF', 'it': 'Granada CF', 'pt': 'Granada CF'
    },
    'Alcorcon': {
      'zh': '阿尔科尔孔', 'zh-hk': '阿爾科爾孔', 'zh-tw': '阿爾科爾孔',
      'es': 'Alcorcón', 'de': 'Alcorcón', 'it': 'Alcorcón', 'pt': 'Alcorcón'
    },
    'Espanyol': {
      'zh': '爱斯宾奴', 'zh-hk': '愛斯賓奴', 'zh-tw': '愛斯賓奴',
      'es': 'Espanyol', 'de': 'Espanyol', 'it': 'Espanyol', 'pt': 'Espanyol'
    },
    'Mallorca': {
      'zh': '马洛卡', 'zh-hk': '馬洛卡', 'zh-tw': '馬洛卡',
      'es': 'Mallorca', 'de': 'Mallorca', 'it': 'Mallorca', 'pt': 'Mallorca'
    },
    'Al Ain': {
      'zh': '艾恩', 'zh-hk': '艾恩', 'zh-tw': '艾恩',
      'es': 'Al Ain', 'de': 'Al Ain', 'it': 'Al Ain', 'pt': 'Al Ain'
    },
    'Bergantinos': {
      'zh': '贝尔甘蒂诺斯', 'zh-hk': '貝爾甘蒂諾斯', 'zh-tw': '貝爾甘蒂諾斯',
      'es': 'Bergantiños', 'de': 'Bergantiños', 'it': 'Bergantiños', 'pt': 'Bergantiños'
    },
    'Cacereño': {
      'zh': '卡塞雷诺', 'zh-hk': '卡塞雷諾', 'zh-tw': '卡塞雷諾',
      'es': 'Cacereño', 'de': 'Cacereño', 'it': 'Cacereño', 'pt': 'Cacereño'
    },
    'Le Havre': {
      'zh': '勒阿弗尔', 'zh-hk': '勒阿弗爾', 'zh-tw': '勒阿弗爾',
      'es': 'Le Havre', 'de': 'Le Havre', 'it': 'Le Havre', 'pt': 'Le Havre'
    },
    'Europa Fc': {
      'zh': '欧罗巴', 'zh-hk': '歐羅巴', 'zh-tw': '歐羅巴',
      'es': 'Europa FC', 'de': 'Europa FC', 'it': 'Europa FC', 'pt': 'Europa FC'
    },
    'Guadalajara Chivas': {
      'zh': '瓜达拉哈拉芝华士', 'zh-hk': '瓜達拉哈拉芝華士', 'zh-tw': '瓜達拉哈拉芝華士',
      'es': 'Guadalajara Chivas', 'de': 'Guadalajara Chivas', 'it': 'Guadalajara Chivas', 'pt': 'Guadalajara Chivas'
    },
    'Hamburger SV': {
      'zh': '汉堡', 'zh-hk': '漢堡', 'zh-tw': '漢堡',
      'es': 'Hamburger SV', 'de': 'Hamburger SV', 'it': 'Hamburger SV', 'pt': 'Hamburger SV'
    },
    'Ham堡er SV': {
      'zh': '汉堡', 'zh-hk': '漢堡', 'zh-tw': '漢堡',
      'es': 'Hamburger SV', 'de': 'Hamburger SV', 'it': 'Hamburger SV', 'pt': 'Hamburger SV'
    },
    'Bremen': {
      'zh': '云达不来梅', 'zh-hk': '雲達不萊梅', 'zh-tw': '雲達不萊梅',
      'es': 'Bremen', 'de': 'Bremen', 'it': 'Bremen', 'pt': 'Bremen'
    },
    'Cologne': {
      'zh': '科隆', 'zh-hk': '科隆', 'zh-tw': '科隆',
      'es': 'Colonia', 'de': 'Köln', 'it': 'Colonia', 'pt': 'Colônia'
    },

    'Bournemouth': {
      'zh': '伯恩茅斯', 'zh-hk': '伯恩茅斯', 'zh-tw': '伯恩茅斯',
      'es': 'Bournemouth', 'de': 'Bournemouth', 'it': 'Bournemouth', 'pt': 'Bournemouth'
    },

    'Sparta Trnava': {
      'zh': '特尔纳瓦斯巴达克', 'zh-hk': '特爾納瓦斯巴達克', 'zh-tw': '特爾納瓦斯巴達克',
      'es': 'Spartak Trnava', 'de': 'Spartak Trnava', 'it': 'Spartak Trnava', 'pt': 'Spartak Trnava'
    },
    'Ballkani': {
      'zh': '巴尔卡尼', 'zh-hk': '巴爾卡尼', 'zh-tw': '巴爾卡尼',
      'es': 'Ballkani', 'de': 'Ballkani', 'it': 'Ballkani', 'pt': 'Ballkani'
    },
    'Shamrock Rovers': {
      'zh': '沙姆洛克流浪者', 'zh-hk': '沙姆洛克流浪者', 'zh-tw': '沙姆洛克流浪者',
      'es': 'Shamrock Rovers', 'de': 'Shamrock Rovers', 'it': 'Shamrock Rovers', 'pt': 'Shamrock Rovers'
    },
    'Lausanne': {
      'zh': '洛桑', 'zh-hk': '洛桑', 'zh-tw': '洛桑',
      'es': 'Lausanne', 'de': 'Lausanne', 'it': 'Lausanne', 'pt': 'Lausanne'
    },
    'FC Astana': {
      'zh': '阿斯塔纳', 'zh-hk': '阿斯塔納', 'zh-tw': '阿斯塔納',
      'es': 'FC Astana', 'de': 'FC Astana', 'it': 'FC Astana', 'pt': 'FC Astana'
    },
    'AZ Alkmaar': {
      'zh': '阿尔克马尔', 'zh-hk': '阿爾克馬爾', 'zh-tw': '阿爾克馬爾',
      'es': 'AZ Alkmaar', 'de': 'AZ Alkmaar', 'it': 'AZ Alkmaar', 'pt': 'AZ Alkmaar'
    },
    'FC Vaduz': {
      'zh': '瓦杜兹', 'zh-hk': '瓦杜茲', 'zh-tw': '瓦杜茲',
      'es': 'FC Vaduz', 'de': 'FC Vaduz', 'it': 'FC Vaduz', 'pt': 'FC Vaduz'
    },
    'Anderlecht': {
      'zh': '安德莱赫特', 'zh-hk': '安德萊赫特', 'zh-tw': '安德萊赫特',
      'es': 'Anderlecht', 'de': 'Anderlecht', 'it': 'Anderlecht', 'pt': 'Anderlecht'
    },
    'Sheriff Tiraspol': {
      'zh': '蒂拉斯波尔谢里夫', 'zh-hk': '蒂拉斯波爾謝里夫', 'zh-tw': '蒂拉斯波爾謝里夫',
      'es': 'Sheriff Tiraspol', 'de': 'Sheriff Tiraspol', 'it': 'Sheriff Tiraspol', 'pt': 'Sheriff Tiraspol'
    },
    'Sheriff': {
      'zh': '蒂拉斯波尔谢里夫', 'zh-hk': '蒂拉斯波爾謝里夫', 'zh-tw': '蒂拉斯波爾謝里夫',
      'es': 'Sheriff', 'de': 'Sheriff', 'it': 'Sheriff', 'pt': 'Sheriff'
    },
    'Vikingur Gota': {
      'zh': '哥塔维京', 'zh-hk': '哥塔維京', 'zh-tw': '哥塔維京',
      'es': 'Vikingur Gøta', 'de': 'Vikingur Gøta', 'it': 'Vikingur Gøta', 'pt': 'Vikingur Gøta'
    },
    'Linfield': {
      'zh': '连菲尔德', 'zh-hk': '連菲爾德', 'zh-tw': '連菲爾德',
      'es': 'Linfield', 'de': 'Linfield', 'it': 'Linfield', 'pt': 'Linfield'
    },
    'Sparta Praha': {
      'zh': '布拉格斯巴达', 'zh-hk': '布拉格斯巴達', 'zh-tw': '布拉格斯巴達',
      'es': 'Sparta Praga', 'de': 'Sparta Prag', 'it': 'Sparta Praga', 'pt': 'Sparta Praga'
    },
    'Sparta Prague': {
      'zh': '布拉格斯巴达', 'zh-hk': '布拉格斯巴達', 'zh-tw': '布拉格斯巴達',
      'es': 'Sparta Praga', 'de': 'Sparta Prag', 'it': 'Sparta Praga', 'pt': 'Sparta Praga'
    },
    'Ararat-Armenia': {
      'zh': '阿拉拉特亚美尼亚', 'zh-hk': '阿拉拉特亞美尼亞', 'zh-tw': '阿拉拉特亞美尼亞',
      'es': 'Ararat-Armenia', 'de': 'Ararat-Armenia', 'it': 'Ararat-Armenia', 'pt': 'Ararat-Armenia'
    },
    'Levski Sofia': {
      'zh': '索非亚列夫斯基', 'zh-hk': '索菲亞列夫斯基', 'zh-tw': '索菲亞列夫斯基',
      'es': 'Levski Sofía', 'de': 'Levski Sofia', 'it': 'Levski Sofia', 'pt': 'Levski Sofia'
    },
    'PFC Levski Sofia': {
      'zh': '索非亚列夫斯基', 'zh-hk': '索菲亞列夫斯基', 'zh-tw': '索菲亞列夫斯基',
      'es': 'PFC Levski Sofía', 'de': 'PFC Levski Sofia', 'it': 'PFC Levski Sofia', 'pt': 'PFC Levski Sofia'
    },
    'Sabah FA': {
      'zh': '沙巴足协', 'zh-hk': '沙巴足協', 'zh-tw': '沙巴足協',
      'es': 'Sabah FA', 'de': 'Sabah FA', 'it': 'Sabah FA', 'pt': 'Sabah FA'
    },
    'Olimpija Ljubljana': {
      'zh': '卢布尔雅那奥林匹亚', 'zh-hk': '盧布爾雅那奧林比亞', 'zh-tw': '盧布爾雅那奧林匹亞',
      'es': 'Olimpija Ljubljana', 'de': 'Olimpija Ljubljana', 'it': 'Olimpija Ljubljana', 'pt': 'Olimpija Ljubljana'
    },
    'NK Olimpija Ljubljana': {
      'zh': '卢布尔雅那奥林匹亚', 'zh-hk': '盧布爾雅那奧林比亞', 'zh-tw': '盧布爾雅那奧林匹亞',
      'es': 'NK Olimpija Ljubljana', 'de': 'NK Olimpija Ljubljana', 'it': 'NK Olimpija Ljubljana', 'pt': 'NK Olimpija Ljubljana'
    },
    'Egnatia Rrogozhinë': {
      'zh': '罗戈日纳埃格纳蒂亚', 'zh-hk': '羅戈日納埃格納蒂亞', 'zh-tw': '羅戈日納埃格納蒂亞',
      'es': 'Egnatia Rrogozhinë', 'de': 'Egnatia Rrogozhinë', 'it': 'Egnatia Rrogozhinë', 'pt': 'Egnatia Rrogozhinë'
    },
    'KF Egnatia': {
      'zh': '罗戈日纳埃格纳蒂亚', 'zh-hk': '羅戈日納埃格納蒂亞', 'zh-tw': '羅戈日納埃格納蒂亞',
      'es': 'KF Egnatia', 'de': 'KF Egnatia', 'it': 'KF Egnatia', 'pt': 'KF Egnatia'
    },
     'Drita': {
      'zh': '德里塔', 'zh-hk': '德里塔', 'zh-tw': '德里塔',
      'es': 'Drita', 'de': 'Drita', 'it': 'Drita', 'pt': 'Drita'
    },
    'Servette FC': {
      'zh': '塞尔维特', 'zh-hk': '塞爾維特', 'zh-tw': '塞爾維特',
      'es': 'Servette FC', 'de': 'Servette FC', 'it': 'Servette FC', 'pt': 'Servette FC'
    },
    'Servette': {
      'zh': '塞尔维特', 'zh-hk': '塞爾維特', 'zh-tw': '塞爾維特',
      'es': 'Servette', 'de': 'Servette', 'it': 'Servette', 'pt': 'Servette'
    },
    'Utrecht': {
      'zh': '乌德勒支', 'zh-hk': '烏德勒支', 'zh-tw': '烏德勒支',
      'es': 'Utrecht', 'de': 'Utrecht', 'it': 'Utrecht', 'pt': 'Utrecht'
    },
    'FC Utrecht': {
      'zh': '乌德勒支', 'zh-hk': '烏德勒支', 'zh-tw': '烏德勒支',
      'es': 'FC Utrecht', 'de': 'FC Utrecht', 'it': 'FC Utrecht', 'pt': 'FC Utrecht'
    },
    'Zrinjski': {
      'zh': '泽林斯基', 'zh-hk': '澤林斯基', 'zh-tw': '澤林斯基',
      'es': 'Zrinjski', 'de': 'Zrinjski', 'it': 'Zrinjski', 'pt': 'Zrinjski'
    },
    'Breidablik': {
      'zh': '布雷达布利克', 'zh-hk': '布雷达布利克', 'zh-tw': '布雷达布利克',
      'es': 'Breidablik', 'de': 'Breidablik', 'it': 'Breidablik', 'pt': 'Breidablik'
    },
    'Panathinaikos': {
      'zh': '帕纳辛奈科斯', 'zh-hk': '帕納辛奈科斯', 'zh-tw': '帕納辛奈科斯',
      'es': 'Panathinaikos', 'de': 'Panathinaikos', 'it': 'Panathinaikos', 'pt': 'Panathinaikos'
    },
    'Shakhtar Donetsk': {
      'zh': '顿涅茨克矿工', 'zh-hk': '頓涅茨克礦工', 'zh-tw': '頓涅茨克礦工',
      'es': 'Shakhtar Donetsk', 'de': 'Shakhtar Donetsk', 'it': 'Shakhtar Donetsk', 'pt': 'Shakhtar Donetsk'
    },
    'PAOK': {
      'zh': 'PAOK', 'zh-hk': 'PAOK', 'zh-tw': 'PAOK',
      'es': 'PAOK', 'de': 'PAOK', 'it': 'PAOK', 'pt': 'PAOK'
    },
    'Wolfsberger AC': {
      'zh': '沃尔夫斯贝格', 'zh-hk': '沃爾夫斯貝格', 'zh-tw': '沃爾夫斯貝格',
      'es': 'Wolfsberger AC', 'de': 'Wolfsberger AC', 'it': 'Wolfsberger AC', 'pt': 'Wolfsberger AC'
    },
    'BK Hacken': {
      'zh': '哈肯', 'zh-hk': '哈肯', 'zh-tw': '哈肯',
      'es': 'BK Häcken', 'de': 'BK Häcken', 'it': 'BK Häcken', 'pt': 'BK Häcken'
    },
    'Brann': {
      'zh': '布兰', 'zh-hk': '布蘭', 'zh-tw': '布蘭',
      'es': 'Brann', 'de': 'Brann', 'it': 'Brann', 'pt': 'Brann'
    },
    'AEK Larnaca': {
      'zh': '拉纳卡AEK', 'zh-hk': '拉納卡AEK', 'zh-tw': '拉納卡AEK',
      'es': 'AEK Larnaca', 'de': 'AEK Larnaca', 'it': 'AEK Larnaca', 'pt': 'AEK Larnaca'
    },
    'Legia Warszawa': {
      'zh': '华沙莱吉亚', 'zh-hk': '華沙萊吉亞', 'zh-tw': '華沙萊吉亞',
      'es': 'Legia Varsovia', 'de': 'Legia Warschau', 'it': 'Legia Varsavia', 'pt': 'Legia Varsóvia'
    },
    'CFR 1907 Cluj': {
      'zh': '克卢日', 'zh-hk': '克盧日', 'zh-tw': '克盧日',
      'es': 'CFR Cluj', 'de': 'CFR Cluj', 'it': 'CFR Cluj', 'pt': 'CFR Cluj'
    },
    'SC Braga': {
      'zh': '布拉加', 'zh-hk': '布拉加', 'zh-tw': '布拉加',
      'es': 'SC Braga', 'de': 'SC Braga', 'it': 'SC Braga', 'pt': 'SC Braga'
    },
    'Lincoln Red Imps FC': {
      'zh': '林肯红魔', 'zh-hk': '林肯紅魔', 'zh-tw': '林肯紅魔',
      'es': 'Lincoln Red Imps FC', 'de': 'Lincoln Red Imps FC', 'it': 'Lincoln Red Imps FC', 'pt': 'Lincoln Red Imps FC'
    },
    'FC Noah': {
      'zh': '诺亚', 'zh-hk': '諾亞', 'zh-tw': '諾亞',
      'es': 'FC Noah', 'de': 'FC Noah', 'it': 'FC Noah', 'pt': 'FC Noah'
    },
    'Fredrikstad': {
      'zh': '弗雷德里克斯塔', 'zh-hk': '弗雷德里克斯塔', 'zh-tw': '弗雷德里克斯塔',
      'es': 'Fredrikstad', 'de': 'Fredrikstad', 'it': 'Fredrikstad', 'pt': 'Fredrikstad'
    },
    'FC Midtjylland': {
      'zh': '中日德兰', 'zh-hk': '中日德蘭', 'zh-tw': '中日德蘭',
      'es': 'FC Midtjylland', 'de': 'FC Midtjylland', 'it': 'FC Midtjylland', 'pt': 'FC Midtjylland'
    },

    // Additional Brazilian teams
    'CRB': {
      'zh': 'CRB', 'zh-hk': 'CRB', 'zh-tw': 'CRB',
      'es': 'CRB', 'de': 'CRB', 'it': 'CRB', 'pt': 'CRB'
    },
    'Cruzeiro': {
      'zh': '克鲁塞罗', 'zh-hk': '克魯塞羅', 'zh-tw': '克魯塞羅',
      'es': 'Cruzeiro', 'de': 'Cruzeiro', 'it': 'Cruzeiro', 'pt': 'Cruzeiro'
    },
    'Vasco DA Gama': {
      'zh': '华斯高', 'zh-hk': '華士高', 'zh-tw': '華斯高',
      'es': 'Vasco da Gama', 'de': 'Vasco da Gama', 'it': 'Vasco da Gama', 'pt': 'Vasco da Gama'
    },
    'CSA': {
      'zh': 'CSA', 'zh-hk': 'CSA', 'zh-tw': 'CSA',
      'es': 'CSA', 'de': 'CSA', 'it': 'CSA', 'pt': 'CSA'
    },

    // Colombian teams


    // Egyptian teams

    // Argentine teams


    // Italian teams (avoid duplicates)


    // Saudi Arabian teams



    // Spanish lower division teams



    // Thai teams


    // Updated and new translations for teams from the user's request

    'FC Differdange 03': {
      'zh': '迪费当热03', 'zh-hk': '迪費當熱03', 'zh-tw': '迪費當熱03',
      'es': 'FC Differdange 03', 'de': 'FC Differdange 03', 'it': 'FC Differdange 03', 'pt': 'FC Differdange 03'
    },
    'FC Levadia Tallinn': {
      'zh': '塔林莱瓦迪亚', 'zh-hk': '塔林萊瓦迪亞', 'zh-tw': '塔林萊瓦迪亞',
      'es': 'FC Levadia Tallinn', 'de': 'FC Levadia Tallinn', 'it': 'FC Levadia Tallinn', 'pt': 'FC Levadia Tallinn'
    },
    'Polessya': {
      'zh': '波利西亚', 'zh-hk': '波利西亞', 'zh-tw': '波利西亞',
      'es': 'Polessya', 'de': 'Polessya', 'it': 'Polessya', 'pt': 'Polessya'
    },
    'Paks': {
      'zh': '帕克什', 'zh-hk': '帕克什', 'zh-tw': '帕克什',
      'es': 'Paks', 'de': 'Paks', 'it': 'Paks', 'pt': 'Paks'
    },
    'AIK Stockholm': {
      'zh': '斯德哥尔摩AIK', 'zh-hk': '斯德哥爾摩AIK', 'zh-tw': '斯德哥爾摩AIK',
      'es': 'AIK Estocolmo', 'de': 'AIK Stockholm', 'it': 'AIK Stoccolma', 'pt': 'AIK Estocolmo'
    },
    'Gyori ETO FC': {
      'zh': '捷尔ETO', 'zh-hk': '捷爾ETO', 'zh-tw': '捷爾ETO',
      'es': 'Győri ETO FC', 'de': 'Győri ETO FC', 'it': 'Győri ETO FC', 'pt': 'Győri ETO FC'
    },
    'Istanbul Basaksehir': {
      'zh': '伊斯坦布尔巴萨克谢希尔', 'zh-hk': '伊斯坦布爾巴薩克謝希爾', 'zh-tw': '伊斯坦布爾巴薩克謝希爾',
      'es': 'Istanbul Başakşehir', 'de': 'Istanbul Başakşehir', 'it': 'Istanbul Başakşehir', 'pt': 'Istanbul Başakşehir'
    },
    'ASA': {
      'zh': 'ASA', 'zh-hk': 'ASA', 'zh-tw': 'ASA',
      'es': 'ASA', 'de': 'ASA', 'it': 'ASA', 'pt': 'ASA'
    },
    'Silkeborg': {
      'zh': '锡尔克堡', 'zh-hk': '錫爾克堡', 'zh-tw': '錫爾克堡',
      'es': 'Silkeborg', 'de': 'Silkeborg', 'it': 'Silkeborg', 'pt': 'Silkeborg'
    },
    'Jagiellonia': {
      'zh': '雅盖隆尼亚', 'zh-hk': '雅蓋隆尼亞', 'zh-tw': '雅蓋隆尼亞',
      'es': 'Jagiellonia', 'de': 'Jagiellonia', 'it': 'Jagiellonia', 'pt': 'Jagiellonia'
    },
    'Riga': {
      'zh': '里加', 'zh-hk': '里加', 'zh-tw': '里加',
      'es': 'Riga', 'de': 'Riga', 'it': 'Riga', 'pt': 'Riga'
    },
    'RFS Riga': {
      'zh': '里加RFS', 'zh-hk': '里加RFS', 'zh-tw': '里加RFS',
      'es': 'RFS Riga', 'de': 'RFS Riga', 'it': 'RFS Riga', 'pt': 'RFS Riga'
    },
    'Beitar Jerusalem': {
      'zh': '耶路撒冷贝塔', 'zh-hk': '耶路撒冷貝塔', 'zh-tw': '耶路撒冷貝塔',
      'es': 'Beitar Jerusalén', 'de': 'Beitar Jerusalem', 'it': 'Beitar Gerusalemme', 'pt': 'Beitar Jerusalém'
    },
    'Baník Ostrava': {
      'zh': '奥斯特拉瓦矿工', 'zh-hk': '奧斯特拉瓦礦工', 'zh-tw': '奧斯特拉瓦礦工',
      'es': 'Baník Ostrava', 'de': 'Baník Ostrava', 'it': 'Baník Ostrava', 'pt': 'Baník Ostrava'
    },
    'Austria Vienna': {
      'zh': '奥地利维也纳', 'zh-hk': '奧地利維也納', 'zh-tw': '奧地利維也納',
      'es': 'Austria Viena', 'de': 'Austria Wien', 'it': 'Austria Vienna', 'pt': 'Austria Viena'
    },
    'FK Austria Wien': {
      'zh': '奥地利维也纳', 'zh-hk': '奧地利維也納', 'zh-tw': '奧地利維也納',
      'es': 'FK Austria Viena', 'de': 'FK Austria Wien', 'it': 'FK Austria Vienna', 'pt': 'FK Austria Viena'
    },
    'Rosenborg': {
      'zh': '罗森博格', 'zh-hk': '羅森博格', 'zh-tw': '羅森博格',
      'es': 'Rosenborg', 'de': 'Rosenborg', 'it': 'Rosenborg', 'pt': 'Rosenborg'
    },
    'Hammarby FF': {
      'zh': '哈马比', 'zh-hk': '哈馬比', 'zh-tw': '哈馬比',
      'es': 'Hammarby FF', 'de': 'Hammarby FF', 'it': 'Hammarby FF', 'pt': 'Hammarby FF'
    },
    'Milsami Orhei': {
      'zh': '奥尔海米尔萨米', 'zh-hk': '奧爾海米爾薩米', 'zh-tw': '奧爾海米爾薩米',
      'es': 'Milsami Orhei', 'de': 'Milsami Orhei', 'it': 'Milsami Orhei', 'pt': 'Milsami Orhei'
    },
    'Virtus': {
      'zh': '维尔图斯', 'zh-hk': '維爾圖斯', 'zh-tw': '維爾圖斯',
      'es': 'Virtus', 'de': 'Virtus', 'it': 'Virtus', 'pt': 'Virtus'
    },
    'Aris': {
      'zh': '阿里斯', 'zh-hk': '阿里斯', 'zh-tw': '阿里斯',
      'es': 'Aris', 'de': 'Aris', 'it': 'Aris', 'pt': 'Aris'
    },
    'AEK Athens FC': {
      'zh': '雅典AEK', 'zh-hk': '雅典AEK', 'zh-tw': '雅典AEK',
      'es': 'AEK Atenas FC', 'de': 'AEK Athen FC', 'it': 'AEK Atene FC', 'pt': 'AEK Atenas FC'
    },
    'Kauno Žalgiris': {
      'zh': '考纳斯萨尔基里斯', 'zh-hk': '考納斯薩爾基里斯', 'zh-tw': '考納斯薩爾基里斯',
      'es': 'Kauno Žalgiris', 'de': 'Kauno Žalgiris', 'it': 'Kauno Žalgiris', 'pt': 'Kauno Žalgiris'
    },
    'Arda Kardzhali': {
      'zh': '卡尔扎利阿尔达', 'zh-hk': '卡爾扎利阿爾達', 'zh-tw': '卡爾扎利阿爾達',
      'es': 'Arda Kardzhali', 'de': 'Arda Kardzhali', 'it': 'Arda Kardzhali', 'pt': 'Arda Kardzhali'
    },
    'Araz': {
      'zh': '阿拉兹', 'zh-hk': '阿拉茲', 'zh-tw': '阿拉茲',
      'es': 'Araz', 'de': 'Araz', 'it': 'Araz', 'pt': 'Araz'
    },
    'Viking': {
      'zh': '维京', 'zh-hk': '維京', 'zh-tw': '維京',
      'es': 'Viking', 'de': 'Viking', 'it': 'Viking', 'pt': 'Viking'
    },
    'FK Haugesund': {
      'zh': '豪格松德', 'zh-hk': '豪格松德', 'zh-tw': '豪格松德',
      'es': 'FK Haugesund', 'de': 'FK Haugesund', 'it': 'FK Haugesund', 'pt': 'FK Haugesund'
    },
    // Additional German teams
    'HHC': {
      'zh': 'HHC', 'zh-hk': 'HHC', 'zh-tw': 'HHC',
      'es': 'HHC', 'de': 'HHC', 'it': 'HHC', 'pt': 'HHC'
    },
    "Excelsior '31": {
      'zh': '精英31', 'zh-hk': '精英31', 'zh-tw': '精英31',
      'es': "Excelsior '31", 'de': "Excelsior '31", 'it': "Excelsior '31", 'pt': "Excelsior '31"
    },

    // Additional teams for common patterns
    'Spouwen-Mopertingen': {
      'zh': '斯波文莫珀廷根', 'zh-hk': '斯波文莫珀廷根', 'zh-tw': '斯波文莫珀廷根',
      'es': 'Spouwen-Mopertingen', 'de': 'Spouwen-Mopertingen', 'it': 'Spouwen-Mopertingen', 'pt': 'Spouwen-Mopertingen'
    },

    // AUTOMATED TEAM MAPPINGS - Enhanced with proper translations where available
    // Generated from leagues: 38, 15, 2, 4, 10, 11, 848, 886, 1022, 772, 71, 3, 5, 531, 22, etc.

    // MLS Teams (enhanced)
    'Austin': {
      'zh': '奥斯汀', 'zh-hk': '奧斯汀', 'zh-tw': '奧斯汀',
      'es': 'Austin', 'de': 'Austin', 'it': 'Austin', 'pt': 'Austin'
    },
    'St. Louis City': {
      'zh': '圣路易斯城', 'zh-hk': '聖路易斯城', 'zh-tw': '聖路易斯城',
      'es': 'St. Louis City', 'de': 'St. Louis City', 'it': 'St. Louis City', 'pt': 'St. Louis City'
    },
    'CF Montreal': {
      'zh': '蒙特利尔', 'zh-hk': '蒙特利爾', 'zh-tw': '蒙特利爾',
      'es': 'CF Montreal', 'de': 'CF Montreal', 'it': 'CF Montreal', 'pt': 'CF Montreal'
    },
    'Columbus Crew': {
      'zh': '哥伦布机员', 'zh-hk': '哥倫布機員', 'zh-tw': '哥倫布機員',
      'es': 'Columbus Crew', 'de': 'Columbus Crew', 'it': 'Columbus Crew', 'pt': 'Columbus Crew'
    },
    'Orlando City SC': {
      'zh': '奥兰多城', 'zh-hk': '奧蘭多城', 'zh-tw': '奧蘭多城',
      'es': 'Orlando City SC', 'de': 'Orlando City SC', 'it': 'Orlando City SC', 'pt': 'Orlando City SC'
    },
    'Philadelphia Union': {
      'zh': '费城联合', 'zh-hk': '費城聯合', 'zh-tw': '費城聯合',
      'es': 'Philadelphia Union', 'de': 'Philadelphia Union', 'it': 'Philadelphia Union', 'pt': 'Philadelphia Union'
    },
    'DC United': {
      'zh': '华盛顿联', 'zh-hk': '華盛頓聯', 'zh-tw': '華盛頓聯',
      'es': 'DC United', 'de': 'DC United', 'it': 'DC United', 'pt': 'DC United'
    },
    'New England Revolution': {
      'zh': '新英格兰革命', 'zh-hk': '新英格蘭革命', 'zh-tw': '新英格蘭革命',
      'es': 'New England Revolution', 'de': 'New England Revolution', 'it': 'New England Revolution', 'pt': 'New England Revolution'
    },
    'Chicago Fire': {
      'zh': '芝加哥火焰', 'zh-hk': '芝加哥火焰', 'zh-tw': '芝加哥火焰',
      'es': 'Chicago Fire', 'de': 'Chicago Fire', 'it': 'Chicago Fire', 'pt': 'Chicago Fire'
    },
    'Houston Dynamo': {
      'zh': '休斯顿迪纳摩', 'zh-hk': '休斯頓迪納摩', 'zh-tw': '休斯頓迪納摩',
      'es': 'Houston Dynamo', 'de': 'Houston Dynamo', 'it': 'Houston Dynamo', 'pt': 'Houston Dynamo'
    },
    'Minnesota United FC': {
      'zh': '明尼苏达联', 'zh-hk': '明尼蘇達聯', 'zh-tw': '明尼蘇達聯',
      'es': 'Minnesota United FC', 'de': 'Minnesota United FC', 'it': 'Minnesota United FC', 'pt': 'Minnesota United FC'
    },
    'Real Salt Lake': {
      'zh': '皇家盐湖城', 'zh-hk': '皇家鹽湖城', 'zh-tw': '皇家鹽湖城',
      'es': 'Real Salt Lake', 'de': 'Real Salt Lake', 'it': 'Real Salt Lake', 'pt': 'Real Salt Lake'
    },
    'Nashville SC': {
      'zh': '纳什维尔', 'zh-hk': '納什維爾', 'zh-tw': '納什維爾',
      'es': 'Nashville SC', 'de': 'Nashville SC', 'it': 'Nashville SC', 'pt': 'Nashville SC'
    },

    // Additional Colombian Teams
    'Envigado': {
      'zh': '恩维加多', 'zh-hk': '恩維加多', 'zh-tw': '恩維加多',
      'es': 'Envigado', 'de': 'Envigado', 'it': 'Envigado', 'pt': 'Envigado'
    },
    'Deportivo Pereira': {
      'zh': '佩雷拉体育', 'zh-hk': '佩雷拉體育', 'zh-tw': '佩雷拉體育',
      'es': 'Deportivo Pereira', 'de': 'Deportivo Pereira', 'it': 'Deportivo Pereira', 'pt': 'Deportivo Pereira'
    },
    'Rionegro Aguilas': {
      'zh': '里奥内格罗老鹰', 'zh-hk': '里奧內格羅老鷹', 'zh-tw': '里奧內格羅老鷹',
      'es': 'Rionegro Aguilas', 'de': 'Rionegro Aguilas', 'it': 'Rionegro Aguilas', 'pt': 'Rionegro Aguilas'
    },
    'Bucaramanga': {
      'zh': '布卡拉曼加', 'zh-hk': '布卡拉曼加', 'zh-tw': '布卡拉曼加',
      'es': 'Bucaramanga', 'de': 'Bucaramanga', 'it': 'Bucaramanga', 'pt': 'Bucaramanga'
    },

    // Additional Russian Teams
    'FC Rostov': {
      'zh': '顿河罗斯托夫', 'zh-hk': '頓河羅斯托夫', 'zh-tw': '頓河羅斯托夫',
      'es': 'FC Rostov', 'de': 'FC Rostov', 'it': 'FC Rostov', 'pt': 'FC Rostov'
    },
    'Torpedo Moskva': {
      'zh': '莫斯科鱼雷', 'zh-hk': '莫斯科魚雷', 'zh-tw': '莫斯科魚雷',
      'es': 'Torpedo Moskva', 'de': 'Torpedo Moskva', 'it': 'Torpedo Moskva', 'pt': 'Torpedo Moskva'
    },

    // Additional Brazilian Teams (Serie B/C)
    'Operario-PR': {
      'zh': '巴拉那工人', 'zh-hk': '巴拉那工人', 'zh-tw': '巴拉那工人',
      'es': 'Operario-PR', 'de': 'Operario-PR', 'it': 'Operario-PR', 'pt': 'Operario-PR'
    },
    'Novorizontino': {
      'zh': '新地平线', 'zh-hk': '新地平線', 'zh-tw': '新地平線',
      'es': 'Novorizontino', 'de': 'Novorizontino', 'it': 'Novorizontino', 'pt': 'Novorizontino'
    },
    'Mirassol': {
      'zh': '米拉索尔', 'zh-hk': '米拉索爾', 'zh-tw': '米拉索爾',
      'es': 'Mirassol', 'de': 'Mirassol', 'it': 'Mirassol', 'pt': 'Mirassol'
    },
    'Volta Redonda': {
      'zh': '伏尔塔雷东达', 'zh-hk': '伏爾塔雷東達', 'zh-tw': '伏爾塔雷東達',
      'es': 'Volta Redonda', 'de': 'Volta Redonda', 'it': 'Volta Redonda', 'pt': 'Volta Redonda'
    },

    // Additional European Teams

    'FK Crvena Zvezda': {
      'zh': '贝尔格莱德红星', 'zh-hk': '貝爾格萊德紅星', 'zh-tw': '貝爾格萊德紅星',
      'es': 'FK Crvena Zvezda', 'de': 'FK Roter Stern Belgrad', 'it': 'FK Stella Rossa Belgrado', 'pt': 'FK Estrela Vermelha'
    },
    'Slovan Bratislava': {
      'zh': '布拉迪斯拉发斯洛万', 'zh-hk': '布拉迪斯拉發斯洛萬', 'zh-tw': '布拉迪斯拉發斯洛萬',
      'es': 'Slovan Bratislava', 'de': 'Slovan Bratislava', 'it': 'Slovan Bratislava', 'pt': 'Slovan Bratislava'
    },
    'Ludogorets': {
      'zh': '卢多戈雷茨', 'zh-hk': '盧多戈雷茨', 'zh-tw': '盧多戈雷茨',
      'es': 'Ludogorets', 'de': 'Ludogorets', 'it': 'Ludogorets', 'pt': 'Ludogorets'
    },
    'Red Bull Salzburg': {
      'zh': '萨尔茨堡红牛', 'zh-hk': '薩爾茨堡紅牛', 'zh-tw': '薩爾茨堡紅牛',
      'es': 'Red Bull Salzburg', 'de': 'Red Bull Salzburg', 'it': 'Red Bull Salzburg', 'pt': 'Red Bull Salzburg'
    },

    // Egyptian Teams
    'Al Ahly': {
      'zh': '开罗国民', 'zh-hk': '開羅國民', 'zh-tw': '開羅國民',
      'es': 'Al Ahly', 'de': 'Al Ahly', 'it': 'Al Ahly', 'pt': 'Al Ahly'
    },


    // AUTOMATED TEAM MAPPINGS - merged from generateCompleteTeamMapping
    // These provide broad coverage but manual translations above take priority

    // Only add teams not already covered by manual translations above

    'Vila Nova': {
      'zh': '维拉诺瓦', 'zh-hk': '維拉諾瓦', 'zh-tw': '維拉諾瓦',
      'es': 'Vila Nova', 'de': 'Vila Nova', 'it': 'Vila Nova', 'pt': 'Vila Nova'
    },

    'San Diego': {
      'zh': '圣迭戈', 'zh-hk': '聖迭戈', 'zh-tw': '聖迭戈',
      'es': 'San Diego', 'de': 'San Diego', 'it': 'San Diego', 'pt': 'San Diego'
    },

    'Sporting Kansas City': {
      'zh': '堪萨斯城体育', 'zh-hk': '堪薩斯城體育', 'zh-tw': '堪薩斯城體育',
      'es': 'Sporting Kansas City', 'de': 'Sporting Kansas City', 'it': 'Sporting Kansas City', 'pt': 'Sporting Kansas City'
    },
    'FC Dallas': {
      'zh': '达拉斯', 'zh-hk': '達拉斯', 'zh-tw': '達拉斯',
      'es': 'FC Dallas', 'de': 'FC Dallas', 'it': 'FC Dallas', 'pt': 'FC Dallas'
    },
    'Vancouver Whitecaps': {
      'zh': '温哥华白帽', 'zh-hk': '溫哥華白帽', 'zh-tw': '溫哥華白帽',
      'es': 'Vancouver Whitecaps', 'de': 'Vancouver Whitecaps', 'it': 'Vancouver Whitecaps', 'pt': 'Vancouver Whitecaps'
    },
    'Rochefort': {
      'zh': '罗什福尔', 'zh-hk': '羅什福爾', 'zh-tw': '羅什福爾',
      'es': 'Rochefort', 'de': 'Rochefort', 'it': 'Rochefort', 'pt': 'Rochefort'
    },
    'Marino de Luanco': {
      'zh': '马里诺德卢安科', 'zh-hk': '馬里諾德盧安科', 'zh-tw': '馬里諾德盧安科',
      'es': 'Marino de Luanco', 'de': 'Marino de Luanco', 'it': 'Marino de Luanco', 'pt': 'Marino de Luanco'
    },

    // European Conference League / Europa League teams
    'FCSB': {
      'zh': '布加勒斯特星队', 'zh-hk': '布加勒斯特星隊', 'zh-tw': '布加勒斯特星隊',
      'es': 'FCSB', 'de': 'FCSB', 'it': 'FCSB', 'pt': 'FCSB'
    },
    'FK Partizan': {
      'zh': '贝尔格莱德游击队', 'zh-hk': '貝爾格萊德游擊隊', 'zh-tw': '貝爾格萊德游擊隊',
      'es': 'FK Partizan', 'de': 'FK Partizan', 'it': 'FK Partizan', 'pt': 'FK Partizan'
    },
    'Partizan': {
      'zh': '贝尔格莱德游击队', 'zh-hk': '貝爾格萊德游擊隊', 'zh-tw': '貝爾格萊德游擊隊',
      'es': 'Partizan', 'de': 'Partizan', 'it': 'Partizan', 'pt': 'Partizan'
    },
    'Hibernian': {
      'zh': '希伯尼安', 'zh-hk': '希伯尼安', 'zh-tw': '希伯尼安',
      'es': 'Hibernian', 'de': 'Hibernian', 'it': 'Hibernian', 'pt': 'Hibernian'
    },
    'HNK Hajduk Split': {
      'zh': '哈伊杜克', 'zh-hk': '哈伊杜克', 'zh-tw': '哈伊杜克',
      'es': 'HNK Hajduk Split', 'de': 'HNK Hajduk Split', 'it': 'HNK Hajduk Split', 'pt': 'HNK Hajduk Split'
    },
    'Hajduk Split': {
      'zh': '哈伊杜克', 'zh-hk': '哈伊杜克', 'zh-tw': '哈伊杜克',
      'es': 'Hajduk Split', 'de': 'Hajduk Split', 'it': 'Hajduk Split', 'pt': 'Hajduk Split'
    },
    'Dinamo Tirana': {
      'zh': '地拉那迪纳摩', 'zh-hk': '地拉那迪納摩', 'zh-tw': '地拉那迪納摩',
      'es': 'Dinamo Tirana', 'de': 'Dinamo Tirana', 'it': 'Dinamo Tirana', 'pt': 'Dinamo Tirana'
    },
    'Rapid Vienna': {
      'zh': '维也纳快速', 'zh-hk': '維也納快速', 'zh-tw': '維也納快速',
      'es': 'Rapid Viena', 'de': 'Rapid Wien', 'it': 'Rapid Vienna', 'pt': 'Rapid Viena'
    },
    'Rapid Wien': {
      'zh': '维也纳快速', 'zh-hk': '維也納快速', 'zh-tw': '維也納快速',
      'es': 'Rapid Viena', 'de': 'Rapid Wien', 'it': 'Rapid Vienna', 'pt': 'Rapid Viena'
    },
    'Dundee Utd': {
      'zh': '邓迪联', 'zh-hk': '鄧迪聯', 'zh-tw': '鄧迪聯',
      'es': 'Dundee United', 'de': 'Dundee United', 'it': 'Dundee United', 'pt': 'Dundee United'
    },
    'Dundee United': {
      'zh': '邓迪联', 'zh-hk': '鄧迪聯', 'zh-tw': '鄧迪聯',
      'es': 'Dundee United', 'de': 'Dundee United', 'it': 'Dundee United', 'pt': 'Dundee United'
    },
    'Raków Częstochowa': {
      'zh': '琴斯托霍瓦拉科夫', 'zh-hk': '琴斯托霍瓦拉科夫', 'zh-tw': '琴斯托霍瓦拉科夫',
      'es': 'Raków Częstochowa', 'de': 'Raków Częstochowa', 'it': 'Raków Częstochowa', 'pt': 'Raków Częstochowa'
    },
    'Rakow Czestochowa': {
      'zh': '琴斯托霍瓦拉科夫', 'zh-hk': '琴斯托霍瓦拉科夫', 'zh-tw': '琴斯托霍瓦拉科夫',
      'es': 'Raków Częstochowa', 'de': 'Raków Częstochowa', 'it': 'Raków Częstochowa', 'pt': 'Raków Częstochowa'
    },
    'Maccabi Haifa': {
      'zh': '海法马卡比', 'zh-hk': '海法馬卡比', 'zh-tw': '海法馬卡比',
      'es': 'Maccabi Haifa', 'de': 'Maccabi Haifa', 'it': 'Maccabi Haifa', 'pt': 'Maccabi Haifa'
    },
    'Larne': {
      'zh': '拉恩', 'zh-hk': '拉恩', 'zh-tw': '拉恩',
      'es': 'Larne', 'de': 'Larne', 'it': 'Larne', 'pt': 'Larne'
    },
    'Santa Clara': {
      'zh': '圣克拉拉', 'zh-hk': '聖克拉拉', 'zh-tw': '聖克拉拉',
      'es': 'Santa Clara', 'de': 'Santa Clara', 'it': 'Santa Clara', 'pt': 'Santa Clara'
    },
    'CD Santa Clara': {
      'zh': '圣克拉拉', 'zh-hk': '聖克拉拉', 'zh-tw': '聖克拉拉',
      'es': 'CD Santa Clara', 'de': 'CD Santa Clara', 'it': 'CD Santa Clara', 'pt': 'CD Santa Clara'
    },
    'Vikingur Reykjavik': {
      'zh': '雷克雅未克维京', 'zh-hk': '雷克雅未克維京', 'zh-tw': '雷克雅未克維京',
      'es': 'Vikingur Reykjavik', 'de': 'Vikingur Reykjavik', 'it': 'Vikingur Reykjavik', 'pt': 'Vikingur Reykjavik'
    },
    'Brondby': {
      'zh': '布隆德比', 'zh-hk': '布隆德比', 'zh-tw': '布隆德比',
      'es': 'Brøndby', 'de': 'Brøndby', 'it': 'Brøndby', 'pt': 'Brøndby'
    },
    'Brøndby': {
      'zh': '布隆德比', 'zh-hk': '布隆德比', 'zh-tw': '布隆德比',
      'es': 'Brøndby', 'de': 'Brøndby', 'it': 'Brøndby', 'pt': 'Brøndby'
    },
    'St Patrick\'s Athl.': {
      'zh': '圣帕特里克竞技', 'zh-hk': '聖柏德烈競技', 'zh-tw': '聖派翠克競技',
      'es': 'St Patrick\'s Athletic', 'de': 'St Patrick\'s Athletic', 'it': 'St Patrick\'s Athletic', 'pt': 'St Patrick\'s Athletic'
    },
    'St Patrick\'s Athletic': {
      'zh': '圣帕特里克竞技', 'zh-hk': '聖柏德烈競技', 'zh-tw': '聖派翠克競技',
      'es': 'St Patrick\'s Athletic', 'de': 'St Patrick\'s Athletic', 'it': 'St Patrick\'s Athletic', 'pt': 'St Patrick\'s Athletic'
    },
    'Besiktas': {
      'zh': '贝西克塔斯', 'zh-hk': '貝西克塔斯', 'zh-tw': '貝西克塔斯',
      'es': 'Beşiktaş', 'de': 'Beşiktaş', 'it': 'Beşiktaş', 'pt': 'Beşiktaş'
    },
    'Beşiktaş': {
      'zh': '贝西克塔斯', 'zh-hk': '貝西克塔斯', 'zh-tw': '貝西克塔斯',
      'es': 'Beşiktaş', 'de': 'Beşiktaş', 'it': 'Beşiktaş', 'pt': 'Beşiktaş'
    },
    'FC Lugano': {
      'zh': '卢加诺', 'zh-hk': '盧加諾', 'zh-tw': '盧加諾',
      'es': 'FC Lugano', 'de': 'FC Lugano', 'it': 'FC Lugano', 'pt': 'FC Lugano'
    },
    'Lugano': {
      'zh': '卢加诺', 'zh-hk': '盧加諾', 'zh-tw': '盧加諾',
      'es': 'Lugano', 'de': 'Lugano', 'it': 'Lugano', 'pt': 'Lugano'
    },
    'Celje': {
      'zh': '采列', 'zh-hk': '採列', 'zh-tw': '采列',
      'es': 'Celje', 'de': 'Celje', 'it': 'Celje', 'pt': 'Celje'
    },
    'NK Celje': {
      'zh': '采列', 'zh-hk': '採列', 'zh-tw': '采列',
      'es': 'NK Celje', 'de': 'NK Celje', 'it': 'NK Celje', 'pt': 'NK Celje'
    },
    'Universitatea Craiova': {
      'zh': '克拉约瓦大学', 'zh-hk': '克拉約瓦大學', 'zh-tw': '克拉約瓦大學',
      'es': 'Universitatea Craiova', 'de': 'Universitatea Craiova', 'it': 'Universitatea Craiova', 'pt': 'Universitatea Craiova'
    },

  };

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

    // Check learned mappings, but validate them first
    const learnedTeamTranslations = this.learnedTeamMappings.get(teamName);
    if (learnedTeamTranslations) {
      const learnedTranslation = learnedTeamTranslations[language as keyof typeof learnedTeamTranslations];
      if (learnedTranslation && learnedTranslation !== teamName && !this.isCorruptedTranslation(learnedTranslation, teamName)) {
        console.log(`🎓 [SmartTranslation] Using learned mapping: "${teamName}" -> "${learnedTranslation}" (${language})`);
        return learnedTranslation;
      } else if (learnedTranslation && this.isCorruptedTranslation(learnedTranslation, teamName)) {
        console.log(`🧹 [SmartTranslation] Removing corrupted learned mapping for: "${teamName}"`);
        this.learnedTeamMappings.delete(teamName);
        this.saveLearnedMappings();
      }
    }

    // Try without common suffixes/prefixes (enhanced patterns)
    const cleanName = teamName
      .replace(/^(FC|CF|AC|AS|Real|Club|CD|SD|AD|FK|NK|KF|PFC|SC)\s+/i, '')
      .replace(/\s+(FC|CF|AC|AS|United|City|CF|SC|II|2|B|LP)$/i, '')
      .replace(/\s+L\.P\./i, '')
      .replace(/\s+DA\s+/i, ' ')
      .replace(/\s+Rivadavia/i, ' Rivadavia');

    const cleanMatch = Object.keys(this.popularLeagueTeams).find(
      key => key.toLowerCase() === cleanName.toLowerCase()
    );
    if (cleanMatch) {
      const translation = this.popularLeagueTeams[cleanMatch][language as keyof TeamTranslation[string]];
      if (translation) return translation;
    }

    // Enhanced matching for common team name patterns
    const teamNameLower = teamName.toLowerCase();

    // Special cases for known teams
    if (teamNameLower.includes('los angeles galaxy') || teamNameLower === 'la galaxy') {
      const translation = this.popularLeagueTeams['Los Angeles Galaxy']?.[language as keyof TeamTranslation[string]];
      if (translation) return translation;
    }

    if (teamNameLower.includes('new york red bulls')) {
      const translation = this.popularLeagueTeams['New York Red Bulls']?.[language as keyof TeamTranslation[string]];
      if (translation) return translation;
    }

    if (teamNameLower === 'charlotte' || teamNameLower === 'charlotte fc') {
      const translation = this.popularLeagueTeams['Charlotte']?.[language as keyof TeamTranslation[string]];
      if (translation) return translation;
    }

    if (teamNameLower === 'fc cincinnati' || teamNameLower === 'cincinnati') {
      const translation = this.popularLeagueTeams['FC Cincinnati']?.[language as keyof TeamTranslation[string]];
      if (translation) return translation;
    }

    if (teamNameLower === 'fc juarez' || teamNameLower === 'juarez') {
      const translation = this.popularLeagueTeams['FC Juarez']?.[language as keyof TeamTranslation[string]];
      if (translation) return translation;
    }

    // Try partial matches for complex names (enhanced algorithm)
    for (const [mappedTeam, translations] of Object.entries(this.popularLeagueTeams)) {
      const mappedTeamLower = mappedTeam.toLowerCase();

      // More sophisticated partial matching
      if (teamNameLower.includes(mappedTeamLower) ||
          mappedTeamLower.includes(teamNameLower)) {
        const translation = translations[language as keyof TeamTranslation[string]];
        if (translation) return translation;
      }

      // Word-based matching (minimum 4 characters to avoid false positives)
      const teamWords = teamNameLower.split(/\s+/).filter(word => word.length >= 4);
      const mappedWords = mappedTeamLower.split(/\s+/).filter(word => word.length >= 4);

      // If any significant word matches
      if (teamWords.some(word => mappedWords.includes(word)) ||
          mappedWords.some(word => teamWords.includes(word))) {
        const translation = translations[language as keyof TeamTranslation[string]];
        if (translation) return translation;
      }

      // Handle special characters and variations
      const normalizedTeam = teamNameLower.replace(/['']/g, "'").replace(/[–-]/g, "-");
      const normalizedMapped = mappedTeamLower.replace(/['']/g, "'").replace(/[–-]/g, "-");

      if (normalizedTeam === normalizedMapped) {
        const translation = translations[language as keyof TeamTranslation[string]];
        if (translation) return translation;
      }
    }

    return null;
  }

  // Get cached team data for a specific league
  getLeagueTeams(leagueId: number): any[] | null {
    if (this.leagueTeamsCache[leagueId]) {
      console.log(`📊 [SmartTranslation] Found ${this.leagueTeamsCache[leagueId].length} cached teams for league ${leagueId}`);
      return this.leagueTeamsCache[leagueId];
    }
    return null;
  }

  // Auto-learn teams from API fixture responses with bulk learning
  learnTeamsFromFixtures(fixtures: any[]): void {
    let newMappingsCount = 0;

    fixtures.forEach(fixture => {
      if (!fixture?.teams?.home?.name || !fixture?.teams?.away?.name) return;

      const homeTeam = fixture.teams.home.name;
      const awayTeam = fixture.teams.away.name;

      // Learn mappings by analyzing team names in different contexts
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
    // Skip if already exists in static mappings or learned mappings
    if (this.popularLeagueTeams[teamName] || this.learnedTeamMappings.has(teamName)) {
      return false;
    }

    // Skip very short names or names with special characters that might be unstable
    if (teamName.length < 3 || /[^\w\s\-'.]/i.test(teamName)) {
      return false;
    }

    return true;
  }

  // Create a team mapping from analyzing the team name
  private createTeamMappingFromName(teamName: string): TeamTranslation | null {
    // For now, create a basic mapping structure
    // This can be enhanced with more sophisticated translation logic
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

  // Load automated mappings from localStorage or external sources
  private async loadAutomatedMappings(): Promise<void> {
    try {
      const automatedData = localStorage.getItem('automatedTeamMapping');
      if (automatedData) {
        const data = JSON.parse(automatedData);
        if (data.teams) {
          this.automatedMappings = new Map(Object.entries(data.teams));
          console.log(`🤖 [SmartTranslation] Loaded ${this.automatedMappings.size} automated mappings`);
        }
      }
    } catch (error) {
      console.warn('🚨 [SmartTranslation] Failed to load automated mappings:', error);
      this.automatedMappings = new Map();
    }
  }

  // Initialize team translations for a specific language
  async initializeTeamTranslations(language: string): Promise<void> {
    try {
      console.log(`🔄 [SmartTranslation] Initializing team translations for language: ${language}`);

      // Load cached mappings
      this.loadLearnedMappings();

      // Load automated mappings
      await this.loadAutomatedMappings();

      // Clear any stale cache entries
      this.clearStaleCache();

      console.log(`✅ [SmartTranslation] Successfully initialized for ${language} with ${this.learnedTeamMappings.size} learned mappings`);
    } catch (error) {
      console.error(`❌ [SmartTranslation] Failed to initialize for ${language}:`, error);
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

  // Clear stale cache entries
  private clearStaleCache(): void {
    if (!this.translationCache) {
      this.translationCache = new Map();
      return;
    }

    const now = Date.now();
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, entry] of this.translationCache.entries()) {
      if (entry && entry.timestamp && now - entry.timestamp > staleThreshold) {
        this.translationCache.delete(key);
      }
    }
  }

  // Learn from translation context (when we see translated vs original names)
  learnFromTranslationContext(originalName: string, translatedName: string, language: string): void {
    if (!originalName || !translatedName || originalName === translatedName) return;

    // Create or update learned mapping
    let mapping = this.learnedTeamMappings.get(originalName);
    if (!mapping) {
      mapping = {
        'zh': originalName,
        'zh-hk': originalName,
        'zh-tw': originalName,
        'es': originalName,
        'de': originalName,
        'it': originalName,
        'pt': originalName
      };
    }

    // Update the specific language translation
    mapping[language as keyof TeamTranslation] = translatedName;
    this.learnedTeamMappings.set(originalName, mapping);
    this.saveLearnedMappings();

    console.log(`🎓 [SmartTranslation] Learned new translation: "${originalName}" -> "${translatedName}" (${language})`);
  }

  // Generate team mappings from current fixtures
  generateTeamMappingsFromCurrentFixtures(fixtures: any[]): string {
    const teamsByCountry = new Map<string, Set<string>>();
    const teamsByLeague = new Map<string, Set<string>>();

    fixtures.forEach(fixture => {
      if (!fixture?.teams?.home?.name || !fixture?.teams?.away?.name) return;

      const country = fixture.league?.country || 'Unknown';
      const leagueName = fixture.league?.name || 'Unknown League';

      if (!teamsByCountry.has(country)) {
        teamsByCountry.set(country, new Set());
      }
      if (!teamsByLeague.has(leagueName)) {
        teamsByLeague.set(leagueName, new Set());
      }

      teamsByCountry.get(country)!.add(fixture.teams.home.name);
      teamsByCountry.get(country)!.add(fixture.teams.away.name);
      teamsByLeague.get(leagueName)!.add(fixture.teams.home.name);
      teamsByLeague.get(leagueName)!.add(fixture.teams.away.name);
    });

    let output = '// Auto-generated team mappings from current fixtures\n\n';

    // Group by country
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

  // Force refresh specific team translations and clear corrupted learned mappings
  forceRefreshTranslations(teams: string[], language: string = 'zh-hk'): void {
    teams.forEach(team => {
      const cacheKey = `${team.toLowerCase()}_${language}`;
      this.teamCache.delete(cacheKey);

      // Check if learned mapping is corrupted and remove it
      const learnedMapping = this.learnedTeamMappings.get(team);
      if (learnedMapping) {
        const translation = learnedMapping[language as keyof typeof learnedMapping];
        if (translation && this.isCorruptedTranslation(translation, team)) {
          console.log(`🧹 [SmartTranslation] Removing corrupted learned mapping: "${team}" -> "${translation}"`);
          this.learnedTeamMappings.delete(team);
        }
      }

      // Clear any corrupted localStorage entries
      localStorage.removeItem(`smart_translation_${team}_${language}`);

      console.log(`🔄 [SmartTranslation] Force refreshed: ${team} for ${language}`);
    });

    // Save changes after cleanup
    this.saveLearnedMappings();
  }

  // Cache and store league teams for future use
  cacheLeagueTeams(leagueId: number, teams: any[]): void {
    if (teams && teams.length > 0) {
      this.leagueTeamsCache[leagueId] = teams;
      console.log(`💾 [SmartTranslation] Cached ${teams.length} teams for league ${leagueId}`);
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
  private saveLearnedMappings() {
    try {
      const mappingsObject = Object.fromEntries(this.learnedTeamMappings.entries());
      localStorage.setItem('smart_translation_learned_mappings', JSON.stringify(mappingsObject));
    } catch (error) {
      console.warn('🚨 [SmartTranslation] Failed to save learned mappings:', error);
    }
  }



  // Enhanced fallback for common team patterns with automated mapping integration
  private getEnhancedFallback(teamName: string, language: string): string | null {
    if (!teamName || !language) return null;

    // First, try to load automated mappings from the generated file
    const automatedTranslation = this.getAutomatedTeamTranslation(teamName, language);
    if (automatedTranslation && automatedTranslation !== teamName) {
      return automatedTranslation;
    }

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
      },
      'Real': {
        'zh': '皇家', 'zh-hk': '皇家', 'zh-tw': '皇家',
        'es': 'Real', 'de': 'Real', 'it': 'Real', 'pt': 'Real'
      },
      'Atletico': {
        'zh': '竞技', 'zh-hk': '競技', 'zh-tw': '競技',
        'es': 'Atlético', 'de': 'Atlético', 'it': 'Atlético', 'pt': 'Atlético'
      },
      'Deportivo': {
        'zh': '体育', 'zh-hk': '體育', 'zh-tw': '體育',
        'es': 'Deportivo', 'de': 'Deportivo', 'it': 'Deportivo', 'pt': 'Deportivo'
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

    // Try removing common prefixes/suffixes and check again
    const cleanedName = teamName
      .replace(/^(FC|CF|AC|AS|Real|Club|CD|SD|AD|FK|NK|KF|PFC|SC)\s+/i, '')
      .replace(/\s+(FC|CF|AC|AS|United|City|CF|SC|II|2|B|LP)$/i, '')
      .trim();

    if (cleanedName !== teamName && cleanedName.length > 2) {
      const cleanTranslation = this.getPopularTeamTranslation(cleanedName, language);
      if (cleanTranslation && cleanTranslation !== cleanedName) {
        return cleanTranslation;
      }
    }

    // Generate smart phonetic translation as last resort
    return this.generateSmartPhoneticTranslation(teamName, language);
  }

  // Get translation from automated team mappings
  private getAutomatedTeamTranslation(teamName: string, language: string): string | null {
    try {
      // Check if automated mappings are stored in localStorage
      const automatedMappings = localStorage.getItem('automatedTeamMapping');
      if (automatedMappings) {
        const data = JSON.parse(automatedMappings);
        // Look for the team in the automated data
        if (data.teams && data.teams[teamName]) {
          return data.teams[teamName][language] || null;
        }
      }
    } catch (error) {
      console.warn('Failed to load automated team mappings:', error);
    }
    return null;
  }

  // Generate smart phonetic translation for unknown teams
  private generateSmartPhoneticTranslation(teamName: string, language: string): string | null {
    if (!language.startsWith('zh')) {
      return null; // Only generate phonetic translations for Chinese languages
    }

    // Basic phonetic mapping for Chinese
    const phoneticMap: Record<string, string> = {
      'a': '阿', 'b': '巴', 'c': '卡', 'd': '达', 'e': '埃', 'f': '法', 'g': '加', 'h': '哈',
      'i': '伊', 'j': '雅', 'k': '卡', 'l': '拉', 'm': '马', 'n': '纳', 'o': '奥', 'p': '帕',
      'q': '库', 'r': '拉', 's': '萨', 't': '塔', 'u': '乌', 'v': '维', 'w': '瓦', 'x': '克',
      'y': '伊', 'z': '扎'
    };

    let phoneticTranslation = '';
    const cleanName = teamName.replace(/[^a-zA-Z]/g, '').toLowerCase();

    for (let i = 0; i < Math.min(cleanName.length, 6); i++) { // Limit to 6 characters
      const char = cleanName[i];
      if (phoneticMap[char]) {
        phoneticTranslation += phoneticMap[char];
      }
    }

    return phoneticTranslation || null;
  }

  // Helper method to get translation for a team name
  private getTranslationForTeam(teamName: string, language: string): string | null {
    // Check popular league teams first
    const teamTranslations = this.popularLeagueTeams[teamName];
    if (teamTranslations && teamTranslations[language as keyof typeof teamTranslations]) {
      return teamTranslations[language as keyof typeof teamTranslations];
    }

    // Check cache
    const cacheKey = `smart_translation_${teamName}_${language}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return cached;
    }

    return null;
  }

  // Generate comprehensive team mappings from current fixtures
  generateComprehensiveMapping(fixtures: any[]): { [key: string]: string } {
    const mapping: { [key: string]: string } = {};
    const teamCounts: { [key: string]: number } = {};

    // Collect all team names from fixtures
    fixtures.forEach(fixture => {
      if (fixture?.teams?.home?.name) {
        const teamName = fixture.teams.home.name;
        teamCounts[teamName] = (teamCounts[teamName] || 0) + 1;
      }
      if (fixture?.teams?.away?.name) {
        const teamName = fixture.teams.away.name;
        teamCounts[teamName] = (teamCounts[teamName] || 0) + 1;
      }
    });

    // Sort teams by frequency
    const sortedTeams = Object.entries(teamCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([team]) => team);

    // Generate template for missing translations
    sortedTeams.forEach(teamName => {
      const translated = this.translateTeamName(teamName, 'zh-hk');
      if (translated === teamName) {
        // Team needs translation
        mapping[teamName] = `需要翻譯: ${teamName}`;
      }
    });

    console.log(`🎯 [SmartTranslation] Generated mapping for ${Object.keys(mapping).length} teams needing translation`);
    return mapping;
  }

  // Generate mapping for specific leagues
  generateMappingForLeagues(leagueIds: number[]): string {
    const mapping: Record<string, Record<string, string>> = {};

    leagueIds.forEach(leagueId => {
      const teams = this.leagueTeamsCache[leagueId] || [];
      teams.forEach((team: any) => {
        if (team?.teams?.home?.name) {
          mapping[team.teams.home.name] = this.createMappingTemplate(team.teams.home.name);
        }
        if (team?.teams?.away?.name) {
          mapping[team.teams.away.name] = this.createMappingTemplate(team.teams.away.name);
        }
      });
    });

    return mapping;
  }

  // Helper to create a mapping template
  private createMappingTemplate(teamName: string): Record<string, string> {
    return {
      'zh': teamName,
      'zh-hk': teamName,
      'zh-tw': teamName,
      'es': teamName,
      'de': teamName,
      'it': teamName,
      'pt': teamName
    };
  }

  // Get statistics about learned mappings
  getLearnedMappingsStats(): { total: number; byLanguage: Record<string, number> } {
    const stats = {
      total: this.learnedTeamMappings.size,
      byLanguage: {
        'zh': 0,
        'zh-hk': 0,
        'zh-tw': 0,
        'es': 0,
        'de': 0,
        'it': 0,
        'pt': 0
      }
    };

    this.learnedTeamMappings.forEach(mapping => {
      Object.keys(mapping).forEach(lang => {
        if (mapping[lang as keyof TeamTranslation] !== mapping.zh) {
          stats.byLanguage[lang as keyof typeof stats.byLanguage]++;
        }
      });
    });

    return stats;
  }

  // Automatically integrate generated team mappings from the automated system
  integrateAutomatedMappings(): void {
    try {
      const automatedData = localStorage.getItem('automatedTeamMapping');
      if (automatedData) {
        const data = JSON.JSON.parse(automatedData);
        console.log(`🤖 [SmartTranslation] Found automated mappings for ${data.teams || 0} teams`);

        // Store reference to automated data for quick access
        this.automatedMappingsCache = data;
        console.log(`✅ [SmartTranslation] Integrated automated mappings cache`);
      }

      // Also check for complete team mapping data
      const completeMapping = localStorage.getItem('completeTeamMapping');
      if (completeMapping) {
        const completeData = JSON.parse(completeMapping);
        console.log(`📋 [SmartTranslation] Found complete team mapping data with ${completeData.totalTeams || 0} teams`);

        // Merge with existing learned mappings
        if (completeData.allTeamsSortedByFrequency) {
          completeData.allTeamsSortedByFrequency.forEach((team: any) => {
            if (team.name && !this.learnedTeamMappings.has(team.name)) {
              // Create basic mapping structure for new teams
              this.learnedTeamMappings.set(team.name, {
                'zh': team.name,
                'zh-hk': team.name,
                'zh-tw': team.name,
                'es': team.name,
                'de': team.name,
                'it': team.name,
                'pt': team.name
              });
            }
          });

          this.saveLearnedMappings();
          console.log(`🎓 [SmartTranslation] Integrated ${completeData.allTeamsSortedByFrequency.length} teams from complete mapping`);
        }
      }
    } catch (error) {
      console.warn('Failed to integrate automated mappings:', error);
    }
  }

  // Method to bulk update translations from automated mappings
  bulkUpdateFromAutomatedMappings(automatedMappings: Record<string, any>): void {
    let updatedCount = 0;

    Object.entries(automatedMappings).forEach(([teamName, translations]) => {
      if (typeof translations === 'object' && translations !== null) {
        // Only update if we don't already have a high-quality manual translation
        if (!this.popularLeagueTeams[teamName]) {
          this.learnedTeamMappings.set(teamName, translations as TeamTranslation);
          updatedCount++;
        }
      }
    });

    if (updatedCount > 0) {
      this.saveLearnedMappings();
      console.log(`📦 [SmartTranslation] Bulk updated ${updatedCount} team translations`);
    }
  }

  // Translate league names using smart translation system
  translateLeagueName(leagueName: string, language: string = 'zh-hk'): string {
    if (!leagueName) return '';

    console.log(`🏆 [SmartTranslation] Translating league: "${leagueName}" to ${language}`);

    // Check cache first
    const cacheKey = `league_${leagueName.toLowerCase()}_${language}`;
    if (this.teamCache.has(cacheKey)) {
      const cached = this.teamCache.get(cacheKey)!;
      console.log(`💾 [SmartTranslation] League cache hit: "${leagueName}" -> "${cached}"`);
      return cached;
    }

    // League name translation patterns
    const leagueTranslations: Record<string, Record<string, string>> = {
      'Friendlies Clubs': {
        'zh': '俱乐部友谊赛', 'zh-hk': '球會友誼賽', 'zh-tw': '球會友誼賽',
        'es': 'Amistosos de Clubes', 'de': 'Vereinsfreundschaftsspiele', 'it': 'Amichevoli di Club', 'pt': 'Amigáveis de Clubes'
      },
      'UEFA Europa League': {
        'zh': 'UEFA欧洲联赛', 'zh-hk': 'UEFA歐洲聯賽', 'zh-tw': 'UEFA歐洲聯賽',
        'es': 'UEFA Liga Europa', 'de': 'UEFA Europa League', 'it': 'UEFA Europa League', 'pt': 'UEFA Liga Europa'
      },
      'UEFA Champions League': {
        'zh': 'UEFA欧洲冠军联赛', 'zh-hk': 'UEFA歐洲冠軍聯賽', 'zh-tw': 'UEFA歐洲冠軍聯賽',
        'es': 'UEFA Liga de Campeones', 'de': 'UEFA Champions League', 'it': 'UEFA Champions League', 'pt': 'UEFA Liga dos Campeões'
      },
      'UEFA Europa Conference League': {
        'zh': 'UEFA欧洲协会联赛', 'zh-hk': 'UEFA歐洲協會聯賽', 'zh-tw': 'UEFA歐洲協會聯賽',
        'es': 'UEFA Liga de la Conferencia', 'de': 'UEFA Conference League', 'it': 'UEFA Conference League', 'pt': 'UEFA Liga da Conferência'
      },
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
      },
      'Copa do Brasil': {
        'zh': '巴西杯', 'zh-hk': '巴西盃', 'zh-tw': '巴西盃',
        'es': 'Copa de Brasil', 'de': 'Copa do Brasil', 'it': 'Copa do Brasil', 'pt': 'Copa do Brasil'
      },
      'Primera A Colombia': {
        'zh': '哥伦比亚甲级联赛', 'zh-hk': '哥倫比亞甲級聯賽', 'zh-tw': '哥倫比亞甲級聯賽',
        'es': 'Primera A Colombia', 'de': 'Primera A Kolumbien', 'it': 'Primera A Colombia', 'pt': 'Primeira Divisão Colômbia'
      }
    };

    // Check for exact match first
    const exactTranslation = leagueTranslations[leagueName];
    if (exactTranslation && exactTranslation[language]) {
      const translation = exactTranslation[language];
      this.teamCache.set(cacheKey, translation);
      console.log(`✅ [SmartTranslation] League exact match: "${leagueName}" -> "${translation}"`);
      return translation;
    }

    // Pattern-based matching for partial league names
    const lowerLeagueName = leagueName.toLowerCase();
    for (const [pattern, translations] of Object.entries(leagueTranslations)) {
      if (lowerLeagueName.includes(pattern.toLowerCase()) || pattern.toLowerCase().includes(lowerLeagueName)) {
        const translation = translations[language] || pattern;
        this.teamCache.set(cacheKey, translation);
        console.log(`🔍 [SmartTranslation] League pattern match: "${leagueName}" -> "${translation}"`);
        return translation;
      }
    }

    // Cache and return original if no translation found
    this.teamCache.set(cacheKey, leagueName);
    console.log(`❌ [SmartTranslation] No league translation found for: "${leagueName}"`);
    return leagueName;
  }

  // Add translateCountryName method if missing
  translateCountryName(countryName: string, language: string = 'zh-hk'): string {
    if (!countryName) return '';

    console.log(`🌍 [SmartTranslation] Translating country: "${countryName}" to ${language}`);

    // Check cache first
    const cacheKey = `country_${countryName.toLowerCase()}_${language}`;
    if (this.teamCache.has(cacheKey)) {
      const cached = this.teamCache.get(cacheKey)!;
      console.log(`💾 [SmartTranslation] Country cache hit: "${countryName}" -> "${cached}"`);
      return cached;
    }

    // Country name translations
    const countryTranslations: Record<string, Record<string, string>> = {
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
      'Colombia': {
        'zh': '哥伦比亚', 'zh-hk': '哥倫比亞', 'zh-tw': '哥倫比亞',
        'es': 'Colombia', 'de': 'Kolumbien', 'it': 'Colombia', 'pt': 'Colômbia'
      },
      'Argentina': {
        'zh': '阿根廷', 'zh-hk': '阿根廷', 'zh-tw': '阿根廷',
        'es': 'Argentina', 'de': 'Argentinien', 'it': 'Argentina', 'pt': 'Argentina'
      },
      'World': {
        'zh': '世界', 'zh-hk': '世界', 'zh-tw': '世界',
        'es': 'Mundial', 'de': 'Welt', 'it': 'Mondo', 'pt': 'Mundo'
      }
    };

    // Check for exact match
    const exactTranslation = countryTranslations[countryName];
    if (exactTranslation && exactTranslation[language]) {
      const translation = exactTranslation[language];
      this.teamCache.set(cacheKey, translation);
      console.log(`✅ [SmartTranslation] Country exact match: "${countryName}" -> "${translation}"`);
      return translation;
    }

    // Cache and return original if no translation found
    this.teamCache.set(cacheKey, countryName);
    console.log(`❌ [SmartTranslation] No country translation found for: "${countryName}"`);
    return countryName;
  }

  // Smart translation with fallbacks and learning
  translateTeamName(teamName: string, language: string = 'zh', leagueInfo?: any): string {
    if (!teamName) return '';

    console.log(`🤖 [SmartTranslation] Translating "${teamName}" to ${language}`, {
      isLoading: this.isLoading,
      cacheSize: this.teamCache.size,
      leaguesLoaded: Object.keys(this.leagueTeamsCache).length,
      totalCachedTeams: Object.values(this.leagueTeamsCache).reduce((sum, teams) => sum + teams.length, 0)
    });

    // Check cache first, but skip if it contains corrupted data
    const cacheKey = `${teamName.toLowerCase()}_${language}`;
    if (this.teamCache.has(cacheKey)) {
      const cached = this.teamCache.get(cacheKey)!;
      // Skip cache if it looks like corrupted phonetic translation
      if (!this.isCorruptedTranslation(cached, teamName)) {
        console.log(`💾 [SmartTranslation] Cache hit: "${teamName}" -> "${cached}"`);
        return cached;
      } else {
        console.log(`🧹 [SmartTranslation] Clearing corrupted cache for: "${teamName}"`);
        this.teamCache.delete(cacheKey);
      }
    }

    // Try popular teams mapping first (highest priority) - this contains proper translations
    const popularTranslation = this.getPopularTeamTranslation(teamName, language);
    if (popularTranslation && popularTranslation !== teamName && !this.isCorruptedTranslation(popularTranslation, teamName)) {
      console.log(`⭐ [SmartTranslation] Popular team translation: "${teamName}" -> "${popularTranslation}"`);
      this.teamCache.set(cacheKey, popularTranslation);
      return popularTranslation;
    }

    // Try exact match from manual translations
    const manualTranslation = this.getManualTranslation(teamName, language);
    if (manualTranslation && manualTranslation !== teamName && !this.isCorruptedTranslation(manualTranslation, teamName)) {
      console.log(`📖 [SmartTranslation] Manual translation: "${teamName}" -> "${manualTranslation}"`);
      this.teamCache.set(cacheKey, manualTranslation);
      return manualTranslation;
    }

    // Enhanced fallback for common team patterns
    const enhancedFallback = this.getEnhancedFallback(teamName, language);
    if (enhancedFallback && enhancedFallback !== teamName && !this.isCorruptedTranslation(enhancedFallback, teamName)) {
      console.log(`🔍 [SmartTranslation] Enhanced fallback: "${teamName}" -> "${enhancedFallback}"`);
      this.teamCache.set(cacheKey, enhancedFallback);
      return enhancedFallback;
    }

    // Cache and return original name if no valid translation available
    console.log(`❌ [SmartTranslation] No translation available for: "${teamName}"`);
    this.teamCache.set(cacheKey, teamName);
    return teamName;
  }

  // Helper to detect corrupted translations (phonetic gibberish)
  private isCorruptedTranslation(translation: string, original: string): boolean {
    // Skip validation for non-Chinese languages
    if (!translation.match(/[\u4e00-\u9fff]/)) {
      return false;
    }

    // If translation is much longer than reasonable for a team name, likely corrupted
    if (translation.length > original.length * 2 && translation.length > 8) {
      return true;
    }

    // Check for known corrupted patterns
    const corruptedPatterns = [
      /^[阿卡埃纳维拉马塔巴]{4,}$/, // Repeated phonetic characters
      /卡奥拉奥马巴/, // Known corrupted translation
      /阿拉加埃纳塔/, // Known corrupted translation
      /维埃纳埃扎乌/ // Known corrupted translation
    ];

    return corruptedPatterns.some(pattern => pattern.test(translation));
  }

  private getManualTranslation(teamName: string, language: string): string | null {
    // Comprehensive manual translations database
    const manualTranslations: Record<string, Record<string, string>> = {
      // Premier League (England)
      'Manchester United': {
        'zh': '曼聯', 'zh-hk': '曼聯', 'zh-tw': '曼聯',
        'es': 'Manchester United', 'de': 'Manchester United', 'it': 'Manchester United', 'pt': 'Manchester United'
      },
      'Manchester City': {
        'zh': '曼城', 'zh-hk': '曼城', 'zh-tw': '曼城',
        'es': 'Manchester City', 'de': 'Manchester City', 'it': 'Manchester City', 'pt': 'Manchester City'
      },
      'Liverpool': {
        'zh': '利物浦', 'zh-hk': '利物浦', 'zh-tw': '利物浦',
        'es': 'Liverpool', 'de': 'Liverpool', 'it': 'Liverpool', 'pt': 'Liverpool'
      },
      'Arsenal': {
        'zh': '阿森纳', 'zh-hk': '阿仙奴', 'zh-tw': '阿森納',
        'es': 'Arsenal', 'de': 'Arsenal', 'it': 'Arsenal', 'pt': 'Arsenal'
      },
      'Chelsea': {
        'zh': '切尔西', 'zh-hk': '車路士', 'zh-tw': '切爾西',
        'es': 'Chelsea', 'de': 'Chelsea', 'it': 'Chelsea', 'pt': 'Chelsea'
      },
      'Tottenham': {
        'zh': '热刺', 'zh-hk': '熱刺', 'zh-tw': '熱刺',
        'es': 'Tottenham', 'de': 'Tottenham', 'it': 'Tottenham', 'pt': 'Tottenham'
      },
      'Newcastle': {
        'zh': '纽卡斯尔', 'zh-hk': '紐卡素', 'zh-tw': '紐卡斯爾',
        'es': 'Newcastle', 'de': 'Newcastle', 'it': 'Newcastle', 'pt': 'Newcastle'
      }
    };

    const normalizedName = teamName.trim();
    if (manualTranslations[normalizedName]) {
      return manualTranslations[normalizedName][language] || null;
    }

    return null;
  }

  // Clear cache when needed
  clearCache(): void {
    this.teamCache.clear();
    console.log('🔄 [SmartTranslation] Cache cleared');
  }

  // Fix corrupted cache entries
  fixCorruptedCache(): void {
    try {
      const corruptedKeys = [
        'smart_translation_AEL_zh-hk',
        'smart_translation_Deportivo Cali_zh-hk',
        'smart_translation_Alianza Petrolera_zh-hk',
        'smart_translation_Masr_zh-hk'
      ];

      corruptedKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('🔧 [SmartTranslation] Fixed corrupted cache entries');
    } catch (error) {
      console.warn('Failed to fix corrupted cache:', error);
    }
  }




  // Learn new team mapping dynamically
  private learnNewTeam(teamName: string, leagueInfo?: any): void {
      if (!teamName || !leagueInfo) {
          return;
      }

      const language = 'zh-hk'; // Default to zh-hk for learning

      try {
          const teamKey = teamName.toLowerCase().trim();

          // Check if we already have learned mappings for this team
          if (!this.learnedTeamMappings.has(teamKey)) {
              this.learnedTeamMappings.set(teamKey, {
                  [teamName]: {
                      'zh': teamName, 'zh-hk': teamName, 'zh-tw': teamName,
                      'es': teamName, 'de': teamName, 'it': teamName, 'pt': teamName
                  }
              });
          }

          // Attempt to get a translation from league info if available and different from original name
          let translatedName = teamName;
          if (leagueInfo.teams && leagueInfo.teams.home?.name === teamName && leagueInfo.teams.home?.translated_name) {
              translatedName = leagueInfo.teams.home.translated_name;
          } else if (leagueInfo.teams && leagueInfo.teams.away?.name === teamName && leagueInfo.teams.away?.translated_name) {
              translatedName = leagueInfo.teams.away.translated_name;
          }

          // Update the specific language translation if a different name was found
          if (translatedName !== teamName) {
              const existingMapping = this.learnedTeamMappings.get(teamKey);
              if (existingMapping && existingMapping[teamName]) {
                  existingMapping[teamName][language as keyof typeof existingMapping[typeof teamName]] = translatedName;

                  // Save to localStorage for persistence
                  this.saveLearnedMappings();

                  console.log(`🎓 [SmartTranslation] Learned new mapping from league info: "${teamName}" -> "${translatedName}" (${language})`);
              }
          } else {
             // If no translated name found in league info, but the team is new, still add it to learned mappings with original name
             this.saveLearnedMappings();
          }

      } catch (error) {
          console.warn('⚠️ [SmartTranslation] Failed to learn new team mapping from league info:', error);
      }
  }
}

export const smartTeamTranslation = new SmartTeamTranslation();