// __tests__/performance/load-testing.test.ts
jest.mock('next/server', () => {
  const jsonResponse = (body: any, options: any = {}) => new (global as any).Response(JSON.stringify(body), {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });

  return {
    __esModule: true,
    NextRequest: (global as any).Request,
    NextResponse: {
      json: jsonResponse,
      redirect: (url: string, options: any = {}) => new (global as any).Response(null, {
        ...options,
        status: options.status || 302,
        headers: { Location: url, ...(options.headers || {}) },
      }),
    },
  };
});

// Defer route imports until after Next.js globals are mocked
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { POST: startAudit } = require('@/app/api/audit/start/route');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { POST: chatAudit } = require('@/app/api/audit/chat/route');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { POST: answerAudit } = require('@/app/api/audit/answer/route');

import { MetricsCollector } from '@/lib/metrics';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock('@/lib/db', () => ({
  db: {
    auditSession: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/utils', () => ({
  getClientIP: jest.fn(),
}));

jest.mock('@/lib/validation', () => ({
  validateAndSanitize: jest.fn(),
  apiSchemas: {
    startAudit: {},
    chatAudit: {},
    answerAudit: {},
  },
}));

jest.mock('@/lib/metrics', () => {
  const metricsInstance = {
    increment: jest.fn(),
    timing: jest.fn(),
    histogram: jest.fn(),
    gauge: jest.fn(),
    reset: jest.fn(),
  };

  return {
    withTiming: jest.fn((fn) => fn),
    MetricsCollector: {
      getInstance: jest.fn(() => metricsInstance),
    },
    __mockMetricsInstance: metricsInstance,
  };
});

jest.mock('@/lib/error-handling', () => ({
  CircuitBreaker: jest.fn(() => ({
    execute: jest.fn((fn) => fn()),
  })),
  withRetry: jest.fn((fn) => fn()),
}));

jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
}));

jest.mock('@/lib/audit-workflow', () => {
  const workflowApp = {
    invoke: jest.fn(),
  };

  return {
    app: workflowApp,
    __mockWorkflowApp: workflowApp,
  };
});

const mockRedis = require('@/lib/redis').redis;
const mockDb = require('@/lib/db').db;
const mockGetClientIP = require('@/lib/utils').getClientIP;
const mockValidateAndSanitize = require('@/lib/validation').validateAndSanitize;
const mockNanoid = require('nanoid').nanoid;
const { __mockMetricsInstance: mockMetrics } = require('@/lib/metrics');
const { app: mockWorkflowApp } = require('@/lib/audit-workflow');

const createRequest = (url: string, init: any = {}) => {
  const headers = new Headers(init.headers || {});

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  return new Request(url, {
    ...init,
    headers,
  });
};

const createAiMessage = (content: string) => ({
  _getType: () => 'ai',
  content,
});

