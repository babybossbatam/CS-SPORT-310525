
import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  translations: { [key: string]: { [key: string]: string } };
}

const translations = {
  'en': {
    'today_matches': "Today's Matches",
    'yesterday_matches': "Yesterday's Matches",
    'tomorrow_matches': "Tomorrow's Matches",
    'live_matches': "Live Matches",
    'football_leagues': "Football Leagues",
    'popular_football_leagues': "Popular Football Leagues",
    'all_leagues': "All Leagues A-Z",
    'standings': "Standings",
    'fixtures': "Fixtures",
    'results': "Results",
    'statistics': "Statistics",
    'home': "Home",
    'away': "Away",
    'vs': "vs",
    'football': "Football",
    'basketball': "Basketball",
    'settings': "Settings",
    'myScores': "My Scores",
    'live': "LIVE",
    'finished': "FT",
    'ended': "Ended",
    'not_started': "Not Started",
    'featured_match': "Featured Match",
    'by_time': "By time",
    'uefa_champions_league': "UEFA Champions League",
    'world': "World",
    'goals': "Goals",
    'match_page': "Match Page",
    'lineups': "Lineups",
    'stats': "Stats",
    'groups': "Groups"
  },
  'es': {
    'today_matches': "Partidos de Hoy",
    'yesterday_matches': "Partidos de Ayer",
    'tomorrow_matches': "Partidos de Mañana",
    'live_matches': "Partidos en Vivo",
    'football_leagues': "Ligas de Fútbol",
    'popular_football_leagues': "Ligas de Fútbol Populares",
    'all_leagues': "Todas las Ligas A-Z",
    'standings': "Clasificación",
    'fixtures': "Calendario",
    'results': "Resultados",
    'statistics': "Estadísticas",
    'home': "Local",
    'away': "Visitante",
    'vs': "vs",
    'football': "Fútbol",
    'basketball': "Baloncesto",
    'settings': "Configuración",
    'myScores': "Mis Resultados",
    'live': "VIVO",
    'finished': "FT",
    'ended': "Terminado",
    'not_started': "No Iniciado",
    'featured_match': "Partido Destacado",
    'by_time': "Por hora",
    'uefa_champions_league': "Liga de Campeones UEFA",
    'world': "Mundial",
    'goals': "Goles",
    'match_page': "Página del Partido",
    'lineups': "Alineaciones",
    'stats': "Estadísticas",
    'groups': "Grupos"
  },
  'zh-hk': {
    'today_matches': "今日比賽",
    'yesterday_matches': "昨日比賽",
    'tomorrow_matches': "明日比賽",
    'live_matches': "即時比賽",
    'football_leagues': "足球聯賽",
    'popular_football_leagues': "熱門足球聯賽",
    'all_leagues': "所有聯賽 A-Z",
    'standings': "積分榜",
    'fixtures': "賽程",
    'results': "結果",
    'statistics': "統計",
    'home': "主場",
    'away': "客場",
    'vs': "對",
    'football': "足球",
    'basketball': "籃球",
    'settings': "設定",
    'myScores': "我的比分",
    'live': "即時",
    'finished': "結束",
    'ended': "已結束",
    'not_started': "未開始",
    'featured_match': "精選比賽",
    'by_time': "按時間",
    'uefa_champions_league': "歐洲冠軍聯賽",
    'world': "世界",
    'goals': "進球",
    'match_page': "比賽頁面",
    'lineups': "陣容",
    'stats': "統計",
    'groups': "小組"
  },
  'de': {
    'today_matches': "Heutige Spiele",
    'yesterday_matches': "Gestrige Spiele",
    'tomorrow_matches': "Morgige Spiele",
    'live_matches': "Live Spiele",
    'football_leagues': "Fußball Ligen",
    'all_leagues': "Alle Ligen A-Z",
    'standings': "Tabelle",
    'fixtures': "Spielplan",
    'results': "Ergebnisse",
    'statistics': "Statistiken",
    'home': "Heim",
    'away': "Auswärts",
    'vs': "vs",
    'football': "Fußball",
    'basketball': "Basketball",
    'settings': "Einstellungen",
    'myScores': "Meine Ergebnisse",
    'live': "LIVE",
    'finished': "FT",
    'not_started': "Nicht Gestartet",
    'featured_match': "Spiel des Tages"
  },
  'it': {
    'today_matches': "Partite di Oggi",
    'yesterday_matches': "Partite di Ieri",
    'tomorrow_matches': "Partite di Domani",
    'live_matches': "Partite in Diretta",
    'football_leagues': "Campionati di Calcio",
    'all_leagues': "Tutti i Campionati A-Z",
    'standings': "Classifica",
    'fixtures': "Calendario",
    'results': "Risultati",
    'statistics': "Statistiche",
    'home': "Casa",
    'away': "Trasferta",
    'vs': "vs",
    'football': "Calcio",
    'basketball': "Pallacanestro",
    'settings': "Impostazioni",
    'myScores': "I Miei Risultati",
    'live': "LIVE",
    'finished': "FT",
    'not_started': "Non Iniziato",
    'featured_match': "Partita in Evidenza"
  },
  'pt': {
    'today_matches': "Jogos de Hoje",
    'yesterday_matches': "Jogos de Ontem",
    'tomorrow_matches': "Jogos de Amanhã",
    'live_matches': "Jogos ao Vivo",
    'football_leagues': "Ligas de Futebol",
    'all_leagues': "Todas as Ligas A-Z",
    'standings': "Classificação",
    'fixtures': "Calendário",
    'results': "Resultados",
    'statistics': "Estatísticas",
    'home': "Casa",
    'away': "Fora",
    'vs': "vs",
    'football': "Futebol",
    'basketball': "Basquetebol",
    'settings': "Configurações",
    'myScores': "Meus Resultados",
    'live': "AO VIVO",
    'finished': "FT",
    'not_started': "Não Iniciado",
    'featured_match': "Jogo em Destaque"
  },
  'zh': {
    'today_matches': "今日比赛",
    'yesterday_matches': "昨日比赛",
    'tomorrow_matches': "明日比赛",
    'live_matches': "直播比赛",
    'football_leagues': "足球联赛",
    'all_leagues': "所有联赛 A-Z",
    'standings': "积分榜",
    'fixtures': "赛程",
    'results': "结果",
    'statistics': "统计",
    'home': "主场",
    'away': "客场",
    'vs': "对",
    'football': "足球",
    'basketball': "篮球",
    'settings': "设置",
    'myScores': "我的比分",
    'live': "直播",
    'finished': "结束",
    'not_started': "未开始",
    'featured_match': "精选比赛"
  }
};

