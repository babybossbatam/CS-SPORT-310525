/**
 * Enhanced Player Image Cache System with Persistent Storage
 * Reduces API calls by storing successful results longer
 */

interface CachedPlayerImage {
  url: string;
  timestamp: number;
  verified: boolean;
  playerId: number;
  playerName: string;
  source: 'api' | 'fallback' | 'initials';
  failureCount?: number;
}

class PlayerImageCache {
  private cache = new Map<string, CachedPlayerImage>();
  private readonly MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days for verified photos
  private readonly FAILURE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours for failures
  private readonly MAX_SIZE = 500; // Increased cache size
  private readonly STORAGE_KEY = 'player_image_cache_v2';

  constructor() {
    this.loadFromStorage();
  }

  private getCacheKey(playerId?: number, playerName?: string): string {
    return `player_${playerId || 'unknown'}_${playerName || 'unknown'}`;
  }

  // Load cache from localStorage on initialization
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();
        
        // Load valid entries and clean expired ones
        for (const [key, item] of Object.entries(data)) {
          const cachedItem = item as CachedPlayerImage;
          const maxAge = cachedItem.source === 'api' && cachedItem.verified ? this.MAX_AGE : this.FAILURE_MAX_AGE;
          
          if (now - cachedItem.timestamp < maxAge) {
            this.cache.set(key, cachedItem);
          }
        }
        
