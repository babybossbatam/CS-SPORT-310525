// Translation interfaces
interface CountryTranslations {
  [key: string]: {
    en: string;
    zh: string;
    'zh-hk': string;
    'zh-tw': string;
    es: string;
    de: string;
    it: string;
    pt: string;
  };
}

interface LeagueTranslations {
  [key: string]: {
    en: string;
    zh: string;
    'zh-hk': string;
    'zh-tw': string;
    es: string;
    de: string;
    it: string;
    pt: string;
  };
}

// Country translations mapping
const COUNTRY_TRANSLATIONS: CountryTranslations = {
  // Europe
  'Andorra': {
    en: 'Andorra', zh: '安道尔', 'zh-hk': '安道爾', 'zh-tw': '安道爾',
    es: 'Andorra', de: 'Andorra', it: 'Andorra', pt: 'Andorra'
  },
  'Albania': {
    en: 'Albania', zh: '阿尔巴尼亚', 'zh-hk': '阿爾巴尼亞', 'zh-tw': '阿爾巴尼亞',
    es: 'Albania', de: 'Albanien', it: 'Albania', pt: 'Albânia'
  },
  'Armenia': {
    en: 'Armenia', zh: '亚美尼亚', 'zh-hk': '亞美尼亞', 'zh-tw': '亞美尼亞',
    es: 'Armenia', de: 'Armenien', it: 'Armenia', pt: 'Armênia'
  },
  'Austria': {
    en: 'Austria', zh: '奥地利', 'zh-hk': '奧地利', 'zh-tw': '奧地利',
    es: 'Austria', de: 'Österreich', it: 'Austria', pt: 'Áustria'
  },
  'Belgium': {
    en: 'Belgium', zh: '比利时', 'zh-hk': '比利時', 'zh-tw': '比利時',
    es: 'Bélgica', de: 'Belgien', it: 'Belgio', pt: 'Bélgica'
  },
  'England': {
    en: 'England', zh: '英格兰', 'zh-hk': '英格蘭', 'zh-tw': '英格蘭',
    es: 'Inglaterra', de: 'England', it: 'Inghilterra', pt: 'Inglaterra'
  },
  'France': {
    en: 'France', zh: '法国', 'zh-hk': '法國', 'zh-tw': '法國',
    es: 'Francia', de: 'Frankreich', it: 'Francia', pt: 'França'
  },
  'Germany': {
    en: 'Germany', zh: '德国', 'zh-hk': '德國', 'zh-tw': '德國',
    es: 'Alemania', de: 'Deutschland', it: 'Germania', pt: 'Alemanha'
  },
  'Italy': {
    en: 'Italy', zh: '意大利', 'zh-hk': '意大利', 'zh-tw': '意大利',
    es: 'Italia', de: 'Italien', it: 'Italia', pt: 'Itália'
  },
  'Netherlands': {
    en: 'Netherlands', zh: '荷兰', 'zh-hk': '荷蘭', 'zh-tw': '荷蘭',
    es: 'Países Bajos', de: 'Niederlande', it: 'Paesi Bassi', pt: 'Países Baixos'
  },
  'Portugal': {
    en: 'Portugal', zh: '葡萄牙', 'zh-hk': '葡萄牙', 'zh-tw': '葡萄牙',
    es: 'Portugal', de: 'Portugal', it: 'Portogallo', pt: 'Portugal'
  },
  'Spain': {
    en: 'Spain', zh: '西班牙', 'zh-hk': '西班牙', 'zh-tw': '西班牙',
    es: 'España', de: 'Spanien', it: 'Spagna', pt: 'Espanha'
  },
  'Switzerland': {
    en: 'Switzerland', zh: '瑞士', 'zh-hk': '瑞士', 'zh-tw': '瑞士',
    es: 'Suiza', de: 'Schweiz', it: 'Svizzera', pt: 'Suíça'
  },
  'Turkey': {
    en: 'Turkey', zh: '土耳其', 'zh-hk': '土耳其', 'zh-tw': '土耳其',
    es: 'Turquía', de: 'Türkei', it: 'Turchia', pt: 'Turquia'
  },
  // Asia
  'China': {
    en: 'China', zh: '中国', 'zh-hk': '中國', 'zh-tw': '中國',
    es: 'China', de: 'China', it: 'Cina', pt: 'China'
  },
  'Japan': {
    en: 'Japan', zh: '日本', 'zh-hk': '日本', 'zh-tw': '日本',
    es: 'Japón', de: 'Japan', it: 'Giappone', pt: 'Japão'
  },
  'South Korea': {
    en: 'South Korea', zh: '韩国', 'zh-hk': '韓國', 'zh-tw': '韓國',
    es: 'Corea del Sur', de: 'Südkorea', it: 'Corea del Sud', pt: 'Coreia do Sul'
  },
  // Americas
  'Brazil': {
    en: 'Brazil', zh: '巴西', 'zh-hk': '巴西', 'zh-tw': '巴西',
    es: 'Brasil', de: 'Brasilien', it: 'Brasile', pt: 'Brasil'
  },
  'Argentina': {
    en: 'Argentina', zh: '阿根廷', 'zh-hk': '阿根廷', 'zh-tw': '阿根廷',
    es: 'Argentina', de: 'Argentinien', it: 'Argentina', pt: 'Argentina'
  },
  'USA': {
    en: 'USA', zh: '美国', 'zh-hk': '美國', 'zh-tw': '美國',
    es: 'Estados Unidos', de: 'USA', it: 'Stati Uniti', pt: 'Estados Unidos'
  },
  'Mexico': {
    en: 'Mexico', zh: '墨西哥', 'zh-hk': '墨西哥', 'zh-tw': '墨西哥',
    es: 'México', de: 'Mexiko', it: 'Messico', pt: 'México'
  },
  // Special regions
  'World': {
    en: 'World', zh: '世界', 'zh-hk': '世界', 'zh-tw': '世界',
    es: 'Mundial', de: 'Welt', it: 'Mondo', pt: 'Mundial'
  }
};

