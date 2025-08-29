
class TeamLogoBatchPreloader {
  private preloadedUrls = new Set<string>();
  private preloadQueue: string[] = [];
  private isProcessing = false;
  
  constructor(private maxConcurrent = 6) {}
  
  preloadTeamLogos(logoUrls: string[]): void {
    const newUrls = logoUrls.filter(url => 
      url && 
      !this.preloadedUrls.has(url) && 
      !url.includes('fallback') &&
      !this.preloadQueue.includes(url)
    );
    
    this.preloadQueue.push(...newUrls);
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }
  
  private async processQueue(): Promise<void> {
    if (this.preloadQueue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    const batch = this.preloadQueue.splice(0, this.maxConcurrent);
    
    const promises = batch.map(url => this.preloadSingleImage(url));
    await Promise.allSettled(promises);
    
    // Continue processing remaining queue
    setTimeout(() => this.processQueue(), 100);
  }
  
  private preloadSingleImage(url: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedUrls.add(url);
        console.log(`✅ [TeamLogoBatchPreloader] Preloaded: ${url}`);
        resolve();
      };
      img.onerror = () => {
        console.warn(`❌ [TeamLogoBatchPreloader] Failed to preload: ${url}`);
        resolve();
      };
      img.src = url;
    });
  }
  
  isPreloaded(url: string): boolean {
    return this.preloadedUrls.has(url);
  }
  
  getStats() {
    return {
      preloaded: this.preloadedUrls.size,
      queued: this.preloadQueue.length,
      processing: this.isProcessing
    };
  }
}

export const teamLogoBatchPreloader = new TeamLogoBatchPreloader();

// Helper function to extract team logo URLs from fixtures
export function extractTeamLogosFromFixtures(fixtures: any[]): string[] {
  const logoUrls: string[] = [];
  
  fixtures.forEach(fixture => {
    if (fixture.teams?.home?.logo) {
      logoUrls.push(fixture.teams.home.logo);
    }
    if (fixture.teams?.away?.logo) {
      logoUrls.push(fixture.teams.away.logo);
    }
  });
  
  return logoUrls;
}
