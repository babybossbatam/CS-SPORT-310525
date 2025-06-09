
/**
 * Flag Management Utility for Local Hosted Flags
 * Manages local circular flags downloaded from Figma resource
 */

import { countryCodeMap } from './flagUtils';

export interface LocalFlagInfo {
  countryCode: string;
  countryName: string;
  localPath: string;
  exists: boolean;
}

/**
 * Check if a local flag exists for a country
 */
export async function checkLocalFlagExists(countryCode: string): Promise<boolean> {
  try {
    const response = await fetch(`/assets/flags/circular/${countryCode.toLowerCase()}.svg`, {
      method: 'HEAD'
    });
    return response.ok;
  } catch {
    // Try PNG fallback
    try {
      const response = await fetch(`/assets/flags/circular/${countryCode.toLowerCase()}.png`, {
        method: 'HEAD'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Get all countries that should have local flags
 */
export function getCountriesForLocalFlags(): LocalFlagInfo[] {
  const countries: LocalFlagInfo[] = [];
  
  Object.entries(countryCodeMap).forEach(([countryName, countryCode]) => {
    if (countryCode.length === 2) { // Only standard 2-letter codes
      countries.push({
        countryCode,
        countryName,
        localPath: `/assets/flags/circular/${countryCode.toLowerCase()}.svg`,
        exists: false // Will be checked later
      });
    }
  });

  return countries.sort((a, b) => a.countryName.localeCompare(b.countryName));
}

/**
 * Audit local flags - check which ones exist and which are missing
 */
export async function auditLocalFlags(): Promise<{
  existing: LocalFlagInfo[];
  missing: LocalFlagInfo[];
  total: number;
}> {
  const allCountries = getCountriesForLocalFlags();
  const existing: LocalFlagInfo[] = [];
  const missing: LocalFlagInfo[] = [];

  console.log('🔍 Auditing local flags...');

  for (const country of allCountries) {
    const exists = await checkLocalFlagExists(country.countryCode);
    country.exists = exists;
    
    if (exists) {
      existing.push(country);
    } else {
      missing.push(country);
    }
  }

  console.log(`📊 Local Flag Audit Results:`);
  console.log(`✅ Existing: ${existing.length}`);
  console.log(`❌ Missing: ${missing.length}`);
  console.log(`📈 Coverage: ${((existing.length / allCountries.length) * 100).toFixed(1)}%`);

  return {
    existing,
    missing,
    total: allCountries.length
  };
}

/**
 * Generate download list for missing flags
 */
export function generateFlagDownloadList(missingFlags: LocalFlagInfo[]): string {
  console.log('📋 Countries needing local flags:');
  
  const downloadList = missingFlags.map(flag => {
    return `${flag.countryName} (${flag.countryCode.toUpperCase()}) -> ${flag.localPath}`;
  }).join('\n');

  console.log(downloadList);
  return downloadList;
}

/**
 * Priority countries that should be downloaded first
 */
export const PRIORITY_COUNTRIES = [
  'US', 'GB', 'DE', 'FR', 'IT', 'ES', 'BR', 'AR', 'NL', 'PT',
  'BE', 'TR', 'CH', 'AT', 'DK', 'SE', 'NO', 'PL', 'CZ', 'HR',
  'RS', 'GR', 'UA', 'RU', 'JP', 'KR', 'CN', 'AU', 'CA', 'MX'
];

/**
 * Get priority flags to download first
 */
export function getPriorityFlags(): LocalFlagInfo[] {
  const allCountries = getCountriesForLocalFlags();
  return allCountries.filter(country => 
    PRIORITY_COUNTRIES.includes(country.countryCode.toUpperCase())
  );
}
