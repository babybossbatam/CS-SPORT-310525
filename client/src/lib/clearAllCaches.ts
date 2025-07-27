
// Utility to clear all cached data and force fresh data retrieval
import { teamLogoCache, leagueLogoCache, flagCache, clearTeamLogoCache } from './logoCache';
import { enhancedLogoManager } from './enhancedLogoManager';
import { imageCache } from './imageCache';

// Clear specific team logo cache (Valencia)
export function clearValenciaTeamCache(): void {
  console.log('🔄 [clearAllCaches.ts] Clearing Valencia team logo cache...');
  
  // Clear from logo cache system
  clearTeamLogoCache(532, 'Valencia'); // Valencia CF team ID is 532
  
  // Clear from enhanced logo manager
  enhancedLogoManager.clearTeamCache(532, 'Valencia');
  
  // Clear from image cache
  const valenciaKeys = [
    'team_532_Valencia',
    'team_football_532_Valencia',
    'team_532',
    'team_football_532'
  ];
  
  valenciaKeys.forEach(key => {
    const cached = imageCache.getCachedImage(key);
    if (cached) {
      console.log(`🗑️ [clearAllCaches.ts] Clearing Valencia from image cache: ${key}`);
      // Force clear by setting empty cache
      imageCache.setCachedImage(key, '', 'team', 'cleared');
    }
  });

  // Force reload Valencia images in DOM
  const valenciaImages = document.querySelectorAll('img[alt*="Valencia"], img[src*="532"]');
  valenciaImages.forEach(img => {
    if (img instanceof HTMLImageElement && img.src) {
      const originalSrc = img.src;
      img.src = '';
      setTimeout(() => {
        img.src = originalSrc + (originalSrc.includes('?') ? '&' : '?') + 'cache_bust=' + Date.now();
      }, 100);
    }
  });

  console.log('✅ [clearAllCaches.ts] Valencia team logo cache cleared successfully');
}

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
