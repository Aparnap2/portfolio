import * as Sentry from "@sentry/nextjs";

// Enhanced metrics collector with multiple metric types and aggregation
export class MetricsCollector {
  private static instance: MetricsCollector;
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private timers: Map<string, number[]> = new Map();
  private startTime: number = Date.now();

  static getInstance() {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  // Counter metrics (incrementing values)
  increment(key: string, value = 1, tags?: Record<string, string>) {
    const taggedKey = this.addTags(key, tags);
    this.counters.set(taggedKey, (this.counters.get(taggedKey) || 0) + value);
  }

  // Gauge metrics (current values)
  gauge(key: string, value: number, tags?: Record<string, string>) {
    const taggedKey = this.addTags(key, tags);
    this.gauges.set(taggedKey, value);
  }

  // Histogram metrics (distribution of values)
  histogram(key: string, value: number, tags?: Record<string, string>) {
    const taggedKey = this.addTags(key, tags);
    if (!this.histograms.has(taggedKey)) {
      this.histograms.set(taggedKey, []);
    }
    this.histograms.get(taggedKey)!.push(value);
  }

  // Timing metrics (duration measurements)
  timing(key: string, duration: number, tags?: Record<string, string>) {
    const taggedKey = this.addTags(key, tags);
    if (!this.timers.has(taggedKey)) {
      this.timers.set(taggedKey, []);
    }
    this.timers.get(taggedKey)!.push(duration);
  }

  // Get all metrics with aggregations
  getMetrics() {
    const metrics: any = {
      uptime: Date.now() - this.startTime,
      timestamp: new Date().toISOString(),
    };

    // Add counters
    metrics.counters = Object.fromEntries(this.counters);

    // Add gauges
    metrics.gauges = Object.fromEntries(this.gauges);

    // Add histogram aggregations
    metrics.histograms = {};
    for (const [key, values] of this.histograms.entries()) {
      metrics.histograms[key] = {
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p50: this.percentile(values, 50),
        p95: this.percentile(values, 95),
        p99: this.percentile(values, 99),
      };
    }

    // Add timing aggregations
    metrics.timings = {};
    for (const [key, values] of this.timers.entries()) {
      metrics.timings[key] = {
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p50: this.percentile(values, 50),
        p95: this.percentile(values, 95),
        p99: this.percentile(values, 99),
      };
    }

    return metrics;
  }

  // Reset all metrics (useful for testing)
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.timers.clear();
    this.startTime = Date.now();
  }

  private addTags(key: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) return key;
    
    const tagString = Object.entries(tags)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${key}{${tagString}}`;
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

}

// Enhanced timing decorator with error tracking
export function withTiming<T extends (...args: any[]) => any>(
  fn: T,
  metricName: string,
  options: {
    tags?: Record<string, string>;
    trackErrors?: boolean;
    trackArgs?: boolean;
  } = {}
): T {
  const { tags, trackErrors = true, trackArgs = false } = options;
  
  return ((...args: Parameters<T>) => {
    const start = Date.now();
    const metrics = MetricsCollector.getInstance();
    
    // Track function calls
    metrics.increment(`${metricName}_calls`, 1, tags);
    
    try {
      const result = fn(...args);
      
      if (result instanceof Promise) {
        return result
          .then(value => {
            const duration = Date.now() - start;
            metrics.timing(metricName, duration, { ...tags, status: 'success' });
            return value;
          })
          .catch(error => {
            const duration = Date.now() - start;
            metrics.timing(metricName, duration, { ...tags, status: 'error' });
            if (trackErrors) {
              metrics.increment(`${metricName}_errors`, 1, {
                ...tags,
                error_type: (error as Error).constructor.name
              });
            }
            throw error;
          });
      }
      
      const duration = Date.now() - start;
      metrics.timing(metricName, duration, { ...tags, status: 'success' });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      metrics.timing(metricName, duration, { ...tags, status: 'error' });
      if (trackErrors) {
        metrics.increment(`${metricName}_errors`, 1, {
          ...tags,
          error_type: (error as Error).constructor.name
        });
      }
      throw error;
    }
  }) as T;
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: PerformanceObserver[] = [];

  static getInstance() {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring() {
    if (typeof window === 'undefined') return; // Server-side only

    // Monitor navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            const metrics = MetricsCollector.getInstance();
            
            metrics.timing('page_load', navEntry.loadEventEnd - navEntry.loadEventStart);
            metrics.timing('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
            metrics.timing('first_paint', navEntry.responseStart - navEntry.requestStart);
          }
        }
      });
      
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (error) {
      console.warn('Navigation timing not supported:', error);
    }

    // Monitor resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            const metrics = MetricsCollector.getInstance();
            
            metrics.histogram('resource_load_time', resourceEntry.duration, {
              resource_type: this.getResourceType(resourceEntry.name)
            });
          }
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('Resource timing not supported:', error);
    }
  }

  stopMonitoring() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }
}

// Core Web Vitals monitoring
export function trackCoreWebVitals() {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint (LCP)
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      const metrics = MetricsCollector.getInstance();
      metrics.gauge('lcp', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (error) {
    console.warn('LCP monitoring not supported:', error);
  }

  // First Input Delay (FID)
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const metrics = MetricsCollector.getInstance();
        metrics.histogram('fid', (entry as any).processingStart - entry.startTime);
      }
    }).observe({ entryTypes: ['first-input'] });
  } catch (error) {
    console.warn('FID monitoring not supported:', error);
  }

  // Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          const metrics = MetricsCollector.getInstance();
          metrics.gauge('cls', clsValue);
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    console.warn('CLS monitoring not supported:', error);
  }
}
