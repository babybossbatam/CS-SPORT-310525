
// Utility to clear all cached data and force fresh data retrieval
import { teamLogoCache, leagueLogoCache, flagCache } from './logoCache';
import { enhancedLogoManager } from './enhancedLogoManager';
import { imageCache } from './imageCache';

export const clearAllCachedData = () => {
  console.log('🧹 [clearAllCaches] Starting comprehensive cache clear...');
  
  // Clear logo caches
  teamLogoCache.clear();
  leagueLogoCache.clear();
  flagCache.clear();
  
  // Clear enhanced logo manager
  enhancedLogoManager.clearCache();
  
  // Clear image cache
  imageCache.clear();
  
  // Clear browser image cache by forcing reload of all images
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (img.src && (
      img.src.includes('api-sports') || 
      img.src.includes('/api/league-logo') ||
      img.src.includes('/api/standings') ||
      img.src.includes('365scores')
    )) {
      const originalSrc = img.src;
      img.src = '';
      setTimeout(() => {
        const separator = originalSrc.includes('?') ? '&' : '?';
        img.src = originalSrc + separator + 't=' + Date.now();
      }, 100);
    }
  });
  
  // Clear localStorage cache if any
  Object.keys(localStorage).forEach(key => {
    if (key.includes('league') || key.includes('logo') || key.includes('standings')) {
      localStorage.removeItem(key);
    }
  });
  
  // Clear sessionStorage cache if any
  Object.keys(sessionStorage).forEach(key => {
    if (key.includes('league') || key.includes('logo') || key.includes('standings')) {
      sessionStorage.removeItem(key);
    }
  });
  
  console.log('✅ [clearAllCaches] All caches cleared successfully');
  
  // Force page refresh to ensure all components refetch data
  window.location.reload();
};

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).clearAllCaches = clearAllCachedData;
}
