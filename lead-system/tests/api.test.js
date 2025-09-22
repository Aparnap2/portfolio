const { LeadOrchestrator } = require('../src/orchestrator');

// Mock the orchestrator
jest.mock('../src/orchestrator');

describe('Lead Enrichment API', () => {
  let app;
  let mockOrchestrator;

  beforeAll(async () => {
    // Mock orchestrator before importing app
    mockOrchestrator = {
      processLead: jest.fn(),
      getLeadStatus: jest.fn(),
      getDashboardStats: jest.fn()
    };
    LeadOrchestrator.mockImplementation(() => mockOrchestrator);
    
    // Import app after mocking
    app = require('../index');
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/leads', () => {
    test('should accept valid lead data', async () => {
      const mockResult = { leadId: 'test-123', status: 'completed' };
      mockOrchestrator.processLead.mockResolvedValue(mockResult);

      const leadData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        company: 'Test Corp'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/leads',
        payload: leadData
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body).toEqual({
        success: true,
        leadId: 'test-123',
        status: 'completed'
      });
    });

    test('should reject invalid email format', async () => {
      const leadData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        company: 'Test Corp'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/leads',
        payload: leadData
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/dashboard', () => {
    test('should return dashboard statistics', async () => {
      const mockStats = {
        totalLeads: 100,
        processedLeads: 85,
        averageScore: 72.5
      };
      mockOrchestrator.getDashboardStats.mockResolvedValue(mockStats);

      const response = await app.inject({
        method: 'GET',
        url: '/api/dashboard'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body).toEqual(mockStats);
    });
  });
});
