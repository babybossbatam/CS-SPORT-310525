// Flag utility functions with SportsRadar fallback support

import { testImageUrl, findWorkingLogoUrl, generateLogoSources } from './MyAPIFallback';

export { countryCodeMap };

/**
 * Get country code from country name using the centralized mapping
 */
export function getCountryCode(countryName: string): string | null {
  const normalizedCountry = countryName.trim();
  let countryCode = countryCodeMap[normalizedCountry];
  
  // If not found, try with spaces instead of hyphens
  if (!countryCode && normalizedCountry.includes('-')) {
    const spaceVersion = normalizedCountry.replace(/-/g, ' ');
    countryCode = countryCodeMap[spaceVersion];
  }
  
  // If not found, try with hyphens instead of spaces
  if (!countryCode && normalizedCountry.includes(' ')) {
    const hyphenVersion = normalizedCountry.replace(/\s+/g, '-');
    countryCode = countryCodeMap[hyphenVersion];
  }
  
  return countryCode || null;
}

// Enhanced country code mapping for Flagpedia with normalized variations
const countryCodeMap: { [key: string]: string } = {
  'England': 'GB-ENG',
  'Scotland': 'GB-SCT', 
  'Wales': 'GB-WLS',
  'Northern Ireland': 'GB-NIR',
  'Spain': 'ES',
  'Germany': 'DE',
  'France': 'FR',
  'Italy': 'IT',
  'Netherlands': 'NL',
  'Portugal': 'PT',
  'Belgium': 'BE',
  'Turkey': 'TR',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Denmark': 'DK',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Poland': 'PL',
  'Czech Republic': 'CZ',
  'Czech-Republic': 'CZ',
  'Croatia': 'HR',
  'Serbia': 'RS',
  'Greece': 'GR',
  'Ukraine': 'UA',
  'Russia': 'RU',
  'Bulgaria': 'BG',
  'Romania': 'RO',
  'Hungary': 'HU',
  'Slovakia': 'SK',
  'Slovenia': 'SI',
  'Bosnia and Herzegovina': 'BA',
  'Bosnia': 'BA',
  'North Macedonia': 'MK',
  'Montenegro': 'ME',
  'Albania': 'AL',
  'Kosovo': 'XK',
  'Moldova': 'MD',
  'Belarus': 'BY',
  'Lithuania': 'LT',
  'Latvia': 'LV',
  'Estonia': 'EE',
  'Finland': 'FI',
  'Iceland': 'IS',
  'Ireland': 'IE',
  'Malta': 'MT',
  'Cyprus': 'CY',
  'Luxembourg': 'LU',
  'Liechtenstein': 'LI',
  'Monaco': 'MC',
  'Andorra': 'AD',
  'San Marino': 'SM',
  'Vatican City': 'VA',
  'Brazil': 'BR',
  'Argentina': 'AR',
  'Mexico': 'MX',
  'Colombia': 'CO',
  'Peru': 'PE',
  'Chile': 'CL',
  'Uruguay': 'UY',
  'Paraguay': 'PY',
  'Bolivia': 'BO',
  'Ecuador': 'EC',
  'Venezuela': 'VE',
  'Guyana': 'GY',
  'Suriname': 'SR',
  'French Guiana': 'GF',
  'United States': 'US',
  'USA': 'US',
  'Canada': 'CA',
  'Costa Rica': 'CR',
  'Costa-Rica': 'CR',
  'Panama': 'PA',
  'Guatemala': 'GT',
  'Honduras': 'HN',
  'El Salvador': 'SV',
  'Nicaragua': 'NI',
  'Belize': 'BZ',
  'Jamaica': 'JM',
  'Trinidad and Tobago': 'TT',
  'Cuba': 'CU',
  'Dominican Republic': 'DO',
  'Haiti': 'HT',
  'Barbados': 'BB',
  'Bahamas': 'BS',
  'Japan': 'JP',
  'South Korea': 'KR',
  'South-Korea': 'KR',
  'China': 'CN',
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'New-Zealand': 'NZ',
  'India': 'IN',
  'Thailand': 'TH',
  'Vietnam': 'VN',
  'Malaysia': 'MY',
  'Singapore': 'SG',
  'Indonesia': 'ID',
  'Philippines': 'PH',
  'Myanmar': 'MM',
  'Cambodia': 'KH',
  'Laos': 'LA',
  'Brunei': 'BN',
  'East Timor': 'TL',
  'Pakistan': 'PK',
  'Bangladesh': 'BD',
  'Sri Lanka': 'LK',
  'Nepal': 'NP',
  'Bhutan': 'BT',
  'Maldives': 'MV',
  'Afghanistan': 'AF',
  'Iran': 'IR',
  'Iraq': 'IQ',
  'Saudi Arabia': 'SA',
  'United Arab Emirates': 'AE',
  'Qatar': 'QA',
  'Kuwait': 'KW',
  'Bahrain': 'BH',
  'Oman': 'OM',
  'Yemen': 'YE',
  'Jordan': 'JO',
  'Lebanon': 'LB',
  'Syria': 'SY',
  'Israel': 'IL',
  'Palestine': 'PS',
  'Egypt': 'EG',
  'Libya': 'LY',
  'Tunisia': 'TN',
  'Algeria': 'DZ',
  'Morocco': 'MA',
  'Sudan': 'SD',
  'South Sudan': 'SS',
  'Ethiopia': 'ET',
  'Eritrea': 'ER',
  'Djibouti': 'DJ',
  'Somalia': 'SO',
  'Kenya': 'KE',
  'Uganda': 'UG',
  'Tanzania': 'TZ',
  'Rwanda': 'RW',
  'Burundi': 'BI',
  'Nigeria': 'NG',
  'Ghana': 'GH',
  'Ivory Coast': 'CI',
  'Senegal': 'SN',
  'Mali': 'ML',
  'Burkina Faso': 'BF',
  'Niger': 'NE',
  'Chad': 'TD',
  'Central African Republic': 'CF',
  'Cameroon': 'CM',
  'Equatorial Guinea': 'GQ',
  'Gabon': 'GA',
  'Republic of the Congo': 'CG',
  'Democratic Republic of the Congo': 'CD',
  'Congo-DR': 'CD',
  'Angola': 'AO',
  'Zambia': 'ZM',
  'Zimbabwe': 'ZW',
  'Botswana': 'BW',
  'Namibia': 'NA',
  'South Africa': 'ZA',
  'Lesotho': 'LS',
  'Eswatini': 'SZ',
  'Madagascar': 'MG',
  'Mauritius': 'MU',
  'Seychelles': 'SC',
  'Comoros': 'KM',
  'Cape Verde': 'CV',
  'Guinea-Bissau': 'GW',
  'Guinea': 'GN',
  'Sierra Leone': 'SL',
  'Liberia': 'LR',
  'Togo': 'TG',
  'Benin': 'BJ',
  'Mauritania': 'MR',
  'Gambia': 'GM',
  // Additional missing countries from iban.com
  'Faroe Islands': 'FO',
  'Faroe-Islands': 'FO',
  'Faroes': 'FO',
  'Greenland': 'GL',
  'Isle of Man': 'IM',
  'Isle-of-Man': 'IM',
  'Jersey': 'JE',
  'Guernsey': 'GG',
  'Aland Islands': 'AX',
  'Åland Islands': 'AX',
  // Special territories and regions
  'Macao': 'MO',
  'Macau': 'MO',
  'Hong Kong': 'HK',
  'Taiwan': 'TW',
  'Malawi': 'MW',
  'Georgia': 'GE',
  'Uzbekistan': 'UZ',
  // Additional mappings for common variations and missing countries
  'Tajikistan': 'TJ',
  'Turkmenistan': 'TM',
  'Kyrgyzstan': 'KG',
  'Kazakhstan': 'KZ',
  'Azerbaijan': 'AZ',
  'Armenia': 'AM',
  'Mongolia': 'MN',
  'North Korea': 'KP',
  'Timor-Leste': 'TL',
  'Papua New Guinea': 'PG',
  'Fiji': 'FJ',
  'Samoa': 'WS',
  'Tonga': 'TO',
  'Vanuatu': 'VU',
  'Solomon Islands': 'SB',
  'Palau': 'PW',
  'Micronesia': 'FM',
  'Marshall Islands': 'MH',
  'Kiribati': 'KI',
  'Nauru': 'NR',
  'Tuvalu': 'TV',
  'Cook Islands': 'CK',
  'Niue': 'NU',
  'American Samoa': 'AS',
  'Guam': 'GU',
  'Northern Mariana Islands': 'MP',
  'French Polynesia': 'PF',
  'New Caledonia': 'NC',
  'Wallis and Futuna': 'WF',
  // Common alternative names
  'United Kingdom': 'GB',
  'UK': 'GB',
  'Great Britain': 'GB',
  'Britain': 'GB',
  'Northern Ireland': 'GB-NIR',
  'Bosnia & Herzegovina': 'BA',
  'Bosnia and Herzegovina': 'BA',
  'Herzegovina': 'BA',
  'Czech Republic': 'CZ',
  'Czech-Republic': 'CZ',
  'Czechia': 'CZ',
  'North Macedonia': 'MK',
  'Macedonia': 'MK',
  'FYROM': 'MK',
  'South Korea': 'KR',
  'North Korea': 'KP',
  'Korea Republic': 'KR',
  'Korea DPR': 'KP',
  'Republic of Korea': 'KR',
  'Democratic Republic of Korea': 'KP',
  'Ivory Coast': 'CI',
  'Côte d\'Ivoire': 'CI',
  'Vatican': 'VA',
  'Holy See': 'VA',
  'Palestine': 'PS',
  'Macao SAR': 'MO',
  'Hong Kong SAR': 'HK',
  'Taiwan Province of China': 'TW',
  'Chinese Taipei': 'TW',
  'Great Britain': 'GB',
  'Britain': 'GB',
  'Republic of Ireland': 'IE',
  'Republic of Korea': 'KR',
  'Democratic Republic of Korea': 'KP',
  'DPRK': 'KP',
  'ROK': 'KR',
  'PRC': 'CN',
  'ROC': 'TW',
  'Hong Kong SAR': 'HK',
  'Macau SAR': 'MO',
  'Macao SAR': 'MO',
  // Additional variations
  'RSA': 'ZA',
  'South-Africa': 'ZA',
  'República de Sudáfrica': 'ZA',
  'Suid-Afrika': 'ZA'
};

