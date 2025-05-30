// Flag utility functions with SportsRadar fallback support

import { getFlagWithErrorHandling, testImageUrl } from './MyAPIFallback';

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

/**
 * Generate multiple flag sources for a country
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

  // 1. Primary SportsRadar API endpoint
  sources.push(`/api/flags/${encodeURIComponent(cleanCountry)}`);

  // 2. FlagsAPI using country code mapping
  const countryCode = countryCodeMap[cleanCountry];
  if (countryCode) {
    sources.push(`https://flagsapi.com/${countryCode}/flat/24.png`);
  }

  // 3. Direct SportsRadar endpoint
  const sanitizedCountry = cleanCountry.toLowerCase().replace(/\s+/g, '_');
  sources.push(`https://api.sportradar.com/flags-images-t3/sr/country-flags/flags/${sanitizedCountry}/flag_24x24.png`);

  // 4. 365scores CDN
  sources.push(`https://imagecache.365scores.com/image/upload/f_png,w_32,h_32,c_limit,q_auto:eco,dpr_2,d_Countries:round:World.png/v5/Countries/round/${sanitizedCountry}`);

  // 5. Final fallback
  sources.push('/assets/fallback-logo.svg');

  return sources;
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
 * Synchronous version for backward compatibility (uses original logic)
 * @param country - Country name
 * @param leagueFlag - Optional league flag URL
 * @returns Flag image URL
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

  // Use SportsRadar API endpoint as primary source
  return `/api/flags/${encodeURIComponent(cleanCountry)}`;
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