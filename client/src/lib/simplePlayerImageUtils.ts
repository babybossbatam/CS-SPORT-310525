
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

  // Primary: Use direct player ID if available (similar to top scorer approach)
  if (playerId) {
    return `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${playerId}`;
  }

  // Secondary: Try team-based player lookup if we have team ID
  if (teamId && playerName) {
    // This could be enhanced to fetch team roster and match player names
    // For now, we'll use a generic team-based approach
    const playerSlug = playerName.toLowerCase().replace(/\s+/g, '-');
    return `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/team-${teamId}-${playerSlug}`;
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