import { flagCache, getFlagCacheKey, validateLogoUrl } from './logoCache';

// Flag preloading system
const FLAG_STORAGE_KEY = 'cssport_flag_cache';
const FLAG_PRELOAD_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save flag cache to localStorage for persistence
 */
export function saveFlagCacheToStorage(): void {
  try {
    const cache = (flagCache as any).cache;
    if (cache instanceof Map) {
      const cacheData = {
        timestamp: Date.now(),
        flags: Array.from(cache.entries())
      };
      localStorage.setItem(FLAG_STORAGE_KEY, JSON.stringify(cacheData));
      console.log(`💾 Saved ${cache.size} flags to localStorage`);
    }
  } catch (error) {
    console.warn('Failed to save flag cache to storage:', error);
  }
}

/**
 * Load flag cache from localStorage on startup
 */
export function loadFlagCacheFromStorage(): void {
  try {
    const stored = localStorage.getItem(FLAG_STORAGE_KEY);
    if (!stored) {
      console.log('🏁 No stored flag cache found');
      return;
    }

    const cacheData = JSON.parse(stored);
    const age = Date.now() - cacheData.timestamp;
    
    // Check if stored cache is not too old
    if (age > FLAG_PRELOAD_EXPIRY) {
      console.log('🕐 Stored flag cache is too old, clearing');
      localStorage.removeItem(FLAG_STORAGE_KEY);
      return;
    }

    // Restore flags to cache
    const cache = (flagCache as any).cache;
    if (cache instanceof Map && cacheData.flags) {
      let restoredCount = 0;
      for (const [key, value] of cacheData.flags) {
        // Only restore if not already in cache and not too old
        if (!cache.has(key)) {
          cache.set(key, value);
          restoredCount++;
        }
      }
      console.log(`🔄 Restored ${restoredCount} flags from localStorage (age: ${Math.round(age / 1000 / 60)} min)`);
    }
  } catch (error) {
    console.warn('Failed to load flag cache from storage:', error);
    localStorage.removeItem(FLAG_STORAGE_KEY);
  }
}

