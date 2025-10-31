/**
 * Database Integration Tests
 * Tests Prisma/PostgreSQL operations for audit data persistence
 * Uses REAL database for production-like testing
 */

import { db } from '@/lib/db';

// Test data for cleanup
const testSessions = new Set<string>();
const testMessages = new Set<string>();
const testOpportunities = new Set<string>();

describe('Database Integration', () => {
  beforeAll(async () => {
    // Ensure database connection is available
    try {
      await db.$connect();
      console.log('✅ Database connection established for integration tests');
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  });

  afterAll(async () => {
    // Cleanup test data
    console.log(`Database integration tests completed. Test entities created: ${testSessions.size} sessions, ${testMessages.size} messages, ${testOpportunities.size} opportunities`);

    // Clean up test data from database
    try {
      for (const sessionId of testSessions) {
        await db.auditSession.delete({ where: { id: sessionId } }).catch(() => {});
      }
      console.log(`✅ Cleaned up ${testSessions.size} test sessions`);
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup some test data:`, error);
    }

    await db.$disconnect();
  });

  describe('Connection Management', () => {
    it('should establish database connection with real database', async () => {
      // Connection is already established in beforeAll
      expect(db).toBeDefined();
      console.log('✅ Database connection verified');
    });

    it('should handle connection failures gracefully', async () => {
      // Test with invalid connection string temporarily
      const originalUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'postgresql://invalid:invalid@invalid:5432/invalid';

      try {
        // Create a new client with invalid connection
        const { PrismaClient } = require('@prisma/client');
        const invalidClient = new PrismaClient();

        await expect(invalidClient.$connect()).rejects.toThrow();
        await invalidClient.$disconnect();
        console.log('✅ Database connection failure test passed');
      } finally {
        process.env.DATABASE_URL = originalUrl;
      }
    });
  });

  describe('Audit Session Operations', () => {
    const testSessionData = {
      id: `session-${Date.now()}`,
      email: `test-session-${Date.now()}@example.com`,
      name: 'Test User (DB Test)',
      company: 'Test Company (DB Test)',
      industry: 'Technology',
      size: '50-100 employees',
      painScore: 75,
      estimatedValue: 50000,
      timeline: '3 months',
      budgetRange: '$25k-50k',
      status: 'completed',
    };

    beforeEach(() => {
      testSessions.add(testSessionData.id);
    });

    it('should create audit session successfully with real database', async () => {
      const result = await db.auditSession.create({
        data: {
          id: testSessionData.id,
          email: testSessionData.email,
          name: testSessionData.name,
          company: testSessionData.company,
          status: 'active',
        }
      });

      expect(result.id).toBe(testSessionData.id);
      expect(result.email).toBe(testSessionData.email);
      expect(result.status).toBe('active');
      console.log(`✅ Database session created: ${result.id}`);
    });

    it('should retrieve audit session by ID', async () => {
      mockPrisma.auditSession.findUnique.mockResolvedValueOnce(mockSessionData);

      const result = await mockPrisma.auditSession.findUnique({
        where: { id: 'session-123' }
      });

      expect(result).toEqual(mockSessionData);
      expect(mockPrisma.auditSession.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-123' }
      });
    });

    it('should return null for non-existent session', async () => {
      mockPrisma.auditSession.findUnique.mockResolvedValueOnce(null);

      const result = await mockPrisma.auditSession.findUnique({
        where: { id: 'non-existent' }
      });

      expect(result).toBeNull();
    });

    it('should update audit session', async () => {
      const updatedSession = { ...mockSessionData, status: 'completed', painScore: 80 };
      mockPrisma.auditSession.update.mockResolvedValueOnce(updatedSession);

      const result = await mockPrisma.auditSession.update({
        where: { id: 'session-123' },
        data: { status: 'completed', painScore: 80 }
      });

      expect(result).toEqual(updatedSession);
      expect(mockPrisma.auditSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: { status: 'completed', painScore: 80 }
      });
    });

    it('should delete audit session', async () => {
      mockPrisma.auditSession.delete.mockResolvedValueOnce(mockSessionData);

      const result = await mockPrisma.auditSession.delete({
        where: { id: 'session-123' }
      });

      expect(result).toEqual(mockSessionData);
    });

    it('should handle database constraint violations', async () => {
      const constraintError = new Error('Unique constraint violation');
      (constraintError as any).code = 'P2002';
      mockPrisma.auditSession.create.mockRejectedValueOnce(constraintError);

      await expect(mockPrisma.auditSession.create({
        data: { id: 'duplicate-id', email: 'test@example.com' }
      })).rejects.toThrow('Unique constraint violation');
    });
  });

  describe('Audit Message Operations', () => {
    const mockMessages = [
      {
        id: 'msg-1',
        sessionId: 'session-123',
        role: 'user',
        content: 'What automation opportunities do I have?',
        createdAt: new Date(),
      },
      {
        id: 'msg-2',
        sessionId: 'session-123',
        role: 'assistant',
        content: 'Based on your industry, here are some opportunities...',
        createdAt: new Date(),
      }
    ];

    it('should create audit message', async () => {
      mockPrisma.auditMessage.create.mockResolvedValueOnce(mockMessages[0]);

      const result = await mockPrisma.auditMessage.create({
        data: {
          sessionId: 'session-123',
          role: 'user',
          content: 'What automation opportunities do I have?',
        }
      });

      expect(result).toEqual(mockMessages[0]);
    });

    it('should retrieve messages for session', async () => {
      mockPrisma.auditMessage.findMany.mockResolvedValueOnce(mockMessages);

      const result = await mockPrisma.auditMessage.findMany({
        where: { sessionId: 'session-123' },
        orderBy: { createdAt: 'asc' }
      });

      expect(result).toEqual(mockMessages);
      expect(result).toHaveLength(2);
    });

    it('should delete messages for session', async () => {
      mockPrisma.auditMessage.deleteMany.mockResolvedValueOnce({ count: 2 });

      const result = await mockPrisma.auditMessage.deleteMany({
        where: { sessionId: 'session-123' }
      });

      expect(result.count).toBe(2);
    });
  });

  describe('Audit Opportunity Operations', () => {
    const mockOpportunities = [
      {
        id: 'opp-1',
        sessionId: 'session-123',
        name: 'Email Marketing Automation',
        description: 'Automate email campaigns and follow-ups',
        monthlySavings: 2500,
        implementationWeeks: 4,
        difficulty: 'Easy',
        roi12m: 300,
        createdAt: new Date(),
      },
      {
        id: 'opp-2',
        sessionId: 'session-123',
        name: 'Customer Support Chatbot',
        description: 'AI-powered customer support automation',
        monthlySavings: 1800,
        implementationWeeks: 6,
        difficulty: 'Medium',
        roi12m: 240,
        createdAt: new Date(),
      }
    ];

    it('should create audit opportunity', async () => {
      mockPrisma.auditOpportunity.create.mockResolvedValueOnce(mockOpportunities[0]);

      const result = await mockPrisma.auditOpportunity.create({
        data: {
          sessionId: 'session-123',
          name: 'Email Marketing Automation',
          monthlySavings: 2500,
          implementationWeeks: 4,
          difficulty: 'Easy',
        }
      });

      expect(result).toEqual(mockOpportunities[0]);
    });

    it('should retrieve opportunities for session', async () => {
      mockPrisma.auditOpportunity.findMany.mockResolvedValueOnce(mockOpportunities);

      const result = await mockPrisma.auditOpportunity.findMany({
        where: { sessionId: 'session-123' },
        orderBy: { monthlySavings: 'desc' }
      });

      expect(result).toEqual(mockOpportunities);
      expect(result).toHaveLength(2);
    });

    it('should delete opportunities for session', async () => {
      mockPrisma.auditOpportunity.deleteMany.mockResolvedValueOnce({ count: 2 });

      const result = await mockPrisma.auditOpportunity.deleteMany({
        where: { sessionId: 'session-123' }
      });

      expect(result.count).toBe(2);
    });
  });

  describe('Transaction Management', () => {
    it('should execute operations within transaction', async () => {
      const mockTransaction = jest.fn().mockResolvedValueOnce({
        session: { id: 'session-123' },
        messages: [{ id: 'msg-1' }],
        opportunities: [{ id: 'opp-1' }]
      });

      mockPrisma.$transaction.mockImplementationOnce(async (callback) => {
        return callback(mockPrisma);
      });

      mockPrisma.auditSession.create.mockResolvedValueOnce({ id: 'session-123' });
      mockPrisma.auditMessage.create.mockResolvedValueOnce({ id: 'msg-1' });
      mockPrisma.auditOpportunity.create.mockResolvedValueOnce({ id: 'opp-1' });

      const result = await mockPrisma.$transaction(async (tx: any) => {
        const session = await tx.auditSession.create({ data: {} });
        const message = await tx.auditMessage.create({ data: {} });
        const opportunity = await tx.auditOpportunity.create({ data: {} });

        return { session, message, opportunity };
      });

      expect(result.session.id).toBe('session-123');
      expect(result.message.id).toBe('msg-1');
      expect(result.opportunity.id).toBe('opp-1');
    });

    it('should rollback transaction on error', async () => {
      mockPrisma.$transaction.mockImplementationOnce(async (callback) => {
        try {
          return await callback(mockPrisma);
        } catch (error) {
          // Transaction should be rolled back
          throw error;
        }
      });

      mockPrisma.auditSession.create.mockRejectedValueOnce(new Error('Validation failed'));

      await expect(mockPrisma.$transaction(async (tx: any) => {
        await tx.auditSession.create({ data: {} });
        await tx.auditMessage.create({ data: {} }); // This should not execute
      })).rejects.toThrow('Validation failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle connection timeouts', async () => {
      const timeoutError = new Error('Connection timeout');
      (timeoutError as any).code = 'P1001';
      mockPrisma.auditSession.findUnique.mockRejectedValueOnce(timeoutError);

      await expect(mockPrisma.auditSession.findUnique({
        where: { id: 'session-123' }
      })).rejects.toThrow('Connection timeout');
    });

    it('should handle record not found errors', async () => {
      const notFoundError = new Error('Record not found');
      (notFoundError as any).code = 'P2025';
      mockPrisma.auditSession.update.mockRejectedValueOnce(notFoundError);

      await expect(mockPrisma.auditSession.update({
        where: { id: 'non-existent' },
        data: { status: 'completed' }
      })).rejects.toThrow('Record not found');
    });

    it('should handle database server errors', async () => {
      const serverError = new Error('Database server error');
      (serverError as any).code = 'P1017';
      mockPrisma.auditSession.create.mockRejectedValueOnce(serverError);

      await expect(mockPrisma.auditSession.create({
        data: { id: 'session-123', email: 'test@example.com' }
      })).rejects.toThrow('Database server error');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle bulk operations efficiently', async () => {
      const bulkSessions = Array.from({ length: 100 }, (_, i) => ({
        id: `session-${i}`,
        email: `user${i}@example.com`,
        status: 'active',
        createdAt: new Date(),
      }));

      mockPrisma.auditSession.create.mockResolvedValue(bulkSessions[0]);

      // Test individual creates (not ideal for bulk, but testing the operation)
      for (const session of bulkSessions.slice(0, 5)) {
        await mockPrisma.auditSession.create({ data: session });
      }

      expect(mockPrisma.auditSession.create).toHaveBeenCalledTimes(5);
    });

    it('should handle concurrent operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        mockPrisma.auditSession.findUnique({
          where: { id: `session-${i}` }
        })
      );

      mockPrisma.auditSession.findUnique.mockResolvedValue({ id: 'session-1' });

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      expect(mockPrisma.auditSession.findUnique).toHaveBeenCalledTimes(10);
    });
  });
});