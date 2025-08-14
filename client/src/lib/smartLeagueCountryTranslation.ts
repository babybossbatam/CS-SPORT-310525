import React, { useState, useEffect } from 'react';

// Assuming ALL_COUNTRIES and MAJOR_LEAGUES are imported from your data source (e.g., countriesAndLeagues.ts)
// For demonstration purposes, let's assume they are available globally or imported here.
// You will need to replace these with your actual imports.
declare const ALL_COUNTRIES: Array<{ name: string; code?: string; translations?: { [key: string]: string } }>;
declare const MAJOR_LEAGUES: Array<{ name: string; country?: string }>;
declare const COUNTRY_TRANSLATIONS: { [key: string]: { [key: string]: string } };

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

// Interface for automated country mappings, including preferred translation details
interface AutomatedCountryMapping {
  leagueContext?: string;
  occurrenceCount: number;
  lastSeen: number;
  preferredTranslation?: string;
  language?: string;
}

class SmartLeagueCountryTranslation {
  private leagueCache = new Map<string, string>();
  private countryCache = new Map<string, string>();
  private learnedLeagueMappings = new Map<string, LeagueTranslation>();
  private learnedCountryMappings = new Map<string, CountryTranslation>();
  private automatedLeagueMappings = new Map<string, any>();
  private automatedCountryMappings = new Map<string, AutomatedCountryMapping>(); // Use the specific interface
  private translationCache = new Map<string, { translation: string; timestamp: number }>();
  private isLoading = false;

  // Popular country translations - manually curated for high-quality results
  private popularCountries: { [key: string]: any } = {
    'World': {
      'zh': '世界', 'zh-hk': '世界', 'zh-tw': '世界',
      'es': 'Mundial', 'de': 'Welt', 'it': 'Mondo', 'pt': 'Mundial'
    },
    'Netherlands': {
      'zh': '荷兰', 'zh-hk': '荷蘭', 'zh-tw': '荷蘭',
      'es': 'Países Bajos', 'de': 'Niederlande', 'it': 'Paesi Bassi', 'pt': 'Países Baixos'

    },
    'Portugal': {
      'zh': '葡萄牙', 'zh-hk': '葡萄牙', 'zh-tw': '葡萄牙',
      'es': 'Portugal', 'de': 'Portugal', 'it': 'Portogallo', 'pt': 'Portugal'
    },
    'Belgium': {
      'zh': '比利时', 'zh-hk': '比利時', 'zh-tw': '比利時',
      'es': 'Bélgica', 'de': 'Belgien', 'it': 'Belgio', 'pt': 'Bélgica'
    },
    'Mexico': {
      'zh': '墨西哥', 'zh-hk': '墨西哥', 'zh-tw': '墨西哥',
      'es': 'México', 'de': 'Mexiko', 'it': 'Messico', 'pt': 'México'
    },
    'Dominican Republic': {
      'zh': '多米尼加共和国', 'zh-hk': '多明尼加共和國', 'zh-tw': '多明尼加共和國',
      'es': 'República Dominicana', 'de': 'Dominikanische Republik', 'it': 'Repubblica Dominicana', 'pt': 'República Dominicana'
    },
    'Dominican-Republic': {
      'zh': '多米尼加共和国', 'zh-hk': '多明尼加共和國', 'zh-tw': '多明尼加共和國',
      'es': 'República Dominicana', 'de': 'Dominikanische Republik', 'it': 'Repubblica Dominicana', 'pt': 'República Dominicana'
    },
    'Czech Republic': {
      'zh': '捷克共和国', 'zh-hk': '捷克共和國', 'zh-tw': '捷克共和國',
      'es': 'República Checa', 'de': 'Tschechische Republik', 'it': 'Repubblica Ceca', 'pt': 'República Tcheca'
    },
    'Czech-Republic': {
      'zh': '捷克共和国', 'zh-hk': '捷克共和國', 'zh-tw': '捷克共和國',
      'es': 'República Checa', 'de': 'Tschechische Republik', 'it': 'Repubblica Ceca', 'pt': 'República Tcheca'
    },
    'Europe': {
      'zh': '欧洲', 'zh-hk': '歐洲', 'zh-tw': '歐洲',
      'es': 'Europa', 'de': 'Europa', 'it': 'Europa', 'pt': 'Europa'
    },
    // Major European Countries
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
      'zh': '德國', 'zh-hk': '德國', 'zh-tw': '德國',
      'es': 'Alemania', 'de': 'Deutschland', 'it': 'Germania', 'pt': 'Alemanha'
    },
    'France': {
      'zh': '法国', 'zh-hk': '法國', 'zh-tw': '法國',
      'es': 'Francia', 'de': 'Frankreich', 'it': 'Francia', 'pt': 'França'
    },


    'Switzerland': {
      'zh': '瑞士', 'zh-hk': '瑞士', 'zh-tw': '瑞士',
      'es': 'Suiza', 'de': 'Schweiz', 'it': 'Svizzera', 'pt': 'Suíça'
    },
    'Austria': {
      'zh': '奧地利', 'zh-hk': '奧地利', 'zh-tw': '奧地利',
      'es': 'Austria', 'de': 'Österreich', 'it': 'Austria', 'pt': 'Áustria'
    },

    'Slovakia': {
      'zh': '斯洛伐克', 'zh-hk': '斯洛伐克', 'zh-tw': '斯洛伐克',
      'es': 'Eslovaquia', 'de': 'Slowakei', 'it': 'Slovacchia', 'pt': 'Eslováquia'
    },
    'Slovenia': {
      'zh': '斯洛文尼亞', 'zh-hk': '斯洛文尼亞', 'zh-tw': '斯洛維尼亞',
      'es': 'Eslovenia', 'de': 'Slowenien', 'it': 'Slovenia', 'pt': 'Eslovênia'
    },
    'Hungary': {
      'zh': '匈牙利', 'zh-hk': '匈牙利', 'zh-tw': '匈牙利',
      'es': 'Hungría', 'de': 'Ungarn', 'it': 'Ungheria', 'pt': 'Hungria'
    },
    'Poland': {
      'zh': '波蘭', 'zh-hk': '波蘭', 'zh-tw': '波蘭',
      'es': 'Polonia', 'de': 'Polen', 'it': 'Polonia', 'pt': 'Polônia'
    },
    'Romania': {
      'zh': '羅馬尼亞', 'zh-hk': '羅馬尼亞', 'zh-tw': '羅馬尼亞',
      'es': 'Rumania', 'de': 'Rumänien', 'it': 'Romania', 'pt': 'Romênia'
    },
    'Bulgaria': {
      'zh': '保加利亞', 'zh-hk': '保加利亞', 'zh-tw': '保加利亞',
      'es': 'Bulgaria', 'de': 'Bulgarien', 'it': 'Bulgaria', 'pt': 'Bulgária'
    },
    'Croatia': {
      'zh': '克羅地亞', 'zh-hk': '克羅地亞', 'zh-tw': '克羅埃西亞',
      'es': 'Croacia', 'de': 'Kroatien', 'it': 'Croazia', 'pt': 'Croácia'
    },
    'Serbia': {
      'zh': '塞爾維亞', 'zh-hk': '塞爾維亞', 'zh-tw': '塞爾維亞',
      'es': 'Serbia', 'de': 'Serbien', 'it': 'Serbia', 'pt': 'Sérvia'
    },
    'Greece': {
      'zh': '希臘', 'zh-hk': '希臘', 'zh-tw': '希臘',
      'es': 'Grecia', 'de': 'Griechenland', 'it': 'Grecia', 'pt': 'Grécia'
    },
    'Denmark': {
      'zh': '丹麥', 'zh-hk': '丹麥', 'zh-tw': '丹麥',
      'es': 'Dinamarca', 'de': 'Dänemark', 'it': 'Danimarca', 'pt': 'Dinamarca'
    },
    'Sweden': {
      'zh': '瑞典', 'zh-hk': '瑞典', 'zh-tw': '瑞典',
      'es': 'Suecia', 'de': 'Schweden', 'it': 'Svezia', 'pt': 'Suécia'
    },
    'Norway': {
      'zh': '挪威', 'zh-hk': '挪威', 'zh-tw': '挪威',
      'es': 'Noruega', 'de': 'Norwegen', 'it': 'Norvegia', 'pt': 'Noruega'
    },
    'Finland': {
      'zh': '芬蘭', 'zh-hk': '芬蘭', 'zh-tw': '芬蘭',
      'es': 'Finlandia', 'de': 'Finnland', 'it': 'Finlandia', 'pt': 'Finlândia'
    },
    'Iceland': {
      'zh': '冰島', 'zh-hk': '冰島', 'zh-tw': '冰島',
      'es': 'Islandia', 'de': 'Island', 'it': 'Islanda', 'pt': 'Islândia'
    },
    'Russia': {
      'zh': '俄羅斯', 'zh-hk': '俄羅斯', 'zh-tw': '俄羅斯',
      'es': 'Rusia', 'de': 'Russland', 'it': 'Russia', 'pt': 'Rússia'
    },
    'Ukraine': {
      'zh': '烏克蘭', 'zh-hk': '烏克蘭', 'zh-tw': '烏克蘭',
      'es': 'Ucrania', 'de': 'Ukraine', 'it': 'Ucraina', 'pt': 'Ucrânia'
    },
    'Turkey': {
      'zh': '土耳其', 'zh-hk': '土耳其', 'zh-tw': '土耳其',
      'es': 'Turquía', 'de': 'Türkei', 'it': 'Turchia', 'pt': 'Turquia'
    },
    'Estonia': {
      'zh': '愛沙尼亞', 'zh-hk': '愛沙尼亞', 'zh-tw': '愛沙尼亞',
      'es': 'Estonia', 'de': 'Estland', 'it': 'Estonia', 'pt': 'Estônia'
    },
    'Bhutan': {
      'zh': '不丹',
      'zh-hk': '不丹',
      'zh-tw': '不丹',
      'es': 'Bután',
      'de': 'Bhutan',
      'it': 'Bhutan',
      'pt': 'Butão'
    },
    'Scotland': {
      'zh': '蘇格蘭',
      'zh-hk': '蘇格蘭',
      'zh-tw': '蘇格蘭',
      'es': 'Escocia',
      'de': 'Schottland',
      'it': 'Scozia',
      'pt': 'Escócia'
    },
    'Latvia': {
      'zh': '拉脫維亞', 'zh-hk': '拉脫維亞', 'zh-tw': '拉脫維亞',
      'es': 'Letonia', 'de': 'Lettland', 'it': 'Lettonia', 'pt': 'Letônia'
    },
    'Lithuania': {
      'zh': '立陶宛', 'zh-hk': '立陶宛', 'zh-tw': '立陶宛',
      'es': 'Lituania', 'de': 'Litauen', 'it': 'Lituania', 'pt': 'Lituânia'
    },
    'Georgia': {
      'zh': '格魯吉亞', 'zh-hk': '格魯吉亞', 'zh-tw': '格魯吉亞',
      'es': 'Georgia', 'de': 'Georgien', 'it': 'Georgia', 'pt': 'Geórgia'
    },
    'Armenia': {
      'zh': '亞美尼亞', 'zh-hk': '亞美尼亞', 'zh-tw': '亞美尼亞',
      'es': 'Armenia', 'de': 'Armenien', 'it': 'Armenia', 'pt': 'Armênia'
    },
    'Liechtenstein': {
      'zh': '列支敦士登', 'zh-hk': '列支敦士登', 'zh-tw': '列支敦士登',
      'es': 'Liechtenstein', 'de': 'Liechtenstein', 'it': 'Liechtenstein', 'pt': 'Liechtenstein'
    },

    // Americas
    'Brazil': {
      'zh': '巴西', 'zh-hk': '巴西', 'zh-tw': '巴西',
      'es': 'Brasil', 'de': 'Brasilien', 'it': 'Brasile', 'pt': 'Brasil'
    },
    'Argentina': {
      'zh': '阿根廷', 'zh-hk': '阿根廷', 'zh-tw': '阿根廷',
      'es': 'Argentina', 'de': 'Argentinien', 'it': 'Argentina', 'pt': 'Argentina'
    },


    'United States': {
      'zh': '美國', 'zh-hk': '美國', 'zh-tw': '美國',
      'es': 'Estados Unidos', 'de': 'Vereinigte Staaten', 'it': 'Stati Uniti', 'pt': 'Estados Unidos'
    },
    'Canada': {
      'zh': '加拿大', 'zh-hk': '加拿大', 'zh-tw': '加拿大',
      'es': 'Canadá', 'de': 'Kanada', 'it': 'Canada', 'pt': 'Canadá'
    },
    'Colombia': {
      'zh': '哥倫比亞', 'zh-hk': '哥倫比亞', 'zh-tw': '哥倫比亞',
      'es': 'Colombia', 'de': 'Kolumbien', 'it': 'Colombia', 'pt': 'Colômbia'
    },
    'Chile': {
      'zh': '智利', 'zh-hk': '智利', 'zh-tw': '智利',
      'es': 'Chile', 'de': 'Chile', 'it': 'Cile', 'pt': 'Chile'
    },
    'Peru': {
      'zh': '秘魯', 'zh-hk': '秘魯', 'zh-tw': '秘魯',
      'es': 'Perú', 'de': 'Peru', 'it': 'Perù', 'pt': 'Peru'
    },
    'Ecuador': {
      'zh': '厄瓜多爾', 'zh-hk': '厄瓜多爾', 'zh-tw': '厄瓜多爾',
      'es': 'Ecuador', 'de': 'Ecuador', 'it': 'Ecuador', 'pt': 'Equador'
    },
    'Uruguay': {
      'zh': '烏拉圭', 'zh-hk': '烏拉圭', 'zh-tw': '烏拉圭',
      'es': 'Uruguay', 'de': 'Uruguay', 'it': 'Uruguay', 'pt': 'Uruguai'
    },
    'Paraguay': {
      'zh': '巴拉圭', 'zh-hk': '巴拉圭', 'zh-tw': '巴拉圭',
      'es': 'Paraguay', 'de': 'Paraguay', 'it': 'Paraguay', 'pt': 'Paraguai'
    },
    'Bolivia': {
      'zh': '玻利維亞', 'zh-hk': '玻利維亞', 'zh-tw': '玻利維亞',
      'es': 'Bolivia', 'de': 'Bolivien', 'it': 'Bolivia', 'pt': 'Bolívia'
    },
    'Venezuela': {
      'zh': '委內瑞拉', 'zh-hk': '委內瑞拉', 'zh-tw': '委內瑞拉',
      'es': 'Venezuela', 'de': 'Venezuela', 'it': 'Venezuela', 'pt': 'Venezuela'
    },


