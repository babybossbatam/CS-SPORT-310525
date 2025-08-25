
interface PreloadedLogo {
  url: string;
  loaded: boolean;
  timestamp: number;
}

class LogoPreloader {
  private preloadedLogos = new Map<string, PreloadedLogo>();
  private preloadQueue: string[] = [];
  private isPreloading = false;

  // Common team IDs that should be preloaded
  private popularTeamIds = [
    33, 34, 35, 36, 40, 41, 42, 47, 49, 50, // Premier League popular teams
    529, 530, 531, 532, 533, 548, 541, 542, // La Liga popular teams
    487, 489, 490, 492, 493, 496, 497, 499, // Serie A popular teams
    154, 157, 165, 168, 173, 172, 164, 169  // Bundesliga popular teams
  ];

  constructor() {
    this.startPreloading();
  }

  private async startPreloading() {
    if (this.isPreloading) return;
    this.isPreloading = true;

    // Preload popular team logos
    for (const teamId of this.popularTeamIds) {
      const logoUrl = `/api/team-logo/square/${teamId}?size=32`;
      this.preloadQueue.push(logoUrl);
    }

    // Process queue with delay to avoid overwhelming the browser
    this.processPreloadQueue();
  }

  private async processPreloadQueue() {
    while (this.preloadQueue.length > 0) {
      const url = this.preloadQueue.shift()!;
      await this.preloadLogo(url);
      // Small delay between preloads to not block UI
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    this.isPreloading = false;
  }

  private async preloadLogo(url: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      
      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
      };

      img.onload = () => {
        this.preloadedLogos.set(url, {
          url,
          loaded: true,
          timestamp: Date.now()
        });
        cleanup();
        resolve();
      };

      img.onerror = () => {
        cleanup();
        resolve(); // Don't fail the preloading process
      };

      // Set timeout for preloading
      setTimeout(() => {
        cleanup();
        resolve();
      }, 2000);

      img.src = url;
    });
  }

  isLogoPreloaded(url: string): boolean {
    const preloaded = this.preloadedLogos.get(url);
    if (!preloaded) return false;

    // Check if preloaded logo is still fresh (5 minutes)
    const age = Date.now() - preloaded.timestamp;
    return age < 5 * 60 * 1000 && preloaded.loaded;
  }

  preloadTeamLogo(teamId: number): void {
    const logoUrl = `/api/team-logo/square/${teamId}?size=32`;
    if (!this.preloadedLogos.has(logoUrl)) {
      this.preloadQueue.push(logoUrl);
      if (!this.isPreloading) {
        this.processPreloadQueue();
      }
    }
  }
}

export const logoPreloader = new LogoPreloader();
