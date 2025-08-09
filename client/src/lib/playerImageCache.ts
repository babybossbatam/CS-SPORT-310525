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

  // Optimized image loading with parallel requests and faster validation
  async getPlayerImageWithFallback(playerId?: number, playerName?: string, teamId?: number, forceRefresh: boolean = false): Promise<string> {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.getCachedImage(playerId, playerName);
      if (cached && cached.verified) {
        console.log(`⚡ [PlayerImageCache] Cache hit: ${playerName}`);
        return cached.url;
      }
    }

    console.log(`🔍 [PlayerImageCache] Loading fresh image for: ${playerName} (${playerId})`);

    // Create all image source promises simultaneously
    const imagePromises: Promise<{ url: string; source: CachedPlayerImage['source']; priority: number } | null>[] = [];

    // Source 1: Backend name-based search (highest priority)
    if (playerName) {
      const nameBasedPromise = this.tryImageSource(
        `/api/player-photo-by-name?name=${encodeURIComponent(playerName)}`,
        'api',
        1,
        2000 // 2 second timeout
      );
      imagePromises.push(nameBasedPromise);
    }

    // Source 2: API-Sports.io (medium priority)
    if (playerId) {
      const apiSportsPromise = this.tryImageSource(
        `https://media.api-sports.io/football/players/${playerId}.png`,
        'api',
        2,
        1500 // 1.5 second timeout
      );
      imagePromises.push(apiSportsPromise);
    }

    // Source 3: 365Scores CDN (lower priority)
    if (playerId) {
      const cdnPromise = this.tryImageSource(
        `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${playerId}`,
        'api',
        3,
        1000 // 1 second timeout
      );
      imagePromises.push(cdnPromise);
    }

    try {
      // Wait for all promises to settle and get first successful result
      const results = await Promise.allSettled(imagePromises);
      const validResults = results
        .map(result => result.status === 'fulfilled' ? result.value : null)
        .filter(result => result !== null)
        .sort((a, b) => a!.priority - b!.priority);

      if (validResults.length > 0) {
        const bestResult = validResults[0]!;
        this.setCachedImage(playerId, playerName, bestResult.url, bestResult.source);
        console.log(`✅ [PlayerImageCache] Found image via parallel loading: ${bestResult.url}`);
        return bestResult.url;
      }
    } catch (error) {
      console.log(`⚠️ [PlayerImageCache] Parallel loading failed: ${error}`);
    }

    // Final: Generate initials fallback
    const initials = this.generateInitials(playerName);
    const fallbackUrl = `https://ui-avatars.com/api/?name=${initials}&size=128&background=4F46E5&color=fff&bold=true&format=svg`;

    this.setCachedImage(playerId, playerName, fallbackUrl, 'initials');
    console.log(`🎨 [PlayerImageCache] Using initials fallback for ${playerName}: ${fallbackUrl}`);
    return fallbackUrl;
  }

  // Helper method for trying image sources with timeout
  private async tryImageSource(
    url: string, 
    source: CachedPlayerImage['source'], 
    priority: number, 
    timeout: number
  ): Promise<{ url: string; source: CachedPlayerImage['source']; priority: number } | null> {
    try {
      const isValid = await this.validateImageUrlFast(url, timeout);
      if (isValid) {
        return { url, source, priority };
      }
    } catch (error) {
      // Silently fail and return null
    }
    return null;
  }

  // Faster image validation with shorter timeouts
  private async validateImageUrlFast(url: string, timeout: number = 1000): Promise<boolean> {
    try {
      // For local API endpoints, use fetch with shorter timeout
      if (url.startsWith('/api/')) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await fetch(url, { 
            method: 'HEAD',
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          return response.ok;
        } catch {
          clearTimeout(timeoutId);
          return false;
        }
      }

      // For external URLs, use Image object with shorter timeout
      return new Promise((resolve) => {
        const img = new Image();
        const timeoutId = setTimeout(() => {
          img.onload = img.onerror = null;
          resolve(false);
        }, timeout);

        img.onload = () => {
          clearTimeout(timeoutId);
          resolve(true);
        };

        img.onerror = () => {
          clearTimeout(timeoutId);
          resolve(false);
        };

        img.src = url;
      });
    } catch (error) {
      return false;
    }
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
    // Batch preload player images for better performance
    const preloadPromises = players.slice(0, 22).map(async (player) => {
      try {
        await playerImageCache.getPlayerImageWithFallback(player.id, player.name);
      } catch (error) {
        // Silently fail individual preloads
      }
    });
    
    // Wait for first 11 players (likely starters) with priority
    await Promise.allSettled(preloadPromises.slice(0, 11));
    
    // Continue loading remaining players in background
    Promise.allSettled(preloadPromises.slice(11));
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