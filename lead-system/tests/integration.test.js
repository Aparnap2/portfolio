const { LeadOrchestrator } = require('../src/orchestrator');
const { DatabaseManager } = require('../src/database');

describe('Lead Processing Integration', () => {
  let orchestrator;
  let db;

  beforeAll(async () => {
    // Use test database
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/leads_test';
    orchestrator = new LeadOrchestrator();
    db = new DatabaseManager();
  });

  beforeEach(async () => {
    // Clean test data
    await db.pool.query('DELETE FROM leads WHERE email LIKE \'%test.com\'');
  });

  test('should process lead end-to-end', async () => {
    const leadData = {
      firstName: 'Integration',
      lastName: 'Test',
      email: 'integration@test.com',
      company: 'Test Integration Corp'
    };

    // Process lead
    const result = await orchestrator.processLead(leadData);

    expect(result.leadId).toBeDefined();
    expect(result.status).toBe('completed');

    // Verify lead was stored
    const storedLead = await orchestrator.getLeadStatus(result.leadId);
    expect(storedLead.first_name).toBe('Integration');
    expect(storedLead.status).toBe('completed');
    expect(storedLead.enriched_data).toBeDefined();
    expect(storedLead.score).toBeDefined();
    expect(storedLead.assignment).toBeDefined();
  });

  test('should handle duplicate leads', async () => {
    const leadData = {
      firstName: 'Duplicate',
      lastName: 'Test',
      email: 'duplicate@test.com',
      company: 'Duplicate Corp'
    };

    // Process same lead twice
    const result1 = await orchestrator.processLead(leadData);
    
    await expect(orchestrator.processLead(leadData))
      .rejects.toThrow('duplicate key value');
  });

  test('should update dashboard stats', async () => {
    const leadData = {
      firstName: 'Stats',
      lastName: 'Test',
      email: 'stats@test.com',
      company: 'Stats Corp'
    };

    const statsBefore = await orchestrator.getDashboardStats();
    await orchestrator.processLead(leadData);
    const statsAfter = await orchestrator.getDashboardStats();

    expect(statsAfter.totalLeads).toBe(statsBefore.totalLeads + 1);
    expect(statsAfter.processedLeads).toBe(statsBefore.processedLeads + 1);
  });
});
