
// Performance monitoring specifically for match components
interface ComponentMetrics {
  renderTime: number;
  dataSize: number;
  componentType: string;
  timestamp: number;
  memoryUsage?: number;
}

class MatchComponentMonitor {
  private metrics: ComponentMetrics[] = [];
  private readonly maxMetrics = 50; // Reduced for better memory usage
  private performanceObserver?: PerformanceObserver;

  constructor() {
    this.initializeObserver();
  }

  private initializeObserver() {
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name.includes('TodaysMatchesByCountryNew')) {
              console.log(`🎯 [Component Performance] ${entry.name}: ${entry.duration}ms`);
            }
          });
        });
        this.performanceObserver.observe({ entryTypes: ['measure'] });
      } catch (e) {
        console.warn('PerformanceObserver not supported');
      }
    }
  }

  startTiming(componentType: string): () => void {
    const startTime = performance.now();
    
    return (dataSize: number = 0) => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      this.addMetric({
        componentType,
        renderTime,
        dataSize,
        timestamp: Date.now(),
        memoryUsage: (performance as any).memory?.usedJSHeapSize
      });
      
      // Performance warnings
      if (renderTime > 50) {
        console.warn(`⚠️ [Performance] ${componentType} slow render: ${renderTime.toFixed(2)}ms`);
      }
      
      if (renderTime > 200) {
        console.error(`🚨 [Performance] ${componentType} blocking render: ${renderTime.toFixed(2)}ms`);
      }
    };
  }

  private addMetric(metric: ComponentMetrics) {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getPerformanceReport(): {
    averageRenderTime: number;
    slowestComponent: string;
    totalDataProcessed: number;
    memoryTrend: 'increasing' | 'stable' | 'decreasing';
  } {
    if (this.metrics.length === 0) {
      return {
        averageRenderTime: 0,
        slowestComponent: 'none',
        totalDataProcessed: 0,
        memoryTrend: 'stable'
      };
    }

    const avgRenderTime = this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.length;
    const slowest = this.metrics.reduce((max, m) => m.renderTime > max.renderTime ? m : max);
    const totalData = this.metrics.reduce((sum, m) => sum + m.dataSize, 0);
    
    // Memory trend analysis
    const recentMetrics = this.metrics.slice(-10);
    const memoryTrend = this.analyzeMemoryTrend(recentMetrics);

    return {
      averageRenderTime: Math.round(avgRenderTime * 100) / 100,
      slowestComponent: slowest.componentType,
      totalDataProcessed: totalData,
      memoryTrend
    };
  }

  private analyzeMemoryTrend(metrics: ComponentMetrics[]): 'increasing' | 'stable' | 'decreasing' {
    if (metrics.length < 3) return 'stable';
    
    const memoryValues = metrics
      .filter(m => m.memoryUsage)
      .map(m => m.memoryUsage!);
    
    if (memoryValues.length < 3) return 'stable';
    
    const first = memoryValues[0];
    const last = memoryValues[memoryValues.length - 1];
    const diff = (last - first) / first;
    
    if (diff > 0.1) return 'increasing';
    if (diff < -0.1) return 'decreasing';
    return 'stable';
  }

  cleanup() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.metrics = [];
  }
}

export const matchComponentMonitor = new MatchComponentMonitor();

// React hook for easy performance monitoring
export const useComponentPerformance = (componentName: string) => {
  const startTimingRef = React.useRef<(() => void) | null>(null);
  
  React.useEffect(() => {
    startTimingRef.current = matchComponentMonitor.startTiming(componentName);
    
    return () => {
      if (startTimingRef.current) {
        startTimingRef.current(0);
      }
    };
  }, [componentName]);
  
  return {
    finishTiming: (dataSize: number = 0) => {
      if (startTimingRef.current) {
        startTimingRef.current(dataSize);
      }
    }
  };
};
