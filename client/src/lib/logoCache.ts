
interface CacheItem {
  url: string;
  timestamp: number;
  source: string;
  isValid: boolean;
}

interface LogoCacheConfig {
  maxAge: number; // Cache duration in milliseconds
  maxSize: number; // Maximum number of cached items
  cleanupInterval: number; // Cleanup interval in milliseconds
}

class LogoCache {
  private cache = new Map<string, CacheItem>();
  private config: LogoCacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<LogoCacheConfig> = {}) {
    this.config = {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours default
      maxSize: 1000, // 1000 items max
      cleanupInterval: 60 * 60 * 1000, // 1 hour cleanup
      ...config
    };

    this.startCleanupTimer();
  }

  private startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup() {
    const now = Date.now();
    const itemsToRemove: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.config.maxAge) {
        itemsToRemove.push(key);
      }
    }

    itemsToRemove.forEach(key => this.cache.delete(key));

    // If still over max size, remove oldest items
    if (this.cache.size > this.config.maxSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp);
      
      const toRemove = sortedEntries.slice(0, this.cache.size - this.config.maxSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }

    console.log(`Logo cache cleanup: ${itemsToRemove.length} expired items removed, ${this.cache.size} items remaining`);
  }

  getCached(key: string): string | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > this.config.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return item.isValid ? item.url : null;
  }

  setCached(key: string, url: string, source: string, isValid: boolean = true) {
    this.cache.set(key, {
      url,
      timestamp: Date.now(),
      source,
      isValid
    });
  }

  markInvalid(key: string) {
    const item = this.cache.get(key);
    if (item) {
      item.isValid = false;
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      maxAge: this.config.maxAge
    };
  }

  clear() {
    this.cache.clear();
  }

  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// Create global cache instances
export const teamLogoCache = new LogoCache({
  maxAge: 24 * 60 * 60 * 1000, // 24 hours for team logos
  maxSize: 500
});

export const leagueLogoCache = new LogoCache({
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for league logos
  maxSize: 100
});

export const flagCache = new LogoCache({
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for flags
  maxSize: 200
});

// Helper functions
export function getTeamLogoCacheKey(teamId: number | string, teamName?: string): string {
  return `team_${teamId}_${teamName?.toLowerCase().replace(/\s+/g, '_') || 'unknown'}`;
}

export function getLeagueLogoCacheKey(leagueId: number | string, leagueName?: string): string {
  return `league_${leagueId}_${leagueName?.toLowerCase().replace(/\s+/g, '_') || 'unknown'}`;
}

export function getFlagCacheKey(country: string): string {
  return `flag_${country.toLowerCase().replace(/\s+/g, '_')}`;
}

// Logo validation function
export async function validateLogoUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch (error) {
    console.warn(`Logo validation failed for ${url}:`, error);
    return false;
  }
}
