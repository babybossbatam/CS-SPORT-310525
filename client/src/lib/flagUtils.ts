// Flag utility functions with SportsRadar fallback support

import { testImageUrl, findWorkingLogoUrl, generateLogoSources } from './MyAPIFallback';

export { countryCodeMap };

// Country code mapping for FlagsAPI
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
  'Canada': 'CA',
  'Costa Rica': 'CR',
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
  'China': 'CN',
  'Australia': 'AU',
  'New Zealand': 'NZ',
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
  'Gambia': 'GM'
};

import { flagCache, getFlagCacheKey, validateLogoUrl } from './logoCache';

/**
 * Generate multiple flag sources for a country with SportsRadar fallback
 */
export function generateFlagSources(country: string): string[] {
  const cleanCountry = country.trim();
  const sources: string[] = [];

  // Special cases for international competitions
  if (cleanCountry === 'World') {
    return ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzMzNzNkYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS0yMCA0aDIwbS0yMC04aDIwIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMmE0IDE0IDAgMCAwIDAgMjBBNCAxNCAwIDAgMCAxMiAyIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K'];
  }

  if (cleanCountry === 'Europe') {
    return ['https://flagsapi.com/EU/flat/24.png'];
  }

  // 1. Primary: FlagsAPI using country code mapping (most reliable)
  const countryCode = countryCodeMap[cleanCountry];
  if (countryCode) {
    sources.push(`https://flagsapi.com/${countryCode}/flat/24.png`);
  }

  // 2. Secondary: Alternative reliable sources
  if (countryCode && countryCode.length === 2) {
    sources.push(`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`);
  }

  // 3. Skip SportsRadar for now due to server issues
  // sources.push(`/api/sportsradar/flags/${encodeURIComponent(cleanCountry)}`);

  // 4. Ultimate fallback
  sources.push('/assets/fallback-logo.svg');

  return sources;
}

/**
 * Get cached flag or fetch with fallback - Enhanced cache-first approach
 */
export async function getCachedFlag(country: string): Promise<string> {
  const cacheKey = getFlagCacheKey(country);

  // Check cache first - return immediately if found
  const cached = flagCache.getCached(cacheKey);
  if (cached && cached.verified) {
    return cached.url;
  }

  // If cached but not verified, check if it's been long enough to retry
  if (cached && !cached.verified && Date.now() - cached.timestamp < 300000) { // 5 minutes
    return cached.url; // Return cached even if not verified to prevent repeated failures
  }

  const sources = generateFlagSources(country);

  // Try sources with reduced logging for better performance
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];

    try {
      // For data URLs or local assets, return immediately
      if (source.startsWith('data:') || source.startsWith('/assets/')) {
        flagCache.setCached(cacheKey, source, `fallback-${i}`, true);
        return source;
      }

      // Skip SportsRadar API for now due to failures - go directly to FlagsAPI
      if (source.includes('/api/sportsradar/flags/')) {
        continue;
      }

      // For external URLs, validate before caching
      const isValid = await validateLogoUrl(source);
      if (isValid) {
        flagCache.setCached(cacheKey, source, `source-${i}`, true);
        return source;
      }
    } catch (error) {
      continue;
    }
  }

  // If all sources fail, return fallback and cache it
  const fallbackUrl = '/assets/fallback-logo.svg';
  flagCache.setCached(cacheKey, fallbackUrl, 'final-fallback', true);
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

/**
 * Simplified synchronous version to reduce flickering
 * @param country - Country name
 * @param leagueFlag - Optional league flag URL
 * @returns Flag image URL with single fallback
 */
export function getCountryFlagWithFallbackSync(
  country: string | null | undefined, 
  leagueFlag?: string | null
): string {
  // Use league flag if available and valid
  if (leagueFlag && typeof leagueFlag === 'string' && leagueFlag.trim() !== '') {
    return leagueFlag;
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

  // Special cases for international competitions
  if (cleanCountry === 'World') {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzMzNzNkYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS0yMCA0aDIwbS0yMC04aDIwIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMmE0IDE0IDAgMCAwIDAgMjBBNCAxNCAwIDAgMCAxMiAyIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
  }

  if (cleanCountry === 'Europe') {
    return 'https://flagsapi.com/EU/flat/24.png';
  }

  // Use country code mapping first for most reliable flags
  const countryCode = countryCodeMap[cleanCountry];
  if (countryCode) {
    return `https://flagsapi.com/${countryCode}/flat/24.png`;
  }

  // Fallback to API endpoint for unmapped countries
  return `/api/flags/${encodeURIComponent(cleanCountry)}`;
}

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

  // 3. Third: FlagsAPI using country code mapping
  const countryCode = countryCodeMap[cleanCountry];
  if (countryCode) {
    sources.push(`https://flagsapi.com/${countryCode}/flat/24.png`);
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