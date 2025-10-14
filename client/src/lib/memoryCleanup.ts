
class MemoryCleanup {
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  init() {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 5 * 60 * 1000);
    
    // Clean up on page visibility change
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.performCleanup();
        }
      });
    }
  }
  
  performCleanup() {
    try {
      // More aggressive localStorage cleanup
      if (typeof localStorage !== 'undefined') {
        const keys = Object.keys(localStorage);
        let removedCount = 0;
        
        keys.forEach(key => {
          if (key.includes('cache') || 
              key.includes('query-cache') || 
              key.includes('fixtures') ||
              key.includes('standings') ||
              key.includes('logos')) {
            try {
              const item = JSON.parse(localStorage.getItem(key) || '{}');
              const age = Date.now() - (item.timestamp || 0);
              // Remove items older than 30 minutes for better performance
              if (age > 30 * 60 * 1000) {
                localStorage.removeItem(key);
                removedCount++;
              }
            } catch (e) {
              localStorage.removeItem(key);
              removedCount++;
            }
          }
        });
        
        if (removedCount > 0) {
          console.log(`🧹 Removed ${removedCount} old cache entries`);
        }
      }
      
      // Clear React Query cache of old entries
      if (typeof window !== 'undefined' && (window as any).queryClient) {
        const cache = (window as any).queryClient.getQueryCache();
        const queries = cache.getAll();
        let staleQueries = 0;
        
        queries.forEach((query: any) => {
          const age = query.state.dataUpdatedAt ? Date.now() - query.state.dataUpdatedAt : 0;
          if (age > 30 * 60 * 1000) { // 30 minutes
            cache.remove(query);
            staleQueries++;
          }
        });
        
        if (staleQueries > 0) {
          console.log(`🧹 Removed ${staleQueries} stale queries`);
        }
      }
      
      // Force garbage collection if available
      if (typeof window !== 'undefined' && (window as any).gc) {
        (window as any).gc();
      }
      
    } catch (error) {
      console.warn('Memory cleanup failed:', error);
    }
  }
  
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const memoryCleanup = new MemoryCleanup();
