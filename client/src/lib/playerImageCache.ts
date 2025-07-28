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
  headers?: {
    lastModified?: string;
    etag?: string;
  };
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

  // Set cached player image with optional headers
  setCachedImage(
    playerId: number | undefined,
    playerName: string | undefined,
    url: string,
    source: CachedPlayerImage['source'] = 'api',
    headers?: { lastModified?: string; etag?: string }
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
      source,
      headers
    });

    console.log(`💾 [PlayerImageCache] Cached image for player: ${playerName} (${playerId}) | Source: ${source}${headers ? ' | With headers' : ''}`);
  }

  // Check if cached image is still fresh/valid
  private async isImageFresh(cachedItem: CachedPlayerImage): Promise<boolean> {
    try {
      // For generated avatars (UI avatars), consider them always fresh
      if (cachedItem.url.includes('ui-avatars.com') || cachedItem.source === 'initials') {
        return true;
      }

      // For external URLs, implement smarter freshness logic
      if (cachedItem.url.startsWith('https://')) {
        // Check cache age first - if older than 6 hours, consider stale
        const age = Date.now() - cachedItem.timestamp;
        const sixHours = 6 * 60 * 60 * 1000; // 6 hours
        
        if (age > sixHours) {
          console.log(`🔄 [PlayerImageCache] Cache older than 6 hours for: ${cachedItem.playerName} (age: ${Math.round(age / 1000 / 60)} min)`);
          return false;
        }

        // For newer cache entries, do a quick accessibility check
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort('Timeout: Image freshness check exceeded 1500ms');
        }, 1500);

        try {
          const response = await fetch(cachedItem.url, { 
            method: 'HEAD',
            signal: controller.signal,
            cache: 'no-cache',
            mode: 'no-cors' // Avoid CORS issues
          });
          clearTimeout(timeoutId);
          
          console.log(`✅ [PlayerImageCache] Cached image accessible: ${cachedItem.playerName}`);
          return true;
        } catch (error) {
          clearTimeout(timeoutId);
          
          // Check if error is due to abort
          if (error instanceof Error && error.name === 'AbortError') {
            console.log(`⏱️ [PlayerImageCache] Image freshness check timed out for: ${cachedItem.playerName}`);
          } else {
            console.log(`⚠️ [PlayerImageCache] Cached image may be stale: ${cachedItem.url}`, error);
          }
          
          // If cache is less than 1 hour old and we can't verify, assume it's still good
          const oneHour = 60 * 60 * 1000;
          if (age < oneHour) {
            console.log(`✅ [PlayerImageCache] Assuming recent cache is fresh: ${cachedItem.playerName}`);
            return true;
          }
          
          return false;
        }
      }

      // For other URLs, consider them fresh
      return true;
    } catch (error) {
      console.warn(`⚠️ [PlayerImageCache] Error checking image freshness:`, error);
      
      // If there's an error checking freshness, use age-based logic
      const age = Date.now() - cachedItem.timestamp;
      const maxAge = 2 * 60 * 60 * 1000; // 2 hours
      return age < maxAge;
    }
  }

  // Simplified player image with team-based batch loading and intelligent refresh
  async getPlayerImageWithFallback(playerId?: number, playerName?: string, teamId?: number, forceRefresh?: boolean): Promise<string> {
    // Implement periodic auto-refresh (every 30 minutes)
    const now = Date.now();
    const periodicRefreshInterval = 30 * 60 * 1000; // 30 minutes
    const shouldPeriodicRefresh = now % periodicRefreshInterval < 60000; // 1-minute window every 30 minutes
    
    if (shouldPeriodicRefresh && !forceRefresh) {
      console.log(`🔄 [PlayerImageCache] Periodic refresh triggered for: ${playerName}`);
      forceRefresh = true;
    }

    // Check cache first
    const cached = this.getCachedImage(playerId, playerName);
    
    if (cached && cached.verified && !forceRefresh) {
      // Check if the cached image is still fresh
      const isFresh = await this.isImageFresh(cached);
      
      if (isFresh) {
        console.log(`✅ [PlayerImageCache] Using fresh cached image: ${playerName}`);
        return cached.url;
      } else {
        // Image is stale, clear this specific cache entry
        console.log(`🔄 [PlayerImageCache] Clearing stale cache for: ${playerName}`);
        this.forceRefresh(playerId, playerName);
      }
    }

    // If force refresh is requested, clear the cache first
    if (forceRefresh) {
      console.log(`🔄 [PlayerImageCache] Force refresh requested for: ${playerName}`);
      this.forceRefresh(playerId, playerName);
    }

    // If we have team ID, try batch loading first as it's more reliable
    if (teamId) {
      try {
        await this.batchLoadPlayerImages(teamId);
        const cachedAfterBatch = this.getCachedImage(playerId, playerName);
        if (cachedAfterBatch && cachedAfterBatch.url) {
          return cachedAfterBatch.url;
        }
      } catch (error) {
        console.warn(`⚠️ [PlayerImageCache] Batch loading failed for team ${teamId}:`, error);
      }
    }

    // Primary: Name-based photo search using our backend endpoint
    if (playerName) {
      const nameBasedUrl = `/api/player-photo-by-name?name=${encodeURIComponent(playerName)}`;
      console.log(`🔍 [PlayerImageCache] Trying primary source (name-based search) for ${playerName}: ${nameBasedUrl}`);
      
      try {
        const validationResult = await this.validateImageUrl(nameBasedUrl);
        if (validationResult.isValid) {
          this.setCachedImage(playerId, playerName, nameBasedUrl, 'api', validationResult.headers);
          console.log(`✅ [PlayerImageCache] Validated and cached name-based URL: ${nameBasedUrl}`);
          return nameBasedUrl;
        } else {
          console.log(`⚠️ [PlayerImageCache] Name-based search failed for ${playerName}, trying ID-based alternatives`);
        }
      } catch (error) {
        console.log(`⚠️ [PlayerImageCache] Name-based search error for ${playerName}:`, error);
      }
    }

    // Secondary: API-Sports.io player images (if ID available)
    if (playerId) {
      const apiSportsUrl = `https://media.api-sports.io/football/players/${playerId}.png`;
      console.log(`🔍 [PlayerImageCache] Trying secondary source (API-Sports.io) for ${playerName}: ${apiSportsUrl}`);
      
      try {
        const validationResult = await this.validateImageUrl(apiSportsUrl);
        if (validationResult.isValid) {
          this.setCachedImage(playerId, playerName, apiSportsUrl, 'api', validationResult.headers);
          console.log(`✅ [PlayerImageCache] Validated and cached API-Sports URL: ${apiSportsUrl}`);
          return apiSportsUrl;
        } else {
          console.log(`⚠️ [PlayerImageCache] API-Sports validation failed for ${playerName}, trying alternatives`);
        }
      } catch (error) {
        console.log(`⚠️ [PlayerImageCache] API-Sports validation error for ${playerName}:`, error);
      }
    }

    // Tertiary: Multiple name-based external sources
    if (playerName) {
      const nameBasedSources = [
        // Wikipedia/Wikimedia Commons (often has player photos)
        `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(playerName.replace(/ /g, '_'))}`,
        // Try a generic sports photo API (placeholder - would need actual service)
        `https://www.thesportsdb.com/api/v1/json/1/searchplayers.php?p=${encodeURIComponent(playerName)}`,
      ];

      for (const nameUrl of nameBasedSources) {
        try {
          console.log(`🔍 [PlayerImageCache] Trying name-based source: ${nameUrl}`);
          // For now, skip these as they need special handling
          // We'll implement these later if needed
          continue;
        } catch (error) {
          console.log(`⚠️ [PlayerImageCache] Name-based source failed: ${nameUrl}`);
          continue;
        }
      }
    }

    // Quaternary: ID-based sources as fallback
    if (playerId) {
      const idBasedSources = [
        `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v21/Athletes/${playerId}`,
        `https://cdn.resfu.com/img_data/players/medium/${playerId}.jpg?size=120x&lossy=1`,
        `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v6/Athletes/${playerId}`,
        `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/Athletes/${playerId}`,
      ];

      for (const idUrl of idBasedSources) {
        try {
          const validationResult = await this.validateImageUrl(idUrl);
          if (validationResult.isValid) {
            console.log(`✅ [PlayerImageCache] Found working ID-based source for ${playerName}: ${idUrl}`);
            this.setCachedImage(playerId, playerName, idUrl, 'api', validationResult.headers);
            return idUrl;
          }
        } catch (error) {
          console.log(`⚠️ [PlayerImageCache] ID-based source failed for player ${playerId}: ${idUrl}`);
          continue;
        }
      }
    }

    // Final: Generated initials with colored background (always works)
    const initials = this.generateInitials(playerName);
    const fallbackUrl = `https://ui-avatars.com/api/?name=${initials}&size=128&background=4F46E5&color=fff&bold=true&format=svg`;

    console.log(`🎨 [PlayerImageCache] Using SVG initials fallback for ${playerName}: ${fallbackUrl}`);
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

  // Validate image URL and return validation result with headers
  private async validateImageUrl(url: string): Promise<{ isValid: boolean; headers?: { lastModified?: string; etag?: string } }> {
    try {
      // For local API endpoints, do a proper validation
      if (url.startsWith('/api/')) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort('Timeout: Local API validation exceeded 2000ms');
        }, 2000);

        try {
          const response = await fetch(url, { 
            method: 'HEAD',
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          const isValid = response.ok;
          const headers = {
            lastModified: response.headers.get('last-modified') || undefined,
            etag: response.headers.get('etag') || undefined,
          };
          
          return { isValid, headers };
        } catch (error) {
          clearTimeout(timeoutId);
          
          if (error instanceof Error && error.name === 'AbortError') {
            console.warn(`⏱️ [PlayerImageCache] Local API validation timed out for ${url}`);
          } else {
            console.warn(`⚠️ [PlayerImageCache] Local API validation failed for ${url}:`, error);
          }
          return { isValid: false };
        }
      }

      // For external URLs, assume they work to avoid CORS issues
      // Most external image CDNs don't allow HEAD requests from browsers
      const trustedDomains = [
        'media.api-sports.io',
        'resources.premierleague.com',
        'cdn.resfu.com', 
        'imagecache.365scores.com',
        'ui-avatars.com',
        'thesportsdb.com',
        'transfermarkt.technology'
      ];

      const isTrustedDomain = trustedDomains.some(domain => url.includes(domain));
      
      if (isTrustedDomain) {
        console.log(`✅ [PlayerImageCache] Trusted domain for ${url}, assuming valid`);
        return { isValid: true };
      }

      // For untrusted domains, use Image element validation (more reliable than fetch)
      return new Promise((resolve) => {
        const img = new Image();
        const imageTimeout = setTimeout(() => {
          img.onload = null;
          img.onerror = null;
          console.log(`⏱️ [PlayerImageCache] Image validation timed out for ${url}`);
          resolve({ isValid: false });
        }, 5000);

        img.onload = () => {
          clearTimeout(imageTimeout);
          console.log(`✅ [PlayerImageCache] Image validation passed for ${url}`);
          resolve({ isValid: true });
        };

        img.onerror = () => {
          clearTimeout(imageTimeout);
          console.warn(`⚠️ [PlayerImageCache] Image validation failed for ${url}`);
          resolve({ isValid: false });
        };

        // Set crossOrigin to anonymous to handle CORS better
        img.crossOrigin = 'anonymous';
        img.src = url;
      });
    } catch (error) {
      console.warn(`⚠️ [PlayerImageCache] URL validation failed for ${url}:`, error);
      return { isValid: false };
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

  // Batch load player images by team or league
  async batchLoadPlayerImages(teamId?: number, leagueId?: number): Promise<void> {
    try {
      console.log(`🔄 [PlayerImageCache] Batch loading players for team: ${teamId}, league: ${leagueId}`);

      // Use current season dynamically
      const currentSeason = new Date().getFullYear().toString();
      const endpoint = `/api/teams/${teamId}/players/images?season=${currentSeason}`;
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Failed to batch load players: ${response.status}`);
      }

      const playerImages: Record<string, string> = await response.json();

      // Store all player images in cache with proper structure
      Object.entries(playerImages).forEach(([key, imageUrl]) => {
        // Skip metadata entries
        if (key.includes('_name') || key.includes('_team')) {
          return;
        }

        // Extract player ID and name from cache key
        let playerId: number | undefined;
        let playerName: string | undefined;

        if (key.includes('_') && !key.includes('_fallback')) {
          // This is a composite key: playerId_playerName
          const parts = key.split('_');
          playerId = parseInt(parts[0]);
          playerName = parts.slice(1).join('_');
        } else if (!isNaN(parseInt(key))) {
          // This is just a player ID
          playerId = parseInt(key);
          playerName = playerImages[`${playerId}_name`] || undefined;
        }

        if (playerId && imageUrl) {
          this.setCachedImage(playerId, playerName, imageUrl, 'api');
        }
      });

      const cachedPlayerCount = Object.keys(playerImages).filter(key => 
        !key.includes('_name') && !key.includes('_team') && !key.includes('_fallback')
      ).length;

      console.log(`✅ [PlayerImageCache] Cached ${cachedPlayerCount} player images for team ${teamId} (season ${currentSeason})`);

    } catch (error) {
      console.error(`❌ [PlayerImageCache] Failed to batch load team ${teamId} players:`, error);
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

  // Invalidate all cached images older than specified age
  invalidateOldCache(maxAgeMs: number = 2 * 60 * 60 * 1000): number {
    const now = Date.now();
    let invalidatedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > maxAgeMs) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    console.log(`🗑️ [PlayerImageCache] Invalidated ${invalidatedCount} old cache entries`);
    return invalidatedCount;
  }

  // Get cache status for debugging
  getCacheStatus(): { total: number; bySource: Record<string, number>; averageAge: number } {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    const bySource: Record<string, number> = {};
    let totalAge = 0;
    
    entries.forEach(item => {
      bySource[item.source] = (bySource[item.source] || 0) + 1;
      totalAge += (now - item.timestamp);
    });
    
    return {
      total: entries.length,
      bySource,
      averageAge: entries.length > 0 ? Math.round(totalAge / entries.length / 1000 / 60) : 0 // in minutes
    };
  }

  // Clear wrong cached images for specific players (useful for fixing mismatched photos)
  clearWrongPlayerImage(playerId?: number, playerName?: string): void {
    const key = this.getCacheKey(playerId, playerName);
    const cached = this.cache.get(key);
    
    if (cached) {
      this.cache.delete(key);
      console.log(`🗑️ [PlayerImageCache] Cleared potentially wrong image for player: ${playerName} (${playerId})`);
      console.log(`🔄 [PlayerImageCache] Previous cached URL: ${cached.url}`);
    } else {
      console.log(`ℹ️ [PlayerImageCache] No cached image found for player: ${playerName} (${playerId})`);
    }
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

  // If we have team ID, try batch loading for the team first
  if (teamId && playerId) {
    try {
      await playerImageCache.batchLoadPlayerImages(teamId);
      const cachedAfterBatch = playerImageCache.getCachedImage(playerId, playerName);
      if (cachedAfterBatch && cachedAfterBatch.url) {
        return cachedAfterBatch.url;
      }
    } catch (error) {
      console.warn(`Batch loading failed for team ${teamId}, falling back to individual loading`);
    }
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

export default playerImageCache;