    // Asia & Oceania
    'Japan': {
      'zh': '日本', 'zh-hk': '日本', 'zh-tw': '日本',
      'es': 'Japón', 'de': 'Japan', 'it': 'Giappone', 'pt': 'Japão'
    },
    'South Korea': {
      'zh': '韓國', 'zh-hk': '韓國', 'zh-tw': '韓國',
      'es': 'Corea del Sur', 'de': 'Südkorea', 'it': 'Corea del Sud', 'pt': 'Coreia do Sul'
    },
    'China': {
      'zh': '中國', 'zh-hk': '中國', 'zh-tw': '中國',
      'es': 'China', 'de': 'China', 'it': 'Cina', 'pt': 'China'
    },
    'India': {
      'zh': '印度', 'zh-hk': '印度', 'zh-tw': '印度',
      'es': 'India', 'de': 'Indien', 'it': 'India', 'pt': 'Índia'
    },
    'Australia': {
      'zh': '澳洲', 'zh-hk': '澳洲', 'zh-tw': '澳洲',
      'es': 'Australia', 'de': 'Australien', 'it': 'Australia', 'pt': 'Austrália'
    },
    'New South Wales': {
      'zh': '新南威爾士', 'zh-hk': '新南威爾士', 'zh-tw': '新南威爾士',
      'es': 'Nueva Gales del Sur', 'de': 'New South Wales', 'it': 'Nuovo Galles del Sud', 'pt': 'Nova Gales do Sul'
    },
    'Western Australia': {
      'zh': '西澳大利亞', 'zh-hk': '西澳大利亞', 'zh-tw': '西澳大利亞',
      'es': 'Australia Occidental', 'de': 'Western Australia', 'it': 'Australia Occidentale', 'pt': 'Austrália Ocidental'
    },
    'Australian Capital Territory': {
      'zh': '澳洲首都地區', 'zh-hk': '澳洲首都地區', 'zh-tw': '澳洲首都地區',
      'es': 'Territorio de la Capital Australiana', 'de': 'Australian Capital Territory', 'it': 'Territorio della Capitale Australiana', 'pt': 'Território da Capital Australiana'
    },
    'Thailand': {
      'zh': '泰國', 'zh-hk': '泰國', 'zh-tw': '泰國',
      'es': 'Tailandia', 'de': 'Thailand', 'it': 'Thailandia', 'pt': 'Tailândia'
    },
    'Malaysia': {
      'zh': '馬來西亞', 'zh-hk': '馬來西亞', 'zh-tw': '馬來西亞',
      'es': 'Malasia', 'de': 'Malaysia', 'it': 'Malesia', 'pt': 'Malásia'
    },
    'Singapore': {
      'zh': '新加坡', 'zh-hk': '新加坡', 'zh-tw': '新加坡',
      'es': 'Singapur', 'de': 'Singapur', 'it': 'Singapore', 'pt': 'Singapura'
    },
    'Indonesia': {
      'zh': '印尼', 'zh-hk': '印尼', 'zh-tw': '印尼',
      'es': 'Indonesia', 'de': 'Indonesien', 'it': 'Indonesia', 'pt': 'Indonésia'
    },
    'Philippines': {
      'zh': '菲律賓', 'zh-hk': '菲律賓', 'zh-tw': '菲律賓',
      'es': 'Filipinas', 'de': 'Philippinen', 'it': 'Filippine', 'pt': 'Filipinas'
    },
    'Vietnam': {
      'zh': '越南', 'zh-hk': '越南', 'zh-tw': '越南',
      'es': 'Vietnam', 'de': 'Vietnam', 'it': 'Vietnam', 'pt': 'Vietnã'
    },

    // Middle East & Africa
    'Saudi Arabia': {
      'zh': '沙特阿拉伯', 'zh-hk': '沙特阿拉伯', 'zh-tw': '沙特阿拉伯',
      'es': 'Arabia Saudí', 'de': 'Saudi-Arabien', 'it': 'Arabia Saudita', 'pt': 'Arábia Saudita'
    },
    'United Arab Emirates': {
      'zh': '阿拉伯聯合酋長國', 'zh-hk': '阿拉伯聯合酋長國', 'zh-tw': '阿拉伯聯合酋長國',
      'es': 'Emiratos Árabes Unidos', 'de': 'Vereinigte Arabische Emirate', 'it': 'Emirati Arabi Uniti', 'pt': 'Emirados Árabes Unidos'
    },
    'UAE': {
      'zh': '阿聯酋', 'zh-hk': '阿聯酋', 'zh-tw': '阿聯酋',
      'es': 'EAU', 'de': 'VAE', 'it': 'EAU', 'pt': 'EAU'
    },
    'Egypt': {
      'zh': '埃及', 'zh-hk': '埃及', 'zh-tw': '埃及',
      'es': 'Egipto', 'de': 'Ägypten', 'it': 'Egitto', 'pt': 'Egito'
    },
    'Iran': {
      'zh': '伊朗', 'zh-hk': '伊朗', 'zh-tw': '伊朗',
      'es': 'Irán', 'de': 'Iran', 'it': 'Iran', 'pt': 'Irã'
    },
    'Iraq': {
      'zh': '伊拉克', 'zh-hk': '伊拉克', 'zh-tw': '伊拉克',
      'es': 'Irak', 'de': 'Irak', 'it': 'Iraq', 'pt': 'Iraque'
    },
    'Israel': {
      'zh': '以色列', 'zh-hk': '以色列', 'zh-tw': '以色列',
      'es': 'Israel', 'de': 'Israel', 'it': 'Israele', 'pt': 'Israel'
    },
    'Jordan': {
      'zh': '約旦', 'zh-hk': '約旦', 'zh-tw': '約旦',
      'es': 'Jordania', 'de': 'Jordanien', 'it': 'Giordania', 'pt': 'Jordânia'
    },
    'Qatar': {
      'zh': '卡塔爾', 'zh-hk': '卡塔爾', 'zh-tw': '卡達',
      'es': 'Catar', 'de': 'Katar', 'it': 'Qatar', 'pt': 'Catar'
    },
    'Kuwait': {
      'zh': '科威特', 'zh-hk': '科威特', 'zh-tw': '科威特',
      'es': 'Kuwait', 'de': 'Kuwait', 'it': 'Kuwait', 'pt': 'Kuwait'
    },
    'Bahrain': {
      'zh': '巴林', 'zh-hk': '巴林', 'zh-tw': '巴林',
      'es': 'Baréin', 'de': 'Bahrain', 'it': 'Bahrain', 'pt': 'Bahrein'
    },
    'Oman': {
      'zh': '阿曼', 'zh-hk': '阿曼', 'zh-tw': '阿曼',
      'es': 'Omán', 'de': 'Oman', 'it': 'Oman', 'pt': 'Omã'
    },
    'South Africa': {
      'zh': '南非', 'zh-hk': '南非', 'zh-tw': '南非',
      'es': 'Sudáfrica', 'de': 'Südafrika', 'it': 'Sudafrica', 'pt': 'África do Sul'
    },
    'Nigeria': {
      'zh': '尼日利亞', 'zh-hk': '尼日利亞', 'zh-tw': '奈及利亞',
      'es': 'Nigeria', 'de': 'Nigeria', 'it': 'Nigeria', 'pt': 'Nigéria'
    },
    'Morocco': {
      'zh': '摩洛哥', 'zh-hk': '摩洛哥', 'zh-tw': '摩洛哥',
      'es': 'Marruecos', 'de': 'Marokko', 'it': 'Marocco', 'pt': 'Marrocos'
    },
    'Algeria': {
      'zh': '阿爾及利亞', 'zh-hk': '阿爾及利亞', 'zh-tw': '阿爾及利亞',
      'es': 'Argelia', 'de': 'Algerien', 'it': 'Algeria', 'pt': 'Argélia'
    },
    'Tunisia': {
      'zh': '突尼斯', 'zh-hk': '突尼斯', 'zh-tw': '突尼西亞',
      'es': 'Túnez', 'de': 'Tunesien', 'it': 'Tunisia', 'pt': 'Tunísia'
    },
    'Ghana': {
      'zh': '加納', 'zh-hk': '加納', 'zh-tw': '迦納',
      'es': 'Ghana', 'de': 'Ghana', 'it': 'Ghana', 'pt': 'Gana'
    },
    'Kenya': {
      'zh': '肯尼亞', 'zh-hk': '肯尼亞', 'zh-tw': '肯亞',
      'es': 'Kenia', 'de': 'Kenia', 'it': 'Kenya', 'pt': 'Quênia'
    },
    'Cameroon': {
      'zh': '喀麥隆', 'zh-hk': '喀麥隆', 'zh-tw': '喀麥隆',
      'es': 'Camerún', 'de': 'Kamerun', 'it': 'Camerun', 'pt': 'Camarões'
    },
    'Senegal': {
      'zh': '塞內加爾', 'zh-hk': '塞內加爾', 'zh-tw': '塞內加爾',
      'es': 'Senegal', 'de': 'Senegal', 'it': 'Senegal', 'pt': 'Senegal'
    },
    'Ivory Coast': {
      'zh': '科特迪瓦', 'zh-hk': '科特迪瓦', 'zh-tw': '象牙海岸',
      'es': 'Costa de Marfil', 'de': 'Elfenbeinküste', 'it': 'Costa d\'Avorio', 'pt': 'Costa do Marfim'
    },
    'Mali': {
      'zh': '馬里', 'zh-hk': '馬里', 'zh-tw': '馬利',
      'es': 'Malí', 'de': 'Mali', 'it': 'Mali', 'pt': 'Mali'
    },
    'Burkina Faso': {
      'zh': '布基納法索', 'zh-hk': '布基納法索', 'zh-tw': '布吉納法索',
      'es': 'Burkina Faso', 'de': 'Burkina Faso', 'it': 'Burkina Faso', 'pt': 'Burkina Faso'
    },
    'Zimbabwe': {
      'zh': '津巴布韋', 'zh-hk': '津巴布韋', 'zh-tw': '辛巴威',
      'es': 'Zimbabue', 'de': 'Simbabwe', 'it': 'Zimbabwe', 'pt': 'Zimbábue'
    },
    'Zambia': {
      'zh': '贊比亞', 'zh-hk': '贊比亞', 'zh-tw': '尚比亞',
      'es': 'Zambia', 'de': 'Sambia', 'it': 'Zambia', 'pt': 'Zâmbia'
    },
    'Libya': {
      'zh': '利比亞', 'zh-hk': '利比亞', 'zh-tw': '利比亞',
      'es': 'Libia', 'de': 'Libyen', 'it': 'Libia', 'pt': 'Líbia'
    },
    'Macedonia': {
      'zh': '馬其頓', 'zh-hk': '馬其頓', 'zh-tw': '馬其頓',
      'es': 'Macedonia', 'de': 'Mazedonien', 'it': 'Macedonia', 'pt': 'Macedônia'
    },
    'Northern Ireland': {
      'zh': '北愛爾蘭', 'zh-hk': '北愛爾蘭', 'zh-tw': '北愛爾蘭',
      'es': 'Irlanda del Norte', 'de': 'Nordirland', 'it': 'Irlanda del Nord', 'pt': 'Irlanda do Norte'
    },
    'Northern-Ireland': {
      'zh': '北愛爾蘭', 'zh-hk': '北愛爾蘭', 'zh-tw': '北愛爾蘭',
      'es': 'Irlanda del Norte', 'de': 'Nordirland', 'it': 'Irlanda del Nord', 'pt': 'Irlanda do Norte'
    },
    'Turkmenistan': {
      'zh': '土庫曼斯坦', 'zh-hk': '土庫曼斯坦', 'zh-tw': '土庫曼斯坦',
      'es': 'Turkmenistán', 'de': 'Turkmenistan', 'it': 'Turkmenistan', 'pt': 'Turcomenistão'
    },
    'USA': {
      'zh': '美國', 'zh-hk': '美國', 'zh-tw': '美國',
      'es': 'Estados Unidos', 'de': 'USA', 'it': 'Stati Uniti', 'pt': 'EUA'
    },
    'United States of America': {
      'zh': '美利堅合眾國', 'zh-hk': '美利堅合眾國', 'zh-tw': '美利堅合眾國',
      'es': 'Estados Unidos de América', 'de': 'Vereinigte Staaten von Amerika', 'it': 'Stati Uniti d\'America', 'pt': 'Estados Unidos da América'
    },

