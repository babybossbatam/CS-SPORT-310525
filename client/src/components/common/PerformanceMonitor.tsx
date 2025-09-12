
import React, { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint  
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const measurePerformance = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const newMetrics: Partial<PerformanceMetrics> = {};

          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              newMetrics.fcp = entry.startTime;
            }
            if (entry.entryType === 'largest-contentful-paint') {
              newMetrics.lcp = entry.startTime;
            }
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              newMetrics.cls = (newMetrics.cls || 0) + entry.value;
            }
            if (entry.entryType === 'first-input') {
              newMetrics.fid = entry.processingStart - entry.startTime;
            }
          });

          setMetrics(prev => ({ ...prev, ...newMetrics } as PerformanceMetrics));
        });

        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });

        return () => observer.disconnect();
      }
    };

    measurePerformance();
  }, []);

  useEffect(() => {
    if (metrics) {
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Performance Metrics:', {
          FCP: `${metrics.fcp?.toFixed(2)}ms`,
          LCP: `${metrics.lcp?.toFixed(2)}ms`, 
          CLS: metrics.cls?.toFixed(3),
          FID: `${metrics.fid?.toFixed(2)}ms`
        });

        // Warn if metrics exceed thresholds
        if (metrics.lcp > 2500) console.warn('⚠️ LCP is slow:', metrics.lcp);
        if (metrics.cls > 0.1) console.warn('⚠️ CLS is high:', metrics.cls);
        if (metrics.fid > 100) console.warn('⚠️ FID is slow:', metrics.fid);
      }
    }
  }, [metrics]);

  return null; // This component doesn't render anything
};

export default PerformanceMonitor;
