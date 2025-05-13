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
  LIVE_FIXTURES: 1800000,   // 30 minutes
  STANDINGS: 3600000,       // 60 minutes
  LEAGUES: 7200000,         // 120 minutes
  MATCH_DETAILS: 1800000,   // 30 minutes
};