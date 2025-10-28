
export class ResourceMonitor {
  private static instance: ResourceMonitor;
  private monitorInterval: NodeJS.Timeout | null = null;

  static getInstance(): ResourceMonitor {
    if (!ResourceMonitor.instance) {
      ResourceMonitor.instance = new ResourceMonitor();
    }
    return ResourceMonitor.instance;
  }

  init(): void {
    // Monitor every 3 minutes to reduce overhead
    this.monitorInterval = setInterval(() => {
      this.checkResources();
    }, 180 * 1000);

    console.log('📊 Resource monitor initialized with balanced intervals');
  }

  private checkResources(): void {
    try {
      // Check memory with higher threshold
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
        
        if (memoryUsagePercent > 85) { // Increased threshold
          console.warn(`⚠️ High memory usage: ${memoryUsagePercent.toFixed(1)}%`);
          this.triggerMemoryCleanup();
        }
      }

      // Check active intervals/timeouts with higher threshold
      const activeTimers = this.countActiveTimers();
      if (activeTimers > 100) { // Increased threshold
        console.warn(`⚠️ High number of active timers: ${activeTimers}`);
      }

      // Check DOM nodes with higher threshold
      const domNodes = document.getElementsByTagName('*').length;
      if (domNodes > 8000) { // Increased threshold
        console.warn(`⚠️ High DOM node count: ${domNodes}`);
      }

    } catch (error) {
      console.error('Resource monitoring error:', error);
    }
  }

  private countActiveTimers(): number {
    // Rough estimate of active timers
    let count = 0;
    try {
      // This is an approximation since we can't directly count all timers
      count = (window as any)._activeHandles?.length || 0;
    } catch (e) {
      count = 0;
    }
    return count;
  }

  private triggerMemoryCleanup(): void {
    // Trigger cleanup in memory manager
    try {
      const memoryManager = (window as any).MemoryManager?.getInstance();
      if (memoryManager && typeof memoryManager.emergencyCleanup === 'function') {
        memoryManager.emergencyCleanup();
      }
    } catch (error) {
      console.error('Failed to trigger memory cleanup:', error);
    }
  }

  destroy(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    console.log('📊 Resource monitor destroyed');
  }
}

// DISABLED: Auto-initialization causes continuous background process that freezes Replit IDE
// If needed, manually call ResourceMonitor.getInstance().init() from a specific component
// if (typeof window !== 'undefined') {
//   ResourceMonitor.getInstance().init();
// }
