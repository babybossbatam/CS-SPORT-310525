import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { smartTeamTranslation } from '@/lib/smartTeamTranslation';
import { smartLeagueCountryTranslation } from '@/lib/smartLeagueCountryTranslation';
import { smartPlayerTranslation } from '@/lib/smartPlayerTranslation';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  setLanguageWithUrlUpdate: (language: string) => void;
  setLanguageByCountry: (countryName: string) => void;
  translations: { [key: string]: { [key: string]: string } };
  translateLeagueName: (leagueName: string) => string;
  translateCountryName: (countryName: string) => string;
  translateTeamName: (teamName: string) => string;
  translatePlayerName: (playerName: string) => string;
  translatePositionName: (positionName: string) => string;
  getMatchStatusTranslation: (status: string, language: string) => string;
  learnFromFixtures: (fixtures: any[]) => void;
  learnFromPlayerData: (players: any[]) => void;
}

const manualRoundTranslations = {
  preliminary_round: {
    en: 'Preliminary Round',
    ar: 'الدور التمهيدي',
    zh: '预赛',
    'zh-hk': '預賽',
    fr: 'Tour préliminaire',
    es: 'Ronda preliminar',
    pt: 'Rodada preliminar',
    de: 'Vorrunde',
    it: 'Turno preliminare',
    ru: 'Предварительный раунд',
    ja: '予備ラウンド',
    ko: '예비 라운드',
    tr: 'Ön eleme turu',
    nl: 'Voorronde',
    pl: 'Runda wstępna',
    sv: 'Förhandsrunda',
    da: 'Indledende runde',
    no: 'Innledende runde',
    fi: 'Alustava kierros',
    cs: 'Předkolo',
    sk: 'Predkolo',
    hu: 'Előkör',
    ro: 'Runda preliminară',
    bg: 'Предварителен кръг',
    hr: 'Preliminarni krug',
    sr: 'Preliminarni krug',
    sl: 'Preliminarni krog',
    et: 'Eelring',
    lv: 'Priekškārta',
    lt: 'Preliminarus turas',
    mt: 'Dawra preliminari',
    ga: 'Babhta réamhcheimnithe',
    cy: 'Rownd ragarweiniol',
    is: 'Forleikur',
    mk: 'Претходен круг',
    sq: 'Raundi paraprak',
    eu: 'Aurretiazko txanda',
    ca: 'Ronda preliminar',
    gl: 'Ronda preliminar',
    he: 'סיבוב מוקדמות',
    hi: 'प्रारंभिक दौर',
    th: 'รอบเบื้องต้น',
    vi: 'Vòng loại',
    id: 'Putaran pendahuluan',
    ms: 'Pusingan awal',
    uk: 'Попередній раунд',
    be: 'Папярэдні раўнд'
  },
  numbered_round: {
    zh: '第{{value}}轮',
    'zh-hk': '第{{value}}輪',
    fr: '{{value}} tour',
    es: '{{value}} ronda',
    pt: '{{value}} rodada',
    de: '{{value}} Runde',
    it: '{{value}} turno',
    ru: '{{value}} раунд',
    ja: '第{{value}}ラウンド',
    ko: '{{value}} 라운드',
    tr: '{{value}} tur',
    nl: '{{value}} ronde',
    pl: '{{value}} runda',
    sv: '{{value}} omgång',
    da: '{{value}} runde',
    no: '{{value}} runde',
    fi: '{{value}} kierros',
    cs: '{{value}} kolo',
    sk: '{{value}} kolo',
    hu: '{{value}} kör',
    ro: '{{value}} rundă',
    bg: '{{value}} кръг',
    hr: '{{value}} krug',
    sr: '{{value}} krug',
    sl: '{{value}} krog',
    et: '{{value}} ring',
    lv: '{{value}} kārta',
    lt: '{{value}} turas',
    mt: '{{value}} dawra',
    ga: '{{value}} babhta',
    cy: '{{value}} rownd',
    is: '{{value}} leikur',
    mk: '{{value}} круг',
    sq: '{{value}} raund',
    eu: '{{value}} txanda',
    ca: '{{value}} ronda',
    gl: '{{value}} ronda',
    he: 'סיבוב {{value}}',
    hi: '{{value}} दौर',
    th: 'รอบที่ {{value}}',
    vi: 'Vòng {{value}}',
    id: 'Putaran {{value}}',
    ms: 'Pusingan {{value}}',
    uk: '{{value}} раунд',
    be: '{{value}} раўнд'
  },
  qualifying_round: {
    en: '{{value}} Qualifying',
    ar: 'تأهيل {{value}}',
    zh: '{{value}}资格赛',
    'zh-hk': '{{value}}資格賽',
    fr: '{{value}} qualifications',
    es: '{{value}} clasificación',
    pt: '{{value}} qualificação',
    de: '{{value}} Qualifikation',
    it: '{{value}} qualificazione',
    ru: '{{value}} отборочный',
    ja: '{{value}}予選',
    ko: '{{value}} 예선',
    tr: '{{value}} eleme',
    nl: '{{value}} kwalificatie',
    pl: '{{value}} kwalifikacje',
    sv: '{{value}} kval',
    da: '{{value}} kvalifikation',
    no: '{{value}} kvalifisering',
    fi: '{{value}} karsinta',
    cs: '{{value}} kvalifikace',
    sk: '{{value}} kvalifikácia',
    hu: '{{value}} selejtező',
    ro: '{{value}} calificare',
    bg: '{{value}} квалификация',
    hr: '{{value}} kvalifikacije',
    sr: '{{value}} kvalifikacije',
    sl: '{{value}} kvalifikacije',
    et: '{{value}} kvalifikatsioon',
    lv: '{{value}} kvalifikācija',
    lt: '{{value}} atranka',
    mt: '{{value}} kwalifikazzjoni',
    ga: '{{value}} cáilithe',
    cy: '{{value}} cymhwyso',
    is: '{{value}} undankeppni',
    mk: '{{value}} квалификации',
    sq: '{{value}} kualifikim',
    eu: '{{value}} sailkapen',
    ca: '{{value}} classificació',
    gl: '{{value}} clasificación',
    he: '{{value}} מוקדמות',
    hi: '{{value}} क्वालीफाइंग',
    th: '{{value}} คัดเลือก',
    vi: '{{value}} vòng loại',
    id: '{{value}} kualifikasi',
    ms: '{{value}} kelayakan',
    uk: '{{value}} кваліфікація',
    be: '{{value}} кваліфікацыя'
  },
  playoff_round: {
    en: 'Play-off',
    ar: 'الملحق',
    zh: '附加赛',
    'zh-hk': '附加賽',
    fr: 'Barrage',
    es: 'Play-off',
    pt: 'Play-off',
    de: 'Play-off',
    it: 'Play-off',
    ru: 'Плей-офф',
    ja: 'プレーオフ',
    ko: '플레이오프',
    tr: 'Play-off',
    nl: 'Play-off',
    pl: 'Baraż',
    sv: 'Play-off',
    da: 'Play-off',
    no: 'Play-off',
    fi: 'Play-off',
    cs: 'Play-off',
    sk: 'Play-off',
    hu: 'Rájátszás',
    ro: 'Play-off',
    bg: 'Плейоф',
    hr: 'Doigravanje',
    sr: 'Doigravanje',
    sl: 'Dodatne kvalifikacije',
    et: 'Play-off',
    lv: 'Play-off',
    lt: 'Atkrintamosios',
    mt: 'Play-off',
    ga: 'Cluiche breise',
    cy: 'Chwarae i ffwrdd',
    is: 'Úrslitaleikur',
    mk: 'Плеј-оф',
    sq: 'Play-off',
    eu: 'Play-off',
    ca: 'Play-off',
    gl: 'Play-off',
    he: 'פלייאוף',
    hi: 'प्ले-ऑफ',
    th: 'เพลย์ออฟ',
    vi: 'Play-off',
    id: 'Play-off',
    ms: 'Play-off',
    uk: 'Плей-оф',
    be: 'Плей-оф'
  },
  round_of_x: {
    en: 'Round of {{value}}',
    ar: 'دور الـ{{value}}',
    zh: '{{value}}强',
    'zh-hk': '{{value}}強',
    fr: 'Huitièmes de finale',
    es: 'Ronda de {{value}}',
    pt: 'Rodada de {{value}}',
    de: 'Runde der letzten {{value}}',
    it: 'Ottavi di finale',
    ru: '1/{{value}} финала',
    ja: 'ベスト{{value}}',
    ko: '{{value}}강',
    tr: 'Son {{value}}',
    nl: 'Laatste {{value}}',
    pl: '1/{{value}} finału',
    sv: 'Åttondelsfinaler',
    da: 'Ottendedelsfinaler',
    no: 'Åttedelsfinaler',
    fi: 'Kahdeksannesvälit',
    cs: 'Osmifinále',
    sk: 'Osemfinále',
    hu: 'Nyolcaddöntő',
    ro: 'Optimi',
    bg: 'Осминафинал',
    hr: 'Osmina finala',
    sr: 'Osmina finala',
    sl: 'Osmina finala',
    et: 'Kaheksandikfinaal',
    lv: 'Astondaļfinâls',
    lt: 'Aštuntfinalis',
    mt: 'Tmien finali',
    ga: 'Ochtréad deiridh',
    cy: 'Rownd olaf wyth',
    is: 'Áttundahluti',
    mk: 'Осмина финале',
    sq: 'Të tetëtat',
    eu: 'Zortzirenetan',
    ca: 'Vuitens',
    gl: 'Oitavos',
    he: 'שמינית גמר',
    hi: '{{value}} का दौर',
    th: 'รอบ {{value}}',
    vi: 'Vòng {{value}}',
    id: 'Babak {{value}}',
    ms: 'Pusingan {{value}}',
    uk: '1/{{value}} фіналу',
    be: '1/{{value}} фіналу'
  },
  group_x: {
    en: 'Group {{value}}',
    ar: 'المجموعة {{value}}',
    zh: '{{value}}组',
    'zh-hk': '{{value}}組',
    fr: 'Groupe {{value}}',
    es: 'Grupo {{value}}',
    pt: 'Grupo {{value}}',
    de: 'Gruppe {{value}}',
    it: 'Gruppo {{value}}',
    ru: 'Группа {{value}}',
    ja: 'グループ{{value}}',
    ko: '{{value}}조',
    tr: '{{value}} Grubu',
    nl: 'Groep {{value}}',
    pl: 'Grupa {{value}}',
    sv: 'Grupp {{value}}',
    da: 'Gruppe {{value}}',
    no: 'Gruppe {{value}}',
    fi: 'Lohko {{value}}',
    cs: 'Skupina {{value}}',
    sk: 'Skupina {{value}}',
    hu: '{{value}} csoport',
    ro: 'Grupa {{value}}',
    bg: 'Група {{value}}',
    hr: 'Skupina {{value}}',
    sr: 'Grupa {{value}}',
    sl: 'Skupina {{value}}',
    et: 'Grupp {{value}}',
    lv: 'Grupa {{value}}',
    lt: '{{value}} grupė',
    mt: 'Grupp {{value}}',
    ga: 'Grúpa {{value}}',
    cy: 'Grŵp {{value}}',
    is: 'Riðill {{value}}',
    mk: 'Група {{value}}',
    sq: 'Grupi {{value}}',
    eu: '{{value}} taldea',
    ca: 'Grup {{value}}',
    gl: 'Grupo {{value}}',
    he: 'קבוצה {{value}}',
    hi: 'समूह {{value}}',
    th: 'กลุ่ม {{value}}',
    vi: 'Bảng {{value}}',
    id: 'Grup {{value}}',
    ms: 'Kumpulan {{value}}',
    uk: 'Група {{value}}',
    be: 'Група {{value}}'
  },
  round_number: {
    en: 'R{{value}}',
    ar: 'ج{{value}}',
    zh: 'R{{value}}',
    'zh-hk': 'R{{value}}',
    fr: 'J{{value}}',
    es: 'J{{value}}',
    pt: 'R{{value}}',
    de: 'S{{value}}',
    it: 'G{{value}}',
    ru: 'Т{{value}}',
    ja: 'R{{value}}',
    ko: 'R{{value}}',
    tr: 'H{{value}}',
    nl: 'R{{value}}',
    pl: 'K{{value}}',
    sv: 'O{{value}}',
    da: 'R{{value}}',
    no: 'R{{value}}',
    fi: 'K{{value}}',
    cs: 'K{{value}}',
    sk: 'K{{value}}',
    hu: 'F{{value}}',
    ro: 'E{{value}}',
    bg: 'К{{value}}',
    hr: 'K{{value}}',
    sr: 'К{{value}}',
    sl: 'K{{value}}',
    et: 'V{{value}}',
    lv: 'K{{value}}',
    lt: 'T{{value}}',
    mt: 'R{{value}}',
    ga: 'B{{value}}',
    cy: 'R{{value}}',
    is: 'U{{value}}',
    mk: 'К{{value}}',
    sq: 'R{{value}}',
    eu: 'J{{value}}',
    ca: 'J{{value}}',
    gl: 'X{{value}}',
    he: 'ס{{value}}',
    hi: 'R{{value}}',
    th: 'R{{value}}',
    vi: 'V{{value}}',
    id: 'P{{value}}',
    ms: 'P{{value}}',
    uk: 'Т{{value}}',
    be: 'Т{{value}}'
  },
  matchday: {
    en: 'MD{{value}}',
    ar: 'يوم {{value}}',
    zh: 'MD{{value}}',
    'zh-hk': 'MD{{value}}',
    fr: 'J{{value}}',
    es: 'J{{value}}',
    pt: 'MD{{value}}',
    de: 'S{{value}}',
    it: 'G{{value}}',
    ru: 'МД{{value}}',
    ja: 'MD{{value}}',
    ko: 'MD{{value}}',
    tr: 'MG{{value}}',
    nl: 'S{{value}}',
    pl: 'MR{{value}}',
    sv: 'MD{{value}}',
    da: 'KR{{value}}',
    no: 'KR{{value}}',
    fi: 'OP{{value}}',
    cs: 'DH{{value}}',
    sk: 'DZ{{value}}',
    hu: 'MN{{value}}',
    ro: 'EM{{value}}',
    bg: 'МД{{value}}',
    hr: 'DM{{value}}',
    sr: 'ДМ{{value}}',
    sl: 'DT{{value}}',
    et: 'MP{{value}}',
    lv: 'MD{{value}}',
    lt: 'MD{{value}}',
    mt: 'MD{{value}}',
    ga: 'LM{{value}}',
    cy: 'DG{{value}}',
    is: 'LD{{value}}',
    mk: 'МД{{value}}',
    sq: 'MD{{value}}',
    eu: 'JG{{value}}',
    ca: 'JG{{value}}',
    gl: 'XP{{value}}',
    he: 'MD{{value}}',
    hi: 'MD{{value}}',
    th: 'MD{{value}}',
    vi: 'LT{{value}}',
    id: 'HT{{value}}',
    ms: 'HP{{value}}',
    uk: 'МД{{value}}',
    be: 'МД{{value}}'
  },
  friendly_round_number: {
    en: 'Friendly {{number}}',
    ar: 'ودية {{number}}',
    zh: '友谊赛{{number}}',
    'zh-hk': '友誼賽{{number}}',
    fr: 'Amical {{number}}',
    es: 'Amistoso {{number}}',
    pt: 'Amistoso {{number}}',
    de: 'Freundschaft {{number}}',
    it: 'Amichevole {{number}}',
    ru: 'Товарищеский {{number}}',
    ja: '親善試合{{number}}',
    ko: '친선경기 {{number}}',
    tr: 'Dostluk {{number}}',
    nl: 'Vriendschap {{number}}',
    pl: 'Towarzyski {{number}}',
    sv: 'Vänskap {{number}}',
    da: 'Venskab {{number}}',
    no: 'Vennskap {{number}}',
    fi: 'Ystävyys {{number}}',
    cs: 'Přátelský {{number}}',
    sk: 'Priateľský {{number}}',
    hu: 'Barátságos {{number}}',
    ro: 'Amical {{number}}',
    bg: 'Приятелски {{number}}',
    hr: 'Prijateljski {{number}}',
    sr: 'Пријатељски {{number}}',
    sl: 'Prijateljski {{number}}',
    et: 'Sõprus {{number}}',
    lv: 'Draudzības {{number}}',
    lt: 'Draugiškas {{number}}',
    mt: 'Ħbiberija {{number}}',
    ga: 'Cairdiúil {{number}}',
    cy: 'Cyfeillgar {{number}}',
    is: 'Vináttu {{number}}',
    mk: 'Пријателски {{number}}',
    sq: 'Miqësor {{number}}',
    eu: 'Adiskidetasun {{number}}',
    ca: 'Amistós {{number}}',
    gl: 'Amigable {{number}}',
    he: 'ידידות {{number}}',
    hi: 'मैत्री {{number}}',
    th: 'กระชับมิตร {{number}}',
    vi: 'Giao hữu {{number}}',
    id: 'Persahabatan {{number}}',
    ms: 'Persahabatan {{number}}',
    uk: 'Товариський {{number}}',
    be: 'Таварыскі {{number}}'
  },
  third_place: {
    en: 'Third Place',
    ar: 'المركز الثالث',
    zh: '三四名决赛',
    'zh-hk': '季軍戰',
    fr: 'Troisième place',
    es: 'Tercer lugar',
    pt: 'Terceiro lugar',
    de: 'Dritter Platz',
    it: 'Terzo posto',
    ru: 'Третье место',
    ja: '3位決定戦',
    ko: '3위 결정전',
    tr: 'Üçüncülük',
    nl: 'Derde plaats',
    pl: 'Trzecie miejsce',
    sv: 'Tredje plats',
    da: 'Tredje plads',
    no: 'Tredje plass',
    fi: 'Kolmas sija',
    cs: 'Třetí místo',
    sk: 'Tretie miesto',
    hu: 'Harmadik hely',
    ro: 'Locul trei',
    bg: 'Трето място',
    hr: 'Treće mjesto',
    sr: 'Треће место',
    sl: 'Tretje mesto',
    et: 'Kolmas koht',
    lv: 'Trešā vieta',
    lt: 'Trečia vieta',
    mt: 'Tielet post',
    ga: 'An tríú háit',
    cy: 'Trydydd lle',
    is: 'Þriðji sæti',
    mk: 'Трето место',
    sq: 'Vendi i tretë',
    eu: 'Hirugarren postua',
    ca: 'Tercer lloc',
    gl: 'Terceiro lugar',
    he: 'מקום שלישי',
    hi: 'तीसरा स्थान',
    th: 'อันดับสาม',
    vi: 'Hạng ba',
    id: 'Tempat ketiga',
    ms: 'Tempat ketiga',
    uk: 'Третє місце',
    be: 'Трэцяе месца'
  },
  bronze_final: {
    en: 'Bronze Final',
    ar: 'نهائي البرونز',
    zh: '铜牌战',
    'zh-hk': '銅牌戰',
    fr: 'Finale bronze',
    es: 'Final bronce',
    pt: 'Final bronze',
    de: 'Bronze-Finale',
    it: 'Finale bronzo',
    ru: 'Финал за бронзу',
    ja: 'ブロンズ決勝',
    ko: '동메달 결정전',
    tr: 'Bronz final',
    nl: 'Bronzen finale',
    pl: 'Finał brązu',
    sv: 'Bronsfinal',
    da: 'Bronze finale',
    no: 'Bronsefinale',
    fi: 'Pronssifinaali',
    cs: 'Bronzový finále',
    sk: 'Bronzové finále',
    hu: 'Bronz döntő',
    ro: 'Finala de bronz',
    bg: 'Бронзов финал',
    hr: 'Brončano finale',
    sr: 'Бронзано финале',
    sl: 'Bronasti finale',
    et: 'Pronksi finaal',
    lv: 'Bronzas fināls',
    lt: 'Bronzos finalas',
    mt: 'Finali bronż',
    ga: 'Ceannais cré-umha',
    cy: 'Rownd derfynol efydd',
    is: 'Bronsurislit',
    mk: 'Бронзено финале',
    sq: 'Finalja e bronztë',
    eu: 'Brontzezko finala',
    ca: 'Final bronze',
    gl: 'Final bronce',
    he: 'גמר ארד',
    hi: 'कांस्य फाइनल',
    th: 'ไฟนอลทองแดง',
    vi: 'Chung kết đồng',
    id: 'Final perunggu',
    ms: 'Final gangsa',
    uk: 'Фінал за бронзу',
    be: 'Фінал за бронзу'
  },
  small_final: {
    en: 'Small Final',
    ar: 'النهائي الصغير',
    zh: '小决赛',
    'zh-hk': '小決賽',
    fr: 'Petite finale',
    es: 'Final pequeña',
    pt: 'Final pequena',
    de: 'Kleines Finale',
    it: 'Piccola finale',
    ru: 'Малый финал',
    ja: '小決勝',
    ko: '소결승',
    tr: 'Küçük final',
    nl: 'Kleine finale',
    pl: 'Mały finał',
    sv: 'Liten final',
    da: 'Lille finale',
    no: 'Liten finale',
    fi: 'Pieni finaali',
    cs: 'Malý finále',
    sk: 'Malé finále',
    hu: 'Kis döntő',
    ro: 'Finala mică',
    bg: 'Малък финал',
    hr: 'Mali finale',
    sr: 'Мали финале',
    sl: 'Mali finale',
    et: 'Väike finaal',
    lv: 'Mazais fināls',
    lt: 'Mažasis finalas',
    mt: 'Finali żgħir',
    ga: 'Ceannais beag',
    cy: 'Rownd derfynol fach',
    is: 'Smárislit',
    mk: 'Мало финале',
    sq: 'Finalja e vogël',
    eu: 'Final txikia',
    ca: 'Final petita',
    gl: 'Final pequena',
    he: 'גמר קטן',
    hi: 'छोटा फाइनल',
    th: 'ไฟนอลเล็ก',
    vi: 'Chung kết nhỏ',
    id: 'Final kecil',
    ms: 'Final kecil',
    uk: 'Малий фінал',
    be: 'Малы фінал'
  }
};

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
    'live': 'LIVE',
    'finished': 'FT',
    'not_started': 'Not Started',
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
    'on_penalties': "on penalties",
    'tomorrow': "Tomorrow",
    // Match statuses
    'halftime': 'Halftime',
    'penalties': 'Penalties',
    'extra_time': 'Extra Time',
    'break_time': 'Break Time',
    'interrupted': 'Interrupted',
    'postponed': 'Postponed',
    'cancelled': 'Cancelled',
    'abandoned': 'Abandoned',
    'suspended': 'Suspended',
    'awarded': 'Awarded',
    'walkover': 'Walkover',
    'time_tbd': 'Time TBD',
    'numbered_round': '{{number}} Round',
    'final': 'Final',
    'semi_final': 'Semi-Final',
    'quarter_final': 'Quarter-Final',
    'round_of_16': 'Round of 16',
    'round_of_32': 'Round of 32',
    'group_stage': 'Group Stage',
    'league_phase': 'League Phase',
    'knockout_phase': 'Knockout Phase',
    'summer_friendlies': 'Summer Friendlies',
    'winter_friendlies': 'Winter Friendlies',
    'pre_season': 'Pre-Season',
    'club_friendlies': 'Club Friendlies',
    'after_extra_time': 'After Extra Time',
    'starting_now': 'Starting now',
    'day': 'Day',
    'days': 'Days',
    'match_page': 'Match Page',
    'lineups': 'Lineups',
    'stats': 'Stats',
    'groups': 'Groups',
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
    'live': 'LIVE',
    'finished': 'FT',
    'not_started': 'Not Started',
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
    'ended': "Ended",
    // Match statuses
    'halftime': 'Halftime',
    'penalties': 'Penalties',
    'extra_time': 'Extra Time',
    'break_time': 'Break Time',
    'interrupted': 'Interrupted',
    'postponed': 'Postponed',
    'cancelled': 'Cancelled',
    'abandoned': 'Abandoned',
    'suspended': 'Suspended',
    'awarded': 'Awarded',
    'walkover': 'Walkover',
    'time_tbd': 'Time TBD',
    'numbered_round': '{{value}} Round',
    'final': 'Final',
    'semi_final': 'Semi-Final',
    'quarter_final': 'Quarter-Final',
    'round_of_16': 'Round of 16',
    'round_of_32': 'Round of 32',
    'group_stage': 'Group Stage',
    'league_phase': 'League Phase',
    'knockout_phase': 'Knockout Phase',
    'summer_friendlies': 'Summer Friendlies',
    'winter_friendlies': 'Winter Friendlies',
    'pre_season': 'Pre-Season',
    'club_friendlies': 'Club Friendlies',
    'after_extra_time': 'After Extra Time',
    'match_page': 'Match Page',
    'lineups': 'Lineups',
    'stats': 'Stats',
    'groups': 'Groups',
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
    'live': 'EN VIVO',
    'finished': 'Finalizado',
    'not_started': 'No Iniciado',
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
    'on_penalties': "en penales",
    'tomorrow': "Mañana",
    // Match statuses
    'halftime': 'Medio Tiempo',
    'penalties': 'Penales',
    'extra_time': 'Tiempo Extra',
    'break_time': 'Tiempo de Descanso',
    'interrupted': 'Interrumpido',
    'postponed': 'Aplazado',
    'cancelled': 'Cancelado',
    'abandoned': 'Abandonado',
    'suspended': 'Suspendido',
    'awarded': 'Adjudicado',
    'walkover': 'Walkover',
    'time_tbd': 'Hora por determinar',
    'numbered_round': '{{value}}a Ronda',
    'final': 'Final',
    'semi_final': 'Semifinal',
    'quarter_final': 'Cuartos de Final',
    'round_of_16': 'Octavos de Final',
    'round_of_32': 'Dieciseisavos de Final',
    'group_stage': 'Fase de Grupos',
    'league_phase': 'Fase de Liga',
    'knockout_phase': 'Fase Eliminatoria',
    'summer_friendlies': 'Amistosos de Verano',
    'winter_friendlies': 'Amistosos de Invierno',
    'pre_season': 'Pretemporada',
    'club_friendlies': 'Amistosos de Clubes',
    'after_extra_time': 'Después del Tiempo Extra',
    'starting_now': 'Empezando ahora',
    'day': 'Día',
    'days': 'Días',
    'match_page': 'Página del Partido',
    'lineups': 'Alineaciones',
    'stats': 'Estadísticas',
    'groups': 'Grupos',
  },
  'zh-hk': {
    'today_matches': "今天的比賽",
    'yesterday_matches': "昨天的比賽",
    'tomorrow_matches': "明天的比賽",
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
    'tv': "電 ",
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
    'live': '即時',
    'finished': '結束',
    'not_started': '未開始',
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
    'on_penalties': "互射十二碼",
    'tomorrow': "明天",
    // Match statuses
    'halftime': '中場',
    'penalties': '點球',
    'extra_time': '加時賽',
    'break_time': '休息時間',
    'interrupted': '中斷',
    'postponed': '延期',
    'cancelled': '取消',
    'abandoned': '棄賽',
    'suspended': '暫停',
    'awarded': '判罰',
    'walkover': '不戰而勝',
    'time_tbd': '時間待定',
    'numbered_round': '第{{value}}輪',
    'final': '決賽',
    'semi_final': '半決賽',
    'quarter_final': '四分之一決賽',
    'round_of_16': '16強',
    'round_of_32': '32強',
    'group_stage': '小組賽',
    'league_phase': '聯賽階段',
    'knockout_phase': '淘汰賽',
    'summer_friendlies': '夏季友誼賽',
    'winter_friendlies': '冬季友誼賽',
    'pre_season': '季前賽',
    'club_friendlies': '俱樂部友誼賽',
    'after_extra_time': '加時賽後',
    'starting_now': '即將開始',
    'match_page': '比賽頁面',
    'lineups': '陣容',
    'stats': '統計',
    'groups': '小組',
  },
  'zh': {
    'today_matches': "今天的比赛",
    'yesterday_matches': "昨天的比赛",
    'tomorrow_matches': "明天的比赛",
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
    'live': '直播',
    'finished': '结束',
    'not_started': '未开始',
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
    'ended': "已结束",
    // Match statuses
    'halftime': '中场',
    'penalties': '点球',
    'extra_time': '加时赛',
    'break_time': '休息时间',
    'interrupted': '中断',
    'postponed': '推迟',
    'cancelled': '取消',
    'abandoned': '弃赛',
    'suspended': '暂停',
    'awarded': '判罚',
    'walkover': '不战而胜',
    'time_tbd': '时间待定',
    'numbered_round': '第{{value}}轮',
    'final': '决赛',
    'semi_final': '半决賽',
    'quarter_final': '四分之一决赛',
    'round_of_16': '16强',
    'round_of_32': '32强',
    'group_stage': '小组赛',
    'league_phase': '联赛阶段',
    'knockout_phase': '淘汰赛',
    'summer_friendlies': '夏季友谊赛',
    'winter_friendlies': '冬季友谊赛',
    'pre_season': '季前赛',
    'club_friendlies': '俱乐部友谊赛',
    'after_extra_time': '加时赛后',
    'starting_now': '即将开始',
    'match_page': '比赛页面',
    'lineups': '阵容',
    'stats': '统计',
    'groups': '小组',
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
    'live': 'LIVE',
    'finished': 'Beendet',
    'not_started': 'Nicht begonnen',
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
    'on_penalties': "im Elfmeterschießen",
    'tomorrow': "Morgen",
    'day': "Tag",
    'days': "Tage",
    // Match statuses
    'halftime': 'Halbzeit',
    'penalties': 'Elfmeterschießen',
    'extra_time': 'Verlängerung',
    'break_time': 'Pause',
    'interrupted': 'Unterbrochen',
    'postponed': 'Verschoben',
    'cancelled': 'Abgesagt',
    'abandoned': 'Abgebrochen',
    'suspended': 'Ausgesetzt',
    'awarded': 'Zugesprochen',
    'walkover': 'Walkover',
    'time_tbd': 'Zeit wird noch festgelegt',
    'numbered_round': '{{value}} Round',
    'final': 'Final',
    'semi_final': 'Halbfinale',
    'quarter_final': 'Viertelfinale',
    'round_of_16': 'Achtelfinale',
    'round_of_32': 'Sechzehntelfinale',
    'group_stage': 'Gruppenphase',
    'league_phase': 'Liga Phase',
    'knockout_phase': 'K.-o.-Phase',
    'summer_friendlies': 'Sommerfreundschaftsspiele',
    'winter_friendlies': 'Winterfreundschaftsspiele',
    'pre_season': 'Vorsaison',
    'club_friendlies': 'Vereinsfreundschaftsspiele',
    'after_extra_time': 'Nach Verlängerung',
    'starting_now': 'Startet jetzt',
    'match_page': 'Spiel-Seite',
    'lineups': 'Aufstellungen',
    'stats': 'Statistiken',
    'groups': 'Gruppen',
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
    'on_penalties': "ai rigori",
    'tomorrow': "Domani",
    'day': "Giorno",
    'days': "Giorni",
    // Match statuses
    'halftime': 'Intervallo',
    'penalties': 'Rigori',
    'extra_time': 'Tempo Supplementare',
    'break_time': 'Pausa',
    'interrupted': 'Interrotto',
    'postponed': 'Rinviato',
    'cancelled': 'Annullato',
    'abandoned': 'Abbandonato',
    'suspended': 'Sospeso',
    'awarded': 'Assegnato',
    'walkover': 'Walkover',
    'time_tbd': 'Ora da definire',
    'numbered_round': 'Round {{value}}',
    'final': 'Finale',
    'semi_final': 'Semifinale',
    'quarter_final': 'Quarti di Finale',
    'round_of_16': 'Ottavi di Finale',
    'round_of_32': 'Sedicesimi di Finale',
    'group_stage': 'Fase a Gironi',
    'league_phase': 'Fase di Lega',
    'knockout_phase': 'Fase a Eliminazione Diretta',
    'summer_friendlies': 'Amichevoli Estive',
    'winter_friendlies': 'Amichevoli Invernali',
    'pre_season': 'Pre-stagione',
    'club_friendlies': 'Amichevoli di Club',
    'after_extra_time': 'Dopo Tempo Supplementare',
    'starting_now': 'Inizia ora',
    'match_page': 'Pagina Partita',
    'lineups': 'Formazioni',
    'stats': 'Statistiche',
    'groups': 'Gruppi',
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
    'on_penalties': "nos pênaltis",
    'tomorrow': "Amanhã",
    'day': "Dia",
    'days': "Dias",
    // Match statuses
    'halftime': 'Intervalo',
    'penalties': 'Pênaltis',
    'extra_time': 'Tempo Extra',
    'break_time': 'Intervalo',
    'interrupted': 'Interrompido',
    'postponed': 'Adiado',
    'cancelled': 'Cancelado',
    'abandoned': 'Abandonado',
    'suspended': 'Suspenso',
    'awarded': 'Atribuído',
    'walkover': 'Walkover',
    'time_tbd': 'Hora a definir',
    'numbered_round': 'Ronda {{value}}',
    'final': 'Final',
    'semi_final': 'Semifinal',
    'quarter_final': 'Quartas de Final',
    'round_of_16': 'Oitavas de Final',
    'round_of_32': 'Dezesseisavos de Final',
    'group_stage': 'Fase de Grupos',
    'league_phase': 'Fase de Liga',
    'knockout_phase': 'Fase de Eliminatórias',
    'summer_friendlies': 'Amigáveis de Verão',
    'winter_friendlies': 'Amigáveis de Inverno',
    'pre_season': 'Pré-temporada',
    'club_friendlies': 'Amigáveis de Clubes',
    'after_extra_time': 'Após Tempo Extra',
    'starting_now': 'Iniciando agora',
    'match_page': 'Página do Jogo',
    'lineups': 'Escalações',
    'stats': 'Estatísticas',
    'groups': 'Grupos',
  },
  'zh-tw': {
    'today_matches': "今天的比賽",
    'yesterday_matches': "昨天的比賽",
    'tomorrow_matches': "明天的比賽",
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
    'live': '即時',
    'finished': '結束',
    'not_started': '未開始',
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
    'on_penalties': "PK大戰",
    'tomorrow': "明天",
    // Match statuses
    'halftime': '中場',
    'penalties': '點球',
    'extra_time': '加時賽',
    'break_time': '休息時間',
    'interrupted': '中斷',
    'postponed': '延期',
    'cancelled': '取消',
    'abandoned': '棄賽',
    'suspended': '暫停',
    'awarded': '判罰',
    'walkover': '不戰而勝',
    'time_tbd': '時間待定',
    'numbered_round': '第{{value}}輪',
    'final': '決賽',
    'semi_final': '半決賽',
    'quarter_final': '四分之一決賽',
    'round_of_16': '16強',
    'round_of_32': '32強',
    'group_stage': '小組賽',
    'league_phase': '聯賽階段',
    'knockout_phase': '淘汰賽',
    'summer_friendlies': '夏季友誼賽',
    'winter_friendlies': '冬季友誼賽',
    'pre_season': '季前賽',
    'club_friendlies': '俱樂部友誼賽',
    'after_extra_time': '加時賽後',
    'starting_now': '即將開始',
    'match_page': '比賽頁面',
    'lineups': '陣容',
    'stats': '統計',
    'groups': '小組',
  }
};

