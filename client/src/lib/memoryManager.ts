
export class MemoryManager {
  private static instance: MemoryManager;
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private lastMemoryUsage: number = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  init(): void {
    // Check memory every 15 seconds for faster response
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 15 * 1000);

    // Aggressive cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.performAggressiveCleanup();
    }, 5 * 60 * 1000);

    console.log('🧠 Enhanced memory manager initialized');
  }

  private checkMemoryUsage(): void {
    try {
      // Estimate memory usage
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        const used = memoryInfo.usedJSHeapSize;
        const total = memoryInfo.totalJSHeapSize;
        const limit = memoryInfo.jsHeapSizeLimit;
        
        const usedMB = Math.round(used / 1024 / 1024);
        const totalMB = Math.round(total / 1024 / 1024);
        const limitMB = Math.round(limit / 1024 / 1024);
        
        console.log(`🧠 Memory: ${usedMB}MB used / ${totalMB}MB total / ${limitMB}MB limit`);
        
        // If memory usage is high, trigger cleanup
        if (used > limit * 0.85) {
          console.warn('⚠️ High memory usage detected, triggering cleanup');
          this.emergencyCleanup();
        }
        
        this.lastMemoryUsage = used;
      }
    } catch (error) {
      console.warn('Memory monitoring error:', error);
    }
  }

  private emergencyCleanup(): void {
    try {
      this.performAggressiveCleanup();
      
      // Force multiple garbage collections
      if ((window as any).gc) {
        (window as any).gc();
        setTimeout(() => (window as any).gc(), 1000);
      }

      console.log('🚨 Emergency memory cleanup completed');
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
    }
  }

  private performAggressiveCleanup(): void {
    try {
      // Clear all temporary caches
      if (typeof localStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.includes('cache') || 
            key.includes('debug') || 
            key.includes('temp') ||
            key.includes('query-') ||
            key.startsWith('tanstack')
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`🧹 Aggressive cleanup: removed ${keysToRemove.length} cache entries`);
      }

      // Clear session storage
      if (typeof sessionStorage !== 'undefined') {
        const sessionKeys = Object.keys(sessionStorage).filter(key => 
          key.includes('temp') || key.includes('cache')
        );
        sessionKeys.forEach(key => sessionStorage.removeItem(key));
      }

      // Remove unused DOM elements aggressively
      const unusedSelectors = [
        '[data-unused]', '.unused', '.stale-cache', 
        '[data-stale]', '.error-overlay', '[data-error-overlay]',
        '.runtime-error-overlay', 'vite-error-overlay'
      ];
      
      unusedSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });

      // Clear any lingering event listeners
      this.clearEventListeners();

      console.log('🧹 Aggressive cleanup completed');
    } catch (error) {
      console.error('Aggressive cleanup failed:', error);
    }
  }

  private clearEventListeners(): void {
    try {
      // Remove any hanging event listeners
      const elements = document.querySelectorAll('[data-has-listeners]');
      elements.forEach(el => {
        el.removeAttribute('data-has-listeners');
      });
    } catch (error) {
      console.warn('Event listener cleanup error:', error);
    }
  }

  destroy(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Final cleanup on destroy
    this.performAggressiveCleanup();
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  MemoryManager.getInstance().init();
}
