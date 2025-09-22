const { AITransformationOrchestrator } = require('../src/orchestrator');
const { ErrorHandler } = require('../src/middleware/errorHandler');

// Mock dependencies
jest.mock('../src/agents/education');
jest.mock('../src/agents/interview');
jest.mock('../src/agents/process-mapping');
jest.mock('../src/agents/opportunity');
jest.mock('../src/database');

describe('AI Transformation System', () => {
  let orchestrator;
  let mockDb;

  beforeEach(() => {
    orchestrator = new AITransformationOrchestrator();
    mockDb = orchestrator.db;
    mockDb.pool = { query: jest.fn() };
    jest.clearAllMocks();
  });

  describe('Phase 1: Education & Alignment', () => {
    test('should validate company info', () => {
      const invalidCompany = { 
        name: 'A',
        industry: 'Technology',
        size: '50-200',
        techLevel: 'intermediate'
      };
      
      expect(() => {
        ErrorHandler.validateCompanyInfo(invalidCompany);
      }).toThrow('Company name must be at least 2 characters');
    });

    test('should handle duplicate company', async () => {
      const companyInfo = {
        name: 'TechCorp',
        industry: 'Technology',
        size: '50-200',
        techLevel: 'intermediate'
      };

      mockDb.findCompanyByName.mockResolvedValue({ id: 'existing-id' });

      await expect(orchestrator.startPhase1(companyInfo))
        .rejects.toThrow('Company already exists in system');
    });
  });

  describe('System Health', () => {
    test('should check database connectivity', async () => {
      mockDb.pool.query.mockResolvedValue({ rows: [{ result: 1 }] });
      process.env.GOOGLE_API_KEY = 'test-key';

      const health = await orchestrator.getSystemHealth();

      expect(health.database).toBe('healthy');
      expect(health.ai).toBe('configured');
    });
  });
});