/**
 * Auto-save flag cache periodically and on page unload
 */
export function initializeFlagCachePersistence(): void {
  // Load existing cache on startup
  loadFlagCacheFromStorage();

  // Save cache periodically (every 5 minutes)
  setInterval(saveFlagCacheToStorage, 5 * 60 * 1000);

  // Save cache when page is unloaded
  window.addEventListener('beforeunload', saveFlagCacheToStorage);
  
  // Save cache when visibility changes (tab switch, etc.)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      saveFlagCacheToStorage();
    }
  });
}

/**
 * Generate multiple flag sources for a country with improved reliability
 */
export function generateFlagSources(country: string): string[] {
  const cleanCountry = country.trim();
  const sources: string[] = [];

  // Special cases for international competitions
  if (cleanCountry === 'World') {
    return ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzMzNzNkYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS0yMCA0aDIwbS0yMC04aDIwIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMmE0IDE0IDAgMCAwIDAgMjBBNCAxNCAwIDAgMCAxMiAyIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K'];
  }

  if (cleanCountry === 'Europe') {
    return ['https://flagcdn.com/w40/eu.png', 'https://media.api-sports.io/flags/eu.svg'];
  }

  const countryCode = countryCodeMap[cleanCountry];

  if (countryCode) {
    // 1. Primary: FlagCDN (most reliable for standard codes)
    if (countryCode.length === 2) {
      sources.push(`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`);
      sources.push(`https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`);
    }

    // 2. Country Flags API (from simplelocalize.io recommendations)
    if (countryCode.length === 2) {
      sources.push(`https://countryflags.io/${countryCode.toLowerCase()}/flat/64.png`);
    }

    // 3. Secondary: API-Sports flags (good alternative)
    sources.push(`https://media.api-sports.io/flags/${countryCode.toLowerCase()}.svg`);

    // 4. Additional FlagCDN formats
    if (countryCode.length === 2) {
      sources.push(`https://flagcdn.com/${countryCode.toLowerCase()}.svg`);
      sources.push(`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`);
    }

    // 5. Special handling for GB subdivision codes (England, Scotland, etc.)
    if (countryCode.startsWith('GB-')) {
      // Use main GB code for these APIs
      sources.push(`https://countryflags.io/gb/flat/64.png`);
      sources.push(`https://flagcdn.com/w40/gb.png`);
    }

    // 6. RestCountries backup (for 2-letter codes only)
    if (countryCode.length === 2) {
      sources.push(`https://restcountries.com/v3.1/alpha/${countryCode.toLowerCase()}?fields=flags`);
    }

    // 7. Additional reliable sources from simplelocalize.io
    if (countryCode.length === 2) {
      sources.push(`https://cdn.jsdelivr.net/npm/country-flag-emoji-json@2.0.0/dist/images/${countryCode.toLowerCase()}.svg`);
    }
  } else {
    console.warn(`No country code mapping found for: ${cleanCountry}`);

    // Fallback: try common variations for unmapped countries
    const cleanName = cleanCountry.toLowerCase().replace(/\s+/g, '');
    const shortName = cleanName.substring(0, 2);
    sources.push(`https://flagcdn.com/w40/${shortName}.png`);
    sources.push(`https://media.api-sports.io/flags/${shortName}.svg`);
  }

  // 4. Alternative external source (RestCountries)


  // 5. Ultimate fallback


  return sources;
}

