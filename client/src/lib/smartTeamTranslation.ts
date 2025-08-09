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
  private isLoading = false;

  constructor() {
    // Clear cache on initialization to ensure updated translations are used
    this.clearCache();
    this.fixCorruptedCache();
    this.fixSpecificCorruptedEntries(); // Added to fix specific known corrupted entries
    console.log('🔄 [SmartTranslation] Initialized with cache cleared for fresh translations');
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

    // Liga MX Teams
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

    // Spanish Spanish Segunda División and lower teams
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

    // Teams from user's screenshot that need proper translations
    'Grosseto': {
      'zh': '格罗塞托', 'zh-hk': '格羅塞托', 'zh-tw': '格羅塞托',
      'es': 'Grosseto', 'de': 'Grosseto', 'it': 'Grosseto', 'pt': 'Grosseto'
    },
    'Nublense': {
      'zh': '纽布伦斯', 'zh-hk': '紐布倫斯', 'zh-tw': '紐布倫斯',
      'es': 'Nublense', 'de': 'Nublense', 'it': 'Nublense', 'pt': 'Nublense'
    },
    'Lumezzane': {
      'zh': '卢梅扎内', 'zh-hk': '盧梅扎內', 'zh-tw': '盧梅扎內',
      'es': 'Lumezzane', 'de': 'Lumezzane', 'it': 'Lumezzane', 'pt': 'Lumezzane'
    },
    'Mantova': {
      'zh': '曼托瓦', 'zh-hk': '曼托瓦', 'zh-tw': '曼托瓦',
      'es': 'Mantova', 'de': 'Mantova', 'it': 'Mantova', 'pt': 'Mantova'
    },
    'Rennes': {
      'zh': '雷恩', 'zh-hk': '雷恩', 'zh-tw': '雷恩',
      'es': 'Rennes', 'de': 'Rennes', 'it': 'Rennes', 'pt': 'Rennes'
    },
    'Genoa': {
      'zh': '热那亚', 'zh-hk': '熱那亞', 'zh-tw': '熱那亞',
      'es': 'Genoa', 'de': 'Genua', 'it': 'Genoa', 'pt': 'Génova'
    },
    'Šibenik': {
      'zh': '希贝尼克', 'zh-hk': '希貝尼克', 'zh-tw': '希貝尼克',
      'es': 'Šibenik', 'de': 'Šibenik', 'it': 'Šibenik', 'pt': 'Šibenik'
    },
    'Sibenik': {
      'zh': '希贝尼克', 'zh-hk': '希貝尼克', 'zh-tw': '希貝尼克',
      'es': 'Šibenik', 'de': 'Šibenik', 'it': 'Šibenik', 'pt': 'Šibenik'
    },
    'Vodice': {
      'zh': '沃迪采', 'zh-hk': '沃迪采', 'zh-tw': '沃迪采',
      'es': 'Vodice', 'de': 'Vodice', 'it': 'Vodice', 'pt': 'Vodice'
    },
    'Ethnikos Achna': {
      'zh': '阿赫纳民族', 'zh-hk': '阿赫納民族', 'zh-tw': '阿赫納民族',
      'es': 'Ethnikos Achna', 'de': 'Ethnikos Achna', 'it': 'Ethnikos Achna', 'pt': 'Ethnikos Achna'
    },
    'ASIL Lysi': {
      'zh': 'ASIL利西', 'zh-hk': 'ASIL利西', 'zh-tw': 'ASIL利西',
      'es': 'ASIL Lysi', 'de': 'ASIL Lysi', 'it': 'ASIL Lysi', 'pt': 'ASIL Lysi'
    },
    'Osogovo': {
      'zh': '奥索戈沃', 'zh-hk': '奧索戈沃', 'zh-tw': '奧索戈沃',
      'es': 'Osogovo', 'de': 'Osogovo', 'it': 'Osogovo', 'pt': 'Osogovo'
    },
    'Detonit Plachkovica': {
      'zh': '德托尼特普拉赫科维察', 'zh-hk': '德托尼特普拉赫科維察', 'zh-tw': '德托尼特普拉赫科維察',
      'es': 'Detonit Plachkovica', 'de': 'Detonit Plachkovica', 'it': 'Detonit Plachkovica', 'pt': 'Detonit Plachkovica'
    },
    'Sloga Vinica': {
      'zh': '维尼察斯洛加', 'zh-hk': '維尼察斯洛加', 'zh-tw': '維尼察斯洛加',
      'es': 'Sloga Vinica', 'de': 'Sloga Vinica', 'it': 'Sloga Vinica', 'pt': 'Sloga Vinica'
    },
    'Pobeda': {
      'zh': '波贝达', 'zh-hk': '波貝達', 'zh-tw': '波貝達',
      'es': 'Pobeda', 'de': 'Pobeda', 'it': 'Pobeda', 'pt': 'Pobeda'
    },
    'Südtirol': {
      'zh': '南蒂罗尔', 'zh-hk': '南蒂羅爾', 'zh-tw': '南蒂羅爾',
      'es': 'Südtirol', 'de': 'Südtirol', 'it': 'Südtirol', 'pt': 'Südtirol'
    },

    // Additional teams for MyNewLeague2
    'Omonia Nicosia': {
      'zh': '尼科西亚奥莫尼亚', 'zh-hk': '尼科西亞奧莫尼亞', 'zh-tw': '尼科西亞奧莫尼亞',
      'es': 'Omonia Nicosia', 'de': 'Omonia Nikosia', 'it': 'Omonia Nicosia', 'pt': 'Omonia Nicosia'
    },
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
    // Special handling for teams that might appear with different naming patterns
    "L'Entregu": {
      'zh': '恩特雷古', 'zh-hk': '恩特雷古', 'zh-tw': '恩特雷古',
      'es': "L'Entregu", 'de': "L'Entregu", 'it': "L'Entregu", 'pt': "L'Entregu"
    },

    // Croatian teams from the image
    'Sibeník': {
      'zh': '希贝尼克', 'zh-hk': '希貝尼克', 'zh-tw': '希貝尼克',
      'es': 'Sibeník', 'de': 'Sibeník', 'it': 'Sibeník', 'pt': 'Sibeník'
    },
    'Vodice': {
      'zh': '沃迪采', 'zh-hk': '沃迪采', 'zh-tw': '沃迪采',
      'es': 'Vodice', 'de': 'Vodice', 'it': 'Vodice', 'pt': 'Vodice'
    },

    // Dutch teams from the image
    'Barendrecht': {
      'zh': '巴伦德雷赫特', 'zh-hk': '巴倫德雷赫特', 'zh-tw': '巴倫德雷赫特',
      'es': 'Barendrecht', 'de': 'Barendrecht', 'it': 'Barendrecht', 'pt': 'Barendrecht'
    },
    'ASWH': {
      'zh': 'ASWH', 'zh-hk': 'ASWH', 'zh-tw': 'ASWH',
      'es': 'ASWH', 'de': 'ASWH', 'it': 'ASWH', 'pt': 'ASWH'
    },
    'De Treffers': {
      'zh': '德特雷弗斯', 'zh-hk': '德特雷弗斯', 'zh-tw': '德特雷弗斯',
      'es': 'De Treffers', 'de': 'De Treffers', 'it': 'De Treffers', 'pt': 'De Treffers'
    },
    'URK': {
      'zh': 'URK', 'zh-hk': 'URK', 'zh-tw': 'URK',
      'es': 'URK', 'de': 'URK', 'it': 'URK', 'pt': 'URK'
    },
    'GVVV Veenendaal': {
      'zh': 'GVVV费嫩达尔', 'zh-hk': 'GVVV費嫩達爾', 'zh-tw': 'GVVV費嫩達爾',
      'es': 'GVVV Veenendaal', 'de': 'GVVV Veenendaal', 'it': 'GVVV Veenendaal', 'pt': 'GVVV Veenendaal'
    },
    'Merelbeke': {
      'zh': '梅雷尔贝克', 'zh-hk': '梅雷爾貝克', 'zh-tw': '梅雷爾貝克',
      'es': 'Merelbeke', 'de': 'Merelbeke', 'it': 'Merelbeke', 'pt': 'Merelbeke'
    },
    'Hoek': {
      'zh': '霍克', 'zh-hk': '霍克', 'zh-tw': '霍克',
      'es': 'Hoek', 'de': 'Hoek', 'it': 'Hoek', 'pt': 'Hoek'
    },
    'Noordwijk': {
      'zh': '诺德韦克', 'zh-hk': '諾德韋克', 'zh-tw': '諾德韋克',
      'es': 'Noordwijk', 'de': 'Noordwijk', 'it': 'Noordwijk', 'pt': 'Noordwijk'
    },
    'Rijnvogels': {
      'zh': '莱茵鸟', 'zh-hk': '萊茵鳥', 'zh-tw': '萊茵鳥',
      'es': 'Rijnvogels', 'de': 'Rijnvogels', 'it': 'Rijnvogels', 'pt': 'Rijnvogels'
    },
    'Poortugaal': {
      'zh': '波尔图加尔', 'zh-hk': '波爾圖加爾', 'zh-tw': '波爾圖加爾',
      'es': 'Poortugaal', 'de': 'Poortugaal', 'it': 'Poortugaal', 'pt': 'Poortugaal'
    },
    'Excelsior Maassluis': {
      'zh': '马斯路易斯精英', 'zh-hk': '馬斯路易斯精英', 'zh-tw': '馬斯路易斯精英',
      'es': 'Excelsior Maassluis', 'de': 'Excelsior Maassluis', 'it': 'Excelsior Maassluis', 'pt': 'Excelsior Maassluis'
    },
    'Dovo': {
      'zh': '多沃', 'zh-hk': '多沃', 'zh-tw': '多沃',
      'es': 'Dovo', 'de': 'Dovo', 'it': 'Dovo', 'pt': 'Dovo'
    },
    'Hercules': {
      'zh': '海格力斯', 'zh-hk': '海格力斯', 'zh-tw': '海格力斯',
      'es': 'Hércules', 'de': 'Hercules', 'it': 'Hercules', 'pt': 'Hércules'
    },
    'Spakenburg': {
      'zh': '斯帕肯堡', 'zh-hk': '斯帕肯堡', 'zh-tw': '斯帕肯堡',
      'es': 'Spakenburg', 'de': 'Spakenburg', 'it': 'Spakenburg', 'pt': 'Spakenburg'
    },
    'AFC Amsterdam': {
      'zh': '阿姆斯特丹AFC', 'zh-hk': '阿姆斯特丹AFC', 'zh-tw': '阿姆斯特丹AFC',
      'es': 'AFC Amsterdam', 'de': 'AFC Amsterdam', 'it': 'AFC Amsterdam', 'pt': 'AFC Amsterdam'
    },
    'Tubize': {
      'zh': '蒂比兹', 'zh-hk': '蒂比茲', 'zh-tw': '蒂比茲',
      'es': 'Tubize', 'de': 'Tubize', 'it': 'Tubize', 'pt': 'Tubize'
    },
    'Gemert': {
      'zh': '格默特', 'zh-hk': '格默特', 'zh-tw': '格默特',
      'es': 'Gemert', 'de': 'Gemert', 'it': 'Gemert', 'pt': 'Gemert'
    },
    'Wittenhorst': {
      'zh': '威滕霍斯特', 'zh-hk': '威滕霍斯特', 'zh-tw': '威滕霍斯特',
      'es': 'Wittenhorst', 'de': 'Wittenhorst', 'it': 'Wittenhorst', 'pt': 'Wittenhorst'
    },

    // Belgian teams
    'AZ Picerno': {
      'zh': 'AZ皮切尔诺', 'zh-hk': 'AZ皮切爾諾', 'zh-tw': 'AZ皮切爾諾',
      'es': 'AZ Picerno', 'de': 'AZ Picerno', 'it': 'AZ Picerno', 'pt': 'AZ Picerno'
    },

    // Macedonian teams
   
    
   
    'Pobeda Valandovo': {
      'zh': '瓦兰多沃胜利', 'zh-hk': '瓦蘭多沃勝利', 'zh-tw': '瓦蘭多沃勝利',
      'es': 'Pobeda Valandovo', 'de': 'Pobeda Valandovo', 'it': 'Pobeda Valandovo', 'pt': 'Pobeda Valandovo'
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
    'Sabah FK': {
      'zh': '沙巴足协', 'zh-hk': '沙巴足協', 'zh-tw': '沙巴足協',
      'es': 'Sabah FK', 'de': 'Sabah FK', 'it': 'Sabah FK', 'pt': 'Sabah FK'
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
    }
  };

  // Get direct translation from popular teams mapping
  private getPopularTeamTranslation(teamName: string, language: string): string | null {
    if (!teamName || !language) return null;

    const normalizedTeamName = teamName.trim();

    // Direct match (case-insensitive)
    const directMatch = Object.keys(this.popularLeagueTeams).find(
      key => key.toLowerCase() === normalizedTeamName.toLowerCase()
    );
    if (directMatch) {
      const translation = this.popularLeagueTeams[directMatch][language as keyof TeamTranslation[string]];
      if (translation) return translation;
    }

    // Try without common suffixes/prefixes (enhanced patterns)
    const cleanName = normalizedTeamName
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
    const teamNameLower = normalizedTeamName.toLowerCase();

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
  learnTeamsFromFixtures(fixtures: any[], leagueId?: number): void {
    if (!fixtures?.length) return;

    let newTeamsLearned = 0;
    const learnedTeams = new Set<string>();
    const teamsByLeague = new Map<number, Set<string>>();

    // Group teams by league for better context learning
    fixtures.forEach(fixture => {
      if (fixture.teams?.home?.name && fixture.teams?.away?.name && fixture.league?.id) {
        const leagueId = fixture.league.id;
        if (!teamsByLeague.has(leagueId)) {
          teamsByLeague.set(leagueId, new Set());
        }

        const homeTeam = fixture.teams.home.name.trim();
        const awayTeam = fixture.teams.away.name.trim();

        teamsByLeague.get(leagueId)!.add(homeTeam);
        teamsByLeague.get(leagueId)!.add(awayTeam);
      }
    });

    // Learn teams with league context
    teamsByLeague.forEach((teams, leagueId) => {
      const leagueInfo = fixtures.find(f => f.league?.id === leagueId)?.league;

      teams.forEach(teamName => {
        if (teamName && !learnedTeams.has(teamName.toLowerCase())) {
          if (this.learnNewTeam(teamName, leagueInfo)) {
            newTeamsLearned++;
            learnedTeams.add(teamName.toLowerCase());
          }
        }
      });
    });

    if (newTeamsLearned > 0) {
      console.log(`🎓 [SmartTranslation] Auto-learned ${newTeamsLearned} new teams from ${fixtures.length} fixtures across ${teamsByLeague.size} leagues`);
    }

    // Auto-fix known incorrect mappings after learning
    this.validateAndFixIncorrectMappings();
  }

  // Enhanced team learning with better pattern detection
  private learnNewTeam(teamName: string, leagueInfo?: any): boolean {
    const normalizedName = teamName.trim();

    // Check if already exists in our mappings
    if (this.getPopularTeamTranslation(normalizedName, 'zh')) {
      return false; // Already exists
    }

    // Enhanced skip learning logic
    if (this.shouldSkipLearning(normalizedName)) {
      return false;
    }

    // Create intelligent translation entry
    const smartTranslation = this.createSmartTranslation(normalizedName, leagueInfo);
    this.popularLeagueTeams[normalizedName] = smartTranslation;

    console.log(`📚 [SmartTranslation] Learned new team: "${normalizedName}" (${smartTranslation.zh}) in league: ${leagueInfo?.name || 'Unknown'}`);
    return true;
  }

  // Enhanced skip learning logic
  private shouldSkipLearning(teamName: string): boolean {
    const skipPatterns = [
      /\b(ii|2|b|reserves?|youth|u\d+|junior|academy|development|training)\b/i,
      /^.{1,2}$/, // Too short (except for teams like "FC")
      /^\d+$/, // Only numbers
      /^[^a-zA-Z]*$/, // No letters at all
      /\b(test|demo|sample|example)\b/i // Test data
    ];

    // Allow certain short but valid team names
    const allowedShortNames = ['FC', 'AC', 'AS', 'CF', 'NK', 'FK', 'SC', 'CD', 'SD', 'AD'];
    if (teamName.length <= 3 && allowedShortNames.includes(teamName.toUpperCase())) {
      return false;
    }

    return skipPatterns.some(pattern => pattern.test(teamName));
  }

  // Create intelligent translation for a new team
  private createSmartTranslation(teamName: string, leagueInfo?: any): TeamTranslation[string] {
    let chineseTranslation = teamName; // Default fallback
    let spanishTranslation = teamName;
    let germanTranslation = teamName;
    let italianTranslation = teamName;
    let portugueseTranslation = teamName;

    // Apply intelligent translation rules based on country/league
    if (leagueInfo?.country) {
      chineseTranslation = this.generateSmartChineseTranslation(teamName, leagueInfo.country);

      // Generate other language variations if needed
      if (leagueInfo.country === 'Spain' && teamName.includes('Athletic')) {
        spanishTranslation = teamName.replace('Athletic', 'Athletic Club');
      }

      if (leagueInfo.country === 'Germany' && teamName.includes('FC')) {
        germanTranslation = teamName; // Keep German names as-is typically
      }
    }

    return {
      'zh': chineseTranslation,
      'zh-hk': chineseTranslation,
      'zh-tw': chineseTranslation,
      'es': spanishTranslation,
      'de': germanTranslation,
      'it': italianTranslation,
      'pt': portugueseTranslation
    };
  }

  // Enhanced intelligent Chinese translations with comprehensive patterns
  private generateSmartChineseTranslation(teamName: string, country: string): string {
    // Comprehensive translation patterns for different countries
    const translationRules: Record<string, Record<string, string>> = {
      'England': {
        'United': '联', 'City': '城', 'Town': '镇', 'FC': '足球俱乐部',
        'Athletic': '竞技', 'Rovers': '流浪者', 'Albion': '阿尔比恩',
        'Villa': '维拉', 'County': '郡', 'Wednesday': '周三', 'Forest': '森林'
      },
      'Spain': {
        'Real': '皇家', 'Club': '俱乐部', 'Atletico': '竞技', 'Deportivo': '体育',
        'CD': '体育俱乐部', 'CF': '足球俱乐部', 'SD': '体育会', 'AD': '体育会'
      },
      'Germany': {
        'Bayern': '拜仁', 'Borussia': '多特', 'Eintracht': '法兰克福',
        'Werder': '云达', 'VfL': '足球俱乐部', 'VfB': '足球运动俱乐部',
        'FC': '足球俱乐部', 'TSV': '体育俱乐部', 'SC': '体育俱乐部'
      },
      'Italy': {
        'Juventus': '尤文图斯', 'Inter': '国际', 'Milan': '米兰', 'Roma': '罗马',
        'AC': '足球俱乐部', 'FC': '足球俱乐部', 'Calcio': '足球'
      },
      'Netherlands': {
        'FC': '足球俱乐部', 'PSV': 'PSV', 'Ajax': '阿贾克斯',
        'VVV': 'VVV', 'AZ': 'AZ', 'Go Ahead': '前进',
        'De Graafschap': '德拉夫斯哈普', 'Vitesse': '维特斯'
      },
      'Belgium': {
        'FC': '足球俱乐部', 'KRC': '皇家俱乐部', 'RSC': '皇家体育俱乐部',
        'Standard': '标准', 'Club': '俱乐部', 'Royal': '皇家'
      },
      'Croatia': {
        'NK': '足球俱乐部', 'HNK': '克罗地亚足球俱乐部', 'RNK': '地区足球俱乐部',
        'Dinamo': '迪纳摩', 'Hajduk': '哈伊杜克', 'Rijeka': '里耶卡'
      },
      'France': {
        'FC': '足球俱乐部', 'AS': '体育协会', 'RC': '赛车俱乐部',
        'Olympique': '奥林匹克', 'Saint': '圣', 'Stade': '体育场'
      },
      'Portugal': {
        'FC': '足球俱乐部', 'SC': '体育俱乐部', 'CD': '体育俱乐部',
        'Sporting': '体育', 'Academica': '学院', 'Boavista': '博阿维斯塔'
      }
    };

    // City-based translations for common European cities
    const cityTranslations: Record<string, string> = {
      // Dutch cities
      'Amsterdam': '阿姆斯特丹', 'Rotterdam': '鹿特丹', 'Utrecht': '乌得勒支',
      'Eindhoven': '埃因霍温', 'Tilburg': '蒂尔堡', 'Groningen': '格罗宁根',
      'Breda': '布雷达', 'Nijmegen': '奈梅亨', 'Haarlem': '哈勒姆',
      'Arnhem': '阿纳姆', 'Zwolle': '兹沃勒', 'Enschede': '恩斯赫德',

      // Belgian cities
      'Antwerp': '安特卫普', 'Gent': '根特', 'Charleroi': '沙勒罗瓦',
      'Liege': '列日', 'Bruges': '布鲁日', 'Namur': '那慕尔',

      // Croatian cities
      'Zagreb': '萨格勒布', 'Split': '斯普利特', 'Rijeka': '里耶卡',
      'Osijek': '奥西耶克', 'Zadar': '扎达尔', 'Pula': '普拉',

      // German cities (additional)
      'Mönchengladbach': '门兴格拉德巴赫', 'Gelsenkirchen': '盖尔森基兴',
      'Kaiserslautern': '凯泽斯劳滕', 'Karlsruhe': '卡尔斯鲁厄'
    };

    let translation = teamName;

    // Apply country-specific rules
    const rules = translationRules[country];
    if (rules) {
      Object.entries(rules).forEach(([original, chinese]) => {
        const regex = new RegExp(`\\b${original}\\b`, 'gi');
        translation = translation.replace(regex, chinese);
      });
    }

    // Apply city-based translations
    Object.entries(cityTranslations).forEach(([city, chinese]) => {
      if (translation.toLowerCase().includes(city.toLowerCase())) {
        const regex = new RegExp(`\\b${city}\\b`, 'gi');
        translation = translation.replace(regex, chinese);
      }
    });

    // Smart pattern recognition for unknown teams
    if (translation === teamName) {
      translation = this.applySmartPatterns(teamName, country);
    }

    return translation;
  }

  // Apply intelligent patterns for unknown teams
  private applySmartPatterns(teamName: string, country: string): string {
    // If it's a very short name (likely acronym), keep original
    if (teamName.length <= 3) {
      return teamName;
    }

    // Pattern: City + suffix (like "Sibeník", "Vodice")
    if (country === 'Croatia' && teamName.length >= 4 && teamName.length <= 12) {
      // Simple transliteration for Croatian cities/teams
      const croatianMap: Record<string, string> = {
        'ć': '奇', 'č': '奇', 'š': '什', 'ž': '日', 'đ': '德',
        'Sibeník': '希贝尼克', 'Vodice': '沃迪采', 'Osijek': '奥西耶克',
        'Varaždin': '瓦拉日丁', 'Karlovac': '卡尔洛瓦茨'
      };

      for (const [croatian, chinese] of Object.entries(croatianMap)) {
        if (teamName.includes(croatian)) {
          return teamName.replace(croatian, chinese);
        }
      }
    }

    // Pattern: Dutch teams (often end with specific suffixes)
    if (country === 'Netherlands') {
      const dutchCities: Record<string, string> = {
        'Barendrecht': '巴伦德雷赫特', 'Merelbeke': '梅雷尔贝克',
        'Noordwijk': '诺德韦克', 'Spakenburg': '斯帕肯堡',
        'Katwijk': '卡特韦克', 'Poortugaal': '波尔图加尔'
      };

      if (dutchCities[teamName]) {
        return dutchCities[teamName];
      }
    }

    // Pattern: Abbreviated teams (URK, ASWH, etc.)
    if (teamName.length <= 5 && teamName.match(/^[A-Z]+$/)) {
      return teamName; // Keep acronyms as is
    }

    // Fallback: Simple phonetic approximation for common European sounds
    let phonetic = teamName;
    const phoneticMap: Record<string, string> = {
      'ijk': '克', 'oek': '克', 'burg': '堡', 'drecht': '德雷赫特',
      'beke': '贝克', 'wijk': '韦克', 'stad': '斯塔德', 'hoven': '霍芬'
    };

    Object.entries(phoneticMap).forEach(([pattern, chinese]) => {
      if (phonetic.toLowerCase().includes(pattern)) {
        phonetic = phonetic.replace(new RegExp(pattern, 'gi'), chinese);
      }
    });

    return phonetic !== teamName ? phonetic : teamName;
  }

  // Smart translation with fallbacks and learning
  translateTeamName(teamName: string, language: string = 'zh', leagueInfo?: any): string {
    if (!teamName || typeof teamName !== 'string') {
      console.warn('🚨 [SmartTranslation] Invalid team name provided:', teamName);
      return teamName || '';
    }

    // Simple check for existing translations in target languages
    if (this.isAlreadyTranslated(teamName, language)) {
      return teamName;
    }

    // Check cache first - but verify it's not corrupted
    const cacheKey = `smart_translation_${teamName}_${language}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached && cached !== teamName && cached !== 'undefined' && cached !== 'null' && cached.length > 1) {
      // Additional validation: make sure cached translation makes sense
      if (!this.isCachedTranslationValid(teamName, cached, language)) {
        localStorage.removeItem(cacheKey);
        console.log(`🧹 [SmartTranslation] Removed invalid cached translation: "${teamName}" -> "${cached}"`);
      } else {
        console.log(`💾 [SmartTranslation] Cache hit: "${teamName}" -> "${cached}"`);
        return cached;
      }
    }

    // Search in popular league teams with exact match first
    const exactMatch = this.popularLeagueTeams[teamName];
    if (exactMatch && exactMatch[language as keyof typeof exactMatch]) {
      const translation = exactMatch[language as keyof typeof exactMatch];
      // Cache the result
      try {
        localStorage.setItem(cacheKey, translation);
      } catch (error) {
        console.warn('Failed to cache translation:', error);
      }
      console.log(`🎯 [SmartTranslation] Exact match: "${teamName}" -> "${translation}"`);
      return translation;
    }

    // Try alternative name patterns
    const alternativeMatch = this.findAlternativeNameMatch(teamName, language);
    if (alternativeMatch) {
      try {
        localStorage.setItem(cacheKey, alternativeMatch);
      } catch (error) {
        console.warn('Failed to cache alternative translation:', error);
      }
      console.log(`🔄 [SmartTranslation] Alternative match: "${teamName}" -> "${alternativeMatch}"`);
      return alternativeMatch;
    }

    // Try fuzzy matching for slight variations
    const fuzzyMatch = this.findFuzzyMatch(teamName, language);
    if (fuzzyMatch) {
      try {
        localStorage.setItem(cacheKey, fuzzyMatch);
      } catch (error) {
        console.warn('Failed to cache fuzzy translation:', error);
      }
      console.log(`🔍 [SmartTranslation] Fuzzy match: "${teamName}" -> "${fuzzyMatch}"`);
      return fuzzyMatch;
    }

    console.log(`❌ [SmartTranslation] No translation found for: "${teamName}" in ${language}`);
    return teamName;
  }

  private isAlreadyTranslated(teamName: string, language: string): boolean {
    // Basic check if the team name looks like it's already translated
    // This is a heuristic and might need refinement
    if (language === 'zh' || language === 'zh-hk' || language === 'zh-tw') {
      // Check for common Chinese characters or known translations
      if (/[一-龠]/.test(teamName)) return true;
      if (Object.values(this.popularLeagueTeams).some(t => 
        Object.values(t).includes(teamName)
      )) return true;
    }
    return false;
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
    this.leagueTeamsCache = {};
    console.log('🧹 [SmartTranslation] Cache cleared');
  }

  // Auto-fix incorrect mappings and learn correct ones
  private validateAndFixIncorrectMappings(): void {
    const correctMappings = [
      { original: 'Deportivo Cali', correct: '卡利体育', wrongTranslation: '帕斯托體育' },
      { original: 'AEL', correct: 'AEL利马索尔', wrongTranslation: 'Israel' },
      { original: 'Masr', correct: '埃及', wrongTranslation: 'AL Masry' },
      { original: 'Alianza Petrolera', correct: '石油联盟', wrongTranslation: 'Alianza Lima' }
    ];

    correctMappings.forEach(({ original, correct, wrongTranslation }) => {
      // Clear wrong cache entries
      ['zh', 'zh-hk', 'zh-tw'].forEach(lang => {
        const cacheKey = `${original.toLowerCase()}_${lang}`;
        if (this.teamCache.get(cacheKey) === wrongTranslation) {
          this.teamCache.delete(cacheKey);
          console.log(`🔧 [SmartTranslation] Fixed incorrect mapping: ${original} -> ${wrongTranslation}`);
        }
      });

      // Add correct mapping to popular teams
      if (!this.popularLeagueTeams[original]) {
        this.popularLeagueTeams[original] = {
          'zh': correct,
          'zh-hk': correct,
          'zh-tw': correct,
          'es': original,
          'de': original,
          'it': original,
          'pt': original
        };
        console.log(`✅ [SmartTranslation] Auto-learned correct translation: ${original} -> ${correct}`);
      }
    });
  }

  // Enhanced fallback for common team patterns
  private getEnhancedFallback(teamName: string, language: string): string | null {
    if (language !== 'zh' && language !== 'zh-hk' && language !== 'zh-tw') {
      return null;
    }

    // Common English team patterns
    const englishTeamPatterns: Record<string, string> = {
      'Leeds': '利兹联',
      'Brentford': '布伦特福德',
      'Sheffield': '谢菲尔德',
      'Brighton': '布莱顿',
      'Burnley': '伯恩利',
      'Norwich': '诺维奇',
      'Cardiff': '卡迪夫',
      'Swansea': '斯旺西'
    };

    // Italian team patterns
    const italianTeamPatterns: Record<string, string> = {
      'Trento': '特伦托',
      'Ravenna': '拉文纳',
      'Bari': '巴里',
      'Lecce': '莱切',
      'Spezia': '斯佩齐亚',
      'Empoli': '恩波利',
      'Sassuolo': '萨索洛'
    };

    // German team patterns
    const germanTeamPatterns: Record<string, string> = {
      'Darmstadt': '达姆施塔特',
      'Kaiserslautern': '凯泽斯劳滕',
      'Nuremberg': '纽伦堡',
      'Greuther': '菲尔特'
    };

    // Check patterns
    const allPatterns = { ...englishTeamPatterns, ...italianTeamPatterns, ...germanTeamPatterns };

    for (const [pattern, translation] of Object.entries(allPatterns)) {
      if (teamName.toLowerCase().includes(pattern.toLowerCase())) {
        return translation;
      }
    }

    return null;
  }

  // Clear old cache entries when they become too large
  private fixCorruptedCache(): void {
    try {
      const corruptedKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('smart_translation_')) {
          try {
            const value = localStorage.getItem(key);
            if (value && (value.length < 2 || value === 'undefined' || value === 'null')) {
              corruptedKeys.push(key);
            }
          } catch (e) {
            corruptedKeys.push(key);
          }
        }
      }

      corruptedKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🧹 [SmartTranslation] Removed corrupted cache entry: ${key}`);
      });

      if (corruptedKeys.length > 0) {
        console.log(`🔧 [SmartTranslation] Fixed ${corruptedKeys.length} corrupted cache entries`);
      }
    } catch (error) {
      console.warn('Failed to fix corrupted cache:', error);
    }
  }

  /**
   * Fix specific known corrupted entries
   */
  fixSpecificCorruptedEntries() {
    try {
      const knownCorruptedEntries = [
        // AEL should not be translated to "Israel"
        'smart_translation_AEL_zh-hk',
        'smart_translation_AEL_zh',
        'smart_translation_AEL_zh-tw',

        // Deportivo Cali should not be translated to Deportivo Pasto
        'smart_translation_Deportivo Cali_zh-hk',
        'smart_translation_Deportivo Cali_zh',
        'smart_translation_Deportivo Cali_zh-tw',

        // Alianza Petrolera should not be translated to Alianza Lima
        'smart_translation_Alianza Petrolera_zh-hk',
        'smart_translation_Alianza Petrolera_zh',
        'smart_translation_Alianza Petrolera_zh-tw',

        // Masr should not be translated to AL Masry
        'smart_translation_Masr_zh-hk',
        'smart_translation_Masr_zh',
        'smart_translation_Masr_zh-tw',
      ];

      knownCorruptedEntries.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`🔧 [SmartTranslation] Removed known corrupted entry: ${key}`);
        }
      });

      console.log(`✅ [SmartTranslation] Checked and fixed ${knownCorruptedEntries.length} known problematic entries`);
    } catch (error) {
      console.warn('Failed to fix specific corrupted entries:', error);
    }
  }

  /**
   * Validate if a cached translation makes logical sense
   */
  private isCachedTranslationValid(originalName: string, cachedTranslation: string, language: string): boolean {
    // Known invalid mappings to reject
    const invalidMappings: Record<string, string[]> = {
      'AEL': ['Israel', 'israeli'], // AEL should not be translated to Israel
      'Deportivo Cali': ['帕斯托體育', 'Deportivo Pasto'], // Should not be Deportivo Pasto
      'Alianza Petrolera': ['Alianza Lima'], // Should not be Alianza Lima
      'Masr': ['AL Masry'], // Should not be AL Masry
    };

    const invalidTranslations = invalidMappings[originalName];
    if (invalidTranslations && invalidTranslations.some(invalid => 
      cachedTranslation.toLowerCase().includes(invalid.toLowerCase())
    )) {
      return false;
    }

    // Additional logic: if translation is identical to original for Chinese languages, 
    // it might be a sign that no proper translation was found
    if (['zh', 'zh-hk', 'zh-tw'].includes(language) && cachedTranslation === originalName) {
      // Check if this team should have a translation
      const shouldHaveTranslation = this.popularLeagueTeams[originalName];
      if (shouldHaveTranslation) {
        return false; // Invalid cache, should be translated
      }
    }

    return true;
  }

  /**
   * Find alternative name patterns and variations
   */
  private findAlternativeNameMatch(teamName: string, language: string): string | null {
    // Common team name variations
    const nameVariations: Record<string, string[]> = {
      'AEL': ['AEL Limassol', 'AEL FC'],
      'Deportivo Cali': ['Cali', 'Deportivo Cali FC'],
      'Alianza Petrolera': ['Petrolera', 'Alianza Petrolera FC'],
      'Masr': ['Masr FC', 'El Masr'],
      'Umvezzane': ['Lumezzane'],
      'Mantova': ['AC Mantova'],
      'Sibenik': ['HNK Sibenik'],
      'Vodice': ['NK Vodice'],
      'Ethnikos Achna': ['Ethnikos Achnas'],
      'ASIL Lysi': ['ASIL'],
    };

    // Check if current team has variations
    const variations = nameVariations[teamName];
    if (variations) {
      for (const variation of variations) {
        const match = this.popularLeagueTeams[variation];
        if (match && match[language as keyof typeof match]) {
          return match[language as keyof typeof match];
        }
      }
    }

    // Reverse check: see if teamName is a variation of a known team
    for (const [knownTeam, variations] of Object.entries(nameVariations)) {
      if (variations.includes(teamName)) {
        const match = this.popularLeagueTeams[knownTeam];
        if (match && match[language as keyof typeof match]) {
          return match[language as keyof typeof match];
        }
      }
    }

    // Try without common suffixes/prefixes
    const cleanedName = teamName
      .replace(/^(FC|AC|SC|CF|CD|FK|HNK|NK)\s+/i, '')
      .replace(/\s+(FC|AC|SC|CF|CD|FK|HNK|NK)$/i, '');

    if (cleanedName !== teamName) {
      const match = this.popularLeagueTeams[cleanedName];
      if (match && match[language as keyof typeof match]) {
        return match[language as keyof typeof match];
      }
    }

    return null;
  }

  private findFuzzyMatch(teamName: string, language: string): string | null {
    // Using a simple Levenshtein distance for fuzzy matching
    // More advanced fuzzy matching libraries could be integrated if needed
    const calculateLevenshteinDistance = (s1: string, s2: string): number => {
      const len1 = s1.length;
      const len2 = s2.length;
      const matrix: number[][] = Array(len1 + 1).fill(0).map(() => Array(len2 + 1).fill(0));

      for (let i = 0; i <= len1; i++) matrix[i][0] = i;
      for (let j = 0; j <= len2; j++) matrix[0][j] = j;

      for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
          const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,      // Deletion
            matrix[i][j - 1] + 1,      // Insertion
            matrix[i - 1][j - 1] + cost // Substitution
          );
        }
      }
      return matrix[len1][len2];
    };

    let bestMatch: string | null = null;
    let minDistance = Infinity;
    const threshold = 3; // Maximum allowed distance for a match

    for (const [knownTeam, translations] of Object.entries(this.popularLeagueTeams)) {
      const distance = calculateLevenshteinDistance(teamName.toLowerCase(), knownTeam.toLowerCase());
      if (distance < minDistance && distance <= threshold) {
        minDistance = distance;
        const translation = translations[language as keyof typeof translations];
        if (translation && translation !== teamName) {
          bestMatch = translation;
        }
      }
    }

    return bestMatch;
  }

  // Generate comprehensive team mappings for specific leagues
  async generateMappingForLeagues(leagueIds: number[]): Promise<void> {
    console.log(`🗺️ [SmartTranslation] Generating mappings for leagues: ${leagueIds.join(', ')}`);

    const allTeams = new Set<string>();
    const leagueTeamMap = new Map<number, string[]>();

    // Fetch all teams from these leagues
    for (const leagueId of leagueIds) {
      try {
        const response = await fetch(`/api/leagues/${leagueId}/fixtures`);
        if (response.ok) {
          const data = await response.json();
          const fixtures = data.response || data || [];

          const leagueTeams: string[] = [];
          fixtures.forEach((fixture: any) => {
            if (fixture.teams?.home?.name && fixture.teams?.away?.name) {
              const homeTeam = fixture.teams.home.name.trim();
              const awayTeam = fixture.teams.away.name.trim();

              if (!allTeams.has(homeTeam)) {
                allTeams.add(homeTeam);
                leagueTeams.push(homeTeam);
              }
              if (!allTeams.has(awayTeam)) {
                allTeams.add(awayTeam);
                leagueTeams.push(awayTeam);
              }
            }
          });

          leagueTeamMap.set(leagueId, leagueTeams);
          console.log(`📋 [League ${leagueId}] Found ${leagueTeams.length} unique teams`);
        }
      } catch (error) {
        console.warn(`⚠️ [SmartTranslation] Failed to fetch teams for league ${leagueId}:`, error);
      }
    }

    // Generate missing translations for all collected teams
    const missingTranslations: string[] = [];
    allTeams.forEach(teamName => {
      if (!this.getPopularTeamTranslation(teamName, 'zh')) {
        missingTranslations.push(teamName);
      }
    });

    console.log(`🎯 [SmartTranslation] Analysis complete:`, {
      totalTeams: allTeams.size,
      alreadyTranslated: allTeams.size - missingTranslations.length,
      needingTranslation: missingTranslations.length,
      coverage: `${Math.round(((allTeams.size - missingTranslations.length) / allTeams.size) * 100)}%`
    });

    if (missingTranslations.length > 0) {
      console.log(`📝 [Missing Translations]:`, missingTranslations.slice(0, 20));
      if (missingTranslations.length > 20) {
        console.log(`... and ${missingTranslations.length - 20} more teams`);
      }
    }

    // Auto-learn missing teams
    leagueTeamMap.forEach((teams, leagueId) => {
      const sampleFixture = { league: { id: leagueId, name: `League ${leagueId}` } };
      teams.forEach(teamName => {
        if (missingTranslations.includes(teamName)) {
          this.learnNewTeam(teamName, sampleFixture.league);
        }
      });
    });

    console.log(`✅ [SmartTranslation] Mapping generation complete for ${leagueIds.length} leagues`);
  }

  // Get cache stats
  getCacheStats(): { teamCacheSize: number; leaguesCached: number; totalCachedTeams: number } {
    return {
      teamCacheSize: this.teamCache.size,
      leaguesCached: Object.keys(this.leagueTeamsCache).length,
      totalCachedTeams: Object.values(this.leagueTeamsCache).reduce((sum, teams) => sum + teams.length, 0)
    };
  }

  // Force refresh specific team translations
  forceRefreshTranslations(teams: string[], language: string = 'zh-hk'): void {
    teams.forEach(team => {
      const cacheKey = `${team}_${language}`;
      this.teamCache.delete(cacheKey);
      localStorage.removeItem(`smart_translation_${team}_${language}`);
      console.log(`🔄 [SmartTranslation] Force refreshed: ${team}`);
    });
  }
}

export const smartTeamTranslation = new SmartTeamTranslation();