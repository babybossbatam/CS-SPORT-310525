
/**
 * Simple player image utility without complex caching
 * Similar to top scorer image approach
 */

export interface PlayerImageData {
  playerId?: number;
  playerName?: string;
  teamId?: number;
}

/**
 * Get player image URL using team-based approach
 * This mimics the top scorer image system but for match events
 */
export function getSimplePlayerImage(data: PlayerImageData): string {
  const { playerId, playerName, teamId } = data;

  // Primary: Use API-Sports for player images (more reliable)
  if (playerId) {
    return `https://media.api-sports.io/football/players/${playerId}.png`;
  }

  // Secondary: Try alternative sources for player images
  if (teamId && playerName) {
    // Use BeSoccer or other reliable sources instead
    const playerSlug = playerName.toLowerCase().replace(/\s+/g, '-');
    return `https://cdn.resfu.com/img_data/players/medium/${playerId || 'unknown'}.jpg?size=120x&lossy=1`;
  }

  // Fallback: Generate initials-based image (like AvatarFallback)
  if (playerName) {
    const initials = playerName
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    
    return `https://ui-avatars.com/api/?name=${initials}&size=64&background=4F46E5&color=fff&bold=true&format=svg`;
  }

  // Final fallback
  return `https://ui-avatars.com/api/?name=P&size=64&background=4F46E5&color=fff&bold=true&format=svg`;
}

/**
 * Preload player image for better UX
 */
export function preloadPlayerImage(imageUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject();
    img.src = imageUrl;
  });
}