        console.log(`💾 [PlayerImageCache] Loaded ${this.cache.size} cached player images from storage`);
      }
    } catch (error) {
      console.error('Failed to load player image cache from storage:', error);
    }
  }

  // Save cache to localStorage
  private saveToStorage(): void {
    try {
      const cacheObject = Object.fromEntries(this.cache.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('Failed to save player image cache to storage:', error);
      // If storage is full, try to clean old entries and retry
      this.cleanup();
      try {
        const cacheObject = Object.fromEntries(this.cache.entries());
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheObject));
      } catch (retryError) {
        console.error('Failed to save cache even after cleanup:', retryError);
      }
    }
  }

  getCachedImage(playerId?: number, playerName?: string): CachedPlayerImage | null {
    const key = this.getCacheKey(playerId, playerName);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const now = Date.now();
    const age = now - cached.timestamp;
    
    // Different expiry times based on success/failure
    const maxAge = cached.source === 'api' && cached.verified && !cached.failureCount ? 
      this.MAX_AGE : this.FAILURE_MAX_AGE;

    if (age > maxAge) {
      this.cache.delete(key);
      this.saveToStorage(); // Update storage when removing expired items
      return null;
    }

    return cached;
  }

  setCachedImage(
    playerId: number | undefined,
    playerName: string | undefined,
    url: string,
    source: CachedPlayerImage['source'] = 'api',
    isFailure: boolean = false
  ): void {
    const key = this.getCacheKey(playerId, playerName);

    // Clean up if cache is getting too large
    if (this.cache.size >= this.MAX_SIZE) {
      this.cleanup();
    }

    const existing = this.cache.get(key);
    const failureCount = isFailure ? (existing?.failureCount || 0) + 1 : 0;

    this.cache.set(key, {
      url,
      timestamp: Date.now(),
      verified: !isFailure,
      playerId: playerId || 0,
      playerName: playerName || 'Unknown Player',
      source,
      failureCount
    });

    // Save to localStorage for persistence
    this.saveToStorage();

    console.log(`💾 [PlayerImageCache] Cached image for player: ${playerName} (${playerId}) | Source: ${source} | Failures: ${failureCount}`);
  }

  // Enhanced image loading with failure tracking and retry logic
  async getPlayerImageWithFallback(playerId?: number, playerName?: string, teamId?: number, forceRefresh: boolean = false): Promise<string> {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.getCachedImage(playerId, playerName);
      if (cached && cached.verified && cached.source === 'api') {
        console.log(`✅ [PlayerImageCache] Using cached image: ${playerName} (age: ${Math.round((Date.now() - cached.timestamp) / (1000 * 60 * 60))}h)`);
        return cached.url;
      }
      
      // If we have failures recorded, don't retry too frequently
      if (cached && cached.failureCount && cached.failureCount >= 3) {
        const hoursSinceLastTry = (Date.now() - cached.timestamp) / (1000 * 60 * 60);
        if (hoursSinceLastTry < 24) {
          console.log(`⏭️ [PlayerImageCache] Skipping ${playerName} - too many failures (${cached.failureCount}), last try ${Math.round(hoursSinceLastTry)}h ago`);
          return this.getFallbackUrl(playerName);
        }
      }
    }

    console.log(`🔍 [PlayerImageCache] Loading ${forceRefresh ? 'fresh' : 'new'} image for: ${playerName} (${playerId})`);

    // Source 1: Our backend name-based search (most reliable)
    if (playerName) {
      try {
        const nameBasedUrl = `/api/player-photo-by-name?name=${encodeURIComponent(playerName)}`;
        const isValid = await this.validateImageUrl(nameBasedUrl);
        if (isValid) {
          this.setCachedImage(playerId, playerName, nameBasedUrl, 'api', false);
          return nameBasedUrl;
        }
      } catch (error) {
        console.log(`⚠️ [PlayerImageCache] Name-based search failed for ${playerName}`);
      }
    }

    // Source 2: API-Sports.io (if ID available)
    if (playerId && playerId > 0) {
      try {
        const apiSportsUrl = `https://media.api-sports.io/football/players/${playerId}.png`;
        const isValid = await this.validateImageUrl(apiSportsUrl);
        if (isValid) {
          this.setCachedImage(playerId, playerName, apiSportsUrl, 'api', false);
          return apiSportsUrl;
        }
      } catch (error) {
        console.log(`⚠️ [PlayerImageCache] API-Sports failed for ${playerName}`);
      }
    }

    // Source 3: 365Scores CDN (if ID available)
    if (playerId && playerId > 0) {
      try {
        const cdnUrl = `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${playerId}`;
        const isValid = await this.validateImageUrl(cdnUrl);
        if (isValid) {
          this.setCachedImage(playerId, playerName, cdnUrl, 'api', false);
          return cdnUrl;
        }
      } catch (error) {
        console.log(`⚠️ [PlayerImageCache] 365Scores CDN failed for ${playerName}`);
      }
    }

    // Record failure and return fallback
    const fallbackUrl = this.getFallbackUrl(playerName);
    this.setCachedImage(playerId, playerName, fallbackUrl, 'fallback', true);
    console.log(`🎨 [PlayerImageCache] All sources failed for ${playerName}, using fallback`);
    return fallbackUrl;
  }

  private getFallbackUrl(playerName?: string): string {
    const initials = this.generateInitials(playerName);
    return `https://ui-avatars.com/api/?name=${initials}&size=128&background=4F46E5&color=fff&bold=true&format=svg`;
  }

  private generateInitials(playerName?: string): string {
    if (!playerName) return 'P';
    return playerName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'P';
  }

  // Simplified validation - only test what we can control
  private async validateImageUrl(url: string): Promise<boolean> {
    try {
      // For local API endpoints
      if (url.startsWith('/api/')) {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
      }

      // For external URLs, use Image object with timeout
      return new Promise((resolve) => {
        const img = new Image();
        const timeout = setTimeout(() => {
          img.onload = img.onerror = null;
          resolve(false);
        }, 2000);

        img.onload = () => {
          clearTimeout(timeout);
          resolve(true);
        };

        img.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };

        img.src = url;
      });
    } catch (error) {
      return false;
    }
  }

  private cleanup(): void {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    // Remove expired entries with different thresholds
    const expired = entries.filter(([_, item]) => {
      const maxAge = item.source === 'api' && item.verified && !item.failureCount ? 
        this.MAX_AGE : this.FAILURE_MAX_AGE;
      return now - item.timestamp > maxAge;
    });
    expired.forEach(([key]) => this.cache.delete(key));

    // If still too large, remove oldest failures first, then oldest successes
    if (this.cache.size > this.MAX_SIZE * 0.8) {
      const remaining = Array.from(this.cache.entries());
      
      // Sort by: failures first, then by timestamp (oldest first)
      remaining.sort((a, b) => {
        const aIsFailure = a[1].failureCount && a[1].failureCount > 0;
        const bIsFailure = b[1].failureCount && b[1].failureCount > 0;
        
        if (aIsFailure && !bIsFailure) return -1;
        if (!aIsFailure && bIsFailure) return 1;
        return a[1].timestamp - b[1].timestamp;
      });

      const toRemove = remaining.slice(0, this.cache.size - Math.floor(this.MAX_SIZE * 0.8));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }

    // Save cleaned cache to storage
    this.saveToStorage();
    console.log(`🧹 [PlayerImageCache] Cleanup completed. Cache size: ${this.cache.size}`);
  }

  clear(): void {
    this.cache.clear();
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear cache from storage:', error);
    }
    console.log('🗑️ [PlayerImageCache] Cache and storage cleared');
  }

  forceRefresh(playerId?: number, playerName?: string): void {
    const key = this.getCacheKey(playerId, playerName);
    this.cache.delete(key);
    this.saveToStorage();
    console.log(`🔄 [PlayerImageCache] Force refreshed cache for player: ${playerName} (${playerId})`);
  }

  // Get detailed cache statistics
  getCacheStats(): {
    total: number;
    verified: number;
    failures: number;
    bySource: Record<string, number>;
    oldestEntry: number;
    newestEntry: number;
    storageSize: number;
  } {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    const bySource = entries.reduce((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const timestamps = entries.map(e => e.timestamp);
    
    let storageSize = 0;
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      storageSize = stored ? new Blob([stored]).size : 0;
    } catch (error) {
      storageSize = -1;
    }

    return {
      total: entries.length,
      verified: entries.filter(e => e.verified).length,
      failures: entries.filter(e => e.failureCount && e.failureCount > 0).length,
      bySource,
      oldestEntry: timestamps.length > 0 ? Math.round((now - Math.min(...timestamps)) / (1000 * 60 * 60)) : 0,
      newestEntry: timestamps.length > 0 ? Math.round((now - Math.max(...timestamps)) / (1000 * 60 * 60)) : 0,
      storageSize
    };
  }
}

