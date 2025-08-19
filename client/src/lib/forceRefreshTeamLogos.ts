
/**
 * Force refresh team logos utility
 * Clears all caches and forces reload of team logo images
 */

export function forceRefreshTeamLogos(): void {
  console.log('🔄 [forceRefreshTeamLogos] Starting force refresh of all team logos');

  // Clear all localStorage team logo entries
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('team_logo') || key.includes('teamLogo') || key.includes('team-logo')) {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed localStorage key: ${key}`);
      }
    });
  } catch (error) {
    console.warn('Failed to clear localStorage team cache:', error);
  }

  // Clear enhanced logo manager cache
  if (typeof window !== 'undefined' && (window as any).logoManager) {
    (window as any).logoManager.clear?.();
    console.log('🧹 Cleared enhanced logo manager cache');
  }

  // Force reload all team logo images with cache busting
  const teamLogoSelectors = [
    'img[src*="/api/team-logo"]',
    'img[src*="api-sports.io"]', 
    'img[alt*="team"]',
    'img[class*="team-logo"]',
    'img[class*="teamLogo"]'
  ];

  teamLogoSelectors.forEach(selector => {
    const images = document.querySelectorAll(selector);
    images.forEach((img: HTMLImageElement) => {
      if (img.src && !img.src.includes('fallback-logo.svg')) {
        const originalSrc = img.src.split('?')[0]; // Remove existing query params
        img.src = '';
        
        setTimeout(() => {
          img.src = originalSrc + '?refresh=' + Date.now();
          console.log(`🔄 Refreshed team logo: ${originalSrc}`);
        }, Math.random() * 200 + 100); // Stagger the refreshes
      }
    });
  });

  // Dispatch custom event for components to listen
  const event = new CustomEvent('forceTeamLogoRefresh', {
    detail: { 
      timestamp: Date.now(),
      type: 'team-logos'
    }
  });
  window.dispatchEvent(event);

  console.log('✅ [forceRefreshTeamLogos] Force refresh completed');
}

// Auto-refresh function that can be called periodically
export function autoRefreshMismatchedLogos(): void {
  // Look for images that might be showing fallback/placeholder logos
  const fallbackImages = document.querySelectorAll('img[src*="fallback"], img[src*="placeholder"], img[src*="default"]');
  
  if (fallbackImages.length > 0) {
    console.log(`🔍 Found ${fallbackImages.length} fallback images, triggering refresh`);
    forceRefreshTeamLogos();
  }
}

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).forceRefreshTeamLogos = forceRefreshTeamLogos;
  (window as any).autoRefreshMismatchedLogos = autoRefreshMismatchedLogos;
}
