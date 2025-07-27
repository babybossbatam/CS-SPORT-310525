/**
 * MyAPIFallback - Comprehensive image fallback utility
 * Handles multiple logo sources with intelligent fallback logic
 */

export interface LogoSource {
  url: string;
  source: string;
  priority: number;
}

export interface TeamLogoOptions {
  teamId?: number | string;
  teamName?: string;
  originalUrl?: string;
  size?: 'small' | 'medium' | 'large';
}

export interface LeagueLogoOptions {
  leagueId?: number | string;
  leagueName?: string;
  originalUrl?: string;
  size?: 'small' | 'medium' | 'large';
}

import { teamLogoCache, getTeamLogoCacheKey, validateLogoUrl, leagueLogoCache } from './logoCache';

/**
 * Validates if a URL is properly formatted and not already processed
 */
function isValidUrl(url: string): boolean {
  try {
    // Check for malformed URLs with nested protocols
    if (url.includes('https://media.api-sports.io/football/teams/https://') || 
        url.includes('undefined') || 
        url.includes('null') ||
        url.includes('//')) {
      return false;
    }

    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

/**
 * Generate multiple logo sources for a team with caching support
 */
export function generateLogoSources(options: TeamLogoOptions): LogoSource[] {
  const { teamId, teamName, originalUrl, size = 'medium' } = options;
  const sources: LogoSource[] = [];

  // Extract team ID from various sources
  let cleanTeamId: string | number | null = null;

  if (teamId) {
    if (typeof teamId === 'number') {
      cleanTeamId = teamId;
    } else if (typeof teamId === 'string') {
      // Extract team ID from URL if it's a URL string
      const urlMatch = teamId.match(/\/teams\/(\d+)/);
      if (urlMatch && urlMatch[1]) {
        cleanTeamId = urlMatch[1];
      } else if (/^\d+$/.test(teamId)) {
        cleanTeamId = teamId;
      }
    }
  }

  // Try to extract team ID from original URL if we don't have one
  if (!cleanTeamId && originalUrl) {
    const urlMatch = originalUrl.match(/\/teams\/(\d+)/);
    if (urlMatch && urlMatch[1]) {
      cleanTeamId = urlMatch[1];
    }
  }

  // 1. Original URL if valid and properly formatted
  if (originalUrl && isValidUrl(originalUrl) && !originalUrl.includes('undefined') && !originalUrl.includes('null')) {
    sources.push({
      url: originalUrl,
      source: 'api-sports-original',
      priority: 1
    });
  }

  // 2. API-Sports direct URLs if we have a team ID
  if (cleanTeamId) {
    sources.push(
      {
        url: `https://media.api-sports.io/football/teams/${cleanTeamId}.png`,
        source: 'api-sports-direct',
        priority: 2
      }
    );

    // 3. SportsRadar sources
    sources.push(
      {
        url: `/api/sportsradar/teams/${cleanTeamId}/logo`,
        source: 'sportsradar-proxy',
        priority: 3
      },
      {
        url: `https://api.sportradar.com/soccer/production/v4/en/competitors/${cleanTeamId}/profile.png`,
        source: 'sportsradar-direct-v4',
        priority: 4
      },
      {
        url: `https://api.sportradar.com/soccer-images/production/competitors/${cleanTeamId}/logo.png`,
        source: 'sportsradar-images',
        priority: 5
      },
      {
        url: `https://imagecache.sportradar.com/production/soccer/competitors/${cleanTeamId}/logo.png`,
        source: 'sportsradar-cache',
        priority: 6
      }
    );
  }

  // 4. Fallback logo
  sources.push({
    url: '/assets/fallback-logo.svg',
    source: 'fallback',
    priority: 9
  });

  return sources.sort((a, b) => a.priority - b.priority);
}

/**
 * Generate multiple logo sources for a league with SportsRadar support
 */
export function generateLeagueLogoSources(options: LeagueLogoOptions): LogoSource[] {
  const { leagueId, leagueName, originalUrl, size = 'medium' } = options;
  const sources: LogoSource[] = [];

  // Extract league ID from various sources
  let cleanLeagueId: string | number | null = null;

  if (leagueId) {
    if (typeof leagueId === 'number') {
      cleanLeagueId = leagueId;
    } else if (typeof leagueId === 'string') {
      // Extract league ID from URL if it's a URL string
      const urlMatch = leagueId.match(/\/leagues\/(\d+)/);
      if (urlMatch && urlMatch[1]) {
        cleanLeagueId = urlMatch[1];
      } else if (/^\d+$/.test(leagueId)) {
        cleanLeagueId = leagueId;
      }
    }
  }

  // Try to extract league ID from original URL if we don't have one
  if (!cleanLeagueId && originalUrl) {
    const urlMatch = originalUrl.match(/\/leagues\/(\d+)/);
    if (urlMatch && urlMatch[1]) {
      cleanLeagueId = urlMatch[1];
    }
  }

  // 1. Original URL if valid and properly formatted
  if (originalUrl && isValidUrl(originalUrl) && !originalUrl.includes('undefined') && !originalUrl.includes('null')) {
    sources.push({
      url: originalUrl,
      source: 'api-sports-original',
      priority: 1
    });
  }

  // 2. API-Sports direct URLs if we have a league ID
  if (cleanLeagueId) {
    sources.push(
      {
        url: `https://media.api-sports.io/football/leagues/${cleanLeagueId}.png`,
        source: 'api-sports-direct',
        priority: 2
      }
    );

    // 3. SportsRadar sources
    sources.push(
      {
        url: `/api/sportsradar/leagues/${cleanLeagueId}/logo`,
        source: 'sportsradar-proxy',
        priority: 3
      },
      {
        url: `https://api.sportradar.com/soccer/production/v4/en/tournaments/${cleanLeagueId}/logo.png`,
        source: 'sportsradar-tournaments',
        priority: 4
      },
      {
        url: `https://api.sportradar.com/soccer-images/production/tournaments/${cleanLeagueId}/logo.png`,
        source: 'sportsradar-tournament-images',
        priority: 5
      }
    );
  }

  // 4. Fallback logo
  sources.push({
    url: '/assets/fallback-logo.svg',
    source: 'fallback',
    priority: 9
  });

  return sources.sort((a, b) => a.priority - b.priority);
}

/**
 * Get cached team logo or fetch with intelligent fallback
 */
export async function getCachedTeamLogo(teamId: number | string, teamName?: string, originalUrl?: string): Promise<string> {
  const cacheKey = getTeamLogoCacheKey(teamId, teamName);

  // Check cache first
  const cached = teamLogoCache.getCached(cacheKey);
  if (cached) {
    return cached;
  }

  const sources = generateLogoSources({ teamId, teamName, originalUrl });

  for (const source of sources) {
    try {
      // For local assets, return immediately
      if (source.url.startsWith('/assets/')) {
        teamLogoCache.setCached(cacheKey, source.url, source.source, true);
        return source.url;
      }

      // For external URLs, do a quick validation
      const isValid = await validateLogoUrl(source.url);
      if (isValid) {
        teamLogoCache.setCached(cacheKey, source.url, source.source, true);
        return source.url;
      }
    } catch (error) {
      // Continue to next source on error
      continue;
    }
  }

  // If all sources fail, return fallback and cache it
  const fallbackUrl = '/assets/fallback-logo.svg';
  teamLogoCache.setCached(cacheKey, fallbackUrl, 'final-fallback', true);
  return fallbackUrl;
}

/**
 * Get cached league logo or fetch with intelligent fallback
 */
export async function getCachedLeagueLogo(leagueId: number | string, leagueName?: string, originalUrl?: string): Promise<string> {
  const cacheKey = `league_${leagueId}_${leagueName || 'unknown'}`;

  // Check cache first
  const cached = leagueLogoCache.getCached(cacheKey);
  if (cached) {
    return cached;
  }

  const sources = generateLeagueLogoSources({ leagueId, leagueName, originalUrl });

  for (const source of sources) {
    try {
      // For local assets, return immediately
      if (source.url.startsWith('/assets/')) {
        leagueLogoCache.setCached(cacheKey, source.url, source.source, true);
        return source.url;
      }

      // For external URLs, do a quick validation
      const isValid = await validateLogoUrl(source.url);
      if (isValid) {
        leagueLogoCache.setCached(cacheKey, source.url, source.source, true);
        console.log(`✅ [getCachedLeagueLogo] Successfully cached league ${leagueId} from ${source.source}: ${source.url}`);
        return source.url;
      }
    } catch (error) {
      console.warn(`❌ [getCachedLeagueLogo] Failed to load league ${leagueId} from ${source.source}:`, error);
      continue;
    }
  }

  // If all sources fail, return fallback and cache it
  const fallbackUrl = '/assets/fallback-logo.svg';
  leagueLogoCache.setCached(cacheKey, fallbackUrl, 'final-fallback', true);
  console.warn(`🚫 [getCachedLeagueLogo] All sources failed for league ${leagueId}, using fallback`);
  return fallbackUrl;
}

/**
 * Test if an image URL is valid and accessible
 */
export function testImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timeout = setTimeout(() => {
      resolve(false);
    }, 5000); // 5 second timeout

    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };

    img.src = url;
  });
}

