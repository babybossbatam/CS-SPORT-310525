
import { 
  COUNTRY_TRANSLATIONS, 
  translateCountryName, 
  hasCountryTranslation,
  getSupportedLanguages,
  batchTranslateCountries
} from '../constants/countriesAndLeagues';

/**
 * Unified Country Translation System
 * Uses the comprehensive static country list as the primary source
 */
export class UnifiedCountryTranslation {
  private cache = new Map<string, string>();
  
  /**
   * Translate a country name to the target language
   * @param countryName - The country name to translate
   * @param targetLanguage - Target language code (en, zh, zh-hk, zh-tw, es, de, it, pt)
   * @returns Translated country name or original if translation not available
   */
  translate(countryName: string, targetLanguage: string = 'en'): string {
    const cacheKey = `${countryName}-${targetLanguage}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // Use static translations (primary source)
    const translation = translateCountryName(countryName, targetLanguage);
    
    // Cache and return
    this.cache.set(cacheKey, translation);
    return translation;
  }
  
  /**
   * Check if translation is available for a country
   */
  hasTranslation(countryName: string, targetLanguage: string = 'en'): boolean {
    return hasCountryTranslation(countryName, targetLanguage);
  }
  
  /**
   * Get all supported languages
   */
  getSupportedLanguages() {
    return getSupportedLanguages();
  }
  
  /**
   * Batch translate multiple countries
   */
  batchTranslate(countryNames: string[], targetLanguage: string = 'en') {
    return batchTranslateCountries(countryNames, targetLanguage);
  }
  
  /**
   * Clear translation cache
   */
  clearCache() {
    this.cache.clear();
  }
  
  /**
   * Get cache size for debugging
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const unifiedCountryTranslation = new UnifiedCountryTranslation();

// Export convenience functions
export const translateCountry = (countryName: string, targetLanguage: string = 'en') => 
  unifiedCountryTranslation.translate(countryName, targetLanguage);

export const hasCountryTranslationAvailable = (countryName: string, targetLanguage: string = 'en') => 
  unifiedCountryTranslation.hasTranslation(countryName, targetLanguage);