// League translations mapping
const LEAGUE_TRANSLATIONS: LeagueTranslations = {
  // England
  'Premier League': {
    en: 'Premier League', zh: '英超', 'zh-hk': '英超', 'zh-tw': '英超',
    es: 'Premier League', de: 'Premier League', it: 'Premier League', pt: 'Premier League'
  },
  'Championship': {
    en: 'Championship', zh: '英冠', 'zh-hk': '英冠', 'zh-tw': '英冠',
    es: 'Championship', de: 'Championship', it: 'Championship', pt: 'Championship'
  },
  'FA Cup': {
    en: 'FA Cup', zh: '足总杯', 'zh-hk': '足總盃', 'zh-tw': '足總盃',
    es: 'Copa FA', de: 'FA Cup', it: 'FA Cup', pt: 'Taça FA'
  },
  // Spain
  'La Liga': {
    en: 'La Liga', zh: '西甲', 'zh-hk': '西甲', 'zh-tw': '西甲',
    es: 'La Liga', de: 'La Liga', it: 'La Liga', pt: 'La Liga'
  },
  'Segunda División': {
    en: 'Segunda División', zh: '西乙', 'zh-hk': '西乙', 'zh-tw': '西乙',
    es: 'Segunda División', de: 'Segunda División', it: 'Segunda División', pt: 'Segunda División'
  },
  'Copa del Rey': {
    en: 'Copa del Rey', zh: '国王杯', 'zh-hk': '國王盃', 'zh-tw': '國王盃',
    es: 'Copa del Rey', de: 'Copa del Rey', it: 'Copa del Rey', pt: 'Taça do Rei'
  },
  // Italy
  'Serie A': {
    en: 'Serie A', zh: '意甲', 'zh-hk': '意甲', 'zh-tw': '意甲',
    es: 'Serie A', de: 'Serie A', it: 'Serie A', pt: 'Série A'
  },
  'Serie B': {
    en: 'Serie B', zh: '意乙', 'zh-hk': '意乙', 'zh-tw': '意乙',
    es: 'Serie B', de: 'Serie B', it: 'Serie B', pt: 'Série B'
  },
  'Coppa Italia': {
    en: 'Coppa Italia', zh: '意大利杯', 'zh-hk': '意大利盃', 'zh-tw': '意大利盃',
    es: 'Copa de Italia', de: 'Coppa Italia', it: 'Coppa Italia', pt: 'Taça de Itália'
  },
  // Germany
  'Bundesliga': {
    en: 'Bundesliga', zh: '德甲', 'zh-hk': '德甲', 'zh-tw': '德甲',
    es: 'Bundesliga', de: 'Bundesliga', it: 'Bundesliga', pt: 'Bundesliga'
  },
  '2. Bundesliga': {
    en: '2. Bundesliga', zh: '德乙', 'zh-hk': '德乙', 'zh-tw': '德乙',
    es: '2. Bundesliga', de: '2. Bundesliga', it: '2. Bundesliga', pt: '2. Bundesliga'
  },
  'DFB Pokal': {
    en: 'DFB Pokal', zh: '德国杯', 'zh-hk': '德國盃', 'zh-tw': '德國盃',
    es: 'Copa de Alemania', de: 'DFB-Pokal', it: 'Coppa di Germania', pt: 'Taça da Alemanha'
  },
  // France
  'Ligue 1': {
    en: 'Ligue 1', zh: '法甲', 'zh-hk': '法甲', 'zh-tw': '法甲',
    es: 'Ligue 1', de: 'Ligue 1', it: 'Ligue 1', pt: 'Ligue 1'
  },
  'Ligue 2': {
    en: 'Ligue 2', zh: '法乙', 'zh-hk': '法乙', 'zh-tw': '法乙',
    es: 'Ligue 2', de: 'Ligue 2', it: 'Ligue 2', pt: 'Ligue 2'
  },
  'Coupe de France': {
    en: 'Coupe de France', zh: '法国杯', 'zh-hk': '法國盃', 'zh-tw': '法國盃',
    es: 'Copa de Francia', de: 'Französischer Pokal', it: 'Coppa di Francia', pt: 'Taça de França'
  },
  // UEFA Competitions
  'UEFA Champions League': {
    en: 'UEFA Champions League', zh: '欧冠', 'zh-hk': '歐冠', 'zh-tw': '歐冠',
    es: 'Liga de Campeones', de: 'Champions League', it: 'Champions League', pt: 'Liga dos Campeões'
  },
  'UEFA Europa League': {
    en: 'UEFA Europa League', zh: '欧联杯', 'zh-hk': '歐聯盃', 'zh-tw': '歐聯盃',
    es: 'Liga Europa', de: 'Europa League', it: 'Europa League', pt: 'Liga Europa'
  },
  'UEFA Europa Conference League': {
    en: 'UEFA Europa Conference League', zh: '欧会杯', 'zh-hk': '歐會盃', 'zh-tw': '歐會盃',
    es: 'Conference League', de: 'Conference League', it: 'Conference League', pt: 'Conference League'
  },
  // International
  'FIFA World Cup': {
    en: 'FIFA World Cup', zh: '世界杯', 'zh-hk': '世界盃', 'zh-tw': '世界盃',
    es: 'Copa Mundial FIFA', de: 'FIFA-Weltmeisterschaft', it: 'Coppa del Mondo FIFA', pt: 'Copa do Mundo FIFA'
  },
  'UEFA European Championship': {
    en: 'UEFA European Championship', zh: '欧洲杯', 'zh-hk': '歐洲盃', 'zh-tw': '歐洲盃',
    es: 'Eurocopa', de: 'Europameisterschaft', it: 'Campionato Europeo', pt: 'Campeonato Europeu'
  },
  'Copa America': {
    en: 'Copa America', zh: '美洲杯', 'zh-hk': '美洲盃', 'zh-tw': '美洲盃',
    es: 'Copa América', de: 'Copa América', it: 'Copa América', pt: 'Copa América'
  }
};

