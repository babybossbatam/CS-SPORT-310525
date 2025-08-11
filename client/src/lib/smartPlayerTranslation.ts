
interface PlayerTranslation {
  [key: string]: {
    en: string;
    ar: string;
    zh: string;
    'zh-hk': string;
    'zh-tw': string;
    fr: string;
    es: string;
    pt: string;
    de: string;
    it: string;
    ru: string;
    ja: string;
    ko: string;
    tr: string;
    nl: string;
    pl: string;
    sv: string;
    da: string;
    no: string;
    fi: string;
    cs: string;
    sk: string;
    hu: string;
    ro: string;
    bg: string;
    hr: string;
    sr: string;
    sl: string;
    et: string;
    lv: string;
    lt: string;
    mt: string;
    ga: string;
    cy: string;
    is: string;
    mk: string;
    sq: string;
    eu: string;
    ca: string;
    gl: string;
    he: string;
    hi: string;
    th: string;
    vi: string;
    id: string;
    ms: string;
    uk: string;
    be: string;
  };
}

interface PlayerData {
  id: number;
  name: string;
  position?: string;
  team?: string;
  league?: string;
  country?: string;
  nationality?: string;
}

class SmartPlayerTranslation {
  private playerCache = new Map<string, string>();
  private learnedPlayerMappings = new Map<string, PlayerTranslation[string]>();
  private learnedPositionMappings = new Map<string, PlayerTranslation[string]>();
  private learnedCountryMappings = new Map<string, PlayerTranslation[string]>();
  private learnedTeamMappings = new Map<string, PlayerTranslation[string]>(); // Team/club translations
  private playerCountryMappings = new Map<string, string>(); // playerId -> country
  private playerTeamMappings = new Map<string, string>(); // playerId -> team
  private translationCache = new Map<string, { translation: string; timestamp: number }>();
  private isLoading = false;

  // Comprehensive team/club translations for popular football clubs
  private popularTeams: PlayerTranslation = {
    // European clubs
    'Rangers': {
      en: 'Rangers', ar: 'رينجرز', zh: '流浪者', 'zh-hk': '格拉斯哥流浪者', 'zh-tw': '流浪者',
      fr: 'Rangers', es: 'Rangers', pt: 'Rangers', de: 'Rangers', it: 'Rangers',
      ru: 'Рейнджерс', ja: 'レンジャーズ', ko: '레인저스', tr: 'Rangers', nl: 'Rangers',
      pl: 'Rangers', sv: 'Rangers', da: 'Rangers', no: 'Rangers', fi: 'Rangers',
      cs: 'Rangers', sk: 'Rangers', hu: 'Rangers', ro: 'Rangers', bg: 'Рейнджърс',
      hr: 'Rangers', sr: 'Рејнџерс', sl: 'Rangers', et: 'Rangers', lv: 'Rangers',
      lt: 'Rangers', mt: 'Rangers', ga: 'Rangers', cy: 'Rangers', is: 'Rangers',
      mk: 'Рејнџерс', sq: 'Rangers', eu: 'Rangers', ca: 'Rangers', gl: 'Rangers',
      he: 'ריינג\'רס', hi: 'रेंजर्स', th: 'เรนเจอร์ส', vi: 'Rangers', id: 'Rangers',
      ms: 'Rangers', uk: 'Рейнджерс', be: 'Рэйнджэрс'
    },
    'Crvena Zvezda': {
      en: 'Red Star Belgrade', ar: 'النجم الأحمر بلغراد', zh: '贝尔格莱德红星', 'zh-hk': '貝爾格萊德紅星', 'zh-tw': '貝爾格萊德紅星',
      fr: 'Étoile Rouge de Belgrade', es: 'Estrella Roja de Belgrado', pt: 'Estrela Vermelha de Belgrado', de: 'Roter Stern Belgrad', it: 'Stella Rossa Belgrado',
      ru: 'Црвена звезда', ja: 'ツルヴェナ・ズヴェズダ', ko: '츠르베나 즈베즈다', tr: 'Kızılyıldız', nl: 'Rode Ster Belgrado',
      pl: 'Czerwona Gwiazda Belgrad', sv: 'Röda Stjärnan Belgrad', da: 'Røde Stjerne Beograd', no: 'Røde Stjerne Beograd', fi: 'Punainen Tähti Belgrad',
      cs: 'Červená hvězda Bělehrad', sk: 'Červená hviezda Belehrad', hu: 'Vörös Csillag Belgrád', ro: 'Steaua Roșie Belgrad', bg: 'Червена звезда Белград',
      hr: 'Crvena zvezda', sr: 'Црвена звезда', sl: 'Rdeča zvezda', et: 'Punane Täht Belgrad', lv: 'Sarkanzvaigzne Belgrada',
      lt: 'Raudona žvaigždė Belgradas', mt: 'Stella Ħamra Belgrad', ga: 'Réalta Dhearg Bheograd', cy: 'Seren Goch Belgrad', is: 'Rauðstjarna Belgrað',
      mk: 'Црвена Ѕвезда', sq: 'Ylli i Kuq i Beogradit', eu: 'Belgradno Izar Gorria', ca: 'Estrella Roja de Belgrad', gl: 'Estrela Vermella de Belgrado',
      he: 'הכוכב האדום בלגרד', hi: 'रेड स्टार बेलग्रेड', th: 'เรดสตาร์ เบลเกรด', vi: 'Sao Đỏ Belgrade', id: 'Bintang Merah Belgrade',
      ms: 'Bintang Merah Belgrade', uk: 'Црвена Звезда', be: 'Чырвоная Зорка'
    },
    'Real Madrid': {
      en: 'Real Madrid', ar: 'ريال مدريد', zh: '皇家马德里', 'zh-hk': '皇家馬德里', 'zh-tw': '皇家馬德里',
      fr: 'Real Madrid', es: 'Real Madrid', pt: 'Real Madrid', de: 'Real Madrid', it: 'Real Madrid',
      ru: 'Реал Мадрид', ja: 'レアル・マドリード', ko: '레알 마드리드', tr: 'Real Madrid', nl: 'Real Madrid',
      pl: 'Real Madryt', sv: 'Real Madrid', da: 'Real Madrid', no: 'Real Madrid', fi: 'Real Madrid',
      cs: 'Real Madrid', sk: 'Real Madrid', hu: 'Real Madrid', ro: 'Real Madrid', bg: 'Реал Мадрид',
      hr: 'Real Madrid', sr: 'Реал Мадрид', sl: 'Real Madrid', et: 'Real Madrid', lv: 'Real Madrid',
      lt: 'Real Madrid', mt: 'Real Madrid', ga: 'Real Madrid', cy: 'Real Madrid', is: 'Real Madrid',
      mk: 'Реал Мадрид', sq: 'Real Madrid', eu: 'Real Madrid', ca: 'Real Madrid', gl: 'Real Madrid',
      he: 'ריאל מדריד', hi: 'रियल मैड्रिड', th: 'เรอัล มาดริด', vi: 'Real Madrid', id: 'Real Madrid',
      ms: 'Real Madrid', uk: 'Реал Мадрид', be: 'Рэал Мадрыд'
    },
    'Barcelona': {
      en: 'Barcelona', ar: 'برشلونة', zh: '巴塞罗那', 'zh-hk': '巴塞隆拿', 'zh-tw': '巴塞隆納',
      fr: 'Barcelone', es: 'Barcelona', pt: 'Barcelona', de: 'Barcelona', it: 'Barcellona',
      ru: 'Барселона', ja: 'バルセロナ', ko: '바르셀로나', tr: 'Barcelona', nl: 'Barcelona',
      pl: 'Barcelona', sv: 'Barcelona', da: 'Barcelona', no: 'Barcelona', fi: 'Barcelona',
      cs: 'Barcelona', sk: 'Barcelona', hu: 'Barcelona', ro: 'Barcelona', bg: 'Барселона',
      hr: 'Barcelona', sr: 'Барселона', sl: 'Barcelona', et: 'Barcelona', lv: 'Barcelona',
      lt: 'Barcelona', mt: 'Barcelona', ga: 'Barcelona', cy: 'Barcelona', is: 'Barcelona',
      mk: 'Барселона', sq: 'Barcelona', eu: 'Barcelona', ca: 'Barcelona', gl: 'Barcelona',
      he: 'ברצלונה', hi: 'बार्सिलोना', th: 'บาร์เซโลนา', vi: 'Barcelona', id: 'Barcelona',
      ms: 'Barcelona', uk: 'Барселона', be: 'Барселона'
    },
    'Arsenal': {
      en: 'Arsenal', ar: 'آرسنال', zh: '阿森纳', 'zh-hk': '阿仙奴', 'zh-tw': '阿森納',
      fr: 'Arsenal', es: 'Arsenal', pt: 'Arsenal', de: 'Arsenal', it: 'Arsenal',
      ru: 'Арсенал', ja: 'アーセナル', ko: '아스널', tr: 'Arsenal', nl: 'Arsenal',
      pl: 'Arsenal', sv: 'Arsenal', da: 'Arsenal', no: 'Arsenal', fi: 'Arsenal',
      cs: 'Arsenal', sk: 'Arsenal', hu: 'Arsenal', ro: 'Arsenal', bg: 'Арсенал',
      hr: 'Arsenal', sr: 'Арсенал', sl: 'Arsenal', et: 'Arsenal', lv: 'Arsenal',
      lt: 'Arsenal', mt: 'Arsenal', ga: 'Arsenal', cy: 'Arsenal', is: 'Arsenal',
      mk: 'Арсенал', sq: 'Arsenal', eu: 'Arsenal', ca: 'Arsenal', gl: 'Arsenal',
      he: 'ארסנל', hi: 'आर्सेनल', th: 'อาร์เซนอล', vi: 'Arsenal', id: 'Arsenal',
      ms: 'Arsenal', uk: 'Арсенал', be: 'Арсенал'
    }
  };

