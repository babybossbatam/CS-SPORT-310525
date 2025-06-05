
import { recreateAllCustomFlags, generateCustomFlag } from './flagUtils';
import { flagCache } from './flagUtils';

/**
 * Recreate all national team flags and provide progress updates
 */
export async function recreateAllNationalTeamFlagsWithProgress(
  onProgress?: (progress: number, total: number, current: string) => void
): Promise<void> {
  console.log('🚀 Starting national team flag recreation process...');
  
  try {
    // Get all countries from cache
    const cache = (flagCache as any).cache;
    if (!(cache instanceof Map)) {
      throw new Error('Flag cache not available');
    }

    const countries = Array.from(cache.keys())
      .filter(key => key.startsWith('flag_'))
      .map(key => key.replace('flag_', '').replace(/_/g, ' '))
      .filter(country => !['world', 'europe'].includes(country.toLowerCase()));

    console.log(`📊 Found ${countries.length} countries to process`);

    let completed = 0;
    const results: { [country: string]: boolean } = {};

    // Process countries one by one with progress updates
    for (const country of countries) {
      try {
        onProgress?.(completed, countries.length, country);
        
        await generateCustomFlag(country);
        results[country] = true;
        completed++;
        
        console.log(`✅ [${completed}/${countries.length}] Generated custom flag for ${country}`);
      } catch (error) {
        console.warn(`❌ [${completed + 1}/${countries.length}] Failed to generate flag for ${country}:`, error);
        results[country] = false;
        completed++;
      }

      // Small delay to prevent browser blocking
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const successCount = Object.values(results).filter(success => success).length;
    console.log(`🎉 Flag recreation completed! ${successCount}/${countries.length} flags generated successfully`);
    
    // Trigger a cache save
    if (typeof (flagCache as any).saveFlagCacheToStorage === 'function') {
      (flagCache as any).saveFlagCacheToStorage();
    }
    
  } catch (error) {
    console.error('❌ Failed to recreate flags:', error);
    throw error;
  }
}

/**
 * Get statistics about custom flags
 */
export function getCustomFlagStats(): {
  total: number;
  custom: number;
  original: number;
  percentage: number;
} {
  const cache = (flagCache as any).cache;
  if (!(cache instanceof Map)) {
    return { total: 0, custom: 0, original: 0, percentage: 0 };
  }

  let total = 0;
  let custom = 0;

  for (const [key, value] of cache.entries()) {
    if (key.startsWith('flag_') && !key.includes('world') && !key.includes('europe')) {
      total++;
      if (value.url.startsWith('data:image/svg+xml') && value.url.includes('flagGradient')) {
        custom++;
      }
    }
  }

  const original = total - custom;
  const percentage = total > 0 ? Math.round((custom / total) * 100) : 0;

  return { total, custom, original, percentage };
}

/**
 * Reset all custom flags back to original cached versions
 */
export async function resetToOriginalFlags(): Promise<void> {
  console.log('🔄 Resetting all flags to original versions...');
  
  const cache = (flagCache as any).cache;
  if (!(cache instanceof Map)) {
    console.warn('Flag cache not available');
    return;
  }

  let resetCount = 0;
  
  for (const [key, value] of cache.entries()) {
    if (key.startsWith('flag_') && value.url.startsWith('data:image/svg+xml') && value.url.includes('flagGradient')) {
      // Mark for re-fetching by clearing the cache entry
      cache.delete(key);
      resetCount++;
    }
  }

  console.log(`🔄 Reset ${resetCount} custom flags. They will be re-fetched as needed.`);
}
