
import { logLogo } from './centralizedDebugCache';
import { getCachedTeamLogo } from './MyAPIFallback';
import { getCountryFlagWithFallbackSync } from './flagUtils';
import { isNationalTeam } from './teamLogoSources';

export interface LogoRequest {
  type: 'team' | 'flag' | 'league';
  shape: 'circular' | 'normal';
  teamId?: number;
  country?: string;
  leagueId?: number;
  teamName?: string;
  leagueName?: string;
  fallbackUrl?: string;
}

export interface LogoResponse {
  url: string;
  fallbackUsed: boolean;
  loadTime: number;
  cached: boolean;
}

class EnhancedLogoManager {
  private logoCache: Map<string, { url: string; timestamp: number; fallbackUsed: boolean }> = new Map();
  private readonly cacheDuration = 24 * 60 * 60 * 1000; // 24 hours

  async getTeamLogo(
    componentName: string,
    request: LogoRequest & { teamId: number; teamName?: string; shape: 'circular' | 'normal'; sport?: string }
  ): Promise<LogoResponse> {
    const startTime = Date.now();
    const sport = request.sport || 'football';
    const cacheKey = `team-${sport}-${request.teamId}-${request.shape}`;

    try {
      // Check cache first
      const cached = this.logoCache.get(cacheKey);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < this.cacheDuration) {
        const loadTime = Date.now() - startTime;
        
        logLogo(componentName, {
          type: 'team',
          shape: request.shape,
          teamId: request.teamId,
          url: cached.url,
          fallbackUsed: cached.fallbackUsed,
          loadTime
        });

        return {
          url: cached.url,
          fallbackUsed: cached.fallbackUsed,
          loadTime,
          cached: true
        };
      }

      // Get logo URL
      let logoUrl: string;
      let fallbackUsed = false;

      if (request.shape === 'circular') {
        // For circular logos, check if it's a national team first
        const isNational = request.teamName ? isNationalTeam(
          { id: request.teamId, name: request.teamName },
          null
        ) : false;

        if (isNational) {
          logoUrl = `/api/team-logo/circular/${request.teamId}?size=32&sport=${sport}`;
        } else {
          logoUrl = `/api/team-logo/square/${request.teamId}?size=32&sport=${sport}`;
        }
      } else {
        // Normal team logo with sport parameter
        logoUrl = getCachedTeamLogo(request.teamId, sport) || `/api/team-logo/square/${request.teamId}?size=64&sport=${sport}`;
      }

      if (!logoUrl || logoUrl.includes('fallback')) {
        logoUrl = request.fallbackUrl || '/assets/fallback-logo.svg';
        fallbackUsed = true;
      }

      // Cache the result
      this.logoCache.set(cacheKey, {
        url: logoUrl,
        timestamp: now,
        fallbackUsed
      });

      const loadTime = Date.now() - startTime;

      logLogo(componentName, {
        type: 'team',
        shape: request.shape,
        teamId: request.teamId,
        url: logoUrl,
        fallbackUsed,
        loadTime
      });

      return {
        url: logoUrl,
        fallbackUsed,
        loadTime,
        cached: false
      };
    } catch (error) {
      const loadTime = Date.now() - startTime;
      const fallbackUrl = request.fallbackUrl || '/assets/fallback-logo.svg';

      logLogo(componentName, {
        type: 'team',
        shape: request.shape,
        teamId: request.teamId,
        url: fallbackUrl,
        fallbackUsed: true,
        loadTime
      });

      return {
        url: fallbackUrl,
        fallbackUsed: true,
        loadTime,
        cached: false
      };
    }
  }

  async getCountryFlag(
    componentName: string,
    request: LogoRequest & { country: string; shape: 'circular' | 'normal' }
  ): Promise<LogoResponse> {
    const startTime = Date.now();
    const cacheKey = `flag-${request.country}-${request.shape}`;

    try {
      // Check cache first
      const cached = this.logoCache.get(cacheKey);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < this.cacheDuration) {
        const loadTime = Date.now() - startTime;
        
        logLogo(componentName, {
          type: 'flag',
          shape: request.shape,
          country: request.country,
          url: cached.url,
          fallbackUsed: cached.fallbackUsed,
          loadTime
        });

        return {
          url: cached.url,
          fallbackUsed: cached.fallbackUsed,
          loadTime,
          cached: true
        };
      }

      // Get flag URL
      let flagUrl: string;
      let fallbackUsed = false;

      if (request.shape === 'circular') {
        // For circular flags, use circle-flags
        if (request.country === 'World') {
          flagUrl = 'https://hatscripts.github.io/circle-flags/flags/un.svg';
        } else if (request.country === 'Europe') {
          flagUrl = 'https://hatscripts.github.io/circle-flags/flags/eu.svg';
        } else {
          // Get country code mapping and use circle flags
          flagUrl = getCountryFlagWithFallbackSync(request.country);
          if (flagUrl.includes('circle-flags')) {
            // Already circular
          } else {
            // Convert to circular if possible
            const countryCode = this.getCountryCode(request.country);
            if (countryCode) {
              flagUrl = `https://hatscripts.github.io/circle-flags/flags/${countryCode.toLowerCase()}.svg`;
            } else {
              fallbackUsed = true;
            }
          }
        }
      } else {
        // Normal flag
        flagUrl = getCountryFlagWithFallbackSync(request.country);
      }

      if (!flagUrl || flagUrl.includes('fallback')) {
        flagUrl = request.fallbackUrl || '/assets/fallback-logo.svg';
        fallbackUsed = true;
      }

      // Cache the result
      this.logoCache.set(cacheKey, {
        url: flagUrl,
        timestamp: now,
        fallbackUsed
      });

      const loadTime = Date.now() - startTime;

      logLogo(componentName, {
        type: 'flag',
        shape: request.shape,
        country: request.country,
        url: flagUrl,
        fallbackUsed,
        loadTime
      });

      return {
        url: flagUrl,
        fallbackUsed,
        loadTime,
        cached: false
      };
    } catch (error) {
      const loadTime = Date.now() - startTime;
      const fallbackUrl = request.fallbackUrl || '/assets/fallback-logo.svg';

      logLogo(componentName, {
        type: 'flag',
        shape: request.shape,
        country: request.country,
        url: fallbackUrl,
        fallbackUsed: true,
        loadTime
      });

      return {
        url: fallbackUrl,
        fallbackUsed: true,
        loadTime,
        cached: false
      };
    }
  }

  async getLeagueLogo(
    componentName: string,
    request: LogoRequest & { leagueId: number; leagueName?: string }
  ): Promise<LogoResponse> {
    const startTime = Date.now();
    const cacheKey = `league-${request.leagueId}`;

    try {
      // Check cache first
      const cached = this.logoCache.get(cacheKey);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < this.cacheDuration) {
        const loadTime = Date.now() - startTime;
        
        logLogo(componentName, {
          type: 'league',
          shape: 'normal',
          leagueId: request.leagueId,
          url: cached.url,
          fallbackUsed: cached.fallbackUsed,
          loadTime
        });

        return {
          url: cached.url,
          fallbackUsed: cached.fallbackUsed,
          loadTime,
          cached: true
        };
      }

      // Get league logo URL
      let logoUrl = `https://media.api-sports.io/football/leagues/${request.leagueId}.png`;
      let fallbackUsed = false;

      // For some well-known leagues, we might have better URLs
      const wellKnownLogos: Record<number, string> = {
        39: 'https://media.api-sports.io/football/leagues/39.png', // Premier League
        140: 'https://media.api-sports.io/football/leagues/140.png', // La Liga
        135: 'https://media.api-sports.io/football/leagues/135.png', // Serie A
        78: 'https://media.api-sports.io/football/leagues/78.png', // Bundesliga
        61: 'https://media.api-sports.io/football/leagues/61.png', // Ligue 1
        2: 'https://media.api-sports.io/football/leagues/2.png', // Champions League
        3: 'https://media.api-sports.io/football/leagues/3.png', // Europa League
        848: 'https://media.api-sports.io/football/leagues/848.png', // UEFA Europa Conference League
      };

      if (wellKnownLogos[request.leagueId]) {
        logoUrl = wellKnownLogos[request.leagueId];
      }

      // Cache the result
      this.logoCache.set(cacheKey, {
        url: logoUrl,
        timestamp: now,
        fallbackUsed
      });

      const loadTime = Date.now() - startTime;

      logLogo(componentName, {
        type: 'league',
        shape: 'normal',
        leagueId: request.leagueId,
        url: logoUrl,
        fallbackUsed,
        loadTime
      });

      return {
        url: logoUrl,
        fallbackUsed,
        loadTime,
        cached: false
      };
    } catch (error) {
      const loadTime = Date.now() - startTime;
      const fallbackUrl = request.fallbackUrl || '/assets/fallback-logo.svg';

      logLogo(componentName, {
        type: 'league',
        shape: 'normal',
        leagueId: request.leagueId,
        url: fallbackUrl,
        fallbackUsed: true,
        loadTime
      });

      return {
        url: fallbackUrl,
        fallbackUsed: true,
        loadTime,
        cached: false
      };
    }
  }

  private getCountryCode(country: string): string | null {
    const countryCodeMap: Record<string, string> = {
      'England': 'gb-eng',
      'Scotland': 'gb-sct',
      'Wales': 'gb-wls',
      'Spain': 'es',
      'Italy': 'it',
      'Germany': 'de',
      'France': 'fr',
      'Brazil': 'br',
      'Argentina': 'ar',
      'Netherlands': 'nl',
      'Portugal': 'pt',
      'Belgium': 'be',
      'Croatia': 'hr',
      'Poland': 'pl',
      'Ukraine': 'ua',
      'Turkey': 'tr',
      'Switzerland': 'ch',
      'Austria': 'at',
      'Denmark': 'dk',
      'Sweden': 'se',
      'Norway': 'no',
      'Finland': 'fi',
      'Russia': 'ru',
      'Czech Republic': 'cz',
      'Slovakia': 'sk',
      'Hungary': 'hu',
      'Romania': 'ro',
      'Bulgaria': 'bg',
      'Greece': 'gr',
      'Serbia': 'rs',
      'Slovenia': 'si',
      'Ireland': 'ie',
      'Iceland': 'is'
    };

    return countryCodeMap[country] || null;
  }

  // Clear cache
  clearCache(componentName?: string): void {
    if (componentName) {
      // Clear cache entries for specific component (not easily filterable here)
      console.log(`🧹 [EnhancedLogoManager] Cache clear requested for ${componentName}`);
    } else {
      this.logoCache.clear();
      console.log('🧹 [EnhancedLogoManager] Cleared all logo cache');
    }
  }

  // Get cache stats
  getCacheStats(): {
    totalEntries: number;
    teamLogos: number;
    flags: number;
    leagues: number;
    fallbackCount: number;
  } {
    const entries = Array.from(this.logoCache.entries());
    
    return {
      totalEntries: entries.length,
      teamLogos: entries.filter(([key]) => key.startsWith('team-')).length,
      flags: entries.filter(([key]) => key.startsWith('flag-')).length,
      leagues: entries.filter(([key]) => key.startsWith('league-')).length,
      fallbackCount: entries.filter(([, value]) => value.fallbackUsed).length
    };
  }
}

// Global instance
export const enhancedLogoManager = new EnhancedLogoManager();

// Global debug access
if (typeof window !== 'undefined') {
  (window as any).logoManager = {
    stats: () => enhancedLogoManager.getCacheStats(),
    clear: (componentName?: string) => enhancedLogoManager.clearCache(componentName)
  };
}
