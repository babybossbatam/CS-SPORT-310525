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