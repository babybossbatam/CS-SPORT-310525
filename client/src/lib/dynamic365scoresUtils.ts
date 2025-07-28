
/**
 * Dynamic 365Scores URL generation based on observed patterns
 */

interface Scores365UrlOptions {
  width?: number;
  height?: number;
  playerId: number;
  version?: string;
}

/**
 * Generate 365scores URLs with dynamic versioning based on player ID patterns
 */
export function generate365ScoresUrls(playerId: number, options: Partial<Scores365UrlOptions> = {}): string[] {
  const { width = 64, height = 64 } = options;
  
  // Based on your examples:
  // - Player 91520 uses v21
  // - Player 116585 uses v6  
  // - Some might not have version prefix
  
  const baseUrl = `https://imagecache.365scores.com/image/upload/f_png,w_${width},h_${height},c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65`;
  
  // Generate multiple format variations
  const formats = [
    `${baseUrl}/v21/Athletes/${playerId}`, // Most recent version observed
    `${baseUrl}/v6/Athletes/${playerId}`,  // Alternative version observed
    `${baseUrl}/Athletes/${playerId}`,     // Version-less format
    `${baseUrl}/v41/Athletes/${playerId}`, // Original format (fallback)
    `${baseUrl}/v16/Athletes/${playerId}`, // Additional version
  ];

  return formats;
}

/**
 * Get the best 365scores URL for a player based on ID patterns
 */
export function getBest365ScoresUrl(playerId: number): string {
  // You can add logic here to determine which version to use based on player ID ranges
  // For now, we'll use v21 as the primary since it was observed in recent examples
  
  if (playerId >= 100000) {
    // Higher IDs might use newer versions
    return generate365ScoresUrls(playerId)[0]; // v21
  } else if (playerId >= 50000) {
    // Mid-range IDs might use v6
    return generate365ScoresUrls(playerId)[1]; // v6
  } else {
    // Lower IDs might use older versions
    return generate365ScoresUrls(playerId)[3]; // v41
  }
}

export default {
  generate365ScoresUrls,
  getBest365ScoresUrl
};
