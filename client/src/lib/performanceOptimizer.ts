
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private memoryThreshold = 100 * 1024 * 1024; // 100MB
  private requestQueue: Map<string, number> = new Map();
  private maxConcurrentRequests = 3; // Limit concurrent requests
  
  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Throttle API requests
  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const lastRequest = this.requestQueue.get(key);
    
    if (lastRequest && now - lastRequest < 60000) { // 1 minute cooldown
      console.warn(`🚫 [PerformanceOptimizer] Request throttled for ${key}`);
      return false;
    }
    
    // Check concurrent request limit
    const activeRequests = Array.from(this.requestQueue.values())
      .filter(timestamp => now - timestamp < 10000).length; // Active within 10s
    
    if (activeRequests >= this.maxConcurrentRequests) {
      console.warn(`🚫 [PerformanceOptimizer] Too many concurrent requests (${activeRequests})`);
      return false;
    }
    
    this.requestQueue.set(key, now);
    return true;
  }

  // Monitor memory usage
  checkMemoryUsage(): boolean {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const memoryUsed = memInfo.usedJSHeapSize;
      
      if (memoryUsed > this.memoryThreshold) {
        console.warn(`⚠️ [PerformanceOptimizer] High memory usage: ${Math.round(memoryUsed / 1024 / 1024)}MB`);
        this.cleanupMemory();
        return false;
      }
    }
    return true;
  }

  // Force garbage collection and cleanup
  private cleanupMemory(): void {
    // Clear old cache entries
    if ('queryClient' in window && (window as any).queryClient) {
      const queryClient = (window as any).queryClient;
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      
      // Remove queries older than 1 hour
      const oldQueries = queries.filter(q => 
        q.state.dataUpdatedAt && 
        Date.now() - q.state.dataUpdatedAt > 3600000
      );
      
      oldQueries.forEach(q => {
        queryClient.removeQueries({ queryKey: q.queryKey });
      });
      
      console.log(`🧹 [PerformanceOptimizer] Cleaned ${oldQueries.length} old cache entries`);
    }
    
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  // Batch requests to reduce server load
  private requestBatches: Map<string, any[]> = new Map();
  
  batchRequest(key: string, data: any, delay: number = 1000): Promise<any[]> {
    return new Promise((resolve) => {
      if (!this.requestBatches.has(key)) {
        this.requestBatches.set(key, []);
        
        setTimeout(() => {
          const batch = this.requestBatches.get(key) || [];
          this.requestBatches.delete(key);
          resolve(batch);
        }, delay);
      }
      
      this.requestBatches.get(key)?.push(data);
    });
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();
