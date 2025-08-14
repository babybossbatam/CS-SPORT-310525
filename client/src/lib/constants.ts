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

// Popular leagues (aligned with Redux store)
export const POPULAR_LEAGUES = [
  2,   // UEFA Champions League
  3,   // UEFA Europa League
  848, // UEFA Conference League
  39,  // Premier League (England)
  45,  // FA Cup (England)
  140, // La Liga (Spain)
  135, // Serie A (Italy)
  78,  // Bundesliga (Germany)
  207, // EFL Cup (England)
  219, // Community Shield (England)
  203, // Championship (England)
];

// Re-export the countries and leagues constants
export { 
  ALL_COUNTRIES, 
  MAJOR_LEAGUES,
  getCountryByCode,
  getCountryByName,
  getLeagueById,
  getLeaguesByCountry,
  getCountriesAsOptions,
  getLeaguesAsOptions
} from './constants/countriesAndLeagues';
export type { Country, League, CountryOption, LeagueOption } from './constants/countriesAndLeagues';

export const API_BASE_URL = window.location.origin;