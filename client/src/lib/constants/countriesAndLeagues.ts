
// Enhanced country name translations
export const MAJOR_COUNTRIES = [
  'World', 'England', 'Spain', 'Germany', 'Italy', 'France', 'Brazil', 'Argentina'
];

// All available countries list - moved before generateCountryTranslations
export const ALL_COUNTRIES = [
  "World", "England", "Spain", "Germany", "Italy", "France", "Brazil", "Argentina", 
  "Portugal", "Netherlands", "Belgium", "Uruguay", "Colombia", "Mexico", "Chile",
  "Peru", "Ecuador", "Paraguay", "Bolivia", "Venezuela", "United States", "Canada",
  "Costa Rica", "Panama", "Honduras", "Guatemala", "El Salvador", "Nicaragua",
  "Jamaica", "Trinidad and Tobago", "Haiti", "Dominican Republic", "Cuba",
  "Puerto Rico", "Martinique", "Guadeloupe", "Barbados", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Grenada", "Antigua and Barbuda",
  "Saint Kitts and Nevis", "Dominica", "Bahamas", "Belize", "Guyana", "Suriname",
  "French Guiana", "Falkland Islands", "South Georgia", "Bermuda", "Greenland",
  "Faroe Islands", "Iceland", "Norway", "Sweden", "Denmark", "Finland",
  "Estonia", "Latvia", "Lithuania", "Poland", "Czech Republic", "Slovakia",
  "Hungary", "Romania", "Bulgaria", "Slovenia", "Croatia", "Bosnia and Herzegovina",
  "Serbia", "Montenegro", "North Macedonia", "Albania", "Kosovo", "Moldova",
  "Ukraine", "Belarus", "Russia", "Georgia", "Armenia", "Azerbaijan",
  "Turkey", "Cyprus", "Greece", "Malta", "San Marino", "Vatican City",
  "Monaco", "Andorra", "Liechtenstein", "Switzerland", "Austria", "Luxembourg",
  "Ireland", "Scotland", "Wales", "Northern Ireland", "Isle of Man",
  "Channel Islands", "Gibraltar", "Morocco", "Algeria", "Tunisia", "Libya",
  "Egypt", "Sudan", "South Sudan", "Ethiopia", "Eritrea", "Djibouti",
  "Somalia", "Kenya", "Uganda", "Tanzania", "Rwanda", "Burundi",
  "Democratic Republic of the Congo", "Central African Republic", "Chad",
  "Cameroon", "Equatorial Guinea", "Gabon", "Republic of the Congo",
  "Angola", "Zambia", "Malawi", "Mozambique", "Zimbabwe", "Botswana",
  "Namibia", "South Africa", "Lesotho", "Eswatini", "Madagascar", "Mauritius",
  "Seychelles", "Comoros", "Mayotte", "Réunion", "Saint Helena",
  "Ascension and Tristan da Cunha", "Western Sahara", "Cape Verde",
  "São Tomé and Príncipe", "Guinea", "Guinea-Bissau", "Senegal", "Gambia",
  "Mali", "Burkina Faso", "Niger", "Nigeria", "Benin", "Togo", "Ghana",
  "Côte d'Ivoire", "Liberia", "Sierra Leone", "Mauritania", "Israel",
  "Palestine", "Jordan", "Lebanon", "Syria", "Iraq", "Iran", "Afghanistan",
  "Pakistan", "India", "Bangladesh", "Myanmar", "Thailand", "Laos",
  "Vietnam", "Cambodia", "Malaysia", "Singapore", "Brunei", "Indonesia",
  "Philippines", "East Timor", "Papua New Guinea", "Australia", "New Zealand",
  "Fiji", "Solomon Islands", "Vanuatu", "New Caledonia", "French Polynesia",
  "Cook Islands", "Samoa", "Tonga", "Tuvalu", "Kiribati", "Nauru",
  "Marshall Islands", "Micronesia", "Palau", "Guam", "Northern Mariana Islands",
  "American Samoa", "Hawaii", "China", "Hong Kong", "Macau", "Taiwan",
  "Mongolia", "North Korea", "South Korea", "Japan", "Kazakhstan",
  "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Uzbekistan", "Nepal", "Bhutan",
  "Sri Lanka", "Maldives", "Kuwait", "Bahrain", "Qatar", "United Arab Emirates",
  "Oman", "Yemen", "Saudi Arabia"
];

