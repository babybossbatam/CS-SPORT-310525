
export interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  dataSize: number;
  timestamp: number;
}

class MatchPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100;

  startTiming(componentName: string): () => void {
    const startTime = performance.now();
    
    return (dataSize: number = 0) => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      this.addMetric({
        componentName,
        renderTime,
        dataSize,
        timestamp: Date.now()
      });
      
      if (renderTime > 100) {
        console.warn(`⚠️ [Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render`);
      }
    };
  }

  private addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getAverageRenderTime(componentName: string): number {
    const componentMetrics = this.metrics.filter(m => m.componentName === componentName);
    if (componentMetrics.length === 0) return 0;
    
    const total = componentMetrics.reduce((sum, m) => sum + m.renderTime, 0);
    return total / componentMetrics.length;
  }

  getSlowComponents(): PerformanceMetrics[] {
    return this.metrics.filter(m => m.renderTime > 200);
  }
}

export const matchPerformanceMonitor = new MatchPerformanceMonitor();
