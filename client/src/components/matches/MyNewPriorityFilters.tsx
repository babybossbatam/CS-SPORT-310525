import { parseISO, format, isValid } from 'date-fns';
import { safeSubstring } from '@/lib/dateUtilsUpdated';
import { shouldExcludeFixture } from '@/lib/exclusionFilters';

// Geographic/Regional preferences with priority tiers
const TIER_1_COUNTRIES = ['England', 'Spain', 'Italy', 'Germany', 'France']; // Top priority European countries
const TIER_2_INTERNATIONAL = ['World', 'Europe']; // International competitions
const TIER_3_OTHER_POPULAR = ['Brazil', 'Saudi Arabia', 'Egypt', 'Colombia', 'USA', 'United Arab Emirates']; // Other popular countries

const POPULAR_COUNTRIES_ORDER = [
  'International', // FIFA Club World Cup first
  'World', // Men's international friendlies and other World competitions
  'Europe', // UEFA Europa Conference League and other European competitions
  'South America', // CONMEBOL competitions
  'Egypt', // Egypt Premier League
  'Colombia', // Liga BetPlay
  'USA', // USA MLS league
  'United Arab Emirates', // UAE Pro League
  ...TIER_1_COUNTRIES.filter(c => c !== 'England' && c !== 'Spain' && c !== 'Italy' && c !== 'Germany' && c !== 'France'), // Remove duplicates if any
  'England', 'Spain', 'Italy', 'Germany', 'France', // Other European countries
  ...TIER_3_OTHER_POPULAR.filter(c => c !== 'Egypt' && c !== 'Colombia' && c !== 'United Arab Emirates'), // Other popular countries except those already listed
];

// Enhanced leagues by country with tier-based filtering
const POPULAR_LEAGUES_BY_COUNTRY = {
  'England': [39, 45, 48], // Premier League, FA Cup, EFL Cup
  'Spain': [140, 143], // La Liga, Copa del Rey
  'Italy': [135, 137], // Serie A, Coppa Italia
  'Germany': [78, 81], // Bundesliga, DFB Pokal
  'France': [61, 66], // Ligue 1, Coupe de France
  'Brazil': [71, 72, 73, 74], // Serie A Brazil, Serie B Brazil, Serie C Brazil, Serie D Brazil
  'Saudi Arabia': [307], // Saudi Pro League (only major league)
  'Egypt': [233], // Egyptian Premier League (only major league)
  'USA': [253, 254], // Only Major League Soccer (MLS) and MLS Next Pro
  'United Arab Emirates': [301], // UAE Pro League
  'Europe': [2, 3, 848], // Champions League, Europa League, Conference League
  'World': [1, 10], // World Cup, Friendlies
  'South America': [9, 11, 13], // Copa America, Libertadores, Sudamericana
  'International': [15], // FIFA Club World Cup as separate category
};

// Flatten popular leagues for backward compatibility
// Enhanced popular leagues with FIFA Club World Cup and more tournaments
const POPULAR_LEAGUES = [2, 3, 15, 39, 140, 135, 78, 848]; // Champions League, Europa League, FIFA Club World Cup, Premier League, La Liga, Serie A, Bundesliga, Conference League

// Popular teams for match prioritization
const POPULAR_TEAMS = [
  // Premier League
  33, 40, 42, 50, 47, 49, // Manchester United, Liverpool, Arsenal, Manchester City, Tottenham, Chelsea
  // La Liga
  529, 541, 530, 548, 727, // Barcelona, Real Madrid, Atletico Madrid, Real Sociedad, Athletic Bilbao
  // Serie A
  489, 492, 496, 500, 502, 505, // AC Milan, Napoli, Juventus, Inter, Fiorentina, Lazio
  // Bundesliga
  157, 165, 168, 173, 192, // Bayern Munich, Borussia Dortmund, Bayer Leverkusen, RB Leipzig, Eintracht Frankfurt
  // Champions League popular teams
  85, 81, 212, 548, // Paris Saint Germain, AS Monaco, Real Sociedad, Real Sociedad
];

// Use the prioritized popular countries list
const POPULAR_COUNTRIES = POPULAR_COUNTRIES_ORDER;

