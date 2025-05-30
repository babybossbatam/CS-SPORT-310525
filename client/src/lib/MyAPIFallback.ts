
/**
 * MyAPIFallback - Centralized API fallback utility for team logos and images
 * Provides robust fallback mechanisms for multiple image sources
 */

export interface FallbackSource {
  url: string;
  description: string;
  priority: number;
}

export interface TeamLogoFallbackOptions {
  teamId?: string | number;
  teamName?: string;
  originalUrl?: string;
  enableSportmonks?: boolean;
  enableAlternativeAPI?: boolean;
  finalFallback?: string;
}

/**
 * Generate multiple fallback URLs for team logos
 */
export const generateTeamLogoFallbacks = (options: TeamLogoFallbackOptions): FallbackSource[] => {
  const {
    teamId,
    teamName,
    originalUrl,
    enableSportmonks = true,
    enableAlternativeAPI = true,
    finalFallback = '/assets/fallback-logo.svg'
  } = options;

  const fallbacks: FallbackSource[] = [];

  // Primary source (original URL from API)
  if (originalUrl && originalUrl.trim() !== '') {
    fallbacks.push({
      url: originalUrl,
      description: 'Original API source',
      priority: 1
    });
  }

  // Sportmonks CDN fallback
  if (enableSportmonks && teamId) {
    fallbacks.push({
      url: `https://cdn.sportmonks.com/images/soccer/teams/${teamId}.png`,
      description: 'Sportmonks CDN',
      priority: 2
    });
  }

  // Alternative API-Sports URL
  if (enableAlternativeAPI && teamId) {
    fallbacks.push({
      url: `https://media.api-sports.io/football/teams/${teamId}.png`,
      description: 'Alternative API-Sports URL',
      priority: 3
    });
  }

  // Logo.football API (if team name is available)
  if (teamName) {
    const cleanTeamName = teamName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    fallbacks.push({
      url: `https://logos.football/${cleanTeamName}.png`,
      description: 'Logo.football API',
      priority: 4
    });
  }

  // Final fallback (local asset)
  fallbacks.push({
    url: finalFallback,
    description: 'Local fallback image',
    priority: 5
  });

  return fallbacks.sort((a, b) => a.priority - b.priority);
};

/**
 * Handle image error with progressive fallback
 */
export const handleImageErrorWithFallback = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  options: TeamLogoFallbackOptions
) => {
  const target = event.currentTarget;
  
  // Prevent infinite loops
  if (target.dataset.errorHandled === 'true') {
    return;
  }

  const currentUrl = target.src;
  const fallbacks = generateTeamLogoFallbacks(options);
  
  // Find current fallback index
  const currentIndex = fallbacks.findIndex(fallback => 
    currentUrl.includes(fallback.url) || fallback.url.includes(currentUrl.split('/').pop() || '')
  );

  // Try next fallback
  const nextIndex = currentIndex + 1;
  if (nextIndex < fallbacks.length) {
    target.src = fallbacks[nextIndex].url;
    console.log(`Trying fallback ${nextIndex + 1}/${fallbacks.length}: ${fallbacks[nextIndex].description}`);
    
    // Allow one more try for non-final fallbacks
    if (nextIndex < fallbacks.length - 1) {
      target.dataset.errorHandled = 'false';
    } else {
      target.dataset.errorHandled = 'true';
    }
  } else {
    // All fallbacks exhausted
    target.dataset.errorHandled = 'true';
    console.warn('All image fallbacks exhausted for:', options);
  }
};

/**
 * Preload and validate image URL
 */
export const validateImageUrl = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

/**
 * Get the best available image URL by testing all fallbacks
 */
export const getBestImageUrl = async (options: TeamLogoFallbackOptions): Promise<string> => {
  const fallbacks = generateTeamLogoFallbacks(options);
  
  for (const fallback of fallbacks) {
    const isValid = await validateImageUrl(fallback.url);
    if (isValid) {
      console.log(`Best image URL found: ${fallback.description} - ${fallback.url}`);
      return fallback.url;
    }
  }
  
  // Return final fallback if all others fail
  return fallbacks[fallbacks.length - 1].url;
};

/**
 * React hook for team logo with fallback
 */
export const useTeamLogoWithFallback = (options: TeamLogoFallbackOptions) => {
  const [currentUrl, setCurrentUrl] = React.useState<string>(
    options.originalUrl || '/assets/fallback-logo.svg'
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadBestUrl = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const bestUrl = await getBestImageUrl(options);
        setCurrentUrl(bestUrl);
      } catch (err) {
        setError('Failed to load team logo');
        setCurrentUrl('/assets/fallback-logo.svg');
      } finally {
        setIsLoading(false);
      }
    };

    loadBestUrl();
  }, [options.teamId, options.originalUrl]);

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    handleImageErrorWithFallback(event, options);
  };

  return {
    src: currentUrl,
    isLoading,
    error,
    onError: handleError
  };
};

/**
 * League logo fallback generator
 */
export const generateLeagueLogoFallbacks = (leagueId?: number, leagueName?: string, originalUrl?: string): FallbackSource[] => {
  const fallbacks: FallbackSource[] = [];

  // Original URL
  if (originalUrl && originalUrl.trim() !== '') {
    fallbacks.push({
      url: originalUrl,
      description: 'Original league logo',
      priority: 1
    });
  }

  // Alternative API-Sports league logo
  if (leagueId) {
    fallbacks.push({
      url: `https://media.api-sports.io/football/leagues/${leagueId}.png`,
      description: 'Alternative API-Sports league logo',
      priority: 2
    });
  }

  // Generic football league icon
  fallbacks.push({
    url: '/assets/fallback-logo.svg',
    description: 'Generic league icon',
    priority: 3
  });

  return fallbacks.sort((a, b) => a.priority - b.priority);
};

/**
 * Country flag fallback generator
 */
export const generateCountryFlagFallbacks = (countryName?: string, countryCode?: string): FallbackSource[] => {
  const fallbacks: FallbackSource[] = [];

  // FlagsAPI
  if (countryCode) {
    fallbacks.push({
      url: `https://flagsapi.com/${countryCode}/flat/24.png`,
      description: 'FlagsAPI',
      priority: 1
    });
  }

  // Alternative flag source
  if (countryName && countryName.toLowerCase() !== 'unknown') {
    const cleanCountryName = countryName.toLowerCase().replace(/\s+/g, '_');
    fallbacks.push({
      url: `https://api.sportradar.com/flags-images-t3/sr/country-flags/flags/${cleanCountryName}/flag_24x24.png`,
      description: 'SportRadar flags',
      priority: 2
    });
  }

  // Generic flag fallback
  fallbacks.push({
    url: '/assets/fallback-logo.svg',
    description: 'Generic flag icon',
    priority: 3
  });

  return fallbacks.sort((a, b) => a.priority - b.priority);
};

export default {
  generateTeamLogoFallbacks,
  handleImageErrorWithFallback,
  validateImageUrl,
  getBestImageUrl,
  useTeamLogoWithFallback,
  generateLeagueLogoFallbacks,
  generateCountryFlagFallbacks
};
