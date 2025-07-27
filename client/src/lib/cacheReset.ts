export function clearAllCaches(): void {
  console.log('🧹 [cacheReset.ts] Starting comprehensive cache clear...');

  // Clear logo caches
  console.log('🧹 [cacheReset.ts] Clearing logo caches...');
  teamLogoCache.clear();
  leagueLogoCache.clear();
  flagCache.clear();

  // Clear enhanced logo manager
  console.log('🧹 [cacheReset.ts] Clearing enhanced logo manager...');
  enhancedLogoManager.clearCache();

  // Clear browser's image cache by forcing reload
  console.log('🧹 [cacheReset.ts] Clearing browser image cache...');
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (img.src && (img.src.includes('api-sports') || img.src.includes('365scores') || img.src.includes('/api/league-logo'))) {
      const originalSrc = img.src;
      img.src = '';
      setTimeout(() => {
        img.src = originalSrc + (originalSrc.includes('?') ? '&' : '?') + 'cache_bust=' + Date.now();
      }, 100);
    }
  });

  console.log('✅ [cacheReset.ts] All caches cleared successfully');
}

export function clearLeagueLogoCache(): void {
  console.log('🏆 [cacheReset.ts] Clearing league logo cache specifically...');

  // Clear league logo cache
  leagueLogoCache.clear();

  // Clear enhanced logo manager league entries
  enhancedLogoManager.clearCache();

  // Force reload league images
  const leagueImages = document.querySelectorAll('img[alt*="League"], img[src*="league"], img[src*="/api/league-logo"]');
  leagueImages.forEach(img => {
    if (img.src) {
      const originalSrc = img.src;
      img.src = '';
      setTimeout(() => {
        img.src = originalSrc + (originalSrc.includes('?') ? '&' : '?') + 'cache_bust=' + Date.now();
      }, 100);
    }
  });

  console.log('✅ [cacheReset.ts] League logo cache cleared successfully');
}