  // Comprehensive country translations
  private popularCountries: PlayerTranslation = {
    // Major football countries
    'Brazil': {
      en: 'Brazil', ar: 'البرازيل', zh: '巴西', 'zh-hk': '巴西', 'zh-tw': '巴西',
      fr: 'Brésil', es: 'Brasil', pt: 'Brasil', de: 'Brasilien', it: 'Brasile',
      ru: 'Бразилия', ja: 'ブラジル', ko: '브라질', tr: 'Brezilya', nl: 'Brazilië',
      pl: 'Brazylia', sv: 'Brasilien', da: 'Brasilien', no: 'Brasil', fi: 'Brasilia',
      cs: 'Brazílie', sk: 'Brazília', hu: 'Brazília', ro: 'Brazilia', bg: 'Бразилия',
      hr: 'Brazil', sr: 'Бразил', sl: 'Brazilija', et: 'Brasiilia', lv: 'Brazīlija',
      lt: 'Brazilija', mt: 'Brażil', ga: 'An Bhrasaíl', cy: 'Brasil', is: 'Brasilía',
      mk: 'Бразил', sq: 'Brazili', eu: 'Brasil', ca: 'Brasil', gl: 'Brasil',
      he: 'ברזיל', hi: 'ब्राज़ील', th: 'บราซิล', vi: 'Brazil', id: 'Brasil',
      ms: 'Brazil', uk: 'Бразилія', be: 'Бразілія'
    },
    'Argentina': {
      en: 'Argentina', ar: 'الأرجنتين', zh: '阿根廷', 'zh-hk': '阿根廷', 'zh-tw': '阿根廷',
      fr: 'Argentine', es: 'Argentina', pt: 'Argentina', de: 'Argentinien', it: 'Argentina',
      ru: 'Аргентина', ja: 'アルゼンチン', ko: '아르헨티나', tr: 'Arjantin', nl: 'Argentinië',
      pl: 'Argentyna', sv: 'Argentina', da: 'Argentina', no: 'Argentina', fi: 'Argentiina',
      cs: 'Argentina', sk: 'Argentína', hu: 'Argentína', ro: 'Argentina', bg: 'Аржентина',
      hr: 'Argentina', sr: 'Аргентина', sl: 'Argentina', et: 'Argentina', lv: 'Argentīna',
      lt: 'Argentina', mt: 'Arġentina', ga: 'An Airgintín', cy: 'Yr Ariannin', is: 'Argentína',
      mk: 'Аргентина', sq: 'Argjentina', eu: 'Argentina', ca: 'Argentina', gl: 'Arxentina',
      he: 'ארגנטינה', hi: 'अर्जेंटीना', th: 'อาร์เจนตินา', vi: 'Argentina', id: 'Argentina',
      ms: 'Argentina', uk: 'Аргентина', be: 'Аргенціна'
    },
    'Colombia': {
      en: 'Colombia', ar: 'كولومبيا', zh: '哥伦比亚', 'zh-hk': '哥倫比亞', 'zh-tw': '哥倫比亞',
      fr: 'Colombie', es: 'Colombia', pt: 'Colômbia', de: 'Kolumbien', it: 'Colombia',
      ru: 'Колумбия', ja: 'コロンビア', ko: '콜롬비아', tr: 'Kolombiya', nl: 'Colombia',
      pl: 'Kolumbia', sv: 'Colombia', da: 'Colombia', no: 'Colombia', fi: 'Kolumbia',
      cs: 'Kolumbie', sk: 'Kolumbia', hu: 'Kolumbia', ro: 'Columbia', bg: 'Колумбия',
      hr: 'Kolumbija', sr: 'Колумбија', sl: 'Kolumbija', et: 'Colombia', lv: 'Kolumbija',
      lt: 'Kolumbija', mt: 'Kolombja', ga: 'An Cholóim', cy: 'Colombia', is: 'Kólumbía',
      mk: 'Колумбија', sq: 'Kolumbia', eu: 'Kolombia', ca: 'Colòmbia', gl: 'Colombia',
      he: 'קולומביה', hi: 'कोलम्बिया', th: 'โคลอมเบีย', vi: 'Colombia', id: 'Kolombia',
      ms: 'Colombia', uk: 'Колумбія', be: 'Калумбія'
    },
    'Spain': {
      en: 'Spain', ar: 'إسبانيا', zh: '西班牙', 'zh-hk': '西班牙', 'zh-tw': '西班牙',
      fr: 'Espagne', es: 'España', pt: 'Espanha', de: 'Spanien', it: 'Spagna',
      ru: 'Испания', ja: 'スペイン', ko: '스페인', tr: 'İspanya', nl: 'Spanje',
      pl: 'Hiszpania', sv: 'Spanien', da: 'Spanien', no: 'Spania', fi: 'Espanja',
      cs: 'Španělsko', sk: 'Španielsko', hu: 'Spanyolország', ro: 'Spania', bg: 'Испания',
      hr: 'Španjolska', sr: 'Шпанија', sl: 'Španija', et: 'Hispaania', lv: 'Spānija',
      lt: 'Ispanija', mt: 'Spanja', ga: 'An Spáinn', cy: 'Sbaen', is: 'Spánn',
      mk: 'Шпанија', sq: 'Spanja', eu: 'Espainia', ca: 'Espanya', gl: 'España',
      he: 'ספרד', hi: 'स्पेन', th: 'สเปน', vi: 'Tây Ban Nha', id: 'Spanyol',
      ms: 'Sepanyol', uk: 'Іспанія', be: 'Іспанія'
    },
    'England': {
      en: 'England', ar: 'إنجلترا', zh: '英格兰', 'zh-hk': '英格蘭', 'zh-tw': '英格蘭',
      fr: 'Angleterre', es: 'Inglaterra', pt: 'Inglaterra', de: 'England', it: 'Inghilterra',
      ru: 'Англия', ja: 'イングランド', ko: '잉글랜드', tr: 'İngiltere', nl: 'Engeland',
      pl: 'Anglia', sv: 'England', da: 'England', no: 'England', fi: 'Englanti',
      cs: 'Anglie', sk: 'Anglicko', hu: 'Anglia', ro: 'Anglia', bg: 'Англия',
      hr: 'Engleska', sr: 'Енглеска', sl: 'Anglija', et: 'Inglismaa', lv: 'Anglija',
      lt: 'Anglija', mt: 'Ingilterra', ga: 'Sasana', cy: 'Lloegr', is: 'England',
      mk: 'Англија', sq: 'Anglia', eu: 'Ingalaterra', ca: 'Anglaterra', gl: 'Inglaterra',
      he: 'אנגליה', hi: 'इंग्लैंड', th: 'อังกฤษ', vi: 'Anh', id: 'Inggris',
      ms: 'England', uk: 'Англія', be: 'Англія'
    },
    'Bolivia': {
      en: 'Bolivia', ar: 'بوليفيا', zh: '玻利维亚', 'zh-hk': '玻利維亞', 'zh-tw': '玻利維亞',
      fr: 'Bolivie', es: 'Bolivia', pt: 'Bolívia', de: 'Bolivien', it: 'Bolivia',
      ru: 'Боливия', ja: 'ボリビア', ko: '볼리비아', tr: 'Bolivya', nl: 'Bolivia',
      pl: 'Boliwia', sv: 'Bolivia', da: 'Bolivia', no: 'Bolivia', fi: 'Bolivia',
      cs: 'Bolívie', sk: 'Bolívia', hu: 'Bolívia', ro: 'Bolivia', bg: 'Боливия',
      hr: 'Bolivija', sr: 'Боливија', sl: 'Bolivija', et: 'Boliivia', lv: 'Bolīvija',
      lt: 'Bolivija', mt: 'Bolivja', ga: 'An Bholaiv', cy: 'Bolivia', is: 'Bólívía',
      mk: 'Боливија', sq: 'Bolivia', eu: 'Bolivia', ca: 'Bolívia', gl: 'Bolivia',
      he: 'בוליביה', hi: 'बोलीविया', th: 'โบลิเวีย', vi: 'Bolivia', id: 'Bolivia',
      ms: 'Bolivia', uk: 'Болівія', be: 'Балівія'
    },
    'Chile': {
      en: 'Chile', ar: 'شيلي', zh: '智利', 'zh-hk': '智利', 'zh-tw': '智利',
      fr: 'Chili', es: 'Chile', pt: 'Chile', de: 'Chile', it: 'Cile',
      ru: 'Чили', ja: 'チリ', ko: '칠레', tr: 'Şili', nl: 'Chili',
      pl: 'Chile', sv: 'Chile', da: 'Chile', no: 'Chile', fi: 'Chile',
      cs: 'Chile', sk: 'Chile', hu: 'Chile', ro: 'Chile', bg: 'Чили',
      hr: 'Čile', sr: 'Чиле', sl: 'Čile', et: 'Tšiili', lv: 'Čīle',
      lt: 'Čilė', mt: 'Ċili', ga: 'An tSile', cy: 'Chile', is: 'Síle',
      mk: 'Чиле', sq: 'Kili', eu: 'Txile', ca: 'Xile', gl: 'Chile',
      he: 'צ׳ילה', hi: 'चिली', th: 'ชิลี', vi: 'Chile', id: 'Chili',
      ms: 'Chile', uk: 'Чилі', be: 'Чылі'
    },
    'Ecuador': {
      en: 'Ecuador', ar: 'الإكوادور', zh: '厄瓜多尔', 'zh-hk': '厄瓜多爾', 'zh-tw': '厄瓜多爾',
      fr: 'Équateur', es: 'Ecuador', pt: 'Equador', de: 'Ecuador', it: 'Ecuador',
      ru: 'Эквадор', ja: 'エクアドル', ko: '에콰도르', tr: 'Ekvador', nl: 'Ecuador',
      pl: 'Ekwador', sv: 'Ecuador', da: 'Ecuador', no: 'Ecuador', fi: 'Ecuador',
      cs: 'Ekvádor', sk: 'Ekvádor', hu: 'Ecuador', ro: 'Ecuador', bg: 'Еквадор',
      hr: 'Ekvador', sr: 'Еквадор', sl: 'Ekvador', et: 'Ecuador', lv: 'Ekvadora',
      lt: 'Ekvadoras', mt: 'Ekwador', ga: 'Eacuadór', cy: 'Ecuador', is: 'Ekvador',
      mk: 'Еквадор', sq: 'Ekuadori', eu: 'Ekuador', ca: 'Equador', gl: 'Ecuador',
      he: 'אקוודור', hi: 'इक्वाडोर', th: 'เอกวาดอร์', vi: 'Ecuador', id: 'Ekuador',
      ms: 'Ecuador', uk: 'Еквадор', be: 'Эквадор'
    },
    'Paraguay': {
      en: 'Paraguay', ar: 'باراغواي', zh: '巴拉圭', 'zh-hk': '巴拉圭', 'zh-tw': '巴拉圭',
      fr: 'Paraguay', es: 'Paraguay', pt: 'Paraguai', de: 'Paraguay', it: 'Paraguay',
      ru: 'Парагвай', ja: 'パラグアイ', ko: '파라과이', tr: 'Paraguay', nl: 'Paraguay',
      pl: 'Paragwaj', sv: 'Paraguay', da: 'Paraguay', no: 'Paraguay', fi: 'Paraguay',
      cs: 'Paraguay', sk: 'Paraguaj', hu: 'Paraguay', ro: 'Paraguay', bg: 'Парагвай',
      hr: 'Paragvaj', sr: 'Парагвај', sl: 'Paragvaj', et: 'Paraguay', lv: 'Paragvaja',
      lt: 'Paragvajus', mt: 'Paragwaj', ga: 'Paragua', cy: 'Paraguay', is: 'Paragvæ',
      mk: 'Парагвај', sq: 'Paraguai', eu: 'Paraguai', ca: 'Paraguai', gl: 'Paraguai',
      he: 'פרגוואי', hi: 'पैराग्वे', th: 'ปารากวัย', vi: 'Paraguay', id: 'Paraguay',
      ms: 'Paraguay', uk: 'Парагвай', be: 'Парагвай'
    },
    'Peru': {
      en: 'Peru', ar: 'بيرو', zh: '秘鲁', 'zh-hk': '秘魯', 'zh-tw': '秘魯',
      fr: 'Pérou', es: 'Perú', pt: 'Peru', de: 'Peru', it: 'Perù',
      ru: 'Перу', ja: 'ペルー', ko: '페루', tr: 'Peru', nl: 'Peru',
      pl: 'Peru', sv: 'Peru', da: 'Peru', no: 'Peru', fi: 'Peru',
      cs: 'Peru', sk: 'Peru', hu: 'Peru', ro: 'Peru', bg: 'Перу',
      hr: 'Peru', sr: 'Перу', sl: 'Peru', et: 'Peruu', lv: 'Peru',
      lt: 'Peru', mt: 'Perù', ga: 'Peiriú', cy: 'Periw', is: 'Perú',
      mk: 'Перу', sq: 'Peru', eu: 'Peru', ca: 'Perú', gl: 'Perú',
      he: 'פרו', hi: 'पेरू', th: 'เปรู', vi: 'Peru', id: 'Peru',
      ms: 'Peru', uk: 'Перу', be: 'Перу'
    },
    'Uruguay': {
      en: 'Uruguay', ar: 'أوروغواي', zh: '乌拉圭', 'zh-hk': '烏拉圭', 'zh-tw': '烏拉圭',
      fr: 'Uruguay', es: 'Uruguay', pt: 'Uruguai', de: 'Uruguay', it: 'Uruguay',
      ru: 'Уругвай', ja: 'ウルグアイ', ko: '우루과이', tr: 'Uruguay', nl: 'Uruguay',
      pl: 'Urugwaj', sv: 'Uruguay', da: 'Uruguay', no: 'Uruguay', fi: 'Uruguay',
      cs: 'Uruguay', sk: 'Uruguaj', hu: 'Uruguay', ro: 'Uruguay', bg: 'Уругвай',
      hr: 'Urugvaj', sr: 'Уругвај', sl: 'Urugvaj', et: 'Uruguay', lv: 'Urugvaja',
      lt: 'Urugvajus', mt: 'Urugwaj', ga: 'Uragua', cy: 'Wruguay', is: 'Úrúgvæ',
      mk: 'Уругвај', sq: 'Uruguai', eu: 'Uruguai', ca: 'Uruguai', gl: 'Uruguai',
      he: 'אורוגוואי', hi: 'उरुग्वे', th: 'อุรุกวัย', vi: 'Uruguay', id: 'Uruguay',
      ms: 'Uruguay', uk: 'Уругвай', be: 'Уругвай'
    },
    'Venezuela': {
      en: 'Venezuela', ar: 'فنزويلا', zh: '委内瑞拉', 'zh-hk': '委內瑞拉', 'zh-tw': '委內瑞拉',
      fr: 'Venezuela', es: 'Venezuela', pt: 'Venezuela', de: 'Venezuela', it: 'Venezuela',
      ru: 'Венесуэла', ja: 'ベネズエラ', ko: '베네수엘라', tr: 'Venezuela', nl: 'Venezuela',
      pl: 'Wenezuela', sv: 'Venezuela', da: 'Venezuela', no: 'Venezuela', fi: 'Venezuela',
      cs: 'Venezuela', sk: 'Venezuela', hu: 'Venezuela', ro: 'Venezuela', bg: 'Венецуела',
      hr: 'Venezuela', sr: 'Венецуела', sl: 'Venezuela', et: 'Venezuela', lv: 'Venecuēla',
      lt: 'Venesuela', mt: 'Venezwela', ga: 'Veiniséala', cy: 'Venezuela', is: 'Venesúela',
      mk: 'Венецуела', sq: 'Venezuela', eu: 'Venezuela', ca: 'Veneçuela', gl: 'Venezuela',
      he: 'ונצואלה', hi: 'वेनेज़ुएला', th: 'เวเนซุเอลา', vi: 'Venezuela', id: 'Venezuela',
      ms: 'Venezuela', uk: 'Венесуела', be: 'Венесуэла'
    }
  };

