
interface PlayerMapping {
  id: number;
  name: string;
  team?: string;
  verified: boolean;
  lastChecked: string;
}

interface PlayerMappingCache {
  [key: string]: PlayerMapping;
}

class PlayerIdMapper {
  private static cache: PlayerMappingCache = {};
  private static CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Add verified player mapping from API Football dashboard
   */
  static addVerifiedPlayer(id: number, name: string, team?: string): void {
    this.cache[id.toString()] = {
      id,
      name,
      team,
      verified: true,
      lastChecked: new Date().toISOString()
    };
  }

  /**
   * Check if player ID is verified
   */
  static isVerified(playerId: number): boolean {
    const mapping = this.cache[playerId.toString()];
    if (!mapping) return false;

    // Check if cache is still valid
    const lastChecked = new Date(mapping.lastChecked);
    const now = new Date();
    const isExpired = (now.getTime() - lastChecked.getTime()) > this.CACHE_DURATION;

    return mapping.verified && !isExpired;
  }

  /**
   * Get player mapping if verified
   */
  static getPlayerMapping(playerId: number): PlayerMapping | null {
    const mapping = this.cache[playerId.toString()];
    return this.isVerified(playerId) ? mapping : null;
  }

  /**
   * Bulk import verified player IDs
   */
  static importVerifiedPlayers(players: Array<{id: number, name: string, team?: string}>): void {
    players.forEach(player => {
      this.addVerifiedPlayer(player.id, player.name, player.team);
    });
    console.log(`✅ [PlayerMapper] Imported ${players.length} verified player mappings`);
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {total: number, verified: number, expired: number} {
    const entries = Object.values(this.cache);
    const now = new Date();
    
    return {
      total: entries.length,
      verified: entries.filter(e => e.verified).length,
      expired: entries.filter(e => {
        const lastChecked = new Date(e.lastChecked);
        return (now.getTime() - lastChecked.getTime()) > this.CACHE_DURATION;
      }).length
    };
  }

  /**
   * Load verified players from API Football dashboard exports
   */
  static loadFromDashboardExport(csvData: string): void {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    
    const players = lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        id: parseInt(values[0]),
        name: values[1]?.replace(/"/g, ''),
        team: values[2]?.replace(/"/g, '')
      };
    }).filter(p => !isNaN(p.id) && p.name);

    this.importVerifiedPlayers(players);
  }
}

export default PlayerIdMapper;
