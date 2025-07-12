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

  // Simplified player image with team-based batch loading
  async getPlayerImageWithFallback(playerId?: number, playerName?: string, teamId?: number): Promise<string> {
    // Check cache first
    const cached = this.getCachedImage(playerId, playerName);
    if (cached && cached.verified) {
      return cached.url;
    }

    // If we have team ID, try batch loading first (most efficient)
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

    // If batch loading didn't work and we have a player ID, try the RapidAPI endpoint
    if (playerId) {
      try {
        const apiUrl = `/api/player-photo/${playerId}`;
        const isValidApi = await this.validateImageUrl(apiUrl);
        if (isValidApi) {
          this.setCachedImage(playerId, playerName, apiUrl, 'api');
          return apiUrl;
        }
      } catch (error) {
        console.log(`⚠️ [PlayerImageCache] API endpoint failed for player ${playerId}:`, error);
      }
    }

    // Generate initials fallback
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

export const batchLoadPlayerImagesFunc = async (teamId?: number, leagueId?: number): Promise<void> => {
  return playerImageCache.batchLoadPlayerImages(teamId, leagueId);
};

export default playerImageCache;