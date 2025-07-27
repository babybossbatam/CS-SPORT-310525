
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
      // Check cache first, but skip if it's a fallback that's less than 30 minutes old
      const cached = this.logoCache.get(cacheKey);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < this.cacheDuration) {
        // If cached result is fallback and less than 30 minutes old, try fresh fetch
        if (cached.fallbackUsed && (now - cached.timestamp) < (30 * 60 * 1000)) {
          console.log(`🔄 [EnhancedLogoManager] Retrying fresh fetch for league ${request.leagueId} (cached fallback)`);
        } else {
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
      }

      // Enhanced logo sources with API-Sports only
      const logoSources = [
        // Primary API endpoint
        `/api/league-logo/square/${request.leagueId}`,
        // Direct API-Sports URL (as backup)
        `https://media.api-sports.io/football/leagues/${request.leagueId}.png`
      ];

      let logoUrl: string | null = null;
      let fallbackUsed = false;
      let successfulSource = '';

      // For well-known leagues, prioritize our API endpoint
      const wellKnownLeagues = [39, 140, 135, 78, 61, 2, 3, 848, 15, 1, 4, 5];
      if (wellKnownLeagues.includes(request.leagueId)) {
        logoUrl = `/api/league-logo/square/${request.leagueId}`;
        successfulSource = 'well-known-api';
      } else {
        // Try each source in order
        for (let i = 0; i < logoSources.length; i++) {
          const source = logoSources[i];
          try {
            // For internal API endpoints, assume they work (avoid HEAD requests that might fail)
            if (source.startsWith('/api/')) {
              logoUrl = source;
              successfulSource = `api-source-${i}`;
              console.log(`🎯 [EnhancedLogoManager] Using API source for league ${request.leagueId}: ${source}`);
              break;
            } else {
              // For external URLs, test them first
              const testResponse = await fetch(source, { 
                method: 'HEAD',
                timeout: 3000 // 3 second timeout
              });
              if (testResponse.ok) {
                logoUrl = source;
                successfulSource = `external-source-${i}`;
                console.log(`✅ [EnhancedLogoManager] League ${request.leagueId} working external source: ${source}`);
                break;
              }
            }
          } catch (error) {
            console.warn(`❌ [EnhancedLogoManager] League ${request.leagueId} source failed: ${source}`, error);
            continue;
          }
        }
      }

      // If no source worked, use fallback
      if (!logoUrl) {
        fallbackUsed = true;
        logoUrl = request.fallbackUrl || '/assets/fallback-logo.svg';
        successfulSource = 'fallback';
        console.warn(`🚫 [EnhancedLogoManager] All sources failed for league ${request.leagueId}, using fallback`);
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
        loadTime,
        source: successfulSource
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

      console.error(`❌ [EnhancedLogoManager] League ${request.leagueId} logo fetch failed:`, error);

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

  // Clear league-specific cache
  clearLeagueCache(leagueId?: number): void {
    if (leagueId) {
      const cacheKey = `league-${leagueId}`;
      this.logoCache.delete(cacheKey);
      console.log(`🧹 [EnhancedLogoManager] Cleared cache for league ${leagueId}`);
    } else {
      // Clear all league caches
      const leagueKeys = Array.from(this.logoCache.keys()).filter(key => key.startsWith('league-'));
      leagueKeys.forEach(key => this.logoCache.delete(key));
      console.log(`🧹 [EnhancedLogoManager] Cleared all league logo cache (${leagueKeys.length} entries)`);
    }
  }

  // Force refresh league logo
  async forceRefreshLeagueLogo(leagueId: number, componentName: string = 'ForceRefresh'): Promise<LogoResponse> {
    this.clearLeagueCache(leagueId);
    return await this.getLeagueLogo(componentName, {
      type: 'league',
      shape: 'normal',
      leagueId: leagueId
    });
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
    clear: (componentName?: string) => enhancedLogoManager.clearCache(componentName),
    clearLeague: (leagueId?: number) => enhancedLogoManager.clearLeagueCache(leagueId),
    forceRefresh: (leagueId: number) => enhancedLogoManager.forceRefreshLeagueLogo(leagueId),
    testLeague: async (leagueId: number) => {
      const result = await enhancedLogoManager.getLeagueLogo('Test', {
        type: 'league',
        shape: 'normal',
        leagueId: leagueId
      });
      console.log(`🧪 League ${leagueId} test result:`, result);
      return result;
    },
    testAllSources: async (leagueId: number) => {
      const sources = [
        `/api/league-logo/square/${leagueId}`,
        `https://media.api-sports.io/football/leagues/${leagueId}.png`
      ];
      
      console.log(`🧪 Testing all sources for league ${leagueId}:`);
      const results = [];
      
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        try {
          const response = await fetch(source, { method: 'HEAD' });
          const status = response.ok ? '✅ WORKING' : `❌ FAILED (${response.status})`;
          console.log(`  ${i + 1}. ${status} - ${source}`);
          results.push({ source, working: response.ok, status: response.status });
        } catch (error) {
          console.log(`  ${i + 1}. 🚫 ERROR - ${source}`, error);
          results.push({ source, working: false, error: error.message });
        }
      }
      
      return results;
    }
  };
}
