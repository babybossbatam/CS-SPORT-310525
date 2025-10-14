
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
      // Clear old localStorage entries
      if (typeof localStorage !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('cache') || key.includes('query-cache')) {
            try {
              const item = JSON.parse(localStorage.getItem(key) || '{}');
              const age = Date.now() - (item.timestamp || 0);
              // Remove items older than 1 hour
              if (age > 60 * 60 * 1000) {
                localStorage.removeItem(key);
              }
            } catch (e) {
              localStorage.removeItem(key); // Remove invalid entries
            }
          }
        });
      }
      
      // Force garbage collection if available
      if (typeof window !== 'undefined' && (window as any).gc) {
        (window as any).gc();
      }
      
      console.log('🧹 Memory cleanup completed');
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
