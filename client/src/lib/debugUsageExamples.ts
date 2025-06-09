
/**
 * Usage Examples for Centralized Debug System
 * 
 * This file shows how to integrate the centralized debug system into your components.
 * Copy these examples to your actual components to enable debugging.
 */

import { enhancedApiWrapper } from './enhancedApiWrapper';
import { enhancedLogoManager } from './enhancedLogoManager';
import { logApiCall, logLogo, logCacheOperation } from './centralizedDebugCache';

// Example 1: MyHomeFeaturedMatchNew component usage
export const exampleMyHomeFeaturedMatchNewUsage = () => {
  const componentName = 'MyHomeFeaturedMatchNew';
  
  // Replace your API calls with:
  const fetchFeaturedMatches = async (dates: string[]) => {
    try {
      const promises = dates.map(date => 
        enhancedApiWrapper.fetchFixtures(componentName, date, { all: true })
      );
      const results = await Promise.all(promises);
      return results.flat();
    } catch (error) {
      console.error(`[${componentName}] Failed to fetch featured matches:`, error);
      throw error;
    }
  };

  // For team logos:
  const getTeamLogo = async (teamId: number, teamName: string, isCircular = false) => {
    return await enhancedLogoManager.getTeamLogo(componentName, {
      type: 'team',
      shape: isCircular ? 'circular' : 'normal',
      teamId,
      teamName,
      fallbackUrl: '/assets/fallback-logo.svg'
    });
  };

  // For country flags:
  const getCountryFlag = async (country: string, isCircular = false) => {
    return await enhancedLogoManager.getCountryFlag(componentName, {
      type: 'flag',
      shape: isCircular ? 'circular' : 'normal',
      country,
      fallbackUrl: '/assets/fallback-logo.svg'
    });
  };
};

// Example 2: TodayPopularFootballLeaguesNew component usage
export const exampleTodayPopularFootballLeaguesNewUsage = () => {
  const componentName = 'TodayPopularFootballLeaguesNew';
  
  // Replace your fixture fetching with:
  const fetchTodayFixtures = async (selectedDate: string) => {
    return await enhancedApiWrapper.fetchFixtures(componentName, selectedDate, { all: true });
  };

  // For manual API calls (if you need custom logic):
  const customApiCall = async (endpoint: string) => {
    const startTime = Date.now();
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      
      logApiCall(componentName, {
        endpoint,
        method: 'GET',
        responseTime: Date.now() - startTime,
        status: 'success',
        dataSize: JSON.stringify(data).length
      });
      
      return data;
    } catch (error) {
      logApiCall(componentName, {
        endpoint,
        method: 'GET',
        responseTime: Date.now() - startTime,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };
};

// Example 3: LiveMatchByTime component usage
export const exampleLiveMatchByTimeUsage = () => {
  const componentName = 'LiveMatchByTime';
  
  // Replace your live fixtures fetching with:
  const fetchLiveFixtures = async () => {
    return await enhancedApiWrapper.fetchLiveFixtures(componentName);
  };

  // For league logos in live matches:
  const getLeagueLogo = async (leagueId: number, leagueName: string) => {
    return await enhancedLogoManager.getLeagueLogo(componentName, {
      type: 'league',
      leagueId,
      leagueName,
      fallbackUrl: '/assets/fallback-logo.svg'
    });
  };
};

// Example 4: Manual cache operation logging (for custom caching logic)
export const exampleManualCacheLogging = () => {
  const componentName = 'CustomComponent';
  const cacheKey = 'my-custom-cache-key';
  
  // When you check cache:
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    logCacheOperation(componentName, 'hit', cacheKey, cachedData.length);
    return JSON.parse(cachedData);
  } else {
    logCacheOperation(componentName, 'miss', cacheKey);
    // Fetch new data...
  }
  
  // When you save to cache:
  const dataToCache = JSON.stringify(newData);
  localStorage.setItem(cacheKey, dataToCache);
  logCacheOperation(componentName, 'set', cacheKey, dataToCache.length);
};

// Example 5: How to access debug data in browser console
export const consoleDebugExamples = () => {
  /*
  // In browser console, you can use:
  
  // Get all component stats
  debugCache.stats()
  
  // Get API logs for specific component
  debugCache.apiLogs('MyHomeFeaturedMatchNew', 10)
  
  // Get logo logs for specific component
  debugCache.logoLogs('TodayPopularFootballLeaguesNew', 10)
  
  // Get cache hit rate for component
  debugCache.hitRate('LiveMatchByTime')
  
  // Print summary report
  debugCache.summary()
  
  // Export all debug data
  debugCache.export()
  
  // Clear all debug data
  debugCache.clear()
  
  // Get API wrapper cache stats
  apiWrapper.stats()
  
  // Get logo manager cache stats
  logoManager.stats()
  
  // Clear specific component cache
  apiWrapper.clear('MyHomeFeaturedMatchNew')
  logoManager.clear('TodayPopularFootballLeaguesNew')
  */
};

/**
 * Integration Steps:
 * 
 * 1. Import the required functions at the top of your component:
 *    import { enhancedApiWrapper, enhancedLogoManager } from '@/lib/enhancedApiWrapper';
 * 
 * 2. Replace your API calls with the enhanced wrapper methods
 * 
 * 3. Replace your logo fetching with the enhanced logo manager
 * 
 * 4. Open the debug panel using the floating button (development only)
 * 
 * 5. Use browser console commands for detailed debugging
 * 
 * 6. Monitor performance and cache hit rates in the debug panel
 */
