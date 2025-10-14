
// Centralized performance optimizer to reduce system load
class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private batchTimer: NodeJS.Timeout | null = null;
  private pendingRequests: Array<{key: string, resolve: Function, reject: Function}> = [];

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Debounce API requests to prevent overwhelming the server
  debounceRequest<T>(key: string, requestFn: () => Promise<T>, delay = 300): Promise<T> {
    // Check if we already have a pending request for this key
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key)!;
    }

    const promise = new Promise<T>((resolve, reject) => {
      // Add to pending requests
      this.pendingRequests.push({key, resolve, reject});

      // Clear existing timer and set new one
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }

      // Set timer to batch process requests
      this.batchTimer = setTimeout(async () => {
        const currentBatch = [...this.pendingRequests];
        this.pendingRequests = [];

        // Group by key and execute unique requests
        const uniqueRequests = new Map();
        currentBatch.forEach(req => {
          if (!uniqueRequests.has(req.key)) {
            uniqueRequests.set(req.key, []);
          }
          uniqueRequests.get(req.key).push(req);
        });

        // Execute requests
        for (const [requestKey, requests] of uniqueRequests) {
          try {
            const result = await requestFn();
            requests.forEach(req => req.resolve(result));
            // Remove from queue after completion
            this.requestQueue.delete(requestKey);
          } catch (error) {
            requests.forEach(req => req.reject(error));
            this.requestQueue.delete(requestKey);
          }
        }
      }, delay);
    });

    // Store the promise to prevent duplicates
    this.requestQueue.set(key, promise);
    return promise;
  }

  // Optimize localStorage usage
  optimizedLocalStorageSet(key: string, value: any): void {
    try {
      // Check available space before setting
      const serialized = JSON.stringify(value);
      const spaceNeeded = key.length + serialized.length;
      
      // If space is limited, clean up old entries first
      if (spaceNeeded > 50000) { // 50KB threshold
        this.cleanupOldCacheEntries();
      }
      
      localStorage.setItem(key, serialized);
    } catch (e) {
      console.warn('Storage full, cleaning up and retrying');
      this.cleanupOldCacheEntries();
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (finalError) {
        console.error('Failed to store data even after cleanup');
      }
    }
  }

  private cleanupOldCacheEntries(): void {
    const keysToRemove: string[] = [];
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('_cache')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.timestamp && (now - item.timestamp) > 3600000) { // 1 hour
            keysToRemove.push(key);
          }
        } catch (e) {
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Memory usage monitor
  checkMemoryUsage(): void {
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      if (usedPercent > 80) {
        console.warn('High memory usage detected:', usedPercent.toFixed(1) + '%');
        this.triggerGarbageCollection();
      }
    }
  }

  private triggerGarbageCollection(): void {
    // Clear unnecessary caches
    this.requestQueue.clear();
    this.pendingRequests = [];
    
    // Force garbage collection if available
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();

// Auto-start memory monitoring with reduced frequency
if (typeof window !== 'undefined') {
  setInterval(() => {
    performanceOptimizer.checkMemoryUsage();
  }, 60000); // Check every 60 seconds (reduced from 30)
}