  // Comprehensive position translations
  private popularPlayerPositions: PlayerTranslation = {
    // Forward positions
    'Forward': {
      en: 'Forward', ar: 'مهاجم', zh: '前锋', 'zh-hk': '前鋒', 'zh-tw': '前鋒',
      fr: 'Attaquant', es: 'Delantero', pt: 'Atacante', de: 'Stürmer', it: 'Attaccante',
      ru: 'Нападающий', ja: 'フォワード', ko: '포워드', tr: 'Forvet', nl: 'Aanvaller',
      pl: 'Napastnik', sv: 'Anfallare', da: 'Angriber', no: 'Angriper', fi: 'Hyökkääjä',
      cs: 'Útočník', sk: 'Útočník', hu: 'Támadó', ro: 'Atacant', bg: 'Нападател',
      hr: 'Napadač', sr: 'Нападач', sl: 'Napadalec', et: 'Ründaja', lv: 'Uzbrucējs',
      lt: 'Puolikasis', mt: 'Attakkant', ga: 'Ionsaitheoir', cy: 'Ymosodwr', is: 'Sóknarmadur',
      mk: 'Напаѓач', sq: 'Sulmues', eu: 'Aurrelari', ca: 'Davanter', gl: 'Dianteiro',
      he: 'חלוץ', hi: 'आक्रमणकारी', th: 'กองหน้า', vi: 'Tiền đạo', id: 'Penyerang',
      ms: 'Penyerang', uk: 'Нападник', be: 'Нападальнік'
    },
    'Striker': {
      en: 'Striker', ar: 'مهاجم صريح', zh: '射手', 'zh-hk': '射手', 'zh-tw': '射手',
      fr: 'Buteur', es: 'Delantero centro', pt: 'Atacante', de: 'Mittelstürmer', it: 'Centravanti',
      ru: 'Нападающий', ja: 'ストライカー', ko: '스트라이커', tr: 'Santrafor', nl: 'Spits',
      pl: 'Napastnik', sv: 'Anfallare', da: 'Angriber', no: 'Spiss', fi: 'Keskushyökkääjä',
      cs: 'Útočník', sk: 'Útočník', hu: 'Csatár', ro: 'Atacant central', bg: 'Централен нападател',
      hr: 'Centralni napadač', sr: 'Централни нападач', sl: 'Centralni napadalec', et: 'Keskründaja', lv: 'Centrālais uzbrucējs',
      lt: 'Centrinis puolikas', mt: 'Attakkant ċentrali', ga: 'Ionsaitheoir láir', cy: 'Ymosodwr canol', is: 'Miðsóknarmadur',
      mk: 'Централен напаѓач', sq: 'Sulmues qendror', eu: 'Aurrelari zentroa', ca: 'Davanter centre', gl: 'Dianteiro centro',
      he: 'חלוץ מרכזי', hi: 'स्ट्राइकर', th: 'กองหน้าตัวจริง', vi: 'Tiền đạo cắm', id: 'Penyerang murni',
      ms: 'Penyerang tulen', uk: 'Центральний нападник', be: 'Цэнтральны нападальнік'
    },
    'Centre-Forward': {
      en: 'Centre-Forward', ar: 'مهاجم وسط', zh: '中锋', 'zh-hk': '中鋒', 'zh-tw': '中鋒',
      fr: 'Avant-centre', es: 'Delantero centro', pt: 'Centroavante', de: 'Mittelstürmer', it: 'Centravanti',
      ru: 'Центрфорвард', ja: 'センターフォワード', ko: '센터 포워드', tr: 'Santrafor', nl: 'Centrale spits',
      pl: 'Środkowy napastnik', sv: 'Mittanfallare', da: 'Centrangriber', no: 'Senterspiss', fi: 'Keskushyökkääjä',
      cs: 'Středový útočník', sk: 'Stredový útočník', hu: 'Középcsatár', ro: 'Atacant central', bg: 'Централен нападател',
      hr: 'Srednji napadač', sr: 'Средњи нападач', sl: 'Srednji napadalec', et: 'Keskründaja', lv: 'Centrālais uzbrucējs',
      lt: 'Centrinis puolikas', mt: 'Attakkant ċentrali', ga: 'Ionsaitheoir láir', cy: 'Ymosodwr canol', is: 'Miðsóknarmadur',
      mk: 'Централен напаѓач', sq: 'Sulmues qendror', eu: 'Aurrelari zentroa', ca: 'Davanter centre', gl: 'Dianteiro centro',
      he: 'חלוץ מרכזי', hi: 'केंद्रीय आक्रमणकारी', th: 'กองหน้ากลาง', vi: 'Tiền đạo trung tâm', id: 'Penyerang tengah',
      ms: 'Penyerang tengah', uk: 'Центральний форвард', be: 'Цэнтральны форвард'
    },
    'Left Winger': {
      en: 'Left Winger', ar: 'جناح أيسر', zh: '左边锋', 'zh-hk': '左翼', 'zh-tw': '左翼',
      fr: 'Ailier gauche', es: 'Extremo izquierdo', pt: 'Ponta esquerda', de: 'Linksaußen', it: 'Ala sinistra',
      ru: 'Левый крайний', ja: 'レフトウィング', ko: '레프트 윙', tr: 'Sol kanat', nl: 'Linksbuiten',
      pl: 'Lewy skrzydłowy', sv: 'Vänsterytter', da: 'Venstre wing', no: 'Venstre wing', fi: 'Vasen laitahyökkääjä',
      cs: 'Levé křídlo', sk: 'Ľavé krídlo', hu: 'Bal szélső', ro: 'Extrema stângă', bg: 'Ляв крайник',
      hr: 'Lijevi bek', sr: 'Леви бек', sl: 'Levi branilec', et: 'Vasak äär', lv: 'Kreisais malējs',
      lt: 'Kairysis gynėjas', mt: 'Winger tax-xellug', ga: 'Cliathánaí clé', cy: 'Asgellwr chwith', is: 'Vinstri kantmadur',
      mk: 'Лев крилен', sq: 'Krahinas i majtë', eu: 'Ezkerreko hegalaria', ca: 'Extrem esquerre', gl: 'Extremo esquerdo',
      he: 'כנף שמאל', hi: 'बाएं पंख', th: 'ปีกซ้าย', vi: 'Tiền vệ cánh trái', id: 'Sayap kiri',
      ms: 'Sayap kiri', uk: 'Лівий вінгер', be: 'Левы вінгер'
    },
    'Right Winger': {
      en: 'Right Winger', ar: 'جناح أيمن', zh: '右边锋', 'zh-hk': '右翼', 'zh-tw': '右翼',
      fr: 'Ailier droit', es: 'Extremo derecho', pt: 'Ponta direita', de: 'Rechtsaußen', it: 'Ala destra',
      ru: 'Правый крайний', ja: 'ライトウィング', ko: '라이트 윙', tr: 'Sağ kanat', nl: 'Rechtsbuiten',
      pl: 'Prawy skrzydłowy', sv: 'Högerytter', da: 'Højre wing', no: 'Høyre wing', fi: 'Oikea laitahyökkääjä',
      cs: 'Pravé křídlo', sk: 'Pravé krídlo', hu: 'Jobb szélső', ro: 'Extrema dreaptă', bg: 'Десен крайник',
      hr: 'Desni bek', sr: 'Десни бек', sl: 'Desni branilec', et: 'Parem äär', lv: 'Labais malējs',
      lt: 'Dešinysis gynėjas', mt: 'Winger tal-lemin', ga: 'Cliathánaí deas', cy: 'Asgellwr de', is: 'Hægri kantmadur',
      mk: 'Десен крилен', sq: 'Krahinas i djathtë', eu: 'Eskuineko hegalaria', ca: 'Extrem dret', gl: 'Extremo dereito',
      he: 'כנף ימין', hi: 'दाएं पंख', th: 'ปีกขวา', vi: 'Tiền vệ cánh phải', id: 'Sayap kanan',
      ms: 'Sayap kanan', uk: 'Правий вінгер', be: 'Правы вінгер'
    },

    // Midfielder positions
    'Midfielder': {
      en: 'Midfielder', ar: 'لاعب وسط', zh: '中场', 'zh-hk': '中場', 'zh-tw': '中場',
      fr: 'Milieu de terrain', es: 'Centrocampista', pt: 'Meio-campo', de: 'Mittelfeldspieler', it: 'Centrocampista',
      ru: 'Полузащитник', ja: 'ミッドフィールダー', ko: '미드필더', tr: 'Orta saha', nl: 'Middenvelder',
      pl: 'Pomocnik', sv: 'Mittfältare', da: 'Midtbane', no: 'Midtbane', fi: 'Keskikenttäpelaaja',
      cs: 'Záložník', sk: 'Záložník', hu: 'Középpályás', ro: 'Mijlocaș', bg: 'Халф',
      hr: 'Vezni', sr: 'Везни', sl: 'Vezni igralec', et: 'Poolkaitsjja', lv: 'Pussargs',
      lt: 'Saugos žaidėjas', mt: 'Midfield', ga: 'Lár páirce', cy: 'Canol cae', is: 'Miðjumadur',
      mk: 'Средноредец', sq: 'Mesfushor', eu: 'Erdilaria', ca: 'Migcampista', gl: 'Mediocampista',
      he: 'קשר', hi: 'मिडफील्डर', th: 'กองกลาง', vi: 'Tiền vệ', id: 'Gelandang',
      ms: 'Pemain tengah', uk: 'Півзахисник', be: 'Паўзахіснік'
    },
    'Central Midfielder': {
      en: 'Central Midfielder', ar: 'لاعب وسط مركزي', zh: '中场中路', 'zh-hk': '中場中路', 'zh-tw': '中場中路',
      fr: 'Milieu central', es: 'Mediocentro', pt: 'Meio-campo central', de: 'Zentraler Mittelfeldspieler', it: 'Centrocampista centrale',
      ru: 'Центральный полузащитник', ja: 'セントラルミッドフィールダー', ko: '센트럴 미드필더', tr: 'Merkez orta saha', nl: 'Centrale middenvelder',
      pl: 'Środkowy pomocnik', sv: 'Central mittfältare', da: 'Central midtbane', no: 'Sentral midtbane', fi: 'Keskikentän keskipelaaja',
      cs: 'Střední záložník', sk: 'Stredný záložník', hu: 'Középső középpályás', ro: 'Mijlocaș central', bg: 'Централен халф',
      hr: 'Centralni vezni', sr: 'Централни везни', sl: 'Centralni vezni', et: 'Keskmine poolkaitsja', lv: 'Centrālais pussargs',
      lt: 'Centrinis saugos žaidėjas', mt: 'Midfield ċentrali', ga: 'Lár páirce láir', cy: 'Canol cae canol', is: 'Miðmiðjumadur',
      mk: 'Централен средноредец', sq: 'Mesfushor qendror', eu: 'Erdilari zentroa', ca: 'Migcampista central', gl: 'Mediocampista central',
      he: 'קשר מרכזי', hi: 'केंद्रीय मिडफील्डर', th: 'กองกลางตรงกลาง', vi: 'Tiền vệ trung tâm', id: 'Gelandang tengah',
      ms: 'Pemain tengah pusat', uk: 'Центральний півзахисник', be: 'Цэнтральны паўзахіснік'
    },
    'Attacking Midfielder': {
      en: 'Attacking Midfielder', ar: 'لاعب وسط مهاجم', zh: '攻击型中场', 'zh-hk': '攻擊中場', 'zh-tw': '攻擊中場',
      fr: 'Milieu offensif', es: 'Mediapunta', pt: 'Meia-atacante', de: 'Offensiver Mittelfeldspieler', it: 'Trequartista',
      ru: 'Атакующий полузащитник', ja: 'アタッキングミッドフィールダー', ko: '공격형 미드필더', tr: 'Ofansif orta saha', nl: 'Aanvallende middenvelder',
      pl: 'Pomocnik ofensywny', sv: 'Anfallande mittfältare', da: 'Angribende midtbane', no: 'Angripende midtbane', fi: 'Hyökkäävä keskikenttäpelaaja',
      cs: 'Útočný záložník', sk: 'Útočný záložník', hu: 'Támadó középpályás', ro: 'Mijlocaș ofensiv', bg: 'Атакуващ халф',
      hr: 'Napadni vezni', sr: 'Нападни везни', sl: 'Napadalni vezni', et: 'Ründav poolkaitsja', lv: 'Uzbrūkošs pussargs',
      lt: 'Puolantis saugos žaidėjas', mt: 'Midfield ta\' attakk', ga: 'Lár páirce ionsaithe', cy: 'Canol cae ymosodol', is: 'Sóknmiðjumadur',
      mk: 'Напаѓачки средноредец', sq: 'Mesfushor sulmuese', eu: 'Erdilari erasotzaile', ca: 'Migcampista ofensiu', gl: 'Mediocampista ofensivo',
      he: 'קשר התקפי', hi: 'आक्रामक मिडफील्डर', th: 'กองกลางรุก', vi: 'Tiền vệ tấn công', id: 'Gelandang serang',
      ms: 'Pemain tengah serang', uk: 'Атакувальний півзахисник', be: 'Атакавальны паўзахіснік'
    },
    'Defensive Midfielder': {
      en: 'Defensive Midfielder', ar: 'لاعب وسط دفاعي', zh: '防守型中场', 'zh-hk': '防守中場', 'zh-tw': '防守中場',
      fr: 'Milieu défensif', es: 'Mediocentro defensivo', pt: 'Volante', de: 'Defensiver Mittelfeldspieler', it: 'Mediano',
      ru: 'Опорный полузащитник', ja: 'ディフェンシブミッドフィールダー', ko: '수비형 미드필더', tr: 'Defansif orta saha', nl: 'Verdedigende middenvelder',
      pl: 'Pomocnik defensywny', sv: 'Försvarande mittfältare', da: 'Forsvarende midtbane', no: 'Forsvarende midtbane', fi: 'Puolustava keskikenttäpelaaja',
      cs: 'Defenzivní záložník', sk: 'Defenzívny záložník', hu: 'Védekező középpályás', ro: 'Mijlocaș defensiv', bg: 'Отбранителен халф',
      hr: 'Defenzivni vezni', sr: 'Дефанзивни везни', sl: 'Obrambni vezni', et: 'Kaitsev poolkaitsja', lv: 'Aizsargājošs pussargs',
      lt: 'Gynybinis saugos žaidėjas', mt: 'Midfield difensiv', ga: 'Lár páirce cosanta', cy: 'Canol cae amddiffynnol', is: 'Varnarmiðjumadur',
      mk: 'Одбранбен средноредец', sq: 'Mesfushor mbrojtëse', eu: 'Erdilari defendatzaile', ca: 'Migcampista defensiu', gl: 'Mediocampista defensivo',
      he: 'קשר הגנתי', hi: 'रक्षात्मक मिडफील्डर', th: 'กองกลางรับ', vi: 'Tiền vệ phòng ngự', id: 'Gelandang bertahan',
      ms: 'Pemain tengah pertahanan', uk: 'Оборонний півзахисник', be: 'Абарончы паўзахіснік'
    },

    // Defender positions
    'Defender': {
      en: 'Defender', ar: 'مدافع', zh: '后卫', 'zh-hk': '後衛', 'zh-tw': '後衛',
      fr: 'Défenseur', es: 'Defensor', pt: 'Defensor', de: 'Verteidiger', it: 'Difensore',
      ru: 'Защитник', ja: 'ディフェンダー', ko: '디펜더', tr: 'Defans', nl: 'Verdediger',
      pl: 'Obrońca', sv: 'Försvarare', da: 'Forsvarer', no: 'Forsvarer', fi: 'Puolustaja',
      cs: 'Obránce', sk: 'Obranca', hu: 'Védő', ro: 'Apărător', bg: 'Защитник',
      hr: 'Branič', sr: 'Бранич', sl: 'Branilec', et: 'Kaitsja', lv: 'Aizstāvis',
      lt: 'Gynėjas', mt: 'Difensur', ga: 'Cosantóir', cy: 'Amddiffynwr', is: 'Varnarmadur',
      mk: 'Бранител', sq: 'Mbrojtës', eu: 'Defendatzaile', ca: 'Defensa', gl: 'Defensor',
      he: 'מגן', hi: 'रक्षक', th: 'กองหลัง', vi: 'Hậu vệ', id: 'Bek',
      ms: 'Pemain pertahanan', uk: 'Захисник', be: 'Абаронца'
    },
    'Centre-Back': {
      en: 'Centre-Back', ar: 'مدافع وسط', zh: '中后卫', 'zh-hk': '中後衛', 'zh-tw': '中後衛',
      fr: 'Défenseur central', es: 'Defensa central', pt: 'Zagueiro central', de: 'Innenverteidiger', it: 'Difensore centrale',
      ru: 'Центральный защитник', ja: 'センターバック', ko: '센터백', tr: 'Stoper', nl: 'Centrale verdediger',
      pl: 'Środkowy obrońca', sv: 'Mittback', da: 'Centerback', no: 'Midtstoppeer', fi: 'Keskuspuolustaja',
      cs: 'Střední obránce', sk: 'Stredný obranca', hu: 'Középső védő', ro: 'Fundaș central', bg: 'Централен защитник',
      hr: 'Središnji branič', sr: 'Средњи бранич', sl: 'Srednji branilec', et: 'Keskkaitsja', lv: 'Centrālais aizstāvis',
      lt: 'Centrinis gynėjas', mt: 'Difensur ċentrali', ga: 'Cosantóir láir', cy: 'Cefnwr canol', is: 'Miðvarnarmadur',
      mk: 'Централен бранител', sq: 'Mbrojtës qendror', eu: 'Defendatzaile zentroa', ca: 'Defensa central', gl: 'Defensor central',
      he: 'מגן אמצע', hi: 'केंद्रीय रक्षक', th: 'กองหลังกลาง', vi: 'Trung vệ', id: 'Bek tengah',
      ms: 'Pertahanan tengah', uk: 'Центральний захисник', be: 'Цэнтральны абаронца'
    },
    'Left-Back': {
      en: 'Left-Back', ar: 'مدافع أيسر', zh: '左后卫', 'zh-hk': '左後衛', 'zh-tw': '左後衛',
      fr: 'Arrière gauche', es: 'Lateral izquierdo', pt: 'Lateral esquerdo', de: 'Linksverteidiger', it: 'Terzino sinistro',
      ru: 'Левый защитник', ja: 'レフトバック', ko: '레프트백', tr: 'Sol bek', nl: 'Linksback',
      pl: 'Lewy obrońca', sv: 'Vänsterback', da: 'Venstre back', no: 'Venstre back', fi: 'Vasen puolustaja',
      cs: 'Levý obránce', sk: 'Ľavý obranca', hu: 'Bal védő', ro: 'Fundaș stâng', bg: 'Ляв защитник',
      hr: 'Lijevi bek', sr: 'Леви бек', sl: 'Levi branilec', et: 'Vasak kaitsja', lv: 'Kreisais aizstāvis',
      lt: 'Kairysis gynėjas', mt: 'Back tax-xellug', ga: 'Cúlaitheoir clé', cy: 'Cefnwr chwith', is: 'Vinstri bak',
      mk: 'Лев бранител', sq: 'Mbrojtës i majtë', eu: 'Ezkerreko defendatzaile', ca: 'Lateral esquerre', gl: 'Defensor esquerdo',
      he: 'מגן שמאל', hi: 'बाएं रक्षक', th: 'กองหลังซ้าย', vi: 'Hậu vệ trái', id: 'Bek kiri',
      ms: 'Pertahanan kiri', uk: 'Лівий захисник', be: 'Левы абаронца'
    },
    'Right-Back': {
      en: 'Right-Back', ar: 'مدافع أيمن', zh: '右后卫', 'zh-hk': '右後衛', 'zh-tw': '右後衛',
      fr: 'Arrière droit', es: 'Lateral derecho', pt: 'Lateral direito', de: 'Rechtsverteidiger', it: 'Terzino destro',
      ru: 'Правый защитник', ja: 'ライトバック', ko: '라이트백', tr: 'Sağ bek', nl: 'Rechtsback',
      pl: 'Prawy obrońca', sv: 'Högerback', da: 'Højre back', no: 'Høyre back', fi: 'Oikea puolustaja',
      cs: 'Pravý obránce', sk: 'Pravý obranca', hu: 'Jobb védő', ro: 'Fundaș drept', bg: 'Десен защитник',
      hr: 'Desni bek', sr: 'Десни бек', sl: 'Desni branilec', et: 'Parem kaitsja', lv: 'Labais aizstāvis',
      lt: 'Dešinysis gynėjas', mt: 'Back tal-lemin', ga: 'Cúlaitheoir deas', cy: 'Cefnwr de', is: 'Hægri bak',
      mk: 'Десен бранител', sq: 'Mbrojtës i djathtë', eu: 'Eskuineko defendatzaile', ca: 'Lateral dret', gl: 'Defensor dereito',
      he: 'מגן ימין', hi: 'दाएं रक्षक', th: 'กองหลังขวา', vi: 'Hậu vệ phải', id: 'Bek kanan',
      ms: 'Pertahanan kanan', uk: 'Правий захисник', be: 'Правы абаронца'
    },

    // Goalkeeper
    'Goalkeeper': {
      en: 'Goalkeeper', ar: 'حارس مرمى', zh: '守门员', 'zh-hk': '守門員', 'zh-tw': '守門員',
      fr: 'Gardien de but', es: 'Portero', pt: 'Goleiro', de: 'Torwart', it: 'Portiere',
      ru: 'Вратарь', ja: 'ゴールキーパー', ko: '골키퍼', tr: 'Kaleci', nl: 'Doelman',
      pl: 'Bramkarz', sv: 'Målvakt', da: 'Målmand', no: 'Målvakt', fi: 'Maalivahti',
      cs: 'Brankář', sk: 'Brankár', hu: 'Kapus', ro: 'Portar', bg: 'Вратар',
      hr: 'Golman', sr: 'Голман', sl: 'Vratar', et: 'Väravavaht', lv: 'Vārtsargs',
      lt: 'Vartininkas', mt: 'Għoqba', ga: 'Cúl báire', cy: 'Ceidwad gôl', is: 'Markmadur',
      mk: 'Голман', sq: 'Portier', eu: 'Atezain', ca: 'Porter', gl: 'Porteiro',
      he: 'שוער', hi: 'गोलकीपर', th: 'ผู้รักษาประตู', vi: 'Thủ môn', id: 'Kiper',
      ms: 'Penjaga gol', uk: 'Воротар', be: 'Ваартар'
    },

    // Alternative position names
    'Attacker': {
      en: 'Attacker', ar: 'مهاجم', zh: '攻击手', 'zh-hk': '攻擊手', 'zh-tw': '攻擊手',
      fr: 'Attaquant', es: 'Atacante', pt: 'Atacante', de: 'Angreifer', it: 'Attaccante',
      ru: 'Атакующий', ja: 'アタッカー', ko: '공격수', tr: 'Hücumcu', nl: 'Aanvaller',
      pl: 'Atakujący', sv: 'Attackerare', da: 'Angriber', no: 'Angriper', fi: 'Hyökkääjä',
      cs: 'Útočník', sk: 'Útočník', hu: 'Támadó', ro: 'Atacant', bg: 'Атакуващ',
      hr: 'Napadač', sr: 'Нападач', sl: 'Napadalec', et: 'Ründaja', lv: 'Uzbrucējs',
      lt: 'Puolikas', mt: 'Attakkant', ga: 'Ionsaitheoir', cy: 'Ymosodwr', is: 'Sóknarmadur',
      mk: 'Напаѓач', sq: 'Sulmues', eu: 'Aurrelari', ca: 'Atacant', gl: 'Atacante',
      he: 'תוקף', hi: 'हमलावर', th: 'ผู้โจมตี', vi: 'Kẻ tấn công', id: 'Penyerang',
      ms: 'Penyerang', uk: 'Атакувальний', be: 'Атакавальны'
    }
  };