    'Guatemala': {
      'zh': '危地馬拉', 'zh-hk': '危地馬拉', 'zh-tw': '瓜地馬拉',
      'es': 'Guatemala', 'de': 'Guatemala', 'it': 'Guatemala', 'pt': 'Guatemala'
    },
    'Honduras': {
      'zh': '洪都拉斯', 'zh-hk': '洪都拉斯', 'zh-tw': '宏都拉斯',
      'es': 'Honduras', 'de': 'Honduras', 'it': 'Honduras', 'pt': 'Honduras'
    },
    'El Salvador': {
      'zh': '薩爾瓦多', 'zh-hk': '薩爾瓦多', 'zh-tw': '薩爾瓦多',
      'es': 'El Salvador', 'de': 'El Salvador', 'it': 'El Salvador', 'pt': 'El Salvador'
    },
    'Nicaragua': {
      'zh': '尼加拉瓜', 'zh-hk': '尼加拉瓜', 'zh-tw': '尼加拉瓜',
      'es': 'Nicaragua', 'de': 'Nicaragua', 'it': 'Nicaragua', 'pt': 'Nicarágua'
    },
    'Costa Rica': {
      'zh': '哥斯達黎加', 'zh-hk': '哥斯達黎加', 'zh-tw': '哥斯大黎加',
      'es': 'Costa Rica', 'de': 'Costa Rica', 'it': 'Costa Rica', 'pt': 'Costa Rica'
    },
    'Panama': {
      'zh': '巴拿馬', 'zh-hk': '巴拿馬', 'zh-tw': '巴拿馬',
      'es': 'Panamá', 'de': 'Panama', 'it': 'Panama', 'pt': 'Panamá'
    },
    'Jamaica': {
      'zh': '牙買加', 'zh-hk': '牙買加', 'zh-tw': '牙買加',
      'es': 'Jamaica', 'de': 'Jamaika', 'it': 'Giamaica', 'pt': 'Jamaica'
    },
    'Trinidad and Tobago': {
      'zh': '千里達及托巴哥', 'zh-hk': '千里達及托巴哥', 'zh-tw': '千里達及托巴哥',
      'es': 'Trinidad y Tobago', 'de': 'Trinidad und Tobago', 'it': 'Trinidad e Tobago', 'pt': 'Trinidad e Tobago'
    }
  };

  constructor() {
    this.loadLearnedMappings();
    this.clearCache();
    this.fixCorruptedCache();
    this.applyImmediateTranslationFixes();
    // Initialize comprehensive country mappings from countriesAndLeagues.ts
    this.popularCountries = { ...this.popularCountries, ...this.initializeComprehensiveCountryMappings() };
    this.initializeLeagueMappings();
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
      'zh': 'UEFA歐洲冠軍聯賽', 'zh-hk': 'UEFA歐洲冠軍聯賽', 'zh-tw': 'UEFA歐洲冠軍聯賽',
      'es': 'Liga de Campeones de la UEFA', 'de': 'UEFA Champions League', 'it': 'UEFA Champions League', 'pt': 'Liga dos Campeões da UEFA'
    },
    'UEFA Europa League': {
      'zh': 'UEFA歐洲聯賽', 'zh-hk': 'UEFA歐洲聯賽', 'zh-tw': 'UEFA歐洲聯賽',
      'es': 'Liga Europa de la UEFA', 'de': 'UEFA Europa League', 'it': 'UEFA Europa League', 'pt': 'Liga Europa da UEFA'
    },
    'UEFA Conference League': {
      'zh': 'UEFA歐洲協會聯賽', 'zh-hk': 'UEFA歐洲協會聯賽', 'zh-tw': 'UEFA歐洲協會聯賽',
      'es': 'Liga de la Conferencia UEFA', 'de': 'UEFA Conference League', 'it': 'UEFA Conference League', 'pt': 'Liga da Conferência UEFA'
    },
    'UEFA Nations League': {
      'zh': 'UEFA國家聯賽', 'zh-hk': 'UEFA國家聯賽', 'zh-tw': 'UEFA國家聯賽',
      'es': 'Liga de Naciones de la UEFA', 'de': 'UEFA Nations League', 'it': 'UEFA Nations League', 'pt': 'Liga das Nações da UEFA'
    },
    'UEFA Super Cup': {
      'zh': 'UEFA超級盃', 'zh-hk': 'UEFA超級盃', 'zh-tw': 'UEFA超級盃',
      'es': 'Supercopa de la UEFA', 'de': 'UEFA Super Cup', 'it': 'Supercoppa UEFA', 'pt': 'Supertaça Europeia'
    },

    // Top European Leagues
    'Premier League': {
      'zh': '英格蘭超級聯賽', 'zh-hk': '英格蘭超級聯賽', 'zh-tw': '英格蘭超級聯賽',
      'es': 'Premier League', 'de': 'Premier League', 'it': 'Premier League', 'pt': 'Premier League'
    },
    'La Liga': {
      'zh': '西班牙甲級聯賽', 'zh-hk': '西班牙甲級聯賽', 'zh-tw': '西班牙甲級聯賽',
      'es': 'La Liga', 'de': 'La Liga', 'it': 'La Liga', 'pt': 'La Liga'
    },
    'Serie A': {
      'zh': '意大利甲級聯賽', 'zh-hk': '意大利甲級聯賽', 'zh-tw': '意大利甲級聯賽',
      'es': 'Serie A', 'de': 'Serie A', 'it': 'Serie A', 'pt': 'Serie A'
    },
    'Bundesliga': {
      'zh': '德國甲級聯賽', 'zh-hk': '德國甲級聯賽', 'zh-tw': '德國甲級聯賽',
      'es': 'Bundesliga', 'de': 'Bundesliga', 'it': 'Bundesliga', 'pt': 'Bundesliga'
    },
    'Ligue 1': {
      'zh': '法國甲級聯賽', 'zh-hk': '法國甲級聯賽', 'zh-tw': '法國甲級聯賽',
      'es': 'Ligue 1', 'de': 'Ligue 1', 'it': 'Ligue 1', 'pt': 'Ligue 1'
    },

    // Friendlies
    'Friendlies Clubs': {
      'zh': '球會友誼賽', 'zh-hk': '球會友誼賽', 'zh-tw': '球會友誼賽',
      'es': 'Amistosos de Clubes', 'de': 'Vereinsfreundschaftsspiele', 'it': 'Amichevoli di Club', 'pt': 'Amigáveis de Clubes'
    },
    'Club Friendlies': {
      'zh': '球會友誼賽', 'zh-hk': '球會友誼賽', 'zh-tw': '球會友誼賽',
      'es': 'Amistosos de Clubes', 'de': 'Vereinsfreundschaftsspiele', 'it': 'Amichevoli di Club', 'pt': 'Amigáveis de Clubes'
    },
    'Friendlies': {
      'zh': '友誼賽', 'zh-hk': '友誼賽', 'zh-tw': '友誼賽',
      'es': 'Amistosos', 'de': 'Freundschaftsspiele', 'it': 'Amichevoli', 'pt': 'Amigáveis'
    },

    // World Competitions
    'FIFA Club World Cup': {
      'zh': 'FIFA世界冠軍球會盃', 'zh-hk': 'FIFA世界冠軍球會盃', 'zh-tw': 'FIFA世界冠軍球會盃',
      'es': 'Copa Mundial de Clubes FIFA', 'de': 'FIFA Klub-Weltmeisterschaft', 'it': 'Coppa del Mondo per club FIFA', 'pt': 'Copa do Mundo de Clubes da FIFA'
    },
    'Group Standings': {
      'zh': '小組積分榜', 'zh-hk': '小組積分榜', 'zh-tw': '小組積分榜',
      'es': 'Clasificación de Grupos', 'de': 'Gruppentabelle', 'it': 'Classifica Gironi', 'pt': 'Classificação dos Grupos'
    },
    'World Cup': {
      'zh': '世界盃', 'zh-hk': '世界盃', 'zh-tw': '世界盃',
      'es': 'Copa del Mundo', 'de': 'Weltmeisterschaft', 'it': 'Coppa del Mondo', 'pt': 'Copa do Mundo'
    },

    // American Leagues
    'Major League Soccer': {
      'zh': '美國職業足球大聯盟', 'zh-hk': '美國職業足球大聯盟', 'zh-tw': '美國職業足球大聯盟',
      'es': 'Liga Mayor de Fútbol', 'de': 'Major League Soccer', 'it': 'Major League Soccer', 'pt': 'Liga Principal de Futebol'
    },
    'Leagues Cup': {
      'zh': '聯賽盃', 'zh-hk': '聯賽盃', 'zh-tw': '聯賽盃',
      'es': 'Copa de Ligas', 'de': 'Liga-Pokal', 'it': 'Coppa delle Leghe', 'pt': 'Copa das Ligas'
    },

    // Friendlies variations
      'friendlies clubs': {
        'en': 'Club Friendlies',
        'es': 'Amistosos de Clubes',
        'zh-hk': '球會友誼賽',
        'zh-tw': '球會友誼賽',
        'zh': '球會友誼賽',
        'de': 'Vereinsfreundschaftsspiele',
        'it': 'Amichevoli di Club',
        'pt': 'Amigáveis de Clubes'
      },

      // Argentina Leagues
      'Primera Nacional': {
        'en': 'Primera Nacional',
        'es': 'Primera Nacional',
        'zh-hk': '全國甲級聯賽',
        'zh-tw': '全國甲級聯賽',
        'zh': '全国甲级联赛',
        'de': 'Primera Nacional',
        'it': 'Primera Nacional',
        'pt': 'Primera Nacional'
      },

      'Primera C': {
        'en': 'Primera C',
        'es': 'Primera C',
        'zh-hk': 'C級聯賽',
        'zh-tw': 'C級聯賽',
        'zh': 'C级联赛',
        'de': 'Primera C',
        'it': 'Primera C',
        'pt': 'Primera C'
      },

      // Australian Leagues
      'Capital Territory NPL': {
        'en': 'Capital Territory NPL',
        'es': 'Liga Nacional del Territorio de la Capital',
        'zh-hk': '首都地區國家聯賽',
        'zh-tw': '首都地區國家聯賽',
        'zh': '首都地区国家联赛',
        'de': 'Capital Territory National Premier League',
        'it': 'Lega Nazionale del Territorio della Capitale',
        'pt': 'Liga Nacional do Território da Capital'
      },

      'Western Australia NPL': {
        'en': 'Western Australia NPL',
        'es': 'Liga Nacional de Australia Occidental',
        'zh-hk': '西澳大利亞國家聯賽',
        'zh-tw': '西澳大利亞國家聯賽',
        'zh': '西澳大利亚国家联赛',
        'de': 'Western Australia National Premier League',
        'it': 'Lega Nazionale dell\'Australia Occidentale',
        'pt': 'Liga Nacional da Austrália Ocidental'
      },

      'New South Wales NPL 2': {
        'en': 'New South Wales NPL 2',
        'es': 'Liga Nacional de Nueva Gales del Sur 2',
        'zh-hk': '新南威爾士國家聯賽2',
        'zh-tw': '新南威爾士國家聯賽2',
        'zh': '新南威尔士国家联赛2',
        'de': 'New South Wales National Premier League 2',
        'it': 'Lega Nazionale del Nuovo Galles del Sud 2',
        'pt': 'Liga Nacional de Nova Gales do Sul 2'
      },

      'Australia Cup': {
        'en': 'Australia Cup',
        'es': 'Copa de Australia',
        'zh-hk': '澳洲盃',
        'zh-tw': '澳洲盃',
        'zh': '澳大利亚杯',
        'de': 'Australia Cup',
        'it': 'Coppa d\'Australia',
        'pt': 'Taça da Austrália'
      },

      // Dutch/Chinese Mixed Leagues
      'Netherlands聯賽': {
        'en': 'Netherlands League',
        'es': 'Liga de Países Bajos',
        'zh-hk': '荷蘭聯賽',
        'zh-tw': '荷蘭聯賽',
        'zh': '荷兰联赛',
        'de': 'Niederländische Liga',
        'it': 'Lega Olandese',
        'pt': 'Liga dos Países Baixos'
      },

      'Australia超级联赛': {
        'en': 'Australia Super League',
        'es': 'Superliga de Australia',
        'zh-hk': '澳洲超級聯賽',
        'zh-tw': '澳洲超級聯賽',
        'zh': '澳大利亚超级联赛',
        'de': 'Australische Superliga',
        'it': 'Superlega Australiana',
        'pt': 'Superliga da Austrália'
      },

      'Australia聯賽': {
        'en': 'Australia League',
        'es': 'Liga de Australia',
        'zh-hk': '澳洲聯賽',
        'zh-tw': '澳洲聯賽',
        'zh': '澳大利亚联赛',
        'de': 'Australische Liga',
        'it': 'Lega Australiana',
        'pt': 'Liga da Austrália'
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
      'zh': '非洲國家盃', 'zh-hk': '非洲國家盃', 'zh-tw': '非洲國家盃',
      'es': 'Copa Africana de Naciones', 'de': 'Afrika-Cup', 'it': 'Coppa d\'Africa', 'pt': 'Taça das Nações Africanas'
    },
    'AFCON': {
      'zh': '非洲國家盃', 'zh-hk': '非洲國家盃', 'zh-tw': '非洲國家盃',
      'es': 'Copa Africana de Naciones', 'de': 'Afrika-Cup', 'it': 'Coppa d\'Africa', 'pt': 'Taça das Nações Africanas'
    },
    'Asian Cup': {
      'zh': '亞洲盃', 'zh-hk': '亞洲盃', 'zh-tw': '亞洲盃',
      'es': 'Copa Asiática', 'de': 'Asienmeisterschaft', 'it': 'Coppa d\'Asia', 'pt': 'Taça da Ásia'
    },
    'Copa America': {
      'zh': '美洲盃', 'zh-hk': '美洲盃', 'zh-tw': '美洲盃',
      'es': 'Copa América', 'de': 'Copa América', 'it': 'Copa América', 'pt': 'Copa América'
    },

    // World Cup Qualifications
    'World Cup Qualification South America': {
      'zh': '世界盃南美洲預選賽', 'zh-hk': '世界盃南美洲預選賽', 'zh-tw': '世界盃南美洲預選賽',
      'es': 'Eliminatorias Sudamericanas', 'de': 'WM-Qualifikation Südamerika', 'it': 'Qualificazioni Mondiali Sudamerica', 'pt': 'Eliminatórias Sul-Americanas'
    },
    'World Cup Qualification Europe': {
      'zh': '世界盃歐洲預選賽', 'zh-hk': '世界盃歐洲預選賽', 'zh-tw': '世界盃歐洲預選賽',
      'es': 'Clasificación Europea Mundial', 'de': 'WM-Qualifikation Europa', 'it': 'Qualificazioni Mondiali Europa', 'pt': 'Qualificação Mundial Europa'
    },
    'World Cup Qualification Africa': {
      'zh': '世界盃非洲預選賽', 'zh-hk': '世界盃非洲預選賽', 'zh-tw': '世界盃非洲預選賽',
      'es': 'Clasificación Africana Mundial', 'de': 'WM-Qualifikation Afrika', 'it': 'Qualificazioni Mondiali Africa', 'pt': 'Qualificação Mundial África'
    },
    'World Cup Qualification Asia': {
      'zh': '世界盃亞洲預選賽', 'zh-hk': '世界盃亞洲預選賽', 'zh-tw': '世界盃亞洲預選賽',
      'es': 'Clasificación Asiática Mundial', 'de': 'WM-Qualifikation Asien', 'it': 'Qualificazioni Mondiali Asia', 'pt': 'Qualificação Mundial Ásia'
    },

    // Domestic Cups
    'FA Cup': {
      'zh': 'FA盃', 'zh-hk': 'FA盃', 'zh-tw': 'FA盃',
      'es': 'Copa FA', 'de': 'FA Cup', 'it': 'FA Cup', 'pt': 'Taça FA'
    },
    'Copa del Rey': {
      'zh': '國王盃', 'zh-hk': '國王盃', 'zh-tw': '國王盃',
      'es': 'Copa del Rey', 'de': 'Copa del Rey', 'it': 'Copa del Rey', 'pt': 'Taça do Rei'
    },
    'Coppa Italia': {
      'zh': '意大利盃', 'zh-hk': '意大利盃', 'zh-tw': '意大利盃',
      'es': 'Copa de Italia', 'de': 'Coppa Italia', 'it': 'Coppa Italia', 'pt': 'Taça de Itália'
    },
    'DFB Pokal': {
      'zh': '德國盃', 'zh-hk': '德國盃', 'zh-tw': '德國盃',
      'es': 'Copa de Alemania', 'de': 'DFB-Pokal', 'it': 'Coppa di Germania', 'pt': 'Taça da Alemanha'
    },

    // Regional/Other Leagues
    'Egyptian Premier League': {
      'zh': '埃及超級聯賽', 'zh-hk': '埃及超級聯賽', 'zh-tw': '埃及超級聯賽',
      'es': 'Liga Premier Egipcia', 'de': 'Ägyptische Premier League', 'it': 'Premier League Egiziana', 'pt': 'Liga Premier Egípcia'
    },
    'Saudi Pro League': {
      'zh': '沙特職業聯賽', 'zh-hk': '沙特職業聯賽', 'zh-tw': '沙特職業聯賽',
      'es': 'Liga Profesional Saudí', 'de': 'Saudi Pro League', 'it': 'Lega Professionale Saudita', 'pt': 'Liga Profissional Saudita'
    },

    // UAE Super Cup
    'Super Cup': {
      'zh': '超級盃', 'zh-hk': '超級盃', 'zh-tw': '超級盃',
      'es': 'Supercopa', 'de': 'Super Cup', 'it': 'Supercoppa', 'pt': 'Supertaça'
    },

    // English Conference League
    'English Conference League': {
      'zh': '英格蘭協會聯賽', 'zh-hk': '英格蘭協會聯賽', 'zh-tw': '英格蘭協會聯賽',
      'es': 'Liga de la Conferencia Inglesa', 'de': 'Englische Conference League', 'it': 'Conference League Inglese', 'pt': 'Liga da Conferência Inglesa'
    },

    // French Cup
    'French Cup': {
      'zh': '法國盃', 'zh-hk': '法國盃', 'zh-tw': '法國盃',
      'es': 'Copa de Francia', 'de': 'Französischer Pokal', 'it': 'Coppa di Francia', 'pt': 'Taça de França'
    },

    // Spanish Cup
    'Spanish Cup': {
      'zh': '西班牙盃', 'zh-hk': '西班牙盃', 'zh-tw': '西班牙盃',
      'es': 'Copa de España', 'de': 'Spanischer Pokal', 'it': 'Coppa di Spagna', 'pt': 'Taça de Espanha'
    },

    // Saudi Arabia Cup
    'Saudi Arabia Cup': {
      'zh': '沙特阿拉伯盃', 'zh-hk': '沙特阿拉伯盃', 'zh-tw': '沙特阿拉伯盃',
      'es': 'Copa de Arabia Saudí', 'de': 'Saudi-Arabien Pokal', 'it': 'Coppa dell\'Arabia Saudita', 'pt': 'Taça da Arábia Saudita'
    },

    // Italian Cup
    'Italian Cup': {
      'zh': '意大利盃', 'zh-hk': '意大利盃', 'zh-tw': '意大利盃',
      'es': 'Copa de Italia', 'de': 'Italienischer Pokal', 'it': 'Coppa Italia', 'pt': 'Taça de Itália'
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
      'zh': '探索您喜愛的球隊和球員', 'zh-hk': '探索您喜愛的球隊和球員', 'zh-tw': '探索您喜愛的球隊和球員',
      'es': 'Explora Tus Equipos y Jugadores Favoritos', 'de': 'Entdecken Sie Ihre Lieblingsteams & Spieler', 'it': 'Esplora le Tue Squadre e Giocatori Preferiti', 'pt': 'Explore Seus Times e Jogadores Favoritos'
    },
    'Want to know how FC Barcelona, Real Madrid, or Manchester United are doing? Dive into the latest results, upcoming fixtures, league standings, breaking news, match highlights, and in-depth stats for top stars like Lionel Messi, Cristiano Ronaldo, and Lamine Yamal.': {
      'zh': '想了解巴塞罗那、皇家马德里或曼联的表现如何？深入了解最新结果、即将到来的赛程、联赛排名、突发新闻、比赛精彩瞬间，以及梅西、C罗和拉明·亚马尔等顶级球星的深度统计数据。',
      'zh-hk': '想了解巴塞隆拿、皇家馬德里或曼聯的表現如何？深入了解最新結果、即將到來的賽程、聯賽排名、突發新聞、比賽精彩瞬間，以及美斯、C朗和拉明·亞馬爾等頂級球星的深度統計數據。',
      'zh-tw': '想了解巴塞隆納、皇家馬德里或曼聯的表現如何？深入了解最新結果、即將到來的賽程、聯賽排名、突發新聞、比賽精彩瞬間，以及梅西、C羅和拉明·亞馬爾等頂級球星的深度統計數據。',
      'es': '¿Quieres saber cómo les va al FC Barcelona, Real Madrid o Manchester United? Sumérgete en los últimos resultados, próximos partidos, clasificaciones de liga, noticias de última hora, destacados de partidos y estadísticas detalladas de estrellas como Lionel Messi, Cristiano Ronaldo y Lamine Yamal.',
      'de': 'Möchten Sie wissen, wie es dem FC Barcelona, Real Madrid oder Manchester United geht? Tauchen Sie ein in die neuesten Ergebnisse, anstehende Spiele, Ligatabellen, aktuelle Nachrichten, Spielhighlights und detaillierte Statistiken von Topstars wie Lionel Messi, Cristiano Ronaldo und Lamine Yamal.',
      'it': 'Vuoi sapere come stanno andando FC Barcelona, Real Madrid o Manchester United? Immergiti negli ultimi risultati, prossime partite, classifiche di campionato, notizie dell\'ultima ora, highlights delle partite e statistiche approfondite di stelle come Lionel Messi, Cristiano Ronaldo e Lamine Yamal.',
      'pt': 'Quer saber como estão se saindo o FC Barcelona, Real Madrid ou Manchester United? Mergulhe nos últimos resultados, próximos jogos, classificações da liga, notícias de última hora, destaques de partidas e estatísticas detalhadas de estrelas como Lionel Messi, Cristiano Ronaldo e Lionel Messi.'
    },
    'Why Choose CS SPORT?': {
      'zh': '為什麼選擇CS SPORT？', 'zh-hk': '為什麼選擇CS SPORT？', 'zh-tw': '為什麼選擇CS SPORT？',
      'es': '¿Por Qué Elegir CS SPORT?', 'de': 'Warum CS SPORT wählen?', 'it': 'Perché Scegliere CS SPORT?', 'pt': 'Por Que Escolher CS SPORT?'
    },
    'All-in-One Platform: Get the latest news, fixtures, standings, results, and live scores for leagues, cups, and tournaments around the globe.': {
      'zh': '一體化平台：獲取全球聯賽、盃賽和錦標賽的最新新聞、賽程、排名、結果和即時比分。',
      'zh-hk': '一體化平台：獲取全球聯賽、盃賽和錦標賽的最新新聞、賽程、排名、結果和即時比分。',
      'zh-tw': '一體化平台：獲取全球聯賽、盃賽和錦標賽的最新新聞、賽程、排名、結果和即時比分。',
      'es': 'Plataforma Todo-en-Uno: Obtén las últimas noticias, partidos, clasificaciones, resultados y puntuaciones en vivo de ligas, copas y torneos de todo el mundo.',
      'de': 'All-in-One-Plattform: Erhalten Sie die neuesten Nachrichten, Spiele, Tabellen, Ergebnisse und Live-Ergebnisse für Ligen, Pokale und Turniere rund um den Globus.',
      'it': 'Piattaforma Tutto-in-Uno: Ottieni le ultime notizie, partite, classifiche, risultati e punteggi in diretta per campionati, coppe e tornei in tutto il mondo.',
      'pt': 'Plataforma Tudo-em-Um: Obtenha as últimas notícias, jogos, classificações, resultados e placares ao vivo de ligas, copas e torneios ao redor do mundo.'
    },
    'Track Your Favorites: Follow your teams and players, and never miss a moment.': {
      'zh': '追蹤您的最愛：關注您的球隊和球員，不錯過任何時刻。',
      'zh-hk': '追蹤您的最愛：關注您的球隊和球員，不錯過任何時刻。',
      'zh-tw': '追蹤您的最愛：關注您的球隊和球員，不錯過任何時刻。',
      'es': 'Sigue a Tus Favoritos: Sigue a tus equipos y jugadores, y nunca te pierdas un momento.',
      'de': 'Verfolgen Sie Ihre Favoriten: Folgen Sie Ihren Teams und Spielern und verpassen Sie keinen Moment.',
      'it': 'Segui i Tuoi Preferiti: Segui le tue squadre e giocatori, e non perdere mai un momento.',
      'pt': 'Acompanhe Seus Favoritos: Siga seus times e jogadores, e nunca perca um momento.'
    },
    'Smart Predictions: Use our insights and tips to make better Football predictions and outsmart your friends.': {
      'zh': '智能預測：使用我們的洞察和技巧做出更好的足球預測，智勝您的朋友。',
      'zh-hk': '智能預測：使用我們的洞察和技巧做出更好的足球預測，智勝您的朋友。',
      'zh-tw': '智能預測：使用我們的洞察和技巧做出更好的足球預測，智勝您的朋友。',
      'es': 'Predicciones Inteligentes: Usa nuestras ideas y consejos para hacer mejores predicciones de fútbol y superar a tus amigos.',
      'de': 'Intelligente Vorhersagen: Nutzen Sie unsere Erkenntnisse und Tipps, um bessere Fußball-Vorhersagen zu treffen und Ihre Freunde zu übertreffen.',
      'it': 'Previsioni Intelligenti: Usa le nostre intuizioni e consigli per fare migliori previsioni di calcio e superare i tuoi amici.',
      'pt': 'Previsões Inteligentes: Use nossas percepções e dicas para fazer melhores previsões de futebol e superar seus amigos.'
    },
    'Ready to experience Football like never before?': {
      'zh': '準備好以前所未有的方式體驗足球了嗎？',
      'zh-hk': '準備好以前所未有的方式體驗足球了嗎？',
      'zh-tw': '準備好以前所未有的方式體驗足球了嗎？',
      'es': '¿Listo para experimentar el fútbol como nunca antes?',
      'de': 'Bereit, Fußball wie nie zuvor zu erleben?',
      'it': 'Pronto a vivere il calcio come mai prima d\'ora?',
      'pt': 'Pronto para experimentar o futebol como nunca antes?'
    },
    'Start exploring now and join the CS SPORT community!': {
      'zh': '立即開始探索，加入CS SPORT社區！',
      'zh-hk': '立即開始探索，加入CS SPORT社區！',
      'zh-tw': '立即開始探索，加入CS SPORT社區！',
      'es': '¡Comienza a explorar ahora y únete a la comunidad CS SPORT!',
      'de': 'Beginnen Sie jetzt zu erkunden und treten Sie der CS SPORT-Community bei!',
      'it': 'Inizia a esplorare ora e unisciti alla comunità CS SPORT!',
      'pt': 'Comece a explorar agora e junte-se à comunidade CS SPORT!'
    },
    'Football Info': {
      'zh': '足球資訊', 'zh-hk': '足球資訊', 'zh-tw': '足球資訊',
      'es': 'Información de Fútbol', 'de': 'Fußball-Info', 'it': 'Info Calcio', 'pt': 'Info Futebol'
    },
    'Football FAQ': {
      'zh': '足球常見問題', 'zh-hk': '足球常見問題', 'zh-tw': '足球常見問題',
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
      'zh': '足球是在哪裡發明的？', 'zh-hk': '足球是在哪裡發明的？', 'zh-tw': '足球是在哪裡發明的？',
      'es': '¿Dónde se inventó el fútbol?', 'de': 'Wo wurde der Fußball erfunden?', 'it': 'Dove è stato inventato il calcio?', 'pt': 'Onde o futebol foi inventado?'
    },
    'The modern version of Football was born in England. Although similar games existed globally, it was in England where the rules were standardized, making it the home of modern Football.': {
      'zh': '现代足球诞生于英格兰。虽然全球都存在类似的游戏，但正是在英格兰规则得到了标准化，使其成为现代足球的故乡。',
      'zh-hk': '現代足球誕生於英格蘭。雖然全球都存在類似的遊戲，但正是在英格蘭規則得到了標準化，使其成為現代足球的故鄉。',
      'zh-tw': '現代足球誕生於英格蘭。雖然全球都存在類似的遊戲，但正是在英格蘭規則得到了標準化，使其成為現代足球的故鄉。',
      'es': 'La versión moderna del fútbol nació en Inglaterra. Aunque existían juegos similares a nivel mundial, fue en Inglaterra donde se estandarizaron las reglas, convirtiéndolo en el hogar del fútbol moderno.',
      'de': 'Die moderne Version des Fußballs wurde in England geboren. Obwohl ähnliche Spiele weltweit existierten, war es in England, wo die Regeln standardisiert wurden, was es zur Heimat des modernen Fußballs macht.',
      'it': 'La versione moderna del calcio è nata in Inghilterra. Sebbene giochi simili esistessero a livello globale, è stato in Inghilterra dove le regole sono state standardizzate, rendendola la casa del calcio moderno.',
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
      'zh': '德國', 'zh-hk': '德國', 'zh-tw': '德國',
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
      'zh': '歐洲', 'zh-hk': '歐洲', 'zh-tw': '歐洲',
      'es': 'Europa', 'de': 'Europa', 'it': 'Europa', 'pt': 'Europa'
    },
    'United Arab Emirates': {
      'zh': '阿拉伯聯合酋長國', 'zh-hk': '阿拉伯聯合酋長國', 'zh-tw': '阿拉伯聯合酋長國',
      'es': 'Emiratos Árabes Unidos', 'de': 'Vereinigte Arabische Emirate', 'it': 'Emirati Arabi Uniti', 'pt': 'Emirados Árabes Unidos'
    },
    'UAE': {
      'zh': '阿聯酋', 'zh-hk': '阿聯酋', 'zh-tw': '阿聯酋',
      'es': 'EAU', 'de': 'VAE', 'it': 'EAU', 'pt': 'EAU'
    },
    'Saudi Arabia': {
      'zh': '沙特阿拉伯', 'zh-hk': '沙特阿拉伯', 'zh-tw': '沙特阿拉伯',
      'es': 'Arabia Saudí', 'de': 'Saudi-Arabien', 'it': 'Arabia Saudita', 'pt': 'Arábia Saudita'
    },
    'Saudi': {
      'zh': '沙特', 'zh-hk': '沙特', 'zh-tw': '沙特',
      'es': 'Arabia Saudí', 'de': 'Saudi', 'it': 'Arabia', 'pt': 'Arábia'
    },
    'Egypt': {
      'zh': '埃及', 'zh-hk': '埃及', 'zh-tw': '埃及',
      'es': 'Egipto', 'de': 'Ägypten', 'it': 'Egitto', 'pt': 'Egito'
    }
  };

  // Initialize comprehensive country mappings from ALL_COUNTRIES
  private initializeComprehensiveCountryMappings(): { [key: string]: any } {
    const mappings: { [key: string]: any } = {};

    // Process all countries from countriesAndLeagues.ts
    ALL_COUNTRIES.forEach(country => {
      // Use existing COUNTRY_TRANSLATIONS if available
      const existingTranslation = COUNTRY_TRANSLATIONS[country.name];
      if (existingTranslation) {
        mappings[country.name] = existingTranslation;
        // Also map by country code
        if (country.code) {
          mappings[country.code] = existingTranslation;
        }
      } else {
        // Generate basic mapping for countries not in COUNTRY_TRANSLATIONS
        mappings[country.name] = this.generateBasicCountryMapping(country.name);
        if (country.code) {
          mappings[country.code] = mappings[country.name];
        }
      }

      // Handle name variations
      const variations = this.generateCountryNameVariations(country.name);
      variations.forEach(variation => {
        if (!mappings[variation]) {
          mappings[variation] = mappings[country.name];
        }
      });
    });

    return mappings;
  }

  // Generate country name variations for better matching
  private generateCountryNameVariations(countryName: string): string[] {
    const variations = [countryName];

    // Common variations
    const variationMap: { [key: string]: string[] } = {
      'United States': ['USA', 'United States of America', 'US'],
      'United Kingdom': ['UK', 'Britain', 'Great Britain'],
      'Bosnia and Herzegovina': ['Bosnia-Herzegovina', 'Bosnia & Herzegovina'],
      'Trinidad and Tobago': ['Trinidad & Tobago'],
      'Saint Kitts and Nevis': ['St. Kitts and Nevis'],
      'Saint Lucia': ['St. Lucia'],
      'Saint Vincent and the Grenadines': ['St. Vincent and the Grenadines'],
      'São Tomé and Príncipe': ['Sao Tome and Principe'],
      'Democratic Republic of the Congo': ['DR Congo', 'Congo DR'],
      'Republic of the Congo': ['Congo', 'Congo Republic'],
      'Czech Republic': ['Czechia'],
      'North Macedonia': ['Macedonia'],
      'South Korea': ['Korea Republic', 'Korea'],
      'North Korea': ['Korea DPR'],
      'Chinese Taipei': ['Taiwan'],
      'Hong Kong': ['Hong Kong SAR']
    };

    if (variationMap[countryName]) {
      variations.push(...variationMap[countryName]);
    }

    return variations;
  }

  // Generate basic country mapping for countries not in manual translations
  private generateBasicCountryMapping(countryName: string): any {
    // This is a simplified mapping - you can enhance this based on your needs
    return {
      zh: countryName, // Fallback to original name
      'zh-hk': countryName,
      'zh-tw': countryName,
      es: countryName,
      de: countryName,
      it: countryName,
      pt: countryName
    };
  }

  // Initialize league mappings from MAJOR_LEAGUES
  private initializeLeagueMappings(): void {
    console.log(`🏆 [SmartLeagueCountryTranslation] Initializing ${MAJOR_LEAGUES.length} major league mappings...`);

    let newLeagueMappings = 0;
    MAJOR_LEAGUES.forEach(league => {
      const leagueName = league.name;
      const countryName = league.country;

      // Skip if we already have this mapping
      if (this.learnedLeagueMappings.has(leagueName)) {
        return;
      }

      // Generate mapping for this league
      const mapping = this.generateLeagueMapping(leagueName, countryName);
      if (mapping) {
        this.learnedLeagueMappings.set(leagueName, mapping);
        newLeagueMappings++;

        console.log(`🏆 [League Mapping] Added: "${leagueName}" (${countryName})`);
      }

      // Handle league name variations
      const variations = this.generateLeagueNameVariations(leagueName);
      variations.forEach(variation => {
        if (!this.learnedLeagueMappings.has(variation)) {
          const varMapping = this.generateLeagueMapping(variation, countryName);
          if (varMapping) {
            this.learnedLeagueMappings.set(variation, varMapping);
            newLeagueMappings++;
          }
        }
      });
    });

    if (newLeagueMappings > 0) {
      this.saveLearnedMappings();
      console.log(`🏆 [League Mappings] Successfully initialized ${newLeagueMappings} league mappings from major leagues`);
    }
  }

  // Generate league name variations for better matching
  private generateLeagueNameVariations(leagueName: string): string[] {
    const variations = [];

    // Common league name variations
    const variationMap: { [key: string]: string[] } = {
      'Premier League': ['English Premier League', 'EPL'],
      'La Liga': ['LaLiga', 'Spanish La Liga', 'Primera División'],
      'Serie A': ['Italian Serie A'],
      'Bundesliga': ['German Bundesliga'],
      'Ligue 1': ['French Ligue 1', 'Ligue 1 Uber Eats'],
      'UEFA Champions League': ['Champions League', 'UCL'],
      'UEFA Europa League': ['Europa League', 'UEL'],
      'UEFA Europa Conference League': ['Conference League', 'UECL'],
      'FIFA World Cup': ['World Cup', 'WC'],
      'Copa Libertadores': ['CONMEBOL Libertadores'],
      'Copa Sudamericana': ['CONMEBOL Sudamericana']
    };

    if (variationMap[leagueName]) {
      variations.push(...variationMap[leagueName]);
    }

    // Generic variations
    if (leagueName.includes('Cup')) {
      variations.push(leagueName.replace('Cup', 'Tournament'));
    }
    if (leagueName.includes('League')) {
      variations.push(leagueName.replace('League', 'Championship'));
    }

    return variations;
  }


  private clearCache() {
    this.leagueCache.clear();
    this.countryCache.clear();
    this.translationCache.clear();
    // Also clear any localStorage cache that might be interfering
    try {
      localStorage.removeItem('leagueTranslationCache');
      localStorage.removeItem('countryTranslationCache');
    } catch (error) {
      // Ignore localStorage errors
    }
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
        const mappings = JSON.Parse(storedLeagues);
        this.learnedLeagueMappings = new Map(Object.entries(mappings));
        console.log(`🎓 [SmartLeagueCountryTranslation] Loaded ${this.learnedLeagueMappings.size} learned league mappings`);
      }

      if (storedCountries) {
        const mappings = JSON.Parse(storedCountries);
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

  // Auto-learn from any country name for better translations
  autoLearnFromAnyCountryName(countryName: string, options: {
    leagueContext?: string;
    occurrenceCount?: number;
    originalName?: string;
    fixtureContext?: boolean;
    normalizedName?: string;
    preferredTranslation?: string; // Added preferred translation option
    language?: string; // Added language for preferred translation
  } = {}): void {
    if (!countryName || typeof countryName !== 'string') return;

    const cleanName = countryName.trim();
    if (!cleanName || cleanName === 'Unknown') return;

    // Check if we already have this country mapping in popularCountries or learned mappings
    const hasPopularMapping = this.popularCountries[cleanName];
    const hasLearnedMapping = this.learnedCountryMappings.has(cleanName);

    if (!hasPopularMapping && !hasLearnedMapping) {
      const mapping = this.generateCountryMapping(cleanName);
      if (mapping) {
        this.learnedCountryMappings.set(cleanName, mapping);
        this.saveLearnedMappings();
        console.log(`🎓 [SmartLeagueCountryTranslation] Auto-learned country mapping for: ${cleanName}`);
      }
    }

    // Store in automated mappings for future reference
    const existingAutomated = this.automatedCountryMappings.get(cleanName) || {};
    this.automatedCountryMappings.set(cleanName, {
      ...existingAutomated,
      leagueContext: options.leagueContext || existingAutomated.leagueContext,
      occurrenceCount: (existingAutomated.occurrenceCount || 0) + (options.occurrenceCount || 1),
      lastSeen: Date.now(),
      preferredTranslation: options.preferredTranslation || existingAutomated.preferredTranslation, // Store preferred translation
      language: options.language || existingAutomated.language // Store language for preferred translation
    });

    // If a preferred translation is provided, create/update the learned mapping immediately
    if (options.preferredTranslation && options.language) {
      const existingMapping = this.learnedCountryMappings.get(cleanName) || this.createEmptyCountryMapping(cleanName);
      existingMapping[options.language as keyof typeof existingMapping] = options.preferredTranslation;
      this.learnedCountryMappings.set(cleanName, existingMapping);

      console.log(`📖 [Enhanced Country Learning] Learned preferred translation: "${cleanName}" → "${options.preferredTranslation}" (${options.language})`);
    }
  }

  // Auto-learn from any league name for better translations
  autoLearnFromAnyLeagueName(leagueName: string, options: { countryName?: string; leagueId?: number } = {}): void {
    if (!leagueName || typeof leagueName !== 'string') return;

    const cleanName = leagueName.trim();
    if (!cleanName) return;

    // Immediately detect and learn mixed language leagues
    const isMixedLanguage = this.detectMixedLanguageLeague(cleanName);
    const isChinese = /[\u4e00-\u9fff]/.test(cleanName);

    // Priority learning for problematic names
    if (isMixedLanguage || isChinese || this.isProblematicLeagueName(cleanName)) {
      console.log(`🚀 [Priority Learning] Detected problematic league: "${cleanName}"`);

      // Force generate mapping even if one exists but is incomplete
      const existingMapping = this.learnedLeagueMappings.get(cleanName);
      const newMapping = this.generateLeagueMapping(cleanName, options.countryName || '');

      if (newMapping && (!existingMapping || this.shouldUpdateMapping(existingMapping, newMapping))) {
        this.learnedLeagueMappings.set(cleanName, newMapping);
        this.saveLearnedMappings();
        console.log(`🎯 [Auto-Fix] Learned/updated mapping for: ${cleanName}`);
      }
    }
    // Regular learning for other leagues
    else if (!this.learnedLeagueMappings.has(cleanName)) {
      const mapping = this.generateLeagueMapping(cleanName, options.countryName);
      if (mapping) {
        this.learnedLeagueMappings.set(cleanName, mapping);
        this.saveLearnedMappings();
        console.log(`🎓 [SmartLeagueCountryTranslation] Auto-learned league mapping for: ${cleanName}`);
      }
    }

    // Store in automated mappings for future reference
    const existingAutomated = this.automatedLeagueMappings.get(cleanName) || {};
    this.automatedLeagueMappings.set(cleanName, {
      ...existingAutomated,
      countryName: options.countryName || existingAutomated.countryName,
      leagueId: options.leagueId || existingAutomated.leagueId,
      lastSeen: Date.now()
    });
  }

  // Check if a league name is problematic and needs immediate attention
  private isProblematicLeagueName(leagueName: string): boolean {
    const problematicPatterns = [
      'CONMEBOL南美', 'CONMEBOL自由', 'AFC盃', 'UEFA超級', '世界聯賽',
      'Netherlands聯賽', 'Australia超级', '阿根廷', 'Copa Argentina'
    ];

    return problematicPatterns.some(pattern =>
      leagueName.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  // Enhanced league learning with mixed language detection
  massLearnFromFixtures(fixtures: any[]): void {
    let newLeagueMappings = 0;
    let newCountryMappings = 0;
    let updatedMappings = 0;
    let chineseCountriesDetected = 0;
    let mixedLanguageLeagues = 0;

    const uniqueCountries = new Set<string>();
    const chineseCountries = new Set<string>();
    const mixedLeagueNames = new Set<string>();

    fixtures.forEach(fixture => {
      if (!fixture?.league) return;

      const leagueName = fixture.league.name;
      const countryName = fixture.league.country;

      // Collect unique countries for analysis
      if (countryName && countryName.trim()) {
        uniqueCountries.add(countryName.trim());

        // Detect Chinese country names
        if (this.chineseToEnglishMap[countryName.trim()]) {
          chineseCountries.add(countryName.trim());
          chineseCountriesDetected++;
        }
      }

      // Enhanced league learning with mixed language detection
      if (leagueName) {
        // Detect mixed language league names (like "Bulgaria聯賽")
        const isMixedLanguage = this.detectMixedLanguageLeague(leagueName);
        if (isMixedLanguage) {
          mixedLeagueNames.add(leagueName);
          mixedLanguageLeagues++;
        }

        const existingMapping = this.learnedLeagueMappings.get(leagueName);
        const newMapping = this.generateLeagueMapping(leagueName, countryName || '');

        if (!existingMapping && newMapping) {
          this.learnedLeagueMappings.set(leagueName, newMapping);
          newLeagueMappings++;

          if (isMixedLanguage) {
            console.log(`🔄 [Mixed Language Fix] Auto-learned: "${leagueName}" with proper translations`);
          }
        } else if (existingMapping && newMapping && this.shouldUpdateMapping(existingMapping, newMapping)) {
          this.learnedLeagueMappings.set(leagueName, newMapping);
          updatedMappings++;
        }
      }

      // Enhanced country learning with Chinese detection
      if (countryName) {
        const normalizedCountry = this.detectAndNormalizeCountryName(countryName);

        // Learn both original and normalized country names
        [countryName, normalizedCountry].forEach(name => {
          if (name && !this.learnedCountryMappings.has(name)) {
            const mapping = this.generateCountryMapping(name);
            if (mapping) {
              this.learnedCountryMappings.set(name, mapping);
              newCountryMappings++;
            }
          }
        });
      }
    });

    // Log comprehensive analysis
    console.log(`🔍 [Enhanced Analysis] Countries: ${uniqueCountries.size} (${chineseCountries.size} Chinese), Mixed leagues: ${mixedLanguageLeagues}`);

    if (mixedLeagueNames.size > 0) {
      console.log(`🔧 [Mixed Language Leagues]:`, Array.from(mixedLeagueNames).slice(0, 5).join(', ') + (mixedLeagueNames.size > 5 ? '...' : ''));
    }

    if (newLeagueMappings > 0 || newCountryMappings > 0 || updatedMappings > 0) {
      this.saveLearnedMappings();
      console.log(`📖 [Enhanced Learning] Leagues: +${newLeagueMappings}, Countries: +${newCountryMappings}, Updated: ${updatedMappings}, Mixed Fixed: ${mixedLanguageLeagues}`);
    }
  }

  // Batch process and learn from all countries in fixtures for immediate improvement
  massLearnCountriesFromFixtures(fixtures: any[]): void {
    console.log(`🚀 [Mass Learning] Processing ${fixtures.length} fixtures for comprehensive country detection...`);

    const allCountries = new Set<string>();
    const chineseDetected = new Set<string>();
    const missingTranslations = new Set<string>();

    // Collect all unique country names
    fixtures.forEach(fixture => {
      if (fixture?.league?.country) {
        const country = fixture.league.country.trim();
        allCountries.add(country);

        if (this.chineseToEnglishMap[country]) {
          chineseDetected.add(country);
        }
      }
    });

    let newlyLearned = 0;
    // Process each unique country
    allCountries.forEach(country => {
      const normalizedCountry = this.detectAndNormalizeCountryName(country);

      // Check if we have translation coverage
      const hasPopularMapping = this.popularCountries[normalizedCountry];
      const hasLearnedMapping = this.learnedCountryMappings.has(normalizedCountry);

      if (!hasPopularMapping && !hasLearnedMapping) {
        // Generate mapping for missing countries
        const mapping = this.generateCountryMapping(normalizedCountry);
        if (mapping) {
          this.learnedCountryMappings.set(normalizedCountry, mapping);
          newlyLearned++;
        }
        missingTranslations.add(normalizedCountry);
      }
    });

    if (newlyLearned > 0) {
      this.saveLearnedMappings();
    }

    console.log(`📊 [Mass Learning Results]:`);
    console.log(`   • Total countries found: ${allCountries.size}`);
    console.log(`   • Chinese countries: ${chineseDetected.size}`);
    console.log(`   • Missing translations: ${missingTranslations.size}`);
    console.log(`   • Newly learned: ${newlyLearned}`);

    if (missingTranslations.size > 0) {
      console.log(`⚠️ [Countries needing attention]:`, Array.from(missingTranslations).slice(0, 10).join(', '));
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

  // Helper to create an empty country mapping structure
  private createEmptyCountryMapping(countryName: string): CountryTranslation {
    return {
      en: countryName,
      es: countryName,
      de: countryName,
      it: countryName,
      pt: countryName,
      zh: countryName,
      'zh-hk': countryName,
      'zh-tw': countryName
    };
  }

  // Detect mixed language league names (e.g., "Bulgaria聯賽")
  private detectMixedLanguageLeague(leagueName: string): boolean {
    if (!leagueName) return false;

    // Check for mixed English/Chinese patterns
    const hasChinese = /[\u4e00-\u9fff]/.test(leagueName);
    const hasLatin = /[a-zA-Z]/.test(leagueName);

    // Enhanced mixed patterns to catch more cases
    const mixedPatterns = [
      /^[a-zA-Z\s]+[聯联]賽?$/,           // "Bulgaria聯賽", "Netherlands联赛"
      /^[a-zA-Z\s]+超级?[聯联]賽?$/,       // "Australia超级联赛"
      /^[a-zA-Z\s]+甲级?[聯联]賽?$/,       // Country + 甲级联赛
      /^[a-zA-Z\s]+乙级?[聯聯]賽?$/,       // Country + 乙级联赛
      /^[a-zA-Z\s]+丙级?[聯联]賽?$/,       // Country + 丙级联赛
      /^[a-zA-Z\s]+盃?$/,                // Country + 盃
      /^[a-zA-Z\s]+杯?$/,                // Country + 杯
      /^[a-zA-Z\s]+冠军?[聯联]賽?$/,       // Country + 冠军联赛
      /^[a-zA-Z\s]+职业?[聯联]賽?$/,       // Country + 职业联赛
      /^[a-zA-Z\s]+足球?[聯联]賽?$/,       // Country + 足球联赛
      /^[a-zA-Z\s]+青年?[聯联]賽?$/,       // Country + 青年联赛
      /^[a-zA-Z\s]+女子?[聯联]賽?$/,       // Country + 女子联赛
    ];

    // Also check for any country name followed by Chinese league terms
    const chineseLeagueTerms = ['聯賽', '联赛', '超級聯賽', '超级联赛', '甲級聯賽', '甲级联赛', '乙級聯賽', '乙级联赛', '盃', '杯', '冠軍聯賽', '冠军联赛'];
    const hasChineseLeagueTerm = chineseLeagueTerms.some(term => leagueName.includes(term));

    return hasChinese && hasLatin && (mixedPatterns.some(pattern => pattern.test(leagueName)) || hasChineseLeagueTerm);
  }

  // Generate best translation for a league name
  private generateBestTranslation(leagueName: string, countryName: string, language: string): string {
    // First try the core league mapping generation
    const mapping = this.generateLeagueMapping(leagueName, countryName);
    if (mapping && mapping[language]) {
      return mapping[language];
    }

    // Try mixed language mapping if applicable
    if (this.detectMixedLanguageLeague(leagueName)) {
      const mixedMapping = this.generateMixedLanguageMapping(leagueName, countryName);
      if (mixedMapping && mixedMapping[language]) {
        return mixedMapping[language];
      }
    }

    // Try intelligent mapping
    const intelligentMapping = this.generateIntelligentMapping(leagueName, countryName);
    if (intelligentMapping && intelligentMapping[language]) {
      return intelligentMapping[language];
    }

    // Return original if no translation found
    return leagueName;
  }

  // Generate mappings for mixed language league names
  private generateMixedLanguageMapping(leagueName: string, countryName: string): LeagueTranslation | null {
    const translations: any = {};

    // Extract country from the league name, handle hyphenated countries
    const countryMatch = leagueName.match(/^([a-zA-Z\s-]+)/);
    let extractedCountry = countryMatch ? countryMatch[1].trim() : countryName;

    // Handle specific hyphenated countries
    if (extractedCountry === 'Czech-Republic') {
      extractedCountry = 'Czech Republic';
    } else if (extractedCountry === 'Dominican-Republic') {
      extractedCountry = 'Dominican Republic';
    }

    // Use provided country name if available, otherwise use extracted
    const finalCountry = countryName || extractedCountry;

    // Get country translations using the final country name
    const countryZh = this.translateCountryName(finalCountry, 'zh');
    const countryZhHk = this.translateCountryName(finalCountry, 'zh-hk');
    const countryZhTw = this.translateCountryName(finalCountry, 'zh-tw');
    const countryEs = this.translateCountryName(finalCountry, 'es');
    const countryDe = this.translateCountryName(finalCountry, 'de');
    const countryIt = this.translateCountryName(finalCountry, 'it');
    const countryPt = this.translateCountryName(finalCountry, 'pt');

    // Detect league type from Chinese part
    if (leagueName.includes('聯賽') || leagueName.includes('联赛')) {
      // League/Championship
      translations.en = `${finalCountry} League`;
      translations.zh = `${countryZh}联赛`;
      translations['zh-hk'] = `${countryZhHk}聯賽`;
      translations['zh-tw'] = `${countryZhTw}聯賽`;
      translations.es = `Liga de ${countryEs}`;
      translations.de = `${countryDe} Liga`;
      translations.it = `Lega ${countryIt}`;
      translations.pt = `Liga de ${countryPt}`;
    } else if (leagueName.includes('超级联赛') || leagueName.includes('超級聯賽')) {
      // Super League
      translations.en = `${extractedCountry} Super League`;
      translations.zh = `${countryZh}超级联赛`;
      translations['zh-hk'] = `${countryZhHk}超級聯賽`;
      translations['zh-tw'] = `${countryZhTw}超級聯賽`;
      translations.es = `Superliga de ${countryEs}`;
      translations.de = `${countryDe} Superliga`;
      translations.it = `Superlega ${countryIt}`;
      translations.pt = `Superliga de ${countryPt}`;
    } else if (leagueName.includes('甲级联赛') || leagueName.includes('甲級聯賽')) {
      // First Division
      translations.en = `${extractedCountry} First Division`;
      translations.zh = `${countryZh}甲级联赛`;
      translations['zh-hk'] = `${countryZhHk}甲級聯賽`;
      translations['zh-tw'] = `${countryZhTw}甲級聯賽`;
      translations.es = `Primera División de ${countryEs}`;
      translations.de = `${countryDe} Erste Liga`;
      translations.it = `Prima Divisione ${countryIt}`;
      translations.pt = `Primeira Divisão de ${countryPt}`;
    } else if (leagueName.includes('盃') || leagueName.includes('杯')) {
      // Cup
      translations.en = `${extractedCountry} Cup`;
      translations.zh = `${countryZh}杯`;
      translations['zh-hk'] = `${countryZhHk}盃`;
      translations['zh-tw'] = `${countryZhTw}盃`;
      translations.es = `Copa de ${countryEs}`;
      translations.de = `${countryDe} Pokal`;
      translations.it = `Coppa ${countryIt}`;
      translations.pt = `Taça de ${countryPt}`;
    }

    // Ensure all languages have defaults
    translations.es = translations.es || `Liga de ${extractedCountry}`;
    translations.de = translations.de || `${extractedCountry} Liga`;
    translations.it = translations.it || `Lega ${extractedCountry}`;
    translations.pt = translations.pt || `Liga de ${countryPt}`;
    translations.zh = translations.zh || `${countryZh}联赛`;
    translations['zh-hk'] = translations['zh-hk'] || `${countryZhHk}聯賽`;
    translations['zh-tw'] = translations['zh-tw'] || `${countryZhTw}聯賽`;

    return translations as LeagueTranslation;
  }

  // Generate mappings using pattern recognition
  private generateIntelligentMapping(leagueName: string, countryName: string): LeagueTranslation | null {
    const translations: any = { en: leagueName };
    const lowerName = leagueName.toLowerCase();

    // Get country translations
    const countryZh = this.translateCountryName(countryName, 'zh');
    const countryZhHk = this.translateCountryName(countryName, 'zh-hk');
    const countryZhTw = this.translateCountryName(countryName, 'zh-tw');

    // Intelligent pattern matching
    if (lowerName.includes('serie') && lowerName.includes('b')) {
      translations.zh = `${countryZh}乙级联赛`;
      translations['zh-hk'] = `${countryZhHk}乙級聯賽`;
      translations['zh-tw'] = `${countryZhTw}乙級聯賽`;
      translations.es = `Serie B de ${countryName}`;
      translations.de = `Serie B ${countryName}`;
      translations.it = `Serie B`;
      translations.pt = `Série B de ${countryName}`;
    } else if (lowerName.includes('serie') && lowerName.includes('c')) {
      translations.zh = `${countryZh}丙级联赛`;
      translations['zh-hk'] = `${countryZhHk}丙級聯賽`;
      translations['zh-tw'] = `${countryZhTw}丙級聯賽`;
      translations.es = `Serie C de ${countryName}`;
      translations.de = `Serie C ${countryName}`;
      translations.it = `Serie C`;
      translations.pt = `Série C de ${countryName}`;
    } else if (lowerName.includes('primera') && lowerName.includes('a')) {
      translations.zh = `${countryZh}甲级联赛`;
      translations['zh-hk'] = `${countryZhHk}甲級聯賽`;
      translations['zh-tw'] = `${countryZhTw}甲級聯賽`;
      translations.es = `Primera A`;
      translations.de = `Primera A ${countryName}`;
      translations.it = `Primera A`;
      translations.pt = `Primeira A de ${countryName}`;
    } else if (lowerName.includes('primera') && lowerName.includes('b')) {
      translations.zh = `${countryZh}乙级联赛`;
      translations['zh-hk'] = `${countryZhHk}乙級聯賽`;
      translations['zh-tw'] = `${countryZhTw}乙級聯賽`;
      translations.es = `Primera B`;
      translations.de = `Primera B ${countryName}`;
      translations.it = `Primera B`;
      translations.pt = `Primeira B de ${countryName}`;
    } else if (lowerName.includes('copa') && lowerName.includes('paulista')) {
      translations.zh = `保利斯塔杯`;
      translations['zh-hk'] = `保利斯塔盃`;
      translations['zh-tw'] = `保利斯塔盃`;
      translations.es = `Copa Paulista`;
      translations.de = `Copa Paulista`;
      translations.it = `Copa Paulista`;
      translations.pt = `Copa Paulista`;
    } else if (lowerName.includes('paulista') && lowerName.includes('u20')) {
      translations.zh = `保利斯塔U20联赛`;
      translations['zh-hk'] = `保利斯塔U20聯賽`;
      translations['zh-tw'] = `保利斯塔U20聯賽`;
      translations.es = `Paulista U20`;
      translations.de = `Paulista U20`;
      translations.it = `Paulista U20`;
      translations.pt = `Paulista U20`;
    } else if (lowerName.includes('capixaba') && lowerName.includes('b')) {
      translations.zh = `卡皮沙巴乙级联赛`;
      translations['zh-hk'] = `卡皮沙巴乙級聯賽`;
      translations['zh-tw'] = `卡皮沙巴乙級聯賽`;
      translations.es = `Capixaba B`;
      translations.de = `Capixaba B`;
      translations.it = `Capixaba B`;
      translations.pt = `Capixaba B`;
    }

    // Set defaults if no specific pattern matched
    translations.es = translations.es || leagueName;
    translations.de = translations.de || leagueName;
    translations.it = translations.it || leagueName;
    translations.pt = translations.pt || leagueName;
    translations.zh = translations.zh || `${countryZh}联赛`;
    translations['zh-hk'] = translations['zh-hk'] || `${countryZhHk}聯賽`;
    translations['zh-tw'] = translations['zh-tw'] || `${countryZhTw}聯賽`;

    return translations as LeagueTranslation;
  }

  private generateLeagueMapping(leagueName: string, countryName: string): LeagueTranslation | null {
    // First normalize the league name by expanding abbreviations
    let normalizedLeagueName = leagueName;
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

    for (const [abbrev, expansion] of Object.entries(abbreviationExpansions)) {
      const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
      if (regex.test(normalizedLeagueName) && !normalizedLeagueName.toLowerCase().includes(expansion.toLowerCase())) {
        normalizedLeagueName = normalizedLeagueName.replace(regex, expansion);
      }
    }

    // Generate basic translations based on comprehensive patterns
    const translations: any = { en: normalizedLeagueName };
    const lowerName = normalizedLeagueName.toLowerCase();

    // Check if league name contains abbreviations that need expansion
    // (This part is handled above by creating normalizedLeagueName)

    // Enhanced comprehensive league pattern matching
    if (lowerName.includes('premier league') || lowerName.endsWith(' pl') || lowerName === 'pl') {
      const countryZh = this.translateCountryName(countryName, 'zh');
      const baseCountryZh = countryZh || this.detectCountryFromLeagueName(normalizedLeagueName);
      translations.zh = `${baseCountryZh}超级联赛`;
      translations['zh-hk'] = `${this.translateCountryName(countryName, 'zh-hk') || baseCountryZh}超級聯賽`;
      translations['zh-tw'] = `${this.translateCountryName(countryName, 'zh-tw') || baseCountryZh}超級聯賽`;
      translations.es = `Liga Premier ${countryName ? 'de ' + countryName : ''}`;
      translations.de = `${countryName || ''} Premier League`;
      translations.it = `Premier League ${countryName ? 'di ' + countryName : ''}`;
      translations.pt = `Liga Premier ${countryName ? 'do ' + countryName : ''}`;
    }
    // Specific league name patterns from the screenshot
    else if (lowerName === 'primera nacional') {
      translations.zh = '全国甲级联赛'; translations['zh-hk'] = '全國甲級聯賽'; translations['zh-tw'] = '全國甲級聯賽';
      translations.es = 'Primera Nacional'; translations.de = 'Primera Nacional'; translations.it = 'Primera Nacional'; translations.pt = 'Primera Nacional';
    } else if (lowerName === 'primera c') {
      translations.zh = 'C级联赛'; translations['zh-hk'] = 'C級聯賽'; translations['zh-tw'] = 'C級聯賽';
      translations.es = 'Primera C'; translations.de = 'Primera C'; translations.it = 'Primera C'; translations.pt = 'Primera C';
    } else if (lowerName.includes('netherlands') && lowerName.includes('联赛')) {
      translations.en = 'Netherlands League'; translations.es = 'Liga de Países Bajos'; translations.de = 'Niederländische Liga';
      translations.it = 'Lega Olandese'; translations.pt = 'Liga dos Países Baixos';
    } else if (lowerName === 'capital territory npl') {
      translations.zh = '首都地区国家联赛'; translations['zh-hk'] = '首都地區國家聯賽'; translations['zh-tw'] = '首都地區國家聯賽';
      translations.es = 'Liga Nacional del Territorio de la Capital'; translations.de = 'Capital Territory National Premier League';
      translations.it = 'Lega Nazionale del Territorio della Capitale'; translations.pt = 'Liga Nacional do Território da Capital';
    } else if (lowerName.includes('australia') && lowerName.includes('超级联赛')) {
      translations.en = 'Australia Super League'; translations.es = 'Superliga de Australia'; translations.de = 'Australische Superliga';
      translations.it = 'Superlega Australiana'; translations.pt = 'Superliga da Austrália';
    } else if (lowerName === 'western australia npl') {
      translations.zh = '西澳大利亚国家联赛'; translations['zh-hk'] = '西澳大利亞國家聯賽'; translations['zh-tw'] = '西澳大利亞國家聯賽';
      translations.es = 'Liga Nacional de Australia Occidental'; translations.de = 'Western Australia National Premier League';
      translations.it = 'Lega Nazionale dell\'Australia Occidentale'; translations.pt = 'Liga Nacional da Austrália Ocidental';
    } else if (lowerName === 'new south wales npl 2') {
      translations.zh = '新南威尔士国家联赛2'; translations['zh-hk'] = '新南威爾士國家聯賽2'; translations['zh-tw'] = '新南威爾士國家聯賽2';
      translations.es = 'Liga Nacional de Nueva Gales del Sur 2'; translations.de = 'New South Wales National Premier League 2';
      translations.it = 'Lega Nazionale del Nuovo Galles del Sud 2'; translations.pt = 'Liga Nacional de Nova Gales do Sul 2';
    } else if (lowerName === 'australia cup') {
      translations.zh = '澳大利亚杯'; translations['zh-hk'] = '澳洲盃'; translations['zh-tw'] = '澳洲盃';
      translations.es = 'Copa de Australia'; translations.de = 'Australia Cup'; translations.it = 'Coppa d\'Australia'; translations.pt = 'Taça da Austrália';
    } else if (lowerName.includes('australia') && lowerName.includes('联赛')) {
      translations.en = 'Australia League'; translations.es = 'Liga de Australia'; translations.de = 'Australische Liga';
      translations.it = 'Lega Australiana'; translations.pt = 'Liga da Austrália';
    }
    // Handle pure Chinese league names
    else if (lowerName === '世界聯賽' || lowerName === '世界联赛') {
      translations.en = 'World Cup';
      translations.zh = '世界杯'; translations['zh-hk'] = '世界盃'; translations['zh-tw'] = '世界盃';
      translations.es = 'Copa del Mundo'; translations.de = 'Weltmeisterschaft';
      translations.it = 'Coppa del Mondo'; translations.pt = 'Copa do Mundo';
    } else if (lowerName === '阿根廷') {
      translations.en = 'Argentina Primera División';
      translations.zh = '阿根廷甲级联赛'; translations['zh-hk'] = '阿根廷甲級聯賽'; translations['zh-tw'] = '阿根廷甲級聯賽';
      translations.es = 'Primera División Argentina'; translations.de = 'Primera División Argentinien';
      translations.it = 'Primera División Argentina'; translations.pt = 'Primeira Divisão Argentina';
    } else if (lowerName.includes('甲级联赛') || lowerName.includes('甲級聯賽')) {
      // Handle existing Chinese league names
      if (lowerName.includes('德國')) {
        translations.en = 'Bundesliga';
        translations.es = 'Bundesliga';
        translations.de = 'Bundesliga';
        translations.it = 'Bundesliga';
        translations.pt = 'Bundesliga';
      } else if (lowerName.includes('意大利')) {
        translations.en = 'Serie A';
        translations.es = 'Serie A';
        translations.de = 'Serie A';
        translations.it = 'Serie A';
        translations.pt = 'Serie A';
      } else if (lowerName.includes('西班牙')) {
        translations.en = 'La Liga';
        translations.es = 'La Liga';
        translations.de = 'La Liga';
        translations.it = 'La Liga';
        translations.pt = 'La Liga';
      } else if (lowerName.includes('英格蘭') || lowerName.includes('英国')) {
        translations.en = 'Premier League';
        translations.es = 'Premier League';
        translations.de = 'Premier League';
        translations.it = 'Premier League';
        translations.pt = 'Premier League';
      }
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

    // CONMEBOL Competitions - Enhanced Pattern Recognition with exact matches
    else if (lowerName.includes('conmebol libertadores') || lowerName.includes('copa libertadores') || lowerName === 'libertadores' || lowerName.includes('conmebol自由') || lowerName.includes('自由盃')) {
      translations.en = 'CONMEBOL Libertadores';
      translations.zh = 'CONMEBOL自由杯'; translations['zh-hk'] = 'CONMEBOL自由盃'; translations['zh-tw'] = 'CONMEBOL自由盃';
      translations.es = 'CONMEBOL Libertadores'; translations.de = 'CONMEBOL Libertadores';
      translations.it = 'CONMEBOL Libertadores'; translations.pt = 'CONMEBOL Libertadores';
    } else if (lowerName.includes('conmebol sudamericana') || lowerName.includes('copa sudamericana') || lowerName === 'sudamericana' || lowerName.includes('conmebol南美') || lowerName.includes('南美盃')) {
      translations.en = 'CONMEBOL Sudamericana';
      translations.zh = 'CONMEBOL南美杯'; translations['zh-hk'] = 'CONMEBOL南美盃'; translations['zh-tw'] = 'CONMEBOL南美盃';
      translations.es = 'CONMEBOL Sudamericana'; translations.de = 'CONMEBOL Sudamericana';
      translations.it = 'CONMEBOL Sudamericana'; translations.pt = 'CONMEBOL Sudamericana';
    } else if (lowerName.includes('conmebol recopa') || lowerName.includes('recopa sudamericana')) {
      translations.en = 'CONMEBOL Recopa Sudamericana';
      translations.zh = 'CONMEBOL再杯'; translations['zh-hk'] = 'CONMEBOL再盃'; translations['zh-tw'] = 'CONMEBOL再盃';
      translations.es = 'CONMEBOL Recopa'; translations.de = 'CONMEBOL Recopa';
      translations.it = 'CONMEBOL Recopa'; translations.pt = 'CONMEBOL Recopa';
    } else if (lowerName.includes('copa america')) {
      translations.en = 'Copa América';
      translations.zh = '美洲杯'; translations['zh-hk'] = '美洲盃'; translations['zh-tw'] = '美洲盃';
      translations.es = 'Copa América'; translations.de = 'Copa América';
      translations.it = 'Copa América'; translations.pt = 'Copa América';
    }

    // CONCACAF Competitions
    else if (lowerName.includes('concacaf gold cup') || lowerName === 'gold cup') {
      translations.zh = 'CONCACAF金杯赛'; translations['zh-hk'] = 'CONCACAF金盃賽'; translations['zh-tw'] = 'CONCACAF金盃賽';
      translations.es = 'Copa de Oro de CONCACAF'; translations.de = 'CONCACAF Gold Cup';
    } else if (lowerName.includes('concacaf champions league')) {
      translations.zh = 'CONCACAF冠军联赛'; translations['zh-hk'] = 'CONCACAF冠軍聯賽'; translations['zh-tw'] = 'CONCACAF冠軍聯賽';
      translations.es = 'Liga de Campeones CONCACAF'; translations.de = 'CONCACAF Champions League';
    }

    // African Competitions
    else if (lowerName.includes('africa cup of nations') || lowerName === 'afcon') {
      translations.zh = '非洲国家杯'; translations['zh-hk'] = '非洲國家盃'; translations['zh-tw'] = '非洲國家盃';
      translations.es = 'Copa Africana de Naciones'; translations.de = 'Afrika-Cup';
    } else if (lowerName.includes('caf champions league')) {
      translations.zh = 'CAF冠军联赛'; translations['zh-hk'] = 'CAF冠軍聯賽'; translations['zh-tw'] = 'CAF冠軍聯賽';
      translations.es = 'Liga de Campeones CAF'; translations.de = 'CAF Champions League';
    }

    // AFC/Asian Competitions
    else if (lowerName.includes('afc cup') || lowerName.includes('afc盃') || lowerName.includes('afc杯')) {
      translations.en = 'AFC Cup';
      translations.zh = 'AFC杯'; translations['zh-hk'] = 'AFC盃'; translations['zh-tw'] = 'AFC盃';
      translations.es = 'Copa AFC'; translations.de = 'AFC-Pokal';
      translations.it = 'Coppa AFC'; translations.pt = 'Copa AFC';
    } else if (lowerName.includes('afc champions league')) {
      translations.en = 'AFC Champions League';
      translations.zh = 'AFC冠军联赛'; translations['zh-hk'] = 'AFC冠軍聯賽'; translations['zh-tw'] = 'AFC冠軍聯賽';
      translations.es = 'Liga de Campeones AFC'; translations.de = 'AFC Champions League';
      translations.it = 'AFC Champions League'; translations.pt = 'Liga dos Campeões AFC';
    } else if (lowerName.includes('asian cup') || lowerName === 'afc asian cup') {
      translations.en = 'AFC Asian Cup';
      translations.zh = '亚洲杯'; translations['zh-hk'] = '亞洲盃'; translations['zh-tw'] = '亞洲盃';
      translations.es = 'Copa Asiática'; translations.de = 'Asienmeisterschaft';
      translations.it = 'Coppa d\'Asia'; translations.pt = 'Taça da Ásia';
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

    // Add specific Czech Republic mixed league translation
    else if (lowerName.includes('czech-republic') && lowerName.includes('聯賽')) {
      translations.en = 'Czech Republic League';
      translations.zh = '捷克共和国联赛'; translations['zh-hk'] = '捷克共和國聯賽'; translations['zh-tw'] = '捷克共和國聯賽';
      translations.es = 'Liga de República Checa'; translations.de = 'Tschechische Liga';
      translations.it = 'Lega Ceca'; translations.pt = 'Liga da República Tcheca';
    }

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
      'primera liga': '葡萄牙',
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

  // Reverse mapping for Chinese country names to English
  private chineseToEnglishMap: { [key: string]: string } = {
    // Common Chinese country names seen in fixtures
    '英格蘭': 'England', '英格兰': 'England',
    '西班牙': 'Spain',
    '意大利': 'Italy',
    '德國': 'Germany', '德国': 'Germany',
    '法國': 'France', '法国': 'France',
    '荷蘭': 'Netherlands', '荷兰': 'Netherlands',
    '葡萄牙': 'Portugal',
    '比利時': 'Belgium', '比利时': 'Belgium',
    '瑞士': 'Switzerland',
    '奧地利': 'Austria', '奥地利': 'Austria',
    '捷克共和國': 'Czech Republic', '捷克共和国': 'Czech Republic',
    '斯洛伐克': 'Slovakia',
    '斯洛文尼亞': 'Slovenia', '斯洛文尼亚': 'Slovenia',
    '匈牙利': 'Hungary',
    '波蘭': 'Poland', '波兰': 'Poland',
    '羅馬尼亞': 'Romania', '罗马尼亚': 'Romania',
    '保加利亞': 'Bulgaria', '保加利亚': 'Bulgaria',
    '克羅地亞': 'Croatia', '克罗地亚': 'Croatia', '克羅埃西亞': 'Croatia',
    '塞爾維亞': 'Serbia', '塞尔维亚': 'Serbia',
    '希臘': 'Greece', '希腊': 'Greece',
    '丹麥': 'Denmark', '丹麦': 'Denmark',
    '瑞典': 'Sweden',
    '挪威': 'Norway',
    '芬蘭': 'Finland', '芬兰': 'Finland',
    '冰島': 'Iceland', '冰岛': 'Iceland',
    '俄羅斯': 'Russia', '俄罗斯': 'Russia',
    '烏克蘭': 'Ukraine', '乌克兰': 'Ukraine',
    '土耳其': 'Turkey',
    '愛沙尼亞': 'Estonia', '爱沙尼亚': 'Estonia',
    '拉脫維亞': 'Latvia', '拉脱维亚': 'Latvia',
    '立陶宛': 'Lithuania',
    '格魯吉亞': 'Georgia', '格鲁吉亚': 'Georgia',
    '亞美尼亞': 'Armenia', '亚美尼亚': 'Armenia',
    '列支敦士登': 'Liechtenstein',
    '巴西': 'Brazil',
    '阿根廷': 'Argentina',
    '墨西哥': 'Mexico',
    '美國': 'United States', '美国': 'United States',
    '加拿大': 'Canada',
    '哥倫比亞': 'Colombia', '哥伦比亚': 'Colombia',
    '智利': 'Chile',
    '秘魯': 'Peru', '秘鲁': 'Peru',
    '厄瓜多爾': 'Ecuador', '厄瓜多尔': 'Ecuador',
    '烏拉圭': 'Uruguay', '乌拉圭': 'Uruguay',
    '巴拉圭': 'Paraguay',
    '玻利維亞': 'Bolivia', '玻利维亚': 'Bolivia',
    '委內瑞拉': 'Venezuela', '委内瑞拉': 'Venezuela',
    '多明尼加共和國': 'Dominican Republic', '多米尼加共和国': 'Dominican Republic',
    '日本': 'Japan',
    '韓國': 'South Korea', '韩国': 'South Korea',
    '中國': 'China', '中国': 'China',
    '印度': 'India',
    '澳洲': 'Australia', '澳大利亞': 'Australia', '澳大利亚': 'Australia',
    '泰國': 'Thailand', '泰国': 'Thailand',
    '馬來西亞': 'Malaysia', '马来西亚': 'Malaysia',
    '新加坡': 'Singapore',
    '印尼': 'Indonesia', '印度尼西亞': 'Indonesia', '印度尼西亚': 'Indonesia',
    '菲律賓': 'Philippines', '菲律宾': 'Philippines',
    '越南': 'Vietnam',
    '沙特阿拉伯': 'Saudi Arabia',
    '阿拉伯聯合酋長國': 'United Arab Emirates', '阿拉伯联合酋长国': 'United Arab Emirates',
    '阿聯酋': 'UAE', '阿联酋': 'UAE',
    '埃及': 'Egypt',
    // Hyphenated country names
    'Czech-Republic': 'Czech Republic',
    'North-Macedonia': 'North Macedonia',
    'Bosnia-Herzegovina': 'Bosnia and Herzegovina',
    'Northern-Ireland': 'Northern Ireland'
  };

  // Detect if a country name is in Chinese and convert to English first
  private detectAndNormalizeCountryName(countryName: string): string {
    if (!countryName || typeof countryName !== 'string') return countryName;

    const cleanName = countryName.trim();

    // Check if it's already in Chinese-to-English mapping
    if (this.chineseToEnglishMap[cleanName]) {
      const englishName = this.chineseToEnglishMap[cleanName];
      console.log(`🔄 [Smart Translation] Chinese detected: "${cleanName}" → English: "${englishName}"`);
      return englishName;
    }

    // Handle hyphenated country names by checking space version
    if (cleanName.includes('-')) {
      const spacedName = cleanName.replace(/-/g, ' ');
      if (this.popularCountries[spacedName]) {
        console.log(`🔄 [Smart Translation] Hyphenated country normalized: "${cleanName}" → "${spacedName}"`);
        return spacedName;
      }
    }

    // Handle space-separated country names by trying hyphenated version
    if (cleanName.includes(' ')) {
      const hyphenatedName = cleanName.replace(/ /g, '-');
      if (this.popularCountries[hyphenatedName]) {
        console.log(`🔄 [Smart Translation] Spaced country normalized: "${cleanName}" → "${hyphenatedName}"`);
        return hyphenatedName;
      }
    }

    return cleanName;
  }

  // Generate mapping for missing countries
  private generateCountryMapping(countryName: string): CountryTranslation | null {
    // First try to get mapping from countriesAndLeagues constants
    const constantMapping = this.getCountryMappingFromConstants(countryName);
    if (constantMapping) {
      console.log(`🌍 [Country Mapping] Using countriesAndLeagues data for: ${countryName}`);
      return constantMapping;
    }

    // Fall back to existing logic
    console.log(`🔄 [Country Mapping] Generating mapping for: ${countryName}`);

    // Try the existing manual mappings first
    const manualMapping = this.popularCountries[countryName];
    if (manualMapping) {
      return manualMapping;
    }

    // Normalize and try again
    const normalizedName = this.detectAndNormalizeCountryName(countryName);
    const normalizedManualMapping = this.popularCountries[normalizedName];
    if (normalizedManualMapping) {
      return normalizedManualMapping;
    }

    // If still no mapping found, create a basic one
    return this.createEmptyCountryMapping(countryName);
  }

  // Get country mapping from ALL_COUNTRIES data
  private getCountryMappingFromConstants(countryName: string): CountryTranslation | null {
    const normalizedName = this.detectAndNormalizeCountryName(countryName); // Ensure consistent naming

    // Find the country in ALL_COUNTRIES
    const countryData = ALL_COUNTRIES.find(c =>
      c.name === normalizedName ||
      c.code === normalizedName ||
      (c.name && c.name.toLowerCase() === normalizedName.toLowerCase()) ||
      (c.code && c.code.toLowerCase() === normalizedName.toLowerCase())
    );

    if (!countryData) {
      // Try variations as well
      const variations = this.generateCountryNameVariations(normalizedName);
      for (const variation of variations) {
        const variationData = ALL_COUNTRIES.find(c => c.name === variation || c.code === variation);
        if (variationData) {
          return this.mapCountryDataToTranslation(variationData);
        }
      }
      return null; // Not found in constants
    }

    return this.mapCountryDataToTranslation(countryData);
  }

  // Map country data to the translation interface
  private mapCountryDataToTranslation(countryData: { name: string; code?: string; translations?: { [key: string]: string } }): CountryTranslation {
    const translation: CountryTranslation = {
      en: countryData.name,
      es: countryData.name,
      de: countryData.name,
      it: countryData.name,
      pt: countryData.name,
      zh: countryData.name,
      'zh-hk': countryData.name,
      'zh-tw': countryData.name
    };

    if (countryData.translations) {
      // Map known translations
      Object.keys(translation).forEach(lang => {
        if (countryData.translations && countryData.translations[lang]) {
          translation[lang as keyof CountryTranslation[string]] = countryData.translations[lang];
        }
      });
    }

    // Use existing popularCountries for fallback if translations are missing
    const fallbackMapping = this.popularCountries[countryData.name] || this.popularCountries[countryData.code || ''];
    if (fallbackMapping) {
      Object.keys(translation).forEach(lang => {
        if (!translation[lang] || translation[lang] === countryData.name) {
          translation[lang as keyof CountryTranslation[string]] = fallbackMapping[lang] || countryData.name;
        }
      });
    }

    return translation;
  }

  // Main translation method for league names - now synchronous for React rendering
  translateLeagueName(leagueName: string, language: string): string {
    if (!leagueName || typeof leagueName !== 'string') {
      return leagueName || '';
    }

    const cacheKey = `${leagueName}-${language}`;

    // For mixed language leagues, skip cache and force fresh translation
    const isMixedLanguage = this.detectMixedLanguageLeague(leagueName);

    // Check local cache first (skip for mixed language leagues to force fresh translation)
    if (!isMixedLanguage && this.leagueCache.has(cacheKey)) {
      return this.leagueCache.get(cacheKey);
    }

    // Check core translations first
    const coreTranslation = this.coreLeagueTranslations[leagueName];
    if (coreTranslation && coreTranslation[language]) {
      this.leagueCache.set(cacheKey, coreTranslation[language]);
      return coreTranslation[language];
    }

    // Check learned mappings
    const learned = this.learnedLeagueMappings.get(leagueName);
    if (learned && learned[language]) {
      this.leagueCache.set(cacheKey, learned[language]);
      return learned[language];
    }

    // For mixed language leagues, force generate new mapping
    if (isMixedLanguage) {
      const mixedMapping = this.generateMixedLanguageMapping(leagueName, '');
      if (mixedMapping && mixedMapping[language]) {
        // Store the mapping for future use
        this.learnedLeagueMappings.set(leagueName, mixedMapping);
        this.coreLeagueTranslations[leagueName] = mixedMapping;
        this.saveLearnedMappings();

        this.leagueCache.set(cacheKey, mixedMapping[language]);
        console.log(`🔧 [Mixed Language Translation] "${leagueName}" → "${mixedMapping[language]}" (${language})`);
        return mixedMapping[language];
      }
    }

    // Generate translation using various methods
    const generated = this.generateBestTranslation(leagueName, '', language);
    if (generated && generated !== leagueName) {
      this.leagueCache.set(cacheKey, generated);
      return generated;
    }

    // Store original as fallback
    this.leagueCache.set(cacheKey, leagueName);
    return leagueName;
  }

  // Async version for background updates
  async translateLeagueNameAsync(leagueName: string, language: string): Promise<string> {
    if (!leagueName || typeof leagueName !== 'string') {
      return leagueName || '';
    }

    const cacheKey = `${leagueName}-${language}`;

    // Check local cache first
    if (this.leagueCache.has(cacheKey)) {
      return this.leagueCache.get(cacheKey);
    }

    try {
      // Try to get translation from database API
      const response = await fetch(`/api/translations/league/${encodeURIComponent(leagueName)}/${language}`);
      if (response.ok) {
        const data = await response.json();
        if (data.translation && data.translation !== leagueName) {
          this.leagueCache.set(cacheKey, data.translation);
          return data.translation;
        }
      }
    } catch (error) {
      console.warn(`[SmartLeagueTranslation] Database lookup failed for ${leagueName}, falling back to local methods:`, error);
    }

    // Fallback to sync method
    return this.translateLeagueName(leagueName, language);
  }

  // Sync wrapper for backwards compatibility
  translateLeagueNameSync(leagueName: string, language: string): string {
    return this.translateLeagueName(leagueName, language);
  }

  // Main translation method for country names - now synchronous for React rendering
  translateCountryName(countryName: string, language: string): string {
    if (!countryName || typeof countryName !== 'string') {
      return countryName || '';
    }

    const cacheKey = `${countryName}-${language}`;

    // Check local cache first
    if (this.countryCache.has(cacheKey)) {
      return this.countryCache.get(cacheKey);
    }

    // Check static mappings first (exact match)
    const staticTranslation = this.popularCountries[countryName];
    if (staticTranslation) {
      const translation = staticTranslation[language as keyof CountryTranslation[string]];
      if (translation && translation !== countryName) {
        this.countryCache.set(cacheKey, translation);
        return translation;
      }
    }

    // Handle hyphenated country names by normalizing them
    if (countryName.includes('-')) {
      const normalizedName = countryName.replace(/-/g, ' ');
      const normalizedTranslation = this.popularCountries[normalizedName];
      if (normalizedTranslation) {
        const translation = normalizedTranslation[language as keyof CountryTranslation[string]];
        if (translation && translation !== countryName) {
          this.countryCache.set(cacheKey, translation);
          return translation;
        }
      }
    }

    // Handle space-separated country names by trying hyphenated version
    if (countryName.includes(' ')) {
      const hyphenatedName = countryName.replace(/ /g, '-');
      const hyphenatedTranslation = this.popularCountries[hyphenatedName];
      if (hyphenatedTranslation) {
        const translation = hyphenatedTranslation[language as keyof CountryTranslation[string]];
        if (translation && translation !== countryName) {
          this.countryCache.set(cacheKey, translation);
          return translation;
        }
      }
    }

    // Check learned mappings
    const learned = this.learnedCountryMappings.get(countryName);
    if (learned) {
      const translation = learned[language as keyof CountryTranslation[string]];
      if (translation && translation !== countryName) {
        this.countryCache.set(cacheKey, translation);
        return translation;
      }
    }

    // Try Chinese to English mapping (sync only)
    const englishName = this.chineseToEnglishMap[countryName];
    if (englishName && englishName !== countryName) {
      const englishTranslation = this.translateCountryName(englishName, language);
      if (englishTranslation !== englishName) {
        this.countryCache.set(cacheKey, englishTranslation);
        return englishTranslation;
      }
    }

    // Store original as fallback
    this.countryCache.set(cacheKey, countryName);
    return countryName;
  }

  // Async version for background updates
  async translateCountryNameAsync(countryName: string, language: string): Promise<string> {
    if (!countryName || typeof countryName !== 'string') {
      return countryName || '';
    }

    const cacheKey = `${countryName}-${language}`;

    // Check local cache first
    if (this.countryCache.has(cacheKey)) {
      return this.countryCache.get(cacheKey);
    }

    try {
      // Try to get translation from database API
      const response = await fetch(`/api/translations/country/${encodeURIComponent(countryName)}/${language}`);
      if (response.ok) {
        const data = await response.json();
        if (data.translation && data.translation !== countryName) {
          this.countryCache.set(cacheKey, data.translation);
          return data.translation;
        }
      }
    } catch (error) {
      console.warn(`[SmartCountryTranslation] Database lookup failed for ${countryName}, falling back to local methods:`, error);
    }

    // Fallback to sync method
    return this.translateCountryName(countryName, language);
  }

  // Sync wrapper for backwards compatibility
  translateCountryNameSync(countryName: string, language: string): string {
    return this.translateCountryName(countryName, language);
  }


  // Public method to clear translation caches
  clearTranslationCaches() {
    this.clearCache();
    console.log('🧹 [SmartTranslation] Cleared all translation caches for fresh translations');
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
      learnedCountries: Object.fromEntries(this.learnedCountryMappings), // Include learned countries
      automatedCountries: Object.fromEntries(this.automatedCountryMappings), // Include automated countries
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
      if (mappings.automatedCountries) {
        Object.entries(mappings.automatedCountries).forEach(([key, value]) => {
          this.automatedCountryMappings.set(key, value as AutomatedCountryMapping);
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

  // Mass learn mixed language leagues from fixtures
  massLearnMixedLanguageLeagues(fixtures: any[]): void {
    const mixedLeagues = new Set<string>();
    let learned = 0;

    // Collect all mixed language league names
    fixtures.forEach(fixture => {
      if (fixture?.league?.name) {
        const leagueName = fixture.league.name;
        if (this.detectMixedLanguageLeague(leagueName)) {
          mixedLeagues.add(leagueName);
        }
      }
    });

    // Process each mixed language league
    mixedLeagues.forEach(leagueName => {
      if (!this.learnedLeagueMappings.has(leagueName)) {
        const fixture = fixtures.find(f => f.league?.name === leagueName);
        const countryName = fixture?.league?.country || '';

        const mapping = this.generateMixedLanguageMapping(leagueName, countryName);
        if (mapping) {
          this.learnedLeagueMappings.set(leagueName, mapping);
          learned++;
          console.log(`🔧 [Auto-Fix Mixed] "${leagueName}" → properly translated`);
        }
      }
    });

    if (learned > 0) {
      this.saveLearnedMappings();
      console.log(`🎯 [Mass Mixed Learning] Fixed ${learned} mixed language leagues`);
    }
  }

  // Fix mixed language leagues that appear in the UI
  private fixMixedLanguageLeagues(): void {
    const mixedLanguageLeagues = [
      'CONMEBOL南美盃', 'CONMEBOL自由盃', 'AFC盃', 'UEFA超級盃', 'UEFA超級盃',
      '世界联赛', '世界聯賽', 'Netherlands聯賽', 'Australia聯賽', 'Australia超级联赛'
    ];

    mixedLanguageLeagues.forEach(leagueName => {
      if (!this.learnedLeagueMappings.has(leagueName)) {
        const mapping = this.generateMixedLanguageFixMapping(leagueName);
        if (mapping) {
          this.learnedLeagueMappings.set(leagueName, mapping);
          console.log(`🔧 [Mixed Language Fix] Auto-learned: "${leagueName}"`);
        }
      }
    });

    if (mixedLanguageLeagues.length > 0) {
      this.saveLearnedMappings();
      console.log(`🔧 [Mixed Language Fix] Fixed ${mixedLanguageLeagues.length} mixed language leagues`);
    }
  }

  // Generate proper mapping for mixed language league names
  private generateMixedLanguageFixMapping(leagueName: string): LeagueTranslation | null {
    const translations: any = {};

    // Handle specific cases from the problematic leagues
    if (leagueName.includes('CONMEBOL南美')) {
      translations.en = 'CONMEBOL Sudamericana';
      translations.zh = 'CONMEBOL南美杯'; translations['zh-hk'] = 'CONMEBOL南美盃'; translations['zh-tw'] = 'CONMEBOL南美盃';
      translations.es = 'CONMEBOL Sudamericana'; translations.de = 'CONMEBOL Sudamericana';
      translations.it = 'CONMEBOL Sudamericana'; translations.pt = 'CONMEBOL Sudamericana';
    } else if (leagueName.includes('CONMEBOL自由')) {
      translations.en = 'CONMEBOL Libertadores';
      translations.zh = 'CONMEBOL自由杯'; translations['zh-hk'] = 'CONMEBOL自由盃'; translations['zh-tw'] = 'CONMEBOL自由盃';
      translations.es = 'CONMEBOL Libertadores'; translations.de = 'CONMEBOL Libertadores';
      translations.it = 'CONMEBOL Libertadores'; translations.pt = 'CONMEBOL Libertadores';
    } else if (leagueName.includes('AFC盃') || leagueName.includes('AFC杯')) {
      translations.en = 'AFC Cup';
      translations.zh = 'AFC杯'; translations['zh-hk'] = 'AFC盃'; translations['zh-tw'] = 'AFC盃';
      translations.es = 'Copa AFC'; translations.de = 'AFC-Pokal';
      translations.it = 'Coppa AFC'; translations.pt = 'Copa AFC';
    } else if (leagueName.includes('UEFA超级') || leagueName.includes('UEFA超級')) {
      translations.en = 'UEFA Super Cup';
      translations.zh = 'UEFA超级杯'; translations['zh-hk'] = 'UEFA超級盃'; translations['zh-tw'] = 'UEFA超級盃';
      translations.es = 'Supercopa de la UEFA'; translations.de = 'UEFA Super Cup';
      translations.it = 'Supercoppa UEFA'; translations.pt = 'Supertaça Europeia';
    } else if (leagueName.includes('世界联赛') || leagueName.includes('世界聯賽')) {
      translations.en = 'World Cup';
      translations.zh = '世界杯'; translations['zh-hk'] = '世界盃'; translations['zh-tw'] = '世界盃';
      translations.es = 'Copa del Mundo'; translations.de = 'Weltmeisterschaft';
      translations.it = 'Coppa del Mondo'; translations.pt = 'Copa do Mundo';
    } else if (leagueName.includes('Netherlands聯賽') || leagueName.includes('Netherlands联赛')) {
      translations.en = 'Netherlands League';
      translations.zh = '荷兰联赛'; translations['zh-hk'] = '荷蘭聯賽'; translations['zh-tw'] = '荷蘭聯賽';
      translations.es = 'Liga de Países Bajos'; translations.de = 'Niederländische Liga';
      translations.it = 'Lega Olandese'; translations.pt = 'Liga dos Países Baixos';
    } else if (leagueName.includes('Australia聯賽') || leagueName.includes('Australia联赛')) {
      translations.en = 'Australia League';
      translations.zh = '澳大利亚联赛'; translations['zh-hk'] = '澳洲聯賽'; translations['zh-tw'] = '澳洲聯賽';
      translations.es = 'Liga de Australia'; translations.de = 'Australische Liga';
      translations.it = 'Lega Australiana'; translations.pt = 'Liga da Austrália';
    } else if (leagueName.includes('Australia超级联赛') || leagueName.includes('Australia超級聯賽')) {
      translations.en = 'Australia Super League';
      translations.zh = '澳大利亚超级联赛'; translations['zh-hk'] = '澳洲超級聯賽'; translations['zh-tw'] = '澳洲超級聯賽';
      translations.es = 'Superliga de Australia'; translations.de = 'Australische Superliga';
      translations.it = 'Superlega Australiana'; translations.pt = 'Superliga da Austrália';
    }

    return Object.keys(translations).length > 0 ? translations as LeagueTranslation : null;
  }

  // Learn from specific league names that need translation
  learnMissingLeagueNames() {
    const missingLeagues = [
      { name: 'Primera Nacional', country: 'Argentina' },
      { name: 'Primera C', country: 'Argentina' },
      { name: 'Netherlands聯賽', country: 'Netherlands' },
      { name: 'Capital Territory NPL', country: 'Australia' },
      { name: 'Australia超级联赛', country: 'Australia' },
      { name: 'Western Australia NPL', country: 'Australia' },
      { name: 'New South Wales NPL 2', country: 'Australia' },
      { name: 'Australia Cup', country: 'Australia' },
      { name: 'Australia聯賽', country: 'Australia' },
      { name: 'Bulgaria聯賽', country: 'Bulgaria' },
      { name: 'Brazil联赛', country: 'Brazil' },
      { name: 'Brazil聯賽', country: 'Brazil' },
      { name: 'Argentina联赛', country: 'Argentina' },
      { name: 'Argentina聯賽', country: 'Argentina' }
    ];

    console.log('🚀 [Enhanced Learning] Learning missing and mixed language leagues...');
    const learned = this.bulkLearnFromLeagueList(missingLeagues);

    // Also ensure these are in core translations
    missingLeagues.forEach(league => {
      this.autoLearnFromAnyLeagueName(league.name, { countryName: league.country });
    });

    console.log(`✅ [Enhanced Learning] Completed learning ${learned} missing league translations`);
    return learned;
  }

  // Fix specific mixed language leagues that appear in the UI
  private fixSpecificMixedLeagues(): void {
    const specificMixedLeagues = [
      { name: 'Czech-Republic聯賽', country: 'Czech Republic' },
      { name: 'Dominican-Republic聯賽', country: 'Dominican Republic' },
      { name: 'Netherlands聯賽', country: 'Netherlands' },
      { name: 'Bulgaria聯賽', country: 'Bulgaria' },
      { name: 'Australia聯賽', country: 'Australia' },
      { name: 'Germany聯賽', country: 'Germany' },
      { name: 'Spain聯賽', country: 'Spain' },
      { name: 'Italy聯賽', country: 'Italy' },
      { name: 'France聯賽', country: 'France' },
      { name: 'England聯賽', country: 'England' },
      { name: 'Brazil聯賽', country: 'Brazil' },
      { name: 'Argentina聯賽', country: 'Argentina' }
    ];

    let fixed = 0;
    specificMixedLeagues.forEach(({ name, country }) => {
      const mapping = this.generateMixedLanguageMapping(name, country);
      if (mapping) {
        // Force override any existing mapping
        this.learnedLeagueMappings.set(name, mapping);

        // Also add to core translations for immediate access
        this.coreLeagueTranslations[name] = mapping;
        fixed++;

        console.log(`🎯 [Specific Fix] "${name}" → properly translated for all languages`);
        console.log(`🎯 [Specific Fix] Translations:`, {
          en: mapping.en,
          'zh-hk': mapping['zh-hk'],
          'zh-tw': mapping['zh-tw'],
          'zh': mapping['zh'],
          es: mapping.es,
          de: mapping.de,
          it: mapping.it,
          pt: mapping.pt
        });
      }
    });

    if (fixed > 0) {
      this.saveLearnedMappings();
      console.log(`✅ [Specific Fix] Fixed ${fixed} specific mixed language leagues immediately`);
    }
  }

  // Learn from problematic league names that commonly appear
  private learnProblematicLeagueNames(): void {
    const problematicLeagues = [
      // Mixed language leagues from your screenshot
      { name: 'CONMEBOL南美盃', country: 'World' },
      { name: 'CONMEBOL自由盃', country: 'World' },
      { name: 'AFC盃', country: 'World' },
      { name: 'UEFA超級盃', country: 'Europe' },
      { name: 'UEFA超級盃', country: 'Europe' },
      { name: '世界聯賽', country: 'World' },
      { name: 'Concacaf Central American Cup', country: 'World' },
      { name: '阿根廷', country: 'Argentina' },
      { name: 'Copa Argentina', country: 'Argentina' },
      { name: 'Netherlands聯賽', country: 'Netherlands' },

      // Existing problematic leagues
      { name: 'Bulgaria聯賽', country: 'Bulgaria' },
      { name: 'Australia超级联赛', country: 'Australia' },
      { name: 'Australia聯賽', country: 'Australia' },
      { name: 'Netherlands联赛', country: 'Netherlands' },
      { name: 'Germany联赛', country: 'Germany' },
      { name: 'Germany聯賽', country: 'Germany' },
      { name: 'Spain联赛', country: 'Spain' },
      { name: 'Spain聯賽', country: 'Spain' },
      { name: 'Italy联赛', country: 'Italy' },
      { name: 'Italy聯賽', country: 'Italy' },
      { name: 'France联赛', country: 'France' },
      { name: 'France聯賽', country: 'France' },
      { name: 'England联赛', country: 'England' },
      { name: 'England聯賽', country: 'England' },
      { name: 'Brazil联赛', country: 'Brazil' },
      { name: 'Brazil聯賽', country: 'Brazil' },
      { name: 'Argentina联赛', country: 'Argentina' },
      { name: 'Argentina聯賽', country: 'Argentina' }
    ];

    let learned = 0;
    problematicLeagues.forEach(({ name, country }) => {
      if (!this.learnedLeagueMappings.has(name)) {
        const mapping = this.generateMixedLanguageMapping(name, country);
        if (mapping) {
          this.learnedLeagueMappings.set(name, mapping);
          learned++;
          console.log(`🎯 [Problematic Fixed] "${name}" → learned proper translations`);
        }
      }
    });

    if (learned > 0) {
      this.saveLearnedMappings();
      console.log(`🚀 [Problematic Learning] Fixed ${learned} problematic league names`);
    }
  }
}

// Create singleton instance
export const smartLeagueCountryTranslation = new SmartLeagueCountryTranslation();