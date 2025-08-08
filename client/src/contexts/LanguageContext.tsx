import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  translations: { [key: string]: { [key: string]: string } };
  translateCountryName?: (countryName: string) => string;
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
    'popular_football_leagues': "Popular Football Leagues",
    'leagues_cup': "Leagues Cup",
    'world': "World",
    'ended': "Ended"
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
    'myScores': "Mis Resultados",
    'live': "VIVO",
    'finished': "FT",
    'not_started': "No Iniciado",
    'featured_match': "Partido Destacado",
    'by_time': "por tiempo",
    'sun': "Do",
    'mon': "Lu",
    'tue': "Ma",
    'wed': "Mi",
    'thu': "Ju",
    'fri': "Vi",
    'sat': "Sa",
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
    'world': "Mundial",
    'ended': "Terminado"
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
    'colombia': "哥倫比亞",
    'spain': "西班牙",
    'germany': "德國",
    'france': "法國",
    'italy': "意大利",
    'england': "英格蘭",
    'brazil': "巴西",
    'argentina': "阿根廷",
    'mexico': "墨西哥",
    'portugal': "葡萄牙",
    'netherlands': "荷蘭",
    'belgium': "比利時",
    'turkey': "土耳其",
    'switzerland': "瑞士",
    'austria': "奧地利",
    'denmark': "丹麥",
    'sweden': "瑞典",
    'norway': "挪威",
    'poland': "波蘭",
    'czech_republic': "捷克共和國",
    'croatia': "克羅地亞",
    'serbia': "塞爾維亞",
    'greece': "希臘",
    'ukraine': "烏克蘭",
    'russia': "俄羅斯",
    'bulgaria': "保加利亞",
    'romania': "羅馬尼亞",
    'hungary': "匈牙利",
    'slovakia': "斯洛伐克",
    'slovenia': "斯洛文尼亞",
    'bosnia_and_herzegovina': "波斯尼亞和黑塞哥維那",
    'north_macedonia': "北馬其頓",
    'montenegro': "黑山",
    'albania': "阿爾巴尼亞",
    'kosovo': "科索沃",
    'moldova': "摩爾多瓦",
    'belarus': "白俄羅斯",
    'lithuania': "立陶宛",
    'latvia': "拉脫維亞",
    'estonia': "愛沙尼亞",
    'finland': "芬蘭",
    'iceland': "冰島",
    'ireland': "愛爾蘭",
    'united_states': "美國",
    'canada': "加拿大",
    'chile': "智利",
    'uruguay': "烏拉圭",
    'paraguay': "巴拉圭",
    'bolivia': "玻利維亞",
    'ecuador': "厄瓜多爾",
    'venezuela': "委內瑞拉",
    'peru': "秘魯",
    'japan': "日本",
    'south_korea': "南韓",
    'china': "中國",
    'australia': "澳洲",
    'new_zealand': "紐西蘭",
    'saudi_arabia': "沙特阿拉伯",
    'united_arab_emirates': "阿拉伯聯合酋長國",
    'qatar': "卡塔爾",
    'kuwait': "科威特",
    'iran': "伊朗",
    'iraq': "伊拉克",
    'egypt': "埃及",
    'morocco': "摩洛哥",
    'algeria': "阿爾及利亞",
    'tunisia': "突尼斯",
    'libya': "利比亞",
    'south_africa': "南非",
    'nigeria': "尼日利亞",
    'ghana': "加納",
    'cameroon': "喀麥隆",
    'ivory_coast': "象牙海岸",
    'senegal': "塞內加爾",
    'mali': "馬里",
    'burkina_faso': "布基納法索",
    'niger': "尼日爾",
    'chad': "乍得",
    'kenya': "肯雅",
    'uganda': "烏干達",
    'tanzania': "坦桑尼亞",
    'ethiopia': "埃塞俄比亞",
    'angola': "安哥拉",
    'zambia': "贊比亞",
    'zimbabwe': "津巴布韋",
    'botswana': "博茨瓦納",
    'namibia': "納米比亞",
    'madagascar': "馬達加斯加",
    'mauritius': "毛里求斯"
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
    'colombia': "哥倫比亞",
    'spain': "西班牙",
    'germany': "德國",
    'france': "法國",
    'italy': "意大利",
    'england': "英格蘭",
    'brazil': "巴西",
    'argentina': "阿根廷",
    'mexico': "墨西哥",
    'portugal': "葡萄牙",
    'netherlands': "荷蘭",
    'belgium': "比利時",
    'turkey': "土耳其",
    'switzerland': "瑞士",
    'austria': "奧地利",
    'denmark': "丹麥",
    'sweden': "瑞典",
    'norway': "挪威",
    'poland': "波蘭",
    'czech_republic': "捷克共和國",
    'croatia': "克羅地亞",
    'serbia': "塞爾維亞",
    'greece': "希臘",
    'ukraine': "烏克蘭",
    'russia': "俄羅斯",
    'bulgaria': "保加利亞",
    'romania': "羅馬尼亞",
    'hungary': "匈牙利",
    'slovakia': "斯洛伐克",
    'slovenia': "斯洛文尼亞",
    'bosnia_and_herzegovina': "波斯尼亞和黑塞哥維那",
    'north_macedonia': "北馬其頓",
    'montenegro': "黑山",
    'albania': "阿爾巴尼亞",
    'kosovo': "科索沃",
    'moldova': "摩爾多瓦",
    'belarus': "白俄羅斯",
    'lithuania': "立陶宛",
    'latvia': "拉脫維亞",
    'estonia': "愛沙尼亞",
    'finland': "芬蘭",
    'iceland': "冰島",
    'ireland': "愛爾蘭",
    'united_states': "美國",
    'canada': "加拿大",
    'chile': "智利",
    'uruguay': "烏拉圭",
    'paraguay': "巴拉圭",
    'bolivia': "玻利維亞",
    'ecuador': "厄瓜多爾",
    'venezuela': "委內瑞拉",
    'peru': "秘魯",
    'japan': "日本",
    'south_korea': "南韓",
    'china': "中國",
    'australia': "澳洲",
    'new_zealand': "紐西蘭",
    'saudi_arabia': "沙特阿拉伯",
    'united_arab_emirates': "阿拉伯聯合酋長國",
    'qatar': "卡塔爾",
    'kuwait': "科威特",
    'iran': "伊朗",
    'iraq': "伊拉克",
    'egypt': "埃及",
    'morocco': "摩洛哥",
    'algeria': "阿爾及利亞",
    'tunisia': "突尼斯",
    'libya': "利比亞",
    'south_africa': "南非",
    'nigeria': "尼日利亞",
    'ghana': "加納",
    'cameroon': "喀麥隆",
    'ivory_coast': "象牙海岸",
    'senegal': "塞內加爾",
    'mali': "馬里",
    'burkina_faso': "布基納法索",
    'niger': "尼日爾",
    'chad': "乍得",
    'kenya': "肯雅",
    'uganda': "烏干達",
    'tanzania': "坦桑尼亞",
    'ethiopia': "埃塞俄比亞",
    'angola': "安哥拉",
    'zambia': "贊比亞",
    'zimbabwe': "津巴布韋",
    'botswana': "博茨瓦納",
    'namibia': "納米比亞",
    'madagascar': "馬達加斯加",
    'mauritius': "毛里求斯"
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
    'featured_match': "Spiel des Tages",
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
    'ended': "Beendet"
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
    'featured_match': "Partita in Evidenza",
    'by_time': "per tempo",
    'sun': "Do",
    'mon': "Lu",
    'tue': "Ma",
    'wed': "Me",
    'thu': "Gi",
    'fri': "Ve",
    'sat': "Sa",
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
    'ended': "Finito"
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
    'featured_match': "Jogo em Destaque",
    'by_time': "por tempo",
    'sun': "Do",
    'mon': "Se",
    'tue': "Te",
    'wed': "Qu",
    'thu': "Qu",
    'fri': "Se",
    'sat': "Sa",
    'sunday': "Domingo",
    'monday': "Segunda-feira",
    'tuesday': "Terça-feira",
    'wednesday': "Quarta-feira",
    'thursday': "Quinta-feira",
    'friday': "Sexta-feira",
    'saturday': "Sábado",
    'month': "Mês",
    'year': "Ano",
    'next_month': "Mês seguinte",
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
    'leagues_cup': "Copa das Ligas",
    'world': "Mundo",
    'ended': "Terminado"
  },
  'zh-tw': {
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
    'colombia': "哥倫比亞",
    'spain': "西班牙",
    'germany': "德國",
    'france': "法國",
    'italy': "意大利",
    'england': "英格蘭",
    'brazil': "巴西",
    'argentina': "阿根廷",
    'mexico': "墨西哥",
    'portugal': "葡萄牙",
    'netherlands': "荷蘭",
    'belgium': "比利時",
    'turkey': "土耳其",
    'switzerland': "瑞士",
    'austria': "奧地利",
    'denmark': "丹麥",
    'sweden': "瑞典",
    'norway': "挪威",
    'poland': "波蘭",
    'czech_republic': "捷克共和國",
    'croatia': "克羅地亞",
    'serbia': "塞爾維亞",
    'greece': "希臘",
    'ukraine': "烏克蘭",
    'russia': "俄羅斯",
    'bulgaria': "保加利亞",
    'romania': "羅馬尼亞",
    'hungary': "匈牙利",
    'slovakia': "斯洛伐克",
    'slovenia': "斯洛文尼亞",
    'bosnia_and_herzegovina': "波斯尼亞和黑塞哥維那",
    'north_macedonia': "北馬其頓",
    'montenegro': "黑山",
    'albania': "阿爾巴尼亞",
    'kosovo': "科索沃",
    'moldova': "摩爾多瓦",
    'belarus': "白俄羅斯",
    'lithuania': "立陶宛",
    'latvia': "拉脫維亞",
    'estonia': "愛沙尼亞",
    'finland': "芬蘭",
    'iceland': "冰島",
    'ireland': "愛爾蘭",
    'united_states': "美國",
    'canada': "加拿大",
    'chile': "智利",
    'uruguay': "烏拉圭",
    'paraguay': "巴拉圭",
    'bolivia': "玻利維亞",
    'ecuador': "厄瓜多爾",
    'venezuela': "委內瑞拉",
    'peru': "秘魯",
    'japan': "日本",
    'south_korea': "南韓",
    'china': "中國",
    'australia': "澳洲",
    'new_zealand': "紐西蘭",
    'saudi_arabia': "沙特阿拉伯",
    'united_arab_emirates': "阿拉伯聯合酋長國",
    'qatar': "卡塔爾",
    'kuwait': "科威特",
    'iran': "伊朗",
    'iraq': "伊拉克",
    'egypt': "埃及",
    'morocco': "摩洛哥",
    'algeria': "阿爾及利亞",
    'tunisia': "突尼斯",
    'libya': "利比亞",
    'south_africa': "南非",
    'nigeria': "尼日利亞",
    'ghana': "加納",
    'cameroon': "喀麥隆",
    'ivory_coast': "象牙海岸",
    'senegal': "塞內加爾",
    'mali': "馬里",
    'burkina_faso': "布基納法索",
    'niger': "尼日爾",
    'chad': "乍得",
    'kenya': "肯雅",
    'uganda': "烏干達",
    'tanzania': "坦桑尼亞",
    'ethiopia': "埃塞俄比亞",
    'angola': "安哥拉",
    'zambia': "贊比亞",
    'zimbabwe': "津巴布韋",
    'botswana': "博茨瓦納",
    'namibia': "納米比亞",
    'madagascar': "馬達加斯加",
    'mauritius': "毛里求斯"
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
      translations,
      translateCountryName: (name: string) => name
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
        'en': 'Argentine Primera División',
        'es': 'Liga Profesional Argentina',
        'zh-hk': '阿根廷甲級聯賽',
        'zh-tw': '阿根廷甲級聯賽',
        'zh': '阿根廷甲级联赛',
        'de': 'Argentinische Primera División',
        'it': 'Primera División Argentina',
        'pt': 'Primeira Divisão Argentina'
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

    // Return original name if no pattern matched
    return leagueName;
  };

  // Dynamic country name translation function
  const translateCountryName = (countryName: string): string => {
    if (!countryName) return countryName;

    // Create a simple key from the country name
    const countryKey = countryName.toLowerCase().replace(/\s+/g, '_');
    
    // Try to find translation using the key
    const translation = translations[currentLanguage]?.[countryKey];
    if (translation) {
      return translation;
    }

    // Return original name if no translation found
    return countryName;
  };

  return { t, translateLeagueName, translateCountryName };
};

export { countryToLanguageMap };