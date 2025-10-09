
/**
 * Optimized API Service with unified caching and smart batching
 */

import { unifiedCache, getFromCache, setInCache, hasCached } from './unifiedCacheManager';

interface ApiRequestOptions {
  skipCache?: boolean;
  priority?: 'high' | 'normal' | 'low';
  timeout?: number;
}

class OptimizedApiService {
  private requestQueue = new Map<string, Promise<any>>();
  private batchTimer: NodeJS.Timeout | null = null;
  private pendingBatch: string[] = [];

  /**
   * Smart API request with caching and deduplication
   */
  async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const cacheKey = this.generateCacheKey(endpoint);
    const dataType = this.getDataType(endpoint);

    // Check cache first unless skipCache is true
    if (!options.skipCache) {
      const cached = await getFromCache<T>(cacheKey, dataType);
      if (cached !== null) {
        return cached;
      }
    }

    // Check if request is already in flight
    if (this.requestQueue.has(endpoint)) {
      console.log(`⏳ [OptimizedAPI] Request in flight for: ${endpoint}`);
      return this.requestQueue.get(endpoint);
    }

    // Create new request
    const requestPromise = this.makeRequest<T>(endpoint, options);
    this.requestQueue.set(endpoint, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache the result
      await setInCache(cacheKey, result, dataType);
      
      return result;
    } finally {
      this.requestQueue.delete(endpoint);
    }
  }

  /**
   * Batch multiple requests for efficiency
   */
  async batchRequest<T>(endpoints: string[], options: ApiRequestOptions = {}): Promise<T[]> {
    console.log(`📦 [OptimizedAPI] Batch request for ${endpoints.length} endpoints`);
    
    const results: (T | null)[] = [];
    const uncachedEndpoints: string[] = [];
    const endpointIndexMap = new Map<string, number>();

    // Check cache for all endpoints
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      const cacheKey = this.generateCacheKey(endpoint);
      const dataType = this.getDataType(endpoint);
      
      if (!options.skipCache) {
        const cached = await getFromCache<T>(cacheKey, dataType);
        if (cached !== null) {
          results[i] = cached;
          continue;
        }
      }
      
      results[i] = null;
      uncachedEndpoints.push(endpoint);
      endpointIndexMap.set(endpoint, i);
    }

    // Fetch uncached data
    if (uncachedEndpoints.length > 0) {
      const fetchPromises = uncachedEndpoints.map(endpoint => 
        this.request<T>(endpoint, { ...options, skipCache: true })
      );
      
      const fetchResults = await Promise.allSettled(fetchPromises);
      
      for (let i = 0; i < uncachedEndpoints.length; i++) {
        const endpoint = uncachedEndpoints[i];
        const originalIndex = endpointIndexMap.get(endpoint)!;
        const result = fetchResults[i];
        
        if (result.status === 'fulfilled') {
          results[originalIndex] = result.value;
        } else {
          console.error(`Failed to fetch ${endpoint}:`, result.reason);
          results[originalIndex] = null;
        }
      }
    }

    return results.filter((result): result is T => result !== null);
  }

  /**
   * Preload critical data for faster page loads
   */
  async preloadCriticalData(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const criticalEndpoints = [
      `/api/fixtures/live`,
      `/api/fixtures/date/${today}?all=true`,
      `/api/featured-match/live?skipFilter=true`,
      `/api/leagues/popular`
    ];

    console.log(`🚀 [OptimizedAPI] Preloading critical data`);
    
    // Use low priority to not block user interactions
    const promises = criticalEndpoints.map(endpoint => 
      this.request(endpoint, { priority: 'low' }).catch(err => {
        console.warn(`Failed to preload ${endpoint}:`, err);
        return null;
      })
    );

    await Promise.allSettled(promises);
  }

  /**
   * Smart refresh for live data
   */
  async refreshLiveData(): Promise<void> {
    const liveEndpoints = [
      `/api/fixtures/live`,
      `/api/featured-match/live?skipFilter=true`
    ];

    console.log(`🔄 [OptimizedAPI] Refreshing live data`);
    
    const promises = liveEndpoints.map(endpoint => 
      this.request(endpoint, { skipCache: true, priority: 'high' })
    );

    await Promise.allSettled(promises);
  }

  private async makeRequest<T>(endpoint: string, options: ApiRequestOptions): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || 10000);

    try {
      console.log(`🌐 [OptimizedAPI] Making request to: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ [OptimizedAPI] Request completed: ${endpoint}`);
      
      return data;
    } catch (error) {
      console.error(`❌ [OptimizedAPI] Request failed: ${endpoint}`, error);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private generateCacheKey(endpoint: string): string {
    // Clean up endpoint for consistent caching
    return endpoint.replace(/^\/api\//, '').replace(/\?.*$/, '');
  }

  private getDataType(endpoint: string): 'live' | 'fixtures' | 'standings' | 'static' {
    if (endpoint.includes('live')) return 'live';
    if (endpoint.includes('fixtures') || endpoint.includes('featured-match')) return 'fixtures';
    if (endpoint.includes('standings')) return 'standings';
    return 'static';
  }

  getCacheStats() {
    return unifiedCache.getStats();
  }

  clearCache() {
    unifiedCache.clear();
  }
}

export const apiService = new OptimizedApiService();

// Helper functions for common patterns
export const fetchTodayFixtures = () => {
  const today = new Date().toISOString().split('T')[0];
  return apiService.request(`/api/fixtures/date/${today}?all=true`);
};

export const fetchLiveFixtures = () => {
  return apiService.request(`/api/fixtures/live`, { priority: 'high' });
};

export const fetchFeaturedMatches = () => {
  return apiService.request(`/api/featured-match/live?skipFilter=true`);
};

export const batchFetchLeagues = (leagueIds: number[]) => {
  const endpoints = leagueIds.map(id => `/api/leagues/${id}/fixtures`);
  return apiService.batchRequest(endpoints);
};
