/**
 * Application-wide constants
 */

// API refresh intervals
export const API_REFRESH_INTERVALS = {
  LIVE_FIXTURES: 1800000,   // 30 minutes
  STANDINGS: 1800000,       // 30 minutes
  LEAGUES: 1800000,         // 30 minutes 
  MATCH_DETAILS: 1800000,   // 30 minutes
  MATCH_COUNTDOWN: 1000,    // 1 second (UI only, not API)
};

// Cache stale times (for React Query)
export const CACHE_STALE_TIMES = {
  LEAGUES: 5 * 60 * 1000, // 5 minutes
  FIXTURES: 60 * 1000, // 1 minute
  LIVE: 30 * 1000 // 30 seconds
};

export const STATIC_LEAGUE_LOGOS = {
  2: '/cs-sport-logo.png', // Champions League
  3: '/cs-sport-logo.png', // Europa League
  39: '/cs-sport-logo.png', // Premier League
  78: '/cs-sport-logo.png', // Bundesliga
  135: '/cs-sport-logo.png', // Serie A
  140: '/cs-sport-logo.png' // La Liga
};