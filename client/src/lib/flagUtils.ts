// Flag utility functions with SportsRadar fallback support

import {
  testImageUrl,
  findWorkingLogoUrl,
  generateLogoSources,
} from "./MyAPIFallback";

export { countryCodeMap };

/**
 * Get country code from country name using the centralized mapping
 */
export function getCountryCode(countryName: string | null | undefined): string | null {
  if (!countryName || typeof countryName !== 'string') {
    return null;
  }
  
  const normalizedCountry = countryName.trim();
  let countryCode = countryCodeMap[normalizedCountry];

  // If not found, try with spaces instead of hyphens
  if (!countryCode && normalizedCountry.includes("-")) {
    const spaceVersion = normalizedCountry.replace(/-/g, " ");
    countryCode = countryCodeMap[spaceVersion];
  }

  // If not found, try with hyphens instead of spaces
  if (!countryCode && normalizedCountry.includes(" ")) {
    const hyphenVersion = normalizedCountry.replace(/\s+/g, "-");
    countryCode = countryCodeMap[hyphenVersion];
  }

  return countryCode || null;
}

// Enhanced country code mapping for Flagpedia with normalized variations
const countryCodeMap: { [key: string]: string } = {
  England: "GB-ENG",
  Scotland: "GB-SCT",
  Wales: "GB-WLS",
  "Northern Ireland": "GB-NIR",
  "Northern-Ireland": "GB-NIR",
  Spain: "ES",
  Germany: "DE",
  France: "FR",
  Italy: "IT",
  Netherlands: "NL",
  Portugal: "PT",
  Belgium: "BE",
  Turkey: "TR",
  Türkiye: "TR",
  Switzerland: "CH",
  Austria: "AT",
  Denmark: "DK",
  Sweden: "SE",
  Norway: "NO",
  Poland: "PL",
  "Czech Republic": "CZ",
  "Czech-Republic": "CZ",
  Croatia: "HR",
  Serbia: "RS",
  Greece: "GR",
  Ukraine: "UA",
  Russia: "RU",
  Bulgaria: "BG",
  Romania: "RO",
  Hungary: "HU",
  Slovakia: "SK",
  Slovenia: "SI",
  "Bosnia and Herzegovina": "BA",
  Bosnia: "BA",
  "North Macedonia": "MK",
  Macedonia: "MK",
  "FYR Macedonia": "MK",
  Montenegro: "ME",
  Albania: "AL",
  Kosovo: "XK",
  Moldova: "MD",
  Belarus: "BY",
  Lithuania: "LT",
  Latvia: "LV",
  Estonia: "EE",
  Finland: "FI",
  Iceland: "IS",
  Ireland: "IE",
  Malta: "MT",
  Cyprus: "CY",
  Luxembourg: "LU",
  Liechtenstein: "LI",
  Monaco: "MC",
  Andorra: "AD",
  "San Marino": "SM",
  "Vatican City": "VA",
  Brazil: "BR",
  Argentina: "AR",
  Mexico: "MX",
  Colombia: "CO",
  colombia: "CO", // Fix lowercase variant to use uppercase
  Peru: "PE",
  Chile: "CL",
  Uruguay: "UY",
  Paraguay: "PY",
  Bolivia: "BO",
  Ecuador: "EC",
  Venezuela: "VE",
  venezuela: "VE", // Add lowercase variant
  VENEZUELA: "VE", // Add uppercase variant
  "Venezuela (Bolivarian Republic of)": "VE", // Add official name variant
  "Venezuela (Bolivarian Republic)": "VE", // Add alternative variant
  "Bolivarian Republic of Venezuela": "VE", // Add alternative order
  Venezuelan: "VE", // Add adjective form
  VE: "VE", // Direct code mapping
  VEN: "VE", // Alternative code mapping
  Guyana: "GY",
  Suriname: "SR",
  "French Guiana": "GF",
  "United States": "US",
  USA: "US",
  Canada: "CA",
  "Costa Rica": "CR",
  "Costa-Rica": "CR",
  Panama: "PA",
  Guatemala: "GT",
  Honduras: "HN",
  "El Salvador": "SV",
  Nicaragua: "NI",
  Belize: "BZ",
  Jamaica: "JM",
  "Trinidad and Tobago": "TT",
  "Trinidad-and-Tobago": "TT",
  "Trinidad-And-Tobago": "TT",
  Cuba: "CU",
  "Dominican Republic": "DO",
  Haiti: "HT",
  Barbados: "BB",
  Bahamas: "BS",
  Japan: "JP",
  "South Korea": "KR",
  "South-Korea": "KR",
  China: "CN",
  Australia: "AU",
  "New Zealand": "NZ",
  "New-Zealand": "NZ",
  India: "IN",
  Thailand: "TH",
  Vietnam: "VN",
  Malaysia: "MY",
  Singapore: "SG",
  Indonesia: "ID",
  Philippines: "PH",
  Myanmar: "MM",
  Cambodia: "KH",
  Laos: "LA",
  Brunei: "BN",
  "East Timor": "TL",
  Pakistan: "PK",
  Bangladesh: "BD",
  "Sri Lanka": "LK",
  Nepal: "NP",
  Bhutan: "BT",
  Maldives: "MV",
  Afghanistan: "AF",
  Iran: "IR",
  Iraq: "IQ",
  "Saudi Arabia": "SA",
  "Saudi-Arabia": "SA",
  "United Arab Emirates": "AE",
  "United-Arab-Emirates": "AE",
  Qatar: "QA",
  Kuwait: "KW",
  Bahrain: "BH",
  Oman: "OM",
  Yemen: "YE",
  Jordan: "JO",
  Lebanon: "LB",
  Syria: "SY",
  Israel: "IL",
  Palestine: "PS",
  Egypt: "EG",
  Libya: "LY",
  Tunisia: "TN",
  Algeria: "DZ",
  Morocco: "MA",
  Sudan: "SD",
  "South Sudan": "SS",
  Ethiopia: "ET",
  Eritrea: "ER",
  Djibouti: "DJ",
  Somalia: "SO",
  Kenya: "KE",
  Uganda: "UG",
  Tanzania: "TZ",
  Rwanda: "RW",
  Burundi: "BI",
  Nigeria: "NG",
  Ghana: "GH",
  "Ivory Coast": "CI",
  Senegal: "SN",
  Mali: "ML",
  "Burkina Faso": "BF",
  Niger: "NE",
  Chad: "TD",
  "Central African Republic": "CF",
  Cameroon: "CM",
  "Equatorial Guinea": "GQ",
  Gabon: "GA",
  "Republic of the Congo": "CG",
  "Democratic Republic of the Congo": "CD",
  "Congo-DR": "CD",
  Angola: "AO",
  Zambia: "ZM",
  Zimbabwe: "ZW",
  Botswana: "BW",
  Namibia: "NA",
  "South Africa": "ZA",
  Lesotho: "LS",
  Eswatini: "SZ",
  Madagascar: "MG",
  Mauritius: "MU",
  Seychelles: "SC",
  Comoros: "KM",
  "Cape Verde": "CV",
  "Guinea-Bissau": "GW",
  Guinea: "GN",
  "Sierra Leone": "SL",
  Liberia: "LR",
  Togo: "TG",
  Benin: "BJ",
  Mauritania: "MR",
  Gambia: "GM",
  // Additional missing countries from iban.com
  "Faroe Islands": "FO",
  "Faroe-Islands": "FO",
  Faroes: "FO",
  Greenland: "GL",
  "Isle of Man": "IM",
  "Isle-of-Man": "IM",
  Jersey: "JE",
  Guernsey: "GG",
  "Aland Islands": "AX",
  "Åland Islands": "AX",
  Malawi: "MW",
  Georgia: "GE",
  Uzbekistan: "UZ",
  // Additional mappings for common variations and missing countries
  Tajikistan: "TJ",
  Turkmenistan: "TM",
  Kyrgyzstan: "KG",
  Kazakhstan: "KZ",
  Azerbaijan: "AZ",
  Armenia: "AM",
  Mongolia: "MN",
  "Timor-Leste": "TL",
  "Papua New Guinea": "PG",
  Fiji: "FJ",
  Samoa: "WS",
  Tonga: "TO",
  Vanuatu: "VU",
  "Solomon Islands": "SB",
  Palau: "PW",
  Micronesia: "FM",
  "Marshall Islands": "MH",
  Kiribati: "KI",
  Nauru: "NR",
  Tuvalu: "TV",
  "Cook Islands": "CK",
  Niue: "NU",
  "American Samoa": "AS",
  Guam: "GU",
  "Northern Mariana Islands": "MP",
  "French Polynesia": "PF",
  "New Caledonia": "NC",
  "Wallis and Futuna": "WF",
  // Additional countries commonly found on 365scores.com
  Curaçao: "CW",
  Curacao: "CW",
  "Sint Maarten": "SX",
  Aruba: "AW",
  Bonaire: "BQ",
  "Saint Lucia": "LC",
  "Saint Vincent and the Grenadines": "VC",
  Grenada: "GD",
  Dominica: "DM",
  "Antigua and Barbuda": "AG",
  "Saint Kitts and Nevis": "KN",
  Montserrat: "MS",
  Anguilla: "AI",
  "British Virgin Islands": "VG",
  "US Virgin Islands": "VI",
  "Puerto Rico": "PR",
  "Cayman Islands": "KY",
  "Turks and Caicos": "TC",
  Bermuda: "BM",
  "Falkland Islands": "FK",
  Gibraltar: "GI",
  "Saint Helena": "SH",
  "Ascension Island": "AC",
  "Tristan da Cunha": "TA",
  // Asian countries/territories (removing duplicates)
  Macau: "MO",
  Macao: "MO",
  "Hong Kong": "HK",
  "Hong-Kong": "HK",
  Taiwan: "TW",
  "Chinese Taipei": "TW",
  // African variations (removing duplicates)
  "DR Congo": "CD",
  "Congo DR": "CD",
  "Congo DRC": "CD",
  "Democratic Republic of Congo": "CD",
  "Republic of Congo": "CG",
  "Congo Republic": "CG",
  "Congo-Brazzaville": "CG",
  "Congo-Kinshasa": "CD",
  // European microstates and territories (removing duplicates)
  Vatican: "VA",
  "Holy See": "VA",
  // Oceania territories
  "Norfolk Island": "NF",
  "Christmas Island": "CX",
  "Cocos Islands": "CC",
  "Heard Island": "HM",
  // Common alternative names (removing duplicates)
  "United Kingdom": "GB",
  UK: "GB",
  "Great Britain": "GB",
  Britain: "GB",
  "Bosnia & Herzegovina": "BA",
  Herzegovina: "BA",
  Czechia: "CZ",
  FYROM: "MK",
  "Korea Republic": "KR",
  "Korea DPR": "KP",
  "Republic of Korea": "KR",
  "Democratic Republic of Korea": "KP",
  "Côte d'Ivoire": "CI",
  "Macao SAR": "MO",
  "Hong Kong SAR": "HK",
  "Taiwan Province of China": "TW",
  "Republic of Ireland": "IE",
  DPRK: "KP",
  ROK: "KR",
  PRC: "CN",
  ROC: "TW",
  "Macau SAR": "MO",
  // Additional variations
  RSA: "ZA",
  "South-Africa": "ZA",
  "República de Sudáfrica": "ZA",
  "Suid-Afrika": "ZA",

  // 365scores specific countries
  Europe: "EU",
  World: "WO",

  // SportsRadar specific countries
  Congo: "CD", // Democratic Republic of Congo (not Colombia CO)
  Mozambique: "MZ", // Mozambique (not Macau MO)
  "Sao Tome and Principe": "ST",
  Tahiti: "PF",
};

import { flagCache, getFlagCacheKey, validateLogoUrl } from "./logoCache";

// Re-export flagCache for components that need it
export { flagCache };

// Flag preloading system
const FLAG_STORAGE_KEY = "cssport_flag_cache";
const FLAG_PRELOAD_EXPIRY = 12 * 60 * 60 * 1000; // Reduced to 12 hours

/**
 * Safe localStorage write with automatic cleanup
 */