/**
 * Enhanced country flag mapping with SportsRadar fallback
 */
export const getCountryFlag = (country: string | null | undefined, leagueFlag?: string | null) => {
  // Use league flag if available and valid
  if (leagueFlag && typeof leagueFlag === 'string' && leagueFlag.trim() !== '') {
    return leagueFlag;
  }

  // Add comprehensive null/undefined check for country
  if (!country || typeof country !== 'string' || country.trim() === '') {
    return '/assets/fallback-logo.svg'; // Default football logo
  }

  const cleanCountry = country.trim();

  // Special handling for Unknown country only
  if (cleanCountry === 'Unknown') {
    return '/assets/fallback-logo.svg'; // Default football logo
  }

  // Special cases for international competitions
  if (cleanCountry === 'World') {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzMzNzNkYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS0yMCA0aDIwbS0yMC04aDIwIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMmE0IDE0IDAgMCAwIDAgMjBBNCAxNCAwIDAgMCAxMiAyIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
  }

  if (cleanCountry === 'Europe') {
    return 'https://flagsapi.com/EU/flat/24.png';
  }

  if (cleanCountry === 'South America') {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzAwN2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSIjZmZmZmZmIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS0yMCA0aDIwbS0yMC04aDIwIiBzdHJva2U9IiMwMDdmZmYiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMmE0IDE0IDAgMCAwIDAgMjBBNCAxNCAwIDAgMCAxMiAyIiBzdHJva2U9IiMwMDdmZmYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
  }

  if (cleanCountry === 'International') {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iI2ZmZDcwMCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSIjZmZmZmZmIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS0yMCA0aDIwbS0yMC04aDIwIiBzdHJva2U9IiNmZmQ3MDAiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMmE0IDE0IDAgMCAwIDAgMjBBNCAxNCAwIDAgMCAxMiAyIiBzdHJva2U9IiNmZmQ3MDAiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
  }

  if (cleanCountry === 'USA') {
    return 'https://flagsapi.com/US/flat/24.png';
  }

  // Comprehensive country code mapping
  const countryCodeMap: { [key: string]: string } = {
    // Major football countries
    'England': 'GB-ENG',
    'Scotland': 'GB-SCT',
    'Wales': 'GB-WLS',
    'Northern Ireland': 'GB-NIR',
    'United States': 'US',
    'South Korea': 'KR',
    'Czech Republic': 'CZ',
    'United Arab Emirates': 'AE',
    'Bosnia & Herzegovina': 'BA',
    'North Macedonia': 'MK',
    'Trinidad & Tobago': 'TT',
    'Ivory Coast': 'CI',
    'Cape Verde': 'CV',
    'Democratic Republic of Congo': 'CD',
    'Curacao': 'CW',
    'Faroe Islands': 'FO',
    'Saudi Arabia': 'SA',
    'South Africa': 'ZA',
    'Costa Rica': 'CR',
    'El Salvador': 'SV',
    'Puerto Rico': 'PR',
    'New Zealand': 'NZ',
    'Dominican Republic': 'DO',
    'Sierra Leone': 'SL',
    'Burkina Faso': 'BF',
    'Guinea-Bissau': 'GW',
    'Equatorial Guinea': 'GQ',
    'Central African Republic': 'CF',
    'Papua New Guinea': 'PG',
    'Solomon Islands': 'SB',
    'Marshall Islands': 'MH',
    'Cook Islands': 'CK',
    'American Samoa': 'AS',
    'British Virgin Islands': 'VG',
    'Cayman Islands': 'KY',
    'Turks and Caicos Islands': 'TC',
    'Saint Kitts and Nevis': 'KN',
    'Saint Vincent and the Grenadines': 'VC',
    'Antigua and Barbuda': 'AG',
    'São Tomé and Príncipe': 'ST',
    'North Korea': 'KP',
    'East Timor': 'TL',
    'Vatican City': 'VA',
    // Common countries that might appear
    'Brazil': 'BR',
    'Argentina': 'AR',
    'Germany': 'DE',
    'France': 'FR',
    'Italy': 'IT',
    'Spain': 'ES',
    'Portugal': 'PT',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'Switzerland': 'CH',
    'Austria': 'AT',
    'Poland': 'PL',
    'Turkey': 'TR',
    'Russia': 'RU',
    'Ukraine': 'UA',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Finland': 'FI',
    'Greece': 'GR',
    'Croatia': 'HR',
    'Serbia': 'RS',
    'Romania': 'RO',
    'Bulgaria': 'BG',
    'Hungary': 'HU',
    'Slovenia': 'SI',
    'Slovakia': 'SK',
    'Lithuania': 'LT',
    'Latvia': 'LV',
    'Estonia': 'EE',
    'Ireland': 'IE',
    'Iceland': 'IS',
    'Luxembourg': 'LU',
    'Malta': 'MT',
    'Cyprus': 'CY',
    'Japan': 'JP',
    'China': 'CN',
    'India': 'IN',
    'Australia': 'AU',
    'Canada': 'CA',
    'Mexico': 'MX',
    'Colombia': 'CO',
    'Peru': 'PE',
    'Chile': 'CL',
    'Uruguay': 'UY',
    'Paraguay': 'PY',
    'Bolivia': 'BO',
    'Venezuela': 'VE',
    'Ecuador': 'EC',
    'Nigeria': 'NG',
    'Ghana': 'GH',
    'Senegal': 'SN',
    'Morocco': 'MA',
    'Tunisia': 'TN',
    'Algeria': 'DZ',
    'Egypt': 'EG',
    'Cameroon': 'CM',
    'Kenya': 'KE',
    'Ethiopia': 'ET',
    'South Sudan': 'SS',
    'Mali': 'ML',
    'Niger': 'NE',
    'Chad': 'TD',
    'Libya': 'LY',
    'Sudan': 'SD',
    'Israel': 'IL',
    'Jordan': 'JO',
    'Lebanon': 'LB',
    'Syria': 'SY',
    'Iraq': 'IQ',
    'Iran': 'IR',
    'Afghanistan': 'AF',
    'Pakistan': 'PK',
    'Bangladesh': 'BD',
    'Sri Lanka': 'LK',
    'Myanmar': 'MM',
    'Thailand': 'TH',
    'Vietnam': 'VN',
    'Cambodia': 'KH',
    'Laos': 'LA',
    'Malaysia': 'MY',
    'Singapore': 'SG',
    'Indonesia': 'ID',
    'Philippines': 'PH',
    'Brunei': 'BN',
    'Mongolia': 'MN',
    'Kazakhstan': 'KZ',
    'Uzbekistan': 'UZ',
    'Turkmenistan': 'TM',
    'Kyrgyzstan': 'KG',
    'Tajikistan': 'TJ'
  };

  // Use country mapping, fallback to SportsRadar for unknown countries
  let countryCode = 'XX';
  if (countryCodeMap[cleanCountry]) {
    countryCode = countryCodeMap[cleanCountry];
    return `https://flagsapi.com/${countryCode}/flat/24.png`;
  } else {
    console.warn('Unknown country for flag mapping, trying SportsRadar fallback:', cleanCountry);
    // Try SportsRadar flags API as fallback
    return `https://api.sportradar.com/flags-images-t3/sr/country-flags/flags/${cleanCountry.toLowerCase().replace(/\s+/g, '_')}/flag_24x24.png`;
  }
};