// Function to generate country translations - now placed after ALL_COUNTRIES
const generateCountryTranslations = () => {
  const translations: Record<string, any> = {};
  
  ALL_COUNTRIES.forEach(country => {
    switch (country) {
      case 'World':
        translations[country] = {
          'zh': '世界', 'zh-hk': '世界', 'zh-tw': '世界',
          'es': 'Mundial', 'de': 'Welt', 'it': 'Mondo', 'pt': 'Mundial'
        };
        break;
      case 'England':
        translations[country] = {
          'zh': '英格兰', 'zh-hk': '英格蘭', 'zh-tw': '英格蘭',
          'es': 'Inglaterra', 'de': 'England', 'it': 'Inghilterra', 'pt': 'Inglaterra'
        };
        break;
      case 'Spain':
        translations[country] = {
          'zh': '西班牙', 'zh-hk': '西班牙', 'zh-tw': '西班牙',
          'es': 'España', 'de': 'Spanien', 'it': 'Spagna', 'pt': 'Espanha'
        };
        break;
      case 'Germany':
        translations[country] = {
          'zh': '德国', 'zh-hk': '德國', 'zh-tw': '德國',
          'es': 'Alemania', 'de': 'Deutschland', 'it': 'Germania', 'pt': 'Alemanha'
        };
        break;
      case 'Italy':
        translations[country] = {
          'zh': '意大利', 'zh-hk': '意大利', 'zh-tw': '意大利',
          'es': 'Italia', 'de': 'Italien', 'it': 'Italia', 'pt': 'Itália'
        };
        break;
      case 'France':
        translations[country] = {
          'zh': '法国', 'zh-hk': '法國', 'zh-tw': '法國',
          'es': 'Francia', 'de': 'Frankreich', 'it': 'Francia', 'pt': 'França'
        };
        break;
      case 'Brazil':
        translations[country] = {
          'zh': '巴西', 'zh-hk': '巴西', 'zh-tw': '巴西',
          'es': 'Brasil', 'de': 'Brasilien', 'it': 'Brasile', 'pt': 'Brasil'
        };
        break;
      case 'Argentina':
        translations[country] = {
          'zh': '阿根廷', 'zh-hk': '阿根廷', 'zh-tw': '阿根廷',
          'es': 'Argentina', 'de': 'Argentinien', 'it': 'Argentina', 'pt': 'Argentina'
        };
        break;
      case 'Portugal':
        translations[country] = {
          'zh': '葡萄牙', 'zh-hk': '葡萄牙', 'zh-tw': '葡萄牙',
          'es': 'Portugal', 'de': 'Portugal', 'it': 'Portogallo', 'pt': 'Portugal'
        };
        break;
      case 'Netherlands':
        translations[country] = {
          'zh': '荷兰', 'zh-hk': '荷蘭', 'zh-tw': '荷蘭',
          'es': 'Países Bajos', 'de': 'Niederlande', 'it': 'Paesi Bassi', 'pt': 'Holanda'
        };
        break;
      case 'Belgium':
        translations[country] = {
          'zh': '比利时', 'zh-hk': '比利時', 'zh-tw': '比利時',
          'es': 'Bélgica', 'de': 'Belgien', 'it': 'Belgio', 'pt': 'Bélgica'
        };
        break;
      case 'United States':
        translations[country] = {
          'zh': '美国', 'zh-hk': '美國', 'zh-tw': '美國',
          'es': 'Estados Unidos', 'de': 'Vereinigte Staaten', 'it': 'Stati Uniti', 'pt': 'Estados Unidos'
        };
        break;
      case 'Mexico':
        translations[country] = {
          'zh': '墨西哥', 'zh-hk': '墨西哥', 'zh-tw': '墨西哥',
          'es': 'México', 'de': 'Mexiko', 'it': 'Messico', 'pt': 'México'
        };
        break;
      case 'Colombia':
        translations[country] = {
          'zh': '哥伦比亚', 'zh-hk': '哥倫比亞', 'zh-tw': '哥倫比亞',
          'es': 'Colombia', 'de': 'Kolumbien', 'it': 'Colombia', 'pt': 'Colômbia'
        };
        break;
      // Add more cases as needed for other major countries
      default:
        // Fallback for countries without specific translations
        translations[country] = {
          'zh': country, 'zh-hk': country, 'zh-tw': country,
          'es': country, 'de': country, 'it': country, 'pt': country
        };
        break;
    }
  });
  
  return translations;
};

// Now COUNTRY_TRANSLATIONS can be initialized after ALL_COUNTRIES is defined
export const COUNTRY_TRANSLATIONS = generateCountryTranslations();