  constructor() {
    this.loadLearnedMappings();
    this.integrateAutomatedMappings();
    console.log('🎯 [SmartPlayerTranslation] Initialized with position and country learning system');
  }

  private loadLearnedMappings() {
    try {
      const learnedPlayerMappings = localStorage.getItem('learnedPlayerMappings');
      const learnedPositionMappings = localStorage.getItem('learnedPositionMappings');
      const learnedCountryMappings = localStorage.getItem('learnedCountryMappings');
      const learnedTeamMappings = localStorage.getItem('learnedTeamMappings');
      const playerCountryMappings = localStorage.getItem('playerCountryMappings');
      const playerTeamMappings = localStorage.getItem('playerTeamMappings');

      if (learnedPlayerMappings) {
        const parsed = JSON.parse(learnedPlayerMappings);
        this.learnedPlayerMappings = new Map(Object.entries(parsed));
      }

      if (learnedPositionMappings) {
        const parsed = JSON.parse(learnedPositionMappings);
        this.learnedPositionMappings = new Map(Object.entries(parsed));
      }

      if (learnedCountryMappings) {
        const parsed = JSON.parse(learnedCountryMappings);
        this.learnedCountryMappings = new Map(Object.entries(parsed));
      }

      if (learnedTeamMappings) {
        const parsed = JSON.parse(learnedTeamMappings);
        this.learnedTeamMappings = new Map(Object.entries(parsed));
      }

      if (playerCountryMappings) {
        const parsed = JSON.parse(playerCountryMappings);
        this.playerCountryMappings = new Map(Object.entries(parsed));
      }

      if (playerTeamMappings) {
        const parsed = JSON.parse(playerTeamMappings);
        this.playerTeamMappings = new Map(Object.entries(parsed));
      }

      console.log(`📚 [SmartPlayerTranslation] Loaded ${this.learnedPlayerMappings.size} player mappings, ${this.learnedPositionMappings.size} position mappings, ${this.learnedCountryMappings.size} country mappings, and ${this.learnedTeamMappings.size} team mappings`);
    } catch (error) {
      console.warn('[SmartPlayerTranslation] Failed to load learned mappings:', error);
    }
  }