// Static list of all countries from the API
export const ALL_COUNTRIES = [
  // Europe
  { code: 'AD', name: 'Andorra', flag: "https://media.api-sports.io/flags/ad.svg" },
  { code: 'AL', name: 'Albania', flag: "https://media.api-sports.io/flags/al.svg" },
  { code: 'AM', name: 'Armenia', flag: "https://media.api-sports.io/flags/am.svg" },
  { code: 'AT', name: 'Austria', flag: "https://media.api-sports.io/flags/at.svg" },
  { code: 'AZ', name: 'Azerbaijan', flag: "https://media.api-sports.io/flags/az.svg" },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: "https://media.api-sports.io/flags/ba.svg" },
  { code: 'BE', name: 'Belgium', flag: "https://media.api-sports.io/flags/be.svg" },
  { code: 'BG', name: 'Bulgaria', flag: "https://media.api-sports.io/flags/bg.svg" },
  { code: 'BY', name: 'Belarus', flag: "https://media.api-sports.io/flags/by.svg" },
  { code: 'CH', name: 'Switzerland', flag: "https://media.api-sports.io/flags/ch.svg" },
  { code: 'CY', name: 'Cyprus', flag: "https://media.api-sports.io/flags/cy.svg" },
  { code: 'CZ', name: 'Czech Republic', flag: "https://media.api-sports.io/flags/cz.svg" },
  { code: 'DE', name: 'Germany', flag: "https://media.api-sports.io/flags/de.svg" },
  { code: 'DK', name: 'Denmark', flag: "https://media.api-sports.io/flags/dk.svg" },
  { code: 'EE', name: 'Estonia', flag: "https://media.api-sports.io/flags/ee.svg" },
  { code: 'ES', name: 'Spain', flag: "https://media.api-sports.io/flags/es.svg" },
  { code: 'FI', name: 'Finland', flag: "https://media.api-sports.io/flags/fi.svg" },
  { code: 'FO', name: 'Faroe Islands', flag: "https://media.api-sports.io/flags/fo.svg" },
  { code: 'FR', name: 'France', flag: "https://media.api-sports.io/flags/fr.svg" },
  { code: 'GB', name: 'United Kingdom', flag: "https://media.api-sports.io/flags/gb.svg" },
  { code: 'GB-ENG', name: 'England', flag: "https://media.api-sports.io/flags/gb.svg" },
  { code: 'GB-NIR', name: 'Northern Ireland', flag: "https://media.api-sports.io/flags/gb-nir.svg" },
  { code: 'GB-SCT', name: 'Scotland', flag: "https://media.api-sports.io/flags/gb-sct.svg" },
  { code: 'GB-WLS', name: 'Wales', flag: "https://media.api-sports.io/flags/gb-wls.svg" },
  { code: 'GE', name: 'Georgia', flag: "https://media.api-sports.io/flags/ge.svg" },
  { code: 'GI', name: 'Gibraltar', flag: "https://media.api-sports.io/flags/gi.svg" },
  { code: 'GR', name: 'Greece', flag: "https://media.api-sports.io/flags/gr.svg" },
  { code: 'HR', name: 'Croatia', flag: "https://media.api-sports.io/flags/hr.svg" },
  { code: 'HU', name: 'Hungary', flag: "https://media.api-sports.io/flags/hu.svg" },
  { code: 'IE', name: 'Ireland', flag: "https://media.api-sports.io/flags/ie.svg" },
  { code: 'IS', name: 'Iceland', flag: "https://media.api-sports.io/flags/is.svg" },
  { code: 'IT', name: 'Italy', flag: "https://media.api-sports.io/flags/it.svg" },
  { code: 'LI', name: 'Liechtenstein', flag: "https://media.api-sports.io/flags/li.svg" },
  { code: 'LT', name: 'Lithuania', flag: "https://media.api-sports.io/flags/lt.svg" },
  { code: 'LU', name: 'Luxembourg', flag: "https://media.api-sports.io/flags/lu.svg" },
  { code: 'LV', name: 'Latvia', flag: "https://media.api-sports.io/flags/lv.svg" },
  { code: 'MC', name: 'Monaco', flag: "https://media.api-sports.io/flags/mc.svg" },
  { code: 'MD', name: 'Moldova', flag: "https://media.api-sports.io/flags/md.svg" },
  { code: 'ME', name: 'Montenegro', flag: "https://media.api-sports.io/flags/me.svg" },
  { code: 'MK', name: 'North Macedonia', flag: "https://media.api-sports.io/flags/mk.svg" },
  { code: 'MT', name: 'Malta', flag: "https://media.api-sports.io/flags/mt.svg" },
  { code: 'NL', name: 'Netherlands', flag: "https://media.api-sports.io/flags/nl.svg" },
  { code: 'NO', name: 'Norway', flag: "https://media.api-sports.io/flags/no.svg" },
  { code: 'PL', name: 'Poland', flag: "https://media.api-sports.io/flags/pl.svg" },
  { code: 'PT', name: 'Portugal', flag: "https://media.api-sports.io/flags/pt.svg" },
  { code: 'RO', name: 'Romania', flag: "https://media.api-sports.io/flags/ro.svg" },
  { code: 'RS', name: 'Serbia', flag: "https://media.api-sports.io/flags/rs.svg" },
  { code: 'RU', name: 'Russia', flag: "https://media.api-sports.io/flags/ru.svg" },
  { code: 'SE', name: 'Sweden', flag: "https://media.api-sports.io/flags/se.svg" },
  { code: 'SI', name: 'Slovenia', flag: "https://media.api-sports.io/flags/si.svg" },
  { code: 'SK', name: 'Slovakia', flag: "https://media.api-sports.io/flags/sk.svg" },
  { code: 'SM', name: 'San Marino', flag: "https://media.api-sports.io/flags/sm.svg" },
  { code: 'TR', name: 'Turkey', flag: "https://media.api-sports.io/flags/tr.svg" },
  { code: 'UA', name: 'Ukraine', flag: "https://media.api-sports.io/flags/ua.svg" },
  { code: 'VA', name: 'Vatican City', flag: "https://media.api-sports.io/flags/va.svg" },

  // Asia
  { code: 'AF', name: 'Afghanistan', flag: "https://media.api-sports.io/flags/af.svg" },
  { code: 'BD', name: 'Bangladesh', flag: "https://media.api-sports.io/flags/bd.svg" },
  { code: 'BH', name: 'Bahrain', flag: "https://media.api-sports.io/flags/bh.svg" },
  { code: 'BN', name: 'Brunei', flag: "https://media.api-sports.io/flags/bn.svg" },
  { code: 'BT', name: 'Bhutan', flag: "https://media.api-sports.io/flags/bt.svg" },
  { code: 'CN', name: 'China', flag: "https://media.api-sports.io/flags/cn.svg" },
  { code: 'HK', name: 'Hong Kong', flag: "https://media.api-sports.io/flags/hk.svg" },
  { code: 'ID', name: 'Indonesia', flag: "https://media.api-sports.io/flags/id.svg" },
  { code: 'IL', name: 'Israel', flag: "https://media.api-sports.io/flags/il.svg" },
  { code: 'IN', name: 'India', flag: "https://media.api-sports.io/flags/in.svg" },
  { code: 'IQ', name: 'Iraq', flag: "https://media.api-sports.io/flags/iq.svg" },
  { code: 'IR', name: 'Iran', flag: "https://media.api-sports.io/flags/ir.svg" },
  { code: 'JO', name: 'Jordan', flag: "https://media.api-sports.io/flags/jo.svg" },
  { code: 'JP', name: 'Japan', flag: "https://media.api-sports.io/flags/jp.svg" },
  { code: 'KG', name: 'Kyrgyzstan', flag: "https://media.api-sports.io/flags/kg.svg" },
  { code: 'KH', name: 'Cambodia', flag: "https://media.api-sports.io/flags/kh.svg" },
  { code: 'KP', name: 'North Korea', flag: "https://media.api-sports.io/flags/kp.svg" },
  { code: 'KR', name: 'South Korea', flag: "https://media.api-sports.io/flags/kr.svg" },
  { code: 'KW', name: 'Kuwait', flag: "https://media.api-sports.io/flags/kw.svg" },
  { code: 'KZ', name: 'Kazakhstan', flag: "https://media.api-sports.io/flags/kz.svg" },
  { code: 'LA', name: 'Laos', flag: "https://media.api-sports.io/flags/la.svg" },
  { code: 'LB', name: 'Lebanon', flag: "https://media.api-sports.io/flags/lb.svg" },
  { code: 'LK', name: 'Sri Lanka', flag: "https://media.api-sports.io/flags/lk.svg" },
  { code: 'MM', name: 'Myanmar', flag: "https://media.api-sports.io/flags/mm.svg" },
  { code: 'MN', name: 'Mongolia', flag: "https://media.api-sports.io/flags/mn.svg" },
  { code: 'MO', name: 'Macau', flag: "https://media.api-sports.io/flags/mo.svg" },
  { code: 'MV', name: 'Maldives', flag: "https://media.api-sports.io/flags/mv.svg" },
  { code: 'MY', name: 'Malaysia', flag: "https://media.api-sports.io/flags/my.svg" },
  { code: 'NP', name: 'Nepal', flag: "https://media.api-sports.io/flags/np.svg" },
  { code: 'OM', name: 'Oman', flag: "https://media.api-sports.io/flags/om.svg" },
  { code: 'PH', name: 'Philippines', flag: "https://media.api-sports.io/flags/ph.svg" },
  { code: 'PK', name: 'Pakistan', flag: "https://media.api-sports.io/flags/pk.svg" },
  { code: 'PS', name: 'Palestine', flag: "https://media.api-sports.io/flags/ps.svg" },
  { code: 'QA', name: 'Qatar', flag: "https://media.api-sports.io/flags/qa.svg" },
  { code: 'SA', name: 'Saudi Arabia', flag: "https://media.api-sports.io/flags/sa.svg" },
  { code: 'SG', name: 'Singapore', flag: "https://media.api-sports.io/flags/sg.svg" },
  { code: 'SY', name: 'Syria', flag: "https://media.api-sports.io/flags/sy.svg" },
  { code: 'TH', name: 'Thailand', flag: "https://media.api-sports.io/flags/th.svg" },
  { code: 'TJ', name: 'Tajikistan', flag: "https://media.api-sports.io/flags/tj.svg" },
  { code: 'TL', name: 'Timor-Leste', flag: "https://media.api-sports.io/flags/tl.svg" },
  { code: 'TM', name: 'Turkmenistan', flag: "https://media.api-sports.io/flags/tm.svg" },
  { code: 'TW', name: 'Taiwan', flag: "https://media.api-sports.io/flags/tw.svg" },
  { code: 'UZ', name: 'Uzbekistan', flag: "https://media.api-sports.io/flags/uz.svg" },
  { code: 'VN', name: 'Vietnam', flag: "https://media.api-sports.io/flags/vn.svg" },
  { code: 'YE', name: 'Yemen', flag: "https://media.api-sports.io/flags/ye.svg" },
  { code: 'AE', name: 'United Arab Emirates', flag: "https://media.api-sports.io/flags/ae.svg" },

  // Africa
  { code: 'DZ', name: 'Algeria', flag: "https://media.api-sports.io/flags/dz.svg" },
  { code: 'AO', name: 'Angola', flag: "https://media.api-sports.io/flags/ao.svg" },
  { code: 'BJ', name: 'Benin', flag: "https://media.api-sports.io/flags/bj.svg" },
  { code: 'BF', name: 'Burkina Faso', flag: "https://media.api-sports.io/flags/bf.svg" },
  { code: 'BI', name: 'Burundi', flag: "https://media.api-sports.io/flags/bi.svg" },
  { code: 'BW', name: 'Botswana', flag: "https://media.api-sports.io/flags/bw.svg" },
  { code: 'CD', name: 'Democratic Republic of the Congo', flag: "https://media.api-sports.io/flags/cd.svg" },
  { code: 'CF', name: 'Central African Republic', flag: "https://media.api-sports.io/flags/cf.svg" },
  { code: 'CG', name: 'Republic of the Congo', flag: "https://media.api-sports.io/flags/cg.svg" },
  { code: 'CI', name: 'Ivory Coast', flag: "https://media.api-sports.io/flags/ci.svg" },
  { code: 'CM', name: 'Cameroon', flag: "https://media.api-sports.io/flags/cm.svg" },
  { code: 'CV', name: 'Cape Verde', flag: "https://media.api-sports.io/flags/cv.svg" },
  { code: 'DJ', name: 'Djibouti', flag: "https://media.api-sports.io/flags/dj.svg" },
  { code: 'EG', name: 'Egypt', flag: "https://media.api-sports.io/flags/eg.svg" },
  { code: 'ER', name: 'Eritrea', flag: "https://media.api-sports.io/flags/er.svg" },
  { code: 'ET', name: 'Ethiopia', flag: "https://media.api-sports.io/flags/et.svg" },
  { code: 'GA', name: 'Gabon', flag: "https://media.api-sports.io/flags/ga.svg" },
  { code: 'GH', name: 'Ghana', flag: "https://media.api-sports.io/flags/gh.svg" },
  { code: 'GM', name: 'Gambia', flag: "https://media.api-sports.io/flags/gm.svg" },
  { code: 'GN', name: 'Guinea', flag: "https://media.api-sports.io/flags/gn.svg" },
  { code: 'GQ', name: 'Equatorial Guinea', flag: "https://media.api-sports.io/flags/gq.svg" },
  { code: 'GW', name: 'Guinea-Bissau', flag: "https://media.api-sports.io/flags/gw.svg" },
  { code: 'KE', name: 'Kenya', flag: "https://media.api-sports.io/flags/ke.svg" },
  { code: 'KM', name: 'Comoros', flag: "https://media.api-sports.io/flags/km.svg" },
  { code: 'LR', name: 'Liberia', flag: "https://media.api-sports.io/flags/lr.svg" },
  { code: 'LS', name: 'Lesotho', flag: "https://media.api-sports.io/flags/ls.svg" },
  { code: 'LY', name: 'Libya', flag: "https://media.api-sports.io/flags/ly.svg" },
  { code: 'MA', name: 'Morocco', flag: "https://media.api-sports.io/flags/ma.svg" },
  { code: 'MG', name: 'Madagascar', flag: "https://media.api-sports.io/flags/mg.svg" },
  { code: 'ML', name: 'Mali', flag: "https://media.api-sports.io/flags/ml.svg" },
  { code: 'MR', name: 'Mauritania', flag: "https://media.api-sports.io/flags/mr.svg" },
  { code: 'MU', name: 'Mauritius', flag: "https://media.api-sports.io/flags/mu.svg" },
  { code: 'MW', name: 'Malawi', flag: "https://media.api-sports.io/flags/mw.svg" },
  { code: 'MZ', name: 'Mozambique', flag: "https://media.api-sports.io/flags/mz.svg" },
  { code: 'NA', name: 'Namibia', flag: "https://media.api-sports.io/flags/na.svg" },
  { code: 'NE', name: 'Niger', flag: "https://media.api-sports.io/flags/ne.svg" },
  { code: 'NG', name: 'Nigeria', flag: "https://media.api-sports.io/flags/ng.svg" },
  { code: 'RW', name: 'Rwanda', flag: "https://media.api-sports.io/flags/rw.svg" },
  { code: 'SC', name: 'Seychelles', flag: "https://media.api-sports.io/flags/sc.svg" },
  { code: 'SD', name: 'Sudan', flag: "https://media.api-sports.io/flags/sd.svg" },
  { code: 'SL', name: 'Sierra Leone', flag: "https://media.api-sports.io/flags/sl.svg" },
  { code: 'SN', name: 'Senegal', flag: "https://media.api-sports.io/flags/sn.svg" },
  { code: 'SO', name: 'Somalia', flag: "https://media.api-sports.io/flags/so.svg" },
  { code: 'SS', name: 'South Sudan', flag: "https://media.api-sports.io/flags/ss.svg" },
  { code: 'ST', name: 'São Tomé and Príncipe', flag: "https://media.api-sports.io/flags/st.svg" },
  { code: 'SZ', name: 'Eswatini', flag: "https://media.api-sports.io/flags/sz.svg" },
  { code: 'TD', name: 'Chad', flag: "https://media.api-sports.io/flags/td.svg" },
  { code: 'TG', name: 'Togo', flag: "https://media.api-sports.io/flags/tg.svg" },
  { code: 'TN', name: 'Tunisia', flag: "https://media.api-sports.io/flags/tn.svg" },
  { code: 'TZ', name: 'Tanzania', flag: "https://media.api-sports.io/flags/tz.svg" },
  { code: 'UG', name: 'Uganda', flag: "https://media.api-sports.io/flags/ug.svg" },
  { code: 'ZA', name: 'South Africa', flag: "https://media.api-sports.io/flags/za.svg" },
  { code: 'ZM', name: 'Zambia', flag: "https://media.api-sports.io/flags/zm.svg" },
  { code: 'ZW', name: 'Zimbabwe', flag: "https://media.api-sports.io/flags/zw.svg" },

  // North America
  { code: 'AG', name: 'Antigua and Barbuda', flag: "https://media.api-sports.io/flags/ag.svg" },
  { code: 'BB', name: 'Barbados', flag: "https://media.api-sports.io/flags/bb.svg" },
  { code: 'BZ', name: 'Belize', flag: "https://media.api-sports.io/flags/bz.svg" },
  { code: 'BS', name: 'Bahamas', flag: "https://media.api-sports.io/flags/bs.svg" },
  { code: 'CA', name: 'Canada', flag: "https://media.api-sports.io/flags/ca.svg" },
  { code: 'CR', name: 'Costa Rica', flag: "https://media.api-sports.io/flags/cr.svg" },
  { code: 'CU', name: 'Cuba', flag: "https://media.api-sports.io/flags/cu.svg" },
  { code: 'DM', name: 'Dominica', flag: "https://media.api-sports.io/flags/dm.svg" },
  { code: 'DO', name: 'Dominican Republic', flag: "https://media.api-sports.io/flags/do.svg" },
  { code: 'GD', name: 'Grenada', flag: "https://media.api-sports.io/flags/gd.svg" },
  { code: 'GT', name: 'Guatemala', flag: "https://media.api-sports.io/flags/gt.svg" },
  { code: 'HN', name: 'Honduras', flag: "https://media.api-sports.io/flags/hn.svg" },
  { code: 'HT', name: 'Haiti', flag: "https://media.api-sports.io/flags/ht.svg" },
  { code: 'JM', name: 'Jamaica', flag: "https://media.api-sports.io/flags/jm.svg" },
  { code: 'KN', name: 'Saint Kitts and Nevis', flag: "https://media.api-sports.io/flags/kn.svg" },
  { code: 'LC', name: 'Saint Lucia', flag: "https://media.api-sports.io/flags/lc.svg" },
  { code: 'MX', name: 'Mexico', flag: "https://media.api-sports.io/flags/mx.svg" },
  { code: 'NI', name: 'Nicaragua', flag: "https://media.api-sports.io/flags/ni.svg" },
  { code: 'PA', name: 'Panama', flag: "https://media.api-sports.io/flags/pa.svg" },
  { code: 'SV', name: 'El Salvador', flag: "https://media.api-sports.io/flags/sv.svg" },
  { code: 'TT', name: 'Trinidad and Tobago', flag: "https://media.api-sports.io/flags/tt.svg" },
  { code: 'US', name: 'USA', flag: "https://media.api-sports.io/flags/us.svg" },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', flag: "https://media.api-sports.io/flags/vc.svg" },

  // South America
  { code: 'AR', name: 'Argentina', flag: "https://media.api-sports.io/flags/ar.svg" },
  { code: 'BO', name: 'Bolivia', flag: "https://media.api-sports.io/flags/bo.svg" },
  { code: 'BR', name: 'Brazil', flag: "https://media.api-sports.io/flags/br.svg" },
  { code: 'CL', name: 'Chile', flag: "https://media.api-sports.io/flags/cl.svg" },
  { code: 'CO', name: 'Colombia', flag: "https://media.api-sports.io/flags/co.svg" },
  { code: 'EC', name: 'Ecuador', flag: "https://media.api-sports.io/flags/ec.svg" },
  { code: 'FK', name: 'Falkland Islands', flag: "https://media.api-sports.io/flags/fk.svg" },
  { code: 'GF', name: 'French Guiana', flag: "https://media.api-sports.io/flags/gf.svg" },
  { code: 'GY', name: 'Guyana', flag: "https://media.api-sports.io/flags/gy.svg" },
  { code: 'PE', name: 'Peru', flag: "https://media.api-sports.io/flags/pe.svg" },
  { code: 'PY', name: 'Paraguay', flag: "https://media.api-sports.io/flags/py.svg" },
  { code: 'SR', name: 'Suriname', flag: "https://media.api-sports.io/flags/sr.svg" },
  { code: 'UY', name: 'Uruguay', flag: "https://media.api-sports.io/flags/uy.svg" },
  { code: 'VE', name: 'Venezuela', flag: "https://media.api-sports.io/flags/ve.svg" },

  // Oceania
  { code: 'AU', name: 'Australia', flag: "https://media.api-sports.io/flags/au.svg" },
  { code: 'CK', name: 'Cook Islands', flag: "https://media.api-sports.io/flags/ck.svg" },
  { code: 'FJ', name: 'Fiji', flag: "https://media.api-sports.io/flags/fj.svg" },
  { code: 'FM', name: 'Micronesia', flag: "https://media.api-sports.io/flags/fm.svg" },
  { code: 'KI', name: 'Kiribati', flag: "https://media.api-sports.io/flags/ki.svg" },
  { code: 'MH', name: 'Marshall Islands', flag: "https://media.api-sports.io/flags/mh.svg" },
  { code: 'NC', name: 'New Caledonia', flag: "https://media.api-sports.io/flags/nc.svg" },
  { code: 'NR', name: 'Nauru', flag: "https://media.api-sports.io/flags/nr.svg" },
  { code: 'NU', name: 'Niue', flag: "https://media.api-sports.io/flags/nu.svg" },
  { code: 'NZ', name: 'New Zealand', flag: "https://media.api-sports.io/flags/nz.svg" },
  { code: 'PF', name: 'French Polynesia', flag: "https://media.api-sports.io/flags/pf.svg" },
  { code: 'PG', name: 'Papua New Guinea', flag: "https://media.api-sports.io/flags/pg.svg" },
  { code: 'PW', name: 'Palau', flag: "https://media.api-sports.io/flags/pw.svg" },
  { code: 'SB', name: 'Solomon Islands', flag: "https://media.api-sports.io/flags/sb.svg" },
  { code: 'TK', name: 'Tokelau', flag: "https://media.api-sports.io/flags/tk.svg" },
  { code: 'TO', name: 'Tonga', flag: "https://media.api-sports.io/flags/to.svg" },
  { code: 'TV', name: 'Tuvalu', flag: "https://media.api-sports.io/flags/tv.svg" },
  { code: 'VU', name: 'Vanuatu', flag: "https://media.api-sports.io/flags/vu.svg" },
  { code: 'WF', name: 'Wallis and Futuna', flag: "https://media.api-sports.io/flags/wf.svg" },
  { code: 'WS', name: 'Samoa', flag: "https://media.api-sports.io/flags/ws.svg" },

  // Additional Football-Specific Regions
  { code: 'EU', name: 'Europe', flag: "https://media.api-sports.io/flags/eu.svg" },
  { code: 'WORLD', name: 'World', flag: "https://media.api-sports.io/flags/world.svg" },

  // Australian States/Territories
  { code: 'AU-ACT', name: 'Australian Capital Territory', flag: "https://media.api-sports.io/flags/au-act.svg" },
  { code: 'AU-NSW', name: 'New South Wales', flag: "https://media.api-sports.io/flags/au-nsw.svg" },
  { code: 'AU-NT', name: 'Northern Territory', flag: "https://media.api-sports.io/flags/au-nt.svg" },
  { code: 'AU-QLD', name: 'Queensland', flag: "https://media.api-sports.io/flags/au-qld.svg" },
  { code: 'AU-SA', name: 'South Australia', flag: "https://media.api-sports.io/flags/au-sa.svg" },
  { code: 'AU-TAS', name: 'Tasmania', flag: "https://media.api-sports.io/flags/au-tas.svg" },
  { code: 'AU-VIC', name: 'Victoria', flag: "https://media.api-sports.io/flags/au-vic.svg" },
  { code: 'AU-WA', name: 'Western Australia', flag: "https://media.api-sports.io/flags/au-wa.svg" }
] as const;

