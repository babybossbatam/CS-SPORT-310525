
export const getTeamLogoClassName = (
  baseSize: string = 'w-6 h-6',
  countryContext?: string,
  leagueName?: string
): string => {
  // Check if this is a country/international competition
  const isCountryTeam = countryContext === 'World' || 
                       countryContext === 'Europe' || 
                       countryContext === 'South America' || 
                       countryContext === 'International' ||
                       leagueName?.toLowerCase().includes('international') ||
                       leagueName?.toLowerCase().includes('friendlies') ||
                       leagueName?.toLowerCase().includes('nations league') ||
                       leagueName?.toLowerCase().includes('world cup') ||
                       leagueName?.toLowerCase().includes('euro') ||
                       leagueName?.toLowerCase().includes('copa america') ||
                       leagueName?.toLowerCase().includes('uefa') ||
                       leagueName?.toLowerCase().includes('conmebol') ||
                       leagueName?.toLowerCase().includes('fifa');

  return `${baseSize} ${isCountryTeam ? 'object-cover country-flag-ball' : 'object-contain'}`;
};

/**
 * Debug team logo caching and loading issues
 */
export function debugTeamLogo(teamId: number | string, teamName: string, logoUrl?: string): void {
  console.log(`🏟️ Team Logo Debug for ${teamName} (ID: ${teamId}):`, {
    logoUrl: logoUrl || 'NO LOGO URL',
    isDataUrl: logoUrl?.startsWith('data:'),
    isHttps: logoUrl?.startsWith('https://'),
    isFallback: logoUrl?.includes('/assets/fallback-logo'),
    urlLength: logoUrl?.length || 0
  });
}

/**
 * Check team logo cache status
 */
export function checkTeamLogoCache(teamId: number | string, teamName: string): void {
  // Import the cache and check status
  import('./logoCache').then(({ teamLogoCache }) => {
    const cacheKey = `team_${teamId}_${teamName}`;
    const cached = teamLogoCache.getCached(cacheKey);
    
    if (cached) {
      const age = Math.round((Date.now() - cached.timestamp) / 1000 / 60);
      console.log(`🔍 Team Logo Cache status for ${teamName}:`, {
        key: cacheKey,
        url: cached.url,
        source: cached.source,
        age: `${age} minutes`,
        verified: cached.verified,
        isFallback: cached.url.includes('/assets/fallback-logo')
      });
    } else {
      console.log(`❌ No team logo cache found for ${teamName} with key: ${cacheKey}`);
    }
  });
}

/**
 * Log team logo error and provide fallback suggestions
 */
export function logTeamLogoError(teamName: string, logoUrl: string, error: any): void {
  console.error(`🚫 Team logo failed to load for ${teamName}:`, {
    originalUrl: logoUrl,
    error: error?.message || 'Unknown error',
    suggestions: [
      'Check if URL is accessible',
      'Verify CORS policy',
      'Check if URL returns valid image',
      'Consider using fallback logo'
    ]
  });
}

/**
 * Get team logo cache statistics for debugging
 */
export function getTeamLogoCacheStats(): void {
  import('./logoCache').then(({ teamLogoCache }) => {
    const stats = teamLogoCache.getStats();
    console.log('🏟️ Team Logo Cache Stats:', stats);
  });
}
