
/**
 * Country Mapping Cache System
 * Integrates with existing fixtureCache pattern for consistent country display names
 */

interface CachedCountryMapping {
  displayName: string;
  timestamp: number;
  source: string;
}

class CountryMappingCache {
  private cache = new Map<string, CachedCountryMapping>();
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly MAX_CACHE_SIZE = 500;

  /**
   * Get cached country display name
   */
  getCachedCountryName(originalCountry: string): string | null {
    const key = this.generateKey(originalCountry);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.displayName;
  }

  /**
   * Cache country display name
   */
  setCachedCountryName(originalCountry: string, displayName: string, source: string = 'mapping'): void {
    const key = this.generateKey(originalCountry);
    
    this.cache.set(key, {
      displayName,
      timestamp: Date.now(),
      source
    });

    this.cleanup();
  }

  /**
   * Generate cache key for country
   */
  private generateKey(country: string): string {
    return `country_${country.toLowerCase().trim()}`;
  }

  /**
   * Clean up old entries if cache gets too large
   */
  private cleanup(): void {
    if (this.cache.size <= this.MAX_CACHE_SIZE) {
      return;
    }

    // Remove oldest entries
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = this.cache.size - this.MAX_CACHE_SIZE;
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }

    console.log(`🧹 [countryCache] Cleaned up ${toRemove} old country mappings`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE
    };
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const countryMappingCache = new CountryMappingCache();

// Helper functions
export const getCachedCountryName = (country: string) => countryMappingCache.getCachedCountryName(country);
export const setCachedCountryName = (original: string, display: string, source?: string) => 
  countryMappingCache.setCachedCountryName(original, display, source);
