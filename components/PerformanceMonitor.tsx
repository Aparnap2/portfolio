'use client';

import { useEffect } from 'react';
import { MetricsCollector } from '@/lib/metrics';

export function PerformanceMonitor() {
  useEffect(() => {
    const metrics = MetricsCollector.getInstance();
    
    // Monitor Core Web Vitals
    if (typeof window !== 'undefined' && 'performance' in window) {
      // First Contentful Paint
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            metrics.timing('web_vitals.fcp', entry.startTime);
          }
          
          if (entry.entryType === 'largest-contentful-paint') {
            metrics.timing('web_vitals.lcp', entry.startTime);
          }
          
          if (entry.entryType === 'first-input') {
            metrics.timing('web_vitals.fid', (entry as any).processingStart - entry.startTime);
          }
          
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            metrics.gauge('web_vitals.cls', (entry as any).value);
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
      } catch (e) {
        // Fallback for browsers that don't support all entry types
        observer.observe({ entryTypes: ['paint'] });
      }
      
      // Memory usage
      if ('memory' in performance) {
        const memoryInfo = (performance as any).memory;
        metrics.gauge('memory.used', memoryInfo.usedJSHeapSize);
        metrics.gauge('memory.total', memoryInfo.totalJSHeapSize);
        metrics.gauge('memory.limit', memoryInfo.jsHeapSizeLimit);
      }
      
      return () => observer.disconnect();
    }
  }, []);

  return null;
}