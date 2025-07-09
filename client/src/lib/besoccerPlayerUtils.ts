
/**
 * BeSoccer Player Utilities
 * Helper functions for extracting player data from BeSoccer
 */

export interface BeSoccerPlayer {
  id: number;
  name: string;
  imageUrl?: string;
  team?: string;
  position?: string;
}

class BeSoccerPlayerUtils {
  private static readonly BASE_CDN_URL = 'https://cdn.resfu.com/img_data/players/medium/';
  private static readonly BESOCCER_PLAYERS_URL = 'https://www.besoccer.com/players';

  /**
   * Extract player ID from BeSoccer player URL
   * Example: https://www.besoccer.com/player/messi/1234 -> 1234
   */
  static extractPlayerIdFromUrl(url: string): number | null {
    try {
      const urlPattern = /\/player\/[^\/]+\/(\d+)/;
      const match = url.match(urlPattern);
      return match ? parseInt(match[1], 10) : null;
    } catch (error) {
      console.warn('Failed to extract player ID from URL:', error);
      return null;
    }
  }

  /**
   * Generate BeSoccer CDN image URL from player ID
   */
  static generateImageUrl(playerId: number, size: string = '120x', lossy: boolean = true): string {
    const lossyParam = lossy ? '&lossy=1' : '';
    return `${this.BASE_CDN_URL}${playerId}.jpg?size=${size}${lossyParam}`;
  }

  /**
   * Generate multiple image URL variations for fallback
   */
  static generateImageUrlVariations(playerId: number): string[] {
    return [
      this.generateImageUrl(playerId, '120x', true),
      this.generateImageUrl(playerId, '120x', false),
      this.generateImageUrl(playerId, '80x', true),
      `${this.BASE_CDN_URL}${playerId}.jpg`,
      `https://cdn.resfu.com/img_data/players/small/${playerId}.jpg?size=120x&lossy=1`,
    ];
  }

  /**
   * Validate if a BeSoccer player image exists
   */
  static async validatePlayerImage(playerId: number): Promise<boolean> {
    const imageUrl = this.generateImageUrl(playerId);
    
    try {
      const response = await fetch(imageUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok && response.headers.get('content-type')?.startsWith('image/');
    } catch (error) {
      console.warn(`Failed to validate player image for ID ${playerId}:`, error);
      return false;
    }
  }

  /**
   * Search for player by name (mock implementation - would need actual BeSoccer API)
   * This is a placeholder for future implementation
   */
  static async searchPlayerByName(playerName: string): Promise<BeSoccerPlayer[]> {
    // This would require either:
    // 1. BeSoccer API access
    // 2. Web scraping (not recommended)
    // 3. A mapping database
    
    console.log(`🔍 [BeSoccer] Mock search for player: ${playerName}`);
    
    // For now, return empty array - this would be implemented with actual data source
    return [];
  }

  /**
   * Get player info from cached mapping or external source
   */
  static async getPlayerInfo(playerId: number): Promise<BeSoccerPlayer | null> {
    try {
      // Check if image exists
      const imageExists = await this.validatePlayerImage(playerId);
      
      if (imageExists) {
        return {
          id: playerId,
          name: `Player ${playerId}`, // Would be fetched from actual source
          imageUrl: this.generateImageUrl(playerId),
        };
      }
      
      return null;
    } catch (error) {
      console.warn(`Failed to get player info for ID ${playerId}:`, error);
      return null;
    }
  }

  /**
   * Batch validate multiple player images
   */
  static async batchValidatePlayerImages(playerIds: number[]): Promise<Record<number, boolean>> {
    const results: Record<number, boolean> = {};
    
    const promises = playerIds.map(async (id) => {
      const isValid = await this.validatePlayerImage(id);
      results[id] = isValid;
      return { id, isValid };
    });

    try {
      await Promise.allSettled(promises);
      console.log(`📊 [BeSoccer] Batch validation completed for ${playerIds.length} players`);
    } catch (error) {
      console.warn('Batch validation error:', error);
    }

    return results;
  }
}

// Export utility functions
export const extractPlayerIdFromBeSoccerUrl = BeSoccerPlayerUtils.extractPlayerIdFromUrl;
export const generateBeSoccerImageUrl = BeSoccerPlayerUtils.generateImageUrl;
export const validateBeSoccerPlayerImage = BeSoccerPlayerUtils.validatePlayerImage;
export const searchBeSoccerPlayer = BeSoccerPlayerUtils.searchPlayerByName;
export const getBeSoccerPlayerInfo = BeSoccerPlayerUtils.getPlayerInfo;
export const batchValidateBeSoccerImages = BeSoccerPlayerUtils.batchValidatePlayerImages;

export default BeSoccerPlayerUtils;
