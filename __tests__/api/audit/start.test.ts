import { POST } from '@/app/api/audit/start/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('@/lib/db', () => ({
  db: {
    auditSession: {
      findFirst: jest.fn(),
      create: jest.fn(),
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
  },
}));

jest.mock('@/lib/metrics', () => ({
  withTiming: jest.fn((fn) => fn),
  MetricsCollector: {
    getInstance: jest.fn(() => ({
      increment: jest.fn(),
    })),
  },
}));

jest.mock('@/lib/error-handling', () => ({
  CircuitBreaker: jest.fn(() => ({
    execute: jest.fn((fn) => fn()),
  })),
  withRetry: jest.fn((fn) => fn()),
}));

jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
}));

const mockRedis = require('@/lib/redis').redis;
const mockDb = require('@/lib/db').db;
const mockGetClientIP = require('@/lib/utils').getClientIP;
const mockValidateAndSanitize = require('@/lib/validation').validateAndSanitize;
const mockNanoid = require('nanoid').nanoid;

describe('/api/audit/start', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNanoid.mockReturnValue('test-session-id');
    mockGetClientIP.mockResolvedValue('127.0.0.1');
  });

  describe('POST - Success Scenarios', () => {
    it('should create a new audit session successfully', async () => {
      const requestBody = {
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
      };

      mockValidateAndSanitize.mockReturnValue(requestBody);
      mockDb.auditSession.findFirst.mockResolvedValue(null);
      mockDb.auditSession.create.mockResolvedValue({
        id: 1,
        sessionId: 'test-session-id',
        email: 'test@example.com',
        status: 'in_progress',
      });

      const request = new NextRequest('http://localhost:3000/api/audit/start', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('test-session-id');
      expect(result.response.messages).toHaveLength(1);
      expect(result.response.current_step).toBe('discovery');
      expect(mockDb.auditSession.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'test-session-id',
          ipAddress: '127.0.0.1',
          email: 'test@example.com',
          currentPhase: 'company_profile',
          completionPercent: 0,
          status: 'in_progress',
        },
      });
    });

    it('should handle existing completed session and offer continuation', async () => {
      const requestBody = {
        email: 'existing@example.com',
        ipAddress: '127.0.0.1',
      };

      const existingSession = {
        sessionId: 'existing-session-id',
        email: 'existing@example.com',
        status: 'completed',
      };

      const existingState = {
        current_step: 'finished',
        messages: [],
      };

      mockValidateAndSanitize.mockReturnValue(requestBody);
      mockDb.auditSession.findFirst.mockResolvedValue(existingSession);
      mockRedis.get.mockResolvedValue(JSON.stringify(existingState));

      const request = new NextRequest('http://localhost:3000/api/audit/start', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('existing-session-id');
      expect(result.response.current_step).toBe('continuation_choice');
      expect(result.response.messages).toHaveLength(2); // Original + continuation message
    });

    it('should handle existing in-progress session and continue from where left off', async () => {
      const requestBody = {
        email: 'inprogress@example.com',
        ipAddress: '127.0.0.1',
      };

      const existingSession = {
        sessionId: 'inprogress-session-id',
        email: 'inprogress@example.com',
        status: 'in_progress',
      };

      const existingState = {
        current_step: 'pain_points',
        messages: [{ id: '1', type: 'ai', content: 'Previous message' }],
      };

      mockValidateAndSanitize.mockReturnValue(requestBody);
      mockDb.auditSession.findFirst.mockResolvedValue(existingSession);
      mockRedis.get.mockResolvedValue(JSON.stringify(existingState));

      const request = new NextRequest('http://localhost:3000/api/audit/start', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('inprogress-session-id');
      expect(result.response.messages).toHaveLength(2); // Original + welcome back message
    });
  });

  describe('POST - Validation and Error Handling', () => {
    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/audit/start', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should return 400 for validation errors', async () => {
      mockValidateAndSanitize.mockImplementation(() => {
        throw new Error('Email is required');
      });

      const request = new NextRequest('http://localhost:3000/api/audit/start', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });

    it('should return 400 when email is missing', async () => {
      const requestBody = {
        ipAddress: '127.0.0.1',
      };

      mockValidateAndSanitize.mockReturnValue(requestBody);

      const request = new NextRequest('http://localhost:3000/api/audit/start', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email is required to start audit');
    });

    it('should handle database errors gracefully', async () => {
      const requestBody = {
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
      };

      mockValidateAndSanitize.mockReturnValue(requestBody);
      mockDb.auditSession.findFirst.mockResolvedValue(null);
      mockDb.auditSession.create.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/audit/start', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('OPTIONS - CORS Handling', () => {
    it('should handle OPTIONS requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/audit/start', {
        method: 'OPTIONS',
      });

      const response = await POST(request); // Note: POST handler includes OPTIONS

      expect(response.status).toBe(200);
    });
  });
});