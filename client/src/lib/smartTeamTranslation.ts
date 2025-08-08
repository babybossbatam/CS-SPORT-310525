
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
      'zh': '勒沃库森', 'zh-hk': '利華古遜', 'zh-tw': '勒沃庫森',
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

    // MLS teams (22)
    'LA Galaxy': {
      'zh': '洛杉矶银河', 'zh-hk': '洛杉磯銀河', 'zh-tw': '洛杉磯銀河',
      'es': 'LA Galaxy', 'de': 'LA Galaxy', 'it': 'LA Galaxy', 'pt': 'LA Galaxy'
    },
    'Los Angeles Galaxy': {
      'zh': '洛杉矶银河', 'zh-hk': '洛杉磯銀河', 'zh-tw': '洛杉磯銀河',
      'es': 'Los Angeles Galaxy', 'de': 'Los Angeles Galaxy', 'it': 'Los Angeles Galaxy', 'pt': 'Los Angeles Galaxy'
    },
    'Portland Timbers': {
      'zh': '波特兰伐木者', 'zh-hk': '波特蘭伐木者', 'zh-tw': '波特蘭伐木者',
      'es': 'Portland Timbers', 'de': 'Portland Timbers', 'it': 'Portland Timbers', 'pt': 'Portland Timbers'
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
    'Cruz Azul': {
      'zh': '蓝十字', 'zh-hk': '藍十字', 'zh-tw': '藍十字',
      'es': 'Cruz Azul', 'de': 'Cruz Azul', 'it': 'Cruz Azul', 'pt': 'Cruz Azul'
    },
    'Santos Laguna': {
      'zh': '桑托斯拉古纳', 'zh-hk': '山度士拉古納', 'zh-tw': '桑托斯拉古納',
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

    // Liga MX teams  
    'America': {
      'zh': '美洲', 'zh-hk': '美洲', 'zh-tw': '美洲',
      'es': 'América', 'de': 'Club América', 'it': 'Club América', 'pt': 'Club América'
    },
    'Guadalajara': {
      'zh': '瓜达拉哈拉', 'zh-hk': '瓜達拉哈拉', 'zh-tw': '瓜達拉哈拉',
      'es': 'Guadalajara', 'de': 'Guadalajara', 'it': 'Guadalajara', 'pt': 'Guadalajara'
    },
    'CD Guadalajara': {
      'zh': '瓜达拉哈拉', 'zh-hk': '瓜達拉哈拉', 'zh-tw': '瓜達拉哈拉',
      'es': 'CD Guadalajara', 'de': 'CD Guadalajara', 'it': 'CD Guadalajara', 'pt': 'CD Guadalajara'
    },
    'Chivas': {
      'zh': '瓜达拉哈拉', 'zh-hk': '瓜達拉哈拉', 'zh-tw': '瓜達拉哈拉',
      'es': 'Chivas', 'de': 'Chivas', 'it': 'Chivas', 'pt': 'Chivas'
    },
    'Pumas': {
      'zh': '美洲狮', 'zh-hk': '美洲獅', 'zh-tw': '美洲獅',
      'es': 'Pumas', 'de': 'Pumas', 'it': 'Pumas', 'pt': 'Pumas'
    },
    'Tigres': {
      'zh': '老虎', 'zh-hk': '老虎', 'zh-tw': '老虎',
      'es': 'Tigres', 'de': 'Tigres', 'it': 'Tigres', 'pt': 'Tigres'
    },
    'Monterrey': {
      'zh': '蒙特雷', 'zh-hk': '蒙特雷', 'zh-tw': '蒙特雷',
      'es': 'Monterrey', 'de': 'Monterrey', 'it': 'Monterrey', 'pt': 'Monterrey'
    },

    // Brazilian teams
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
    'Sao Paulo': {
      'zh': '圣保罗', 'zh-hk': '聖保羅', 'zh-tw': '聖保羅',
      'es': 'São Paulo', 'de': 'São Paulo', 'it': 'San Paolo', 'pt': 'São Paulo'
    },

    // Argentine teams
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

    // Additional European teams
    'Olympiakos Piraeus': {
      'zh': '奥林匹亚科斯', 'zh-hk': '奧林比亞高斯', 'zh-tw': '奧林匹亞科斯',
      'es': 'Olympiakos Piraeus', 'de': 'Olympiakos Piräus', 'it': 'Olympiakos Pireo', 'pt': 'Olympiakos Pireu'
    },
    'Olympiakos': {
      'zh': '奥林匹亚科斯', 'zh-hk': '奧林比亞高斯', 'zh-tw': '奧林匹亞科斯',
      'es': 'Olympiakos', 'de': 'Olympiakos', 'it': 'Olympiakos', 'pt': 'Olympiakos'
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
    'Córdoba': {
      'zh': '科尔多瓦', 'zh-hk': '哥多華', 'zh-tw': '科爾多瓦',
      'es': 'Córdoba', 'de': 'Córdoba', 'it': 'Córdoba', 'pt': 'Córdoba'
    },

    // Special handling for teams that might appear with different naming patterns
    "L'Entregu": {
      'zh': '恩特雷古', 'zh-hk': '恩特雷古', 'zh-tw': '恩特雷古',
      'es': "L'Entregu", 'de': "L'Entregu", 'it': "L'Entregu", 'pt': "L'Entregu"
    },
    'Marino de Luanco': {
      'zh': '马里诺德卢安科', 'zh-hk': '馬里諾德盧安科', 'zh-tw': '馬里諾德盧安科',
      'es': 'Marino de Luanco', 'de': 'Marino de Luanco', 'it': 'Marino de Luanco', 'pt': 'Marino de Luanco'
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
      .replace(/^(FC|CF|AC|AS|Real|Club|CD|SD|AD)\s+/i, '')
      .replace(/\s+(FC|CF|AC|AS|United|City|CF|SC|II|2|B)$/i, '');
    
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

  // Smart translation with fallbacks
  translateTeamName(teamName: string, language: string = 'zh'): string {
    if (!teamName) return '';

    console.log(`🤖 [SmartTranslation] Translating "${teamName}" to ${language}`, {
      isLoading: this.isLoading,
      cacheSize: this.teamCache.size,
      leaguesLoaded: Object.keys(this.leagueTeamsCache).length,
      totalTeams: Object.values(this.leagueTeamsCache).reduce((sum, teams) => sum + teams.length, 0)
    });

    // Check cache first
    const cacheKey = `${teamName.toLowerCase()}_${language}`;
    if (this.teamCache.has(cacheKey)) {
      const cached = this.teamCache.get(cacheKey)!;
      console.log(`💾 [SmartTranslation] Cache hit: "${teamName}" -> "${cached}"`);
      return cached;
    }

    // Try popular teams mapping first (highest priority)
    const popularTranslation = this.getPopularTeamTranslation(teamName, language);
    if (popularTranslation && popularTranslation !== teamName) {
      console.log(`⭐ [SmartTranslation] Popular team translation: "${teamName}" -> "${popularTranslation}"`);
      this.teamCache.set(cacheKey, popularTranslation);
      return popularTranslation;
    }

    // Try exact match from manual translations (keep your existing ones as fallback)
    const manualTranslation = this.getManualTranslation(teamName, language);
    if (manualTranslation && manualTranslation !== teamName) {
      console.log(`📖 [SmartTranslation] Manual translation: "${teamName}" -> "${manualTranslation}"`);
      this.teamCache.set(cacheKey, manualTranslation);
      return manualTranslation;
    }

    // Cache the original name if no translation found
    console.log(`❌ [SmartTranslation] No translation found for "${teamName}" in ${language}`);
    this.teamCache.set(cacheKey, teamName);
    return teamName;
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

  // Get cache stats
  getCacheStats(): { teamCacheSize: number; leaguesCached: number; totalCachedTeams: number } {
    return {
      teamCacheSize: this.teamCache.size,
      leaguesCached: Object.keys(this.leagueTeamsCache).length,
      totalCachedTeams: Object.values(this.leagueTeamsCache).reduce((sum, teams) => sum + teams.length, 0)
    };
  }
}

export const smartTeamTranslation = new SmartTeamTranslation();
