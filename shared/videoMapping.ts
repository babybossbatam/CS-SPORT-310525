/**
 * Video Highlight Mapping System
 * 
 * This file maps fixture/match IDs to YouTube video IDs for highlights.
 * To add a new highlight:
 * 1. Find the fixture ID from the API
 * 2. Find an appropriate YouTube highlight video
 * 3. Add an entry to the appropriate mapping object below
 */

// Football (Soccer) highlights mapping
export const footballHighlights: Record<string, {
  videoId: string;
  title?: string;
  source?: string;
  thumbnailOverride?: string;
}> = {
  // Example: Venezia vs Fiorentina (Serie A)
  "1223954": {
    videoId: "CUG4m9lJQMY",  // beIN SPORTS video ID for highlights
    title: "Venezia 2-1 Fiorentina | Venezia open Serie A campaign with win | Serie A 2023/24",
    source: "beIN SPORTS Asia"
  },
  // Add more mappings as needed
};

// Basketball highlights mapping
export const basketballHighlights: Record<string, {
  videoId: string;
  title?: string;
  source?: string;
  thumbnailOverride?: string;
}> = {
  // Example format - add real IDs as needed
  "basketball_fixture_id": {
    videoId: "youtube_video_id",
    title: "Team A vs Team B Full Highlights",
    source: "Source Channel Name"
  },
};

// Tennis highlights mapping
export const tennisHighlights: Record<string, {
  videoId: string;
  title?: string;
  source?: string;
  thumbnailOverride?: string;
}> = {
  // Example format - add real IDs as needed
};

// Baseball highlights mapping
export const baseballHighlights: Record<string, {
  videoId: string;
  title?: string;
  source?: string;
  thumbnailOverride?: string;
}> = {
  // Example format - add real IDs as needed
};

// Horse racing highlights mapping
export const horseRacingHighlights: Record<string, {
  videoId: string;
  title?: string;
  source?: string;
  thumbnailOverride?: string;
}> = {
  // Example format - add real IDs as needed
};

// Esports highlights mapping
export const esportsHighlights: Record<string, {
  videoId: string;
  title?: string;
  source?: string;
  thumbnailOverride?: string;
}> = {
  // Example format - add real IDs as needed
};

/**
 * Get video highlight information for a fixture across all sports
 * @param fixtureId The fixture/match ID
 * @param sport The sport type (defaults to 'football')
 * @returns Video highlight info or null if not found
 */
export function getVideoHighlight(fixtureId: string, sport: 'football' | 'basketball' | 'tennis' | 'baseball' | 'horseracing' | 'esports' = 'football') {
  if (!fixtureId) return null;
  
  let videoInfo = null;
  
  switch (sport) {
    case 'football':
      videoInfo = footballHighlights[fixtureId];
      break;
    case 'basketball':
      videoInfo = basketballHighlights[fixtureId];
      break;
    case 'tennis':
      videoInfo = tennisHighlights[fixtureId];
      break;
    case 'baseball':
      videoInfo = baseballHighlights[fixtureId];
      break;
    case 'horseracing':
      videoInfo = horseRacingHighlights[fixtureId];
      break;
    case 'esports':
      videoInfo = esportsHighlights[fixtureId];
      break;
  }
  
  if (!videoInfo) return null;
  
  return {
    videoId: videoInfo.videoId,
    title: videoInfo.title || 'Match Highlights',
    source: videoInfo.source || 'YouTube',
    thumbnailUrl: videoInfo.thumbnailOverride || `https://img.youtube.com/vi/${videoInfo.videoId}/hqdefault.jpg`
  };
}