// Enhanced league translations
export const LEAGUE_TRANSLATIONS = {
  'Premier League': {
    'zh': '英超', 'zh-hk': '英超', 'zh-tw': '英超',
    'es': 'Premier League', 'de': 'Premier League', 'it': 'Premier League', 'pt': 'Premier League'
  },
  'La Liga': {
    'zh': '西甲', 'zh-hk': '西甲', 'zh-tw': '西甲',
    'es': 'La Liga', 'de': 'La Liga', 'it': 'La Liga', 'pt': 'La Liga'
  },
  'Bundesliga': {
    'zh': '德甲', 'zh-hk': '德甲', 'zh-tw': '德甲',
    'es': 'Bundesliga', 'de': 'Bundesliga', 'it': 'Bundesliga', 'pt': 'Bundesliga'
  },
  'Serie A': {
    'zh': '意甲', 'zh-hk': '意甲', 'zh-tw': '意甲',
    'es': 'Serie A', 'de': 'Serie A', 'it': 'Serie A', 'pt': 'Serie A'
  },
  'Ligue 1': {
    'zh': '法甲', 'zh-hk': '法甲', 'zh-tw': '法甲',
    'es': 'Ligue 1', 'de': 'Ligue 1', 'it': 'Ligue 1', 'pt': 'Ligue 1'
  },
  'Champions League': {
    'zh': '欧冠', 'zh-hk': '歐冠', 'zh-tw': '歐冠',
    'es': 'Liga de Campeones', 'de': 'Champions League', 'it': 'Champions League', 'pt': 'Liga dos Campeões'
  },
  'Europa League': {
    'zh': '欧联杯', 'zh-hk': '歐聯盃', 'zh-tw': '歐聯盃',
    'es': 'Liga Europa', 'de': 'Europa League', 'it': 'Europa League', 'pt': 'Liga Europa'
  },
  'World Cup': {
    'zh': '世界杯', 'zh-hk': '世界盃', 'zh-tw': '世界盃',
    'es': 'Copa del Mundo', 'de': 'Weltmeisterschaft', 'it': 'Coppa del Mondo', 'pt': 'Copa do Mundo'
  }
};

// Countries and their associated leagues
export const COUNTRIES_AND_LEAGUES = {
  "World": {
    leagues: [
      "World Cup", "FIFA Club World Cup", "Copa America", "UEFA European Championship",
      "African Cup of Nations", "Asian Cup", "CONCACAF Gold Cup", "Nations League",
      "UEFA Nations League", "Copa America Centenario", "Confederations Cup",
      "Olympics Men", "Olympics Women", "Youth World Cup", "Women's World Cup"
    ]
  },
  "England": {
    leagues: [
      "Premier League", "Championship", "League One", "League Two", 
      "FA Cup", "EFL Cup", "Community Shield", "National League"
    ]
  },
  "Spain": {
    leagues: [
      "La Liga", "Segunda División", "Copa del Rey", "Supercopa de España",
      "Primera Federación", "Segunda Federación"
    ]
  },
  "Germany": {
    leagues: [
      "Bundesliga", "2. Bundesliga", "3. Liga", "DFB-Pokal", 
      "DFL-Supercup", "Regionalliga"
    ]
  },
  "Italy": {
    leagues: [
      "Serie A", "Serie B", "Serie C", "Coppa Italia", 
      "Supercoppa Italiana", "Serie D"
    ]
  },
  "France": {
    leagues: [
      "Ligue 1", "Ligue 2", "National", "Coupe de France", 
      "Trophée des Champions", "Coupe de la Ligue"
    ]
  },
  "Brazil": {
    leagues: [
      "Serie A", "Serie B", "Copa do Brasil", "Campeonato Carioca",
      "Campeonato Paulista", "Copa Libertadores", "Copa Sudamericana"
    ]
  },
  "Argentina": {
    leagues: [
      "Primera División", "Primera Nacional", "Primera B", 
      "Copa Argentina", "Supercopa Argentina", "Copa de la Liga"
    ]
  },
  "Portugal": {
    leagues: [
      "Primeira Liga", "Liga Portugal 2", "Taça de Portugal", 
      "Taça da Liga", "Supertaça Cândido de Oliveira"
    ]
  },
  "Netherlands": {
    leagues: [
      "Eredivisie", "Eerste Divisie", "KNVB Cup", "Johan Cruyff Shield"
    ]
  }
};

// Helper functions for getting translations
export const getCountryDisplayName = (countryName: string, language: string = 'zh'): string => {
  const translation = COUNTRY_TRANSLATIONS[countryName];
  if (translation && translation[language]) {
    return translation[language];
  }
  return countryName;
};

export const getLeagueDisplayName = (leagueName: string, language: string = 'zh'): string => {
  const translation = LEAGUE_TRANSLATIONS[leagueName];
  if (translation && translation[language]) {
    return translation[language];
  }
  return leagueName;
};

// Export all countries for use in other components
export { ALL_COUNTRIES as allAvailableCountries };
