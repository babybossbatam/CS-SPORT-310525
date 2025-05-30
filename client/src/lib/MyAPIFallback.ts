
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

/**
 * Generate multiple logo sources for a team
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

  // 3. Sportmonks CDN alternatives
  if (teamId) {
    sources.push(
      {
        url: `https://cdn.sportmonks.com/images/soccer/teams/${teamId}.png`,
        source: 'sportmonks-primary',
        priority: 4
      },
      {
        url: `https://cdn.sportmonks.com/images/soccer/teams/${teamId}/${currentSize.sportmonks}.png`,
        source: 'sportmonks-sized',
        priority: 5
      }
    );
  }

  // 4. Alternative CDN sources
  if (teamId) {
    sources.push({
      url: `https://images.fotmob.com/image_resources/logo/teamlogo/${teamId}.png`,
      source: 'fotmob',
      priority: 6
    });
  }

  // 5. Generic fallback based on team name
  if (teamName) {
    const encodedName = encodeURIComponent(teamName.toLowerCase().replace(/\s+/g, '-'));
    sources.push({
      url: `https://via.placeholder.com/128x128/333333/ffffff?text=${encodedName.substring(0, 2).toUpperCase()}`,
      source: 'placeholder-named',
      priority: 7
    });
  }

  // 6. Final fallback
  sources.push({
    url: '/assets/fallback-logo.svg',
    source: 'local-fallback',
    priority: 8
  });

  return sources.sort((a, b) => a.priority - b.priority);
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
