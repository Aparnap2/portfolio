'use client';
import { useEffect, useState } from 'react';

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance) return;

    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
      const lcp = paint.find(entry => entry.name === 'largest-contentful-paint');

      const metrics = {
        fcp: fcp?.startTime || 0,
        lcp: lcp?.startTime || 0,
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
        loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart || 0
      };

      setMetrics(metrics);

      // Report to analytics if available
      if (window.gtag) {
        window.gtag('event', 'timing_complete', {
          name: 'load',
          value: Math.round(metrics.loadComplete)
        });
      }
    };

    // Wait for load to complete
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
    }

    return () => window.removeEventListener('load', measurePerformance);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || !metrics) return null;

  return (
    <div className="fixed top-0 left-0 bg-black/80 text-white text-xs p-2 z-50 font-mono">
      <div>FCP: {Math.round(metrics.fcp)}ms</div>
      <div>LCP: {Math.round(metrics.lcp)}ms</div>
      <div>Load: {Math.round(metrics.loadComplete)}ms</div>
    </div>
  );
};