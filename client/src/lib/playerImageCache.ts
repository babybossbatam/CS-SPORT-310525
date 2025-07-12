
/**
 * Player Image Cache System
 * Handles caching and fallback for player images in match events
 */

interface CachedPlayerImage {
  url: string;
  timestamp: number;
  verified: boolean;
  playerId: number;
  playerName: string;
  source: 'rapidapi' | 'cdn' | 'initials';
}

class PlayerImageCache {
  private cache = new Map<string, CachedPlayerImage>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Generate cache key
  private getCacheKey(playerId?: number, playerName?: string): string {
    return `${playerId || 0}_${playerName || 'unknown'}`;
  }

  // Get cached image
  getCachedImage(playerId?: number, playerName?: string): CachedPlayerImage | null {
    const key = this.getCacheKey(playerId, playerName);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached;
    }

    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  // Set cached image
  setCachedImage(playerId?: number, playerName?: string, url: string, source: 'rapidapi' | 'cdn' | 'initials') {
    const key = this.getCacheKey(playerId, playerName);

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

  // Validate image URL
  private async validateImageUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        timeout: 5000 
      });
      
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      return response.ok && 
             contentType?.startsWith('image/') && 
             contentLength && 
             parseInt(contentLength) > 100;
    } catch (error) {
      return false;
    }
  }

  // Get player image with RapidAPI priority and team ID
  async getPlayerImageWithFallback(playerId?: number, playerName?: string, teamId?: number): Promise<string> {
    // Check cache first
    const cached = this.getCachedImage(playerId, playerName);
    if (cached && cached.verified) {
      return cached.url;
    }

    // Priority 1: RapidAPI player endpoint with team ID
    if (playerId && teamId) {
      try {
        const rapidApiUrl = `/api/player-photo/${playerId}?teamId=${teamId}&season=2024`;
        console.log(`🔍 [PlayerImageCache] Trying RapidAPI with team ID: ${rapidApiUrl}`);
        
        const isValidApi = await this.validateImageUrl(rapidApiUrl);
        if (isValidApi) {
          console.log(`✅ [PlayerImageCache] Success with RapidAPI (team): ${rapidApiUrl}`);
          this.setCachedImage(playerId, playerName, rapidApiUrl, 'rapidapi');
          return rapidApiUrl;
        }
      } catch (error) {
        console.log(`⚠️ [PlayerImageCache] RapidAPI with team failed: ${error}`);
      }
    }

    // Priority 2: RapidAPI player endpoint without team ID
    if (playerId) {
      try {
        const rapidApiUrl = `/api/player-photo/${playerId}?season=2024`;
        console.log(`🔍 [PlayerImageCache] Trying RapidAPI without team: ${rapidApiUrl}`);
        
        const isValidApi = await this.validateImageUrl(rapidApiUrl);
        if (isValidApi) {
          console.log(`✅ [PlayerImageCache] Success with RapidAPI: ${rapidApiUrl}`);
          this.setCachedImage(playerId, playerName, rapidApiUrl, 'rapidapi');
          return rapidApiUrl;
        }
      } catch (error) {
        console.log(`⚠️ [PlayerImageCache] RapidAPI failed: ${error}`);
      }
    }

    // Priority 3: CDN fallbacks
    if (playerId) {
      const cdnSources = [
        // 365Scores CDN (primary fallback)
        `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${playerId}`,
        // API-Sports CDN
        `https://media.api-sports.io/football/players/${playerId}.png`,
        // BeSoccer CDN
        `https://cdn.resfu.com/img_data/players/medium/${playerId}.jpg?size=120x&lossy=1`,
        // Alternative BeSoccer formats
        `https://cdn.resfu.com/img_data/players/medium/${playerId}.jpg`,
        `https://cdn.resfu.com/img_data/players/small/${playerId}.jpg?size=120x&lossy=1`,
        // SportMonks CDN
        `https://cdn.sportmonks.com/images/soccer/players/${playerId}.png`,
      ];

      console.log(`🔍 [PlayerImageCache] Trying ${cdnSources.length} CDN fallbacks for player ${playerId} (${playerName})`);
      
      // Try each CDN source
      for (const cdnUrl of cdnSources) {
        try {
          const isValid = await this.validateImageUrl(cdnUrl);
          if (isValid) {
            console.log(`✅ [PlayerImageCache] Success with CDN fallback: ${cdnUrl}`);
            this.setCachedImage(playerId, playerName, cdnUrl, 'cdn');
            return cdnUrl;
          }
        } catch (error) {
          console.log(`⚠️ [PlayerImageCache] CDN failed: ${cdnUrl}`);
        }
      }
    }

    // Priority 4: Generate initials fallback
    const initials = this.generateInitials(playerName);
    const fallbackUrl = `https://ui-avatars.com/api/?name=${initials}&size=64&background=4F46E5&color=fff&bold=true&format=svg`;
    
    console.log(`🎨 [PlayerImageCache] Using initials fallback for ${playerName}: ${fallbackUrl}`);
    this.setCachedImage(playerId, playerName, fallbackUrl, 'initials');
    return fallbackUrl;
  }

  // Generate initials from player name
  private generateInitials(playerName?: string): string {
    if (!playerName) return 'P';
    
    return playerName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🗑️ [PlayerImageCache] Cache cleared');
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        playerId: value.playerId,
        playerName: value.playerName,
        source: value.source,
        age: Date.now() - value.timestamp
      }))
    };
  }
}