// Static list of major leagues (add more as needed)
export const MAJOR_LEAGUES = [
  // England
  { id: 39, name: "Premier League", country: "England", countryCode: "GB-ENG" },
  { id: 40, name: "Championship", country: "England", countryCode: "GB-ENG" },
  { id: 41, name: "League One", country: "England", countryCode: "GB-ENG" },
  { id: 42, name: "League Two", country: "England", countryCode: "GB-ENG" },
  { id: 45, name: "FA Cup", country: "England", countryCode: "GB-ENG" },
  { id: 48, name: "EFL Cup", country: "England", countryCode: "GB-ENG" },

  // Spain
  { id: 140, name: "La Liga", country: "Spain", countryCode: "ES" },
  { id: 141, name: "Segunda División", country: "Spain", countryCode: "ES" },
  { id: 143, name: "Copa del Rey", country: "Spain", countryCode: "ES" },

  // Italy
  { id: 135, name: "Serie A", country: "Italy", countryCode: "IT" },
  { id: 136, name: "Serie B", country: "Italy", countryCode: "IT" },
  { id: 137, name: "Coppa Italia", country: "Italy", countryCode: "IT" },

  // Germany
  { id: 78, name: "Bundesliga", country: "Germany", countryCode: "DE" },
  { id: 79, name: "2. Bundesliga", country: "Germany", countryCode: "DE" },
  { id: 81, name: "DFB Pokal", country: "Germany", countryCode: "DE" },

  // France
  { id: 61, name: "Ligue 1", country: "France", countryCode: "FR" },
  { id: 62, name: "Ligue 2", country: "France", countryCode: "FR" },
  { id: 66, name: "Coupe de France", country: "France", countryCode: "FR" },

  // UEFA Competitions
  { id: 2, name: "UEFA Champions League", country: "World", countryCode: "WORLD" },
  { id: 3, name: "UEFA Europa League", country: "World", countryCode: "WORLD" },
  { id: 848, name: "UEFA Europa Conference League", country: "World", countryCode: "WORLD" },
  { id: 4, name: "UEFA Nations League", country: "World", countryCode: "WORLD" },
  { id: 5, name: "UEFA European Championship", country: "World", countryCode: "WORLD" },

  // Other Major Leagues
  { id: 88, name: "Eredivisie", country: "Netherlands", countryCode: "NL" },
  { id: 94, name: "Primeira Liga", country: "Portugal", countryCode: "PT" },
  { id: 203, name: "Süper Lig", country: "Turkey", countryCode: "TR" },
  { id: 235, name: "Russian Premier League", country: "Russia", countryCode: "RU" },
  { id: 218, name: "Scottish Premiership", country: "Scotland", countryCode: "GB-SCT" },

  // South American
  { id: 128, name: "Copa Libertadores", country: "World", countryCode: "WORLD" },
  { id: 129, name: "Copa Sudamericana", country: "World", countryCode: "WORLD" },

  // International
  { id: 1, name: "FIFA World Cup", country: "World", countryCode: "WORLD" },
  { id: 15, name: "Copa America", country: "World", countryCode: "WORLD" },
  { id: 16, name: "Africa Cup of Nations", country: "World", countryCode: "WORLD" },
  { id: 17, name: "AFC Asian Cup", country: "World", countryCode: "WORLD" },
] as const;