/**
 * Enhanced filtering logic for fixtures based on geographic/regional preferences
 */
export const applyPriorityFiltering = (allFixtures: any[], selectedDate: string) => {
  if (!allFixtures?.length) return [];

  const filtered = allFixtures.filter(fixture => {
    // Date filtering - ensure exact date match
    const fixtureDate = new Date(fixture.fixture.date);
    const expectedDate = new Date(selectedDate);

    const fixtureDateStr = format(fixtureDate, 'yyyy-MM-dd');
    const expectedDateStr = format(expectedDate, 'yyyy-MM-dd');

    if (fixtureDateStr !== expectedDateStr) {
      return false;
    }

    // Apply exclusion filters
    if (shouldExcludeFixture(
      fixture.league.name,
      fixture.teams.home.name,
      fixture.teams.away.name
    )) {
      return false;
    }

    // Additional exclusions for popular leagues card
    const leagueName = fixture.league.name?.toLowerCase() || '';
    if (leagueName.includes('oberliga') || 
        leagueName.includes('usl w league') || 
        leagueName.includes('wpsl') ||
        leagueName.includes('npsl') ||
        leagueName.includes('national premier soccer league') ||
        leagueName.includes('usl league two') ||
        leagueName.includes('usl championship') ||
        leagueName.includes('usl league one') ||
        leagueName.includes('nwsl')) {
      return false;
    }

    // Extra USA filtering - if it's from USA and not MLS (253) or MLS Next Pro (254), exclude it
    if (fixture.league.country?.toLowerCase() === 'usa' || 
        fixture.league.country?.toLowerCase() === 'united states') {
      const allowedUSALeagues = [253, 254];
      if (!allowedUSALeagues.includes(fixture.league.id)) {
        return false;
      }
    }

    // Skip fixtures with null or undefined country
    if (!fixture.league.country) {
      return false;
    }

    // Enhanced geographic/regional filtering logic
    const countryName = fixture.league.country?.toLowerCase() || '';
    const leagueId = fixture.league.id;
    const leagueNameLower = fixture.league.name?.toLowerCase() || '';

    // Check for international competitions first (more permissive)
    // Prioritize men's international friendlies (exclude women's friendlies)
    const isWorldFriendlies = leagueNameLower.includes('friendlies') && 
                             countryName.includes('world') && 
                             !leagueNameLower.includes('women');

    // Enhanced CONMEBOL detection
    const isCONMEBOLCompetition = 
      leagueNameLower.includes('copa america') ||
      leagueNameLower.includes('copa libertadores') ||
      leagueNameLower.includes('copa sudamericana') ||
      leagueNameLower.includes('conmebol') ||
      leagueNameLower.includes('libertadores') ||
      leagueNameLower.includes('sudamericana') ||
      countryName.includes('south america') ||
      leagueId === 9 || leagueId === 11 || leagueId === 13; // Copa America, Libertadores, Sudamericana IDs

    // Enhanced international competitions detection
    const isInternationalCompetition = 
      leagueNameLower.includes('champions league') ||
      leagueNameLower.includes('europa league') ||
      leagueNameLower.includes('conference league') ||
      leagueNameLower.includes('world cup') ||
      leagueNameLower.includes('fifa club world cup') ||
      leagueNameLower.includes('fifa cup') ||
      leagueNameLower.includes('euro') ||
      leagueNameLower.includes('uefa') ||
      leagueNameLower.includes('fifa') ||
      leagueNameLower.includes('nations league') ||
      leagueNameLower.includes('intercontinental') ||
      leagueNameLower.includes('super cup') ||
      isWorldFriendlies ||
      isCONMEBOLCompetition ||
      TIER_2_INTERNATIONAL.some(region => countryName.includes(region.toLowerCase())) ||
      countryName.includes('world') ||
      countryName.includes('europe') ||
      countryName.includes('international');

    // Allow all international competitions through
    if (isInternationalCompetition) {
      return true;
    }

    // Check if it's a popular country with geographic preferences
    const matchingCountry = POPULAR_COUNTRIES.find(country => 
      countryName.includes(country.toLowerCase())
    );

    if (!matchingCountry) {
      return false;
    }

    // Enhanced filtering based on geographic tiers
    const countryKey = matchingCountry;

    // Tier 1 countries (England, Spain, Italy, Germany, France) - show all major leagues
    if (TIER_1_COUNTRIES.map(c => c.toLowerCase()).includes(countryKey.toLowerCase())) {
      const countryLeagues = POPULAR_LEAGUES_BY_COUNTRY[countryKey] || [];
      if (countryLeagues.length > 0 && !countryLeagues.includes(leagueId)) {
        return false;
      }
    }

    // Tier 3 countries (Brazil, Saudi Arabia, Egypt, USA, United Arab Emirates) - be more permissive for Brazil and Egypt
    else if (TIER_3_OTHER_POPULAR.map(c => c.toLowerCase()).includes(countryKey.toLowerCase())) {
      // For Brazil, allow Serie A, Serie B, Serie C, and Serie D
      if (countryKey.toLowerCase() === 'brazil') {
        const brazilLeagues = [71, 72, 73, 74]; // Serie A, Serie B, Serie C, Serie D
        if (!brazilLeagues.includes(leagueId)) {
          return false;
        }
      } 
      // For Egypt, allow all Premier League matches (ID: 233)
      else if (countryKey.toLowerCase() === 'egypt') {
        const egyptLeagues = [233]; // Egyptian Premier League
        if (!egyptLeagues.includes(leagueId)) {
          return false;
        }
      }
      // For Colombia, allow Liga BetPlay (ID: 239)
      else if (countryKey.toLowerCase() === 'colombia') {
        const colombiaLeagues = [239]; // Liga BetPlay (Colombian Primera A)
        if (!colombiaLeagues.includes(leagueId)) {
          return false;
        }
      }
      // For United Arab Emirates, allow UAE Pro League (ID: 301)
      else if (countryKey.toLowerCase() === 'united arab emirates') {
        const uaeLeagues = [301]; // UAE Pro League
        if (!uaeLeagues.includes(leagueId)) {
          return false;
        }
      }
      else {
        // For other Tier 3 countries (Saudi Arabia), be very restrictive
        const countryLeagues = POPULAR_LEAGUES_BY_COUNTRY[countryKey] || [];
        if (!countryLeagues.includes(leagueId)) {
          return false;
        }
      }
    }

    return true;
  });

  return filtered;
};