  private saveLearnedMappings() {
    try {
      const playerMappings = Object.fromEntries(this.learnedPlayerMappings);
      const positionMappings = Object.fromEntries(this.learnedPositionMappings);
      const countryMappings = Object.fromEntries(this.learnedCountryMappings);
      const teamMappings = Object.fromEntries(this.learnedTeamMappings);
      const playerCountryMappings = Object.fromEntries(this.playerCountryMappings);
      const playerTeamMappings = Object.fromEntries(this.playerTeamMappings);

      localStorage.setItem('learnedPlayerMappings', JSON.stringify(playerMappings));
      localStorage.setItem('learnedPositionMappings', JSON.stringify(positionMappings));
      localStorage.setItem('learnedCountryMappings', JSON.stringify(countryMappings));
      localStorage.setItem('learnedTeamMappings', JSON.stringify(teamMappings));
      localStorage.setItem('playerCountryMappings', JSON.stringify(playerCountryMappings));
      localStorage.setItem('playerTeamMappings', JSON.stringify(playerTeamMappings));
    } catch (error) {
      console.warn('[SmartPlayerTranslation] Failed to save learned mappings:', error);
    }
  }

  private integrateAutomatedMappings() {
    console.log('✅ [SmartPlayerTranslation] Integrated automated mappings cache');
  }