// Helper functions
export const getCountryByCode = (code: string) => {
  return ALL_COUNTRIES.find(country => country.code === code);
};

export const getCountryByName = (name: string) => {
  return ALL_COUNTRIES.find(country => 
    country.name.toLowerCase() === name.toLowerCase()
  );
};

export const getLeagueById = (id: number) => {
  return MAJOR_LEAGUES.find(league => league.id === id);
};

export const getLeaguesByCountry = (countryName: string) => {
  return MAJOR_LEAGUES.filter(league => 
    league.country.toLowerCase() === countryName.toLowerCase()
  );
};

export const getCountriesAsOptions = () => {
  return ALL_COUNTRIES.map(country => ({
    value: country.code,
    label: country.name,
    flag: country.flag
  }));
};

export const getLeaguesAsOptions = () => {
  return MAJOR_LEAGUES.map(league => ({
    value: league.id,
    label: league.name,
    country: league.country,
    countryCode: league.countryCode
  }));
};

// Translation helper functions
export const translateCountryName = (countryName: string, language: string = 'en'): string => {
  const translation = COUNTRY_TRANSLATIONS[countryName];
  if (translation && translation[language as keyof typeof translation]) {
    return translation[language as keyof typeof translation];
  }
  return countryName; // Return original if no translation found
};

