
// Clear team logo cache utility
export function clearTeamLogoCache(teamId?: number | string): void {
  console.log(`🧹 [clearTeamLogoCache] Clearing team logo cache for ID: ${teamId || 'ALL'}`);
  
  // Clear from enhanced logo manager
  if (typeof window !== 'undefined' && (window as any).logoManager) {
    if (teamId) {
      (window as any).logoManager.clearTeam?.(teamId);
    } else {
      (window as any).logoManager.clear?.();
    }
  }

  // Clear team logo images from DOM
  const teamLogoImages = document.querySelectorAll('img[alt*="team"], img[src*="team-logo"], img[src*="/api/team-logo"]');
  teamLogoImages.forEach(img => {
    if (img.src) {
      // Force reload with cache busting
      const originalSrc = img.src;
      img.src = '';
      setTimeout(() => {
        img.src = originalSrc + (originalSrc.includes('?') ? '&' : '?') + 'cache_bust=' + Date.now();
      }, 100);
    }
  });

  // Clear localStorage team cache
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('team_logo') || key.includes('teamLogo')) {
        if (!teamId || key.includes(String(teamId))) {
          localStorage.removeItem(key);
          console.log(`🗑️ Removed localStorage key: ${key}`);
        }
      }
    });
  } catch (error) {
    console.warn('Failed to clear localStorage team cache:', error);
  }

  console.log(`✅ [clearTeamLogoCache] Team logo cache cleared${teamId ? ` for team ${teamId}` : ' for all teams'}`);
}

// Clear all team logo caches globally
export function clearAllTeamLogoCaches(): void {
  clearTeamLogoCache();
  
  // Clear enhanced logo manager cache
  if (typeof window !== 'undefined' && (window as any).logoManager) {
    (window as any).logoManager.clear?.();
  }
  
  // Force reload all team logo images
  const allTeamImages = document.querySelectorAll('img[src*="/api/team-logo"], img[src*="api-sports.io"], img[alt*="team"]');
  allTeamImages.forEach((img: HTMLImageElement) => {
    if (img.src && !img.src.includes('fallback')) {
      const originalSrc = img.src;
      img.src = '';
      setTimeout(() => {
        img.src = originalSrc + (originalSrc.includes('?') ? '&' : '?') + 'refresh=' + Date.now();
      }, 100);
    }
  });
  
  // Additional cleanup for MyNewLeague2 component
  const event = new CustomEvent('clearTeamLogos', { 
    detail: { timestamp: Date.now() } 
  });
  window.dispatchEvent(event);
  
  console.log('🔄 [clearAllTeamLogoCaches] All team logo caches cleared and images refreshed');
}

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).clearTeamLogos = clearTeamLogoCache;
  (window as any).clearAllTeamLogos = clearAllTeamLogoCaches;
}