// Add all manual round translations to the main translations object
Object.assign(translations, manualRoundTranslations);

export const countryToLanguageMap: { [key: string]: string } = {
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

  // Initialize translation system on language change
  useEffect(() => {
    console.log(`🌐 [LanguageContext] Language changed to: ${currentLanguage}`);

    // Initialize smart team translation system with error handling
    const initializeTranslations = async () => {
      try {
        console.log(`🤖 [LanguageContext] Initializing smart team translation for language: ${currentLanguage}`);
        await smartTeamTranslation.initializeTeamTranslations(currentLanguage);

        // Log translation statistics
        const stats = smartTeamTranslation.getTranslationStats();
        console.log(`✅ [LanguageContext] Smart team translation initialized successfully for ${currentLanguage}:`, stats);

        // Test translation with sample teams
        const testTeams = ['Cruz Azul', 'Colorado Rapids', 'Manchester United', 'Real Madrid'];
        testTeams.forEach(team => {
          const translated = smartTeamTranslation.translateTeamName(team, currentLanguage);
          console.log(`🧪 [LanguageContext] Test translation: "${team}" -> "${translated}"`);
        });
      } catch (error) {
        console.error(`❌ [LanguageContext] Failed to initialize smart team translation for ${currentLanguage}:`, error);
        // Continue without smart translation - manual fallbacks will still work
      }
    };

    // Run initialization asynchronously
    initializeTranslations();
  }, [currentLanguage]);

  const translateLeagueName = (leagueName: string): string => {
    if (!leagueName) return leagueName;

    // First try the comprehensive smart translation system
    const smartTranslation = smartLeagueCountryTranslation.translateLeagueName(leagueName, currentLanguage);
    console.log(`🏆 [LanguageContext] Smart league translation: "${leagueName}" -> "${smartTranslation}"`);

    if (smartTranslation !== leagueName) {
      console.log(`✅ [LanguageContext] Using smart league translation: "${smartTranslation}"`);
      return smartTranslation;
    }

    // Fallback to team translation system for league names
    const teamSmartTranslation = smartTeamTranslation.translateLeagueName(leagueName, currentLanguage);
    if (teamSmartTranslation !== leagueName) {
      console.log(`✅ [LanguageContext] Using team system league translation: "${teamSmartTranslation}"`);
      return teamSmartTranslation;
    }

    // Fallback to manual patterns if smart translation doesn't find a match
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
        'zh-hk': 'UEFA 冠軍聯賽',
        'zh-tw': 'UEFA 冠軍聯賽',
        'zh': 'UEFA 冠军联赛',
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
        'it': 'Copa del Mondo',
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

  // Country name translation function using smart translation system
  const translateCountryName = (countryName: string): string => {
    if (!countryName) return countryName;

    console.log(`🌍 [LanguageContext] Translating country: "${countryName}" for language: ${currentLanguage}`);

    // First try the comprehensive smart translation system
    const smartTranslation = smartLeagueCountryTranslation.translateCountryName(countryName, currentLanguage);
    console.log(`🤖 [LanguageContext] Smart country translation: "${countryName}" -> "${smartTranslation}"`);

    if (smartTranslation !== countryName) {
      console.log(`✅ [LanguageContext] Using smart country translation: "${smartTranslation}"`);
      return smartTranslation;
    }

    // Fallback to team translation system for country names
    const teamSmartTranslation = smartTeamTranslation.translateCountryName(countryName, currentLanguage);
    if (teamSmartTranslation !== countryName) {
      console.log(`✅ [LanguageContext] Using team system country translation: "${teamSmartTranslation}"`);
      return teamSmartTranslation;
    }

    // Return original if no translation found
    return countryName;
  };

  // Team name translation function with comprehensive translations
  const translateTeamName = (teamName: string): string => {
    if (!teamName) return '';

    console.log(`🌐 [LanguageContext] Translating team: "${teamName}" for language: ${currentLanguage}`);

    // First try the smart translation system
    const smartTranslation = smartTeamTranslation.translateTeamName(teamName, currentLanguage);
    console.log(`🤖 [LanguageContext] Smart translation result: "${teamName}" -> "${smartTranslation}"`);

    if (smartTranslation !== teamName) {
      console.log(`✅ [LanguageContext] Using smart translation: "${smartTranslation}"`);
      return smartTranslation;
    }

    // Manual team translations as fallback
    const teamTranslations: { [key: string]: { [key: string]: string } } = {
      'manchester united': {
        'zh': '曼联',
        'zh-hk': '曼聯',
        'zh-tw': '曼聯',
        'es': 'Manchester United',
        'de': 'Manchester United',
        'it': 'Manchester United',
        'pt': 'Manchester United'
      },
      'manchester city': {
        'zh': '曼城',
        'zh-hk': '曼城',
        'zh-tw': '曼城',
        'es': 'Manchester City',
        'de': 'Manchester City',
        'it': 'Manchester City',
        'pt': 'Manchester City'
      },
      'liverpool': {
        'zh': '利物浦',
        'zh-hk': '利物浦',
        'zh-tw': '利物浦',
        'es': 'Liverpool',
        'de': 'Liverpool',
        'it': 'Liverpool',
        'pt': 'Liverpool'
      },
      'arsenal': {
        'zh': '阿森纳',
        'zh-hk': '阿仙奴',
        'zh-tw': '阿森納',
        'es': 'Arsenal',
        'de': 'Arsenal',
        'it': 'Arsenal',
        'pt': 'Arsenal'
      },
      'chelsea': {
        'zh': '切尔西',
        'zh-hk': '車路士',
        'zh-tw': '切爾西',
        'es': 'Chelsea',
        'de': 'Chelsea',
        'it': 'Chelsea',
        'pt': 'Chelsea'
      },
      'real madrid': {
        'zh': '皇家马德里',
        'zh-hk': '皇家馬德里',
        'zh-tw': '皇家馬德里',
        'es': 'Real Madrid',
        'de': 'Real Madrid',
        'it': 'Real Madrid',
        'pt': 'Real Madrid'
      },
      'barcelona': {
        'zh': '巴塞罗那',
        'zh-hk': '巴塞隆拿',
        'zh-tw': '巴塞隆納',
        'es': 'Barcelona',
        'de': 'Barcelona',
        'it': 'Barcelona',
        'pt': 'Barcelona'
      },
      'Newcastle': {
        'zh': '纽卡斯尔', 'zh-hk': '紐卡素', 'zh-tw': '紐卡斯爾',
        'es': 'Newcastle', 'de': 'Newcastle', 'it': 'Newcastle', 'pt': 'Newcastle'
      },
      'fcsb': {
        'zh': '布加勒斯特星队', 'zh-hk': '布加勒斯特星隊', 'zh-tw': '布加勒斯特星隊',
        'es': 'FCSB', 'de': 'FCSB', 'it': 'FCSB', 'pt': 'FCSB'
      },
      'drita': {
        'zh': '德里塔', 'zh-hk': '德里塔', 'zh-tw': '德里塔',
        'es': 'Drita', 'de': 'Drita', 'it': 'Drita', 'pt': 'Drita'
      },
      'servette fc': {
        'zh': '塞尔维特', 'zh-hk': '塞爾維特', 'zh-tw': '塞爾維特',
        'es': 'Servette FC', 'de': 'Servette FC', 'it': 'Servette FC', 'pt': 'Servette FC'
      },
      'utrecht': {
        'zh': '乌德勒支', 'zh-hk': '烏德勒支', 'zh-tw': '烏德勒支',
        'es': 'Utrecht', 'de': 'Utrecht', 'it': 'Utrecht', 'pt': 'Utrecht'
      },
      'zrinjski': {
        'zh': '泽林斯基', 'zh-hk': '澤林斯基', 'zh-tw': '澤林斯基',
        'es': 'Zrinjski', 'de': 'Zrinjski', 'it': 'Zrinjski', 'pt': 'Zrinjski'
      },
      'breidablik': {
        'zh': '布雷达布利克', 'zh-hk': '布雷达布利克', 'zh-tw': '布雷达布利克',
        'es': 'Breidablik', 'de': 'Breidablik', 'it': 'Breidablik', 'pt': 'Breidablik'
      },
      'panathinaikos': {
        'zh': '帕纳辛奈科斯', 'zh-hk': '帕納辛奈科斯', 'zh-tw': '帕納辛奈科斯',
        'es': 'Panathinaikos', 'de': 'Panathinaikos', 'it': 'Panathinaikos', 'pt': 'Panathinaikos'
      },
      'shakhtar donetsk': {
        'zh': '顿涅茨克矿工', 'zh-hk': '頓涅茨克礦工', 'zh-tw': '頓涅茨克礦工',
        'es': 'Shakhtar Donetsk', 'de': 'Shakhtar Donetsk', 'it': 'Shakhtar Donetsk', 'pt': 'Shakhtar Donetsk'
      },
      'paok': {
        'zh': 'PAOK', 'zh-hk': 'PAOK', 'zh-tw': 'PAOK',
        'es': 'PAOK', 'de': 'PAOK', 'it': 'PAOK', 'pt': 'PAOK'
      },
      'wolfsberger ac': {
        'zh': '沃尔夫斯贝格', 'zh-hk': '沃爾夫斯貝格', 'zh-tw': '沃爾夫斯貝格',
        'es': 'Wolfsberger AC', 'de': 'Wolfsberger AC', 'it': 'Wolfsberger AC', 'pt': 'Wolfsberger AC'
      },
      'bk hacken': {
        'zh': '哈肯', 'zh-hk': '哈肯', 'zh-tw': '哈肯',
        'es': 'BK Häcken', 'de': 'BK Häcken', 'it': 'BK Häcken', 'pt': 'BK Häcken'
      },
      'brann': {
        'zh': '布兰', 'zh-hk': '布蘭', 'zh-tw': '布蘭',
        'es': 'Brann', 'de': 'Brann', 'it': 'Brann', 'pt': 'Brann'
      },
      'aek larnaca': {
        'zh': '拉纳卡AEK', 'zh-hk': '拉納卡AEK', 'zh-tw': '拉納卡AEK',
        'es': 'AEK Larnaca', 'de': 'AEK Larnaca', 'it': 'AEK Larnaca', 'pt': 'AEK Larnaca'
      },
      'legia warszawa': {
        'zh': '华沙莱吉亚', 'zh-hk': '華沙萊吉亞', 'zh-tw': '華沙萊吉亞',
        'es': 'Legia Varsovia', 'de': 'Legia Warschau', 'it': 'Legia Varsavia', 'pt': 'Legia Varsóvia'
      }
    };

    // Fallback to manual translations
    const lowerTeamName = teamName.toLowerCase();
    const translation = teamTranslations[lowerTeamName];

    if (translation && translation[currentLanguage]) {
      return translation[currentLanguage];
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

  // Player name translation function
  const translatePlayerName = (playerName: string): string => {
    if (!playerName) return '';

    console.log(`🎯 [LanguageContext] Translating player: "${playerName}" for language: ${currentLanguage}`);

    // Use smart player translation system
    const smartTranslation = smartPlayerTranslation.translatePlayerName(playerName, currentLanguage);
    console.log(`🤖 [LanguageContext] Smart player translation result: "${playerName}" -> "${smartTranslation}"`);

    if (smartTranslation !== playerName) {
      console.log(`✅ [LanguageContext] Using smart player translation: "${smartTranslation}"`);
      return smartTranslation;
    }

    // Return original name if no translation found
    return playerName;
  };

  // Position name translation function
  const translatePositionName = (positionName: string): string => {
    if (!positionName) return '';

    console.log(`⚽ [LanguageContext] Translating position: "${positionName}" for language: ${currentLanguage}`);

    // Auto-learn any position we encounter
    smartPlayerTranslation.autoLearnFromAnyPositionName(positionName);

    // Use smart position translation system
    const smartTranslation = smartPlayerTranslation.translatePositionName(positionName, currentLanguage);
    console.log(`🤖 [LanguageContext] Smart position translation result: "${positionName}" -> "${smartTranslation}"`);

    if (smartTranslation !== positionName) {
      console.log(`✅ [LanguageContext] Using smart position translation: "${smartTranslation}"`);
      return smartTranslation;
    }

    // Return original position if no translation found
    return positionName;
  };


  // Match status translation function
  const getMatchStatusTranslation = (status: string, language: string): string => {
    const statusTranslations: { [key: string]: { [key: string]: string } } = {
      'FT': {
        'en': 'Ended',
        'zh': '已结束',
        'zh-hk': '已結束',
        'zh-tw': '已結束',
        'es': 'Finalizado',
        'de': 'Beendet',
        'it': 'Finito',
        'pt': 'Terminado'
      },
      'AET': {
        'en': 'After Extra Time',
        'zh': '加时后结束',
        'zh-hk': '加時後結束',
        'zh-tw': '加時後結束',
        'es': 'Después del Tiempo Extra',
        'de': 'Nach Verlängerung',
        'it': 'Dopo Tempo Supplementare',
        'pt': 'Após Tempo Extra'
      },
      'PEN': {
        'en': 'After Penalties',
        'zh': '点球后结束',
        'zh-hk': '點球後結束',
        'zh-tw': '點球後結束',
        'es': 'Después de Penales',
        'de': 'Nach Elfmeterschießen',
        'it': 'Dopo Rigori',
        'pt': 'Após Penaltis'
      },
      'LIVE': {
        'en': 'Live',
        'zh': '直播中',
        'zh-hk': '直播中',
        'zh-tw': '直播中',
        'es': 'En Vivo',
        'de': 'Live',
        'it': 'In Diretta',
        'pt': 'Ao Vivo'
      },
      '1H': {
        'en': 'First Half',
        'zh': '上半场',
        'zh-hk': '上半場',
        'zh-tw': '上半場',
        'es': 'Primer Tiempo',
        'de': 'Erste Halbzeit',
        'it': 'Primo Tempo',
        'pt': 'Primeiro Tempo'
      },
      '2H': {
        'en': 'Second Half',
        'zh': '下半场',
        'zh-hk': '下半場',
        'zh-tw': '下半場',
        'es': 'Segundo Tiempo',
        'de': 'Zweite Halbzeit',
        'it': 'Secondo Tempo',
        'pt': 'Segundo Tempo'
      },
      'HT': {
        'en': 'Halftime',
        'zh': '中场休息',
        'zh-hk': '中場休息',
        'zh-tw': '中場休息',
        'es': 'Medio Tiempo',
        'de': 'Halbzeit',
        'it': 'Intervallo',
        'pt': 'Intervalo'
      },
      'ET': {
        'en': 'Extra Time',
        'zh': '加时赛',
        'zh-hk': '加時賽',
        'zh-tw': '加時賽',
        'es': 'Tiempo Extra',
        'de': 'Verlängerung',
        'it': 'Tempi Supplementari',
        'pt': 'Tempo Extra'
      },
      'P': {
        'en': 'Penalties',
        'zh': '点球大战',
        'zh-hk': '點球大戰',
        'zh-tw': '點球大戰',
        'es': 'Penales',
        'de': 'Elfmeterschießen',
        'it': 'Rigori',
        'pt': 'Penaltis'
      },
      'NS': {
        'en': 'Starting now',
        'zh': '即将开始',
        'zh-hk': '即將開始',
        'zh-tw': '即將開始',
        'es': 'Comenzando ahora',
        'de': 'Startet jetzt',
        'it': 'Inizia ora',
        'pt': 'Iniciando agora'
      },
      'PST': {
        'en': 'Postponed',
        'zh': '推迟',
        'zh-hk': '延期',
        'zh-tw': '延期',
        'es': 'Aplazado',
        'de': 'Verschoben',
        'it': 'Rinviato',
        'pt': 'Adiado'
      },
      'CANC': {
        'en': 'Cancelled',
        'zh': '取消',
        'zh-hk': '取消',
        'zh-tw': '取消',
        'es': 'Cancelado',
        'de': 'Abgesagt',
        'it': 'Annullato',
        'pt': 'Cancelado'
      },
      'SUSP': {
        'en': 'Suspended',
        'zh': '暂停',
        'zh-hk': '暫停',
        'zh-tw': '暫停',
        'es': 'Suspendido',
        'de': 'Unterbrochen',
        'it': 'Sospeso',
        'pt': 'Suspenso'
      },
      'UPCOMING': {
        'en': 'Upcoming',
        'zh': '即将到来',
        'zh-hk': '即將到來',
        'zh-tw': '即將到來',
        'es': 'Próximo',
        'de': 'Demnächst',
        'it': 'Prossimo',
        'pt': 'Próximo'
      }
    };

    // Default to "Ended" for finished matches
    const translation = statusTranslations[status] || statusTranslations['FT'];
    return translation[language] || translation['en'] || 'Ended';
  };

  // Function to learn from fixtures data
  const learnFromFixtures = (fixtures: any[]) => {
    try {
      smartLeagueCountryTranslation.learnFromFixtures(fixtures);
      console.log(`📚 [LanguageContext] Learning from ${fixtures.length} fixtures`);
    } catch (error) {
      console.error('Error learning from fixtures:', error);
    }
  };

  // Function to learn from player data
  const learnFromPlayerData = (players: any[]) => {
    try {
      smartPlayerTranslation.learnFromPlayerData(players);
      console.log(`🎯 [LanguageContext] Learning from ${players.length} players`);
    } catch (error) {
      console.error('Error learning from player data:', error);
    }
  };

  const contextValue = {
    currentLanguage,
    setLanguage,
    setLanguageWithUrlUpdate,
    setLanguageByCountry,
    translations,
    translateLeagueName,
    translateCountryName,
    translateTeamName,
    translatePlayerName,
    translatePositionName,
    getMatchStatusTranslation,
    learnFromFixtures,
    learnFromPlayerData
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
      translateLeagueName: (name: string) => name,
      translateCountryName: (name: string) => name,
      translateTeamName: (name: string) => name,
      translatePlayerName: (name: string) => name,
      translatePositionName: (name: string) => name,
      getMatchStatusTranslation: (status: string) => status,
      learnFromFixtures: () => {},
      learnFromPlayerData: () => {},
    };
  }
  return context;
};

// Add useTranslation hook for convenience
export const useTranslation = () => {
  const { currentLanguage, translations } = useLanguage();

  const t = (key: string): string => {
    return translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
  };

  return { t, currentLanguage };
};