/**
 * Priority system for sorting leagues
 * Define priority categories: UEFA > FIFA > Popular Country Leagues > Friendlies > CONMEBOL > Regular League
 */
export const getPriority = (leagueName: string, leagueId: number, country: string) => {
  const name = leagueName.toLowerCase();
  const countryLower = country.toLowerCase();

  // 1. UEFA competitions (highest priority)
  if (name.includes('uefa') || name.includes('champions league') || 
      name.includes('europa league') || name.includes('conference league') ||
      leagueId === 2 || leagueId === 3 || leagueId === 848) {
    return 1;
  }

  // 2. FIFA competitions
  if (name.includes('fifa') || name.includes('world cup') || 
      name.includes('club world cup') || leagueId === 1 || leagueId === 15) {
    return 2;
  }

  // 3. Popular Country Leagues (Top domestic leagues from major countries)
  const popularCountryLeagues = [
    // England Premier League
    { id: 39, country: 'england' },
    // Spain La Liga
    { id: 140, country: 'spain' },
    // Italy Serie A
    { id: 135, country: 'italy' },
    // Germany Bundesliga
    { id: 78, country: 'germany' },
    // France Ligue 1
    { id: 61, country: 'france' },
    // Brazil Serie A
    { id: 71, country: 'brazil' },
    // Saudi Pro League
    { id: 307, country: 'saudi arabia' },
    // Egypt Premier League
    { id: 233, country: 'egypt' },
    // Major League Soccer (USA)
    { id: 253, country: 'usa' },
    { id: 254, country: 'usa' }
  ];

  const isPopularCountryLeague = popularCountryLeagues.some(league => 
    league.id === leagueId || 
    (countryLower.includes(league.country) && (
      (league.country === 'england' && name.includes('premier league')) ||
      (league.country === 'spain' && name.includes('la liga')) ||
      (league.country === 'italy' && name.includes('serie a')) ||
      (league.country === 'germany' && name.includes('bundesliga')) ||
      (league.country === 'france' && name.includes('ligue 1')) ||
      (league.country === 'brazil' && name.includes('serie a')) ||
      (league.country === 'saudi arabia' && (name.includes('saudi pro league') || name.includes('saudi professional league'))) ||
      (league.country === 'egypt' && name.includes('premier league')) ||
      (league.country === 'usa' && (name.includes('major league soccer') || name.includes('mls')))
    ))
  );

  if (isPopularCountryLeague) {
    return 3;
  }

  // 4. Friendlies
  if (name.includes('friendlies') || name.includes('club friendly') || leagueId === 10) {
    return 4;
  }

  // 5. CONMEBOL competitions
  if (name.includes('conmebol') || name.includes('libertadores') || 
      name.includes('sudamericana') || name.includes('copa america') ||
      leagueId === 9 || leagueId === 11 || leagueId === 13 ||
      countryLower.includes('south america')) {
    return 5;
  }

  // 6. Regular leagues (everything else)
  return 6;
};

