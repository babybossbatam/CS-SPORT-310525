
/**
 * Player Data and Avatar System
 * Uses RapidAPI to fetch player data and falls back to SVG avatars
 */

interface CachedPlayerData {
  playerId?: number;
  playerName: string;
  photo?: string;
  timestamp: number;
  teamId?: number;
  source: 'rapidapi' | 'fallback';
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const playerCache = new Map<string, CachedPlayerData>();

/**
 * Get player image with team context for better API results
 */
export async function getPlayerImage(
  playerId?: number,
  playerName?: string,
  teamId?: number
): Promise<string> {
  const cacheKey = `${playerId || 'no-id'}_${playerName || 'no-name'}_${teamId || 'no-team'}`;
  
  console.log(`🔍 [Player Image Cache] Fetching image for: ${playerName} (ID: ${playerId}, Team: ${teamId})`);
  
  // Check cache first
  const cached = playerCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`✅ [Player Image Cache] Found cached image for ${playerName}: ${cached.photo}`);
    return cached.photo || generateFallbackSVG(playerName);
  }

  // Try to fetch from RapidAPI if we have player ID and team ID
  if (playerId && teamId) {
    try {
      console.log(`📡 [Player Image Cache] Fetching from API: player ${playerId} from team ${teamId}`);
      const response = await fetch(`/api/team-players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          teamId, 
          playerId,
          playerName 
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`📡 [Player Image Cache] API response for ${playerName}:`, data);
        
        if (data.photo) {
          const playerData: CachedPlayerData = {
            playerId,
            playerName: playerName || '',
            photo: data.photo,
            timestamp: Date.now(),
            teamId,
            source: 'rapidapi'
          };
          playerCache.set(cacheKey, playerData);
          console.log(`✅ [Player Image Cache] Cached API image for ${playerName}: ${data.photo}`);
          return data.photo;
        }
      } else {
        console.warn(`⚠️ [Player Image Cache] API request failed for ${playerName}:`, response.status);
      }
    } catch (error) {
      console.error(`❌ [Player Image Cache] Error fetching from API for ${playerName}:`, error);
    }
  }

  // Fallback to SVG avatar
  const fallbackSVG = generateFallbackSVG(playerName);
  const fallbackData: CachedPlayerData = {
    playerId,
    playerName: playerName || '',
    photo: fallbackSVG,
    timestamp: Date.now(),
    teamId,
    source: 'fallback'
  };
  playerCache.set(cacheKey, fallbackData);
  console.log(`🎨 [Player Image Cache] Using fallback SVG for ${playerName}: ${fallbackSVG}`);
  return fallbackSVG;
}

/**
 * Generate SVG fallback avatar with player initials
 */
function generateFallbackSVG(playerName?: string): string {
  const initials = playerName
    ?.split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'P';

  const colors = ['4F46E5', 'EF4444', '10B981', 'F59E0B', '8B5CF6', 'EC4899'];
  const colorIndex = playerName ? playerName.length % colors.length : 0;
  const bgColor = colors[colorIndex];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=128&background=${bgColor}&color=fff&bold=true&format=svg`;
}

interface PlayerAPIResponse {
  response: Array<{
    player: {
      id: number;
      name: string;
      firstname: string;
      lastname: string;
      age: number;
      birth: {
        date: string;
        place: string;
        country: string;
      };
      nationality: string;
      height: string;
      weight: string;
      injured: boolean;
      photo: string;
    };
    statistics: Array<{
      team: {
        id: number;
        name: string;
        logo: string;
      };
      league: {
        id: number;
        name: string;
        country: string;
        logo: string;
        flag: string;
        season: number;
      };
    }>;
  }>;
}

class PlayerDataCache {
  private cache = new Map<string, CachedPlayerData>();
  private teamPlayersCache = new Map<string, PlayerAPIResponse>();
  private readonly MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours for player data
  private readonly MAX_SIZE = 1000;

  // Generate cache key for individual player
  private getPlayerCacheKey(playerId?: number, playerName?: string): string {
    return `player_${playerId || 'unknown'}_${playerName || 'unknown'}`;
  }

  // Generate cache key for team players
  private getTeamCacheKey(teamId: number, season: number = 2024): string {
    return `team_${teamId}_${season}`;
  }

  // Get cached player data
  getCachedPlayerData(playerId?: number, playerName?: string): CachedPlayerData | null {
    const key = this.getPlayerCacheKey(playerId, playerName);
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

  // Fetch team players from RapidAPI
  async fetchTeamPlayers(teamId: number, season: number = 2024): Promise<PlayerAPIResponse | null> {
    const cacheKey = this.getTeamCacheKey(teamId, season);
    
    // Check cache first
    const cached = this.teamPlayersCache.get(cacheKey);
    if (cached) {
      console.log(`✅ [PlayerDataCache] Using cached team data for team ${teamId}`);
      return cached;
    }

    try {
      console.log(`🔍 [PlayerDataCache] Fetching players for team ${teamId}, season ${season}`);
      
      const response = await fetch('/api/team-players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId, season }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch team players: ${response.status}`);
      }

      const data: PlayerAPIResponse = await response.json();
      
      // Cache the team data
      this.teamPlayersCache.set(cacheKey, data);
      console.log(`💾 [PlayerDataCache] Cached ${data.response?.length || 0} players for team ${teamId}`);
      
      // Cache individual player data
      data.response?.forEach(playerData => {
        this.cachePlayerData(
          playerData.player.id,
          playerData.player.name,
          playerData.player.photo,
          teamId
        );
      });

      return data;
    } catch (error) {
      console.error(`❌ [PlayerDataCache] Error fetching team players for ${teamId}:`, error);
      return null;
    }
  }

  // Cache individual player data
  private cachePlayerData(
    playerId: number,
    playerName: string,
    photo?: string,
    teamId?: number
  ): void {
    const key = this.getPlayerCacheKey(playerId, playerName);
    
    this.cache.set(key, {
      playerId,
      playerName,
      photo,
      timestamp: Date.now(),
      teamId,
      source: photo ? 'rapidapi' : 'fallback'
    });
  }

  // Get player avatar URL with fallback
  async getPlayerAvatar(
    playerId?: number, 
    playerName?: string, 
    teamId?: number
  ): Promise<string> {
    // Check cache first
    const cached = this.getCachedPlayerData(playerId, playerName);
    if (cached?.photo) {
      console.log(`✅ [PlayerDataCache] Using cached photo for ${playerName}`);
      return cached.photo;
    }

    // If we have team ID, try to fetch team players
    if (teamId && playerId) {
      try {
        const teamData = await this.fetchTeamPlayers(teamId);
        if (teamData) {
          const playerData = teamData.response?.find(p => p.player.id === playerId);
          if (playerData?.player.photo) {
            console.log(`✅ [PlayerDataCache] Found photo for ${playerName} via team data`);
            return playerData.player.photo;
          }
        }
      } catch (error) {
        console.warn(`⚠️ [PlayerDataCache] Failed to get team data for ${teamId}:`, error);
      }
    }

    // Fallback to SVG avatar
    const avatarUrl = this.generateSVGAvatar(playerName);
    console.log(`🎨 [PlayerDataCache] Using SVG avatar for ${playerName}`);
    
    // Cache the fallback
    if (playerId || playerName) {
      this.cachePlayerData(playerId || 0, playerName || 'Unknown', avatarUrl, teamId);
    }
    
    return avatarUrl;
  }

  // Generate SVG avatar with initials
  private generateSVGAvatar(playerName?: string): string {
    const initials = this.generateInitials(playerName);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=64&background=4F46E5&color=fff&bold=true&format=svg`;
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

  // Preload players for a team
  async preloadTeamPlayers(teamId: number, season: number = 2024): Promise<void> {
    try {
      await this.fetchTeamPlayers(teamId, season);
      console.log(`📦 [PlayerDataCache] Preloaded players for team ${teamId}`);
    } catch (error) {
      console.warn(`⚠️ [PlayerDataCache] Error preloading team ${teamId}:`, error);
    }
  }

  // Clear cache
  clear(): void {
    this.cache.clear();
    this.teamPlayersCache.clear();
    console.log('🗑️ [PlayerDataCache] Cache cleared');
  }

  // Get cache statistics
  getStats() {
    const playerEntries = Array.from(this.cache.values());
    return {
      totalPlayers: playerEntries.length,
      totalTeams: this.teamPlayersCache.size,
      rapidapi: playerEntries.filter(item => item.source === 'rapidapi').length,
      fallback: playerEntries.filter(item => item.source === 'fallback').length,
    };
  }
}

// Export singleton instance
export const playerDataCache = new PlayerDataCache();

// Export helper functions - using the existing getPlayerImage function defined above

export const preloadTeamPlayers = async (teamId: number, season?: number): Promise<void> => {
  return playerDataCache.preloadTeamPlayers(teamId, season);
};

export const clearPlayerImageCache = (): void => {
  return playerDataCache.clear();
};

export default playerDataCache;
