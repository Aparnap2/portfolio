// __tests__/monitoring/metrics-collection.test.ts
import { MetricsCollector, withTiming, PerformanceMonitor, trackCoreWebVitals } from '@/lib/metrics';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}));

describe('Performance Monitoring Integration Tests', () => {
  let metricsCollector: MetricsCollector;

  beforeEach(() => {
    jest.clearAllMocks();
    metricsCollector = MetricsCollector.getInstance();
    metricsCollector.reset();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Metrics Collection and Aggregation', () => {
    it('should collect and aggregate counter metrics', () => {
      // Increment counters
      metricsCollector.increment('api_requests_total', 1, { endpoint: '/api/audit/start' });
      metricsCollector.increment('api_requests_total', 1, { endpoint: '/api/audit/start' });
      metricsCollector.increment('api_requests_total', 1, { endpoint: '/api/audit/chat' });
      metricsCollector.increment('errors_total', 1, { type: 'validation' });

      const metrics = metricsCollector.getMetrics();

      expect(metrics.counters['api_requests_total{endpoint="/api/audit/start"}']).toBe(2);
      expect(metrics.counters['api_requests_total{endpoint="/api/audit/chat"}']).toBe(1);
      expect(metrics.counters['errors_total{type="validation"}']).toBe(1);
    });

    it('should collect and aggregate gauge metrics', () => {
      // Set gauge values
      metricsCollector.gauge('memory_usage', 512);
      metricsCollector.gauge('cpu_usage', 45.5);
      metricsCollector.gauge('memory_usage', 678); // Update value

      const metrics = metricsCollector.getMetrics();

      expect(metrics.gauges['memory_usage']).toBe(678);
      expect(metrics.gauges['cpu_usage']).toBe(45.5);
    });

    it('should collect and aggregate histogram metrics', () => {
      // Add histogram values
      metricsCollector.histogram('response_time', 150, { endpoint: '/api/audit/start' });
      metricsCollector.histogram('response_time', 200, { endpoint: '/api/audit/start' });
      metricsCollector.histogram('response_time', 300, { endpoint: '/api/audit/start' });
      metricsCollector.histogram('response_time', 120, { endpoint: '/api/audit/chat' });

      const metrics = metricsCollector.getMetrics();

      const startEndpoint = metrics.histograms['response_time{endpoint="/api/audit/start"}'];
      expect(startEndpoint.count).toBe(3);
      expect(startEndpoint.sum).toBe(650);
      expect(startEndpoint.min).toBe(150);
      expect(startEndpoint.max).toBe(300);
      expect(startEndpoint.avg).toBe(216.66666666666666);
      expect(startEndpoint.p50).toBe(200);
      expect(startEndpoint.p95).toBe(300);
      expect(startEndpoint.p99).toBe(300);
    });

    it('should collect and aggregate timing metrics', () => {
      // Add timing values
      metricsCollector.timing('operation_duration', 150, { operation: 'database_query' });
      metricsCollector.timing('operation_duration', 200, { operation: 'database_query' });
      metricsCollector.timing('operation_duration', 300, { operation: 'database_query' });
      metricsCollector.timing('operation_duration', 120, { operation: 'redis_get' });

      const metrics = metricsCollector.getMetrics();

      const dbQuery = metrics.timings['operation_duration{operation="database_query"}'];
      expect(dbQuery.count).toBe(3);
      expect(dbQuery.sum).toBe(650);
      expect(dbQuery.min).toBe(150);
      expect(dbQuery.max).toBe(300);
      expect(dbQuery.avg).toBe(216.66666666666666);
      expect(dbQuery.p50).toBe(200);
      expect(dbQuery.p95).toBe(300);
      expect(dbQuery.p99).toBe(300);
    });

  });

  describe('Timing Decorator Integration', () => {
    it('should measure function execution time with withTiming decorator', async () => {
      const mockFunction = jest.fn().mockResolvedValue('result');

      const timedFunction = withTiming(mockFunction, 'test_operation', {
        tags: { component: 'test' },
        trackErrors: true,
      });

      await timedFunction('arg1', 'arg2');

      // Verify function was called
      expect(mockFunction).toHaveBeenCalledWith('arg1', 'arg2');

      // Check that timing was recorded (metrics should have been collected)
      const metrics = metricsCollector.getMetrics();
      expect(metrics.counters['test_operation_calls{component="test"}']).toBe(1);
      expect(metrics.timings['test_operation{component="test",status="success"}']).toBeDefined();
    });

    it('should track errors in timed functions', async () => {
      const mockFunction = jest.fn().mockRejectedValue(new Error('Test error'));

      const timedFunction = withTiming(mockFunction, 'failing_operation', {
        tags: { component: 'test' },
        trackErrors: true,
      });

      await expect(timedFunction()).rejects.toThrow('Test error');

      const metrics = metricsCollector.getMetrics();
      expect(metrics.counters['failing_operation_errors{component="test",error_type="Error"}']).toBe(1);
      expect(metrics.timings['failing_operation{component="test",status="error"}']).toBeDefined();
    });

    it('should handle both sync and async functions', async () => {
      // Test sync function
      const syncFunction = jest.fn().mockReturnValue('sync result');
      const timedSyncFunction = withTiming(syncFunction, 'sync_operation');

      const syncResult = timedSyncFunction();
      expect(syncResult).toBe('sync result');

      // Test async function
      const asyncFunction = jest.fn().mockResolvedValue('async result');
      const timedAsyncFunction = withTiming(asyncFunction, 'async_operation');

      const asyncResult = await timedAsyncFunction();
      expect(asyncResult).toBe('async result');

      const metrics = metricsCollector.getMetrics();
      expect(metrics.counters['sync_operation_calls']).toBe(1);
      expect(metrics.counters['async_operation_calls']).toBe(1);
    });
  });

  describe('Performance Monitor Browser Integration', () => {
    let observerCallbacks: Record<string, (entries: { getEntries: () => any[] }) => void>;

    beforeEach(() => {
      observerCallbacks = {};

      // Mock browser environment
      Object.defineProperty(window, 'PerformanceObserver', {
        value: jest.fn().mockImplementation((callback) => ({
          observe: jest.fn().mockImplementation(({ entryTypes }: { entryTypes?: string[] }) => {
            (entryTypes || []).forEach((type) => {
              observerCallbacks[type] = callback;
            });
          }),
          disconnect: jest.fn(),
        })),
        writable: true,
      });

      Object.defineProperty(window, 'performance', {
        value: {
          timing: {
            loadEventEnd: 1000,
            loadEventStart: 200,
            domContentLoadedEventEnd: 800,
            domContentLoadedEventStart: 100,
            responseStart: 50,
            requestStart: 0,
          },
        },
        writable: true,
      });
    });

    it('should monitor navigation timing', () => {
      const monitor = PerformanceMonitor.getInstance();
      monitor.startMonitoring();

      const navCallback = observerCallbacks['navigation'];
      expect(typeof navCallback).toBe('function');
      const mockEntries = [{
        entryType: 'navigation',
        loadEventEnd: 1000,
        loadEventStart: 200,
        domContentLoadedEventEnd: 800,
        domContentLoadedEventStart: 100,
        responseStart: 50,
        requestStart: 0,
      }];

      navCallback?.({ getEntries: () => mockEntries });

      const metrics = metricsCollector.getMetrics();
      expect(metrics.timings.page_load).toBeDefined();
      expect(metrics.timings.dom_content_loaded).toBeDefined();
      expect(metrics.timings.first_paint).toBeDefined();
    });

    it('should monitor resource loading', () => {
      const monitor = PerformanceMonitor.getInstance();
      monitor.startMonitoring();

      const resourceCallback = observerCallbacks['resource'];
      expect(typeof resourceCallback).toBe('function');

      const mockEntries = [{
        entryType: 'resource',
        duration: 500,
        name: 'https://example.com/api/data',
      }];

      resourceCallback?.({ getEntries: () => mockEntries });

      const metrics = metricsCollector.getMetrics();
      expect(metrics.histograms['resource_load_time{resource_type="api"}']).toBeDefined();
    });

    it('should track Core Web Vitals', () => {
      trackCoreWebVitals();

      // Simulate LCP measurement
      const lcpCallback = observerCallbacks['largest-contentful-paint'];
      expect(typeof lcpCallback).toBe('function');

      const mockEntries = [{ startTime: 2500 }];
      lcpCallback?.({ getEntries: () => mockEntries });

      const metrics = metricsCollector.getMetrics();
      expect(metrics.gauges.lcp).toBe(2500);
    });
  });

  describe('Metrics API Integration', () => {
    it('should expose metrics via API endpoint', async () => {
      // Import the metrics route
      const { GET } = require('@/app/api/metrics/route');

      // Add some test metrics
      metricsCollector.increment('test_metric', 42, { source: 'test' });
      metricsCollector.gauge('test_gauge', 3.14);
      metricsCollector.histogram('test_histogram', 100);

      // Call the API
      const request = new Request('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.timestamp).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.metrics.counters).toBeDefined();
      expect(result.metrics.gauges).toBeDefined();
      expect(result.metrics.histograms).toBeDefined();
      expect(result.metrics.timings).toBeDefined();

      // Check our test metrics
      expect(result.metrics.counters['test_metric{source="test"}']).toBe(42);
      expect(result.metrics.gauges.test_gauge).toBe(3.14);
      expect(result.metrics.histograms.test_histogram).toBeDefined();
    });

    it('should handle metrics API errors gracefully', async () => {
      const { GET } = require('@/app/api/metrics/route');

      // Mock metrics collector to throw error
      const originalGetMetrics = metricsCollector.getMetrics;
      metricsCollector.getMetrics = jest.fn().mockImplementation(() => {
        throw new Error('Metrics collection failed');
      });

      const request = new Request('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toContain('Failed to collect metrics');

      // Restore original method
      metricsCollector.getMetrics = originalGetMetrics;
    });
  });

  describe('Alerting Thresholds and Monitoring', () => {
    it('should detect performance regressions', () => {
      // Establish baseline
      metricsCollector.timing('api_response_time', 100, { endpoint: '/api/test' });
      metricsCollector.timing('api_response_time', 110, { endpoint: '/api/test' });
      metricsCollector.timing('api_response_time', 95, { endpoint: '/api/test' });

      // Add regression measurement
      metricsCollector.timing('api_response_time', 500, { endpoint: '/api/test' });

      const metrics = metricsCollector.getMetrics();
      const timingData = metrics.timings['api_response_time{endpoint="/api/test"}'];

      // Verify regression is captured
      expect(timingData.max).toBe(500);
      expect(timingData.p95).toBe(500);
      expect(timingData.p99).toBe(500);
    });

    it('should track error rates', () => {
      // Simulate successful requests
      for (let i = 0; i < 95; i++) {
        metricsCollector.increment('api_requests_total', 1, { status: '200' });
      }

      // Simulate errors
      for (let i = 0; i < 5; i++) {
        metricsCollector.increment('api_requests_total', 1, { status: '500' });
        metricsCollector.increment('api_errors_total', 1, { type: 'server_error' });
      }

      const metrics = metricsCollector.getMetrics();

      expect(metrics.counters['api_requests_total{status="200"}']).toBe(95);
      expect(metrics.counters['api_requests_total{status="500"}']).toBe(5);
      expect(metrics.counters['api_errors_total{type="server_error"}']).toBe(5);

      // Calculate error rate
      const totalRequests = 95 + 5;
      const errorRate = (5 / totalRequests) * 100;
      expect(errorRate).toBe(5); // 5% error rate
    });

    it('should monitor memory usage trends', () => {
      // Simulate memory usage over time
      const memoryReadings = [100, 120, 110, 130, 125, 140];

      memoryReadings.forEach(reading => {
        metricsCollector.gauge('memory_usage_mb', reading);
      });

      const metrics = metricsCollector.getMetrics();

      // Should have the latest reading
      expect(metrics.gauges.memory_usage_mb).toBe(140);

      // Verify trend can be calculated from multiple readings
      // (In real implementation, this would be stored historically)
    });

    it('should handle metrics overflow gracefully', () => {
      // Add many metrics to test memory handling
      for (let i = 0; i < 1000; i++) {
        metricsCollector.increment(`metric_${i}`, 1, { index: i.toString() });
        metricsCollector.histogram('histogram_test', Math.random() * 1000);
        metricsCollector.timing('timing_test', Math.random() * 100);
      }

      // Should not crash
      const metrics = metricsCollector.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.counters).toBeDefined();
      expect(metrics.histograms).toBeDefined();
      expect(metrics.timings).toBeDefined();
    });
  });

  describe('Metrics Persistence and Recovery', () => {
    it('should reset metrics correctly', () => {
      // Add some metrics
      metricsCollector.increment('test_counter', 5);
      metricsCollector.gauge('test_gauge', 42);
      metricsCollector.histogram('test_histogram', 100);

      // Verify metrics exist
      let metrics = metricsCollector.getMetrics();
      expect(metrics.counters.test_counter).toBe(5);
      expect(metrics.gauges.test_gauge).toBe(42);
      expect(metrics.histograms.test_histogram).toBeDefined();

      // Reset metrics
      metricsCollector.reset();

      // Verify metrics are cleared
      metrics = metricsCollector.getMetrics();
      expect(metrics.counters.test_counter).toBeUndefined();
      expect(metrics.gauges.test_gauge).toBeUndefined();
      expect(metrics.histograms.test_histogram).toBeUndefined();

      // Uptime should be reset
      expect(metrics.uptime).toBeLessThan(1000); // Should be very small after reset
    });

    it('should maintain uptime correctly', () => {
      const initialMetrics = metricsCollector.getMetrics();
      const initialUptime = initialMetrics.uptime;

      // Wait a bit
      return new Promise(resolve => {
        setTimeout(() => {
          const laterMetrics = metricsCollector.getMetrics();
          const laterUptime = laterMetrics.uptime;

          expect(laterUptime).toBeGreaterThan(initialUptime);
          resolve(void 0);
        }, 100);
      });
    });

    it('should handle concurrent metrics updates', async () => {
      const concurrentUpdates = 100;
      const operations = [];

      // Perform concurrent increments
      for (let i = 0; i < concurrentUpdates; i++) {
        operations.push(
          Promise.resolve(metricsCollector.increment('concurrent_counter', 1))
        );
      }

      await Promise.all(operations);

      const metrics = metricsCollector.getMetrics();
      expect(metrics.counters.concurrent_counter).toBe(concurrentUpdates);
    });
  });
});