/**
 * Get cached flag or fetch with fallback - Prioritize valid flags over fallbacks
 */
export async function getCachedFlag(country: string): Promise<string> {
  const cacheKey = `flag_${country.toLowerCase().replace(/\s+/g, '_')}`;

  console.log(`🔍 getCachedFlag called for: ${country} with cache key: ${cacheKey}`);

  // PRIORITY 1: Check cache first, but be selective about fallbacks
  const cached = flagCache.getCached(cacheKey);
  if (cached) {
    const age = Date.now() - cached.timestamp;
    const ageMinutes = Math.round(age / 1000 / 60);

    console.log(`📦 Cache found for ${country}:`, {
      url: cached.url,
      source: cached.source,
      ageMinutes,
      verified: cached.verified,
      isFallback: cached.url.includes('/assets/fallback-logo.svg')
    });

    // If we have a valid flag (not fallback), use it immediately
    if (!cached.url.includes('/assets/fallback-logo.svg')) {
      console.log(`✅ Using cached valid flag for ${country}: ${cached.url} (age: ${ageMinutes} min)`);
      return cached.url;
    }

    // For cached fallbacks, be more aggressive about re-fetching
    // Only use fallback cache if it's very recent (less than 5 minutes) OR if we already tried country code mapping
    const fiveMinutes = 5 * 60 * 1000;
    const countryCode = countryCodeMap[country.trim()];
    
    // If we have a valid country code but cached fallback, always try fresh fetch
    if (countryCode && countryCode.length === 2) {
      console.log(`🔄 Have country code ${countryCode} for ${country} but cached fallback, fetching fresh`);
    } else if (age < fiveMinutes) {
      console.log(`📦 Using very recent cached fallback for ${country} (age: ${ageMinutes} min)`);
      return cached.url;
    } else {
      console.log(`🔄 Cached fallback is old for ${country} (age: ${ageMinutes} min), attempting fresh fetch`);
    }
  } else {
    console.log(`❌ No cache found for ${country} with key: ${cacheKey}`);
  }

  // Special cases first (immediate return, no API calls needed)
  if (country === 'World') {
    const worldFlag = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzMzNzNkYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS0yMCA0aDIwbS0yMC04aDIwIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMmE0IDE0IDAgMCAwIDAgMjBBNCAxNCAwIDAgMCAxMiAyIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
    flagCache.setCached(cacheKey, worldFlag, 'data-world', true);
    return worldFlag;
  }

  if (country === 'Europe') {
    const europeFlag = 'https://flagcdn.com/w40/eu.png';
    flagCache.setCached(cacheKey, europeFlag, 'europe-direct', true);
    return europeFlag;
  }

  console.log(`🔍 Fetching fresh flag for country: ${country}`);
  console.log(`🗺️ Cache status reason: ${cached ? 'Cache expired or fallback' : 'No cache entry'}`);

  // Try country code mapping first (most reliable, no validation needed)
  // Normalize country name for better matching
  const normalizedCountry = country.trim();
  let countryCode = countryCodeMap[normalizedCountry];
  
  // If not found, try with spaces instead of hyphens
  if (!countryCode && normalizedCountry.includes('-')) {
    const spaceVersion = normalizedCountry.replace(/-/g, ' ');
    countryCode = countryCodeMap[spaceVersion];
  }
  
  // If not found, try with hyphens instead of spaces
  if (!countryCode && normalizedCountry.includes(' ')) {
    const hyphenVersion = normalizedCountry.replace(/\s+/g, '-');
    countryCode = countryCodeMap[hyphenVersion];
  }
  
  console.log(`🔍 Country code mapping for ${country}: ${countryCode || 'NOT FOUND'}`);

  if (countryCode && countryCode.length === 2) {
    const flagUrl = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
    console.log(`✅ Using country code flag for ${country}: ${flagUrl}`);
    flagCache.setCached(cacheKey, flagUrl, 'country-code', true);
    console.log(`💾 Cached flag for ${country} with source: country-code`);
    return flagUrl;
  }

  // For countries with special codes (like GB-ENG for England), use fallback immediately
  if (countryCode && countryCode.startsWith('GB-')) {
    const flagUrl = `https://flagcdn.com/w40/gb.png`;
    console.log(`✅ Using GB fallback for ${country}: ${flagUrl}`);
    flagCache.setCached(cacheKey, flagUrl, 'gb-fallback', true);
    return flagUrl;
  }

  // Fallback to API endpoint for unmapped countries (cache the result regardless)
  try {
    const apiUrl = `/api/flags/${encodeURIComponent(country)}`;
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.flagUrl) {
        console.log(`✅ API flag found for ${country}: ${data.flagUrl}`);
        flagCache.setCached(cacheKey, data.flagUrl, 'api-success', true);
        return data.flagUrl;
      }
    }
  } catch (error) {
    console.log(`API request failed for ${country}:`, error);
  }

  // Final fallback - cache it but with shorter duration
  console.log(`⚠️ Using fallback for ${country}, caching for 1 hour`);
  const fallbackUrl = '/assets/fallback-logo.svg';
  flagCache.setCached(cacheKey, fallbackUrl, 'fallback', true);
  return fallbackUrl;
}

