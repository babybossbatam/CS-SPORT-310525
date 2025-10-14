
export class MemoryManager {
  private static instance: MemoryManager;
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private lastMemoryUsage: number = 0;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  init(): void {
    // Check memory every 30 seconds
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30 * 1000);

    console.log('🧠 Memory manager initialized');
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
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }

      // Clear unnecessary caches
      if (typeof localStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('cache') || key.includes('debug'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`🧹 Emergency cleanup: removed ${keysToRemove.length} cache entries`);
      }

      // Remove unused DOM elements
      const unusedElements = document.querySelectorAll('[data-unused], .unused');
      unusedElements.forEach(el => el.remove());

      console.log('✅ Emergency memory cleanup completed');
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
    }
  }

  destroy(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  MemoryManager.getInstance().init();
}
