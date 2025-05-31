
interface ImageCache {
  [key: string]: HTMLImageElement;
}

class ImagePreloader {
  private cache: ImageCache = {};
  private preloadQueue: Set<string> = new Set();
  private maxCacheSize = 500; // Limit cache size to prevent memory issues

  /**
   * Preload an image and store it in cache
   */
  async preloadImage(url: string): Promise<HTMLImageElement> {
    // Return cached image if available
    if (this.cache[url]) {
      return this.cache[url];
    }

    // Don't preload the same image multiple times
    if (this.preloadQueue.has(url)) {
      return new Promise((resolve) => {
        const checkCache = () => {
          if (this.cache[url]) {
            resolve(this.cache[url]);
          } else {
            setTimeout(checkCache, 50);
          }
        };
        checkCache();
      });
    }

    this.preloadQueue.add(url);

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // Clean cache if it's getting too large
        if (Object.keys(this.cache).length >= this.maxCacheSize) {
          this.cleanCache();
        }
        
        this.cache[url] = img;
        this.preloadQueue.delete(url);
        resolve(img);
      };

      img.onerror = () => {
        this.preloadQueue.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };

      // Set crossOrigin to handle CORS issues
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  }

  /**
   * Preload multiple images concurrently
   */
  async preloadImages(urls: string[]): Promise<HTMLImageElement[]> {
    const promises = urls.map(url => this.preloadImage(url).catch(() => null));
    const results = await Promise.all(promises);
    return results.filter(img => img !== null) as HTMLImageElement[];
  }

  /**
   * Get cached image or return null if not available
   */
  getCachedImage(url: string): HTMLImageElement | null {
    return this.cache[url] || null;
  }

  /**
   * Check if image is cached
   */
  isImageCached(url: string): boolean {
    return !!this.cache[url];
  }

  /**
   * Clean cache by removing oldest entries
   */
  private cleanCache(): void {
    const entries = Object.entries(this.cache);
    const toRemove = Math.floor(this.maxCacheSize * 0.3); // Remove 30% of cache
    
    // Remove first N entries (oldest in insertion order)
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      delete this.cache[entries[i][0]];
    }
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.cache = {};
    this.preloadQueue.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; queueSize: number } {
    return {
      size: Object.keys(this.cache).length,
      maxSize: this.maxCacheSize,
      queueSize: this.preloadQueue.size
    };
  }

  /**
   * Preload flag images for countries
   */
  async preloadCountryFlags(countries: string[]): Promise<void> {
    const flagUrls = countries.map(country => {
      if (!country) return null;
      const countryCode = country.toLowerCase().replace(/\s+/g, '-');
      return `https://flagsapi.com/${countryCode.toUpperCase()}/flat/32.png`;
    }).filter(Boolean) as string[];

    try {
      await this.preloadImages(flagUrls);
    } catch (error) {
      console.warn('Some flag images failed to preload:', error);
    }
  }

  /**
   * Preload team logos
   */
  async preloadTeamLogos(logoUrls: string[]): Promise<void> {
    const validUrls = logoUrls.filter(url => url && url !== '/assets/fallback-logo.png');
    
    try {
      await this.preloadImages(validUrls);
    } catch (error) {
      console.warn('Some team logos failed to preload:', error);
    }
  }

  /**
   * Preload league logos
   */
  async preloadLeagueLogos(logoUrls: string[]): Promise<void> {
    const validUrls = logoUrls.filter(url => url && url.startsWith('http'));
    
    try {
      await this.preloadImages(validUrls);
    } catch (error) {
      console.warn('Some league logos failed to preload:', error);
    }
  }
}

// Create singleton instance
export const imagePreloader = new ImagePreloader();

// Hook for React components
export const useImagePreloader = () => {
  return {
    preloadImage: imagePreloader.preloadImage.bind(imagePreloader),
    preloadImages: imagePreloader.preloadImages.bind(imagePreloader),
    getCachedImage: imagePreloader.getCachedImage.bind(imagePreloader),
    isImageCached: imagePreloader.isImageCached.bind(imagePreloader),
    preloadCountryFlags: imagePreloader.preloadCountryFlags.bind(imagePreloader),
    preloadTeamLogos: imagePreloader.preloadTeamLogos.bind(imagePreloader),
    preloadLeagueLogos: imagePreloader.preloadLeagueLogos.bind(imagePreloader),
    getCacheStats: imagePreloader.getCacheStats.bind(imagePreloader)
  };
};

// Utility function to get optimized image src with preloading
export const getOptimizedImageSrc = (url: string, fallback: string = '/assets/fallback-logo.png'): string => {
  if (!url) return fallback;
  
  // Check if image is already cached
  const cached = imagePreloader.getCachedImage(url);
  if (cached) {
    return url;
  }
  
  // Start preloading the image in background
  imagePreloader.preloadImage(url).catch(() => {
    // Silently fail and use fallback
  });
  
  return url; // Return original URL, let onError handle fallback
};

export default imagePreloader;
