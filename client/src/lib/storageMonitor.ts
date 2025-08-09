
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

      // More aggressive cleanup thresholds
      if (available <= 0) {
        console.error('🚨 Storage critically full, emergency cleanup');
        this.emergencyCleanup();
      } else if (available < 100 * 1024) { // Less than 100KB
        console.warn('⚠️ Very low storage space, aggressive cleanup');
        this.aggressiveCleanup();
      } else if (available < 500 * 1024) { // Less than 500KB
        console.warn('⚠️ Low storage space, initiating cleanup');
        this.cleanupOldEntries();
      }
    } catch (e) {
      console.error('Storage monitoring error:', e);
      // If monitoring fails, assume storage is full and cleanup
      this.emergencyCleanup();
    }
  }

  private getStorageSize(): { used: number; available: number } {
    let used = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            used += key.length + value.length;
          }
        }
      }
    } catch (e) {
      console.warn('Error calculating storage size:', e);
      used = 3.5 * 1024 * 1024; // Assume nearly full if calculation fails
    }
    
    const maxSize = 4 * 1024 * 1024; // 4MB conservative limit
    const available = Math.max(0, maxSize - used);
    
    return { used, available };
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

  private aggressiveCleanup(): void {
    const now = Date.now();
    const maxAge = 1 * 60 * 60 * 1000; // 1 hour for aggressive cleanup
    let removedCount = 0;

    // Remove all cache entries older than 1 hour
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
          localStorage.removeItem(key);
          removedCount++;
        }
      }
    }

    // If still not enough space, remove 50% of remaining cache entries
    if (this.getStorageSize().available < 50 * 1024) {
      const remainingKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && this.isCacheKey(key)) {
          remainingKeys.push(key);
        }
      }
      
      const keysToRemove = remainingKeys.slice(0, Math.floor(remainingKeys.length / 2));
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        removedCount++;
      });
    }

    console.warn(`🧹 Aggressive cleanup removed ${removedCount} entries`);
  }

  private emergencyCleanup(): void {
    console.error('🚨 Emergency cleanup - removing all cache data');
    
    // Keep only essential user settings
    const essentialKeys = ['darkMode', 'language', 'timezone', 'userSettings'];
    const essentialData: { [key: string]: string } = {};
    
    // Save essential data
    essentialKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        essentialData[key] = value;
      }
    });
    
    // Remove all cache entries
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (this.isCacheKey(key) || !essentialKeys.includes(key))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // If still not enough space, clear everything except essentials
    if (this.getStorageSize().available <= 0) {
      localStorage.clear();
      Object.entries(essentialData).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, value);
        } catch (e) {
          console.warn(`Failed to restore essential key: ${key}`);
        }
      });
    }
    
    console.error(`🚨 Emergency cleanup removed ${keysToRemove.length} entries`);
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
