
/**
 * Application-wide constants
 */

// API refresh intervals
export const API_REFRESH_INTERVALS = {
  LIVE_FIXTURES: 3600000,    // 1 hour (increased from 30 minutes)
  STANDINGS: 7200000,        // 2 hours (increased from 30 minutes)
  LEAGUES: 14400000,         // 4 hours (increased from 30 minutes)
  MATCH_DETAILS: 3600000,    // 1 hour (increased from 30 minutes)
  MATCH_COUNTDOWN: 1000,     // 1 second (UI only, not API)
};

// Cache stale times (for React Query)
export const CACHE_STALE_TIMES = {
  LIVE_FIXTURES: 3600000,    // 1 hour (increased from 30 minutes)
  STANDINGS: 7200000,        // 2 hours (increased from 60 minutes)
  LEAGUES: 14400000,         // 4 hours (increased from 60 minutes)
  MATCH_DETAILS: 3600000,    // 1 hour (increased from 30 minutes)
};