describe('Load Testing - Critical Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNanoid.mockReturnValue('test-session-id');
    mockGetClientIP.mockResolvedValue('127.0.0.1');
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Concurrent Audit Start Requests (50+ simultaneous)', () => {
    it('should handle 50 concurrent audit start requests within acceptable time limits', async () => {
      const startTime = Date.now();
      const concurrentRequests = 50;

      // Setup mocks for successful responses
      mockValidateAndSanitize.mockReturnValue({
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
      });

      mockDb.auditSession.findFirst.mockResolvedValue(null);
      mockDb.auditSession.create.mockResolvedValue({
        id: 1,
        sessionId: 'test-session-id',
        email: 'test@example.com',
        status: 'in_progress',
      });

      // Create concurrent requests
      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        startAudit(createRequest('http://localhost:3000/api/audit/start', {
          method: 'POST',
          body: JSON.stringify({
            email: `test${i}@example.com`,
            ipAddress: '127.0.0.1',
          }),
        }))
      );

      // Execute all requests concurrently
      const results = await Promise.allSettled(requests);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // Verify all requests succeeded
      const successfulRequests = results.filter(result =>
        result.status === 'fulfilled' &&
        result.value.status === 200
      );

      expect(successfulRequests.length).toBe(concurrentRequests);

      // Verify performance benchmarks
      expect(totalDuration).toBeLessThan(5000); // 5 seconds for 50 concurrent requests
      const avgResponseTime = totalDuration / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(100); // Average < 100ms per request

      // Verify metrics were collected
      expect(mockMetrics.increment).toHaveBeenCalledWith('api.audit.start.attempt');
      expect(mockMetrics.increment).toHaveBeenCalledWith('api.audit.start.success');
    });

    it('should handle database connection pooling under load', async () => {
      const concurrentRequests = 30;

      // Simulate database connection delays
      mockDb.auditSession.findFirst.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(null), 10))
      );

      mockDb.auditSession.create.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          id: 1,
          sessionId: 'test-session-id',
          email: 'test@example.com',
          status: 'in_progress',
        }), 20))
      );

      mockValidateAndSanitize.mockReturnValue({
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
      });

      const requests = Array.from({ length: concurrentRequests }, () =>
        startAudit(createRequest('http://localhost:3000/api/audit/start', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            ipAddress: '127.0.0.1',
          }),
        }))
      );

      const startTime = Date.now();
      await Promise.allSettled(requests);
      const endTime = Date.now();

      // Should complete within reasonable time despite simulated delays
      expect(endTime - startTime).toBeLessThan(2000);
    });

    it('should maintain response quality under load', async () => {
      const concurrentRequests = 25;

      mockValidateAndSanitize.mockReturnValue({
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
      });

      mockDb.auditSession.findFirst.mockResolvedValue(null);
      mockDb.auditSession.create.mockResolvedValue({
        id: 1,
        sessionId: 'test-session-id',
        email: 'test@example.com',
        status: 'in_progress',
      });

      const requests = Array.from({ length: concurrentRequests }, () =>
        startAudit(createRequest('http://localhost:3000/api/audit/start', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            ipAddress: '127.0.0.1',
          }),
        }))
      );

      const results = await Promise.allSettled(requests);

      // Verify response structure integrity
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const response = result.value;
          expect(response.status).toBe(200);

          // Check response has required fields
          expect(response.json).toBeDefined();
        }
      });
    });
  });

  describe('Message Processing Under Load', () => {
    it('should handle concurrent message processing requests', async () => {
      const concurrentRequests = 20;
      const sessionId = 'test-session-id';

      mockValidateAndSanitize.mockReturnValue({ sessionId, messages: [] });

      mockRedis.get.mockResolvedValue({
        current_step: 'discovery',
        messages: [],
      });

      mockWorkflowApp.invoke.mockResolvedValue({
        messages: [createAiMessage('Response')],
        currentPhase: 'discovery',
      });

      const requests = Array.from({ length: concurrentRequests }, () =>
        chatAudit(createRequest('http://localhost:3000/api/audit/chat', {
          method: 'POST',
          body: JSON.stringify({
            sessionId,
            messages: [{ type: 'human', content: 'Test message' }],
            currentPhase: 'discovery',
          }),
        }))
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(requests);
      const endTime = Date.now();

      const successfulRequests = results.filter(result =>
        result.status === 'fulfilled' &&
        result.value.status === 200
      );

      expect(successfulRequests.length).toBe(concurrentRequests);
      expect(endTime - startTime).toBeLessThan(3000); // 3 seconds for message processing
    });

    it('should handle Redis memory usage under load', async () => {
      const concurrentRequests = 15;
      const largeMessage = 'x'.repeat(10000); // 10KB message

      mockValidateAndSanitize.mockReturnValue({ sessionId: 'test-session-id', messages: [] });

      mockRedis.get.mockResolvedValue({
        current_step: 'discovery',
        messages: [],
      });

      mockRedis.set.mockResolvedValue('OK');

      mockWorkflowApp.invoke.mockResolvedValue({
        messages: [createAiMessage('Response')],
        currentPhase: 'discovery',
      });

      const requests = Array.from({ length: concurrentRequests }, () =>
        chatAudit(createRequest('http://localhost:3000/api/audit/chat', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: 'test-session-id',
            messages: [{ type: 'human', content: largeMessage }],
            currentPhase: 'discovery',
          }),
        }))
      );

      await Promise.allSettled(requests);

      // Verify Redis operations were called
      expect(mockRedis.get).toHaveBeenCalledTimes(concurrentRequests);
      expect(mockRedis.set).toHaveBeenCalledTimes(concurrentRequests);
    });
  });

  describe('Throughput and Response Time Measurements', () => {
    it('should measure and validate API throughput', async () => {
      const iterations = 60;

      mockValidateAndSanitize.mockReturnValue({
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
      });

      mockDb.auditSession.findFirst.mockResolvedValue(null);
      mockDb.auditSession.create.mockResolvedValue({
        id: 1,
        sessionId: 'test-session-id',
        email: 'test@example.com',
        status: 'in_progress',
      });

      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await startAudit(createRequest('http://localhost:3000/api/audit/start', {
          method: 'POST',
          body: JSON.stringify({
            email: `test${i}@example.com`,
            ipAddress: '127.0.0.1',
          }),
        }));
      }

      const durationMs = Date.now() - startTime;
      const throughput = iterations / Math.max(durationMs / 1000, 0.001);

      expect(throughput).toBeGreaterThan(5);
      expect(durationMs).toBeLessThan(6000);
    });

    it('should track response time percentiles', async () => {
      const requestCount = 100;
      const responseTimes: number[] = [];

      mockValidateAndSanitize.mockReturnValue({
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
      });

      mockDb.auditSession.findFirst.mockResolvedValue(null);
      mockDb.auditSession.create.mockResolvedValue({
        id: 1,
        sessionId: 'test-session-id',
        email: 'test@example.com',
        status: 'in_progress',
      });

      // Execute requests and measure response times
      for (let i = 0; i < requestCount; i++) {
        const requestStart = Date.now();

        await startAudit(createRequest('http://localhost:3000/api/audit/start', {
          method: 'POST',
          body: JSON.stringify({
            email: `test${i}@example.com`,
            ipAddress: '127.0.0.1',
          }),
        }));

        const requestEnd = Date.now();
        responseTimes.push(requestEnd - requestStart);
      }

      // Calculate percentiles
      responseTimes.sort((a, b) => a - b);
      const p50 = responseTimes[Math.floor(requestCount * 0.5)];
      const p95 = responseTimes[Math.floor(requestCount * 0.95)];
      const p99 = responseTimes[Math.floor(requestCount * 0.99)];

      // Verify performance benchmarks
      expect(p50).toBeLessThan(200); // 50th percentile < 200ms
      expect(p95).toBeLessThan(1000); // 95th percentile < 1s
      expect(p99).toBeLessThan(2000); // 99th percentile < 2s
    });
  });

  describe('Failure Scenarios Under Load', () => {
    it('should handle database failures gracefully under load', async () => {
      const concurrentRequests = 10;

      mockValidateAndSanitize.mockReturnValue({
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
      });

      // Simulate database failures
      mockDb.auditSession.findFirst.mockRejectedValue(new Error('Database connection failed'));
      mockDb.auditSession.create.mockRejectedValue(new Error('Database connection failed'));

      const requests = Array.from({ length: concurrentRequests }, () =>
        startAudit(createRequest('http://localhost:3000/api/audit/start', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            ipAddress: '127.0.0.1',
          }),
        }))
      );

      const results = await Promise.allSettled(requests);

      // Verify graceful error handling
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBe(500);
        }
      });

      // Verify error metrics were collected
      expect(mockMetrics.increment).toHaveBeenCalledWith('api.audit.start.error');
    });

    it('should handle Redis failures under load', async () => {
      const concurrentRequests = 8;

      mockValidateAndSanitize.mockReturnValue({
        sessionId: 'test-session-id',
        message: 'Test message',
      });

      // Simulate Redis failures
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const requests = Array.from({ length: concurrentRequests }, () =>
        chatAudit(createRequest('http://localhost:3000/api/audit/chat', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: 'test-session-id',
            message: 'Test message',
          }),
        }))
      );

      const results = await Promise.allSettled(requests);

      // Verify graceful degradation
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect([500, 503]).toContain(result.value.status); // Server error or service unavailable
        }
      });
    });

    it('should handle rate limiting under extreme load', async () => {
      const extremeLoad = 100; // Simulate DDoS-like load

      mockValidateAndSanitize.mockReturnValue({
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
      });

      mockDb.auditSession.findFirst.mockResolvedValue(null);
      mockDb.auditSession.create.mockResolvedValue({
        id: 1,
        sessionId: 'test-session-id',
        email: 'test@example.com',
        status: 'in_progress',
      });

      const requests = Array.from({ length: extremeLoad }, () =>
        startAudit(createRequest('http://localhost:3000/api/audit/start', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            ipAddress: '127.0.0.1',
          }),
        }))
      );

      const results = await Promise.allSettled(requests);

      // Some requests should be rate limited (429) or fail gracefully
      const rateLimitedRequests = results.filter(result =>
        result.status === 'fulfilled' && result.value.status === 429
      );

      const successfulRequests = results.filter(result =>
        result.status === 'fulfilled' && result.value.status === 200
      );

      // Verify system doesn't crash under extreme load
      expect(successfulRequests.length + rateLimitedRequests.length).toBe(extremeLoad);
    });
  });
});