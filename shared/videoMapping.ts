/**
 * Video Highlight Mapping System
 * 
 * This file maps fixture/match IDs to YouTube video IDs for highlights.
 * To add a new highlight:
 * 1. Find the fixture ID from the API
 * 2. Find an appropriate YouTube highlight video
 * 3. Add an entry to the appropriate mapping object below
 * 
 * Note: Make sure to test that the video is embeddable! Some videos are region-restricted
 * or don't allow embedding. In these cases, our player will show a "Video Unavailable" message
 * and offer a link to watch on YouTube directly.
 */

interface VideoHighlightInfo {
  videoId: string;               // YouTube video ID
  title?: string;                // Video title
  source?: string;               // Source channel
  thumbnailOverride?: string;    // Optional custom thumbnail URL
  embedAllowed?: boolean;        // Whether embedding is known to be allowed
  regionRestricted?: boolean;    // Whether the video is region-restricted
  alternateVideoId?: string;     // Fallback video ID if the main one fails
}

// Football (Soccer) highlights mapping
export const footballHighlights: Record<string, VideoHighlightInfo> = {
  // Example: Venezia vs Fiorentina (Serie A) - VERIFIED WORKING
  "1223954": {
    videoId: "lXfEK8G8CUI",  // Serie A official channel - Venezia vs Fiorentina
    title: "Venezia vs Fiorentina 2-1 | All Goals & Highlights | Serie A 2023/24",
    source: "Serie A"
  },
  
  // Premier League - VERIFIED WORKING
  "1038050": {
    videoId: "1N-XNxYEUZM",
    title: "Manchester City vs Liverpool | Premier League Highlights",
    source: "Premier League"
  },
  
  // La Liga - VERIFIED WORKING
  "1038150": {
    videoId: "q7A3rKxNwvE",
    title: "Barcelona vs Real Madrid | El Clásico 2023 Highlights",
    source: "La Liga"
  },
  
  // Champions League - VERIFIED WORKING
  "1040180": {
    videoId: "auJcLbxYbpw",
    title: "Real Madrid vs Manchester City | Champions League Quarter-Finals",
    source: "UEFA Champions League"
  },
  
  // Add common live fixtures - these should be updated regularly - VERIFIED WORKING
  "1457393": {
    videoId: "eLJfZGx0SdA",
    title: "Liverpool vs Chelsea | Premier League | Match Highlights",
    source: "Premier League"
  }
};

// Basketball highlights mapping
export const basketballHighlights: Record<string, VideoHighlightInfo> = {
  // NBA Games
  "1001": {
    videoId: "eMmZXUgYsWY",
    title: "Lakers vs. Bucks | Full Game Highlights",
    source: "NBA"
  },
  
  // Euroleague
  "2001": {
    videoId: "nM52Z3_Xn54",
    title: "Real Madrid vs Olympiacos | Euroleague Highlights",
    source: "EuroLeague"
  }
};

// Tennis highlights mapping
export const tennisHighlights: Record<string, VideoHighlightInfo> = {
  // Wimbledon
  "3001": {
    videoId: "HVsSmkum4ZI",
    title: "Djokovic vs Nadal | Wimbledon Semi-Final Highlights",
    source: "Wimbledon"
  },
  
  // Australian Open
  "3002": {
    videoId: "XvMrEa-GzQM",
    title: "Alcaraz vs Zverev | Australian Open Highlights",
    source: "Australian Open"
  }
};

// Baseball highlights mapping
export const baseballHighlights: Record<string, VideoHighlightInfo> = {
  // MLB
  "4001": {
    videoId: "BdBxlvsVTWA",
    title: "Yankees vs. Red Sox | MLB Highlights",
    source: "MLB"
  }
};

// Horse racing highlights mapping
export const horseRacingHighlights: Record<string, VideoHighlightInfo> = {
  // Kentucky Derby
  "5001": {
    videoId: "YvQpvaVt_NI",
    title: "Kentucky Derby 2023 | Full Race",
    source: "NBC Sports"
  }
};

// Esports highlights mapping
export const esportsHighlights: Record<string, VideoHighlightInfo> = {
  // League of Legends
  "6001": {
    videoId: "Z8P7lMmxdrA",
    title: "T1 vs. JDG | MSI 2023 Grand Finals",
    source: "LoL Esports"
  },
  
  // Dota 2
  "6002": {
    videoId: "KZFXWcVakQM",
    title: "Team Spirit vs. PSG.LGD | The International 10 Grand Finals",
    source: "Dota 2"
  }
};

/**
 * Get video highlight information for a fixture across all sports
 * @param fixtureId The fixture/match ID
 * @param sport The sport type (defaults to 'football')
 * @returns Video highlight info or null if not found
 */
export function getVideoHighlight(fixtureId: string, sport: 'football' | 'basketball' | 'tennis' | 'baseball' | 'horseracing' | 'esports' = 'football') {
  if (!fixtureId) return null;
  
  let videoInfo: VideoHighlightInfo | undefined;
  
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
    thumbnailUrl: videoInfo.thumbnailOverride || `https://img.youtube.com/vi/${videoInfo.videoId}/hqdefault.jpg`,
    embedAllowed: videoInfo.embedAllowed !== false, // Default to true unless explicitly set to false
    regionRestricted: videoInfo.regionRestricted || false,
    alternateVideoId: videoInfo.alternateVideoId
  };
}