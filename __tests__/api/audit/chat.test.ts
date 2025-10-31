import { POST } from '@/app/api/audit/chat/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/audit-workflow', () => ({
  app: {
    invoke: jest.fn(),
  },
}));

jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
}));

const mockApp = require('@/lib/audit-workflow').app;
const mockRedis = require('@/lib/redis').redis;
const mockNanoid = require('nanoid').nanoid;

describe('/api/audit/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNanoid.mockReturnValue('test-session-id');
  });

  describe('POST - Success Scenarios', () => {
    it('should process chat messages successfully', async () => {
      const requestBody = {
        messages: [
          { type: 'human', content: 'Hello' },
          { type: 'ai', content: 'Hi there!' },
        ],
        sessionId: 'existing-session-id',
        currentPhase: 'discovery',
      };

      const previousState = {
        messages: [{ type: 'human', content: 'Hello' }],
        currentPhase: 'discovery',
      };

      const nextState = {
        messages: [
          { type: 'human', content: 'Hello' },
          { type: 'ai', content: 'Hi there!' },
          { type: 'ai', content: 'How can I help you?' },
        ],
        currentPhase: 'discovery',
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(previousState));
      mockApp.invoke.mockResolvedValue(nextState);

      const request = new NextRequest('http://localhost:3000/api/audit/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.sessionId).toBe('existing-session-id');
      expect(result.messages).toHaveLength(3);
      expect(result.currentPhase).toBe('discovery');
      expect(mockRedis.set).toHaveBeenCalledWith('session:existing-session-id', expect.any(Object));
    });

    it('should generate new session ID when not provided', async () => {
      const requestBody = {
        messages: [{ type: 'human', content: 'Hello' }],
        currentPhase: 'discovery',
      };

      const nextState = {
        messages: [
          { type: 'human', content: 'Hello' },
          { type: 'ai', content: 'Hi there!' },
        ],
        currentPhase: 'discovery',
      };

      mockRedis.get.mockResolvedValue(null);
      mockApp.invoke.mockResolvedValue(nextState);

      const request = new NextRequest('http://localhost:3000/api/audit/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.sessionId).toBe('test-session-id');
      expect(mockNanoid).toHaveBeenCalledWith();
    });

    it('should handle empty previous state', async () => {
      const requestBody = {
        messages: [{ type: 'human', content: 'Hello' }],
        sessionId: 'test-session-id',
        currentPhase: 'discovery',
      };

      const nextState = {
        messages: [{ type: 'ai', content: 'Hi there!' }],
        currentPhase: 'discovery',
      };

      mockRedis.get.mockResolvedValue(null);
      mockApp.invoke.mockResolvedValue(nextState);

      const request = new NextRequest('http://localhost:3000/api/audit/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.messages).toHaveLength(1);
    });
  });

  describe('POST - Message Serialization', () => {
    it('should properly serialize LangChain messages', async () => {
      const requestBody = {
        messages: [{ type: 'human', content: 'Hello' }],
        sessionId: 'test-session-id',
        currentPhase: 'discovery',
      };

      const nextState = {
        messages: [
          { _getType: () => 'human', content: 'Hello' },
          { _getType: () => 'ai', content: 'Hi there!' },
        ],
        currentPhase: 'discovery',
      };

      mockRedis.get.mockResolvedValue(null);
      mockApp.invoke.mockResolvedValue(nextState);

      const request = new NextRequest('http://localhost:3000/api/audit/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(result.messages).toEqual([
        { type: 'human', content: 'Hello' },
        { type: 'ai', content: 'Hi there!' },
      ]);
    });

    it('should handle mixed message types', async () => {
      const requestBody = {
        messages: [
          { type: 'human', content: 'Hello' },
          { type: 'ai', content: 'Hi' },
        ],
        sessionId: 'test-session-id',
        currentPhase: 'discovery',
      };

      const nextState = {
        messages: [
          { _getType: () => 'human', content: 'Hello' },
          { _getType: () => 'ai', content: 'Hi' },
          { _getType: () => 'ai', content: 'How can I help?' },
        ],
        currentPhase: 'discovery',
      };

      mockRedis.get.mockResolvedValue(null);
      mockApp.invoke.mockResolvedValue(nextState);

      const request = new NextRequest('http://localhost:3000/api/audit/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(result.messages).toHaveLength(3);
      expect(result.messages[2]).toEqual({ type: 'ai', content: 'How can I help?' });
    });
  });

  describe('POST - Error Handling', () => {
    it('should handle workflow invocation errors', async () => {
      const requestBody = {
        messages: [{ type: 'human', content: 'Hello' }],
        sessionId: 'test-session-id',
        currentPhase: 'discovery',
      };

      mockRedis.get.mockResolvedValue(null);
      mockApp.invoke.mockRejectedValue(new Error('Workflow failed'));

      const request = new NextRequest('http://localhost:3000/api/audit/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Something went wrong');
      expect(result.details).toBe('Workflow failed');
    });

    it('should handle Redis errors', async () => {
      const requestBody = {
        messages: [{ type: 'human', content: 'Hello' }],
        sessionId: 'test-session-id',
        currentPhase: 'discovery',
      };

      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));
      mockApp.invoke.mockResolvedValue({ messages: [], currentPhase: 'discovery' });

      const request = new NextRequest('http://localhost:3000/api/audit/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Something went wrong');
      expect(result.details).toBe('Redis connection failed');
    });

    it('should handle invalid JSON in request', async () => {
      const request = new NextRequest('http://localhost:3000/api/audit/chat', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Something went wrong');
    });
  });

  describe('POST - State Persistence', () => {
    it('should save updated state to Redis', async () => {
      const requestBody = {
        messages: [{ type: 'human', content: 'Hello' }],
        sessionId: 'test-session-id',
        currentPhase: 'discovery',
      };

      const nextState = {
        messages: [
          { _getType: () => 'ai', content: 'Hi there!' },
        ],
        currentPhase: 'pain_points',
        additionalData: 'test',
      };

      mockRedis.get.mockResolvedValue(null);
      mockApp.invoke.mockResolvedValue(nextState);

      const request = new NextRequest('http://localhost:3000/api/audit/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      await POST(request);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'session:test-session-id',
        expect.objectContaining({
          messages: [{ type: 'ai', content: 'Hi there!' }],
          currentPhase: 'pain_points',
          additionalData: 'test',
        })
      );
    });

    it('should load previous state from Redis', async () => {
      const requestBody = {
        messages: [{ type: 'human', content: 'Continue' }],
        sessionId: 'test-session-id',
        currentPhase: 'pain_points',
      };

      const previousState = {
        messages: [{ type: 'human', content: 'Hello' }],
        currentPhase: 'discovery',
        extracted_info: { discovery: { industry: 'tech' } },
      };

      const nextState = {
        messages: [
          { _getType: () => 'human', content: 'Hello' },
          { _getType: () => 'ai', content: 'Continuing...' },
        ],
        currentPhase: 'pain_points',
        extracted_info: { discovery: { industry: 'tech' } },
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(previousState));
      mockApp.invoke.mockResolvedValue(nextState);

      const request = new NextRequest('http://localhost:3000/api/audit/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      await POST(request);

      expect(mockApp.invoke).toHaveBeenCalledWith({
        messages: expect.any(Array), // Deserialized messages
        currentPhase: 'pain_points',
      });
    });
  });
});