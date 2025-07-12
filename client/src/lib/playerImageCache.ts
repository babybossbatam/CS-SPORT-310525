interface CachedPlayerImage {
  url: string;
  timestamp: number;
  playerId?: number;
  playerName?: string;
  source: 'api' | 'fallback' | 'search';
}

class PlayerImageCache {
  private cache = new Map<string, CachedPlayerImage>();
  private readonly MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly FALLBACK_IMAGE = '/assets/fallback-logo.png';

  private getCacheKey(playerId?: number, playerName?: string): string {
    if (playerId) return `player_${playerId}`;
    if (playerName) return `name_${playerName.toLowerCase().replace(/\s+/g, '_')}`;
    return 'unknown';
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.MAX_AGE;
  }

  private async fetchFromAPI(playerId: number): Promise<string | null> {
    try {
      const response = await fetch(`/api/player-photo/${playerId}`);
      if (response.ok && response.status !== 404) {
        return response.url;
      }
    } catch (error) {
      console.warn(`Failed to fetch player photo for ID ${playerId}:`, error);
    }
    return null;
  }

  private async searchPlayerImage(playerName: string): Promise<string | null> {
    try {
      // Simple search implementation - could be enhanced
      const searchQuery = `${playerName} football player photo`;
      const response = await fetch(`/api/search/player-image?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        return data.imageUrl || null;
      }
    } catch (error) {
      console.warn(`Failed to search for player image for ${playerName}:`, error);
    }
    return null;
  }

  getCachedImage(playerId?: number, playerName?: string): string | null {
    const key = this.getCacheKey(playerId, playerName);
    const cached = this.cache.get(key);

    if (cached && !this.isExpired(cached.timestamp)) {
      return cached.url;
    }

    if (cached && this.isExpired(cached.timestamp)) {
      this.cache.delete(key);
    }

    return null;
  }

  private setCachedImage(
    playerId: number | undefined, 
    playerName: string | undefined, 
    url: string, 
    source: 'api' | 'fallback' | 'search'
  ): void {
    const key = this.getCacheKey(playerId, playerName);
    this.cache.set(key, {
      url,
      timestamp: Date.now(),
      playerId,
      playerName,
      source
    });
  }

  async getPlayerImageWithFallback(playerId?: number, playerName?: string): Promise<string> {
    // Check cache first
    const cached = this.getCachedImage(playerId, playerName);
    if (cached) {
      return cached;
    }

    // Try API if we have a player ID
    if (playerId) {
      const apiUrl = await this.fetchFromAPI(playerId);
      if (apiUrl) {
        this.setCachedImage(playerId, playerName, apiUrl, 'api');
        return apiUrl;
      }
    }

    // Try search if we have a player name
    if (playerName) {
      const searchUrl = await this.searchPlayerImage(playerName);
      if (searchUrl) {
        this.setCachedImage(playerId, playerName, searchUrl, 'search');
        return searchUrl;
      }
    }

    // Return fallback
    this.setCachedImage(playerId, playerName, this.FALLBACK_IMAGE, 'fallback');
    return this.FALLBACK_IMAGE;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; entries: Array<{ key: string; age: number; source: string }> } {
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      source: value.source
    }));

    return {
      size: this.cache.size,
      entries
    };
  }
}

// Export singleton instance
export const playerImageCache = new PlayerImageCache();

// Export helper functions
export const getPlayerImage = async (playerId?: number, playerName?: string): Promise<string> => {
  return playerImageCache.getPlayerImageWithFallback(playerId, playerName);
};

export const clearPlayerImageCache = (): void => {
  playerImageCache.clearCache();
};

export const getPlayerImageCacheStats = () => {
  return playerImageCache.getCacheStats();
};