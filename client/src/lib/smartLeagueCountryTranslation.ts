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
    'Group Standings': {
      'zh': '小组积分榜', 'zh-hk': '小組積分榜', 'zh-tw': '小組積分榜',
      'es': 'Clasificación de Grupos', 'de': 'Gruppentabelle', 'it': 'Classifica Gironi', 'pt': 'Classificação dos Grupos'
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
      },

    'CS SPORT!': {
      'zh': 'CS SPORT!', 'zh-hk': 'CS SPORT!', 'zh-tw': 'CS SPORT!',
      'es': 'CS SPORT!', 'de': 'CS SPORT!', 'it': 'CS SPORT!', 'pt': 'CS SPORT!'
    },

    // MyInfo component translations
    'Football at CS SPORT': {
      'zh': 'CS SPORT足球', 'zh-hk': 'CS SPORT足球', 'zh-tw': 'CS SPORT足球',
      'es': 'Fútbol en CS SPORT', 'de': 'Fußball bei CS SPORT', 'it': 'Calcio su CS SPORT', 'pt': 'Futebol no CS SPORT'
    },
    'Welcome to CS SPORT – your ultimate destination for everything Football! Stay on top of the action with live scores from over 1,000 competitions worldwide, including today\'s hottest matches from the UEFA Champions League Qualifiers, UEFA Champions League, and the Premier League.': {
      'zh': '欢迎来到CS SPORT——您足球世界的终极目的地！通过来自全球1000多个赛事的实时比分掌握最新动态，包括今日最热门的UEFA欧洲冠军联赛预选赛、UEFA欧洲冠军联赛和英格兰超级联赛比赛。',
      'zh-hk': '歡迎來到CS SPORT——您足球世界的終極目的地！透過來自全球1000多個賽事的即時比分掌握最新動態，包括今日最熱門的UEFA歐洲冠軍聯賽預選賽、UEFA歐洲冠軍聯賽和英格蘭超級聯賽比賽。',
      'zh-tw': '歡迎來到CS SPORT——您足球世界的終極目的地！透過來自全球1000多個賽事的即時比分掌握最新動態，包括今日最熱門的UEFA歐洲冠軍聯賽預選賽、UEFA歐洲冠軍聯賽和英格蘭超級聯賽比賽。',
      'es': '¡Bienvenido a CS SPORT, tu destino definitivo para todo sobre fútbol! Mantente al día con las puntuaciones en vivo de más de 1,000 competiciones en todo el mundo, incluyendo los partidos más emocionantes de hoy de los Clasificatorios de la Liga de Campeones de la UEFA, Liga de Campeones de la UEFA y la Premier League.',
      'de': 'Willkommen bei CS SPORT – Ihrem ultimativen Ziel für alles rund um Fußball! Bleiben Sie mit Live-Ergebnissen von über 1.000 Wettbewerben weltweit auf dem Laufenden, einschließlich der heißesten Spiele von heute aus den UEFA Champions League Qualifiers, UEFA Champions League und der Premier League.',
      'it': 'Benvenuto su CS SPORT – la tua destinazione definitiva per tutto ciò che riguarda il calcio! Rimani aggiornato con i punteggi in diretta di oltre 1.000 competizioni in tutto il mondo, incluse le partite più calde di oggi dai Qualificatori della UEFA Champions League, UEFA Champions League e Premier League.',
      'pt': 'Bem-vindo ao CS SPORT – seu destino definitivo para tudo sobre futebol! Mantenha-se atualizado com placares ao vivo de mais de 1.000 competições em todo o mundo, incluindo os jogos mais quentes de hoje dos Qualificadores da Liga dos Campeões da UEFA, Liga dos Campeões da UEFA e Premier League.'
    },
    'Explore Your Favorite Teams & Players': {
      'zh': '探索您喜爱的球队和球员', 'zh-hk': '探索您喜愛的球隊和球員', 'zh-tw': '探索您喜愛的球隊和球員',
      'es': 'Explora Tus Equipos y Jugadores Favoritos', 'de': 'Entdecken Sie Ihre Lieblingsteams & Spieler', 'it': 'Esplora le Tue Squadre e Giocatori Preferiti', 'pt': 'Explore Seus Times e Jogadores Favoritos'
    },
    'Want to know how FC Barcelona, Real Madrid, or Manchester United are doing? Dive into the latest results, upcoming fixtures, league standings, breaking news, match highlights, and in-depth stats for top stars like Lionel Messi, Cristiano Ronaldo, and Lamine Yamal.': {
      'zh': '想了解巴塞罗那、皇家马德里或曼联的表现如何？深入了解最新结果、即将到来的赛程、联赛排名、突发新闻、比赛精彩瞬间，以及梅西、C罗和拉明·亚马尔等顶级球星的深度统计数据。',
      'zh-hk': '想了解巴塞隆拿、皇家馬德里或曼聯的表現如何？深入了解最新結果、即將到來的賽程、聯賽排名、突發新聞、比賽精彩瞬間，以及美斯、C朗和拉明·亞馬爾等頂級球星的深度統計數據。',
      'zh-tw': '想了解巴塞隆納、皇家馬德里或曼聯的表現如何？深入了解最新結果、即將到來的賽程、聯賽排名、突發新聞、比賽精彩瞬間，以及梅西、C羅和拉明·亞馬爾等頂級球星的深度統計數據。',
      'es': '¿Quieres saber cómo les va al FC Barcelona, Real Madrid o Manchester United? Sumérgete en los últimos resultados, próximos partidos, clasificaciones de liga, noticias de última hora, destacados de partidos y estadísticas detalladas de estrellas como Lionel Messi, Cristiano Ronaldo y Lamine Yamal.',
      'de': 'Möchten Sie wissen, wie es dem FC Barcelona, Real Madrid oder Manchester United geht? Tauchen Sie ein in die neuesten Ergebnisse, anstehende Spiele, Ligatabellen, aktuelle Nachrichten, Spielhighlights und detaillierte Statistiken von Topstars wie Lionel Messi, Cristiano Ronaldo und Lamine Yamal.',
      'it': 'Vuoi sapere come stanno andando FC Barcelona, Real Madrid o Manchester United? Immergiti negli ultimi risultati, prossime partite, classifiche di campionato, notizie dell\'ultima ora, highlights delle partite e statistiche approfondite di stelle come Lionel Messi, Cristiano Ronaldo e Lamine Yamal.',
      'pt': 'Quer saber como estão se saindo o FC Barcelona, Real Madrid ou Manchester United? Mergulhe nos últimos resultados, próximos jogos, classificações da liga, notícias de última hora, destaques de partidas e estatísticas detalhadas de estrelas como Lionel Messi, Cristiano Ronaldo e Lamine Yamal.'
    },
    'Why Choose CS SPORT?': {
      'zh': '为什么选择CS SPORT？', 'zh-hk': '為什麼選擇CS SPORT？', 'zh-tw': '為什麼選擇CS SPORT？',
      'es': '¿Por Qué Elegir CS SPORT?', 'de': 'Warum CS SPORT wählen?', 'it': 'Perché Scegliere CS SPORT?', 'pt': 'Por Que Escolher CS SPORT?'
    },
    'All-in-One Platform: Get the latest news, fixtures, standings, results, and live scores for leagues, cups, and tournaments around the globe.': {
      'zh': '一体化平台：获取全球联赛、杯赛和锦标赛的最新新闻、赛程、排名、结果和实时比分。',
      'zh-hk': '一體化平台：獲取全球聯賽、盃賽和錦標賽的最新新聞、賽程、排名、結果和即時比分。',
      'zh-tw': '一體化平台：獲取全球聯賽、盃賽和錦標賽的最新新聞、賽程、排名、結果和即時比分。',
      'es': 'Plataforma Todo-en-Uno: Obtén las últimas noticias, partidos, clasificaciones, resultados y puntuaciones en vivo de ligas, copas y torneos de todo el mundo.',
      'de': 'All-in-One-Plattform: Erhalten Sie die neuesten Nachrichten, Spiele, Tabellen, Ergebnisse und Live-Ergebnisse für Ligen, Pokale und Turniere rund um den Globus.',
      'it': 'Piattaforma Tutto-in-Uno: Ottieni le ultime notizie, partite, classifiche, risultati e punteggi in diretta per campionati, coppe e tornei in tutto il mondo.',
      'pt': 'Plataforma Tudo-em-Um: Obtenha as últimas notícias, jogos, classificações, resultados e placares ao vivo de ligas, copas e torneios ao redor do mundo.'
    },
    'Track Your Favorites: Follow your teams and players, and never miss a moment.': {
      'zh': '跟踪您的最爱：关注您的球队和球员，不错过任何时刻。',
      'zh-hk': '追蹤您的最愛：關注您的球隊和球員，不錯過任何時刻。',
      'zh-tw': '追蹤您的最愛：關注您的球隊和球員，不錯過任何時刻。',
      'es': 'Sigue a Tus Favoritos: Sigue a tus equipos y jugadores, y nunca te pierdas un momento.',
      'de': 'Verfolgen Sie Ihre Favoriten: Folgen Sie Ihren Teams und Spielern und verpassen Sie keinen Moment.',
      'it': 'Segui i Tuoi Preferiti: Segui le tue squadre e giocatori, e non perdere mai un momento.',
      'pt': 'Acompanhe Seus Favoritos: Siga seus times e jogadores, e nunca perca um momento.'
    },
    'Smart Predictions: Use our insights and tips to make better Football predictions and outsmart your friends.': {
      'zh': '智能预测：使用我们的洞察和技巧做出更好的足球预测，智胜您的朋友。',
      'zh-hk': '智能預測：使用我們的洞察和技巧做出更好的足球預測，智勝您的朋友。',
      'zh-tw': '智能預測：使用我們的洞察和技巧做出更好的足球預測，智勝您的朋友。',
      'es': 'Predicciones Inteligentes: Usa nuestras ideas y consejos para hacer mejores predicciones de fútbol y superar a tus amigos.',
      'de': 'Intelligente Vorhersagen: Nutzen Sie unsere Erkenntnisse und Tipps, um bessere Fußball-Vorhersagen zu treffen und Ihre Freunde zu übertreffen.',
      'it': 'Previsioni Intelligenti: Usa le nostre intuizioni e consigli per fare migliori previsioni di calcio e superare i tuoi amici.',
      'pt': 'Previsões Inteligentes: Use nossas percepções e dicas para fazer melhores previsões de futebol e superar seus amigos.'
    },
    'Ready to experience Football like never before?': {
      'zh': '准备好以前所未有的方式体验足球了吗？',
      'zh-hk': '準備好以前所未有的方式體驗足球了嗎？',
      'zh-tw': '準備好以前所未有的方式體驗足球了嗎？',
      'es': '¿Listo para experimentar el fútbol como nunca antes?',
      'de': 'Bereit, Fußball wie nie zuvor zu erleben?',
      'it': 'Pronto a vivere il calcio come mai prima d\'ora?',
      'pt': 'Pronto para experimentar o futebol como nunca antes?'
    },
    'Start exploring now and join the CS SPORT community!': {
      'zh': '立即开始探索，加入CS SPORT社区！',
      'zh-hk': '立即開始探索，加入CS SPORT社區！',
      'zh-tw': '立即開始探索，加入CS SPORT社區！',
      'es': '¡Comienza a explorar ahora y únete a la comunidad CS SPORT!',
      'de': 'Beginnen Sie jetzt zu erkunden und treten Sie der CS SPORT-Community bei!',
      'it': 'Inizia a esplorare ora e unisciti alla comunità CS SPORT!',
      'pt': 'Comece a explorar agora e junte-se à comunidade CS SPORT!'
    },
    'Football Info': {
      'zh': '足球信息', 'zh-hk': '足球資訊', 'zh-tw': '足球資訊',
      'es': 'Información de Fútbol', 'de': 'Fußball-Info', 'it': 'Info Calcio', 'pt': 'Info Futebol'
    },
    'Football FAQ': {
      'zh': '足球常见问题', 'zh-hk': '足球常見問題', 'zh-tw': '足球常見問題',
      'es': 'Preguntas Frecuentes de Fútbol', 'de': 'Fußball FAQ', 'it': 'FAQ Calcio', 'pt': 'FAQ Futebol'
    },
    'Who invented Football?': {
      'zh': '谁发明了足球？', 'zh-hk': '誰發明了足球？', 'zh-tw': '誰發明了足球？',
      'es': '¿Quién inventó el fútbol?', 'de': 'Wer hat den Fußball erfunden?', 'it': 'Chi ha inventato il calcio?', 'pt': 'Quem inventou o futebol?'
    },
    'Football\'s roots go way back! While ball games have been played for centuries across the world, the modern game was shaped in England in the 19th century. The English Football Association set the official rules in 1863, giving us the Football we know and love today.': {
      'zh': '足球的根源可以追溯到很久以前！虽然球类游戏在世界各地已经进行了几个世纪，但现代足球是在19世纪的英格兰形成的。英格兰足球协会在1863年制定了官方规则，为我们带来了今天我们所知道和喜爱的足球。',
      'zh-hk': '足球的根源可以追溯到很久以前！雖然球類遊戲在世界各地已經進行了幾個世紀，但現代足球是在19世紀的英格蘭形成的。英格蘭足球協會在1863年制定了官方規則，為我們帶來了今天我們所知道和喜愛的足球。',
      'zh-tw': '足球的根源可以追溯到很久以前！雖然球類遊戲在世界各地已經進行了幾個世紀，但現代足球是在19世紀的英格蘭形成的。英格蘭足球協會在1863年制定了官方規則，為我們帶來了今天我們所知道和喜愛的足球。',
      'es': '¡Las raíces del fútbol se remontan muy atrás! Aunque los juegos de pelota se han jugado durante siglos en todo el mundo, el juego moderno se formó en Inglaterra en el siglo XIX. La Asociación de Fútbol Inglesa estableció las reglas oficiales en 1863, dándonos el fútbol que conocemos y amamos hoy.',
      'de': 'Die Wurzeln des Fußballs reichen weit zurück! Während Ballspiele jahrhundertelang auf der ganzen Welt gespielt wurden, wurde das moderne Spiel im 19. Jahrhundert in England geformt. Der englische Fußballverband stellte 1863 die offiziellen Regeln auf und gab uns den Fußball, den wir heute kennen und lieben.',
      'it': 'Le radici del calcio risalgono a molto tempo fa! Mentre i giochi con la palla sono stati giocati per secoli in tutto il mondo, il gioco moderno è stato plasmato in Inghilterra nel XIX secolo. L\'Associazione Calcistica Inglese stabilì le regole ufficiali nel 1863, dandoci il calcio che conosciamo e amiamo oggi.',
      'pt': 'As raízes do futebol remontam a muito tempo! Embora jogos de bola tenham sido jogados por séculos ao redor do mundo, o jogo moderno foi moldado na Inglaterra no século XIX. A Associação de Futebol Inglesa estabeleceu as regras oficiais em 1863, nos dando o futebol que conhecemos e amamos hoje.'
    },
    'Where was Football invented?': {
      'zh': '足球是在哪里发明的？', 'zh-hk': '足球是在哪裡發明的？', 'zh-tw': '足球是在哪裡發明的？',
      'es': '¿Dónde se inventó el fútbol?', 'de': 'Wo wurde der Fußball erfunden?', 'it': 'Dove è stato inventato il calcio?', 'pt': 'Onde o futebol foi inventado?'
    },
    'The modern version of Football was born in England. Although similar games existed globally, it was in England where the rules were standardized, making it the home of modern Football.': {
      'zh': '现代足球诞生于英格兰。虽然全球都存在类似的游戏，但正是在英格兰规则得到了标准化，使其成为现代足球的故乡。',
      'zh-hk': '現代足球誕生於英格蘭。雖然全球都存在類似的遊戲，但正是在英格蘭規則得到了標準化，使其成為現代足球的故鄉。',
      'zh-tw': '現代足球誕生於英格蘭。雖然全球都存在類似的遊戲，但正是在英格蘭規則得到了標準化，使其成為現代足球的故鄉。',
      'es': 'La versión moderna del fútbol nació en Inglaterra. Aunque existían juegos similares a nivel mundial, fue en Inglaterra donde se estandarizaron las reglas, convirtiéndolo en el hogar del fútbol moderno.',
      'de': 'Die moderne Version des Fußballs wurde in England geboren. Obwohl ähnliche Spiele weltweit existierten, war es in England, wo die Regeln standardisiert wurden, was es zur Heimat des modernen Fußballs macht.',
      'it': 'La versione moderna del calcio è nata in Inghilterra. Sebbene giochi simili esistessero a livello globale, è stato in Inghilterra che le regole sono state standardizzate, rendendola la casa del calcio moderno.',
      'pt': 'A versão moderna do futebol nasceu na Inglaterra. Embora jogos similares existissem globalmente, foi na Inglaterra onde as regras foram padronizadas, tornando-a o lar do futebol moderno.'
    },
    'What is the length of a Football pitch?': {
      'zh': '足球场的长度是多少？', 'zh-hk': '足球場的長度是多少？', 'zh-tw': '足球場的長度是多少？',
      'es': '¿Cuál es la longitud de un campo de fútbol?', 'de': 'Wie lang ist ein Fußballplatz?', 'it': 'Qual è la lunghezza di un campo da calcio?', 'pt': 'Qual é o comprimento de um campo de futebol?'
    },
    'Great question! A standard Football pitch is rectangular, ranging from 90–120 meters in length and 45–90 meters in width, as set by the International Football Association Board (IFAB). These dimensions are used for professional and international matches.': {
      'zh': '好问题！标准足球场是长方形的，长度为90-120米，宽度为45-90米，由国际足球协会理事会(IFAB)设定。这些尺寸用于职业和国际比赛。',
      'zh-hk': '好問題！標準足球場是長方形的，長度為90-120米，寬度為45-90米，由國際足球協會理事會(IFAB)設定。這些尺寸用於職業和國際比賽。',
      'zh-tw': '好問題！標準足球場是長方形的，長度為90-120米，寬度為45-90米，由國際足球協會理事會(IFAB)設定。這些尺寸用於職業和國際比賽。',
      'es': '¡Excelente pregunta! Un campo de fútbol estándar es rectangular, con un rango de 90-120 metros de longitud y 45-90 metros de ancho, según lo establecido por la Junta de la Asociación Internacional de Fútbol (IFAB). Estas dimensiones se utilizan para partidos profesionales e internacionales.',
      'de': 'Tolle Frage! Ein Standard-Fußballplatz ist rechteckig und reicht von 90-120 Metern in der Länge und 45-90 Metern in der Breite, wie vom International Football Association Board (IFAB) festgelegt. Diese Abmessungen werden für professionelle und internationale Spiele verwendet.',
      'it': 'Ottima domanda! Un campo da calcio standard è rettangolare, con una lunghezza che varia da 90-120 metri e una larghezza di 45-90 metri, come stabilito dall\'International Football Association Board (IFAB). Queste dimensioni sono utilizzate per partite professionali e internazionali.',
      'pt': 'Ótima pergunta! Um campo de futebol padrão é retangular, variando de 90-120 metros de comprimento e 45-90 metros de largura, conforme estabelecido pelo International Football Association Board (IFAB). Essas dimensões são usadas para partidas profissionais e internacionais.'
    },
    'Who is the best Football player in the world?': {
      'zh': '谁是世界上最好的足球运动员？', 'zh-hk': '誰是世界上最好的足球運動員？', 'zh-tw': '誰是世界上最好的足球運動員？',
      'es': '¿Quién es el mejor jugador de fútbol del mundo?', 'de': 'Wer ist der beste Fußballspieler der Welt?', 'it': 'Chi è il miglior giocatore di calcio al mondo?', 'pt': 'Quem é o melhor jogador de futebol do mundo?'
    },
    'This is always up for debate! Legends like Pelé, Diego Maradona, Lionel Messi, and Cristiano Ronaldo have all left their mark. Each has a unique style and legacy, so the \'best\' often depends on who you ask!': {
      'zh': '这总是一个争论的话题！像贝利、马拉多纳、梅西和C罗这样的传奇人物都留下了自己的印记。每个人都有独特的风格和遗产，所以"最好的"往往取决于你问的是谁！',
      'zh-hk': '這總是一個爭論的話題！像比利、馬勒當拿、美斯和C朗這樣的傳奇人物都留下了自己的印記。每個人都有獨特的風格和遺產，所以"最好的"往往取決於你問的是誰！',
      'zh-tw': '這總是一個爭論的話題！像貝利、馬拉度納、梅西和C羅這樣的傳奇人物都留下了自己的印記。每個人都有獨特的風格和遺產，所以"最好的"往往取決於你問的是誰！',
      'es': '¡Esto siempre está en debate! Leyendas como Pelé, Diego Maradona, Lionel Messi y Cristiano Ronaldo han dejado su huella. Cada uno tiene un estilo único y un legado, así que el "mejor" a menudo depende de a quién le preguntes!',
      'de': 'Das ist immer umstritten! Legenden wie Pelé, Diego Maradona, Lionel Messi und Cristiano Ronaldo haben alle ihre Spuren hinterlassen. Jeder hat einen einzigartigen Stil und ein Vermächtnis, also hängt der "Beste" oft davon ab, wen Sie fragen!',
      'it': 'Questo è sempre oggetto di dibattito! Leggende come Pelé, Diego Maradona, Lionel Messi e Cristiano Ronaldo hanno tutti lasciato il loro segno. Ognuno ha uno stile unico e un\'eredità, quindi il "migliore" spesso dipende da chi chiedi!',
      'pt': 'Isso é sempre motivo de debate! Lendas como Pelé, Diego Maradona, Lionel Messi e Cristiano Ronaldo deixaram sua marca. Cada um tem um estilo único e legado, então o "melhor" frequentemente depende de quem você pergunta!'
    },
    'Want more Football fun?': {
      'zh': '想要更多足球乐趣？', 'zh-hk': '想要更多足球樂趣？', 'zh-tw': '想要更多足球樂趣？',
      'es': '¿Quieres más diversión futbolística?', 'de': 'Wollen Sie mehr Fußball-Spaß?', 'it': 'Vuoi più divertimento calcistico?', 'pt': 'Quer mais diversão futebolística?'
    },
    'Check out live stats, highlights, and join the conversation with fans worldwide – only on': {
      'zh': '查看实时统计、精彩瞬间，与全球球迷一起交流——仅在',
      'zh-hk': '查看即時統計、精彩瞬間，與全球球迷一起交流——僅在',
      'zh-tw': '查看即時統計、精彩瞬間，與全球球迷一起交流——僅在',
      'es': 'Consulta estadísticas en vivo, destacados y únete a la conversación con fanáticos de todo el mundo, solo en',
      'de': 'Schauen Sie sich Live-Statistiken, Highlights an und treten Sie in das Gespräch mit Fans weltweit ein – nur auf',
      'it': 'Controlla le statistiche live, i highlights e unisciti alla conversazione con i fan di tutto il mondo – solo su',
      'pt': 'Confira estatísticas ao vivo, destaques e junte-se à conversa com fãs do mundo todo – apenas no'
    },
    'Show Less': {
      'zh': '收起', 'zh-hk': '收起', 'zh-tw': '收起',
      'es': 'Mostrar Menos', 'de': 'Weniger anzeigen', 'it': 'Mostra Meno', 'pt': 'Mostrar Menos'
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

  // Check if a mapping should be updated (e.g. if new one has more complete translations)
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
    else if (lowerName.includes('world cup qualification') || lowerName.includes('wc qualification') || 
             (lowerName.includes('world cup') && lowerName.includes('qualification')) ||
             lowerName.includes('world cup - qualification')) {
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
      } else if (lowerName.includes('oceania') || lowerName.includes('ofc')) {
        translations.zh = '世界杯大洋洲预选赛'; translations['zh-hk'] = '世界盃大洋洲預選賽'; translations['zh-tw'] = '世界盃大洋洲預選賽';
        translations.es = 'Clasificación Oceánica'; translations.de = 'WM-Qualifikation Ozeanien';
      } else if (lowerName.includes('intercontinental')) {
        translations.zh = '世界杯洲际附加赛'; translations['zh-hk'] = '世界盃洲際附加賽'; translations['zh-tw'] = '世界盃洲際附加賽';
        translations.es = 'Play-offs Intercontinentales'; translations.de = 'Interkontinentale Play-offs';
      } else {
        // Generic World Cup qualification
        translations.zh = '世界杯预选赛'; translations['zh-hk'] = '世界盃預選賽'; translations['zh-tw'] = '世界盃預選賽';
        translations.es = 'Clasificación Mundial'; translations.de = 'WM-Qualifikation';
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
      coreCountries: Object.fromEntries(this.learnedCountryMappings),
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