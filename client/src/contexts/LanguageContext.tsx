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
    'tv': "TV",
    'horse_racing': "Horse Racing",
    'snooker': "Snooker",
    'esports': "Esports",
    'handball': "Handball",
    'volleyball': "Volleyball",
    'rugby': "Rugby",
    'hockey': "Hockey",
    'american_football': "American Football",
    'settings': "Settings",
    'myScores': "My Scores",
    'live': "LIVE",
    'finished': "FT",
    'not_started': "Not Started",
    'featured_match': "Featured Match",
    'by_time': "by time",
    'sun': "Su",
    'mon': "Mo",
    'tue': "Tu",
    'wed': "We",
    'thu': "Th",
    'fri': "Fr",
    'sat': "Sa",
    'sunday': "Sunday",
    'monday': "Monday",
    'tuesday': "Tuesday",
    'wednesday': "Wednesday",
    'thursday': "Thursday",
    'friday': "Friday",
    'saturday': "Saturday",
    'month': "Month",
    'year': "Year",
    'next_month': "Next month",
    'previous_month': "Previous month",
    'today': "Today",
    'january': "January",
    'february': "February",
    'march': "March",
    'april': "April",
    'may': "May",
    'june': "June",
    'july': "July",
    'august': "August",
    'september': "September",
    'october': "October",
    'november': "November",
    'december': "December",
    'popular_football_leagues': "Popular FootballLeagues",
    'leagues_cup': "Leagues Cup",
    'world': "World",
    'ended': "Ended",
    'won_on_penalties': "won on penalties",
    'on_penalties': "on penalties"
  },
  'en-us': {
    'today_matches': "Today's Games",
    'yesterday_matches': "Yesterday's Games",
    'tomorrow_matches': "Tomorrow's Games",
    'live_matches': "Live Games",
    'football_leagues': "Soccer Leagues",
    'all_leagues': "All Leagues A-Z",
    'standings': "Standings",
    'fixtures': "Schedule",
    'results': "Results",
    'statistics': "Stats",
    'home': "Home",
    'away': "Away",
    'vs': "vs",
    'football': "Soccer",
    'basketball': "Basketball",
    'tv': "TV",
    'horse_racing': "Horse Racing",
    'snooker': "Snooker",
    'esports': "Esports",
    'settings': "Settings",
    'myScores': "My Scores",
    'live': "LIVE",
    'finished': "FT",
    'not_started': "Not Started",
    'featured_match': "Featured Game",
    'by_time': "by time",
    'sun': "Su",
    'mon': "Mo",
    'tue': "Tu",
    'wed': "We",
    'thu': "Th",
    'fri': "Fr",
    'sat': "Sa",
    'sunday': "Sunday",
    'monday': "Monday",
    'tuesday': "Tuesday",
    'wednesday': "Wednesday",
    'thursday': "Thursday",
    'friday': "Friday",
    'saturday': "Saturday",
    'month': "Month",
    'year': "Year",
    'next_month': "Next month",
    'previous_month': "Previous month",
    'today': "Today",
    'january': "January",
    'february': "February",
    'march': "March",
    'april': "April",
    'may': "May",
    'june': "June",
    'july': "July",
    'august': "August",
    'september': "September",
    'october': "October",
    'november': "November",
    'december': "December",
    'popular_football_leagues': "Popular Soccer Leagues",
    'leagues_cup': "Leagues Cup",
    'world': "World",
    'ended': "Ended"
  },
  'es': {
    'today_matches': "Partidos de Hoy",
    'yesterday_matches': "Partidos de Ayer",
    'tomorrow_matches': "Partidos de Mañana",
    'live_matches': "Partidos en Vivo",
    'football_leagues': "Ligas de Fútbol",
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
    'tv': "TV",
    'horse_racing': "Carreras de Caballos",
    'snooker': "Snooker",
    'esports': "Deportes Electrónicos",
    'handball': "Balonmano",
    'volleyball': "Voleibol",
    'rugby': "Rugby",
    'hockey': "Hockey",
    'american_football': "Fútbol Americano",
    'settings': "Configuración",
    'myScores': "Mis Marcadores",
    'live': "EN VIVO",
    'finished': "Finalizado",
    'not_started': "No Iniciado",
    'featured_match': "Partido Destacado",
    'by_time': "por hora",
    'sun': "Dom",
    'mon': "Lun",
    'tue': "Mar",
    'wed': "Mié",
    'thu': "Jue",
    'fri': "Vie",
    'sat': "Sáb",
    'sunday': "Domingo",
    'monday': "Lunes",
    'tuesday': "Martes",
    'wednesday': "Miércoles",
    'thursday': "Jueves",
    'friday': "Viernes",
    'saturday': "Sábado",
    'month': "Mes",
    'year': "Año",
    'next_month': "Mes siguiente",
    'previous_month': "Mes anterior",
    'today': "Hoy",
    'january': "Enero",
    'february': "Febrero",
    'march': "Marzo",
    'april': "Abril",
    'may': "Mayo",
    'june': "Junio",
    'july': "Julio",
    'august': "Agosto",
    'september': "Septiembre",
    'october': "Octubre",
    'november': "Noviembre",
    'december': "Diciembre",
    'popular_football_leagues': "Ligas de Fútbol Populares",
    'leagues_cup': "Copa de Ligas",
    'world': "Mundo",
    'ended': "Finalizado",
    'friendlies_clubs': "Amigables de Clubes",
    'uefa_europa_league': "Liga Europa de la UEFA",
    'uefa_europa_conference_league': "Liga Conferencia Europa de la UEFA",
    'uefa_champions_league': "Liga de Campeones de la UEFA",
    'copa_do_brasil': "Copa de Brasil",
    'primera_a_colombia': "Primera A Colombia",
    'bayern_münchen': "Bayern Múnich",
    'tottenham': "Tottenham",
    'won_on_penalties': "ganó en penales",
    'on_penalties': "en penales"
  },
  'zh-hk': {
    'today_matches': "今日比賽",
    'yesterday_matches': "昨日比賽",
    'tomorrow_matches': "明日比賽",
    'live_matches': "即時比賽",
    'football_leagues': "足球聯賽",
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
    'tv': "電視",
    'horse_racing': "賽馬",
    'snooker': "桌球",
    'esports': "電子競技",
    'handball': "手球",
    'volleyball': "排球",
    'rugby': "欖球",
    'hockey': "曲棍球",
    'american_football': "美式足球",
    'settings': "設定",
    'myScores': "我的比分",
    'live': "即時",
    'finished': "結束",
    'not_started': "未開始",
    'featured_match': "精選比賽",
    'by_time': "按時間",
    'sun': "日",
    'mon': "一",
    'tue': "二",
    'wed': "三",
    'thu': "四",
    'fri': "五",
    'sat': "六",
    'sunday': "星期日",
    'monday': "星期一",
    'tuesday': "星期二",
    'wednesday': "星期三",
    'thursday': "星期四",
    'friday': "星期五",
    'saturday': "星期六",
    'month': "月份",
    'year': "年份",
    'next_month': "下個月",
    'previous_month': "上個月",
    'today': "今天",
    'january': "一月",
    'february': "二月",
    'march': "三月",
    'april': "四月",
    'may': "五月",
    'june': "六月",
    'july': "七月",
    'august': "八月",
    'september': "九月",
    'october': "十月",
    'november': "十一月",
    'december': "十二月",
    'popular_football_leagues': "熱門足球聯賽",
    'leagues_cup': "聯賽盃",
    'world': "世界",
    'ended': "已結束",
    'friendlies_clubs': "球會友誼賽",
    'uefa_europa_league': "歐洲聯賽",
    'uefa_europa_conference_league': "歐洲協會聯賽",
    'uefa_champions_league': "歐洲冠軍聯賽",
    'copa_do_brasil': "巴西盃",
    'primera_a_colombia': "哥倫比亞甲級聯賽",
    'bayern_münchen': "拜仁慕尼黑",
    'tottenham': "熱刺",
    'won_on_penalties': "互射十二碼獲勝",
    'on_penalties': "互射十二碼"
  },
  'de': {
    'today_matches': "Heutige Spiele",
    'yesterday_matches': "Gestrige Spiele",
    'tomorrow_matches': "Morgige Spiele",
    'live_matches': "Live-Spiele",
    'football_leagues': "Fußball-Ligen",
    'all_leagues': "Alle Ligen A-Z",
    'standings': "Tabelle",
    'fixtures': "Spielplan",
    'results': "Ergebnisse",
    'statistics': "Statistiken",
    'home': "Heim",
    'away': "Auswärts",
    'vs': "gegen",
    'football': "Fußball",
    'basketball': "Basketball",
    'tv': "TV",
    'horse_racing': "Pferderennen",
    'snooker': "Snooker",
    'esports': "E-Sports",
    'handball': "Handball",
    'volleyball': "Volleyball",
    'rugby': "Rugby",
    'hockey': "Hockey",
    'american_football': "American Football",
    'settings': "Einstellungen",
    'myScores': "Meine Ergebnisse",
    'live': "LIVE",
    'finished': "Beendet",
    'not_started': "Nicht begonnen",
    'featured_match': "Ausgewähltes Spiel",
    'by_time': "nach Zeit",
    'sun': "So",
    'mon': "Mo",
    'tue': "Di",
    'wed': "Mi",
    'thu': "Do",
    'fri': "Fr",
    'sat': "Sa",
    'sunday': "Sonntag",
    'monday': "Montag",
    'tuesday': "Dienstag",
    'wednesday': "Mittwoch",
    'thursday': "Donnerstag",
    'friday': "Freitag",
    'saturday': "Samstag",
    'month': "Monat",
    'year': "Jahr",
    'next_month': "Nächster Monat",
    'previous_month': "Vorheriger Monat",
    'today': "Heute",
    'january': "Januar",
    'february': "Februar",
    'march': "März",
    'april': "April",
    'may': "Mai",
    'june': "Juni",
    'july': "Juli",
    'august': "August",
    'september': "September",
    'october': "Oktober",
    'november': "November",
    'december': "Dezember",
    'popular_football_leagues': "Beliebte Fußball-Ligen",
    'leagues_cup': "Liga-Pokal",
    'world': "Welt",
    'ended': "Beendet",
    'friendlies_clubs': "Vereinsfreundschaftsspiele",
    'uefa_europa_league': "UEFA Europa League",
    'uefa_europa_conference_league': "UEFA Europa Conference League",
    'uefa_champions_league': "UEFA Champions League",
    'copa_do_brasil': "Copa do Brasil",
    'primera_a_colombia': "Primera A Kolumbien",
    'bayern_münchen': "Bayern München",
    'tottenham': "Tottenham",
    'won_on_penalties': "gewann im Elfmeterschießen",
    'on_penalties': "im Elfmeterschießen"
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
    'tv': "TV",
    'horse_racing': "Corse di Cavalli",
    'snooker': "Snooker",
    'esports': "Esports",
    'handball': "Pallamano",
    'volleyball': "Pallavolo",
    'rugby': "Rugby",
    'hockey': "Hockey",
    'american_football': "Football Americano",
    'settings': "Impostazioni",
    'myScores': "I Miei Punteggi",
    'live': "LIVE",
    'finished': "Finita",
    'not_started': "Non Iniziata",
    'featured_match': "Partita in Evidenza",
    'by_time': "per orario",
    'sun': "Dom",
    'mon': "Lun",
    'tue': "Mar",
    'wed': "Mer",
    'thu': "Gio",
    'fri': "Ven",
    'sat': "Sab",
    'sunday': "Domenica",
    'monday': "Lunedì",
    'tuesday': "Martedì",
    'wednesday': "Mercoledì",
    'thursday': "Giovedì",
    'friday': "Venerdì",
    'saturday': "Sabato",
    'month': "Mese",
    'year': "Anno",
    'next_month': "Mese successivo",
    'previous_month': "Mese precedente",
    'today': "Oggi",
    'january': "Gennaio",
    'february': "Febbraio",
    'march': "Marzo",
    'april': "Aprile",
    'may': "Maggio",
    'june': "Giugno",
    'july': "Luglio",
    'august': "Agosto",
    'september': "Settembre",
    'october': "Ottobre",
    'november': "Novembre",
    'december': "Dicembre",
    'popular_football_leagues': "Campionati di Calcio Popolari",
    'leagues_cup': "Coppa delle Leghe",
    'world': "Mondo",
    'ended': "Finita",
    'friendlies_clubs': "Amichevoli di Club",
    'uefa_europa_league': "UEFA Europa League",
    'uefa_europa_conference_league': "UEFA Europa Conference League",
    'uefa_champions_league': "UEFA Champions League",
    'copa_do_brasil': "Copa do Brasil",
    'primera_a_colombia': "Primera A Colombia",
    'bayern_münchen': "Bayern Monaco",
    'tottenham': "Tottenham",
    'won_on_penalties': "ha vinto ai rigori",
    'on_penalties': "ai rigori"
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
    'tv': "TV",
    'horse_racing': "Corridas de Cavalos",
    'snooker': "Snooker",
    'esports': "Esports",
    'handball': "Andebol",
    'volleyball': "Voleibol",
    'rugby': "Rugby",
    'hockey': "Hockey",
    'american_football': "Futebol Americano",
    'settings': "Configurações",
    'myScores': "Meus Resultados",
    'live': "AO VIVO",
    'finished': "Terminado",
    'not_started': "Não Iniciado",
    'featured_match': "Jogo em Destaque",
    'by_time': "por hora",
    'sun': "Dom",
    'mon': "Seg",
    'tue': "Ter",
    'wed': "Qua",
    'thu': "Qui",
    'fri': "Sex",
    'sat': "Sáb",
    'sunday': "Domingo",
    'monday': "Segunda-feira",
    'tuesday': "Terça-feira",
    'wednesday': "Quarta-feira",
    'thursday': "Quinta-feira",
    'friday': "Sexta-feira",
    'saturday': "Sábado",
    'month': "Mês",
    'year': "Ano",
    'next_month': "Próximo mês",
    'previous_month': "Mês anterior",
    'today': "Hoje",
    'january': "Janeiro",
    'february': "Fevereiro",
    'march': "Março",
    'april': "Abril",
    'may': "Maio",
    'june': "Junho",
    'july': "Julho",
    'august': "Agosto",
    'september': "Setembro",
    'october': "Outubro",
    'november': "Novembro",
    'december': "Dezembro",
    'popular_football_leagues': "Ligas de Futebol Populares",
    'leagues_cup': "Taça das Ligas",
    'world': "Mundo",
    'ended': "Terminado",
    'friendlies_clubs': "Amigáveis de Clubes",
    'uefa_europa_league': "Liga Europa da UEFA",
    'uefa_europa_conference_league': "Liga Conferência Europa da UEFA",
    'uefa_champions_league': "Liga dos Campeões da UEFA",
    'copa_do_brasil': "Copa do Brasil",
    'primera_a_colombia': "Primera A Colômbia",
    'bayern_münchen': "Bayern de Munique",
    'tottenham': "Tottenham",
    'won_on_penalties': "venceu nos pênaltis",
    'on_penalties': "nos pênaltis"
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
    'tv': "电视",
    'horse_racing': "赛马",
    'snooker': "桌球",
    'esports': "电子竞技",
    'handball': "手球",
    'volleyball': "排球",
    'rugby': "橄榄球",
    'hockey': "曲棍球",
    'american_football': "美式足球",
    'settings': "设置",
    'myScores': "我的比分",
    'live': "直播",
    'finished': "结束",
    'not_started': "未开始",
    'featured_match': "精选比赛",
    'by_time': "按时间",
    'sun': "日",
    'mon': "一",
    'tue': "二",
    'wed': "三",
    'thu': "四",
    'fri': "五",
    'sat': "六",
    'sunday': "星期日",
    'monday': "星期一",
    'tuesday': "星期二",
    'wednesday': "星期三",
    'thursday': "星期四",
    'friday': "星期五",
    'saturday': "星期六",
    'month': "月份",
    'year': "年份",
    'next_month': "下个月",
    'previous_month': "上个月",
    'today': "今天",
    'january': "一月",
    'february': "二月",
    'march': "三月",
    'april': "四月",
    'may': "五月",
    'june': "六月",
    'july': "七月",
    'august': "八月",
    'september': "九月",
    'october': "十月",
    'november': "十一月",
    'december': "十二月",
    'popular_football_leagues': "热门足球联赛",
    'leagues_cup': "联赛杯",
    'world': "世界",
    'ended': "已结束"
  },
  'zh-tw': {
    'today_matches': "今日比賽",
    'yesterday_matches': "昨日比賽",
    'tomorrow_matches': "明日比賽",
    'live_matches': "即時比賽",
    'football_leagues': "足球聯賽",
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
    'tv': "電視",
    'horse_racing': "賽馬",
    'snooker': "桌球",
    'esports': "電子競技",
    'handball': "手球",
    'volleyball': "排球",
    'rugby': "欖球",
    'hockey': "曲棍球",
    'american_football': "美式足球",
    'settings': "設定",
    'myScores': "我的比分",
    'live': "即時",
    'finished': "結束",
    'not_started': "未開始",
    'featured_match': "精選比賽",
    'by_time': "按時間",
    'sun': "日",
    'mon': "一",
    'tue': "二",
    'wed': "三",
    'thu': "四",
    'fri': "五",
    'sat': "六",
    'sunday': "星期日",
    'monday': "星期一",
    'tuesday': "星期二",
    'wednesday': "星期三",
    'thursday': "星期四",
    'friday': "星期五",
    'saturday': "星期六",
    'month': "月份",
    'year': "年份",
    'next_month': "下個月",
    'previous_month': "上個月",
    'today': "今天",
    'january': "一月",
    'february': "二月",
    'march': "三月",
    'april': "四月",
    'may': "五月",
    'june': "六月",
    'july': "七月",
    'august': "八月",
    'september': "九月",
    'october': "十月",
    'november': "十一月",
    'december': "十二月",
    'popular_football_leagues': "熱門足球聯賽",
    'leagues_cup': "聯賽盃",
    'world': "世界",
    'ended': "已結束",
    'friendlies_clubs': "球會友誼賽",
    'uefa_europa_league': "歐洲聯賽",
    'uefa_europa_conference_league': "歐洲協會聯賽",
    'uefa_champions_league': "歐洲冠軍聯賽",
    'copa_do_brasil': "巴西盃",
    'primera_a_colombia': "哥倫比亞甲級聯賽",
    'bayern_münchen': "拜仁慕尼黑",
    'tottenham': "熱刺",
    'won_on_penalties': "PK大戰獲勝",
    'on_penalties': "PK大戰"
  }
};