// Export singleton instance
const playerImageCache = new PlayerImageCache();

// Main export function with team ID support
export const getPlayerImage = async (playerId?: number, playerName?: string, teamId?: number): Promise<string> => {
  return await playerImageCache.getPlayerImageWithFallback(playerId, playerName, teamId);
};

// Export other utilities
export { playerImageCache };

class PlayerImageCache {
  private cache = new Map<string, CachedPlayerImage>();
  private readonly MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly MAX_SIZE = 500; // Cache up to 500 player images

  // Generate cache key
  private getCacheKey(playerId?: number, playerName?: string): string {
    return `player_${playerId || 'unknown'}_${playerName || 'unknown'}`;
  }

  // Get cached player image
  getCachedImage(playerId?: number, playerName?: string): CachedPlayerImage | null {
    const key = this.getCacheKey(playerId, playerName);
    const cached = this.cache.get(key);

    if (!cached) {
      console.log(`🔍 [PlayerImageCache] Cache miss for player: ${playerName} (${playerId})`);
      return null;
    }

    // Check if expired
    const age = Date.now() - cached.timestamp;
    if (age > this.MAX_AGE) {
      console.log(`⏰ [PlayerImageCache] Cache expired for player: ${playerName} (age: ${Math.round(age / 1000 / 60)} min)`);
      this.cache.delete(key);
      return null;
    }

    console.log(`✅ [PlayerImageCache] Cache hit for player: ${playerName}`);
    return cached;
  }

  // Set cached player image
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