export const translateLeagueName = (leagueName: string, language: string = 'en'): string => {
  const translation = LEAGUE_TRANSLATIONS[leagueName];
  if (translation && translation[language as keyof typeof translation]) {
    return translation[language as keyof typeof translation];
  }
  return leagueName; // Return original if no translation found
};

// Enhanced helper functions with translation support
export const getTranslatedCountriesAsOptions = (language: string = 'en') => {
  return ALL_COUNTRIES.map(country => ({
    value: country.code,
    label: translateCountryName(country.name, language),
    originalLabel: country.name,
    flag: country.flag
  }));
};

export const getTranslatedLeaguesAsOptions = (language: string = 'en') => {
  return MAJOR_LEAGUES.map(league => ({
    value: league.id,
    label: translateLeagueName(league.name, language),
    originalLabel: league.name,
    country: translateCountryName(league.country, language),
    originalCountry: league.country,
    countryCode: league.countryCode
  }));
};

// Get translated country by code
export const getTranslatedCountryByCode = (code: string, language: string = 'en') => {
  const country = ALL_COUNTRIES.find(country => country.code === code);
  if (country) {
    return {
      ...country,
      name: translateCountryName(country.name, language),
      originalName: country.name
    };
  }
  return null;
};

// Get translated league by ID
export const getTranslatedLeagueById = (id: number, language: string = 'en') => {
  const league = MAJOR_LEAGUES.find(league => league.id === id);
  if (league) {
    return {
      ...league,
      name: translateLeagueName(league.name, language),
      originalName: league.name,
      country: translateCountryName(league.country, language),
      originalCountry: league.country
    };
  }
  return null;
};

