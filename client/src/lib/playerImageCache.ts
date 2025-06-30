
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
  async getPlayerImageWithFallback(playerId?: number, playerName?: string): Promise<string> {
    // Check cache first
    const cached = this.getCachedImage(playerId, playerName);
    if (cached && cached.verified) {
      return cached.url;
    }

    // Try API endpoint if we have a player ID - trust it works since console shows 200 responses
    if (playerId) {
      try {
        const apiUrl = `/api/player-photo/${playerId}`;
        console.log(`🔍 [PlayerImageCache] Using API endpoint: ${apiUrl}`);
        
        // Cache and return API URL directly - validation will happen when the image loads
        this.setCachedImage(playerId, playerName, apiUrl, 'api');
        return apiUrl;
      } catch (error) {
        console.warn(`⚠️ [PlayerImageCache] API failed for player ${playerId}:`, error);
      }
    }

    // Generate initials fallback only if no player ID
    const initials = this.generateInitials(playerName);
    const fallbackUrl = `https://ui-avatars.com/api/?name=${initials}&size=32&background=4F46E5&color=fff&bold=true&format=svg`;
    
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
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(2000)
        });
        return response.ok && response.headers.get('content-type')?.startsWith('image/');
      }

      // For external URLs, do a quick validation
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      
      return response.ok && response.headers.get('content-type')?.startsWith('image/');
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

export default playerImageCache;
