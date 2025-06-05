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

export const POPULAR_LEAGUES = [
  // UEFA competitions
  2, 3, 848, // Champions League, Europa League, Conference League

  // Top European leagues
  39, 140, 135, 78, 61, // Premier League, La Liga, Serie A, Bundesliga, Ligue 1

  // Other major leagues
  88, 253, 71, // Eredivisie, Major League Soccer, Serie A Brazil

  // International competitions
  1, 4, 15, // World Cup, Euro Championship, FIFA Club World Cup

  // African competitions
  914, // COSAFA Cup
];