const countryToLanguageMap: { [key: string]: string } = {
  'United States': 'en-us',
  'United Kingdom': 'en',
  'Spain': 'es',
  'Hong Kong': 'zh-hk',
  'Taiwan': 'zh-tw',
  'China': 'zh',
  'Germany': 'de',
  'Austria': 'de-at',
  'Italy': 'it',
  'Portugal': 'pt',
  'Brazil': 'pt-br',
  'Mexico': 'es-mx',
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
    }
  };

  const setLanguageWithUrlUpdate = (language: string) => {
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
    setLanguageWithUrlUpdate,
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
    console.error('useLanguage must be used within a LanguageProvider');
    // Return a fallback context to prevent app crashes
    return {
      currentLanguage: 'en',
      setLanguage: () => {},
      setLanguageWithUrlUpdate: () => {},
      setLanguageByCountry: () => {},
      translations
    };
  }
  return context;
};

export const useTranslation = () => {
  const { currentLanguage, translations } = useLanguage();

  const t = (key: string): string => {
    return translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
  };

  // Dynamic league name translation function
  const translateLeagueName = (leagueName: string): string => {
    if (!leagueName) return leagueName;

    const lowerName = leagueName.toLowerCase();

    // Enhanced mixed language patterns for complex league names
    const mixedLanguagePatterns = {
      // UEFA Europa League variations
      'uefaeuropa 歐洲協會聯賽': {
        'en': 'UEFA Europa League',
        'es': 'UEFA Liga Europa',
        'zh-hk': 'UEFA 歐洲聯賽',
        'zh-tw': 'UEFA 歐洲聯賽',
        'zh': 'UEFA 欧洲联赛',
        'de': 'UEFA Europa League',
        'it': 'UEFA Europa League',
        'pt': 'UEFA Liga Europa'
      },
      'uefa 歐洲聯賽': {
        'en': 'UEFA Europa League',
        'es': 'UEFA Liga Europa',
        'zh-hk': 'UEFA 歐洲聯賽',
        'zh-tw': 'UEFA 歐洲聯賽',
        'zh': 'UEFA 欧洲联赛',
        'de': 'UEFA Europa League',
        'it': 'UEFA Europa League',
        'pt': 'UEFA Liga Europa'
      },
      'uefaeuropa': {
        'en': 'UEFA Europa League',
        'es': 'UEFA Liga Europa',
        'zh-hk': 'UEFA 歐洲聯賽',
        'zh-tw': 'UEFA 歐洲聯賽',
        'zh': 'UEFA 欧洲联赛',
        'de': 'UEFA Europa League',
        'it': 'UEFA Europa League',
        'pt': 'UEFA Liga Europa'
      },
      // Conference League variations
      'uefa 歐洲協會聯賽': {
        'en': 'UEFA Conference League',
        'es': 'UEFA Liga de la Conferencia',
        'zh-hk': 'UEFA 歐洲協會聯賽',
        'zh-tw': 'UEFA 歐洲協會聯賽',
        'zh': 'UEFA 欧洲协会联赛',
        'de': 'UEFA Conference League',
        'it': 'UEFA Conference League',
        'pt': 'UEFA Liga da Conferência'
      },
      // Champions League variations
      'uefa 歐洲冠軍聯賽': {
        'en': 'UEFA Champions League',
        'es': 'UEFA Liga de Campeones',
        'zh-hk': 'UEFA 歐洲冠軍聯賽',
        'zh-tw': 'UEFA 歐洲冠軍聯賽',
        'zh': 'UEFA 欧洲冠军联赛',
        'de': 'UEFA Champions League',
        'it': 'UEFA Champions League',
        'pt': 'UEFA Liga dos Campeões'
      },
      // Friendlies variations
      '友誼賽 clubs': {
        'en': 'Club Friendlies',
        'es': 'Amistosos de Clubes',
        'zh-hk': '球會友誼賽',
        'zh-tw': '球會友誼賽',
        'zh': '俱乐部友谊赛',
        'de': 'Vereinsfreundschaftsspiele',
        'it': 'Amichevoli di Club',
        'pt': 'Amigáveis de Clubes'
      }
    };

    // Check for exact mixed language patterns first (case insensitive)
    for (const [pattern, translations] of Object.entries(mixedLanguagePatterns)) {
      if (lowerName.includes(pattern.toLowerCase())) {
        const translation = translations[currentLanguage as keyof typeof translations];
        if (translation) {
          return translation;
        }
      }
    }

    // First, handle direct Chinese league name detection
    const chineseLeaguePatterns = {
      '友誼賽': {
        'en': 'Friendlies',
        'es': 'Amistosos',
        'zh-hk': '友誼賽',
        'zh-tw': '友誼賽',
        'zh': '友谊赛',
        'de': 'Freundschaftsspiele',
        'it': 'Amichevoli',
        'pt': 'Amigáveis'
      },
      '球會友誼賽': {
        'en': 'Club Friendlies',
        'es': 'Amistosos de Clubes',
        'zh-hk': '球會友誼賽',
        'zh-tw': '球會友誼賽',
        'zh': '俱乐部友谊赛',
        'de': 'Vereinsfreundschaftsspiele',
        'it': 'Amichevoli di Club',
        'pt': 'Amigáveis de Clubes'
      },
      '歐洲聯賽': {
        'en': 'Europa League',
        'es': 'Liga Europa',
        'zh-hk': '歐洲聯賽',
        'zh-tw': '歐洲聯賽',
        'zh': '欧洲联赛',
        'de': 'Europa League',
        'it': 'Europa League',
        'pt': 'Liga Europa'
      },
      '歐洲冠軍聯賽': {
        'en': 'Champions League',
        'es': 'Liga de Campeones',
        'zh-hk': '歐洲冠軍聯賽',
        'zh-tw': '歐洲冠軍聯賽',
        'zh': '欧洲冠军联赛',
        'de': 'Champions League',
        'it': 'Champions League',
        'pt': 'Liga dos Campeões'
      },
      '歐洲協會聯賽': {
        'en': 'Conference League',
        'es': 'Liga de la Conferencia',
        'zh-hk': '歐洲協會聯賽',
        'zh-tw': '歐洲協會聯賽',
        'zh': '欧洲协会联赛',
        'de': 'Conference League',
        'it': 'Conference League',
        'pt': 'Liga da Conferência'
      },
      '聯賽盃': {
        'en': 'Leagues Cup',
        'es': 'Copa de Ligas',
        'zh-hk': '聯賽盃',
        'zh-tw': '聯賽盃',
        'zh': '联赛杯',
        'de': 'Liga-Pokal',
        'it': 'Coppa delle Leghe',
        'pt': 'Copa das Ligas'
      },
      '世界': {
        'en': 'World',
        'es': 'Mundial',
        'zh-hk': '世界',
        'zh-tw': '世界',
        'zh': '世界',
        'de': 'Welt',
        'it': 'Mondo',
        'pt': 'Mundo'
      }
    };

    // Check for Chinese patterns
    for (const [chinesePattern, translations] of Object.entries(chineseLeaguePatterns)) {
      if (leagueName.includes(chinesePattern)) {
        const translation = translations[currentLanguage as keyof typeof translations];
        if (translation) {
          // For pure Chinese patterns, do a smart replacement
          let result = leagueName.replace(chinesePattern, translation);

          // Clean up any remaining mixed language artifacts
          result = result.replace(/\s+/g, ' ').trim();

          // Handle specific combinations like "友誼賽 Clubs" -> "Club Friendlies"
          if (chinesePattern === '友誼賽' && leagueName.toLowerCase().includes('clubs')) {
            result = translations[currentLanguage as keyof typeof translations] === 'Friendlies'
              ? 'Club Friendlies'
              : `${translation} Clubs`;
          }

          return result;
        }
      }
    }

    // Common league patterns and their translations (existing English patterns)
    const leaguePatterns = {
      'champions league': {
        'en': 'Champions League',
        'es': 'Liga de Campeones',
        'zh-hk': '歐洲冠軍聯賽',
        'zh-tw': '歐洲冠軍聯賽',
        'zh': '欧洲冠军联赛',
        'de': 'Champions League',
        'it': 'Champions League',
        'pt': 'Liga dos Campeões'
      },
      'europa league': {
        'en': 'Europa League',
        'es': 'Liga Europa',
        'zh-hk': '歐洲聯賽',
        'zh-tw': '歐洲聯賽',
        'zh': '欧洲联赛',
        'de': 'Europa League',
        'it': 'Europa League',
        'pt': 'Liga Europa'
      },
      'conference league': {
        'en': 'Conference League',
        'es': 'Liga de la Conferencia',
        'zh-hk': '歐洲協會聯賽',
        'zh-tw': '歐洲協會聯賽',
        'zh': '欧洲协会联赛',
        'de': 'Conference League',
        'it': 'Conference League',
        'pt': 'Liga da Conferência'
      },
      'premier league': {
        'en': 'Premier League',
        'es': 'Premier League',
        'zh-hk': '英超',
        'zh-tw': '英超',
        'zh': '英超',
        'de': 'Premier League',
        'it': 'Premier League',
        'pt': 'Premier League'
      },
      'la liga': {
        'en': 'La Liga',
        'es': 'La Liga',
        'zh-hk': '西甲',
        'zh-tw': '西甲',
        'zh': '西甲',
        'de': 'La Liga',
        'it': 'La Liga',
        'pt': 'La Liga'
      },
      'serie a': {
        'en': 'Serie A',
        'es': 'Serie A',
        'zh-hk': '意甲',
        'zh-tw': '意甲',
        'zh': '意甲',
        'de': 'Serie A',
        'it': 'Serie A',
        'pt': 'Serie A'
      },
      'bundesliga': {
        'en': 'Bundesliga',
        'es': 'Bundesliga',
        'zh-hk': '德甲',
        'zh-tw': '德甲',
        'zh': '德甲',
        'de': 'Bundesliga',
        'it': 'Bundesliga',
        'pt': 'Bundesliga'
      },
      'ligue 1': {
        'en': 'Ligue 1',
        'es': 'Ligue 1',
        'zh-hk': '法甲',
        'zh-tw': '法甲',
        'zh': '法甲',
        'de': 'Ligue 1',
        'it': 'Ligue 1',
        'pt': 'Ligue 1'
      },
      'world cup': {
        'en': 'World Cup',
        'es': 'Copa del Mundo',
        'zh-hk': '世界盃',
        'zh-tw': '世界盃',
        'zh': '世界杯',
        'de': 'Weltmeisterschaft',
        'it': 'Coppa del Mondo',
        'pt': 'Copa do Mundo'
      },
      'friendlies': {
        'en': 'Friendlies',
        'es': 'Amistosos',
        'zh-hk': '友誼賽',
        'zh-tw': '友誼賽',
        'zh': '友谊赛',
        'de': 'Freundschaftsspiele',
        'it': 'Amichevoli',
        'pt': 'Amigáveis'
      },
      'club friendlies': {
        'en': 'Club Friendlies',
        'es': 'Amistosos de Clubes',
        'zh-hk': '球會友誼賽',
        'zh-tw': '球會友誼賽',
        'zh': '俱乐部友谊赛',
        'de': 'Vereinsfreundschaftsspiele',
        'it': 'Amichevoli di Club',
        'pt': 'Amigáveis de Clubes'
      },
      'leagues cup': {
        'en': 'Leagues Cup',
        'es': 'Copa de Ligas',
        'zh-hk': '聯賽盃',
        'zh-tw': '聯賽盃',
        'zh': '联赛杯',
        'de': 'Liga-Pokal',
        'it': 'Coppa delle Leghe',
        'pt': 'Copa das Ligas'
      },
      'copa america': {
        'en': 'Copa America',
        'es': 'Copa América',
        'zh-hk': '美洲盃',
        'zh-tw': '美洲盃',
        'zh': '美洲杯',
        'de': 'Copa América',
        'it': 'Copa América',
        'pt': 'Copa América'
      },
      'copa libertadores': {
        'en': 'Copa Libertadores',
        'es': 'Copa Libertadores',
        'zh-hk': '自由盃',
        'zh-tw': '自由盃',
        'zh': '自由杯',
        'de': 'Copa Libertadores',
        'it': 'Copa Libertadores',
        'pt': 'Copa Libertadores'
      },
      'copa do brasil': {
        'en': 'Copa do Brasil',
        'es': 'Copa de Brasil',
        'zh-hk': '巴西盃',
        'zh-tw': '巴西盃',
        'zh': '巴西杯',
        'de': 'Copa do Brasil',
        'it': 'Copa do Brasil',
        'pt': 'Copa do Brasil'
      },
      'primera a': {
        'en': 'Primera A Colombia',
        'es': 'Primera A Colombia',
        'zh-hk': '哥倫比亞甲級聯賽',
        'zh-tw': '哥倫比亞甲級聯賽',
        'zh': '哥伦比亚甲级联赛',
        'de': 'Primera A Kolumbien',
        'it': 'Primera A Colombia',
        'pt': 'Primeira Divisão Colômbia'
      },
      'colombia': {
        'en': 'Colombia',
        'es': 'Colombia',
        'zh-hk': '哥倫比亞',
        'zh-tw': '哥倫比亞',
        'zh': '哥伦比亚',
        'de': 'Kolumbien',
        'it': 'Colombia',
        'pt': 'Colômbia'
      },
      'brazil': {
        'en': 'Brazil',
        'es': 'Brasil',
        'zh-hk': '巴西',
        'zh-tw': '巴西',
        'zh': '巴西',
        'de': 'Brasilien',
        'it': 'Brasile',
        'pt': 'Brasil'
      },
      'egypt': {
        'en': 'Egypt',
        'es': 'Egipto',
        'zh-hk': '埃及',
        'zh-tw': '埃及',
        'zh': '埃及',
        'de': 'Ägypten',
        'it': 'Egitto',
        'pt': 'Egito'
      },
      'argentina': {
        'en': 'Argentina',
        'es': 'Argentina',
        'zh-hk': '阿根廷',
        'zh-tw': '阿根廷',
        'zh': '阿根廷',
        'de': 'Argentinien',
        'it': 'Argentina',
        'pt': 'Argentina'
      },
      'bayern münchen': {
        'en': 'Bayern Munich',
        'es': 'Bayern Múnich',
        'zh-hk': '拜仁慕尼黑',
        'zh-tw': '拜仁慕尼黑',
        'zh': '拜仁慕尼黑',
        'de': 'Bayern München',
        'it': 'Bayern Monaco',
        'pt': 'Bayern de Munique'
      },
      'bayern munich': {
        'en': 'Bayern Munich',
        'es': 'Bayern Múnich',
        'zh-hk': '拜仁慕尼黑',
        'zh-tw': '拜仁慕尼黑',
        'zh': '拜仁慕尼黑',
        'de': 'Bayern München',
        'it': 'Bayern Monaco',
        'pt': 'Bayern de Munique'
      },
      'tottenham': {
        'en': 'Tottenham',
        'es': 'Tottenham',
        'zh-hk': '熱刺',
        'zh-tw': '熱刺',
        'zh': '热刺',
        'de': 'Tottenham',
        'it': 'Tottenham',
        'pt': 'Tottenham'
      },
      'liga profesional argentina': {
        'en': 'Liga Profesional Argentina',
        'es': 'Liga Profesional Argentina',
        'zh-hk': '阿根廷職業聯賽',
        'zh-tw': '阿根廷職業聯賽',
        'zh': '阿根廷职业联赛',
        'de': 'Liga Profesional Argentina',
        'it': 'Liga Profesional Argentina',
        'pt': 'Liga Profesional Argentina'
      },
      'liga profesional': {
        'en': 'Liga Profesional',
        'es': 'Liga Profesional',
        'zh-hk': '職業聯賽',
        'zh-tw': '職業聯賽',
        'zh': '职业联赛',
        'de': 'Liga Profesional',
        'it': 'Liga Profesional',
        'pt': 'Liga Profesional'
      },
      'primera división': {
        'en': 'Primera División',
        'es': 'Primera División',
        'zh-hk': '甲級聯賽',
        'zh-tw': '甲級聯賽',
        'zh': '甲级联赛',
        'de': 'Primera División',
        'it': 'Primera División',
        'pt': 'Primera Divisão'
      }
    };

    // Check for exact pattern matches
    for (const [pattern, translations] of Object.entries(leaguePatterns)) {
      if (lowerName.includes(pattern)) {
        const translation = translations[currentLanguage as keyof typeof translations];
        if (translation) {
          // Replace the pattern in the original name while preserving case and other parts
          const regex = new RegExp(pattern, 'gi');
          return leagueName.replace(regex, translation);
        }
      }
    }

    // Specific check for "Liga Profesional Argentina" - complete name translation
    if (leagueName.toLowerCase().includes('liga profesional') &&
        (leagueName.toLowerCase().includes('argentina') || leagueName.includes('阿根廷'))) {
      return {
        'en': 'Liga Profesional Argentina',
        'es': 'Liga Profesional Argentina',
        'zh-hk': '阿根廷職業聯賽',
        'zh-tw': '阿根廷職業聯賽',
        'zh': '阿根廷职业联赛',
        'de': 'Liga Profesional Argentina',
        'it': 'Liga Profesional Argentina',
        'pt': 'Liga Profesional Argentina'
      }[currentLanguage] || leagueName;
    }

    // Additional pattern for exact Liga Profesional Argentina match
    if (leagueName.toLowerCase().includes('liga profesional argentina') ||
        leagueName === 'Liga Profesional Argentina') {
      return {
        'en': 'Liga Profesional Argentina',
        'es': 'Liga Profesional Argentina',
        'zh-hk': '阿根廷職業聯賽',
        'zh-tw': '阿根廷職業聯賽',
        'zh': '阿根廷职业联赛',
        'de': 'Liga Profesional Argentina',
        'it': 'Liga Profesional Argentina',
        'pt': 'Liga Profesional Argentina'
      }[currentLanguage] || leagueName;
    }

    // Return original name if no pattern matched
    return leagueName;
  };

  // Team name translation function with comprehensive translations
  const translateTeamName = (teamName: string): string => {
    if (!teamName) return teamName;

    const teamTranslations: { [key: string]: { [key: string]: string } } = {
      // Premier League Teams (League ID: 38)
      'Manchester United': {
        'en': 'Manchester United',
        'es': 'Manchester United',
        'zh-hk': '曼聯',
        'zh-tw': '曼聯',
        'zh': '曼联',
        'de': 'Manchester United',
        'it': 'Manchester United',
        'pt': 'Manchester United'
      },
      'Manchester City': {
        'en': 'Manchester City',
        'es': 'Manchester City',
        'zh-hk': '曼城',
        'zh-tw': '曼城',
        'zh': '曼城',
        'de': 'Manchester City',
        'it': 'Manchester City',
        'pt': 'Manchester City'
      },
      'Liverpool': {
        'en': 'Liverpool',
        'es': 'Liverpool',
        'zh-hk': '利物浦',
        'zh-tw': '利物浦',
        'zh': '利物浦',
        'de': 'Liverpool',
        'it': 'Liverpool',
        'pt': 'Liverpool'
      },
      'Chelsea': {
        'en': 'Chelsea',
        'es': 'Chelsea',
        'zh-hk': '車路士',
        'zh-tw': '切爾西',
        'zh': '切尔西',
        'de': 'Chelsea',
        'it': 'Chelsea',
        'pt': 'Chelsea'
      },
      'Arsenal': {
        'en': 'Arsenal',
        'es': 'Arsenal',
        'zh-hk': '阿仙奴',
        'zh-tw': '阿森納',
        'zh': '阿森纳',
        'de': 'Arsenal',
        'it': 'Arsenal',
        'pt': 'Arsenal'
      },
      'Tottenham': {
        'en': 'Tottenham',
        'es': 'Tottenham',
        'zh-hk': '熱刺',
        'zh-tw': '熱刺',
        'zh': '热刺',
        'de': 'Tottenham',
        'it': 'Tottenham',
        'pt': 'Tottenham'
      },
      'Newcastle United': {
        'en': 'Newcastle United',
        'es': 'Newcastle United',
        'zh-hk': '紐卡素',
        'zh-tw': '紐卡索',
        'zh': '纽卡斯尔',
        'de': 'Newcastle United',
        'it': 'Newcastle United',
        'pt': 'Newcastle United'
      },
      'Aston Villa': {
        'en': 'Aston Villa',
        'es': 'Aston Villa',
        'zh-hk': '阿士東維拉',
        'zh-tw': '阿斯頓維拉',
        'zh': '阿斯顿维拉',
        'de': 'Aston Villa',
        'it': 'Aston Villa',
        'pt': 'Aston Villa'
      },
      'Brighton': {
        'en': 'Brighton',
        'es': 'Brighton',
        'zh-hk': '布萊頓',
        'zh-tw': '布萊頓',
        'zh': '布赖顿',
        'de': 'Brighton',
        'it': 'Brighton',
        'pt': 'Brighton'
      },
      'West Ham': {
        'en': 'West Ham',
        'es': 'West Ham',
        'zh-hk': '韋斯咸',
        'zh-tw': '西漢姆',
        'zh': '西汉姆',
        'de': 'West Ham',
        'it': 'West Ham',
        'pt': 'West Ham'
      },

      // Ligue 1 Teams (League ID: 15)
      'Paris Saint-Germain': {
        'en': 'Paris Saint-Germain',
        'es': 'Paris Saint-Germain',
        'zh-hk': '巴黎聖日耳門',
        'zh-tw': '巴黎聖日耳曼',
        'zh': '巴黎圣日耳曼',
        'de': 'Paris Saint-Germain',
        'it': 'Paris Saint-Germain',
        'pt': 'Paris Saint-Germain'
      },
      'PSG': {
        'en': 'PSG',
        'es': 'PSG',
        'zh-hk': '巴黎聖日耳門',
        'zh-tw': '巴黎聖日耳曼',
        'zh': '巴黎圣日耳曼',
        'de': 'PSG',
        'it': 'PSG',
        'pt': 'PSG'
      },
      'Olympique Marseille': {
        'en': 'Marseille',
        'es': 'Marsella',
        'zh-hk': '馬賽',
        'zh-tw': '馬賽',
        'zh': '马赛',
        'de': 'Marseille',
        'it': 'Marsiglia',
        'pt': 'Marselha'
      },
      'Monaco': {
        'en': 'Monaco',
        'es': 'Monaco',
        'zh-hk': '摩納哥',
        'zh-tw': '摩納哥',
        'zh': '摩纳哥',
        'de': 'Monaco',
        'it': 'Monaco',
        'pt': 'Monaco'
      },
      'Lyon': {
        'en': 'Lyon',
        'es': 'Lyon',
        'zh-hk': '里昂',
        'zh-tw': '里昂',
        'zh': '里昂',
        'de': 'Lyon',
        'it': 'Lione',
        'pt': 'Lyon'
      },

      // La Liga Teams (League ID: 2)
      'Real Madrid': {
        'en': 'Real Madrid',
        'es': 'Real Madrid',
        'zh-hk': '皇家馬德里',
        'zh-tw': '皇家馬德里',
        'zh': '皇家马德里',
        'de': 'Real Madrid',
        'it': 'Real Madrid',
        'pt': 'Real Madrid'
      },
      'FC Barcelona': {
        'en': 'Barcelona',
        'es': 'Barcelona',
        'zh-hk': '巴塞隆拿',
        'zh-tw': '巴塞隆納',
        'zh': '巴塞罗那',
        'de': 'Barcelona',
        'it': 'Barcellona',
        'pt': 'Barcelona'
      },
      'Barcelona': {
        'en': 'Barcelona',
        'es': 'Barcelona',
        'zh-hk': '巴塞隆拿',
        'zh-tw': '巴塞隆納',
        'zh': '巴塞罗那',
        'de': 'Barcelona',
        'it': 'Barcellona',
        'pt': 'Barcelona'
      },
      'Atletico Madrid': {
        'en': 'Atletico Madrid',
        'es': 'Atlético Madrid',
        'zh-hk': '馬德里體育會',
        'zh-tw': '馬德里競技',
        'zh': '马德里竞技',
        'de': 'Atlético Madrid',
        'it': 'Atlético Madrid',
        'pt': 'Atlético de Madrid'
      },
      'Sevilla': {
        'en': 'Sevilla',
        'es': 'Sevilla',
        'zh-hk': '西維爾',
        'zh-tw': '塞維利亞',
        'zh': '塞维利亚',
        'de': 'Sevilla',
        'it': 'Siviglia',
        'pt': 'Sevilha'
      },
      'Real Sociedad': {
        'en': 'Real Sociedad',
        'es': 'Real Sociedad',
        'zh-hk': '皇家蘇斯達',
        'zh-tw': '皇家社會',
        'zh': '皇家社会',
        'de': 'Real Sociedad',
        'it': 'Real Sociedad',
        'pt': 'Real Sociedad'
      },

      // Bundesliga Teams (League ID: 4)
      'Bayern München': {
        'en': 'Bayern Munich',
        'es': 'Bayern Múnich',
        'zh-hk': '拜仁慕尼黑',
        'zh-tw': '拜仁慕尼黑',
        'zh': '拜仁慕尼黑',
        'de': 'Bayern München',
        'it': 'Bayern Monaco',
        'pt': 'Bayern de Munique'
      },
      'Bayern Munich': {
        'en': 'Bayern Munich',
        'es': 'Bayern Múnich',
        'zh-hk': '拜仁慕尼黑',
        'zh-tw': '拜仁慕尼黑',
        'zh': '拜仁慕尼黑',
        'de': 'Bayern München',
        'it': 'Bayern Monaco',
        'pt': 'Bayern de Munique'
      },
      'Borussia Dortmund': {
        'en': 'Borussia Dortmund',
        'es': 'Borussia Dortmund',
        'zh-hk': '多蒙特',
        'zh-tw': '多特蒙德',
        'zh': '多特蒙德',
        'de': 'Borussia Dortmund',
        'it': 'Borussia Dortmund',
        'pt': 'Borussia Dortmund'
      },
      'RB Leipzig': {
        'en': 'RB Leipzig',
        'es': 'RB Leipzig',
        'zh-hk': '萊比錫紅牛',
        'zh-tw': '萊比錫紅牛',
        'zh': '莱比锡红牛',
        'de': 'RB Leipzig',
        'it': 'RB Leipzig',
        'pt': 'RB Leipzig'
      },
      'Bayer Leverkusen': {
        'en': 'Bayer Leverkusen',
        'es': 'Bayer Leverkusen',
        'zh-hk': '利華古遜',
        'zh-tw': '勒沃庫森',
        'zh': '勒沃库森',
        'de': 'Bayer Leverkusen',
        'it': 'Bayer Leverkusen',
        'pt': 'Bayer Leverkusen'
      },

      // Serie A Teams (League ID: 71)
      'Juventus': {
        'en': 'Juventus',
        'es': 'Juventus',
        'zh-hk': '祖雲達斯',
        'zh-tw': '尤文圖斯',
        'zh': '尤文图斯',
        'de': 'Juventus',
        'it': 'Juventus',
        'pt': 'Juventus'
      },
      'AC Milan': {
        'en': 'AC Milan',
        'es': 'AC Milan',
        'zh-hk': 'AC米蘭',
        'zh-tw': 'AC米蘭',
        'zh': 'AC米兰',
        'de': 'AC Mailand',
        'it': 'AC Milan',
        'pt': 'AC Milan'
      },
      'Inter Milan': {
        'en': 'Inter Milan',
        'es': 'Inter de Milán',
        'zh-hk': '國際米蘭',
        'zh-tw': '國際米蘭',
        'zh': '国际米兰',
        'de': 'Inter Mailand',
        'it': 'Inter',
        'pt': 'Inter de Milão'
      },
      'AS Roma': {
        'en': 'Roma',
        'es': 'Roma',
        'zh-hk': '羅馬',
        'zh-tw': '羅馬',
        'zh': '罗马',
        'de': 'Rom',
        'it': 'Roma',
        'pt': 'Roma'
      },
      'Napoli': {
        'en': 'Napoli',
        'es': 'Nápoles',
        'zh-hk': '拿玻里',
        'zh-tw': '那不勒斯',
        'zh': '那不勒斯',
        'de': 'Neapel',
        'it': 'Napoli',
        'pt': 'Nápoles'
      },

      // North American Teams (MLS - Leagues Cup)
      'Los Angeles Galaxy': {
        'en': 'Los Angeles Galaxy',
        'es': 'Los Angeles Galaxy',
        'zh-hk': '洛杉磯銀河',
        'zh-tw': '洛杉磯銀河',
        'zh': '洛杉矶银河',
        'de': 'Los Angeles Galaxy',
        'it': 'Los Angeles Galaxy',
        'pt': 'Los Angeles Galaxy'
      },
      'LA Galaxy': {
        'en': 'LA Galaxy',
        'es': 'LA Galaxy',
        'zh-hk': '洛杉磯銀河',
        'zh-tw': '洛杉磯銀河',
        'zh': '洛杉矶银河',
        'de': 'LA Galaxy',
        'it': 'LA Galaxy',
        'pt': 'LA Galaxy'
      },
      'Inter Miami': {
        'en': 'Inter Miami',
        'es': 'Inter Miami',
        'zh-hk': '國際邁阿密',
        'zh-tw': '國際邁阿密',
        'zh': '国际迈阿密',
        'de': 'Inter Miami',
        'it': 'Inter Miami',
        'pt': 'Inter Miami'
      },
      'New York City FC': {
        'en': 'New York City FC',
        'es': 'New York City FC',
        'zh-hk': '紐約城',
        'zh-tw': '紐約城',
        'zh': '纽约城',
        'de': 'New York City FC',
        'it': 'New York City FC',
        'pt': 'New York City FC'
      },
      'New York Red Bulls': {
        'en': 'New York Red Bulls',
        'es': 'New York Red Bulls',
        'zh-hk': '紐約紅牛',
        'zh-tw': '紐約紅牛',
        'zh': '纽约红牛',
        'de': 'New York Red Bulls',
        'it': 'New York Red Bulls',
        'pt': 'New York Red Bulls'
      },
      'LAFC': {
        'en': 'LAFC',
        'es': 'LAFC',
        'zh-hk': '洛杉磯FC',
        'zh-tw': '洛杉磯FC',
        'zh': '洛杉矶FC',
        'de': 'LAFC',
        'it': 'LAFC',
        'pt': 'LAFC'
      },
      'Seattle Sounders': {
        'en': 'Seattle Sounders',
        'es': 'Seattle Sounders',
        'zh-hk': '西雅圖海灣人',
        'zh-tw': '西雅圖海灣人',
        'zh': '西雅图海湾人',
        'de': 'Seattle Sounders',
        'it': 'Seattle Sounders',
        'pt': 'Seattle Sounders'
      },
      'Colorado Rapids': {
        'en': 'Colorado Rapids',
        'es': 'Colorado Rapids',
        'zh-hk': '科羅拉多急流',
        'zh-tw': '科羅拉多急流',
        'zh': '科罗拉多急流',
        'de': 'Colorado Rapids',
        'it': 'Colorado Rapids',
        'pt': 'Colorado Rapids'
      },
      'FC Cincinnati': {
        'en': 'FC Cincinnati',
        'es': 'FC Cincinnati',
        'zh-hk': '辛辛那提',
        'zh-tw': '辛辛那提',
        'zh': '辛辛那提',
        'de': 'FC Cincinnati',
        'it': 'FC Cincinnati',
        'pt': 'FC Cincinnati'
      },
      'Charlotte FC': {
        'en': 'Charlotte FC',
        'es': 'Charlotte FC',
        'zh-hk': '夏洛特',
        'zh-tw': '夏洛特',
        'zh': '夏洛特',
        'de': 'Charlotte FC',
        'it': 'Charlotte FC',
        'pt': 'Charlotte FC'
      },
      'Charlotte': {
        'en': 'Charlotte',
        'es': 'Charlotte',
        'zh-hk': '夏洛特',
        'zh-tw': '夏洛特',
        'zh': '夏洛特',
        'de': 'Charlotte',
        'it': 'Charlotte',
        'pt': 'Charlotte'
      },
      'Atlanta United': {
        'en': 'Atlanta United',
        'es': 'Atlanta United',
        'zh-hk': '亞特蘭大聯',
        'zh-tw': '亞特蘭大聯',
        'zh': '亚特兰大联',
        'de': 'Atlanta United',
        'it': 'Atlanta United',
        'pt': 'Atlanta United'
      },
      'Portland Timbers': {
        'en': 'Portland Timbers',
        'es': 'Portland Timbers',
        'zh-hk': '波特蘭伐木者',
        'zh-tw': '波特蘭伐木者',
        'zh': '波特兰伐木者',
        'de': 'Portland Timbers',
        'it': 'Portland Timbers',
        'pt': 'Portland Timbers'
      },
      'Sporting Kansas City': {
        'en': 'Sporting Kansas City',
        'es': 'Sporting Kansas City',
        'zh-hk': '堪薩斯城體育會',
        'zh-tw': '堪薩斯城體育會',
        'zh': '堪萨斯城体育会',
        'de': 'Sporting Kansas City',
        'it': 'Sporting Kansas City',
        'pt': 'Sporting Kansas City'
      },

      // Liga MX Teams
      'Cruz Azul': {
        'en': 'Cruz Azul',
        'es': 'Cruz Azul',
        'zh-hk': '藍十字',
        'zh-tw': '藍十字',
        'zh': '蓝十字',
        'de': 'Cruz Azul',
        'it': 'Cruz Azul',
        'pt': 'Cruz Azul'
      },
      'Club América': {
        'en': 'Club América',
        'es': 'Club América',
        'zh-hk': '美洲',
        'zh-tw': '美洲',
        'zh': '美洲',
        'de': 'Club América',
        'it': 'Club América',
        'pt': 'Club América'
      },
      'América': {
        'en': 'América',
        'es': 'América',
        'zh-hk': '美洲',
        'zh-tw': '美洲',
        'zh': '美洲',
        'de': 'América',
        'it': 'América',
        'pt': 'América'
      },
      'Chivas': {
        'en': 'Chivas',
        'es': 'Chivas',
        'zh-hk': '芝華士',
        'zh-tw': '芝華士',
        'zh': '芝华士',
        'de': 'Chivas',
        'it': 'Chivas',
        'pt': 'Chivas'
      },
      'Guadalajara': {
        'en': 'Guadalajara',
        'es': 'Guadalajara',
        'zh-hk': '芝華士',
        'zh-tw': '芝華士',
        'zh': '芝华士',
        'de': 'Guadalajara',
        'it': 'Guadalajara',
        'pt': 'Guadalajara'
      },
      'Santos Laguna': {
        'en': 'Santos Laguna',
        'es': 'Santos Laguna',
        'zh-hk': '山度士拉古納',
        'zh-tw': '山度士拉古納',
        'zh': '桑托斯拉古纳',
        'de': 'Santos Laguna',
        'it': 'Santos Laguna',
        'pt': 'Santos Laguna'
      },
      'FC Juarez': {
        'en': 'FC Juarez',
        'es': 'FC Juárez',
        'zh-hk': '華雷斯',
        'zh-tw': '華雷斯',
        'zh': '华雷斯',
        'de': 'FC Juárez',
        'it': 'FC Juárez',
        'pt': 'FC Juárez'
      },
      'Juarez': {
        'en': 'Juarez',
        'es': 'Juárez',
        'zh-hk': '華雷斯',
        'zh-tw': '華雷斯',
        'zh': '华雷斯',
        'de': 'Juárez',
        'it': 'Juárez',
        'pt': 'Juárez'
      },
      'CF Monterrey': {
        'en': 'Monterrey',
        'es': 'Monterrey',
        'zh-hk': '蒙特雷',
        'zh-tw': '蒙特雷',
        'zh': '蒙特雷',
        'de': 'Monterrey',
        'it': 'Monterrey',
        'pt': 'Monterrey'
      },
      'Monterrey': {
        'en': 'Monterrey',
        'es': 'Monterrey',
        'zh-hk': '蒙特雷',
        'zh-tw': '蒙特雷',
        'zh': '蒙特雷',
        'de': 'Monterrey',
        'it': 'Monterrey',
        'pt': 'Monterrey'
      },
      'Tigres UANL': {
        'en': 'Tigres',
        'es': 'Tigres',
        'zh-hk': '老虎',
        'zh-tw': '老虎',
        'zh': '老虎',
        'de': 'Tigres',
        'it': 'Tigres',
        'pt': 'Tigres'
      },
      'Tigres': {
        'en': 'Tigres',
        'es': 'Tigres',
        'zh-hk': '老虎',
        'zh-tw': '老虎',
        'zh': '老虎',
        'de': 'Tigres',
        'it': 'Tigres',
        'pt': 'Tigres'
      },
      'Pumas UNAM': {
        'en': 'Pumas',
        'es': 'Pumas',
        'zh-hk': '美洲獅',
        'zh-tw': '美洲獅',
        'zh': '美洲狮',
        'de': 'Pumas',
        'it': 'Pumas',
        'pt': 'Pumas'
      },
      'Pumas': {
        'en': 'Pumas',
        'es': 'Pumas',
        'zh-hk': '美洲獅',
        'zh-tw': '美洲獅',
        'zh': '美洲狮',
        'de': 'Pumas',
        'it': 'Pumas',
        'pt': 'Pumas'
      },

      // South American Teams
      'Boca Juniors': {
        'en': 'Boca Juniors',
        'es': 'Boca Juniors',
        'zh-hk': '小保加',
        'zh-tw': '博卡青年',
        'zh': '博卡青年',
        'de': 'Boca Juniors',
        'it': 'Boca Juniors',
        'pt': 'Boca Juniors'
      },
      'River Plate': {
        'en': 'River Plate',
        'es': 'River Plate',
        'zh-hk': '河床',
        'zh-tw': '河床',
        'zh': '河床',
        'de': 'River Plate',
        'it': 'River Plate',
        'pt': 'River Plate'
      },
      'Flamengo': {
        'en': 'Flamengo',
        'es': 'Flamengo',
        'zh-hk': '法林明高',
        'zh-tw': '佛朗明哥',
        'zh': '弗拉门戈',
        'de': 'Flamengo',
        'it': 'Flamengo',
        'pt': 'Flamengo'
      },
      'Palmeiras': {
        'en': 'Palmeiras',
        'es': 'Palmeiras',
        'zh-hk': '彭美拉斯',
        'zh-tw': '帕爾梅拉斯',
        'zh': '帕尔梅拉斯',
        'de': 'Palmeiras',
        'it': 'Palmeiras',
        'pt': 'Palmeiras'
      },
      'São Paulo': {
        'en': 'São Paulo',
        'es': 'São Paulo',
        'zh-hk': '聖保羅',
        'zh-tw': '聖保羅',
        'zh': '圣保罗',
        'de': 'São Paulo',
        'it': 'São Paulo',
        'pt': 'São Paulo'
      },
      'Corinthians': {
        'en': 'Corinthians',
        'es': 'Corinthians',
        'zh-hk': '哥連泰斯',
        'zh-tw': '科林蒂安',
        'zh': '科林蒂安',
        'de': 'Corinthians',
        'it': 'Corinthians',
        'pt': 'Corinthians'
      },
      'Santos': {
        'en': 'Santos',
        'es': 'Santos',
        'zh-hk': '山度士',
        'zh-tw': '桑托斯',
        'zh': '桑托斯',
        'de': 'Santos',
        'it': 'Santos',
        'pt': 'Santos'
      },

      // Other European Teams
      'Ajax': {
        'en': 'Ajax',
        'es': 'Ajax',
        'zh-hk': '阿積士',
        'zh-tw': '阿賈克斯',
        'zh': '阿贾克斯',
        'de': 'Ajax',
        'it': 'Ajax',
        'pt': 'Ajax'
      },
      'Porto': {
        'en': 'Porto',
        'es': 'Oporto',
        'zh-hk': '波圖',
        'zh-tw': '波爾圖',
        'zh': '波尔图',
        'de': 'Porto',
        'it': 'Porto',
        'pt': 'Porto'
      },
      'Benfica': {
        'en': 'Benfica',
        'es': 'Benfica',
        'zh-hk': '賓菲加',
        'zh-tw': '本菲卡',
        'zh': '本菲卡',
        'de': 'Benfica',
        'it': 'Benfica',
        'pt': 'Benfica'
      },
      'Sporting CP': {
        'en': 'Sporting CP',
        'es': 'Sporting de Lisboa',
        'zh-hk': '士砵亭',
        'zh-tw': '葡萄牙體育',
        'zh': '葡萄牙体育',
        'de': 'Sporting Lissabon',
        'it': 'Sporting Lisbona',
        'pt': 'Sporting CP'
      },

      // Additional Global Teams
      'Al-Hilal': {
        'en': 'Al-Hilal',
        'es': 'Al-Hilal',
        'zh-hk': '希拉爾',
        'zh-tw': '希拉爾',
        'zh': '希拉尔',
        'de': 'Al-Hilal',
        'it': 'Al-Hilal',
        'pt': 'Al-Hilal'
      },
      'Al Nassr': {
        'en': 'Al Nassr',
        'es': 'Al Nassr',
        'zh-hk': '勝利',
        'zh-tw': '勝利',
        'zh': '胜利',
        'de': 'Al Nassr',
        'it': 'Al Nassr',
        'pt': 'Al Nassr'
      },

      // Extended European Teams
      'Olympiakos': {
        'en': 'Olympiakos',
        'es': 'Olympiakos',
        'zh-hk': '奧林比亞高斯',
        'zh-tw': '奧林匹亞科斯',
        'zh': '奥林匹亚科斯',
        'de': 'Olympiakos',
        'it': 'Olympiakos',
        'pt': 'Olympiakos'
      },
      'Olympiakos Piraeus': {
        'en': 'Olympiakos Piraeus',
        'es': 'Olympiakos Piraeus',
        'zh-hk': '奧林比亞高斯',
        'zh-tw': '奧林匹亞科斯',
        'zh': '奥林匹亚科斯',
        'de': 'Olympiakos Piraeus',
        'it': 'Olympiakos Piraeus',
        'pt': 'Olympiakos Piraeus'
      },
      'Panathinaikos': {
        'en': 'Panathinaikos',
        'es': 'Panathinaikos',
        'zh-hk': '柏拿芬拿高斯',
        'zh-tw': '帕納辛奈科斯',
        'zh': '帕纳辛奈科斯',
        'de': 'Panathinaikos',
        'it': 'Panathinaikos',
        'pt': 'Panathinaikos'
      },
      'AEK Athens': {
        'en': 'AEK Athens',
        'es': 'AEK Atenas',
        'zh-hk': 'AEK雅典',
        'zh-tw': 'AEK雅典',
        'zh': 'AEK雅典',
        'de': 'AEK Athen',
        'it': 'AEK Atene',
        'pt': 'AEK Atenas'
      },
      'PAOK': {
        'en': 'PAOK',
        'es': 'PAOK',
        'zh-hk': 'PAOK',
        'zh-tw': 'PAOK',
        'zh': 'PAOK',
        'de': 'PAOK',
        'it': 'PAOK',
        'pt': 'PAOK'
      },

      // Additional German Teams (Bundesliga)
      'Union Berlin': {
        'en': 'Union Berlin',
        'es': 'Union Berlín',
        'zh-hk': '柏林聯',
        'zh-tw': '柏林聯',
        'zh': '柏林联合',
        'de': '1. FC Union Berlin',
        'it': 'Union Berlino',
        'pt': 'Union Berlin'
      },
      'FC Koln': {
        'en': 'FC Koln',
        'es': 'FC Colonia',
        'zh-hk': '科隆',
        'zh-tw': '科隆',
        'zh': '科隆',
        'de': '1. FC Köln',
        'it': 'FC Colonia',
        'pt': 'FC Colônia'
      },
      'Eintracht Frankfurt': {
        'en': 'Eintracht Frankfurt',
        'es': 'Eintracht Frankfurt',
        'zh-hk': '法蘭克福',
        'zh-tw': '法蘭克福',
        'zh': '法兰克福',
        'de': 'Eintracht Frankfurt',
        'it': 'Eintracht Francoforte',
        'pt': 'Eintracht Frankfurt'
      },
      'SC Freiburg': {
        'en': 'SC Freiburg',
        'es': 'SC Friburgo',
        'zh-hk': '弗賴堡',
        'zh-tw': '弗賴堡',
        'zh': '弗赖堡',
        'de': 'SC Freiburg',
        'it': 'SC Friburgo',
        'pt': 'SC Friburgo'
      },
      'VfL Wolfsburg': {
        'en': 'VfL Wolfsburg',
        'es': 'VfL Wolfsburg',
        'zh-hk': '沃夫斯堡',
        'zh-tw': '沃夫斯堡',
        'zh': '沃尔夫斯堡',
        'de': 'VfL Wolfsburg',
        'it': 'VfL Wolfsburg',
        'pt': 'VfL Wolfsburg'
      },
      'Borussia Monchengladbach': {
        'en': 'Borussia Monchengladbach',
        'es': 'Borussia Mönchengladbach',
        'zh-hk': '慕遜加柏',
        'zh-tw': '門興格拉德巴赫',
        'zh': '门兴格拉德巴赫',
        'de': 'Borussia Mönchengladbach',
        'it': 'Borussia Mönchengladbach',
        'pt': 'Borussia Mönchengladbach'
      },
      'TSG Hoffenheim': {
        'en': 'TSG Hoffenheim',
        'es': 'TSG Hoffenheim',
        'zh-hk': '賀芬咸',
        'zh-tw': '霍芬海姆',
        'zh': '霍芬海姆',
        'de': 'TSG 1899 Hoffenheim',
        'it': 'TSG Hoffenheim',
        'pt': 'TSG Hoffenheim'
      },
      'FC Augsburg': {
        'en': 'FC Augsburg',
        'es': 'FC Augsburgo',
        'zh-hk': '奧格斯堡',
        'zh-tw': '奧格斯堡',
        'zh': '奥格斯堡',
        'de': 'FC Augsburg',
        'it': 'FC Augusta',
        'pt': 'FC Augsburg'
      },
      'VfB Stuttgart': {
        'en': 'VfB Stuttgart',
        'es': 'VfB Stuttgart',
        'zh-hk': '史特加',
        'zh-tw': '斯圖加特',
        'zh': '斯图加特',
        'de': 'VfB Stuttgart',
        'it': 'VfB Stoccarda',
        'pt': 'VfB Stuttgart'
      },
      'Werder Bremen': {
        'en': 'Werder Bremen',
        'es': 'Werder Bremen',
        'zh-hk': '雲達不萊梅',
        'zh-tw': '雲達不萊梅',
        'zh': '云达不莱梅',
        'de': 'SV Werder Bremen',
        'it': 'Werder Brema',
        'pt': 'Werder Bremen'
      },
      'Mainz 05': {
        'en': 'Mainz 05',
        'es': 'Mainz 05',
        'zh-hk': '緬恩斯',
        'zh-tw': '美因茨',
        'zh': '美因茨',
        'de': '1. FSV Mainz 05',
        'it': 'Mainz 05',
        'pt': 'Mainz 05'
      },

      // Additional French Teams (Ligue 1)
      'OGC Nice': {
        'en': 'Nice',
        'es': 'Niza',
        'zh-hk': '尼斯',
        'zh-tw': '尼斯',
        'zh': '尼斯',
        'de': 'OGC Nizza',
        'it': 'Nizza',
        'pt': 'Nice'
      },
      'Lille': {
        'en': 'Lille',
        'es': 'Lille',
        'zh-hk': '里爾',
        'zh-tw': '里爾',
        'zh': '里尔',
        'de': 'OSC Lille',
        'it': 'Lille',
        'pt': 'Lille'
      },
      'Stade Rennais': {
        'en': 'Rennes',
        'es': 'Rennes',
        'zh-hk': '雷恩',
        'zh-tw': '雷恩',
        'zh': '雷恩',
        'de': 'Stade Rennes',
        'it': 'Rennes',
        'pt': 'Rennes'
      },
      'RC Strasbourg': {
        'en': 'Strasbourg',
        'es': 'Estrasburgo',
        'zh-hk': '史特拉斯堡',
        'zh-tw': '史特拉斯堡',
        'zh': '斯特拉斯堡',
        'de': 'RC Strasbourg',
        'it': 'Strasburgo',
        'pt': 'Strasbourg'
      },
      'Montpellier': {
        'en': 'Montpellier',
        'es': 'Montpellier',
        'zh-hk': '蒙彼利埃',
        'zh-tw': '蒙彼利埃',
        'zh': '蒙彼利埃',
        'de': 'HSC Montpellier',
        'it': 'Montpellier',
        'pt': 'Montpellier'
      },
      'Olympique Lyonnais': {
        'en': 'Lyon',
        'es': 'Lyon',
        'zh-hk': '里昂',
        'zh-tw': '里昂',
        'zh': '里昂',
        'de': 'Olympique Lyon',
        'it': 'Lione',
        'pt': 'Lyon'
      },

      // Additional Italian Teams (Serie A)
      'Atalanta': {
        'en': 'Atalanta',
        'es': 'Atalanta',
        'zh-hk': '阿特蘭大',
        'zh-tw': '亞特蘭大',
        'zh': '亚特兰大',
        'de': 'Atalanta Bergamo',
        'it': 'Atalanta',
        'pt': 'Atalanta'
      },
      'Lazio': {
        'en': 'Lazio',
        'es': 'Lazio',
        'zh-hk': '拉素',
        'zh-tw': '拉齊奧',
        'zh': '拉齐奥',
        'de': 'Lazio Rom',
        'it': 'Lazio',
        'pt': 'Lazio'
      },
      'Fiorentina': {
        'en': 'Fiorentina',
        'es': 'Fiorentina',
        'zh-hk': '費倫天拿',
        'zh-tw': '佛羅倫薩',
        'zh': '佛罗伦萨',
        'de': 'AC Florenz',
        'it': 'Fiorentina',
        'pt': 'Fiorentina'
      },
      'Sassuolo': {
        'en': 'Sassuolo',
        'es': 'Sassuolo',
        'zh-hk': '薩索羅',
        'zh-tw': '薩索洛',
        'zh': '萨索洛',
        'de': 'US Sassuolo',
        'it': 'Sassuolo',
        'pt': 'Sassuolo'
      },
      'Torino': {
        'en': 'Torino',
        'es': 'Turín',
        'zh-hk': '拖連奴',
        'zh-tw': '都靈',
        'zh': '都灵',
        'de': 'FC Turin',
        'it': 'Torino',
        'pt': 'Torino'
      },
      'Bologna': {
        'en': 'Bologna',
        'es': 'Bolonia',
        'zh-hk': '博洛尼亞',
        'zh-tw': '博洛尼亞',
        'zh': '博洛尼亚',
        'de': 'FC Bologna',
        'it': 'Bologna',
        'pt': 'Bologna'
      },
      'Udinese': {
        'en': 'Udinese',
        'es': 'Udinese',
        'zh-hk': '烏甸尼斯',
        'zh-tw': '烏迪內斯',
        'zh': '乌迪内斯',
        'de': 'Udinese Calcio',
        'it': 'Udinese',
        'pt': 'Udinese'
      },
      'Sampdoria': {
        'en': 'Sampdoria',
        'es': 'Sampdoria',
        'zh-hk': '森多利亞',
        'zh-tw': '桑普多利亞',
        'zh': '桑普多利亚',
        'de': 'UC Sampdoria',
        'it': 'Sampdoria',
        'pt': 'Sampdoria'
      },
      'Genoa': {
        'en': 'Genoa',
        'es': 'Génova',
        'zh-hk': '熱拿亞',
        'zh-tw': '熱那亞',
        'zh': '热那亚',
        'de': 'CFC Genua',
        'it': 'Genoa',
        'pt': 'Genoa'
      },
      'Hellas Verona': {
        'en': 'Hellas Verona',
        'es': 'Hellas Verona',
        'zh-hk': '維羅納',
        'zh-tw': '維羅納',
        'zh': '维罗纳',
        'de': 'Hellas Verona',
        'it': 'Hellas Verona',
        'pt': 'Hellas Verona'
      },

      // Additional Spanish Teams (La Liga)
      'Villarreal': {
        'en': 'Villarreal',
        'es': 'Villarreal',
        'zh-hk': '維拉利爾',
        'zh-tw': '比利亞雷亞爾',
        'zh': '比利亚雷亚尔',
        'de': 'Villarreal CF',
        'it': 'Villarreal',
        'pt': 'Villarreal'
      },
      'Real Betis': {
        'en': 'Real Betis',
        'es': 'Real Betis',
        'zh-hk': '皇家貝蒂斯',
        'zh-tw': '皇家貝蒂斯',
        'zh': '皇家贝蒂斯',
        'de': 'Real Betis',
        'it': 'Real Betis',
        'pt': 'Real Betis'
      },
      'Athletic Bilbao': {
        'en': 'Athletic Bilbao',
        'es': 'Athletic Bilbao',
        'zh-hk': '畢爾包',
        'zh-tw': '畢爾包',
        'zh': '毕尔巴鄂竞技',
        'de': 'Athletic Bilbao',
        'it': 'Athletic Bilbao',
        'pt': 'Athletic Bilbao'
      },
      'Valencia': {
        'en': 'Valencia',
        'es': 'Valencia',
        'zh-hk': '華倫西亞',
        'zh-tw': '瓦倫西亞',
        'zh': '瓦伦西亚',
        'de': 'FC Valencia',
        'it': 'Valencia',
        'pt': 'Valencia'
      },
      'Celta Vigo': {
        'en': 'Celta Vigo',
        'es': 'Celta de Vigo',
        'zh-hk': '切爾達',
        'zh-tw': '塞爾塔',
        'zh': '塞尔塔',
        'de': 'Celta Vigo',
        'it': 'Celta Vigo',
        'pt': 'Celta de Vigo'
      },
      'Real Valladolid': {
        'en': 'Real Valladolid',
        'es': 'Real Valladolid',
        'zh-hk': '華拉度列',
        'zh-tw': '巴拉多利德',
        'zh': '巴利亚多利德',
        'de': 'Real Valladolid',
        'it': 'Real Valladolid',
        'pt': 'Real Valladolid'
      },
      'Espanyol': {
        'en': 'Espanyol',
        'es': 'Espanyol',
        'zh-hk': '愛斯賓奴',
        'zh-tw': '西班牙人',
        'zh': '西班牙人',
        'de': 'RCD Espanyol',
        'it': 'Espanyol',
        'pt': 'Espanyol'
      },
      'Getafe': {
        'en': 'Getafe',
        'es': 'Getafe',
        'zh-hk': '加泰菲',
        'zh-tw': '赫塔費',
        'zh': '赫塔费',
        'de': 'Getafe CF',
        'it': 'Getafe',
        'pt': 'Getafe'
      },
      'Osasuna': {
        'en': 'Osasuna',
        'es': 'Osasuna',
        'zh-hk': '奧薩辛拿',
        'zh-tw': '奧薩蘇納',
        'zh': '奥萨苏纳',
        'de': 'CA Osasuna',
        'it': 'Osasuna',
        'pt': 'Osasuna'
      },
      'Eibar': {
        'en': 'Eibar',
        'es': 'Eibar',
        'zh-hk': '伊巴',
        'zh-tw': '艾巴',
        'zh': '埃瓦尔',
        'de': 'SD Eibar',
        'it': 'Eibar',
        'pt': 'Eibar'
      },
      'Las Palmas': {
        'en': 'Las Palmas',
        'es': 'Las Palmas',
        'zh-hk': '拉斯帕爾馬斯',
        'zh-tw': '拉斯帕爾馬斯',
        'zh': '拉斯帕尔马斯',
        'de': 'UD Las Palmas',
        'it': 'Las Palmas',
        'pt': 'Las Palmas'
      },
      'Mallorca': {
        'en': 'Mallorca',
        'es': 'Mallorca',
        'zh-hk': '馬略卡',
        'zh-tw': '馬略卡',
        'zh': '马略卡',
        'de': 'RCD Mallorca',
        'it': 'Mallorca',
        'pt': 'Mallorca'
      },
      'Cadiz': {
        'en': 'Cadiz',
        'es': 'Cádiz',
        'zh-hk': '加的斯',
        'zh-tw': '加的斯',
        'zh': '加的斯',
        'de': 'FC Cádiz',
        'it': 'Cadice',
        'pt': 'Cádiz'
      },
      'Rayo Vallecano': {
        'en': 'Rayo Vallecano',
        'es': 'Rayo Vallecano',
        'zh-hk': '華歷簡奴',
        'zh-tw': '巴列卡諾',
        'zh': '巴列卡诺',
        'de': 'Rayo Vallecano',
        'it': 'Rayo Vallecano',
        'pt': 'Rayo Vallecano'
      },
      'Almeria': {
        'en': 'Almeria',
        'es': 'Almería',
        'zh-hk': '阿爾梅里亞',
        'zh-tw': '阿爾梅里亞',
        'zh': '阿尔梅里亚',
        'de': 'UD Almería',
        'it': 'Almería',
        'pt': 'Almería'
      },
      'Girona': {
        'en': 'Girona',
        'es': 'Girona',
        'zh-hk': '基羅納',
        'zh-tw': '赫羅納',
        'zh': '赫罗纳',
        'de': 'Girona FC',
        'it': 'Girona',
        'pt': 'Girona'
      },
      'Alaves': {
        'en': 'Alaves',
        'es': 'Alavés',
        'zh-hk': '阿拉維斯',
        'zh-tw': '阿拉維斯',
        'zh': '阿拉维斯',
        'de': 'Deportivo Alavés',
        'it': 'Alavés',
        'pt': 'Alavés'
      },

      // Portuguese Teams (Primeira Liga)
      'FC Porto': {
        'en': 'FC Porto',
        'es': 'FC Oporto',
        'zh-hk': '波圖',
        'zh-tw': '波爾圖',
        'zh': '波尔图',
        'de': 'FC Porto',
        'it': 'FC Porto',
        'pt': 'FC Porto'
      },
      'SL Benfica': {
        'en': 'Benfica',
        'es': 'Benfica',
        'zh-hk': '賓菲加',
        'zh-tw': '本菲卡',
        'zh': '本菲卡',
        'de': 'SL Benfica',
        'it': 'Benfica',
        'pt': 'SL Benfica'
      },
      'Sporting Lisboa': {
        'en': 'Sporting CP',
        'es': 'Sporting de Lisboa',
        'zh-hk': '士砵亭',
        'zh-tw': '葡萄牙體育',
        'zh': '葡萄牙体育',
        'de': 'Sporting Lissabon',
        'it': 'Sporting Lisbona',
        'pt': 'Sporting CP'
      },
      'SC Braga': {
        'en': 'SC Braga',
        'es': 'SC Braga',
        'zh-hk': '布拉加',
        'zh-tw': '布拉加',
        'zh': '布拉加',
        'de': 'SC Braga',
        'it': 'SC Braga',
        'pt': 'SC Braga'
      },
      'Vitoria Guimaraes': {
        'en': 'Vitoria Guimaraes',
        'es': 'Vitória Guimarães',
        'zh-hk': '基馬良斯',
        'zh-tw': '基馬良斯',
        'zh': '吉马良斯',
        'de': 'Vitória Guimarães',
        'it': 'Vitória Guimarães',
        'pt': 'Vitória SC'
      },

      // Russian Teams (Russian Premier League)
      'CSKA Moscow': {
        'en': 'CSKA Moscow',
        'es': 'CSKA Moscú',
        'zh-hk': '莫斯科中央陸軍',
        'zh-tw': '莫斯科中央陸軍',
        'zh': '莫斯科中央陆军',
        'de': 'ZSKA Moskau',
        'it': 'CSKA Mosca',
        'pt': 'CSKA Moscou'
      },
      'Spartak Moscow': {
        'en': 'Spartak Moscow',
        'es': 'Spartak Moscú',
        'zh-hk': '莫斯科斯巴達',
        'zh-tw': '莫斯科斯巴達',
        'zh': '莫斯科斯巴达',
        'de': 'Spartak Moskau',
        'it': 'Spartak Mosca',
        'pt': 'Spartak Moscou'
      },
      'Zenit': {
        'en': 'Zenit',
        'es': 'Zenit',
        'zh-hk': '辛尼特',
        'zh-tw': '澤尼特',
        'zh': '泽尼特',
        'de': 'Zenit St. Petersburg',
        'it': 'Zenit',
        'pt': 'Zenit'
      },
      'Dynamo Moscow': {
        'en': 'Dynamo Moscow',
        'es': 'Dinamo Moscú',
        'zh-hk': '莫斯科戴拿模',
        'zh-tw': '莫斯科迪納摩',
        'zh': '莫斯科迪纳摩',
        'de': 'Dynamo Moskau',
        'it': 'Dinamo Mosca',
        'pt': 'Dínamo Moscou'
      },
      'Lokomotiv Moscow': {
        'en': 'Lokomotiv Moscow',
        'es': 'Lokomotiv Moscú',
        'zh-hk': '莫斯科火車頭',
        'zh-tw': '莫斯科火車頭',
        'zh': '莫斯科火车头',
        'de': 'Lokomotive Moskau',
        'it': 'Lokomotiv Mosca',
        'pt': 'Lokomotiv Moscou'
      },

      // Turkish Teams (Super Lig)
      'Galatasaray': {
        'en': 'Galatasaray',
        'es': 'Galatasaray',
        'zh-hk': '加拉塔沙雷',
        'zh-tw': '加拉塔薩雷',
        'zh': '加拉塔萨雷',
        'de': 'Galatasaray Istanbul',
        'it': 'Galatasaray',
        'pt': 'Galatasaray'
      },
      'Fenerbahce': {
        'en': 'Fenerbahce',
        'es': 'Fenerbahçe',
        'zh-hk': '費倫巴治',
        'zh-tw': '費內巴切',
        'zh': '费内巴切',
        'de': 'Fenerbahçe Istanbul',
        'it': 'Fenerbahçe',
        'pt': 'Fenerbahçe'
      },
      'Besiktas': {
        'en': 'Besiktas',
        'es': 'Beşiktaş',
        'zh-hk': '比錫達斯',
        'zh-tw': '貝西克塔斯',
        'zh': '贝西克塔斯',
        'de': 'Beşiktaş Istanbul',
        'it': 'Beşiktaş',
        'pt': 'Beşiktaş'
      },
      'Istanbul Basaksehir': {
        'en': 'Istanbul Basaksehir',
        'es': 'İstanbul Başakşehir',
        'zh-hk': '伊斯坦堡巴沙克舍希',
        'zh-tw': '伊斯坦堡巴沙克舍希',
        'zh': '伊斯坦布尔巴沙克谢希',
        'de': 'İstanbul Başakşehir',
        'it': 'Istanbul Başakşehir',
        'pt': 'Istanbul Başakşehir'
      },
      'Trabzonspor': {
        'en': 'Trabzonspor',
        'es': 'Trabzonspor',
        'zh-hk': '特拉布宗體育',
        'zh-tw': '特拉布宗體育',
        'zh': '特拉布宗体育',
        'de': 'Trabzonspor',
        'it': 'Trabzonspor',
        'pt': 'Trabzonspor'
      },

      // Dutch Teams (Eredivisie)
      'PSV Eindhoven': {
        'en': 'PSV Eindhoven',
        'es': 'PSV Eindhoven',
        'zh-hk': 'PSV燕豪芬',
        'zh-tw': 'PSV恩荷芬',
        'zh': 'PSV埃因霍温',
        'de': 'PSV Eindhoven',
        'it': 'PSV Eindhoven',
        'pt': 'PSV Eindhoven'
      },
      'Feyenoord': {
        'en': 'Feyenoord',
        'es': 'Feyenoord',
        'zh-hk': '飛燕諾',
        'zh-tw': '飛燕諾',
        'zh': '费耶诺德',
        'de': 'Feyenoord Rotterdam',
        'it': 'Feyenoord',
        'pt': 'Feyenoord'
      },
      'AZ Alkmaar': {
        'en': 'AZ Alkmaar',
        'es': 'AZ Alkmaar',
        'zh-hk': '阿克馬爾',
        'zh-tw': '阿克馬爾',
        'zh': '阿尔克马尔',
        'de': 'AZ Alkmaar',
        'it': 'AZ Alkmaar',
        'pt': 'AZ Alkmaar'
      },
      'FC Twente': {
        'en': 'FC Twente',
        'es': 'FC Twente',
        'zh-hk': '川迪',
        'zh-tw': '川迪',
        'zh': '特温特',
        'de': 'FC Twente',
        'it': 'FC Twente',
        'pt': 'FC Twente'
      },
      'Vitesse': {
        'en': 'Vitesse',
        'es': 'Vitesse',
        'zh-hk': '維特斯',
        'zh-tw': '維特斯',
        'zh': '维特斯',
        'de': 'Vitesse Arnhem',
        'it': 'Vitesse',
        'pt': 'Vitesse'
      },

      // Belgian Teams (Belgian Pro League)
      'Club Brugge': {
        'en': 'Club Brugge',
        'es': 'Club Brujas',
        'zh-hk': '布魯日',
        'zh-tw': '布魯日',
        'zh': '布鲁日',
        'de': 'Club Brügge',
        'it': 'Club Brugge',
        'pt': 'Club Brugge'
      },
      'Anderlecht': {
        'en': 'Anderlecht',
        'es': 'Anderlecht',
        'zh-hk': '安德列治',
        'zh-tw': '安德萊赫特',
        'zh': '安德莱赫特',
        'de': 'RSC Anderlecht',
        'it': 'Anderlecht',
        'pt': 'Anderlecht'
      },
      'Standard Liege': {
        'en': 'Standard Liege',
        'es': 'Standard Lieja',
        'zh-hk': '標準列治',
        'zh-tw': '標準列日',
        'zh': '标准列日',
        'de': 'Standard Lüttich',
        'it': 'Standard Liegi',
        'pt': 'Standard Liège'
      },
      'KRC Genk': {
        'en': 'KRC Genk',
        'es': 'KRC Genk',
        'zh-hk': '根克',
        'zh-tw': '亨克',
        'zh': '亨克',
        'de': 'KRC Genk',
        'it': 'KRC Genk',
        'pt': 'KRC Genk'
      },
      'AA Gent': {
        'en': 'AA Gent',
        'es': 'AA Gante',
        'zh-hk': '根特',
        'zh-tw': '根特',
        'zh': '根特',
        'de': 'KAA Gent',
        'it': 'AA Gent',
        'pt': 'AA Gent'
      },

      // Ukrainian Teams (Ukrainian Premier League)
      'Shakhtar Donetsk': {
        'en': 'Shakhtar Donetsk',
        'es': 'Shakhtar Donetsk',
        'zh-hk': '薩克達',
        'zh-tw': '沙克塔',
        'zh': '顿涅茨克矿工',
        'de': 'Schachtar Donezk',
        'it': 'Shakhtar Donetsk',
        'pt': 'Shakhtar Donetsk'
      },
      'Dynamo Kyiv': {
        'en': 'Dynamo Kyiv',
        'es': 'Dinamo Kiev',
        'zh-hk': '基輔戴拿模',
        'zh-tw': '基輔迪納摩',
        'zh': '基辅迪纳摩',
        'de': 'Dynamo Kiew',
        'it': 'Dinamo Kiev',
        'pt': 'Dínamo Kiev'
      },

      // Scottish Teams (Scottish Premiership)
      'Celtic': {
        'en': 'Celtic',
        'es': 'Celtic',
        'zh-hk': '些路迪',
        'zh-tw': '塞爾提克',
        'zh': '凯尔特人',
        'de': 'Celtic Glasgow',
        'it': 'Celtic',
        'pt': 'Celtic'
      },
      'Rangers': {
        'en': 'Rangers',
        'es': 'Rangers',
        'zh-hk': '格拉斯哥流浪',
        'zh-tw': '流浪者',
        'zh': '流浪者',
        'de': 'Glasgow Rangers',
        'it': 'Rangers',
        'pt': 'Rangers'
      },
      'Aberdeen': {
        'en': 'Aberdeen',
        'es': 'Aberdeen',
        'zh-hk': '阿伯丁',
        'zh-tw': '阿伯丁',
        'zh': '阿伯丁',
        'de': 'FC Aberdeen',
        'it': 'Aberdeen',
        'pt': 'Aberdeen'
      },
      'Hearts': {
        'en': 'Hearts',
        'es': 'Hearts',
        'zh-hk': '赫斯',
        'zh-tw': '哈茨',
        'zh': '哈茨',
        'de': 'Heart of Midlothian',
        'it': 'Hearts',
        'pt': 'Hearts'
      },
      'Hibernian': {
        'en': 'Hibernian',
        'es': 'Hibernian',
        'zh-hk': '希伯尼安',
        'zh-tw': '希伯尼安',
        'zh': '希伯尼安',
        'de': 'Hibernian Edinburgh',
        'it': 'Hibernian',
        'pt': 'Hibernian'
      },

      // Austrian Teams (Austrian Bundesliga)
      'Red Bull Salzburg': {
        'en': 'Red Bull Salzburg',
        'es': 'Red Bull Salzburgo',
        'zh-hk': '薩爾茨堡紅牛',
        'zh-tw': '薩爾茨堡紅牛',
        'zh': '萨尔茨堡红牛',
        'de': 'FC Red Bull Salzburg',
        'it': 'Red Bull Salisburgo',
        'pt': 'Red Bull Salzburg'
      },
      'Austria Vienna': {
        'en': 'Austria Vienna',
        'es': 'Austria Viena',
        'zh-hk': '奧地利維也納',
        'zh-tw': '奧地利維也納',
        'zh': '奥地利维也纳',
        'de': 'FK Austria Wien',
        'it': 'Austria Vienna',
        'pt': 'Austria Viena'
      },
      'Rapid Vienna': {
        'en': 'Rapid Vienna',
        'es': 'Rapid Viena',
        'zh-hk': '維也納快速',
        'zh-tw': '維也納快速',
        'zh': '维也纳快速',
        'de': 'SK Rapid Wien',
        'it': 'Rapid Vienna',
        'pt': 'Rapid Viena'
      },
      'Sturm Graz': {
        'en': 'Sturm Graz',
        'es': 'Sturm Graz',
        'zh-hk': '格拉茲',
        'zh-tw': '格拉茲',
        'zh': '格拉茨风暴',
        'de': 'SK Sturm Graz',
        'it': 'Sturm Graz',
        'pt': 'Sturm Graz'
      },

      // Swiss Teams (Swiss Super League)
      'Basel': {
        'en': 'Basel',
        'es': 'Basilea',
        'zh-hk': '巴塞爾',
        'zh-tw': '巴塞爾',
        'zh': '巴塞尔',
        'de': 'FC Basel',
        'it': 'Basilea',
        'pt': 'Basel'
      },
      'Young Boys': {
        'en': 'Young Boys',
        'es': 'Young Boys',
        'zh-hk': '年青人',
        'zh-tw': '伯恩青年',
        'zh': '伯尔尼年轻人',
        'de': 'BSC Young Boys',
        'it': 'Young Boys',
        'pt': 'Young Boys'
      },
      'FC Zurich': {
        'en': 'FC Zurich',
        'es': 'FC Zúrich',
        'zh-hk': '蘇黎世',
        'zh-tw': '蘇黎世',
        'zh': '苏黎世',
        'de': 'FC Zürich',
        'it': 'FC Zurigo',
        'pt': 'FC Zurique'
      },

      // Czech Teams (Czech First League)
      'Slavia Prague': {
        'en': 'Slavia Prague',
        'es': 'Slavia Praga',
        'zh-hk': '布拉格斯拉維亞',
        'zh-tw': '布拉格斯拉維亞',
        'zh': '布拉格斯拉维亚',
        'de': 'Slavia Prag',
        'it': 'Slavia Praga',
        'pt': 'Slavia Praga'
      },
      'Sparta Prague': {
        'en': 'Sparta Prague',
        'es': 'Sparta Praga',
        'zh-hk': '布拉格斯巴達',
        'zh-tw': '布拉格斯巴達',
        'zh': '布拉格斯巴达',
        'de': 'Sparta Prag',
        'it': 'Sparta Praga',
        'pt': 'Sparta Praga'
      },
      'Viktoria Plzen': {
        'en': 'Viktoria Plzen',
        'es': 'Viktoria Plzen',
        'zh-hk': '比爾森勝利',
        'zh-tw': '比爾森勝利',
        'zh': '比尔森胜利',
        'de': 'Viktoria Pilsen',
        'it': 'Viktoria Plzen',
        'pt': 'Viktoria Plzen'
      },

      // Croatian Teams (Croatian First League)
      'Dinamo Zagreb': {
        'en': 'Dinamo Zagreb',
        'es': 'Dinamo Zagreb',
        'zh-hk': '薩格勒布戴拿模',
        'zh-tw': '薩格勒布迪納摩',
        'zh': '萨格勒布迪纳摩',
        'de': 'Dinamo Zagreb',
        'it': 'Dinamo Zagabria',
        'pt': 'Dínamo Zagreb'
      },
      'Hajduk Split': {
        'en': 'Hajduk Split',
        'es': 'Hajduk Split',
        'zh-hk': '夏德克',
        'zh-tw': '哈伊杜克',
        'zh': '哈伊杜克',
        'de': 'Hajduk Split',
        'it': 'Hajduk Spalato',
        'pt': 'Hajduk Split'
      },

      // Polish Teams (Ekstraklasa)
      'Legia Warsaw': {
        'en': 'Legia Warsaw',
        'es': 'Legia Varsovia',
        'zh-hk': '華沙軍團',
        'zh-tw': '華沙軍團',
        'zh': '华沙军团',
        'de': 'Legia Warschau',
        'it': 'Legia Varsavia',
        'pt': 'Legia Varsóvia'
      },
      'Lech Poznan': {
        'en': 'Lech Poznan',
        'es': 'Lech Poznan',
        'zh-hk': '波茲南',
        'zh-tw': '波茲南',
        'zh': '波兹南',
        'de': 'Lech Posen',
        'it': 'Lech Poznan',
        'pt': 'Lech Poznan'
      },

      // Nordic Teams (Scandinavia)
      'FC Copenhagen': {
        'en': 'FC Copenhagen',
        'es': 'FC Copenhague',
        'zh-hk': '哥本哈根',
        'zh-tw': '哥本哈根',
        'zh': '哥本哈根',
        'de': 'FC Kopenhagen',
        'it': 'FC Copenaghen',
        'pt': 'FC Copenhague'
      },
      'Malmö FF': {
        'en': 'Malmö FF',
        'es': 'Malmö FF',
        'zh-hk': '馬模',
        'zh-tw': '馬爾默',
        'zh': '马尔默',
        'de': 'Malmö FF',
        'it': 'Malmö FF',
        'pt': 'Malmö FF'
      },
      'Rosenborg': {
        'en': 'Rosenborg',
        'es': 'Rosenborg',
        'zh-hk': '羅辛堡',
        'zh-tw': '羅森堡',
        'zh': '罗森堡',
        'de': 'Rosenborg Trondheim',
        'it': 'Rosenborg',
        'pt': 'Rosenborg'
      },
      'Molde': {
        'en': 'Molde',
        'es': 'Molde',
        'zh-hk': '莫迪',
        'zh-tw': '莫爾德',
        'zh': '莫尔德',
        'de': 'Molde FK',
        'it': 'Molde',
        'pt': 'Molde'
      },

      // Asian Teams (Various Asian Leagues)
      'Al Taawon': {
        'en': 'Al Taawon',
        'es': 'Al Taawon',
        'zh-hk': '塔亞文',
        'zh-tw': '塔亞文',
        'zh': '塔亚文',
        'de': 'Al Taawon',
        'it': 'Al Taawon',
        'pt': 'Al Taawon'
      },
      'Singburi': {
        'en': 'Singburi',
        'es': 'Singburi',
        'zh-hk': '信武里',
        'zh-tw': '信武里',
        'zh': '信武里',
        'de': 'Singburi',
        'it': 'Singburi',
        'pt': 'Singburi'
      },
      'Port FC': {
        'en': 'Port FC',
        'es': 'Port FC',
        'zh-hk': '港口足球會',
        'zh-tw': '港口足球會',
        'zh': '港口足球俱乐部',
        'de': 'Port FC',
        'it': 'Port FC',
        'pt': 'Port FC'
      },
      'Urawa Red Diamonds': {
        'en': 'Urawa Red Diamonds',
        'es': 'Urawa Red Diamonds',
        'zh-hk': '浦和紅鑽',
        'zh-tw': '浦和紅鑽',
        'zh': '浦和红钻',
        'de': 'Urawa Red Diamonds',
        'it': 'Urawa Red Diamonds',
        'pt': 'Urawa Red Diamonds'
      },
      'Kashima Antlers': {
        'en': 'Kashima Antlers',
        'es': 'Kashima Antlers',
        'zh-hk': '鹿島鹿角',
        'zh-tw': '鹿島鹿角',
        'zh': '鹿岛鹿角',
        'de': 'Kashima Antlers',
        'it': 'Kashima Antlers',
        'pt': 'Kashima Antlers'
      },
      'FC Tokyo': {
        'en': 'FC Tokyo',
        'es': 'FC Tokio',
        'zh-hk': '東京FC',
        'zh-tw': '東京FC',
        'zh': '东京FC',
        'de': 'FC Tokyo',
        'it': 'FC Tokyo',
        'pt': 'FC Tóquio'
      },
      'Yokohama F. Marinos': {
        'en': 'Yokohama F. Marinos',
        'es': 'Yokohama F. Marinos',
        'zh-hk': '橫濱水手',
        'zh-tw': '橫濱水手',
        'zh': '横滨水手',
        'de': 'Yokohama F. Marinos',
        'it': 'Yokohama F. Marinos',
        'pt': 'Yokohama F. Marinos'
      },
      'Cerezo Osaka': {
        'en': 'Cerezo Osaka',
        'es': 'Cerezo Osaka',
        'zh-hk': '大阪櫻花',
        'zh-tw': '大阪櫻花',
        'zh': '大阪樱花',
        'de': 'Cerezo Osaka',
        'it': 'Cerezo Osaka',
        'pt': 'Cerezo Osaka'
      },
      'Gamba Osaka': {
        'en': 'Gamba Osaka',
        'es': 'Gamba Osaka',
        'zh-hk': '大阪飛腳',
        'zh-tw': '大阪飛腳',
        'zh': '大阪钢巴',
        'de': 'Gamba Osaka',
        'it': 'Gamba Osaka',
        'pt': 'Gamba Osaka'
      },

      // South Korean Teams (K League)
      'Ulsan Hyundai': {
        'en': 'Ulsan Hyundai',
        'es': 'Ulsan Hyundai',
        'zh-hk': '蔚山現代',
        'zh-tw': '蔚山現代',
        'zh': '蔚山现代',
        'de': 'Ulsan Hyundai',
        'it': 'Ulsan Hyundai',
        'pt': 'Ulsan Hyundai'
      },
      'Jeonbuk Motors': {
        'en': 'Jeonbuk Motors',
        'es': 'Jeonbuk Motors',
        'zh-hk': '全北現代汽車',
        'zh-tw': '全北現代汽車',
        'zh': '全北现代汽车',
        'de': 'Jeonbuk Hyundai Motors',
        'it': 'Jeonbuk Motors',
        'pt': 'Jeonbuk Motors'
      },
      'Pohang Steelers': {
        'en': 'Pohang Steelers',
        'es': 'Pohang Steelers',
        'zh-hk': '浦項鐵人',
        'zh-tw': '浦項鐵人',
        'zh': '浦项铁人',
        'de': 'Pohang Steelers',
        'it': 'Pohang Steelers',
        'pt': 'Pohang Steelers'
      },

      // Chinese Teams (Chinese Super League)
      'Guangzhou FC': {
        'en': 'Guangzhou FC',
        'es': 'Guangzhou FC',
        'zh-hk': '廣州足球會',
        'zh-tw': '廣州足球會',
        'zh': '广州足球俱乐部',
        'de': 'Guangzhou FC',
        'it': 'Guangzhou FC',
        'pt': 'Guangzhou FC'
      },
      'Shanghai Port': {
        'en': 'Shanghai Port',
        'es': 'Shanghai Port',
        'zh-hk': '上海海港',
        'zh-tw': '上海海港',
        'zh': '上海海港',
        'de': 'Shanghai Port',
        'it': 'Shanghai Port',
        'pt': 'Shanghai Port'
      },
      'Beijing Guoan': {
        'en': 'Beijing Guoan',
        'es': 'Beijing Guoan',
        'zh-hk': '北京國安',
        'zh-tw': '北京國安',
        'zh': '北京国安',
        'de': 'Beijing Guoan',
        'it': 'Beijing Guoan',
        'pt': 'Beijing Guoan'
      },

      // Australian Teams (A-League)
      'Melbourne City': {
        'en': 'Melbourne City',
        'es': 'Melbourne City',
        'zh-hk': '墨爾本城',
        'zh-tw': '墨爾本城',
        'zh': '墨尔本城',
        'de': 'Melbourne City',
        'it': 'Melbourne City',
        'pt': 'Melbourne City'
      },
      'Sydney FC': {
        'en': 'Sydney FC',
        'es': 'Sydney FC',
        'zh-hk': '悉尼FC',
        'zh-tw': '悉尼FC',
        'zh': '悉尼FC',
        'de': 'Sydney FC',
        'it': 'Sydney FC',
        'pt': 'Sydney FC'
      },
      'Melbourne Victory': {
        'en': 'Melbourne Victory',
        'es': 'Melbourne Victory',
        'zh-hk': '墨爾本勝利',
        'zh-tw': '墨爾本勝利',
        'zh': '墨尔本胜利',
        'de': 'Melbourne Victory',
        'it': 'Melbourne Victory',
        'pt': 'Melbourne Victory'
      },
      'Perth Glory': {
        'en': 'Perth Glory',
        'es': 'Perth Glory',
        'zh-hk': '珀斯光輝',
        'zh-tw': '珀斯光輝',
        'zh': '珀斯光荣',
        'de': 'Perth Glory',
        'it': 'Perth Glory',
        'pt': 'Perth Glory'
      },

      // Middle Eastern Teams (Various Leagues)
      'Al-Ahli Saudi': {
        'en': 'Al-Ahli Saudi',
        'es': 'Al-Ahli Saudi',
        'zh-hk': '沙特阿赫利',
        'zh-tw': '沙特阿赫利',
        'zh': '沙特阿赫利',
        'de': 'Al-Ahli Saudi',
        'it': 'Al-Ahli Saudi',
        'pt': 'Al-Ahli Saudita'
      },
      'Al-Ittihad': {
        'en': 'Al-Ittihad',
        'es': 'Al-Ittihad',
        'zh-hk': '伊蒂哈德',
        'zh-tw': '伊蒂哈德',
        'zh': '伊蒂哈德',
        'de': 'Al-Ittihad',
        'it': 'Al-Ittihad',
        'pt': 'Al-Ittihad'
      },
      'Al-Shabab': {
        'en': 'Al-Shabab',
        'es': 'Al-Shabab',
        'zh-hk': '青年人',
        'zh-tw': '青年人',
        'zh': '青年人',
        'de': 'Al-Shabab',
        'it': 'Al-Shabab',
        'pt': 'Al-Shabab'
      },

      // African Teams (Various Leagues)
      'Al Ahly': {
        'en': 'Al Ahly',
        'es': 'Al Ahly',
        'zh-hk': '阿赫利',
        'zh-tw': '阿赫利',
        'zh': '阿赫利',
        'de': 'Al Ahly Kairo',
        'it': 'Al Ahly',
        'pt': 'Al Ahly'
      },
      'Zamalek': {
        'en': 'Zamalek',
        'es': 'Zamalek',
        'zh-hk': '薩馬雷克',
        'zh-tw': '薩馬雷克',
        'zh': '萨马雷克',
        'de': 'Zamalek SC',
        'it': 'Zamalek',
        'pt': 'Zamalek'
      },
      'Kaizer Chiefs': {
        'en': 'Kaizer Chiefs',
        'es': 'Kaizer Chiefs',
        'zh-hk': '凱撒酋長',
        'zh-tw': '凱撒酋長',
        'zh': '凯泽酋长',
        'de': 'Kaizer Chiefs',
        'it': 'Kaizer Chiefs',
        'pt': 'Kaizer Chiefs'
      },
      'Orlando Pirates': {
        'en': 'Orlando Pirates',
        'es': 'Orlando Pirates',
        'zh-hk': '奧蘭多海盜',
        'zh-tw': '奧蘭多海盜',
        'zh': '奥兰多海盗',
        'de': 'Orlando Pirates',
        'it': 'Orlando Pirates',
        'pt': 'Orlando Pirates'
      },
      'Mamelodi Sundowns': {
        'en': 'Mamelodi Sundowns',
        'es': 'Mamelodi Sundowns',
        'zh-hk': '馬梅洛迪日落',
        'zh-tw': '馬梅洛迪日落',
        'zh': '马梅洛迪日落',
        'de': 'Mamelodi Sundowns',
        'it': 'Mamelodi Sundowns',
        'pt': 'Mamelodi Sundowns'
      },

      // Additional Italian Teams for Serie A/B Coverage
      'Benevento': {
        'en': 'Benevento',
        'es': 'Benevento',
        'zh-hk': '賓尼雲圖',
        'zh-tw': '貝內文托',
        'zh': '贝内文托',
        'de': 'Benevento Calcio',
        'it': 'Benevento',
        'pt': 'Benevento'
      },
      'Frosinone': {
        'en': 'Frosinone',
        'es': 'Frosinone',
        'zh-hk': '弗羅西諾內',
        'zh-tw': '弗羅西諾內',
        'zh': '弗罗西诺内',
        'de': 'Frosinone Calcio',
        'it': 'Frosinone',
        'pt': 'Frosinone'
      },
      'Pisa': {
        'en': 'Pisa',
        'es': 'Pisa',
        'zh-hk': '比薩',
        'zh-tw': '比薩',
        'zh': '比萨',
        'de': 'Pisa SC',
        'it': 'Pisa',
        'pt': 'Pisa'
      },

      // Spanish Lower Division Teams
      'L\'Entregu': {
        'en': 'L\'Entregu',
        'es': 'L\'Entregu',
        'zh-hk': '恩特雷古',
        'zh-tw': '恩特雷古',
        'zh': '恩特雷古',
        'de': 'L\'Entregu',
        'it': 'L\'Entregu',
        'pt': 'L\'Entregu'
      },
      'Marino de Luanco': {
        'en': 'Marino de Luanco',
        'es': 'Marino de Luanco',
        'zh-hk': '盧安科馬里諾',
        'zh-tw': '盧安科馬里諾',
        'zh': '卢安科马里诺',
        'de': 'Marino de Luanco',
        'it': 'Marino de Luanco',
        'pt': 'Marino de Luanco'
      },
      'Marbella': {
        'en': 'Marbella',
        'es': 'Marbella',
        'zh-hk': '馬貝拉',
        'zh-tw': '馬貝拉',
        'zh': '马贝拉',
        'de': 'Marbella FC',
        'it': 'Marbella',
        'pt': 'Marbella'
      },
      'AD Ceuta FC': {
        'en': 'AD Ceuta FC',
        'es': 'AD Ceuta FC',
        'zh-hk': '休達',
        'zh-tw': '休達',
        'zh': '休达',
        'de': 'AD Ceuta FC',
        'it': 'AD Ceuta FC',
        'pt': 'AD Ceuta FC'
      },
      'Real Betis II': {
        'en': 'Real Betis II',
        'es': 'Real Betis Deportivo',
        'zh-hk': '皇家貝蒂斯二隊',
        'zh-tw': '皇家貝蒂斯二隊',
        'zh': '皇家贝蒂斯二队',
        'de': 'Real Betis II',
        'it': 'Real Betis II',
        'pt': 'Real Betis II'
      },
      'Osasuna II': {
        'en': 'Osasuna II',
        'es': 'Osasuna Promesas',
        'zh-hk': '奧薩辛拿二隊',
        'zh-tw': '奧薩蘇納二隊',
        'zh': '奥萨苏纳二队',
        'de': 'CA Osasuna II',
        'it': 'Osasuna II',
        'pt': 'Osasuna II'
      },
      'Cordoba': {
        'en': 'Cordoba',
        'es': 'Córdoba',
        'zh-hk': '哥多華',
        'zh-tw': '科爾多瓦',
        'zh': '科尔多瓦',
        'de': 'Córdoba CF',
        'it': 'Córdoba',
        'pt': 'Córdoba'
      },
      'Andorra': {
        'en': 'Andorra',
        'es': 'FC Andorra',
        'zh-hk': '安道爾',
        'zh-tw': '安道爾',
        'zh': '安道尔',
        'de': 'FC Andorra',
        'it': 'FC Andorra',
        'pt': 'FC Andorra'
      },

      // National Teams (UEFA Nations League, World Cup Qualifiers)
      'Germany': {
        'en': 'Germany',
        'es': 'Alemania',
        'zh-hk': '德國',
        'zh-tw': '德國',
        'zh': '德国',
        'de': 'Deutschland',
        'it': 'Germania',
        'pt': 'Alemanha'
      },
      'France': {
        'en': 'France',
        'es': 'Francia',
        'zh-hk': '法國',
        'zh-tw': '法國',
        'zh': '法国',
        'de': 'Frankreich',
        'it': 'Francia',
        'pt': 'França'
      },
      'Spain': {
        'en': 'Spain',
        'es': 'España',
        'zh-hk': '西班牙',
        'zh-tw': '西班牙',
        'zh': '西班牙',
        'de': 'Spanien',
        'it': 'Spagna',
        'pt': 'Espanha'
      },
      'Italy': {
        'en': 'Italy',
        'es': 'Italia',
        'zh-hk': '意大利',
        'zh-tw': '意大利',
        'zh': '意大利',
        'de': 'Italien',
        'it': 'Italia',
        'pt': 'Itália'
      },
      'England': {
        'en': 'England',
        'es': 'Inglaterra',
        'zh-hk': '英格蘭',
        'zh-tw': '英格蘭',
        'zh': '英格兰',
        'de': 'England',
        'it': 'Inghilterra',
        'pt': 'Inglaterra'
      },
      'Portugal': {
        'en': 'Portugal',
        'es': 'Portugal',
        'zh-hk': '葡萄牙',
        'zh-tw': '葡萄牙',
        'zh': '葡萄牙',
        'de': 'Portugal',
        'it': 'Portogallo',
        'pt': 'Portugal'
      },
      'Netherlands': {
        'en': 'Netherlands',
        'es': 'Países Bajos',
        'zh-hk': '荷蘭',
        'zh-tw': '荷蘭',
        'zh': '荷兰',
        'de': 'Niederlande',
        'it': 'Paesi Bassi',
        'pt': 'Holanda'
      },
      'Brazil': {
        'en': 'Brazil',
        'es': 'Brasil',
        'zh-hk': '巴西',
        'zh-tw': '巴西',
        'zh': '巴西',
        'de': 'Brasilien',
        'it': 'Brasile',
        'pt': 'Brasil'
      },
      'Argentina': {
        'en': 'Argentina',
        'es': 'Argentina',
        'zh-hk': '阿根廷',
        'zh-tw': '阿根廷',
        'zh': '阿根廷',
        'de': 'Argentinien',
        'it': 'Argentina',
        'pt': 'Argentina'
      },

      // Additional MLS/Concacaf teams that might appear in friendlies
      'LA FC': {
        'en': 'LAFC',
        'es': 'LAFC',
        'zh-hk': '洛杉磯FC',
        'zh-tw': '洛杉磯FC',
        'zh': '洛杉矶FC',
        'de': 'LAFC',
        'it': 'LAFC',
        'pt': 'LAFC'
      },
      'Toronto FC': {
        'en': 'Toronto FC',
        'es': 'Toronto FC',
        'zh-hk': '多倫多FC',
        'zh-tw': '多倫多FC',
        'zh': '多伦多FC',
        'de': 'Toronto FC',
        'it': 'Toronto FC',
        'pt': 'Toronto FC'
      },
      'Philadelphia Union': {
        'en': 'Philadelphia Union',
        'es': 'Philadelphia Union',
        'zh-hk': '費城聯合',
        'zh-tw': '費城聯合',
        'zh': '费城联合',
        'de': 'Philadelphia Union',
        'it': 'Philadelphia Union',
        'pt': 'Philadelphia Union'
      },
      'Orlando City': {
        'en': 'Orlando City',
        'es': 'Orlando City',
        'zh-hk': '奧蘭多城',
        'zh-tw': '奧蘭多城',
        'zh': '奥兰多城',
        'de': 'Orlando City',
        'it': 'Orlando City',
        'pt': 'Orlando City'
      },
      'Austin FC': {
        'en': 'Austin FC',
        'es': 'Austin FC',
        'zh-hk': '奧斯汀FC',
        'zh-tw': '奧斯汀FC',
        'zh': '奥斯汀FC',
        'de': 'Austin FC',
        'it': 'Austin FC',
        'pt': 'Austin FC'
      },
      'Vancouver Whitecaps': {
        'en': 'Vancouver Whitecaps',
        'es': 'Vancouver Whitecaps',
        'zh-hk': '溫哥華白浪',
        'zh-tw': '溫哥華白浪',
        'zh': '温哥华白帽',
        'de': 'Vancouver Whitecaps',
        'it': 'Vancouver Whitecaps',
        'pt': 'Vancouver Whitecaps'
      }
    };

    // Check for exact match first
    if (teamTranslations[teamName]) {
      return teamTranslations[teamName][currentLanguage] || teamName;
    }

    // Check for partial matches (useful for variations like "FC Barcelona" vs "Barcelona")
    for (const [key, translations] of Object.entries(teamTranslations)) {
      if (teamName.includes(key) || key.includes(teamName)) {
        return translations[currentLanguage] || teamName;
      }
    }

    // Intelligent pattern matching for common team name variations
    const normalizedTeamName = teamName.toLowerCase().trim();

    // Handle FC/CF prefix variations
    if (normalizedTeamName.startsWith('fc ') || normalizedTeamName.startsWith('cf ')) {
      const nameWithoutPrefix = teamName.substring(3).trim();
      if (teamTranslations[nameWithoutPrefix]) {
        return teamTranslations[nameWithoutPrefix][currentLanguage] || teamName;
      }
    }

    // Handle common team name suffixes
    const suffixPatterns = ['FC', 'CF', 'SC', 'AC', 'United', 'City'];
    for (const suffix of suffixPatterns) {
      if (normalizedTeamName.endsWith(` ${suffix.toLowerCase()}`)) {
        const nameWithoutSuffix = teamName.substring(0, teamName.length - suffix.length - 1).trim();
        if (teamTranslations[nameWithoutSuffix]) {
          return teamTranslations[nameWithoutSuffix][currentLanguage] || teamName;
        }
      }
    }

    // Return original name if no translation found
    return teamName;
  };


  return {
    currentLanguage,
    t,
    translateLeagueName,
    translateTeamName
  };
};

export { countryToLanguageMap };