  // Learn from player data
  learnFromPlayerData(players: PlayerData[]): void {
    let newPlayerMappings = 0;
    let newPositionMappings = 0;
    let newCountryMappings = 0;
    let newPlayerCountryMappings = 0;

    players.forEach(player => {
      // Learn player names
      if (player.name) {
        const existingPlayerMapping = this.learnedPlayerMappings.get(player.name);
        if (!existingPlayerMapping) {
          const newPlayerMapping = this.generatePlayerMapping(player.name, player);
          this.learnedPlayerMappings.set(player.name, newPlayerMapping);
          newPlayerMappings++;
        }

        // Learn player-country associations
        const playerCountry = player.country || player.nationality;
        if (playerCountry && player.id) {
          const playerId = player.id.toString();
          if (!this.playerCountryMappings.has(playerId)) {
            this.playerCountryMappings.set(playerId, playerCountry);
            newPlayerCountryMappings++;
          }
        }

        // Learn player-team associations
        if (player.team && player.id) {
          const playerId = player.id.toString();
          if (!this.playerTeamMappings.has(playerId)) {
            this.playerTeamMappings.set(playerId, player.team);
          }
        }
      }

      // Learn teams
      if (player.team) {
        const normalizedTeam = this.normalizeTeam(player.team);
        const existingTeamMapping = this.learnedTeamMappings.get(normalizedTeam);

        if (!existingTeamMapping) {
          const newTeamMapping = this.generateTeamMapping(normalizedTeam);
          this.learnedTeamMappings.set(normalizedTeam, newTeamMapping);
        }
      }

      // Learn positions
      if (player.position) {
        const normalizedPosition = this.normalizePosition(player.position);
        const existingPositionMapping = this.learnedPositionMappings.get(normalizedPosition);

        if (!existingPositionMapping) {
          const newPositionMapping = this.generatePositionMapping(normalizedPosition);
          this.learnedPositionMappings.set(normalizedPosition, newPositionMapping);
          newPositionMappings++;
        }
      }

      // Learn countries
      const playerCountry = player.country || player.nationality;
      if (playerCountry) {
        const normalizedCountry = this.normalizeCountry(playerCountry);
        const existingCountryMapping = this.learnedCountryMappings.get(normalizedCountry);

        if (!existingCountryMapping) {
          const newCountryMapping = this.generateCountryMapping(normalizedCountry);
          this.learnedCountryMappings.set(normalizedCountry, newCountryMapping);
          newCountryMappings++;
        }
      }
    });

    if (newPlayerMappings > 0 || newPositionMappings > 0 || newCountryMappings > 0 || newPlayerCountryMappings > 0) {
      this.saveLearnedMappings();
      console.log(`🎓 [SmartPlayerTranslation] Learned ${newPlayerMappings} player mappings, ${newPositionMappings} position mappings, ${newCountryMappings} country mappings, and ${newPlayerCountryMappings} player-country associations`);
    }
  }

