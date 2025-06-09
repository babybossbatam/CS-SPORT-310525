
import { apiRequest } from './queryClient';
import { logApiCall, logCacheOperation } from './centralizedDebugCache';

export interface ApiWrapperOptions {
  componentName: string;
  cacheKey?: string;
  enableDebug?: boolean;
}

export class EnhancedApiWrapper {
  private cache: Map<string, { data: any; timestamp: number; expires: number }> = new Map();
  private readonly defaultCacheDuration = 5 * 60 * 1000; // 5 minutes

  async fetchWithDebug<T>(
    endpoint: string,
    options: ApiWrapperOptions,
    cacheDuration: number = this.defaultCacheDuration
  ): Promise<T> {
    const { componentName, cacheKey, enableDebug = true } = options;
    const startTime = Date.now();
    const fullCacheKey = cacheKey || `${componentName}-${endpoint}`;

    try {
      // Check cache first
      const cached = this.cache.get(fullCacheKey);
      const now = Date.now();

      if (cached && now < cached.expires) {
        const responseTime = Date.now() - startTime;
        
        if (enableDebug) {
          logApiCall(componentName, {
            endpoint,
            method: 'GET',
            responseTime,
            status: 'cached',
            cacheKey: fullCacheKey,
            dataSize: JSON.stringify(cached.data).length
          });
          
          logCacheOperation(componentName, 'hit', fullCacheKey, JSON.stringify(cached.data).length);
        }

        return cached.data;
      }

      // Cache miss - make API call
      if (enableDebug && cached) {
        logCacheOperation(componentName, 'miss', fullCacheKey);
      }

      const response = await apiRequest('GET', endpoint);
      const data = await response.json();
      const responseTime = Date.now() - startTime;

      // Cache the response
      this.cache.set(fullCacheKey, {
        data,
        timestamp: now,
        expires: now + cacheDuration
      });

      if (enableDebug) {
        logApiCall(componentName, {
          endpoint,
          method: 'GET',
          responseTime,
          status: 'success',
          cacheKey: fullCacheKey,
          dataSize: JSON.stringify(data).length
        });

        logCacheOperation(componentName, 'set', fullCacheKey, JSON.stringify(data).length);
      }

      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (enableDebug) {
        logApiCall(componentName, {
          endpoint,
          method: 'GET',
          responseTime,
          status: 'error',
          cacheKey: fullCacheKey,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Try to return cached data even if expired
      const cached = this.cache.get(fullCacheKey);
      if (cached) {
        console.warn(`[${componentName}] API failed, using stale cache for ${endpoint}`);
        return cached.data;
      }

      throw error;
    }
  }

  // Specialized methods for different data types
  async fetchFixtures(componentName: string, date: string, options?: { all?: boolean }): Promise<any[]> {
    const endpoint = `/api/fixtures/date/${date}${options?.all ? '?all=true' : ''}`;
    return this.fetchWithDebug(endpoint, {
      componentName,
      cacheKey: `fixtures-${date}-${options?.all ? 'all' : 'filtered'}`,
    });
  }

  async fetchLiveFixtures(componentName: string): Promise<any[]> {
    return this.fetchWithDebug('/api/fixtures/live', {
      componentName,
      cacheKey: 'live-fixtures',
    }, 30 * 1000); // 30 seconds cache for live data
  }

  async fetchLeagueData(componentName: string, leagueId: number): Promise<any> {
    return this.fetchWithDebug(`/api/leagues/${leagueId}`, {
      componentName,
      cacheKey: `league-${leagueId}`,
    }, 60 * 60 * 1000); // 1 hour cache for league data
  }

  async fetchPopularLeagues(componentName: string): Promise<any[]> {
    return this.fetchWithDebug('/api/leagues/popular', {
      componentName,
      cacheKey: 'popular-leagues',
    }, 30 * 60 * 1000); // 30 minutes cache
  }

  // Clear cache for specific component or all
  clearCache(componentName?: string): void {
    if (componentName) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.startsWith(componentName)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
      console.log(`🧹 [EnhancedApiWrapper] Cleared cache for ${componentName}`);
    } else {
      this.cache.clear();
      console.log('🧹 [EnhancedApiWrapper] Cleared all cache');
    }
  }

  // Get cache stats
  getCacheStats(): {
    totalEntries: number;
    totalSize: number;
    entries: Array<{
      key: string;
      size: number;
      age: number;
      expires: string;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      size: JSON.stringify(value.data).length,
      age: now - value.timestamp,
      expires: new Date(value.expires).toISOString()
    }));

    return {
      totalEntries: this.cache.size,
      totalSize: entries.reduce((sum, entry) => sum + entry.size, 0),
      entries
    };
  }
}

// Global instance
export const enhancedApiWrapper = new EnhancedApiWrapper();

// Global debug access
if (typeof window !== 'undefined') {
  (window as any).apiWrapper = {
    stats: () => enhancedApiWrapper.getCacheStats(),
    clear: (componentName?: string) => enhancedApiWrapper.clearCache(componentName)
  };
}
