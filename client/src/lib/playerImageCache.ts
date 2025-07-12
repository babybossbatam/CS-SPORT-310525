
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
  source: 'api' | 'fallback' | 'initials';
}

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
  async getPlayerImageWithFallback(playerId?: number, playerName?: string, teamId?: number): Promise<string> {
    // Check cache first
    const cached = this.getCachedImage(playerId, playerName);
    if (cached && cached.verified) {
      return cached.url;
    }

    // Try RapidAPI player photo endpoint first (most accurate for actual photos)
    if (playerId) {
      try {
        const apiUrl = `/api/player-photo/${playerId}${teamId ? `?teamId=${teamId}` : ''}`;
        console.log(`🔍 [PlayerImageCache] Trying RapidAPI player photo endpoint: ${apiUrl}`);
        
        // Test if API endpoint works and returns actual photo
        try {
          const response = await fetch(apiUrl, { method: 'HEAD' });
          if (response.ok) {
            // Check if it's a redirect to an actual photo URL
            const finalUrl = response.url;
            if (finalUrl && finalUrl !== apiUrl && !finalUrl.includes('default') && !finalUrl.includes('placeholder')) {
              console.log(`✅ [PlayerImageCache] Success with actual RapidAPI photo: ${finalUrl}`);
              this.setCachedImage(playerId, playerName, apiUrl, 'api');
              return apiUrl;
            }
          }
        } catch (error) {
          console.log(`⚠️ [PlayerImageCache] RapidAPI endpoint failed: ${apiUrl}`);
        }

        // Fallback to direct CDN sources for actual photos
        const directPhotoSources = [
          // API-Sports CDN (most reliable for actual photos)
          `https://media.api-sports.io/football/players/${playerId}.png`,
          // BeSoccer CDN (good quality actual photos)
          `https://cdn.resfu.com/img_data/players/medium/${playerId}.jpg?size=120x&lossy=1`,
          `https://cdn.resfu.com/img_data/players/medium/${playerId}.jpg`,
          // Alternative sources
          `https://cdn.sportmonks.com/images/soccer/players/${playerId}.png`,
          `https://img.a.transfermarkt.technology/portrait/small/${playerId}-${Date.now()}.jpg`,
        ];

        console.log(`🔍 [PlayerImageCache] Trying ${directPhotoSources.length} direct photo sources for player ${playerId} (${playerName})`);
        
        // Try each direct photo source
        for (const photoUrl of directPhotoSources) {
          try {
            const isValid = await this.validateImageUrl(photoUrl);
            if (isValid) {
              console.log(`✅ [PlayerImageCache] Success with direct photo source: ${photoUrl}`);
              this.setCachedImage(playerId, playerName, photoUrl, 'fallback');
              return photoUrl;
            }
          } catch (error) {
            console.log(`⚠️ [PlayerImageCache] Direct photo source failed: ${photoUrl}`);
          }
        }

        // Last resort: generic CDN sources (may include default images)
        const genericSources = [
          `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${playerId}`,
        ];

        for (const genericUrl of genericSources) {
          try {
            const isValid = await this.validateImageUrl(genericUrl);
            if (isValid) {
              console.log(`⚠️ [PlayerImageCache] Using generic fallback: ${genericUrl}`);
              this.setCachedImage(playerId, playerName, genericUrl, 'fallback');
              return genericUrl;
            }
          } catch (error) {
            console.log(`⚠️ [PlayerImageCache] Generic source failed: ${genericUrl}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ [PlayerImageCache] All photo sources failed for player ${playerId}:`, error);
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