  private normalizePosition(position: string): string {
    if (!position) return '';

    // Normalize common position variations
    const normalized = position.toLowerCase().trim();

    // Map common variations to standard names
    const positionMap: { [key: string]: string } = {
      'cf': 'Centre-Forward',
      'lw': 'Left Winger',
      'rw': 'Right Winger',
      'cm': 'Central Midfielder',
      'dm': 'Defensive Midfielder',
      'am': 'Attacking Midfielder',
      'cb': 'Centre-Back',
      'lb': 'Left-Back',
      'rb': 'Right-Back',
      'gk': 'Goalkeeper',
      'st': 'Striker',
      'f': 'Forward',
      'm': 'Midfielder',
      'd': 'Defender',
      'g': 'Goalkeeper',
      'striker': 'Striker',
      'forward': 'Forward',
      'midfielder': 'Midfielder',
      'defender': 'Defender',
      'goalkeeper': 'Goalkeeper',
      'attacker': 'Attacker'
    };

    return positionMap[normalized] || this.capitalizePosition(position);
  }

  private capitalizePosition(position: string): string {
    return position.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private generatePlayerMapping(playerName: string, playerData: PlayerData): PlayerTranslation[string] {
    // For now, return the original name for all languages
    // This can be enhanced with actual translation logic
    const mapping: any = {};

    Object.keys(this.popularPlayerPositions.Forward).forEach(lang => {
      mapping[lang] = playerName;
    });

    return mapping;
  }

  private generatePositionMapping(position: string): PlayerTranslation[string] {
    // Check if we have a predefined translation
    const existingTranslation = this.popularPlayerPositions[position];
    if (existingTranslation) {
      return existingTranslation;
    }

    // Generate a basic mapping for unknown positions
    const mapping: any = {};
    Object.keys(this.popularPlayerPositions.Forward).forEach(lang => {
      mapping[lang] = position;
    });

    return mapping;
  }

  private normalizeCountry(country: string): string {
    if (!country) return '';

    // Normalize common country variations
    const normalized = country.toLowerCase().trim();

    // Map common variations to standard names
    const countryMap: { [key: string]: string } = {
      // South American countries
      'brasil': 'Brazil',
      'brazil': 'Brazil',
      'bolivia': 'Bolivia',
      'chile': 'Chile',
      'colombia': 'Colombia',
      'ecuador': 'Ecuador',
      'paraguay': 'Paraguay',
      'peru': 'Peru',
      'perú': 'Peru',
      'uruguay': 'Uruguay',
      'venezuela': 'Venezuela',
      'argentina': 'Argentina',
      
      // European countries
      'england': 'England',
      'uk': 'England',
      'united kingdom': 'England',
      'great britain': 'England',
      'españa': 'Spain',
      'spain': 'Spain',
      'france': 'France',
      'francia': 'France',
      'germany': 'Germany',
      'deutschland': 'Germany',
      'alemania': 'Germany',
      'italy': 'Italy',
      'italia': 'Italy',
      'portugal': 'Portugal',
      'netherlands': 'Netherlands',
      'holland': 'Netherlands',
      'países bajos': 'Netherlands',
      
      // Other common variations
      'usa': 'United States',
      'united states': 'United States',
      'estados unidos': 'United States',
      'mexico': 'Mexico',
      'méxico': 'Mexico'
    };

    return countryMap[normalized] || this.capitalizeCountry(country);
  }

  private capitalizeCountry(country: string): string {
    return country.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private generateCountryMapping(country: string): PlayerTranslation[string] {
    // Check if we have a predefined translation
    const existingTranslation = this.popularCountries[country];
    if (existingTranslation) {
      return existingTranslation;
    }

    // Generate a basic mapping for unknown countries
    const mapping: any = {};
    Object.keys(this.popularCountries.Brazil).forEach(lang => {
      mapping[lang] = country;
    });

    return mapping;
  }

  private normalizeTeam(team: string): string {
    if (!team) return '';

    // Normalize common team variations
    const normalized = team.toLowerCase().trim();

    // Map common variations to standard names
    const teamMap: { [key: string]: string } = {
      'rangers': 'Rangers',
      'glasgow rangers': 'Rangers',
      'crvena zvezda': 'Crvena Zvezda',
      'red star belgrade': 'Crvena Zvezda',
      'real madrid': 'Real Madrid',
      'barcelona': 'Barcelona',
      'fc barcelona': 'Barcelona',
      'arsenal': 'Arsenal',
      'arsenal fc': 'Arsenal'
    };

    return teamMap[normalized] || this.capitalizeTeam(team);
  }

  private capitalizeTeam(team: string): string {
    return team.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private generateTeamMapping(team: string): PlayerTranslation[string] {
    // Check if we have a predefined translation
    const existingTranslation = this.popularTeams[team];
    if (existingTranslation) {
      return existingTranslation;
    }

    // Generate a basic mapping for unknown teams
    const mapping: any = {};
    Object.keys(this.popularTeams.Rangers).forEach(lang => {
      mapping[lang] = team;
    });

    return mapping;
  }

  // Main translation functions
  translatePlayerName(playerName: string, language: string): string {
    if (!playerName || !language) return playerName;

    // Check learned mappings first
    const learnedMapping = this.learnedPlayerMappings.get(playerName);
    if (learnedMapping && learnedMapping[language as keyof typeof learnedMapping]) {
      return learnedMapping[language as keyof typeof learnedMapping];
    }

    // Return original name if no translation found
    return playerName;
  }

  translatePositionName(position: string, language: string): string {
    if (!position || !language) return position;

    const normalizedPosition = this.normalizePosition(position);

    // Check static translations first
    const staticTranslation = this.popularPlayerPositions[normalizedPosition];
    if (staticTranslation && staticTranslation[language as keyof typeof staticTranslation]) {
      return staticTranslation[language as keyof typeof staticTranslation];
    }

    // Check learned mappings
    const learnedMapping = this.learnedPositionMappings.get(normalizedPosition);
    if (learnedMapping && learnedMapping[language as keyof typeof learnedMapping]) {
      return learnedMapping[language as keyof typeof learnedMapping];
    }

    // Fallback to original position
    return position;
  }

  translateCountryName(country: string, language: string): string {
    if (!country || !language) return country;

    const normalizedCountry = this.normalizeCountry(country);

    // Check static translations first
    const staticTranslation = this.popularCountries[normalizedCountry];
    if (staticTranslation && staticTranslation[language as keyof typeof staticTranslation]) {
      const translation = staticTranslation[language as keyof typeof staticTranslation];
      // Ensure we don't return concatenated values
      if (translation && translation !== country && !translation.includes(country)) {
        return translation;
      }
    }

    // Check learned mappings
    const learnedMapping = this.learnedCountryMappings.get(normalizedCountry);
    if (learnedMapping && learnedMapping[language as keyof typeof learnedMapping]) {
      const translation = learnedMapping[language as keyof typeof learnedMapping];
      // Ensure we don't return concatenated values
      if (translation && translation !== country && !translation.includes(country)) {
        return translation;
      }
    }

    // Fallback to original country
    return country;
  }

  translateTeamName(team: string, language: string): string {
    if (!team || !language) return team;

    const normalizedTeam = this.normalizeTeam(team);

    // Check static translations first
    const staticTranslation = this.popularTeams[normalizedTeam];
    if (staticTranslation && staticTranslation[language as keyof typeof staticTranslation]) {
      return staticTranslation[language as keyof typeof staticTranslation];
    }

    // Check learned mappings
    const learnedMapping = this.learnedTeamMappings.get(normalizedTeam);
    if (learnedMapping && learnedMapping[language as keyof typeof learnedMapping]) {
      return learnedMapping[language as keyof typeof learnedMapping];
    }

    // Fallback to original team
    return team;
  }

  getPlayerCountry(playerId: number): string | null {
    return this.playerCountryMappings.get(playerId.toString()) || null;
  }

  // Auto-learn from any position name
  autoLearnFromAnyPositionName(position: string, context?: any): void {
    if (!position) return;

    const normalizedPosition = this.normalizePosition(position);

    if (!this.learnedPositionMappings.has(normalizedPosition)) {
      const newMapping = this.generatePositionMapping(normalizedPosition);
      this.learnedPositionMappings.set(normalizedPosition, newMapping);
      this.saveLearnedMappings();
      console.log(`🎯 [SmartPlayerTranslation] Auto-learned new position: "${position}" -> "${normalizedPosition}"`);
    }
  }

  // Auto-learn from any country name
  autoLearnFromAnyCountryName(country: string, context?: any): void {
    if (!country || country.length < 2) return;

    const normalizedCountry = this.normalizeCountry(country);

    if (!this.learnedCountryMappings.has(normalizedCountry)) {
      const newMapping = this.generateCountryMapping(normalizedCountry);
      this.learnedCountryMappings.set(normalizedCountry, newMapping);
      this.saveLearnedMappings();
      console.log(`🎯 [SmartPlayerTranslation] Auto-learned new country: "${country}" -> "${normalizedCountry}"`);
    }
  }

  // Auto-learn from any team name
  autoLearnFromAnyTeamName(team: string, context?: any): void {
    if (!team || team.length < 2) return;

    const normalizedTeam = this.normalizeTeam(team);

    if (!this.learnedTeamMappings.has(normalizedTeam)) {
      const newMapping = this.generateTeamMapping(normalizedTeam);
      this.learnedTeamMappings.set(normalizedTeam, newMapping);
      this.saveLearnedMappings();
      console.log(`🎯 [SmartPlayerTranslation] Auto-learned new team: "${team}" -> "${normalizedTeam}"`);
    }
  }

  // Set player-country mapping
  setPlayerCountry(playerId: number, country: string): void {
    if (!playerId || !country) return;
    
    const normalizedCountry = this.normalizeCountry(country);
    this.playerCountryMappings.set(playerId.toString(), normalizedCountry);
    this.saveLearnedMappings();
  }

  // Cache management
  clearCache(): void {
    this.playerCache.clear();
    this.translationCache.clear();
    console.log('🗑️ [SmartPlayerTranslation] Cache cleared');
  }

  getTranslationStats(): any {
    return {
      playerMappings: this.learnedPlayerMappings.size,
      positionMappings: this.learnedPositionMappings.size,
      countryMappings: this.learnedCountryMappings.size,
      teamMappings: this.learnedTeamMappings.size,
      playerCountryMappings: this.playerCountryMappings.size,
      playerTeamMappings: this.playerTeamMappings.size,
      cacheSize: this.playerCache.size,
      availablePositions: Object.keys(this.popularPlayerPositions).length,
      availableCountries: Object.keys(this.popularCountries).length,
      availableTeams: Object.keys(this.popularTeams).length
    };
  }
}

export const smartPlayerTranslation = new SmartPlayerTranslation();

// Export the learnFromPlayerData method for external use
export const learnFromPlayerData = (players: PlayerData[]) => {
  return smartPlayerTranslation.learnFromPlayerData(players);
};