// Get leagues by country with translation support
export const getTranslatedLeaguesByCountry = (countryName: string, language: string = 'en') => {
  return MAJOR_LEAGUES
    .filter(league => league.country.toLowerCase() === countryName.toLowerCase())
    .map(league => ({
      ...league,
      name: translateLeagueName(league.name, language),
      originalName: league.name,
      country: translateCountryName(league.country, language),
      originalCountry: league.country
    }));
};

// Check if a country name has translation available
export const hasCountryTranslation = (countryName: string, language: string = 'en'): boolean => {
  const translation = COUNTRY_TRANSLATIONS[countryName];
  return !!(translation && translation[language as keyof typeof translation]);
};

// Check if a league name has translation available
export const hasLeagueTranslation = (leagueName: string, language: string = 'en'): boolean => {
  const translation = LEAGUE_TRANSLATIONS[leagueName];
  return !!(translation && translation[language as keyof typeof translation]);
};

// Get all supported languages
export const getSupportedLanguages = () => {
  return [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文 (简体)' },
    { code: 'zh-hk', name: '中文 (香港)' },
    { code: 'zh-tw', name: '中文 (台灣)' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' }
  ];
};

// Batch translate multiple countries
export const batchTranslateCountries = (countryNames: string[], language: string = 'en') => {
  return countryNames.map(name => ({
    original: name,
    translated: translateCountryName(name, language),
    hasTranslation: hasCountryTranslation(name, language)
  }));
};

// Batch translate multiple leagues
export const batchTranslateLeagues = (leagueNames: string[], language: string = 'en') => {
  return leagueNames.map(name => ({
    original: name,
    translated: translateLeagueName(name, language),
    hasTranslation: hasLeagueTranslation(name, language)
  }));
};

// Type definitions
export type Country = typeof ALL_COUNTRIES[number];
export type League = typeof MAJOR_LEAGUES[number];
export type CountryOption = ReturnType<typeof getCountriesAsOptions>[number];
export type LeagueOption = ReturnType<typeof getLeaguesAsOptions>[number];

// Extended type definitions with translation support
export type TranslatedCountryOption = ReturnType<typeof getTranslatedCountriesAsOptions>[number];
export type TranslatedLeagueOption = ReturnType<typeof getTranslatedLeaguesAsOptions>[number];
export type TranslatedCountry = ReturnType<typeof getTranslatedCountryByCode>;
export type TranslatedLeague = ReturnType<typeof getTranslatedLeagueById>;
export type SupportedLanguage = ReturnType<typeof getSupportedLanguages>[number];