/**
 * Get country flag URL with enhanced fallback support using MyAPIFallback system
 * @param country - Country name
 * @param leagueFlag - Optional league flag URL
 * @returns Promise<string> - Flag image URL
 */
export async function getCountryFlagWithFallback(
  country: string | null | undefined, 
  leagueFlag?: string | null
): Promise<string> {
  // Use league flag if available and valid
  if (leagueFlag && typeof leagueFlag === 'string' && leagueFlag.trim() !== '') {
    const isLeagueFlagWorking = await testImageUrl(leagueFlag);
    if (isLeagueFlagWorking) {
      return leagueFlag;
    }
  }

  // Add comprehensive null/undefined check for country
  if (!country || typeof country !== 'string' || country.trim() === '') {
    return '/assets/fallback-logo.svg';
  }

  const cleanCountry = country.trim();

  // Special handling for Unknown country
  if (cleanCountry === 'Unknown') {
    return '/assets/fallback-logo.svg';
  }

  // Generate flag sources and find working one
  const sources = generateFlagSources(cleanCountry);

  for (const source of sources) {
    const isWorking = await testImageUrl(source);
    if (isWorking) {
      console.log(`Flag loaded from source: ${source}`);
      return source;
    }
  }

  // If all fail, return the final fallback
  return '/assets/fallback-logo.svg';
}

// Memory cache for flag URLs
const flagCacheMem = new Map<string, string>();

export const getCountryFlagWithFallbackSync = (country: string, leagueFlag?: string): string => {
  // Check memory cache first
  const cacheKey = `${country}-${leagueFlag || ''}`;
  if (flagCacheMem.has(cacheKey)) {
    return flagCacheMem.get(cacheKey)!;
  }

  let result: string;
  // Use league flag if available and valid
  if (leagueFlag && typeof leagueFlag === 'string' && leagueFlag.trim() !== '') {
    result = leagueFlag;
  } else {
    // Add comprehensive null/undefined check for country
    if (!country || typeof country !== 'string' || country.trim() === '') {
      result = '/assets/fallback-logo.svg';
    } else {
      const cleanCountry = country.trim();

      // Special handling for Unknown country
      if (cleanCountry === 'Unknown') {
        result = '/assets/fallback-logo.svg';
      } else {
        // Special cases for international competitions
        if (cleanCountry === 'World') {
          result = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzMzNzNkYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS0yMCA0aDIwbS0yMC04aDIwIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMmE0IDE0IDAgMCAwIDAgMjBBNCAxNCAwIDAgMCAxMiAyIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
        } else if (cleanCountry === 'Europe') {
          result = 'https://flagcdn.com/w40/eu.png';
        } else {
          // Use country code mapping first for most reliable flags
          const countryCode = countryCodeMap[cleanCountry];
          if (countryCode) {
            // For standard 2-letter codes, use FlagCDN (most reliable)
            if (countryCode.length === 2) {
              result = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
            } else
              // For special codes like GB-ENG, try FlagCDN with main country code
              if (countryCode.startsWith('GB-')) {
                result = `https://flagcdn.com/w40/gb.png`;
              } else {
                // For other special codes, try API-Sports
                result = `https://media.api-sports.io/flags/${countryCode.toLowerCase()}.svg`;
              }
          } else {
            // Fallback to API endpoint for unmapped countries
            result = `/api/flags/${encodeURIComponent(cleanCountry)}`;
          }
        }
      }
    }
  }

  console.log(`Flag result for ${country}:`, result);

  // Cache the result
  flagCacheMem.set(cacheKey, result);

  return result;
};

/**
 * Generate country flag sources with MyFallbackAPI integration for onError handling
 * @param country - Country name
 * @returns Array of flag URLs in priority order
 */
export function generateCountryFlagSources(country: string): string[] {
  const cleanCountry = country.trim();
  const sources: string[] = [];

  // 1. Primary: RapidAPI flags via SportsRadar endpoint
  sources.push(`/api/flags/${encodeURIComponent(cleanCountry)}`);

  // 2. Secondary: MyFallbackAPI sources
  const fallbackSources = generateLogoSources(cleanCountry, 'flag');
  sources.push(...fallbackSources);

  // 3. Third: Multiple flag sources using country code mapping
  const countryCode = countryCodeMap[cleanCountry];
  if (countryCode) {
    if (countryCode.length === 2) {
      sources.push(`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`);
      sources.push(`https://countryflags.io/${countryCode.toLowerCase()}/flat/64.png`);
      sources.push(`https://media.api-sports.io/flags/${countryCode.toLowerCase()}.svg`);
    }
  }

  // 4. Final fallback
  sources.push('/assets/fallback-logo.svg');

  return sources;
}

/**
 * Create fallback handler for country flags with flickering prevention
 * @param country - Country name
 * @returns Error handler function
 */