// Export singleton instance
export const playerImageCache = new PlayerImageCache();

export async function getPlayerImage(playerId: number | undefined, playerName: string | undefined, teamId?: number): Promise<string> {
  if (!playerId && !playerName) {
    return "";
  }
  return playerImageCache.getPlayerImageWithFallback(playerId, playerName, teamId);
}

export default playerImageCache;

// Enhanced function to get player image with team-based batch loading priority
export async function getEnhancedPlayerImage(
    playerId: number | undefined,
    playerName: string | undefined,
    teamId: number | undefined
): Promise<string> {
    if (!playerId && !playerName) {
        return "";
    }

    // Check cache first
    const cached = playerImageCache.getCachedImage(playerId, playerName);
    if (cached && cached.url) {
        return cached.url;
    }

    // Fall back to individual loading
    return getPlayerImage(playerId, playerName);
}

// Export helper functions
export const getPlayerImageFunc = async (playerId?: number, playerName?: string, teamId?: number): Promise<string> => {
    return playerImageCache.getPlayerImageWithFallback(playerId, playerName, teamId);
};

export const preloadPlayerImagesFunc = async (players: Array<{ id?: number; name?: string }>): Promise<void> => {
    return playerImageCache.preloadPlayerImages(players);
};

export const clearPlayerImageCacheFunc = (): void => {
    return playerImageCache.clear();
};

export const forceRefreshPlayerFunc = (playerId?: number, playerName?: string): void => {
    return playerImageCache.forceRefresh(playerId, playerName);
};

export const refreshPlayerImageFunc = async (playerId?: number, playerName?: string, teamId?: number): Promise<string> => {
    return playerImageCache.getPlayerImageWithFallback(playerId, playerName, teamId, true);
};

export const batchLoadPlayerImagesFunc = async (teamId?: number, leagueId?: number): Promise<void> => {
    return playerImageCache.batchLoadPlayerImages(teamId, leagueId);
};

export const clearWrongPlayerImageFunc = (playerId?: number, playerName?: string): void => {
    return playerImageCache.clearWrongPlayerImage(playerId, playerName);
};