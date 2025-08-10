/**
 * Simplified Player Image Cache System
 * Focus on reliability over complexity
 */

interface CachedPlayerImage {
  url: string;
  timestamp: number;
  verified: boolean;
  playerId: number;
  playerName: string;
  source: 'api' | 'fallback' | 'initials';
}

class PlayerImageCache {
  private cache = new Map<string, CachedPlayerImage>();
  private readonly MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours (reduced)
  private readonly MAX_SIZE = 200; // Reduced cache size

  // Rate limiting state
  private lastRequestTime = 0;
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

  private getCacheKey(playerId?: number, playerName?: string): string {
    return `player_${playerId || 'unknown'}_${playerName || 'unknown'}`;
  }

  getCachedImage(playerId?: number, playerName?: string): CachedPlayerImage | null {
    const key = this.getCacheKey(playerId, playerName);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if expired
    const age = Date.now() - cached.timestamp;
    if (age > this.MAX_AGE) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  setCachedImage(
    playerId: number | undefined,
    playerName: string | undefined,
    url: string,
    source: CachedPlayerImage['source'] = 'api'
  ): void {
    const key = this.getCacheKey(playerId, playerName);

    // Clean up if cache is getting too large
    if (this.cache.size >= this.MAX_SIZE) {
      this.cleanup();
    }

    this.cache.set(key, {
      url,
      timestamp: Date.now(),
      verified: true,
      playerId: playerId || 0,
      playerName: playerName || 'Unknown Player',
      source
    });

    console.log(`💾 [PlayerImageCache] Cached image for player: ${playerName} (${playerId}) | Source: ${source}`);
  }

  // Queue and rate-limit requests to external image services
  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;

          if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
            await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest));
          }

          this.lastRequestTime = Date.now();
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.warn('🔄 [PlayerImageCache] Queued request failed:', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  // Simplified image loading with 3 reliable sources and rate limiting
  async getPlayerImageWithFallback(playerId?: number, playerName?: string, teamId?: number): Promise<string> {
    // Check cache first
    const cached = this.getCachedImage(playerId, playerName);
    if (cached && cached.verified) {
      console.log(`✅ [PlayerImageCache] Using cached image: ${playerName}`);
      return cached.url;
    }

    console.log(`🔍 [PlayerImageCache] Loading fresh image for: ${playerName} (${playerId})`);

    // Source 1: Our backend name-based search (most reliable)
    if (playerName) {
      try {
        const nameBasedUrl = `/api/player-photo-by-name?name=${encodeURIComponent(playerName)}`;
        const isValid = await this.validateImageUrl(nameBasedUrl);
        if (isValid) {
          this.setCachedImage(playerId, playerName, nameBasedUrl, 'api');
          return nameBasedUrl;
        }
      } catch (error) {
        console.log(`⚠️ [PlayerImageCache] Name-based search failed for ${playerName}`);
      }
    }

    // Source 2: API-Sports.io (if ID available)
    if (playerId) {
      try {
        const apiSportsUrl = `https://media.api-sports.io/football/players/${playerId}.png`;
        const isValid = await this.queueRequest(() => this.validateImageUrl(apiSportsUrl));
        if (isValid) {
          this.setCachedImage(playerId, playerName, apiSportsUrl, 'api');
          return apiSportsUrl;
        }
      } catch (error) {
        console.log(`⚠️ [PlayerImageCache] API-Sports failed for ${playerName}`);
      }
    }

    // Source 3: 365Scores CDN (if ID available) - with enhanced error handling
    if (playerId) {
      try {
        const cdnUrl = `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${playerId}`;
        const isValid = await this.queueRequest(() => this.validateImageUrlWith425Handling(cdnUrl));
        if (isValid) {
          this.setCachedImage(playerId, playerName, cdnUrl, 'api');
          return cdnUrl;
        }
      } catch (error) {
        console.log(`⚠️ [PlayerImageCache] 365Scores CDN failed for ${playerName}:`, error.message);
      }
    }

    // Final: Generate initials fallback
    const initials = this.generateInitials(playerName);
    const fallbackUrl = `https://ui-avatars.com/api/?name=${initials}&size=128&background=4F46E5&color=fff&bold=true&format=svg`;

    this.setCachedImage(playerId, playerName, fallbackUrl, 'initials');
    console.log(`🎨 [PlayerImageCache] Using initials fallback for ${playerName}: ${fallbackUrl}`);
    return fallbackUrl;
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

  // Validate URL with specific handling for 425 errors
  private async validateImageUrlWith425Handling(url: string): Promise<boolean> {
    try {
      if (url.startsWith('/api/')) {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
      }

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

        img.onerror = (error: any) => {
          clearTimeout(timeout);
          // Handle 425 error specifically
          if (error.message && error.message.includes('425')) {
            console.warn(`⚠️ [PlayerImageCache] Received 425 error for URL: ${url}. Retrying with delay.`);
            // Retry after a longer delay to respect rate limiting
            setTimeout(() => {
              this.queueRequest(() => this.validateImageUrl(url)) // Use queueRequest for retry as well
                .then(resolve)
                .catch(reject);
            }, 5000); // Wait 5 seconds before retrying
          } else {
            resolve(false);
          }
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

    // Remove expired entries
    const expired = entries.filter(([_, item]) => now - item.timestamp > this.MAX_AGE);
    expired.forEach(([key]) => this.cache.delete(key));

    // If still too large, remove oldest
    if (this.cache.size > this.MAX_SIZE * 0.8) {
      const remaining = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = remaining.slice(0, this.cache.size - Math.floor(this.MAX_SIZE * 0.8));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }

    console.log(`🧹 [PlayerImageCache] Cleanup completed. Cache size: ${this.cache.size}`);
  }

  clear(): void {
    this.cache.clear();
    console.log('🗑️ [PlayerImageCache] Cache cleared');
  }

  forceRefresh(playerId?: number, playerName?: string): void {
    const key = this.getCacheKey(playerId, playerName);
    this.cache.delete(key);
    console.log(`🔄 [PlayerImageCache] Force refreshed cache for player: ${playerName} (${playerId})`);
  }

  // Placeholder for methods that might not be directly used in the provided snippet but are exported
  preloadPlayerImages(players: Array<{ id?: number; name?: string }>): Promise<void> {
    console.log(`🚀 [PlayerImageCache] Preloading ${players.length} player images.`);
    // Implement actual preloading logic if needed
    return Promise.resolve();
  }

  clearWrongPlayerImage(playerId?: number, playerName?: string): void {
    console.log(`❌ [PlayerImageCache] Clearing potentially wrong image for player: ${playerName} (${playerId})`);
    // Implement logic to clear specific wrong images if needed
  }

  batchLoadPlayerImages(teamId?: number, leagueId?: number): Promise<void> {
    console.log(`⚡ [PlayerImageCache] Batch loading images for team: ${teamId}, league: ${leagueId}`);
    // Implement batch loading logic if needed
    return Promise.resolve();
  }

  getPlayerImageWithFallback(playerId?: number, playerName?: string, teamId?: number, forceFetch?: boolean): Promise<string> {
    if (forceFetch) {
      this.forceRefresh(playerId, playerName);
    }
    return this.getPlayerImageWithFallback(playerId, playerName, teamId);
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
    // This function was intended to force fetch, hence passing true for forceFetch
    return playerImageCache.getPlayerImageWithFallback(playerId, playerName, teamId, true);
};

export const batchLoadPlayerImagesFunc = async (teamId?: number, leagueId?: number): Promise<void> => {
    return playerImageCache.batchLoadPlayerImages(teamId, leagueId);
};

export const clearWrongPlayerImageFunc = (playerId?: number, playerName?: string): void => {
    return playerImageCache.clearWrongPlayerImage(playerId, playerName);
};