/**
 * Sort leagues by priority
 */
export const sortLeaguesByPriority = (allLeaguesFlat: any[]) => {
  return allLeaguesFlat.sort((a: any, b: any) => {
    const aLeagueName = a.league?.name || '';
    const bLeagueName = b.league?.name || '';
    const aLeagueId = a.league?.id;
    const bLeagueId = b.league?.id;

    const aPriority = getPriority(aLeagueName, aLeagueId, a.country || '');
    const bPriority = getPriority(bLeagueName, bLeagueId, b.country || '');

    // Sort by priority first
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Within same priority, sort by specific order for UEFA competitions
    if (aPriority === 1 && bPriority === 1) {
      const uefaOrder = ['champions league', 'europa league', 'conference league'];
      const aUefaIndex = uefaOrder.findIndex(comp => aLeagueName.toLowerCase().includes(comp));
      const bUefaIndex = uefaOrder.findIndex(comp => bLeagueName.toLowerCase().includes(comp));

      if (aUefaIndex !== -1 && bUefaIndex !== -1) {
        return aUefaIndex - bUefaIndex;
      }
      if (aUefaIndex !== -1) return -1;
      if (bUefaIndex !== -1) return 1;
    }

    // Within same priority, sort alphabetically
    return aLeagueName.toLowerCase().localeCompare(bLeagueName.toLowerCase());
  });
};

