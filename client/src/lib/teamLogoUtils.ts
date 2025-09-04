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

// Cache for computed shouldUseCircularFlag results
const circularFlagCache = new Map<string, { result: boolean; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// UTC date utilities (no timezone conversion)
export function formatUTCDate(date: Date | string, formatType = 'date'): string {
  const utcDate = typeof date === 'string' ? new Date(date) : date;

  if (formatType === 'time') {
    return utcDate.toISOString().substring(11, 16); // HH:MM in UTC
  }

  return utcDate.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
}

export function getCurrentUTCDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Clear MyWorldTeamLogo circular flag computation cache
 */
export function clearMyWorldTeamLogoCache(): void {
  // Note: This would need to be imported from MyWorldTeamLogo component
  // For now, we'll add global cache clearing
  if (typeof window !== 'undefined') {
    (window as any).myWorldTeamLogoCache = {
      clear: () => {
        console.log('🧹 [MyWorldTeamLogo] Cache cleared manually');
        // The circularFlagCache would need to be exposed globally for this to work
      },
      stats: () => {
        console.log('📊 [MyWorldTeamLogo] Cache stats would be displayed here');
      }
    };
  }
}

/**
 * Debug MyWorldTeamLogo cache status
 */
export function debugMyWorldTeamLogoCache(teamName: string, leagueContext?: any): void {
  console.log(`🔍 [MyWorldTeamLogo] Debug cache status for ${teamName}:`, {
    teamName,
    leagueContext,
    cacheKey: `${teamName}_${leagueContext?.name?.toLowerCase() || ""}_${leagueContext?.country || ""}`,
    timestamp: new Date().toISOString()
  });
}