/**
 * Find the first working logo URL from sources
 */
export async function findWorkingLogoUrl(options: TeamLogoOptions): Promise<string> {
  const sources = generateLogoSources(options);

  for (const source of sources) {
    const isWorking = await testImageUrl(source.url);
    if (isWorking) {
      console.log(`Logo loaded from ${source.source}: ${source.url}`);
      return source.url;
    }
  }

  // If all fail, return the final fallback
  return '/assets/fallback-logo.svg';
}

/**
 * Get progressive logo loading state (non-React version)
 */
export async function getProgressiveLogoState(options: TeamLogoOptions) {
  const sources = generateLogoSources(options);
  const failedSources: string[] = [];

  for (const source of sources) {
    const isWorking = await testImageUrl(source.url);
    if (isWorking) {
      return { currentUrl: source.url, isLoading: false, failedSources };
    } else {
      failedSources.push(source.url);
    }
  }

  return { 
    currentUrl: '/assets/fallback-logo.svg', 
    isLoading: false, 
    failedSources 
  };
}

/**
 * Simple fallback handler for onError events
 */
export function createFallbackHandler(options: TeamLogoOptions) {
  const sources = generateLogoSources(options);
  let currentIndex = 0;

  return function handleImageError(event: any) {
    const img = event.currentTarget;
    currentIndex++;

    if (currentIndex < sources.length) {
      const nextSource = sources[currentIndex];
      console.log(`Trying next source: ${nextSource.source}`);
      img.src = nextSource.url;
    } else {
      console.log('All sources failed, using final fallback');
      img.src = '/assets/fallback-logo.svg';
    }
  };
}

/**
 * Enhanced image component with built-in fallback logic
 */
export interface EnhancedImageProps {
  teamId?: number | string;
  teamName?: string;
  fallbackOptions?: TeamLogoOptions;
  src?: string;
  onError?: (event: any) => void;
  [key: string]: any;
}