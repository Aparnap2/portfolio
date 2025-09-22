const { DatabaseManager } = require('../src/database');
const { Pool } = require('pg');

// Mock pg Pool
jest.mock('pg');

describe('DatabaseManager', () => {
  let db;
  let mockPool;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
      end: jest.fn()
    };
    Pool.mockImplementation(() => mockPool);
    db = new DatabaseManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createLead', () => {
    test('should create lead and return ID', async () => {
      const leadData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        company: 'Test Corp'
      };

      mockPool.query.mockResolvedValue({ rows: [] });

      const leadId = await db.createLead(leadData);

      expect(leadId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO leads'),
        expect.arrayContaining([leadId, 'John', 'Doe', 'john@test.com', 'Test Corp', 'processing'])
      );
    });

    test('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Database connection failed'));

      const leadData = { firstName: 'John', email: 'john@test.com' };

      await expect(db.createLead(leadData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('updateLead', () => {
    test('should update lead with processed data', async () => {
      const updateData = {
        enrichedData: { industry: 'Tech' },
        score: { score: 85 },
        assignment: { assignedRep: 'rep1' },
        status: 'completed'
      };

      mockPool.query.mockResolvedValue({ rows: [] });

      await db.updateLead('test-id', updateData);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE leads SET'),
        expect.arrayContaining([
          JSON.stringify(updateData.enrichedData),
          JSON.stringify(updateData.score),
          JSON.stringify(updateData.assignment),
          updateData.status,
          'test-id'
        ])
      );
    });
  });

  describe('getLead', () => {
    test('should retrieve lead by ID', async () => {
      const mockLead = {
        id: 'test-id',
        first_name: 'John',
        email: 'john@test.com',
        status: 'completed'
      };

      mockPool.query.mockResolvedValue({ rows: [mockLead] });

      const result = await db.getLead('test-id');

      expect(result).toEqual(mockLead);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM leads WHERE id = $1',
        ['test-id']
      );
    });

    test('should return undefined for non-existent lead', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await db.getLead('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('getStats', () => {
    test('should return dashboard statistics', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '100' }] }) // total
        .mockResolvedValueOnce({ rows: [{ count: '85' }] })  // processed
        .mockResolvedValueOnce({ rows: [{ avg: '72.5' }] }); // avg score

      const stats = await db.getStats();

      expect(stats).toEqual({
        totalLeads: 100,
        processedLeads: 85,
        averageScore: 72.5
      });
    });

    test('should handle null average score', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ avg: null }] });

      const stats = await db.getStats();

      expect(stats.averageScore).toBe(0);
    });
  });
});
