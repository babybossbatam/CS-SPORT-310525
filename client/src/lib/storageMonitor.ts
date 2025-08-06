
export class StorageMonitor {
  private static instance: StorageMonitor;
  private cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): StorageMonitor {
    if (!StorageMonitor.instance) {
      StorageMonitor.instance = new StorageMonitor();
    }
    return StorageMonitor.instance;
  }

  init(): void {
    // Monitor storage every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.checkAndCleanup();
    }, 5 * 60 * 1000);

    // Initial cleanup
    this.checkAndCleanup();
  }

  private checkAndCleanup(): void {
    try {
      const { used, available } = this.getStorageSize();
      const usedMB = (used / (1024 * 1024)).toFixed(2);
      const availableMB = (available / (1024 * 1024)).toFixed(2);

      console.log(`📊 Storage: ${usedMB}MB used, ${availableMB}MB available`);

      // Cleanup if less than 500KB available
      if (available < 500 * 1024) {
        console.warn('⚠️ Low storage space, initiating cleanup');
        this.cleanupOldEntries();
      }
    } catch (e) {
      console.error('Storage monitoring error:', e);
    }
  }

  private getStorageSize(): { used: number; available: number } {
    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
    const maxSize = 3 * 1024 * 1024; // 3MB safe limit
    return { used, available: maxSize - used };
  }

  private cleanupOldEntries(): void {
    const now = Date.now();
    const maxAge = 6 * 60 * 60 * 1000; // 6 hours
    let removedCount = 0;

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && this.isCacheKey(key)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const data = JSON.parse(item);
            if (data.timestamp && (now - data.timestamp) > maxAge) {
              localStorage.removeItem(key);
              removedCount++;
            }
          }
        } catch (e) {
          // Remove corrupted entries
          localStorage.removeItem(key);
          removedCount++;
        }
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} old cache entries`);
    }
  }

  private isCacheKey(key: string): boolean {
    return key.includes('_cache') || 
           key.includes('cssport_') || 
           key.includes('standings_') ||
           key.includes('fixtures_') ||
           key.includes('logos_');
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
