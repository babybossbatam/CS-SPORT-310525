
import { CacheManager } from './cachingHelper';
import { backgroundCache } from './backgroundCache';

export const clearAllCaches = () => {
  try {
    // Clear CacheManager cache
    if (CacheManager && typeof CacheManager.clearAll === 'function') {
      CacheManager.clearAll();
      console.log('✅ CacheManager cleared');
    }
    
    // Clear background cache
    if (backgroundCache && typeof backgroundCache.clear === 'function') {
      backgroundCache.clear();
      console.log('✅ Background cache cleared');
    }
    
    // Clear localStorage cache keys
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.includes('cache') || 
      key.includes('featured-matches') || 
      key.includes('fixtures') ||
      key.includes('standings')
    );
    
    cacheKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`✅ Cleared ${cacheKeys.length} localStorage cache entries`);
    
    // Clear sessionStorage cache keys
    const sessionCacheKeys = Object.keys(sessionStorage).filter(key => 
      key.includes('cache') || 
      key.includes('featured-matches') || 
      key.includes('fixtures') ||
      key.includes('standings')
    );
    
    sessionCacheKeys.forEach(key => {
      sessionStorage.removeItem(key);
    });
    
    console.log(`✅ Cleared ${sessionCacheKeys.length} sessionStorage cache entries`);
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
    return false;
  }
};

// Function to clear specific cache types
export const clearCacheByType = (type: 'featured-matches' | 'fixtures' | 'standings' | 'all') => {
  try {
    if (type === 'all') {
      return clearAllCaches();
    }
    
    // Clear specific cache type from localStorage
    const localKeys = Object.keys(localStorage).filter(key => key.includes(type));
    localKeys.forEach(key => localStorage.removeItem(key));
    
    // Clear specific cache type from sessionStorage
    const sessionKeys = Object.keys(sessionStorage).filter(key => key.includes(type));
    sessionKeys.forEach(key => sessionStorage.removeItem(key));
    
    console.log(`✅ Cleared ${localKeys.length + sessionKeys.length} ${type} cache entries`);
    return true;
  } catch (error) {
    console.error(`❌ Error clearing ${type} cache:`, error);
    return false;
  }
};