/**
 * Group fixtures by country and league with comprehensive filtering
 */
export const groupFixturesByCountryAndLeague = (allFixtures: any[]) => {
  return allFixtures.reduce((acc: any, fixture: any) => {
    // Add comprehensive null checks
    if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
      console.warn('Invalid fixture data:', fixture);
      return acc;
    }

    // Ensure league has required properties
    const league = fixture.league;
    if (!league.id || !league.name) {
      console.warn('Invalid league data:', league);
      return acc;
    }

    // Use centralized exclusion filter
    const leagueName = league.name || '';
    const homeTeamName = fixture.teams?.home?.name || '';
    const awayTeamName = fixture.teams?.away?.name || '';

    // Check if fixture should be excluded using centralized filter
    if (shouldExcludeFixture(leagueName, homeTeamName, awayTeamName)) {
      return acc;
    }

    const country = league.country;

    // Skip fixtures without a valid country, but keep World and Europe competitions
    if (!country || 
        country === null ||
        country === undefined ||
        typeof country !== 'string' || 
        country.trim() === '' || 
        country.toLowerCase() === 'unknown') {

      // Allow World competitions, CONMEBOL, and Friendlies to pass through
      if (league.name && (
          league.name.toLowerCase().includes('world') || 
          league.name.toLowerCase().includes('europe') ||
          league.name.toLowerCase().includes('uefa') ||
          league.name.toLowerCase().includes('fifa') ||
          league.name.toLowerCase().includes('fifa club world cup') ||
          league.name.toLowerCase().includes('champions') ||
          league.name.toLowerCase().includes('conference') ||
          league.name.toLowerCase().includes('friendlies') ||
          league.name.toLowerCase().includes('conmebol') ||
          league.name.toLowerCase().includes('copa america') ||
          league.name.toLowerCase().includes('copa libertadores') ||
          league.name.toLowerCase().includes('copa sudamericana'))) {

        // Determine the appropriate country key
        let countryKey = 'World';
        if (league.name.toLowerCase().includes('fifa club world cup') || 
            league.name.toLowerCase().includes('club world cup')) {
          countryKey = 'International';
        } else if (league.name.toLowerCase().includes('conmebol') ||
            league.name.toLowerCase().includes('copa america') ||
            league.name.toLowerCase().includes('copa libertadores') ||
            league.name.toLowerCase().includes('copa sudamericana')) {
          countryKey = 'South America';
        } else if (league.name.toLowerCase().includes('uefa') ||
                   league.name.toLowerCase().includes('europe') ||
                   league.name.toLowerCase().includes('champions') ||
                   league.name.toLowerCase().includes('conference')) {
          countryKey = 'Europe';
        }

        if (!acc[countryKey]) {
          acc[countryKey] = {
            country: countryKey,
            flag: getCountryFlag(countryKey),
            leagues: {},
            hasPopularLeague: true
          };
        }
        const leagueId = league.id;

        if (!acc[countryKey].leagues[leagueId]) {
          acc[countryKey].leagues[leagueId] = {
            league: { ...league, country: countryKey },
            matches: [],
            isPopular: POPULAR_LEAGUES.includes(leagueId),
            isFriendlies: league.name.toLowerCase().includes('friendlies')
          };
        }
        acc[countryKey].leagues[leagueId].matches.push(fixture);
        return acc;
      }

      console.log(`Skipping fixture with invalid country: ${country}, league: ${league.name}`);
      return acc;
    }

    const validCountry = country.trim();

    // Only allow valid country names, World, and Europe
    if (validCountry !== 'World' && validCountry !== 'Europe' && validCountry.length === 0) {
      console.warn('Skipping fixture with empty country name:', country, fixture);
      return acc;
    }

    const leagueId = league.id;
    if (!acc[country]) {
      acc[country] = {
        country,
        flag: getCountryFlag(country, league.flag),
        leagues: {},
        hasPopularLeague: false
      };
    }

    // Check if this is a popular league for this country
    const countryPopularLeagues = POPULAR_LEAGUES_BY_COUNTRY[country] || [];
    const isPopularForCountry = countryPopularLeagues.includes(leagueId);
    const isGloballyPopular = POPULAR_LEAGUES.includes(leagueId);

    if (isPopularForCountry || isGloballyPopular) {
      acc[country].hasPopularLeague = true;
    }

    if (!acc[country].leagues[leagueId]) {
      acc[country].leagues[leagueId] = {
        league: {
          ...league,
          logo: league.logo || 'https://media.api-sports.io/football/leagues/1.png'
        },
        matches: [],
        isPopular: isPopularForCountry || isGloballyPopular,
        isPopularForCountry: isPopularForCountry,
        isFriendlies: false
      };
    }

    // Validate team data before adding
    if (fixture.teams.home && fixture.teams.away && 
        fixture.teams.home.name && fixture.teams.away.name) {
      acc[country].leagues[leagueId].matches.push({
        ...fixture,
        teams: {
          home: {
            ...fixture.teams.home,
            logo: fixture.teams.home.logo || '/assets/fallback-logo.svg'
          },
          away: {
            ...fixture.teams.away,
            logo: fixture.teams.away.logo || '/assets/fallback-logo.svg'
          }
        }
      });
    }

    return acc;
  }, {});
};

