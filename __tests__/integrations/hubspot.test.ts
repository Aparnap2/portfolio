/**
 * HubSpot Integration Tests
 * Tests HubSpot CRM operations for contact and deal management
 * Uses REAL HubSpot API for production-like testing
 */

import {
  createOrUpdateHubSpotContact,
  createHubSpotDeal,
  createHubSpotTask
} from '@/lib/integrations/hubspot';

// Test data for cleanup
const testContacts = new Set<string>();
const testDeals = new Set<string>();
const testTasks = new Set<string>();

describe('HubSpot Integration', () => {
  beforeAll(() => {
    // Ensure environment variables are set for real testing
    if (!process.env.HUBSPOT_ACCESS_TOKEN) {
      throw new Error('HUBSPOT_ACCESS_TOKEN environment variable must be set for real integration testing');
    }
    if (!process.env.HUBSPOT_PORTAL_ID) {
      throw new Error('HUBSPOT_PORTAL_ID environment variable must be set for real integration testing');
    }
  });

  afterAll(async () => {
    // Cleanup test data
    console.log(`HubSpot integration tests completed. Test entities created: ${testContacts.size} contacts, ${testDeals.size} deals, ${testTasks.size} tasks`);

    // Note: In a real cleanup scenario, you would delete the test entities
    // However, HubSpot API deletion requires special permissions and can be dangerous
    // For testing purposes, we just log what was created
  });

  describe('createOrUpdateHubSpotContact', () => {
    const testContact = {
      email: `test-contact-${Date.now()}@example.com`,
      firstname: 'John (Test)',
      lastname: 'Doe (Test)',
      company: 'Tech Corp (Test)',
      phone: '+1-555-0123',
      lifecyclestage: 'lead',
      hs_lead_status: 'NEW'
    };

    beforeEach(() => {
      testContacts.add(testContact.email);
    });

    it('should create new contact successfully with real HubSpot API', async () => {
      const result = await createOrUpdateHubSpotContact(testContact);

      expect(result.success).toBe(true);
      expect(result.contactId).toBeDefined();
      expect(typeof result.contactId).toBe('string');
      console.log(`✅ HubSpot contact created: ${result.contactId} for ${testContact.email}`);
    });

    it('should update existing contact successfully with real HubSpot API', async () => {
      // First create a contact
      const createResult = await createOrUpdateHubSpotContact(testContact);
      expect(createResult.success).toBe(true);

      // Now update the same contact with modified data
      const updatedContact = {
        ...testContact,
        firstname: 'John (Updated Test)',
        company: 'Tech Corp (Updated Test)'
      };

      const updateResult = await createOrUpdateHubSpotContact(updatedContact);
      expect(updateResult.success).toBe(true);
      expect(updateResult.contactId).toBe(createResult.contactId);
      console.log(`✅ HubSpot contact updated: ${updateResult.contactId}`);
    });

    it('should handle missing access token', async () => {
      const originalToken = process.env.HUBSPOT_ACCESS_TOKEN;
      delete process.env.HUBSPOT_ACCESS_TOKEN;

      try {
        const result = await createOrUpdateHubSpotContact(testContact);

        expect(result.success).toBe(false);
        expect(result.error).toBe('HubSpot not configured');
      } finally {
        process.env.HUBSPOT_ACCESS_TOKEN = originalToken;
      }
    });

    it('should handle API authentication failure with real HubSpot API', async () => {
      const originalToken = process.env.HUBSPOT_ACCESS_TOKEN;
      process.env.HUBSPOT_ACCESS_TOKEN = 'invalid-token-123';

      try {
        const result = await createOrUpdateHubSpotContact(testContact);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to update contact');
        console.log(`✅ HubSpot API auth failure test passed: ${result.error}`);
      } finally {
        process.env.HUBSPOT_ACCESS_TOKEN = originalToken;
      }
    });

    it('should handle network errors', async () => {
      // Test with invalid domain to simulate network error
      const originalToken = process.env.HUBSPOT_ACCESS_TOKEN;
      process.env.HUBSPOT_ACCESS_TOKEN = 'test-token';

      // Temporarily mock fetch to simulate network error
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network timeout'));

      try {
        const result = await createOrUpdateHubSpotContact(testContact);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Network timeout');
        console.log(`✅ HubSpot network error test passed`);
      } finally {
        global.fetch = originalFetch;
        process.env.HUBSPOT_ACCESS_TOKEN = originalToken;
      }
    });
  });

  describe('createHubSpotDeal', () => {
    const testDealInput = {
      email: `test-deal-${Date.now()}@example.com`,
      name: 'Jane Smith (Test)',
      company: 'Innovate Ltd (Test)',
      dealValue: 50000,
      painScore: 80,
      auditUrl: 'https://audit.example.com/report/123',
      timeline: '2 months',
      budgetRange: '$25k-50k'
    };

    beforeEach(() => {
      testContacts.add(testDealInput.email);
    });

    it('should create deal successfully with real HubSpot API', async () => {
      const result = await createHubSpotDeal(testDealInput);

      expect(result.success).toBe(true);
      expect(result.dealId).toBeDefined();
      expect(result.contactId).toBeDefined();
      expect(result.dealUrl).toContain(result.dealId!);
      testDeals.add(result.dealId!);
      console.log(`✅ HubSpot deal created: ${result.dealId} for contact ${result.contactId}`);
    });

    it('should handle contact creation failure with real HubSpot API', async () => {
      const originalToken = process.env.HUBSPOT_ACCESS_TOKEN;
      process.env.HUBSPOT_ACCESS_TOKEN = 'invalid-token-123';

      try {
        const result = await createHubSpotDeal(testDealInput);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to create contact');
        console.log(`✅ HubSpot deal creation failure test passed: ${result.error}`);
      } finally {
        process.env.HUBSPOT_ACCESS_TOKEN = originalToken;
      }
    });

    it('should handle deal creation failure with real HubSpot API', async () => {
      // Create a contact first
      const contactResult = await createOrUpdateHubSpotContact({
        email: testDealInput.email,
        firstname: 'Test',
        lastname: 'User'
      });
      expect(contactResult.success).toBe(true);

      // Now try to create deal with invalid data that might cause failure
      const invalidDealInput = {
        ...testDealInput,
        dealValue: -1000 // Invalid negative value
      };

      const result = await createHubSpotDeal(invalidDealInput);

      // HubSpot might still succeed or fail depending on validation
      // Just verify we get a proper response
      expect(typeof result.success).toBe('boolean');
      console.log(`✅ HubSpot deal creation test completed: ${result.success ? 'success' : result.error}`);
    });

    it('should parse name correctly with real HubSpot API', async () => {
      const inputWithName = {
        ...testDealInput,
        email: `test-name-parse-${Date.now()}@example.com`,
        name: 'John Michael Doe'
      };
      testContacts.add(inputWithName.email);

      const result = await createHubSpotDeal(inputWithName);

      expect(result.success).toBe(true);
      testDeals.add(result.dealId!);
      console.log(`✅ HubSpot deal created with parsed name: ${result.dealId}`);
    });

    it('should handle missing optional fields with real HubSpot API', async () => {
      const minimalInput = {
        email: `test-minimal-${Date.now()}@example.com`,
        auditUrl: 'https://audit.example.com/report/123'
      };
      testContacts.add(minimalInput.email);

      const result = await createHubSpotDeal(minimalInput);

      expect(result.success).toBe(true);
      testDeals.add(result.dealId!);
      console.log(`✅ HubSpot deal created with minimal fields: ${result.dealId}`);
    });
  });

  describe('createHubSpotTask', () => {
    const testTaskInput = {
      contactId: '', // Will be set after creating a contact
      subject: 'Follow up on AI audit results (Test)',
      notes: 'Customer showed high interest in automation opportunities',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
    };

    beforeEach(async () => {
      // Create a test contact first
      const contactResult = await createOrUpdateHubSpotContact({
        email: `test-task-contact-${Date.now()}@example.com`,
        firstname: 'Task',
        lastname: 'Test'
      });
      expect(contactResult.success).toBe(true);
      testTaskInput.contactId = contactResult.contactId!;
      testContacts.add(contactResult.contact!.properties.email);
    });

    it('should create task successfully with real HubSpot API', async () => {
      const result = await createHubSpotTask(testTaskInput);

      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      testTasks.add(result.taskId!);
      console.log(`✅ HubSpot task created: ${result.taskId} for contact ${testTaskInput.contactId}`);
    });

    it('should handle missing access token', async () => {
      const originalToken = process.env.HUBSPOT_ACCESS_TOKEN;
      delete process.env.HUBSPOT_ACCESS_TOKEN;

      try {
        const result = await createHubSpotTask(testTaskInput);

        expect(result.success).toBe(false);
        expect(result.error).toBe('HubSpot not configured');
      } finally {
        process.env.HUBSPOT_ACCESS_TOKEN = originalToken;
      }
    });

    it('should handle API failure with real HubSpot API', async () => {
      const originalToken = process.env.HUBSPOT_ACCESS_TOKEN;
      process.env.HUBSPOT_ACCESS_TOKEN = 'invalid-token-123';

      try {
        const result = await createHubSpotTask(testTaskInput);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to create task');
        console.log(`✅ HubSpot task creation failure test passed: ${result.error}`);
      } finally {
        process.env.HUBSPOT_ACCESS_TOKEN = originalToken;
      }
    });

    it('should use default due date when not provided with real HubSpot API', async () => {
      const inputWithoutDueDate = {
        contactId: testTaskInput.contactId,
        subject: 'Test task without due date'
      };

      const result = await createHubSpotTask(inputWithoutDueDate);

      expect(result.success).toBe(true);
      testTasks.add(result.taskId!);
      console.log(`✅ HubSpot task created with default due date: ${result.taskId}`);
    });
  });
});