export function createCountryFlagFallbackHandler(country: string) {
  const sources = generateCountryFlagSources(country);
  let currentIndex = 0;
  let isHandling = false; // Prevent multiple rapid fallback attempts

  return function handleFlagError(event: any) {
    const img = event.currentTarget;

    // Prevent rapid consecutive fallback attempts
    if (isHandling) return;
    isHandling = true;

    setTimeout(() => {
      currentIndex++;

      if (currentIndex < sources.length) {
        const nextSource = sources[currentIndex];
        console.log(`Flag fallback for ${country}: trying source ${currentIndex + 1}/${sources.length}`);
        img.src = nextSource;
      } else {
        console.log(`All flag sources failed for ${country}, using final fallback`);
        img.src = '/assets/fallback-logo.svg';
      }

      isHandling = false;
    }, 100); // Small delay to prevent flickering
  };
}

/**
 * Get SportsRadar flag URL for a country
 * @param country - Country name
 * @returns SportsRadar flag URL
 */
export function getSportsRadarFlag(country: string): string {
  const sanitizedCountry = country.toLowerCase().replace(/\s+/g, '_');
  return `https://api.sportradar.com/flags-images-t3/sr/country-flags/flags/${sanitizedCountry}/flag_24x24.png`;
}

/**
 * Get 365scores CDN flag URL for a country
 * @param country - Country name
 * @returns 365scores CDN flag URL
 */
export function get365ScoresFlag(country: string): string {
  const sanitizedCountry = country.toLowerCase().replace(/\s+/g, '_');
  return `https://imagecache.365scores.com/image/upload/f_png,w_32,h_32,c_limit,q_auto:eco,dpr_2,d_Countries:round:World.png/v5/Countries/round/${sanitizedCountry}`;
}

/**
 * Fetch flag from SportsRadar API endpoint
 * @param country - Country name
 * @returns Promise<string | null> - Flag URL, fallback, or null if should be excluded
 */
