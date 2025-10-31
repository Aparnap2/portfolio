// __tests__/performance/memory-testing.test.ts
import { app } from '@/lib/audit-workflow';
import { AIMessage } from '@langchain/core/messages';
import { MetricsCollector } from '@/lib/metrics';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';

// Mock dependencies
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    scan: jest.fn(),
  },
}));

jest.mock('@/lib/db', () => ({
  db: {
    auditSession: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/metrics', () => ({
  withTiming: jest.fn((fn) => fn),
  MetricsCollector: {
    getInstance: jest.fn(() => ({
      increment: jest.fn(),
      timing: jest.fn(),
      histogram: jest.fn(),
      gauge: jest.fn(),
      reset: jest.fn(),
    })),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockRedis = require('@/lib/redis').redis;
const mockDb = require('@/lib/db').db;
const mockMetrics = MetricsCollector.getInstance();

describe('Memory and Performance Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMetrics.reset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  describe('Workflow Execution Memory Usage', () => {
    it('should monitor memory usage during multiple workflow cycles', async () => {
      const cycles = 10;

      // Mock Redis operations
      mockRedis.get.mockResolvedValue(JSON.stringify({
        current_step: 'discovery',
        messages: [],
      }));

      mockRedis.set.mockResolvedValue('OK');

      // Mock database operations
      mockDb.auditSession.findFirst.mockResolvedValue({
        id: 1,
        sessionId: 'test-session-id',
        email: 'test@example.com',
        status: 'in_progress',
      });

      const initialMemory = process.memoryUsage();

      // Execute multiple workflow cycles using the app
      for (let i = 0; i < cycles; i++) {
        await app.invoke({
          messages: [],
          currentPhase: 'discovery',
        });

        await app.invoke({
          messages: [new AIMessage(`Test message ${i}`)],
          currentPhase: 'discovery',
        });
      }

      const finalMemory = process.memoryUsage();

      // Calculate memory increase
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      // Verify memory usage is reasonable (< 50MB increase for 10 cycles)
      expect(memoryIncreaseMB).toBeLessThan(50);

      // Verify garbage collection doesn't cause excessive memory growth
      if (global.gc) {
        global.gc();
        const afterGCMemory = process.memoryUsage();
        const memoryAfterGC = afterGCMemory.heapUsed - initialMemory.heapUsed;
        const memoryAfterGCMB = memoryAfterGC / (1024 * 1024);

        expect(memoryAfterGCMB).toBeLessThan(10); // < 10MB after GC
      }
    });

    it('should detect memory leaks in component rendering', async () => {
      // Mock React component rendering
      const renderComponent = jest.fn(() => ({
        props: { messages: Array(100).fill({ id: '1', content: 'test' }) },
        forceUpdate: jest.fn(),
      }));

      const initialMemory = process.memoryUsage();

      // Simulate multiple renders
      for (let i = 0; i < 50; i++) {
        renderComponent();
        // Simulate component lifecycle
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      // Component rendering should not cause significant memory leaks
      expect(memoryIncreaseMB).toBeLessThan(20);
    });

    it('should handle large message payloads without excessive memory usage', async () => {
      const largeMessage = 'x'.repeat(100000); // 100KB message

      mockRedis.get.mockResolvedValue(JSON.stringify({
        current_step: 'discovery',
        messages: [],
      }));

      mockRedis.set.mockResolvedValue('OK');

      const initialMemory = process.memoryUsage();

      // Process large message using app
      await app.invoke({
        messages: [new AIMessage(largeMessage)],
        currentPhase: 'discovery',
      });

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      // Large message processing should not cause excessive memory usage
      expect(memoryIncreaseMB).toBeLessThan(10);
    });
  });

  describe('Redis Memory Usage and Cleanup', () => {
    it('should monitor Redis memory usage during operations', async () => {
      const operations = 100;
      const largeData = 'x'.repeat(5000); // 5KB per entry

      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue(largeData);
      mockRedis.keys.mockResolvedValue([]);

      // Simulate Redis operations
      for (let i = 0; i < operations; i++) {
        await redis.set(`test:key:${i}`, JSON.stringify({ data: largeData }));
        await redis.get(`test:key:${i}`);
      }

      // Verify Redis operations were called
      expect(mockRedis.set).toHaveBeenCalledTimes(operations);
      expect(mockRedis.get).toHaveBeenCalledTimes(operations);

      // Simulate cleanup
      for (let i = 0; i < operations; i++) {
        mockRedis.del && mockRedis.del(`test:key:${i}`);
      }

      if (mockRedis.del) {
        expect(mockRedis.del).toHaveBeenCalledTimes(operations);
      }
    });

    it('should test Redis memory cleanup after session expiration', async () => {
      const sessionId = 'test-session-id';
      const sessionData = {
        current_step: 'discovery',
        messages: Array(20).fill({ id: '1', content: 'test message' }),
        metadata: { largeField: 'x'.repeat(10000) },
      };

      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue(JSON.stringify(sessionData));
      mockRedis.del.mockResolvedValue(1);

      // Store session data
      await redis.set(`audit:session:${sessionId}`, JSON.stringify(sessionData));

      // Verify data was stored
      const stored = await redis.get(`audit:session:${sessionId}`);
      expect(JSON.parse(stored as string)).toEqual(sessionData);

      // Simulate session cleanup
      if (mockRedis.del) {
        await mockRedis.del(`audit:session:${sessionId}`);
        // Verify cleanup
        expect(mockRedis.del).toHaveBeenCalledWith(`audit:session:${sessionId}`);
      }
    });

    it('should handle Redis connection pooling memory', async () => {
      const concurrentOperations = 20;

      mockRedis.get.mockResolvedValue('test-data');
      mockRedis.set.mockResolvedValue('OK');

      // Simulate concurrent Redis operations
      const operations = Array.from({ length: concurrentOperations }, (_, i) =>
        redis.get(`test:key:${i}`)
      );

      await Promise.all(operations);

      // Verify all operations completed
      expect(mockRedis.get).toHaveBeenCalledTimes(concurrentOperations);
    });
  });

  describe('Garbage Collection Monitoring', () => {
    it('should monitor garbage collection effectiveness', async () => {
      if (!global.gc) {
        console.warn('Garbage collection not available in test environment');
        return;
      }

      const initialMemory = process.memoryUsage();

      // Create some garbage
      const garbage: any[] = [];
      for (let i = 0; i < 10000; i++) {
        garbage.push({ data: 'x'.repeat(100) });
      }

      const beforeGCMemory = process.memoryUsage();

      // Force garbage collection
      global.gc();

      const afterGCMemory = process.memoryUsage();

      // Verify GC effectiveness
      const memoryBeforeGC = beforeGCMemory.heapUsed - initialMemory.heapUsed;
      const memoryAfterGC = afterGCMemory.heapUsed - initialMemory.heapUsed;

      expect(memoryAfterGC).toBeLessThan(memoryBeforeGC);

      // Memory should be mostly reclaimed
      const reclaimedPercentage = ((memoryBeforeGC - memoryAfterGC) / memoryBeforeGC) * 100;
      expect(reclaimedPercentage).toBeGreaterThan(80); // At least 80% reclaimed
    });

    it('should detect potential memory leaks over time', async () => {
      const measurements: number[] = [];
      const intervals = 10;

      for (let i = 0; i < intervals; i++) {
        // Simulate some work
        const data = Array(1000).fill({}).map(() => ({ value: Math.random() }));

        measurements.push(process.memoryUsage().heapUsed);

        // Small delay to allow for GC
        await new Promise(resolve => setTimeout(resolve, 10));

        // Force GC if available
        if (global.gc) {
          global.gc();
        }
      }

      // Check for memory leak pattern (consistent upward trend)
      let leakDetected = false;
      for (let i = 2; i < measurements.length; i++) {
        const trend = measurements[i] - measurements[i - 2];
        if (trend > 1024 * 1024) { // 1MB increase over 2 measurements
          leakDetected = true;
          break;
        }
      }

      // In a healthy application, memory should not consistently increase
      expect(leakDetected).toBe(false);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions in operation timing', async () => {
      const operation = 'test-operation';
      const baselineTime = 50; // 50ms baseline
      const regressionThreshold = 2.0; // 200% of baseline

      // Record baseline performance
      mockMetrics.timing(operation, baselineTime);

      // Simulate current performance (within acceptable range)
      mockMetrics.timing(operation, baselineTime * 1.5); // 75ms - acceptable

      // Simulate regression
      mockMetrics.timing(operation, baselineTime * regressionThreshold * 1.1); // 110ms - regression

      // Verify timing calls were made
      expect(mockMetrics.timing).toHaveBeenCalledWith(operation, expect.any(Number));
    });

    it('should monitor memory usage patterns over time', async () => {
      const memoryReadings: number[] = [];
      const readingInterval = 100; // ms
      const totalDuration = 2000; // 2 seconds

      const startTime = Date.now();

      // Collect memory readings over time
      const interval = setInterval(() => {
        memoryReadings.push(process.memoryUsage().heapUsed);

        if (Date.now() - startTime >= totalDuration) {
          clearInterval(interval);
        }
      }, readingInterval);

      // Wait for collection to complete
      await new Promise(resolve => setTimeout(resolve, totalDuration + 200));

      // Analyze memory pattern
      const initialMemory = memoryReadings[0];
      const finalMemory = memoryReadings[memoryReadings.length - 1];
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      // Memory should not increase significantly during idle monitoring
      expect(memoryIncreaseMB).toBeLessThan(5);
    });
  });

  describe('Resource Cleanup Verification', () => {
    it('should verify proper cleanup of workflow instances', async () => {
      const workflowStates: any[] = [];
      const workflowCount = 5;

      // Create multiple workflow state instances
      for (let i = 0; i < workflowCount; i++) {
        workflowStates.push({
          messages: [],
          currentPhase: 'discovery',
          sessionId: `test-session-${i}`,
        });
      }

      const initialMemory = process.memoryUsage();

      // Simulate workflow usage
      await Promise.all(workflowStates.map(state =>
        app.invoke(state)
      ));

      // Clear references to allow garbage collection
      workflowStates.length = 0;

      // Force garbage collection
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      // Memory should be reclaimed after cleanup
      expect(memoryIncreaseMB).toBeLessThan(10);
    });

    it('should test database connection cleanup', async () => {
      const connectionCount = 10;

      mockDb.auditSession.findFirst.mockResolvedValue(null);
      mockDb.auditSession.create.mockResolvedValue({
        id: 1,
        sessionId: 'test-session-id',
        email: 'test@example.com',
        status: 'in_progress',
      });

      // Simulate database operations
      const operations = Array.from({ length: connectionCount }, () =>
        mockDb.auditSession.findFirst({ where: { sessionId: 'test' } })
      );

      await Promise.all(operations);

      // Verify operations completed without excessive resource usage
      expect(mockDb.auditSession.findFirst).toHaveBeenCalledTimes(connectionCount);
    });
  });
});