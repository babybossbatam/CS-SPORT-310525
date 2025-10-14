
/**
 * Comprehensive Cache Cleanup System
 * Clears all caches on first visit and optimizes storage
 */

import { queryClient } from './queryClient';
import { fixtureCache } from './fixtureCache';
import { teamLogoCache, leagueLogoCache, flagCache } from './logoCache';
import { StorageMonitor } from './storageMonitor';

interface CacheStats {
  queryClientSize: number;
  fixturesCacheSize: number;
  localStorageSize: number;
  sessionStorageSize: number;
  logosCacheSize: number;
}

class ComprehensiveCacheCleanup {
  private isFirstVisit = false;
  private cleanupInProgress = false;

  /**
   * Initialize cache cleanup system
   */
  init(): void {
    this.detectFirstVisit();
    this.setupPeriodicCleanup();
    this.handleStorageQuota();
    
    if (this.isFirstVisit) {
      this.performFirstVisitCleanup();
    }
  }

  /**
   * Detect if this is first visit or cache needs refresh
   */
  private detectFirstVisit(): void {
    const lastCleanup = localStorage.getItem('last_cache_cleanup');
    const currentVersion = '2.0.0'; // Increment to force cleanup
    const storedVersion = localStorage.getItem('app_cache_version');
    
    // Force cleanup if version changed or more than 24 hours
    const needsCleanup = !lastCleanup || 
                        storedVersion !== currentVersion ||
                        (Date.now() - parseInt(lastCleanup)) > 24 * 60 * 60 * 1000;
    
    if (needsCleanup) {
      this.isFirstVisit = true;
      console.log('🧹 [CacheCleanup] First visit or cache refresh needed');
    }
  }

  /**
   * Comprehensive cleanup on first visit
   */
  private async performFirstVisitCleanup(): Promise<void> {
    if (this.cleanupInProgress) return;
    
    this.cleanupInProgress = true;
    console.log('🚀 [CacheCleanup] Starting comprehensive first-visit cleanup...');

    try {
      // 1. Clear React Query cache
      queryClient.clear();
      console.log('✅ [CacheCleanup] React Query cache cleared');

      // 2. Clear fixture cache
      fixtureCache.clearCache();
      console.log('✅ [CacheCleanup] Fixture cache cleared');

      // 3. Clear logo caches
      teamLogoCache.clear();
      leagueLogoCache.clear();
      flagCache.clear();
      console.log('✅ [CacheCleanup] Logo caches cleared');

      // 4. Aggressive localStorage cleanup
      this.cleanLocalStorage();
      console.log('✅ [CacheCleanup] localStorage cleaned');

      // 5. Clear sessionStorage
      this.cleanSessionStorage();
      console.log('✅ [CacheCleanup] sessionStorage cleaned');

      // 6. Update cleanup timestamp and version
      localStorage.setItem('last_cache_cleanup', Date.now().toString());
      localStorage.setItem('app_cache_version', '2.0.0');

      console.log('✅ [CacheCleanup] First-visit cleanup completed successfully');
      
    } catch (error) {
      console.error('❌ [CacheCleanup] Error during first-visit cleanup:', error);
    } finally {
      this.cleanupInProgress = false;
    }
  }

  /**
   * Clean localStorage aggressively
   */
  private cleanLocalStorage(): void {
    const preserveKeys = [
      'darkMode',
      'language', 
      'timezone',
      'userSettings',
      'last_cache_cleanup',
      'app_cache_version'
    ];

    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !preserveKeys.includes(key)) {
        keysToRemove.push(key);
      }
    }

    // Remove all non-essential keys
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove localStorage key: ${key}`);
      }
    });

    console.log(`🗑️ [CacheCleanup] Removed ${keysToRemove.length} localStorage keys`);
  }

  /**
   * Clean sessionStorage completely
   */
  private cleanSessionStorage(): void {
    try {
      sessionStorage.clear();
      console.log('🗑️ [CacheCleanup] sessionStorage cleared completely');
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error);
    }
  }

  /**
   * Setup periodic cleanup (every 30 minutes)
   */
  private setupPeriodicCleanup(): void {
    setInterval(() => {
      this.performPeriodicCleanup();
    }, 30 * 60 * 1000); // 30 minutes
  }

  /**
   * Periodic maintenance cleanup
   */
  private performPeriodicCleanup(): void {
    console.log('🔄 [CacheCleanup] Performing periodic maintenance...');

    try {
      // Clean old query cache entries (older than 1 hour)
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      let removedCount = 0;

      queries.forEach(query => {
        const age = query.state.dataUpdatedAt ? Date.now() - query.state.dataUpdatedAt : 0;
        if (age > 60 * 60 * 1000) { // 1 hour
          queryClient.removeQueries({ queryKey: query.queryKey });
          removedCount++;
        }
      });

      console.log(`🧹 [CacheCleanup] Removed ${removedCount} stale query entries`);

      // Clean old localStorage entries
      this.cleanOldLocalStorageEntries();

    } catch (error) {
      console.error('❌ [CacheCleanup] Error during periodic cleanup:', error);
    }
  }

  /**
   * Clean old localStorage entries
   */
  private cleanOldLocalStorageEntries(): void {
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('cache') || key.includes('fixtures'))) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const data = JSON.parse(item);
            const age = Date.now() - (data.timestamp || 0);
            if (age > maxAge) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // Remove corrupted entries
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if (keysToRemove.length > 0) {
      console.log(`🗑️ [CacheCleanup] Removed ${keysToRemove.length} old localStorage entries`);
    }
  }

  /**
   * Handle storage quota exceeded errors
   */
  private handleStorageQuota(): void {
    const storageMonitor = StorageMonitor.getInstance();
    storageMonitor.init();

    // Listen for quota exceeded errors
    window.addEventListener('error', (event) => {
      if (event.error?.name === 'QuotaExceededError' || 
          event.message?.includes('quota exceeded')) {
        console.warn('⚠️ [CacheCleanup] Storage quota exceeded, emergency cleanup');
        this.performEmergencyCleanup();
      }
    });
  }

  /**
   * Emergency cleanup when storage quota exceeded
   */
  private performEmergencyCleanup(): void {
    console.log('🚨 [CacheCleanup] Emergency cleanup initiated');

    // Clear everything except essential data
    queryClient.clear();
    fixtureCache.clearCache();
    
    // Aggressive localStorage cleanup
    const essential = ['darkMode', 'language', 'userSettings'];
    const backup: Record<string, string> = {};
    
    essential.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) backup[key] = value;
    });

    localStorage.clear();
    
    Object.entries(backup).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        console.warn(`Failed to restore essential key: ${key}`);
      }
    });

    console.log('✅ [CacheCleanup] Emergency cleanup completed');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    const cache = queryClient.getQueryCache();
    let localStorageSize = 0;
    let sessionStorageSize = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          localStorageSize += key.length + (value?.length || 0);
        }
      }

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key);
          sessionStorageSize += key.length + (value?.length || 0);
        }
      }
    } catch (error) {
      console.warn('Error calculating storage size:', error);
    }

    return {
      queryClientSize: cache.getAll().length,
      fixturesCacheSize: fixtureCache.getEnhancedStats().size,
      localStorageSize,
      sessionStorageSize,
      logosCacheSize: teamLogoCache.getStats().total + leagueLogoCache.getStats().total
    };
  }

  /**
   * Force complete cache refresh
   */
  forceRefresh(): void {
    this.isFirstVisit = true;
    this.performFirstVisitCleanup();
  }
}

export const cacheCleanupManager = new ComprehensiveCacheCleanup();