function safeStorageWrite(key: string, value: string): boolean {
  try {
    const { available } = getStorageSize();
    const requiredSpace = value.length + key.length + 100; // 100 bytes buffer
    
    if (available < requiredSpace) {
      console.warn('⚠️ Insufficient storage space, attempting cleanup');
      
      // Try progressive cleanup levels
      if (!progressiveStorageCleanup(requiredSpace)) {
        console.error('❌ All cleanup attempts failed, storage critically full');
        return false;
      }
    }
    
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error('Storage write failed:', e);
    
    // Emergency: Clear everything and try once more
    nuclearStorageCleanup();
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e2) {
      console.error('Storage write failed even after nuclear cleanup:', e2);
      return false;
    }
  }
}

/**
 * Check available localStorage space with better error handling
 */
function getStorageSize(): { used: number; available: number } {
  let used = 0;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
    }
  } catch (e) {
    console.warn('Error calculating storage size:', e);
    // If we can't calculate, assume it's nearly full
    used = 4.5 * 1024 * 1024; // 4.5MB
  }
  
  // Conservative 4MB limit to ensure we don't hit quota
  const maxSize = 4 * 1024 * 1024; // 4MB
  const available = Math.max(0, maxSize - used);
  
  return { used, available };
}

/**
 * Progressive storage cleanup - tries different levels of cleanup
 */
function progressiveStorageCleanup(requiredSpace: number): boolean {
  console.warn('🚨 Progressive storage cleanup initiated');
  
  // Level 1: Remove expired entries (older than 1 hour)
  cleanupExpiredEntries(60 * 60 * 1000); // 1 hour
  if (getStorageSize().available >= requiredSpace) {
    console.log('✅ Level 1 cleanup sufficient');
    return true;
  }
  
  // Level 2: Remove older entries (older than 30 minutes)
  cleanupExpiredEntries(30 * 60 * 1000); // 30 minutes
  if (getStorageSize().available >= requiredSpace) {
    console.log('✅ Level 2 cleanup sufficient');
    return true;
  }
  
  // Level 3: Remove all cache entries
  removeAllCacheEntries();
  if (getStorageSize().available >= requiredSpace) {
    console.log('✅ Level 3 cleanup sufficient');
    return true;
  }
  
  // Level 4: Remove everything except essential app data
  emergencyCleanup();
  if (getStorageSize().available >= requiredSpace) {
    console.log('✅ Level 4 cleanup sufficient');
    return true;
  }
  
  return false;
}

/**
 * Remove all cache-related entries
 */
function removeAllCacheEntries(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('_cache') || 
      key.includes('cssport_') ||
      key.includes('standings_') ||
      key.includes('fixtures_') ||
      key.includes('logos_') ||
      key.includes('flag_')
    )) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.warn(`🗑️ Removed ${keysToRemove.length} cache entries`);
}

/**
 * Remove expired entries based on age threshold
 */
function cleanupExpiredEntries(maxAge: number): void {
  const now = Date.now();
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('_cache') || key.includes('cssport_'))) {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const data = JSON.parse(item);
          if (data.timestamp && (now - data.timestamp) > maxAge) {
            keysToRemove.push(key);
          }
        }
      } catch (e) {
        // Remove corrupted entries
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  if (keysToRemove.length > 0) {
    console.log(`🧹 Removed ${keysToRemove.length} expired entries (older than ${Math.round(maxAge / 1000 / 60)} minutes)`);
  }
}

/**
 * Nuclear option - clear almost everything
 */
function nuclearStorageCleanup(): void {
  console.error('☢️ Nuclear storage cleanup - clearing almost everything');
  
  // Keep only essential settings
  const essentialKeys = ['darkMode', 'language', 'timezone'];
  const essentialData: { [key: string]: string } = {};
  
  // Save essential data
  essentialKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      essentialData[key] = value;
    }
  });
  
  // Clear everything
  localStorage.clear();
  
  // Restore essential data
  Object.entries(essentialData).forEach(([key, value]) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`Failed to restore essential key: ${key}`);
    }
  });
  
  console.warn('☢️ Nuclear cleanup completed - all cache cleared');
}

/**
 * Emergency storage cleanup when space is critically low (legacy function kept for compatibility)
 */
function emergencyCleanup(): void {
  removeAllCacheEntries();
}

/**
 * Clean up old cache entries to free spacece
 */
