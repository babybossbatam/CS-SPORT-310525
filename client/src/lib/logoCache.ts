/**
 * Enhanced Logo Cache System
 * Handles caching for team logos, league logos, and country flags
 */

interface CachedItem {
  url: string;
  source: string;
  timestamp: number;
  verified: boolean;
  retryCount: number;
}

interface LogoCacheConfig {
  maxAge: number; // Cache duration in milliseconds
  maxSize: number; // Maximum number of cached items
  cleanupInterval: number; // Cleanup interval in milliseconds
  maxRetries: number; // Maximum retry attempts for failed URLs
}

const DEFAULT_CONFIG: LogoCacheConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 1000, // Cache up to 1000 items
  cleanupInterval: 60 * 60 * 1000, // Cleanup every hour
  maxRetries: 3
};

class LogoCache {
  private cache = new Map<string, CachedItem>();
  private config: LogoCacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<LogoCacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupTimer();
  }

  private startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup() {
    const now = Date.now();
    const expired: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.config.maxAge) {
        expired.push(key);
      }
    }

    expired.forEach(key => this.cache.delete(key));

    // If cache is still too large, remove oldest items
    if (this.cache.size > this.config.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = entries.slice(0, this.cache.size - this.config.maxSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }

    console.log(`Logo cache cleanup: ${expired.length} expired, ${this.cache.size} remaining`);
  }

  setCached(key: string, url: string, source: string, verified: boolean = false) {
    this.cache.set(key, {
      url,
      source,
      timestamp: Date.now(),
      verified,
      retryCount: 0
    });
  }

  // Get from cache first
  getCached(key: string): CachedItem | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check expiration - be more lenient for valid flags
    const age = Date.now() - item.timestamp;
    const maxAge = item.url.includes('/assets/fallback-logo.svg') 
      ? 7 * 24 * 60 * 60 * 1000  // 7 days for fallbacks (extended to reduce API calls)
      : 30 * 24 * 60 * 60 * 1000; // 30 days for valid flags (extended for better caching)

    if (age > maxAge) {
      console.log(`🗑️ Cache expired for ${key} (age: ${Math.round(age / 1000 / 60)} min)`);
      this.cache.delete(key);
      return null;
    }

    return item;
  }

  // Remove cached item
  removeCached(key: string): void {
    this.cache.delete(key);
  }

  markAsVerified(key: string) {
    const item = this.cache.get(key);
    if (item) {
      item.verified = true;
      item.timestamp = Date.now(); // Refresh timestamp
    }
  }

  incrementRetry(key: string): boolean {
    const item = this.cache.get(key);
    if (item) {
      item.retryCount++;
      return item.retryCount < this.config.maxRetries;
    }
    return true;
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    const verified = Array.from(this.cache.values()).filter(item => item.verified).length;
    return {
      total: this.cache.size,
      verified,
      unverified: this.cache.size - verified
    };
  }
}

// Create cache instances
export const teamLogoCache = new LogoCache();
export const leagueLogoCache = new LogoCache();
export const flagCache = new LogoCache();

// Cache key generators
export function getTeamLogoCacheKey(teamId?: number | string, teamName?: string): string {
  return `team_${teamId || 'unknown'}_${teamName || 'unknown'}`;
}

export function getLeagueLogoCacheKey(leagueId?: number | string, leagueName?: string): string {
  return `league_${leagueId || 'unknown'}_${leagueName || 'unknown'}`;
}

export function getFlagCacheKey(countryCode?: string, countryName?: string): string {
  return `flag_${countryCode || 'unknown'}_${countryName || 'unknown'}`;
}

// URL validation function with improved reliability
export async function validateLogoUrl(url: string): Promise<boolean> {
  try {
    // For data URLs, always return true
    if (url.startsWith('data:')) {
      return true;
    }

    // For local assets, always return true
    if (url.startsWith('/assets/')) {
      return true;
    }

    // Create a test image element for reliable validation
    return new Promise((resolve) => {
      const img = new Image();

      // Set timeout to avoid hanging
      const timeout = setTimeout(() => {
        resolve(false);
      }, 3000);

      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      // Set crossOrigin to handle CORS
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  } catch (error) {
    console.warn(`Failed to validate URL: ${url}`, error);
    return false;
  }
}

// Progressive image loading function
export async function getOptimalLogoUrl(
  sources: Array<{ url: string; source: string; priority: number }>,
  cacheKey: string,
  cache: LogoCache
): Promise<string> {
  // Check cache first
  const cached = cache.getCached(cacheKey);
  if (cached && cached.verified) {
    console.log(`Using cached logo: ${cached.source}`);
    return cached.url;
  }

  // Sort sources by priority
  const sortedSources = sources.sort((a, b) => a.priority - b.priority);

  // Try each source in order
  for (const source of sortedSources) {
    try {
      const isValid = await validateLogoUrl(source.url);
      if (isValid) {
        cache.setCached(cacheKey, source.url, source.source, true);
        console.log(`Logo loaded from ${source.source}: ${source.url}`);
        return source.url;
      }
    } catch (error) {
      console.warn(`Failed to load from ${source.source}:`, error);
      continue;
    }
  }

  // If all fail, use fallback and cache it
  const fallbackUrl = '/assets/fallback-logo.svg';
  cache.setCached(cacheKey, fallbackUrl, 'fallback', true);
  console.warn(`All logo sources failed, using fallback`);
  return fallbackUrl;
}

export default { teamLogoCache, leagueLogoCache, flagCache };