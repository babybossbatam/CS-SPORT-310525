
/**
 * Optimized Data Fetching Strategy
 * Reduces API calls and improves performance
 */

import { queryClient } from './queryClient';
import { apiRequest } from './queryClient';

interface FetchOptions {
  forceRefresh?: boolean;
  priority?: 'high' | 'medium' | 'low';
  maxAge?: number;
}

class OptimizedDataFetcher {
  private requestQueue: Map<string, Promise<any>> = new Map();
  private lastFetchTimes: Map<string, number> = new Map();

  /**
   * Smart data fetching with deduplication and caching
   */
  async fetchData<T>(
    endpoint: string, 
    queryKey: string[], 
    options: FetchOptions = {}
  ): Promise<T | null> {
    const { forceRefresh = false, priority = 'medium', maxAge = 15 * 60 * 1000 } = options;
    const cacheKey = queryKey.join('-');

    // Check if request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      console.log(`⏳ [OptimizedFetcher] Waiting for existing request: ${cacheKey}`);
      return this.requestQueue.get(cacheKey);
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = queryClient.getQueryData<T>(queryKey);
      const lastFetch = this.lastFetchTimes.get(cacheKey);
      const age = lastFetch ? Date.now() - lastFetch : Infinity;

      if (cached && age < maxAge) {
        console.log(`💾 [OptimizedFetcher] Cache hit for ${cacheKey} (age: ${Math.round(age / 1000)}s)`);
        return cached;
      }
    }

    // Create request promise
    const requestPromise = this.performRequest<T>(endpoint, queryKey, maxAge);
    
    // Store in queue to prevent duplicates
    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      this.lastFetchTimes.set(cacheKey, Date.now());
      return result;
    } finally {
      // Remove from queue when done
      this.requestQueue.delete(cacheKey);
    }
  }

  /**
   * Perform the actual API request
   */
  private async performRequest<T>(
    endpoint: string,
    queryKey: string[],
    maxAge: number
  ): Promise<T | null> {
    try {
      console.log(`🌐 [OptimizedFetcher] Fetching: ${endpoint}`);
      
      const response = await apiRequest('GET', endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result
      queryClient.setQueryData(queryKey, data, {
        updatedAt: Date.now(),
      });

      console.log(`✅ [OptimizedFetcher] Successfully fetched and cached: ${endpoint}`);
      return data;
      
    } catch (error) {
      console.error(`❌ [OptimizedFetcher] Error fetching ${endpoint}:`, error);
      
      // Return stale cache if available on error
      const staleData = queryClient.getQueryData<T>(queryKey);
      if (staleData) {
        console.log(`🔄 [OptimizedFetcher] Returning stale cache for ${endpoint}`);
        return staleData;
      }
      
      return null;
    }
  }

  /**
   * Batch fetch multiple endpoints efficiently
   */
  async batchFetch<T>(requests: Array<{
    endpoint: string;
    queryKey: string[];
    options?: FetchOptions;
  }>): Promise<Array<T | null>> {
    console.log(`🚀 [OptimizedFetcher] Batch fetching ${requests.length} requests`);

    // Sort by priority
    const sortedRequests = requests.sort((a, b) => {
      const priorities = { high: 3, medium: 2, low: 1 };
      return (priorities[b.options?.priority || 'medium']) - (priorities[a.options?.priority || 'medium']);
    });

    // Process high priority immediately, others with delay
    const results: Promise<T | null>[] = [];
    
    for (let i = 0; i < sortedRequests.length; i++) {
      const request = sortedRequests[i];
      const delay = request.options?.priority === 'high' ? 0 : i * 100; // 100ms delay between requests
      
      const delayedRequest = new Promise<T | null>(resolve => {
        setTimeout(async () => {
          const result = await this.fetchData<T>(
            request.endpoint,
            request.queryKey,
            request.options
          );
          resolve(result);
        }, delay);
      });
      
      results.push(delayedRequest);
    }

    return Promise.all(results);
  }

  /**
   * Clear request queue (useful for cleanup)
   */
  clearQueue(): void {
    this.requestQueue.clear();
    this.lastFetchTimes.clear();
    console.log('🧹 [OptimizedFetcher] Request queue cleared');
  }

  /**
   * Get queue status for debugging
   */
  getQueueStatus(): { pending: number; lastFetches: number } {
    return {
      pending: this.requestQueue.size,
      lastFetches: this.lastFetchTimes.size
    };
  }
}

export const optimizedDataFetcher = new OptimizedDataFetcher();