/**
 * Filter countries to show only popular ones
 */
export const filterPopularCountries = (fixturesByCountry: any) => {
  return Object.values(fixturesByCountry).filter((countryData: any) => {
    // Add comprehensive null checks
    if (!countryData || typeof countryData !== 'object') {
      return false;
    }

    // Add null check for country before string operations with safe handling
    const countryStr = safeSubstring(countryData.country, 0);
    if (!countryStr || countryStr.trim() === '') {
      return false;
    }

    const countryName = countryStr.trim().toLowerCase();

    // Exclude Argentina explicitly
    if (countryName === 'argentina') {
      return false;
    }

    // Always include countries with popular leagues that are in our popular countries list
    if (countryData.hasPopularLeague && POPULAR_COUNTRIES_ORDER.some(country => 
      safeSubstring(countryName, 0).toLowerCase() === safeSubstring(country, 0).toLowerCase()
    )) {
      return true;
    }

    // Include if it's one of the popular countries (exact match for better filtering)
    return POPULAR_COUNTRIES_ORDER.some(country => 
      safeSubstring(countryName, 0).toLowerCase() === safeSubstring(country, 0).toLowerCase()
    );
  });
};

// Export constants for use in other components
export {
  POPULAR_LEAGUES,
  POPULAR_LEAGUES_BY_COUNTRY,
  POPULAR_COUNTRIES,
  POPULAR_COUNTRIES_ORDER,
  POPULAR_TEAMS,
  TIER_1_COUNTRIES,
  TIER_2_INTERNATIONAL,
  TIER_3_OTHER_POPULAR
};