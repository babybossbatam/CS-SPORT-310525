
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

import { teamLogoCache, getTeamLogoCacheKey, validateLogoUrl } from './logoCache';

/**
 * Generate multiple logo sources for a team with caching support
 */
export function generateLogoSources(options: TeamLogoOptions): LogoSource[] {
  const { teamId, teamName, originalUrl, size = 'medium' } = options;
  const sources: LogoSource[] = [];

  // Size mapping for different APIs
  const sizeMap = {
    small: { apisports: '64', sportmonks: '64' },
    medium: { apisports: '128', sportmonks: '128' },
    large: { apisports: '256', sportmonks: '256' }
  };

  const currentSize = sizeMap[size];

  // 1. Original API-Sports logo (highest priority)
  if (originalUrl && originalUrl.trim() !== '') {
    sources.push({
      url: originalUrl,
      source: 'api-sports-original',
      priority: 1
    });
  }

  // 2. Alternative API-Sports endpoints
  if (teamId) {
    sources.push(
      {
        url: `https://media.api-sports.io/football/teams/${teamId}.png`,
        source: 'api-sports-direct',
        priority: 2
      },
      {
        url: `https://media.api-sports.io/football/teams/${teamId}/${currentSize.apisports}.png`,
        source: 'api-sports-sized',
        priority: 3
      }
    );
  }

  // 3. Removed 365scores CDN fallback

  // 4. SportsRadar fallback (server-side, no CORS)
  if (teamId) {
    sources.push({
      url: `/api/sportsradar/teams/${teamId}/logo`,
      source: 'sportsradar-server',
      priority: 5
    });
  }

  // 5. Generic team logo fallback
  sources.push({
    url: '/assets/fallback-logo.svg',
    source: 'fallback',
    priority: 6
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
    console.log(`Team logo cache hit for ${teamName || teamId}: ${cached}`);
    return cached;
  }

  console.log(`Team logo cache miss for ${teamName || teamId}, fetching...`);
  
  const sources = generateLogoSources({ teamId, teamName, originalUrl });
  
  for (const source of sources) {
    try {
      console.log(`Trying team logo source: ${source.source} - ${source.url}`);
      
      // For local assets, return immediately
      if (source.url.startsWith('/assets/')) {
        teamLogoCache.setCached(cacheKey, source.url, source.source, true);
        return source.url;
      }
      
      // For external URLs, validate before caching
      const isValid = await validateLogoUrl(source.url);
      if (isValid) {
        console.log(`✅ Valid team logo found for ${teamName || teamId}: ${source.url}`);
        teamLogoCache.setCached(cacheKey, source.url, source.source, true);
        return source.url;
      } else {
        console.warn(`❌ Invalid team logo for ${teamName || teamId}: ${source.url}`);
      }
    } catch (error) {
      console.warn(`Team logo validation error for ${teamName || teamId}:`, error);
      continue;
    }
  }

  // If all sources fail, return fallback and cache it
  const fallbackUrl = '/assets/fallback-logo.svg';
  teamLogoCache.setCached(cacheKey, fallbackUrl, 'final-fallback', true);
  console.warn(`All team logo sources failed for ${teamName || teamId}, using fallback`);
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