export async function fetchSportsRadarFlag(country: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/flags/${encodeURIComponent(country)}`);
    const data = await response.json();

    if (data.success && data.flagUrl) {
      return data.flagUrl;
    } else if (data.shouldExclude) {
      console.warn(`Country ${country} should be excluded due to missing flag from both sources`);
      return null; // Return null to indicate this country should be excluded
    } else {
      return data.fallbackUrl || '/assets/fallback-logo.svg';
    }
  } catch (error) {
    console.error('Error fetching flag from SportsRadar API:', error);
    return null; // Return null on error to exclude problematic countries
  }
}

/**
 * Create an image element with error handling and fallback
 * @param primaryUrl - Primary flag URL
 * @param fallbackUrl - Fallback flag URL
 * @param finalFallback - Final fallback URL (local asset)
 * @returns Promise that resolves to working URL
 */
export async function getFlagWithErrorHandling(
  primaryUrl: string,
  fallbackUrl?: string,
  finalFallback: string = '/assets/fallback-logo.svg'
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      resolve(primaryUrl);
    };

    img.onerror = () => {
      if (fallbackUrl) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          resolve(fallbackUrl);
        };
        fallbackImg.onerror = () => {
          resolve(finalFallback);
        };
        fallbackImg.src = fallbackUrl;
      } else {
        resolve(finalFallback);
      }
    };

    img.src = primaryUrl;
  });
}

// Final fallback SVG
const getFallbackSVG = (countryName: string) => {
  const initials = countryName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="24" height="16" viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="16" fill="#f0f0f0" stroke="#ddd" stroke-width="1"/>
      <text x="12" y="10" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#666">${initials}</text>
    </svg>
  `)}`;
};

// Simplified fallback handler to prevent loops and flickering
export const createImageFallbackHandler = (
  itemName: string,
  itemType: 'team' | 'league' | 'country' = 'team'
) => {
  let hasFallbackRun = false; // Prevent multiple fallback attempts

  return (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget;

    // Prevent multiple fallback attempts
    if (hasFallbackRun) return;
    hasFallbackRun = true;

    // Direct fallback to SVG to prevent loops
    img.src = getFallbackSVG(itemName);
  };
};

/**
 * Analyze all countries from API data and identify missing ones
 */
export function analyzeCountryMappingCoverage(fixtures: any[]): void {
  const allCountries = new Set<string>();
  const mappedCountries = new Set<string>();
  const unmappedCountries = new Set<string>();
  
  // Extract all unique countries from fixtures
  fixtures.forEach(fixture => {
    if (fixture?.league?.country) {
      const country = fixture.league.country.trim();
      allCountries.add(country);
      
      // Check if it's mapped
      if (countryCodeMap[country]) {
        mappedCountries.add(country);
      } else {
        // Try variations
        let found = false;
        if (country.includes('-')) {
          const spaceVersion = country.replace(/-/g, ' ');
          if (countryCodeMap[spaceVersion]) {
            mappedCountries.add(country);
            found = true;
          }
        }
        if (!found && country.includes(' ')) {
          const hyphenVersion = country.replace(/\s+/g, '-');
          if (countryCodeMap[hyphenVersion]) {
            mappedCountries.add(country);
            found = true;
          }
        }
        if (!found) {
          unmappedCountries.add(country);
        }
      }
    }
  });
  
  console.log('🌍 Country Mapping Coverage Analysis:');
  console.log(`📊 Total unique countries in API data: ${allCountries.size}`);
  console.log(`✅ Mapped countries: ${mappedCountries.size}`);
  console.log(`❌ Unmapped countries: ${unmappedCountries.size}`);
  
  if (unmappedCountries.size > 0) {
    console.log('🚫 Missing countries from countryCodeMap:');
    Array.from(unmappedCountries).sort().forEach(country => {
      console.log(`   - "${country}"`);
    });
    
    console.log('\n💡 Suggested additions to countryCodeMap:');
    Array.from(unmappedCountries).sort().forEach(country => {
      // Try to suggest a country code
      const suggested = suggestCountryCode(country);
      console.log(`   '${country}': '${suggested}',`);
    });
  }
  
  console.log('\n📋 All countries found in API data:');
  Array.from(allCountries).sort().forEach(country => {
    const isMapped = mappedCountries.has(country);
    console.log(`   ${isMapped ? '✅' : '❌'} ${country}`);
  });
}

/**
 * Suggest a country code for an unmapped country
 */
function suggestCountryCode(country: string): string {
  // Common patterns and known mappings
  const suggestions: { [key: string]: string } = {
    // Add common variations here
    'United States': 'US',
    'United Kingdom': 'GB',
    'South Korea': 'KR',
    'North Korea': 'KP',
    'Czech Republic': 'CZ',
    'Bosnia and Herzegovina': 'BA',
    'North Macedonia': 'MK',
    'Costa Rica': 'CR',
    'South Africa': 'ZA',
    'New Zealand': 'NZ',
    'Saudi Arabia': 'SA',
    'United Arab Emirates': 'AE',
    'Dominican Republic': 'DO',
    'Trinidad and Tobago': 'TT',
    'El Salvador': 'SV',
  };
  
  if (suggestions[country]) {
    return suggestions[country];
  }
  
  // Generate a best guess based on country name
  const words = country.split(' ');
  if (words.length === 1) {
    // Single word - take first 2 letters
    return country.substring(0, 2).toUpperCase();
  } else {
    // Multiple words - take first letter of each word
    return words.map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
  }
}

/**
 * Check if a country is in the country code mapping and log variations
 */
export function debugCountryMapping(country: string): void {
  const normalizedCountry = country.trim();
  let countryCode = countryCodeMap[normalizedCountry];
  
  console.log(`🔍 Debugging country mapping for: "${country}"`);
  console.log(`📝 Normalized: "${normalizedCountry}"`);
  console.log(`🗺️ Direct mapping: ${countryCode || 'NOT FOUND'}`);
  
  // Try variations
  if (!countryCode && normalizedCountry.includes('-')) {
    const spaceVersion = normalizedCountry.replace(/-/g, ' ');
    countryCode = countryCodeMap[spaceVersion];
    console.log(`🔄 Space variation "${spaceVersion}": ${countryCode || 'NOT FOUND'}`);
  }
  
  if (!countryCode && normalizedCountry.includes(' ')) {
    const hyphenVersion = normalizedCountry.replace(/\s+/g, '-');
    countryCode = countryCodeMap[hyphenVersion];
    console.log(`🔄 Hyphen variation "${hyphenVersion}": ${countryCode || 'NOT FOUND'}`);
  }
  
  // Show similar matches
  const similarMatches = Object.keys(countryCodeMap).filter(key => 
    key.toLowerCase().includes(normalizedCountry.toLowerCase()) ||
    normalizedCountry.toLowerCase().includes(key.toLowerCase())
  );
  
  if (similarMatches.length > 0) {
    console.log(`🎯 Similar matches found:`, similarMatches.map(match => `"${match}" -> ${countryCodeMap[match]}`));
  }
  
  console.log(`✅ Final result: ${countryCode || 'FALLBACK WILL BE USED'}`);
}

/**
 * Get flag cache statistics for debugging
 */
export function getFlagCacheStats(): void {
  const cache = (flagCache as any).cache; // Access the internal Map
  if (cache instanceof Map) {
    const stats = {
      total: cache.size,
      valid: 0,
      fallback: 0,
      expired: 0,
      fresh: 0
    };

    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      const age = now - value.timestamp;
      const maxAge = value.url.includes('/assets/fallback-logo.svg') 
        ? 60 * 60 * 1000  // 1 hour for fallbacks
        : 24 * 60 * 60 * 1000; // 24 hours for valid flags

      if (age > maxAge) {
        stats.expired++;
      } else {
        stats.fresh++;
      }

      if (value.url.includes('/assets/fallback-logo.svg')) {
        stats.fallback++;
      } else {
        stats.valid++;
      }
    }

    console.log('🎌 Flag Cache Stats:', stats);
    console.log('📊 Cache Details:', Array.from(cache.entries()).map(([key, value]) => ({
      country: key.replace('flag_', ''),
      url: value.url,
      age: `${Math.round((now - value.timestamp) / 1000 / 60)} min`,
      source: value.source
    })));
  }
}

/**
 * Clear all cached fallback flags to force re-fetching (use sparingly)
 */
export function clearFallbackFlagCache(): void {
  // Get all cached items and remove fallback ones
  const cache = (flagCache as any).cache; // Access the internal Map
  if (cache instanceof Map) {
    for (const [key, value] of cache.entries()) {
      if (value.url && value.url.includes('/assets/fallback-logo.svg')) {
        cache.delete(key);
      }
    }
  }
  console.log('Cleared fallback flag cache entries');
}

/**
 * Check if a specific flag is cached and show cache details
 */
export function checkFlagCache(country: string): void {
  const cacheKey = getFlagCacheKey(country);
  const cached = flagCache.getCached(cacheKey);

  if (cached) {
    const age = Math.round((Date.now() - cached.timestamp) / 1000 / 60);
    console.log(`🔍 Cache status for ${country}:`, {
      key: cacheKey,
      url: cached.url,
      source: cached.source,
      age: `${age} minutes`,
      verified: cached.verified
    });
  } else {
    console.log(`❌ No cache found for ${country} with key: ${cacheKey}`);
  }
}

export const getFlagUrl = async (country: string): Promise<string> => {
  // Normalize country name
  const normalizedCountry = country.trim();

  if (!normalizedCountry) {
    console.warn('Empty country name provided to getFlagUrl');
    return '/assets/fallback-logo.svg';
  }

  // Check cache first
  const cacheKey = `flag_${normalizedCountry.toLowerCase()}`;
  const cachedFlag = flagCache.get(cacheKey);

  if (cachedFlag) {
    return cachedFlag;
  }

  console.log(`Getting flag for country: ${normalizedCountry}`);

  try {
    // Try our API endpoint first (which uses SportsRadar)
    const response = await fetch(`/api/flags/${encodeURIComponent(normalizedCountry)}`, {
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();

      if (data.success && data.flagUrl) {
        console.log(`✅ Valid flag found for ${normalizedCountry}: ${data.flagUrl}`);
        flagCache.set(cacheKey, data.flagUrl);
        return data.flagUrl;
      }

      if (data.shouldExclude) {
        console.log(`🚫 Country ${normalizedCountry} should be excluded due to missing flag`);
        flagCache.set(cacheKey, '/assets/fallback-logo.svg');
        return '/assets/fallback-logo.svg';
      }
    }

    console.log(`❌ API failed for ${normalizedCountry}, trying fallback sources`);

    // Fallback 1: Try API-Football format
    try {
      console.log(`Flag fallback for ${normalizedCountry}: trying source 1/3`);
      const apiFootballUrl = `https://media.api-sports.io/flags/${normalizedCountry.toLowerCase().replace(/\s+/g, '')}.svg`;

      const apiFootballResponse = await fetch(apiFootballUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });

      if (apiFootballResponse.ok && apiFootballResponse.status === 200) {
        console.log(`✅ Valid flag found via API-Football for ${normalizedCountry}: ${apiFootballUrl}`);
        flagCache.set(cacheKey, apiFootballUrl);
        return apiFootballUrl;
      }
    } catch (e) {
      console.log(`Failed API-Football fallback for ${normalizedCountry}`);
    }

    // Fallback 2: Try 365scores CDN
    try {
      console.log(`Flag fallback for ${normalizedCountry}: trying source 2/3`);
      const scores365Url = `https://sports.365scores.com/CDN/images/flags/${normalizedCountry.toLowerCase().replace(/\s+/g, '_')}.svg`;

      const scores365Response = await fetch(scores365Url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });

      if (scores365Response.ok && scores365Response.status === 200) {
        console.log(`✅ Valid flag found via 365scores for ${normalizedCountry}: ${scores365Url}`);
        flagCache.set(cacheKey, scores365Url);
        return scores365Url;
      }
    } catch (e) {
      console.log(`Failed 365scores fallback for ${normalizedCountry}`);
    }

    // Fallback 3: Country code based approach
    try {
      console.log(`Flag fallback for ${normalizedCountry}: trying source 3/3`);
      const countryCode = getCountryCode(normalizedCountry);
      if (countryCode) {
        const countryCodeUrl = `https://flagcdn.com/w40/${countryCode}.png`;

        const countryCodeResponse = await fetch(countryCodeUrl, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(3000)
        });

        if (countryCodeResponse.ok && countryCodeResponse.status === 200) {
          console.log(`✅ Valid flag found via country code for ${normalizedCountry}: ${countryCodeUrl}`);
          flagCache.set(cacheKey, countryCodeUrl);
          return countryCodeUrl;
        }
      }
    } catch (e) {
      console.log(`Failed country code fallback for ${normalizedCountry}`);
    }

    console.log(`❌ All flag sources failed for ${normalizedCountry}, using fallback`);

    // All fallbacks failed, use default
    const fallbackUrl = '/assets/fallback-logo.svg';
    flagCache.set(cacheKey, fallbackUrl);
    return fallbackUrl;

  } catch (error) {
    console.error(`Error fetching flag for ${normalizedCountry}:`, error);
    const fallbackUrl = '/assets/fallback-logo.svg';
    flagCache.set(cacheKey, fallbackUrl);
    return fallbackUrl;
  }
};

/**
 * Generate consistent cache key for flags
 */
export function getFlagCacheKey(country: string): string {
  return `flag_${country.toLowerCase().replace(/\s+/g, '_')}`;
}