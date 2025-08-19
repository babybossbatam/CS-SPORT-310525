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
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours - reduced for better data freshness

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
 * Get the best team logo URL with proper fallbacks
 */
export function getBestTeamLogoUrl(teamId: number | string, teamName: string, size: number = 32): string {
  const teamNameLower = teamName.toLowerCase();
  
  // Special handling for problematic teams
  if (teamNameLower.includes("al-nassr") || teamNameLower.includes("al nassr")) {
    // Use direct API Sports URL for Al-Nassr
    return `https://media.api-sports.io/football/teams/2939.png`;
  }
  
  if (teamNameLower.includes("al-ittihad") || teamNameLower.includes("al ittihad")) {
    // Use direct API Sports URL for Al-Ittihad
    return `https://media.api-sports.io/football/teams/2940.png`;
  }
  
  // Primary: Use our API endpoint for better reliability
  if (teamId && teamId !== 'fallback') {
    return `/api/team-logo/square/${teamId}?size=${size}`;
  }
  
  // Secondary: Use API Sports logo if teamId is available
  if (teamId && teamId !== 'fallback') {
    return `https://media.api-sports.io/football/teams/${teamId}.png`;
  }
  
  // Fallback: Use default logo
  return "/assets/fallback.png";
}

/**
 * Create team logo error handler with proper fallback chain
 */
export function createTeamLogoErrorHandler(teamId: number | string, teamName: string) {
  return (e: any) => {
    const target = e.target as HTMLImageElement;
    const currentSrc = target.src;
    
    console.log(`🚫 [TeamLogo Error] Failed to load: ${currentSrc} for ${teamName}`);
    
    // Try fallback URLs in order
    if (currentSrc.includes('api-sports.io') && teamId && teamId !== 'fallback') {
      console.log(`🔄 [TeamLogo] Trying API endpoint for ${teamName}`);
      target.src = `/api/team-logo/square/${teamId}?size=32`;
    } else if (currentSrc.includes('/api/team-logo/') && !currentSrc.includes('fallback')) {
      console.log(`🔄 [TeamLogo] Trying fallback logo for ${teamName}`);
      target.src = "/assets/fallback.png";
    }
    // If already on fallback, don't change anymore to prevent infinite loop
  };
}

/**
 * Debug team logo loading issues
 */
export function debugTeamLogoIssues(teamId: number | string, teamName: string): void {
  console.log(`🔍 [TeamLogo Debug] Analyzing logo issues for ${teamName} (ID: ${teamId})`);
  
  const possibleUrls = [
    `https://media.api-sports.io/football/teams/${teamId}.png`,
    `/api/team-logo/square/${teamId}?size=32`,
    `/api/team-logo/circular/${teamId}?size=32`,
    `/assets/fallback-logo.svg`
  ];
  
  possibleUrls.forEach((url, index) => {
    const img = new Image();
    img.onload = () => {
      console.log(`✅ [TeamLogo Debug] URL ${index + 1} works: ${url}`);
    };
    img.onerror = () => {
      console.log(`❌ [TeamLogo Debug] URL ${index + 1} failed: ${url}`);
    };
    img.src = url;
  });
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