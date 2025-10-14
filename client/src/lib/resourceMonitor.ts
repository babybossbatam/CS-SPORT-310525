
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
    // Monitor every 60 seconds
    this.monitorInterval = setInterval(() => {
      this.checkResources();
    }, 60 * 1000);

    console.log('📊 Resource monitor initialized');
  }

  private checkResources(): void {
    try {
      // Check memory
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
        
        if (memoryUsagePercent > 80) {
          console.warn(`⚠️ High memory usage: ${memoryUsagePercent.toFixed(1)}%`);
          this.triggerMemoryCleanup();
        }
      }

      // Check active intervals/timeouts
      const activeTimers = this.countActiveTimers();
      if (activeTimers > 50) {
        console.warn(`⚠️ High number of active timers: ${activeTimers}`);
      }

      // Check DOM nodes
      const domNodes = document.getElementsByTagName('*').length;
      if (domNodes > 5000) {
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
      if (memoryManager) {
        memoryManager.emergencyCleanup?.();
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
  }
}