  // Get player image with fallback logic
  async getPlayerImageWithFallback(playerId?: number, playerName?: string): Promise<string> {
    // Check cache first
    const cached = this.getCachedImage(playerId, playerName);
    if (cached && cached.verified) {
      return cached.url;
    }

    // Try RapidAPI player photo endpoint first (most accurate)
    if (playerId) {
      try {
        const apiUrl = `/api/player-photo/${playerId}`;
        console.log(`🔍 [PlayerImageCache] Trying RapidAPI player photo endpoint: ${apiUrl}`);
        
        // Test if API endpoint works
        try {
          const isValidApi = await this.validateImageUrl(apiUrl);
          if (isValidApi) {
            console.log(`✅ [PlayerImageCache] Success with RapidAPI endpoint: ${apiUrl}`);
            this.setCachedImage(playerId, playerName, apiUrl, 'api');
            return apiUrl;
          }
        } catch (error) {
          console.log(`⚠️ [PlayerImageCache] RapidAPI endpoint failed: ${apiUrl}, trying CDNs...`);
        }

        // Fallback to CDN sources if API fails
        const cdnSources = [
          // 365Scores CDN (primary fallback)
          `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${playerId}`,
          // API-Sports CDN
          `https://media.api-sports.io/football/players/${playerId}.png`,
          // BeSoccer CDN
          `https://cdn.resfu.com/img_data/players/medium/${playerId}.jpg?size=120x&lossy=1`,
          // Alternative BeSoccer formats
          `https://cdn.resfu.com/img_data/players/medium/${playerId}.jpg`,
          `https://cdn.resfu.com/img_data/players/small/${playerId}.jpg?size=120x&lossy=1`,
          // SportMonks CDN
          `https://cdn.sportmonks.com/images/soccer/players/${playerId}.png`,
        ];

        console.log(`🔍 [PlayerImageCache] Trying ${cdnSources.length} CDN fallbacks for player ${playerId} (${playerName})`);
        
        // Try each CDN source
        for (const cdnUrl of cdnSources) {
          try {
            const isValid = await this.validateImageUrl(cdnUrl);
            if (isValid) {
              console.log(`✅ [PlayerImageCache] Success with CDN fallback: ${cdnUrl}`);
              this.setCachedImage(playerId, playerName, cdnUrl, 'fallback');
              return cdnUrl;
            }
          } catch (error) {
            console.log(`⚠️ [PlayerImageCache] CDN failed: ${cdnUrl}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ [PlayerImageCache] All sources failed for player ${playerId}:`, error);
      }
    }

    // Generate initials fallback only if no player ID or all sources failed
    const initials = this.generateInitials(playerName);
    const fallbackUrl = `https://ui-avatars.com/api/?name=${initials}&size=64&background=4F46E5&color=fff&bold=true&format=svg`;
    
    console.log(`🎨 [PlayerImageCache] Using initials fallback for ${playerName}: ${fallbackUrl}`);
    this.setCachedImage(playerId, playerName, fallbackUrl, 'initials');
    return fallbackUrl;
  }

  // Generate initials from player name
  private generateInitials(playerName?: string): string {
    if (!playerName) return 'P';
    
    return playerName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'P';
  }

  // Validate image URL
  private async validateImageUrl(url: string): Promise<boolean> {
    try {
      // For local API endpoints, do a proper validation
      if (url.startsWith('/api/')) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        try {
          const response = await fetch(url, { 
            method: 'HEAD',
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          return response.ok && response.headers.get('content-type')?.startsWith('image/');
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }

      // For external URLs, do a quick validation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: controller.signal,
          mode: 'cors'
        });
        clearTimeout(timeoutId);
        
        const isOk = response.ok;
        const contentType = response.headers.get('content-type');
        const isImage = contentType?.startsWith('image/') || url.includes('.jpg') || url.includes('.png') || url.includes('.svg');
        
        console.log(`🔍 [PlayerImageCache] URL validation for ${url}: status=${response.status}, ok=${isOk}, contentType=${contentType}`);
        return isOk && isImage;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.warn(`⚠️ [PlayerImageCache] URL validation failed for ${url}:`, error);
      return false;
    }
  }

  // Cleanup old entries
  private cleanup(): void {
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

    console.log(`🧹 [PlayerImageCache] Cleanup completed. Cache size: ${this.cache.size}`);
  }

  // Preload player images for a list of players
  async preloadPlayerImages(players: Array<{ id?: number; name?: string }>): Promise<void> {
    const promises = players.map(player => 
      this.getPlayerImageWithFallback(player.id, player.name)
    );

    try {
      await Promise.allSettled(promises);
      console.log(`📦 [PlayerImageCache] Preloaded ${players.length} player images`);
    } catch (error) {
      console.warn('⚠️ [PlayerImageCache] Error preloading images:', error);
    }
  }

  // Get cache statistics
  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      total: entries.length,
      api: entries.filter(item => item.source === 'api').length,
      fallback: entries.filter(item => item.source === 'fallback').length,
      initials: entries.filter(item => item.source === 'initials').length,
    };
  }

  // Clear cache
  clear(): void {
    this.cache.clear();
    console.log('🗑️ [PlayerImageCache] Cache cleared');
  }

  // Force refresh cache for specific player
  forceRefresh(playerId?: number, playerName?: string): void {
    const key = this.getCacheKey(playerId, playerName);
    this.cache.delete(key);
    console.log(`🔄 [PlayerImageCache] Force refreshed cache for player: ${playerName} (${playerId})`);
  }
}

// Export singleton instance
export const playerImageCache = new PlayerImageCache();

// Export helper functions
export const getPlayerImage = async (playerId?: number, playerName?: string): Promise<string> => {
  return playerImageCache.getPlayerImageWithFallback(playerId, playerName);
};

export const preloadPlayerImages = async (players: Array<{ id?: number; name?: string }>): Promise<void> => {
  return playerImageCache.preloadPlayerImages(players);
};

export const clearPlayerImageCache = (): void => {
  return playerImageCache.clear();
};

export const forceRefreshPlayer = (playerId?: number, playerName?: string): void => {
  return playerImageCache.forceRefresh(playerId, playerName);
};

export default playerImageCache;
