
export interface CachedImageItem {
  url: string;
  timestamp: number;
  verified: boolean;
  type: 'team' | 'league' | 'flag' | 'generic';
  source: string;
}

class ImageCacheManager {
  private cache = new Map<string, CachedImageItem>();
  private readonly MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_SIZE = 2000;

  // Get from cache first, return immediately if found
  getCachedImage(key: string): string | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() - item.timestamp > this.MAX_AGE) {
      this.cache.delete(key);
      return null;
    }
    
    return item.url;
  }

  // Set cache with immediate return
  setCachedImage(key: string, url: string, type: CachedImageItem['type'], source: string = 'unknown') {
    // Clean old entries if cache is getting too large
    if (this.cache.size >= this.MAX_SIZE) {
      this.cleanup();
    }

    this.cache.set(key, {
      url,
      timestamp: Date.now(),
      verified: true,
      type,
      source
    });
  }

  // Quick validation without blocking UI
  async validateAndCache(key: string, url: string, type: CachedImageItem['type']): Promise<boolean> {
    try {
      // For local assets and data URLs, consider them valid immediately
      if (url.startsWith('/assets/') || url.startsWith('data:')) {
        this.setCachedImage(key, url, type, 'local');
        return true;
      }

      // Use a quick HEAD request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.setCachedImage(key, url, type, 'validated');
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  private cleanup() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    // Remove expired entries first
    const expired = entries.filter(([_, item]) => now - item.timestamp > this.MAX_AGE);
    expired.forEach(([key]) => this.cache.delete(key));
    
    // If still too large, remove oldest entries
    if (this.cache.size > this.MAX_SIZE * 0.8) {
      const remaining = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = remaining.slice(0, this.cache.size - Math.floor(this.MAX_SIZE * 0.8));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Get cache stats for debugging
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    
    return {
      total: entries.length,
      fresh: entries.filter(item => now - item.timestamp < 60 * 60 * 1000).length, // 1 hour
      byType: {
        team: entries.filter(item => item.type === 'team').length,
        league: entries.filter(item => item.type === 'league').length,
        flag: entries.filter(item => item.type === 'flag').length,
        generic: entries.filter(item => item.type === 'generic').length,
      }
    };
  }

  clear() {
    this.cache.clear();
  }
}

// Export singleton instance
export const imageCache = new ImageCacheManager();

// Helper functions for common use cases
export const getTeamLogoFromCache = (teamId: number | string, teamName?: string): string | null => {
  const key = `team_${teamId}_${teamName || 'unknown'}`;
  return imageCache.getCachedImage(key);
};

export const cacheTeamLogo = (teamId: number | string, url: string, teamName?: string) => {
  const key = `team_${teamId}_${teamName || 'unknown'}`;
  imageCache.setCachedImage(key, url, 'team');
};

export const getFlagFromCache = (country: string): string | null => {
  const key = `flag_${country.toLowerCase()}`;
  return imageCache.getCachedImage(key);
};

export const cacheFlag = (country: string, url: string) => {
  const key = `flag_${country.toLowerCase()}`;
  imageCache.setCachedImage(key, url, 'flag');
};

export const getLeagueLogoFromCache = (leagueId: number | string): string | null => {
  const key = `league_${leagueId}`;
  return imageCache.getCachedImage(key);
};

export const cacheLeagueLogo = (leagueId: number | string, url: string) => {
  const key = `league_${leagueId}`;
  imageCache.setCachedImage(key, url, 'league');
};
