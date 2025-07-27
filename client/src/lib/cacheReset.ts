
/**
 * Cache Reset Utility
 * Provides functions to reset all logo-related caches
 */

import { teamLogoCache, leagueLogoCache, flagCache } from './logoCache';
import { enhancedLogoManager } from './enhancedLogoManager';

export function resetAllLogoCaches(): void {
  console.log('🧹 [Cache Reset] Starting complete logo cache reset...');
  
  try {
    // Clear all logo caches
    teamLogoCache.clear();
    leagueLogoCache.clear();
    flagCache.clear();
    
    // Clear enhanced logo manager cache
    enhancedLogoManager.clearCache();
    
    // Clear any browser storage related to logos
    if (typeof window !== 'undefined') {
      // Clear localStorage items related to logos
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('logo') || key.includes('flag') || key.includes('team') || key.includes('league'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage items related to logos
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('logo') || key.includes('flag') || key.includes('team') || key.includes('league'))) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    }
    
    console.log('✅ [Cache Reset] All logo caches cleared successfully');
    
    // Force a page reload to ensure fresh data
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        console.log('🔄 [Cache Reset] Reloading page to apply changes...');
        window.location.reload();
      }, 1000);
    }
    
  } catch (error) {
    console.error('❌ [Cache Reset] Error clearing caches:', error);
  }
}

export function resetTeamLogoCache(): void {
  console.log('🧹 [Cache Reset] Clearing team logo cache...');
  teamLogoCache.clear();
  console.log('✅ [Cache Reset] Team logo cache cleared');
}

export function resetLeagueLogoCache(): void {
  console.log('🧹 [Cache Reset] Clearing league logo cache...');
  leagueLogoCache.clear();
  console.log('✅ [Cache Reset] League logo cache cleared');
}

export function resetCountryFlagCache(): void {
  console.log('🧹 [Cache Reset] Clearing country flag cache...');
  flagCache.clear();
  console.log('✅ [Cache Reset] Country flag cache cleared');
}

export function getCacheStats(): {
  teamCache: any;
  leagueCache: any;
  flagCache: any;
  enhancedManager: any;
} {
  return {
    teamCache: teamLogoCache.getStats(),
    leagueCache: leagueLogoCache.getStats(),
    flagCache: flagCache.getStats(),
    enhancedManager: enhancedLogoManager.getCacheStats()
  };
}

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).logoCache = {
    reset: resetAllLogoCaches,
    resetTeam: resetTeamLogoCache,
    resetLeague: resetLeagueLogoCache,
    resetFlags: resetCountryFlagCache,
    stats: getCacheStats
  };
}

export default {
  resetAll: resetAllLogoCaches,
  resetTeam: resetTeamLogoCache,
  resetLeague: resetLeagueLogoCache,
  resetFlags: resetCountryFlagCache,
  getStats: getCacheStats
};