const countryToLanguageMap: { [key: string]: string } = {
  'United States': 'en',
  'United Kingdom': 'en',
  'Spain': 'es',
  'Hong Kong': 'zh-hk',
  'Germany': 'de',
  'Italy': 'it',
  'Portugal': 'pt',
  'Brazil': 'pt',
  'Mexico': 'es',
  'Argentina': 'es'
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ 
  children: React.ReactNode; 
  initialLanguage?: string | null; 
}> = ({ children, initialLanguage }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    // Priority: URL language > localStorage > default 'en'
    if (initialLanguage && translations[initialLanguage]) {
      return initialLanguage;
    }
    const savedLanguage = localStorage.getItem('app-language');
    if (savedLanguage && translations[savedLanguage]) {
      return savedLanguage;
    }
    return 'en';
  });

  useEffect(() => {
    // Update if initialLanguage changes (from URL)
    if (initialLanguage && translations[initialLanguage] && initialLanguage !== currentLanguage) {
      setCurrentLanguage(initialLanguage);
      localStorage.setItem('app-language', initialLanguage);
    }
  }, [initialLanguage, currentLanguage]);

  const setLanguage = (language: string) => {
    if (translations[language]) {
      setCurrentLanguage(language);
      localStorage.setItem('app-language', language);
      
      // Update URL to reflect language change
      const currentPath = window.location.pathname;
      const supportedLanguages = ['en', 'es', 'zh-hk', 'zh', 'de', 'it', 'pt'];
      const pathParts = currentPath.split('/').filter(part => part);
      
      let newPath;
      if (pathParts.length > 0 && supportedLanguages.includes(pathParts[0])) {
        // Replace existing language in URL
        pathParts[0] = language;
        newPath = '/' + pathParts.join('/');
      } else {
        // Add language to URL
        newPath = `/${language}${currentPath === '/' ? '' : currentPath}`;
      }
      
      // Navigate to new URL
      window.history.pushState({}, '', newPath);
      // Trigger a popstate event to update the router
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const setLanguageByCountry = (countryName: string) => {
    const language = countryToLanguageMap[countryName];
    if (language) {
      setLanguage(language);
    }
  };

  const contextValue = {
    currentLanguage,
    setLanguage,
    setLanguageByCountry,
    translations
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = () => {
  const { currentLanguage, translations } = useLanguage();
  
  const t = (key: string): string => {
    return translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
  };

  return { t };
};

export { countryToLanguageMap };