function cleanupOldCacheEntries(): void {
  try {
    const keysToRemove: string[] = [];
    
    // Remove old fixture caches (over 2 hours old)
    for (let key in localStorage) {
      if (key.startsWith('all-fixtures-by-date-') || 
          key.startsWith('fixtures-') ||
          key.startsWith('live-fixtures-')) {
        try {
          const data = JSON.parse(localStorage[key]);
          if (data.timestamp && Date.now() - data.timestamp > 2 * 60 * 60 * 1000) {
            keysToRemove.push(key);
          }
        } catch (e) {
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove old query cache entries
    for (let key in localStorage) {
      if (key.includes('query-cache') || key.includes('react-query')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    if (keysToRemove.length > 0) {
      console.log(`🧹 Cleaned up ${keysToRemove.length} old cache entries`);
    }
  } catch (error) {
    console.warn("Failed to cleanup old cache entries:", error);
  }
}

/**
 * Save flag cache to localStorage for persistence with size management
 */
export function saveFlagCacheToStorage(): void {
  try {
    const cache = (flagCache as any).cache;
    if (cache instanceof Map) {
      const cacheData = {
        timestamp: Date.now(),
        flags: Array.from(cache.entries()),
      };
      
      const dataString = JSON.stringify(cacheData);
      const dataSize = dataString.length;
      
      // Check storage space
      const storage = getStorageSize();
      
      // If data is too large or not enough space, cleanup and try again
      if (dataSize > storage.available) {
        console.log(`⚠️ Flag cache too large (${Math.round(dataSize/1024)}KB), cleaning up...`);
        cleanupOldCacheEntries();
        
        // Check again after cleanup
        const storageAfterCleanup = getStorageSize();
        if (dataSize > storageAfterCleanup.available) {
          console.warn(`❌ Still not enough space after cleanup. Need ${Math.round(dataSize/1024)}KB, have ${Math.round(storageAfterCleanup.available/1024)}KB`);
          
          // Emergency: keep only the most recent flags
          const recentFlags = Array.from(cache.entries()).slice(-10);
          const emergencyData = {
            timestamp: Date.now(),
            flags: recentFlags,
          };
          localStorage.setItem(FLAG_STORAGE_KEY, JSON.stringify(emergencyData));
          console.log(`🚨 Emergency save: kept only ${recentFlags.length} most recent flags`);
          return;
        }
      }
      
      localStorage.setItem(FLAG_STORAGE_KEY, dataString);
      console.log(`💾 Saved ${cache.size} flags to localStorage (${Math.round(dataSize/1024)}KB)`);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn("📦 localStorage quota exceeded, attempting emergency cleanup...");
      try {
        // Emergency cleanup - remove all non-essential data
        cleanupOldCacheEntries();
        
        // Try to save minimal flag data
        const cache = (flagCache as any).cache;
        if (cache instanceof Map) {
          const essentialFlags = Array.from(cache.entries()).slice(-5); // Keep only 5 most recent
          const minimalData = {
            timestamp: Date.now(),
            flags: essentialFlags,
          };
          localStorage.setItem(FLAG_STORAGE_KEY, JSON.stringify(minimalData));
          console.log(`🆘 Emergency save completed: kept ${essentialFlags.length} essential flags`);
        }
      } catch (emergencyError) {
        console.error("💥 Emergency save failed:", emergencyError);
        // Clear the flag storage key if it exists to prevent further issues
        localStorage.removeItem(FLAG_STORAGE_KEY);
      }
    } else {
      console.warn("Failed to save flag cache to storage:", error);
    }
  }
}

/**
 * Load flag cache from localStorage on startup
 */
export function loadFlagCacheFromStorage(): void {
  try {
    const stored = localStorage.getItem(FLAG_STORAGE_KEY);
    if (!stored) {
      console.log("🏁 No stored flag cache found");
      return;
    }

    const cacheData = JSON.parse(stored);
    const age = Date.now() - cacheData.timestamp;

    // Check if stored cache is not too old
    if (age > FLAG_PRELOAD_EXPIRY) {
      console.log("🕐 Stored flag cache is too old, clearing");
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
      console.log(
        `🔄 Restored ${restoredCount} flags from localStorage (age: ${Math.round(age / 1000 / 60)} min)`,
      );
    }
  } catch (error) {
    console.warn("Failed to load flag cache from storage:", error);
    localStorage.removeItem(FLAG_STORAGE_KEY);
  }
}

/**
 * Auto-save flag cache periodically and on page unload
 */
export function initializeFlagCachePersistence(): void {
  // Load existing cache on startup
  loadFlagCacheFromStorage();

  // Save cache less frequently (every 10 minutes instead of 5)
  setInterval(saveFlagCacheToStorage, 10 * 60 * 1000);

  // Run intelligent cache cleanup every 15 minutes
  setInterval(intelligentCacheCleanup, 15 * 60 * 1000);

  // Run storage cleanup every 30 minutes
  setInterval(() => {
    try {
      const storage = getStorageSize();
      const usagePercent = (storage.used / (4 * 1024 * 1024)) * 100;
      if (usagePercent > 80) {
        console.log(`🧹 Storage usage at ${usagePercent.toFixed(1)}%, running cleanup...`);
        cleanupOldCacheEntries();
      }
    } catch (error) {
      console.warn("Storage cleanup check failed:", error);
    }
  }, 30 * 60 * 1000);

  // Save cache when page is unloaded (with error handling)
  window.addEventListener("beforeunload", () => {
    try {
      saveFlagCacheToStorage();
    } catch (error) {
      console.warn("Failed to save cache on page unload:", error);
    }
  });

  // Save cache when visibility changes (tab switch, etc.) - but less aggressively
  let lastSave = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && Date.now() - lastSave > 60000) { // Only save once per minute
      try {
        saveFlagCacheToStorage();
        lastSave = Date.now();
      } catch (error) {
        console.warn("Failed to save cache on visibility change:", error);
      }
    }
  });
}

/**
 * Prewarm flag cache with most common countries from sports data
 * Disabled - flags will be loaded on-demand to prevent duplicate fetches
 */
export async function prewarmPopularFlags(): Promise<void> {
  console.log("🔥 Flag prewarming disabled - using on-demand loading");
}

/**
 * Generate multiple flag sources for a country with Circle Flags as primary source
 */
export function generateFlagSources(
  country: string,
  preferCircular: boolean = false,
): string[] {
  const cleanCountry = country.trim();
  const sources: string[] = [];

  // Special cases for international competitions - use local file
  if (cleanCountry === "World") {
    return ["/assets/world_flag_new.png"];
  }

  if (cleanCountry === "Europe") {
    return [
      "https://flagcdn.com/w40/eu.png",
      "https://media.api-sports.io/flags/eu.svg",
    ];
  }

  const countryCode = countryCodeMap[cleanCountry];

  if (countryCode) {
    // 1. PRIMARY: Circle Flags (perfect for national teams with circular design)
    if (countryCode.length === 2) {
      sources.push(
        `https://hatscripts.github.io/circle-flags/flags/${countryCode.toLowerCase()}.svg`,
      );
    }

    // 2. FlagCDN (reliable backup)
    if (countryCode.length === 2) {
      sources.push(`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`);
      sources.push(
        `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`,
      );
    }

    // 3. Country Flags API (flat design alternative)
    if (countryCode.length === 2) {
      sources.push(
        `https://countryflags.io/${countryCode.toLowerCase()}/flat/64.png`,
      );
    }

    // 4. API-Sports flags (good SVG alternative)
    sources.push(
      `https://media.api-sports.io/flags/${countryCode.toLowerCase()}.svg`,
    );

    // 5. Additional FlagCDN formats
    if (countryCode.length === 2) {
      sources.push(`https://flagcdn.com/${countryCode.toLowerCase()}.svg`);
      sources.push(`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`);
    }

    // 6. Special handling for GB subdivision codes (England, Scotland, etc.)
    if (countryCode.startsWith("GB-")) {
      const subdivision = countryCode.toLowerCase().replace("gb-", "");
      // Try Circle Flags for GB subdivisions first
      sources.push(
        `https://hatscripts.github.io/circle-flags/flags/gb-${subdivision}.svg`,
      );
      // Use main GB code for other APIs
      sources.push(`https://countryflags.io/gb/flat/64.png`);
      sources.push(`https://flagcdn.com/w40/gb.png`);
    }

    // 7. RestCountries backup (for 2-letter codes only)
    if (countryCode.length === 2) {
      sources.push(
        `https://restcountries.com/v3.1/alpha/${countryCode.toLowerCase()}?fields=flags`,
      );
    }

    // 8. Additional reliable sources from simplelocalize.io
    if (countryCode.length === 2) {
      sources.push(
        `https://cdn.jsdelivr.net/npm/country-flag-emoji-json@2.0.0/dist/images/${countryCode.toLowerCase()}.svg`,
      );
    }
  } else {
    console.warn(`No country code mapping found for: ${cleanCountry}`);

    // Fallback: try common variations for unmapped countries
    const cleanName = cleanCountry.toLowerCase().replace(/\s+/g, "");
    const shortName = cleanName.substring(0, 2);
    sources.push(
      `https://hatscripts.github.io/circle-flags/flags/${shortName}.svg`,
    );
    sources.push(`https://flagcdn.com/w40/${shortName}.png`);
    sources.push(`https://media.api-sports.io/flags/${shortName}.svg`);
  }

  return sources;
}

/**
 * Get cached flag or fetch with fallback - Now uses individual fetch for easier debugging
 */
export async function getCachedFlag(country: string): Promise<string> {
  const cacheKey = `flag_${country.toLowerCase().replace(/\s+/g, "_")}`;
  const caller = new Error().stack?.split("\n")[2]?.trim() || "unknown";

  console.log(
    `🔍 [flagUtils.ts:getCachedFlag] Called for: ${country} | Cache Key: ${cacheKey} | Called from: ${caller}`,
  );

  // Track request patterns
  trackFlagRequest(country, cacheKey);

  // Track usage for intelligent caching
  trackFlagUsage(country);

  // PRIORITY 1: Always check cache first - use any valid cached result
  const cached = flagCache.getCached(cacheKey);
  if (cached) {
    const age = Date.now() - cached.timestamp;
    const ageMinutes = Math.round(age / 1000 / 60);

    // Use any cached result if it's not too old
    const maxAge = cached.url.includes("/assets/fallback-logo.svg")
      ? 60 * 60 * 1000 // 1 hour for fallbacks
      : 7 * 24 * 60 * 60 * 1000; // 7 days for valid flags

    if (age < maxAge) {
      console.log(
        `✅ [flagUtils.ts:getCachedFlag] Cache hit for ${country} (age: ${ageMinutes} min) | URL: ${cached.url} | Source: ${cached.source}`,
      );
      return cached.url;
    } else {
      console.log(
        `⚠️ [flagUtils.ts:getCachedFlag] Cache expired for ${country} (age: ${ageMinutes} min, max: ${Math.round(maxAge / 1000 / 60)} min) | Will refetch`,
      );
    }
  } else {
    console.log(
      `❌ [flagUtils.ts:getCachedFlag] Cache miss for ${country} | Cache key: ${cacheKey}`,
    );
  }

  // Check if there's already a pending request for this country
  if (pendingFlagRequests.has(cacheKey)) {
    console.log(
      `⏳ [flagUtils.ts:getCachedFlag] Pending request exists for ${country}, waiting...`,
    );
    return pendingFlagRequests.get(cacheKey)!;
  }

  // For immediate special cases, don't use batching
  if (country === "World") {
    const worldFlag = "/assets/world_flag_new.png";
    flagCache.setCached(cacheKey, worldFlag, "local-world-flag", true);
    console.log(
      `🌍 [flagUtils.ts:getCachedFlag] Using local World flag: ${worldFlag}`,
    );
    return worldFlag;
  }

  if (country === "Europe") {
    const europeFlag = "https://flagcdn.com/w40/eu.png";
    flagCache.setCached(cacheKey, europeFlag, "europe-direct", true);
    console.log(
      `🇪🇺 [flagUtils.ts:getCachedFlag] Using Europe flag: ${europeFlag}`,
    );
    return europeFlag;
  }

  // For regular countries, check if they have simple country code mappings first
  const normalizedCountry = country.trim();
  let countryCode = countryCodeMap[normalizedCountry];

  console.log(
    `🔍 [flagUtils.ts:getCachedFlag] Country mapping lookup for "${normalizedCountry}":`,
    {
      directMapping: countryCode,
      hasDirectMapping: !!countryCode,
    },
  );

  if (!countryCode && normalizedCountry.includes("-")) {
    const spaceVersion = normalizedCountry.replace(/-/g, " ");
    countryCode = countryCodeMap[spaceVersion];
    console.log(
      `🔍 [flagUtils.ts:getCachedFlag] Trying space variation "${spaceVersion}": ${countryCode || "not found"}`,
    );
  }

  if (!countryCode && normalizedCountry.includes(" ")) {
    const hyphenVersion = normalizedCountry.replace(/\s+/g, "-");
    countryCode = countryCodeMap[hyphenVersion];
    console.log(
      `🔍 [flagUtils.ts:getCachedFlag] Trying hyphen variation "${hyphenVersion}": ${countryCode || "not found"}`,
    );
  }

  // If we have a simple 2-letter country code, process immediately
  if (countryCode && countryCode.length === 2) {
    // Use Circle Flags as primary source for better circular design
    const flagUrl = `https://hatscripts.github.io/circle-flags/flags/${countryCode.toLowerCase()}.svg`;
    console.log(
      `🎯 [flagUtils.ts:getCachedFlag] Found 2-letter code for ${country}: ${countryCode} -> ${flagUrl} (Circle Flags)`,
    );
    flagCache.setCached(cacheKey, flagUrl, "circle-flags", true);
    console.log(
      `💾 [flagUtils.ts:getCachedFlag] Cached Circle Flag for ${country} with source: circle-flags`,
    );
    return flagUrl;
  }

  if (countryCode && countryCode.startsWith("GB-")) {
    const subdivision = countryCode.toLowerCase().replace("gb-", "");
    const flagUrl = `https://hatscripts.github.io/circle-flags/flags/gb-${subdivision}.svg`;
    console.log(
      `🇬🇧 [flagUtils.ts:getCachedFlag] Using Circle Flags for ${country}: ${flagUrl}`,
    );
    flagCache.setCached(cacheKey, flagUrl, "circle-flags-gb", true);
    return flagUrl;
  }

  // For countries that need API calls, use individual fetch instead of batching
  console.log(
    `🌐 [flagUtils.ts:getCachedFlag] No direct mapping for ${country}, starting individual fetch...`,
  );
  const flagPromise = fetchIndividualFlag(country);
  pendingFlagRequests.set(cacheKey, flagPromise);

  flagPromise.finally(() => {
    console.log(
      `🏁 [flagUtils.ts:getCachedFlag] Finished processing ${country}, removing from pending`,
    );
    pendingFlagRequests.delete(cacheKey);
  });

  return flagPromise;
}

/**
 * Get country flag URL with enhanced fallback support using MyAPIFallback system
 * @param country - Country name
 * @param leagueFlag - Optional league flag URL
 * @returns Promise<string> - Flag image URL
 */
export async function getCountryFlagWithFallback(
  country: string | null | undefined,
  leagueFlag?: string | null,
): Promise<string> {
  // Use league flag if available and valid
  if (
    leagueFlag &&
    typeof leagueFlag === "string" &&
    leagueFlag.trim() !== ""
  ) {
    const isLeagueFlagWorking = await testImageUrl(leagueFlag);
    if (isLeagueFlagWorking) {
      return leagueFlag;
    }
  }

  // Add comprehensive null/undefined check for country
  if (!country || typeof country !== "string" || country.trim() === "") {
    return "/assets/fallback-logo.svg";
  }

  const cleanCountry = country.trim();

  // Special handling for Unknown country
  if (cleanCountry === "Unknown") {
    return "/assets/fallback-logo.svg";
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
  return "/assets/fallback-logo.svg";
}

// Memory cache for flag URLs
const flagCacheMem = new Map<string, string>();

export const getCountryFlagWithFallbackSync = (
  country: string,
  leagueFlag?: string,
): string => {
  const caller = new Error().stack?.split("\n")[2]?.trim() || "unknown";
  console.log(
    `🔄 [flagUtils.ts:getCountryFlagWithFallbackSync] Called for: ${country} | Called from: ${caller}`,
  );

  // IMMEDIATE VENEZUELA FIX - Force correct flag before any cache checks
  const normalizedCountry = country.trim().toLowerCase();
  if (
    normalizedCountry.includes("venezuela") ||
    normalizedCountry === "ve" ||
    normalizedCountry === "ven"
  ) {
    const correctVenezuelaFlag = "https://flagcdn.com/w40/ve.png";
    console.log(
      `🇻🇪 [flagUtils.ts:getCountryFlagWithFallbackSync] VENEZUELA FORCE FIX: ${correctVenezuelaFlag}`,
    );

    // Clear any corrupted cache entries
    const venezuelaCacheKeys = [
      "flag_venezuela",
      "flag_venezuela_(bolivarian_republic_of)",
      "flag_venezuela_(bolivarian_republic)",
      "flag_bolivarian_republic_of_venezuela",
      `${country}-${leagueFlag || ""}`,
    ];

    venezuelaCacheKeys.forEach((key) => {
      (flagCache as any).cache?.delete(key);
      flagCacheMem.delete(key);
    });

    // Cache the correct flag
    const mainCacheKey = `flag_${country.toLowerCase().replace(/\s+/g, "_")}`;
    flagCache.setCached(
      mainCacheKey,
      correctVenezuelaFlag,
      "venezuela-force-fix",
      true,
    );
    flagCacheMem.set(`${country}-${leagueFlag || ""}`, correctVenezuelaFlag);

    return correctVenezuelaFlag;
  }

  // Check main flagCache first before memory cache
  const flagCacheKey = `flag_${country.toLowerCase().replace(/\s+/g, "_")}`;
  const cached = flagCache.getCached(flagCacheKey);
  if (cached) {
    // Additional Venezuela corruption check
    if (
      country.toLowerCase().includes("venezuela") &&
      cached.url.includes("/co.png")
    ) {
      console.log(
        `🚨 [flagUtils.ts:getCountryFlagWithFallbackSync] DETECTED VENEZUELA CORRUPTION in cache: ${cached.url}`,
      );
      const correctFlag = "https://flagcdn.com/w40/ve.png";
      flagCache.setCached(
        flagCacheKey,
        correctFlag,
        "venezuela-corruption-fix",
        true,
      );
      return correctFlag;
    }

    console.log(
      `✅ [flagUtils.ts:getCountryFlagWithFallbackSync] Main cache hit for ${country}: ${cached.url} | Source: ${cached.source}`,
    );
    return cached.url;
  }

  // Check memory cache first using normalized country name
  const memCacheKey = `${normalizedCountry}-${leagueFlag || ""}`;
  if (flagCacheMem.has(memCacheKey)) {
    const cachedFlag = flagCacheMem.get(memCacheKey)!;
    console.log(
      `💨 [flagUtils.ts:getCountryFlagWithFallbackSync] Memory cache HIT: ${cachedFlag}`,
    );
    return cachedFlag;
  }

  const cacheKey = `flag_${normalizedCountry}`;

  console.log(
    `❌ [flagUtils.ts:getCountryFlagWithFallbackSync] No cache found for ${country}, generating sync...`,
  );

  let result: string;
  // Use league flag if available and valid
  if (
    leagueFlag &&
    typeof leagueFlag === "string" &&
    leagueFlag.trim() !== ""
  ) {
    result = leagueFlag;
    console.log(
      `🏆 [flagUtils.ts:getCountryFlagWithFallbackSync] Using league flag for ${country}: ${leagueFlag}`,
    );
  } else {
    // Add comprehensive null/undefined check for country
    if (!country || typeof country !== "string" || country.trim() === "") {
      result = "/assets/fallback-logo.svg";
      console.log(
        `⚠️ [flagUtils.ts:getCountryFlagWithFallbackSync] Empty country, using fallback`,
      );
    } else {
      const cleanCountry = country.trim();

      // Special handling for Unknown country
      if (cleanCountry === "Unknown") {
        result = "/assets/fallback-logo.svg";
        console.log(
          `❓ [flagUtils.ts:getCountryFlagWithFallbackSync] Unknown country, using fallback`,
        );
      } else {
        // Special cases for international competitions
        if (cleanCountry === "World") {
          result = "/assets/world_flag_new.png";
          console.log(
            `🌍 [flagUtils.ts:getCountryFlagWithFallbackSync] Using local World flag: ${result}`,
          );
        } else if (cleanCountry === "Europe") {
          result = "https://flagcdn.com/w40/eu.png";
          console.log(
            `🇪🇺 [flagUtils.ts:getCountryFlagWithFallbackSync] Using Europe flag: ${result}`,
          );
        } else {
          // Use country code mapping first for most reliable flags
          const countryCode = countryCodeMap[cleanCountry];
          console.log(
            `🔍 [flagUtils.ts:getCountryFlagWithFallbackSync] Country code lookup for "${cleanCountry}": ${countryCode || "not found"}`,
          );

          if (countryCode) {
            if (countryCode && countryCode.length === 2) {
              // Use Circle Flags as primary source for better circular design
              const flagUrl = `https://hatscripts.github.io/circle-flags/flags/${countryCode.toLowerCase()}.svg`;
              console.log(
                `🎯 [flagUtils.ts:getCountryFlagWithFallbackSync] Found 2-letter code for ${cleanCountry}: ${countryCode} -> ${flagUrl} (Circle Flags)`,
              );
              flagCache.setCached(flagCacheKey, flagUrl, "circle-flags", true);
              console.log(
                `💾 [flagUtils.ts:getCountryFlagWithFallbackSync] Cached Circle Flag for ${country} with source: circle-flags`,
              );
              return flagUrl;
            } else if (countryCode && countryCode.startsWith("GB-")) {
              const subdivision = countryCode.toLowerCase().replace("gb-", "");
              const flagUrl = `https://hatscripts.github.io/circle-flags/flags/gb-${subdivision}.svg`;
              console.log(
                `🇬🇧 [flagUtils.ts:getCountryFlagWithFallbackSync] Using Circle Flags for ${country}: ${flagUrl}`,
              );
              flagCache.setCached(
                flagCacheKey,
                flagUrl,
                "circle-flags-gb",
                true,
              );
              return flagUrl;
            } else {
              // For other special codes, try API-Sports
              result = `https://media.api-sports.io/flags/${countryCode.toLowerCase()}.svg`;
              console.log(
                `🏴 [flagUtils.ts:getCountryFlagWithFallbackSync] Using API-Sports for ${cleanCountry}: ${result}`,
              );
            }
          } else {
            console.log(
              `❌ [flagUtils.ts:getCountryFlagWithFallbackSync] No country code found for: ${cleanCountry}`,
            );
            // Fallback to API endpoint for unmapped countries
            result = `/api/flags/${encodeURIComponent(cleanCountry)}`;
            console.log(
              `🌐 [flagUtils.ts:getCountryFlagWithFallbackSync] Using API endpoint for ${cleanCountry}: ${result}`,
            );
          }
        }
      }
    }
  }

  console.log(
    `🏁 [flagUtils.ts:getCountryFlagWithFallbackSync] Final result for ${country}: ${result}`,
  );

  // Store in memory cache for faster subsequent access using normalized key
  flagCacheMem.set(`${normalizedCountry}-${leagueFlag || ""}`, result);

  console.log(
    `✅ [flagUtils.ts:getCountryFlagWithFallbackSync] Returning flag: ${result}`,
  );
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
  const fallbackSources = generateLogoSources(cleanCountry, "flag");
  sources.push(...fallbackSources);

  // 3. Third: Multiple flag sources using country code mapping
  const countryCode = countryCodeMap[cleanCountry];
  if (countryCode) {
    if (countryCode.length === 2) {
      sources.push(`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`);
      sources.push(
        `https://countryflags.io/${countryCode.toLowerCase()}/flat/64.png`,
      );
      sources.push(
        `https://media.api-sports.io/flags/${countryCode.toLowerCase()}/flat/64.png`,
      );
      sources.push(
        `https://media.api-sports.io/flags/${countryCode.toLowerCase()}.svg`,
      );
    }
  }

  // 4. Final fallback
  sources.push("/assets/matchdetaillogo/fallback.png");

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
        console.log(
          `Flag fallback for ${country}: trying source ${currentIndex + 1}/${sources.length}`,
        );
        img.src = nextSource;
      } else {
        console.log(
          `All flag sources failed for ${country}, using final fallback`,
        );
        img.src = "/assets/fallback-logo.svg";
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
  const sanitizedCountry = country.toLowerCase().replace(/\s+/g, "_");
  return `https://api.sportradar.com/flags-images-t3/sr/country-flags/flags/${sanitizedCountry}/flag_24x24.png`;
}

/**
 * Get 365scores CDN flag URL for a country
 * @param country - Country name
 * @returns 365scores CDN flag URL
 */
export function get365ScoresFlag(country: string): string {
  const sanitizedCountry = country.toLowerCase().replace(/\s+/g, "_");
  return `https://imagecache.365scores.com/image/upload/f_png,w_32,h_32,c_limit,q_auto:eco,dpr_2,d_Countries:round:World.png/v5/Countries/round/${sanitizedCountry}`;
}

/**
 * Fetch flag from SportsRadar API endpoint
 * @param country - Country name
 * @returns Promise<string | null> - Flag URL, fallback, or null if should be excluded
 */
export async function fetchSportsRadarFlag(
  country: string,
): Promise<string | null> {
  try {
    const response = await fetch(`/api/flags/${encodeURIComponent(country)}`);
    const data = await response.json();

    if (data.success && data.flagUrl) {
      return data.flagUrl;
    } else if (data.shouldExclude) {
      console.warn(
        `Country ${country} should be excluded due to missing flag from both sources`,
      );
      return null; // Return null to indicate this country should be excluded
    } else {
      return data.fallbackUrl || "/assets/fallback-logo.svg";
    }
  } catch (error) {
    console.error("Error fetching flag from SportsRadar API:", error);
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
  finalFallback: string = "/assets/fallback-logo.svg",
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
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
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
  itemType: "team" | "league" | "country" = "team",
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

// Debug functions for country mapping analysis - removed to reduce console noise

/**
 * Print a comprehensive missing countries report
 */
export function printMissingCountriesReport(): void {
  console.log("🌍 COMPREHENSIVE MISSING COUNTRIES REPORT");
  console.log("=".repeat(60));

  // Run all available analyses
  compare365ScoresMapping();
  compareSportsRadarMapping();
  compareAllCountryMappings();

  console.log("\n📋 SUMMARY:");
  console.log(
    "This report shows countries that are missing from your current mapping",
  );
  console.log(
    "but are supported by major sports data providers (365scores.com and SportsRadar).",
  );
  console.log(
    "\nPriority should be given to countries that appear in both external sources.",
  );
}

/**
 * Analyze all countries from API data and identify missing ones
 */
export function analyzeCountryMappingCoverage(fixtures: any[]): void {
  const allCountries = new Set<string>();
  const mappedCountries = new Set<string>();
  const unmappedCountries = new Set<string>();

  // Extract all unique countries from fixtures
  fixtures.forEach((fixture) => {
    if (fixture?.league?.country) {
      const country = fixture.league.country.trim();
      allCountries.add(country);

      // Check if it's mapped
      if (countryCodeMap[country]) {
        mappedCountries.add(country);
      } else {
        // Try variations
        let found = false;
        if (country.includes("-")) {
          const spaceVersion = country.replace(/-/g, " ");
          if (countryCodeMap[spaceVersion]) {
            mappedCountries.add(country);
            found = true;
          }
        }
        if (!found && country.includes(" ")) {
          const hyphenVersion = country.replace(/\s+/g, "-");
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

  console.log("🌍 Country Mapping Coverage Analysis:");
  console.log(`📊 Total unique countries in API data: ${allCountries.size}`);
  console.log(`✅ Mapped countries: ${mappedCountries.size}`);
  console.log(`❌ Unmapped countries: ${unmappedCountries.size}`);

  if (unmappedCountries.size > 0) {
    console.log("🚫 Missing countries from countryCodeMap:");
    Array.from(unmappedCountries)
      .sort()
      .forEach((country) => {
        console.log(`   - "${country}"`);
      });

    console.log("\n💡 Suggested additions to countryCodeMap:");
    Array.from(unmappedCountries)
      .sort()
      .forEach((country) => {
        // Try to suggest a country code
        const suggested = suggestCountryCode(country);
        console.log(`   '${country}': '${suggested}',`);
      });
  }

  console.log("\n📋 All countries found in API data:");
  Array.from(allCountries)
    .sort()
    .forEach((country) => {
      const isMapped = mappedCountries.has(country);
      console.log(`   ${isMapped ? "✅" : "❌"} ${country}`);
    });
}

/**
 * Suggest a country code for an unmapped country
 */
function suggestCountryCode(country: string): string {
  // Common patterns and known mappings
  const suggestions: { [key: string]: string } = {
    // Add common variations here
    "United States": "US",
    "United Kingdom": "GB",
    "South Korea": "KR",
    "North Korea": "KP",
    "Czech Republic": "CZ",
    "Bosnia and Herzegovina": "BA",
    "North Macedonia": "MK",
    "Costa Rica": "CR",
    "South Africa": "ZA",
    "New Zealand": "NZ",
    "Saudi Arabia": "SA",
    "United Arab Emirates": "AE",
    "Dominican Republic": "DO",
    "Trinidad and Tobago": "TT",
    "El Salvador": "SV",
  };

  if (suggestions[country]) {
    return suggestions[country];
  }

  // Generate a best guess based on country name
  const words = country.split(" ");
  if (words.length === 1) {
    // Single word - take first 2 letters
    return country.substring(0, 2).toUpperCase();
  } else {
    // Multiple words - take first letter of each word
    return words
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
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
  console.log(`🗺️ Direct mapping: ${countryCode || "NOT FOUND"}`);

  // Try variations
  if (!countryCode && normalizedCountry.includes("-")) {
    const spaceVersion = normalizedCountry.replace(/-/g, " ");
    countryCode = countryCodeMap[spaceVersion];
    console.log(
      `🔄 Space variation "${spaceVersion}": ${countryCode || "NOT FOUND"}`,
    );
  }

  if (!countryCode && normalizedCountry.includes(" ")) {
    const hyphenVersion = normalizedCountry.replace(/\s+/g, "-");
    countryCode = countryCodeMap[hyphenVersion];
    console.log(
      `🔄 Hyphen variation "${hyphenVersion}": ${countryCode || "NOT FOUND"}`,
    );
  }

  // Show similar matches
  const similarMatches = Object.keys(countryCodeMap).filter(
    (key) =>
      key.toLowerCase().includes(normalizedCountry.toLowerCase()) ||
      normalizedCountry.toLowerCase().includes(key.toLowerCase()),
  );

  if (similarMatches.length > 0) {
    console.log(
      `🎯 Similar matches found:`,
      similarMatches.map((match) => `"${match}" -> ${countryCodeMap[match]}`),
    );
  }

  console.log(`✅ Final result: ${countryCode || "FALLBACK WILL BE USED"}`);
}

/**
 * Clear Venezuela flag cache specifically for debugging
 */
export const clearVenezuelaFlagCache = () => {
  const venezuelaCacheKeys = [
    "flag_venezuela",
    "flag_venezuela_(bolivarian_republic_of)",
    "flag_venezuela_(bolivarian_republic)",
    "flag_bolivarian_republic_of_venezuela",
    "flag_bolivarian_republic_of",
    "flag_ve",
    "flag_ven",
  ];

  console.log(`🗑️ Starting Venezuela flag cache cleanup...`);

  venezuelaCacheKeys.forEach((cacheKey) => {
    const cached = flagCache.getCached(cacheKey);
    if (cached) {
      console.log(`🗑️ Clearing Venezuela flag cache:`, {
        cacheKey,
        oldUrl: cached.url,
        oldSource: cached.source,
        age:
          Math.round((Date.now() - cached.timestamp) / 1000 / 60) + " minutes",
      });

      // Clear from cache
      (flagCache as any).cache.delete(cacheKey);
    }
  });

  // Clear from memory cache
  for (const [key] of flagCacheMem.entries()) {
    if (key.includes("venezuela") || key.includes("bolivarian")) {
      flagCacheMem.delete(key);
      console.log(`🗑️ Cleared memory cache key: ${key}`);
    }
  }

  // Also clear from localStorage
  try {
    const storedCache = localStorage.getItem("cssport_flag_cache");
    if (storedCache) {
      const cacheData = JSON.parse(storedCache);
      if (cacheData.flags) {
        const originalCount = cacheData.flags.length;
        cacheData.flags = cacheData.flags.filter(
          ([key]: any) =>
            !venezuelaCacheKeys.includes(key) &&
            !key.includes("venezuela") &&
            !key.includes("bolivarian"),
        );
        const clearedCount = originalCount - cacheData.flags.length;
        localStorage.setItem("cssport_flag_cache", JSON.stringify(cacheData));
        console.log(
          `🗑️ Cleared ${clearedCount} Venezuela flags from localStorage`,
        );
      }
    }
  } catch (error) {
    console.warn("Failed to clear Venezuela flags from localStorage:", error);
  }

  // Generate correct flag and re-cache with normalized key
  const correctFlag = "https://flagcdn.com/w40/ve.png";
  flagCache.setCached("flag_venezuela", correctFlag, "cleanup-fix", true);
  console.log(
    `✅ Re-cached Venezuela flag with normalized key: flag_venezuela`,
  );
};

/**
 * Force refresh Venezuela flag - clears all caches and refetches
 */
export function forceRefreshVenezuelaFlag(): Promise<string> {
  console.log(`🔄 Force refreshing Venezuela flag...`);

  // Clear all possible cache entries
  const possibleKeys = ["flag_venezuela", "Venezuela-", "venezuela"];
  possibleKeys.forEach((key) => {
    (flagCache as any).cache.delete(key);
    flagCacheMem.delete(key);
  });

  // Clear from localStorage
  try {
    const storedCache = localStorage.getItem("cssport_flag_cache");
    if (storedCache) {
      const cacheData = JSON.parse(storedCache);
      if (cacheData.flags) {
        cacheData.flags = cacheData.flags.filter(
          ([key]: any) =>
            !possibleKeys.some((possibleKey) => key.includes(possibleKey)),
        );
        localStorage.setItem("cssport_flag_cache", JSON.stringify(cacheData));
        console.log(`🗑️ Cleared all Venezuela-related flags from localStorage`);
      }
    }
  } catch (error) {
    console.warn("Failed to clear Venezuela flags from localStorage:", error);
  }

  // Force fresh fetch with correct URL
  const correctFlag = "https://flagcdn.com/w40/ve.png";
  const cacheKey = "flag_venezuela";
  flagCache.setCached(cacheKey, correctFlag, "manual-venezuela-fix", true);
  console.log(`✅ Manually set Venezuela flag to: ${correctFlag}`);

  return Promise.resolve(correctFlag);
}

/**
 * Clear all flag cache and force refresh
 */
export function clearAllFlagCache(): void {
  console.log(`🧹 Clearing all flag cache...`);

  // Clear memory cache
  flagCacheMem.clear();

  // Clear main flag cache
  (flagCache as any).cache.clear();

  // Clear localStorage
  try {
    localStorage.removeItem("cssport_flag_cache");
    console.log(`🗑️ Cleared all flags from localStorage`);
  } catch (error) {
    console.warn("Failed to clear flags from localStorage:", error);
  }

  console.log(`✅ All flag cache cleared`);
}

/**
 * Debug flag mapping for a specific country
 */
export function debugCountryFlagMapping(country: string): void {
  console.log(`🔍 Debugging flag for country: "${country}"`);
  const normalizedCountry = country.trim();

  // Check direct mapping
  let countryCode = countryCodeMap[normalizedCountry];
  console.log(`Direct mapping: ${countryCode || "NOT FOUND"}`);

  // Check variations
  if (!countryCode && normalizedCountry.includes("-")) {
    const spaceVersion = normalizedCountry.replace(/-/g, " ");
    countryCode = countryCodeMap[spaceVersion];
    console.log(
      `Space variation "${spaceVersion}": ${countryCode || "NOT FOUND"}`,
    );
  }

  if (!countryCode && normalizedCountry.includes(" ")) {
    const hyphenVersion = normalizedCountry.replace(/\s+/g, "-");
    countryCode = countryCodeMap[hyphenVersion];
    console.log(
      `Hyphen variation "${hyphenVersion}": ${countryCode || "NOT FOUND"}`,
    );
  }

  // Check cache
  const cacheKey = `flag_${country.toLowerCase().replace(/\s+/g, "_")}`;
  const cached = flagCache.getCached(cacheKey);
  if (cached) {
    console.log(`Cached flag: ${cached.url} (source: ${cached.source})`);
  } else {
    console.log(`No cached flag found`);
  }

  // Generate expected flag URL
  if (countryCode) {
    const expectedUrl = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
    console.log(`Expected flag URL: ${expectedUrl}`);
  }
}

/**
 * Get flag cache statistics for debugging with performance metrics
 */
export function getFlagCacheStats(): void {
  const cache = (flagCache as any).cache; // Access the internal Map
  if (cache instanceof Map) {
    const stats = {
      total: cache.size,
      valid: 0,
      fallback: 0,
      expired: 0,
      fresh: 0,
      mostUsed: "",
      leastUsed: "",
      avgUsage: 0,
    };

    const now = Date.now();
    let totalUsage = 0;
    let maxUsage = 0;
    let minUsage = Infinity;
    let maxUsageKey = "";
    let minUsageKey = "";

    for (const [key, value] of cache.entries()) {
      const age = now - value.timestamp;
      const maxAge = value.url.includes("/assets/fallback-logo.svg")
        ? 60 * 60 * 1000 // 1 hour for fallbacks
        : 24 * 60 * 60 * 1000; // 24 hours for valid flags

      if (age > maxAge) {
        stats.expired++;
      } else {
        stats.fresh++;
      }

      if (value.url.includes("/assets/fallback-logo.svg")) {
        stats.fallback++;
      } else {
        stats.valid++;
      }

      // Track usage statistics
      const usage = flagUsageTracker.get(key);
      if (usage) {
        totalUsage += usage.count;
        if (usage.count > maxUsage) {
          maxUsage = usage.count;
          maxUsageKey = key.replace("flag_", "");
        }
        if (usage.count < minUsage) {
          minUsage = usage.count;
          minUsageKey = key.replace("flag_", "");
        }
      }
    }

    stats.avgUsage = Math.round(totalUsage / cache.size);
    stats.mostUsed = `${maxUsageKey} (${maxUsage})`;
    stats.leastUsed = `${minUsageKey} (${minUsage === Infinity ? 0 : minUsage})`;

    console.log("🎌 Enhanced Flag Cache Stats:", stats);
    console.log("📊 Usage Performance:", {
      totalRequests: totalUsage,
      cacheHitRatio: `${((stats.fresh / (stats.fresh + stats.expired)) * 100).toFixed(1)}%`,
      fallbackRatio: `${((stats.fallback / stats.total) * 100).toFixed(1)}%`,
    });
  }
}

/**
 * Clear all cached fallback flags to force re-fetching (use sparingly)
 * Disabled - let the cache system handle expiration naturally
 */
export function clearFallbackFlagCache(): void {
  console.log("Cache clearing disabled - relying on natural cache expiration");
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
      verified: cached.verified,
    });
  } else {
    console.log(`❌ No cache found for ${country} with key: ${cacheKey}`);
  }
}

/**
 * 365scores.com commonly used countries based on their website structure
 */
const scores365Countries = [
  // Major European countries
  "England",
  "Spain",
  "Germany",
  "France",
  "Italy",
  "Netherlands",
  "Portugal",
  "Belgium",
  "Turkey",
  "Switzerland",
  "Austria",
  "Denmark",
  "Sweden",
  "Norway",
  "Poland",
  "Czech Republic",
  "Croatia",
  "Serbia",
  "Greece",
  "Ukraine",
  "Russia",
  "Bulgaria",
  "Romania",
  "Hungary",
  "Slovakia",
  "Slovenia",
  "Bosnia and Herzegovina",
  "North Macedonia",
  "Montenegro",
  "Albania",
  "Kosovo",
  "Moldova",
  "Belarus",
  "Lithuania",
  "Latvia",
  "Estonia",
  "Finland",
  "Iceland",
  "Ireland",
  "Malta",
  "Cyprus",
  "Luxembourg",
  "Scotland",
  "Wales",
  "Northern Ireland",

  // Major South American countries
  "Brazil",
  "Argentina",
  "Mexico",
  "Colombia",
  "Peru",
  "Chile",
  "Uruguay",
  "Paraguay",
  "Bolivia",
  "Ecuador",
  "Venezuela",

  // North America & Caribbean
  "United States",
  "USA",
  "Canada",
  "Costa Rica",
  "Panama",
  "Guatemala",
  "Honduras",
  "El Salvador",
  "Nicaragua",
  "Jamaica",
  "Trinidad and Tobago",
  "Cuba",
  "Dominican Republic",
  "Haiti",
  "Barbados",
  "Bahamas",

  // Caribbean territories commonly on sports sites
  "Curaçao",
  "Curacao",
  "Sint Maarten",
  "Aruba",
  "Bonaire",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Grenada",
  "Dominica",
  "Antigua and Barbuda",
  "Saint Kitts and Nevis",
  "Montserrat",
  "Anguilla",
  "British Virgin Islands",
  "US Virgin Islands",
  "Puerto Rico",
  "Cayman Islands",
  "Turks and Caicos",
  "Bermuda",

  // Major Asian countries
  "Japan",
  "South Korea",
  "China",
  "India",
  "Thailand",
  "Vietnam",
  "Malaysia",
  "Singapore",
  "Indonesia",
  "Philippines",
  "Myanmar",
  "Cambodia",
  "Laos",
  "Brunei",
  "Pakistan",
  "Bangladesh",
  "Sri Lanka",
  "Nepal",
  "Bhutan",
  "Maldives",
  "Afghanistan",
  "Iran",
  "Iraq",
  "Saudi Arabia",
  "United Arab Emirates",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "Yemen",
  "Jordan",
  "Lebanon",
  "Syria",
  "Israel",
  "Palestine",

  // Asian territories and regions
  "Hong Kong",
  "Macau",
  "Macao",
  "Taiwan",
  "Chinese Taipei",

  // Oceania
  "Australia",
  "New Zealand",
  "Papua New Guinea",
  "Fiji",
  "Samoa",
  "Tonga",
  "Vanuatu",
  "Solomon Islands",
  "Cook Islands",
  "Niue",
  "American Samoa",
  "Guam",
  "Northern Mariana Islands",
  "French Polynesia",
  "New Caledonia",

  // Major African countries
  "Egypt",
  "Libya",
  "Tunisia",
  "Algeria",
  "Morocco",
  "Sudan",
  "South Sudan",
  "Ethiopia",
  "Eritrea",
  "Djibouti",
  "Somalia",
  "Kenya",
  "Uganda",
  "Tanzania",
  "Rwanda",
  "Burundi",
  "Nigeria",
  "Ghana",
  "Ivory Coast",
  "Senegal",
  "Mali",
  "Burkina Faso",
  "Niger",
  "Chad",
  "Central African Republic",
  "Cameroon",
  "Equatorial Guinea",
  "Gabon",
  "Republic of the Congo",
  "Democratic Republic of the Congo",
  "Congo DR",
  "Congo DRC",
  "Angola",
  "Zambia",
  "Zimbabwe",
  "Botswana",
  "Namibia",
  "South Africa",
  "Lesotho",
  "Eswatini",
  "Madagascar",
  "Mauritius",
  "Seychelles",
  "Comoros",
  "Cape Verde",
  "Guinea-Bissau",
  "Guinea",
  "Sierra Leone",
  "Liberia",
  "Togo",
  "Benin",
  "Mauritania",
  "Gambia",
  "Malawi",

  // Central Asian countries
  "Kazakhstan",
  "Uzbekistan",
  "Turkmenistan",
  "Kyrgyzstan",
  "Tajikistan",
  "Azerbaijan",
  "Armenia",
  "Georgia",
  "Mongolia",

  // Special territories and regions
  "Faroe Islands",
  "Greenland",
  "Isle of Man",
  "Jersey",
  "Guernsey",
  "Gibraltar",
  "Falkland Islands",
  "Saint Helena",
  "Norfolk Island",
  "Christmas Island",
  "Cocos Islands",

  // International/Continental
  "World",
  "Europe",
];

/**
 * SportsRadar commonly supported countries based on their API patterns
 */
const sportsRadarCountries = [
  // All UEFA countries
  "Albania",
  "Andorra",
  "Armenia",
  "Austria",
  "Azerbaijan",
  "Belarus",
  "Belgium",
  "Bosnia and Herzegovina",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "England",
  "Estonia",
  "Faroe Islands",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Gibraltar",
  "Greece",
  "Hungary",
  "Iceland",
  "Ireland",
  "Israel",
  "Italy",
  "Kazakhstan",
  "Kosovo",
  "Latvia",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Moldova",
  "Monaco",
  "Montenegro",
  "Netherlands",
  "North Macedonia",
  "Northern Ireland",
  "Norway",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "San Marino",
  "Scotland",
  "Serbia",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
  "Switzerland",
  "Turkey",
  "Ukraine",
  "Wales",

  // All CONMEBOL countries
  "Argentina",
  "Bolivia",
  "Brazil",
  "Chile",
  "Colombia",
  "Ecuador",
  "Paraguay",
  "Peru",
  "Uruguay",
  "Venezuela",

  // Major CONCACAF countries
  "Antigua and Barbuda",
  "Bahamas",
  "Barbados",
  "Belize",
  "Canada",
  "Costa Rica",
  "Cuba",
  "Dominica",
  "Dominican Republic",
  "El Salvador",
  "Grenada",
  "Guatemala",
  "Haiti",
  "Honduras",
  "Jamaica",
  "Mexico",
  "Nicaragua",
  "Panama",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Trinidad and Tobago",
  "United States",

  // Major AFC countries
  "Afghanistan",
  "Australia",
  "Bahrain",
  "Bangladesh",
  "Bhutan",
  "Brunei",
  "Cambodia",
  "China",
  "Guam",
  "Hong Kong",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Japan",
  "Jordan",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Lebanon",
  "Macau",
  "Malaysia",
  "Maldives",
  "Mongolia",
  "Myanmar",
  "Nepal",
  "North Korea",
  "Oman",
  "Pakistan",
  "Palestine",
  "Philippines",
  "Qatar",
  "Saudi Arabia",
  "Singapore",
  "South Korea",
  "Sri Lanka",
  "Syria",
  "Tajikistan",
  "Thailand",
  "Timor-Leste",
  "Turkmenistan",
  "United Arab Emirates",
  "Uzbekistan",
  "Vietnam",
  "Yemen",

  // Major CAF countries
  "Algeria",
  "Angola",
  "Benin",
  "Botswana",
  "Burkina Faso",
  "Burundi",
  "Cameroon",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Comoros",
  "Congo",
  "Democratic Republic of the Congo",
  "Djibouti",
  "Egypt",
  "Equatorial Guinea",
  "Eritrea",
  "Eswatini",
  "Ethiopia",
  "Gabon",
  "Gambia",
  "Ghana",
  "Guinea",
  "Guinea-Bissau",
  "Ivory Coast",
  "Kenya",
  "Lesotho",
  "Liberia",
  "Libya",
  "Madagascar",
  "Malawi",
  "Mali",
  "Mauritania",
  "Mauritius",
  "Morocco",
  "Mozambique",
  "Namibia",
  "Niger",
  "Nigeria",
  "Rwanda",
  "Sao Tome and Principe",
  "Senegal",
  "Seychelles",
  "Sierra Leone",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Sudan",
  "Tanzania",
  "Togo",
  "Tunisia",
  "Uganda",
  "Zambia",
  "Zimbabwe",

  // OFC countries
  "American Samoa",
  "Cook Islands",
  "Fiji",
  "New Caledonia",
  "New Zealand",
  "Papua New Guinea",
  "Samoa",
  "Solomon Islands",
  "Tahiti",
  "Tonga",
  "Vanuatu",
];

/**
 * Compare your current country mapping with 365scores.com patterns
 */
export function compare365ScoresMapping(): void {
  console.log("🏆 Comparing Current Mapping vs 365scores.com Patterns");
  console.log("=".repeat(60));

  const currentlyMapped = new Set(Object.keys(countryCodeMap));
  const scores365Set = new Set(scores365Countries);

  // Countries in 365scores but missing from your mapping
  const missingFrom365 = scores365Countries.filter(
    (country) => !currentlyMapped.has(country),
  );

  // Countries inyour mapping but not typically on 365scores
  const extraInMapping = Array.from(currentlyMapped).filter(
    (country) => !scores365Set.has(country),
  );

  console.log(`📊 Comparison Results:`);
  console.log(`   Current mapping: ${currentlyMapped.size} countries`);
  console.log(`   365scores patterns: ${scores365Countries.length} countries`);
  console.log(`   Missing from current: ${missingFrom365.length} countries`);
  console.log(`   Extra in current: ${extraInMapping.length} countries`);

  if (missingFrom365.length > 0) {
    console.log(
      "\n🚫 Countries common on 365scores.com but missing from your mapping:",
    );
    missingFrom365.sort().forEach((country) => {
      const suggested = suggestCountryCode(country);
      console.log(`   ❌ "${country}" -> suggested: "${suggested}"`);
    });

    console.log("\n💡 Suggested additions to countryCodeMap:");
    missingFrom365.sort().forEach((country) => {
      const suggested = suggestCountryCode(country);
      console.log(`   '${country}': '${suggested}',`);
    });
  }

  if (extraInMapping.length > 0 && extraInMapping.length <= 20) {
    console.log("\n📝 Countries in your mapping but not typical on 365scores:");
    extraInMapping.sort().forEach((country) => {
      console.log(`   ℹ️  "${country}": '${countryCodeMap[country]}'`);
    });
  }

  // Coverage percentage
  const commonCountries = scores365Countries.filter((country) =>
    currentlyMapped.has(country),
  );
  const coverage = (
    (commonCountries.length / scores365Countries.length) *
    100
  ).toFixed(1);
  console.log(
    `\n📈 Coverage: ${coverage}% of 365scores.com patterns are supported`,
  );
}

/**
 * Compare your current country mapping with SportsRadar patterns
 */
export function compareSportsRadarMapping(): void {
  console.log("🎯 Comparing Current Mapping vs SportsRadar Patterns");
  console.log("=".repeat(60));

  const currentlyMapped = new Set(Object.keys(countryCodeMap));
  const sportsRadarSet = new Set(sportsRadarCountries);

  // Countries in SportsRadar but missing from your mapping
  const missingFromSportsRadar = sportsRadarCountries.filter(
    (country) => !currentlyMapped.has(country),
  );

  // Countries in your mapping but not in SportsRadar patterns
  const extraInMapping = Array.from(currentlyMapped).filter(
    (country) => !sportsRadarSet.has(country),
  );

  console.log(`📊 Comparison Results:`);
  console.log(`   Current mapping: ${currentlyMapped.size} countries`);
  console.log(
    `   SportsRadar patterns: ${sportsRadarCountries.length} countries`,
  );
  console.log(
    `   Missing from current: ${missingFromSportsRadar.length} countries`,
  );
  console.log(`   Extra in current: ${extraInMapping.length} countries`);

  if (missingFromSportsRadar.length > 0) {
    console.log(
      "\n🚫 Countries supported by SportsRadar but missing from your mapping:",
    );
    missingFromSportsRadar.sort().forEach((country) => {
      const suggested = suggestCountryCode(country);
      console.log(`   ❌ "${country}" -> suggested: "${suggested}"`);
    });

    console.log("\n💡 Suggested additions to countryCodeMap:");
    missingFromSportsRadar.sort().forEach((country) => {
      const suggested = suggestCountryCode(country);
      console.log(`   '${country}': '${suggested}',`);
    });
  }

  // Coverage percentage
  const commonCountries = sportsRadarCountries.filter((country) =>
    currentlyMapped.has(country),
  );
  const coverage = (
    (commonCountries.length / sportsRadarCountries.length) *
    100
  ).toFixed(1);
  console.log(
    `\n📈 Coverage: ${coverage}% of SportsRadar patterns are supported`,
  );
}

/**
 * Comprehensive comparison of all three mappings
 */
export function compareAllCountryMappings(): void {
  console.log("🌍 COMPREHENSIVE COUNTRY MAPPING COMPARISON");
  console.log("=".repeat(80));

  const currentMapped = new Set(Object.keys(countryCodeMap));
  const scores365Set = new Set(scores365Countries);
  const sportsRadarSet = new Set(sportsRadarCountries);

  // Find overlaps and unique countries
  const allCountries = new Set([
    ...Array.from(currentMapped),
    ...scores365Countries,
    ...sportsRadarCountries,
  ]);

  const results = {
    inAll: [],
    inCurrentAndScores365: [],
    inCurrentAndSportsRadar: [],
    inScores365AndSportsRadar: [],
    onlyInCurrent: [],
    onlyInScores365: [],
    onlyInSportsRadar: [],
    missingFromAll: [],
  };

  for (const country of allCountries) {
    const inCurrent = currentMapped.has(country);
    const inScores365 = scores365Set.has(country);
    const inSportsRadar = sportsRadarSet.has(country);

    if (inCurrent && inScores365 && inSportsRadar) {
      results.inAll.push(country);
    } else if (inCurrent && inScores365) {
      results.inCurrentAndScores365.push(country);
    } else if (inCurrent && inSportsRadar) {
      results.inCurrentAndSportsRadar.push(country);
    } else if (inScores365 && inSportsRadar) {
      results.inScores365AndSportsRadar.push(country);
    } else if (inCurrent) {
      results.onlyInCurrent.push(country);
    } else if (inScores365) {
      results.onlyInScores365.push(country);
    } else if (inSportsRadar) {
      results.onlyInSportsRadar.push(country);
    }
  }

  console.log(`📊 SUMMARY STATISTICS:`);
  console.log(`   Total unique countries: ${allCountries.size}`);
  console.log(`   Current mapping: ${currentMapped.size} countries`);
  console.log(`   365scores patterns: ${scores365Countries.length} countries`);
  console.log(
    `   SportsRadar patterns: ${sportsRadarCountries.length} countries`,
  );
  console.log(`   Supported by all three: ${results.inAll.length} countries`);

  console.log(
    `\n🎯 PRIORITY ADDITIONS (missing from current but in both 365scores and SportsRadar):`,
  );
  if (results.inScores365AndSportsRadar.length > 0) {
    results.inScores365AndSportsRadar.sort().forEach((country) => {
      const suggested = suggestCountryCode(country);
      console.log(`   🔥 "${country}": '${suggested}',`);
    });
  } else {
    console.log(
      `   ✅ Great! No countries are missing from your mapping that are in both sources.`,
    );
  }

  console.log(`\n📱 365SCORES SPECIFIC (in 365scores but not SportsRadar):`);
  if (
    results.onlyInScores365.length > 0 &&
    results.onlyInScores365.length <= 15
  ) {
    results.onlyInScores365.sort().forEach((country) => {
      const suggested = suggestCountryCode(country);
      console.log(`   📱 "${country}": '${suggested}',`);
    });
  } else if (results.onlyInScores365.length > 15) {
    console.log(
      `   📱 ${results.onlyInScores365.length} countries (too many to list individually)`,
    );
  }

  console.log(`\n🎯 SPORTSRADAR SPECIFIC (in SportsRadar but not 365scores):`);
  if (
    results.onlyInSportsRadar.length > 0 &&
    results.onlyInSportsRadar.length <= 15
  ) {
    results.onlyInSportsRadar.sort().forEach((country) => {
      const suggested = suggestCountryCode(country);
      console.log(`   🎯 "${country}": '${suggested}',`);
    });
  } else if (results.onlyInSportsRadar.length > 15) {
    console.log(
      `   🎯 ${results.onlyInSportsRadar.length} countries (too many to list individually)`,
    );
  }

  // Coverage statistics
  const scores365Coverage = (
    ((results.inAll.length + results.inCurrentAndScores365.length) /
      scores365Countries.length) *
    100
  ).toFixed(1);
  const sportsRadarCoverage = (
    ((results.inAll.length + results.inCurrentAndSportsRadar.length) /
      sportsRadarCountries.length) *
    100
  ).toFixed(1);

  console.log(`\n📈 COVERAGE ANALYSIS:`);
  console.log(`   365scores coverage: ${scores365Coverage}%`);
  console.log(`   SportsRadar coverage: ${sportsRadarCoverage}%`);

  console.log(`\n💡 RECOMMENDATIONS:`);
  console.log(
    `   1. Add the ${results.inScores365AndSportsRadar.length} priority countries (in both sources)`,
  );
  console.log(
    `   2. Consider adding 365scores-specific countries for better web compatibility`,
  );
  console.log(
    `   3. Consider adding SportsRadar-specific countries for better API compatibility`,
  );
}

/**
 * Test country mapping against live API data and external sources
 */
export async function testCountryMappingAgainstLiveData(
  fixtures: any[],
): Promise<void> {
  console.log("🧪 Testing Country Mapping Against Live API Data");
  console.log("=".repeat(60));

  const apiCountries = new Set<string>();
  const mappedCountries = new Set<string>();
  const unmappedCountries = new Set<string>();

  // Extract countries from live fixtures
  fixtures.forEach((fixture) => {
    if (fixture?.league?.country) {
      const country = fixture.league.country.trim();
      apiCountries.add(country);

      if (countryCodeMap[country]) {
        mappedCountries.add(country);
      } else {
        // Try variations
        let found = false;
        if (country.includes("-")) {
          const spaceVersion = country.replace(/-/g, " ");
          if (countryCodeMap[spaceVersion]) {
            mappedCountries.add(country);
            found = true;
          }
        }
        if (!found && country.includes(" ")) {
          const hyphenVersion = country.replace(/\s+/g, "-");
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

  console.log(`📊 Live API Data Analysis:`);
  console.log(`   Total countries in API: ${apiCountries.size}`);
  console.log(`   Mapped countries: ${mappedCountries.size}`);
  console.log(`   Unmapped countries: ${unmappedCountries.size}`);

  if (unmappedCountries.size > 0) {
    console.log(`\n🚫 Countries from API missing in mapping:`);
    Array.from(unmappedCountries)
      .sort()
      .forEach((country) => {
        const suggested = suggestCountryCode(country);
        const in365 = scores365Countries.includes(country) ? "📱" : "  ";
        const inSR = sportsRadarCountries.includes(country) ? "🎯" : "  ";
        console.log(`   ${in365}${inSR} "${country}": '${suggested}',`);
      });
  }

  // Check coverage against external sources
  const apiCountriesArray = Array.from(apiCountries);
  const in365Count = apiCountriesArray.filter((country) =>
    scores365Countries.includes(country),
  ).length;
  const inSRCount = apiCountriesArray.filter((country) =>
    sportsRadarCountries.includes(country),
  ).length;

  console.log(`\n🎯 External Source Recognition:`);
  console.log(
    `   Countries also in 365scores patterns: ${in365Count}/${apiCountries.size}`,
  );
  console.log(
    `   Countries also in SportsRadar patterns: ${inSRCount}/${apiCountries.size}`,
  );

  // Show countries that are in API but not in any external source
  const notInAnySources = apiCountriesArray.filter(
    (country) =>
      !scores365Countries.includes(country) &&
      !sportsRadarCountries.includes(country),
  );

  if (notInAnySources.length > 0) {
    console.log(`\n❓ Countries in API but not in external source patterns:`);
    notInAnySources.sort().forEach((country) => {
      console.log(`   ❓ "${country}"`);
    });
  }
}

export const getFlagUrl = async (country: string): Promise<string> => {
  // Normalize country name
  const normalizedCountry = country.trim();

  if (!normalizedCountry) {
    console.warn("Empty country name provided to getFlagUrl");
    return "/assets/fallback-logo.svg";
  }

  // Check cache first
  const cacheKey = `flag_${normalizedCountry.toLowerCase().replace(/\s+/g, "_")}`;
  const cached = flagCache.getCached(cacheKey);

  if (cached) {
    return cached.url;
  }

  console.log(`Getting flag for country: ${normalizedCountry}`);

  try {
    // Try our API endpoint first (which uses SportsRadar)
    const response = await fetch(
      `/api/flags/${encodeURIComponent(normalizedCountry)}`,
      {
        signal: AbortSignal.timeout(5000),
      },
    );

    if (response.ok) {
      const data = await response.json();

      if (data.success && data.flagUrl) {
        console.log(
          `✅ Valid flag found for ${normalizedCountry}: ${data.flagUrl}`,
        );
        flagCache.setCached(cacheKey, data.flagUrl, "api-success", true);
        return data.flagUrl;
      }

      if (data.shouldExclude) {
        console.log(
          `🚫 Country ${normalizedCountry} should be excluded due to missing flag`,
        );
        flagCache.setCached(
          cacheKey,
          "/assets/fallback-logo.svg",
          "api-exclude",
          true,
        );
        return "/assets/fallback-logo.svg";
      }
    }

    console.log(
      `❌ API failed for ${normalizedCountry}, trying fallback sources`,
    );

    // Fallback 1: Try API-Football format
    try {
      console.log(`Flag fallback for ${normalizedCountry}: trying source 1/3`);
      const apiFootballUrl = `https://media.api-sports.io/flags/${normalizedCountry.toLowerCase().replace(/\s+/g, "")}.svg`;

      const apiFootballResponse = await fetch(apiFootballUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(3000),
      });

      if (apiFootballResponse.ok) {
        console.log(
          `✅ Valid flag found via API-Football for ${normalizedCountry}: ${apiFootballUrl}`,
        );
        flagCache.setCached(cacheKey, apiFootballUrl, "api-football", true);
        return apiFootballUrl;
      }
    } catch (e) {
      console.log(`Failed API-Football fallback for ${normalizedCountry}`);
    }

    // Fallback 2: Try 365scores CDN
    try {
      console.log(`Flag fallback for ${normalizedCountry}: trying source 2/3`);
      const scores365Url = `https://sports.365scores.com/CDN/images/flags/${normalizedCountry.toLowerCase().replace(/\s+/g, "_")}.svg`;

      const scores365Response = await fetch(scores365Url, {
        method: "HEAD",
        signal: AbortSignal.timeout(3000),
      });

      if (scores365Response.ok) {
        console.log(
          `✅ Valid flag found via 365scores for ${normalizedCountry}: ${scores365Url}`,
        );
        flagCache.setCached(cacheKey, scores365Url, "365scores", true);
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
        const countryCodeUrl = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;

        const countryCodeResponse = await fetch(countryCodeUrl, {
          method: "HEAD",
          signal: AbortSignal.timeout(3000),
        });

        if (countryCodeResponse.ok) {
          console.log(
            `✅ Valid flag found via country code for ${normalizedCountry}: ${countryCodeUrl}`,
          );
          flagCache.setCached(cacheKey, countryCodeUrl, "country-code", true);
          return countryCodeUrl;
        }
      }
    } catch (e) {
      console.log(`Failed country code fallback for ${normalizedCountry}`);
    }

    console.log(
      `❌ All flag sources failed for ${normalizedCountry}, using fallback`,
    );

    // All fallbacks failed, use default
    const fallbackUrl = "/assets/fallback-logo.svg";
    flagCache.setCached(cacheKey, fallbackUrl, "final-fallback", true);
    return fallbackUrl;
  } catch (error) {
    console.error(`Error fetching flag for ${normalizedCountry}:`, error);
    const fallbackUrl = "/assets/fallback-logo.svg";
    flagCache.setCached(cacheKey, fallbackUrl, "error-fallback", true);
    return fallbackUrl;
  }
};

/**
 * Generate consistent cache key for flags
 */
export function getFlagCacheKey(country: string): string {
  return `flag_${country.toLowerCase().replace(/\s+/g, "_")}`;
}

/**
 * Analyze countries against external source patterns (like 365scores.com)
 * This helps identify missing countries that might be common on other sports sites
 */
export function analyzeCountriesAgainstExternalSources(
  apiCountries: string[],
): void {
  console.log(
    "🌐 Analyzing countries against external sports sources (365scores.com style)...",
  );

  // Common patterns found on 365scores.com and similar sports sites
  const externalSourcePatterns = [
    "Curaçao",
    "Curacao",
    "Sint Maarten",
    "Aruba",
    "Bonaire",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Grenada",
    "Dominica",
    "Antigua and Barbuda",
    "Saint Kitts and Nevis",
    "Montserrat",
    "Anguilla",
    "British Virgin Islands",
    "US Virgin Islands",
    "Puerto Rico",
    "Cayman Islands",
    "Turks and Caicos",
    "Bermuda",
    "Falkland Islands",
    "Gibraltar",
    "Saint Helena",
    "Norfolk Island",
    "Christmas Island",
    "Cocos Islands",
    "Chinese Taipei",
    "DR Congo",
    "Congo DR",
    "Congo DRC",
    "Republic of Congo",
    "Congo Republic",
    "Congo-Brazzaville",
    "Congo-Kinshasa",
  ];

  const foundInApi = new Set(apiCountries.map((c) => c.trim()));
  const mappedExternal = new Set<string>();
  const unmappedExternal = new Set<string>();

  externalSourcePatterns.forEach((pattern) => {
    if (countryCodeMap[pattern]) {
      mappedExternal.add(pattern);
    } else {
      // Check for variations
      let found = false;
      if (pattern.includes(" ")) {
        const hyphenVersion = pattern.replace(/\s+/g, "-");
        if (countryCodeMap[hyphenVersion]) {
          mappedExternal.add(pattern);
          found = true;
        }
      }
      if (!found) {
        unmappedExternal.add(pattern);
      }
    }
  });

  console.log(`📊 External Source Analysis (365scores.com style):`);
  console.log(`✅ Mapped external patterns: ${mappedExternal.size}`);
  console.log(`❌ Unmapped external patterns: ${unmappedExternal.size}`);

  if (unmappedExternal.size > 0) {
    console.log("🚫 Missing patterns that might appear on 365scores.com:");
    Array.from(unmappedExternal)
      .sort()
      .forEach((pattern) => {
        console.log(`   - "${pattern}"`);
      });
  }

  // Check which of these patterns actually appear in our API data
  const actualMatches = new Set<string>();
  externalSourcePatterns.forEach((pattern) => {
    if (foundInApi.has(pattern)) {
      actualMatches.add(pattern);
    }
  });

  if (actualMatches.size > 0) {
    console.log("🎯 External patterns found in current API data:");
    Array.from(actualMatches)
      .sort()
      .forEach((pattern) => {
        const isMapped = countryCodeMap[pattern] ? "✅" : "❌";
        console.log(`   ${isMapped} "${pattern}"`);
      });
  }

  // Suggestions for common sports site countries
  console.log("\n💡 Consider adding these common sports site countries:");
  unmappedExternal.forEach((country) => {
    const suggested = suggestCountryCode(country);
    console.log(`   '${country}': '${suggested}',`);
  });
}

/**
 * Compare current country mapping coverage with 365scores.com style patterns
 */
export function compare365ScoresCompatibility(fixtures: any[]): void {
  console.log("🏆 Comparing with 365scores.com compatibility patterns...");

  const allCountries = new Set<string>();
  fixtures.forEach((fixture) => {
    if (fixture?.league?.country) {
      allCountries.add(fixture.league.country.trim());
    }
  });

  // Run both analyses
  analyzeCountryMappingCoverage(fixtures);
  analyzeCountriesAgainstExternalSources(Array.from(allCountries));

  console.log(
    "\n🔄 Cross-reference complete. Use the suggestions above to enhance country mapping.",
  );
}

import { getFlagForCountry, flagCache } from "./logoCache";
import { CACHE_FRESHNESS } from "./cacheFreshness";

// Global flag request deduplication with improved tracking
const pendingFlagRequests = new Map<string, Promise<string>>();
const flagRequestCounts = new Map<string, number>();

/**
 * Track and log flag request patterns for debugging
 */
function trackFlagRequest(country: string, cacheKey: string): void {
  const count = flagRequestCounts.get(cacheKey) || 0;
  flagRequestCounts.set(cacheKey, count + 1);

  if (count > 2) {
    console.log(
      `🔄 [flagUtils.ts] Multiple requests for ${country} (${count + 1} times) - consider component optimization`,
    );
  }
}

// Track flag usage for intelligent eviction
const flagUsageTracker = new Map<string, { count: number; lastUsed: number }>();

// Batch processing for flag requests
const flagBatchQueue = new Set<string>();
const flagBatchCallbacks = new Map<string, Array<(url: string) => void>>();
let batchProcessingTimeout: NodeJS.Timeout | null = null;

/**
 * Process batched flag requests efficiently with improved deduplication
 */
async function processFlagBatch(): Promise<void> {
  if (flagBatchQueue.size === 0) return;

  const countries = Array.from(flagBatchQueue);
  const callbacks = new Map<string, Array<(url: string) => void>>();

  // Collect all callbacks for this batch
  countries.forEach((country) => {
    const countryCallbacks = flagBatchCallbacks.get(country) || [];
    if (countryCallbacks.length > 0) {
      callbacks.set(country, [...countryCallbacks]);
    }
  });

  // Clear the batch queue and callbacks
  flagBatchQueue.clear();
  flagBatchCallbacks.clear();

  console.log(
    `🚀 [flagUtils.ts:processFlagBatch] Processing flag batch for ${countries.length} countries:`,
    countries.slice(0, 10),
  );

  // Filter out countries that are already cached or being processed
  const countriesToProcess = countries.filter((country) => {
    const cacheKey = `flag_${country.toLowerCase().replace(/\s+/g, "_")}`;
    const cached = flagCache.getCached(cacheKey);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      const maxAge = cached.url.includes("/assets/fallback-logo.svg")
        ? 60 * 60 * 1000 // 1 hour for fallbacks
        : 7 * 24 * 60 * 60 * 1000; // 7 days for valid flags

      if (age < maxAge) {
        // Use cached result immediately
        const countryCallbacks = callbacks.get(country) || [];
        countryCallbacks.forEach((callback) => callback(cached.url));
        return false; // Don't process this country
      }
    }
    return true; // Process this country
  });

  if (countriesToProcess.length === 0) {
    console.log(
      `✅ [flagUtils.ts:processFlagBatch] All countries were already cached, no processing needed`,
    );
    return;
  }

  console.log(
    `📊 [flagUtils.ts:processFlagBatch] Processing ${countriesToProcess.length}/${countries.length} countries (others were cached)`,
  );

  // Process countries in optimized chunks
  const chunkSize = 5; // Smaller chunks for better performance
  for (let i = 0; i < countriesToProcess.length; i += chunkSize) {
    const chunk = countriesToProcess.slice(i, i + chunkSize);

    const chunkPromises = chunk.map(async (country) => {
      try {
        const flagUrl = await fetchIndividualFlag(country);
        const countryCallbacks = callbacks.get(country) || [];
        countryCallbacks.forEach((callback) => callback(flagUrl));
        return { country, flagUrl, success: true };
      } catch (error) {
        console.warn(`Failed to fetch flag for ${country} in batch:`, error);
        const fallbackUrl = "/assets/fallback-logo.svg";
        const countryCallbacks = callbacks.get(country) || [];
        countryCallbacks.forEach((callback) => callback(fallbackUrl));
        return { country, flagUrl: fallbackUrl, success: false };
      }
    });

    await Promise.allSettled(chunkPromises);

    // Small delay between chunks to be respectful to external services
    if (i + chunkSize < countriesToProcess.length) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  console.log(
    `✅ Completed flag batch processing for ${countriesToProcess.length} countries`,
  );
}

/**
 * Fetch a single flag individually with comprehensive debugging
 */
async function fetchIndividualFlag(country: string): Promise<string> {
  const cacheKey = `flag_${country.toLowerCase().replace(/\s+/g, "_")}`;
  console.log(
    `🚀 [flagUtils.ts:fetchIndividualFlag] Starting individual fetch for: ${country}`,
  );

  // Special cases first
  if (country === "World") {
    const worldFlag = "/assets/world_flag_new.png";
    console.log(
      `🌍 [flagUtils.ts:fetchIndividualFlag] Special case - World flag: ${worldFlag}`,
    );
    flagCache.setCached(cacheKey, worldFlag, "local-world-flag", true);
    return worldFlag;
  }

  if (country === "Europe") {
    const europeFlag = "https://flagcdn.com/w40/eu.png";
    console.log(
      `🇪🇺 [flagUtils.ts:fetchIndividualFlag] Special case - Europe flag: ${europeFlag}`,
    );
    flagCache.setCached(cacheKey, europeFlag, "europe-direct", true);
    return europeFlag;
  }

  // Try country code mapping (this should have been caught earlier, but double-check)
  const normalizedCountry = country.trim();
  let countryCode = countryCodeMap[normalizedCountry];
  console.log(
    `🔍 [flagUtils.ts:fetchIndividualFlag] Country code lookup for "${normalizedCountry}": ${countryCode || "not found"}`,
  );

  if (!countryCode && normalizedCountry.includes("-")) {
    const spaceVersion = normalizedCountry.replace(/-/g, " ");
    countryCode = countryCodeMap[spaceVersion];
    console.log(
      `🔍 [flagUtils.ts:fetchIndividualFlag] Space variation "${spaceVersion}": ${countryCode || "not found"}`,
    );
  }

  if (!countryCode && normalizedCountry.includes(" ")) {
    const hyphenVersion = normalizedCountry.replace(/\s+/g, "-");
    countryCode = countryCodeMap[hyphenVersion];
    console.log(
      `🔍 [flagUtils.ts:fetchIndividualFlag] Hyphen variation "${hyphenVersion}": ${countryCode || "not found"}`,
    );
  }

  // If we have a simple 2-letter country code, process immediately
  if (countryCode) {
    // Use Circle Flags as primary source for all country codes (including subdivisions)
    const flagUrl = `https://hatscripts.github.io/circle-flags/flags/${countryCode}.svg`;
    console.log(
      `🎯 [flagUtils.ts:fetchIndividualFlag] Using Circle Flags for ${countryCode}: ${flagUrl}`,
    );
    flagCache.setCached(cacheKey, flagUrl, "circle-flags", true);
    console.log(
      `💾 [flagUtils.ts:fetchIndividualFlag] Cached Circle Flag for ${country}`,
    );
    return flagUrl;
  }

  // Try API endpoint as last resort
  console.log(
    `🌐 [flagUtils.ts:fetchIndividualFlag] No country code found, trying API for: ${country}`,
  );
  try {
    const apiUrl = `/api/flags/${encodeURIComponent(country)}`;
    console.log(
      `📡 [flagUtils.ts:fetchIndividualFlag] Making API request to: ${apiUrl}`,
    );

    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });
    console.log(
      `📡 [flagUtils.ts:fetchIndividualFlag] API response status: ${response.status} for ${country}`,
    );

    if (response.ok) {
      const data = await response.json();
      console.log(
        `📡 [flagUtils.ts:fetchIndividualFlag] API response data for ${country}:`,
        {
          success: data.success,
          hasFlag: !!data.flagUrl,
          shouldExclude: data.shouldExclude,
          flagUrl: data.flagUrl?.substring(0, 50) + "...",
        },
      );

      if (data.success && data.flagUrl) {
        console.log(
          `✅ [flagUtils.ts:fetchIndividualFlag] API success for ${country}: ${data.flagUrl}`,
        );
        flagCache.setCached(cacheKey, data.flagUrl, "api-success", true);
        console.log(
          `💾 [flagUtils.ts:fetchIndividualFlag] Cached API result for ${country}`,
        );
        return data.flagUrl;
      } else if (data.shouldExclude) {
        console.log(
          `🚫 [flagUtils.ts:fetchIndividualFlag] API says exclude ${country}`,
        );
        const fallbackUrl = "/assets/fallback-logo.svg";
        flagCache.setCached(cacheKey, fallbackUrl, "api-exclude", true);
        return fallbackUrl;
      }
    } else {
      console.log(
        `❌ [flagUtils.ts:fetchIndividualFlag] API request failed for ${country}: HTTP ${response.status}`,
      );
    }
  } catch (error) {
    console.log(
      `❌ [flagUtils.ts:fetchIndividualFlag] API request error for ${country}:`,
      error,
    );
  }

  // Final fallback
  console.log(
    `🔄 [flagUtils.ts:fetchIndividualFlag] Using final fallback for ${country}`,
  );
  const fallbackUrl = "/assets/fallback-logo.svg";
  flagCache.setCached(cacheKey, fallbackUrl, "final-fallback", true);
  console.log(
    `💾 [flagUtils.ts:fetchIndividualFlag] Cached fallback for ${country}`,
  );
  return fallbackUrl;
}

/**
 * Add country to batch queue for processing with improved batching
 * DISABLED: Using individual fetch for better debugging
 */
function addToBatch(country: string): Promise<string> {
  console.log(
    `🚫 [flagUtils.ts:addToBatch] Batch processing disabled, redirecting to individual fetch for: ${country}`,
  );
  return fetchIndividualFlag(country);
}

/**
 * Track flag usage for cache optimization
 */
function trackFlagUsage(country: string): void {
  const key = `flag_${country.toLowerCase().replace(/\s+/g, "_")}`;
  const current = flagUsageTracker.get(key) || { count: 0, lastUsed: 0 };
  flagUsageTracker.set(key, {
    count: current.count + 1,
    lastUsed: Date.now(),
  });
}

/**
 * Intelligent cache cleanup - remove least used flags when cache gets large
 */
export function intelligentCacheCleanup(): void {
  const cache = (flagCache as any).cache;
  if (!(cache instanceof Map)) return;

  const maxCacheSize = 100; // Maximum flags to keep in cache

  if (cache.size <= maxCacheSize) return;

  console.log(
    `🧹 Cache cleanup: ${cache.size} entries, target: ${maxCacheSize}`,
  );

  // Get usage data and sort by least used + oldest
  const entries = Array.from(cache.entries()).map(([key, value]) => {
    const usage = flagUsageTracker.get(key) || { count: 0, lastUsed: 0 };
    return {
      key,
      value,
      usage: usage.count,
      lastUsed: usage.lastUsed,
      score: usage.count + (Date.now() - usage.lastUsed) / (1000 * 60 * 60), // Usage count + hours since last use
    };
  });

  // Sort by score (lower = less important)
  entries.sort((a, b) => a.score - b.score);

  // Remove least important entries
  const toRemove = entries.slice(0, cache.size - maxCacheSize);
  toRemove.forEach(({ key }) => {
    cache.delete(key);
    flagUsageTracker.delete(key);
  });

  console.log(`🗑️ Removed ${toRemove.length} least used flags from cache`);
}

/**
 * Background refresh of stale cache entries
 */
async function backgroundCacheRefresh(): Promise<void> {
  const cache = (flagCache as any).cache;
  if (!(cache instanceof Map)) return;

  const now = Date.now();
  const staleEntries: string[] = [];

  // Find entries that are getting stale but still used
  for (const [key, value] of cache.entries()) {
    const usage = flagUsageTracker.get(key);
    const age = now - value.timestamp;
    const maxAge = value.url.includes("/assets/fallback-logo.svg")
      ? 60 * 60 * 1000 // 1 hour for fallbacks
      : 24 * 60 * 60 * 1000; // 24 hours for valid flags

    // Refresh if entry is 75% of max age and has been used recently
    if (age > maxAge * 0.75 && usage && usage.count > 3) {
      staleEntries.push(key.replace("flag_", ""));
    }
  }

  if (staleEntries.length > 0) {
    console.log(
      `🔄 Background refreshing ${staleEntries.length} stale flag entries`,
    );

    // Refresh in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < staleEntries.length; i += batchSize) {
      const batch = staleEntries.slice(i, i + batchSize);
      await Promise.allSettled(batch.map((country) => getCachedFlag(country)));

      // Small delay between batches
      if (i + batchSize < staleEntries.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}
// Flag cache configuration - optimized for different content types
const FLAG_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days - flags are static and don't change

// Internal getCached function
function getCached(cacheKey: string): string | undefined {
  const cached = flagCache.getCached(cacheKey);
  if (cached) {
    return cached.url;
  }
  return undefined;
}

/**
 * Get country flag URL with enhanced fallback support using MyAPIFallback system
 * @param country - Country name
 * @param leagueFlag - Optional league flag URL
 * @returns string - Flag image URL
 */
