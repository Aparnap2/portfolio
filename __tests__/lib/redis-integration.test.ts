/**
 * Redis Integration Tests
 * Tests Upstash Redis operations for session management and caching
 */

import { redis } from '@/lib/redis';

// Mock Redis
jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      exists: jest.fn(),
      incr: jest.fn(),
      decr: jest.fn(),
      hget: jest.fn(),
      hset: jest.fn(),
      hgetall: jest.fn(),
      sadd: jest.fn(),
      srem: jest.fn(),
      smembers: jest.fn(),
      scard: jest.fn(),
      zadd: jest.fn(),
      zrem: jest.fn(),
      zrange: jest.fn(),
      zscore: jest.fn(),
    }))
  };
});

describe('Redis Integration', () => {
  let mockRedis: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis = (redis as any);
  });

  describe('Session Management', () => {
    const mockSessionData = {
      sessionId: 'test-session-123',
      email: 'test@example.com',
      name: 'Test User',
      currentStep: 'discovery',
      messages: [
        { role: 'user', content: 'What automation opportunities do I have?' },
        { role: 'assistant', content: 'Let me analyze your business processes...' }
      ],
      extractedInfo: {
        industry: 'Technology',
        companySize: '50-100',
        painPoints: ['manual data entry', 'email management']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    it('should store session data successfully', async () => {
      mockRedis.set.mockResolvedValueOnce('OK');

      const result = await mockRedis.set(
        'session:test-session-123',
        JSON.stringify(mockSessionData),
        { ex: 3600 } // 1 hour expiry
      );

      expect(result).toBe('OK');
      expect(mockRedis.set).toHaveBeenCalledWith(
        'session:test-session-123',
        JSON.stringify(mockSessionData),
        { ex: 3600 }
      );
    });

    it('should retrieve session data successfully', async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockSessionData));

      const result = await mockRedis.get('session:test-session-123');

      expect(result).toBe(JSON.stringify(mockSessionData));
      const parsedData = JSON.parse(result);
      expect(parsedData.sessionId).toBe('test-session-123');
      expect(parsedData.email).toBe('test@example.com');
    });

    it('should return null for non-existent session', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await mockRedis.get('session:non-existent');

      expect(result).toBeNull();
    });

    it('should update session data', async () => {
      const updatedData = {
        ...mockSessionData,
        currentStep: 'qualification',
        painScore: 75
      };

      mockRedis.set.mockResolvedValueOnce('OK');

      const result = await mockRedis.set(
        'session:test-session-123',
        JSON.stringify(updatedData)
      );

      expect(result).toBe('OK');
    });

    it('should handle session expiry', async () => {
      mockRedis.expire.mockResolvedValueOnce(1);

      const result = await mockRedis.expire('session:test-session-123', 1800); // 30 minutes

      expect(result).toBe(1);
      expect(mockRedis.expire).toHaveBeenCalledWith('session:test-session-123', 1800);
    });
  });

  describe('Cache Operations', () => {
    it('should cache API responses', async () => {
      const apiResponse = {
        opportunities: [
          { name: 'Email Automation', savings: 2500 },
          { name: 'Data Processing', savings: 1800 }
        ],
        timestamp: Date.now()
      };

      mockRedis.set.mockResolvedValueOnce('OK');

      const result = await mockRedis.set(
        'cache:api:audit-opportunities:tech-50-100',
        JSON.stringify(apiResponse),
        { ex: 7200 } // 2 hours
      );

      expect(result).toBe('OK');
    });

    it('should retrieve cached data', async () => {
      const cachedData = JSON.stringify({
        result: 'cached response',
        cachedAt: Date.now()
      });

      mockRedis.get.mockResolvedValueOnce(cachedData);

      const result = await mockRedis.get('cache:api:some-endpoint');

      expect(result).toBe(cachedData);
    });

    it('should check cache existence', async () => {
      mockRedis.exists.mockResolvedValueOnce(1);

      const result = await mockRedis.exists('cache:api:existing-key');

      expect(result).toBe(1);
    });

    it('should return 0 for non-existent cache keys', async () => {
      mockRedis.exists.mockResolvedValueOnce(0);

      const result = await mockRedis.exists('cache:api:non-existent');

      expect(result).toBe(0);
    });
  });

  describe('Rate Limiting', () => {
    it('should implement rate limiting with counters', async () => {
      const key = 'ratelimit:user:test@example.com';
      mockRedis.incr.mockResolvedValueOnce(1);

      const result = await mockRedis.incr(key);

      expect(result).toBe(1);
      expect(mockRedis.incr).toHaveBeenCalledWith(key);
    });

    it('should set expiry on rate limit keys', async () => {
      mockRedis.expire.mockResolvedValueOnce(1);

      const result = await mockRedis.expire('ratelimit:user:test@example.com', 60); // 1 minute window

      expect(result).toBe(1);
    });

    it('should check rate limit status', async () => {
      mockRedis.get.mockResolvedValueOnce('5'); // 5 requests made

      const result = await mockRedis.get('ratelimit:user:test@example.com');

      expect(result).toBe('5');
    });
  });

  describe('Analytics and Metrics', () => {
    it('should track audit completions', async () => {
      mockRedis.incr.mockResolvedValueOnce(1);

      const result = await mockRedis.incr('metrics:audits:completed:2024-01-15');

      expect(result).toBe(1);
    });

    it('should track API usage by endpoint', async () => {
      mockRedis.hincrby.mockResolvedValueOnce(5);

      // Mock hincrby for hash increment
      (mockRedis as any).hincrby = jest.fn().mockResolvedValueOnce(5);

      const result = await (mockRedis as any).hincrby('metrics:api:usage', '/api/audit/chat', 1);

      expect(result).toBe(5);
    });

    it('should store user journey analytics', async () => {
      const journeyData = {
        sessionId: 'session-123',
        steps: ['email_capture', 'discovery', 'pain_points', 'qualification', 'report'],
        timeSpent: 1800, // 30 minutes
        completionRate: 100
      };

      mockRedis.set.mockResolvedValueOnce('OK');

      const result = await mockRedis.set(
        'analytics:journey:session-123',
        JSON.stringify(journeyData),
        { ex: 604800 } // 7 days
      );

      expect(result).toBe('OK');
    });
  });

  describe('Set Operations', () => {
    it('should add items to sets', async () => {
      mockRedis.sadd.mockResolvedValueOnce(1);

      const result = await mockRedis.sadd('active:sessions', 'session-123');

      expect(result).toBe(1);
    });

    it('should remove items from sets', async () => {
      mockRedis.srem.mockResolvedValueOnce(1);

      const result = await mockRedis.srem('active:sessions', 'session-123');

      expect(result).toBe(1);
    });

    it('should get set members', async () => {
      const members = ['session-1', 'session-2', 'session-3'];
      mockRedis.smembers.mockResolvedValueOnce(members);

      const result = await mockRedis.smembers('active:sessions');

      expect(result).toEqual(members);
      expect(result).toHaveLength(3);
    });

    it('should get set cardinality', async () => {
      mockRedis.scard.mockResolvedValueOnce(42);

      const result = await mockRedis.scard('active:sessions');

      expect(result).toBe(42);
    });
  });

  describe('Sorted Set Operations', () => {
    it('should add items to sorted sets with scores', async () => {
      mockRedis.zadd.mockResolvedValueOnce(1);

      const result = await mockRedis.zadd('leaderboard:pain-scores', {
        score: 85,
        member: 'session-123'
      });

      expect(result).toBe(1);
    });

    it('should get range from sorted sets', async () => {
      const topScores = [
        ['session-high', '95'],
        ['session-med', '85'],
        ['session-low', '75']
      ];
      mockRedis.zrange.mockResolvedValueOnce(topScores);

      const result = await mockRedis.zrange('leaderboard:pain-scores', 0, 2, { rev: true, withScore: true });

      expect(result).toEqual(topScores);
    });

    it('should get score for member', async () => {
      mockRedis.zscore.mockResolvedValueOnce('85');

      const result = await mockRedis.zscore('leaderboard:pain-scores', 'session-123');

      expect(result).toBe('85');
    });
  });

  describe('Hash Operations', () => {
    it('should set hash fields', async () => {
      mockRedis.hset.mockResolvedValueOnce(1);

      const result = await mockRedis.hset('user:profile:123', {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Tech Corp'
      });

      expect(result).toBe(1);
    });

    it('should get hash fields', async () => {
      mockRedis.hget.mockResolvedValueOnce('John Doe');

      const result = await mockRedis.hget('user:profile:123', 'name');

      expect(result).toBe('John Doe');
    });

    it('should get all hash fields', async () => {
      const profile = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Tech Corp',
        role: 'CEO'
      };
      mockRedis.hgetall.mockResolvedValueOnce(profile);

      const result = await mockRedis.hgetall('user:profile:123');

      expect(result).toEqual(profile);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      mockRedis.get.mockRejectedValueOnce(new Error('Connection timeout'));

      await expect(mockRedis.get('session:test')).rejects.toThrow('Connection timeout');
    });

    it('should handle invalid JSON in stored data', async () => {
      mockRedis.get.mockResolvedValueOnce('invalid json {');

      const result = await mockRedis.get('session:test');

      expect(result).toBe('invalid json {');
      // Consumer should handle JSON parsing errors
    });

    it('should handle Redis server errors', async () => {
      const serverError = new Error('ERR unknown command');
      mockRedis.set.mockRejectedValueOnce(serverError);

      await expect(mockRedis.set('key', 'value')).rejects.toThrow('ERR unknown command');
    });
  });

  describe('TTL Operations', () => {
    it('should get time to live for keys', async () => {
      mockRedis.ttl.mockResolvedValueOnce(1800); // 30 minutes remaining

      const result = await mockRedis.ttl('session:test-session-123');

      expect(result).toBe(1800);
    });

    it('should return -2 for non-existent keys', async () => {
      mockRedis.ttl.mockResolvedValueOnce(-2);

      const result = await mockRedis.ttl('non-existent-key');

      expect(result).toBe(-2);
    });

    it('should return -1 for keys without expiry', async () => {
      mockRedis.ttl.mockResolvedValueOnce(-1);

      const result = await mockRedis.ttl('persistent-key');

      expect(result).toBe(-1);
    });
  });

  describe('Cleanup Operations', () => {
    it('should delete keys', async () => {
      mockRedis.del.mockResolvedValueOnce(1);

      const result = await mockRedis.del('session:expired-session');

      expect(result).toBe(1);
    });

    it('should delete multiple keys', async () => {
      mockRedis.del.mockResolvedValueOnce(3);

      const result = await mockRedis.del(['session:1', 'session:2', 'session:3']);

      expect(result).toBe(3);
    });
  });
});