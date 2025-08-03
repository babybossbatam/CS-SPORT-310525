
interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiCalls: number;
  cacheHits: number;
  cacheMisses: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  private startTime: number = performance.now();

  startMeasure(name: string): void {
    performance.mark(`${name}-start`);
  }

  endMeasure(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    return measure.duration;
  }

  recordApiCall(): void {
    this.metrics.apiCalls++;
  }

  recordCacheHit(): void {
    this.metrics.cacheHits++;
  }

  recordCacheMiss(): void {
    this.metrics.cacheMisses++;
  }

  getMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      loadTime: performance.now() - this.startTime,
    };
  }

  logMetrics(): void {
    const metrics = this.getMetrics();
    console.log('🚀 Performance Metrics:', {
      'Load Time': `${metrics.loadTime.toFixed(2)}ms`,
      'API Calls': metrics.apiCalls,
      'Cache Hit Rate': `${((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(1)}%`,
    });
  }
}

export const performanceMonitor = new PerformanceMonitor();
